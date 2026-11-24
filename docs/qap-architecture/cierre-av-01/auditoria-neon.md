# QAP — Auditoría Final de Requisitos y Arquitectura Objetivo

**Autor:** Gemini Neon (Investigador Principal y Arquitecto de QAP)  
**Fecha de emisión:** 24 de noviembre de 2026  
**Repositorio:** `Hyouka73/QAMCP` · **Rama:** `develop` · **SHA verificado:** `ea804a5b141659c68cd85305ca4bbaeeb431bc0e`  
**Alcance:** Revisión integral previa al plan maestro definitivo y al WBS. Solo investigación y auditoría arquitectónica (sin implementación de código, commits, ramas ni inicio de G0/G1).

---

## 1. Dictamen ejecutivo

**Dictamen global:** **APROBABLE CON CORRECCIONES.**

El expediente consolidado en `docs/qap-architecture/` (`ea804a5b141659c68cd85305ca4bbaeeb431bc0e`) logra unificar la línea normativa de producto (**D01–D21**), recupera íntegros los **82 requisitos originales** más los **5 añadidos** (87 IDs base sin duplicidades), preserva la evidencia experimental archivada por SHA (`AS-02`, `AS-04`, `qap-autonomous-mvp`, `Recovery`, `Hydrogen R2`) y documenta con honestidad las fuentes primarias faltantes. La base arquitectónica del plan maestro consolidado —autoridad única, adaptadores delgados MCP/CLI, doble carril persistente (determinista y razonamiento), oráculos con independencia de testigo y publicación atómica— es estructuralmente sólida para construir un producto QA empresarial local, autónomo y utilizable.

Sin embargo, el expediente **no puede declararse listo para planificación sin enmiendas previas** por cinco brechas materiales detectadas al auditar el catálogo, el código real de `develop` y la documentación oficial vigente:

