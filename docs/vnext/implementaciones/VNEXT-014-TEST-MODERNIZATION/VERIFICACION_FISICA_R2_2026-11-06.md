# Verificación física R2 — 2026-11-06

**24/24 PASS físicos. GO focal para las correcciones canónicas de R2, con observaciones. VNEXT-014 permanece NO-GO.** No se certifica equivalencia semántica histórica completa, estabilidad integral ni integración con develop.

SHA ejecutado: `92579ebaf576dd3d461acc2d88fb30272e5cbe40`. Baseline físico R1: `8de5a2260bf7c936bbc2c12c81675dd0f6270a36`. Fecha local: 6 de noviembre de 2026, America/Mexico_City. Las horas de los manifiestos se conservan en UTC.

## Preparación y alcance

Windows x64, PowerShell, Node 24.15.0, pnpm 12.3.4, Vitest 4.1.11. Chrome/Chromium instalado: 156.0.8078.80; el fixture utiliza Playwright con `channel: chrome`. Dependencias existentes; sin instalación, actualización de versiones ni modificación de lockfile. Los módulos workspace usan los dist existentes de R1; no hay cambios en sus fuentes productivas entre R1 y el SHA probado, y no se repitió build.

El directorio inicial era contenedor de checkouts; la raíz Git utilizada fue su subdirectorio QAMCP. HEAD local inicial `a333cfbab9597a485f2fd9704d7f2518102f01f9`, rama `feat/qap-vnext-architecture`. `git ls-remote origin refs/heads/feat/qap-vnext-architecture` devolvió el SHA objetivo. Tras fetch se inspeccionaron los nueve commits entrantes y sus siete archivos; `git merge-base --is-ancestor HEAD FETCH_HEAD` terminó en 0. Se aplicó exclusivamente `git merge --ff-only 92579ebaf576dd3d461acc2d88fb30272e5cbe40`.

La única modificación local previa era la sesión protegida `packages/playwright-runner/.qa/cache/sessions/admin-user.json`. No se abrió directamente, calculó su hash, escribió, restauró, eliminó ni incorporó al staging. Conserva su condición de modificación ajena. Incidencia de procedimiento: al cerrar la evidencia se ejecutó por error git diff --check sin pathspec; Git emitió únicamente una advertencia de finales de línea sobre esa ruta, sin exponer contenido. No puede garantizarse ausencia de lectura interna por Git durante ese comando. Las comprobaciones posteriores se limitan expresamente a documentación R2; no se afirma comparación byte a byte de la sesión. Las pruebas usan raíces temporales propias, SQLite sintético y HTTP loopback sin cookies ni Authorization.

No se modificaron código productivo, tests, configuración, dependencias, workers ni presupuestos 5000/10000 ms. No se ejecutaron las 506 pruebas, las 17 identidades pendientes ni una investigación de E01. Se preservó R1 íntegra.

## Ejecución física

Las cuatro suites se lanzaron por separado y secuencialmente. El primer intento dentro del sandbox bloqueó las cuatro suites antes de importar los tests: EPERM al renombrar caché temporal SSR de Vitest, cero pruebas ejecutadas. Son **intentos de infraestructura fallidos**, no FAIL de identidades ni PASS. Sus logs, JSON y manifiesto se conservan con prefijo `sandbox-`. Se ejecutó después el mismo runner fuera del sandbox, sin modificar selección o configuración. Las validaciones estáticas corrieron en sandbox y coincidieron parcialmente en tiempo con las suites; no hubo solapamiento entre suites Vitest.

| Suite | Identidades | PASS | FAIL | SKIP/TODO | Exit | Tiempo comando s |
|---|---|---:|---:|---:|---:|---:|
| P3 | TM-06..TM-10 | 5 | 0 | 0 | 0 | 14.73 |
| P4.2 | TM-11..TM-12 | 2 | 0 | 0 | 0 | 7.83 |
| P4.5-A2 | TM-33..TM-45 | 13 | 0 | 0 | 0 | 13.35 |
| Server | TM-47/48/49/51 | 4 | 0 | 0 | 0 | 8.25 |
| Total | 24 | 24 | 0 | 0 | 0 | 44.17 |

Comandos exactos, exit codes, horas y tiempos: [manifest.json](evidencia/r2-2026-11-06/manifest.json). Se añadió reporter JSON al verbose solicitado, sin filtros de nombres, omisiones ni overrides. Reproducción secuencial: [run.ps1](evidencia/r2-2026-11-06/run.ps1). Los cuatro logs y JSON conservan selección y resultados individuales. [Resultado por identidad](evidencia/r2-2026-11-06/resultados-por-identidad.md) incluye fullName histórico, duración, comparación R1 y primer error (ninguno en las 24 ejecuciones válidas).

