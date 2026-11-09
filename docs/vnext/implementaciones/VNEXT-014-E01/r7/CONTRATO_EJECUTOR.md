# CONTRATO DE INFRAESTRUCTURA, CAPACIDAD Y PREFLIGHT DEL EJECUTOR (R7)
**Identificador:** `VNEXT-014-E01-R7-CONTRACT`  
**Fase:** VNEXT-014-E01 / R7-01 (Revisión Post-Auditoría Codex 2026-11-07)  
**Fecha:** 2026-11-07  
**Rama autorizada:** `feat/qap-vnext-architecture`  
**Estado:** VIGENTE / CONGELADO / AUDITADO (R7-01b: Endurecimiento contra Falsos Positivos)  
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

### 2.1. Invariante 1: Falacia de CPU/RAM Ociosa, Prohibición de Autocertificación y Rechazo de Reserva Autodeclarada (Resolución R7-A01)
Una muestra puntual o agregada que indique baja utilización de CPU (e.g. CPU al 0%) o memoria física disponible circunstancial (e.g. 4 GB libres) **NO constituye demostración de reserva de recursos**.
- En un sistema operativo de propósito general (e.g. Windows Desktop), las cargas de fondo (indexadores, telemetría del SO, antivirus, procesos de usuario) son estocásticas y pueden activarse en cualquier instante durante la prueba.
- Un host sin cuotas rígidas ni hipervisor dedicado no puede garantizar la disponibilidad ni exclusividad de sus recursos durante la ejecución de pruebas concurrentes.
- **Prohibición Absoluta de Autocertificación:** El manifiesto de preflight es una sumisión unilateral no autenticada del ejecutor; **ningún manifiesto puede autocertificar su propia reserva o idoneidad**.
- **Insuficiencia de la Mera Existencia Sintáctica o Documental:** La mera existencia de un archivo documental, un URI formal o un manifiesto sintácticamente válido NO convalida la reserva. Se exige acreditar procedencia independiente y verificable de la asignación de recursos, emitida por una autoridad externa formal con alcance específico de CPU/RAM dedicada sin overcommit y vigencia temporal coincidente con el preflight.
- **Rechazo Estricto de Fuentes no Verificables:** Datos autodeclarados, archivos sin autoridad verificable, referencias circulares (e.g. autorreferencias a logs o scripts del propio ejecutor) o evidencias cuyo origen no pueda comprobarse NUNCA permiten emitir `EJECUTOR_APTO`.
- **Verificación Física y de Contenido de `evidence_doc`:** Si el manifiesto invoca una referencia documental (`evidence_doc`), el validador DEBE verificar su existencia física real en disco y comprobar que su contenido sea genuino y acredite la asignación exclusiva. Rutas inexistentes (e.g. `file:///NO-EXISTE/recibo.json`), archivos vacíos o referencias espurias provocan el fallo estructurado inmediato de la validación (`VALIDADOR_FAIL`) y forzan indefectiblemente `EJECUTOR_NO_APTO`.
- **Compuerta Externa de Emisión:** La calificación `EJECUTOR_APTO` está condicionada de forma sine qua non a una decisión auditable externa al manifiesto, reservada exclusivamente al auditor independiente Codex.

### 2.2. Invariante 2: Prohibición de Inventar Mínimos de RAM y Armonización Normativa (Resolución R7-A06)
Ningún agente ni evaluador está autorizado a fijar de forma arbitraria un umbral ad-hoc de RAM mínima (e.g. "con 8 GB basta") para declarar un host idóneo.
- **Armonización de Capacidad:** Se establece una distinción normativa rígida entre el piso sintáctico del esquema JSON (`allocated_ram_mb >= 1024` MB), necesario para admitir fixtures y entornos de validación controlados, y la dimensión operacional de la carga E01.
- La idoneidad de capacidad no se deriva de ningún número arbitrario autodeclarado, sino de la asignación física o virtual formalmente delimitada en el documento de provisión auditado y del cumplimiento irrestricto de los presupuestos de interferencia (`min_available_ram_mb >= 2048` MB) en cada muestra temporal.

