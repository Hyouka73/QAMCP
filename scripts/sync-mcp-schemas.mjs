import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { createMcpServer } from '../packages/mcp/dist/index.js';

const targetDir = resolve(process.argv[2] ?? join(homedir(), '.gemini', 'antigravity-ide', 'mcp', 'qap-mcp'));

if (!existsSync(targetDir)) {
  mkdirSync(targetDir, { recursive: true });
}

// 1. Obtener lista de tools del servidor compilado
const server = createMcpServer();
// @ts-expect-error accessing internal request handler
const handler = server._requestHandlers.get(ListToolsRequestSchema.shape.method.value);
const toolsResult = await handler({ method: 'tools/list', params: {} }, {});

console.log(`Sincronizando ${toolsResult.tools.length} herramientas MCP a ${targetDir}...`);

for (const tool of toolsResult.tools) {
  const schemaPath = join(targetDir, `${tool.name}.json`);
  const schemaContent = {
    name: tool.name,
    description: tool.description,
    parameters: tool.inputSchema,
  };
  writeFileSync(schemaPath, JSON.stringify(schemaContent, null, 2), 'utf-8');
  console.log(`✔ Escrito: ${tool.name}.json`);
}

const instructionsContent = [
  '# QA autónomo con QAP',
  '',
  'Ante «Quiero probar un sistema», llama qap_start con la ruta absoluta del workspace seleccionado.',
  'El destino, los perfiles y la política del entorno se configuran en el host. Conserva conversation_id en las llamadas.',
  'Cuando el inventario se agote, interpreta las vistas acreditadas y genera escenarios con qap_plan.',
  'Registra expectativas sin evidencia como indeterminadas. Materializa, planifica, ejecuta con qap_test y publica con qap_report.',
  'Sigue con casos independientes cuando se deniegue una operación. Respeta el alcance y usa el runner oficial. Mantén las credenciales en el host.',
  '',
].join('\n');

writeFileSync(join(targetDir, 'instructions.md'), instructionsContent, 'utf-8');
console.log('✔ Escrito: instructions.md');
console.log('Sincronización completada exitosamente.');
