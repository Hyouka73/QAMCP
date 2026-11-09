# CONTRATO DE INFRAESTRUCTURA, CAPACIDAD Y PREFLIGHT DEL EJECUTOR (R7)
**Identificador:** `VNEXT-014-E01-R7-CONTRACT`  
**Fase:** VNEXT-014-E01 / R7-R2 (Cierre Integral de Reauditoría Codex 2026-11-07)  
**Fecha:** 2026-11-09  
**Rama autorizada:** `feat/qap-vnext-architecture`  
**Estado:** VIGENTE / CONGELADO / AUDITADO (R7-R2: Cierre Definitivo de Brechas R7-R01 a R7-R06)  
**Destinatarios:** Agente 1 (Arquitecto de Contratos), Agente 2 (Implementador de Preflight), Agente 3 (Validador Automatizado), Coordinador Gemini, Auditor Codex.

---

## 1. Propósito y Alcance Arquitectónico

### 1.1. Contexto Operacional y Lecciones de R5 y R6-A
Durante la ejecución paralela de la suite E01 en la fase R5 (`INFORME_E01_R5_2026-11-06.md`), se registraron 26 timeouts concurrentes (límite de 5000 ms en test y 10000 ms en hooks) asociados a una saturación extrema del host: CPU al 100%, memoria física libre cayendo a 107 MB, paginación masiva de disco de hasta 275,938 páginas/segundo y colas de disco de hasta 173.

Posteriormente, en la fase R6-A (`INFORME_E01_R6_A_2026-11-07.md`), se constató que el entorno de ejecución presentaba un **bloqueo ambiental severo (Dictamen C: causalidad indeterminada)**:
1. Ruptura de continuidad temporal en la telemetría (gaps de horas entre muestras).
2. Ventana de muestreo continuo insuficiente (< 60 segundos).
3. Presencia de 16-17 procesos Node.js y 18-22 procesos Chromium ajenos a la prueba.
4. Memoria comprometida de 32 GB sobre un host físico de 14.87 GB (overcommit virtual de más del 200%) con picos de paginación de 115,997 páginas/segundo.
5. Inexistencia de reserva operacional (`exclusive_reservation: false`).

La auditoría independiente de arquitectura para el MVP de R7 (`AUDITORIA_ARQUITECTURA_RENDIMIENTO_MVP_R7_2026-11-07.md`) dictaminó de forma taxativa:
> **Prohibición absoluta de alterar el código del producto, la configuración de Vitest, el número de workers o los presupuestos de timeout (5000 ms / 10000 ms) para enmascarar problemas de capacidad.**  
> La única intervención autorizada en R7-01 es la construcción de **infraestructura de verificación, preflight y contratos normativos**, permitiendo a Codex determinar de forma objetiva, independiente y reproducible si un ejecutor propuesto posee capacidad real acreditada antes de autorizar cualquier repetición de E01.

### 1.2. Principio de Aislamiento de Archivos
Todas las especificaciones, contratos, manifiestos, scripts y suites de prueba generados en R7 pertenecen exclusivamente al directorio:
`docs/vnext/implementaciones/VNEXT-014-E01/r7/`
Queda estrictamente prohibida la creación o modificación de archivos fuera de este espacio. Ningún script de R7 debe escribir en directorios de producto (`packages/`), evidencias históricas (`r5/`, `r6-a/`) ni en la raíz del repositorio.

---

## 2. Principios Invariantes y Epistemología de la Capacidad

### 2.1. Invariante 1: Falacia de CPU/RAM Ociosa, Prohibición de Autocertificación y Decisión Externa Verificable (Resoluciones R7-A01 y R7-R01)
Una muestra puntual o agregada que indique baja utilización de CPU (e.g. CPU al 0%) o memoria física disponible circunstancial (e.g. 4 GB libres) **NO constituye demostración de reserva de recursos**.
- En un sistema operativo de propósito general (e.g. Windows Desktop), las cargas de fondo (indexadores, telemetría del SO, antivirus, procesos de usuario) son estocásticas y pueden activarse en cualquier instante durante la prueba.
- Un host sin cuotas rígidas ni hipervisor dedicado no puede garantizar la disponibilidad ni exclusividad de sus recursos durante la ejecución de pruebas concurrentes.
- **Prohibición Absoluta de Autocertificación:** El manifiesto de preflight es una sumisión unilateral no autenticada del ejecutor; **ningún manifiesto puede autocertificar su propia reserva o idoneidad**.
- **Insuficiencia Absoluta de Banderas Booleanas y URLs no Verificadas:** Una simple bandera CLI (`--auditor-approval`) o una opción booleana (`options.auditorApproval === true`), así como una URL HTTP(S) no verificada (e.g. `https://no-evidence.invalid/reserva`) **NUNCA bastan para acreditar reserva ni para emitir `EJECUTOR_APTO`**.
- **Rechazo Estricto de Fuentes no Verificables:** Datos autodeclarados, archivos sin autoridad verificable, referencias circulares (e.g. autorreferencias a logs o scripts del propio ejecutor) o URLs remotas no contactadas jamás permiten emitir `EJECUTOR_APTO`. Si el manifiesto reclama `accredited: true` con una URL HTTP(S) no verificada o un documento de evidencia no verificable, el validador DEBE devolver deterministamente `valid: false`, `validador_status: "VALIDADOR_FAIL"` y `executor_status: "EJECUTOR_NO_APTO"`.
- **Inspección Física y Hash Criptográfico del Documento de Evidencia (`evidence_doc`):** Si el manifiesto declara reserva acreditada (`accredited: true`), el campo `evidence_doc` debe referenciar obligatoriamente un archivo local regular (`stat.isFile()`), accesible y legible en disco. Rutas inexistentes, directorios, sockets, enlaces rotos, archivos vacíos (0 bytes) o URLs no comprobables provocan el fallo estructurado inmediato (`VALIDADOR_FAIL`, `EJECUTOR_NO_APTO`).
- **Validación de Carga Útil del Documento de Evidencia:** El archivo local `evidence_doc` debe contener un JSON formalmente válido cuya carga útil declare explícitamente:
  * `executor_id`: string coincidente exactamente con `manifest.executor_id`.
  * `provenance`: string coincidente con `manifest.resource_reservation.provenance`.
  * `type`: string coincidente con `manifest.resource_reservation.type`.
  * `allocated_cores`: integer coincidente con `manifest.resource_reservation.allocated_cores`.
  * `allocated_ram_mb`: integer coincidente con `manifest.resource_reservation.allocated_ram_mb`.
  * `exclusive_reservation`: boolean `true` de manera obligatoria y estricta.
- **Compuerta de Decisión Externa Auditable (`auditorDecision`):** La calificación `EJECUTOR_APTO` está condicionada de forma *sine qua non* a una decisión auditable externa al manifiesto (`options.auditorDecision` o `--auditor-decision <path>`), emitida por la autoridad auditora independiente (Codex), que satisfaga de forma íntegra y simultánea los siguientes 7 requisitos de correspondencia:
  1. `decision === "APPROVED"`.
  2. `auditor_id`: identificador de cadena no vacía del auditor independiente.
  3. `executor_id`: coincidente exactamente con `manifest.executor_id`.
  4. `approved_commit_sha`: hash hexadecimal completo de 40 caracteres coincidente con `manifest.git.commit_sha` Y con la opción obligatoria `options.expectedCommitSha`.
  5. `evidence_doc_sha256`: hash hexadecimal de 64 caracteres coincidente exactamente con el digest SHA-256 computado del archivo local regular `evidence_doc`.
  6. Alcance de recursos: los recursos aprobados deben cubrir los declarados (`decision.allocated_cores >= manifest.resource_reservation.allocated_cores` y `decision.allocated_ram_mb >= manifest.resource_reservation.allocated_ram_mb`).
  7. Vigencia temporal vinculada a la ventana: `decision.issued_at_utc <= manifest.telemetry_window.start_time` y `manifest.telemetry_window.end_time <= decision.expires_at_utc` (la totalidad de la ventana de telemetría debe situarse dentro del intervalo de validez de la decisión).
- **Permanencia en No Apto ante Decisión Ausente o Discrepante:** En ausencia de esta decisión auditable completa y coincidente, aun cuando la telemetría y el esquema sean 100% válidos (`VALIDADOR_PASS`), el estado del ejecutor se mantendrá obligatoriamente en **`EJECUTOR_NO_APTO`** con razón `PREPARADO / RESERVA NO ACREDITADA`.

### 2.2. Invariante 2: Prohibición de Inventar Mínimos de RAM y Armonización Normativa (Resolución R7-A06)
Ningún agente ni evaluador está autorizado a fijar de forma arbitraria un umbral ad-hoc de RAM mínima (e.g. "con 8 GB basta") para declarar un host idóneo.
- **Armonización de Capacidad:** Se establece una distinción normativa rígida entre el piso sintáctico del esquema JSON (`allocated_ram_mb >= 1024` MB), necesario para admitir fixtures y entornos de validación controlados, y la dimensión operacional de la carga E01.
- La idoneidad de capacidad no se deriva de ningún número arbitrario autodeclarado, sino de la asignación física o virtual formalmente delimitada en el documento de provisión auditado y del cumplimiento irrestricto de los presupuestos de interferencia (`min_available_ram_mb >= 2048` MB) en cada muestra temporal.

### 2.3. Invariante 3: Evidencia Operacional Independiente y Decisión Auditable Obligatoria
Para que un entorno aspire a ser calificado como `EJECUTOR_APTO` por el auditor externo, se requiere obligatoriamente:
1. `resource_reservation.accredited === true` respaldado por documento físico verificado.
2. `resource_reservation.provenance`: Identificador del mecanismo formal de aprovisionamiento (`hypervisor_vm_pinned`, `cloud_dedicated_host`, `bare_metal_offline`, `cgroups_v2_systemd`). Quedan terminantemente prohibidos `"synthetic"` y `"none"`.
3. `resource_reservation.type`: Uno de `dedicated_host`, `dedicated_vm`, `exclusive_container`. Prohibidos `unreserved_shared` y `synthetic_fixture`.
4. `resource_reservation.evidence_doc`: Referencia documental a un archivo JSON local regular existente en disco, cuyo digest SHA-256 y carga útil coincidan con la asignación declarada.
5. `auditorDecision`: Decisión externa auditable provista vía opciones o CLI que acredite el commit SHA, hash de evidencia, alcance de recursos y vigencia temporal.

En ausencia de esta verificación independiente externa completa, el estado del ejecutor será indefectiblemente **`EJECUTOR_NO_APTO`**, reportando:
`PREPARADO / RESERVA NO ACREDITADA`