### 2.3. Invariante 3: Evidencia Operacional Independiente Obligatoria
Para que un entorno aspire a ser calificado como `EJECUTOR_APTO` por el auditor externo, el manifiesto debe proporcionar obligatoriamente:
1. `resource_reservation.accredited === true` (avalado por compuerta de auditoría externa).
2. `resource_reservation.provenance`: Identificador del mecanismo formal de aprovisionamiento (`hypervisor_vm_pinned`, `cloud_dedicated_host`, `bare_metal_offline`, `cgroups_v2_systemd`). Quedan terminantemente prohibidos `"synthetic"` y `"none"`.
3. `resource_reservation.evidence_doc`: Referencia documental comprobada, físicamente existente y accesible, que acredite la exclusividad de los núcleos de CPU y de la memoria RAM garantizados.

En ausencia de esta verificación independiente externa, el estado del ejecutor será indefectiblemente **`EJECUTOR_NO_APTO`**, reportando:
`PREPARADO / RESERVA NO ACREDITADA`

### 2.4. Invariante 4: Whitelist de Integridad Git Inmutable y Rechazo de Whitelist Forjada (Resolución R7-A05)
La integridad del árbol de trabajo de Git se evalúa frente a una whitelist normativa fija, estricta y externa al manifiesto.
- La ÚNICA excepción autorizada en todo el repositorio es:
  `packages/playwright-runner/.qa/cache/sessions/admin-user.json`
- **Prohibición de Bypass:** Cualquier whitelist aportada por el propio ejecutor en el campo `allowed_untracked_or_modified` del manifiesto **NO puede convertir una condición fallida en válida ni ser aceptada como autoridad**.
- Si el árbol de trabajo contiene modificaciones o archivos no rastreados ajenos a la excepción normativa fija, el preflight será rechazado de inmediato (`VALIDADOR_FAIL`, `EJECUTOR_NO_APTO`), aun cuando el manifiesto intente auto-concederse la excepción.

