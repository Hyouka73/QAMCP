import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectPlaywright } from '../utils/playwright-detector.js';
import * as fs from 'node:fs';

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

describe('detectPlaywright', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('detecta @playwright/test cuando está en dependencies', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({ dependencies: { '@playwright/test': '^1.48.0' } })
    );

    const result = detectPlaywright('/fake/project');

    expect(result).toEqual({
      installed: true,
      packageName: '@playwright/test',
      version: '^1.48.0',
    });
  });

  it('detecta playwright-core cuando está en devDependencies', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({ devDependencies: { 'playwright-core': '^1.48.0' } })
    );

    const result = detectPlaywright('/fake/project');

    expect(result).toEqual({
      installed: true,
      packageName: 'playwright-core',
      version: '^1.48.0',
    });
  });

  it('devuelve installed:false y avisa cuando Playwright no está instalado', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({ dependencies: {}, devDependencies: {} })
    );
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = detectPlaywright('/fake/project');

    expect(result).toEqual({ installed: false });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Playwright no está instalado')
    );
  });

  it('devuelve installed:false cuando no existe package.json', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = detectPlaywright('/fake/project');

    expect(result).toEqual({ installed: false });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('No se encontró package.json')
    );
  });

  it('devuelve installed:false cuando el package.json no es JSON válido', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('{ esto no es json válido');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = detectPlaywright('/fake/project');

    expect(result).toEqual({ installed: false });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('No se pudo leer/parsear')
    );
  });
});