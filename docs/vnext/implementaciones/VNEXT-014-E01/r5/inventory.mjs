import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
const read=n=>JSON.parse(readFileSync(join(root,n),'utf8').replace(/^\uFEFF/,''));
const comparison=read('comparison.json'), runs=['serial','parallel-1','parallel-2','affected-stages','reduced-normal'];
const details={};
for(const name of runs){
 if(!existsSync(join(root,name+'-manifest.json')))continue;
 const report=read(name+'.json'),lines=readFileSync(join(root,name+'.log'),'utf8').split(/\r?\n/);
 const byHeader=new Map(report.testResults.flatMap(f=>f.assertionResults.map(t=>{
  const path=f.name.replaceAll('\\','/').split('/packages/mcp/').at(-1);
  return [`${path} > ${[...t.ancestorTitles,t.title].join(' > ')}`,t.fullName];
 })));
 const messages=new Map();let current;
 for(let i=0;i<lines.length;i++){
  if(lines[i].startsWith(' FAIL  '))current=byHeader.get(lines[i].slice(7).trim());
  else if(current&&/^(Error|AssertionError|TypeError):/.test(lines[i])){
   const list=messages.get(current)??[];list.push({line:i+1,message:lines[i]});messages.set(current,list);current=undefined;
  }
 }
 details[name]=comparison.sources[name].rows.filter(r=>r.status==='failed').map(r=>({...r,diagnostics:messages.get(r.fullName)??[],historical:comparison.sources.serial.rows.find(s=>s.id===r.id)?.status==='failed'}));
}
writeFileSync(join(root,'failure-inventory.json'),JSON.stringify(details,null,2)+'\n');
let md='# E01-R5 — inventario de fallos por identidad\n\nSHA ejecutado: `'+comparison.sources.serial.sha+'`. Los errores completos están en JSON/log; las líneas enlazan a logs locales de la evidencia.\n\n';
const union=new Map();for(const n of ['serial','parallel-1','parallel-2'])for(const r of details[n])union.set(r.id,r);
let h=0,a=0;
md+='| ID | Archivo / fullName íntegro | R1 serial / paralelo | R4 focal | Serial | P1 | P2 | Error observado |\n|---|---|---|---|---|---|---|---|\n';
for(const [id,r]of union){
 const historical=comparison.sources.serial.rows.find(s=>s.id===id).status==='failed';
 const code=historical?'H'+(++h):'A'+(++a);
 const cells=['serial','parallel-1','parallel-2'].map(n=>{const t=comparison.sources[n].rows.find(t=>t.id===id);return `${t.status==='passed'?'PASS':'FAIL'} ${t.duration_ms.toFixed(1)} ms`;});
 const diagnostics=['parallel-1','parallel-2','serial'].flatMap(n=>(details[n].find(t=>t.id===id)?.diagnostics??[]).map(d=>`${n}:${d.line} ${d.message}`));
 const baseline=n=>comparison.sources[n].rows.find(t=>t.id===id)?.status??'no ejecutado';
 md+=`| ${code} | ${r.file}<br>${r.fullName.replaceAll('|','\\|')} | ${baseline('R1-serial')} / ${baseline('R1-parallel')} | ${baseline('R4-focal')} | ${cells.join(' | ')} | ${[...new Set(diagnostics)].join('<br>').replaceAll('|','\\|')} |\n`;
}
md+='\nH = FAIL en serial R5 y heredado de R1; A = PASS serial que falla en al menos una paralela. IDs solo locales a este inventario. No se concluye defecto productivo por cada timeout.\n';
writeFileSync(join(root,'failure-inventory.md'),md);
const host={};
for(const n of ['parallel-1','parallel-2','affected-stages'])if(existsSync(join(root,n+'-host.json'))){
 const rows=read(n+'-host.json');
 const groups=Object.fromEntries(['node','chrome','headless_shell'].map(name=>[name,{max_count:Math.max(...rows.map(r=>r.processes.filter(p=>p.name===name).length)),max_working_set_bytes:Math.max(...rows.map(r=>r.processes.filter(p=>p.name===name).reduce((a,p)=>a+p.working_set_bytes,0)))}]));
 host[n]={samples:rows.length,first:rows[0]?.at,last:rows.at(-1)?.at,min_available_mb:Math.min(...rows.map(r=>r.available_mb)),max_cpu_percent:Math.max(...rows.map(r=>r.cpu_percent)),max_pages_input_per_sec:Math.max(...rows.map(r=>r.pages_input_per_sec)),max_disk_queue:Math.max(...rows.map(r=>r.disk_queue)),max_sample_gap_ms:Math.max(...rows.slice(1).map((r,i)=>Date.parse(r.at)-Date.parse(rows[i].at))),groups};
}
writeFileSync(join(root,'host-summary.json'),JSON.stringify(host,null,2)+'\n');
console.log({historical:h,additional_union:a,host});
for(const[n,d]of Object.entries(details))console.log(n,'fails',d.length,'unmapped',d.filter(r=>!r.diagnostics.length).length,'test timeouts',d.filter(r=>r.diagnostics.some(d=>d.message.includes('Test timed out'))).length,'hook timeouts',d.filter(r=>r.diagnostics.some(d=>d.message.includes('Hook timed out'))).length);
