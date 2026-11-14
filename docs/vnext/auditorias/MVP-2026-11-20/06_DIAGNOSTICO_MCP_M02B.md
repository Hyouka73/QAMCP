# Diagnóstico de Regresiones de `@qap/mcp` — M-02B

- **Repositorio:** `Hyouka73/QAMCP` (`QAMCP/`)
- **Rama:** `feat/qap-vnext-architecture`
- **SHA evaluado:** `df1a47f42dc3b878b2f958360c1e8c934e8e2a9a`
- **Entorno de ejecución:** Windows (`win32`), Node `v24.15.0`, pnpm `12.3.4`, Vitest `v4.1.11`
- **Fecha de corte:** 2026-11-14
- **Referencia:** [05_MATRIZ_MAESTRA_Y_RUTA_CRITICA.md](./05_MATRIZ_MAESTRA_Y_RUTA_CRITICA.md)

---

## 1. Totales de Ejecución (Paralelo Original vs. Serial)

| Modo de ejecución | Comando | Archivos (55) | PASS | FAIL | SKIP | Total Tests | Duración |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Paralelo (configuración original)** | `pnpm --filter @qap/mcp test` (`vitest run`) | 20 passed, 34 failed, 1 skipped | **574** | **82** | **3** | 659 | 199.64s |
| **Serial (aislamiento de contención)** | `pnpm exec vitest run --fileParallelism=false` | 40 passed, 14 failed, 1 skipped | **619** | **37** | **3** | 659 | 578.38s |

**Hallazgo clave de separación:**
- **45 de los 82 fallos** en modo paralelo (más 6 timeouts en hooks `beforeEach`/`afterEach`) desaparecen por completo al ejecutar serialmente (`--fileParallelism=false`). Son **timeouts por contención de CPU/I/O** al lanzar en paralelo 55 archivos con instancias reales de Chromium, SQLite WAL y procesos hijo Stdio (incluyendo `p0-2a-discovery-dossier`, `p0-2b-scoped-business-rules`, `p0-4-mcp-evidence-report`, `qap-start`, `discovery-handler`, `test-handler`, `lifecycle-v3-e2e`, `block1`, `block2`, `block3`, entre otros, que pasan al 100% en serial).
- **37 tests en 14 archivos** fallan de manera determinista en modo serial y constituyen el conjunto real a conciliar.
- **Efecto de M-02A (`@qap/knowledge`):** Se registraron **0 errores** de `ENOENT` en `.qa/cache/locks/` o `ECOMPROMISED` de `proper-lockfile` en todas las corridas de `@qap/mcp` (tanto paralela como serial). Las suites que consumen `LockManager`/`FileSystemStorage` no presentaron bloqueos ni corrupción de locks.

---

## 2. Lista Exacta de los 37 Tests Fallidos en Ejecución Serial

### `src/__tests__/client-elicitation-authorizers.test.ts` (6 fallos)
1. `MCP native elicitation authorization > uses advertised client elicitation UI for explicit workspace consent` — `AssertionError: expected [] to have a length of 1 but got +0` (no se invocó `ElicitRequestSchema`; cayó en `fallback.requestAuthorization`).
2. `MCP native elicitation authorization > classifies native 'explicit decline' without granting authorization` — devolvió `status: "success"` en lugar de `workspace_authorization_rejected`.
3. `MCP native elicitation authorization > classifies native 'cancel' without granting authorization` — devolvió `status: "success"` en lugar de `workspace_authorization_cancelled`.
4. `MCP native elicitation authorization > classifies native 'accepted negative answer' without granting authorization` — devolvió `status: "success"` en lugar de `workspace_authorization_rejected`.
5. `MCP native elicitation authorization > classifies native 'incomplete response' without granting authorization` — devolvió `status: "success"` en lugar de `workspace_dialog_start_failed`.
6. `MCP native elicitation authorization > records native elicitation client errors as unavailable, never as rejection or approval` — devolvió `status: "success"` en lugar de `workspace_dialog_start_failed`.

### `src/__tests__/interactive-access.test.ts` (3 fallos)
7. `rejects MCP attempts to self-authorize, inject session material or change scope` — esperaba `auth_context_mismatch`, recibió `authentication_authorization_required` (`server.ts:1540`).
8. `rejects authentication material and agent consent on a server without interactive access` — esperaba `authentication_authorization_required`, recibió `status: "success"` (al omitir `options.workspaceBootstrap`, `server.ts:1456` salta la compuerta de autorización).
9. `supports creating, querying, selecting and updating multi-role QA profiles with non-email usernames, isolated secrets, session invalidation, privileged profile protection and Lendus CORE recovery` — esperaba `status: "success"` (`profile_created`), recibió `{ status: "blocked", code: "authentication_authorization_required" }`.

