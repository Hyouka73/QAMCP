import fs from 'node:fs';
import console from 'node:console';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const out = path.dirname(fileURLToPath(import.meta.url));
const doc = path.dirname(out);
const read = name => JSON.parse(fs.readFileSync(path.join(out, name), 'utf8'));
const load = name => fs.existsSync(path.join(out, name)) ? read(name) : undefined;
const flatten = report => report.testResults.flatMap(suite => {
  const ordinals = new Map();
  return suite.assertionResults.map(test => {
    const ordinal = (ordinals.get(test.fullName) ?? 0) + 1;
    ordinals.set(test.fullName, ordinal);
    return { file: suite.name.replaceAll('\\', '/').split('/packages/mcp/')[1], fullName: test.fullName,
      ordinal, status: test.status, duration_ms: test.duration, first_error: test.failureMessages[0] ?? null };
  });
});
const baseline = flatten(read('baseline-serial.json'));
const final = load('final-serial.json');
const focal = load('lote1-cached-validator.json');
const after = final ? flatten(final) : focal ? flatten(focal) : [];
const key = t => JSON.stringify([t.file, t.fullName, t.ordinal]);
const afterMap = new Map(after.map(t => [key(t), t]));
const baselineMap = new Map(baseline.map(t => [key(t), t]));
const parallelRuns = Object.fromEntries(['final-parallel', 'simultaneous-a', 'simultaneous-b'].flatMap(name => {
  const report = load(`${name}.json`);
  return report ? [[name, { report, identities: flatten(report) }]] : [];
}));
const historical = read('../../VNEXT-014-CIERRE-CONTROLADO/evidencia/final-serial.json').identities.filter(t => t.status === 'failed');
if (historical.length !== 55) throw new Error('Expected exactly 55 historical failures');
const oldMatrix = fs.readFileSync(path.join(doc, '../VNEXT-014-CIERRE-CONTROLADO/MATRIZ_63_RESCATE.md'), 'utf8');
const historicalIds = new Map([...oldMatrix.matchAll(/^\| (\d+) \| ([^|]+) \| ([^|]+) \|/gm)]
  .map(m => [JSON.stringify([m[2].trim(), m[3].trim()]), Number(m[1])]));
