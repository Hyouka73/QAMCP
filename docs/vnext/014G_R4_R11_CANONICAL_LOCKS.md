# VNEXT-014-D-R4-R11 — Lock oficial estable en Windows y recuperación de terminal concurrente

Fecha: 2026-11-05. Rama: `feat/qap-vnext-architecture`.
**Código previo auditado: `e7d3717d9311ed73736568b13ce99e131d617453`.**
**Auditoría documental R4-R10 publicada en `741b02561ca959a31f5b010a921923cbea4dbcac`.**
Estado de esta ronda: **auditoría física independiente R11 ejecutada y publicada; A01/A03 verificados con límites. A04/A06 e integrado pendientes. VNEXT-014 NO-GO.**

## Lo que Codex comprobó realmente en R4-R10

- Builds 10/10 PASS; pruebas R10 5/5, R9 5/5 y R8 3/3 PASS; Coverage 49/50; Interview 44/44; Discovery 59/59; Runner 71/71; MCP 411 PASS/64 FAIL de 475; ESLint global 34 errores/28 advertencias, sin altas frente a R9.
- P1 R4-R10-A01: raíz física Windows con distinta capitalización producía nombres de lock diferentes (hash textual de `targetPath`). Un segundo escritor oficial entraba entre callback y COMMIT y las cuatro acciones conservaban aprobación para contexto anterior.
- A02: ruta relativa/cwd SQLite reparados en los escenarios Windows comprobados; sustitución/unlink de archivo abierto no pudo probarse porque el SO devolvió EBUSY. No extrapolar a todos los SO.
- A05: aceptación de un gap existente con propuesta real y recibo de un gateway de prueba PASS. La prueba no certifica aprobación humana integrada.
- P2 A03: segundo waive local en competencia devuelve blocked/context_changed, aunque el reintento externo es idempotente.
- P2 A04: autorización caducada puede quedar persistida al retrasar ClosureStore después del callback y antes del COMMIT; requiere definición y comprobación final de deadline si esa es la política.
- P2 A06: repetir exactamente el gap ya aceptado bloquea; no duplica autorización pero no ofrece replay idempotente.
- Recorrido canónico A closed+B waived+reporte+WRAP_UP+replanificación sigue sin ejecutarse integralmente.

[Auditoría R4-R10](auditorias/VNEXT-014-R4-R10/INFORME.md) · [Evidencia](auditorias/VNEXT-014-R4-R10/EVIDENCIA_CONCURRENCIA.md) · [Prioridades](auditorias/VNEXT-014-R4-R10/SIGUIENTE_BLOQUE_P0.md).

## Cambios de R4-R11

1. **R4-R10-A01 P1 (implementación):** `FileSystemStorage.withLock` usa `realpathSync.native(targetPath)` y, exclusivamente en Windows, normaliza separadores y casing para calcular el hash de `lockfilePath`. En POSIX conserva casing. Esto da el mismo nombre de lock a aliases de capitalización para el mismo archivo físico, sin atar el nombre al inode mutable del lifecycle. La ruta original sigue usándose para la operación.
2. **R4-R10-A03 P2 (implementación parcial):** `commitFinalClosure`, tras respuesta `closure_context_changed` o `closure_consistency_conflict`, vuelve a leer el snapshot durable una vez liberados los fences. Solo devuelve estado terminal idempotente si `isAuthorizedDurableClosure` demuestra una aprobación exactamente correlacionada, e intenta reconciliar recibo y lifecycle sin solicitar otro gateway. Si no hay terminal autorizado, conserva el bloqueo original. No convierte un snapshot corrupto en éxito.
3. **Regresión Windows agregada:** prueba `R4-R11-A01` (omitida fuera de Windows) intercala `saveLifecycleState` desde ruta uppercase *después* de callback y *antes* de COMMIT en las cuatro acciones. El escritor oficial debe esperar al release y la transacción debe conservar una sola aprobación. Mantiene Scenario4 de concurrencia histórico, sin cambiarlo ni degradar expectativas.

## Límites y auditoría exigida al publicar la implementación (histórico)

