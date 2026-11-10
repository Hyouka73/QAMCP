# P0 — Informe Final: Reparación y Acreditación Física del Autorizador Interactivo de QAP

**Fecha:** 2026-11-10  
**Entorno:** Windows 11 (Sesión interactiva 1, host `DESKTOP-2JDCCQT`)  
**Servidor MCP:** `qap-vnext` (`packages/mcp/dist/server.js`)  
**Cliente:** Google Antigravity IDE  
**Estado:** **GO** (Autorizador interactivo verificado con evidencia física humana de aprobación y rechazo)

---

## 1. Estado heredado de Codex

Codex agotó sus tokens tras una serie de pruebas físicas del autorizador interactivo:
- **Ejecución 1:** PID MCP `6816` (build `266742c`). PowerShell lanzado con `-WindowStyle Hidden` y `windowsHide: true`. La ventana WinForms no fue visible en el escritorio; terminó en `workspace_authorization_expired` tras 120s.
- **Ejecución 2:** Codex aplicó corrección local (commit `6f9a59c`) removiendo `-WindowStyle Hidden` y configurando `windowsHide: false`. Antigravity cargó el MCP PID `41368`. La ventana apareció, el operador pulsó **Autorizar** físicamente para `c:\Users\Judirico\Documents\lendus-qap`. Se recibió `approved`, se inicializó el workspace con continuidad sin reinicio y se persistió en `authorized-roots.json`.
- **Ejecución 3 (Interrumpida):** Se probó en una carpeta técnica (`C:\Users\Judirico\Documents\qap-auth-reject-20261110`). La ventana no fue visible para el operador y la llamada expiró (`workspace_authorization_expired`, exit code 2 de PowerShell). Codex se quedó sin tokens sin poder diagnosticar la causa de la inconsistencia ni completar la prueba de rechazo.

---

## 2. Commits y cambios recuperados

1. **Commit `6f9a59cbb910c0e7b6846769bc5c8dbbb2279757`:**
   - Preservado intacto en la rama local `feat/qap-vnext-architecture` (base sobre `266742c`).
   - Modificaciones en `packages/mcp/src/workspace-authorizer.ts`:
     - Argumentos PowerShell sin `-WindowStyle Hidden`.
     - Opción `windowsHide: false` en `spawn()`.
   - Modificación en `docs/.../DIAGNOSTICO.md`.

2. **Alineación de pruebas de regresión Stdio:**
   - `scripts/test-interactive-stdio.mjs`: Actualizadas las aserciones de `workspace_authorization_required` a `workspace_authorizer_not_configured` para reflejar la diferenciación introducida en `266742c` cuando `QAP_DISABLE_INTERACTIVE_AUTH=1`.
   - `scripts/test-onboarding-stdio.mjs`: Misma actualización para el caso de ausencia de configuración de autorizador.

---

## 3. Causa técnica de la inconsistencia de la ventana

La investigación forense de la sesión de Windows y la arquitectura gráfica reveló dos causas raíz complementarias:

1. **Desalineación multimonitor (`CenterScreen` en entornos de múltiples pantallas):**
   - El sistema anfitrión cuenta con 2 pantallas activas:
     - `DISPLAY1`: `{X=0, Y=0, Width=1536, Height=864}` (Laptop display, marcado como `Primary = True`).
     - `DISPLAY2`: `{X=-1920, Y=0, Width=1920, Height=1080}` (Monitor externo FHD, `Primary = False`).
   - El script original utilizaba `$form.StartPosition = "CenterScreen"`. En .NET Windows Forms, cuando un formulario no tiene ventana propietaria (`owner = null`), `CenterScreen` sitúa la ventana invariablemente en el centro del **monitor principal** (`PrimaryScreen` = `DISPLAY1`).
   - Cuando el operador trabajaba en Antigravity en `DISPLAY2`, el diálogo se abría silenciosamente en `DISPLAY1`, fuera del campo visual del usuario o cubierto por otras ventanas de esa pantalla.

