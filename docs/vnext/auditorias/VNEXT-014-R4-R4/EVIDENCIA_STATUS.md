# Evidencia de qap_status y cierre canónico

## Casos focales

| Fixture adversarial R4-R3 | Resultado R4-R4 |
| --- | --- |
| Waiver con motivo de un carácter | PASS, bloqueo por motivo inválido |
| Waiver con motivo en blanco | PASS, bloqueo por motivo inválido |
| Waiver sin aprobación | PASS, bloqueo por asiento ausente |
| Waiver con digest distinto | PASS, bloqueo por falta de correlación |
| Waiver con aprobación duplicada | PASS, bloqueo por falta de unicidad |
| Cierre closed sin aprobación | PASS, bloqueo por asiento ausente |
| Lifecycle ya waived, sin aprobación | PASS, el terminal legacy no habilita el cierre |

Los siete fixtures físicos pasaron las aserciones de `reconcile=false`, estado canónico `working / ready_for_closure:false`, `execute=blocked / invalid_durable_closure` y cierre de sesión `blocked / canonical_module_closure_required` en WORKING. `qap_status` omitió la recomendación de cerrar en todos. Los registros, relaciones y lifecycle quedaron intactos, sin reporte ni consulta adicional al gateway.

El caso terminal mantuvo `estados_modulos.catalog=waived` y devolvió `canonical_pending_closure_modules=['catalog']` con `siguiente_accion.tool=qap_module_close`. El caso positivo R4-R4-A01 confirmó un waiver con un gateway sintético del fixture. `qap_status` devolvió cierre canónico `waived`, recomendó `qap_session_close` y omitió el campo de pendientes.

En Coverage también pasaron Crash Scenarios 2 y 3 y R4-R2-A01 (primer cierre a WRAP_UP con reporte físico y waiver recuperado). Discovery aprobó el recorrido de cierre y el aislamiento de stores físicos. Los fixtures usan datos sintéticos y raíces autorizadas.

## R4-R4-A02 · P2 · Falso pendiente a partir del módulo 17

Sonda física con servidor MCP y cliente SDK, SQLite desechable y lifecycle en WORKING. Cada módulo del plan tiene un vínculo del host, estado legacy `waived`, motivo sustantivo y registro durable con un asiento de aprobación correlacionado. Se llama primero a `qap_status`, luego a `qap_session_close` sobre el mismo targetPath autorizado.

| Módulos con waiver válido | Inventario devuelto | Siguiente acción | Pendientes | Cierre real | Reporte | Gateway | Salida |
| ---: | ---: | --- | --- | --- | --- | ---: | ---: |
| 16 | 16 | qap_session_close | campo ausente | success / WRAP_UP | existe | 0 | 0 |
| 17 | 16 | qap_module_close | module-17 | success / WRAP_UP | existe | 0 | 1 |

La primera aserción fallida con 17 módulos es la comparación de la acción recomendada, `actual=qap_module_close`, `expected=qap_session_close`. La comprobación del cierre real se ejecutó y pasó antes de esa aserción.

La primera causa está en `packages/mcp/src/handlers/status.handler.ts:32-39`. El conjunto de pendientes se inicia con **todos** los vínculos, pero la validación de cierres solo recorre `boundNames.slice(0, 16)`. Así, el límite de presentación también impide acreditar cierres válidos del módulo 17 en adelante. La compuerta real sí recorre todos los vínculos en `canonical-closure-service.ts:290-303`. El efecto se limita al guidance observado. El arreglo puede conservar un inventario de hasta 16 y evaluar la recomendación sobre todos los vínculos. La regresión de borde debe comprobar tanto 17 cierres válidos como un módulo 17 inválido.

### Sonda reproducible

Guardar el siguiente bloque como `status-limit.mjs` fuera del repositorio. Con el SHA auditado compilado y Node 24, ejecutar `node --experimental-transform-types <ARTEFACTOS>/status-limit.mjs <WORKTREE> <ARTEFACTOS> 16` y repetir con 17. La sonda escribe exclusivamente en una raíz temporal nueva. Los asientos se siembran dentro del fixture mediante la API interna del store.

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
const names = Array.from({length:Number(mode)},(_,i)=>'module-'+String(i+1));
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
   snapshot.approvals.push([id,requestDigest]);
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
 const status = await call('qap_status');
 const close = await call('qap_session_close');
 console.log(JSON.stringify({count:names.length, inventory:status.canonical_modules.map(m=>[m.plannedName,m.closure.state]),
   next:status.siguiente_accion?.tool, pending:status.canonical_pending_closure_modules, close:close.status,
   phase:close.fase, code:close.code, report:existsSync(join(root,'.qa','project','sessions','audit-crash.report.md')),gatewayCalls},null,2));
 assert.equal(status.canonical_modules.length,Math.min(names.length,16));
 assert.ok(status.canonical_modules.every(m=>m.closure.state==='waived'));
 assert.equal(close.status,'success');
 assert.equal(close.fase,'WRAP_UP');
 assert.equal(gatewayCalls,0);
 assert.equal(status.siguiente_accion?.tool,'qap_session_close');} finally { await client.close(); await server.close(); moduleClosureStore.close(); store.close(); }
~~~
