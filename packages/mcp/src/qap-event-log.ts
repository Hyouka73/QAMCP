import { createHash, randomUUID } from 'node:crypto';
import { appendFileSync, existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, parse, resolve } from 'node:path';

export interface QapEventInput {
  readonly workspace?: string;
  readonly conversationId?: string;
  readonly requestId: string;
  readonly tool: string;
  readonly args: unknown;
  readonly result?: unknown;
  readonly errorCode?: string;
  readonly durationMs: number;
}

const SECRET_KEY = /password|passphrase|cookie|token|secret|credential|authorization|session|header|raw|body|answer|username|account/i;
const FREE_TEXT_KEY = /description|details|comment|message|prompt|text|content|notes|objective|expected/i;
const OBJECT_RESULT_FIELDS = ['status', 'code', 'fase', 'phase', 'verified', 'retryable', 'session_scope', 'next_action', 'tool', 'profile', 'environment', 'discovery_revision_id'];
const loggerSessionId = randomUUID();
const latestPhase = new Map<string, string>();

function privateDirectory(path: string): void {
  const absolute = resolve(path);
  const root = parse(absolute).root;
  let current = root;
  for (const part of absolute.slice(root.length).split(/[\\/]+/).filter(Boolean)) {
    current = join(current, part);
    if (existsSync(current)) {
      const stat = lstatSync(current);
      if (stat.isSymbolicLink() || (stat.isFile() && stat.nlink !== 1) || realpathSync(current).toLowerCase() !== resolve(current).toLowerCase()) {
        throw new Error('Unsafe QAP event log path.');
      }
    } else mkdirSync(current, { mode: 0o700 });
  }
}

function ensurePrivateFile(path: string): void {
  if (!existsSync(path)) {
    try { writeFileSync(path, '', { encoding: 'utf8', flag: 'wx', mode: 0o600 }); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; }
  }
  const stat = lstatSync(path);
  if (stat.isSymbolicLink() || !stat.isFile() || stat.nlink !== 1 ||
      realpathSync(path).toLowerCase() !== resolve(path).toLowerCase()) {
    throw new Error('Unsafe QAP event log file.');
  }
}

function safeValue(value: unknown, key = ''): unknown {
  if (SECRET_KEY.test(key) || FREE_TEXT_KEY.test(key)) return '[redacted]';
  if (typeof value === 'string') {
    if (/(?:targetPath|workspace|projectRoot)$/i.test(key)) return `sha256:${createHash('sha256').update(value).digest('hex').slice(0, 16)}`;
    if (value.length > 256 || /^https?:\/\/[^/]*@/i.test(value) || /(?:https?:\/\/[^\s?#]+)[?#][^\s]*/i.test(value)) return '[redacted]';
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) return value;
  if (Array.isArray(value)) return value.slice(0, 64).map(item => safeValue(item, key));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).slice(0, 64)
      .map(([childKey, childValue]) => [childKey, safeValue(childValue, childKey)]));
  }
  return undefined;
}

function parsedResult(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') return {};
  const contents = (value as { content?: unknown[] }).content;
  const text = Array.isArray(contents) ? contents.find(item => item && typeof item === 'object' && (item as { type?: unknown }).type === 'text') as { text?: unknown } | undefined : undefined;
  if (typeof text?.text !== 'string') return {};
  try {
    const parsed: unknown = JSON.parse(text.text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const fields = Object.fromEntries(OBJECT_RESULT_FIELDS.filter(key => Object.hasOwn(parsed, key))
      .map(key => [key, safeValue((parsed as Record<string, unknown>)[key], key)]));
    const details = parsed as Record<string, unknown>;
    if (!fields.code && typeof details.razon === 'string' && /^[a-z][a-z0-9_]{1,63}$/.test(details.razon)) {
      fields.code = details.razon;
    }
    const authorization = details.authorization;
    if (authorization && typeof authorization === 'object' && typeof (authorization as Record<string, unknown>).state === 'string') {
      fields.authorization_state = safeValue((authorization as Record<string, unknown>).state, 'state');
    }
    return fields;
  } catch { return {}; }
}

function lastPhase(jsonl: string): string | undefined {
  try {
    const tail = readFileSync(jsonl, 'utf8').slice(-65_536).trim().split(/\r?\n/).filter(Boolean).reverse();
    for (const line of tail) {
      const event = JSON.parse(line) as { phase?: unknown };
      if (typeof event.phase === 'string') return event.phase;
    }
  } catch { /* New workspace or unreadable history starts without phase context. */ }
  return undefined;
}

export function isConversationId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(value);
}

