# CONTRATO DE INFRAESTRUCTURA, CAPACIDAD Y PREFLIGHT DEL EJECUTOR (R7)
**Identificador:** `VNEXT-014-E01-R7-CONTRACT`  
**Fase:** VNEXT-014-E01 / R7-01  
**Fecha:** 2026-11-07  
**Rama autorizada:** `feat/qap-vnext-architecture`  
**Estado:** VIGENTE / CONGELADO  
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

### 2.1. Invariante 1: Falacia de CPU/RAM Ociosa y Rechazo de Autodeclaraciones
Una muestra puntual o agregada que indique baja utilización de CPU (e.g. CPU al 0%) o memoria física disponible circunstancial (e.g. 4 GB libres) **NO constituye demostración de reserva de recursos**.
- En un sistema operativo de propósito general (e.g. Windows Desktop), las cargas de fondo (indexadores, telemetría, antivirus, procesos de usuario) son estocásticas y pueden activarse en cualquier instante.
- Un host sin cuotas rígidas ni hipervisor dedicado no puede garantizar la disponibilidad de sus recursos durante la ejecución de pruebas concurrentes.
- **Regla Contractual:** Toda autodeclaración de idoneidad fundamentada exclusivamente en que el host "se encuentra libre" o "tiene baja carga" será clasificada de inmediato como **NO APTO**. La reserva debe ser demostrada mediante evidencia operacional independiente verificable.

### 2.2. Invariante 2: Prohibición de Inventar Mínimos de RAM
Ningún agente ni evaluador está autorizado a fijar de forma arbitraria un umbral ad-hoc de RAM mínima (e.g. "con 8 GB basta") para declarar un host idóneo. La capacidad exigida debe responder a una asignación física o virtual formalmente delimitada, con política de swap controlada y límites de contención operacional previamente aprobados por la auditoría.

### 2.3. Invariante 3: Evidencia Operacional Independiente Obligatoria
Para que un entorno sea calificado como `EJECUTOR_APTO`, el manifiesto debe proporcionar obligatoriamente:
1. `resource_reservation.accredited === true`.
2. `resource_reservation.provenance`: Identificador del mecanismo formal de aprovisionamiento (`hypervisor_vm_pinned`, `cloud_dedicated_host`, `bare_metal_offline`, `cgroups_v2_systemd`). Quedan prohibidos `"synthetic"` y `"none"`.
3. `resource_reservation.evidence_doc`: Referencia documental no vacía (URI, ruta de atestación criptográfica, recibo de orquestador de CI o identificador de provisión formal) que acredite la exclusividad de los núcleos de CPU y de la memoria RAM asignados.

En ausencia de esta evidencia, el estado del ejecutor será indefectiblemente **`EJECUTOR_NO_APTO`**, reportando:
`PREPARADO / RESERVA NO ACREDITADA`

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

### 3.2. Regla de Oro: Invariante de No Conversión Automática
> **`VALIDADOR_PASS` BAJO NINGUNA CIRCUNSTANCIA SE CONVIERTE AUTOMÁTICAMENTE EN `EJECUTOR_APTO`.**

- En las pruebas sintéticas (`check-preflight.test.mjs`), se utilizan fixtures donde el esquema y la telemetría son 100% conformes. La superación de estas pruebas otorga `VALIDADOR_PASS`, pero el estado del ejecutor evaluado debe mantenerse estrictamente en `EJECUTOR_NO_APTO` (con razón `PREPARADO / RESERVA NO ACREDITADA`).
- Cualquier implementación de validador que asigne `EJECUTOR_APTO` simplemente porque el esquema JSON es válido o porque no se encontraron excepciones en el proceso será rechazada de inmediato como violación de integridad.

### 3.3. Prohibición de Autocertificación por Gemini
El coordinador y los agentes de Gemini Teamwork son constructores de la herramienta de verificación. **Gemini no tiene potestad para autocertificar la idoneidad del ejecutor**. El dictamen técnico de idoneidad corresponde única y exclusivamente a Codex antes de autorizar cualquier ejecución de E01.

---

## 4. Condiciones Verificables de Infraestructura

Para que un manifiesto de preflight sea admitido y evaluado, debe documentar y satisfacer las siguientes condiciones técnicas:

