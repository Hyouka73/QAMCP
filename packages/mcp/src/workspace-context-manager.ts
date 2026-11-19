import { existsSync, lstatSync, readFileSync, realpathSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';

import type { QapApplicationService } from './application/application-service.js';
import { normalizePathKey, resolveContainedPath } from './application/safe-storage.js';
import { validateCandidateWorkspace } from './workspace-authorizer.js';

export interface InteractionContext {
  readonly conversationId?: string;
  readonly canonicalRoot: string;
  readonly rootKey: string;
  readonly projectId?: string;
  readonly campaignId?: string;
  readonly rootAuthGeneration?: string;
  readonly rootAuthGrantId?: string;
  readonly createdAt: string;
  readonly lastUsedAt: string;
}

export interface HostRootsSnapshot {
  readonly advertised: boolean;
  readonly validRoots: ReadonlyMap<string, string>;
  readonly invalidRoots: readonly string[];
  readonly unavailable: boolean;
  readonly epoch: number;
}

export interface AvailableWorkspaceOption {
  readonly root: string;
  readonly project_id?: string;
  readonly name?: string;
  readonly authorized: boolean;
}

export type WorkspaceResolutionResult =
  | {
      readonly ok: true;
      readonly canonicalRoot: string;
      readonly rootKey: string;
      readonly projectId?: string;
      readonly contextSwitched: boolean;
      readonly isExplicitTransition: boolean;
      readonly existingConversation?: InteractionContext;
      readonly hostRoots: HostRootsSnapshot;
      readonly resolutionSource:
        | 'configured_root'
        | 'conversation_id'
        | 'explicit_transition'
        | 'active_context'
        | 'single_host_root';
    }
  | {
      readonly ok: false;
      readonly code: string;
      readonly message: string;
      readonly candidateRoot?: string;
      readonly rawCandidate?: string;
      readonly hostRoots: HostRootsSnapshot;
      readonly availableWorkspaces?: readonly AvailableWorkspaceOption[];
      readonly unlockMechanism: 'local_host' | 'qap_start' | 'qap_project';
      readonly unlockDescription: string;
      readonly unlockCommand?: string;
      readonly includeQuestion?: boolean;
      readonly evictedRoot?: string;
      readonly evictedConversationIds?: readonly string[];
    };

export interface ResolveWorkspaceParams {
  readonly server: Server;
  readonly hostDirectory: string;
  readonly toolName: string;
  readonly rawArgs: Record<string, unknown> | undefined;
  readonly conversationId: string | undefined;
  readonly configuredWorkspaceRoot?: string;
  readonly multiProjectRuntime: boolean;
  readonly registryPath?: string;
  readonly applicationService?: QapApplicationService;
  readonly hasPersistentRootAuthority: (root: string) => boolean;
  readonly preparationCommand: string;
}

const TRANSITION_PROJECT_ACTIONS = new Set(['select', 'resume', 'create']);

function readAuthorizedRootsRegistry(registryPath: string | undefined, hostDirectory: string): string[] {
  if (!registryPath || !existsSync(registryPath)) return [];
  try {
    const parsed: unknown = JSON.parse(readFileSync(registryPath, 'utf8'));
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    const roots: string[] = [];
    for (const item of parsed) {
      if (typeof item !== 'string' || !isAbsolute(item)) continue;
      try {
        const canonical = validateCandidateWorkspace(item, hostDirectory);
        const key = normalizePathKey(canonical);
        if (!seen.has(key)) {
          seen.add(key);
          roots.push(canonical);
        }
      } catch {
        // Ignora raíces históricas eliminadas o no válidas sin afectar el arranque global.
      }
    }
    return roots;
  } catch {
    return [];
  }
}

function hasControlChars(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    if (value.charCodeAt(i) < 32) return true;
  }
  return false;
}

function parseOptionalHint(rawArgs: Record<string, unknown> | undefined, toolName: string): {
  readonly ok: boolean;
  readonly hint?: string;
} {
  const targetPath = rawArgs?.targetPath;
  const canonicalRoot = rawArgs?.canonical_root;
  const sourceTargetPath = rawArgs?.source_targetPath;
  for (const candidate of [targetPath, canonicalRoot, sourceTargetPath]) {
    if (candidate !== undefined) {
      if (typeof candidate !== 'string' || !candidate.trim() || candidate.length > 4096 ||
          hasControlChars(candidate) || !isAbsolute(candidate)) {
        return { ok: false };
      }
    }
  }
  if (typeof targetPath === 'string' && typeof canonicalRoot === 'string' &&
      normalizePathKey(targetPath) !== normalizePathKey(canonicalRoot)) {
    return { ok: false };
  }
  if (typeof targetPath === 'string' && typeof sourceTargetPath === 'string' &&
      normalizePathKey(targetPath) !== normalizePathKey(sourceTargetPath)) {
    return { ok: false };
  }
  const primary = toolName === 'qap_project'
    ? (typeof canonicalRoot === 'string' ? canonicalRoot : typeof targetPath === 'string' ? targetPath : undefined)
    : (typeof targetPath === 'string' ? targetPath : typeof canonicalRoot === 'string' ? canonicalRoot : undefined);
  return { ok: true, hint: primary };
}

