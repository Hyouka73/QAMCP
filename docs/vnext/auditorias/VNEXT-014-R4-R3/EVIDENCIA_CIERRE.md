# Evidencia de integración y seguridad R4-R3

Los siete escenarios de la suite focal ejercitan el servicio con SQLite y archivos físicos, además de un servidor MCP conectado por el SDK. Cada escenario exige `reconcile() === false`, `status() = working / ready_for_closure:false`, `execute() = blocked / invalid_durable_closure` y `qap_session_close = blocked / canonical_module_closure_required` en WORKING. También compara lifecycle byte a byte, el snapshot durable y las relaciones, y verifica ausencia de ruta y archivo de reporte.

| Fixture | Motivo del bloqueo |
|---|---|
| Waiver con motivo corto | Menos de 15 caracteres tras trim |
| Waiver con motivo en blanco | Longitud 0 tras trim |
| Waiver sin aprobación | No hay asiento con ese ID |
| Waiver con digest distinto | El único asiento tiene otro digest |
| Waiver con aprobación duplicada | El ID tiene dos asientos |
| Closed sin aprobación | La correlación también se exige para closed |
| Lifecycle ya waived, sin aprobación | El estado proyectado no sustituye la decisión durable autorizada |

El bloqueo público es deliberadamente común para estos casos. La primera causa específica se determina a partir del fixture y del orden de validación en `canonical-closure-service.ts:69`. La decisión se toma antes de emitir un recibo en `reconcile` y también se aplica al estado canónico y al retorno idempotente. Los positivos R4-R2-A01, Crash 2 y Crash 3 pasaron en la suite completa.

## R4-R3-A01 · P2 · qap_status recomienda un cierre bloqueado

La sonda externa llama primero a `qap_status` y después a `qap_session_close` para los siete fixtures explícitos. En todos, `canonical_modules[catalog].closure` devolvió `working / ready_for_closure:false` y el cierre devolvió `blocked / canonical_module_closure_required`. Se midieron cero recibos, cero llamadas al gateway, cero reportes y lifecycle y snapshot durable intactos.

En el fixture terminal, la misma respuesta de `qap_status` incluye `estados_modulos.catalog = waived` y recomienda `siguiente_accion.tool = qap_session_close`, afirmando que todos los módulos están cerrados o renunciados. El estado canónico se conserva correctamente y la compuerta de cierre impide el cambio de fase. El falso positivo está en la acción recomendada de la respuesta pública.

Primera causa: `StatusHandler.execute` combina el inventario canónico con el resultado de `inspectLegacyState` sin conciliar el cierre canónico al construir guidance. `status.handler.ts:245` y `:256` usan el estado del archivo para los campos legacy y `:344` pasa ese mapa a `getPhaseGuidance`. `guidance.ts:650` afirma que todos los módulos están resueltos. Esas rutas de status y guidance son iguales al baseline por diff. El caso de guidance se ejecutó sobre R4-R3.


Extracto de la sonda MCP terminal.

```json
{
  "fase": "WORKING",
  "estados_modulos": {
    "catalog": "waived"
  },
  "cierre_canonico": {
    "state": "working",
    "ready_for_closure": false
  },
  "siguiente_accion": {
    "tool": "qap_session_close",
    "descripcion": "Todos los módulos planificados en la sesión actual están cerrados o renunciados. Se requiere decisión del usuario sobre el cierre de la sesión (qap_session_close)."
  },
  "qap_session_close": {
    "status": "blocked",
    "code": "canonical_module_closure_required",
    "fase": "WORKING"
  },
  "recibos": 0,
  "gateway_calls": 0,
  "lifecycle_intacto": true,
  "reporte_existe": false
}
```

## Reproducción

Compilar con el entorno de [COMANDOS.md](COMANDOS.md) y ejecutar el filtro focal de Vitest. Los siete fixtures están en la suite 5 de `canonical-coverage.test.ts`. Para reproducir el falso positivo con el SDK, partir del fixture con lifecycle ya `waived` y aprobación durable ausente. Enlazar un cliente MCP al servidor del fixture mediante `InMemoryTransport`. Llamar a `qap_status` con el `targetPath` absoluto de la raíz autorizada y comprobar tanto `canonical_modules` como `siguiente_accion`. Llamar después a `qap_session_close` sobre la misma raíz y comprobar la fase, el archivo de reporte, los recibos y la igualdad de los snapshots. La escritura de datos inconsistentes se realizó mediante el almacén interno de fixtures. La sonda no demuestra una vía pública para producirlos.

## Extractos de ejecución



**r4-r3.out**

```text
      Tests  7 passed | 26 skipped (33)
```

**coverage.out**

```text
      Tests  33 passed (33)
```

**discovery.err**

```text
 FAIL  src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > propagates in-flight dispatcher cancellation to transport and waits for cleanup
Error: Test timed out in 30000ms.
```

**discovery-retry.out**

```text
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > propagates in-flight dispatcher cancellation to transport and waits for cleanup 3763ms
      Tests  59 passed (59)
```

**mcp.out**

```text
 Test Files  7 failed | 15 passed (23)
      Tests  55 failed | 343 passed (456)
     Errors  1 error
```

**mcp.err**

```text
Error: [vitest-pool]: Worker forks emitted error.
Caused by: Error: Worker exited unexpectedly
```

**mcp-retry.out**

```text
 Test Files  7 failed | 16 passed (23)
      Tests  55 failed | 401 passed (456)
```

**runner.out**

```text
      Tests  71 passed (71)
```

**stdio.out**

```text
SERVIDOR MCP FUNCIONANDO AL 100% SOBRE STDIO
```

**lint-focus.out**

```text
  754:15  error  There is no `cause` attached to the symptom error being thrown  preserve-caught-error
```

**lint-global.out**

```text
✖ 63 problems (35 errors, 28 warnings)
```
