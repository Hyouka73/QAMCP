# QAMCP — 08 WBS de microtareas, compuertas e integración MVP (propuesta)

**Fecha de corte:** 2026-11-05 · **Carácter:** PROPUESTA DOCUMENTAL / NO AUTORIZA CÓDIGO NI MERGES.

- Repo: `Hyouka73/QAMCP`; rama única de trabajo: `feat/qap-vnext-architecture`; baseline documental: `6f4f55c41d5ed340d85a8f38174868ac8741387f` (`feat/qap-vnext-architecture`).
- `develop` verificado: `0e5825cfd256065e532f45a171f9a0dc74116615`; merge-base: `b9d5b503a6c4c827f5184fe30cbcec7366efbfb6`. Comparación Git: **divergidas, vNext +237 / -4 respecto de develop**, conteo dependiente de esos SHAs.
- Prohibiciones en esta planificación: no cambios productivos, no merges a develop, no implementar 015–023 sin autorización, no modificar estados de tareas terminadas, no degradar pruebas, no duplicar Knowledge/runner/inferencia/cobertura.
- **VNEXT-014 = NO-GO para cierre y para merge**, las **63 identidades de fallos** (55 legacy + 8 Memory sin fence) conservan su trazabilidad aunque haya reparaciones y métricas nuevas. Baseline independiente R4-R12: 415 PASS/63 FAIL/478; medición del autor de convergencia: 434 PASS/63 FAIL/497 en serial, no certificación independiente de la línea actual. Al atribuir resultados fijar SHA y ejecutor.
- Dependencias oficiales del WBS 04 NO se modifican. Prioridades **P0 MVP**, **P1 próximo/compatibilidad**, **P2 evolución posterior** son propuesta de orden, NO sustitución del estado original ni de las compuertas. Los IDs -01/-02 son descomposiciones nuevas sin declarar hitos completados.

## 1. Fuentes, contraste y segundo chequeo

