# VNEXT-014-CONVERGENCIA — Informe de intervención

**Fecha:** 2026-11-05 (America/Mexico_City). **Rama:** `feat/qap-vnext-architecture`. **HEAD remoto al iniciar:** `541c925a6c1194bc2c85ab5a42b2b54e66f4d82c` (coincide con el esperado). **Entorno:** Windows, Node v24.15.0, pnpm; clon aislado en worktree limpio (no se tocaron archivos personales, `admin-user.json`, bases ni credenciales).

No se modificó `main`, `develop` ni `staging`; sin merges, sin force-push, sin publicación npm. No se implementó VNEXT-015.

## Commits de código

| SHA | Contenido |
| --- | --- |
| `3434e45` | **C01**: bloqueo MCP específico + prueba de dos procesos + eliminación de 3 errores lint + drenaje de promesas pendientes en dos pruebas |
| `299ad61` | **E01 (presupuesto)**: deadline del test durable = suma de los presupuestos de sus 6 procesos hijos |
| `ca9b7ea` | **E01 (causa de EPERM verificada)**: `ReplaceGate` en `FileSystemStorage` + prueba de regresión |

El SHA del commit documental final se registra en `PUBLICACION.md` de este directorio.

## Fase 1 — C01 (resuelto)

**Ruta exacta del RPC -32603.** `storage.commitLifecycleStateWithFence(...)` se devolvía sin `await` dentro del `try` del handler. El rechazo de `SqliteKnowledgeAdapter.withWriteFence` (`KnowledgeStoreError('CONFLICT')`, producido al fallar `BEGIN IMMEDIATE` por busy_timeout) escapaba del `catch` local/externo y el SDK lo convertía en `McpError -32603: Knowledge store: CONFLICT`. Se reprodujo con el control negativo (código anterior): el nuevo test falla con exactamente ese error.

**Corrección** (`packages/mcp/src/server.ts`):
1. `return await storage.commitLifecycleStateWithFence(...)` (el rechazo se maneja en el ámbito del handler).
2. La llamada a `closureService.withSessionReportFence` se envuelve con un indicador `fenceEntered`. Solo un `KnowledgeStoreError` con `code === 'CONFLICT'` lanzado **antes de entrar** al fence (fallo de adquisición) produce `status: blocked`, `code: knowledge_write_fence_unavailable`, `fase: WORKING`, `desbloquear_con: qap_session_close`.
3. Cualquier otro error (UNAVAILABLE, errores genéricos, y un CONFLICT lanzado **dentro** de `finalize()`) se re-lanza sin convertirlo en bloqueo normal.

Invariantes conservadas: orden de locks lifecycle → Knowledge; el lock lifecycle se libera solo al terminar `withLock` (no se tocó); la transición a WRAP_UP y las compuertas no cambian; no se crean aprobaciones ni recibos; el bloqueo ocurre antes de publicar reporte y de `commit()`.

**Pruebas nuevas** (`canonical-coverage.test.ts`, describe `VNEXT-014-C01 Knowledge fence contention`):
- Proceso hijo oficial (`SqliteKnowledgeAdapter.withWriteFence` real sobre el mismo `canonical.sqlite`) + `FileSystemStorage` real: `qap_session_close` devuelve `blocked/knowledge_write_fence_unavailable`; `lifecycle.json` idéntico byte a byte y en `WORKING`; sin reporte; Closure y recibos Knowledge sin cambios; al liberar el hijo, reintento con el **mismo** gateway que lanza si se pide una segunda aprobación → `success/WRAP_UP`, reporte publicado, recibos y snapshot de Closure iguales.
- Negativos: fallo de adquisición `UNAVAILABLE` y `CONFLICT` lanzado dentro del fence **no** producen el código de bloqueo ni éxito; lifecycle intacto, sin reporte.
- Convención: los resultados `blocked` del servidor usan `isError: true` (igual que `session_context_changed`).

## Fase 2 — Lint (cero infracciones nuevas)

