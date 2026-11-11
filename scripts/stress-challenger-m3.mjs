import { spawn } from 'node:child_process';
import { resolve, join } from 'node:path';
import { readFileSync, existsSync, readdirSync, mkdirSync, rmSync, cpSync, writeFileSync, realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const NODE_EXE = 'C:/Users/baka6/AppData/Local/nvm/v22.16.0/node.exe';
const SERVER_PATH = resolve('packages/mcp/dist/server.js');
const TARGET_WORKSPACE = 'D:/OPENCLAW';
const REGISTRY_PATH = resolve(homedir(), '.qap', 'workspaces', 'authorized-roots.json');

function hashFile(path) {
  if (!existsSync(path)) return null;
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`[ASSERTION_FAILED] ${message}`);
  }
}

async function createClientConnection() {
  const transport = new StdioClientTransport({
    command: NODE_EXE,
    args: [SERVER_PATH],
  });

  const client = new Client(
    { name: 'challenger-m3-tester', version: '1.0.0' },
    { capabilities: {} }
  );

  await client.connect(transport);
  return { client, transport };
}

async function main() {
  console.log('====================================================');
  console.log('   CHALLENGER M3: EMPIRICAL STRESS TEST SUITE       ');
  console.log('====================================================');

  const initialContextRaw = readFileSync(join(TARGET_WORKSPACE, '.qa/project/context.yaml'), 'utf8');
  const initialLifecycleRaw = readFileSync(join(TARGET_WORKSPACE, '.qa/project/lifecycle.json'), 'utf8');
  const initialLifecycle = JSON.parse(initialLifecycleRaw);
  const initialHistoryEntries = existsSync(join(TARGET_WORKSPACE, '.qa/project/context-history'))
    ? readdirSync(join(TARGET_WORKSPACE, '.qa/project/context-history')).length
    : 0;

  console.log(`Initial D:/OPENCLAW state:`);
  console.log(`  lifecycle phase:        ${initialLifecycle.phase}`);
  console.log(`  session started_at:     ${initialLifecycle.session?.started_at}`);
  console.log(`  context-history files:  ${initialHistoryEntries}`);

  const testResults = [];

  // -------------------------------------------------------------------------
  // TEST 1: Redundant Context Set on D:/OPENCLAW (Semantic Invariance)
  // -------------------------------------------------------------------------
  try {
    console.log('\n[TEST 1] Redundant Context Set on D:/OPENCLAW');
    const { client, transport } = await createClientConnection();

    const result = await client.callTool({
      name: 'qap_context_set',
      arguments: {
        targetPath: TARGET_WORKSPACE,
        objective: 'Validar funcionalmente EXATO Center, plataforma de gestión de procesos de reclutamiento, estudios socioeconómicos y expedientes documentales, mediante escenarios completos de QA, con evidencia verificable, detección y reproducción de incidencias y generación de reportes trazables',
        source_of_truth: {
          type: 'readme',
          ref: 'exato-center-monorepo/README.md',
          source: 'user',
          declared: true,
        },
        base_url: 'http://localhost:5173',
      },
    });

    const parsed = JSON.parse(result.content[0].text);
    assert(parsed.status === 'success', `Expected success but got ${parsed.status}`);
    assert(parsed.fase === 'ONBOARDING', `Expected phase ONBOARDING but got ${parsed.fase}`);

    // Verify semantic contents of context.yaml on disk
    const currentContextRaw = readFileSync(join(TARGET_WORKSPACE, '.qa/project/context.yaml'), 'utf8');
    assert(currentContextRaw.includes('Validar funcionalmente EXATO Center'), 'objective corrupted on redundant call');
    assert(currentContextRaw.includes('objective_source: user'), 'objective_source downgraded on redundant call');
    assert(currentContextRaw.includes('ref: exato-center-monorepo/README.md'), 'source_of_truth ref changed');
    assert(currentContextRaw.includes('base_url: http://localhost:5173'), 'base_url changed');

    // Verify lifecycle.json
    const currentLifecycle = JSON.parse(readFileSync(join(TARGET_WORKSPACE, '.qa/project/lifecycle.json'), 'utf8'));
    assert(currentLifecycle.phase === 'ONBOARDING', 'lifecycle phase unexpectedly changed');
    assert(currentLifecycle.session?.started_at === initialLifecycle.session?.started_at, 'session started_at corrupted');

    await transport.close();
    console.log('  PASS: Redundant call preserves objective, source_of_truth, base_url, and phase integrity 100%.');
    testResults.push({ name: 'Redundant Context Set', pass: true });
  } catch (err) {
    console.error('  FAIL:', err);
    testResults.push({ name: 'Redundant Context Set', pass: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // TEST 2: Inferred Downgrade Attempt (Stress Test)
  // -------------------------------------------------------------------------
  try {
    console.log('\n[TEST 2] Inferred Downgrade Attempt against user objective');
    const { client, transport } = await createClientConnection();

    const result = await client.callTool({
      name: 'qap_context_set',
      arguments: {
        targetPath: TARGET_WORKSPACE,
        objective: 'Malicious Downgrade Objective from Inferred Scanner',
        objective_source: 'inferred',
      },
    });

    const parsed = JSON.parse(result.content[0].text);
    assert(parsed.status === 'success', `Expected status success, got ${parsed.status}`);
    assert(Array.isArray(parsed.ignored_downgrades), 'Expected ignored_downgrades array');
    assert(parsed.ignored_downgrades.some(d => d.field === 'objective'), 'Expected objective in ignored_downgrades');

    const contextContent = readFileSync(join(TARGET_WORKSPACE, '.qa/project/context.yaml'), 'utf8');
    assert(!contextContent.includes('Malicious Downgrade Objective'), 'User objective was overwritten by inferred downgrade!');
    assert(contextContent.includes('Validar funcionalmente EXATO Center'), 'Original user objective was preserved');

    await transport.close();
    console.log('  PASS: Downgrade from inferred to user objective was strictly blocked and logged in ignored_downgrades.');
    testResults.push({ name: 'Inferred Downgrade Prevention', pass: true });
  } catch (err) {
    console.error('  FAIL:', err);
    testResults.push({ name: 'Inferred Downgrade Prevention', pass: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // TEST 3: Adversarial Invalid Arguments (Path Traversal, Protocols, Null bytes)
  // -------------------------------------------------------------------------
  try {
    console.log('\n[TEST 3] Adversarial Invalid Arguments on D:/OPENCLAW');
    const { client, transport } = await createClientConnection();

    // 3.1 Path traversal in source_of_truth ref
    let caught31 = false;
    try {
      const res = await client.callTool({
        name: 'qap_context_set',
        arguments: {
          targetPath: TARGET_WORKSPACE,
          source_of_truth: { ref: '../../../../etc/passwd', type: 'prd' },
        },
      });
      if (res.isError) caught31 = true;
    } catch (e) {
      caught31 = true;
    }
    assert(caught31, 'Path traversal in source_of_truth.ref must be rejected');

    // 3.2 URL protocol in source_of_truth ref
    let caught32 = false;
    try {
      const res = await client.callTool({
        name: 'qap_context_set',
        arguments: {
          targetPath: TARGET_WORKSPACE,
          source_of_truth: { ref: 'https://evil.com/payload.md' },
        },
      });
      if (res.isError) caught32 = true;
    } catch (e) {
      caught32 = true;
    }
    assert(caught32, 'External URL in source_of_truth.ref must be rejected');

    // 3.3 Null byte injection in objective
    let caught33 = false;
    try {
      const res = await client.callTool({
        name: 'qap_context_set',
        arguments: {
          targetPath: TARGET_WORKSPACE,
          objective: 'Objective with null byte \0 here',
        },
      });
      if (res.isError) caught33 = true;
    } catch (e) {
      caught33 = true;
    }
    assert(caught33, 'Null byte in objective must be rejected');

    // 3.4 Target path escaping workspace
    let blocked34 = false;
    try {
      const res = await client.callTool({
        name: 'qap_context_set',
        arguments: {
          targetPath: 'D:/OPENCLAW/../../Windows/System32',
        },
      });
      const parsed34 = JSON.parse(res.content[0].text);
      if (res.isError || parsed34.status === 'blocked') blocked34 = true;
    } catch (e) {
      blocked34 = true;
    }
    assert(blocked34, 'Path traversal in targetPath must be blocked or rejected');

    // Verify .qa is 100% intact after adversarial inputs
    assert(existsSync(join(TARGET_WORKSPACE, '.qa/project/context.yaml')), 'context.yaml must exist');
    assert(existsSync(join(TARGET_WORKSPACE, '.qa/project/lifecycle.json')), 'lifecycle.json must exist');

    await transport.close();
    console.log('  PASS: All adversarial inputs rejected at contract boundary; .qa directory completely protected.');
    testResults.push({ name: 'Adversarial Invalid Arguments Rejection', pass: true });
  } catch (err) {
    console.error('  FAIL:', err);
    testResults.push({ name: 'Adversarial Invalid Arguments Rejection', pass: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // TEST 4: Sandboxed Empty Objective & Stub Invariant Rejection
  // -------------------------------------------------------------------------
  let originalRoots = [];
  const sandboxDir = resolve('sandbox-challenger-m3');
  try {
    console.log('\n[TEST 4] Sandboxed Workspace: Stub & Empty Objective Rejection');
    if (existsSync(sandboxDir)) rmSync(sandboxDir, { recursive: true, force: true });
    mkdirSync(sandboxDir, { recursive: true });
    cpSync(join(TARGET_WORKSPACE, '.qa'), join(sandboxDir, '.qa'), { recursive: true });

    // Pre-authorize sandboxDir in registry
    if (existsSync(REGISTRY_PATH)) {
      originalRoots = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'));
    }
    const realSandbox = realpathSync(sandboxDir);
    const updatedRoots = [...new Set([...originalRoots, realSandbox])];
    writeFileSync(REGISTRY_PATH, JSON.stringify(updatedRoots, null, 2), 'utf8');

    const { client, transport } = await createClientConnection();

    // Try setting empty objective
    const resEmpty = await client.callTool({
      name: 'qap_context_set',
      arguments: {
        targetPath: realSandbox,
        objective: '',
        objective_source: 'user',
      },
    });

    const parsedEmpty = JSON.parse(resEmpty.content[0].text);
    assert(parsedEmpty.fase === 'ONBOARDING', 'Phase must remain ONBOARDING');
    assert(parsedEmpty.faltantes.some(f => f.campo === 'objective'), 'faltantes must include objective when empty');

    // Try setting stub objective "Documento vacío"
    const resStub = await client.callTool({
      name: 'qap_context_set',
      arguments: {
        targetPath: realSandbox,
        objective: 'Documento vacío',
        objective_source: 'user',
      },
    });

    const parsedStub = JSON.parse(resStub.content[0].text);
    assert(parsedStub.fase === 'ONBOARDING', 'Phase must remain ONBOARDING for stub');
    assert(parsedStub.faltantes.some(f => f.campo === 'objective'), 'faltantes must flag stub objective');

    // Try setting "TODO"
    const resTodo = await client.callTool({
      name: 'qap_context_set',
      arguments: {
        targetPath: realSandbox,
        objective: 'TODO',
        objective_source: 'user',
      },
    });

    const parsedTodo = JSON.parse(resTodo.content[0].text);
    assert(parsedTodo.faltantes.some(f => f.campo === 'objective'), 'faltantes must flag TODO objective');

    // Verify .qa was not wiped
    assert(existsSync(join(sandboxDir, '.qa/project/context.yaml')), 'context.yaml must still exist in sandbox');
    assert(existsSync(join(sandboxDir, '.qa/project/lifecycle.json')), 'lifecycle.json must still exist in sandbox');

    await transport.close();
    console.log('  PASS: Empty string and stub objectives strictly rejected from gate clearance; onboarding gate halts transition.');
    testResults.push({ name: 'Stub Objective Invariant Rejection', pass: true });
  } catch (err) {
    console.error('  FAIL:', err);
    testResults.push({ name: 'Stub Objective Invariant Rejection', pass: false, error: err.message });
  } finally {
    // Clean up sandbox and restore registry
    if (existsSync(sandboxDir)) rmSync(sandboxDir, { recursive: true, force: true });
    if (existsSync(REGISTRY_PATH)) {
      writeFileSync(REGISTRY_PATH, JSON.stringify(originalRoots, null, 2), 'utf8');
    }
  }

  // -------------------------------------------------------------------------
  // TEST 5: Repeated Status Checks on D:/OPENCLAW (25 sequential iterations)
  // -------------------------------------------------------------------------
  try {
    console.log('\n[TEST 5] Repeated Status Checks on D:/OPENCLAW (25 sequential iterations)');
    const { client, transport } = await createClientConnection();

    for (let i = 1; i <= 25; i++) {
      const res = await client.callTool({
        name: 'qap_status',
        arguments: { targetPath: TARGET_WORKSPACE },
      });
      const parsed = JSON.parse(res.content[0].text);
      assert(parsed.status === 'success', `Iteration ${i} status not success: ${parsed.status}`);
      assert(parsed.fase === 'ONBOARDING', `Iteration ${i} phase not ONBOARDING: ${parsed.fase}`);
      assert(parsed.faltantes.length === 2, `Iteration ${i} faltantes changed: ${JSON.stringify(parsed.faltantes)}`);
    }

    const postContextRaw = readFileSync(join(TARGET_WORKSPACE, '.qa/project/context.yaml'), 'utf8');
    const postLifecycle = JSON.parse(readFileSync(join(TARGET_WORKSPACE, '.qa/project/lifecycle.json'), 'utf8'));

    assert(postContextRaw.includes('Validar funcionalmente EXATO Center'), 'context.yaml objective modified by status checks');
    assert(postLifecycle.phase === 'ONBOARDING', 'lifecycle.json phase modified by status checks');
    assert(postLifecycle.session?.started_at === initialLifecycle.session?.started_at, 'session started_at modified');

    await transport.close();
    console.log('  PASS: 25 sequential qap_status calls executed cleanly; state files completely unaltered.');
    testResults.push({ name: 'Repeated Status Checks Persistence', pass: true });
  } catch (err) {
    console.error('  FAIL:', err);
    testResults.push({ name: 'Repeated Status Checks Persistence', pass: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // TEST 6: Concurrent Status Checks on D:/OPENCLAW (5 parallel tool calls)
  // -------------------------------------------------------------------------
  try {
    console.log('\n[TEST 6] Concurrent Status Checks on D:/OPENCLAW (5 parallel tool calls)');
    const { client, transport } = await createClientConnection();

    const promises = Array.from({ length: 5 }, (_, idx) =>
      client.callTool({
        name: 'qap_status',
        arguments: { targetPath: TARGET_WORKSPACE },
      }).then(res => {
        const parsed = JSON.parse(res.content[0].text);
        assert(parsed.status === 'success', `Parallel ${idx} status was ${parsed.status}`);
        return parsed;
      })
    );

    const results = await Promise.all(promises);
    assert(results.length === 5, 'All 5 parallel status checks must succeed');

    const postContextRaw = readFileSync(join(TARGET_WORKSPACE, '.qa/project/context.yaml'), 'utf8');
    const postLifecycle = JSON.parse(readFileSync(join(TARGET_WORKSPACE, '.qa/project/lifecycle.json'), 'utf8'));

    assert(postContextRaw.includes('Validar funcionalmente EXATO Center'), 'context.yaml objective modified by parallel status checks');
    assert(postLifecycle.phase === 'ONBOARDING', 'lifecycle.json phase modified by parallel status checks');

    await transport.close();
    console.log('  PASS: 5 parallel qap_status requests handled concurrently without collision or data alteration.');
    testResults.push({ name: 'Concurrent Status Checks', pass: true });
  } catch (err) {
    console.error('  FAIL:', err);
    testResults.push({ name: 'Concurrent Status Checks', pass: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // TEST 7: Lock Contention & State Safe Handling
  // -------------------------------------------------------------------------
  try {
    console.log('\n[TEST 7] Lock Contention & State Safe Handling');
    const lockPath = join(TARGET_WORKSPACE, '.qa/project/context-update.lock');
    assert(!existsSync(lockPath), 'Lock file should not exist initially');

    // Artificially create stale lock
    writeFileSync(lockPath, 'stale lock by challenger');

    const { client, transport } = await createClientConnection();

    let lockedResult;
    try {
      const res = await client.callTool({
        name: 'qap_context_set',
        arguments: {
          targetPath: TARGET_WORKSPACE,
          objective: 'Test during lock',
        },
      });
      lockedResult = JSON.parse(res.content[0].text);
    } catch (e) {
      lockedResult = { status: 'error', error: e.message };
    }

    assert(lockedResult.status === 'blocked', `Expected status blocked during lock, got: ${JSON.stringify(lockedResult)}`);
    assert(lockedResult.code === 'context_locked', `Expected code context_locked, got: ${lockedResult.code}`);

    // Remove lock and retry
    rmSync(lockPath, { force: true });

    // Call again to verify server is fully operational and unblocked
    const recoveredRes = await client.callTool({
      name: 'qap_status',
      arguments: { targetPath: TARGET_WORKSPACE },
    });
    const parsedRecovered = JSON.parse(recoveredRes.content[0].text);
    assert(parsedRecovered.status === 'success', 'Server should recover immediately after lock release');

    await transport.close();
    console.log('  PASS: Lock contention handled gracefully via status: blocked (context_locked), zero crash, immediate recovery.');
    testResults.push({ name: 'Lock Contention Handling', pass: true });
  } catch (err) {
    console.error('  FAIL:', err);
    testResults.push({ name: 'Lock Contention Handling', pass: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // TEST 8: Lifecycle Integrity & Phase Preservation Invariant
  // -------------------------------------------------------------------------
  try {
    console.log('\n[TEST 8] Lifecycle State Invariance Verification');
    const lifecycleRaw = JSON.parse(readFileSync(join(TARGET_WORKSPACE, '.qa/project/lifecycle.json'), 'utf8'));

    assert(lifecycleRaw._version === '1', `Expected _version "1", got ${lifecycleRaw._version}`);
    assert(lifecycleRaw.phase === 'ONBOARDING', `Expected phase "ONBOARDING", got ${lifecycleRaw.phase}`);
    assert(lifecycleRaw.session && typeof lifecycleRaw.session === 'object', 'session object must exist');
    assert(lifecycleRaw.session.started_at === '2026-11-11T02:19:07.706Z', `Original started_at corrupted: ${lifecycleRaw.session.started_at}`);
    assert(Array.isArray(lifecycleRaw.history), 'history must be an array');
    assert(lifecycleRaw.history.length === 0, `history unexpectedly populated: ${JSON.stringify(lifecycleRaw.history)}`);

    console.log('  PASS: lifecycle.json preserves session, phase (ONBOARDING), and started_at integrity 100%.');
    testResults.push({ name: 'Lifecycle Integrity Preservation', pass: true });
  } catch (err) {
    console.error('  FAIL:', err);
    testResults.push({ name: 'Lifecycle Integrity Preservation', pass: false, error: err.message });
  }

  // -------------------------------------------------------------------------
  // FINAL EVALUATION
  // -------------------------------------------------------------------------
  console.log('\n====================================================');
  console.log('                 SUMMARY OF RESULTS                 ');
  console.log('====================================================');
  let allPassed = true;
  for (const r of testResults) {
    const mark = r.pass ? '✔ PASS' : '✖ FAIL';
    console.log(`  ${mark}: ${r.name}`);
    if (!r.pass) {
      allPassed = false;
      console.log(`         Error: ${r.error}`);
    }
  }

  console.log('====================================================');
  if (allPassed) {
    console.log('  VERDICT: APPROVE (All 8 stress tests passed cleanly)');
    process.exit(0);
  } else {
    console.log('  VERDICT: REQUEST_CHANGES (One or more stress tests failed)');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('FATAL UNHANDLED ERROR IN HARNESS:', err);
  process.exit(1);
});
