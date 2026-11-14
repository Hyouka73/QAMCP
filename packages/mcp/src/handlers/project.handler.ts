import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import {
  QAP_CAPABILITIES,
  type CampaignMode,
  type QapCapability,
} from '@qap/shared';

import { ApplicationServiceError, type QapApplicationService } from '../application/application-service.js';
import type { IMcpToolHandler } from '../dispatcher.js';

import { definition, isObject, result, type StateDependencies } from './state-services.js';

const PROJECT_ACTIONS = [
  'create',
  'list',
  'select',
  'resume',
  'delete_preview',
  'delete_confirm',
  'recover',
  'import_qa',
  'verify_import',
  'permissions',
  'revoke_permission',
  'candidates',
  'review_candidate',
  'promote_candidates',
  'discrepancies',
  'resolve_discrepancy',
] as const;

type ProjectAction = (typeof PROJECT_ACTIONS)[number];

const ALLOWED_KEYS = new Set([
  'action',
  'targetPath',
  'project_id',
  'name',
  'canonical_root',
  'objective',
  'base_url',
  'env_name',
  'tenant_mode',
  'default_tenant',
  'mode',
  'allow_recreate_deleted',
  'include_deleted',
  'confirmation_token',
  'decision',
  'purge_workspace_qa',
  'source_root',
  'import_id',
  'grant_id',
  'capabilities',
  'reason',
  'candidate_id',
  'candidate_decision',
  'selected_candidates',
  'discrepancy_id',
  'discrepancy_choice',
]);

const VALID_MODES = new Set<CampaignMode>([
  'investigate',
  'investigate_and_test',
  'investigate_bug',
  'continue',
]);

function isOptionalString(value: unknown, maxLen = 1024): value is string | undefined {
  return value === undefined || (typeof value === 'string' && value.length <= maxLen);
}

function isNonEmptyString(value: unknown, maxLen = 512): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLen;
}

function blocked(code: string, message: string, unlock: string, extra: Record<string, unknown> = {}): CallToolResult {
  return result(
    {
      status: 'blocked',
      category: 'human_authorization',
      code,
      mensaje: message,
      desbloquear_con: {
        mecanismo: 'qap_project',
        tool: 'qap_project',
        descripcion: unlock,
      },
      ...extra,
    },
    true,
  );
}

/**
 * MCP adapter handler for durable project identity, lifecycle, permissions,
 * versioned .qa import, safe explicit deletion, and recovery.
 */
export class ProjectHandler implements IMcpToolHandler {
  readonly definition = definition('qap_project');

  constructor(private readonly dependencies: StateDependencies) {}

  validateArguments(args: unknown): boolean {
    if (!isObject(args)) return false;
    for (const key of Object.keys(args)) {
      if (!ALLOWED_KEYS.has(key)) return false;
    }
    const action = args.action;
    if (typeof action !== 'string' || !(PROJECT_ACTIONS as readonly string[]).includes(action)) {
      return false;
    }

    if (
      !isOptionalString(args.targetPath, 1024) ||
      !isOptionalString(args.project_id, 128) ||
      !isOptionalString(args.name, 200) ||
      !isOptionalString(args.canonical_root, 1024) ||
      !isOptionalString(args.objective, 2000) ||
      !isOptionalString(args.base_url, 1024) ||
      !isOptionalString(args.env_name, 100) ||
      !isOptionalString(args.default_tenant, 128) ||
      !isOptionalString(args.confirmation_token, 256) ||
      !isOptionalString(args.decision, 64) ||
      !isOptionalString(args.source_root, 1024) ||
      !isOptionalString(args.import_id, 128) ||
      !isOptionalString(args.grant_id, 128) ||
      !isOptionalString(args.reason, 500)
    ) {
      return false;
    }

    if (args.tenant_mode !== undefined && args.tenant_mode !== 'single' && args.tenant_mode !== 'multi_tenant') {
      return false;
    }
    if (args.mode !== undefined && (typeof args.mode !== 'string' || !VALID_MODES.has(args.mode as CampaignMode))) {
      return false;
    }
    for (const flag of ['allow_recreate_deleted', 'include_deleted', 'purge_workspace_qa'] as const) {
      if (args[flag] !== undefined && typeof args[flag] !== 'boolean') return false;
    }
    if (args.capabilities !== undefined) {
      if (!Array.isArray(args.capabilities) || args.capabilities.length > 10) return false;
      if (args.capabilities.some((c) => typeof c !== 'string' || !(QAP_CAPABILITIES as readonly string[]).includes(c))) {
        return false;
      }
    }
    if (
      !isOptionalString(args.candidate_id, 128) ||
      !isOptionalString(args.discrepancy_id, 128)
    ) {
      return false;
    }
    if (args.candidate_decision !== undefined && args.candidate_decision !== 'approved' && args.candidate_decision !== 'rejected') {
      return false;
    }
    if (
      args.discrepancy_choice !== undefined &&
      (typeof args.discrepancy_choice !== 'string' || !['kept_source_a', 'kept_source_b', 'dismissed'].includes(args.discrepancy_choice))
    ) {
      return false;
    }
    if (args.selected_candidates !== undefined) {
      if (!Array.isArray(args.selected_candidates) || args.selected_candidates.length > 64) return false;
      if (args.selected_candidates.some((c) => !isNonEmptyString(c, 128))) return false;
    }

    switch (action as ProjectAction) {
      case 'create':
        return isNonEmptyString(args.canonical_root ?? args.targetPath, 1024);
      case 'list':
        return true;
      case 'select':
      case 'resume':
      case 'delete_preview':
      case 'recover':
      case 'import_qa':
      case 'permissions':
      case 'revoke_permission':
      case 'candidates':
      case 'discrepancies':
        return isNonEmptyString(args.project_id, 128);
      case 'review_candidate':
        return (
          isNonEmptyString(args.project_id, 128) &&
          isNonEmptyString(args.candidate_id, 128) &&
          (args.candidate_decision === 'approved' || args.candidate_decision === 'rejected')
        );
      case 'promote_candidates':
        return (
          isNonEmptyString(args.project_id, 128) &&
          Array.isArray(args.selected_candidates) &&
          args.selected_candidates.length > 0
        );
      case 'resolve_discrepancy':
        return (
          isNonEmptyString(args.project_id, 128) &&
          isNonEmptyString(args.discrepancy_id, 128) &&
          ['kept_source_a', 'kept_source_b', 'dismissed'].includes(String(args.discrepancy_choice))
        );
      case 'delete_confirm':
        return (
          isNonEmptyString(args.project_id, 128) &&
          isNonEmptyString(args.confirmation_token, 256) &&
          isNonEmptyString(args.decision, 64)
        );
      case 'verify_import':
        return isNonEmptyString(args.import_id, 128);
    }
  }

