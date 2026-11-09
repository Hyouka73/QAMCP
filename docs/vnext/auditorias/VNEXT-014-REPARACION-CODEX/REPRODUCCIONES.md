**Auditoría independiente de reparación. Fecha local: 2026-11-05 (America/Mexico_City). HEAD probado: 8f091626825ceb2fa3f1abdfb0732f0f3dad8e9c.**

# Reproducción externa y cadena de evidencia

Las fuentes siguientes son arneses de auditoría, no se instalaron en src/__tests__ ni modifican fuentes/fixtures versionados. Para reproducir: obtener el HEAD probado, pnpm install --frozen-lockfile y pnpm build; extraer los bloques a una carpeta externa reparacion-evidence y ajustar únicamente el root absoluto de esta máquina. Ejecutar setup.mjs desde la raíz del clon. Los fixtures físicos usan temporales nuevos y datos sintéticos. No ejecutar contra bases productivas. Node v24.15.0 es el runtime ensayado.

setup extrae los helpers anteriores al primer describe de las pruebas originales del HEAD; cambia únicamente la inscripción afterEach de Vitest para usarlos fuera del runner y los exporta. Los cuerpos fixture/provision/makeDecision se mantienen. Los tests originales fueron ejecutados intactos por Vitest. Los bundles quedan en node_modules/.audit-reparacion. La rama de transición rechazada y la interrupción de commit se instrumentan solo en el arnés externo y se identifican expresamente.

El JSON baseline se conserva en rescate-evidence/mcp.json. No se afirma que el archivo JSON sea parte del repositorio remoto; su procedencia es la corrida independiente anterior local, cotejada con las 63 identidades y resultados publicados. Esta auditoría publica la matriz completa y los errores actuales para revisión.

## Hashes de evidencia original local

