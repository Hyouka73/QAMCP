## E01-R5 independiente y siguiente compuerta R6 — 2026-11-06

**E01 NO-GO, VNEXT-014 integral NO-GO; R4 correctiva PASS.** SHA físico `9e9d2c8`: **494 PASS/12 FAIL** serial, **468 PASS/38 FAIL** en cada una de dos paralelas normales consecutivas. Las 12 faltantes son identidades históricas de auth aún no modernizadas; las dos paralelas suman 26 **timeouts** adicionales cada una (22 comunes, cuatro exclusivos de cada corrida). No hay defectos funcionales nuevos medidos en serial. Un host con CPU al 100 %, RAM libre mínima 107 MB y cierres nativos de navegador hasta 8356 ms contribuye a la inestabilidad, **sin demostrar causa única**; una cola global de navegador podría trasladar los timeouts a la espera.

**Prioridad activa:** seguir [PLAN_R6](../VNEXT-014-E01/PLAN_R6_2026-11-06.md): R6-A diagnóstico controlado y breve del host/etapas; R6-B **una** corrección causal si existe una operación corregible demostrada; R6-C certificación independiente por Codex. No repetir R4 por defecto, no usar los PASS R4 para SHA posteriores, no cambiar 5000/10000 ms ni workers sin decisión independiente. **Pendientes separados:** decisión de contrato/alcance de 12 auth, revisión humana real, estáticos globales, Stdio y merge; fecha MVP 20-11-2026 intacta. [Informe original E01-R5](../VNEXT-014-E01/INFORME_E01_R5_2026-11-06.md). Las secciones inferiores son actas históricas.

---

## Certificación física R4 — 2026-11-06

**R4 correctiva PASS; VNEXT-014 integral NO-GO.** SHA probado `2dc2f5800f64e2a08fd11c88608a4f6beddcf635`: nueve suites, 101 PASS/1 FAIL/0 SKIP/0 TODO, sin cambios de resultado frente a R3. TM-50 sigue FAIL heredado. TypeScript 128 heredados: desaparecen exactamente los seis TS2339 nuevos, sin retirar aserciones ni introducir errores. ESLint focal 0 errores/2 warnings heredados; build oficial PASS.

Se cierran los tres P2 R3 en su alcance: TM-44 compara snapshot completo y next antes/después de reabrir stores/servidor y lee requisito por conexión SQLite independiente; TM-48 persiste Environment 1→2, rechaza consentimiento 1 sin adquisición/asociación/requisitos y recupera adquisición/asociación con consentimiento 2. Doce identidades auth, E01, deuda estática, equivalencias parciales restantes, revisión humana real y compuertas globales/Stdio permanecen abiertas. Sin ejecución global/E01 ni cambios productivos. MVP 20-11-2026 intacto. [Informe y evidencia R4](VERIFICACION_FISICA_R4_2026-11-06.md).

Las secciones siguientes son históricas; la certificación anterior sustituye sus estados pendientes únicamente para las tres correcciones R4 y selección efectivamente ejecutada.

---

## R4 correctiva — cambios en código publicados; verificación pendiente (2026-11-06)

**NO-GO hasta certificación independiente.** Los hallazgos P2 de R3 se corrigieron en tests/fixture sin modificar código productivo, sin alterar timeouts ni eliminar identidades:

- **R3-01 / seis TS2339:** `c1d620b` añade al `Payload` del fixture los campos opcionales reales de Discovery, más pins de Environment ajustados al reiniciar el host; `d00d43b` usa narrowing explícito para `counts`, mantiene aserciones de `limitations/next_safe_action` y conserva el contrato sin `extraccion_vacia`.
- **R3-03 / TM-44:** `d00d43b` exige igualdad del snapshot de draft y de la pregunta `next` antes/después de restart, más lectura del requisito mediante una **nueva conexión SQLite**.
- **R3-02 / TM-48:** `daf4038` hace commit físico de Environment 1→2 en Knowledge, comprueba consentimiento host todavía fijado en 1, rechazo sin observaciones/requisitos/escrituras del módulo, y reautorización positiva en rev2 con binding actualizado.
- **Campaña requerida a Codex:** comprobar HEAD, ejecutar suites afectadas por fixture y `tsc --noEmit`, lint focal y build; tomar R3 (101 PASS/1 FAIL, 134 diagnósticos) como línea base exacta; distinguir 128 heredados de posibles nuevos; conservar TM-50 como FAIL auth sin fabricar PASS; informar GO/NO-GO focal por criterios objetivos. Ejecutar los nueve suites focales si se busca regresión completa frente a R3, sin serie global ni E01 todavía.
- **No ejecutado en esta intervención:** Vitest, Chromium/Playwright, ESLint, TypeScript y build; todo lo anterior es implementación pendiente de prueba, no evidencia de PASS. El informe R3, sus JSON y sus cifras permanecen históricos e inalterados. Se mantienen 43/55 modernizadas, 12 auth pendientes y MVP 20-11-2026.

