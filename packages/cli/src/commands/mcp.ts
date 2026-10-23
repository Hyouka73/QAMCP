import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { registerMcpProject, startMcpServer } from '@qap/mcp';

const VALID_CLIENTS = ['cursor', 'claude', 'all'] as const;
type McpClient = (typeof VALID_CLIENTS)[number];

/**
 * Inicia el servidor MCP de QAP sobre transporte Stdio para comunicación con
 * Cursor, Claude Desktop y Antigravity. Con --project opera sobre ese directorio.
 */
export async function handleMcp(options: { project?: string } = {}): Promise<void> {
  if (options.project) {
    const projectDir = resolve(options.project);
    if (!existsSync(projectDir)) {
      console.error(`El directorio del proyecto no existe: ${projectDir}`);
      process.exit(66); // POSIX EX_NOINPUT
    }
    process.chdir(projectDir);
  }
  await startMcpServer();
}

/**
 * Registra dinámicamente el proyecto en Cursor y/o Claude Desktop.
 */
export async function handleMcpRegister(options: { client?: string; dryRun?: boolean }): Promise<void> {
  const client = options.client ?? 'all';
  if (!VALID_CLIENTS.includes(client as McpClient)) {
    console.error(`Cliente inválido '${client}'. Usa uno de: ${VALID_CLIENTS.join(', ')}.`);
    process.exitCode = 1;
    return;
  }
  await registerMcpProject({ client: client as McpClient, dryRun: options.dryRun === true });
}