### `src/__tests__/interactive-workspace-authorization.test.ts` (4 fallos)
10. `Distingue unavailable/workspace_gui_unavailable sin exponer detalles del proveedor` — `expected [ 'logs', 'project-operations.sqlite' ] to deeply equal []`.
11. `Distingue unavailable/workspace_dialog_start_failed sin exponer detalles del proveedor` — `expected [ 'logs', 'project-operations.sqlite' ] to deeply equal []`.
12. `Distingue cancelled/workspace_authorization_expired sin exponer detalles del proveedor` — `expected [ 'logs', 'project-operations.sqlite' ] to deeply equal []`.
13. `Prueba de dos proyectos independientes: aislamiento estricto de autorización, Knowledge y estado` — `expected [ ... ] to have a length of 2 but got 3` (artefactos `logs` / `project-operations.sqlite` en `hostDir`).

### `src/__tests__/block4-clean-package-acceptance.test.ts` (1 fallo)
14. `cubre matriz completa de aceptación: PASS/FAIL, oráculo ausente, rechazo, sesión caducada, revocación, reinicio + recuperación sin reejecución, Campaña 2 y borrado aislado` — línea 623: `expected +0 to be 2` (`proposed_cases.length` fue `0` con `oracle_source: 'user'`).

### `src/__tests__/p3-canonical-discovery.test.ts` (1 fallo)
15. `P3 Suite de Verificación MCP (T3 - T15) > T6: qap_discover éxito: no contiene "Descubrir otro módulo"...` — `expected { status: 'completed', ... } to not have property "siguiente_accion"` (recibió `siguiente_accion` con `tool: "qap_status"`).

### `src/__tests__/p4-2-canonical-contract.test.ts` (1 fallo)
16. `P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E > Criterio 6: E2E Completo...` — `expected { status: 'completed', ... } to not have property "siguiente_accion"` (recibió `siguiente_accion` con `tool: "qap_status"`).

### `src/__tests__/p4-4-auth-lifecycle.test.ts` (10 fallos)
17. `1. qap_discover protegido sin perfil: blocked auth_required y cero escrituras en disco` — `expected undefined to be 'auth_required'`.
18. `2. qap_discover con redirección HTTP 302 a login: detecta auth_wall determinista y bloquea sin escribir` — `expected undefined to be 'auth_required'`.
19. `3. qap_discover con login embebido en ruta no-acceso: bloquea como auth_required sin persistir` — `expected undefined to be 'auth_required'`.
20. `4. qap_discover con sesión expirada: blocked session_invalid y desverifica el perfil` — `expected undefined to be 'session_invalid'`.
21. `5. qap_discover con perfil verificado y storageState válido: devuelve app y transiciona a observed` — `expected 'blocked' to be 'success'`.
22. `6. qap_discover en módulo de acceso: selectors.json incluye auth_selectors...` — `expected 'blocked' to be 'success'`.
23. `7. Secuencia de preguntas de SCOPING: 5 preguntas separadas y válidas sin mezclar módulos con auth` — aserción sobre propiedad `undefined` de respuesta bloqueada.
24. `9. qap_auth_add con verificación automática real contra el fixture HTTP local` — `expected 'blocked' to be 'success'`.
25. `11. Test de no filtración: contraseña centinela NO aparece en respuestas...` — `ENOENT` en `profiles.json` porque `qap_auth_add` previo quedó `blocked`.
26. `15. Guard de cliente asíncrono lento (~1200ms) en qap_discover: responde blocked auth_required...` — `expected undefined to be 'auth_required'`.

### `src/__tests__/p4-5a-integrity.test.ts` (1 fallo)
27. `C4-d: plan con auth.required true sin roles queda bloqueado con pregunta de roles y bloquea discover (V4)` — `TypeError: .toMatch() expects to receive a string, but got undefined` (`parsed.razon` es `undefined`).

### `src/__tests__/p4-5a2-integrity.test.ts` (4 fallos)
28. `C1: Clasificación honesta con adaptador real > C1-a: módulo de acceso pedido en login sin redirección NO se bloquea` — `expected 'blocked' to be 'success'`.
29. `C1: Clasificación honesta con adaptador real > C1-b: ruta protegida con redirección HTTP 302 a /login...` — `expected undefined to be 'auth_required'`.
30. `C1: Clasificación honesta con adaptador real > C1-c: ruta protegida con guard del lado del cliente...` — `expected undefined to be 'auth_required'`.
31. `C6: Ciclo completo plan -> auth -> compuerta de SCOPING con adaptador real > C6-a: plan bloqueado...` — `expected 'blocked' to be 'success'`.

