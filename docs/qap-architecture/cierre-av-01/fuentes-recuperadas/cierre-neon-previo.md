# QAP — Cierre de Requisitos y Decisiones Arquitectónicas

**Rol:** Gemini Neon, Investigador Principal de QAP  
**Repositorio:** `Hyouka73/QAMCP`  
**Rama única analizada:** `develop`  
**SHA de referencia verificado:** `77a9c4f3769784df40a17d5d19bd7c83a45f0c89`  
**Naturaleza de la entrega:** Análisis documental y de código en modo solo lectura. No modifica código, documentos ni GitHub, ni constituye autorización para implementar.

---

## 1. Catálogo consolidado de requisitos (IDs, procedencia y clasificación)

### 1.1 Dictamen sobre la consolidación (82 originales vs. 6 propuestas nuevas)

No corresponde aceptar automáticamente **88 requisitos**. Al auditar las **6 propuestas nuevas** de `docs/qap-architecture/insumos/evaluacion-independiente-requisitos.md` y las propuestas previas de `gemini-neon-investigacion.md` contra los **82 IDs originales** de `gemini-neon-etapa-3.md` y las tareas `M1–M5` de `plan-maestro.md`:

| Propuesta evaluada | Procedencia | Dictamen | Justificación |
|---|---|---|---|
| `REQ-AGT-001` (Adopción por host: registro MCP, Skill acotada, hooks informativos opt-in) | Investigación Neon + Evaluación Codex | **Nuevo** | Ninguno de los 82 IDs cubría empaquetado de adopción por host ni medición de enrutamiento en frío sin bloquear suites unitarias. |
| `REQ-UTCP-001` (Invocación de `DataPlan` vía UTCP/OpenAPI sobre puerto común) | Investigación Neon + Evaluación Codex | **Ampliación de existente** (`REQ-DAT-001.2` + `REQ-INT-001.4`) | Operacionaliza el protocolo de ejecución del `DataPlan` y el puerto de conectores ya exigidos. Mantenerlo como ID independiente duplicaría requisitos de idempotencia, reconciliación y bóveda (`REQ-DAT-001.2`, `REQ-RUN-001.4`, `REQ-SEG-002.1`). Se consolida como ampliación trazable `REQ-DAT-001.2 [ext. UTCP/OpenAPI]`. |
| `REQ-XINST-001` (Lectura cross-instancia estrictamente read-only) | Investigación Neon + Evaluación Codex | **Nuevo** | Introduce una frontera nueva: consulta a una instancia de referencia con origen e identidad de lectura separados e imposibilidad física/política de mutación (incluidos GET mutativos y redirecciones). |
| `REQ-QA-001` (Internacionalización y localización) | Investigación Neon + Evaluación Codex | **Nuevo** | Los 82 IDs cubrían aritmética decimal (`REQ-ORA-001.4`) y `visual_variant` (`REQ-MEM-002.1`), pero no congelación de `locale`/idioma/zona horaria/moneda ni detección de claves sin traducir o truncamiento. |
| `REQ-QA-002` (Validación de contrato API) | Investigación Neon + Evaluación Codex | **Nuevo** | `REQ-DIS-001.4` solo observa tráfico pasivo; ningún ID original validaba esquemas OpenAPI/JSON Schema, códigos y `Content-Type` como oráculo separado del efecto persistido. |
| `REQ-QA-003` (Accesibilidad automatizada `axe-core` sobre AUT) | Evaluación Codex (escindido de `REQ-QA-002` de Neon) | **Nuevo** (P1) | `M1` cubre accesibilidad del visor de QAP; ningún ID original cubría auditoría WCAG automatizada sobre estados críticos del AUT con huella reproducible y reporte de controles manuales pendientes. |
| `REQ-AGT-002`, `REQ-ONB-001`, `REQ-OPT-001`, `REQ-OPT-002`, `REQ-E2E-001` | Investigación Neon (reclasificadas en Evaluación Codex) | **Ampliaciones / Duplicidades absorbidas** | Amplían respectivamente `REQ-MEM-002.4`/`IA-001.1`, `REQ-INT-001.2`, `REQ-RUN-001.1`/`1.5`, `REQ-MEM-003.5`/`DIS-001.3` y `REQ-PLN-001.4`/`RUN-001.1`/`CAM-001.2`. |
| `M1–M5` (Visor local sin CDN, export `file://`, WebM protegido desde primer paint, HTTP Range `206`/`416`, verificación en navegador real) | Plan maestro consolidado | **Ampliaciones obligatorias** | Precisan los contratos verificables de `REQ-REP-001.1`, `REQ-REP-001.2` y `REQ-SEG-002.1`. |

**Resultado real consolidado:** **87 requisitos técnicos** (**82 originales** + **5 genuinamente nuevos**), más un conjunto explícito de **Políticas Operativas y de Gobernanza (POL)** que estaban mezcladas con requisitos funcionales y que deben ratificarse por separado.

---

### 1.2 Requisitos Funcionales (RF — 57 IDs)

