# AGENTS.md — Guía para IAs: levantar el MCP de QAP en local

> Si eres una IA y el usuario te pidió "instalar/levantar/configurar el MCP en local", sigue estos pasos EN ORDEN. No saltes la verificación (paso 4).

## Contexto
- Monorepo **pnpm workspaces** (TypeScript, ESM). Servidor MCP en `packages/mcp` (`@qap/mcp`), transporte **Stdio**.
- Binario: `packages/mcp/dist/server.js` (bin `qap-mcp`). Alternativa equivalente: `node packages/cli/dist/entrypoint.js mcp`.
- Raíz del repo = carpeta que contiene `pnpm-workspace.yaml` (ejecuta todos los comandos desde ahí).

## 1. Prerrequisitos (verifica, no asumas)
```bash
node -v    # >= 18 (recomendado 20 LTS)
pnpm -v    # >= 8   (si falta: npm install -g pnpm)
git --version
```
Si falta algo, instálalo o pide al usuario que lo haga antes de continuar.

## 2. Instalar dependencias
```bash
pnpm install
```

## 3. Compilar (obligatorio: el MCP corre desde `dist/`)
```bash
pnpm build
```
Confirma que existen `packages/mcp/dist/server.js` y `packages/cli/dist/entrypoint.js`. Si no, la compilación falló: lee el error y corrígelo antes de seguir.

## 4. Verificar que el servidor responde
```bash
node scripts/test-mcp-stdio.mjs
```
Éxito = imprime la lista de tools y `SERVIDOR MCP FUNCIONANDO AL 100% SOBRE STDIO`.
> Nota: este script invoca `qap_init` (crea archivos de prueba `mcp-live-test` en el cwd). Revisa `git status` y no commitees residuos.

## 5. Registrar el MCP en el cliente (Claude Desktop, Cursor, Antigravity, etc.)
Usa **ruta absoluta** al `server.js` de esta máquina:

```json
{
  "mcpServers": {
    "qap-mcp": {
      "command": "node",
      "args": ["<RUTA_ABSOLUTA_REPO>/packages/mcp/dist/server.js"]
    }
  }
}
```
- Windows: usa `\\` o `/` en la ruta JSON.
- Reinicia el cliente para que cargue el servidor.

### Solo Antigravity IDE (opcional)
`scripts/sync-mcp-schemas.mjs` tiene una ruta **hardcodeada** (`targetDir`). Cámbiala a la del usuario actual antes de ejecutar:
```bash
node scripts/sync-mcp-schemas.mjs
```

## 6. Reglas al USAR las tools (`qap_*`)
1. **Siempre** envía `targetPath` = ruta absoluta del workspace del usuario a probar (nunca omitirlo).
2. Una sola pregunta por turno; no generes muros de texto ni listas de pasos futuros.
3. No llames `qap_rules_set` con datos no confirmados por el usuario.
4. Si una tool responde `status: "blocked"`, sigue `desbloquear_con`; no la rodees.
5. Hipótesis DOM (`source: "dom"`, `status: "inferred"`): confirma con el usuario antes de marcarlas `confirmed`.
6. `qap_module_close` solo con confirmación explícita (`user_confirmed: true`).
7. Waivers solo si el usuario dijo que la categoría no aplica (razón ≥ 15 caracteres).
8. Más detalle en `scripts/sync-mcp-schemas.mjs` (genera `instructions.md`).

## 7. Troubleshooting rápido
| Síntoma | Causa probable | Solución |
|---|---|---|
| `Cannot find module .../dist/...` | No se compiló | `pnpm build` |
| El cliente no ve el servidor | Ruta relativa o cliente sin reiniciar | Ruta absoluta + reiniciar |
| Tools operan en carpeta equivocada | Falta `targetPath` | Enviar siempre `targetPath` |
| Errores de Playwright/navegador | Falta navegador | `npx playwright install chromium` |

## 8. Comandos útiles
```bash
pnpm test                      # tests de todos los paquetes
pnpm lint                      # ESLint
pnpm --filter @qap/mcp dev     # compilar MCP en modo watch
pnpm release:check             # validaciones previas a release
```
