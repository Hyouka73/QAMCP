import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import zlib from 'node:zlib';

import type { BrowserContext, Page } from 'playwright-core';
import type {
  ExecutionArtifactError,
  ExecutionTimelineStep,
} from '@qap/shared';

const require = createRequire(import.meta.url);

const SENSITIVE_FIELD_RE =
  /(?:password|passwd|pwd|secret|token|api[_-]?key|private[_-]?key|client[_-]?secret|access[_-]?token|refresh[_-]?token|authorization|cookie|set-cookie|credential|cvv|pin|data-qap-redact)/i;

const SENSITIVE_HEADER_NAMES = new Set([
  'authorization',
  'proxy-authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'x-auth-token',
  'x-session-token',
  'x-csrf-token',
]);

const DOM_SANITIZER_CSS = `
input[type="password"],
[data-qap-redact],
input[name*="password" i],
input[name*="secret" i],
input[name*="token" i],
input[name*="api_key" i],
input[name*="apikey" i],
input[id*="password" i],
input[id*="secret" i],
input[id*="token" i],
input[id*="api_key" i] {
  -webkit-text-security: disc !important;
  filter: blur(8px) !important;
  color: transparent !important;
  text-shadow: 0 0 8px rgba(0, 0, 0, 0.85) !important;
}
`;

export function assertNoReparsePointChain(targetPath: string, stopAtRoot?: string): void {
  const resolvedTarget = path.resolve(targetPath);
  const resolvedStop = stopAtRoot ? path.resolve(stopAtRoot) : undefined;

  const chain: string[] = [];
  let cursor = resolvedTarget;
  while (true) {
    chain.unshift(cursor);
    if (resolvedStop && cursor.toLowerCase() === resolvedStop.toLowerCase()) {
      break;
    }
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }

  for (const current of chain) {
    if (!fs.existsSync(current)) continue;
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink()) {
      throw new Error(`Unsafe symbolic link or reparse point rejected: ${current}`);
    }
  }
}

export function resolveConfinedArtifactPath(projectRoot: string, relativePath: string): string {
  const trimmed = relativePath.trim().replace(/\\/g, '/');
  if (!trimmed || path.isAbsolute(trimmed)) {
    throw new Error(`Artifact path must be a non-empty project-relative path: ${relativePath}`);
  }
  const segments = trimmed.split('/');
  if (segments.some((seg) => seg === '..' || seg === '.' || seg.length === 0)) {
    throw new Error(`Path traversal segment rejected in artifact path: ${relativePath}`);
  }
  if (segments[0] !== '.qa') {
    throw new Error(`Artifact path must remain confined under .qa/: ${relativePath}`);
  }

  assertNoReparsePointChain(projectRoot);
  const canonicalRoot = fs.existsSync(projectRoot)
    ? fs.realpathSync.native(projectRoot)
    : path.resolve(projectRoot);
  const candidate = path.resolve(canonicalRoot, ...segments);
  const rel = path.relative(canonicalRoot, candidate);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`Artifact path escapes project root: ${relativePath}`);
  }
  assertNoReparsePointChain(candidate, canonicalRoot);
  return candidate;
}

export function ensureConfinedDir(projectRoot: string, relativeDir: string): string {
  const dirPath = resolveConfinedArtifactPath(projectRoot, relativeDir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true, mode: 0o700 });
  }
  assertNoReparsePointChain(dirPath, projectRoot);
  return dirPath;
}

export function isSensitiveSelectorOrField(
  selector?: string | null,
  value?: string | null,
): boolean {
  if (selector && SENSITIVE_FIELD_RE.test(selector)) {
    return true;
  }
  if (value && /(?:Bearer\s+[A-Za-z0-9._~+/=-]{6,}|Basic\s+[A-Za-z0-9+/=]{6,})/i.test(value)) {
    return true;
  }
  return false;
}