export function conversationLogPath(workspace: string, id: string): string {
  return join(workspace, '.qa', 'logs', 'conversations', id + '.jsonl');
}

function eventPaths(workspace: string | undefined, hostDirectory?: string): { jsonl: string; summary: string; correlation: string } {
  const canonical = workspace ? realpathSync(workspace) : undefined;
  const directory = canonical ? join(canonical, '.qa', 'logs') : join(hostDirectory ?? join(homedir(), '.qap'), 'logs');
  return {
    jsonl: join(directory, 'qap-events.jsonl'),
    summary: join(directory, 'QAP_PRUEBA_USUARIO.md'),
    correlation: createHash('sha256').update(canonical ?? resolve(hostDirectory ?? homedir())).digest('hex').slice(0, 24),
  };
}

function writeSummary(jsonl: string, summary: string): void {
  const events = readFileSync(jsonl, 'utf8').trim().split(/\r?\n/).filter(Boolean).slice(-1000)
    .map(line => { try { return JSON.parse(line) as Record<string, unknown>; } catch { return undefined; } })
    .filter((event): event is Record<string, unknown> => Boolean(event));
  const rows = events.map(event => {
    const outcome = event.result && typeof event.result === 'object' ? event.result as Record<string, unknown> : {};
    const status = typeof outcome.status === 'string' ? outcome.status : 'error';
    const code = typeof outcome.code === 'string' ? outcome.code
      : typeof event.errorCode === 'string' ? event.errorCode : 'ok';
    return `| ${String(event.at)} | ${String(event.tool)} | ${status} | ${code} | ${String(event.durationMs)} ms |`;
  });
  const content = ['<!-- QAP_GENERATED_SUMMARY -->', '# Registro automático QAP', '', 'Generado por el servidor QAP desde los eventos MCP disponibles. No incluye texto de conversación.', '',
    '| Fecha | Herramienta | Resultado | Código | Duración |', '|---|---|---|---|---:|', ...rows, ''].join('\n');
  writeFileSync(summary, content, { encoding: 'utf8', mode: 0o600 });
}

/** Persistent, per-workspace event trail. It records MCP calls only; the MCP client does not expose conversation text here. */
export class QapEventLog {
  constructor(private readonly hostDirectory?: string) {}

  forgetWorkspace(workspace: string): void {
    latestPhase.delete(eventPaths(workspace, this.hostDirectory).correlation);
  }

  /** Records a safe classification of a native authorization response without its message or form contents. */
  recordNativeAuthorization(diagnostic: {
    readonly feature: 'workspace' | 'discovery';
    readonly outcome: 'approved' | 'rejected' | 'cancelled' | 'unavailable';
    readonly clientAction?: 'accept' | 'decline' | 'cancel';
    readonly reason: 'accepted' | 'explicit_decline' | 'negative_answer' | 'user_cancelled' |
      'request_cancelled' | 'incomplete_response' | 'client_error' | 'invalid_response';
    readonly clientErrorName?: string;
    readonly clientErrorCode?: number;
    readonly durationMs: number;
  }, workspace?: string): void {
    const status = diagnostic.outcome === 'approved' ? 'success' : diagnostic.outcome;
    this.record({ workspace, requestId: `authorization-${randomUUID()}`, tool: 'native_authorization',
      args: { mechanism: 'mcp_elicitation', feature: diagnostic.feature,
        ...(diagnostic.clientAction ? { client_action: diagnostic.clientAction } : {}),
        ...(diagnostic.clientErrorName ? { client_error_name: diagnostic.clientErrorName } : {}),
        ...(typeof diagnostic.clientErrorCode === 'number' ? { client_error_code: diagnostic.clientErrorCode } : {}) },
      result: { content: [{ type: 'text', text: JSON.stringify({ status,
        code: `native_elicitation_${diagnostic.reason}`, authorization: { state: diagnostic.outcome } }) }] },
      durationMs: diagnostic.durationMs });
  }