const lifecycleContracts = [
  ['E0a', 'A+C', 'entrevista_vista + view=default + pregunta/cobertura embebidas',
    'trabajo + canonical_interview.next; pregunta estable recuperada del servicio y digest de cobertura estable',
    'misma identidad E0a', 'Requisito parcial revisado; preguntas pendientes; status no cambia lifecycle, autoridad ni requisitos.'],
  ['E1:', 'A+C', 'DOM genera reglas YAML; consolidated→interviewing e historial automático; waivers de categorías legacy',
    'Discovery solo observa; revisión de especificación cambia revisión/digest y bloquea cierre; aplicabilidad formal exige host',
    'misma identidad E1 + E1 canonical (applicability y revisión obsoleta)',
    'Sin promoción DOM; criterio incompleto bloquea cierre; categoría legacy/razón corta rechazadas; aprobación anterior no autoriza nuevo digest.'],
  ['E2:', 'A+C', 'user_confirmed + consolidated autorizan cierre; terminal rechaza repetición',
    'canonical_closure + gateway + cobertura + recibo durable; terminal devuelve resultado idempotente sin reescribir',
    'misma identidad E2', 'Desconocido, booleano wire insuficiente, precondiciones, razón corta, aprobación pendiente, cierre/waiver, un solo recibo.'],
  ['E3:', 'A+C', 'reporte de brechas legacy y cierre booleano A/B',
    'A closed/B waived autorizados; reporte canónico documental con decisiones; WRAP_UP y nueva sesión preservan historial',
    'misma identidad E3', 'Reopen de autoridad; no ejecución inventada; guardas en WRAP_UP; no reabrir closed por plan; reporte previo inmutable.'],
  ['Criterio 9:', 'A+C', 'Adapter mock + rules.yaml confirmado por source=user y user_confirmed',
    'MCP SDK→onboarding→plan→crawler autorizado→borrador durable→host→cobertura→cierre/waiver→reporte→replan',
    'misma identidad Criterio 9', 'Schema tras cada llamada; propuestas sin requisitos; restart de drafts; SQLite independiente y recibos; aislamiento por aplicación.'],
];
const rows = historical.map((test, index) => {
  const originalId = historicalIds.get(JSON.stringify([test.file, test.fullName]));
  if (!originalId) throw new Error(`Historical identity missing: ${test.fullName}`);
  const current = baselineMap.get(key(test));
  if (!current) throw new Error(`Identity lost in baseline: ${test.fullName}`);
  const lifecycle = test.file.endsWith('lifecycle-v3-e2e.test.ts');
  const contract = lifecycle ? lifecycleContracts.find(c => test.fullName.split('(E0 - E3) ')[1].startsWith(c[0])) : undefined;
  if (lifecycle && !contract) throw new Error('Lifecycle equivalence missing');
  const result = afterMap.get(key(test));
  return { id: `TM-${String(index + 1).padStart(2, '0')}`, historical_id: originalId, ...test,
    baseline_status: current.status, baseline_first_error: current.first_error,
    classification: contract?.[1] ?? 'Pendiente de contraste en su lote; ninguna retirada autorizada por esta fila',
    old_contract: contract?.[2] ?? 'Contrato histórico expresado por el fullName y sus aserciones; fuente intacta en HEAD base',
    current_contract: contract?.[3] ?? 'Pendiente de auditoría focal; aplicar contratos de Discovery/entrevista/cierre sin presumir equivalencia',
    replacement: contract?.[4] ?? 'No sustituida; test original permanece activo',
    preserved_guarantees: contract?.[5] ?? 'Garantía original todavía no certificada; no se altera ni elimina el test',
    physical_result: result?.status ?? 'pendiente',
    parallel_results: Object.fromEntries(Object.entries(parallelRuns).map(([name, run]) => {
      const observed = run.identities.find(t => key(t) === key(test));
      return [name, observed ? { status: observed.status, duration_ms: observed.duration_ms, first_error: observed.first_error } : null];
    })),
    evidence: lifecycle ? 'lote1-cached-validator.json y final-serial.json (si existe)' : 'baseline-serial.json; final-serial.json (si existe)' };
});
fs.writeFileSync(path.join(out, 'matriz-55.json'), JSON.stringify(rows, null, 2) + '\n');
const escape = s => String(s).replaceAll('|', '\\|').replaceAll('\n', ' ');
const md = ['# Matriz de las 55 identidades históricas', '',
  'Base local/remota verificada: `794dc0d2fe1fb85dd1f9fb0c211b9b35346ac747`. Baseline físico: 447 PASS / 55 FAIL / 502. IDs históricos enlazan con MATRIZ_63_RESCATE; TM es un índice nuevo y estable.', '',
  'Esta entrega completa únicamente Lote 1. Las otras 50 identidades permanecen activas y pendientes de contraste por lote; no se presentan hipótesis como decisiones de retiro. A=fixture vigente; C=representación legacy sustituida por garantía canónica. Cero tests eliminados o deshabilitados. Los siete fullNames lifecycle se conservan, aunque sus cuerpos se modernizan.', '',
  '| ID / histórico | Archivo / fullName original | Clase | Contrato antiguo | Contrato vigente | Sustitución / ubicación | Garantías y negativos | Baseline → serial / paralelo predeterminado |',
  '| --- | --- | --- | --- | --- | --- | --- | --- |',
  ...rows.map(t => `| ${t.id} / ${t.historical_id} | ${escape(t.file)} — ${escape(t.fullName)} | ${escape(t.classification)} | ${escape(t.old_contract)} | ${escape(t.current_contract)} | ${escape(t.replacement)} en packages/mcp/${escape(t.file)} | ${escape(t.preserved_guarantees)} | ${t.baseline_status} → ${t.physical_result} / ${t.parallel_results['final-parallel']?.status ?? 'pendiente'} |`), '',
  'Identidades completas, primer error físico y fuente de evidencia en [matriz-55.json](evidencia/matriz-55.json). El antiguo historial automático de E1 se sustituye deliberadamente por ausencia de promoción DOM y reevaluación tras revisión humana: ver CONTRATOS_VIGENTES.md. Las categorías de entrevista no son categorías formales renombradas mecánicamente.', '',
  'Las dos identidades lifecycle antes PASS (E0b/E0c) también se conservan y modernizan; no pertenecen a estas 55. Tres nuevas identidades focales preservan negativos de aplicabilidad, autorización obsoleta y consentimiento Discovery.', ''];
fs.writeFileSync(path.join(doc, 'MATRIZ_55.md'), md.join('\n'));
if (final) {
  const comparison = { baseline: { pass: read('baseline-serial.json').numPassedTests, fail: read('baseline-serial.json').numFailedTests, total: baseline.length },
    current: { pass: final.numPassedTests, fail: final.numFailedTests, total: after.length },
    recovered: baseline.filter(t => t.status === 'failed' && afterMap.get(key(t))?.status === 'passed'),
    regressions: baseline.filter(t => t.status === 'passed' && afterMap.get(key(t))?.status !== 'passed'),
    removed: baseline.filter(t => !afterMap.has(key(t))), added: after.filter(t => !baselineMap.has(key(t))) };
  fs.writeFileSync(path.join(out, 'comparison.json'), JSON.stringify(comparison, null, 2) + '\n');
  const runs = Object.fromEntries(Object.entries(parallelRuns).map(([name, run]) => {
    const extraFailures = run.identities.filter(t => t.status === 'failed' && afterMap.get(key(t))?.status === 'passed');
    const log = fs.readFileSync(path.join(out, `${name}.log`), 'utf8');
    return [name, { pass: run.report.numPassedTests, fail: run.report.numFailedTests, total: run.identities.length,
      pending: run.report.numPendingTests, extra_failures_vs_serial: extraFailures,
      lifecycle: run.identities.filter(t => t.file.endsWith('lifecycle-v3-e2e.test.ts')),
      unhandled_or_hook_error_lines: log.split(/\r?\n/).filter(line => /Unhandled Rejection|Unhandled Error|ECOMPROMISED|Hook timed out/.test(line)) }];
  }));
  fs.writeFileSync(path.join(out, 'parallel-comparison.json'), JSON.stringify(runs, null, 2) + '\n');
}
console.log(JSON.stringify({ historical: rows.length, lifecycle: rows.filter(t => t.file.endsWith('lifecycle-v3-e2e.test.ts')).map(t => [t.id, t.physical_result]), full_run: !!final }));
