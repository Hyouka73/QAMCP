import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../../../../../..');
const r1 = resolve(here, '../r1-2026-11-06');
const read = path => readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
const json = path => JSON.parse(read(path));
const save = (name, value) => writeFileSync(resolve(here, name), JSON.stringify(value, null, 2) + '\n');
const suites = ['p3-canonical-discovery', 'p4-2-canonical-contract', 'p4-5a2-canonical-integrity', 'server-canonical-discovery'];
const ids = [[6,7,8,9,10],[11,12],Array.from({length:13},(_,i)=>33+i),[47,48,49,51]];
const results = [];
for (const [index, suite] of suites.entries()) {
  const current = json(resolve(here, suite + '.json')).testResults.flatMap(r=>r.assertionResults);
  const baseline = json(resolve(r1, suite + '.json')).testResults.flatMap(r=>r.assertionResults);
  if (current.length !== ids[index].length) throw new Error('Unexpected selection: ' + suite);
  current.forEach((test,i) => {
    const old = baseline.find(b=>b.fullName===test.fullName);
    if (!old) throw new Error('Missing historical identity');
    results.push({identity:'TM-'+String(ids[index][i]).padStart(2,'0'),suite,fullName:test.fullName,r1:old.status,r2:test.status,duration_ms:test.duration,first_error:test.failureMessages[0]??null});
  });
}
save('comparison.json', {executed_sha:'92579ebaf576dd3d461acc2d88fb30272e5cbe40',total:results.length,pass:results.filter(r=>r.r2==='passed').length,fail_to_pass:results.filter(r=>r.r1==='failed'&&r.r2==='passed').length,pass_to_fail:results.filter(r=>r.r1==='passed'&&r.r2==='failed').length,cases:results});
// Positions can shift as assertions are added; compare full diagnostic bodies without line/column.
const diagnostics = path => read(path).split(/\r?\n/).filter(l=>/error TS\d+/.test(l)).map(l=>l.replace(/\(\d+,\d+\)(?=: error TS)/,'').replaceAll(repo.replaceAll('\\','/'),'<repo>').replaceAll(repo,'<repo>'));
const oldTS = diagnostics(resolve(r1,'typecheck.log')), newTS=diagnostics(resolve(here,'typecheck.log'));
const subtract=(a,b)=>{const remaining=[...b];return a.filter(v=>{const i=remaining.indexOf(v);if(i<0)return true;remaining.splice(i,1);return false;});};
const normalizeLint = records => records.flatMap(r=>r.messages.map(m=>({file:r.filePath.replaceAll('\\','/').split('/packages/')[1],rule:m.ruleId,severity:m.severity,message:m.message,line:m.line,column:m.column})));
const oldLint = normalizeLint(json(resolve(r1,'lint.json'))), newLint=normalizeLint(json(resolve(here,'eslint-focal.json')));
const focalFiles = new Set(json(resolve(here,'eslint-focal.json')).map(r=>r.filePath.replaceAll('\\','/').split('/packages/')[1]));
const oldFocal=oldLint.filter(m=>focalFiles.has(m.file));
const lintKey=m=>JSON.stringify([m.file,m.rule,m.severity,m.message]);
const oldKeys=oldFocal.map(lintKey),newKeys=newLint.map(lintKey);
save('static-diff.json',{typescript:{r1:oldTS.length,r2:newTS.length,exit_code:json(resolve(here,'typecheck-command.json')).exit_code,added:subtract(newTS,oldTS),removed:subtract(oldTS,newTS),server_remaining:newTS.filter(l=>l.includes('server-canonical-discovery.test.ts'))},eslint:{scope:'five focal files, R1 global JSON filtered to same paths',r1_errors:oldFocal.filter(m=>m.severity===2).length,r1_warnings:oldFocal.filter(m=>m.severity===1).length,r2_errors:newLint.filter(m=>m.severity===2).length,r2_warnings:newLint.filter(m=>m.severity===1).length,added:subtract(newKeys,oldKeys).map(s=>JSON.parse(s)),removed:subtract(oldKeys,newKeys).map(s=>JSON.parse(s)),current_messages:newLint}});
const table=['| Identidad | Caso | R1 | R2 | Duración ms | Primer error |','|---|---|---|---|---:|---|',...results.map(r=>`| ${r.identity} | ${r.fullName.replaceAll('|','\\|')} | ${r.r1} | ${r.r2} | ${r.duration_ms.toFixed(2)} | ${r.first_error??'Ninguno'} |`)];
writeFileSync(resolve(here,'resultados-por-identidad.md'),table.join('\n')+'\n');
