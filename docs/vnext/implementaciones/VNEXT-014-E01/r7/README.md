# INFORME DE INTEGRACIÓN Y REMEDIACIÓN POST-AUDITORÍA: SISTEMA DE PREFLIGHT R7 (VNEXT-014-E01)

**Identificador:** `VNEXT-014-E01-R7-README`  
**Fase:** VNEXT-014-E01 / R7-01b (Hardening y Remediación Post-Auditoría Independiente Codex)  
**Fecha:** 2026-11-07  
**Rama autorizada:** `feat/qap-vnext-architecture`  
**Integrador / Coordinador:** Gemini Teamwork (`worker_r7_integrator_codex`)  
**Auditor Independiente Destinatario:** Codex  
**Estado General de la Entrega:** `PREPARADO / RESERVA NO ACREDITADA` (`EJECUTOR_NO_APTO`)  
**Estado de Validación Técnica:** `VALIDADOR_PASS` (sobre fixture canónico sintético conforme)  

---

## 1. Resumen Ejecutivo y Antecedentes

El hito **VNEXT-014-E01 / R7** tiene por objetivo establecer una compuerta estricta, determinista y auditable de inspección previa (*preflight*) para evaluar la aptitud del entorno de ejecución antes de autorizar cualquier repetición de la suite de integración E01, la cual experimentó fallos sistemáticos por timeouts en los hitos R5 y R6-A debido a saturación del host, overcommit de memoria (> 200%) e hiperpaginación (> 115,000 páginas/segundo).

El 2026-11-07, el auditor independiente **Codex** emitió el informe `docs/vnext/implementaciones/VNEXT-014-E01/r7/AUDITORIA_CODEX_2026-11-07.md` evaluando la entrega inicial en el commit `f555f9dc2d17a2933210cc49db7dbe3bdda646f0`. Si bien las 35 pruebas originales pasaban (`35 PASS, 0 fail`), Codex descubrió **siete hallazgos bloqueantes y de alta severidad (R7-A01 a R7-A07)** que exponían falsos positivos graves:
1. **R7-A01 (P1):** Acreditación autodeclarada en `check-preflight.mjs` sin comprobación física ni compuerta de auditor, emitiendo espuriamente `EJECUTOR_APTO` ante rutas inexistentes (`file:///NO-EXISTE/recibo.json`).
2. **R7-A02 (P1):** Aprobación por omisión (*PASS by omission*) ante telemetrías vacías (`samples: []`, `sample_count: 0`), muestras desprovistas de métricas o grupos, y un `TypeError` no controlado ante muestras nulas iniciales.
3. **R7-A03 (P1):** Omisión total de la aplicación de presupuestos de interferencia (`check-preflight.mjs:378-391` solo comprobaba tipos numéricos), permitiendo que hosts severamente saturados (CPU 100%, RAM 1 MB, cola 173, paginación 275,938) obtuvieran `VALIDADOR_PASS`.
4. **R7-A04 (P1):** Sustitución defensiva de observaciones ausentes en `preflight.ps1` por valores canónicos (`v24.15.0`, `12.3.4`, SHA/rama de referencia, hashes de distribución y contadores nulos a `0.0`), sintetizando conformidad artificial sin observación real.
5. **R7-A05 (P1):** Whitelist de Git eludible al incorporar rutas suministradas por el propio manifiesto (`manifest.git.allowed_untracked_or_modified`), y una interfaz CLI que ignoraba `--expected-sha` y banderas desconocidas.
6. **R7-A06 (P2):** Incoherencia entre la exigencia de versiones exactas del contrato y las expresiones regulares permisivas del esquema; verificación de Chromium no obligatoria por defecto.
7. **R7-A07 (P2):** Confinamiento de rutas incompleto en `preflight.ps1` mediante `StartsWith($scriptDir)` sin separador de ruta (admitiendo prefijos hermanos como `r7-externo`), y falta de validación de confinamiento en parámetros internos como `-SentinelFile` y `-PidFile`.

Codex emitió el dictamen vinculante:
> **Dictamen del ejecutor: EJECUTOR_NO_APTO — PREPARADO / RESERVA NO ACREDITADA.**  
> **Dictamen de la entrega R7: no aceptada como compuerta de autorización; requiere correcciones.**  
> **E01 no ejecutada, no autorizada y no resuelta.**

Bajo la coordinación de Gemini Teamwork y en estricta sujeción a las directivas de integridad y confinamiento, los subagentes especializados (`worker_r7_agente1_codex`, `worker_r7_agente2_codex`, `worker_r7_agente3_codex`), supervisados por revisión adversarial (`reviewer_r7_codex_1`) y auditoría forense (`auditor_r7_codex_1`), ejecutaron la remediación completa de los 7 hallazgos sin alterar código de producción, sin añadir dependencias externas y sin relajar configuración alguna.

---

## 2. Estado Operacional y Principio de No Autocertificación

### 2.1. Dictamen Operacional Actual

```
+---------------------------------------------------------------------------------+
|               ESTADO OPERACIONAL TRAS LA REMEDIACIÓN POST-AUDITORÍA             |
|---------------------------------------------------------------------------------|
|  Validador Status: VALIDADOR_PASS (Sintáctico / Estructural sobre fixture)     |
|  Ejecutor Status:  EJECUTOR_NO_APTO                                            |
|  Dictamen R7:      PREPARADO / RESERVA NO ACREDITADA                            |
|  Suite E01:        NO EJECUTADA / NO AUTORIZADA / NO RESUELTA                   |
+---------------------------------------------------------------------------------+
```

### 2.2. Declaración Taxativa de No Autocertificación por Gemini

1. **Gemini Teamwork NO autocertifica la idoneidad del ejecutor, la validez de la reserva física ni la aptitud de la infraestructura.**
2. La entrega de este software y sus especificaciones constituye únicamente la provisión de las compuertas técnicas formales solicitadas.
3. **Codex ostenta de manera exclusiva y soberana la autoridad para revisar, aceptar o rechazar esta entrega**, y para auditar cualquier evidencia documental externa que acredite reserva dedicada antes de autorizar cualquier ejecución de E01.
4. **Invariante de No Conversión de Estados:** Bajo ninguna circunstancia `VALIDADOR_PASS` equivale a `EJECUTOR_APTO`. La superación de las validaciones de formato de un manifiesto únicamente certifica que el informe es sintáctica y temporalmente conforme; la condición de `EJECUTOR_APTO` requiere indefectiblemente la acreditación documental de provisión dedicada independiente (vía hipervisor, cloud dedicated host o cgroups) y la compuerta expresa de aprobación del auditor Codex (`options.auditorApproval === true`).

---

## 3. Matriz Exhaustiva de Trazabilidad y Evidencia Cuádruple (R7-A01 a R7-A07)

De conformidad con el requisito R5 de `ORIGINAL_REQUEST.md`, la siguiente matriz documenta la trazabilidad completa y la evidencia cuádruple de los siete defectos identificados por Codex:

### 3.1. Tabla General de Correspondencia

