import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { IDiscoverer } from '@qap/engine';
import type { ModuleSpec, Module } from '@qap/shared';

export interface PlaywrightAdapterOptions {
  /** Si el navegador corre sin interfaz visible. Por defecto true. */
  headless?: boolean;
  /** URL base contra la cual se resuelven las rutas relativas de los modulos. */
  baseUrl?: string;
}

interface McpToolTextContent {
  type: 'text';
  text: string;
}

/**
 * Adaptador de descubrimiento (S4-001).
 * Implementa IDiscoverer interactuando con Playwright a traves del
 * protocolo MCP (Model Context Protocol): lanza el servidor oficial
 * @playwright/mcp como subproceso via stdio, y opera el navegador
 * exclusivamente mediante llamadas a herramientas MCP
 * (browser_navigate, browser_snapshot), sin usar playwright-core
 * de forma directa.
 */
export class PlaywrightAdapter implements IDiscoverer {
  constructor(private options: PlaywrightAdapterOptions = {}) {}

  async discover(spec: ModuleSpec): Promise<Module> {
    if (!spec.path) {
      throw new Error(`El modulo '${spec.name}' no define una ruta (path) para explorar`);
    }

    const targetUrl = this.resolveUrl(spec.path);

    const transport = new StdioClientTransport({
      command: 'npx',
      args: [
        '@playwright/mcp@latest',
        ...(this.options.headless === false ? [] : ['--headless']),
      ],
    });

    const client = new Client({ name: 'qap-playwright-adapter', version: '1.0.0' }, { capabilities: {} });

    try {
      await client.connect(transport);

      await this.callTool(client, 'browser_navigate', { url: targetUrl });

      const snapshotText = await this.callTool(client, 'browser_snapshot', {});
      const description = this.extractTitle(snapshotText);
      const discoveredRoutes = this.extractRoutesFromSnapshot(snapshotText);

      return {
        name: spec.name,
        path: spec.path,
        description,
        tags: spec.tags ?? [],
        cases: [],
        context: {
          discovered_routes: discoveredRoutes,
          discovered_at: new Date().toISOString(),
        },
      };
    } finally {
      await client.close().catch(() => {});
    }
  }

  /**
   * Invoca una herramienta MCP expuesta por el servidor @playwright/mcp
   * y devuelve el contenido de texto de la respuesta.
   */
  private async callTool(
    client: Client,
    name: string,
    args: Record<string, unknown>
  ): Promise<string> {
    const result = await client.callTool({ name, arguments: args });
    const content = result.content as McpToolTextContent[] | undefined;
    const textBlock = content?.find((c) => c.type === 'text');
    return textBlock?.text ?? '';
  }

  private resolveUrl(path: string): string {
    if (/^https?:\/\//.test(path)) return path;
    if (!this.options.baseUrl) return path;
    return new URL(path, this.options.baseUrl).toString();
  }

  /**
   * El snapshot de accesibilidad de @playwright/mcp incluye el titulo
   * de la pagina en su primera linea, con el formato: "- Page Title: X"
   * o similar segun la version del servidor.
   */
  private extractTitle(snapshotText: string): string {
    const match = snapshotText.match(/Page (?:Title|title):\s*(.+)/);
    return match ? match[1].trim() : 'Sin titulo';
  }

  /**
   * Extrae rutas de enlaces (href) presentes en el snapshot de accesibilidad.
   */
   private extractRoutesFromSnapshot(snapshotText: string): string[] {
    const urlMatches = snapshotText.matchAll(/\/url:\s*(\S+)/g);
    const routes = Array.from(urlMatches, (m) => m[1]);
    return Array.from(new Set(routes));
  }
}