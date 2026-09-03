/**
 * Archivo generado automaticamente a partir de selectors.schema.json
 * No editar manualmente este archivo.
 */

/**
 * Schema for selectors.json of a module - maps logical names to CSS selectors. This is a derived/regenerable file, so it omits _version.
 */
export interface Selectors {
  /**
   * Map of logical selector names to CSS selector strings
   */
  selectors: {
    [k: string]: string;
  };
  /**
   * Optional metadata about the selectors
   */
  metadata?: {
    /**
     * Timestamp when selectors were generated
     */
    generated_at?: string;
    /**
     * Source of the selectors (e.g., auto-extracted, manual)
     */
    source?: string;
  };
}

export type SelectorsMetadata = Selectors['metadata'];
