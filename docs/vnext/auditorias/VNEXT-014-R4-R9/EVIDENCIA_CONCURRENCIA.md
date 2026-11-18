# Evidencia física de concurrencia R4-R9

Código exacto 09c9ce276c9c328026de4236dadf0a85d8e94d21. Todas las bases y lifecycle de sondas son fixtures desechables; ningún archivo protegido ni base personal se usó. Los decoradores colocan intercalados deterministas en los puertos originales; no cambian fuentes, evaluador, gateway productivo ni tests. Demuestran posibilidad en esa frontera, no frecuencia de scheduling productivo.

## Garantía condicionada demostrada

1. Durante gateway, revisión existente y requisito nuevo invalidan; cambio de revisión de módulo invalida. Snapshot de autorización intacto y readback en segunda conexión.
2. Tras revalidación, al entrar a transacción, antes del callback y después del callback/antes del commit: un segundo SqliteKnowledgeAdapter ya abierto, timeout 0, no puede escribir. Error actual UNAVAILABLE (el commit adapter sanitiza SQLite busy), no CONFLICT; el fence al adquirir sí usa CONFLICT. Capturar el error deja terminar al consumidor legítimo. Repetir tras liberar cambia revisión 1→2.
3. Propagar ese error después de que el callback editó el snapshot hace ROLLBACK real: 0 aprobaciones/decisiones/cierres/recibos nuevos; payload y generaciones de closure_history idénticos, lifecycle idéntico.
4. Un proceso físico separado intenta BEGIN IMMEDIATE: SQLite errcode=5 mientras existe fence; vuelve a ser escribible después de éxito y excepción. Otro proceso mantiene fence con un handle vivo, se termina físicamente y la conexión original vuelve a adquirir escritura; 0 autorizaciones fabricadas.
5. Competencia close/waive: un terminal, una aprobación y un recibo; declare/waive: una aplicabilidad, cero terminales/recibos en la ejecución observada. Dos waivers 3/3: ganador waived, perdedor blocked; retry posterior idempotente y snapshot intacto.
6. approvalId reutilizado devuelve closure_consistency_conflict sin agregar autorización. Los tres R4-R8-A01 y cinco R9 pasan. Coverage conserva Crash 2/3. Puerto sin fence bloquea; MemoryKnowledgeStore carece de capacidad y :memory:/adapter cerrado se rechazaron físicamente antes de entrar al callback. No se acredita la corrección de adaptadores futuros solo por declarar el método.

## R4-R9-A01 P1 — lifecycle fuera del fence

Reproducción: gateway devuelve decisión exacta; en closureStore.transaction, después de la revalidación del helper y antes de delegar, escribir session.id diferente y session.plan[0].path diferente en el lifecycle real de la fixture. Las cuatro acciones persisten una aprobación y devuelven éxito (para accept_gaps, ver limitación más abajo). close/waive re-resuelven, pero comparan solo moduleRevision; el fingerprint ya distinto no se coteja con el revisado. Aplicabilidad/brechas no re-resuelven dentro de la transacción.

Causa: el coverageDigest incorpora resolution.fingerprint del contexto FS leído, pero BEGIN IMMEDIATE de Knowledge no excluye escritores de lifecycle. before/after y CAS comparan solo ClosureStore. Riesgo: autorización de la sesión/plan anterior consumida bajo otro contexto; no requiere modificar la DB para alterar ese fingerprint. El intercalado es una escritura de fixture que modela un escritor FS concurrente, no una ruta remota de ataque demostrada.

Corrección: coordinar escritores reales del lifecycle/binding mediante exclusión/generación de contexto del host, adquirirla después del gateway y mantenerla con el fence Knowledge hasta consumo durable; comparar el fingerprint completo en las cuatro ramas. Una relectura aislada adicional no elimina toda ventana FS. Si se adopta garantía condicionada al host, hacer explícito y verificable ese contrato antes de certificar.

## R4-R9-A02 P1 — fence sobre archivo diferente

SqliteKnowledgeAdapter conserva databasePath literal (constructor líneas44–49) y vuelve a abrirlo en withWriteFence línea91. Acepta rutas relativas. Tras process.chdir, la conexión original sigue apuntando al archivo inicial; la segunda apunta a otro archivo vacío y BEGIN IMMEDIATE también tiene éxito.

La sonda relative.mjs crea adapter('canonical.sqlite') en raíz de fixture. El gateway cambia cwd a otra subcarpeta; la transacción Closure intenta revisión 2 sobre la base inicial después de revalidar. El commit Knowledge tiene éxito y el servicio persiste declared_non_applicable + 1 aprobación; assessment posterior tiene digest diferente del revisado. Ningún rename, unlink, copia de DB ni implementación falsa del fence se empleó.

Corrección: fijar ruta absoluta/canónica al abrir, validar identidad física al adquirir y rechazar desaparición/sustitución; no crear silenciosamente una DB distinta en un fence. Probar cambios de cwd y de identidad soportados. La ruta absoluta estable del servidor actual sí supera las sondas; no se detectó process.chdir propio del servidor. No se extrapola a swap/symlink/hardlink POSIX ni se afirma que Windows permita reemplazar archivos SQLite abiertos.

