import type { TCStep } from '@qap/shared';
import type { Page } from 'playwright-core';

import { resolveModuleSession } from '../session-resolver.js';

const NO_SESSION_MESSAGE = (profile: string): string =>
  `No existe una sesión válida (o no expirada) para el perfil '${profile}'. Ejecuta 'qap auth add' primero.`;

/**
 * Cambia de sesión en medio de una prueba: carga las cookies y el localStorage del
 * perfil indicado en el BrowserContext actual, sin cerrar el navegador.
 * El módulo para resolver la sesión sale de step.profile (alias), o '' si no se indica.
 */
export async function executeSwitchAuth(page: Page, step: TCStep): Promise<void> {
  if (!step.auth_profile) {
    throw new Error(`El paso 'switch_auth' requiere definir la propiedad 'auth_profile'.`);
  }

  const projectRoot = process.cwd();
  const moduleName = step.profile ?? '';

  let storageState;
  try {
    storageState = await resolveModuleSession(projectRoot, moduleName, step.auth_profile);
  } catch (error) {
    throw new Error(NO_SESSION_MESSAGE(step.auth_profile), { cause: error });
  }

  if (!storageState) {
    throw new Error(NO_SESSION_MESSAGE(step.auth_profile));
  }

  const context = page.context();
  await context.clearCookies();

  if (storageState.cookies.length > 0) {
    await context.addCookies(storageState.cookies);
  }

  // localStorage: solo se puede escribir en el origen correspondiente, así que se
  // usa una página temporal por origen, sin tocar la página principal de la prueba.
  for (const origin of storageState.origins) {
    if (origin.localStorage.length === 0) continue;

    const scratch = await context.newPage();
    try {
      await scratch.goto(origin.origin, { waitUntil: 'domcontentloaded' });
      await scratch.evaluate((items) => {
        for (const item of items) {
          localStorage.setItem(item.name, item.value);
        }
      }, origin.localStorage);
    } finally {
      await scratch.close();
    }
  }

  const currentUrl = page.url();
  if (currentUrl && currentUrl !== 'about:blank') {
    await page.reload({ waitUntil: 'load' });
  }
}