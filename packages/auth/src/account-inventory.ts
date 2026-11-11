import { lstatSync, readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { inflateRawSync } from 'node:zlib';

import type { AuthProfile } from '@qap/shared';

import { AuthManager } from './auth-manager.js';
import { CredentialError } from './credential-provider.js';
import { createProfile, isPrivilegedProfile, isValidUsernameIdentifier, readProfiles } from './profiles-store.js';

export interface InventoryColumnMapping {
  id?: string;
  username?: string;
  role?: string;
  env?: string;
  scenario?: string;
  alias?: string;
  application_id?: string;
  login_origin?: string;
  login_route?: string;
  verification_route?: string;
  password?: string;
}

export interface DetectedInventoryColumns {
  headers: string[];
  suggestedMapping: InventoryColumnMapping;
  hasPasswordColumn: boolean;
  rowCount: number;
}

export interface AccountInventoryImportOptions {
  /** Ruta explícitamente seleccionada y autorizada por el operador local. */
  filePath: string;
  /** Confirmación explícita del operador local para leer el archivo. */
  operatorAuthorized: boolean;
  /** Directorio raíz del proyecto QA destino. */
  projectRoot?: string;
  /** Mapeo personalizado de columnas si difiere del detectado automáticamente. */
  columnMapping?: InventoryColumnMapping;
  /** Valores por defecto de metadatos para completar perfiles del inventario. */
  defaults?: {
    env?: string;
    application_id?: string;
    login_origin?: string;
    login_route?: string;
    verification_route?: string;
    credential_source?: 'keychain' | 'vault' | 'ephemeral';
    login_mode?: 'auto' | 'handoff';
    post_login_condition?: AuthProfile['post_login_condition'];
    form_selectors?: AuthProfile['form_selectors'];
  };
  /**
   * Autorización explícita para importar contraseñas presentes en el archivo hacia el proveedor seguro local.
   * Nunca expone las contraseñas en el resultado ni al agente.
   */
  importPasswordsLocally?: boolean;
  /** Permite crear perfiles privilegiados si el operador local lo autorizó. */
  allowPrivileged?: boolean;
  /** Instancia opcional de AuthManager para el flujo local seguro de secretos. */
  authManager?: AuthManager;
}

export interface ImportedProfileSummary {
  id: string;
  username: string;
  env: string;
  role?: string;
  scenario?: string;
  alias?: string;
  application_id?: string;
  credential_imported: boolean;
}

export interface AccountInventoryImportResult {
  format: 'csv' | 'json' | 'xlsx';
  detectedColumns: Omit<DetectedInventoryColumns, 'suggestedMapping'> & {
    mappingUsed: Omit<InventoryColumnMapping, 'password'>;
  };
  imported: ImportedProfileSummary[];
  skippedDuplicates: Array<{ row: number; reason: string; id?: string; username?: string }>;
  skippedInvalid: Array<{ row: number; reason: string }>;
}

const COLUMN_PATTERNS: Record<keyof InventoryColumnMapping, RegExp> = {
  id: /^(id|profile|profile_id|perfil|id_perfil)$/i,
  username: /^(username|user|usuario|login|account|cuenta|identificador|identifier|email|correo)$/i,
  role: /^(role|rol|perfil_rol|user_role|cargo|puesto)$/i,
  env: /^(env|environment|entorno|ambiente|stage)$/i,
  scenario: /^(scenario|escenario|caso|flujo|test_case)$/i,
  alias: /^(alias|apodo|etiqueta|label|short_name)$/i,
  application_id: /^(application_id|app_id|application|app|aplicacion)$/i,
  login_origin: /^(login_origin|origin|origen|base_url|url)$/i,
  login_route: /^(login_route|ruta_login|login_path)$/i,
  verification_route: /^(verification_route|ruta_verificacion|verify_path)$/i,
  password: /^(password|pass|pwd|contrasena|contraseña|clave|secret|secreto)$/i,
};

function sanitizeSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

/**
 * Detecta las columnas de usuario, rol, entorno, escenario y contraseña a partir de los encabezados.
 */
export function detectInventoryColumns(headers: string[], rowCount = 0): DetectedInventoryColumns {
  const suggestedMapping: InventoryColumnMapping = {};
  for (const header of headers) {
    const clean = header.trim();
    for (const [field, regex] of Object.entries(COLUMN_PATTERNS) as Array<[keyof InventoryColumnMapping, RegExp]>) {
      if (!suggestedMapping[field] && regex.test(clean)) {
        suggestedMapping[field] = header;
      }
    }
  }
  return {
    headers,
    suggestedMapping,
    hasPasswordColumn: Boolean(suggestedMapping.password),
    rowCount,
  };
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function parseCsvRecords(content: string): Array<Record<string, string>> {
  const lines = content
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const headerLine = lines[0]!;
  const delimiter = headerLine.includes(';') && !headerLine.includes(',') ? ';' : ',';
  const headers = parseCsvLine(headerLine, delimiter);
  const rows: Array<Record<string, string>> = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]!, delimiter);
    const record: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      const key = headers[c];
      if (key) record[key] = values[c] ?? '';
    }
    rows.push(record);
  }
  return rows;
}

