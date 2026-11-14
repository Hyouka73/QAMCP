# Auditoría 03 — WBS, Propiedad de Componentes y Trabajo de Diego

- **Repositorio:** `Hyouka73/QAMCP` (`QAMCP/`)
- **Rama y SHA auditado:** `feat/qap-vnext-architecture` @ `fd47b84b7346b183c510b0a8278fafd0853a88fb`
- **Fecha de consolidación:** 2026-11-14
- **Referencias:** [04_BACKLOG_Y_WBS_PRELIMINAR.md](../../04_BACKLOG_Y_WBS_PRELIMINAR.md), [08_WBS_MICROTAREAS_Y_COMPUERTAS.md](../../08_WBS_MICROTAREAS_Y_COMPUERTAS.md) y [PLAN_ONE_SHOT_Y_MERGE.md](../../PLAN_ONE_SHOT_Y_MERGE.md)

---

## 1. Hallazgos y Evidencia Original de la Auditoría 03

### 1.1 Contraste WBS vs. Commits Remotos y Arquitectura Real
- **Bifurcación e integración de ramas:**
  - **`develop`** (último commit observado: `9f35377`, 2026-11-11, `DiegoMendoza-D` — `S82-002 / S82-003`): concentra el trabajo de Diego en `packages/knowledge/src/plan/` (generadores BVA/RBAC), `packages/engine/src/flow-orchestrator.ts`, `packages/knowledge/src/storage/flow-state-store.ts` y `packages/playwright-runner/src/runner.ts`.
  - **`feat/qap-vnext-architecture`** (último commit observado: `fd47b84`, 2026-11-14, `Hyouka73` — `fix(auth): persist QA access at start and resume authenticated discovery`): integra el código de `origin/develop` (`9f35377`) desde el merge `a416e23` y concentra la arquitectura vNext en `packages/mcp/src/` ([server.ts](../../../../packages/mcp/src/server.ts), `host-composition.ts`, [tool-catalog.ts](../../../../packages/mcp/src/tool-catalog.ts), [verified-handoff.ts](../../../../packages/mcp/src/verified-handoff.ts), [discovery.handler.ts](../../../../packages/mcp/src/handlers/discovery.handler.ts), [scoped-password.ts](../../../../packages/mcp/src/scoped-password.ts)), `packages/auth/src/modes/auto-login.ts`, `packages/playwright-adapter/src/crawler/service.ts` y el puerto `IFlowStateStore` (`22ce768`).
- **Estado declarado vs. Certificación funcional:**
  - Varias tareas de **S81** (`S81-001`, `S81-002`, `S81-003`) y **S82** (`S82-001` a `S82-005`, `S8-004`) aparecen como `✅ Completado` en el WBS operativo, pero **no equivalen a certificación funcional del MVP**:
    - `DEV-MVP-01` está `▶️ En ejecución` precisamente para corregir oráculos BVA/RBAC y validar casos generados antes de integrarlos en producción.
    - `H-09` (Demo Sprint 8.2) y `DEV-MVP-02` (DEMOS P0 en navegador real / conversación) siguen `⬜ Pendiente`.

---

### 1.2 Matriz de Propiedad y Riesgos Original (Agente 03)

