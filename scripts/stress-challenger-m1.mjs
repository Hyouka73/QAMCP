import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const NODE_EXE = 'C:/Users/baka6/AppData/Local/nvm/v22.16.0/node.exe';
const SERVER_PATH = resolve('packages/mcp/dist/server.js');
const CLI_PATH = resolve('packages/cli/dist/entrypoint.js');
const TARGET_WORKSPACE = 'D:/OPENCLAW';

// Helper to assert condition with descriptive message
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Helper to spawn MCP server and track stdout, stderr, exit
function spawnServer(binaryPath = SERVER_PATH, args = [], options = {}) {
  const child = spawn(NODE_EXE, [binaryPath, ...args], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, QAP_BUILD_REVISION: 'challenger-test', ...options.env },
    cwd: options.cwd || process.cwd(),
  });

  // Prevent client unhandled write errors when server abruptly disconnects
  child.stdin.on('error', () => {
    // Client-side stream error during abrupt closure is expected
  });

  let stdoutRaw = '';
  let stderrRaw = '';
  let stdoutLines = [];
  let exitCode = null;
  let exitSignal = null;
  let isReady = false;

  const stdoutPurityErrors = [];

  child.stdout.on('data', (chunk) => {
    const text = chunk.toString('utf8');
    stdoutRaw += text;
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    for (const line of lines) {
      stdoutLines.push(line);
      try {
        const obj = JSON.parse(line);
        if (obj.jsonrpc !== '2.0') {
          stdoutPurityErrors.push(`Missing jsonrpc:"2.0": ${line}`);
        }
      } catch (err) {
        stdoutPurityErrors.push(`Invalid JSON: ${line} (Error: ${err.message})`);
      }
    }
  });

  child.stderr.on('data', (chunk) => {
    const text = chunk.toString('utf8');
    stderrRaw += text;
    if (text.includes('Stdio ready')) {
      isReady = true;
    }
  });

  const completionPromise = new Promise((res, rej) => {
    child.on('exit', (code, signal) => {
      exitCode = code;
      exitSignal = signal;
      res({ code, signal, stdoutRaw, stderrRaw, stdoutLines, stdoutPurityErrors });
    });
    child.on('error', (err) => {
      rej(err);
    });
  });

  const waitForReady = (timeoutMs = 6000) => {
    return new Promise((res, rej) => {
      if (isReady) return res();
      const interval = setInterval(() => {
        if (isReady) {
          clearInterval(interval);
          clearTimeout(timer);
          res();
        }
      }, 50);
      const timer = setTimeout(() => {
        clearInterval(interval);
        rej(new Error(`Timeout waiting for 'Stdio ready' after ${timeoutMs}ms. Stderr: ${stderrRaw}`));
      }, timeoutMs);
    });
  };

  const waitForExit = (timeoutMs = 8000) => {
    return Promise.race([
      completionPromise,
      new Promise((_, rej) =>
        setTimeout(() => rej(new Error(`Process hung! Timed out after ${timeoutMs}ms without exiting. PID=${child.pid}`)), timeoutMs)
      ),
    ]);
  };

  return {
    child,
    waitForReady,
    waitForExit,
    getStdout: () => stdoutRaw,
    getStderr: () => stderrRaw,
    getStdoutLines: () => stdoutLines,
    getPurityErrors: () => stdoutPurityErrors,
  };
}

// ---------------------------------------------------------
// TEST CASES
// ---------------------------------------------------------

async function runTest1_ImmediateStdinDestroy() {
  console.log('\n--- Test 1: Immediate abrupt stdin pipe closure on spawn ---');
  const server = spawnServer();
  // Abruptly destroy stdin immediately, before ready
  server.child.stdin.destroy();

  const result = await server.waitForExit(5000);
  console.log(`  Exit code: ${result.code}, signal: ${result.signal}`);
  assert(result.code === 0, `Expected exit code 0, got ${result.code}`);
  assert(result.code !== 0xffffffff && result.code !== -1, 'Server exited with 0xffffffff / -1 abort!');
  assert(result.stdoutPurityErrors.length === 0, `Stdout purity violation: ${result.stdoutPurityErrors.join(', ')}`);
  console.log('  ✔ PASS: Exited cleanly with code 0 on immediate stdin destruction.');
}

