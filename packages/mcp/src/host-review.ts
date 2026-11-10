import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { closeSync, existsSync, fsyncSync, lstatSync, openSync, readFileSync, realpathSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';

import type { HumanReviewRequest, HumanReviewDecision } from './handlers/canonical-interview-service.js';
import type { ModuleClosureReviewRequest } from './handlers/module-closure-gateway.js';

export const reviewDigest = (value: unknown): string => createHash('sha256').update(JSON.stringify(value)).digest('hex');
type ReviewKind = 'requirement' | 'cases' | 'closure';
interface ReviewEnvelope { version: number; kind: ReviewKind; request: HostReviewRequest }
interface ReviewDecision { kind: ReviewKind; requestDigest: string; approvalId: string; decision: string;
  presentedStatementDigest?: string; reviewer: string; decidedAt: string; expiresAt: string }
export type HostReviewRequest = { requestDigest: string; [key: string]: unknown };
/** Host-owned signed mailbox. MCP may request review; only the separate host CLI signs decisions. */
export class HostReviewQueue {
  private readonly key: Buffer;
  constructor(readonly directory: string, key: Buffer) {
    if (!isAbsolute(directory) || resolve(directory) !== directory || realpathSync(directory) !== directory || key.length !== 32) throw new Error('Invalid host review configuration');
    this.checkDirectory(directory); this.key = Buffer.from(key);
  }
  private checkDirectory(path: string): void {
    const stat = lstatSync(path);
    if (!stat.isDirectory() || stat.isSymbolicLink() || realpathSync(path) !== path) throw new Error('Unsafe review directory');
    if (dirname(path) !== path) this.checkDirectory(dirname(path));
  }
  private path(id: string, suffix: string): string {
    if (!/^[a-f0-9]{64}$/.test(id)) throw new Error('Invalid review digest');
    this.checkDirectory(this.directory); return join(this.directory, id + suffix + '.json');
  }
  private signature(payload: unknown): string { return createHmac('sha256', this.key).update(JSON.stringify(payload)).digest('hex'); }
  private read<T>(path: string): T | null {
    if (!existsSync(path)) return null;
    const stat = lstatSync(path);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || stat.size > 1048576) throw new Error('Unsafe review file');
    const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid review envelope');
    const envelope = parsed as { mac?: unknown; payload?: unknown };
    if (typeof envelope.mac !== 'string' || !/^[a-f0-9]{64}$/.test(envelope.mac) ||
      !timingSafeEqual(Buffer.from(envelope.mac, 'hex'), Buffer.from(this.signature(envelope.payload), 'hex'))) throw new Error('Invalid host review signature');
    return envelope.payload as T;
  }
  private write(path: string, payload: unknown): void {
    const temporary = path + '.' + randomUUID() + '.tmp';
    const fd = openSync(temporary, 'wx', 0o600);
    try { writeFileSync(fd, JSON.stringify({ payload, mac: this.signature(payload) }, null, 2)); fsyncSync(fd); }
    finally { closeSync(fd); }
    renameSync(temporary, path);
  }
  request(kind: ReviewKind, request: HostReviewRequest): ReviewDecision | null {
    const path = this.path(request.requestDigest, '.request');
    const payload = { version: 1, kind, request };
    const prior = this.read<ReviewEnvelope>(path);
    if (prior && reviewDigest(prior) !== reviewDigest(payload)) throw new Error('Review request collision');
    if (!prior) this.write(path, payload);
    const decision = this.read<ReviewDecision>(this.path(request.requestDigest, '.decision'));
    if (!decision || decision.requestDigest !== request.requestDigest || decision.kind !== kind || Date.parse(decision.expiresAt) <= Date.now()) return null;
    return decision;
  }
  acceptCases(request: HostReviewRequest): void {
    const decision = this.request('cases', request);
    if (!decision || decision.decision !== 'approve') throw new Error('Case approval unavailable');
    this.write(this.path(request.requestDigest, '.receipt'), { requestDigest: request.requestDigest, decision });
  }
  approvedCases(request: HostReviewRequest): boolean {
    const receipt = this.read<{requestDigest: string; decision: ReviewDecision}>(this.path(request.requestDigest, '.receipt'));
    const decision = this.read<ReviewDecision>(this.path(request.requestDigest, '.decision'));
    return receipt?.requestDigest === request.requestDigest && receipt.decision?.decision === 'approve' &&
      decision?.approvalId === receipt.decision.approvalId && decision.decision === 'approve';
  }
  inspect(id: string): ReviewEnvelope | null { return this.read<ReviewEnvelope>(this.path(id, '.request')); }
  /** Called by the independent interactive host CLI, never by MCP arguments. */
  decide(id: string, reviewer: string, decision: string): void {
    const pending = this.inspect(id);
    if (!pending || !reviewer.trim() || reviewer.length > 200 || !(['requirement'].includes(pending.kind) ? ['confirm', 'reject', 'defer'] : ['approve', 'reject']).includes(decision)) throw new Error('Invalid host decision');
    const now = new Date();
    this.write(this.path(id, '.decision'), { kind: pending.kind, requestDigest: id, approvalId: randomUUID(), decision,
      ...(pending.kind === 'requirement' ? { presentedStatementDigest: pending.request.statementDigest } : {}),
      reviewer, decidedAt: now.toISOString(), expiresAt: new Date(now.getTime() + 10 * 60000).toISOString() });
  }
  review(request: Readonly<HumanReviewRequest>) { return Promise.resolve(this.request('requirement', { ...request }) as HumanReviewDecision | null); }
  reviewClosure(request: Readonly<ModuleClosureReviewRequest>) { return Promise.resolve(this.request('closure', { ...request }) as import('./handlers/module-closure-gateway.js').ModuleClosureReviewDecision | null); }
  close(): void { this.key.fill(0); }
}
