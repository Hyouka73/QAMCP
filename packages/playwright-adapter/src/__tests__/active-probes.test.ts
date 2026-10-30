import { createSocket } from 'node:dgram';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { validateApplicationObservation } from '@qap/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SqliteKnowledgeAdapter } from '../../../knowledge/dist/index.js';
import { ActiveObservationProbe } from '../probes/service.js';
import type { ActiveProbeInput } from '../probes/types.js';

const servers: Server[] = [], stores: SqliteKnowledgeAdapter[] = [], directories: string[] = [];
const canary = 'CANARY_PROBE_203fa_PRIVATE';
const timestamp = '2026-10-30T12:00:00.000Z';
const trace = { source: 'synthetic', recorded_by: 'test', recorded_at: timestamp,
  reason: 'Synthetic probe fixture', review: 'unreviewed' as const, evidence_refs: [] };
afterEach(async () => {
  vi.restoreAllMocks();
  for (const server of servers.splice(0)) {
    server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve()));
  }
  stores.splice(0).forEach(store => store.close());
  directories.splice(0).forEach(path => rmSync(path, { recursive: true, force: true }));
});
async function fixture(html = '<form><input required><button>Validate</button></form>', script = '') {
  const hits: string[] = []; let loads = 0;
  const server = createServer((req, res) => {
    hits.push(`${req.method} ${req.url}`);
    res.setHeader('Content-Type', req.url === '/app.js' ? 'application/javascript' : 'text/html');
    if (req.url === '/') { loads++; res.end(html + '<script src="/app.js"></script>'); }
    else if (req.url === '/app.js') res.end(script.replaceAll('TRIAL_NUMBER', String(loads)));
    else if (req.url !== '/pending') res.end('');
  });
  servers.push(server); await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  const directory = mkdtempSync(join(tmpdir(), 'qap-probe-')); directories.push(directory);
  const path = join(directory, 'synthetic.sqlite');
  const store = new SqliteKnowledgeAdapter(path); stores.push(store);
  const input: ActiveProbeInput = { application_id: 'probe-a', environment: { application_id: 'probe-a',
    environment_id: 'local', name: 'synthetic', base_url: origin, is_production: false,
    destructive_actions_allowed: false, safe_domains: ['127.0.0.1'] }, target_url: origin + '/',
    isolation: 'fresh_anonymous_disposable', probe: 'native_empty_validation', authorization: {
      read_only_acknowledged: true, nonproduction_disposable_acknowledged: true, empty_validation_only: true,
      form_selector: 'form', navigation_urls: [origin + '/'], script_urls: [origin + '/app.js'],
      presentation_urls: [], api_read_urls: [], allowed_ips: ['127.0.0.1'] }, acquisition_limits: { settle_ms: 50 } };
  await store.commit('probe-a', [
    { kind: 'application', entity: { application_id: 'probe-a', name: 'Synthetic', base_url: origin, created_at: timestamp }, expected_revision: 0, trace },
    { kind: 'environment', entity: input.environment, expected_revision: 0, trace },
  ]);
  return { input, store, origin, directory, path, hits, server,
    probe: new ActiveObservationProbe(store, { browser: { channel: 'chrome' } }) };
}

