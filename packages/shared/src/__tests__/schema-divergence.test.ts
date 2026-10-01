import { readdirSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, it, expect } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

const SCHEMAS_ROOT_DIR = resolve(__dirname, '../../schemas');
const SCHEMAS_SRC_DIR = resolve(__dirname, '../schemas');

describe('E0e: Guarda contra divergencia de schemas', () => {
  const rootSchemaFiles = readdirSync(SCHEMAS_ROOT_DIR).filter((f) => f.endsWith('.json')).sort();
  const srcSchemaFiles = readdirSync(SCHEMAS_SRC_DIR).filter((f) => f.endsWith('.json')).sort();

  it('debe existir el mismo conjunto de schemas en packages/shared/schemas y packages/shared/src/schemas', () => {
    expect(rootSchemaFiles.length).toBeGreaterThanOrEqual(22);
    expect(rootSchemaFiles).toEqual(srcSchemaFiles);
  });

  for (const schemaFile of rootSchemaFiles) {
    it(`schema ${schemaFile} debe ser idéntico byte a byte en ambos directorios`, () => {
      const rootBuf = readFileSync(join(SCHEMAS_ROOT_DIR, schemaFile));
      const srcBuf = readFileSync(join(SCHEMAS_SRC_DIR, schemaFile));

      expect(Buffer.compare(rootBuf, srcBuf)).toBe(0);
    });
  }
});
