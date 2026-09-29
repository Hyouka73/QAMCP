import { startMcpServer } from '@qap/mcp';

/**
 * Inicia el servidor MCP de QAP sobre transporte Stdio para comunicación con Cursor, Claude Desktop y Antigravity.
 */
export async function handleMcp(): Promise<void> {
  await startMcpServer();
}
