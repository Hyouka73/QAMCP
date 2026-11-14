// Bounded SOURCE checks only. Never imports product code, runs suites, or opens sessions.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const original = '47f17ceafc2f76d5a41fd714cd0c071dbdcb8d72';
const update = '4d2b5ee81d7bf86425950db73a4a980d6e934ef0';
const vnext = 'dda870e4695a8a27db07ea32b81c1efbbf6ba39e';
const conflicts = [
  'packages/knowledge/src/index.ts', 'packages/shared/src/validator/schema-validator.ts',
  'docs/vnext/014F_R4_R10_ESTABILIZACION_P1.md', 'docs/vnext/04_BACKLOG_Y_WBS_PRELIMINAR.md',
  'docs/vnext/STATE.md', 'docs/vnext/auditorias/VNEXT-014-R4-R10/COMANDOS.md',
  'docs/vnext/auditorias/VNEXT-014-R4-R10/INFORME.md', 'docs/vnext/auditorias/VNEXT-014-R4-R10/SIGUIENTE_BLOQUE_P0.md',
];
const files = [
  'packages/cli/src/commands.ts', 'packages/cli/src/commands/prune.ts',
  'packages/cli/src/__tests__/prune-safety-integration.test.ts',
  'packages/reporter/src/persistence/sqlite-client.ts', 'packages/reporter/src/pruning/pruning-engine.ts',
  'packages/reporter/src/__tests__/quota-plan.test.ts', 'packages/reporter/src/__tests__/sqlite-audit-mode.test.ts',
  'packages/knowledge/src/plan/bva-generator.ts', 'packages/knowledge/src/plan/rbac-generator.ts',
  'packages/knowledge/src/__tests__/generator-oracle-safety.test.ts',
  'packages/playwright-runner/src/runner.ts', 'packages/playwright-runner/src/case-execution-policy.ts',
  'packages/playwright-runner/src/__tests__/case-execution-policy.test.ts',
  'packages/playwright-runner/src/__tests__/runner-capability-blocks.test.ts',
];
git('merge-base', '--is-ancestor', original, 'HEAD');
git('merge-base', '--is-ancestor', vnext, 'HEAD');
assert.equal(git('show', '-s', '--format=%P', update), `${original} ${vnext}`);
git('diff', '--exit-code', original, 'HEAD', '--', ...conflicts);
const originalTests = ['packages/shared/src/__tests__/schema-validator-integration.test.ts', 'packages/knowledge/src/__tests__/public-exports-integration.test.ts'];
git('diff', '--exit-code', original, 'HEAD', '--', ...originalTests);
git('diff', '--exit-code', 'HEAD', '--', ...conflicts, ...files, ...originalTests);
git('diff', '--exit-code', vnext, 'HEAD', '--', 'docs/vnext/implementaciones/VNEXT-014-E01/r7');
assert.equal(git('ls-files', '-u'), '');
assert.equal(spawnSync('git', ['symbolic-ref', '-q', 'HEAD'], { cwd: root }).status, 1);
const preserved015 = ['0b8d8c78b2e76be170cc399ece8d063db3d3c501', '7149c030eb814e759bc824b1106c8bf3d77e1d11'];
for (const sha of preserved015) {
  assert.equal(git('cat-file', '-t', sha), 'commit');
  assert.equal(spawnSync('git', ['merge-base', '--is-ancestor', sha, 'HEAD'], { cwd: root }).status, 1);
}
git('diff', '--check', update, 'HEAD', '--', ...files);
const hashes = files.map(file => {
  execFileSync(process.execPath, ['--check', resolve(root, file)], { cwd: root });
  return { file, sha256: createHash('sha256').update(readFileSync(resolve(root, file))).digest('hex') };
});
const conservation = JSON.parse(execFileSync(process.execPath, ['scripts/int01e-check-conservation.mjs'], { cwd: root, encoding: 'utf8' }));
const result = {
  checkedAt: new Date().toISOString(), sourceCommit: git('rev-parse', 'HEAD'),
  original, update, vnext, originalConflictsUnchanged: 8, r7DeltaUnmodified: true,
  detached: true, preserved015NotIncluded: preserved015,
  syntax: { result: 'SYNTAX_OK', node: process.version, files: hashes }, conservation,
  declaredPreparedTests: { inherited: 17, additional: 34, total: 51, discoveredByVitest: false },
  functionalTestsExecuted: 0, buildsExecuted: 0, typecheckExecuted: false, lintExecuted: false, E01Executed: false,
  executionStatus: 'BLOCKED_ENVIRONMENT: user confirms Gemini active on shared host; suites NOT EXECUTED',
  certification: 'NO-GO; source preparation only',
};
const json = JSON.stringify(result, null, 2) + '\n';
if (process.argv.includes('--write')) {
  const output = resolve(root, 'docs/vnext/integracion/evidencia/2026-11-09/INT-03_COMPROBACIONES_FUENTE.json');
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, json);
}
process.stdout.write(json);
