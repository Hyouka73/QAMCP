import { randomBytes, createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  appendFileSync,
  renameSync,
  realpathSync,
  rmSync,
} from 'node:fs';
import {
  readFile,
  access,
  readdir,
  rm,
  mkdir as mkdirAsync,
} from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

import type {
  IStorage,
  EnvironmentsConfig,
  ProjectContext,
  SystemPromptConfig,
  ModuleRules,
  ModulePrereqs,
  ModuleSelectors,
  SemanticHashData,
  TestCase,
  ProjectStatus,
} from '@qap/engine';
import type {
  ModuleContext,
  TestPlan,
  ExecutionResult,
  FlowDefinition,
  RepoMap,
  LifecycleState,
  ModuleStateInfo,
} from '@qap/shared';
import { normalizeToPosix, normalizeSlug } from '@qap/shared';
import { normalizeTcCase } from '@qap/shared';
import lockfile from 'proper-lockfile';
import YAML from 'yaml';

const LOCKS_DIR = '.qa/cache/locks';

/**
 * In-process coordination between lock-free readers and atomic replacements.
 *
 * Verified cause (see VNEXT-014-CONVERGENCIA/E01): on Windows, renameSync()
 * replacing a destination that has ANY open handle (including a concurrent
 * fs.promises.readFile in the same process) fails with EPERM. Readers do not
 * take the cross-process lock, so a writer can lose to an unrelated read.
 * This gate makes same-process readers drain before a replacement and holds
 * new readers back while it runs. It is NOT a retry: no operation is repeated.
 * Readers in OTHER processes remain outside this guarantee.
 */
class ReplaceGate {
  private static readonly gates = new Map<string, ReplaceGate>();
  private readers = 0;
  private replacing = 0;
  private waiters: Array<() => void> = [];

  static for(physicalKey: string): ReplaceGate {
    let gate = ReplaceGate.gates.get(physicalKey);
    if (!gate) { gate = new ReplaceGate(); ReplaceGate.gates.set(physicalKey, gate); }
    return gate;
  }

  private wake(): void {
    const pending = this.waiters;
    this.waiters = [];
    for (const resume of pending) resume();
  }

  async read<T>(operation: () => Promise<T>): Promise<T> {
    while (this.replacing > 0) await new Promise<void>(resolve => this.waiters.push(resolve));
    this.readers++;
    try { return await operation(); } finally {
      this.readers--;
      if (this.readers === 0) this.wake();
    }
  }

  async replace<T>(operation: () => T): Promise<T> {
    this.replacing++;
    try {
      while (this.readers > 0) await new Promise<void>(resolve => this.waiters.push(resolve));
      return operation();
    } finally {
      this.replacing--;
      if (this.replacing === 0) this.wake();
    }
  }
}

export interface FileSystemStorageOptions {
  /** Directorio raiz del proyecto (donde vive .qa/). Por defecto, process.cwd(). */
  rootDir?: string;
}

/**
 * Adaptador de almacenamiento en disco para el arbol .qa/.
 * Implementa el contrato completo IStorage (S3-001) con:
 * - Atomic writes: escribe a un archivo temporal y hace rename atomico.
 * - Locking con proper-lockfile bajo .qa/cache/locks/, para evitar
 *   condiciones de carrera entre procesos concurrentes.
 */
export class FileSystemStorage implements IStorage {
  private rootDir: string;

  constructor(options: FileSystemStorageOptions = {}) {
    this.rootDir = options.rootDir ?? process.cwd();
  }

  // ---------------------------------------------------------------------
  // Primitivas de bajo nivel
  // ---------------------------------------------------------------------

  private resolvePath(path: string): string {
    return resolve(this.rootDir, path);
  }

  private getLockDir(): string {
    const lockDir = join(this.rootDir, LOCKS_DIR);
    if (!existsSync(lockDir)) {
      mkdirSync(lockDir, { recursive: true });
    }
    return lockDir;
  }

