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
    if (!isObject(raw) || !validateBase(raw, ['targetPath', 'executionId', 'module', 'format'])) {
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

    let executionId = args.executionId;
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
    const selected = format === 'all' ? FORMATS.filter(item => item !== 'all') : [format];
    for (const requested of selected) {
      if (context?.signal?.aborted) throw new McpToolError('cancelled');
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
        paths[requested] = resolve(root, relativeOutput);
      } catch {
        return result({
          status: 'partial',
          code: 'report_generation_or_persistence_failed',
          executionId,
          reports: paths,
          message: 'No se completaron todos los informes solicitados. No se acredita éxito total.',
          desbloquear_con: 'qap_report',
        }, true);
      }
    }

    return result({
      status: 'success',
      directorio_objetivo: root,
      executionId,
      module: evidence.module,
      result: evidence.result,
      summary: evidence.summary,
      reports: paths,
      evidence_source: 'persisted_execution',
      viewer_url: null,
    });
  }
}