Se eliminaron los tres `!` innecesarios (`current.session!`, `current.session!`, `closures.catalog!`) en `canonical-coverage.test.ts`. Sin `eslint-disable` ni cambios de configuración. Comparación por identidad (archivo|regla|severidad) del ESLint global del HEAD `541c925` contra el HEAD final: **34 errores / 28 advertencias**, cero identidades nuevas. Esto iguala el baseline histórico; **no es lint global PASS** (la deuda de 34/28 se conserva y se declara).

## Fase 3 — E01

Se separaron causas independientes:

| # | Causa | Evidencia | Acción |
| --- | --- | --- | --- |
| 1 | **EPERM en `renameSync` de Windows** | Micro-experimento (`rename` sobre el mismo destino 3000 veces): sin lectores 3000 OK / 0 EPERM; con 3 lectores `fs.promises.readFile` concurrentes **0 OK / 3000 EPERM**. Reproducido además a través de `FileSystemStorage.write` y `updateLifecycleState` (2/2 tests fallan con `EPERM: rename ... lifecycle.json.<tmp> -> lifecycle.json` sin la corrección). Las lecturas de `FileSystemStorage` no toman el lock, así que un lector del mismo proceso puede hacer perder al escritor. | `ReplaceGate`: los escritores oficiales (`write`, `updateLifecycleState`, `updateModuleRules`) esperan a que drenen los lectores del mismo proceso y retienen a los nuevos durante el reemplazo síncrono. No es un reintento: ninguna operación se repite. Ambos tests pasan con la corrección. |
| 2 | Rechazos tardíos de `pendingSave`/`pendingWriter` | Los EPERM de la corrida paralela aparecían como errores no manejados | `trackPending`: handler adjunto en el mismo tick; resuelve a `undefined` o al motivo; el fallo se afirma en el test. |
| 3–4 | Handles/cleanup con operaciones pendientes | `afterEach` borraba el temporal con escrituras en vuelo | `trackPending` registra el drenaje en `closers`, que se ejecuta **antes** de borrar los roots. |
| 5 | Presupuesto de procesos hijos | 6 × `spawnSync` de 30 s dentro de un test de 30 s | Deadline = `6 × 30 s + 15 s`; presupuestos individuales sin cambios. |
| 6 | Pruebas sensibles a carga | En paralelo fallan por timeout de 5 000 ms de vitest (duración ≈ 5.0 s): escenarios de `test-handler.test.ts` (1, 4, 5, 7, 11) y `p4-2` Criterio 4.3; todos pasan en serie | **No corregido**: no se subió ningún timeout. Registrado como riesgo abierto. |

**Límites documentados (no resueltos):** (a) lectores en **otros procesos** pueden seguir provocando EPERM; (b) `commit()` síncrono de `commitLifecycleStateWithFence` no puede esperar lectores asíncronos y queda fuera del gate; (c) no se identificó causa de los timeouts de carga (categoría 6).

Resultados MCP (identidad comparada contra las 63 identidades históricas):

| Corrida | PASS | FAIL | Extras fuera de las 63 |
| --- | ---: | ---: | --- |
| Serial 1 (tras C01/lint) | 434 | 63 | 0 |
| Serial 2 (tras gate E01) | 434 | 63 | 0 |
| Paralelo A (antes del gate, temporal propio) | 427 | 70 | 7 (2 EPERM, 5 timeouts de carga) |
| Paralelo B (antes del gate, temporal propio) | 429 | 68 | 5 (1 EPERM, 4 timeouts) |
| Paralelo C (tras gate, temporal propio) | 430 | 67 | 4 (solo timeouts, 0 EPERM) |
| Paralelo D (tras gate, temporal propio) | 431 | 66 | 3 (solo timeouts, 0 EPERM) |

Total 497 = 495 anteriores + 2 pruebas C01. Ninguna de las 63 identidades pasó a PASS ni cambió de nombre; ninguna prueba serial nueva falla. **E01 no se declara solucionado**: el EPERM verificado desaparece en las dos corridas posteriores, pero la inestabilidad por timeout de carga persiste (3–4 fallos extra por corrida).

