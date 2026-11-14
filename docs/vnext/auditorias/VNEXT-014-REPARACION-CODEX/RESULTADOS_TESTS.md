**Auditoría independiente de reparación. Fecha local: 2026-11-05 (America/Mexico_City). HEAD probado: 8f091626825ceb2fa3f1abdfb0732f0f3dad8e9c.**

# Entorno, comandos y limitaciones

Windows 11 x64, kernel 10.0.26200; Git 2.54.0.windows.1; Node v24.15.0; pnpm 12.3.4; SQLite 3.51.3 con FTS5=1. Knowledge imprimió outcome=v2 ready y sus 258 pruebas pasaron. Runner ejecutó 71 tests y CLI 78; no se atribuye esa ejecución al producto sintético de los gateways.

## Preparación y verificación

La carpeta inicial C:/Users/Judirico/Documents/QAMCP es contenedora, no repositorio. El primer status/read de AGENTS allí falló y la primera consulta remota sufrió MSYS acceso denegado del sandbox. Se localizó el checkout QAMCP/QAMCP y se repitió fetch/ls-remote fuera del sandbox: éxito, HEAD esperado. No se dedujo un fallo de autenticación ni de producto a partir del error ambiental. La creación de worktree fue cancelada; se usó git clone --no-hardlinks --no-checkout del repositorio local y checkout -b audit/vnext014-reparacion del SHA exacto. El status inicial del clon fue vacío.

| Comando/acción adicional realmente ejecutada | Exit / resultado |
| --- | --- |
| git fetch origin feat/qap-vnext-architecture; git ls-remote origin refs/heads/feat/qap-vnext-architecture (checkout real) | 0; 8f091626825ceb2fa3f1abdfb0732f0f3dad8e9c |
| git rev-parse HEAD (checkout original, antes de aislamiento) | 0; ed2955ff91a6506a80e3ff0e4bb9322cf9eed226; no se usó para las pruebas |
| git clone --no-hardlinks --no-checkout ...; git checkout -b audit/vnext014-reparacion 8f091626825ceb2fa3f1abdfb0732f0f3dad8e9c | 0/0 |
| git status --porcelain (clon inicial) | 0, salida vacía |
| node --version; pnpm --version | 0/0; v24.15.0 / 12.3.4 |
| pnpm install --frozen-lockfile (sandbox) | 1 al interrumpir tras errores DNS; no constituye instalación válida |
| pnpm install --frozen-lockfile (fuera de sandbox) | 0; lockfile intacto |
| pnpm build | 0; diez paquetes, servidor y CLI dist presentes |
| pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-coverage.test.ts src/__tests__/host-composition.test.ts --maxWorkers=1 --reporter=verbose | 0; 70/70 |
| node ../reparacion-evidence/setup.mjs | 0; extracción/bundle de helpers del HEAD auditado |
| node ../reparacion-evidence/report.mjs | 0; sondas A01/A02 + error/retry |
| AUDIT_SCENARIOS=receipt-module-existing-revision,receipt-application-existing-revision; node ../reparacion-evidence/report.mjs | 0; CAS aceptados y rechazo canónico |
| node ../reparacion-evidence/existing-only.mjs | 0; cinco fixtures A03 |
| node ../reparacion-evidence/crash.mjs | 0; hijo exit 83 esperado + retry |
| node ../reparacion-evidence/transition-rejected.mjs | 0; rama success:false inyectada solo en bundle externo |
| node ../reparacion-evidence/fences.mjs (primero/repetición) | 1 por expectativa externa CONFLICT frente a UNAVAILABLE; 0 tras corregir únicamente arnés y conservar log |
| node ../reparacion-evidence/fence-conflict.mjs | 0 del arnés; integridad PASS, contrato blocked específico FAIL, retry PASS |
| node ../reparacion-evidence/wrapper.mjs | 0; confirma bypass externo 4/4 y control 4/4 |
| pnpm --filter @hyouka73/qap-cli test | 0; 78/78; filtro real corregido |
| pnpm --filter @qap/mcp exec vitest run --reporter=json --outputFile=../../node_modules/vnext014-audit-mcp-parallel.json | 1; repetición paralela 429/66/495 |
| TEMP y TMP=node_modules/.audit-e01-temp; NODE_OPTIONS=--import=file:///C:/Users/Judirico/Documents/QAMCP/reparacion-evidence/observe-fs.mjs --trace-warnings; AUDIT_FS_EVENTS=.../fs-events.jsonl; pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-coverage.test.ts src/__tests__/durable-interview.test.ts src/__tests__/p4-2-pregunta-contract.test.ts src/__tests__/state-handlers.test.ts src/__tests__/test-handler.test.ts --reporter=json --outputFile=../../node_modules/vnext014-audit-e01-focus.json | 1; 129 PASS/2 FAIL históricos de 131; cero extras |
| TEMP y TMP=node_modules/.audit-e01-full-temp; mismo NODE_OPTIONS; AUDIT_FS_EVENTS=.../fs-full-events.jsonl; pnpm --filter @qap/mcp test | 1; 428/67/495 + dos unhandled |
| node ../reparacion-evidence/compare.mjs | 0; multiset por ruta+fullName exacto, conserva duplicados |

