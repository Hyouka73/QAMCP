import {readdirSync,readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {dirname,join,resolve,sep,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const root=dirname(fileURLToPath(import.meta.url)),repo=resolve(root,'../../../../..');
const clean=value=>typeof value==='string'?value.replaceAll(repo,'<repo>').replaceAll(repo.replaceAll('\\','/'),'<repo>').replace(/C:[\\/]Users[\\/][^\\/\r\n]+[\\/]AppData[\\/]Local[\\/]Temp[\\/]/gi,'<temp>/').replace(/(?:C:)?[\\/]Users[\\/][^\\/\r\n]+/gi,'<user-home>'):Array.isArray(value)?value.map(clean):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,clean(v)])):value;
function files(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(join(dir,e.name)):[join(dir,e.name)]);}
for(const p of files(root)){
 if(!resolve(p).startsWith(resolve(root)+sep))throw new Error('Outside evidence directory');
 if(p.endsWith('evidence-index.json'))continue;
 if(p.endsWith('.json'))writeFileSync(p,JSON.stringify(clean(JSON.parse(readFileSync(p,'utf8').replace(/^\uFEFF/,''))),null,2)+'\n');
 if(p.endsWith('.log'))writeFileSync(p,clean(readFileSync(p,'utf8')).replaceAll('\r\n','\n').trimEnd()+'\n');
 if(p.endsWith('.jsonl')){
  const raw=readFileSync(p),packed=gzipSync(raw,{level:9});
  if(!gunzipSync(packed).equals(raw))throw new Error('Compression verification failed');
  writeFileSync(p+'.gz',packed);unlinkSync(p);
 }
}
const digest=b=>createHash('sha256').update(b).digest('hex');
const index=files(root).filter(p=>!p.endsWith('evidence-index.json')).map(p=>{
 const b=readFileSync(p);return {file:relative(root,p).replaceAll('\\','/'),bytes:b.length,sha256:digest(b),...(p.endsWith('.jsonl.gz')?{uncompressed_bytes:gunzipSync(b).length,uncompressed_sha256:digest(gunzipSync(b))}:{})};
});
writeFileSync(join(root,'evidence-index.json'),JSON.stringify(index,null,2)+'\n');
console.log('Indexed',index.length,'files; bytes',index.reduce((a,f)=>a+f.bytes,0));
