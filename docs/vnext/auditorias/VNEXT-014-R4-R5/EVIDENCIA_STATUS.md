# Evidencia de status y cierre R4-R5

Se ejecutaron los tres escenarios de Vitest R4-R5-A02 con SQLite físico y servidor MCP. Los tres pasaron en ejecución focal, Coverage y MCP integral. Una sonda SDK adicional reconstruyó independientemente los mismos casos con raíces desechables autorizadas y claves aleatorias solo del fixture.

| Escenario | Inventario visible | Guidance | Cierre | Reporte físico | Nuevas consultas al gateway | Snapshot de cierre |
| --- | ---: | --- | --- | --- | ---: | --- |
| 16 waivers válidos | 16 | qap_session_close | success / WRAP_UP | existe | 0 | intacto |
| 17 waivers válidos | 16 | qap_session_close | success / WRAP_UP | existe | 0 | intacto |
| 17, último sin aprobación | 16 | qap_module_close, module-17 pendiente | blocked / canonical_module_closure_required, WORKING | ausente | 0 | intacto |

En el negativo, los primeros 16 módulos visibles estaban waived, pero el último vínculo no visible se validó y permaneció pendiente. Ningún cierre ni consulta de status añadió aprobaciones al snapshot. Los positivos utilizaron registros ya aprobados del fixture. El recibo de un waiver válido puede recuperarse durante la consulta, lo que no equivale a crear otra aprobación.

La causa de R4-R4-A02 quedó corregida. El bucle de StatusHandler consulta el cierre de todos los vínculos únicos y limita únicamente bridge.project y el inventario a las primeras 16 entradas. El guard de sesión y el de guidance concuerdan en los tres casos medidos.

Coverage 37/37 también conserva R4-R3 (siete registros inconsistentes), R4-R4-A01 (waiver autorizado), Crash Scenarios 2 y 3, y R4-R2-A01 (primer cierre con metadatos recuperados y reporte). DiscoveryHandler 59/59 incluye aislamiento y el recorrido de renuncia aprobado. Estos positivos no certifican closed mediante cobertura auténtica ni la replanificación completa descrita en la clasificación histórica.

Stdio devolvió las 18 herramientas del catálogo. La llamada real qap_init sobre un fixture autorizado produjo success, ONBOARDING y la estructura .qa física, y la consulta posterior confirmó el estado. El proceso salió 0.

## Sonda reproducible

Guardar el siguiente bloque como status-boundary.mjs fuera del repositorio compilado. Con Node 24, ejecutar node --experimental-transform-types <ARTEFACTOS>/status-boundary.mjs <WORKTREE> <ARTEFACTOS> 16, luego 17 y 17-invalid. Cada ejecución crea un fixture nuevo y asienta exclusivamente datos sintéticos mediante la API interna. Los tres procesos medidos terminaron con salida 0.

~~~js
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const [repo, output, mode] = process.argv.slice(2);
const root = mkdtempSync(join(output, 'recovery-fixture-'));
const req = createRequire(join(repo,'packages','mcp','package.json'));
const load = async id => import(pathToFileURL(req.resolve(id)));
const { Client } = await load('@modelcontextprotocol/sdk/client/index.js');
const { InMemoryTransport } = await load('@modelcontextprotocol/sdk/inMemory.js');
const { SqliteKnowledgeAdapter } = await load('@qap/knowledge');
const { createMcpServer } = await load(join(repo,'packages/mcp/dist/index.js'));
const { SqliteModuleClosureStore } = await load(join(repo,'packages/mcp/src/handlers/module-closure-store.ts'));
const now = new Date().toISOString();
const scope = {projectRoot:root,applicationId:'app-audit',environmentId:'local'};
const names = Array.from({length:Number(mode.split('-')[0])},(_,i)=>'module-'+String(i+1));
const moduleBindings = names.map(name=>({plannedName:name,moduleId:'mod-'+name,moduleKey:name,
  moduleRevision:1,applicationRevision:1,environmentRevision:1,provenance:'host_declared'}));
const lifecyclePath = join(root,'.qa','project','lifecycle.json');
mkdirSync(join(root,'.qa','project'),{recursive:true});
const reason = '  Renuncia sintética autorizada para reproducir una interrupción  ';
const initial = {_version:'1',phase:'WORKING',modules:Object.fromEntries(names.map(name=>[name,{state:'waived',updated_at:now,waived_reason:reason}])),
  session:{id:'audit-crash',started_at:now,plan:names.map(name=>({module:name,path:'/'+name})),auth:{required:false}},
  history:[]};
