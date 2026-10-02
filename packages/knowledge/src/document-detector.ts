import { existsSync, readdirSync, statSync, readFileSync, realpathSync } from 'node:fs';
import { resolve, relative, join, extname, basename } from 'node:path';

import { sanitizeDomString } from '@qap/engine';
import type { ProjectScan, ScanDocumento, ScanSubproyecto, ScanServicio } from '@qap/shared';

export interface DocumentoCandidato {
  path: string;
  nombre: string;
  es_ingerible: boolean;
  tamano_bytes: number;
  ranking?: number;
}

export interface PackageJsonInfo {
  name?: string;
  description?: string;
}

export interface HallazgosProyecto {
  documentos: DocumentoCandidato[];
  package_json?: PackageJsonInfo;
  subproyectos?: ScanSubproyecto[];
  servicios?: ScanServicio[];
  preliminar?: {
    docPath: string;
    objetivo?: string;
    roles?: string[];
  };
  docAnalizado?: string;
}

const IGNORED_DIRS = new Set(['node_modules', '.git', '.qa', 'dist', 'build', 'coverage']);
const INGESTIBLE_EXTENSIONS = new Set(['.md', '.markdown', '.txt']);
const EXCLUDED_FILE_PATTERNS = [/changelog/i, /license/i, /contributing/i, /code_of_conduct/i];
const MAX_FILE_SIZE_BYTES = 512 * 1024; // 512 KB
const MAX_CANDIDATES = 10;
const MAX_DEPTH = 3;

/**
 * Calcula el orden de prioridad del nombre del archivo según palabras clave canónicas (E1a / P4.3):
 * prd (0) > spec (1) > requisit (2) > alcance (3) > funcional (4) > readme (5) > diff (6) > otros (7)
 */
function getNombreScore(cleanBase: string): number {
  const lower = cleanBase.toLowerCase();
  if (lower.includes('prd')) return 0;
  if (lower.includes('spec')) return 1;
  if (lower.includes('requisit')) return 2;
  if (lower.includes('alcance')) return 3;
  if (lower.includes('funcional')) return 4;
  if (lower.includes('readme')) return 5;
  if (lower.includes('diff')) return 6;
  return 7;
}

/**
 * Calcula el orden de prioridad de ubicación del archivo (E1a / P4.3):
 * raíz (0) > docs (1) > subproyecto (2)
 */
function getUbicacionScore(relPosix: string): number {
  if (!relPosix.includes('/')) return 0; // raíz
  if (relPosix.toLowerCase().startsWith('docs/') || relPosix.toLowerCase().includes('/docs/')) return 1; // docs/**
  return 2; // subproyecto
}

/**
 * Detecta candidatos a documentos de especificación en el workspace del usuario (E1a / P4.3).
 *
 * Criterios canónicos:
 * - Candidatos: .md, .markdown y .txt en la raíz, en docs/** y READMEs de subproyectos.
 * - Profundidad <= 3.
 * - Excluyendo: node_modules, .git, .qa, dist, build, coverage, CHANGELOG, LICENSE, CONTRIBUTING, CODE_OF_CONDUCT.
 * - Ranking determinista: por nombre (prd, spec, requisit, alcance, funcional, readme, diff)
 *   y por ubicación (raíz > docs > subproyecto).
 * - Máximo 10, ordenados deterministamente.
 * - Sin contenido; rutas relativas POSIX; nombres sanitizados; realpath dentro del workspace.
 */
