# Evidencia de aplicabilidad diferida R4-R8

Código `44c69f826a0599eeee400ff413ae9faedeeecd75`; fixtures independientes SQLite/Chromium, sin datos productivos. Las sondas se ejecutan fuera de fuentes y tests versionados.

| Garantía solicitada | Evidencia y límite |
| --- | --- |
| Pendientes idénticos conservan coverageDigest/requestDigest | Primera prueba R4-R8-A01: dos null separados 20 ms, ambos digests iguales, cero approvals/decisiones. PASS. |
| Host acepta posteriormente la primera solicitud | Mismo test: makeDecision(requests[0]), tercera llamada declarada, una aprobación y una decisión. PASS. |
| Fecha corresponde al host | Igualdad exacta con authorized.decidedAt, generado un segundo antes; segunda conexión idéntica. PASS. La fecha permanece en el registro aunque se excluye del hash. |
| Cambio de categoría/motivo/revisión invalida | Motivo y revisión en segunda prueba; categoría performance→security en sonda externa. closure_review_invalid y snapshot sin nuevas autorizaciones. PASS acotado. |
| Knowledge cambia durante gateway | Tercera prueba: requisito 1→2 durante reviewClosure; closure_context_changed, ClosureStore exactamente intacto. PASS en esa ventana. |
| Cero writes si falla compuerta | Probado para los negativos anteriores y las regresiones existentes de gateway/digest/expiry/rechazo. No garantía universal entre stores: A02 demuestra autorización obsoleta tras relectura. |
| Historia de closed/waived, sin digests ajenos | Servicios de closure y coverage cargados por git show del baseline exacto generan ambos terminales en SQLite. Servicio actual los reconoce y segunda conexión conserva registro. Alterar aprobación a foreign-digest devuelve working. PASS en fixtures. |
| Crash 2/3, cierre durable y guidance 17 | Coverage completo 40/40: recuperación de recibo/proyección sin nueva autorización, idempotencia y 16/17 válidos/último inválido conservados. No equivale al recorrido integrado pendiente. |

## R4-R8-A02 P1: frontera relectura / persistencia

Secuencia ejecutada:

1. Requisito confirmado revisión 1, llamada declare_non_applicable pendiente; guardar solicitud y emitir decisión independiente exacta.
2. Reintentar el mismo comando. El gateway devuelve esa decisión; la segunda evaluación del servicio todavía ve revisión 1 y acepta igualdad de digest.
3. Decorar solamente el puerto `closureStore.transaction`: antes de delegar a la transacción real, realizar commit de revisión 2 del requisito en el KnowledgeStore físico.
4. Delegar a la implementación SQLite original sin cambiar su callback. Se guardan una aprobación y una decisión; respuesta `declared_non_applicable`.
5. La evaluación posterior ya usa revisión 2. El digest del assessment devuelto difiere del presentado al host. No se revierte la aprobación persistida.

El decorador no sustituye el evaluador, no fabrica la decisión desde MCP y no altera archivos fuente. Modela una escritura concurrente en una frontera permitida por los dos puertos. No se afirma una carrera real entre dos procesos ni una garantía sobre su frecuencia. El CAS/generación de ClosureStore serializa su propia base; no protege las revisiones leídas de KnowledgeStore. Volver a evaluar antes de llamar a otro store reduce la ventana, pero no la cierra.

**Remediación a diseñar antes de certificar:** establecer en los servicios existentes un contrato que mantenga vigente el snapshot canónico hasta el punto de consumo de autorización, con control de revisión transversal o serialización del host demostrable. Probar mutaciones durante gateway, durante revalidación, antes de transacción y antes de commit durable; incluir competencia de aplicabilidad/cierre, expiración durante la espera y consumo único. No imponer una solución solo de segunda lectura ni declarar atomicidad a partir de una prueba dentro del gateway.

## Compatibilidad histórica

Se comparan ambos evaluadores sobre el mismo contexto físico. Cuando hay una decisión persistida, R4-R7 serializa el objeto completo y R4-R8 serializa componentes seleccionados sin decided_at. Los hashes difieren. No hay versionado de algoritmo ni migración automática.

La verificación terminal actual usa la correlación exacta `decisionId → requestDigest`, el registro durable y su recibo; no exige que el hash histórico coincida con una evaluación nueva. Por ello el closed/waived creado con R4-R7 se conserva sin reescribirlo. La sonda cambia únicamente el digest del asiento de aprobación después del positivo y exige rechazo aunque el lifecycle ya sea terminal. No convierte un digest extranjero en válido ni compara hashes de versiones como equivalentes.