| Tarea WBS | Responsable | Estado declarado | Archivos e interfaces afectados | Dependencias | Riesgo de colisión | Qué puede hacer nuestro equipo (vNext) | Qué requiere coordinación explícita con Diego |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DEV-MVP-01** | Diego | ▶️ En ejecución (9/11→12/11) | `packages/knowledge/src/plan/bva-generator.ts`, `rbac-generator.ts`, `packages/playwright-runner/src/`, `SchemaValidator`, `qap plan` | S81-001, S81-002, S81-003, S81-006 | **ALTO** | No modificar generadores BVA/RBAC ni oráculos. Solo preparar pruebas de no-regresión en `vnext` sin tocar memoria canónica. | Cierre y certificación de oráculos BVA/RBAC antes de consumirlos en `qap plan` o demos. |
| **DEV-MVP-02** | Diego | ⬜ Pendiente (10/11→16/11) | Ciclo E2E real (CLI / Knowledge / Runner / Reporter) sobre candidato `INT-03` (`18199e0` local / `a416e23`) | `INT-03`, `DEV-MVP-01` (para BVA/RBAC), `S82-001/002/004` | **ALTO** | Preparar entorno/fixtures o validar brechas en `packages/mcp/` si se requieren desde vNext, sin usar mocks para acreditar demos. | Definición de qué porción E2E de `S82-001/002/004` entra en DEMO-01/02 y handoff de evidencia real. |
| **S81-001, S81-002, S81-003** | Diego | ✅ Completado | `packages/knowledge/src/plan/bva-generator.ts`, `rbac-generator.ts`, `packages/playwright-runner/src/actions/switch-auth.ts`, `intercept-network.ts` | H-08, S81-006 | **ALTO** (abierto por `DEV-MVP-01`) | Leer/auditar contratos generados; **no** editar estos archivos mientras `DEV-MVP-01` esté activo. | Cualquier ajuste a dialectos `TCCase`, `switch_auth` o `intercept_network`. |
| **S81-004, S81-005** | Carlos Eduardo | ⬜ Pendiente (26/10→30/10) | `auth-wall-detector.ts`, `hydration-resilience.ts` en `packages/playwright-runner/` | H-08, S81-004 | **MEDIO** | **Ejecutar en paralelo** si se aíslan en módulos nuevos; vigilar punto de enganche en `runner.ts`. | Punto exacto de invocación en `packages/playwright-runner/src/runner.ts` (tocado por Diego en `9f35377`). |
| **S81-006** | Fernanda | ✅ Completado | `packages/shared/schemas/*.schema.json`, `packages/shared/src/schemas/`, `*.type.ts`, `SchemaValidator` | H-08 | **BAJO** | Consumir tipos y `SchemaValidator` sin sobrescribir `rules.type.ts` ni `execution-result.type.ts`. | Ninguna salvo extensión de schema compartida. |
| **S8-001** | Fernanda | ⬜ Pendiente (2/11→3/11) | `flow.schema.json`, validación AJV, `.qa/flows/` | H-81 | **MEDIO** | Validar/cerrar schema AJV de flujos. | Alinear con `FlowOrchestrator` (`S82-001`) ya implementado en `develop`. |
| **S82-001 a S82-005, S8-004** | Diego | ✅ Completado | `packages/engine/src/flow-orchestrator.ts`, `packages/knowledge/src/storage/flow-state-store.ts`, `packages/playwright-runner/src/runner.ts`, CLI `qap flow`, `flow-report.ts`, `flow-integration.test.ts` | H-81, S8-001 | **ALTO** | Usar el puerto `IFlowStateStore` (`22ce768` en `vnext`) sin modificar la lógica interna de `flow-orchestrator.ts` ni `flow-state-store.ts`. | Cualquier cambio en `FlowOrchestrator`, checkpoints/rollback o CLI `qap flow`, y la ejecución de `H-09`. |
| **S83-001** | Diego | ⬜ Pendiente (16/11→17/11) | `screenshot.ts` (`captureScreenshot()` / PII Masking) | H-09 | **MEDIO** | No tocar `screenshot.ts` ni lógica de enmascaramiento `#FF00FF`. | Confirmar fecha de inicio tras `H-09` para no chocar con `S83-003` / `S8-005`. |
| **S83-002** | Diego | ⬜ Pendiente (17/11→18/11) | `qap mcp register`, `DiscoverSessionStore`, `sync-mcp-schemas.mjs` | S83-001 | **ALTO** | No modificar `DiscoverSessionStore` ni `sync-mcp-schemas.mjs` hasta que Diego cierre `S83-002`. | Coordinar cambios en `packages/mcp/` (`server.ts`, `tool-catalog.ts`) para evitar conflictos con `feat/qap-vnext-architecture`. |
| **S83-003** | Carlos Eduardo | ⬜ Pendiente (18/11→19/11) | `tsup` configs, `release-check.mjs`, dry-run npm | S83-002 | **BAJO** (bloqueado por dependencia) | Preparar checklist de bundle/cold-start sin publicar ni cerrar release. | Confirmación de cierre de `S83-002`. |
| **S8-006** | Fernanda | ⬜ Pendiente (16/11→18/11) | Manual de arquitectura, referencia CLI/MCP, memoria técnica | H-09 | **NULO** | **Ejecutar en paralelo** una vez estabilizados los contratos. | Validar contra CLI/MCP final tras `S83-002`. |
| **S8-005, S8-007, H-10** | Equipo / Carlos Eduardo | ⬜ Pendiente (18/11→20/11) | Dogfooding E2E (3 apps), tag `v2.1.0`, npm/GitHub Release, defensa | S83-003, S8-006 | **BAJO** (secuencial al final) | Preparar fixtures de las 3 apps target. | Ventana conjunta de integración final `develop` + `feat/qap-vnext-architecture` previa a `S8-005`. |

---

### 1.3 Clasificación del Trabajo Original (Agente 03)
1. **Trabajo que puede realizarse en paralelo (sin interferir con Diego):**
   - **Capa MCP / vNext (`feat/qap-vnext-architecture`):** `packages/mcp/src/handlers/discovery.handler.ts`, `host-composition.ts`, `verified-handoff.ts`, `scoped-password.ts`, `packages/auth/src/modes/auto-login.ts` y `packages/playwright-adapter/src/crawler/service.ts` (manteniendo el puerto `IFlowStateStore` como frontera).
   - **Resiliencia SPA (`S81-004`, `S81-005`):** desarrollo de `auth-wall-detector.ts` y `hydration-resilience.ts` como módulos aislados (coordinando únicamente su enganche en `runner.ts`).
   - **Documentación (`S8-006`)** y preparación de fixtures para **Dogfooding (`S8-005`)**.