## Otras suites

Engine 168/168, Knowledge 260/260 (258 + 2 nuevas), Runner 71/71, CLI 78/78, `pnpm run build` 10 paquetes OK. Interview/Discovery incluidos en MCP serial (sin fallos fuera de las 63).

No ejecutado/no disponible en esta intervención: lectura SQLite física independiente por Codex, stdio original con host real, revisión humana auténtica.

## Fase 4 — Salida finita de VNEXT-014

### 014-A — implementación funcional original
`qap_plan` → planificador DAG y `qap_test` → PlaywrightRunner: `plan-handler.test.ts` y `test-handler.test.ts` pasan íntegramente en MCP serial (ninguna de las 63 identidades pertenece a esos archivos); Runner 71/71; Engine/Knowledge verdes. **014-A: cumple en ejecución serial.** Reservas: cinco escenarios de `test-handler` fallan por timeout de 5 s solo bajo paralelismo.

### 014-B — integridad
C01 corregido con prueba multiproceso y control negativo; A01 (4 escenarios: planned, planned-process, session, phase) y A02 (4 tampers, incluido multiproceso) siguen pasando en serie; sin nuevos P0/P1. EPERM de lifecycle corregido en el camino de escritura del mismo proceso.

### 014-C — certificación integral (pendiente, sin PASS por decisión unilateral)
- 63 identidades MCP históricas sin equivalencia aceptada.
- Revisión humana auténtica no ejecutada.
- E01: inestabilidad de carga abierta; límites (a)(b)(c).
- Lint histórico 34/28.
- Requisitos adicionales del WBS (flujo integrado autenticado) no demostrados.

**Propuesta (no aplicada) de alcance formal:** tratar 014-A + 014-B como criterio de cierre técnico de VNEXT-014 y mover los puntos de 014-C a una tarea de certificación explícita (p. ej. `VNEXT-014-CERT`) con responsable y fecha 16/11. Consecuencia: VNEXT-014 se podría marcar completado funcionalmente sin heredar la reconciliación de 63 pruebas, pero **no habilita merge a develop** hasta cerrar 014-C. No se reescribe ningún criterio aprobado; requiere aprobación de los responsables.

## Fase 5 — Entrada a VNEXT-015

Ver `PREPARACION_VNEXT-015.md` y `PROMPT_VNEXT-015.md` en este directorio. Base: `541c925a6c1194bc2c85ab5a42b2b54e66f4d82c` (HEAD auditado; Engine 168/168 y Knowledge 258/258 verificados allí por Codex; los cambios de esta intervención no son prerrequisito de 015). Rama propuesta: `feat/vnext-015-impact-analyzer`.

## Riesgos pendientes

1. Timeouts de 5 s por carga en `test-handler`, `p4-2` (paralelo).
2. EPERM por lectores de otros procesos y por `commit()` síncrono (Windows).
3. 63 identidades históricas y revisión humana auténtica.
4. A04-W01 (wrappers que pierden AsyncLocalStorage) sigue como riesgo P2 sin cambios.
5. Los resultados de esta intervención son de **un** entorno Windows; no sustituyen la auditoría independiente.

## Veredictos independientes

1. **Integridad de las reparaciones: GO (condicionado a auditoría independiente).** C01, A01, A02 verificados con pruebas físicas multiproceso en serie; sin nuevos P0/P1; lint sin infracciones nuevas. Condición: Codex debe repetir el negativo C01.
2. **Comenzar VNEXT-015 en aislamiento: GO técnico** (rama separada desde `541c925`, sin dependencia de handlers de 014; no autoriza merge).
3. **Certificar VNEXT-014 / integrar la rama a develop: NO-GO** (014-C pendiente: 63 identidades, revisión humana, E01 por carga, lint histórico, requisitos WBS).
