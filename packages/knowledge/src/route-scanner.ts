import { existsSync, readdirSync, statSync, readFileSync } from 'node:fs';
import { resolve, relative, join, extname } from 'node:path';

import type { ProjectRepoMap, ProjectRoute, ScanSubproyecto } from '@qap/shared';

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.qa',
  'dist',
  'build',
  '.next',
  '.nuxt',
  '.turbo',
  '.cache',
  'coverage',
  '.output',
]);

const ROUTE_FILE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.vue', '.mjs', '.cjs']);
const MAX_FILE_SIZE_BYTES = 200 * 1024; // 200 KB
const MAX_FILES_VISITED = 2000;
const MAX_EXECUTION_TIME_MS = 3000; // 3 segundos

const GUARD_PATTERNS = /(?:authguard|protectedroute|requireauth|privateroute|authenticatedroute)/i;

/**
 * Normaliza los parámetros de una ruta (ej. [id] -> :id) y asegura barra inicial.
 */
export function normalizeRoutePath(rawPath: string): string {
  let p = rawPath.trim();
  if (!p) return '/';
  if (!p.startsWith('/')) {
    p = `/${p}`;
  }
  // Convertir formato Next.js [param] a :param
  p = p.replace(/\[\.\.\.([^\]]+)\]/g, ':$1*').replace(/\[([^\]]+)\]/g, ':$1');
  // Normalizar barras repetidas
  p = p.replace(/\/+/g, '/');
  if (p.length > 1 && p.endsWith('/')) {
    p = p.slice(0, -1);
  }
  return p;
}

/**
 * Escanea de forma determinista y acotada las rutas frontend de los subproyectos (C3).
 */
