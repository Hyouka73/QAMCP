import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import console from 'node:console';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
const root = dirname(fileURLToPath(import.meta.url));
const report = {};
for (const directory of readdirSync(root).filter(name => name.endsWith('-stages'))) {
  const stages = {}, pending = [], samples = [], tests = [];
  for (const file of readdirSync(join(root, directory))) {
    const open = new Map();
    const bytes = readFileSync(join(root, directory, file));
    const contents = file.endsWith('.gz') ? gunzipSync(bytes).toString('utf8') : bytes.toString('utf8');
    for (const line of contents.trim().split('\n')) {
      const event = JSON.parse(line);
      if (event.event === 'begin') open.set(event.id, event);
      if (event.event === 'end') {
        open.delete(event.id);
        const stage = stages[event.stage] ??= { count: 0, total_ms: 0, process_cpu_ms: 0, durations_ms: [], errors: 0 };
        stage.count++; stage.total_ms += event.ms; stage.process_cpu_ms += event.cpu_ms;
        stage.durations_ms.push(event.ms); if (event.error) stage.errors++;
      }
      if (event.event === 'sample') samples.push(event);
      if (event.event.startsWith('test.')) tests.push(event);
    }
    pending.push(...open.values());
  }
  for (const stage of Object.values(stages)) {
    const times = stage.durations_ms.sort((a,b) => a-b);
    stage.p50_ms = times[Math.floor(times.length * .5)]; stage.p95_ms = times[Math.min(times.length-1, Math.floor(times.length*.95))]; stage.max_ms = times.at(-1);
    delete stage.durations_ms;
  }
  report[directory] = { stages, incomplete_spans: pending, sample_count: samples.length, max_event_loop_lag_ms: Math.max(...samples.map(s=>s.lag_ms)), tests };
}
writeFileSync(join(root, 'stage-summary.json'), JSON.stringify(report, null, 2)+'\n');
for (const [name, run] of Object.entries(report)) console.log(name, JSON.stringify(Object.fromEntries(Object.entries(run.stages).filter(([k])=>['schema.compile','schema.validate','chromium.launch','browser.newContext','context.newPage','browser.close','lock.acquire','sqlite.exec','crawler.run','runner.execute'].includes(k)).map(([k,v])=>[k,{n:v.count,total:Math.round(v.total_ms),max:Math.round(v.max_ms)}]))), 'pending', run.incomplete_spans.length);
