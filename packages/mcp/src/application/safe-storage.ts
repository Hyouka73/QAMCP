import { createHash, randomBytes } from 'node:crypto';
import {
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, parse, relative, resolve, sep } from 'node:path';

export class UnsafeStoragePathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsafeStoragePathError';
  }
}

export function normalizePathKey(candidate: string): string {
  const resolved = resolve(candidate);
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}

export function hashCanonicalRoot(canonicalRoot: string): string {
  return createHash('sha256').update(normalizePathKey(canonicalRoot)).digest('hex');
}

/**
 * Verifies every existing ancestor segment of a target path has no symlinks,
 * junctions, reparse points, Windows reserved device names, or multi-hardlinks.
 */
export function assertSafeHostPath(candidatePath: string): string {
  if (!candidatePath || typeof candidatePath !== 'string') {
    throw new UnsafeStoragePathError('Empty or invalid storage path');
  }
  const absolute = resolve(candidatePath);
  const parsedRoot = parse(absolute).root;
  let current = parsedRoot;
  const tail = absolute.slice(parsedRoot.length).split(/[\\/]/).filter(Boolean);
  for (const segment of tail) {
    if (
      segment === '.' ||
      segment === '..' ||
      segment.includes(':') ||
      segment.includes('\0') ||
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(segment) ||
      /[. ]$/.test(segment)
    ) {
      throw new UnsafeStoragePathError('Invalid path segment');
    }
    current = join(current, segment);
    if (!existsSync(current)) {
      try {
        lstatSync(current);
        throw new UnsafeStoragePathError('Dangling symbolic link rejected');
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
        continue;
      }
    }
    const stat = lstatSync(current);
    if (stat.isSymbolicLink()) {
      throw new UnsafeStoragePathError('Symbolic link rejected');
    }
    if (normalizePathKey(realpathSync(current)) !== normalizePathKey(current)) {
      throw new UnsafeStoragePathError('Reparse point or junction rejected');
    }
    if (stat.isFile() && stat.nlink !== 1) {
      throw new UnsafeStoragePathError('Multi-hardlink file rejected');
    }
  }
  return absolute;
}

export function isPathWithin(parentDir: string, candidatePath: string): boolean {
  const parentNorm = normalizePathKey(parentDir).replace(/[/\\]+$/, '');
  const childNorm = normalizePathKey(candidatePath);
  if (childNorm === parentNorm) return true;
  const prefix = parentNorm.endsWith(sep) ? parentNorm : parentNorm + sep;
  return childNorm.startsWith(prefix);
}

export function assertDisjointFromWorkspace(hostDir: string, workspaceRoot: string): void {
  if (isPathWithin(workspaceRoot, hostDir) || isPathWithin(hostDir, workspaceRoot)) {
    throw new UnsafeStoragePathError('Host storage overlaps workspace directory');
  }
}

export function ensurePrivateDir(dirPath: string): string {
  const safe = assertSafeHostPath(dirPath);
  const parsedRoot = parse(safe).root;
  let current = parsedRoot;
  for (const segment of safe.slice(parsedRoot.length).split(/[\\/]/).filter(Boolean)) {
    current = join(current, segment);
    if (!existsSync(current)) {
      mkdirSync(current, { mode: 0o700 });
    }
    const stat = lstatSync(current);
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new UnsafeStoragePathError('Unsafe storage directory');
    }
  }
  return safe;
}

export function resolveContainedPath(rootDir: string, relativePath: string): string {
  const safeRoot = assertSafeHostPath(rootDir);
  const target = resolve(safeRoot, relativePath);
  const rel = relative(safeRoot, target);
  if (!rel || rel === '..' || rel.startsWith(`..${sep}`) || /^[A-Za-z]:/.test(rel)) {
    throw new UnsafeStoragePathError('Path escapes owned boundary');
  }
  return assertSafeHostPath(target);
}

export function atomicWritePrivateFile(filePath: string, content: string | Buffer): void {
  const safePath = assertSafeHostPath(filePath);
  ensurePrivateDir(dirname(safePath));
  const tempPath = `${safePath}.${randomBytes(12).toString('hex')}.tmp`;
  const fd = openSync(tempPath, 'wx', 0o600);
  try {
    writeFileSync(fd, content);
    fsyncSync(fd);
  } catch (err) {
    closeSync(fd);
    if (existsSync(tempPath)) unlinkSync(tempPath);
    throw err;
  }
  closeSync(fd);
  try {
    renameSync(tempPath, safePath);
  } catch (err) {
    if (existsSync(tempPath)) unlinkSync(tempPath);
    throw err;
  }
}

/**
 * Recursively collects regular files inside a safe directory without following links.
 */
export function listSafeFiles(dirPath: string): string[] {
  const safeDir = assertSafeHostPath(dirPath);
  if (!existsSync(safeDir)) return [];
  const results: string[] = [];
  for (const entry of readdirSync(safeDir, { withFileTypes: true })) {
    const full = join(safeDir, entry.name);
    if (entry.isSymbolicLink()) continue;
    assertSafeHostPath(full);
    if (entry.isDirectory()) {
      results.push(...listSafeFiles(full));
    } else if (entry.isFile()) {
      results.push(full);
    }
  }
  return results.sort();
}

export function safeDeleteOwnedPath(ownedPath: string, ownerBoundaryDir: string): boolean {
  const safeBoundary = assertSafeHostPath(ownerBoundaryDir);
  const safeTarget = assertSafeHostPath(ownedPath);
  if (normalizePathKey(safeTarget) === normalizePathKey(safeBoundary) || !isPathWithin(safeBoundary, safeTarget)) {
    throw new UnsafeStoragePathError('Refusing deletion outside owner boundary');
  }
  if (!existsSync(safeTarget)) return false;
  // Walk before rmSync so no nested link is traversed during cleanup.
  const stat = lstatSync(safeTarget);
  if (stat.isDirectory()) {
    for (const entry of readdirSync(safeTarget, { withFileTypes: true })) {
      const child = join(safeTarget, entry.name);
      if (entry.isSymbolicLink()) {
        unlinkSync(child);
      } else {
        safeDeleteOwnedPath(child, safeBoundary);
      }
    }
  }
  rmSync(safeTarget, { recursive: true, force: true });
  return true;
}

export function sha256File(filePath: string): string {
  return createHash('sha256').update(readFileSync(assertSafeHostPath(filePath))).digest('hex');
}