## R4-R9-A03 P2 — conflicto no alcanza retries

Dos llamadas simultáneas comparten KnowledgeAdapter y usan ClosureStore separados. withWriteFence abre conexión por llamada, busy_timeout síncrono bloquea el hilo que también necesita el primer callback. El segundo agota espera. persistWithKnowledgeFence captura toda excepción y devuelve blocked; commitFinalClosure retorna antes del catch que contiene maxAttempts/backoff/relectura. Resultado observado 3/3: waived + blocked; una aprobación y retry posterior idempotente. Restablecer serialización local de consumidores y tratamiento tipado del conflicto con relectura del ganador fuera del fence; evitar esperar síncronamente un lock cuyo titular progresa en el mismo event loop. Mantener adquisición interproceso SQLite.

## R4-R9-A04 — expiración tardía

El decorador ejecuta el callback original, espera hasta expiresAt+30ms y retorna a la transacción original, que cifra/inserta y COMMIT. Las cuatro ramas persisten aprobación vencida al durable commit. Esto demuestra límite de comprobación temporal, no revocación posterior ni violación si el contrato define consumo al último chequeo previo al callback. close/waive además tienen awaits en bridge.resolve después de su chequeo. Especificar punto de consumo; si se exige vigencia a la persistencia, llevar deadline/validación final al tramo síncrono de ClosureStore inmediatamente antes de escribir/commit, sin awaits intermedios. No se garantiza reloj/OS en tiempo real.

## R4-R9-A05 P1 preexistente — aceptación funcional no certificable

Una brecha existente gap:catalog:security:unknown_applicability con razón sustantiva retorna coverage_invariants_violated, 0 invocaciones al gateway, 0 aprobaciones. CanonicalClosureService llama evaluate con acceptedGaps sin decisionId; el evaluator crea accepted_gap sin acceptance_receipt, prohibido por Shared. Servicio R4-R8 exacto reproduce el mismo resultado. Las sondas de fronteras accept_gaps usan **un ID inexistente**, que pasa como no-op y consume aprobación sin aceptar brechas: solo instrumentan la ruta de escritura, no acreditan un caso válido de negocio. No se insertó recibo falso ni se desactivó el validador para producir un positivo.

Corregir en los servicios existentes: propuesta vincula digest de cobertura base + lista exacta de brechas/motivos, sin marcar autoridad aún; tras decisión real, revalidar base bajo fence y aplicar brechas con receipt del approvalId real. Rechazar IDs ajenos/inexistentes. No inventar una aprobación para satisfacer el evaluator previo al gateway.

## Compatibilidad y recuperación

La inserción de pendingRequirements.map en el array del hash agrega [] incluso cuando no hay pendientes. Ambas solicitudes de baseline (0 pendientes / 1 pendiente) cambian digest y la decisión antigua se rechaza con closure_review_invalid, snapshot intacto. Exigir solicitud/aprobación nuevas de forma visible; no migrar ni reinterpretar autorización antigua. Terminales closed y waived generados por R4-R8 se leen con R9 y otra conexión; se conserva exactamente el registro/aprobación, retry sin duplicar. Esto acredita autoridad histórica, no cobertura actual ni política de reapertura tras nueva evidencia.

No hay atomicidad entre bases ni FS: el fence se libera tras commit Closure antes del recibo Knowledge. Crash 2/3 y reconciliación positiva de suite PASS; errores posteriores pueden coexistir con autoridad ya consumida y no son negativos de cero escrituras. Recuperación total ante pérdida/corrupción de archivo, antirollback, fallos de energía y demás SO no certificados.

## Salidas finales de sondas

### probe

