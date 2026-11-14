# P0 — Diagnóstico y Arquitectura: Autorización Interactiva de Discovery en QAP

**Fecha:** 2026-11-10  
**Entorno:** Windows 11 (Host interactivo)  
**Servidor MCP:** `qap-vnext`  
**Objetivo:** Permitir la autorización interactiva de navegación exploratoria (Discovery) sin scripts administrativos manuales (`qap-provision-host.mjs`), sin reinicios del servidor MCP y con garantías de seguridad física.

---

## 1. Problema identificado en la experiencia de usuario del MVP

En la aceptación funcional de QAP en `lendus-qap`:
- El workspace fue autorizado interactivamente mediante la ventana nativa de Windows.
- Knowledge v2 se inicializó correctamente y el proyecto transitó de ONBOARDING a SCOPING.
- El usuario registró la URL de entorno `https://staging.lendus.dev/`.
- Al ejecutarse `qap_discover` con `inventario-provisional`, la herramienta retornó:
  ```json
  {
    "status": "blocked",
    "category": "human_authorization",
    "code": "discovery_authorization_required",
    "desbloquear_con": {
      "mecanismo": "local_host",
      "script": "scripts/qap-provision-host.mjs"
    }
  }
  ```
- El servidor exigía que el operador ejecutara fuera de la sesión un script para provisionar un manifiesto privado con `discoveryAuthorization`, configurar el cliente y reconectar el servidor MCP.
- **Impacto:** Esta fricción rompe la promesa de continuidad del MVP, donde el usuario debe interactuar conversacionalmente con QAP y conceder permisos directamente desde la interfaz del host local.

---

## 2. Diagnóstico de componentes existentes

1. **`DiscoveryHandler` (`packages/mcp/src/handlers/discovery.handler.ts`):**
   - Recibía un arreglo estático `authorizations` en su constructor, clonado e inmutable.
   - Cualquier URL no pre-declarada en ese arreglo congelado fallaba inmediatamente en `configurations.length !== 1` con `discovery_authorization_required`.
   - No disponía de un mecanismo de consulta dinámica ni de invocación interactiva al host.

2. **`HostComposition` (`packages/mcp/src/host-composition.ts`):**
   - En modo dinámico sin manifiesto (`QAP_MCP_HOST_CONFIG_PATH === undefined`), configuraba `WindowsInteractiveWorkspaceAuthorizer` para raíces de carpetas, pero no proporcionaba ningún autorizador interactivo para Discovery ni persistía autorizaciones de red fuera del manifiesto estático.

3. **`BlackBoxCrawler` (`packages/playwright-adapter/src/crawler/`):**
   - Requiere un contrato estricto de autorización:
     - `read_only_acknowledged: true`
     - Arreglo exacto de `navigation_urls`
     - Límites numéricos seguros (`max_pages`, `max_requests`, timeouts).
   - Valida en cada salto DNS, IPs públicas/privadas y rutas. No acepta comodines arbitrarios de dominio.

---

## 3. Arquitectura de la Solución Implementada

### 3.1. Interfaz nativa de Windows (`scripts/qap-interactive-discovery-dialog.ps1`)
- Se implementó un script interactivo en PowerShell / Windows Forms que despliega un diálogo nativo en la sesión activa del operador.
- Reutiliza la arquitectura multimonitor probada con P/Invoke Win32 (`SetWindowPos`, `SetForegroundWindow`, `BringWindowToTop`, `SwitchToThisWindow`) para asegurar que la ventana se presente en el monitor activo del operador con aviso acústico (`Asterisk.Play()`).
- Presenta al operador:
  - Aplicación, entorno y revisión vigentes.
  - URL / origen objetivo solicitados.
  - Declaración explícita de navegación observacional (GET).
  - Advertencia obligatoria: *Las solicitudes GET pueden tener efectos colaterales en el servidor*.
  - Límites seguros acotados (máx páginas, máx peticiones, timeout).
  - Prohibiciones estrictas: NO peticiones POST/mutaciones, NO operaciones destructivas, NO autenticación/credenciales, NO ejecución de pruebas.
  - Botones **Autorizar** y **Rechazar**.

### 3.2. Autorizador Interactivo (`WindowsInteractiveDiscoveryAuthorizer`)
- Clase TypeScript en `packages/mcp/src/discovery-authorizer.ts` que implementa `IDiscoveryAuthorizer`.
- Lanza PowerShell sin `-WindowStyle Hidden` y con `windowsHide: false`.
- Monitorea pipes de stdout/stderr registrando eventos de diagnóstico (`discovery_dialog_spawn`, `discovery_dialog_shown`, `discovery_dialog_closed`).
- Timeout de seguridad watchdog a 125 segundos si no hay respuesta.
- Protocolo determinista:
  - Exit 0 + `AUTHORIZED` + `shown` -> `approved`.
  - Exit 1 + `REJECTED` + `shown` -> `rejected`.
  - Exit 2 + `CANCELLED` / `EXPIRED` -> `cancelled`.
  - Exit 3 / spawn fail -> `unavailable`.

### 3.3. Persistencia durable y segura fuera del proyecto
- Las autorizaciones aprobadas se persisten en `~/.qap/workspaces/discovery-authorizations.json`.
- Esta ubicación pertenece al host, con permisos restringidos (0700 directorio, 0600 archivo) y escrituras atómicas mediante archivos temporales con `renameSync`.
- El agente MCP no controla ni puede modificar directamente este archivo a través de argumentos de herramientas.
- Al reiniciar el servidor MCP, las autorizaciones concedidas se recargan automáticamente de disco, garantizando persistencia durable.

### 3.4. Consulta dinámica y continuidad sin reinicio en `DiscoveryHandler`
- `DiscoveryHandler` acepta ahora `authorizer?: IDiscoveryAuthorizer` y `hostDiscoveryRegistryPath?: string`.
- En cada ejecución de `qap_discover`:
  1. Valida el alcance y resuelve la URL objetivo normalizada.
  2. Sincroniza desde el registro en disco para detectar cambios concurrentes o externos.
  3. Si la URL ya está autorizada en la revisión actual, procede a navegar inmediatamente.
  4. Si no está autorizada pero existe un autorizador interactivo:
     - Invoca la ventana del host.
     - **Si el usuario aprueba:** persiste la autorización en disco, actualiza la política activa en memoria y **continúa de inmediato con la navegación y persistencia de observaciones en la misma llamada**.
     - **Si el usuario rechaza:** retorna `discovery_authorization_rejected` sin navegar, sin persistir observaciones ni alterar permisos, instruyendo continuar con investigación documental offline.
     - **Si cancela o expira:** retorna `discovery_authorization_cancelled` o `discovery_authorization_expired`.
  5. Si no hay autorizador configurado (entornos headless/tests automáticos), mantiene compatibilidad estricta devolviendo `discovery_authorization_required`.

---

## 4. Modelo de Confianza y Restricciones de Seguridad

1. **Aislamiento de proyectos:** La autorización está estrictamente vinculada a `projectRoot`, `applicationId`, `environmentId` y `environmentRevision`. Un permiso concedido a un workspace nunca se propaga a otro proyecto.
2. **Restricción de alcance:** Conceder permiso de Discovery NO autoriza ejecución de pruebas (`qap_test`), autenticación (`qap_auth_add`), ni peticiones HTTP de mutación (POST, PUT, DELETE).
3. **Descargo sobre aislamiento de procesos:** Se mantiene explícito que una ventana WinForms constituye una solicitud interactiva de consentimiento humano ante el operador, y no un límite de seguridad rígido (UIPI) frente a procesos que ejecutan bajo el mismo usuario Windows.