### 2.5. Invariante 5: Prohibición Absoluta de Sustitución Canónica de Observaciones Ausentes (Resolución R7-A04)
Queda terminantemente prohibido el uso de fallbacks sintéticos o la sustitución por valores canónicos ante lecturas fallidas o ausentes en el host.
- Si un comando (`node -v`, `pnpm -v`, `git rev-parse`) falla o retorna vacío, el script debe registrar `null` o abortar de forma cerrada (fail-closed); NUNCA debe sustituir el valor por la versión canónica esperada (`v24.15.0`, `12.3.4`, o commit SHA de referencia).
- Si un artefacto compilado (`dist/*.js`) o un archivo de navegador (`browsers.json`) no existe en el disco, se debe registrar la ausencia o `null`; NUNCA se debe escribir el hash canónico ni una versión supuesta.
- Si un contador de rendimiento (CPU, disco, memoria) no puede leerse, NUNCA debe convertirse a `0.0`. Debe reportarse el fallo del contador.
- Todo manifiesto que contenga observaciones ausentes, nulas o indeterminadas para campos obligatorios será rechazado deterministamente por el validador (`VALIDADOR_FAIL`).

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
| `provenance` | `string` | Uno de: `hypervisor_vm_pinned`, `cloud_dedicated_host`, `bare_metal_offline`, `cgroups_v2_systemd`. (Para fixtures sintéticos: `synthetic`; para entornos sin reserva: `none`). | Solo los 4 tipos de infraestructura acreditada habilitan `EJECUTOR_APTO` si son convalidados externamente. |
| `evidence_doc` | `string \| null` | Cadena no vacía apuntando al documento de provisión o contrato de infraestructura formal. `null` si no existe. | Debe existir físicamente en disco si es ruta local/`file://`, ser legible, no estar vacío y contener atestación genuina. Ruta inexistente falla la validación (`VALIDADOR_FAIL`). |
| `type` | `string` | Uno de: `dedicated_host`, `dedicated_vm`, `exclusive_container`, `unreserved_shared`, `synthetic_fixture`. | `unreserved_shared` y `synthetic_fixture` fuerzan indefectiblemente `EJECUTOR_NO_APTO`. |
| `allocated_cores` | `integer` | Cores lógicos dedicados exclusivamente al ejecutor ($\ge 4$, nominal 8-16). | Entero positivo verificado contra el sistema. |
| `allocated_ram_mb` | `integer` | Memoria física garantizada en Megabytes ($\ge 1024$ MB piso técnico de esquema; nominal 14000-16384 para E01). | Entero positivo $\ge 1024$ verificado contra provisión formal sin fijar mínimos arbitrarios de aptitud. |
| `swap_policy` | `string` | Política de archivo de paginación (`disabled`, `fixed_managed`, `host_managed`). | Prohibido swap dinámico no acotado. |
| `accredited` | `boolean` | `true` exclusivamente si existe evidencia documental verificada y compuerta de auditoría externa; `false` en cualquier otro caso. | Condición necesaria pero no suficiente por sí sola: sin verificación externa no confiere `EJECUTOR_APTO`. |

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
| `commit_sha` | Hash hexadecimal completo de exactamente 40 caracteres (e.g. `c161c0f995a8f9844f2ec09c041354d77a08fea0`, correspondiente a la línea base R6-A, o `8dc020e...` auditado). Expresión regular: `^[a-fA-F0-9]{40}$`. | Rechazo inmediato si es truncado (7 hex) o si no coincide con el HEAD auditado / opción `--expected-sha`. |
| `branch_name` | Debe ser exactamente `"feat/qap-vnext-architecture"`. | Prohibido ejecutar en `main`, `develop` o ramas de prueba efímeras. |
| `clean_working_tree` | Debe ser `true`, con una única excepción explícita. | Si es `false`, se inspeccionan los archivos modificados estrictamente contra la whitelist normativa fija. |
| `allowed_untracked_or_modified` | Único archivo admitido como excepción autorizada por el contrato: `packages/playwright-runner/.qa/cache/sessions/admin-user.json` (archivo de sesión de autenticación local que no debe ser leído, modificado ni versionado). | Prohibición absoluta de ampliación por el ejecutor: ninguna ruta añadida por el manifiesto a este campo es aceptada como excepción. Cualquier archivo modificado fuera de la whitelist fija invalida el preflight. |

- **Confinamiento de Inspección Git:** El script `preflight.ps1` no debe filtrar ni ocultar modificaciones en `r7/`. La limpieza del árbol de trabajo abarca la totalidad del repositorio.
- **Opciones CLI Estrictas:** La CLI del validador debe soportar `--expected-sha` y verificarlo estrictamente. Cualquier opción no documentada o desconocida debe provocar la salida con código de error 1.

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

### 4.6. Presupuesto Predeclarado de Interferencia Externa y Aplicación Muestra a Muestra (Resolución R7-A03)
Para asegurar que las pruebas E01 no compitan contra procesos parásitos ni se ejecuten bajo saturación del host, se formalizan los siguientes presupuestos normativos inmutables:
1. `max_external_cpu_percent`: $\le 10.0\%$ (la CPU consumida por procesos ajenos a la prueba no debe exceder el 10.0% de la capacidad total).
2. `max_disk_queue`: $\le 2.0$ (la longitud de cola de peticiones pendientes de disco no debe indicar saturación de I/O).
3. `max_pages_input_per_sec`: $\le 500.0$ páginas/segundo (tasa de lectura de disco por fallos de página duros; valores superiores indican contención crítica de memoria física).
4. `min_available_ram_mb`: $\ge 2048\text{ MB}$ (mínimo de memoria física libre o en caché disponible en todo momento durante la ventana previa).

