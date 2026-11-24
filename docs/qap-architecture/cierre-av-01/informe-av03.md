# Informe principal AV-03 · Autonomía, memoria, persistencia e interoperabilidad MCP/CLI

**Estado de intervención.** Propuesta de contratos y diseño publicada por Antigravity (Auditor Técnico Independiente, responsable principal de AV-03). **Contravalidación de Codex, decisión del Orquestador y validación experimental pendientes.** Este informe no autoconcede cierre definitivo de AV-03, no aprueba la arquitectura global, no altera los estados principales del [registro maestro](registro-maestro.md#estados-vigentes) ni autoriza iniciar G0/G1, elaborar WBS o ejecutar experimentos.

**Base auditada.** Repositorio `Hyouka73/QAMCP`, rama `develop`, SHA exacto `e2a7ee95b56eceed0249bb2b5393334fa2e53196` (24 de noviembre de 2026). Lectura estática exclusiva del código real, tags archivados de solo lectura (`d4cfadfa5bf25591b72001bccab69b7dd1bbb6a7`, `c57cd886bbda09902afc7d118b54226c1b59e62b`, `a78322f832fd69ccf58b7cb24f1571c8e1481e75`), [D01–D21](../acta-decisiones.md), [AV-01](dictamen-av01.md), [AV-02](dictamen-av02.md), [fe de correcciones AR-27](fe-correcciones-ar27.md) y documentación oficial vigente de MCP, Node.js, SQLite y sistemas operativos.

**Alcance exclusivo.** `AR-05`, `AR-11`, `AR-12`, `AR-15`, `AR-42`, `AR-45`, `AR-46` y `AR-52` conforme al [encargo del Orquestador](decision-orquestador-av02-encargo-av03.md). No se reabren AV-01 ni AV-02 (incluido el diseño de captura de `AR-27`). `MANAGED` (D03) y PostgreSQL concurrente (D02) permanecen diferidos.

---

## 1. Dictamen ejecutivo de AV-03 y separación epistémica

- **Dictamen principal:** **`CONTRATOS Y DISEÑO PROPUESTOS CON BLOQUEANTES EXPERIMENTALES Y DE CONTRAVALIDACIÓN PENDIENTES`**.
- **Separación obligatoria aplicada en todo el expediente:**
  1. **Evidencia existente verificada:** hechos comprobados en `e2a7ee95` y en los tags archivados, con ruta y rango de líneas exactos.
  2. **Propuesta de contrato y diseño:** especificaciones, invariantes, alternativas locales viables y riesgos residuales definidos por este auditor para contravalidación por Codex.
  3. **Validación experimental pendiente:** protocolos, criterios verificables de aceptación y compuertas (`EXP-01a`, `EXP-01b`, `E1`, `E2`, `E3`, `E4`, `E5`, `E7`); ningún experimento fue ejecutado en esta ronda.

### Hallazgos nuevos y correcciones fácticas detectadas en el contraste con `e2a7ee95`

| ID | Severidad | Registro(s) | Evidencia verificada en `e2a7ee95` y fuentes oficiales | Corrección requerida en la arquitectura objetivo |
|---|---|---|---|---|
| **H-AV03-01** | **Alta** | `AR-12` (y `AR-23`/AV-07) | Tanto `HN-06` de Neon (`Node >= 22.12.0`) como la corrección previa de Antigravity en `C-02` (`Node >= 22.13.0`) son **insuficientes** para el almacén actual: [`sqlite-knowledge-adapter.ts:38-54`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/knowledge/src/storage/sqlite-knowledge-adapter.ts#L38-L54) ejecuta un preflight `sqlite_compileoption_used('ENABLE_FTS5')` que exige **`Node >= 22.16.0`**. Confirmado en upstream [`nodejs/node#57621`](https://github.com/nodejs/node/pull/57621): `SQLITE_ENABLE_FTS5` se habilitó en **Node 24.0.0** y se backporteó a **Node 22.16.0** (en `22.13.0–22.15.x` el módulo `node:sqlite` ya no pide flag pero carece de FTS5). Ningún `package.json` del monorepo declara `"engines"`. | Corregir el piso mínimo de runtime para `node:sqlite` + FTS5 a **`Node >= 22.16.0`** (recomendado **Node 24 LTS**) o seleccionar un driver nativo con FTS5 empaquetado (`better-sqlite3`, trazado a `AR-23`/AV-07). |
| **H-AV03-02** | **Alta** | `AR-15` | [`packages/cli/src/commands/mcp.ts:6`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/cli/src/commands/mcp.ts#L6) restringe `qap mcp register` a `VALID_CLIENTS = ['cursor', 'claude', 'all']`. No existe registro automatizado ni artefactos canónicos de adopción (`SKILL.md`, plantillas de hooks opt-in) para los cuatro hosts obligatorios de D13 (`Antigravity`, `Codex`, `Claude Code`, `Gemini CLI`). Además, `pnpm-lock.yaml` resuelve **dos versiones** de `@modelcontextprotocol/sdk` (`1.30.0` y `1.30.1`), ambas en línea v1.x (sin soporte nativo para la era `2026-07-28`). | Definir registro idempotente por host objetivo y ejecutar `EXP-01a` antes de congelar SDK v1 vs. v2 (`serveStdio`) en G1. |
| **H-AV03-03** | **Alta** | `AR-05`, `AR-12`, `AR-42` | En [`app-service-store.ts:125-158`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/mcp/src/application/app-service-store.ts#L125-L158), la tabla `tasks` **carece** de carril (`DETERMINISTIC`/`REASONING`), `lease_owner`, `lease_expires_at`, `lease_epoch` (fencing), `depends_on_json`, `idempotency_key` y contabilidad de presupuesto; y `permission_grants` solo admite 5 capacidades (`access`, `login`, `observe`, `execute`, `accept`) frente a las **8 capacidades autorizables + 4 grants multimedia independientes** exigidas por [AV-01 Enmienda 3](../catalogo-requisitos.md#req-seg-0011) y D18. | Rediseñar el esquema canónico de colas/leases y grants en `IQapRepository` antes de congelar G1. |
| **H-AV03-04** | **Alta** | `AR-42` | En [`packages/mcp/src/server.ts:6128-6168`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/mcp/src/server.ts#L6128-L6168), `stdin.close`, `stdin.end`, `SIGINT` y `SIGTERM` invocan `orderlyShutdown` seguido de `process.exit(0)`. Toda la ejecución vive en el mismo proceso hijo del host Stdio; no existe ejecutor independiente, IPC local ni desacople de árbol de procesos (PGID/Job Object). `LockManager` ([`lock-manager.ts:18,49-58`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/knowledge/src/storage/lock-manager.ts#L18-L58)) usa `proper-lockfile` en `.qa/cache/locks` por módulo, sin identidad de endpoint IPC ni fencing monotónico. | Desacoplar el adaptador MCP Stdio (cliente IPC efímero) del proceso ejecutor soberano con ciclo de vida, locks, IPC autenticado y recuperación propios. |
| **H-AV03-05** | **Media-Alta** | `AR-52` | [`packages/cli/src/errors.ts:19-29`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/cli/src/errors.ts#L19-L29) codifica errores CLI con `sysexits.h` (`0, 1, 2, 65, 66, 69, 70, 74, 78`), mientras [`packages/cli/src/commands/test.ts:210,230`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/cli/src/commands/test.ts#L210-L230) devuelve `0` ante ejecuciones vacías o solo `not_run` y choca en el código `2` (`USAGE` vs. `ERROR` de campaña en `O-05`). | Fijar una tabla sin colisiones que separe resultados de ejecución/campaña (`0–5` compartidos como `cli_exit_code` en MCP y CLI) de errores de invocación/entorno CLI (`64–78`, p. ej. `64 = EX_USAGE`). |

---

## 2. Resolución individual de registros AV-03

### AR-05 · Campaña autónoma completa, elegibilidad ordinaria, bloqueos locales y migración de recibos

**Requisitos afectados.** `REQ-CAM-001.1–001.5`, `REQ-DIS-001.1`, `REQ-CAS-001.1`, `REQ-PLN-001.2` (y D01, D04).

**1. Evidencia existente verificada (código `e2a7ee95` y antecedentes).**
- En `develop` (`e2a7ee95`), `qap_start` ([`server.ts:1556-1809`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/mcp/src/server.ts#L1556-L1809)) dispara únicamente inventario inicial y devuelve `siguiente_accion` para que el LLM conduzca turno a turno.
- [`test.handler.ts:482-496`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/mcp/src/handlers/test.handler.ts#L482-L496) exige `verifyCaseApproval` caso por caso antes de ejecutar y bloquea incondicionalmente cualquier paso fuera de `READ_ONLY_STEPS` en proyectos vinculados (`mutation_scope_unavailable`).
- [`lifecycle.ts:487-548`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/engine/src/lifecycle.ts#L487-L548) impone compuertas humanas de avance de fase que frenan la autonomía de D04 y bloquean lotes completos ante impedimentos locales.
- Los recibos históricos de cierre y exención viven como relaciones `closure:<decisionId>` / `waiver:<decisionId>` en [`canonical-closure-service.ts:117-143`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/mcp/src/handlers/canonical-closure-service.ts#L117-L143) y marcadores `.qap-committed` en [`application-service.ts:4097-4102`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/mcp/src/application/application-service.ts#L4097-L4102).
- El antecedente archivado [`archive/2026-11-23/codex/qap-autonomous-mvp`](https://github.com/Hyouka73/QAMCP/blob/d4cfadfa5bf25591b72001bccab69b7dd1bbb6a7/docs/qap-autonomous-mvp.md) demostró un smoke sintético Stdio (`qap_start → qap_plan → qap_test → qap_report`) con elegibilidad por política en un fixture `127.0.0.1`, pero **no** está integrado en `develop` ni cubre Discovery SPA profundo, preparación de datos (`DataPlan`), reportes D11 ni regresión longitudinal.

**2. Contraste con recomendaciones previas.**
- Coincide con Neon (`DP-01`, §6.A) y Antigravity (§7) en retirar `verifyCaseApproval` para casos ordinarios dentro de política vigente y derivar el estado de campaña desde el grafo de tareas.
- **Precisión añadida por AV-03:** la autonomía **nunca** amplía permisos ni autoaprueba excepciones de negocio; además, la tabla `permission_grants` actual (5 capacidades) debe expandirse para reflejar las 8 capacidades autorizables de AV-01 Enmienda 3 más los 4 grants multimedia de D18 (`AR-32`), y los presupuestos globales de campaña (`REQ-CAM-001.3`) deben gobernar el cierre explícito `COMPLETADA_PARCIAL`.

**3. Propuesta de contrato técnico.**
- **Ciclo autónomo unificado (`CampaignOrchestrator` en `@qap/core`):**
  - Entrada: intención en lenguaje natural (interpretada por HOST) o comando CLI parametrizado + autorización inicial válida ligada al `ExecutionScopeEnvelope` de **AR-04** (`ScopeIdentity`, `ProfileBinding`, `AppVariantContext`, `FrozenRegionalContext`) y a identidad/permisos efectivos acreditados por destino (**AR-14**, **AR-31**).
  - Flujo continuo sin aprobación manual por caso ordinario: `Autorización inicial → Discovery incremental → Consolidación epistémica (4 planos) → Planificación y congelación de snapshot → Preparación de datos (AV-04/05) → Ejecución → Evaluación de oráculos (AV-04) → Publicación y reporte → Regresión/aprendizaje`.
  - **Modos de intención (`REQ-CAM-001.5`):** `EXPLORE`, `REGRESSION`, `DEFECT_INVESTIGATION`, `CONTINUE` operan como políticas de prioridad y selección sobre el mismo estado durable de campaña, sin reiniciar identidad, revisiones ni conocimiento.
- **Contrato de elegibilidad ordinaria (`EligibilityPolicy`):**
  - Un caso es elegible automáticamente si y solo si: (1) su `ExecutionScopeEnvelope` coincide con un grant activo y no revocado (generación de política vigente, **AR-47**), (2) sus operaciones están cubiertas por las 8 capacidades autorizables pertinentes (lectura vs. escritura/mutación vs. datos sintéticos), (3) su expectativa/oráculo proviene de una fuente acreditada por política (sin contradicción abierta sin resolver), y (4) sus dependencias `depends_on` están satisfechas.
  - Un caso **no elegible** (falta de permiso, conflicto de autoridad de igual rango, sesión ausente/revocada, decisión de negocio abierta, ciclo DAG o dato faltante) transiciona únicamente su nodo y sus dependientes directos a `BLOCKED` con `block_reason_code` tipado y acción de desbloqueo. **Las ramas hermanas independientes continúan ejecutándose** (`REQ-CAM-001.2`).
- **Control de presupuestos (`REQ-CAM-001.3`):**
  - Presupuestos configurables y persistidos por campaña: `max_wall_time_ms`, `max_attempts`, `max_discovery_pages`, `max_reasoning_requests`, `max_mutation_ops`.
  - Al alcanzar cualquier límite, el orquestador detiene nuevas admisiones, drena o cancela limpiamente lo en vuelo según política, persiste cursor/frontera reanudable y cierra la campaña en estado explícito `COMPLETADA_PARCIAL` con desglose de ejecutados, pendientes y brechas.
- **Migración y preservación de recibos históricos:**
  - Los recibos legados (`closure:*`, `waiver:*`, `.qap-committed` y `verifyCaseApproval` históricos) se importan como registros inmutables de procedencia `legacy_receipt` en `IQapRepository` (solo lectura, nunca usados para otorgar nueva autoridad de mutación ni para evadir política vigente).

**4. Alternativas locales viables y riesgos residuales.**
- *Alternativa viable:* si el proyecto carece aún de política autónoma o fuentes acreditadas completas, el orquestador opera en modo `EXPLORE` de solo lectura acreditada y emite casos candidatos en plano de inferencia/observación marcados como `BLOCKED (missing_accredited_oracle)` hasta recibir fuente o decisión explícita, sin bloquear el descubrimiento ni degradar la veracidad.
- *Riesgo residual:* una política inicial demasiado amplia otorgada por el operador puede habilitar escrituras en un entorno QA mal etiquetado; se mitiga exigiendo verificación de origen/tenant por destino (**AR-14**, **AR-31**) y denegación por defecto de producción.

**5. Experimentos, criterios de aceptación y compuertas.**
- **Compuertas:** `E3` (G1/G4) y `E4` (G2/G4); dependencia saliente hacia AV-04 (oráculos y datos mutativos) y AV-08 (aceptación E8).
- **Criterios verificables:**
  1. Campaña lanzada desde intención natural + autorización inicial completa Discovery → Plan → Ejecución → Reporte con **0 solicitudes de aprobación por caso ordinario**.
  2. Al sembrar un bloqueo de permiso o contradicción en módulo A, módulo B independiente completa 100 % de sus casos elegibles y el estado final reporta ambos con razones tipadas.
  3. Al agotar cualquiera de los presupuestos configurados, la campaña cierra exactamente en `COMPLETADA_PARCIAL`, conserva cursor reanudable y al ampliar presupuesto continúa sin repetir casos ya confirmados.
  4. La importación de recibos legados preserva 100 % de sus hashes e IDs sin conceder permisos activos no respaldados por política actual.

---

### AR-11 · Modos `HOST` y `DETERMINISTIC`, y puerto diferido `MANAGED`

**Requisitos afectados.** `REQ-IA-001.1–001.6`, `REQ-CAM-001.4` (y D03).

**1. Evidencia existente verificada (`e2a7ee95`).**
- En `develop`, el modo `HOST` opera implícitamente vía MCP Stdio ([`server.ts:699-906`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/mcp/src/server.ts#L699-L906)), pero las propuestas del agente carecen de un contrato único: 11 herramientas pasan por `switch` legacy ([`server.ts:1906-5674`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/mcp/src/server.ts#L1906-L5674)) omitiendo `ToolDispatcher` ([`dispatcher.ts:48-117`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/mcp/src/dispatcher.ts#L48-L117)).
- `PlaywrightRunner` ([`runner.ts:587-936`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/playwright-runner/src/runner.ts#L587-L936)) ejecuta pasos sin invocar modelos por paso, pero **no existe** un modo `DETERMINISTIC` de campaña ni separación formal de colas.
- No existe ningún símbolo `IReasoningProvider`, `MANAGED` ni adaptador de proveedor de modelos en `packages/`.

**2. Contraste con recomendaciones previas.**
- Convergencia total con D03, Neon (`DP-06`, §6.A) y Antigravity (§7): lanzamiento con `HOST` + `DETERMINISTIC`; `MANAGED` diferido sin exigir APIs externas ni credenciales de LLM en el lanzamiento.
- **Precisión añadida por AV-03:** es indispensable fijar la frontera de extensión compatible de `IReasoningProvider` (sobre un sobre de solicitud/propuesta idéntico al que consume `HOST`), de modo que activar `MANAGED` en una fase futura no altere validación, autoridad, leases ni trazabilidad.

**3. Propuesta de contrato técnico.**
- **Dos modos activos en el lanzamiento:**
  - `HOST`: el razonamiento (interpretación de intención, diseño/propuesta de casos, diagnóstico de fallos, clasificación de contradicciones, propuesta de reparaciones de localizador) lo provee el agente conectado mediante el protocolo estructurado de solicitudes/propuestas.
  - `DETERMINISTIC`: ejecuta planes congelados, re-ejecuciones, regresión sobre snapshots vigentes y lotes de observación/verificación ya autorizados con **cero llamadas de inferencia** (`inference_calls = 0`) y sin requerir cliente MCP conectado.
- **Protocolo único de solicitudes y propuestas (`ReasoningTaskEnvelope` / `StructuredProposal`):**
  - Toda solicitud emitida por el núcleo incluye: `task_id`, `campaign_id`, `lease_id`, `lease_epoch` (monotónico), `scope_digest` (AR-04), `context_digest` (paquete saneado sin secretos ni `ProfileBinding`), `schema_version`, `expected_revisions` (mapa de IDs y revisiones vigentes) y `proposal_kind` (`CASE_DESIGN | ORACLE_PROPOSAL | DISCOVERY_CLASSIFICATION | FAILURE_DIAGNOSIS | LOCATOR_REPAIR | I18N_PROPOSAL`).
  - Toda propuesta devuelta (por `HOST` hoy o por `MANAGED` en el futuro) pasa por un **único validador de propuestas en `@qap/core`** (`REQ-IA-001.3`) que exige: esquema JSON válido, `lease_id` + `lease_epoch` vigentes, `expected_revisions` no obsoletas, ausencia de secretos/expansión de alcance y respeto a los 4 planos epistémicos (una propuesta entra como inferencia/propuesta; solo promueve a expectativa ejecutable si cumple reglas de autoridad).
  - Idempotencia: reenviar la misma propuesta con igual `(task_id, lease_epoch, proposal_digest)` devuelve el commit existente; una respuesta tardía con `lease_epoch` vencido o revisión obsoleta se rechaza con código tipado (`STALE_LEASE` / `STALE_REVISION`).
- **Puerto diferido `IReasoningProvider` (`REQ-IA-001.6`):**
  - Interfaz mínima definida en `@qap/contracts` (sin implementación productiva ni dependencias de SDKs de LLM en el lanzamiento): `readonly mode: 'HOST' | 'MANAGED'`, `readonly capabilities`, `submitTask(envelope): Promise<ProviderAck>`, `cancelTask(taskId, leaseEpoch): Promise<void>`.
  - En el lanzamiento, solo el adaptador `HostReasoningQueueAdapter` (encolado pull-based para clientes MCP/CLI) está activo; un doble de prueba en memoria ejerce el contrato en CI. Activar `MANAGED` en el futuro requerirá su propia decisión de alcance, política de privacidad de datos enviados a terceros y compuerta de seguridad.

**4. Alternativas locales viables y riesgos residuales.**
- *Alternativa viable:* cuando no haya agente conectado y existan tareas en la cola de razonamiento, el ejecutor continúa drenando la cola `DETERMINISTIC` y expone las tareas de razonamiento pendientes en `qap status --json` y en el snapshot contextual para que otro agente o un operador humano (vía CLI/MCP) las resuelva al reconectar.
- *Riesgo residual:* la calidad semántica de las propuestas en modo `HOST` depende del modelo y del cliente conectado (fuera del control de QAP). QAP acota este riesgo rechazando propuestas malformadas, sin linaje o fuera de política, nunca permitiendo que una propuesta degrade la autoridad de ejecución ni fabrique un `PASS` (**AR-28**).

**5. Experimentos, criterios de aceptación y compuertas.**
- **Compuertas:** `E1` (G0/G1), `E3` (G1/G4) y `E7` (G1/G5).
- **Criterios verificables:**
  1. Replay y regresión de un plan congelado en modo `DETERMINISTIC` completan con **0 llamadas de inferencia** y sin proceso HOST conectado, conservando linaje de plan e intento nuevo.
  2. El validador único rechaza 100 % de propuestas con `lease_epoch` caducado, revisión obsoleta, esquema inválido o intento de expandir `ScopeIdentity`/`ProfileBinding`.
  3. El doble de prueba de `IReasoningProvider` supera la suite de contrato sin requerir API keys ni red externa, y la configuración `MANAGED` rechaza su activación en el lanzamiento con código explícito `MODE_DEFERRED`.

---

### AR-12 · Autoridad única SQLite, límites de transacción, búsqueda FTS, cola y puerto PostgreSQL futuro

**Requisitos afectados.** `REQ-MEM-003.6`, `REQ-INT-001.3`, `REQ-MEM-001.1` (y D02).

**1. Evidencia existente verificada (`e2a7ee95`).**
- **Fragmentación y múltiples escritores confirmados:** existen **6 bases SQLite separadas** (`app-service.sqlite`, `knowledge.sqlite`, `project-operations.sqlite`, `qap.sqlite`, `interview-drafts`, `module-closures`) más archivos mutables `.qa/` YAML/JSON, con **10 archivos de producción importando `node:sqlite`** (`sqlite-knowledge-adapter.ts`, `knowledge-sqlite-schema.ts`, `app-service-store.ts`, `interview-draft-store.ts`, `module-closure-store.ts`, `host-composition.ts`, `project-reset.ts`, `evidence-artifacts.ts`, `provisional-execution.ts`, `sqlite-client.ts`) y 4 autoridades de escritura concurrentes (`@qap/mcp`, `@qap/cli`, `@qap/playwright-runner`, `@qap/reporter`).
- **Inconsistencias de PRAGMAs y durabilidad entre almacenes actuales:**
  - [`sqlite-knowledge-adapter.ts:152-156`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/knowledge/src/storage/sqlite-knowledge-adapter.ts#L152-L156): `WAL`, `synchronous = FULL`, `busy_timeout = 1000`, `foreign_keys = ON`.
  - [`app-service-store.ts:562-565`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/mcp/src/application/app-service-store.ts#L562-L565): `WAL`, `synchronous = NORMAL`, `busy_timeout = 5000`, `foreign_keys = ON`.
  - [`interview-draft-store.ts:71-85`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/mcp/src/handlers/interview-draft-store.ts#L71-L85): `busy_timeout = 0`, `synchronous = FULL`.
- **Piso real de Node.js (Hallazgo `H-AV03-01`):** [`sqlite-knowledge-adapter.ts:38-54`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/knowledge/src/storage/sqlite-knowledge-adapter.ts#L38-L54) exige `SQLITE_ENABLE_FTS5`, disponible en `node:sqlite` únicamente desde **Node 22.16.0** y **Node 24.0.0** ([`nodejs/node#57621`](https://github.com/nodejs/node/pull/57621)). `node:sqlite` figura como `Stability: 1.2 - Release candidate` ([Node.js SQLite docs](https://nodejs.org/api/sqlite.html)). Ningún `package.json` declara `"engines"`.
- `knowledge_revisions` tiene triggers de inmutabilidad válidos ([`knowledge-sqlite-schema.ts:37-54`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/knowledge/src/storage/knowledge-sqlite-schema.ts#L37-L54)), pero carece de `tenant_id`, `instance_id`, `product_version` y `visual_variant` en su clave primaria.

**2. Contraste con recomendaciones previas y fuentes oficiales.**
- Se corrige el desacuerdo de piso Node entre Neon (`>=22.12.0`) y Antigravity previo (`>=22.13.0`): el piso mínimo real con `node:sqlite` + FTS5 es **`Node >= 22.16.0`** (recomendado **Node 24 LTS**).
- Conforme a [SQLite WAL](https://www.sqlite.org/wal.html), WAL provee lectores concurrentes que no bloquean al escritor, pero mantiene **un único escritor a la vez** y **no funciona sobre sistemas de archivos en red (NFS/SMB)** porque requiere memoria compartida (`-shm`) en el mismo host. Por tanto, QAP debe imponer escritor único a nivel de proceso (el ejecutor soberano) y rechazar explícitamente rutas de BD sobre almacenamiento en red no local.
- La selección definitiva del driver SQLite (`node:sqlite` vs. `better-sqlite3`, incluyendo ABI, compilación nativa, licencia y distribución `npx`) queda trazada a **`AR-23` (AV-07)**; AV-03 congela el contrato del puerto `IQapRepository` para que el dominio sea agnóstico al driver.

**3. Propuesta de contrato técnico.**
- **Puerto único de persistencia (`IQapRepository` en `@qap/core` / `@qap/contracts`):**
  - Agrupa sub-puertos cohesivos por agregado: `IKnowledgeRepo` (4 planos epistémicos, revisiones inmutables, contradicciones, linaje), `ICampaignQueueRepo` (campañas, tareas DAG, doble carril determinista/razonamiento, leases con `lease_epoch`), `IExecutionRepo` (intentos, 4 ejes de resultado, atestación AR-28, publicación provisional/confirmada), `IPolicyGrantRepo` (8 capacidades + 4 grants multimedia, generaciones monotónicas de revocación AR-47, auditoría), `IDefectRegressionRepo` (defectos, firmas de fallo, flakiness, reparaciones `vN+1`) y `ISearchPort` (búsqueda textual acotada por `ScopeIdentity`).
  - **Separación física obligatoria (`REQ-MEM-002.5` + `AR-07`):** secretos, KEKs y sobres de sesión (`SessionStore`/`ISecretVault`) **nunca** residen en `IQapRepository` ni se exportan con Knowledge.
- **Invariantes del adaptador local `@qap/repository-sqlite` (escritor único):**
  - **Autoridad exclusiva de escritura:** solo el proceso ejecutor soberano abre la BD canónica en modo lectura-escritura (`qap-core.sqlite`). Los adaptadores MCP, CLI y el visor **jamás** abren SQLite directamente en escritura; toda lectura/escritura pasa por IPC al ejecutor (o, en diagnóstico offline de solo lectura explícito `qap doctor`, apertura `readOnly: true` con `PRAGMA query_only = ON`).
  - **Configuración uniforme obligatoria:** `PRAGMA journal_mode = WAL`, `PRAGMA synchronous = FULL` (o `NORMAL` únicamente si se demuestra equivalencia ante corte de proceso sin pérdida de durabilidad en E2; por defecto `FULL` para commits de autoridad, publicación y revocación), `PRAGMA foreign_keys = ON`, `PRAGMA busy_timeout = 5000`, `PRAGMA temp_store = MEMORY`, `wal_autocheckpoint` acotado y verificación de `PRAGMA integrity_check` / `foreign_key_check` en arranque y recuperación.
  - **Límites de transacción:**
    - Toda mutación multi-tabla usa `BEGIN IMMEDIATE` (evitando deadlocks de promoción `DEFERRED → WRITE`) con duración acotada (sin I/O de red, navegador, subprocess ni IPC dentro de una transacción abierta).
    - Prohibido ejecutar `DatabaseSync` bloqueante en el hilo de eventos de un transporte compartido sin acotar latencia; el ejecutor serializa escrituras en un único hilo/worker dedicado.
    - Integración con **AR-25**: reserva de espacio por volumen calculada antes de aceptar nuevas evidencias pesadas y manejo explícito de `SQLITE_FULL` sin publicación parcial.
  - **Migraciones versionadas:** tabla `schema_migrations` + `PRAGMA user_version`, migraciones forward-only deterministas con respaldo previo automático antes de migrar esquema en producción local, y compatibilidad de exportación/importación versionada (`REQ-MEM-003.4`).
  - **Búsqueda (`ISearchPort`):** FTS5 (`unicode61 remove_diacritics 2`) con predicado obligatorio de `ScopeIdentity` (aislamiento de tenant/proyecto/entorno/rol/variante en toda consulta FTS, impidiendo fugas cruzadas entre alcances).
  - **Cola durable en SQLite:** tabla `work_queue` con columnas `task_id`, `campaign_id`, `lane ('DETERMINISTIC'|'REASONING')`, `state`, `priority`, `depends_on_json`, `lease_owner`, `lease_epoch`, `lease_expires_at`, `idempotency_key`, `scope_digest`, `policy_generation`. Reclamo atómico mediante `UPDATE ... WHERE state='READY' AND (lease_expires_at IS NULL OR lease_expires_at < ?) RETURNING *` dentro de `BEGIN IMMEDIATE`.
- **Frontera del puerto PostgreSQL futuro (D02 — diferido):**
  - El contrato de `IQapRepository` prohíbe filtrar dialecto SQLite (`rowid`, `PRAGMA`, `MATCH` crudo de FTS5) hacia `@qap/core`.
  - Toda operación expone semántica portable: transacciones con aislamiento `SERIALIZABLE`/`READ COMMITTED` + `SELECT ... FOR UPDATE SKIP LOCKED` equivalente al reclamo atómico de cola, búsqueda vía `ISearchPort` (mapeable a `tsvector`/GIN en PostgreSQL), claves primarias UUID/ULID y timestamps ISO-8601 UTC.
  - PostgreSQL concurrente permanece **diferido**; su implementación y pruebas de concurrencia multiusuario corresponden a una fase posterior.

**4. Alternativas locales viables y riesgos residuales.**
- *Alternativa viable para el driver local (decisión conjunta con `AR-23`/AV-07):* (a) `node:sqlite` exigiendo `Node >= 22.16.0` (cero compilación nativa, depende de `Stability: 1.2`), o (b) `better-sqlite3` (FTS5 empaquetado independientemente de la versión menor de Node, requiere binarios prebuild/N-API por SO/arquitectura). Ambas viven detrás de `@qap/repository-sqlite`.
- *Alternativa viable si el workspace reside en unidad de red (SMB/NFS):* ubicar `qap-core.sqlite` en el directorio local de datos del usuario (`QAP_DATA_DIR`, fuera de la unidad de red) ligado por ID canónico de proyecto, evitando corrupción WAL.
- *Riesgo residual:* un binario legacy o herramienta externa que escriba directamente en el archivo `.sqlite` rompe el invariante de escritor único; se mitiga con el protocolo de corte de autoridad (`plan-maestro.md`), permisos de directorio `0700`/SID y `PRAGMA application_id` dedicado.

**5. Experimentos, criterios de aceptación y compuertas.**
- **Compuertas:** `E1` (G0/G1), `E2` (G1/G5); dependencia saliente hacia **AV-07 (`AR-23`, `AR-26`, `AR-54`)** para selección de driver, licencias y migración.
- **Criterios verificables:**
  1. Suite de contrato `IQapRepository` pasa 100 % sin referencias a SQLite en `@qap/core` ni `@qap/contracts`.
  2. Pruebas de aislamiento A↔B confirman 0 fugas entre tenants/perfiles/variantes en consultas directas, FTS5 y exportación.
  3. Contención de 2 clientes rivales + corte abrupto durante transacción preserva `PRAGMA integrity_check = ok`, 0 doble escritor y 0 pérdida de commits confirmados.
  4. `qap doctor` detecta y rechaza antes de abrir BD tanto Node sin `ENABLE_FTS5` (si se elige `node:sqlite`) como rutas de almacén en red no soportadas por WAL.

---

### AR-15 · Interoperabilidad con cuatro hosts, CLI, protocolos MCP, adopción y ahorro medible de tokens

**Requisitos afectados.** `REQ-AGT-001`, `REQ-IA-001.1`, `REQ-MEM-002.4`, `REQ-INT-001.1–001.2`, `REQ-CAM-001.4` (y D13).

**1. Evidencia existente verificada (`e2a7ee95` y fuentes oficiales).**
- `pnpm-lock.yaml` resuelve `@modelcontextprotocol/sdk` en dos versiones v1.x (`1.30.0` y `1.30.1`); [`packages/mcp/src/server.ts:18,6167`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/mcp/src/server.ts#L18) usa `StdioServerTransport` v1.x.
- [`packages/cli/src/commands/mcp.ts:6`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/cli/src/commands/mcp.ts#L6) solo soporta `cursor | claude | all`; no existen instaladores idempotentes ni artefactos canónicos de adopción (Skill breve + hooks informativos opt-in) para `Antigravity`, `Codex`, `Claude Code` y `Gemini CLI`.
- Documentación oficial verificada:
  - **MCP `2025-11-25`** ([lifecycle](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle), [transports](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)): handshake `initialize`, cierre Stdio vía `stdin` EOF → `SIGTERM` → `SIGKILL`, peticiones server→client (`elicitation`, `sampling`).
  - **MCP `2026-07-28`** ([changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog), [transports](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports)): núcleo stateless sin `initialize`, `server/discover`, metadatos en `_meta`, JSON Schema 2020-12, `tools/list` cacheable (`ttlMs`/`cacheScope`), eliminación de peticiones server→client (reemplazadas por respuestas `input_required` / MRTR), deprecación de `sampling`/`roots`/`logging`.
  - **MCP TypeScript SDK v2** ([protocol-versions](https://ts.sdk.modelcontextprotocol.io/v2/protocol-versions.html)): `serveStdio(factory)` soporta ambas eras (`legacy` 2024-10-07..2025-11-25 y `modern` 2026-07-28) desde un mismo punto de entrada; advierte explícitamente que un cliente en `mode: 'auto'` sobre `stdio` lanza un **proceso servidor extra efímero** (*probe*) por conexión.
  - **Capacidades de adopción reales de los 4 hosts objetivo:**
    - *Antigravity:* `mcp_config.json`, Skills `.agents/skills/<name>/SKILL.md` (carga progresiva), Rules `.agents/rules/*.md` (presupuesto 20k tokens), Hooks `.agents/hooks.json` (`SessionStart`, `PreToolUse`, `PostToolUse`, `Stop`).
    - *Codex CLI:* `.codex/config.toml` (`[mcp_servers]`), `AGENTS.md` (jerárquico, límite 32 KiB), Skills `.agents/skills/<name>/SKILL.md`, Hooks (`SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `Stop`).
    - *Claude Code:* `.mcp.json` / settings, `CLAUDE.md`, Skills, Hooks en `.claude/settings.json` (`SessionStart`, `UserPromptSubmit`, `PreToolUse` con exit `2` para bloqueo — prohibido bloquear suites legítimas por D13).
    - *Gemini CLI:* `.gemini/settings.json` (`mcpServers`, evitar `_` en alias por FQN `mcp_<alias>_<tool>`), Extensions, `GEMINI.md`, Agent Skills, Hooks (`BeforeTool`/`AfterTool`, stdout estrictamente JSON).

**2. Contraste con recomendaciones previas.**
- Se confirma `HA-05` y `C-08` de Antigravity sobre Neon (`HN-03`): migrar a ciegas a SDK v2 en G1 sin medir primero qué era hablan los 4 hosts reales ni proteger el arranque del ejecutor ante procesos *probe* efímeros introduce riesgo de arranques rivales y rotura de `elicitation`/esquemas.
- Se ratifica la postura honesta del encargo: **QAP no puede prometer ni garantizar el comportamiento interno de todos los agentes/LLMs.** QAP garantiza su contrato de transporte, su catálogo compacto, la autoridad exclusiva de acreditación (**AR-28**) y la medición transparente en `EXP-01a/b`.

**3. Propuesta de contrato técnico.**
- **Adaptador MCP delgado con arranque *lazy* del ejecutor:**
  - El binario Stdio (`qap-mcp` / `qap mcp`) **no** lanza ni muta el ejecutor soberano durante `server/discover`, `initialize` ni `tools/list`. La conexión o arranque bajo demanda del ejecutor ocurre únicamente al recibir la primera llamada de herramienta operativa (`tools/call`), eliminando el riesgo de arranques rivales por *sibling probe* en SDK v2 o sondeos de clientes.
  - Negociación de era y versión: diseño preparado para dual-era (`2025-11-25` + `2026-07-28`); la decisión final de librería (`@modelcontextprotocol/sdk` v1.x vs. `@modelcontextprotocol/server` v2 `serveStdio`) queda condicionada al resultado empírico de **`EXP-01a`** en G0.
  - **Cero dependencia de `elicitation/create` o `sampling` para el ciclo ordinario:** compatible con el modelo stateless de `2026-07-28` (donde `sampling` está deprecado y no existen peticiones server→client). Cuando falte autorización o decisión empresarial real, las herramientas devuelven un payload estructurado `BLOCKED` / `input_required` con acción explícita y nunca credenciales por MCP (**AR-07**).
  - **Regla de alias sin guiones bajos:** registrar el servidor como `qap` (compatible con el parser FQN `mcp_<alias>_<tool>` de Gemini CLI y uniforme en los 4 hosts).
- **Instalación y adopción idempotente (`qap host register --host <antigravity|codex|claude-code|gemini-cli>`):**
  1. Un único registro MCP por host (detectando y previniendo duplicados por proyecto/global).
  2. **Skill canónica breve** (compatible con el formato común `SKILL.md` con frontmatter YAML y carga progresiva) que enruta intención de pruebas funcionales QA hacia `qap_start` / `qap_status` y prohíbe sustituir el runner canónico por scripts externos ad-hoc.
  3. **Hooks informativos opt-in** (desactivados por defecto salvo habilitación explícita, desinstalables limpiamente): orientan/inyectan recordatorio ante comandos QA web, **jamás** bloquean shell, `pytest`, `vitest`, `jest`, `cargo test`, `curl` ni pruebas unitarias legítimas (D13).
  4. **Invariante de acreditación:** solo intentos firmados/atestados por el ejecutor soberano (**AR-28**) son publicables como resultados oficiales de QAP.
- **Compresión estructural y ahorro medible de tokens (sin cuotas inventadas):**
  - QAP reduce tokens de contexto mediante: (1) catálogo reducido y estable de herramientas MCP (sin duplicar 11 rutas legacy), (2) `SnapshotContextual` compacto versionado (`REQ-MEM-002.4`) con IDs, cobertura, bloqueos y siguiente tarea en lugar de volcar trazas/DOM completos, y (3) extracción acotada (`ariaSnapshotJSON` + diffs incrementales, coordinado con AV-06 / `EXP-02`).
  - El ahorro de tokens se mide contra una línea base reproducible (sin Skill / con volcado directo) usando el tokenizer/telemetría oficial de cada host en **`EXP-01b`**. No se fijan topes arbitrarios (p. ej. 150/200 tokens) como contrato previo a la medición.

**4. Alternativas locales viables y riesgos residuales.**
- *Alternativa viable si un host presenta incompatibilidad con SDK v2 o carece de soporte de MCP/hooks:* el usuario o agente opera mediante **CLI `qap --json`** con 100 % de paridad (**AR-52**), o mediante el perfil `legacy` (`2025-11-25`) explícito si `EXP-01a` detecta regresión en un host concreto.
- *Riesgo residual:* cambios unilaterales en clientes MCP propietarios (actualizaciones de Antigravity, Codex, Claude Code o Gemini CLI) o deriva del modelo pueden reducir la tasa espontánea de enrutamiento QA; se mitiga con pruebas de regresión de versión en `EXP-01a/b` y documentación explícita de versiones acreditadas (D13: prohibido afirmar compatibilidad universal sin evidencia).

**5. Experimentos, criterios de aceptación y compuertas.**
- Ver sección dedicada [Verificación de EXP-01a y EXP-01b y compuertas](#3-verificación-de-exp-01a-y-exp-01b-y-compuertas).

---

### AR-42 · Proceso ejecutor independiente, escritor único, locks/IPC, reanudación multi-host y muerte del árbol HOST

**Requisitos afectados.** `REQ-CAM-001.4`, `REQ-DIS-001.8`, `REQ-MEM-002.3–002.4`, `REQ-IA-001.4` (y D03, D05, AR-27, AR-28, AR-47).

**1. Evidencia existente verificada (`e2a7ee95` y antecedentes).**
- En `develop`, [`server.ts:6154-6168`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/mcp/src/server.ts#L6154-L6168) termina el proceso (`process.exit(0)`) al cerrarse `stdin` o recibirse `SIGTERM`. Toda llamada de Discovery (`discovery.handler.ts`) y Test (`test.handler.ts`) corre síncronamente dentro de ese proceso hijo del cliente MCP.
- [`application-service.ts:4201-4330`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/mcp/src/application/application-service.ts#L4201-L4330) recupera publicaciones provisionales al reiniciar, pero no continúa tareas deterministas sin host conectado ni preserva una cola de razonamiento con leases.
- El antecedente archivado [`archive/2026-11-23/lab/qap-hydrogen-r2-2026-11-23`](https://github.com/Hyouka73/QAMCP/blob/c57cd886bbda09902afc7d118b54226c1b59e62b/docs/qap-recovery/resultados-hydrogen.md) (`R2.4`) demostró en un fixture Windows 3 cortes externos (`SIGKILL`/`TerminateProcess`: `before_write`, `after_201_before_witness`, `after_observation_before_publish`) sin escrituras duplicadas tras `qap_status`, pero **no** demostró proceso ejecutor desacoplado del árbol de los 4 hosts, recuperación de sockets/named pipes, macOS/Linux ni segunda identidad OS.

**2. Contraste con recomendaciones previas y fuentes oficiales.**
- Coincide con `H02`, `H-REV-06`, Neon (§6.A) y Antigravity (§7) en desacoplar el ejecutor del árbol de procesos del host.
- **Precisiones críticas verificadas en documentación oficial de SO y alineadas con AV-02 (`AR-27`, `AR-28`, `AR-47`):**
  - **POSIX (Linux/macOS):** según [`setsid(2)`](https://man7.org/linux/man-pages/man2/setsid.2.html) y `child_process.spawn(..., { detached: true, stdio: 'ignore' })` + `child.unref()` ([Node `child_process`](https://nodejs.org/api/child_process.html)), el ejecutor se crea en una nueva sesión y nuevo grupo de procesos (PGID propio), sobreviviendo a `SIGHUP`/`SIGTERM`/`SIGKILL` enviados al PGID del host Stdio. En Linux, el control de identidad de cliente sobre Unix Domain Socket usa `SO_PEERCRED` ([`unix(7)`](https://man7.org/linux/man-pages/man7/unix.7.html)); en macOS usa `LOCAL_PEERCRED`/`getpeereid`.
  - **Windows:** un host puede ejecutar el adaptador Stdio dentro de un **Job Object** con `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE` ([Job Objects](https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects)). Crear un hijo con `detached: true` **falla en escapar del Job** si el Job del host **no** concedió `JOB_OBJECT_LIMIT_BREAKAWAY_OK` ([`JOBOBJECT_BASIC_LIMIT_INFORMATION`](https://learn.microsoft.com/en-us/windows/win32/api/winnt/ns-winnt-jobobject_basic_limit_information)). Por ello, el diseño **no puede asumir** que `detached: true` baste universalmente en Windows: debe soportar un **lanzador/supervisor independiente** (servicio de usuario / tarea registrada / helper lanzado fuera del Job del host) como alternativa de primera clase cuando el host imponga un Job sin *breakaway*.
  - **Propietario de procesos y medios (`AR-27`):** el ejecutor soberano es el **único propietario** de los procesos de navegador (`Playwright`), subprocesos de captura/codificación y directorios de staging de medios. En Linux/macOS/Windows, el ejecutor agrupa sus propios subprocesos de trabajo (navegador/códec) en un PGID o Job Object propio con `KILL_ON_JOB_CLOSE` para garantizar **0 procesos huérfanos** cuando el ejecutor se apaga o muere, al tiempo que él mismo sobrevive a la muerte del HOST.
  - **Frontera de confianza (`AR-28`) y revocación (`AR-47`):** el ejecutor aloja `AttemptAttestor` y el bus/watchdog de revocación durable con propagación a `AbortController` de Discovery y Runner en vuelo.

**3. Propuesta de contrato técnico.**
- **Arquitectura de procesos y propiedad:**
  1. `qap-mcp` (Stdio) y `qap` (CLI) son **clientes IPC efímeros** sin escritura a SQLite ni a artefactos. Al cerrarse `stdin` o recibir `SIGTERM`, `qap-mcp` cierra únicamente su conexión IPC y sale con `0`, **sin** detener el ejecutor ni las tareas deterministas en curso.
  2. `qap-executor` (ejecutor soberano) corre con vida independiente por `QAP_DATA_DIR` (instancia única por directorio de datos/alcance de instalación).
- **IPC local autenticado y permisos por SO:**
  - **Linux/macOS:** Unix Domain Socket en directorio privado con modo `0700` perteneciente al UID del usuario (o al principal OS dedicado en modo de confianza fuerte de **AR-28**), verificando `SO_PEERCRED`/`LOCAL_PEERCRED` + token de sesión efímero de 256 bits guardado en archivo `0600` (y nunca pasado por `argv` ni entorno heredado a terceros).
  - **Windows:** Named Pipe (`\\.\pipe\qap-exec-<hash>`) creado con `SECURITY_ATTRIBUTES` (DACL restringida al SID del principal autorizado), `PIPE_REJECT_REMOTE_CLIENTS` ([Named Pipe Security](https://learn.microsoft.com/en-us/windows/win32/ipc/named-pipe-security-and-access-rights)) y token de sesión autenticado por mensaje/conexión.
- **Exclusión de arranques rivales, locks y recuperación tras caída abrupta:**
  - Lock exclusivo de instancia (`executor.lock`) adquirido atómicamente (`O_CREAT|O_EXCL` o lock de archivo del SO + registro durable `executor_leases` en SQLite con `executor_id`, `pid`, `start_time`, `ipc_endpoint`, `lease_epoch` monotónico y `heartbeat_at`).
  - **Protocolo de arranque bajo demanda y colisiones:** si dos clientes (p. ej. Antigravity y CLI simultáneos) detectan ausencia de ejecutor e intentan arrancarlo a la vez, ambos compiten por el lock atómico; el ganador inicializa el endpoint IPC e incrementa `lease_epoch`; el perdedor observa el lock, conecta como cliente al ganador y se retira sin escribir en BD.
  - **Recuperación tras muerte abrupta (`SIGKILL` / `TerminateProcess`):**
    1. Verificar identidad de dueño (PID + `start_time` del proceso, evitando reutilización de PID) y vigencia del heartbeat + prueba de conexión IPC (`ECONNREFUSED` / `ENOENT`).
    2. Solo tras confirmar que el dueño previo está muerto (y nunca por simple timeout corto mientras el proceso siga vivo), retirar el socket huérfano (POSIX) o recrear el Named Pipe (Windows), incrementar `lease_epoch` atómicamente y ejecutar la rutina de reconciliación:
       - Reconciliar publicaciones provisionales y staging de medios (**AR-27**, **AR-25**).
       - Marcar intentos en vuelo interrumpidos con estado de recuperación (re-encolar solo lecturas o acciones con idempotencia acreditada; mutaciones de efecto incierto → `INDETERMINATE` + reconciliación pendiente, **AR-47** / AV-04).
       - Liberar leases de tareas expiradas con nueva generación para que cualquier worker zombi sea rechazado por fencing (`lease_epoch < current`).
- **Doble carril, desconexión y reanudación entre agentes (`REQ-MEM-002.4`, `REQ-IA-001.4`):**
  - Al desconectarse Host A (o morir su árbol completo): el ejecutor **continúa drenando** la cola `DETERMINISTIC` elegible y autorizada dentro de su presupuesto, y **conserva** en estado `WAITING_REASONING` las tareas que requieren razonamiento nuevo.
  - Al conectarse Host B (otro agente o nueva conversación del mismo agente): consulta `qap_status` / `qap status`, recibe un `ContextSnapshot` compacto versionado (alcance, revisiones vigentes, progreso, bloqueos locales y cola `WAITING_REASONING` con IDs y `context_digest`), reclama un nuevo `lease_id`/`lease_epoch` y reanuda sin repetir onboarding ni re-descubrir vistas vigentes. Si el alcance fue revocado mientras tanto (**AR-47**), la reanudación se bloquea en fallo cerrado.
  - **Política de reposo:** tras drenar la cola determinista y sin clientes IPC activos, el ejecutor entra en modo `IDLE` y puede apagarse limpiamente tras un `idle_ttl_ms` configurable (conservando 100 % del estado en SQLite), reactivándose bajo demanda al siguiente comando MCP/CLI.

**4. Alternativas locales viables y riesgos residuales.**
- *Alternativa viable en entornos Windows/macOS/Linux donde el host confina hijos en Job Object sin `BREAKAWAY_OK` o cgroup restrictivo:* modo **supervisor externo administrado por el usuario** (`qap executor start` / servicio de usuario `systemd --user` en Linux, `launchd` LaunchAgent en macOS, Scheduled Task / servicio local en Windows). El adaptador MCP/CLI detecta el endpoint publicado por el supervisor y se conecta sin intentar *spawn* propio.
- *Alternativa viable para modo de confianza fuerte (**AR-28**):* ejecutar `qap-executor` bajo una cuenta de servicio/principal OS separada sin acceso de escritura desde el shell del HOST, usando el mismo protocolo IPC autenticado.
- *Riesgo residual:* si el operador mata manualmente el ejecutor o el equipo sufre corte eléctrico durante una mutación HTTP ya enviada al AUT, el efecto externo en el AUT queda fuera del alcance transaccional de SQLite; el protocolo de intención durable + estado `INDETERMINATE` impide duplicar ciegamente la escritura (coordinado con AV-04).

**5. Experimentos, criterios de aceptación y compuertas.**
- **Compuertas:** `E3` (G1/G4) y `E7` (G1/G5) en Windows, macOS y Linux; dependencia hacia **AV-02 (`AR-28`, `AR-47`)**, **AV-04 (`AR-10`)** y **AV-07 (`AR-33`)**.
- **Criterios verificables:**
  1. Con 2 lotes de observación y 10 casos deterministas listos, terminar forzosamente el árbol completo del host Stdio (PGID en POSIX; Job Object en Windows) en los 3 SO: el ejecutor sigue vivo (o el supervisor mantiene la instancia), completa los 10 casos deterministas y conserva intacta la cola de razonamiento.
  2. Matar el ejecutor (`SIGKILL`/`TerminateProcess`) en 3 puntos (cesión de lease, ejecución en vuelo, publicación provisional) y lanzar 2 clientes rivales concurrentes: 0 doble escritor, recuperación limpia de socket/pipe, 0 duplicación de mutaciones y 0 procesos de navegador huérfanos a los 5 s.
  3. Host B (distinto cliente/sesión) reclama la cola de razonamiento sin repetir onboarding; una propuesta rezagada de Host A con `lease_epoch` viejo es rechazada con `STALE_LEASE`.

---

### AR-45 · Localización propia de QAP, localización del AUT, preferencias regionales y replay determinista

**Requisitos afectados.** `REQ-QA-001`, `REQ-IA-001.1–001.2`, `REQ-REP-001.2`, `REQ-ORA-001.4` (y D17, AR-04).

**1. Evidencia existente verificada (`e2a7ee95`).**
- En `develop`, los mensajes de CLI y MCP están mezclados en literales españoles e ingleses en código fuente (p. ej. [`packages/cli/src/commands.ts:87`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/cli/src/commands.ts#L87), [`packages/mcp/src/handlers/discovery.handler.ts:384`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/mcp/src/handlers/discovery.handler.ts#L384)).
- El único uso de `Intl.DateTimeFormat` en `@qap/shared` fija `'en-US'` de forma estática ([`packages/shared/src/utils/date-utils.ts:31`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/shared/src/utils/date-utils.ts#L31)); el ordenamiento en múltiples módulos usa `.localeCompare()` sin locale explícito, lo cual hace depender el orden (y potencialmente hashes derivados si no se canonicalizan) del locale del sistema operativo del ejecutor.
- No existe catálogo de mensajes externalizado para reportes/CLI ni persistencia de `FrozenRegionalContext` (`locale`, `timezone`, `currency`, `calendar`) en planes o snapshots.

**2. Contraste con recomendaciones previas.**
- Consolida Neon (§6.H), Antigravity (`HA-04`, `C-01`) y el cierre de **AR-04** ([AV-01](../catalogo-requisitos.md#req-mem-0021)): separa estrictamente la localización propia de QAP de la localización del AUT bajo prueba, y ancla esta última en `FrozenRegionalContext`.
- **Corrección detectada en código:** los ordenamientos deterministas que alimentan digests, snapshots o comparativas **no deben usar `String.prototype.localeCompare()` sin locale**, sino ordenación lexicográfica binaria por code-point UTF-16/UTF-8 (RFC 8785) para garantizar hashes idénticos entre máquinas con distinto locale del SO.

**3. Propuesta de contrato técnico.**
- **Dos ejes ortogonales de localización (cierre técnico de D17):**
  1. **Localización propia de QAP (UI/CLI/Reportes):**
     - Todos los identificadores de protocolo, `functional_verdict`, `technical_status`, `cleanup_status`, `evidence_health`, `block_reason_code`, `error_code` y esquemas JSON/DTO son **códigos técnicos invariantes en inglés** independientes del idioma.
     - Las etiquetas de presentación de CLI y reportes HTML/Markdown se cargan desde catálogos locales versionados (paquetes JSON internos `es` y `en` incluidos en el lanzamiento, extensibles por archivo de catálogo con fallback determinista a `en` y registro de clave faltante).
     - El razonamiento y las explicaciones conversacionales al usuario siguen el idioma de la sesión en el HOST sin APIs de traducción propias ni externas (D17).
  2. **Localización del AUT bajo prueba (`FrozenRegionalContext` de AR-04):**
     - Dimensiones congeladas en el plan y en su digest (`plan_digest`): `ui_language` (BCP 47), `locale` (BCP 47), `timezone` (IANA, p. ej. `America/Mexico_City`), `currency` (ISO 4217) y `calendar` cuando aplique.
     - El runtime de Playwright aplica explícitamente `locale` y `timezoneId` al crear cada `BrowserContext` limpio, ejecuta acciones de cambio de idioma del AUT cuando el plan lo declare, y persiste las expectativas acreditadas (claves/textos esperados, formatos numéricos/monetarios/fecha y reglas de truncamiento) vinculadas a ese `FrozenRegionalContext`.
     - **Aislamiento y autoridad (AR-04):** `FrozenRegionalContext` **no** amplía permisos ni reemplaza `ScopeIdentity`/`ProfileBinding`; si una región altera reglas fiscales o permisos de negocio, se refleja en `config_rev` o `ScopeIdentity` acreditados. Si el AUT impide fijar la región solicitada, el runtime congela la observada y emite abstención (`INDETERMINATE`) al divergir.
     - **Replay determinista (`REQ-IA-001.2` / `REQ-QA-001`):** repetir un snapshot regional valida textos, claves, truncamientos, fechas, decimales y monedas con aritmética decimal exacta (coordinado con AV-04/AV-05) y **0 llamadas de inferencia**.

**4. Alternativas locales viables y riesgos residuales.**
- *Alternativa viable:* cuando el AUT carece de selector de idioma en UI y determina el locale únicamente por cabecera `Accept-Language` o perfil de usuario, QAP configura `locale`/`Accept-Language` en `BrowserContext` y valida la señal efectiva reportada por el AUT (atributo `lang`, formato observado o endpoint de perfil), bloqueando o absteniéndose si no coincide.
- *Riesgo residual:* las pruebas de truncamiento y desbordamiento visual dependen de las fuentes instaladas en el SO (coordinado con AV-06 / `M5`) y de disponer de un oráculo adecuado; además, la evaluación lingüística cualitativa (naturalidad de traducción) sigue dependiendo del HOST.

**5. Experimentos, criterios de aceptación y compuertas.**
- **Compuertas:** `E4` (G2/G4), `E5` (G3/G5) y `E7` (G1/G5); dependencia saliente hacia **AV-05** (reportes PDF/Excel regionales) y **AV-06** (navegadores y fuentes).
- **Criterios verificables:**
  1. Ejecutar el mismo caso en dos locales distintos del corpus (p. ej. `es-MX` con `America/Mexico_City`/`MXN` y `en-US` con `UTC`/`USD`, más un tercer locale no-ES/EN en pruebas de extensibilidad): los códigos de estado, veredictos y `cli_exit_code` son **100 % idénticos**, mientras textos/fechas/monedas se evalúan contra su `FrozenRegionalContext` congelado sin colisiones.
  2. El replay del snapshot regional completa con **0 llamadas de inferencia** y detecta traducciones faltantes y truncamientos sembrados.
  3. Ejecutar la misma corrida en dos máquinas con distinto locale del SO produce el mismo `plan_digest` y el mismo `result_digest`.

---

### AR-46 · Memoria longitudinal, procedencia, aprendizaje no normativo, selección incremental y reparación acotada

**Requisitos afectados.** `REQ-MEM-003.1–003.5`, `REQ-REG-001.1–001.3`, `REQ-CAS-001.3–001.5` (y D05, AR-40).

**1. Evidencia existente verificada (`e2a7ee95`).**
- En `develop`, existen primitivas útiles pero **desconectadas de la ruta productiva**:
  - [`ImpactAnalyzer`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/knowledge/src/impact/impact-analyzer.ts) tiene **0 consumidores** en `@qap/mcp` y `@hyouka73/qap-cli`.
  - [`HistoryManager.recordExecution()`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/knowledge/src/history/history-manager.ts#L72) no es invocado tras ejecuciones reales (solo usado en [`packages/cli/src/commands/prune.ts:170,356`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/cli/src/commands/prune.ts#L170) para limpiar `.jsonl`).
  - [`UpdateGuard`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/knowledge/src/plan/update-guard.ts#L11-L70) protege ediciones manuales en CLI (`plan.ts:136`, `update.ts:97`), pero no transiciona casos a `pending_review` ante drift ni opera de forma uniforme en el núcleo.
  - `scoped-rule-resolver.ts:968-992` detecta contradicciones entre reglas de igual autoridad, pero no existe tabla/flujo unificado para contradicciones observación↔regla, ni detección de `flakiness`, ni flujo de reparación `TestCaseRevision N+1`, ni exportación/importación portable versionada del conocimiento (`REQ-MEM-003.4`).
  - `GitAdapter` solo se usa en CLI con `execSync` inseguro (remediación obligatoria de G0 en **AR-40**).

**2. Contraste con recomendaciones previas.**
- Coincide con Neon (§2.3, §10.2) y Antigravity (§7–§8) en rescatar los algoritmos puros de `@qap/knowledge` (`dependency-graph`, `cycle-detector`, `semantic-hasher`, `update-guard`, `prerequisite-evaluator`) e integrarlos al núcleo.
- **Precisión clave de AV-03:** no basta con listar capacidades de memoria; se exige una **regla epistémica dura de aprendizaje no normativo** (ninguna observación, latencia, firma de fallo ni reparación de localizador puede modificar jamás una regla de negocio o expectativa acreditada) y **prueba longitudinal** con snapshot previo, cambio acotado y verificación de inferencia evitada.

**3. Propuesta de contrato técnico.**
- **Separación epistémica y procedencia (`REQ-MEM-001.1–001.4`, `REQ-MEM-003.1`):**
  - Toda entidad en `IQapRepository` pertenece obligatoriamente a uno de 4 planos (`OBSERVATION`, `INFERENCE`, `ACCREDITED_REQUIREMENT`, `EXECUTION_RESULT`) con `revision` inmutable (append-only), `provenance` (fuente, localizador, hash, actor, timestamp) y `ScopeIdentity`.
  - Contradicciones tipadas (`equal_authority_rule_conflict`, `observation_vs_rule_conflict`, `document_vs_observation_gap`) se persisten en registro único con estado (`OPEN`, `RESOLVED`, `WAIVED`) y **bloquean el oráculo afectado** mientras permanezcan abiertas.
  - Ediciones manuales protegidas (`manually_edited`) jamás se sobrescriben silenciosamente; ante drift incompatible pasan a `PENDING_REVIEW` conservando contenido y linaje previo.
- **Pipeline post-ejecución de aprendizaje no normativo (`REQ-MEM-003.3`, `REQ-REG-001.2`):**
  - Tras cada intento confirmado y atestado, `@qap/core` actualiza de forma determinista el almacén de telemetría histórica (plano `EXECUTION_RESULT` / evaluación):
    - `failure_signature` normalizada (tipo de fallo, paso, código técnico, huella de oráculo — sin secretos).
    - Estadísticas de latencia por paso/vista y **analizador de `flakiness`** sobre intentos del mismo `(plan_digest, product_version, config_rev)`: detecta oscilaciones `PASS`/`FAIL` con tamaño de muestra mínimo declarado, etiqueta el caso como `FLAKY_OBSERVED` sin ocultar los `FAIL` ni convertirlos en `PASS`.
    - **Invariante:** el pipeline post-ejecución tiene permisos de solo lectura sobre `ACCREDITED_REQUIREMENT` y sobre expectativas de casos.
- **Detección de drift multi-señal y selección incremental (`REQ-MEM-003.2`, `REQ-REG-001.1`):**
  - Señales de entrada: (1) diff Git seguro vía **AR-40** (si Git no está disponible, reportar explícitamente `git_signal_unavailable` y aplicar selección conservadora, nunca asumir cero cambios), (2) cambios de esquema OpenAPI/API, (3) cambios de `config_rev`/`product_version` y (4) cambios de `semantic_hash` de vistas/reglas.
  - `ImpactAnalyzer` conectado al grafo de dependencias propaga `stale` únicamente a revisiones y casos dependientes, produciendo un conjunto seleccionado con **razón explícita por caso** (`selected_reason` / `skipped_reason`). Los casos vigentes no afectados se re-ejecutan en modo `DETERMINISTIC` o se omiten según política de regresión, con **0 llamadas de inferencia**.
- **Reparación acotada de localizadores (`REQ-REG-001.3`, `REQ-CAS-001.3–001.5`):**
  - Separación estricta entre `TestCaseIdentity`, `ExpectationRevision` (oráculo/regla acreditada) y `AdapterRevision` (pasos/localizadores UI).
  - Ante cambio de UI (p. ej. selector renombrado con misma semántica), el flujo de reparación crea **`TestCaseRevision N+1`** actualizando únicamente `AdapterRevision`, **preservando inmutables** tanto `ExpectationRevision` (mismo digest de expectativa) como el intento `FAIL` original de la revisión `N` y su defecto/retest vinculado.
  - Si el cambio afecta la expectativa de negocio (regla cambiada), se prohíbe la reparación automática de localizador y se exige revisión de requisito/oráculo con fuente acreditada.
- **Portabilidad sanitizada (`REQ-MEM-003.4`):**
  - Exportación/importación en paquete versionado con manifiesto SHA-256, reimportación idempotente por `(ScopeIdentity, entity_id, revision)` y filtro estricto que **excluye** `ProfileBinding`, sesiones, credenciales, grants activos y media privada no autorizada (**AR-07**, **AR-32**).

**4. Alternativas locales viables y riesgos residuales.**
- *Alternativa viable sin repositorio Git accesible (p. ej. QA caja negra sobre binario/URL remota):* la selección incremental opera sobre señales de `semantic_hash` de Discovery, cambios en documentación ingerida (D10), cambios en OpenAPI/UTCP y `config_rev`, manteniendo trazabilidad completa de por qué se seleccionó cada caso.
- *Riesgo residual:* un selector reparado incorrectamente podría apuntar a un control visualmente similar pero funcionalmente distinto; se mitiga exigiendo verificación con testigo acreditado (AV-04) y prohibiendo alterar la expectativa original.

**5. Experimentos, criterios de aceptación y compuertas.**
- **Compuertas:** `E2` (G1/G5), `E4` (G2/G4) y `E5` (G3/G5); dependencia hacia **AV-02 (`AR-40`)**, **AV-04 (`AR-08`)** y **AV-07 (`AR-54`)**.
- **Criterios verificables (prueba longitudinal obligatoria):**
  1. Partir de un snapshot acreditado `S1` (múltiples módulos); introducir un cambio acotado (1 selector UI en módulo A + 1 regla de negocio en módulo B; módulo C intacto).
  2. La corrida de regresión selecciona A y B con razones trazables, **no** re-descubre ni re-infiere C (`inference_calls = 0` en casos vigentes no afectados), marca la edición manual afectada como `PENDING_REVIEW` y conserva intactos los casos de C.
  3. La reparación del selector en A crea `Revision N+1` con idéntico `expectation_digest` y preserva intacto el intento `FAIL` de `Revision N` para comparativa y retest.
  4. Al alternar `PASS`/`FAIL` sobre el mismo snapshot/versión, el analizador registra `flakiness` con conteo de muestras sin ocultar el `FAIL`.
  5. Round-trip export→import reproduce 100 % de entidades, revisiones y hashes con **0 secretos/sesiones/grants activos** exportados.

---

### AR-52 · Delegación única MCP/CLI/CI al núcleo, paridad de controles y códigos deterministas

**Requisitos afectados.** `REQ-INT-001.1`, `REQ-AGT-001`, `REQ-CAM-001.4`, `REQ-SEG-001.1` (y D13, D20, AR-07, AR-14, AR-28, AR-47).

**1. Evidencia existente verificada (`e2a7ee95`).**
- **Divergencia estructural severa confirmada en `develop`:**
  - [`packages/cli/src/commands/test.ts:135-230`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/cli/src/commands/test.ts#L135-L230) instancia `PlaywrightRunner` directamente, opera sobre `process.cwd()` sin validar alcance ni políticas `deny-by-default`, reintenta casos fallidos sin reconciliación de efectos, escribe directo a `.qa/` y emite `overallResult = 'passed'` con `exitCode = 0` cuando `failed === 0` (incluso si todos los casos fueron `not_run` o selección vacía).
  - [`packages/cli/src/commands/report.ts:93-183`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/cli/src/commands/report.ts#L93-L183) genera reportes leyendo JSON sin verificar digest ni origen canónico (`REQ-IA-001.5`).
  - [`packages/cli/src/commands/prune.ts:198-420`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/cli/src/commands/prune.ts#L198-L420) poda `.qa/executions/` y `qap.sqlite`, mientras [`packages/mcp/src/server.ts:4303-4350`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/mcp/src/server.ts#L4303-L4350) implementa un `qap_prune` distinto con `dryRun` ficticio (ceros fijos).
  - [`packages/cli/src/errors.ts:19-29`](https://github.com/Hyouka73/QAMCP/blob/e2a7ee95b56eceed0249bb2b5393334fa2e53196/packages/cli/src/errors.ts#L19-L29) usa `ExitCode.USAGE = 2`, colisionando con el código `2` (`ERROR` de ejecución/limpieza) propuesto en `O-05` (Hallazgo `H-AV03-05`).

**2. Contraste con recomendaciones previas.**
- Ratifica la arquitectura hexagonal de autoridad única (Neon §6.A/E, Antigravity `O-05` y §7): MCP, CLI y CI son **adaptadores delgados** que invocan los mismos casos de uso del ejecutor soberano (`@qap/core`) vía IPC local autenticado.
- **Corrección obligatoria a la tabla de códigos de salida (`H-AV03-05`):** se resuelve la colisión entre `O-05` y `errors.ts` reservando `0–5` estrictamente para resultados de ejecución/campaña (idénticos en `cli_exit_code` de MCP y código de proceso CLI/CI) y `64–78` (`sysexits.h`) para errores de invocación/entorno CLI previos a admitir una campaña (`64 = EX_USAGE`, `65 = EX_DATAERR`, `66 = EX_NOINPUT`, `69 = EX_UNAVAILABLE`, `78 = EX_CONFIG`).

**3. Propuesta de contrato técnico.**
- **Frontera única de delegación:**
  - Prohibido que `@qap/mcp` o `@hyouka73/qap-cli` importen `@qap/playwright-runner`, `node:sqlite`, `FileSystemStorage` mutable ni ejecuten políticas propias.
  - Todo comando operativo (`start`, `status`, `discover`, `plan`, `test`, `report`, `prune`, `auth`, `context`) se traduce a un DTO tipado y se despacha por IPC autenticado al ejecutor soberano (`@qap/core`).
  - Los comandos puramente diagnósticos o de instalación (`qap doctor`, `qap setup`, `qap host register`) operan sin crear rutas paralelas de autoridad de ejecución ni de escritura a `IQapRepository`.
- **Paridad estricta de seguridad, credenciales y revocación (AR-07, AR-14, AR-28, AR-47):**
  - Credenciales y KEKs **siempre fuera de canal**: rechazadas en MCP (`allowScopedCredentials` eliminado), rechazadas en `argv` de CLI, y en CI recibidas únicamente mediante descriptor heredado o archivo/volumen de secretos del runner con ACL (`AR-07` / `EXP-07`).
  - Intentos de bypass (invocar `qap test` sin política, con alcance ambiguo, sesión revocada o intento manipulado) devuelven el **mismo rechazo** y la misma razón tipada en MCP, CLI y CI.
- **Tabla unificada de agregación y códigos de salida deterministas (paridad MCP/CLI/CI):**

| Condición agregada (función pura única en `@qap/core`) | `campaign_outcome` (MCP/CLI JSON) | `cli_exit_code` | Notas de paridad |
|---|---|---:|---|
| ≥1 caso con `evidence_health = TAMPERED` o fallo de atestación (**AR-28**) | `INTEGRITY_ERROR` | `5` | Nunca `0`; invalida acreditación en ambos canales |
| ≥1 caso con `functional_verdict = FAIL` | `FAILED` | `1` | Prioridad sobre `ERROR`/`INDETERMINATE`/`BLOCKED`/`PASS` |
| 0 `FAIL`, ≥1 caso con `ERROR` o `cleanup_status = CLEANUP_FAILED` | `ERROR` | `2` | Fallo técnico o residuo crítico de limpieza |
| 0 `FAIL`/`ERROR`, ≥1 caso con `INDETERMINATE` o `BLOCKED` | `INCOMPLETE_OR_BLOCKED` | `3` | Impide reportar éxito ante incertidumbre o bloqueos |
| 0 casos ejecutados efectivos (selección vacía o 100 % `SKIPPED`) | `NO_ELIGIBLE_CASES` | `4` | Elimina el falso `passed` / `exitCode = 0` del CLI actual |
| ≥1 caso ejecutado, 100 % `PASS` sin fallos de limpieza/integridad | `PASSED` *(con `passed_functional` y `passed_structural`)* | `0` | Si `passed_functional = 0`, marca `structural_only: true` |
| Error de invocación/sintaxis/entorno CLI previo a campaña | `CLI_INVOCATION_ERROR` | `64–78` | `64=USAGE`, `65=DATA`, `66=NOINPUT`, `69=UNAVAILABLE`, `78=CONFIG` (sin colisión con `2`) |

- **Operación CI no interactiva (sin TTY):**
  - CLI soporta `--json` (salida determinista en `stdout`, diagnósticos únicamente en `stderr`) y `--non-interactive` (fallo cerrado inmediato con código explícito si se requiere interacción humana o credencial ausente; cero prompts bloqueados esperando TTY).

**4. Alternativas locales viables y riesgos residuales.**
- *Alternativa viable en CI efímero (contenedor/job de una sola corrida):* modo `qap --ephemeral-executor` que levanta un `qap-executor` dedicado al job sobre el mismo protocolo IPC/contrato de `@qap/core`, ejecuta en `DETERMINISTIC`, emite artefactos/reporte y apaga limpiamente el ejecutor al terminar el job, sin crear una segunda ruta de código ni autoridad paralela.
- *Riesgo residual:* scripts de usuario existentes que dependan de comandos CLI legados sobre `.qa/` o del código `2` para errores de uso requerirán aviso de compatibilidad y migración guiada (coordinado con AV-07 / `AR-54`).

**5. Experimentos, criterios de aceptación y compuertas.**
- **Compuertas:** `E1` (G0/G1) y `E7` (G1/G5); dependencia hacia **AV-02 (`AR-07`, `AR-14`, `AR-28`, `AR-47`)**, **AV-04 (`AR-08`, `AR-09`, `AR-10`)** y **AV-07 (`AR-19`, `AR-54`)**.
- **Criterios verificables (fixture transversal E7):**
  1. Sobre el mismo snapshot congelado y fixture restaurable, ejecutar por MCP, CLI interactivo y CLI CI (`--json --non-interactive`): 100 % identidad en permisos evaluados, IDs lógicos, estado persistido, 6 veredictos, `cleanup_status`, `evidence_health`, reporte y `cli_exit_code` (`0–5`).
  2. Incluir casos negativos obligatorios: selección vacía (`4`), resultado mixto (`1`/`2`/`3`), intento alterado 1 byte (`5`), ejecución purgada (`EXPIRED_PRUNED` sin alterar veredicto), credencial en argumentos MCP/CLI (rechazada) y revocación en vuelo (bloqueada en ambos canales).
  3. Verificación estática de grafo de dependencias (`E1`): 0 imports directos de `@qap/playwright-runner` o `node:sqlite` desde `@qap/mcp` o `@hyouka73/qap-cli`.

---

## 3. Verificación de `EXP-01a` y `EXP-01b` y compuertas

Se verifica y ratifica la división de `EXP-01` en dos experimentos con compuertas diferenciadas (corrigiendo la ubicación tardía inicial de Neon y manteniendo la prohibición de ejecutarlos en esta ronda documental):

| Experimento | Momento y compuerta que condiciona | Qué valida exactamente | Criterios verificables de aceptación (salida) | Qué bloquea si falla |
|---|---|---|---|---|
| **`EXP-01a` · Protocolo, arranque y compatibilidad de 4 hosts** | **G0** (antes de elegir SDK MCP y congelar el adaptador Stdio para **G1**) | 1. Era y versión real negociada (`2025-11-25` vs. `2026-07-28`) en **Antigravity, Codex, Claude Code y Gemini CLI** (versiones exactas registradas).<br>2. Comportamiento de `serveStdio` (SDK v2) vs. SDK v1 ante *sibling process probe* y arranque *lazy* del ejecutor.<br>3. Cierre Stdio (`stdin` EOF / `SIGTERM`) sin matar el ejecutor ni dejar procesos huérfanos.<br>4. Cero uso de `elicitation/create` en el ciclo ordinario y compatibilidad de nombres/esquemas JSON (`mcp_<alias>_<tool>`). | • 100 % handshake y llamadas válidas (`tools/list`, `tools/call`) en los 4 hosts con registro único.<br>• **0 arranques rivales o efectos duplicados** del ejecutor durante sondeo/handshake.<br>• **0 pérdida de tareas deterministas** al cerrar el cliente Stdio.<br>• Matriz versionada publicada: `(host, versión_host, SO, era_MCP, SDK_elegido)`. | Bloquea **congelar elección de SDK MCP** y **cerrar el contrato de transporte Stdio de G1**. No bloquea trabajo independiente de persistencia o seguridad en G0. |
| **`EXP-01b` · Adopción, continuidad y ahorro medible de tokens** | **G4** (integración con `@qap/core`, ejecutor soberano y Skill/hooks listos; repetible en **G5** sobre paquete instalado) | 1. Sesiones limpias en los 4 hosts (muestra ≥10 tareas QA funcionales + ≥5 tareas unitarias/desarrollo legítimas por host) comparando 3 brazos: (a) solo MCP, (b) MCP + Skill canónica breve, (c) MCP + Skill + hook informativo opt-in.<br>2. Reanudación cruzada entre hosts (iniciar en Host A, cortar, continuar en Host B vía `ContextSnapshot`).<br>3. Medición reproducible de tokens (entrada/salida) con el tokenizer/telemetría oficial de cada host frente a línea base sin Skill/snapshot compacto. | • Tasa de primera acción QA hacia QAP documentada por host y brazo (objetivo candidato ≥90 % con Skill, sujeto a ratificación en DE-03 / AV-08).<br>• **0 % bloqueos o interferencias** en las ≥5 suites unitarias/herramientas legítimas por host.<br>• **100 % reanudación multi-host** sin repetir onboarding.<br>• Informe empírico de ahorro de tokens con metodología y versiones fijadas (sin prometer comportamiento no medido de agentes futuros). | Bloquea **declarar cobertura de adopción D13** en G4/G5 y **promover a E8/G6**; si un host falla adopción espontánea, se documenta límite real y alternativa CLI sin ocultar desviaciones. |

---

## 4. Bloqueantes pendientes, dependencias y frontera de decisiones

### Bloqueantes que permanecen abiertos tras AV-03 (sin cierre definitivo)
1. **Contravalidación independiente de AV-03 por Codex** y **decisión del Orquestador** sobre este informe.
2. **Validación experimental pendiente de los 8 registros** (`EXP-01a` en G0; `E1/E2/E3/E7` en G1; `EXP-01b`, `E4/E5` en G2–G5).
3. **Dependencia crítica `AR-23` (AV-07) + `H-AV03-01`:** cerrar selección de driver SQLite (`node:sqlite` con piso **Node ≥ 22.16.0** / 24 LTS vs. `better-sqlite3` con FTS5 empaquetado), licencias y estrategia de empaquetado `npx` (`HA-02`).
4. **Dependencias de AV-02 aún en validación experimental:** `EXP-07` (`AR-07`), identidad/egress por destino (`AR-14`, `AR-31`), frontera de principal OS (`AR-28`), revocación multiproceso (`AR-47`), remediación Git G0 (`AR-40`) y compuertas de captura (`AR-27` / `EXP-06a/c`).
5. **Decisiones empresariales abiertas del propietario (`DE-01`–`DE-05`):** en lo que toca a AV-03, `DE-03` (ratificación del umbral objetivo de adopción en `EXP-01b` y métricas E8) y `DE-01` (retención/cuotas que interactúan con `AR-12`/`AR-25`/`AR-52`).

### Transferencia de dependencias hacia auditorías siguientes
- **Hacia AV-04 (`AR-08–10`, `AR-43`, `AR-53`):** consume el ejecutor soberano (`AR-42`), el protocolo de elegibilidad y bloqueo local (`AR-05`), la taxonomía/agregación unificada (`AR-52`) y el registro de intención durable para mutaciones inciertas y reconciliación.
- **Hacia AV-05 (`AR-13`, `AR-17–18`, `AR-20`, `AR-22`, `AR-38`, `AR-48`, `AR-50`):** consume `FrozenRegionalContext` (`AR-45`), la separación epistémica y contradicciones (`AR-46`) y el modelo de puertos de `IQapRepository` (`AR-12`).
- **Hacia AV-06 (`AR-16`, `AR-29`, `AR-36–37`, `AR-39`, `AR-49`):** consume la propiedad de procesos de navegador/staging en `qap-executor` (`AR-42`), el presupuesto de campaña (`AR-05`) y la compresión estructural medida en `EXP-01b`/`EXP-02` (`AR-15`).
- **Hacia AV-07 (`AR-19`, `AR-21`, `AR-23`, `AR-26`, `AR-33–34`, `AR-41`, `AR-51`, `AR-54`, `AR-57`):** recibe `H-AV03-01` (`Node >= 22.16.0` para `node:sqlite` + FTS5 vs. `better-sqlite3`), la estrategia de supervisor/lanzador multiplataforma (`AR-42`), el retiro de escritores legacy (`AR-12`/`AR-52`) y la migración de recibos y conocimiento (`AR-05`/`AR-46`).
- **Hacia AV-08 (`AR-06`, `AR-30`, `AR-35`, `AR-44`):** recibe los protocolos `EXP-01a/b` (`AR-15`), los criterios longitudinales (`AR-46`) y la matriz de paridad `E7` (`AR-52`) para aceptación de producto.