  private async withLock<T>(targetPath: string, fn: () => Promise<T>): Promise<T> {
    this.getLockDir();

    if (!existsSync(targetPath)) {
      mkdirSync(dirname(targetPath), { recursive: true });
      writeFileSync(targetPath, '', 'utf-8');
    }

    // All host writers to the same physical file must use the same lock,
    // including Windows path-case aliases and directory junction aliases.
    // Hash the canonical pathname, never the caller's spelling or a mutable
    // file inode (the lifecycle file is atomically replaced by rename).
    // On case-sensitive POSIX filesystems, retain the original case.
    const physicalPath = realpathSync.native(targetPath);
    const lockIdentity = process.platform === 'win32'
      ? physicalPath.replaceAll('\\', '/').toLowerCase()
      : physicalPath;
    const release = await lockfile.lock(targetPath, {
      retries: { retries: 10, minTimeout: 50, maxTimeout: 500 },
      stale: 10000,
      lockfilePath: join(this.getLockDir(), `${createHash('sha256').update(lockIdentity).digest('hex')}.lock`),
    });

    try {
      return await fn();
    } finally {
      await release();
    }
  }

  private gateFor(fullPath: string): ReplaceGate {
    const key = process.platform === 'win32'
      ? fullPath.replaceAll('\\', '/').toLowerCase()
      : fullPath;
    return ReplaceGate.for(key);
  }

  async read(path: string): Promise<string> {
    const fullPath = this.resolvePath(path);
    return this.gateFor(fullPath).read(() => readFile(fullPath, 'utf-8'));
  }
  
   /**
   * Lee un archivo como bytes crudos (sin decodificar como texto).
   * Necesario para binarios como screenshots PNG (S5-003).
   */

   async readBuffer(path: string): Promise<Buffer> {
    const fullPath = this.resolvePath(path);
    return this.gateFor(fullPath).read(() => readFile(fullPath));
  }

  async write(path: string, content: string): Promise<void> {
    const fullPath = this.resolvePath(path);
    mkdirSync(dirname(fullPath), { recursive: true });

    await this.withLock(fullPath, () => this.gateFor(fullPath).replace(() => {
      const tempPath = `${fullPath}.${randomBytes(6).toString('hex')}.tmp`;
      try {
        writeFileSync(tempPath, content, 'utf-8');
        renameSync(tempPath, fullPath);
      } finally {
        rmSync(tempPath, { force: true });
      }
    }));
  }

  async exists(path: string): Promise<boolean> {
    try {
      await access(this.resolvePath(path));
      return true;
    } catch {
      return false;
    }
  }

  async list(path: string): Promise<string[]> {
    const fullPath = this.resolvePath(path);
    try {
      return await readdir(fullPath);
    } catch {
      return [];
    }
  }

  async delete(path: string): Promise<void> {
    const fullPath = this.resolvePath(path);
    await rm(fullPath, { recursive: true, force: true });
  }

  async mkdir(path: string): Promise<void> {
    await mkdirAsync(this.resolvePath(path), { recursive: true });
  }

  async readJson<T>(path: string): Promise<T> {
    const content = await this.read(path);
    return JSON.parse(content) as T;
  }

  async writeJson<T>(path: string, data: T): Promise<void> {
    await this.write(path, JSON.stringify(data, null, 2));
  }

  private async readYaml<T>(path: string): Promise<T> {
    const content = await this.read(path);
    return YAML.parse(content) as T;
  }

  private async writeYaml<T>(path: string, data: T): Promise<void> {
    await this.write(path, YAML.stringify(data));
  }

  // ---------------------------------------------------------------------
  // Configuracion global del proyecto (.qa/project/)
  // ---------------------------------------------------------------------

  getProjectRoot(): string {
    return this.rootDir;
  }

  async isInitialized(): Promise<boolean> {
    return this.exists('.qa');
  }

  async getEnvironments(): Promise<EnvironmentsConfig> {
    return this.readYaml<EnvironmentsConfig>('.qa/project/environments.yaml');
  }

