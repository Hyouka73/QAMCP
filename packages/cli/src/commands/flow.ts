import { FlowOrchestrator } from '@qap/engine';
import { FileSystemStorage, FlowContextStore, LockManager } from '@qap/knowledge';
import { PlaywrightRunner } from '@qap/playwright-runner';
import type { FlowDefinition } from '@qap/shared';

import { DataError } from '../errors.js';

export async function handleFlow(flowName: string): Promise<void> {
  const rootDir = process.cwd();
  const storage = new FileSystemStorage({ rootDir });

  let flowDef: FlowDefinition;
  try {
    flowDef = await storage.getFlow(flowName);
  } catch (err) {
    throw new DataError(
      `No se pudo cargar el flow '${flowName}' desde .qa/flows/${flowName}.yaml`,
      { cause: err }
    );
  }

  const runner = new PlaywrightRunner({ projectRoot: rootDir });
  const lockManager = new LockManager({ rootDir });
  const flowStore = new FlowContextStore(rootDir);
  const orchestrator = new FlowOrchestrator(storage, runner, lockManager, flowStore);

  const result = await orchestrator.executeFlow(flowDef, {});
  const status = (result as unknown as { status?: string }).status ?? 'error';
  const passed = status === 'passed' || status === 'success';

  console.log(`Flow '${flowDef.name ?? flowName}': ${status}`);
  process.exitCode = passed ? 0 : 1;
}
