# P0 · Autorización interactiva de Login y pruebas

11 de noviembre de 2026 · `feat/qap-vnext-architecture`

- Base comprobada y limpia `8e0c27247caa9059149076061843f3f81b9e4fd1`.
- Implementación `75af570cc378f00ee154f4e23a80e71e2706fbdb`. El commit de esta nota completa la entrega.

## Cambios

El bootstrap devolvía `authentication_authorization_required` antes de iniciar Login. Tampoco componía una política de pruebas, y el valor predeterminado `url_contains` del flujo anterior era incompatible con el requisito `selector_present` de Discovery autenticado.

El host usa el diálogo nativo de Windows con el proyecto, el entorno y su revisión, el origen, el perfil y la operación solicitada. Login, Discovery con perfil y ejecución de pruebas piden decisiones independientes por llamada. Para Login, Chromium comprueba el marcador en una ruta protegida con la sesión capturada y descarta la sesión si el mismo marcador resulta visible sin autenticación. La sesión se cifra en la memoria del proceso MCP, queda acotada a su contexto y dura hasta una hora o hasta cerrar el host. Se rechaza `storageState` en llamadas MCP, incluso en el modo con manifiesto anterior.

La ejecución interactiva conserva la revisión canónica de casos y las políticas explícitas del host. Autoriza una instantánea de casos de un módulo, con navegación GET/HEAD al origen consentido, verificación previa de la sesión y evidencia estructurada. La prueba interactiva permite pasos `navigate`, `click`, `assert` y `waitFor`. La evidencia contiene resultados, historial y trazabilidad de casos. El flujo de Discovery autenticado sigue siendo estático y basado en cookies. El handoff y la prueba se limitan a un origen. Los inicios de sesión que redirigen a un proveedor en otro origen requieren una política adicional fuera de este MVP.

El modo con manifiesto mantiene sus permisos existentes. El operador puede habilitar `"interactiveAccess": true` en el manifiesto privado existente para usar el nuevo flujo con módulos y revisiones ya provisionados. El bootstrap permite Login y Discovery; la ejecución canónica todavía requiere un vínculo de módulo y un caso aprobado por el host.

## Validación

| Verificación | Resultado |
| --- | --- |
| `pnpm build` | Compilación y declaraciones generadas. |
| Suite focal | 104 pruebas aprobadas en 11 archivos. Cubre decisiones simuladas, cancelación, expiración, GUI no disponible, intentos de autoautorización, aislamiento de contexto, revisión de casos y regresiones de Workspace y Discovery. |
| Chromium con fixture local y MCP | Navegador y HTTP reales. El fixture envió el formulario y simuló las decisiones humanas. Rechazó el marcador público, verificó el acceso protegido con cookies, ejecutó Discovery anónimo y autenticado, bloqueó una ejecución rechazada sin tráfico y un POST de la ejecución aprobada. La ejecución aprobada guardó evidencia sin el token de prueba. |
| Chromium con política de origen | Prueba local independiente. Chromium siguió la redirección del mismo origen y no envió tráfico al destino externo ni al POST bloqueado. |
| Manifiesto anterior mediante Stdio | `scripts/dev-mvp02-vertical.mjs` completó Discovery, plan, Playwright real, persistencia, cuatro reportes y recuperación después de reiniciar. El fixture cargó su propia sesión desde el host. |
| `pnpm lint` y `pnpm -r exec tsc --noEmit` | Siguen fallando con diagnósticos del repositorio en el código existente y pruebas. ESLint dirigido a los nuevos archivos TypeScript pasó. |
| Windows Forms con operador y Antigravity contra Lendus CORE | Pendiente. El fixture no acredita la interacción humana ni la aceptación de Lendus CORE. |

Se verificó que `packages/playwright-runner/.qa/cache/sessions/admin-user.json` quedó sin diferencias en Git. Las pruebas usaron directorios temporales. Lendus CORE y EXATO Center quedaron fuera de las ejecuciones.

## Continuar Lendus CORE en Antigravity

1. Cierra Antigravity para detener el servidor Stdio anterior. En PowerShell, actualiza y compila el checkout que usará Antigravity.

   ```powershell
   Set-Location 'C:/Users/Judirico/Documents/QAMCP/QAMCP'
   git switch feat/qap-vnext-architecture
   git pull --ff-only origin feat/qap-vnext-architecture
   pnpm build
   ```

2. En la entrada existente del servidor QAP, usa `node` con el argumento `C:/Users/Judirico/Documents/QAMCP/QAMCP/packages/mcp/dist/server.js`. Conserva la configuración del host y la ubicación de Knowledge que pertenecen a ese proyecto. Para ejecutar casos en un host canónico ya provisionado, activa `"interactiveAccess": true` en su manifiesto privado. Abre Antigravity en la sesión gráfica de Windows y comprueba que el arranque informa `interactive_access_authorizer: true` y que el catálogo muestra `verification_route` en `qap_auth_add`.
3. Invoca `qap_status` con `targetPath: "C:/Users/Judirico/Documents/lendus-qap"`. Continúa con la raíz y el entorno registrados para Lendus CORE, cuya URL de staging documentada es `https://staging.lendus.dev/`. En bootstrap, el ID canónico del entorno es `local`.
4. Llama a `qap_auth_add` con ese `targetPath`, el ID de entorno y perfil del plan, `method: "handoff"`, la ruta real de login en `login_route`, y la ruta protegida en `verification_route`. Usa `post_login_condition: { "type": "selector_present", "value": "<selector visible exclusivo de la sesión autenticada>" }`. Si el plan usa un rol diferente al ID del perfil, pasa el rol en `role`. Aprueba en Windows e introduce las credenciales directamente en Chromium. Comprueba `verified: true`. Si la sesión QA sigue en SCOPING, vuelve a enviar su plan de sesión existente con `qap_session_plan`, conservando sus módulos y su configuración de autenticación.
5. Usa `qap_discover` con el mismo perfil cuando necesites la captura autenticada. Para la prueba física selecciona un módulo canónico vinculado y un caso de lectura aprobado, con plan vigente. Llama a `qap_test` con el mismo `targetPath`, `environment`, `module` y `profile`, y aprueba su diálogo por separado. Verifica el `execution_id` persistido y consulta `qap_report` con ese ID. Si el módulo todavía carece de vínculo o revisión de casos, completa ese requisito en el host sobre el Knowledge existente antes de ejecutar.
6. Registra el resultado del operador en Windows y del caso funcional real antes de declarar GO.
