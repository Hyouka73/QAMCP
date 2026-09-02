import { AuthManager } from '@qap/auth';

const authManager = new AuthManager();

//Registro en memoria local de perfiles conocidos para la sesión CLI
const KNOWN_PROFILES = ['default', 'mi-perfil', 'dev', 'prod'];

/**
 * Registra interactiva o directamente un perfil.
 */
export async function handleAuthAdd(profile: string): Promise<void> {
    try {
        // Por ahora simulamos la recepción de un secreto por defecto o input
        const defaultSecret ='token-placeholder-123';
        await authManager.setSecret(profile, defaultSecret);
        console.log(`✔ Perfil '${profile}' registrado con éxito en el llavero del sistema.`);
  } catch (error) {
    console.error(`✖ Error al registrar el perfil '${profile}':`, error);
  }
}

/**
 * Lista todos los perfiles configurados sin exponer secretos.
 */
export async function handleAuthList(): Promise<void> {
    try {
    console.log('\n--- Perfiles de Autenticación Configurados ---');

        let found = 0;
        for (const profile of KNOWN_PROFILES) {
            const creds = await authManager.getCredentials(profile);
            if (creds) {
                console.log(` • ${profile}: [Configurado] ****`);
                found++;
            }
        }

        if (found === 0) {
            console.log('(No se encontraron perfiles almacenados)');
        }
        console.log('');
    } catch (error) {
        console.error('✖ Error al listar perfiles:', error);
    }
}
/**
 * Guarda directamente un secreto en el llavero seguro local.
 */
export async function handleAuthSetSecret(profile: string, secret: string): Promise<void> {
    try {
        if (!secret || secret.trim() === '') {
            console.error(`✖ Error: El secreto para '${profile}' no puede estar vacío.`);
            return;
        }
        await authManager.setSecret(profile, secret);
          console.log(`✔ Secreto guardado correctamente para el perfil '${profile}'.`);
    } catch (error) {
        console.error(`✖ Error al actualizar el secreto para el perfil '${profile}':`, error);
    }
}

/**
 * Elimina las credenciales asociadas a un perfil.
 */
export async function handleAuthRemove(profile: string): Promise<void> {
    try {
        const removed = await authManager.deleteSecret(profile);
        if (removed) {
            console.log(`✔ Credenciales del perfil '${profile}' eliminadas del registro.`);
        } else {
            console.log(`⚠ No se encontró ningún secreto para el perfil '${profile}'.`);
        }
    } catch (error) {
        console.error(`✖ Error al eliminar el perfil '${profile}':`, error);
    }
}