import type { BrowserContext } from 'playwright-core';
import { AuthManager, SessionStore, executeAutoLogin, executeHandoffLogin, readProfile } from '@qap/auth';
import { FileSystemStorage } from '@qap/knowledge';
import type { StorageState } from '@qap/auth';

export interface SessionResolverOptions {
  allowImplicitAuth?: boolean;
}

export async function resolveModuleSession(
  projectRoot: string = process.cwd(),
  moduleName: string,
  overrideProfile?: string,
  options?: SessionResolverOptions
): Promise<StorageState | null> {
  const storage = new FileSystemStorage({ rootDir: projectRoot });
  const prereqs = await storage.getModulePrereqs(moduleName);

  const profileId = overrideProfile ?? prereqs?.requires?.auth?.primary;

  if (!profileId) {
    return null;
  }

  const sessionStore = new SessionStore(undefined, projectRoot);
  try {
    const session = sessionStore.getValidSession(profileId);
    if (session) return session;
    // MCP supplies its independently authorized and verified session to the runner.
    if (options?.allowImplicitAuth === false) return null;

    const profile = await readProfile(profileId, projectRoot);
    if (!profile) throw new Error(`Perfil de autenticación '${profileId}' no encontrado.`);
    if (profile.login_origin) throw new Error('El perfil requiere una sesión verificada mediante qap_auth_add.');

    const authManager = new AuthManager(projectRoot);
    let browserContext: BrowserContext | undefined;
    let browser: import('playwright-core').Browser | undefined;
    try {
      const isHandoff = profile.login_mode === 'handoff';
      const credentials = isHandoff ? null : await authManager.getCredentials(profileId);
      if (!isHandoff && !credentials) throw new Error('Credencial no configurada.');
      const { chromium } = await import('playwright-core');
      browser = await chromium.launch({ headless: !isHandoff });
      browserContext = await browser.newContext({ serviceWorkers: 'block' });
      const newStorageState = credentials
        ? await executeAutoLogin(profile, credentials, browserContext)
        : await executeHandoffLogin(profile, browserContext);

      sessionStore.saveSession(profileId, newStorageState);
      return newStorageState;
    } catch {
      // Playwright action details can contain credential values or authorization headers.
      throw new Error('No se pudo resolver la sesión del perfil de autenticación.');
    } finally {
      await browserContext?.close().catch(() => undefined);
      await browser?.close().catch(() => undefined);
      authManager.close();
    }
  } finally { sessionStore.close(); }
}
