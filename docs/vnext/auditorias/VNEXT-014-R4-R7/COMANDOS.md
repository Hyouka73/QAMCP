# Comandos, entorno y publicación R4-R7

Auditoría 2026-11-05, America/Mexico_City. Git origin `https://github.com/Hyouka73/QAMCP.git`, rama autorizada `feat/qap-vnext-architecture`; fetch y ls-remote comprobaron `ea75eb2c52266b174e6d24917c1b089d56834900`. Checkout original: `e44bbca51e2f35253b5d6cb0faabddde103b2bbc`, untracked .agents/teamwork preservado. Worktree gestionado nuevo, detached HEAD en SHA exacto auditado, limpio antes de instalar y ejecutar. No se cambió la rama del checkout original.

## Entorno ejecutado

Node **24.22.1**, SQLite **3.53.4** con CREATE VIRTUAL TABLE FTS5, INSERT y MATCH reales sobre memoria, pnpm **11.3.0**, Git **2.47.1.windows.2**, Chromium headless **153.0.8010.12**, Playwright-core **1.63.0**, TypeScript **5.5.4**, Vitest **4.1.11**, Windows. Se antepuso el runtime Node 24 ya instalado al PATH de cada proceso, sin cambiar Node global (22.13.0). El baseline usó Node 24.15.0/SQLite 3.51.3; esta diferencia ambiental queda declarada.

`pnpm install --frozen-lockfile` salió 0. Aviso de bin qap-mcp ausente antes de build conservado; build 10 paquetes salió 0 y existen packages/mcp/dist/server.js y packages/cli/dist/entrypoint.js. No se regeneró lockfile ni se instaló Chromium porque el binario ya lanzó y devolvió versión.

Contexto obligatorio leído desde los objetos/documentos versionados del SHA obtenido de GitHub: AGENTS.md, STATE.md, backlog, nota R4-R7, informe y siguiente P0 R4-R6, clasificación de 55 R4-R5. No se dependió de otros chats.

## Ejecuciones

Todas las compuertas pnpm se ejecutaron desde la raíz del worktree. El integral añade reporter JSON al verbose solicitado, manteniendo maxWorkers=1. Logs originales fuera de Git; extractos saneados en LOGS.md, resultados completos por identidad en DIFERENCIAL_MCP.md y primeros diagnósticos en RESULTADOS_MCP.md.

| ID | Comando | Salida |
| --- | --- | ---: |
| install | `pnpm install --frozen-lockfile` | 0 |
| build | `pnpm build` | 0 |
| focus | `pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-interview.test.ts -t R4-R7-I01 --maxWorkers=1 --reporter=verbose` | 0 |
| interview | `pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-interview.test.ts --maxWorkers=1 --reporter=verbose` | 0 |
| coverage | `pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-coverage.test.ts --maxWorkers=1 --reporter=verbose` | 0 |
| discovery | `pnpm --filter @qap/mcp exec vitest run src/__tests__/discovery-handler.test.ts --maxWorkers=1 --reporter=verbose` | 0 |
| lint-focus | `pnpm --filter @qap/mcp exec eslint src/__tests__/canonical-interview.test.ts src/handlers/status.handler.ts src/handlers/canonical-interview-service.ts src/handlers/canonical-coverage-service.ts` | 1 |
| mcp | `pnpm --filter @qap/mcp exec vitest run --maxWorkers=1 --reporter=verbose --reporter=json --outputFile.json=<ARTEFACTOS>/mcp.json` | 1 |
| runner | `pnpm --filter @qap/playwright-runner exec vitest run --maxWorkers=1 --reporter=verbose` | 0 |
| lint-global | `pnpm lint` | 1 |
| stdio | `node <ARTEFACTOS>/stdio.mjs <WORKTREE> <ARTEFACTOS>/stdio-fixture` | 0 |
| probe | `node <ARTEFACTOS>/probe.mjs <WORKTREE> <ARTEFACTOS>` | 0 |


