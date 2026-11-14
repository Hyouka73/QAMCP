# P0 de aprovisionamiento local en Windows

El procedimiento para Antigravity está en [APROVISIONAMIENTO-MCP.md](APROVISIONAMIENTO-MCP.md). Este informe conserva la evidencia de la prueba anterior con la CLI.

Base verificada localmente y en `origin/feat/qap-vnext-architecture`: `a6dafbc5a95047f27973400f1db34e8ea7737322`.

## Diagnóstico

El flujo anterior sólo observaba la salida final de `execFile`. El inicio de PowerShell, el renderizado y la falta de respuesta compartían el mismo presupuesto de 120 s. Los errores de proceso se convertían en `UNAVAILABLE`. El código carecía de evidencia para anunciar que la ventana había aparecido.

En Windows, el WPF original se renderizó en una prueba instrumentada con `windowsHide: true` y con `false`. El operador también vio la ventana original iniciada desde Codex. La causa ambiental exacta de la invisibilidad en la corrida histórica de Antigravity queda sin reproducir. El nuevo lanzamiento sigue el patrón del autorizador que funcionó, con `spawn`, PowerShell STA, comprobación de escritorio interactivo y una ventana activada y accesible desde la barra de tareas.

El padre espera hasta ocho segundos por una línea de control emitida desde `ContentRendered`. Sólo entonces informa que WPF presentó la ventana y da hasta 120 s para responder. Salir sin confirmación de renderizado, fallar en el arranque, cancelar y agotar el tiempo de respuesta producen resultados distintos. La CLI confirma el guardado tras el éxito del proveedor. El campo es un `PasswordBox` y el valor aceptado viaja por una tubería privada independiente de las señales de control.

La resolución de `keytar` ocurre desde el módulo de QAP que lo importa. En la CLI empaquetada se usa su dependencia opcional existente. El servidor MCP independiente usa la dependencia opcional de `@qap/auth`. Ambas resuelven a la misma instalación de pnpm en este checkout. Desde `lendus-qap`, con `NODE_PATH` ausente, el addon cargó correctamente. En el sandbox de Codex, Credential Manager devolvió acceso denegado después de cargar el addon. La prueba equivalente en la sesión normal de Windows pasó. Ahora un fallo de carga produce `KEYCHAIN_MODULE_UNAVAILABLE` y un fallo de acceso al llavero produce `UNAVAILABLE`. Se conserva el proveedor explícito y el ámbito de la referencia.

## Verificación

- `pnpm build` y recompilación de auth, MCP y CLI tras ajustar el lanzamiento.
- Seis suites focales de auth, MCP y CLI. 54 pruebas pasaron y una quedó omitida.
- Desde `C:/Users/Judirico/Documents/lendus-qap`, el probe nativo hizo seis comprobaciones con una entrada sintética que eliminó al terminar. `auth list` devolvió `not_configured (keychain)` para `lendus-qa`.
- El nuevo WPF se observó en el escritorio al ejecutar la CLI desde PowerShell integrado en Antigravity IDE. El operador confirmó que vio el campo. Tras cerrarse la ventana, `auth list` seguía devolviendo `not_configured (keychain)` para el perfil sintético aislado. Quedan pendientes el clic explícito en **Cancelar**, la entrada enmascarada seguida de **Aceptar**, la lectura del secreto escrito por ese flujo y la prueba desde el ejecutor de comandos del agente de Antigravity.

## Actualizar y repetir una vez

1. En el checkout de QAP, actualiza la rama `feat/qap-vnext-architecture` con fast-forward, ejecuta `pnpm install --frozen-lockfile` y `pnpm build`.
2. En `mcpServers.qap-vnext`, conserva la configuración privada y verifica que el comando sea `node` con el argumento absoluto `C:/Users/Judirico/Documents/QAMCP/QAMCP/packages/mcp/dist/server.js`. Reinicia Antigravity en el escritorio interactivo.
3. Desde PowerShell en Antigravity, usa el perfil de pruebas existente. Ejecuta una sola vez `set-secret`, escribe la contraseña de prueba en el campo enmascarado y pulsa **Aceptar**.

   ```powershell
   Set-Location 'C:/Users/Judirico/Documents/lendus-qap'
   $qap = 'C:/Users/Judirico/Documents/QAMCP/QAMCP/packages/cli/dist/entrypoint.js'
   node $qap auth set-secret lendus-qa
   node $qap auth list
   ```

4. Comprueba el mensaje de guardado y el estado `available (keychain)`. Si la CLI devuelve `DIALOG_NOT_PRESENTED`, el escritorio no confirmó el renderizado dentro del plazo.
