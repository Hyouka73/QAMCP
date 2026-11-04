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

- `packages/mcp/src/__tests__/test-handler.test.ts`: 4 regresiones D-01..D-04 para esquema inválido, IDs inseguros, errores de guardado e historial parcial.
- `packages/mcp/src/__tests__/report-handler.test.ts`: 8 regresiones D-R01..D-R08 para falta de evidencias, generación JSON, conteos incoherentes, selección por fecha/módulo, traversal, referencias de imágenes, generación de cuatro formatos y falsa aprobación con cero casos.
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
