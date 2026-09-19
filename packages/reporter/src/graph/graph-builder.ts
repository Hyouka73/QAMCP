import { basename } from 'node:path';

import type { IStorage } from '@qap/engine';
import type { FlowDefinition, ModuleContext, RepoMap } from '@qap/shared';

export interface GraphNode {
  id: string;              // Nombre del módulo (ej. 'auth', 'simulation')
  label: string;
  type: 'module' | 'flow';
  routes: string[];
  filesCount: number;
  hasTests: boolean;
  sensitiveSelectorsCount: number;
  risksCount: number;
  prdSource?: string;
  manuallyEdited: boolean;
}

export interface GraphEdge {
  from: string;
  to: string;
  label?: string;          // Ej: 'prereq', 'depends_on', 'flow_step'
  type: 'prereq' | 'flow';
}

export interface KnowledgeGraphPayload {
  projectName: string;
  generatedAt: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  modulesDetail: Record<string, unknown>; // Datos completos de context.yaml y repo-map.json
  recentExecutions: Array<{
    id: string;
    timestamp: string;
    module: string;
    result: string;
    screenshots: string[];
  }>;
}

/**
 * Construye el payload del grafo de conocimiento a partir de la memoria .qa/
 * utilizando la interfaz de almacenamiento IStorage.
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

  // 2. Extraer módulos y construir nodos
  let moduleNames: string[];
  try {
    moduleNames = await storage.listModules();
  } catch {
    moduleNames = [];
  }

  const nodes: GraphNode[] = [];
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

    let hasTests: boolean;
    try {
      const testCases = await storage.listTestCases(moduleName);
      hasTests = testCases.length > 0;
    } catch {
      try {
        const plan = await storage.getTestPlan(moduleName);
        hasTests = Boolean(plan && (plan.cases?.length ?? 0) > 0);
      } catch {
        hasTests = false;
      }
    }

    const routes = moduleContext?.routes ?? [];
    const files = repoMap?.files ?? [];
    const sensitiveSelectors = moduleContext?.sensitive_selectors ?? [];
    const risks = moduleContext?.risks ?? [];
    const prdSource = moduleContext?.prd_source;
    const manuallyEdited = Boolean(moduleContext?.manually_edited);

    const node: GraphNode = {
      id: moduleName,
      label: moduleName,
      type: 'module',
      routes,
      filesCount: files.length,
      hasTests,
      sensitiveSelectorsCount: sensitiveSelectors.length,
      risksCount: risks.length,
      ...(prdSource ? { prdSource } : {}),
      manuallyEdited,
    };
    nodes.push(node);

    modulesDetail[moduleName] = {
      ...moduleContext,
      context: moduleContext,
      repoMap,
      files,
      routes,
      risks,
      sensitive_selectors: sensitiveSelectors,
      users: moduleContext?.users ?? [],
      objective: moduleContext?.objective ?? '',
      notes: moduleContext?.notes ?? '',
      prd_source: prdSource,
      manually_edited: manuallyEdited,
    };

    // 3. Aristas por Prerrequisitos (.qa/modules/<name>/prereqs.yaml)
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

        // Si hay módulos declarados explícitamente en requires.modules o depends_on
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

        // Si requiere autenticación (requires.auth), comprobar si existe un módulo de auth
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
            });
          }
        }
      }
    } catch {
      // Prerrequisitos no disponibles para este módulo
    }
  }

  // 4. Aristas por Flujos Multi-Módulo (.qa/flows/*.yaml)
  try {
    const flowNames = await storage.listFlows();
    for (const flowName of flowNames) {
      try {
        const flow = await storage.getFlow(flowName) as FlowDefinition | null;
        if (flow && Array.isArray(flow.modules) && flow.modules.length > 0) {
          const flowLabel = flow.name || flowName;
          for (let i = 0; i < flow.modules.length - 1; i++) {
            const current = flow.modules[i]?.module;
            const next = flow.modules[i + 1]?.module;
            if (current && next && current !== next) {
              addEdge({
                from: current,
                to: next,
                label: flowLabel,
                type: 'flow',
              });
            }
          }

          for (const modItem of flow.modules) {
            if (Array.isArray(modItem.depends_on)) {
              for (const dep of modItem.depends_on) {
                if (dep && dep !== modItem.module) {
                  addEdge({
                    from: dep,
                    to: modItem.module,
                    label: flowLabel,
                    type: 'flow',
                  });
                }
              }
            }
          }
        }
      } catch {
        // Ignorar flujo con error de lectura
      }
    }
  } catch {
    // Directorio de flujos no disponible
  }

  // 5. Evidencias (.qa/executions/)
  const recentExecutions: KnowledgeGraphPayload['recentExecutions'] = [];
  try {
    const executionsExists = await storage.exists('.qa/executions');
    if (executionsExists) {
      const entries = await storage.list('.qa/executions');
      for (const entry of entries) {
        const entryPath = `.qa/executions/${entry}`;
        if (entry.endsWith('.json')) {
          try {
            const execData = await storage.readJson<Record<string, unknown>>(entryPath);
            const id = (execData.id as string) || entry.replace(/\.json$/, '');
            const timestamps = execData.timestamps as Record<string, string> | undefined;
            const timestamp = timestamps?.started_at || timestamps?.ended_at || new Date().toISOString();
            const module = (execData.module as string) || 'unknown';
            const result = (execData.status as string) || 'completed';
            const rawScreenshots = (execData.screenshots as Array<{ path: string } | string>) || [];
            const screenshots = rawScreenshots.map((s) => {
              const p = typeof s === 'string' ? s : s.path;
              return p.startsWith('/artifacts/')
                ? p
                : `/artifacts/${p.replace(/^\.?\/?\.qa\/executions\//, '').replace(/^\/+/, '')}`;
            });

            recentExecutions.push({
              id,
              timestamp,
              module,
              result,
              screenshots,
            });
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

            if (subFiles.includes('result.json') || subFiles.includes('execution.json')) {
              const metaFile = subFiles.includes('result.json') ? 'result.json' : 'execution.json';
              try {
                const meta = await storage.readJson<Record<string, unknown>>(`${entryPath}/${metaFile}`);
                if (typeof meta.module === 'string') execModule = meta.module;
                if (typeof meta.status === 'string') execResult = meta.status;
                const ts = meta.timestamps as Record<string, string> | undefined;
                if (ts?.started_at) execTime = ts.started_at;
              } catch {
                // Ignorar
              }
            }

            if (imgFiles.length > 0 || subFiles.length > 0) {
              recentExecutions.push({
                id: entry,
                timestamp: execTime,
                module: execModule,
                result: execResult,
                screenshots: imgFiles.map((f) => `/artifacts/${entry}/${f}`),
              });
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

  return {
    projectName,
    generatedAt: new Date().toISOString(),
    nodes,
    edges,
    modulesDetail,
    recentExecutions,
  };
}
