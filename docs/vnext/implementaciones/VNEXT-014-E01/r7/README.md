# INFORME DE INTEGRACIÓN Y GUÍA DE OPERACIÓN: SISTEMA DE PREFLIGHT R7 (VNEXT-014-E01)

**Identificador:** `VNEXT-014-E01-R7-README`  
**Fase:** VNEXT-014-E01 / R7-01 (Preflight Infrastructure & Reproducible Contracts)  
**Fecha:** 2026-11-07  
**Rama autorizada:** `feat/qap-vnext-architecture`  
**Coordinador / Integrador:** Gemini Teamwork (`worker_r7_integrator`)  
**Auditor Independiente Destinatario:** Codex  
**Estado General de la Entrega:** `PREPARADO / RESERVA NO ACREDITADA`  

---

## 1. Resumen Ejecutivo

Durante las fases R5 (`INFORME_E01_R5_2026-11-06.md`) y R6-A (`INFORME_E01_R6_A_2026-11-07.md`), la ejecución de la suite de integración E01 experimentó fallos sistemáticos por timeouts concurrentes (26 fallos bajo límites de 5000 ms en pruebas y 10000 ms en hooks). El diagnóstico de R6-A identificó un **bloqueo ambiental severo (Dictamen C: causalidad indeterminada)** caracterizado por:
1. Ruptura de continuidad temporal en la telemetría histórica.
2. Ventana de muestreo continuo inferior al umbral mínimo de 60 segundos.
3. Presencia no controlada de 16-17 procesos Node.js y 18-22 instancias Chromium en segundo plano.
4. Memoria virtual comprometida superior a 32 GB sobre un host físico de 14.87 GB (overcommit > 200%) con picos de paginación de hasta 115,997 páginas/segundo.
5. Inexistencia de reserva operacional de CPU y memoria dedicada (`exclusive_reservation: false`).

En respuesta, la auditoría arquitectónica del MVP (`AUDITORIA_ARQUITECTURA_RENDIMIENTO_MVP_R7_2026-11-07.md`) estableció un principio no negociable:
> **Queda terminantemente prohibido alterar el código del producto, relajar la configuración de Vitest, reducir workers o inflar timeouts para enmascarar limitaciones de capacidad.**  
> La única intervención autorizada en el hito R7-01 es la construcción de una **infraestructura de preflight, contratos normativos y validación automatizada**, entregada a Codex para que determine con rigor técnico si un ejecutor propuesto posee capacidad real acreditada antes de autorizar cualquier repetición de E01.

La presente entrega R7 cumple íntegramente este mandato: proporciona un sistema determinista, desacoplado y reproducible de inspección de host y verificación de contratos, sin haber modificado una sola línea de código de producción ni de configuración de pruebas.

---

## 2. Arquitectura y Componentes Entregados

Todo el código, contratos y pruebas del sistema R7 han sido confinados exclusivamente en el directorio:
`docs/vnext/implementaciones/VNEXT-014-E01/r7/`

```
docs/vnext/implementaciones/VNEXT-014-E01/r7/
├── CONTRATO_EJECUTOR.md       # Especificación normativa formal, JSON Schema Draft-07 y máquina de estados
├── manifest-ejemplo.json      # Fixture canónico sintético conforme (60 muestras continuas, 60.000 ms)
├── preflight.ps1              # Script PowerShell de inspección de host (CIM de solo lectura, modos Baseline/Background)
├── check-preflight.mjs        # Motor de validación determinista e interfaz CLI
├── check-preflight.test.mjs   # Suite de pruebas automatizadas en Node.js nativo (35/35 PASS)
├── preflight-manifest.json    # Manifiesto empírico capturado en el host local de desarrollo
└── README.md                  # El presente informe de integración y guía de operación
```

### 2.1. Catálogo Técnico de Componentes