### 4.1. Capacidad Asignada y Procedencia de Reserva
| Parámetro | Tipo | Restricción Contractual | Verificación |
|---|---|---|---|
| `provenance` | `string` | Uno de: `hypervisor_vm_pinned`, `cloud_dedicated_host`, `bare_metal_offline`, `cgroups_v2_systemd`. (Para fixtures sintéticos: `synthetic`; para entornos sin reserva: `none`). | Solo los 4 tipos de infraestructura acreditada habilitan `EJECUTOR_APTO`. |
| `evidence_doc` | `string \| null` | Cadena no vacía apuntando al documento de provisión o contrato de infraestructura. `null` si no existe. | Debe ser no nulo y no vacío para `EJECUTOR_APTO`. |
| `type` | `string` | Uno de: `dedicated_host`, `dedicated_vm`, `exclusive_container`, `unreserved_shared`, `synthetic_fixture`. | `unreserved_shared` y `synthetic_fixture` fuerzan `EJECUTOR_NO_APTO`. |
| `allocated_cores` | `integer` | Cores lógicos dedicados exclusivamente al ejecutor ($\ge 4$, nominal 8-16). | Entero positivo verificado contra el sistema. |
| `allocated_ram_mb` | `integer` | Memoria física garantizada en Megabytes ($\ge 8192$, nominal 14000-16384). | Entero positivo verificado sin overcommit. |
| `swap_policy` | `string` | Política de archivo de paginación (`disabled`, `fixed_managed`, `host_managed`). | Prohibido swap dinámico no acotado. |
| `accredited` | `boolean` | `true` exclusivamente si existe evidencia documental verificada; `false` en cualquier otro caso. | Condición sine qua non para `EJECUTOR_APTO`. |

### 4.2. Sistema Operativo y Plataforma Host
| Parámetro | Tipo | Restricción Contractual | Verificación |
|---|---|---|---|
| `name` | `string` | Identificador del sistema operativo (e.g. `"Windows"`, `"Microsoft Windows 11 Enterprise"`). | Cadena no vacía. |
| `release` | `string` | Versión del release del kernel (e.g. `"10.0.26200"`). | Cadena no vacía. |
| `build` | `string` | Número de compilación del SO (e.g. `"26200"`). | Cadena no vacía. |
| `arch` | `string` | Arquitectura de CPU autorizada: `"x64"` o `"arm64"`. | Debe ser `"x64"` para paridad con la línea base R6-A. |

### 4.3. Toolchain y Runtime
El ejecutor debe contar con las versiones exactas estipuladas en la línea base de desarrollo y preparación:
| Herramienta | Versión Canónica Exigida | Método de Comprobación |
|---|---|---|
| Node.js | `v24.15.0` | `node -v` |
| pnpm | `12.3.4` | `pnpm -v` |
| Playwright Chromium | `151.0.7922.34` (revisión Playwright `1234`) | `packages/playwright-runner/node_modules/playwright-core/browsers.json` |

Cualquier discrepancia de versión mayor o menor descalifica el entorno como no homogéneo.

### 4.4. Control de Versiones Git e Inmutabilidad del Árbol
| Parámetro | Restricción Contractual | Comportamiento ante Violación |
|---|---|---|
| `commit_sha` | Hash hexadecimal completo de exactamente 40 caracteres (e.g. `c161c0f995a8f9844f2ec09c041354d77a08fea0`, correspondiente a la línea base R6-A, o `8dc020e...` auditado). Expresión regular: `^[a-fA-F0-9]{40}$`. | Rechazo inmediato si es truncado (7 hex) o si no coincide con el HEAD auditado. |
| `branch_name` | Debe ser exactamente `"feat/qap-vnext-architecture"`. | Prohibido ejecutar en `main`, `develop` o ramas de prueba efímeras. |
| `clean_working_tree` | Debe ser `true`, con una única excepción explícita. | Si es `false`, se inspecciona la lista de excepciones permitidas. |
| `allowed_untracked_or_modified` | Único archivo admitido como excepción autorizada: `packages/playwright-runner/.qa/cache/sessions/admin-user.json` (archivo de sesión de autenticación local que no debe ser leído, modificado ni versionado). | Si existe cualquier otro archivo modificado o no rastreado (especialmente en `packages/`), el árbol se declara sucio y se invalida el preflight. |

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

