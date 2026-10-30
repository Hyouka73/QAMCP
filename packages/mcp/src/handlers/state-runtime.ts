import { existsSync, readFileSync } from 'node:fs';
import { resolve, join, dirname, relative, basename } from 'node:path';

import { sanitizeSnippet } from '@qap/shared';
import { generarRenderTexto, guardPregunta, type Pregunta } from '@qap/engine';

export const PLAYWRIGHT_INSTALL_COMMAND = 'npx playwright install chromium';

export async function checkPlaywrightBrowser(): Promise<{ disponible: boolean; error?: string; comando_instalacion: string }> {
  try {
    const { chromium } = await import('playwright-core');
    const execPath = chromium.executablePath();
    if (execPath && existsSync(execPath)) {
      return { disponible: true, comando_instalacion: PLAYWRIGHT_INSTALL_COMMAND };
    }
  } catch { /* empty */ }

  if (process.platform === 'win32') {
    const prefixes = [
      process.env.LOCALAPPDATA,
      process.env.PROGRAMFILES,
      process.env['PROGRAMFILES(X86)'],
    ].filter(Boolean);

    for (const prefix of prefixes) {
      if (
        existsSync(join(prefix!, 'Google', 'Chrome', 'Application', 'chrome.exe')) ||
        existsSync(join(prefix!, 'Microsoft', 'Edge', 'Application', 'msedge.exe'))
      ) {
        return { disponible: true, comando_instalacion: PLAYWRIGHT_INSTALL_COMMAND };
      }
    }
  } else if (process.platform === 'darwin') {
    if (
      existsSync('/Applications/Google Chrome.app') ||
      existsSync('/Applications/Microsoft Edge.app')
    ) {
      return { disponible: true, comando_instalacion: PLAYWRIGHT_INSTALL_COMMAND };
    }
  } else {
    const linuxBins = ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
    if (linuxBins.some(existsSync)) {
      return { disponible: true, comando_instalacion: PLAYWRIGHT_INSTALL_COMMAND };
    }
  }

  return {
    disponible: false,
    error: `No se encontró un navegador compatible en el sistema (Google Chrome, Microsoft Edge ni Chromium de Playwright). Instala Google Chrome o ejecuta '${PLAYWRIGHT_INSTALL_COMMAND}'.`,
    comando_instalacion: PLAYWRIGHT_INSTALL_COMMAND,
  };
}

export function buildCorrectionQuestion(campo: string, context: Record<string, unknown> | null | undefined): Pregunta {
  const id = `onboarding.corregir.${campo}`;
  let texto: string;
  let registrarCon = { tool: 'qap_context_set', campo };

  switch (campo) {
    case 'objective': {
      const objStr = typeof context?.objective === 'string' ? context.objective : '';
      const prop = sanitizeSnippet(objStr) || objStr || '';
      texto = `Propuesta actual de objetivo: "${prop}". Escribe el objetivo corregido:`;
      break;
    }
    case 'roles': {
      const prop = ((Array.isArray(context?.roles) ? context.roles : []) as Array<{ name?: string }>).map((r) => r.name || '').filter(Boolean).join(', ');
      texto = `Propuesta actual de roles: "${prop}". Escribe los roles corregidos (separados por coma):`;
      break;
    }
    case 'critical_flows': {
      const prop = ((Array.isArray(context?.critical_flows) ? context.critical_flows : []) as Array<{ name?: string }>).map((f) => f.name || '').filter(Boolean).join(', ');
      texto = `Propuesta actual de flujos críticos: "${prop}". Escribe los flujos críticos corregidos (separados por coma):`;
      break;
    }
    case 'base_url': {
      const prop = typeof context?.base_url === 'string' ? context.base_url : '(sin definir)';
      texto = `Propuesta actual de URL base: "${prop}". Escribe la URL base corregida:`;
      registrarCon = { tool: 'qap_context_set', campo: 'base_url' };
      break;
    }
    default:
      texto = `Escribe el valor corregido para '${campo}':`;
      break;
  }

  const p: Pregunta = {
    id,
    texto,
    formato: 'abierta',
    opciones: [],
    permite_otra: true,
    registrar_con: registrarCon,
  };
  p.render_texto = generarRenderTexto(p);
  return guardPregunta(p) as Pregunta;
}

export function detectarSubcarpetaWorkspace(rootDir: string): string | null {
  let current = resolve(rootDir);
  for (let i = 0; i < 3; i++) {
    const parent = dirname(current);
    if (!parent || parent === current) break;
    current = parent;

    const hasGit = existsSync(join(current, '.git'));
    const hasWorkspaceYaml = existsSync(join(current, 'pnpm-workspace.yaml'));
    let hasPkgWorkspaces = false;
    const pkgPath = join(current, 'package.json');
    if (existsSync(pkgPath)) {
      try {
        const parsedPkg: unknown = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        if (parsedPkg && typeof parsedPkg === 'object' && 'workspaces' in parsedPkg && parsedPkg.workspaces !== undefined) {
          hasPkgWorkspaces = true;
        }
      } catch {
        // ignore
      }
    }

    if (hasGit || hasWorkspaceYaml || hasPkgWorkspaces) {
      const rel = relative(current, rootDir).replace(/\\/g, '/');
      return rel || basename(current);
    }
  }
  return null;
}
