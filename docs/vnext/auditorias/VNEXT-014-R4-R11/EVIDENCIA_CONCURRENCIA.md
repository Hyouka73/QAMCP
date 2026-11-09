# Evidencia física de concurrencia R4-R11

**Código auditado 4bb22547349a407b1eeb2383e6981af5dd1db07a.** Windows x64/Node24.15.0/SQLite3.51.3/FTS5. Todos los arneses externos operan sobre fixtures temporales nuevas; ningún decorador cambia validadores del producto. Se invoca el transaction original que ejecuta BEGIN/INSERT/COMMIT. Las pausas se sitúan realmente antes de ese commit o después de él, según el escenario. Gateways/requisitos sintéticos sirven para probar el contrato del servicio; **no son aprobación humana ni integrado certificado**.

## A01: reproducción y corrección comprobada

Baseline histórico: git show e7d de FileSystemStorage y CanonicalClosureService en bundles separados. Las otras fuentes productivas de las que dependen no cambiaron R10→R11. Decorador transaction ejecuta el callback original y lanza updateLifecycleState desde root.uppercase(); espera110ms sin esperar la terminación del escritor bajo el lock. En R10 el alias termina antes del commit, y las cuatro acciones conservan una aprobación para contexto previo. Sin alias espera. La preparación es explícita y no altera node_modules productivo ni fuentes; genera módulos auxiliares.

En R11 el mismo reproducer (probe) ya muestra exclusión. Matriz externa64: cuatro acciones × cuatro mutaciones (session,plan,phase,state) × dos posiciones (entrada a transaction y después del callback, antes de COMMIT) × escritor mismo/otro proceso con FileSystemStorage oficial y uppercase. Las dos instancias observan un único directorio .lock en la misma carpeta física, el escritor no termina bajo fence y todos los campos de contexto conservan valores originales antes de retornar al commit físico. Tras release recupera el escritor. El caso accept_gaps usa una brecha real del assessment, no un ID inventado. Adicionalmente pasan saveLifecycleState del test R11, junction de raíz, excepción y seis kills/readback/recovery.