async function runTest2_AbruptStdinDestroyAfterReady() {
  console.log('\n--- Test 2: Abrupt stdin destruction after Stdio ready ---');
  const server = spawnServer();
  await server.waitForReady();
  // Abruptly destroy stdin (simulates client sudden crash / EPIPE)
  server.child.stdin.destroy();

  const result = await server.waitForExit(5000);
  console.log(`  Exit code: ${result.code}, signal: ${result.signal}`);
  assert(result.code === 0, `Expected exit code 0, got ${result.code}`);
  assert(result.code !== 0xffffffff, 'Server exited with 0xffffffff');
  assert(result.stdoutPurityErrors.length === 0, `Stdout purity violation: ${result.stdoutPurityErrors.join(', ')}`);
  console.log('  ✔ PASS: Exited cleanly with code 0 after ready on abrupt stdin destroy.');
}

async function runTest3_AbruptStdinDestroyMidHandshake() {
  console.log('\n--- Test 3: Abrupt stdin destruction mid-handshake ---');
  const server = spawnServer();
  await server.waitForReady();
  // Write partial JSON chunk
  server.child.stdin.write('{"jsonrpc":"2.0","id":1,"metho');
  // Abruptly destroy stdin mid-request
  server.child.stdin.destroy();

  const result = await server.waitForExit(5000);
  console.log(`  Exit code: ${result.code}, signal: ${result.signal}`);
  assert(result.code === 0, `Expected exit code 0, got ${result.code}`);
  assert(result.code !== 0xffffffff, 'Server exited with 0xffffffff');
  assert(result.stdoutPurityErrors.length === 0, `Stdout purity violation: ${result.stdoutPurityErrors.join(', ')}`);
  console.log('  ✔ PASS: Handled mid-handshake abrupt stdin destroy cleanly with code 0.');
}

async function runTest4_FragmentedStreamingJsonRpc() {
  console.log('\n--- Test 4: Fragmented / chunk-by-chunk JSON-RPC stream ---');
  const server = spawnServer();
  await server.waitForReady();

  const initMsg = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'adversarial-challenger', version: '1.0' },
    },
  }) + '\n';

  // Feed in 3-byte fragments with small delays
  for (let i = 0; i < initMsg.length; i += 3) {
    server.child.stdin.write(initMsg.slice(i, i + 3));
    await new Promise(r => setTimeout(r, 5));
  }

  // Wait for initialize response
  await new Promise(r => setTimeout(r, 200));

  const lines = server.getStdoutLines();
  assert(lines.length >= 1, `Expected at least 1 response from initialize, got ${lines.length}`);
  const initResp = JSON.parse(lines[0]);
  assert(initResp.id === 1 && initResp.result?.serverInfo?.name === 'qap-mcp-server', `Invalid initialize response: ${JSON.stringify(initResp)}`);

  // Send initialized notification
  server.child.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    method: 'notifications/initialized',
  }) + '\n');

  // Clean close
  server.child.stdin.end();
  const result = await server.waitForExit(5000);
  assert(result.code === 0, `Expected exit code 0, got ${result.code}`);
  assert(result.stdoutPurityErrors.length === 0, `Stdout purity error: ${result.stdoutPurityErrors.join(', ')}`);
  console.log('  ✔ PASS: Successfully reassembled chunked JSON-RPC stream and answered correctly.');
}