  async saveEnvironments(envs: EnvironmentsConfig): Promise<void> {
    await this.writeYaml('.qa/project/environments.yaml', envs);
  }

  async getProjectContext(): Promise<ProjectContext> {
    return this.readYaml<ProjectContext>('.qa/project/context.yaml');
  }

  async saveProjectContext(ctx: ProjectContext): Promise<void> {
    await this.writeYaml('.qa/project/context.yaml', ctx);
  }

  async getSystemPrompt(): Promise<SystemPromptConfig | null> {
    const path = '.qa/project/system-prompt.yaml';
    if (!(await this.exists(path))) return null;
    return this.readYaml<SystemPromptConfig>(path);
  }

  // ---------------------------------------------------------------------
  // Ciclo de vida del proyecto (.qa/project/lifecycle.json) (E3, E4)
  // ---------------------------------------------------------------------

  /**
   * Regla de retrocompatibilidad E4:
   * Si lifecycle.json no existe, derivarlo de forma perezosa SIN escribir en disco
   * hasta la primera transición real:
   * - Sin módulos registrados -> phase ONBOARDING.
   * - Con módulos registrados -> phase WORKING y cada módulo en estado 'observed'.
   */
  /**
   * Coordinate canonical consent with every FileSystemStorage lifecycle writer.
   * Lock order: lifecycle file -> Knowledge SQLite -> ClosureStore SQLite.
   * No locks are held during independent human review. External raw filesystem
   * writers that bypass FileSystemStorage are outside this host contract.
   */
  async withLifecycleFence<T>(operation: () => Promise<T>): Promise<T> {
    const path = this.resolvePath('.qa/project/lifecycle.json');
    if (!existsSync(path)) throw new Error('lifecycle_context_missing');
    return this.withLock(path, operation);
  }

  async getLifecycleState(): Promise<LifecycleState> {
    const lifecyclePath = '.qa/project/lifecycle.json';
    if (await this.exists(lifecyclePath)) {
      try {
        const content = await this.read(lifecyclePath);
        if (content.trim()) {
          return JSON.parse(content) as LifecycleState;
        }
      } catch {
        // En caso de error de parseo o archivo vacío temporal, derivar retrocompatiblemente
      }
    }

    const modules = await this.listModules();
    const now = new Date().toISOString();

    if (modules.length === 0) {
      return {
        _version: '1',
        phase: 'ONBOARDING',
        session: {
          id: '',
          started_at: '',
          plan: [],
        },
        modules: {},
        history: [],
      };
    }

    const moduleMap: Record<string, ModuleStateInfo> = {};
    for (const mod of modules) {
      moduleMap[mod] = {
        state: 'observed',
        updated_at: now,
      };
    }

    return {
      _version: '1',
      phase: 'WORKING',
      session: {
        id: '',
        started_at: '',
        plan: [],
      },
      modules: moduleMap,
      history: [],
    };
  }

  async saveLifecycleState(state: LifecycleState): Promise<void> {
    await this.writeJson('.qa/project/lifecycle.json', state);
  }

  async updateLifecycleState(
    mutator: (state: LifecycleState) => Promise<LifecycleState> | LifecycleState
  ): Promise<LifecycleState> {
    const fullPath = this.resolvePath('.qa/project/lifecycle.json');
    mkdirSync(dirname(fullPath), { recursive: true });

    return await this.withLock(fullPath, async () => {
      const current = await this.getLifecycleState();
      const updated = await mutator(current);
      const content = JSON.stringify(updated, null, 2);
      await this.gateFor(fullPath).replace(() => {
        const tempPath = `${fullPath}.${randomBytes(6).toString('hex')}.tmp`;
        try {
          writeFileSync(tempPath, content, 'utf-8');
          renameSync(tempPath, fullPath);
        } finally {
          rmSync(tempPath, { force: true });
        }
      });
      return updated;
    });
  }