/**
 * Administra el contexto multiproyecto de una instancia viva de MCP:
 * descubre raíces del host sin adivinar, aísla conversaciones concurrentes
 * y valida transiciones explícitas entre proyectos.
 */
export class WorkspaceContextManager {
  private activeContext: InteractionContext | undefined;
  private readonly conversationContexts = new Map<string, InteractionContext>();
  private rootsEpoch = 0;

  markRootsChanged(): void {
    this.rootsEpoch += 1;
  }

  getRootsEpoch(): number {
    return this.rootsEpoch;
  }

  getActiveContext(): InteractionContext | undefined {
    return this.activeContext;
  }

  getConversationContext(conversationId: string): InteractionContext | undefined {
    return this.conversationContexts.get(conversationId);
  }

  setActiveContext(context: Omit<InteractionContext, 'createdAt' | 'lastUsedAt'>): InteractionContext {
    const now = new Date().toISOString();
    const existing = this.activeContext?.rootKey === context.rootKey ? this.activeContext : undefined;
    const updated: InteractionContext = {
      ...context,
      createdAt: existing?.createdAt ?? now,
      lastUsedAt: now,
    };
    this.activeContext = updated;
    if (updated.conversationId) {
      this.conversationContexts.set(updated.conversationId, updated);
    }
    return updated;
  }

  bindConversationContext(context: Omit<InteractionContext, 'createdAt' | 'lastUsedAt'> & { readonly conversationId: string }): InteractionContext {
    const updated = this.touchConversationContext(context);
    this.activeContext = updated;
    return updated;
  }

  /** Actualiza una conversación conocida sin sobreescribir el contexto activo compartido. */
  touchConversationContext(context: Omit<InteractionContext, 'createdAt' | 'lastUsedAt'> & { readonly conversationId: string }): InteractionContext {
    const now = new Date().toISOString();
    const prev = this.conversationContexts.get(context.conversationId);
    const updated: InteractionContext = {
      ...context,
      createdAt: prev?.createdAt ?? now,
      lastUsedAt: now,
    };
    this.conversationContexts.set(context.conversationId, updated);
    return updated;
  }

  invalidateRoot(rootOrKey: string): string[] {
    const rootKey = rootOrKey.includes(':') || rootOrKey.includes('/') || rootOrKey.includes('\\')
      ? normalizePathKey(rootOrKey)
      : rootOrKey;
    if (this.activeContext?.rootKey === rootKey) {
      this.activeContext = undefined;
    }
    const evicted: string[] = [];
    for (const [id, ctx] of this.conversationContexts.entries()) {
      if (ctx.rootKey === rootKey) {
        this.conversationContexts.delete(id);
        evicted.push(id);
      }
    }
    return evicted;
  }

  isExplicitTransitionCall(
    toolName: string,
    rawArgs: Record<string, unknown> | undefined,
    conversationId: string | undefined,
  ): boolean {
    if (toolName === 'qap_start') {
      // Si continúa una conversación conocida de otro proyecto, no es transición silenciosa.
      if (conversationId && this.conversationContexts.has(conversationId)) return false;
      return true;
    }
    if (toolName === 'qap_project') {
      return TRANSITION_PROJECT_ACTIONS.has(typeof rawArgs?.action === 'string' ? rawArgs.action : '');
    }
    return false;
  }

  async resolveHostRoots(server: Server, hostDirectory: string): Promise<HostRootsSnapshot> {
    if (!server.getClientCapabilities()?.roots) {
      return {
        advertised: false,
        validRoots: new Map(),
        invalidRoots: [],
        unavailable: false,
        epoch: this.rootsEpoch,
      };
    }
    try {
      const response = await server.listRoots();
      const validRoots = new Map<string, string>();
      const invalidRoots: string[] = [];
      for (const entry of response.roots) {
        const url = new URL(entry.uri);
        if (url.protocol !== 'file:' || (url.hostname && url.hostname !== 'localhost')) {
          return {
            advertised: true,
            validRoots: new Map(),
            invalidRoots: [],
            unavailable: true,
            epoch: this.rootsEpoch,
          };
        }
        const rawPath = fileURLToPath(url);
        try {
          const canonical = validateCandidateWorkspace(rawPath, hostDirectory);
          validRoots.set(normalizePathKey(canonical), canonical);
        } catch {
          invalidRoots.push(rawPath);
        }
      }
      return {
        advertised: true,
        validRoots,
        invalidRoots,
        unavailable: false,
        epoch: this.rootsEpoch,
      };
    } catch {
      return {
        advertised: true,
        validRoots: new Map(),
        invalidRoots: [],
        unavailable: true,
        epoch: this.rootsEpoch,
      };
    }
  }