| ID | Procedencia | Tipo | Resumen consolidado y ampliaciones absorbidas | Estado en `develop` (`77a9c4f`) | Prioridad |
|---|---|---|---|---|---|
| `REQ-MEM-001.1` | Base 82 | RF | Cuatro planos epistémicos obligatorios en almacén canónico único. | Parcial | P0 |
| `REQ-MEM-001.3` | Base 82 | RF | Versionado inmutable de entidades de conocimiento y casos (CAS sobre punteros vigentes). | Parcial | P0 |
| `REQ-MEM-001.4` | Base 82 | RF | Protección de ediciones manuales con transición a `pending_review` ante drift. | Parcial | P0 |
| `REQ-MEM-002.1` | Base 82 | RF | Vector de alcance completo `(project, app, instance, env, tenant, role, version, visual_variant, config_rev, locale)`. | Incompatible | P0 |
| `REQ-MEM-002.3` | Base 82 | RF | Persistencia unificada de campaña, frontera, cola determinista y cola de razonamiento. | Parcial | P0 |
| `REQ-MEM-002.4` | Base 82 + ext. `AGT-002` | RF | Servicio de *Context Brief* / snapshot compacto derivado de estado durable para re-hidratar chats/hosts sin repetir onboarding ni Discovery vigente. | Parcial | P0 |
| `REQ-MEM-003.1` | Base 82 | RF | Registro unificado de contradicciones (regla↔regla, regla↔observación) con bloqueo de oráculo. | Parcial | P0 |
| `REQ-MEM-003.2` | Base 82 | RF | Propagación activa de `stale` e invalidación por grafo de dependencias ante drift. | Parcial | P0 |
| `REQ-MEM-003.3` | Base 82 | RF | Pipeline post-ejecución hacia memoria: latencias, firmas de fallo y flakiness sin mutar requisitos. | Ausente | P1 |
| `REQ-MEM-003.4` | Base 82 | RF | Exportación/importación portable versionada de conocimiento con reimportación idempotente y exclusión total de secretos/sesiones/grants. | Ausente | P1 |
| `REQ-DIS-001.1` | Base 82 | RF | Discovery autónomo por lotes encadenados hasta `READY` o presupuesto agotado. | Parcial | P0 |
| `REQ-DIS-001.2` | Base 82 | RF | Modelo uniforme de frontera y cobertura (`visited`, `candidate`, `blocked`, `out_of_scope`; `READY`/`PARTIAL_READY`/`BLOCKED`). | Parcial | P0 |
| `REQ-DIS-001.3` | Base 82 + ext. `OPT-002` | RF | Extractor SPA profundo (identidad de vista por estado observable, ARIA/labels reales, `<table>`, filtros, paginación, formularios, modales, iframes) con serialización compacta acotada en tokens. | Incompatible | P0 |
| `REQ-DIS-001.4` | Base 82 | RF | Observación pasiva de lecturas `fetch`/XHR autorizadas del mismo origen para hidratación SPA y correlación vista↔API. | Ausente | P0 |
| `REQ-DIS-001.5` | Base 82 | RF | Matriz diferencial de visibilidad por rol, tenant y configuración efectiva. | Parcial | P1 |
| `REQ-DIS-001.6` | Base 82 | RF | Grafo dual explícito: aristas de navegación vs. dependencias de negocio acreditadas. | Parcial | P0 |
| `REQ-DIS-001.7` | Base 82 | RF | Checkpoints reanudables por alcance para todo Discovery y refresco incremental por delta. | Parcial | P0 |
| `REQ-DIS-001.8` | Base 82 | RF | Ejecución de lotes de Discovery desacoplada en el ejecutor soberano (sobrevive a desconexión del host). | Ausente | P0 |
| `REQ-DOC-001.1` | Base 82 + ext. Docs | RF | Ingesta documental estructurada por adaptadores de formato con fuente, versión y localizador (sección/página). | Parcial | P0 (MD/OpenAPI) / P1 (PDF/DOCX según DP-08) |
| `REQ-DOC-001.2` | Base 82 | RF | Registro explícito de cobertura de extracción y brechas (tablas/secciones no legibles). | Ausente | P0 |
| `REQ-DOC-001.3` | Base 82 | RF | Reconciliación bidireccional documento↔observación en 4 estados exactos. | Parcial | P0 |
| `REQ-IA-001.1` | Base 82 | RF | Modo `HOST`: consumo de razonamiento del cliente conectado vía contratos estructurados de propuesta. | Parcial | P0 |
| `REQ-IA-001.2` | Base 82 | RF | Modo `DETERMINISTIC`: compilación y ejecución de snapshots congelados con 0 llamadas a LLM por paso. | Parcial | P0 |
| `REQ-IA-001.3` | Base 82 | RF | Validador único de propuestas estructuradas (vinculadas a host, tarea, cesión, epoch, digest de contexto y revisiones). | Parcial | P0 |
| `REQ-IA-001.4` | Base 82 | RF | Doble carril persistente (cola determinista vs. cola de razonamiento) y handoff multi-host A→B. | Ausente | P0 |
| `REQ-IA-001.6` | Base 82 | RF | Puerto opcional `IReasoningProvider` para modo `MANAGED` (diferible según DP-06). | Ausente | P2 / según DP-06 |
| `REQ-PLN-001.1` | Base 82 + ext. `E2E-001` | RF | Modelo unificado de 4 entidades: `CampaignPlan`, `ExecutionPlan`, `DataPlan`, `TestCase`. | Incompatible | P0 |
| `REQ-PLN-001.2` | Base 82 | RF | Planificación incremental sobre vistas acreditadas a partir de `PARTIAL_READY`. | Parcial | P0 |
| `REQ-PLN-001.3` | Base 82 | RF | Priorización por riesgo (criticidad, drift, historial de defectos, presupuesto). | Ausente | P1 |
| `REQ-PLN-001.4` | Base 82 + ext. `E2E-001` | RF | Resolvedor DAG unificado multi-caso y multi-módulo (≥3 módulos, ≥2 roles, transferencia tipada de variables, detección/bloqueo de ciclos). | Incompatible | P0 |
| `REQ-PLN-001.5` | Base 82 | RF | Congelamiento inmutable de `ExecutionPlan` (revisiones, `DataPlan`, locale, política y hash) revalidado antes de despachar. | Parcial | P0 |
| `REQ-PLN-001.6` | Base 82 | RF | Replanificación dinámica como nueva revisión ante fallos de prerrequisitos o hallazgos, preservando intentos previos. | Ausente | P0 |
| `REQ-CAS-001.2` | Base 82 | RF | Generación multi-técnica (positivos, negativos, BVA, estados, RBAC, cálculos) enlazada a oráculos acreditados. | Incompatible | P0 |
| `REQ-CAS-001.3` | Base 82 | RF | Separación explícita `TestCaseIdentity` (funcional) vs. `TestCaseRevision` (ejecutable + adaptador UI/variante). | Parcial | P0 |
| `REQ-CAS-001.4` | Base 82 | RF | Evaluación automática de aplicabilidad de casos por `(env, tenant, role, config_rev)`. | Parcial | P0 |
| `REQ-CAS-001.5` | Base 82 | RF | Deduplicación semántica/estructural y marcado automático de obsolescencia ante drift. | Parcial | P0 |
| `REQ-ORA-001.1` | Base 82 | RF | Taxonomía única de 6 veredictos (`PASS`, `FAIL`, `INDETERMINATE`, `BLOCKED`, `SKIPPED`, `ERROR`) y mapeo explícito de salida CLI (selección vacía/excluida ≠ `PASS`). | Incompatible | P0 |
| `REQ-ORA-001.2` | Base 82 | RF | Evaluador independiente de oráculos: captura HTTP 4xx/5xx en navegación, rechaza señales N0/N1 como prueba de persistencia. | Incompatible | P0 |
| `REQ-ORA-001.3` | Base 82 | RF | Adquisición de testigos con independencia acreditada (N1/N2/N3; contexto limpio sin SW/caché/estado optimista para N2). | Ausente | P0 |
| `REQ-ORA-001.4` | Base 82 + ext. Docs | RF | Evaluador AST acotado con aritmética decimal exacta, tolerancias, conciliaciones y validación de contenido de documentos generados (corpus ratificado). | Ausente | P0 |
| `REQ-ORA-001.5` | Base 82 | RF | Oráculo de no-mutación post-denegación (RBAC/permisos: estado antes/después sin efectos colaterales). | Ausente | P0 |
| `REQ-ORA-001.6` | Base 82 | RF | Oráculo de convergencia asíncrona (distingue convergencia eventual, atasco intermedio y timeout técnico). | Ausente | P1 |
| `REQ-ORA-001.7` | Base 82 | RF | Metadato obligatorio de procedencia y `witness_independence_level` por afirmación; separación de `PASS` estructural y funcional. | Ausente | P0 |
| `REQ-RUN-001.3` | Base 82 | RF | Separación estricta de `technical_status`, `functional_verdict`, `cleanup_status` y `evidence_health`. | Ausente | P0 |
| `REQ-DAT-001.1` | Base 82 | RF | `TestDataManager`: datasets sintéticos con ámbito, procedencia, caducidad y protección anti-PII. | Ausente | P0 |
| `REQ-DAT-001.2` | Base 82 + ext. `UTCP-001` | RF | Ejecutor de `DataPlan` por DAG (creación topológica y limpieza inversa) sobre puerto común compatible con OpenAPI y manuales UTCP versionados. | Ausente | P0 contrato y primer recorrido |
| `REQ-DAT-001.4` | Base 82 | RF | Verificación post-limpieza y estrategias configurables (`delete`, `compensate`, `confine_tenant` según DP-05). | Ausente | P0 |
| `REQ-CAM-001.1` | Base 82 | RF | Orquestador autónomo A→B→C desde intención en lenguaje natural tras autorización inicial única. | Incompatible | P0 |
| `REQ-CAM-001.2` | Base 82 | RF | Aislamiento de bloqueos locales en el grafo de tareas sin detener ramas independientes. | Parcial | P0 |
| `REQ-CAM-001.5` | Base 82 | RF | Modos de intención como política de prioridad sobre estado de campaña continuo. | Parcial | P0 |
| `REQ-REP-001.2` | Base 82 + `M1`/`M2`/`M4` | RF | Reportes unificados (visor HTTP, HTML ejecución, HTML flujo, Markdown, JUnit/JSON), export offline `file://` sin CDN ni `fetch()` local, WebM reproducible con HTTP Range `206`/`416`, historial y comparativas. | Parcial | P0 mínimo / P1 cierre |
| `REQ-REP-001.3` | Base 82 | RF | `DefectManager` con taxonomía cerrada, deduplicación por firma y paquete reproducible. | Ausente | P1 |
| `REQ-REP-001.4` | Base 82 | RF | Flujo formal de reproducción (`REPRODUCIDO`/`NO_REPRODUCIDO`/`BLOQUEADO`) y verificación de corrección (`retest`). | Ausente | P1 |
| `REQ-REG-001.1` | Base 82 | RF | Detección de drift multi-señal (Git sin shell, DOM, API, config) y selección de regresión por impacto y riesgo. | Parcial | P1 |
| `REQ-REG-001.2` | Base 82 | RF | Detección estadística y registro de `flakiness` sobre intentos del mismo snapshot. | Ausente | P1 |
| `REQ-REG-001.3` | Base 82 | RF | Reparación acotada de adaptador/localizador creando nueva revisión `N+1` sin alterar expectativa ni el `FAIL` original. | Ausente | P1 |
| `REQ-XINST-001` | **Nuevo** | RF | Consulta cross-instancia estrictamente `read_only_reference` con origen e identidad de lectura separados y trazabilidad de procedencia. | Ausente | P0 frontera / P1 conector |
| `REQ-QA-001` | **Nuevo** | RF | Pruebas de internacionalización/localización (idioma, locale, zona horaria, moneda decimal exacta, claves sin traducir, truncamiento). | Ausente | P0 |
| `REQ-QA-002` | **Nuevo** | RF | Validación de contrato API (esquema, versión, HTTP status, `Content-Type`) por tráfico capturado y llamada directa, separada de persistencia. | Ausente | P0 contrato y mínimo |
| `REQ-QA-003` | **Nuevo** | RF | Accesibilidad automatizada (`axe-core`) con reglas/versión fijadas, huella reproducible y listado de comprobaciones manuales pendientes. | Ausente | P1 |

