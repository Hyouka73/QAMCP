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

const GUARD_PATTERNS = /(?:authguard|protectedroute|requireauth|requiresauth|privateroute|authenticatedroute)/i;

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
    let shouldStop = false;
    if (filesVisited >= MAX_FILES_VISITED) {
      if (!advertencias.includes('limite_archivos_excedido')) {
        advertencias.push('limite_archivos_excedido');
      }
      shouldStop = true;
    }
    if (Date.now() - startTime > MAX_EXECUTION_TIME_MS) {
      if (!timeLimitHit) {
        timeLimitHit = true;
        advertencias.push('tiempo_limite_excedido');
      }
      shouldStop = true;
    }
    return !shouldStop;
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

      // NUNCA leer archivos .env ni variantes (M28)
      if (base.startsWith('.env')) {
        continue;
      }

      let st;
      try {
        st = statSync(fullPath);
      } catch {
        continue;
      }

      if (st.isDirectory()) {
        if (!IGNORED_DIRS.has(entry) && !entry.startsWith('.') && !base.startsWith('.env')) {
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
            const rawDir = match[1];
            // Route groups como (auth) o (protected) NO son evidencia de guard (D3 / C3)
            const isGuarded = checkNextLayoutGuard(fullPath, targetRoot);
            const rawSegments = rawDir
              .split('/')
              .filter((seg) => !seg.startsWith('(') || !seg.endsWith(')')); // Ignorar route groups
            const cleanPath = normalizeRoutePath('/' + rawSegments.join('/'));
            foundRoutes.push({
              path: cleanPath,
              archivo: posixRel,
              linea: 1,
              framework: 'next',
              requiere_sesion: isGuarded ? true : null,
              roles: [],
            });
            continue;
          }
        } else if (/^(?:src\/)?app\/page\.[a-z]+$/i.test(relToTarget)) {
          const isGuarded = checkNextLayoutGuard(fullPath, targetRoot);
          foundRoutes.push({
            path: '/',
            archivo: posixRel,
            linea: 1,
            framework: 'next',
            requiere_sesion: isGuarded ? true : null,
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

  function checkNextLayoutGuard(pageFullPath: string, targetRoot: string): boolean {
    let currentDir = resolve(pageFullPath, '..');
    const root = resolve(targetRoot);

    while (currentDir.startsWith(root) || currentDir === root) {
      const layoutFiles = ['layout.js', 'layout.jsx', 'layout.ts', 'layout.tsx', 'layout.mjs'];
      for (const lf of layoutFiles) {
        const layoutPath = join(currentDir, lf);
        if (existsSync(layoutPath)) {
          try {
            const st = statSync(layoutPath);
            if (st.size <= MAX_FILE_SIZE_BYTES) {
              const layoutContent = readFileSync(layoutPath, 'utf-8');
              if (GUARD_PATTERNS.test(layoutContent)) {
                return true;
              }
            }
          } catch { /* empty */ }
        }
      }
      const parentDir = resolve(currentDir, '..');
      if (parentDir === currentDir) break;
      currentDir = parentDir;
    }
    return false;
  }

  function findEnclosingBraceRange(src: string, targetIdx: number): { start: number; end: number } | null {
    let depth = 0;
    let start = -1;
    for (let k = targetIdx; k >= 0; k--) {
      if (src[k] === '}') {
        depth++;
      } else if (src[k] === '{') {
        if (depth === 0) {
          start = k;
          break;
        }
        depth--;
      }
    }
    if (start === -1) return null;

    depth = 0;
    let end = -1;
    for (let k = start; k < src.length; k++) {
      if (src[k] === '{') {
        depth++;
      } else if (src[k] === '}') {
        depth--;
        if (depth === 0) {
          end = k;
          break;
        }
      }
    }
    if (end === -1) return null;
    return { start, end };
  }

  function extractRoutesFromCode(content: string, relPath: string, frameworkHint: string): void {
    const lines = content.split(/\r?\n/);
    const fw = frameworkHint.includes('vue') || relPath.endsWith('.vue') ? 'vue' : 'react';

    // Rastrear si estamos dentro de un componente Guard en JSX
    let activeGuardDepth = 0;
    let charOffset = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line === undefined) continue;
      const lineNum = i + 1;
      const currentLineStart = content.indexOf(line, charOffset);
      if (currentLineStart !== -1) {
        charOffset = currentLineStart + line.length;
      }

      // Detectar apertura de Guards envolventes en JSX: <AuthGuard> (no auto-cerrado) o <Route element={<AuthGuard />}>
      const isWrapperGuardOpen = (
        (/<\s*(?:[A-Za-z0-9_]*Guard|[A-Za-z0-9_]*Protected|[A-Za-z0-9_]*RequireAuth|[A-Za-z0-9_]*PrivateRoute)\b[^>]*>/i.test(line) &&
         !/<\s*(?:[A-Za-z0-9_]*Guard|[A-Za-z0-9_]*Protected|[A-Za-z0-9_]*RequireAuth|[A-Za-z0-9_]*PrivateRoute)\b[^>]*\/>/i.test(line)) ||
        (/<Route\b/i.test(line) && !/\bpath=/i.test(line) && /element=\s*\{<\s*(?:[A-Za-z0-9_]*Guard|[A-Za-z0-9_]*Protected|[A-Za-z0-9_]*RequireAuth|[A-Za-z0-9_]*PrivateRoute)/i.test(line))
      );

      if (isWrapperGuardOpen) {
        activeGuardDepth++;
      }

      // (A) React Router: <Route ... path="..." ... /> (mutación M22 ignora estos elementos)
      const routeElementMatch = line.match(/<Route\b[^>]*\bpath=(?:["']([^"']+)["']|\{["']([^"']+)["']\})/);
      if (routeElementMatch) {
        const rawPath = routeElementMatch[1] || routeElementMatch[2];
        if (rawPath && !rawPath.startsWith('*')) {
          const hasGuardInLine = /element=\s*\{<\s*(?:[A-Za-z0-9_]*Guard|[A-Za-z0-9_]*Protected|[A-Za-z0-9_]*RequireAuth|[A-Za-z0-9_]*PrivateRoute)/i.test(line);
          const isGuarded = activeGuardDepth > 0 || hasGuardInLine;
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

      // Detectar cierre de Guards envolventes: </AuthGuard> o </Route>
      const isClosingGuard = (
        /<\/\s*(?:[A-Za-z0-9_]*Guard|[A-Za-z0-9_]*Protected|[A-Za-z0-9_]*RequireAuth|[A-Za-z0-9_]*PrivateRoute)\s*>/i.test(line) ||
        (/<\/\s*Route\s*>/i.test(line) && activeGuardDepth > 0 && !/<Route\b/i.test(line))
      );

      if (isClosingGuard) {
        activeGuardDepth = Math.max(0, activeGuardDepth - 1);
      }

      // (B) Objeto de ruta: path: '/ruta' o path: "/ruta" (createBrowserRouter / Vue Router)
      const pathPropMatch = line.match(/\bpath:\s*['"]([^'"]+)['"]/);
      if (pathPropMatch) {
        const rawPath = pathPropMatch[1];
        if (rawPath && !rawPath.startsWith('*') && (rawPath.startsWith('/') || !rawPath.includes(' '))) {
          // Detectar guard acotado por emparejamiento de llaves { ... } del objeto de ruta o ancestro (M27)
          const pathIdx = (currentLineStart !== -1 ? currentLineStart : 0) + line.indexOf(pathPropMatch[0]);
          let isGuarded = false;

          let range = findEnclosingBraceRange(content, pathIdx);
          while (range) {
            const objText = content.slice(range.start, range.end + 1);
            if (/\brequiresAuth\s*:\s*true\b/i.test(objText) || GUARD_PATTERNS.test(objText)) {
              isGuarded = true;
              break;
            }
            if (range.start > 0) {
              const parentRange = findEnclosingBraceRange(content, range.start - 1);
              if (parentRange && parentRange.start < range.start && parentRange.end > range.end) {
                range = parentRange;
              } else {
                break;
              }
            } else {
              break;
            }
          }

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
