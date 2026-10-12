import type { Page } from 'playwright-core';
import type { TCStep } from '@qap/shared';
import { SessionStore } from '@qap/auth';

/**
 * Alterna la sesión en vivo cargando un storageState previamente persistido
 * y cifrado por SessionStore (@qap/auth, S2-006). No lee el archivo
 * directamente: usa SessionStore.getValidSession(), que descifra con
 * AES-256-GCM y valida expiración (TTL) antes de devolver las cookies.
 */
export async function executeSwitchAuth(
  page: Page,
  step: TCStep,
  sessionsDir?: string
): Promise<void> {
  if (!step.auth_profile) {
    throw new Error(`El paso 'switch_auth' requiere definir la propiedad 'auth_profile'.`);
  }

  const sessionStore = new SessionStore(sessionsDir);
  const session = sessionStore.getValidSession(step.auth_profile);

  if (!session) {
    throw new Error(
      `No existe una sesión válida (o no expirada) para el perfil '${step.auth_profile}'. Ejecuta 'qap auth add' primero.`
    );
  }

  const context = page.context();

  // Limpiar cookies de la sesión anterior antes de aplicar la nueva,
  // para que "alternar" sea un reemplazo limpio, no una acumulación.
  await context.clearCookies();

  if (session.cookies && session.cookies.length > 0) {
    await context.addCookies(session.cookies);
  }

  const currentUrl = page.url();
  if (currentUrl && currentUrl !== 'about:blank') {
    await page.reload({ waitUntil: 'load' });
  }
}