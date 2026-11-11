# Validación P0 · Credential Vault

11 de noviembre de 2026 · Windows, Node v24.15.0, pnpm 12.3.4

- Base comprobada en Git local y remoto: `1f414b09d8b4a09221f94f4d40438f51c1fb7fcd`.
- Implementación probada: `1e566cd4c2fa3e0bb6bf8538faaa40c864fffb60`.
- Archivo protegido `packages/playwright-runner/.qa/cache/sessions/admin-user.json`: blob Git y copia local con el mismo hash `b36f5d2211aeb83d6f7b4da004a46ed8c401ea0c`. El caché nuevo usa un directorio propio. El diff de entrega no contiene Knowledge, sesiones existentes, Lendus CORE, EXATO Center ni cambios de rama a `develop`.

| Comprobación | Resultado |
| --- | --- |
| `pnpm build` | PASS. Compilación completa, incluidas declaraciones MCP y binario CLI. |
| ESLint con `--max-warnings=0` | PASS en los archivos TypeScript y JavaScript modificados. |
| `tsc --noEmit` en Auth, Runner y CLI | PASS. |
| `tsc --noEmit` general de MCP | El baseline ya fallaba. Permanecen diagnósticos de suites antiguas y los preexistentes en `guidance.ts`, `status.handler.ts` y `host-composition.ts`. Sin diagnósticos en los módulos y pruebas nuevos. |
| Suites de MCP y autorizadores Windows | 61/61 en siete archivos, más 1/1 en el caso focal de rechazo sin host interactivo. |
| Auth, CLI y resolvedor | Auth 39 aprobadas, una omitida por configuración. CLI 7/7, resolvedor 4/4. |
| Windows Credential Manager | PASS, 6 comprobaciones de alta, lectura, actualización y borrado de una entrada sintética. El recorrido automático también leyó el proveedor real y verificó aislamiento por raíz, aplicación, entorno, cuenta y perfil. |
| Chromium, fixture HTTP y MCP | PASS para contraseña con selectores no genéricos, intercambio Bearer y handoff. Se rechazó un OTP visible antes de enviar credenciales y un marcador visible anónimamente. Se verificó reutilización sin nuevo POST, recuperación desde caché cifrado al crear otro host MCP, rechazo sin clave, revocación en el servidor y reautenticación. |
| Discovery autenticado y `qap_test` | PASS sobre el fixture. Discovery usó cookies. Test rechazado no generó tráfico, Test aprobado pasó y su POST fue bloqueado. Respuestas MCP, consola, caché y evidencia de ejecución se comprobaron con valores sintéticos. |
| Stdio con el binario compilado | PASS. El catálogo ofrece `auto/reuse/handoff`. El servidor rechazó el argumento de contraseña sin devolver el valor sintético. |
| CLI compilada | PASS. Rechaza la ruta posicional antigua y `--secret=…` sin imprimir el valor sintético. El parser de Windows PowerShell aceptó el script fijo del diálogo. La prueba unitaria de aprovisionamiento sustituye la entrada humana y comprueba el guardado y la cancelación. |

## Reproducción focal

```powershell
pnpm build
node packages/auth/scripts/verify-keychain.mjs
pnpm --filter @qap/auth test
pnpm --filter @hyouka73/qap-cli test src/__tests__/auth-commands.test.ts
pnpm --filter @qap/playwright-runner exec vitest run test/session-resolver.test.ts
$env:QAP_INTERACTIVE_BROWSER_FIXTURE='1'
pnpm --filter @qap/mcp test src/__tests__/interactive-access.test.ts src/__tests__/interactive-access-browser.test.ts src/__tests__/interactive-workspace-authorization.test.ts src/__tests__/windows-authorizer-protocol.test.ts src/__tests__/discovery-authorizer-protocol.test.ts src/__tests__/dispatcher-integration.test.ts src/__tests__/autonomous-onboarding.test.ts
pnpm --filter @qap/mcp test src/__tests__/server.test.ts -t 'bloquea el login'
```

La prueba de autorización de Discovery que consulta una URL de staging externa agotó el timeout y su hook en una corrida anterior. Los recorridos locales de Discovery pasaron. Las suites focales de autenticación ejecutaron fuera del sandbox después de que el entorno restringido devolviera EPERM en renames de Vitest y limitara el acceso a Credential Manager. No se ejecutó la suite completa del monorepo. Algunos fixtures históricos de P4-4 y P4-5A2 aún representan el flujo anterior mediante contraseñas MCP y hooks de handoff sin consentimiento del host. El contrato nuevo prueba el rechazo de esa entrada y cubre el reemplazo en Chromium.

**Aceptación pendiente.** Chromium, el servidor HTTP y Windows Credential Manager fueron reales. Los consentimientos y la interacción de handoff del fixture se simularon. Falta que un operador complete el diálogo de aprovisionamiento y ejecute el caso autorizado desde Antigravity contra Lendus CORE. Esta entrega no certifica GO de ese recorrido.
