import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../../../../../..');
function clean(value) {
  if (typeof value === 'string') return value
    .replaceAll(repo, '<repo>').replaceAll(repo.replaceAll('\\', '/'), '<repo>')
    .replace(/C:[\\/]Users[\\/][^\\/\r\n]+[\\/]AppData[\\/]Local[\\/](?:Packages[\\/][^\\/]+[\\/]AC[\\/])?Temp[\\/]/gi, '<temp>/')
    .replace(/(?:C:)?[\\/]Users[\\/][^\\/\r\n]+/gi, '<user-home>');
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clean(item)]));
  return value;
}
for (const name of readdirSync(here)) {
  const path = resolve(here, name);
  if (name.endsWith('.json')) writeFileSync(path, JSON.stringify(clean(JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''))), null, 2) + '\n');
  if (name.endsWith('.log')) {
    const value = clean(readFileSync(path, 'utf8')).trimEnd();
    writeFileSync(path, value ? value + '\n' : '');
  }
}
