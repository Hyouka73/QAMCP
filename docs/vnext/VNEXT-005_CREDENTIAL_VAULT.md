# VNEXT-005 — Proveedores de credenciales y bóveda escalonada

Entrega autorizada el 2026-10-28 sobre `76ddfd4d31edda48deaf94f0b603fcb5a906085e`,
exclusivamente en `feat/qap-vnext-architecture`. Implementación: `af32c12`. Un agente, sin subagentes.
VNEXT-006 no iniciada.

## Revisión y decisión de arquitectura

El AuthManager anterior importaba `keytar` incondicionalmente y usaba
`qap.<basename-proyecto>.<perfil>`: dos proyectos con el mismo nombre compartían
secretos. `env` ya devolvía `{token}`, keychain devolvía `{password}`. Se conservan
constructor con projectPath y los métodos públicos getCredentials, setSecret,
hasValidCredentials y deleteSecret; se agregan opciones de composición, estado y close.
`hasValidCredentials` significa presencia, **no** validación remota del login.

SessionStore derivaba la clave de machine-id y basename: no son secretos y no protegen
adecuadamente tokens de sesión. Además ignoraba projectPath para elegir la caché.
`node-machine-id` se elimina de Auth. `playwright-core` se conserva: Auth usa sus
tipos, mientras los consumidores/login existentes necesitan navegadores. Esta etapa
no instala navegadores ni certifica la distribución npm/npx completa.

Contrato público: `packages/auth/src/credential-provider.ts`, reexportado por Auth.
`ICredentialProvider` permite proveedores externos mediante get/set/delete/close.
`CredentialReference` contiene projectId, applicationId, environment,
auth_profile_id y account; su codificación estructurada evita colisiones de separadores.
No depende de Engine, Knowledge, SQLite ni de un proveedor externo concreto.

`TieredCredentialVault` compone proveedores **elegidos explícitamente**. Los niveles
son alternativas de seguridad, no una cascada que cambie el destino al fallar:

| Perfil credential_source | Implementación | Persistencia y bloqueo |
|---|---|---|
| keychain | KeychainCredentialProvider, import dinámico de keytar | SO; UNAVAILABLE si falta el addon/servicio |
| vault | PortableCredentialVault, inyectada y desbloqueada explícitamente | `.qamcp/vault.enc`; LOCKED sin desbloqueo |
| ephemeral | EphemeralCredentialProvider | Map privado, copias defensivas, close elimina referencias |
| env | Compatibilidad AuthManager | Lectura explícita de env_var como token; no se escribe ni revoca la variable |

Keytar sigue siendo una opción apropiada: usa el almacén del usuario del SO y evita
administrar una contraseña maestra y su archivo. No protege frente a procesos ya
autorizados en esa cuenta. Su addon nativo y servicios del escritorio dificultan CI/npx.
Es opcional en Auth **y CLI**, external en el build Auth y cargado solo al operar;
la ausencia no impide importar Auth. Se mantiene la representación password del
backend legacy; tokens/objetos usan vault/ephemeral. No se integra 1Password.

## Resolución e integración

AuthManager obtiene el perfil exclusivamente del proyecto indicado. Se rechazan
IDs de archivo inseguros, duplicados de perfil, fuentes desconocidas y referencias
malformadas. El proyecto por defecto es SHA-256 de su ruta real completa: este hash
es **namespace público, nunca clave criptográfica**. application_id es opcional en
los dos schemas de perfiles y su tipo compartido; usa `default` si se omite.
La tupla incluye entorno y cuenta. Un projectId explícito permite trasladar una bóveda
y mantener su namespace; el compositor es responsable de no reutilizarlo entre proyectos.

El namespace keychain nuevo incorpora SHA-256 de toda la tupla. **No se leen ni
migran automáticamente entradas antiguas por basename**, pues no se puede demostrar
a qué proyecto pertenecen. Los usuarios deben reaprovisionar el perfil y retirar
manualmente las entradas legacy correctas en su gestor del SO. Cambiar cuenta,
entorno, aplicación o projectId también exige reaprovisionar/retirar la referencia anterior.

