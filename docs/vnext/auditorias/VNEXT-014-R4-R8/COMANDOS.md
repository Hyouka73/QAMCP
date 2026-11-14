# Comandos, entorno y publicación R4-R8

Código exacto `44c69f826a0599eeee400ff413ae9faedeeecd75`, obtenido por fetch origin feat/qap-vnext-architecture. Contexto recuperado de GitHub en esta sesión: AGENTS.md y los seis documentos obligatorios, incluyendo historial R4-R7. No se usaron chats anteriores.

Windows, Node **24.15.0**, SQLite **3.51.3** con CREATE VIRTUAL TABLE FTS5 + INSERT + MATCH reales, pnpm **12.3.4**, Git **2.54.0.windows.1**, Chromium headless **153.0.8010.12**, Playwright-core **1.63.0**, Vitest **4.1.11**. El baseline R4-R7 usó Node 24.22.1/SQLite 3.53.4/pnpm 11.3.0. No extrapolar otras plataformas o runtimes.

## Aislamiento

La herramienta gestionada create_worktree respondió Not a git repository porque la raíz del chat contiene el repositorio en una subcarpeta. Se creó mediante git worktree add --detach un worktree nuevo dentro de la raíz autorizada, en el SHA exacto. Checkout original conservado en ed2955ff91a6506a80e3ff0e4bb9322cf9eed226, sin cambiar rama ni sesión. Se usaron raíces sintéticas independientes para Stdio e inicialización; no se registró MCP en clientes.

## Preparación y ejecución

El primer fetch en sandbox falló por getaddrinfo; se repitió con escalación autorizada. Install congelado offline falló por metadata ausente; pnpm install --frozen-lockfile con acceso normal salió 0 y reutilizó 448 paquetes, sin cambiar lockfile. No se ignoran estos intentos ni se consideran defectos productivos. Build salió 0 (10 paquetes); binarios server.js y entrypoint.js presentes.

La CLI pnpm exec playwright no existe en este paquete. Se usó node node_modules/playwright-core/cli.js install chromium, salida 0; lanzamiento real y versión en sonda. Primera preparación de sonda falló por ruta Windows sin file URL al importar esbuild; segundo intento por resolución de @qap/knowledge desde la raíz. Se corrigieron únicamente arneses externos. Una aserción de historia inicial comparó una propiedad undefined con su ausencia tras JSON; se sustituyó ese registro manual por un cierre producido por el servicio baseline exacto. Sonda final salida 0. No se alteró código/test del repo.

Todos los comandos siguientes se ejecutaron desde el worktree. MCP agrega JSON al verbose solicitado para diferencial exacto. Artefactos .mjs de sondas se renombraron a .mjs.txt antes del lint global para evitar diagnosticar código ajeno al SHA; ningún archivo fuente fue excluido.

```powershell
pnpm install --frozen-lockfile
pnpm build
node node_modules/playwright-core/cli.js install chromium
pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-coverage.test.ts -t "R4-R8-A01" --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-coverage.test.ts --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-interview.test.ts --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/mcp exec vitest run src/__tests__/discovery-handler.test.ts --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/mcp exec eslint src/handlers/canonical-closure-service.ts src/handlers/canonical-coverage-service.ts src/__tests__/canonical-coverage.test.ts
pnpm --filter @qap/mcp exec vitest run --maxWorkers=1 --reporter=verbose --reporter=json --outputFile.json=../../.audit-r8/mcp.json
pnpm --filter @qap/playwright-runner exec vitest run --maxWorkers=1 --reporter=verbose
pnpm lint
```

Códigos reales:

```text
install=0
build=0
focus=0
coverage=0
interview=0
discovery=0
lint-focus=1
mcp=1
runner=0
lint=1
stdio=0
probe=0
```

## Stdio

Se reutilizó el arnés estricto publicado en R4-R7 COMANDOS.md: targetPath absoluto para cada tool, cwd desechable, assert 18 herramientas, qap_init success y qap_status ONBOARDING, por servidor y CLI. El script legado scripts/test-mcp-stdio.mjs omite targetPath y no comprueba semánticamente todas las respuestas; no se usa como sustituto de estos asserts.

```text
[QAP MCP Server] Servidor iniciado correctamente en transporte Stdio.
{"transport":"server","tools":["qap_auth_add","qap_auth_list","qap_clean","qap_context_ingest","qap_context_set","qap_discover","qap_init","qap_module_close","qap_plan","qap_prune","qap_report","qap_rules_set","qap_server","qap_session_close","qap_session_plan","qap_status","qap_test","qap_validate"],"init":"success","phase":"ONBOARDING","targetPathExplicit":true}
[QAP MCP Server] Servidor iniciado correctamente en transporte Stdio.
{"transport":"cli","tools":["qap_auth_add","qap_auth_list","qap_clean","qap_context_ingest","qap_context_set","qap_discover","qap_init","qap_module_close","qap_plan","qap_prune","qap_report","qap_rules_set","qap_server","qap_session_close","qap_session_plan","qap_status","qap_test","qap_validate"],"init":"success","phase":"ONBOARDING","targetPathExplicit":true}
SERVIDOR MCP FUNCIONANDO AL 100% SOBRE STDIO

```

## Extractos físicos

### focus

