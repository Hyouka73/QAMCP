# Evidencia física de integración R4-R7

Código `ea75eb2c52266b174e6d24917c1b089d56834900`. `R4-R7-I01` en `packages/mcp/src/__tests__/canonical-interview.test.ts:176` pasa en tres ejecuciones: foco 1/1 (43 no seleccionadas), archivo 44/44 e integral 407/462. La sonda adicional usa código compilado del mismo SHA, SDK MCP, SQLite físico y una raíz sintética externa. Para acceder a `SqliteModuleClosureStore`, no exportado en index, esbuild compila su fuente intacta y dependencias en un bundle externo; no se parchea el repositorio.

| Garantía solicitada | Evidencia ejecutada |
| --- | --- |
| 1. Propuesta sin aprobación | review devuelve human_review_not_authorized; cero requisitos. La sonda comprueba además cero recibos tras rechazar la decisión obsoleta. |
| 2. Corrección/versiones | v0→v1 propuesta→v2 corrección; requestDigest distinto. La sonda comprueba también statementDigest distinto. |
| 3. Aprobación anterior inválida | El test deja la decisión antigua en un inbox indexado por digest; la sonda fuerza su devolución para v2 y observa human_review_invalid. Sin writes confirmados. |
| 4. Host independiente | Solo la decisión externa sobre requestDigest y statementDigest exactos confirma. No se manda autorización por argumentos MCP. |
| 5. Persistencia | ExpectedRequirement revision 1: descripción exacta corregida, functional, dos criterios, developer_interview, verified_by y verification_evidence human_review con digest; validación Shared PASS. |
| 6. Recibo/retry | Un human_review_authorization_v1, target requisito/revisión exactos y reason=requestDigest. Historia de requisito 1; retry idempotente, sin otra llamada al gateway en sonda. |
| 7. Segunda conexión | El test compara entidad exacta y la sonda compara el registro completo, incluyendo trace y referencias. PRAGMA integrity_check=ok. |
| 8. Cobertura/bloqueo | Confirmados 0→1, brechas 7→6, functional unknown→applicable/satisfied; las otras seis categorías siguen unknown. Cambia coverage_digest. La sonda intenta close y recibe closure_preconditions_not_met antes de consultar el gateway de cierre. |
| 9. Ejecución honesta | not_executed; executed/passed/failed/indeterminate=0. No se confunde el PASS del arnés con ejecución funcional del catálogo. |
| 10. Sin efectos indebidos | Lifecycle idéntico byte a byte; rules.yaml ausente; ningún cierre ni aplicabilidad aprobados. Recibo humano solo tras decisión independiente sintética. |

El fixture R4-R7 asocia observaciones sintéticas autorizadas, no ejecuta Discovery/Chromium dentro de ese caso. Discovery completo sí se ejecutó por separado, 59/59 aislado y 59/59 dentro del integral. No hay certificación de UI humana productiva, persistencia de borradores entre reinicios en este caso ni cierre closed. Las aprobaciones sintéticas del arnés comprueban el contrato; no son aprobaciones de negocio o producción.

## Salida de la sonda