| # | Hallazgo Codex | Causa Raíz | Regla Contractual / Invariante | Archivo(s) y Líneas Afectadas | Caso de Prueba (Regresión) | Resultado Previo (Defectuoso) | Resultado Correcto Posterior (Corregido) |
|---|---|---|---|---|---|---|---|
| **1** | **R7-A01 (P1):** Acreditación autodeclarada | El validador otorgaba `EJECUTOR_APTO` basándose únicamente en `accredited: true` y una cadena no vacía en `evidence_doc`, sin verificar la existencia física del archivo ni requerir autorización externa. | Invariante 2.1, 2.3 & 7.3: Ningún manifiesto puede autocertificarse. El documento de evidencia debe existir y verificarse físicamente. Se exige compuerta expresa de auditor externo. | `check-preflight.mjs:385-482, 743-795`<br>`CONTRATO_EJECUTOR.md:46-53, 101-111` | `TC-R7-A01-REPRO`<br>`TC-R7-A01-NO-SELF-CERT`<br>`TC-R7-A01-FRAUD-APTO`<br>`TC-R7-A01-LOCAL-DOC-VERIFIED` | Fixture con `file:///NO-EXISTE/recibo.json` devolvía: `valid: true, validador_status: "VALIDADOR_PASS", executor_status: "EJECUTOR_APTO", errors: []`. | Falla estructuradamente con `valid: false, validador_status: "VALIDADOR_FAIL", executor_status: "EJECUTOR_NO_APTO"`, registrando: `"Evidence document does not exist or is inaccessible"`. Autodeclarar `status: EJECUTOR_APTO` sin auditor se sanciona como contradicción. |
| **2** | **R7-A02 (P1):** PASS por omisión en telemetría y esquema | El validador aceptaba `samples: []` conservando la duración declarada de 60s; aceptaba muestras sin métricas ni grupos; y dereferenciar `prev.started_at` lanzaba `TypeError` ante una muestra `null`. | Invariante 4.7, 5 & 7.1: Prohibición absoluta de PASS por omisión. Mínimo de 30 muestras. Duración calculada solo desde muestras válidas. 10 campos y 4 grupos obligatorios por muestra. | `check-preflight.mjs:485-610`<br>`CONTRATO_EJECUTOR.md:163-176, 407-463`<br>`preflight.ps1:400-470` | `TC-R7-A02-REPRO-EMPTY`<br>`TC-R7-A02-REPRO-NO-METRICS`<br>`TC-R7-A02-NULL-SAMPLE`<br>`TC-R7-A02-MIN-SAMPLES`<br>`TC-R7-A02-INCOMPLETE-GROUPS`<br>`TC-R7-A02-OVERLAPPING-SAMPLES`<br>`TC-R7-A02-FUTURE-TIMESTAMPS` | `samples: []` devolvía `valid: true, duration: 60000`. Muestras sin métricas devolvían `valid: true`. Muestra `null` arrojaba excepción no capturada `TypeError`. | `samples: []` devuelve `valid: false, duration: 0` y error `"Telemetry window must contain at least 30 samples"`. Muestras incompletas reportan campos faltantes. Muestras `null` se rechazan estructuradamente sin `TypeError`. |
| **3** | **R7-A03 (P1):** Presupuestos de interferencia no aplicados | En `:378-391` solo se comprobaba `typeof === 'number'`, sin comparar las muestras ni agregados contra los límites normativos predefinidos. | Invariante 4.6 & 7.4: Límites de interferencia obligatorios e inmutables: CPU externa $\le 10\%$, cola de disco $\le 2.0$, paginación $\le 500$, RAM libre $\ge 2048$ MB. | `check-preflight.mjs:359-383, 560-588`<br>`CONTRATO_EJECUTOR.md:156-162, 327-342` | `TC-R7-A03-REPRO-SATURATED`<br>`TC-R7-A03-DISK-QUEUE-SPIKE`<br>`TC-R7-A03-RAM-DEPLETED`<br>`TC-R7-A03-PAGING-SPIKE`<br>`TC-R7-A03-EXTERNAL-CPU-SPIKE` | Fixture con CPU 100%, RAM disponible 1 MB, cola 173 y paginación 275,938 devolvía `valid: true, errors: []`. | Rechazo determinista con `valid: false, validador_status: "VALIDADOR_FAIL"`, listando individualmente cada violación de cola, paginación, memoria y CPU externa. El manifiesto no puede relajar los presupuestos. |
| **4** | **R7-A04 (P1):** Sustitución por valores canónicos | `preflight.ps1` sustituía herramientas o archivos ausentes por `'v24.15.0'`, `'12.3.4'`, commit SHA de referencia, hashes canónicos y ceros para CIM. | Invariante 2.5 & 7.2: Principio Fail-Closed estricto. Prohibido sustituir observaciones ausentes o fallidas por valores esperados. | `preflight.ps1:240-330, 420-435`<br>`check-preflight.mjs:200-245, 340-357` | `TC-R7-A04-NULL-OBSERVATIONS`<br>`TC-R7-A04-NULL-SAMPLE-METRIC` | Comandos fallidos o bundles faltantes en disco eran enmascarados como conformes mediante asignaciones canónicas por defecto. | `preflight.ps1` retorna `$null` ante comandos o archivos ausentes y CIM aborta la captura. El validador rechaza cualquier valor ausente o nulo con `VALIDADOR_FAIL`. |
| **5** | **R7-A05 (P1):** Integridad Git eludible y opciones CLI ignoradas | `check-preflight.mjs:278-286` ampliaba la whitelist con rutas del manifiesto. CLI ignoraba opciones como `--expected-sha` y desconocidas. `preflight.ps1` ocultaba cambios en `r7/`. | Invariante 2.4, 4.4, 7.5 & 8.2: Whitelist fija e inmutable (`admin-user.json`). CLI estricta con parser de opciones y rechazo de flags desconocidas con salida 1. | `check-preflight.mjs:240-295, 630-740`<br>`preflight.ps1:278-295`<br>`CONTRATO_EJECUTOR.md:130-142` | `TC-R7-A05-REPRO-WHITELIST`<br>`TC-R7-A05-CLI-PARSER-OPTIONS`<br>`TC-R7-A05-CLI-UNKNOWN-FLAG`<br>`TC-R7-A05-CLI-EXEC-SHA-MISMATCH`<br>`TC-R7-A05-CLI-EXEC-UNKNOWN-FLAG` | Árbol sucio autoincluido en el manifiesto obtenía `valid: true`. CLI invocada con `--expected-sha 0000...` o `--unknown-flag` salía con código 0 (`PASS`). | Árbol sucio es rechazado con `valid: false`. `preflight.ps1` reporta `dirty_files` reales (incluyendo `r7/`). CLI sale con código 1 ante mismatch de SHA o bandera desconocida. |
| **6** | **R7-A06 (P2):** Toolchain incoherente | Discrepancia entre la exigencia de versiones exactas del contrato y regex permisivas en esquema y validador. Chromium no se comprobaba por defecto. | Invariante 4.3 & 7.6: Política unificada de toolchain canónico: Node `v24.15.0`, pnpm `12.3.4`, Chromium `151.0.7922.34` obligatorio por defecto. | `check-preflight.mjs:191-238`<br>`CONTRATO_EJECUTOR.md:120-128, 244-253` | `TC-R7-A06-REPRO-TOOLCHAIN`<br>`TC-R7-A06-CHROMIUM-BASELINE` | Fixture con Node `v24.0.1`, pnpm `12.0.1` y Chromium `0.0.0.0` devolvía `valid: true, validador_status: "VALIDADOR_PASS"`. | Rechazo determinista con `valid: false, validador_status: "VALIDADOR_FAIL"`, señalando discrepancias exactas frente a la línea base requerida. |
| **7** | **R7-A07 (P2):** Confinamiento de rutas incompleto | `preflight.ps1:185` usaba `StartsWith($scriptDir)` sin separador de directorio, permitiendo prefijos hermanos como `r7-externo`. SentinelFile/PidFile no estaban confinados. | Invariante 1.2, 7.7 & 8.1: Confinamiento hermético estricto en `r7/` para toda ruta de lectura, escritura o eliminación mediante separador de directorio. | `preflight.ps1:180-210, 750-765, 800-815`<br>`check-preflight.mjs:430-470` | `TC-R7-A07-PATH-CONFINEMENT-EVIDENCE`<br>`TC-R7-FAIL-CLOSED-INVARIANT`<br>Pruebas dinámicas PowerShell de confinamiento | Invocaciones con `-OutputPath r7-externo/out.json` o `-SentinelFile C:/Windows/temp/evil.stop` eran procesadas sin error de seguridad. | Ambas invocaciones son interceptadas por `Assert-PathConfinement`, lanzando inmediatamente `Security/Isolation Violation` y abortando la ejecución. |

---

### 3.2. Detalle de Evidencia Cuádruple por Hallazgo