writeFileSync(lifecyclePath, JSON.stringify(initial));
const store = new SqliteKnowledgeAdapter(join(root,'knowledge.sqlite'));
const moduleClosureStore = new SqliteModuleClosureStore({...scope, path:join(root,'closure.sqlite'),
  key:randomBytes(32),protection:'host_private_directory_and_managed_key',initialize:true});
const decisionId = randomUUID();
const requestDigest = 'a'.repeat(64);

const trace = {source:'synthetic',recorded_by:'fixture',recorded_at:now,reason:'Synthetic only',review:'unreviewed',evidence_refs:[]};
await store.commit(scope.applicationId, [
 {kind:'application',expected_revision:0,trace,entity:{application_id:scope.applicationId,name:'Synthetic',base_url:'http://127.0.0.1',created_at:now}},
 {kind:'environment',expected_revision:0,trace,entity:{application_id:scope.applicationId,environment_id:'local',name:'local',base_url:'http://127.0.0.1',safe_domains:['127.0.0.1'],is_production:false,destructive_actions_allowed:false}},
 ...names.map(name=>({kind:'module',expected_revision:0,trace,entity:{id:'mod-'+name,application_id:scope.applicationId,key:name,title:name,certainty:'confirmed',criticality:'medium',dependencies:[],created_at:now,updated_at:now,is_active:true}})),
]);
await moduleClosureStore.transaction(scope, async snapshot => {
 for (const name of names) {
   const id=randomUUID();
   snapshot.closures[name] = {moduleKey:name,moduleId:'mod-'+name,moduleRevision:1,
     plannedName:name,status:'waived',decisionId:id,reviewer:'synthetic-reviewer',decidedAt:now,
     requestDigest,coverageDigest:'b'.repeat(64),waiverReason:reason,committedAt:now};
   if (!(mode.endsWith('-invalid') && name===names[names.length-1])) snapshot.approvals.push([id,requestDigest]);
 }
});
let gatewayCalls=0;
const server=createMcpServer({projectRoots:[root],knowledgeBindings:[{...scope,moduleBindings,store,moduleClosureStore,
  moduleClosureReviewGateway:{reviewClosure:async()=>{gatewayCalls++;return null;}}}]});
const client=new Client({name:'recovery-audit',version:'1.0.0'});
const [ct,st]=InMemoryTransport.createLinkedPair();
try {
 await server.connect(st); await client.connect(ct);
 const call = async name => JSON.parse((await client.callTool({name,arguments:{targetPath:root}})).content[0].text);
 const durableBefore=moduleClosureStore.read(scope);
 const status = await call('qap_status');
 const close = await call('qap_session_close');
 console.log(JSON.stringify({count:names.length, inventory:status.canonical_modules.map(m=>[m.plannedName,m.closure.state]),
   next:status.siguiente_accion?.tool, pending:status.canonical_pending_closure_modules, close:close.status,
   phase:close.fase, code:close.code, report:existsSync(join(root,'.qa','project','sessions','audit-crash.report.md')),gatewayCalls},null,2));
 assert.equal(status.canonical_modules.length,Math.min(names.length,16));
 assert.ok(status.canonical_modules.every(m=>m.closure.state==='waived'));
 assert.deepEqual(moduleClosureStore.read(scope),durableBefore);
 if(mode.endsWith('-invalid')){
  assert.equal(status.siguiente_accion?.tool,'qap_module_close');
  assert.deepEqual(status.canonical_pending_closure_modules,[names[names.length-1]]);
  assert.equal(close.status,'blocked');
  assert.equal(close.code,'canonical_module_closure_required');
  assert.equal(close.fase,'WORKING');
  assert.equal(existsSync(join(root,'.qa','project','sessions','audit-crash.report.md')),false);
  assert.equal(gatewayCalls,0);
 }else{
 assert.equal(close.status,'success');
 assert.equal(close.fase,'WRAP_UP');
 assert.equal(gatewayCalls,0);
 assert.equal(status.siguiente_accion?.tool,'qap_session_close'); } } finally { await client.close(); await server.close(); moduleClosureStore.close(); store.close(); }
~~~
