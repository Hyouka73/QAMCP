import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FileSystemStorage } from '@qap/knowledge';
import {
  generateHtmlReport,
  generateJunitReport,
  generateJsonReport,
  generateMarkdownReport,
} from '@qap/reporter';
import { SchemaValidator, type ExecutionResult } from '@qap/shared';

import { McpToolError, type IMcpToolHandler, type McpInvocationContext } from '../dispatcher.js';

import { isInternallyConsistentExecution } from './execution-evidence.js';
import {
  definition,
  isObject,
  projectRoot,
  result,
  validateBase,
  type StateDependencies,
} from './state-services.js';

type ReportFormat = 'all' | 'html' | 'markdown' | 'junit' | 'json';

interface ReportArguments {
  targetPath?: string;
  executionId?: string;
  module?: string;
  format?: ReportFormat;
  recover_pending?: boolean;
}

const SAFE_EXECUTION_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const FORMATS: readonly ReportFormat[] = ['all', 'html', 'markdown', 'junit', 'json'];

/** Semantic evidence integrity; JSON schema validation runs separately. */
export function validateReportEvidence(evidence: ExecutionResult): boolean {
  return isInternallyConsistentExecution(evidence);
}

/**
 * The existing HTML generator embeds screenshots via FileSystemStorage.readBuffer.
 * Never let persisted evidence use that feature to read outside the project screenshot directory.
 */
function screenshotReferencesAreSafe(root: string, evidence: ExecutionResult): boolean {
  const approvedDirectory = resolve(root, '.qa', 'reports', 'screenshots');
  const safe = (value: string) => {
    const candidate = resolve(root, value);
    const location = relative(approvedDirectory, candidate);
    return location !== '' && location !== '..' &&
      !location.startsWith('..' + sep) && !isAbsolute(location);
  };
  for (const testCase of evidence.cases) {
    for (const screenshot of testCase.screenshots ?? []) {
      if (!safe(screenshot)) return false;
    }
    for (const step of testCase.steps ?? []) {
      if (step.screenshot && !safe(step.screenshot)) return false;
    }
  }
  return true;
}

/** Declarative qap_report: never creates synthetic executions or coverage. */
export class ReportHandler implements IMcpToolHandler {
  readonly definition = definition('qap_report');

  constructor(private readonly dependencies: StateDependencies) {}

  validateArguments(raw: unknown): boolean {
    if (!isObject(raw) || !validateBase(raw, ['targetPath', 'executionId', 'module', 'format', 'recover_pending'])) {
      return false;
    }
    if (raw.executionId !== undefined &&
      (typeof raw.executionId !== 'string' || !SAFE_EXECUTION_ID.test(raw.executionId))) {
      return false;
    }
    if (raw.module !== undefined &&
      (typeof raw.module !== 'string' || !raw.module.trim() || raw.module.length > 128 ||
        raw.module === '.' || raw.module === '..' || /[\\/:]/.test(raw.module))) {
      return false;
    }
    if (raw.recover_pending !== undefined && typeof raw.recover_pending !== 'boolean') {
      return false;
    }
    return raw.format === undefined ||
      (typeof raw.format === 'string' && FORMATS.includes(raw.format as ReportFormat));
  }