- **Aplicación Obligatoria contra Muestras y Agregados:** El validador NO debe limitarse a comprobar que los límites sean numéricos. **DEBE contrastar cada muestra individual y las estadísticas agregadas de la ventana contra estos presupuestos**:
  - Para cada muestra $s \in \text{samples}$:
    - $s.\text{disk\_queue} \le \text{limits}.\text{max\_disk\_queue}$
    - $s.\text{pages\_input\_per\_sec} \le \text{limits}.\text{max\_pages\_input\_per\_sec}$
    - $s.\text{available\_mb} \ge \text{limits}.\text{min\_available\_ram\_mb}$
    - CPU Externa: $(s.\text{groups}.\text{find}(g \Rightarrow g.\text{category} === \text{'other'}).\text{cpu\_percent\_logical\_capacity} \le \text{limits}.\text{max\_external_cpu_percent})$
  - Para las estadísticas agregadas:
    - $\text{telemetry\_window}.\text{mem\_stats}.\text{min\_available\_mb} \ge \text{limits}.\text{min\_available\_ram\_mb}$
    - $\text{telemetry\_window}.\text{page\_faults}.\text{max\_pages\_input\_per\_sec} \le \text{limits}.\text{max\_pages\_input\_per\_sec}$
- **Rechazo por Saturación:** La violación de cualquiera de estos límites en cualquiera de las muestras o agregados causa el rechazo inmediato del preflight (`VALIDADOR_FAIL`, `EJECUTOR_NO_APTO`). Un manifiesto no puede relajar estos presupuestos.

### 4.7. Ventana de Telemetría Continua y Esquema Estricto de Muestras (Resolución R7-A02)
La ventana de telemetría previa a cualquier intento de ejecución debe satisfacer estrictamente las siguientes propiedades matemáticas, temporales y estructurales:
1. **Duración mínima continua calculada desde muestras reales:** La duración NO se acepta por mera declaración en `duration_ms`. Debe computarse estrictamente como $\text{lastSample.finished\_at} - \text{firstSample.started\_at} \ge 60000\text{ ms}$. Una telemetría sin muestras o con span observado $< 60000$ ms es inválida.
2. **Prohibición de Muestras Vacías y Mínimo de Muestras:** Queda terminantemente prohibido `samples: []` o `sample_count: 0`. Se exige un mínimo de $\text{sample\_count} \ge 30$ muestras (nominal 60 para línea base), y debe cumplirse estrictamente que $\text{sample\_count} === \text{samples.length}$.
3. **Obligatoriedad de 10 Campos Métricos por Muestra:** Cada muestra en el arreglo `samples` debe ser un objeto no nulo que contenga obligatoriamente los siguientes 10 campos, sin valores nulos ni indefinidos:
   `started_at`, `finished_at`, `cpu_percent`, `available_mb`, `committed_bytes`, `commit_limit_bytes`, `pages_input_per_sec`, `pages_output_per_sec`, `disk_queue`, `groups`.
4. **Desagregación en 4 Grupos de Procesos Exclusivos:** Cada muestra debe contener exactamente cuatro grupos de procesos únicos (`node`, `chromium`, `observer`, `other`), cada uno con sus 5 propiedades numéricas requeridas (`category`, `count`, `cpu_percent_logical_capacity`, `working_set_private_bytes`, `page_faults_per_sec`).
5. **Invariantes Temporales Estrictas:**
   - Para toda muestra $i$: $\text{started\_at} \le \text{finished\_at}$.
   - Continuidad cronológica sin traslape: $\text{started\_at}_i \ge \text{finished\_at}_{i-1}$.
   - Sin marcas en el futuro: $\text{finished\_at}_i \le \text{Date.now()} + 60000\text{ ms}$.
   - Umbral de salto máximo admisible entre muestras: $\text{max\_gap\_ms} \le 5000\text{ ms}$.
   - Umbral de duración de consulta individual CIM: $\text{finished\_at} - \text{started\_at} \le 5000\text{ ms}$.