  record(input: QapEventInput): boolean {
    try {
      const paths = eventPaths(input.workspace, this.hostDirectory);
      privateDirectory(dirname(paths.jsonl));
      ensurePrivateFile(paths.jsonl);
      const result = parsedResult(input.result);
      const phase = typeof result.fase === 'string' ? result.fase : typeof result.phase === 'string' ? result.phase : undefined;
      const previous = latestPhase.get(paths.correlation) ?? lastPhase(paths.jsonl);
      const code = typeof result.code === 'string' ? result.code : input.errorCode;
      const authorization = result.authorization_state === 'single_use_approved' ? 'granted'
        : result.authorization_state === 'rejected' ? 'rejected'
          : result.authorization_state === 'cancelled' ? 'cancelled'
            : result.authorization_state === 'unavailable' ? 'unavailable'
        : /revok/i.test(code ?? '') ? 'revoked'
          : /expir/i.test(code ?? '') ? 'expired'
            : /reject|declin/i.test(code ?? '') ? 'rejected'
              : /authorization_required/i.test(code ?? '') ? 'required'
                : input.tool.startsWith('qap_auth_') && code === 'session_valid' ? 'reused'
                  : input.tool.startsWith('qap_auth_') && code === 'authentication_verified' ? 'granted' : 'not_indicated';
      const event = {
        at: new Date().toISOString(), session_id: loggerSessionId, correlation_id: paths.correlation,
        ...(isConversationId(input.conversationId) ? { conversation_id: input.conversationId } : {}),
        version: process.env.QAP_BUILD_REVISION ?? 'development', request_id: input.requestId,
        tool: input.tool, parameters: safeValue(input.args), action: input.tool,
        result: result, authorization: { state: authorization },
        ...(phase && previous && phase !== previous ? { phase_change: { from: previous, to: phase } } : {}),
        ...(phase ? { phase } : {}), ...(input.errorCode ? { error: { code: input.errorCode } } : {}),
        evidence_refs: [], durationMs: Math.max(0, Math.round(input.durationMs)),
      };
      const line = JSON.stringify(event) + '\n';
      appendFileSync(paths.jsonl, line, { encoding: 'utf8', mode: 0o600 });
      if (input.workspace && event.conversation_id) {
        const path = conversationLogPath(input.workspace, event.conversation_id);
        privateDirectory(dirname(path));
        ensurePrivateFile(path);
        appendFileSync(path, line, { encoding: 'utf8', mode: 0o600 });
      }
      try {
        let summaryPath = paths.summary;
        if (existsSync(summaryPath)) ensurePrivateFile(summaryPath);
        if (existsSync(summaryPath) && !readFileSync(summaryPath, 'utf8').startsWith('<!-- QAP_GENERATED_SUMMARY -->')) {
          summaryPath = summaryPath.replace(/\.md$/i, '.generated.md');
        }
        ensurePrivateFile(summaryPath);
        writeSummary(paths.jsonl, summaryPath);
      } catch { /* Event data remains authoritative if summary regeneration fails. */ }
      if (phase) latestPhase.set(paths.correlation, phase);
      return true;
    } catch { return false; }
  }
}
