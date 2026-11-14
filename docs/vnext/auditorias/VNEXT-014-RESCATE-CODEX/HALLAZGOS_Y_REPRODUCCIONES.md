**Auditoría independiente de aceptación. Fecha: 2026-11-05.** Repositorio Hyouka73/QAMCP, rama exclusiva feat/qap-vnext-architecture. **Snapshot exacto probado: e71818ac6fdaa1847e300a67bd4540fbfbd514c5.** Último commit productivo: 4be066c794c1e83fa0b3e1b89d269094f7b7f68e. Base anterior al rescate: f36e5ba60470c2443690d78a4b68bad966891b69. El SHA de esta publicación documental se verifica en GitHub al terminar y no sustituye el del snapshot probado. VNEXT-014 NO-GO; VNEXT-015 no iniciado.

# Hallazgos reproducidos y correcciones solicitadas

Los fixtures y gateways de este documento son sintéticos y aislados. No certifican consentimiento humano. No se modificaron fuentes ni pruebas versionadas. Las intercalaciones instrumentan exclusivamente el arnés externo; las lecturas, escrituras y COMMIT de las reproducciones son de los adaptadores reales. Los casos multiproceso utilizan escritores oficiales independientes.

## RES-CODEX-A01 — P1: cierre de sesión con lifecycle cambiado durante el reporte

