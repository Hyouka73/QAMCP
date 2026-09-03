/**
 * Archivo generado automaticamente a partir de semantic-hash.schema.json
 * No editar manualmente este archivo.
 */

/**
 * Schema for semantic-hash.json - stores hash, timestamp, and source information. This is a derived/regenerable file, so it omits _version.
 */
export interface SemanticHash {
  /**
   * The semantic hash value
   */
  hash: string;
  /**
   * ISO 8601 timestamp when the hash was computed
   */
  timestamp: string;
  /**
   * List of files or sources that were used to compute this hash
   */
  computed_from: string[];
  /**
   * Hash algorithm used (e.g., sha256, md5)
   */
  algorithm?: string;
}