```text
{"runtime":"v24.15.0","sqlite":"3.51.3","fts5":true}
{"scenario":"gateway-mutation","action":"declare_non_applicable","code":"closure_context_changed","zeroAuthorizationWrites":true,"readback":true}
{"scenario":"gateway-mutation","action":"accept_gaps","code":"closure_context_changed","zeroAuthorizationWrites":true,"readback":true}
{"scenario":"gateway-mutation","action":"close","code":"closure_context_changed","zeroAuthorizationWrites":true,"readback":true}
{"scenario":"gateway-mutation","action":"waive","code":"closure_context_changed","zeroAuthorizationWrites":true,"readback":true}
{"scenario":"second-adapter","action":"declare_non_applicable","stage":"entry","writerBlocked":true,"consumer":"declared_non_applicable","writerRecovered":true}
{"scenario":"second-adapter","action":"declare_non_applicable","stage":"before-callback","writerBlocked":true,"consumer":"declared_non_applicable","writerRecovered":true}
{"scenario":"second-adapter","action":"declare_non_applicable","stage":"after-callback","writerBlocked":true,"consumer":"declared_non_applicable","writerRecovered":true}
{"scenario":"second-adapter","action":"accept_gaps","stage":"entry","writerBlocked":true,"consumer":"gaps_accepted","writerRecovered":true}
{"scenario":"second-adapter","action":"accept_gaps","stage":"before-callback","writerBlocked":true,"consumer":"gaps_accepted","writerRecovered":true}
{"scenario":"second-adapter","action":"accept_gaps","stage":"after-callback","writerBlocked":true,"consumer":"gaps_accepted","writerRecovered":true}
{"scenario":"second-adapter","action":"close","stage":"entry","writerBlocked":true,"consumer":"closed","writerRecovered":true}
{"scenario":"second-adapter","action":"close","stage":"before-callback","writerBlocked":true,"consumer":"closed","writerRecovered":true}
{"scenario":"second-adapter","action":"close","stage":"after-callback","writerBlocked":true,"consumer":"closed","writerRecovered":true}
{"scenario":"second-adapter","action":"waive","stage":"entry","writerBlocked":true,"consumer":"waived","writerRecovered":true}
{"scenario":"second-adapter","action":"waive","stage":"before-callback","writerBlocked":true,"consumer":"waived","writerRecovered":true}
{"scenario":"second-adapter","action":"waive","stage":"after-callback","writerBlocked":true,"consumer":"waived","writerRecovered":true}
{"scenario":"rollback-after-callback","action":"declare_non_applicable","code":"closure_consistency_conflict","zeroWrites":true}
{"scenario":"rollback-after-callback","action":"accept_gaps","code":"closure_consistency_conflict","zeroWrites":true}
{"scenario":"rollback-after-callback","action":"close","code":"closure_consistency_conflict","zeroWrites":true}
{"scenario":"rollback-after-callback","action":"waive","code":"closure_consistency_conflict","zeroWrites":true}
{"scenario":"physical-process","blockedDuringFence":true,"releasedAfterSuccessAndThrow":true}
{"scenario":"lifecycle-session-binding-drift","action":"declare_non_applicable","result":"declared_non_applicable","approvals":1,"changedSession":"different-session"}
{"scenario":"lifecycle-session-binding-drift","action":"accept_gaps","result":"gaps_accepted","approvals":1,"changedSession":"different-session"}
{"scenario":"lifecycle-session-binding-drift","action":"close","result":"closed","approvals":1,"changedSession":"different-session"}
{"scenario":"lifecycle-session-binding-drift","action":"waive","result":"waived","approvals":1,"changedSession":"different-session"}
{"scenario":"expires-before-durable-commit","action":"declare_non_applicable","result":"declared_non_applicable","approvalPersisted":true}
{"scenario":"expires-before-durable-commit","action":"accept_gaps","result":"gaps_accepted","approvalPersisted":true}
{"scenario":"expires-before-durable-commit","action":"close","result":"closed","approvalPersisted":true}
{"scenario":"expires-before-durable-commit","action":"waive","result":"waived","approvalPersisted":true}
```

### extra

```text
{"scenario":"two-consumers","run":1,"results":[{"status":"waived"},{"status":"blocked","code":"closure_consistency_conflict"}],"retry":"waived","singleApproval":true}
{"scenario":"two-consumers","run":2,"results":[{"status":"waived"},{"status":"blocked","code":"closure_consistency_conflict"}],"retry":"waived","singleApproval":true}
{"scenario":"two-consumers","run":3,"results":[{"status":"waived"},{"status":"blocked","code":"closure_consistency_conflict"}],"retry":"waived","singleApproval":true}
{"scenario":"approval-id-reuse","code":"closure_consistency_conflict","unchanged":true}
{"scenario":"gateway-new-pending","code":"closure_context_changed","zeroWrites":true}
{"scenario":"gateway-module-revision","code":"closure_context_changed","zeroWrites":true}
{"scenario":"existing-gap-acceptance","code":"coverage_invariants_violated","gatewayCalls":0,"zeroApprovals":true}
{"scenario":"relative-path-cwd-change","fenceOnDifferentFile":true,"originalDatabaseWritable":true}
{"scenario":"hard-process-exit","blockedWhileAlive":true,"writerRecoveredAfterKill":true,"approvals":0}
```

### relative

```text
{"scenario":"relative-path-full-stale-authorization","result":"declared_non_applicable","revision":2,"approvals":1,"reviewedDigest":"968750b8c133413cd7760fc631df5734dfd43189ae206ca82e005b14b2683f1f","currentDigest":"39b0ed3d67b7aaeee8f6015813056924122574aceca3228040adbee2c59d413a"}
```

### history

```text
{"scenario":"old-pending-request","hasPending":false,"digestChanged":true,"code":"closure_review_invalid","unchanged":true}
{"scenario":"old-pending-request","hasPending":true,"digestChanged":true,"code":"closure_review_invalid","unchanged":true}
{"scenario":"historical-terminal","terminal":"closed","preserved":true,"readback":true}
{"scenario":"historical-terminal","terminal":"waived","preserved":true,"readback":true}
{"scenario":"accept-existing-gap-baseline-r8","code":"coverage_invariants_violated","preexisting":true}
```

### competition

```text
{"scenario":"competing-actions","pair":["close","waive"],"results":[{"status":"blocked","code":"closure_consistency_conflict"},{"status":"waived"}],"approvals":1,"closures":1,"receipts":1}
{"scenario":"competing-actions","pair":["declare_non_applicable","waive"],"results":[{"status":"declared_non_applicable"},{"status":"blocked","code":"closure_consistency_conflict"}],"approvals":1,"closures":0,"receipts":0}
```