- [WBS oficial vNext](../vnext/04_BACKLOG_Y_WBS_PRELIMINAR.md), [STATE](../vnext/STATE.md), [auditoría de compatibilidad](../vnext/06_AUDITORIA_CRUCE_DEVELOP_VNEXT.md), [preparación 015](../vnext/implementaciones/VNEXT-014-CONVERGENCIA/PREPARACION_VNEXT-015.md), [extensiones NO autorizadas](../vnext/07_WBS_QAP_AGNOSTICO_Y_EXTENSIONES.md).
- [Comparación Git fijada](https://github.com/Hyouka73/QAMCP/compare/0e5825cfd256065e532f45a171f9a0dc74116615...6f4f55c41d5ed340d85a8f38174868ac8741387f); [HEAD develop](https://github.com/Hyouka73/QAMCP/commit/0e5825cfd256065e532f45a171f9a0dc74116615); [HEAD vNext](https://github.com/Hyouka73/QAMCP/commit/6f4f55c41d5ed340d85a8f38174868ac8741387f).
- [WBS operativo Google Sheets — Detalle WBS & Evidencias](https://docs.google.com/spreadsheets/d/1DC_MTJI-ALQt8s87BNm-1rfv9gK3yM4J3st9-oBUN2U/edit?gid=1106357705): lectura **sin edición**, el 2026-11-05, filas 79–82 S81-006/001/002/003; 87–92 S82-001..005, S8-004; 102–103 DEV-MVP-01/02; H-10 fila 100 vence el 20/11. Esos estados siguen pendientes en la hoja, y la presencia de código no demuestra la conclusión del WBS.
- Motor existente: `packages/knowledge/src/graph/cycle-detector.ts` contiene `detectCycles(Map<string,string[]>)`. `validateDependencyGraph(CapabilityDefinition[])` **no es** un validador `DomainModule[]`. El grafo de ejecución `DependencyGraphResolver` recibe `TestNode.depends_on`; reutilizar idea/algoritmo, no confundir el modelo canónico.
- Contrato: `DomainModule.dependencies: string[]` puede resolver **ID o key**, con ambigüedades rechazadas por el planificador del store; `FlowScenario.module_id` asocia un módulo; `FlowScenario.prerequisites[].depends_on_flow_id` enlaza flujos. `IKnowledgeStore.query` usa páginas 1–100 y cursor invalidado por commits intermedios; **no existe snapshot read-only multi-kind garantizado en el puerto**. No inventar coherencia global.
- Diferencia de capacidad: 015 **no** depende de 014 según el WBS; 016 depende de 015, 017 depende de 014; 018 depende de 014/005; 019 de 018; 020 de 014/016/019; 021 y 022 de 020; 023 de 022. No confundir esta ruta de producto completo con el recorrido recortado del MVP para 20/11.
- Riesgo nuevo del segundo chequeo: `develop` publica `generateBvaCases` y vNext `SqliteKnowledgeAdapter` en el **mismo** `knowledge/src/index.ts`. Riesgos semánticos adicionales en el TC, AJV, BVA con selector heurístico y aserción `not_visible`, update/prune que trabajan sobre filesystem legacy. El inventario Git NO equivale a prueba de merge.

## 2. Contrato de ejecución por microtarea

Cada microtarea se limita a **1 objetivo y pocos archivos**; cualquier necesidad de otro paquete o cambio de semántica dispara una propuesta nueva antes del código. La ruta `engine/`, `knowledge/`, etc. en la tabla abrevia `packages/engine/`, `packages/knowledge/`. **ChatGPT/Gemini** hace contrato, revisión estática/diff y riesgos; **Codex** ejecuta localmente instalación, compilación, suites, integraciones físicas y reporta el HEAD. Sin evidencia física la tarea NO es certificada. Cada implementación debe conservar resultados esperados/negativos históricos y publicar pequeños commits directamente en `feat/qap-vnext-architecture`; no crear ramas ni PR internos.

### VNEXT-015 — ImpactAnalyzer: contrato → motor puro → lector Knowledge → flujos → QA

| ID | Pri | Dep. | Archivos relevantes | Alcance | Exclusiones | Resultado | Criterio de aceptación | ChatGPT/Gemini | Codex |
|---|---|---|---|---|---|---|---|---|---|
| 015-01 | P1 | 003,009 | engine/src/impact-contract.ts (nuevo); engine/src/index.ts; shared/src/domain/knowledge-entities.ts | Definir solicitud (application_id, changed module ids/keys), salida, profundidad, rutas, diagnósticos, estado de coherencia y política de inactivos; sin IO | Sin algoritmo, SQL, MCP, estados de cierre | Contrato tipado versionado y ejemplos | Tipos compilan; inputs desconocidos/ambiguos distinguibles; no promesa de snapshot atómico | Sí | Build/tipos |
| 015-02 | P1 | 015-01 | knowledge/src/impact/impact-analyzer.ts (nuevo); graph/cycle-detector.ts; knowledge/test/impact-analyzer.test.ts (nuevo) | Algoritmo puro: normalizar ID/key únicos, arco módulo→dependencia, recorrer inversamente, profundidad y orden estables, dedup; rechazo de ciclos/referencias rotas | Sin store, cambios de DOM, pruebas de ejecución ni `validateDependencyGraph(CapabilityDefinition[])` con DomainModule | Analizador puro y fixtures | Vacío, aislado, cadena, diamante, múltiples semillas, ID/key ambiguo, ciclo y falta; no muta argumentos; mismo input=misma salida | Sí | Test unitario, cobertura, build |
| 015-03 | P1 | 015-02 | knowledge/src/storage/sqlite-knowledge-adapter.ts; engine/src/knowledge-store.port.ts; knowledge/src/impact/knowledge-impact-reader.ts (nuevo) | Composición RO de `IKnowledgeStore.query` completa por scope; cursor INVALID_CURSOR => reiniciar exploración acotadamente; fallar explícito si lectura inestable | Sin commit, withWriteFence usado como atajo, migrar esquema ni afirmar snapshot multi-kind atómico | Adaptador lector con resultado coherent/incomplete explícito | SQLite físico; dos aplicaciones aisladas; escritura concurrente invalida cursor; sin writes/revisions; abort tras reintentos limitados | Sí | SQLite físico con escritores, readback, integridad |
| 015-04 | P1 | 015-03 | shared/src/domain/knowledge-entities.ts; domain/contextual-dimensions.ts; knowledge/src/impact/flow-impact.ts (nuevo) | Mapear flow.module_id y dependencias de flujo por prerequisites.depends_on_flow_id; propagación inversa entre flujos comprobados | Sin inferir módulos desde steps/DOM ni implementar FlowOrchestrator paralelo | Flujos afectados con causa/ruta | Flujo directo, transitivo intermodular, faltantes/ciclos, inactivo, duplicados y salida estable | Sí | Fixtures Knowledge y suites cruzadas |
| 015-05 | P1 | 015-01..04 | knowledge/test/impact-*.test.ts; engine/src/__tests__/impact-contract.test.ts (nuevo); docs/vnext | Pruebas y dictamen separado de funcionalidad vNext-014; comparación baseline por identidad | Sin tocar mcp, runner, 014 ni cambiar expectativas históricas | Informe GO técnico del 015 o NO-GO | Build 10 paquetes, Engine/Knowledge, lint diferencial, diff limitado, read-only probado | Sí | Toda ejecución física y reporte |

### VNEXT-016 — QA Advisor reutilizando ImpactAnalyzer

| ID | Pri | Dep. | Archivos relevantes | Alcance | Exclusiones | Resultado | Criterio de aceptación | ChatGPT/Gemini | Codex |
|---|---|---|---|---|---|---|---|---|---|
| 016-01 | P2 | 015-05 | engine/src/advisor/qa-advisor.ts (nuevo); engine/src/impact-contract.ts | Orquestar salida ImpactAnalyzer como recomendación diferenciando evidencia y desconocidos | Sin nuevo motor de impacto, inferencia ni escrituras implícitas | Asesor puro sin UI | No convierte dependencia inferida en requisito confirmado; faltantes propagados | Sí | Unitarios |
| 016-02 | P2 | 016-01,013-R3 | engine/src/advisor/clarification.ts (nuevo); shared/src/domain/knowledge-entities.ts | Preguntas estructuradas e identificación de aceptación humana mediante servicios ya existentes | Sin confirmar requisitos desde IA ni gateway humano simulado | Preguntas y decisiones pendientes | Falta de oráculo => pregunta/blocked; sin cambiar ExpectedRequirement | Sí | Focales de autoridad |
| 016-03 | P2 | 016-02,014 certificado | mcp/src/handlers/advisor.handler.ts (nuevo); mcp/src/tool-catalog.ts; mcp/src/dispatcher.ts | Registrar qap_advisor explícitamente con errores tipados y scope | Sin segundo servicio de estado ni mutar cierre | Tool conectada al motor existente | Catálogo/SDK igual, argumentos inválidos fail closed, no desviación de 014 | Sí | MCP SDK y Stdio |
| 016-04 | P2 | 016-03 | mcp/src/__tests__/advisor*.test.ts (nuevo); docs/vnext | Certificar recomendaciones multi-módulo, incertidumbre, permisos y no promoción | Sin cambiar fixtures 014 | Dictamen asesor | Determinismo, negativas, regression MCP y no secretos | Sí | MCP serial/parallel autorizados |

### VNEXT-017 — Diagnóstico conservador de defectos

| ID | Pri | Dep. | Archivos relevantes | Alcance | Exclusiones | Resultado | Criterio de aceptación | ChatGPT/Gemini | Codex |
|---|---|---|---|---|---|---|---|---|---|
| 017-01 | P2 | 014 certificado | engine/src/diagnostics/classification-contract.ts (nuevo); shared/src/domain/knowledge-entities.ts | Definir evidencia mínima, estados indeterminate y criterios de carácter conclusivo | Sin diagnóstico por HTTP status en solitario | Taxonomía y contrato | Los cinco estados existentes y motivo obligatorio de indeterminate cubiertos | Sí | Tipos, schema/tests |
| 017-02 | P2 | 017-01 | engine/src/diagnostics/defect-classifier.ts (nuevo) | Reglas puras conservadoras sobre evidencia observada vs requisito esperado autorizado | Sin LLM privilegiado ni motor inferencial duplicado | Clasificador determinista | HTTP 500 aislado=>indeterminate; reproducción, prerrequisitos y conflictos | Sí | Unitarios adversariales |
| 017-03 | P2 | 017-02 | engine/src/diagnostics/evidence-normalizer.ts (nuevo); mcp/src/handlers/test.handler.ts (consumidor solo si autorizado) | Adaptar referencias de resultados/trace/evidence sin cambiar su fuente | Sin alterar resultado histórico ni generar pruebas | Adaptador sin escritura | Evidencia ausente/corrupta no crea bug concluyente | Sí | Fixtures evidencia física |
| 017-04 | P2 | 017-03 | engine/src/__tests__/defect-classifier.test.ts (nuevo); docs/vnext | Pruebas taxonomía, entradas heterogéneas, exclusiones y benchmark | Sin forzar precisión estadística no medida | Matriz QA | Casos correctos/indeterminados y métricas publicadas sin inventar | Sí | Test físico y diferencial |

### VNEXT-018 — Packaging standalone

| ID | Pri | Dep. | Archivos relevantes | Alcance | Exclusiones | Resultado | Criterio de aceptación | ChatGPT/Gemini | Codex |
|---|---|---|---|---|---|---|---|---|---|
| 018-01 | P2 | 014 certificado,005 | cli/tsup.config.ts; mcp/tsup.config.ts; package.json; pnpm-lock.yaml | Inventario de importaciones runtime/dinámicas, native deps, Node y Chromium | Sin publicar npm ni cambiar dependencia por conveniencia | Mapa de packaging | Lockfile y Node declarados; import runtime resoluble | Sí | Build y npm pack dry-run |
| 018-02 | P2 | 018-01 | cli/tsup.config.ts; mcp/tsup.config.ts | Preparar entrypoint standalone y dependencias empaquetadas | Sin empaquetar binarios Playwright ocultamente ni duplicar motor | Bundle reproducible | Misma funcionalidad frente a workspace, sin resolver módulos desde monorepo | Sí | Ejecución fuera repo |
| 018-03 | P2 | 018-02 | cli/package.json; mcp/package.json; scripts release | Declarar motores compatibles, optional deps y fallos amigables por navegador/SQLite | Sin bajar seguridad para hacer npx green | Preflight de entorno | Sin dependencias nativas obligatorias no declaradas, falla explícita si faltan | Sí | Node/Win/Linux matriz |
| 018-04 | P2 | 018-03 | cli/tsup.config.ts; mcp/tsup.config.ts; docs/vnext | Prueba de empaquetado reproducible sin publicar | Sin cambios en npm registry | Informe portable | npm pack dry-run, instalación temporal, checksum, cold start medido sin inventar | Sí | Pack smoke real |

### VNEXT-019 — Inicialización MCP

| ID | Pri | Dep. | Archivos relevantes | Alcance | Exclusiones | Resultado | Criterio de aceptación | ChatGPT/Gemini | Codex |
|---|---|---|---|---|---|---|---|---|---|
| 019-01 | P2 | 018-04 | cli/src/commands/mcp.ts; cli/src/commands/config (inspeccionar); mcp/src/server.ts | Inventario de formatos de configuración Claude Desktop/Cursor/Antigravity y rutas de ejecutables | Sin ejecutar apps ajenas ni inferir sus esquemas | Matriz config/paths | Incluye plataformas y versiones soportadas verificadas | Sí | Inspección hosts reales |
| 019-02 | P2 | 019-01 | cli/src/commands/mcp.ts; cli/src/commands/config | Generar configuración idempotente, backups y permisos mínimos | Sin insertar tokens ni activar navegación | Comando init/register seguro | Segunda ejecución sin duplicados; rollback de config corrupta | Sí | Temp homedir |
| 019-03 | P2 | 019-02 | cli/src/commands/mcp.ts; mcp/src/server.ts | Autodetección conservadora y validaciones opt-in | Sin tocar perfiles productivos sin consentimiento | Config y diagnóstico | No alteración si host no disponible; salida explicativa | Sí | Windows/macOS/Linux |
| 019-04 | P2 | 019-03 | cli/src/__tests__/mcp-config.test.ts (nuevo); docs/vnext | Suite de instalación/configuración y desinstalación reversible | Sin publicar ni asumir apps instaladas | Informe multiplataforma | Fixtures y smoke real host; sin secretos | Sí | QA en VMs/hosts |

### VNEXT-020 — E2E oficial, no confundir con smoke MVP

| ID | Pri | Dep. | Archivos relevantes | Alcance | Exclusiones | Resultado | Criterio de aceptación | ChatGPT/Gemini | Codex |
|---|---|---|---|---|---|---|---|---|---|
| 020-01 | P2 | 014,016,019 GO | docs/vnext/e2e/acceptance-matrix.md (nuevo); mcp/src/tool-catalog.ts | Definir E2E oficial discovery→inference→advisor→test→report con oráculos y autorizaciones | No equiparar MVP acotado INT-05 con cierre 020 | Matriz aceptación oficial | Precondiciones/resultado y fuente humana para cada paso | Sí | Revisión de fixture |
| 020-02 | P2 | 020-01 | mcp/src/__tests__/blackbox-e2e*.test.ts (nuevo); engine/src | Fixture web autorizado, scopes y snapshots limpios | Sin red productiva ni credenciales reales | Harness reproducible | Sin acceso al repo de AUT y sin outputs ficticios | Sí | Infra/fixture real |
| 020-03 | P2 | 020-02 | mcp/src/__tests__/blackbox-e2e*.test.ts; playwright-runner/src/runner.ts | Camino nominal ejecución real, repetición, reporte y revisiones | Sin convertir not_executed en PASS | E2E nominal certificado | Reejecutar con evidencia/trace y resultado estable | Sí | Browser/SQLite/Stdio |
| 020-04 | P2 | 020-02 | mcp/src/__tests__/blackbox-negative*.test.ts (nuevo) | Fallos permisos, red, consentimiento, missing oracle, crash, rollback | Sin relajar timeout o borrar casos | E2E negativo | Fail closed y no side-effects ante bloqueo | Sí | Negativos físicos |
| 020-05 | P2 | 020-03,020-04 | docs/vnext/e2e/acceptance-matrix.md | Certificación oficial e identificación de regresiones contra padres | Sin dar por cerrados INT-05/014 automáticamente | GO/NO-GO VNEXT-020 | Trazabilidad fixture→resultado→archivo→SHA | Sí | Toda ejecución independiente |

### VNEXT-021 — Manuales

| ID | Pri | Dep. | Archivos relevantes | Alcance | Exclusiones | Resultado | Criterio de aceptación | ChatGPT/Gemini | Codex |
|---|---|---|---|---|---|---|---|---|---|
| 021-01 | P2 | 020 GO | docs/vnext/README.md (nuevo); docs/vnext/02_ARQUITECTURA_OBJETIVO_Y_CONTRATOS.md | Guía de instalación, conceptos, contratos y límites | Sin cambiar WBS histórico ni suplantar código | Manual de arquitectura | Enlaces/versiones y comandos verificables | Sí | Validar comandos |
| 021-02 | P2 | 021-01 | docs/vnext/manual-cli-mcp.md (nuevo); cli/src/commands; mcp/src/tool-catalog.ts | Manual de flags/errores/flujo y ejemplos para QA | Sin proclamar soporte no probado | Manual CLI/MCP | Ejemplos replicables con fixtures reales | Sí | Smoke ejemplos |
| 021-03 | P2 | 021-02,022-03 | docs/vnext/migration-guide.md (nuevo); docs/vnext/06_AUDITORIA_CRUCE_DEVELOP_VNEXT.md | Guía legacy→canónico, versiones, rollback y reversibilidad | Sin migración silenciosa ni datos certificados sin autoridad | Manual migración | Fixture y pérdida cero auditables | Sí | Ensayo migración |
| 021-04 | P2 | 021-03 | docs/vnext/README.md; docs/vnext/migration-guide.md | Revisión terminológica y navegación por roles | Sin modificar código en bloque documental | Documentación entregable | Sin links rotos ni discrepancias con HEAD | Sí | Comandos publicados |

### VNEXT-022 — Integración oficial posterior a VNEXT-020

| ID | Pri | Dep. | Archivos relevantes | Alcance | Exclusiones | Resultado | Criterio de aceptación | ChatGPT/Gemini | Codex |
|---|---|---|---|---|---|---|---|---|---|
| 022-01 | P1 | INT-01,020 GO | docs/vnext/06_AUDITORIA_CRUCE_DEVELOP_VNEXT.md; scripts (nuevo si procede) | Congelar SHAs, preservar pruebas/rutas de ambos padres y definir mapa de cherry-picks | Sin merge en develop | Matriz de reconciliación | Todos los archivos de develop mapeados sin pérdida | Sí | Diff Git, baseline ambos |
| 022-02 | P1 | 022-01 | shared/src/types/tc-case.type.ts; shared/src/schemas/tc-case.schema.json; shared/schemas/tc-case.schema.json | Versionar TC y compatibilidad de validadores/schema | Sin bajar oráculos ni invalidar legacy | Contrato migración TC | YAML antiguo y nuevo validados explícitamente | Sí | AJV/runner/report |
| 022-03 | P1 | 022-02 | knowledge/src/index.ts; knowledge/src/plan/bva-generator.ts; cli/src/commands/{update,prune}.ts | Reconciliar export BVA/Sqlite y políticas update/prune/historial en puente único | Sin doble persistencia/auto-promoción BVA | Contrato conservación | Readback canónico, CAS/receipts intactos, rollback/dry-run | Sí | Suites padres y SQLite |
| 022-04 | P1 | 022-03,020 GO | todos los paquetes compartidos; docs/vnext | Ensayo en worktree LOCAL detached, sin nueva rama y sin push/merge directos | Sin modificar develop hasta GO | PR/diff de ensayo | Build, suites de ambos padres y flujo real verde o NO-GO explícito | Sí | Suite completa ambas ramas |
| 022-05 | P1 | 022-04, revisión dual | docs/vnext; PR de integración (futuro) | Revisión conjunta con Diego y decisión formal para la integración oficial | Sin fusionar si P0/P1 sin waivers aprobados | Acta GO/NO-GO | SHAs, evidencias, rollback, aprobadores | Sí | Verificación independiente |

### VNEXT-023 — Release piloto NPM

| ID | Pri | Dep. | Archivos relevantes | Alcance | Exclusiones | Resultado | Criterio de aceptación | ChatGPT/Gemini | Codex |
|---|---|---|---|---|---|---|---|---|---|
| 023-01 | P2 | 022 GO,021 GO | cli/package.json; mcp/package.json; release scripts | Revisar package names, semver, licencias, distribución y credenciales | Sin publicar todavía | Checklist release | Tarball reproducible y sin secretos | Sí | npm pack dry-run |
| 023-02 | P2 | 023-01 | release-check.mjs (localizar); docs/vnext | Simulación de instalación limpia y pinning Node/Chromium/SQLite | Sin tocar registry | Reporte instalación | npx smoke en directorio limpio y OS soportados | Sí | Pruebas externas reales |
| 023-03 | P2 | 023-02 | docs/vnext/release-manifest.md (nuevo) | Revisar hashes de assets, configuración, rollback y observabilidad | Sin publicar sin autorización formal | Manifiesto | Artefactos verificables y plan de reversión | Sí | Checksums, smoke |
| 023-04 | P2 | 023-03, aprobación explícita | npm registry (solo tras autorización) | Piloto publicable controlado por responsable autorizado | Sin automatizar release desde documentación | GO release o NO-GO | Publicación solo con autorización y prueba del paquete distribuido | Sí | Validar npm real |

## 3. Matriz de integración anticipada — conflicto, decisión y prueba

| ID de riesgo | Rutas | Resolución propuesta (NO aplicada) | Certificación requerida |
|---|---|---|---|
| COMP-01, BVA | `develop:packages/knowledge/src/plan/bva-generator.ts`; `knowledge/src/index.ts` | Conservar BVA como **candidato** hasta oráculo humano; no atribuir min/max imaginario, selector `#campo` ni `not_visible` erróneo como conformidad. Preservar simultáneamente `generateBvaCases` y `SqliteKnowledgeAdapter` | Casos extremos conocidos/desconocidos, decimales, unidades, selectors, imports de ambos padres y autoridad de requisito |
| COMP-02, TC + validator | `shared/src/types/tc-case.type.ts`; `shared/{src/schemas,schemas}/tc-case.schema.json`; `shared/src/validator/schema-validator.ts`; `execution-result.*` | Versionar/normalizar `case_category`, `source_rule_id`, YAML previos, procedencia, revisión, plan fingerprint y parseo de runner/reporter; no resolver solo Git add/add | AJV de dos versiones, snapshots, casos previos, ejecución y reporte semántico |
| COMP-03, CLI update | `cli/src/commands/update.ts`; `knowledge/src/storage/file-storage.ts` | Preservar guardas `manually_edited`, backups y rollback, sin escritura doble; puente explícito a modelo canónico con CAS | Edición manual, conflicto CAS, readback SQLite, restauración exacta ante fallo |
| COMP-04, CLI prune | `cli/src/commands/prune.ts`; `knowledge/src/history/history-manager.ts` | Retención y purga de artifacts legacy bajo política; conservar metadata auditada, referencias y recibos; sin hard-delete de hechos canónicos | dry-run 0 mutaciones; retención negativa, históricos, rollback, readback y no pérdida del cierre |
| COMP-05, docs | `docs/vnext/STATE.md`, `04_BACKLOG...`, `014F...`, `auditorias/VNEXT-014-R4-R10/` | Preservar vNext como fuente de historial; hacer índice/alias conservando links de develop; NO sobrescribir archivos largos con índices | Diff de rutas, links, y no alteración de evidencias históricas |
| COMP-06, trazabilidad/persistencia | `mcp/src/handlers/{plan,test,report}.handler.ts`; `knowledge/src/storage/sqlite-knowledge-adapter.ts`; YAML legacy | Solo `IKnowledgeStore` + cierre canónico como fuente de autoridad; import/export consciente, no doble motor, no promoción epistemológica | Suite cruzada, plan→runner→evidence→report, casuística negativas, crash/replay y scopes separados |

**Precisión Git:** 24 rutas aparecen del lado develop respecto a vNext; 10 rutas cruzadas fueron categorizadas en auditoría previa (nueve documentales y el índice Knowledge) y 14 exclusivas, pero en el ensayo de merge podrían aparecer conflictos de tipos, contratos y runtime. Comparación actual 4 commits propios develop / 237 propios vNext, ancestro arriba fijado.

## 4. MVP del 20 de noviembre: microtareas exclusivamente de integración

El WBS preexistente INT-01 (10/11), INT-02 (16/11), INT-03 (18/11), INT-04 (19/11) e INT-05 (20/11) **no cambia**. Los IDs siguientes son evidencia/subpasos y **no implican que la compuerta esté pasada**.

| ID | P | Dep. | Archivos/evidencia | Alcance y exclusiones | Resultado + CA | ChatGPT | Codex |
|---|---|---|---|---|---|---|---|
| MVP-INT-01A | P0 | HEAD ambos | Git compare, WBS 04, 06, hoja S81/S82 | Congelar referencias y rutas; **sin merge** | Matriz SHAs/24 rutas; refresh obligatorio antes de ensayo | Sí | Inspeccionar Git local en ensayo |
| MVP-INT-01B | P0 | 01A | BVA, TC/validator, Knowledge exports | Mapa de oráculos y compatibilidad; **sin modificar código** | Decisiones candidate/confirmed, riesgo y dueño | Sí | Baseline pruebas ambos |
| MVP-INT-01C | P0 | 01A | CLI update/prune, historial, SQLite | Diseño reversión y retención; **sin ejecución** | Matriz CAS/backup/readback y negativos | Sí | Simulaciones cuando se apruebe |
| MVP-INT-01D | P0 | 01B,01C | WBS operativa y ADR | Revisión Diego+responsable de vNext, congelar contratos | Acta firmada; INT-01 solo cierra con evidencia revisada | Sí | Evidencia reproducible |
| MVP-INT-02A | P0 | 014-rescate | auditorias/VNEXT-014-*; STATE | Conciliar **63 identidades**, revisión humana auténtica, E01 y lint; **no suprimir** | Evidencia por identidad con SHA, clasificaciones, GO/NO-GO | revisión | Todo físico independiente |
| MVP-INT-02B | P0 | 02A | Host Stdio, runner, Knowledge, cierre | Probar A closed+B waived→reporte→WRAP_UP→replan sin oráculo fabricado | Flujo real y reportes/receipts/readback; GO 014 o bloqueo explícito | revisión | E2E real |
| MVP-INT-03A | P0 | 01D,02B, DEV-MVP-01/02 | Rama de ensayo futura, docs/shared/knowledge/cli | Ensayo de merge Git aislado **solo después GO**, no hacer ahora | Diff y plan de resolución, ambas capacidades preservadas | Sí | Merge de prueba y builds |
| MVP-INT-03B | P0 | 03A | TC, BVA/RBAC, CLI, SQLite, mcp y runner | Verificar suites de ambos padres y MVP web | Cero P0/P1 nuevos o NO-GO documentado | Sí | Todas las suites físicas |
| MVP-INT-04A | P0 | 03B | PR de integración futuro, evidencias | Doble revisión y rollback; **sin force push** | Acta GO o NO-GO con SHA y firmantes | Sí | Auditoría externa |
| MVP-INT-04B | P0 | 04A GO | PR a develop futuro | Merge antes del 20/11 **solo con GO** | SHA final y rollback comprobado | revisar | Revalidación después de merge |
| MVP-INT-05A | P0 | 04B GO | README de MVP, fixture web | Instalar desde develop y ciclo requisito humano→caso→plan→Playwright→evidence→report→regresión | Evidencias físicas finales y sin PASS ficticio | Sí | Smoke usuario real |
| MVP-INT-05B | P0 | 05A | Hoja WBS, acta H-10 | Entrega funcional al 20/11 o dictamen de contingencia | SHA, manual y límites publicados; no alterar estados históricos | Sí | QA final |

### Dependencias externas y preservación de fechas

- Diego: S81-001 BVA, S81-002 RBAC, S81-003 ensamblado YAML, S81-006 schemas; DEV-MVP-01 (11–13/11) corrige oráculos; DEV-MVP-02 (16–18/11) prueba uso real. Los estados de la hoja al corte siguen **pendientes**; código parcial no certifica automáticamente la actividad.
- S82-004 CLI de flujos figura como **condicionado “si está disponible”** para DEV-MVP-02; no convertirlo en bloqueo absoluto si el camino QA mínimo puede usar caso único. Conserva la condición del WBS.
- **Contingencia:** si 014 o INT-03/04 sigue NO-GO, **no hay merge**. Se entrega hasta el 20/11 el MVP propio de develop con alcance y limitaciones, sin llamarlo integración vNext. Escalar desviación de alcance a responsables, sin mover fecha ni cambiar un DONE histórico.

## 5. Ruta crítica, calendario anticipado y bloques de agente

| Fecha máxima propuesta | Bloque (implementable) | Responsable | Compuerta |
|---|---|---|---|
| **05–06 nov** | Congelar 01A/B/C, lectura cruzada de diffs/contratos y revisión de oráculos; definir criterios de QA de 015-01 | ChatGPT/Gemini estático; Diego aporta contexto | INT-01 sigue pendiente hasta acta |
| **06–09 nov** | 015-01/02 **solo si se autoriza**, directamente en vNext en commits acotados; paralelo al rescate 014 sin tocar sus archivos | Equipo 015 distinto del responsable 014 | GO técnico 015 ≠ GO 014 |
| **09–10 nov** | INT-01D; ejecutar baseline de las dos líneas sin integración, fijar versión de schema y política BVA/update/prune | Diego + vNext + Codex | INT-01 10/11 |
| **10–13 nov** | 014-RES-D/E, validación 63 identidades; DEV-MVP-01 y tareas S82 sin reabrir DONE | Responsable 014, Diego, Codex | QA sin false PASS |
| **14–16 nov** | GO/NO-GO físico VNEXT-014, host humano, dos módulos, E01 e integridad; 015-03/04 opcional separado | Codex independiente + responsable vNext | **INT-02 16/11** |
| **16–18 nov** | DEV-MVP-02; contrato de integración aprobado; **solo con GO INT-02** crear ensayo aislado y validar suites de ambos padres | Diego + responsable vNext + Codex | **INT-03 18/11** |
| **19 nov** | Revisiones duales, resolución P0/P1, rollback y decisión PR/merge a develop (si GO) | Dos responsables + auditor | **INT-04 GO/NO-GO 19/11** |
| **20 nov (inamovible)** | Smoke integral desde develop, reporte, regresión, acta MVP; o entrega contingente sin merge | Equipo QA | **INT-05 / H-10** |
| **Posterior MVP** | 015 restante, 016–023 según sus dependencias oficiales; 024–033 / LENDUS / UTCP / ARTEMIS siguen NO AUTORIZADOS | Plan separado | Ningún cierre por calendario |

**Ruta crítica inmutable:** 014-RES-D/E → 014 QA independiente (INT-02) → contrato BVA/TC/CLI y DEV-MVP-01/02 → INT-03 ensayo → INT-04 doble GO/merge condicionado → INT-05. 015-01/02 son paralelas y **no** bloquean el MVP mínimo. Evitar comenzar 016/017/018/019 como requisito improvisado del MVP.

**Bloques de trabajo para chats pequeños:** chat A = 015-01 (contrato, 1–2 archivos), chat B = 015-02 (función pura + tests), chat C = 015-03 (lector paginado SQLite); chat D = 015-04 (flujos); chat E = 015-05 (certificación). Repetir el mismo patrón contrato → implementación acotada → adaptador → integración → QA para 016–023. Cada chat lee solo HEAD real, doc 08 y archivos de su fila; reporta límite, diff, pruebas delegadas y dudas de contrato sin navegar todo el repo. Ningún chat se atribuye éxito físico.

## 6. Matriz de pruebas física exclusiva de Codex

| Grupo | Comprobaciones obligatorias | Evidencia esperada | Semáforo |
|---|---|---|---|
| 015-01/02 | `pnpm --filter @qap/engine test`; `pnpm --filter @qap/knowledge test`; contract/typecheck; puro: vacío/cadena/diamante/ID-key/ciclo/missing/immutabilidad/determinismo | Log + SHA + tests nuevos y existentes | GO técnico solo si sin nuevos fallos |
| 015-03/04 | SQLite archivo temporal multi-app; invalidación cursor con escrituras intercaladas; reintento bounded/fail closed; flows module_id y preceding_flow; revisión sin writes | Snapshot/revisions antes/después, evidencia de error controlado | NO-GO si inventa atomicidad o flujos |
| 014→MVP | 63 identidades por nombre; Node/pnpm/FTS5/Chromium; builds 10/10; lint diferencial; MCP serial + paralelo y E01; Stdio; cierre 2 módulos; humano auténtico | Matriz 63 con clasificaciones; trace, receipts, report físico y logs; SHA | NO-GO mientras compuertas no satisfechas |
| develop pre-merge | BVA incluyendo inválidos y fuente de oráculo; AJV TC viejo/nuevo; update/rollback; prune dry-run y retención | Baseline en HEAD develop, comparado sin renombrar tests | NO-GO si pierde garantía |
| ensayo INT-03 | 10 builds; suites de ambos padres; Knowledge exports; schema/validator/runner/reporter; YAML↔canónico; flow único y dos módulos | Matriz comparada por identidades, diff, datos físicos y rollback | No merge con P0/P1 |
| postmerge INT-05 | Instalar desde develop limpio; seleccionar contexto, requisito confirmado, caso, plan, Playwright, evidencia y regresión | Video/log o reporte físico, SHA de merge y entorno | Entrega solo por uso real |
| 016–023 cuando autorizados | Suites del hito + regresiones de 014 y empaquetado sin npm publish; negativos; reproducibilidad | Logs/capturas de fixture autorizado, manifiesto de artefactos | No declarar DONE por revisión textual |

Las ejecuciones anteriores no se han realizado en este segundo chequeo; son **requisitos para Codex**, no resultados PASS.

## 7. Decisiones de alcance que requieren aprobación (NO aplicar)

1. **PRO-01, cerrar VNEXT-014 por fases:** separar aceptación 014-A+B de certificación 014-C con deuda registrada, pero **el cierre actual sigue NO-GO** hasta decisión formal. No se autorizan bypass de 63 identidades ni borrado de riesgos P1.
2. **PRO-02, MVP ≠ VNEXT-020:** aceptar el E2E **acotado** INT-05 como evidencia de entrega del 20/11 sin declararlo cierre de la suite oficial VNEXT-020 (que conserva dependencias 014/016/019). VNEXT-022 oficial continúa sujeto a VNEXT-020 y no debe marcarse terminado por el ensayo INT-03; la compuerta transversal INT-04 ya existe y sigue vigente.
3. **PRO-03, consistencia en 015:** si la revisión del puerto concluye que el cálculo debe garantizar atomicidad multi-kind bajo escrituras, autorizar una **capacidad opcional de snapshot RO** o diseño equivalente; hasta entonces informar lectura no garantizada y fail closed ante detección de cursor inválido. No usar un `withWriteFence` como sustituto de contrato de lectura.
4. **PRO-04, política de semillas inactivas:** propuesto incluir semilla explícita inactiva con advertencia, no inferir impacto de dependientes inactivos como activos; concretar política antes de 015-02. Módulo desconocido/ID-key ambiguo no produce elementos ficticios.
5. **DECISIÓN PRO-05 — rama única:** el responsable establece que todo vNext (documentación e implementación) se publica en `feat/qap-vnext-architecture`, partiendo de su HEAD remoto vigente, sin ramas auxiliares. El SHA `541c925a6c1194bc2c85ab5a42b2b54e66f4d82c` y el nombre `feat/vnext-015-impact-analyzer` son antecedentes históricos y NO instrucciones de checkout/branch. Preservar las reparaciones VNEXT-014; no hacer reset/rebase. Una prueba de integración con develop podrá usar worktree local detached, sin crear rama remota; el merge hacia develop sigue sujeto a GO.

## 8. Prompt autocontenido — SOLO VNEXT-015-01 y VNEXT-015-02 (para uso FUTURO tras autorización)

> Trabaja exclusivamente en `Hyouka73/QAMCP`, rama **`feat/qap-vnext-architecture`**, desde su HEAD remoto actual. No crees ramas de documentación, implementación ni auditoría. El SHA `541c925a...` es solo una referencia auditada anterior, nunca una base de checkout. El WBS 08 se encuentra en esta misma rama. **No inicies código sin autorización de VNEXT-015-01/02 y política de inactivos.**
>
> **015-01:** contratos tipados puros en `packages/engine/src/impact-contract.ts`; entrada: scope y semillas ID/key; salida: distancias, rutas, afectados, diagnósticos y completitud; sin I/O.
>
> **015-02:** motor puro en `packages/knowledge/src/impact/impact-analyzer.ts` y pruebas aisladas. Normalizar ID/key, detectar ambiguos y faltantes, recorrer inversamente dependencias, deduplicar, ordenar y no mutar. Reutilizar `detectCycles(Map)`; `validateDependencyGraph(CapabilityDefinition[])` no recibe DomainModule. Propuesta pendiente de aprobación: conservar inactivos al recorrer y validar, excluirlos de afectados, rechazar semillas inactivas, no seguir `superseded_by` automáticamente.
>
> No modificar MCP, runner, reporter, `FileSystemStorage`, SQLite ni VNEXT-014. Conservar 63 identidades; no implementar 015-03/04/05 ni 016. Codex ejecuta build, tests Engine/Knowledge, lint diferencial y negativos; ChatGPT/Gemini revisan diff. Publicar commits pequeños **directamente en la rama original vNext** e informe con SHA, resultados y limitaciones. Sin merges a develop, sin force-push ni npm.

## 9. Política de publicación y cambios futuros

Este documento queda publicado directamente en `feat/qap-vnext-architecture`, sin cambios productivos ni pruebas físicas en esta intervención. La rama temporal inicial no será utilizada para nuevos trabajos y debe eliminarse después de recuperar esta documentación. La próxima persona que implemente debe recapturar ambos HEAD y revisar si el WBS/STATE cambió; los números de commits y conflictos son un snapshot del 2026-11-05. Un cambio de alcance necesita acta antes de alterar dependencias, estados o definición de GO.

## 7. Enmienda aditiva 2026-11-05 — rama correctiva VNEXT-014

**Decisión posterior del responsable:** para los cambios correctivos de VNEXT-014 se crea `fix/vnext-014-cierre-controlado`, nacida de `e4d7fbc2c6e4525b4e5fab38ec22e0cd365305d6`, como **excepción concreta** a PRO-05. No se borra PRO-05 ni se altera el estado de tareas históricamente terminadas. El trabajo de VNEXT-015 y la rama vNext original no se sobrescriben ni se fusionan aquí.

Las correcciones publicadas y la migración de ocho fixtures permanecen **sin certificación física**. Las 63 identidades mantienen su trazabilidad en `implementaciones/VNEXT-014-CIERRE-CONTROLADO/MATRIZ_HALLAZGOS.md`; 55 no intervenidas. Se exige Codex independiente, E01/Windows, lint, E2E/autoridad humana real y GO/NO-GO formal antes de cualquier integración. **INT-02, INT-04 y merge a develop siguen NO-GO**. Fechas 16/19/20 de noviembre intactas; no se relajan compuertas para cumplirlas.
