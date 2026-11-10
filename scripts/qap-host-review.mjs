import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { HostReviewQueue } from '../packages/mcp/dist/index.js';
const [directory, digest, secretsFile] = process.argv.slice(2);
const hex = process.env.QAP_MCP_REVIEW_KEY_HEX ?? (secretsFile ? JSON.parse(readFileSync(secretsFile, 'utf8')).QAP_MCP_REVIEW_KEY_HEX : undefined);
if (!/^[a-f0-9]{64}$/i.test(hex ?? '')) throw new Error('Configure QAP_MCP_REVIEW_KEY_HEX in the independent host terminal');
const queue = new HostReviewQueue(directory, Buffer.from(hex, 'hex'));
const io = createInterface({ input: stdin, output: stdout });
try {
  const pending = queue.inspect(digest);
  if (!pending) throw new Error('Request not found');
  console.log(JSON.stringify(pending, null, 2));
  const reviewer = await io.question('Identidad del revisor: ');
  const decision = await io.question(pending.kind === 'requirement' ? 'Decisión explícita (confirm/reject/defer): ' : 'Decisión explícita (approve/reject): ');
  const exact = await io.question('Para vincular la decisión, escriba el requestDigest completo presentado: ');
  if (exact !== digest) throw new Error('Digest not confirmed');
  queue.decide(digest, reviewer, decision);
  console.log('Decisión guardada. Repita la operación MCP pendiente en diez minutos.');
} finally { io.close(); queue.close(); }