```text
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R8-A01: deferred non-applicability review retains request identity and persists actual host decision time 228ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R8-A01: stale approval cannot authorize changed reason or canonical requirement revision 83ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R8-A01: host approval is rejected if knowledge mutates while awaiting the gateway 70ms
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R5-A02: 16 bound modules, last invalid=false, preview stays capped but guidance checks all
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R5-A02: 17 bound modules, last invalid=false, preview stays capped but guidance checks all
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R5-A02: 17 bound modules, last invalid=true, preview stays capped but guidance checks all
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 2: Crash after closureStore commits decision but before IKnowledgeStore or lifecycle.json updates recovers via self-healing reconciler
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 3: Crash after IKnowledgeStore receipt commit returns idempotent response on retry
 Test Files  1 passed (1)
      Tests  3 passed | 37 skipped (40)
   Duration  4.26s (transform 1.15s, setup 0ms, import 3.46s, tests 383ms, environment 0ms)
```

### coverage

```text
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R8-A01: deferred non-applicability review retains request identity and persists actual host decision time 198ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R8-A01: stale approval cannot authorize changed reason or canonical requirement revision 150ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R8-A01: host approval is rejected if knowledge mutates while awaiting the gateway 101ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R5-A02: 16 bound modules, last invalid=false, preview stays capped but guidance checks all 471ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R5-A02: 17 bound modules, last invalid=false, preview stays capped but guidance checks all 439ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R5-A02: 17 bound modules, last invalid=true, preview stays capped but guidance checks all 383ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 2: Crash after closureStore commits decision but before IKnowledgeStore or lifecycle.json updates recovers via self-healing reconciler 89ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 3: Crash after IKnowledgeStore receipt commit returns idempotent response on retry 121ms
 Test Files  1 passed (1)
      Tests  40 passed (40)
   Duration  10.78s (transform 1.38s, setup 0ms, import 3.45s, tests 6.85s, environment 0ms)
```

### interview

```text
 Test Files  1 passed (1)
      Tests  44 passed (44)
   Duration  7.91s (transform 880ms, setup 0ms, import 2.20s, tests 5.36s, environment 0ms)
```

### discovery

```text
 Test Files  1 passed (1)
      Tests  59 passed (59)
   Duration  28.06s (transform 973ms, setup 0ms, import 2.55s, tests 25.07s, environment 0ms)
```

### mcp

```text
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R8-A01: deferred non-applicability review retains request identity and persists actual host decision time 120ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R8-A01: stale approval cannot authorize changed reason or canonical requirement revision 72ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R8-A01: host approval is rejected if knowledge mutates while awaiting the gateway 52ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R5-A02: 16 bound modules, last invalid=false, preview stays capped but guidance checks all 382ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R5-A02: 17 bound modules, last invalid=false, preview stays capped but guidance checks all 406ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R5-A02: 17 bound modules, last invalid=true, preview stays capped but guidance checks all 325ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 2: Crash after closureStore commits decision but before IKnowledgeStore or lifecycle.json updates recovers via self-healing reconciler 74ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 3: Crash after IKnowledgeStore receipt commit returns idempotent response on retry 97ms
 ✓ src/__tests__/test-handler.test.ts > TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) > Scenario 2: rejects missing, historical, corrupt, or obsolete plans without executing runner (R4.2) 89ms
 ✓ src/__tests__/test-handler.test.ts > TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) > Scenario 3: rejects environment mismatch, module mismatch, and missing module (R4.3) 84ms
⎯⎯⎯⎯⎯⎯ Failed Tests 55 ⎯⎯⎯⎯⎯⎯⎯
 Test Files  7 failed | 16 passed (23)
      Tests  55 failed | 410 passed (465)
   Duration  173.62s (transform 2.15s, setup 0ms, import 32.58s, tests 132.28s, environment 3ms)
```

### runner

```text
 Test Files  10 passed (10)
      Tests  71 passed (71)
   Duration  18.09s (transform 617ms, setup 0ms, import 7.27s, tests 6.99s, environment 1ms)
```

## Integridad y SHA documental

Lockfile blob HEAD y físico: a9bd8de7f6ac38db1ad4ae6582c4539b351225c8. Sesión protegida del checkout original: 28e1b8dbec7ccf194440cc4158ec6072c9b9ade4 antes de ejecutar; worktree exacto contiene blob 429bbf6d57a1d798231b4204d52069b4077703de. Son archivos distintos preexistentes; no se homogeneizaron ni se leyó su contenido. Se verifican nuevamente antes de publicar.

El commit documental no puede incluir su propio SHA sin autorreferencia. Resolverlo con git log -1 --format=%H -- docs/vnext/auditorias/VNEXT-014-R4-R8/INFORME.md y contrastar la rama remota y el árbol; el SHA exacto se comunica separado del auditado en la entrega. Publicación fast-forward exclusivamente documental a feat/qap-vnext-architecture; sin merge/force-push ni cambios en main/develop.

Comprobación final previa a publicación: git diff --exit-code HEAD -- packages pnpm-lock.yaml y git diff --check salieron 0. Sesión original sigue 28e1b8dbec7ccf194440cc4158ec6072c9b9ade4; sesión del worktree sigue 429bbf6d57a1d798231b4204d52069b4077703de. Checkout original conserva HEAD ed2955ff91a6506a80e3ff0e4bb9322cf9eed226. GitHub confirmó rama remota aún en el código auditado antes de preparar el commit documental.
