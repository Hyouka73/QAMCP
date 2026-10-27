import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SemanticHasher } from '@qap/knowledge';
import type { SemanticHash } from '@qap/shared';
import { parse } from 'yaml';

/**
 * Calcula el hash semántico de una carpeta con forma de módulo
 * (context.yaml + selectors.json), sea el módulo vivo o un snapshot de backup.
 * 'qap update' y 'qap rollback' usan esta única función para que sus hashes coincidan.
 */
export function computeModuleSemanticHash(dir: string): SemanticHash {
  const routes: string[] = [];
  const contextPath = join(dir, 'context.yaml');
  if (existsSync(contextPath)) {
    try {
      const context = parse(readFileSync(contextPath, 'utf-8')) as { base_route?: unknown } | null;
      if (typeof context?.base_route === 'string' && context.base_route !== '') {
        routes.push(context.base_route);
      }
    } catch {
      // YAML ilegible: se calcula sin rutas.
    }
  }

  let selectors: Record<string, string> = {};
  const selectorsPath = join(dir, 'selectors.json');
  if (existsSync(selectorsPath)) {
    try {
      const parsed = JSON.parse(readFileSync(selectorsPath, 'utf-8')) as {
        selectors?: Record<string, string>;
      } | null;
      selectors = parsed?.selectors ?? {};
    } catch {
      // JSON ilegible: se calcula sin selectores.
    }
  }

  return new SemanticHasher().generate({ routes, selectors }, ['context.yaml', 'selectors.json']);
}