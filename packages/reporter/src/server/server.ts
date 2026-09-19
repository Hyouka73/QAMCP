import { createServer, type IncomingMessage, type ServerResponse, type Server } from 'node:http';
import { existsSync, createReadStream, statSync } from 'node:fs';
import { join, normalize, extname, isAbsolute } from 'node:path';

import type { IStorage } from '@qap/engine';

import { buildKnowledgeGraph } from '../graph/graph-builder.js';
import { getTemplateHtml } from '../template/index.js';

export interface ViewerServerOptions {
  storage: IStorage;
  port?: number;
  host?: string;
  silent?: boolean;
}

export interface ViewerServerInstance {
  server: Server;
  port: number;
  host: string;
  url: string;
  close: () => Promise<void>;
}

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

function getMimeType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * Crea e inicia el servidor HTTP nativo para el visor interactivo de QAP.
 */
export function startViewerServer(options: ViewerServerOptions): Promise<ViewerServerInstance> {
  const storage = options.storage;
  const preferredPort = options.port ?? 9280;
  const host = options.host ?? 'localhost';
  const silent = options.silent ?? false;

  const requestListener = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    // Manejo de CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      res.end('Method Not Allowed');
      return;
    }

    const rawUrl = req.url || '/';
    const parsedUrl = new URL(rawUrl, `http://${host}:${preferredPort}`);
    const pathname = decodeURIComponent(parsedUrl.pathname);

    // 1. Ruta principal: Interfaz Web
    if (pathname === '/' || pathname === '/index.html') {
      const html = getTemplateHtml();
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
      });
      res.end(html);
      return;
    }

    // 2. Ruta API: Knowledge Graph Payload en JSON
    if (pathname === '/api/graph') {
      try {
        const payload = await buildKnowledgeGraph(storage);
        const jsonContent = JSON.stringify(payload, null, 2);
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache',
        });
        res.end(jsonContent);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Error al generar grafo', details: errorMessage }));
      }
      return;
    }

    // 3. Ruta Estática: Evidencias y capturas de pantalla bajo /artifacts/
    if (pathname.startsWith('/artifacts/')) {
      const relativeArtifactPath = pathname.replace(/^\/artifacts\/?/, '');
      
      // Protección contra Path Traversal
      const safePath = normalize(relativeArtifactPath).replace(/^(\.\.(\/|\\|$))+/, '');
      if (!safePath || safePath.startsWith('..')) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
      }

      let projectRoot: string;
      try {
        projectRoot = storage.getProjectRoot();
      } catch {
        projectRoot = process.cwd();
      }

      // Buscar en .qa/executions, .qa/cache/discover o .qa
      const candidateRoots = [
        join(projectRoot, '.qa', 'executions'),
        join(projectRoot, '.qa', 'cache', 'discover'),
        join(projectRoot, '.qa'),
      ];

      let targetFile: string | null = null;
      for (const rootDir of candidateRoots) {
        const candidate = isAbsolute(safePath) ? safePath : join(rootDir, safePath);
        if (existsSync(candidate)) {
          try {
            const stat = statSync(candidate);
            if (stat.isFile()) {
              targetFile = candidate;
              break;
            }
          } catch {
            // Ignorar error de acceso
          }
        }
      }

      if (targetFile) {
        const mime = getMimeType(targetFile);
        res.writeHead(200, {
          'Content-Type': mime,
          'Cache-Control': 'public, max-age=3600',
        });
        if (req.method === 'HEAD') {
          res.end();
          return;
        }
        createReadStream(targetFile).pipe(res);
        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Artifact Not Found');
      return;
    }

    // Cualquier otra ruta no contemplada
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  };

  return new Promise((resolve, reject) => {
    let currentPort = preferredPort;
    let hasRetried = false;

    const server = createServer((req, res) => {
      void requestListener(req, res);
    });

    const tryListen = (portToTry: number): void => {
      server.listen(portToTry, host);
    };

    server.on('listening', () => {
      const addr = server.address();
      const actualPort = typeof addr === 'object' && addr !== null ? addr.port : currentPort;
      const url = `http://${host}:${actualPort}`;

      if (!silent) {
        console.log(`✨ QAP Knowledge Graph & Memory Viewer activo en: ${url}`);
        console.log('Pulse Ctrl+C para detener el servidor.');
      }

      const instance: ViewerServerInstance = {
        server,
        port: actualPort,
        host,
        url,
        close: () => {
          return new Promise<void>((closeResolve, closeReject) => {
            server.close((err) => {
              if (err) closeReject(err);
              else closeResolve();
            });
          });
        },
      };

      resolve(instance);
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        if (!hasRetried) {
          hasRetried = true;
          const fallbackPort = currentPort === 9280 ? 9281 : currentPort + 1;
          if (!silent) {
            console.warn(`Puerto ${currentPort} en uso. Intentando en ${fallbackPort}...`);
          }
          currentPort = fallbackPort;
          tryListen(fallbackPort);
          return;
        }
        if (!silent) {
          console.error(`Puerto ${currentPort} en uso y reintento fallido.`);
        }
      }
      reject(err);
    });

    tryListen(currentPort);
  });
}