## Arneses reproducibles completos

Guardar fuera de fuentes; las rutas absolutas apuntan al worktree aislado y se adaptan solo al directorio local. prepare.mjs extrae el prefijo fixture del test exacto sin modificarlo y genera bundles en node_modules/.audit-r9 (ignorado por ESLint/Git). prepare-old usa git show de R4-R8 exacto solo para compatibilidad. Ejecutar con Node 24 y después de build/install. Las sondas no son tests incorporados al producto.

### prepare.mjs

```javascript
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=resolve('C:/Users/Judirico/Documents/QAMCP/audit-r4-r9');
const req=createRequire(root+'/package.json');const tr=createRequire(req.resolve('tsup/package.json'));const {build}=await import(pathToFileURL(tr.resolve('esbuild')));
let fixture=readFileSync(root+'/packages/mcp/src/__tests__/canonical-coverage.test.ts','utf8').split("describe('VNEXT-013-R5 Comprehensive Physical Test Matrix'")[0];
fixture=fixture.replace("import { afterEach, describe, expect, it, vi } from 'vitest';","const afterEach=()=>{}; const vi={restoreAllMocks(){}};");
fixture+='\nexport {fixture,makeDecision,CanonicalClosureService,SqliteModuleClosureStore,SqliteKnowledgeAdapter};';
await build({stdin:{contents:fixture,resolveDir:root+'/packages/mcp/src/__tests__',loader:'ts'},bundle:true,packages:'external',platform:'node',format:'esm',outfile:root+'/packages/mcp/node_modules/.audit-r9/fixture.mjs'});
const stdio=readFileSync(root+'/docs/vnext/auditorias/VNEXT-014-R4-R7/COMANDOS.md','utf8').split('```javascript')[1].split('```')[0];
writeFileSync(root+'/packages/mcp/node_modules/.audit-r9/stdio.mjs',stdio);
```

### prepare-old.mjs

```javascript
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const root='C:/Users/Judirico/Documents/QAMCP/audit-r4-r9';const req=createRequire(root+'/package.json'),tr=createRequire(req.resolve('tsup/package.json'));const {build}=await import(pathToFileURL(tr.resolve('esbuild')));
const old=execFileSync('git',['show','44c69f826a0599eeee400ff413ae9faedeeecd75:packages/mcp/src/handlers/canonical-coverage-service.ts'],{cwd:root,encoding:'utf8'});
const closure=execFileSync('git',['show','44c69f826a0599eeee400ff413ae9faedeeecd75:packages/mcp/src/handlers/canonical-closure-service.ts'],{cwd:root,encoding:'utf8'});
for(const [name,contents] of [['old-coverage',old],['old-closure',closure]])await build({stdin:{contents,resolveDir:root+'/packages/mcp/src/handlers',loader:'ts'},bundle:true,packages:'external',platform:'node',format:'esm',outfile:root+'/packages/mcp/node_modules/.audit-r9/'+name+'.mjs',plugins:[{name:'exact-old-coverage',setup(b){b.onLoad({filter:/canonical-coverage-service\.ts$/},()=>({contents:old,loader:'ts',resolveDir:root+'/packages/mcp/src/handlers'}));}}]});
```

### probe.mjs

