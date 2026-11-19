import { randomUUID } from 'node:crypto';

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ElicitResultSchema, McpError, type RequestId } from '@modelcontextprotocol/sdk/types.js';

import type { IDiscoveryAuthorizer, DiscoveryAuthorizationRequest, DiscoveryAuthorizationResult } from './discovery-authorizer.js';
import type {
  HumanReviewDecision,
  HumanReviewRequest,
  IHumanReviewGateway,
} from './handlers/canonical-interview-service.js';
import { authorizationDiagnostic } from './authorization-diagnostics.js';
import type { NativeRuleReviewDialog, NativeRuleReviewOutcome } from './windows-rule-review.js';
import type { IWorkspaceAuthorizer, WorkspaceAuthorizationRequest, WorkspaceAuthorizationResult } from './workspace-authorizer.js';

type ServerProvider = () => Server | undefined;

export interface NativeAuthorizationDiagnostic {
  readonly feature: 'workspace' | 'discovery';
  readonly outcome: 'approved' | 'rejected' | 'cancelled' | 'unavailable';
  readonly clientAction?: 'accept' | 'decline' | 'cancel';
  readonly reason: 'accepted' | 'explicit_decline' | 'negative_answer' | 'user_cancelled' |
    'request_cancelled' | 'incomplete_response' | 'client_error' | 'invalid_response';
  readonly clientErrorName?: string;
  readonly clientErrorCode?: number;
  readonly durationMs: number;
}

type DiagnosticSink = (diagnostic: NativeAuthorizationDiagnostic, workspace?: string) => void;

type ConsentResponse =
  | { readonly outcome: 'approved'; readonly reason: 'accepted' }
  | { readonly outcome: 'rejected'; readonly reason: 'explicit_decline' | 'negative_answer'; readonly clientAction: 'accept' | 'decline' }
  | { readonly outcome: 'cancelled'; readonly reason: 'user_cancelled'; readonly clientAction: 'cancel' }
  | { readonly outcome: 'cancelled'; readonly reason: 'request_cancelled' }
  | { readonly outcome: 'unavailable'; readonly reason: 'incomplete_response' | 'client_error' | 'invalid_response'; readonly clientErrorName?: string; readonly clientErrorCode?: number };

function canElicit(server: Server | undefined): server is Server {
  return server?.getClientCapabilities()?.elicitation?.form !== undefined;
}

async function askForConsent(server: Server, message: string, signal?: AbortSignal): Promise<ConsentResponse> {
  try {
    const answer = await server.elicitInput({
      mode: 'form',
      message,
      requestedSchema: {
        type: 'object',
        properties: { authorize: { type: 'boolean', title: 'Autorizar' } },
        required: ['authorize'],
      },
    }, signal ? { signal } : undefined);
    if (answer.action === 'decline') return { outcome: 'rejected', reason: 'explicit_decline', clientAction: 'decline' };
    if (answer.action === 'cancel') return { outcome: 'cancelled', reason: 'user_cancelled', clientAction: 'cancel' };
    if (answer.action !== 'accept') return { outcome: 'unavailable', reason: 'invalid_response' };
    if (typeof answer.content?.authorize !== 'boolean') return { outcome: 'unavailable', reason: 'incomplete_response' };
    return answer.content.authorize
      ? { outcome: 'approved', reason: 'accepted' }
      : { outcome: 'rejected', reason: 'negative_answer', clientAction: 'accept' };
  } catch (error: unknown) {
    // Never serialize client exception messages; they may contain request data.
    if (signal?.aborted) return { outcome: 'cancelled', reason: 'request_cancelled' };
    const rawCode = error && typeof error === 'object' ? (error as { code?: unknown }).code : undefined;
    const rawName = error instanceof Error ? error.name : undefined;
    return { outcome: 'unavailable', reason: 'client_error',
      ...(typeof rawName === 'string' && /^[A-Za-z][A-Za-z0-9_$]{0,63}$/.test(rawName) ? { clientErrorName: rawName } : {}),
      ...(typeof rawCode === 'number' && Number.isSafeInteger(rawCode) ? { clientErrorCode: rawCode } : {}) };
  }
}

function recordDiagnostic(sink: DiagnosticSink | undefined, feature: NativeAuthorizationDiagnostic['feature'], response: ConsentResponse,
  startedAt: number, workspace?: string): void {
  sink?.({ feature, outcome: response.outcome, reason: response.reason,
    ...('clientAction' in response ? { clientAction: response.clientAction } : {}),
    ...('clientErrorName' in response && response.clientErrorName ? { clientErrorName: response.clientErrorName } : {}),
    ...('clientErrorCode' in response && typeof response.clientErrorCode === 'number' ? { clientErrorCode: response.clientErrorCode } : {}),
    durationMs: Math.max(0, Date.now() - startedAt) }, workspace);
}

/** Prefer the connected MCP client's user elicitation UI when it explicitly advertises it. */
export class ClientElicitationWorkspaceAuthorizer implements IWorkspaceAuthorizer {
  constructor(private readonly server: ServerProvider, private readonly fallback?: IWorkspaceAuthorizer,
    private readonly diagnosticSink?: DiagnosticSink) {}

