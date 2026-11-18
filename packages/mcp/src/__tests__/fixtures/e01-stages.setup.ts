// Diagnostic-only setup: default Vitest scheduling, assertions and budgets remain intact.
import { writeFileSync, mkdirSync } from 'node:fs';
import { channel } from 'node:diagnostics_channel';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { afterAll, afterEach, beforeEach, expect } from 'vitest';
import * as knowledge from '@qap/knowledge';
import { SchemaValidator } from '@qap/shared';
import { BlackBoxCrawler } from '@qap/playwright-adapter';
import { PlaywrightRunner } from '@qap/playwright-runner';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

const directory = process.env.QAP_E01_TRACE;
if (!directory) throw new Error('QAP_E01_TRACE must name the diagnostic output directory');
mkdirSync(directory, { recursive: true });
const file = join(directory, `${process.pid}-${process.env.VITEST_WORKER_ID}.jsonl`);
let sequence = 0;
const events: object[] = [];
const write = (value: object) => events.push({ pid: process.pid, at: performance.timeOrigin + performance.now(), ...value });
const fixtureSpans = new Map<string, { id: number; start: number; cpu: NodeJS.CpuUsage }>();
channel('qap.e01.fixture').subscribe(value => {
  const event = value as { id: string; event: string; stage: string };
  if (event.event === 'begin') {
    const span = { id: ++sequence, start: performance.now(), cpu: process.cpuUsage() };
    fixtureSpans.set(event.id, span); write({ event: 'begin', id: span.id, stage: event.stage });
  } else {
    const span = fixtureSpans.get(event.id);
    if (!span) return;
    fixtureSpans.delete(event.id);
    const cpu = process.cpuUsage(span.cpu);
    write({ event: 'end', id: span.id, stage: event.stage, ms: performance.now() - span.start, cpu_ms: (cpu.user + cpu.system) / 1000 });
  }
});
const wrapped = new WeakSet<object>();
function wrap(target: object, key: string, stage: string, transform?: (result: object) => void) {
  const object = target as Record<string, unknown>;
  const original = object[key];
  if (typeof original !== 'function' || wrapped.has(original)) return;
  const replacement = function (this: unknown, ...args: unknown[]) {
    const id = ++sequence, start = performance.now(), cpu = process.cpuUsage();
    write({ event: 'begin', id, stage });
    const end = (result: unknown, error?: unknown) => {
      const usage = process.cpuUsage(cpu);
      write({ event: 'end', id, stage, ms: performance.now() - start, cpu_ms: (usage.user + usage.system) / 1000, error: error instanceof Error ? error.name : undefined });
      if (!error && result !== null && typeof result === 'object') transform?.(result);
      return result;
    };
    try {
      const result = (original as (...args: unknown[]) => unknown).apply(this, args);
      if (result instanceof Promise) return result.then((value: unknown) => end(value), (error: unknown) => { end(undefined, error); throw error; });
      return end(result);
    } catch (error) { end(undefined, error); throw error; }
  };
  wrapped.add(replacement);
  object[key] = replacement;
}
for (const packageName of ['shared', 'knowledge']) {
  const require = createRequire(resolve(`../../packages/${packageName}/package.json`));
  const Ajv = require('ajv') as { prototype: object };
  wrap(Ajv.prototype, 'compile', 'schema.compile');
}
for (const key of Object.getOwnPropertyNames(SchemaValidator.prototype)) {
  if (key.startsWith('validate')) wrap(SchemaValidator.prototype, key, 'schema.validate');
}
for (const key of ['commit', 'get', 'query', 'withWriteFence', 'close']) wrap(knowledge.SqliteKnowledgeAdapter.prototype, key, `sqlite.${key}`);
wrap(knowledge.LockManager.prototype, 'acquireModuleLock', 'lock.acquire');
for (const key of Object.getOwnPropertyNames(knowledge.FileSystemStorage.prototype)) {
  if (key !== 'constructor') wrap(knowledge.FileSystemStorage.prototype, key, `storage.${key}`);
}
wrap(BlackBoxCrawler.prototype, 'run', 'crawler.run');
wrap(PlaywrightRunner.prototype, 'execute', 'runner.execute');
wrap(PlaywrightRunner.prototype, 'executeStep', 'runner.step');
wrap(DatabaseSync.prototype, 'exec', 'sqlite.exec');
const sqlite = createRequire(import.meta.url)('node:sqlite') as { DatabaseSync: typeof DatabaseSync };
sqlite.DatabaseSync = new Proxy(sqlite.DatabaseSync, { construct(target, args: unknown[]) {
  const id = ++sequence, start = performance.now(), cpu = process.cpuUsage();
  write({ event: 'begin', id, stage: 'sqlite.open' });
  try { return Reflect.construct(target, args) as DatabaseSync; }
  finally {
    const usage = process.cpuUsage(cpu);
    write({ event: 'end', id, stage: 'sqlite.open', ms: performance.now() - start, cpu_ms: (usage.user + usage.system) / 1000 });
  }
} });
wrap(AbortController.prototype, 'abort', 'abort');
wrap(Server.prototype, 'close', 'server.transport_close');
function instrumentPage(page: object) {
  for (const key of ['goto', 'evaluate', 'close', 'screenshot']) wrap(page, key, `page.${key}`);
}
function instrumentContext(context: object) {
  wrap(context, 'newPage', 'context.newPage', instrumentPage);
  wrap(context, 'close', 'context.close');
}
// Only browser-using files install browser probes. Loading the driver in every
// metadata-only worker would undo the very resource fix being measured.
const browserFile = /(?:lifecycle-v3-e2e|test-handler|discovery-handler|p4-4-auth-lifecycle|p4-5a2-integrity)\.test\.ts$/.test(expect.getState().testPath ?? '');
for (const packageName of browserFile ? ['mcp', 'playwright-adapter', 'playwright-runner'] : []) {
  const require = createRequire(resolve(`../../packages/${packageName}/package.json`));
  const { chromium } = require('playwright-core') as typeof import('playwright-core');
  wrap(chromium, 'launch', 'chromium.launch', (browser: object) => {
    wrap(browser, 'newContext', 'browser.newContext', instrumentContext);
    wrap(browser, 'close', 'browser.close');
  });
}
let last = performance.now(), lastCpu = process.cpuUsage();
const timer = setInterval(() => {
  const now = performance.now(), cpu = process.cpuUsage(lastCpu);
  write({ event: 'sample', lag_ms: now - last - 100, cpu_ms: (cpu.user + cpu.system) / 1000, rss: process.memoryUsage().rss });
  last = now; lastCpu = process.cpuUsage();
}, 100);
timer.unref();
beforeEach(() => write({ event: 'test.begin', name: expect.getState().currentTestName }));
afterEach(() => write({ event: 'test.afterEach', name: expect.getState().currentTestName }));
afterAll(() => {
  clearInterval(timer); write({ event: 'file.end' });
  writeFileSync(file, events.map(event => JSON.stringify(event)).join('\n') + '\n');
});
