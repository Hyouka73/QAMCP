import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@inquirer/prompts', () => ({
  input: vi.fn(),
}));

vi.mock('@qap/playwright-adapter', () => ({
  PlaywrightAdapter: vi.fn().mockImplementation(function PlaywrightAdapterMock() {
    return {
      discover: vi.fn().mockResolvedValue({
        name: 'checkout',
        path: '/checkout',
        description: 'Checkout module',
        tags: ['ecommerce'],
        cases: [],
      }),
    };
  }),
}));

import { input } from '@inquirer/prompts';

import { handleDiscover } from '../commands/discover.js';

describe('qap discover (S4-003)', () => {
  let originalCwd: string;
  let tempDir: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = mkdtempSync(join(tmpdir(), 'qap-discover-'));
    process.chdir(tempDir);
    vi.mocked(input).mockReset();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('fase interview debe persistir el ModuleSpec en .qa/cache/discover/<name>.spec.json', async () => {
    vi.mocked(input)
      .mockResolvedValueOnce('checkout')
      .mockResolvedValueOnce('/checkout')
      .mockResolvedValueOnce('ecommerce, core');

    await handleDiscover(undefined, { phase: 'interview' });

    const specFile = join(tempDir, '.qa', 'cache', 'discover', 'checkout.spec.json');
    expect(existsSync(specFile)).toBe(true);

    const spec = JSON.parse(readFileSync(specFile, 'utf-8')) as unknown;
    expect(spec).toEqual({ name: 'checkout', path: '/checkout', tags: ['ecommerce', 'core'] });
  });

  it('fase navigate debe leer el spec persistido y guardar el modulo descubierto', async () => {
    vi.mocked(input)
      .mockResolvedValueOnce('checkout')
      .mockResolvedValueOnce('/checkout')
      .mockResolvedValueOnce('');

    await handleDiscover(undefined, { phase: 'interview' });
    await handleDiscover('checkout', { phase: 'navigate' });

    const moduleFile = join(tempDir, '.qa', 'cache', 'discover', 'checkout.module.json');
    expect(existsSync(moduleFile)).toBe(true);

    const discoveredModule = JSON.parse(readFileSync(moduleFile, 'utf-8')) as { name: string; description: string };
    expect(discoveredModule.name).toBe('checkout');
    expect(discoveredModule.description).toBe('Checkout module');
  });

  it('fase navigate debe fallar con un mensaje claro si no hay spec previo', async () => {
    await expect(handleDiscover('inexistente', { phase: 'navigate' })).rejects.toThrow(
      /No existe una especificacion persistida/
    );
  });

  it('fase repo-map debe indicar que depende de S4-005 (pendiente)', async () => {
    await expect(handleDiscover('checkout', { phase: 'repo-map' })).rejects.toThrow(/S4-005/);
  });

  it('debe rechazar una fase desconocida', async () => {
    await expect(handleDiscover('checkout', { phase: 'invalida' })).rejects.toThrow(/no reconocida/);
  });
});