Los set de variables anteriores fueron PowerShell ($env:...), no sintaxis shell POSIX. Los scripts están en REPRODUCCIONES. Se conservaron parámetros/expectativas/timeouts productivos. No se ejecutó pnpm test monorepo completo: el alcance pedido fue build + MCP + runner y focales del diff; Engine/Knowledge/CLI se ejecutaron por separado. Coverage/Interview/Discovery están completas dentro de la matriz serial, sin inferir PASS de una ejecución paralela fallida.

### Registro de la matriz secuencial (timestamps UTC)

| Paso | Comando | Exit | Inicio → fin UTC |
| --- | --- | ---: | --- |
| mcp-serial | pnpm --filter @qap/mcp exec vitest run --maxWorkers=1 --reporter=json --outputFile=../../node_modules/vnext014-audit-mcp-serial.json | 1 | 2026-11-05T21:03:24.9257239Z → 2026-11-05T21:06:07.0500604Z |
| mcp-parallel | pnpm --filter @qap/mcp test | 1 | 2026-11-05T21:06:07.0964159Z → 2026-11-05T21:07:05.3408674Z |
| runner | pnpm --filter @qap/playwright-runner test | 0 | 2026-11-05T21:07:05.3472841Z → 2026-11-05T21:07:13.4881357Z |
| engine | pnpm --filter @qap/engine exec vitest run --maxWorkers=1 | 0 | 2026-11-05T21:07:13.4903474Z → 2026-11-05T21:07:20.1544760Z |
| knowledge | pnpm --filter @qap/knowledge exec vitest run --maxWorkers=1 | 0 | 2026-11-05T21:07:20.1678263Z → 2026-11-05T21:07:49.7086465Z |
| cli | pnpm --filter @qap/cli test | 0 | 2026-11-05T21:07:49.7115729Z → 2026-11-05T21:07:49.8638516Z |
| stdio | node scripts/test-mcp-stdio.mjs | 0 | 2026-11-05T21:07:49.8669517Z → 2026-11-05T21:07:54.1331727Z |
| lint | pnpm lint | 1 | 2026-11-05T21:07:54.1358013Z → 2026-11-05T21:09:01.8920060Z |
| lint-focal | pnpm exec eslint packages/knowledge/src/storage/file-storage.ts packages/mcp/src/handlers/canonical-closure-service.ts packages/mcp/src/handlers/canonical-session-report.ts packages/mcp/src/handlers/module-closure-store.ts packages/mcp/src/host-composition.ts packages/mcp/src/server.ts packages/mcp/src/__tests__/canonical-coverage.test.ts packages/mcp/src/__tests__/host-composition.test.ts | 1 | 2026-11-05T21:09:01.8976749Z → 2026-11-05T21:09:18.3122864Z |
| lint-json | pnpm exec eslint . --format json --output-file ../reparacion-evidence/lint.json | 1 | 2026-11-05T21:09:18.3148171Z → 2026-11-05T21:10:10.7647998Z |

El filtro @qap/cli produjo Scope: 0 y exit 0: **NO EJECUTÓ TESTS**, no se cuenta como PASS. Se corrigió al nombre real @hyouka73/qap-cli y se verificaron sus 78 tests. pnpm exec usa exit 1 por tests históricos fallidos; no se interpreta como que no corrió la suite JSON.

## Lint

