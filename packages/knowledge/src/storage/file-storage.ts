import { randomBytes } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  appendFileSync,
  renameSync,
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
} from '@qap/shared';
import lockfile from 'proper-lockfile';
import YAML from 'yaml';

const LOCKS_DIR = '.qa/cache/locks';

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

    const release = await lockfile.lock(targetPath, {
      retries: { retries: 10, minTimeout: 50, maxTimeout: 500 },
      stale: 10000,
      lockfilePath: join(this.getLockDir(), `${Buffer.from(targetPath).toString('hex')}.lock`),
    });

    try {
      return await fn();
    } finally {
      await release();
    }
  }

  async read(path: string): Promise<string> {
    return await readFile(this.resolvePath(path), 'utf-8');
  }

  async write(path: string, content: string): Promise<void> {
    const fullPath = this.resolvePath(path);
    mkdirSync(dirname(fullPath), { recursive: true });

    await this.withLock(fullPath, () => {
      const tempPath = `${fullPath}.${randomBytes(6).toString('hex')}.tmp`;
      writeFileSync(tempPath, content, 'utf-8');
      renameSync(tempPath, fullPath);
      return Promise.resolve();
    });
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
  // Dominio de modulos (.qa/modules/<name>/)
  // ---------------------------------------------------------------------

  async listModules(): Promise<string[]> {
    return this.list('.qa/modules');
  }

  async hasModule(moduleName: string): Promise<boolean> {
    return this.exists(join('.qa/modules', moduleName));
  }

  async getModuleContext(moduleName: string): Promise<ModuleContext> {
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

  async getModulePrereqs(moduleName: string): Promise<ModulePrereqs | null> {
    const path = join('.qa/modules', moduleName, 'prereqs.yaml');
    if (!(await this.exists(path))) return null;
    return this.readYaml<ModulePrereqs>(path);
  }

  async saveModulePrereqs(moduleName: string, prereqs: ModulePrereqs): Promise<void> {
    await this.writeYaml(join('.qa/modules', moduleName, 'prereqs.yaml'), prereqs);
  }

  async getModuleSelectors(moduleName: string): Promise<ModuleSelectors> {
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
    const files = await this.list(join('.qa/modules', moduleName, 'tests'));
    return files
      .filter((f) => f.startsWith('TC-') && (f.endsWith('.yaml') || f.endsWith('.yml')))
      .map((f) => f.replace(/\.ya?ml$/, ''));
  }

  async getTestCase(moduleName: string, caseId: string): Promise<TestCase> {
    return this.readYaml<TestCase>(join('.qa/modules', moduleName, 'tests', `${caseId}.yaml`));
  }

  async saveTestCase(moduleName: string, testCase: TestCase): Promise<void> {
    await this.writeYaml(
      join('.qa/modules', moduleName, 'tests', `${testCase.id}.yaml`),
      testCase
    );
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
}