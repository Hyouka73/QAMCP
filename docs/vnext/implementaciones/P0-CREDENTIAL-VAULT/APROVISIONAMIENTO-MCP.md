# Aprovisionamiento desde el host MCP de QAP

Base local y remota verificada `c5e10ebd8b89753f5bd8f0d76594dd46c42e5ef7`. Implementación `b68cf51a8218acf2a86ea3487225d2eaf7c40642` en `feat/qap-vnext-architecture`.

## Evidencia y alcance

El ejecutor de comandos de Antigravity recibió `ContentRendered` de WPF y agotó el tiempo con `DIALOG_RESPONSE_TIMEOUT`. El operador confirmó que no vio la ventana. El mismo WPF sí se vio antes desde la terminal integrada. Se comprobó que Antigravity, Explorer y el proceso MCP hijo de `language_server.exe` estaban en la sesión 1. El intento histórico de WPF carece de evidencia de escritorio de entrada, HWND y estado de primer plano. UIPI, foreground y Window Station siguen siendo hipótesis sobre ese intento.

`qap_auth_provision` usa el lanzador STA y el formulario Windows Forms del autorizador interactivo MCP. Requiere la ruta absoluta de una raíz autorizada, el entorno vinculado y el perfil local. El perfil debe corresponder a aplicación, entorno, origen y cuenta, y elegir `keychain`. La operación admite perfiles persistentes de Windows Credential Manager y devuelve un error para los demás proveedores. El botón **Guardar** consiente únicamente la escritura. El host revalida el contexto tras el consentimiento, preserva entradas existentes y devuelve `credential_saved` tras leer internamente el valor de vuelta y comprobar igualdad.

Los diagnósticos locales distinguen arranque del hijo, sesión, estación, escritorio del hilo y de entrada, estado de conexión, HWND, visibilidad del sistema, primer plano, decisión, escritura y lectura verificada. El formulario comprueba que Windows registra una ventana visible, sin cloaking y dentro del área de trabajo del monitor. Estos indicadores sirven para el diagnóstico. La evidencia física requiere confirmación del operador. Si falta el escritorio interactivo devuelve `credential_dialog_desktop_unavailable`. El plazo para presentar la ventana es de 8 s y el plazo de respuesta tras la presentación es de 45 s. Los secretos viajan por una tubería privada del hijo al host. Las respuestas MCP y los diagnósticos solo contienen estados y metadatos.

Referencias de Windows: [OpenInputDesktop](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-openinputdesktop), [funciones de escritorio y estación](https://learn.microsoft.com/en-us/windows/win32/winstation/window-station-and-desktop-functions).

## Verificación

- Compilación del monorepo y recompilación de MCP y CLI. Verificación del catálogo del binario por MCP stdio desde el workspace sintético, incluida la denegación de `user_confirmed` en el payload. El preflight nativo de PowerShell en una ejecución local registró sesión 1, estación `WinSta0`, escritorio `Default`, escritorio de entrada `Default` y conexión activa. La comprobación se ejecutó sin abrir formulario.
- Cuatro suites focales, 31 pruebas. Pruebas de protocolo para rechazo temprano, HWND, cancelación y aceptación. En Chromium local y Windows Credential Manager se verificaron cancelación sin escritura, persistencia, `available (keychain)`, comparación interna del secreto, separación por ámbito, revocación y regresión de `auto`, `reuse` y `handoff`. En estas pruebas la decisión de operador se simuló.
- La suite ampliada ejecutó 43 pruebas, con 42 aprobadas. La prueba antigua E0b de Discovery falló igual en la base y queda fuera de este arreglo.
- La confirmación física del formulario y la secuencia Cancelar, Guardar y recuperar desde una llamada real del MCP de Antigravity quedan pendientes. Estado de aceptación **sin GO**.
- En el primer intento desde Antigravity, `qap_init` del workspace sintético pasó y `qap_auth_provision` devolvió `Tool no reconocida`. El proceso hijo del cliente había arrancado a las 10:48, antes de la compilación de las 12:50. Un proceso nuevo iniciado desde la misma ruta sí anunció la herramienta y procesó una solicitud de validación. El intento de Antigravity terminó antes de llegar al diálogo.

## Continuar en Antigravity

1. Actualiza vNext mediante fast-forward y ejecuta `pnpm build`. Reinicia Antigravity por completo para que vuelva a lanzar `qap-vnext`. En este host la configuración ya apunta a `C:/Users/Judirico/Documents/QAMCP/QAMCP/packages/mcp/dist/server.js`. Si aparece `Tool no reconocida`, comprueba que el proceso Node hijo de Antigravity haya arrancado después de compilar.
2. En el workspace aislado `C:/Users/Judirico/Documents/QAMCP/qap-mcp-p0-synthetic`, llama desde Antigravity a `qap_init` con ese `targetPath` y `baseUrl: https://qap-fixture.invalid`. Llama a `qap_auth_provision` con el mismo `targetPath`, `env: local` y `profile: qap-mcp-p0-synthetic`. Escribe cualquier texto sintético en el formulario y pulsa **Cancelar**. Espera `credential_provision_cancelled` y comprueba `not_configured (keychain)`. Repite solo para **Guardar** y comprueba `credential_saved` y `available (keychain)`. Si hay un fallo físico o técnico, detente con el código y los diagnósticos de esa llamada.
3. Revoca únicamente la entrada sintética con `AuthManager.deleteSecret` y verifica `not_configured (keychain)`. Tras el GO, llama una vez a `qap_auth_provision` para `lendus-qa` con la raíz y el entorno vinculados de Lendus. Después solicita `qap_auth_add` con `method: auto` y el mismo perfil. El consentimiento de login se solicita aparte.