2. **Trabajo que debe esperar:**
   - Consumo/integración de BVA y RBAC en `qap plan` / demos: esperar a que Diego cierre y certifique **`DEV-MVP-01`**.
   - Cualquier modificación en `DiscoverSessionStore`, `qap mcp register` y `sync-mcp-schemas.mjs`: esperar a **`S83-002`**.
   - Optimización de bundle y `release-check.mjs` (`S83-003`), Dogfooding (`S8-005`) y Release `v2.1.0` (`S8-007`): esperar en cadena a `H-09` → `S83-001` → `S83-002`.
3. **Trabajo ya integrado (distinguiendo integración de código vs. certificación):**
   - **En `develop`:** `S81-006`, implementación base de `S81-001`, `S81-002`, `S81-003` (pendiente de certificación en `DEV-MVP-01`), e implementación de `S82-001` a `S82-005` y `S8-004` (pendiente de demo/certificación en `H-09` y `DEV-MVP-02`).
   - **En `feat/qap-vnext-architecture`:** integración con `develop` (`a416e23`), puerto `IFlowStateStore` (`22ce768`), persistencia de evidencia por intento (`97e7ce6`), autoridad de reglas por alcance (`f277487`) y persistencia de acceso QA al inicio con reanudación de discovery autenticado (`fd47b84`, `0df5199`).

---

## 2. Reconciliación con las Restricciones de Gobernanza y las Otras Auditorías

### 2.1 Prohibición de Confundir Implementación con Aceptación Funcional
- Tanto el [WBS de microtareas (`08`)](../../08_WBS_MICROTAREAS_Y_COMPUERTAS.md) como el [plan de recuperación (`PLAN_ONE_SHOT_Y_MERGE.md`)](../../PLAN_ONE_SHOT_Y_MERGE.md) establecen una distinción estricta:
  1. **Implementación presente en el árbol Git:** El código de `FlowOrchestrator` (`S82-001`), transferencia de variables (`S82-002/003`), CLI `qap flow` (`S82-004`) y generadores `bva-generator.ts` / `rbac-generator.ts` (`S81-001/002`) ya está compilando en `feat/qap-vnext-architecture` tras el merge `a416e23`.
  2. **Compuerta de Integración Técnica (`INT-01` a `INT-04`):** Requiere estabilizar la suite de pruebas en ambos padres, sanear el PR #17 y verificar que los casos BVA/RBAC permanezcan como `candidate` hasta contar con oráculo humano confirmado (`COMP-01`).
  3. **Aceptación Funcional del MVP (`DEV-MVP-02`, `DEMO-01`, `DEMO-02`, `INT-05` / `H-10`):** Ningún ensayo técnico por script (`DEV-MVP-02_FLUJO_FUNCIONAL.md`, marcado `NOT-human-acceptance`) sustituye la ejecución real de las dos demos conversacionales desde un chat limpio con usuario QA.

### 2.2 Fronteras de Archivos entre la Línea vNext y el Trabajo Paralelo de Diego
Para evitar conflictos de merge antes del 20 de noviembre, se concilian las fronteras exactas entre las 4 auditorías:
- **Zona exclusiva de Diego (NO TOCAR desde vNext sin coordinación previa):**
  - `packages/knowledge/src/plan/bva-generator.ts` y `packages/knowledge/src/plan/rbac-generator.ts` (`DEV-MVP-01`).
  - `packages/engine/src/flow-orchestrator.ts` y `packages/knowledge/src/storage/flow-state-store.ts` (`S82-001..005`, `H-09`).
  - `packages/playwright-runner/src/actions/screenshot.ts` (`S83-001`, PII masking `#FF00FF` — distinto de la sanitización CSS/DOM por intento ya implementada en `evidence-artifacts.ts`).
  - `scripts/sync-mcp-schemas.mjs` y `DiscoverSessionStore` (`S83-002`).
- **Zona compartida de alta sensibilidad (requiere acuerdo explícito o ventana secuencial):**
  - `packages/playwright-runner/src/runner.ts`: tocado por Diego para flujos y por vNext para evidencia por intento (`P0.4`). Si Carlos Eduardo implementa `S81-004` (`auth-wall-detector.ts`) y `S81-005` (`hydration-resilience.ts`), debe hacerlo en archivos separados y coordinar la línea de enganche en `runner.ts`.
  - `packages/mcp/src/tool-catalog.ts` y `packages/mcp/src/server.ts`: vNext no debe renombrar ni eliminar herramientas antes de `S83-002` (hallazgo reconciliado con Auditoría 02).
  - `packages/playwright-runner/.qa/cache/sessions/admin-user.json`: heredado de `develop` y modificado accidentalmente en `47f17ce` en vNext. Su desindexación (`git rm --cached`) en el saneamiento del PR #17 (Auditoría 04) no borra el archivo local del disco ni rompe pruebas, pero debe notificarse a Diego para que al sincronizar no vuelva a añadir `packages/*/.qa/` al índice Git.
