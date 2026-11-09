import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import console from 'node:console';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = dirname(fileURLToPath(import.meta.url));
const parse = path => JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
function identities(report) {
  return report.testResults.flatMap(file => {
    const seen = new Map();
    return file.assertionResults.map(test => {
      const path = file.name.replaceAll('\\', '/').split('/packages/mcp/').at(-1);
      const ordinal = (seen.get(test.fullName) ?? 0) + 1; seen.set(test.fullName, ordinal);
      return { id: JSON.stringify([path, test.fullName, ordinal]), file: path, fullName: test.fullName, ordinal,
        status: test.status, duration_ms: test.duration, errors: test.failureMessages };
    });
  });
}
const baseline = identities(parse(join(root, '../../VNEXT-014-TEST-MODERNIZATION/evidencia/final-serial.json')));
const base = new Map(baseline.map(row => [row.id, row]));
const results = {};
for (const name of ['before-focal','before-isolated','before-group','before-group-normal','before-full','after-isolated','after-group','after-full','cache-normal-1','browser-debug','lazy-normal-1','lazy-normal-2','final-parallel-1','final-parallel-2','final-serial','final-stages','final-focal']) {
  if (!existsSync(join(root, name+'.json'))) continue;
  const raw = parse(join(root, name+'.json')), rows = identities(raw), keys = new Set(rows.map(row=>row.id));
  const selectedBaseline = baseline.filter(row => rows.some(current => current.file === row.file));
  const log = readFileSync(join(root, name+'.log'), 'utf8');
  results[name] = {
    pass: rows.filter(r=>r.status==='passed').length, fail: rows.filter(r=>r.status==='failed').length,
    pending: rows.filter(r=>!['passed','failed'].includes(r.status)).length, total: rows.length,
    wall_ms: Math.max(...raw.testResults.map(f=>f.endTime))-Math.min(...raw.testResults.map(f=>f.startTime)),
    preserved_pass: rows.filter(row=>row.status==='passed'&&base.get(row.id)?.status==='passed').length,
    historical_failures: rows.filter(row=>row.status==='failed'&&base.get(row.id)?.status==='failed'),
    extra_failures: rows.filter(row=>row.status==='failed'&&base.get(row.id)?.status!=='failed'),
    recovered: rows.filter(row=>row.status==='passed'&&base.get(row.id)?.status==='failed'),
    added: rows.filter(row=>!base.has(row.id)), removed: selectedBaseline.filter(row=>!keys.has(row.id)),
    lifecycle: rows.filter(r=>r.file.endsWith('/lifecycle-v3-e2e.test.ts')),
    testHandler: rows.filter(r=>r.file.endsWith('/test-handler.test.ts')),
    error_lines: log.split(/\r?\n/).filter(line=>/Hook timed out|Test timed out|Unhandled Rejection|Unhandled Error|ECOMPROMISED|ENOENT|SQLITE_BUSY|closed database/.test(line)),
  };
}
writeFileSync(join(root, 'comparison.json'), JSON.stringify(results, null, 2)+'\n');
for (const [name, r] of Object.entries(results)) console.log(name, `${r.pass}/${r.fail}/${r.total}`, 'extra',r.extra_failures.length,'new',r.added.length,'removed',r.removed.length);
const browserRows = new Map();
for (const line of readFileSync(join(root, 'browser-debug.log'),'utf8').split('\n')) {
  const at = Date.parse(line.slice(0,24)), pid = line.match(/\[pid=(\d+)\]/)?.[1];
  if (!pid || !Number.isFinite(at)) continue;
  const row = browserRows.get(pid) ?? { pid };
  for (const [key, text] of [['close_started','gracefully close start'],['process_exited','process did exit'],['profile_removed','finished temporary directories cleanup']]) if (line.includes(text)) row[key]=at;
  browserRows.set(pid,row);
}
writeFileSync(join(root,'browser-shutdown.json'),JSON.stringify([...browserRows.values()].map(row=>({...row,process_exit_ms:row.process_exited-row.close_started,profile_cleanup_ms:row.profile_removed-row.process_exited})),null,2)+'\n');
const host = {};
for (const name of readdirSync(root).filter(n=>n.endsWith('-host.json'))) {
  const rows = parse(join(root,name));
  host[name]={ samples:rows.length,min_available_mb:Math.min(...rows.map(r=>r.available_mb)),max_cpu_percent:Math.max(...rows.map(r=>r.cpu_percent)),max_pages_input_per_sec:Math.max(...rows.map(r=>r.pages_input_per_sec)),max_disk_queue:Math.max(...rows.map(r=>r.disk_queue)) };
}
writeFileSync(join(root,'host-summary.json'), JSON.stringify(host,null,2)+'\n');
