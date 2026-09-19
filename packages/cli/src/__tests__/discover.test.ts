import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { input } from '@inquirer/prompts';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { handleDiscover } from '../commands/discover.js';

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

  it('fase repo-map debe persistir repo-map.json con rutas POSIX', async () => {
    vi.mocked(input)
      .mockResolvedValueOnce('checkout')
      .mockResolvedValueOnce('/checkout')
      .mockResolvedValueOnce('');

    await handleDiscover(undefined, { phase: 'interview' });
    await handleDiscover('checkout', { phase: 'navigate' });

    vi.mocked(input).mockResolvedValueOnce('src\\components\\Cart.tsx, src\\hooks\\useCart.ts');

    await handleDiscover('checkout', { phase: 'repo-map' });

    const repoMapFile = join(tempDir, '.qa', 'cache', 'discover', 'checkout.repo-map.json');
    expect(existsSync(repoMapFile)).toBe(true);

    const repoMap = JSON.parse(readFileSync(repoMapFile, 'utf-8')) as {
      _version: string;
      module: string;
      files: string[];
    };
    expect(repoMap._version).toBe('1');
    expect(repoMap.module).toBe('checkout');
    expect(repoMap.files).toEqual(['src/components/Cart.tsx', 'src/hooks/useCart.ts']);
  });

  it('fase repo-map debe fallar si el modulo no fue navegado previamente', async () => {
    await expect(handleDiscover('inexistente', { phase: 'repo-map' })).rejects.toThrow(
      /No existe un modulo documentado/
    );
  });

  it('debe rechazar una fase desconocida', async () => {
    await expect(handleDiscover('checkout', { phase: 'invalida' })).rejects.toThrow(/no reconocida/);
  });

    it('amend debe corregir campos de un modulo ya documentado sin re-escanear', async () => {
    vi.mocked(input)
      .mockResolvedValueOnce('checkout')
      .mockResolvedValueOnce('/checkout')
      .mockResolvedValueOnce('');
    await handleDiscover(undefined, { phase: 'interview' });
    await handleDiscover('checkout', { phase: 'navigate' });

    const { PlaywrightAdapter } = await import('@qap/playwright-adapter');
    vi.mocked(PlaywrightAdapter).mockClear();

    vi.mocked(input)
      .mockResolvedValueOnce('Checkout module corregido')
      .mockResolvedValueOnce('ecommerce, urgente');

    await handleDiscover('checkout', { amend: true });

    expect(PlaywrightAdapter).not.toHaveBeenCalled();

    const moduleFile = join(tempDir, '.qa', 'cache', 'discover', 'checkout.module.json');
    const amended = JSON.parse(readFileSync(moduleFile, 'utf-8')) as { description: string; tags: string[] };
    expect(amended.description).toBe('Checkout module corregido');
    expect(amended.tags).toEqual(['ecommerce', 'urgente']);
  });

  it('amend debe fallar con un mensaje claro si el modulo no fue documentado aun', async () => {
    await expect(handleDiscover('inexistente', { amend: true })).rejects.toThrow(
      /No existe un modulo documentado/
    );
  });
});