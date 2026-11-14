import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  CaseGenerator,
  DependencyGraphResolver,
  FileSystemStorage,
  SemanticHasher,
  UpdateGuard,
  generateBvaCases,
  generateRbacNegativeCases,
} from '@qap/knowledge';
import type { AuthProfile, RuleEntry, TCCase } from '@qap/shared';
import { SchemaValidator, normalizeSlug, normalizeTcCase } from '@qap/shared';

import { DataError } from '../errors.js';

/** TCCase es una interface: los genéricos de normalizeTcCase y resolveOrder exigen firma de índice. */
type PlanNode = TCCase & { [key: string]: unknown };

function normalize(testCase: TCCase): TCCase {
  type Raw = Parameters<typeof normalizeTcCase>[0];
  return normalizeTcCase(testCase as unknown as Raw) as unknown as TCCase;
}

export interface PlanCommandOptions {
  /** Muestra los casos planificados sin escribir ningún archivo. */
  preview?: boolean;
}

interface PlanFile {
  module: string;
  checksum: string;
  algorithm: 'sha256';
  generated_at: string;
  cases: string[];
}

/** Nombre de archivo de un caso: <slug>-<hash6>. El hash sale del id, así que es determinista. */
function caseFileName(testCase: TCCase): string {
  const slug = normalizeSlug(testCase.name) || 'caso';
  const hash6 = createHash('sha256').update(testCase.id).digest('hex').slice(0, 6);
  return `${slug}-${hash6}`;
}

/** Lee los roles del proyecto (.qa/project/context.yaml). Sin contexto de proyecto, no hay roles. */
async function loadProjectRoles(storage: FileSystemStorage): Promise<unknown[]> {
  try {
    const project = (await storage.getProjectContext()) as {
      roles?: Array<{ name: string }>;
    };
    return (project.roles ?? []).map((role) => role.name);
  } catch {
    return [];
  }
}

/** Perfiles de autenticación (.qa/project/auth/profiles.json). Sin archivo, no hay perfiles. */
async function loadProfiles(storage: FileSystemStorage): Promise<AuthProfile[]> {
  try {
    const raw = await storage.read('.qa/project/auth/profiles.json');
    const parsed = JSON.parse(raw) as { profiles?: AuthProfile[] };
    return parsed.profiles ?? [];
  } catch {
    return [];
  }
}

export async function handlePlan(moduleName: string, options: PlanCommandOptions = {}): Promise<void> {
  const rootDir = process.cwd();
  const storage = new FileSystemStorage({ rootDir });

  if (!(await storage.hasModule(moduleName))) {
    throw new DataError(`El módulo '${moduleName}' no existe en .qa/modules/. Ejecuta 'qap discover' primero.`);
  }

  // 1. Leer contexto, reglas, selectores, roles y perfiles
  const context = await storage.getModuleContext(moduleName).catch(() => null);
  const rulesData = await storage.getModuleRules(moduleName).catch(() => null);
  const selectorsData = await storage.getModuleSelectors(moduleName).catch(() => null);
  const projectRoles = await loadProjectRoles(storage);
  const profiles = await loadProfiles(storage);

  const routes = context?.routes ?? [];
  const rules: RuleEntry[] = rulesData?.rules ?? [];
  const selectors = selectorsData?.selectors ?? {};

  // 2. Generar casos: happy path, BVA y RBAC negativo
  const happyCase = CaseGenerator.generateCase({
    moduleName,
    caseName: `${moduleName}-happy-path`,
    tags: [moduleName, 'happy_path'],
  });
  const bvaCases = generateBvaCases(
    moduleName,
    rules,
    selectorsData ?? { selectors: {}, metadata: { generated_at: '', source: 'qap plan' } },
    context?.base_route
  );
  const rbacCases = generateRbacNegativeCases(
    moduleName,
    projectRoles,
    (context ?? {}),
    rules,
    profiles
  );

  const rawGenerated = [
    { ...happyCase, _version: '1', case_category: 'happy_path' as const },
    ...bvaCases,
    ...rbacCases,
  ];

  const generated: TCCase[] = rawGenerated.map((tc) => normalize(tc));

  // 3. Validar todos los casos generados contra tc-case.schema.json
  const validator = new SchemaValidator();
  for (const testCase of generated) {
    const validation = validator.validateTcCase(testCase);
    if (!validation.valid) {
      const detail = validation.errors.map((error) => error.message).join('; ');
      throw new DataError(`El caso '${testCase.name}' generado no cumple tc-case.schema.json: ${detail}`);
    }
  }

  // 4. No sobrescribir casos protegidos con manually_edited: true
  const existingIds = new Set(await storage.listTestCases(moduleName));
  const finalCases: PlanNode[] = [];

  for (const generatedCase of generated) {
    const fileName = caseFileName(generatedCase);

    if (existingIds.has(fileName)) {
      const existing = await storage.getTestCase(moduleName, fileName);
if (UpdateGuard.isProtectedObject(existing as unknown as Record<string, unknown>)) {
        console.log(`[UpdateGuard] Caso ${fileName} protegido por edición manual. Se conserva.`);
        finalCases.push(existing as PlanNode);
        continue;
      }
    }
    finalCases.push(generatedCase as PlanNode);
  }

  // 5. Ordenar por dependencias
  const ordering = DependencyGraphResolver.resolveOrder(finalCases);
  if (ordering.hasCycles) {
    const cycleText = (ordering.cycles ?? []).map((cycle) => cycle.join(' -> ')).join('; ');
    throw new DataError(`Los casos del módulo '${moduleName}' tienen dependencias circulares: ${cycleText}`);
  }
  const orderedCases = ordering.orderedNodes as TCCase[];

  if (options.preview) {
    console.log(`[Preview] ${orderedCases.length} caso(s) planificados para '${moduleName}':`);
    for (const testCase of orderedCases) {
      console.log(`  - ${caseFileName(testCase)}  (${testCase.case_category ?? 'sin categoría'})`);
    }
    return;
  }

  // 6. Guardar los casos como tests/cases/<slug>-<hash6>.yaml
  for (const testCase of orderedCases) {
        await storage.saveTestCase(moduleName, testCase);
  }

  // 7. Actualizar tests/plan.json con el checksum SHA-256 de SemanticHasher
  const semanticHash = new SemanticHasher().generate({ routes, selectors }, ['context.yaml', 'selectors.json']);
  const planFile: PlanFile = {
    module: moduleName,
    checksum: semanticHash.hash,
    algorithm: 'sha256',
    generated_at: semanticHash.timestamp,
    cases: orderedCases.map((testCase) => caseFileName(testCase)),
  };

  const testsDir = join(rootDir, '.qa', 'modules', moduleName, 'tests');
  mkdirSync(testsDir, { recursive: true });
  writeFileSync(join(testsDir, 'plan.json'), JSON.stringify(planFile, null, 2), 'utf-8');

  console.log(`[Plan] Módulo '${moduleName}' planificado con ${orderedCases.length} caso(s).`);
}