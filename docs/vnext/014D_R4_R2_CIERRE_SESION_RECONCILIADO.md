# VNEXT-014-D-R4-R2 — Primera llamada de cierre tras reconciliar un waiver durable

**Fecha:** 2026-11-04  
**Rama exclusiva:** `feat/qap-vnext-architecture`  
**Base independiente auditada:** `fd89c9de83337693aeb28f2df7861bf16d484f24` (R4-R1)  
**Estado R4-R2:** código/test y documentación publicados remotamente, **sin ejecución sobre el HEAD R4-R2**.  
**Dictamen:** **NO-GO para cerrar VNEXT-014**; no iniciar VNEXT-015.

## 1. Auditoría R4-R1 ejecutada en computadora nueva

El auditor empleó worktree separado y dependencias de lockfile, Node 24.15.0 con SQLite FTS5, pnpm 11.3.0 y Chromium 153.0.8010.12. El intento previo con Node 22.13.0 no soportó FTS5 en ese runtime, por lo que **la matriz válida es la de Node 24**. Se preservó la sesión protegida y no se alteró el proyecto.

Matriz física sobre `fd89c9d`:
- Build 10 paquetes PASS; runner **71/71 PASS**; Stdio MCP **18 herramientas PASS**.
- `discovery-handler.test.ts` **59/59 PASS**; R4-I01 logra `WRAP_UP` con reporte físico, entrevista/revisión sintética, motivo autorizado, historial y recibo SQLite. El aislamiento N01 también PASS.
- `canonical-coverage.test.ts` **25/25 PASS**, incluidos Crash Scenarios 2 y 3; invariantes de dominio **16/16 PASS**.
- MCP serial **393 PASS / 55 FAIL** (448); los 55 por título pertenecen a la deuda nominal histórica de VNEXT-013: lifecycle 5, p3 5, p4-2 2, p4-4 7, p4-5a 10, p4-5a2 16, server 10.
- Lint global: **46 errores / 28 warnings**. Lint focal (servicio + dos suites) **12 errores** atribuidos a `canonical-coverage.test.ts`. El servicio y `discovery-handler.test.ts` tenían cero diagnósticos focales en esta matriz. No se considera aprobada la compuerta de lint.

Los resultados anteriores **no son mediciones del nuevo HEAD R4-R2**.

## 2. Hallazgo R4-R1-A01 — primera llamada de cierre retorna snapshot obsoleto

Reproducción física independiente con un estado en `WORKING`, módulo `catalog` terminal `waived` con `waived_reason` deliberadamente ausente en el archivo, y **decisión/razón ya aprobadas y durables en SQLite**:

1. Primera llamada `qap_session_close`: `allModulesClosed()` invoca el servicio de cierre, que restaura desde SQLite el motivo **exacto**, conserva historial, no duplica recibo y no pide nueva aprobación.
2. **Defecto:** la misma llamada devuelve `blocked`, `waived exige waived_reason`, porque `server.ts` había leído `lifecycleState` antes de la reconciliación. El guard `canExitWorking` evaluaba el objeto anterior a la reparación.
3. Segunda llamada: `success / WRAP_UP`, reporte físico con estado y motivo.

**La seguridad del guard es correcta.** El bug consiste en evaluar el snapshot equivocado. No debe hacerse `canExitWorking` más permisivo ni inventarse aprobación humana.

## 3. Corrección implementada en R4-R2

Archivo `packages/mcp/src/server.ts`, caso `qap_session_close`:

- Preservar el chequeo inicial de fase `WORKING` antes de consultar o reconciliar.
- Ejecutar el guard prioritario `closureService.allModulesClosed()` sin cambio de su semántica.
- **Después de resolver el cierre canónico**, volver a leer `lifecycle.json` mediante `FileSystemStorage.getLifecycleState()`.
- Verificar nuevamente que la fase sigue siendo `WORKING`; si cambió durante la operación, responder `blocked / session_phase_changed` sin generar reporte.
- Pasar el **estado actualizado** a `canExitWorking` y reutilizarlo para `gapParams`, `sessionId`, listado de módulos y el reporte de brechas.
- Conservar el mecanismo existente de transición a `WRAP_UP` únicamente si pasan ambas compuertas. No se modifica `CanonicalClosureService`, `canExitWorking` ni el esquema SQLite.

Así, una renuncia durable aprobada y reparada durante la misma solicitud puede cerrar en el primer intento, mientras que cualquier módulo sin waiver realmente autorizado continúa bloqueado.