export function detectarDocumentosProyecto(workspaceRoot: string): HallazgosProyecto {
  const resolvedRoot = resolve(workspaceRoot);
  if (!existsSync(resolvedRoot)) {
    return { documentos: [], subproyectos: [], servicios: [] };
  }

  let realWorkspaceRoot: string;
  try {
    realWorkspaceRoot = realpathSync(resolvedRoot);
  } catch {
    realWorkspaceRoot = resolvedRoot;
  }
  const normRealWorkspace = realWorkspaceRoot.replace(/\\/g, '/').toLowerCase();

  const candidatosRaw: Array<DocumentoCandidato & { nombreScore: number; ubicacionScore: number }> = [];

  function esArchivoExcluido(fileName: string): boolean {
    return EXCLUDED_FILE_PATTERNS.some((pattern) => pattern.test(fileName));
  }

  function explorar(dirActual: string, depth: number) {
    if (depth > MAX_DEPTH) {
      return;
    }

    let entries: string[];
    try {
      entries = readdirSync(dirActual);
    } catch {
      return;
    }

    // Ordenar alfabéticamente para determinismo
    entries.sort();

    for (const entry of entries) {
      const fullPath = join(dirActual, entry);
      let realPath: string;
      try {
        realPath = realpathSync(fullPath);
      } catch {
        continue;
      }

      // Descartar symlinks que escapan del workspace
      const normReal = realPath.replace(/\\/g, '/').toLowerCase();
      if (!normReal.startsWith(normRealWorkspace)) {
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
          explorar(fullPath, depth + 1);
        }
      } else if (st.isFile()) {
        const ext = extname(entry).toLowerCase();
        const isYamlJsonApi =
          (entry.toLowerCase().startsWith('openapi.') || entry.toLowerCase().startsWith('swagger.')) &&
          (ext === '.yaml' || ext === '.yml' || ext === '.json');

        if (!INGESTIBLE_EXTENSIONS.has(ext) && !isYamlJsonApi) {
          continue;
        }

        if (esArchivoExcluido(entry)) {
          continue;
        }

        const relPath = relative(resolvedRoot, fullPath);
        const posixRel = relPath.replace(/\\/g, '/');
        const ubicacion = getUbicacionScore(posixRel);

        // Validar alcance: raíz, docs/** o README de subproyecto
        const isRoot = ubicacion === 0;
        const isDocs = ubicacion === 1;
        const isSubReadme = ubicacion === 2 && /^readme(\..+)?$/i.test(entry);

        if (!isRoot && !isDocs && !isSubReadme) {
          continue;
        }

        const esIngerible = INGESTIBLE_EXTENSIONS.has(ext) && st.size <= MAX_FILE_SIZE_BYTES;
        const cleanNombre = sanitizeDomString(entry, 200);
        const nombreScore = getNombreScore(cleanNombre);

        candidatosRaw.push({
          path: posixRel,
          nombre: cleanNombre,
          es_ingerible: esIngerible,
          tamano_bytes: st.size,
          nombreScore,
          ubicacionScore: ubicacion,
        });
      }
    }
  }

  explorar(resolvedRoot, 0);

  // Ordenamiento determinista:
  // 1. nombreScore (menor a mayor)
  // 2. ubicacionScore (raíz=0 > docs=1 > subproyecto=2)
  // 3. ruta POSIX alfabética
  candidatosRaw.sort((a, b) => {
    if (a.nombreScore !== b.nombreScore) return a.nombreScore - b.nombreScore;
    if (a.ubicacionScore !== b.ubicacionScore) return a.ubicacionScore - b.ubicacionScore;
    return a.path.localeCompare(b.path);
  });

  const finalDocumentos: DocumentoCandidato[] = candidatosRaw.slice(0, MAX_CANDIDATES).map((c, idx) => ({
    path: c.path,
    nombre: c.nombre,
    es_ingerible: c.es_ingerible,
    tamano_bytes: c.tamano_bytes,
    ranking: idx,
  }));

  // Detectar package.json raíz si existe
  let packageJsonInfo: PackageJsonInfo | undefined;
  const pkgPath = join(resolvedRoot, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const rawPkg = readFileSync(pkgPath, 'utf-8');
      const parsed = JSON.parse(rawPkg) as Record<string, unknown>;
      const name = typeof parsed.name === 'string' ? sanitizeDomString(parsed.name, 80) : undefined;
      const description = typeof parsed.description === 'string' ? sanitizeDomString(parsed.description, 200) : undefined;

      if (name || description) {
        packageJsonInfo = { name, description };
      }
    } catch {
      // Ignorar errores de lectura o parsing de package.json
    }
  }

  // Detectar subproyectos y servicios con evidencia
  const subproyectos = detectarSubproyectos(resolvedRoot);
  const servicios = detectarServiciosConEvidencia(resolvedRoot, subproyectos);

  return {
    documentos: finalDocumentos,
    package_json: packageJsonInfo,
    subproyectos,
    servicios,
  };
}

/**
 * Detecta subproyectos en carpetas con package.json identificando nombre y framework (E1d / P4.3).
 */
