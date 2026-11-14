# Auditoría 02 — Catálogo de las 21 Herramientas MCP

- **Repositorio:** `Hyouka73/QAMCP` (`QAMCP/`)
- **Rama y SHA auditado:** `feat/qap-vnext-architecture` @ `fd47b84b7346b183c510b0a8278fafd0853a88fb`
- **Fecha de consolidación:** 2026-11-14
- **Archivos auditados:** [tool-catalog.ts](../../../../packages/mcp/src/tool-catalog.ts), [server.ts](../../../../packages/mcp/src/server.ts), [dispatcher.ts](../../../../packages/mcp/src/dispatcher.ts) y [guidance.ts](../../../../packages/mcp/src/guidance.ts)

---

## 1. Hallazgos y Evidencia Original de la Auditoría 02

### 1.1 Medición Real del Catálogo y Costo de Exposición
- **Archivo principal:** [tool-catalog.ts](../../../../packages/mcp/src/tool-catalog.ts) (`912` líneas, `42,985` bytes en fuente).
- **Herramientas definidas en `TOOLS`:** `21` herramientas.
- **Inyección dinámica en runtime** ([server.ts](../../../../packages/mcp/src/server.ts#L498-L524)):
  - Cuando el host configura `options.configuredWorkspaceRoot`, `server.ts` inyecta dinámicamente `conversation_id` en **20** herramientas (todas excepto `qap_project_reset`), `credentials` en `qap_start`, y `password` en `qap_auth_add`.
  - Además, `QAP_CORE_DIRECTIVES` (`373` caracteres) y `UX_DIRECTIVE` (`340` caracteres) se interpolan repetidamente en las descripciones de las herramientas.
- **Costo estimado de exposición al agente (`tools/list`):** ~`40–45 KB` de JSON serializado ≈ **`10,000–11,500` tokens por turno** solo en definiciones de herramientas antes de cualquier prompt o historial.
- **Top 6 herramientas más pesadas (~60% del catálogo):**
  1. `qap_rules_set`: `6,140` bytes (~`1,529` tokens)
  2. `qap_project`: `4,441` bytes (~`1,106` tokens, **18 acciones** en un solo `enum`)
  3. `qap_context_ingest`: `4,242` bytes (~`1,058` tokens)
  4. `qap_auth_add`: `4,006` bytes (~`997` tokens)
  5. `qap_plan`: `3,662` bytes (~`913` tokens)
  6. `qap_session_plan`: `3,434` bytes (~`852` tokens)

---

### 1.2 Matriz Completa Original de las 21 Herramientas (Agente 02)

| Herramienta | Handler | Responsabilidad | Consumidor | Acciones / Modos | Efectos Secundarios | Restricciones de Seguridad | Tests (`__tests__`) | Solapamientos | Clasificación (Propuesta Agente 02) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`qap_status`** | `StatusHandler` ([status.handler.ts](../../../../packages/mcp/src/handlers/status.handler.ts)) | Punto de entrada: diagnostica repo, `.qa/`, preflight Playwright y devuelve `siguiente_accion`. | Agente / Host | Lectura de estado (sin `action`) | Crea/actualiza estado de diagnóstico si aplica; puede disparar bootstrap. | `workspaceAuthorizer`, `tombstonedRoot`, `silentBoundScope`. | `38` archivos | Con `qap_start` y `qap_init` en onboarding. | **Mantener pública** |
| **`qap_init`** | Inline [server.ts](../../../../packages/mcp/src/server.ts#L1149) | Inicializa `.qa/`, `repo-map.json` y preflight de navegador. | Agente | Inicialización única | Escribe `.qa/project/context.yaml`, `repo-map.json`, dirs base. | `workspaceAuthorizer`, bloqueo post-`qap_project_reset`. | `16` archivos | Con `qap_status` (auto-init), `qap_start` y `qap_project(create)`. | **Convertir en operación interna** (absorbible por `qap_status`/`qap_project`) |
| **`qap_project`** | `ProjectHandler` ([project.handler.ts](../../../../packages/mcp/src/handlers/project.handler.ts)) | CRUD de proyectos por ID, import `.qa`, permisos, candidatos, discrepancias y dossier. | Agente / Host | `18` acciones (`create`, `list`, `select`, `resume`, `delete_preview`, `delete_confirm`, `recover`, `import_qa`, `verify_import`, `permissions`, `revoke_permission`, `candidates`, `review_candidate`, `promote_candidates`, `discrepancies`, `resolve_discrepancy`, `discovery_dossier`, `discovery_dossier_regenerate`) | Mutaciones en `.qa/`, registro duradero de proyectos, tombstones, promoción de candidatos. | Nunca concede permisos por args MCP; `delete_preview` + `delete_confirm` en 2 pasos; `allow_recreate_deleted`. | `11` archivos | `create` solapa con `qap_init`; `candidates`/`discrepancies` mezclan dominio de discovery/reglas con ciclo de vida de proyecto. | **Consolidar** (separar/adelgazar acciones internas de dossier/candidatos) |
| **`qap_auth_add`** | Inline [server.ts](../../../../packages/mcp/src/server.ts#L1369) y pre-switch (`L900`) | Guarda credenciales o perfiles de auth por entorno/rol y verifica sesión. | Agente | Alta/actualización/login de perfil auth | Escribe credenciales en storage seguro / `.qa/` y ejecuta login verificado cuando aplica. | `authAuthorizer`, `silentBoundScope`, `scoped-password` (no exponer secretos en logs). | `17` archivos | Con `qap_start(credentials)` y `qap_auth_provision`. | **Mantener pública** (como `qap_auth` unificada o dedicada) |
| **`qap_auth_provision`** | Inline [server.ts](../../../../packages/mcp/src/server.ts#L716) (pre-switch) | Provisiona contraseña local keychain mediante diálogo del host. | Agente / Operador | Provisión de secreto en host | Invoca diálogo nativo del host (`provisionAccess.provision`) y guarda contraseña en keychain. | `provisionAuthorizer`, requiere raíz autorizada. | `4` archivos | Con `qap_auth_add`. | **Convertir en operación interna** |
| **`qap_auth_list`** | Inline [server.ts](../../../../packages/mcp/src/server.ts#L2018) | Lista perfiles de autenticación configurados (sin secretos). | Agente | Lectura | Ninguno (solo lectura). | Redacción de secretos/passwords. | `6` archivos | Redundante si `qap_status` o `qap_auth` devuelve el inventario. | **Consolidar** (en `qap_status` / `qap_auth`) |
| **`qap_context_set`** | `ContextHandler` ([context.handler.ts](../../../../packages/mcp/src/handlers/context.handler.ts)) | Define/actualiza contexto del proyecto (URLs, entornos, objetivo). | Agente | Set/update de contexto | Escribe `.qa/project/context.yaml`. | `workspaceAuthorizer`, validación de rutas. | `23` archivos | Con `qap_init(baseUrl, environments)` y `qap_context_ingest`. | **Mantener pública** |
| **`qap_context_ingest`** | Inline [server.ts](../../../../packages/mcp/src/server.ts#L2100) | Ingiere documentos/requisitos/specs externos al conocimiento `.qa/`. | Agente | Ingesta de fuentes | Escribe artefactos de contexto y reglas inferidas en `.qa/`. | Validación de paths dentro del workspace autorizado. | `13` archivos | Con `qap_context_set`. | **Consolidar** (como modo/parámetro de `qap_context_set`) |
| **`qap_session_plan`** | Inline [server.ts](../../../../packages/mcp/src/server.ts#L2724) | Gestiona el plan de módulos de la sesión de trabajo (`WORKING`/`WRAP_UP`). | Agente | Alta/actualización/consulta de módulos en sesión | Escribe estado de sesión y módulos en `.qa/`. | Control de fase de ciclo de vida (`lifecycleState.phase`). | `22` archivos | Con `qap_plan` (ambas planifican alcance/módulos). | **Consolidar** (o convertir en interna de `qap_plan`) |
| **`qap_discover`** | `DiscoveryHandler` ([discovery.handler.ts](../../../../packages/mcp/src/handlers/discovery.handler.ts)) | Explora la app con Playwright propio y persiste conocimiento en `.qa/`. | Agente | Discovery inicial / por módulo / ruta | Navega app, captura DOM/rutas/screenshots, escribe en `.qa/`. | `discoveryAuthorizer`, prohibición de explorar fuera de QAP. | `31` archivos | Ninguno directo (core único). | **Mantener pública** |
| **`qap_plan`** | `PlanHandler` ([plan.handler.ts](../../../../packages/mcp/src/handlers/plan.handler.ts)) | Genera/consulta casos y planes de prueba por módulo/flujo. | Agente | `generate`, `list`, `get`, `case_workflow` | Escribe planes de prueba en `.qa/plans/`. | Validación de módulo registrado y reglas cubiertas. | `14` archivos | Con `qap_session_plan`. | **Mantener pública** |
| **`qap_validate`** | Inline [server.ts](../../../../packages/mcp/src/server.ts#L3415) | Valida esquemas de `.qa/definitions` (`validateDefinitions`). | Agente / CI | Validación estática | Ninguno (solo lectura). | Path dentro de `rootDir`. | `1` archivo | Debería ser validación automática interna al escribir/planear. | **Convertir en operación interna** |
| **`qap_test`** | `TestHandler` ([test.handler.ts](../../../../packages/mcp/src/handlers/test.handler.ts)) | Ejecuta pruebas Playwright sobre casos/módulos y guarda evidencia. | Agente | Ejecución de suite/caso | Corre browser, escribe resultados y trazas en `.qa/executions/` y `.qa/runtime/runs/`. | `testAuthorizer`, aislamiento de runtime. | `11` archivos | Ninguno directo (core único). | **Mantener pública** |
| **`qap_report`** | `ReportHandler` ([report.handler.ts](../../../../packages/mcp/src/handlers/report.handler.ts)) | Genera y consulta reportes de ejecución, cobertura y brechas. | Agente / Usuario | Generación/lectura de reporte | Escribe reporte en `.qa/`. | Solo lectura/agregación sobre artefactos del workspace. | `7` archivos | Con `qap_session_close` (que también genera reporte de brechas). | **Mantener pública** |
| **`qap_server`** | Inline [server.ts](../../../../packages/mcp/src/server.ts#L3469) | Levanta/consulta servidor HTTP local del Knowledge Graph (`port 9280`). | Usuario (UI) | Start/status viewer | Abre puerto HTTP local (`activeViewerServer`). | Requiere `.qa/` existente; bind local. | `1` archivo | Ninguno, pero es utilidad de UI/CLI más que tool de agente. | **Retirar cuando se demuestre equivalencia** (o mover a CLI `qap viewer`) |
| **`qap_prune`** | Inline [server.ts](../../../../packages/mcp/src/server.ts#L3549) | Poda artefactos y runs antiguos en `.qa/runtime` (`olderThanDays`, `dryRun`). | Mantenimiento | Prune / dryRun | Elimina runs/artefactos antiguos en SQLite y disco. | Path restringido a `.qa/runtime`. | `1` archivo | Ninguno, es mantenimiento operacional. | **Convertir en operación interna** (o CLI) |
| **`qap_rules_set`** | Inline [server.ts](../../../../packages/mcp/src/server.ts#L3598) | Registra/refina reglas de negocio y conduce entrevista canónica (`canonical_interview`). | Agente / Humano | Legacy set + `canonical_interview` | Persiste reglas en `.qa/`, actualiza cobertura. | `source`/`status`/`from_option` no acreditan autorización humana; requiere gateway independiente. | `15` archivos | Con `qap_project` (candidatos/discrepancias) y `qap_context_ingest`. | **Mantener pública** (simplificando su schema de `6.1 KB`) |
| **`qap_module_close`** | Inline [server.ts](../../../../packages/mcp/src/server.ts#L4479) | Cierra o renuncia a un módulo del plan (`user_confirmed`, `accept_gaps`). | Agente / Humano | `close` / `waive` | Cambia estado del módulo a terminal. | Requiere `user_confirmed: true` y `reason` (>=15 chars) o `canonical_closure`. | `10` archivos | Con `qap_session_plan` y `qap_session_close`. | **Consolidar** (en `qap_session_plan` / `qap_plan` o flujo de cierre) |
| **`qap_session_close`** | Inline [server.ts](../../../../packages/mcp/src/server.ts#L4919) | Cierra la sesión de trabajo y genera reporte final de brechas. | Agente / Humano | Cierre con `confirmar` | Cierra sesión en `.qa/`, genera reporte final. | Solo permitido en fase `WORKING` con módulos cerrados. | `11` archivos | Con `qap_report` y `qap_module_close`. | **Consolidar** (en `qap_report` / cierre de sesión) |
| **`qap_project_reset`** | Inline [server.ts](../../../../packages/mcp/src/server.ts#L601) (pre-switch) | Reset destructivo del proyecto con diálogo de confirmación. | Host / Usuario | `preview` / `confirm` | Borra estado/artefactos del proyecto; bloquea tools hasta `qap_init`. | `projectResetAuthorizer`, excluida de `conversation_id`. | `2` archivos | Con `qap_project(delete_preview/delete_confirm)`. | **Mantener temporalmente por compatibilidad** (o consolidar en `qap_project`) |
| **`qap_start`** | Inline [server.ts](../../../../packages/mcp/src/server.ts#L910) (pre-switch) | Wrapper de onboarding: asigna `conversation_id`, guarda `credentials` opcionales y arranca discovery inicial. | Agente | Inicio de conversación | Genera UUID `conversation_id`, autentica perfil QA vinculado, ejecuta discovery de entrada y escribe `INICIO.md`. | Requiere `workspaceBootstrap` y `silentBoundScope` para acceso silencioso. | `3` archivos | Solapa parcialmente con `qap_status` + `qap_context_set` + `qap_auth_add` + `qap_discover`. | **Retirar cuando se demuestre equivalencia** |

---

### 1.3 Herramientas que Compensan Falta de Orquestación Interna (Agente 02)
1. **Onboarding fragmentado (`qap_start` + `qap_status` + `qap_init`):** `qap_status` diagnostica repo y preflight; `qap_init` existe para inicializar cuando el workspace está vacío; `qap_start` se agregó para generar `conversation_id`, aceptar `credentials` y ejecutar el discovery inicial en el primer turno.
2. **Autenticación atomizada (`qap_auth_add` + `qap_auth_provision` + `qap_auth_list`):** Listar perfiles (`qap_auth_list`) y provisionar secretos (`qap_auth_provision`) están separados de `qap_auth_add`.
3. **Ciclo de sesión y cierre (`qap_session_plan` + `qap_module_close` + `qap_session_close`):** Tres herramientas separadas para administrar la máquina de estados de una sesión.
4. **Mantenimiento y validación (`qap_validate` + `qap_prune`):** Operaciones técnicas de esquemas y limpieza con `1` archivo de test cada una.

### 1.4 Propuesta de API Mínima de 9 Herramientas (Agente 02)
El Agente 02 propuso un diseño futuro de **9 herramientas cohesivas** (`qap_status`, `qap_project`, `qap_context`, `qap_auth`, `qap_discover`, `qap_rules`, `qap_plan`, `qap_test`, `qap_report`), advirtiendo tres riesgos de compatibilidad:
- **Prompts y `guidance.ts` acoplados:** `siguiente_accion.tool` apunta explícitamente a `qap_init`, `qap_session_plan`, `qap_module_close`, `qap_session_close`, `qap_auth_add`, `qap_start`.
- **Suite de pruebas acoplada a nombres actuales:** Cientos de tests en `packages/mcp/src/__tests__/` invocan las 21 herramientas por nombre.
- **Clientes externos / scripts E2E:** Scripts de aceptación e integración invocan el catálogo actual.

---

## 2. Reconciliación Arquitectónica y Contraste con el Código Actual (`fd47b84`)

### 2.1 Propuesta de Reducción vs. Autorización para Retirar Herramientas (Gobernanza MVP)
- **Regla de reconciliación crítica:** **Una propuesta analítica de reducir de 21 a 9 herramientas NO constituye autorización para retirarlas, renombrarlas ni fusionarlas antes del cierre del MVP del 20 de noviembre.**
- **Evidencia en contratos y WBS:**
  - En [08_WBS_MICROTAREAS_Y_COMPUERTAS.md](../../08_WBS_MICROTAREAS_Y_COMPUERTAS.md) y [PLAN_ONE_SHOT_Y_MERGE.md](../../PLAN_ONE_SHOT_Y_MERGE.md), todas las pruebas de regresión de `VNEXT-014` (`654` tests en `packages/mcp`), el flujo vertical `DEV-MVP-02` y la tarea `S83-002` de Diego (`sync-mcp-schemas.mjs`, `qap mcp register`) dependen de la estabilidad de los nombres actuales del catálogo.
  - Además, en el commit `fd47b84` (del 14 de noviembre de 2026) y `0df5199`, **`qap_start` NO es un simple alias desechable**: como se verifica en [server.ts](../../../../packages/mcp/src/server.ts#L910-L1103), `qap_start` es el orquestador conversacional activo para la experiencia operativa P0 (`configuredWorkspaceRoot` + `silentBoundScope`) que:
    1. Emite y vincula el `conversation_id` y la bitácora `.qa/conversations/<id>.jsonl`.
    2. Registra `base_url` vía `qap_context_set`.
    3. Ejecuta `authenticateScopedPassword` si recibe `credentials` o renueva sesión del perfil conocido.
    4. Dispara automáticamente `qap_discover` sobre la ruta autenticada o pública para publicar `.qa/discovery/INDEX.md` e `INICIO.md` en una sola llamada.
  - **Decisión de auditoría:** Para el MVP del 20 de noviembre se **congela el catálogo público actual (sin eliminar ninguna de las 21 herramientas)**. Cualquier reducción de tokens o consolidación de herramientas queda clasificada como **evolución post-MVP (P2)** o limitada exclusivamente a adelgazar textos redundantes en descripciones sin alterar nombres ni firmas de `inputSchema`.

### 2.2 Corrección Técnica sobre `qap_auth_provision` vs. `qap_auth_add`
- En la tabla original del Agente 02 (fila `qap_auth_provision`), se describió erróneamente su efecto secundario como *"Ejecuta flujo de login/browser y persiste `storageState`"*.
- **Verificación contra el código fuente:**
  - En [tool-catalog.ts](../../../../packages/mcp/src/tool-catalog.ts#L192-L204) y [server.ts](../../../../packages/mcp/src/server.ts#L716-L728), `qap_auth_provision` invoca `provisionAccess.provision(rawArgs, context.signal)` ([interactive-access.ts](../../../../packages/mcp/src/interactive-access.ts)), cuya única función es abrir el diálogo seguro del host local en Windows para que el operador ingrese y guarde la contraseña en el llavero (`keychain`) sin que el secreto pase por el LLM. **No abre navegador ni realiza login ni persiste `storageState`.**
  - Quien ejecuta el navegador (`captureVerifiedPassword`, `captureVerifiedAuto`, `captureVerifiedHandoff` en [verified-handoff.ts](../../../../packages/mcp/src/verified-handoff.ts)) y persiste el `storageState` verificado es **`qap_auth_add`** (o `qap_start` cuando delega en `authenticateScopedPassword`).
  - Por tanto, `qap_auth_provision` (provisión fuera de banda del secreto en el host) y `qap_auth_add` (autenticación y verificación de sesión de la aplicación) cumplen funciones de seguridad distintas que **no deben confundirse**.

### 2.3 Estado Real de Migración al `ToolDispatcher` Declarativo (`VNEXT-011` a `VNEXT-014`)
- Como se comprueba en [server.ts](../../../../packages/mcp/src/server.ts#L396-L466):
  - **7 herramientas** están migradas a handlers declarativos (`IMcpToolHandler`): `qap_status`, `qap_project`, `qap_context_set`, `qap_discover`, `qap_plan`, `qap_test`, `qap_report`.
  - **3 herramientas** se interceptan antes del `dispatcher.dispatch()` en `server.ts`: `qap_project_reset` (`L601`), `qap_auth_provision` (`L716`), `qap_start` (`L910`), además de la ruta `scopedProject` de `qap_auth_add` (`L900`).
  - **11 herramientas** permanecen en el `switch (name)` legacy de `server.ts` (`L1148+`): `qap_init`, `qap_auth_add` (ruta estándar), `qap_auth_list`, `qap_context_ingest`, `qap_session_plan`, `qap_validate`, `qap_server`, `qap_prune`, `qap_rules_set`, `qap_module_close`, `qap_session_close`.