### 2.4. Invariante 4: Whitelist de Integridad Git Inmutable y Rechazo de Whitelist Forjada (Resolución R7-A05)
La integridad del árbol de trabajo de Git se evalúa frente a una whitelist normativa fija, estricta y externa al manifiesto.
- La ÚNICA excepción autorizada en todo el repositorio es:
  `packages/playwright-runner/.qa/cache/sessions/admin-user.json`
- **Prohibición de Bypass:** Cualquier whitelist aportada por el propio ejecutor en el campo `allowed_untracked_or_modified` del manifiesto **NO puede convertir una condición fallida en válida ni ser aceptada como autoridad**.
- Si el árbol de trabajo contiene modificaciones o archivos no rastreados ajenos a la excepción normativa fija, el preflight será rechazado de inmediato (`VALIDADOR_FAIL`, `EJECUTOR_NO_APTO`), aun cuando el manifiesto intente auto-concederse la excepción.
- **Rechazo de Contradicciones Git:** Si el manifiesto reporta `clean_working_tree: true` pero incluye entradas no vacías en `dirty_files` o `modified_files`, el validador debe rechazar deterministamente la contradicción como violación de integridad (`VALIDADOR_FAIL`).

### 2.5. Invariante 5: Prohibición Absoluta de Sustitución Canónica de Observaciones Ausentes (Resolución R7-A04)
Queda terminantemente prohibido el uso de fallbacks sintéticos o la sustitución por valores canónicos ante lecturas fallidas o ausentes en el host.
- Si un comando (`node -v`, `pnpm -v`, `git rev-parse`, `git status`) falla o retorna vacío o código de salida distinto de cero (`LASTEXITCODE != 0`), el script debe registrar el fallo o abortar de forma cerrada (fail-closed); NUNCA debe asumir éxito ni sustituir el valor por la versión canónica esperada (`v24.15.0`, `12.3.4`, o commit SHA de referencia).
- Si `git status` falla (e.g. `LASTEXITCODE = 128`), NUNCA debe interpretarse como árbol limpio (`clean_working_tree = false` obligatorio).
- Si un artefacto compilado (`dist/*.js`) o un archivo de navegador (`browsers.json`) no existe en el disco, se debe registrar la ausencia o `null`; NUNCA se debe escribir el hash canónico ni una versión supuesta.
- Si un contador de rendimiento (CPU, disco, memoria, fallos de página) es nulo o no puede leerse, NUNCA debe convertirse silenciosamente a `0.0`. Debe reportarse el fallo del contador. Distinguir rigurosamente un grupo sin procesos (`count = 0` con consulta exitosa) de una consulta o contador ausente/nulo.
- Todo manifiesto que contenga observaciones ausentes, nulas o indeterminadas para campos obligatorios será rechazado deterministamente por el validador (`VALIDADOR_FAIL`).

### 2.6. Invariante 6: Atribución Exhaustiva de CPU Externa y Coherencia de Carga en Baseline vs Ejecución (Resolución R7-R03)
La clasificación de procesos de CPU en el host se rige por un principio de atribución riguroso y determinista según la fase operacional:
1. **Fase Baseline (Preflight previo a E01):**
   - En preflight Baseline, la prueba E01 aún no ha sido autorizada ni iniciada. Por definición, **no existe ningún proceso de E01 autorizado** (parámetro `-AuthorizedPids` vacío por defecto).
   - En consecuencia, **toda la carga de CPU en el host generada por procesos `node`, `chromium` y `other` se clasifica e imputa de manera agregada como interferencia externa**.
   - La suma de CPU consumida por `node + chromium + other` en cada muestra y en los agregados está sujeta de forma irrenunciable al presupuesto de interferencia externa:
     $$(s.\text{node\_cpu} + s.\text{chromium\_cpu} + s.\text{other\_cpu}) \le \text{limits}.\text{max\_external_cpu_percent}\ (10.0\%)$$
   - Queda terminantemente prohibido que procesos Node o Chromium ajenos a la prueba queden exentos del límite de interferencia simplemente por compartir el nombre del runtime.
2. **Fase de Ejecución E01:**
   - Únicamente si existen PIDs autorizados registrados explícitamente en `-AuthorizedPids` y confinados bajo `r7/`, los procesos pertenecientes a ese árbol autorizado pueden imputarse a la carga de prueba interna. Todo proceso `node` o `chromium` cuyo PID no figure en `-AuthorizedPids` se clasificará como `other` o interferencia externa.
3. **Coherencia Matemática de Carga por Muestra:**
   - En cada muestra $s \in \text{samples}$, la suma de `cpu_percent_logical_capacity` de los cuatro grupos canónicos (`node`, `chromium`, `observer`, `other`) debe ser exactamente igual a `s.cpu_percent`, admitiendo únicamente una tolerancia de redondeo de punto flotante $\le 0.05\%$:
     $$|s.\text{cpu\_percent} - \sum_{g \in s.\text{groups}} g.\text{cpu\_percent\_logical\_capacity}| \le 0.05$$
   - Cualquier muestra donde la suma de grupos discrepe de `s.cpu_percent` causa el rechazo inmediato del preflight (`VALIDADOR_FAIL`).

---

## 3. Máquina de Estados Tripartita y Regla de No Conversión

### 3.1. Definición Rígida de Estados

El sistema de preflight y sus herramientas de validación operan bajo una máquina de tres estados mutuamente excluyentes y rigurosamente tipificados:

```
+-----------------------------------------------------------------------------------+
|                                  ESTADOS R7                                       |
+-----------------------------------------------------------------------------------+
|  1. VALIDADOR_PASS                                                                |
|     - Naturaleza: Sintética, estructural y algorítmica.                          |
|     - Significado: El manifiesto cumple el esquema JSON, los hashes y firmas son |
|       correctos, y la telemetría es continua. El validador funciona sin fallos.   |
|     - Alcance: NO prejuzga la existencia de reserva física real.                 |
+-----------------------------------------------------------------------------------+
|  2. EJECUTOR_APTO                                                                 |
|     - Naturaleza: Acreditación empírica y operacional de infraestructura.         |
|     - Significado: Cumple VALIDADOR_PASS Y posee reserva física/virtual          |
|       independientemente acreditada, libre de interferencia externa intolerable.  |
|     - Autoridad de Emisión: Exclusivamente Codex tras auditar la evidencia real. |
+-----------------------------------------------------------------------------------+
|  3. EJECUTOR_NO_APTO                                                              |
|     - Naturaleza: Estado por defecto y compuerta de bloqueo.                      |
|     - Significado: Cualquier host que carezca de acreditación documental, sufra   |
|       discontinuidades de muestreo, viole límites de interferencia o presente     |
|       discrepancias en toolchain o git.                                           |
+-----------------------------------------------------------------------------------+
```

### 3.2. Regla de Oro: Invariante de No Conversión Automática y Rechazo de Contradicciones
> **`VALIDADOR_PASS` BAJO NINGUNA CIRCUNSTANCIA SE CONVIERTE AUTOMÁTICAMENTE EN `EJECUTOR_APTO`.**

- En las pruebas sintéticas (`check-preflight.test.mjs`), se utilizan fixtures donde el esquema y la telemetría son 100% conformes. La superación de estas pruebas otorga `VALIDADOR_PASS`, pero el estado del ejecutor evaluado debe mantenerse estrictamente en `EJECUTOR_NO_APTO` (con razón `PREPARADO / RESERVA NO ACREDITADA`).
- Cualquier implementación de validador que asigne `EJECUTOR_APTO` simplemente porque el esquema JSON es válido o porque no se encontraron excepciones en el proceso será rechazada de inmediato como violación de integridad.
- **Rechazo de Fraude y Contradicción Formal:** Si un manifiesto intenta auto-adjudicarse `status: "EJECUTOR_APTO"` sin contar con acreditación independiente debidamente verificada por la compuerta externa, el validador lo considerará una contradicción formal e intento espurio de autocertificación, emitiendo de inmediato `VALIDADOR_FAIL` y forzando `EJECUTOR_NO_APTO`.

### 3.3. Prohibición de Autocertificación por Gemini
El coordinador y los agentes de Gemini Teamwork son constructores de la herramienta de verificación. **Gemini no tiene potestad para autocertificar la idoneidad del ejecutor**. El dictamen técnico de idoneidad corresponde única y exclusivamente a Codex antes de autorizar cualquier ejecución de E01.

---

## 4. Condiciones Verificables de Infraestructura

Para que un manifiesto de preflight sea admitido y evaluado, debe documentar y satisfacer las siguientes condiciones técnicas:

### 4.1. Capacidad Asignada y Procedencia de Reserva
| Parámetro | Tipo | Restricción Contractual | Verificación |
|---|---|---|---|
| `provenance` | `string` | Uno de: `hypervisor_vm_pinned`, `cloud_dedicated_host`, `bare_metal_offline`, `cgroups_v2_systemd`. (Para fixtures sintéticos: `synthetic`; para entornos sin reserva: `none`). | Solo los 4 tipos de infraestructura acreditada habilitan `EJECUTOR_APTO` si son convalidados externamente por `auditorDecision`. |
| `evidence_doc` | `string \| null` | Ruta local relativa o absoluta a un archivo regular JSON (`.json`) legible en disco. `null` si no existe reserva. Prohibidas URLs HTTP(S) no verificadas. | Debe existir físicamente en disco (`stat.isFile()`), ser legible, no estar vacío (> 0 bytes), coincidir en hash SHA-256 con `auditorDecision.evidence_doc_sha256` y declarar en su payload JSON la asignación exclusiva de recursos. Rutas inexistentes, URLs remotas no verificables o discrepancias de carga útil provocan `VALIDADOR_FAIL` y `EJECUTOR_NO_APTO`. |
| `type` | `string` | Uno de: `dedicated_host`, `dedicated_vm`, `exclusive_container`, `unreserved_shared`, `synthetic_fixture`. | `unreserved_shared` y `synthetic_fixture` fuerzan indefectiblemente `EJECUTOR_NO_APTO`. |
| `allocated_cores` | `integer` | Cores lógicos dedicados exclusivamente al ejecutor ($\ge 4$, nominal 8-16). | Entero positivo verificado contra el sistema y contra `evidence_doc`. |
| `allocated_ram_mb` | `integer` | Memoria física garantizada en Megabytes ($\ge 1024$ MB piso técnico de esquema; nominal 14000-16384 para E01). | Entero positivo $\ge 1024$ verificado contra provisión formal sin fijar mínimos arbitrarios de aptitud. |
| `swap_policy` | `string` | Política de archivo de paginación. Debe pertenecer estrictamente al enum: `"disabled"`, `"fixed_managed"`, `"host_managed"`, `"swap_on_zram"`, `"swapfile_permitted"`. | Valor no nulo perteneciente al enum normativo. Prohibido swap dinámico no acotado o valores nulos/vacíos. |
| `accredited` | `boolean` | `true` exclusivamente si existe evidencia documental física local verificada y compuerta de decisión externa auditable (`auditorDecision`); `false` en cualquier otro caso. | Condición necesaria pero no suficiente por sí sola: sin verificación física del archivo y sin decisión auditable coincidente, NUNCA confiere `EJECUTOR_APTO`. Reclamar `accredited: true` sin evidencia local verificable causa `VALIDADOR_FAIL`. |