  listVisibleHostRoots(
    hostRoots: HostRootsSnapshot,
    configuredWorkspaceRoot: string | undefined,
    registryPath: string | undefined,
    hostDirectory: string,
  ): string[] {
    if (configuredWorkspaceRoot) {
      try {
        const canonical = validateCandidateWorkspace(configuredWorkspaceRoot, hostDirectory);
        if (hostRoots.advertised && !hostRoots.validRoots.has(normalizePathKey(canonical))) {
          return [];
        }
        return [canonical];
      } catch {
        return [];
      }
    }
    if (hostRoots.advertised) {
      return [...hostRoots.validRoots.values()];
    }
    return readAuthorizedRootsRegistry(registryPath, hostDirectory);
  }

  private buildAvailableWorkspaces(
    hostRoots: HostRootsSnapshot,
    registryPath: string | undefined,
    hostDirectory: string,
    applicationService?: QapApplicationService,
    hasPersistentRootAuthority?: (root: string) => boolean,
  ): AvailableWorkspaceOption[] {
    const candidates = hostRoots.advertised
      ? [...hostRoots.validRoots.values()]
      : readAuthorizedRootsRegistry(registryPath, hostDirectory);
    return candidates.map((root) => {
      const project = applicationService?.findActiveProjectByRoot(root) ?? null;
      return {
        root,
        ...(project ? { project_id: project.project_id, name: project.name } : {}),
        authorized: hasPersistentRootAuthority ? hasPersistentRootAuthority(root) : false,
      };
    });
  }