Global **39/28 → 37/28**. Se compararon archivo/regla/severidad/mensaje y multiplicidad; las líneas pueden desplazarse por el diff. **62 diagnósticos históricos conservados**, cinco bajas exactas y tres altas. No se cambió configuración ESLint ni se añadió suppressions. Foco de los ocho archivos cambiados: **5 errores/0 warnings**, tres nuevos en canonical-coverage y dos históricos en module-closure-store (149:77 y 150:86). Fuentes productivas reparadas de L01 sin nuevos diagnósticos en el foco.

| Nueva infracción | Regla | Cambio mínimo recomendado, sin aplicarlo |
| --- | --- | --- |
| canonical-coverage.test.ts 1622:21 | no-unnecessary-type-assertion | Retirar ! innecesario de current.session |
| canonical-coverage.test.ts 1624:21 | misma | Igual |
| canonical-coverage.test.ts 1664:28 | misma | Retirar ! innecesario del closure catalog |

Los cinco diagnósticos anteriores efectivamente desaparecen; la condición más amplia de cero infracciones nuevas no se cumple.

~~~json
{
  "before": {
    "error": 39,
    "warning": 28
  },
  "after": {
    "error": 37,
    "warning": 28
  },
  "kept": 62,
  "added": [
    {
      "file": "packages/mcp/src/__tests__/canonical-coverage.test.ts",
      "line": 1622,
      "column": 21,
      "rule": "@typescript-eslint/no-unnecessary-type-assertion",
      "severity": 2,
      "message": "This assertion is unnecessary since it does not change the type of the expression."
    },
    {
      "file": "packages/mcp/src/__tests__/canonical-coverage.test.ts",
      "line": 1624,
      "column": 21,
      "rule": "@typescript-eslint/no-unnecessary-type-assertion",
      "severity": 2,
      "message": "This assertion is unnecessary since it does not change the type of the expression."
    },
    {
      "file": "packages/mcp/src/__tests__/canonical-coverage.test.ts",
      "line": 1664,
      "column": 28,
      "rule": "@typescript-eslint/no-unnecessary-type-assertion",
      "severity": 2,
      "message": "This assertion is unnecessary since it does not change the type of the expression."
    }
  ],
  "removed": [
    {
      "file": "packages/mcp/src/handlers/canonical-closure-service.ts",
      "line": 354,
      "column": 26,
      "rule": "@typescript-eslint/no-unnecessary-type-assertion",
      "severity": 2,
      "message": "This assertion is unnecessary since it does not change the type of the expression."
    },
    {
      "file": "packages/mcp/src/handlers/canonical-session-report.ts",
      "line": 5,
      "column": 10,
      "rule": "@typescript-eslint/no-base-to-string",
      "severity": 2,
      "message": "'value ?? ''' will use Object's default stringification format ('[object Object]') when stringified."
    },
    {
      "file": "packages/mcp/src/handlers/canonical-session-report.ts",
      "line": 5,
      "column": 67,
      "rule": "no-useless-escape",
      "severity": 2,
      "message": "Unnecessary escape character: \\[."
    },
    {
      "file": "packages/mcp/src/host-composition.ts",
      "line": 149,
      "column": 25,
      "rule": "@typescript-eslint/no-unsafe-assignment",
      "severity": 2,
      "message": "Unsafe spread of an `any` value in an array."
    },
    {
      "file": "packages/mcp/src/host-composition.ts",
      "line": 154,
      "column": 17,
      "rule": "@typescript-eslint/no-unnecessary-type-assertion",
      "severity": 2,
      "message": "This assertion is unnecessary since the receiver accepts the original type of the expression."
    }
  ]
}
~~~

## A04-W01 — frontera explícita y residuo

Reproducción actual: el setInterval se crea antes de execute. El wrapper encola transaction fuera del AsyncLocalStorage de withClosureCommitDeadline; luego demora hasta deadline+40 ms. SQLite real persiste autoridad vencida en declare_non_applicable, accept_gaps, close y waive. El replay de accept_gaps recupera el receipt de ese commit vencido. Capturar el job con AsyncLocalStorage.snapshot conserva el contexto y bloquea las cuatro con closure_review_expired y readback intacto.

El contrato añadido en module-closure-store.ts documenta expresamente que ese wrapper no es una composición host autorizada salvo propagación/recheck. La interfaz es estructural y no impide inyectarlo en runtime. loadHostComposition instancia SqliteModuleClosureStore directamente; createMcpServer admite inyección privilegiada del host pero no crea timers/colas. No se encontró un camino oficial que introduzca esa pérdida. Dictamen: P2 residual para extensiones del puerto, fuera del adaptador oficial directo certificado; ninguna garantía universal de expiración ni certificación para wrappers arbitrarios.