### 4.2. Sistema Operativo y Plataforma Host
| Parámetro | Tipo | Restricción Contractual | Verificación |
|---|---|---|---|
| `name` | `string` | Identificador del sistema operativo (e.g. `"Windows"`, `"Microsoft Windows 11 Enterprise"`). | Cadena no vacía. |
| `release` | `string` | Versión del release del kernel (e.g. `"10.0.26200"`). | Cadena no vacía. |
| `build` | `string` | Número de compilación del SO (e.g. `"26200"`). | Cadena no vacía. |
| `arch` | `string` | Arquitectura de CPU autorizada: `"x64"` o `"arm64"`. | Debe ser `"x64"` para paridad con la línea base R6-A. |

### 4.3. Toolchain y Runtime (Resolución R7-A06)
El ejecutor debe contar obligatoriamente con las versiones exactas estipuladas en la línea base de desarrollo y preparación:
| Herramienta | Versión Canónica Exigida | Método de Comprobación |
|---|---|---|
| Node.js | `v24.15.0` | `node -v` |
| pnpm | `12.3.4` | `pnpm -v` |
| Playwright Chromium | `151.0.7922.34` (revisión Playwright `1234`) | `packages/playwright-runner/node_modules/playwright-core/browsers.json` |

- **Unificación Normativa y Rechazo de Discrepancias:** Queda abolida cualquier discrepancia entre contrato, esquema y validador. El validador NO debe aceptar rangos genéricos (como `v24.x.x` o `12.x.x`) ni admitir versiones divergentes (e.g. Node `v24.0.1`, pnpm `12.0.1`).
- **Verificación Obligatoria de Chromium por Defecto:** La comprobación de `chromium_version` frente a la línea base `151.0.7922.34` es obligatoria por defecto en el validador, rechazando categóricamente versiones ficticias como `0.0.0.0` o cadenas vacías.
- **Fail-Closed:** Si un binario o archivo de versión no puede ser consultado, se debe registrar `null` o fallar de forma cerrada, prohibiéndose cualquier sustitución canónica (Resolución R7-A04).

### 4.4. Control de Versiones Git e Inmutabilidad del Árbol (Resolución R7-A05)
| Parámetro | Restricción Contractual | Comportamiento ante Violación |
|---|---|---|
| `commit_sha` | Hash hexadecimal completo de exactamente 40 caracteres (e.g. `c161c0f995a8f9844f2ec09c041354d77a08fea0`, correspondiente a la línea base R6-A, o commit auditado). Expresión regular: `^[a-fA-F0-9]{40}$`. | Rechazo inmediato si es truncado (7 hex) o si no coincide con el HEAD auditado / opción `--expected-sha`. En la emisión de `EJECUTOR_APTO`, `options.expectedCommitSha` es OBLIGATORIO. |
| `branch_name` | Debe ser exactamente `"feat/qap-vnext-architecture"`. | Prohibido ejecutar en `main`, `develop` o ramas de prueba efímeras. |
| `clean_working_tree` | Debe ser `true`, con una única excepción explícita. | Si es `false`, se inspeccionan los archivos modificados estrictamente contra la whitelist normativa fija. Si es `true`, `dirty_files` y `modified_files` deben ser arreglos vacíos `[]`; la presencia de archivos sucios en un árbol declarado limpio es una contradicción formal y causa `VALIDADOR_FAIL`. |
| `allowed_untracked_or_modified` | Único archivo admitido como excepción autorizada por el contrato: `packages/playwright-runner/.qa/cache/sessions/admin-user.json` (archivo de sesión de autenticación local que no debe ser leído, modificado ni versionado). | Prohibición absoluta de ampliación por el ejecutor: ninguna ruta añadida por el manifiesto a este campo es aceptada como excepción. Cualquier archivo modificado fuera de la whitelist fija invalida el preflight. |

- **Confinamiento de Inspección Git:** El script `preflight.ps1` no debe filtrar ni ocultar modificaciones en `r7/`. La limpieza del árbol de trabajo abarca la totalidad del repositorio.
- **Opciones CLI Estrictas y Fail-Closed:** La CLI del validador debe rechazar con código de salida 1 cualquier argumento desconocido, cualquier argumento con valor faltante (e.g. `--expected-sha` sin valor subsiguiente) o con valor no numérico inválido (e.g. `--max-gap=abc`, `--min-duration=NaN`).

### 4.5. Hashes Criptográficos de Distribución (`dist_hashes`)
Antes de ejecutar pruebas, se debe comprobar que los artefactos compilados en `dist/` son idénticos a los validados durante la auditoría. Los digests SHA-256 deben coincidir exactamente con los registrados en `docs/vnext/implementaciones/VNEXT-014-E01/r6-a/preparation.json`:
```
packages/mcp/dist/server.js:
3457541827D1F601591BD090CD8A929440B310ED223CFDDCE37BCEF0CA68AAA4

packages/playwright-adapter/dist/index.js:
7992F3711E30DB7938389C8BC6ADA306D628DB881FE1E93E0B9C2B172209A640

packages/knowledge/dist/index.js:
F5F53A04CEDE07E0A078A19EEB2CEE7D13D64FA7093593AFA037B256DAE3DCE2

packages/shared/dist/index.js:
0AC145490635870C3D52AFB9B738608148EEEA35DFD9695E941A6662EDAEBDD7
```
- La comparación es case-insensitive (se normaliza a minúsculas).
- Cualquier discrepancia de hash evidencia una modificación no autorizada de código compilado y descalifica el ejecutor.

### 4.6. Presupuesto Predeclarado de Interferencia Externa y Aplicación Muestra a Muestra (Resoluciones R7-A03 y R7-R03)
Para asegurar que las pruebas E01 no compitan contra procesos parásitos ni se ejecuten bajo saturación del host, se formalizan los siguientes presupuestos normativos inmutables:
1. `max_external_cpu_percent`: $\le 10.0\%$ (la CPU consumida por interferencia externa no debe exceder el 10.0% de la capacidad total).
2. `max_disk_queue`: $\le 2.0$ (la longitud de cola de peticiones pendientes de disco no debe indicar saturación de I/O).
3. `max_pages_input_per_sec`: $\le 500.0$ páginas/segundo (tasa de lectura de disco por fallos de página duros; valores superiores indican contención crítica de memoria física).
4. `min_available_ram_mb`: $\ge 2048\text{ MB}$ (mínimo de memoria física libre o en caché disponible en todo momento durante la ventana previa).

- **Atribución Exhaustiva de CPU Externa en Baseline:**
  - En preflight Baseline, al no existir PIDs autorizados de E01, la interferencia externa abarca la totalidad de los grupos `node`, `chromium` y `other`:
    $$(s.\text{node\_cpu} + s.\text{chromium\_cpu} + s.\text{other\_cpu}) \le \text{effectiveLimits}.\text{max\_external_cpu_percent}\ (10.0\%)$$
  - Toda carga no atribuible al observador de telemetría (`observer`) se considera interferencia externa sujeta a este umbral del 10.0%.
- **Coherencia Matemática de Carga por Muestra:**
  - Para cada muestra $s \in \text{samples}$, la suma de los 4 grupos canónicos debe igualar a `s.cpu_percent` dentro de una tolerancia de $\pm 0.05\%$:
    $$|s.\text{cpu\_percent} - \sum_{g \in s.\text{groups}} g.\text{cpu\_percent\_logical\_capacity}| \le 0.05$$
- **Aplicación Obligatoria contra Muestras y Agregados:** El validador NO debe limitarse a comprobar que los límites sean numéricos. **DEBE contrastar cada muestra individual y las estadísticas agregadas de la ventana contra estos presupuestos**:
  - Para cada muestra $s \in \text{samples}$:
    - $s.\text{disk\_queue} \le \text{limits}.\text{max\_disk\_queue}$
    - $s.\text{pages\_input\_per\_sec} \le \text{limits}.\text{max\_pages\_input\_per_sec}$
    - $s.\text{available\_mb} \ge \text{limits}.\text{min\_available\_ram\_mb}$
    - Interferencia externa: $(s.\text{other\_cpu} + s.\text{unauthorized\_node\_cpu} + s.\text{unauthorized\_chromium\_cpu}) \le \text{limits}.\text{max\_external_cpu_percent}$
  - Para las estadísticas agregadas:
    - $\text{telemetry\_window}.\text{mem\_stats}.\text{min\_available\_mb} \ge \text{limits}.\text{min\_available\_ram\_mb}$
    - $\text{telemetry\_window}.\text{page\_faults}.\text{max\_pages\_input\_per\_sec} \le \text{limits}.\text{max\_pages\_input\_per\_sec}$
- **Rechazo por Saturación:** La violación de cualquiera de estos límites en cualquiera de las muestras o agregados causa el rechazo inmediato del preflight (`VALIDADOR_FAIL`, `EJECUTOR_NO_APTO`). Un manifiesto no puede relajar estos presupuestos.

### 4.7. Ventana de Telemetría Continua y Esquema Estricto de Muestras (Resolución R7-A02 y R7-R02)
La ventana de telemetría previa a cualquier intento de ejecución debe satisfacer estrictamente las siguientes propiedades matemáticas, temporales y estructurales bajo JSON Schema Draft-07 estricto (`additionalProperties: false` en todos los niveles):
1. **Duración mínima continua calculada desde muestras reales:** La duración NO se acepta por mera declaración en `duration_ms`. Debe computarse estrictamente como $\text{lastSample.finished\_at} - \text{firstSample.started\_at} \ge 60000\text{ ms}$. Una telemetría sin muestras o con span observado $< 60000$ ms es inválida.
2. **Prohibición de Muestras Vacías y Conteo Estricto:** Queda terminantemente prohibido `samples: []` o `sample_count: 0`. Se exige un mínimo de $\text{sample\_count} \ge 30$ muestras (nominal 60 para línea base), y debe cumplirse estrictamente que `sample_count` sea un número entero y $\text{sample\_count} === \text{samples.length}$.
3. **Obligatoriedad y Esquema Interno de Agregados:**
   - Los objetos `cpu_stats`, `mem_stats` y `page_faults` son estrictamente obligatorios y no pueden ser objetos vacíos `{}`.
   - `cpu_stats`: debe contener las propiedades numéricas obligatorias `min`, `max`, `mean` en el rango `[0.0, 100.0]`, y opcionalmente `p95` en el rango `[0.0, 100.0]`. Cada uno debe coincidir matemáticamente con los valores correspondientes calculados sobre `samples[].cpu_percent` (con tolerancia $\le 0.05$).
   - `mem_stats`: debe contener obligatoriamente `min_available_mb`, `max_available_mb`, `mean_available_mb`, `committed_bytes_mean`, `commit_limit_bytes` (números $\ge 0$). `min_available_mb`, `max_available_mb` y `mean_available_mb` deben ser matemáticamente coherentes con `samples[].available_mb`.
   - `page_faults`: debe contener obligatoriamente `max_pages_input_per_sec`, `mean_pages_input_per_sec`, `max_pages_output_per_sec` (números $\ge 0$). Coherentes matemáticamente con `samples[].pages_input_per_sec` y `samples[].pages_output_per_sec`.
