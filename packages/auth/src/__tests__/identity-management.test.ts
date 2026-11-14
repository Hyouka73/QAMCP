import { deflateRawSync } from 'node:zlib';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  AuthManager,
  CredentialError,
  KeychainCredentialProvider,
  classifyEnvironmentPolicy,
  createProfile,
  findProfiles,
  importAccountInventory,
  inspectAccountInventoryFile,
  isPrivilegedProfile,
  isValidUsernameIdentifier,
  readProfile,
  readProfiles,
  selectProfile,
  updateProfile,
} from '../index.js';

const cleanup: Array<() => void> = [];
afterEach(() => {
  for (const fn of cleanup.splice(0).reverse()) fn();
  vi.restoreAllMocks();
});

function createTempProject(): string {
  const dir = mkdtempSync(join(tmpdir(), 'qap-identity-mgmt-'));
  cleanup.push(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/**
 * Helper to create a minimal valid XLSX (ZIP deflate) buffer in memory for testing.
 */
function buildMinimalXlsx(sheets: Record<string, string[][]>): Buffer {
  const sharedStrings: string[] = [];
  const sharedIndex = new Map<string, number>();
  const getSharedIndex = (val: string): number => {
    const existing = sharedIndex.get(val);
    if (existing !== undefined) return existing;
    const idx = sharedStrings.length;
    sharedStrings.push(val);
    sharedIndex.set(val, idx);
    return idx;
  };

  const sheetFiles: Array<{ name: string; content: Buffer }> = [];
  const sheetNames = Object.keys(sheets);
  sheetNames.forEach((sheetName, idx) => {
    const rows = sheets[sheetName]!;
    const rowXml = rows
      .map((row, rIdx) => {
        const cells = row
          .map((cell, cIdx) => {
            const colLetter = String.fromCharCode(65 + cIdx);
            const sIdx = getSharedIndex(cell);
            return `<c r="${colLetter}${rIdx + 1}" t="s"><v>${sIdx}</v></c>`;
          })
          .join('');
        return `<row r="${rIdx + 1}">${cells}</row>`;
      })
      .join('');
    const xml = `<?xml version="1.0" encoding="UTF-8"?><worksheet><sheetData>${rowXml}</sheetData></worksheet>`;
    sheetFiles.push({
      name: `xl/worksheets/sheet${idx + 1}.xml`,
      content: Buffer.from(xml, 'utf8'),
    });
  });

  const sstItems = sharedStrings.map((s) => `<si><t>${s}</t></si>`).join('');
  const sharedStringsXml = `<?xml version="1.0" encoding="UTF-8"?><sst count="${sharedStrings.length}" uniqueCount="${sharedStrings.length}">${sstItems}</sst>`;

  const entries: Array<{ name: string; data: Buffer; method: number }> = [
    {
      name: 'xl/sharedStrings.xml',
      data: deflateRawSync(Buffer.from(sharedStringsXml, 'utf8')),
      method: 8,
    },
    ...sheetFiles.map((s) => ({
      name: s.name,
      data: deflateRawSync(s.content),
      method: 8,
    })),
  ];

  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf8');
    const localHeader = Buffer.alloc(30 + nameBuf.length);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(entry.method, 8);
    localHeader.writeUInt32LE(entry.data.length, 18);
    localHeader.writeUInt32LE(entry.data.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    nameBuf.copy(localHeader, 30);

    localParts.push(localHeader, entry.data);

    const centralHeader = Buffer.alloc(46 + nameBuf.length);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(entry.method, 10);
    centralHeader.writeUInt32LE(entry.data.length, 20);
    centralHeader.writeUInt32LE(entry.data.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt32LE(offset, 42);
    nameBuf.copy(centralHeader, 46);
    centralParts.push(centralHeader);

    offset += localHeader.length + entry.data.length;
  }

  const centralDirSize = centralParts.reduce((acc, b) => acc + b.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDirSize, 12);
  eocd.writeUInt32LE(offset, 16);

  return Buffer.concat([...localParts, ...centralParts, eocd]);
}

describe('Gestión de identidades, perfiles multi-rol e inventarios QA (@qap/auth)', () => {
  it('acepta usernames que no son correos y rechaza identificadores vacíos o con caracteres de control', () => {
    expect(isValidUsernameIdentifier('operador_01')).toBe(true);
    expect(isValidUsernameIdentifier('EMP-4421')).toBe(true);
    expect(isValidUsernameIdentifier('promotor.norte')).toBe(true);
    expect(isValidUsernameIdentifier('CORP\\jdoe')).toBe(true);
    expect(isValidUsernameIdentifier('qa.user@lendus.dev')).toBe(true);

    expect(isValidUsernameIdentifier('')).toBe(false);
    expect(isValidUsernameIdentifier('   ')).toBe(false);
    expect(isValidUsernameIdentifier('bad\nuser')).toBe(false);
    expect(isValidUsernameIdentifier('bad\0user')).toBe(false);
  });

  it('permite múltiples perfiles con roles distintos en la misma aplicación y entorno sin sobrescribirlos y seleccionando por alias, usuario, rol o escenario', () => {
    const root = createTempProject();
    const appId = 'workspace-lendus-core';

    const adminProfile = createProfile(
      {
        id: 'lendus-admin-qa',
        application_id: appId,
        env: 'staging',
        username: 'admin_operaciones_01',
        role: 'Administrador',
        alias: 'admin-staging',
        aliases: ['mesa-control'],
        scenario: 'aprobacion-credito',
        scenarios: ['auditoria-cartera'],
        credential_source: 'keychain',
        login_mode: 'auto',
        login_origin: 'https://staging.lendus.dev',
        login_route: '/login',
        verification_route: '/clients',
      },
      { basePath: root },
    );

    const promotorProfile = createProfile(
      {
        id: 'lendus-promotor-qa',
        application_id: appId,
        env: 'staging',
        username: 'PROM-8821',
        role: 'Promotor / Asesor de crédito',
        alias: 'promotor-norte',
        scenario: 'originacion-solicitud',
        credential_source: 'keychain',
        login_mode: 'auto',
        login_origin: 'https://staging.lendus.dev',
        login_route: '/login',
        verification_route: '/solicitudes',
      },
      { basePath: root },
    );

    expect(adminProfile.username).toBe('admin_operaciones_01');
    expect(promotorProfile.username).toBe('PROM-8821');

    // No permite sobrescribir un perfil existente ni un alias duplicado en el mismo entorno
    expect(() =>
      createProfile(
        {
          id: 'lendus-admin-qa',
          application_id: appId,
          env: 'staging',
          username: 'otro_usuario',
          credential_source: 'keychain',
          login_mode: 'auto',
        },
        { basePath: root },
      ),
    ).toThrowError(expect.objectContaining({ code: 'PROFILE_ALREADY_EXISTS' }));

    expect(() =>
      createProfile(
        {
          id: 'lendus-otro',
          application_id: appId,
          env: 'staging',
          username: 'otro_usuario',
          alias: 'promotor-norte',
          credential_source: 'keychain',
          login_mode: 'auto',
        },
        { basePath: root },
      ),
    ).toThrowError(expect.objectContaining({ code: 'PROFILE_ALREADY_EXISTS' }));

    const allProfiles = readProfiles(root);
    expect(allProfiles).toHaveLength(2);

    // Selección por rol, alias, username y escenario
    expect(selectProfile({ env: 'staging', role: 'Promotor / Asesor de crédito' }, root).profile?.id).toBe(
      'lendus-promotor-qa',
    );
    expect(selectProfile({ env: 'staging', alias: 'mesa-control' }, root).profile?.id).toBe('lendus-admin-qa');
    expect(selectProfile({ env: 'staging', username: 'PROM-8821' }, root).profile?.id).toBe('lendus-promotor-qa');
    expect(selectProfile({ env: 'staging', scenario: 'originacion-solicitud' }, root).profile?.id).toBe(
      'lendus-promotor-qa',
    );
    expect(findProfiles({ application_id: appId, env: 'staging' }, root)).toHaveLength(2);
  });

  it('aísla credenciales entre cuentas del mismo proyecto, entorno y aplicación, y no reasocia contraseñas al cambiar el username', async () => {
    const root = createTempProject();
    const store = new Map<string, string>();
    vi.spyOn(KeychainCredentialProvider.prototype, 'get').mockImplementation(async (ref) => {
      const val = store.get(`${ref.service}::${ref.account}`);
      return val ? { password: val } : null;
    });
    vi.spyOn(KeychainCredentialProvider.prototype, 'set').mockImplementation(async (ref, secret) => {
      if (secret.password) store.set(`${ref.service}::${ref.account}`, secret.password);
    });
    vi.spyOn(KeychainCredentialProvider.prototype, 'delete').mockImplementation(async (ref) =>
      store.delete(`${ref.service}::${ref.account}`),
    );

    const appId = 'workspace-lendus-core';
    const p1 = createProfile(
      {
        id: 'lendus-qa',
        application_id: appId,
        env: 'local',
        username: 'qa.lendus@gmail.com',
        role: 'Administrador',
        credential_source: 'keychain',
        login_mode: 'auto',
        login_origin: 'https://staging.lendus.dev',
      },
      { basePath: root },
    );
    const p2 = createProfile(
      {
        id: 'lendus-asesor',
        application_id: appId,
        env: 'local',
        username: 'asesor_402',
        role: 'Promotor',
        credential_source: 'keychain',
        login_mode: 'auto',
        login_origin: 'https://staging.lendus.dev',
      },
      { basePath: root },
    );

    const manager = new AuthManager(root);
    try {
      await manager.setProfileSecret(p1, 'pass-antiguo-123');
      await manager.setProfileSecret(p2, 'pass-asesor-999');

      expect((await manager.getProfileCredentials(p1, true))?.password).toBe('pass-antiguo-123');
      expect((await manager.getProfileCredentials(p2, true))?.password).toBe('pass-asesor-999');

      // Actualizar el username de lendus-qa NO debe reasociar silenciosamente la contraseña anterior
      const { profile: updated, previousUsername, usernameChanged } = updateProfile(
        'lendus-qa',
        { username: 'operador.lendus.real' },
        { basePath: root, credentialHandlingOnUsernameChange: 'preserved' },
      );

      expect(usernameChanged).toBe(true);
      expect(previousUsername).toBe('qa.lendus@gmail.com');
      expect(updated.username).toBe('operador.lendus.real');
      expect(updated.verified).toBeUndefined();
      expect(updated.previous_accounts).toEqual([
        expect.objectContaining({
          username: 'qa.lendus@gmail.com',
          credential_handling: 'preserved',
        }),
      ]);

      // La nueva identidad no tiene credencial configurada hasta ser aprovisionada
      expect(await manager.getProfileCredentialStatus(updated, true)).toMatchObject({
        state: 'not_configured',
      });
      expect(await manager.getProfileCredentials(updated, true)).toBeNull();

      // La cuenta del otro rol sigue intacta y aislada
      expect((await manager.getProfileCredentials(p2, true))?.password).toBe('pass-asesor-999');
    } finally {
      manager.close();
    }
  });

  it('clasifica políticas diferenciadas por entorno y bloquea cambios no autorizados en perfiles privilegiados', () => {
    const root = createTempProject();
    expect(classifyEnvironmentPolicy('local')).toBe('agile_qa');
    expect(classifyEnvironmentPolicy('staging')).toBe('agile_qa');
    expect(classifyEnvironmentPolicy('fixture')).toBe('agile_qa');
    expect(classifyEnvironmentPolicy('prod')).toBe('sensitive');
    expect(classifyEnvironmentPolicy('production')).toBe('sensitive');
    expect(classifyEnvironmentPolicy('staging', true)).toBe('sensitive');

    expect(isPrivilegedProfile({ id: 'lendus-qa', env: 'local', role: 'Administrador' })).toBe(false);
    expect(isPrivilegedProfile({ id: 'admin-user', env: 'local', role: 'operador' })).toBe(true);
    expect(isPrivilegedProfile({ id: 'qa-1', env: 'local', role: 'superadmin' })).toBe(true);
    expect(isPrivilegedProfile({ id: 'qa-1', env: 'prod', role: 'operador' })).toBe(true);
    expect(isPrivilegedProfile({ id: 'qa-1', env: 'local', privileged: true })).toBe(true);

    expect(() =>
      createProfile(
        {
          id: 'admin-user',
          env: 'local',
          username: 'root_op',
          credential_source: 'keychain',
          login_mode: 'auto',
        },
        { basePath: root, allowPrivileged: false },
      ),
    ).toThrowError(expect.objectContaining({ code: 'PRIVILEGED_PROFILE_RESTRICTED' }));
  });

  it('importa inventarios locales QA en formatos CSV, JSON y XLSX con autorización del operador, mapeo de columnas, deduplicación y almacenamiento seguro local de contraseñas', async () => {
    const root = createTempProject();
    const filesDir = join(root, 'inventories');
    mkdirSync(filesDir, { recursive: true });

    const store = new Map<string, string>();
    vi.spyOn(KeychainCredentialProvider.prototype, 'get').mockImplementation(async (ref) => {
      const val = store.get(`${ref.service}::${ref.account}`);
      return val ? { password: val } : null;
    });
    vi.spyOn(KeychainCredentialProvider.prototype, 'set').mockImplementation(async (ref, secret) => {
      if (secret.password) store.set(`${ref.service}::${ref.account}`, secret.password);
    });

    const csvPath = join(filesDir, 'cuentas.csv');
    writeFileSync(
      csvPath,
      [
        'perfil,usuario,rol,entorno,escenario,alias,password',
        'lendus-promotor-1,PROM_001,Promotor,staging,originacion,promotor-1,SecretPromotor#1',
        'lendus-analista-1,ANA_002,Analista de Riesgo,staging,evaluacion,analista-1,SecretAnalista#2',
        // Duplicado del primero
        'lendus-promotor-1,PROM_001,Promotor,staging,originacion,promotor-1,SecretPromotor#1',
      ].join('\n'),
      'utf8',
    );

    // 1. Rechaza explorar o importar sin autorización explícita del operador
    expect(() => inspectAccountInventoryFile(csvPath, false)).toThrowError(CredentialError);
    await expect(
      importAccountInventory({
        filePath: csvPath,
        projectRoot: root,
        operatorAuthorized: false,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });

    // 2. Inspecciona columnas sin exponer contraseñas
    const inspection = inspectAccountInventoryFile(csvPath, true);
    expect(inspection.format).toBe('csv');
    expect(inspection.hasPasswordColumn).toBe(true);
    expect(inspection.suggestedMapping).toMatchObject({
      id: 'perfil',
      username: 'usuario',
      role: 'rol',
      env: 'entorno',
      scenario: 'escenario',
      alias: 'alias',
      password: 'password',
    });

    // 3. Importa CSV e inyecta contraseñas únicamente en el proveedor local seguro
    const csvResult = await importAccountInventory({
      filePath: csvPath,
      projectRoot: root,
      operatorAuthorized: true,
      defaults: {
        application_id: 'app-lendus',
        login_origin: 'https://staging.lendus.dev',
      },
      importPasswordsLocally: true,
    });

    expect(csvResult.imported).toHaveLength(2);
    expect(csvResult.skippedDuplicates).toHaveLength(1);
    expect(csvResult.imported.every((item) => item.credential_imported)).toBe(true);
    expect(JSON.stringify(csvResult)).not.toContain('SecretPromotor#1');
    expect(JSON.stringify(csvResult)).not.toContain('SecretAnalista#2');

    // 4. Importa JSON con mapeo personalizado
    const jsonPath = join(filesDir, 'cuentas.json');
    writeFileSync(
      jsonPath,
      JSON.stringify([
        {
          cuenta_id: 'lendus-auditor-1',
          identificador: 'AUD-900',
          puesto: 'Auditor Interno',
          ambiente: 'staging',
          flujo: 'revision-expediente',
        },
      ]),
      'utf8',
    );

    const jsonResult = await importAccountInventory({
      filePath: jsonPath,
      projectRoot: root,
      operatorAuthorized: true,
      defaults: {
        application_id: 'app-lendus',
        login_origin: 'https://staging.lendus.dev',
      },
      columnMapping: {
        id: 'cuenta_id',
        username: 'identificador',
        role: 'puesto',
        env: 'ambiente',
        scenario: 'flujo',
      },
    });
    expect(jsonResult.imported).toHaveLength(1);
    expect(jsonResult.imported[0]).toMatchObject({
      id: 'lendus-auditor-1',
      username: 'AUD-900',
      role: 'Auditor Interno',
      env: 'staging',
      scenario: 'revision-expediente',
    });

    // 5. Importa XLSX
    const xlsxPath = join(filesDir, 'cuentas.xlsx');
    const xlsxBuffer = buildMinimalXlsx({
      CuentasQA: [
        ['profile', 'username', 'role', 'env', 'scenario'],
        ['lendus-caja-1', 'CAJA_501', 'Cajero', 'staging', 'dispersion'],
      ],
    });
    writeFileSync(xlsxPath, xlsxBuffer);

    const xlsxResult = await importAccountInventory({
      filePath: xlsxPath,
      projectRoot: root,
      operatorAuthorized: true,
      defaults: {
        application_id: 'app-lendus',
        login_origin: 'https://staging.lendus.dev',
      },
    });
    expect(xlsxResult.format).toBe('xlsx');
    expect(xlsxResult.imported).toHaveLength(1);
    expect(xlsxResult.imported[0]).toMatchObject({
      id: 'lendus-caja-1',
      username: 'CAJA_501',
      role: 'Cajero',
    });

    const pPromotor = await readProfile('lendus-promotor-1', root);
    const manager = new AuthManager(root);
    try {
      expect((await manager.getProfileCredentials(pPromotor!, true))?.password).toBe('SecretPromotor#1');
    } finally {
      manager.close();
    }
  });
});
