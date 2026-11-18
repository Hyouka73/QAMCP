# VNEXT-014-D-R4-R1 — Proyección de renuncia canónica y reparación de lifecycle

**Fecha:** 2026-11-04  
**Rama exclusiva:** `feat/qap-vnext-architecture`  
**SHA de auditoría independiente R4:** `ed2955ff91a6506a80e3ff0e4bb9322cf9eed226`  
**Estado de la corrección:** código y regresiones publicados; **SIN ejecución en el nuevo HEAD**.  
**Dictamen general:** **NO-GO** para cerrar VNEXT-014; VNEXT-015 no iniciado.

## 1. Resultado real de la auditoría R4

El evaluador externo ejecutó el SHA R4 en un checkout Windows, preservando la modificación local protegida. Datos **del SHA auditado**, no del código nuevo:

- `pnpm build`: 10 paquetes PASS.
- `discovery-handler.test.ts`: **58 PASS / 1 FAIL** (59). N01 multiserver PASS completo; R4-I01 E2E integrado FAIL.
- MCP serial: **392 PASS / 56 FAIL** (448): 55 del inventario histórico y un escenario integrado nuevo.
- Runner: **71/71 PASS**. ESLint del TS afectado: 0 diagnósticos. Lint global: **46 errores / 28 warnings**.
- El recorrido nuevo llegó realmente a la adquisición Chrome/HTTP, seis observaciones asociadas en SQLite, pregunta/propuesta, rechazo sin autorización, requisito confirmado por gateway sintético, bloqueo de cierre legacy, waiver aprobado y recibo SQLite persistido.
- **Primer defecto:** `qap_session_close` devolvió `blocked` con `waived exige waived_reason`; no se alcanzaron `WRAP_UP`, el reporte físico ni las aserciones finales. La cuenta **no se marca PASS**.

La traza indicó que el registro durable `ModuleClosureRecord.waiverReason` sí contenía el motivo autorizado, pero `CanonicalClosureService.commitFinalClosure` había escrito al lifecycle solamente `state: waived`. `reconcile()` tampoco reparaba el caso cuando `state` ya era `waived` y solo faltaba metadata. El guard `canExitWorking` funcionó correctamente; **no debía relajarse**.

## 2. Corrección de producción

Archivo: `packages/mcp/src/handlers/canonical-closure-service.ts`.

Se centralizó la proyección en `projectLifecycleClosure(plannedName, closure)`, invocada por:

1. `commitFinalClosure`: después de persistir la decisión autorizada y el recibo, proyecta **el motivo exacto y el estado canónico durable**, no un motivo inventado.
2. `reconcile()`: además de recuperar recibos, repara tanto un módulo pendiente de transición como el caso **ya waived sin waived_reason**, aunque el marcador terminal coincida.

Invariantes:

- No proyectar `waived` si el registro durable no posee una razón de texto no vacío.
- Para una renuncia nueva de un módulo no terminal, utilizar `transitionModule` con `waived_reason`, conservando validación de transiciones e historial de lifecycle.
- Para un estado terminal `waived` ya persistido pero incompleto, reparar **solo el motivo faltante o divergente** desde el registro durable, sin inventar un segundo evento histórico.
- No convertir `closed ↔ waived` arbitrariamente si el lifecycle ya tiene un estado terminal distinto. No modificar guards, contratos de autorización, ni el esquema SQLite.
- Repetir reconciliación con los mismos datos debe ser **idempotente**. Ante error de sistema de archivos, el registro durable permanece y una consulta posterior puede reintentar recuperar la proyección sin volver a solicitar autorización humana.
- `waived_reason` contiene el texto autorizado original. El recorte de espacios solo se usa para **validar que no esté vacío**; no reescribe el motivo autorizado.
- La ruta `closed` conserva la proyección preexistente: no extender unilateralmente el modelo de cobertura o saltar requisitos.

## 3. Nuevas regresiones (sin resultados aún)

`packages/mcp/src/__tests__/canonical-coverage.test.ts`:

- **Crash Scenario 2**: una renuncia durable guardada antes del recibo/archivo debe reconciliar estado, motivo, recibo SQLite e historial de transición; segunda reconciliación devuelve `false`.
- **Crash Scenario 3**: tras waiver aprobado, la ruta idempotente conserva estado/motivo; se elimina artificialmente **solo** `waived_reason` del lifecycle temporal para simular el defecto R4-I01. `reconcile` debe restaurarlo desde SQLite, sin modificar historial ni duplicar relaciones; siguiente llamada no debe escribir nada.

`packages/mcp/src/__tests__/discovery-handler.test.ts`:

- El E2E real R4-I01 ahora exige `modules.catalog.waived_reason` **igual al motivo aprobado** y una transición registrada a `catalog:waived` antes de intentar cerrar la sesión.
- Se mantienen las aserciones de `qap_session_close: success`, reporte físico, `qap_status: WRAP_UP`, requisito persistente, ausencia de `rules.yaml` falso y visitas HTTP exactas. **Siguen pendientes de ejecución**; el arreglo puede revelar otros defectos después de la compuerta.

## 4. Validación requerida a Codex (en el mismo chat de auditoría)

Checkout `C:\Users\Judirico\Documents\QAMCP\QAMCP`. Rama `feat/qap-vnext-architecture`. Reglas: verificar SHA y fast-forward seguro, no inspeccionar/modificar/restaurar `packages/playwright-runner/.qa/cache/sessions/admin-user.json`, no editar código/tests/documentos, no commit ni push.

Ejecutar con artefactos/retornos verídicos:

```powershell
git status --short
git branch --show-current
git rev-parse HEAD
git fetch origin feat/qap-vnext-architecture
# Confirmar que la actualización fast-forward no afecte la sesión local.
pnpm build
pnpm --filter @qap/mcp exec vitest run src/__tests__/discovery-handler.test.ts -t 'R4: real crawler' --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-coverage.test.ts --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/mcp exec vitest run src/__tests__/discovery-handler.test.ts --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/mcp exec eslint src/handlers/canonical-closure-service.ts src/__tests__/canonical-coverage.test.ts src/__tests__/discovery-handler.test.ts
pnpm --filter @qap/mcp exec vitest run --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/playwright-runner exec vitest run --maxWorkers=1
```

Opcional repetir `pnpm lint` y Stdio cuando la compuerta focal pase; los resultados globales anteriores **no certifican** el nuevo HEAD.

Registrar SHA, título de cada falla, primera aserción nueva, respuesta MCP, estado antes/después de reconcile, metadata `waived_reason`, recibos y ausencia de duplicación. Mantener datos de prueba en rutas desechables y logs fuera de los archivos de sesión protegidos. No ajustar aserciones ni fixtures para obtener éxito artificial.

## 5. Límites

Esta corrección ataca el único defecto funcional revelado por R4-I01. **No declara resueltos** los 55 tests históricos ni los cinco lifecycle-v3-e2e, que aún necesitan reconciliación individual de contrato/garantía. Tampoco prueba la ruta `closed` con cobertura genuina completa. R4-I01 utiliza gateway *sintético* en test; no certifica una UI real ni autorizaciones humanas de producción.

VNEXT-014 continúa **NO-GO hasta el resultado independiente del nuevo HEAD** y las compuertas restantes. VNEXT-015 no debe iniciarse anticipadamente.