~~~jsonl
{"scenario":"port-preexisting-timer-queue","boundByAsyncLocalStorageSnapshot":false,"action":"declare_non_applicable","status":"declared_non_applicable","approvalCommittedAfterExpiry":true,"msPastDeadline":69,"actualSqliteStoreAndIndependentReadback":true}
{"scenario":"port-preexisting-timer-queue","boundByAsyncLocalStorageSnapshot":false,"action":"accept_gaps","status":"gaps_accepted","approvalCommittedAfterExpiry":true,"replayOfExpiredCommit":true,"msPastDeadline":110,"actualSqliteStoreAndIndependentReadback":true}
{"scenario":"port-preexisting-timer-queue","boundByAsyncLocalStorageSnapshot":false,"action":"close","status":"closed","approvalCommittedAfterExpiry":true,"msPastDeadline":63,"actualSqliteStoreAndIndependentReadback":true}
{"scenario":"port-preexisting-timer-queue","boundByAsyncLocalStorageSnapshot":false,"action":"waive","status":"waived","approvalCommittedAfterExpiry":true,"msPastDeadline":72,"actualSqliteStoreAndIndependentReadback":true}
{"scenario":"port-preexisting-timer-queue","boundByAsyncLocalStorageSnapshot":true,"action":"declare_non_applicable","status":"blocked","code":"closure_review_expired","approvalCommittedAfterExpiry":false,"msPastDeadline":67,"actualSqliteStoreAndIndependentReadback":true}
{"scenario":"port-preexisting-timer-queue","boundByAsyncLocalStorageSnapshot":true,"action":"accept_gaps","status":"blocked","code":"closure_review_expired","approvalCommittedAfterExpiry":false,"msPastDeadline":65,"actualSqliteStoreAndIndependentReadback":true}
{"scenario":"port-preexisting-timer-queue","boundByAsyncLocalStorageSnapshot":true,"action":"close","status":"blocked","code":"closure_review_expired","approvalCommittedAfterExpiry":false,"msPastDeadline":69,"actualSqliteStoreAndIndependentReadback":true}
{"scenario":"port-preexisting-timer-queue","boundByAsyncLocalStorageSnapshot":true,"action":"waive","status":"blocked","code":"closure_review_expired","approvalCommittedAfterExpiry":false,"msPastDeadline":53,"actualSqliteStoreAndIndependentReadback":true}
~~~

## E01 — paralelismo investigado sin aumentar timeouts

| Corrida | PASS | FAIL | Extras frente a serial | Observación |
| --- | ---: | ---: | ---: | --- |
| Comando original pnpm --filter @qap/mcp test | 423 | 72 | 9 | EPERM R10/R11; timeout durable, pregunta, state, cuatro runner-handler |
| Repetición completa sin otras suites simultáneas | 429 | 66 | 3 | EPERM R11 + durable/pregunta; PromiseRejectionHandledWarning |
| Foco 5 archivos, TEMP exclusivo + observador | 129 | 2 | 0 | Dos fallos legacy de pregunta; 122 eventos cleanup, cero rename fallidos |
| Completo, TEMP exclusivo + observador | 428 | 67 | 4 | EPERM R10/R11 + durable/pregunta; dos unhandled EPERM |

Los fallos cambian con carga/paralelismo; no se atribuyen todos al entorno. En los dos EPERM observados, origen y destino **existían como archivos regulares con nlink=1 al fallar rename**; el cleanup llegó **28 ms y 385 ms después**. Para esos errores concretos queda descartada la explicación de fixture eliminado antes del rename. Persisten incluso bajo TEMP nuevo, con UUID diferentes, sin colisión de nombres demostrada. El dueño del handle/causa del rechazo de Windows no quedó identificado: no se adjudica sin evidencia a antivirus, permisos o un proceso ajeno.

R10/R11 crean pendingSave/pendingWriter con .then de éxito y esperan esa promesa más tarde. Una falla rápida de rename rechaza antes de adjuntar el await y genera unhandled/PromiseRejectionHandled. Aun con lock oficial, FileSystemStorage.write usa temporal+rename sin manejo específico de sharing/replace failure; esto es fragilidad real de ejecución Windows, no un test descartable. Investigar handles y ciclo de I/O; adjuntar rechazo inmediatamente a las tareas y drenarlas antes de cleanup. Un retry acotado de replace solo debe diseñarse después de verificar la causa, preservando exclusión y fallo cerrado.

