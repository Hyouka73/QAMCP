/**
 * Semantic Hash Record Type
 * 
 * Corresponds to semantic-hash.schema.json
 * Schema for semantic-hash.json - stores hash, timestamp, and source information.
 * This is a derived/regenerable file, so it omits _version.
 */
export interface SemanticHash {
  hash: string;
  timestamp: string; // ISO 8601 date-time format
  computed_from: string[];
  algorithm?: string;
}