- El hash canonicalizado es un contrato **de escritores que cooperan con FileSystemStorage**. No protege ediciones directas a los archivos, mounts NFS, todos los junctions ni hardlinks y no ofrece atomicidad entre Knowledge SQLite, Closure SQLite y filesystem.
- El casing se unifica conservadoramente en Windows; en directorios Windows configurados como case-sensitive podría serializar archivos distintos, pero no demuestra bypass. Es necesario verificar la semántica real del host (incluidos vínculos y aliases) con procesos físicos y sin regresiones.
- El cambio A03 depende de distinguir un terminal autorizado de un store dañado y de no duplicar relation recibo tras carrera; Codex debe repetir prueba de dos consumidores, crash recovery, idempotencia y procedencia de recibos. No afirmar A03 cerrado sin esos resultados.
- A04 expiración al COMMIT y A06 replay de gap permanecen **SIN IMPLEMENTAR**. A02 sigue condicionada. P0 recorrido integrado no iniciado.
- Ejecutar matriz: build10; pruebas R11, R10 5, R9 5 y R8 3; Coverage; Interview44; Discovery59; Runner71; MCP integral contra 475 identidades previas; stdio18+init; lint focal/global. Mantener los 55 fallos históricos, los ocho fixtures Memory sin fence y Scenario4 hasta evidencia de cambio.
- Documentar scripts reproducibles y resultados en `docs/vnext/auditorias/VNEXT-014-R4-R11/`, actualizar STATE/backlog/nota; commit y push solo documental. ChatGPT hace correcciones productivas; Codex solo auditoría independiente.


## Resultado independiente R4-R11 — auditoría publicada (2026-11-05)

- **Código exacto auditado:** 4bb22547349a407b1eeb2383e6981af5dd1db07a; worktree detached aislado, sin incorporar fuentes posteriores. Publicación exclusivamente documental a feat/qap-vnext-architecture; main y develop fuera de esta entrega.
- **Matriz:** instalación congelada y FTS5 reales PASS; build **10/10**; regresión R11 **1/1** (incluye cuatro acciones), R10 **5/5**, R9 **5/5**, R8 **3/3**; Coverage **51/51**, Interview **44/44**, Discovery **59/59**, Runner **71/71**; Stdio servidor/CLI **18 herramientas + qap_init + ONBOARDING**.
- **MCP: 413 PASS / 63 FAIL de 476.** Frente R10: 411 PASS conservados, 63 FAIL conservados, Scenario4 FAIL→PASS y una alta R11 PASS; cero bajas/regresiones nuevas. Los **55 históricos + ocho fixtures MemoryKnowledgeStore sin fence** siguen fallando por identidad exacta. Scenario4 y sus expectativas permanecen intactos.
- **ESLint:** global **34 errores / 28 advertencias**, focal ampliado **5 errores / 0 advertencias**; 62 diagnósticos idénticos a R10, cero altas/bajas. Sin supresiones ni configuración alteradas.
- **R4-R10-A01 P1: corrección comprobada en el alcance Windows ensayado.** Reproducción histórica e7d de las cuatro acciones recupera el bypass por casing; en R11 pasan 64 intercalados (cuatro acciones × session/plan/phase/state × entrada/después de callback × mismo/otro proceso). Un único lock, contexto intacto hasta commit y escritores recuperables. Junction de raíz, excepción y kill/recovery pasan. Solo escritores cooperantes de FileSystemStorage; raw FS posterior al callback sigue fuera del contrato.
- **R4-R10-A03 P2: corregido en escenarios auditados.** Waive+waive y close+waive, adapters/stores separados y procesos físicos, recuperan el terminal ganador autorizado sin segunda aprobación/recibo/historia. Dos módulos distintos cierran con dos autoridades independientes. Recibos alterados y aprobaciones ausentes/duplicadas/digest distinto bloquean sin writes adicionales.
- **A04 y A06 continúan abiertos.** Las cuatro acciones aún pueden persistir después de expiresAt al demorar tras el último callback. Repetir accept_gaps exacto sobre una brecha existente devuelve blocked/closure_gap_selection_invalid sin duplicar autoridad; no éxito idempotente.
- **Recuperación física:** seis kills (close/waive × antes de commit / después de Closure / después del recibo Knowledge); readback confirma rollback o estados parciales esperados. Retry tras stale recupera una aprobación, un recibo y una generación de historial; después de commit no pide otro gateway. No hay atomicidad entre las dos SQLite y filesystem.
- **Dictamen: VNEXT-014 NO-GO; VNEXT-015 no iniciado.** No se certifican POSIX/otros volúmenes ni identidad universal SQLite por realpath/dev/ino. Rename/unlink abiertos siguen EBUSY en Windows. A closed+B waived+reporte fiel+WRAP_UP+replanificación con revisión humana auténtica permanece pendiente; gateways y requisitos de fixtures no certifican ese integrado.

[Informe](auditorias/VNEXT-014-R4-R11/INFORME.md) · [Evidencia](auditorias/VNEXT-014-R4-R11/EVIDENCIA_CONCURRENCIA.md) · [Diferencial](auditorias/VNEXT-014-R4-R11/DIFERENCIAL_MCP.md) · [Siguiente bloque](auditorias/VNEXT-014-R4-R11/SIGUIENTE_BLOQUE_P0.md).