1. **`CONTRATO_EJECUTOR.md` (Contrato Normativo):**
   - Formaliza los requisitos epistemológicos de capacidad acreditada.
   - Tipifica la máquina de tres estados (`VALIDADOR_PASS`, `EJECUTOR_APTO`, `EJECUTOR_NO_APTO`).
   - Define el esquema canónico bajo estándar JSON Schema Draft-07.
   - Enuncia la **Invariante 1 (Falacia de CPU Ociosa)**: una CPU libre o memoria circunstancial no prueba reserva; sin evidencia de asignación formal, el host es `EJECUTOR_NO_APTO`.
   - Enuncia la **Invariante 2 (Prohibición de Inventar Mínimos de RAM)**: no se admiten umbrales arbitrarios sin justificación de contención y swapping.
   - Enuncia la **Invariante 3 (Acreditación Operacional Independiente Obligatoria)**: exige documentar provisión dedicada (`hypervisor_vm_pinned`, `cloud_dedicated_host`, `bare_metal_offline`, `cgroups_v2_systemd`).
   - Establece los 4 hashes criptográficos SHA-256 canónicos de compilación de paquetes `dist/`.

2. **`manifest-ejemplo.json` (Fixture Canónico Sintético):**
   - Manifiesto modelo con 60 muestras continuas completas (60,000 ms de duración, intervalo nominal de 1000 ms).
   - Categorización exhaustiva de procesos en 4 grupos (`node`, `chromium`, `observer`, `other`).
   - Declara fielmente `accredited: false`, `provenance: "synthetic"`, `type: "synthetic_fixture"`, `status: "VALIDADOR_PASS"`, `status_reason: "PREPARADO / RESERVA NO ACREDITADA"`.
   - Cumple el rol de patrón de referencia (golden standard) para pruebas de regresión del validador.

3. **`preflight.ps1` (Script de Inspección Host para Windows):**
   - **Inspección de Solo Lectura:** Ejecuta consultas CIM (`Get-CimInstance`) sobre `Win32_ComputerSystem`, `Win32_OperatingSystem`, `Win32_PerfFormattedData_PerfOS_Memory`, `Win32_PerfFormattedData_PerfOS_Processor`, `Win32_PerfFormattedData_PerfDisk_PhysicalDisk` y `Win32_PerfFormattedData_PerfProc_Process`.
   - **Seguridad y Privacidad:** No inspecciona líneas de comandos de procesos de usuario, tokens, credenciales ni rutas privadas. No realiza operaciones destructivas ni de terminación de procesos.
   - **Aislamiento Estricto:** Confinado programáticamente al directorio `r7/`. Si el script o su ruta de salida se dirigen fuera de `r7/`, aborta con error de seguridad.
   - **Modo Dual:**
     * `Baseline`: Modo sincrónico que valida una ventana previa de al menos 60 segundos continuos. Mide latencia de consulta (`query_ms`) y saltos entre muestras (`gap_ms <= 5000ms`), diferenciando gaps de muestreo de event-loop lag.
     * `Background`: Modo asincrónico para captura de telemetría durante futuras ejecuciones de pruebas E01 (`Start`, `Status`, `Stop`) mediante jobs de PowerShell o procesos en segundo plano con control por PID y centinela.

4. **`check-preflight.mjs` (Motor de Validación Determinista):**
   - Exporta la función de evaluación pura `validatePreflightManifest(manifest, options)`.
   - Ofrece punto de entrada CLI para validación directa de archivos JSON con salida JSON estructurada y códigos de salida conformes POSIX (0 = éxito, 1 = fallo).
   - Valida 7 dimensiones contractuales: Integridad estructural de esquema JSON, toolchain (Node v24.15.0, pnpm 12.3.4, Chromium), inmutabilidad de Git (SHA de 40 hex, rama `feat/qap-vnext-architecture`, árbol limpio con excepción de `admin-user.json`), dist hashes de compilación (4 paquetes SHA-256), límites de interferencia externa, continuidad temporal de telemetría (duración $\ge 60\text{ s}$, gap $\le 5000\text{ ms}$, consulta $\le 5000\text{ ms}$, consistencia cronológica) y acreditación formal de reserva.
   - **Prohibición de PASS por Omisión:** El validador rechaza objetos vacíos `{}`, valores nulos y omisiones parciales de campos.

