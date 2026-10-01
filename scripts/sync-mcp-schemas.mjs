import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createMcpServer } from '../packages/mcp/dist/index.js';
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

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

3. **USA LAS CAPACIDADES INTERACTIVAS DEL IDE**:
   - Cuando necesites confirmación, aprobación o selecciones del usuario, llama OBLIGATORIAMENTE a la herramienta interactiva **\`ask_question\`** con las opciones seleccionables (botones interactivos del IDE).
   - O crea un artefacto (**artifact**) con **\`RequestFeedback: true\`** si presentas un plan estructurado o configuración para que el usuario disponga del botón "Proceed".

4. **Flujo Paso a Paso Guiado**:
   - Cada herramienta de QAP te devuelve los campos \`pregunta\` y \`opciones\`.
   - Utiliza esos campos directamente en \`ask_question\` para que el usuario responda con un solo clic.
   - Espera la respuesta antes de ejecutar la siguiente herramienta del ciclo (\`qap_init\`, \`qap_discover\`, \`qap_plan\`, \`qap_test\`, \`qap_report\`).

5. **ENTREVISTA EN UN SOLO MENSAJE**:
   - Cuando \`siguiente_accion.tipo\` sea "entrevista", formula las preguntas listadas en un solo mensaje, en texto libre, sin botones interactivos.

6. **RESPUESTA A TOOLS BLOQUEADAS**:
   - Si una tool responde con status "blocked", sigue obligatoriamente la indicación de \`desbloquear_con\` y no intentes rodearla.

7. **INTEGRIDAD DE PROCEDENCIA DE DATOS**:
   - NUNCA registres con source "user" algo que el usuario no haya dicho o confirmado explícitamente.

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