async function runTest5_StdoutPurityAcrossOperationsAndErrors() {
  console.log('\n--- Test 5: Strict Stdout Protocol Framing Purity ---');
  const server = spawnServer();
  await server.waitForReady();

  let reqId = 1;
  const sendReq = (method, params) => {
    const id = reqId++;
    server.child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    return id;
  };

  // 1. Initialize
  sendReq('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'challenger', version: '1.0' },
  });
  await new Promise(r => setTimeout(r, 150));

  // 2. Initialized notification
  server.child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
  await new Promise(r => setTimeout(r, 50));

  // 3. Valid tool call: qap_status on D:\OPENCLAW
  sendReq('tools/call', {
    name: 'qap_status',
    arguments: { targetPath: TARGET_WORKSPACE },
  });
  await new Promise(r => setTimeout(r, 400));

  // 4. Invalid tool call: unknown tool name (triggers dispatcher error)
  sendReq('tools/call', {
    name: 'qap_nonexistent_tool_adversarial',
    arguments: { targetPath: TARGET_WORKSPACE },
  });
  await new Promise(r => setTimeout(r, 200));

  // 5. Tool call with missing required arguments (triggers argument validation error)
  sendReq('tools/call', {
    name: 'qap_context_set',
    arguments: {}, // missing targetPath
  });
  await new Promise(r => setTimeout(r, 200));

  // 6. Tool call on invalid directory (triggers prepareWorkspace technical diagnostic)
  sendReq('tools/call', {
    name: 'qap_status',
    arguments: { targetPath: 'Z:/NonExistentPath_ChallengerTest_123456' },
  });
  await new Promise(r => setTimeout(r, 300));

  server.child.stdin.end();
  const result = await server.waitForExit(5000);
  assert(result.code === 0, `Expected exit code 0, got ${result.code}`);

  // Comprehensive purity audit of EVERY line emitted on stdout
  const allStdoutLines = server.getStdoutLines();
  console.log(`  Total stdout messages captured: ${allStdoutLines.length}`);
  assert(allStdoutLines.length >= 4, `Expected at least 4 stdout messages, got ${allStdoutLines.length}`);

  for (let idx = 0; idx < allStdoutLines.length; idx++) {
    const line = allStdoutLines[idx];
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch (e) {
      throw new Error(`Message index ${idx} failed JSON parse: "${line}"`);
    }
    assert(parsed.jsonrpc === '2.0', `Message index ${idx} missing jsonrpc:"2.0": ${line}`);
  }

  assert(result.stdoutPurityErrors.length === 0, `Purity errors: ${result.stdoutPurityErrors.join('; ')}`);
  console.log('  ✔ PASS: 100% of stdout lines are valid JSON-RPC 2.0. Zero non-protocol bytes leaked.');
}

async function runTest6_MalformedJsonAndBufferLimits() {
  console.log('\n--- Test 6: Malformed JSON, raw garbage, and buffer limits ---');
  const server = spawnServer();
  await server.waitForReady();

  // Send malformed JSON line
  server.child.stdin.write('{"jsonrpc":"2.0", unclosed_syntax\n');
  await new Promise(r => setTimeout(r, 100));

  // Send random binary garbage
  server.child.stdin.write(Buffer.from([0x00, 0xff, 0xfe, 0x01, 0x0a]));
  await new Promise(r => setTimeout(r, 100));

  // Send valid request after garbage to verify server survived
  server.child.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 99,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'challenger', version: '1.0' },
    },
  }) + '\n');
  await new Promise(r => setTimeout(r, 200));

  // Now test buffer limit (> 10MB)
  console.log('  Injecting 11MB oversized buffer to test ReadBuffer limit...');
  try {
    const hugeChunk = Buffer.alloc(11 * 1024 * 1024, 'A');
    server.child.stdin.write(hugeChunk);
    server.child.stdin.write('\n');
  } catch (err) {
    console.log(`  Client write error handled: ${err.message}`);
  }

  // Server should close or exit safely when buffer exceeds maximum size
  const result = await server.waitForExit(6000);
  console.log(`  Exit code after oversized buffer: ${result.code}`);
  assert(result.code === 0 || result.code === 1, `Expected exit code 0 or 1, got ${result.code}`);
  assert(result.code !== 0xffffffff, 'Server exited with 0xffffffff on buffer overflow');
  assert(result.stdoutPurityErrors.length === 0, `Purity errors: ${result.stdoutPurityErrors.join('; ')}`);
  console.log('  ✔ PASS: Handled garbage, syntax errors, and buffer limit without hanging or 0xffffffff.');
}

