import { existsSync, readdirSync, statSync, readFileSync, realpathSync } from 'node:fs';
import { resolve, relative, join, extname } from 'node:path';

import { sanitizeDomString } from '@qap/engine';

export interface DocumentoCandidato {
  path: string;
  nombre: string;
  es_ingerible: boolean;
  tamano_bytes: number;
}

export interface PackageJsonInfo {
  name?: string;
  description?: string;
}

export interface HallazgosProyecto {
  documentos: DocumentoCandidato[];
  package_json?: PackageJsonInfo;
}

const IGNORED_DIRS = new Set(['node_modules', '.git', '.qa', 'dist', 'build']);
const INGESTIBLE_EXTENSIONS = new Set(['.md', '.markdown', '.txt']);
const MAX_FILE_SIZE_BYTES = 512 * 1024; // 512 KB
const MAX_CANDIDATES = 10;
const MAX_DEPTH = 3;

/**
 * Detecta candidatos a documentos de especificación en el workspace del usuario (E2a / P4.2).
 *
 * Criterios canónicos:
 * - Candidatos por nombre:
 *     - README* (ej: README.md, README.txt)
 *     - PRD* (ej: PRD.md, prd.markdown)
 *     - docs/ con nombres tipo prd/spec/requisitos/alcance
 *     - openapi.* y swagger.* (ej: openapi.yaml, swagger.json)
 * - Profundidad <= 3
 * - Máximo 10 candidatos
 * - Ignorando node_modules, .git, .qa, dist, build
 * - Realpath dentro del workspace (symlinks que escapan se descartan)
 * - Devuelve rutas relativas POSIX y si son ingeribles (.md/.markdown/.txt, <= 512 KB)
 * - NUNCA devuelve contenido.
 * - Lee también package.json (name, description) sanitizado y acotado.
 */
export function detectarDocumentosProyecto(workspaceRoot: string): HallazgosProyecto {
  const resolvedRoot = resolve(workspaceRoot);
  if (!existsSync(resolvedRoot)) {
    return { documentos: [] };
  }

  let realWorkspaceRoot: string;
  try {
    realWorkspaceRoot = realpathSync(resolvedRoot);
  } catch {
    realWorkspaceRoot = resolvedRoot;
  }
  const normRealWorkspace = realWorkspaceRoot.replace(/\\/g, '/').toLowerCase();

  const candidatos: DocumentoCandidato[] = [];

  function esCandidato(fileName: string, relPath: string): boolean {
    const base = fileName.toLowerCase();
    const cleanBase = sanitizeDomString(base).toLowerCase();

    // 1. README*
    if (/^readme(\..+)?$/i.test(cleanBase)) {
      return true;
    }

    // 2. PRD*
    if (/^prd(\..+)?$/i.test(cleanBase)) {
      return true;
    }

    // 3. openapi.* o swagger.*
    if (/^(openapi|swagger)\..+$/i.test(cleanBase)) {
      return true;
    }

    // 4. docs/ con nombres tipo prd, spec, requisitos, alcance
    const normRel = relPath.replace(/\\/g, '/').toLowerCase();
    if (normRel.startsWith('docs/')) {
      if (/prd|spec|requisito|alcance/i.test(cleanBase)) {
        return true;
      }
    }

    return false;
  }

  function explorar(dirActual: string, depth: number) {
    if (depth > MAX_DEPTH || candidatos.length >= MAX_CANDIDATES) {
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
      if (candidatos.length >= MAX_CANDIDATES) break;

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
        const relPath = relative(resolvedRoot, fullPath);
        if (esCandidato(entry, relPath)) {
          const ext = extname(entry).toLowerCase();
          const esIngerible = INGESTIBLE_EXTENSIONS.has(ext) && st.size <= MAX_FILE_SIZE_BYTES;
          const posixRel = relPath.replace(/\\/g, '/');
          const cleanNombre = sanitizeDomString(entry);

          candidatos.push({
            path: posixRel,
            nombre: cleanNombre,
            es_ingerible: esIngerible,
            tamano_bytes: st.size,
          });
        }
      }
    }
  }

  explorar(resolvedRoot, 0);

  // Leer package.json si existe
  let packageJsonInfo: PackageJsonInfo | undefined;
  const pkgPath = join(resolvedRoot, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const rawPkg = readFileSync(pkgPath, 'utf-8');
      const parsed = JSON.parse(rawPkg) as Record<string, unknown>;
      const name = typeof parsed.name === 'string' ? sanitizeDomString(parsed.name).slice(0, 80) : undefined;
      const description = typeof parsed.description === 'string' ? sanitizeDomString(parsed.description).slice(0, 150) : undefined;

      if (name || description) {
        packageJsonInfo = {
          name,
          description,
        };
      }
    } catch {
      // Ignorar errores de lectura o parsing de package.json
    }
  }

  return {
    documentos: candidatos.slice(0, MAX_CANDIDATES),
    package_json: packageJsonInfo,
  };
}