```json
[
  {
    "result": "PASS",
    "staleDecision": "human_review_invalid",
    "statementDigestChanged": true,
    "requestDigestChanged": true,
    "requirements": 1,
    "receipts": 1,
    "history": 1,
    "retryGatewayCalls": 0,
    "secondConnectionExactRecord": true,
    "coverageBefore": {
      "status": "incomplete",
      "applicable_categories_count": 0,
      "satisfied_categories_count": 0,
      "confirmed_requirements_count": 0,
      "pending_requirements_count": 0,
      "total_gaps_count": 7,
      "unaddressed_gaps_count": 7,
      "accepted_gaps_count": 0,
      "category_statuses": [
        {
          "category": "functional",
          "applicability": "unknown",
          "confirmed_count": 0,
          "pending_count": 0,
          "gap_ids": [
            "gap:catalog-key:functional:unknown_applicability"
          ],
          "status": "unknown"
        },
        {
          "category": "business_rule",
          "applicability": "unknown",
          "confirmed_count": 0,
          "pending_count": 0,
          "gap_ids": [
            "gap:catalog-key:business_rule:unknown_applicability"
          ],
          "status": "unknown"
        },
        {
          "category": "security",
          "applicability": "unknown",
          "confirmed_count": 0,
          "pending_count": 0,
          "gap_ids": [
            "gap:catalog-key:security:unknown_applicability"
          ],
          "status": "unknown"
        },
        {
          "category": "ui",
          "applicability": "unknown",
          "confirmed_count": 0,
          "pending_count": 0,
          "gap_ids": [
            "gap:catalog-key:ui:unknown_applicability"
          ],
          "status": "unknown"
        },
        {
          "category": "ux",
          "applicability": "unknown",
          "confirmed_count": 0,
          "pending_count": 0,
          "gap_ids": [
            "gap:catalog-key:ux:unknown_applicability"
          ],
          "status": "unknown"
        },
        {
          "category": "regression",
          "applicability": "unknown",
          "confirmed_count": 0,
          "pending_count": 0,
          "gap_ids": [
            "gap:catalog-key:regression:unknown_applicability"
          ],
          "status": "unknown"
        },
        {
          "category": "performance",
          "applicability": "unknown",
          "confirmed_count": 0,
          "pending_count": 0,
          "gap_ids": [
            "gap:catalog-key:performance:unknown_applicability"
          ],
          "status": "unknown"
        }
      ]
    },
    "coverageAfter": {
      "status": "incomplete",
      "applicable_categories_count": 1,
      "satisfied_categories_count": 1,
      "confirmed_requirements_count": 1,
      "pending_requirements_count": 0,
      "total_gaps_count": 6,
      "unaddressed_gaps_count": 6,
      "accepted_gaps_count": 0,
      "category_statuses": [
        {
          "category": "functional",
          "applicability": "applicable",
          "confirmed_count": 1,
          "pending_count": 0,
          "gap_ids": [],
          "status": "satisfied"
        },
        {
          "category": "business_rule",
          "applicability": "unknown",
          "confirmed_count": 0,
          "pending_count": 0,
          "gap_ids": [
            "gap:catalog-key:business_rule:unknown_applicability"
          ],
          "status": "unknown"
        },
        {
          "category": "security",
          "applicability": "unknown",
          "confirmed_count": 0,
          "pending_count": 0,
          "gap_ids": [
            "gap:catalog-key:security:unknown_applicability"
          ],
          "status": "unknown"
        },
        {
          "category": "ui",
          "applicability": "unknown",
          "confirmed_count": 0,
          "pending_count": 0,
          "gap_ids": [
            "gap:catalog-key:ui:unknown_applicability"
          ],
          "status": "unknown"
        },
        {
          "category": "ux",
          "applicability": "unknown",
          "confirmed_count": 0,
          "pending_count": 0,
          "gap_ids": [
            "gap:catalog-key:ux:unknown_applicability"
          ],
          "status": "unknown"
        },
        {
          "category": "regression",
          "applicability": "unknown",
          "confirmed_count": 0,
          "pending_count": 0,
          "gap_ids": [
            "gap:catalog-key:regression:unknown_applicability"
          ],
          "status": "unknown"
        },
        {
          "category": "performance",
          "applicability": "unknown",
          "confirmed_count": 0,
          "pending_count": 0,
          "gap_ids": [
            "gap:catalog-key:performance:unknown_applicability"
          ],
          "status": "unknown"
        }
      ]
    },
    "execution": {
      "status": "not_executed",
      "executed_count": 0,
      "passed_count": 0,
      "failed_count": 0,
      "indeterminate_count": 0,
      "note": "La cobertura de ejecución requiere ejecución con test runner (VNEXT-014). Cero certificación de ejecución en R5."
    },
    "verdict": "blocked_by_unknown_applicability",
    "lifecycleUnchanged": true,
    "rulesYaml": false,
    "sqliteIntegrity": "ok",
    "lifecycleSha256": "07eb018605f5e9954fe5f73fd63f6351f00fd77429c544c66851846d12f77043"
  },
  {
    "nextP0ApplicabilityProbe": {
      "first": "closure_review_pending",
      "second": "closure_review_pending",
      "sameCommand": true,
      "coverageDigestStable": false,
      "requestDigestStable": false,
      "oldDecisionRetry": "closure_review_invalid",
      "approvals": 0,
      "decisions": 0
    },
    "closeUnknown": {
      "code": "closure_preconditions_not_met",
      "gatewayRequests": 0
    }
  }
]
```

