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
  readonly phase?: string;
  readonly operation?: string;
  readonly cause?: QapFailureCause;
  readonly durationMs: number;
}

const RESULT_FIELDS = ['status', 'code', 'fase', 'phase', 'verified', 'retryable', 'execution_state', 'closure_state',
  'authorization_feature', 'client_action', 'client_error_code'];
const REFERENCE_FIELDS = ['targetPath', 'project_id', 'campaign_id', 'session_id', 'plan_revision_id',
  'discovery_revision_id', 'execution_id', 'executionId', 'case_id', 'module', 'error_id', 'diagnostic_id'];
const SYSTEM_ERROR_CODES = new Set(['EACCES', 'EPERM', 'ENOENT', 'EEXIST', 'EBUSY', 'ENOSPC', 'EIO', 'EXDEV',
  'ETIMEDOUT', 'ECONNREFUSED', 'ECONNRESET', 'ERR_SQLITE_ERROR', 'SQLITE_BUSY', 'SQLITE_LOCKED', 'SQLITE_CONSTRAINT']);

export interface QapFailureCause {
  readonly kind: 'type_error' | 'range_error' | 'syntax_error' | 'abort' | 'error' | 'non_error';
  readonly system_code?: string;
  readonly domain_code?: string;
  readonly cause?: QapFailureCause;
}

export function classifyQapFailure(error: unknown, depth = 0): QapFailureCause {
  if (!(error instanceof Error)) return { kind: 'non_error' };
  const kind = error instanceof TypeError ? 'type_error' : error instanceof RangeError ? 'range_error'
    : error instanceof SyntaxError ? 'syntax_error' : error.name === 'AbortError' ? 'abort' : 'error';
  const code = (error as NodeJS.ErrnoException).code;
  return {
    kind,
    ...(code && SYSTEM_ERROR_CODES.has(code) ? { system_code: code } : {}),
    ...(depth < 2 && error.cause !== undefined ? { cause: classifyQapFailure(error.cause, depth + 1) } : {}),
  };
}

function safeToken(value: unknown): string | undefined {
  return typeof value === 'string' && /^[a-z][a-z0-9_]{0,79}$/i.test(value) ? value : undefined;
}

function safeReference(value: string): string {
  return 'sha256:' + createHash('sha256').update(value).digest('hex').slice(0, 24);
}

function safeReferences(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') return {};
  const fields = value as Record<string, unknown>;
  return Object.fromEntries(REFERENCE_FIELDS.flatMap(key => {
    const item = fields[key];
    return typeof item === 'string' && item.length > 0 ? [[key, safeReference(item)]] : [];
  }));
}

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

function parsedResult(value: unknown): { fields: Record<string, unknown>; references: Record<string, string> } {
  const empty = { fields: {}, references: {} };
  if (!value || typeof value !== 'object') return empty;
  const result = value as { content?: Array<{ type?: string; text?: string }>; isError?: boolean };
  const text = Array.isArray(result.content) ? result.content.find(item => item?.type === 'text')?.text : undefined;
  const fallback = result.isError ? { fields: { status: 'error' }, references: {} } : empty;
  if (typeof text !== 'string') return fallback;
  try {
    const details = JSON.parse(text) as Record<string, unknown> | null;
    if (!details || typeof details !== 'object') return fallback;
    const fields = Object.fromEntries(RESULT_FIELDS.flatMap(key => {
      const item = details[key];
      const safe = typeof item === 'boolean' || (key === 'client_error_code' && Number.isSafeInteger(item)) ? item : safeToken(item);
      return safe === undefined ? [] : [[key, safe]];
    }));
    if (result.isError && !fields.status) fields.status = 'error';
    if (details.authorization && typeof details.authorization === 'object') {
      const state = safeToken((details.authorization as Record<string, unknown>).state);
      if (state) fields.authorization_state = state;
    }
    return { fields, references: safeReferences(details) };
  } catch { return fallback; }
}

function isFailure(status: unknown): boolean {
  return status === 'error' || status === 'blocked' || status === 'partial';
}

export function isQapFailureResult(result: unknown): boolean {
  return isFailure(parsedResult(result).fields.status);
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
      : (event.error as { code?: string } | undefined)?.code ?? 'ok';
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
      args: undefined,
      result: { content: [{ type: 'text', text: JSON.stringify({ status,
        code: `native_elicitation_${diagnostic.reason}`, authorization: { state: diagnostic.outcome },
        authorization_feature: diagnostic.feature, client_action: diagnostic.clientAction,
        client_error_code: diagnostic.clientErrorCode,
      }) }] },
      durationMs: diagnostic.durationMs });
  }

  record(input: QapEventInput): boolean {
    try {
      const paths = eventPaths(input.workspace, this.hostDirectory);
      privateDirectory(dirname(paths.jsonl));
      ensurePrivateFile(paths.jsonl);
      const { fields: result, references } = parsedResult(input.result);
      const previous = latestPhase.get(paths.correlation) ?? lastPhase(paths.jsonl);
      const failed = isFailure(result.status) || Boolean(input.errorCode || input.cause);
      if (failed && !result.status) result.status = 'error';
      const reportedPhase = safeToken(result.fase ?? result.phase) ?? safeToken(input.phase);
      const phase = reportedPhase ?? (failed && input.workspace ? previous : undefined);
      const code = safeToken(result.code) ?? input.errorCode ?? (failed ? 'tool_failure_without_code' : undefined);
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
        version: process.env.QAP_BUILD_REVISION ?? 'development',
        request_id: /^\d{1,20}(?::(?:auth|discovery))?$/.test(input.requestId) ? input.requestId : safeReference(input.requestId),
        tool: input.tool, action: input.tool, operation: input.operation ?? input.tool,
        parameters: safeReferences(input.args), references,
        result: result, authorization: { state: authorization },
        ...(phase && previous && phase !== previous ? { phase_change: { from: previous, to: phase } } : {}),
        ...(phase ? { phase, phase_source: reportedPhase ? 'reported' : 'last_recorded' } : {}),
        ...(failed ? { error: { code, ...(input.cause ? { cause: input.cause } : {}) } } : {}),
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
