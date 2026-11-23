import { createSecretKey, randomBytes } from 'node:crypto';
import { createServer } from 'node:http';

import { chromium } from 'playwright-core';
import { expect, it } from 'vitest';

import { encryptSealedCapture, readPrivateMedia } from '../server/private-media.js';

it('plays authentic WebM through a revocable HTTP Range handler and never loads ciphertext when denied', async () => {
  const browser = await chromium.launch({ headless: true });
  const key = createSecretKey(randomBytes(32));
  const identity = { project_id: 'p', attempt_id: 'attempt', artifact_id: 'segment' };
  let server: ReturnType<typeof createServer> | undefined;
  let reads = 0;
  let authorized = true;
  try {
    const context = await browser.newContext({ viewport: { width: 320, height: 180 }, recordVideo: undefined });
    const page = await context.newPage();
    // Recover the real browser video as bytes using Playwright's isolated test
    // directory. The HTTP handler never writes decrypted files.
    const { mkdtemp, readFile, rm } = await import('node:fs/promises');
    const { join } = await import('node:path');
    const { tmpdir } = await import('node:os');
    const fixtureDir = await mkdtemp(join(tmpdir(), 'qap-as04-private-range-fixture-'));
    let raw: Buffer;
    try {
      const file = join(fixtureDir, 'fixture.webm');
      await page.screencast.start({ path: file, size: { width: 320, height: 180 } });
      await page.setContent('<body style="background:#002266"><h1>WebM fixture</h1>');
      await page.waitForTimeout(300);
      await page.screencast.stop();
      raw = await readFile(file);
    } finally {
      await context.close();
      await rm(fixtureDir, { recursive: true, force: true });
    }
    expect(raw.subarray(0, 4).toString('hex')).toBe('1a45dfa3');
    const sealed = encryptSealedCapture(raw, key, identity);
    expect(sealed.ciphertext.subarray(0, 4).toString('hex')).not.toBe('1a45dfa3');
    const entry = { ...identity, plaintext_sha256: sealed.plaintext_sha256, stored_sha256: sealed.stored_sha256,
      size_bytes: sealed.ciphertext.length, mime_type: 'video/webm' as const };
    server = createServer(async (req, res) => {
      if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<video muted autoplay src="/media"></video>');
        return;
      }
      if (req.url !== '/media') { res.writeHead(404).end(); return; }
      const response = await readPrivateMedia(entry, req.headers.range, async () => authorized, async () => {
        reads++;
        return { ciphertext: sealed.ciphertext, key };
      });
      res.writeHead(response.status, response.headers);
      res.end(response.body);
    });
    const app = server;
    await new Promise<void>(resolve => app.listen(0, '127.0.0.1', resolve));
    const port = (app.address() as { port: number }).port;
    const base = `http://127.0.0.1:${port}`;
    const playback = await browser.newPage();
    await playback.goto(base);
    await playback.waitForFunction("document.querySelector('video').currentTime > 0");
    const range = await fetch(`${base}/media`, { headers: { Range: 'bytes=0-7' } });
    expect(range.status).toBe(206);
    expect(range.headers.get('content-range')).toBe(`bytes 0-7/${raw.length}`);
    expect(Buffer.from(await range.arrayBuffer())).toEqual(raw.subarray(0, 8));
    const suffix = await fetch(`${base}/media`, { headers: { Range: 'bytes=-10' } });
    expect(Buffer.from(await suffix.arrayBuffer())).toEqual(raw.subarray(-10));
    const invalid = await fetch(`${base}/media`, { headers: { Range: 'bytes=0-1,4-5' } });
    expect(invalid.status).toBe(416);
    await invalid.arrayBuffer();

    await playback.close();
    authorized = false;
    const before = reads;
    const revoked = await fetch(`${base}/media`, { headers: { Range: 'bytes=0-7' } });
    expect(revoked.status).toBe(404);
    expect(await revoked.text()).toBe('');
    expect(reads).toBe(before);

    const load = async () => ({ ciphertext: sealed.ciphertext, key });
    expect((await readPrivateMedia({ ...entry, attempt_id: 'different' }, undefined, async () => true, load)).status)
      .toBe(404);
    const modified = Buffer.from(sealed.ciphertext);
    modified[modified.length - 1] ^= 1;
    expect((await readPrivateMedia(entry, undefined, async () => true, async () => ({ ciphertext: modified, key }))).status)
      .toBe(404);
    let visits = 0;
    expect((await readPrivateMedia(entry, 'bytes=0-7', async () => ++visits === 1, load)).status).toBe(404);
  } finally {
    await browser.close();
    const active = server;
    if (active) await new Promise<void>(resolve => active.close(() => resolve()));
  }
}, 30_000);