| Archivo | SHA-256 |
| --- | --- |
| C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/audit-install.log | fe24dd6bb2520c855e0695f0ca4dd41ee09c302bdb9eff942c336438a9636355 |
| C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/audit-install-network.log | f663a4dd25c71d378c4a22f822b5afde94cc54cca707bb59489ebcd022a12e1e |
| C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/audit-build.log | 448f60988018de4d1a17b0e77d8e27ef5e9a1047d86662cb74f2030bec7c2bc9 |
| C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/vnext014-audit-mcp-serial.json | 17fcaf859193ac06528ce6c4b4352a35a0a2a5c23ac9645cf059a6351c7e634b |
| C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/vnext014-audit-mcp-parallel.json | fbe65c9d49db8e8ee288d3a2ed212ce8d33973c0647f2c365e664265c8f02991 |
| C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/vnext014-audit-e01-focus.json | ca297ffcbb08af75ae6da3c0c75235ee35cb79110d608ad4b8065b2ed560ad77 |
| C:/Users/Judirico/Documents/QAMCP/rescate-evidence/mcp.json | 77e098afcc8863a71c0d6d9c5439f865a73b7f4b9f1a5d5580e6b7ad229fa2e0 |
| C:/Users/Judirico/Documents/QAMCP/rescate-evidence/lint.json | 9eb1ca66a3588393138adc863b0efd2d125124aae5d8f35001c45d5e614cc0d7 |
| C:\Users\Judirico\Documents\QAMCP\reparacion-evidence\cli-correct-filter.log | 76c584ddd46ebf08934ade2cc84e9604a4e8dc174e461e3a2e7a0ab53ed5d822 |
| C:\Users\Judirico\Documents\QAMCP\reparacion-evidence\cli.log | b89ba1437c053a9e048563964ecf4af364f905cc30205440c35a5e46fc17cd73 |
| C:\Users\Judirico\Documents\QAMCP\reparacion-evidence\commands.jsonl | 0432e710690756b97405578732e11c74163f9d5d7fd6f03245413681d60dd791 |
| C:\Users\Judirico\Documents\QAMCP\reparacion-evidence\comparison-summary.log | 8cfde18792c2476e26bc9b227b717c81009efe812fbd1d2a4f370c6eaf3605b9 |
| C:\Users\Judirico\Documents\QAMCP\reparacion-evidence\crash.log | ccfb395260b2f4a00d3e7b0083d0452e420241249dce479f38cae6d9236c85c0 |
| C:\Users\Judirico\Documents\QAMCP\reparacion-evidence\e01-focus.log | 0df527002e45024290c1ef9b19bc2ed110ce7ac732874d6916546e894fcbd598 |
| C:\Users\Judirico\Documents\QAMCP\reparacion-evidence\e01-full-observed.log | 5d6c8708e50851711713e05bef555691beb4b4f5499e1fb2b8c2bcd9f580a4e3 |
| C:\Users\Judirico\Documents\QAMCP\reparacion-evidence\engine.log | d7dc69955fd0054c36f0b557f6e95ec248f7229e1e1df639e6e1aabe29a508fd |
| C:\Users\Judirico\Documents\QAMCP\reparacion-evidence\existing-only.log | 859369a4fd142772530b85d6477004c60c0aae9d4681b0f88eb6465d88afc3f2 |
| C:\Users\Judirico\Documents\QAMCP\reparacion-evidence\fence-conflict.log | b5839e023ed7cbc02a8930458d21007820925ced978b9d23322437e25ba9f887 |
| C:\Users\Judirico\Documents\QAMCP\reparacion-evidence\fences-harness-expectation.log | faf9b94dbe623ff003b37debdc94e5c81b023ba5e5e00f41ae52ecab50393669 |
| C:\Users\Judirico\Documents\QAMCP\reparacion-evidence\fences.log | cb92037a0feaa58f6fce7f416482fb171ede3b193e88ab58a6178ae972e9a41e |
| C:\Users\Judirico\Documents\QAMCP\reparacion-evidence\focal.log | 37479467232676a930b09a7736a539c91e61d9e95bb4df3f3f43ccf60daf77db |
| C:\Users\Judirico\Documents\QAMCP\reparacion-evidence\fs-events.jsonl | b1fb3ebce6d514a2b383c86031d7c0ba781aac1534271e44d08567fbb53e5330 |
| C:\Users\Judirico\Documents\QAMCP\reparacion-evidence\fs-full-events.jsonl | 2812edfe0b7113918918d94d69866052dcf96cf2858b619ad086c13f75099b48 |
| C:\Users\Judirico\Documents\QAMCP\reparacion-evidence\knowledge.log | 2316d8fa98920c0b186e8cd60b0e334f367bfc26f7fef21301609096aa093a63 |
| C:\Users\Judirico\Documents\QAMCP\reparacion-evidence\lint-comparison.json | cb0b2357d950fb6f575a3bc4f5da4b387846f5b40cb9db48a899b53bca52216f |
| C:\Users\Judirico\Documents\QAMCP\reparacion-evidence\lint-focal.log | f65d79f82ead07e0898404ca6b64126eefe39cb009f8d92b096f2d6e977efd99 |
| C:\Users\Judirico\Documents\QAMCP\reparacion-evidence\lint-json.log | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| C:\Users\Judirico\Documents\QAMCP\reparacion-evidence\lint.json | cb8c39321f14aca1ea018eb55e247a8b390bbac2d09ccda7921d4af230618ba1 |
| C:\Users\Judirico\Documents\QAMCP\reparacion-evidence\lint.log | 31fdc5e2944d44225ad1705a444774bede4f8624b7a581814c8b1d66f3d109bc |
| C:\Users\Judirico\Documents\QAMCP\reparacion-evidence\mcp-comparison.json | 4e7669a7b5e55964329c3206a97c130b2129d8034938dc3bd72d1822b4a406d1 |
| C:\Users\Judirico\Documents\QAMCP\reparacion-evidence\mcp-parallel-repeat.log | f403d8b0ebde54c538c35ff50d0a3e01a344c8ac20f7af09414fd80a3d9d7b86 |
| C:\Users\Judirico\Documents\QAMCP\reparacion-evidence\mcp-parallel.log | 69b0ea88993302807f541fc37026c531e35884ed620ee4377642997b89166953 |
| C:\Users\Judirico\Documents\QAMCP\reparacion-evidence\mcp-serial.log | b820b5339790be088b110c2c5b8131fbd73b1f13b036690c4d51ae1090d1632b |
| C:\Users\Judirico\Documents\QAMCP\reparacion-evidence\parallel-comparison.json | 7541703939600d43eedb312ab01349b36701e304b86afeb7cfd3e75b039a2543 |
| C:\Users\Judirico\Documents\QAMCP\reparacion-evidence\receipt-revisions.log | 980f02d495780fe92e77d157810a2a0cc4bf64ea75aab0401fa0bf6ea6136be2 |
| C:\Users\Judirico\Documents\QAMCP\reparacion-evidence\report.log | 453ef02f595e35cec1e1161e66c97a12ecf77c3f94dc3ed50d1bb818bda8485e |
| C:\Users\Judirico\Documents\QAMCP\reparacion-evidence\runner.log | 46abce9ff6e3e5b4d8afa1938367ed959998f8f5070efa479c45ab5a57ed22d8 |
| C:\Users\Judirico\Documents\QAMCP\reparacion-evidence\stdio.log | 8a042d27be5f100b48bfa2d4a3e5bd010fac88db53d4aeb5bc222c1c5e186362 |
| C:\Users\Judirico\Documents\QAMCP\reparacion-evidence\transition-rejected.log | 5f2d89f2b57505582b0f595fa91c180a13ae58035dc994bcb99ad07831a127b4 |
| C:\Users\Judirico\Documents\QAMCP\reparacion-evidence\wrapper.log | b84791f110cb0b3a1d3e50534bd397a843f45d4e5d4038394b429ef272772f8a |

## Código completo de los arneses

### setup.mjs

~~~javascript
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const root='C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit';
const out=root+'/packages/mcp/node_modules/.audit-reparacion';
mkdirSync(out,{recursive:true});
const req=createRequire(root+'/package.json'),tr=createRequire(req.resolve('tsup/package.json'));
const {build}=await import(pathToFileURL(tr.resolve('esbuild')));
let source=readFileSync(root+'/packages/mcp/src/__tests__/canonical-coverage.test.ts','utf8').split("describe('VNEXT-013-R5 Comprehensive Physical Test Matrix'")[0];
source=source.replace("import { afterEach, describe, expect, it, vi } from 'vitest';","const afterEach=()=>{}; const vi={restoreAllMocks(){}};");
source+="\nexport {withClosureCommitDeadline} from '../handlers/module-closure-store.js';";
source+='\nexport {fixture,makeDecision,CanonicalClosureService,SqliteModuleClosureStore,SqliteKnowledgeAdapter,FileSystemStorage,createMcpServer};';
await build({stdin:{contents:source,resolveDir:root+'/packages/mcp/src/__tests__',loader:'ts'},bundle:true,packages:'external',platform:'node',format:'esm',outfile:out+'/fixture.mjs'});
source=readFileSync(root+'/packages/mcp/src/__tests__/host-composition.test.ts','utf8').split("describe('VNEXT-014 host-owned Stdio composition'")[0];
source=source.replace("import { afterEach, describe, expect, it } from 'vitest';","const afterEach=()=>{};");
source+='\nexport {provision,loadHostComposition,createMcpServer};';
await build({stdin:{contents:source,resolveDir:root+'/packages/mcp/src/__tests__',loader:'ts'},bundle:true,packages:'external',platform:'node',format:'esm',outfile:out+'/host.mjs'});
let util=readFileSync('../rescate-evidence/util.mjs','utf8').replace('../audit-r4-r10/packages/mcp/node_modules/.audit-rescate/fixture.mjs','../vnext014-reparacion-audit/packages/mcp/node_modules/.audit-reparacion/fixture.mjs');
writeFileSync('../reparacion-evidence/util.mjs',util);
let wrapper=readFileSync('../rescate-evidence/wrapper.mjs','utf8');
writeFileSync('../reparacion-evidence/wrapper.mjs',wrapper);
console.log(JSON.stringify({root,out,source:'helpers extracted unchanged from audited HEAD; no tests edited'}));
source=readFileSync(root+'/packages/knowledge/src/storage/knowledge-sqlite-schema.ts','utf8')+'\nexport {definitions,checksum};';
await build({stdin:{contents:source,resolveDir:root+'/packages/knowledge/src/storage',loader:'ts'},bundle:true,packages:'external',platform:'node',format:'esm',outfile:root+'/packages/knowledge/node_modules/.audit-reparacion-schema.mjs'});
~~~