function parseJsonRecords(content: string): Array<Record<string, string>> {
  const parsed: unknown = JSON.parse(content.replace(/^\uFEFF/, ''));
  const list = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as { accounts?: unknown[] }).accounts)
      ? (parsed as { accounts: unknown[] }).accounts
      : parsed && typeof parsed === 'object' && Array.isArray((parsed as { profiles?: unknown[] }).profiles)
        ? (parsed as { profiles: unknown[] }).profiles
        : null;
  if (!list) throw new CredentialError('INVALID_INPUT');
  return list.map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new CredentialError('INVALID_INPUT');
    const rec: Record<string, string> = {};
    for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        rec[k] = String(v);
      }
    }
    return rec;
  });
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function extractZipEntries(buffer: Buffer): Map<string, Buffer> {
  const entries = new Map<string, Buffer>();
  let offset = 0;
  while (offset + 30 <= buffer.length) {
    const signature = buffer.readUInt32LE(offset);
    if (signature !== 0x04034b50) break;
    const compressionMethod = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const fileNameLength = buffer.readUInt16LE(offset + 26);
    const extraFieldLength = buffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const dataStart = nameStart + fileNameLength + extraFieldLength;
    const dataEnd = dataStart + compressedSize;
    if (dataEnd > buffer.length) break;
    const fileName = buffer.subarray(nameStart, nameStart + fileNameLength).toString('utf8');
    const rawData = buffer.subarray(dataStart, dataEnd);
    if (compressionMethod === 0) {
      entries.set(fileName, rawData);
    } else if (compressionMethod === 8) {
      entries.set(fileName, inflateRawSync(rawData));
    }
    offset = dataEnd;
  }
  return entries;
}

function columnLettersToIndex(letters: string): number {
  let idx = 0;
  for (let i = 0; i < letters.length; i++) {
    idx = idx * 26 + (letters.toUpperCase().charCodeAt(i) - 64);
  }
  return idx - 1;
}

function parseXlsxRecords(buffer: Buffer): Array<Record<string, string>> {
  const entries = extractZipEntries(buffer);
  const sheetXml = entries.get('xl/worksheets/sheet1.xml')?.toString('utf8');
  if (!sheetXml) throw new CredentialError('INVALID_INPUT');

  const sharedStrings: string[] = [];
  const sharedXml = entries.get('xl/sharedStrings.xml')?.toString('utf8');
  if (sharedXml) {
    const siMatches = sharedXml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g);
    for (const match of siMatches) {
      const inner = match[1] ?? '';
      const texts = [...inner.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => decodeXmlEntities(m[1] ?? ''));
      sharedStrings.push(texts.join(''));
    }
  }

  const matrix: string[][] = [];
  const rowMatches = sheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g);
  for (const rowMatch of rowMatches) {
    const rowContent = rowMatch[1] ?? '';
    const rowCells: string[] = [];
    let nextCol = 0;
    const cellMatches = rowContent.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g);
    for (const cellMatch of cellMatches) {
      const attrs = cellMatch[1] ?? '';
      const inner = cellMatch[2] ?? '';
      const refMatch = /\br="([A-Z]+)\d+"/i.exec(attrs);
      const colIdx = refMatch ? columnLettersToIndex(refMatch[1]!) : nextCol;
      nextCol = colIdx + 1;
      const typeMatch = /\bt="([^"]+)"/.exec(attrs);
      const cellType = typeMatch ? typeMatch[1] : '';
      let value = '';
      if (cellType === 'inlineStr') {
        const tMatch = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/.exec(inner);
        value = tMatch ? decodeXmlEntities(tMatch[1] ?? '') : '';
      } else {
        const vMatch = /<v>([\s\S]*?)<\/v>/.exec(inner);
        const rawVal = vMatch ? decodeXmlEntities(vMatch[1] ?? '') : '';
        if (cellType === 's') {
          const sIdx = Number.parseInt(rawVal, 10);
          value = Number.isNaN(sIdx) ? '' : (sharedStrings[sIdx] ?? '');
        } else {
          value = rawVal;
        }
      }
      rowCells[colIdx] = value.trim();
    }
    if (rowCells.some((c) => c && c.length > 0)) {
      matrix.push(rowCells);
    }
  }

  if (matrix.length < 2) return [];
  const headers = matrix[0]!.map((h) => (h ?? '').trim());
  const records: Array<Record<string, string>> = [];
  for (let r = 1; r < matrix.length; r++) {
    const row = matrix[r]!;
    const rec: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      const h = headers[c];
      if (h) rec[h] = (row[c] ?? '').trim();
    }
    records.push(rec);
  }
  return records;
}

