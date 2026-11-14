# Auditoría 04 — Seguridad de Integración Git y PR #17

- **Repositorio:** `Hyouka73/QAMCP` (`QAMCP/`)
- **Rama origen:** `origin/feat/qap-vnext-architecture` (`fd47b84b7346b183c510b0a8278fafd0853a88fb`) → **Rama destino:** `origin/develop`
- **Alcance del diff auditado:** `1,105` archivos cambiados respecto a `origin/develop`
- **Fecha de consolidación:** 2026-11-14
- **Integridad de auditoría:** Inspección exclusivamente de metadatos Git, nombres/rutas de archivo y reglas de exclusión ([.gitignore](../../../../.gitignore) y [.qa/.gitignore](../../../../.qa/.gitignore)). **No** se abrió, leyó, imprimió, copió ni modificó `packages/playwright-runner/.qa/cache/sessions/admin-user.json`, ni se ejecutó ninguna operación destructiva o de reescritura de historial.

---

## 1. Veredicto de la Compuerta de Seguridad

> [!CAUTION]
> **VEREDICTO: NO FUSIONAR (BLOQUEADO POR P0)**
> El PR #17 modifica e incluye un recurso de sesión protegido en el índice Git, mantiene artefactos de runtime `.qa/` rastreados fuera de `.gitignore` por un patrón mal anclado, e introduce `32.92 MB` (`647` archivos) de logs, trazas y reportes de evidencia que evaden las reglas de exclusión.

---

## 2. Hallazgos y Evidencia Original de la Auditoría 04

### 2.1 P0 — Bloqueantes Críticos (Exposición de Sesión y Falla de Exclusión)

1. **Modificación de sesión protegida en el PR (`SEC-P0-01`)**
   - **Ruta:** `packages/playwright-runner/.qa/cache/sessions/admin-user.json` (no leído ni abierto conforme a la restricción de seguridad).
   - **Evidencia:** Marcado como `M` en el diff del PR (`commit 47f17ce`, *INT-01E: prepare isolated two-parent MVP integration candidate (QA pending)*). Su blob cambia de `4f7d473c7ee948db16136535042eba296c82ea17` (en `origin/develop`) a `b36f5d2211aeb83d6f7b4da004a46ed8c401ea0c` (`483` bytes en `origin/feat/qap-vnext-architecture`).
   - **Riesgo:** Publicación/actualización de estado de sesión administrativa en el historial público o compartido del repositorio.

