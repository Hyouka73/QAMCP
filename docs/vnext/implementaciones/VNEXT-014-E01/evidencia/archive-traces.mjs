import { readFileSync, readdirSync, writeFileSync, unlinkSync } from 'node:fs';
import console from 'node:console';
import { gzipSync, gunzipSync } from 'node:zlib';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
let files=0, before=0, after=0;
for(const directory of readdirSync(root).filter(name=>name.endsWith('-stages'))) {
  for(const name of readdirSync(join(root,directory)).filter(name=>name.endsWith('.jsonl'))) {
    const file=resolve(root,directory,name);
    if(!file.startsWith(resolve(root)+sep)) throw new Error('Trace outside evidence directory');
    const raw=readFileSync(file), compressed=gzipSync(raw);
    if(!gunzipSync(compressed).equals(raw)) throw new Error('Archive verification failed');
    writeFileSync(file+'.gz',compressed); unlinkSync(file);
    files++;before+=raw.length;after+=compressed.length;
  }
}
console.log(JSON.stringify({files,uncompressed_bytes:before,compressed_bytes:after}));
