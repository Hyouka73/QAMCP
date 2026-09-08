// packages/auth/src/modes/handoff-login.ts
import type { BrowserContext, Page } from 'playwright-core';
import type { AuthProfile } from '@qap/shared';

const DEFAULT_POLL_INTERVAL_MS = 500;
const DEFAULT_HANDOFF_TIMEOUT_MS = 120000;

/**
 * Verifica una sola vez (sin esperar) si la post_login_condition ya se cumple.
 */
async function checkCondition(page: Page, profile: AuthProfile): Promise<boolean> {
  const condition = profile.post_login_condition;
  if (!condition) return false;

  switch (condition.type) {
    case 'url_contains':
      return page.url().includes(condition.value);
    case 'selector_present':
      return (await page.locator(condition.value).count()) > 0;
    default:
      return false;
  }
}

/**
 * Ejecuta un login "handoff": abre Chromium en modo headed para que el usuario
 * complete manualmente el login (2FA, captcha, SSO). Hace polling determinista
 * sobre post_login_condition hasta handoff_timeout_ms. Al cumplirse, toma control
 * de inmediato, captura el storageState y cierra la ventana limpiamente.
 *
 * No requiere que el usuario presione teclas en terminal: la deteccion es 100%
 * por polling sobre el estado real de la pagina.
 */
export async function executeHandoffLogin(
  profile: AuthProfile,
  browserContext: BrowserContext
): Promise<Awaited<ReturnType<BrowserContext['storageState']>>> {
  if (!profile.login_route) {
    throw new Error(`El perfil '${profile.id}' no define login_route`);
  }

  const timeoutMs = profile.handoff_timeout_ms ?? DEFAULT_HANDOFF_TIMEOUT_MS;
  const message =
    profile.handoff_message ??
    `Completa el login manualmente en la ventana abierta. Esperando hasta ${timeoutMs}ms...`;

  const page = await browserContext.newPage();

  try {
    await page.goto(profile.login_route, { waitUntil: 'domcontentloaded' });

    console.log(message);

    const startTime = Date.now();

    // Polling determinista: se consulta activamente el estado de la pagina
    // a intervalos fijos, sin depender de que el usuario presione teclas.
    while (Date.now() - startTime < timeoutMs) {
      const conditionMet = await checkCondition(page, profile);
      if (conditionMet) {
        return await browserContext.storageState();
      }
      await page.waitForTimeout(DEFAULT_POLL_INTERVAL_MS);
    }

    throw new Error(
      `Timeout de handoff (${timeoutMs}ms) alcanzado sin cumplir post_login_condition para el perfil '${profile.id}'`
    );
  } finally {
    await page.close().catch(() => {});
  }
}