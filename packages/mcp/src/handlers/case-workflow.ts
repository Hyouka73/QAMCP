import { existsSync, mkdirSync, openSync, closeSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

import { CaseGenerator, FileSystemStorage } from '@qap/knowledge';
import { SchemaValidator, validateExpectedRequirement, type TCCase } from '@qap/shared';

import { reviewDigest } from '../host-review.js';

import { ModuleObservationBridge } from './module-observation-bridge.js';
import { binding, isObject, type StateDependencies } from './state-services.js';

export interface CaseProposal { requirement_id: string; expected_revision: number; name: string; steps: TCCase['steps'] }
export interface CaseWorkflowCommand { action: 'generate' | 'review'; proposals?: CaseProposal[] }
const blocked = (code: string, extra = {}) => ({ status: 'blocked', code, ...extra });

export async function caseReviewRequest(root: string, module: string, cases: TCCase[], deps: StateDependencies) {
  const bound = binding(root, deps);
  if (!bound) return { error: 'knowledge_unbound' } as const;
  const bridge = new ModuleObservationBridge(bound.store, { ...bound, projectRoot: root });
  const identity = await bridge.resolve(module);
  if (identity.status !== 'resolved') return { error: identity.status } as const;
  if (!cases.length) return { error: 'no_test_cases' } as const;
  const requirements = [];
  for (const tc of [...cases].sort((a,b) => a.id.localeCompare(b.id))) {
    const requirement = tc.source_rule_id ? await bound.store.get(bound.applicationId, 'requirement', tc.source_rule_id) : null;
    if (!requirement || requirement.entity.module_key !== identity.link.moduleKey || !requirement.entity.is_active ||
      requirement.entity.validation_status !== 'confirmed' || !validateExpectedRequirement(requirement.entity).valid || !requirement.entity.acceptance_criteria?.length) return { error: 'confirmed_oracle_required' } as const;
    requirements.push({ id: requirement.id, revision: requirement.revision, digest: reviewDigest(requirement.entity) });
  }
  const body = { projectRoot: root, applicationId: bound.applicationId, environmentId: bound.environmentId,
    module, context: identity.fingerprint, requirements, cases: [...cases].sort((a,b) => a.id.localeCompare(b.id)) };
  return { request: { ...body, requestDigest: reviewDigest(body) }, bound } as const;
}

/** For a canonical project every executable case requires an exact host receipt, including manually edited files. */
export async function verifyCaseApproval(root: string, module: string, cases: TCCase[], deps: StateDependencies) {
  const bound = binding(root, deps);
  if (!bound || (deps.prepareWorkspace && !bound.moduleBindings?.length && !bound.caseReviewGateway)) return { allowed: true };
  const value = await caseReviewRequest(root, module, cases, deps);
  if ('error' in value) return { allowed: false, code: value.error };
  if (!value.bound.caseReviewGateway) return { allowed: false, code: 'case_review_gateway_required' };
  return value.bound.caseReviewGateway.approvedCases(value.request)
    ? { allowed: true, request_digest: value.request.requestDigest, requirements: value.request.requirements }
    : { allowed: false, code: 'case_approval_required', review_request_digest: value.request.requestDigest };
}

export async function caseWorkflow(root: string, module: string, command: unknown, deps: StateDependencies) {
  if (!isObject(command) || !['generate','review'].includes(String(command.action)) || Object.keys(command).some(k => !['action','proposals'].includes(k))) return blocked('invalid_case_command');
  const bound = binding(root, deps);
  if (!bound) return blocked('knowledge_unbound');
  const identity = await new ModuleObservationBridge(bound.store, { ...bound, projectRoot: root }).resolve(module);
  if (identity.status !== 'resolved') return blocked(identity.status);
  const storage = new FileSystemStorage({ rootDir: root });
  const dir = join(root, '.qa/modules', module); mkdirSync(dir, { recursive: true });
  const lock = join(dir, 'case-workflow.lock');
  let descriptor: number;
  try { descriptor = openSync(lock, 'wx'); } catch { return blocked('case_workflow_busy'); }
  try {
    if (command.action === 'generate') {
      if (command.proposals !== undefined && (!Array.isArray(command.proposals) || command.proposals.length > 100)) return blocked('invalid_case_proposals');
      const proposals = (command.proposals ?? []) as CaseProposal[];
      const page = await bound.store.query(bound.applicationId, 'requirement', { references: { kind: 'module', id: identity.module.id }, limit: 100 });
      if (page.next_cursor) return blocked('requirement_inventory_truncated');
      const ready = page.items.filter(r => r.entity.module_key === identity.link.moduleKey && r.entity.is_active && r.entity.validation_status === 'confirmed' && validateExpectedRequirement(r.entity).valid);
      const prepared: TCCase[] = [];
      for (const p of proposals) {
        if (!isObject(p) || Object.keys(p).some(k => !['requirement_id','expected_revision','name','steps'].includes(k)) || typeof p.name !== 'string' || !p.name.trim() || p.name.length > 200 || !Array.isArray(p.steps) || p.steps.length > 100) return blocked('invalid_case_proposal');
        const requirement = ready.find(r => r.id === p.requirement_id && r.revision === p.expected_revision);
        if (!requirement) return blocked('requirement_not_confirmed_or_changed');
        if (!requirement.entity.acceptance_criteria?.length || !p.steps.some(s => s.type === 'assert' && s.selector &&
          ((['equals','contains','attribute'].includes(s.assertion_type ?? '') && typeof s.expected === 'string' && s.expected.length > 0) ||
           (['visible','exists','not_visible','not_exists'].includes(s.assertion_type ?? '')) ||
           (s.assertion_type === 'count' && Number.isInteger(s.expected_count))))) return blocked('oracle_required');
        const tc = { ...CaseGenerator.generateCase({ moduleName: module, caseName: p.name, steps: p.steps }), source_rule_id: requirement.id, case_category: 'happy_path' as const };
        if (!new SchemaValidator().validateTcCase(tc).valid) return blocked('invalid_test_case');
        if (prepared.some(c => c.id === tc.id)) return blocked('duplicate_case_ids');
        prepared.push(tc);
      }
      // Preflight every collision before publishing any file; never overwrite edited proposals.
      for (const tc of prepared) {
        const path = join(dir, 'tests', 'TC-' + tc.id + '.yaml');
        if (existsSync(join(dir, 'tests', tc.id + '.yaml'))) return blocked('case_edit_preserved', { case_id: tc.id });
        if (existsSync(path)) {
          const prior = await storage.getTestCase(module, 'TC-' + tc.id);
          if (reviewDigest(prior) !== reviewDigest(tc)) return blocked('case_edit_preserved', { case_id: tc.id });
        }
      }
      const planned = (await storage.getLifecycleState()).session?.plan?.find(p => p.module === module);
      if (!existsSync(join(dir, 'context.yaml'))) await storage.saveModuleContext(module, { _version: '2', module, routes: planned?.path ? [planned.path] : [] });
      for (const tc of prepared) await storage.saveTestCase(module, tc, 'TC-' + tc.id);
      return { status: 'proposed', cases: prepared, approval: 'required',
        blocked_cases: ready.filter(r => !prepared.some(c => c.source_rule_id === r.id)).map(r => ({ requirement_id: r.id, revision: r.revision, code: 'executable_oracle_required', acceptance_criteria: r.entity.acceptance_criteria ?? [] })),
        next_safe_action: 'Revisar los pasos y resultados esperados; qap_plan con case_workflow.action=review.' };
    }
    if (command.proposals !== undefined) return blocked('invalid_case_command');
    const cases = await Promise.all((await storage.listTestCases(module)).map(id => storage.getTestCase(module, id)));
    const value = await caseReviewRequest(root, module, cases, deps);
    if ('error' in value) return blocked(value.error!);
    if (!bound.caseReviewGateway) return blocked('case_review_gateway_required');
    if (bound.caseReviewGateway.approvedCases(value.request)) return { status: 'approved', idempotent: true,
      request_digest: value.request.requestDigest, cases: cases.map(c => c.id) };
    const decision = bound.caseReviewGateway.request('cases', value.request);
    if (!decision) return blocked('case_review_pending', { review_request_digest: value.request.requestDigest, cases });
    if (decision.decision !== 'approve') return blocked('case_review_rejected');
    bound.caseReviewGateway.acceptCases(value.request);
    return { status: 'approved', request_digest: value.request.requestDigest, cases: cases.map(c => c.id), approval_id: decision.approvalId };
  } finally { closeSync(descriptor); unlinkSync(lock); }
}