  isAvailable(): boolean { return Boolean(this.fallback) || canElicit(this.server()); }

  async requestAuthorization(request: WorkspaceAuthorizationRequest, signal?: AbortSignal): Promise<WorkspaceAuthorizationResult> {
    const server = this.server();
    if (!canElicit(server)) {
      return this.fallback?.requestAuthorization(request, signal) ?? {
        decision: 'unavailable', code: 'workspace_gui_unavailable', reason: 'The MCP client does not support form elicitation.' };
    }
    const startedAt = Date.now();
    const response = await askForConsent(server, `Autorizar este workspace local para QAP:\n${request.canonicalPath}`, signal);
    recordDiagnostic(this.diagnosticSink, 'workspace', response, startedAt);
    if (response.outcome === 'approved') return { decision: 'approved', root: request.canonicalPath };
    if (response.outcome === 'rejected') return { decision: 'rejected', root: request.canonicalPath, reason: 'Workspace authorization was explicitly declined.' };
    if (response.outcome === 'cancelled') return { decision: 'cancelled', code: 'workspace_authorization_cancelled', reason: 'Workspace authorization was cancelled by the client.' };
    return { decision: 'unavailable', code: 'workspace_dialog_start_failed', reason: 'Native workspace elicitation did not complete.' };
  }
}

/** Elicitation carries only a boolean decision; credential material stays with the host's secure provider. */
export class ClientElicitationDiscoveryAuthorizer implements IDiscoveryAuthorizer {
  constructor(private readonly server: ServerProvider, private readonly fallback?: IDiscoveryAuthorizer,
    private readonly diagnosticSink?: DiagnosticSink) {}

  isAvailable(): boolean { return Boolean(this.fallback) || canElicit(this.server()); }

  async requestAuthorization(request: DiscoveryAuthorizationRequest, signal?: AbortSignal): Promise<DiscoveryAuthorizationResult> {
    const server = this.server();
    if (!canElicit(server)) {
      return this.fallback?.requestAuthorization(request, signal) ?? {
        decision: 'unavailable', code: 'discovery_gui_unavailable', reason: 'The MCP client does not support form elicitation.' };
    }
    const limits = request.limits;
    const operation = request.interactiveOperation?.operation;
    const message = operation
      ? `Autorizar la operación ${operation} sobre ${request.targetUrl}. No se solicitarán ni enviarán credenciales mediante este formulario.\n\n${request.interactiveOperation?.details ?? ''}`
      : `Autorizar navegación HTTP GET de solo lectura a ${request.targetUrl}. ` +
        `Límites: ${limits?.max_pages ?? 10} páginas, ${limits?.max_requests ?? 50} solicitudes, ` +
        `${limits?.max_redirects ?? 5} redirecciones; cada destino debe seguir dentro del alcance autorizado.`;
    const startedAt = Date.now();
    const response = await askForConsent(server, message, signal);
    recordDiagnostic(this.diagnosticSink, 'discovery', response, startedAt, request.projectRoot);
    if (response.outcome === 'approved') return { decision: 'approved', root: request.projectRoot, targetUrl: request.targetUrl, limits };
    if (response.outcome === 'rejected') return { decision: 'rejected', reason: 'Discovery authorization was explicitly declined.' };
    if (response.outcome === 'cancelled') return { decision: 'cancelled', code: 'discovery_authorization_cancelled', reason: 'Discovery authorization was cancelled by the client.' };
    return { decision: 'unavailable', code: 'discovery_gui_unavailable', reason: 'Native discovery elicitation did not complete.' };
  }

  requestCredential(request: DiscoveryAuthorizationRequest, profile: string, details: string, signal: AbortSignal): Promise<string | undefined> {
    return this.fallback?.requestCredential?.(request, profile, details, signal) ?? Promise.resolve(undefined);
  }
}

export type RuleReviewResult =
  | { outcome: 'decided'; decision: HumanReviewDecision; mechanism: 'client_elicitation' | 'host_gateway' | 'windows_dialog' }
  | { outcome: 'blocked'; code: 'human_review_gateway_required' | 'human_review_cancelled' |
      'human_review_unavailable' | 'human_review_not_authorized' };

export interface VerifiableRuleReviewGateway {
  review(request: Readonly<HumanReviewRequest>, invocation?: RuleReviewInvocation): Promise<RuleReviewResult>;
}

export interface RuleReviewInvocation {
  readonly signal?: AbortSignal;
  readonly requestId?: RequestId;
}

type ClientAction = 'accept' | 'decline' | 'cancel';