function escapeRegExp(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function sanitizeEvidenceText(
  input: string | null | undefined,
  extraSecrets: readonly string[] = [],
): string {
  if (input === null || input === undefined) return '';
  let text = String(input);
  if (!text) return '';

  // Redact explicit secret values first (longest first to avoid partial replacement)
  const validSecrets = Array.from(
    new Set(
      extraSecrets
        .filter((s): s is string => typeof s === 'string' && s.trim().length >= 4)
        .map((s) => s.trim()),
    ),
  ).sort((a, b) => b.length - a.length);

  for (const secret of validSecrets) {
    if (secret === '[REDACTED]') continue;
    text = text.replace(new RegExp(escapeRegExp(secret), 'g'), '[REDACTED]');
  }

  // Redact Authorization: Bearer / Basic tokens
  text = text.replace(/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{4,}/gi, '$1 [REDACTED]');

  // Redact query string parameters with sensitive keys
  text = text.replace(
    /([?&](?:password|passwd|pwd|secret|token|api[_-]?key|access[_-]?token|refresh[_-]?token|auth|session[_-]?id)=)([^&#\s"']+)/gi,
    '$1[REDACTED]',
  );

  // Redact JSON or key=value pairs with sensitive keys
  text = text.replace(
    /("(?:password|passwd|pwd|secret|token|api[_-]?key|private[_-]?key|client[_-]?secret|access[_-]?token|refresh[_-]?token|authorization|cookie|set-cookie)"\s*:\s*")([^"]*)(")/gi,
    '$1[REDACTED]$3',
  );

  // Redact cookie style key=value pairs for sensitive cookie names
  text = text.replace(
    /\b([a-z0-9_-]*(?:auth|session|token|sid|jwt|secret|api[_-]?key)[a-z0-9_-]*=)([^;\s"']+)/gi,
    '$1[REDACTED]',
  );

  return text;
}

export function extractSecretsFromStorageState(storageState: unknown): string[] {
  const secrets: string[] = [];
  if (!storageState || typeof storageState !== 'object') return secrets;
  const state = storageState as {
    cookies?: Array<{ name?: string; value?: string }>;
    origins?: Array<{ localStorage?: Array<{ name?: string; value?: string }> }>;
  };

  if (Array.isArray(state.cookies)) {
    for (const cookie of state.cookies) {
      if (typeof cookie?.value === 'string' && cookie.value.trim().length >= 4) {
        secrets.push(cookie.value.trim());
      }
    }
  }

  if (Array.isArray(state.origins)) {
    for (const origin of state.origins) {
      if (!Array.isArray(origin?.localStorage)) continue;
      for (const entry of origin.localStorage) {
        if (
          typeof entry?.value === 'string' &&
          entry.value.trim().length >= 4 &&
          isSensitiveSelectorOrField(entry.name, entry.value)
        ) {
          secrets.push(entry.value.trim());
        }
      }
    }
  }

  return secrets;
}

export async function installEvidenceDomSanitizer(
  context: BrowserContext | unknown,
  page: Page | unknown,
): Promise<void> {
  try {
    const ctx = context as { addInitScript?: (script: string) => Promise<void> } | null;
    if (ctx && typeof ctx.addInitScript === 'function') {
      await ctx.addInitScript(`
        (() => {
          const injectStyle = () => {
            if (!document || !document.head) return;
            if (document.getElementById('__qap_evidence_sanitizer_css')) return;
            const style = document.createElement('style');
            style.id = '__qap_evidence_sanitizer_css';
            style.textContent = ${JSON.stringify(DOM_SANITIZER_CSS)};
            document.head.appendChild(style);
          };
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', injectStyle, { once: true });
          } else {
            injectStyle();
          }
        })();
      `);
    }
  } catch {
    // Ignore on mocks or restricted contexts
  }

  try {
    const pg = page as { addStyleTag?: (opts: { content: string }) => Promise<unknown> } | null;
    if (pg && typeof pg.addStyleTag === 'function') {
      await pg.addStyleTag({ content: DOM_SANITIZER_CSS });
    }
  } catch {
    // Ignore on mocks or before navigation
  }
}

export async function maskSensitiveDomBeforeCapture(page: Page | unknown): Promise<number> {
  try {
    const pg = page as {
      evaluate?: <R>(fn: () => R) => Promise<R>;
      addStyleTag?: (opts: { content: string }) => Promise<unknown>;
    } | null;
    if (!pg || typeof pg.evaluate !== 'function') {
      return 0;
    }

    const maskedCount = await pg.evaluate(() => {
      const doc = (globalThis as unknown as { document?: any }).document;
      if (!doc) return 0;
      if (doc.head && !doc.getElementById('__qap_evidence_sanitizer_css')) {
        const style = doc.createElement('style');
        style.id = '__qap_evidence_sanitizer_css';
        style.textContent = `
          input[type="password"],
          [data-qap-redact],
          input[name*="password" i],
          input[name*="secret" i],
          input[name*="token" i],
          input[name*="api_key" i],
          input[name*="apikey" i],
          input[id*="password" i],
          input[id*="secret" i],
          input[id*="token" i],
          input[id*="api_key" i] {
            -webkit-text-security: disc !important;
            filter: blur(8px) !important;
            color: transparent !important;
            text-shadow: 0 0 8px rgba(0, 0, 0, 0.85) !important;
          }
        `;
        doc.head.appendChild(style);
      }

      const selector = [
        'input[type="password"]',
        '[data-qap-redact]',
        'input[name*="password" i]',
        'input[name*="secret" i]',
        'input[name*="token" i]',
        'input[name*="api_key" i]',
        'input[name*="apikey" i]',
        'input[id*="password" i]',
        'input[id*="secret" i]',
        'input[id*="token" i]',
        'input[id*="api_key" i]',
      ].join(', ');

      const nodes = Array.from(doc.querySelectorAll(selector)) as any[];
      for (const el of nodes) {
        if (el && el.style) {
          el.style.setProperty('-webkit-text-security', 'disc', 'important');
          el.style.setProperty('filter', 'blur(8px)', 'important');
        }
        if (el && typeof el.hasAttribute === 'function' && el.hasAttribute('data-qap-redact')) {
          if (typeof el.value === 'string' && el.value.length > 0 && el.tagName === 'INPUT') {
            el.setAttribute('data-qap-masked', 'true');
          } else if (typeof el.textContent === 'string' && el.textContent.trim().length > 0) {
            el.textContent = '[REDACTED]';
            el.setAttribute('data-qap-masked', 'true');
          }
        }
      }
      return nodes.length;
    });
    return typeof maskedCount === 'number' ? maskedCount : 0;
  } catch {
    return 0;
  }
}

export interface StepScreenshotCaptureResult {
  relativePath: string | null;
  focused: boolean;
  maskedDomElements: number;
  error: string | null;
}

export async function captureFocusedOrFallbackScreenshot(params: {
  page: Page;
  projectRoot: string;
  screenshotsDir: string;
  filename: string;
  selector?: string | null;
  extraSecrets?: readonly string[];
}): Promise<StepScreenshotCaptureResult> {
  const { page, projectRoot, screenshotsDir, filename, selector, extraSecrets = [] } = params;
  const safeName = filename.endsWith('.png') ? filename : `${filename}.png`;
  const relativePath = `.qa/reports/screenshots/${safeName}`;

  let targetPath: string;
  try {
    ensureConfinedDir(projectRoot, '.qa/reports/screenshots');
    targetPath = resolveConfinedArtifactPath(projectRoot, relativePath);
  } catch (err: unknown) {
    const rawMsg = err instanceof Error ? err.message : String(err);
    return {
      relativePath: null,
      focused: false,
      maskedDomElements: 0,
      error: sanitizeEvidenceText(rawMsg, extraSecrets),
    };
  }

  // Ensure target directory matches screenshotsDir if custom
  const dirToEnsure = path.dirname(targetPath);
  if (!fs.existsSync(dirToEnsure)) {
    fs.mkdirSync(dirToEnsure, { recursive: true, mode: 0o700 });
  }
  if (!fs.existsSync(screenshotsDir)) {
    try {
      fs.mkdirSync(screenshotsDir, { recursive: true, mode: 0o700 });
    } catch {
      // Ignore if screenshotsDir is virtual in mock tests
    }
  }

  const maskedDomElements = await maskSensitiveDomBeforeCapture(page);

  const pageAny = page as unknown as {
    locator?: (sel: string) => {
      first?: () => { screenshot?: (opts: { path: string; timeout?: number }) => Promise<Buffer> };
      screenshot?: (opts: { path: string; timeout?: number }) => Promise<Buffer>;
    };
    screenshot?: (opts: { path: string; fullPage?: boolean }) => Promise<Buffer>;
  };

  if (selector && selector.trim().length > 0 && typeof pageAny.locator === 'function') {
    try {
      const locatorObj = pageAny.locator(selector);
      const targetLocator =
        locatorObj && typeof locatorObj.first === 'function' ? locatorObj.first() : locatorObj;
      if (targetLocator && typeof targetLocator.screenshot === 'function') {
        await targetLocator.screenshot({ path: targetPath, timeout: 2500 });
        return {
          relativePath,
          focused: true,
          maskedDomElements,
          error: null,
        };
      }
    } catch {
      // Fall through to fullPage screenshot when focused element screenshot fails
    }
  }

  if (typeof pageAny.screenshot !== 'function') {
    return {
      relativePath: null,
      focused: false,
      maskedDomElements,
      error: 'page.screenshot no disponible en el contexto actual',
    };
  }

  try {
    await pageAny.screenshot({ path: targetPath, fullPage: true });
    return {
      relativePath,
      focused: false,
      maskedDomElements,
      error: null,
    };
  } catch (err: unknown) {
    const rawMsg = err instanceof Error ? err.message : String(err);
    return {
      relativePath: null,
      focused: false,
      maskedDomElements,
      error: sanitizeEvidenceText(rawMsg, extraSecrets),
    };
  }
}

function sanitizeJsonObjectInPlace(value: unknown, extraSecrets: readonly string[]): unknown {
  if (typeof value === 'string') {
    return sanitizeEvidenceText(value, extraSecrets);
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      if (
        item &&
        typeof item === 'object' &&
        !Array.isArray(item) &&
        typeof (item as { name?: unknown }).name === 'string' &&
        'value' in item
      ) {
        const headerOrParam = item as { name: string; value: unknown; __playwright_value_?: unknown };
        const lowerName = headerOrParam.name.toLowerCase();
        if (SENSITIVE_HEADER_NAMES.has(lowerName) || SENSITIVE_FIELD_RE.test(lowerName)) {
          headerOrParam.value = '[REDACTED]';
          if ('__playwright_value_' in headerOrParam) {
            headerOrParam.__playwright_value_ = '[REDACTED]';
          }
        }
      }
      value[i] = sanitizeJsonObjectInPlace(item, extraSecrets);
    }
    return value;
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const isSensitiveElementObj =
      (typeof obj.type === 'string' && obj.type.toLowerCase() === 'password') ||
      (typeof obj.name === 'string' && SENSITIVE_FIELD_RE.test(obj.name)) ||
      (typeof obj.id === 'string' && SENSITIVE_FIELD_RE.test(obj.id)) ||
      'data-qap-redact' in obj;

    for (const key of Object.keys(obj)) {
      const lowerKey = key.toLowerCase();
      if (
        isSensitiveElementObj &&
        (lowerKey === 'value' || lowerKey === '__playwright_value_') &&
        typeof obj[key] === 'string'
      ) {
        obj[key] = '[REDACTED]';
      } else if (
        (SENSITIVE_HEADER_NAMES.has(lowerKey) ||
          lowerKey === 'password' ||
          lowerKey === 'passwd' ||
          lowerKey === 'secret' ||
          lowerKey === 'token' ||
          lowerKey === 'api_key' ||
          lowerKey === 'apikey' ||
          lowerKey === 'access_token' ||
          lowerKey === 'refresh_token' ||
          lowerKey === 'client_secret' ||
          lowerKey === 'private_key') &&
        typeof obj[key] === 'string'
      ) {
        obj[key] = '[REDACTED]';
      } else {
        obj[key] = sanitizeJsonObjectInPlace(obj[key], extraSecrets);
      }
    }
    return obj;
  }
  return value;
}

function sanitizeTraceEntryText(rawText: string, extraSecrets: readonly string[]): string {
  const lines = rawText.split('\n');
  const sanitizedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return line;
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        const cleaned = sanitizeJsonObjectInPlace(parsed, extraSecrets);
        return JSON.stringify(cleaned);
      } catch {
        return sanitizeEvidenceText(line, extraSecrets);
      }
    }
    return sanitizeEvidenceText(line, extraSecrets);
  });
  return sanitizedLines.join('\n');
}

