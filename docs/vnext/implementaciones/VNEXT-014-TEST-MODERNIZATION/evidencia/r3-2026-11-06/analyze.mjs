import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../../../../../..');
const family = resolve(here, '../..');
const require = createRequire(resolve(repo, 'package.json'));
const ts = require('typescript');
const read = path => readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
const json = path => JSON.parse(read(path));
const save = (name, value) => writeFileSync(resolve(here, name), JSON.stringify(value, null, 2) + '\n');
const sha = 'bdafeeb834549fc13c5d952c1f341098c2592468';
const suites = ['p3-canonical-discovery','p4-2-canonical-contract','p4-5a-canonical-integrity','p4-5a2-canonical-integrity','server-canonical-discovery','server-canonical-operations','server','plan-handler','test-handler'];
const manifest = json(resolve(here, 'manifest.json'));
const extract = data => data.testResults.flatMap(file => file.assertionResults.map(test => ({...test,file:file.name})));
const r1 = extract(json(resolve(here, '../r1-2026-11-06/serial.json')));
const r2 = json(resolve(here, '../r2-2026-11-06/comparison.json')).cases;
const matrix = json(resolve(family, 'evidencia/matriz-55.json'));
if (matrix.length !== 55 || new Set(matrix.map(row=>row.id)).size !== 55) throw new Error('Invalid historical matrix');
const cases = [], summaries = [];
for (const suite of suites) {
  const data = json(resolve(here, suite + '.json'));
  const run = manifest.find(item=>item.name===suite);
  const tests = extract(data);
  for (const test of tests) {
    const old = r1.find(item=>item.fullName===test.fullName);
    const id = matrix.find(row=>row.fullName===test.fullName)?.id ?? null;
    cases.push({id,suite,fullName:test.fullName,status:test.status,duration_ms:test.duration,first_error:test.failureMessages[0]??null,r1:old?.status??'not_executed',r2:r2.find(item=>item.fullName===test.fullName)?.r2??'not_executed',failure_classification:test.status==='failed'?(id==='TM-50'?'capacidad legacy ausente / contrato de test obsoleto':'pendiente revisión individual'):null,evidence:suite+'.json',sha});
  }
  summaries.push({suite,exit_code:run.exit_code,pass:tests.filter(t=>t.status==='passed').length,fail:tests.filter(t=>t.status==='failed').length,skip:tests.filter(t=>['pending','skipped','todo'].includes(t.status)).length,elapsed_ms:run.elapsed_ms,sha});
}
save('suite-summary.json',summaries);
save('all-cases.json',cases);

// Static inventory only: no tests, hooks, imports or browser code are executed here.
// The 55 historical identities are literal describe/it declarations.
function files(dir) {
  return readdirSync(dir,{withFileTypes:true}).flatMap(item=>item.isDirectory()?files(resolve(dir,item.name)):item.name.endsWith('.test.ts')?[resolve(dir,item.name)]:[]);
}
const declared=[];
for (const file of files(resolve(repo,'packages/mcp/src/__tests__'))) {
  const source=ts.createSourceFile(file,read(file),ts.ScriptTarget.Latest,true);
  function visit(node,parents=[]) {
    if (ts.isCallExpression(node)) {
      const expression=node.expression.getText(source);
      const first=node.arguments[0];
      if (/^(describe|it|test)(?:\.(?:skip|todo|only|concurrent|sequential))*$/.test(expression) && first && ts.isStringLiteralLike(first)) {
        const suite=expression.startsWith('describe');
        if (!suite) declared.push({fullName:[...parents,first.text].join(' '),file:relative(repo,file).replaceAll('\\','/'),line:source.getLineAndCharacterOfPosition(node.getStart(source)).line+1,modifier:expression});
        for (const arg of node.arguments.slice(1)) visit(arg,suite?[...parents,first.text]:parents);
        return;
      }
    }
    ts.forEachChild(node,child=>visit(child,parents));
  }
  visit(source);
}
const inventory=matrix.map(row=>({id:row.id,fullName:row.fullName,declarations:declared.filter(test=>test.fullName===row.fullName)}));
save('identity-inventory.json',{method:'TypeScript AST static literal describe/it inventory; no suite execution',identities:inventory,missing:inventory.filter(row=>row.declarations.length===0).map(row=>row.id),duplicates:inventory.filter(row=>row.declarations.length>1).map(row=>row.id),disabled:inventory.filter(row=>row.declarations.some(test=>/\.(skip|todo|only)/.test(test.modifier))).map(row=>row.id)});

