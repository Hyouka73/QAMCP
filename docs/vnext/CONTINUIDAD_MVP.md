# QAP · Continuidad en otra computadora

La base de trabajo es `feat/mvp-conversational-recovery` en `Hyouka73/QAMCP`. El código integrado se verificó en `a416e23d336c3732852ae168e72091212dbc9b9a`. El [plan de recuperación](PLAN_ONE_SHOT_Y_MERGE.md) contiene el diagnóstico, el orden de trabajo y las dos demos pendientes. [Estado vNext](STATE.md) · [Requisitos del QA](REQUISITOS_QA_MVP_OPERATIVO.md)

## Preparar el checkout y el cliente

En un directorio para el desarrollo, ejecutar:

```powershell
git clone --branch feat/mvp-conversational-recovery https://github.com/Hyouka73/QAMCP.git
Set-Location QAMCP
git rev-parse HEAD
node -v
pnpm -v
pnpm install --frozen-lockfile
pnpm build
pnpm exec playwright-core install chromium
node packages/cli/dist/entrypoint.js --help
node packages/cli/dist/entrypoint.js flow --help
```

El candidato se compiló y arrancó en Windows con Node `22.16.0` y pnpm `11.3.0`. La composición de aplicación requiere `node:sqlite` con FTS5. El mínimo histórico de Node 18 en la guía general corresponde a rutas anteriores. Antes de ensayar con otra versión, verificar que SQLite y Chromium funcionan mediante las pruebas del candidato.

Para registrar el servidor en el cliente MCP, apuntar a la ruta absoluta del nuevo checkout:

```json
{
  "mcpServers": {
    "qap-vnext": {
      "command": "node",
      "args": ["C:/ruta/QAMCP/packages/mcp/dist/server.js"]
    }
  }
}
```

Tras recargar el cliente, comprobar el catálogo en `tools/list` y la versión con `qap_server`. El servidor directo y la entrada CLI `mcp` expusieron **20 herramientas**. `qap_start` aparece en `prompts/list`. La raíz absoluta que recibe cada tool corresponde al proyecto QA que se va a probar. La preparación de la carpeta y el perfil en una máquina nueva es del operador del host, antes de la prueba conversacional. [Instalación y troubleshooting](../../AGENTS.md) · [Composición con host privado](uso/DEV-MVP-02_CLIENTE_MCP.md)

El remoto lleva código, pruebas y decisiones documentadas. Para continuar una campaña real en otro equipo, se necesita el estado operativo y Knowledge privado del proyecto, sus archivos `.qa` y la configuración del host con las rutas del equipo nuevo. La portabilidad de una campaña protegida requiere verificación específica. Empezar las pruebas de esta ronda en un fixture local nuevo y reprovisionar los accesos de prueba para el entorno acordado. Las sesiones, claves, registros del host y archivos de proyectos externos quedan bajo control del operador.

## Repetir la evidencia en el candidato

La última corrida completa de MCP dio 616 aprobadas, 35 fallidas y 3 omitidas. Para el triage empezar por autorización/autenticación y preservar el resultado del baseline. [Verificación y compuertas](PLAN_ONE_SHOT_Y_MERGE.md#verificación-del-candidato-integrado)

```powershell
pnpm --filter @qap/playwright-runner exec vitest run src/__tests__/flow-ab-chromium.test.ts --maxWorkers=1 --no-file-parallelism --no-color
pnpm --filter @qap/mcp exec vitest run src/__tests__/p0-2a-discovery-dossier.test.ts src/__tests__/p0-2b-scoped-business-rules.test.ts src/__tests__/scoped-rule-resolver.test.ts src/__tests__/block2-input-auth-discovery.test.ts src/__tests__/block3-cases-execution-reports.test.ts src/__tests__/host-silent-scope-regression.test.ts --maxWorkers=1 --no-file-parallelism --no-color
pnpm --filter @qap/mcp exec vitest run src/__tests__/block4-clean-package-acceptance.test.ts --maxWorkers=1 --no-file-parallelism --no-color
pnpm --filter @qap/mcp exec vitest run --maxWorkers=1 --no-file-parallelism --no-color
```

Para el flujo CLI, `qap flow <flow>` lee la definición YAML de `.qa/flows/` en el directorio actual y corre los módulos. El `--help` de cada comando describe su interfaz actual. Para soporte MCP, el [catálogo y referencia de comandos](AUDITORIA_FLUJO_QA_Y_MEMORIA.md#referencia-operativa-actual) explica su papel. `qap_project` con acción `discovery_dossier` consulta la memoria por alcance y revisión. `discovery_dossier_regenerate` reconstruye la publicación. Para planificar, `qap_plan` admite `discovery_revision_id`, `environment`, `tenant_id` y `profile` en el flujo de casos.

## Retomar el trabajo

1. Registrar el SHA, confirmar build y reproducir la matriz de regresión. Comparar por identidad de fallo. Los resultados de pruebas pueden variar por Chromium y carga.
2. Abrir un chat nuevo de Hydrogen para **P0.3a**, la autoridad de oráculos y la consulta de casos sin efectos. Si se trabaja en paralelo, abrir otro chat nuevo para **P0.4**, grabación WebM y traza por intento en el runner. Mantener los encargos y checkouts separados.
3. Integrar **P0.3b** con los IDs, revisiones, alcance, casos ejecutables y la composición A→B desde MCP. Completar la consulta de memoria **P0.3c**. Integrar D-014 después de tener el plan y la evidencia.
4. Pasar ambas demos completas y las compuertas de merge sobre un único SHA, con la bitácora recuperable tras reinicio.