---

## Resultado físico R3 — 2026-11-06

**Focal NO-GO; integral NO-GO.** SHA probado `bdafeeb834549fc13c5d952c1f341098c2592468`: nueve suites, **101 PASS / 1 FAIL / 0 SKIP** en 102 casos. Las 38 modernizadas seleccionadas pasan; TM-50 conserva FAIL legacy. De las 55 históricas se ejecutaron 39; las otras 16 no se recertificaron. Las cinco sustituciones Server aprobaron, incluido qap_plan/qap_test físico y plan obsoleto. Inventario AST: 55 fullNames, una declaración por identidad, sin duplicaciones/desapariciones.

Prioridad siguiente: **P2 seis TS2339 nuevos** (Payload en A2/operations), **P2 TM-48** probar autorización realmente anterior a actualización Environment (999 frente a 1 solo prueba mismatch), **P2 TM-44** asertar recuperación de draft/next tras restart. Los cuatro warnings P3/A2 desaparecieron; quedan dos warnings heredados Server, cero errores ESLint focal. Typecheck **134 = 128 heredados + 6 nuevos**, build PASS. Doce identidades auth pendientes y E01 permanecen; no se ejecutaron integral, paralelo ni Stdio. MVP 20-11-2026 intacto.

Fuente: [informe R3](VERIFICACION_FISICA_R3_2026-11-06.md), [matriz física de 55](evidencia/r3-2026-11-06/matrix-55-r3.md), [auditoría semántica](evidencia/r3-2026-11-06/semantic-audit.md). Las secciones inferiores conservan sus fechas y estados históricos; sus afirmaciones de R3 sin ejecutar quedan sustituidas exclusivamente en el alcance demostrado por esta acta.

---

## Estado operativo R3 — 2026-11-06 (sin certificación física)

**VNEXT-014 NO-GO. Implementación 43/55 identidades, 12/55 pendientes de sustitución** tras los commits R3. No cambiar el hito MVP del **20-11-2026** ni reabrir tareas históricamente cerradas. La cifra describe código y NO implica 43 PASS físicos: R2 certificó 24/24 solamente en `92579eb`; R1 sigue siendo la única corrida global (487/506 serial, 473/506 paralelo).

**R3-A:** `c5d37b0` reordena imports de P3 para resolver dos warnings detectados; `0dcb85f` añade negativos de categorías, borradores recuperables, especificación vs ejecución y superficies pasivas; `413af9f` amplía TM-48 con URL, identidad y argumento de credenciales rechazados. Pendiente ejecutar tests, lint y typecheck tras R3. Ningún warning se declara eliminado físicamente.

**R3-B:** `ea9dcbd` habilita exclusivamente autorización opt-in de navegación loopback en el fixture; `1ebdc0b`, `b40d997`, `ab8d023` y `4d794fe` reemplazan cinco cuerpos Server manteniendo `fullName`. TM-46 ahora prueba `qap_plan` positivo, `plan.json`/caso real y `qap_test` con Chromium, prueba previa sin plan y plan obsoleto; ejecución real todavía no certificada. TM-52 comprueba compuertas de fase/módulo sin promover lifecycle. TM-53 conserva lectura positiva legacy de `qap_status`, no autorización implícita de Discovery. TM-54 cubre onboarding/ingesta/SCOPING/WORKING/Discovery. TM-55 prueba entrevista, revisión, cobertura/cierre y no reescritura YAML. **TM-50 permanece activo en `server.test.ts`** porque exige `session_saved` autenticado: no sustituirlo por navegación anónima.

### Clasificación de las once identidades de autenticación

