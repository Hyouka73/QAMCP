import fs from 'node:fs';
import console from 'node:console';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const repo='C:/Users/Judirico/Documents/QAMCP/QAMCP';
const input='C:/Users/Judirico/Documents/QAMCP/rescate-evidence/20261105-integracion';
const dir=repo+'/docs/vnext/implementaciones/VNEXT-014-CIERRE-CONTROLADO';
const out=dir+'/evidencia';
fs.mkdirSync(out,{recursive:true});
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim();
const get=n=>JSON.parse(fs.readFileSync(input+'/'+n+'.json','utf8'));
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const normalizedLog=p=>{
  const text=fs.readFileSync(p,'utf8').replaceAll('\r\n','\n').split('\n').map(line=>line.trimEnd()).join('\n').trimEnd();
  return text ? text+'\n' : '';
};
function extract(name){
  const raw=get(name), counters=new Map();
  const identities=raw.testResults.flatMap(s=>(s.assertionResults??[]).map(t=>{
    const file=s.name.replaceAll('\\','/').split('/packages/mcp/')[1]??s.name.replaceAll('\\','/').split('/packages/')[1];
    const group=JSON.stringify([file,t.fullName]);const ordinal=(counters.get(group)||0)+1;counters.set(group,ordinal);
    return {file,fullName:t.fullName,ordinal,status:t.status,duration_ms:t.duration??null,first_error:t.failureMessages?.[0]?.split('\n')[0]??null};
  }));
  const logPath=input+'/'+name+'.log';const log=fs.existsSync(logPath)?fs.readFileSync(logPath,'utf8'):'';
  const unusual=log.split('\n').filter(line=>/Unhandled Errors|Unhandled Rejection|Uncaught Exception|ECOMPROMISED|Vitest caught \d+ unhandled/.test(line));
  return {name,sha:name==='baseline-physical-mcp'?'6ce7472bc1cef8d252434a3d71a0a614ed06a390':name.startsWith('before-drain-fix')?'c9e58ceaa145965db96dbc1951a2ca36ecfbb7e5':name==='final-serial'?'b319047d07e4658396f94654e7c92ce4b8ad41ea':sha,
    totals:{pass:raw.numPassedTests,fail:raw.numFailedTests,total:raw.numTotalTests},
    raw_json_sha256:hash(input+'/'+name+'.json'),log_sha256:hash(logPath),published_log_sha256:createHash('sha256').update(normalizedLog(logPath)).digest('hex'),
    unhandled_log_lines:unusual,failed_suites_without_assertions:raw.testResults.filter(s=>!s.assertionResults?.length&&s.status==='failed').map(s=>({name:s.name,message:s.message})),identities};
}
const names=['baseline-physical-mcp','final-serial','final-parallel-a','final-parallel-b'];
const runs=Object.fromEntries(names.map(n=>[n,extract(n)]));
for(const [name,run] of Object.entries(runs))fs.writeFileSync(out+'/'+name+'.json',JSON.stringify(run,null,2)+'\n');
const intermediate=['before-drain-fix-serial','before-drain-fix-parallel-a','before-drain-fix-parallel-b'].map(extract);
for(const run of intermediate)fs.writeFileSync(out+'/'+run.name+'.json',JSON.stringify(run,null,2)+'\n');
const key=t=>JSON.stringify([t.file,t.fullName,t.ordinal]);
const maps=Object.fromEntries(names.map(n=>[n,new Map(runs[n].identities.map(t=>[key(t),t]))]));
function diff(before,after){
  const b=maps[before],a=maps[after],result={preserved_pass:[],recovered:[],remaining_fail:[],regressions:[],added:[],removed:[]};
  for(const [k,t]of b){const u=a.get(k);if(!u){result.removed.push(t);continue;}
    if(t.status==='passed'&&u.status==='passed')result.preserved_pass.push(u);
    else if(t.status==='failed'&&u.status==='passed')result.recovered.push(u);
    else if(t.status==='failed'&&u.status==='failed')result.remaining_fail.push(u);
    else result.regressions.push({before:t,after:u});}
  for(const [k,t]of a)if(!b.has(k))result.added.push(t);
  return result;
}
const comparison={baseline_to_serial:diff(names[0],names[1]),serial_to_parallel_a:diff(names[1],names[2]),serial_to_parallel_b:diff(names[1],names[3])};
const controls=['final-solo-a','final-solo-b'].map(extract);
for(const run of controls){
  runs[run.name]=run;
  maps[run.name]=new Map(run.identities.map(t=>[key(t),t]));
  comparison['serial_to_'+run.name]=diff('final-serial',run.name);
  fs.writeFileSync(out+'/'+run.name+'.json',JSON.stringify(run,null,2)+'\n');
}
fs.writeFileSync(out+'/comparison.json',JSON.stringify(comparison,null,2)+'\n');
const matrix=fs.readFileSync(repo+'/docs/vnext/auditorias/VNEXT-014-CIERRE-CODEX/MATRIZ_63.md','utf8').split('\n').filter(l=>/^\| \d+ \|/.test(l)).map(l=>l.split(' | ').map(s=>s.replace(/^\| /,'').replace(/ \|$/,'')));
if(matrix.length!==63)throw new Error('matrix must contain 63 identities');
let md='# Matriz de 63 identidades — rescate integrado\n\nSerial `b319047`; paralelo `'+sha+'` (única diferencia entre ellos: quitar inicializador inútil del nuevo test de cleanup). Baseline integrado `6ce7472`. Archivo + fullName exactos preservados; cada fila histórica aparece una sola vez. Los tres negativos R4-R9/R4-R10 están fuera de este universo y figuran en la comparación completa. PASS por identidad no certifica aprobación humana real.\n\n| # | Archivo | fullName exacto | Baseline integrado | Serial | Paralelo A | Paralelo B | Disposición |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n';
for(const row of matrix){const [id,file,fullName]=row;const k=JSON.stringify([file,fullName,1]);const tests=names.map(n=>maps[n].get(k));if(tests.some(t=>!t))throw new Error('Missing historical identity '+fullName);
  const states=tests.map(t=>t.status==='passed'?'PASS':t.status.toUpperCase());
  const disposition=states[1]==='PASS'?(id==='8'?'7.5 fixture válido + reapertura/readback/integridad':'Oráculo migrado conservado'):Number(id)<=13?'Primera familia clasificada; migración/decisiones pendientes':'Garantía histórica pendiente; no implica defecto productivo probado';
  md+=`| ${id} | ${file} | ${fullName} | ${states.join(' | ')} | ${disposition} |\n`;
}
md+='\nLas 55 pendientes se agrupan y priorizan en [RECONCILIACION_HISTORICA.md](RECONCILIACION_HISTORICA.md). [JSON completos por identidad](evidencia/final-serial.json) y [comparación con altas/bajas/regresiones](evidencia/comparison.json).\n';
fs.writeFileSync(dir+'/MATRIZ_63_RESCATE.md',md);
const records={sha,baseline:'6ce7472bc1cef8d252434a3d71a0a614ed06a390',merge_parents:['46b1177110312797bab02a6f5a8ef228d79d367e','3fe4fec91843943c7b901974b7c0a4ef5540e0eb'],runs:names.map(n=>({name:n,...runs[n].totals,unhandled:runs[n].unhandled_log_lines,empty_failed_suites:runs[n].failed_suites_without_assertions.length})),control_runs:controls.map(run=>({name:run.name,sha:run.sha,...run.totals,unhandled:run.unhandled_log_lines})),intermediate_runs:intermediate.map(run=>({name:run.name,sha:run.sha,...run.totals,unhandled:run.unhandled_log_lines})),comparison:Object.fromEntries(Object.entries(comparison).map(([k,d])=>[k,Object.fromEntries(Object.entries(d).map(([k,v])=>[k,v.length]))])),commands:fs.readdirSync(input).filter(p=>p.endsWith('.command.json')).map(p=>({artifact:p,...get(p.slice(0,-5))})),differential:get('differential')};
fs.writeFileSync(out+'/manifest.json',JSON.stringify(records,null,2)+'\n');
for(const n of ['differential.json','lifecycle-first-cause.json'])fs.copyFileSync(input+'/'+n,out+'/'+n);
for(const n of ['final-build','final-focal','final-runner','final-engine','final-knowledge','final-cli','final-tsc','baseline-tsc','drain-fix-focal','lifecycle-first-cause','runner-tsc','knowledge-tsc',...names,...intermediate.map(r=>r.name),...controls.map(r=>r.name)]){
  fs.writeFileSync(out+'/'+n+'.log',normalizedLog(input+'/'+n+'.log'));
}
for(const n of ['verify.ps1','differential.mjs','lifecycle-first-cause.mjs','publish-evidence.mjs','results.mjs'])fs.copyFileSync(input+'/'+n,out+'/'+n);
console.log(JSON.stringify({...records,commands:undefined,differential:undefined},null,2));
