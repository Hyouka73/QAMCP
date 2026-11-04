# VNEXT-014-D — ReportHandler, integridad de evidencias y estado de verificación

**Fecha:** 2026-11-04  
**Rama exclusiva:** `feat/qap-vnext-architecture`  
**Estado:** IMPLEMENTACIÓN PUBLICADA; VERIFICACIÓN DINÁMICA PENDIENTE  
**Dictamen:** PARTIAL / NO CERTIFICADO  
**Alcance:** Integración declarativa de `qap_report` y corrección de integridad de salida de `qap_test`.

## 1. Base verificada antes de escribir

- HEAD remoto al iniciar: `e44bbca51e2f35253b5d6cb0faabddde103b2bbc`.
- VNEXT-014-A, B, B-R1, C1 y C2 aparecen documentadas en `STATE.md`.
- C2 dejó `qap_plan` y `qap_test` declarativos, con pruebas físicas históricas reportadas en `014C2_TEST_HANDLER.md`.
- El `qap_report` antiguo seguía en el switch monolítico y no validaba la integridad de conteos antes de generar informes.
- `TestHandler` registraba advertencias de esquema o persistencia, pero aún devolvía `success/completed`. Se detectó además que el esquema v1 de `execution_id` permite cualquier cadena.

## 2. Implementación realizada

### 2.1 Corrección de `TestHandler`

Archivo: `packages/mcp/src/handlers/test.handler.ts`.

- Rechazo de cualquier `ExecutionResult` que no valide contra el esquema; no se guarda ni se informa como éxito.
- Validación local de `execution_id` mediante patrón de basename seguro (`[A-Za-z0-9][A-Za-z0-9_-]{0,127}`) antes de escribir rutas.
- Si falla el guardado de la ejecución, se devuelve `execution_not_persisted` sin añadir historial ficticio.
- Si el resultado ya está persistido pero falla el historial, se devuelve `execution_history_not_persisted`, `status: partial`, `execution_saved: true`, `history_saved: false`.
- No se repiten automáticamente interacciones de navegador ni se imprime al cliente una ruta sensible de una excepción.

### 2.2 Nuevo `ReportHandler`

Archivos:
- `packages/mcp/src/handlers/report.handler.ts` (nuevo)
- `packages/mcp/src/server.ts` (registro y retirada del caso legacy)
- `packages/mcp/src/tool-catalog.ts` (filtro opcional por módulo)

Contrato y restricciones:
- No crea ejecuciones sintéticas: busca únicamente JSON ya guardado en `.qa/executions/`.
- Rechaza `executionId` inseguros antes de consultar rutas.
- Permite `executionId` explícito, selección de último resultado válido y filtro de módulo.
- Valida el esquema canónico, unicidad de IDs de casos, concordancia entre `cases` y `summary`, y prohíbe aprobar corridas vacías.
- Bloquea referencias de screenshots que salgan de `.qa/reports/screenshots` antes de generar HTML con imágenes embebidas.
- Reutiliza generadores existentes de `@qap/reporter`: HTML, Markdown, JUnit y JSON.
- Escribe reportes mediante `FileSystemStorage.write()`; entrega rutas absolutas para conservar el contrato del handler legado.
- `qap_report` se incorpora al conjunto `migrated` y a `ToolDispatcher`, sin sumar entradas al catálogo de 18 tools.
- No genera `ConformityAssessment`, ni acredita automáticamente conformidad de reglas de negocio.

### 2.3 Pruebas agregadas y conciliadas

- `packages/mcp/src/__tests__/test-handler.test.ts`: 7 regresiones D-01..D-07 para esquema inválido, IDs inseguros, errores de guardado e historial parcial.
- `packages/mcp/src/__tests__/report-handler.test.ts`: 12 regresiones D-R01..D-R12 para falta de evidencias, generación JSON, conteos incoherentes, selección por fecha/módulo, traversal, referencias de imágenes, generación de cuatro formatos y falsa aprobación con cero casos.
- `packages/mcp/src/__tests__/server.test.ts`: fixture de reporte legado conciliada con el invariante de no aprobar un resultado vacío; el bloqueo sin ejecuciones se considera error estructurado.

**Importante:** los archivos de prueba fueron creados o modificados, pero NO ejecutados en esta sesión. Ninguna prueba de este bloque debe marcarse PASS hasta comprobarla en el workspace real.

## 3. Invariantes y límites

- Escrituras exclusivamente en `feat/qap-vnext-architecture`; ningún merge, force-push ni cambio dirigido a `main` o `develop`.
- No se inspeccionó ni modificó el contenido de `admin-user.json`.
- No se tocó el esquema canónico SQLite v2 ni se creó base SQLite canónica.
- Las pruebas de reportes usan fixtures de resultados en disco. Estos fixtures verifican el *código del generador*; **no** son evidencia de que se ejecutó físicamente un navegador.
- La presencia de un JSON válido en disco no es una prueba criptográfica del origen físico: `coverage_source` no afirma procedencia física verificada. Para conformidad D-011, se requiere cadena de evidencia del runner ejecutado realmente.
- No fue posible clonar ni ejecutar el repositorio desde el entorno de este revisor; acceso disponible a GitHub para lectura y escritura, pero sin runtime del workspace local.
- Las limitaciones históricas de Node/FTS5, Chromium y pruebas MCP legacy de `STATE.md` siguen requiriendo comprobación de entorno; no se declaran resueltas.

## 4. Verificación obligatoria pendiente

En una copia limpia y actualizada de la rama, sin alterar el repositorio de producción:

