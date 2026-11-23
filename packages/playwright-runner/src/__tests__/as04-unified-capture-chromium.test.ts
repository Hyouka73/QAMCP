import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, realpath, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { setTimeout as delay } from 'node:timers/promises';

import { SchemaValidator, type CapturePolicyDecision } from '@qap/shared';
import { chromium, type Browser } from 'playwright-core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { UnifiedCaptureController, type CaptureLease } from '../capture/unified-capture-controller.js';
import { createPrivateCaptureStaging } from '../capture/staging-store.js';
import { CapturePublicationStore } from '../capture/publication-store.js';

const canary = 'rgb(255,0,255)';
const surface = { project_id: 'p', env_id: 'qa', module_key: 'm', case_id: 'c', role_id: 'viewer', origin: '' };
let browser: Browser;
let iframeOrigin: string;

async function listen(html: (pathname: string) => string) {
  const server = createServer((req, res) => {
    res.writeHead(req.url === '/favicon.ico' ? 204 : 200, { 'Content-Type': 'text/html' });
    res.end(html(req.url ?? '/'));
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as { port: number }).port;
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve())),
  };
}

const servers: Awaited<ReturnType<typeof listen>>[] = [];

beforeAll(async () => {
  servers.push(await listen(() => '<body style="background:#005588">cross-origin synthetic frame'));
  iframeOrigin = servers[0]!.origin;
  servers.push(await listen(pathname => {
    if (['/login', '/mfa', '/popup'].includes(pathname)) return `<body style="background:${canary}"><input>`;
    if (pathname === '/same-document') return `<style>html{background:#008800}</style><button onclick="
      history.pushState({}, '', '/mfa');
      document.documentElement.style.background='${canary}';
    ">Synthetic same-document transition</button>`;
    return `<!doctype html><body style="background:#008800">
      <iframe src="${iframeOrigin}" width="60" height="45"></iframe>
      <canvas width="40" height="40"></canvas><div id="host"></div>
      <script>
        const shadow = document.querySelector('#host').attachShadow({mode:'closed'});
        shadow.innerHTML = '<div style="width:35px;height:30px;background:#006099"></div>';
        const ctx = document.querySelector('canvas').getContext('2d');
        ctx.fillStyle='#004477'; ctx.fillRect(0,0,40,40);
      </script>`;
  }));
  surface.origin = servers[1]!.origin;
  browser = await chromium.launch({ headless: true });
}, 30_000);

afterAll(async () => {
  await browser?.close();
  await Promise.all(servers.map(server => server.close()));
});

// The test owns all synthetic render inputs. The production admission guard is
// deliberately not mocked in the legacy runner or represented as verified.
function fixtureDecision(): CapturePolicyDecision {
  return {
    decision_id: 'fixture-decision',
    mode: 'VERIFIED_STRICT',
    custody: 'standard_exportable',
    issuer: { issuer_kind: 'controlled_fixture_signer', issuer_id: 'fixture', grant_generation: 1,
      issued_at: new Date().toISOString(), expires_at: null, signature_or_digest: 'test-fixture' },
    scope: { grant_id: 'grant', project_id: 'p', env_id: 'qa', allowed_origins: [surface.origin],
      allowed_roles: ['viewer'], allowed_route_patterns: ['/safe'], allowed_iframe_origins: [iframeOrigin],
      denied_route_patterns: ['/login', '/mfa'], allow_tracing_without_sensitive_inputs: true },
    technical_enforcements: {
      record_video_disabled: true, service_workers_blocked: true, cdp_fetch_hop_by_hop_active: true,
      auth_context_physically_separated: true, popups_excluded_from_capture: true,
      tracing_blocked_on_sensitive_inputs: true, staging_user_acl_verified: true, rest_encryption_applied: false,
    },
    owner_declared: { environment_declared_synthetic: true, backend_pre_render_exclusion_claimed: true,
      residual_risk_acknowledged_by_owner: false, declaration_note: 'Local synthetic test only' },
    unverifiable_risks: [],
  };
}

async function withController(
  nativeTraceAllowed: boolean,
  run: (setup: { controller: UnifiedCaptureController; root: string; page: import('playwright-core').Page;
    revoke: AbortController; deny: (mode: 'MANDATORY_SUPPRESSION' | 'PRIVATE_AUTHORIZED') => void }) => Promise<void>,
  role = 'viewer',
) {
  const fixtureRoot = await mkdtemp(join(await realpath(tmpdir()), 'qap-as04-synthetic-'));
  const staging = createPrivateCaptureStaging(fixtureRoot);
  const root = staging.verifiedDirectory;
  const context = await browser.newContext({ viewport: { width: 320, height: 180 }, serviceWorkers: 'block' });
  const page = await context.newPage();
  const revoke = new AbortController();
  const cdp = await context.newCDPSession(page);
  cdp.on('Fetch.requestPaused', ({ requestId, request }) => {
    const url = new URL(request.url);
    const ok = [surface.origin, iframeOrigin].includes(url.origin) &&
      ['/safe', '/', '/favicon.ico'].includes(url.pathname);
    const command = ok ? cdp.send('Fetch.continueRequest', { requestId }) :
      cdp.send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
    void command.catch(() => revoke.abort());
  });
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
  context.on('page', popup => { void popup.close().catch(() => {}); });
  let decision = fixtureDecision();
  const lease: CaptureLease = { signal: revoke.signal, nativeTraceAllowed, readDecision: async () => decision };
  const controller = new UnifiedCaptureController(page, context, { ...surface, role_id: role }, lease, staging);
  try {
    await run({
      controller, root, page, revoke,
      deny: mode => {
        decision = mode === 'MANDATORY_SUPPRESSION' ?
          { ...decision, mode, custody: 'none', suppression_reason: 'surface_not_admitted' } :
          { ...decision, mode, custody: 'private_encrypted_local_only' };
      },
    });
  } finally {
    await controller.close('attempt_cancelled_or_aborted').catch(() => {});
    await context.close();
    staging.dispose();
    await rm(fixtureRoot, { recursive: true, force: true });
  }
}

