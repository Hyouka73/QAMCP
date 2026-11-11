import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { AuthManager, KeychainCredentialProvider, PortableCredentialVault, promptLocalSecret, readProfile,
  TieredCredentialVault } from '@qap/auth';
import type { AuthProfile } from '@qap/shared';
import { SchemaValidator } from '@qap/shared';

const PROFILES_DIR = join(process.cwd(), '.qa', 'project', 'auth');
const PROFILES_PATH = join(PROFILES_DIR, 'profiles.json');

const authManager = new AuthManager();
const validator = new SchemaValidator();

function loadProfiles(): AuthProfile[] {
  if (!existsSync(PROFILES_PATH)) return [];
  try {
    const raw = readFileSync(PROFILES_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as { profiles: AuthProfile[] };
    return parsed.profiles || [];
  } catch {
    return [];
  }
}

function saveProfiles(profiles: AuthProfile[]): void {
  if (!existsSync(PROFILES_DIR)) {
    mkdirSync(PROFILES_DIR, { recursive: true });
  }
  writeFileSync(PROFILES_PATH, JSON.stringify({ profiles }, null, 2), 'utf-8');
}

/**
 * 1) qap auth add: Registra perfil en .qa/project/auth/profiles.json (sin passwords)
 */
export function handleAuthAdd(
  profileInput: string | (Partial<AuthProfile> & { id: string })
): Promise<void> {
  try {
    const profileData = typeof profileInput === 'string' ? { id: profileInput } : profileInput;
    const profiles = loadProfiles();
    const existingIndex = profiles.findIndex((p) => p.id === profileData.id);

    const newProfile: AuthProfile = {
      id: profileData.id,
      env: profileData.env || 'dev',
      username: profileData.username || 'user',
      login_mode: profileData.login_mode || 'auto',
      login_route: profileData.login_route || '/login',
      session_cache:
        profileData.session_cache && typeof profileData.session_cache === 'object'
          ? profileData.session_cache
          : { enabled: true },
      post_login_condition: profileData.post_login_condition || { type: 'url_contains', value: '/dashboard' },
      handoff_timeout_ms: profileData.handoff_timeout_ms ?? 30000,
      credential_source: profileData.credential_source || 'keychain',
      ...(profileData.env_var ? { env_var: profileData.env_var } : {}),
      ...(profileData.application_id ? { application_id: profileData.application_id } : {}),
      ...(profileData.login_origin ? { login_origin: profileData.login_origin } : {}),
      ...(profileData.verification_route ? { verification_route: profileData.verification_route } : {}),
      ...(profileData.form_selectors ? { form_selectors: profileData.form_selectors } : {}),
      ...(profileData.token_exchange_route ? { token_exchange_route: profileData.token_exchange_route } : {}),
      ...(profileData.challenge_selector ? { challenge_selector: profileData.challenge_selector } : {}),
    };

    if (existingIndex >= 0) {
      profiles[existingIndex] = newProfile;
    } else {
      profiles.push(newProfile);
    }

    const validationResult = validator.validateProfiles({
      _version: '1',
      profiles,
    });

    if (!validationResult.valid) {
      console.error('Perfil invalido, no cumple auth-profiles.schema.json:');
      validationResult.errors.forEach((err) => console.error(` - ${err.message}`));
      return Promise.resolve();
    }

    saveProfiles(profiles);
    console.log(`✔ Perfil '${profileData.id}' registrado con éxito en .qa/project/auth/profiles.json.`);
    return Promise.resolve();
  } catch (error) {
    console.error(`✖ Error al registrar el perfil:`, error);
    return Promise.resolve();
  }
}

/** Provision the locally selected account through the host's masked dialog. */
export async function handleAuthSetSecret(profileId: string, prompt = (label: string) => promptLocalSecret(label, undefined, () => {
  console.log('Diálogo de credencial presentado en Windows.');
})): Promise<void> {
  const root = process.cwd();
  const profile = await readProfile(profileId, root);
  if (!profile || !profile.application_id || !profile.login_origin ||
      !['keychain', 'vault'].includes(profile.credential_source)) {
    throw new Error('Configura localmente un perfil con aplicación, origen y proveedor keychain o vault.');
  }
  const destination = [
    `Workspace: ${root}`, `Aplicación: ${profile.application_id}`, `Entorno: ${profile.env}`,
    `Perfil: ${profile.id}`, `Cuenta: ${profile.username}`, `Origen: ${profile.login_origin}`,
  ].join('\n');
  const portable = profile.credential_source === 'vault' ? new PortableCredentialVault(root) : undefined;
  const manager = new AuthManager(root, { vault: new TieredCredentialVault({
    keychain: new KeychainCredentialProvider(), vault: portable,
  }) });
  try {
    if (portable) {
      const passphrase = await prompt('Desbloquear el Vault local de QAP.\n\n' + destination);
      if (!passphrase) {
        console.log('Operación cancelada.');
        return;
      }
      await portable.unlock(passphrase);
    }
    const provider = portable ? 'Vault local de QAP' : 'Administrador de credenciales de Windows';
    const password = await prompt(`Guardar la contraseña de prueba en el ${provider}.\n\n` + destination);
    if (!password) {
      console.log('Operación cancelada.');
      return;
    }
    console.log('Contraseña aceptada. Guardando en el proveedor local.');
    await manager.setProfileSecret(profile, password);
    console.log('Secreto guardado correctamente para el perfil ' + profileId + '.');
  } finally { manager.close(); }
}

export async function handleAuthTokenVariable(profileId: string): Promise<void> {
  const profile = await readProfile(profileId);
  if (!profile || profile.credential_source !== 'env' || !profile.application_id ||
      !profile.login_origin || !profile.token_exchange_route) throw new Error('Configura el perfil de intercambio de token.');
  console.log(authManager.scopedTokenVariable(profile));
}

/**
 * 3) qap auth list: Imprime tabla con id, env, modo y estado de credencial
 */
export async function handleAuthList(): Promise<void> {
  try {
    const profiles = loadProfiles();
    console.log('\n--- Perfiles de Autenticación ---');

    if (profiles.length === 0) {
      console.log('(No se encontraron perfiles almacenados en .qa/project/auth/profiles.json)');
      console.log('');
      return;
    }

    console.log('ID\t\tENV\t\tMODO\t\tESTADO CREDENCIAL');
    console.log('-------------------------------------------------------------------');

    for (const p of profiles) {
      let status = 'sin credencial';
      if (p.credential_source === 'env') {
        const variable = p.login_origin ? authManager.scopedTokenVariable(p) : p.env_var;
        const val = variable ? process.env[variable] : undefined;
        status = val ? 'variable env (ok)' : 'variable env (no definida)';
      } else {
        const result = await authManager.getCredentialStatus(p.id);
        status = `${result.state} (${p.credential_source})`;
      }
      console.log(`${p.id}\t\t${p.env}\t\t${p.login_mode}\t\t${status}`);
    }
    console.log('');
  } catch (error) {
    console.error('✖ Error al listar perfiles:', error);
  }
}

/**
 * 4) qap auth remove <profile-id>: Elimina perfil y borra secreto del keychain
 */
export async function handleAuthRemove(profileId: string): Promise<void> {
  try {
    let profiles = loadProfiles();
    const initialLength = profiles.length;
    profiles = profiles.filter((p) => p.id !== profileId);

    if (profiles.length === initialLength) {
      console.log(`⚠ No se encontró ningún perfil con el id '${profileId}'.`);
      return;
    }

    // Resolve and revoke while the profile still exists. Failed revocation retains the reference.
    const original = loadProfiles().find((p) => p.id === profileId);
    if (original?.credential_source !== 'env') await authManager.deleteSecret(profileId);
    saveProfiles(profiles);
    console.log(`✔ Credenciales y perfil '${profileId}' eliminados del registro.`);
  } catch (error) {
    console.error(`✖ Error al eliminar el perfil '${profileId}':`, error);
  }
}