1. **Dependencias y contratos técnicos desactualizados o incompatibles con licencia:** el monorepo en `develop` mantiene un *skew* real de `playwright-core` (`^1.49.0`, `^1.62.1`, `1.63.0`), arrastra `@playwright/mcp` (`^0.0.80`) con cero referencias, utiliza [`@modelcontextprotocol/sdk` v1.x](https://www.npmjs.com/package/@modelcontextprotocol/sdk) (línea de mantenimiento sin soporte para la especificación MCP [`2026-07-28`](https://modelcontextprotocol.io/docs/2026-07-28/sdk)) y referencia `keytar` (oficialmente [archivado y deprecado](https://github.com/github/node-keytar)). Además, para la validación de reportes Excel (**D11**), [`ExcelJS`](https://github.com/exceljs/exceljs) no recalcula fórmulas y `HyperFormula` exige [GPLv3 o licencia comercial](https://handsontable.com/docs/hyperformula/guide/licensing.html), incompatible con la licencia `ISC` del núcleo QAP.
2. **Garantías asimétricas de captura protegida por motor y OOPIF (D14/D18/AS-04):** las sesiones CDP son [exclusivas de Chromium](https://playwright.dev/docs/api/class-browser), [`page.screencast`](https://playwright.dev/docs/api/class-screencast) limita Firefox y WebKit a 25 fps, y las transiciones SPA sin tráfico HTTP reproducidas en AS-04 más los *iframes* fuera de proceso (OOPIF) impiden prometer exclusión preventiva universal. El diseño debe acotar qué garantías técnicas son alcanzables por motor y activar supresión *fail-closed* donde no existan.
3. **Resolución incompleta del catálogo y duplicidad normativa:** los tres candidatos (`CAND-REP-001`, `CAND-RUN-001`, `CAND-SEG-001`) deben promoverse a requisitos/políticas formales para cubrir **D11**, **D14–D15** y **D18–D20** sin duplicar la política adicional de captura privada. La clasificación individual **60 RF / 20 RNF / 7 Políticas base** de la fe de erratas previa **no se encuentra en el repositorio**; en la Sección 2 se entrega una **reconstrucción documental analítica explícita**, distinguida de la recuperación primaria.
4. **Brechas de seguridad y veracidad confirmadas en el código real de `develop`:** persisten la lectura arbitraria de archivos por `isAbsolute(safePath)` con CORS `*` (`packages/reporter/src/server/server.ts:59,277`), inyección potencial de shell en Git (`packages/git-adapter/src/git-adapter.ts:28`), contraseñas en claro vía `silentBoundScope: true` (`packages/mcp/src/host-composition.ts:390`), alta interactiva exclusivamente Windows PowerShell (`packages/auth/src/local-secret-prompt.ts:72`), aborto de `fetch`/XHR/imágenes/fuentes en el crawler SPA (`packages/playwright-adapter/src/crawler/service.ts:199-214`), descarte del código HTTP en navegación (`packages/playwright-runner/src/actions/navigate.ts:17`), bloqueo incondicional de BVA/RBAC (`packages/playwright-runner/src/case-execution-policy.ts:5-8`), falsos `passed` con `exitCode = 0` en CLI (`packages/cli/src/commands/test.ts:210,230`) y visor acoplado a Tailwind CDN y `trace.mp4` (`packages/reporter/src/template/index.html:19,1059`). Ninguna de estas correcciones debe implementarse antes de planificar —corresponden a G0/G1—, pero su inventario exacto sí condiciona la estrategia de conservación/sustitución.
5. **Criterios de aceptación y perfilado de recursos aún sin método cerrado (D16/D21):** los umbrales de 80 % Discovery y 75 % verificación de efectos siguen sin denominadores normativos ni condiciones explícitas de veto, y falta un protocolo reproducible para fijar RAM, CPU, disco, tokens y concurrencia segura sin inventar cifras.

Incorporando las enmiendas de las Secciones 2–11, la arquitectura queda en condiciones de pasar a la elaboración del plan maestro definitivo y el WBS.

---

## 2. Catálogo definitivo propuesto y clasificación individual por ID

### 2.1 Aclaración de procedencia (recuperación auténtica vs. reconstrucción documental)

- **Recuperación auténtica verificada en `ea804a5b`:** los **82 IDs originales** (`docs/qap-architecture/gemini-neon-etapa-3.md` y `catalogo-requisitos.md`), los **5 IDs añadidos** (`REQ-XINST-001`, `REQ-QA-001`, `REQ-QA-002`, `REQ-QA-003`, `REQ-AGT-001`), las **11 ampliaciones** (`REQ-AGT-002`, `REQ-ONB-001`, `REQ-OPT-001`, `REQ-OPT-002`, `REQ-E2E-001`, `UTCP/OpenAPI`, `M1`–`M5`), los **3 candidatos** (`CAND-REP-001`, `CAND-RUN-001`, `CAND-SEG-001`) y las **2 políticas adicionales** (`Captura privada controlada`, `Historial y retención`). Cero IDs duplicados en el bloque de 87.
- **Reconstrucción documental analítica (fuente primaria ausente):** el documento original de la fe de erratas anterior con la asignación individual **60 RF / 20 RNF / 7 Políticas operativas base** **no está versionado** en `develop` ni en los insumos disponibles (confirmado en `evidencia-archivada.md:59` y mediante búsqueda exhaustiva en el árbol del commit `ea804a5b`). La clasificación individual siguiente constituye una **reconstrucción analítica verificable** sobre los 87 IDs recuperados que respeta exactamente el reparto **60 RF + 20 RNF + 7 Políticas base = 87**, ampliada con la promoción formal de los 3 candidatos y la política de retención.

### 2.2 Composición del catálogo definitivo propuesto (92 elementos normativos únicos)

| Bloque normativo | Cantidad | Desglose por categoría |
|---|---:|---|
| Línea base recuperada (82 originales + 5 añadidos) | 87 | **60 RF** · **20 RNF** · **7 Políticas operativas base** |
| Promoción de `CAND-REP-001` → `REQ-AUTREP-001` | +1 | **+1 RF** (Validación funcional de reportes PDF/Excel del AUT) |
| Promoción de `CAND-RUN-001` → `REQ-RUN-002.1` | +1 | **+1 RF** (Preferencias en lenguaje natural y fidelidad del AUT) |
| Promoción de `CAND-SEG-001` + Política de captura → `REQ-SEG-002.3` y `POL-CAP-001` | +2 | **+1 RNF** (Custodia técnica de evidencia privada) · **+1 Política** (Régimen de captura privada controlada) |
| Formalización de Política de historial y retención → `POL-RET-001` | +1 | **+1 Política** (Historial durable y retención inteligente) |
| **Total catálogo definitivo propuesto** | **92** | **62 RF** · **21 RNF** · **9 Políticas operativas** *(cero duplicidades; las 11 ampliaciones se integran en sus IDs padre)* |

*(Nota aritmética: la línea base mantiene exactamente **87** IDs = 60 RF + 20 RNF + 7 Políticas base; al promover los 3 candidatos y desacoplar las 2 políticas adicionales sin solapamiento, el catálogo definitivo asciende a **92** elementos normativos explícitos —62 RF, 21 RNF y 9 Políticas—, respetando la directiva de no imponer 87 como techo artificial.)*

### 2.3 Clasificación individual de los 87 IDs base (reconstrucción analítica 60 / 20 / 7) + 5 elementos promovidos

| ID | Familia | Clase | Estado en `develop` | Decisiones | Ampliaciones integradas / Observaciones de auditoría |
|---|---|---|---|---|---|
| `REQ-MEM-001.1` | Memoria | RF | Parcial | D05 | Plano epistémico obligatorio en almacén canónico único. |
| `REQ-MEM-001.2` | Memoria | **POL (1/7)** | Parcial | D05, D12 | Invariante de no autopromoción (observación ≠ regla de negocio). |
| `REQ-MEM-001.3` | Memoria | RNF (1/20) | Parcial | D05 | Versionado inmutable uniforme de entidades y casos. |
| `REQ-MEM-001.4` | Memoria | RF | Parcial | D05 | Máquina de estados `pending_review` para ediciones manuales ante drift. |
| `REQ-MEM-002.1` | Memoria | RNF (2/20) | Incompatible | D02, D05, D09 | Vector de alcance completo `(project, app, instance, env, tenant, profile, role, version, config_rev)`. |
| `REQ-MEM-002.2` | Memoria | RF | Parcial | D02, D05, D20 | Validador único de alcance compartido por MCP y CLI. |
| `REQ-MEM-002.3` | Memoria | RF | Parcial | D03, D05 | Persistencia de campaña, frontera, cola determinista y cola de razonamiento. |
| `REQ-MEM-002.4` | Memoria | RF | Parcial | D03, D05, D13 | Absorbe `REQ-AGT-002` y `REQ-OPT-002` (snapshot contextual compacto multi-host). |
| `REQ-MEM-002.5` | Memoria | RNF (3/20) | Parcial | D05, D09, D20 | Separación física/lógica memoria funcional vs secretos/sesiones/caché. |
| `REQ-MEM-003.1` | Memoria | RF | Parcial | D05, D10 | Registro único de contradicciones tipadas con bloqueo de oráculo. |
| `REQ-MEM-003.2` | Memoria | RF | Parcial | D05 | Motor activo de propagación `stale` por grafo de dependencias. |
| `REQ-MEM-003.3` | Memoria | RF | Ausente | D05, D19 | Pipeline post-ejecución de firmas, flakiness y latencias sin tocar reglas. |
| `REQ-MEM-003.4` | Memoria | RF | Ausente | D05, D19, D20 | Export/import portable versionado con filtro anti-secretos. |
| `REQ-MEM-003.5` | Memoria | RF | Incompatible | D16, D19 | Absorbe `REQ-OPT-002`; motor único de retención y poda con simulación real. |
| `REQ-MEM-003.6` | Memoria | RNF (4/20) | Ausente | D02 | Puerto `IQapRepository` con adaptador SQLite local y contrato listo para PostgreSQL. |
| `REQ-DIS-001.1` | Discovery | RF | Parcial | D04, D21 | Bucle autónomo de lotes hasta `READY` o presupuesto. |
| `REQ-DIS-001.2` | Discovery | RF | Parcial | D05, D21 | Modelo uniforme de frontera/cobertura en exploración inicial y focalizada. |
| `REQ-DIS-001.3` | Discovery | RF | Incompatible | D15, D16, D21 | Absorbe `REQ-OPT-002`; extractor DOM+ARIA profundo para SPAs, tablas, filtros, paginación. |
| `REQ-DIS-001.4` | Discovery | RF | Ausente | D15, D21 | Observador de tráfico de lectura integrado y correlación vista ↔ endpoint API. |
| `REQ-DIS-001.5` | Discovery | RF | Parcial | D05, D21 | Matriz diferencial de visibilidad por rol, tenant y configuración efectiva. |
| `REQ-DIS-001.6` | Discovery | RF | Parcial | D05, D06 | Grafo dual explícito: navegación observada vs dependencias de negocio acreditadas. |
| `REQ-DIS-001.7` | Discovery | RF | Parcial | D05 | Checkpoints por alcance y refresco incremental por drift. |
| `REQ-DIS-001.8` | Discovery | RNF (5/20) | Ausente | D03 | Ejecución de lotes desacoplada en worker soberano. |
| `REQ-DOC-001.1` | Ingesta Doc | RF | Parcial | D10, D17 | Pipeline estructurado para PDF, DOCX, Excel, MD, TXT, JSON, YAML, OpenAPI con localizadores. |
| `REQ-DOC-001.2` | Ingesta Doc | RF | Ausente | D10, D11 | Cobertura explícita de extracción, OCR/escaneados y omisiones/abstención. |
| `REQ-DOC-001.3` | Ingesta Doc | RF | Parcial | D10 | Reconciliador bidireccional documento ↔ observación en 4 estados. |
| `REQ-DOC-001.4` | Ingesta Doc | **POL (2/7)** | Parcial | D05, D10, D12 | Regla transversal de autoridad documental y bloqueo ante contradicción. |
| `REQ-IA-001.1` | Inteligencia | RF | Parcial | D03, D13, D17 | Absorbe `REQ-AGT-002`; protocolo estructurado solicitudes/propuestas con HOST. |
| `REQ-IA-001.2` | Inteligencia | RF | Parcial | D03, D17 | Modo `DETERMINISTIC` formal sin inferencia por paso. |
| `REQ-IA-001.3` | Inteligencia | RF | Parcial | D03, D04 | Validador único de propuestas estructuradas (escenarios, oráculos, diagnósticos, reparaciones). |
| `REQ-IA-001.4` | Inteligencia | RF | Ausente | D03, D05 | Separación de colas determinista vs razonamiento y handoff multi-host. |
| `REQ-IA-001.5` | Inteligencia | RNF (6/20) | Parcial | D13, D20 | Verificación criptográfica SHA-256 de origen de intento en MCP y CLI. |
| `REQ-IA-001.6` | Inteligencia | RNF (7/20) | Ausente | D03 | Puerto `IReasoningProvider` opcional para fase posterior (`MANAGED`). |
| `REQ-PLN-001.1` | Planificación | RF | Incompatible | D06, D08 | Absorbe `REQ-E2E-001`; modelo unificado `CampaignPlan`, `ExecutionPlan`, `DataPlan`, `TestCase`. |
| `REQ-PLN-001.2` | Planificación | RF | Parcial | D04 | Planificador incremental desde `PARTIAL_READY`. |
| `REQ-PLN-001.3` | Planificación | RF | Ausente | D04, D16 | Motor de priorización por riesgo (criticidad, drift, defectos, presupuesto). |
| `REQ-PLN-001.4` | Planificación | RF | Incompatible | D06 | Absorbe `REQ-E2E-001`; resolvedor DAG multi-caso/multi-módulo con detección de ciclos. |
| `REQ-PLN-001.5` | Planificación | RNF (8/20) | Parcial | D03, D06 | Absorbe `REQ-E2E-001`; congelamiento inmutable de `ExecutionPlan` en todo canal. |
| `REQ-PLN-001.6` | Planificación | RF | Ausente | D06 | Absorbe `REQ-E2E-001`; reevaluador de grafo ante fallo de prerrequisito. |
| `REQ-CAS-001.1` | Casos | **POL (3/7)** | Incompatible | D04 | Elegibilidad automática por política y fuente acreditada (0 aprobaciones ordinarias). |
| `REQ-CAS-001.2` | Casos | RF | Incompatible | D01, D06, D21 | Generación multi-técnica (positivos, negativos, BVA, estados, RBAC, cálculos) con oráculos. |
| `REQ-CAS-001.3` | Casos | RF | Parcial | D05 | Separación `TestCaseIdentity` (funcional) vs `TestCaseRevision` (ejecutable/adaptador). |
| `REQ-CAS-001.4` | Casos | RF | Parcial | D05, D21 | Evaluador de aplicabilidad condicional por `(env, tenant, role, config)`. |
| `REQ-CAS-001.5` | Casos | RF | Parcial | D05 | Deduplicación semántica/estructural y propagación de obsolescencia. |
| `REQ-ORA-001.1` | Oráculos | RF | Incompatible | D12, D21 | Taxonomía única de 6 veredictos (`PASS`, `FAIL`, `INDETERMINATE`, `BLOCKED`, `SKIPPED`, `ERROR`). |
| `REQ-ORA-001.2` | Oráculos | RF | Incompatible | D11, D12, D21 | Evaluador independiente que rechaza señales N0/N1 como prueba de persistencia. |
| `REQ-ORA-001.3` | Oráculos | RF | Ausente | D11, D12, D21 | Motor de testigos N1/N2/N3 (contexto limpio, fuente secundaria, conciliación). |
| `REQ-ORA-001.4` | Oráculos | RF | Ausente | D11, D12, D17 | Evaluador tipado con aritmética decimal exacta, tolerancias y conciliaciones. |
| `REQ-ORA-001.5` | Oráculos | RF | Ausente | D07, D12, D21 | Oráculo de no-mutación antes/después de operación denegada. |
| `REQ-ORA-001.6` | Oráculos | RF | Ausente | D12 | Oráculo de convergencia asíncrona con ventana temporal y estado final. |
| `REQ-ORA-001.7` | Oráculos | RF | Ausente | D11, D12, D21 | Metadato `witness_independence_level` y procedencia obligatorios por evaluación. |
| `REQ-RUN-001.1` | Runner | RNF (9/20) | Incompatible | D06, D15, D16 | Absorbe `REQ-OPT-001`, `REQ-E2E-001`; contexto limpio por caso por defecto. |
| `REQ-RUN-001.2` | Runner | RNF (10/20) | Parcial | D06, D12 | Absorbe `REQ-E2E-001`; verificación de huella de snapshot en el propio Runner. |
| `REQ-RUN-001.3` | Runner | RF | Ausente | D06, D12 | Absorbe `REQ-E2E-001`; estructura de 4 ejes (`technical_status`, `functional_verdict`, `cleanup_status`, `evidence_health`). |
| `REQ-RUN-001.4` | Runner | RF | Incompatible | D06, D12 | Absorbe `REQ-E2E-001`; reintento por idempotencia + reconciliación previa en mutaciones. |
| `REQ-RUN-001.5` | Runner | RNF (11/20) | Parcial | D07, D16 | Absorbe `REQ-OPT-001`; cancelación `AbortController` + pool acotado de workers. |
| `REQ-RUN-001.6` | Runner | RNF (12/20) | Parcial | D18 | Absorbe `M2`, `M3`; publicación atómica unificada eliminando DDL duplicados. |
| `REQ-DAT-001.1` | Datos | RF | Ausente | D06, D08, D09 | `TestDataManager`: datos sintéticos etiquetados, caducidad y filtro anti-PII. |
| `REQ-DAT-001.2` | Datos | RF | Ausente | D06, D08 | Absorbe `UTCP/OpenAPI`; ejecutor de `DataPlan` con DAG topológico, APIs autorizadas y limpieza inversa. |
| `REQ-DAT-001.3` | Datos | **POL (4/7)** | Incompatible | D07 | Política por entorno: producción solo lectura acreditada, mutaciones solo en QA autorizado. |
| `REQ-DAT-001.4` | Datos | RF | Ausente | D06, D07, D08 | Verificador post-limpieza y estrategias `delete`, `compensate`, `confine_tenant`. |
| `REQ-CAM-001.1` | Campañas | RF | Incompatible | D01, D04 | Orquestador autónomo A→B→C tras autorización inicial única. |
| `REQ-CAM-001.2` | Campañas | RF | Parcial | D04, D06 | Absorbe `REQ-E2E-001`; aislamiento de bloqueos locales sin detener ramas independientes. |
| `REQ-CAM-001.3` | Campañas | RF | Parcial | D04, D16 | Absorbe `REQ-OPT-001`, `REQ-E2E-001`; presupuestos globales con cierre `COMPLETADA_PARCIAL`. |
| `REQ-CAM-001.4` | Campañas | RNF (13/20) | Ausente | D03, D04 | Runtime soberano desacoplado de la conexión del cliente MCP. |
| `REQ-CAM-001.5` | Campañas | RF | Parcial | D04 | Modos de intención como política de prioridad sobre estado continuo. |
| `REQ-REP-001.1` | Reportes QAP | RF | Parcial | D12, D18–D20 | Absorbe `M1`–`M5`; servicio único de evidencias e integridad para MCP y CLI. |
| `REQ-REP-001.2` | Reportes QAP | RF | Parcial | D04, D18–D20 | Absorbe `M1`, `M2`, `M4`, `M5`; historial unificado, comparativas y export portable. |
| `REQ-REP-001.3` | Reportes QAP | RF | Ausente | D05, D19 | `DefectManager` con taxonomía `indeterminate`, deduplicación por firma y paquete reproducible. |
| `REQ-REP-001.4` | Reportes QAP | RF | Ausente | D05, D19 | Máquina de estados de defecto (`REPRODUCIDO`/`NO_REPRODUCIDO`/`BLOQUEADO`/`retest`). |
| `REQ-REG-001.1` | Regresión | RF | Parcial | D04, D05 | Detección de drift multi-señal (Git/DOM/API/config) + selección por impacto y riesgo. |
| `REQ-REG-001.2` | Regresión | RF | Ausente | D05 | Analizador estadístico de `flakiness` sobre mismo snapshot y versión. |
| `REQ-REG-001.3` | Regresión | RF | Ausente | D05 | Reparación acotada de adaptador `vN+1` preservando expectativa y `FAIL` original. |
| `REQ-SEG-001.1` | Seguridad | **POL (5/7)** | Parcial | D07, D09, D18, D20 | Motor único deny-by-default en MCP, CLI, visor y conectores (absorbe `M4`). |
| `REQ-SEG-001.2` | Seguridad | **POL (6/7)** | Parcial | D02, D07, D09, D20 | Invariante de alcance inalterable desde prompts, DOM o redirecciones. |
| `REQ-SEG-001.3` | Seguridad | RNF (14/20) | Parcial | D07, D18, D20 | Bus durable de revocación conectado a `AbortController` en vuelo. |
| `REQ-SEG-002.1` | Seguridad | RNF (15/20) | Incompatible | D18, D20 | Absorbe `M3`; captura de secretos multiplataforma 100 % fuera de MCP/chat/prompts. |
| `REQ-SEG-002.2` | Seguridad | **POL (7/7)** | Parcial | D20 | Prohibición uniforme de degradación a anónimo ante pérdida de sesión requerida. |
| `REQ-INT-001.1` | Interfaces | RNF (16/20) | Incompatible | D13, D21 | Núcleo único `@qap/core` con paridad estricta entre MCP, CLI y CI. |
| `REQ-INT-001.2` | Interfaces | RNF (17/20) | Incompatible | D13, D14, D21 | Absorbe `REQ-ONB-001`, `M5`; empaquetado `npx`-first multiplataforma y `tsc` estricto. |
| `REQ-INT-001.3` | Interfaces | RNF (18/20) | Ausente | D02 | Abstracción de almacenamiento/colas lista para self-hosted concurrente. |
| `REQ-INT-001.4` | Interfaces | RNF (19/20) | Parcial | D08, D10 | Absorbe `UTCP/OpenAPI`; registro formal de conectores/plugins opt-in versionados. |
| `REQ-XINST-001` | Añadido (1/5) | RF | Ausente | D07, D09, D20 | Consulta cross-instancia estrictamente read-only acreditada en destino, sin transferir credenciales. |
| `REQ-QA-001` | Añadido (2/5) | RF | Ausente | D03, D11, D17, D21 | Pruebas i18n: locale, zona horaria, moneda, truncamiento, claves faltantes y replay sin inferencia. |
| `REQ-QA-002` | Añadido (3/5) | RF | Ausente | D01, D08, D12, D21 | Validación de contrato API (tráfico observado y llamada directa) separada de persistencia. |
| `REQ-QA-003` | Añadido (4/5) | RNF (20/20) | Ausente | D21 | Auditoría de accesibilidad automatizada versionada (axe) + registro de chequeos manuales pendientes. |
| `REQ-AGT-001` | Añadido (5/5) | RF | Parcial | D13, D14, D21 | Adopción por agentes (registro MCP único, Skill breve, hooks informativos opt-in sin bloqueos globales). |
| **`REQ-AUTREP-001`** | **Promovido (`CAND-REP-001`)** | **RF (61)** | **Ausente** | **D11, D12, D21** | Validación funcional E2E de reportes PDF/Excel generados por el AUT (registro, fórmula/caché, totales). |
| **`REQ-RUN-002.1`** | **Promovido (`CAND-RUN-001`)** | **RF (62)** | **Ausente** | **D14, D15, D16, D21** | Preferencias en lenguaje natural persistidas por proyecto + fidelidad visual/recursos del AUT. |
| **`REQ-SEG-002.3`** | **Promovido (`CAND-SEG-001`)** | **RNF (21)** | **Ausente** | **D18, D19, D20** | Custodia técnica de evidencia privada: cifrado desde primera escritura, temporales, catálogo y supresión. |
| **`POL-CAP-001`** | **Política (`CAND-SEG-001` + Adic. 1)** | **POL (8)** | **Ausente** | **D18, D20** | Régimen de captura privada controlada: 3 modos, 4 permisos separados, vigencia ≤30 días, riesgo residual. |
| **`POL-RET-001`** | **Política (Adic. 2)** | **POL (9)** | **Incompatible** | **D19** | Historial permanente, detalle 90 días, knowledge sin caducidad, poda auditable y TTL operativos ratificables. |

### 2.4 Contradicciones, ambigüedades e inviabilidades detectadas en el catálogo actual

1. **`REQ-RUN-001.3` incompleto frente a D12:** el texto original pide estructura tripartita (`technical_status`, `functional_verdict`, `cleanup_status`), mientras D12 exige un cuarto eje independiente (`evidence_health`). *Resolución:* formalizar la estructura **cuatripartita** en el contrato de G0.
2. **`REQ-MEM-002.1` vs. D02/D05:** el vector histórico tiene 8 tuplas `(project, app, instance, env, tenant, role, version, config_rev)` y omite `profile_id` y `visual_variant` explícitos. *Resolución:* incluir `profile_ref` (opaco) y `visual_variant` como dimensiones de primera clase en `ScopeVector`.
3. **Duplicidad entre `CAND-SEG-001` y «Política adicional: Captura privada controlada»:** ambos describen las mismas reglas de D18 (vigencia ≤30 días, 4 permisos, 3 modos, supresión). *Resolución:* separar limpiamente **norma de negocio/gobernanza** (`POL-CAP-001`) de **control técnico verificable** (`REQ-SEG-002.3`), eliminando redundancia.
4. **Ambigüedad de `REQ-QA-003` (accesibilidad) en lanzamiento:** `catalogo-requisitos.md:839` indica «Cobertura y prioridad de lanzamiento pendientes de ratificación», mientras D21 no lo degrada explícitamente. *Resolución:* incluir `REQ-QA-003` como capacidad opt-in por campaña en el lanzamiento con motor versionado (`@axe-core/playwright`) y someter únicamente el nivel de cobertura obligatoria en G6 a ratificación empresarial.
5. **Inviabilidad literal en `REQ-DOC-001.1` / `CAND-REP-001` si se supone recálculo nativo de Excel sin restricciones:** ninguna librería Node.js bajo licencia permisiva recalcula el 100 % de las funciones de Excel. *Resolución:* ver Sección 5.C (distinción estricta entre fórmula, valor cacheado, recálculo acotado y abstención explícita).

---

## 3. Resolución de los tres candidatos adicionales

| Candidato | Decisión arquitectónica | ID definitivo | Justificación técnica y trazabilidad |
|---|---|---|---|
| **`CAND-REP-001`** *(Validación funcional de reportes PDF/Excel)* | **Convertir en Requisito Funcional independiente** | **`REQ-AUTREP-001`** | D11 lo declara obligatorio desde el lanzamiento y **explícitamente distinto** de `REQ-DOC-001.1` (ingesta de manuales) y `REQ-REP-001.1–001.4` (reportes internos de QAP). Posee un flujo E2E propio (navegación → filtros/fechas/agrupaciones → descarga → parsing tabular multipágina/multihoja → distinción fórmula/caché → conciliación registro a registro → abstención) que no encaja como sub-cláusula de otro ID. |
| **`CAND-RUN-001`** *(Preferencias de ejecución y fidelidad del AUT)* | **Convertir en Requisito Funcional independiente (con invariante de calidad)** | **`REQ-RUN-002.1`** | Cubre D14 y D15 en dos dimensiones ausentes en el catálogo previo: (1) configuración conversacional persistida por proyecto (visible/segundo plano, navegador, grabación, perfil de recursos) sin preguntas repetitivas; (2) invariante de fidelidad visual y de recursos (CSS, JS, imágenes, fuentes, hidratación SPA) que prohíbe degradaciones silenciosas en modo headless. |
| **`CAND-SEG-001`** *(Autorización y custodia del ciclo de evidencia privada)* | **Desdoblar en 1 RNF técnico + 1 Política operativa (absorbiendo Política Adicional 1)** | **`REQ-SEG-002.3`** (RNF) + **`POL-CAP-001`** (POL) | Evita duplicar la tabla de políticas adicionales y separa lo que gobierna el propietario (`POL-CAP-001`: vigencia ≤30 días, 4 permisos independientes, 3 modos, aceptación de riesgo residual) de los controles implementables y falsables en E6 (`REQ-SEG-002.3`: cifrado desde primera escritura, aislamiento de temporales, catálogo confinado, supresión fail-closed). |

---

## 4. Matriz de cobertura de D01–D21

Todas las decisiones del acta **D01–D21** quedan cubiertas por requisitos explícitos y verificables tras incorporar los elementos promovidos:

| Decisión | Resumen normativo del propietario | Requisitos y políticas que la cubren | Compuertas | Brechas actuales en `develop` / Enmiendas requeridas |
|---|---|---|---|---|
| **D01** | Producto real, autónomo, listo para QA empresarial (no MVP) | `REQ-CAM-001.1`, `REQ-CAS-001.2`, `REQ-ORA-001.1–001.7`, `REQ-AUTREP-001`, `REQ-RUN-002.1`, `REQ-QA-001–003` | G4, G6 / E3–E8 | `develop` sigue atado a compuertas humanas y humo estructural. |
| **D02** | Local primero, SQLite candidato, listo para PostgreSQL | `REQ-MEM-002.1`, `REQ-MEM-003.6`, `REQ-INT-001.3`, `REQ-SEG-001.2` | G0, G1, G5 / E1, E2 | 6 SQLites acoplados a `node:sqlite` sin puerto común. |
| **D03** | Modos `HOST` y `DETERMINISTIC` iniciales; `MANAGED` diferido | `REQ-MEM-002.3–002.4`, `REQ-IA-001.1–001.6`, `REQ-CAM-001.4`, `REQ-DIS-001.8` | G1, G4 / E3, E7 | Sin proceso ejecutor soberano ni cola de razonamiento. |
| **D04** | Autonomía integral sin aprobación humana ordinaria por caso | `REQ-DIS-001.1`, `REQ-CAS-001.1`, `REQ-CAM-001.1–001.5`, `REQ-PLN-001.2–001.3`, `REQ-REG-001.1` | G1, G4, G6 / E3, E4, E8 | `test.handler.ts:484` exige `verifyCaseApproval`. |
| **D05** | Memoria persistente, separación epistémica y continuidad multi-agente | `REQ-MEM-001.1–003.5`, `REQ-DIS-001.2/7`, `REQ-CAS-001.3–001.5`, `REQ-REG-001.1–001.3` | G1, G2, G4, G5 / E2–E5 | Memoria fragmentada en 6 SQLites + `.qa/`; `ImpactAnalyzer` e `HistoryManager` huérfanos. |
| **D06** | Flujos E2E multimódulo y multirol con datos y limpieza | `REQ-PLN-001.1/4–6`, `REQ-CAS-001.2`, `REQ-RUN-001.1–001.4`, `REQ-DAT-001.1–001.4`, `REQ-CAM-001.2` | G3, G4, G6 / E4, E5, E8 | `FlowOrchestrator` ignora `depends_on`; sin `DataPlan`. |
| **D07** | Escrituras solo en QA autorizado; producción solo lectura acreditada | `REQ-SEG-001.1–001.3`, `REQ-DAT-001.3–001.4`, `REQ-ORA-001.5`, `REQ-RUN-001.5` | G1, G3 / E2, E4, E5 | MCP bloquea todas las mutaciones; CLI permite todas sin política. |
| **D08** | UTCP, OpenAPI y preparación de datos por contrato (sin exigir BD AUT) | `REQ-DAT-001.1–001.4`, `REQ-INT-001.4`, `REQ-QA-002` | G0, G3, G4 / E1, E4, E5 | Ausente; requiere puerto común y validación OpenAPI 3.0–3.2 / UTCP. |
| **D09** | Consultas cross-instancia solo lectura acreditada, sin transferir credenciales | `REQ-XINST-001`, `REQ-MEM-002.1/5`, `REQ-SEG-001.1–001.2` | G0, G2, G3 / E2, E4, E5 | Ausente como contrato integrado. |
| **D10** | Ingesta corporativa desde lanzamiento (PDF, DOCX, Excel, MD, TXT, JSON, YAML, OpenAPI) | `REQ-DOC-001.1–001.4`, `REQ-INT-001.4` | G2, G6 / E4, E8 | Solo regex sobre texto/MD; `docPath` bloqueado en MCP. |
| **D11** | Validación funcional de reportes PDF y Excel emitidos por el AUT | **`REQ-AUTREP-001`**, `REQ-DOC-001.2`, `REQ-ORA-001.2–001.7`, `REQ-QA-001` | G2, G3, G4, G6 / E4, E5, E8 | Ausente; requiere contrato de fórmulas vs caché y conciliación por registro. |
| **D12** | Oráculos veraces, 4 ejes separados, independencia de testigos, cero falsos PASS | `REQ-ORA-001.1–001.7`, `REQ-RUN-001.3–001.4`, `REQ-REP-001.1` | G3, G5, G6 / E5, E7, E8 | `navigate` ignora 4xx/5xx; CLI marca `not_run` como `passed`. |
| **D13** | Agnóstico de proveedor IA, MCP + CLI, paridad y adopción sin bloqueos globales | `REQ-INT-001.1–001.2`, `REQ-IA-001.1/5`, `REQ-AGT-001`, `REQ-MEM-002.4` | G1, G4, G5, G6 / E1, E3, E7, E8 | SDK MCP v1.x desfasado; divergencia severa MCP vs CLI. |
| **D14** | Windows, macOS, Linux; navegadores bajo demanda y capacidades verificadas | `REQ-INT-001.2`, **`REQ-RUN-002.1`**, `REQ-REP-001.1` (`M4`/`M5`) | G1, G3, G5, G6 / E1, E6, E7, E8 | Diálogos solo `win32`; *skew* de versiones `playwright-core`. |
| **D15** | Ejecución visible/segundo plano por lenguaje natural y fidelidad visual íntegra | **`REQ-RUN-002.1`**, `REQ-DIS-001.3–001.4`, `REQ-RUN-001.1`, `REQ-REP-001.1` (`M3`) | G2, G3, G5 / E4, E6, E7 | `crawler/service.ts:199-214` aborta `fetch`/XHR/fuentes/imágenes. |
| **D16** | Eficiencia de recursos, concurrencia controlada y hardware medido | `REQ-CAM-001.3`, `REQ-RUN-001.1/5`, `REQ-MEM-003.5`, `REQ-DIS-001.3`, **`REQ-RUN-002.1`** | G3, G4, G6 / E3, E5, E7, E8 | Runner secuencial con `BrowserContext` compartido; sin perfilador reproducible. |
| **D17** | i18n con HOST para razonamiento y replay determinista sin APIs extra | `REQ-QA-001`, `REQ-DOC-001.1`, `REQ-IA-001.1–001.2`, `REQ-ORA-001.4` | G2, G3, G4, G6 / E4, E5, E8 | Ausente; pendiente decisión técnica de localización propia de QAP (resuelta en Sec. 6). |
| **D18** | Captura multimedia privada controlada, 3 modos, 4 permisos, supresión y riesgo residual | **`POL-CAP-001`**, **`REQ-SEG-002.3`**, `REQ-SEG-001.1–001.3/002.1`, `REQ-REP-001.1`, `REQ-RUN-001.6` | G0, G1, G3, G5, G6 / E2, E5, E6, E8 | AS-04 experimental no integrado; falta cifrado desde primera escritura y cobertura OOPIF. |
| **D19** | Historial permanente, detalle 90 días, knowledge sin caducidad, retención inteligente | **`POL-RET-001`**, `REQ-MEM-003.3–003.5`, `REQ-REP-001.1–001.4` | G1, G3, G5 / E2, E5, E6, E7 | `qap_prune` MCP con `dryRun` ficticio y fuga de handle SQLite. |
| **D20** | Secretos fuera de MCP/chat, sesiones protegidas, revocación y visor confinado | `REQ-SEG-001.1–001.3`, `REQ-SEG-002.1–002.2`, **`REQ-SEG-002.3`**, `REQ-MEM-002.5` | G0, G1, G3, G5 / E2, E5, E6 | `server.ts:277` permite lectura arbitraria; `host-composition.ts:390` expone secretos en MCP. |
| **D21** | Aceptación real con custodia ciega, métricas separadas y cero vetos críticos | Todos los requisitos de lanzamiento + `E1–E8` + `V-01–V-18` | G6 / E1–E8 | Falta calibración de denominadores, corpus ciego y criterios cuantificables cerrados. |

---

## 5. Hallazgos nuevos, ordenados por severidad

*(No se repiten H01–H11 ni H-REV-01–H-REV-06 salvo cuando la auditoría sobre `ea804a5b` y documentación oficial aporta evidencia nueva que modifica el diseño.)*

| ID | Severidad | Requisito(s) afectado(s) | Evidencia verificada | Consecuencia | Propuesta de resolución |
|---|---|---|---|---|---|
| **HN-01** | **Crítica** | `REQ-AUTREP-001` (D11), `REQ-DOC-001.1–001.2` (D10) | [`ExcelJS`](https://github.com/exceljs/exceljs) preserva fórmulas y resultados cacheados pero **no recalcula** fórmulas en proceso; [`HyperFormula`](https://handsontable.com/docs/hyperformula/guide/licensing.html) usa licencia **GPLv3 / comercial**, incompatible con la licencia `ISC` declarada en `package.json:19`. | Si un AUT exporta `.xlsx` con fórmulas sin `<v>` cacheado (común en librerías server-side), QAP no puede evaluar totales ni celdas calculadas sin infringir licencia o emitir falsos resultados. | Leer fórmulas y valores cacheados con `exceljs`; añadir un evaluador determinista acotado con licencia permisiva (MIT/Apache-2.0) para funciones financieras/agregación comunes, más una regla estricta: si falta `<v>` y la fórmula excede el subconjunto verificado, emitir `INDETERMINATE (unverified_formula_without_cache)` salvo recálculo opt-in vía motor externo acreditado (p. ej. LibreOffice Calc headless aislado). |
| **HN-02** | **Crítica** | `REQ-SEG-002.3`, `POL-CAP-001` (D18), `REQ-RUN-002.1` (D14) | Documentación oficial de Playwright confirma que [CDP Sessions son exclusivas de Chromium](https://playwright.dev/docs/api/class-browser) y [`page.screencast`](https://playwright.dev/docs/api/class-screencast) en Firefox/WebKit captura hasta 25 fps sin hooks CDP de nivel de compositor. Además, `AS-04` probó fuga SPA→MFA sin tráfico HTTP, y los *iframes* fuera de proceso (OOPIF) pueden pintar antes de que un observador del documento padre reaccione. | Prometer captura privada protegida uniforme en todos los motores (Chromium, Firefox, WebKit) es técnicamente falso y generaría fugas de MFA/SSO o falsas promesas de cumplimiento. | Definir una **matriz explícita de capacidades certificadas por motor**: captura `PRIVATE_AUTHORIZED` y `VERIFIED_STRICT` habilitada inicialmente solo en Chromium/Chrome/Edge donde exista guarda preventiva verificable con canarios desde el primer cuadro; en Firefox/WebKit o superficies con OOPIF/SSO/MFA no instrumentables, forzar **`MANDATORY_SUPPRESSION`** (fail-closed) con registro explícito del motivo. |
| **HN-03** | **Alta** | `REQ-INT-001.2` (D13/D14), `REQ-AGT-001`, `REQ-IA-001.1` | En `ea804a5b`, `package.json` y `packages/*/package.json` muestran **triple *skew* de `playwright-core`** (`^1.49.0` en `playwright-adapter`, `^1.62.1` en `auth`/`mcp`/`playwright-runner`, `1.63.0` en `cli` y raíz), **`@playwright/mcp: ^0.0.80` sin ningún `import`** en todo `src/`, y [`@modelcontextprotocol/sdk` `^1.30.1`](https://www.npmjs.com/package/@modelcontextprotocol/sdk) (línea v1.x en mantenimiento hasta enero 2027, sin soporte para la especificación vigente [`2026-07-28`](https://ts.sdk.modelcontextprotocol.io/v2/)). | Incompatibilidad de APIs (`page.screencast` requiere ≥1.59, `page.ariaSnapshotJSON` requiere ≥1.63), descargas duplicadas de binarios de navegador y ruptura con clientes MCP que adopten `2026-07-28`. | En G0: unificar `playwright-core` a una versión exacta única (≥1.63.0) vía catálogo `pnpm`, eliminar `@playwright/mcp` y planificar migración en G1 a [`@modelcontextprotocol/server` v2](https://ts.sdk.modelcontextprotocol.io/v2/protocol-versions.html) (`serveStdio`) con negociación dual `2025-11-25` + `2026-07-28`. |
| **HN-04** | **Alta** | `REQ-SEG-002.1` (D20), `REQ-INT-001.2` (D14) | `gemini-neon-etapa-3.md:695` y el diseño previo mencionan `keytar`, pero [`github/node-keytar`](https://github.com/github/node-keytar) está **oficialmente archivado y deprecado**. Su reemplazo moderno [`@napi-rs/keyring`](https://npmjs.com/package/@napi-rs/keyring) (`1.1.3+`) documenta un riesgo crítico en Linux: si falta `secret-service` (entornos headless/CI), **cae silenciosamente a `keyutils` en memoria**, perdiendo credenciales al reiniciar. | Dependencia nativa abandonada o pérdida silenciosa de credenciales/sesiones en Linux CI y servidores sin escritorio. | Sustituir cualquier referencia a `keytar` por `ISecretVault` con dos adaptadores explícitos: (1) `@napi-rs/keyring` exigiendo backend persistente (`secret-service` en Linux, Keychain en macOS, Credential Manager en Windows) sin fallback silencioso a memoria; (2) bóveda cifrada local AES-256-GCM (`PortableCredentialVault` endurecida) con KEK desde variable/proveedor de secretos en CI sin TTY. |
| **HN-05** | **Alta** | `REQ-DOC-001.1` (D10), `REQ-DAT-001.2` / `REQ-QA-002` (D08) | Para DOCX, [`mammoth`](https://www.npmjs.com/package/mammoth) (`1.13.0`) sufrió **CVE-2025-11849** (directory traversal vía relaciones externas `r:link` en versiones `< 1.11.0`, [análisis de seguridad](https://safeguard.sh/resources/blog/mammoth-npm)). Para OpenAPI 3.0→3.1/3.2, [`@scalar/openapi-parser`](https://openapis.org/blog/2025/10/01/openapi-initiative-newsletter-september-2025/) tiene un defecto abierto ([`scalar#9694`](https://github.com/scalar/scalar/issues/9694), julio 2026) que deja `nullable: true` sin normalizar en `$ref`/`allOf`. | Riesgo de lectura arbitraria de archivos al ingerir DOCX de terceros y falsos fallos de esquema al validar APIs OpenAPI 3.0 corporativas. | Fijar `mammoth >= 1.13.0` con resolución externa deshabilitada y sandbox de lectura de ZIP; añadir un normalizador propio previo a validación de esquemas para `nullable` en `$ref`/`allOf` de OpenAPI 3.0 y probar con fixtures 3.0/3.1/3.2 en EXP-05. |
| **HN-06** | **Alta** | `REQ-MEM-003.6` (D02), `REQ-INT-001.2` (D14) | El código en `develop` importa `node:sqlite` en **40+ archivos**, pero la documentación oficial de Node.js clasifica [`node:sqlite`](https://beta.docs.nodejs.org/sqlite) como `Stability: 1.2 - Release candidate` (requiere Node ≥22.12; estabilizado operativamente en Node 24 LTS, mientras Playwright 1.63 exige [Node 22, 24 o 26](https://playwright.dev/docs/release-notes)). Sin embargo, `package.json` raíz **no declara campo `engines`** y `AGENTS.md` contradice el requisito de Node 22+. | Fallos opacos al ejecutar `npx` en máquinas con Node 20 LTS y ausencia de contrato de versión mínima de runtime. | Declarar `"engines": { "node": ">=22.12.0" }` (recomendado **Node 24 LTS**) en raíz y paquetes publicados, añadir verificación temprana en `qap doctor` y encapsular `node:sqlite` detrás de `IQapRepository` para permitir cambiar a `better-sqlite3` o PostgreSQL sin tocar el dominio. |
| **HN-07** | **Media** | `REQ-REP-001.1`, `REQ-SEG-001.1` (D18/D20) | `packages/reporter/src/server/server.ts:315` emite `Cache-Control: public, max-age=3600` sobre `/artifacts/*` además del `Access-Control-Allow-Origin: *` (línea 59). | Aunque se corrija el *path traversal* (`isAbsolute`), `Cache-Control: public` permite que proxies o cachés compartidas del navegador retengan evidencias privadas tras revocación. | Cambiar obligatoriamente a `Cache-Control: private, no-store` para evidencias privadas (`PRIVATE_AUTHORIZED`) y `no-cache` validado por sesión local para el visor autenticado. |
| **HN-08** | **Media** | `REQ-MEM-003.5`, `POL-RET-001` (D19) | `catalogo-requisitos.md` y `acta-decisiones.md` permiten retención de evidencias de fallos «mínimo 14 días» y conservación indefinida de defectos abiertos, mientras **D18** fija vigencia de autorización de captura privada «hasta 30 días» con revocación inmediata. No existe regla de precedencia entre ambos plazos. | Conflicto normativo: una evidencia privada vinculada a un defecto abierto podría sobrevivir a la revocación o expiración de la autorización de captura/conservación. | Establecer regla de precedencia explícita en `POL-CAP-001` / `POL-RET-001`: **la revocación o expiración de la autorización de conservación privada prevalece siempre sobre la retención por defecto abierto**, purgando la media privada (conservando el veredicto, hash histórico y evento de poda). |
| **HN-09** | **Media** | `REQ-INT-001.2` (D14), `REQ-MEM-001.1` | `.codex-r2-concurrency-evidence/typescript-r3-final-diff.json` en `develop` registra **93 diagnósticos** (`baseline: 93, current: 93`), mientras `catalogo-requisitos.md:780` cita «142 errores `tsc`» y `evidencia-archivada.md:40` cita «144 diagnósticos». `package.json` raíz carece de script `typecheck`. | Inconsistencia numérica en la línea base de deuda técnica antes de G0. | En G0, ejecutar `tsc --noEmit` limpio sobre el SHA `ea804a5b` en CI, congelar el conteo exacto verificado como línea base de deuda heredada aislada y exigir **0 errores** en todo paquete nuevo desde el primer commit de G1. |

---

## 6. Arquitectura objetivo corregida, con decisiones justificadas

### A. Autonomía, memoria y adopción por agentes

- **Garantías controladas por QAP vs. dependientes del HOST:**
  - *Controladas por QAP (deterministas y verificables):* persistencia durable en un único almacén (`IQapRepository`), separación epistémica de 4 planos, ejecutor soberano desacoplado del árbol de procesos del HOST (grupo de procesos POSIX en macOS/Linux, Job Object desacoplado o lanzador independiente en Windows), cola determinista que drena tareas autorizadas sin HOST conectado, cola de razonamiento pendiente con *leases* y *fencing* por generación monotónica, snapshot contextual compacto multi-host (`REQ-MEM-002.4`), paridad estricta MCP/CLI sobre `@qap/core` y verificación criptográfica SHA-256 de intentos oficiales (`REQ-IA-001.5`).
  - *Dependientes del HOST (no garantizables al 100 % por QAP):* calidad del razonamiento del LLM conectado, iniciativa del agente para invocar QAP antes de escribir scripts propios, respeto a límites de contexto y soporte de hooks/skills específicos de cada cliente ([Claude Code](https://code.claude.com/docs/en/commands), [Codex](https://learn.chatgpt.com/docs/hooks), [Gemini CLI](https://geminicli.com/extensions/), [Antigravity](https://antigravity.google/docs/hooks/)).
- **Estrategia de adopción sin interferir con herramientas legítimas (D13):**
  1. Registro único del servidor MCP por host sobre **SDK v2 (`@modelcontextprotocol/server`, `serveStdio`)** soportando `2025-11-25` y `2026-07-28`.
  2. **Skill canónica breve** instalada de forma idempotente que orienta la intención QA («Quiero probar…») hacia `qap_start` / `qap_status`.
  3. **Hooks informativos opt-in** (nunca bloqueos globales de shell, Python, `curl` ni suites unitarias de desarrollo) donde el host los soporte, con desinstalación limpia.
  4. **Invariante de acreditación:** solo un intento emitido por el runner canónico con digest verificado puede producir un `PASS` oficial en QAP; cualquier script externo carece de autoridad.
- **Reducción medible de tokens:** no se adoptan límites arbitrarios (150/200 tokens) como contrato previo; la arquitectura garantiza compresión estructural mediante `page.ariaSnapshotJSON()` acotado + snapshot contextual por campaña, y la reducción efectiva se mide con el tokenizer de cada host en **EXP-01/EXP-02**.

### B. Ejecución, navegadores y eficiencia

- **Matriz de selección de navegador y modalidad (D14/D15):**
  - Motor determinista único: **`playwright-core`** (versión fijada ≥1.63.0 en todo el monorepo).
  - **Chromium completo** (`chromium`): motor principal certificado para ejecución visible (`headed`), ejecución en segundo plano de máxima fidelidad (`channel: 'chromium'`, headless completo) y captura protegida (`VERIFIED_STRICT` / `PRIVATE_AUTHORIZED`).
  - **Chromium Headless Shell** (`chromium-headless-shell`, instalable vía `--only-shell` según [Playwright Browsers](https://playwright.dev/docs/browsers)): candidato ligero para ejecuciones en segundo plano sin grabación avanzada o tras acreditar equivalencia funcional/visual en **EXP-04/EXP-06**.
  - **Google Chrome y Microsoft Edge:** soportados mediante `channel: 'chrome'` / `'msedge'` usando binarios instalados en el equipo (sin descarga duplicada).
  - **Firefox y WebKit:** soportados para ejecución funcional/cross-browser bajo demanda; **no** se asume paridad de captura protegida ni de CDP (CDP es solo Chromium; `page.screencast` tiene techo de 25 fps en Firefox/WebKit). Si una prueba en Firefox/WebKit entra en superficie sensible sin guarda acreditada, aplica **`MANDATORY_SUPPRESSION`**.
  - **Instalación bajo demanda:** `qap doctor` diagnostica caché, proxy y CA corporativa; `qap setup` descarga únicamente el binario solicitado por perfil/proyecto en caché gestionada en Windows, macOS y Linux.
- **Preservación de fidelidad visual y SPA sin debilitar la política de red (D15):**
  - Sustituir el filtro destructivo de `crawler/service.ts:199-214` por una **política de red en dos capas**:
    1. *Capa de alcance y no-mutación:* bloquea orígenes no autorizados, rangos privados no permitidos (anti-SSRF) y cualquier petición mutativa (POST/PUT/PATCH/DELETE o GET clasificado como mutativo por política semántica), incluyendo redirecciones.
    2. *Capa de fidelidad de renderizado:* permite todos los recursos de presentación y ejecución autorizados dentro del alcance (CSS, JS/MJS con o sin extensión, fuentes `.woff2`/`.ttf`, imágenes, SVG, y `fetch`/XHR de lectura acreditada para hidratación SPA). Cualquier bloqueo de recurso se registra en el manifiesto como `resource_degradation_event` (prohibida la degradación silenciosa).
- **Coordinación agente ↔ planificador determinista para concurrencia (D16):**
  - El **agente (HOST)** propone prioridades, agrupaciones lógicas y preferencias de ejecución en lenguaje natural.
  - El **planificador determinista de QAP** aplica reglas duras no negociables: (1) grafo DAG de dependencias (`depends_on`), (2) etiquetas de conflicto de recursos/datos (`resource_lock_keys`, p. ej. misma entidad o tenant mutable), (3) aislamiento de sesiones/roles (`BrowserContext` limpio por caso; reutilización controlada de proceso `Browser` con reciclaje por umbral de memoria o cada $N$ contextos), y (4) regulador dinámico de admisión basado en RAM libre, presión de memoria, CPU y disco.
- **Método reproducible de perfilado de recursos y hardware (sin cifras inventadas):**
  - Ejecutar el benchmark automatizado **EXP-03/04** en tres perfiles de máquina documentados (SO, CPU física/lógica, RAM total, disco NVMe/SSD, versión exacta de Node y Playwright) sobre un corpus fijo (10 casos SPA + 3 flujos E2E + grabación WebM) con concurrencia $W \in \{1, 2, 4\}$ y $N \ge 5$ repeticiones por configuración.
  - Instrumentar cada corrida muestreando cada 500 ms: RSS acumulado del árbol completo de procesos (Node + navegadores + subprocesos), p50/p95/p99 de latencia, CPU %, retraso del *event loop*, pico de disco temporal, tokens consumidos (por tokenizer del host) y conteo de procesos residuales a los 5 s del cierre/aborto.
  - Derivar `RAM mínima` = $\lceil 1.35 \times \text{RSS}_{\text{p95}}(W=1) + \text{base SO} \rceil$ y `RAM recomendada` = $\lceil 1.35 \times \text{RSS}_{\text{p95}}(W_{\text{óptimo}}) + \text{base SO} \rceil$, fijando la concurrencia segura por defecto como el mayor $W$ con 0 fallos por OOM/timeout y degradación de latencia p95 ≤ 25 %.

### C. Documentación corporativa y validación funcional PDF/Excel

Se separan explícitamente dos subsistemas con puertos e invariantes distintos:

1. **Ingesta de documentación y acreditación de requisitos (`@qap/ingestion`, D10):**
   - **PDF:** [`pdfjs-dist`](https://www.pkgpulse.com/guides/unpdf-vs-pdf-parse-vs-pdfjs-dist-pdf-2026) (extracción con coordenadas X/Y por página para reconstruir tablas multipágina y encabezados repetidos, conservando localizador `doc_id#page=N&bbox=...`). Detección automática de páginas escaneadas (baja densidad de glifos + imagen de página completa) con ruta explícita de OCR local opt-in (`tesseract.js`) etiquetada con nivel de confianza; por debajo del umbral, marcar `unreadable_fragment` y **abstenerse** de inferir reglas.
   - **DOCX:** [`mammoth >= 1.13.0`](https://www.npmjs.com/package/mammoth) (parcheado contra [CVE-2025-11849](https://safeguard.sh/resources/blog/mammoth-npm), resolución de enlaces externos desactivada) + inspección directa XML OOXML cuando existan tablas complejas con celdas combinadas (`gridSpan`/`vMerge`).
   - **Excel:** [`exceljs`](https://github.com/exceljs/exceljs) recorriendo todas las hojas con localizador `sheet!A1:Z99`, preservando tipo de celda, formato numérico/moneda, fórmula y valor cacheado.
   - **Markdown/Texto/JSON/YAML:** parsers deterministas nativos con número de línea y ruta JSONPath/YAML.
   - **OpenAPI:** [`@scalar/openapi-parser`](https://openapis.org/blog/2025/10/01/openapi-initiative-newsletter-september-2025/) para Swagger 2.0 y OpenAPI 3.0/3.1/3.2 con parche normalizador previo para `nullable: true` sobre `$ref`/`allOf` ([`scalar#9694`](https://github.com/scalar/scalar/issues/9694)).
   - Salida obligatoria: grafo de fragmentos versionados con hash, procedencia, localizador y **reporte de cobertura de extracción** (`REQ-DOC-001.2`) + reconciliador de 4 estados (`REQ-DOC-001.3`).

2. **Validación funcional de reportes generados por el AUT (`@qap/report-validator`, D11 / `REQ-AUTREP-001`):**
   - **Pipeline en 5 etapas:** (1) Adquisición controlada (navegación al módulo de reportes, configuración de filtros/fechas/agrupaciones, descarga con hash SHA-256 y vínculo al intento); (2) Extracción estructurada (PDF tabular multipágina con unión de tablas continuadas; Excel multihoja separando explícitamente `formula_text`, `cached_value` y `display_format`); (3) Normalización tipada (fechas ISO con zona horaria del caso, monedas y decimales en aritmética decimal exacta `decimal.js`/`BigInt`, nunca IEEE-754); (4) Conciliación por clave de registro + totales contra **fuente de comparación autorizada** (UI secundaria, otro documento acreditado, regla de negocio calculada o API autorizada opcional — **nunca** exigiendo BD directa del AUT ni asumiendo independencia automática de una API); (5) Dictamen con localización exacta de cada discrepancia (fila, columna, hoja/página, clave de negocio, valor esperado vs. observado, tipo: faltante, duplicado, redondeo, filtro ignorado, fórmula inconsistente).
   - **Regla estricta de fórmulas Excel y abstención:** si una celda tiene fórmula sin valor cacheado y no está cubierta por el evaluador permisivo acotado (ni por recálculo opt-in acreditado), o si la extracción PDF/OCR pierde estructura tabular o falta fuente de comparación autorizada, el oráculo **se abstiene** (`INDETERMINATE` con código causal explícito).

### D. UTCP, OpenAPI y preparación de datos

- **Puerto común (`IExternalOperationPort` en `@qap/core`, D08):** desacopla la preparación y consulta de datos del protocolo subyacente. Toda operación ejecutable se registra como `OperationDescriptor` versionado (alcance, destino, esquema de entrada/salida, clasificación `read_only` vs `mutating`, soporte de idempotencia y estrategia de compensación/limpieza).
- **Conectores incluidos en el lanzamiento:**
  1. **Conector HTTP/OpenAPI nativo** (Swagger 2.0 / OpenAPI 3.0–3.2) con validación estricta de esquemas y cliente HTTP gobernado por política de red.
  2. **Conector UTCP** evaluado vía [`@utcp/sdk` (`typescript-utcp`)](https://github.com/universal-tool-calling-protocol/typescript-utcp) detrás del mismo puerto, condicionado a superar **EXP-05** en autenticación, manejo de errores y trazabilidad (si el SDK presentara brechas, el puerto permite adaptador propio de manuales UTCP HTTP sin cambiar contratos).
  3. **Mecanismo de extensibilidad futura (`REQ-INT-001.4`):** registro formal de plugins opt-in versionados (GraphQL, gRPC, conectores de dominio privados fuera del núcleo).
- **Invariantes operativos:**
  - *Autenticación y permisos:* referencias opacas al `ISecretVault`; validación por `(env, tenant, role, operation_id)` antes de cada envío; prohibido usar credenciales de staging en instancias de referencia (`REQ-XINST-001`).
  - *Idempotencia y reconciliación:* antes de emitir una mutación de `DataPlan`, persistir `OperationIntent` con clave lógica e `Idempotency-Key` (si el destino lo soporta). Ante pérdida de respuesta, consultar testigo de lectura autorizado antes de reintentar; si el estado sigue incierto, bloquear reintento, emitir `INDETERMINATE` y registrar reconciliación pendiente.
  - *Verificación de efectos:* **un HTTP 200/201 jamás acredita persistencia**; toda creación de prerrequisito exige verificación de efecto mediante testigo independiente (lectura posterior en contexto/sesión limpia o consulta acreditada).
  - *Limpieza y compensación:* ejecución inversa del DAG de `DataPlan` según política del entorno (`delete`, `compensate` o `confine_tenant`), con verificación post-limpieza y persistencia de `cleanup_status` independiente.

### E. Oráculos y resultados funcionales

- **Separación estricta de 4 ejes por intento (`REQ-RUN-001.3` + D12):**
  1. `technical_status`: `OK | HTTP_ERROR | NAV_ERROR | TIMEOUT | CRASH | ABORTED`.
  2. `functional_verdict`: `PASS | FAIL | INDETERMINATE | BLOCKED | SKIPPED | ERROR` (taxonomía cerrada única en MCP, CLI y reportes).
  3. `cleanup_status`: `NOT_REQUIRED | CLEANED | COMPENSATED | CONFINED | PENDING_CLEANUP | CLEANUP_FAILED`.
  4. `evidence_health`: `COMPLETE | DEGRADED_AUXILIARY | SUPPRESSED_BY_POLICY | MISSING_REQUIRED | TAMPERED`.
- **Niveles de testigo e independencia (generalizado sin acceso a BD del AUT):**
  - **N0 (Señal técnica):** HTTP 200/201, clic sin excepción, toast efímero. **Nunca acredita `PASS` funcional ni persistencia.**
  - **N1 (Estructural / mismo canal):** estado DOM/ARIA observable en la vista actual. Permite **`PASS_STRUCTURAL`** explícitamente etiquetado para comprobaciones de lectura/UI; **prohibido** para certificar persistencia o reglas críticas de negocio.
  - **N2 (Persistencia independiente):** lectura confirmada en un **contexto de navegador completamente limpio** (sin Service Worker, sin caché HTTP, sin `localStorage`/estado optimista del intento mutativo, con identidad verificada y evidencia de recarga desde servidor) O consulta por API/vista secundaria autorizada cuya procedencia no comparta el estado optimista de la mutación.
  - **N3 (Conciliación cruzada):** contraste entre ≥2 fuentes independientes o contra reglas matemáticas/contables acreditadas (p. ej. tabla UI + reporte PDF/Excel descargado + recálculo decimal exacto, o verificación pre/post de no-mutación en RBAC negativo).
- **Reglas anti-falso-PASS (lecciones de Recovery / Hydrogen R2):**
  - Un `technical_status = OK` jamás se traduce automáticamente a `functional_verdict = PASS`.
  - Si una navegación devuelve HTTP 4xx/5xx inesperado, la comprobación afectada no puede ser `PASS`.
  - En mutaciones (caso «HTTP 201 con rollback»): si un testigo N2/N3 contradice la persistencia → **`FAIL`**; si no existe testigo N2/N3 disponible o el testigo falla técnicamente → **`INDETERMINATE`** (nunca `PASS`, aunque N1 muestre éxito).
  - Si falta evidencia requerida para evaluar el oráculo (`MISSING_REQUIRED`), el veredicto nunca puede ser `PASS`.

### F. Seguridad y captura multimedia (AS-01, AS-02, AS-03 y AS-04)

- **Visor y catálogo (AS-01):** servidor loopback exclusivamente (`127.0.0.1`), token de sesión local obligatorio, CORS restrictivo al origen del visor (eliminando `*`), resolución estricta por `artifact_id` contra catálogo SQLite confirmado (eliminando rutas arbitrarias e `isAbsolute`), `Cache-Control: private, no-store`, soporte completo HTTP `GET`/`HEAD` + `Range` (`206 Partial Content` / `416 Range Not Satisfiable`) con MIME `video/webm`.
- **Git seguro (AS-02):** eliminar `execSync` con interpolación de strings; usar `execFileSync('git', ['diff', '--name-only', validatedRef])` tras validar la referencia con `git rev-parse --verify` y rechazar flags (`--`).
- **Secretos y sesiones multiplataforma (AS-03 / DP-03):**
  - Retirar `silentBoundScope: true` y `allowScopedCredentials` en MCP; rechazar en esquema y despacho cualquier campo `password`/`credentials`/`token`.
  - Alta fuera de banda en los 3 SO: (a) terminal interactiva sin eco (`qap auth add`), (b) diálogo local seguro o servicio loopback efímero de un solo uso con CSRF/Origin estricto y TTL corto cuando no haya TTY interactivo, y (c) proveedor de secretos/descriptor privado en CI sin TTY.
  - Almacenamiento en `ISecretVault` (`@napi-rs/keyring` con verificación de backend persistente + bóveda local AES-256-GCM endurecida para CI), sesiones cifradas en directorio separado de Knowledge, revocación durable con generación monotónica conectada a `AbortController` y fallo cerrado ante pérdida de sesión requerida.
- **Captura privada controlada y límites técnicos honestos (AS-04 / D18):**
  - **Tres modos normativos:** `VERIFIED_STRICT` (sin datos privados sensibles, enmascaramiento preventivo verificado), `PRIVATE_AUTHORIZED` (autorización ≤30 días, 4 permisos separados: capturar/acceder/conservar/exportar, cifrado autenticado AES-256-GCM desde la escritura en *staging* y excluido de exportaciones por defecto) y `MANDATORY_SUPPRESSION` (fail-closed sin grabación).
  - **Cifrado desde la primera escritura y recuperación ante caídas:** utilizar `page.screencast` (Chromium) canalizando los *chunks*/frames a través de un *pipe* en memoria hacia cifrado AES-256-GCM en flujo antes de tocar disco (o directorio temporal con permisos `0700` en volumen cifrado del SO cuando el códec requiera archivo intermedio, reconociendo explícitamente el riesgo residual si el disco del host no tiene FileVault/BitLocker/LUKS). El `StagingReconciler` reconcilia archivos huérfanos y transacciones SQLite incompletas al arrancar tras caída.
  - **Límites técnicos reales frente a AS-04 (SPA→MFA sin red y OOPIF):** una guarda de red, un observador post-render o un descarte posterior **no demuestran prevención**. Para superficies de autenticación (`login`, `MFA`, `SSO`), el mecanismo técnicamente alcanzable es **aislamiento total en un `AuthAcquisitionContext` sin grabación**. Para transiciones SPA intra-documento inesperadas a vistas sensibles durante una prueba ya autenticada, solo puede lograrse prevención si existe cooperación del AUT (atributos/clases sensibles estables inyectados antes del primer *paint* vía `addInitScript` + CSS preventivo) o mediante supresión fail-closed al detectar heurística sensible (deteniendo captura y descartando lógicamente el *staging* sin promoverlo). **No se promete destrucción física en SSD/snapshots/backups**; se garantiza eliminación lógica verificable, confidencialidad criptográfica preventiva y declaración explícita del riesgo residual en el acta de autorización.

### G. Historial y retención (D19)

- **Ratificado (inmutable en el lanzamiento):** resumen histórico permanente (hasta eliminación expresa), detalle de ejecuciones 90 días, exportación manual (`HTML`, `CSV`, `JSON/JSONL` + manifiesto verificable), archivo automático opcional configurable, y Knowledge canónico + casos activos sin caducidad automática.
- **Evaluación de plazos operativos propuestos (pendientes de ratificación empresarial):**
  - Multimedia exitosa ≤24 h, trazas exitosas ≤72 h y evidencias de fallos ≥14 días son **técnicamente adecuados** para controlar el crecimiento de disco local, siempre que se subordinen a tres reglas duras:
    1. **Precedencia de privacidad sobre retención (`HN-08`):** la revocación o expiración de una autorización de conservación privada purga la media privada inmediatamente, incluso si existe un defecto abierto vinculado.
    2. **Cuotas de disco configurables:** los defectos abiertos protegidos deben tener cuota máxima configurable (por proyecto/tamaño) con alerta al alcanzar el 80 % para impedir agotamiento de disco.
    3. **Integridad histórica tras la poda:** al podar un archivo físico, se conserva el veredicto original, el hash SHA-256 histórico y un registro `prune_event`, marcando el estado del artefacto como `EXPIRED_PRUNED`. **Un hash histórico acredita qué existió al ejecutarse, nunca sustituye la disponibilidad física del archivo eliminado.** Los reportes históricos deben abrirse íntegramente sin requerir `trace.zip`.
- **Poda única:** motor compartido por MCP y CLI con `dryRun` real (cero mutaciones, cero fugas de handle SQLite), ejecutado al iniciar el ejecutor soberano y cada 24 h mientras esté activo, protegiendo siempre ejecuciones en curso y publicaciones pendientes.

### H. Localización propia de QAP (cierre técnico de D17)

Para resolver la cuestión técnica pendiente de `acta-decisiones.md:430`: los códigos de estado, veredictos, razones causales y esquemas JSON/DTO de QAP serán **estables en inglés/identificador técnico** independientes del idioma. Las etiquetas visibles de los reportes HTML/Markdown y CLI de QAP se externalizarán en diccionarios locales versionados (`es` e `en` incluidos desde el lanzamiento, extensibles por archivo JSON), mientras que el razonamiento y las explicaciones conversacionales al usuario seguirán el idioma de la sesión en el HOST sin APIs adicionales.

---

## 7. Estrategia de conservación, corrección y sustitución de componentes

Contraste directo con los 10 paquetes reales en `develop` (`ea804a5b`, ~72,580 LOC en `src/`):

| Paquete / Componente real en `develop` | LOC (`src`) | Decisión | Justificación basada en evidencia de código |
|---|---:|---|---|
| `@qap/shared` (`epistemic-planes.ts`, contratos base, esquemas AJV) | 5,288 | **Conservar y ampliar** | Define `EpistemicPlane` y esquemas compartidos útiles; debe ampliarse a `@qap/contracts` incorporando `ScopeVector` completo, 4 ejes de resultado, `DataPlan` y taxonomía única de 6 veredictos. |
| `@qap/auth` (`portable-vault.ts`, `session-store.ts`, `auth-manager.ts`) | 1,959 | **Reestructurar y corregir** | `local-secret-prompt.ts:72` falla fuera de `win32` (PowerShell WPF). Conservar criptografía base de bóveda/sesiones; construir `ISecretVault` multiplataforma (`@napi-rs/keyring` + CI vault) y canales fuera de banda para macOS/Linux/CI. |
| `@qap/git-adapter` (`git-adapter.ts`) | 87 | **Corregir (G0)** | `git-adapter.ts:28` interpola `this.baseBranch` en `execSync`. Adoptar el diseño defensivo acreditado en el tag `AS-02` (`execFileSync` + validación de ref + errores explícitos) con pruebas negativas. |
| `@qap/knowledge` (`sqlite-knowledge-adapter.ts`, `file-storage.ts`, `impact-analyzer.ts`, `history-manager.ts`, `bva-generator.ts`, `rbac-generator.ts`) | 7,319 | **Reestructurar (conservar algoritmos, sustituir persistencia acoplada)** | `knowledge_revisions` tiene triggers inmutables válidos y `dependency-graph.ts` / `bva-generator.ts` / `rbac-generator.ts` contienen lógica reutilizable; pero `sqlite-knowledge-adapter.ts` carece de `tenant_id`, `file-storage.ts` mantiene `.qa/` mutable y `impact-analyzer.ts` / `history-manager.ts` tienen 0 consumidores. Retirar escritura `.qa/` tras corte seguro. |
| `@qap/engine` (`flow-orchestrator.ts`, `lifecycle.ts`, `ports.ts`) | 4,560 | **Sustituir núcleo / retirar legado** | `flow-orchestrator.ts:371-402` ignora `depends_on` y `execution_timeout_ms`; `lifecycle.ts` impone compuertas humanas contrarias a D04 y `RunnerLifecycle` está huérfano. Reemplazar por `@qap/core` con orquestador soberano, DAG unificado y doble carril. |
| `@qap/playwright-adapter` (`crawler/service.ts`, `crawler/dom.ts`, `network-observer`, `reconnaissance`) | 3,209 | **Sustituir extractor y corregir crawler** | `dom.ts:13-71` descarta etiquetas fuera de 9 palabras y no analiza `<table>`; `service.ts:199-214` aborta `fetch`/XHR/imágenes/fuentes; `network-observer` tiene 0 invocaciones; arrastra `@playwright/mcp` muerto y `playwright-core ^1.49.0`. Conservar lógica de checkpoints de frontera y reemplazar extractor por `ariaSnapshotJSON()` + DOM complementario + observador de red integrado. |
| `@qap/playwright-runner` (`runner.ts`, `provisional-execution.ts`, `evidence-artifacts.ts`, `actions/navigate.ts`, `case-execution-policy.ts`) | 3,736 | **Reestructurar severamente** | Conservar el patrón de publicación provisional (`provisional-execution.ts`); corregir `runner.ts:463` (contexto compartido → contexto limpio por caso), `navigate.ts:17` (validar HTTP status), `case-execution-policy.ts:5-8` (eliminar bloqueo incondicional BVA/RBAC), `evidence-artifacts.ts:881` (eliminar DDL SQLite duplicado) e integrar `AbortController` + `page.screencast` protegido. |
| `@qap/reporter` (`server/server.ts`, `template/index.html`, `generators/*`, `persistence/sqlite-client.ts`) | 4,045 | **Corregir vulnerabilidad en G0 y reestructurar en G1/G5** | `server.ts:59,277,315` tiene lectura arbitraria por `isAbsolute`, CORS `*`, `Cache-Control: public` y falta de HTTP Range; `template/index.html:19,1059` usa Tailwind CDN y `trace.mp4`. Confinar y corregir en G0; unificar DTO/manifiesto offline `file://` y reproductor WebM en G1/G5. |
| `@qap/mcp` (`server.ts` 6,223 LOC, `application-service.ts` 4,813 LOC, `host-composition.ts`, `handlers/*`) | 38,147 | **Descomponer y adelgazar (adaptador delgado)** | Concentra el 52 % de todo el código del monorepo con 6 SQLites distintos, `silentBoundScope: true` (`host-composition.ts:390`), `qap_prune` roto (`server.ts:4303`), `verifyCaseApproval` bloqueante y mezcla de `ToolDispatcher` con `switch` legacy. Extraer casos de uso a `@qap/core` y reconstruir `@qap/mcp` como adaptador delgado sobre SDK v2. |
| `@hyouka73/qap-cli` (`commands/test.ts`, `commands/report.ts`, `commands/prune.ts`, `commands/reindex.ts`) | 3,630 | **Sustituir comandos por delegación a `@qap/core`** | Diverge totalmente de MCP: `test.ts:210,230` emite falsos `passed` (`exitCode=0`), reintenta mutaciones sin reconciliación, carece de políticas y escribe directo a `.qa/`. Reescribir como adaptador delgado con paridad 100 % sobre `@qap/core` + `qap doctor`/`setup`. |
| **Componentes nuevos a construir desde cero** | — | **Construir desde cero** | `@qap/repository-sqlite` (puerto único `IQapRepository`), ejecutor soberano con IPC local autenticado, `@qap/ingestion` (PDF/DOCX/Excel/OpenAPI + OCR), `@qap/report-validator` (D11), `@qap/oracle-engine` (N1–N3 + decimal exacto), `@qap/testdata` (`DataPlan` + puerto UTCP/OpenAPI), `@qap/defects` (`DefectManager`), `@qap/regression` (drift + flakiness + reparación `vN+1`). |

*(Nota: los prototipos archivados en tags `AS-02`, `AS-04`, `qap-autonomous-mvp`, `Recovery` y `Hydrogen R2` **no** están integrados en `develop`; se usan exclusivamente como referencia de diseño y casos negativos, nunca para merge directo.)*

---

## 8. Registro actualizado de DP-01–DP-15

| DP | Tema | Clasificación actual | Resolución o siguiente acción concreta |
|---|---|---|---|
| **DP-01** | Elegibilidad ordinaria sin aprobación por caso | **Resuelta por el propietario** (D01/D04) | Elegibilidad automática por política y fuente acreditada; contrato de bloqueo parcial y preservación de recibos históricos en G0. |
| **DP-02** | Umbrales 80 % Discovery y 75 % efectos | **Pendiente de ratificación empresarial** | Se proponen denominadores exactos, umbrales calibrados y vetos críticos en la Sección 10 para ratificación antes de G6. |
| **DP-03** | Credenciales fuera de MCP/chat/prompts | **Resuelta por el propietario (D20) + Resuelta técnicamente** | Prohibición absoluta en MCP/chat; contrato multiplataforma vía `ISecretVault` (`@napi-rs/keyring` + CI vault) y alta por TTY/loopback efímero/CI secret provider. Validar en E2 (G1). |
| **DP-04** | Oráculos estructurales vs. persistencia | **Resuelta por el propietario (D12) + Resuelta técnicamente** | `PASS_STRUCTURAL` permitido para N1 etiquetado; persistencia y negocio crítico exigen N2/N3 acreditado; sin testigo suficiente → `INDETERMINATE`; HTTP 201 sin efecto con testigo → `FAIL`. |
| **DP-05** | Estrategias de limpieza/compensación | **Resuelta técnicamente (arquitectura) + Pendiente de ratificación por destino** | Motor soporta `delete`, `compensate` y `confine_tenant` configurables por entorno. La asignación específica para entornos reales (incluidas operaciones contables/irreversibles) se autoriza por proyecto. |
| **DP-06** | Modo `MANAGED` | **Resuelta por el propietario (D03)** | Diferido a fase posterior; solo se define el puerto `IReasoningProvider` en el lanzamiento. |
| **DP-07** | PostgreSQL concurrente y puerto de repositorio | **Resuelta por el propietario (D02) + Resuelta técnicamente** | Local SQLite en lanzamiento (`node:sqlite` sobre Node ≥22.12 / 24 LTS) detrás de `IQapRepository` con transacciones, FTS y migraciones portables; adaptador PostgreSQL diferido a fase posterior. |
| **DP-08** | Formatos documentales y reportes PDF/Excel | **Resuelta por el propietario (D10/D11) + Resuelta técnicamente** | Todos los formatos de D10 y validación de reportes D11 son obligatorios desde el lanzamiento. Stack definido en Sec. 5.C (`pdfjs-dist`, `mammoth >= 1.13`, `exceljs` + evaluador permisivo/abstención, `@scalar/openapi-parser`, `tesseract.js` opt-in). |
| **DP-09** | Precedencia de identidad de `tenant_id` | **Resuelta técnicamente con fundamento** | Precedencia fija: (1) perfil/sesión acreditada del destino → (2) señal observable verificada del destino → (3) declaración explícita del operador; si el alcance requiere tenant y no hay certeza, **bloquear** (`BLOCKED`). |
| **DP-10** | Composición y custodia de batería ciega | **Pendiente de ratificación empresarial** | Se propone corpus de 4 perfiles ciegos y protocolo de custodia independiente en la Sección 10 para ratificación antes de G6. |
| **DP-11** | Adopción y hooks por host | **Resuelta por el propietario (D13) + Pendiente de experimento (EXP-01)** | Descartados bloqueos globales; estrategia = registro MCP v2 + Skill breve + hooks informativos opt-in. Medir adopción real por host en EXP-01 (G1/G4). |
| **DP-12** | Navegadores, modalidades y motor ligero | **Resuelta por el propietario (D14/D15) + Pendiente de experimento (EXP-03/04/06)** | 3 SO obligatorios; Chromium completo como línea base segura; Chromium Headless Shell como candidato ligero sujeto a EXP-04/06; Firefox/WebKit con `MANDATORY_SUPPRESSION` en superficies sensibles. |
| **DP-13** | UTCP y OpenAPI | **Resuelta por el propietario (D08) + Pendiente de experimento (EXP-05)** | Ambos en el lanzamiento detrás del puerto común `IExternalOperationPort`; la selección final de `@utcp/sdk` vs. adaptador propio ligero se cierra en EXP-05 (G0/G3). |
| **DP-14** | Consultas cross-instancia de solo lectura | **Resuelta técnicamente (contrato) + Pendiente de ratificación por destino** | Identidad separada de solo lectura impuesta por el destino + lista de operaciones acreditadas en QAP; si el destino no garantiza lectura segura, usar exportación sanitizada o declarar `BLOCKED`. |
| **DP-15** | Secuencia de experimentos | **Resuelta técnicamente con fundamento** | Se rechaza bloquear G0 con los 6 experimentos a la vez. Solo los contratos mínimos de EXP-01 (dialectos MCP) y EXP-05 (puerto `DataPlan`/UTCP) condicionan G0/G1; los demás se ejecutan justo antes de congelar su componente (ver Sección 9). |

---

## 9. Experimentos pendientes, justificación y fase de ejecución

| Experimento | Qué valida / decisión que habilita | Fase de ejecución | Criterio de salida verificable |
|---|---|---|---|
| **EXP-01 · Adopción y dialectos MCP** | Interoperabilidad real de `@modelcontextprotocol/server` v2 (`2025-11-25` + `2026-07-28`) en Antigravity, Codex, Claude Code y Gemini CLI; tasa de enrutamiento QA (MCP solo vs. MCP + Skill vs. + hook informativo opt-in); cero bloqueos de suites unitarias; medición de tokens por tokenizer. | **G1** (interoperabilidad base) y **G4** (adopción completa) | 100 % handshake y llamadas válidas en los 4 hosts; ≥90 % primera acción QA hacia QAP con Skill en sesiones limpias (muestra ≥10 por host); 0 interferencias en suites unitarias. |
| **EXP-02 · Extractor Discovery SPA** | Comparativa en mismo corpus SPA (tablas, filtros, paginación, modales, iframes, i18n) entre `page.ariaSnapshotJSON()` + DOM complementario, extractor actual y comparadores externos (`@playwright/cli` / `agent-browser`). | **Inicio de G2** (antes de implementar `@qap/discovery`) | ≥95 % recuperación de controles/tablas/etiquetas respecto al inventario de referencia con menor consumo de tokens y 100 % reproducibilidad de localizadores. |
| **EXP-03 · Concurrencia, aislamiento y perfilado hardware** | Benchmark reproducible en Windows, macOS y Linux con concurrencia $W \in \{1, 2, 4\}$, contexto limpio vs. reciclaje de navegador, inyección de fallos y cortes. Genera la tabla empírica de RAM mínima/recomendada, CPU y disco (D16). | **G3** (antes de activar paralelismo por defecto) | 0 fugas de cookies/storage entre casos; 0 procesos huérfanos a los 5 s del cierre/aborto; informe reproducible de hardware mínimo y recomendado por modalidad. |
| **EXP-04 · Empaquetado limpio y navegadores bajo demanda** | Instalación `npx` limpia en los 3 SO, `qap doctor`/`setup`, descarga bajo demanda, caché gestionada, proxy/CA corporativa, comparación Chromium completo vs. `chromium-headless-shell` en fidelidad visual y recursos. | **G1** (smoke 3 SO) y **G5** (distribución final) | 0 errores de instalación en Windows/macOS/Linux; 0 degradación visual silenciosa (CSS/JS/fuentes/imágenes intactos) en el modo recomendado por defecto. |
| **EXP-05 · UTCP/OpenAPI y lectura cross-instancia** | Comparativa de `@utcp/sdk` vs. cliente HTTP gobernado sobre OpenAPI 3.0/3.1/3.2 (incluyendo `nullable $ref`), preparación `cliente → contrato → solicitud`, corte tras mutación, reconciliación, limpieza inversa e inmutabilidad de instancia de referencia. | **Final de G0 / Inicio de G3** (antes de congelar `@qap/testdata`) | 0 duplicaciones tras corte en mutación; 0 mutaciones en instancia de referencia (verificado por testigo independiente); decisión documentada de SDK UTCP. |
| **EXP-06 · Captura privada preventiva, PDF/Excel y accesibilidad** | Canarios sintéticos desde el primer cuadro en transiciones SPA→MFA, iframes/OOPIF y caídas; cifrado en flujo de temporales; decodificación WebM + HTTP Range + `file://` trasladado; coste de `@axe-core/playwright`; precisión de extracción tabular PDF/Excel con fórmulas sin caché. | **G3** (captura y PDF/Excel) y **G5** (export offline) | 0 canarios visibles en WebM/PNG/trazas/export; activación correcta de `MANDATORY_SUPPRESSION` ante fallo de guarda; 100 % detección de mutantes sembrados en reportes PDF/Excel y abstención correcta sin caché. |

---

## 10. Criterios de aceptación definitivos propuestos (Producto real, no MVP)

Las compuertas **G0–G6** y pruebas **E1–E8** del `plan-maestro.md` se conservan en su estructura, reforzadas con los siguientes criterios cuantificables y condiciones de veto para el producto final (sustituyendo referencias informales de MVP):

### 10.1 Corpus ciego independiente (E8 / G6)

Un custodio independiente (sin participación en la implementación de QAP) congela **4 aplicaciones desconocidas** (o 3 aplicaciones ricas que cubran conjuntamente los 4 perfiles) con inventarios de referencia y defectos sembrados:
1. **App A (Web transaccional clásica):** formularios complejos, validaciones de negocio, tablas con filtros/paginación y exportación PDF/Excel.
2. **App B (SPA asíncrona multi-estado):** enrutamiento cliente, hidratación vía `fetch`/XHR, modales, vistas con misma URL y distintos estados, i18n en ≥2 locales.
3. **App C (Empresarial multirol y multimódulo):** ≥3 módulos encadenados (p. ej. alta → configuración → aprobación → contrato → reporte), ≥2 roles con RBAC estricto, reglas decimales/monetarias y APIs documentadas (OpenAPI/UTCP).
4. **App D (Adversarial / mutantes controlados):** incluye obligatoriamente «HTTP 201 con rollback», «403 con mutación oculta», «error de 1 centavo en reporte Excel/PDF», «transición SPA a vista MFA con canario visual» y «ruta GET con efecto secundario en instancia de referencia».

### 10.2 Métricas, denominadores y umbrales propuestos para ratificación

| Dimensión | Denominador explícito | Umbral propuesto | Tratamiento de bloqueos e indeterminados |
|---|---|---|---|
| **Cobertura Discovery (ciego)** | Rutas/estados alcanzables dentro del alcance autorizado en el inventario de referencia (excluyendo únicamente rutas fuera de alcance o sin credenciales provistas). | **≥ 85 % por app y ≥ 85 % agregado** *(calibrable desde el 80 % candidato)* | Las rutas bloqueadas por política legítima se excluyen del denominador **solo** si el bloqueo coincide con la política declarada; cualquier otra omisión penaliza el numerador. |
| **Flujos E2E multimódulo/multirol** | Total de flujos E2E de referencia (≥3 módulos, ≥2 roles, transferencia tipada de datos). | **100 % ejecutados end-to-end** con preparación, verificación de efectos y limpieza/compensación. | Un bloqueo no justificado o pérdida de transferencia cuenta como fallo. |
| **Verificación real de efectos** | Casos mutativos de referencia en entornos QA mutables autorizados (separado del denominador de Discovery). | **≥ 85 % acreditados con testigo N2/N3** *(calibrable desde el 75 % candidato)* | Casos `INDETERMINATE` se reportan en columna propia y **no** cuentan como verificados ni como `PASS`. |
| **Detección de defectos desconocidos** | Defectos funcionales, RBAC, cálculo y reportes sembrados en el corpus ciego. | **≥ 90 % detectados como `FAIL`** (100 % en defectos críticos de persistencia/rollback y 1 centavo). | Un defecto sembrado reportado como `PASS` dispara veto automático. |
| **Reportes PDF/Excel (D11)** | Corpus de reportes PDF multipágina y Excel multihoja con mutantes (fila faltante, duplicado, filtro ignorado, redondeo, fórmula sin caché). | **100 % detección de mutantes sembrados** + **100 % abstención correcta** ante extracción insuficiente o fórmula sin caché. | Falso `PASS` sobre reporte corrupto = rechazo inmediato. |
| **Compatibilidad de agentes (D13)** | Sesiones limpias en Antigravity, Codex, Claude Code y Gemini CLI (≥10 tareas QA + ≥5 tareas unitarias legítimas por host). | **100 % interoperabilidad MCP/CLI** · **≥ 90 % adopción canónica** · **0 % bloqueos a tareas legítimas**. | Paridad 100 % de veredictos, permisos y códigos de salida entre MCP y CLI. |
| **Seguridad y captura (D18/D20)** | Suite adversarial AS-01/02/03/04 + canarios sintéticos desde el primer cuadro. | **100 % controles aprobados (0 excepciones).** | Cualquier fuga de secreto, canario visible, lectura arbitraria o mutación en solo-lectura = veto. |
| **Recuperación y continuidad (D03/D06)** | Cortes forzosos de host, ejecutor y mutación en vuelo en Windows, macOS y Linux. | **100 % continuidad determinista**, **0 duplicaciones de mutación**, **0 procesos huérfanos**. | Cualquier pérdida de intento confirmado o doble escritor = veto. |
| **Fidelidad visual y exportación (D15/D18)** | Baselines en navegador real sobre paquete instalado y export `file://` trasladado (rutas con espacios/acentos, sin Internet). | **100 % recursos locales**, **0 degradación silenciosa**, reproducción WebM + seek + HTTP 206/416 verificados. | Fallo de decodificación o dependencia de CDN = rechazo. |
| **Eficiencia y regresión (D16/D05)** | Corrida de regresión sobre snapshot vigente y cambio localizado (1 selector + 1 regla). | **0 inferencias LLM** en casos vigentes no afectados; hardware mínimo/recomendado documentado empíricamente. | Re-descubrimiento total innecesario o alteración de expectativa original = rechazo. |

### 10.3 Condiciones críticas de rechazo (Vetos absolutos — ningún promedio las compensa)

Un candidato a lanzamiento queda **automáticamente rechazado (`NO-GO`)** si ocurre cualquiera de los siguientes eventos, sin importar cuán alta sea la cobertura promedio:
1. **≥ 1 falso `PASS`** en controles de persistencia/rollback (HTTP 201 sin efecto), RBAC negativo con mutación oculta, cálculo decimal o reportes PDF/Excel.
2. **≥ 1 fuga de secreto, credencial o canario de privacidad** en chat, argumentos MCP, logs, trazas, PNG, WebM o paquetes exportados.
3. **≥ 1 escritura no autorizada** en entorno de producción o instancia de referencia read-only.
4. **≥ 1 corrupción de datos, doble escritor simultáneo o duplicación de mutación** tras corte y recuperación.
5. **Divergencia de veredictos o códigos de salida** entre MCP y CLI sobre el mismo snapshot congelado.

---

## 11. Decisiones empresariales que realmente siguen pendientes

*(Se excluyen elecciones de librerías, drivers, interfaces y detalles de ingeniería ya resueltos técnicamente en las Secciones 6 y 8.)*

| # | Decisión empresarial pendiente | Recomendación concreta | Consecuencias | Alternativas | Riesgo residual |
|---|---|---|---|---|---|
| **DE-01** | **Ratificación de plazos operativos y cuotas de retención (D19)** *(TTL 24 h multimedia exitosa, 72 h trazas exitosas, ≥14 días fallos, cuota máxima de defectos abiertos y precedencia de revocación privada sobre retención).* | **Aprobar** los plazos propuestos (24 h / 72 h / 14 d) con cuota por proyecto configurable (p. ej. 2 GB) y **precedencia absoluta de la revocación privada** (`HN-08`). | Equilibra trazabilidad de fallos y espacio en disco local sin contradecir D18. | (A) Plazos más largos (7 d / 14 d / 30 d) a costa de mayor disco local; (B) Desactivar poda automática por defecto. | Evidencias pesadas de fallos antiguos no estarán disponibles físicamente tras la poda (se conserva veredicto, resumen y hash). |
| **DE-02** | **Acta formal de riesgo residual y ámbitos de captura privada (D18 / `POL-CAP-001`)** *(confirmar qué entornos autorizan `PRIVATE_AUTHORIZED`, política de exportación privada excepcional y aceptación explícita de que el borrado en SSD/snapshots/backups del SO es lógico).* | **Aprobar** `PRIVATE_AUTHORIZED` exclusivamente en entornos QA/staging designados (nunca producción), exportación privada bloqueada por defecto (requiere concesión explícita auditada) y requisito recomendado de disco cifrado del SO (BitLocker/FileVault/LUKS). | Desbloquea la implementación de captura privada real con expectativas honestas de seguridad. | (A) Restringir lanzamiento solo a `VERIFIED_STRICT` + `MANDATORY_SUPPRESSION` (sin video en apps con datos sensibles); (B) Exigir volumen cifrado verificado como precondición dura. | En equipos sin cifrado de disco del SO o ante *crash* del kernel, fragmentos de *swap*/snapshots del SO escapan al control de QAP. |
| **DE-03** | **Ratificación de umbrales comerciales, corpus ciego y custodio independiente (DP-02 / DP-10 / D21)** *(aprobar los umbrales propuestos de ≥85 % Discovery, ≥85 % efectos, ≥90 % defectos sembrados y los 4 perfiles de corpus ciego, y designar al custodio independiente).* | **Aprobar** la matriz de la Sección 10 con los 5 vetos absolutos y designar custodio independiente antes de cerrar G5. | Fija un criterio de salida objetivo e indiscutible para declarar QAP listo para producción. | Mantener temporalmente los candidatos históricos (80 % Discovery / 75 % efectos) como piso mínimo de G6 y elevar a 85 % en la siguiente versión. | Umbrales demasiado bajos arriesgan liberar un producto frágil en apps empresariales; demasiado altos sin calibrar pueden alargar G6. |
| **DE-04** | **Autorización de entornos reales y políticas por destino (DP-05 / DP-14 / D07 / D09)** *(qué entornos QA/staging reales, tenants, roles y operaciones contables/irreversibles se autorizan para validación operativa posterior a G6, y qué instancias de referencia acreditan solo-lectura).* | **Diferir la autorización de sistemas reales hasta superar G5/G6 en fixtures**, definiendo desde ahora la política base por entorno (p. ej. `confine_tenant` o `compensate` para operaciones contables/financieras). | Protege los sistemas empresariales durante todo el desarrollo y evita bloqueos prematuros. | Habilitar un entorno QA desechable dedicado durante G4/G5 para pruebas piloto tempranas. | Sin política expresa por destino real, las operaciones mutativas y consultas cross-instancia quedarán en `BLOCKED` al estrenar QAP en producción. |
| **DE-05** | **Nivel de cobertura obligatoria de accesibilidad (`REQ-QA-003`) en el primer lanzamiento** *(¿opt-in por campaña o compuerta obligatoria en todas las vistas críticas de G6?).* | **Aprobar `REQ-QA-003` como capacidad incluida en lanzamiento y opt-in por campaña** (validada en E5/E6 sobre estados críticos, sin bloquear el lanzamiento por cobertura WCAG manual). | Entrega valor real de accesibilidad automatizada sin desviar el foco principal de QA funcional E2E. | Hacer obligatoria la auditoría WCAG 2.1 AA en todas las vistas del corpus ciego G6. | Las comprobaciones automatizadas (axe) cubren solo una fracción de WCAG; los chequeos manuales siguen requiriendo revisión humana. |

---

## 12. Fuentes primarias faltantes y efecto concreto sobre las conclusiones

| Fuente primaria faltante (verificada en `ea804a5b`) | Sustituto disponible en el expediente | Efecto concreto sobre las conclusiones de esta auditoría |
|---|---|---|
| **Fe de erratas / consolidación previa de Gemini Neon con clasificación individual 60/20/7** | Matriz de 82 IDs en `gemini-neon-etapa-3.md` + 5 IDs en `catalogo-requisitos.md` + totales declarados en el encargo. | Impide acreditar por recuperación literal cuáles 7 IDs exactos fueron etiquetados como políticas base en esa ronda. **Efecto mitigado:** la Sección 2 presenta una **reconstrucción analítica explícita** (60 RF / 20 RNF / 7 Políticas base) sujeta a verificación rápida del propietario; no altera el alcance técnico ni bloquea la planificación. |
| **Especificación Funcional Maestra (Entregas 1–2 y Adenda) originales** | 82 IDs y criterios recuperados en `gemini-neon-etapa-3.md` y `catalogo-requisitos.md`. | Posible pérdida de matices de redacción originales en requisitos históricos, pero las decisiones normativas vigentes **D01–D21** prevalecen explícitamente sobre documentos previos incompatibles. No bloquea la planificación. |
| **Informes originales AS-01 y AS-03, acta de ejecución AS-02 y dos decisiones de cierre citadas en AS-04** | Código real en `develop`, antecedentes `H-REV-01`–`H-REV-06`, árbol del tag `AS-02` (`c5ac3e5e`) e informe `AS-04` (`463b5566`). | Las vulnerabilidades críticas se corroboraron directamente en el código de `develop` (`server.ts:59,277`, `git-adapter.ts:28`, `host-composition.ts:390`, `local-secret-prompt.ts:72`). La falta de las actas originales no invalida las remediaciones exigidas en G0/G1, pero impide citar resultados de ejecución históricos de AS-02 como pruebas ya pasadas en `develop`. |
| **Plan F0 original (01–13), vectores, laboratorio original, informes de auditoría Fase 1/2 y hashes históricos** | Expediente `Recovery` (`a78322f8`), resultados `Hydrogen R2` (`c57cd886`) y reconstrucción local `ade7b4a7` (distinta del original). | Invalida cualquier intento de usar los números históricos de F0 para aceptación. **Efecto:** obliga a ejecutar todas las compuertas E1–E8 desde cero sobre el producto real (ya reflejado en D21 y Sec. 10). |
| **Manuales versionados y autorización de acceso a LENDUS CORE** | Ninguno en el repositorio (bloqueado por política). | Impide validar reglas de dominio reales de LENDUS CORE en esta etapa. **Efecto:** no bloquea la planificación de QAP (que debe ser agnóstico al dominio); se acota como validación operativa posterior a G6 bajo **DE-04**. |

---

## 13. Dictamen final

**DICTAMEN FINAL: `APROBABLE CON CORRECCIONES`**

**Fundamento del dictamen:**
El expediente documental en `Hyouka73/QAMCP@develop` (`ea804a5b141659c68cd85305ca4bbaeeb431bc0e`) **no está `NO LISTO PARA PLANIFICACIÓN`** porque la línea normativa del propietario (**D01–D21**), los contratos de dominio del plan maestro, la trazabilidad de requisitos y el diagnóstico verificado del código real proporcionan una base suficientemente madura y completa para estructurar el plan maestro definitivo y el WBS. Tampoco corresponde exigir que las correcciones de G0 (`reporter/server.ts`, `git-adapter.ts`, `tsc --noEmit`, `playwright-core`) estén implementadas antes de planificarlas.

No obstante, **no procede emitir `LISTO PARA PLANIFICACIÓN` sin correcciones** porque deben incorporarse explícitamente al expediente objetivo antes de congelar el WBS las siguientes **6 correcciones vinculantes**:

1. **Adoptar el catálogo definitivo de 92 elementos normativos** (62 RF, 21 RNF, 9 Políticas operativas) promoviendo `CAND-REP-001` → `REQ-AUTREP-001`, `CAND-RUN-001` → `REQ-RUN-002.1`, desdoblando `CAND-SEG-001` en `REQ-SEG-002.3` + `POL-CAP-001` (eliminando duplicidad con la política adicional de captura) y formalizando `POL-RET-001`, más las ampliaciones de `REQ-RUN-001.3` (4 ejes) y `REQ-MEM-002.1` (`profile_ref`, `visual_variant`).
2. **Incorporar las enmiendas técnicas derivadas de `HN-01` a `HN-08`** en los contratos de G0/G1: licencia y abstención de fórmulas Excel sin caché (`HN-01`), matriz de captura protegida por motor y `MANDATORY_SUPPRESSION` en Firefox/WebKit/OOPIF (`HN-02`), unificación de `playwright-core` ≥1.63 + retiro de `@playwright/mcp` + ruta a MCP SDK v2 (`HN-03`), sustitución de `keytar` por `@napi-rs/keyring` + CI vault (`HN-04`), `mammoth >= 1.13.0` y normalizador OpenAPI 3.0 `nullable $ref` (`HN-05`), `engines.node >= 22.12.0` (`HN-06`), `Cache-Control: private, no-store` (`HN-07`) y precedencia de revocación privada sobre retención de defectos abiertos (`HN-08`).
3. **Alinear el conteo real de deuda TypeScript en `ea804a5b`** (`HN-09`: resolver discrepancia entre 93, 142 y 144 mediante ejecución limpia de `tsc --noEmit` al abrir G0).
4. **Fijar la secuencia escalonada de experimentos `EXP-01`–`EXP-06`** (Sección 9) vinculando cada uno a la compuerta del componente que condiciona, sin paralizar G0 innecesariamente.
5. **Incorporar el método reproducible de perfilado de hardware/tokens** (Sección 6.B) y los **criterios cuantificables de aceptación con 5 vetos absolutos** (Sección 10) como referencia base de G6.
6. **Someter exclusivamente las 5 decisiones empresariales genuinas (`DE-01`–`DE-05`)** a ratificación del propietario en sus hitos correspondientes (`DE-01`, `DE-02`, `DE-05` antes de cerrar G0; `DE-03` antes de G5/G6; `DE-04` antes de piloto en sistemas reales).

Una vez registradas estas 6 correcciones en el expediente objetivo, el proyecto queda habilitado para iniciar la elaboración del plan maestro definitivo y el WBS.