#### Hallazgo R7-A01 (Acreditación Autodeclarada):
1. **Resultado incorrecto original (Defectuoso):**  
   Al mutar `resource_reservation` en el fixture canónico con `{ accredited: true, provenance: 'cloud_dedicated_host', type: 'dedicated_host', evidence_doc: 'file:///NO-EXISTE/recibo.json' }`, la llamada a `validatePreflightManifest(m1)` devolvió:  
   `{"valid":true,"validador_status":"VALIDADOR_PASS","executor_status":"EJECUTOR_APTO","errors":[]}`.  
   El validador promovió a apto a un ejecutor con documento inexistente y sin aprobación externa.
2. **Pruebas de regresión que lo detectan:**  
   `TC-R7-A01-REPRO`, `TC-R7-A01-NO-SELF-CERT`, `TC-R7-A01-FRAUD-APTO`, `TC-R7-A01-LOCAL-DOC-VERIFIED` en `check-preflight.test.mjs`.
3. **Corrección aplicada:**  
   En `check-preflight.mjs` (líneas 385–482, 743–795) y `CONTRATO_EJECUTOR.md` (Sección 2.1 y 2.3), se separó la validez de la acreditación. Se implementó comprobación física en disco (`fs.existsSync` y tamaño > 0) para esquemas `file://` y rutas locales. Se supeditó la emisión de `EJECUTOR_APTO` a la compuerta externa `options.auditorApproval === true`. Autodeclarar `status: "EJECUTOR_APTO"` sin compuerta de auditor se sanciona como contradicción formal con `VALIDADOR_FAIL`.
4. **Resultado correcto posterior (Corregido):**  
   Ante el fixture con archivo no existente, devuelve:  
   `{"valid":false,"validador_status":"VALIDADOR_FAIL","executor_status":"EJECUTOR_NO_APTO","errors":["Evidence document does not exist or is inaccessible: 'file:///NO-EXISTE/recibo.json'"]}`.

#### Hallazgo R7-A02 (PASS por Omisión en Telemetría y Esquema):
1. **Resultado incorrecto original (Defectuoso):**  
   - Caso `samples: []`: devolvió `{"valid":true,"validador_status":"VALIDADOR_PASS","duration":60000,"errors":[]}`.
   - Caso muestras sin métricas: devolvió `{"valid":true,"validador_status":"VALIDADOR_PASS","errors":[]}`.
   - Caso muestra `null` en índice 0: lanzó excepción no capturada `TypeError: Cannot read properties of null (reading 'started_at')` en línea 476.
2. **Pruebas de regresión que lo detectan:**  
   `TC-R7-A02-REPRO-EMPTY`, `TC-R7-A02-REPRO-NO-METRICS`, `TC-R7-A02-NULL-SAMPLE`, `TC-R7-A02-MIN-SAMPLES`, `TC-R7-A02-INCOMPLETE-GROUPS`, `TC-R7-A02-OVERLAPPING-SAMPLES`, `TC-R7-A02-FUTURE-TIMESTAMPS`.
3. **Corrección aplicada:**  
   En `check-preflight.mjs` (líneas 485–610) y `CONTRATO_EJECUTOR.md` (Sección 4.7, 5 y 6), se exigió un mínimo normativo de 30 muestras. La duración observada se calcula exclusivamente como `lastFinish - firstStart` desde muestras válidas (0 si está vacío). Cada muestra individual debe contener obligatoriamente los 10 campos métricos requeridos y exactamente 4 grupos de procesos únicos (`node`, `chromium`, `observer`, `other`) con sus 5 propiedades numéricas. Se agregaron guardas seguras para muestras nulas y validaciones contra saltos, superposiciones y timestamps futuros.
4. **Resultado correcto posterior (Corregido):**  
   - Caso vacío: `{"valid":false,"validador_status":"VALIDADOR_FAIL","errors":["Telemetry window must contain at least 30 samples (received 0)"]}`.
   - Caso sin métricas: `{"valid":false,"validador_status":"VALIDADOR_FAIL","errors":["Sample at index 0 missing required metric field: 'cpu_percent'", ...]}` (540 violaciones capturadas estructuradamente).
   - Caso muestra `null`: `{"valid":false,"validador_status":"VALIDADOR_FAIL","errors":["Sample at index 0 is null, undefined, or not a valid object"]}` sin lanzar excepciones `TypeError`.

#### Hallazgo R7-A03 (Presupuestos de Interferencia no Aplicados):
1. **Resultado incorrecto original (Defectuoso):**  
   Al someter al validador un fixture saturado (CPU 100%, RAM libre 1 MB, cola de disco 173, paginación 275,938 pág/s y CPU externa 25%), el código original devolvió:  
   `{"valid":true,"validador_status":"VALIDADOR_PASS","errors":[]}`.
2. **Pruebas de regresión que lo detectan:**  
   `TC-R7-A03-REPRO-SATURATED`, `TC-R7-A03-DISK-QUEUE-SPIKE`, `TC-R7-A03-RAM-DEPLETED`, `TC-R7-A03-PAGING-SPIKE`, `TC-R7-A03-EXTERNAL-CPU-SPIKE`.
3. **Corrección aplicada:**  
   En `check-preflight.mjs` (líneas 359–383, 560–588) y `CONTRATO_EJECUTOR.md` (Sección 4.6), se fijaron los presupuestos normativos de contención como constantes inmutables (`NORMATIVE_INTERFERENCE_LIMITS`: CPU ext $\le 10\%$, cola $\le 2.0$, paginación $\le 500$, RAM $\ge 2048$ MB). Se implementó la verificación muestra a muestra de cada una de estas métricas, así como de los agregados de ventana (`min_available_mb` y `max_pages_input_per_sec`). El validador acota los límites declarados mediante `Math.min`/`Math.max` impidiendo que el ejecutor los relaje.
4. **Resultado correcto posterior (Corregido):**  
   Ante el fixture saturado, devuelve:  
   `{"valid":false,"validador_status":"VALIDADOR_FAIL","errors":["Sample 0 violates disk_queue limit: 173 > 2", "Sample 0 violates pages_input_per_sec limit: 275938 > 500", "Sample 0 violates available_ram_mb limit: 1 < 2048", "Sample 0 violates external_cpu limit in group other: 25 > 10", ...]}` (240 violaciones registradas deterministamente).

#### Hallazgo R7-A04 (Sustitución por Valores Canónicos):
1. **Resultado incorrecto original (Defectuoso):**  
   En `preflight.ps1`, ante comandos nativos fallidos o archivos inexistentes, se asignaban sintéticamente `'v24.15.0'`, `'12.3.4'`, commit SHA de referencia, hashes canónicos y `0.0` para CIM, produciendo falsa evidencia de conformidad en el host.
2. **Pruebas de regresión que lo detectan:**  
   `TC-R7-A04-NULL-OBSERVATIONS`, `TC-R7-A04-NULL-SAMPLE-METRIC`, y auditoría estática de código.
3. **Corrección aplicada:**  
   En `preflight.ps1` (líneas 240–330, 420–435), se suprimieron todos los fallbacks canónicos. Comandos que fallan (`$LASTEXITCODE -ne 0`) o archivos no existentes retornan `$null`. Contadores CIM ausentes abortan de inmediato la captura de telemetría. En `check-preflight.mjs`, se implementaron comprobaciones fail-closed que rechazan de forma cerrada cualquier observación ausente o nula en toolchain, Git, hashes de compilación o telemetría.
4. **Resultado correcto posterior (Corregido):**  
   Cualquier omisión de observación en el manifiesto es rechazada por el validador con `VALIDADOR_FAIL` (e.g. `"Missing required dist hash for 'packages/mcp/dist/server.js'"`). `preflight.ps1` reporta con fidelidad la ausencia de herramientas o artefactos sin simular éxito.

#### Hallazgo R7-A05 (Integridad Git Eludible y Opciones CLI Ignoradas):
1. **Resultado incorrecto original (Defectuoso):**  
   - El validador aceptaba árboles de trabajo sucios si el archivo era añadido a `manifest.git.allowed_untracked_or_modified`. Mutar con `dirty_files: ['packages/mcp/src/server.ts']` devolvía `valid: true`.
   - La CLI salía con código de éxito 0 al pasar `--expected-sha 0000000000000000000000000000000000000000` o `--unknown-flag`.
   - `preflight.ps1` excluía de forma oculta los cambios en `r7/`.
