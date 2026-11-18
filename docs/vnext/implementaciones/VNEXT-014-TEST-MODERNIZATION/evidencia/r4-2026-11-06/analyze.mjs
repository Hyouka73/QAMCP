import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../../../../../..');
const read = path => readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
const json = path => JSON.parse(read(path));
const save = (name, value) => writeFileSync(resolve(here, name), JSON.stringify(value, null, 2) + '\n');
const manifest = json(resolve(here, 'manifest.json'));
const sha = manifest[0].sha;
const previous = json(resolve(here, '../r3-2026-11-06/all-cases.json'));
const identities = json(resolve(here, '../matriz-55.json'));
const cases = [], suites = [];
for (const command of manifest.filter(item => !['typecheck', 'eslint-focal', 'build'].includes(item.name))) {
  const data = json(resolve(here, command.name + '.json'));
  const tests = data.testResults.flatMap(file => file.assertionResults);
  for (const test of tests) {
    const prior = previous.find(item => item.fullName === test.fullName);
    cases.push({ id: identities.find(item => item.fullName === test.fullName)?.id ?? null,
      suite: command.name, fullName: test.fullName, r3: prior?.status ?? 'not_executed', r4: test.status,
      duration_ms: test.duration, failureMessages: test.failureMessages, sha });
  }
  suites.push({ suite: command.name, pass: tests.filter(t => t.status === 'passed').length,
    fail: tests.filter(t => t.status === 'failed').length,
    skip_todo: tests.filter(t => ['pending', 'skipped', 'todo'].includes(t.status)).length,
    exit_code: command.exit_code, elapsed_ms: command.elapsed_ms });
}
save('all-cases.json', cases);
save('suite-summary.json', suites);
save('comparison.json', { sha, total: cases.length, pass: cases.filter(t => t.r4 === 'passed').length,
  fail: cases.filter(t => t.r4 === 'failed').length,
  skip_todo: cases.filter(t => ['pending', 'skipped', 'todo'].includes(t.r4)).length,
  added: cases.filter(t => t.r3 === 'not_executed').map(t => t.fullName),
  missing: previous.filter(t => !cases.some(c => c.fullName === t.fullName)).map(t => t.fullName),
  changed: cases.filter(t => t.r3 !== t.r4),
  persistent_fail: cases.filter(t => t.r3 === 'failed' && t.r4 === 'failed').map(t => t.id),
  historical_55: { executed: cases.filter(t => t.id).length, not_executed: identities.filter(t => !cases.some(c => c.id === t.id)).map(t => t.id) } });
const subtract = (a, b) => { const remaining = [...b]; return a.filter(value => {
  const index = remaining.indexOf(value); if (index < 0) return true; remaining.splice(index, 1); return false;
}); };
const diagnostics = path => read(path).split(/\r?\n/).filter(line => /error TS\d+/.test(line))
  .map(line => line.replaceAll(repo, '<repo>').replaceAll(repo.replaceAll('\\', '/'), '<repo>')
    .replace(/\(\d+,\d+\)(?=: error TS)/, ''));
const oldTS = diagnostics(resolve(here, '../r3-2026-11-06/typecheck.log'));
const baseTS = diagnostics(resolve(here, '../r2-2026-11-06/typecheck.log'));
const newTS = diagnostics(resolve(here, 'typecheck.log'));
const lint = path => json(path).flatMap(file => file.messages.map(message => JSON.stringify([
  file.filePath.replaceAll('\\', '/').split('/packages/')[1], message.ruleId, message.severity, message.message,
])));
const oldLint = lint(resolve(here, '../r3-2026-11-06/eslint-focal.json'));
const newLint = lint(resolve(here, 'eslint-focal.json'));
save('static-diff.json', { typescript: { r3: oldTS.length, r4: newTS.length, inherited_r2: baseTS.length,
  added_vs_r3: subtract(newTS, oldTS), removed_vs_r3: subtract(oldTS, newTS),
  added_vs_r2: subtract(newTS, baseTS), removed_vs_r2: subtract(baseTS, newTS) },
eslint: { errors: newLint.filter(t => JSON.parse(t)[2] === 2).length,
  warnings: newLint.filter(t => JSON.parse(t)[2] === 1).length,
  added: subtract(newLint, oldLint).map(t => JSON.parse(t)),
  removed: subtract(oldLint, newLint).map(t => JSON.parse(t)), messages: newLint.map(t => JSON.parse(t)) } });
writeFileSync(resolve(here, 'all-cases.md'), ['# Casos físicos R4', '', '| ID | Suite | FullName | R3 | R4 | ms |',
  '|---|---|---|---|---|---:|', ...cases.map(t => `| ${t.id ?? 'fuera de 55'} | ${t.suite} | ${t.fullName.replaceAll('|', '\\|')} | ${t.r3} | ${t.r4} | ${t.duration_ms} |`)].join('\n') + '\n');