### 4.6. Presupuesto Predeclarado de Interferencia Externa
Para asegurar que las pruebas E01 no compitan contra procesos parásitos, se establecen los siguientes umbrales máximos tolerables en el host:
1. `max_external_cpu_percent`: $\le 10.0\%$ (la CPU consumida por procesos ajenos a la prueba no debe exceder el 10% de la capacidad total).
2. `max_disk_queue`: $\le 2.0$ (la cola de peticiones pendientes de disco no debe indicar saturación de I/O).
3. `max_pages_input_per_sec`: $\le 500.0$ páginas/segundo (tasa de lectura de disco por fallos de página duros; valores superiores indican contención de memoria física).
4. `min_available_ram_mb`: $\ge 2048\text{ MB}$ (mínimo de memoria física libre o en caché disponible en todo momento durante la ventana previa).

### 4.7. Ventana de Telemetría Continua
La ventana de telemetría previa a cualquier intento de ejecución debe satisfacer estrictamente las siguientes propiedades matemáticas y temporales:
1. **Duración mínima continua:** $\text{duration\_ms} \ge 60000\text{ ms}$ (al menos 60.0 segundos cronometrados de forma ininterrumpida).
2. **Intervalo nominal de muestreo:** $1000\text{ ms}$ ($\pm 500\text{ ms}$).
3. **Umbral de salto máximo admisible (`max_gap_ms`):** $\le 5000\text{ ms}$. Si el lapso entre el final de una muestra $i-1$ y el inicio de la muestra $i$ excede $5000\text{ ms}$, la ventana se considerará **discontinua** y quedará descalificada.
4. **Umbral de duración de consulta individual:** $\text{finished\_at} - \text{started\_at} \le 5000\text{ ms}$. Si una consulta WMI/CIM demora más de 5000 ms, se computa como degradación crítica del muestreador.
5. **Consistencia temporal estricta:** Para toda muestra $i$, $\text{started\_at} \le \text{finished\_at}$, y $\text{started\_at}_i \ge \text{finished\_at}_{i-1}$. No se admiten inversiones cronológicas ni timestamps en el futuro.
6. **Muestreo desagregado por grupos de procesos:** Cada muestra debe categorizar los procesos activos del host en cuatro grupos exclusivos:
   - `node`: Procesos cuyo ejecutable coincide con `^node(?:#|$)`.
   - `chromium`: Procesos de navegador (`chrome` o `headless_shell`).
   - `observer`: El propio proceso de telemetría (PowerShell CIM / PID observador).
   - `other`: Todos los demás procesos del sistema y de usuario.

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
        "node_version": { "type": "string", "pattern": "^v24\\.[0-9]+\\.[0-9]+$" },
        "pnpm_version": { "type": "string", "pattern": "^12\\.[0-9]+\\.[0-9]+$" },
        "chromium_version": { "type": "string", "minLength": 1 }
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
        "max_external_cpu_percent": { "type": "number", "minimum": 0.0, "maximum": 100.0 },
        "max_disk_queue": { "type": "number", "minimum": 0.0 },
        "max_pages_input_per_sec": { "type": "number", "minimum": 0.0 },
        "min_available_ram_mb": { "type": "integer", "minimum": 0 }
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
| `toolchain.node_version` | String | Debe comenzar con `v24.` (canónico: `v24.15.0`). |
| `toolchain.pnpm_version` | String | Debe comenzar con `12.` (canónico: `12.3.4`). |
| `toolchain.chromium_version` | String | Versión o revisión del binario de Chromium (canónico: `151.0.7922.34`). |
| `git.commit_sha` | String (40 hex) | Hash hexadecimal de 40 caracteres. Debe coincidir con el commit autorizado en la rama. No se admiten hashes de 7 caracteres. |
| `git.branch_name` | String | Debe ser estrictamente `"feat/qap-vnext-architecture"`. |
| `git.clean_working_tree` | Boolean | `true` si `git status --porcelain` no reporta modificaciones (excepto rutas en `allowed_untracked_or_modified`). |
| `dist_hashes` | Object (4 hashes) | Mapa con las 4 rutas obligatorias a hashes SHA-256 de 64 caracteres hex. Cualquier paquete faltante causa rechazo total. |
| `resource_reservation.accredited` | Boolean | Bandera central de idoneidad física. Si es `false`, el ejecutor no puede ser calificado como `EJECUTOR_APTO` bajo ninguna circunstancia. |
| `resource_reservation.evidence_doc` | String o Null | Si `accredited` es `true`, `evidence_doc` debe ser una cadena no vacía con la ruta o URI a la evidencia auditable. Si es `null` o `""`, se rechaza como no acreditado. |
| `telemetry_window.duration_ms` | Number | Duración total observada: debe ser $\ge 60000.0$ ms. Si el intervalo entre la primera y la última muestra es menor a 60s, la telemetría es inválida. |
| `telemetry_window.max_gap_ms` | Number | Máximo gap tolerable entre muestras consecutivas: $\le 5000.0$ ms. |
| `telemetry_window.sample_count` | Integer | Conteo de muestras. Si `samples` contiene elementos, `sample_count` debe ser estrictamente igual a `samples.length`. |
| `samples[i].groups` | Array (4 grupos) | Cada muestra debe contener exactamente los grupos `node`, `chromium`, `observer` y `other`. |

