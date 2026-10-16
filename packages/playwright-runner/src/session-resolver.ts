import { chromium, type BrowserContext } from 'playwright-core';
import { AuthManager, SessionStore, executeAutoLogin, executeHandoffLogin, readProfile } from '@qap/auth';
import { FileSystemStorage } from '@qap/knowledge';
import type { StorageState } from '@qap/auth';

export async function resolveModuleSession(
  projectRoot: string = process.cwd(),
  moduleName: string,
  overrideProfile?: string
): Promise<StorageState | null> {
  const storage = new FileSystemStorage({ rootDir: projectRoot });
  const prereqs = await storage.getModulePrereqs(moduleName);

  const profileId = overrideProfile ?? prereqs?.requires?.auth?.primary;

  if (!profileId) {
    return null;
  }

  const sessionStore = new SessionStore(undefined, projectRoot);
  const session = sessionStore.getValidSession(profileId);

  if (session) {
    return session;
  }

  const profile = await readProfile(profileId, projectRoot);
  if (!profile) {
    throw new Error(`Perfil de autenticación '${profileId}' no encontrado.`);
  }

  const authManager = new AuthManager(projectRoot);
  const credentials = await authManager.getCredentials(profileId);

  let browserContext: BrowserContext | null = null;
  try {
    const isHandoff = profile.login_mode === 'handoff';
    const browser = await chromium.launch({ headless: !isHandoff });
    browserContext = await browser.newContext();

    let newStorageState: StorageState;

    if (isHandoff) {
      newStorageState = (await executeHandoffLogin(profile, browserContext)) as StorageState;
    } else {
      if (!credentials) {
        throw new Error(`No se pudieron resolver las credenciales para el perfil '${profileId}'.`);
      }
      newStorageState = (await executeAutoLogin(profile, credentials, browserContext)) as StorageState;
    }

    sessionStore.saveSession(profileId, newStorageState);
    await browser.close();
    return newStorageState;
  } catch (error) {
    if (browserContext) {
      await browserContext.browser()?.close().catch(() => {});
    }
    throw error;
  }
}