function decodedPixels(file: string): { frames: number; hasCanary: boolean } {
  const raw = execFileSync('ffmpeg', [
    '-v', 'error', '-threads', '1', '-i', file, '-vf', 'scale=160:90', '-pix_fmt', 'rgb24',
    '-f', 'rawvideo', '-threads', '1', 'pipe:1',
  ], { maxBuffer: 64 * 1024 * 1024 });
  let hasCanary = false;
  for (let i = 0; i < raw.length; i += 3) {
    if (raw[i]! >= 210 && raw[i + 1]! <= 45 && raw[i + 2]! >= 210) {
      hasCanary = true;
      break;
    }
  }
  return { frames: raw.length / (160 * 90 * 3), hasCanary };
}

describe('AS-04 isolated Chromium validation', () => {
  it('decodes authentic WebM and PNG with one controller and compatible native trace geometry', async () => {
    await withController(true, async ({ controller, root, page }) => {
      expect(await controller.start()).toBe(true);
      await page.goto(`${surface.origin}/safe`);
      await controller.markStep(1);
      expect(await controller.screenshot()).toBeTruthy();
      await delay(300);
      const segment = await controller.close();
      expect(segment?.step_offsets_ms).toEqual([{ step_index: 1, offset_ms: expect.any(Number) }]);
      expect(segment?.step_offsets_ms[0]!.offset_ms).toBeGreaterThan(0);
      expect(segment?.trace).toBeTruthy();
      expect((await readFile(segment!.trace!)).subarray(0, 2).toString()).toBe('PK');
      const webm = decodedPixels(segment!.video);
      expect(webm.frames).toBeGreaterThan(1);
      expect(webm.hasCanary).toBe(false);
      expect(decodedPixels(segment!.screenshots[0]!)).toEqual({ frames: 1, hasCanary: false });
      const metadata = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', segment!.video],
        { encoding: 'utf8' })) as { streams: { width: number; height: number; codec_name: string }[]; format: { duration: string } };
      expect(metadata.streams[0]).toMatchObject({ width: 320, height: 180, codec_name: 'vp8' });
      expect((await readdir(root)).sort().map(file => file.split('.').at(-1)).sort()).toEqual(['png', 'webm', 'zip']);

      const final = createPrivateCaptureStaging(await realpath(tmpdir()));
      const db = new DatabaseSync(':memory:');
      try {
        const store = new CapturePublicationStore(db, final.verifiedDirectory);
        const video = await readFile(segment!.video);
        const hash = createHash('sha256').update(video).digest('hex');
        const attempt = 'chromium-fixture';
        const filename = basename(segment!.video);
        const { artifact_id, module_key, case_id, role_id, origin, started_at_epoch_ms, step_offsets_ms, decision_id } = segment!;
        store.publish({
          _version: '1', project_id: 'p', attempt_id: attempt, visual_evidence_status: 'captured',
          decisions: [segment!.decision], suppressions: [],
          segments: [{
            artifact_id, module_key, case_id, role_id, origin, started_at_epoch_ms, step_offsets_ms, decision_id,
            duration_ms: Math.ceil(Number(metadata.format.duration) * 1000),
          }],
          artifacts: [{
            artifact_id, filename, kind: 'webm', size_bytes: video.length,
            custody: {
              custody: 'standard_exportable', encrypted_at_rest: false, export_permitted_by_default: true,
              plaintext_sha256: hash, stored_sha256: hash,
            },
          }],
        }, root, () => true, () => {});
        expect(await readFile(join(final.verifiedDirectory, `capture-${attempt}`, filename))).toEqual(video);
      } finally {
        db.close();
        final.dispose();
      }
    });
  }, 30_000);

  it('emits no visual files by default or when private capture is requested', async () => {
    for (const mode of ['MANDATORY_SUPPRESSION', 'PRIVATE_AUTHORIZED'] as const) {
      await withController(true, async ({ controller, deny, page, root }) => {
        deny(mode);
        expect(await controller.start()).toBe(false);
        await page.goto(`${surface.origin}/safe`);
        expect(await controller.screenshot()).toBeUndefined();
        expect(await controller.close()).toBeUndefined();
        expect(await readdir(root)).toEqual([]);
        expect(controller.getSuppressions()[0]?.reason).toBe(
          mode === 'PRIVATE_AUTHORIZED' ? 'private_capture_disabled' : 'surface_not_admitted',
        );
      });
    }
  }, 30_000);

  it('keeps synthetic login/MFA, popups and an ungranted role outside the admitted capture context', async () => {
    let executionContext: import('playwright-core').BrowserContext | undefined;
    await withController(false, async ({ controller, root, page }) => {
      executionContext = page.context();
      expect(await controller.start()).toBe(true);
      await page.goto(`${surface.origin}/safe`);
      const popup = page.context().waitForEvent('page');
      await page.evaluate(origin => { window.open(`${origin}/popup`); }, surface.origin);
      const secondary = await popup;
      if (!secondary.isClosed()) await secondary.waitForEvent('close');
      await delay(300);
      const segment = await controller.close();
      expect(decodedPixels(segment!.video).hasCanary).toBe(false);
      expect(await readdir(root)).toHaveLength(1);
    });

    const auth = await browser.newContext({ serviceWorkers: 'block' });
    try {
      expect(auth).not.toBe(executionContext);
      const page = await auth.newPage();
      for (const path of ['/login', '/mfa']) {
        await page.goto(surface.origin + path);
        await page.locator('input').fill('synthetic-input');
        expect(await page.locator('body').evaluate(body => getComputedStyle(body).backgroundColor)).toBe('rgb(255, 0, 255)');
      }
    } finally {
      await auth.close();
    }

    await withController(false, async ({ controller, page, root }) => {
      expect(page.context()).not.toBe(executionContext);
      expect(page.context()).not.toBe(auth);
      expect(await controller.start()).toBe(false);
      expect(controller.getSuppressions()[0]?.reason).toBe('surface_not_admitted');
      expect(await readdir(root)).toEqual([]);
    }, 'administrator');
  }, 30_000);

  it.each(['revocation', 'cancellation'] as const)('drains and discards media after %s', async outcome => {
    await withController(true, async ({ controller, revoke, page, root }) => {
      expect(await controller.start()).toBe(true);
      await page.goto(`${surface.origin}/safe`);
      await controller.screenshot();
      if (outcome === 'revocation') revoke.abort();
      const reason = outcome === 'revocation' ? undefined : 'attempt_cancelled_or_aborted';
      expect(await controller.close(reason)).toBeUndefined();
      expect(await readdir(root)).toEqual([]);
      expect(controller.getSuppressions()[0]?.reason).toBe(reason ?? 'grant_missing_or_revoked');
    });
  }, 30_000);

  it('validates the mode/custody schema and rejects implicit private export', () => {
    const validator = new SchemaValidator();
    const decision = fixtureDecision();
    const manifest = {
      _version: '1', project_id: 'p', attempt_id: 'a', visual_evidence_status: 'captured',
      decisions: [decision], segments: [], artifacts: [], suppressions: [],
    };
    expect(validator.validateEvidenceManifest(manifest).valid).toBe(true);
    expect(validator.validateEvidenceManifest({
      ...manifest,
      decisions: [{ ...decision, mode: 'PRIVATE_AUTHORIZED' }],
    }).valid).toBe(false);
    expect(validator.validateEvidenceManifest({
      ...manifest, artifacts: [{ artifact_id: 'a', filename: 'a.webm.enc', size_bytes: 100, kind: 'webm',
        custody: { custody: 'private_encrypted_local_only', encrypted_at_rest: true, cipher: 'aes-256-gcm',
          key_ref: 'fixture', aad: 'p:a:a', plaintext_sha256: '0'.repeat(64), stored_sha256: '1'.repeat(64),
          export_permitted_by_default: true } }],
    }).valid).toBe(false);
  });

  it('demonstrates why a network guard alone cannot admit a same-document transition', async () => {
    const context = await browser.newContext({ viewport: { width: 320, height: 180 }, serviceWorkers: 'block' });
    try {
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      const requests: string[] = [];
      cdp.on('Fetch.requestPaused', ({ requestId, request }) => {
        requests.push(new URL(request.url).pathname);
        const command = new URL(request.url).pathname === '/mfa'
          ? cdp.send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' })
          : cdp.send('Fetch.continueRequest', { requestId });
        void command.catch(() => {});
      });
      await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
      const root = await mkdtemp(join(tmpdir(), 'qap-as04-guard-'));
      try {
        await page.goto(`${surface.origin}/same-document`);
        expect(requests).toContain('/same-document');
        const file = join(root, 'candidate.webm');
        await page.screencast.start({ path: file, size: { width: 320, height: 180 } });
        await page.getByRole('button').click();
        await delay(300);
        await page.screencast.stop();
        expect(new URL(page.url()).pathname).toBe('/mfa');
        expect(requests).not.toContain('/mfa');
        expect(decodedPixels(file).hasCanary).toBe(true);
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    } finally {
      await context.close();
    }
  }, 30_000);
});