2. **Falla estructural en `.gitignore` para subdirectorios `.qa/` dentro de paquetes (`SEC-P0-02`)**
   - **Ruta:** [.gitignore](../../../../.gitignore#L27-L31) y [.qa/.gitignore](../../../../.qa/.gitignore)
   - **Evidencia verificada en código:** En [.gitignore](../../../../.gitignore#L28-L29), las reglas son:
     ```gitignore
     .qa/*
     !.qa/definitions/
     ```
     En Git, cuando un patrón contiene una barra (`/`) que no está al final, Git lo ancla exclusivamente a la raíz del repositorio (`/.qa/*`). Verificado con `git check-ignore --no-index -v`: rutas en subpaquetes como `packages/playwright-runner/.qa/cache/sessions/admin-user.json`, `packages/playwright-runner/.qa/reports/screenshots/...` y `packages/playwright-runner/.qa/executions/...` **no coinciden** con ninguna regla de exclusión.
   - **Riesgo:** Cualquier ejecución local de pruebas o runner dentro de `packages/*/` puede volver a exponer sesiones, locks, capturas o ejecuciones en futuros commits.

3. **Otros artefactos de runtime `.qa/` rastreados, heredados de `origin/develop` (`SEC-P0-03`)**
   - **Rutas rastreadas en el índice Git:**
     - `packages/playwright-runner/.qa/cache/sessions/test-user.json` (`497` bytes)
     - `packages/playwright-runner/.qa/cache/locks/demo-module.target` (`0` bytes)
     - `packages/playwright-runner/.qa/cache/locks/protected-module.target` (`0` bytes)
     - `packages/playwright-runner/.qa/reports/screenshots/failure_case-dashboard_1792519357346.png` (`5,676` bytes)
     - `packages/playwright-runner/.qa/reports/screenshots/failure_case-dashboard_1792520538456.png` (`5,676` bytes)
   - **Riesgo:** Permanecen en el árbol versionado del PR y perpetúan el acoplamiento de estado efímero/sesiones en Git.

---

### 2.2 P1 — Riesgo Alto (Evasión de `.gitignore`, Artefactos de Ejecución y Datos Operativos)

1. **179 archivos `.log` forzados al índice pese a `*.log` en `.gitignore` (`SEC-P1-01`)**
   - **Rutas:** `docs/vnext/implementaciones/*/evidencia/*.log` y `docs/vnext/integracion/**/evidencia/*.log` (p. ej. `docs/vnext/implementaciones/VNEXT-014-E01/evidencia/build.log`, `docs/vnext/implementaciones/VNEXT-014-CIERRE-CONTROLADO/evidencia/baseline-physical-mcp.log`, `docs/vnext/integracion/evidencia/DEV-MVP-02/host-review-cli.log`, `docs/vnext/integracion/evidencia/INT-03-R5/r5-host-final.log`).
   - **Evidencia:** `git check-ignore --no-index -v` confirma que `*.log` ([.gitignore](../../../../.gitignore#L14)) sí los cubre, por lo que fueron añadidos forzadamente (`git add -f`).
   - **Riesgo:** Fuga de rutas locales de máquina, hostnames, salidas de depuración MCP y trazas operativas.

2. **647 archivos de evidencia/trazas en `docs/vnext/` (`32.92 MB` totales) (`SEC-P1-02`)**
   - **Rutas destacadas:**
     - **99 trazas comprimidas `.jsonl.gz`:** `docs/vnext/implementaciones/VNEXT-014-E01/evidencia/*-stages/*.jsonl.gz` y `docs/vnext/implementaciones/VNEXT-014-E01/r5/*-stages/*.jsonl.gz` (hasta ~`413 KB` c/u).
     - **Inventarios de identidades, host y registro local:** `docs/vnext/implementaciones/VNEXT-014-E01/r6-a/identity-register.json` (`429 KB`), `docs/vnext/implementaciones/VNEXT-014-TEST-MODERNIZATION/evidencia/r3-2026-11-06/identity-inventory.json`, `docs/vnext/implementaciones/P0-ONBOARDING-20261110/evidencia/codex-registration.json`, `docs/vnext/integracion/CONSOLIDACION_VNEXT_2026-11-10/evidencia/admin-final-verification.json`, `docs/vnext/integracion/CONSOLIDACION_VNEXT_2026-11-10/inventory.json`, y múltiples `*-host.json`.
     - **Reportes HTML/XML/JSONL y capturas:** `docs/vnext/integracion/CONSOLIDACION_VNEXT_2026-11-10/evidencia/{execution.report.html,execution.report.xml,screenshot-0.png,.gitattributes}` y `docs/vnext/integracion/evidencia/DEV-MVP-02/{execution.report.html,execution.report.xml,history.jsonl,screenshot-0.png,.gitattributes}`.
   - **Riesgo:** Además de inflar el repositorio con artefactos efímeros de ejecución, metadatos como `admin-final-verification.json` exponen rutas absolutas del entorno local de Windows (`C:\Users\Judirico\...`) y referencias a worktrees locales.

3. **Artefactos `.playwright-mcp/` y `.agents/` aún rastreados tras actualizar `.gitignore` (`SEC-P1-03`)**
   - **Rutas:**
     - `packages/playwright-adapter/.playwright-mcp/page-2026-09-*.yml` (`27` archivos, heredados de `origin/develop`).
     - `.agents/skills/minimalist-clean-ui/SKILL.md` (heredado de `origin/develop`).
   - **Evidencia:** El PR añade `.agents/` a [.gitignore](../../../../.gitignore#L34) (y `.playwright-mcp/` ya estaba en la línea 30), pero añadir una regla a `.gitignore` **no deja de rastrear** archivos que ya están en el índice Git.

---

### 2.3 P2 — Riesgo Bajo / Higiene y Falsos Positivos Verificados

1. **Scripts operativos locales en `scripts/` y `docs/vnext/` (`SEC-P2-01`):**
   - Se añaden `17` archivos `.ps1` (incluidos `scripts/qap-interactive-auth-dialog.ps1`, `scripts/qap-interactive-dialog.ps1`, `scripts/qap-interactive-discovery-dialog.ps1`, `scripts/qap-interactive-test-dialog.ps1`) y utilidades como `scripts/qap-authorize-workspace.mjs`, `scripts/qap-provision-host.mjs` y `packages/auth/scripts/verify-keychain.mjs`. Conviene revisar que no contengan rutas locales hardcodeadas ni parámetros de entorno interno.
2. **Cobertura incompleta de artefactos runtime en `.gitignore` (`SEC-P2-02`):**
   - Faltan patrones globales como `**/.qa/*`, `!**/.qa/definitions/`, `*.jsonl.gz`, `*.sqlite*`, `*.db`, `playwright-report/`, `blob-report/`, `test-results/`.
3. **Falso positivo verificado (no es fuga de credencial real):**
   - `packages/playwright-adapter/test/fixtures/recon-tls/test-only.key` (`1,704 B`) y `test-only.pem` (`1,241 B`). Según [README.md](../../../../packages/playwright-adapter/test/fixtures/recon-tls/README.md), es una pareja clave/certificado autofirmada sintética (`CN=recon.test/O=QAP Synthetic Test Only`) usada exclusivamente en pruebas locales de `tls_ca`.

---

## 3. Estrategia de Saneamiento Reconciliada (Sin Borrar Disco Local ni Reescribir Historial en vNext)

### 3.1 Pasos para Corregir el `HEAD` del PR (cuando se autorice ejecutar la tarea de saneamiento)
1. **Actualizar [.gitignore](../../../../.gitignore) primero** para cubrir `.qa/` en cualquier profundidad del monorepo y artefactos de evidencia/runtime:
   - Reemplazar `.qa/*` y `!.qa/definitions/` por `**/.qa/*` y `!**/.qa/definitions/`.
   - Añadir `*.jsonl.gz`, `*.sqlite*`, `*.db`, `playwright-report/`, `blob-report/`, `test-results/`.
2. **Desindexar sin borrar del disco (`git rm --cached`)** en un commit sobre `feat/qap-vnext-architecture`:
   - `git rm --cached -r packages/playwright-runner/.qa/` (conserva intacto `admin-user.json`, `test-user.json`, locks y capturas en el disco local; además, `packages/mcp/src/__tests__/canonical-coverage.test.ts` solo valida la cadena de ruta y no requiere que el archivo esté versionado).
   - `git rm --cached` sobre los `27` archivos de `packages/playwright-adapter/.playwright-mcp/` y `.agents/skills/minimalist-clean-ui/SKILL.md` (si `.agents/` debe permanecer local).
   - `git rm --cached` sobre los artefactos efímeros pesados añadidos en `docs/vnext/**/evidencia/` (`*.log`, `*.jsonl.gz`, `*.png`, `execution.report.*`, `history.jsonl`, inventarios de identidades/host), preservando los informes Markdown (`.md`) y manifiestos acordados de trazabilidad si se requieren sin datos sensibles.
3. **Verificar el índice limpio** antes de subir al PR:
   - Confirmar que `git ls-tree -r --name-only HEAD` no contenga `.qa/cache/`, `.qa/reports/`, `.log` ni `.jsonl.gz`, y que los archivos locales en disco sigan presentes e intactos.

### 3.2 Saneamiento en `HEAD` vs. Exposición Histórica en Objetos Git

| Ámbito | Alcance del saneamiento en `HEAD` (`git rm --cached` + `.gitignore`) | Exposición histórica (no resuelta por `HEAD`) | Tratamiento separado requerido |
| :--- | :--- | :--- | :--- |
| **`admin-user.json` y `test-user.json`** | Dejan de distribuirse en `HEAD` tras el merge y quedan protegidos contra futuros commits en cualquier subpaquete. | El blob original (`4f7d473...` en `develop`, commits `81aa770`, `c875a68`, `f416616`) y el blob modificado (`b36f5d2...` en `47f17ce`) **siguen existiendo en el historial Git**. | **1. Obligatorio:** Rotar/revocar inmediatamente cualquier sesión, cookie o token contenido en `admin-user.json` (y `test-user.json`) en los entornos objetivo.<br>**2. Opcional (fuera de este PR):** Purga de historial (`git filter-repo --invert-paths` + `push --force-with-lease` coordinado + GC en GitHub). |
| **Logs, `.jsonl.gz`, reportes y `.playwright-mcp/`** | Se eliminan del árbol final (`HEAD`) y se reduce el tamaño/superficie del PR. | Los blobs ya subidos a commits previos de `feat/qap-vnext-architecture` (y `.playwright-mcp/` en `develop`) permanecen en el historial de objetos. | Si alguno de los logs o `identity-register.json` / `codex-registration.json` contuvo un secreto real, aplicar rotación de credenciales y, de ser necesario, `git filter-repo` separado. |
