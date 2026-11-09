import {readFileSync,readdirSync,writeFileSync,existsSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {gunzipSync} from 'node:zlib';
const root=dirname(fileURLToPath(import.meta.url));
const quantile=(a,q)=>a.length?[...a].sort((a,b)=>a-b)[Math.min(a.length-1,Math.floor(a.length*q))]:null;
const summarize=a=>({n:a.length,total_ms:a.reduce((x,y)=>x+y,0),p50_ms:quantile(a,.5),p95_ms:quantile(a,.95),max_ms:quantile(a,1)});
const output={};
for(const dir of readdirSync(root).filter(n=>n.endsWith('-stages'))){
 const spans=[],samples=[],pending=[],tests=[];
 for(const file of readdirSync(join(root,dir)).filter(n=>/\.jsonl(?:\.gz)?$/.test(n))){
  let current=null;const open=new Map();
  const bytes=readFileSync(join(root,dir,file));
  for(const line of (file.endsWith('.gz')?gunzipSync(bytes).toString('utf8'):bytes.toString('utf8')).trim().split('\n')){
   const e=JSON.parse(line);
   if(e.event==='test.begin'){current=e.name;tests.push(e);}
   if(e.event==='begin')open.set(e.id,{...e,test:current});
   if(e.event==='end'){const begin=open.get(e.id);spans.push({...e,start_at:begin?.at,test:begin?.test});open.delete(e.id);}
   if(e.event==='sample')samples.push({...e,test:current});
  }
  pending.push(...open.values());
 }
 const stages={};for(const s of spans)(stages[s.stage]??=[]).push(s.ms);
 const perTest={};for(const s of spans){const t=perTest[s.test??'before-test']??={};(t[s.stage]??=[]).push(s.ms);}
 const name=dir.replace(/-stages$/,'');const browsers=new Map();
 if(existsSync(join(root,name+'.log')))for(const line of readFileSync(join(root,name+'.log'),'utf8').split('\n')){
  const timestamp=line.match(/\d{4}-\d\d-\d\dT[\d:.]+Z/)?.[0];const at=Date.parse(timestamp??'');
  const pid=line.match(/(?:\[pid=(\d+)\]|<launched> pid=(\d+))/);if(!pid||!Number.isFinite(at))continue;
  const id=pid[1]??pid[2];const b=browsers.get(id)??{pid:Number(id)};
  if(line.includes('<launched>'))b.launched_at=at;
  if(line.includes('gracefully close start'))b.close_started_at=at;
  if(line.includes('process did exit'))b.process_exited_at=at;
  if(line.includes('finished temporary directories cleanup'))b.profile_removed_at=at;
  browsers.set(id,b);
 }
 output[dir]={stages:Object.fromEntries(Object.entries(stages).map(([k,v])=>[k,summarize(v)])),per_test:Object.fromEntries(Object.entries(perTest).map(([t,s])=>[t,Object.fromEntries(Object.entries(s).map(([k,v])=>[k,summarize(v)]))])),incomplete:pending,lag:summarize(samples.map(s=>s.lag_ms)),max_rss_bytes:Math.max(...samples.map(s=>s.rss)),browsers:[...browsers.values()].map(b=>{
  // Launch windows overlap across workers. Attribute only a unique close span
  // whose start AND end match the PID debug events within 15ms.
  const candidates=spans.filter(s=>s.stage==='browser.close'&&Math.abs(b.close_started_at-s.start_at)<=15&&Math.abs(b.profile_removed_at-s.at)<=15);
  const close=candidates.length===1?candidates[0]:undefined;
  return {...b,test:close?.test,node_pid:close?.pid,correlation_candidates:candidates.length,correlation:'unique close start/end within 15ms; otherwise unassigned',close_to_exit_ms:b.process_exited_at-b.close_started_at,exit_to_profile_removed_ms:b.profile_removed_at-b.process_exited_at};
 }),priority_spans:spans.filter(s=>s.test?.startsWith('Lifecycle')&&/E0a:|E0b:|E1:|Criterio 9:/.test(s.test)&&/^(?:fixture\.|mcp\.|chromium\.|browser\.|context\.|page\.)/.test(s.stage))};
}
writeFileSync(join(root,'stage-summary.json'),JSON.stringify(output,null,2)+'\n');
for(const [n,s]of Object.entries(output))console.log(n,'pending',s.incomplete.length,'lag',s.lag,'stages',s.stages);