interface ZipEntryData {
  name: string;
  data: Buffer;
  compressionMethod: number;
  dosTime: number;
  dosDate: number;
}

function findEocdOffset(buf: Buffer): number {
  const minEocdSize = 22;
  if (buf.length < minEocdSize) return -1;
  const maxComment = 0xffff;
  const start = Math.max(0, buf.length - minEocdSize - maxComment);
  for (let i = buf.length - minEocdSize; i >= start; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      return i;
    }
  }
  return -1;
}

export function readZipEntries(zipBuffer: Buffer): ZipEntryData[] {
  const eocdOffset = findEocdOffset(zipBuffer);
  if (eocdOffset < 0) {
    throw new Error('Invalid ZIP archive: End of Central Directory signature not found');
  }

  const totalEntries = zipBuffer.readUInt16LE(eocdOffset + 10);
  const cdOffset = zipBuffer.readUInt32LE(eocdOffset + 16);
  const entries: ZipEntryData[] = [];

  let ptr = cdOffset;
  for (let i = 0; i < totalEntries; i++) {
    if (ptr + 46 > zipBuffer.length || zipBuffer.readUInt32LE(ptr) !== 0x02014b50) {
      throw new Error('Invalid ZIP archive: Central Directory header corrupted');
    }
    const compressionMethod = zipBuffer.readUInt16LE(ptr + 10);
    const dosTime = zipBuffer.readUInt16LE(ptr + 12);
    const dosDate = zipBuffer.readUInt16LE(ptr + 14);
    const compressedSize = zipBuffer.readUInt32LE(ptr + 20);
    const fileNameLen = zipBuffer.readUInt16LE(ptr + 28);
    const extraLen = zipBuffer.readUInt16LE(ptr + 30);
    const commentLen = zipBuffer.readUInt16LE(ptr + 32);
    const localHeaderOffset = zipBuffer.readUInt32LE(ptr + 42);

    const name = zipBuffer.subarray(ptr + 46, ptr + 46 + fileNameLen).toString('utf8');

    if (
      localHeaderOffset + 30 > zipBuffer.length ||
      zipBuffer.readUInt32LE(localHeaderOffset) !== 0x04034b50
    ) {
      throw new Error(`Invalid ZIP archive: Local file header corrupted for ${name}`);
    }
    const localNameLen = zipBuffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLen = zipBuffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
    const compressedSlice = zipBuffer.subarray(dataStart, dataStart + compressedSize);

    let uncompressed: Buffer;
    if (compressionMethod === 0) {
      uncompressed = Buffer.from(compressedSlice);
    } else if (compressionMethod === 8) {
      uncompressed = zlib.inflateRawSync(compressedSlice);
    } else {
      throw new Error(`Unsupported ZIP compression method ${compressionMethod} in ${name}`);
    }

    entries.push({
      name,
      data: uncompressed,
      compressionMethod,
      dosTime,
      dosDate,
    });

    ptr += 46 + fileNameLen + extraLen + commentLen;
  }

  return entries;
}