*(Nota de conteo: 53 RF provenientes de los 82 originales + 4 RF nuevos = **57 RF**; los 30 IDs restantes se clasifican abajo en RNF y Políticas Operativas.)*

---

### 1.3 Requisitos No Funcionales (RNF — 21 IDs)

| ID | Procedencia | Categoría RNF | Resumen consolidado y ampliaciones absorbidas | Estado en `develop` (`77a9c4f`) | Prioridad |
|---|---|---|---|---|---|
| `REQ-MEM-002.5` | Base 82 | Aislamiento / Arquitectura | Separación física y lógica estricta entre memoria de conocimiento canónico y almacén efímero de sesiones/cachés/temporales. | Parcial | P0 |
| `REQ-MEM-003.5` | Base 82 + ext. `OPT-002` | Mantenibilidad / Almacenamiento | Motor único de retención y poda (MCP/CLI) con `dryRun` real, cierre de handles, protección de fijados y estado explícito de evidencia expirada. | Incompatible | P0 |
| `REQ-MEM-003.6` | Base 82 | Escalabilidad / Portabilidad | Puerto `IQapRepository` único con adaptador local SQLite (WAL+FTS5) y contrato portable para adaptador concurrente PostgreSQL (alcance sujeto a DP-07). | Ausente | P0 puerto / DP-07 adaptador |
| `REQ-IA-001.5` | Base 82 | Integridad | Verificación criptográfica/digest única de origen canónico en MCP y CLI; rechazo de artefactos externos o alterados. | Parcial | P0 |
| `REQ-RUN-001.1` | Base 82 + ext. `OPT-001` | Aislamiento / Rendimiento | `BrowserContext` limpio obligatorio por caso (salvo dependencia declarada); gestión acotada de procesos/pool con reciclaje por RSS/contextos tras benchmark. | Incompatible | P0 aislamiento / P1 pool |
| `REQ-RUN-001.2` | Base 82 | Determinismo / Integridad | Verificación de huella del snapshot integrada en el propio Runner en todo canal (MCP/CLI/CI). | Parcial | P0 |
| `REQ-RUN-001.4` | Base 82 | Recuperación ante fallos | Registro durable de intención pre-efecto, reconciliación ante pérdida de respuesta, fencing por generación y bloqueo de reintento ante efecto incierto. | Incompatible | P0 |
| `REQ-RUN-001.5` | Base 82 + ext. `OPT-001` | Resiliencia / Concurrencia | Cancelación activa (`AbortController`) en vuelo, limpieza de árboles de procesos (Job Objects/process groups, 0 huérfanos) y concurrencia adaptativa medida. | Parcial | P0 cancelación y cierre / P1 paralelismo |
| `REQ-RUN-001.6` | Base 82 | Atomicidad / Consistencia | Publicación en fases separadas (preparación saneada → promoción inmutable → confirmación DB) y reconciliación tras cortes sin DDL duplicados. | Parcial | P0 |
| `REQ-CAM-001.3` | Base 82 | Eficiencia / Presupuestos | Presupuestos globales persistidos de campaña (tiempo, ejecuciones, tokens/inferencias) con cierre `COMPLETADA_PARCIAL`. | Parcial | P0 |
| `REQ-CAM-001.4` | Base 82 | Continuidad / Disponibilidad | Ejecutor soberano desacoplado del proceso/Job Object del host Stdio; IPC local autenticado, recuperación de locks/sockets y drenaje sin host. | Ausente | P0 |
| `REQ-REP-001.1` | Base 82 + `M2`/`M3`/`M5` | Integridad / Evidencia visual | Publicación de PNG nítido (3 modos + fallback trazable), WebM real con geometría coherente y protección de privacidad verificada desde antes del primer paint; verificación en navegador real. | Parcial | P0 |
| `REQ-SEG-001.3` | Base 82 | Seguridad en tiempo real | Revocación durable con generación monotónica y entrega post-commit conectada a `AbortController` en procesos activos y desconectados. | Parcial | P0 |
| `REQ-SEG-002.1` | Base 82 + `M3` | Seguridad / Confidencialidad | Cero secretos en argumentos MCP, chat, prompts, logs, temporales o evidencias; captura fuera de banda multiplataforma + CI sin TTY; permisos ACL efectivos por SO. | Incompatible | P0 |
| `REQ-SEG-002.2` | Base 82 | Seguridad / Identidad | Prohibición absoluta de degradación a anónimo (`fail-closed`) cuando el alcance requiere sesión autenticada, incluso si el llamador omite `profile`. | Parcial | P0 |
| `REQ-INT-001.1` | Base 82 | Consistencia / Paridad | Núcleo único (`@qap/core`) con adaptadores delgados MCP/CLI/CI y paridad 100 % en políticas, veredictos, persistencia y códigos de salida. | Incompatible | P0 |
| `REQ-INT-001.2` | Base 82 + ext. `ONB-001` | Portabilidad / Distribución | Multiplataforma Win/Mac/Linux sin dependencias `win32` en ruta ordinaria; `doctor`/`setup` desacoplado del AUT con caché gestionada y proxy/CA; compatibilidad MCP `2025-11-25` y `2026-07-28`; `tsc --noEmit` en CI. | Incompatible | P0 |
| `REQ-INT-001.3` | Base 82 | Escalabilidad / Despliegue | Operación local zero-config y arquitectura preparada para despliegue self-hosted concurrente (sujeto a DP-07). | Ausente | Según DP-07 |
| `REQ-INT-001.4` | Base 82 + ext. `UTCP-001` | Extensibilidad | Registro formal de conectores/plugins opt-in (formatos documentales, bóvedas, protocolos `DataPlan` OpenAPI/UTCP, extensiones privadas fuera del núcleo). | Parcial | P0 contratos / P1 plugins |
| `REQ-AGT-001` | **Nuevo** | Usabilidad / Adopción IA | Paquete idempotente por host (registro MCP único, Skill breve `SKILL.md`, hooks informativos opt-in desinstalables) con medición de tasa de enrutamiento y 0 bloqueos a suites unitarias. | Ausente | P0 en hosts de lanzamiento |
| *(Transversal G0)* | `revision-independiente.md` (H-REV-01) | Seguridad de línea base | Confinamiento canónico del visor HTTP con política CORS restrictiva y eliminación de ejecución vía shell (`execSync`) en `git-adapter`. | **Vulnerable en `develop`** | **P0 bloqueante G0** |

