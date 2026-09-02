import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface PlaywrightDetectionResult {
  installed: boolean;
  packageName?: '@playwright/test' | 'playwright-core';
  version?: string;
}

/**
 * Inspecciona el package.json del proyecto destino para verificar
 * si Playwright (@playwright/test o playwright-core) está instalado.
 */
export function detectPlaywright(projectPath: string): PlaywrightDetectionResult {
  const packageJsonPath = join(projectPath, 'package.json');

  if (!existsSync(packageJsonPath)) {
    console.warn(
      `⚠ No se encontró package.json en '${projectPath}'. No se pudo verificar Playwright.`
    );
    return { installed: false };
  }

  let pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
  try {
    const raw = readFileSync(packageJsonPath, 'utf-8');
    pkg = JSON.parse(raw) as typeof pkg;
  } catch {
    console.warn(`⚠ No se pudo leer/parsear el package.json en '${projectPath}'.`);
    return { installed: false };
  }

  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  if (deps['@playwright/test']) {
    return { installed: true, packageName: '@playwright/test', version: deps['@playwright/test'] };
  }

  if (deps['playwright-core']) {
    return { installed: true, packageName: 'playwright-core', version: deps['playwright-core'] };
  }

  console.warn(
    '⚠ Playwright no está instalado en este proyecto.\n' +
    '  Instálalo con: npm install -D @playwright/test\n' +
    '  Luego corre: npx playwright install'
  );
  return { installed: false };
}