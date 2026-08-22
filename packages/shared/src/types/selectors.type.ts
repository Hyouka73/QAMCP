/**
 * Module Selectors Map Type
 * 
 * Corresponds to selectors.schema.json
 * Schema for selectors.json of a module - maps logical names to CSS selectors.
 * This is a derived/regenerable file, so it omits _version.
 */
export interface Selectors {
  selectors?: Record<string, string>;
  metadata?: SelectorsMetadata;
}

export interface SelectorsMetadata {
  generated_at?: string; // ISO 8601 date-time format
  source?: string;
}