---

### 1.4 Políticas Operativas y de Gobernanza (POL — 10 IDs base + 7 propuestas de captura/retención)

Se separan explícitamente de RF/RNF porque requieren decisión de gobernanza del propietario y se ejecutan como reglas configurables en `IPolicyEngine`:

| ID | Procedencia | Política operativa | Estado |
|---|---|---|---|
| `REQ-MEM-001.2` | Base 82 | **Promoción epistémica:** ninguna observación de `crawler`/`active_probe` se promueve automáticamente a requisito/regla acreditada sin fuente autorizada por política. | Parcial en `develop` (P0) |
| `REQ-MEM-002.2` | Base 82 | **Frontera de alcance obligatoria:** workspace ambiguo o dimensión requerida desconocida bloquean consumo (en MCP y CLI por igual). | Parcial en `develop` (P0) |
| `REQ-DOC-001.4` | Base 82 | **Autoridad documental:** solo fuentes acreditadas por política producen expectativas ejecutables de negocio. | Parcial en `develop` (P0) |
| `REQ-CAS-001.1` | Base 82 + Visión | **Elegibilidad ordinaria autónoma (DP-01):** 0 aprobaciones humanas por caso en ruta ordinaria; elegibilidad por política y fuente acreditada. | Incompatible en `develop` (DP-01) |
| `REQ-DAT-001.3` | Base 82 | **Política de mutaciones por entorno:** bloqueo `SKIPPED_BY_POLICY` en producción/no autorizados; mutaciones permitidas solo en fixtures/staging con política expresa (nunca sobre Lendus por defecto). | Incompatible en `develop` (P0) |
| `REQ-SEG-001.1` | Base 82 | **Deny-by-default:** autorización inicial de workspace, destinos, perfiles y operaciones emitida por autoridad del host; política de red que distingue redes privadas explícitamente habilitadas de destinos fuera de alcance. | Parcial en `develop` (P0) |
| `REQ-SEG-001.2` | Base 82 | **Inmutabilidad del alcance ante el AUT:** prompts, DOM, URLs, redirecciones o etiquetas `"staging"` jamás amplían permisos. | Parcial en `develop` (P0) |
| `POL-CAP-01` | **Indicada por propietario** | Vigencia de **30 días** para autorizaciones de captura privada. | **Directriz del propietario** (modelar en G0) |
| `POL-RET-01..06` | **Propuestas en evaluación** | Retención WebM/PNG (7 d), trazas completas (72 h), resultados/metadatos (90 d), poda diaria y al iniciar QAP, conservación explícita para auditoría (`pin`), exportación privada solo con autorización. | **Pendiente de aprobación** (evaluadas en §4.2) |

*(Nota de integridad: los **82 IDs originales** + **5 IDs nuevos** = **87 IDs** están 100 % cubiertos entre los 57 RF + 20 RNF + 7 POL base = 84? Verifiquemos el recuento exacto: 57 RF [53 base + 4 nuevos: `XINST-001`, `QA-001`, `QA-002`, `QA-003`] + 20 RNF [19 base + 1 nuevo: `AGT-001`, sin contar la fila transversal de remediación G0] + 7 POL base [`MEM-001.2`, `MEM-002.2`, `DOC-001.4`, `CAS-001.1`, `DAT-001.3`, `SEG-001.1`, `SEG-001.2`] = **84**. ¿Qué 3 IDs faltaron en las tablas? Revisemos inmediatamente: `MEM` tiene 15: `001.1`(RF), `001.2`(POL), `001.3`(RF), `001.4`(RF), `002.1`(RF), `002.2`(POL), `002.3`(RF), `002.4`(RF), `002.5`(RNF), `003.1`(RF), `003.2`(RF), `003.3`(RF), `003.4`(RF), `003.5`(RNF), `003.6`(RNF) = 15. `DIS`: 8 (todos en RF). `DOC`: 4 (`001.1-3` RF, `001.4` POL). `IA`: 6 (`001.1-4,6` RF, `001.5` RNF). `PLN`: 6 (todos en RF). `CAS`: 5 (`001.1` POL, `001.2-5` RF). `ORA`: 7 (todos en RF). `RUN`: 6 (`001.3` RF, `001.1,2,4,5,6` RNF). `DAT`: 4 (`001.1,2,4` RF, `001.3` POL). `CAM`: 5 (`001.1,2,5` RF, `001.3,4` RNF). `REP`: 4 (`001.1` RNF, `001.2-4` RF). `REG`: 3 (todos en RF). `SEG`: 5 (`001.1,2` POL, `001.3,2.1,2.2` RNF). `INT`: 4 (todos en RNF). Sumemos: RF = 10(MEM)+8(DIS)+3(DOC)+5(IA)+6(PLN)+4(CAS)+7(ORA)+1(RUN)+3(DAT)+3(CAM)+3(REP)+3(REG)+0(SEG)+0(INT) + 4(nuevos) = **60 RF**! RNF = 3(MEM)+1(IA)+5(RUN)+2(CAM)+1(REP)+3(SEG)+4(INT) + 1(nuevo) = **20 RNF**! POL base = 2(MEM)+1(DOC)+1(CAS)+1(DAT)+2(SEG) = **7 POL base**! 60 + 20 + 7 = **87 exactos** — los 82 originales + 5 nuevos, cero omisiones.)*

### 1.5 Preservación de las 8 condiciones obligatorias de QAP

| Condición obligatoria | Requisitos que la blindan (sin reducción de alcance) |
|---|---|
| 1. Autonomía `HOST + DETERMINISTIC` | `REQ-IA-001.1`, `REQ-IA-001.2`, `REQ-IA-001.4`, `REQ-CAM-001.1`, `REQ-CAM-001.4` |
| 2. Persistencia local durable entre conversaciones | `REQ-MEM-001.1..003.6`, `REQ-MEM-002.4` (*Context Brief*), `REQ-CAM-001.4` |
| 3. Ejecución autónoma dentro de permisos autorizados | `REQ-CAS-001.1`, `REQ-SEG-001.1..001.3`, `REQ-DAT-001.3`, `REQ-CAM-001.2` |
| 4. Discovery, planificación, ejecución, oráculos y reportes | `REQ-DIS-001.1..001.8`, `REQ-PLN-001.1..001.6`, `REQ-RUN-001.1..001.6`, `REQ-ORA-001.1..001.7`, `REQ-REP-001.1..001.4` |
| 5. Videos reales WebM y evidencia visual protegida | `REQ-REP-001.1`, `REQ-REP-001.2`, `M1–M5`, `REQ-SEG-002.1`, `POL-CAP-01` |
| 6. Seguridad de credenciales y sesiones | `REQ-SEG-002.1`, `REQ-SEG-002.2`, `REQ-SEG-001.3`, `REQ-XINST-001` |
| 7. Recuperación ante fallos | `REQ-RUN-001.4`, `REQ-RUN-001.6`, `REQ-CAM-001.4`, `REQ-MEM-002.3` |
| 8. Separación entre resultado funcional y evidencia disponible | `REQ-RUN-001.3`, `REQ-ORA-001.1`, `REQ-ORA-001.7`, `REQ-REP-001.1`, `REQ-MEM-003.5` |

---

## 2. Matriz de decisiones cerradas y pendientes

> **Regla de gobernanza:** Ninguna clasificación *"Cerrada con fundamento"* o *"Propuesta técnicamente aceptable"* equivale a autorización para implementar ni para iniciar G0/G1.

### 2.1 Decisiones DP-01 a DP-15