El test durable usa **seis spawnSync** con timeout 30000 ms cada uno dentro de un único it con deadline 30000 ms: bajo carga el total de subprocesses rebasa el deadline del test. Los otros extras observados tienen deadline 5000 ms y pasan serialmente. Separar presupuestos/aislamiento de recursos y usar cancelación/drenaje correcto; no aumentar los límites para ocultar un test que continúa tras timeout.

ENOENT de rules.yaml en lifecycle y p4-5a aparece también serialmente: primera compuerta legacy no genera ese archivo; no es evidencia por sí sola de cleanup prematuro. UNKNOWN de imports/Vite, ECOMPROMISED y pérdida de locks tras cleanup de las corridas antiguas **no se reprodujeron en estas corridas**. No se declaran corregidos. No se demostró colisión de temporales ni una eliminación prematura actual que explique todos los errores.

Los negativos físicos de reporte muestran dos formatos reales: error de tool textual para validación anterior al return y excepción MCP -32603 para rechazo asíncrono final. Hacer JSON.parse incondicional sobre r.content[0].text o no capturar McpError confunde el fallo original. El nuevo C01 lo demuestra con un writer oficial: necesita traducción a blocked específico, sin reinterpretar el error como éxito ni debilitar validaciones.

### Identidades adicionales exactas por corrida

#### mcp-parallel.log

- **src/__tests__/canonical-coverage.test.ts · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R10-A01: the official lifecycle writer waits until authorization persistence releases the lock**: Error: EPERM: operation not permitted, rename 'C:\Users\Judirico\AppData\Local\Temp\qap-r5-YqlirI\.qa\project\lifecycle.json.0e3737ec704c.tmp' -> 'C:\Users\Judirico\AppData\Local\Temp\qap-r5-YqlirI\.qa\project\lifecycle.json'
- **src/__tests__/canonical-coverage.test.ts · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R11-A01: case-aliased official writers wait through durable authorization in all four actions**: Error: EPERM: operation not permitted, rename 'C:\USERS\JUDIRICO\APPDATA\LOCAL\TEMP\QAP-R5-6YN51X\.qa\project\lifecycle.json.25d656f76dbb.tmp' -> 'C:\USERS\JUDIRICO\APPDATA\LOCAL\TEMP\QAP-R5-6YN51X\.qa\project\lifecycle.json'
- **src/__tests__/durable-interview.test.ts · R4 encrypted durable interview state terminates Node processes between real MCP SDK operations and reopens both physical stores**: Error: Test timed out in 30000ms.
- **src/__tests__/p4-2-pregunta-contract.test.ts · P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) Criterio 4.3: Progresión canónica fuente_de_verdad -> objetivo -> roles -> flujos_criticos -> SCOPING**: Error: Test timed out in 5000ms.
- **src/__tests__/state-handlers.test.ts · VNEXT-012 real MCP and physical persistence preserves incremental context, provenance, corrections and explicit confirmation without promoting canonical entities**: Error: Test timed out in 5000ms.
- **src/__tests__/test-handler.test.ts · TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) Scenario 1: executes valid and authorized plan, persisting authentic result (R4.1)**: Error: Test timed out in 5000ms.
- **src/__tests__/test-handler.test.ts · TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) Scenario 4: in-memory snapshot prevents TOCTOU tampering of YAML files after verification (R4.4)**: Error: Test timed out in 5000ms.
- **src/__tests__/test-handler.test.ts · TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) Scenario 5: blocks unauthorized URLs, unconfigured host policy, and redirects (R4.5)**: Error: Test timed out in 5000ms.
- **src/__tests__/test-handler.test.ts · TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) Scenario 7: rejects unauthorized profiles and disables implicit session recovery (R4.7)**: Error: Test timed out in 5000ms. Error: ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL

#### mcp-parallel-repeat.log

