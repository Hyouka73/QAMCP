# QAMCP VNEXT-014 · Auditoría independiente R4-R3

**Dictamen NO-GO.** Las cuatro rutas solicitadas bloquean los siete registros inconsistentes y preservan el estado persistido. La recomendación de cierre de `qap_status` presenta un falso positivo para el caso terminal. Las compuertas integrales de MCP y lint siguen abiertas.

Se verificó `Hyouka73/QAMCP`, rama `feat/qap-vnext-architecture`, HEAD `7e0142a97c67fa1c65c46a83e2a5f003b0b435cd`, descendiente del baseline `4ed8511f2ee88e63ff2da21a5a6f45dd6786f7f9`. Se reutilizó el worktree aislado existente en modo detached. Node 24.15.0, SQLite 3.51.3 con creación y consulta FTS5 verificadas, pnpm 11.3.0 y Chromium 153.0.8010.12. Se leyó la nota R4-R3 antes de instalar con lockfile congelado y compilar. Se verificó que `admin-user.json` conservó sus bytes en los dos checkouts. El worktree de auditoría quedó limpio. Los fixtures y los logs originales quedaron fuera del repositorio. Esta publicación documenta la ejecución física ya realizada sobre el SHA auditado.

| Compuerta | R4-R2 | R4-R3 medido |
|---|---:|---:|
| Build | 10 paquetes PASS | 10 paquetes PASS |
| Focal R4-R3 | — | 7/7 PASS |
| Canonical Coverage | 26/26 PASS | 33/33 PASS |
| Discovery | 59/59 PASS | 58 PASS / 1 timeout inicial, luego 59/59 PASS |
| MCP integral | 394 PASS / 55 FAIL de 449 | 401 PASS / 55 FAIL de 456 en el reintento |
| Playwright runner | 71/71 PASS | 71/71 PASS |
| Stdio | 18 herramientas y qap_init PASS | 18 herramientas y qap_init PASS |
| ESLint focal | 4 errores / 0 warnings | 1 error / 0 warnings |
| Lint global | 38 errores / 28 warnings | 35 errores / 28 warnings |

La primera ejecución integral registró 343 PASS, los mismos 55 FAIL y 58 casos sin resultado. Vitest informó que el worker de Discovery salió inesperadamente después del primer caso de esa suite. El log no expone la causa del proceso. La segunda ejecución completó los 456 casos. Los 394 PASS y los 55 FAIL del baseline conservaron su resultado por archivo y título completo. Los siete nuevos títulos pasaron. [Diferencial y tabla por suite](DIFERENCIAL_MCP.md)

## Verificación funcional

- Los siete registros fueron rechazados por las guardas correspondientes de motivo o correlación. `reconcile` no emitió recibos, `status` canónico informó `working`, `execute` devolvió `invalid_durable_closure` y `qap_session_close` devolvió `canonical_module_closure_required`. Los snapshots y el lifecycle se conservaron y no se escribieron reportes.
- R4-R2-A01 alcanzó WRAP_UP en la primera llamada. Crash Scenarios 2 y 3 pasaron con aprobaciones válidas.
- **R4-R3-A01, P2.** Con lifecycle terminal y sin aprobación, la respuesta pública de `qap_status` conserva el resultado canónico seguro, pero la recomendación afirma que todos los módulos están resueltos y ofrece cerrar. La primera causa es que `StatusHandler` construye esa recomendación desde el mapa legacy sin usar el estado canónico ya calculado. El cierre real bloquea. [Reproducción y causas](EVIDENCIA_CIERRE.md)
- **Discovery.** La primera ejecución de la suite agotó 30 s en la prueba de cancelación en vuelo, mientras esperaba que la ruta de dispatch devolviera el resultado con limpieza. El log no identifica la operación interna que quedó pendiente. La misma prueba pasó en 3763 ms en el reintento aislado y en 1496 ms en el reintento integral. El test y la ruta de adquisición no cambiaron en el diff. La causa subyacente del timeout y la posible relación con la salida del worker quedaron sin confirmar. [Extractos de ejecución](EVIDENCIA_CIERRE.md)

## Lint

Se eliminaron los cuatro diagnósticos de imports sin uso en `canonical-coverage.test.ts`. El comando focal salió 1 por `canonical-closure-service.ts:754:15`, regla `preserve-caught-error`. El `throw new Error('invalid_durable_closure')` dentro del `catch` omite la causa capturada. [Diagnósticos](LINT.md)

[Comandos, salidas e inventario de logs](COMANDOS.md) · [Documento principal](../../014D_R4_R3_VALIDACION_DURABLE_CIERRE.md)
