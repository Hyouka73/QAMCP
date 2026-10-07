/**
 * QAP Shared Utilities
 * 
 * Pure utility functions for common operations.
 * This module contains only pure functions with no side effects.
 */

// Date formatting utilities
export { formatDate, formatDateTime, parseISODate } from './date-utils.js';

// UUID generation utilities
export { generateUUID, isValidUUID } from './uuid-utils.js';

// Path normalization utilities
export { normalizePath, toPosixPath, normalizeToPosix, ensureRelativePath } from './path-utils.js';

// Role validation utilities (C9)
export {
  isValidRoleName,
  filterValidRoles,
  ROLE_TABLE_CHARS_PATTERN,
  ROLE_TABLE_EDGE_PATTERN,
} from './role-validation.js';

// Slug normalization utilities (C3)
export { normalizeSlug } from './slug-utils.js';