### util.mjs

~~~javascript
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {DatabaseSync} from 'node:sqlite';
import {fixture,makeDecision,CanonicalClosureService,FileSystemStorage,withClosureCommitDeadline} from '../vnext014-reparacion-audit/packages/mcp/node_modules/.audit-reparacion/fixture.mjs';
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

### report.mjs

~~~javascript
import {assert,fixture,makeDecision,FileSystemStorage,emit,capture,clean,history,sleep} from './util.mjs';
import {createMcpServer,SqliteKnowledgeAdapter} from '../vnext014-reparacion-audit/packages/mcp/node_modules/.audit-reparacion/fixture.mjs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {readFileSync,mkdirSync,existsSync,rmdirSync} from 'node:fs';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
const root='C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit';
const bundle=pathToFileURL(root+'/packages/mcp/node_modules/.audit-reparacion/fixture.mjs').href;
const req=createRequire(root+'/package.json');
const {Client}=await import(pathToFileURL(req.resolve('@modelcontextprotocol/sdk/client/index.js')));
const {InMemoryTransport}=await import(pathToFileURL(req.resolve('@modelcontextprotocol/sdk/inMemory.js')));
export async function connect(f,bindings=f.context.moduleBindings,factory=createMcpServer){
 const server=factory({projectRoots:[f.root],knowledgeBindings:[{...f.context,moduleBindings:bindings,store:f.store,moduleClosureStore:f.closureStore}]});
 const client=new Client({name:'independent-repair-audit',version:'1'}),[ct,st]=InMemoryTransport.createLinkedPair();await server.connect(st);await client.connect(ct);
 return {server,client,call:async()=>{try{const r=await client.callTool({name:'qap_session_close',arguments:{targetPath:f.root}});try{return {...JSON.parse(r.content[0].text),isError:r.isError};}catch{return {status:'error',message:r.content[0].text,isError:r.isError};}}catch(e){return {status:'error',message:e.message};}}};
}
function physical(f){const db=new DatabaseSync(f.knowledgePath,{readOnly:true});try{return db.prepare("SELECT kind,id,revision,entity_json,trace_json FROM knowledge_revisions WHERE kind='relation' ORDER BY id,revision").all();}finally{db.close();}}
async function run(variant){
 let reviews=0;const f=await fixture({gateway:{reviewClosure:async r=>{reviews++;return makeDecision(r);}}});
 const reason='Independent synthetic audit fixture; never authentic human consent';
 assert.equal((await f.closureService.execute('catalog',{action:'waive',reason})).status,'waived');
 const reportPath=join(f.root,'.qa/project/sessions/session-r5.report.md'),before=await capture(f),baseHistory=history(f);
 const fs=new FileSystemStorage({rootDir:f.root});let handled=false,reads=0,acceptedCAS=false,knowledgeRejected;
 const originalQuery=f.store.query.bind(f.store),originalGet=f.store.get.bind(f.store);
 const receipt=(await f.store.query('app-r5','relation')).items[0];
 if(variant==='write-error')mkdirSync(reportPath,{recursive:true});
 if(variant==='no-approval')await f.closureStore.transaction(f.context,async s=>{s.approvals=[];});
 if(variant==='missing-receipt'){
   // Create a second real empty Knowledge DB with only the original non-receipt records.
   // sessionReport is invoked directly before reconcile; no get response is falsified.
   const dbPath=join(f.root,'without-receipt.sqlite'),empty=new SqliteKnowledgeAdapter(dbPath);
   for(const kind of ['application','environment','module']){const rec=await f.store.get('app-r5',kind,kind==='application'?'app-r5':kind==='environment'?'local':'mod-catalog');await empty.commit('app-r5',[{kind,expected_revision:0,entity:rec.entity,trace:rec.trace}]);}
   const {CanonicalClosureService}=await import(bundle);const svc=new CanonicalClosureService(empty,f.context,f.closureStore);
   await assert.rejects(svc.sessionReport(),/canonical_report_receipt_missing_or_invalid/);
   assert.equal((await empty.query('app-r5','relation')).items.length,0);
   await svc.reconcile('catalog');assert.equal((await empty.query('app-r5','relation')).items.length,1);
   assert.equal((await svc.sessionReport()).length,1);empty.close();
   emit({scenario:variant,result:'PASS',physicalAbsent:true,directReportRejected:true,reconcileRecoveredOneReceipt:true});clean(f);return;
 }
 f.store.query=async(app,kind,opts)=>{
   if(kind==='requirement'&&!handled&&variant.startsWith('lifecycle-')){
     handled=true;
     if(variant==='lifecycle-process'){
       const code=`import {FileSystemStorage} from ${JSON.stringify(bundle)};await new FileSystemStorage({rootDir:process.argv[1]}).updateLifecycleState(s=>{s.modules.late={state:'planned',updated_at:new Date().toISOString()};s.session.plan.push({module:'late',path:'/late'});return s;});`;
       const p=spawnSync(process.execPath,['--input-type=module','-e',code,f.root],{encoding:'utf8',timeout:15000});assert.equal(p.status,0,p.stderr);
     }else await fs.updateLifecycleState(s=>{if(variant==='lifecycle-plan'){s.modules.late={state:'planned',updated_at:new Date().toISOString()};s.session.plan.push({module:'late',path:'/late'});}if(variant==='lifecycle-session')s.session.id='concurrent-session';if(variant==='lifecycle-phase')s.phase='SCOPING';return s;});
   }
   return originalQuery(app,kind,opts);
 };
 f.store.get=async(app,kind,id,...rest)=>{
   if(kind==='relation'&&id===receipt.id){
     reads++;
     if(!handled&&reads===2&&variant.startsWith('receipt-')){
       handled=true;const rec=await originalGet(app,kind,id,...rest);
       const entity=structuredClone(rec.entity),trace=structuredClone(rec.trace);
       if(variant==='receipt-source')trace.source='wrong-provenance';
       if(variant==='receipt-target')entity.target={kind:'module',id:'mod-catalog',revision:1};
       if(variant==='receipt-module-revision')entity.source.revision=999;
       if(variant==='receipt-application-revision')entity.target.revision=999;
       if(variant==='receipt-digest')trace.reason='tampered-digest';
       if(variant==='receipt-module-existing-revision'||variant==='receipt-application-existing-revision'){
         const targetKind=variant==='receipt-module-existing-revision'?'module':'application';
         const existing=await originalGet(app,targetKind,targetKind==='module'?'mod-catalog':'app-r5');
         await f.store.commit(app,[{kind:targetKind,expected_revision:existing.revision,entity:existing.entity,trace:existing.trace}]);
         if(targetKind==='module')entity.source.revision=2;else entity.target.revision=2;
       }
       if(variant==='receipt-process'){
         const code=`import {SqliteKnowledgeAdapter} from ${JSON.stringify(bundle)};const s=new SqliteKnowledgeAdapter(process.argv[1]);const r=await s.get('app-r5','relation',process.argv[2]);await s.commit('app-r5',[{kind:'relation',expected_revision:r.revision,entity:r.entity,trace:{...r.trace,source:'wrong-provenance-process'}}]);s.close();`;
         const p=spawnSync(process.execPath,['--input-type=module','-e',code,f.knowledgePath,id],{encoding:'utf8',timeout:15000});assert.equal(p.status,0,p.stderr);acceptedCAS=true;
       }else{try{await f.store.commit(app,[{kind:'relation',expected_revision:rec.revision,entity,trace}]);acceptedCAS=true;}catch(e){knowledgeRejected=e.code??e.message;}}
     }
   }
   return originalGet(app,kind,id,...rest);
 };
 let bindings=f.context.moduleBindings;
 if(variant==='binding-module-revision')bindings=bindings.map(b=>({...b,moduleRevision:2}));
 if(variant==='binding-application-revision')bindings=bindings.map(b=>({...b,applicationRevision:2}));
 const originalFence=FileSystemStorage.prototype.commitLifecycleStateWithFence;
 if(variant==='commit-error')FileSystemStorage.prototype.commitLifecycleStateWithFence=function(tx){return originalFence.call(this,(current,commit)=>tx(current,next=>{assert.ok(existsSync(reportPath));throw Error('AUDIT_PHYSICAL_COMMIT_INTERRUPTED');}));};
 const c=await connect(f,bindings);
 try{
   const result=await c.call(),life=JSON.parse(readFileSync(f.lifecyclePath));
   const report=existsSync(reportPath)&&variant!=='write-error';
   const rows=physical(f);
   if(variant==='normal'||knowledgeRejected){assert.equal(result.status,'success',JSON.stringify(result));assert.equal(life.phase,'WRAP_UP');}
   else {assert.notEqual(result.status,'success',JSON.stringify(result));assert.notEqual(life.phase,'WRAP_UP');}
   if(variant.startsWith('lifecycle-')){assert.equal(result.code,'session_context_changed');assert.equal(report,false);}
   if(acceptedCAS){assert.equal(report,false);const latest=await originalGet('app-r5','relation',receipt.id);assert.equal(latest.revision,2);await assert.rejects(f.closureService.reconcile('catalog'),/closure_receipt_provenance_invalid/);await assert.rejects(f.closureService.sessionReport(),/canonical_report_receipt_missing_or_invalid/);}
   assert.deepEqual(f.closureStore.read(f.context),variant==='no-approval'?f.closureStore.read(f.context):before.snapshot);
   if(variant!=='no-approval')assert.deepEqual(history(f),baseHistory);
   const other=f.openClosureStore();assert.deepEqual(other.read(f.context),f.closureStore.read(f.context));other.close();
   emit({scenario:variant,result:'PASS',response:result,physicalPhase:life.phase,reportExists:report,receiptReads:reads,acceptedCAS,knowledgeRejected,physicalRows:rows,reviews,historyUnchanged:variant!=='no-approval'});
   if(['commit-error','write-error'].includes(variant)){
     FileSystemStorage.prototype.commitLifecycleStateWithFence=originalFence;
     if(variant==='write-error')rmdirSync(reportPath);
     const retry=await c.call();assert.equal(retry.status,'success',JSON.stringify(retry));assert.equal(JSON.parse(readFileSync(f.lifecyclePath)).phase,'WRAP_UP');assert.deepEqual(history(f),baseHistory);assert.deepEqual(f.closureStore.read(f.context),before.snapshot);assert.equal(physical(f).length,1);assert.equal(reviews,1);
     emit({scenario:variant+'-recovery',result:'PASS',phase:retry.fase,reviews,receipts:1,historyUnchanged:true});
   }
   if(variant==='normal'){
     const retry=await c.call();assert.equal(retry.status,'blocked');assert.deepEqual(history(f),baseHistory);assert.equal(physical(f).length,1);assert.equal(reviews,1);emit({scenario:'normal-retry',result:'PASS',status:retry.status,approvals:1,receipts:1,historyUnchanged:true});
   }
 }finally{FileSystemStorage.prototype.commitLifecycleStateWithFence=originalFence;await c.client.close();await c.server.close();clean(f);}
}
if(process.argv[2]!=='library')for(const variant of (process.env.AUDIT_SCENARIOS?.split(',')??['normal','lifecycle-plan','lifecycle-process','lifecycle-session','lifecycle-phase','receipt-source','receipt-process','receipt-target','receipt-revision','receipt-module-revision','receipt-application-revision','receipt-digest','binding-module-revision','binding-application-revision','missing-receipt','no-approval','write-error','commit-error'])){
 try{await run(variant);}catch(e){emit({scenario:variant,result:'HARNESS_FAILURE',error:e.stack});process.exitCode=1;}
}
~~~

