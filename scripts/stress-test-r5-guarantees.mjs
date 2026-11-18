#!/usr/bin/env node
/**
 * Standalone Adversarial Verification Harness — R5 Guarantees (§R2)
 * Executes against compiled workspace artifacts in packages/* /dist/.
 */

import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  validateExpectedRequirement,
  validateCanonicalClosureCommand,
  validateCoverageAssessmentInvariants,
} from '../packages/shared/dist/index.js';
import { createMcpServer } from '../packages/mcp/dist/server.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

const results = [];

function record(guarantee, testName, passed, details = '') {
  results.push({ guarantee, testName, passed, details });
  const mark = passed ? '✔ PASS' : '✖ FAIL';
  console.log(`[${mark}] Guarantee ${guarantee}: ${testName} ${details ? '(' + details + ')' : ''}`);
}

async function run() {
  console.log('================================================================');
  console.log('QAMCP vNext R5 Adversarial Stress Test Harness (Node Stdio Mode)');
  console.log('================================================================\n');

  // -------------------------------------------------------------------------
  // Guarantee 1: Epistemic Bypass
  // -------------------------------------------------------------------------
  try {
    const probeRes = validateExpectedRequirement({
      id: 'req-adv-probe',
      module_key: 'mod-1',
      category: 'proposito',
      statement: 'Filtro por categoria probe.',
      status: 'confirmed',
      provenance: 'active_probe',
      verified_by: 'lead',
      is_active: true,
    });
    const hasViolation = probeRes.violations.some(v => v.code === 'EPISTEMIC_VIOLATION_PROBE_CANNOT_CONFIRM_REQUIREMENT');
    record(1, 'Active probe cannot confirm requirement', !probeRes.valid && hasViolation);

    const crawlerRes = validateExpectedRequirement({
      id: 'req-adv-crawler',
      module_key: 'mod-1',
      category: 'proposito',
      statement: 'Ruta descubierta.',
      status: 'confirmed',
      provenance: 'crawler',
      verified_by: 'lead',
      is_active: true,
    });
    record(1, 'Crawler observation cannot confirm requirement', !crawlerRes.valid && crawlerRes.violations.some(v => v.code === 'EPISTEMIC_VIOLATION_PROBE_CANNOT_CONFIRM_REQUIREMENT'));

    const legacyRes = validateExpectedRequirement({
      id: 'req-adv-legacy',
      module_key: 'mod-1',
      category: 'proposito',
      statement: 'Migrado de legacy rules.yaml sin evidencia.',
      status: 'confirmed',
      provenance: 'legacy_manual_edit',
      verified_by: 'lead',
      is_active: true,
    });
    record(1, 'Legacy manual edit without evidence cannot confirm', !legacyRes.valid && legacyRes.violations.some(v => v.code === 'LEGACY_MIGRATION_CONFIRMATION_WITHOUT_EVIDENCE_FORBIDDEN'));
  } catch (err) {
    record(1, 'Epistemic bypass suite', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Guarantee 2: Wire Authorization Injection
  // -------------------------------------------------------------------------
  try {
    const forbidden = ['approvalId', 'approval_id', 'signature', 'decision_id', 'decisionId', 'decided_by', 'decidedBy'];
    let allBlocked = true;
    for (const key of forbidden) {
      const v = validateCanonicalClosureCommand({ action: 'close', [key]: 'forged_val' });
      if (v.valid || !v.violations.some(viol => viol.code === 'CLIENT_AUTHORIZATION_INJECTION_FORBIDDEN')) {
        allBlocked = false;
      }
    }
    record(2, 'Wire authorization injection keys rejected', allBlocked, `${forbidden.length} keys tested`);

    const shortWaive = validateCanonicalClosureCommand({ action: 'waive', reason: 'corta' });
    record(2, 'Substantive waiver reason enforced (>= 15 chars)', !shortWaive.valid && shortWaive.violations.some(v => v.code === 'SUBSTANTIVE_WAIVER_REASON_REQUIRED'));
  } catch (err) {
    record(2, 'Wire authorization suite', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Guarantee 5: Legacy Closure Bypass
  // -------------------------------------------------------------------------
  try {
    const root = mkdtempSync(join(tmpdir(), 'qap-script-adv-'));
    mkdirSync(join(root, '.qa', 'project'), { recursive: true });
    writeFileSync(join(root, '.qa', 'project', 'lifecycle.json'), JSON.stringify({
      _version: '1',
      phase: 'WORKING',
      modules: { catalog: { state: 'planned', updated_at: new Date().toISOString() } },
      session: { id: 's', started_at: new Date().toISOString(), plan: [{ module: 'catalog', path: '/' }], auth: { required: false } },
      history: [],
    }));

    const server = createMcpServer({
      projectRoots: [root],
      knowledgeBindings: [
        {
          projectRoot: root,
          applicationId: 'app-script',
          environmentId: 'local',
          moduleBindings: [
            {
              plannedName: 'catalog',
              moduleId: 'mod-1',
              moduleKey: 'mod-1-key',
              moduleRevision: 1,
              applicationRevision: 1,
              environmentRevision: 1,
              provenance: 'host_declared',
            },
          ],
        },
      ],
    });

    const client = new Client({ name: 'script-client', version: '1' });
    const [cTransport, sTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(sTransport);
    await client.connect(cTransport);

    const legacyCloseRes = await client.callTool({
      name: 'qap_module_close',
      arguments: { targetPath: root, module: 'catalog', action: 'close', user_confirmed: true },
    });
    const parsedClose = JSON.parse(legacyCloseRes.content[0].text);
    record(5, 'Legacy qap_module_close blocked on canonical module', legacyCloseRes.isError && parsedClose.code === 'canonical_closure_required');

    const sessionCloseRes = await client.callTool({
      name: 'qap_session_close',
      arguments: { targetPath: root },
    });
    const parsedSession = JSON.parse(sessionCloseRes.content[0].text);
    const blockedFromWrapUp = parsedSession.status === 'blocked' && (
      parsedSession.code === 'canonical_module_closure_required' ||
      parsedSession.fase === 'WORKING'
    );
    record(5, 'qap_session_close blocked while canonical module is unclosed', blockedFromWrapUp, `status: ${parsedSession.status}, code: ${parsedSession.code || parsedSession.fase}`);

    await client.close();
    await server.close();
    rmSync(root, { recursive: true, force: true });
  } catch (err) {
    record(5, 'Legacy closure bypass suite', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Guarantee 6: False Execution Attestation
  // -------------------------------------------------------------------------
  try {
    const spoofedExec = validateCoverageAssessmentInvariants({
      module_id: 'm1',
      module_key: 'k1',
      module_revision: 1,
      coverage_digest: createHash('sha256').update('cov').digest('hex'),
      closure_verdict: 'ready_for_closure',
      specification_coverage: {
        status: 'complete',
        confirmed_requirements_count: 7,
        pending_requirements_count: 0,
        unaddressed_gaps_count: 0,
        accepted_gaps_count: 0,
        total_gaps_count: 0,
        category_statuses: [],
      },
      review_coverage: { status: 'unreviewed', reviewed_categories_count: 0 },
      execution_coverage: {
        status: 'passed',
        executed_count: 5,
        passed_count: 5,
        failed_count: 0,
        indeterminate_count: 0,
      },
      gaps: [],
      assessed_at: new Date().toISOString(),
    });
    const hasExecViolations = spoofedExec.violations.some(v => v.code === 'EXECUTION_COVERAGE_UNVERIFIED_FORBIDDEN') &&
      spoofedExec.violations.some(v => v.code === 'EXECUTION_VERDICTS_FORBIDDEN');
    record(6, 'Execution status !== not_executed and passed_count > 0 rejected', !spoofedExec.valid && hasExecViolations);

    const catWaiver = validateCoverageAssessmentInvariants({
      module_id: 'm1',
      module_key: 'k1',
      module_revision: 1,
      coverage_digest: createHash('sha256').update('cov').digest('hex'),
      closure_verdict: 'ready_for_closure',
      specification_coverage: {
        status: 'complete',
        confirmed_requirements_count: 6,
        pending_requirements_count: 0,
        unaddressed_gaps_count: 0,
        accepted_gaps_count: 0,
        total_gaps_count: 0,
        category_statuses: [{ category: 'seguridad_y_permisos', is_waived: true }],
      },
      review_coverage: { status: 'unreviewed', reviewed_categories_count: 0 },
      execution_coverage: { status: 'not_executed', executed_count: 0, passed_count: 0, failed_count: 0, indeterminate_count: 0 },
      gaps: [],
      assessed_at: new Date().toISOString(),
    });
    record(6, 'Individual category waiver rejected (Amendment 6)', !catWaiver.valid && catWaiver.violations.some(v => v.code === 'CATEGORY_WAIVER_FORBIDDEN'));
  } catch (err) {
    record(6, 'False execution attestation suite', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;
  console.log('\n================================================================');
  console.log(`Summary: ${passed}/${total} checks PASSED, ${failed} FAILED.`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error('Fatal harness error:', err);
  process.exit(1);
});
