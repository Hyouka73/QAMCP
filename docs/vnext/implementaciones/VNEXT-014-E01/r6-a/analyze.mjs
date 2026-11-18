import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
const root=dirname(fileURLToPath(import.meta.url));
const read=n=>JSON.parse(readFileSync(join(root,n),'utf8').replace(/^\uFEFF/,''));
const stat=a=>({min:Math.min(...a),max:Math.max(...a),mean:a.reduce((s,v)=>s+v,0)/a.length});
const summaries={};
for(const file of readdirSync(root).filter(n=>/^baseline-\d+\.json$/.test(n))){
 const b=read(file),valid=b.samples.filter(s=>Date.parse(s.finished_at)-Date.parse(s.started_at)<=5000);
 const segments=[];let previous;
 for(const s of valid){if(!previous||Date.parse(s.started_at)-Date.parse(previous.finished_at)>10000)segments.push([]);segments.at(-1).push(s);previous=s;}
 summaries[file]={sha:b.sha,logical_processors:b.logical_processors,physical_memory_bytes:b.physical_memory_bytes,raw_samples:b.samples.length,excluded_long_queries:b.samples.length-valid.length,exclusive_reservation:b.exclusive_reservation,segments:segments.map(rows=>({start:rows[0].started_at,end:rows.at(-1).finished_at,n:rows.length,cpu_percent:stat(rows.map(s=>s.cpu_percent)),available_mb:stat(rows.map(s=>s.available_mb)),committed_bytes:stat(rows.map(s=>s.committed_bytes)),commit_limit_bytes:stat(rows.map(s=>s.commit_limit_bytes)),pages_input_per_sec:stat(rows.map(s=>s.pages_input_per_sec)),disk_queue:stat(rows.map(s=>s.disk_queue)),query_ms:stat(rows.map(s=>Date.parse(s.finished_at)-Date.parse(s.started_at))),start_interval_ms:rows.length>1?stat(rows.slice(1).map((s,i)=>Date.parse(s.started_at)-Date.parse(rows[i].started_at))):null,groups:Object.fromEntries(['node','chromium','observer','other'].map(k=>{const g=rows.map(s=>s.groups.find(g=>g.category===k));return[k,{count:stat(g.map(g=>g.count)),cpu_percent_logical_capacity:stat(g.map(g=>g.cpu_percent_logical_capacity)),working_set_private_bytes:stat(g.map(g=>g.working_set_private_bytes)),page_faults_per_sec:stat(g.map(g=>g.page_faults_per_sec))}]}))}))};
}
writeFileSync(join(root,'capacity-summary.json'),JSON.stringify(summaries,null,2)+'\n');
// Complete R5 identity inventory retained; null means NOT RUN, never PASS/FAIL.
const sources=['serial','parallel-1','parallel-2','reduced-normal'];
const map=new Map(),baseline={};
for(const name of sources){
 const report=read('../r5/'+name+'.json'),manifest=read('../r5/'+name+'-manifest.json');let seen=new Map();
 baseline[name]={sha:manifest.sha,total:report.numTotalTests,pass:report.numPassedTests,fail:report.numFailedTests};
 for(const f of report.testResults)for(const t of f.assertionResults){
  const ordinal=(seen.get(t.fullName)||0)+1;seen.set(t.fullName,ordinal);const id=JSON.stringify([t.fullName,ordinal]);
  if(!map.has(id))map.set(id,{fullName:t.fullName,ordinal,r5:{},r6_a:{status:null,reason:'NOT_RUN_ENVIRONMENTAL_GATE'}});
  map.get(id).r5[name]={status:t.status,duration_ms:t.duration,file:f.name.replaceAll('\\','/').split('/packages/mcp/').at(-1)};
 }
}
writeFileSync(join(root,'identity-register.json'),JSON.stringify({r6_sha:'9974555e8b2c64c5c187a7a21427d8f5b9c0c1b8',r6_executed_suites:0,baseline,comparable_new_results:0,rows:[...map.values()]},null,2)+'\n');
const hashes=readdirSync(root).filter(n=>n!=='evidence-index.json').sort().map(file=>({file,sha256:createHash('sha256').update(readFileSync(join(root,file))).digest('hex')}));
writeFileSync(join(root,'evidence-index.json'),JSON.stringify(hashes,null,2)+'\n');
console.log(JSON.stringify(summaries,null,2));
console.log('R5 identities',map.size,'new results',0);