2. **Pruebas de regresión que lo detectan:**  
   `TC-R7-A05-REPRO-WHITELIST`, `TC-R7-A05-CLI-PARSER-OPTIONS`, `TC-R7-A05-CLI-UNKNOWN-FLAG`, `TC-R7-A05-CLI-EXEC-SHA-MISMATCH`, `TC-R7-A05-CLI-EXEC-UNKNOWN-FLAG`.
3. **Corrección aplicada:**  
   En `CONTRATO_EJECUTOR.md` (Sección 4.4) y `check-preflight.mjs` (líneas 240–295), se estableció que la whitelist de Git es única, externa e inmutable (`ALLOWED_GIT_EXCEPTIONS`), admitiendo exclusivamente `packages/playwright-runner/.qa/cache/sessions/admin-user.json`. Cualquier ruta suministrada por el manifiesto es desestimada. En `preflight.ps1` (líneas 278–295), se eliminó la exclusión de `r7/` y se capturan fielmente todos los `dirty_files`. En la CLI (líneas 630–740), se implementó `parseCliArgs` con validación estricta de opciones documentadas, salida con código 1 ante flags desconocidas y verificación estricta de `--expected-sha`.
4. **Resultado correcto posterior (Corregido):**  
   - Manifiesto con árbol sucio forjado: `{"valid":false,"validador_status":"VALIDADOR_FAIL","errors":["Working tree is dirty with unapproved modified/untracked files: packages/mcp/src/server.ts"]}`.
   - CLI con `--expected-sha 0000...`: sale con código de error 1 y rechaza el manifiesto.
   - CLI con `--unknown-flag`: sale con código de error 1 y emite: `Error: Unknown CLI option(s): --unknown-flag`.

#### Hallazgo R7-A06 (Toolchain Incoherente):
1. **Resultado incorrecto original (Defectuoso):**  
   Un fixture con versiones no canónicas (Node `v24.0.1`, pnpm `12.0.1`, Chromium `0.0.0.0`) devolvía `valid: true, validador_status: "VALIDADOR_PASS"` debido a que el validador permitía expresiones regulares amplias y no comprobaba Chromium por defecto.
2. **Pruebas de regresión que lo detectan:**  
   `TC-R7-A06-REPRO-TOOLCHAIN`, `TC-R7-A06-CHROMIUM-BASELINE`.
3. **Corrección aplicada:**  
   En `CONTRATO_EJECUTOR.md` (Sección 4.3 y 5) y `check-preflight.mjs` (líneas 191–238), se unificó la política canónica: Node.js `v24.15.0`, pnpm `12.3.4` y Playwright Chromium `151.0.7922.34` son obligatorios por defecto. En el esquema JSON se restringieron los patrones a coincidencias exactas. Se reconciliaron las cláusulas de RAM para evitar contradicciones normativas.
4. **Resultado correcto posterior (Corregido):**  
   Ante el fixture con versiones divergentes, devuelve:  
   `{"valid":false,"validador_status":"VALIDADOR_FAIL","errors":["Toolchain node_version 'v24.0.1' does not match required baseline (expected v24.15.0)", "Toolchain pnpm_version '12.0.1' does not match required baseline (expected 12.3.4)", "Toolchain chromium_version '0.0.0.0' does not match required baseline (expected 151.0.7922.34)"]}`.

#### Hallazgo R7-A07 (Confinamiento de Rutas Incompleto):
1. **Resultado incorrecto original (Defectuoso):**  
   `preflight.ps1:185` utilizaba `$resolvedOutput.StartsWith($scriptDir)` sin separador de ruta, permitiendo rutas en carpetas hermanas como `r7-externo`. Los parámetros `-SentinelFile` y `-PidFile` no eran validados, permitiendo escrituras o borrados arbitrarios.
2. **Pruebas de regresión que lo detectan:**  
   `TC-R7-A07-PATH-CONFINEMENT-EVIDENCE`, `TC-R7-FAIL-CLOSED-INVARIANT`, y comprobaciones dinámicas con PowerShell.
3. **Corrección aplicada:**  
   En `preflight.ps1` (líneas 180–210), se implementó la función estricta `Assert-PathConfinement`, la cual resuelve la ruta absoluta y comprueba que empiece con `$scriptDir` concatenado con el separador de directorio (`[System.IO.Path]::DirectorySeparatorChar`). Esta aserción se aplica obligatoriamente a `$OutputPath`, `$SentinelFile`, `$PidFile`, `$sentinelPath` y `$pidFilePath` antes de cualquier operación de escritura o borrado. En `check-preflight.mjs` se validan resoluciones absolutas de evidencias.
4. **Resultado correcto posterior (Corregido):**  
   Cualquier intento de apuntar a `r7-externo` o a rutas de sistema (e.g. `C:/Windows/temp/evil.stop`) es interceptado inmediatamente con la excepción de seguridad:  
   `Security/Isolation Violation: OutputPath ('.../r7-externo/out.json') must be strictly confined inside '.../r7'`.

---

## 4. Catálogo de Artefactos Confinados en `r7/`

Todo el sistema reside exclusivamente en `docs/vnext/implementaciones/VNEXT-014-E01/r7/`:

```
docs/vnext/implementaciones/VNEXT-014-E01/r7/
├── CONTRATO_EJECUTOR.md       # Contrato normativo formal, JSON Schema Draft-07 y compuertas auditables
├── manifest-ejemplo.json      # Fixture canónico sintético conforme (60 muestras completas, 60.000 ms)
├── preflight.ps1              # Script de inspección host fail-closed con Assert-PathConfinement (Baseline/Background)
├── check-preflight.mjs        # Motor de validación pura y CLI estricta con parseCliArgs
├── check-preflight.test.mjs   # Suite automatizada nativa de Node.js (62 pruebas, 100% PASS)
├── AUDITORIA_CODEX_2026-11-07.md # Informe de auditoría independiente original de Codex (INALTERADO)
└── README.md                  # Este informe integral de integración, trazabilidad y guía de operación
```

---

## 5. Guía de Operación y Reproducibilidad con Comandos Exactos

Todas las instrucciones se ejecutan desde la raíz del repositorio (`QAMCP`):

### 5.1. Ejecución de la Suite Nativa Completa de Pruebas (62 Pruebas)

Ejecuta todas las pruebas unitarias, sintéticas y de regresión adversarial bajo el ejecutor nativo de Node.js (sin Vitest):

```bash
node --test docs/vnext/implementaciones/VNEXT-014-E01/r7/check-preflight.test.mjs
```

**Resultado Verbatim Esperado:**
```text
✔ TC-01 a TC-35: 35 pruebas originales del validador (PASS)
✔ TC-R7-A01-REPRO a TC-R7-A01-LOCAL-DOC-VERIFIED (4 pruebas R7-A01 PASS)
✔ TC-R7-A02-REPRO-EMPTY a TC-R7-A02-FUTURE-TIMESTAMPS (7 pruebas R7-A02 PASS)
✔ TC-R7-A03-REPRO-SATURATED a TC-R7-A03-EXTERNAL-CPU-SPIKE (5 pruebas R7-A03 PASS)
✔ TC-R7-A04-NULL-OBSERVATIONS a TC-R7-A04-NULL-SAMPLE-METRIC (2 pruebas R7-A04 PASS)
✔ TC-R7-A05-REPRO-WHITELIST a TC-R7-A05-CLI-EXEC-UNKNOWN-FLAG (5 pruebas R7-A05 PASS)
✔ TC-R7-A06-REPRO-TOOLCHAIN a TC-R7-A06-CHROMIUM-BASELINE (2 pruebas R7-A06 PASS)
✔ TC-R7-A07-PATH-CONFINEMENT-EVIDENCE y TC-R7-FAIL-CLOSED-INVARIANT (2 pruebas R7-A07 PASS)
ℹ tests 62
ℹ pass 62
ℹ fail 0
```
*Salida: exit code 0.*