- **src/__tests__/canonical-coverage.test.ts · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R11-A01: case-aliased official writers wait through durable authorization in all four actions**: Error: EPERM: operation not permitted, rename 'C:\USERS\JUDIRICO\APPDATA\LOCAL\TEMP\QAP-R5-5UF5MV\.qa\project\lifecycle.json.d34b24e333f0.tmp' -> 'C:\USERS\JUDIRICO\APPDATA\LOCAL\TEMP\QAP-R5-5UF5MV\.qa\project\lifecycle.json'<br>    at renameSync (node:fs:1013:11)<br>    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/knowledge/dist/index.js:190:7<br>    at FileSystemStorage.withLock (C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/knowledge/dist/index.js:169:20)<br>    at FileSystemStorage.write (C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/knowledge/dist/index.js:187:5)<br>    at FileSystemStorage.writeJson (C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/knowledge/dist/index.js:222:5)<br>    at FileSystemStorage.saveLifecycleState (C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/knowledge/dist/index.js:324:5)
- **src/__tests__/durable-interview.test.ts · R4 encrypted durable interview state terminates Node processes between real MCP SDK operations and reopens both physical stores**: Error: STACK_TRACE_ERROR<br>    at task (file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1784:27)<br>    at Object.<anonymous> (file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1817:16)<br>    at Object.<anonymous> (file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1563:28)<br>    at chain (file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:599:14)<br>    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/durable-interview.test.ts:210:3<br>    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1889:40<br>    at runWithSuite (file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:2258:8)<br>    at Object.collect (file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1889:10)<br>    at Object.collect (file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1893:54)<br>    at processTicksAndRejections (node:internal/process/task_queues:104:5)
- **src/__tests__/p4-2-pregunta-contract.test.ts · P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) Criterio 4.3: Progresión canónica fuente_de_verdad -> objetivo -> roles -> flujos_criticos -> SCOPING**: Error: STACK_TRACE_ERROR<br>    at task (file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1784:27)<br>    at Object.<anonymous> (file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1817:16)<br>    at Object.<anonymous> (file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1563:28)<br>    at chain (file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:599:14)<br>    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-2-pregunta-contract.test.ts:141:3<br>    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1889:40<br>    at runWithSuite (file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:2258:8)<br>    at Object.collect (file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1889:10)<br>    at Object.collect (file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1893:54)<br>    at processTicksAndRejections (node:internal/process/task_queues:104:5)

#### e01-full-observed.log

- **src/__tests__/canonical-coverage.test.ts · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R10-A01: the official lifecycle writer waits until authorization persistence releases the lock**: Error: EPERM: operation not permitted, rename 'C:\Users\Judirico\Documents\QAMCP\vnext014-reparacion-audit\node_modules\.audit-e01-full-temp\qap-r5-dTKLAC\.qa\project\lifecycle.json.be78b359213a.tmp' -> 'C:\Users\Judirico\Documents\QAMCP\vnext014-reparacion-audit\node_modules\.audit-e01-full-temp\qap-r5-dTKLAC\.qa\project\lifecycle.json'
- **src/__tests__/canonical-coverage.test.ts · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R11-A01: case-aliased official writers wait through durable authorization in all four actions**: Error: EPERM: operation not permitted, rename 'C:\USERS\JUDIRICO\DOCUMENTS\QAMCP\VNEXT014-REPARACION-AUDIT\NODE_MODULES\.AUDIT-E01-FULL-TEMP\QAP-R5-OTJIEM\.qa\project\lifecycle.json.975f62f98c9e.tmp' -> 'C:\USERS\JUDIRICO\DOCUMENTS\QAMCP\VNEXT014-REPARACION-AUDIT\NODE_MODULES\.AUDIT-E01-FULL-TEMP\QAP-R5-OTJIEM\.qa\project\lifecycle.json'
- **src/__tests__/durable-interview.test.ts · R4 encrypted durable interview state terminates Node processes between real MCP SDK operations and reopens both physical stores**: Error: Test timed out in 30000ms.
- **src/__tests__/p4-2-pregunta-contract.test.ts · P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) Criterio 4.3: Progresión canónica fuente_de_verdad -> objetivo -> roles -> flujos_criticos -> SCOPING**: Error: Test timed out in 5000ms.

### Observación física de los EPERM