Comparación por fullName exacto contra los mismos cuatro JSON R1: **22 PASS conservados, 2 FAIL→PASS (TM-09 y TM-12), cero PASS→FAIL, cero omisiones**. [comparison.json](evidencia/r2-2026-11-06/comparison.json). No se extrapola a 506 casos ni a las otras 14 modernizadas fuera de esta selección (P4.5-A y lifecycle); sus resultados R1 siguen siendo históricos. La inspección del fixture confirma que los defaults siguen siendo primer módulo high y restantes medium, y que el mapa explícito solo los reemplaza cuando se proporciona.

## Comprobación semántica de las correcciones

Las aserciones siguientes están dentro de los cuerpos async esperados por Vitest; no tienen ramas que las omitan. Los 24 cuerpos finalizaron y no hubo SKIP ni TODO. El dictamen combina resultado físico, inspección de las aserciones y recorrido de sus dependencias, sin instrumentar ni alterar tests.

### TM-09 / T14

PASS, 2144.70 ms. El plan deliberadamente contrapuesto al orden de prioridad es orders/low, dashboard/medium, catalog/high. `qap_status` selecciona catalog; tras Discovery, el fixture compara lifecycle con su contenido anterior y T14 confirma estado planned y nueva recomendación qap_discover. Solo después de abrir explícitamente la entrevista recomienda qap_rules_set. No se inventa transición lifecycle implícita ni promoción normativa.

Tras revisión sintética y cierre autorizado de catalog, status elige dashboard/medium antes de orders/low. Se comprueban así high por encima de medium/low y medium por encima de low mediante MCP real. El desempate entre orders y dashboard, ambos medium, se ejecutó y aprobó mediante llamada **directa unitaria a getPhaseGuidance**, eligiendo el primero del plan; no se presenta como desempate E2E por MCP.

Brecha histórica residual: el título también anuncia observed con hipótesis y todos completos tipo decision. T14 no construye un estado legacy observed ni termina todos los módulos; no certifica esas subgarantías. El caso TM-12 sí comprueba decision en WRAP_UP, que no equivale a la rama todos completos en WORKING. **PASS físico con brecha semántica histórica**, aunque la corrección del oráculo y las prioridades solicitadas quedan verificadas.

### TM-12 / Criterio 6

PASS. Se ejecutó `question.version === 0`, el next repetido conserva la pregunta y `ready()` propone, bloquea review sin autorización y confirma mediante el inbox independiente. La versión devuelta por la propuesta es mayor que la inicial. El fixture devuelve en `ready().question` la versión de la propuesta; esto prueba incremento tras proponer, no un incremento adicional causado por review.

Se comprobó cero requisitos antes de revisión, uno después, cierre de catalog, waiver explícito sintético de orders, cierre de sesión y WRAP_UP con pregunta decision válida. El FAIL R1 queda corregido físicamente; no se aceptó una versión inicial ficticia.

### TM-33 / C3-a

PASS. La pregunta persistida tiene categoría de entrevista proposito. La propuesta pide clasificación formal security, conserva la categoría de la pregunta y no crea requisitos. Review sin decisión del host devuelve human_review_not_authorized. La petición recibida por el gateway contiene security; tras aprobarla explícitamente en el inbox sintético, review confirma revisión 1.

Readback `knowledge.get` comprueba categoría formal security, validation_status confirmed, provenance developer_interview, source canonical_interview_v1, review reviewed y reason igual al requestDigest aprobado. Se ejecuta integridad SQLite. Es un positivo real del contrato canónico además del bloqueo negativo, sin confundir categoría de pregunta con categoría formal. La garantía histórica de from_option toma siempre categoría de pregunta no se declara equivalente: el contrato actual autoriza clasificación explícita. **PASS canónico; equivalencia histórica requiere acta de reconciliación.**

### TM-38 / C4-d

PASS. `confirm()` verifica bloqueo sin host y que la consulta de requisitos no cambia antes de autorización. Después se lee un único requisito con título y descripción exactos, categoría functional, confirmed y developer_interview. Un segundo get comprueba traza reviewed/canonical_interview_v1. La consulta de relaciones recupera exactamente un recibo human_review_authorization_v1; su reason coincide con el del requisito y su destino apunta al requisito/revisión 1. `evaluate` conserva execution_coverage not_executed.

La persistencia consultada es SQLite físico: el fixture instancia SqliteKnowledgeAdapter sobre knowledge.sqlite; get/query ejecutan SELECT sobre knowledge_revisions, no leen un mock de memoria. integrity() abre por separado las tres bases en readOnly y verifica integrity_check/foreign_key_check. Se inspeccionó también la transacción productiva que guarda requisito y relación conjuntamente. Las nuevas aserciones leen filas persistidas, pero esta identidad no cierra/reabre Knowledge ni simula pérdida del proceso; no se extiende la garantía a recuperación tras crash. Tampoco prueba specification_coverage completa dentro de C4-d pese al título histórico “y cubre”. **PASS físico de procedencia/recibo, con alcance histórico parcial.**