getCredentialStatus devuelve solo auth_profile_id y uno de available,
not_configured, unlock_required, unavailable o invalid. Un fallo de GCM no distingue
contraseña incorrecta de corrupción/manipulación. No se afirma que un password/token
esté vigente: no se contacta al servidor. Los errores propios usan códigos fijos,
sin causa ni entradas del usuario; se sanitizan errores de proveedores externos.
El puerto privilegiado getCredentials sigue devolviendo secretos a código de ejecución,
**no debe exponerse como herramienta para el agente ni persistirse en conocimiento**.
Los contratos existentes de IKnowledgeStore siguen rechazando campos de credenciales;
las pruebas contractuales se conservaron. No se garantiza detectar secretos escondidos
en prosa arbitraria: sigue siendo necesaria redacción en ingesta.

CLI conserva comandos y ahora muestra estados reales por proveedor; al quitar un
perfil revoca antes de retirar su referencia y la conserva si falla el proveedor.
No se añaden flags de contraseña maestra, prompts, handlers MCP ni login autónomo.
La composición vault/ephemeral se hace mediante API; la CLI/MCP existente continúa
con keychain/env y la bóveda no se desbloquea implícitamente desde el entorno.

Ejemplo de composición en código privilegiado (sin introducir secretos en prompts):

```ts
const portable = new PortableCredentialVault(projectRoot);
await portable.unlock(await authorizedSecretInput());
const auth = new AuthManager(projectRoot, {
  vault: new TieredCredentialVault({ vault: portable }),
});
try {
  // El perfil existente tiene credential_source: 'vault'.
  const status = await auth.getCredentialStatus('admin'); // Referencia + estado.
  // El ejecutor autorizado puede usar getCredentials; no serializar su resultado.
} finally { auth.close(); }
```

authorizedSecretInput es un límite de integración del llamador, no una función
implementada ni una nueva herramienta MCP. La contraseña maestra no se lee de argv,
no se registra y no se guarda junto a la bóveda. La aplicación puede suministrarla
desde un mecanismo autorizado; usar variables de entorno tiene riesgos de herencia,
diagnósticos y exposición del proceso que debe gestionar el llamador.

## Criptografía y formato v1

- AES-256-GCM, clave de 32 bytes, nonce aleatorio de 12 bytes por escritura,
  tag obligatorio de 16 bytes. Metadatos de versión/cipher/KDF/salt/nonce se autentican
  como AAD. Clave y contraseña no están en el archivo.
- Salt de 32 bytes aleatorios por nueva bóveda, estable mientras se usa la misma
  clave; nonces nuevos en reemplazo y eliminación. Dos bóvedas usan salts distintos.
- scrypt de node:crypto: **N=131072, r=8, p=1, keyLength=32, maxmem=256 MiB**.
  Parámetros almacenados y validados exactamente antes de derivar; no se ejecuta
  una KDF seleccionada por contenido hostil. Versiones futuras se rechazan.
- La contraseña maestra admite 16..1024 unidades UTF-16. La longitud no garantiza
  entropía; usar un secreto fuerte. No hay valor predeterminado ni derivación desde
  datos públicos. Sin secreto, headless queda bloqueado de forma recuperable.
- scrypt se ejecuta asíncronamente en el threadpool de Node. La memoria de trabajo
  ronda 128 MiB por derivación; no abrir muchas bóvedas a la vez en CI con poca RAM.
  Se conserva solo la clave derivada durante unlock; close la sobrescribe y cancela
  un desbloqueo pendiente. Los buffers temporales se sobrescriben cuando es viable.
- Strings de JavaScript, copias del runtime y secretos ya devueltos no pueden borrarse
  de forma garantizada. close de ephemeral elimina referencias, no prueba borrado físico.