6. **Manejo Seguro de Entradas:** Si una muestra es nula o malformada, el validador debe capturar el error de forma estructurada en `errors` y devolver `valid: false`, sin arrojar excepciones no controladas (`TypeError`).

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
        "swap_policy": { "type": "string", "minLength": 1 },
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
        "interval_ms": { "type": "number", "minimum": 100.0 },
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
            "mean": { "type": "number", "minimum": 0.0, "maximum": 100.0 }
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
                    "cpu_percent_logical_capacity": { "type": "number", "minimum": 0.0 },
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

---

## 6. Diccionario de Datos y Reglas de Validación de Campos

| Campo | Tipo / Formato | Regla Semántica y Validación de Integridad |
|---|---|---|
| `schema_version` | String SemVer | Versión del esquema del manifiesto. Debe ser `"1.0.0"`. |
| `executor_id` | String | Identificador descriptivo y trazable del host o fixture de evaluación. |
| `timestamp_utc` | String ISO-8601 UTC | Marca de tiempo exacta de generación. Debe ser un timestamp UTC válido (`YYYY-MM-DDTHH:mm:ss.sssZ`). |
| `status` | Enum | Estado evaluado o declarado. Valores posibles: `VALIDADOR_PASS`, `EJECUTOR_APTO`, `EJECUTOR_NO_APTO`. |
| `status_reason` | String | Explicación humana inequívoca del estado. No se permiten cadenas vacías o ambiguas. |
| `os_info.arch` | Enum | Debe ser `"x64"` o `"arm64"`. Para paridad estricta con R6-A se requiere `"x64"`. |
| `toolchain.node_version` | String | Debe coincidir exactamente con la versión canónica exigida: `"v24.15.0"`. |
| `toolchain.pnpm_version` | String | Debe coincidir exactamente con la versión canónica exigida: `"12.3.4"`. |
| `toolchain.chromium_version` | String | Debe coincidir exactamente con la versión canónica exigida: `"151.0.7922.34"`. |
| `git.commit_sha` | String (40 hex) | Hash hexadecimal de 40 caracteres. Debe coincidir con el commit autorizado en la rama o con `--expected-sha`. |
| `git.branch_name` | String | Debe ser estrictamente `"feat/qap-vnext-architecture"`. |
| `git.clean_working_tree` | Boolean | `true` si el árbol de trabajo no presenta modificaciones fuera de la whitelist normativa fija. |
| `git.allowed_untracked_or_modified` | Array de Strings | Informativo. El validador ignora rutas aportadas por el manifiesto que no pertenezcan a la excepción normativa fija (`admin-user.json`). |
| `git.dirty_files` / `git.modified_files` | Array de Strings | Rutas detectadas con modificaciones en el host. Cualquier ruta fuera de `admin-user.json` invalida el preflight. |
| `dist_hashes` | Object (4 hashes) | Mapa con las 4 rutas obligatorias a hashes SHA-256 de 64 caracteres hex. Cualquier paquete faltante causa rechazo total. |
| `resource_reservation.accredited` | Boolean | Bandera central de idoneidad física. Un valor `true` sólo confiere `EJECUTOR_APTO` si existe verificación independiente externa; sin ella permanece en `EJECUTOR_NO_APTO`. |
| `resource_reservation.evidence_doc` | String o Null | Si `accredited` es `true`, `evidence_doc` debe ser una cadena no vacía referenciando un documento físicamente existente y con atestación genuina. Archivo inexistente o no verificable falla la validación. |
| `telemetry_window.duration_ms` | Number | Duración total observada derivada de muestras reales: debe ser $\ge 60000.0$ ms. Declaraciones sin respaldo en muestras son rechazadas. |
| `telemetry_window.max_gap_ms` | Number | Máximo gap tolerable entre muestras consecutivas: $\le 5000.0$ ms. |
| `telemetry_window.sample_count` | Integer | Conteo de muestras: $\ge 30$ (nominal 60). Debe ser estrictamente igual a `samples.length`. Arreglo vacío es ilegal. |
| `samples[i]` | Object (10 campos) | Cada muestra debe contener de forma obligatoria y no nula los 10 campos métricos estipulados. |
| `samples[i].groups` | Array (4 grupos) | Cada muestra debe contener exactamente los cuatro grupos `node`, `chromium`, `observer` y `other` con sus 5 métricas numéricas. |