function reviewMessage(request: Readonly<HumanReviewRequest>): string {
  return [
    'Proyecto: ' + request.projectRoot,
    'Módulo: ' + request.moduleKey,
    'Requisito: ' + request.requirementId,
    'Pregunta: ' + request.question.text,
    'Propuesta: ' + request.proposal.title,
    request.proposal.description,
    ...(request.proposal.category ? ['Categoría: ' + request.proposal.category] : []),
    ...(request.proposal.acceptance_criteria?.length
      ? ['Criterios de aceptación:', ...request.proposal.acceptance_criteria] : []),
    'Ámbito: ' + request.context,
    ...(request.question.evidenceRefs.length
      ? ['Referencias: ' + request.question.evidenceRefs.map(ref => ref.id + '@' + ref.revision).join(', ')] : []),
    'Revisión: ' + request.statementVersion,
    'Huella del contenido: ' + request.statementDigest,
  ].join('\n');
}

/** Client form or an independently composed local host channel. Each review uses exactly one channel. */
export class ClientElicitationHumanReviewGateway implements VerifiableRuleReviewGateway {
  constructor(
    private readonly server: ServerProvider,
    private readonly fallback?: IHumanReviewGateway,
    private readonly windowsDialog?: NativeRuleReviewDialog,
    private readonly preferWindowsDialog = false,
  ) {}

  async review(request: Readonly<HumanReviewRequest>, invocation?: RuleReviewInvocation): Promise<RuleReviewResult> {
    const { signal, requestId } = invocation ?? {};
    const server = this.server();
    const formAdvertised = canElicit(server);
    const windowsDialog = this.preferWindowsDialog || !formAdvertised ? this.windowsDialog : undefined;
    const mechanism = windowsDialog ? 'windows_dialog'
      : formAdvertised ? 'client_elicitation'
      : this.fallback ? 'host_gateway' : 'none';
    const diagnostic = { review_id: randomUUID(), review_request_digest: request.requestDigest, form_advertised: formAdvertised, mechanism };
    const start = Date.now();
    authorizationDiagnostic('human_review_request', diagnostic);

    let clientAction: ClientAction | undefined;
    let protocolErrorCode: number | undefined;
    let nativeOutcome: NativeRuleReviewOutcome | undefined;
    const finish = (result: RuleReviewResult): RuleReviewResult => {
      authorizationDiagnostic('human_review_result', {
        ...diagnostic,
        client_action: clientAction,
        protocol_error_code: protocolErrorCode,
        native_outcome: nativeOutcome,
        outcome: result.outcome === 'decided' ? result.decision.decision : result.code,
        duration_ms: Math.max(0, Date.now() - start),
      });
      return result;
    };
    const cancelled = () => finish({ outcome: 'blocked', code: 'human_review_cancelled' });
    const unavailable = () => finish({ outcome: 'blocked', code: 'human_review_unavailable' });
    const noDecision = () => finish({ outcome: 'blocked', code: 'human_review_not_authorized' });
    const decided = (decision: HumanReviewDecision['decision'], channel: 'client_elicitation' | 'windows_dialog') => {
      const now = new Date();
      return finish({ outcome: 'decided', mechanism: channel, decision: {
        requestDigest: request.requestDigest,
        approvalId: randomUUID(),
        decision,
        presentedStatementDigest: request.statementDigest,
        reviewer: channel === 'windows_dialog' ? 'windows_desktop_operator' : 'mcp_client_elicitation',
        decidedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 10 * 60_000).toISOString(),
      } });
    };

    if (signal?.aborted) return cancelled();
    try {
      if (windowsDialog) {
        nativeOutcome = await windowsDialog.review(reviewMessage(request), signal);
        if (signal?.aborted || nativeOutcome === 'cancelled') return cancelled();
        if (nativeOutcome === 'unavailable') return unavailable();
        return decided(nativeOutcome, 'windows_dialog');
      }
      if (formAdvertised) {
        // Keep the action even when a submitted field is invalid; only the explicit enum below may authorize.
        const answer = await server.request({
          method: 'elicitation/create',
          params: {
            mode: 'form',
            message: reviewMessage(request),
            requestedSchema: {
              type: 'object',
              properties: {
                decision: { type: 'string', enum: ['confirm', 'reject', 'defer'], title: 'Decisión de QA' },
              },
              required: ['decision'],
            },
          },
        }, ElicitResultSchema, { signal, relatedRequestId: requestId });
        clientAction = answer.action;
        if (signal?.aborted || answer.action === 'cancel') return cancelled();
        if (answer.action === 'decline') return decided('reject', 'client_elicitation');
        const decision = answer.content?.decision;
        return decision === 'confirm' || decision === 'reject' || decision === 'defer'
          ? decided(decision, 'client_elicitation') : noDecision();
      }
      if (this.fallback) {
        const decision = await this.fallback.review(request);
        if (signal?.aborted) return cancelled();
        return decision ? finish({ outcome: 'decided', decision, mechanism: 'host_gateway' }) : noDecision();
      }
      return finish({ outcome: 'blocked', code: 'human_review_gateway_required' });
    } catch (error) {
      if (error instanceof McpError && Number.isSafeInteger(error.code)) protocolErrorCode = error.code;
      if (signal?.aborted) return cancelled();
      return unavailable();
    }
  }
}
