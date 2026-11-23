import { createHash } from 'node:crypto';
import {
  closeSync, constants, existsSync, fstatSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync,
  readdirSync, renameSync, rmSync, writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { SchemaValidator, type EvidenceManifestV1 } from '@qap/shared';

const manifestFilename = 'evidence-manifest.v1.json';
const receiptFilename = '.qap-committed';
const validator = new SchemaValidator();

function digest(input: Buffer | string): string {
  return createHash('sha256').update(input).digest('hex');
}

function verifyId(id: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(id) ||
      /^(?:CON|NUL|AUX|PRN|COM[1-9]|LPT[1-9])$/i.test(id)) throw new Error('Invalid evidence identifier.');
}

function requireDirectory(directory: string): void {
  if (!lstatSync(directory).isDirectory()) throw new Error('Invalid evidence directory.');
}

/** This store operates under host-owned roots that have already passed ACL validation. */
function readRegular(file: string, size?: number): Buffer {
  const before = lstatSync(file);
  if (!before.isFile() || before.nlink !== 1) throw new Error('Invalid evidence file.');
  const fd = openSync(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const opened = fstatSync(fd);
    if (!opened.isFile() || opened.nlink !== 1 || before.dev !== opened.dev || before.ino !== opened.ino ||
        (size !== undefined && opened.size !== size)) throw new Error('Unexpected evidence file.');
    return readFileSync(fd);
  } finally {
    closeSync(fd);
  }
}

function flushDirectory(directory: string): void {
  if (process.platform === 'win32') return;
  const fd = openSync(directory, constants.O_RDONLY);
  try { fsyncSync(fd); } finally { closeSync(fd); }
}

function verifyManifest(manifest: EvidenceManifestV1): void {
  if (!validator.validateEvidenceManifest(manifest).valid) throw new Error('Invalid capture manifest schema.');
  verifyId(manifest.attempt_id);
  const filenames = new Set<string>();
  const artifacts = new Map<string, EvidenceManifestV1['artifacts'][number]>();
  const decisions = new Map(manifest.decisions.map(decision => [decision.decision_id, decision]));
  if (decisions.size !== manifest.decisions.length) throw new Error('Duplicate capture decision.');
  for (const artifact of manifest.artifacts) {
    const filename = artifact.filename.toLowerCase();
    if (filename === manifestFilename || filenames.has(filename) || artifacts.has(artifact.artifact_id) ||
        /^(?:con|nul|aux|prn|com[1-9]|lpt[1-9])(?:\.|$)/i.test(filename)) {
      throw new Error('Duplicate or invalid evidence file.');
    }
    filenames.add(filename);
    artifacts.set(artifact.artifact_id, artifact);
  }
  const videos = new Set<string>();
  for (const segment of manifest.segments) {
    const artifact = artifacts.get(segment.artifact_id);
    const decision = decisions.get(segment.decision_id);
    if (!artifact || artifact.kind !== 'webm' || !decision || decision.mode === 'MANDATORY_SUPPRESSION' ||
        decision.custody !== artifact.custody.custody || decision.scope?.project_id !== manifest.project_id ||
        !decision.scope.allowed_origins.includes(segment.origin) || !decision.scope.allowed_roles.includes(segment.role_id) ||
        videos.has(segment.artifact_id) || segment.step_offsets_ms.some(step => step.offset_ms > segment.duration_ms)) {
      throw new Error('Inconsistent capture segment.');
    }
    videos.add(segment.artifact_id);
  }
  const visualCount = manifest.artifacts.filter(artifact => artifact.kind === 'webm' || artifact.kind === 'png').length;
  if (manifest.artifacts.some(artifact => artifact.kind === 'webm' && !videos.has(artifact.artifact_id)) ||
      (manifest.visual_evidence_status === 'captured' && (visualCount === 0 || manifest.suppressions.length !== 0)) ||
      (manifest.visual_evidence_status === 'partial' && (visualCount === 0 || manifest.suppressions.length === 0)) ||
      (manifest.visual_evidence_status === 'suppressed_by_policy' && (manifest.artifacts.length !== 0 || manifest.suppressions.length === 0))) {
    throw new Error('Inconsistent visual evidence status.');
  }
}

function verifyStored(directory: string, expectedId: string, expectedHash: string): EvidenceManifestV1 {
  requireDirectory(directory);
  const raw = readRegular(join(directory, manifestFilename));
  if (digest(raw) !== expectedHash) throw new Error('Evidence manifest integrity mismatch.');
  const manifest = JSON.parse(raw.toString('utf8')) as EvidenceManifestV1;
  verifyManifest(manifest);
  if (manifest.attempt_id !== expectedId) throw new Error('Unexpected evidence attempt.');
  for (const artifact of manifest.artifacts) {
    const bytes = readRegular(join(directory, artifact.filename), artifact.size_bytes);
    if (digest(bytes) !== artifact.custody.stored_sha256) throw new Error('Evidence integrity mismatch.');
  }
  return manifest;
}

