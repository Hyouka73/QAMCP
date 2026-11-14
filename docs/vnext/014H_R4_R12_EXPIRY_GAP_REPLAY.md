# VNEXT-014-D-R4-R12 — Vigencia física de aprobación y replay exacto de brechas

Fecha: 2026-11-05. Rama exclusiva `feat/qap-vnext-architecture`. Código inmediatamente anterior: `e3a95d408882e222e0211a43c1a6cea80fa49306` (documentación independiente R4-R11). Código R4-R11 auditado físicamente: `4bb22547349a407b1eeb2383e6981af5dd1db07a`.

**Estado comprobado: auditoría R4-R12 publicada para 7ccf3db1a6f259f6a5c51521518bbb399a13fda2. A06 verificado con límites; A04 directo PASS,P2W01 cola sin ALS pendiente. VNEXT-014 NO-GO; VNEXT-015 no iniciado.**

## Baseline independiente demostrado por Codex (R4-R11)

- Build diez paquetes PASS; cobertura 51/51; entrevista 44/44; Discovery 59/59; runner 71/71; MCP **413 PASS/63 FAIL de 476**, comparado por identidad. Los 63 restantes son 55 históricos y ocho pruebas que requieren trasladar sus fixtures Memory sin fence a SQLite física; Scenario4 ya pasó.
- Windows A01: 64 intercalados y junction probado; escritores oficiales comparten exclusión de lifecycle. Raw FS y filesystems alternos no certificados.
- A03: terminal concurrente autorizado recupera idempotencia; escenarios multiproceso y seis kills/recovery PASS, con límites de dos SQLite + FS.
- Bloqueos A04 (expiresAt antes de commit físico) y A06 (replay idéntico accept_gaps) reproducidos.
- ESLint global 34 errores/28 advertencias históricos, sin altas R11.

[Informe R4-R11](auditorias/VNEXT-014-R4-R11/INFORME.md) · [Evidencia](auditorias/VNEXT-014-R4-R11/EVIDENCIA_CONCURRENCIA.md) · [Siguiente bloque previo](auditorias/VNEXT-014-R4-R11/SIGUIENTE_BLOQUE_P0.md).

## Implementación declarada R4-R12 (límites independientes abajo)

### A04: decidir consumo al COMMIT físico SQLite

Se adopta política explícita **de vigencia en el COMMIT durable**. Para las cuatro acciones, `CanonicalClosureService.persistWithKnowledgeFence` pasa `expiresAt` al contexto asíncrono privilegiado `withClosureCommitDeadline` de `module-closure-store.ts`.

El adapter `SqliteModuleClosureStore.transaction` comprueba el plazo:
1. Tras la operación callback y su último `await`, antes de cifrar/escribir generación.
2. Justo antes de ejecutar `db.exec('COMMIT')`, sin `await` intermedio.

Si expiró, lanza `ClosureStoreError('authorization_expired')` y hace ROLLBACK físico. El servicio devuelve `blocked/closure_review_expired`. El contexto `AsyncLocalStorage` permite que los decoradores de `transaction` existentes sigan transmitiendo el plazo sin expandir la firma del puerto ni debilitar fixtures; el límite solo aplica a operaciones alcanzadas desde el flujo privilegiado, no a migraciones/fixtures ajenas de ClosureStore. No se afirma garantía de reloj de tiempo real frente a suspensión del SO después del último chequeo síncrono.

### A06: replay de brecha idéntica y recibo existente

`CanonicalCoverageService.evaluate` añade la opción **solo de proyección** `excludeStoredAcceptedGapIds` para reconstruir el digest de cobertura base anterior a la aceptación. No muta Knowledge ni ClosureStore.

Ante un comando `accept_gaps` sobre IDs ya aceptados, el servicio permite **solo replay exacto**:
- mismos IDs, orden y razones; todos deben estar aceptados y compartir un receipt existente;
- ese receipt aparece una sola vez en approvals, no está asociado a otros gaps/módulos ni cierres;
- la cobertura base reconstruida sigue siendo compatible con el snapshot de requisitos/binding/aplicabilidad revisado;
- el digest original recalculado coincide exactamente con la aprobación durable;
- el estado actual conserva brechas/recibo y el snapshot cifrado no cambió durante la lectura.

La comprobación se realiza bajo bloqueos lifecycle y Knowledge. Si todo coincide devuelve `status:gaps_accepted, idempotent:true`, receipt previo y assessment actual, **sin solicitar nueva aprobación ni escribir nueva autoridad**. Cambios de razón, IDs nuevos, digest alterado o requisitos/contexto distintos bloquean. El puerto del gateway sigue siendo necesario para entrar a las acciones del servicio, pero el replay no lo invoca.

## Pruebas añadidas (declaración previa; ambas ejecutadas PASS abajo)

Dos nuevas identidades en Suite 3 de `canonical-coverage.test.ts`:
- `R4-R12-A04`: decoración de transacción real, pausa hasta después del vencimiento *tras callback*, las cuatro acciones deben bloquear y devolver snapshot/historial/lifecycle sin alteraciones.
- `R4-R12-A06`: aceptación positiva de brecha real; segunda llamada idéntica recupera receipt sin gateway/commit adicional; motivo distinto y digest de aprobación corrupto bloquean.

