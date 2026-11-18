import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const root=dirname(fileURLToPath(import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8').replace(/^\uFEFF/,''));
function cases(report){
  const seen=new Map();
  return report.testResults.flatMap(f=>f.assertionResults.map(t=>{
    const ordinal=(seen.get(t.fullName)??0)+1;seen.set(t.fullName,ordinal);
    return {id:JSON.stringify([t.fullName,ordinal]),fullName:t.fullName,ordinal,file:f.name.replaceAll('\\','/').split('/packages/mcp/').at(-1),status:t.status,duration_ms:t.duration,errors:t.failureMessages};
  }));
}
const historical=join(root,'../../VNEXT-014-TEST-MODERNIZATION/evidencia');
const sources={
  'R1-serial':{sha:'8de5a2260bf7c936bbc2c12c81675dd0f6270a36',rows:cases(read(join(historical,'r1-2026-11-06/serial.json')))},
  'R1-parallel':{sha:'8de5a2260bf7c936bbc2c12c81675dd0f6270a36',rows:cases(read(join(historical,'r1-2026-11-06/parallel.json')))},
  'R4-focal':{sha:'2dc2f5800f64e2a08fd11c88608a4f6beddcf635',rows:read(join(historical,'r4-2026-11-06/all-cases.json'))},
};
// R4's normalized evidence uses a different row format; derive from original reporters.
sources['R4-focal'].rows=['p3-canonical-discovery','p4-2-canonical-contract','p4-5a-canonical-integrity','p4-5a2-canonical-integrity','server-canonical-discovery','server-canonical-operations','server','plan-handler','test-handler'].flatMap(n=>cases(read(join(historical,'r4-2026-11-06',n+'.json'))));
for(const n of ['serial','parallel-1','parallel-2','focal-normal','focal-stages','affected-stages','reduced-normal'])if(existsSync(join(root,n+'.json'))){
  const manifest=read(join(root,n+'-manifest.json'));
  sources[n]={sha:manifest.sha,manifest,rows:cases(read(join(root,n+'.json')))};
}
const compare=(a,b)=>{
  const am=new Map(a.map(r=>[r.id,r])),bm=new Map(b.map(r=>[r.id,r]));
  return {added:b.filter(r=>!am.has(r.id)),removed:a.filter(r=>!bm.has(r.id)),changes:b.filter(r=>am.has(r.id)&&am.get(r.id).status!==r.status).map(r=>({before:am.get(r.id),after:r})),moves:b.filter(r=>am.has(r.id)&&am.get(r.id).file!==r.file).map(r=>({fullName:r.fullName,from:am.get(r.id).file,to:r.file}))};
};
const output={sources:{},comparisons:{}};
for(const [name,s] of Object.entries(sources)){
 output.sources[name]={...s,counts:{total:s.rows.length,pass:s.rows.filter(r=>r.status==='passed').length,fail:s.rows.filter(r=>r.status==='failed').length,other:s.rows.filter(r=>!['passed','failed'].includes(r.status)).length}};
 if(['serial','parallel-1','parallel-2'].includes(name))for(const base of ['R1-serial','R1-parallel','R4-focal','serial'])if(sources[base]&&base!==name){
  const br=sources[base].rows;
  const selected=base==='R4-focal'?s.rows.filter(r=>br.some(b=>b.id===r.id)):s.rows;
  output.comparisons[base+' -> '+name]=compare(br,selected);
 }
}
writeFileSync(join(root,'comparison.json'),JSON.stringify(output,null,2)+'\n');
for(const [n,s]of Object.entries(output.sources))console.log(n,s.sha,s.counts);
for(const [n,c]of Object.entries(output.comparisons))console.log(n,'added',c.added.length,'removed',c.removed.length,'changed',c.changes.length,'moved',c.moves.length);
