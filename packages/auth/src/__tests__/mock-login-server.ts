import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

const LOGIN_HTML = `<!DOCTYPE html>
<html>
<body>
  <form id="login-form">
    <input type="text" name="username" />
    <input type="password" name="password" />
    <button type="submit">Entrar</button>
  </form>
  <script>
    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.querySelector('[name="username"]').value;
      const password = document.querySelector('[name="password"]').value;
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        document.cookie = 'session=mock-authenticated-token; path=/';
        window.location.href = '/dashboard';
      }
    });
  </script>
</body>
</html>`;

const DASHBOARD_HTML = `<!DOCTYPE html><html><body><h1>Dashboard</h1></body></html>`;

export interface MockLoginServer {
  url: string;
  close: () => Promise<void>;
}

/**
 * Levanta un servidor HTTP local que simula un flujo de login basico:
 * GET /login -> formulario
 * POST /api/login -> valida credenciales fijas y responde 200
 * GET /dashboard -> pagina destino tras login exitoso
 */
export function startMockLoginServer(
  expectedUsername: string,
  expectedPassword: string
): Promise<MockLoginServer> {
  return new Promise((resolve) => {
    const server: Server = createServer((req, res) => {
      if (req.method === 'GET' && req.url === '/login') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(LOGIN_HTML);
        return;
      }

      if (req.method === 'GET' && req.url === '/dashboard') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(DASHBOARD_HTML);
        return;
      }

      if (req.method === 'POST' && req.url === '/api/login') {
        let body = '';
        req.on('data', (chunk: Buffer) => (body += chunk.toString()));
        req.on('end', () => {
          const { username, password } = JSON.parse(body) as {
            username: string;
            password: string;
          };
          if (username === expectedUsername && password === expectedPassword) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
          } else {
            res.writeHead(401);
            res.end();
          }
        });
        return;
      }

      res.writeHead(404);
      res.end();
    });

    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo;
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise((res) => server.close(() => res())),
      });
    });
  });
}