5. **`check-preflight.test.mjs` (Suite Automatizada Nativa):**
   - Construida exclusivamente sobre el módulo nativo de Node.js (`node:test` y `node:assert/strict`).
   - Sin dependencias de Vitest ni alteración de `package.json`.
   - Cubre 35 casos de prueba unitarios, sintéticos y de estrés adversarial.

---

## 3. Dictamen de Idoneidad del Ejecutor Actual

### 3.1. Estado Dictaminado

```
+-------------------------------------------------------------------------------+
|                      DICTAMEN TÉCNICO INICIAL DE HOST                         |
|-------------------------------------------------------------------------------|
|  Validador Status: VALIDADOR_PASS                                             |
|  Ejecutor Status:  EJECUTOR_NO_APTO                                           |
|  Justificación:    PREPARADO / RESERVA NO ACREDITADA                          |
+-------------------------------------------------------------------------------+
```

### 3.2. Justificación Técnica

La inspección empírica del host local de desarrollo ejecutada mediante `preflight.ps1` (plasmada en `preflight-manifest.json`) constató:
1. **Toolchain y Git Conformes:** Node.js v24.15.0, pnpm 12.3.4, Chromium 151.0.7922.34, rama `feat/qap-vnext-architecture` y hashes de dist coincidentes con la línea base.
2. **Telemetría Continua Conforme:** Ventana de 76.1 segundos continuos cronometrados con salto máximo de 1028 ms ($\le 5000\text{ ms}$) y consultas de ~16 ms.
3. **Inexistencia de Reserva Operacional Acreditada:** El host es una estación Windows compartida de uso general (`type: "unreserved_shared"`, `accredited: false`, `provenance: "none"`, `evidence_doc: null`).

En virtud de la **Invariante 1** del contrato normativo, bajo ninguna circunstancia se acepta una CPU con baja carga o varios gigabytes libres como demostración de reserva. Un host de escritorio sin aislamiento de hipervisor ni cuotas de cgroups puede sufrir contención impredecible por indexadores, antivirus o procesos de usuario en cualquier momento.

### 3.3. Prohibición de Autocertificación por Gemini

> **Declaración Normativa:**  
> El equipo de Gemini Teamwork actuó exclusivamente como implementador de la infraestructura de verificación. **Gemini no autocertifica ni puede autocertificar la idoneidad del ejecutor**.  
> El dictamen técnico independiente sobre la aptitud del entorno queda formal y expresamente **reservado a Codex** antes de que se autorice cualquier ejecución de la suite E01.

---

## 4. Resultados de Verificación Automatizada

La verificación automatizada se llevó a cabo ejecutando la suite nativa de Node.js desde la raíz del repositorio (`c:\Users\Judirico\Documents\QAMCP\QAMCP`):

### 4.1. Ejecución de la Suite de Pruebas

**Comando:**
```powershell
node --test docs/vnext/implementaciones/VNEXT-014-E01/r7/check-preflight.test.mjs
```