export function detectarSubproyectos(workspaceRoot: string): ScanSubproyecto[] {
  const resolvedRoot = resolve(workspaceRoot);
  const subproyectos: ScanSubproyecto[] = [];

  let realWorkspaceRoot: string;
  try {
    realWorkspaceRoot = realpathSync(resolvedRoot);
  } catch {
    realWorkspaceRoot = resolvedRoot;
  }
  const normRealWorkspace = realWorkspaceRoot.replace(/\\/g, '/').toLowerCase();

  function buscar(dirActual: string, depth: number) {
    if (depth > MAX_DEPTH) return;

    let entries: string[];
    try {
      entries = readdirSync(dirActual);
    } catch {
      return;
    }

    entries.sort();

    for (const entry of entries) {
      if (IGNORED_DIRS.has(entry) || entry.startsWith('.')) continue;

      const fullPath = join(dirActual, entry);
      let realPath: string;
      try {
        realPath = realpathSync(fullPath);
      } catch {
        continue;
      }
      if (!realPath.replace(/\\/g, '/').toLowerCase().startsWith(normRealWorkspace)) continue;

      let st;
      try {
        st = statSync(fullPath);
      } catch {
        continue;
      }

      if (st.isDirectory()) {
        const pkgFile = join(fullPath, 'package.json');
        if (existsSync(pkgFile)) {
          const relDir = relative(resolvedRoot, fullPath).replace(/\\/g, '/');
          let pkgName = entry;
          let framework = 'node';

          try {
            const rawPkg = readFileSync(pkgFile, 'utf-8');
            const parsed = JSON.parse(rawPkg) as Record<string, unknown>;
            if (typeof parsed.name === 'string' && parsed.name.trim()) {
              pkgName = sanitizeDomString(parsed.name.trim(), 80);
            }
            const deps = {
              ...((parsed.dependencies as Record<string, string>) || {}),
              ...((parsed.devDependencies as Record<string, string>) || {}),
            };

            if ('vite' in deps) framework = 'vite';
            else if ('next' in deps) framework = 'next';
            else if ('@nestjs/core' in deps) framework = 'nestjs';
            else if ('express' in deps) framework = 'express';
            else if ('fastify' in deps) framework = 'fastify';
            else if ('react' in deps || 'react-dom' in deps) framework = 'react';
            else if ('vue' in deps) framework = 'vue';
            else if ('@angular/core' in deps) framework = 'angular';
            else if ('svelte' in deps) framework = 'svelte';
            else if ('astro' in deps) framework = 'astro';
          } catch {
            // Ignorar errores
          }

          subproyectos.push({
            path: relDir,
            name: pkgName,
            framework,
          });
        }

        buscar(fullPath, depth + 1);
      }
    }
  }

  buscar(resolvedRoot, 1);
  return subproyectos;
}

/**
 * Detecta URLs y servicios con evidencia concreta en el workspace (E1c / P4.3).
 * Inspecciona: package.json (scripts dev), vite.config (port), .env.example, docker-compose.
 * Sin evidencia, NO devuelve puerto ni servicio por defecto.
 */