  /**
   * A synchronous commit inside the lifecycle lock for cross-store finalization.
   * The caller may hold the Knowledge write fence while calling commit(), so
   * there is no release gap between receipt validation and lifecycle persistence.
   *
   * Lock order: lifecycle -> Knowledge -> Closure (read only). Do not call
   * saveLifecycleState/updateLifecycleState from this transaction (reentrant lock).
   * A rejected transaction never invokes commit and leaves lifecycle unchanged.
   */
  async commitLifecycleStateWithFence<T>(
    transaction: (current: LifecycleState, commit: (next: LifecycleState) => void) => Promise<T>
  ): Promise<T> {
    const fullPath = this.resolvePath('.qa/project/lifecycle.json');
    mkdirSync(dirname(fullPath), { recursive: true });
    return this.withLock(fullPath, async () => {
      const current = await this.getLifecycleState();
      let committed = false;
      const commit = (next: LifecycleState): void => {
        if (committed) throw new Error('lifecycle_commit_already_performed');
        const tempPath = `${fullPath}.${randomBytes(6).toString('hex')}.tmp`;
        try {
          writeFileSync(tempPath, JSON.stringify(next, null, 2), 'utf-8');
          renameSync(tempPath, fullPath);
          committed = true;
        } finally {
          rmSync(tempPath, { force: true });
        }
      };
      return transaction(current, commit);
    });
  }

  // ---------------------------------------------------------------------
  // Dominio de modulos (.qa/modules/<name>/)
  // ---------------------------------------------------------------------

  async listModules(): Promise<string[]> {
    const indexPath = join('.qa/modules', 'index.json');
    if (await this.exists(indexPath)) {
      try {
        const index = await this.readJson<Array<{ name: string }>>(indexPath);
        if (Array.isArray(index)) {
          return index.map((m) => m.name);
        }
      } catch {
        // Fallback to directory listing
      }
    }
    const items = await this.list('.qa/modules');
    return items.filter((f) => !f.startsWith('.') && f !== 'index.json');
  }

  async hasModule(moduleName: string): Promise<boolean> {
    return this.exists(join('.qa/modules', moduleName));
  }

  async getModuleContext(moduleName: string): Promise<ModuleContext> {
    const defaultViewPath = join('.qa/modules', moduleName, 'views', 'default', 'context.yaml');
    if (await this.exists(defaultViewPath)) {
      return this.readYaml<ModuleContext>(defaultViewPath);
    }
    return this.readYaml<ModuleContext>(join('.qa/modules', moduleName, 'context.yaml'));
  }

  async saveModuleContext(moduleName: string, context: ModuleContext): Promise<void> {
    await this.writeYaml(join('.qa/modules', moduleName, 'context.yaml'), context);
  }

  async getModuleRules(moduleName: string): Promise<ModuleRules | null> {
    const path = join('.qa/modules', moduleName, 'rules.yaml');
    if (!(await this.exists(path))) return null;
    return this.readYaml<ModuleRules>(path);
  }

  async saveModuleRules(moduleName: string, rules: ModuleRules): Promise<void> {
    await this.writeYaml(join('.qa/modules', moduleName, 'rules.yaml'), rules);
  }

