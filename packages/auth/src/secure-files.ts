import { constants, closeSync, existsSync, fstatSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, parse, relative, resolve, sep } from 'node:path';
import { randomBytes } from 'node:crypto';

import { CredentialError } from './credential-provider.js';

/** Local trusted-user boundary. Reparse points/symlinks are never followed intentionally. */
export function safeDirectory(path: string, create = false): string {
  const absolute = resolve(path);
  let current = parse(absolute).root;
  for (const part of absolute.slice(current.length).split(sep).filter(Boolean)) {
    current = join(current, part);
    if (!existsSync(current)) {
      // lstat also detects dangling symlinks (existsSync follows them).
      try { lstatSync(current); throw new CredentialError('UNSAFE_PATH'); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
      if (!create) throw new CredentialError('UNSAFE_PATH');
      mkdirSync(current, { mode: 0o700 });
    }
    const stat = lstatSync(current);
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new CredentialError('UNSAFE_PATH');
  }
  if (process.platform !== 'win32' && (lstatSync(absolute).mode & 0o022) !== 0) throw new CredentialError('UNSAFE_PATH');
  return absolute;
}

export function containedPath(root: string, path: string): string {
  const target = resolve(root, path);
  const rel = relative(resolve(root), target);
  if (rel.split(/[\\/]/).some((part) => (part.includes(':') || part.includes(String.fromCharCode(0))) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part) || /[. ]$/.test(part))) {
    throw new CredentialError('UNSAFE_PATH');
  }
  if (!rel || rel.startsWith(`..${sep}`) || rel === '..' || resolve(target) === parse(target).root || /^[A-Za-z]:/.test(rel)) {
    throw new CredentialError('UNSAFE_PATH');
  }
  return target;
}

function checkFile(path: string): void {
  const stat = lstatSync(path);
  if (stat.isSymbolicLink() || !stat.isFile() || stat.nlink !== 1 ||
      (process.platform !== 'win32' && (stat.mode & 0o077) !== 0)) throw new CredentialError('UNSAFE_PATH');
  if (stat.size > 4 * 1024 * 1024) throw new CredentialError('INVALID_VAULT');
}

export function readPrivateFile(path: string): string | null {
  safeDirectory(dirname(path));
  try { checkFile(path); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null; throw error; }
  const fd = openSync(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.nlink !== 1 || stat.size > 4 * 1024 * 1024) throw new CredentialError('UNSAFE_PATH');
    return readFileSync(fd, 'utf8');
  } finally { closeSync(fd); }
}

/** Exclusive lock is fail-fast; stale locks need an operator, never automatic stealing. */
export function withFileLock<T>(path: string, operation: () => T): T {
  safeDirectory(dirname(path), true);
  const lock = `${path}.lock`;
  let fd: number;
  try { fd = openSync(lock, 'wx', 0o600); }
  catch (error) { throw new CredentialError((error as NodeJS.ErrnoException).code === 'EEXIST' ? 'BUSY' : 'IO_ERROR'); }
  try { return operation(); }
  finally { closeSync(fd); unlinkSync(lock); }
}

export function atomicPrivateWrite(path: string, data: string): void {
  if (Buffer.byteLength(data, 'utf8') > 4 * 1024 * 1024) throw new CredentialError('INVALID_INPUT');
  safeDirectory(dirname(path), true);
  try { checkFile(path); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  const temporary = `${path}.${randomBytes(16).toString('hex')}.tmp`;
  const fd = openSync(temporary, 'wx', 0o600);
  try {
    writeFileSync(fd, data, 'utf8');
    fsyncSync(fd);
  } catch {
    closeSync(fd);
    unlinkSync(temporary);
    throw new CredentialError('IO_ERROR');
  }
  closeSync(fd);
  try { renameSync(temporary, path); }
  catch { unlinkSync(temporary); throw new CredentialError('IO_ERROR'); }
  // Directory fsync is not supported on Windows. The rename is atomic on local filesystems.
  if (process.platform !== 'win32') {
    const directory = openSync(dirname(path), 'r');
    try { fsyncSync(directory); } finally { closeSync(directory); }
  }
}

export function safeProfileId(id: string): void {
  if (typeof id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(id)) throw new CredentialError('INVALID_INPUT');
}
