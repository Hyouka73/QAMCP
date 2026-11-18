# Dictamen Final M-02 / INT-02 — Compuerta Integral de Estabilidad

- **Repositorio:** `Hyouka73/QAMCP` (`QAMCP/`)
- **Rama:** `feat/qap-vnext-architecture`
- **SHA auditado:** `867a823ea95933b6113b048d6c269b627a347e1d` (incluye `dd504448b3f25347f43fa187ea7579418de7308a` y `867a823ea95933b6113b048d6c269b627a347e1d`)
- **Entorno de ejecución:** Windows (`win32`), Node `v22.16.0`, pnpm `11.3.0`, Git `2.47.1.windows.2`, Vitest `v4.1.11`
- **Fecha de corte:** 2026-11-14
- **Referencias:** [05_MATRIZ_MAESTRA_Y_RUTA_CRITICA.md](./05_MATRIZ_MAESTRA_Y_RUTA_CRITICA.md), [06_DIAGNOSTICO_MCP_M02B.md](./06_DIAGNOSTICO_MCP_M02B.md)

---

## 1. Compilación (`pnpm build`)

Ejecutado desde la raíz del monorepo (`exit code 0`): **10 de 10 paquetes** compilados correctamente (`ESM` + `DTS` en los 9 paquetes con declaraciones y `ESM` en `@qap/cli`).

---

## 2. Prueba Integral Oficial (`pnpm -r test`)

Ejecutado desde la raíz sin flags adicionales (`exit code 0`): **10 de 10 paquetes** alcanzados y completados sin abortos, sin errores no manejados y sin procesos Chromium huérfanos.

| Paquete | Archivos | PASS | FAIL | SKIP | Total Tests | Duración |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `@qap/shared` | 19 passed (19) | 174 | 0 | 0 | 174 | 3.15s |
| `@qap/engine` | 14 passed (14) | 265 | 0 | 0 | 265 | 3.45s |
| `@qap/auth` | 7 passed (7) | 51 | 0 | 1 | 52 | 14.43s |
| `@qap/knowledge` | 39 passed (39) | 608 | 0 | 0 | 608 | 16.47s |
| `@qap/playwright-adapter` | 8 passed (8) | 167 | 0 | 0 | 167 | 75.50s |
| `@qap/reporter` | 13 passed (13) | 51 | 0 | 0 | 51 | 5.82s |
| `@qap/git-adapter` | 1 passed (1) | 5 | 0 | 0 | 5 | 10.72s |
| `@qap/playwright-runner` | 20 passed (20) | 105 | 0 | 0 | 105 | 13.93s |
| `@qap/mcp` | 54 passed \| 1 skipped (55) | 657 | 0 | 3 | 660 | 551.77s |
| `@qap/cli` | 16 passed (16) | 105 | 0 | 0 | 105 | 16.92s |
| **Total Monorepo** | **191 passed \| 1 skipped (192)** | **2,188** | **0** | **4** | **2,192** | — |

### Verificación de Puntos Críticos Vigilados
- `packages/knowledge/src/__tests__/replace-gate.test.ts`: **2/2 PASS** (`8950ms`) bajo concurrencia real de `pnpm -r test`, sin `ENOENT` ni `ECOMPROMISED`.
- `packages/playwright-runner/test/session-resolver.test.ts`: **4/4 PASS** (`3641ms`) coincidiendo con `@qap/git-adapter` y demás suites, sin timeout ni fugas de fixtures.
- `packages/mcp/src/__tests__/qap-start.test.ts`: **2/2 PASS** (`16772ms`) con integración real de Chromium, Keychain y Stdio, sin filtración de credenciales ni saturación.
- `git status --short`: árbol de trabajo limpio al finalizar.
- Procesos Chromium huérfanos tras la corrida: `0`.

---

## 3. Comparación con la Auditoría Anterior

- **M-02B (`df1a47f`, `@qap/mcp`):** pasó de `574 PASS / 82 FAIL / 3 SKIP` en paralelo (`619 PASS / 37 FAIL / 3 SKIP` en serial) a **657 PASS / 0 FAIL / 3 SKIP** (`551.77s`). Los `3` skips corresponden al archivo intencionalmente omitido `src/__tests__/interactive-access-browser.test.ts`.
- **Bloqueos de la corrida anterior de `INT-02`:**
  1. `qap_start` (saturación local en Windows Credential Manager): resuelto operativamente sin cambios productivos (`2/2 PASS`).
  2. `@qap/knowledge` (`replace-gate.test.ts` `ENOENT` por limpieza sin drenaje, `dd50444`): resuelto (`608/608 PASS`).
  3. `@qap/playwright-runner` (`session-resolver.test.ts` timeout 5000ms + drenaje de limpieza, `867a823`): resuelto (`105/105 PASS`).

---

## 4. Estado del Typecheck (`tsc --noEmit`)

El typecheck general **NO está aprobado** (`pnpm -r exec tsc --noEmit` falla con salida 2 en el primer paquete con errores). Se clasifica como **deuda histórica preexistente** sin relación con `dd50444` ni `867a823` (ambos archivos modificados tienen `0` errores):

- **Paquetes en verde (`0` errores):** `@qap/shared`, `@qap/engine`, `@qap/knowledge`, `@qap/git-adapter`, `@qap/reporter`, `@qap/cli` (6 de 10 paquetes).
- **Paquetes con deuda histórica (`158` errores totales):**
  - `@qap/auth` (`9` errores en tests): `auto-login.test.ts` (4), `identity-management.test.ts` (5).
  - `@qap/playwright-adapter` (`3` errores en tests): `auth-classification.test.ts` (1), `screenshots.test.ts` (2).
  - `@qap/playwright-runner` (`4` errores en test): `flow-ab-chromium.test.ts` (4).
  - `@qap/mcp` (`142` errores): `7` en `src/` productivo (`guidance.ts`, `conversational-case-workflow.ts`, `plan.handler.ts`, `rule-resolution-handler.ts`, `status.handler.ts`, `host-composition.ts`, `scoped-password.ts`) y `135` en archivos `__tests__` / mocks (`../engine/src/__tests__/mocks/knowledge-store.mock.ts`).

---

## 5. Dictamen Definitivo

- **M-02: COMPLETADO** — Estabilidad de `@qap/knowledge` (`608/608`), `@qap/playwright-runner` (`105/105`) y conciliación/cierre de regresiones de `@qap/mcp` (`657/657` ejecutables, `3` skips intencionales) acreditadas en ejecución real.
- **INT-02: GO** — El monorepo compila los 10 paquetes (`pnpm build`) y ejecuta `pnpm -r test` completo sin abortos ni fallos (`2,188 PASS / 0 FAIL / 4 SKIP`). *(El typecheck estricto `tsc --noEmit` permanece con 158 errores de deuda histórica en 4 paquetes y queda explícitamente fuera de aprobación.)*
