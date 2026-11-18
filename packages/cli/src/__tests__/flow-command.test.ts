import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { Command, CommanderError } from 'commander';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FlowOrchestrator } from '@qap/engine';
import { FileSystemStorage, FlowContextStore } from '@qap/knowledge';
import { PlaywrightRunner } from '@qap/playwright-runner';
import { QapDatabase } from '@qap/reporter';

import { registerCommands } from '../commands.js';
import { handleFlowCommand } from '../commands/flow.js';
import { createProgram } from '../program.js';

describe('S82-004: CLI Flow Subcommands y Reanudación desde Checkpoint', () => {
  const testDir = path.join(process.cwd(), '.qa_test_cli_flow');
  const statesDir = path.join(testDir, '.qa', 'cache', 'flow_states');
  const definitionsDir = path.join(testDir, '.qa', 'definitions', 'flows');

  beforeEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
    fs.mkdirSync(statesDir, { recursive: true });
    fs.mkdirSync(definitionsDir, { recursive: true });
    process.exitCode = undefined;
  });

  afterEach(() => {
    process.exitCode = undefined;
    vi.restoreAllMocks();
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('debe reanudar un flujo a partir de un checkpoint omitiendo los módulos ya completados', async () => {
    const flowName = 'sample_flow';
    const flowDefPath = path.join(definitionsDir, `${flowName}.json`);

    const flowDefinition = {
      _version: '1.0',
      name: flowName,
      modules: [
        { module: 'mod_1' },
        { module: 'mod_2' },
        { module: 'mod_3' },
      ],
    };
    fs.writeFileSync(flowDefPath, JSON.stringify(flowDefinition, null, 2), 'utf-8');

    // Simular que mod_1 ya fue completado previamente en el checkpoint
    const store = new FlowContextStore(testDir);
    store.saveState({
      flow_name: flowName,
      started_at: new Date().toISOString(),
      completed_modules: ['mod_1'],
      shared_variables: { session_token: 'token_abc' },
    });

    const executedModules: string[] = [];
    const mockStorage = {
      getTestPlan: async (moduleName: string) => {
        executedModules.push(moduleName);
        return {
          name: moduleName,
          cases: [],
        };
      },
    };

    const mockRunner = {
      execute: async () => ({ result: 'passed' }),
    };

    const orchestrator = new FlowOrchestrator(mockStorage as any, mockRunner as any, undefined, store);
    const result = (await orchestrator.executeFlow(flowDefinition, {})) as unknown as Record<string, unknown>;

    expect(result.status).toBe('passed');
    // mod_1 debió omitirse por estar en completed_modules, solo debieron correr mod_2 y mod_3
    expect(executedModules).toEqual(['mod_2', 'mod_3']);
    expect(result.completed_modules).toEqual(['mod_1', 'mod_2', 'mod_3']);
  });

  it('registra los 5 subcomandos flow en Commander (run, resume, list, validate, debug)', () => {
    const program = new Command();
    registerCommands(program);
    const flowCmd = program.commands.find((c) => c.name() === 'flow');
    expect(flowCmd).toBeDefined();
    expect(flowCmd!.commands.map((c) => c.name())).toEqual(['run', 'resume', 'list', 'validate', 'debug']);
  });

  it('ejecuta handleFlowCommand para list, validate y debug contra .qa/flows y FlowContextStore', async () => {
    const storage = new FileSystemStorage({ rootDir: testDir });
    const flowDef = {
      _version: '1.0',
      name: 'checkout-e2e',
      modules: [{ module: 'auth' }, { module: 'checkout' }],
    };
    await storage.saveFlow('checkout-e2e', flowDef as Parameters<typeof storage.saveFlow>[1]);

    const store = new FlowContextStore(testDir);
    store.backupSessions('checkout-e2e');
    store.saveState({
      flow_name: 'checkout-e2e',
      started_at: '2026-11-18T10:00:00.000Z',
      completed_modules: ['auth'],
      shared_variables: { TOKEN: 'tok_123' },
    });

    const logs: string[] = [];
    const errors: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errors.push(args.map(String).join(' '));
    });

    await handleFlowCommand('list', undefined, { projectRoot: testDir });
    expect(logs.join('\n')).toContain('checkout-e2e');

    await handleFlowCommand('validate', 'checkout-e2e', { projectRoot: testDir });
    expect(logs.join('\n')).toContain('checkout-e2e: válido');
    expect(process.exitCode).toBeUndefined();

    await handleFlowCommand('validate', undefined, { all: true, projectRoot: testDir });
    expect(process.exitCode).toBeUndefined();

    await handleFlowCommand('debug', 'checkout-e2e', { projectRoot: testDir });
    const debugOut = logs.join('\n');
    expect(debugOut).toContain('TOKEN');
    expect(debugOut).toContain('Respaldo de sesiones: existe');

    // Verificar detección de flujo corrupto
    fs.writeFileSync(path.join(testDir, '.qa', 'flows', 'broken.yaml'), 'modules: 123\n', 'utf-8');
    await handleFlowCommand('validate', 'broken', { projectRoot: testDir });
    expect(errors.join('\n')).toContain('broken');
    expect(process.exitCode).toBe(1);
  });

  it('enruta qap flow <nombre> como alias compatible de run y conserva subcomandos y opciones', async () => {
    const routeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qap-cli-flow-route-'));
    const flowsDir = path.join(routeDir, '.qa', 'flows');
    fs.mkdirSync(flowsDir, { recursive: true });
    const legacyYaml = 'name: auditoria-sintetica\nmodules:\n  - module: auth\n';
    const legacyPath = path.join(flowsDir, 'auditoria-sintetica.yaml');
    fs.writeFileSync(legacyPath, legacyYaml, 'utf-8');

    const execSpy = vi
      .spyOn(FlowOrchestrator.prototype, 'executeFlow')
      .mockResolvedValue({
        flow_name: 'auditoria-sintetica',
        status: 'passed',
        modules_total: 1,
        modules_executed: ['auth'],
        modules_skipped: [],
        completed_modules: ['auth'],
        duration_ms: 1,
        results: { auth: { status: 'passed' } },
      } as never);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const prevCwd = process.cwd();
    process.chdir(routeDir);
    try {
      await createProgram().parseAsync([
        'node',
        'qap',
        'flow',
        'auditoria-sintetica',
        '--env',
        'staging',
        '--tags',
        'smoke,auth',
        '--headed',
      ]);
      expect(execSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ _version: '1.0', name: 'auditoria-sintetica' }),
        expect.objectContaining({ environment: 'staging', headless: false, tags: ['smoke', 'auth'] })
      );
      expect(process.exitCode).toBeUndefined();

      await createProgram().parseAsync([
        'node',
        'qap',
        'flow',
        'run',
        'auditoria-sintetica',
        '--env',
        'prod',
        '--tags',
        'e2e',
        '--headed',
      ]);
      expect(execSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ _version: '1.0', name: 'auditoria-sintetica' }),
        expect.objectContaining({ environment: 'prod', headless: false, tags: ['e2e'] })
      );

      await createProgram().parseAsync([
        'node',
        'qap',
        'flow',
        'resume',
        'auditoria-sintetica',
        '--env',
        'qa',
      ]);
      expect(execSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ _version: '1.0', name: 'auditoria-sintetica' }),
        expect.objectContaining({ environment: 'qa', headless: true })
      );

      await createProgram().parseAsync(['node', 'qap', 'flow', 'list']);
      await createProgram().parseAsync(['node', 'qap', 'flow', 'validate', 'auditoria-sintetica']);
      expect(process.exitCode).toBeUndefined();
      await createProgram().parseAsync(['node', 'qap', 'flow', 'debug', 'auditoria-sintetica']);

      expect(fs.readFileSync(legacyPath, 'utf-8')).toBe(legacyYaml);
    } finally {
      process.chdir(prevCwd);
      try {
        fs.rmSync(routeDir, { recursive: true, force: true });
      } catch {
        // En Windows el handle de telemetría puede liberarse al salir el proceso de test
      }
    }
  });

  it('lanza CommanderError (exit code 2 de uso) cuando falta <name> o se pasa flag inválido en qap flow', async () => {
    const prog1 = createProgram().configureOutput({ writeOut: () => {}, writeErr: () => {} });
    await expect(prog1.parseAsync(['node', 'qap', 'flow'])).rejects.toMatchObject({
      name: 'CommanderError',
      code: 'commander.missingArgument',
    });

    const prog2 = createProgram().configureOutput({ writeOut: () => {}, writeErr: () => {} });
    await expect(
      prog2.parseAsync(['node', 'qap', 'flow', 'auditoria-sintetica', '--unknown-flag'])
    ).rejects.toBeInstanceOf(CommanderError);
  });

  it('aceptación end-to-end: coherencia CLI/HTML/JSON/SQLite/run.json en resume doble, blocked_missing_oracle, passed, mixto, 0 casos y reindex()', async () => {
    const e2eDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qap-flow-e2e-coherence-'));
    const runtimeDir = path.join(e2eDir, '.qa', 'runtime');
    const storage = new FileSystemStorage({ rootDir: e2eDir });

    const setupModuleAndFlow = async (flowName: string, modName: string, cases: Array<{ id: string; tags?: string[] }>) => {
      for (const c of cases) {
        await storage.saveTestCase(modName, {
          _version: '1',
          id: c.id,
          name: `Caso ${c.id}`,
          tags: c.tags ?? ['smoke'],
          steps: [],
        });
      }
      await storage.saveTestPlan(modName, {
        _version: '1',
        module: modName,
        cases: cases.map((c) => c.id),
      } as never);
      await storage.saveFlow(flowName, {
        _version: '1.0',
        name: flowName,
        modules: [{ module: modName }],
      } as never);
    };

    const readLatestReportPair = (flowName: string) => {
      const reportsDir = path.join(e2eDir, '.qa', 'reports');
      const files = fs
        .readdirSync(reportsDir)
        .filter((f) => f.startsWith(`flow-${flowName}-`))
        .sort();
      const jsonFile = files.filter((f) => f.endsWith('.json')).at(-1)!;
      const htmlFile = files.filter((f) => f.endsWith('.html')).at(-1)!;
      return {
        jsonPath: path.join(reportsDir, jsonFile),
        htmlPath: path.join(reportsDir, htmlFile),
        json: JSON.parse(fs.readFileSync(path.join(reportsDir, jsonFile), 'utf-8')) as Record<string, unknown>,
        html: fs.readFileSync(path.join(reportsDir, htmlFile), 'utf-8'),
      };
    };

    try {
      vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      // 1 & 3. Resume completo ejecutado dos veces sobre auditflow --tags smoke
      await setupModuleAndFlow('auditflow', 'auth', [{ id: 'TC-SMOKE-1', tags: ['smoke'] }]);
      const execSpy = vi.spyOn(PlaywrightRunner.prototype, 'execute').mockImplementation(async (plan) => ({
        _version: '1',
        execution_id: `exec_${Date.now()}`,
        module: plan.modules[0] ?? 'auth',
        env: 'local',
        started_at: '2026-11-18T12:00:00.000Z',
        finished_at: '2026-11-18T12:00:01.000Z',
        result: 'passed',
        timed_out: false,
        summary: { total: 1, passed: 1, failed: 0, skipped: 0, not_run: 0 },
        cases: [{ id: 'TC-SMOKE-1', title: 'Smoke Auth', result: 'passed', duration_ms: 120 }],
      }));

      // Primera ejecución de resume -> ejecuta módulo y guarda checkpoint completo
      process.exitCode = undefined;
      await handleFlowCommand('resume', 'auditflow', { tags: 'smoke', projectRoot: e2eDir });
      expect(process.exitCode).toBeUndefined();
      expect(execSpy).toHaveBeenCalledTimes(1);

      const checkpointFile = path.join(e2eDir, '.qa', 'cache', 'flow_states', 'auditflow.state.json');
      const checkpointBefore = fs.readFileSync(checkpointFile, 'utf-8');
      expect(JSON.parse(checkpointBefore).completed_modules).toEqual(['auth']);

      // Segunda ejecución idéntica -> checkpoint completo no-op
      process.exitCode = undefined;
      await handleFlowCommand('resume', 'auditflow', { tags: 'smoke', projectRoot: e2eDir });
      expect(process.exitCode).toBeUndefined();
      expect(execSpy).toHaveBeenCalledTimes(1); // No re-ejecutó ni inventó casos
      expect(fs.readFileSync(checkpointFile, 'utf-8')).toBe(checkpointBefore);

      const reportAfterSecondResume = readLatestReportPair('auditflow');
      expect(reportAfterSecondResume.json.status).toBe('passed');
      expect(reportAfterSecondResume.json.terminalStatus).toBe('passed');
      expect(reportAfterSecondResume.html).toContain('PASSED');

      const db1 = new QapDatabase(runtimeDir);
      const auditRuns = db1.listRuns({ flowId: 'auditflow' });
      expect(auditRuns).toHaveLength(2);
      for (const r of auditRuns) {
        expect(r.overall_status).toBe('passed');
        const runJson = JSON.parse(
          fs.readFileSync(path.join(runtimeDir, 'runs', r.run_id, 'run.json'), 'utf-8')
        ) as Record<string, unknown>;
        expect(runJson.overallStatus).toBe('passed');
      }
      const noOpRun = db1.getRun(auditRuns[0].run_id)!;
      expect(noOpRun.steps).toEqual([]);
      expect(noOpRun.resumeNoOp).toBe(true);
      db1.close();

      // 2. Bloqueado por blocked_missing_oracle
      await setupModuleAndFlow('oracleflow', 'checkout', [{ id: 'TC-BVA-001', tags: ['smoke'] }]);
      execSpy.mockResolvedValueOnce({
        _version: '1',
        execution_id: 'exec_oracle',
        module: 'checkout',
        env: 'local',
        started_at: '2026-11-18T12:01:00.000Z',
        finished_at: '2026-11-18T12:01:00.000Z',
        result: 'failed',
        timed_out: false,
        summary: { total: 1, passed: 0, failed: 0, skipped: 0, not_run: 1 },
        cases: [
          {
            id: 'TC-BVA-001',
            title: 'BVA sin oráculo',
            result: 'not_run',
            not_run_reason: 'blocked_missing_oracle: Caso sin oráculo acreditado.',
            duration_ms: 0,
          },
        ],
      });

      process.exitCode = undefined;
      await handleFlowCommand('run', 'oracleflow', { tags: 'smoke', projectRoot: e2eDir });
      expect(process.exitCode).toBe(1);
      const oracleReport = readLatestReportPair('oracleflow');
      expect(oracleReport.json.status).toBe('failed');
      expect(oracleReport.json.terminalStatus).toBe('failed');
      expect(JSON.stringify(oracleReport.json)).toContain('TC-BVA-001');
      expect(JSON.stringify(oracleReport.json)).toContain('not_run');
      expect(JSON.stringify(oracleReport.json)).toContain('blocked_missing_oracle');
      expect(oracleReport.html).toContain('TC-BVA-001');
      expect(oracleReport.html).toContain('NOT_RUN');
      expect(oracleReport.html).toContain('blocked_missing_oracle');

      const db2 = new QapDatabase(runtimeDir);
      const oracleRunRow = db2.listRuns({ flowId: 'oracleflow' })[0];
      expect(oracleRunRow.overall_status).toBe('failed');
      const oracleRun = db2.getRun(oracleRunRow.run_id)!;
      expect(oracleRun.overallStatus).toBe('failed');
      expect(oracleRun.steps[0].capabilityId).toContain('TC-BVA-001');
      expect(oracleRun.steps[0].status).toBe('not_run');
      expect(oracleRun.steps[0].error?.message).toContain('blocked_missing_oracle');
      db2.close();

      // 4. Mixto aprobado/fallido
      await setupModuleAndFlow('mixedflow', 'orders', [
        { id: 'TC-PASS-1', tags: ['smoke'] },
        { id: 'TC-FAIL-1', tags: ['smoke'] },
      ]);
      execSpy.mockResolvedValueOnce({
        _version: '1',
        execution_id: 'exec_mixed',
        module: 'orders',
        env: 'local',
        started_at: '2026-11-18T12:02:00.000Z',
        finished_at: '2026-11-18T12:02:02.000Z',
        result: 'partial',
        timed_out: false,
        summary: { total: 2, passed: 1, failed: 1, skipped: 0, not_run: 0 },
        cases: [
          { id: 'TC-PASS-1', title: 'Orden OK', result: 'passed', duration_ms: 80 },
          {
            id: 'TC-FAIL-1',
            title: 'Orden Error',
            result: 'failed',
            failure_type: 'assertion_failed',
            steps: [{ status: 'failed', action: 'assert', message: 'Total mismatch' }],
            duration_ms: 45,
          },
        ],
      });

      process.exitCode = undefined;
      await handleFlowCommand('run', 'mixedflow', { tags: 'smoke', projectRoot: e2eDir });
      expect(process.exitCode).toBe(1);
      const mixedReport = readLatestReportPair('mixedflow');
      expect(mixedReport.json.status).toBe('failed');
      expect(mixedReport.json.terminalStatus).toBe('failed');
      expect(mixedReport.json.summary).toEqual({
        totalCases: 2,
        passed: 1,
        failed: 1,
        skipped: 0,
        notRun: 0,
      });
      expect(mixedReport.html).toContain('TC-PASS-1');
      expect(mixedReport.html).toContain('TC-FAIL-1');
      expect(mixedReport.html).toContain('Total mismatch');

      const db3 = new QapDatabase(runtimeDir);
      const mixedRow = db3.listRuns({ flowId: 'mixedflow' })[0];
      expect(mixedRow.overall_status).toBe('failed');
      expect(mixedRow.terminal_status).toBe('failed');
      expect(mixedRow.case_classification).toBe('partial');
      const mixedRunJson = JSON.parse(
        fs.readFileSync(path.join(runtimeDir, 'runs', mixedRow.run_id, 'run.json'), 'utf-8')
      ) as Record<string, unknown>;
      expect(mixedRunJson.overallStatus).toBe('failed');
      expect(mixedRunJson.terminalStatus).toBe('failed');
      expect(mixedRunJson.caseClassification).toBe('partial');
      expect(mixedRunJson.caseSummary).toEqual({
        totalCases: 2,
        passed: 1,
        failed: 1,
        skipped: 0,
        notRun: 0,
        blocked: 0,
      });
      db3.close();

      // 5. Flujo sin casos ejecutados (--tags no coincide) -> failed en CLI/HTML/JSON/SQLite/run.json
      await setupModuleAndFlow('emptycaseflow', 'billing', [{ id: 'TC-REG', tags: ['regression'] }]);
      process.exitCode = undefined;
      await handleFlowCommand('run', 'emptycaseflow', { tags: 'nonexistent', projectRoot: e2eDir });
      expect(process.exitCode).toBe(1);
      const emptyReport = readLatestReportPair('emptycaseflow');
      expect(emptyReport.json.status).toBe('failed');
      expect(emptyReport.json.terminalStatus).toBe('failed');
      expect(emptyReport.html).toContain('FAILED');

      const db4 = new QapDatabase(runtimeDir);
      const emptyRow = db4.listRuns({ flowId: 'emptycaseflow' })[0];
      expect(emptyRow.overall_status).toBe('failed');
      const emptyRun = db4.getRun(emptyRow.run_id)!;
      expect(emptyRun.steps).toEqual([]);
      expect(emptyRun.caseSummary).toEqual({
        totalCases: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        notRun: 0,
        blocked: 0,
      });
      const emptyRunJson = JSON.parse(
        fs.readFileSync(path.join(runtimeDir, 'runs', emptyRow.run_id, 'run.json'), 'utf-8')
      ) as Record<string, unknown>;
      expect(emptyRunJson.overallStatus).toBe('failed');
      expect(emptyRunJson.caseSummary).toEqual({
        totalCases: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        notRun: 0,
        blocked: 0,
      });
      db4.close();

      // Reindexación tras borrar SQLite conserva exactamente todos los registros y migración idempotente
      for (const f of ['qap.sqlite', 'qap.sqlite-wal', 'qap.sqlite-shm']) {
        fs.rmSync(path.join(runtimeDir, f), { force: true });
      }
      const rebuiltDb = new QapDatabase(runtimeDir);
      expect(rebuiltDb.reindex()).toBe(5);
      expect(rebuiltDb.listRuns({ flowId: 'mixedflow' })[0].overall_status).toBe('failed');
      expect(rebuiltDb.listRuns({ flowId: 'auditflow' }).every((r) => r.overall_status === 'passed')).toBe(true);
      const rebuiltEmpty = rebuiltDb.getRun(emptyRow.run_id)!;
      expect(rebuiltEmpty.overallStatus).toBe('failed');
      expect(rebuiltEmpty.steps).toEqual([]);
      expect(rebuiltEmpty.caseSummary?.totalCases).toBe(0);
      const rebuiltOracle = rebuiltDb.getRun(oracleRunRow.run_id)!;
      expect(rebuiltOracle.steps[0].status).toBe('not_run');
      expect(rebuiltOracle.steps[0].error?.message).toContain('blocked_missing_oracle');
      rebuiltDb.close();

      // Segunda apertura sobre la misma SQLite verifica idempotencia de migración
      const idempotentDb = new QapDatabase(runtimeDir);
      expect(idempotentDb.listRuns({ flowId: 'emptycaseflow' })[0].overall_status).toBe('failed');
      idempotentDb.close();
    } finally {
      fs.rmSync(e2eDir, { recursive: true, force: true });
    }
  });
});
