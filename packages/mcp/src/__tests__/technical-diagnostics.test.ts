import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { logTechnicalDiagnostic } from '../technical-diagnostics.js';

describe('logTechnicalDiagnostic', () => {
  it('logs structured technical errors including runtime info and project log', () => {
    const projectDir = mkdtempSync(join(tmpdir(), 'qap-diag-test-'));
    try {
      const diagId = logTechnicalDiagnostic({
        event: 'test_technical_error',
        tool: 'qap_status',
        targetPath: projectDir,
        error: {
          name: 'Error',
          message: 'Simulated technical failure',
        },
      }, projectDir);

      expect(typeof diagId).toBe('string');
      expect(diagId.length).toBeGreaterThan(0);

      // Check project local .qa/logs/technical_errors.log
      const projectLogPath = join(projectDir, '.qa', 'logs', 'technical_errors.log');
      expect(existsSync(projectLogPath)).toBe(true);

      const content = readFileSync(projectLogPath, 'utf8');
      const parsed = JSON.parse(content.trim().split('\n').pop()!);
      expect(parsed.event).toBe('test_technical_error');
      expect(parsed.diagnostic_id).toBe(diagId);
      expect(parsed.nodeVersion).toBe(process.version);
      expect(parsed.nodeExecutable).toBe(process.execPath);
      expect(parsed.error.message).toBe('Simulated technical failure');
    } finally {
      rmSync(projectDir, { recursive: true, force: true });
    }
  });
});
