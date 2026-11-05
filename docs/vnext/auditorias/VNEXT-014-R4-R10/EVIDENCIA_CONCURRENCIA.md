# Evidencia de concurrencia R4-R10

Código exclusivo e7d3717d9311ed73736568b13ce99e131d617453. [Dictamen](INFORME.md). Las sondas operan solo en fixtures externas aisladas y usan el producto compilado/source bundling sin modificarlo. Decoradores del puerto ClosureStore introducen intercalados deterministas y retornan al método físico original que hace BEGIN/INSERT/COMMIT. No se cambiaron evaluadores ni validadores. Los gateways/requisitos sintéticos prueban contratos del servicio; **no certifican consentimiento humano ni recorrido integrado**.

## A01 — exclusión condicionada y P1 por alias Windows

Reproducción mínima: crear fixture; servicio usa projectRoot original; decorar transaction para ejecutar callback original y después await FileSystemStorage({rootDir:root.toUpperCase()}).saveLifecycleState con session.id y plan.path cambiados; solo entonces retornar al transaction físico. Cambia la misma carpeta/archivo (dev/ino iguales); writer termina antes del COMMIT. declare_non_applicable, accept_gaps con brecha real, close y waive guardan una aprobación. Repetir con root idéntico: writer no termina durante fence y recupera al salir. Otro proceso con updateLifecycleState reproduce alias=true escribe durante fence, alias=false espera. No se certifica una ruta pública remota de ataque.