## Hallazgo 014-R4-R7-A01 — P1, reintento de aplicabilidad inestable

Reproducción física sobre el mismo catálogo confirmado: llamar dos veces a `qap_module_close` con `canonical_closure.action=declare_non_applicable` y una única decisión performance con motivo sustantivo. El gateway devuelve null, ambas respuestas closure_review_pending. No cambia conocimiento, lifecycle o decisiones almacenadas, pero **coverageDigest y requestDigest son distintos**. Al devolver en una tercera llamada una decisión aún vigente para la primera solicitud, responde **closure_review_invalid**, con cero approvals y cero decisiones persistidas.

Causa localizada: `canonical-closure-service.ts:394` construye decisiones con `decided_at = new Date().toISOString()` en cada llamada (:400). `canonical-coverage-service.ts:374` incluye las entradas completas de applicabilityMap en coverage_digest; el digest de la petición incorpora ese resultado (:429 del servicio de cierre). No debe excluirse la decisión semántica de autoridad; el problema es volver a generar el instante de una solicitud pendiente que debería poder recuperarse. Las fuentes implicadas son idénticas al baseline R4-R6: **defecto preexistente identificado ahora**, no regresión del test R4-R7.

Impacto: un inbox desacoplado que primero devuelve pendiente y después aprueba por digest no puede reanudar esa declaración sin recibir una nueva solicitud. Un gateway que mantiene abierta la misma llamada hasta recibir al humano puede operar; no se afirma que toda declaración falle. No se observó autorización indebida: falla cerrado. Corregir con identidad/snapshot estable de solicitud y probar aprobación pendiente/retry, texto/contexto cambiados y expiración, reutilizando servicio y store existentes. No parchear tests ni aprobar automáticamente para evitar el bloqueo.

## Sonda reproducible externa

Guardar el siguiente script fuera del repositorio y ejecutar `node <ARTEFACTOS>/probe.mjs <WORKTREE> <ARTEFACTOS>` con Node 24 tras build/install. Solo usa fixtures sintéticos. Conserva las bases para inspección local, no las publica.