export function scanProjectRoutes(
  workspaceRoot: string,
  subproyectos: ScanSubproyecto[] = []
): ProjectRepoMap {
  const startTime = Date.now();
  const resolvedRoot = resolve(workspaceRoot);
  const advertencias: string[] = [];

  if (!existsSync(resolvedRoot)) {
    return {
      _version: '1.0.0',
      subproyectos,
      rutas: [],
      advertencias,
    };
  }

  let filesVisited = 0;
  let timeLimitHit = false;

  const foundRoutes: ProjectRoute[] = [];

  // Carpetas objetivo a explorar: cada subproyecto o la raíz si no hay subproyectos
  const targetDirs: Array<{ dirPath: string; framework: string }> = [];

  if (subproyectos.length > 0) {
    for (const sub of subproyectos) {
      const absSub = resolve(resolvedRoot, sub.path);
      if (existsSync(absSub)) {
        targetDirs.push({ dirPath: absSub, framework: sub.framework || 'unknown' });
      }
    }
  } else {
    targetDirs.push({ dirPath: resolvedRoot, framework: 'unknown' });
  }

  function checkLimits(): boolean {
    if (Date.now() - startTime > MAX_EXECUTION_TIME_MS) {
      if (!timeLimitHit) {
        timeLimitHit = true;
        advertencias.push('tiempo_limite_excedido');
      }
      return false;
    }
    if (filesVisited >= MAX_FILES_VISITED) {
      if (!advertencias.includes('limite_archivos_excedido')) {
        advertencias.push('limite_archivos_excedido');
      }
      return false;
    }
    return true;
  }

  for (const target of targetDirs) {
    if (!checkLimits()) break;
    exploreDirectory(target.dirPath, target.framework, target.dirPath);
  }

  function exploreDirectory(currentDir: string, defaultFramework: string, targetRoot: string): void {
    if (!checkLimits()) return;

    let entries: string[];
    try {
      entries = readdirSync(currentDir).sort();
    } catch {
      return;
    }

    for (const entry of entries) {
      if (!checkLimits()) return;

      const fullPath = join(currentDir, entry);
      const base = entry.toLowerCase();

      // NUNCA leer archivos .env ni variantes
      if (base === '.env' || base.startsWith('.env.')) {
        continue;
      }

      let st;
      try {
        st = statSync(fullPath);
      } catch {
        continue;
      }

      if (st.isDirectory()) {
        if (!IGNORED_DIRS.has(entry) && !entry.startsWith('.')) {
          exploreDirectory(fullPath, defaultFramework, targetRoot);
        }
      } else if (st.isFile()) {
        filesVisited++;

        const ext = extname(entry).toLowerCase();
        if (!ROUTE_FILE_EXTENSIONS.has(ext)) {
          continue;
        }

        if (st.size > MAX_FILE_SIZE_BYTES) {
          continue;
        }

        const posixRel = relative(resolvedRoot, fullPath).replace(/\\/g, '/');
        const relToTarget = relative(targetRoot, fullPath).replace(/\\/g, '/');

        // 1. Next.js App Router (app/**/page.* o src/app/**/page.*)
        if (/^(?:src\/)?app\/(.+)\/page\.[a-z]+$/i.test(relToTarget)) {
          const match = relToTarget.match(/^(?:src\/)?app\/(.+)\/page\.[a-z]+$/i);
          if (match && match[1]) {
            const rawSegments = match[1]
              .split('/')
              .filter((seg) => !seg.startsWith('(') || !seg.endsWith(')')); // Ignorar route groups (auth)
            const cleanPath = normalizeRoutePath('/' + rawSegments.join('/'));
            foundRoutes.push({
              path: cleanPath,
              archivo: posixRel,
              linea: 1,
              framework: 'next',
              requiere_sesion: null,
              roles: [],
            });
            continue;
          }
        } else if (/^(?:src\/)?app\/page\.[a-z]+$/i.test(relToTarget)) {
          foundRoutes.push({
            path: '/',
            archivo: posixRel,
            linea: 1,
            framework: 'next',
            requiere_sesion: null,
            roles: [],
          });
          continue;
        }

        // 2. Next.js Pages Router (pages/** o src/pages/**)
        if (/^(?:src\/)?pages\/(.+)\.[a-z]+$/i.test(relToTarget)) {
          const match = relToTarget.match(/^(?:src\/)?pages\/(.+)\.[a-z]+$/i);
          if (match && match[1]) {
            const pagePath = match[1];
            // Ignorar archivos especiales de Next
            if (!pagePath.startsWith('_') && !pagePath.startsWith('api/')) {
              const clean = pagePath === 'index' ? '/' : pagePath.endsWith('/index') ? pagePath.slice(0, -6) : pagePath;
              foundRoutes.push({
                path: normalizeRoutePath(clean),
                archivo: posixRel,
                linea: 1,
                framework: 'next',
                requiere_sesion: null,
                roles: [],
              });
              continue;
            }
          }
        }

        // 3. Análisis de código para React Router y Vue Router
        let fileContent: string;
        try {
          fileContent = readFileSync(fullPath, 'utf-8');
        } catch {
          continue;
        }

        extractRoutesFromCode(fileContent, posixRel, defaultFramework);
      }
    }
  }

  function extractRoutesFromCode(content: string, relPath: string, frameworkHint: string): void {
    const lines = content.split(/\r?\n/);
    const fw = frameworkHint.includes('vue') || relPath.endsWith('.vue') ? 'vue' : 'react';

    // Rastrear si estamos dentro de un componente Guard en JSX
    let activeGuardDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line === undefined) continue;
      const lineNum = i + 1;

      // Detectar apertura/cierre de Guards en JSX
      if (GUARD_PATTERNS.test(line)) {
        if (/<(?:[A-Za-z0-9_]*Guard|[A-Za-z0-9_]*Auth|[A-Za-z0-9_]*Protected)[^>]*>/i.test(line)) {
          activeGuardDepth++;
        }
        if (/<\/(?:[A-Za-z0-9_]*Guard|[A-Za-z0-9_]*Auth|[A-Za-z0-9_]*Protected)>/i.test(line)) {
          activeGuardDepth = Math.max(0, activeGuardDepth - 1);
        }
      }

      // (A) React Router: <Route ... path="..." ... /> (mutación M22 ignora estos elementos)
      const routeElementMatch = line.match(/<Route\b[^>]*\bpath=(?:["']([^"']+)["']|\{["']([^"']+)["']\})/);
      if (routeElementMatch) {
        const rawPath = routeElementMatch[1] || routeElementMatch[2];
        if (rawPath && !rawPath.startsWith('*')) {
          const isGuarded = activeGuardDepth > 0 || line.includes('element={<Auth') || line.includes('element={<Protected');
          foundRoutes.push({
            path: normalizeRoutePath(rawPath),
            archivo: relPath,
            linea: lineNum,
            framework: 'react',
            requiere_sesion: isGuarded ? true : null,
            roles: [],
          });
        }
      }

      // (B) Objeto de ruta: path: '/ruta' o path: "/ruta" (createBrowserRouter / Vue Router)
      const pathPropMatch = line.match(/\bpath:\s*['"]([^'"]+)['"]/);
      if (pathPropMatch) {
        const rawPath = pathPropMatch[1];
        if (rawPath && !rawPath.startsWith('*') && (rawPath.startsWith('/') || !rawPath.includes(' '))) {
          // Detectar si el bloque actual o líneas cercanas usan guards
          const contextSlice = lines.slice(Math.max(0, i - 5), Math.min(lines.length, i + 6)).join('\n');
          const isGuarded = GUARD_PATTERNS.test(contextSlice);
          foundRoutes.push({
            path: normalizeRoutePath(rawPath),
            archivo: relPath,
            linea: lineNum,
            framework: fw,
            requiere_sesion: isGuarded ? true : null,
            roles: [],
          });
        }
      }
    }
  }

  // Deduplicación determinista por (path, archivo)
  const dedupMap = new Map<string, ProjectRoute>();
  for (const r of foundRoutes) {
    const key = `${r.path}::${r.archivo}`;
    if (!dedupMap.has(key)) {
      dedupMap.set(key, r);
    }
  }

  const finalRoutes = Array.from(dedupMap.values()).sort((a, b) => {
    if (a.path !== b.path) return a.path.localeCompare(b.path);
    return a.archivo.localeCompare(b.archivo);
  });

  return {
    _version: '1.0.0',
    subproyectos,
    rutas: finalRoutes,
    advertencias,
  };
}
