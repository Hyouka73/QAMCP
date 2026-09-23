import { basename } from 'node:path';

import type { IStorage } from '@qap/engine';
import type { FlowDefinition, ModuleContext, RepoMap } from '@qap/shared';

export type SurfaceType = 'tab' | 'modal' | 'drawer' | 'section';

export interface SurfaceNode {
  id: string;
  name: string;
  type: SurfaceType;
}

export interface ViewNode {
  id: string;
  name: string;
  path: string;
  surfaces: SurfaceNode[];
}

export interface ModuleArchitectureNode {
  id: string;
  label: string;
  description?: string;
  objective?: string;
  baseRoute: string;
  views: ViewNode[];
  filesCount: number;
  sensitiveSelectors: string[];
  hasTests: boolean;
  testsCount: number;
  /** Etiquetas semánticas para agrupar en el grafo */
  tags: string[];
  /** Si forma parte del camino crítico del usuario */
  criticalPath: boolean;
  /** Equipo responsable */
  owner: string;
  /** Estado de salud del módulo */
  healthStatus: 'healthy' | 'degraded' | 'unknown';
  /** Relaciones explícitas con otros módulos */
  relatedModules: string[];
  /** Usuarios/roles que interactúan con este módulo */
  users: string[];
  /** Riesgos de QA identificados */
  risks: string[];
}

/** Alias para compatibilidad hacia atrás */
export type GraphNode = ModuleArchitectureNode;

export type EdgeType = 'prereq' | 'flow' | 'related' | 'shared-context';

export interface GraphEdge {
  from: string;
  to: string;
  label?: string;
  type: EdgeType;
  /**
   * Peso de la arista (1 = normal, 2 = importante, 3 = crítica).
   * El visor puede usar este valor para dibujar aristas más gruesas.
   */
  weight?: number;
}

export interface ExecutionStepInfo {
  name: string;
  status: 'success' | 'failure' | 'error' | 'skipped';
  duration_ms: number;
  message?: string;
  screenshot?: string;
}

export interface RecentExecution {
  id: string;
  timestamp: string;
  module: string;
  result: string;
  status: string;
  environment?: string;
  totalDurationMs?: number;
  testedFeatures?: string[];
  piiMaskedCount?: number;
  assertionsPassed?: number;
  browser?: string;
  operator?: string;
  steps: ExecutionStepInfo[];
  screenshots: string[];
  screenshotDetails?: Array<{
    path: string;
    url: string;
    timestamp?: string;
    context?: string;
  }>;
}

/** Resumen de un flow multi-módulo para el visor */
export interface FlowSummary {
  id: string;
  name: string;
  description?: string;
  modules: string[];
  failFast: boolean;
}

/** Estadísticas globales del grafo para el visor */
export interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  edgesByType: Record<EdgeType, number>;
  criticalPathModules: string[];
  mostConnectedModule: string | null;
  tagGroups: Record<string, string[]>;
}

export interface KnowledgeGraphPayload {
  projectName: string;
  generatedAt: string;
  nodes: ModuleArchitectureNode[];
  edges: GraphEdge[];
  modulesDetail: Record<string, unknown>;
  recentExecutions: RecentExecution[];
  /** Lista de flows multi-módulo para dibujar caminos en el visor */
  flows: FlowSummary[];
  /** Métricas globales del grafo */
  graphStats: GraphStats;
}

/**
 * Normaliza una ruta de captura de pantalla a una URL servida por el endpoint /artifacts/
 */