  /**
   * Operación atómica de lectura-modificación-escritura sobre rules.yaml de un módulo.
   * Usa el mismo mecanismo de lock que updateLifecycleState.
   * Las tools de P3 DEBEN usarla para evitar condiciones de carrera concurrentes.
   */
  async updateModuleRules(
    moduleName: string,
    mutator: (current: ModuleRules) => Promise<ModuleRules> | ModuleRules
  ): Promise<ModuleRules> {
    const rulesRelPath = join('.qa/modules', moduleName, 'rules.yaml');
    const fullPath = this.resolvePath(rulesRelPath);
    mkdirSync(dirname(fullPath), { recursive: true });

    return await this.withLock(fullPath, async () => {
      // Leer estado actual (o base si no existe o está vacío por el lockfile)
      let current: ModuleRules;
      try {
        const existing = await this.getModuleRules(moduleName);
        if (existing && typeof existing === 'object' && Array.isArray(existing.rules)) {
          current = {
            _version: existing._version || '1',
            manually_edited: Boolean(existing.manually_edited),
            rules: existing.rules,
            category_waivers: existing.category_waivers || [],
          };
        } else {
          current = { _version: '1', manually_edited: false, rules: [], category_waivers: [] };
        }
      } catch {
        current = { _version: '1', manually_edited: false, rules: [], category_waivers: [] };
      }

      const updated = await mutator(current);
      const content = YAML.stringify(updated);
      await this.gateFor(fullPath).replace(() => {
        const tempPath = `${fullPath}.${randomBytes(6).toString('hex')}.tmp`;
        try {
          writeFileSync(tempPath, content, 'utf-8');
          renameSync(tempPath, fullPath);
        } finally {
          rmSync(tempPath, { force: true });
        }
      });
      return updated;
    });
  }


  async getModulePrereqs(moduleName: string): Promise<ModulePrereqs | null> {
    const path = join('.qa/modules', moduleName, 'prereqs.yaml');
    if (!(await this.exists(path))) return null;
    return this.readYaml<ModulePrereqs>(path);
  }

  async saveModulePrereqs(moduleName: string, prereqs: ModulePrereqs): Promise<void> {
    await this.writeYaml(join('.qa/modules', moduleName, 'prereqs.yaml'), prereqs);
  }

  async getModuleSelectors(moduleName: string): Promise<ModuleSelectors> {
    const defaultViewPath = join('.qa/modules', moduleName, 'views', 'default', 'selectors.json');
    if (await this.exists(defaultViewPath)) {
      return this.readJson<ModuleSelectors>(defaultViewPath);
    }
    return this.readJson<ModuleSelectors>(join('.qa/modules', moduleName, 'selectors.json'));
  }

  async saveModuleSelectors(moduleName: string, selectors: ModuleSelectors): Promise<void> {
    await this.writeJson(join('.qa/modules', moduleName, 'selectors.json'), selectors);
  }

  async getSemanticHash(moduleName: string): Promise<SemanticHashData | null> {
    const path = join('.qa/modules', moduleName, 'semantic-hash.json');
    if (!(await this.exists(path))) return null;
    return this.readJson<SemanticHashData>(path);
  }

  async saveSemanticHash(moduleName: string, data: SemanticHashData): Promise<void> {
    await this.writeJson(join('.qa/modules', moduleName, 'semantic-hash.json'), data);
  }

  async getRepoMap(moduleName: string): Promise<RepoMap | null> {
    const path = join('.qa/modules', moduleName, 'repo-map.json');
    if (!(await this.exists(path))) return null;
    const data = await this.readJson<RepoMap>(path);
    if (data && Array.isArray(data.files)) {
      data.files = data.files.map(normalizeToPosix);
    }
    return data;
  }

  async saveRepoMap(moduleName: string, data: RepoMap): Promise<void> {
    const normalizedData: RepoMap = {
      ...data,
      files: (data.files || []).map(normalizeToPosix),
    };
    await this.writeJson(join('.qa/modules', moduleName, 'repo-map.json'), normalizedData);
  }

  // ---------------------------------------------------------------------
  // Planes y casos de prueba (.qa/modules/<name>/tests/)
  // ---------------------------------------------------------------------

  async getTestPlan(moduleName: string): Promise<TestPlan> {
    return this.readYaml<TestPlan>(join('.qa/modules', moduleName, 'tests', 'plan.yaml'));
  }

  async saveTestPlan(moduleName: string, plan: TestPlan): Promise<void> {
    await this.writeYaml(join('.qa/modules', moduleName, 'tests', 'plan.yaml'), plan);
  }

