/* global console */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { createMcpServer } from '../packages/mcp/dist/index.js';

const targetDir = 'C:/Users/Judirico/.gemini/antigravity-ide/mcp/qap-mcp';

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

// 2. Crear instructions.md con directivas estrictas para el agente
const instructionsContent = `# Instrucciones de QAP (qap-mcp) para el Asistente

## Directivas Críticas de Interacción y Experiencia de Usuario:
1. **PARÁMETRO \`targetPath\` OBLIGATORIO**:
   - En TODAS las llamadas a las herramientas de \`qap-mcp\` (\`qap_status\`, \`qap_init\`, \`qap_clean\`, \`qap_auth_add\`, \`qap_auth_list\`, \`qap_context_set\`, \`qap_context_ingest\`, \`qap_session_plan\`, \`qap_discover\`, \`qap_rules_set\`, \`qap_module_close\`, \`qap_session_close\`, \`qap_plan\`, \`qap_validate\`, \`qap_test\`, \`qap_report\`, \`qap_server\`, \`qap_prune\`), debes enviar SIEMPRE la ruta absoluta del workspace abierto en el parámetro \`targetPath\`.
   - NUNCA omitas este parámetro, para asegurar que el motor opere exactamente sobre la carpeta del proyecto del usuario y no en el directorio de ejecución del proceso MCP.

2. **PROHIBIDO los muros de texto**:
   - NUNCA generes tablas de estado largas con parámetros del proyecto.
   - NUNCA generes explicaciones de arquitectura o listas de 4 pasos futuros (1, 2, 3...).

3. **PREGUNTAS ESTRUCTURADAS CON \`ask_question\`**:
   - Cuando siguiente_accion trae pregunta, presentala con la herramienta ask_question: UNA sola pregunta por llamada, usando texto, formato y opciones tal cual (no inventes, reordenes ni agregues opciones). Deja siempre disponible la respuesta libre. Si formato es abierta, haz esa unica pregunta en texto y espera. Nunca agrupes varias preguntas en un mensaje ni preguntes algo que siguiente_accion no pidio. Si ask_question no existe en tu cliente, haz la misma pregunta en texto con las opciones numeradas, una a la vez.

4. **REGISTRO DE RESPUESTAS**:
   - Tras cada respuesta, registrala con la tool de pregunta.registrar_con y sigue la nueva siguiente_accion. Si el usuario eligio una opcion usa su efecto; si escribio texto libre, registralo con source user y con sus palabras. Nunca registres como source user algo que el usuario no dijo ni eligio.

5. **Flujo Paso a Paso Guiado**:
   - Una sola pregunta al usuario por turno; los pasos de tipo trabajo no requieren preguntar: ejecútalos y sigue la nueva siguiente_accion. Antes de preguntar algo que pueda estar en el workspace, léelo (documentos, README, package.json).

6. **REGLAS DE NEGOCIO CONFIRMADAS**:
   - NUNCA llames qap_rules_set con datos no confirmados por el usuario.

7. **RESPUESTA A TOOLS BLOQUEADAS**:
   - Si una tool responde con status "blocked", sigue obligatoriamente la indicación de \`desbloquear_con\` y no intentes rodearla.

8. **CONFIRMACIÓN DE HIPÓTESIS DOM**:
   - Para hipótesis DOM (source "dom", status "inferred"): CONFIRMA cada una con el usuario antes de marcarla como "confirmed". Presenta las hipótesis al usuario y pregunta cuáles son correctas.

9. **CONFIRMACIÓN EXPLÍCITA PARA CIERRE DE MÓDULO**:
   - Presenta al usuario el resumen de cierre del módulo y llama \`qap_module_close\` solo con su confirmación explícita (\`user_confirmed: true\`).

10. **DECLARACIÓN DE WAIVERS**:
    - Declara un waiver únicamente cuando el usuario haya dicho que la categoría no aplica, citando su razón (mínimo 15 caracteres).

11. **RESUMEN DE REPORTE DE BRECHAS**:
    - Al cerrar la sesión, presenta al usuario el resumen del reporte de brechas generado.
`;

writeFileSync(join(targetDir, 'instructions.md'), instructionsContent, 'utf-8');
console.log('✔ Escrito: instructions.md');
console.log('Sincronización completada exitosamente.');