```javascript
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync,spawn} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {fixture,makeDecision,CanonicalClosureService,SqliteKnowledgeAdapter} from '../audit-r4-r9/packages/mcp/node_modules/.audit-r9/fixture.mjs';
const categories=['functional','business_rule','security','ui','ux','regression','performance'];
const all={confirmedReqs:categories.map(category=>({category,title:category,criteria:['Criterio sintético aislado']}))};
const command=action=>action==='declare_non_applicable'?{action,decisions:[{category:'performance',reason:'Exclusión sintética aislada para probar concurrencia del servicio'}]}:action==='accept_gaps'?{action,accepted_gaps:[{gap_id:'gap:catalog:nonexistent-audit-probe',reason:'Aceptación sintética aislada de esta brecha de cobertura'}]}:action==='waive'?{action,reason:'Renuncia sintética aislada para probar garantías de concurrencia'}:{action};
const actions=['declare_non_applicable','accept_gaps','close','waive'];
const emit=x=>console.log(JSON.stringify(x));
const history=f=>{const d=new DatabaseSync(f.closureStorePath);const rows=d.prepare('select generation,hex(payload) payload from closure_history order by generation').all();d.close();return rows;};
const clean=f=>{f.closureStore.close();f.store.close();};
async function revise(f,s=f.store,id='req-conf-1'){const r=await s.get('app-r5','requirement',id);return s.commit('app-r5',[{kind:'requirement',expected_revision:r.revision,entity:{...r.entity,description:'Revisión adversarial aislada'},trace:r.trace}]);}
const smoke=new DatabaseSync(':memory:');smoke.exec("create virtual table audit using fts5(text);insert into audit values('physical')");assert.equal(smoke.prepare("select count(*) n from audit where audit match 'physical'").get().n,1);emit({runtime:process.version,...smoke.prepare('select sqlite_version() sqlite').get(),fts5:true});smoke.close();
// Four action paths, mutation while gateway awaits: exact rollback/readback/history.
for(const action of actions){let f;f=await fixture({...all,gateway:{reviewClosure:async r=>{await revise(f);return makeDecision(r);}}});if(action==='accept_gaps'){clean(f);f=await fixture({confirmedReqs:all.confirmedReqs.slice(0,1),gateway:{reviewClosure:async r=>{await revise(f);return makeDecision(r);}}});}
try{const before=f.closureStore.read(f.context),h=history(f),life=readFileSync(f.lifecyclePath,'utf8'),relations=await f.store.query('app-r5','relation');const result=await f.closureService.execute('catalog',command(action));assert.equal(result.status,'blocked');assert.deepEqual(f.closureStore.read(f.context),before);assert.deepEqual(history(f),h);assert.equal(readFileSync(f.lifecyclePath,'utf8'),life);assert.deepEqual(await f.store.query('app-r5','relation'),relations);const reopened=f.openClosureStore();assert.deepEqual(reopened.read(f.context),before);reopened.close();emit({scenario:'gateway-mutation',action,code:result.code,zeroAuthorizationWrites:true,readback:true});}finally{clean(f);}}
// Try normal writes via a second physical adapter in each transaction boundary. Catch busy to allow the legitimate consumer to finish.
for(const action of actions)for(const stage of ['entry','before-callback','after-callback']){
 const f=await fixture(action==='accept_gaps'?{confirmedReqs:all.confirmedReqs.slice(0,1)}:all);const other=new SqliteKnowledgeAdapter(f.knowledgePath,{busy_timeout_ms:0});let attempts=0;
 const original=f.closureStore.transaction.bind(f.closureStore);
 const attempt=async()=>{attempts++;await assert.rejects(()=>revise(f,other),e=>e.code==='UNAVAILABLE');};
 f.closureStore.transaction=async(s,op)=>{if(stage==='entry')await attempt();return original(s,async snap=>{if(stage==='before-callback')await attempt();const value=await op(snap);if(stage==='after-callback')await attempt();return value;});};
 const svc=new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>makeDecision(r)});
 try{const result=await svc.execute('catalog',command(action));assert.equal(attempts,1);assert.equal(result.status,({declare_non_applicable:'declared_non_applicable',accept_gaps:'gaps_accepted',close:'closed',waive:'waived'})[action]);assert.equal((await f.store.get('app-r5','requirement','req-conf-1')).revision,1);await revise(f,other);assert.equal((await f.store.get('app-r5','requirement','req-conf-1')).revision,2);emit({scenario:'second-adapter',action,stage,writerBlocked:true,consumer:result.status,writerRecovered:true});}finally{other.close();clean(f);}
}
// Unhandled writer conflict rolls back authorization at all action paths.
for(const action of actions){const f=await fixture(action==='accept_gaps'?{confirmedReqs:all.confirmedReqs.slice(0,1)}:all);const other=new SqliteKnowledgeAdapter(f.knowledgePath,{busy_timeout_ms:0});const original=f.closureStore.transaction.bind(f.closureStore),before=f.closureStore.read(f.context),h=history(f),life=readFileSync(f.lifecyclePath,'utf8');f.closureStore.transaction=(s,op)=>original(s,async snap=>{await op(snap);await revise(f,other);});try{const result=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>makeDecision(r)}).execute('catalog',command(action));assert.equal(result.status,'blocked');assert.deepEqual(f.closureStore.read(f.context),before);assert.deepEqual(history(f),h);assert.equal(readFileSync(f.lifecyclePath,'utf8'),life);assert.equal((await f.store.query('app-r5','relation')).items.length,0);emit({scenario:'rollback-after-callback',action,code:result.code,zeroWrites:true});}finally{other.close();clean(f);}}
// Independent physical process attempts a SQLite write lock while the fence is held, then retries after release.
const p=await fixture();const child=path=>{const result=spawnSync(process.execPath,['--input-type=module','-e',`import {DatabaseSync} from 'node:sqlite';const d=new DatabaseSync(process.argv[1]);d.exec('PRAGMA busy_timeout=0');try{d.exec('BEGIN IMMEDIATE;ROLLBACK');console.log('WRITABLE')}catch(e){console.log('BLOCKED:'+e.errcode)}finally{d.close()}`,path],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);return result.stdout.trim();};try{await p.store.withWriteFence('app-r5',async()=>assert.equal(child(p.knowledgePath),'BLOCKED:5'));assert.equal(child(p.knowledgePath),'WRITABLE');await assert.rejects(()=>p.store.withWriteFence('app-r5',async()=>{throw Error('fault')}));assert.equal(child(p.knowledgePath),'WRITABLE');emit({scenario:'physical-process',blockedDuringFence:true,releasedAfterSuccessAndThrow:true});}finally{clean(p);}
// Lifecycle is mutable independently from Knowledge: after final validation, at transaction entry.
for(const action of actions){const f=await fixture(action==='accept_gaps'?{confirmedReqs:all.confirmedReqs.slice(0,1)}:all);const original=f.closureStore.transaction.bind(f.closureStore);f.closureStore.transaction=async(s,op)=>{const life=JSON.parse(readFileSync(f.lifecyclePath,'utf8'));life.session.id='different-session';life.session.plan[0].path='/different-binding';writeFileSync(f.lifecyclePath,JSON.stringify(life));return original(s,op);};try{const result=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>makeDecision(r)}).execute('catalog',command(action));const after=f.closureStore.read(f.context);assert.equal(after.approvals.length,1);emit({scenario:'lifecycle-session-binding-drift',action,result:result.status,approvals:after.approvals.length,changedSession:JSON.parse(readFileSync(f.lifecyclePath,'utf8')).session.id});}finally{clean(f);}}
// Expiry AFTER operation checks but BEFORE actual closure_history COMMIT.
for(const action of actions){const f=await fixture(action==='accept_gaps'?{confirmedReqs:all.confirmedReqs.slice(0,1)}:all);const original=f.closureStore.transaction.bind(f.closureStore);let expires;f.closureStore.transaction=(s,op)=>original(s,async snap=>{const value=await op(snap);await new Promise(r=>setTimeout(r,Math.max(0,expires-Date.now()+30)));return value;});try{const result=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>{expires=Date.now()+250;return {...makeDecision(r),expiresAt:new Date(expires).toISOString()};}}).execute('catalog',command(action));assert.equal(f.closureStore.read(f.context).approvals.length,1);assert.ok(Date.now()>expires);emit({scenario:'expires-before-durable-commit',action,result:result.status,approvalPersisted:true});}finally{clean(f);}}
```

