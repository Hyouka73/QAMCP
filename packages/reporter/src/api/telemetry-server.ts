import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import { URL } from 'node:url';

import { QapDatabase } from '../persistence/sqlite-client.js';
import { PruningEngine } from '../pruning/pruning-engine.js';
import type { RunFilterOptions } from '../types.js';

export interface TelemetryServerOptions {
  runtimeDir: string;
  memoryOnly?: boolean;
}

/**
 * Lee el cuerpo (JSON) de una solicitud entrante.
 */
async function parseJsonBody<T = unknown>(req: IncomingMessage): Promise<T | null> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body.trim()) {
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(body) as T);
      } catch {
        resolve(null);
      }
    });
    req.on('error', () => resolve(null));
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

/**
 * Servidor HTTP ligero para la API Local de Telemetría (QAP v3.0 Fase 2).
 */
export class TelemetryServer {
  private server: http.Server;
  private db: QapDatabase;
  private pruningEngine: PruningEngine;
  private runtimeDir: string;

  constructor(options: TelemetryServerOptions) {
    this.runtimeDir = options.runtimeDir;
    this.db = new QapDatabase(options.runtimeDir, options.memoryOnly ?? false);
    this.pruningEngine = new PruningEngine(this.db, options.runtimeDir);

    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res).catch((err) => {
        sendJson(res, 500, {
          success: false,
          error: err instanceof Error ? err.message : 'Internal Server Error',
        });
      });
    });
  }

  getDatabase(): QapDatabase {
    return this.db;
  }

  getRuntimeDir(): string {
    return this.runtimeDir;
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;
    const method = req.method?.toUpperCase();

    // 1. GET /api/runs (listado con filtros)
    if (pathname === '/api/runs' && method === 'GET') {
      const filters: RunFilterOptions = {};
      const flowId = parsedUrl.searchParams.get('flowId');
      if (flowId) filters.flowId = flowId;

      const status = parsedUrl.searchParams.get('status');
      if (status === 'passed' || status === 'failed' || status === 'partial') {
        filters.status = status;
      }

      const limit = parsedUrl.searchParams.get('limit');
      if (limit) filters.limit = parseInt(limit, 10);

      const offset = parsedUrl.searchParams.get('offset');
      if (offset) filters.offset = parseInt(offset, 10);

      const runs = this.db.listRuns(filters);
      sendJson(res, 200, { success: true, count: runs.length, runs });
      return;
    }

    // 2. POST /api/runs/prune (ejecución de recolección de basura)
    if (pathname === '/api/runs/prune' && method === 'POST') {
      const body = (await parseJsonBody<Record<string, unknown>>(req)) || {};
      const result = this.pruningEngine.prune(body);
      sendJson(res, 200, { success: true, result });
      return;
    }

    // 3. Rutas paramétricas sobre /api/runs/:runId
    const runMatch = pathname.match(/^\/api\/runs\/([^/]+)$/);
    if (runMatch) {
      const runId = decodeURIComponent(runMatch[1]);

      if (method === 'GET') {
        const run = this.db.getRun(runId);
        if (!run) {
          sendJson(res, 404, { success: false, error: `Run no encontrado: ${runId}` });
          return;
        }
        sendJson(res, 200, { success: true, run });
        return;
      }

      if (method === 'DELETE') {
        const deleted = this.db.deleteRun(runId);
        if (!deleted) {
          sendJson(res, 404, { success: false, error: `Run no encontrado: ${runId}` });
          return;
        }
        sendJson(res, 200, { success: true, deleted: true, runId });
        return;
      }
    }

    // 4. PATCH /api/runs/:runId/pin
    const pinMatch = pathname.match(/^\/api\/runs\/([^/]+)\/pin$/);
    if (pinMatch && method === 'PATCH') {
      const runId = decodeURIComponent(pinMatch[1]);
      const body = await parseJsonBody<{ pinned?: boolean }>(req);
      const pinned = body?.pinned ?? true;

      const updated = this.db.pinRun(runId, pinned);
      if (!updated) {
        sendJson(res, 404, { success: false, error: `Run no encontrado: ${runId}` });
        return;
      }
      sendJson(res, 200, { success: true, runId, pinned });
      return;
    }

    // Ruta no encontrada
    sendJson(res, 404, { success: false, error: `Ruta no encontrada: ${pathname}` });
  }

  async listen(port = 0): Promise<number> {
    return new Promise((resolve) => {
      this.server.listen(port, () => {
        const address = this.server.address();
        const actualPort = typeof address === 'object' && address ? address.port : port;
        resolve(actualPort);
      });
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.close((err) => {
        try {
          this.db.close();
        } catch {
          // Continuar
        }
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