Preflight y comprobaciones adicionales (salida 0 salvo donde se indica): git remote -v; git branch --show-current; git rev-parse HEAD; git status --short; git fetch origin feat/qap-vnext-architecture; git ls-remote origin refs/heads/feat/qap-vnext-architecture; node -v; pnpm -v; git --version. `rg` inicial no encontró scripts por patrón y salió 1, sin afectar preparación. Sondas FTS5 y Chromium por node salieron 0. `git diff --exit-code <SHA_AUDITADO> -- packages pnpm-lock.yaml` y `git diff --check` salieron 0. Se verificó hash de sesión protegida sin imprimir su contenido, antes/después: 429bbf6d57a1d798231b4204d52069b4077703de, igual en worktree y checkout original.

El script existente scripts/test-mcp-stdio.mjs omite targetPath y no comprueba semánticamente cada respuesta; para cumplir AGENTS se ejecutó sonda externa equivalente y más estricta, con targetPath absoluto en cada tool, cwd desechable, asserts de 18 herramientas, init success y ONBOARDING. Se probaron tanto server.js directo como CLI mcp; ambos PASS. No se registra servidor en clientes ni se cambia su configuración.

## Preparación externa fallida conservada

Dos primeras ejecuciones de sondas externas terminaron con salida 1 antes de abrir fixtures: Stdio recibió `.` donde createRequire exige ruta absoluta (ERR_INVALID_ARG_VALUE); la sonda de integración intentó resolver esbuild como dependencia directa de MCP (MODULE_NOT_FOUND). Se corrigieron únicamente argumentos/importación externos: ruta absoluta y resolución de esbuild desde tsup. Los dos scripts finales salen 0. Logs originales stdio-preparation.log y probe-preparation.log conservados; estos intentos no cuentan como PASS de comportamiento ni como defectos del producto.

## Script Stdio reproducible

```javascript
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const [repo,out]=process.argv.slice(2);
const req=createRequire(join(repo,'package.json'));
const {Client}=await import(pathToFileURL(req.resolve('@modelcontextprotocol/sdk/client/index.js')));
const {StdioClientTransport}=await import(pathToFileURL(req.resolve('@modelcontextprotocol/sdk/client/stdio.js')));
for(const [label,args] of [['server',[join(repo,'packages/mcp/dist/server.js')]],['cli',[join(repo,'packages/cli/dist/entrypoint.js'),'mcp']]]){
 const root=join(out,label);mkdirSync(root,{recursive:true});
 const client=new Client({name:'independent-r4-r7-stdio',version:'1'});
 try{
  await client.connect(new StdioClientTransport({command:process.execPath,args,cwd:root}));
  const names=(await client.listTools()).tools.map(t=>t.name).sort();assert.equal(names.length,18);
  const result=await client.callTool({name:'qap_init',arguments:{targetPath:root,projectName:'mcp-live-test',baseUrl:'http://localhost:3000',environments:['local','qa']}});
  assert.ok(!result.isError);const init=JSON.parse(result.content[0].text);assert.equal(init.status,'success');
  const status=JSON.parse((await client.callTool({name:'qap_status',arguments:{targetPath:root}})).content[0].text);assert.equal(status.fase,'ONBOARDING');
  console.log(JSON.stringify({transport:label,tools:names,init:init.status,phase:status.fase,targetPathExplicit:true}));
 }finally{await client.close();}
}
console.log('SERVIDOR MCP FUNCIONANDO AL 100% SOBRE STDIO');

```

## Huellas de evidencia local

No se publican bases, claves, decisiones de sesión, dist o fixtures. Las huellas corresponden a archivos originales fuera del repositorio; los contenidos publicados se sanearon.