Fuente: [identidad del lock](https://github.com/Hyouka73/QAMCP/blob/4bb22547349a407b1eeb2383e6981af5dd1db07a/packages/knowledge/src/storage/file-storage.ts#L89). Usa realpathSync.native, separadores normalizados y lowerCase solo Windows. La normalización se refiere al nombre de lock, no a una prueba universal de identidad física. No depende del inode de lifecycle, que cambia con atomic rename. Un junction de raíz completo compartió namespace y lock en este host. Otros mounts, symlinks parciales, hardlinks, directorios case-sensitive y SO no quedan certificados.

Fingerprint:40 casos de las cuatro acciones × session/plan/state/phase/revisión binding × gateway/entrada. Cambios oficiales antes de terminar gateway bloquean sin autorización; raw en entrada bloquea por fingerprint; Knowledge dentro de fence rechaza escritura. Raw después del callback sí produce deriva: es límite expreso del contrato cooperante, no un escritor protegido. Orden observado gateway libre → lifecycle → Knowledge → Closure → liberar Knowledge → liberar lifecycle. No deadlocks en estas rutas, sin garantía de reentrancia ni adquisición inversa externa.

## A03: terminal durable y procedencia

Fuente: [relectura del ganador](https://github.com/Hyouka73/QAMCP/blob/4bb22547349a407b1eeb2383e6981af5dd1db07a/packages/mcp/src/handlers/canonical-closure-service.ts#L836). Waive+waive y close+waive con dos adapters y stores devuelven el mismo terminal autorizado; un resultado es idempotente y solo se consume una aprobación. Ambos pares también se ejecutaron con dos procesos físicos, sincronizando sus gateways antes de liberarlos. El ganador de close+waive puede ser waived: la otra llamada informa el terminal existente y no aplica su intención original. Dos módulos distintos cierran con dos aprobaciones/recibos independientes, retry idempotente de ambos.

Sonda determinista: el consumidor perdedor ya pasó la primera lectura y espera en gateway; el ganador termina. Se libera al perdedor con recibo válido o tras alteraciones deliberadas de fixture. Recibo con trace.source, reason, review o entidad source ajenos bloquea. Aprobación ausente, digest distinto o duplicada devuelve invalid_durable_closure. Snapshot, ciphertext/historial, relaciones y lifecycle no cambian respecto al estado tras la alteración deliberada. No se consume la decisión del perdedor ni se pide un gateway adicional. Los negativos no implican que la fixture alterada fuera legítima.

Pérdida de respuesta: close y waive ya durables; cliente descarta respuesta y reintenta con gateway que lanzaría error. Devuelve idempotent:true con snapshot, historial, recibo/revisión y lifecycle idénticos. Cierres históricos R9 también conservan autoridad e historial exactos; solicitud de aplicabilidad pendiente R9 conserva digest.

## A04/A06 y recuperación entre recursos

A04: original callback → sleep hasta expiresAt+40ms → retorno al ClosureStore real. Las cuatro ramas producen una aprobación durable después del deadline. El comportamiento permanece abierto; definir el instante de consumo y guard final si la política exige vigencia al commit. La auditoría no cambia esa política por interpretación.

A06: gap real catalog/functional/unknown_applicability se acepta con razón y receipt de la decisión gateway de fixture exactos; readback con segunda conexión. Retry idéntico y motivo distinto bloquean antes de otro gateway; snapshot e historial idénticos. No duplica, pero no proporciona éxito idempotente. IDs inexistentes/duplicados, decisión antigua con razón cambiada, drift de requisito/requisito nuevo, gateway null/reject y approvalId usado para otro gap no consumen autoridad adicional.

Kill físico: seis procesos nuevos (close/waive × tres etapas). Antes de commit, tras callback, queda transacción abierta sin autoridad durable: kill revierte aprobación e historial. Después de commit Closure y antes de receipt: una aprobación/cierre, cero relaciones, lifecycle planned. Después de receipt y antes de proyección FS: una aprobación/relación, lifecycle planned. Tras esperar stale11s el servicio recupera; fases durables no solicitan autorización nueva, y terminan en una aprobación, un recibo y una generación de history; retry posterior idempotente. Kill de titular lifecycle+Knowledge adicional libera SQLite inmediatamente y lifecycle tras stale; primer intento ELOCKED. Throw tras callback hace rollback en las cuatro acciones y libera ambos fences. **Esto es recuperación eventual ensayada, no una transacción atómica entre recursos, ni prueba de todos los fallos de energía.**

A02: process.cwd cambiado no mueve el fence de SQLite; otra conexión/proceso recibe BUSY y recupera al salir. Los intentos reales de rename/unlink de archivo abierto vuelven EBUSY; no se alcanzó físicamente sustitución/desaparición ni se certificó POSIX. No se extrapola realpath/dev/ino.

## Salidas completas de las sondas finales

### baseline

```text
{"scenario":"r10-baseline-reproduced","sourceSHA":"e7d3717d9311ed73736568b13ce99e131d617453","action":"declare_non_applicable","alias":false,"writerCompletedBeforePhysicalCommit":false,"status":"declared_non_applicable","approvals":1}
{"scenario":"r10-baseline-reproduced","sourceSHA":"e7d3717d9311ed73736568b13ce99e131d617453","action":"declare_non_applicable","alias":true,"writerCompletedBeforePhysicalCommit":true,"status":"declared_non_applicable","approvals":1}
{"scenario":"r10-baseline-reproduced","sourceSHA":"e7d3717d9311ed73736568b13ce99e131d617453","action":"accept_gaps","alias":false,"writerCompletedBeforePhysicalCommit":false,"status":"gaps_accepted","approvals":1}
{"scenario":"r10-baseline-reproduced","sourceSHA":"e7d3717d9311ed73736568b13ce99e131d617453","action":"accept_gaps","alias":true,"writerCompletedBeforePhysicalCommit":true,"status":"gaps_accepted","approvals":1}
{"scenario":"r10-baseline-reproduced","sourceSHA":"e7d3717d9311ed73736568b13ce99e131d617453","action":"close","alias":false,"writerCompletedBeforePhysicalCommit":false,"status":"closed","approvals":1}
{"scenario":"r10-baseline-reproduced","sourceSHA":"e7d3717d9311ed73736568b13ce99e131d617453","action":"close","alias":true,"writerCompletedBeforePhysicalCommit":true,"status":"closed","approvals":1}
{"scenario":"r10-baseline-reproduced","sourceSHA":"e7d3717d9311ed73736568b13ce99e131d617453","action":"waive","alias":false,"writerCompletedBeforePhysicalCommit":false,"status":"waived","approvals":1}
{"scenario":"r10-baseline-reproduced","sourceSHA":"e7d3717d9311ed73736568b13ce99e131d617453","action":"waive","alias":true,"writerCompletedBeforePhysicalCommit":true,"status":"waived","approvals":1}
```

### locks

```text
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"session","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"session","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"session","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"session","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"plan","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"plan","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"plan","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"plan","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"phase","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"phase","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"phase","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"phase","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"state","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"state","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"state","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"state","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"session","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"session","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"session","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"session","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"plan","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"plan","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"plan","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"plan","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"phase","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"phase","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"phase","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"phase","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"state","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"state","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"state","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"state","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"close","kind":"session","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"session","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"session","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"session","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"plan","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"plan","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"plan","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"plan","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"phase","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"phase","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"phase","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"phase","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"state","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"state","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"state","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"state","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"waive","kind":"session","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"session","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"session","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"session","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"plan","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"plan","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"plan","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"plan","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"phase","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"phase","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"phase","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"phase","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"state","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"state","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"state","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"state","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"junction-root","sameLock":true,"recovered":true}
{"scenario":"lock-exception","unchanged":true,"recoveredThroughAlias":true}
```

### terminal

```text
{"scenario":"durable-winner","alteration":"valid","result":{"status":"waived","idempotent":true,"decision_id":"3253ab5c-575f-42b6-ae5c-31c3efad3369","request_digest":"85f8d871e5e8f1a0dee41cea3292e99f47cee53554df286d94b672b34982c89b","coverage_digest":"2aa602a1efb57d77f29ade20b161fe04e7688dc3770348a9c2afb934139f7710"},"secondAuthorizationConsumed":false,"noNewReceiptHistoryOrTransition":true}
{"scenario":"durable-winner","alteration":"trace-source","result":{"status":"blocked","code":"closure_context_changed","razon":"La sesión o el módulo cambiaron antes del consentimiento."},"secondAuthorizationConsumed":false,"noNewReceiptHistoryOrTransition":true}
{"scenario":"durable-winner","alteration":"trace-reason","result":{"status":"blocked","code":"closure_context_changed","razon":"La sesión o el módulo cambiaron antes del consentimiento."},"secondAuthorizationConsumed":false,"noNewReceiptHistoryOrTransition":true}
{"scenario":"durable-winner","alteration":"trace-review","result":{"status":"blocked","code":"closure_context_changed","razon":"La sesión o el módulo cambiaron antes del consentimiento."},"secondAuthorizationConsumed":false,"noNewReceiptHistoryOrTransition":true}
{"scenario":"durable-winner","alteration":"entity-source","result":{"status":"blocked","code":"closure_context_changed","razon":"La sesión o el módulo cambiaron antes del consentimiento."},"secondAuthorizationConsumed":false,"noNewReceiptHistoryOrTransition":true}
{"scenario":"durable-winner","alteration":"approval-missing","result":{"status":"blocked","code":"invalid_durable_closure","razon":"El cierre concurrente no conserva autorización canónica válida."},"secondAuthorizationConsumed":false,"noNewReceiptHistoryOrTransition":true}
{"scenario":"durable-winner","alteration":"approval-digest","result":{"status":"blocked","code":"invalid_durable_closure","razon":"El cierre concurrente no conserva autorización canónica válida."},"secondAuthorizationConsumed":false,"noNewReceiptHistoryOrTransition":true}
{"scenario":"durable-winner","alteration":"approval-duplicate","result":{"status":"blocked","code":"invalid_durable_closure","razon":"El cierre concurrente no conserva autorización canónica válida."},"secondAuthorizationConsumed":false,"noNewReceiptHistoryOrTransition":true}
{"scenario":"distinct-modules","results":[{"status":"closed","decision_id":"32071042-b6ad-4a31-90b5-0444e055a314","request_digest":"a802ac727b917dc4c2c0a8a7d53bdb8f0e615cff54ea9e15fd4d146c82927326","coverage_digest":"0bd724ea1aa5c0ce0473468e4170c108b32608c6736dc6333655bae47977f95b","assessment":{"module_key":"catalog","module_id":"mod-catalog","module_revision":1,"application_id":"app-r5","environment_id":"local","assessed_at":"2026-11-05T17:47:38.722Z","assessed_by":"canonical_coverage_service","coverage_digest":"0bd724ea1aa5c0ce0473468e4170c108b32608c6736dc6333655bae47977f95b","specification_coverage":{"status":"complete","applicable_categories_count":7,"satisfied_categories_count":7,"confirmed_requirements_count":7,"pending_requirements_count":0,"total_gaps_count":0,"unaddressed_gaps_count":0,"accepted_gaps_count":0,"category_statuses":[{"category":"functional","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"business_rule","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"security","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"ui","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"ux","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"regression","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"performance","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"}]},"review_coverage":{"status":"pending_review","reviewed_questions_count":7,"pending_questions_count":0,"decisions_count":0,"host_decisions":[]},"execution_coverage":{"status":"not_executed","executed_count":0,"passed_count":0,"failed_count":0,"indeterminate_count":0,"note":"La cobertura de ejecución requiere ejecución con test runner (VNEXT-014). Cero certificación de ejecución en R5."},"gaps":[],"applicability_decisions":[],"closure_verdict":"ready_for_closure","blocker_reasons":[]}},{"status":"closed","decision_id":"e8b246f5-5478-45f1-a1a2-0fcdfed1843e","request_digest":"9aadd707f020ff9fe26f1678f09800fd19b90859777be11ac7170513646e5a39","coverage_digest":"1ee4b9c43d14ea173c024923ccc6edba04a521d1521515bb08bd51c1fdd6bda3","assessment":{"module_key":"billing","module_id":"mod-billing","module_revision":1,"application_id":"app-r5","environment_id":"local","assessed_at":"2026-11-05T17:47:38.725Z","assessed_by":"canonical_coverage_service","coverage_digest":"1ee4b9c43d14ea173c024923ccc6edba04a521d1521515bb08bd51c1fdd6bda3","specification_coverage":{"status":"complete","applicable_categories_count":7,"satisfied_categories_count":7,"confirmed_requirements_count":7,"pending_requirements_count":0,"total_gaps_count":0,"unaddressed_gaps_count":0,"accepted_gaps_count":0,"category_statuses":[{"category":"functional","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"business_rule","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"security","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"ui","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"ux","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"regression","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"performance","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"}]},"review_coverage":{"status":"pending_review","reviewed_questions_count":7,"pending_questions_count":0,"decisions_count":0,"host_decisions":[]},"execution_coverage":{"status":"not_executed","executed_count":0,"passed_count":0,"failed_count":0,"indeterminate_count":0,"note":"La cobertura de ejecución requiere ejecución con test runner (VNEXT-014). Cero certificación de ejecución en R5."},"gaps":[],"applicability_decisions":[],"closure_verdict":"ready_for_closure","blocker_reasons":[]}}],"approvals":2,"closures":["catalog","billing"],"receipts":2}
{"scenario":"distinct-module-retry","module":"catalog","result":{"status":"closed","idempotent":true,"decision_id":"32071042-b6ad-4a31-90b5-0444e055a314","request_digest":"a802ac727b917dc4c2c0a8a7d53bdb8f0e615cff54ea9e15fd4d146c82927326","coverage_digest":"0bd724ea1aa5c0ce0473468e4170c108b32608c6736dc6333655bae47977f95b"}}
{"scenario":"distinct-module-retry","module":"billing","result":{"status":"closed","idempotent":true,"decision_id":"e8b246f5-5478-45f1-a1a2-0fcdfed1843e","request_digest":"9aadd707f020ff9fe26f1678f09800fd19b90859777be11ac7170513646e5a39","coverage_digest":"1ee4b9c43d14ea173c024923ccc6edba04a521d1521515bb08bd51c1fdd6bda3"}}
{"scenario":"lost-response","action":"close","result":{"status":"closed","idempotent":true,"decision_id":"64e6571a-a3fd-437d-a4ff-6959fcc944b0","request_digest":"17172735f8e8dead1b0490d47cb8f0fc3cd2ed0addc9a32a2d2a9d76e85d26b7","coverage_digest":"99188d870c967150dae09cb789fe2f488d93927f537e9c50cee03730793110e1"},"sameApprovalReceiptHistory":true}
{"scenario":"lost-response","action":"waive","result":{"status":"waived","idempotent":true,"decision_id":"8e06a63f-4656-4253-a1bd-feff3d1a1a22","request_digest":"46187d3738b3c6c277d597cace634fdbea8e6862625ada5e25b75218baeecd9b","coverage_digest":"3fea664c6ce9d97929a9abc7de714b68a36c7d8821b514483ee9917338325896"},"sameApprovalReceiptHistory":true}
```

### crash

```text
{"scenario":"physical-kill-readback","stage":"before-commit","action":"close","approvals":0,"receipts":0,"lifecycle":"planned"}
{"scenario":"physical-kill-readback","stage":"after-closure","action":"close","approvals":1,"receipts":0,"lifecycle":"planned"}
{"scenario":"physical-kill-readback","stage":"after-receipt","action":"close","approvals":1,"receipts":1,"lifecycle":"planned"}
{"scenario":"physical-kill-readback","stage":"before-commit","action":"waive","approvals":0,"receipts":0,"lifecycle":"planned"}
{"scenario":"physical-kill-readback","stage":"after-closure","action":"waive","approvals":1,"receipts":0,"lifecycle":"planned"}
{"scenario":"physical-kill-readback","stage":"after-receipt","action":"waive","approvals":1,"receipts":1,"lifecycle":"planned"}
{"scenario":"physical-kill-recovered","stage":"before-commit","action":"close","status":"closed","idempotent":false,"gatewayCalls":1,"oneApprovalReceiptHistory":true,"projectedState":"closed"}
{"scenario":"physical-kill-recovered","stage":"after-closure","action":"close","status":"closed","idempotent":true,"gatewayCalls":0,"oneApprovalReceiptHistory":true,"projectedState":"closed"}
{"scenario":"physical-kill-recovered","stage":"after-receipt","action":"close","status":"closed","idempotent":true,"gatewayCalls":0,"oneApprovalReceiptHistory":true,"projectedState":"closed"}
{"scenario":"physical-kill-recovered","stage":"before-commit","action":"waive","status":"waived","idempotent":false,"gatewayCalls":1,"oneApprovalReceiptHistory":true,"projectedState":"waived"}
{"scenario":"physical-kill-recovered","stage":"after-closure","action":"waive","status":"waived","idempotent":true,"gatewayCalls":0,"oneApprovalReceiptHistory":true,"projectedState":"waived"}
{"scenario":"physical-kill-recovered","stage":"after-receipt","action":"waive","status":"waived","idempotent":true,"gatewayCalls":0,"oneApprovalReceiptHistory":true,"projectedState":"waived"}
```

### probe

```text
{"scenario":"runtime","node":"v24.15.0","platform":"win32","sqlite":"3.51.3","FTS5":true}
{"scenario":"relative-cwd","samePhysicalFile":true,"otherConnectionAndProcessBlocked":true,"recovered":true,"noStrayFile":true}
{"scenario":"file-identity","phase":"before","replacement":false,"renamed":false,"callback":false,"code":"EBUSY","pathExists":true}
{"scenario":"file-identity","phase":"before","replacement":true,"renamed":false,"callback":false,"code":"EBUSY","pathExists":true}
{"scenario":"file-identity","phase":"inside","replacement":false,"renamed":false,"callback":true,"code":"EBUSY","pathExists":true}
{"scenario":"file-identity","phase":"inside","replacement":true,"renamed":false,"callback":true,"code":"EBUSY","pathExists":true}
{"scenario":"lifecycle","action":"declare_non_applicable","stage":"entry","mode":"official","writerCompletedDuringFence":false,"status":"declared_non_applicable","approvals":1,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"declare_non_applicable","stage":"entry","mode":"raw","writerCompletedDuringFence":true,"status":"blocked","code":"closure_consistency_conflict","approvals":0,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"declare_non_applicable","stage":"entry","mode":"official-case-alias","writerCompletedDuringFence":false,"status":"declared_non_applicable","approvals":1,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"declare_non_applicable","stage":"after-callback","mode":"official","writerCompletedDuringFence":false,"status":"declared_non_applicable","approvals":1,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"declare_non_applicable","stage":"after-callback","mode":"raw","writerCompletedDuringFence":true,"status":"declared_non_applicable","approvals":1,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"declare_non_applicable","stage":"after-callback","mode":"official-case-alias","writerCompletedDuringFence":false,"status":"declared_non_applicable","approvals":1,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"accept_gaps","stage":"entry","mode":"official","writerCompletedDuringFence":false,"status":"gaps_accepted","approvals":1,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"accept_gaps","stage":"entry","mode":"raw","writerCompletedDuringFence":true,"status":"blocked","code":"closure_consistency_conflict","approvals":0,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"accept_gaps","stage":"entry","mode":"official-case-alias","writerCompletedDuringFence":false,"status":"gaps_accepted","approvals":1,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"accept_gaps","stage":"after-callback","mode":"official","writerCompletedDuringFence":false,"status":"gaps_accepted","approvals":1,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"accept_gaps","stage":"after-callback","mode":"raw","writerCompletedDuringFence":true,"status":"gaps_accepted","approvals":1,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"accept_gaps","stage":"after-callback","mode":"official-case-alias","writerCompletedDuringFence":false,"status":"gaps_accepted","approvals":1,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"close","stage":"entry","mode":"official","writerCompletedDuringFence":false,"status":"closed","approvals":1,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"close","stage":"entry","mode":"raw","writerCompletedDuringFence":true,"status":"blocked","code":"closure_consistency_conflict","approvals":0,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"close","stage":"entry","mode":"official-case-alias","writerCompletedDuringFence":false,"status":"closed","approvals":1,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"close","stage":"after-callback","mode":"official","writerCompletedDuringFence":false,"status":"closed","approvals":1,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"close","stage":"after-callback","mode":"raw","writerCompletedDuringFence":true,"status":"closed","approvals":1,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"close","stage":"after-callback","mode":"official-case-alias","writerCompletedDuringFence":false,"status":"closed","approvals":1,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"waive","stage":"entry","mode":"official","writerCompletedDuringFence":false,"status":"waived","approvals":1,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"waive","stage":"entry","mode":"raw","writerCompletedDuringFence":true,"status":"blocked","code":"closure_consistency_conflict","approvals":0,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"waive","stage":"entry","mode":"official-case-alias","writerCompletedDuringFence":false,"status":"waived","approvals":1,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"waive","stage":"after-callback","mode":"official","writerCompletedDuringFence":false,"status":"waived","approvals":1,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"waive","stage":"after-callback","mode":"raw","writerCompletedDuringFence":true,"status":"waived","approvals":1,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"waive","stage":"after-callback","mode":"official-case-alias","writerCompletedDuringFence":false,"status":"waived","approvals":1,"changedSession":"changed-session"}
{"scenario":"gateway-context","mutation":"session","status":"blocked","code":"closure_context_changed","unchanged":true}
{"scenario":"gateway-context","mutation":"plan","status":"blocked","code":"closure_context_changed","unchanged":true}
{"scenario":"gateway-context","mutation":"state","status":"blocked","code":"closure_context_changed","unchanged":true}
{"scenario":"gateway-context","mutation":"phase","status":"blocked","code":"closure_context_changed","unchanged":true}
{"scenario":"gateway-context","mutation":"binding-revision","status":"blocked","code":"closure_context_changed","unchanged":true}
{"scenario":"accept-real-gap","gapId":"gap:catalog:functional:unknown_applicability","status":"gaps_accepted","receipt":"8ce721e6-7cbf-4dcf-8167-30bf7eba7ca1","exactReason":true,"readback":true,"calls":1,"repeat":{"status":"blocked","code":"closure_gap_selection_invalid"},"changedReason":{"status":"blocked","code":"closure_gap_selection_invalid"},"historyUnchanged":true}
{"scenario":"accept-negative","kind":"missing","calls":0,"code":"closure_gap_selection_invalid","authorizationHistoryReceiptsUnchanged":true}
{"scenario":"accept-negative","kind":"duplicate","calls":0,"code":"closure_gap_selection_invalid","authorizationHistoryReceiptsUnchanged":true}
{"scenario":"accept-negative","kind":"reason-replay","calls":2,"code":"closure_review_invalid","authorizationHistoryReceiptsUnchanged":true}
{"scenario":"accept-negative","kind":"requirement-drift","calls":1,"code":"closure_context_changed","authorizationHistoryReceiptsUnchanged":true}
{"scenario":"accept-negative","kind":"new-requirement","calls":1,"code":"closure_context_changed","authorizationHistoryReceiptsUnchanged":true}
{"scenario":"accept-negative","kind":"gateway-null","calls":1,"code":"closure_review_pending","authorizationHistoryReceiptsUnchanged":true}
{"scenario":"accept-negative","kind":"gateway-reject","calls":1,"code":"closure_review_rejected","authorizationHistoryReceiptsUnchanged":true}
{"scenario":"expired-before-commit","action":"declare_non_applicable","status":"declared_non_applicable","approvalDurable":true,"msPastDeadline":57}
{"scenario":"expired-before-commit","action":"accept_gaps","status":"gaps_accepted","approvalDurable":true,"msPastDeadline":54}
{"scenario":"expired-before-commit","action":"close","status":"closed","approvalDurable":true,"msPastDeadline":72}
{"scenario":"expired-before-commit","action":"waive","status":"waived","approvalDurable":true,"msPastDeadline":72}
{"scenario":"competition","pair":["waive","waive"],"results":[{"status":"waived"},{"status":"waived","idempotent":true}],"approvals":1,"closures":1,"receipts":1,"retry":{"status":"waived","idempotent":true}}
{"scenario":"competition","pair":["close","waive"],"results":[{"status":"waived","idempotent":true},{"status":"waived"}],"approvals":1,"closures":1,"receipts":1,"retry":{"status":"waived","idempotent":true}}
{"scenario":"competition","pair":["declare_non_applicable","waive"],"results":[{"status":"declared_non_applicable"},{"status":"blocked","code":"closure_context_changed"}],"approvals":1,"closures":0,"receipts":1,"retry":{"status":"waived"}}
{"scenario":"competition","pair":["accept_gaps","accept_gaps"],"results":[{"status":"gaps_accepted"},{"status":"blocked","code":"closure_context_changed"}],"approvals":1,"closures":0,"receipts":0,"retry":{"status":"blocked","code":"closure_gap_selection_invalid"}}
{"scenario":"process-kill","sqliteReleased":true,"lifecycleFirstAttempt":"ELOCKED","lifecycleAfterStale":true,"zeroApprovals":true}
```

### context

```text
{"scenario":"context-matrix","action":"declare_non_applicable","kind":"session","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"declare_non_applicable","kind":"session","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"declare_non_applicable","kind":"plan","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"declare_non_applicable","kind":"plan","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"declare_non_applicable","kind":"state","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"declare_non_applicable","kind":"state","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"declare_non_applicable","kind":"phase","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"declare_non_applicable","kind":"phase","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"declare_non_applicable","kind":"binding","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"declare_non_applicable","kind":"binding","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":true,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"accept_gaps","kind":"session","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"accept_gaps","kind":"session","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"accept_gaps","kind":"plan","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"accept_gaps","kind":"plan","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"accept_gaps","kind":"state","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"accept_gaps","kind":"state","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"accept_gaps","kind":"phase","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"accept_gaps","kind":"phase","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"accept_gaps","kind":"binding","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"accept_gaps","kind":"binding","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":true,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"close","kind":"session","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"close","kind":"session","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"close","kind":"plan","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"close","kind":"plan","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"close","kind":"state","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"close","kind":"state","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"close","kind":"phase","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"close","kind":"phase","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"close","kind":"binding","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"close","kind":"binding","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":true,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"waive","kind":"session","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"waive","kind":"session","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"waive","kind":"plan","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"waive","kind":"plan","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"waive","kind":"state","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"waive","kind":"state","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"waive","kind":"phase","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"waive","kind":"phase","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"waive","kind":"binding","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"waive","kind":"binding","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":true,"zeroAuthorization":true}
{"scenario":"lock-order","events":["gateway-no-lock","lifecycle-request","lifecycle-held","knowledge-request","knowledge-held","closure-request","closure-callback","knowledge-release","lifecycle-release"],"completedWithoutDeadlock":true}
{"scenario":"unlink-open-file","code":"EBUSY","disappearanceNotAchieved":true}
```

### extra

```text
{"scenario":"historical-r9","terminal":"closed","authorityPreserved":true,"noNewApprovalReceiptHistoryOrTransition":true,"readback":true}
{"scenario":"historical-r9","terminal":"waived","authorityPreserved":true,"noNewApprovalReceiptHistoryOrTransition":true,"readback":true}
{"scenario":"r9-pending-applicability","digestUnchanged":true,"status":"declared_non_applicable"}
{"scenario":"rollback","action":"declare_non_applicable","code":"closure_consistency_conflict","allAuthorizationStateUnchanged":true,"bothFencesReleased":true}
{"scenario":"rollback","action":"accept_gaps","code":"closure_consistency_conflict","allAuthorizationStateUnchanged":true,"bothFencesReleased":true}
{"scenario":"rollback","action":"close","code":"closure_consistency_conflict","allAuthorizationStateUnchanged":true,"bothFencesReleased":true}
{"scenario":"rollback","action":"waive","code":"closure_consistency_conflict","allAuthorizationStateUnchanged":true,"bothFencesReleased":true}
{"scenario":"official-process-lifecycle","alias":false,"writerCompletedDuringFence":false,"sessionDuringFence":"session-r5","samePhysicalRoot":true}
{"scenario":"official-process-recovery","alias":false,"writerRecovered":true}
{"scenario":"official-process-lifecycle","alias":true,"writerCompletedDuringFence":false,"sessionDuringFence":"session-r5","samePhysicalRoot":true}
{"scenario":"official-process-recovery","alias":true,"writerRecovered":true}
{"scenario":"fifo-queued-consumer","progressAfterRelease":true}
```

### process

```text
{"scenario":"two-process-results-before-readback","results":[{"type":"result","status":"waived"},{"type":"result","status":"waived","idempotent":true}]}
{"scenario":"two-physical-closure-processes","results":[{"type":"result","status":"waived"},{"type":"result","status":"waived","idempotent":true}],"singleApprovalClosureReceipt":true,"retry":"waived","idempotent":true}
{"scenario":"accept-approval-reuse","code":"closure_consistency_conflict","snapshotUnchanged":true,"approvals":1}
```

### process-mixed

```text
{"scenario":"two-process-results-before-readback","results":[{"type":"result","status":"waived","idempotent":true},{"type":"result","status":"waived"}]}
{"scenario":"two-physical-closure-processes","results":[{"type":"result","status":"waived","idempotent":true},{"type":"result","status":"waived"}],"singleApprovalClosureReceipt":true,"retry":"waived","idempotent":true}
```


## Arneses externos íntegros y preparación

Rutas reales del host: worktree audit-r4-r10 fijado a R11, evidencia hermana r4-r11-evidence; TEMP/TMP se fija en node_modules/.tmp-vnext antes de ejecutar. prepare extrae únicamente las funciones de fixture de la suite fijada y las empaqueta con esbuild sin editarla. Los nombres old-closure/old-coverage son históricos R9; r10-* solo se usan en baseline. No mezclar esos módulos con el R11 que se evalúa.

### prepare.mjs

```javascript
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=resolve('C:/Users/Judirico/Documents/QAMCP/audit-r4-r10');
const req=createRequire(root+'/package.json');const tr=createRequire(req.resolve('tsup/package.json'));const {build}=await import(pathToFileURL(tr.resolve('esbuild')));
let fixture=readFileSync(root+'/packages/mcp/src/__tests__/canonical-coverage.test.ts','utf8').split("describe('VNEXT-013-R5 Comprehensive Physical Test Matrix'")[0];
fixture=fixture.replace("import { afterEach, describe, expect, it, vi } from 'vitest';","const afterEach=()=>{}; const vi={restoreAllMocks(){}};");
fixture+='\nexport {fixture,makeDecision,CanonicalClosureService,SqliteModuleClosureStore,SqliteKnowledgeAdapter,FileSystemStorage};';
await build({stdin:{contents:fixture,resolveDir:root+'/packages/mcp/src/__tests__',loader:'ts'},bundle:true,packages:'external',platform:'node',format:'esm',outfile:root+'/packages/mcp/node_modules/.audit-r11/fixture.mjs'});
const stdio=readFileSync(root+'/docs/vnext/auditorias/VNEXT-014-R4-R7/COMANDOS.md','utf8').split('```javascript')[1].split('```')[0];
writeFileSync(root+'/packages/mcp/node_modules/.audit-r11/stdio.mjs',stdio);
```

### prepare-old.mjs

```javascript
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const root='C:/Users/Judirico/Documents/QAMCP/audit-r4-r10';const req=createRequire(root+'/package.json'),tr=createRequire(req.resolve('tsup/package.json'));const {build}=await import(pathToFileURL(tr.resolve('esbuild')));
const old=execFileSync('git',['show','09c9ce276c9c328026de4236dadf0a85d8e94d21:packages/mcp/src/handlers/canonical-coverage-service.ts'],{cwd:root,encoding:'utf8'});
const closure=execFileSync('git',['show','09c9ce276c9c328026de4236dadf0a85d8e94d21:packages/mcp/src/handlers/canonical-closure-service.ts'],{cwd:root,encoding:'utf8'});
for(const [name,contents] of [['old-coverage',old],['old-closure',closure]])await build({stdin:{contents,resolveDir:root+'/packages/mcp/src/handlers',loader:'ts'},bundle:true,packages:'external',platform:'node',format:'esm',outfile:root+'/packages/mcp/node_modules/.audit-r11/'+name+'.mjs',plugins:[{name:'exact-old-coverage',setup(b){b.onLoad({filter:/canonical-coverage-service\.ts$/},()=>({contents:old,loader:'ts',resolveDir:root+'/packages/mcp/src/handlers'}));}}]});
```

### prepare-baseline.mjs

```javascript
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const root='C:/Users/Judirico/Documents/QAMCP/audit-r4-r10';
const req=createRequire(root+'/package.json'),tr=createRequire(req.resolve('tsup/package.json'));const {build}=await import(pathToFileURL(tr.resolve('esbuild')));
const old=path=>execFileSync('git',['show','e7d3717d9311ed73736568b13ce99e131d617453:'+path],{cwd:root,encoding:'utf8'});
for(const [name,path] of [['r10-fs','packages/knowledge/src/storage/file-storage.ts'],['r10-closure','packages/mcp/src/handlers/canonical-closure-service.ts']]){
 let contents=old(path);if(name==='r10-closure')contents=contents.replace("import { FileSystemStorage } from '@qap/knowledge';","import { FileSystemStorage } from 'file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/knowledge/node_modules/.audit-r11/r10-fs.mjs';");
 await build({stdin:{contents,resolveDir:root+'/'+path.slice(0,path.lastIndexOf('/')),loader:'ts'},bundle:true,packages:'external',platform:'node',format:'esm',external:['file:///*'],outfile:root+'/packages/'+(name==='r10-fs'?'knowledge':'mcp')+'/node_modules/.audit-r11/'+name+'.mjs'});
}
```

### baseline.mjs

```javascript
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture,makeDecision} from '../audit-r4-r10/packages/mcp/node_modules/.audit-r11/fixture.mjs';
import {FileSystemStorage} from '../audit-r4-r10/packages/knowledge/node_modules/.audit-r11/r10-fs.mjs';
import {CanonicalClosureService} from '../audit-r4-r10/packages/mcp/node_modules/.audit-r11/r10-closure.mjs';
const all={confirmedReqs:['functional','business_rule','security','ui','ux','regression','performance'].map(category=>({category,title:category}))},reason='Razón sintética aislada para reproducir el P1 anterior';
for(const action of ['declare_non_applicable','accept_gaps','close','waive'])for(const alias of [false,true]){const f=await fixture(action==='accept_gaps'?{}:all),original=f.closureStore.transaction.bind(f.closureStore);let pending,done=false,during;f.closureStore.transaction=(scope,op)=>original(scope,async snap=>{const result=await op(snap);pending=new FileSystemStorage({rootDir:alias?f.root.toUpperCase():f.root}).updateLifecycleState(s=>{s.session.id='old-alias';return s;}).then(()=>{done=true;});await new Promise(r=>setTimeout(r,110));during=done;return result;});try{const cmd=action==='accept_gaps'?{action,accepted_gaps:[{gap_id:(await f.coverageService.evaluate('catalog')).assessment.gaps[0].id,reason}]}:action==='declare_non_applicable'?{action,decisions:[{category:'performance',reason}]}:action==='waive'?{action,reason}:{action};const result=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>makeDecision(r)}).execute('catalog',cmd);await pending;assert.equal(during,alias);assert.equal(f.closureStore.read(f.context).approvals.length,1);console.log(JSON.stringify({scenario:'r10-baseline-reproduced',sourceSHA:'e7d3717d9311ed73736568b13ce99e131d617453',action,alias,writerCompletedBeforePhysicalCommit:during,status:result.status,approvals:1}));}finally{f.closureStore.close();f.store.close();}}
```

### locks.mjs

```javascript
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,statSync,symlinkSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {DatabaseSync} from 'node:sqlite';
import {fixture,makeDecision,CanonicalClosureService,FileSystemStorage} from '../audit-r4-r10/packages/mcp/node_modules/.audit-r11/fixture.mjs';
const url=new URL('../audit-r4-r10/packages/mcp/node_modules/.audit-r11/fixture.mjs',import.meta.url).href;
const all={confirmedReqs:['functional','business_rule','security','ui','ux','regression','performance'].map(category=>({category,title:category}))};
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),emit=x=>console.log(JSON.stringify(x));
const mutate=(s,kind)=>{if(kind==='session')s.session.id='alias-writer';if(kind==='plan')s.session.plan[0].path='/alias-writer';if(kind==='phase')s.phase='WRAP_UP';if(kind==='state')s.modules.catalog.state='observed';return s;};
const reason='Razón sintética de prueba aislada para verificar la exclusión oficial';
const cmd=async(f,a)=>a==='accept_gaps'?{action:a,accepted_gaps:[{gap_id:(await f.coverageService.evaluate('catalog')).assessment.gaps.find(g=>g.status==='unaddressed').id,reason}]}:a==='declare_non_applicable'?{action:a,decisions:[{category:'performance',reason}]}:a==='waive'?{action:a,reason}:{action:a};
for(const action of ['declare_non_applicable','accept_gaps','close','waive'])for(const kind of ['session','plan','phase','state'])for(const stage of ['entry','after-callback'])for(const mode of ['same-process','child-process']){
 const f=await fixture(action==='accept_gaps'?{}:all),command=await cmd(f,action),orig=f.closureStore.transaction.bind(f.closureStore);let pending,child,done=false,heldLocks,atCommit;
 const start=async()=>{const alias=f.root.toUpperCase();assert.equal(statSync(alias).ino,statSync(f.root).ino);
  if(mode==='same-process')pending=new FileSystemStorage({rootDir:alias}).updateLifecycleState(s=>mutate(s,kind)).then(()=>{done=true;});
  else{child=spawn(process.execPath,['--input-type=module','-e',`import {FileSystemStorage} from ${JSON.stringify(url)};console.log('START');await new FileSystemStorage({rootDir:process.argv[1]}).updateLifecycleState(s=>{(${mutate.toString()})(s,process.argv[2]);return s;});console.log('DONE');`,alias,kind],{stdio:['ignore','pipe','pipe']});let err='';child.stderr.on('data',b=>err+=b);const exited=once(child,'exit');await new Promise((res,rej)=>{child.stdout.on('data',b=>{if(b.toString().includes('START'))res();});child.on('error',rej);});pending=exited.then(([c])=>{assert.equal(c,0,err);done=true;});}
  await sleep(110);assert.equal(done,false);heldLocks=readdirSync(f.root+'/.qa/cache/locks').filter(x=>x.endsWith('.lock'));assert.equal(heldLocks.length,1);
 };
 f.closureStore.transaction=async(scope,op)=>{if(stage==='entry')await start();return orig(scope,async s=>{const result=await op(s);if(stage==='after-callback')await start();atCommit=JSON.parse(readFileSync(f.lifecyclePath));assert.equal(atCommit.session.id,'session-r5');assert.equal(atCommit.session.plan[0].path,'/');assert.equal(atCommit.phase,'WORKING');assert.equal(atCommit.modules.catalog.state,'planned');return result;});};
 try{const result=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>makeDecision(r)}).execute('catalog',command);assert.equal(result.status,{declare_non_applicable:'declared_non_applicable',accept_gaps:'gaps_accepted',close:'closed',waive:'waived'}[action]);await pending;assert.equal(done,true);assert.equal(f.closureStore.read(f.context).approvals.length,1);const ro=f.openClosureStore();assert.equal(ro.read(f.context).approvals.length,1);ro.close();emit({scenario:'alias-matrix',action,kind,stage,mode,singleSharedLock:true,unchangedBeforePhysicalCommit:true,recovered:true,status:result.status});}finally{if(child?.exitCode===null)child.kill();f.closureStore.close();f.store.close();}
}
// The canonical lock survives an atomic lifecycle replacement and resolves a root junction.
{const f=await fixture(),alias=f.root+'-junction';try{symlinkSync(f.root,alias,'junction');let done=false,p;await new FileSystemStorage({rootDir:f.root}).withLifecycleFence(async()=>{p=new FileSystemStorage({rootDir:alias}).updateLifecycleState(s=>mutate(s,'session')).then(()=>{done=true;});await sleep(110);assert.equal(done,false);});await p;assert.equal(done,true);emit({scenario:'junction-root',sameLock:true,recovered:true});}finally{f.closureStore.close();f.store.close();}}
// Exceptions release the shared lock without changing lifecycle or consuming authority.
{const f=await fixture(),before=readFileSync(f.lifecyclePath,'utf8');try{await assert.rejects(new FileSystemStorage({rootDir:f.root}).withLifecycleFence(async()=>{throw Error('external lock fault');}));assert.equal(readFileSync(f.lifecyclePath,'utf8'),before);await new FileSystemStorage({rootDir:f.root.toUpperCase()}).withLifecycleFence(async()=>{});assert.equal(f.closureStore.read(f.context).approvals.length,0);emit({scenario:'lock-exception',unchanged:true,recoveredThroughAlias:true});}finally{f.closureStore.close();f.store.close();}}
```

### terminal.mjs

```javascript
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {fixture,makeDecision,CanonicalClosureService,SqliteKnowledgeAdapter} from '../audit-r4-r10/packages/mcp/node_modules/.audit-r11/fixture.mjs';
const emit=x=>console.log(JSON.stringify(x)),reason='Razón sintética sustantiva aislada para verificar concurrencia';
const all={confirmedReqs:['functional','business_rule','security','ui','ux','regression','performance'].map(category=>({category,title:category}))};
const history=f=>{const d=new DatabaseSync(f.closureStorePath);try{return d.prepare('SELECT generation,hex(payload) payload FROM closure_history').all();}finally{d.close();}};
const close=f=>{f.closureStore.close();f.store.close();};
// Two real adapters and two closure connections, with the loser already past its initial read.
for(const alteration of ['valid','trace-source','trace-reason','trace-review','entity-source','approval-missing','approval-digest','approval-duplicate']){
 const f=await fixture(),k=new SqliteKnowledgeAdapter(f.knowledgePath),s=f.openClosureStore();let loserReady,allowLoser;const ready=new Promise(r=>{loserReady=r;}),gate=new Promise(r=>{allowLoser=r;});let calls=0;
 const winner=new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>makeDecision(r)});
 const loser=new CanonicalClosureService(k,f.context,s,{reviewClosure:async r=>{calls++;loserReady();await gate;return makeDecision(r);}});
 try{const pending=loser.execute('catalog',{action:'waive',reason});await ready;assert.equal((await winner.execute('catalog',{action:'waive',reason})).status,'waived');
  if(alteration.startsWith('trace')||alteration==='entity-source'){const snap=f.closureStore.read(f.context),id='waiver:'+snap.closures.catalog.decisionId,r=await f.store.get('app-r5','relation',id),trace={...r.trace},entity=structuredClone(r.entity);if(alteration==='trace-source')trace.source='external_untrusted';if(alteration==='trace-reason')trace.reason='changed-request';if(alteration==='trace-review')trace.review='unreviewed';if(alteration==='entity-source'){const m=await f.store.get('app-r5','module','mod-catalog');await f.store.commit('app-r5',[{kind:'module',expected_revision:0,trace:m.trace,entity:{...m.entity,id:'different-module',key:'different'}}]);entity.source.id='different-module';}await f.store.commit('app-r5',[{kind:'relation',expected_revision:r.revision,trace,entity}]);}
  if(alteration.startsWith('approval'))await f.closureStore.transaction(f.context,async snap=>{if(alteration==='approval-missing')snap.approvals=[];if(alteration==='approval-digest')snap.approvals[0][1]='changed-digest';if(alteration==='approval-duplicate')snap.approvals.push([...snap.approvals[0]]);});
  const before=f.closureStore.read(f.context),h=history(f),life=readFileSync(f.lifecyclePath,'utf8'),relations=await f.store.query('app-r5','relation');allowLoser();const result=await pending;
  assert.equal(result.status,alteration==='valid'?'waived':'blocked');if(alteration==='valid')assert.equal(result.idempotent,true);assert.deepEqual(f.closureStore.read(f.context),before);assert.deepEqual(history(f),h);assert.equal(readFileSync(f.lifecyclePath,'utf8'),life);assert.deepEqual(await f.store.query('app-r5','relation'),relations);assert.equal(calls,1);
  emit({scenario:'durable-winner',alteration,result,secondAuthorizationConsumed:false,noNewReceiptHistoryOrTransition:true});
 }finally{allowLoser();k.close();s.close();close(f);}
}
// Closing two distinct modules: capture any global-snapshot conflict without hiding it.
{const f=await fixture(all),k=new SqliteKnowledgeAdapter(f.knowledgePath),s=f.openClosureStore();try{const m=await f.store.get('app-r5','module','mod-catalog');await f.store.commit('app-r5',[{kind:'module',expected_revision:0,trace:m.trace,entity:{...m.entity,id:'mod-billing',key:'billing',title:'Billing'}}]);for(const r of (await f.store.query('app-r5','requirement')).items)await f.store.commit('app-r5',[{kind:'requirement',expected_revision:0,trace:r.trace,entity:{...r.entity,id:r.id+'-billing',module_key:'billing'}}]);
 const {FileSystemStorage}=await import('../audit-r4-r10/packages/mcp/node_modules/.audit-r11/fixture.mjs');await new FileSystemStorage({rootDir:f.root}).updateLifecycleState(l=>{l.modules.billing={...l.modules.catalog};l.session.plan.push({module:'billing',path:'/billing'});return l;});const ctx=structuredClone(f.context);ctx.moduleBindings.push({...ctx.moduleBindings[0],plannedName:'billing',moduleId:'mod-billing',moduleKey:'billing'});let n=0,release;const gate=new Promise(r=>{release=r;}),gateway={reviewClosure:async r=>{if(++n===2)release();await gate;return makeDecision(r);}};
 const a=new CanonicalClosureService(f.store,ctx,f.closureStore,gateway),b=new CanonicalClosureService(k,ctx,s,gateway);const results=await Promise.all([a.execute('catalog',{action:'close'}),b.execute('billing',{action:'close'})]);const snap=f.closureStore.read(ctx);emit({scenario:'distinct-modules',results,approvals:snap.approvals.length,closures:Object.keys(snap.closures),receipts:(await f.store.query('app-r5','relation')).items.length});
 for(const [i,svc] of [a,b].entries()){const name=i?'billing':'catalog',r=await svc.execute(name,{action:'close'});emit({scenario:'distinct-module-retry',module:name,result:r});}assert.equal(Object.keys(f.closureStore.read(ctx).closures).length,2);
 }finally{k.close();s.close();close(f);}}
// Exact retry after a lost response preserves durable ciphertext/history and relation revision.
for(const action of ['close','waive']){const f=await fixture(all);try{const svc=new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>makeDecision(r)});await svc.execute('catalog',action==='waive'?{action,reason}:{action});const before=f.closureStore.read(f.context),h=history(f),rels=await f.store.query('app-r5','relation'),life=readFileSync(f.lifecyclePath,'utf8');const result=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async()=>{throw Error('unexpected second gateway');}}).execute('catalog',action==='waive'?{action,reason}:{action});assert.equal(result.idempotent,true);assert.deepEqual(f.closureStore.read(f.context),before);assert.deepEqual(history(f),h);assert.deepEqual(await f.store.query('app-r5','relation'),rels);assert.equal(readFileSync(f.lifecyclePath,'utf8'),life);emit({scenario:'lost-response',action,result,sameApprovalReceiptHistory:true});}finally{close(f);}}
```

### crash.mjs

```javascript
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {fixture,makeDecision,CanonicalClosureService} from '../audit-r4-r10/packages/mcp/node_modules/.audit-r11/fixture.mjs';
const url=new URL('../audit-r4-r10/packages/mcp/node_modules/.audit-r11/fixture.mjs',import.meta.url).href;
const all={confirmedReqs:['functional','business_rule','security','ui','ux','regression','performance'].map(category=>({category,title:category}))},reason='Renuncia sintética aislada aprobada por gateway de prueba de recuperación';
const code=`import {SqliteKnowledgeAdapter,SqliteModuleClosureStore,CanonicalClosureService,makeDecision} from ${JSON.stringify(url)};
process.on('message',async m=>{const k=new SqliteKnowledgeAdapter(m.path),s=new SqliteModuleClosureStore({...m.options,key:Buffer.from(m.key,'base64')});const park=async()=>{process.send({type:'parked'});setInterval(()=>{},1000);await new Promise(()=>{});};const tx=s.transaction.bind(s),commit=k.commit.bind(k);
if(m.stage==='before-commit')s.transaction=(scope,op)=>tx(scope,async snap=>{const result=await op(snap);await park();return result;});
if(m.stage==='after-closure')s.transaction=async(scope,op)=>{const result=await tx(scope,op);await park();return result;};
if(m.stage==='after-receipt')k.commit=async(app,writes)=>{const result=await commit(app,writes);if(writes.some(w=>w.kind==='relation'))await park();return result;};
try{await new CanonicalClosureService(k,m.ctx,s,{reviewClosure:async r=>makeDecision(r)}).execute('catalog',m.action==='close'?{action:'close'}:{action:'waive',reason:m.reason});process.send({type:'unexpected-return'});}catch(e){process.send({type:'error',message:e.message});}});`;
const jobs=[];
try{for(const action of ['close','waive'])for(const stage of ['before-commit','after-closure','after-receipt']){const f=await fixture(all),child=spawn(process.execPath,['--input-type=module','-e',code],{stdio:['ignore','pipe','pipe','ipc']});const exited=once(child,'exit');let stderr='';child.stderr.on('data',b=>stderr+=b);const parked=new Promise((resolve,reject)=>{child.on('error',reject);child.on('message',m=>m.type==='parked'?resolve():reject(Error(JSON.stringify(m))));child.on('exit',c=>{if(c)reject(Error(stderr));});});jobs.push({f,child,exited,parked,action,stage});child.send({path:f.knowledgePath,key:f.closureKey.toString('base64'),ctx:f.context,action,stage,reason,options:{projectRoot:f.root,applicationId:'app-r5',environmentId:'local',path:f.closureStorePath,protection:'host_private_directory_and_managed_key'}});}
 await Promise.all(jobs.map(j=>j.parked));for(const j of jobs)j.child.kill();await Promise.all(jobs.map(j=>j.exited));
 for(const {f,stage,action} of jobs){const snap=f.closureStore.read(f.context);assert.equal(snap.approvals.length,stage==='before-commit'?0:1);const n=(await f.store.query('app-r5','relation')).items.length;assert.equal(n,stage==='after-receipt'?1:0);console.log(JSON.stringify({scenario:'physical-kill-readback',stage,action,approvals:snap.approvals.length,receipts:n,lifecycle:JSON.parse(readFileSync(f.lifecyclePath)).modules.catalog.state}));}
 await new Promise(r=>setTimeout(r,11000));
 for(const {f,stage,action} of jobs){let calls=0;const svc=new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>{calls++;assert.equal(stage,'before-commit');return makeDecision(r);}}),command=action==='close'?{action}:{action,reason};const result=await svc.execute('catalog',command);assert.equal(result.status,action==='close'?'closed':'waived');assert.equal(calls,stage==='before-commit'?1:0);const snap=f.closureStore.read(f.context),relations=await f.store.query('app-r5','relation');assert.equal(snap.approvals.length,1);assert.equal(Object.keys(snap.closures).length,1);assert.equal(relations.items.length,1);const db=new DatabaseSync(f.closureStorePath);const generations=db.prepare('SELECT count(*) n FROM closure_history').get().n;db.close();assert.equal(generations,1);const again=await svc.execute('catalog',command);assert.equal(again.idempotent,true);assert.equal(calls,stage==='before-commit'?1:0);console.log(JSON.stringify({scenario:'physical-kill-recovered',stage,action,status:result.status,idempotent:result.idempotent===true,gatewayCalls:calls,oneApprovalReceiptHistory:true,projectedState:JSON.parse(readFileSync(f.lifecyclePath)).modules.catalog.state}));}
}finally{for(const {child,f} of jobs){if(child.exitCode===null)child.kill();f.closureStore.close();f.store.close();}}
```

### probe.mjs

```javascript
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,renameSync,existsSync,mkdirSync,statSync,realpathSync} from 'node:fs';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {spawnSync,spawn} from 'node:child_process';
import {once} from 'node:events';
import {fixture,makeDecision,CanonicalClosureService,SqliteKnowledgeAdapter,FileSystemStorage} from '../audit-r4-r10/packages/mcp/node_modules/.audit-r11/fixture.mjs';
const emit=x=>console.log(JSON.stringify(x));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const categories=['functional','business_rule','security','ui','ux','regression','performance'];
const opts={confirmedReqs:categories.map(category=>({category,title:category}))};
const clean=f=>{f.closureStore.close();f.store.close();};
const reason='Aceptación sintética aislada de la brecha existente por el revisor de prueba';
const command=async(f,action)=> action==='accept_gaps'?{action,accepted_gaps:[{gap_id:(await f.coverageService.evaluate('catalog')).assessment.gaps.find(g=>g.status==='unaddressed').id,reason}]}:action==='declare_non_applicable'?{action,decisions:[{category:'performance',reason}]}:action==='waive'?{action,reason}:{action};
const history=f=>{const d=new DatabaseSync(f.closureStorePath,{readOnly:true});try{return d.prepare('SELECT generation,hex(payload) AS payload FROM closure_history ORDER BY generation').all();}finally{d.close();}};
const unchanged=(f,b,h)=>{assert.deepEqual(f.closureStore.read(f.context),b);assert.deepEqual(history(f),h);const s=f.openClosureStore();assert.deepEqual(s.read(f.context),b);s.close();};
const writer=path=>{const r=spawnSync(process.execPath,['--input-type=module','-e',`import {DatabaseSync} from 'node:sqlite';const d=new DatabaseSync(process.argv[1]);d.exec('PRAGMA busy_timeout=0');try{d.exec('BEGIN IMMEDIATE;ROLLBACK');console.log('WRITABLE')}catch(e){console.log('BLOCKED:'+e.errcode)}finally{d.close()}`,path],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
const db=new DatabaseSync(':memory:');db.exec('CREATE VIRTUAL TABLE probe USING fts5(text);INSERT INTO probe VALUES (\'audit\')');assert.equal(db.prepare("SELECT count(*) AS n FROM probe WHERE probe MATCH 'audit'").get().n,1);emit({scenario:'runtime',node:process.version,platform:process.platform,sqlite:db.prepare('SELECT sqlite_version() AS v').get().v,FTS5:true});db.close();
// Relative path pins original file; second adapter and independent process excluded, then recover.
const cwd=process.cwd(),f=await fixture();let relative;
try{mkdirSync(join(f.root,'other'));process.chdir(f.root);relative=new SqliteKnowledgeAdapter('canonical.sqlite',{busy_timeout_ms:0});process.chdir(join(f.root,'other'));await relative.withWriteFence('app-r5',async()=>{assert.equal(writer(f.knowledgePath),'BLOCKED:5');const second=new DatabaseSync(f.knowledgePath);second.exec('PRAGMA busy_timeout=0');assert.throws(()=>second.exec('BEGIN IMMEDIATE'));second.close();});assert.equal(writer(f.knowledgePath),'WRITABLE');assert.equal(existsSync(join(f.root,'other','canonical.sqlite')),false);emit({scenario:'relative-cwd',samePhysicalFile:true,otherConnectionAndProcessBlocked:true,recovered:true,noStrayFile:true});}finally{relative?.close();process.chdir(cwd);clean(f);}
// Actual rename/replacement on this Windows host, both before acquisition and while held.
for(const phase of ['before','inside'])for(const replacement of [false,true]){const f=await fixture();const moved=f.knowledgePath+'.moved';let renamed=false,callback=false,code;try{const swap=()=>{renameSync(f.knowledgePath,moved);renamed=true;if(replacement){const d=new DatabaseSync(f.knowledgePath);d.exec('CREATE TABLE marker(n)');d.close();}};if(phase==='before'){try{swap();}catch(e){code=e.code;}if(renamed){try{await f.store.withWriteFence('app-r5',async()=>{callback=true;});}catch(e){code=e.code;}assert.equal(callback,false);assert.equal(existsSync(f.knowledgePath),replacement);}}else{await f.store.withWriteFence('app-r5',async()=>{callback=true;try{swap();}catch(e){code=e.code;}if(renamed&&replacement)assert.equal(writer(f.knowledgePath),'WRITABLE');});}emit({scenario:'file-identity',phase,replacement,renamed,callback,code,pathExists:existsSync(f.knowledgePath),identity:renamed?{original:statSync(moved).ino,replacement:replacement?statSync(f.knowledgePath).ino:null}:undefined});}finally{clean(f);}}
// Cooperative host writers, raw filesystem writers, and a Windows case alias, before/after last callback.
for(const action of ['declare_non_applicable','accept_gaps','close','waive'])for(const stage of ['entry','after-callback'])for(const mode of ['official','raw','official-case-alias']){
 const f=await fixture(action==='accept_gaps'?{}:opts),cmd=await command(f,action),before=f.closureStore.read(f.context),h=history(f);let pending,done=false,observedWhileHeld=false;const original=f.closureStore.transaction.bind(f.closureStore);
 const mutate=async()=>{const life=JSON.parse(readFileSync(f.lifecyclePath));life.session.id='changed-session';life.session.plan[0].path='/changed-binding';if(mode==='raw'){writeFileSync(f.lifecyclePath,JSON.stringify(life));done=true;}else{const root=mode==='official-case-alias'?f.root.toUpperCase():f.root;pending=new FileSystemStorage({rootDir:root}).saveLifecycleState(life).then(()=>{done=true;});await sleep(180);}observedWhileHeld=done;};
 f.closureStore.transaction=async(scope,op)=>{if(stage==='entry')await mutate();return original(scope,async snap=>{const r=await op(snap);if(stage==='after-callback')await mutate();return r;});};
 try{const result=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>makeDecision(r)}).execute('catalog',cmd);await pending;if(result.status==='blocked')unchanged(f,before,h);const after=f.closureStore.read(f.context);emit({scenario:'lifecycle',action,stage,mode,writerCompletedDuringFence:observedWhileHeld,status:result.status,code:result.code,approvals:after.approvals.length,changedSession:JSON.parse(readFileSync(f.lifecyclePath)).session.id});}finally{clean(f);}
}
// All fingerprint inputs before review completion, with cooperative update API.
for(const mutation of ['session','plan','state','phase','binding-revision']){let f;f=await fixture({gateway:{reviewClosure:async r=>{if(mutation==='binding-revision'){const m=await f.store.get('app-r5','module','mod-catalog');await f.store.commit('app-r5',[{kind:'module',expected_revision:m.revision,entity:{...m.entity,title:'changed'},trace:m.trace}]);}else await new FileSystemStorage({rootDir:f.root}).updateLifecycleState(s=>{if(mutation==='session')s.session.id='other';if(mutation==='plan')s.session.plan[0].path='/other';if(mutation==='state')s.modules.catalog.state='observed';if(mutation==='phase')s.phase='WRAP_UP';return s;});return makeDecision(r);}}});try{const before=f.closureStore.read(f.context),h=history(f);const result=await f.closureService.execute('catalog',await command(f,'declare_non_applicable'));assert.equal(result.status,'blocked');unchanged(f,before,h);emit({scenario:'gateway-context',mutation,status:result.status,code:result.code,unchanged:true});}finally{clean(f);}}
// accept_gaps: real existing gap, exact proposal/receipt, then repeat and changed reason.
{let calls=0,request;const f=await fixture({gateway:{reviewClosure:async r=>{calls++;request=structuredClone(r);return makeDecision(r);}}});try{const cmd=await command(f,'accept_gaps'),base=await f.coverageService.evaluate('catalog');const result=await f.closureService.execute('catalog',cmd);assert.equal(result.status,'gaps_accepted');const snap=f.closureStore.read(f.context),gap=snap.acceptedGaps.catalog[0];assert.equal(gap.id,cmd.accepted_gaps[0].gap_id);assert.equal(gap.reason,reason);assert.equal(gap.acceptance_receipt,result.decision_id);assert.equal(request.coverageDigest,base.assessment.coverage_digest);assert.deepEqual(request.acceptedGaps,cmd.accepted_gaps);assert.deepEqual(f.openClosureStore().read(f.context),snap);const h=history(f),repeat=await f.closureService.execute('catalog',cmd),changed=await f.closureService.execute('catalog',{...cmd,accepted_gaps:[{...cmd.accepted_gaps[0],reason:reason+' diferente'}]});unchanged(f,snap,h);emit({scenario:'accept-real-gap',gapId:gap.id,status:result.status,receipt:gap.acceptance_receipt,exactReason:true,readback:true,calls,repeat:{status:repeat.status,code:repeat.code,idempotent:repeat.idempotent},changedReason:{status:changed.status,code:changed.code},historyUnchanged:true});}finally{clean(f);}}
for(const kind of ['missing','duplicate','reason-replay','requirement-drift','new-requirement','gateway-null','gateway-reject']){let calls=0,oldDecision,f;f=await fixture({observationalReqs:[{category:'security',title:'Synthetic pending'}],gateway:{reviewClosure:async r=>{calls++;if(kind==='reason-replay'&&calls===1){oldDecision=makeDecision(r);return null;}if(kind==='reason-replay')return oldDecision;if(kind==='gateway-null')return null;if(kind==='gateway-reject')return makeDecision(r,'reject');if(kind==='requirement-drift'||kind==='new-requirement'){const x=await f.store.get('app-r5','requirement','req-obs-1');await f.store.commit('app-r5',[{kind:'requirement',expected_revision:kind==='new-requirement'?0:x.revision,entity:{...x.entity,id:kind==='new-requirement'?'new-pending':x.id,title:'Changed pending'},trace:x.trace}]);}return makeDecision(r);}}});try{let cmd=await command(f,'accept_gaps');if(kind==='missing')cmd.accepted_gaps[0].gap_id='nonexistent';if(kind==='duplicate')cmd.accepted_gaps.push({...cmd.accepted_gaps[0]});const before=f.closureStore.read(f.context),h=history(f),life=readFileSync(f.lifecyclePath,'utf8');if(kind==='reason-replay'){await f.closureService.execute('catalog',cmd);cmd.accepted_gaps[0].reason+=' cambiado';}const result=await f.closureService.execute('catalog',cmd);assert.equal(result.status,'blocked');unchanged(f,before,h);assert.equal(readFileSync(f.lifecyclePath,'utf8'),life);assert.equal((await f.store.query('app-r5','relation')).items.length,0);emit({scenario:'accept-negative',kind,calls,code:result.code,authorizationHistoryReceiptsUnchanged:true});}finally{clean(f);}}
// Expiry after last callback: durable commit can still occur later.
for(const action of ['declare_non_applicable','accept_gaps','close','waive']){const f=await fixture(action==='accept_gaps'?{}:opts),cmd=await command(f,action),original=f.closureStore.transaction.bind(f.closureStore);let expires;f.closureStore.transaction=(scope,op)=>original(scope,async snap=>{const result=await op(snap);await sleep(Math.max(0,expires-Date.now()+40));return result;});try{const result=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>{expires=Date.now()+350;return {...makeDecision(r),expiresAt:new Date(expires).toISOString()};}}).execute('catalog',cmd);assert.equal(f.closureStore.read(f.context).approvals.length,1);assert.ok(Date.now()>expires);emit({scenario:'expired-before-commit',action,status:result.status,approvalDurable:true,msPastDeadline:Date.now()-expires});}finally{clean(f);}}
// Duplicate concurrent consumers and competing actions, separate physical adapters and stores.
for(const pair of [['waive','waive'],['close','waive'],['declare_non_applicable','waive'],['accept_gaps','accept_gaps']]){const f=await fixture(pair[0]==='accept_gaps'?{}:opts),other=f.openClosureStore(),k=new SqliteKnowledgeAdapter(f.knowledgePath),gateway={reviewClosure:async r=>makeDecision(r)};try{const a=new CanonicalClosureService(f.store,f.context,f.closureStore,gateway),b=new CanonicalClosureService(k,f.context,other,gateway),commands=await Promise.all(pair.map(x=>command(f,x)));const results=await Promise.all([a.execute('catalog',commands[0]),b.execute('catalog',commands[1])]);const snap=f.closureStore.read(f.context),retry=await b.execute('catalog',commands[1]);emit({scenario:'competition',pair,results:results.map(r=>({status:r.status,code:r.code,idempotent:r.idempotent})),approvals:snap.approvals.length,closures:Object.keys(snap.closures).length,receipts:(await f.store.query('app-r5','relation')).items.length,retry:{status:retry.status,code:retry.code,idempotent:retry.idempotent}});}finally{k.close();other.close();clean(f);}}
// Process kill releases SQLite and proper-lockfile stale host fence; use a live handle.
{const f=await fixture(),url=new URL('../audit-r4-r10/packages/mcp/node_modules/.audit-r11/fixture.mjs',import.meta.url).href;const child=spawn(process.execPath,['--input-type=module','-e',`import {SqliteKnowledgeAdapter,FileSystemStorage} from ${JSON.stringify(url)};const k=new SqliteKnowledgeAdapter(process.argv[1]);await new FileSystemStorage({rootDir:process.argv[2]}).withLifecycleFence(()=>k.withWriteFence('app-r5',async()=>{console.log('HELD');setInterval(()=>{},1000);await new Promise(()=>{});}));`,f.knowledgePath,f.root],{stdio:['ignore','pipe','pipe']});try{await new Promise((resolve,reject)=>{child.stdout.on('data',b=>{if(b.toString().includes('HELD'))resolve();});child.on('error',reject);child.on('exit',c=>reject(Error('early exit '+c)));});assert.equal(writer(f.knowledgePath),'BLOCKED:5');const ended=once(child,'exit');child.kill();await ended;assert.equal(writer(f.knowledgePath),'WRITABLE');let initial;try{await new FileSystemStorage({rootDir:f.root}).withLifecycleFence(async()=>{});initial='acquired';}catch(e){initial=e.code;}await sleep(11000);await new FileSystemStorage({rootDir:f.root}).withLifecycleFence(async()=>{});assert.equal(f.closureStore.read(f.context).approvals.length,0);emit({scenario:'process-kill',sqliteReleased:true,lifecycleFirstAttempt:initial,lifecycleAfterStale:true,zeroApprovals:true});}finally{child.kill();clean(f);}}
```

### context.mjs

```javascript
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {fixture,makeDecision,CanonicalClosureService,FileSystemStorage} from '../audit-r4-r10/packages/mcp/node_modules/.audit-r11/fixture.mjs';
const categories=['functional','business_rule','security','ui','ux','regression','performance'],all={confirmedReqs:categories.map(category=>({category,title:category}))};
const reason='Razón sintética sustantiva y aislada para verificar el contrato';
const command=async(f,action)=>action==='accept_gaps'?{action,accepted_gaps:[{gap_id:(await f.coverageService.evaluate('catalog')).assessment.gaps.find(g=>g.status==='unaddressed').id,reason}]}:action==='declare_non_applicable'?{action,decisions:[{category:'performance',reason}]}:action==='waive'?{action,reason}:{action};
const emit=x=>console.log(JSON.stringify(x));const clean=f=>{f.closureStore.close();f.store.close();};
const mutate=(s,kind)=>{if(kind==='session')s.session.id='new';if(kind==='plan')s.session.plan[0].path='/new';if(kind==='state')s.modules.catalog.state='observed';if(kind==='phase')s.phase='WRAP_UP';return s;};
for(const action of ['declare_non_applicable','accept_gaps','close','waive'])for(const kind of ['session','plan','state','phase','binding'])for(const stage of ['gateway','transaction-entry']){const f=await fixture(action==='accept_gaps'?{}:all),cmd=await command(f,action),before=f.closureStore.read(f.context),life=readFileSync(f.lifecyclePath,'utf8');let writerBlocked=false;const mutation=async()=>{if(kind==='binding'){const m=await f.store.get('app-r5','module','mod-catalog');try{await f.store.commit('app-r5',[{kind:'module',expected_revision:m.revision,entity:{...m.entity,title:'Changed binding revision'},trace:m.trace}]);}catch(e){assert.equal(e.code,'UNAVAILABLE');writerBlocked=true;throw e;}}else if(stage==='gateway')await new FileSystemStorage({rootDir:f.root}).updateLifecycleState(s=>mutate(s,kind));else writeFileSync(f.lifecyclePath,JSON.stringify(mutate(JSON.parse(readFileSync(f.lifecyclePath)),kind)));};const original=f.closureStore.transaction.bind(f.closureStore);if(stage==='transaction-entry')f.closureStore.transaction=async(scope,op)=>{await mutation();return original(scope,op);};try{const result=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>{if(stage==='gateway')await mutation();return makeDecision(r);}}).execute('catalog',cmd);assert.equal(result.status,'blocked');assert.deepEqual(f.closureStore.read(f.context),before);assert.equal((await f.store.query('app-r5','relation')).items.length,0);if(kind==='binding'&&stage==='transaction-entry')assert.equal(readFileSync(f.lifecyclePath,'utf8'),life);emit({scenario:'context-matrix',action,kind,stage,code:result.code,writerBlocked,zeroAuthorization:true});}finally{clean(f);}}
// Instrument lock order with original methods, without introducing recursive acquisition.
{const f=await fixture(all),events=[];const life=FileSystemStorage.prototype.withLifecycleFence,knowledge=f.store.withWriteFence.bind(f.store),tx=f.closureStore.transaction.bind(f.closureStore);let fsHeld=false,kHeld=false;
 FileSystemStorage.prototype.withLifecycleFence=function(op){events.push('lifecycle-request');return life.call(this,async()=>{fsHeld=true;events.push('lifecycle-held');try{return await op();}finally{fsHeld=false;events.push('lifecycle-release');}});};
 f.store.withWriteFence=(app,op)=>{assert.equal(fsHeld,true);events.push('knowledge-request');return knowledge(app,async()=>{kHeld=true;events.push('knowledge-held');try{return await op();}finally{kHeld=false;events.push('knowledge-release');}});};
 f.closureStore.transaction=(scope,op)=>{assert.equal(fsHeld,true);assert.equal(kHeld,true);events.push('closure-request');return tx(scope,async s=>{events.push('closure-callback');return op(s);});};
 try{const result=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>{assert.equal(fsHeld,false);assert.equal(kHeld,false);events.push('gateway-no-lock');return makeDecision(r);}}).execute('catalog',await command(f,'close'));assert.equal(result.status,'closed');emit({scenario:'lock-order',events,completedWithoutDeadlock:true});}finally{FileSystemStorage.prototype.withLifecycleFence=life;clean(f);}}
// Actual disappearance attempt is prevented by this Windows SQLite open handle.
{const f=await fixture();try{let code;try{unlinkSync(f.knowledgePath);}catch(e){code=e.code;}assert.ok(code);emit({scenario:'unlink-open-file',code,disappearanceNotAchieved:true});}finally{clean(f);}}
```

### extra.mjs

```javascript
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,statSync,realpathSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fixture,makeDecision,CanonicalClosureService,SqliteKnowledgeAdapter,FileSystemStorage} from '../audit-r4-r10/packages/mcp/node_modules/.audit-r11/fixture.mjs';
import {CanonicalClosureService as OldClosure} from '../audit-r4-r10/packages/mcp/node_modules/.audit-r11/old-closure.mjs';
const emit=x=>console.log(JSON.stringify(x));const close=f=>{f.closureStore.close();f.store.close();};
const categories=['functional','business_rule','security','ui','ux','regression','performance'];
const all={confirmedReqs:categories.map(category=>({category,title:category}))};
const reason='Razón sintética sustantiva y aislada para verificar el contrato';
const cmd=async(f,action)=>action==='accept_gaps'?{action,accepted_gaps:[{gap_id:(await f.coverageService.evaluate('catalog')).assessment.gaps.find(g=>g.status==='unaddressed').id,reason}]}:action==='declare_non_applicable'?{action,decisions:[{category:'performance',reason}]}:action==='waive'?{action,reason}:{action};
const hist=f=>{const d=new DatabaseSync(f.closureStorePath,{readOnly:true});try{return d.prepare('SELECT generation,hex(payload) AS payload FROM closure_history').all();}finally{d.close();}};
// Persisted R9 closures retain their existing authority and exact ciphertext/history under R10.
for(const terminal of ['closed','waived']){const f=await fixture(all);try{const old=new OldClosure(f.store,f.context,f.closureStore,{reviewClosure:async r=>makeDecision(r)});assert.equal((await old.execute('catalog',await cmd(f,terminal==='closed'?'close':'waive'))).status,terminal);const before=f.closureStore.read(f.context),h=hist(f),relations=await f.store.query('app-r5','relation'),life=readFileSync(f.lifecyclePath,'utf8');assert.equal((await f.closureService.status('catalog')).state,terminal);assert.equal((await f.closureService.execute('catalog',{action:'close'})).idempotent,true);assert.deepEqual(f.closureStore.read(f.context),before);assert.deepEqual(hist(f),h);assert.deepEqual(await f.store.query('app-r5','relation'),relations);assert.equal(readFileSync(f.lifecyclePath,'utf8'),life);const reopened=f.openClosureStore();assert.deepEqual(reopened.read(f.context),before);reopened.close();emit({scenario:'historical-r9',terminal,authorityPreserved:true,noNewApprovalReceiptHistoryOrTransition:true,readback:true});}finally{close(f);}}
// A pending exact R9 applicability request retains its digest and can be independently authorized in R10.
{const f=await fixture();try{let request;await new OldClosure(f.store,f.context,f.closureStore,{reviewClosure:async r=>{request=r;return null;}}).execute('catalog',await cmd(f,'declare_non_applicable'));const result=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>{assert.equal(r.requestDigest,request.requestDigest);return makeDecision(request);}}).execute('catalog',await cmd(f,'declare_non_applicable'));assert.equal(result.status,'declared_non_applicable');emit({scenario:'r9-pending-applicability',digestUnchanged:true,status:result.status});}finally{close(f);}}
// Failure after operation has edited snapshot physically rolls back history/receipts/lifecycle, fences recover.
for(const action of ['declare_non_applicable','accept_gaps','close','waive']){const f=await fixture(action==='accept_gaps'?{}:all),command=await cmd(f,action),other=new SqliteKnowledgeAdapter(f.knowledgePath,{busy_timeout_ms:0}),before=f.closureStore.read(f.context),h=hist(f),life=readFileSync(f.lifecyclePath,'utf8'),original=f.closureStore.transaction.bind(f.closureStore);f.closureStore.transaction=(scope,op)=>original(scope,async snap=>{await op(snap);throw Error('external fault before physical commit');});try{const result=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>makeDecision(r)}).execute('catalog',command);assert.equal(result.status,'blocked');assert.deepEqual(f.closureStore.read(f.context),before);assert.deepEqual(hist(f),h);assert.equal(readFileSync(f.lifecyclePath,'utf8'),life);assert.equal((await f.store.query('app-r5','relation')).items.length,0);await other.withWriteFence('app-r5',async()=>{});await new FileSystemStorage({rootDir:f.root}).withLifecycleFence(async()=>{});emit({scenario:'rollback',action,code:result.code,allAuthorizationStateUnchanged:true,bothFencesReleased:true});}finally{other.close();close(f);}}
// A separate physical process uses only the official update API, canonical spelling vs Windows case alias.
for(const alias of [false,true]){const f=await fixture(),url=new URL('../audit-r4-r10/packages/mcp/node_modules/.audit-r11/fixture.mjs',import.meta.url).href;let child,done=false,err='',started;try{await new FileSystemStorage({rootDir:f.root}).withLifecycleFence(async()=>{const root=alias?f.root.toUpperCase():f.root;assert.equal(statSync(root).ino,statSync(f.root).ino);assert.equal(statSync(root).dev,statSync(f.root).dev);child=spawn(process.execPath,['--input-type=module','-e',`import {FileSystemStorage} from ${JSON.stringify(url)};console.log('STARTED');await new FileSystemStorage({rootDir:process.argv[1]}).updateLifecycleState(s=>{s.session.id='official-process';return s;});console.log('DONE');`,root],{stdio:['ignore','pipe','pipe']});started=new Promise((resolve,reject)=>{child.stdout.on('data',b=>{if(b.toString().includes('STARTED'))resolve();if(b.toString().includes('DONE'))done=true;});child.on('error',reject);});child.stderr.on('data',b=>{err+=b;});await started;await new Promise(r=>setTimeout(r,300));emit({scenario:'official-process-lifecycle',alias,writerCompletedDuringFence:done,sessionDuringFence:JSON.parse(readFileSync(f.lifecyclePath)).session.id,samePhysicalRoot:true});assert.equal(done,false);});if(!done)await once(child,'exit');assert.equal(JSON.parse(readFileSync(f.lifecyclePath)).session.id,'official-process');emit({scenario:'official-process-recovery',alias,writerRecovered:true});}finally{if(child?.exitCode===null)child.kill();close(f);}}
// FIFO is not a bounded reentrant lock: do not hold it while awaiting itself. Observe boundedly, release outer.
{const f=await fixture();let entered=false,nested;try{await f.store.withWriteFence('app-r5',async()=>{nested=f.store.withWriteFence('app-r5',async()=>{entered=true;});await new Promise(r=>setTimeout(r,50));assert.equal(entered,false);});await nested;assert.equal(entered,true);emit({scenario:'fifo-queued-consumer',progressAfterRelease:true});}finally{close(f);}}
```

### process.mjs

```javascript
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fixture,makeDecision,CanonicalClosureService} from '../audit-r4-r10/packages/mcp/node_modules/.audit-r11/fixture.mjs';
const emit=x=>console.log(JSON.stringify(x));
const f=await fixture(),url=new URL('../audit-r4-r10/packages/mcp/node_modules/.audit-r11/fixture.mjs',import.meta.url).href;
const code=`import {SqliteKnowledgeAdapter,SqliteModuleClosureStore,CanonicalClosureService,makeDecision} from ${JSON.stringify(url)};
let release;process.on('message',async m=>{if(m.type==='go'){release();return;}if(m.type!=='start')return;const k=new SqliteKnowledgeAdapter(m.knowledgePath),s=new SqliteModuleClosureStore({...m.options,key:Buffer.from(m.key,'base64')});try{const svc=new CanonicalClosureService(k,m.context,s,{reviewClosure:async r=>{process.send({type:'ready'});await new Promise(resolve=>{release=resolve;});return makeDecision(r);}});const result=await svc.execute('catalog',{action:'waive',reason:'Renuncia sintética aislada aprobada por gateway del proceso de prueba'});process.send({type:'result',status:result.status,code:result.code,idempotent:result.idempotent});}catch(e){process.send({type:'error',message:e.message});}finally{s.close();k.close();process.disconnect();}});`;
const children=[];
try{const jobs=[0,1].map(()=>{const child=spawn(process.execPath,['--input-type=module','-e',code],{stdio:['ignore','pipe','pipe','ipc']});children.push(child);let readyResolve,resultResolve;const ready=new Promise(r=>{readyResolve=r;}),result=new Promise((resolve,reject)=>{resultResolve=resolve;child.on('error',reject);child.on('exit',c=>{if(c)reject(Error('child exit '+c));});});child.on('message',m=>{if(m.type==='ready')readyResolve();if(m.type==='result')resultResolve(m);if(m.type==='error')resultResolve(m);});child.send({type:'start',knowledgePath:f.knowledgePath,context:f.context,key:f.closureKey.toString('base64'),options:{projectRoot:f.root,applicationId:'app-r5',environmentId:'local',path:f.closureStorePath,protection:'host_private_directory_and_managed_key'}});const exited=once(child,'exit');return {child,ready,result,exited};});await Promise.all(jobs.map(j=>j.ready));jobs.forEach(j=>j.child.send({type:'go'}));const results=await Promise.all(jobs.map(j=>j.result));await Promise.all(jobs.map(j=>j.exited));emit({scenario:'two-process-results-before-readback',results});assert.ok(results.some(r=>r.status==='waived'));const snap=f.closureStore.read(f.context);assert.equal(snap.approvals.length,1);assert.equal(Object.keys(snap.closures).length,1);assert.equal((await f.store.query('app-r5','relation')).items.length,1);const retry=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async()=>{throw Error('must not request new approval');}}).execute('catalog',{action:'close'});assert.equal(retry.idempotent,true);emit({scenario:'two-physical-closure-processes',results,singleApprovalClosureReceipt:true,retry:retry.status,idempotent:retry.idempotent});}finally{for(const c of children)if(c.exitCode===null)c.kill();f.closureStore.close();f.store.close();}
// Reusing one actual approval ID for another existing gap cannot consume authority twice.
{const f=await fixture({gateway:{reviewClosure:async r=>({...makeDecision(r),approvalId:'isolated-single-use-approval'})}});try{const assessment=(await f.coverageService.evaluate('catalog')).assessment;const command=g=>({action:'accept_gaps',accepted_gaps:[{gap_id:g.id,reason:'Razón sustantiva sintética exacta para aceptar esta brecha existente'}]});assert.equal((await f.closureService.execute('catalog',command(assessment.gaps[0]))).status,'gaps_accepted');const before=f.closureStore.read(f.context);const result=await f.closureService.execute('catalog',command(assessment.gaps[1]));assert.equal(result.status,'blocked');assert.deepEqual(f.closureStore.read(f.context),before);emit({scenario:'accept-approval-reuse',code:result.code,snapshotUnchanged:true,approvals:before.approvals.length});}finally{f.closureStore.close();f.store.close();}}
```

### process-mixed.mjs

```javascript
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fixture,makeDecision,CanonicalClosureService} from '../audit-r4-r10/packages/mcp/node_modules/.audit-r11/fixture.mjs';
const emit=x=>console.log(JSON.stringify(x));
const f=await fixture({confirmedReqs:['functional','business_rule','security','ui','ux','regression','performance'].map(category=>({category,title:category}))}),url=new URL('../audit-r4-r10/packages/mcp/node_modules/.audit-r11/fixture.mjs',import.meta.url).href;
const code=`import {SqliteKnowledgeAdapter,SqliteModuleClosureStore,CanonicalClosureService,makeDecision} from ${JSON.stringify(url)};
let release;process.on('message',async m=>{if(m.type==='go'){release();return;}if(m.type!=='start')return;const k=new SqliteKnowledgeAdapter(m.knowledgePath),s=new SqliteModuleClosureStore({...m.options,key:Buffer.from(m.key,'base64')});try{const svc=new CanonicalClosureService(k,m.context,s,{reviewClosure:async r=>{process.send({type:'ready'});await new Promise(resolve=>{release=resolve;});return makeDecision(r);}});const result=await svc.execute('catalog',m.action==='close'?{action:'close'}:{action:'waive',reason:'Renuncia sintética aislada aprobada por gateway del proceso de prueba'});process.send({type:'result',status:result.status,code:result.code,idempotent:result.idempotent});}catch(e){process.send({type:'error',message:e.message});}finally{s.close();k.close();process.disconnect();}});`;
const children=[];
try{const jobs=[0,1].map(idx=>{const child=spawn(process.execPath,['--input-type=module','-e',code],{stdio:['ignore','pipe','pipe','ipc']});children.push(child);let readyResolve,resultResolve;const ready=new Promise(r=>{readyResolve=r;}),result=new Promise((resolve,reject)=>{resultResolve=resolve;child.on('error',reject);child.on('exit',c=>{if(c)reject(Error('child exit '+c));});});child.on('message',m=>{if(m.type==='ready')readyResolve();if(m.type==='result')resultResolve(m);if(m.type==='error')resultResolve(m);});child.send({type:'start',action:idx===0?'close':'waive',knowledgePath:f.knowledgePath,context:f.context,key:f.closureKey.toString('base64'),options:{projectRoot:f.root,applicationId:'app-r5',environmentId:'local',path:f.closureStorePath,protection:'host_private_directory_and_managed_key'}});const exited=once(child,'exit');return {child,ready,result,exited};});await Promise.all(jobs.map(j=>j.ready));jobs.forEach(j=>j.child.send({type:'go'}));const results=await Promise.all(jobs.map(j=>j.result));await Promise.all(jobs.map(j=>j.exited));emit({scenario:'two-process-results-before-readback',results});assert.ok(results.every(r=>r.status==='waived'||r.status==='closed'));assert.equal(results[0].status,results[1].status);const snap=f.closureStore.read(f.context);assert.equal(snap.approvals.length,1);assert.equal(Object.keys(snap.closures).length,1);assert.equal((await f.store.query('app-r5','relation')).items.length,1);const retry=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async()=>{throw Error('must not request new approval');}}).execute('catalog',{action:'close'});assert.equal(retry.idempotent,true);emit({scenario:'two-physical-closure-processes',results,singleApprovalClosureReceipt:true,retry:retry.status,idempotent:retry.idempotent});}finally{for(const c of children)if(c.exitCode===null)c.kill();f.closureStore.close();f.store.close();}
```