### extra.mjs

```javascript
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {DatabaseSync} from 'node:sqlite';
import {fixture,makeDecision,CanonicalClosureService,SqliteKnowledgeAdapter} from '../audit-r4-r9/packages/mcp/node_modules/.audit-r9/fixture.mjs';
const emit=x=>console.log(JSON.stringify(x));
const cmd={action:'declare_non_applicable',decisions:[{category:'performance',reason:'Exclusión aislada sintética para pruebas del contrato de autorización'}]};
const close=f=>{f.closureStore.close();f.store.close();};
// Two calls / independent Closure connections: isolate identity and eventual retry.
for(let run=1;run<=3;run++){const f=await fixture({gateway:{reviewClosure:async r=>makeDecision(r)}});const other=f.openClosureStore();const svc=new CanonicalClosureService(f.store,f.context,other,{reviewClosure:async r=>makeDecision(r)});try{const results=await Promise.all([f.closureService.execute('catalog',{action:'waive',reason:'Renuncia concurrente sintética del consumidor A'}),svc.execute('catalog',{action:'waive',reason:'Renuncia concurrente sintética del consumidor B'})]);assert.equal(f.closureStore.read(f.context).approvals.length,1);const before=f.closureStore.read(f.context);const retry=await svc.execute('catalog',{action:'waive',reason:'Renuncia concurrente sintética del consumidor B'});assert.equal(retry.idempotent,true);assert.deepEqual(f.closureStore.read(f.context),before);emit({scenario:'two-consumers',run,results:results.map(r=>({status:r.status,code:r.code})),retry:retry.status,singleApproval:true});}finally{other.close();close(f);}}
// ID reuse rejects without new history or decisions.
const reuse=await fixture({gateway:{reviewClosure:async r=>({...makeDecision(r),approvalId:'audit-single-use'})}});try{assert.equal((await reuse.closureService.execute('catalog',cmd)).status,'declared_non_applicable');const before=reuse.closureStore.read(reuse.context);const second=await reuse.closureService.execute('catalog',cmd);assert.equal(second.status,'blocked');assert.deepEqual(reuse.closureStore.read(reuse.context),before);emit({scenario:'approval-id-reuse',code:second.code,unchanged:true});}finally{close(reuse);}
// New pending requirement and binding revision added during gateway both invalidate exact review.
for(const mutation of ['new-pending','module-revision']){let f;f=await fixture({observationalReqs:[{category:'security',title:'Pendiente aislado'}],gateway:{reviewClosure:async r=>{if(mutation==='new-pending'){const req=await f.store.get('app-r5','requirement','req-obs-1');await f.store.commit('app-r5',[{kind:'requirement',expected_revision:0,entity:{...req.entity,id:'req-new-audit'},trace:req.trace}]);}else{const m=await f.store.get('app-r5','module','mod-catalog');await f.store.commit('app-r5',[{kind:'module',expected_revision:m.revision,entity:{...m.entity,title:'Nueva revisión sintética'},trace:m.trace}]);}return makeDecision(r);}}});try{const before=f.closureStore.read(f.context),result=await f.closureService.execute('catalog',cmd);assert.equal(result.status,'blocked');assert.deepEqual(f.closureStore.read(f.context),before);emit({scenario:'gateway-'+mutation,code:result.code,zeroWrites:true});}finally{close(f);}}
// Legitimate accept_gaps currently rejects before reaching gateway (no receipt in hypothetical assessment).
let called=0;const gaps=await fixture({gateway:{reviewClosure:async r=>{called++;return makeDecision(r);}}});try{const result=await gaps.closureService.execute('catalog',{action:'accept_gaps',accepted_gaps:[{gap_id:'gap:catalog:security:unknown_applicability',reason:'Aceptación sintética sustantiva de una brecha existente'}]});assert.equal(result.code,'coverage_invariants_violated');assert.equal(called,0);emit({scenario:'existing-gap-acceptance',code:result.code,gatewayCalls:called,zeroApprovals:gaps.closureStore.read(gaps.context).approvals.length===0});}finally{close(gaps);}
// Relative database path + legal process cwd change fences a different database.
const initialCwd=process.cwd(),root=mkdtempSync(join(tmpdir(),'audit-relative-'));mkdirSync(join(root,'other'));let rel;
try{process.chdir(root);rel=new SqliteKnowledgeAdapter('relative.sqlite');process.chdir(join(root,'other'));let originalWritable=false;await rel.withWriteFence('audit-relative',async()=>{const actual=new DatabaseSync(join(root,'relative.sqlite'));actual.exec('BEGIN IMMEDIATE;ROLLBACK');actual.close();originalWritable=true;});assert.equal(originalWritable,true);emit({scenario:'relative-path-cwd-change',fenceOnDifferentFile:true,originalDatabaseWritable:true});}finally{rel?.close();process.chdir(initialCwd);}
// Physical process termination while fence held: lock release is OS/SQLite behavior, no stale durable authorization manufactured.
const crash=await fixture();try{const url=new URL('../audit-r4-r9/packages/mcp/node_modules/.audit-r9/fixture.mjs',import.meta.url).href;const child=spawn(process.execPath,['--input-type=module','-e',`import {SqliteKnowledgeAdapter} from ${JSON.stringify(url)};const s=new SqliteKnowledgeAdapter(process.argv[1]);await s.withWriteFence('app-r5',async()=>{console.log('HELD');setInterval(()=>{},1000);await new Promise(()=>{});});`,crash.knowledgePath],{stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{child.stdout.on('data',b=>{if(b.toString().includes('HELD'))resolve();});child.on('error',reject);child.on('exit',c=>reject(Error('early child exit '+c)));});const d=new DatabaseSync(crash.knowledgePath);d.exec('PRAGMA busy_timeout=0');assert.throws(()=>d.exec('BEGIN IMMEDIATE'));const done=once(child,'exit');child.kill();await done;d.exec('BEGIN IMMEDIATE;ROLLBACK');d.close();emit({scenario:'hard-process-exit',blockedWhileAlive:true,writerRecoveredAfterKill:true,approvals:crash.closureStore.read(crash.context).approvals.length});}finally{close(crash);}
```

