# Auditoría independiente VNEXT-014 R4-R12

2026-11-05, America/Mexico_City. Hyouka73/QAMCP. **NO-GO.**

- **SHA exacto auditado:** 7ccf3db1a6f259f6a5c51521518bbb399a13fda2; worktree aislado detached, sin fuentes posteriores. Publicación exclusivamente documental en feat/qap-vnext-architecture.
- **Matriz física:** instalación congelada, FTS5 y build10 PASS; focales R12 2/2, R11 1/1, R10 5/5, R9 5/5, R8 3/3; Coverage53/53, Interview44/44, Discovery59/59, Runner71/71, Stdio servidor/CLI18+init PASS. MCP **415 PASS/63 FAIL de478**: 413 PASS y63 FAIL conservados por identidad, dos altas PASS, cero bajas/regresiones nominales. Scenario4 intacto PASS.
- **Lint:** 34 errores/28 advertencias;62 diagnósticos idénticos tras mapear diff, siete aserciones desplazadas. Foco ampliado a siete archivos:7 errores históricos/0 advertencias, sin altas reales.
- **A04: PASS acotado; P2 residual W01.** 24 negativos (4acciones×6posiciones), incluido después del INSERT físico, conservan snapshot/historial/recibos/lifecycle. Wrappers await/setImmediate conservan ALS. Cola con timer preexistente pierde ALS y las cuatro acciones persisten vencidas; accept_gaps luego reproduce ese receipt. Control con AsyncLocalStorage.snapshot bloquea4/4. No se demostró ese bypass en composición oficial directa; falta contrato de propagación verificable del puerto.
- **A06: replay exacto verificado con autoridad original válidamente consumida.** Una/dos brechas reales, misma razón/orden/receipt y digest base reconstruido; sin segundo gateway/historia/recibo. Cambios de selección/orden/razón/requisito/revisión/sesión/módulo/binding o autoridad bloquean sin writes. Dos procesos y kill tras commit recuperan replay sin nueva autoridad. Carrera de primera aceptación: uno gana, otro context_changed y retry idempotente.
- **Compatibilidad:** A01/A03,64 intercalados oficiales,40 fingerprint,junction,locks,terminales concurrentes/recibos falsificados,seis kills close/waive y cierres históricos R9 vuelven a pasar con límites. SQLite cwd y exclusión conexión/proceso PASS; rename/unlink EBUSY no certifica sustitución ni otros SO.
- **VNEXT-014 NO-GO; VNEXT-015 no iniciado.**55 históricos+ocho fixtures Memory sin fence conservados; falta integrado auténtico A closed+B waived+reporte+WRAP_UP+replanificación. No ACID común Closure+Knowledge+FS ni aprobación humana certificada con gateways de fixture.

## Matriz

| Verificación | Resultado físico |
| --- | --- |
| Entorno | Windows x64, Node24.15.0, pnpm12.3.4, SQLite3.51.3 |
| Instalación congelada / FTS5 CREATE+INSERT+MATCH | PASS / PASS |
| Build |10/10 PASS |
| R12/R11/R10/R9/R8 |2/2,1/1,5/5,5/5,3/3 PASS |
| Coverage / Interview / Discovery / Runner |53/53,44/44,59/59,71/71 PASS |
| MCP integral |415 PASS/63 FAIL de478;15 suites PASS/8 FAIL |
| Stdio servidor y CLI |18 herramientas exactas+qap_init success+ONBOARDING |
| ESLint global / foco7archivos |34 errores/28 advertencias;7 errores/0 advertencias |

Los skipped focales corresponden al selector de nombre; la integral ejecutó478 identidades. Scenario4 y expectativas históricas sin cambios. Diez paquetes imprimen build:Done y el lockfile no cambió. [Identidades completas](DIFERENCIAL_MCP.md).

## A04: expiración física y defecto residual

El servicio entra a withClosureCommitDeadline bajo lifecycle+Knowledge. ClosureStore lee el deadline tras callback y lo verifica de nuevo tras cifrado/INSERT, antes de COMMIT, sin await intermedio. Demorar hasta expiresAt+40ms después del callback ahora revierte4/4. En after-insert se ejecutó stmt.run real de INSERT INTO closure_history y se demoró antes de volver al guard final: ROLLBACK físico, snapshot e historial cifrado exactos anteriores en readback independiente, cero recibos, lifecycle intacto. No es solo comprobar un objeto rechazado.