**Resultado Verbatim:**
```
✔ TC-01: Validador aprueba fixture sintetico canonico (manifest-ejemplo.json) (6.8111ms)
✔ TC-02: Invariante de No Conversion: VALIDADOR_PASS jamas promueve a EJECUTOR_APTO (1.2809ms)
✔ TC-03: Aprobacion de ejecutor real con reserva debidamente acreditada (0.9058ms)
✔ TC-04: Rechazo por omision de executor_id (1.0599ms)
✔ TC-05: Rechazo por omision de bloque git (1.3131ms)
✔ TC-06: Rechazo por omision de bloque dist_hashes (1.0872ms)
✔ TC-07: Rechazo por omision de bloque resource_reservation (1.3316ms)
✔ TC-08: Rechazo por omision de bloque telemetry_window (1.4662ms)
✔ TC-09: Rechazo por paquete faltante en dist_hashes (solo 3 de los 4 requeridos) (1.125ms)
✔ TC-23: Rechazo total de objeto vacio {} (Prohibicion de PASS por omision) (0.6057ms)
✔ TC-24: Manejo seguro y rechazo de null, undefined y valores primitivos (0.2136ms)
✔ TC-30: Rechazo por omision de schema_version, status_reason, os_info o predeclared_interference_limits (3.3607ms)
✔ TC-10: Rechazo por SHA truncado (7 hex en vez de 40) (0.9063ms)
✔ TC-11: Rechazo por SHA no coincidente con el esperado en opciones (0.7617ms)
✔ TC-12: Rechazo por rama distinta a la autorizada (feat/qap-vnext-architecture) (0.7053ms)
✔ TC-13: Rechazo por arbol sucio con archivos de codigo no autorizados (0.9044ms)
✔ TC-25: Aceptacion de excepcion autorizada de arbol sucio (admin-user.json) (0.9027ms)
✔ TC-26: Rechazo por discrepancia de dist_hashes frente a linea base (1.1502ms)
✔ TC-27: Normalizacion case-insensitive de dist_hashes (mayusculas vs minusculas) (1.0411ms)
✔ TC-28: Rechazo por dist hash corrupto (longitud != 64 o caracteres no hex) (1.1857ms)
✔ TC-31: Rechazo por version no conforme de Node.js o pnpm (2.3205ms)
✔ TC-32: Rechazo por chromium_version vacia o ausente (0.8348ms)
✔ TC-14: Rechazo de idoneidad ante accredited: false (0.6452ms)
✔ TC-15: Rechazo si accredited: true pero evidence_doc es nulo o vacio (0.7327ms)
✔ TC-16: Rechazo estricto de la Falacia de CPU Ociosa: CPU baja y RAM libre no otorgan aptitud (0.662ms)
✔ TC-33: Rechazo si accredited: true pero provenance es synthetic o unaccredited (0.7073ms)
✔ TC-17: Rechazo por duracion de ventana menor a 60 segundos (6.8601ms)
✔ TC-18: Rechazo por salto (gap) excesivo entre muestras (> 5000ms) (1.2224ms)
✔ TC-19: Rechazo por consulta lenta de muestreo (> 5000ms query duration) (1.2703ms)
✔ TC-20: Rechazo por marcas temporales corruptas (started_at > finished_at) (0.9348ms)
✔ TC-22: Rechazo por discrepancia en conteo de muestras (sample_count vs samples.length) (2.0022ms)
✔ TC-34: Rechazo por inversion cronologica entre muestras consecutivas (1.7741ms)
✔ TC-21: Rechazo por contradiccion fatal: declara EJECUTOR_APTO con accredited: false (1.6364ms)
✔ TC-29: Rechazo por contradiccion fatal: declara EJECUTOR_APTO con procedencia sintetica (1.2292ms)
✔ TC-35: Rechazo por contradiccion fatal: declara EJECUTOR_APTO con telemetria invalida (1.0361ms)
ℹ tests 35
ℹ suites 0
ℹ pass 35
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 243.2552
```
**Estado:** **35/35 PASSED (100% de éxito, código de salida 0).**

### 4.2. Ejecución CLI del Validador sobre Fixture Canónico

**Comando:**
```powershell
node docs/vnext/implementaciones/VNEXT-014-E01/r7/check-preflight.mjs docs/vnext/implementaciones/VNEXT-014-E01/r7/manifest-ejemplo.json
```

**Resultado Verbatim:**
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
**Código de salida:** `0`. Demuestra la separación efectiva entre la validez sintética del manifiesto (`VALIDADOR_PASS`) y la no-aptitud del ejecutor (`EJECUTOR_NO_APTO`).

---

## 5. Guía de Uso y Reproducibilidad

Todas las instrucciones asumen como directorio de trabajo la raíz del repositorio (`QAMCP`).

### 5.1. Ejecución del Preflight en Modo Baseline (Ventana Sincrónica $\ge 60\text{ s}$)

Para realizar una comprobación sincrónica previa que capture al menos 60 segundos continuos del host y verifique toolchain, git y hashes:

```powershell
# Ejecución estándar de 60 segundos (nominal 60 muestras de 1000 ms)
pwsh .\docs\vnext\implementaciones\VNEXT-014-E01\r7\preflight.ps1 -Mode Baseline -MinDurationSeconds 60 -Samples 60 -WindowName "preflight-baseline"
```