function loadAuthorizedInventoryFile(filePath: string): { format: 'csv' | 'json' | 'xlsx'; records: Array<Record<string, string>> } {
  const resolved = resolve(filePath);
  const stat = lstatSync(resolved);
  if (stat.isSymbolicLink() || !stat.isFile() || stat.nlink !== 1 || stat.size > 2 * 1024 * 1024) {
    throw new CredentialError('UNSAFE_PATH');
  }
  const ext = extname(resolved).toLowerCase();
  if (ext === '.csv') {
    return { format: 'csv', records: parseCsvRecords(readFileSync(resolved, 'utf8')) };
  }
  if (ext === '.json') {
    return { format: 'json', records: parseJsonRecords(readFileSync(resolved, 'utf8')) };
  }
  if (ext === '.xlsx') {
    return { format: 'xlsx', records: parseXlsxRecords(readFileSync(resolved)) };
  }
  throw new CredentialError('INVALID_INPUT');
}

/**
 * Inspecciona los encabezados de un archivo de inventario autorizado sin importar ni exponer valores ni contraseñas.
 */
export function inspectAccountInventoryFile(filePath: string, operatorAuthorized: boolean): DetectedInventoryColumns & { format: 'csv' | 'json' | 'xlsx' } {
  if (!operatorAuthorized) throw new CredentialError('INVALID_INPUT');
  const { format, records } = loadAuthorizedInventoryFile(filePath);
  const headers = records.length > 0 ? Object.keys(records[0]!) : [];
  return {
    format,
    ...detectInventoryColumns(headers, records.length),
  };
}

/**
 * Importa localmente un inventario de cuentas QA (CSV, JSON o XLSX) autorizado por el operador,
 * evitando duplicados y manteniendo cualquier contraseña dentro del proveedor seguro local.
 */