R4-R11 tenía 476 pruebas MCP, por lo que se esperan 478 identidades si ninguna fue eliminada; **esta declaración previa no afirmaba PASS; resultado independiente abajo**. Las 63 fallas preexistentes siguen sin resolver. Las dos bases SQLite y FS no son transacción ACID conjunta.

## QA independiente y continuación

El auditor Codex debe verificar SHA remoto exacto y ejecutar build10, Coverage53, Interview44, Discovery59, Runner71, MCP478, Stdio18+init y ESLint; comparar identidades por nombre con R11: 413 PASS/63 FAIL/476. Reproducir expiresAt+40ms **después del callback** en las cuatro ramas; confirmar ROLLBACK real y ausencia de historia/recibo/lifecycle, además de pausa cerca de COMMIT y dos procesos. Probar A06: replay idéntico de gap real, dos gaps, order/reason drift, nueva revisión de requisito, cambio de binding, ID reutilizado, receipt duplicado, provenance alterada, pérdida de respuesta y cierre histórico. No suprimir ocho tests Memory, no cambiar expectativas de los 55 históricos, no sembrar aprobación humana.

Publicar seis informes exclusivamente documentales en `docs/vnext/auditorias/VNEXT-014-R4-R12/`, actualizar STATE/backlog/nota y hacer commit/push a esta rama. Si no hay GO, proponer el siguiente bloqueo reproducible. Después de atenderlo, continuar recorrido físico integral de VNEXT-014. No iniciar VNEXT-015.


## Resultado independiente R4-R12 (2026-11-05)

- **SHA exacto auditado:** 7ccf3db1a6f259f6a5c51521518bbb399a13fda2; worktree aislado detached, sin fuentes posteriores. Publicación exclusivamente documental en feat/qap-vnext-architecture.
- **Matriz física:** instalación congelada, FTS5 y build10 PASS; focales R12 2/2, R11 1/1, R10 5/5, R9 5/5, R8 3/3; Coverage53/53, Interview44/44, Discovery59/59, Runner71/71, Stdio servidor/CLI18+init PASS. MCP **415 PASS/63 FAIL de478**: 413 PASS y63 FAIL conservados por identidad, dos altas PASS, cero bajas/regresiones nominales. Scenario4 intacto PASS.
- **Lint:** 34 errores/28 advertencias;62 diagnósticos idénticos tras mapear diff, siete aserciones desplazadas. Foco ampliado a siete archivos:7 errores históricos/0 advertencias, sin altas reales.
- **A04: PASS acotado; P2 residual W01.** 24 negativos (4acciones×6posiciones), incluido después del INSERT físico, conservan snapshot/historial/recibos/lifecycle. Wrappers await/setImmediate conservan ALS. Cola con timer preexistente pierde ALS y las cuatro acciones persisten vencidas; accept_gaps luego reproduce ese receipt. Control con AsyncLocalStorage.snapshot bloquea4/4. No se demostró ese bypass en composición oficial directa; falta contrato de propagación verificable del puerto.
- **A06: replay exacto verificado con autoridad original válidamente consumida.** Una/dos brechas reales, misma razón/orden/receipt y digest base reconstruido; sin segundo gateway/historia/recibo. Cambios de selección/orden/razón/requisito/revisión/sesión/módulo/binding o autoridad bloquean sin writes. Dos procesos y kill tras commit recuperan replay sin nueva autoridad. Carrera de primera aceptación: uno gana, otro context_changed y retry idempotente.
- **Compatibilidad:** A01/A03,64 intercalados oficiales,40 fingerprint,junction,locks,terminales concurrentes/recibos falsificados,seis kills close/waive y cierres históricos R9 vuelven a pasar con límites. SQLite cwd y exclusión conexión/proceso PASS; rename/unlink EBUSY no certifica sustitución ni otros SO.
- **VNEXT-014 NO-GO; VNEXT-015 no iniciado.**55 históricos+ocho fixtures Memory sin fence conservados; falta integrado auténtico A closed+B waived+reporte+WRAP_UP+replanificación. No ACID común Closure+Knowledge+FS ni aprobación humana certificada con gateways de fixture.

El párrafo ALS de implementación solo está demostrado para wrappers que preservan contexto; cola preexistente no lo conserva automáticamente. No se atribuye ese scheduler a producción directa. D01 menor: vencimiento al entrar al callback devuelve consistency_conflict sin persistir, no siempre review_expired. Guards físicos/rollback directo sí comprobados. A06 no sustituye la vigencia del consumo original.

[Informe y correcciones](auditorias/VNEXT-014-R4-R12/INFORME.md) · [Reproducciones](auditorias/VNEXT-014-R4-R12/EVIDENCIA_CONCURRENCIA.md) · [Siguiente bloque](auditorias/VNEXT-014-R4-R12/SIGUIENTE_BLOQUE_P0.md).