## 4. Prueba dirigida nueva

`packages/mcp/src/__tests__/canonical-coverage.test.ts`, Suite 5:

**`R4-R2-A01: first session close uses recovered waiver metadata for the gate and physical report`**

Esta prueba usa servidor MCP SDK real y un fixture físico SQLite/FS desechable:

- Una aprobación de prueba emitida por gateway sintético crea `waived` con razón expresamente autorizada (incluidos espacios a ambos lados), historial y recibo durable.
- El test elimina **solo el campo `waived_reason` de lifecycle.json**, conservando la decisión SQLite y la transición histórica.
- El servidor MCP para `qap_session_close` recibe un gateway que arroja error ante cualquier intento de segunda aprobación.
- **La primera y única llamada** debe retornar `status:success`, `fase:WRAP_UP` y un `report_path` físico.
- Debe restaurar exactamente la razón original, conservar historial terminal, mantener intactos los registros relation y no aumentar el contador de aprobaciones.
- El reporte físico debe mencionar módulo, estado `waived` y el texto del motivo recuperado.

La prueba **no está ejecutada**. Si falla, registrar el primer fallo y la respuesta real; no cambiar expectativas para hacerla pasar.

## 5. Limpieza estática adicional, sin afirmaciones de PASS

En `canonical-coverage.test.ts` se reforzaron aserciones previamente ausentes sobre decisiones capturadas y gateway nunca consultado en la recuperación. Se hizo asíncrono el cleanup del MCP SDK para esperar `client.close()` y `server.close()`. Se exige que `decision_id` sea una cadena antes de interpolarlo en un ID de recibo.

Estos cambios se dirigieron a algunos de los problemas evidentes descritos en la auditoría (variables sin uso, promesas flotantes, interpolación de `unknown`). **No se dispone del listado original de los 12 diagnósticos completos en este entorno ni de la nueva ejecución de ESLint. No afirmar lint focal limpio**; el auditor debe entregar las líneas/reglas que persistan para una corrección dirigida posterior.

## 6. Compuerta del auditor Codex

En el worktree separado de la otra computadora o un nuevo worktree seguro, verificar remoto, SHA, FTS5, Node 24 y diff. No intervenir `main`, `develop`, sesiones protegidas, producción ni credenciales reales.

```powershell
git status --short
git rev-parse HEAD
git fetch origin feat/qap-vnext-architecture
# Actualizar de forma segura o crear worktree separado en el SHA R4-R2.
pnpm build
pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-coverage.test.ts -t 'R4-R2-A01' --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-coverage.test.ts --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/mcp exec vitest run src/__tests__/discovery-handler.test.ts --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/mcp exec eslint src/handlers/canonical-closure-service.ts src/server.ts src/__tests__/canonical-coverage.test.ts src/__tests__/discovery-handler.test.ts
pnpm --filter @qap/mcp exec vitest run --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/playwright-runner exec vitest run --maxWorkers=1 --reporter=verbose
pnpm lint
```

Si es viable, repetir Stdio MCP en fixture separado con 18 tools y éxito real de una llamada; el Stdio R4-R1 no acredita el nuevo SHA. Conservar stdout/stderr, exit codes y JSON.

**Comparación:** R4-R1 tiene 448 tests MCP, de los cuales 393 PASS y 55 FAIL. R4-R2 agrega **una prueba**, así que debe cotejarse por título y total, no asumir automáticamente 394 PASS. El auditor debe indicar si los 55 históricos mantienen su identidad y si existen nuevos errores.

**Diagnósticos obligatorios:** confirmación de primera llamada, ausencia de segunda aprobación, estado reparado y razón exacta, recibos, historial, contenido físico del reporte, los 12 errores de lint focal antes/después con archivo/línea/regla, y estado real del lint global.

## 7. Siguiente fase

- Validar R4-R2 físicamente, corregir cualquier defecto expuesto, sin bypasses.
- Investigar/probar las 55 garantías históricas de VNEXT-013; migrar sus tests a contratos canónicos solamente cuando preserven la intención original. El objetivo incluye cinco casos de lifecycle V3, cierre `closed` con cobertura real, y sesión multi-módulo con replanificación.
- Corregir deuda de ESLint por archivo/regla de forma independiente.
- Mantener VNEXT-014 **NO-GO** hasta compilación, runner, MCP, lint y Stdio certificados sobre un mismo SHA. No iniciar VNEXT-015 prematuramente.
