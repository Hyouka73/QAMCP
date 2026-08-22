/**
 * Date Formatting Utilities
 * 
 * Pure functions for formatting and parsing dates.
 */

/**
 * Formats a date to ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
 * @param date - The date to format
 * @returns ISO 8601 formatted string
 */
export function formatDate(date: Date): string {
  return date.toISOString();
}

/**
 * Formats a date to a human-readable date-time string
 * @param date - The date to format
 * @param options - Optional formatting options
 * @returns Formatted date-time string
 */
export function formatDateTime(
  date: Date,
  options?: { 
    timeZone?: string;
    hour12?: boolean;
  }
): string {
  const { timeZone = 'UTC', hour12 = false } = options ?? {};
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12,
    timeZone,
  }).format(date);
}

/**
 * Parses an ISO 8601 date string safely
 * @param isoString - The ISO 8601 date string to parse
 * @returns The parsed Date object, or null if invalid
 */
export function parseISODate(isoString: string): Date | null {
  if (!isoString || typeof isoString !== 'string') {
    return null;
  }
  
  const date = new Date(isoString);
  
  // Check if the date is valid
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  
  return date;
}
