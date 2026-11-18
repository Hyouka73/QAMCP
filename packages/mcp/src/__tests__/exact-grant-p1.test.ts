import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { QapApplicationService } from '../application/application-service.js';

it('validates the admitted grant independently of later grants and other projects', () => {
  const dir = mkdtempSync(join(tmpdir(), 'qap-exact-grant-'));
  const rootA = join(dir, 'a');
  const rootB = join(dir, 'b');
  mkdirSync(rootA); mkdirSync(rootB);
  const service = new QapApplicationService({ hostRootDir: join(dir, 'app'), projectOperationDirectory: join(dir, 'host') });
  try {
    const a = service.createProject({ name: 'A', canonicalRoot: rootA }).project.project_id;
    const b = service.createProject({ name: 'B', canonicalRoot: rootB }).project.project_id;
    const scope = { origin: 'https://example.invalid' };
    const g1 = service.authority.grant({ project_id: a, capability: 'execute', scope, granted_by: 'test' });
    const gb = service.authority.grant({ project_id: b, capability: 'execute', scope, granted_by: 'test' });
    const g2 = service.authority.grant({ project_id: a, capability: 'execute', scope, granted_by: 'test' });
    expect(service.authority.isGrantValid(a, 'execute', g1.grant_id, scope)).toBe(true);
    expect(service.authority.isGrantValid(a, 'execute', g1.grant_id, { origin: 'https://other.invalid' })).toBe(false);
    expect(service.authority.isGrantValid(b, 'execute', g1.grant_id, scope)).toBe(false);
    service.authority.revokeGrant(a, g1.grant_id);
    expect(service.authority.isGrantValid(a, 'execute', g1.grant_id, scope)).toBe(false);
    expect(service.authority.isGrantValid(a, 'execute', g2.grant_id, scope)).toBe(true);
    expect(service.authority.isGrantValid(b, 'execute', gb.grant_id, scope)).toBe(true);
    const expired = service.authority.grant({ project_id: a, capability: 'execute', scope, granted_by: 'test', expires_at: '2000-01-01T00:00:00.000Z' });
    expect(service.authority.isGrantValid(a, 'execute', expired.grant_id, scope)).toBe(false);
  } finally {
    service.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
