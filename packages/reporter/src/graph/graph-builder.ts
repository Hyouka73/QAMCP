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
  featuresCount: number;   // Total de funcionalidades y reglas de negocio
  rulesCount: number;      // Conteo de reglas formales en rules.yaml
  testCasesCount: number;  // Conteo de casos de prueba formales
  rules?: unknown[];
  testCases?: unknown[];
  prdSource?: string;
  manuallyEdited: boolean;
}

export interface GraphEdge {
  from: string;
  to: string;
  label?: string;          // Ej: 'prereq', 'depends_on', 'flow_step'
  type: 'prereq' | 'flow';
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

export interface KnowledgeGraphPayload {
  projectName: string;
  generatedAt: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  modulesDetail: Record<string, unknown>; // Datos completos de context.yaml, rules.yaml, etc.
  recentExecutions: RecentExecution[];
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

    // Reglas de negocio y funcionalidades (.qa/modules/<name>/rules.yaml)
    let rulesList: Array<Record<string, unknown>> = [];
    try {
      if (typeof storage.getModuleRules === 'function') {
        const moduleRules = await storage.getModuleRules(moduleName);
        if (moduleRules && Array.isArray(moduleRules.rules)) {
          rulesList = moduleRules.rules;
        }
      }
    } catch {
      rulesList = [];
    }

    // Casos de prueba (.qa/modules/<name>/tests/)
    const testCasesDetail: Array<Record<string, unknown>> = [];
    let hasTests: boolean;
    try {
      const testCases = await storage.listTestCases(moduleName);
      hasTests = testCases.length > 0;
      if (typeof storage.getTestCase === 'function') {
        for (const tcId of testCases) {
          try {
            const tc = await storage.getTestCase(moduleName, tcId);
            if (tc) {
              testCasesDetail.push(tc as unknown as Record<string, unknown>);
            } else {
              testCasesDetail.push({ id: tcId, name: tcId });
            }
          } catch {
            testCasesDetail.push({ id: tcId, name: tcId });
          }
        }
      }
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
      hasTests: hasTests || testCasesDetail.length > 0,
      sensitiveSelectorsCount: sensitiveSelectors.length,
      risksCount: risks.length,
      featuresCount: rulesList.length > 0 ? rulesList.length : testCasesDetail.length,
      rulesCount: rulesList.length,
      testCasesCount: testCasesDetail.length,
      rules: rulesList,
      testCases: testCasesDetail,
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
      rules: rulesList,
      testCases: testCasesDetail,
      features: rulesList.map((r) => ({
        id: r.id,
        name: r.id,
        description: r.description,
        severity: r.severity,
        tags: r.tags || [],
        condition: r.condition,
        action: r.action,
      })),
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

  // 5. Evidencias y Ejecuciones (.qa/executions/)
  const recentExecutions: RecentExecution[] = [];
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
