import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

export const TEST_CREDENTIALS = {
  username: 'test_user',
  password: 'test_password_123',
};

export const AUTH_COOKIE_NAME = 'auth_session';
export const AUTH_COOKIE_VALID_VALUE = 'valid_test_session_token';
export const AUTH_COOKIE_EXPIRED_VALUE = 'expired_test_session_token';

export interface AuthFixtureServerInstance {
  server: Server;
  baseUrl: string;
  close: () => Promise<void>;
}

/**
 * Servidor HTTP local con puerto efímero para pruebas deterministas
 * de detección de login, auth_wall, guards cliente y manejo de sesión (P4.4).
 * Completamente agnóstico, sin referencias a aplicaciones de terceros.
 */
export function startAuthFixtureServer(): Promise<AuthFixtureServerInstance> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
      const pathname = url.pathname;
      const cookieHeader = req.headers.cookie || '';
      const hasValidSession = cookieHeader.includes(`${AUTH_COOKIE_NAME}=${AUTH_COOKIE_VALID_VALUE}`);
      const hasExpiredSession = cookieHeader.includes(`${AUTH_COOKIE_NAME}=${AUTH_COOKIE_EXPIRED_VALUE}`);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');

      // 1. Ruta pública (app, no requiere autenticación)
      if (pathname === '/public') {
        res.writeHead(200);
        res.end(`
          <!DOCTYPE html>
          <html>
            <head><title>Página Pública</title></head>
            <body>
              <main>
                <h1>Página Pública</h1>
                <p>Contenido abierto a cualquier visitante.</p>
                <a href="/public/info">Más información</a>
                <button type="button" id="btn-info">Ver detalles</button>
              </main>
            </body>
          </html>
        `);
        return;
      }

      // 2. Ruta de login (/login)
      if (pathname === '/login') {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            const params = new URLSearchParams(body);
            const user = params.get('username');
            const pass = params.get('password');

            if (user === TEST_CREDENTIALS.username && pass === TEST_CREDENTIALS.password) {
              res.writeHead(302, {
                'Set-Cookie': `${AUTH_COOKIE_NAME}=${AUTH_COOKIE_VALID_VALUE}; Path=/; HttpOnly`,
                Location: '/dashboard',
              });
              res.end();
            } else {
              res.writeHead(401);
              res.end(`
                <!DOCTYPE html>
                <html>
                  <body>
                    <p id="error-msg">Credenciales incorrectas</p>
                    <form action="/login" method="POST">
                      <input name="username" type="text" />
                      <input name="password" type="password" />
                      <button type="submit">Iniciar Sesión</button>
                    </form>
                  </body>
                </html>
              `);
            }
          });
          return;
        }

        res.writeHead(200);
        res.end(`
          <!DOCTYPE html>
          <html>
            <head><title>Acceso de Usuario</title></head>
            <body>
              <main>
                <h1>Iniciar Sesión</h1>
                <form action="/login" method="POST" id="form-login">
                  <label for="inp-user">Usuario</label>
                  <input id="inp-user" name="username" type="text" placeholder="Usuario o email" required />
                  <label for="inp-pass">Contraseña</label>
                  <input id="inp-pass" name="password" type="password" placeholder="Contraseña de acceso" required />
                  <button type="submit" id="btn-submit">Iniciar Sesión</button>
                </form>
              </main>
            </body>
          </html>
        `);
        return;
      }

      // 3. Ruta protegida con redirección 302 HTTP directa a /login
      if (pathname === '/protected' || pathname === '/protected-redirect') {
        if (!hasValidSession || hasExpiredSession) {
          res.writeHead(302, { Location: '/login' });
          res.end();
          return;
        }

        res.writeHead(200);
        res.end(`
          <!DOCTYPE html>
          <html>
            <head><title>Zona Protegida HTTP 302</title></head>
            <body>
              <main>
                <h1>Zona Protegida</h1>
                <p>Acceso concedido mediante cookie de sesión válida.</p>
                <a href="/dashboard">Ir al Dashboard</a>
              </main>
            </body>
          </html>
        `);
        return;
      }

      // 4. Ruta protegida con guard del lado del cliente (SPA script redirect a /login)
      if (pathname === '/protected-client-guard') {
        if (hasValidSession && !hasExpiredSession) {
          res.writeHead(200);
          res.end(`
            <!DOCTYPE html>
            <html>
              <head><title>Zona Protegida Guard Cliente</title></head>
              <body>
                <main>
                  <h1>Zona Protegida Cliente</h1>
                  <p>Sesión activa confirmada.</p>
                </main>
              </body>
            </html>
          `);
          return;
        }

        res.writeHead(200);
        res.end(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Verificando Acceso</title>
              <script>
                setTimeout(() => {
                  window.location.href = '/login';
                }, 200);
              </script>
            </head>
            <body>
              <div id="root">Verificando sesión...</div>
            </body>
          </html>
        `);
        return;
      }

      // Endpoint de verificación de sesión con retraso (~800ms) para probar guards asíncronos (C3c)
      if (pathname === '/api/session-check') {
        res.setHeader('Content-Type', 'application/json');
        setTimeout(() => {
          res.writeHead(200);
          res.end(JSON.stringify({ authenticated: hasValidSession && !hasExpiredSession }));
        }, 800);
        return;
      }

      // 4b. Ruta protegida con guard del cliente que consulta endpoint asíncrono (~1200ms total)
      if (pathname === '/protected-delayed-client-guard') {
        if (hasValidSession && !hasExpiredSession) {
          res.writeHead(200);
          res.end(`
            <!DOCTYPE html>
            <html>
              <head><title>Zona Protegida Guard Lento</title></head>
              <body>
                <main>
                  <h1>Zona Protegida Lenta</h1>
                  <p>Sesión activa confirmada tras consulta asíncrona.</p>
                </main>
              </body>
            </html>
          `);
          return;
        }

        res.writeHead(200);
        res.end(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Verificando Sesión Asíncrona</title>
              <script>
                fetch('/api/session-check')
                  .then(function(r) { return r.json(); })
                  .then(function(data) {
                    if (!data.authenticated) {
                      setTimeout(function() {
                        window.location.href = '/login';
                      }, 400);
                    }
                  });
              </script>
            </head>
            <body>
              <div id="root">
                <h1>Cargando aplicación...</h1>
                <p>Verificando estado de sesión con el servidor...</p>
              </div>
            </body>
          </html>
        `);
        return;
      }

      // 4c. Ruta donde la URL cambia durante la extracción
      if (pathname === '/protected-redirect-during-extraction') {
        res.writeHead(200);
        res.end(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Página con Redirección Tardía</title>
            </head>
            <body>
              <main>
                <h1>Contenido Inicial</h1>
                <p>Texto inicial antes del guard tardío.</p>
                <form id="temp-form">
                  <input name="temp" type="text" />
                  <button type="submit">Enviar</button>
                </form>
              </main>
              <script>
                var f = document.getElementById('temp-form');
                if (f) {
                  var origQuery = f.querySelector;
                  f.querySelector = function(sel) {
                    window.location.href = '/login';
                    return origQuery.apply(this, arguments);
                  };
                }
              </script>
            </body>
          </html>
        `);
        return;
      }

      // 5. Ruta protegida con login embebido en el mismo pathname
      if (pathname === '/embedded-login' || pathname === '/protected-embedded-login') {
        if (hasValidSession && !hasExpiredSession) {
          res.writeHead(200);
          res.end(`
            <!DOCTYPE html>
            <html>
              <head><title>Módulo con Login Embebido Superado</title></head>
              <body>
                <main>
                  <h1>Contenido Protegido Embebido</h1>
                  <p>Bienvenido al módulo privado.</p>
                </main>
              </body>
            </html>
          `);
          return;
        }

        res.writeHead(200);
        res.end(`
          <!DOCTYPE html>
          <html>
            <head><title>Autenticación Requerida</title></head>
            <body>
              <main>
                <h1>Acceso Requerido</h1>
                <form action="/login" method="POST" id="form-auth-embedded">
                  <input name="username" type="text" placeholder="Correo electrónico" />
                  <input name="password" type="password" placeholder="Clave" />
                  <button type="submit">Ingresar</button>
                </form>
              </main>
            </body>
          </html>
        `);
        return;
      }

      // 6. Ruta protegida que responde 401 Unauthorized
      if (pathname === '/protected-401') {
        if (hasValidSession && !hasExpiredSession) {
          res.writeHead(200);
          res.end(`
            <!DOCTYPE html>
            <html>
              <head><title>Zona 401 Autorizada</title></head>
              <body>
                <main><h1>Acceso Autorizado 401</h1></main>
              </body>
            </html>
          `);
          return;
        }

        res.writeHead(401, {
          'Content-Type': 'text/plain; charset=utf-8',
        });
        res.end('Acceso no autorizado: credenciales o sesión requeridas.');
        return;
      }

      // 7. Dashboard autenticado
      if (pathname === '/dashboard') {
        if (!hasValidSession || hasExpiredSession) {
          res.writeHead(302, { Location: '/login' });
          res.end();
          return;
        }

        res.writeHead(200);
        res.end(`
          <!DOCTYPE html>
          <html>
            <head><title>Dashboard de Aplicación</title></head>
            <body>
              <main>
                <h1>Panel de Control</h1>
                <p>Bienvenido al área autenticada.</p>
                <a href="/public">Pública</a>
                <button type="button" id="btn-action">Ejecutar Acción</button>
              </main>
            </body>
          </html>
        `);
        return;
      }

      // 404 por defecto
      res.writeHead(404);
      res.end('Ruta no encontrada');
    });

    server.listen(0, '127.0.0.1', () => {
      const address = server.address() as AddressInfo;
      const baseUrl = `http://127.0.0.1:${address.port}`;
      resolve({
        server,
        baseUrl,
        close: () =>
          new Promise<void>((resClose) => {
            server.close(() => resClose());
          }),
      });
    });

    server.on('error', (err) => reject(err));
  });
}
