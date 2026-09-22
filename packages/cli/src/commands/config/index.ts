import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface QapConfig {
  videoTtlDays?: number;
  traceTtlDays?: number;
  recordTtlDays?: number;
  maxDiskUsageBytes?: number;
  [key: string]: unknown;
}

function resolveConfigPath(): string {
  const v3Config = join(process.cwd(), '.qa', 'config.json');
  if (existsSync(v3Config)) return v3Config;

  const v2Config = join(process.cwd(), '.qa', 'project', 'qa.config.json');
  if (existsSync(v2Config)) return v2Config;

  return v3Config;
}

export function handleConfigShow(): Promise<void> {
  const configPath = resolveConfigPath();
  if (!existsSync(configPath)) {
    console.log('No existe configuración activa. Inicializa con `qap init` o define `.qa/config.json`.');
    return Promise.resolve();
  }

  const config = readFileSync(configPath, 'utf-8');
  console.log(`\n--- Configuración Activa (${configPath}) ---`);
  console.log(config);
  console.log('------------------------------------------------------------\n');
  return Promise.resolve();
}

export function handleConfigSet(key: string, value: string): Promise<void> {
  const configPath = resolveConfigPath();
  let config: QapConfig = {};

  if (existsSync(configPath)) {
    try {
      config = JSON.parse(readFileSync(configPath, 'utf-8')) as QapConfig;
    } catch {
      config = {};
    }
  }

  // Parsear números si aplica
  const numericVal = Number(value);
  const parsedValue = !isNaN(numericVal) && value.trim() !== '' ? numericVal : value;

  config[key] = parsedValue;
  writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  console.log(`Configuración actualizada: ${key} = ${parsedValue}`);
  return Promise.resolve();
}