En ambas identidades, la decisión independiente se genera con approveInterview en un gateway **sintético**. El valor synthetic-business-owner y la procedencia developer_interview no acreditan consentimiento humano auténtico. No se debilitó ninguna compuerta: el código productivo está intacto y se ejecutaron negativas antes de las confirmaciones positivas. Las pruebas Discovery verifican observaciones sin requisitos y ausencia de rules.yaml.

## Diferencial estático

TypeScript: `pnpm --filter @qap/mcp exec tsc --noEmit`, **exit 1**, 8.25 s. R1 132 → R2 **128** diagnósticos. Comparación multiconjunto por archivo, código y texto del diagnóstico, ignorando desplazamientos línea/columna: cero altas y exactamente cuatro bajas TS2339 en server-canonical-discovery.test.ts: observations (dos), evidence y acquisition_status. Cero diagnósticos restantes en ese archivo. Los otros 128 ya estaban presentes en R1; **TypeScript global FAIL**. Se conserva [typecheck.log](evidencia/r2-2026-11-06/typecheck.log).

ESLint focal: configuración real eslint.config.mjs, cinco archivos (fixture y las cuatro suites), **exit 0**, 18.29 s, **0 errores / 4 warnings**. Baseline R1 lint.json filtrado a esas mismas cinco rutas: 0 errores / 2 warnings. Se conservaron los dos warnings import/order de A2 y aparecieron **dos warnings nuevos import/order en P3, líneas 6 y 7**: falta línea vacía entre grupos y guidance debe preceder al fixture. Por tanto, cero errores nuevos, pero **sí hubo diagnósticos nuevos**. No se ejecutó lint global ni se afirma un diferencial global de todo el monorepo.

Comandos completos y tiempos: [typecheck-command.json](evidencia/r2-2026-11-06/typecheck-command.json), [eslint-command.json](evidencia/r2-2026-11-06/eslint-command.json). Resultado y comparación: [eslint-focal.json](evidencia/r2-2026-11-06/eslint-focal.json), [static-diff.json](evidencia/r2-2026-11-06/static-diff.json). [analyze.mjs](evidencia/r2-2026-11-06/analyze.mjs) reproduce los diferenciales desde la evidencia R1 y R2. No se ajustó configuración para silenciar nada.

## Brechas y siguiente bloque del orquestador

- Corregir los dos warnings nuevos de imports P3; esta campaña no modifica tests.
- Reconciliar explícitamente los nombres/garantías históricas de TM-09, TM-33 y TM-38 con el contrato canónico y completar subescenarios exigibles. Si se requiere desempate E2E, agregarlo por MCP; el actual es unitario y pasó.
- Mantener pendientes TM-41/42/43 (advertencia real de extracción vacía y su ausencia con controles), TM-44 (positivo autorizado con tilde, nombre/persistencia de preguntas) y TM-48 (contexto realmente inválido, distinto a ausencia de autorización). Son **PASS físicos con brecha semántica** en esta corrida. TM-42 solo exige counts numéricos, sin comprobar >0 ni la ausencia de la advertencia. TM-43 exige que extraccion_vacia no exista.
- TM-34 rechaza pregunta inventada/módulo ajeno, pero no ejercita el mismatch de categoría literal de su nombre; TM-36/37 ejercitan las cuatro opciones canónicas en lugar del contrato histórico de una/tres opciones. Requieren la misma reconciliación, sin interpretar la conservación del nombre como equivalencia.
- TM-23 queda fuera de esta selección: su brecha R1 de autenticación/campos permanece. No se equipara fresh_anonymous_static a autenticación, storageState o detección dinámica de guards SPA.
- Los 128 diagnósticos TypeScript heredados, estáticos globales, E01, 17 identidades aún sin modernizar, aprobación humana auténtica y certificación integral siguen en bloques posteriores. No se alteró el objetivo MVP del 20 de noviembre de 2026.

No se observó regresión funcional entre las 24 seleccionadas. Sí se observó regresión menor de higiene estática: dos warnings nuevos. No hay base para declarar ausencia global de regresiones, estabilidad concurrente, GO de VNEXT-014 ni merge a develop.

## Publicación

Informe y evidencia aditivos, exclusivamente documentales, publicados mediante commit normal en feat/qap-vnext-architecture. El padre del commit documental identifica el SHA probado; el SHA del propio commit se devuelve en la entrega para evitar autorreferencia. R1 y los cambios ajenos se preservan. Las rutas absolutas de usuario y temporales en los nuevos logs/JSON se sustituyen por marcadores; comandos, diagnósticos, duraciones y resultados no se alteran.