Se elige scrypt en lugar del PBKDF2 previsto inicialmente por su costo de memoria,
disponibilidad en Node sin addons y la instrucción específica de esta etapa.
Referencia actual: [OWASP Password Storage, scrypt](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#scrypt)
(punto de partida para resistencia a ataques offline, no una certificación de bóvedas),
[OWASP Cryptographic Storage](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
y [Node crypto](https://nodejs.org/docs/latest-v24.x/api/crypto.html).
Prueba local Node 24.15.0/Windows, tres aperturas secuenciales: **346/345/330 ms**;
maxRSS del proceso 185564 KiB. No es una garantía de rendimiento ni de entropía.

## Archivos, concurrencia y sesiones

secure-files.ts contiene comprobación de ruta autorizada, rechazo de ADS/nombres
reservados de Windows, enlaces simbólicos/junctions y archivos con múltiples hardlinks.
Se inspeccionan ancestros; se limita la lectura a 4 MiB y el ciphertext escrito a
3 MiB hex para no generar archivos que después resulten ilegibles.
Archivos nuevos/temporales/locks se crean con 0600 y directorios nuevos con 0700.
En POSIX se rechazan archivos con permisos de grupo/otros y directorios finales
escribibles por grupo/otros. Windows ignora esos mode bits: se heredan ACL del
directorio autorizado del usuario; no se configura ni certifica una ACL específica.

Cada operación de bóveda adquiere `<archivo>.lock` con creación exclusiva, vuelve
a leer la versión confirmada y luego aplica el cambio. BUSY es recuperable, sin
robar locks ni sobrescribir snapshots obsoletos. La inicialización revalida bajo lock
después de scrypt. Un lock huérfano exige intervención tras comprobar que el dueño
terminó; no se borra automáticamente por antigüedad.
Escritura: temporal aleatorio en el mismo directorio, fsync del archivo y rename;
fsync de directorio en POSIX. El fallo de rename se prueba conservando los bytes
anteriores y limpiando temporal/lock. La durabilidad tras corte eléctrico en Windows,
shares/redes y filesystems no locales no está certificada. Un fallo del fsync de
directorio posterior a rename puede reportar error aunque el reemplazo ya sea visible.

Estas comprobaciones no son un sandbox contra un atacante que pueda intercambiar
directorios concurrentemente con los permisos de la misma cuenta. Node portable no
ofrece aquí operaciones openat por descriptor para cerrar todos los TOCTOU. No usar
un directorio controlado por usuarios hostiles. No hay protección contra rollback
de una copia antigua autenticada. Eliminar/reemplazar borra la entrada lógica del
archivo actual; no garantiza borrado de SSD, snapshots, backups ni revoca el token
en el servidor remoto. La rotación de contraseña maestra no tiene API en esta entrega.

SessionStore sigue separado de credenciales persistentes. storageState se cifra
con GCM y AAD del perfil, no entra en Knowledge. Usa ahora projectPath para la
caché y las mismas defensas de archivos/locks; lecturas y eliminación por expiración
se hacen bajo lock. Default: clave aleatoria de vida de módulo/proceso, no persistida.
Para restaurar entre procesos se exige QAP_SESSION_KEY de **64 caracteres hex**
generados de 32 bytes aleatorios por un canal autorizado; se vincula al directorio
completo de caché. No se aceptan seeds débiles legacy. Otro proceso/copia de módulo
sin esa clave requiere reautenticación; no se prometen sesiones compartidas entre
bundles duplicados. No se destruye ciphertext al encontrar una clave incorrecta.
Las cachés antiguas no se migran ni se borran automáticamente. El archivo previo
del usuario se conservó sin cambios y se excluye de los commits.

## Verificación del 2026-10-28

| Verificación | Resultado real |
|---|---|
| Auth focalizada, Windows / Node 24.15.0 | 34 aprobadas, 1 omitida (permisos POSIX), 3 archivos |
| Auth focalizada, Windows / Node 24.19.0 | 34 aprobadas, 1 omitida (POSIX) |
| Auth focalizada, Windows / Node 24.22.1 | 34 aprobadas, 1 omitida (POSIX) |
| Windows Credential Manager real, cada uno de esos tres runtimes | 6 comprobaciones por runtime; namespace sintético aleatorio eliminado |
| Shared / Engine / Knowledge focalizados | 145/145 + 168/168 + 234/234 = 547/547 |
| CLI Auth | 6/6, incluye orden de revocación y fallo sin pérdida de referencia |
| MCP centinela P4.4, filtro de un test | 1 aprobada, 14 no seleccionadas; no es E2E verde |
| Runner session-resolver | 3 aprobadas, 1 falla por Chromium ausente al intentar re-login |
| Build monorepo | 10 paquetes compilados, ESM y declaraciones donde corresponden |
| ESLint de 15 archivos TS/JS modificados | Sin diagnósticos |
| tsc Auth incluyendo tests | Sin diagnósticos |
| Lockfile | pnpm 12.3.4, offline/ignore-scripts; supply-chain check aprobado, sin actualizar versiones |

Los tests usan secretos sintéticos y directorios temporales. Se comprueban apertura,
cierre, recuperación, contraseña errónea, truncamiento, manipulación de data/tag/nonce/salt,
versiones/KDF desconocidas, salts/nonces, fallo de rename sin pérdida, reemplazo y borrado,
dos handles que recargan estado y locks ocupados, cancelación de unlock, aislamiento,
entradas inseguras, keychain ausente, carga del build con loader que niega keytar,
headless bloqueado, ephemeral sin persistencia y errores/logs sin secretos.
Hardlinks y junctions se comprobaron fuera del sandbox de Codex: dentro de él,
Windows devuelve EPERM al crearlos y esos dos tests se omiten expresamente.
El test POSIX no se ejecutó. **Linux y macOS no se comprobaron**; no se declara
compatibilidad de sus keychains. Node 24 LTS es objetivo empíricamente viable en
estos tres builds de Windows. Otros Node/minors y la instalación npx limpia siguen
sin certificar; esto tampoco amplía la matriz SQLite/FTS5 de VNEXT-004.

La prueba centinela MCP inyecta ahora KeychainCredentialProvider en AuthManager:
un vi.mock de keytar no intercepta de forma fiable imports nativos desde el paquete
compilado externalizado. Se mantuvieron todas las expectativas de no filtración y
se evitó depender de credenciales reales. El probe explícito del SO es independiente.

La ejecución global `pnpm -r --no-bail --if-present test` **no pasa**:
Shared 145, Engine 168; Auth 31 aprobadas/8 omitidas en ese intento anterior a la
última prueba agregada, con dos suites fallidas por Chromium ausente y teardown;
Adapter 17 fallidas/4 aprobadas/5 omitidas, tres archivos; Knowledge 233/234, falla
route-scanner por tiempo_limite_excedido antes de limite_archivos_excedido bajo carga.
Las fuentes de esos tests/implementaciones no se modificaron y coinciden con la
base autorizada; las firmas Auth/Adapter coinciden con VNEXT-004. Knowledge pasó
234/234 aisladamente y la sensibilidad a carga ya estaba documentada. No se corrigió
ni se declara resuelta. El runner global omitió dependientes de paquetes fallidos;
por ello CLI, runner y centinela MCP se ejecutaron explícitamente. No se instalaron
navegadores ni cambiaron expectativas para obtener verde.

Comandos reproducibles, desde la raíz salvo indicación:

```powershell
$env:TEMP = (Resolve-Path node_modules/.tmp-vnext).Path
$env:TMP = $env:TEMP
# En pnpm 11/12, si pretende reinstalar antes de cada script con el sandbox:
$env:pnpm_config_verify_deps_before_run = 'false'
pnpm --filter @qap/auth test src/__tests__/auth-manager.test.ts src/__tests__/session-store.test.ts src/__tests__/credential-vault.test.ts
pnpm --filter @qap/shared --filter @qap/engine --filter @qap/knowledge test
pnpm --filter @hyouka73/qap-cli test src/__tests__/auth-commands.test.ts
pnpm --filter @qap/mcp test src/__tests__/p4-4-auth-lifecycle.test.ts -t '11. Test de no filtración'
pnpm --filter @qap/playwright-runner test test/session-resolver.test.ts
node packages/auth/scripts/verify-keychain.mjs # opt-in; entrada sintética del SO, cleanup en finally
pnpm build
node node_modules/typescript/bin/tsc -p packages/auth/tsconfig.json --noEmit
pnpm -r --no-bail --if-present test
```

Revisión del diff: `git diff --check` sin errores; 20 archivos de implementación/configuración/pruebas preparados explícitamente, sin `.qa/`, bóvedas ni logs. Sin hallazgos de secretos accidentales en la revisión y búsqueda de patrones de claves. Ninguna dependencia nativa nueva obligatoria; `keytar` queda opcional.

Logs locales no versionados: `node_modules/.tmp-vnext/vnext005-*.log`.
Para la matriz usar cada node.exe con `node_modules/vitest/vitest.mjs` desde Auth.
No se invocó un gestor de secretos real distinto del probe sintético de Windows.

## Continuidad

VNEXT-006 podrá consumir referencias/estados mediante este puerto. No recibe una
licencia implícita para operaciones destructivas por disponer de credenciales.
Pendientes de futuras etapas: composición de desbloqueo en la experiencia npx,
tests npx desde instalación limpia sin addons, CI POSIX, UX de reprovisión legacy,
rotación maestra y protección adicional según el modelo de despliegue. No se ha
implementado crawler, Advisor, handlers, cambios SQLite/FTS5 ni publicación npm.