4. **Obligatoriedad de 10 Campos Métricos por Muestra:** Cada muestra en el arreglo `samples` debe ser un objeto no nulo con `additionalProperties: false` que contenga obligatoriamente los siguientes 10 campos:
   `started_at`, `finished_at`, `cpu_percent`, `available_mb`, `committed_bytes`, `commit_limit_bytes`, `pages_input_per_sec`, `pages_output_per_sec`, `disk_queue`, `groups`.
   - `cpu_percent`: número en rango `[0.0, 100.0]`.
   - `available_mb`, `committed_bytes`, `commit_limit_bytes`, `pages_input_per_sec`, `pages_output_per_sec`, `disk_queue`: números $\ge 0$.
5. **Desagregación en 4 Grupos de Procesos Exclusivos:** Cada muestra debe contener exactamente cuatro grupos de procesos únicos (`node`, `chromium`, `observer`, `other`). Cada grupo debe ser un objeto con `additionalProperties: false` y sus 5 propiedades numéricas obligatorias:
   - `category`: string enum `["node", "chromium", "observer", "other"]`.
   - `count`: entero $\ge 0$ (`Number.isInteger(count) && count >= 0`). Rechazo estricto de números fraccionarios como `0.5`.
   - `cpu_percent_logical_capacity`: número en rango `[0.0, 100.0]`.
   - `working_set_private_bytes`: número $\ge 0$.
   - `page_faults_per_sec`: número $\ge 0$.
6. **Invariantes Temporales Estrictas:**
   - `start_time`: string ISO-8601 UTC válido estrictamente coincidente con `samples[0].started_at`.
   - `end_time`: string ISO-8601 UTC válido estrictamente coincidente con `samples[samples.length - 1].finished_at`.
   - `duration_ms`: número $\ge 60000.0$ coincidente con $\text{Date.parse}(end\_time) - \text{Date.parse}(start\_time)$.
   - `interval_ms`: número en rango `[100.0, 10000.0]`.
   - Para toda muestra $i$: $\text{started\_at} \le \text{finished\_at}$.
   - Continuidad cronológica sin traslape: $\text{started\_at}_i \ge \text{finished\_at}_{i-1}$.
   - Sin marcas en el futuro: $\text{finished\_at}_i \le \text{Date.now()} + 60000\text{ ms}$.
   - Umbral de salto máximo admisible entre muestras: $\text{max\_gap\_ms} \le 5000\text{ ms}$ (en rango `[0.0, 5000.0]`).
   - Umbral de duración de consulta individual CIM: $\text{finished\_at} - \text{started\_at} \le 5000\text{ ms}$.
7. **Manejo Seguro de Entradas:** Si una muestra es nula o malformada, o si cualquier valor temporal es inválido (e.g. `'INVALID'`), el validador debe capturar el error de forma estructurada en `errors` y devolver `valid: false`, sin arrojar excepciones no controladas (`TypeError`).
---

## 5. Esquema Canónico Formal (JSON Schema Draft-07)

