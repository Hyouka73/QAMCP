# VNEXT-014 — Ejecución y resultados verificables

**Rama:** `fix/vnext-014-cierre-controlado` — 2026-11-05.

| Verificación | Resultado de esta intervención |
| --- | --- |
| Inspección de código y contratos | Realizada mediante archivos remotos GitHub; limitada a las rutas afectadas y documentación de base |
| Creación de rama desde SHA comprobado | Realizada |
| Publicación de cambios correctivos y regresiones | Realizada, revisar commits y diff |
| Compilación TypeScript / 10 builds | **NO EJECUTADO** |
| Suite MCP serial por identidad | **NO EJECUTADO** |
| Ocho Memory positivos / negativo sin fence | **NO EJECUTADO** |
| Regresión CF01 y casos anteriores de contención | **NO EJECUTADO** |
| Engine / Knowledge / Runner / CLI | **NO EJECUTADO** |
| ESLint global y diferencial | **NO EJECUTADO** |
| E01 dos corridas paralelas, Windows EPERM | **NO EJECUTADO** |
| SQLite integrity_check, readback físico y cleanup | **NO EJECUTADO** |
| E2E host con revisión humana auténtica | **NO EJECUTADO** |
| Verificación independiente Codex | **PENDIENTE** |

## Baselines históricos, no extrapolables

- Convergencia anterior del autor: 434 PASS / 63 FAIL de 497 MCP seriales, Engine 168/168, Knowledge 260/260, Runner 71/71 y CLI 78/78; otros SHA, otro ejecutor.
- Auditoría R4–R12 previa: 423 PASS / 63 FAIL de 486 para su propio snapshot; 63 identidades preservadas.
- Se exige establecer baseline **nuevo** sobre el HEAD final de esta rama, con resultado por nombre de test y revisión de cualquier PASS→FAIL/FAIL→PASS.

## Comandos mínimos propuestos para Codex

Ejecutar desde raíz del checkout aislado, antes de aportar veredicto:

```powershell
git rev-parse HEAD
git status --short
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm run build
pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-coverage.test.ts --no-file-parallelism
pnpm --filter @qap/mcp exec vitest run src/__tests__/adversarial-r5-guarantees.test.ts --no-file-parallelism
pnpm --filter @qap/mcp exec vitest run --no-file-parallelism
pnpm --filter @qap/engine test
pnpm --filter @qap/knowledge test
pnpm --filter @qap/playwright-runner test
pnpm --filter @hyouka73/qap-cli test
pnpm exec eslint . -f json
```

Para matrices y reproducciones extendidas, seguir [PROMPT_CODEX](PROMPT_CODEX.md). Nunca etiquetar la rama como verde por estas instrucciones no ejecutadas.
