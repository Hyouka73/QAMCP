import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const NODE_EXE = 'C:/Users/baka6/AppData/Local/nvm/v22.16.0/node.exe';
const SERVER_PATH = resolve('packages/mcp/dist/server.js');

async function testSingleStart(index) {
  return new Promise((resolve, reject) => {
    const child = spawn(NODE_EXE, [SERVER_PATH], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, QAP_BUILD_REVISION: 'm1-test' },
    });

    let stdoutReceived = false;
    let stderrReceived = '';

    child.stdout.on('data', (data) => {
      stdoutReceived = true;
      console.log(`[Run ${index}] stdout received:`, data.toString().slice(0, 100));
    });

    child.stderr.on('data', (data) => {
      const text = data.toString();
      stderrReceived += text;
      if (text.includes('Stdio ready')) {
        // Once ready, cleanly close stdin to trigger graceful shutdown
        setTimeout(() => {
          child.stdin.end();
        }, 100);
      }
    });

    child.on('exit', (code, signal) => {
      console.log(`[Run ${index}] Exit code: ${code}, signal: ${signal}`);
      if (code === 0) {
        resolve({ index, code, signal });
      } else {
        reject(new Error(`Run ${index} exited with code ${code} (expected 0). Stderr: ${stderrReceived}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  console.log('==================================================');
  console.log('  M1 Physical Verification: Multi-Start Stdio Test');
  console.log('==================================================');
  console.log('Node executable:', NODE_EXE);
  console.log('Server script:  ', SERVER_PATH);

  for (let i = 1; i <= 5; i++) {
    const res = await testSingleStart(i);
    console.log(`  ✔ Run ${i}/5 PASSED (exit code ${res.code})\n`);
  }

  console.log('==================================================');
  console.log('  ✔ ALL 5 RUNS COMPLETED WITH CLEAN EXIT CODE 0!   ');
  console.log('==================================================');
}

main().catch((err) => {
  console.error('FATAL TEST ERROR:', err);
  process.exit(1);
});
