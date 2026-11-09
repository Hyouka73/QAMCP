import { existsSync, readFileSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';
import { randomUUID } from 'node:crypto';

import YAML from 'yaml';
import { SchemaValidator, type ProjectContext, type ProjectPhase, type ContextSource, type BusinessRole, type CriticalFlow, type SourceOfTruthType } from '@qap/shared';
import { FileSystemStorage, resolverDocumento, parsePrdContent, detectarServiciosConEvidencia, detectarDocumentosProyecto } from '@qap/knowledge';
import { canExitOnboarding, generarRenderTexto, guardPregunta, sanitizeDomString, type Pregunta } from '@qap/engine';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { getPhaseGuidance } from '../guidance.js';
import type { IMcpToolHandler, McpInvocationContext } from '../dispatcher.js';

import { definition, validateContextArguments, projectRoot, readContext, readEnvironment, readCorrections, type LegacyEnvironment, type ContextArguments, type StateDependencies, contextKnowledge, result, ContextFiles, safeDocument, StateOperationError } from './state-services.js';
import { buildCorrectionQuestion } from './state-runtime.js';

export class ContextHandler implements IMcpToolHandler {
  readonly definition = definition('qap_context_set');
  constructor(private readonly dependencies: StateDependencies) {}
  validateArguments(args: unknown): boolean { return validateContextArguments(args); }
  private readonly pending = new Map<string, Promise<void>>();
  async execute(raw: unknown, invocation: McpInvocationContext): Promise<CallToolResult> {
    const rootDir = projectRoot(raw, this.dependencies, true);
    const previous = this.pending.get(rootDir) ?? Promise.resolve();
    let release = () => {};
    const current = new Promise<void>(done => { release = done; });
    this.pending.set(rootDir, current);
    await previous;
    try { return await this.executeLocked(rootDir, raw, invocation); }
    finally { release(); if (this.pending.get(rootDir) === current) this.pending.delete(rootDir); }
  }
  private async executeLocked(rootDir: string, raw: unknown, invocation: McpInvocationContext): Promise<CallToolResult> {
    const args = { ...(raw ?? {}) as ContextArguments };
    if (typeof args.roles === 'string') args.roles = args.roles.split(',').map(name => ({ name: name.trim() }));
    if (typeof args.critical_flows === 'string') args.critical_flows = args.critical_flows.split(',').map(name => ({ name: name.trim() }));
    const knowledge = await contextKnowledge(rootDir, args, this.dependencies);
    if (knowledge.state === 'incompatible' || knowledge.state === 'unavailable') return result({ status: 'blocked', code: 'knowledge_context_unavailable', knowledge }, true);
    if (!existsSync(join(rootDir, '.qa'))) return result({ status: 'error', code: 'project_not_initialized' }, true);
    let staged: ContextFiles;
    try { staged = new ContextFiles(rootDir, invocation.signal); }
    catch (error) { return result({ status: 'blocked', code: error instanceof StateOperationError ? error.code : 'legacy_storage_unavailable' }, true); }
    try {
      const response = await this.update(rootDir, args, staged);
      return { ...response, content: response.content.map(item => item.type === 'text' ? { type: 'text', text: JSON.stringify({ ...JSON.parse(item.text) as Record<string, unknown>, knowledge, persistence: staged.state }) } : item) };
    } catch (error) {
      return result({ status: staged.state !== 'staged' ? 'partial' : 'error', code: staged.state === 'committed' ? 'legacy_lifecycle_incomplete' : staged.state === 'partial' ? 'legacy_publication_incomplete' : error instanceof StateOperationError ? error.code : 'legacy_write_failed', persistence: staged.state }, true);
    } finally { staged.close(); }
  }
  private async update(rootDir: string, args: ContextArguments, staged: ContextFiles): Promise<CallToolResult> {

    const qaDir = resolve(rootDir, '.qa');
    if (!existsSync(qaDir)) return result({ status: 'error', code: 'project_not_initialized' }, true);

    const contextPath = join(qaDir, 'project', 'context.yaml');
    let existingContext: ProjectContext = {
      _version: '1',
      project_name: basename(rootDir),
      description: `Configuración base de QA para ${basename(rootDir)}`,
      tech_stack: [],
      manually_edited: false,
    };
    if (existsSync(contextPath)) existingContext = readContext(contextPath) ?? existingContext;

    const callerSource: ContextSource | undefined = (typeof args.source === 'string' && ['user', 'prd', 'inferred'].includes(args.source))
      ? args.source
      : undefined;
    const defaultSource: ContextSource = callerSource || 'user';

    const ignoredDowngrades: Array<{ field: string; reason: string }> = [];

    // Gestión de estado de correcciones (B7)
    const correctionsCachePath = join(qaDir, 'cache', 'onboarding_corrections.json');
    let correctionsState: { pending: string[]; completed: string[] } | null = null;
    // justCompleted: campos respondidos en esta misma llamada (necesario para isCorrection cuando correctionsState ya es null)
    const justCompleted: string[] = [];
    if (existsSync(correctionsCachePath)) {
      correctionsState = readCorrections(correctionsCachePath);
    }

    if ((args.confirmar_resumen === 'corregir' || args.accion === 'corregir') && !args.corregir && !args.campos) {
      const rawCamposPregunta: Pregunta = {
        id: 'onboarding.campos_a_corregir',
        texto: 'Selecciona los campos que requieren corrección:',
        formato: 'multiple',
        opciones: [
          { id: 'objective', etiqueta: 'Objetivo' },
          { id: 'roles', etiqueta: 'Roles' },
          { id: 'critical_flows', etiqueta: 'Flujos críticos' },
          { id: 'base_url', etiqueta: 'URL base' },
        ],
        permite_otra: false,
        registrar_con: { tool: 'qap_context_set', campo: 'corregir' },
      };
      rawCamposPregunta.render_texto = generarRenderTexto(rawCamposPregunta);
      const camposPregunta = guardPregunta(rawCamposPregunta) as Pregunta;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                status: 'success',
                directorio_objetivo: rootDir,
                fase: 'ONBOARDING',
                transicion_automatica: false,
                faltantes: [],
                context: existingContext,
                siguiente_accion: {
                  tipo: 'entrevista',
                  descripcion: 'Selecciona los campos que requieren corrección.',
                  tool: 'qap_context_set',
                  pregunta: camposPregunta,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (args.corregir || args.campos || (args.confirmar_resumen === 'corregir' && (args.corregir || args.campos))) {
      const rawList = Array.isArray(args.corregir)
        ? args.corregir
        : (typeof args.corregir === 'string'
            ? [args.corregir]
            : (Array.isArray(args.campos)
                ? args.campos
                : (typeof args.campos === 'string' ? [args.campos] : [])));
      const validFields = rawList.map(String).filter((f) => ['objective', 'roles', 'critical_flows', 'base_url'].includes(f));
      if (validFields.length > 0) {
        correctionsState = {
          pending: validFields,
          completed: [],
        };
        staged.write(correctionsCachePath, JSON.stringify(correctionsState, null, 2), 'utf-8');
      }
    } else if (correctionsState && Array.isArray(correctionsState.pending) && correctionsState.pending.length > 0) {
      const currentField = correctionsState.pending[0];
      let answered = false;
      if (currentField === 'objective' && args.objective !== undefined) {
        answered = true;
      } else if (currentField === 'roles' && args.roles !== undefined) {
        answered = true;
      } else if (currentField === 'critical_flows' && args.critical_flows !== undefined) {
        answered = true;
      } else if (currentField === 'base_url' && (args.base_url !== undefined || args.environments !== undefined)) {
        answered = true;
      }

      if (answered) {
        justCompleted.push(currentField);
        correctionsState.completed.push(currentField);
        correctionsState.pending.shift();
        if (correctionsState.pending.length > 0) {
          staged.write(correctionsCachePath, JSON.stringify(correctionsState, null, 2), 'utf-8');
        } else {
          staged.remove(correctionsCachePath, { force: true });
          correctionsState = null;
        }
      }
    }

    // Soporte directo para base_url / environments
    const rawUrl = typeof args.base_url === 'string' && args.base_url.trim().length > 0
      ? args.base_url.trim()
      : (typeof args.environments === 'string' && args.environments.trim().length > 0 ? args.environments.trim() : undefined);
    if (rawUrl) {
      existingContext.base_url = rawUrl;
      const envsPath = join(qaDir, 'project', 'environments.yaml');
      let envsYaml: LegacyEnvironment | null = existsSync(envsPath) ? readEnvironment(envsPath) : null;
      if (!envsYaml) {
        envsYaml = { _version: '1', default: 'local', environments: {} };
      }
      envsYaml.environments = envsYaml.environments || {};
      envsYaml.environments.local = { url: rawUrl, browser_mode: 'auto' };
      staged.write(envsPath, YAML.stringify(envsYaml), 'utf-8');
    }

    // Confirmación única (E4a): Promoción de campos inferred a user cuando se confirma resumen
    if (args.confirmar_resumen === 'confirmo_todo' || args.accion === 'confirmar_resumen') {
      if (existingContext.objective) {
        existingContext.objective_source = 'user';
      }
      if (Array.isArray(existingContext.roles)) {
        for (const r of existingContext.roles) {
          r.source = 'user';
        }
      }
      if (Array.isArray(existingContext.critical_flows)) {
        for (const f of existingContext.critical_flows) {
          f.source = 'user';
        }
      }
      if (existingContext.source_of_truth) {
        existingContext.source_of_truth.source = 'user';
        existingContext.source_of_truth.declared = true;
      }
    }

    // 1. Objetivo
    if (args.objective !== undefined) {
      const newObj = String(args.objective);
      const isCorrection = justCompleted.includes('objective') || correctionsState?.completed.includes('objective') || (correctionsState && correctionsState.pending[0] === 'objective');
      const newSource = isCorrection
        ? 'user'
        : ((typeof args.objective_source === 'string' && args.objective_source !== 'inferred' && ['user', 'prd'].includes(args.objective_source))
            ? args.objective_source
            : (callerSource ?? (args.objective_source === 'inferred' ? 'inferred' : defaultSource)));
      if (existingContext.objective_source === 'user' && newSource !== 'user') {
        ignoredDowngrades.push({
          field: 'objective',
          reason: 'No se puede sobrescribir un objetivo con source "user" por uno con source "prd" o "inferred"',
        });
      } else {
        existingContext.objective = newObj;
        existingContext.objective_source = newSource;
      }
    }

    // 2. Roles
    if (Array.isArray(args.roles)) {
      const isCorrection = justCompleted.includes('roles') || correctionsState?.completed.includes('roles') || (correctionsState && correctionsState.pending[0] === 'roles');
      // En modo corrección, el array se reemplaza completamente (no merge) para que roles[0] sea el primero del nuevo array
      if (isCorrection) {
        existingContext.roles = [];
      } else {
        existingContext.roles = existingContext.roles || [];
      }
      for (const r of args.roles) {
        if (!r) continue;
        const roleName = typeof r === 'string' ? r.trim() : String(r.name || '').trim();
        if (!roleName) continue;
        const rObj = typeof r === 'object' ? r : {} as Partial<BusinessRole>;
        const rSource = isCorrection
          ? 'user'
          : ((rObj.source && rObj.source !== 'inferred' && ['user', 'prd'].includes(rObj.source))
              ? rObj.source
              : (callerSource ?? (rObj.source === 'inferred' ? 'inferred' : defaultSource)));
        const exIdx = existingContext.roles.findIndex((er) => er.name === roleName);
        if (exIdx >= 0) {
          const exRole = existingContext.roles[exIdx];
          if (exRole.source === 'user' && rSource !== 'user') {
            ignoredDowngrades.push({
              field: `roles.${roleName}`,
              reason: `No se puede sobrescribir el rol '${roleName}' con source "user" por uno con source "prd" o "inferred"`,
            });
          } else {
            existingContext.roles[exIdx] = {
              name: roleName,
              description: rObj.description !== undefined ? String(rObj.description) : exRole.description,
              source: rSource,
            };
          }
        } else {
          existingContext.roles.push({
            name: roleName,
            description: rObj.description !== undefined ? String(rObj.description) : undefined,
            source: rSource,
          });
        }
      }
    }

    // 3. Flujos críticos
    if (Array.isArray(args.critical_flows)) {
      const isCorrection = justCompleted.includes('critical_flows') || correctionsState?.completed.includes('critical_flows') || (correctionsState && correctionsState.pending[0] === 'critical_flows');
      if (isCorrection) {
        existingContext.critical_flows = [];
      } else {
        existingContext.critical_flows = existingContext.critical_flows || [];
      }
      for (const f of args.critical_flows) {
        if (!f) continue;
        const flowName = typeof f === 'string' ? f.trim() : String(f.name || '').trim();
        if (!flowName) continue;
        const fObj = typeof f === 'object' ? f : {} as Partial<CriticalFlow>;
        const fSource = isCorrection
          ? 'user'
          : ((fObj.source && fObj.source !== 'inferred' && ['user', 'prd'].includes(fObj.source))
              ? fObj.source
              : (callerSource ?? (fObj.source === 'inferred' ? 'inferred' : defaultSource)));
        const exIdx = existingContext.critical_flows.findIndex((ef) => ef.name === flowName);
        if (exIdx >= 0) {
          const exFlow = existingContext.critical_flows[exIdx];
          if (exFlow.source === 'user' && fSource !== 'user') {
            ignoredDowngrades.push({
              field: `critical_flows.${flowName}`,
              reason: `No se puede sobrescribir el flujo '${flowName}' con source "user" por uno con source "prd" o "inferred"`,
            });
          } else {
            existingContext.critical_flows[exIdx] = {
              name: flowName,
              description: fObj.description !== undefined ? String(fObj.description) : exFlow.description,
              priority: fObj.priority !== undefined ? String(fObj.priority) : exFlow.priority,
              source: fSource,
            };
          }
        } else {
          existingContext.critical_flows.push({
            name: flowName,
            description: fObj.description !== undefined ? String(fObj.description) : undefined,
            priority: fObj.priority !== undefined ? String(fObj.priority) : undefined,
            source: fSource,
          });
        }
      }
    }

    // 4. Fuente de verdad (E1b resolución y E2a auto-ingesta determinista)
    let sotRef: string | undefined;
    let sotType: SourceOfTruthType = 'prd';
    let sotDeclared = true;
    let sotNotes: string | undefined;
    let sotSource = callerSource || 'user';

    if (typeof args.source_of_truth === 'string') {
      sotRef = args.source_of_truth.trim();
    } else if (args.source_of_truth && typeof args.source_of_truth === 'object') {
      const sot = args.source_of_truth;
      sotRef = sot.ref !== undefined ? String(sot.ref).trim() : undefined;
      sotType = sot.type || (sotRef ? 'prd' : 'none');
      sotDeclared = sot.declared !== undefined ? Boolean(sot.declared) : true;
      sotNotes = sot.notes !== undefined ? String(sot.notes) : undefined;
      sotSource = (sot.source && sot.source !== 'inferred' && ['user', 'prd'].includes(sot.source))
        ? sot.source
        : (callerSource ?? (sot.source === 'inferred' ? 'inferred' : defaultSource));
    }

    if (sotRef) {
      const resolved = resolverDocumento(rootDir, sotRef);
      if (resolved) {
        if (existingContext.source_of_truth?.source === 'user' && sotSource !== 'user') {
          ignoredDowngrades.push({
            field: 'source_of_truth',
            reason: 'No se puede sobrescribir una fuente de verdad con source "user" por una con source "prd" o "inferred"',
          });
        } else {
          existingContext.source_of_truth = {
            type: 'prd',
            ref: resolved.path,
            declared: true,
            notes: sotNotes || existingContext.source_of_truth?.notes,
            source: sotSource,
          };
        }

        // Auto-ingesta determinista (E2a)
        try {
          const docAbsPath = safeDocument(rootDir, resolved.path);
          const rawContent = readFileSync(docAbsPath, 'utf-8');
          const parsed = parsePrdContent(rawContent, resolved.path);
          if (parsed.objective && existingContext.objective_source !== 'user') {
            existingContext.objective = sanitizeDomString(parsed.objective, 2000).trim();
            existingContext.objective_source = 'inferred';
          }
          if (parsed.users && parsed.users.length > 0) {
            existingContext.roles = existingContext.roles || [];
            for (const u of parsed.users) {
              const cleanName = sanitizeDomString(u).slice(0, 50).trim();
              if (!cleanName) continue;
              const exIdx = existingContext.roles.findIndex((er) => er.name === cleanName);
              if (exIdx >= 0) {
                if (existingContext.roles[exIdx].source !== 'user') {
                  existingContext.roles[exIdx].source = 'inferred';
                }
              } else {
                existingContext.roles.push({ name: cleanName, source: 'inferred' });
              }
            }
          }
          // Flujos críticos solo si encabezado explícito (B1)
          if (parsed.critical_flows && parsed.critical_flows.length > 0) {
            existingContext.critical_flows = existingContext.critical_flows || [];
            for (const cf of parsed.critical_flows) {
              const cleanName = sanitizeDomString(cf.name, 100).trim();
              if (!cleanName) continue;
              const cleanEvidence = cf.evidence ? sanitizeDomString(cf.evidence, 200).trim() : undefined;
              const exIdx = existingContext.critical_flows.findIndex((ef) => ef.name === cleanName);
              if (exIdx >= 0) {
                if (existingContext.critical_flows[exIdx].source !== 'user') {
                  existingContext.critical_flows[exIdx].source = 'inferred';
                  if (cleanEvidence) existingContext.critical_flows[exIdx].evidence = cleanEvidence;
                }
              } else {
                existingContext.critical_flows.push({
                  name: cleanName,
                  priority: 'medium',
                  source: 'inferred',
                  ...(cleanEvidence ? { evidence: cleanEvidence } : {}),
                });
              }
            }
          }
          existingContext.ingest = {
            doc_ref: resolved.path,
            analyzed_by: 'heuristic',
            analyzed_at: new Date().toISOString(),
          };
        } catch { /* ignore parse error */ }
      } else {
        // No resolvió a archivo físico
        if (existingContext.source_of_truth?.source === 'user' && sotSource !== 'user') {
          ignoredDowngrades.push({
            field: 'source_of_truth',
            reason: 'No se puede sobrescribir una fuente de verdad con source "user" por una con source "prd" o "inferred"',
          });
        } else {
          existingContext.source_of_truth = {
            type: sotType,
            ref: sotRef,
            declared: sotDeclared,
            notes: sotNotes || existingContext.source_of_truth?.notes,
            source: sotSource,
          };
        }
      }
    } else if (args.source_of_truth) {
      if (existingContext.source_of_truth?.source === 'user' && sotSource !== 'user') {
        ignoredDowngrades.push({
          field: 'source_of_truth',
          reason: 'No se puede sobrescribir una fuente de verdad con source "user" por una con source "prd" o "inferred"',
        });
      } else {
        existingContext.source_of_truth = {
          type: sotType,
          ref: undefined,
          declared: sotDeclared,
          notes: sotNotes || existingContext.source_of_truth?.notes,
          source: sotSource,
        };
      }
    }

    // Validar schema de context.yaml
    const validator = new SchemaValidator();
    const valRes = validator.validateProjectContext(existingContext);
    if (!valRes.valid) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                status: 'error',
                isError: true,
                error: 'Error de validación contra project-context.schema.json',
                code: 'invalid_context',
              },
              null,
              2
            ),
          },
        ],
      };
    }

    staged.write(contextPath, YAML.stringify(existingContext), 'utf-8');
    staged.flush();

    // Evaluar compuerta de ONBOARDING
    const envsPath = join(qaDir, 'project', 'environments.yaml');
    const parsedEnv = existsSync(envsPath) ? readEnvironment(envsPath) : null;
    const gateRes = canExitOnboarding(existingContext, parsedEnv);

    const storage = new FileSystemStorage({ rootDir });
    let autoTransitioned = false;
    let finalPhase: ProjectPhase = 'ONBOARDING';

    await storage.updateLifecycleState((curr) => {
      finalPhase = curr.phase;
      if (curr.phase === 'ONBOARDING' && gateRes.passed) {
        curr.phase = 'SCOPING';
        finalPhase = 'SCOPING';
        autoTransitioned = true;
        curr.session = curr.session || { id: '', started_at: new Date().toISOString(), plan: [] };
        if (!curr.session.id) {
          curr.session.id = `session_${randomUUID().slice(0, 8)}`;
        }
        curr.history = curr.history || [];
        curr.history.push({
          from: 'ONBOARDING',
          to: 'SCOPING',
          at: new Date().toISOString(),
          reason: 'Compuerta de salida de ONBOARDING superada exitosamente',
        });
      }
      return curr;
    });

    const serviciosConEvidencia = detectarServiciosConEvidencia(rootDir);
    const hallazgos = detectarDocumentosProyecto(rootDir);
    hallazgos.servicios = serviciosConEvidencia;

    const guidance = getPhaseGuidance(finalPhase, {
      faltantes: gateRes.faltantes,
      hallazgos,
      context: existingContext,
      environments: parsedEnv,
    });

    if (correctionsState && correctionsState.pending.length > 0) {
      const nextPendingField = correctionsState.pending[0];
      const q = buildCorrectionQuestion(nextPendingField, existingContext);
      guidance.siguiente_accion = {
        tipo: 'entrevista',
        descripcion: `Corrección solicitada por el usuario para el campo '${nextPendingField}'. Preséntala al usuario usando la herramienta interactiva ask_question.`,
        tool: 'qap_context_set',
        pregunta: q,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              status: 'success',
              directorio_objetivo: rootDir,
              fase: finalPhase,
              transicion_automatica: autoTransitioned,
              faltantes: autoTransitioned ? [] : gateRes.faltantes,
              ignored_downgrades: ignoredDowngrades.length > 0 ? ignoredDowngrades : undefined,
              context: existingContext,
              siguiente_accion: guidance.siguiente_accion,
            },
            null,
            2
          ),
        },
      ],
    };
  }
}