| ID | Tema | Clasificación | Fundamento y alcance |
|---|---|---|---|
| **DP-01** | Derogación de aprobación humana por caso en ruta ordinaria (elegibilidad por política y fuente acreditada) | **Pendiente de aprobación del propietario** | Alineada con `QAP-VISION-AUTONOMIA.md`, pero deroga el contrato P0 implementado en `develop` (`verifyCaseApproval`). Requiere ratificación formal antes de implementación. |
| **DP-02** | Umbrales y denominadores de 80 % Discovery y 75 % verificación de efectos en G6 | **Pendiente de aprobación del propietario** | Deben mantenerse como métricas separadas; falta fijar denominadores exactos y si son bloqueantes en G6 u orientativos. |
| **DP-03** | Prohibición absoluta de credenciales en argumentos MCP/chat y contrato de alta fuera de banda multiplataforma + CI sin TTY | **Pendiente de aprobación del propietario** | En `develop` sigue activo `allowScopedCredentials` (`server.ts:378,744-756`). Requiere ratificar prohibición absoluta sin bypass incluso en fixtures y aprobar los mecanismos fuera de banda (TTY sin eco, secrets CI, loopback efímero). |
| **DP-04** | Semántica de `PASS` estructural (N1) vs. negocio/persistencia (N2 acreditado) | **Pendiente de aprobación del propietario** | Técnicamente madura (`PASS` estructural separado; persistencia N2 obligatoria e `INDETERMINATE` impide `PASS` funcional), pero define semántica de producto/reporte. |
| **DP-05** | Estrategia de limpieza en registros inmutables (`delete` / `compensate` / `confine_tenant`) | **Pendiente de aprobación del propietario** | Decisión de riesgo operacional sobre entornos mutables autorizados y sistemas financieros/contables. |
| **DP-06** | Prioridad del modo `MANAGED` (razonamiento desatendido) vs. `HOST + DETERMINISTIC` | **Pendiente de aprobación del propietario** | Impacta coste de APIs externas y alcance de primera entrega. |
| **DP-07** | Inclusión o diferimiento de PostgreSQL self-hosted concurrente antes de G1 | **Pendiente de aprobación del propietario** *(Bloqueante G0→G1)* | Condiciona contratos de repositorio, migraciones, FTS, concurrencia y matriz E2 antes de implementar G1 (H-REV-06). |
| **DP-08** | Lectura nativa PDF/DOCX con tablas en G2 vs. Texto/Markdown + OpenAPI inicial | **Pendiente de aprobación del propietario** | Depende de los formatos presentes en el corpus documental real prioritario. |
| **DP-09** | Precedencia para acreditar autoridad de `tenant_id` | **Pendiente de aprobación del propietario** | Define equilibrio entre fricción inicial y rigor multi-tenant (observable en perfil/API → declaración explícita → bloqueo). |
| **DP-10** | Composición de batería ciega (3 apps desconocidas) y custodia independiente en G6 | **Pendiente de aprobación del propietario** | Condiciona preparación y criterios de aceptación de G6/E8. |
| **DP-11** | Hooks globales `PreToolUse` bloqueando scripts Python/shell/Playwright/`curl` por patrones | **Rechazada o sustituida** | La variante de bloqueo por patrones fue **rechazada** en `evaluacion-independiente-requisitos.md` (riesgo de falsos bloqueos y falsas garantías). Sustituida por: registro MCP + Skill breve + **hooks informativos opt-in** (que queda **Pendiente de aprobación del propietario** y **Pendiente de prueba** en EXP-01). |
| **DP-12** | Motor `playwright-core` + Chromium P0 (`--only-shell` headless vs. Chromium completo; Firefox/WebKit opt-in) | **Propuesta técnicamente aceptable** *(parcialmente **Pendiente de prueba**)* | Conservar `playwright-core` + Chromium está técnicamente fundamentado sin necesidad de torneo de runners. El uso de `--only-shell` vs. Chromium completo en Win/Mac/Linux y la matriz de navegadores de reporte quedan **Pendientes de prueba** (EXP-03/04) y ratificación de SO/navegadores. |
| **DP-13** | Adopción de UTCP vs. OpenAPI directo en `DataPlan` | **Pendiente de prueba** | Soportar ambos formatos sobre un mismo puerto es aceptable, pero elegir el SDK concreto (`typescript-utcp` vs. HTTP/OpenAPI gobernado) exige ejecutar EXP-05 acotado. |
| **DP-14** | Gobernanza de instancias `read_only_reference` cross-instancia | **Pendiente de aprobación del propietario** *(y **Pendiente de prueba**)* | Requiere autorización empresarial de destinos de referencia e identidades de lectura en destino; la inmutabilidad ante GET mutativo/redirecciones debe probarse en EXP-05. |
| **DP-15** | Ejecutar los 6 experimentos EXP-01–EXP-06 como compuerta conjunta previa a G0 | **Rechazada o sustituida** | Sustituida por ensayos **just-in-time por fase**: solo EXP-01 (+ interoperabilidad MCP) y EXP-05 acotado condicionan contratos/dependencias tempranas; EXP-02 va antes de G2 y EXP-03/04/06 antes de activar defaults en G3/G5. |

### 2.2 Decisiones técnicas estructurales ya resueltas en el diseño consolidado

| Decisión técnica | Clasificación | Fundamento |
|---|---|---|
| Eliminar `@playwright/mcp` (dependencia muerta) y descartar Browser Use / Stagehand / Skyvern / CDP crudo / Selenium como runner principal | **Cerrada con fundamento** | `playwright-core` ya garantiza determinismo, `BrowserContext` aislado, `trace.zip`, WebM e intercepción de red sin LLM por paso. |
| Autoridad única (`@qap/core`) con adaptadores delgados MCP/CLI y eliminación de doble autoridad en corte por proyecto | **Cerrada con fundamento** | Verificado en H01, H04 y H-REV-03; corrige divergencia estructural y falsos `PASS` en CLI `develop`. |
| Rechazo de "unidad lógica transaccional" sobre el AUT; uso de intención durable + reconciliación + limpieza/compensación | **Cerrada con fundamento** | Un corte tras un efecto confirmado en el AUT no puede revertirse vía transacción SQL local (H03 y Evaluación A). |
| Remediaciones obligatorias en G0: confinamiento/CORS del visor HTTP, eliminación de `execSync` en `git-adapter` y compuerta `tsc --noEmit` para paquetes nuevos | **Cerrada con fundamento** | Vulnerabilidades y brecha de CI verificadas directamente en `develop` (`77a9c4f3`). |

### 2.3 Estado de las auditorías AS-01 a AS-04 en `develop`

| Auditoría | Estado en `develop` (`77a9c4f3`) | Clasificación | Acción requerida |
|---|---|---|---|
| **AS-01, AS-02, AS-03, AS-04** | **Ausentes en `develop`.** La búsqueda en todo el árbol del commit `77a9c4f3` arroja **0 archivos y 0 referencias** a `AS-01`–`AS-04`. | **No verificable en `develop` / Pendiente de comprobación por Codex** | Existen tags de archivo de ramas experimentales eliminadas (p. ej. referencias históricas `as02-git-hardening`, `as04-unified-capture`, `qap-recovery`, `qap-hydrogen`, `qap-g0`). **Ese código y esas auditorías NO forman parte de `develop`.** Ver §4.3 para la lista exacta de comprobaciones que debe ejecutar Codex. |

---

## 3. Contradicciones, brechas y dependencias

### 3.1 Contradicciones reales detectadas