### existing-only.mjs

~~~javascript
import {provision,loadHostComposition} from '../vnext014-reparacion-audit/packages/mcp/node_modules/.audit-reparacion/host.mjs';
import {definitions,checksum} from '../vnext014-reparacion-audit/packages/knowledge/node_modules/.audit-reparacion-schema.mjs';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,existsSync,statSync} from 'node:fs';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const digest=p=>existsSync(p)?{size:statSync(p).size,sha256:createHash('sha256').update(readFileSync(p)).digest('hex')}:null;
function snap(p){
 const content=digest(p),sidecarsBefore={wal:digest(p+'-wal'),shm:digest(p+'-shm')};let sqlite;
 try{const db=new DatabaseSync(p,{readOnly:true});try{sqlite={version:db.prepare('PRAGMA user_version').get(),applicationId:db.prepare('PRAGMA application_id').get(),schema:db.prepare('SELECT name,type,sql FROM sqlite_master ORDER BY name').all()};}finally{db.close();}}catch(e){sqlite={error:e.message};}
 return {content,sqlite,sidecarsBefore,sidecarsAfterRead:{wal:digest(p+'-wal'),shm:digest(p+'-shm')}};
}
for(const variant of ['empty','v1','valid-v2','incompatible','fake-v2']){
 const f=await provision();let p=f.manifest.knowledgeDbPath;
 if(variant!=='valid-v2'){p=join(f.root,variant+'.sqlite');writeFileSync(p,'');f.manifest.knowledgeDbPath=p;
   if(variant==='v1'){const db=new DatabaseSync(p);db.exec('BEGIN IMMEDIATE');for(const sql of definitions)db.exec(sql);db.prepare('INSERT INTO knowledge_migrations VALUES (?,?,?,?,?)').run(1,checksum,'2026-11-05T12:00:00Z','ok','a'.repeat(64));db.exec('PRAGMA application_id=1363234891; PRAGMA user_version=1; COMMIT');db.close();}
   if(variant==='incompatible'){const db=new DatabaseSync(p);db.exec('CREATE TABLE foreign_data (value TEXT); PRAGMA application_id=7; PRAGMA user_version=9');db.close();}
   if(variant==='fake-v2'){const db=new DatabaseSync(p);db.exec("CREATE TABLE knowledge_migrations (version INTEGER,integrity_result TEXT); INSERT INTO knowledge_migrations VALUES (1,'ok'),(2,'ok'); PRAGMA application_id=1363234891; PRAGMA user_version=2");db.close();}
 }
 writeFileSync(f.manifestPath,JSON.stringify(f.manifest));const before=snap(p);let result,error,c;
 try{c=await loadHostComposition(f.env);result='accepted';}catch(e){result='rejected';error=e.message;}finally{c?.close();}
 const after=snap(p);
 assert.equal(result,variant==='valid-v2'?'accepted':'rejected');
 if(variant!=='valid-v2')assert.deepEqual(after,before);
 console.log(JSON.stringify({scenario:variant,result,error,unchanged:JSON.stringify(before)===JSON.stringify(after),before,after}));
}
~~~