El archivo `docs/vnext/implementaciones/VNEXT-014-E01/r7/manifest-ejemplo.json` y cualquier manifiesto emitido por `preflight.ps1` deben ser 100% conformes con el siguiente esquema JSON formal normativo:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://qamcp.vnext/schemas/r7/preflight-manifest.schema.json",
  "title": "QAMCP vNext R7 Preflight Manifest Schema",
  "description": "Especificación canónica del manifiesto de preflight, reserva de infraestructura y telemetría para VNEXT-014-E01",
  "type": "object",
  "required": [
    "schema_version",
    "executor_id",
    "timestamp_utc",
    "status",
    "status_reason",
    "os_info",
    "toolchain",
    "git",
    "dist_hashes",
    "resource_reservation",
    "predeclared_interference_limits",
    "telemetry_window"
  ],
  "additionalProperties": false,
  "properties": {
    "$schema": {
      "type": "string"
    },
    "schema_version": {
      "type": "string",
      "pattern": "^1\\.[0-9]+\\.[0-9]+$"
    },
    "executor_id": {
      "type": "string",
      "pattern": "^[a-zA-Z0-9_-]{3,64}$"
    },
    "timestamp_utc": {
      "type": "string",
      "format": "date-time"
    },
    "status": {
      "type": "string",
      "enum": [
        "VALIDADOR_PASS",
        "EJECUTOR_APTO",
        "EJECUTOR_NO_APTO"
      ]
    },
    "status_reason": {
      "type": "string",
      "minLength": 5,
      "maxLength": 500
    },
    "os_info": {
      "type": "object",
      "required": ["name", "release", "build", "arch"],
      "additionalProperties": false,
      "properties": {
        "name": { "type": "string", "minLength": 1 },
        "release": { "type": "string", "minLength": 1 },
        "build": { "type": "string", "minLength": 1 },
        "arch": { "type": "string", "enum": ["x64", "arm64"] }
      }
    },
    "toolchain": {
      "type": "object",
      "required": ["node_version", "pnpm_version", "chromium_version"],
      "additionalProperties": false,
      "properties": {
        "node_version": { "type": "string", "pattern": "^v24\\.15\\.0$" },
        "pnpm_version": { "type": "string", "pattern": "^12\\.3\\.4$" },
        "chromium_version": { "type": "string", "pattern": "^151\\.0\\.7922\\.34$" }
      }
    },
    "git": {
      "type": "object",
      "required": ["commit_sha", "branch_name", "clean_working_tree"],
      "additionalProperties": false,
      "properties": {
        "commit_sha": { "type": "string", "pattern": "^[a-fA-F0-9]{40}$" },
        "branch_name": { "type": "string", "enum": ["feat/qap-vnext-architecture"] },
        "clean_working_tree": { "type": "boolean" },
        "allowed_untracked_or_modified": {
          "type": "array",
          "items": { "type": "string" }
        },
        "dirty_files": {
          "type": "array",
          "items": { "type": "string" }
        },
        "modified_files": {
          "type": "array",
          "items": { "type": "string" }
        }
      }
    },
    "dist_hashes": {
      "type": "object",
      "required": [
        "packages/mcp/dist/server.js",
        "packages/playwright-adapter/dist/index.js",
        "packages/knowledge/dist/index.js",
        "packages/shared/dist/index.js"
      ],
      "additionalProperties": false,
      "properties": {
        "packages/mcp/dist/server.js": { "type": "string", "pattern": "^[a-fA-F0-9]{64}$" },
        "packages/playwright-adapter/dist/index.js": { "type": "string", "pattern": "^[a-fA-F0-9]{64}$" },
        "packages/knowledge/dist/index.js": { "type": "string", "pattern": "^[a-fA-F0-9]{64}$" },
        "packages/shared/dist/index.js": { "type": "string", "pattern": "^[a-fA-F0-9]{64}$" }
      }
    },
    "resource_reservation": {
      "type": "object",
      "required": [
        "provenance",
        "evidence_doc",
        "type",
        "allocated_cores",
        "allocated_ram_mb",
        "swap_policy",
        "accredited"
      ],
      "additionalProperties": false,
      "properties": {
        "provenance": {
          "type": "string",
          "enum": [
            "hypervisor_vm_pinned",
            "cloud_dedicated_host",
            "bare_metal_offline",
            "cgroups_v2_systemd",
            "synthetic",
            "none"
          ]
        },
        "evidence_doc": {
          "type": ["string", "null"]
        },
        "type": {
          "type": "string",
          "enum": [
            "dedicated_host",
            "dedicated_vm",
            "exclusive_container",
            "unreserved_shared",
            "synthetic_fixture"
          ]
        },
        "allocated_cores": { "type": "integer", "minimum": 1 },
        "allocated_ram_mb": { "type": "integer", "minimum": 1024 },
        "swap_policy": {
          "type": "string",
          "enum": [
            "disabled",
            "fixed_managed",
            "host_managed",
            "swap_on_zram",
            "swapfile_permitted"
          ]
        },
        "accredited": { "type": "boolean" }
      }
    },
    "predeclared_interference_limits": {
      "type": "object",
      "required": [
        "max_external_cpu_percent",
        "max_disk_queue",
        "max_pages_input_per_sec",
        "min_available_ram_mb"
      ],
      "additionalProperties": false,
      "properties": {
        "max_external_cpu_percent": { "type": "number", "minimum": 0.0, "maximum": 10.0 },
        "max_disk_queue": { "type": "number", "minimum": 0.0, "maximum": 2.0 },
        "max_pages_input_per_sec": { "type": "number", "minimum": 0.0, "maximum": 500.0 },
        "min_available_ram_mb": { "type": "integer", "minimum": 2048 }
      }
    },
    "telemetry_window": {
      "type": "object",
      "required": [
        "duration_ms",
        "interval_ms",
        "max_gap_ms",
        "start_time",
        "end_time",
        "sample_count",
        "cpu_stats",
        "mem_stats",
        "page_faults",
        "samples"
      ],
      "additionalProperties": false,
      "properties": {
        "duration_ms": { "type": "number", "minimum": 60000.0 },
        "interval_ms": { "type": "number", "minimum": 100.0, "maximum": 10000.0 },
        "max_gap_ms": { "type": "number", "minimum": 0.0, "maximum": 5000.0 },
        "start_time": { "type": "string", "format": "date-time" },
        "end_time": { "type": "string", "format": "date-time" },
        "sample_count": { "type": "integer", "minimum": 30 },
        "cpu_stats": {
          "type": "object",
          "required": ["min", "max", "mean"],
          "additionalProperties": false,
          "properties": {
            "min": { "type": "number", "minimum": 0.0, "maximum": 100.0 },
            "max": { "type": "number", "minimum": 0.0, "maximum": 100.0 },
            "mean": { "type": "number", "minimum": 0.0, "maximum": 100.0 },
            "p95": { "type": "number", "minimum": 0.0, "maximum": 100.0 }
          }
        },
        "mem_stats": {
          "type": "object",
          "required": [
            "min_available_mb",
            "max_available_mb",
            "mean_available_mb",
            "committed_bytes_mean",
            "commit_limit_bytes"
          ],
          "additionalProperties": false,
          "properties": {
            "min_available_mb": { "type": "number", "minimum": 0.0 },
            "max_available_mb": { "type": "number", "minimum": 0.0 },
            "mean_available_mb": { "type": "number", "minimum": 0.0 },
            "committed_bytes_mean": { "type": "number", "minimum": 0.0 },
            "commit_limit_bytes": { "type": "number", "minimum": 0.0 }
          }
        },
        "page_faults": {
          "type": "object",
          "required": [
            "max_pages_input_per_sec",
            "mean_pages_input_per_sec",
            "max_pages_output_per_sec"
          ],
          "additionalProperties": false,
          "properties": {
            "max_pages_input_per_sec": { "type": "number", "minimum": 0.0 },
            "mean_pages_input_per_sec": { "type": "number", "minimum": 0.0 },
            "max_pages_output_per_sec": { "type": "number", "minimum": 0.0 }
          }
        },
        "samples": {
          "type": "array",
          "minItems": 30,
          "items": {
            "type": "object",
            "required": [
              "started_at",
              "finished_at",
              "cpu_percent",
              "available_mb",
              "committed_bytes",
              "commit_limit_bytes",
              "pages_input_per_sec",
              "pages_output_per_sec",
              "disk_queue",
              "groups"
            ],
            "additionalProperties": false,
            "properties": {
              "started_at": { "type": "string", "format": "date-time" },
              "finished_at": { "type": "string", "format": "date-time" },
              "cpu_percent": { "type": "number", "minimum": 0.0, "maximum": 100.0 },
              "available_mb": { "type": "number", "minimum": 0.0 },
              "committed_bytes": { "type": "number", "minimum": 0.0 },
              "commit_limit_bytes": { "type": "number", "minimum": 0.0 },
              "pages_input_per_sec": { "type": "number", "minimum": 0.0 },
              "pages_output_per_sec": { "type": "number", "minimum": 0.0 },
              "disk_queue": { "type": "number", "minimum": 0.0 },
              "groups": {
                "type": "array",
                "minItems": 4,
                "maxItems": 4,
                "items": {
                  "type": "object",
                  "required": [
                    "category",
                    "count",
                    "cpu_percent_logical_capacity",
                    "working_set_private_bytes",
                    "page_faults_per_sec"
                  ],
                  "additionalProperties": false,
                  "properties": {
                    "category": {
                      "type": "string",
                      "enum": ["node", "chromium", "observer", "other"]
                    },
                    "count": { "type": "integer", "minimum": 0 },
                    "cpu_percent_logical_capacity": { "type": "number", "minimum": 0.0, "maximum": 100.0 },
                    "working_set_private_bytes": { "type": "number", "minimum": 0.0 },
                    "page_faults_per_sec": { "type": "number", "minimum": 0.0 }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

### 5.1. Esquema Canónico del Archivo Documental de Reserva (`evidence_doc`) (Draft-07)
Todo archivo referenciado en `resource_reservation.evidence_doc` cuando `accredited === true` debe ser un archivo regular local legible JSON conforme al siguiente esquema:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://qamcp.vnext/schemas/r7/evidence-doc.schema.json",
  "title": "QAMCP vNext R7 Evidence Document Schema",
  "description": "Esquema normativo para el documento local regular de evidencia física de reserva de capacidad",
  "type": "object",
  "required": [
    "executor_id",
    "provenance",
    "type",
    "allocated_cores",
    "allocated_ram_mb",
    "exclusive_reservation"
  ],
  "additionalProperties": false,
  "properties": {
    "executor_id": {
      "type": "string",
      "pattern": "^[a-zA-Z0-9_-]{3,64}$"
    },
    "provenance": {
      "type": "string",
      "enum": [
        "hypervisor_vm_pinned",
        "cloud_dedicated_host",
        "bare_metal_offline",
        "cgroups_v2_systemd"
      ]
    },
    "type": {
      "type": "string",
      "enum": [
        "dedicated_host",
        "dedicated_vm",
        "exclusive_container"
      ]
    },
    "allocated_cores": {
      "type": "integer",
      "minimum": 1
    },
    "allocated_ram_mb": {
      "type": "integer",
      "minimum": 1024
    },
    "exclusive_reservation": {
      "type": "boolean",
      "enum": [true]
    },
    "provider_metadata": {
      "type": "object"
    }
  }
}
```

### 5.2. Esquema Canónico de la Decisión Externa Auditable (`auditorDecision`) (Draft-07)
Toda decisión auditable provista vía `options.auditorDecision` o archivo CLI `--auditor-decision <path>` para calificar a `EJECUTOR_APTO` debe satisfacer estrictamente el siguiente esquema:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://qamcp.vnext/schemas/r7/auditor-decision.schema.json",
  "title": "QAMCP vNext R7 Auditor Decision Schema",
  "description": "Esquema normativo para la decisión auditable externa emitida por la autoridad independiente (Codex)",
  "type": "object",
  "required": [
    "decision",
    "auditor_id",
    "executor_id",
    "approved_commit_sha",
    "evidence_doc_sha256",
    "allocated_cores",
    "allocated_ram_mb",
    "issued_at_utc",
    "expires_at_utc"
  ],
  "additionalProperties": false,
  "properties": {
    "decision": {
      "type": "string",
      "enum": ["APPROVED"]
    },
    "auditor_id": {
      "type": "string",
      "minLength": 3,
      "maxLength": 128
    },
    "executor_id": {
      "type": "string",
      "pattern": "^[a-zA-Z0-9_-]{3,64}$"
    },
    "approved_commit_sha": {
      "type": "string",
      "pattern": "^[a-fA-F0-9]{40}$"
    },
    "evidence_doc_sha256": {
      "type": "string",
      "pattern": "^[a-fA-F0-9]{64}$"
    },
    "allocated_cores": {
      "type": "integer",
      "minimum": 1
    },
    "allocated_ram_mb": {
      "type": "integer",
      "minimum": 1024
    },
    "issued_at_utc": {
      "type": "string",
      "format": "date-time"
    },
    "expires_at_utc": {
      "type": "string",
      "format": "date-time"
    }
  }
```

---

## 6. Diccionario de Datos y Reglas de Validación de Campos

| Campo | Tipo / Formato | Regla Semántica y Validación de Integridad |
|---|---|---|
| `schema_version` | String SemVer | Versión del esquema del manifiesto. Debe ser `"1.0.0"`. |
| `executor_id` | String | Identificador descriptivo y trazable del host o fixture de evaluación (`^[a-zA-Z0-9_-]{3,64}$`). |
| `timestamp_utc` | String ISO-8601 UTC | Marca de tiempo exacta de generación. Debe ser un timestamp UTC válido (`YYYY-MM-DDTHH:mm:ss.sssZ`). |
| `status` | Enum | Estado evaluado o declarado. Valores posibles: `VALIDADOR_PASS`, `EJECUTOR_APTO`, `EJECUTOR_NO_APTO`. |
| `status_reason` | String | Explicación humana inequívoca del estado. No se permiten cadenas vacías o ambiguas (mínimo 5 caracteres). |
| `os_info.name` / `release` / `build` | String | Cadenas no vacías identificando sistema operativo, release del kernel y número de compilación. |
| `os_info.arch` | Enum | Debe ser `"x64"` o `"arm64"`. Para paridad estricta con R6-A se requiere `"x64"`. |
| `toolchain.node_version` | String | Debe coincidir exactamente con la versión canónica exigida: `"v24.15.0"`. |
| `toolchain.pnpm_version` | String | Debe coincidir exactamente con la versión canónica exigida: `"12.3.4"`. |
| `toolchain.chromium_version` | String | Debe coincidir exactamente con la versión canónica exigida: `"151.0.7922.34"`. |
| `git.commit_sha` | String (40 hex) | Hash hexadecimal de 40 caracteres (`^[a-fA-F0-9]{40}$`). Debe coincidir con el commit autorizado en la rama y con `options.expectedCommitSha` (obligatorio para `EJECUTOR_APTO`). |
| `git.branch_name` | String | Debe ser estrictamente `"feat/qap-vnext-architecture"`. |
| `git.clean_working_tree` | Boolean | `true` si el árbol de trabajo no presenta modificaciones fuera de la whitelist normativa fija (`admin-user.json`). |
| `git.allowed_untracked_or_modified` | Array de Strings | Informativo. El validador ignora rutas aportadas por el manifiesto que no pertenezcan a la excepción normativa fija (`admin-user.json`). |
| `git.dirty_files` / `git.modified_files` | Array de Strings | Rutas detectadas con modificaciones en el host. Si `clean_working_tree === true`, ambos arreglos deben estar vacíos `[]`. Cualquier archivo modificado fuera de `admin-user.json` invalida el preflight. |
| `dist_hashes` | Object (4 hashes) | Mapa con las 4 rutas obligatorias a hashes SHA-256 de 64 caracteres hex (`^[a-fA-F0-9]{64}$`). Cualquier paquete faltante causa rechazo total. |
| `resource_reservation.provenance` | Enum | Mecanismo de aprovisionamiento: `hypervisor_vm_pinned`, `cloud_dedicated_host`, `bare_metal_offline`, `cgroups_v2_systemd` (acreditados), o `synthetic`, `none`. |
| `resource_reservation.type` | Enum | Tipo de infraestructura: `dedicated_host`, `dedicated_vm`, `exclusive_container` (acreditados), o `unreserved_shared`, `synthetic_fixture`. |
| `resource_reservation.allocated_cores` | Integer ($\ge 1$) | Cores lógicos dedicados. Entero positivo verificado contra `evidence_doc`. |
| `resource_reservation.allocated_ram_mb` | Integer ($\ge 1024$) | Memoria RAM física garantizada. Entero positivo verificado contra `evidence_doc`. |
| `resource_reservation.swap_policy` | Enum | Política de archivo de paginación. Debe ser uno de: `"disabled"`, `"fixed_managed"`, `"host_managed"`, `"swap_on_zram"`, `"swapfile_permitted"`. Prohibido swap dinámico no acotado o valores nulos. |
| `resource_reservation.accredited` | Boolean | Bandera central de idoneidad física. Un valor `true` sólo es admisible si existe un archivo regular local verificable en disco y compuerta de decisión externa auditable (`auditorDecision`). Reclamar `accredited: true` sin evidencia local verificable causa `VALIDADOR_FAIL`. |
| `resource_reservation.evidence_doc` | String o Null | Si `accredited` es `true`, debe ser una ruta relativa o absoluta a un archivo regular JSON local legible (`.json`) con atestación genuina. URLs HTTP(S) no verificadas causan `VALIDADOR_FAIL`. |
| `predeclared_interference_limits` | Object (4 límites) | Presupuestos numéricos inmutables de interferencia externa (`max_external_cpu_percent <= 10.0`, `max_disk_queue <= 2.0`, `max_pages_input_per_sec <= 500.0`, `min_available_ram_mb >= 2048`). |
| `telemetry_window.duration_ms` | Number ($\ge 60000.0$) | Duración total observada derivada estrictamente de muestras reales: $\text{lastSample.finished\_at} - \text{firstSample.started\_at}$. |
| `telemetry_window.interval_ms` | Number | Intervalo objetivo entre muestras en milisegundos (`[100.0, 10000.0]`). |
| `telemetry_window.max_gap_ms` | Number | Máximo gap tolerable entre muestras consecutivas (`[0.0, 5000.0]`). |
| `telemetry_window.start_time` / `end_time` | String ISO-8601 UTC | Marcas de tiempo de inicio y fin de la ventana, idénticas a los extremos cronológicos reales de las muestras (`samples[0].started_at` y `samples[-1].finished_at`). |
| `telemetry_window.sample_count` | Integer ($\ge 30$) | Conteo entero de muestras. Debe ser estrictamente igual a `samples.length`. Arreglo vacío es ilegal. |
| `telemetry_window.cpu_stats` | Object (`min`, `max`, `mean` [, `p95`]) | Estadísticas numéricas obligatorias en `[0.0, 100.0]` que deben coincidir matemáticamente con `samples[].cpu_percent`. Prohibido objeto vacío `{}`. |
| `telemetry_window.mem_stats` | Object (5 métricas) | Estadísticas numéricas de memoria obligatorias (`min_available_mb`, `max_available_mb`, `mean_available_mb`, `committed_bytes_mean`, `commit_limit_bytes`). Prohibido objeto vacío `{}`. |
| `telemetry_window.page_faults` | Object (3 métricas) | Estadísticas numéricas de fallos de página obligatorias (`max_pages_input_per_sec`, `mean_pages_input_per_sec`, `max_pages_output_per_sec`). Prohibido objeto vacío `{}`. |
| `samples[i]` | Object (10 campos) | Cada muestra debe contener obligatoriamente y sin valores nulos los 10 campos métricos requeridos, con `cpu_percent` en `[0.0, 100.0]` y `additionalProperties: false`. |
| `samples[i].groups[j]` | Object (5 campos) | Cada muestra contiene exactamente los 4 grupos canónicos (`node`, `chromium`, `observer`, `other`). Cada grupo debe tener `count` entero $\ge 0$ (rechazo de fraccionarios) y `cpu_percent_logical_capacity` en `[0.0, 100.0]`. La suma de los 4 grupos debe ser coherente con `sample.cpu_percent` ($\pm 0.05\%$). |
| `evidence_doc` (archivo) | JSON Object | Archivo local regular legible JSON cuyo contenido declara `executor_id`, `provenance`, `type`, `allocated_cores`, `allocated_ram_mb`, y `exclusive_reservation: true` coincidente con el manifiesto. |
| `auditorDecision` | JSON Object | Decisión externa auditable provista vía `options.auditorDecision` o `--auditor-decision <path>` con `decision: "APPROVED"`, `auditor_id`, `executor_id`, `approved_commit_sha`, `evidence_doc_sha256`, alcance de recursos y vigencia temporal. |

---

## 7. Protocolo de Evaluación y Criterios Deterministas de Rechazo

### 7.1. Prohibición Absoluta de PASS por Omisión, Esquema Draft-07 Estricto y Consistencia Semántica (Resolución R7-R02)
El validador automatizado (`check-preflight.mjs`) debe evaluar afirmativamente la totalidad de los requisitos bajo cumplimiento estricto de JSON Schema Draft-07:
1. **`additionalProperties: false` en Todos los Niveles:**
   - La presencia de cualquier propiedad no declarada formalmente en el esquema (e.g. `unapproved: true` a nivel superior, o campos no normativos en subobjetos) provoca de inmediato `VALIDADOR_FAIL`.
2. **Rechazo de Agregados Vacíos o Incompletos:**
   - Si `cpu_stats`, `mem_stats` o `page_faults` son evaluados como objetos vacíos `{}` o carecen de cualquiera de sus propiedades numéricas obligatorias, la validación falla deterministamente (`VALIDADOR_FAIL`).
3. **Validación Rigurosa de Tipos Enteros y Rangos:**
   - Porcentajes de CPU (`cpu_percent` y `cpu_percent_logical_capacity`) deben situarse en el intervalo cerrado `[0.0, 100.0]`. Valores superiores a 100 (e.g. `cpu_percent = 999`) provocan `VALIDADOR_FAIL`.
   - Conteos de procesos (`group.count`) deben ser enteros no negativos (`Number.isInteger(count) && count >= 0`). Valores fraccionarios (e.g. `0.5`) o negativos provocan `VALIDADOR_FAIL`.
   - Política de swap (`swap_policy`) debe pertenecer al enum normativo; valores `null` o no contemplados provocan `VALIDADOR_FAIL`.
   - Cadencia de muestreo (`interval_ms`) debe situarse en el rango numérico `[100.0, 10000.0]`. Valores negativos o no numéricos provocan `VALIDADOR_FAIL`.
4. **Consistencia Matemática entre Muestras y Agregados:**
   - `cpu_stats.min` debe coincidir con el mínimo de `samples[].cpu_percent` ($\pm 0.05$).
   - `cpu_stats.max` debe coincidir con el máximo de `samples[].cpu_percent` ($\pm 0.05$).
   - `cpu_stats.mean` debe coincidir con la media aritmética de `samples[].cpu_percent` ($\pm 0.05$).
   - `cpu_stats.p95` (si está presente) debe situarse en el rango `[min, max]` y corresponder al percentil 95 de las muestras ($\pm 0.10$).
   - Análogamente, `mem_stats` y `page_faults` deben coincidir matemáticamente con los extremos y medias calculados a partir de las muestras de memoria física y fallos de página.
5. **Consistencia Temporal Estricta:**
   - `start_time` y `end_time` deben ser cadenas ISO-8601 válidas y coincidir exactamente con `samples[0].started_at` y `samples[-1].finished_at`. Cadenas inválidas (e.g. `'INVALID'`) provocan `VALIDADOR_FAIL`.
   - `duration_ms` declarado debe coincidir con el span observado $\text{Date.parse}(end\_time) - \text{Date.parse}(start\_time)$ ($\ge 60000.0$ ms).
   - `sample_count` debe ser un número entero estrictamente idéntico a `samples.length` ($\ge 30$).

### 7.2. Prohibición de Sustitución Canónica de Observaciones Ausentes (Resolución R7-A04)
Todo manifiesto que contenga valores nulos, indeterminados o no observados en campos obligatorios de telemetría, toolchain, git o dist hashes será rechazado de forma cerrada (`VALIDADOR_FAIL`).
- Queda prohibido rellenar datos faltantes con valores canónicos para fingir conformidad sintética.

### 7.3. Reglas de Decisión Externa Verificable y Rechazo de Reserva Autodeclarada (Resoluciones R7-A01 y R7-R01)
1. **Desacoplamiento Estricto:** La validez sintáctica de la declaración de reserva dentro del manifiesto NO equivale a su acreditación independiente.
2. **Insuficiencia de Banderas y URLs no Verificables:**
   - Una bandera booleana (`--auditor-approval` o `{auditorApproval: true}`) por sí sola **NUNCA confiere `EJECUTOR_APTO`**.
   - Reclamar `accredited: true` con una URL HTTP(S) no verificada (e.g. `https://no-evidence.invalid/reserva`) o sin un archivo documental físico verificable provoca el rechazo inmediato (`VALIDADOR_FAIL`, `EJECUTOR_NO_APTO`).
3. **Comprobación Física y de Carga Útil de `evidence_doc`:**
   - El validador debe comprobar que `evidence_doc` referencia un archivo regular local (`stat.isFile()`), accesible y no vacío (> 0 bytes).
   - El contenido JSON de `evidence_doc` debe validar contra `evidence-doc.schema.json` y declarar `executor_id`, `provenance`, `type`, `allocated_cores`, `allocated_ram_mb` coincidentes con el manifiesto, y `exclusive_reservation: true`.
4. **Compuerta Obligatoria de Decisión Externa Auditable (`auditorDecision`):**
   - Para emitir `EJECUTOR_APTO`, se requiere obligatoriamente suministrar `options.auditorDecision` (objeto o ruta CLI `--auditor-decision <path>`) y `options.expectedCommitSha`.
   - El validador debe verificar:
     * `auditorDecision.decision === "APPROVED"`.
     * `auditorDecision.executor_id === manifest.executor_id`.
     * `auditorDecision.approved_commit_sha === manifest.git.commit_sha` Y `=== options.expectedCommitSha`.
     * `auditorDecision.evidence_doc_sha256` idéntico al digest SHA-256 real computado sobre el archivo local `evidence_doc`.
     * Recursos aprobados cubren la asignación: `decision.allocated_cores >= manifest.resource_reservation.allocated_cores` y `decision.allocated_ram_mb >= manifest.resource_reservation.allocated_ram_mb`.
     * Vigencia temporal: `decision.issued_at_utc <= manifest.telemetry_window.start_time` y `manifest.telemetry_window.end_time <= decision.expires_at_utc`.
5. **Comportamiento ante Decisión Ausente, Caducada o Discrepante:**
   - Si no se suministra `auditorDecision`, o si esta presenta discrepancia de SHA, hash documental, ejecutor, recursos o fecha caducada, el validador emite `VALIDADOR_PASS` (si el manifiesto es internamente conforme con `accredited: false`) pero mantiene indefectiblemente el estado en **`EJECUTOR_NO_APTO`** con razón `PREPARADO / RESERVA NO ACREDITADA`.
6. **Rechazo de Fraude:** Cualquier manifiesto que declare `status: "EJECUTOR_APTO"` sin satisfacer la totalidad de esta compuerta de decisión externa verificable será rechazado de inmediato con `VALIDADOR_FAIL` y `EJECUTOR_NO_APTO`.

### 7.4. Reglas de Atribución de CPU Externa y Coherencia de Grupos (Resoluciones R7-A03 y R7-R03)
1. **Presupuesto Exhaustivo de Interferencia en Baseline:**
   - En preflight Baseline (o en ausencia de PIDs autorizados para la fase), toda carga de CPU generada en el host por procesos `node`, `chromium` y `other` se contabiliza conjuntamente como interferencia externa.
   - En cada muestra $s \in \text{samples}$:
     $$(s.\text{node\_cpu} + s.\text{chromium\_cpu} + s.\text{other\_cpu}) \le \text{effectiveLimits}.\text{max\_external_cpu_percent}\ (10.0\%)$$
   - Cualquier muestra donde la carga ajena (incluyendo procesos Node o Chromium no autorizados) supere el 10.0% provoca el rechazo inmediato (`VALIDADOR_FAIL`, `EJECUTOR_NO_APTO`).
2. **Coherencia Matemática de Suma de Grupos por Muestra:**
   - En cada muestra individual, la suma de los cuatro grupos canónicos debe igualar a `s.cpu_percent` con una tolerancia máxima de redondeo de punto flotante de $\pm 0.05\%$:
     $$|s.\text{cpu\_percent} - \sum_{g \in s.\text{groups}} g.\text{cpu\_percent\_logical\_capacity}| \le 0.05$$
   - Cualquier discrepancia entre la suma de los grupos y el `cpu_percent` reportado invalida el manifiesto (`VALIDADOR_FAIL`).
3. **Aplicación Muestra a Muestra de Límites Normativos:**
   - Para cada muestra $s \in \text{samples}$:
     * $s.\text{disk\_queue} \le \text{predeclared\_interference\_limits}.\text{max\_disk\_queue}$ (máximo 2.0).
     * $s.\text{pages\_input\_per\_sec} \le \text{predeclared\_interference\_limits}.\text{max\_pages\_input\_per\_sec}$ (máximo 500.0).
     * $s.\text{available\_mb} \ge \text{predeclared\_interference\_limits}.\text{min\_available\_ram\_mb}$ (mínimo 2048 MB).
4. **Verificación de Agregados:** Se contrastan `mem_stats.min_available_mb` y `page_faults.max_pages_input_per_sec` contra los mismos presupuestos normativos.

### 7.5. Reglas de Integridad Git y Parser CLI Fail-Closed (Resoluciones R7-A05 y R7-R05)
1. **Whitelist Fija Normativa:** La única excepción admisible en todo el repositorio es `packages/playwright-runner/.qa/cache/sessions/admin-user.json`. Se ignora cualquier lista de excepciones provista por el manifiesto.
2. **Rechazo de Contradicciones Git:**
   - Si `clean_working_tree === true`, los arreglos `dirty_files` y `modified_files` deben ser estrictamente vacíos `[]`. La existencia de archivos sucios en un árbol declarado limpio invalida deterministamente el preflight (`VALIDADOR_FAIL`).
   - Si `clean_working_tree === false`, toda ruta modificada o no rastreada debe pertenecer a la excepción normativa fija. La presencia de código modificado fuera de la excepción causa `VALIDADOR_FAIL`.
3. **Enforzamiento de SHA por CLI y Opciones Obligatorias:**
   - La opción `--expected-sha` es obligatoria para emitir `EJECUTOR_APTO`.
   - Toda invocación de CLI con argumentos que carezcan de valor requerido (e.g. `--expected-sha` sin valor posterior), argumentos con valor vacío, o parámetros numéricos malformados (e.g. `--max-gap=abc`, `--min-duration=NaN`) o banderas desconocidas debe provocar la salida inmediata con código de error 1 (fail-closed estricto).

### 7.6. Reglas de Coherencia de Toolchain (Resolución R7-A06)
1. **Versiones Canónicas Obligatorias:** El validador debe comprobar las versiones exactas de Node.js (`v24.15.0`), pnpm (`12.3.4`) y Chromium (`151.0.7922.34`).
2. **Comprobación por Defecto:** Chromium debe verificarse por defecto sin requerir opciones adicionales. Versiones arbitrarias como `0.0.0.0` o discrepancias como Node `v24.0.1` deben causar el fallo de validación (`VALIDADOR_FAIL`).

### 7.7. Confinamiento Hermético de Rutas y Resolución de Reparse Points (Resoluciones R7-A07 y R7-R06)
Toda ruta manipulada por las herramientas de preflight (manifiestos, archivos centinela, archivos de PID) debe estar estrictamente confinada dentro de `docs/vnext/implementaciones/VNEXT-014-E01/r7/`.
- No basta la normalización léxica de cadenas (`GetFullPath`): el sistema debe inspeccionar el elemento y todos sus directorios ancestros existentes para rechazar cualquier `ReparsePoint` (junction, symlink) que escape del directorio autorizado antes de realizar cualquier lectura, escritura o borrado.

### 7.8. Matriz de Casos de Evaluación y Estados Resultantes

| Escenario de Entrada | Validador (`validador_status`) | Ejecutor (`executor_status`) | Acción Contractual Obligatoria |
|---|---|---|---|
| **Manifiesto Sintético Válido** (`manifest-ejemplo.json` con `accredited: false` y `type: "synthetic_fixture"`) | **`VALIDADOR_PASS`** | **`EJECUTOR_NO_APTO`** | Aprueba validación sintética; mantiene ejecutor en NO APTO por falta de reserva física. Reporta: `PREPARADO / RESERVA NO ACREDITADA`. |
| **Ejecutor Real Acreditado** (Evidencia física local verificada con hash SHA-256, telemetría continua $\ge 60\text{ s}$, toolchain y dist hashes conformes, compuerta `auditorDecision` verificada y coincidente) | **`VALIDADOR_PASS`** | **`EJECUTOR_APTO`** | Certificación positiva habilitada para emisión por Codex. |
| **Autodeclaración sin Verificación / Documento Inexistente** (`accredited: true`, `evidence_doc: "file:///NO-EXISTE/..."`) | **`VALIDADOR_FAIL`** | **`EJECUTOR_NO_APTO`** | Rechazo estructurado por documento inexistente o falta de acreditación independiente. |
| **Aprobación Externa no Verificada / URL Remota** (`accredited: true`, `evidence_doc: "https://no-evidence.invalid/reserva"`, `{auditorApproval: true}` sin `auditorDecision`) | **`VALIDADOR_FAIL`** | **`EJECUTOR_NO_APTO`** | Rechazo por evidencia no verificable e insuficiencia de bandera booleana aislada (Resolución R7-R01). |
| **Decisión Auditable Discrepante o Caducada** (`auditorDecision` con SHA aprobado discrepante, hash de evidencia no coincidente, ejecutor distinto o fecha fuera de ventana) | **`VALIDADOR_PASS`** *(si manifiesto es conforme con accredited: false)* o **`VALIDADOR_FAIL`** *(si reclama APTO)* | **`EJECUTOR_NO_APTO`** | Invalida la acreditación externa y mantiene el estado en NO APTO con `PREPARADO / RESERVA NO ACREDITADA` (Resolución R7-R01). |
| **Agregados Vacíos o Incompletos** (`cpu_stats = {}`, `mem_stats = {}`, o `page_faults = {}`) | **`VALIDADOR_FAIL`** | **`EJECUTOR_NO_APTO`** | Rechazo determinista por omisión de esquema interno de agregados (Resolución R7-R02). |
| **Metadatos y Tipos Temporales Inválidos** (`sample_count: "sesenta"`, `interval_ms: -1`, `start_time: "INVALID"`, `duration_ms: 999999`) | **`VALIDADOR_FAIL`** | **`EJECUTOR_NO_APTO`** | Rechazo por tipos no enteros, marcas temporales no ISO y falta de consistencia de ventana (Resolución R7-R02). |
| **Rangos Fuera de Límite y Conteos No Enteros** (`cpu_percent = 999`, `group.count = 0.5`) | **`VALIDADOR_FAIL`** | **`EJECUTOR_NO_APTO`** | Rechazo determinista por violación de rango `[0, 100]` y conteo no entero (Resolución R7-R02). |
| **Propiedades Adicionales Espurias o Swap Inválido** (`unapproved = true`, `swap_policy = null`) | **`VALIDADOR_FAIL`** | **`EJECUTOR_NO_APTO`** | Rechazo por violación de `additionalProperties: false` y swap no conforme (Resolución R7-R02). |
| **Carga Node Ajena Excluida de Interferencia** (CPU 90% en grupo `node` sin `other` en Baseline) | **`VALIDADOR_FAIL`** | **`EJECUTOR_NO_APTO`** | Rechazo determinista por imputar carga Node ajena a la interferencia externa y rebasar el 10.0% (Resolución R7-R03). |
| **Inconsistencia entre Grupos y CPU Total** (Suma de los 4 grupos discrepa de `sample.cpu_percent` en $> 0.05\%$) | **`VALIDADOR_FAIL`** | **`EJECUTOR_NO_APTO`** | Rechazo por inconsistencia matemática de balance de carga (Resolución R7-R03). |
| **Fallo de Git Status en Preflight** (`LASTEXITCODE = 128` tras `git status`) | **`VALIDADOR_FAIL`** | **`EJECUTOR_NO_APTO`** | Rechazo explícito; prohibido asumir `clean_working_tree = true` ante fallo de comando (Resolución R7-R04). |
| **Contadores CIM Ausentes o Nulos** (`AvailableMBytes`, `CommittedBytes`, `PercentProcessorTime` nulos) | **`VALIDADOR_FAIL`** | **`EJECUTOR_NO_APTO`** | Rechazo de manifiesto por métricas ausentes; prohibido sustituir nulos por `0.0` (Resolución R7-R04). |
| **Contradicción Git Clean / Dirty** (`clean_working_tree: true` con archivos sucios en `dirty_files`) | **`VALIDADOR_FAIL`** | **`EJECUTOR_NO_APTO`** | Rechazo determinista por contradicción formal en integridad Git (Resolución R7-R05). |
| **CLI con Argumentos Faltantes o Malformados** (`--expected-sha` sin valor, `--max-gap=abc`, `--min-duration=NaN`) | **`VALIDADOR_FAIL` (Exit 1)** | **`EJECUTOR_NO_APTO`** | Rechazo en parser CLI fail-closed; aborta ejecución con código de salida 1 (Resolución R7-R05). |
| **Rutas a Reparse Points / Junctions** (Ruta léxica en `r7/` cuyo ancestro físico resuelve fuera) | **`VALIDADOR_FAIL` (Abort)** | **`EJECUTOR_NO_APTO`** | Violación de seguridad por escape de aislamiento mediante enlaces simbólicos o junctions (Resolución R7-R06). |
| **Telemetría Vacía o Muestras sin Métricas** (`samples: []` o muestras sin CPU/RAM/grupos) | **`VALIDADOR_FAIL`** | **`EJECUTOR_NO_APTO`** | Rechazo por omisión de métricas y ventana no representativa. |
| **Host Saturado / Violación de Presupuestos** (CPU 100%, cola disco > 2, paginación masiva o RAM < 2048 MB) | **`VALIDADOR_FAIL`** | **`EJECUTOR_NO_APTO`** | Descalificación por saturación e interferencia externa intolerable. |
| **Sustitución por Valores Canónicos** (Observaciones ausentes o fallos de comando sustituidos por canónicos) | **`VALIDADOR_FAIL`** | **`EJECUTOR_NO_APTO`** | Detección de fallbacks sintéticos. Rechazo por falta de evidencia observada real. |
| **Whitelist Git Forjada** (Árbol sucio en archivos de código con whitelist propia en el manifiesto) | **`VALIDADOR_FAIL`** | **`EJECUTOR_NO_APTO`** | Rechazo inmediato por integridad de código fuente; se desestima la whitelist del ejecutor. |
| **Toolchain Incoherente** (Chromium `0.0.0.0`, Node `v24.0.1`, pnpm `12.0.1`) | **`VALIDADOR_FAIL`** | **`EJECUTOR_NO_APTO`** | Rechazo determinista por discrepancia de versión frente a línea base canónica. |
| **Ruptura de Continuidad** (Muestras con salto > 5000 ms o consulta CIM > 5000 ms) | **`VALIDADOR_FAIL`** | **`EJECUTOR_NO_APTO`** | Descalificación inmediata de la telemetría por discontinuidad temporal. |
| **Ventana Insuficiente** (Duración continua real entre muestras < 60,000 ms) | **`VALIDADOR_FAIL`** | **`EJECUTOR_NO_APTO`** | Descalificación por muestreo temporal incompleto. |
| **Inconsistencia Git** (SHA truncado a 7 hex, SHA no coincidente con opción CLI o rama ajena) | **`VALIDADOR_FAIL`** | **`EJECUTOR_NO_APTO`** | Rechazo por falta de integridad de control de versiones. |
| **Discrepancia de Compilación** (Cualquiera de los 4 hashes de `dist/` no coincide con la línea base) | **`VALIDADOR_FAIL`** | **`EJECUTOR_NO_APTO`** | Rechazo por modificación no autorizada de binarios de producto. |
| **Contradicción Lógica** (Declara `status: "EJECUTOR_APTO"` sin compuerta de auditoría externa) | **`VALIDADOR_FAIL`** | **`EJECUTOR_NO_APTO`** | Detección de fraude o contradicción formal. Rechazo estricto. |

---

## 8. Contratos de Interfaz para los Agentes Implementadores

### 8.1. Contrato para el Agente 2 (`preflight.ps1`)
El implementador del script PowerShell de preflight debe acatar las siguientes condiciones de desarrollo:
1. **Inspección de Solo Lectura y Fail-Closed:** Utilizar exclusivamente consultas CIM (`Get-CimInstance`) a las clases `Win32_ComputerSystem`, `Win32_OperatingSystem`, `Win32_PerfFormattedData_PerfOS_Memory`, `Win32_PerfFormattedData_PerfOS_Processor`, `Win32_PerfFormattedData_PerfDisk_PhysicalDisk` y `Win32_PerfFormattedData_PerfProc_Process`. Comprobar `$LASTEXITCODE` en comandos nativos (`node`, `pnpm`, `git`). Si un comando o consulta falla, registrar `$null` o abortar de forma cerrada; **queda estrictamente prohibido sustituir lecturas fallidas por versiones canónicas, SHA canónicos o valores cero sintéticos** (Resolución R7-A04).
2. **Comprobación de Exit Code en Comandos Git (Resolución R7-R04):** Comprobar `$LASTEXITCODE -eq 0` tras `git rev-parse HEAD`, `git rev-parse --abbrev-ref HEAD` y `git status --porcelain=v1`. Si `git status` falla o produce código distinto de 0, fallar explícitamente y registrar `clean_working_tree = $false`; jamás emitir `clean_working_tree = $true` tras un fallo de comando Git.
3. **Verificación Explícita de Contadores CIM no Nulos (Resolución R7-R04):** Verificar que `AvailableMBytes`, `CommittedBytes`, `CommitLimit`, `PagesInputPersec` y `PagesOutputPersec` no sean `$null` antes de convertirlos a `[double]`. En la consulta de procesos, verificar que los contadores no sean nulos y distinguir con precisión un grupo con 0 procesos (`$selected.Count -eq 0`, donde la suma es legítimamente 0.0) de un fallo en la consulta CIM o métrica nula.
4. **Atribución de Procesos y Clasificación según Fase (Resolución R7-R03):** Soportar el parámetro `-AuthorizedPids <int[]>` (vacío por defecto en Baseline). Clasificar en `node` o `chromium` únicamente aquellos procesos cuyos PIDs figuren explícitamente en `-AuthorizedPids`; cualquier otro proceso `node` o `chrome`/`headless_shell` no autorizado se clasifica e imputa dentro del grupo de interferencia externa (`other`), impidiendo que procesos ajenos eludan el presupuesto del 10.0%.
5. **Confinamiento Hermético con Resolución de Reparse Points (Resoluciones R7-A07 y R7-R06):** En `Assert-PathConfinement`, además de normalizar con `GetFullPath`, inspeccionar el destino y todos sus ancestros existentes hasta `$scriptDir` para detectar atributos de `ReparsePoint` (`Attributes -band [System.IO.FileAttributes]::ReparsePoint`) o `LinkTarget` no nulo, y verificar que la ruta física resuelta (`Resolve-Path`) permanezca estrictamente dentro de `$scriptDir`. Aplicarlo obligatoriamente antes de toda lectura, escritura o borrado de manifiestos, archivos centinela y archivos de PID.
6. **Protección de Privacidad y No Destrucción:** No inspeccionar líneas de comandos privadas, tokens ni rutas de usuario. Queda prohibido terminar procesos (`Stop-Process`), modificar afinidades o alterar configuraciones del sistema operativo.
7. **Garantía Temporal y de Muestreo:** Capturar al menos 60 segundos continuos y al menos 30 muestras (nominal 60), garantizando que cada muestra contenga todos los campos métricos y los 4 grupos sin valores nulos, y asegurando coherencia entre la suma de grupos y `cpu_percent`.
8. **Prohibición de Emitir APTO vía Switches:** Queda prohibido que `preflight.ps1` asigne `EJECUTOR_APTO` mediante parámetros CLI (`-Accredited`, `-EvidenceDoc`). En entorno local debe emitir indefectiblemente `EJECUTOR_NO_APTO` con razón `PREPARADO / RESERVA NO ACREDITADA`.

### 8.2. Contrato para el Agente 3 (`check-preflight.mjs` y `check-preflight.test.mjs`)
El implementador del validador automatizado debe satisfacer:
1. **Runner Nativo de Node.js:** La suite debe ejecutarse exclusivamente con `node --test docs/vnext/implementaciones/VNEXT-014-E01/r7/check-preflight.test.mjs`. No debe requerir Vitest ni alterar dependencias de `package.json`.
2. **API Exportada:** El módulo `check-preflight.mjs` debe exportar las funciones puras `validatePreflightManifest(manifest, options)` y `parseCliArgs(args)`.
3. **Decisión Externa Verificable y Comprobación Documental (Resolución R7-R01):**
   - Comprobar la existencia física del archivo local `evidence_doc` (`stat.isFile()`), verificar su digest SHA-256 y validar su carga útil JSON conforme a `evidence-doc.schema.json`.
   - Exigir `options.expectedCommitSha` y una decisión externa auditable (`options.auditorDecision` o `--auditor-decision <path>`) conforme a `auditor-decision.schema.json` para poder calificar `EJECUTOR_APTO`.
   - Rechazar URLs HTTP(S) no verificables o banderas booleanas aisladas (`{auditorApproval: true}` sin decisión verificable mantiene `EJECUTOR_NO_APTO`, y si el manifiesto reclama `accredited: true` con evidencia no verificable como `https://no-evidence.invalid/reserva`, devolver `valid: false`, `VALIDADOR_FAIL`).
4. **Validación Estricta Draft-07 y Consistencia Semántica (Resolución R7-R02):**
   - Validar `additionalProperties: false` en todos los objetos del manifiesto (raíz, toolchain, git, dist_hashes, reservation, interference, telemetry_window, cpu_stats, mem_stats, page_faults, samples, groups).
   - Validar que `cpu_stats`, `mem_stats` y `page_faults` contengan todas sus propiedades requeridas y verificar su consistencia matemática con las muestras (min, max, mean, p95).
   - Validar que `sample_count` sea entero $\ge 30$ e igual a `samples.length`, `interval_ms` en `[100, 10000]`, `start_time` y `end_time` iguales a los extremos de `samples`, `duration_ms` consistente, `cpu_percent <= 100`, `group.count` entero $\ge 0$ y `swap_policy` string válido del enum.
5. **Atribución de CPU Externa y Coherencia de Balance (Resolución R7-R03):**
   - En preflight Baseline (o sin PIDs autorizados), comprobar que la carga externa total (`other + node + chromium`) no supere el presupuesto `max_external_cpu_percent` (`10.0%`).
   - Comprobar muestra a muestra que la suma de `cpu_percent_logical_capacity` de los 4 grupos canónicos sea igual a `sample.cpu_percent` ($\pm 0.05\%$).
6. **Integridad Git Inmutable y Parser CLI Fail-Closed (Resolución R7-R05):**
   - Validar `dirty_files` y `modified_files` en todo momento, rechazando la contradicción `clean_working_tree: true` con archivos sucios.
   - En `parseCliArgs`, rechazar con código 1 cualquier argumento desconocido, con valor faltante (`--expected-sha` sin argumento) o con formato numérico inválido (`--max-gap=abc`, `--min-duration=NaN`).
7. **Suite de Pruebas Completa (`check-preflight.test.mjs`):**
   - Mantener las 62 pruebas existentes pasando intactas.
   - Añadir pruebas de regresión que cubran exhaustivamente los casos de `REAUDITORIA_CODEX_2026-11-07.md` (`aggregates`, `metadata`, `ranges`, `additional`, `gitContradiction`, `externalNode`, `unverifiedApproval`), los casos CLI inválidos, las pruebas de `auditorDecision` (ausente, caducada, hash discrepante, SHA discrepante) y pruebas de integración para PowerShell (error 128 en git status y confinamiento de enlaces simbólicos/junctions en entorno aislado temporal).

---

## 9. Protocolo de Traspaso a Codex

Una vez completadas y verificadas las implementaciones de los tres agentes y consolidado el informe de integración `README.md` por el Coordinador Gemini, la entrega técnica se pondrá a disposición de Codex bajo el siguiente protocolo:
1. **Rama de Publicación:** `feat/qap-vnext-architecture` (verificando que el árbol se encuentre limpio y en paridad con el remoto).
2. **Estado Reportado:** `PREPARADO / RESERVA NO ACREDITADA`.
3. **Rol de Codex:** Como auditor técnico externo e independiente, Codex inspeccionará el manifiesto de host generado, contrastará los contratos aquí definidos, verificará las pruebas nativas de Node.js y, únicamente si cuenta con un entorno con reserva operacional acreditada y emite una decisión externa auditable formal, calificará la infraestructura antes de autorizar la repetición de la prueba E01.