---

## 7. Protocolo de Evaluación y Criterios Deterministas de Rechazo

### 7.1. Prohibición Absoluta de PASS por Omisión y Manejo Seguro de Entradas (Resolución R7-A02)
El validador automatizado (`check-preflight.mjs`) debe evaluar afirmativamente la totalidad de los requisitos. **Queda terminantemente prohibido el PASS por omisión**:
- Si un campo obligatorio no está presente en el JSON, la validación falla (`VALIDADOR_FAIL`).
- Si un objeto vacío `{}`, un arreglo de muestras vacío `samples: []`, o una entrada `null` es evaluada, el validador debe retornar `valid: false` de forma segura y documentar exhaustivamente los campos faltantes en `errors`, sin arrojar excepciones no controladas (`TypeError`).
- Ninguna condición contractual se asumirá como verdadera por el mero hecho de que no haya fallado una excepción no capturada.

### 7.2. Prohibición de Sustitución Canónica de Observaciones Ausentes (Resolución R7-A04)
Todo manifiesto que contenga valores nulos, indeterminados o no observados en campos obligatorios de telemetría, toolchain, git o dist hashes será rechazado de forma cerrada (`VALIDADOR_FAIL`).
- Queda prohibido rellenar datos faltantes con valores canónicos para fingir conformidad sintética.

### 7.3. Reglas de Verificación y Rechazo de Reserva Autodeclarada (Resolución R7-A01)
1. **Desacoplamiento Estricto:** La validez sintáctica de la declaración de reserva dentro del manifiesto NO equivale a su acreditación independiente.
2. **Comprobación de Existencia Documental:** Si `evidence_doc` apunta a una ruta local o URI `file://`, el validador debe comprobar que el archivo existe físicamente y es accesible. Rutas inexistentes (e.g. `file:///NO-EXISTE/...`) provocan el fallo inmediato de la validación.
3. **Compuerta de Autorización Externa:** El validador NUNCA emitirá `EJECUTOR_APTO` salvo que se suministre una opción de acreditación externa independiente explícita (e.g. `options.auditorApproval === true`). En ausencia de dicha autorización externa, el estado del ejecutor se mantendrá indefectiblemente en `EJECUTOR_NO_APTO` (con razón `PREPARADO / RESERVA NO ACREDITADA`).
4. **Rechazo de Fraude:** Cualquier manifiesto que declare `status: "EJECUTOR_APTO"` sin contar con acreditación independiente externa será rechazado como contradicción lógica y fraude.

### 7.4. Reglas de Aplicación de Límites de Interferencia (Resolución R7-A03)
1. **Aplicación Muestra a Muestra:** El validador debe iterar sobre la totalidad de las muestras en `telemetry_window.samples` y verificar:
   - `sample.disk_queue <= predeclared_interference_limits.max_disk_queue` (máximo 2.0).
   - `sample.pages_input_per_sec <= predeclared_interference_limits.max_pages_input_per_sec` (máximo 500.0).
   - `sample.available_mb >= predeclared_interference_limits.min_available_ram_mb` (mínimo 2048 MB).
   - CPU Externa: `(sample.groups.find(g => g.category === 'other')?.cpu_percent_logical_capacity || 0) <= predeclared_interference_limits.max_external_cpu_percent` (máximo 10.0%).
2. **Verificación de Agregados:** Se contrastan `mem_stats.min_available_mb` y `page_faults.max_pages_input_per_sec` contra los mismos presupuestos.
3. **Rechazo Determinista:** Si una sola muestra o estadística agregada rebasa estos presupuestos, el validador falla (`VALIDADOR_FAIL`, `EJECUTOR_NO_APTO`) con indicación precisa del índice de muestra y métrica vulnerada.

