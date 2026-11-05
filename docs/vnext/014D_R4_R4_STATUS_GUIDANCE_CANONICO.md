# VNEXT-014-D-R4-R4 — Guidance de qap_status coherente con cierre canónico

**Fecha:** 2026-11-04 (registro cronológico de la sesión; auditoría publicada por Codex en commit posterior)  
**Rama de código:** `feat/qap-vnext-architecture`  
**Base de código auditada:** `7e0142a97c67fa1c65c46a83e2a5f003b0b435cd` (R4-R3)  
**Commit documental de Codex:** `230f61f4fe91f4583fcf1706e61923316d05c374`  
**Estado R4-R4:** código, pruebas y documentación **publicados sin prueba física del nuevo HEAD**. **VNEXT-014 continúa NO-GO.**

## 1. Auditoría R4-R3 verificada

Fuente primaria: [Informe independiente publicado por Codex](auditorias/VNEXT-014-R4-R3/INFORME.md). Codex auditó el SHA de código `7e0142a` con Windows x64, Node 24.15.0, SQLite FTS5, pnpm 11.3.0 y Chromium 153.

- Build: 10 paquetes PASS; 7/7 adversariales PASS; coverage 33/33 PASS; runner 71/71 PASS; Stdio MCP 18 herramientas y `qap_init` PASS.
- Discovery: un timeout inicial (58/59), reintento posterior 59/59 PASS. Primera ejecución MCP integral: worker con salida inesperada y resultados incompletos; reintento completo **401 PASS / 55 FAIL** de 456. Los 55 títulos fallidos coinciden con la deuda histórica VNEXT-013.
- Lint focal: 1 error `preserve-caught-error` en `canonical-closure-service.ts:754`; global **35 errores / 28 warnings**.
- R4-R2-A02 y R4-R2-A03 PASS: siete cierres durables inconsistentes se bloquean antes de crear recibo, alterar lifecycle o generar reporte. R4-R2-A01 y Crash 2/3 continúan pasando.
- **R4-R3-A01 P2:** en el fixture con lifecycle legacy `catalog:waived` pero aprobación durable ausente, `qap_status` proyecta cierre canónico `working / ready_for_closure:false` pero recomienda `qap_session_close`. La llamada real de cierre sí bloquea con `canonical_module_closure_required`. Es guidance incorrecto; no se ha probado una vía pública para introducir la inconsistencia.

## 2. Causa

`StatusHandler.execute` construye la propiedad `canonical_modules[].closure` consultando `CanonicalClosureService.status`, pero obtiene `siguiente_accion` mediante `inspectLegacyState()`, que llama `getPhaseGuidance` sobre el estado de `lifecycle.json` sin conciliar el cierre canónico vinculado al host. Un terminal legacy no prueba que el módulo esté canónicamente autorizado.

## 3. Corrección R4-R4 (sin ejecución independiente)

`packages/mcp/src/handlers/status.handler.ts`:

1. Lista todos los nombres de módulo que el host enlaza a `IKnowledgeStore` y considera inicialmente su cierre **no acreditado**.
2. Elimina un nombre de pendientes solo si `CanonicalClosureService.status(name)` devuelve explícitamente `state=closed` o `state=waived`, después de su validación durable. Ausencia de servicio, error de consulta y truncamiento del inventario no equivalen a autorización.
3. Conserva el payload legacy para compatibilidad, pero cuando la fase es WORKING, hay un cierre canónico pendiente y `siguiente_accion.tool === qap_session_close`, sustituye **solo la recomendación incorrecta** por una acción `qap_module_close`, indicando revisión de la autorización y posible intervención del host ante datos corruptos.
4. Publica `canonical_pending_closure_modules` para transparentar los módulos vinculados todavía no acreditados. Alinea `_guidance_for_assistant` con la recomendación segura.
5. Mantiene la recomendación original si todos los módulos del host están legítimamente cerrados/renunciados. No modifica `canExitWorking`, `qap_session_close`, el esquema ni las reglas de aprobación.

`packages/mcp/src/handlers/canonical-closure-service.ts`:

- Corregida la regla `preserve-caught-error`: la excepción de cierre durable inválido generada dentro de un `catch` conserva `{ cause: err }`. Esto no transforma registros inconsistentes en aprobaciones ni relaja las compuertas de seguridad.

## 4. Regresiones

En `packages/mcp/src/__tests__/canonical-coverage.test.ts`:

- Los siete escenarios R4-R3 incorporan una petición física de `qap_status`. Comprueban `canonical_modules[].closure: working / ready_for_closure:false` y que `siguiente_accion.tool` **nunca** sea `qap_session_close` si el closure durable es inválido.
- En el caso crítico terminal `waived`/aprobación ausente, verifican `estados_modulos.catalog: waived`, `canonical_pending_closure_modules: ['catalog']` y recomendación `qap_module_close`.
- Nuevo caso positivo `R4-R4-A01 positive: a legitimately authorized durable waiver still recommends session close`: un waiver sustantivo emitido por gateway sintético autorizado debe seguir recomendando `qap_session_close`, sin pendientes canónicos.

Las pruebas conservan las aserciones de bloqueo efectivo, cero reportes/recibos y ausencia de reautorización. Este cambio añade **1 prueba nueva** sobre el total MCP de 456 del baseline, pero **no se presume 402 PASS** hasta ejecución.

## 5. Compuertas obligatorias Codex (auditoría en computadora externa)

Con Node 24 + FTS5, lockfile congelado y Chromium; auditar el SHA específico de R4-R4 en worktree limpio.

```powershell
pnpm build
pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-coverage.test.ts -t 'R4-R3: inconsistent durable closure' --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-coverage.test.ts -t 'R4-R4-A01 positive' --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-coverage.test.ts --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/mcp exec vitest run src/__tests__/discovery-handler.test.ts --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/mcp exec eslint src/handlers/status.handler.ts src/handlers/canonical-closure-service.ts src/__tests__/canonical-coverage.test.ts
pnpm --filter @qap/mcp exec vitest run --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/playwright-runner exec vitest run --maxWorkers=1 --reporter=verbose
pnpm lint
```

Repetir Stdio 18 tools con `qap_init` sintético si el entorno lo permite. Comparar nombres, totals y códigos de salida; registrar cualquier error o regresión sin modificar expectativas.

**Contrato de publicación:** Codex debe actualizar esta nota, `STATE.md`, `04_BACKLOG_Y_WBS_PRELIMINAR.md` y crear `docs/vnext/auditorias/VNEXT-014-R4-R4/` con `INFORME.md`, `DIFERENCIAL_MCP.md`, `LINT.md`, `COMANDOS.md` y `EVIDENCIA_STATUS.md`. Publicar solo documentación/evidencia saneada en la misma rama mediante un commit descriptivo. Diferenciar SHA de código auditado del SHA de documentación. No subir tokens, sesiones, bases sensibles ni rutas personales.

## 6. Deuda pendiente

- 55 fallos históricos de siete suites MCP; no migrar expectativas para obtener PASS sin reemplazarlas por garantías canónicas equivalentes y verificables.
- Validar cobertura completa real con cierre `closed`, un escenario multi-módulo y replanificación WRAP_UP → SCOPING.
- Lint global pendiente (baseline R4-R3 35 errores y 28 advertencias).
- Sensibilidad a timeout de cancelación/worker Discovery bajo carga, causa no demostrada.
- **VNEXT-014 NO-GO** hasta resolver garantías, lint y compuertas físicas; VNEXT-015 no iniciado.
