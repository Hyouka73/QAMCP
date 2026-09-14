import { existsSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';

import { input } from '@inquirer/prompts';
import { SchemaValidator } from '@qap/shared';
import YAML from 'yaml';

import type { InitOptions } from '../types.js';
import { detectPlaywright } from '../utils/playwright-detector.js';

export async function handleInitCommand(options: InitOptions): Promise<void> {
  let projectName = basename(process.cwd()) || 'my-project';
  let envList: string[] = ['local'];

  // 1. Modo Silencioso (--config <path>)
  if (options.config) {
    const configPath = resolve(process.cwd(), options.config);
    if (!existsSync(configPath)) {
      console.error(`El archivo de configuración no existe en: ${configPath}`);
      process.exit(66); // POSIX EX_NOINPUT
    }

    let parsed: unknown;
    try {
      const rawContent = readFileSync(configPath, 'utf-8');
      parsed = JSON.parse(rawContent);
    } catch {
      console.error('El archivo de configuración no es un JSON válido.');
      process.exit(65); // POSIX EX_DATAERR
    }

    // Validar esquema ANTES de tocar el filesystem
    const validator = new SchemaValidator();
    const validationResult = validator.validateProjectInit(parsed);
    if (!validationResult.valid) {
      console.error('Error de validacion contra project-init.schema.json:');
      validationResult.errors.forEach((err) => console.error(` - ${err.message}`));
      process.exit(65); // POSIX EX_DATAERR (Abortar sin modificar el disco)
    }

    const configData = parsed as { projectName?: string; environments?: string[] };
    if (configData.projectName) {
      projectName = configData.projectName;
    }
    if (configData.environments && Array.isArray(configData.environments) && configData.environments.length > 0) {
      envList = configData.environments;
    }
  } 
  // 2. Modo Interactivo (Wizard)
  else {
    projectName = await input({
      message: '¿Cuál es el nombre del proyecto?',
      default: basename(process.cwd()) || 'my-project',
      validate: (value) => (value.trim() !== '' ? true : 'El nombre del proyecto no puede estar vacío.'),
    });
  }

  // 3. Crear exclusivamente el árbol .qa/ permitido
  const rootQaDir = resolve(process.cwd(), '.qa');
  
  // Lista estricta de subdirectorios
  const allowedDirectories = [
    join(rootQaDir, 'project'),
    join(rootQaDir, 'modules'),
    join(rootQaDir, 'cache'),
    join(rootQaDir, 'executions'),
  ];

  for (const dir of allowedDirectories) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  // 4. Generar .qa/project/environments.yaml utilizando la librería 'yaml' conforme a environments.schema.json
  const environmentsYamlPath = join(rootQaDir, 'project', 'environments.yaml');
  const envsMap: Record<string, { url: string; browser_mode: 'auto' | 'headless' | 'headed' }> = {};
  for (const env of envList) {
    envsMap[env] = {
      url: 'http://localhost:3000',
      browser_mode: 'auto',
    };
  }

  const environmentsData = {
    _version: '1',
    default: envList[0] || 'local',
    environments: envsMap,
  };

  writeFileSync(environmentsYamlPath, YAML.stringify(environmentsData), 'utf-8');

  // 5. Generar .qa/project/context.yaml con los metadatos base del proyecto
  const contextYamlPath = join(rootQaDir, 'project', 'context.yaml');
  const contextData = {
    _version: '1',
    project_name: projectName,
    description: `Configuración base de QA para ${projectName}`,
    tech_stack: [],
    base_url: 'http://localhost:3000',
    manually_edited: false,
  };

  writeFileSync(contextYamlPath, YAML.stringify(contextData), 'utf-8');

  // 6. Generar .qa/.gitignore ignorando EXCLUSIVAMENTE 'executions/' y 'cache/'
  const gitignorePath = join(rootQaDir, '.gitignore');
  const gitignoreContent = `# Generado automáticamente por QAP CLI
executions/
cache/
`;

  writeFileSync(gitignorePath, gitignoreContent, 'utf-8');

  // 7. Verificar si Playwright está instalado en el proyecto destino
  detectPlaywright(process.cwd());

  console.log('\n✅ Proyecto inicializado con éxito en .qa/');
}