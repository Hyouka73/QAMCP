import fs from 'node:fs';
import console from 'node:console';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

// Run after staging evidence (including ignored *.log files). Git applies the
// repository's CRLF filter; record both raw disk and actual staged bytes.
const out = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(out, '../../../../..');
const sha256 = value => createHash('sha256').update(value).digest('hex');
const files = fs.readdirSync(out).filter(name => name !== 'evidence-index.json' && fs.statSync(path.join(out, name)).isFile());
const evidence = files.map(name => {
  const file = path.join(out, name), relative = path.relative(repo, file).replaceAll('\\', '/');
  const raw = fs.readFileSync(file);
  const staged = execFileSync('git', ['show', `:${relative}`], { cwd: repo, maxBuffer: 8 * 1024 * 1024 });
  return { file: name, worktree_sha256: sha256(raw), published_sha256: sha256(staged),
    published_bytes: staged.length };
});
const manifest = { implementation: '9a7ce20b4bd3a07518351397a1eab40ce84f2e84',
  baseline: '794dc0d2fe1fb85dd1f9fb0c211b9b35346ac747',
  note: 'Manifest excludes itself. published_sha256 hashes actual staged Git bytes; worktree_sha256 hashes original disk bytes. No product source changes.',
  evidence };
fs.writeFileSync(path.join(out, 'evidence-index.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ indexed: evidence.length, worktree_and_published_bytes_differ: evidence.filter(e => e.worktree_sha256 !== e.published_sha256).length }));
