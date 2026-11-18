import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
// Equivalent package build scripts for preinstalled dependencies when pnpm's wrapper attempts reinstallation.
const require = createRequire(import.meta.url), tsup = require.resolve('tsup/dist/cli-default.js');
for (const name of ['shared','engine','auth','git-adapter','knowledge','playwright-adapter','reporter','playwright-runner','mcp','cli']) {
  const cwd = resolve('packages',name), script = JSON.parse(readFileSync(resolve(cwd,'package.json'),'utf8')).scripts.build;
  if (!/^tsup(?: |$)/.test(script)) throw new Error('Unsupported package build script: ' + name);
  console.log('BUILD ' + name);
  const result = spawnSync(process.execPath,[tsup,...script.slice(4).trim().split(/ +/).filter(Boolean)],{cwd,stdio:'inherit',windowsHide:true});
  if (result.status !== 0) process.exit(result.status ?? 1);
}