### 7.5. Reglas de Integridad Git y Rechazo de Whitelist Forjada (Resolución R7-A05)
1. **Whitelist Fija Normativa:** La única excepción admisible en todo el repositorio es `packages/playwright-runner/.qa/cache/sessions/admin-user.json`.
2. **Rechazo de Whitelist del Manifiesto:** El validador ignora cualquier lista de excepciones provista por el manifiesto. Si existen archivos modificados o no rastreados fuera de la excepción normativa fija, el preflight falla deterministamente.
3. **Enforzamiento de SHA por CLI:** Si la CLI del validador se invoca con `--expected-sha`, este se compara estrictamente contra `manifest.git.commit_sha`. Toda discrepancia o bandera desconocida provoca la salida con código 1.

### 7.6. Reglas de Coherencia de Toolchain (Resolución R7-A06)
1. **Versiones Canónicas Obligatorias:** El validador debe comprobar las versiones exactas de Node.js (`v24.15.0`), pnpm (`12.3.4`) y Chromium (`151.0.7922.34`).
2. **Comprobación por Defecto:** Chromium debe verificarse por defecto sin requerir opciones adicionales. Versiones arbitrarias como `0.0.0.0` o discrepancias como Node `v24.0.1` deben causar el fallo de validación (`VALIDADOR_FAIL`).

### 7.7. Confinamiento Hermético de Rutas (Resolución R7-A07)
Toda ruta de archivo manipulada por las herramientas de preflight (incluyendo salidas, archivos centinela y archivos de PID) debe estar estrictamente confinada dentro de `docs/vnext/implementaciones/VNEXT-014-E01/r7/`. Se prohíbe el uso de comparaciones de prefijos sin separador de directorio que admitan carpetas hermanas como `r7-externo`.

### 7.8. Matriz de Casos de Evaluación y Estados Resultantes

| Escenario de Entrada | Validador (`validador_status`) | Ejecutor (`executor_status`) | Acción Contractual Obligatoria |
|---|---|---|---|
| **Manifiesto Sintético Válido** (`manifest-ejemplo.json` con `accredited: false` y `type: "synthetic_fixture"`) | **`VALIDADOR_PASS`** | **`EJECUTOR_NO_APTO`** | Aprueba validación sintética; mantiene ejecutor en NO APTO por falta de reserva física. Reporta: `PREPARADO / RESERVA NO ACREDITADA`. |
| **Ejecutor Real Acreditado** (Evidencia física verificada en disco, telemetría continua $\ge 60\text{ s}$, toolchain y dist hashes conformes, compuerta de auditoría externa habilitada) | **`VALIDADOR_PASS`** | **`EJECUTOR_APTO`** | Certificación positiva habilitada para emisión por Codex. |
| **Autodeclaración sin Verificación / Documento Inexistente** (`accredited: true`, `evidence_doc: "file:///NO-EXISTE/..."`) | **`VALIDADOR_FAIL`** | **`EJECUTOR_NO_APTO`** | Rechazo estructurado por documento inexistente o falta de acreditación independiente. |
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
2. **Protección de Privacidad:** No inspeccionar líneas de comandos completas (`Win32_Process.CommandLine`), argumentos, credenciales, tokens ni rutas de usuario privadas.
3. **No Destrucción:** Queda prohibido terminar procesos (`Stop-Process`), modificar afinidades o alterar configuraciones de energía del sistema operativo.
4. **Confinamiento Hermético de Rutas:** El script debe implementar una función rigurosa de aserción de límites (`Assert-PathConfinement`) con separador de directorio (`[System.IO.Path]::DirectorySeparatorChar`), aplicándola obligatoriamente a `$OutputPath`, `$SentinelFile`, `$PidFile` y cualquier ruta manipulada. Cualquier ruta fuera del directorio exacto `r7/` (incluyendo carpetas hermanas como `r7-externo`) debe abortar de inmediato con excepción de seguridad (Resolución R7-A07).
5. **Inspección Git Completa:** El script no debe filtrar ni excluir modificaciones en `r7/` al evaluar `git status`. La única excepción admitida es `admin-user.json` (Resolución R7-A05).
6. **Garantía Temporal y de Muestreo:** El muestreador debe capturar al menos 60 segundos continuos y al menos 30 muestras (nominal 60), garantizando que cada muestra contenga todos los campos métricos y los 4 grupos de procesos sin valores nulos (Resolución R7-A02).
7. **Prohibición de Emitir APTO vía Switches:** Queda prohibido que `preflight.ps1` asigne `EJECUTOR_APTO` mediante parámetros CLI (`-Accredited`, `-EvidenceDoc`). En entorno local debe emitir indefectiblemente `EJECUTOR_NO_APTO` con razón `PREPARADO / RESERVA NO ACREDITADA` (Resolución R7-A01).