Un host que tenga una solicitud **pendiente** anterior al cambio de algoritmo debe volver a presentarla y obtener aprobación para el digest nuevo si su cobertura incluye aplicabilidad. La conservación de terminales durables no constituye compatibilidad de inbox pendiente entre versiones. El fixture de historia siembra una aplicabilidad sintética y produce cierre/waiver mediante los servicios reales del baseline; no inspecciona bases privadas históricas de usuarios.

## Salida de sonda

```json
{"chromium":"153.0.8010.12"}
{"sqlite":"3.51.3"}
{"category":"closure_review_invalid","categoryZeroWrites":true,"race":"declared_non_applicable","knowledgeRevision":2,"approvals":1,"decisions":1,"reviewedDigest":"e1542be2c8db4e77b7b16c1bbdb67f72fce551704cc7ad10fd3718af2e9d07b9","persistedAssessmentDigest":"8e6d5914ba56ff99c14ab229d6915e58691a09cabe7ddb3af836011a993bad98"}
{"historical":"closed","oldCoverageDigest":"3a90a854aa188ff586f9090b077e9c7c9050468ec414887bd4143b820dd6bd8e","newCoverageDigest":"51903ddde2a80f21d7e8ce63b1cf5c8b21f94be493c40bd5cab155bf43feeb5b","preserved":true,"foreignDigestRejected":true}
{"historical":"waived","oldCoverageDigest":"a709d17d146ed2f936315e4b033ef0c56f89829895d16fb32f9a2ba631363c55","newCoverageDigest":"281c22a42ce0886c51f603fe3fb8f47e68ae20f14f6c4f4fc6b5fcc6e4e16567","preserved":true,"foreignDigestRejected":true}

```

## Arneses reproducibles

Guardar estos bloques fuera de fuentes como .audit-r8/prepare.mjs y .audit-r8/probe.mjs, desde la raíz del worktree ya compilado. Solo leen el código baseline por git show; generan bundles externos y bases de fixture. node prepare.mjs precede node probe.mjs. Las carpetas de artefactos deben quedar fuera del alcance de eslint antes de pnpm lint.

### prepare.mjs

```javascript
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const req=createRequire(resolve('package.json'));
const tr=createRequire(req.resolve('tsup/package.json'));
const {build}=await import(pathToFileURL(tr.resolve('esbuild')));
let fixture=readFileSync('packages/mcp/src/__tests__/canonical-coverage.test.ts','utf8').split("describe('VNEXT-013-R5 Comprehensive Physical Test Matrix'")[0];
fixture=fixture.replace("import { afterEach, describe, expect, it, vi } from 'vitest';","const afterEach = () => {}; const vi = {restoreAllMocks(){}};");
fixture+='\nexport {fixture,makeDecision};';
await build({stdin:{contents:fixture,resolveDir:resolve('packages/mcp/src/__tests__'),loader:'ts'},bundle:true,packages:'external',platform:'node',format:'esm',outfile:'packages/mcp/.audit-r8/fixture.mjs'});
const old=execFileSync('git',['show','ea75eb2c52266b174e6d24917c1b089d56834900:packages/mcp/src/handlers/canonical-coverage-service.ts'],{encoding:'utf8'});
await build({stdin:{contents:old,resolveDir:resolve('packages/mcp/src/handlers'),loader:'ts'},bundle:true,packages:'external',platform:'node',format:'esm',outfile:'packages/mcp/.audit-r8/old-coverage.mjs'});
const oldClosure=execFileSync('git',['show','ea75eb2c52266b174e6d24917c1b089d56834900:packages/mcp/src/handlers/canonical-closure-service.ts'],{encoding:'utf8'});
await build({stdin:{contents:oldClosure,resolveDir:resolve('packages/mcp/src/handlers'),loader:'ts'},bundle:true,packages:'external',platform:'node',format:'esm',outfile:'packages/mcp/.audit-r8/old-closure.mjs',plugins:[{name:'baseline-coverage',setup(b){b.onLoad({filter:/canonical-coverage-service\.ts$/},()=>({contents:old,loader:'ts',resolveDir:resolve('packages/mcp/src/handlers')}));}}]});
writeFileSync('.audit-r8/stdio.mjs',readFileSync('docs/vnext/auditorias/VNEXT-014-R4-R7/COMANDOS.md','utf8').split('```javascript')[1].split('```')[0]);


```

### probe.mjs

