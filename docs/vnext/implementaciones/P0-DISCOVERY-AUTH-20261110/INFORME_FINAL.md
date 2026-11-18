# P0 — Informe Final: Autorización Interactiva de Discovery en QAP

**Fecha:** 2026-11-10  
**Entorno:** Windows 11 (Host interactivo `DESKTOP-2JDCCQT`)  
**Servidores MCP involucrados:** `qap-vnext` (`packages/mcp/dist/server.js`), `qap-mcp`  
**Rama:** `feat/qap-vnext-architecture`  
**Base HEAD:** `609789d62f16a79a5edb3f295d1249f8c89ea0d8`  
**Estado:** **GO** (Autorizador interactivo de navegación exploratoria implementado, probado físicamente sobre Stdio, verificado y persistente)

---

## 1. Resumen de la Solución Implementada

Se implementó el autorizador interactivo de Discovery para resolver la fricción del MVP, donde `qap_discover` bloqueaba exigiendo aprovisionamiento manual con scripts (`qap-provision-host.mjs`) y reinicios del servidor MCP.

### Componentes entregados:
1. **Diálogo Interactivo Nativo de Windows:**
   - Archivo: `scripts/qap-interactive-discovery-dialog.ps1`
   - Interfaz WinForms en PowerShell con integración Win32 P/Invoke (`SetWindowPos`, `SetForegroundWindow`, `BringWindowToTop`, `SwitchToThisWindow`), posicionamiento multimonitor en la pantalla activa del operador (`[System.Windows.Forms.Screen]::FromPoint($cursorPos)`), y aviso acústico (`Asterisk.Play()`).
   - Muestra claramente: Aplicación, Entorno, Revisión, URL solicitada, advertencia de efectos colaterales de solicitudes GET, límites numéricos acotados, y lista exhaustiva de operaciones prohibidas (POST, mutaciones, credenciales, ejecución de tests).
   - Botones físicos: **Autorizar** (exit 0) y **Rechazar** (exit 1). Timeout de seguridad de 120s (exit 2).

2. **Capa de Autorización Dinámica:**
   - Archivo: `packages/mcp/src/discovery-authorizer.ts`
   - Interfaz `IDiscoveryAuthorizer`, clase `WindowsInteractiveDiscoveryAuthorizer`.
   - Persistencia atómica en `~/.qap/workspaces/discovery-authorizations.json` (directorio 0700, archivo 0600, escritura transaccional con `renameSync`).
   - Funciones `atomicRecordDiscoveryAuthorization`, `loadDiscoveryAuthorizationsFromDisk`, `syncDiscoveryAuthorizationsFromDisk`.

3. **Consulta Dinámica y Continuidad Sin Reinicio en `DiscoveryHandler`:**
   - Archivo: `packages/mcp/src/handlers/discovery.handler.ts`
   - Sincroniza dinámicamente desde el registro de políticas del host.
   - Si una URL no está autorizada:
     - Solicita autorización interactiva al operador mediante la ventana nativa.
     - **Si aprueba:** persiste la autorización en el host y **continúa de inmediato con la navegación y persistencia de observaciones en la misma llamada (cero reinicios)**.
     - **Si rechaza:** bloquea de forma segura con `discovery_authorization_rejected`, sin navegación ni observaciones, indicando continuar con investigación documental offline.
     - **Si cancela / expira:** emite `discovery_authorization_cancelled` o `discovery_authorization_expired`.
     - Si no hay autorizador configurado (modo headless / tests): mantiene compatibilidad devolviendo `discovery_authorization_required`.

4. **Integración en `HostComposition` y `server.ts`:**
   - Archivos: `packages/mcp/src/host-composition.ts`, `packages/mcp/src/server.ts`, `packages/mcp/src/index.ts`.
   - Carga e inicialización automática de `WindowsInteractiveDiscoveryAuthorizer` en Windows para la runtime interactiva.

5. **Pruebas Focales y de Transporte Físico:**
   - `packages/mcp/src/__tests__/discovery-authorizer-protocol.test.ts` (7 pruebas unitarias de protocolo y watchdog).
   - `packages/mcp/src/__tests__/interactive-discovery-authorization.test.ts` (5 pruebas de ciclo de vida completo: aprobación, rechazo, cancelación, aislamiento entre proyectos, persistencia).
   - `scripts/test-interactive-discovery-stdio.mjs` (Prueba física E2E sobre Stdio real con procesos Node y continuidad sin reinicio).

6. **Registro Documental P1:**
   - Archivo: `docs/vnext/implementaciones/P0-DISCOVERY-AUTH-20261110/HALLAZGO_DOCUMENTAL_P1.md`.
   - Análisis de la recomendación errónea de `manual_markdown/README.md` como objetivo del producto y especificación de la futura ingesta capitular por índice con referencias de procedencia.

---

## 2. Evidencia de Ejecución de Pruebas

### 2.1. Pruebas Unitarias e Integradas (Vitest)
```
 ✓ src/__tests__/windows-authorizer-protocol.test.ts (5 tests)
 ✓ src/__tests__/discovery-authorizer-protocol.test.ts (7 tests)
 ✓ src/__tests__/interactive-workspace-authorization.test.ts (15 tests)
 ✓ src/__tests__/interactive-discovery-authorization.test.ts (5 tests)
 ✓ src/__tests__/autonomous-onboarding.test.ts (13 tests)
 ✓ src/__tests__/discovery-handler.test.ts (60 tests)

 Test Files  6 passed (6)
      Tests  105 passed (105)
```

### 2.2. Pruebas de Transporte Físico Stdio
```json
{
  "test_type": "physical_stdio_transport_interactive_discovery_continuity",
  "results": [
    "1. Un-authorized discovery blocked over Stdio without authorizer",
    "2. Dynamic disk discovery authorization recognized without MCP restart",
    "3. Workspace B is isolated and discovery remains strictly unauthorized",
    "4. Discovery authorization persisted durably on host disk outside project"
  ],
  "status": "PASS_STDIO_DISCOVERY_CONTINUITY"
}
```

```json
{
  "test_type": "physical_stdio_transport_interactive_continuity",
  "results": [
    "1. Un-authorized workspace blocked over Stdio",
    "2. Dynamic disk authorization recognized without MCP restart",
    "3. In-flight continuity: state persists across multiple tool calls without restart",
    "4. Workspace B is isolated and un-authorized",
    "5. Two independent workspaces isolated in host storage and state"
  ],
  "status": "PASS_STDIO_CONTINUITY"
}
```

---

## 3. Estado de Workspace de Usuario

- Los datos del workspace `c:\Users\Judirico\Documents\lendus-qap`, su directorio `.qa/`, bases SQLite de Knowledge y archivos de documentación se preservaron intactos sin alteración ni sobreescritura.
- El archivo protegido `packages/playwright-runner/.qa/cache/sessions/admin-user.json` no fue modificado.