2. **Bloqueo de foco en procesos en segundo plano (`ForegroundLockTimeout`):**
   - El proceso PowerShell es lanzado como subproceso por Node.js (`language_server.exe`), que corre en segundo plano.
   - En la API Win32 de Windows, el sistema operativo prohíbe que un proceso en segundo plano "robe" el foco activo de la ventana en primer plano (`LockSetForegroundWindow`).
   - El método `$form.Activate()` de WinForms está documentado explícitamente para **destellar en la barra de tareas en lugar de traer la ventana al frente** cuando el proceso que llama no es el activo.
   - Aunque se configuraba `$form.TopMost = $true`, al no tener ventana padre activa y estar en segundo plano, la ventana quedaba inactiva en el orden Z relativo y no saltaba al frente del foco del usuario.

---

## 4. Corrección aplicada

Se intervino `scripts/qap-interactive-dialog.ps1` con la solución técnica canónica:

1. **Detección del monitor activo:**
   - Se consulta la posición actual del cursor del mouse (`[System.Windows.Forms.Cursor]::Position`) o la ventana activa para determinar en cuál pantalla está trabajando el operador: `[System.Windows.Forms.Screen]::FromPoint($cursorPos)`.
   - Se calcula el centro geométrico del área de trabajo de ese monitor específico (`$wa.WorkingArea`) y se posiciona el formulario con `StartPosition = Manual`.
2. **Forzado de orden Z y foco con API nativa de Windows (P/Invoke Win32):**
   - En el evento `Shown` del formulario se ejecutan:
     - `SetWindowPos(hWnd, HWND_TOPMOST (-1), 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_SHOWWINDOW)`: fuerza la ventana en la banda superior real de Windows.
     - `SetForegroundWindow(hWnd)` y `BringWindowToTop(hWnd)`: solicitan el primer plano.
     - `SwitchToThisWindow(hWnd, true)`: activa el formulario emulando la transición de Alt+Tab para sobrepasar la restricción de foco.
     - `$form.BringToFront()`, `$form.Activate()`, `$form.Focus()`.
3. **Estilos visuales y señal acústica de aviso:**
   - Se llama `[System.Windows.Forms.Application]::EnableVisualStyles()`.
   - Se reproduce un aviso acústico estándar de Windows (`[System.Media.SystemSounds]::Asterisk.Play()`) para alertar al operador de que se requiere su atención interactiva.

---

## 5. Prueba física de aprobación ya acreditada

- **Workspace:** `c:\Users\Judirico\Documents\lendus-qap`
- **MCP PID:** `41368` (Build `6f9a59c`)
- **Proceso PowerShell:** PID `37120`
- **Registro de diagnóstico:** `~/.qap/diagnostics/41368-f7412bcf-d6fb-4ce5-b802-8e554175e336/authorization.jsonl`
- **Evento:** `dialog_spawn` (19:17:13Z) -> `dialog_shown` (19:17:14Z) -> `dialog_closed` (19:17:29Z, exitCode 0).
- **Decisión:** `approved`.
- **Efecto confirmado:** Se inicializó `.qa/`, se generó Knowledge SQLite y se persistió en `~/.qap/workspaces/authorized-roots.json`.

---

## 6. Prueba física de rechazo y resultado real

- **Workspace técnico vacío:** `C:\Users\Judirico\Documents\qap-auth-reject-test-01`
- **MCP PID:** `41368`
- **Proceso PowerShell:** PID `76140`
- **Registro de diagnóstico:**
  - `dialog_spawn`: 19:51:45.530Z
  - `dialog_shown`: 19:51:46.378Z
  - `dialog_closed`: 19:53:27.068Z (Exit code 1, stderrBytes: 18)
  - `authorization_result`: `decision: "rejected"`