async function runTest7_SignalHandlingWindows() {
  console.log('\n--- Test 7: Signal Handling (SIGINT & SIGTERM emulation on Windows) ---');

  // 7a. External SIGINT via process termination
  {
    console.log('  Testing external SIGINT termination...');
    const server = spawnServer();
    await server.waitForReady();
    server.child.kill('SIGINT');
    const result = await server.waitForExit(5000);
    console.log(`  External SIGINT exit code: ${result.code}, signal: ${result.signal}`);
    assert(result.code === 0 || (result.code === null && result.signal === 'SIGINT'), `Unexpected exit status: code=${result.code}, signal=${result.signal}`);
    assert(result.code !== 0xffffffff, 'Exited with 0xffffffff');
    console.log('  ✔ External SIGINT terminated cleanly without hanging or 0xffffffff.');
  }

  // 7b. External SIGTERM via process termination
  {
    console.log('  Testing external SIGTERM termination...');
    const server = spawnServer();
    await server.waitForReady();
    server.child.kill('SIGTERM');
    const result = await server.waitForExit(5000);
    console.log(`  External SIGTERM exit code: ${result.code}, signal: ${result.signal}`);
    assert(result.code === 0 || (result.code === null && result.signal === 'SIGTERM'), `Unexpected exit status: code=${result.code}, signal=${result.signal}`);
    assert(result.code !== 0xffffffff, 'Exited with 0xffffffff');
    console.log('  ✔ External SIGTERM terminated cleanly without hanging or 0xffffffff.');
  }

  // 7c. Orderly shutdown handler verification under SIGINT
  {
    console.log('  Testing internal SIGINT orderly shutdown handler...');
    const serverUrl = pathToFileURL(SERVER_PATH).href;
    const child = spawn(NODE_EXE, ['-e', `
      import('${serverUrl}').then(async (m) => {
        await m.startMcpServer();
        setTimeout(() => { process.emit('SIGINT'); }, 200);
      });
    `], { stdio: ['pipe', 'pipe', 'pipe'] });

    let stderr = '';
    child.stderr.on('data', d => { stderr += d.toString(); });
    const result = await new Promise((res) => child.on('exit', (code, signal) => res({ code, signal, stderr })));
    console.log(`  Internal SIGINT exit code: ${result.code}, signal: ${result.signal}`);
    assert(result.code === 0, `Expected exit code 0 on orderly SIGINT, got ${result.code}`);
    assert(stderr.includes('Orderly shutdown initiated (SIGINT)'), 'Orderly shutdown was not initiated on SIGINT');
    assert(stderr.includes('Orderly shutdown finished (SIGINT). Exiting 0.'), 'Orderly shutdown did not finish cleanly on SIGINT');
    console.log('  ✔ Internal SIGINT executed orderly shutdown handler and exited 0.');
  }

  // 7d. Orderly shutdown handler verification under SIGTERM
  {
    console.log('  Testing internal SIGTERM orderly shutdown handler...');
    const serverUrl = pathToFileURL(SERVER_PATH).href;
    const child = spawn(NODE_EXE, ['-e', `
      import('${serverUrl}').then(async (m) => {
        await m.startMcpServer();
        setTimeout(() => { process.emit('SIGTERM'); }, 200);
      });
    `], { stdio: ['pipe', 'pipe', 'pipe'] });

    let stderr = '';
    child.stderr.on('data', d => { stderr += d.toString(); });
    const result = await new Promise((res) => child.on('exit', (code, signal) => res({ code, signal, stderr })));
    console.log(`  Internal SIGTERM exit code: ${result.code}, signal: ${result.signal}`);
    assert(result.code === 0, `Expected exit code 0 on orderly SIGTERM, got ${result.code}`);
    assert(stderr.includes('Orderly shutdown initiated (SIGTERM)'), 'Orderly shutdown was not initiated on SIGTERM');
    assert(stderr.includes('Orderly shutdown finished (SIGTERM). Exiting 0.'), 'Orderly shutdown did not finish cleanly on SIGTERM');
    console.log('  ✔ Internal SIGTERM executed orderly shutdown handler and exited 0.');
  }
}

async function runTest8_TenRapidConcurrentStarts() {
  console.log('\n--- Test 8: 10 Rapid Concurrent Server Starts (Real MCP Clients & SQLite Stress) ---');
  const CONCURRENCY = 10;
  const startTime = Date.now();

  console.log(`  Spawning ${CONCURRENCY} concurrent MCP Clients via StdioClientTransport...`);
  const clients = [];
  for (let i = 1; i <= CONCURRENCY; i++) {
    const transport = new StdioClientTransport({
      command: NODE_EXE,
      args: [SERVER_PATH],
      env: { ...process.env, QAP_BUILD_REVISION: `challenger-concurrent-${i}` },
    });
    const client = new Client(
      { name: `concurrent-client-${i}`, version: '1.0.0' },
      { capabilities: {} }
    );
    clients.push({ id: i, client, transport });
  }

  // Concurrently connect and invoke qap_status on D:\OPENCLAW
  const runPromises = clients.map(async ({ id, client, transport }) => {
    await client.connect(transport);
    const statusRes = await client.callTool({
      name: 'qap_status',
      arguments: { targetPath: TARGET_WORKSPACE },
    });
    const text = statusRes?.content?.[0]?.text;
    assert(text && (text.includes('"status":"success"') || text.includes('"status": "success"')), `Instance ${id} failed status call: ${text}`);
    return { id, success: true };
  });

  const toolResults = await Promise.all(runPromises);
  assert(toolResults.length === CONCURRENCY, `Expected ${CONCURRENCY} results, got ${toolResults.length}`);
  console.log(`  All ${CONCURRENCY} tool calls completed successfully on ${TARGET_WORKSPACE}!`);

  // Concurrently close all clients
  console.log(`  Closing all ${CONCURRENCY} clients concurrently...`);
  const closePromises = clients.map(async ({ id, client, transport }) => {
    const child = transport._process;
    const exitPromise = new Promise((res) => {
      if (!child) return res({ id, code: 0 });
      child.on('exit', (code, signal) => res({ id, code, signal }));
    });
    await client.close();
    return exitPromise;
  });

  const exitResults = await Promise.all(closePromises);
  const elapsed = Date.now() - startTime;

  for (const er of exitResults) {
    assert(er.code === 0, `Instance ${er.id} exited with non-zero code ${er.code}`);
  }

  console.log(`  ✔ PASS: All ${CONCURRENCY} concurrent instances executed and exited 0 in ${elapsed}ms! No lockouts or collisions.`);
}