1. **Retención de trazas (72 h) vs. validación actual de reportes en `develop`:** `packages/mcp/src/handlers/report.handler.ts:175-190` exige la presencia física de `trace.zip` para validar reportes de intentos confirmados. Si `trace.zip` se poda a las 72 h mientras los resultados/metadatos se retienen 90 días, **la validación de reportes antiguos se rompería** a menos que se desacoplen el `result_digest` inmutable y el estado explícito `PRUNED_BY_RETENTION` de la presencia física del archivo de traza.
2. **Prohibición de credenciales en MCP vs. `develop` (`77a9c4f3`):** `QAP-VISION-AUTONOMIA.md` prohíbe credenciales en chat/prompts, pero `packages/mcp/src/host-composition.ts:378,390` activa `silentBoundScope: true` y `packages/mcp/src/server.ts:378,744-756,899-901` expone y acepta `password`/`credentials` en `qap_auth_add` y `qap_start`.
3. **Autonomía ordinaria vs. compuertas humanas en `develop`:** `QAP-VISION-AUTONOMIA.md` exige 0 aprobaciones humanas por caso en ruta ordinaria, pero `packages/mcp/src/handlers/test.handler.ts:483-488,907` exige `verifyCaseApproval` y `packages/mcp/src/server.ts:705-723` mantiene instrucciones legacy P0.
4. **Versiones desalineadas de `playwright-core` y SDK MCP en `develop` (`77a9c4f3`):**
   - `playwright-core`: `^1.49.0` (`playwright-adapter`), `^1.62.1` (`auth`, `mcp`, `playwright-runner`), `1.63.0` (`cli`), `^1.63.0` (raíz).
   - `@modelcontextprotocol/sdk`: `^1.30.0`/`^1.30.1` (1.x, hasta especificación `2025-11-25`) frente a la especificación MCP vigente `2026-07-28` (SDK v2).
5. **Requisito de Node.js:** `develop` usa `node:sqlite` (Node 22.5+) mientras `AGENTS.md` menciona Node 18/20.
6. **Conteo de requisitos:** `evaluacion-independiente-requisitos.md` propone 88 requisitos (82 + 6), pero `REQ-UTCP-001` solapa `REQ-DAT-001.2` + `REQ-INT-001.4`; el catálogo consolidado sin duplicidades es de **87 requisitos**.
7. **Poda `qap_prune` rota en `develop`:** `packages/mcp/src/server.ts:4303-4350` devuelve ceros fijos en `dryRun`, fuga el handle de `QapDatabase` y no poda `.qa/executions/`, contradiciendo cualquier política de poda diaria/al inicio.
8. **Video WebM vs. visor HTTP en `develop`:** El runner graba `attempt.webm` (`1280x720` sin alinear viewport), mientras `packages/reporter/src/template/index.html:1058-1060` solicita `trace.mp4`, el servidor (`packages/reporter/src/server/server.ts`) carece de MIME `video/webm` y HTTP Range `206`/`416`, y expone `Access-Control-Allow-Origin: *` sin confinamiento canónico.

### 3.2 Brechas críticas

- **Brecha documental AS-01–AS-04:** Ninguna conclusión de AS-01 a AS-04 está integrada en `develop` (`77a9c4f3`).
- **Brecha de política de captura privada:** No existe aún en contratos el modelo de grant de captura privada con vigencia de 30 días, ni la separación entre retención de resultados (90 d) y permanencia del Knowledge canónico vigente (que **no** debe expirar a los 90 días).
- **Brecha de alta de secretos multiplataforma:** `local-secret-prompt.ts` es exclusivo de Windows (WPF/PowerShell); no existe contrato implementado para macOS, Linux ni CI sin TTY.
- **Brecha de pruebas de contratos previos a G1:** Faltan EXP-01 (+ interoperabilidad MCP v1/v2) y EXP-05 acotado (UTCP/OpenAPI + read-only cross-instancia).

### 3.3 Dependencias bloqueantes críticas

- `DP-07` → bloquea el cierre de contratos de `IQapRepository`, migraciones, FTS5 y compuerta E2 antes de G1.
- `DP-01`, `DP-03`, `DP-04`, `DP-05`, `DP-09` → bloquean congelación de contratos de `@qap/contracts` (`IPolicyEngine`, `OracleSpec`, `ScopeVector`, `TestDataManager`, `ISecretVault`) en G0.
- Políticas de retención/captura (`POL-CAP-01`, `POL-RET-01..06`) → condicionan el contrato de `IArtifactStore`, el manifiesto de publicación y el comportamiento de `ReportHandler` ante evidencia expirada o suprimida.
- Verificación de Codex sobre los 5 tags de archivo (AS-01..AS-04) → condiciona confirmar si hay hallazgos adicionales de seguridad/captura que deban incorporarse al cierre de G0.

---

## 4. Recomendaciones técnicas fundamentadas

### 4.1 Recomendación para cada decisión pendiente (DP-01 a DP-15)

| ID | Recomendación técnica fundamentada |
|---|---|
| **DP-01** | **Adoptar elegibilidad autónoma por política y fuente acreditada** (0 aprobaciones humanas por caso en ruta ordinaria). Mantener intervención humana únicamente ante conflictos de autoridad o ausencia de permisos iniciales. Preservar trazabilidad histórica sin borrar compuertas de integridad. |
| **DP-02** | **Aprobar umbrales separados (80 % Discovery y 75 % verificación de efectos) como objetivos medibles en G6** con denominadores explícitos: rutas/estados alcanzables autorizados para Discovery; casos con efecto de referencia en entornos mutables autorizados para verificación de efectos. Nunca mezclar ni ocultar bloqueados fuera del denominador. |
| **DP-03** | **Prohibición absoluta de secretos en argumentos MCP/chat sin bypass** (retirar `allowScopedCredentials` y `silentBoundScope` permisivo en G1). Soportar 3 canales fuera de banda: (1) TTY sin eco en Win/Mac/Linux, (2) proveedor de secretos/descriptor privado en CI sin TTY, y (3) formulario loopback `127.0.0.1` efímero con token de un solo uso, expiración corta y validación `Origin`/CSRF. |
| **DP-04** | **Separar `PASS` estructural (N1) de `PASS` funcional/persistencia (N2 acreditado).** Permitir `PASS` estructural explícitamente etiquetado para propiedades observables sin mutación; exigir testigo N2 independiente (sin SW/caché/estado optimista) para persistencia y negocio crítico, donde N2 `INDETERMINATE` impide `PASS` funcional aunque N1 sea `PASS`. |
| **DP-05** | **Aprobar modelo configurable por política de entorno** (`delete`, `compensate`, `confine_tenant`), con bloqueo obligatorio si la política de limpieza no está declarada o su permiso expiró. |
| **DP-06** | **Mantener `HOST + DETERMINISTIC` en la primera entrega** y diferir `MANAGED` a fase posterior con su propia compuerta, dejando el puerto `IReasoningProvider` definido en los contratos. |
| **DP-07** | **Fijar puerto único `IQapRepository` con SQLite (WAL+FTS5) en primera entrega y diferir el adaptador PostgreSQL self-hosted** a una fase posterior con su propia suite de contrato E2. Evita duplicar complejidad de infraestructura en G1 sin sacrificar portabilidad. |
| **DP-08** | **Iniciar G2 con Texto/Markdown + OpenAPI** detrás de `IDocumentFormatAdapter`, añadiendo PDF/DOCX nativos solo si el corpus inicial del propietario no puede exportarse a Markdown; reportar siempre brechas de extracción. |
| **DP-09** | **Precedencia de `tenant_id`:** (1) acreditado por perfil/fuente autorizada → (2) declaración explícita del operador → (3) bloqueo (`BLOCKED`) si el alcance exige tenant y es desconocido. Cero valores por defecto silenciosos. |
| **DP-10** | **Aprobar 3 apps desconocidas bajo custodia independiente** (web clásica con formularios/tablas, SPA asíncrona autenticada, app multi-rol multi-módulo con variante de idioma y contrato API) para falsar sobreajuste. |
| **DP-11** | **Mantener rechazada la intercepción por patrones de shell.** Aprobar `qap host-install` con registro MCP único + Skill breve `SKILL.md` + hooks **informativos opt-in** (con consentimiento explícito y desinstalación limpia). La garantía dura permanece en QAP (solo intentos canónicos con digest verificado emiten `PASS` oficial). |
| **DP-12** | **Ratificar `playwright-core` + Chromium (versión única alineada en todo el monorepo) como motor P0**; diferir Firefox/WebKit a opt-in. Definir mediante EXP-03/04 cuándo usar `--only-shell` (headless sin video/headed) vs. Chromium completo. |
| **DP-13** | **Definir en G0 un único puerto de `DataPlan` compatible con OpenAPI y manuales UTCP**, y ejecutar EXP-05 acotado antes de elegir si el cliente usa `typescript-utcp` directamente o HTTP/OpenAPI gobernado con adaptador UTCP. |
| **DP-14** | **Aprobar frontera `read_only_reference` deny-by-default** exigiendo: (1) origen e identidad separados (cero paso de credenciales de staging), (2) permiso de solo lectura impuesto por el destino, (3) lista blanca de operaciones de lectura acreditadas en QAP, y (4) fallback a exportación autorizada de solo lectura o `BLOCKED` si el destino no puede garantizar inmutabilidad. Validar en EXP-05. |
| **DP-15** | **Sustituir el bloqueo previo de 6 experimentos por ejecución just-in-time:** ejecutar EXP-01 (+ interoperabilidad MCP) antes del adaptador de hosts y EXP-05 acotado antes del cliente `DataPlan`; EXP-02 antes de G2; EXP-03/04/06 antes de activar defaults de distribución/paralelismo/captura en G3/G5. |