| Archivo | Bytes | SHA-256 |
| --- | ---: | --- |
| build.log | 8157 | e24e98e7db6566c8d0e2d9279f79bc1047dad7b4340d4061330f1e9878eca388 |
| chromium.log | 15 | 697caf1e6e6014a640c5b76a08e7b6a6585758b703a3b5cde151b66053632fa0 |
| closure-bundle.mjs | 6935 | 69d199497c0a966f2105df60d1e7b60137ca3dfb833774cbb83924cad2f5225a |
| commands.tsv | 1270 | 9cd17412bdbf9927e6357d4c9468af359a12df714d4374738a7a4353189bc19b |
| coverage.log | 9634 | 2618cc00aefac4e4778d1a4ab5dc3773c4138f7d51ad24f70d49f41768a97175 |
| discovery.log | 9848 | 2985981f2ac9c4dc6b782ac84a12540849dd1eee9040c11984624023652d2911 |
| focus.log | 7937 | 1afd79d85a2327e2d89deb61f35018c581431c114e99c2258f5690efeff62120 |
| fts.log | 71 | 208b5e4d1a838f16538e6a58bb94b50de2e1cd7e15820d50ba3f0f895bc3e958 |
| install.log | 1669 | e8de0adb9b31b4b23da9f02ad204ffe76961b87d0338cb639e01b5358d2cd803 |
| interview.log | 8145 | 199b035bb909be37593a1bdf932f003e1e6ecd60ab7f6ba116e6f64cc19b3ca2 |
| lint-focus.log | 1288 | f07703797609b658f49d2d33bf7a81332129b27dff236072a58953145df80812 |
| lint-global.log | 10984 | 4439d6cd78e8691db3ddd6120ee0a829fea9cf751b80d615910de2a776b1a458 |
| mcp.json | 225747 | 5e2d2a876c84d53f5bc2f3d72548fad3b6ae27536cc80da19b4d3cbbf1d2cb42 |
| mcp.log | 145829 | 92777e395d42e0ba08a19471f8e737803f3e46f28f50270d2a9e88192d85a576 |
| probe-first-pass.log | 3483 | f9bf398a8231cc4d9c2f99e9314ab9f3f5743ac62a1307e66dea014e8c052dae |
| probe-preparation.log | 1041 | 2e41c8ed017db74fce43b48df9a42f9596152f51a09fd283072a9ea442dfbcff |
| probe.log | 3806 | 5072fada41ef4de55323150c7003f123a90c695d4b2388229d214afec5081ed7 |
| probe.mjs | 10651 | c702650abae81dfc22edd10ff8b444bc596fa2af39b11edc385fa75576fd79d1 |
| run-checks.ps1 | 1815 | e11a1f3a7d8b5efd8bc83d3d2ad25aa4a7cd2cc22e27da5872bf6743d2f63be8 |
| runner.log | 24269 | d0f41f62361daa9e723952784d8803df89c2bc60bb7f152edafef94b47d91175 |
| stdio-preparation.log | 679 | c76061b9bb5afb7f29e7753b83622a732d6c4365f01cd6b4b42adec8801e151d |
| stdio.log | 921 | 6b22a7bf3068eaea99eb947948e3cb36b74ff3a3103d78af1218450f6bd85568 |
| stdio.mjs | 1636 | 9da49bf5652c32f63dedf4529495a3c30845d4bb92b1f495ebd7697d6dcabe89 |

## Identidad de publicación

**SHA de código auditado:** `ea75eb2c52266b174e6d24917c1b089d56834900`. **Commit documental:** el commit que incorpora esta carpeta y las actualizaciones de STATE/backlog/nota; su identidad se comunica separadamente en la entrega y se obtiene con `git log -1 --format=%H -- docs/vnext/auditorias/VNEXT-014-R4-R7/INFORME.md`. Es un commit solo documental, no otro SHA de código probado. La publicación usa `git push origin HEAD:refs/heads/feat/qap-vnext-architecture`, sin force, merge ni cambios a main/develop; después se comprueba igualdad con `git ls-remote`.