  async resolveCallWorkspace(params: ResolveWorkspaceParams): Promise<WorkspaceResolutionResult> {
    const {
      server,
      hostDirectory,
      toolName,
      rawArgs,
      conversationId,
      configuredWorkspaceRoot,
      multiProjectRuntime,
      registryPath,
      applicationService,
      hasPersistentRootAuthority,
      preparationCommand,
    } = params;

    const hostRoots = await this.resolveHostRoots(server, hostDirectory);
    if (hostRoots.unavailable) {
      return {
        ok: false,
        code: 'workspace_roots_unavailable',
        message: 'No fue posible consultar las raíces válidas anunciadas por el host.',
        hostRoots,
        unlockMechanism: 'local_host',
        unlockDescription: 'Verifica las carpetas abiertas en el host o selecciona explícitamente un workspace válido.',
      };
    }

    const hintParse = parseOptionalHint(rawArgs, toolName);
    const rawProjectId = typeof rawArgs?.project_id === 'string' && rawArgs.project_id.trim()
      ? rawArgs.project_id.trim()
      : undefined;

    // 1. Modo restringido opcional mediante QAP_MCP_WORKSPACE_ROOT.
    if (configuredWorkspaceRoot !== undefined && !multiProjectRuntime) {
      if (hostRoots.advertised && !hostRoots.validRoots.has(normalizePathKey(configuredWorkspaceRoot))) {
        return {
          ok: false,
          code: 'workspace_host_root_mismatch',
          message: 'La raíz configurada no coincide con las raíces anunciadas por el host.',
          hostRoots,
          unlockMechanism: 'local_host',
          unlockDescription: 'Asegura que el workspace configurado coincida con el abierto en el host.',
        };
      }
      let selected: string;
      try {
        selected = validateCandidateWorkspace(configuredWorkspaceRoot, hostDirectory);
      } catch {
        const evicted = this.invalidateRoot(configuredWorkspaceRoot);
        return {
          ok: false,
          code: 'workspace_root_unavailable',
          message: 'La carpeta del workspace configurado ya no existe o no es válida.',
          hostRoots,
          evictedRoot: configuredWorkspaceRoot,
          evictedConversationIds: evicted,
          unlockMechanism: 'local_host',
          unlockDescription: 'Restaura el workspace o retira QAP_MCP_WORKSPACE_ROOT para usar el modo multiproyecto.',
        };
      }
      const scopeKey = normalizePathKey(selected);
      if (!hintParse.ok || (hintParse.hint !== undefined && normalizePathKey(hintParse.hint) !== scopeKey)) {
        return {
          ok: false,
          code: 'workspace_outside_configured_root',
          message: 'La ruta solicitada está fuera del workspace vinculado.',
          hostRoots,
          unlockMechanism: 'local_host',
          unlockDescription: 'Opera dentro del workspace configurado o cambia a modo multiproyecto sin QAP_MCP_WORKSPACE_ROOT.',
        };
      }
      if (conversationId) {
        const ctx = this.conversationContexts.get(conversationId);
        if (ctx && ctx.rootKey !== scopeKey) {
          return {
            ok: false,
            code: 'conversation_not_in_workspace',
            message: 'La conversación indicada pertenece a otro workspace.',
            hostRoots,
            unlockMechanism: 'qap_start',
            unlockDescription: 'Inicia una conversación nueva con qap_start dentro de este workspace.',
          };
        }
        try {
          const log = resolveContainedPath(selected, join('.qa', 'logs', 'conversations', `${conversationId}.jsonl`));
          if (!lstatSync(log).isFile()) throw new Error('Invalid conversation log');
        } catch {
          return {
            ok: false,
            code: 'conversation_not_in_workspace',
            message: 'La bitácora de la conversación indicada no pertenece a este workspace.',
            hostRoots,
            unlockMechanism: 'qap_start',
            unlockDescription: 'Inicia o continúa una conversación emitida dentro del workspace activo.',
          };
        }
      }
      const projectCheck = this.validateProjectMatch(selected, toolName, rawArgs, rawProjectId, applicationService);
      if (!projectCheck.ok) {
        return {
          ok: false,
          code: projectCheck.code,
          message: 'El proyecto indicado no pertenece al workspace activo.',
          hostRoots,
          unlockMechanism: 'qap_project',
          unlockDescription: 'Usa un project_id vigente dentro de este workspace.',
        };
      }
      const boundCtx = this.setActiveContext({
        canonicalRoot: selected,
        rootKey: scopeKey,
        projectId: projectCheck.projectId,
        ...(conversationId ? { conversationId } : {}),
      });
      return {
        ok: true,
        canonicalRoot: selected,
        rootKey: scopeKey,
        projectId: projectCheck.projectId,
        contextSwitched: false,
        isExplicitTransition: this.isExplicitTransitionCall(toolName, rawArgs, conversationId),
        existingConversation: conversationId ? boundCtx : undefined,
        hostRoots,
        resolutionSource: 'configured_root',
      };
    }

    // 2. Resolución por conversation_id explícito en runtime multiproyecto.
    if (conversationId) {
      const existingCtx = this.conversationContexts.get(conversationId);
      if (existingCtx) {
        if (!hintParse.ok || (hintParse.hint !== undefined && normalizePathKey(hintParse.hint) !== existingCtx.rootKey)) {
          return {
            ok: false,
            code: 'conversation_not_in_workspace',
            message: 'La conversación pertenece a otro workspace y no puede reutilizarse aquí.',
            hostRoots,
            unlockMechanism: 'qap_start',
            unlockDescription: 'Inicia una conversación nueva con qap_start para este workspace.',
          };
        }
        if (hostRoots.advertised && !hostRoots.validRoots.has(existingCtx.rootKey)) {
          const evicted = this.invalidateRoot(existingCtx.rootKey);
          return {
            ok: false,
            code: 'workspace_host_root_changed',
            message: 'La raíz de esta conversación ya no está autorizada por el host.',
            hostRoots,
            evictedRoot: existingCtx.canonicalRoot,
            evictedConversationIds: evicted,
            unlockMechanism: 'qap_start',
            unlockDescription: 'Selecciona el nuevo workspace con qap_start o qap_project.',
          };
        }
        let canonicalRoot: string;
        try {
          canonicalRoot = validateCandidateWorkspace(existingCtx.canonicalRoot, hostDirectory);
        } catch {
          const evicted = this.invalidateRoot(existingCtx.rootKey);
          return {
            ok: false,
            code: 'workspace_root_unavailable',
            message: 'La carpeta del proyecto ya no existe en disco; se invalidó el contexto.',
            hostRoots,
            evictedRoot: existingCtx.canonicalRoot,
            evictedConversationIds: evicted,
            unlockMechanism: 'qap_start',
            unlockDescription: 'Selecciona otro workspace válido con qap_start o qap_project.',
          };
        }
        const projectCheck = this.validateProjectMatch(canonicalRoot, toolName, rawArgs, rawProjectId, applicationService);
        if (!projectCheck.ok) {
          return {
            ok: false,
            code: projectCheck.code,
            message: 'El proyecto solicitado no coincide con el contexto de esta conversación.',
            hostRoots,
            unlockMechanism: 'qap_project',
            unlockDescription: 'Verifica el project_id correspondiente a esta conversación.',
          };
        }
        const refreshed = this.touchConversationContext({
          ...existingCtx,
          canonicalRoot,
          projectId: projectCheck.projectId ?? existingCtx.projectId,
          conversationId,
        });
        return {
          ok: true,
          canonicalRoot,
          rootKey: existingCtx.rootKey,
          projectId: refreshed.projectId,
          contextSwitched: false,
          isExplicitTransition: false,
          existingConversation: refreshed,
          hostRoots,
          resolutionSource: 'conversation_id',
        };
      }
    }

    // 3. Validar sintaxis de rutas enviadas en argumentos antes de cualquier transición.
    if (!hintParse.ok) {
      return {
        ok: false,
        code: 'workspace_outside_configured_root',
        message: 'La ruta indicada no es absoluta o es inconsistente con los parámetros.',
        hostRoots,
        unlockMechanism: 'qap_start',
        unlockDescription: 'Proporciona una ruta absoluta válida y consistente.',
      };
    }

    const isExplicitTransition = this.isExplicitTransitionCall(toolName, rawArgs, conversationId);
    const available = this.buildAvailableWorkspaces(
      hostRoots,
      registryPath,
      hostDirectory,
      applicationService,
      hasPersistentRootAuthority,
    );

    // 4. Transiciones explícitas: qap_start o qap_project(select | resume | create).
    if (isExplicitTransition) {
      let targetCandidate: string | undefined;

      if (hintParse.hint !== undefined) {
        const hintKey = normalizePathKey(hintParse.hint);
        if (hostRoots.advertised) {
          const matchedHostRoot = hostRoots.validRoots.get(hintKey);
          if (!matchedHostRoot) {
            if (this.activeContext?.rootKey === hintKey) {
              const evicted = this.invalidateRoot(hintKey);
              return {
                ok: false,
                code: 'workspace_root_unavailable',
                message: 'El workspace ya no es válido en las raíces del host.',
                hostRoots,
                evictedRoot: hintParse.hint,
                evictedConversationIds: evicted,
                unlockMechanism: 'qap_start',
                unlockDescription: 'Selecciona un workspace disponible en el host.',
              };
            }
            return {
              ok: false,
              code: 'workspace_outside_configured_root',
              message: 'La ruta solicitada no forma parte de las raíces autorizadas por el host.',
              candidateRoot: hintParse.hint,
              rawCandidate: hintParse.hint,
              hostRoots,
              availableWorkspaces: available,
              unlockMechanism: 'local_host',
              unlockDescription: 'Agrega o abre la carpeta en el host o selecciona una de las raíces disponibles.',
            };
          }
          targetCandidate = matchedHostRoot;
        } else {
          try {
            targetCandidate = validateCandidateWorkspace(hintParse.hint, hostDirectory);
          } catch {
            const wasActiveOrRegistered =
              this.activeContext?.rootKey === hintKey ||
              Boolean(this.activeContext && this.activeContext.rootKey === hintKey) ||
              available.some(item => normalizePathKey(item.root) === hintKey) ||
              (() => {
                try {
                  return Boolean(applicationService?.findActiveProjectByRoot(resolve(hintParse.hint)));
                } catch {
                  return false;
                }
              })();
            if (wasActiveOrRegistered || !existsSync(resolve(hintParse.hint))) {
              const evicted = this.invalidateRoot(hintKey);
              const code = wasActiveOrRegistered ? 'workspace_root_unavailable' : 'workspace_path_invalid';
              return {
                ok: false,
                code,
                message: code === 'workspace_root_unavailable'
                  ? 'La carpeta del proyecto dejó de existir en disco; el contexto fue invalidado.'
                  : 'La ruta indicada no es una carpeta física existente y admitida.',
                rawCandidate: hintParse.hint,
                hostRoots,
                evictedRoot: wasActiveOrRegistered ? hintParse.hint : undefined,
                evictedConversationIds: evicted,
                unlockMechanism: 'qap_start',
                unlockDescription: 'Indica la ruta absoluta de una carpeta existente válida.',
              };
            }
            return {
              ok: false,
              code: 'workspace_path_invalid',
              message: 'La ruta indicada no es una carpeta física válida y admitida.',
              rawCandidate: hintParse.hint,
              hostRoots,
              unlockMechanism: 'qap_start',
              unlockDescription: 'Selecciona una carpeta física existente fuera de directorios del sistema y almacenamiento de QAP.',
            };
          }
        }
      } else if (rawProjectId && toolName === 'qap_project') {
        let projectRootFromId: string | undefined;
        try {
          projectRootFromId = applicationService?.resumeProject(rawProjectId, { readOnly: true }).project.canonical_root;
        } catch {
          projectRootFromId = undefined;
        }
        if (!projectRootFromId) {
          return {
            ok: false,
            code: 'project_not_found',
            message: 'El proyecto solicitado no existe o no está disponible.',
            hostRoots,
            availableWorkspaces: available,
            unlockMechanism: 'qap_project',
            unlockDescription: 'Consulta los proyectos disponibles con qap_project(action="list").',
          };
        }
        const rootKey = normalizePathKey(projectRootFromId);
        if (hostRoots.advertised && !hostRoots.validRoots.has(rootKey)) {
          return {
            ok: false,
            code: 'project_not_found',
            message: 'El proyecto solicitado está fuera de las raíces anunciadas por el host.',
            hostRoots,
            availableWorkspaces: available,
            unlockMechanism: 'local_host',
            unlockDescription: 'Abre la carpeta del proyecto en el host o selecciona un proyecto dentro de las raíces activas.',
          };
        }
        try {
          targetCandidate = validateCandidateWorkspace(projectRootFromId, hostDirectory);
        } catch {
          const evicted = this.invalidateRoot(rootKey);
          return {
            ok: false,
            code: 'workspace_root_unavailable',
            message: 'La carpeta física de este proyecto ya no existe en disco.',
            hostRoots,
            evictedRoot: projectRootFromId,
            evictedConversationIds: evicted,
            unlockMechanism: 'qap_project',
            unlockDescription: 'Restaura la carpeta o selecciona otro proyecto disponible.',
          };
        }
      } else if (hostRoots.advertised) {
        if (hostRoots.validRoots.size === 1 && hostRoots.invalidRoots.length === 0) {
          targetCandidate = Array.from(hostRoots.validRoots.values())[0];
        } else if (hostRoots.validRoots.size === 0 && hostRoots.invalidRoots.length === 0) {
          return {
            ok: false,
            code: 'workspace_not_bound',
            message: 'El host no anunció ninguna raíz de proyecto válida.',
            hostRoots,
            availableWorkspaces: available,
            unlockMechanism: 'local_host',
            unlockDescription: 'Abre una carpeta de proyecto en el host o indica su ruta absoluta en targetPath.',
          };
        } else {
          return {
            ok: false,
            code: 'workspace_selection_required',
            message: 'Hay múltiples workspaces disponibles en el host; selecciona explícitamente cuál deseas usar.',
            hostRoots,
            availableWorkspaces: available,
            includeQuestion: true,
            unlockMechanism: 'qap_start',
            unlockDescription: 'Indica explícitamente el workspace en targetPath (o elige uno de available_workspaces) y llama qap_start o qap_project(action="select").',
          };
        }
      } else {
        // Host sin roots (p. ej. Antigravity): jamás adivinar ni reutilizar una raíz histórica sin selección explícita.
        return {
          ok: false,
          code: 'workspace_selection_required',
          message: 'El host no anunció el workspace activo. Indica explícitamente qué carpeta deseas probar.',
          hostRoots,
          availableWorkspaces: available,
          includeQuestion: true,
          unlockMechanism: 'qap_start',
          unlockDescription: 'Indica la ruta absoluta del proyecto en targetPath con qap_start, o selecciona un proyecto existente con qap_project.',
        };
      }

      if (!targetCandidate) {
        return {
          ok: false,
          code: 'workspace_selection_required',
          message: 'Indica explícitamente qué workspace deseas usar en esta sesión.',
          hostRoots,
          availableWorkspaces: available,
          includeQuestion: true,
          unlockMechanism: 'qap_start',
          unlockDescription: 'Indica la ruta absoluta del proyecto en targetPath con qap_start.',
        };
      }

      const scopeKey = normalizePathKey(targetCandidate);
      const contextSwitched = Boolean(this.activeContext && this.activeContext.rootKey !== scopeKey);

      const projectCheck = this.validateProjectMatch(targetCandidate, toolName, rawArgs, rawProjectId, applicationService);
      if (!projectCheck.ok) {
        return {
          ok: false,
          code: projectCheck.code,
          message: 'El project_id indicado no corresponde a la carpeta seleccionada.',
          candidateRoot: targetCandidate,
          hostRoots,
          unlockMechanism: 'qap_project',
          unlockDescription: 'Verifica el project_id del proyecto correspondiente a esa ruta.',
        };
      }

      if (conversationId) {
        try {
          const log = resolveContainedPath(targetCandidate, join('.qa', 'logs', 'conversations', `${conversationId}.jsonl`));
          if (!lstatSync(log).isFile()) throw new Error('Invalid conversation log');
        } catch {
          return {
            ok: false,
            code: 'conversation_not_in_workspace',
            message: 'El conversation_id proporcionado no pertenece al workspace seleccionado.',
            candidateRoot: targetCandidate,
            hostRoots,
            unlockMechanism: 'qap_start',
            unlockDescription: 'Inicia una conversación nueva con qap_start sin reutilizar el ID de otra campaña.',
          };
        }
      }

      return {
        ok: true,
        canonicalRoot: targetCandidate,
        rootKey: scopeKey,
        projectId: projectCheck.projectId,
        contextSwitched,
        isExplicitTransition: true,
        hostRoots,
        resolutionSource: 'explicit_transition',
      };
    }

    // 5. Llamadas operacionales (no transicionales): requieren contexto activo o raíz única del host.
    if (this.activeContext) {
      let activeCanonical: string;
      try {
        activeCanonical = validateCandidateWorkspace(this.activeContext.canonicalRoot, hostDirectory);
      } catch {
        const evictedRoot = this.activeContext.canonicalRoot;
        const evicted = this.invalidateRoot(this.activeContext.rootKey);
        return {
          ok: false,
          code: 'workspace_root_unavailable',
          message: 'La carpeta del workspace activo fue eliminada o dejó de ser accesible; contexto invalidado.',
          hostRoots,
          evictedRoot,
          evictedConversationIds: evicted,
          unlockMechanism: 'qap_start',
          unlockDescription: 'El servidor MCP sigue activo. Selecciona otro workspace válido con qap_start o qap_project.',
        };
      }
      if (hostRoots.advertised && !hostRoots.validRoots.has(this.activeContext.rootKey)) {
        const evictedRoot = this.activeContext.canonicalRoot;
        const evicted = this.invalidateRoot(this.activeContext.rootKey);
        return {
          ok: false,
          code: 'workspace_host_root_changed',
          message: 'Las raíces del host cambiaron respecto al contexto activo.',
          hostRoots,
          evictedRoot,
          evictedConversationIds: evicted,
          unlockMechanism: 'qap_start',
          unlockDescription: 'Ejecuta una transición explícita con qap_start o qap_project(action="select") para operar en la nueva raíz.',
        };
      }
      if (hintParse.hint !== undefined && normalizePathKey(hintParse.hint) !== this.activeContext.rootKey) {
        return {
          ok: false,
          code: 'workspace_outside_configured_root',
          message: 'La operación intentó usar un proyecto distinto al contexto activo.',
          hostRoots,
          availableWorkspaces: available,
          unlockMechanism: 'qap_start',
          unlockDescription: 'Para cambiar de proyecto, realiza una transición explícita con qap_start o qap_project(action="select"|"resume").',
        };
      }
      const projectCheck = this.validateProjectMatch(activeCanonical, toolName, rawArgs, rawProjectId, applicationService);
      if (!projectCheck.ok) {
        return {
          ok: false,
          code: projectCheck.code,
          message: 'El proyecto solicitado no corresponde al contexto activo.',
          hostRoots,
          unlockMechanism: 'qap_project',
          unlockDescription: 'Cambia explícitamente al proyecto deseado mediante qap_project(action="select"|"resume") o qap_start.',
        };
      }
      if (conversationId) {
        try {
          const log = resolveContainedPath(activeCanonical, join('.qa', 'logs', 'conversations', `${conversationId}.jsonl`));
          if (!lstatSync(log).isFile()) throw new Error('Invalid conversation log');
        } catch {
          return {
            ok: false,
            code: 'conversation_not_in_workspace',
            message: 'El conversation_id indicado no existe en este workspace.',
            hostRoots,
            unlockMechanism: 'qap_start',
            unlockDescription: 'Inicia una nueva conversación en este workspace con qap_start.',
          };
        }
      }
      return {
        ok: true,
        canonicalRoot: activeCanonical,
        rootKey: this.activeContext.rootKey,
        projectId: projectCheck.projectId,
        contextSwitched: false,
        isExplicitTransition: false,
        hostRoots,
        resolutionSource: 'active_context',
      };
    }

    // Sin contexto activo todavía:
    if (hostRoots.advertised && hostRoots.validRoots.size === 1 && hostRoots.invalidRoots.length === 0) {
      const singleRoot = Array.from(hostRoots.validRoots.values())[0];
      const scopeKey = normalizePathKey(singleRoot);
      if (hintParse.hint !== undefined && normalizePathKey(hintParse.hint) !== scopeKey) {
        return {
          ok: false,
          code: 'workspace_outside_configured_root',
          message: 'La ruta indicada está fuera de la única raíz autorizada por el host.',
          hostRoots,
          unlockMechanism: 'local_host',
          unlockDescription: 'Usa la raíz anunciada por el host o selecciona otra explícitamente.',
        };
      }
      const projectCheck = this.validateProjectMatch(singleRoot, toolName, rawArgs, rawProjectId, applicationService);
      if (!projectCheck.ok) {
        return {
          ok: false,
          code: projectCheck.code,
          message: 'El proyecto indicado no pertenece a la raíz del host.',
          hostRoots,
          unlockMechanism: 'qap_project',
          unlockDescription: 'Verifica el project_id del workspace activo.',
        };
      }
      if (conversationId) {
        try {
          const log = resolveContainedPath(singleRoot, join('.qa', 'logs', 'conversations', `${conversationId}.jsonl`));
          if (!lstatSync(log).isFile()) throw new Error('Invalid conversation log');
        } catch {
          return {
            ok: false,
            code: 'conversation_not_in_workspace',
            message: 'El conversation_id indicado no existe en este workspace.',
            hostRoots,
            unlockMechanism: 'qap_start',
            unlockDescription: 'Inicia una conversación con qap_start dentro de este workspace.',
          };
        }
      }
      this.setActiveContext({
        canonicalRoot: singleRoot,
        rootKey: scopeKey,
        projectId: projectCheck.projectId,
      });
      return {
        ok: true,
        canonicalRoot: singleRoot,
        rootKey: scopeKey,
        projectId: projectCheck.projectId,
        contextSwitched: false,
        isExplicitTransition: false,
        hostRoots,
        resolutionSource: 'single_host_root',
      };
    }

    // Sin roots del host (o con múltiples roots ambiguas) y sin contexto activo:
    // si se pasó targetPath y ya tiene historial/autoridad persistente inválida (borrada/revocada), repórtalo.
    if (!hostRoots.advertised && hintParse.hint !== undefined) {
      let persistentOk = true;
      try {
        const canonical = realpathSync(hintParse.hint);
        if (normalizePathKey(resolve(hintParse.hint)) === normalizePathKey(canonical)) {
          persistentOk = hasPersistentRootAuthority(canonical);
        }
      } catch {
        persistentOk = true;
      }
      if (!persistentOk) {
        return {
          ok: false,
          code: 'workspace_persistent_authority_required',
          message: 'La autoridad persistente de la raíz indicada fue revocada o su limpieza no ha concluido.',
          candidateRoot: hintParse.hint,
          hostRoots,
          unlockMechanism: 'local_host',
          unlockCommand: preparationCommand,
          unlockDescription: 'Autoriza la raíz localmente mediante el mecanismo del host antes de usarla.',
        };
      }
    }

    return {
      ok: false,
      code: 'workspace_not_bound',
      message: hostRoots.advertised
        ? 'Hay múltiples raíces o ninguna raíz única en el host; selecciona explícitamente el proyecto con qap_start o qap_project.'
        : 'No hay un proyecto activo seleccionado en esta sesión; inicia o selecciona uno explícitamente con qap_start o qap_project.',
      hostRoots,
      availableWorkspaces: available,
      includeQuestion: available.length > 0,
      unlockMechanism: 'qap_start',
      unlockDescription: 'Llama a qap_start indicando el targetPath del proyecto a probar, o usa qap_project(action="list"|"select"|"resume").',
    };
  }

  private validateProjectMatch(
    canonicalRoot: string,
    toolName: string,
    rawArgs: Record<string, unknown> | undefined,
    rawProjectId: string | undefined,
    applicationService?: QapApplicationService,
  ): { readonly ok: true; readonly projectId?: string } | { readonly ok: false; readonly code: string } {
    if (!applicationService) return { ok: true };
    const current = applicationService.findActiveProjectByRoot(canonicalRoot);
    if (rawProjectId) {
      const deleted = toolName === 'qap_project' && rawArgs?.action === 'delete_confirm'
        ? applicationService.getDeletedProjectRoot(rawProjectId)
        : null;
      const retryingDeletion = Boolean(deleted && normalizePathKey(deleted) === normalizePathKey(canonicalRoot));
      if (current?.project_id !== rawProjectId && !retryingDeletion) {
        return { ok: false, code: 'project_not_found' };
      }
    }
    return { ok: true, projectId: current?.project_id };
  }
}