### 5.2. Validación CLI del Fixture Canónico Conforme

```bash
node docs/vnext/implementaciones/VNEXT-014-E01/r7/check-preflight.mjs docs/vnext/implementaciones/VNEXT-014-E01/r7/manifest-ejemplo.json
```

**Salida Verbatim Esperada (exit code 0):**
```json
{
  "valid": true,
  "validador_status": "VALIDADOR_PASS",
  "executor_status": "EJECUTOR_NO_APTO",
  "reasons": [
    "PREPARADO / RESERVA NO ACREDITADA"
  ],
  "errors": [],
  "warnings": [],
  "details": {
    "schema_valid": true,
    "git_valid": true,
    "toolchain_valid": true,
    "dist_hashes_valid": true,
    "reservation_accredited": false,
    "telemetry_valid": true,
    "telemetry_duration_ms": 60000,
    "max_observed_gap_ms": 850
  }
}
```

### 5.3. Casos de Rechazo Estricto por CLI

1. **Rechazo ante opción o bandera desconocida:**
   ```bash
   node docs/vnext/implementaciones/VNEXT-014-E01/r7/check-preflight.mjs docs/vnext/implementaciones/VNEXT-014-E01/r7/manifest-ejemplo.json --unknown-flag
   ```
   *Salida esperada (exit code 1):*  
   `Error: Unknown CLI option(s): --unknown-flag`

2. **Rechazo ante discrepancia de Commit SHA (`--expected-sha`):**
   ```bash
   node docs/vnext/implementaciones/VNEXT-014-E01/r7/check-preflight.mjs docs/vnext/implementaciones/VNEXT-014-E01/r7/manifest-ejemplo.json --expected-sha 0000000000000000000000000000000000000000
   ```
   *Salida esperada (exit code 1):*  
   `valid: false`, `validador_status: "VALIDADOR_FAIL"`, `Git commit_sha '...' does not match expected '0000000000000000000000000000000000000000'`.

### 5.4. Ejecución del Script de Inspección Host en PowerShell

Para realizar una inspección de host sincrónica en modo Baseline:

```powershell
powershell -File .\docs\vnext\implementaciones\VNEXT-014-E01\r7\preflight.ps1 -Mode Baseline -MinDurationSeconds 60 -Samples 60 -WindowName "preflight-local"
```

*Verifica de solo lectura el toolchain (Node, pnpm, Chromium), el estado de Git, los hashes de distribución y recolecta 60 muestras de telemetría de 1 segundo sin sustituciones canónicas ni falsos positivos.*

### 5.5. Comprobación del Confinamiento Hermético de Rutas en PowerShell

Verifica que cualquier intento de salir del directorio `r7/` es bloqueado:

```powershell
powershell -Command "try { & '.\docs\vnext\implementaciones\VNEXT-014-E01\r7\preflight.ps1' -OutputPath '.\docs\vnext\implementaciones\VNEXT-014-E01\r7-externo\out.json' } catch { Write-Host `"SECURITY_BLOCKED: `$_`" }"
```

*Salida esperada:*  
`SECURITY_BLOCKED: Security/Isolation Violation: OutputPath ('...\r7-externo\out.json') must be strictly confined inside '...\r7'`

### 5.6. Verificación Dinámica de los Seis Casos de Auditoría de Codex en Memoria

Para reproducir y constatar que los 6 casos señalados por Codex son rechazados:

```bash
node -e "
import fs from 'node:fs';
import {validatePreflightManifest as validate} from './docs/vnext/implementaciones/VNEXT-014-E01/r7/check-preflight.mjs';
const base = JSON.parse(fs.readFileSync('./docs/vnext/implementaciones/VNEXT-014-E01/r7/manifest-ejemplo.json', 'utf8'));
const cases = {
  autodeclaracion: m => Object.assign(m.resource_reservation, { accredited: true, provenance: 'cloud_dedicated_host', type: 'dedicated_host', evidence_doc: 'file:///NO-EXISTE/recibo.json' }),
  vacio: m => { m.telemetry_window.samples = []; m.telemetry_window.sample_count = 0; },
  sinMetricas: m => { m.telemetry_window.samples = m.telemetry_window.samples.map(({ started_at, finished_at }) => ({ started_at, finished_at })); },
  saturado: m => { for (const s of m.telemetry_window.samples) { s.cpu_percent = 100; s.available_mb = 1; s.disk_queue = 173; s.pages_input_per_sec = 275938; for (const g of s.groups) g.cpu_percent_logical_capacity = 25; } },
  versiones: m => Object.assign(m.toolchain, { node_version: 'v24.0.1', pnpm_version: '12.0.1', chromium_version: '0.0.0.0' }),
  whitelist: m => Object.assign(m.git, { clean_working_tree: false, dirty_files: ['packages/mcp/src/server.ts'], allowed_untracked_or_modified: ['packages/mcp/src/server.ts'] })
};
let allRejected = true;
for (const [name, mutate] of Object.entries(cases)) {
  const m = structuredClone(base); mutate(m); const r = validate(m);
  if (r.valid) { console.error('FAILED TO REJECT:', name); allRejected = false; }
}
if (allRejected) console.log('CONFIRMED: ALL 6 AUDIT CASES REJECTED (valid: false)');
"
```

*Salida esperada:*  
`CONFIRMED: ALL 6 AUDIT CASES REJECTED (valid: false)`

---

## 6. Prompt Formal de Traspaso y Entrega a Codex

El siguiente bloque constituye la comunicación formal y operativa para traspasar la revisión y dictamen final a Codex:

````markdown
### INSTRUCCIÓN FORMAL DE TRASPASO A CODEX — REMEDIACIÓN PREFLIGHT R7 (VNEXT-014-E01)

Estimado Auditor Técnico Codex:

El equipo de implementación de Gemini Teamwork ha completado la remediación integral de los siete hallazgos de falsos positivos y compuertas eludibles identificados en su informe independiente `AUDITORIA_CODEX_2026-11-07.md`.

La entrega se encuentra publicada en la rama exclusiva `feat/qap-vnext-architecture`.

#### 1. Directivas de Integridad y Confinamiento Observadas
- **Sin modificación de producto ni pruebas preexistentes:** Ningún archivo de producción en `packages/*`, configuración de Vitest, workers ni timeouts fue alterado.
- **Sin dependencias externas:** Implementado exclusivamente con módulos estándar de Node.js (`node:test`, `node:assert/strict`, `node:fs`, `node:path`) y PowerShell CIM nativo.
- **Confinamiento estricto en `r7/`:** Las modificaciones se limitaron exclusivamente a los archivos bajo `docs/vnext/implementaciones/VNEXT-014-E01/r7/`.
- **Protección de sesión local:** El archivo sensible `packages/playwright-runner/.qa/cache/sessions/admin-user.json` no fue leído, alterado ni incluido en el stage de Git.
- **Informe de auditoría inalterado:** El archivo `AUDITORIA_CODEX_2026-11-07.md` se preservó íntegramente como referencia normativa histórica.
- **E01 NO ejecutada ni resuelta:** La suite E01 permanece sin ejecutar y sin autorizar.
- **Principio de No Autocertificación:** Gemini Teamwork no autocertifica idoneidad ni infraestructura; el dictamen sobre la aptitud del ejecutor y la aceptación de esta entrega le corresponde a usted de manera exclusiva.
- **Invariante de Capacidad:** El resultado operativo permanece en `EJECUTOR_NO_APTO` (`PREPARADO / RESERVA NO ACREDITADA`). `VALIDADOR_PASS` nunca equivale a `EJECUTOR_APTO`.

#### 2. Inventario de Entregables Remediados en `r7/`
1. `CONTRATO_EJECUTOR.md`: Especificación normativa endurecida, esquema JSON Draft-07 con comprobación muestra a muestra de presupuestos de interferencia, erradicación de autodeclaración y compuerta auditable externa.
2. `manifest-ejemplo.json`: Fixture canónico sintético conforme (60 muestras completas con 10 campos métricos y 4 grupos de procesos).
3. `preflight.ps1`: Script PowerShell de inspección fail-closed con función `Assert-PathConfinement` (confinamiento hermético en `r7/` para salidas, centinelas y PIDs), erradicación de fallbacks canónicos y supresión de switches de autocertificación.
4. `check-preflight.mjs`: Motor de validación determinista e interfaz CLI robusta (`parseCliArgs`) con soporte para `--expected-sha`, rechazo de banderas desconocidas con salida 1, verificación física de documentos locales y compuerta externa de auditor.
5. `check-preflight.test.mjs`: Suite automatizada nativa de Node.js ampliada a 62 pruebas (35 originales + 27 pruebas de regresión cubriendo exhaustivamente los 7 hallazgos R7-A01 a R7-A07, todas en PASS).
6. `README.md`: Este informe de integración, matriz de correspondencia y guía de operación.

#### 3. Comandos de Verificación Independiente para Codex
Desde la raíz del repositorio (`QAMCP`):

1. **Ejecutar la suite completa de 62 pruebas de Node.js:**
   ```powershell
   node --test docs/vnext/implementaciones/VNEXT-014-E01/r7/check-preflight.test.mjs
   ```
   *Criterio de aceptación:* 62 tests, 62 pass, 0 fail, 0 skipped, salida exit code 0.

2. **Validar el fixture canónico sintético conforme:**
   ```powershell
   node docs/vnext/implementaciones/VNEXT-014-E01/r7/check-preflight.mjs docs/vnext/implementaciones/VNEXT-014-E01/r7/manifest-ejemplo.json
   ```
   *Criterio de aceptación:* Salida exit code 0, `validador_status: VALIDADOR_PASS`, `executor_status: EJECUTOR_NO_APTO`, razón: `PREPARADO / RESERVA NO ACREDITADA`.

3. **Verificar rechazo CLI ante opción desconocida:**
   ```powershell
   node docs/vnext/implementaciones/VNEXT-014-E01/r7/check-preflight.mjs docs/vnext/implementaciones/VNEXT-014-E01/r7/manifest-ejemplo.json --unknown-flag
   ```
   *Criterio de aceptación:* Salida exit code 1, mensaje `Error: Unknown CLI option(s): --unknown-flag`.

4. **Verificar rechazo CLI ante SHA discrepante:**
   ```powershell
   node docs/vnext/implementaciones/VNEXT-014-E01/r7/check-preflight.mjs docs/vnext/implementaciones/VNEXT-014-E01/r7/manifest-ejemplo.json --expected-sha 0000000000000000000000000000000000000000
   ```
   *Criterio de aceptación:* Salida exit code 1, `valid: false`, `validador_status: VALIDADOR_FAIL`.

5. **Verificar confinamiento hermético de rutas en PowerShell:**
   ```powershell
   powershell -Command "try { & '.\docs\vnext\implementaciones\VNEXT-014-E01\r7\preflight.ps1' -OutputPath '.\docs\vnext\implementaciones\VNEXT-014-E01\r7-externo\out.json' } catch { Write-Host $_ }"
   ```
   *Criterio de aceptación:* Lanza excepción `Security/Isolation Violation` y aborta inmediatamente.

6. **Verificar rechazo dinámico de los 6 casos de auditoría de Codex en memoria:**
   ```powershell
   node -e "import fs from 'node:fs'; import {validatePreflightManifest as validate} from './docs/vnext/implementaciones/VNEXT-014-E01/r7/check-preflight.mjs'; const base = JSON.parse(fs.readFileSync('./docs/vnext/implementaciones/VNEXT-014-E01/r7/manifest-ejemplo.json', 'utf8')); const cases = { autodeclaracion: m => Object.assign(m.resource_reservation, { accredited: true, provenance: 'cloud_dedicated_host', type: 'dedicated_host', evidence_doc: 'file:///NO-EXISTE/recibo.json' }), vacio: m => { m.telemetry_window.samples = []; m.telemetry_window.sample_count = 0; }, sinMetricas: m => { m.telemetry_window.samples = m.telemetry_window.samples.map(({ started_at, finished_at }) => ({ started_at, finished_at })); }, saturado: m => { for (const s of m.telemetry_window.samples) { s.cpu_percent = 100; s.available_mb = 1; s.disk_queue = 173; s.pages_input_per_sec = 275938; for (const g of s.groups) g.cpu_percent_logical_capacity = 25; } }, versiones: m => Object.assign(m.toolchain, { node_version: 'v24.0.1', pnpm_version: '12.0.1', chromium_version: '0.0.0.0' }), whitelist: m => Object.assign(m.git, { clean_working_tree: false, dirty_files: ['packages/mcp/src/server.ts'], allowed_untracked_or_modified: ['packages/mcp/src/server.ts'] }) }; let allRejected = true; for (const [name, mutate] of Object.entries(cases)) { const m = structuredClone(base); mutate(m); const r = validate(m); if (r.valid) { console.error('FAILED TO REJECT:', name); allRejected = false; } } if (allRejected) console.log('CONFIRMED: ALL 6 AUDIT CASES REJECTED');"
   ```
   *Criterio de aceptación:* Emite `CONFIRMED: ALL 6 AUDIT CASES REJECTED` con exit code 0.

7. **Auditar estado del árbol de trabajo Git:**
   ```powershell
   git status --porcelain=v1
   ```
   *Criterio de aceptación:* Confirmar que no hay archivos fuera de `r7/` en el commit de remediación y que `packages/playwright-runner/.qa/cache/sessions/admin-user.json` permanece sin stage.

#### 4. Criterio de Decisión para Codex
- Si el ejecutor disponible es una máquina de desarrollo compartida sin asignación de recursos dedicada: ratificar el dictamen `PREPARADO / RESERVA NO ACREDITADA` (`EJECUTOR_NO_APTO`) y **NO autorizar la ejecución de E01**.
- Si y solo si se dispone de un host con asignación formal dedicada acreditada documentalmente (núcleos pinned, memoria física garantizada sin sobrecompromiso y evidencia externa auditable): otorgar compuerta de auditoría y autorizar la ejecución de E01 bajo monitorización en segundo plano con `preflight.ps1 -Mode Background`.
````

---

## 7. Declaraciones Normativas de Seguridad y Límites

1. **Estado de E01:**  
   La suite E01 **NO se considera resuelta**. La remediación se limitó a reparar la infraestructura de preflight para que Codex decida si se puede o no autorizar la ejecución.
2. **Inalterabilidad del Producto:**  
   Ningún archivo de código de producción (`packages/*`) ha sido alterado.
3. **Inalterabilidad de Pruebas y Configuración:**  
   No se modificaron archivos de configuración de Vitest, ni presupuestos de timeout (5000 ms / 10000 ms), ni workers, ni scripts de R5 o R6-A.
4. **Protección de Sesión Local:**  
   El archivo sensible `packages/playwright-runner/.qa/cache/sessions/admin-user.json` no fue leído ni incluido en stage.
5. **Rama y Publicación:**  
   La entrega se publica de forma trazable en `feat/qap-vnext-architecture`.

---

## 8. Auditoría Técnica de `c34e1e5`, Plan Completo de Corrección R7-R2 y Prompt de Ejecución

Tras la revisión independiente de Codex (`REAUDITORIA_CODEX_2026-11-07.md`) sobre el commit `c34e1e51b153cb7006104cd0e698ad2a3e905083`, se verificó que las 62 pruebas pasan y el hallazgo `R7-A06` quedó cerrado para la comparación canónica predeterminada, pero persisten **seis brechas (`R7-R01` a `R7-R06`)** que impiden aceptar la entrega como compuerta de autorización.

### 8.1. Auditoría Técnica Detallada de las 6 Brechas (`R7-R01` a `R7-R06`)

| ID | Severidad | Ubicación Exacta en `c34e1e5` | Diagnóstico Forense de la Brecha |
| :--- | :---: | :--- | :--- |
| **`R7-R01`** | **P1** | `check-preflight.mjs:415-483, 775-788, 866-867` | **Compuerta de aprobación reducible a bandera booleana sin decisión verificable:**<br>• Pasar `{ auditorApproval: true }` o `--auditor-approval` promueve a `EJECUTOR_APTO` sin verificar quién aprobó ni qué aprobó.<br>• Si `evidence_doc` es `https://no-evidence.invalid/reserva`, solo ejecuta `new URL()` sin verificar existencia ni contenido.<br>• Si `evidence_doc` es ruta local, solo comprueba `fs.existsSync` y `stat.size > 0` (no comprueba `stat.isFile()`, ni lee/parsea el JSON, ni verifica hash SHA-256, `executor_id`, alcance CPU/RAM, vigencia ni `expectedCommitSha`). |
| **`R7-R02`** | **P1** | `check-preflight.mjs:499-623, 709-733` | **PASS por omisión y validación incompleta del esquema Draft-07:**<br>• No valida `additionalProperties: false` en raíz ni en objetos anidados (`unapproved = true` pasa).<br>• En `resource_reservation.swap_policy`, no valida tipo/enum (`swap_policy = null` pasa).<br>• En `telemetry_window`, acepta `cpu_stats = {}`, `mem_stats = {}`, `page_faults = {}` vacíos y no contrasta sus agregados contra `samples`.<br>• Acepta `sample_count = 'sesenta'`, `interval_ms = -1`, `start_time = 'INVALID'`, `end_time = 'INVALID'`, `duration_ms = 999999` sin contrastar contra `samples`.<br>• En `samples[i]`, acepta `cpu_percent = 999` (debe ser `<= 100`) y `groups[0].count = 0.5` (debe ser entero `>= 0`). |
| **`R7-R03`** | **P1** | `preflight.ps1:425-433`<br>`check-preflight.mjs:693-700` | **Atribución de CPU externa omite procesos Node/Chromium ajenos:**<br>• `preflight.ps1` clasifica todos los procesos `node` y `chrome`/`headless_shell` por nombre.<br>• `check-preflight.mjs` aplica el presupuesto `<= 10.0%` únicamente al grupo `other`.<br>• Un proceso Node ajeno consumiendo 90% de CPU (`cpu_percent = 90`, `node = 90`, `other = 0`) pasa con `valid: true`. Además, no se valida coherencia entre la suma de CPU de los grupos y `sample.cpu_percent`. |
| **`R7-R04`** | **P1** | `preflight.ps1:318-337, 404-479` | **Fallo de `git status` interpretado como árbol limpio y contadores nulos convertidos a `0`:**<br>• `Get-HostGitState` ejecuta `git status --porcelain 2>$null` sin verificar `$LASTEXITCODE -eq 0`. Si `git status` falla (`LASTEXITCODE = 128` sin salida), `$dirtyFiles` queda vacío y devuelve `clean_working_tree: true`.<br>• `Measure-HostTelemetryWindow` solo verifica `$null -eq $mem.AvailableMBytes`; convierte `CommittedBytes`, `CommitLimit`, `PagesInputPersec` y `PagesOutputPersec` a `[double]` sin verificar `$null` (en PowerShell `[double]$null` produce `0.0`).<br>• En `Win32_PerfFormattedData_PerfProc_Process`, las sumas de métricas ausentes siguen convirtiéndose en `0.0` sin distinguir grupo vacío (`count == 0`) de consulta/propiedad fallida. |
| **`R7-R05`** | **P1** | `check-preflight.mjs:293-328, 814-880` | **Contradicción Git ignorada, SHA esperado opcional en APTO y CLI permisiva:**<br>• Si `clean_working_tree === true`, `check-preflight.mjs` ignora `dirty_files` (`clean_working_tree: true` con `dirty_files: ['packages/mcp/src/server.ts']` devuelve `VALIDADOR_PASS`).<br>• `expectedCommitSha` es opcional incluso al autorizar `EJECUTOR_APTO`.<br>• `parseCliArgs` acepta `--expected-sha` sin valor (`undefined`) y `--max-gap=abc` (`NaN` reemplazado por default `5000`), saliendo con código `0`. |
| **`R7-R06`** | **P2** | `preflight.ps1:174-187` | **Confinamiento léxico sin resolución de enlaces simbólicos, junctions o reparse points:**<br>• `Assert-PathConfinement` solo aplica `[System.IO.Path]::GetFullPath($Path)` y comparación de prefijo.<br>• Una ruta `r7/enlace/salida.json` donde `r7/enlace` sea un junction o symlink que apunte fuera de `r7/` pasa la validación léxica y permite escribir o borrar fuera de `r7/`. |

---

### 8.2. Plan de Corrección Quirúrgico (R7-R2)

#### Fase 1 — Contratos y Esquema (`CONTRATO_EJECUTOR.md` y `manifest-ejemplo.json`)
1. **Formalizar la Decisión Externa Auditable (`R7-R01`):**
   - Prohibir que un booleano (`auditorApproval: true` / `--auditor-approval`) o una URL HTTP(S) no verificable acrediten la reserva.
   - Exigir que `resource_reservation.evidence_doc` (cuando `accredited === true`) apunte a un archivo regular local legible dentro del alcance permitido, cuyo contenido JSON declare explícitamente `executor_id`, `provenance`, `type`, `allocated_cores`, `allocated_ram_mb` y `exclusive_reservation: true` coincidentes con el manifiesto.
   - Exigir un objeto/archivo de decisión externa verificable (`options.auditorDecision` o `--auditor-decision <path>`) que contenga y valide:
     - `decision === "APPROVED"`
     - `auditor_id` (string no vacío)
     - `executor_id === manifest.executor_id`
     - `approved_commit_sha` (40 hex) `=== manifest.git.commit_sha === options.expectedCommitSha`
     - `evidence_doc_sha256` (64 hex) `=== SHA-256 real del archivo evidence_doc en disco`
     - `allocated_cores >= manifest.resource_reservation.allocated_cores` y `allocated_ram_mb >= manifest.resource_reservation.allocated_ram_mb`
     - `issued_at_utc` y `expires_at_utc` válidos con `issued_at_utc <= telemetry_window.start_time` y `telemetry_window.end_time <= expires_at_utc`.
2. **Formalizar Validación Completa de Esquema y Consistencia (`R7-R02`, `R7-R03`, `R7-R05`):**
   - Hacer cumplir `additionalProperties: false` en todos los niveles del manifiesto.
   - Exigir consistencia matemática entre `samples` y los agregados `cpu_stats`, `mem_stats` y `page_faults`, así como entre `start_time`, `end_time`, `duration_ms`, `interval_ms`, `sample_count` y el arreglo `samples`.
   - Establecer que en preflight Baseline (o sin PIDs explícitamente autorizados para la fase), toda carga de CPU en `node`, `chromium` y `other` se contabiliza dentro del presupuesto de interferencia externa (`<= 10.0%`), y que la suma de CPU de los 4 grupos debe ser coherente con `sample.cpu_percent`.

#### Fase 2 — Reproducción Previa Obligatoria contra `c34e1e5`
1. Antes de modificar la lógica de `check-preflight.mjs` o `preflight.ps1`, ejecutar y registrar en `README.md` la salida de los 7 casos del bloque de reproducción de `REAUDITORIA_CODEX_2026-11-07.md` (`aggregates`, `metadata`, `ranges`, `additional`, `gitContradiction`, `externalNode`, `unverifiedApproval`), las invocaciones CLI (`--expected-sha` sin valor, `--max-gap=abc`) y la prueba de `Get-HostGitState` con `LASTEXITCODE = 128`.

#### Fase 3 — Reparación de `preflight.ps1` (`R7-R03`, `R7-R04`, `R7-R06`)
1. **`Assert-PathConfinement` con detección de Reparse Points y resolución física (`R7-R06`):**
   - Además de validar el prefijo léxico con `GetFullPath`, inspeccionar el archivo destino (si existe) y todos sus directorios ancestros existentes hasta `$scriptDir`.
   - Si cualquier elemento existente posee `($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0` o `$null -ne $item.LinkTarget`, abortar inmediatamente con `Security/Isolation Violation: Reparse point or symbolic link detected`.
   - Comprobar que la ruta física resuelta del ancestro existente más profundo permanezca estrictamente bajo `$scriptDir`.
2. **`Get-HostGitState` y contadores CIM fail-closed (`R7-R04`):**
   - Comprobar `$LASTEXITCODE -eq 0` después de `git status --porcelain=v1`. Si `$LASTEXITCODE -ne 0` (o si fallan `git rev-parse HEAD` / `--abbrev-ref HEAD`), fallar de forma cerrada (`throw "Host Git Failure..."` o devolver `clean_working_tree = $false` y marcador de error; jamás emitir `clean_working_tree = $true`).
   - Comprobar que `$mem.AvailableMBytes`, `$mem.CommittedBytes`, `$mem.CommitLimit`, `$mem.PagesInputPersec` y `$mem.PagesOutputPersec` sean todos no nulos antes de convertirlos a `[double]`.
   - Comprobar que la consulta `Win32_PerfFormattedData_PerfProc_Process` devuelva procesos válidos y que cada proceso seleccionado tenga `PercentProcessorTime`, `WorkingSetPrivate` y `PageFaultsPersec` no nulos antes de sumar; distinguir grupo vacío (`$selected.Count -eq 0`) de métrica nula.
3. **Identificación de procesos autorizados (`R7-R03`):**
   - Soportar `-AuthorizedPids <int[]>` (vacío por defecto en Baseline) para que solo los PIDs explícitamente autorizados se eximan del presupuesto de interferencia externa; cualquier proceso Node/Chromium ajeno se atribuye a interferencia.

#### Fase 4 — Reparación de `check-preflight.mjs` y `check-preflight.test.mjs` (`R7-R01` a `R7-R06`)
1. **`R7-R01`:** Requerir `options.expectedCommitSha` y `options.auditorDecision` válido + verificación física, hash SHA-256 y contenido JSON de `evidence_doc` local regular (`stat.isFile()`) para acreditar reserva y emitir `EJECUTOR_APTO`. Rechazar URLs HTTP(S) no verificables o `{ auditorApproval: true }` sin decisión auditable.
2. **`R7-R02`:** Validar `additionalProperties: false` en todos los niveles; validar tipos, rangos (`cpu_percent <= 100`, `group.count` entero `>= 0`, `swap_policy` enum válido) y consistencia matemática de `cpu_stats`, `mem_stats`, `page_faults` y metadatos de `telemetry_window` frente a `samples`.
3. **`R7-R03`:** Evaluar el límite `max_external_cpu_percent <= 10.0%` contra la suma de CPU no autorizada (`other + node + chromium` en preflight baseline, salvo autorización explícita verificada) y comprobar que la suma de `cpu_percent_logical_capacity` de los 4 grupos sea coherente con `sample.cpu_percent`.
4. **`R7-R05`:** Evaluar `dirty_files` y `modified_files` siempre (rechazando la contradicción `clean_working_tree: true` con archivos sucios). Endurecer `parseCliArgs` para rechazar cualquier opción con valor faltante (`--expected-sha` sin argumento) o valor numérico inválido (`--max-gap=abc`), saliendo con código `1`.
5. **Pruebas (`check-preflight.test.mjs`):** Conservar las 62 pruebas actuales y añadir regresiones para todos los casos de `REAUDITORIA_CODEX_2026-11-07.md`, incluyendo pruebas reales en PowerShell para `Get-HostGitState` (con `LASTEXITCODE=128`) y `Assert-PathConfinement` (con junction/reparse point en directorio temporal aislado).

---

### 8.3. Prompt Listo para Ejecutar la Corrección (R7-R2)

```markdown
/teamwork [skip-interview] # QAMCP — R7-R2: Cierre integral de los 6 hallazgos de la Reauditoría de Codex (REAUDITORIA_CODEX_2026-11-07.md)

Actúa como líder de implementación con Gemini Teamwork.

**Repositorio:** `Hyouka73/QAMCP`
**Rama exclusiva:** `feat/qap-vnext-architecture`
**Directorio:** `C:\Users\Judirico\Documents\QAMCP\QAMCP`

## Misión
Cerrar de forma definitiva los seis defectos pendientes (`R7-R01` a `R7-R06`) documentados en `docs/vnext/implementaciones/VNEXT-014-E01/r7/REAUDITORIA_CODEX_2026-11-07.md` y en la Sección 8 de `docs/vnext/implementaciones/VNEXT-014-E01/r7/README.md`, manteniendo cerrado `R7-A06` y preservando las 62 pruebas actuales.

NO iniciar una nueva arquitectura, NO ejecutar E01 y NO modificar ningún archivo fuera de `docs/vnext/implementaciones/VNEXT-014-E01/r7/`.

## Lectura Obligatoria
1. `docs/vnext/implementaciones/VNEXT-014-E01/r7/REAUDITORIA_CODEX_2026-11-07.md`
2. `docs/vnext/implementaciones/VNEXT-014-E01/r7/AUDITORIA_CODEX_2026-11-07.md`
3. `docs/vnext/implementaciones/VNEXT-014-E01/r7/README.md` (Sección 8: Plan R7-R2)
4. Todos los archivos en `docs/vnext/implementaciones/VNEXT-014-E01/r7/` (`CONTRATO_EJECUTOR.md`, `manifest-ejemplo.json`, `preflight.ps1`, `check-preflight.mjs`, `check-preflight.test.mjs`).

No modificar ni sobrescribir `AUDITORIA_CODEX_2026-11-07.md` ni `REAUDITORIA_CODEX_2026-11-07.md`. No leer ni tocar `packages/playwright-runner/.qa/cache/sessions/admin-user.json`.

## Secuencia y Distribución de Trabajo

1. **Agente 3 (Reproducción Previa Obligatoria):** Antes de editar `check-preflight.mjs` o `preflight.ps1`, ejecutar los 7 casos del bloque de reproducción de `REAUDITORIA_CODEX_2026-11-07.md`, las invocaciones CLI (`--expected-sha` sin valor, `--max-gap=abc`) y la prueba AST de `Get-HostGitState` con `LASTEXITCODE=128`, registrando la salida literal para documentarla en `README.md`.
2. **Agente 1 (`CONTRATO_EJECUTOR.md` y `manifest-ejemplo.json`):** Actualizar el contrato con las reglas exactas de la Sección 8.2 Fase 1 de `README.md` (`R7-R01`, `R7-R02`, `R7-R03`, `R7-R05`).
3. **Agente 2 (`preflight.ps1`):** Implementar las correcciones de la Sección 8.2 Fase 3 de `README.md` (`R7-R03` atribución por PIDs autorizados, `R7-R04` verificación de `$LASTEXITCODE` en `git status` y prohibición de coerción de `$null` a `0` en contadores CIM/procesos, y `R7-R06` detección de `ReparsePoint`/enlaces simbólicos/junctions y resolución física en `Assert-PathConfinement`).
4. **Agente 3 (`check-preflight.mjs` y `check-preflight.test.mjs`):** Implementar las correcciones de la Sección 8.2 Fase 4 de `README.md` (`R7-R01`, `R7-R02`, `R7-R03`, `R7-R05`) y ampliar la suite `check-preflight.test.mjs` manteniendo las 62 pruebas existentes más las nuevas regresiones (incluyendo pruebas de ejecución PowerShell para `R7-R04` y `R7-R06`).
5. **Coordinador Gemini (`README.md` y Git):** Actualizar `README.md` con la matriz de correspondencia y evidencia cuádruple de `R7-R01` a `R7-R06`, hacer commit exclusivamente de los archivos autorizados en `r7/` (sin incluir `AUDITORIA_CODEX_2026-11-07.md` ni `REAUDITORIA_CODEX_2026-11-07.md`), hacer push a `origin/feat/qap-vnext-architecture` y entregar el reporte final manteniendo `EJECUTOR_NO_APTO`.
```

