import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';

interface QapProjectConfig {
  name?: string;
  defaultEnv?: string;
}

interface AuthProfilesFile {
  profiles?: unknown[];
}

export function handleStatus(): Promise<void> {
  const projectDir = join(process.cwd(), '.qa', 'project');
  const configPath = join(projectDir, 'qa.config.json');
  const contextYamlPath = join(projectDir, 'context.yaml');
  const environmentsYamlPath = join(projectDir, 'environments.yaml');
  const authPath = join(projectDir, 'auth', 'profiles.json');

  console.log('\n--- Estado del Proyecto QA ---');

  const hasConfig = existsSync(configPath) || existsSync(contextYamlPath) || existsSync(environmentsYamlPath);
  if (!hasConfig) {
    console.log('El proyecto no esta inicializado. Ejecuta `qap init` primero.');
    return Promise.resolve();
  }

  console.log('Proyecto inicializado correctamente.');

  // Configuración
  try {
    if (existsSync(contextYamlPath)) {
      const parsedContext = YAML.parse(readFileSync(contextYamlPath, 'utf-8'));
      const parsedEnv = existsSync(environmentsYamlPath) ? YAML.parse(readFileSync(environmentsYamlPath, 'utf-8')) : null;
      console.log(`Proyecto: ${parsedContext?.project_name || 'Sin nombre'}`);
      console.log(`Entorno por defecto: ${parsedEnv?.default || 'local'}`);
    } else if (existsSync(configPath)) {
      const config = JSON.parse(readFileSync(configPath, 'utf-8')) as QapProjectConfig;
      console.log(`Proyecto: ${config.name || 'Sin nombre'}`);
      console.log(`Entorno por defecto: ${config.defaultEnv || 'local'}`);
    }
  } catch {
    console.log('Error al leer la configuracion del proyecto.');
  }

  // Autenticación
  if (existsSync(authPath)) {
    try {
      const parsed = JSON.parse(readFileSync(authPath, 'utf-8')) as AuthProfilesFile;
      const count = parsed.profiles?.length ?? 0;
      console.log(`Perfiles de autenticacion registrados: ${count}`);
    } catch {
      console.log('Perfiles de autenticacion: Error de lectura');
    }
  } else {
    console.log('Perfiles de autenticacion: Ninguno');
  }

  console.log('------------------------------\n');
  return Promise.resolve();
}