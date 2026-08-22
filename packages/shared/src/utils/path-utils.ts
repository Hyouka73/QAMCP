/**
 * Path Normalization Utilities
 * 
 * Pure functions for normalizing file paths across platforms.
 * Uses POSIX separators (/) by default for Git compatibility.
 */

import * as path from 'path';

/**
 * Normalizes a path using the OS-specific separator, then converts to POSIX format
 * @param inputPath - The path to normalize
 * @returns A normalized path with POSIX separators (/)
 */
export function normalizePath(inputPath: string): string {
  if (!inputPath || typeof inputPath !== 'string') {
    return '';
  }
  
  // Use Node.js path.normalize to handle . and .. segments
  const normalized = path.normalize(inputPath);
  
  // Convert to POSIX separators (forward slashes) for Git compatibility
  return toPosixPath(normalized);
}

/**
 * Converts any path to use POSIX separators (forward slashes)
 * @param inputPath - The path to convert
 * @returns A path with only forward slashes
 */
export function toPosixPath(inputPath: string): string {
  if (!inputPath || typeof inputPath !== 'string') {
    return '';
  }
  
  // Replace all backslashes with forward slashes
  return inputPath.replace(/\\/g, '/');
}

/**
 * Ensures a path is relative (doesn't start with / or drive letter)
 * Useful for storing paths in version control that should be portable
 * @param inputPath - The path to make relative
 * @returns A relative path without leading slash or drive letter
 */
export function ensureRelativePath(inputPath: string): string {
  if (!inputPath || typeof inputPath !== 'string') {
    return '';
  }
  
  let result = normalizePath(inputPath);
  
  // Remove leading slash for absolute Unix paths
  if (result.startsWith('/')) {
    result = result.slice(1);
  }
  
  // Remove Windows drive letter (e.g., C:/)
  const driveLetterMatch = result.match(/^[A-Za-z]:\//);
  if (driveLetterMatch) {
    result = result.slice(driveLetterMatch[0].length);
  }
  
  return result;
}
