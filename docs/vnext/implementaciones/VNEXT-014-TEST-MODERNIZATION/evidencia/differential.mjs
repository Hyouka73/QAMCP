import fs from 'node:fs';
import console from 'node:console';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const out = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(out, '../../../../..');
const baseline = '794dc0d2fe1fb85dd1f9fb0c211b9b35346ac747';
const req = createRequire(path.join(repo, 'package.json'));
const ts = req('typescript');
const originals = new Map();
for (const file of ['packages/mcp/src/__tests__/lifecycle-v3-e2e.test.ts', 'packages/mcp/src/__tests__/fixtures/lifecycle-canonical.ts']) {
  try { originals.set(path.resolve(repo, file).toLowerCase(), execFileSync('git', ['show', `${baseline}:${file}`], { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })); }
  catch { originals.set(path.resolve(repo, file).toLowerCase(), undefined); }
}
const configPath = path.join(repo, 'packages/mcp/tsconfig.json');
const config = ts.readConfigFile(configPath, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(configPath), { noEmit: true }, configPath);
function diagnostics(base) {
  const host = ts.createCompilerHost(parsed.options), read = host.readFile.bind(host), exists = host.fileExists.bind(host);
  if (base) {
    host.readFile = p => originals.has(path.resolve(p).toLowerCase()) ? originals.get(path.resolve(p).toLowerCase()) : read(p);
    host.fileExists = p => originals.has(path.resolve(p).toLowerCase()) ? originals.get(path.resolve(p).toLowerCase()) !== undefined : exists(p);
  }
  return ts.getPreEmitDiagnostics(ts.createProgram(parsed.fileNames.filter(f => !base || host.fileExists(f)), parsed.options, host))
    .map(d => ({ file: d.file ? path.relative(repo, d.file.fileName).replaceAll('\\', '/') : null,
      code: d.code, message: ts.flattenDiagnosticMessageText(d.messageText, '\n') }));
}
function difference(a, b) {
  const counts = new Map();
  for (const value of b) { const key = JSON.stringify(value); counts.set(key, (counts.get(key) ?? 0) + 1); }
  return a.filter(value => { const key = JSON.stringify(value), n = counts.get(key) ?? 0;
    if (n) { counts.set(key, n - 1); return false; } return true; });
}
const lint = name => JSON.parse(fs.readFileSync(path.join(out, name), 'utf8')).flatMap(file => file.messages.map(m => ({
  file: path.relative(repo, file.filePath).replaceAll('\\', '/'), rule: m.ruleId, severity: m.severity, message: m.message,
})));
const tb = diagnostics(true), tc = diagnostics(false), lb = lint('baseline-eslint.json'), lc = lint('final-eslint.json');
const result = { baseline, tsc: { baseline: tb.length, current: tc.length, added: difference(tc, tb), removed: difference(tb, tc) },
  eslint: { baseline: lb.length, current: lc.length, added: difference(lc, lb), removed: difference(lb, lc) } };
fs.writeFileSync(path.join(out, 'differential.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