  private requireService(): QapApplicationService | null {
    return this.dependencies.applicationService ?? null;
  }

  private assertAuthorizedWorkspace(candidatePath: string): boolean {
    const roots = this.dependencies.projectRoots;
    if (!roots || roots.length === 0) return false;
    const norm = (value: string) => (process.platform === 'win32' ? resolve(value).toLowerCase() : resolve(value));
    const target = norm(candidatePath);
    return roots.some((root) => norm(root) === target);
  }

  async execute(rawArgs: unknown): Promise<CallToolResult> {
    if (!this.validateArguments(rawArgs)) {
      return result({ status: 'error', code: 'invalid_arguments', message: 'Argumentos inválidos para qap_project.' }, true);
    }
    const args = rawArgs as Record<string, unknown>;
    const workspaceCandidate =
      typeof args.canonical_root === 'string'
        ? args.canonical_root
        : (typeof args.targetPath === 'string' ? args.targetPath : undefined);
    if (workspaceCandidate && this.dependencies.projectRoots && !this.assertAuthorizedWorkspace(workspaceCandidate)) {
      return blocked(
        'workspace_authorization_required',
        'La carpeta seleccionada no está autorizada por el host.',
        'Autoriza el workspace mediante el host o indica una raíz autorizada.',
      );
    }

    const service = this.requireService();
    if (!service) {
      return blocked(
        'application_service_unavailable',
        'El servicio duradero de aplicación no está configurado en este host.',
        'Configura el almacenamiento administrado del host antes de gestionar proyectos por ID.',
      );
    }

    const action = args.action as ProjectAction;
    try {
      switch (action) {
        case 'list': {
          const listing = service.listProjects({ includeDeleted: args.include_deleted === true });
          return result({ status: 'success', ...listing });
        }

        case 'create': {
          const root = String(args.canonical_root ?? args.targetPath);
          if (this.dependencies.projectRoots && !this.assertAuthorizedWorkspace(root)) {
            return blocked(
              'workspace_authorization_required',
              'La carpeta seleccionada no está autorizada por el host.',
              'Autoriza el workspace mediante el host o indica una raíz autorizada.',
            );
          }
          const name = isNonEmptyString(args.name, 200)
            ? args.name.trim()
            : resolve(root).split(/[\\/]/).filter(Boolean).pop() || 'proyecto';
          const snapshot = service.createProject({
            name,
            canonicalRoot: root,
            objective: typeof args.objective === 'string' ? args.objective : undefined,
            baseUrl: typeof args.base_url === 'string' ? args.base_url : undefined,
            envName: typeof args.env_name === 'string' ? args.env_name : undefined,
            tenantMode: args.tenant_mode as 'single' | 'multi_tenant' | undefined,
            defaultTenant: typeof args.default_tenant === 'string' ? args.default_tenant : undefined,
            mode: args.mode as CampaignMode | undefined,
            allowRecreateDeleted: args.allow_recreate_deleted === true,
          });
          return result({ status: 'success', ...snapshot });
        }

        case 'select': {
          const snapshot = service.selectProject(String(args.project_id));
          return result({ status: 'success', ...snapshot });
        }

        case 'resume': {
          const snapshot = service.resumeProject(String(args.project_id));
          return result({ status: 'success', ...snapshot });
        }

        case 'delete_preview': {
          const preview = service.previewDelete(String(args.project_id));
          return result({
            status: 'confirmation_required',
            decision_required: 'confirm_delete',
            preview,
          });
        }

        case 'delete_confirm': {
          const receipt = await service.confirmDelete(
            String(args.project_id),
            String(args.confirmation_token),
            String(args.decision),
            { purgeWorkspaceQa: args.purge_workspace_qa === true },
          );
          return result(receipt);
        }

        case 'recover': {
          const receipt = service.recoverDeletedProject(String(args.project_id));
          return result(receipt);
        }

        case 'import_qa': {
          const projectId = String(args.project_id);
          const sourceRoot = typeof args.source_root === 'string'
            ? args.source_root
            : (typeof args.targetPath === 'string' ? args.targetPath : undefined);
          if (sourceRoot && this.dependencies.projectRoots && !this.assertAuthorizedWorkspace(sourceRoot)) {
            return blocked(
              'workspace_authorization_required',
              'La carpeta origen de importación .qa no está autorizada por el host.',
              'Autoriza la carpeta fuente mediante el host antes de importarla.',
            );
          }
          const resolvedSource = sourceRoot ?? service.resumeProject(projectId).project.canonical_root;
          if (!existsSync(join(resolvedSource, '.qa'))) {
            return blocked(
              'legacy_qa_not_found',
              'No existe una carpeta .qa verificable en la ruta especificada.',
              'Selecciona un workspace que contenga archivos .qa existentes para importar.',
            );
          }
          const receipt = service.importLegacyQa(projectId, sourceRoot);
          return result({ status: 'success', receipt });
        }

        case 'verify_import': {
          const verification = service.verifyLegacyImport(
            String(args.import_id),
            typeof args.source_root === 'string' ? args.source_root : undefined,
          );
          return result({ status: 'success', verification });
        }

        case 'permissions': {
          const projectId = String(args.project_id);
          const snapshot = service.resumeProject(projectId);
          const grants = service.authority.listGrants(projectId, true);
          return result({
            status: 'success',
            project_id: projectId,
            capabilities: snapshot.capabilities,
            grants,
          });
        }

        case 'revoke_permission': {
          const projectId = String(args.project_id);
          const reason = typeof args.reason === 'string' && args.reason.trim()
            ? args.reason.trim()
            : 'user_or_operator_revocation';
          if (typeof args.grant_id === 'string') {
            const revoked = service.authority.revokeGrant(args.grant_id, reason);
            if (!revoked || revoked.project_id !== projectId) {
              return blocked(
                'grant_not_found',
                'El permiso indicado no existe para este proyecto.',
                'Consulta primero las concesiones del proyecto con action="permissions".',
              );
            }
            return result({ status: 'success', project_id: projectId, revoked_grant: revoked });
          }
          const caps = Array.isArray(args.capabilities) ? (args.capabilities as QapCapability[]) : undefined;
          const revokedCount = service.authority.revokeProjectAccess(projectId, reason, caps);
          return result({
            status: 'success',
            project_id: projectId,
            revoked_count: revokedCount,
            capabilities: service.authority.evaluateAll(projectId),
          });
        }

        case 'candidates': {
          const projectId = String(args.project_id);
          const snap = service.resumeProject(projectId);
          return result({
            status: 'success',
            project_id: projectId,
            candidates: snap.module_candidates ?? service.listModuleCandidates(projectId),
          });
        }

        case 'review_candidate': {
          const projectId = String(args.project_id);
          const candidate = service.reviewModuleCandidate(
            projectId,
            String(args.candidate_id),
            args.candidate_decision as 'approved' | 'rejected',
          );
          return result({ status: 'success', project_id: projectId, candidate });
        }

        case 'promote_candidates': {
          const projectId = String(args.project_id);
          const selected = (args.selected_candidates as string[]).map((candidateKeyOrId) => ({ candidateKeyOrId }));
          const promoted = service.promoteCandidatesToModules(projectId, selected);
          return result({
            status: 'success',
            project_id: projectId,
            promoted_modules: promoted,
            snapshot: service.resumeProject(projectId),
          });
        }

        case 'discrepancies': {
          const projectId = String(args.project_id);
          const snap = service.resumeProject(projectId);
          return result({
            status: 'success',
            project_id: projectId,
            discrepancies: snap.discrepancies ?? service.listDiscrepancies(projectId),
          });
        }

        case 'resolve_discrepancy': {
          const projectId = String(args.project_id);
          const resolved = service.resolveDiscrepancy(
            projectId,
            String(args.discrepancy_id),
            args.discrepancy_choice as 'kept_source_a' | 'kept_source_b' | 'dismissed',
          );
          return result({
            status: 'success',
            project_id: projectId,
            discrepancy: resolved,
          });
        }
      }
    } catch (error) {
      if (error instanceof ApplicationServiceError) {
        return blocked(
          error.code,
          error.message,
          'Revisa el estado del proyecto o solicita una nueva decisión explícita.',
          error.details ?? {},
        );
      }
      return result(
        {
          status: 'error',
          code: 'project_operation_failed',
          message: 'Error interno al procesar la operación de proyecto.',
        },
        true,
      );
    }
  }
}