```javascript
import assert from 'node:assert/strict';
import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
const [repo,out]=process.argv.slice(2), req=createRequire(join(repo,'packages/mcp/package.json'));
const load=async p=>import(pathToFileURL(req.resolve(p)));
const tsupReq=createRequire(createRequire(join(repo,'package.json')).resolve('tsup/package.json'));
const {build}=await import(pathToFileURL(tsupReq.resolve('esbuild')));
await build({stdin:{contents:`export {SqliteModuleClosureStore} from './handlers/module-closure-store.ts';`,resolveDir:join(repo,'packages/mcp/src'),loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:join(out,'closure-bundle.mjs')});
const {SqliteModuleClosureStore}=await import(pathToFileURL(join(out,'closure-bundle.mjs')));
const {createMcpServer,ModuleObservationBridge}=await load(join(repo,'packages/mcp/dist/index.js'));
const {SqliteKnowledgeAdapter}=await load('@qap/knowledge');
const {Client}=await load('@modelcontextprotocol/sdk/client/index.js');
const {InMemoryTransport}=await load('@modelcontextprotocol/sdk/inMemory.js');
const root=mkdtempSync(join(out,'probe-fixture-')), dbpath=join(root,'knowledge.sqlite');
const trace={source:'synthetic',recorded_by:'independent_auditor',recorded_at:new Date().toISOString(),reason:'Authorized independent synthetic audit',review:'unreviewed',evidence_refs:[]};
const store=new SqliteKnowledgeAdapter(dbpath), time=trace.recorded_at;
await store.commit('a',[
 {kind:'application',expected_revision:0,trace,entity:{application_id:'a',name:'Audit',base_url:'https://example.invalid',created_at:time}},
 {kind:'environment',expected_revision:0,trace,entity:{application_id:'a',environment_id:'local',name:'local',base_url:'https://example.invalid',safe_domains:['example.invalid'],is_production:false,destructive_actions_allowed:false}},
 {kind:'module',expected_revision:0,trace,entity:{id:'m',application_id:'a',key:'catalog-key',title:'Audit catalog',certainty:'pending_review',criticality:'medium',dependencies:[],created_at:time,updated_at:time,is_active:true}}
]);
const context={projectRoot:root,applicationId:'a',environmentId:'local',moduleBindings:[{plannedName:'catalog',moduleId:'m',moduleKey:'catalog-key',moduleRevision:1,applicationRevision:1,environmentRevision:1,provenance:'host_declared'}]};
mkdirSync(join(root,'.qa/project'),{recursive:true});
const lifecyclePath=join(root,'.qa/project/lifecycle.json');
writeFileSync(lifecyclePath,JSON.stringify({_version:'1',phase:'WORKING',modules:{catalog:{state:'planned',updated_at:time}},session:{id:'audit',started_at:time,plan:[{module:'catalog',path:'/'}],auth:{required:false}},history:[]}));
const execution=randomUUID(),evidenceId=randomUUID(),viewId=randomUUID(),route=`urn:qap:route:${'b'.repeat(64)}`;
const evidence={id:evidenceId,kind:'dom_snippet',uri:`urn:qap:fixture:${evidenceId}`,pii_masked:true,captured_at:time,session_id:execution,metadata:{source:'static_dom_structure',view:{id:viewId,route,state:'settled',controls:[],forms:[],links:[]}}};
const observations=['navigation_route','dom_element'].map(kind=>({id:randomUUID(),application_id:'a',environment_id:'local',kind,observed_by:'crawler',observed_at:time,session_id:execution,evidence,raw_payload:kind==='navigation_route'?{route,view_id:viewId,state:'settled'}:{view_id:viewId,controls:[],forms:[]}}));
await store.commit('a',[{kind:'evidence',expected_revision:0,trace,entity:evidence},...observations.map(entity=>({kind:'observation',expected_revision:0,trace:{...trace,source:'blackbox_crawler',environment_id:'local',evidence_refs:[{kind:'evidence',id:evidenceId,revision:1}]},entity}))]);
const bridge=new ModuleObservationBridge(store,context);await bridge.associate('catalog',await bridge.receipt('catalog',execution,observations.map(o=>o.id)));
const closureStore=new SqliteModuleClosureStore({...context,path:join(root,'closure.sqlite'),key:randomBytes(32),protection:'host_private_directory_and_managed_key',initialize:true});
let decision=null,closureDecision=null;const requests=[],closureRequests=[];
const gateway={review:async r=>{requests.push(structuredClone(r));return decision;}};
const server=createMcpServer({projectRoots:[root],knowledgeBindings:[{...context,store,humanReviewGateway:gateway,moduleClosureStore:closureStore,moduleClosureReviewGateway:{reviewClosure:async r=>{closureRequests.push(structuredClone(r));return closureDecision;}}}]});
const client=new Client({name:'independent-r4-r7-probe',version:'1'}),[ct,st]=InMemoryTransport.createLinkedPair();
let reopened;
try{
 await server.connect(st);await client.connect(ct);
 const call=async(name,args={})=>{const r=await client.callTool({name,arguments:{targetPath:root,...args}});return JSON.parse(r.content[0].text);};
 const command=async c=>call('qap_rules_set',{module:'catalog',canonical_interview:c});
 const evaluate=()=>call('qap_module_close',{module:'catalog',canonical_closure:{action:'evaluate'}});
 const lifecycle=readFileSync(lifecyclePath,'utf8'),before=await evaluate();
 const q=(await command({action:'next'})).question;
 const proposal={title:'Consultar catálogo de productos',description:'Los usuarios autorizados pueden consultar todos los productos disponibles.',category:'functional'};
 assert.equal((await command({action:'propose',question_id:q.id,version:0,expected_revision:0,proposal})).status,'pending_review');
 assert.equal((await command({action:'review',question_id:q.id,version:1})).code,'human_review_not_authorized');
 const old=requests.at(-1);
 const makeDecision=r=>({requestDigest:r.requestDigest,presentedStatementDigest:r.statementDigest,approvalId:randomUUID(),decision:'confirm',reviewer:'independent-synthetic-owner',decidedAt:new Date(Date.now()-1000).toISOString(),expiresAt:new Date(Date.now()+60000).toISOString()});
 decision=makeDecision(old);
 const corrected={...proposal,description:'Los usuarios autorizados consultan productos sin divulgar los datos sensibles.',acceptance_criteria:['La lista muestra únicamente productos disponibles.','La respuesta excluye datos sensibles.']};
 assert.equal((await command({action:'correct',question_id:q.id,version:1,expected_revision:0,proposal:corrected})).question.version,2);
 const review={action:'review',question_id:q.id,version:2};
 const stale=await command(review);assert.equal(stale.code,'human_review_invalid');
 assert.equal((await store.query('a','requirement')).items.length,0);
 assert.equal((await store.query('a','relation')).items.filter(r=>r.trace.source==='human_review_authorization_v1').length,0);
 const revised=requests.at(-1);assert.notEqual(revised.statementDigest,old.statementDigest);assert.notEqual(revised.requestDigest,old.requestDigest);
 decision=makeDecision(revised);const confirmed=await command(review);assert.equal(confirmed.status,'confirmed');
 const requestCount=requests.length;assert.equal((await command(review)).idempotent,true);assert.equal(requests.length,requestCount);
 const saved=await store.get('a','requirement',confirmed.requirement_id);assert.equal(saved.entity.description,corrected.description);assert.deepEqual(saved.entity.acceptance_criteria,corrected.acceptance_criteria);
 const receipts=(await store.query('a','relation')).items.filter(r=>r.trace.source==='human_review_authorization_v1');assert.equal(receipts.length,1);assert.equal(receipts[0].trace.reason,revised.requestDigest);
 assert.equal((await store.history('a','requirement',confirmed.requirement_id)).items.length,1);
 reopened=new SqliteKnowledgeAdapter(dbpath);assert.deepEqual(await reopened.get('a','requirement',confirmed.requirement_id),saved);
 const after=await evaluate();assert.equal(after.assessment.specification_coverage.confirmed_requirements_count,1);assert.equal(after.assessment.closure_verdict,'blocked_by_unknown_applicability');assert.equal(after.assessment.execution_coverage.status,'not_executed');assert.notEqual(after.assessment.coverage_digest,before.assessment.coverage_digest);
 const blockedClose=await call('qap_module_close',{module:'catalog',user_confirmed:true,canonical_closure:{action:'close'}});assert.equal(blockedClose.code,'closure_preconditions_not_met');assert.equal(closureRequests.length,0);
 const sql=new DatabaseSync(dbpath,{readOnly:true});const integrity=sql.prepare('PRAGMA integrity_check').get();sql.close();assert.equal(integrity.integrity_check,'ok');
 assert.equal(readFileSync(lifecyclePath,'utf8'),lifecycle);assert.equal(existsSync(join(root,'.qa/modules/catalog/rules.yaml')),false);
 console.log(JSON.stringify({result:'PASS',staleDecision:stale.code,statementDigestChanged:true,requestDigestChanged:true,requirements:1,receipts:1,history:1,retryGatewayCalls:0,secondConnectionExactRecord:true,coverageBefore:before.assessment.specification_coverage,coverageAfter:after.assessment.specification_coverage,execution:after.assessment.execution_coverage,verdict:after.assessment.closure_verdict,lifecycleUnchanged:true,rulesYaml:false,sqliteIntegrity:'ok',lifecycleSha256:createHash('sha256').update(lifecycle).digest('hex')}));
 const applicability={module:'catalog',canonical_closure:{action:'declare_non_applicable',decisions:[{category:'performance',reason:'Exclusión sintética autorizada para comprobar reintentos sin aprobación.'}]}};
 const first=await call('qap_module_close',applicability),second=await call('qap_module_close',applicability);
 assert.equal(first.code,'closure_review_pending');assert.equal(second.code,'closure_review_pending');
 const [r1,r2]=closureRequests;assert.equal(closureRequests.length,2);
 closureDecision={requestDigest:r1.requestDigest,approvalId:randomUUID(),decision:'approve',reviewer:'independent-synthetic-owner',decidedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+60000).toISOString()};
 const retry=await call('qap_module_close',applicability);assert.equal(retry.code,'closure_review_invalid');
 console.log(JSON.stringify({nextP0ApplicabilityProbe:{first:first.code,second:second.code,sameCommand:true,coverageDigestStable:r1.coverageDigest===r2.coverageDigest,requestDigestStable:r1.requestDigest===r2.requestDigest,oldDecisionRetry:retry.code,approvals:closureStore.read(context).approvals.length,decisions:(closureStore.read(context).applicabilityDecisions.catalog??[]).length},closeUnknown:{code:blockedClose.code,gatewayRequests:0}}));
}finally{reopened?.close();await client.close();await server.close();closureStore.close();store.close();}

```