const partial = new Map([
 ['TM-09','Prioridades y desempate MCP pasan; no construye observed legacy ni todos completos en WORKING.'],
 ['TM-22','Aceptación durable de una brecha sin bypass; no prueba dos requisitos ni cierre por accept_gaps (contrato sustituido).'],
 ['TM-23','Negativo authentication_not_supported; no demuestra auth_required/session_invalid ni sus campos históricos.'],
 ['TM-25','Umbral léxico positivo unitario; review negativo por texto y autorización; el límite positivo exacto no se confirma/persiste en este caso.'],
 ['TM-26','Razón 14 rechazada y 15 aceptada durable; accept_gaps no cierra automáticamente (sustitución explícita).'],
 ['TM-41','HTML pasivo completed, cero controles y requisitos; no acredita advertencia legacy ni observaciones >0 en este caso.'],
 ['TM-42','Controles >0 y observaciones >0 sin requisitos; no afirma ausencia de extraccion_vacia en esta identidad.'],
 ['TM-43','Dos módulos pasivos completed, cero controles y ausencia de extraccion_vacia; no prueba aviso antiguo (retirado del contrato).'],
 ['TM-44','Positivo Operación/operacion, binding y requisito tras restart; no aserta contenido draft tras restart y Knowledge mantiene su conexión abierta.'],
 ['TM-48','Cinco familias de negativas pasan; revisión 999 frente a 1 prueba mismatch futuro, no consentimiento anterior tras actualizar Environment.'],
 ['TM-53','Status legacy WORKING y ausencia de escritura en context.yaml; no invoca validador de schema, ni positivo Discovery legacy implícito (retirado).'],
]);
const authIds = new Set(['TM-13','TM-14','TM-15','TM-16','TM-17','TM-18','TM-19','TM-27','TM-30','TM-31','TM-32','TM-50']);
const sufficient = new Map([
 ['TM-06','Discovery físico fresh_anonymous_static persiste observaciones sin requisitos ni siguiente_accion; next separado abre pregunta revisable y status la reanuda. Entrevista embebida sustituida.'],
 ['TM-07','Observaciones de ejecuciones únicas, conserva observaciones previas y requisito/historial revisados tras re-discover; sin rules.yaml. No idempotencia global de adquisición.'],
 ['TM-08','Binario inexistente produce fallo real de adquisición, cero observaciones/requisitos, lifecycle intacto e integridad SQLite. Decision legacy retirada.'],
 ['TM-10','Onboarding/plan, dos Discovery reales, entrevista/cobertura/cierre revisado y siguiente módulo; sin texto de bucle ni promoción implícita.'],
 ['TM-11','Respuestas sin campos de pregunta aplanados; opciones estructuradas y pregunta canónica por next, sin requisito implícito.'],
 ['TM-12','Versión inicial 0 e incremento de propuesta; revisión independiente, requisito, cierre/waiver, session_close y Pregunta válida WRAP_UP.'],
 ['TM-20','Wire legacy no confiere autoridad; propuesta canónica pending_review sin requisitos ni cobertura normativa. Inferred/agent sustituido por draft sin promoción.'],
 ['TM-21','Etiqueta del motor no es texto sustantivo: propuesta no se confirma ni crea requisito; review substantive_statement_required.'],
 ['TM-24','ID inventado y legacy from_option no conceden autoridad; opción falsa no existe y cero requisitos. Formato legacy explícitamente sustituido.'],
 ['TM-28','Autorización ausente bloquea sin escritura; recuperación autorizada adquiere realmente y conserva lifecycle.'],
 ['TM-29','Cuatro opciones canónicas, defer/resume estable sin requisitos, confirmación con gateway y un requisito; execution not_executed. User_text/una_opcion sustituidos.'],
 ['TM-33','Categoría formal security en propuesta autorizada y requisito SQLite revisado; prompt proposito independiente y digest correlacionado.'],
 ['TM-34','ID/módulo/categoría inválida no crean requisito; security válida requiere host. La comparación literal con categoría del prompt fue sustituida.'],
 ['TM-35','Snapshot de draft pending_review/título sobrevive reapertura stores/servidor; misma pregunta, cero requisitos y texto insuficiente bloqueado.'],
 ['TM-36','Después de requisito revisado se emite actor estable; cuatro acciones canónicas y no se agrega otro requisito por pedir next. Una_opcion legacy sustituida.'],
 ['TM-37','Propuesta enlazada a pregunta pending_review, cuatro acciones canónicas, review sin host bloquea y cero requisitos. Tres opciones legacy sustituidas.'],
 ['TM-38','Contenido/procedencia/recibo único revisados en SQLite; seis exclusiones revisadas completan especificación sin ejecución ficticia.'],
 ['TM-39','Defer conserva pregunta/estado tras restart, cero requisitos y sin promoción; regla deferred YAML sustituida por draft.'],
 ['TM-40','Texto genérico no sustantivo bloquea review y no persiste requisitos; se sustituye error legacy por blocked sustantivo.'],
 ['TM-45','Correct conserva ID e incrementa versión, mantiene revisión requerida y bloquea sin host; cero requisitos espurios.'],
 ['TM-46','MCP real: plan_missing, plan.json/fingerprint, Chromium con resultado persisted passed y rechazo cases_mismatch sin nueva ejecución. No stub en_desarrollo.'],
 ['TM-47','Discovery adquirido/asociado, conteos observaciones/evidencia >0 correlacionados con SQL, unreviewed, cero requisitos y sin context.yaml legacy.'],
 ['TM-49','Fallo real de lanzamiento por binario inexistente, sin adquisición completada, observaciones/requisitos ni mutación lifecycle; integridad SQLite.'],
 ['TM-51','HTML pasivo adquirido/asociado con controls/forms=0, observaciones>0 y cero requisitos, sin inventar ausencia de vista.'],
 ['TM-52','Gates de fase/módulo y positivo Discovery físico; observaciones sin requisitos ni transición planned→observed automática.'],
 ['TM-54','MCP init/ingest/context_set/plan/Discovery por fases, negativas prematuras, observaciones sin requisito y planned intacto.'],
 ['TM-55','Next/guidance, cobertura incompleta, propuesta/host/aplicabilidad, requisito revisado sin YAML y cierre explícito cambia lifecycle.'],
]);
const rows=matrix.map(row=>{
  const current=cases.filter(test=>test.fullName===row.fullName);
  if(current.length>1) throw new Error('Duplicate executed identity '+row.id);
  const test=current[0], old=r1.find(item=>item.fullName===row.fullName), prior=r2.find(item=>item.fullName===row.fullName);
  const source=inventory.find(item=>item.id===row.id);
  const status=test?.status??'not_executed';
  const certification=!test?'No ejecutado':status==='failed'?'Capacidad no implementada (FAIL físico legacy)':partial.has(row.id)?'PASS físico con equivalencia parcial':'PASS físico con equivalencia suficiente para contrato canónico sustituido';
  return {id:row.id,fullName:row.fullName,baseline:row.baseline_status??row.status,r1:old?.status??'not_executed',r2:prior?.r2??'not_executed',r3:status,sha:test?sha:null,duration_ms:test?.duration_ms??null,semantic_equivalence:!test?'No recertificada en R3':partial.get(row.id)??(status==='failed'?'Discovery autenticado/session_saved no implementado por el camino canónico.':sufficient.get(row.id)),regression:!test?'not_evaluated':old?.status==='passed'&&status!=='passed'?'PASS→FAIL':old?.status==='failed'&&status==='passed'?'FAIL→PASS':prior?.r2==='passed'&&status!=='passed'?'PASS R2→FAIL':'none',certification,capability_pending:authIds.has(row.id),first_error:test?.first_error??null,evidence:test?test.evidence:'identity-inventory.json (solo inspección; sin ejecución)',declarations:source.declarations};
});
save('matrix-55-r3.json',rows);
const md=['# Matriz física R3 de 55 identidades','',`SHA: ${sha}. NO EJECUTADO nunca hereda PASS de R1/R2. La equivalencia suficiente se refiere al contrato canónico explícitamente sustituido, no a las representaciones legacy retiradas.`, '', '| ID | FullName histórico | Baseline | R1 | R2 | R3 | Equivalencia / estado | Regresión vs R1 | Evidencia |','|---|---|---|---|---|---|---|---|---|',...rows.map(row=>`| ${row.id} | ${row.fullName.replaceAll('|','\\|')} | ${row.baseline} | ${row.r1} | ${row.r2} | ${row.r3} | ${row.certification}. ${row.semantic_equivalence} | ${row.regression} | [evidencia](${row.evidence}) |`)];
writeFileSync(resolve(here,'matrix-55-r3.md'),md.join('\n')+'\n');
const allMD=['# Todos los casos ejecutados R3','', '| Suite | ID | FullName | Estado | ms | Clasificación |','|---|---|---|---|---:|---|',...cases.map(test=>`| ${test.suite} | ${test.id??'fuera de las 55'} | ${test.fullName.replaceAll('|','\\|')} | ${test.status} | ${test.duration_ms?.toFixed(2)??''} | ${test.failure_classification??'Sin fallo'} |`)];
writeFileSync(resolve(here,'all-cases.md'),allMD.join('\n')+'\n');

