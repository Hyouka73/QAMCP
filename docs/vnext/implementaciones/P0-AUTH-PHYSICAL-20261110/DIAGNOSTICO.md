# P0 — autorizador interactivo: diagnóstico físico, 2026-11-10

Estado de aceptación: PENDIENTE. No se declara GO por pruebas unitarias.

## Causa observada

Antigravity invocó `qap-vnext/qap_status` el 2026-11-10 a las 12:54:14 (America/Mexico_City), con `targetPath = c:\Users\Judirico\Documents\lendus-qap`. Su transcripción local registra la respuesta `workspace_authorization_required` a las 12:54:19.

El proceso real era `node.exe`, PID 77616, padre 47324 (`language_server.exe`, hijo de Antigravity PID 74184), sesión Windows 1. Ejecutaba `C:/Users/Judirico/Documents/QAMCP/qap-vnext-runtime/packages/mcp/dist/server.js`, desde las 12:19:40.9217. El commit `d04234b3028affe38a7f39e0223840855b7f82e3` es de las 12:44:55 y el chunk compilado instalado se escribió a las 12:45:23. El servidor ESM carga su composición al iniciar: ese proceso precedía al commit y a su compilación. Actualizar archivos en disco no actualizó el proceso residente. No existe un identificador de build en aquel proceso para atribuirle un SHA anterior exacto.

Fuentes locales: CIM Win32_Process (consulta limitada a procesos QAP y su padre); `git show -s HEAD`; fecha del chunk `chunk-7JM3TT6R.js`; transcripción `~/.gemini/antigravity/brain/57cb38ba-345c-404e-a222-faa0153e7841/.system_generated/logs/transcript_full.jsonl`, pasos 11 y 12. No se publica la transcripción completa ni configuraciones ajenas.

## Verificación ordenada

1. El checkout sí contenía d04234b; el PID residente anterior a su instalación no lo había cargado.
2. El compilado nuevo contiene `WindowsInteractiveWorkspaceAuthorizer`; su composición efectiva se registra al arrancar, junto con PID y SHA embebido en build.
3. La entrada `qap-vnext` de Antigravity no declara variables de entorno adicionales. Esto no prueba el entorno heredado del proceso antiguo. La nueva composición registra únicamente booleanos: desactivación por flag, entorno test y presencia de manifiesto. Un manifiesto explícito conserva sus raíces restrictivas y no amplía permisos interactivamente.
4. `validateCandidateWorkspace()` del compilado instalado acepta exactamente la ruta enviada; no se creó scaffold para esta comprobación.
5. Desde el chunk en `packages/mcp/dist/`, `../../../scripts/qap-interactive-dialog.ps1` resuelve al script existente en la raíz del runtime.
6. La visibilidad debe observarse en el cliente real. Estar en sesión 1 o emitir el evento WinForms Shown por sí solo no acredita que el usuario vea una ventana.
7. Antes del cambio se descartaba stderr, exit 1 se confundía con rechazo y cancelación/fallo usaban el mismo código. Ahora se exige el protocolo exacto y se distinguen los resultados; un watchdog acota el hijo incluso si el script queda detenido.

## Corrección

Se identifica el build por `serverInfo.version` en initialize MCP y por el anuncio de inicio (PID/SHA/capacidad). El arreglo operativo es recargar el servidor QAP de Antigravity desde su acción Restart; no modificar la política ni ejecutar una autorización automática.

Códigos: `workspace_path_invalid`, `workspace_authorizer_not_configured`, `workspace_gui_unavailable`, `workspace_dialog_start_failed`, `workspace_authorization_cancelled`, `workspace_authorization_expired`, `workspace_authorization_rejected`. Las respuestas no serializan motivos internos ni excepciones. El mecanismo administrativo manual se ofrece únicamente cuando no hay autorizador configurado. La selección de workspace y el manifiesto conservan sus contratos restrictivos.

Los diagnósticos quedan en `~/.qap/diagnostics/<pid>-<uuid>/authorization.jsonl`. En Windows cada carpeta nueva elimina herencia y concede acceso al SID del usuario y SYSTEM; si falla la protección, no se escribe el contenido a stderr como alternativa. Se registran etapas, rutas, PID, códigos de salida y tipos/HResult de error del script; no credenciales, entorno completo ni trazas arbitrarias. En POSIX se usan modos 0700/0600.

PowerShell se lanza en STA y sin ocultar las ventanas del proceso. Escape/cierre son cancelación; solo el botón Rechazar produce rechazo; el temporizador produce expiración. Un fallo PowerShell con exit 1 nunca constituye consentimiento ni rechazo humano.

## Modelo de confianza

La UI pide una decisión humana pero no crea una frontera de seguridad frente a procesos del mismo usuario Windows. Estos pueden compartir permisos de archivos y capacidades de interacción con el escritorio. Las ACL tampoco aíslan al agente si ejecuta con ese mismo SID. No se atribuye a UIPI una separación demostrada: no hay cambio de integridad ni escritorio seguro en este diseño. No se automatizan clics de autorización y no se afirma que un evento Shown demuestre quién actuó.

## Validación

Las pruebas de contrato con authorizers falsos y procesos sintéticos se etiquetan como regresión, nunca evidencia de interfaz gráfica. Se exige observar el diálogo de Antigravity y decisiones manuales, la respuesta de la misma llamada, continuidad tras aprobar y ausencia de `.qa/` y Knowledge tras rechazar. La aceptación final del usuario permanece pendiente hasta que la realice.