Fuentes fijadas: [contexto ambiental](https://github.com/Hyouka73/QAMCP/blob/7ccf3db1a6f259f6a5c51521518bbb399a13fda2/packages/mcp/src/handlers/module-closure-store.ts#L48), [guards físicos](https://github.com/Hyouka73/QAMCP/blob/7ccf3db1a6f259f6a5c51521518bbb399a13fda2/packages/mcp/src/handlers/module-closure-store.ts#L228), [propagación desde el servicio](https://github.com/Hyouka73/QAMCP/blob/7ccf3db1a6f259f6a5c51521518bbb399a13fda2/packages/mcp/src/handlers/canonical-closure-service.ts#L777).

**R4-R12-A04-W01, P2, continuación de A04.** IModuleClosureStore.transaction solo lleva scope y callback; el plazo es ambiental por ALS. Un wrapper externo del puerto que despacha por setInterval creado antes de execute pierde ese contexto. Ejecuta callback real, espera expiresAt+40ms y retorna al adapter real, cuyo deadline undefined omite ambos guards. Las cuatro acciones confirman una aprobación vencida, leída desde otra conexión; accept_gaps luego devuelve idempotent:true para ese receipt. No se desactiva ALS, no se reemplaza el store ni se modifican validadores/expectativas. **No se observó ese scheduler en la composición oficial directa**, por lo que es garantía incompleta de wrappers/puerto, no nuevo bypass P1 demostrado de la ruta directa.

Control causal: la misma cola capturando AsyncLocalStorage.snapshot por entrada y aplicándolo al despacho bloquea4/4 con closure_review_expired y conserva todos los recursos. Solo se cambia el wrapper de la sonda externa. [Código íntegro y salidas](EVIDENCIA_CONCURRENCIA.md#scripts-íntegros).

**Corrección recomendada:** transportar deadline obligatorio en contexto explícito de transaction y exigir su propagación por wrappers/colas. Fallar cerrado si se agrega autoridad sin el contexto requerido. Si se conserva ALS, declarar/verificar capacidad del puerto y capturar snapshot/bind por trabajo al encolarlo; no afirmar soporte de decorators arbitrarios. Añadir centinela de cola preexistente junto al wrapper await, manteniendo checks tras callback/INSERT. Para probar históricamente vigencia del consumo, persistir metadatos correlacionados de expiresAt/instante de consumo; approvalId+digest por sí solos no permiten reconstruir esa vigencia tras un commit anómalo.

**R4-R12-A04-D01, P3, diagnóstico.** Vencer antes del callback lanza Error genérico del servicio, transformado por store en write_failed; el servicio devuelve closure_consistency_conflict en vez de closure_review_expired. Repro en entry y contención de proceso4/4, sin autoridad ni cambios. Usar error de expiración tipado en todos los puntos, conservando rollback. No es un bypass de escritura.

**Límite temporal:** se demuestra rechazo cuando Date.now alcanza el plazo antes del último chequeo síncrono. No es reloj monótono ni tiempo real ante cambios del reloj/suspensión del SO entre ese check y COMMIT/fsync. No hay atomicidad conjunta de dos SQLite y filesystem.

## A06: replay probado y condiciones

Brechas del evaluador, por ejemplo gap:catalog:functional:unknown_applicability, primera aceptación con gateway de fixture independiente de la propuesta y correlacionado con requestDigest/coverageDigest/razón/selección. No es consentimiento humano. acceptance_receipt está dentro del snapshot cifrado; accept_gaps no crea relation Knowledge adicional. Se comprueba una aprobación, una generación y ningún cierre, readback con otro store. Dos brechas conservan orden y comparten una aprobación/receipt.

Replay reconstruye base sin las aceptaciones seleccionadas, verifica digest original exacto/aprobación única/no reutilización entre módulos o cierres, receipt previo y snapshot estable. Razón/orden/selección distintos, aprobación duplicada/ausente/digest alterado, receipt ajeno, nuevo requisito/revisión o contexto bloquean sin writes adicionales. Una autoridad consumida legítimamente antes de expiresAt conserva valor histórico después: replay no pide otro consentimiento. Esto presupone consumo original válido; W01 demuestra por qué el mero par approvalId+digest no acredita su vigencia física.

Dos procesos replay: ambos mismo receipt,idempotent:true,gateway0. Dos primeras aceptaciones sincronizadas: uno gaps_accepted, otro blocked/closure_context_changed; una sola autorización consumida y el perdedor recupera al reintentar. Kill después del commit de aceptación antes de respuesta: una generación, una aceptación, tras stale11s recupera sin gateway. No se afirma éxito inmediato para ambos primeros consumidores.

## Integridad y alcance

Worktree reutilizado limpio C:/Users/Judirico/Documents/QAMCP/audit-r4-r10, detached en 7ccf3db1a6f259f6a5c51521518bbb399a13fda2; el nombre no determina la versión. AGENTS,STATE,backlog,014H y seis informes/evidencias R11 consultados directamente. Bundles externos extraen helpers del test de ese SHA, sin editar ni ejecutar sus expectativas como sustituto de la suite. Solo compatibilidad histórica usa servicio R9 09c9ce276c9c328026de4236dadf0a85d8e94d21, separado de R12.

Fuentes,tests,expectativas,esquemas,credenciales,sesiones protegidas y lockfile intactos; solo nueve Markdown publicados. Lockfile Git a9bd8de7f6ac38db1ad4ae6582c4539b351225c8; sesiónworktree429bbf6d57a1d798231b4204d52069b4077703de, principal28e1b8dbec7ccf194440cc4158ec6072c9b9ade4; solo hashes, no lectura de contenido. main/develop no modificados en esta entrega; sin merges ni force-push.

Cierres R9 conservan ciphertext/autoridad/recibos/lifecycle; throw tras callback revierte cuatro acciones y libera fences. Bit alterado del ciphertext GCM hace fallar read y propagar excepción corrupt: no se afirma respuesta blocked normalizada ni disponibilidad limpia ante corrupción. Seis kills terminales y uno de aceptación cubren ventanas concretas, no todos los fallos de energía/disco. Escritores raw FS, otros SO/volúmenes y sustitución física real de SQLite siguen fuera de lo certificado. No se fabricó autorización humana/requisito confirmado para certificar el integrado.

[Concurrencia](EVIDENCIA_CONCURRENCIA.md) · [Lint](LINT.md) · [Comandos](COMANDOS.md) · [Siguiente bloque](SIGUIENTE_BLOQUE_P0.md).
