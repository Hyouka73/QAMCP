import type { IStorage } from '@qap/engine';
import type { ModuleContext, RepoMap } from '@qap/shared';
import { normalizeToPosix } from '@qap/shared';

export interface BootstrapContextOptions {
  prdContent?: string;
  prdSource?: string;
  objective?: string;
  users?: string[];
  routes?: string[];
  risks?: string[];
  notes?: string;
  sensitiveSelectors?: string[];
}

export interface BootstrapModuleOptions extends BootstrapContextOptions {
  moduleName: string;
  sourceFiles?: string[];
}

export interface BootstrapResult {
  context: ModuleContext;
  repoMap?: RepoMap;
}

/**
 * Parsea un documento de especificación (PRD en Markdown, Notion export o README)
 * y extrae los campos clave: objective, users, routes, risks, notes.
 */
export function parsePrdContent(content: string, prdSource?: string): Partial<ModuleContext> {
  const result: Partial<ModuleContext> = {
    users: [],
    routes: [],
    risks: [],
    sensitive_selectors: [],
    prd_source: prdSource || '',
  };

  if (!content || typeof content !== 'string') {
    return result;
  }

  const lines = content.split(/\r?\n/);
  let currentSection: 'none' | 'objective' | 'users' | 'routes' | 'risks' | 'notes' | 'sensitive' = 'none';
  const objectiveLines: string[] = [];
  const notesLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Detección de encabezados (Markdown #, ##, ###, o negrita **Seccion**)
    const headingMatch = line.match(/^(?:#{1,6}\s+|\*\*)(.+?)(?:\*\*|:)?$/i);
    if (headingMatch) {
      const heading = headingMatch[1].trim().toLowerCase();

      if (heading.includes('objetiv') || heading.includes('objective') || heading.includes('goal') || heading.includes('propósito') || heading.includes('proposito')) {
        currentSection = 'objective';
        continue;
      } else if (heading.includes('usuari') || heading.includes('user') || heading.includes('rol') || heading.includes('actor')) {
        currentSection = 'users';
        continue;
      } else if (heading.includes('ruta') || heading.includes('route') || heading.includes('url') || heading.includes('pantalla') || heading.includes('screen') || heading.includes('path')) {
        currentSection = 'routes';
        continue;
      } else if (heading.includes('riesgo') || heading.includes('risk') || heading.includes('peligro')) {
        currentSection = 'risks';
        continue;
      } else if (heading.includes('sensible') || heading.includes('sensitive') || heading.includes('pii')) {
        currentSection = 'sensitive';
        continue;
      } else if (heading.includes('nota') || heading.includes('note') || heading.includes('context') || heading.includes('observaci') || heading.includes('descrip')) {
        currentSection = 'notes';
        continue;
      }
    }

    // Procesamiento según la sección activa
    if (line === '') continue;

    // Bullet point: "- item", "* item", "1. item"
    const bulletMatch = line.match(/^(?:[-*+]|\d+\.)\s+(.+)$/);
    const itemText = bulletMatch ? bulletMatch[1].trim() : line;

    switch (currentSection) {
      case 'objective':
        objectiveLines.push(itemText);
        break;
      case 'users':
        if (bulletMatch || line.length < 100) {
          result.users?.push(itemText);
        }
        break;
      case 'routes':
        if (bulletMatch || line.startsWith('/') || line.startsWith('http')) {
          result.routes?.push(itemText);
        }
        break;
      case 'risks':
        result.risks?.push(itemText);
        break;
      case 'sensitive':
        result.sensitive_selectors?.push(itemText);
        break;
      case 'notes':
        notesLines.push(rawLine);
        break;
      default:
        // Si no hay sección activa y es el primer texto significativo, tomarlo como parte del objetivo o notas
        if (objectiveLines.length === 0 && !line.startsWith('#')) {
          objectiveLines.push(line);
        }
        break;
    }
  }

  if (objectiveLines.length > 0) {
    result.objective = objectiveLines.join(' ').trim();
  }

  if (notesLines.length > 0) {
    result.notes = notesLines.join('\n').trim();
  }

  return result;
}

/**
 * Genera el esqueleto inicial de ModuleContext a partir de opciones o PRD,
 * garantizando _version: '1' y manually_edited: false.
 */
export function buildModuleContext(moduleName: string, options: BootstrapContextOptions = {}): ModuleContext {
  const parsed = options.prdContent ? parsePrdContent(options.prdContent, options.prdSource) : {};

  const objective = options.objective || parsed.objective || `Módulo ${moduleName}`;
  const users = options.users && options.users.length > 0 ? options.users : parsed.users || [];
  const routes = options.routes && options.routes.length > 0 ? options.routes : parsed.routes || [];
  const risks = options.risks && options.risks.length > 0 ? options.risks : parsed.risks || [];
  const notes = options.notes !== undefined ? options.notes : parsed.notes || '';
  const sensitiveSelectors =
    options.sensitiveSelectors && options.sensitiveSelectors.length > 0
      ? options.sensitiveSelectors
      : parsed.sensitive_selectors || [];
  const prdSource = options.prdSource || parsed.prd_source || '';

  const context: ModuleContext = {
    _version: '1',
    objective,
    users,
    routes,
    risks,
    notes,
    sensitive_selectors: sensitiveSelectors,
    manually_edited: false,
  };

  if (prdSource) {
    context.prd_source = prdSource;
  }

  return context;
}

/**
 * Genera un RepoMap normalizando forzosamente todas las rutas con separadores POSIX (/).
 */
export function buildRepoMap(moduleName: string, sourceFiles: string[] = []): RepoMap {
  return {
    _version: '1',
    module: moduleName,
    files: sourceFiles.map(normalizeToPosix),
  };
}

/**
 * Orquesta el bootstrap de un módulo en IStorage:
 * 1. Genera y guarda context.yaml (.qa/modules/<name>/context.yaml) con manually_edited: false
 * 2. Si se proveen sourceFiles, genera y guarda repo-map.json con rutas POSIX
 */
export async function bootstrapModule(
  storage: IStorage,
  options: BootstrapModuleOptions
): Promise<BootstrapResult> {
  const { moduleName, sourceFiles, ...contextOptions } = options;

  const context = buildModuleContext(moduleName, contextOptions);
  await storage.saveModuleContext(moduleName, context);

  let repoMap: RepoMap | undefined;
  if (sourceFiles && sourceFiles.length > 0) {
    repoMap = buildRepoMap(moduleName, sourceFiles);
    await storage.saveRepoMap(moduleName, repoMap);
  }

  return { context, repoMap };
}
