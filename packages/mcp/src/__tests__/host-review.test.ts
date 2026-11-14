import { randomBytes } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { HostReviewQueue, reviewDigest } from '../host-review.js';
const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
function fixture() { const root = mkdtempSync(join(tmpdir(), 'qap-review-')); roots.push(root); const key = randomBytes(32); return { root, key, queue: new HostReviewQueue(root, key) }; }
function request(label = 'exact approved cases') { return { requestDigest: reviewDigest(label), cases: [{ name: label, steps: [{ expected: 'Ready' }] }] }; }
describe('independent durable host review', () => {
  it('never approves from MCP-provided flags, and recovers an explicit host receipt after restart', () => {
    const f = fixture(), req = { ...request(), approved: true, user_confirmed: true };
    expect(f.queue.request('cases', req)).toBeNull(); expect(f.queue.approvedCases(req)).toBe(false);
    f.queue.decide(req.requestDigest, 'technical fixture operator', 'approve'); f.queue.acceptCases(req); f.queue.close();
    const restarted = new HostReviewQueue(f.root, f.key); expect(restarted.approvedCases(req)).toBe(true); restarted.close();
  });
  it('binds exact content and rejects a different payload under a prior digest', () => {
    const f = fixture(), req = request(); f.queue.request('cases', req);
    expect(() => f.queue.request('cases', { ...req, cases: [] })).toThrow('collision');
    expect(f.queue.approvedCases(request('changed cases'))).toBe(false); f.queue.close();
  });
  it('rejects unsigned file edits and wrong-key decisions', () => {
    const f = fixture(), req = request(); f.queue.request('cases', req); f.queue.decide(req.requestDigest, 'operator', 'approve');
    const path = join(f.root, req.requestDigest + '.decision.json'); const envelope = JSON.parse(readFileSync(path, 'utf8')); envelope.payload.reviewer = 'forged'; writeFileSync(path, JSON.stringify(envelope));
    expect(() => f.queue.acceptCases(req)).toThrow('signature');
    const other = new HostReviewQueue(f.root, randomBytes(32)); expect(() => other.request('cases', req)).toThrow('signature'); other.close(); f.queue.close();
  });
  it('rejects an explicit negative decision and revokes a previously consumed receipt', () => {
    const f = fixture(), req = request(); f.queue.request('cases', req); f.queue.decide(req.requestDigest, 'operator', 'approve'); f.queue.acceptCases(req);
    f.queue.decide(req.requestDigest, 'operator', 'reject'); expect(f.queue.approvedCases(req)).toBe(false); expect(() => f.queue.acceptCases(req)).toThrow(); f.queue.close();
  });
  it('never uses an expired decision to create a receipt', () => {
    const f = fixture(), req = request(); f.queue.request('cases', req);
    const realNow = Date.now; Date.now = () => realNow() + 11 * 60000;
    try { f.queue.decide(req.requestDigest, 'operator', 'approve'); expect(f.queue.request('cases', req)).toBeNull(); } finally { Date.now = realNow; f.queue.close(); }
  });
  it('requires safe digest names and explicit per-kind decisions', () => {
    const f = fixture(); expect(() => f.queue.inspect('../secret')).toThrow(); const req = request(); f.queue.request('cases', req);
    expect(() => f.queue.decide(req.requestDigest, 'operator', 'confirm')).toThrow(); expect(() => f.queue.decide(req.requestDigest, '', 'approve')).toThrow(); f.queue.close();
  });
});