El script creará el archivo `docs\vnext\implementaciones\VNEXT-014-E01\r7\preflight-baseline-manifest.json` y desplegará en consola el resumen de las muestras recolectadas, consumo de CPU externa, memoria libre, estado de git y dist hashes.

Si se dispone de un host con asignación formal acreditada en CI/Cloud, se invocará con parámetros de reserva:
```powershell
pwsh .\docs\vnext\implementaciones\VNEXT-014-E01\r7\preflight.ps1 -Mode Baseline `
  -Accredited `
  -Provenance "cloud_dedicated_host" `
  -ReservationType "dedicated_host" `
  -EvidenceDoc "https://ci.infra.internal/receipts/runner-host-42.json"
```

### 5.2. Ejecución del Preflight en Modo Background (Captura Asincrónica Durante Pruebas)

Para medir la contención del host mientras se ejecutan pruebas concurrentes en segundo plano, `preflight.ps1` implementa tres acciones:

1. **Iniciar Captura (`Start`):**
   ```powershell
   pwsh .\docs\vnext\implementaciones\VNEXT-014-E01\r7\preflight.ps1 -Mode Background -Action Start -WindowName "e01-run" -IntervalMs 1000
   ```
   *Genera los archivos centinela y PID correspondientes en `r7/` y continúa en segundo plano.*

2. **Consultar Estado (`Status`):**
   ```powershell
   pwsh .\docs\vnext\implementaciones\VNEXT-014-E01\r7\preflight.ps1 -Mode Background -Action Status
   ```
   *Reporta PID activo, muestras acumuladas, duración transcurrida y ausencia de discontinuidades.*

3. **Detener y Consolidar Manifiesto (`Stop`):**
   ```powershell
   pwsh .\docs\vnext\implementaciones\VNEXT-014-E01\r7\preflight.ps1 -Mode Background -Action Stop -WindowName "e01-run"
   ```
   *Detiene el proceso observador, limpia archivos centinela y emite `docs\vnext\implementaciones\VNEXT-014-E01\r7\e01-run-manifest.json`.*

### 5.3. Validación Automatizada de Manifiestos con `check-preflight.mjs`

Para validar de forma determinista cualquier manifiesto generado:

```powershell
node docs/vnext/implementaciones/VNEXT-014-E01/r7/check-preflight.mjs docs/vnext/implementaciones/VNEXT-014-E01/r7/<nombre-manifiesto>.json
```

**Opciones avanzadas por CLI:**
```powershell
# Validar exigiendo un commit SHA específico:
node docs/vnext/implementaciones/VNEXT-014-E01/r7/check-preflight.mjs <ruta-json> --expected-sha 8dc020e3e2a7d1ab701b94ae2473b0cd49ba69b0

# Formato de salida compacto o silenciar avisos:
node docs/vnext/implementaciones/VNEXT-014-E01/r7/check-preflight.mjs <ruta-json> --quiet
```

### 5.4. Ejecución de la Suite de Pruebas Unitarias del Validador

Para comprobar la integridad del validador ante cambios o auditorías:

```powershell
node --test docs/vnext/implementaciones/VNEXT-014-E01/r7/check-preflight.test.mjs
```

---

## 6. Prompt Formal de Traspaso para Codex

El siguiente bloque Markdown constituye la comunicación formal y operativa para traspasar la evaluación a Codex:

````markdown
### INSTRUCCIÓN DE TRASPASO FORMAL A CODEX — PREFLIGHT R7 (VNEXT-014-E01)

Estimado Auditor Técnico Codex:

El equipo de implementación de Gemini Teamwork ha completado la infraestructura de preflight, contratos normativos y pruebas automatizadas correspondientes al hito VNEXT-014-E01 / R7-01 en la rama `feat/qap-vnext-architecture`.