    async listTestCases(moduleName: string): Promise<string[]> {
    const testsDir = join('.qa/modules', moduleName, 'tests');
    const casesDir = join(testsDir, 'cases');

    // Formato clásico: tests/TC-*.yaml (se devuelve el id sin extensión)
    const classicFiles = await this.list(testsDir).catch(() => []);
    const classicCases = classicFiles
      .filter((f) => f.startsWith('TC-') && /\.ya?ml$/.test(f))
      .map((f) => f.replace(/\.ya?ml$/, ''));

    // Formato nuevo: tests/cases/<slug>-<hash6>.yaml
    const caseFiles = await this.list(casesDir).catch(() => []);
    const newCases = caseFiles
      .filter((f) => /\.ya?ml$/.test(f))
      .map((f) => f.replace(/\.ya?ml$/, ''));

    return [...classicCases, ...newCases];
  }

  async getTestCase(moduleName: string, caseId: string): Promise<TestCase> {
    const classicPath = join('.qa/modules', moduleName, 'tests', `${caseId}.yaml`);
    if (existsSync(resolve(this.rootDir, classicPath))) {
      const raw = await this.readYaml<TestCase>(classicPath);
      return normalizeTcCase(raw as unknown as Parameters<typeof normalizeTcCase>[0]) as unknown as TestCase;
    }
    if (!caseId.startsWith('TC-')) {
      const tcPrefixedPath = join('.qa/modules', moduleName, 'tests', `TC-${caseId}.yaml`);
      if (existsSync(resolve(this.rootDir, tcPrefixedPath))) {
        const raw = await this.readYaml<TestCase>(tcPrefixedPath);
        return normalizeTcCase(raw as unknown as Parameters<typeof normalizeTcCase>[0]) as unknown as TestCase;
      }
    }
    const newPath = join('.qa/modules', moduleName, 'tests', 'cases', `${caseId}.yaml`);
    const raw = await this.readYaml<TestCase>(newPath);
    return normalizeTcCase(raw as unknown as Parameters<typeof normalizeTcCase>[0]) as unknown as TestCase;
  }

  async saveTestCase(moduleName: string, testCase: TestCase, fileId?: string): Promise<void> {
    if (fileId !== undefined) {
      // Canonical generators keep UUID identity while the legacy planner enumerates TC-* filenames.
      if (fileId !== testCase.id && fileId !== 'TC-' + testCase.id) {
        throw new Error('Invalid case filename identity');
      }
      await this.writeYaml(
        join('.qa/modules', moduleName, 'tests', `${fileId}.yaml`),
        testCase
      );
      return;
    }

    const isClassic = Boolean(testCase.id?.startsWith('TC-'));
    const targetDir = isClassic
      ? join('.qa/modules', moduleName, 'tests')
      : join('.qa/modules', moduleName, 'tests', 'cases');

    await this.writeYaml(join(targetDir, `${this.testCaseFileName(testCase, isClassic)}.yaml`), testCase);
  }

  /**
   * Nombre de archivo de un caso. Formato clásico: <id>. Formato nuevo: <slug>-<hash6>,
   * donde el hash sale del id (determinista), de modo que el id interno conserva su UUID.
   */
  private testCaseFileName(testCase: TestCase, isClassic: boolean): string {
    if (isClassic || !testCase.name) {
      return testCase.id;
    }
    const slug = normalizeSlug(testCase.name) || 'caso';
    const hash6 = createHash('sha256').update(testCase.id).digest('hex').slice(0, 6);
    return `${slug}-${hash6}`;
  }

  // ---------------------------------------------------------------------
  // Resultados de ejecucion e historial
  // ---------------------------------------------------------------------

  async saveExecutionResult(executionId: string, result: ExecutionResult): Promise<void> {
    await this.writeJson(join('.qa/executions', `${executionId}.json`), result);
  }

  async getExecutionResult(executionId: string): Promise<ExecutionResult | null> {
    const path = join('.qa/executions', `${executionId}.json`);
    if (!(await this.exists(path))) return null;
    return this.readJson<ExecutionResult>(path);
  }

