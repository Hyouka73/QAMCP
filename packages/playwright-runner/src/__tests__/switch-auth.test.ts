import type { TCStep } from '@qap/shared';
import type { Page } from 'playwright-core';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { executeSwitchAuth } from '../actions/switch-auth.js';
import { resolveModuleSession } from '../session-resolver.js';

vi.mock('../session-resolver.js', () => ({ resolveModuleSession: vi.fn() }));

const resolveMock = vi.mocked(resolveModuleSession);

function fakePage(url = 'about:blank') {
  const scratch = { goto: vi.fn(), evaluate: vi.fn(), close: vi.fn() };
  const context = {
    clearCookies: vi.fn(),
    addCookies: vi.fn(),
    newPage: vi.fn().mockResolvedValue(scratch),
    close: vi.fn(),
  };
  const page = { context: () => context, url: () => url, reload: vi.fn() };
  return { page: page as unknown as Page, context, scratch, reload: page.reload };
}

const step = (overrides: Partial<TCStep> = {}): TCStep => ({ type: 'switch_auth', auth_profile: 'viewer-local', ...overrides });

describe('executeSwitchAuth (S81-002)', () => {
  beforeEach(() => {
    resolveMock.mockReset();
  });

  it('exige auth_profile', async () => {
    const { page } = fakePage();

    await expect(executeSwitchAuth(page, { type: 'switch_auth' })).rejects.toThrow(/auth_profile/);
  });

  it('reemplaza las cookies de la sesión y recarga la página sin cerrar el contexto', async () => {
    resolveMock.mockResolvedValue({
      cookies: [{ name: 'sid', value: 'abc', domain: 'localhost', path: '/' }],
      origins: [],
    } as never);
    const { page, context, reload } = fakePage('http://localhost:3000/panel');

    await executeSwitchAuth(page, step());

    expect(context.clearCookies).toHaveBeenCalled();
    expect(context.addCookies).toHaveBeenCalledWith([expect.objectContaining({ name: 'sid', value: 'abc' })]);
    expect(reload).toHaveBeenCalledWith({ waitUntil: 'load' });
    expect(context.close).not.toHaveBeenCalled();
  });

    it('no recarga si la página está en about:blank', async () => {
    resolveMock.mockResolvedValue({ cookies: [], origins: [] });
    const { page, reload } = fakePage('about:blank');

    await executeSwitchAuth(page, step());

    expect(reload).not.toHaveBeenCalled();
  });

  it('aplica el localStorage en una página temporal del origen y la cierra', async () => {
    resolveMock.mockResolvedValue({
      cookies: [],
      origins: [{ origin: 'http://localhost:3000', localStorage: [{ name: 'token', value: 't1' }] }],
    });
    const { page, context, scratch } = fakePage();

    await executeSwitchAuth(page, step());

    expect(context.newPage).toHaveBeenCalled();
    expect(scratch.goto).toHaveBeenCalledWith('http://localhost:3000', expect.anything());
    expect(scratch.evaluate).toHaveBeenCalledWith(expect.any(Function), [{ name: 'token', value: 't1' }]);
    expect(scratch.close).toHaveBeenCalled();
  });

  it('falla con un mensaje claro si no hay sesión válida', async () => {
    resolveMock.mockResolvedValue(null);
    const { page } = fakePage();

    await expect(executeSwitchAuth(page, step())).rejects.toThrow(/qap auth add/);
  });

  it('conserva el mensaje esperado y adjunta la causa si resolveModuleSession falla', async () => {
    resolveMock.mockRejectedValue(new Error('perfil inexistente'));
    const { page } = fakePage();

    const failure = await executeSwitchAuth(page, step()).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toMatch(/No existe una sesión válida/);
    expect(((failure as Error).cause as Error).message).toBe('perfil inexistente');
  });
});