### crash.mjs

~~~javascript
import {assert,fixture,makeDecision,emit,capture,clean,history,sleep} from './util.mjs';
import {writeFileSync,readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
process.argv[2]='library';const {connect}=await import('./report.mjs');
let reviews=0;const f=await fixture({gateway:{reviewClosure:async r=>{reviews++;return makeDecision(r);}}});
assert.equal((await f.closureService.execute('catalog',{action:'waive',reason:'Independent controlled synthetic review for crash recovery only'})).status,'waived');
const before=await capture(f),beforeHistory=history(f),configPath=join(f.root,'audit-crash-config.json');
writeFileSync(configPath,JSON.stringify({root:f.root,context:f.context,knowledgePath:f.knowledgePath,closureStorePath:f.closureStorePath,key:f.closureKey.toString('hex')}));
const child=spawnSync(process.execPath,[fileURLToPath(new URL('./crash-child.mjs',import.meta.url)),configPath],{encoding:'utf8',timeout:20000});
assert.equal(child.status,83,child.stderr);assert.match(child.stdout,/AUDIT_REPORT_PUBLISHED/);
assert.equal(JSON.parse(readFileSync(f.lifecyclePath)).phase,'WORKING');assert.ok(existsSync(join(f.root,'.qa/project/sessions/session-r5.report.md')));
assert.deepEqual(f.closureStore.read(f.context),before.snapshot);assert.deepEqual(history(f),beforeHistory);
emit({scenario:'hard-exit-before-physical-lifecycle-commit',exit:child.status,result:'PASS',reportPublished:true,physicalPhase:'WORKING',approvalsUnchanged:true,historyUnchanged:true});
// Respect the unmodified production stale-lock recovery policy.
await sleep(10600);
const c=await connect(f);try{const result=await c.call();assert.equal(result.status,'success',JSON.stringify(result));assert.equal(JSON.parse(readFileSync(f.lifecyclePath)).phase,'WRAP_UP');assert.deepEqual(f.closureStore.read(f.context),before.snapshot);assert.deepEqual(history(f),beforeHistory);assert.equal((await f.store.query('app-r5','relation')).items.length,1);assert.equal(reviews,1);
emit({scenario:'hard-exit-retry',result:'PASS',phase:'WRAP_UP',reviews,approvals:1,receipts:1,historyUnchanged:true,productionStaleLockMs:10000});
}finally{await c.client.close();await c.server.close();clean(f);}
~~~

### crash-child.mjs

~~~javascript
import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {FileSystemStorage,SqliteKnowledgeAdapter,SqliteModuleClosureStore} from '../vnext014-reparacion-audit/packages/mcp/node_modules/.audit-reparacion/fixture.mjs';
const data=JSON.parse(readFileSync(process.argv[2]));process.argv[2]='library';
const {connect}=await import('./report.mjs');
const f={root:data.root,context:data.context,store:new SqliteKnowledgeAdapter(data.knowledgePath),closureStore:new SqliteModuleClosureStore({...data.context,path:data.closureStorePath,key:Buffer.from(data.key,'hex'),protection:'host_private_directory_and_managed_key'})};
const original=FileSystemStorage.prototype.commitLifecycleStateWithFence;
FileSystemStorage.prototype.commitLifecycleStateWithFence=function(tx){return original.call(this,(current,commit)=>tx(current,next=>{
 if(!existsSync(join(data.root,'.qa/project/sessions/session-r5.report.md')))process.exit(84);
 console.log('AUDIT_REPORT_PUBLISHED_BEFORE_LIFECYCLE_COMMIT');process.exit(83);
}));};
const c=await connect(f);await c.call();process.exit(85);
~~~

### transition-rejected.mjs

~~~javascript
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {assert,fixture,makeDecision,emit,history,clean} from './util.mjs';
process.argv[2]='library';const {connect}=await import('./report.mjs');
const bundle='C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/node_modules/.audit-reparacion/fixture.mjs';
let source=readFileSync(bundle,'utf8');assert.equal(source.split('const transition = transitionProject(').length,2);
source=source.replace('const transition = transitionProject(',"const transition = ((...args) => ({success:false,ok:false,error:{razon:'AUDIT_FORCED_TRANSITION_REJECTION'}}))(");
const seam=bundle.replace('fixture.mjs','transition-rejected.mjs');writeFileSync(seam,source);
const {createMcpServer}=await import(pathToFileURL(seam));
const f=await fixture({gateway:{reviewClosure:async r=>makeDecision(r)}});
assert.equal((await f.closureService.execute('catalog',{action:'waive',reason:'Synthetic transition rejection fixture, independent mechanical check only'})).status,'waived');
const before=history(f),c=await connect(f,f.context.moduleBindings,createMcpServer);
try{const result=await c.call();assert.equal(result.status,'blocked');assert.equal(result.code,'session_transition_rejected');assert.equal(JSON.parse(readFileSync(f.lifecyclePath)).phase,'WORKING');assert.equal(existsSync(join(f.root,'.qa/project/sessions/session-r5.report.md')),false);assert.deepEqual(history(f),before);emit({scenario:'forced-transition-rejection',result:'PASS',response:result,physicalPhase:'WORKING',reportPublished:false,method:'test-only external bundle seam returns success:false; real FS/SQLite and unchanged production source'});}finally{await c.client.close();await c.server.close();clean(f);}
~~~

### fences.mjs

~~~javascript
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {readFileSync} from 'node:fs';
import {assert,fixture,makeDecision,emit,clean,sleep} from './util.mjs';
process.argv[2]='library';const {connect}=await import('./report.mjs');
const bundle=pathToFileURL('C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/node_modules/.audit-reparacion/fixture.mjs').href;
for(const variant of ['lifecycle','knowledge']){
 const f=await fixture({gateway:{reviewClosure:async r=>makeDecision(r)}});
 assert.equal((await f.closureService.execute('catalog',{action:'waive',reason:'Synthetic fence contention fixture for independent audit only'})).status,'waived');
 const rec=(await f.store.query('app-r5','relation')).items[0];
 const code=`import {FileSystemStorage,SqliteKnowledgeAdapter} from ${JSON.stringify(bundle)};
 const kind=process.argv[1],root=process.argv[2],path=process.argv[3],id=process.argv[4];
 const store=kind==='knowledge'?new SqliteKnowledgeAdapter(path):new FileSystemStorage({rootDir:root});
 console.log('READY');process.stdin.once('data',async()=>{try{if(kind==='knowledge'){const r=await store.get('app-r5','relation',id);await store.commit('app-r5',[{kind:'relation',expected_revision:r.revision,entity:r.entity,trace:{...r.trace,source:'fence-adversary'}}]);console.log('UNEXPECTED_COMMIT');}else{await store.updateLifecycleState(s=>{console.log('OBSERVED_PHASE:'+s.phase);return s;});console.log('LIFECYCLE_COMPLETED');}}catch(e){console.log('REJECTED:'+e.code);}finally{store.close?.();process.exit(0);}});`;
 const child=spawn(process.execPath,['--input-type=module','-e',code,variant,f.root,f.knowledgePath,rec.id],{stdio:['pipe','pipe','pipe']});
 let out='',err='',exited=false;child.stdout.on('data',d=>{out+=d;});child.stderr.on('data',d=>{err+=d;});const done=new Promise(resolve=>child.on('exit',code=>{exited=true;resolve(code);}));
 for(let i=0;i<200&&!out.includes('READY');i++)await sleep(10);assert.match(out,/READY/,err);
 const original=f.store.query.bind(f.store);let requirementReads=0,attempted=false;
 f.store.query=async(app,kind,opts)=>{if(kind==='requirement'&&++requirementReads===2){attempted=true;child.stdin.write('start\n');await sleep(variant==='knowledge'?1250:200);if(variant==='knowledge'){assert.match(out,/REJECTED:(CONFLICT|UNAVAILABLE)/,out);}else assert.equal(exited,false,out);}return original(app,kind,opts);};
 const c=await connect(f);try{const response=await c.call();assert.equal(response.status,'success',JSON.stringify(response));assert.ok(attempted);assert.equal(await done,0);assert.equal(JSON.parse(readFileSync(f.lifecyclePath)).phase,'WRAP_UP');if(variant==='lifecycle')assert.match(out,/OBSERVED_PHASE:WRAP_UP/);const receipt=await f.store.get('app-r5','relation',rec.id);assert.equal(receipt.revision,1);assert.equal(receipt.trace.source,'canonical_module_waiver_v1');emit({scenario:'final-fence-'+variant,result:'PASS',childOutput:out.trim(),physicalPhase:'WRAP_UP',receiptRevision:receipt.revision,noDeadlock:true});}finally{await c.client.close();await c.server.close();clean(f);if(!exited)child.kill();}
}
~~~

### fence-conflict.mjs

~~~javascript
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {assert,fixture,makeDecision,emit,clean,sleep,history} from './util.mjs';
process.argv[2]='library';const {connect}=await import('./report.mjs');
const bundle=pathToFileURL('C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/node_modules/.audit-reparacion/fixture.mjs').href;
const f=await fixture({gateway:{reviewClosure:async r=>makeDecision(r)}});
assert.equal((await f.closureService.execute('catalog',{action:'waive',reason:'Synthetic independent busy fence negative; no human consent asserted'})).status,'waived');
const before=history(f),snapshot=f.closureStore.read(f.context);
const code=`import {SqliteKnowledgeAdapter} from ${JSON.stringify(bundle)};const s=new SqliteKnowledgeAdapter(process.argv[1]);await s.withWriteFence('app-r5',async()=>{console.log('HELD');await new Promise(resolve=>process.stdin.once('data',resolve));});s.close();process.exit(0);`;
const child=spawn(process.execPath,['--input-type=module','-e',code,f.knowledgePath],{stdio:['pipe','pipe','pipe']});let out='',err='';child.stdout.on('data',d=>{out+=d;});child.stderr.on('data',d=>{err+=d;});const done=new Promise(resolve=>child.on('exit',resolve));
for(let i=0;i<300&&!out.includes('HELD');i++)await sleep(10);assert.match(out,/HELD/,err);
const c=await connect(f);try{const response=await c.call();assert.notEqual(response.status,'success');assert.equal(JSON.parse(readFileSync(f.lifecyclePath)).phase,'WORKING');assert.equal(existsSync(join(f.root,'.qa/project/sessions/session-r5.report.md')),false);assert.deepEqual(history(f),before);assert.deepEqual(f.closureStore.read(f.context),snapshot);
emit({scenario:'external-official-knowledge-fence-conflict',integrity:'PASS',specificBlockedContract:response.status==='blocked'&&!!response.code?'PASS':'FAIL',response,physicalPhase:'WORKING',reportPublished:false,historyUnchanged:true});
child.stdin.write('release\n');assert.equal(await done,0);const retry=await c.call();assert.equal(retry.status,'success');assert.deepEqual(history(f),before);assert.deepEqual(f.closureStore.read(f.context),snapshot);emit({scenario:'external-fence-conflict-retry',result:'PASS',phase:retry.fase,approvals:1,receipts:(await f.store.query('app-r5','relation')).items.length});
}finally{child.kill();await c.client.close();await c.server.close();clean(f);}
~~~

### wrapper.mjs

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

### observe-fs.mjs

~~~javascript
import fs from 'node:fs';
import {syncBuiltinESMExports} from 'node:module';
const append=fs.appendFileSync.bind(fs),stat=fs.statSync.bind(fs);
const record=x=>{try{append(process.env.AUDIT_FS_EVENTS,JSON.stringify({utc:new Date().toISOString(),pid:process.pid,...x})+'\n');}catch{}};
const metadata=p=>{try{const s=stat(p);return {exists:true,file:s.isFile(),directory:s.isDirectory(),size:s.size,nlink:s.nlink};}catch(e){return {exists:false,code:e.code};}};
const rename=fs.renameSync.bind(fs);
fs.renameSync=(a,b)=>{try{return rename(a,b);}catch(e){record({operation:'renameSync',source:String(a),target:String(b),code:e.code,sourceState:metadata(a),targetState:metadata(b),stack:e.stack});throw e;}};
const remove=fs.rmSync.bind(fs);
fs.rmSync=(p,o)=>{if(o?.recursive&&String(p).includes('qap-'))record({operation:'recursiveCleanup',path:String(p),state:metadata(p),stack:new Error().stack});return remove(p,o);};
process.on('uncaughtExceptionMonitor',e=>record({operation:'uncaughtExceptionMonitor',code:e.code,message:e.message,stack:e.stack}));
syncBuiltinESMExports();
~~~

### checks.ps1

~~~powershell
$ErrorActionPreference='Continue'
function Run-Audit($name,$command) {
  $started=(Get-Date).ToUniversalTime().ToString('o')
  & ([scriptblock]::Create($command)) *> "../reparacion-evidence/$name.log"
  $code=$LASTEXITCODE
  [pscustomobject]@{name=$name;command=$command;exit=$code;startedUtc=$started;finishedUtc=(Get-Date).ToUniversalTime().ToString('o')} | ConvertTo-Json -Compress | Add-Content ../reparacion-evidence/commands.jsonl
  Write-Output "$name exit=$code"
}
Run-Audit 'mcp-serial' 'pnpm --filter @qap/mcp exec vitest run --maxWorkers=1 --reporter=json --outputFile=../../node_modules/vnext014-audit-mcp-serial.json'
Run-Audit 'mcp-parallel' 'pnpm --filter @qap/mcp test'
Run-Audit 'runner' 'pnpm --filter @qap/playwright-runner test'
Run-Audit 'engine' 'pnpm --filter @qap/engine exec vitest run --maxWorkers=1'
Run-Audit 'knowledge' 'pnpm --filter @qap/knowledge exec vitest run --maxWorkers=1'
Run-Audit 'cli' 'pnpm --filter @qap/cli test'
Run-Audit 'stdio' 'node scripts/test-mcp-stdio.mjs'
Run-Audit 'lint' 'pnpm lint'
Run-Audit 'lint-focal' 'pnpm exec eslint packages/knowledge/src/storage/file-storage.ts packages/mcp/src/handlers/canonical-closure-service.ts packages/mcp/src/handlers/canonical-session-report.ts packages/mcp/src/handlers/module-closure-store.ts packages/mcp/src/host-composition.ts packages/mcp/src/server.ts packages/mcp/src/__tests__/canonical-coverage.test.ts packages/mcp/src/__tests__/host-composition.test.ts'
Run-Audit 'lint-json' 'pnpm exec eslint . --format json --output-file ../reparacion-evidence/lint.json'
~~~

### compare.mjs

~~~javascript
import {readFileSync,writeFileSync} from 'node:fs';
const root='C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit';
const dir='C:/Users/Judirico/Documents/QAMCP/reparacion-evidence';
const baseline=JSON.parse(readFileSync('../rescate-evidence/mcp.json','utf8'));
const current=JSON.parse(readFileSync(root+'/node_modules/vnext014-audit-mcp-serial.json','utf8'));
const entries=j=>j.testResults.flatMap(f=>f.assertionResults.map(t=>({file:f.name.replaceAll('\\','/').split('/packages/mcp/').at(-1),fullName:t.fullName,status:t.status,errors:t.failureMessages})));
function occurrences(list){const count=new Map();return list.map(t=>{const k=t.file+'\0'+t.fullName;const occurrence=(count.get(k)??0)+1;count.set(k,occurrence);return {...t,occurrence};});}
const key=t=>t.file+'\0'+t.fullName+'\0'+t.occurrence;
const old=new Map(occurrences(entries(baseline)).map(t=>[key(t),t])),now=new Map(occurrences(entries(current)).map(t=>[key(t),t]));
const identities=[...new Set([...old.keys(),...now.keys()])].sort().map(k=>({file:(now.get(k)??old.get(k)).file,fullName:(now.get(k)??old.get(k)).fullName,occurrence:(now.get(k)??old.get(k)).occurrence,before:old.get(k)?.status??'absent',after:now.get(k)?.status??'absent',errors:now.get(k)?.errors??[]}));
const counts={};for(const t of identities){const label=t.before+' -> '+t.after;counts[label]=(counts[label]??0)+1;}
writeFileSync(dir+'/mcp-comparison.json',JSON.stringify({baselineSHA:'e71818ac6fdaa1847e300a67bd4540fbfbd514c5',currentSHA:'8f091626825ceb2fa3f1abdfb0732f0f3dad8e9c',counts,identities},null,2));
const lintEntries=(file,marker)=>JSON.parse(readFileSync(file,'utf8')).flatMap(f=>f.messages.map(m=>({file:f.filePath.replaceAll('\\','/').split(marker).at(-1),line:m.line,column:m.column,rule:m.ruleId,severity:m.severity,message:m.message})));
const lold=lintEntries('../rescate-evidence/lint.json','/audit-r4-r10/'),lnew=lintEntries(dir+'/lint.json','/vnext014-reparacion-audit/');
const lkey=t=>JSON.stringify([t.file,t.rule,t.severity,t.message]);
const buckets=a=>{const m=new Map();for(const t of a){const k=lkey(t);if(!m.has(k))m.set(k,[]);m.get(k).push(t);}return m;};
const a=buckets(lold),b=buckets(lnew);let kept=0,added=[],removed=[];
for(const k of new Set([...a.keys(),...b.keys()])){const x=a.get(k)??[],y=b.get(k)??[];kept+=Math.min(x.length,y.length);added.push(...y.slice(x.length));removed.push(...x.slice(y.length));}
const lint={before:{error:lold.filter(t=>t.severity===2).length,warning:lold.filter(t=>t.severity===1).length},after:{error:lnew.filter(t=>t.severity===2).length,warning:lnew.filter(t=>t.severity===1).length},kept,added,removed};
writeFileSync(dir+'/lint-comparison.json',JSON.stringify(lint,null,2));console.log(JSON.stringify({counts,lint},null,2));
~~~