async function runTest9_CliEntrypointEquivalence() {
  console.log('\n--- Test 9: CLI Entrypoint Equivalence (entrypoint.js mcp) ---');
  const server = spawnServer(CLI_PATH, ['mcp']);
  await server.waitForReady();

  server.child.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'cli-test', version: '1.0' } },
  }) + '\n');

  await new Promise(r => setTimeout(r, 200));
  server.child.stdin.end();

  const result = await server.waitForExit(5000);
  assert(result.code === 0, `CLI entrypoint exited with code ${result.code} (expected 0)`);
  assert(result.stdoutPurityErrors.length === 0, `CLI entrypoint purity error: ${result.stdoutPurityErrors.join(', ')}`);
  console.log('  ✔ PASS: CLI entrypoint behaves identically with clean exit code 0.');
}

async function main() {
  console.log('================================================================');
  console.log('  EMPIRICAL CHALLENGER: Stdio Adversarial Stress Test Suite');
  console.log('================================================================');
  console.log('Node Runtime: ', NODE_EXE);
  console.log('Server Script:', SERVER_PATH);
  console.log('Target WS:    ', TARGET_WORKSPACE);

  const suiteStart = Date.now();
  let passed = 0;
  let failed = 0;
  const tests = [
    { name: 'Test 1: Immediate abrupt stdin pipe closure on spawn', fn: runTest1_ImmediateStdinDestroy },
    { name: 'Test 2: Abrupt stdin destruction after Stdio ready', fn: runTest2_AbruptStdinDestroyAfterReady },
    { name: 'Test 3: Abrupt stdin destruction mid-handshake', fn: runTest3_AbruptStdinDestroyMidHandshake },
    { name: 'Test 4: Fragmented chunk-by-chunk JSON-RPC stream', fn: runTest4_FragmentedStreamingJsonRpc },
    { name: 'Test 5: Strict Stdout Protocol Framing Purity', fn: runTest5_StdoutPurityAcrossOperationsAndErrors },
    { name: 'Test 6: Malformed JSON, raw garbage, and buffer limits', fn: runTest6_MalformedJsonAndBufferLimits },
    { name: 'Test 7: Signal Handling (SIGINT & SIGTERM emulation on Windows)', fn: runTest7_SignalHandlingWindows },
    { name: 'Test 8: 10 Rapid Concurrent Server Starts', fn: runTest8_TenRapidConcurrentStarts },
    { name: 'Test 9: CLI Entrypoint Equivalence', fn: runTest9_CliEntrypointEquivalence },
  ];

  for (const test of tests) {
    try {
      await test.fn();
      passed++;
    } catch (err) {
      console.error(`\n  ✖ FAIL: ${test.name}`);
      console.error(`    Error: ${err.message}`);
      if (err.stack) console.error(`    Stack: ${err.stack}`);
      failed++;
    }
  }

  const elapsed = Date.now() - suiteStart;
  console.log('\n================================================================');
  console.log(`  CHALLENGER SUITE SUMMARY: ${passed} PASSED / ${failed} FAILED (in ${elapsed}ms)`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('FATAL TEST HARNESS ERROR:', err);
  process.exit(1);
});