const subtract=(a,b)=>{const remaining=[...b];return a.filter(value=>{const i=remaining.indexOf(value);if(i<0)return true;remaining.splice(i,1);return false;});};
const cleanPath=value=>value.replaceAll(repo,'<repo>').replaceAll(repo.replaceAll('\\','/'),'<repo>');
const diagnostics=path=>read(path).split(/\r?\n/).filter(line=>/error TS\d+/.test(line)).map(line=>cleanPath(line.replace(/\(\d+,\d+\)(?=: error TS)/,'')));
const previousTS=diagnostics(resolve(here,'../r2-2026-11-06/typecheck.log')),currentTS=diagnostics(resolve(here,'typecheck.log'));
const lint=json(resolve(here,'eslint-focal.json'));
const paths=new Set(lint.map(row=>row.filePath.replaceAll('\\','/').split('/packages/')[1]));
const normalizeLint=records=>records.filter(row=>paths.has(row.filePath.replaceAll('\\','/').split('/packages/')[1])).flatMap(row=>row.messages.map(message=>({file:row.filePath.replaceAll('\\','/').split('/packages/')[1],rule:message.ruleId,severity:message.severity,message:message.message,line:message.line})));
const priorLint=normalizeLint(json(resolve(here,'../r1-2026-11-06/lint.json'))).filter(row=>!['mcp/src/__tests__/p3-canonical-discovery.test.ts','mcp/src/__tests__/p4-5a2-canonical-integrity.test.ts','mcp/src/__tests__/fixtures/lifecycle-canonical.ts','mcp/src/__tests__/server-canonical-discovery.test.ts'].includes(row.file));
const r2Lint=json(resolve(here,'../r2-2026-11-06/static-diff.json')).eslint.current_messages.filter(row=>paths.has(row.file));
const oldLint=[...priorLint,...r2Lint],newLint=normalizeLint(lint);
const lintKey=row=>JSON.stringify([row.file,row.rule,row.severity,row.message]);
const oldKeys=oldLint.map(lintKey),newKeys=newLint.map(lintKey);
save('static-diff.json',{typescript:{r2:previousTS.length,r3:currentTS.length,added:subtract(currentTS,previousTS),removed:subtract(previousTS,currentTS),retained:currentTS.length-subtract(currentTS,previousTS).length,exit_code:manifest.find(item=>item.name==='typecheck').exit_code},eslint:{scope:'Six files changed by R3. R2 focal baseline plus R1 Server baseline (Server source unchanged R1→R2); operations is new.',baseline_errors:oldLint.filter(row=>row.severity===2).length,baseline_warnings:oldLint.filter(row=>row.severity===1).length,r3_errors:newLint.filter(row=>row.severity===2).length,r3_warnings:newLint.filter(row=>row.severity===1).length,added:subtract(newKeys,oldKeys).map(value=>JSON.parse(value)),removed:subtract(oldKeys,newKeys).map(value=>JSON.parse(value)),current_messages:newLint}});
save('regression-summary.json',{sha,total:cases.length,passed:cases.filter(row=>row.status==='passed').length,failed:cases.filter(row=>row.status==='failed').length,skip:cases.filter(row=>['pending','skipped','todo'].includes(row.status)).length,vs_r1:{pass_to_fail:cases.filter(row=>row.r1==='passed'&&row.status==='failed').map(row=>row.fullName),fail_to_pass:cases.filter(row=>row.r1==='failed'&&row.status==='passed').map(row=>row.fullName),persistent_fail:cases.filter(row=>row.r1==='failed'&&row.status==='failed').map(row=>row.fullName)},vs_r2:{matched:cases.filter(row=>row.r2!=='not_executed').length,pass_to_fail:cases.filter(row=>row.r2==='passed'&&row.status==='failed').map(row=>row.fullName)},historical_55:{executed:rows.filter(row=>row.r3!=='not_executed').length,passed:rows.filter(row=>row.r3==='passed').length,failed:rows.filter(row=>row.r3==='failed').length,not_executed:rows.filter(row=>row.r3==='not_executed').length,sufficient:rows.filter(row=>row.certification==='PASS físico con equivalencia suficiente para contrato canónico sustituido').length,partial:rows.filter(row=>row.certification==='PASS físico con equivalencia parcial').length}});