Fuente exacta: [file-storage.ts:91](https://github.com/Hyouka73/QAMCP/blob/e7d3717d9311ed73736568b13ce99e131d617453/packages/knowledge/src/storage/file-storage.ts#L91); [adquisición de fences y revalidación:688](https://github.com/Hyouka73/QAMCP/blob/e7d3717d9311ed73736568b13ce99e131d617453/packages/mcp/src/handlers/canonical-closure-service.ts#L688).

Causa: file-storage.ts withLock usa sha256(targetPath) como nombre de lock personalizado; targetPath conserva capitalización de entrada. proper-lockfile puede resolver target, pero recibe dos lockfilePath distintos en la misma carpeta física. Además realpathSync en este host devolvió casing de entrada en la prueba: asumir normalización universal solo por realpath es insuficiente. Propuesta: namespace estable del proyecto físico + slot lifecycle idéntico para todos sus escritores, consciente de semántica de mayúsculas del volumen; evitar identidad del inode del propio lifecycle como único lock, porque save hace rename atómico y cambia ese inode. Verificar aliases, junctions/symlinks soportados y procesos físicos.

El fingerprint completo session/plan/state/phase/binding se comprueba de nuevo en las cuatro ramas. Matriz40 casos: gateway con escritor oficial y transaction-entry con raw para session/plan/state/phase, y revisión Knowledge de binding. Todos bloqueados sin autorización; revisión bajo fence no escribe. Raw después del callback persiste: está fuera del contrato cooperativo y se declara como límite, no como prueba de que el lock oficial funciona. Alias oficial después del callback es el defecto P1 dentro de ese contrato. Orden observado: gateway sin locks → lifecycle → Knowledge → ClosureStore → release Knowledge → release lifecycle. Ningún deadlock en esas rutas; no se demuestra ausencia universal ante adquisición inversa/reentrante por consumidores ajenos.

## A02 — identidad SQLite y procesos

Relative cwd cambia antes del fence: otra conexión y otro proceso a la ruta original reciben SQLITE_BUSY/5 mientras se sostiene BEGIN IMMEDIATE; no se crea otro archivo en cwd nuevo. Después se recupera escritura. Renombrar o unlink el archivo abierto antes/dentro del fence se intentó realmente y Windows devolvió EBUSY. Por ello **no** se etiqueta como PASS la detección de ausencia/sustitución: no se alcanzó esa condición física. Inspección: resolve al construir, realpath/dev:ino antes de abrir, tras abrir y bajo lock; DB usa ruta canónica y cola local. Es una garantía condicionada a identidad y filesystem estable del host, no prueba universal por dev/ino, ni transacción FS. DatabaseSync(readOnly:false) no equivale por sí solo a open sin creación; sigue habiendo check/open en el diseño, aunque este host impide rename/unlink del archivo abierto.

Kill físico de proceso titular con handle vivo: SQLite libera escritura inmediatamente; lock lifecycle proper-lockfile inicialmente ELOCKED y después de stale10s se recupera. Cero autorizaciones creadas. Es recuperación de lock, no certificación de cada ventana de crash entre bases. FIFO de otro consumidor progresa al salir el titular; no se certifica reentrancia de withWriteFence ni se debe esperar el mismo lock desde su callback.

## A05 — aceptación existente y negativos

Gap real derivado por Coverage: gap:catalog:functional:unknown_applicability. Gateway recibe digest de cobertura base y lista exacta gap_id/reason; antes de decisión no hay accepted_gap con recibo inventado. Tras decisión correlacionada, se persiste aceptación con reason exacta y acceptance_receipt=approvalId, un par aprobación/digest y readback de segunda conexión. No crea cierre, relación terminal ni transición lifecycle. No confundir receipt embebido de aceptación con relation de cierre.

IDs inexistentes/duplicados: cero llamadas al gateway. Ya aceptado, incluso razón distinta: blocked/closure_gap_selection_invalid, sin writes adicionales. Mismo request con motivo cambiado + decisión anterior: closure_review_invalid. Revisión/requisito nuevo durante gateway: closure_context_changed. Gateway null/reject no consume. approvalId reutilizado para otro gap existente bloquea y snapshot queda intacto. Retry idéntico ya aceptado **no** devuelve idempotent:true; es seguridad sin duplicación, no idempotencia de respuesta. Conviene reconciliar el contrato de replay con receipt previo.

## A03 / A04 / historia / rollback

Local con adapters Knowledge y ClosureStore independientes: waive+waive devuelve ganador waived y perdedor blocked/context_changed, sin doble consumo; retry externo sí idempotente. close/waive y declare/waive conservan un terminal/approval/receipt; accept/accept uno aceptado y otro bloqueado sin cierre ni relation terminal. Un par físico multiproceso llegó waived+waived/idempotent; el comportamiento depende del intercalado y no corrige el FAIL local repetido por suite aislada e integral. Causa residual: helper exige resolución de WORKING antes de leer terminal válido y retorna blocked antes del catch/retry exterior. Corregir lectura autorizada del ganador bajo serialización; no debilitar Scenario4.

En todas las cuatro acciones, esperar hasta expiresAt+40ms después del callback original y antes del retorno a ClosureStore permite commit/aprobación durable caducada. Comprobaciones anteriores no garantizan vigencia a commit. Si consumo se define en otro instante, documentar/aceptar explícitamente ese contrato; no lo inventa la auditoría.

Fallos lanzados tras editar snapshot pero antes de commit hacen rollback físico sin cambio de closure_history/payload, aprobaciones/decisiones/gaps/cierres, relaciones ni lifecycle; ambos fences recuperables. Cierres R9 generados por servicio exacto09c9ce conservan autoridad e historial cifrado, recibos y lifecycle al status/retry R10; solicitud pendiente R9 de aplicabilidad mantiene digest. Sin migrar/recalcular autoridad histórica ni inventar transiciones.

## Salidas completas finales de sondas

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
{"scenario":"lifecycle","action":"declare_non_applicable","stage":"entry","mode":"official-case-alias","writerCompletedDuringFence":true,"status":"blocked","code":"closure_consistency_conflict","approvals":0,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"declare_non_applicable","stage":"after-callback","mode":"official","writerCompletedDuringFence":false,"status":"declared_non_applicable","approvals":1,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"declare_non_applicable","stage":"after-callback","mode":"raw","writerCompletedDuringFence":true,"status":"declared_non_applicable","approvals":1,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"declare_non_applicable","stage":"after-callback","mode":"official-case-alias","writerCompletedDuringFence":true,"status":"declared_non_applicable","approvals":1,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"accept_gaps","stage":"entry","mode":"official","writerCompletedDuringFence":false,"status":"gaps_accepted","approvals":1,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"accept_gaps","stage":"entry","mode":"raw","writerCompletedDuringFence":true,"status":"blocked","code":"closure_consistency_conflict","approvals":0,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"accept_gaps","stage":"entry","mode":"official-case-alias","writerCompletedDuringFence":true,"status":"blocked","code":"closure_consistency_conflict","approvals":0,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"accept_gaps","stage":"after-callback","mode":"official","writerCompletedDuringFence":false,"status":"gaps_accepted","approvals":1,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"accept_gaps","stage":"after-callback","mode":"raw","writerCompletedDuringFence":true,"status":"gaps_accepted","approvals":1,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"accept_gaps","stage":"after-callback","mode":"official-case-alias","writerCompletedDuringFence":true,"status":"gaps_accepted","approvals":1,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"close","stage":"entry","mode":"official","writerCompletedDuringFence":false,"status":"closed","approvals":1,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"close","stage":"entry","mode":"raw","writerCompletedDuringFence":true,"status":"blocked","code":"closure_consistency_conflict","approvals":0,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"close","stage":"entry","mode":"official-case-alias","writerCompletedDuringFence":true,"status":"blocked","code":"closure_consistency_conflict","approvals":0,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"close","stage":"after-callback","mode":"official","writerCompletedDuringFence":false,"status":"closed","approvals":1,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"close","stage":"after-callback","mode":"raw","writerCompletedDuringFence":true,"status":"closed","approvals":1,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"close","stage":"after-callback","mode":"official-case-alias","writerCompletedDuringFence":true,"status":"closed","approvals":1,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"waive","stage":"entry","mode":"official","writerCompletedDuringFence":false,"status":"waived","approvals":1,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"waive","stage":"entry","mode":"raw","writerCompletedDuringFence":true,"status":"blocked","code":"closure_consistency_conflict","approvals":0,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"waive","stage":"entry","mode":"official-case-alias","writerCompletedDuringFence":true,"status":"blocked","code":"closure_consistency_conflict","approvals":0,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"waive","stage":"after-callback","mode":"official","writerCompletedDuringFence":false,"status":"waived","approvals":1,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"waive","stage":"after-callback","mode":"raw","writerCompletedDuringFence":true,"status":"waived","approvals":1,"changedSession":"changed-session"}
{"scenario":"lifecycle","action":"waive","stage":"after-callback","mode":"official-case-alias","writerCompletedDuringFence":true,"status":"waived","approvals":1,"changedSession":"changed-session"}
{"scenario":"gateway-context","mutation":"session","status":"blocked","code":"closure_context_changed","unchanged":true}
{"scenario":"gateway-context","mutation":"plan","status":"blocked","code":"closure_context_changed","unchanged":true}
{"scenario":"gateway-context","mutation":"state","status":"blocked","code":"closure_context_changed","unchanged":true}
{"scenario":"gateway-context","mutation":"phase","status":"blocked","code":"closure_context_changed","unchanged":true}
{"scenario":"gateway-context","mutation":"binding-revision","status":"blocked","code":"closure_context_changed","unchanged":true}
{"scenario":"accept-real-gap","gapId":"gap:catalog:functional:unknown_applicability","status":"gaps_accepted","receipt":"ac292614-c48a-4b6e-b9b4-aeca30aaaacf","exactReason":true,"readback":true,"calls":1,"repeat":{"status":"blocked","code":"closure_gap_selection_invalid"},"changedReason":{"status":"blocked","code":"closure_gap_selection_invalid"},"historyUnchanged":true}
{"scenario":"accept-negative","kind":"missing","calls":0,"code":"closure_gap_selection_invalid","authorizationHistoryReceiptsUnchanged":true}
{"scenario":"accept-negative","kind":"duplicate","calls":0,"code":"closure_gap_selection_invalid","authorizationHistoryReceiptsUnchanged":true}
{"scenario":"accept-negative","kind":"reason-replay","calls":2,"code":"closure_review_invalid","authorizationHistoryReceiptsUnchanged":true}
{"scenario":"accept-negative","kind":"requirement-drift","calls":1,"code":"closure_context_changed","authorizationHistoryReceiptsUnchanged":true}
{"scenario":"accept-negative","kind":"new-requirement","calls":1,"code":"closure_context_changed","authorizationHistoryReceiptsUnchanged":true}
{"scenario":"accept-negative","kind":"gateway-null","calls":1,"code":"closure_review_pending","authorizationHistoryReceiptsUnchanged":true}
{"scenario":"accept-negative","kind":"gateway-reject","calls":1,"code":"closure_review_rejected","authorizationHistoryReceiptsUnchanged":true}
{"scenario":"expired-before-commit","action":"declare_non_applicable","status":"declared_non_applicable","approvalDurable":true,"msPastDeadline":58}
{"scenario":"expired-before-commit","action":"accept_gaps","status":"gaps_accepted","approvalDurable":true,"msPastDeadline":58}
{"scenario":"expired-before-commit","action":"close","status":"closed","approvalDurable":true,"msPastDeadline":59}
{"scenario":"expired-before-commit","action":"waive","status":"waived","approvalDurable":true,"msPastDeadline":74}
{"scenario":"competition","pair":["waive","waive"],"results":[{"status":"waived"},{"status":"blocked","code":"closure_context_changed"}],"approvals":1,"closures":1,"receipts":1,"retry":{"status":"waived","idempotent":true}}
{"scenario":"competition","pair":["close","waive"],"results":[{"status":"closed"},{"status":"blocked","code":"closure_context_changed"}],"approvals":1,"closures":1,"receipts":1,"retry":{"status":"closed","idempotent":true}}
{"scenario":"competition","pair":["declare_non_applicable","waive"],"results":[{"status":"blocked","code":"closure_context_changed"},{"status":"waived"}],"approvals":1,"closures":1,"receipts":1,"retry":{"status":"waived","idempotent":true}}
{"scenario":"competition","pair":["accept_gaps","accept_gaps"],"results":[{"status":"blocked","code":"closure_context_changed"},{"status":"gaps_accepted"}],"approvals":1,"closures":0,"receipts":0,"retry":{"status":"blocked","code":"closure_gap_selection_invalid"}}
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
{"scenario":"official-process-lifecycle","alias":true,"writerCompletedDuringFence":true,"sessionDuringFence":"official-process","samePhysicalRoot":true}
{"scenario":"official-process-recovery","alias":true,"writerRecovered":true}
{"scenario":"fifo-queued-consumer","progressAfterRelease":true}
```

### process

```text
{"scenario":"two-process-results-before-readback","results":[{"type":"result","status":"waived","idempotent":true},{"type":"result","status":"waived"}]}
{"scenario":"two-physical-closure-processes","results":[{"type":"result","status":"waived","idempotent":true},{"type":"result","status":"waived"}],"singleApprovalClosureReceipt":true,"retry":"waived","idempotent":true}
{"scenario":"accept-approval-reuse","code":"closure_consistency_conflict","snapshotUnchanged":true,"approvals":1}
```

## Arneses externos reproducibles íntegros

Esbuild se resuelve desde tsup de la instalación congelada. Los archivos exportados quedan solo en node_modules/.audit-r10, nunca en fuentes versionadas. Los scripts siguientes se guardaron en ../r4-r10-evidence y se ejecutaron con TEMP/TMP=node_modules/.tmp-vnext. Paths absolutos deben adaptarse al clonar; mantener el SHA.

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
await build({stdin:{contents:fixture,resolveDir:root+'/packages/mcp/src/__tests__',loader:'ts'},bundle:true,packages:'external',platform:'node',format:'esm',outfile:root+'/packages/mcp/node_modules/.audit-r10/fixture.mjs'});
const stdio=readFileSync(root+'/docs/vnext/auditorias/VNEXT-014-R4-R7/COMANDOS.md','utf8').split('```javascript')[1].split('```')[0];
writeFileSync(root+'/packages/mcp/node_modules/.audit-r10/stdio.mjs',stdio);
```

### prepare-old.mjs

```javascript
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const root='C:/Users/Judirico/Documents/QAMCP/audit-r4-r10';const req=createRequire(root+'/package.json'),tr=createRequire(req.resolve('tsup/package.json'));const {build}=await import(pathToFileURL(tr.resolve('esbuild')));
const old=execFileSync('git',['show','09c9ce276c9c328026de4236dadf0a85d8e94d21:packages/mcp/src/handlers/canonical-coverage-service.ts'],{cwd:root,encoding:'utf8'});
const closure=execFileSync('git',['show','09c9ce276c9c328026de4236dadf0a85d8e94d21:packages/mcp/src/handlers/canonical-closure-service.ts'],{cwd:root,encoding:'utf8'});
for(const [name,contents] of [['old-coverage',old],['old-closure',closure]])await build({stdin:{contents,resolveDir:root+'/packages/mcp/src/handlers',loader:'ts'},bundle:true,packages:'external',platform:'node',format:'esm',outfile:root+'/packages/mcp/node_modules/.audit-r10/'+name+'.mjs',plugins:[{name:'exact-old-coverage',setup(b){b.onLoad({filter:/canonical-coverage-service\.ts$/},()=>({contents:old,loader:'ts',resolveDir:root+'/packages/mcp/src/handlers'}));}}]});
```

### probe.mjs

```javascript
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,renameSync,existsSync,mkdirSync,statSync,realpathSync} from 'node:fs';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {spawnSync,spawn} from 'node:child_process';
import {once} from 'node:events';
import {fixture,makeDecision,CanonicalClosureService,SqliteKnowledgeAdapter,FileSystemStorage} from '../audit-r4-r10/packages/mcp/node_modules/.audit-r10/fixture.mjs';
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
{const f=await fixture(),url=new URL('../audit-r4-r10/packages/mcp/node_modules/.audit-r10/fixture.mjs',import.meta.url).href;const child=spawn(process.execPath,['--input-type=module','-e',`import {SqliteKnowledgeAdapter,FileSystemStorage} from ${JSON.stringify(url)};const k=new SqliteKnowledgeAdapter(process.argv[1]);await new FileSystemStorage({rootDir:process.argv[2]}).withLifecycleFence(()=>k.withWriteFence('app-r5',async()=>{console.log('HELD');setInterval(()=>{},1000);await new Promise(()=>{});}));`,f.knowledgePath,f.root],{stdio:['ignore','pipe','pipe']});try{await new Promise((resolve,reject)=>{child.stdout.on('data',b=>{if(b.toString().includes('HELD'))resolve();});child.on('error',reject);child.on('exit',c=>reject(Error('early exit '+c)));});assert.equal(writer(f.knowledgePath),'BLOCKED:5');const ended=once(child,'exit');child.kill();await ended;assert.equal(writer(f.knowledgePath),'WRITABLE');let initial;try{await new FileSystemStorage({rootDir:f.root}).withLifecycleFence(async()=>{});initial='acquired';}catch(e){initial=e.code;}await sleep(11000);await new FileSystemStorage({rootDir:f.root}).withLifecycleFence(async()=>{});assert.equal(f.closureStore.read(f.context).approvals.length,0);emit({scenario:'process-kill',sqliteReleased:true,lifecycleFirstAttempt:initial,lifecycleAfterStale:true,zeroApprovals:true});}finally{child.kill();clean(f);}}
```

### context.mjs

```javascript
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {fixture,makeDecision,CanonicalClosureService,FileSystemStorage} from '../audit-r4-r10/packages/mcp/node_modules/.audit-r10/fixture.mjs';
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
import {fixture,makeDecision,CanonicalClosureService,SqliteKnowledgeAdapter,FileSystemStorage} from '../audit-r4-r10/packages/mcp/node_modules/.audit-r10/fixture.mjs';
import {CanonicalClosureService as OldClosure} from '../audit-r4-r10/packages/mcp/node_modules/.audit-r10/old-closure.mjs';
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
for(const alias of [false,true]){const f=await fixture(),url=new URL('../audit-r4-r10/packages/mcp/node_modules/.audit-r10/fixture.mjs',import.meta.url).href;let child,done=false,err='',started;try{await new FileSystemStorage({rootDir:f.root}).withLifecycleFence(async()=>{const root=alias?f.root.toUpperCase():f.root;assert.equal(statSync(root).ino,statSync(f.root).ino);assert.equal(statSync(root).dev,statSync(f.root).dev);child=spawn(process.execPath,['--input-type=module','-e',`import {FileSystemStorage} from ${JSON.stringify(url)};console.log('STARTED');await new FileSystemStorage({rootDir:process.argv[1]}).updateLifecycleState(s=>{s.session.id='official-process';return s;});console.log('DONE');`,root],{stdio:['ignore','pipe','pipe']});started=new Promise((resolve,reject)=>{child.stdout.on('data',b=>{if(b.toString().includes('STARTED'))resolve();if(b.toString().includes('DONE'))done=true;});child.on('error',reject);});child.stderr.on('data',b=>{err+=b;});await started;await new Promise(r=>setTimeout(r,300));emit({scenario:'official-process-lifecycle',alias,writerCompletedDuringFence:done,sessionDuringFence:JSON.parse(readFileSync(f.lifecyclePath)).session.id,samePhysicalRoot:true});assert.equal(done,alias);});if(!done)await once(child,'exit');assert.equal(JSON.parse(readFileSync(f.lifecyclePath)).session.id,'official-process');emit({scenario:'official-process-recovery',alias,writerRecovered:true});}finally{if(child?.exitCode===null)child.kill();close(f);}}
// FIFO is not a bounded reentrant lock: do not hold it while awaiting itself. Observe boundedly, release outer.
{const f=await fixture();let entered=false,nested;try{await f.store.withWriteFence('app-r5',async()=>{nested=f.store.withWriteFence('app-r5',async()=>{entered=true;});await new Promise(r=>setTimeout(r,50));assert.equal(entered,false);});await nested;assert.equal(entered,true);emit({scenario:'fifo-queued-consumer',progressAfterRelease:true});}finally{close(f);}}
```

### process.mjs

```javascript
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fixture,makeDecision,CanonicalClosureService} from '../audit-r4-r10/packages/mcp/node_modules/.audit-r10/fixture.mjs';
const emit=x=>console.log(JSON.stringify(x));
const f=await fixture(),url=new URL('../audit-r4-r10/packages/mcp/node_modules/.audit-r10/fixture.mjs',import.meta.url).href;
const code=`import {SqliteKnowledgeAdapter,SqliteModuleClosureStore,CanonicalClosureService,makeDecision} from ${JSON.stringify(url)};
let release;process.on('message',async m=>{if(m.type==='go'){release();return;}if(m.type!=='start')return;const k=new SqliteKnowledgeAdapter(m.knowledgePath),s=new SqliteModuleClosureStore({...m.options,key:Buffer.from(m.key,'base64')});try{const svc=new CanonicalClosureService(k,m.context,s,{reviewClosure:async r=>{process.send({type:'ready'});await new Promise(resolve=>{release=resolve;});return makeDecision(r);}});const result=await svc.execute('catalog',{action:'waive',reason:'Renuncia sintética aislada aprobada por gateway del proceso de prueba'});process.send({type:'result',status:result.status,code:result.code,idempotent:result.idempotent});}catch(e){process.send({type:'error',message:e.message});}finally{s.close();k.close();process.disconnect();}});`;
const children=[];
try{const jobs=[0,1].map(()=>{const child=spawn(process.execPath,['--input-type=module','-e',code],{stdio:['ignore','pipe','pipe','ipc']});children.push(child);let readyResolve,resultResolve;const ready=new Promise(r=>{readyResolve=r;}),result=new Promise((resolve,reject)=>{resultResolve=resolve;child.on('error',reject);child.on('exit',c=>{if(c)reject(Error('child exit '+c));});});child.on('message',m=>{if(m.type==='ready')readyResolve();if(m.type==='result')resultResolve(m);if(m.type==='error')resultResolve(m);});child.send({type:'start',knowledgePath:f.knowledgePath,context:f.context,key:f.closureKey.toString('base64'),options:{projectRoot:f.root,applicationId:'app-r5',environmentId:'local',path:f.closureStorePath,protection:'host_private_directory_and_managed_key'}});const exited=once(child,'exit');return {child,ready,result,exited};});await Promise.all(jobs.map(j=>j.ready));jobs.forEach(j=>j.child.send({type:'go'}));const results=await Promise.all(jobs.map(j=>j.result));await Promise.all(jobs.map(j=>j.exited));emit({scenario:'two-process-results-before-readback',results});assert.ok(results.some(r=>r.status==='waived'));const snap=f.closureStore.read(f.context);assert.equal(snap.approvals.length,1);assert.equal(Object.keys(snap.closures).length,1);assert.equal((await f.store.query('app-r5','relation')).items.length,1);const retry=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async()=>{throw Error('must not request new approval');}}).execute('catalog',{action:'close'});assert.equal(retry.idempotent,true);emit({scenario:'two-physical-closure-processes',results,singleApprovalClosureReceipt:true,retry:retry.status,idempotent:retry.idempotent});}finally{for(const c of children)if(c.exitCode===null)c.kill();f.closureStore.close();f.store.close();}
// Reusing one actual approval ID for another existing gap cannot consume authority twice.
{const f=await fixture({gateway:{reviewClosure:async r=>({...makeDecision(r),approvalId:'isolated-single-use-approval'})}});try{const assessment=(await f.coverageService.evaluate('catalog')).assessment;const command=g=>({action:'accept_gaps',accepted_gaps:[{gap_id:g.id,reason:'Razón sustantiva sintética exacta para aceptar esta brecha existente'}]});assert.equal((await f.closureService.execute('catalog',command(assessment.gaps[0]))).status,'gaps_accepted');const before=f.closureStore.read(f.context);const result=await f.closureService.execute('catalog',command(assessment.gaps[1]));assert.equal(result.status,'blocked');assert.deepEqual(f.closureStore.read(f.context),before);emit({scenario:'accept-approval-reuse',code:result.code,snapshotUnchanged:true,approvals:before.approvals.length});}finally{f.closureStore.close();f.store.close();}}
```