#### 1. Directivas Obligatorias de Integridad
- **No modificación de producto:** No se ha modificado código de producción en `packages/*`, configuración de Vitest, workers ni presupuestos de timeout.
- **E01 NO resuelto:** No se ha ejecutado ni se considera resuelta la suite E01. La entrega proporciona exclusivamente las compuertas de verificación previa.
- **Sin autocertificación:** Gemini no autocertifica idoneidad. El dictamen técnico independiente sobre la aptitud del ejecutor corresponde exclusivamente a usted.
- **Invariante de Capacidad:** Una baja utilización circunstancial de CPU o RAM libre en el host no constituye prueba de reserva. Sin evidencia documental independiente de asignación dedicada, el ejecutor debe mantenerse en `EJECUTOR_NO_APTO`.

#### 2. Artefactos a Auditar
Por favor, inspeccione los siguientes entregables confinados en `docs/vnext/implementaciones/VNEXT-014-E01/r7/`:
- `CONTRATO_EJECUTOR.md`: Contrato normativo de infraestructura y esquema JSON Draft-07.
- `manifest-ejemplo.json`: Fixture canónico con 60 muestras continuas sin reserva acreditada.
- `preflight.ps1`: Script de inspección CIM de solo lectura para Windows (modos Baseline y Background).
- `check-preflight.mjs`: Validador determinista con prohibición estricta de PASS por omisión.
- `check-preflight.test.mjs`: Suite de validación en runner nativo de Node.js (35 pruebas unitarias).
- `README.md`: Este informe de integración y guía de operación.

#### 3. Comandos de Verificación Independiente
Ejecute desde la raíz del repositorio (`QAMCP`):

1. Verificar que la suite nativa pasa al 100%:
   ```powershell
   node --test docs/vnext/implementaciones/VNEXT-014-E01/r7/check-preflight.test.mjs
   ```

2. Validar el fixture canónico:
   ```powershell
   node docs/vnext/implementaciones/VNEXT-014-E01/r7/check-preflight.mjs docs/vnext/implementaciones/VNEXT-014-E01/r7/manifest-ejemplo.json
   ```
   *Debe retornar: `validador_status: VALIDADOR_PASS`, `executor_status: EJECUTOR_NO_APTO`, razón: `PREPARADO / RESERVA NO ACREDITADA`.*

3. Auditar aislamiento del árbol de trabajo git:
   ```powershell
   git status -s
   ```
   *Confirmar que ningún archivo fuera de `docs/vnext/implementaciones/VNEXT-014-E01/r7/` ha sido añadido, y que `packages/playwright-runner/.qa/cache/sessions/admin-user.json` permanece sin stage.*

#### 4. Criterio de Decisión para Codex
- Si el entorno donde se pretende correr E01 es una estación de desarrollo no reservada: ratificar el dictamen `PREPARADO / RESERVA NO ACREDITADA` y **NO autorizar la ejecución de E01**.
- Si y solo si dispone de un ejecutor con asignación formal dedicada acreditada (núcleos de CPU fijados por hipervisor/cgroups, RAM garantizada sin sobrecompromiso y evidencia documental auditable): emitir el dictamen `EJECUTOR_APTO` tras ejecutar `preflight.ps1` y validar su manifiesto con `check-preflight.mjs`.
````

---

## 7. Declaraciones Normativas de Seguridad y Límites

1. **Estado de E01:**  
   La suite E01 **NO se considera resuelta**. El presente hito R7-01 tuvo como único propósito entregar la infraestructura de preflight para que Codex decida si se puede o no ejecutar E01.
2. **Inalterabilidad del Producto:**  
   Ningún archivo de código de producción (`packages/mcp`, `packages/playwright-adapter`, `packages/knowledge`, `packages/shared`, `packages/playwright-runner`) ha sido creado, modificado o alterado.
3. **Inalterabilidad de Pruebas y Configuración:**  
   No se modificaron archivos de configuración de Vitest, ni presupuestos de timeout (5000 ms / 10000 ms), ni número de workers, ni scripts históricos de R5 o R6-A.
4. **Protección de Sesión Local:**  
   El archivo sensible `packages/playwright-runner/.qa/cache/sessions/admin-user.json` no fue leído, alterado ni incluido en el stage de Git.
5. **Rama y Publicación:**  
   Todos los cambios quedan estrictamente registrados en la rama de trabajo autorizada `feat/qap-vnext-architecture` sin creación de ramas auxiliares, merges ni PRs no autorizados.