export function detectarServiciosConEvidencia(
  workspaceRoot: string,
  subproyectos: ScanSubproyecto[] = []
): ScanServicio[] {
  const resolvedRoot = resolve(workspaceRoot);
  const servicios: ScanServicio[] = [];
  const visitedUrls = new Set<string>();

  function registrar(url: string, label: string, evidencia: string) {
    if (!visitedUrls.has(url)) {
      visitedUrls.add(url);
      servicios.push({ url, label, evidencia });
    }
  }

  // 1. vite.config en raíz o en subproyectos
  const viteCandidates = [
    'vite.config.ts',
    'vite.config.js',
    'vite.config.mjs',
    ...subproyectos.flatMap((s) => [
      `${s.path}/vite.config.ts`,
      `${s.path}/vite.config.js`,
      `${s.path}/vite.config.mjs`,
    ]),
  ];

  for (const vc of viteCandidates) {
    const fullVitePath = join(resolvedRoot, vc);
    if (existsSync(fullVitePath)) {
      try {
        const content = readFileSync(fullVitePath, 'utf-8');
        const portMatch = content.match(/port:\s*(\d+)/);
        const port = portMatch ? portMatch[1] : '5173';
        const label = vc.includes('/') ? `Frontend Vite (${vc.split('/')[0]})` : 'Frontend Vite';
        const evidencia = portMatch ? `${vc} (server.port)` : `${vc} (puerto por defecto Vite)`;
        registrar(`http://localhost:${port}`, label, evidencia);
      } catch {
        // Ignorar
      }
    }
  }

  // 2. package.json scripts (raíz y subproyectos)
  const pkgPaths = ['package.json', ...subproyectos.map((s) => `${s.path}/package.json`)];
  for (const pp of pkgPaths) {
    const fullPkgPath = join(resolvedRoot, pp);
    if (existsSync(fullPkgPath)) {
      try {
        const rawPkg = readFileSync(fullPkgPath, 'utf-8');
        const parsed = JSON.parse(rawPkg) as Record<string, unknown>;
        const scripts = (parsed.scripts as Record<string, string>) || {};
        const devScript = scripts.dev || scripts.start;
        if (devScript) {
          const portMatch = devScript.match(/(?:--port|-p|\bPORT=)\s*(\d+)/i);
          if (portMatch) {
            const port = portMatch[1];
            const pkgName = typeof parsed.name === 'string' ? parsed.name : pp;
            registrar(`http://localhost:${port}`, `Servicio ${pkgName}`, `${pp} (scripts: ${devScript})`);
          } else if (/\bnext\s+dev\b/i.test(devScript)) {
            registrar('http://localhost:3000', 'Next.js Frontend', `${pp} (scripts.dev: next dev)`);
          } else if (/\bvite\b/i.test(devScript) && !servicios.some((s) => s.url.includes('5173'))) {
            registrar('http://localhost:5173', 'Frontend Vite', `${pp} (scripts.dev: vite)`);
          }
        }
      } catch {
        // Ignorar
      }
    }
  }

  // 3. .env.example (NUNCA lee .env, .env.local ni .env.*.local)
  const envCandidates = ['.env.example', ...subproyectos.map((s) => `${s.path}/.env.example`)];
  for (const ec of envCandidates) {
    const fullEnvPath = join(resolvedRoot, ec);
    if (existsSync(fullEnvPath)) {
      try {
        const content = readFileSync(fullEnvPath, 'utf-8');
        const portMatch = content.match(/^(?:PORT|VITE_PORT|APP_PORT)=(\d+)/m);
        if (portMatch) {
          const key = portMatch[0].split('=')[0];
          const port = portMatch[1];
          registrar(`http://localhost:${port}`, 'Servicio configurado en ENV', `${ec} (${key})`);
        }
        const urlMatch = content.match(/^(?:APP_URL|BASE_URL|API_URL)=(https?:\/\/[^\s]+)/m);
        if (urlMatch) {
          const key = urlMatch[0].split('=')[0];
          let cleanUrl = urlMatch[1].trim();
          try {
            const parsedUrl = new URL(cleanUrl);
            parsedUrl.username = '';
            parsedUrl.password = '';
            cleanUrl = parsedUrl.toString().replace(/\/$/, '');
          } catch {
            // Ignorar error de parsing
          }
          registrar(cleanUrl, 'URL configurada en ENV', `${ec} (${key})`);
        }
      } catch {
        // Ignorar
      }
    }
  }

  // 4. docker-compose*.yml y compose.y*ml
  const composeCandidates: string[] = [];
  const searchDirs = ['', ...subproyectos.map((s) => s.path)];
  for (const d of searchDirs) {
    const dirAbs = d ? join(resolvedRoot, d) : resolvedRoot;
    if (existsSync(dirAbs)) {
      try {
        const files = readdirSync(dirAbs);
        for (const f of files) {
          if (/^(?:docker-compose.*\.ya?ml|compose\.ya?ml)$/i.test(f)) {
            composeCandidates.push(d ? `${d}/${f}` : f);
          }
        }
      } catch {
        // Ignorar
      }
    }
  }

  for (const cc of composeCandidates) {
    const fullComposePath = join(resolvedRoot, cc);
    if (existsSync(fullComposePath)) {
      try {
        const content = readFileSync(fullComposePath, 'utf-8');
        const portMatch = content.match(/-\s*["']?(\d+):(\d+)["']?/);
        if (portMatch) {
          const hostPort = portMatch[1];
          registrar(`http://localhost:${hostPort}`, 'Servicio Docker Compose', `${cc} (ports: ${hostPort}:${portMatch[2]})`);
        }
      } catch {
        // Ignorar
      }
    }
  }

  return servicios;
}

/**
 * Resuelve un nombre libre del usuario contra los candidatos detectados y, si no,
 * contra el filesystem dentro del workspace (E1b / P4.3).
 *
 * Características:
 * - Soporta nombres exactos ("PRD_diff.md"), libres ("el prd", "PRD diff") y sin extensión ("PRD_diff").
 * - Devuelve DocumentoCandidato o null si no existe.
 * - Desecha symlinks o referencias fuera del workspace (realpath).
 * - NUNCA lanza excepciones.
 */
export function resolverDocumento(workspaceRoot: string, texto: string): DocumentoCandidato | null {
  try {
    if (!texto || typeof texto !== 'string' || !texto.trim()) {
      return null;
    }

    const resolvedRoot = resolve(workspaceRoot);
    if (!existsSync(resolvedRoot)) {
      return null;
    }

    let realWorkspaceRoot: string;
    try {
      realWorkspaceRoot = realpathSync(resolvedRoot);
    } catch {
      realWorkspaceRoot = resolvedRoot;
    }
    const normRealWorkspace = realWorkspaceRoot.replace(/\\/g, '/').toLowerCase();

    // Limpieza del texto de entrada
    const rawClean = texto.trim().replace(/^["'`]|["'`]$/g, '').trim();
    // Eliminar artículos y conectores comunes en español recursivamente
    let cleanNoArticle = rawClean;
    const stripWords = ['el', 'la', 'mi', 'un', 'una', 'archivo', 'documento'];
    let changed = true;
    while (changed) {
      changed = false;
      for (const w of stripWords) {
        const regex = new RegExp(`^${w}\\s+`, 'i');
        if (regex.test(cleanNoArticle)) {
          cleanNoArticle = cleanNoArticle.replace(regex, '').trim();
          changed = true;
        }
      }
    }

    // 1. Buscar en los candidatos detectados por ranking
    const hallazgos = detectarDocumentosProyecto(resolvedRoot);
    const candidatos = hallazgos.documentos;

    const trials = [rawClean.toLowerCase(), cleanNoArticle.toLowerCase()];

    for (const t of trials) {
      if (!t) continue;

      // Coincidencia exacta de ruta relativa
      const matchPath = candidatos.find((c) => c.path.toLowerCase() === t);
      if (matchPath) return matchPath;

      // Coincidencia exacta de nombre de archivo
      const matchNombre = candidatos.find((c) => c.nombre.toLowerCase() === t);
      if (matchNombre) return matchNombre;

      // Coincidencia de nombre sin extensión
      const matchSinExt = candidatos.find(
        (c) => c.nombre.replace(/\.[^.]+$/, '').toLowerCase() === t
      );
      if (matchSinExt) return matchSinExt;
    }

    // Coincidencia difusa de palabras clave de alto rango ("prd", "spec", etc.)
    if (/^prd([_\s-]|$)/i.test(cleanNoArticle) || cleanNoArticle.toLowerCase() === 'prd') {
      const topPrd = candidatos.find((c) => c.nombre.toLowerCase().includes('prd'));
      if (topPrd) return topPrd;
    }

    // 2. Si no está en candidatos, buscar directamente en el filesystem dentro del workspace
    const pathTrials = [
      rawClean,
      cleanNoArticle,
      `${cleanNoArticle}.md`,
      `${cleanNoArticle}.markdown`,
      `${cleanNoArticle}.txt`,
      `${rawClean}.md`,
      `${rawClean}.markdown`,
      `${rawClean}.txt`,
    ];

    for (const pt of pathTrials) {
      const fullPath = resolve(resolvedRoot, pt);
      if (!existsSync(fullPath)) continue;

      let realDocPath: string;
      try {
        realDocPath = realpathSync(fullPath);
      } catch {
        continue;
      }

      // Validar que no escape del workspace
      const normDoc = realDocPath.replace(/\\/g, '/').toLowerCase();
      if (!normDoc.startsWith(normRealWorkspace)) {
        return null;
      }

      let st;
      try {
        st = statSync(realDocPath);
      } catch {
        continue;
      }

      if (st.isFile()) {
        const ext = extname(realDocPath).toLowerCase();
        const esIngerible = INGESTIBLE_EXTENSIONS.has(ext) && st.size <= MAX_FILE_SIZE_BYTES;
        const posixRel = relative(realWorkspaceRoot, realDocPath).replace(/\\/g, '/');

        return {
          path: posixRel,
          nombre: sanitizeDomString(basename(realDocPath), 200),
          es_ingerible: esIngerible,
          tamano_bytes: st.size,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Genera el payload canónico para .qa/project/scan.json (E1e / P4.3).
 */
export function generarScan(workspaceRoot: string): ProjectScan {
  const resolvedRoot = resolve(workspaceRoot);
  const hallazgos = detectarDocumentosProyecto(resolvedRoot);

  const docsScan: ScanDocumento[] = hallazgos.documentos.map((d, idx) => ({
    path: d.path,
    nombre: d.nombre,
    es_ingerible: d.es_ingerible,
    tamano_bytes: d.tamano_bytes,
    ranking: idx,
  }));

  const scan: ProjectScan = {
    _version: '1',
    scanned_at: new Date().toISOString(),
    workspace_root: resolvedRoot.replace(/\\/g, '/'),
    documentos: docsScan,
    subproyectos: hallazgos.subproyectos || [],
    servicios: hallazgos.servicios || [],
    package_json: hallazgos.package_json,
  };

  return scan;
}
