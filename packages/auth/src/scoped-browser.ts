import type { Page } from 'playwright-core';

/** Restrict an isolated Chromium context to a single page and exact HTTP origin. */
export async function restrictChromiumPage(page: Page, origin: string, readOnly = false, policy?: {
  read: (url: string) => boolean;
  write: (url: string, method: string, body: string | undefined, commit: boolean) => boolean;
}): Promise<void> {
  const context = page.context();
  const allowed = (value: string, method: string, body: string | undefined, commit: boolean): boolean => {
    try {
      const url = new URL(value);
      if (url.origin !== origin || !['http:', 'https:'].includes(url.protocol) || url.username || url.password) return false;
      if (policy) return method === 'GET' || method === 'HEAD' ? policy.read(value) : policy.write(value, method, body, commit);
      return !readOnly || method === 'GET' || method === 'HEAD';
    } catch { return false; }
  };

  await context.routeWebSocket('**/*', socket => socket.close());
  await context.route('**/*', async route => {
    // Block requests from popup windows and requests without a frame.
    const request = route.request();
    let owned = false;
    try { owned = request.frame().page() === page; } catch { /* Deny unowned requests. */ }
    if (owned && allowed(request.url(), request.method(), request.postData() ?? undefined, false)) await route.continue();
    else await route.abort('blockedbyclient');
  });
  context.on('page', popup => { void popup.close().catch(() => undefined); });

  // Playwright only routes the first request of a redirect chain.
  // Chromium Fetch checks every hop before the request goes to the network.
  const network = await context.newCDPSession(page);
  network.on('Fetch.requestPaused', ({ requestId, request }) => {
    const command = allowed(request.url, request.method, request.postData, true)
      ? network.send('Fetch.continueRequest', { requestId })
      : network.send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
    void command.catch(() => { void context.close().catch(() => undefined); });
  });
  await network.send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
}