```javascript
import assert from 'node:assert/strict';
import {fixture,makeDecision} from '../packages/mcp/.audit-r8/fixture.mjs';
import {CanonicalCoverageService as OldCoverage} from '../packages/mcp/.audit-r8/old-coverage.mjs';
import {CanonicalClosureService as OldClosure} from '../packages/mcp/.audit-r8/old-closure.mjs';
import {DatabaseSync} from 'node:sqlite';
import {chromium} from 'playwright-core';
const browser=await chromium.launch({headless:true}); console.log(JSON.stringify({chromium:browser.version()})); await browser.close();
const db=new DatabaseSync(':memory:'); db.exec("CREATE VIRTUAL TABLE audit USING fts5(text); INSERT INTO audit VALUES('probe')");assert.equal(db.prepare("SELECT count(*) n FROM audit WHERE audit MATCH 'probe'").get().n,1);console.log(JSON.stringify(db.prepare('select sqlite_version() sqlite').get()));db.close();
const command={action:'declare_non_applicable',decisions:[{category:'performance',reason:'El negocio excluye rendimiento de este alcance sintético auditado.'}]};
const requests=[];let authorization=null;
const f=await fixture({confirmedReqs:[{category:'functional',title:'Consulta',criteria:['Consulta verificable']}],gateway:{reviewClosure:async r=>{requests.push(r);return authorization;}}});
try {
 await f.closureService.execute('catalog',command);authorization=makeDecision(requests[0]);
 const before=f.closureStore.read(f.context);
 const category=await f.closureService.execute('catalog',{...command,decisions:[{...command.decisions[0],category:'security'}]});
 assert.equal(category.code,'closure_review_invalid');assert.deepEqual(f.closureStore.read(f.context),before);
 const originalTransaction=f.closureStore.transaction.bind(f.closureStore);
 let mutated=false;
 f.closureStore.transaction=async(scope,operation)=>{
  if(!mutated){mutated=true;const r=await f.store.get('app-r5','requirement','req-conf-1');await f.store.commit('app-r5',[{kind:'requirement',expected_revision:r.revision,entity:{...r.entity,description:'Cambio concurrente después de revalidar y antes de persistir'},trace:r.trace}]);}
  return originalTransaction(scope,operation);
 };
 const race=await f.closureService.execute('catalog',command);
 const after=f.closureStore.read(f.context);
 assert.equal(race.status,'declared_non_applicable');assert.equal(after.approvals.length,1);assert.equal((await f.store.get('app-r5','requirement','req-conf-1')).revision,2);
 console.log(JSON.stringify({category:category.code,categoryZeroWrites:true,race:race.status,knowledgeRevision:2,approvals:after.approvals.length,decisions:after.applicabilityDecisions.catalog.length,reviewedDigest:requests[0].coverageDigest,persistedAssessmentDigest:race.assessment.coverage_digest}));
} finally {f.closureStore.close();f.store.close();}
for(const terminal of ['closed','waived']){
 const g=await fixture({confirmedReqs:['functional','business_rule','security','ui','ux','regression','performance'].map(category=>({category,title:category,criteria:['Criterio confirmado verificable']})),gateway:{reviewClosure:async r=>makeDecision(r)}});
 try {
  const old=new OldCoverage(g.store,g.context,g.closureStore);
  const decision={category:'performance',applicable:false,reason:'Exclusión histórica explícita del propietario sintético',decided_by:'host_review_gateway',decision_id:'historical-applicability',decided_at:'2026-11-01T00:00:00Z'};
  await g.closureStore.transaction(g.context,async s=>{s.applicabilityDecisions.catalog=[decision];});
  const older=await old.evaluate('catalog');const newer=await g.coverageService.evaluate('catalog');assert.notEqual(older.assessment.coverage_digest,newer.assessment.coverage_digest);
  const baselineService=new OldClosure(g.store,g.context,g.closureStore,{reviewClosure:async r=>makeDecision(r)});
  const result=await baselineService.execute('catalog',terminal==='closed'?{action:'close'}:{action:'waive',reason:'Motivo histórico sustantivo aprobado por propietario'});
  assert.equal(result.status,terminal);
  const record=g.closureStore.read(g.context).closures.catalog;
  assert.equal((await g.closureService.status('catalog')).state,terminal);
  const reopened=g.openClosureStore();assert.deepEqual(reopened.read(g.context).closures.catalog,record);reopened.close();
  await g.closureStore.transaction(g.context,async s=>{s.approvals=s.approvals.map(([id,hash])=>[id,id===record.decisionId?'foreign-digest':hash]);});
  assert.equal((await g.closureService.status('catalog')).state,'working');
  console.log(JSON.stringify({historical:terminal,oldCoverageDigest:older.assessment.coverage_digest,newCoverageDigest:newer.assessment.coverage_digest,preserved:true,foreignDigestRejected:true}));
 }finally{g.closureStore.close();g.store.close();}
}


```