---

## 7. Protocolo de Evaluación y Criterios Deterministas de Rechazo

### 7.1. Prohibición Absoluta de PASS por Omisión
El validador automatizado (`check-preflight.mjs`) debe evaluar afirmativamente la totalidad de los requisitos. **Queda terminantemente prohibido el PASS por omisión**:
- Si un campo obligatorio no está presente en el JSON, la validación falla (`VALIDADOR_FAIL`).
- Si un objeto vacío `{}` o una entrada `null` es evaluada, debe retornar `valid: false` y documentar exhaustivamente los campos faltantes en `errors`.
- Ninguna condición contractual se asumirá como verdadera por el mero hecho de que no haya fallado una excepción no capturada.

### 7.2. Matriz de Casos de Evaluación y Estados Resultantes

| Escenario de Entrada | Validador (`validador_status`) | Ejecutor (`executor_status`) | Acción Contractual Obligatoria |
|---|---|---|---|
| **Manifiesto Sintético Válido** (`manifest-ejemplo.json` con `accredited: false` y `type: "synthetic_fixture"`) | **`VALIDADOR_PASS`** | **`EJECUTOR_NO_APTO`** | Aprueba validación sintética; mantiene ejecutor en NO APTO por falta de reserva física. Reporta: `PREPARADO / RESERVA NO ACREDITADA`. |
| **Ejecutor Real Acreditado** (Evidencia documental verificable, telemetría continua $\ge 60\text{ s}$, toolchain y dist hashes conformes) | **`VALIDADOR_PASS`** | **`EJECUTOR_APTO`** | Certificación positiva habilitada para emisión por Codex. |
| **Falacia de CPU Libre** (CPU = 0.5%, RAM libre = 8 GB, pero `accredited: false` o `evidence_doc: null`) | **`VALIDADOR_PASS`** (si sintaxis OK) | **`EJECUTOR_NO_APTO`** | Se rechaza la pretensión de reserva. Permanece como `EJECUTOR_NO_APTO`. |
| **Ruptura de Continuidad** (Muestras con salto > 5000 ms o consulta CIM > 5000 ms) | **`VALIDADOR_FAIL`** | **`EJECUTOR_NO_APTO`** | Descalificación inmediata de la telemetría por discontinuidad temporal. |
| **Ventana Insuficiente** (Duración continua < 60,000 ms) | **`VALIDADOR_FAIL`** | **`EJECUTOR_NO_APTO`** | Descalificación por muestreo temporal incompleto. |
| **Inconsistencia Git** (SHA truncado a 7 hex, SHA no coincidente, rama ajena a `feat/qap-vnext-architecture` o árbol sucio fuera de excepciones) | **`VALIDADOR_FAIL`** | **`EJECUTOR_NO_APTO`** | Rechazo por falta de integridad de código fuente. |
| **Discrepancia de Compilación** (Cualquiera de los 4 hashes de `dist/` no coincide con la línea base) | **`VALIDADOR_FAIL`** | **`EJECUTOR_NO_APTO`** | Rechazo por modificación no autorizada de binarios de producto. |
| **Contradicción Lógica** (Declara `status: "EJECUTOR_APTO"` pero contiene `accredited: false` o `evidence_doc: null`) | **`VALIDADOR_FAIL`** | **`EJECUTOR_NO_APTO`** | Detección de fraude o contradicción formal. Rechazo estricto. |

