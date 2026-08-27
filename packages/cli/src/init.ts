import { input, checkbox } from '@inquirer/prompts';
import { existsSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import type { InitOptions, QapConfig } from './types.js';

export async function handleInitCommand(options: InitOptions): Promise<void> {
  let config: QapConfig;

  // 1. Modo Silencioso (--config)
  if (options.config) {
    const configPath = resolve(process.cwd(), options.config);
    if (!existsSync(configPath)) {
      throw new Error(`El archivo de configuración no existe en: ${configPath}`);
    }
    const rawContent = readFileSync(configPath, 'utf-8');
    config = JSON.parse(rawContent) as QapConfig;
  } 
  // 2. Modo Interactivo (Wizard)
  else {
    const projectName = await input({
      message: '¿Cuál es el nombre del proyecto?',
      default: 'my-qap-project',
      validate: (value) => (value.trim() !== '' ? true : 'El nombre no puede estar vacío.'),
    });

    const environments = await checkbox({
      message: 'Selecciona los ambientes a configurar:',
      choices: [
        { name: 'local', value: 'local', checked: true },
        { name: 'staging', value: 'staging', checked: true },
        { name: 'prod', value: 'prod', checked: true },
      ],
      validate: (choices) => (choices.length > 0 ? true : 'Debes seleccionar al menos un ambiente.'),
    });

    config = {
      projectName,
      environments,
      createdAt: new Date().toISOString(),
    };
  }

  // 3. Crear estructura .qa/
  const qaDir = resolve(process.cwd(), '.qa');
  if (!existsSync(qaDir)) {
    mkdirSync(qaDir, { recursive: true });
  }

  // Subcarpetas para ambientes
  for (const env of config.environments) {
    const envDir = join(qaDir, 'environments', env);
    if (!existsSync(envDir)) {
      mkdirSync(envDir, { recursive: true });
    }
  }

  // Guardar config.json
  writeFileSync(join(qaDir, 'config.json'), JSON.stringify(config, null, 2), 'utf-8');

  // 4. Generar .gitignore automático dentro de .qa/
  const gitignoreContent = `# Generado automáticamente por QAP CLI
logs/
*.tmp
cache/
secrets.*.json
`;
  writeFileSync(join(qaDir, '.gitignore'), gitignoreContent, 'utf-8');

  console.log(`\n✅ Proyecto "${config.projectName}" inicializado con éxito en .qa/`);
}