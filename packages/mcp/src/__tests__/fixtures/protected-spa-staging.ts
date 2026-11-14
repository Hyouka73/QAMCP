import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';

export interface ProtectedSpaStagingOptions {
  readonly includeExternalLink?: boolean;
  readonly secondaryOrdersPage?: boolean;
}

export interface ProtectedSpaStagingController {
  readonly origin: string;
  readonly mutatingRequests: Array<{ method: string; url: string }>;
  readonly visitedRequests: Array<{ method: string; url: string; tenant?: string }>;
  setSessionExpired(expired: boolean): void;
  setRequireTenant(requireTenant: boolean, validTenants?: readonly string[]): void;
  setOrdersVariant(variant: 'v1' | 'v2' | 'missing'): void;
  close(): Promise<void>;
}

function parseCookies(req: IncomingMessage): Record<string, string> {
  const header = req.headers.cookie ?? '';
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}

function sendHtml(res: ServerResponse, status: number, html: string): void {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

export async function startProtectedSpaStaging(
  options: ProtectedSpaStagingOptions = {},
): Promise<ProtectedSpaStagingController> {
  const activeTokens = new Map<string, string>();
  let sessionExpired = false;
  let requireTenant = false;
  let allowedTenants = new Set<string>(['tenant-acme', 'tenant-beta', 'tenant-a', 'tenant-b']);
  let ordersVariant: 'v1' | 'v2' | 'missing' = 'v1';
  const mutatingRequests: Array<{ method: string; url: string }> = [];
  const visitedRequests: Array<{ method: string; url: string; tenant?: string }> = [];

  const isAuthorizedSession = (req: IncomingMessage): { ok: boolean; tenant?: string } => {
    if (sessionExpired) return { ok: false };
    const cookies = parseCookies(req);
    const token = cookies.qap_session;
    if (!token || !activeTokens.has(token)) return { ok: false };
    const tokenTenant = activeTokens.get(token);
    const tenantHeader = typeof req.headers['x-tenant-id'] === 'string'
      ? req.headers['x-tenant-id']
      : (cookies.qap_tenant ?? tokenTenant);
    if (requireTenant && (!tenantHeader || !allowedTenants.has(tenantHeader))) {
      return { ok: false };
    }
    return { ok: true, tenant: tenantHeader };
  };

  const handleRequest = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const method = (req.method ?? 'GET').toUpperCase();
    const parsedUrl = new URL(req.url ?? '/', 'http://127.0.0.1');
    const pathname = parsedUrl.pathname;

    // Record any non-GET request outside explicit /auth/login
    if (method !== 'GET' && method !== 'HEAD' && pathname !== '/auth/login') {
      mutatingRequests.push({ method, url: parsedUrl.pathname + parsedUrl.search });
      sendJson(res, 405, { error: 'Mutation forbidden during discovery', method, pathname });
      return;
    }

    visitedRequests.push({
      method,
      url: parsedUrl.pathname + parsedUrl.search,
      tenant: typeof req.headers['x-tenant-id'] === 'string' ? req.headers['x-tenant-id'] : undefined,
    });

    if (pathname === '/login' && method === 'GET') {
      const existingSession = isAuthorizedSession(req);
      if (existingSession.ok) {
        res.writeHead(302, { Location: '/app' });
        res.end();
        return;
      }
      sendHtml(
        res,
        200,
        `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><title>Acceso Staging</title></head>
<body>
  <main>
    <h1>Iniciar sesión en Portal QA</h1>
    <form method="POST" action="/auth/login">
      <label for="username">Usuario</label>
      <input id="username" name="username" type="text" required />
      <label for="password">Contraseña</label>
      <input id="password" name="password" type="password" required />
      <button type="submit">Entrar</button>
    </form>
  </main>
</body>
</html>`,
      );
      return;
    }

    if (pathname === '/auth/login' && method === 'POST') {
      const rawBody = await readBody(req);
      let username = '';
      let password = '';
      let tenant = 'tenant-acme';
      if ((req.headers['content-type'] ?? '').includes('application/json')) {
        try {
          const parsed = JSON.parse(rawBody) as Record<string, unknown>;
          username = typeof parsed.username === 'string' ? parsed.username : '';
          password = typeof parsed.password === 'string' ? parsed.password : '';
          tenant = typeof parsed.tenant === 'string' ? parsed.tenant : tenant;
        } catch {
          // ignore
        }
      } else {
        const params = new URLSearchParams(rawBody);
        username = params.get('username') ?? '';
        password = params.get('password') ?? '';
        tenant = params.get('tenant') ?? tenant;
      }

      const resolvedLoginTenant =
        username === 'qa.tenant_a'
          ? 'tenant-a'
          : username === 'qa.tenant_b'
            ? 'tenant-b'
            : tenant;
      const validCredentials =
        (username === 'qa.operator' && password === 'StagingPass#2026') ||
        (username === 'qa.tenant_a' && (password === 'TenantAPass#2026' || password === 'StagingPass#2026')) ||
        (username === 'qa.tenant_b' && (password === 'TenantBPass#2026' || password === 'StagingPass#2026'));
      if (validCredentials) {
        const token = `tok_${randomUUID()}`;
        activeTokens.set(token, resolvedLoginTenant);
        sessionExpired = false;
        res.writeHead(302, {
          'Set-Cookie': [
            `qap_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax`,
            `qap_tenant=${encodeURIComponent(resolvedLoginTenant)}; Path=/; SameSite=Lax`,
          ],
          Location: '/app',
        });
        res.end();
        return;
      }
      sendHtml(res, 401, '<html><body><h1>Credenciales inválidas</h1></body></html>');
      return;
    }

    if (pathname === '/api/orders' && method === 'GET') {
      const session = isAuthorizedSession(req);
      if (!session.ok) {
        sendJson(res, 401, { error: 'auth_session_invalid' });
        return;
      }
      const effectiveTenant = session.tenant ?? 'tenant-acme';
      if (effectiveTenant === 'tenant-a') {
        sendJson(res, 200, {
          tenant: 'tenant-a',
          actionLabel: 'Exportar tenant A',
          structuralControlTag: 'help-link',
          orders: [
            { id: 'ORD-A-101', customer: 'Alpha Corp', status: 'pendiente' },
          ],
        });
        return;
      }
      if (effectiveTenant === 'tenant-b') {
        sendJson(res, 200, {
          tenant: 'tenant-b',
          actionLabel: 'Auditar tenant B',
          structuralControlTag: 'audit-form',
          orders: [
            { id: 'ORD-B-202', customer: 'Beta SA', status: 'auditado' },
          ],
        });
        return;
      }
      sendJson(res, 200, {
        tenant: effectiveTenant,
        orders: [
          { id: 'ORD-101', customer: 'Norte SA', status: 'pendiente' },
          { id: 'ORD-102', customer: 'Sur Ltda', status: 'aprobado' },
        ],
      });
      return;
    }

    if (pathname === '/api/reports' && method === 'GET') {
      const session = isAuthorizedSession(req);
      if (!session.ok) {
        sendJson(res, 401, { error: 'auth_session_invalid' });
        return;
      }
      sendJson(res, 200, { summary: 'Reporte consolidado', total: 2 });
      return;
    }

    if (options.secondaryOrdersPage && pathname === '/app/orders') {
      const session = isAuthorizedSession(req);
      if (!session.ok) {
        sendJson(res, 401, { error: 'session_expired_or_missing' });
        return;
      }
      if (ordersVariant === 'missing') {
        sendHtml(res, 404, '<html><body><h1>Pedidos no disponibles</h1></body></html>');
        return;
      }
      const variantHeading = ordersVariant === 'v2' ? 'Detalle de Pedidos V2' : 'Detalle de Pedidos V1';
      const variantButton = ordersVariant === 'v2' ? 'Recalcular lotes' : 'Ver historial';
      const variantExtraForm = ordersVariant === 'v2'
        ? '\n    <form id="orders-v2-form" action="/api/orders" method="GET"><input id="orders-v2-q" type="search" required aria-label="buscar" /><button type="submit" aria-label="buscar">Buscar</button></form>'
        : '';
      sendHtml(
        res,
        200,
        `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><title>Pedidos SPA</title></head>
<body>
  <nav><a href="/app">Resumen</a></nav>
  <main id="orders-detail">
    <h1>${variantHeading} (${session.tenant ?? 'tenant-acme'})</h1>
    <button type="button" id="orders-variant-btn">${variantButton}</button>${variantExtraForm}
  </main>
</body>
</html>`,
      );
      return;
    }

    if (pathname === '/app' || pathname === '/app/orders' || pathname === '/dashboard') {
      const session = isAuthorizedSession(req);
      if (!session.ok) {
        sendJson(res, 401, { error: 'session_expired_or_missing' });
        return;
      }
      const externalNav = options.includeExternalLink
        ? '\n    <a href="https://external-forbidden.invalid/callback?token=secret-123">Ayuda externa</a>'
        : '';
      sendHtml(
        res,
        200,
        `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><title>Portal SPA Protegido</title></head>
<body>
  <nav>
    <a href="/app">Resumen</a>
    <a href="/app/orders">Pedidos</a>${externalNav}
  </nav>
  <main id="spa-root">Cargando shell SPA...</main>
  <script>
    (async function renderSpa() {
      const resp = await fetch('/api/orders', { credentials: 'include' });
      const root = document.getElementById('spa-root');
      if (!resp.ok) {
        root.innerHTML = '<section data-state="unauthorized"><h1>Sesión expirada</h1></section>';
        return;
      }
      const data = await resp.json();
      const extraBtn = data.actionLabel ? ('  <button type="button" id="tenant-action-btn">' + data.actionLabel + '</button>') : '';
      const extraTenantDom = data.structuralControlTag === 'audit-form'
        ? '  <form id="tenant-audit-form" action="/api/orders" method="GET"><input id="audit-note" type="text" required /><button type="submit" aria-label="contact">Contacto Auditoría</button></form>'
        : (data.structuralControlTag === 'help-link'
          ? '  <a href="/app/orders" aria-label="help">Ayuda Tenant A</a>'
          : '');
      root.innerHTML = [
        '<section id="spa-shell" data-spa-ready="true">',
        '  <h1>Panel de Pedidos (' + data.tenant + ')</h1>',
        '  <form id="filter-orders-form" action="/api/orders" method="GET">',
        '    <label for="order-search">Buscar pedido</label>',
        '    <input id="order-search" name="q" type="search" required placeholder="ORD-101" />',
        '    <button type="submit">Filtrar</button>',
        '  </form>',
        extraBtn,
        extraTenantDom,
        '  <ul id="orders-list">' + data.orders.map(function (o) {
          return '<li>' + o.id + ' - ' + o.customer + '</li>';
        }).join('') + '</ul>',
        '  <button type="button" id="danger-delete-btn" onclick="fetch(\\'/api/orders/delete\\', { method: \\'DELETE\\' })">Eliminar todo</button>',
        '</section>'
      ].join('');
    })();
  </script>
</body>
</html>`,
      );
      return;
    }

    sendHtml(res, 404, '<html><body><h1>No encontrado</h1></body></html>');
  };

  const server = createServer((req, res) => {
    void handleRequest(req, res);
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;

  return {
    origin: `http://127.0.0.1:${port}`,
    mutatingRequests,
    visitedRequests,
    setSessionExpired(expired: boolean) {
      sessionExpired = expired;
      if (expired) {
        activeTokens.clear();
      }
    },
    setRequireTenant(nextRequire: boolean, validTenants?: readonly string[]) {
      requireTenant = nextRequire;
      if (validTenants) {
        allowedTenants = new Set(validTenants);
      }
    },
    setOrdersVariant(variant: 'v1' | 'v2' | 'missing') {
      ordersVariant = variant;
    },
    close() {
      return new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}
