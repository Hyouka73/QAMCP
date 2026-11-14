import type { Page } from 'playwright-core';

/** Restrict an isolated Chromium context to a single page and exact HTTP origin. */
export async function restrictChromiumPage(page: Page, origin: string, readOnly = false): Promise<void> {
  const context = page.context();
  const allowed = (value: string, method: string): boolean => {
    if (readOnly && method !== 'GET' && method !== 'HEAD') return false;
    try {
      const url = new URL(value);
      return url.origin === origin && ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
    } catch { return false; }
  };

  await context.routeWebSocket('**/*', socket => socket.close());
  await context.route('**/*', async route => {
    // Block requests from popup windows and requests without a frame.
    const request = route.request();
    let owned = false;
    try { owned = request.frame().page() === page; } catch { /* Deny unowned requests. */ }
    if (owned && allowed(request.url(), request.method())) await route.continue();
    else await route.abort('blockedbyclient');
  });
  context.on('page', popup => { void popup.close().catch(() => undefined); });

  // Playwright only routes the first request of a redirect chain.
  // Chromium Fetch checks every hop before the request goes to the network.
  const network = await context.newCDPSession(page);
  network.on('Fetch.requestPaused', ({ requestId, request }) => {
    const command = allowed(request.url, request.method)
      ? network.send('Fetch.continueRequest', { requestId })
      : network.send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
    void command.catch(() => { void context.close().catch(() => undefined); });
  });
  await network.send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
}