  async execute(raw: unknown, context: McpInvocationContext): Promise<CallToolResult> {
    if (!this.validateArguments(raw) || !isObject(raw)) throw new McpToolError('invalid_arguments');
    if (context?.signal?.aborted) throw new McpToolError('cancelled');

    const args = raw as ReportArguments;
    const format = args.format ?? 'all';
    const root = projectRoot(args, this.dependencies, true);
    const storage = new FileSystemStorage({ rootDir: root });
    const validator = new SchemaValidator();
    const executeDirectory = '.qa/executions';

    if (!(await storage.exists(executeDirectory))) {
      return result({
        status: 'blocked',
        code: 'no_recorded_executions',
        message: 'No existen ejecuciones persistidas para generar un informe.',
        razon: 'No existen ejecuciones persistidas; ejecute qap_test antes de solicitar reportes.',
        desbloquear_con: 'qap_status',
        siguiente_accion: {
          tipo: 'trabajo',
          tool: 'qap_status',
          descripcion: 'Consulta el estado del proyecto; todavía no hay ejecuciones registradas.',
        },
      }, true);
    }

    const appService = this.dependencies.applicationService;
    const appProject = appService?.findActiveProjectByRoot(root) ?? null;

    let executionId = args.executionId;
    if (!executionId && appProject && appService) {
      const pendingPubs = appService.listRecoverablePublications(appProject.project_id);
      const matchingPending = pendingPubs.find(p => !args.module || p.module_key === args.module);
      if (matchingPending && (args.recover_pending === true || SAFE_EXECUTION_ID.test(matchingPending.execution_id))) {
        executionId = matchingPending.execution_id;
      }
    }

    let evidence: ExecutionResult | null = null;
    if (executionId) {
      try {
        evidence = await storage.getExecutionResult(executionId);
      } catch {
        return result({
          status: 'blocked',
          code: 'corrupt_execution',
          message: 'El resultado de ejecución solicitado no se puede leer.',
          desbloquear_con: 'qap_status',
        }, true);
      }
      if (evidence && args.module && evidence.module !== args.module) {
        return result({
          status: 'blocked',
          code: 'execution_module_mismatch',
          message: 'La ejecución no pertenece al módulo solicitado.',
          desbloquear_con: 'qap_status',
        }, true);
      }
    } else {
      // Select the latest canonical execution, not the newest report or a synthetic summary.
      let files: string[];
      try {
        files = await storage.list(executeDirectory);
      } catch {
        return result({
          status: 'blocked',
          code: 'execution_inventory_unavailable',
          message: 'No fue posible consultar las ejecuciones persistidas.',
          desbloquear_con: 'qap_status',
        }, true);
      }
      if (files.length > 5000) {
        return result({
          status: 'blocked',
          code: 'execution_inventory_too_large',
          message: 'Demasiadas ejecuciones para una selección implícita; especifique executionId.',
          desbloquear_con: 'qap_report',
        }, true);
      }
      let newest = -Infinity;
      for (const file of files) {
        if (!file.endsWith('.json') || file.endsWith('.report.json')) continue;
        const candidateId = file.slice(0, -5);
        if (!SAFE_EXECUTION_ID.test(candidateId)) continue;
        let candidate: ExecutionResult | null;
        try {
          candidate = await storage.getExecutionResult(candidateId);
        } catch {
          continue;
        }
        if (!candidate || candidate.execution_id !== candidateId ||
          (args.module && candidate.module !== args.module) ||
          !validator.validateExecutionResult(candidate).valid ||
          !validateReportEvidence(candidate)) continue;
        const stamp = Date.parse(candidate.finished_at);
        if (Number.isFinite(stamp) && stamp > newest) {
          newest = stamp;
          executionId = candidateId;
          evidence = candidate;
        }
      }
    }

    if (!executionId || !evidence) {
      return result({
        status: 'blocked',
        code: 'no_matching_execution',
        message: 'No existe una ejecución real guardada que coincida con la solicitud.',
        razon: 'No hay ejecuciones válidas registradas para generar el reporte.',
        desbloquear_con: 'qap_status',
        siguiente_accion: {
          tipo: 'trabajo',
          tool: 'qap_status',
          descripcion: 'Consulta el estado antes de ejecutar o reportar nuevas pruebas.',
        },
      }, true);
    }
    if (evidence.execution_id !== executionId ||
      !validator.validateExecutionResult(evidence).valid ||
      !validateReportEvidence(evidence)) {
      return result({
        status: 'blocked',
        code: 'invalid_execution_evidence',
        message: 'La evidencia no cumple el esquema o sus conteos no coinciden; no se generó un informe.',
        desbloquear_con: 'qap_status',
      }, true);
    }
    if (!screenshotReferencesAreSafe(root, evidence)) {
      return result({
        status: 'blocked',
        code: 'unsafe_artifact_reference',
        message: 'La evidencia contiene referencias a capturas fuera de la carpeta autorizada.',
        desbloquear_con: 'qap_status',
      }, true);
    }

    const paths: Record<string, string> = {};
    const requestedFormats: Array<'html' | 'markdown' | 'junit' | 'json'> =
      format === 'all'
        ? FORMATS.filter((item): item is 'html' | 'markdown' | 'junit' | 'json' => item !== 'all')
        : [format];
    const matchingAttempt =
      appProject && appService
        ? appService.listExecutionAttempts(appProject.project_id, evidence.module).find(a => a.execution_id === executionId)
        : undefined;
    let publication =
      appProject && appService
        ? appService.beginReportPublication({
            projectId: appProject.project_id,
            campaignId: matchingAttempt?.campaign_id ?? appProject.active_campaign_id ?? null,
            attemptId: matchingAttempt?.attempt_id ?? null,
            executionId,
            moduleKey: evidence.module,
            requestedFormats,
          })
        : null;
    const reusedFormats: string[] = [];
    const generatedFormats: string[] = [];

    for (const requested of requestedFormats) {
      if (context?.signal?.aborted) throw new McpToolError('cancelled');
      const existingFormatEntry = publication?.published_formats?.[requested];
      if (existingFormatEntry && existsSync(existingFormatEntry.path)) {
        try {
          const currentSha = createHash('sha256').update(readFileSync(existingFormatEntry.path)).digest('hex');
          if (currentSha === existingFormatEntry.sha256) {
            paths[requested] = existingFormatEntry.path;
            reusedFormats.push(requested);
            continue;
          }
        } catch {
          // Fall through and regenerate cleanly if unreadable
        }
      }

      let extension: string;
      let body: string;
      try {
        switch (requested) {
          case 'html':
            extension = 'html';
            body = await generateHtmlReport(evidence, { storage });
            break;
          case 'markdown':
            extension = 'md';
            body = generateMarkdownReport(evidence);
            break;
          case 'junit':
            extension = 'xml';
            body = generateJunitReport(evidence);
            break;
          case 'json':
            extension = 'json';
            body = generateJsonReport(evidence);
            break;
          default:
            throw new McpToolError('invalid_arguments');
        }
        const relativeOutput = join(executeDirectory, executionId + '.report.' + extension);
        await storage.write(relativeOutput, body);
        const absoluteOutput = resolve(root, relativeOutput);
        paths[requested] = absoluteOutput;
        generatedFormats.push(requested);
        if (publication && appService) {
          const bytes = Buffer.byteLength(body, 'utf8');
          const sha256 = createHash('sha256').update(body, 'utf8').digest('hex');
          publication = appService.recordPublishedReportFormat({
            publicationId: publication.publication_id,
            format: requested,
            filePath: absoluteOutput,
            sha256,
            bytes,
          });
        }
      } catch {
        if (publication && appService) {
          try {
            publication = appService.failReportPublication(publication.publication_id, requested) ?? publication;
          } catch {
            // Suppress secondary tracking errors during partial failure return
          }
        }
        return result({
          status: 'partial',
          code: 'report_generation_or_persistence_failed',
          executionId,
          reports: paths,
          ...(publication ? { publication_id: publication.publication_id, publication_status: publication.status, failed_format: requested } : {}),
          recovered_without_reexecution: reusedFormats.length > 0,
          reused_formats: reusedFormats,
          generated_formats: generatedFormats,
          message: 'No se completaron todos los informes solicitados. No se acredita éxito total; recupera la publicación pendiente con qap_report sin reejecutar pruebas.',
          desbloquear_con: 'qap_report',
        }, true);
      }
    }

    const canonicalExecutionSummary =
      appProject && appService ? appService.getExecutionSummary(appProject.project_id, evidence.module) : undefined;

    return result({
      status: 'success',
      directorio_objetivo: root,
      executionId,
      module: evidence.module,
      result: evidence.result,
      summary: evidence.summary,
      ...(matchingAttempt ? { attempt_id: matchingAttempt.attempt_id } : {}),
      ...(canonicalExecutionSummary ? { canonical_execution_summary: canonicalExecutionSummary } : {}),
      ...(publication
        ? {
            publication: {
              publication_id: publication.publication_id,
              status: publication.status,
              reused_formats: reusedFormats,
              generated_formats: generatedFormats,
            },
          }
        : {}),
      reports: paths,
      evidence_source: 'persisted_execution',
      traceability_file: existsSync(resolve(root, '.qa/executions/' + executionId + '.trace.json')) ? resolve(root, '.qa/executions/' + executionId + '.trace.json') : null,
      viewer_url: null,
    });
  }
}
