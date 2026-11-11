import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { resolve } from 'node:path';

const NODE_EXE = 'C:/Users/baka6/AppData/Local/nvm/v22.16.0/node.exe';
const SERVER_PATH = resolve('packages/mcp/dist/server.js');
const TARGET_WORKSPACE = 'D:/OPENCLAW';
const CONCURRENCY = 10;

async function runClient(id) {
  const transport = new StdioClientTransport({
    command: NODE_EXE,
    args: [SERVER_PATH],
    env: { ...process.env, QAP_BUILD_REVISION: `concurrent-${id}` },
  });

  const client = new Client(
    { name: `concurrent-client-${id}`, version: '1.0.0' },
    { capabilities: {} }
  );

  let capturedStdout = [];
  // Spy on transport process stdout if available
  const child = transport._process;

  try {
    const startTime = Date.now();
    await client.connect(transport);

    // Call qap_status on real target workspace
    const statusRes = await client.callTool({
      name: 'qap_status',
      arguments: { targetPath: TARGET_WORKSPACE },
    });

    const duration = Date.now() - startTime;
    const content = statusRes?.content?.[0]?.text;
    const isSuccess = content?.includes('"status":"success"') || content?.includes('"status": "success"');

    return {
      id,
      duration,
      isSuccess,
      contentPreview: content?.slice(0, 120),
      client,
      transport,
    };
  } catch (err) {
    return {
      id,
      error: err.message,
      client,
      transport,
    };
  }
}

async function main() {
  console.log(`Spawning ${CONCURRENCY} concurrent MCP Clients via StdioClientTransport...`);
  const startAll = Date.now();
  const promises = [];
  for (let i = 1; i <= CONCURRENCY; i++) {
    promises.push(runClient(i));
  }

  const results = await Promise.all(promises);
  console.log('\n--- Tool Call Results ---');
  for (const r of results) {
    if (r.error) {
      console.error(`  Client ${r.id} FAILED: ${r.error}`);
    } else {
      console.log(`  Client ${r.id}: SUCCESS in ${r.duration}ms. Preview: ${r.contentPreview}`);
    }
  }

  // Now close all 10 clients concurrently and check exit codes of child processes
  console.log('\n--- Concurrently Closing All Clients ---');
  const closeResults = await Promise.all(results.map(async (r) => {
    const child = r.transport._process;
    const pid = child?.pid;
    const closePromise = new Promise((resolve) => {
      if (!child) return resolve({ id: r.id, pid, code: 0 });
      child.on('exit', (code, signal) => {
        resolve({ id: r.id, pid, code, signal });
      });
    });
    await r.client.close();
    return closePromise;
  }));

  console.log('\n--- Child Process Exit Codes ---');
  let allZero = true;
  for (const cr of closeResults) {
    console.log(`  Process for Client ${cr.id} (PID ${cr.pid}): exit code = ${cr.code}, signal = ${cr.signal}`);
    if (cr.code !== 0) allZero = false;
  }

  const totalTime = Date.now() - startAll;
  console.log(`\nTotal time for ${CONCURRENCY} concurrent client runs & closes: ${totalTime}ms`);
  if (!allZero) {
    console.error('FAIL: Not all child processes exited with code 0!');
    process.exit(1);
  }
  console.log('SUCCESS: All 10 concurrent instances executed and exited with code 0!');
}

main().catch(err => {
  console.error('Fatal error in concurrent test:', err);
  process.exit(1);
});
