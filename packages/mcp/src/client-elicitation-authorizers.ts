import type { Server } from '@modelcontextprotocol/sdk/server/index.js';

import type { IDiscoveryAuthorizer, DiscoveryAuthorizationRequest, DiscoveryAuthorizationResult } from './discovery-authorizer.js';
import type { IWorkspaceAuthorizer, WorkspaceAuthorizationRequest, WorkspaceAuthorizationResult } from './workspace-authorizer.js';

type ServerProvider = () => Server | undefined;

function canElicit(server: Server | undefined): server is Server {
  return server?.getClientCapabilities()?.elicitation?.form !== undefined;
}

async function askForConsent(server: Server, message: string, signal?: AbortSignal): Promise<boolean | undefined> {
  const answer = await server.elicitInput({
    mode: 'form',
    message,
    requestedSchema: {
      type: 'object',
      properties: { authorize: { type: 'boolean', title: 'Autorizar' } },
      required: ['authorize'],
    },
  }, signal ? { signal } : undefined);
  if (answer.action !== 'accept') return false;
  return answer.content?.authorize === true;
}

/** Prefer the connected MCP client's user elicitation UI when it explicitly advertises it. */
export class ClientElicitationWorkspaceAuthorizer implements IWorkspaceAuthorizer {
  constructor(private readonly server: ServerProvider, private readonly fallback?: IWorkspaceAuthorizer) {}

  isAvailable(): boolean { return Boolean(this.fallback) || canElicit(this.server()); }

  async requestAuthorization(request: WorkspaceAuthorizationRequest, signal?: AbortSignal): Promise<WorkspaceAuthorizationResult> {
    const server = this.server();
    if (!canElicit(server)) {
      return this.fallback?.requestAuthorization(request, signal) ?? {
        decision: 'unavailable', code: 'workspace_gui_unavailable', reason: 'The MCP client does not support form elicitation.' };
    }
    try {
      const approved = await askForConsent(server, `Autorizar este workspace local para QAP:\n${request.canonicalPath}`, signal);
      return approved
        ? { decision: 'approved', root: request.canonicalPath }
        : { decision: 'rejected', root: request.canonicalPath, reason: 'Workspace authorization was declined.' };
    } catch {
      return { decision: 'unavailable', code: 'workspace_dialog_start_failed', reason: 'Native workspace elicitation failed.' };
    }
  }
}

/** Elicitation carries only a boolean decision; credential material stays with the host's secure provider. */
export class ClientElicitationDiscoveryAuthorizer implements IDiscoveryAuthorizer {
  constructor(private readonly server: ServerProvider, private readonly fallback?: IDiscoveryAuthorizer) {}

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
    try {
      const approved = await askForConsent(server, message, signal);
      return approved
        ? { decision: 'approved', root: request.projectRoot, targetUrl: request.targetUrl, limits }
        : { decision: 'rejected', reason: 'Discovery authorization was declined.' };
    } catch {
      return { decision: 'unavailable', code: 'discovery_gui_unavailable', reason: 'Native discovery elicitation failed.' };
    }
  }

  requestCredential(request: DiscoveryAuthorizationRequest, profile: string, details: string, signal: AbortSignal): Promise<string | undefined> {
    return this.fallback?.requestCredential?.(request, profile, details, signal) ?? Promise.resolve(undefined);
  }
}