export function buildZipBuffer(entries: readonly ZipEntryData[]): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf8');
    const uncompressed = entry.data;
    const crc = zlib.crc32(uncompressed) >>> 0;
    const method = entry.compressionMethod === 0 ? 0 : 8;
    const compressed = method === 8 ? zlib.deflateRawSync(uncompressed) : uncompressed;

    const localHeader = Buffer.alloc(30 + nameBuf.length);
    localHeader.writeUInt32LE(0x04034b50, 0); // signature
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0, 6); // general purpose bit flag (0 = sizes in local header)
    localHeader.writeUInt16LE(method, 8);
    localHeader.writeUInt16LE(entry.dosTime || 0, 10);
    localHeader.writeUInt16LE(entry.dosDate || 0x21, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(uncompressed.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28); // extra field length
    nameBuf.copy(localHeader, 30);

    localParts.push(localHeader, compressed);

    const centralHeader = Buffer.alloc(46 + nameBuf.length);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4); // version made by
    centralHeader.writeUInt16LE(20, 6); // version needed
    centralHeader.writeUInt16LE(0, 8); // flags
    centralHeader.writeUInt16LE(method, 10);
    centralHeader.writeUInt16LE(entry.dosTime || 0, 12);
    centralHeader.writeUInt16LE(entry.dosDate || 0x21, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(uncompressed.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30); // extra len
    centralHeader.writeUInt16LE(0, 32); // comment len
    centralHeader.writeUInt16LE(0, 34); // disk number
    centralHeader.writeUInt16LE(0, 36); // internal attrs
    centralHeader.writeUInt32LE(0, 38); // external attrs
    centralHeader.writeUInt32LE(offset, 42); // local header offset
    nameBuf.copy(centralHeader, 46);

    centralParts.push(centralHeader);
    offset += localHeader.length + compressed.length;
  }

  const centralDirSize = centralParts.reduce((acc, b) => acc + b.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDirSize, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, ...centralParts, eocd]);
}