A = garantía vigente comprobable; B = semántica legacy sustituida explícitamente; C = positivo todavía ausente. Clases mixtas son parciales, no cierre de identidad.

| ID | Clase | Garantía demostrable / brecha real | Tarea verificable, dependencia y prioridad |
| --- | --- | --- | --- |
| TM-13 | A+C | Se rechazan argumentos de autenticación inseguros sin persistencia; no se produce `auth_required` desde perfil gestionado. | P1: test negativo MCP/SQLite; para positivo, contrato de perfil y host autenticado, con aceptación de bloqueo previo sin perfil y sin escrituras. |
| TM-14 | C | No hay clasificador contractual `auth_wall` para HTTP 302. | P1: definir clasificación sanitizada de redirecciones, fixture HTTP 302 y no persistencia; requiere diseño de crawler. |
| TM-15 | C | Login embebido sin redirección no se clasifica contractualmente. | P2: política de login HTML y aserciones negativas de falsos positivos; requiere decisión de alcance. |
| TM-16 | C | No existe uso/revocación Discovery de sesión autenticada expirada. | P1 condicionado a auth real: expiración, desverificación y cero escritura. |
| TM-17 | C | No existe flujo positivo Discovery con storageState y perfil verificado. | P1 si se autoriza auth en MVP: host seguro, readback de la vista autorizada y prohibición de acceso sin aprobación. |
| TM-18 | A+C | `fresh_anonymous_static` no recibe credenciales ni material de sesión; no genera `auth_selectors` ni prueba su filtrado. | P1: negativas de no filtración; positivo de selectors solo cuando exista auth explícita. |
| TM-19 | C | Guard SPA asíncrono no se etiqueta `auth_wall` canónico. | P2: prueba con guard real bajo límite 5000/10000, oráculo sanitizado y sin escritura. |
| TM-27 | A+C | Compuerta SCOPING con roles y perfiles legacy existe; no valida identidad/capacidad autenticada canónica de extremo a extremo. | P1: prueba MCP persistente del gate sin roles/perfiles, perfiles gestionados sin fabricar verificación; depende de política de auth. |
| TM-30 | C | Falta respuesta canónica `page_kind=login` positiva. | P2: decidir si la clasificación de login entra en MVP, con fixture de /login y sin falsos datos personales. |
| TM-31 | C | Falta detección contractual auth_wall en 302. | P1: compartir contrato y fixtures con TM-14, preservar identidad/negativos separados. |
| TM-32 | C | Falta detección contractual auth_wall de redirección SPA. | P2: prueba de guard local y resultado sanitizado; requiere diseño de crawler. |

**TM-50 (C, Server):** sesión autenticada guardada y `is_auth_view` no existen como garantía de Discovery canónico. Tarea P1 condicionada a decisión de alcance de autenticación: fixture con host seguro y sesión independiente, expiración/revocación, sin exponer cookies ni credenciales. Dejar su test original activo y sin falsa certificación. **Quedan 12 identidades sin reemplazo: TM-13..19, TM-27, TM-30..32 y TM-50.**

### Brechas semánticas y estáticas abiertas de R3

- **TM-09:** pendiente subescenario legacy `observed` con hipótesis, `interviewing` incompleto y todos completos en WORKING. R3 agrega desempate por orden de plan vía MCP real (`37df993`), sin PASS físico; R2 había comprobado prioridades high/medium/low y desempate unitario.
- **TM-23:** `authentication_not_supported` protege contra argumentos inseguros; ni `auth_required`, ni `session_invalid`, ni los campos históricos `razon`/`directorio_objetivo` son contractuales. No hay positivo auth.
- **TM-33/34/35/38:** clasificación formal independiente de la categoría de pregunta; R3 amplía negativos, borrador y cobertura de especificación, pero su resultado físico está pendiente. TM-36/37 usan las cuatro acciones `propose/correct/defer/review`.
- **TM-41/42/43:** cero controles no equivale a fallo de adquisición. R3 comprueba conteos, observaciones y ausencia de promoción; una advertencia literal `extraccion_vacia` no forma parte de `DiscoveryHandler` vigente. Decidir MVP vs posterior antes de implementarla; no inventar nuevo campo para Vitest.
- **TM-44:** R3 incorpora positivo con módulo humano `Operación`, clave NFD `operacion`, plan y ruta autorizados, binding y persistencia de entrevista/requisito tras reinicio, más negativo de módulo ajeno. Commits `dff49f9` y `4869f00`; prueba pendiente de certificación física. No resucita directorio legacy `pending_questions`.
- **TM-48:** R3 añade negativos por URL/módulo/credenciales, autorización ausente y revisión Environment desactualizada (`94e78e1`), todos con invariantes de cero escritura. No reintroduce `module-view.schema.json` ni acredita compatibilidad completa de contextos host sin ejecución física.
- **E01:** investigación aislada pendiente. No tocar límites 5000/10000 ms, workers ni configuración Vitest. Los 128 diagnósticos TS y dos warnings históricos en A2 siguen siendo baseline de R2; validar diferencial real después de R3.
- **Autoridad:** inboxes sintéticos no certifican revisión humana real. No presentar ejecución de Chromium R3 como PASS antes de Codex.

