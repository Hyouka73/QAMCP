import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { QapDatabase } from '../persistence/sqlite-client.js';

describe('INT-01E: non-initializing database audit mode', () => {
  it('rejects all mutators before any filesystem mutation', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qap-db-audit-'));
    if (path.dirname(path.resolve(root)) !== path.resolve(os.tmpdir()) || !path.basename(root).startsWith('qap-db-audit-')) throw new Error('Invalid fixture root');
    try {
      const writer = new QapDatabase(root);
      writer.close();
      const audit = new QapDatabase(root, false, { readOnly: true });
      try {
        expect(audit.listRuns()).toEqual([]);
        expect(() => audit.saveRun({ runId: 'never-created' } as never)).toThrow('Read-only audit');
        expect(() => audit.deleteRun('never-created')).toThrow('Read-only audit');
        expect(() => audit.pinRun('never-created', true)).toThrow('Read-only audit');
        expect(() => audit.reindex()).toThrow('Read-only audit');
        expect(fs.existsSync(path.join(root, 'runs'))).toBe(false);
      } finally { audit.close(); }
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
