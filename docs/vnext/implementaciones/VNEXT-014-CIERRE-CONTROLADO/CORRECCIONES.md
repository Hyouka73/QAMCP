# VNEXT-014 — Correcciones y causas raíz

**Rama aislada:** `fix/vnext-014-cierre-controlado`. La evidencia es revisión de código y commit remoto; no equivale a prueba física.

## CF01 — errores internos convertidos en conflicto

**Archivo:** `packages/mcp/src/handlers/canonical-closure-service.ts`.

**Antes:** el `catch` general de `persistWithKnowledgeFence` retornaba `status: blocked, code: closure_consistency_conflict` para cualquier excepción, incluso errores inesperados de `closureStore.transaction`. Al cliente le llegaba el mismo resultado para un cambio de contexto legítimo y una falla interna de disco.

**Cambio:** conserva bloqueo tipado para `KnowledgeStoreError.CONFLICT`, cambios conocidos de snapshot/revisión/contexto y expiración autorizada. El resto se relanza como error real, para que el servicio no simule un bloqueo ordinario. No se modifican el orden lifecycle → Knowledge → Closure, la autorización, ni el contenido de los recibos.

**Regresión:** `packages/mcp/src/__tests__/canonical-coverage.test.ts`, caso `VNEXT-014-CF01`: inyecta una falla de escritura inesperada en el puerto Closure y exige rechazo, sin nuevas aprobaciones ni receipts. También debe ejecutarse toda la cobertura existente de `closure_consistency_conflict`, cuyo contrato se preserva para contención SQLite conocida.

**Commits de este ajuste:** `56bf7a0`, refinamiento `af3774f`, regresión `970f4c8`.

**Reserva:** clasificar con pruebas si algunos adaptadores de host expresan contención mediante códigos no tipados. No convertir excepciones arbitrarias en conflictos ni debilitar el contrato para dar verde.

## CF02 — pruebas adversariales positivas sin fence real

**Archivo:** `packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts`.

**Causa histórica:** ocho casos de cierre canónico consumían `MemoryKnowledgeStore`, que no tiene `withWriteFence`. El servicio los bloqueaba antes de alcanzar la garantía que las aserciones intentaban comprobar; no era evidencia de ocho bugs productivos.

**Cambio:** bandera opt-in `physicalKnowledge` sobre una instancia `SqliteKnowledgeAdapter` en archivo temporal; no se introduce un fence falso. Las ocho identidades 3.1/3.2/3.3/5.4/7.2/7.3/7.4/7.5 optan a SQLite. Las pruebas sin opt-in siguen en Memory y los negativos existentes sin fence se conservan. 3.1/3.2 exigen `blocked/closure_context_changed` y comprueban efectos nulos. 7.3/7.4 usan una segunda conexión Knowledge y Closure física; 7.3 verifica dos approvals y recibos distintos. Se conservan los nombres originales.

**Commits:** `7c1ce0d`, `72ae8c3`, `ba28dfc`, `96f0f3e`, `cd56f9f`.

**Refuerzo de oráculos:** 5.4 ahora exige respuesta MCP no-error, `success/WRAP_UP`, reporte físico existente, lifecycle actualizado y recibo único. 7.5 exige que el recibo falsificado conserve su procedencia visible tras el rechazo y que el lifecycle permanezca `WORKING/planned`. Estas aserciones todavía **no han sido ejecutadas**.

**Reserva:** un cambio de fixture no acredita ninguna garantía hasta ejecutar el caso real sobre Windows/Node con FTS5; es posible que aparezcan defectos posteriores antes ocultos por el primer bloqueo. Cada hallazgo nuevo debe registrarse con reproducción antes de modificar producción.

## Excluido intencionalmente

No se alteraron A01/A02/C01 previamente reparados, E01 sin nueva reproducción física, los 55 tests legacy, `PlanHandler`, `TestHandler`, reporter, WBS completados, ni módulos VNEXT-015–023. No merges, force-push, cambios de credenciales ni bases reales.


## Seguimiento del rescate integrado

Seguimiento aditivo 2026-11-06: el nuevo lote implementa sanitización MCP, reentrancia/drift tipados, reparación 7.5 con reopen y dos causas de cleanup. Detalles, SHAs y límites en [RESCATE_20261105.md](RESCATE_20261105.md). E01 no se declara resuelto por ausencia de unhandled.