~~~json
[
  {
    "utc": "2026-11-05T21:16:18.683Z",
    "pid": 56152,
    "operation": "renameSync",
    "source": "C:\\Users\\Judirico\\Documents\\QAMCP\\vnext014-reparacion-audit\\node_modules\\.audit-e01-full-temp\\qap-r5-dTKLAC\\.qa\\project\\lifecycle.json.be78b359213a.tmp",
    "target": "C:\\Users\\Judirico\\Documents\\QAMCP\\vnext014-reparacion-audit\\node_modules\\.audit-e01-full-temp\\qap-r5-dTKLAC\\.qa\\project\\lifecycle.json",
    "code": "EPERM",
    "sourceState": {
      "exists": true,
      "file": true,
      "directory": false,
      "size": 406,
      "nlink": 1
    },
    "targetState": {
      "exists": true,
      "file": true,
      "directory": false,
      "size": 396,
      "nlink": 1
    },
    "stack": "Error: EPERM: operation not permitted, rename 'C:\\Users\\Judirico\\Documents\\QAMCP\\vnext014-reparacion-audit\\node_modules\\.audit-e01-full-temp\\qap-r5-dTKLAC\\.qa\\project\\lifecycle.json.be78b359213a.tmp' -> 'C:\\Users\\Judirico\\Documents\\QAMCP\\vnext014-reparacion-audit\\node_modules\\.audit-e01-full-temp\\qap-r5-dTKLAC\\.qa\\project\\lifecycle.json'\n    at Object.renameSync (node:fs:1013:11)\n    at fs.renameSync (file:///C:/Users/Judirico/Documents/QAMCP/reparacion-evidence/observe-fs.mjs:7:34)\n    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/knowledge/dist/index.js:190:7\n    at FileSystemStorage.withLock (C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/knowledge/dist/index.js:169:20)\n    at FileSystemStorage.write (C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/knowledge/dist/index.js:187:5)\n    at FileSystemStorage.writeJson (C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/knowledge/dist/index.js:222:5)\n    at FileSystemStorage.saveLifecycleState (C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/knowledge/dist/index.js:324:5)",
    "cleanupLaterUtc": "2026-11-05T21:16:18.711Z"
  },
  {
    "utc": "2026-11-05T21:16:21.127Z",
    "pid": 56152,
    "operation": "renameSync",
    "source": "C:\\USERS\\JUDIRICO\\DOCUMENTS\\QAMCP\\VNEXT014-REPARACION-AUDIT\\NODE_MODULES\\.AUDIT-E01-FULL-TEMP\\QAP-R5-OTJIEM\\.qa\\project\\lifecycle.json.975f62f98c9e.tmp",
    "target": "C:\\USERS\\JUDIRICO\\DOCUMENTS\\QAMCP\\VNEXT014-REPARACION-AUDIT\\NODE_MODULES\\.AUDIT-E01-FULL-TEMP\\QAP-R5-OTJIEM\\.qa\\project\\lifecycle.json",
    "code": "EPERM",
    "sourceState": {
      "exists": true,
      "file": true,
      "directory": false,
      "size": 410,
      "nlink": 1
    },
    "targetState": {
      "exists": true,
      "file": true,
      "directory": false,
      "size": 396,
      "nlink": 1
    },
    "stack": "Error: EPERM: operation not permitted, rename 'C:\\USERS\\JUDIRICO\\DOCUMENTS\\QAMCP\\VNEXT014-REPARACION-AUDIT\\NODE_MODULES\\.AUDIT-E01-FULL-TEMP\\QAP-R5-OTJIEM\\.qa\\project\\lifecycle.json.975f62f98c9e.tmp' -> 'C:\\USERS\\JUDIRICO\\DOCUMENTS\\QAMCP\\VNEXT014-REPARACION-AUDIT\\NODE_MODULES\\.AUDIT-E01-FULL-TEMP\\QAP-R5-OTJIEM\\.qa\\project\\lifecycle.json'\n    at Object.renameSync (node:fs:1013:11)\n    at fs.renameSync (file:///C:/Users/Judirico/Documents/QAMCP/reparacion-evidence/observe-fs.mjs:7:34)\n    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/knowledge/dist/index.js:190:7\n    at FileSystemStorage.withLock (C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/knowledge/dist/index.js:169:20)\n    at FileSystemStorage.write (C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/knowledge/dist/index.js:187:5)\n    at FileSystemStorage.writeJson (C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/knowledge/dist/index.js:222:5)\n    at FileSystemStorage.saveLifecycleState (C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/knowledge/dist/index.js:324:5)",
    "cleanupLaterUtc": "2026-11-05T21:16:21.512Z"
  }
]
~~~
