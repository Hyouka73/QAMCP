import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import type { KeyObject } from 'node:crypto';

const nonceBytes = 12;
const tagBytes = 16;
const maxSegmentBytes = 32 * 1024 * 1024;

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

export interface PrivateArtifactBinding {
  readonly project_id: string;
  readonly attempt_id: string;
  readonly artifact_id: string;
}

function artifactAad(binding: PrivateArtifactBinding): Buffer {
  const ids = [binding.project_id, binding.attempt_id, binding.artifact_id];
  if (ids.some(id => !/^[A-Za-z0-9_-]{1,128}$/.test(id))) throw new Error('Invalid private artifact binding.');
  return Buffer.from(ids.join(':'));
}

/** Applies post-seal encryption. The source must already have protected staging. */
export function encryptSealedCapture(plaintext: Buffer, key: KeyObject, binding: PrivateArtifactBinding) {
  if (plaintext.length === 0 || plaintext.length > maxSegmentBytes) throw new Error('Private capture size is invalid.');
  const nonce = randomBytes(nonceBytes);
  const cipher = createCipheriv('aes-256-gcm', key, nonce);
  cipher.setAAD(artifactAad(binding));
  const ciphertext = Buffer.concat([nonce, cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);
  return { ciphertext, plaintext_sha256: sha256(plaintext), stored_sha256: sha256(ciphertext) };
}

interface CommittedPrivateMedia extends PrivateArtifactBinding {
  readonly stored_sha256: string;
  readonly plaintext_sha256: string;
  readonly size_bytes: number;
  readonly mime_type: 'video/webm' | 'image/png';
}

type PrivateMediaResponse = { status: 200 | 206 | 404 | 416; headers: Record<string, string>; body?: Buffer };

function resolveRange(value: string, size: number): [number, number] | undefined {
  const match = /^bytes=([0-9]{0,16})-([0-9]{0,16})$/.exec(value);
  if (!match) return;
  const [, first, last] = match;
  if (!first && !last) return;
  const end = last ? Number(last) : size - 1;
  const start = first ? Number(first) : Math.max(0, size - end);
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || (first && start > end)) return;
  return [start, first ? Math.min(end, size - 1) : size - 1];
}

/**
 * Accepts only an already resolved catalog entry. The host provides a fresh
 * authorization lookup for each request and a confined ciphertext reader.
 * This function does not register a route or change export policy.
 */
export async function readPrivateMedia(
  entry: CommittedPrivateMedia,
  range: string | undefined,
  authorize: () => Promise<boolean>,
  loadCiphertext: () => Promise<{ ciphertext: Buffer; key: KeyObject }>,
): Promise<PrivateMediaResponse> {
  const hidden: PrivateMediaResponse = { status: 404, headers: { 'Cache-Control': 'no-store' } };
  let plaintext: Buffer | undefined;
  let initial: Buffer | undefined;
  let final: Buffer | undefined;
  try {
    if (!(await authorize())) return hidden;
    if (!Number.isSafeInteger(entry.size_bytes) || entry.size_bytes <= nonceBytes + tagBytes ||
        entry.size_bytes > maxSegmentBytes + nonceBytes + tagBytes) return hidden;
    const aad = artifactAad(entry);
    const { ciphertext, key } = await loadCiphertext();
    if (ciphertext.length !== entry.size_bytes || sha256(ciphertext) !== entry.stored_sha256) return hidden;
    const decipher = createDecipheriv('aes-256-gcm', key, ciphertext.subarray(0, nonceBytes));
    decipher.setAAD(aad);
    decipher.setAuthTag(ciphertext.subarray(-tagBytes));
    initial = decipher.update(ciphertext.subarray(nonceBytes, -tagBytes));
    final = decipher.final();
    plaintext = Buffer.concat([initial, final]);
    if (sha256(plaintext) !== entry.plaintext_sha256 || !(await authorize())) return hidden;

    const size = plaintext.length;
    const headers = {
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Accept-Ranges': 'bytes',
      'Content-Type': entry.mime_type,
    };
    if (!range) return { status: 200, headers: { ...headers, 'Content-Length': String(size) }, body: Buffer.from(plaintext) };
    const requested = resolveRange(range, size);
    if (!requested) return { status: 416, headers: { ...headers, 'Content-Range': `bytes */${size}` } };
    const [start, end] = requested;
    return {
      status: 206,
      headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(end - start + 1) },
      body: Buffer.from(plaintext.subarray(start, end + 1)),
    };
  } catch {
    return hidden;
  } finally {
    initial?.fill(0);
    final?.fill(0);
    plaintext?.fill(0);
  }
}
