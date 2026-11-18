import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { appendFileSync, lstatSync, mkdirSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, parse, resolve } from 'node:path';

let logPath: string | undefined;
/** Local diagnostics only. A failed ACL setup never falls back to public stderr. */
export function authorizationDiagnostic(event: string, details: Record<string, unknown> = {}): string {
  const id = randomUUID();
  try {
    if (!logPath) {
      const base = join(homedir(), '.qap', 'diagnostics');
      let part = parse(base).root;
      for (const segment of base.slice(part.length).split(/[\\/]/).filter(Boolean)) {
        part = join(part, segment);
        mkdirSync(part, { recursive: true, mode: 0o700 });
        if (lstatSync(part).isSymbolicLink() || realpathSync(part).toLowerCase() !== resolve(part).toLowerCase()) throw new Error('Unsafe log directory');
      }
      const directory = join(base, `${process.pid}-${randomUUID()}`);
      mkdirSync(directory, { mode: 0o700 });
      if (process.platform === 'win32') {
        const system = process.env.SystemRoot ?? 'C:\\Windows';
        const identity = spawnSync(join(system, 'System32', 'whoami.exe'), ['/user', '/fo', 'csv', '/nh'], { encoding: 'utf8', windowsHide: true });
        const sid = identity.stdout?.match(/S-1-5-[0-9-]+/)?.[0];
        if (identity.status !== 0 || !sid) throw new Error('No log identity');
        const acl = spawnSync(join(system, 'System32', 'icacls.exe'), [directory, '/inheritance:r', '/grant:r', `*${sid}:(OI)(CI)F`, '*S-1-5-18:(OI)(CI)F'], { windowsHide: true });
        if (acl.status !== 0) throw new Error('Log ACL failed');
      }
      logPath = join(directory, 'authorization.jsonl');
    }
    appendFileSync(logPath, JSON.stringify({ at: new Date().toISOString(), pid: process.pid, id, event, ...details }) + '\n', { mode: 0o600 });
  } catch { /* Do not disclose paths, environment or exception text through MCP. */ }
  return id;
}
