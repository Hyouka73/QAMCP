import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, it, expect, afterEach } from 'vitest';

import { UpdateGuard, isProtected } from '../plan/update-guard.js';

describe('Suite S6-003: UpdateGuard - Salvaguarda manually_edited', () => {
  const tempFilePath = join(tmpdir(), `test-case-${Date.now()}.yaml`);

  afterEach(() => {
    if (existsSync(tempFilePath)) {
      unlinkSync(tempFilePath);
    }
  });

  it('debe detectar que un contenido YAML con manually_edited: true está protegido', () => {
    const yamlContent = `
_version: "1"
id: "98ac8389-2b0b-46f7-a138-5f6673bac1a6"
name: "login-manual"
manually_edited: true
steps: []
`;
    expect(UpdateGuard.isProtectedContent(yamlContent)).toBe(true);
    expect(UpdateGuard.canUpdate(yamlContent)).toBe(false);
  });

  it('debe permitir sobreescribir YAML que NO contiene manually_edited o donde es false', () => {
    const yamlUnprotected = `
_version: "1"
id: "98ac8389-2b0b-46f7-a138-5f6673bac1a6"
name: "login-auto"
manually_edited: false
steps: []
`;
    expect(UpdateGuard.isProtectedContent(yamlUnprotected)).toBe(false);
    expect(UpdateGuard.canUpdate(yamlUnprotected)).toBe(true);
  });

  it('debe detectar la protección desde un objeto JavaScript', () => {
    const protectedObj = { id: 'tc-001', manually_edited: true };
    const normalObj = { id: 'tc-002', manually_edited: false };

    expect(UpdateGuard.isProtectedObject(protectedObj)).toBe(true);
    expect(UpdateGuard.isProtectedObject(normalObj)).toBe(false);
  });

  it('debe verificar la protección leyendo directamente un archivo YAML en el sistema de archivos', async () => {
    const yamlContent = `
_version: "1"
id: "tc-file-01"
name: "caso-editado-a-mano"
manually_edited: true
`;
    writeFileSync(tempFilePath, yamlContent, 'utf-8');

    const isProtectedFile = await UpdateGuard.isFileProtected(tempFilePath);
    expect(isProtectedFile).toBe(true);
    expect(UpdateGuard.canUpdate(tempFilePath)).toBe(false);
  });

  it('debe validar con la función auxiliar isProtected', () => {
    expect(isProtected({ manually_edited: true })).toBe(true);
    expect(isProtected('manually_edited: true\nname: test')).toBe(true);
  });
});