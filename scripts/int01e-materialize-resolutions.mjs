// Explicit, reproducible resolutions. Run only in the dedicated merge lab.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const D = 'b50453f27470b49a88623c6617cb4d16e49180a8';
const V = 'a3f7ab5a21368142884a5a6dc6f5bc072015e6af';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).replaceAll('\r\n', '\n');
const write = (path, text) => writeFileSync(resolve(root, path), text, 'utf8');
assert.equal(basename(dirname(root)), 'int01-mvp-lab');
assert.equal(git('rev-parse', 'HEAD').trim(), D);
assert.equal(git('rev-parse', 'MERGE_HEAD').trim(), V);

const indexPath = 'packages/knowledge/src/index.ts';
let index = git('show', `${V}:${indexPath}`);
const duplicate = "export * from './plan/update-guard.js';\n";
assert.equal(index.split(duplicate).length - 1, 2);
index = index.replace(duplicate, '');
index += "\nexport * from './plan/bva-generator.js';\nexport * from './plan/rbac-generator.js';\n";
write(indexPath, index);

const validatorPath = 'packages/shared/src/validator/schema-validator.ts';
let validator = git('show', `${V}:${validatorPath}`);
const imports = '  moduleCandidatesSchema,\n';
assert.equal(validator.split(imports).length - 1, 1);
validator = validator.replace(imports, `${imports}  tcCaseSchema,\n  flowSchema,\n`);
const registration = "      ['module-candidates', ajv.compile(moduleCandidatesSchema)],\n";
assert.equal(validator.split(registration).length - 1, 1);
validator = validator.replace(registration, registration +
  "      ['tc-case', ajv.compile(tcCaseSchema)],\n      ['flow', ajv.compile(flowSchema)],\n");
validator = validator.trimEnd();
assert.ok(validator.endsWith('}'));
validator = validator.slice(0, -1) + `
  validateTcCase(data: unknown): ValidationResult {
    return this.runValidation('tc-case', data);
  }

  validateFlow(data: unknown): ValidationResult {
    return this.runValidation('flow', data);
  }
}\n`;
write(validatorPath, validator);

const docs = [
  'docs/vnext/014F_R4_R10_ESTABILIZACION_P1.md',
  'docs/vnext/04_BACKLOG_Y_WBS_PRELIMINAR.md',
  'docs/vnext/STATE.md',
  'docs/vnext/auditorias/VNEXT-014-R4-R10/COMANDOS.md',
  'docs/vnext/auditorias/VNEXT-014-R4-R10/INFORME.md',
  'docs/vnext/auditorias/VNEXT-014-R4-R10/SIGUIENTE_BLOQUE_P0.md',
];
for (const path of docs) {
  const current = git('show', `${V}:${path}`);
  const historical = git('show', `${D}:${path}`);
  write(path, `<!-- INT-01E: reconciliación documental explícita; laboratorio, 2026-11-09.
Versión principal: vNext ${V}.
Anexo: publicación develop ${D}, conservada íntegra como historia de ese padre.
Las afirmaciones fechadas (incluido «no iniciado») no describen un nuevo estado.
No se certifica QA, no se reabren DONE ni se sustituyen fechas oficiales.
La decisión posterior MVP funcional 16/11 y QA 17–20/11 se registra en el informe
INT-01E como enmienda pendiente de formalización, sin reescribir estas actas.
-->

${current}

---

## Archivo histórico del padre develop — INT-01E

Procedencia exacta: \`${D}:${path}\`. Se conserva la publicación del otro padre
para evitar pérdida de decisiones y resultados. Esta sección es histórica,
no una nueva certificación ni sustitución del texto principal de vNext.

<!-- BEGIN DEVELOP HISTORICAL TEXT -->
${historical}
<!-- END DEVELOP HISTORICAL TEXT -->
`);
}
console.log('Resolved 2 productive conflicts by explicit union and 6 documentary conflicts with provenance.');