### `src/__tests__/p4-5s1-browser-candidates.test.ts` (1 fallo)
32. `C1: status/init conservan la frase histórica y discover declara persistencia canónica estática` — descripción de `qap_discover` ya no contiene `"BlackBoxCrawler real y estático, con JavaScript deshabilitado"`.

### `src/__tests__/plan-handler.test.ts` (1 fallo)
33. `PlanHandler Real Declarative Implementation (VNEXT-014-B) > integrates completely with createMcpServer, exposes exactly 20 tools and dispatches qap_plan cleanly` — `expected 21 to be 20`.

### `src/__tests__/server.test.ts` (2 fallos)
34. `debe registrar y exponer la suite completa de 15 tools y prompts` — `expected 21 to be 20`.
35. `E0b: qap_discover valida contra module-view.schema.json en vista de autenticacion con session_saved true` — `expected true to be falsy` (`res.isError` es `true`).

### `src/__tests__/state-handlers.test.ts` (1 fallo)
36. `VNEXT-012 real MCP and physical persistence > registers all three declarative owners exactly once and never falls back after failure` — línea 98 espera `21` tools y línea 100 espera `20` nombres únicos (`expected 21 to be 20`).

### `src/__tests__/dispatcher-integration.test.ts` (1 fallo)
37. `real MCP client/server via linked transports > preserves 16 definitions, order, prompts and legacy rules schema...` — snapshot de `listTools()` difiere del catálogo actual (`business_rules` / 21 tools).

*(Omitidos: `src/__tests__/interactive-access-browser.test.ts`, 3 tests skipped por diseño).*

---

## 3. Clasificación por Causa Raíz

