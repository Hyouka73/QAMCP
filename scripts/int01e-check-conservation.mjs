// Bounded source checks, not a build, typecheck, runtime test, or QA certificate.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const D = 'b50453f27470b49a88623c6617cb4d16e49180a8';
const V = 'a3f7ab5a21368142884a5a6dc6f5bc072015e6af';
const normalize = value => value.replaceAll('\r\n', '\n');
const read = path => normalize(readFileSync(resolve(root, path), 'utf8'));
const git = (...args) => normalize(execFileSync('git', args, { cwd: root, encoding: 'utf8' }));
const source = (sha, path) => git('show', `${sha}:${path}`);
const docs = [
  'docs/vnext/014F_R4_R10_ESTABILIZACION_P1.md',
  'docs/vnext/04_BACKLOG_Y_WBS_PRELIMINAR.md',
  'docs/vnext/STATE.md',
  'docs/vnext/auditorias/VNEXT-014-R4-R10/COMANDOS.md',
  'docs/vnext/auditorias/VNEXT-014-R4-R10/INFORME.md',
  'docs/vnext/auditorias/VNEXT-014-R4-R10/SIGUIENTE_BLOQUE_P0.md',
];
for (const path of docs) {
  assert.ok(read(path).includes(source(D, path)), `${path}: complete develop text`);
  assert.ok(read(path).includes(source(V, path)), `${path}: complete vNext text`);
}
const validatorPath = 'packages/shared/src/validator/schema-validator.ts';
const validator = read(validatorPath);
for (const sha of [D, V]) {
  for (const method of source(sha, validatorPath).matchAll(/\b(validate\w+)\(data: unknown\)/g)) {
    assert.ok(validator.includes(method[0]), `preserve ${method[1]}`);
  }
}
assert.ok(validator.includes('private static compiled: ReadonlyMap<string, ValidateFunction> | undefined;'));
assert.ok(validator.indexOf('SchemaValidator.compiled = this.validators;') > validator.indexOf("['flow', ajv.compile(flowSchema)]"));
assert.ok(validator.includes('errors: valid ? [] : translateErrors(validateFn.errors, validateFn.schema),'));
for (const schema of ['tc-case', 'flow']) {
  for (const dir of ['schemas', 'src/schemas']) {
    const path = `packages/shared/${dir}/${schema}.schema.json`;
    assert.equal(read(path), source(D, path), `unchanged develop contract ${path}`);
  }
}
const indexPath = 'packages/knowledge/src/index.ts';
const barrel = read(indexPath);
const exportsOf = text => [...text.matchAll(/export \* from '([^']+)'/g)].map(match => match[1]);
const exports = exportsOf(barrel);
assert.equal(new Set(exports).size, exports.length, 'no duplicate export-star paths');
for (const sha of [D, V]) for (const path of exportsOf(source(sha, indexPath))) {
  assert.ok(exports.includes(path), `preserve barrel path ${path}`);
}
assert.ok(!barrel.includes('flow-impact'), '015-04 not added');
// Lexical check of directly declared named exports. Re-exports/types still require tsc/build.
const declarations = new Map();
for (const path of exports) {
  const text = read(`packages/knowledge/src/${path.replace(/^\.\//, '').replace(/\.js$/, '.ts')}`);
  for (const match of text.matchAll(/^export\s+(?:async\s+)?(?:class|function|interface|type|const|enum)\s+(\w+)/gm)) {
    const prior = declarations.get(match[1]);
    assert.ok(!prior || prior === path, `duplicate named declaration ${match[1]}: ${prior}, ${path}`);
    declarations.set(match[1], path);
  }
}
for (const path of [...docs, validatorPath, indexPath]) {
  assert.ok(!/^(<<<<<<< |=======$|>>>>>>> )/m.test(read(path)), `no conflict markers ${path}`);
}
console.log(JSON.stringify({
  result: 'SOURCE_CHECKS_OK', docsWithBothParentTexts: docs.length,
  conflictFilesWithoutMarkers: 8, uniqueExportPaths: exports.length,
  directlyDeclaredNamesChecked: declarations.size,
  functionalTestsRun: 0, typecheckRun: false, buildRun: false,
  limitation: 'Lexical conservation only. No runtime/semantic compatibility or certification asserted.',
}, null, 2));