---

### 4.2 Evaluación técnica de políticas de captura y retención (propuestas NO aprobadas)

#### Distinción conceptual obligatoria (5 planos ortogonales)

| Dimensión | Definición técnica en QAP | Efecto operativo |
|---|---|---|
| **Autorización** | Grant temporal ligado a `(workspace, env, tenant, profile, capability)` con `expires_at` y generación monotónica. | Habilita *ejecutar* una acción (p. ej. capturar evidencia privada por **30 días**, o exportar evidencia privada). Su vencimiento impide *nuevas* capturas/exportaciones, pero no invalida retroactivamente resultados ya acreditados. |
| **Retención** | Regla de ciclo de vida (TTL + cuota en disco + excepciones `pinned`) aplicada a artefactos ya generados. | Define cuándo los blobs (`trace.zip`, `.webm`, `.png`) y registros históricos son elegibles para poda. **Nunca** aplica al Knowledge canónico vigente. |
| **Cifrado** | Protección criptográfica en reposo + permisos ACL del SO sobre bóveda, sesiones y (si se aprueba) temporales/evidencias privadas. | Protege confidencialidad independientemente del TTL o del estado de autorización. |
| **Revocación** | Invalidación inmediata con incremento de generación monotónica y notificación durable post-commit. | Dispara `AbortController` sobre ejecuciones en vuelo y bloquea nuevas operaciones/publicaciones. Solo dispara purga física anticipada si viene acompañada de orden expresa de supresión/incidente. |
| **Destrucción lógica vs. física** | **Lógica:** transicionar el manifiesto del artefacto a `EXPIRED`/`PRUNED_BY_RETENTION`/`SUPPRESSED` preservando veredicto, hashes y trazabilidad. **Física:** borrado definitivo del blob en disco. | Permite separar resultado funcional de evidencia disponible. En fallo de protección de privacidad (M3), el temporal se **destruye físicamente de inmediato** y se registra `SUPPRESSED` sin promoverlo. |

#### Evaluación técnica individual de cada propuesta

1. **Vigencia de 30 días para autorizaciones de captura privada (directriz del propietario):** Técnicamente sólida y fácil de modelar en `permission_grants` con renovación explícita y verificación previa a iniciar cualquier grabación WebM o captura sobre entornos privados. Requiere avisar antes del vencimiento y fallar cerrado (omitiendo captura privada con diagnóstico `CAPTURE_AUTH_EXPIRED`, sin invalidar la ejecución funcional no dependiente de video).
2. **Retención WebM/PNG de 7 días:** Técnicamente recomendable como valor base por peso en disco y minimización de privacidad, **condicionada** a que cualquier evidencia vinculada a un defecto abierto o marcada con *audit pin* quede protegida de la poda automática.
3. **Retención de trazas completas (`trace.zip`) de 72 horas:** Técnicamente justificada por tamaño y sensibilidad, pero **72 horas calendario es estrecho frente a fines de semana** (un fallo del viernes expira antes del lunes). Se recomienda evaluar **96–120 horas** (o 72 h con *auto-pin* temporal para `FAIL`/`ERROR`/`INDETERMINATE` con cuota máxima). **Requisito bloqueante:** desacoplar la verificación de integridad de reportes (`ReportHandler`) de la presencia física de `trace.zip` expirado, conservando el manifiesto de hashes con estado `PRUNED_BY_RETENTION`.
4. **Retención de resultados y metadatos de 90 días:** Técnicamente muy adecuada para tendencias de `flakiness`, regresión y auditoría con mínimo consumo de espacio. **Condición estricta:** delimitar que aplica solo a *intentos históricos, logs y telemetría*, jamás al *Knowledge canónico vigente* ni a definiciones de casos activos.
5. **Poda diaria y al iniciar QAP:** Adecuada para operación local sin daemon permanente, **siempre que**: (a) al iniciar QAP corra de forma asíncrona/acotada sin bloquear el arranque, (b) respete el lock exclusivo por proyecto para no colisionar con ejecuciones o publicaciones provisionales activas, y (c) reemplace el `qap_prune` defectuoso de `develop` con un motor único MCP/CLI con `dryRun` real y cierre limpio de handles.
6. **Conservación explícita para auditoría (`audit pin` / legal hold):** Imprescindible para compatibilizar TTL cortos (72 h / 7 d) con auditoría y depuración. Debe exigir metadatos de motivo, autorizador, fecha de revisión/vencimiento del pin y cuota máxima de disco para evitar saturación silenciosa.
7. **Exportación de evidencias privadas únicamente con autorización:** Técnicamente correcta y necesaria para los exports portables `file://` (M2). Debe separar *export técnico sanitizado* (sin media privada) de *export con evidencia privada* (que requiere grant vigente, verificación de canarios/enmascaramiento, registro en `security_audit_log` y exclusión garantizada de secretos/sesiones).

---

### 4.3 Comprobaciones exactas delegadas a Codex sobre los 5 tags de archivo

Dado que los 5 tags de archivo de ramas eliminadas **no forman parte de `develop` (`77a9c4f3`)**, Codex debe inspeccionarlos en solo lectura y entregar un informe verificable que responda exactamente:

1. **Existencia y alcance de AS-01 a AS-04:** Localizar los documentos/informes de auditoría `AS-01`, `AS-02`, `AS-03` y `AS-04` en los tags archivados (especialmente los correspondientes a las ramas históricas `as02-git-hardening`, `as04-unified-capture`, `qap-recovery`, `qap-g0` y `qap-hydrogen`). Confirmar sus dictámenes, severidades y si introducen hallazgos no cubiertos ya por H01–H11 y H-REV-01–H-REV-06.
2. **Tag de endurecimiento Git (`as02`):** Verificar qué patrón exacto de eliminación de shell (`execFileSync`/`spawnSync` + validación de ref Git) y pruebas de regresión se validaron, para confirmar si sirven como referencia para la remediación G0 de `packages/git-adapter/src/git-adapter.ts:28`.
3. **Tag de captura unificada (`as04`):** Verificar cómo modeló la autorización de captura privada (30 días), la protección preventiva de WebM/PNG desde el primer paint, la supresión de temporales ante fallo y si resolvió el conflicto entre poda de `trace.zip` y verificación de reportes.
4. **Tags de recuperación / Hydrogen / G0 (`qap-recovery`, `qap-hydrogen`, `qap-g0`):** Verificar qué evidencia física de cortes, testigos N2 o contratos G0 contienen, delimitando estrictamente qué aplica a `develop` y qué dependía de código experimental no integrado (sin portar código ciegamente ni presentarlo como implementado).

---

## 5. Preguntas estrictamente empresariales para el propietario

