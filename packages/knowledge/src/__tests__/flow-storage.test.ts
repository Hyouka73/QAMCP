import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { FlowDefinition } from '@qap/shared';

import { FileSystemStorage } from '../storage/file-storage.js';

describe('S8-001: getFlow y saveFlow validan con AJV', () => {
  let root: string;
  let storage: FileSystemStorage;
  const valid = { _version: '1.0', name: 'f1', modules: [{ module: 'a' }] };

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'qap-flow-storage-'));
    storage = new FileSystemStorage({ rootDir: root });
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('guarda y lee un flujo válido', async () => {
    await storage.saveFlow('f1', valid);
    expect((await storage.getFlow('f1')).name).toBe('f1');
  });

  it('saveFlow rechaza un flujo inválido y no escribe el archivo', async () => {
    const bad = { name: 'f1' } as unknown as FlowDefinition;
    await expect(storage.saveFlow('f1', bad)).rejects.toThrow(/inválido/);
    expect(fs.existsSync(path.join(root, '.qa', 'flows', 'f1.yaml'))).toBe(false);
  });

  it('getFlow rechaza un YAML corrupto en disco', async () => {
    fs.mkdirSync(path.join(root, '.qa', 'flows'), { recursive: true });
    fs.writeFileSync(path.join(root, '.qa', 'flows', 'f1.yaml'), 'modules: 123\n');
    await expect(storage.getFlow('f1')).rejects.toThrow(/inválido/);
  });
});