export async function importAccountInventory(options: AccountInventoryImportOptions): Promise<AccountInventoryImportResult> {
  if (!options.operatorAuthorized) {
    throw new CredentialError('INVALID_INPUT');
  }
  const projectRoot = options.projectRoot ?? process.cwd();
  const { format, records } = loadAuthorizedInventoryFile(options.filePath);
  const headers = records.length > 0 ? Object.keys(records[0]!) : [];
  const detected = detectInventoryColumns(headers, records.length);
  const mapping: InventoryColumnMapping = {
    ...detected.suggestedMapping,
    ...(options.columnMapping ?? {}),
  };

  const existingProfiles = readProfiles(projectRoot);
  const seenIds = new Set(existingProfiles.map((p) => p.id.toLowerCase()));
  const seenComposite = new Set(
    existingProfiles.map((p) =>
      [p.application_id ?? '', p.env, p.username, (p.role ?? '').toLowerCase(), (p.scenario ?? '').toLowerCase()].join('|')
    )
  );

  const imported: ImportedProfileSummary[] = [];
  const skippedDuplicates: Array<{ row: number; reason: string; id?: string; username?: string }> = [];
  const skippedInvalid: Array<{ row: number; reason: string }> = [];

  const ownManager = !options.authManager && options.importPasswordsLocally ? new AuthManager(projectRoot) : undefined;
  const manager = options.authManager ?? ownManager;

  try {
    for (let i = 0; i < records.length; i++) {
      const rowNum = i + 1;
      const row = records[i]!;
      const readField = (key: keyof InventoryColumnMapping): string | undefined => {
        const col = mapping[key];
        if (!col) return undefined;
        const val = row[col];
        return typeof val === 'string' && val.trim().length > 0 ? val.trim() : undefined;
      };

      const username = readField('username');
      if (!isValidUsernameIdentifier(username)) {
        skippedInvalid.push({ row: rowNum, reason: 'invalid_or_missing_username' });
        continue;
      }

      const env = readField('env') ?? options.defaults?.env ?? 'local';
      const role = readField('role');
      const scenario = readField('scenario');
      const alias = readField('alias');
      const applicationId = readField('application_id') ?? options.defaults?.application_id;
      const loginOrigin = readField('login_origin') ?? options.defaults?.login_origin;
      const loginRoute = readField('login_route') ?? options.defaults?.login_route ?? '/login';
      const verificationRoute = readField('verification_route') ?? options.defaults?.verification_route;

      const rawId =
        readField('id') ??
        alias ??
        [env, role ?? 'qa', sanitizeSlug(username) || `user-${rowNum}`]
          .map(sanitizeSlug)
          .filter(Boolean)
          .join('-');

      if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(rawId)) {
        skippedInvalid.push({ row: rowNum, reason: 'invalid_profile_id' });
        continue;
      }

      const compositeKey = [applicationId ?? '', env, username, (role ?? '').toLowerCase(), (scenario ?? '').toLowerCase()].join('|');
      if (seenIds.has(rawId.toLowerCase()) || seenComposite.has(compositeKey)) {
        skippedDuplicates.push({ row: rowNum, reason: 'duplicate_profile_or_identity', id: rawId, username });
        continue;
      }

      const candidateProfile: AuthProfile = {
        id: rawId,
        env,
        username,
        credential_source: options.defaults?.credential_source ?? 'keychain',
        login_mode: options.defaults?.login_mode ?? 'auto',
        login_route: loginRoute,
        ...(applicationId ? { application_id: applicationId } : {}),
        ...(loginOrigin ? { login_origin: loginOrigin } : {}),
        ...(verificationRoute ? { verification_route: verificationRoute } : {}),
        ...(role ? { role } : {}),
        ...(scenario ? { scenario, scenarios: [scenario] } : {}),
        ...(alias ? { alias, aliases: [alias] } : {}),
        ...(options.defaults?.post_login_condition ? { post_login_condition: options.defaults.post_login_condition } : {}),
        ...(options.defaults?.form_selectors ? { form_selectors: options.defaults.form_selectors } : {}),
        session_cache: { enabled: true, ttl_ms: 3600000 },
      };

      if (isPrivilegedProfile(candidateProfile) && !options.allowPrivileged) {
        skippedInvalid.push({ row: rowNum, reason: 'privileged_profile_requires_explicit_authorization' });
        continue;
      }

      createProfile(candidateProfile, { basePath: projectRoot, allowPrivileged: options.allowPrivileged });
      seenIds.add(rawId.toLowerCase());
      seenComposite.add(compositeKey);

      let credentialImported = false;
      const secretValue = readField('password');
      if (secretValue && options.importPasswordsLocally && manager && candidateProfile.credential_source !== 'env') {
        await manager.setProfileSecret(candidateProfile, secretValue);
        credentialImported = true;
      }

      imported.push({
        id: candidateProfile.id,
        username: candidateProfile.username,
        env: candidateProfile.env,
        ...(candidateProfile.role ? { role: candidateProfile.role } : {}),
        ...(candidateProfile.scenario ? { scenario: candidateProfile.scenario } : {}),
        ...(candidateProfile.alias ? { alias: candidateProfile.alias } : {}),
        ...(candidateProfile.application_id ? { application_id: candidateProfile.application_id } : {}),
        credential_imported: credentialImported,
      });
    }
  } finally {
    ownManager?.close();
  }

  const { password: _omittedPasswordCol, ...safeMapping } = mapping;
  void _omittedPasswordCol;

  return {
    format,
    detectedColumns: {
      headers: detected.headers,
      hasPasswordColumn: detected.hasPasswordColumn,
      rowCount: detected.rowCount,
      mappingUsed: safeMapping,
    },
    imported,
    skippedDuplicates,
    skippedInvalid,
  };
}