---

## 8. Contratos de Interfaz para los Agentes Implementadores

### 8.1. Contrato para el Agente 2 (`preflight.ps1`)
El implementador del script PowerShell de preflight debe acatar las siguientes condiciones de desarrollo:
1. **Inspección de Solo Lectura:** Utilizar exclusivamente consultas CIM (`Get-CimInstance`) a las clases `Win32_ComputerSystem`, `Win32_OperatingSystem`, `Win32_PerfFormattedData_PerfOS_Memory`, `Win32_PerfFormattedData_PerfOS_Processor`, `Win32_PerfFormattedData_PerfDisk_PhysicalDisk` y `Win32_PerfFormattedData_PerfProc_Process`.
2. **Protección de Privacidad:** No inspeccionar líneas de comandos completas (`Win32_Process.CommandLine`), argumentos, credenciales, tokens ni rutas de usuario privadas.
3. **No Destrucción:** Queda prohibido terminar procesos (`Stop-Process`), modificar afinidades o alterar configuraciones de energía del sistema operativo.
4. **Confinamiento de Salida:** El script debe escribir obligatoriamente en `docs/vnext/implementaciones/VNEXT-014-E01/r7/`. Si el destino de salida apunta a cualquier otra ruta, el script debe abortar de inmediato.
5. **Garantía Temporal:** El muestreador debe capturar al menos 60 segundos continuos (nominalmente 60 muestras con intervalo de 1000 ms), midiendo el tiempo de cada consulta CIM (`query_ms`) y el salto entre muestras (`gap_ms`).
6. **Comportamiento por Defecto en Entorno Host Local:** Al ejecutarse en una máquina local de desarrollo que no disponga de aprovisionamiento formal de CI/Cloud con cuotas reservadas, `preflight.ps1` debe generar un manifiesto con `accredited: false`, `provenance: "none"`, `type: "unreserved_shared"` y dictamen `status: "EJECUTOR_NO_APTO"`, con justificación `PREPARADO / RESERVA NO ACREDITADA`.

### 8.2. Contrato para el Agente 3 (`check-preflight.mjs` y `check-preflight.test.mjs`)
El implementador del validador automatizado debe satisfacer:
1. **Runner Nativo de Node.js:** La suite debe ejecutarse exclusivamente con `node --test docs/vnext/implementaciones/VNEXT-014-E01/r7/check-preflight.test.mjs`. No debe requerir Vitest ni alterar dependencias de `package.json`.
2. **API Exportada:** El módulo `check-preflight.mjs` debe exportar la función pura `validatePreflightManifest(manifest, options)`.
3. **Matriz de Pruebas Obligatoria:** Debe implementar los 24 casos de prueba sintéticos especificados en la Sección 8 de `spec.md`, cubriendo fixtures positivos conformes, fixtures de ejecutor acreditado, y fixtures negativos de rechazo por omisión, discontinuidad, SHA inválido y falacia de CPU ociosa.
4. **Verificación de la Regla de No Conversión:** La suite debe verificar explícitamente mediante aserciones estrictas que un fixture sintético que obtiene `validador_status === "VALIDADOR_PASS"` conserve indefectiblemente `executor_status === "EJECUTOR_NO_APTO"`.

---

## 9. Protocolo de Traspaso a Codex

Una vez completadas y verificadas las implementaciones de los tres agentes y consolidado el informe de integración `README.md` por el Coordinador Gemini, la entrega técnica se pondrá a disposición de Codex bajo el siguiente protocolo:
1. **Rama de Publicación:** `feat/qap-vnext-architecture` (verificando que el árbol se encuentre limpio y en paridad con el remoto).
2. **Estado Reportado:** `PREPARADO / RESERVA NO ACREDITADA`.
3. **Rol de Codex:** Como auditor técnico externo e independiente, Codex inspeccionará el manifiesto de host generado, contrastará los contratos aquí definidos, verificará las pruebas nativas de Node.js y, únicamente si cuenta con un entorno con reserva operacional acreditada, emitirá el dictamen técnico final de idoneidad antes de autorizar la repetición de la prueba E01.
