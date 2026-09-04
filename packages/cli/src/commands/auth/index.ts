import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { AuthManager } from '@qap/auth';

const PROFILES_DIR = join(process.cwd(), '.qa', 'project', 'auth');
const PROFILES_PATH = join(PROFILES_DIR, 'profiles.json');

const authManager = new AuthManager();

interface AuthProfileItem {
  id: string;
  env: string;
  username: string;
  login_mode: 'auto' | 'handoff';
  login_route: string;
  session_cache: boolean;
  post_login_condition: { type: 'url_contains' | 'selector_present'; value: string };
  handoff_timeout_ms: number;
  credential_source: 'env' | 'keychain';
  env_var?: string;
}

function loadProfiles(): AuthProfileItem[] {
  if (!existsSync(PROFILES_PATH)) return [];
  try {
    const raw = readFileSync(PROFILES_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as { profiles: AuthProfileItem[] };
    return parsed.profiles || [];
  } catch {
    return [];
  }
}

function saveProfiles(profiles: AuthProfileItem[]): void {
  if (!existsSync(PROFILES_DIR)) {
    mkdirSync(PROFILES_DIR, { recursive: true });
  }
  writeFileSync(PROFILES_PATH, JSON.stringify({ profiles }, null, 2), 'utf-8');
}

/**
 * 1) qap auth add: Registra perfil en .qa/project/auth/profiles.json (sin passwords)
 */
export async function handleAuthAdd(
  profileInput: string | (Partial<AuthProfileItem> & { id: string })
): Promise<void> {
  try {
    const profileData = typeof profileInput === 'string' ? { id: profileInput } : profileInput;
    const profiles = loadProfiles();
    const existingIndex = profiles.findIndex((p) => p.id === profileData.id);

    const newProfile: AuthProfileItem = {
      id: profileData.id,
      env: profileData.env || 'dev',
      username: profileData.username || 'user',
      login_mode: profileData.login_mode || 'auto',
      login_route: profileData.login_route || '/login',
      session_cache: profileData.session_cache ?? true,
      post_login_condition: profileData.post_login_condition || { type: 'url_contains', value: '/dashboard' },
      handoff_timeout_ms: profileData.handoff_timeout_ms || 30000,
      credential_source: profileData.credential_source || 'keychain',
      ...(profileData.env_var ? { env_var: profileData.env_var } : {}),
    };

    if (existingIndex >= 0) {
      profiles[existingIndex] = newProfile;
    } else {
      profiles.push(newProfile);
    }

    saveProfiles(profiles);
    console.log(`✔ Perfil '${profileData.id}' registrado con éxito en .qa/project/auth/profiles.json.`);
  } catch (error) {
    console.error(`✖ Error al registrar el perfil:`, error);
  }
}

/**
 * 2) qap auth set-secret <profile-id>: Solicita contraseña y guarda en keychain
 */
export async function handleAuthSetSecret(profileId: string, secret: string): Promise<void> {
  try {
    if (!secret || secret.trim() === '') {
      console.error(`✖ Error: El secreto para '${profileId}' no puede estar vacío.`);
      return;
    }
    await authManager.setSecret(profileId, secret);
    console.log(`✔ Secreto guardado correctamente para el perfil '${profileId}'.`);
  } catch (error) {
    console.error(`✖ Error al actualizar el secreto para el perfil '${profileId}':`, error);
  }
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
        const val = p.env_var ? process.env[p.env_var] : undefined;
        status = val ? 'variable env (ok)' : 'variable env (no definida)';
      } else {
        const hasValid = await authManager.hasValidCredentials(p.id);
        status = hasValid ? 'registrada (keychain)' : 'pendiente (keychain)';
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

    saveProfiles(profiles);
    await authManager.deleteSecret(profileId);
    console.log(`✔ Credenciales y perfil '${profileId}' eliminados del registro.`);
  } catch (error) {
    console.error(`✖ Error al eliminar el perfil '${profileId}':`, error);
  }
}