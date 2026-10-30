import { createServer } from 'node:net';

import { chromium, type Browser } from 'playwright-core';

import type { CrawlerDependencies } from './types.js';

/** Deny-only loopback proxy: never resolves or forwards any target, including CONNECT. */
export async function startDenyProxy(onConnection: () => void) {
  const proxy = createServer(socket => { onConnection(); socket.destroy(); });
  await new Promise<void>((resolve, reject) => {
    proxy.once('error', reject);
    proxy.listen(0, '127.0.0.1', () => { proxy.removeListener('error', reject); resolve(); });
  });
  const address = proxy.address();
  if (!address || typeof address === 'string') throw new Error('PROXY_UNAVAILABLE');
  return { url: `http://127.0.0.1:${address.port}`, close: () => new Promise<void>((resolve, reject) =>
    proxy.close(error => error ? reject(new Error('PROXY_CLEANUP_FAILED')) : resolve())) };
}

export async function launchIsolated(proxy: string, choice: CrawlerDependencies['browser'], timeout: number): Promise<Browser> {
  const choices = choice ? [choice] : [{ channel: 'chrome' as const }, { channel: 'msedge' as const }, {}];
  const deadline = Date.now() + timeout;
  for (const selected of choices) {
    if (Date.now() >= deadline) break;
    try {
      return await chromium.launch({ headless: true, timeout: Math.max(1, deadline - Date.now()),
        ...(selected.channel ? { channel: selected.channel } : {}),
        ...(selected.executable_path ? { executablePath: selected.executable_path } : {}),
        proxy: { server: proxy, bypass: '<-loopback>' },
        args: ['--disable-background-networking', '--disable-component-update', '--disable-sync',
          '--dns-prefetch-disable', '--disable-quic', '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1',
          '--force-webrtc-ip-handling-policy=disable_non_proxied_udp'] });
    } catch { /* only supported clean Chromium channels; never a user profile */ }
  }
  throw new Error('BROWSER_UNAVAILABLE');
}