### relative.mjs

```javascript
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {fixture,makeDecision,CanonicalClosureService,SqliteKnowledgeAdapter} from '../audit-r4-r9/packages/mcp/node_modules/.audit-r9/fixture.mjs';
const cwd=process.cwd();const f=await fixture({confirmedReqs:[{category:'functional',title:'Consulta sintética aislada'}]});let rel;
try{mkdirSync(join(f.root,'other'));process.chdir(f.root);rel=new SqliteKnowledgeAdapter('canonical.sqlite');let reviewed;const original=f.closureStore.transaction.bind(f.closureStore);f.closureStore.transaction=async(scope,op)=>{const r=await f.store.get('app-r5','requirement','req-conf-1');await f.store.commit('app-r5',[{kind:'requirement',expected_revision:r.revision,entity:{...r.entity,description:'Revisión posterior a revalidación protegida por fence equivocado'},trace:r.trace}]);return original(scope,op);};const service=new CanonicalClosureService(rel,f.context,f.closureStore,{reviewClosure:async r=>{reviewed=r.coverageDigest;process.chdir(join(f.root,'other'));return makeDecision(r);}});const result=await service.execute('catalog',{action:'declare_non_applicable',decisions:[{category:'performance',reason:'Exclusión sintética aislada del alcance para reproducir carrera'}]});assert.equal(result.status,'declared_non_applicable');assert.equal((await rel.get('app-r5','requirement','req-conf-1')).revision,2);assert.notEqual(result.assessment.coverage_digest,reviewed);console.log(JSON.stringify({scenario:'relative-path-full-stale-authorization',result:result.status,revision:2,approvals:f.closureStore.read(f.context).approvals.length,reviewedDigest:reviewed,currentDigest:result.assessment.coverage_digest}));}finally{rel?.close();f.closureStore.close();f.store.close();process.chdir(cwd);}
```

### history.mjs