### Una sola campaña física focal independiente R3

Codex debe fijar HEAD exacto y correr **sin skips, filtros de casos ni nuevos presupuestos**: `p3-canonical-discovery.test.ts`; `p4-2-canonical-contract.test.ts`; `p4-5a-canonical-integrity.test.ts`; `p4-5a2-canonical-integrity.test.ts`; `server-canonical-discovery.test.ts`; **`server-canonical-operations.test.ts`**; `server.test.ts` (legado activo y TM-50 pendiente: separar FAIL esperado del diferencial); y los tests dependientes `plan-handler.test.ts` / `test-handler.test.ts`. Después TypeScript MCP `pnpm --filter @qap/mcp exec tsc --noEmit`, ESLint focal sobre archivos R3, build y diferencial por `fullName` del baseline. Separar bloqueos legítimos de FAIL de aserciones y de falta de navegador. Sólo si el foco está estable planificar luego 506 serial/paralelo, Stdio y E01. Preservar R1/R2 y escribir evidencia nueva aditiva, sin sobrescribir `physical_result` histórico.

---

## Verificación física R1 y correcciones posteriores — 2026-11-06

**R1 sobre SHA 8de5a22 (Codex, Windows/Node 24.15.0):** 33 canónicas focalizadas = **31 PASS / 2 FAIL**; lifecycle **10/10 PASS**; MCP serial **487/506 PASS (19 FAIL)**; MCP paralelo **473/506 PASS (33 FAIL)**. Build PASS, typecheck/lint global FAIL. Diferencial serial frente a 456/50: 31 FAIL→PASS, cero PASS→FAIL. Fuente inalterada: [VERIFICACION_FISICA_R1_2026-11-06.md](VERIFICACION_FISICA_R1_2026-11-06.md). Este resultado **no se extrapola a commits posteriores**.

**Correcciones posteriores de pruebas, todavía sin validación física:**
- TM-09/T14: Discovery no muta lifecycle automáticamente; entrevista explícita y prueba de high/medium/low más desempate estable. Commits 1c8164e y 9aa9499.
- TM-12/Criterio 6: versión inicial de pregunta = 0 y aumento tras propuesta/revisión. Commit a409601.
- Server: el tipo Payload modela propiedades opcionales reales de Discovery, no fuerza campos en otras herramientas. Commit 8980bbc.
- TM-33: categoría formal explícita confirmada con host y readback Knowledge. Commit 7ed60e0.
- TM-38: procedencia y recibo durable de revisión confirmados en el test. Commit 3c4cf0a.

**Próxima prueba focal:** P3, P4.2, P4.5-A2 y Server canónicos; typecheck MCP y lint editado, con SHA exacto. Guardar evidencia aditiva; no repetir MCP completo aún. Nada de lo publicado después de R1 se declara PASS por inspección.

**Pendientes:** TM-23, TM-41..43, TM-44 y TM-48 siguen con equivalencia semántica incompleta; hay 17 identidades sin modernizar (11 auth, 6 Server), E01, aprobación humana auténtica, estáticos globales y compuertas de integración. No confundir bloqueos anónimos seguros con autenticación/SPA. **VNEXT-014 sigue NO-GO.**

---

## Dictamen de orquestación 2026-11-06 — posterior a c8b0cd1