**Bloqueante vigente.** En qap_session_close la compuerta canExitWorking utiliza un snapshot previo a los await del reporte. La escritura final toma el lock de FileSystemStorage, pero no vuelve a validar sesión/plan/módulos contra aquel snapshot. Llama transitionProject sin checkGates y no comprueba success. [Compuerta y reporte](https://github.com/Hyouka73/QAMCP/blob/e71818ac6fdaa1847e300a67bd4540fbfbd514c5/packages/mcp/src/server.ts#L3434) · [transición final](https://github.com/Hyouka73/QAMCP/blob/e71818ac6fdaa1847e300a67bd4540fbfbd514c5/packages/mcp/src/server.ts#L3518) · [gates opcionales](https://github.com/Hyouka73/QAMCP/blob/e71818ac6fdaa1847e300a67bd4540fbfbd514c5/packages/engine/src/lifecycle.ts#L676).

Reproducción mínima: (1) preparar un waiver válido por gateway de fixture y su recibo real; (2) llamar qap_session_close; (3) en la primera query de requirement de sessionReport, intercalar updateLifecycleState de otra instancia oficial; (4) añadir late:planned al plan o cambiar session.id o phase; (5) dejar continuar el método original. En la variante de proceso independiente se espera a que el hijo termine su update oficial antes de devolver la query original.

**Esperado:** bloqueo por contexto cambiado, sin cerrar una sesión distinta ni emitir éxito falso. **Observado:** late queda planned y phase pasa a WRAP_UP; el reporte omite late. Cambiar session.id cierra la nueva sesión usando reporte con el ID anterior. Cambiar phase a SCOPING deja físicamente SCOPING, pero la respuesta afirma success/WRAP_UP porque se ignoró la transición rechazada. Cuatro escenarios: plan en mismo proceso, plan en otro proceso, sesión y fase.

Causa confirmada por código y sonda. La estructura de la transición sin revalidación tiene antecedentes en el handler; no se demuestra que todo el defecto naciera en estos 18 commits. El rescate introduce un nuevo tramo await de inventario donde la reproducción es determinista. Es un hallazgo bloqueante del snapshot actual aunque las suites nominales no cambien.

**Corrección acotada:** proteger la lectura final, proyección/reporte y transición con una frontera coordinada que respete lifecycle→Knowledge→Closure y evite reentrada del lock durante reconcile. Dentro de la actualización final verificar identidad completa de sesión/plan/estado/fase y compuerta vigente; si no coincide, no publicar éxito. Comprobar transitionProject.success y el estado durable resultante. Escribir el reporte temporalmente, publicarlo solamente para el contexto validado y definir recuperación de estados parciales. Añadir los cuatro intercalados sin degradar Scenario 4.

## RES-CODEX-A02 — P1: validación incompleta del recibo en el nuevo reporte

[sessionReport](https://github.com/Hyouka73/QAMCP/blob/e71818ac6fdaa1847e300a67bd4540fbfbd514c5/packages/mcp/src/handlers/canonical-closure-service.ts#L334) comprueba source del módulo y algunos campos trace, pero omite trace.source y entity.target completo. El reconciliador previo sí valida varios de esos campos ([reconcile](https://github.com/Hyouka73/QAMCP/blob/e71818ac6fdaa1847e300a67bd4540fbfbd514c5/packages/mcp/src/handlers/canonical-closure-service.ts#L172)); las dos lecturas no forman una transacción/fence común.

Reproducción: waiver y recibo válidos; la primera lectura relation de reconcile observa el original; antes de la segunda lectura relation del reporte, hacer un commit real de revisión del mismo recibo con trace.source='wrong-provenance' o target={kind:'module',id:'mod-catalog',revision:1}. Conservar reason=requestDigest y recorded_by/review. Dejar que la segunda lectura original lea físicamente el recibo modificado. También se reprodujo source alterado mediante otra conexión en un proceso Node hijo.

**Esperado:** canonical_report_receipt_missing_or_invalid y ninguna publicación autoritativa. **Observado:** success/WRAP_UP, reporte con cabecera de autoridad, aunque el recibo leído tiene procedencia o destino inválidos. No se fabricó una respuesta get; el arnés solamente determina el instante del commit del escritor. Es un defecto nuevo de la proyección del rescate. No demuestra que un cliente MCP sin privilegios pueda escribir Knowledge: la amenaza probada es un recibo incoherente/concurrente dentro de una fuente que el reporte promete validar.

**Corrección acotada:** unificar la validación estricta de recibos del cierre, recuperación y reporte: identidad/scope, source/target con revisiones, trace.source correspondiente a closed/waived, digest, reviewer host y review. Tomar un snapshot consistente de cierre+aprobación+recibo e inventario con fence/revalidación; rechazar cambios durante generación. Cubrir fuente, destino y cambios concurrentes, manteniendo los históricos válidos.

## RES-CODEX-A03 — P2: arranque 'existing-only' inicializa Knowledge vacío antes de rechazarlo

[loadHostComposition](https://github.com/Hyouka73/QAMCP/blob/e71818ac6fdaa1847e300a67bd4540fbfbd514c5/packages/mcp/src/host-composition.ts#L192) verifica que el path existe, pero invoca new SqliteKnowledgeAdapter con capacidad de inicializar/migrar. Un archivo de cero bytes pasa existingFile, se transforma en SQLite de **73728 bytes** con diez tablas y luego se rechaza por aplicación/entorno ausente. La sonda read-only posterior enumera knowledge_migrations, knowledge_scopes, knowledge_revisions, knowledge_links y FTS. No se persiste ninguna aprobación; incumple la provisión no mutante; no es bypass de autoridad. Una ruta inexistente, en cambio, no se crea.

**Esperado:** rechazar almacén no provisionado sin crearlo ni migrarlo en esta composición. **Corrección:** preflight read-only de cabecera/esquema/scope/versiones o modo explicitamente existing-only/no-migrate del adaptador; dejar provisión y migración en API administrativa separada. Verificar hashes/tamaño/esquema inalterados al rechazar.

## RES-CODEX-L01 — P2: cinco errores ESLint nuevos

Global: **39 errores/28 advertencias**, frente a 34/28. Los **62 diagnósticos históricos son idénticos incluso en línea/columna**; no hay bajas ni supresiones. Altas:

| Archivo | Línea:col | Regla |
| --- | --- | --- |
| packages/mcp/src/handlers/canonical-closure-service.ts | 354:26 | @typescript-eslint/no-unnecessary-type-assertion |
| packages/mcp/src/handlers/canonical-session-report.ts | 5:10 | @typescript-eslint/no-base-to-string |
| packages/mcp/src/handlers/canonical-session-report.ts | 5:67 | no-useless-escape |
| packages/mcp/src/host-composition.ts | 149:25 | @typescript-eslint/no-unsafe-assignment |
| packages/mcp/src/host-composition.ts | 154:17 | @typescript-eslint/no-unnecessary-type-assertion |

Corregir el narrowing/tipos y el escape innecesario en las tres fuentes afectadas; no añadir disables ni cambiar ESLint para esconder los diagnósticos. Los builds no fallaron por estas infracciones.

## A04-W01 — P2 residual, reproducido, fuera de la composición estándar inspeccionada

La cola con setInterval creada antes de execute pierde AsyncLocalStorage al despachar transaction. Se utiliza SqliteModuleClosureStore real; no se deshabilita ningún guard privado. Tras ejecutar el callback válido se espera hasta expiresAt+40ms. Las cuatro acciones persisten una aprobación caducada; accept_gaps después recupera ese receipt como idempotente. Control con AsyncLocalStorage.snapshot conserva contexto y bloquea las cuatro, sin escrituras.

El puerto IModuleClosureStore acepta wrappers estructurales, pero no documenta ni transporta explícitamente este contexto. En el camino oficial loadHostComposition→SqliteModuleClosureStore directo y startMcpServer/createMcpServer no se encontró esa cola. Por ello no se atribuye este bypass al manifiesto estándar ni se eleva a P1 directo. La garantía genérica a cualquier implementación/decorador sigue sin estar demostrada.

Corrección/contrato solicitado: plazo explícito obligatorio en la transacción que consume autoridad, propagado por wrappers; alternativamente limitar y comprobar la capacidad del adaptador, conservando contexto por job con snapshot/bind y documentando los decoradores permitidos. Rechazar una autorización nueva si falta su contexto requerido. No prometer tiempo real frente a suspensión del SO entre último check síncrono y COMMIT. Sigue el diagnóstico menor de expirar antes de callback: algunos negativos devuelven closure_consistency_conflict en vez de closure_review_expired; no hubo escritura.

## Negativos, fallos parciales e idempotencia

Sin aprobación, aprobación duplicada, digest distinto o waiver corto: blocked/canonical_module_closure_required, sin reporte y phase WORKING. Binding distinto: error antes del reporte. Ocultar el readback del recibo en el arnés provoca canonical_report_receipt_missing_or_invalid; se identifica como fallo de lectura inyectado, no borrado físico de Knowledge.

EISDIR real en el path del reporte: error y WORKING; retirar únicamente el directorio vacío de fixture permite retry sin cambiar snapshot/aprobación. Excepción inyectada en updateLifecycleState **después de que existe el archivo del reporte**: error, reporte durable y WORKING; retry termina en WRAP_UP sin nueva aprobación ni snapshot. Esto prueba recuperación de esa ventana, no ACID entre archivos y dos bases. Un retry después de WRAP_UP devuelve blocked por fase; no es una respuesta idempotente exitosa de session_close. Reabrir módulo closed se rechaza correctamente; una nueva sesión con módulo canónico nuevo sí funciona.

### Resultados completos de la sonda de reportes

~~~text
{"scenario":"normal","status":"success","phase":"WRAP_UP","retryStatus":"blocked","requirementsNotCertifiedAsExecution":true,"snapshotUnchanged":true}
{"scenario":"lifecycle-plan","status":"success","claimedPhase":"WRAP_UP","actualPhase":"WRAP_UP","session":"session-r5","lateModule":"planned","receiptReads":2,"reportOmitsLate":true,"reportExists":true}
{"scenario":"lifecycle-plan-process","status":"success","claimedPhase":"WRAP_UP","actualPhase":"WRAP_UP","session":"session-r5","lateModule":"planned","receiptReads":2,"reportOmitsLate":true,"reportExists":true}
{"scenario":"lifecycle-session","status":"success","claimedPhase":"WRAP_UP","actualPhase":"WRAP_UP","session":"new-session-concurrent","receiptReads":2,"reportOmitsLate":true,"reportExists":true}
{"scenario":"lifecycle-phase","status":"success","claimedPhase":"WRAP_UP","actualPhase":"SCOPING","session":"session-r5","receiptReads":2,"reportOmitsLate":true,"reportExists":true}
{"scenario":"receipt-source","status":"success","claimedPhase":"WRAP_UP","actualPhase":"WRAP_UP","session":"session-r5","receiptReads":2,"reportOmitsLate":true,"reportExists":true}
{"scenario":"receipt-source-process","status":"success","claimedPhase":"WRAP_UP","actualPhase":"WRAP_UP","session":"session-r5","receiptReads":2,"reportOmitsLate":true,"reportExists":true}
{"scenario":"receipt-target","status":"success","claimedPhase":"WRAP_UP","actualPhase":"WRAP_UP","session":"session-r5","receiptReads":2,"reportOmitsLate":true,"reportExists":true}
{"scenario":"no-approval","status":"blocked","code":"canonical_module_closure_required","phase":"WORKING","message":"No se puede cerrar la sesión: los siguientes módulos canónicos no cuentan con cierre o renuncia válidamente autorizados: catalog.","reportPersisted":false}
{"scenario":"duplicate-approval","status":"blocked","code":"canonical_module_closure_required","phase":"WORKING","message":"No se puede cerrar la sesión: los siguientes módulos canónicos no cuentan con cierre o renuncia válidamente autorizados: catalog.","reportPersisted":false}
{"scenario":"bad-digest","status":"blocked","code":"canonical_module_closure_required","phase":"WORKING","message":"No se puede cerrar la sesión: los siguientes módulos canónicos no cuentan con cierre o renuncia válidamente autorizados: catalog.","reportPersisted":false}
{"scenario":"bad-waiver","status":"blocked","code":"canonical_module_closure_required","phase":"WORKING","message":"No se puede cerrar la sesión: los siguientes módulos canónicos no cuentan con cierre o renuncia válidamente autorizados: catalog.","reportPersisted":false}
{"scenario":"missing-receipt","status":"error","isError":true,"phase":"WORKING","message":"Error ejecutando qap_session_close: canonical_report_receipt_missing_or_invalid","reportPersisted":false}
{"scenario":"binding-revision","status":"error","isError":true,"phase":"WORKING","message":"Error ejecutando qap_session_close: canonical_report_authorization_or_binding_invalid","reportPersisted":false}
{"scenario":"report-write-failure","status":"error","isError":true,"phase":"WORKING","message":"Error ejecutando qap_session_close: EISDIR: illegal operation on a directory, open 'C:\\Users\\Judirico\\AppData\\Local\\Temp\\qap-r5-da7zCA\\.qa\\project\\sessions\\session-r5.report.md'","reportPersisted":false}
{"scenario":"report-write-failure-recovery","status":"success","approvalUnchanged":true}
{"scenario":"transition-failure","status":"error","isError":true,"phase":"WORKING","message":"Error ejecutando qap_session_close: AUDIT_FAILURE_BEFORE_LIFECYCLE_WRITE","reportPersisted":true}
{"scenario":"transition-failure-recovery","status":"success","phase":"WRAP_UP","approvalUnchanged":true}

~~~

### Provisión y rutas

~~~text
{"scenario":"missing-knowledge","status":"rejected","error":"Host configuration requires an existing canonical absolute knowledgeDbPath","missingKnowledgeCreated":false}
{"scenario":"empty-existing-knowledge","status":"rejected","error":"Host application/environment not present in canonical Knowledge.","bytesBefore":0,"bytesAfter":73728}
{"scenario":"empty-knowledge-mutation-readback","tables":["knowledge_migrations","knowledge_scopes","knowledge_revisions","knowledge_links","action_target_search","action_targets_fts","action_targets_fts_data","action_targets_fts_idx","action_targets_fts_docsize","action_targets_fts_config"]}
{"scenario":"corrupt-knowledge","status":"rejected","error":"Knowledge store: SCHEMA_MISMATCH","bytesBefore":10,"bytesAfter":10}
{"scenario":"missing-draft","status":"rejected","error":"Host configuration requires an existing canonical absolute interviewDraft.dbPath"}
{"scenario":"empty-existing-closure","status":"rejected","error":"Module closure store: incompatible","bytesBefore":0,"bytesAfter":0}
{"scenario":"hardlink-manifest","status":"rejected","error":"Unsafe host configuration file: manifest"}
{"scenario":"junction-root","status":"rejected","error":"Project root must be an existing canonical absolute directory."}
{"scenario":"foreign-store-scope","status":"rejected","error":"Module closure store: incompatible"}
{"scenario":"bad-ack-absent","status":"rejected","error":"Explicit pinned read-only Discovery authorization required."}
{"scenario":"stale-environment","status":"rejected","error":"Explicit pinned read-only Discovery authorization required."}
{"scenario":"nonexact-url","status":"rejected","error":"Discovery URL must be absolute and exact."}
{"scenario":"private-policy","status":"accepted-explicit-restrictive-policy"}

~~~

### Reproducción ALS y control

~~~text
{"scenario":"port-preexisting-timer-queue","boundByAsyncLocalStorageSnapshot":false,"action":"declare_non_applicable","status":"declared_non_applicable","approvalCommittedAfterExpiry":true,"msPastDeadline":72,"actualSqliteStoreAndIndependentReadback":true}
{"scenario":"port-preexisting-timer-queue","boundByAsyncLocalStorageSnapshot":false,"action":"accept_gaps","status":"gaps_accepted","approvalCommittedAfterExpiry":true,"replayOfExpiredCommit":true,"msPastDeadline":81,"actualSqliteStoreAndIndependentReadback":true}
{"scenario":"port-preexisting-timer-queue","boundByAsyncLocalStorageSnapshot":false,"action":"close","status":"closed","approvalCommittedAfterExpiry":true,"msPastDeadline":74,"actualSqliteStoreAndIndependentReadback":true}
{"scenario":"port-preexisting-timer-queue","boundByAsyncLocalStorageSnapshot":false,"action":"waive","status":"waived","approvalCommittedAfterExpiry":true,"msPastDeadline":80,"actualSqliteStoreAndIndependentReadback":true}
{"scenario":"port-preexisting-timer-queue","boundByAsyncLocalStorageSnapshot":true,"action":"declare_non_applicable","status":"blocked","code":"closure_review_expired","approvalCommittedAfterExpiry":false,"msPastDeadline":60,"actualSqliteStoreAndIndependentReadback":true}
{"scenario":"port-preexisting-timer-queue","boundByAsyncLocalStorageSnapshot":true,"action":"accept_gaps","status":"blocked","code":"closure_review_expired","approvalCommittedAfterExpiry":false,"msPastDeadline":62,"actualSqliteStoreAndIndependentReadback":true}
{"scenario":"port-preexisting-timer-queue","boundByAsyncLocalStorageSnapshot":true,"action":"close","status":"blocked","code":"closure_review_expired","approvalCommittedAfterExpiry":false,"msPastDeadline":64,"actualSqliteStoreAndIndependentReadback":true}
{"scenario":"port-preexisting-timer-queue","boundByAsyncLocalStorageSnapshot":true,"action":"waive","status":"blocked","code":"closure_review_expired","approvalCommittedAfterExpiry":false,"msPastDeadline":62,"actualSqliteStoreAndIndependentReadback":true}

~~~

## Arnés reproducible (externo al árbol versionado)

Ejecutar después de install/build del snapshot fijo. Las rutas del arnés corresponden al worktree auditado; adaptarlas en otra máquina. setup/prepare extraen solo helpers del snapshot a un bundle externo bajo node_modules/.audit-rescate; no editan ni reemplazan las pruebas que corrió Vitest. Propuestas/decisiones son fixtures claramente rotulados.

~~~javascript
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';
const root='C:/Users/Judirico/Documents/QAMCP/audit-r4-r10',out='C:/Users/Judirico/Documents/QAMCP/rescate-evidence';
mkdirSync(out,{recursive:true});
const req=createRequire(root+'/package.json'),tr=createRequire(req.resolve('tsup/package.json'));const {build}=await import(pathToFileURL(tr.resolve('esbuild')));
let source=readFileSync(root+'/packages/mcp/src/__tests__/host-composition.test.ts','utf8').split("describe('VNEXT-014 host-owned Stdio composition'")[0];source=source.replace("import { afterEach, describe, expect, it } from 'vitest';","const afterEach=()=>{};");source+='\nexport {provision,loadHostComposition,createMcpServer};';
await build({stdin:{contents:source,resolveDir:root+'/packages/mcp/src/__tests__',loader:'ts'},bundle:true,packages:'external',platform:'node',format:'esm',outfile:root+'/packages/mcp/node_modules/.audit-rescate/host.mjs'});

~~~

~~~javascript
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=resolve('C:/Users/Judirico/Documents/QAMCP/audit-r4-r10');
const req=createRequire(root+'/package.json');const tr=createRequire(req.resolve('tsup/package.json'));const {build}=await import(pathToFileURL(tr.resolve('esbuild')));
let fixture=readFileSync(root+'/packages/mcp/src/__tests__/canonical-coverage.test.ts','utf8').split("describe('VNEXT-013-R5 Comprehensive Physical Test Matrix'")[0];
fixture=fixture.replace("import { afterEach, describe, expect, it, vi } from 'vitest';","const afterEach=()=>{}; const vi={restoreAllMocks(){}};");
fixture+="\nexport {withClosureCommitDeadline,ClosureStoreError} from '../handlers/module-closure-store.js';";
fixture+='\nexport {fixture,makeDecision,CanonicalCoverageService,CanonicalClosureService,SqliteModuleClosureStore,SqliteKnowledgeAdapter,FileSystemStorage};';
await build({stdin:{contents:fixture,resolveDir:root+'/packages/mcp/src/__tests__',loader:'ts'},bundle:true,packages:'external',platform:'node',format:'esm',outfile:root+'/packages/mcp/node_modules/.audit-rescate/fixture.mjs'});
const stdio=readFileSync(root+'/docs/vnext/auditorias/VNEXT-014-R4-R7/COMANDOS.md','utf8').split('```javascript')[1].split('```')[0];
writeFileSync(root+'/packages/mcp/node_modules/.audit-rescate/stdio.mjs',stdio);



~~~

~~~javascript
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {DatabaseSync} from 'node:sqlite';
import {fixture,makeDecision,CanonicalClosureService,FileSystemStorage,withClosureCommitDeadline} from '../audit-r4-r10/packages/mcp/node_modules/.audit-rescate/fixture.mjs';
export {assert,fixture,makeDecision,CanonicalClosureService,FileSystemStorage,DatabaseSync,withClosureCommitDeadline};
export const emit=x=>console.log(JSON.stringify(x)),sleep=ms=>new Promise(r=>setTimeout(r,ms));
export const reason='Razón sintética aislada para auditar autoridad de brecha real';
export const all={confirmedReqs:['functional','business_rule','security','ui','ux','regression','performance'].map(category=>({category,title:category}))};
export const clean=f=>{f.closureStore.close();f.store.close();};
export const command=async(f,action)=>action==='accept_gaps'?{action,accepted_gaps:[{gap_id:(await f.coverageService.evaluate('catalog')).assessment.gaps.find(g=>g.status==='unaddressed').id,reason}]}:action==='declare_non_applicable'?{action,decisions:[{category:'performance',reason}]}:action==='waive'?{action,reason}:{action};
export const history=f=>{const d=new DatabaseSync(f.closureStorePath,{readOnly:true});try{return d.prepare('SELECT generation,hex(payload) payload FROM closure_history ORDER BY generation').all();}finally{d.close();}};
export const capture=async f=>({snapshot:f.closureStore.read(f.context),history:history(f),relations:await f.store.query('app-r5','relation'),lifecycle:readFileSync(f.lifecyclePath,'utf8')});
export const unchanged=async(f,b)=>{assert.deepEqual(await capture(f),b);const other=f.openClosureStore();try{assert.deepEqual(other.read(f.context),b.snapshot);}finally{other.close();}};

~~~

~~~javascript
import {assert,fixture,makeDecision,CanonicalClosureService,FileSystemStorage,all,emit,capture,clean} from './util.mjs';
import {createMcpServer} from '../audit-r4-r10/packages/mcp/node_modules/.audit-rescate/host.mjs';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';import {readFileSync,writeFileSync,mkdirSync,existsSync,unlinkSync,rmdirSync} from 'node:fs';import {join} from 'node:path';
const req=createRequire('C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/package.json'),load=async id=>import(pathToFileURL(req.resolve(id)));const {Client}=await load('@modelcontextprotocol/sdk/client/index.js'),{InMemoryTransport}=await load('@modelcontextprotocol/sdk/inMemory.js');
const reason='Controlled independent fixture review for audit only, not real human consent';
async function connect(f,bindings=f.context.moduleBindings){const server=createMcpServer({projectRoots:[f.root],knowledgeBindings:[{...f.context,moduleBindings:bindings,store:f.store,moduleClosureStore:f.closureStore}]});const client=new Client({name:'rescue-report-audit',version:'1'}),[ct,st]=InMemoryTransport.createLinkedPair();await server.connect(st);await client.connect(ct);return{server,client,call:async(name,args={})=>{const r=await client.callTool({name,arguments:{targetPath:f.root,...args}});let payload;try{payload=JSON.parse(r.content[0].text);}catch{payload={status:'error',error:r.content[0].text};}return{...payload,isError:r.isError};}};}
async function waived(){const f=await fixture({gateway:{reviewClosure:async r=>makeDecision(r)}});assert.equal((await f.closureService.execute('catalog',{action:'waive',reason})).status,'waived');return f;}
for(const variant of ['normal','lifecycle-plan','lifecycle-plan-process','lifecycle-session','lifecycle-phase','receipt-source','receipt-source-process','receipt-target','no-approval','duplicate-approval','bad-digest','bad-waiver','missing-receipt','binding-revision','report-write-failure','transition-failure']){
 const f=await waived();let handled=false,reportPath=join(f.root,'.qa/project/sessions/session-r5.report.md');const before=f.closureStore.read(f.context);const storage=new FileSystemStorage({rootDir:f.root});
 let bindings=f.context.moduleBindings;
 if(['no-approval','duplicate-approval','bad-digest','bad-waiver'].includes(variant))await f.closureStore.transaction(f.context,async snap=>{if(variant==='no-approval')snap.approvals=[];if(variant==='duplicate-approval')snap.approvals.push(snap.approvals[0]);if(variant==='bad-digest')snap.closures.catalog.requestDigest='tampered';if(variant==='bad-waiver')snap.closures.catalog.waiverReason='x';});
 if(variant==='binding-revision')bindings=bindings.map(b=>({...b,moduleRevision:2}));
 if(variant==='report-write-failure'){mkdirSync(reportPath,{recursive:true});}
 const originalQuery=f.store.query.bind(f.store),originalGet=f.store.get.bind(f.store);let receiptReads=0;
 f.store.query=async(app,kind,opts)=>{if(kind==='requirement'&&!handled&&['lifecycle-plan','lifecycle-plan-process','lifecycle-session','lifecycle-phase','transition-failure'].includes(variant)){handled=true;if(variant==='transition-failure'){const originalUpdate=FileSystemStorage.prototype.updateLifecycleState;FileSystemStorage.prototype.updateLifecycleState=async function(op){FileSystemStorage.prototype.updateLifecycleState=originalUpdate;throw Error('AUDIT_FAILURE_BEFORE_LIFECYCLE_WRITE');};return originalQuery(app,kind,opts);}if(variant==='lifecycle-plan-process'){const script=`import {FileSystemStorage} from 'file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/node_modules/.audit-rescate/fixture.mjs';await new FileSystemStorage({rootDir:process.argv[1]}).updateLifecycleState(s=>{s.modules.late={state:'planned',updated_at:new Date().toISOString()};s.session.plan.push({module:'late',path:'/late'});return s;});`;const child=spawnSync(process.execPath,['--input-type=module','-e',script,f.root],{encoding:'utf8'});assert.equal(child.status,0,child.stderr);return originalQuery(app,kind,opts);}await storage.updateLifecycleState(async s=>{if(variant==='lifecycle-plan'){s.modules.late={state:'planned',updated_at:new Date().toISOString()};s.session.plan.push({module:'late',path:'/late'});}if(variant==='lifecycle-session')s.session.id='new-session-concurrent';if(variant==='lifecycle-phase')s.phase='SCOPING';return s;});}return originalQuery(app,kind,opts);};
 f.store.get=async(app,kind,id,...rest)=>{if(kind==='relation'&&id.startsWith('waiver:')){receiptReads++;if(receiptReads===2&&variant.startsWith('receipt-')){const r=await originalGet(app,kind,id,...rest);if(variant==='receipt-source-process'){const script=`import {SqliteKnowledgeAdapter} from 'file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/node_modules/.audit-rescate/fixture.mjs';const st=new SqliteKnowledgeAdapter(process.argv[1]);const r=await st.get('app-r5','relation',process.argv[2]);await st.commit('app-r5',[{kind:'relation',expected_revision:r.revision,entity:r.entity,trace:{...r.trace,source:'wrong-provenance-process'}}]);st.close();`;const child=spawnSync(process.execPath,['--input-type=module','-e',script,f.knowledgePath,id],{encoding:'utf8'});assert.equal(child.status,0,child.stderr);}else await f.store.commit(app,[{kind:'relation',expected_revision:r.revision,entity:variant==='receipt-target'?{...r.entity,target:{kind:'module',id:'mod-catalog',revision:1}}:r.entity,trace:{...r.trace,source:variant==='receipt-source'?'wrong-provenance':r.trace.source}}]);}if(variant==='missing-receipt')return undefined;}return originalGet(app,kind,id,...rest);};
 const c=await connect(f,bindings);try{const result=await c.call('qap_session_close');const lifecycle=JSON.parse(readFileSync(f.lifecyclePath));const report=existsSync(reportPath)&&variant!=='report-write-failure'?readFileSync(reportPath,'utf8'):null;
 if(['lifecycle-plan','lifecycle-plan-process','lifecycle-session','lifecycle-phase','receipt-source','receipt-source-process','receipt-target'].includes(variant)){assert.equal(result.status,'success');if(variant==='lifecycle-plan-process')assert.equal(lifecycle.modules.late.state,'planned');emit({scenario:variant,status:result.status,claimedPhase:result.fase,actualPhase:lifecycle.phase,session:lifecycle.session.id,lateModule:lifecycle.modules.late?.state,receiptReads,reportOmitsLate:report&&!report.includes('late'),reportExists:!!report});}
 else if(variant==='normal'){assert.equal(result.status,'success');assert.equal(lifecycle.phase,'WRAP_UP');assert.ok(report.includes('no certificada'));const again=await c.call('qap_session_close');emit({scenario:variant,status:result.status,phase:lifecycle.phase,retryStatus:again.status,requirementsNotCertifiedAsExecution:report.includes('no certificada'),snapshotUnchanged:JSON.stringify(f.closureStore.read(f.context))===JSON.stringify(before)});}
 else {assert.notEqual(result.status,'success');emit({scenario:variant,status:result.status,code:result.code,isError:result.isError,phase:lifecycle.phase,message:result.error??result.razon,reportPersisted:!!report});if(variant==='report-write-failure'){rmdirSync(reportPath);const retried=await c.call('qap_session_close');assert.equal(retried.status,'success');assert.deepEqual(f.closureStore.read(f.context),before);emit({scenario:'report-write-failure-recovery',status:retried.status,approvalUnchanged:true});}if(variant==='transition-failure'){assert.ok(report,'fault must happen AFTER physical report');const retry=await c.call('qap_session_close');assert.equal(retry.status,'success');assert.deepEqual(f.closureStore.read(f.context),before);emit({scenario:'transition-failure-recovery',status:retry.status,phase:retry.fase,approvalUnchanged:true});}}
 }catch(error){emit({scenario:variant,thrown:error.message,phase:JSON.parse(readFileSync(f.lifecyclePath)).phase});if(!['receipt-source','receipt-source-process','receipt-target','binding-revision','transition-failure'].includes(variant))throw error;}finally{await c.client.close();await c.server.close();clean(f);}
}

~~~

~~~javascript
import {provision,loadHostComposition} from '../audit-r4-r10/packages/mcp/node_modules/.audit-rescate/host.mjs';import {writeFileSync,readFileSync,existsSync,linkSync,symlinkSync,realpathSync,statSync} from 'node:fs';import {join} from 'node:path';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
const emit=x=>console.log(JSON.stringify(x));
for(const variant of ['missing-knowledge','empty-existing-knowledge','corrupt-knowledge','missing-draft','empty-existing-closure','hardlink-manifest','junction-root','foreign-store-scope','bad-ack-absent','stale-environment','nonexact-url','private-policy']){
 const f=await provision(),m=f.manifest,env=f.env;let disposable;
 if(variant==='missing-knowledge')m.knowledgeDbPath=join(f.root,'missing.sqlite');
 if(variant==='empty-existing-knowledge'){disposable=join(f.root,'empty.sqlite');writeFileSync(disposable,'');m.knowledgeDbPath=disposable;}
 if(variant==='corrupt-knowledge'){disposable=join(f.root,'corrupt.sqlite');writeFileSync(disposable,'not sqlite');m.knowledgeDbPath=disposable;}
 if(variant==='missing-draft')m.interviewDraft.dbPath=join(f.root,'missing-draft.sqlite');
 if(variant==='empty-existing-closure'){disposable=join(f.root,'empty-closure.sqlite');writeFileSync(disposable,'');m.moduleClosure.dbPath=disposable;}
 if(variant==='hardlink-manifest')linkSync(f.manifestPath,join(f.root,'manifest-hardlink.json'));
 if(variant==='junction-root'){const alias=f.root+'-alias';symlinkSync(f.root,alias,'junction');m.projectRoot=alias;}
 if(variant==='foreign-store-scope'){const g=await provision();m.moduleClosure.dbPath=g.manifest.moduleClosure.dbPath;env.QAP_MCP_CLOSURE_KEY_HEX=g.env.QAP_MCP_CLOSURE_KEY_HEX;}
 if(['bad-ack-absent','stale-environment','nonexact-url','private-policy'].includes(variant)){m.discoveryAuthorization={read_only_acknowledged:true,environmentRevision:1,navigation_urls:['https://example.invalid/'],allowed_ips:[],allow_public_network:false};if(variant==='bad-ack-absent')delete m.discoveryAuthorization.read_only_acknowledged;if(variant==='stale-environment')m.discoveryAuthorization.environmentRevision=2;if(variant==='nonexact-url')m.discoveryAuthorization.navigation_urls=['https://example.invalid'];}
 writeFileSync(f.manifestPath,JSON.stringify(m));let c;const bytesBefore=disposable?statSync(disposable).size:undefined;try{c=await loadHostComposition(env);assert.equal(variant,'private-policy');emit({scenario:variant,status:'accepted-explicit-restrictive-policy'});}catch(e){if(variant==='private-policy')throw e;emit({scenario:variant,status:'rejected',error:e.message,bytesBefore,bytesAfter:disposable?statSync(disposable).size:undefined,missingKnowledgeCreated:variant==='missing-knowledge'?existsSync(m.knowledgeDbPath):undefined});if(variant==='empty-existing-knowledge'){const d=new DatabaseSync(disposable,{readOnly:true});emit({scenario:'empty-knowledge-mutation-readback',tables:d.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(x=>x.name)});d.close();}}finally{c?.close();}
}

~~~

~~~javascript
import {AsyncLocalStorage} from 'node:async_hooks';
import {assert,fixture,makeDecision,CanonicalClosureService,emit,sleep,all,command,clean,capture,unchanged} from './util.mjs';
// Host timer preexists execute(). No private deadline API is disabled.
for(const bound of [false,true])for(const action of ['declare_non_applicable','accept_gaps','close','waive']){
 const f=await fixture(action==='accept_gaps'?{}:all),cmd=await command(f,action),before=await capture(f),original=f.closureStore.transaction.bind(f.closureStore);let deadline;const queue=[];
 const pump=setInterval(()=>{const job=queue.shift();if(job)job();},10);
 f.closureStore.transaction=(scope,op)=>{const resume=bound?AsyncLocalStorage.snapshot():fn=>fn();return new Promise((resolve,reject)=>queue.push(()=>resume(()=>original(scope,async snapshot=>{const r=await op(snapshot);await sleep(Math.max(0,deadline-Date.now()+40));return r;}).then(resolve,reject))));};
 try{const r=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async request=>{deadline=Date.now()+500;return {...makeDecision(request),expiresAt:new Date(deadline).toISOString()};}}).execute('catalog',cmd);const snapshot=f.closureStore.read(f.context);let replay;
 if(bound){assert.equal(r.status,'blocked');assert.equal(r.code,'closure_review_expired');await unchanged(f,before);}else{assert.equal(snapshot.approvals.length,1);assert.notEqual(r.status,'blocked');assert.ok(Date.now()>deadline);const other=f.openClosureStore();assert.deepEqual(other.read(f.context),snapshot);other.close();if(action==='accept_gaps'){replay=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async()=>{throw Error('must not review');}}).execute('catalog',cmd);assert.equal(replay.idempotent,true);}}
 emit({scenario:'port-preexisting-timer-queue',boundByAsyncLocalStorageSnapshot:bound,action,status:r.status,code:r.code,approvalCommittedAfterExpiry:!bound,replayOfExpiredCommit:replay?.idempotent,msPastDeadline:Date.now()-deadline,actualSqliteStoreAndIndependentReadback:true});
 }finally{clearInterval(pump);clean(f);}
}

~~~


## RES-CODEX-E01 — P2: fragilidad paralela adicional pendiente

El comando MCP predeterminado falló360/67 de427,413/73 de486 y la sonda observada418/68 de486, además de los63 históricos estables. Hay timeouts, Vite UNKNOWN, EPERM de rename y errores de sesión tratados como JSON. Las identidades y stacks están en DIFERENCIAL_MCP; no se descartan como regresiones inexistentes por pasar con un worker. No quedó aislada la causa de todos los errores de sesión; separar hipótesis ambiental de defecto productivo exige conservar la evidencia de paralelismo y reparar la ejecución/cleanup según RESULTADOS. No cambiar expectativas ni eliminar garantías.
