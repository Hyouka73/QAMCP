import { mkdir, readFile, writeFile } from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import yaml from 'yaml';

export interface RegisterMcpOptions {
  client?: 'cursor' | 'claude' | 'all';
  dryRun?: boolean;
}

interface McpServerEntry {
  command: string;
  args: string[];
}

interface McpClientConfig {
  mcpServers?: Record<string, unknown>;
  [key: string]: unknown;
}

function getCursorConfigPath(): string {
  return path.join(os.homedir(), '.cursor', 'mcp.json');
}

function getClaudeConfigPath(): string {
  const homedir = os.homedir();
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA || path.join(homedir, 'AppData', 'Roaming');
    return path.join(appData, 'Claude', 'claude_desktop_config.json');
  } else if (process.platform === 'darwin') {
    return path.join(homedir, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  } else {
    const configHome = process.env.XDG_CONFIG_HOME || path.join(homedir, '.config');
    return path.join(configHome, 'Claude', 'claude_desktop_config.json');
  }
}

async function readTextIfExists(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw err;
  }
}

async function getProjectName(rootDir: string): Promise<string> {
  try {
    const content = await readTextIfExists(path.join(rootDir, '.qa', 'project', 'context.yaml'));
    if (content !== null) {
    const doc = yaml.parse(content) as { project_name?: unknown } | null;
      if (typeof doc?.project_name === 'string' && doc.project_name.trim() !== '') {
        return doc.project_name;
      }
    }
  } catch {
    // Fallback silencioso al nombre del directorio base
  }
  return path.basename(rootDir);
}

/**
 * Lee la configuración existente del cliente. Si el archivo existe pero no es
 * JSON válido, aborta: nunca se sobrescribe para no perder los otros servidores.
 */
async function readExistingConfig(filePath: string, clientName: string): Promise<McpClientConfig> {
  const raw = await readTextIfExists(filePath);
  if (raw === null || raw.trim() === '') {
    return {};
  }
  try {
    return JSON.parse(raw.replace(/^\uFEFF/, '')) as McpClientConfig;
  } catch {
    throw new Error(
      `No se pudo interpretar la configuración de ${clientName} (${filePath}). ` +
        'Corrígela manualmente; no se modificó para no perder tus otros servidores.'
    );
  }
}

export async function registerMcpProject(options: RegisterMcpOptions = {}): Promise<void> {
  const rootDir = process.cwd();
  const projectName = await getProjectName(rootDir);
  const targetClient = options.client ?? 'all';
  const dryRun = options.dryRun ?? false;

  const serverKey = `qap:${projectName}`;
  const serverConfig: McpServerEntry = {
    command: 'npx',
    args: ['-y', '@hyouka73/qap-cli', 'mcp', '--project', rootDir],
  };

  const targets: Array<{ name: string; filePath: string }> = [];

  if (targetClient === 'cursor' || targetClient === 'all') {
    targets.push({ name: 'Cursor', filePath: getCursorConfigPath() });
  }
  if (targetClient === 'claude' || targetClient === 'all') {
    targets.push({ name: 'Claude Desktop', filePath: getClaudeConfigPath() });
  }

  for (const target of targets) {
    const config = await readExistingConfig(target.filePath, target.name);

    // Inyectar sin destruir otros servidores existentes
    config.mcpServers = { ...(config.mcpServers ?? {}), [serverKey]: serverConfig };

    if (dryRun) {
      console.log(`[DRY RUN] Configuración propuesta para ${target.name} (${target.filePath}):`);
      console.log(JSON.stringify(config, null, 2));
      continue;
    }

    try {
      await mkdir(path.dirname(target.filePath), { recursive: true });
      await writeFile(target.filePath, JSON.stringify(config, null, 2), 'utf8');
      console.log(`✔ Servidor MCP '${serverKey}' registrado en ${target.name} (${target.filePath})`);
    } catch (err) {
      console.error(`[MCP Register] Error al escribir la configuración en ${target.name}:`, err);
      throw err;
    }
  }
}