import { createHash } from 'node:crypto';
import console from 'node:console';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const directory=dirname(fileURLToPath(import.meta.url)),repo=resolve(directory,'../../../../..');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function walk(root) { return readdirSync(root,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(join(root,entry.name)):[join(root,entry.name)]); }
const files=walk(directory).filter(file=>!file.endsWith('evidence-index.json')).map(file=>{
  const path=relative(repo,file).replaceAll('\\','/'),raw=readFileSync(file);
  const staged=execFileSync('git',['show',':'+path],{cwd:repo,maxBuffer:64*1024*1024});
  return {path,raw_sha256:sha(raw),published_sha256:sha(staged),published_bytes:staged.length};
});
writeFileSync(join(directory,'evidence-index.json'),JSON.stringify({reference:'26143382d1262b2ef9cbeb02f8773148e4439ebc',files},null,2)+'\n');
console.log(JSON.stringify({files:files.length,published_bytes:files.reduce((n,f)=>n+f.published_bytes,0)}));