function normalizeScreenshotUrl(pathOrUrl: string, executionId?: string): string {
  if (pathOrUrl.startsWith('/artifacts/')) return pathOrUrl;
  const cleaned = pathOrUrl.replace(/^\.?\/?\.qa\/executions\//, '').replace(/^\/+/, '');
  if (executionId && !cleaned.startsWith(executionId)) {
    return `/artifacts/${executionId}/${cleaned}`;
  }
  return `/artifacts/${cleaned}`;
}

/**
 * Extrae un ViewNode tipado a partir de los datos crudos del context.yaml
 * Soporta tanto el formato v2 (ModuleContext.views) como el fallback de v1 (routes[]).
 */
function extractViews(moduleContext: ModuleContext | null): ViewNode[] {
  if (!moduleContext) return [];

  // v2: usa el array de views con superficies anidadas
  if (Array.isArray(moduleContext.views) && moduleContext.views.length > 0) {
    return moduleContext.views.map((v) => ({
      id: v.id,
      name: v.name ?? v.id,
      path: v.path ?? '',
      surfaces: (v.surfaces ?? []).map((s) => ({
        id: s.id,
        name: s.name ?? s.id,
        type: s.type,
      })),
    }));
  }

  // v1 fallback: usa routes[] como lista plana sin superficies
  if (Array.isArray(moduleContext.routes) && moduleContext.routes.length > 0) {
    return moduleContext.routes.map((r) => ({
      id: r.replace(/^\//, '').replace(/[/\-_]/g, '-') || 'default-view',
      name: r,
      path: r,
      surfaces: [],
    }));
  }

  return [];
}

/**
 * Calcula el estado de salud derivado de las ejecuciones recientes de un módulo.
 * Si el context.yaml ya define un health_status explícito, ese tiene prioridad
 * solo cuando no hay ejecuciones para sobreescribirlo.
 */
function deriveHealthStatus(
  moduleName: string,
  recentExecutions: RecentExecution[],
  explicitStatus?: string,
): 'healthy' | 'degraded' | 'unknown' {
  const moduleExecutions = recentExecutions.filter((e) => e.module === moduleName);
  if (moduleExecutions.length === 0) {
    // Sin ejecuciones: usar el valor explícito del context.yaml, o 'unknown'
    if (explicitStatus === 'healthy' || explicitStatus === 'degraded') {
      return explicitStatus;
    }
    return 'unknown';
  }

  // Tomar las 5 ejecuciones más recientes
  const recent = moduleExecutions.slice(0, 5);
  const passed = recent.filter(
    (e) => e.status === 'success' || e.status === 'completed' || e.result === 'success',
  ).length;

  if (passed === recent.length) return 'healthy';
  if (passed === 0) return 'degraded';
  return 'degraded'; // Parcialmente fallando sigue siendo degraded
}

/**
 * Construye el payload del grafo de conocimiento a partir de la memoria .qa/
 * utilizando la interfaz de almacenamiento IStorage y el modelo universal de arquitectura.
 */
export async function buildKnowledgeGraph(storage: IStorage): Promise<KnowledgeGraphPayload> {
  // 1. Extraer nombre del proyecto
  let projectName = 'qap-project';
  try {
    const projCtx = await storage.getProjectContext();
    if (projCtx?.project_name) {
      projectName = projCtx.project_name;
    } else {
      const root = storage.getProjectRoot();
      const base = basename(root);
      if (base) projectName = base;
    }
  } catch {
    try {
      const root = storage.getProjectRoot();
      const base = basename(root);
      if (base) projectName = base;
    } catch {
      // Usar nombre por defecto si no es posible obtenerlo
    }
  }

  // 2. Extraer ejecuciones y evidencias recientes (.qa/executions/)
  const recentExecutions: RecentExecution[] = [];
  const executionsCountByModule: Record<string, number> = {};

  try {
    const executionsExists = await storage.exists('.qa/executions');
    if (executionsExists) {
      const entries = await storage.list('.qa/executions');
      for (const entry of entries) {
        const entryPath = `.qa/executions/${entry}`;
        if (entry.endsWith('.json')) {
          try {
            const execData = await storage.readJson<Record<string, unknown>>(entryPath);
            const id = (execData.execution_id as string) || (execData.id as string) || entry.replace(/\.json$/, '');
            const timestamps = execData.timestamps as Record<string, string> | undefined;
            const timestamp = timestamps?.started_at || timestamps?.ended_at || new Date().toISOString();
            const module = (execData.module as string) || 'unknown';
            const result = (execData.status as string) || 'completed';
            const metadata = (execData.metadata as Record<string, unknown>) || {};
            const rawSteps = (execData.steps as Array<Record<string, unknown>>) || [];
            const steps: ExecutionStepInfo[] = rawSteps.map((s) => ({
              name: (s.name as string) || 'Paso sin nombre',
              status: (s.status as ExecutionStepInfo['status']) || 'success',
              duration_ms: typeof s.duration_ms === 'number' ? s.duration_ms : 0,
              message: (s.message as string) || '',
              screenshot: s.screenshot ? normalizeScreenshotUrl(s.screenshot as string, id) : undefined,
            }));

            const rawScreenshots = (execData.screenshots as Array<{ path: string; timestamp?: string; context?: string } | string>) || [];
            const screenshots: string[] = [];
            const screenshotDetails: RecentExecution['screenshotDetails'] = [];

            for (const s of rawScreenshots) {
              const p = typeof s === 'string' ? s : s.path;
              const url = normalizeScreenshotUrl(p, id);
              screenshots.push(url);
              screenshotDetails.push({
                path: p,
                url,
                timestamp: typeof s === 'object' ? s.timestamp : undefined,
                context: typeof s === 'object' ? s.context : undefined,
              });
            }

            recentExecutions.push({
              id,
              timestamp,
              module,
              result,
              status: result,
              environment: (metadata.environment as string) || 'staging',
              totalDurationMs: typeof metadata.total_duration_ms === 'number'
                ? metadata.total_duration_ms
                : steps.reduce((acc, step) => acc + step.duration_ms, 0),
              testedFeatures: Array.isArray(metadata.tested_features) ? (metadata.tested_features as string[]) : [],
              piiMaskedCount: typeof metadata.pii_masked_count === 'number' ? metadata.pii_masked_count : 0,
              assertionsPassed: typeof metadata.assertions_passed === 'number' ? metadata.assertions_passed : 0,
              browser: (metadata.browser as string) || 'Chromium Headless',
              operator: (metadata.operator as string) || 'QAP Engine',
              steps,
              screenshots,
              screenshotDetails,
            });

            executionsCountByModule[module] = (executionsCountByModule[module] || 0) + 1;
          } catch {
            // Ignorar JSON no válido
          }
        } else {
          try {
            const subFiles = await storage.list(entryPath);
            const imageExts = ['.png', '.jpg', '.jpeg', '.webp'];
            const imgFiles = subFiles.filter((f) => imageExts.some((ext) => f.toLowerCase().endsWith(ext)));

            let execModule = 'unknown';
            let execResult = 'completed';
            let execTime = new Date().toISOString();
            let metadata: Record<string, unknown> = {};
            let steps: ExecutionStepInfo[] = [];
            const screenshotDetails: RecentExecution['screenshotDetails'] = [];

            if (subFiles.includes('result.json') || subFiles.includes('execution.json')) {
              const metaFile = subFiles.includes('result.json') ? 'result.json' : 'execution.json';
              try {
                const meta = await storage.readJson<Record<string, unknown>>(`${entryPath}/${metaFile}`);
                if (typeof meta.module === 'string') execModule = meta.module;
                if (typeof meta.status === 'string') execResult = meta.status;
                const ts = meta.timestamps as Record<string, string> | undefined;
                if (ts?.started_at) execTime = ts.started_at;
                if (meta.metadata && typeof meta.metadata === 'object') {
                  metadata = meta.metadata as Record<string, unknown>;
                }
                if (Array.isArray(meta.steps)) {
                  steps = meta.steps.map((s: Record<string, unknown>) => ({
                    name: (s.name as string) || 'Paso',
                    status: (s.status as ExecutionStepInfo['status']) || 'success',
                    duration_ms: typeof s.duration_ms === 'number' ? s.duration_ms : 0,
                    message: (s.message as string) || '',
                    screenshot: s.screenshot ? normalizeScreenshotUrl(s.screenshot as string, entry) : undefined,
                  }));
                }
                if (Array.isArray(meta.screenshots)) {
                  for (const s of meta.screenshots) {
                    const p = typeof s === 'string' ? s : (s as { path: string }).path;
                    const url = normalizeScreenshotUrl(p, entry);
                    screenshotDetails.push({
                      path: p,
                      url,
                      timestamp: typeof s === 'object' ? (s as { timestamp?: string }).timestamp : undefined,
                      context: typeof s === 'object' ? (s as { context?: string }).context : undefined,
                    });
                  }
                }
              } catch {
                // Ignorar
              }
            }

            const screenshots = imgFiles.map((f) => `/artifacts/${entry}/${f}`);
            if (screenshotDetails.length === 0) {
              for (const f of imgFiles) {
                screenshotDetails.push({
                  path: `${entryPath}/${f}`,
                  url: `/artifacts/${entry}/${f}`,
                });
              }
            }

            if (imgFiles.length > 0 || subFiles.length > 0) {
              recentExecutions.push({
                id: entry,
                timestamp: execTime,
                module: execModule,
                result: execResult,
                status: execResult,
                environment: (metadata.environment as string) || 'staging',
                totalDurationMs: typeof metadata.total_duration_ms === 'number'
                  ? metadata.total_duration_ms
                  : steps.reduce((acc, step) => acc + step.duration_ms, 0),
                testedFeatures: Array.isArray(metadata.tested_features) ? (metadata.tested_features as string[]) : [],
                piiMaskedCount: typeof metadata.pii_masked_count === 'number' ? metadata.pii_masked_count : 0,
                assertionsPassed: typeof metadata.assertions_passed === 'number' ? metadata.assertions_passed : 0,
                browser: (metadata.browser as string) || 'Chromium Headless',
                operator: (metadata.operator as string) || 'QAP Engine',
                steps,
                screenshots,
                screenshotDetails,
              });

              executionsCountByModule[execModule] = (executionsCountByModule[execModule] || 0) + 1;
            }
          } catch {
            // Ignorar directorio
          }
        }
      }
    }
  } catch {
    // Ignorar error al leer ejecuciones
  }

  // Ordenar ejecuciones recientes de más nueva a más antigua
  recentExecutions.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  // 3. Extraer módulos y construir nodos de arquitectura universal
  let moduleNames: string[];
  try {
    moduleNames = await storage.listModules();
  } catch {
    moduleNames = [];
  }

  const nodes: ModuleArchitectureNode[] = [];
  const edges: GraphEdge[] = [];
  const modulesDetail: Record<string, unknown> = {};

  const edgeSet = new Set<string>();
  const addEdge = (edge: GraphEdge): void => {
    const key = `${edge.from}->${edge.to}:${edge.type}`;
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      edges.push(edge);
    }
  };

  for (const moduleName of moduleNames) {
    let moduleContext: ModuleContext | null;
    try {
      moduleContext = await storage.getModuleContext(moduleName);
    } catch {
      moduleContext = null;
    }

    let repoMap: RepoMap | null;
    try {
      repoMap = await storage.getRepoMap(moduleName);
    } catch {
      repoMap = null;
    }

    // Extraer selectores DOM estandarizados
    let selectorsObj: Record<string, string> = {};
    try {
      if (typeof storage.getModuleSelectors === 'function') {
        const modSelectors = await storage.getModuleSelectors(moduleName);
        if (modSelectors && typeof modSelectors.selectors === 'object') {
          selectorsObj = modSelectors.selectors;
        }
      } else {
        const modSelectors = await storage.readJson<{ selectors?: Record<string, string> }>(
          `.qa/modules/${moduleName}/selectors.json`
        );
        if (modSelectors && typeof modSelectors.selectors === 'object') {
          selectorsObj = modSelectors.selectors;
        }
      }
    } catch {
      selectorsObj = {};
    }

    // Casos de prueba y validación de cobertura de tests
    let testsCount: number;
    try {
      const testCases = await storage.listTestCases(moduleName);
      testsCount = testCases.length;
    } catch {
      testsCount = 0;
    }

    if (testsCount === 0) {
      try {
        const plan = await storage.getTestPlan(moduleName);
        testsCount = plan?.cases?.length ?? 0;
      } catch {
        // Ignorar plan no disponible
      }
    }

    if (testsCount === 0 && executionsCountByModule[moduleName]) {
      testsCount = executionsCountByModule[moduleName];
    }

    const hasTests = testsCount > 0;

    // Extraer vistas con tipado fuerte (v2) con fallback a v1
    const views = extractViews(moduleContext);

    const baseRoute =
      moduleContext?.base_route ||
      (views.length > 0 ? views[0].path : `/${moduleName}`);

    const description = moduleContext?.description || moduleContext?.objective || '';
    const objective = moduleContext?.objective || '';
    const sensitiveSelectors = moduleContext?.sensitive_selectors ?? [];

    // Derivar health status a partir de ejecuciones reales
    const healthStatus = deriveHealthStatus(
      moduleName,
      recentExecutions,
      moduleContext?.health_status,
    );

    const files = repoMap?.files ?? [];

    const node: ModuleArchitectureNode = {
      id: moduleName,
      label: moduleContext?.module || moduleName,
      description,
      objective,
      baseRoute,
      views,
      filesCount: files.length,
      sensitiveSelectors,
      hasTests,
      testsCount,
      tags: moduleContext?.tags ?? [],
      criticalPath: moduleContext?.critical_path ?? false,
      owner: moduleContext?.owner ?? '',
      healthStatus,
      relatedModules: moduleContext?.related_modules ?? [],
      users: moduleContext?.users ?? [],
      risks: moduleContext?.risks ?? [],
    };

    nodes.push(node);

    modulesDetail[moduleName] = {
      ...moduleContext,
      repoMap,
      files,
      baseRoute,
      views,
      sensitiveSelectors,
      sensitive_selectors: sensitiveSelectors,
      selectors: selectorsObj,
      hasTests,
      testsCount,
      healthStatus,
    };

    // 4. Aristas por Prerrequisitos (.qa/modules/<name>/prereqs.yaml)
    try {
      const prereqs = await storage.getModulePrereqs(moduleName);
      if (prereqs) {
        modulesDetail[moduleName] = {
          ...(modulesDetail[moduleName] as Record<string, unknown>),
          prereqs,
        };

        const rawPrereqs = prereqs as unknown as Record<string, unknown>;
        const requiresObj = (prereqs.requires || rawPrereqs.requires || {}) as Record<string, unknown>;
        const potentialDeps = new Set<string>();

        if (Array.isArray(requiresObj.modules)) {
          for (const m of requiresObj.modules) {
            if (typeof m === 'string') potentialDeps.add(m);
          }
        }
        if (Array.isArray(requiresObj.depends_on)) {
          for (const m of requiresObj.depends_on) {
            if (typeof m === 'string') potentialDeps.add(m);
          }
        }
        if (Array.isArray(rawPrereqs.depends_on)) {
          for (const m of rawPrereqs.depends_on) {
            if (typeof m === 'string') potentialDeps.add(m);
          }
        }

        const authObj = requiresObj.auth as Record<string, unknown> | undefined;
        if (authObj) {
          if (typeof authObj.primary === 'string' && moduleNames.includes(authObj.primary)) {
            potentialDeps.add(authObj.primary);
          } else if (moduleNames.includes('auth')) {
            potentialDeps.add('auth');
          }
        }

        for (const dep of potentialDeps) {
          if (dep && dep !== moduleName) {
            addEdge({
              from: dep,
              to: moduleName,
              label: 'prereq',
              type: 'prereq',
              weight: 2,
            });
          }
        }
      }
    } catch {
      // Prerrequisitos no disponibles para este módulo
    }

    // 5. Aristas por related_modules (relaciones explícitas en context.yaml v2)
    for (const relatedModule of node.relatedModules) {
      if (relatedModule && relatedModule !== moduleName && moduleNames.includes(relatedModule)) {
        addEdge({
          from: moduleName,
          to: relatedModule,
          label: 'related',
          type: 'related',
          weight: 1,
        });
      }
    }
  }

  // 6. Aristas por Flujos Multi-Módulo (.qa/flows/*.yaml)
  const flowSummaries: FlowSummary[] = [];

  try {
    const flowNames = await storage.listFlows();
    for (const flowName of flowNames) {
      try {
        const flow = (await storage.getFlow(flowName)) as FlowDefinition | null;
        if (flow && Array.isArray(flow.modules) && flow.modules.length > 0) {
          const flowLabel = flow.name || flowName;
          const flowModuleNames: string[] = [];

          for (let i = 0; i < flow.modules.length - 1; i++) {
            const current = flow.modules[i]?.module;
            const next = flow.modules[i + 1]?.module;
            if (current) flowModuleNames.push(current);
            if (current && next && current !== next) {
              addEdge({
                from: current,
                to: next,
                label: flowLabel,
                type: 'flow',
                weight: 3,
              });
            }
          }
          // Agregar el último módulo del flow
          const lastMod = flow.modules[flow.modules.length - 1]?.module;
          if (lastMod && !flowModuleNames.includes(lastMod)) {
            flowModuleNames.push(lastMod);
          }

          // Aristas depends_on dentro del flow
          for (const modItem of flow.modules) {
            if (Array.isArray(modItem.depends_on)) {
              for (const dep of modItem.depends_on) {
                if (dep && dep !== modItem.module) {
                  addEdge({
                    from: dep,
                    to: modItem.module,
                    label: flowLabel,
                    type: 'flow',
                    weight: 3,
                  });
                }
              }
            }
          }

          // Aristas shared-context (context_sharing en el flow)
          const rawFlow = flow as unknown as Record<string, unknown>;
          if (Array.isArray(rawFlow.context_sharing)) {
            for (const cs of rawFlow.context_sharing as Array<Record<string, unknown>>) {
              const fromMod = cs.from_module as string | undefined;
              // El target del shared-context es implícito (siguiente módulo en la cadena)
              // Por ahora marcamos solo la arista desde el módulo fuente al módulo receptor
              const toMods = flowModuleNames.filter((m) => m !== fromMod);
              if (fromMod && toMods.length > 0) {
                addEdge({
                  from: fromMod,
                  to: toMods[0],
                  label: `ctx: ${cs.as as string ?? cs.capture as string ?? 'data'}`,
                  type: 'shared-context',
                  weight: 1,
                });
              }
            }
          }

          flowSummaries.push({
            id: flowName,
            name: flowLabel,
            description: typeof rawFlow.description === 'string' ? rawFlow.description : undefined,
            modules: flowModuleNames,
            failFast: typeof flow.fail_fast === 'boolean' ? flow.fail_fast : false,
          });
        }
      } catch {
        // Ignorar flujo con error de lectura
      }
    }
  } catch {
    // Directorio de flujos no disponible
  }

  // 7. Calcular estadísticas globales del grafo
  const edgesByType: Record<EdgeType, number> = {
    prereq: 0,
    flow: 0,
    related: 0,
    'shared-context': 0,
  };
  for (const edge of edges) {
    edgesByType[edge.type] = (edgesByType[edge.type] ?? 0) + 1;
  }

  const criticalPathModules = nodes.filter((n) => n.criticalPath).map((n) => n.id);

  // Módulo más conectado (mayor número de aristas entrantes + salientes)
  const connectionCount: Record<string, number> = {};
  for (const edge of edges) {
    connectionCount[edge.from] = (connectionCount[edge.from] ?? 0) + 1;
    connectionCount[edge.to] = (connectionCount[edge.to] ?? 0) + 1;
  }
  const mostConnectedModule = Object.entries(connectionCount)
    .sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;

  // Agrupación de módulos por tag
  const tagGroups: Record<string, string[]> = {};
  for (const node of nodes) {
    for (const tag of node.tags) {
      if (!tagGroups[tag]) tagGroups[tag] = [];
      tagGroups[tag].push(node.id);
    }
  }

  const graphStats: GraphStats = {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    edgesByType,
    criticalPathModules,
    mostConnectedModule,
    tagGroups,
  };

  return {
    projectName,
    generatedAt: new Date().toISOString(),
    nodes,
    edges,
    modulesDetail,
    recentExecutions,
    flows: flowSummaries,
    graphStats,
  };
}