function isTextTraceEntry(entryName: string): boolean {
  const lower = entryName.toLowerCase();
  return (
    lower.endsWith('.trace') ||
    lower.endsWith('.network') ||
    lower.endsWith('.stacks') ||
    lower.endsWith('.json') ||
    lower.endsWith('.html') ||
    lower.endsWith('.txt') ||
    lower.endsWith('.har')
  );
}

export function sanitizePlaywrightTraceZip(
  zipPath: string,
  extraSecrets: readonly string[] = [],
): { sanitizedEntries: number; entries: string[] } {
  const rawZip = fs.readFileSync(zipPath);
  const entries = readZipEntries(rawZip);
  let sanitizedEntries = 0;

  for (const entry of entries) {
    if (isTextTraceEntry(entry.name)) {
      const originalText = entry.data.toString('utf8');
      const cleanedText = sanitizeTraceEntryText(originalText, extraSecrets);
      if (cleanedText !== originalText) {
        entry.data = Buffer.from(cleanedText, 'utf8');
        sanitizedEntries++;
      }
    }
  }

  const rebuilt = buildZipBuffer(entries);
  const tmpPath = `${zipPath}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmpPath, rebuilt, { mode: 0o600 });
  fs.renameSync(tmpPath, zipPath);

  return {
    sanitizedEntries,
    entries: entries.map((e) => e.name),
  };
}

export function inspectZipArchive(zipPath: string): {
  valid: boolean;
  entries: Array<{ name: string; uncompressedSize: number; textContent?: string }>;
} {
  const raw = fs.readFileSync(zipPath);
  if (raw.length < 4 || raw.readUInt32LE(0) !== 0x04034b50) {
    return { valid: false, entries: [] };
  }
  const parsed = readZipEntries(raw);
  return {
    valid: parsed.length > 0,
    entries: parsed.map((e) => ({
      name: e.name,
      uncompressedSize: e.data.length,
      textContent: isTextTraceEntry(e.name) ? e.data.toString('utf8') : undefined,
    })),
  };
}

export function persistRuntimeEvidenceBundle(params: {
  projectRoot: string;
  runId: string;
  moduleKey: string;
  status: string;
  timestamp: string;
  durationMs: number;
  totalCases: number;
  passed: number;
  failed: number;
  skipped: number;
  videoRelativePath: string | null;
  traceRelativePath: string | null;
  timelineRelativePath: string | null;
  timeline: readonly ExecutionTimelineStep[];
  artifactErrors: readonly ExecutionArtifactError[];
}): { timelineRelativePath: string | null; error: string | null } {
  const {
    projectRoot,
    runId,
    moduleKey,
    status,
    timestamp,
    durationMs,
    totalCases,
    passed,
    failed,
    skipped,
    videoRelativePath,
    traceRelativePath,
    timeline,
    artifactErrors,
  } = params;

  const safeRunId = runId.replace(/[^a-zA-Z0-9._-]/g, '_');
  const runDirRel = `.qa/runtime/runs/${safeRunId}`;
  const artifactsDirRel = `${runDirRel}/artifacts`;
  const timelineRel = params.timelineRelativePath ?? `${artifactsDirRel}/timeline.json`;

  try {
    ensureConfinedDir(projectRoot, artifactsDirRel);
    const timelineAbs = resolveConfinedArtifactPath(projectRoot, timelineRel);
    fs.writeFileSync(
      timelineAbs,
      JSON.stringify(
        {
          _version: '1',
          run_id: safeRunId,
          module: moduleKey,
          generated_at: new Date().toISOString(),
          steps: timeline,
          artifact_errors: artifactErrors,
        },
        null,
        2,
      ),
      { encoding: 'utf8', mode: 0o600 },
    );

    const finishedAt = new Date().toISOString();
    const normalizedOverallStatus: 'passed' | 'failed' | 'partial' =
      status === 'passed' ? 'passed' : status === 'partial' ? 'partial' : 'failed';

    let totalBytes = 0;
    const artifactsDirAbs = resolveConfinedArtifactPath(projectRoot, artifactsDirRel);
    if (fs.existsSync(artifactsDirAbs)) {
      for (const f of fs.readdirSync(artifactsDirAbs)) {
        const fp = path.join(artifactsDirAbs, f);
        try {
          const st = fs.statSync(fp);
          if (st.isFile()) totalBytes += st.size;
        } catch {
          // ignore
        }
      }
    }

    const runRecord = {
      runId: safeRunId,
      flowId: moduleKey,
      startedAt: timestamp,
      finishedAt,
      totalDurationMs: durationMs,
      overallStatus: normalizedOverallStatus,
      environment: {
        gitCommit: '',
        gitBranch: '',
        hostOs: process.platform,
        runnerFramework: 'playwright-core',
      },
      steps: timeline.map((st, idx) => ({
        stepIndex: idx,
        capabilityId: `${st.case_id}:${st.action}:${st.step_index}`,
        status: (st.status === 'passed' ? 'passed' : st.status === 'failed' ? 'failed' : 'skipped') as
          | 'passed'
          | 'failed'
          | 'blocked'
          | 'skipped',
        durationMs: st.duration_ms,
        timestamp: st.started_at,
        assertions:
          st.expected !== null || st.observed !== null
            ? [
                {
                  expected: st.expected ?? null,
                  observed: st.observed ?? null,
                  passed: st.status === 'passed',
                },
              ]
            : [],
        ...(st.screenshot ? { screenshotFile: st.screenshot } : {}),
      })),
      artifacts: {
        totalDiskUsageBytes: totalBytes,
        ...(videoRelativePath ? { videoFile: path.posix.basename(videoRelativePath) } : {}),
        ...(traceRelativePath ? { traceFile: path.posix.basename(traceRelativePath) } : {}),
        screenshots: timeline.map((s) => s.screenshot).filter((s): s is string => Boolean(s)),
      },
      lifecycle: {
        pinned: false,
        createdAt: timestamp,
      },
      summary: {
        totalCases,
        passed,
        failed,
        skipped,
      },
    };

    const runJsonAbs = resolveConfinedArtifactPath(projectRoot, `${runDirRel}/run.json`);
    fs.writeFileSync(runJsonAbs, JSON.stringify(runRecord, null, 2), {
      encoding: 'utf8',
      mode: 0o600,
    });

    // Register in .qa/runtime/qap.sqlite using QapDatabase's exact SCHEMA_DDL so PruningEngine / qap prune applies 7d/14d/30d retention
    ensureConfinedDir(projectRoot, '.qa/runtime');
    const sqliteAbs = resolveConfinedArtifactPath(projectRoot, '.qa/runtime/qap.sqlite');
    const sqlite = require('node:sqlite') as typeof import('node:sqlite');
    const db = new sqlite.DatabaseSync(sqliteAbs);
    try {
      db.exec('PRAGMA journal_mode = WAL;');
      db.exec('PRAGMA foreign_keys = ON;');
      db.exec(`
        CREATE TABLE IF NOT EXISTS runs (
          run_id TEXT PRIMARY KEY,
          flow_id TEXT,
          started_at TEXT NOT NULL,
          finished_at TEXT NOT NULL,
          overall_status TEXT NOT NULL CHECK (overall_status IN ('passed','failed','partial')),
          total_duration_ms INTEGER NOT NULL,
          git_commit TEXT,
          git_branch TEXT,
          total_disk_usage_bytes INTEGER NOT NULL DEFAULT 0,
          pinned INTEGER NOT NULL DEFAULT 0,
          expires_at TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_runs_flow ON runs(flow_id);
        CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(overall_status);
        CREATE INDEX IF NOT EXISTS idx_runs_started ON runs(started_at);
        CREATE TABLE IF NOT EXISTS step_results (
          run_id TEXT NOT NULL REFERENCES runs(run_id) ON DELETE CASCADE,
          step_index INTEGER NOT NULL,
          capability_id TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('passed','failed','blocked','skipped')),
          duration_ms INTEGER NOT NULL,
          screenshot_file TEXT,
          PRIMARY KEY (run_id, step_index)
        );
        CREATE INDEX IF NOT EXISTS idx_steps_capability ON step_results(capability_id);
      `);
      db.prepare(`
        INSERT INTO runs (
          run_id, flow_id, started_at, finished_at, overall_status,
          total_duration_ms, git_commit, git_branch,
          total_disk_usage_bytes, pinned, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?, 0, NULL)
        ON CONFLICT(run_id) DO UPDATE SET
          flow_id = excluded.flow_id,
          started_at = excluded.started_at,
          finished_at = excluded.finished_at,
          overall_status = excluded.overall_status,
          total_duration_ms = excluded.total_duration_ms,
          total_disk_usage_bytes = excluded.total_disk_usage_bytes
      `).run(
        runRecord.runId,
        runRecord.flowId,
        runRecord.startedAt,
        runRecord.finishedAt,
        runRecord.overallStatus,
        runRecord.totalDurationMs,
        runRecord.artifacts.totalDiskUsageBytes,
      );
      db.prepare('DELETE FROM step_results WHERE run_id = ?').run(runRecord.runId);
      const insertStep = db.prepare(`
        INSERT INTO step_results (run_id, step_index, capability_id, status, duration_ms, screenshot_file)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const st of runRecord.steps) {
        insertStep.run(
          runRecord.runId,
          st.stepIndex,
          st.capabilityId,
          st.status,
          st.durationMs,
          st.screenshotFile ?? null,
        );
      }
    } finally {
      db.close();
    }

    return { timelineRelativePath: timelineRel, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { timelineRelativePath: null, error: sanitizeEvidenceText(msg) };
  }
}
