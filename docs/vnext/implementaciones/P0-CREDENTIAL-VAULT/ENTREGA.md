# P0 · Credential Vault y sesiones verificadas

11 de noviembre de 2026 · Hyouka73/QAMCP · rama `feat/qap-vnext-architecture`

Base local y remota comprobada `1f414b09d8b4a09221f94f4d40438f51c1fb7fcd`. El checkout local estaba limpio. Implementación `1e566cd4c2fa3e0bb6bf8538faaa40c864fffb60`.

## Operación

| Método | Comportamiento |
| --- | --- |
| `auto` | Carga el perfil local del proyecto y comprueba el alcance canónico. Tras el consentimiento de Login, verifica la sesión anterior si existe. Cuando se necesita un inicio de sesión, lee el proveedor autorizado y abre Chromium en el origen aprobado. |
| `reuse` | Comprueba la sesión previamente verificada. Si caducó o la aplicación la rechazó, devuelve `session_expired`. |
| `handoff` | Abre una ventana de Chromium para iniciar sesión manualmente. La solicitud incluye la ruta protegida y un marcador visible. |

Para aceptar una captura, QAP exige una respuesta satisfactoria en la ruta protegida exacta, un selector visible y una comprobación anónima independiente. El proceso de Login tiene una aprobación local propia. Discovery autenticado y Test conservan sus propias aprobaciones y políticas. Test requiere un módulo canónico, casos aprobados y pasos de lectura. Se mantiene el bloqueo de métodos HTTP distintos de GET/HEAD en la ejecución interactiva.

`qap_auth_add` sólo acepta los campos del catálogo. En `auto` y `reuse`, la ruta, la cuenta y los selectores provienen del host. `qap_auth_list` devuelve identificador, entorno y estado. Ambos modos rechazan `password`, `secret`, `storageState` y confirmaciones en los argumentos.

### Proveedores y persistencia

- **keychain** usa la cuenta local de Windows y el proveedor existente de Windows Credential Manager. El comando `qap auth set-secret <perfil>` abre un diálogo enmascarado. Los datos que pasan por el diálogo se entregan por una tubería privada al proveedor. El comando rechaza argumentos adicionales.
- **vault** usa el archivo cifrado `.qamcp/vault.enc` del proyecto. El mismo comando pide la frase de desbloqueo en el diálogo local antes de aprovisionar la contraseña. En el siguiente Login automático que la necesite, el host pide la frase de desbloqueo. Un Vault cerrado devuelve `vault_locked`.
- **ephemeral** pide la contraseña localmente la primera vez que se necesita en la conexión. El proveedor conserva la entrada en memoria hasta cerrar el host.
- **env** admite intercambio explícito por sesión de navegador mediante POST con `Authorization: Bearer` a `token_exchange_route` del mismo origen. El endpoint debe devolver una cookie de sesión que permita pasar la comprobación protegida. `qap auth token-variable <perfil>` devuelve únicamente el nombre de la variable que el gestor de secretos autorizado debe inyectar al arrancar. El nombre incorpora proyecto, aplicación, entorno, cuenta, perfil, origen y ruta. Los redirects del intercambio se bloquean.
- Las sesiones verificadas usan memoria cifrada. Con una clave hexadecimal de 32 bytes suministrada por el gestor de secretos del host en `QAP_SESSION_KEY`, los perfiles automáticos persistentes pueden usar `.qa/cache/verified-sessions/`. La clave se debe conservar entre arranques e inyectar como secreto del proceso. El caché incluye el alcance canónico, la revisión del entorno y la configuración del perfil. Sin clave usable la sesión dura en el proceso y el siguiente arranque puede solicitar un nuevo Login. Handoff y perfiles efímeros usan memoria. El caché de sesiones anterior conserva su ubicación y formato.

Los flujos automáticos admiten HTTPS y HTTP de loopback. Los CAPTCHA, MFA detectados, destinos externos y flujos incompatibles devuelven un estado recuperable. Handoff permite intervención dentro del mismo origen. Un proveedor en otro origen requiere una política de host adicional. Mantén desactivado el diagnóstico de Playwright al usar perfiles autenticados.

## Actualizar Antigravity y probar Lendus CORE

1. Cierra Antigravity por completo para detener el servidor Stdio anterior. En PowerShell, actualiza el checkout que vas a registrar.

   ```powershell
   Set-Location 'C:/Users/Judirico/Documents/QAMCP/QAMCP'
   git switch feat/qap-vnext-architecture
   git pull --ff-only origin feat/qap-vnext-architecture
   pnpm build
   ```

   Para una instalación nueva, ejecuta `pnpm install --frozen-lockfile` antes del build. Verifica el proveedor nativo con `node packages/auth/scripts/verify-keychain.mjs`. Si falta Chromium, instala con `pnpm exec playwright-core install chromium`.