**Estado vigente: NO-GO.** GitHub verificó HEAD `c8b0cd1` al comenzar esta revisión (8 commits posteriores a `6062dcb`). Existen **38/55 identidades modernizadas en código**: cinco con PASS físico previo del Lote 1; **33 modernizadas adicionales sin corrida física**, y **17 aún sin sustitución**. El conteo antiguo de 50 pendientes en secciones inferiores corresponde al Lote 1 y **no representa el estado actual**. La matriz JSON aún conserva `physical_result: failed` del baseline para los casos no ejecutados; no sobrescribir evidencias antiguas ni interpretarlas como resultados sobre el nuevo HEAD.

**Hallazgos de revisión semántica (no son fallos físicos demostrados):**
1. **P1 — presupuesto E01:** `p4-5a2-canonical-integrity.test.ts` declaró `describe(..., { timeout: 45000 })`, ampliando de hecho el presupuesto por caso frente a 5000 ms. Se retiró en el commit de tests posterior a `c8b0cd1`. Ese cambio **no está ejecutado** y no repara E01.
2. **P1 — TM-41/42/43:** los nuevos C10-a/b/c comprueban ausencia de controles y no promoción normativa, pero **no verifican la advertencia de extracción vacía**, su ausencia en superficies interactivas ni un estado de trabajo equivalente. Determinar si la advertencia sigue siendo requisito MVP o extensión posterior; no dar equivalencia por el solo nombre de la prueba.
3. **P1 — TM-44:** C1-c verifica normalización NFD aislada y bloqueo de módulo ajeno al plan; **no verifica** la creación de directorio, preservación de nombre ni normalización de preguntas persistidas que afirma su título histórico. Reconciliar garantía con el contrato vigente o reforzar positivos.
4. **P1 — TM-09/TM-23:** T14 no compara prioridad high/medium/low ni orden de plan; C9a verifica un código de bloqueo auth, pero no los campos `razon`/`directorio_objetivo` prometidos. Comprobar contrato vigente y cubrir la parte aún exigible.
5. **P1 — TM-33/35/38:** comprobar categoría vinculada al origen persistido, atributos de borrador y procedencia de confirmación; hoy predominan aserciones de `pending_review`, ausencia de requisito o datos de otro escenario. Algunos nombres conservados son históricos y no representan exactamente el contrato nuevo; las sustituciones requieren acta semántica explícita.
6. **P1 — TM-48:** un rechazo por falta de autorización no demuestra validación semántica de contexto de vista inválido; separar ambas garantías si la validación vieja sigue siendo exigible.
7. **P2 — TM-22/37:** Criterio 4 dice dos reglas pero ejercita una; C4-c menciona tres opciones, aunque la aserción exige cuatro del protocolo actual. Documentar el cambio de contrato y probar la cardinalidad real.

**Trabajo pendiente de código (17):** TM-13..TM-19 (7 auth P4.4), TM-27 (1 SCOPING/auth), TM-30..TM-32 (3 login/auth-wall), TM-46 y TM-50/TM-52..55 (6 Server). Total 11 identidades ligadas a autenticación y 6 Server; **no equiparar** `fresh_anonymous_static` con navegador autenticado ni `blocked` con prueba positiva. Distinguir pruebas positivas de `qap_plan`/`qap_test` y negativos de autorización.

**Orden de cierre:** A) corregir aserciones incompletas y reconciliar decisiones de contrato; B) modernizar 6 Server preservando el positivo plan/test; C) decidir alcance de 11 auth (mantener garantías y clasificar capacidad no implementada si aplica); D) una corrida focal seguida de serial, paralelo, build, tsc/lint diferenciales, Stdio y E01 separado; E) revisión humana real, verificación integrada e informe independiente Codex, antes de cualquier GO. Las fechas 16/18/19/20-nov permanecen; ninguna tarea históricamente cerrada se reabre. No cambiar timeouts, workers ni skips para mejorar resultados.

---
# Pendientes verificables

Esta entrega es el Lote 1 autorizado como unidad completa de implementación. La modernización total sigue abierta.