```javascript
import assert from 'node:assert/strict';
import {fixture,makeDecision} from '../audit-r4-r9/packages/mcp/node_modules/.audit-r9/fixture.mjs';
import {CanonicalCoverageService as OldCoverage} from '../audit-r4-r9/packages/mcp/node_modules/.audit-r9/old-coverage.mjs';
import {CanonicalClosureService as OldClosure} from '../audit-r4-r9/packages/mcp/node_modules/.audit-r9/old-closure.mjs';
const emit=x=>console.log(JSON.stringify(x));const cmd={action:'declare_non_applicable',decisions:[{category:'performance',reason:'Exclusión sintética para comparar solicitudes de versiones distintas'}]};
for(const hasPending of [false,true]){let oldDecision,request;const f=await fixture(hasPending?{observationalReqs:[{category:'security',title:'Pendiente sintético'}]}:{});try{const a=await new OldCoverage(f.store,f.context,f.closureStore).evaluate('catalog'),b=await f.coverageService.evaluate('catalog');assert.notEqual(a.assessment.coverage_digest,b.assessment.coverage_digest);const previous=new OldClosure(f.store,f.context,f.closureStore,{reviewClosure:async r=>{request=r;return null;}});await previous.execute('catalog',cmd);oldDecision=makeDecision(request);const before=f.closureStore.read(f.context);const current=new (await import('../audit-r4-r9/packages/mcp/node_modules/.audit-r9/fixture.mjs')).CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async()=>oldDecision});const result=await current.execute('catalog',cmd);assert.equal(result.code,'closure_review_invalid');assert.deepEqual(f.closureStore.read(f.context),before);emit({scenario:'old-pending-request',hasPending,digestChanged:true,code:result.code,unchanged:true});}finally{f.closureStore.close();f.store.close();}}
for(const terminal of ['closed','waived']){const f=await fixture({confirmedReqs:['functional','business_rule','security','ui','ux','regression','performance'].map(category=>({category,title:category,criteria:['Criterio sintético aislado']}))});try{const old=new OldClosure(f.store,f.context,f.closureStore,{reviewClosure:async r=>makeDecision(r)});assert.equal((await old.execute('catalog',terminal==='closed'?{action:'close'}:{action:'waive',reason:'Razón histórica sintética sustantiva del propietario'})).status,terminal);const before=f.closureStore.read(f.context);assert.equal((await f.closureService.status('catalog')).state,terminal);assert.equal((await f.closureService.execute('catalog',{action:'close'})).idempotent,true);assert.deepEqual(f.closureStore.read(f.context),before);const reopened=f.openClosureStore();assert.deepEqual(reopened.read(f.context),before);reopened.close();emit({scenario:'historical-terminal',terminal,preserved:true,readback:true});}finally{f.closureStore.close();f.store.close();}}
const f=await fixture();try{const old=new OldClosure(f.store,f.context,f.closureStore,{reviewClosure:async r=>makeDecision(r)});const result=await old.execute('catalog',{action:'accept_gaps',accepted_gaps:[{gap_id:'gap:catalog:security:unknown_applicability',reason:'Aceptación sintética sustantiva de la brecha existente'}]});assert.equal(result.code,'coverage_invariants_violated');emit({scenario:'accept-existing-gap-baseline-r8',code:result.code,preexisting:true});}finally{f.closureStore.close();f.store.close();}
```

### competition.mjs

```javascript
import assert from 'node:assert/strict';
import {fixture,makeDecision,CanonicalClosureService} from '../audit-r4-r9/packages/mcp/node_modules/.audit-r9/fixture.mjs';
const categories=['functional','business_rule','security','ui','ux','regression','performance'];
for(const pair of [['close','waive'],['declare_non_applicable','waive']]){
 const f=await fixture({confirmedReqs:categories.map(category=>({category,title:category,criteria:['Criterio sintético aislado']})),gateway:{reviewClosure:async r=>makeDecision(r)}});const other=f.openClosureStore();const second=new CanonicalClosureService(f.store,f.context,other,{reviewClosure:async r=>makeDecision(r)});const cmd=a=>a==='close'?{action:a}:a==='waive'?{action:a,reason:'Renuncia concurrente sintética del propietario de la fixture'}:{action:a,decisions:[{category:'performance',reason:'Exclusión concurrente sintética para evaluar competencia de acciones'}]};try{const results=await Promise.all([f.closureService.execute('catalog',cmd(pair[0])),second.execute('catalog',cmd(pair[1]))]);const snap=f.closureStore.read(f.context);console.log(JSON.stringify({scenario:'competing-actions',pair,results:results.map(r=>({status:r.status,code:r.code})),approvals:snap.approvals.length,closures:Object.keys(snap.closures).length,receipts:(await f.store.query('app-r5','relation')).items.length}));assert.equal(snap.approvals.length,1);}finally{other.close();f.closureStore.close();f.store.close();}
}
```

## Comprobación adicional de memoria/cierre

```text
{"scenario":"memory-and-closed-adapter","rejectedBeforeCallback":true}
```

```javascript
import assert from 'node:assert/strict';
import {SqliteKnowledgeAdapter} from '../audit-r4-r9/packages/mcp/node_modules/.audit-r9/fixture.mjs';
const s=new SqliteKnowledgeAdapter(':memory:');let entered=false;await assert.rejects(()=>s.withWriteFence('app',async()=>{entered=true;}),e=>e.code==='UNAVAILABLE');assert.equal(entered,false);s.close();await assert.rejects(()=>s.withWriteFence('app',async()=>{}),e=>e.code==='UNAVAILABLE');console.log(JSON.stringify({scenario:'memory-and-closed-adapter',rejectedBeforeCallback:true}));
```