### 8.2. Contrato para el Agente 3 (`check-preflight.mjs` y `check-preflight.test.mjs`)
El implementador del validador automatizado debe satisfacer:
1. **Runner Nativo de Node.js:** La suite debe ejecutarse exclusivamente con `node --test docs/vnext/implementaciones/VNEXT-014-E01/r7/check-preflight.test.mjs`. No debe requerir Vitest ni alterar dependencias de `package.json`.
2. **API Exportada:** El módulo `check-preflight.mjs` debe exportar la función pura `validatePreflightManifest(manifest, options)`.
3. **Verificación Documental y Acreditación Independiente:** Comprobar la existencia física del archivo `evidence_doc` si es ruta local/URI; no admitir `EJECUTOR_APTO` sin compuerta externa de auditoría (`options.auditorApproval === true`); rechazar manifiestos que declaren fraudulentamente `EJECUTOR_APTO` (Resolución R7-A01).
4. **Validación Exhaustiva de Telemetría:** Exigir $\ge 30$ muestras; calcular duración únicamente desde muestras reales; validar exhaustivamente los 10 campos métricos y los 4 grupos únicos; manejar de forma segura entradas nulas sin `TypeError`; verificar consistencia temporal (Resolución R7-A02).
5. **Aplicación Muestra a Muestra de Presupuestos de Interferencia:** Comparar cada muestra contra los presupuestos normativos inmutables de CPU externa, cola de disco, paginación y memoria disponible (Resolución R7-A03).
6. **Rechazo de Observaciones Faltantes:** Rechazar cualquier manifiesto donde herramientas, dist hashes o métricas sean nulas o no observadas (Resolución R7-A04).
7. **Whitelist Inmutable y Parser CLI Completo:** Ignorar whitelists provistas en el manifiesto; implementar parser CLI para `--expected-sha`, `--expected-branch`, `--expected-chromium`, etc., y salir con código 1 ante banderas desconocidas o discrepancias (Resolución R7-A05).
8. **Comprobación de Toolchain por Defecto:** Verificar Node `v24.15.0`, pnpm `12.3.4` y Chromium `151.0.7922.34` por defecto, rechazando versiones divergentes o ficticias (Resolución R7-A06).
9. **Suite de Regresiones Obligatoria:** Retener las 35 pruebas originales intactas y añadir pruebas de regresión dedicadas para reproducir y rechazar los 7 falsos positivos identificados por Codex (TC-R7-A01 a TC-R7-A07).

---

## 9. Protocolo de Traspaso a Codex

Una vez completadas y verificadas las implementaciones de los tres agentes y consolidado el informe de integración `README.md` por el Coordinador Gemini, la entrega técnica se pondrá a disposición de Codex bajo el siguiente protocolo:
1. **Rama de Publicación:** `feat/qap-vnext-architecture` (verificando que el árbol se encuentre limpio y en paridad con el remoto).
2. **Estado Reportado:** `PREPARADO / RESERVA NO ACREDITADA`.
3. **Rol de Codex:** Como auditor técnico externo e independiente, Codex inspeccionará el manifiesto de host generado, contrastará los contratos aquí definidos, verificará las pruebas nativas de Node.js y, únicamente si cuenta con un entorno con reserva operacional acreditada, emitirá el dictamen técnico final de idoneidad antes de autorizar la repetición de la prueba E01.
