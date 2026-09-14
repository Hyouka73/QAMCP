import { createHash } from "node:crypto";

import type { Selectors, SemanticHash } from "@qap/shared";


/**
 * Normaliza un objecto de forma recursiva ordenando sus claves alfabeticamente,
 * para garantizar que la serializacion JSON sea determinista sin importar
 * el orden en que las propiedades fueron definidas originalmente.
 */

function normalizeForHashing(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(normalizeForHashing);
    }

    if (value !== null && typeof value == 'object'){
        const sortedKeys = Object.keys(value).sort();
        const normalized: Record<string, unknown>= {};
        for (const key of sortedKeys) {
            normalized[key] = normalizeForHashing((value as Record<string, unknown>)[key]);
        }
        return normalized;
    }
     return value;
}

export interface SemanticHashInput {
    /** Rutas relevantes del modulo (routes) que forman parte de su estructura. */
    routes?: string[];
    /** Mapa de selectores -> seleector CSS, tal como vive en selectors.json */
   selectors?: Selectors['selectors'];
}

/**
 * Calcula un hash SHA-256 determinista sobre selectores y rutas de un modulo.
 * El mismo conjunto de datos (sin impoprtar el orden de las claves o el
 * orden de las rutas) siempre produce el mismo hash, lo que permite 
 * detectar cambios estructuras reales sin diffs manuales.
 */
export class SemanticHasher {
    /**
     * Calcula el has semnatico determinista para un input dado.
     */
    computeHash(input: SemanticHashInput): string {
        const normalizedRoutes = [...(input.routes ?? [])].sort();
    const normalizedSelectors = normalizeForHashing(input.selectors ?? {});

    const canonicalPayload = JSON.stringify({
        routes: normalizedRoutes,
        selectors: normalizedSelectors,
    });

    return createHash('sha256').update(canonicalPayload, 'utf-8').digest('hex');
    }
     /**
   * Genera el objeto SemanticHash completo (hash + metadata) listo
   * para persistirse en semantic-hash.json via IStorage.
   */
  generate(input: SemanticHashInput, computedFrom: string[] = []): SemanticHash {
    return {
      hash: this.computeHash(input),
      timestamp: new Date().toISOString(),
      computed_from: computedFrom,
      algorithm: 'sha256',
    };
  }
  /**
   * Compra un input actual contra un hash previamente guardado.
   *para detectar si hubo combios estructurales reales del mundo.
   */
  hasChanged(input: SemanticHashInput, previousHash: SemanticHash | null): boolean {
    if (!previousHash) return true;
    return this.computeHash(input) !== previousHash.hash;
  }
}