```powershell
git status --short
git branch --show-current
git fetch origin
git pull --ff-only origin feat/qap-vnext-architecture
node --version
pnpm build
pnpm --filter @qap/mcp test -- src/__tests__/report-handler.test.ts src/__tests__/test-handler.test.ts src/__tests__/server.test.ts src/__tests__/dispatcher-integration.test.ts
pnpm --filter @qap/playwright-runner test
node scripts/test-mcp-stdio.mjs
pnpm --filter @qap/mcp exec eslint src/handlers/report.handler.ts src/handlers/test.handler.ts src/server.ts src/tool-catalog.ts src/__tests__/report-handler.test.ts src/__tests__/test-handler.test.ts
```

Requisitos de aceptación: compilación de los 10 paquetes, regresiones focalizadas aprobadas, ejecución Stdio con 18 tools, prueba de Chromium físico cuando esté disponible, y sin degradación de `main/develop` ni de los archivos protegidos. Registrar números reales, salida de errores y SHA final; si falla cualquier prueba, mantener el dictamen **PARTIAL** y corregir antes de abrir VNEXT-015.

## 5. Pendientes después de la validación de D

1. Ejecutar auditoría de que los reportes nunca convierten `failed/error/partial/not_run` en `ConformityAssessment.pass`.
2. Revisar la discrepancia entre `ExecutionResult` tipado y validación del esquema JSON, especialmente campos legacy.
3. Establecer política de evidencia de origen para distinguir ejecuciones físicas de archivos importados o manipulados.
4. Completar pruebas con Node/SQLite FTS5 habilitado, Chromium real y CI sin depender de fixtures preexistentes.
5. Cerrar formalmente VNEXT-014 y **solo entonces** comenzar VNEXT-015 (`ImpactAnalyzer`).

## 6. Estabilización correctiva VNEXT-014-D-R1 (2026-11-04)

**Estado:** código y regresiones publicadas; compilación/ejecución pendiente. Ningún resultado de prueba de este apartado está certificado.

### Hallazgos confirmados por inspección del código

1. **Colisión de identificadores:** `PlaywrightRunner` generaba cada `execution_id` con `Date.now()`. Dos ejecuciones en el mismo milisegundo podían apuntar al mismo nombre de archivo y sobrescribir datos anteriores. Corregido con `randomUUID()` y un identificador estable por invocación, en las tres salidas del runner.
2. **Error crítico con inventario engañoso:** un fallo al crear `BrowserContext` o preparar un caso terminaba en el `catch` externo con `summary.failed = 1` y `cases = []`. El resultado ahora conserva cada caso restante como `not_run`, recupera los conteos del inventario y usa `result: error`, sin inventar aserciones funcionales.
3. **Integridad semántica insuficiente:** el esquema JSON no garantizaba consistencia entre estados, totales, IDs y módulo/entorno. Nueva utilidad pura `packages/mcp/src/handlers/execution-evidence.ts` compartida por `TestHandler` y `ReportHandler`. Valida unicidad de casos, correspondencia de conteos y semántica de `passed / failed / partial / error`; no acredita procedencia física.
4. **Errores del runner comunicados como completados:** si `PlaywrightRunner` devolvía `result: error` sin parecer fallo de arranque de Chromium, `TestHandler` podía dar `status: completed`. Ahora persiste el error canónico y devuelve un error MCP explícito `runner_execution_error`.
5. **Regresión de compatibilidad E0c:** `lifecycle-v3-e2e.test.ts` espera `razon` y `siguiente_accion.tool` cuando `qap_report` está bloqueado sin ejecuciones. `ReportHandler` ahora conserva `razon`, dirige a `qap_status` y contempla tanto ausencia como existencia vacía del directorio de ejecuciones.

### Regresiones preparadas

- `TestHandler`: D-05 (módulo inconsistente), D-06 (conteos inconsistentes), D-07 (error crítico persistido sin falso éxito). Total D-01..D-07: **7 pruebas nuevas escritas, no ejecutadas**.
- `ReportHandler`: D-R09 (partial contradictorio), D-R10 (IDs duplicados), D-R11 (integración MCP sobre transporte in-memory y catálogo de 18), D-R12 (carpeta de ejecuciones vacía y contrato legacy E0c). Total D-R01..D-R12: **12 pruebas nuevas escritas, no ejecutadas**.
- `PlaywrightRunner`: REG-R2-10 (dos ejecuciones con mismo `Date.now`), REG-R2-11 (error de `BrowserContext` y preservación de `not_run`). Total en esta estabilización: **2 pruebas nuevas escritas, no ejecutadas**.
- `server.test.ts`: el fixture reportado antes fue conciliado con D-011; la suite histórica `lifecycle-v3-e2e.test.ts` **no fue modificada**.

**Contabilización:** 21 pruebas nuevas escritas en 014-D + D-R1 (7 + 12 + 2). No se suman a casos históricos ni se declara porcentaje de aprobación.

### Compuerta de verificación actualizada

Además de los comandos del §4, incluir:

```powershell
pnpm --filter @qap/mcp test -- src/__tests__/lifecycle-v3-e2e.test.ts
pnpm --filter @qap/playwright-runner test -- test/runner-safety-honesty.test.ts
pnpm --filter @qap/mcp exec eslint src/handlers/execution-evidence.ts
```

No iniciar VNEXT-015 ni fusionar la rama antes de ejecutar, corregir y registrar los resultados reales. La validación estática por inspección y la publicación de commits no sustituyen `pnpm build`, el navegador real, SQLite FTS5 y las pruebas funcionales.