export class CapturePublicationStore {
  /** Production must use the same SQLite connection as the run transaction. */
  constructor(private readonly db: DatabaseSync, private readonly protectedRoot: string) {
    requireDirectory(protectedRoot);
    this.db.exec(`
      PRAGMA busy_timeout = 10000;
      CREATE TABLE IF NOT EXISTS capture_publications (
        attempt_id TEXT PRIMARY KEY,
        manifest_sha256 TEXT NOT NULL,
        integrity_degraded INTEGER NOT NULL DEFAULT 0
      );
    `);
  }

  private transaction<T>(operation: () => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const result = operation();
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      if (this.db.isTransaction) this.db.exec('ROLLBACK');
      throw error;
    }
  }

  /**
   * Staging files must already have been validated, sealed, and (if required)
   * encrypted under the matching custody policy. Supply a synchronous host
   * authorization check against the current grant generation.
   */
  publish(
    manifest: EvidenceManifestV1,
    stagingDir: string,
    authorize: () => boolean,
    insertRun: (db: DatabaseSync) => void,
  ): void {
    verifyManifest(manifest);
    if (manifest.decisions.some(decision => decision.mode === 'PRIVATE_AUTHORIZED') ||
        manifest.artifacts.some(artifact => artifact.custody.custody === 'private_encrypted_local_only')) {
      throw new Error('Private capture publication is disabled.');
    }
    requireDirectory(stagingDir);
    const attempt = manifest.attempt_id;
    const incoming = join(this.protectedRoot, `.incoming-${attempt}`);
    const final = join(this.protectedRoot, `capture-${attempt}`);
    const json = JSON.stringify(manifest);
    const hash = digest(json);
    this.transaction(() => {
      if (!authorize()) throw new Error('Capture publication denied.');
      if (this.db.prepare('SELECT 1 FROM capture_publications WHERE attempt_id = ?').get(attempt) || existsSync(final)) {
        throw new Error('Capture publication already exists.');
      }
      mkdirSync(incoming, { mode: 0o700 });
      for (const artifact of manifest.artifacts) {
        const bytes = readRegular(join(stagingDir, artifact.filename), artifact.size_bytes);
        if (digest(bytes) !== artifact.custody.stored_sha256) throw new Error('Staged capture integrity mismatch.');
        writeFileSync(join(incoming, artifact.filename), bytes, { flag: 'wx', mode: 0o600, flush: true });
      }
      writeFileSync(join(incoming, manifestFilename), json, { flag: 'wx', mode: 0o600, flush: true });
      verifyStored(incoming, attempt, hash);
      flushDirectory(incoming);
      renameSync(incoming, final);
      flushDirectory(this.protectedRoot);
      insertRun(this.db);
      if (!authorize()) throw new Error('Capture grant revoked before commit.');
      this.db.prepare('INSERT INTO capture_publications (attempt_id, manifest_sha256) VALUES (?, ?)').run(attempt, hash);
    });
    // A crash here is post-commit. Only reconciliation may finish the receipt.
    this.reconcile();
  }

  reconcile(): { discarded: number; confirmed: number; degraded: number } {
    return this.transaction(() => {
      const result = { discarded: 0, confirmed: 0, degraded: 0 };
      const publication = this.db.prepare('SELECT manifest_sha256 FROM capture_publications WHERE attempt_id = ?');
      const markDegraded = this.db.prepare('UPDATE capture_publications SET integrity_degraded = 1 WHERE attempt_id = ?');
      const seen = new Set<string>();
      for (const entry of readdirSync(this.protectedRoot, { withFileTypes: true })) {
        const match = /^(\.incoming-|capture-)([A-Za-z0-9][A-Za-z0-9_-]{0,127})$/.exec(entry.name);
        if (!match) continue;
        const [, prefix, attempt] = match;
        const directory = join(this.protectedRoot, entry.name);
        const row = publication.get(attempt!) as { manifest_sha256: string } | undefined;
        if (!row) {
          if (entry.isDirectory()) {
            rmSync(directory, { recursive: true });
            result.discarded++;
          }
          continue;
        }
        // An incoming tree for a committed ID is never a candidate for promotion.
        if (prefix !== 'capture-') continue;
        seen.add(attempt!);
        try {
          verifyStored(directory, attempt!, row.manifest_sha256);
        } catch {
          markDegraded.run(attempt!);
          result.degraded++;
          continue;
        }
        const receipt = join(directory, receiptFilename);
        if (!existsSync(receipt)) {
          writeFileSync(receipt, row.manifest_sha256, { flag: 'wx', mode: 0o600, flush: true });
          flushDirectory(directory);
          result.confirmed++;
        } else {
          try {
            if (readRegular(receipt, 64).toString('ascii') === row.manifest_sha256) continue;
          } catch { /* An invalid receipt is recorded as degraded. */ }
          markDegraded.run(attempt!);
          result.degraded++;
        }
      }
      for (const { attempt_id } of this.db.prepare('SELECT attempt_id FROM capture_publications').all()) {
        if (!seen.has(String(attempt_id))) {
          markDegraded.run(String(attempt_id));
          result.degraded++;
        }
      }
      return result;
    });
  }
}