1. **Aprobación de autonomía y semántica de resultados (`DP-01`, `DP-04`, `DP-05`):**
   - ¿Aprueba derogar la aprobación humana por caso en ruta ordinaria y regir la elegibilidad exclusivamente por política y fuentes acreditadas?
   - ¿Aprueba reportar `PASS` estructural (N1) por separado y exigir testigo N2 independiente para `PASS` funcional/persistencia?
   - ¿Qué entornos/staging, tenants y operaciones autorizará para mutaciones y limpieza (`delete` / `compensate` / `confine_tenant`)?
2. **Seguridad de credenciales e instancias de referencia (`DP-03`, `DP-09`, `DP-14`):**
   - ¿Aprueba prohibición absoluta de credenciales en argumentos MCP/chat sin excepción (incluyendo fixtures locales)?
   - ¿Aprueba la precedencia propuesta para `tenant_id` (perfil/fuente autorizada → declaración explícita → bloqueo)?
   - ¿Qué instancias de referencia (`read_only_reference`) existirán en el alcance inicial y qué identidades de solo lectura en destino las respaldarán?
3. **Alcance de primera entrega (`DP-06`, `DP-07`, `DP-08`, `DP-12`):**
   - ¿Confirma `HOST + DETERMINISTIC` y SQLite local para la primera entrega, difiriendo `MANAGED` (`DP-06`) y PostgreSQL self-hosted (`DP-07`) a fases posteriores?
   - ¿Qué formatos documentales (Markdown/OpenAPI vs. PDF/DOCX con tablas), qué 2 locales iniciales (`REQ-QA-001`) y qué cobertura de accesibilidad (`REQ-QA-003`) requiere el corpus de lanzamiento?
   - ¿Qué hosts de IA (`Claude Code`, `Codex`, `Antigravity`, `Gemini CLI`), sistemas operativos/arquitecturas y navegadores de visualización de reportes son obligatorios para lanzamiento?
4. **Políticas de captura, retención y exportación privada (`POL-CAP-01`, `POL-RET-01..06`):**
   - Confirmada la vigencia de 30 días para autorizaciones de captura privada, ¿aprueba (o ajusta) los plazos de retención de **7 días** para WebM/PNG, **72 h** (o 96–120 h por fines de semana) para `trace.zip`, y **90 días** para resultados/metadatos (excluyendo Knowledge canónico vigente)?
   - ¿Aprueba la poda diaria/al inicio, la conservación explícita para auditoría (`pin` con cuota y caducidad) y exigir autorización explícita para exportar evidencias privadas?
   - ¿En qué superficies/entornos se autoriza grabar video WebM?
5. **Adopción por agentes y criterios de aceptación (`DP-02`, `DP-10`, `DP-11`):**
   - ¿Aprueba instalar registro MCP + Skill breve + hooks **informativos opt-in** (con consentimiento y sin bloqueo por patrones de shell), y qué umbral de enrutamiento y tamaño de muestra exigirá por host?
   - ¿Ratifica las 3 apps ciegas bajo custodia independiente y los umbrales separados de **80 % Discovery** y **75 % verificación de efectos** como criterios bloqueantes de G6?

---

## 6. Condiciones objetivas para considerar G0 listo

G0 podrá declararse **LISTO (cerrado para abrir G1)** únicamente cuando se verifiquen todas estas condiciones binarias sobre `develop`:

1. **Ratificación formal del propietario:** Respuestas cerradas y registradas sobre las 5 preguntas empresariales (§5), con especial obligatoriedad de **`DP-01`, `DP-03`, `DP-04`, `DP-05`, `DP-07` y `DP-09`**, el catálogo consolidado (87 requisitos) y las políticas de captura/retención (`POL-CAP-01`, `POL-RET-01..06`).
2. **Conciliación de AS-01–AS-04:** Informe de Codex sobre los 5 tags de archivo revisado y resuelto (todo hallazgo vigente incorporado al alcance de G0/G1; cero dependencias ocultas en código fuera de `develop`).
3. **Remediaciones de seguridad de línea base verificadas en `develop`:**
   - Visor HTTP (`packages/reporter/src/server/server.ts`) confinado a artefactos autorizados por ruta canónica con política CORS restrictiva y pruebas de regresión en verde.
   - Adaptador Git (`packages/git-adapter/src/git-adapter.ts`) sin ejecución vía shell (`execSync`), con validación estricta de referencia y pruebas de regresión en verde.
4. **Control de tipos y alineación base:** Deuda heredada de `tsc` medida y aislada sin crecimiento, `tsc --noEmit` activo en CI como compuerta obligatoria para paquetes nuevos, versión única de `playwright-core` definida y versión objetivo de Node.js fijada sin contradicción en documentación.
5. **Contratos congelados y versionados (`@qap/contracts`):**
   - `ScopeVector` (incluyendo `locale`), `EpistemicPlane`, `OracleSpec` (N1/N2/N3 y 6 veredictos), `ExecutionPlan`/`DataPlan` (DAG multirol + puerto OpenAPI/UTCP), `ReasoningTask` (lease + epoch + digest), `IQapRepository` (alineado a `DP-07`), `IPolicyEngine` (grants, revocación, `read_only_reference`, captura privada 30 d y retención/pinning), `ISecretVault` (contrato multiplataforma + CI sin TTY), DTO/manifiesto de reportes `M1–M4` (con estados `EXPIRED`/`PRUNED_BY_RETENTION`/`SUPPRESSED`) y matriz de compatibilidad MCP (`2025-11-25` y `2026-07-28`).
6. **Evidencia experimental mínima previa a contratos dependientes:**
   - EXP-01 acotado (+ interoperabilidad MCP) ejecutado antes de congelar el adaptador de hosts.
   - EXP-05 acotado ejecutado antes de seleccionar el SDK de `DataPlan` y validar la frontera `read_only_reference`.
7. **Inventario base y fixtures preparados:** Inventario de escritores/stores legados, matriz de plataformas/navegadores y fixtures reproducibles listos para la ruta vertical de G1 y protocolo de custodia de G6.

---

## 7. Dictamen final

### **DICTAMEN: NO LISTO (para congelar WBS o iniciar implementación)**

**Justificación ejecutiva:** La arquitectura objetivo está técnicamente madura y no requiere otra investigación general; sin embargo, QAP **NO está listo** para elaborar un WBS vinculante ni abrir G0/G1 debido a **4 bloqueantes objetivos**:

1. **Decisiones de negocio y alcance sin ratificación del propietario (`DP-01`–`DP-10`, `DP-14` y matriz de plataformas/hosts):** En particular, **`DP-07`** (PostgreSQL self-hosted ahora vs. diferido) bloquea el diseño contractual de persistencia y E2, y **`DP-01`/`DP-03`/`DP-04`/`DP-05`** definen contratos centrales de seguridad, elegibilidad y oráculos.
2. **Auditorías AS-01 a AS-04 ausentes en `develop` (`77a9c4f3`):** No pueden darse por cerradas ni integradas hasta que Codex audite los 5 tags de archivo y reporte qué hallazgos aplican a `develop`.
3. **Políticas de captura y retención sin aprobación y con conflicto técnico en `develop`:** Las 6 políticas propuestas (7 d WebM/PNG, 72 h trazas, 90 d metadatos, poda diaria/inicio, pinning de auditoría y exportación privada autorizada) esperan aprobación del propietario y exigen resolver en contrato el desacople entre poda de `trace.zip` y verificación de integridad de reportes.
4. **Dos decisiones técnicas condicionadas a experimentos cortos:** Interoperabilidad MCP + adopción por host (EXP-01) y elección de cliente `DataPlan` UTCP/OpenAPI + prueba de inmutabilidad `read_only_reference` (EXP-05).

**Condición de desbloqueo inmediato:** Una vez el propietario responda las 5 preguntas de la §5 y Codex entregue la comprobación de los 5 tags de archivo (§4.3), el proyecto pasará de inmediato a **LISTO PARA PLANIFICACIÓN** sin requerir investigaciones adicionales.