  async appendHistory(moduleName: string, entry: Record<string, unknown>): Promise<void> {
    const path = join('.qa/cache/history', `${moduleName}.jsonl`);
    const fullPath = this.resolvePath(path);
    mkdirSync(dirname(fullPath), { recursive: true });

    await this.withLock(fullPath, () => {
      appendFileSync(fullPath, `${JSON.stringify(entry)}\n`, 'utf-8');
      return Promise.resolve();
    });
  }

  // ---------------------------------------------------------------------
  // Flows multi-modulo (.qa/flows/)
  // ---------------------------------------------------------------------

  async listFlows(): Promise<string[]> {
    const files = await this.list('.qa/flows');
    return files.filter((f) => f.endsWith('.yaml') || f.endsWith('.yml')).map((f) => f.replace(/\.ya?ml$/, ''));
  }

  async getFlow(flowName: string): Promise<FlowDefinition> {
    return this.readYaml<FlowDefinition>(join('.qa/flows', `${flowName}.yaml`));
  }

  async saveFlow(flowName: string, flow: FlowDefinition): Promise<void> {
    await this.writeYaml(join('.qa/flows', `${flowName}.yaml`), flow);
  }

  // ---------------------------------------------------------------------
  // Diagnostico y estado del proyecto
  // ---------------------------------------------------------------------

  async getStatus(): Promise<ProjectStatus> {
    const initialized = await this.isInitialized();
    const modules = initialized ? await this.listModules() : [];

    let environmentConfigured: boolean;
    try {
      await this.getEnvironments();
      environmentConfigured = true;
    } catch {
      environmentConfigured = false;
    }

    return {
      initialized,
      modules_discovered: modules.length,
      environment_configured: environmentConfigured,
    };
  }

  // ---------------------------------------------------------------------
  // Persistencia de Preguntas Pendientes (P4.5-A / C2)
  // ---------------------------------------------------------------------

  /**
   * Guarda la última pregunta emitida para un módulo, vista y categoría
   * bajo .qa/cache/pending_questions/<module>.<view>.<category>.json
   */
  async savePendingQuestion(
    module: string,
    view: string,
    category: string,
    question: unknown
  ): Promise<void> {
    const filename = `${normalizeSlug(module)}.${normalizeSlug(view)}.${normalizeSlug(category)}.json`;
    await this.writeJson(join('.qa/cache/pending_questions', filename), question);
  }

  /**
   * Recupera la última pregunta emitida para un módulo, vista y categoría.
   */
  async getPendingQuestion(
    module: string,
    view: string,
    category: string
  ): Promise<Record<string, unknown> | null> {
    const filename = `${normalizeSlug(module)}.${normalizeSlug(view)}.${normalizeSlug(category)}.json`;
    const relPath = join('.qa/cache/pending_questions', filename);
    const fullPath = resolve(this.rootDir, relPath);
    if (!existsSync(fullPath)) {
      return null;
    }
    try {
      return await this.readJson<Record<string, unknown>>(relPath);
    } catch {
      return null;
    }
  }

  /**
   * Busca una pregunta pendiente por questionId dentro del módulo y vista.
   */
  async findPendingQuestion(
    module: string,
    view: string,
    questionId: string
  ): Promise<Record<string, unknown> | null> {
    const cacheDir = resolve(this.rootDir, '.qa/cache/pending_questions');
    if (!existsSync(cacheDir)) return null;

    try {
      const files = await readdir(cacheDir);
      const modPrefix = `${normalizeSlug(module)}.${normalizeSlug(view)}.`;
      for (const file of files) {
        if (file.startsWith(modPrefix) && file.endsWith('.json')) {
          const content = await this.readJson<{ id?: string; categoria?: string }>(join('.qa/cache/pending_questions', file));
          if (content?.id === questionId) {
            if (!content.categoria) {
              const catPart = file.slice(modPrefix.length, -5);
              if (catPart) content.categoria = catPart;
            }
            return content;
          }
        }
      }
    } catch {
      return null;
    }
    return null;
  }
}