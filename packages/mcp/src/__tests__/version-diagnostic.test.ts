import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { getVersionDiagnostic } from '../version-diagnostic.js';

const temporaryRoots: string[] = [];
const makeFixture = (head = 'a'.repeat(40)) => {
  const root = mkdtempSync(join(tmpdir(), 'qap-version-'));
  temporaryRoots.push(root);
  writeFileSync(join(root, 'pnpm-workspace.yaml'), 'packages: []\n');
  const dist = join(root, 'packages', 'mcp', 'dist');
  mkdirSync(dist, { recursive: true });
  const bundlePath = join(dist, 'server.js');
  const metadataPath = join(dist, 'build-meta.json');
  const logPath = join(root, 'logs', 'diagnostics.jsonl');
  const writeBuild = (fingerprint: string, revision = head, bundle = 'fresh bundle') => {
    writeFileSync(bundlePath, bundle);
    writeFileSync(metadataPath, JSON.stringify({
      schemaVersion: 1,
      packageVersion: '2.1.3',
      repositoryHead: revision,
      buildFingerprint: fingerprint,
      bundleSha256: createHash('sha256').update('server.js\0').update(bundle).digest('hex'),
      builtAt: '2026-11-12T12:00:00.000Z',
    }));
  };
  const diagnose = (fingerprint: string | null, revision: string | null = head, targetRepoHead: string | null = head) => getVersionDiagnostic({
    serverPath: bundlePath,
    metadataPath,
    logPath,
    activeFingerprint: fingerprint,
    activeSha: revision,
    version: '2.1.3',
    pid: 1234,
    startedAt: '2026-11-12T12:00:00.000Z',
    readHead: () => targetRepoHead,
  });
  return { root, bundlePath, metadataPath, logPath, writeBuild, diagnose };
};

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('QAP build version diagnosis', () => {
  it('detects an old process after a new bundle was written to disk', async () => {
    const f = makeFixture();
    f.writeBuild('b'.repeat(64));
    expect(await f.diagnose('c'.repeat(64), '9'.repeat(40))).toMatchObject({ status: 'stale_process', action: 'reconnect_mcp' });
  });

  it('detects a repository update that has not been compiled', async () => {
    const f = makeFixture();
    f.writeBuild('b'.repeat(64));
    expect(await f.diagnose('b'.repeat(64), 'a'.repeat(40), 'c'.repeat(40))).toMatchObject({ status: 'build_outdated', action: 'recompile' });
  });

  it('compares HEAD from the server checkout, independently from the target workspace checkout', async () => {
    const f = makeFixture();
    f.writeBuild('b'.repeat(64));
    const result = await f.diagnose('b'.repeat(64), 'a'.repeat(40), 'a'.repeat(40));
    expect(result).toMatchObject({ status: 'current', repository: { root: f.root, head: 'a'.repeat(40), comparison: 'matched' } });
  });

  it('reports current when process, artifact and repository are synchronized and avoids repeated log lines', async () => {
    const f = makeFixture();
    f.writeBuild('b'.repeat(64));
    const result = await f.diagnose('b'.repeat(64));
    await f.diagnose('b'.repeat(64));
    expect(result).toMatchObject({ status: 'current', action: 'continue', active: { pid: 1234, startedAt: '2026-11-12T12:00:00.000Z' } });
    expect(readFileSync(f.logPath, 'utf8').trim().split(/\r?\n/)).toHaveLength(1);
  });

  it('works without Git when the bundle metadata is verifiable and returns unknown without metadata', async () => {
    const f = makeFixture();
    f.writeBuild('b'.repeat(64));
    expect(await f.diagnose('b'.repeat(64), 'a'.repeat(40), null)).toMatchObject({ status: 'current', repository: { comparison: 'unavailable' } });
    rmSync(f.metadataPath);
    expect(await f.diagnose('b'.repeat(64), 'a'.repeat(40), null)).toMatchObject({ status: 'unknown', action: 'review_configuration' });
  });

  it('marks a bundle that fails its recorded digest as incompatible', async () => {
    const f = makeFixture();
    f.writeBuild('b'.repeat(64));
    writeFileSync(f.bundlePath, 'tampered');
    expect(await f.diagnose('b'.repeat(64))).toMatchObject({ status: 'incompatible', action: 'review_configuration' });
  });
});
