import * as fs from 'node:fs';
import * as path from 'node:path';

import { FlowOrchestrator } from '@qap/engine';
import { FileSystemStorage, FlowContextStore, LockManager } from '@qap/knowledge';
import { PlaywrightRunner } from '@qap/playwright-runner';
import { createFlowTelemetry, normalizeFlowResult, writeFlowReports } from '@qap/reporter';
import type { FlowDefinition } from '@qap/shared';

export interface FlowCommandOptions {
  env?: string;
  tags?: string;
  headed?: boolean;
  all?: boolean;
  projectRoot?: string;
}

export type FlowAction = 'run' | 'resume' | 'list' | 'validate' | 'debug';

async function loadFlowDefinition(
  storage: FileSystemStorage,
  flowName: string,
  rootDir: string
): Promise<FlowDefinition> {
  const flowFile = path.join(rootDir, '.qa', 'flows', `${flowName}.yaml`);
  if (!fs.existsSync(flowFile)) {
    throw new Error(`No se encontró el flujo '${flowName}' en .qa/flows/${flowName}.yaml`);
  }
  return await storage.getFlow(flowName);
}

function requireName(name: string | undefined, usage: string): string {
  if (!name) {
    throw new Error(usage);
  }
  return name;
}

function isPassed(result: unknown): boolean {
  const status = (result as { status?: string }).status;
  return status === 'passed' || status === 'success';
}

export async function handleFlowCommand(
  action: FlowAction,
  flowName?: string,
  options: FlowCommandOptions = {}
): Promise<void> {
  const rootDir = options.projectRoot ?? process.cwd();
  const flowStatesDir = path.join(rootDir, '.qa', 'cache', 'flow_states');
  const storage = new FileSystemStorage({ rootDir });

  const buildOrchestrator = (name: string): FlowOrchestrator => {
    const runner = new PlaywrightRunner({ projectRoot: rootDir });
    const lockManager = new LockManager({ rootDir });
    const flowStore = new FlowContextStore(rootDir);
    const telemetry = createFlowTelemetry({
      runtimeDir: path.join(rootDir, '.qa', 'runtime'),
      flowName: name,
    });
    return new FlowOrchestrator(storage, runner, lockManager, flowStore, telemetry);
  };

  switch (action) {
    case 'list': {
      console.log('Flujos disponibles en el proyecto:');
      let names: string[];
      try {
        names = await storage.listFlows();
      } catch {
        names = [];
      }
      if (names.length === 0) {
        console.log(' (No hay flujos en .qa/flows)');
      }
      for (const n of names) {
        console.log(` - ${n}`);
      }
      break;
    }

    case 'validate': {
      let names: string[] = [];
      if (options.all) {
        try {
          names = await storage.listFlows();
        } catch {
          names = [];
        }
      } else {
        names.push(requireName(flowName, 'Debe indicar un flujo o usar --all: qap flow validate <flow> | --all'));
      }

      let hasErrors = false;
      for (const n of names) {
        try {
          const def = (await loadFlowDefinition(storage, n, rootDir)) as unknown as Record<string, unknown>;
          const modules = def.modules ?? def.steps;
          if (!Array.isArray(modules) || modules.length === 0) {
            throw new Error("el flujo no define 'modules' (o está vacío)");
          }
          console.log(`✔ ${n}: válido`);
        } catch (err: unknown) {
          hasErrors = true;
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`✘ ${n}: ${msg}`);
        }
      }
      if (hasErrors) process.exitCode = 1;
      break;
    }

    case 'run': {
      const name = requireName(flowName, 'Debe especificar el nombre del flujo a ejecutar: qap flow run <flow>');
      const flowDef = await loadFlowDefinition(storage, name, rootDir);
      console.log(`Ejecutando flujo '${name}'...`);

      // `run` empieza de cero: borra checkpoint y respaldo previos
      for (const f of [`${name}.state.json`, `${name}.sessions.bak.json`]) {
        fs.rmSync(path.join(flowStatesDir, f), { force: true });
      }

      const result = await buildOrchestrator(name).executeFlow(flowDef, {
        environment: options.env,
        headless: !options.headed,
        tags: options.tags ? options.tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      });
      console.log('Resultado de ejecución:', JSON.stringify(result, null, 2));
      const runPaths = writeFlowReports(normalizeFlowResult(result), rootDir);
      console.log(`Reporte HTML: ${runPaths.html}`);
      if (!isPassed(result)) process.exitCode = 1;
      break;
    }

    case 'resume': {
      const name = requireName(flowName, 'Debe especificar el nombre del flujo a reanudar: qap flow resume <flow>');
      const flowDef = await loadFlowDefinition(storage, name, rootDir);

      const checkpointPath = path.join(flowStatesDir, `${name}.state.json`);
      if (!fs.existsSync(checkpointPath)) {
        console.warn(`[Advertencia] No hay checkpoint previo en ${checkpointPath}. Se iniciará desde cero.`);
      }
      console.log(`Reanudando flujo '${name}' desde checkpoint...`);

      // `resume` NO borra nada: el orquestador carga el checkpoint y omite los módulos completados
      const result = await buildOrchestrator(name).executeFlow(flowDef, {
        environment: options.env,
        headless: !options.headed,
        tags: options.tags ? options.tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      });

      console.log('Resultado de reanudación:', JSON.stringify(result, null, 2));
      const resumePaths = writeFlowReports(normalizeFlowResult(result), rootDir);
      console.log(`Reporte HTML: ${resumePaths.html}`);
      if (!isPassed(result)) process.exitCode = 1;
      break;
    }

    case 'debug': {
      const name = requireName(flowName, 'Debe especificar el nombre del flujo a depurar: qap flow debug <flow>');
      console.log(`Estado del flujo '${name}':`);

      const checkpointPath = path.join(flowStatesDir, `${name}.state.json`);
      if (fs.existsSync(checkpointPath)) {
        console.log('Checkpoint (.state.json):');
        console.log(fs.readFileSync(checkpointPath, 'utf-8'));
      } else {
        console.log(' Sin checkpoint guardado.');
      }

      const backupPath = path.join(flowStatesDir, `${name}.sessions.bak.json`);
      console.log(`Respaldo de sesiones: ${fs.existsSync(backupPath) ? 'existe' : 'no existe'}`);
      break;
    }

    default:
      throw new Error(`Acción desconocida para flow: ${String(action)}`);
  }
}

export async function handleFlow(flowName: string, options: FlowCommandOptions = {}): Promise<void> {
  await handleFlowCommand('run', flowName, options);
}
