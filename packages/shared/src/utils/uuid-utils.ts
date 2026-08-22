/**
 * UUID Generation Utilities
 * 
 * Pure functions for generating and validating UUIDs.
 * Uses crypto.randomUUID() when available (Node.js 14.17+, modern browsers),
 * with a fallback implementation for older environments.
 */

/**
 * Generates a RFC 4122 compliant UUID (v4)
 * @returns A UUID string in the format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
export function generateUUID(): string {
  // Use native crypto.randomUUID if available (Node.js 14.17+, modern browsers)
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  
  // Fallback implementation for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const randomValue = Math.random() * 16 | 0;
    const value = char === 'x' ? randomValue : (randomValue & 0x3 | 0x8);
    return value.toString(16);
  });
}

/**
 * Validates if a string is a valid UUID format
 * @param uuid - The string to validate
 * @returns true if the string is a valid UUID format, false otherwise
 */
export function isValidUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }
  
  // RFC 4122 UUID regex pattern
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