| Lote | Archivo | Identidades históricas pendientes | Próxima evidencia |
| --- | --- | --- | --- |
| 2 | p3-verification.test.ts + p3-canonical-discovery.test.ts | 5 modernizadas en código; certificación física pendiente | Ejecutar focal y contrastar errores/tiempos reales contra TM-06..TM-10. |
| 3 | p4-2-pregunta-contract.test.ts + p4-2-canonical-contract.test.ts | 2 modernizadas en código; certificación física pendiente | Ejecutar focal y contrastar Pregunta, revisión, WRAP_UP y no promoción TM-11..TM-12. |
| 4 | p4-4-auth-lifecycle.test.ts | 7 | Clasificar soporte efectivo de fresh_anonymous_static; negativos de rutas protegidas, sesión/credenciales y ausencia de escrituras. Auth real no implementada por este lote. |
| 5 | p4-5a-integrity.test.ts + p4-5a-canonical-integrity.test.ts | 9 modernizadas, 1 pendiente (TM-27) | Ejecutar focal; preservar compuerta SCOPING auth-roles sin reducirla a bloqueo de Discovery. |
| 6 | p4-5a2-integrity.test.ts + p4-5a2-canonical-integrity.test.ts | 13 modernizadas, 3 pendientes (TM-30..TM-32) | Ejecutar focal y verificar contrato de auth_wall/login/guard, que no existe como respuesta canónica equivalente. |
| 7 | server.test.ts + server-canonical-discovery.test.ts | 4 modernizadas en código y 6 restantes (TM-46, TM-50, TM-52..TM-55) | Ejecutar nuevos casos y modernizar seis restantes sin perder positivos qap_plan/qap_test o auth. |

Quedan 17 identidades sin reemplazo: TM-13..TM-19 (7), TM-27 (1), TM-30..TM-32 (3), TM-46, TM-50 y TM-52..TM-55 (6). Hay 33 modernizadas después del Lote 1 (38 de las 55 en total), pendientes de ejecución física; A+C provisional no equivale a PASS. Su primer error físico se conserva; no se usa como prueba de equivalencia ni de defecto productivo.

E01 sigue abierto: el baseline serial pasa las garantías de concurrencia existentes, pero eso no demuestra estabilidad bajo carga. Se requiere instrumentación por arranque/contexto de Chromium, carga del runner, esperas de locks/SQLite/crawler/hooks y cleanup. No se incrementan presupuestos ni se cambian workers para obtener resultados verdes. Los ensayos paralelos de esta entrega, cuando figuren en RESULTADOS, son observaciones físicas y no una reparación causal de E01.

Quedan fuera de certificación: revisión humana auténtica; E2E oficial del host desplegado; propagación de deadlines por wrappers externos no soportados (A04-W01); deuda ESLint/TypeScript heredada; compuertas oficiales VNEXT-014 e integración a develop. VNEXT-015 no se modifica.

## Siguiente compuerta de verificación (sin certificar)

Ejecutar las dos nuevas suites P3 y P4.2, después todos los tests MCP en serie y con paralelismo predeterminado, build y tsc/lint diferenciales. No cambiar 5000 ms por conveniencia. Registrar JSON por identidad con commit exacto, distinguir regresiones nuevas, infraestructura y fallos legacy. Solo tras esa ejecución reemplazar en `evidencia/matriz-55.json` los valores históricos por **campos adicionales de verificación** (preservar baseline). Luego avanzar lotes 5/6 integridad, 7 server y 4 auth conforme prioridad expresada por el usuario. No pedir Codex aún: faltan 43 identidades de código y la auditoría independiente final.

## Compromisos pendientes tras integrar 22 pruebas de integridad

No se certifican P4.5-A/A2 antes de las nuevas corridas físicas (incluyendo grupos originales todavía activos) ni se declara equivalente una auth_wall de SPA a una adquisición anónima. La suite y matriz conservan los títulos históricos. Si una prueba canónica falla, corregir el arnés o defecto real según la evidencia; no cambiar las aserciones a `blocked` para lograr PASS. Los presupuestos E01 quedan 5000/10000ms sin ajuste.

## Actualización server (TM-47/48/49/51)

Commit `7303351`: cuatro casos migrados con fullName histórico. Se requiere ejecución focal del archivo nuevo y `server.test.ts` restante, además de diferencial por identidad. No retirar TM-50 ni pruebas de autenticación por no disponer de `auth_wall`/sesión autenticada en el contrato del crawler anónimo. La falta de ejecución impide rebajar oficialmente los 50 fallos históricos del último baseline.
