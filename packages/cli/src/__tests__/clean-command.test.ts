import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { handleClean } from '../commands/clean.js';
import { createProgram } from '../program.js';

const previous = process.cwd();
let parent: string, root: string;
beforeEach(() => {
  parent = realpathSync(mkdtempSync(join(tmpdir(), 'qap-cli-reset-')));
  root = join(parent, 'app');
  mkdirSync(join(root, '.qa'), { recursive: true });
  writeFileSync(join(root, '.qa', 'profile.json'), '{}');
  process.chdir(root);
  vi.stubEnv('QAP_MCP_WORKSPACE_HOST_DIR', join(parent, 'host'));
});
afterEach(() => {
  process.chdir(previous);
  vi.unstubAllEnvs();
  rmSync(parent, { recursive: true, force: true });
});

it.each(['--force', '--yes', '-f', '-y'])('rejects the legacy bypass %s', async flag => {
  await expect(createProgram().parseAsync(['clean', flag], { from: 'user' })).rejects.toThrow();
  expect(existsSync(join(root, '.qa', 'profile.json'))).toBe(true);
});
it('fails closed if the local human authorizer is unavailable', async () => {
  vi.stubEnv('QAP_DISABLE_INTERACTIVE_AUTH', '1');
  await expect(handleClean()).rejects.toThrow('reset_authorization_unavailable');
  expect(existsSync(join(root, '.qa', 'profile.json'))).toBe(true);
});
it('shows a preview without deleting or requiring a dialog', async () => {
  await expect(handleClean({ preview: true })).resolves.toBeUndefined();
  expect(existsSync(join(root, '.qa', 'profile.json'))).toBe(true);
});