| Grupo | Causa raíz verificada | Archivos afectados | Tests | Tipo | Prioridad |
| :---: | :--- | :--- | :---: | :--- | :---: |
| **CR-1** | `ClientElicitationWorkspaceAuthorizer` existe en [client-elicitation-authorizers.ts](../../../../packages/mcp/src/client-elicitation-authorizers.ts#L78), pero `createMcpServer` ([server.ts](../../../../packages/mcp/src/server.ts#L134), [#L792-L796](../../../../packages/mcp/src/server.ts#L792-L796)) no lo importa ni envuelve `options.workspaceAuthorizer`, a diferencia de `discoveryAuthorizer` y `humanReviewGateway`. | `packages/mcp/src/server.ts` | **6** | **Regresión real de producción** | **P0** |
| **CR-2** | Desalineación en la compuerta de `qap_auth_add` ([server.ts](../../../../packages/mcp/src/server.ts#L1456-L1545)): (a) sin `options.workspaceBootstrap` salta el bloqueo `authentication_authorization_required`; (b) con `workspaceBootstrap` + `interactiveAccessAuthorizer` pero sin `authAuthorizer` bloquea antes de `interactiveAccess.login` (`auth_context_mismatch` / creación de perfil). | `packages/mcp/src/server.ts` y/o contrato en `interactive-access.test.ts` | **3** | **Regresión de integración auth/host** | **P0** |
| **CR-3** | `acquireProjectOperation` y `authorizationDiagnostic` ([server.ts](../../../../packages/mcp/src/server.ts#L668), [#L751](../../../../packages/mcp/src/server.ts#L751)) escriben `project-operations.sqlite` y `logs/qap-events.jsonl` dentro de `hostDir` incluso cuando la autorización del workspace falla/cancela, y los tests de aislamiento esperan `hostDir` vacío o con exactamente 2 carpetas de proyecto. | `packages/mcp/src/server.ts` / `interactive-workspace-authorization.test.ts` | **4** | **Divergencia de efectos secundarios en `hostDir`** | **P1** |
| **CR-4** | Suites legadas de `qap_discover` / `qap_auth_add` llaman a `createMcpServer({ projectRoots: [tempDir] })` sin `discoveryAuthorizer`/`authAuthorizer`, envían `password`/`username` en MCP (bloqueado por `agent_auth_material_not_supported` en `server.ts:663`) y esperan `parsed.razon` en lugar de `parsed.code`. Incluye las **12 identidades heredadas** de `mcp-inherited-failure-comparison.json`. | Tests legados: `p4-4-auth-lifecycle.test.ts`, `p4-5a2-integrity.test.ts`, `p4-5a-integrity.test.ts`, `server.test.ts` (`E0b`) | **16** | **Deuda heredada / tests obsoletos frente a seguridad vNext** | **P2** *(no bajar garantías)* |
| **CR-5** | Aserciones históricas de catálogo esperan `20` tools (o snapshot de `16`/`18`) y texto antiguo de `qap_discover` (`BlackBoxCrawler real y estático, con JavaScript deshabilitado`), mientras el catálogo vigente tiene **21** tools (`qap_start` incluido). | `plan-handler.test.ts`, `server.test.ts`, `state-handlers.test.ts`, `dispatcher-integration.test.ts`, `p4-5s1-browser-candidates.test.ts` | **5** | **Tests obsoletos de catálogo** | **P1/P2** |
| **CR-6** | `block4-clean-package-acceptance.test.ts:595` usa `propose_from_observations` con `oracle_source: 'user'` sin procedencia acreditada; tras `P0.3a` (`f277487`), esas propuestas permanecen en `pending_oracle` (`proposed_cases: []`) hasta confirmación humana genuina. | `block4-clean-package-acceptance.test.ts` (o flujo de confirmación en test) | **1** | **Test desactualizado respecto a `P0.3a`** | **P1** |
| **CR-7** | `p3-canonical-discovery.test.ts` (T6) y `p4-2-canonical-contract.test.ts` (Criterio 6) asumen que `qap_discover` no incluye `siguiente_accion`, pero `server.ts` ahora guía el flujo autónomo devolviendo `siguiente_accion: { tool: 'qap_status', ... }` cuando hay plan vigente. | `p3-canonical-discovery.test.ts`, `p4-2-canonical-contract.test.ts` | **2** | **Tests obsoletos frente a flujo autónomo vNext** | **P2** |
| **CR-8** | Ejecución paralela por defecto de Vitest (`55` archivos simultáneos con Playwright/SQLite/Stdio) satura CPU/I/O en Windows y provoca **45 timeouts** adicionales no reproducibles en serial. | Configuración de ejecución / paralelismo de `@qap/mcp` | *(45 solo en paralelo)* | **Contención de paralelismo en Windows** | **P1** *(compuerta `INT-02`)* |

**Suma verificada:** `6 + 3 + 4 + 16 + 5 + 1 + 2 = 37` fallos deterministas en serial (+ `45` exclusivos de contención paralela = `82` en paralelo).

---

## 4. Comparación con el Baseline Histórico

- **Baseline `a416e23` (serial, `PLAN_ONE_SHOT_Y_MERGE.md`):** `616 PASS / 35 FAIL / 3 SKIP` (654 tests).
- **HEAD actual `df1a47f` (serial):** `619 PASS / 37 FAIL / 3 SKIP` (659 tests).
  - Los 5 tests nuevos incorporados desde `a416e23` (incluyendo `p0-3a-rule-authority-review.test.ts`) **pasan al 100%** en serial.
  - Todas las **12 identidades heredadas** registradas en [mcp-inherited-failure-comparison.json](../../integracion/CONSOLIDACION_VNEXT_2026-11-10/evidencia/mcp-inherited-failure-comparison.json) (`p4-4-auth-lifecycle` x7, `p4-5a-integrity` x1, `p4-5a2-integrity` x3, `server.test.ts E0b` x1) siguen presentes dentro de **CR-4**.
  - **Regresiones reales nuevas/activas:** **CR-1** (`ClientElicitationWorkspaceAuthorizer` desconectado, 6 tests) y **CR-2** (`interactive-access.test.ts`, 3 tests) deben tratarse como bloqueantes P0 antes de cerrar `M-02` / `INT-02`.

---

## 5. Bloqueantes Reales P0/P1 vs. Deuda Heredada

- **Bloqueantes P0 (integración y seguridad):**
  1. **CR-1 (`client-elicitation-authorizers.test.ts`, 6 tests):** La autorización nativa por `elicitation` de MCP para workspaces está desconectada en `server.ts`.
  2. **CR-2 (`interactive-access.test.ts`, 3 tests):** Inconsistencia de compuerta en `qap_auth_add` entre modo con/sin `workspaceBootstrap` e `interactiveAccessAuthorizer` vs `authAuthorizer`.
- **Bloqueantes P1 (estabilidad de compuerta `INT-02` y aceptación):**
  3. **CR-3 (`interactive-workspace-authorization.test.ts`, 4 tests):** Creación de `logs/` y `project-operations.sqlite` en `hostDir` antes de autorizar o esperada por el test.
  4. **CR-6 (`block4-clean-package-acceptance.test.ts`, 1 test):** Alinear el arnés de aceptación Block 4 con el flujo de confirmación acreditada `P0.3a`.
  5. **CR-5 (parcial: `plan-handler.test.ts`, `state-handlers.test.ts`, `server.test.ts` herramienta count):** Tests de integración que fallan por esperar `20` tools cuando el catálogo congelado de MVP tiene `21` (incluida la contradicción interna en `state-handlers.test.ts:98-100`).
  6. **CR-8 (estabilidad `pnpm -r test` en Windows):** Definir ejecución serializada o límites de concurrencia adecuados en `packages/mcp` sin relajar timeouts ni degradar pruebas.
- **Deuda heredada P2 (no bloquea MVP, prohibido bajar garantías):**
  - **CR-4 (16 tests)** y **CR-7 (2 tests)** y descripción histórica en `p4-5s1` (**1 test**): reflejan contratos anteriores a las restricciones de seguridad y flujo autónomo de vNext.

---

## 6. Matriz Priorizada de Correcciones Mínimas e Independencia respecto a Diego

Ninguna de las correcciones identificadas toca los archivos asignados a Diego (`bva-generator.ts`, `rbac-generator.ts`, `flow-state-store.ts`, `flow-orchestrator.ts`, `screenshot.ts`, `sync-mcp-schemas.mjs`). Todas son ejecutables en paralelo sin conflicto:

| Orden | ID | Corrección mínima | Archivos afectados | Dependencias | ¿Toca archivos de Diego? |
| :---: | :---: | :--- | :--- | :--- | :---: |
| **1** | **CR-1** | Importar `ClientElicitationWorkspaceAuthorizer` y envolver `options.workspaceAuthorizer` en `createMcpServer`. | `packages/mcp/src/server.ts` | Ninguna | **No** |
| **2** | **CR-2** | Unificar la compuerta de `qap_auth_add` en `server.ts` para exigir autorización en ausencia de autorizador/scope silencioso incluso sin `workspaceBootstrap`, y respetar `interactiveAccessAuthorizer` en perfilado/validación de contexto. | `packages/mcp/src/server.ts` | CR-1 | **No** |
| **3** | **CR-3** | Evitar inicializar `project-operations.sqlite` / `logs` en `hostDir` antes de aprobar workspace o actualizar aserciones si la bitácora previa es intencional por auditoría. | `packages/mcp/src/server.ts` o `interactive-workspace-authorization.test.ts` | CR-1 | **No** |
| **4** | **CR-6** | Actualizar `block4-clean-package-acceptance.test.ts` para acreditar/confirmar las propuestas `P0.3a` antes de verificar `proposed_cases.length`. | `packages/mcp/src/__tests__/block4-clean-package-acceptance.test.ts` | Ninguna | **No** |
| **5** | **CR-5** | Actualizar expectativas de conteo de catálogo (`20` → `21`, snapshots) en los tests del catálogo congelado de 21 herramientas. | `plan-handler.test.ts`, `state-handlers.test.ts`, `server.test.ts`, `dispatcher-integration.test.ts`, `p4-5s1-browser-candidates.test.ts` | Ninguna | **No** |
| **6** | **CR-8** | Estabilizar la ejecución de `packages/mcp` en Windows (p. ej. `fileParallelism: false` o pool controlado en Vitest) para que `pnpm -r test` complete sin timeouts de contención. | `packages/mcp/package.json` / `vitest.config.*` | CR-1..CR-6 | **No** |
| **7** | **CR-4 / CR-7** | Migrar o aislar suites legadas (`p4-4`, `p4-5a`, `p4-5a2`, `p3`, `p4-2`) al contrato actual de `discoveryAuthorizer`/`authAuthorizer` sin relajar garantías. | `packages/mcp/src/__tests__/p4-*.test.ts`, `p3-canonical-discovery.test.ts` | CR-2 | **No** |

---

## 7. Primera Corrección Recomendada

**Implementar CR-1 (`ClientElicitationWorkspaceAuthorizer` en `packages/mcp/src/server.ts`):** es un cambio quirúrgico de ~4 líneas en producción que repara de inmediato **6 fallos P0** en `client-elicitation-authorizers.test.ts` y restablece la autorización nativa MCP por `elicitation` para workspaces sin riesgo de interferencia con ningún otro módulo.