describe('VNEXT-010 real Chrome + physical SQLite', () => {
  it('executes native HTML5 validation in independent contexts and persists only empirical observations', async () => {
    const f = await fixture(); const result = await f.probe.run(f.input);
    expect(result.status).toBe('consistent'); expect(result.persistence).toBe('committed');
    expect(new Set(result.trials.map(t => t.session_id)).size).toBe(2);
    expect(result.trials.every(t => t.status === 'executed')).toBe(true);
    expect(result.trials[0].output).toMatchObject({ native_return: false, validation_events: 1,
      before: { valid: false, invalid_controls: 1 }, after: { valid: false, invalid_controls: 1 } });
    expect(f.hits).toEqual(['GET /', 'GET /app.js', 'GET /', 'GET /app.js']);
    expect(result.observations.every(o => validateApplicationObservation(o).valid && o.observed_by === 'active_probe')).toBe(true);
    const reopened = new SqliteKnowledgeAdapter(f.path);
    try {
      for (const o of result.observations) {
        const saved = await reopened.get('probe-a', 'observation', o.id, 1);
        expect(saved?.entity).toEqual(o);
        expect(saved?.references).toContainEqual({ kind: 'evidence', id: o.evidence.id, revision: 1 });
        expect((await reopened.history('probe-a', 'observation', o.id)).items).toHaveLength(1);
        expect(await reopened.get('other-app', 'observation', o.id)).toBeNull();
      }
      for (const kind of ['inference', 'requirement', 'assessment'] as const) expect((await reopened.query('probe-a', kind)).items).toHaveLength(0);
    } finally { reopened.close(); }
  }, 20000);

  it.each(['native_empty_validation', 'protected_empty_submit'] as const)('executes %s with actual JavaScript DOM validation changes and private messages', async probe => {
    const f = await fixture(`<form data-private="${canary}"><input required pattern="${canary}"><div></div><button>Validate</button></form>`, `
      document.querySelector('input').addEventListener('invalid',e=>{
        e.target.setCustomValidity('${canary}'); e.target.setAttribute('aria-invalid','true');
        document.querySelector('div').setAttribute('role','alert'); console.log('${canary}');
      });`);
    f.input.probe = probe;
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const result = await f.probe.run(f.input);
    expect(result.status).toBe('consistent'); expect(result.trials[0].output?.validation_events).toBe(1);
    expect(result.trials[0].output?.after.error_indicators).toBe(2);
    expect(result.trials[0].output?.dom_changes).toBeGreaterThan(0);
    expect(result.persistence).toBe('committed');
    expect(JSON.stringify([result, log.mock.calls, error.mock.calls])).not.toContain(canary);
    for (const name of readdirSync(f.directory)) expect(readFileSync(join(f.directory, name)).includes(Buffer.from(canary))).toBe(false);
  }, 20000);

  it('blocks all action egress including authorized GET, POST, DELETE, external/private, WS, STUN, popup, frame and download', async () => {
    const sink = await fixture(); let upgrades = 0;
    sink.server.on('upgrade', (_req, socket) => { upgrades++; socket.destroy(); });
    const udp = createSocket('udp4'); let datagrams = 0;
    udp.on('message', () => datagrams++);
    await new Promise<void>(resolve => udp.bind(0, '127.0.0.1', resolve));
    try {
      const f = await fixture(undefined, `document.querySelector('input').addEventListener('invalid',()=>{
        for(const method of ['GET','POST','DELETE']) fetch('${sink.origin}/mutation',{method}).catch(()=>{});
        fetch('/app.js').catch(()=>{});
        fetch('http://10.0.0.7/private').catch(()=>{});fetch('https://external.invalid/').catch(()=>{});
        new WebSocket('${sink.origin.replace('http:', 'ws:')}/ws');
        const pc=new RTCPeerConnection({iceServers:[{urls:'stun:127.0.0.1:${udp.address().port}'}]});
        pc.createDataChannel('egress'); pc.createOffer().then(o=>pc.setLocalDescription(o)).catch(()=>{});
        window.open('${sink.origin}/popup');
        const frame=document.createElement('iframe');frame.src='${sink.origin}/frame';document.body.append(frame);
        const a=document.createElement('a');a.href='${sink.origin}/download';a.target='_blank';a.download='file';a.click();
        localStorage.setItem('private','${canary}');sessionStorage.setItem('private','${canary}');
        document.querySelector('input').setAttribute('aria-invalid','true');
      });`);
      f.input.limits = { action_window_ms: 500 }; f.input.probe = 'protected_empty_submit';
      const result = await f.probe.run(f.input);
      expect(result.status).toBe('consistent');
      expect(result.trials[0].output?.after.error_indicators).toBe(1);
      expect(f.hits).toEqual(['GET /', 'GET /app.js', 'GET /', 'GET /app.js']);
      expect(sink.hits).toHaveLength(0); expect(upgrades).toBe(0); expect(datagrams).toBe(0);
      expect(JSON.stringify(result)).not.toContain(canary);
    } finally { udp.close(); }
  }, 25000);

  it('observes a real JavaScript submit handler while blocking its GET and POST attempts', async () => {
    const f = await fixture('<form novalidate><input required><button>Validate</button></form>', `
      document.querySelector('form').addEventListener('submit',e=>{
        e.target.setAttribute('aria-invalid','true');document.querySelector('input').setAttribute('aria-invalid','true');
        fetch('/app.js').catch(()=>{});fetch('/mutation',{method:'POST'}).catch(()=>{});
      });`);
    const result = await f.probe.run({ ...f.input, probe: 'protected_empty_submit' });
    expect(result.status).toBe('consistent');
    expect(result.trials[0].output).toMatchObject({ validation_events: 0, submit_events: 1,
      before: { valid: false, no_validate: true, form_aria_invalid: false }, after: { form_aria_invalid: true } });
    expect(f.hits).toEqual(['GET /', 'GET /app.js', 'GET /', 'GET /app.js']);
  }, 20000);

  it('does not claim submit execution when an original application sandbox suppresses validation', async () => {
    const f = await fixture();
    f.server.prependListener('request', (_req, res) => res.setHeader('Content-Security-Policy', 'sandbox allow-scripts allow-same-origin'));
    const result = await f.probe.run({ ...f.input, probe: 'protected_empty_submit' });
    expect(result.status).toBe('indeterminate'); expect(result.observations).toHaveLength(0);
    expect(result.trials[0].reason).toBe('VALIDATION_INTERACTION_NOT_OBSERVED');
  }, 15000);

  it('does not fabricate completed evidence when a hostile navigation destroys the action context', async () => {
    const sink = await fixture();
    const f = await fixture(undefined, `document.querySelector('input').addEventListener('invalid',()=>{
      location.href='${sink.origin}/redirect'; });`);
    const result = await f.probe.run({ ...f.input, probe: 'protected_empty_submit', limits: { trial_timeout_ms: 3000 } });
    expect(result.status).toBe('indeterminate'); expect(result.observations).toHaveLength(0);
    expect(result.trials).toHaveLength(1); expect(sink.hits).toHaveLength(0);
  }, 15000);

  it('abstains if acquisition has a pending transport at the phase boundary', async () => {
    const f = await fixture(undefined, `const link=document.createElement('link');link.rel='stylesheet';link.href='/pending';document.head.append(link);`);
    f.input.authorization.presentation_urls = [f.origin + '/pending'];
    f.input.acquisition_limits = { settle_ms: 50, request_timeout_ms: 700, total_timeout_ms: 3000 };
    const result = await f.probe.run(f.input);
    expect(f.hits).toContain('GET /pending'); expect(result.trials).toHaveLength(1);
    expect(result.status).toBe('indeterminate'); expect(result.observations).toHaveLength(0);
  }, 15000);

  it.each([
    ['<form><input><button>Send</button></form>', 'VALID_FORM_SUBMIT_REFUSED'],
    ['<form><input required value="' + canary + '"></form>', 'NONEMPTY_OR_SENSITIVE_FORM'],
    ['<form><input type="hidden" value="' + canary + '"><input required></form>', 'NONEMPTY_OR_SENSITIVE_FORM'],
    ['<form><input type="password" required></form>', 'NONEMPTY_OR_SENSITIVE_FORM'],
    ['<form hidden><input required></form>', 'TARGET_UNAVAILABLE'],
    ['<form><input required></form><form><input required></form>', 'TARGET_NOT_UNIQUE'],
    ['<iframe srcdoc="<form></form>"></iframe>', 'TARGET_NOT_UNIQUE'],
    ['<form id="f"><input required></form><input form="f">', 'UNSUPPORTED_CONTROL_CONTEXT'],
  ])('abstains from unsafe/ambiguous target, fixture %#', async (html, reason) => {
    const f = await fixture(html); f.input.probe = 'protected_empty_submit';
    const result = await f.probe.run(f.input);
    expect(result.status).toBe('blocked'); expect(result.trials[0].reason).toBe(reason);
    expect(result.observations).toHaveLength(0); expect(result.persistence).toBe('not_attempted');
    expect(JSON.stringify(result)).not.toContain(canary);
    expect(f.hits.every(h => h === 'GET /' || h === 'GET /app.js')).toBe(true);
    for (const name of readdirSync(f.directory)) expect(readFileSync(join(f.directory, name)).includes(Buffer.from(canary))).toBe(false);
  }, 15000);

  it('does not falsely certify differing structures or a single trial', async () => {
    const f = await fixture(undefined, `if(TRIAL_NUMBER % 2 === 0) document.querySelector('input').setAttribute('aria-invalid','true');`);
    const result = await f.probe.run(f.input); expect(result.status).toBe('inconsistent');
    expect(result.observations.every(o => o.probe_execution?.reproducible === false)).toBe(true);
    f.input.limits = { trials: 1 }; const single = await f.probe.run(f.input);
    expect(single.status).toBe('indeterminate'); expect(single.observations[0].probe_execution?.trials_count).toBe(1);
  }, 25000);

  it('isolates storage between trials and executions', async () => {
    const f = await fixture(undefined, `if(localStorage.getItem('canary')||sessionStorage.getItem('canary')) document.querySelector('input').required=false;
      document.querySelector('input').addEventListener('invalid',()=>{localStorage.setItem('canary','${canary}');sessionStorage.setItem('canary','${canary}');});`);
    expect((await f.probe.run(f.input)).status).toBe('consistent');
    expect((await f.probe.run(f.input)).status).toBe('consistent');
  }, 25000);

  it('refuses production, implicit consent, unknown probes/selectors, unbounded trials and acquisition API calls', async () => {
    const f = await fixture();
    const inputs = [
      { ...f.input, environment: { ...f.input.environment, is_production: true } },
      { ...f.input, probe: 'arbitrary_click' }, { ...f.input, limits: { trials: 4 } },
      { ...f.input, authorization: { ...f.input.authorization, empty_validation_only: false } },
      { ...f.input, authorization: { ...f.input.authorization, form_selector: '#' + canary } },
      { ...f.input, authorization: { ...f.input.authorization, api_read_urls: [f.origin + '/mutation'] } },
    ];
    for (const input of inputs) await expect(f.probe.run(input as ActiveProbeInput)).rejects.toThrow('ActiveProbe: INVALID_INPUT');
    expect(f.hits).toHaveLength(0);
  });

  it('honors pre-cancellation and cancellation between trials without fabricated facts', async () => {
    const f = await fixture(); const cancel = new AbortController(); cancel.abort();
    const blocked = await f.probe.run({ ...f.input, signal: cancel.signal });
    expect(blocked.observations).toHaveLength(0); expect(blocked.trials).toHaveLength(0); expect(f.hits).toHaveLength(0);
    const controller = new AbortController(); const get = f.store.get.bind(f.store); let envReads = 0;
    vi.spyOn(f.store, 'get').mockImplementation(async (app, kind, id, revision) => {
      const saved = await get(app, kind, id, revision);
      if (kind === 'environment' && ++envReads === 5) controller.abort();
      return saved;
    });
    const result = await f.probe.run({ ...f.input, signal: controller.signal });
    expect(result.trials).toHaveLength(1); expect(result.status).toBe('indeterminate');
    expect(result.observations).toHaveLength(1); expect(result.observations[0].probe_execution?.reproducible).toBe(false);
  }, 20000);

  it('rolls back all probe pairs atomically and sanitizes SQLite failures', async () => {
    const f = await fixture(); const db = new DatabaseSync(f.path);
    db.exec(`CREATE TRIGGER probe_failure BEFORE INSERT ON knowledge_revisions
      WHEN NEW.kind='observation' AND json_extract(NEW.entity_json,'$.observed_by')='active_probe'
      BEGIN SELECT RAISE(ABORT,'${canary}'); END`);
    try {
      const result = await f.probe.run(f.input);
      expect(result.status).toBe('consistent'); expect(result.persistence).toBe('failed');
      for (const o of result.observations) {
        expect(await f.store.get('probe-a', 'observation', o.id)).toBeNull();
        expect(await f.store.get('probe-a', 'evidence', o.evidence.id)).toBeNull();
      }
      expect(JSON.stringify(result)).not.toContain(canary);
    } finally { db.close(); }
  }, 20000);

  it('rejects changed context before action or persistence', async () => {
    const f = await fixture(); const get = f.store.get.bind(f.store); let envReads = 0;
    vi.spyOn(f.store, 'get').mockImplementation(async (app, kind, id, revision) => {
      if (kind === 'environment' && ++envReads === 5) await f.store.commit('probe-a', [{ kind: 'environment',
        entity: { ...f.input.environment, destructive_actions_allowed: true }, expected_revision: 1, trace }]);
      return get(app, kind, id, revision);
    });
    const result = await f.probe.run({ ...f.input, limits: { trials: 1 } });
    expect(result.warnings).toContain('CONTEXT_CHANGED'); expect(result.persistence).toBe('not_attempted');
    expect(result.observations).toHaveLength(1);
    expect(await f.store.get('probe-a', 'observation', result.observations[0].id)).toBeNull();
  }, 15000);

  it('abstains before interaction when acquisition changed the authorized context', async () => {
    const f = await fixture(); let changed: Promise<unknown> | undefined;
    f.server.once('request', () => { changed = f.store.commit('probe-a', [{ kind: 'environment',
      entity: f.input.environment, expected_revision: 1, trace }]); });
    const result = await f.probe.run(f.input); await changed;
    expect(result.trials).toHaveLength(1); expect(result.status).toBe('indeterminate');
    expect(result.observations).toHaveLength(0); expect((await f.store.query('probe-a', 'observation')).items).toHaveLength(0);
  }, 15000);

  it('enforces inspection and event/change bounds, retaining no arbitrary strings', async () => {
    const f = await fixture('<form><input required><input required></form>');
    const blocked = await f.probe.run({ ...f.input, limits: { max_controls: 1 } });
    expect(blocked.trials[0].reason).toBe('CONTROL_LIMIT');
    const limited = await f.probe.run({ ...f.input, limits: { max_validation_events: 1 } });
    expect(limited.status).toBe('indeterminate'); expect(limited.trials[0].output?.truncated).toBe(true);
  }, 20000);

  it('bounds DOM inspection and records saturated real mutations as indeterminate', async () => {
    const f = await fixture(undefined, `document.querySelector('input').addEventListener('invalid',()=>{
      const el=document.querySelector('input');el.setAttribute('aria-invalid','true');el.setAttribute('required','');
    });`);
    const blocked = await f.probe.run({ ...f.input, limits: { max_dom_nodes: 1 } });
    expect(blocked.status).toBe('blocked'); expect(blocked.observations).toHaveLength(0);
    const result = await f.probe.run({ ...f.input, limits: { max_dom_changes: 1 } });
    expect(result.status).toBe('indeterminate'); expect(result.trials[0].output?.dom_changes).toBe(1);
    expect(result.trials[0].output?.truncated).toBe(true); expect(result.persistence).toBe('committed');
  }, 20000);
});
