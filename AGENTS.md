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

### Operación multiproyecto global y selección del workspace

- En uso normal, QAP corre como un **único servidor MCP global y multiproyecto**: no exige `QAP_MCP_WORKSPACE_ROOT` en `mcp_config.json` y puede iniciar aunque no haya proyectos previos o aunque una carpeta histórica haya sido eliminada.
- Si el host anuncia una única raíz mediante MCP `roots/list`, QAP resuelve esa carpeta automáticamente. Si el host anuncia varias raíces o no anuncia ninguna (por ejemplo, Antigravity), QAP solicita una selección explícita sin adivinar ni reutilizar proyectos históricos.
- La autorización persistente de una carpeta nueva se realiza mediante el diálogo nativo del host (cuando está habilitado) o desde el operador local con `node scripts/qap-authorize-workspace.mjs "<ruta-absoluta>"`, usando los mismos directorios de datos del servidor MCP.
- Para cambiar de proyecto dentro de la misma sesión (`A -> B -> A`), no reinstales ni edites la configuración del MCP: inicia o cambia explícitamente con `qap_start` (`targetPath`) o con `qap_project` (`action: "select"` / `"resume"`). Cada proyecto mantiene su propia identidad, credenciales, bitácoras y carpeta `.qa/`.
- Para retomar una campaña previa usa `qap_project` con `action: "resume"` y su `project_id` (o su `targetPath`). Para abrir o continuar una conversación aislada dentro de un proyecto usa `qap_start` y conserva el `conversation_id` devuelto por el servidor.
- **Modo restringido opcional**: solo si deseas fijar una conexión MCP a una sola carpeta, configura `QAP_MCP_WORKSPACE_ROOT` en `env`. Cuando el host anuncia raíces, esa ruta también debe figurar en `roots/list`. Si dicha carpeta deja de existir, el acceso queda bloqueado de forma segura hasta restaurarla o retirar la variable.

### Solo Antigravity IDE (opcional)
`scripts/sync-mcp-schemas.mjs` tiene una ruta **hardcodeada** (`targetDir`). Cámbiala a la del usuario actual antes de ejecutar:
```bash
node scripts/sync-mcp-schemas.mjs
```

## 6. Reglas al USAR las tools (`qap_*`)
1. Envía `targetPath` con la ruta absoluta del workspace autorizado y empieza con `qap_start`.
2. Configura destino y acceso en la política del host según [la guía del MVP autónomo](docs/qap-autonomous-mvp.md).
3. Sigue Discovery, diseño y materialización con `qap_plan`, plan persistido con `qap_plan`, ejecución con `qap_test` y publicación con `qap_report`.
4. Trabaja con oráculos acreditados y registra incertidumbres. Los bloqueos de política excluyen la operación afectada. Continúa con el trabajo independiente permitido.
5. Los recibos de revisión y waivers históricos quedan fuera del ciclo ordinario. Toda ejecución oficial usa el runner de QAP.

## 7. Troubleshooting rápido
| Síntoma | Causa probable | Solución |
|---|---|---|
| `Cannot find module .../dist/...` | No se compiló | `pnpm build` |
| El cliente no ve el servidor | Ruta relativa o cliente sin reiniciar | Ruta absoluta + reiniciar |
| `workspace_not_bound` o `workspace_host_root_mismatch` | El host no seleccionó una raíz única o su configuración contradice las raíces anunciadas | Corrige la raíz en el host y vuelve a conectar QAP |
| Errores de Playwright/navegador | Falta navegador | `npx playwright install chromium` |

## 8. Comandos útiles
```bash
pnpm test                      # tests de todos los paquetes
pnpm lint                      # ESLint
pnpm --filter @qap/mcp dev     # compilar MCP en modo watch
pnpm release:check             # validaciones previas a release
```
