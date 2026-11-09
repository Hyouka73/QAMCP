import { describe, expect, it } from 'vitest';

import { type ApplicationObservation, type MultimodalEvidenceRef, validateApplicationObservation } from '../../domain/index.js';

describe('VNEXT-006 additive HTTP metadata evidence', () => {
  it('supports truthful metadata evidence without breaking existing evidence kinds', () => {
    for (const kind of ['http_recon_metadata', 'network_har', 'screenshot', 'dom_snippet', 'console_log'] as const) {
      const evidence: MultimodalEvidenceRef = { id: 'e', kind, uri: 'urn:qap:synthetic:e',
        pii_masked: true, captured_at: '2026-10-28T12:00:00.000Z', metadata: { http_status: 200 } };
      const observation: ApplicationObservation = { id: 'o', application_id: 'a', environment_id: 'dev',
        kind: 'network_traffic', observed_by: 'recon', evidence, observed_at: evidence.captured_at,
        network_event: { url: 'https://example.test/', method: 'GET', status: 200 } };
      expect(validateApplicationObservation(observation).valid).toBe(true);
    }
  });
});