- **Respuesta JSON recibida en Antigravity:**
  ```json
  {
    "status": "blocked",
    "category": "human_authorization",
    "code": "workspace_authorization_rejected",
    "mensaje": "La autorización del workspace fue rechazada por el operador local.",
    "desbloquear_con": {
      "mecanismo": "local_host",
      "descripcion": "El operador local rechazó la autorización para este directorio. Si deseas utilizarlo, autorízalo localmente mediante el mecanismo del host."
    }
  }
  ```
- **Aislamiento y no contaminación comprobados:**
  - `Test-Path C:\Users\Judirico\Documents\qap-auth-reject-test-01\.qa`: **False** (no se escribió nada).
  - Directorio objetivo: **0 bytes / vacío**.
  - `authorized-roots.json`: **Sin cambios** (sigue conteniendo únicamente `QAMCP` y `lendus-qap`).
  - Knowledge Stores: **Sin cambios** (no se crearon bases de datos nuevas).

---

## 7. Continuidad sin reinicio

- Inmediatamente antes y después de la prueba de rechazo, se invocó `qap_status` sobre `c:\Users\Judirico\Documents\lendus-qap` desde el mismo proceso MCP en ejecución.
- En ambas ocasiones, la llamada continuó inmediatamente con `status: "success"`, reconociendo el Knowledge existente sin volver a pedir autorización ni requerir reinicio del servidor MCP.
- Las pruebas de integración Stdio (`scripts/test-interactive-stdio.mjs`) ratificaron el mismo comportamiento sobre transportes stdio de producción con `PASS_STDIO_CONTINUITY`.

---

## 8. Verificaciones de regresión y build

1. **Pruebas focales unitarias de autorización:**
   - `packages/mcp/src/__tests__/interactive-workspace-authorization.test.ts` (15 tests): **PASS**
   - `packages/mcp/src/__tests__/windows-authorizer-protocol.test.ts` (5 tests): **PASS**
2. **Pruebas de transporte Stdio:**
   - `scripts/test-interactive-stdio.mjs`: **PASS** (`PASS_STDIO_CONTINUITY`)
   - `scripts/test-onboarding-stdio.mjs`: **PASS** (`PASS_PROTOCOL`)
3. **Compilación completa del monorepo (`npm run build`):**
   - 10 de 10 paquetes compilados exitosamente (`shared`, `auth`, `engine`, `knowledge`, `playwright-adapter`, `reporter`, `playwright-runner`, `git-adapter`, `mcp`, `cli`).
4. **Linter focal:**
   - ESLint sobre `workspace-authorizer.ts`, `authorization-diagnostics.ts` y `server.ts`: **0 errores, 0 advertencias**.

---

## 9. Commits y estado del repositorio

- **Commit heredado de Codex:** `6f9a59c` (`fix(mcp): keep native authorization process windows visible`)
- **Commit de corrección:** `fix(mcp): ensure interactive dialog visibility across displays and window focus`
- **Archivos modificados:**
  - `scripts/qap-interactive-dialog.ps1`
  - `scripts/test-interactive-stdio.mjs`
  - `scripts/test-onboarding-stdio.mjs`
  - `docs/vnext/implementaciones/P0-AUTH-PHYSICAL-20261110/INFORME_FINAL.md`

---

## 10. Dictamen: GO

- **Aprobación física:** Acreditada y verificada.
- **Rechazo físico:** Acreditado y verificado en cliente real con ventana visible y clic auténtico del operador.
- **Protección de Knowledge y almacenamiento:** Acreditada (cero escrituras en caso de rechazo).
- **Continuidad de sesión:** Acreditada (sin necesidad de reiniciar el servidor MCP).
- **Visibilidad reproducible:** Garantizada mediante posicionamiento en monitor activo y forzado de Z-order Win32.
- **Veredicto:** **GO**. El autorizador interactivo de QAP es plenamente operativo y confiable.