2. En `C:/Users/Judirico/.gemini/antigravity/mcp_config.json`, localiza `mcpServers.qap-vnext`. Ajusta `command` a `node` y `args` a `["C:/Users/Judirico/Documents/QAMCP/QAMCP/packages/mcp/dist/server.js"]`. Conserva la configuración privada del host y su Knowledge. Si Antigravity usa también los esquemas locales de `antigravity-ide/mcp/qap-mcp`, ejecuta `node scripts/sync-mcp-schemas.mjs` desde el checkout para refrescar esa copia.

3. Para Login y Discovery, usa la raíz de QA `C:/Users/Judirico/Documents/lendus-qap` en `qap_status` y conserva el entorno de staging registrado para `https://staging.lendus.dev`. En modo bootstrap el ID de entorno es `local`. Para ejecutar `qap_test` con el host canónico, el manifiesto privado debe usar `"interactiveAccess": true`, apuntar al Knowledge existente y tener el módulo vinculado a su revisión vigente y casos aprobados. Si hay una política `testAuthorization`, incluye el origen de staging y el identificador de perfil. Abre Antigravity en la sesión gráfica de Windows y comprueba que `qap_auth_add` anuncia `auto`, `reuse` y `handoff`.

4. Abre localmente `C:/Users/Judirico/Documents/lendus-qap/.qa/project/auth/profiles.json` y agrega un perfil al arreglo `profiles`, conservando las entradas existentes y `"_version": "1"`. Usa el ID de aplicación y entorno del manifiesto de Lendus. Si usas bootstrap, obtén su ID de aplicación desde la raíz canónica con este comando.

   ```powershell
   Set-Location 'C:/Users/Judirico/Documents/lendus-qap'
   node -e "const fs=require('node:fs'), c=require('node:crypto'); console.log('workspace-'+c.createHash('sha256').update(fs.realpathSync('.').toLowerCase()).digest('hex').slice(0,32))"
   ```

   Completa los campos con la cuenta de pruebas, las rutas y los selectores reales de staging. `post_login_condition.value` debe aparecer en la ruta protegida sólo con sesión activa. Conserva el rol del plan QA.

   ```json
   {
     "id": "lendus-qa",
     "application_id": "<ID canónico>",
     "env": "<ID del entorno>",
     "username": "<cuenta de pruebas>",
     "role": "<rol del plan QA>",
     "credential_source": "keychain",
     "login_mode": "auto",
     "login_origin": "https://staging.lendus.dev",
     "login_route": "/<ruta-de-login>",
     "verification_route": "/<ruta-protegida>",
     "form_selectors": {
       "username": "<selector de usuario>",
       "password": "<selector de contraseña>",
       "submit": "<selector de inicio de sesión>"
     },
     "post_login_condition": { "type": "selector_present", "value": "<marcador visible>" },
     "session_cache": { "enabled": true, "ttl_ms": 3600000 }
   }
   ```

5. Desde la raíz de QA, ejecuta el comando de aprovisionamiento y escribe la contraseña en el campo enmascarado.

   ```powershell
   Set-Location 'C:/Users/Judirico/Documents/lendus-qap'
   node 'C:/Users/Judirico/Documents/QAMCP/QAMCP/packages/cli/dist/entrypoint.js' auth set-secret lendus-qa
   ```

6. En Antigravity solicita `qap_auth_add` con `targetPath: "C:/Users/Judirico/Documents/lendus-qap"`, `profile: "lendus-qa"`, el `env` del perfil y `method: "auto"`. Aprueba el diálogo de Login al comprobar la cuenta y el origen. Espera `authentication_verified` con `verified: true`. Repite la llamada con `method: "reuse"` y comprueba `session_valid`. Si el plan sigue en SCOPING, vuelve a enviar su plan vigente con `qap_session_plan` y el perfil y rol ya configurados.

7. Ejecuta `qap_discover` con ese perfil cuando el módulo requiera Discovery autenticado. Ejecuta `qap_test` con el mismo `targetPath`, el `environment` del perfil, el `module` canónico y `profile: "lendus-qa"`. Aprueba Test por separado. Comprueba el `execution_id` y consulta `qap_report` con ese ID. Registra el resultado y confirma que sólo se escribió la contraseña al aprovisionar.

## Evidencia y aceptación

Ver [validación](VALIDACION.md). La prueba técnica usa Chromium y HTTP locales en Windows, incluyendo el proveedor real de credenciales. Las decisiones del operador en el fixture son simuladas. La aceptación en Antigravity contra Lendus CORE y la entrada manual en el diálogo de aprovisionamiento quedan pendientes.
