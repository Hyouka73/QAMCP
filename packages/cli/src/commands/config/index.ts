import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface QapConfig {
  [key: string]: string;
}

export function handleConfigShow(): Promise<void> {
  const configPath = join(process.cwd(), '.qa', 'project', 'qa.config.json');
  if (!existsSync(configPath)) {
    console.log('No existe configuracion activa. Inicializa con `qap init`.');
    return Promise.resolve();
  }

  const config = readFileSync(configPath, 'utf-8');
  console.log('\n--- Configuracion Activa (.qa/project/qa.config.json) ---');
  console.log(config);
  console.log('------------------------------------------------------------\n');
  return Promise.resolve();
}

export function handleConfigSet(key: string, value: string): Promise<void> {
  const configPath = join(process.cwd(), '.qa', 'project', 'qa.config.json');
  if (!existsSync(configPath)) {
    console.log('No existe configuracion activa para modificar.');
    return Promise.resolve();
  }

  const config = JSON.parse(readFileSync(configPath, 'utf-8')) as QapConfig;
  config[key] = value;
  writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  console.log(`Configuracion actualizada: ${key} = ${value}`);
  return Promise.resolve();
}