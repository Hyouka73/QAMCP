import * as path from 'node:path';

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { FlowOrchestrator } from '@qap/engine';
import { FileSystemStorage } from '@qap/knowledge';
import { PlaywrightRunner } from '@qap/playwright-runner';
import { createFlowTelemetry, normalizeFlowResult, writeFlowReports } from '@qap/reporter';

export const FLOW_RUN_TOOL: Tool = {
  name: 'qap_flow_run',
  description:
    'Ejecuta un flujo multimódulo definido en .qa/flows/<flow>.yaml. ' +
    'Respalda las sesiones, comparte variables entre módulos, guarda un checkpoint por módulo, ' +
    'genera un reporte HTML en .qa/reports y registra la corrida en la telemetría.',
  inputSchema: {
    type: 'object',
    properties: {
      flow: { type: 'string', description: 'Nombre del flujo (sin extensión).' },
      env: { type: 'string', description: 'Entorno de ejecución.' },
      headed: { type: 'boolean', description: 'Navegador visible.' },
    },
    required: ['flow'],
  },
};

export interface FlowRunArgs {
  flow: string;
  env?: string;
  headed?: boolean;
}

export async function qapFlowRunTool(
  args: FlowRunArgs,
  rootDir: string = process.cwd()
): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
  const storage = new FileSystemStorage({ rootDir });
  const runner = new PlaywrightRunner();
  const telemetry = createFlowTelemetry({
    runtimeDir: path.join(rootDir, '.qa', 'runtime'),
    flowName: args.flow,
  });
  const orchestrator = new FlowOrchestrator(storage, runner, undefined, rootDir, telemetry);

  const flowDef = await storage.getFlow(args.flow);
  const result = await orchestrator.executeFlow(flowDef, {
    environment: args.env,
    headless: !args.headed,
  });

  const paths = writeFlowReports(normalizeFlowResult(result), rootDir);
  const status = (result as unknown as { status?: string }).status;

  return {
    content: [
      { type: 'text', text: JSON.stringify({ ...result, reporte_html: paths.html }, null, 2) },
    ],
    isError: status !== 'passed',
  };
}