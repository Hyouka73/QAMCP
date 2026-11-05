**Auditoría independiente de aceptación. Fecha: 2026-11-05.** Repositorio Hyouka73/QAMCP, rama exclusiva feat/qap-vnext-architecture. **Snapshot exacto probado: e71818ac6fdaa1847e300a67bd4540fbfbd514c5.** Último commit productivo: 4be066c794c1e83fa0b3e1b89d269094f7b7f68e. Base anterior al rescate: f36e5ba60470c2443690d78a4b68bad966891b69. El SHA de esta publicación documental se verifica en GitHub al terminar y no sustituye el del snapshot probado. VNEXT-014 NO-GO; VNEXT-015 no iniciado.

# Resultados físicos, comandos y análisis estático

Windows 11 Home x64, kernel 10.0.26200; Git2.54.0.windows.1; Node24.15.0; pnpm12.3.4; SQLite3.51.3; Chromium153.0.8010.12 (ms-playwright chromium-1243). FTS5 comprobado con CREATE VIRTUAL TABLE, INSERT y MATCH. Chromium lanzado físicamente. No se ejecutaron Linux/POSIX ni otros sistemas. Worktree reutilizado limpio y detached: C:/Users/Judirico/Documents/QAMCP/audit-r4-r10. El checkout personal QAMCP/QAMCP conservó su archivo de sesión previamente modificado; el worktree auditado conservó su archivo versionado intacto. Git diff de packages y pnpm-lock al SHA auditado terminó vacío.

Permisos: se consultó Get-Acl de los fixtures/directorio de evidencia: propietario DESKTOP-2JDCCQT\Judirico, control de SYSTEM/Administradores/usuario y lectura/ejecución del grupo sandbox donde se heredó. La attestation host_private_directory_and_managed_key no es una verificación universal de ACL por el producto. Solo fixture administrado local: no se certifican ACL productivos ni aislamiento frente a administradores/mismo usuario host. Get-CimInstance fue denegado por el entorno; OS verificado por node:os. Lockfile blob conservado a9bd8de7f6ac38db1ad4ae6582c4539b351225c8.

## Instalación y compilación

pnpm install --frozen-lockfile exit0, lockfile vigente, sin resolución/mutación. pnpm build exit0; diez paquetes:

| Paquete | Resultado |
| --- | --- |
| shared | PASS, build: Done |
| engine | PASS, build: Done |
| auth | PASS, build: Done |
| knowledge | PASS, build: Done |
| playwright-adapter | PASS, build: Done |
| git-adapter | PASS, build: Done |
| reporter | PASS, build: Done |
| playwright-runner | PASS, build: Done |
| mcp | PASS, build: Done |
| cli | PASS, build: Done |

DTS y bundles MCP/CLI generados; diez builds comprobados individualmente en log, no extrapolados del baseline. El último commit productivo y el snapshot final tienen diff vacío de packages. El diff acumulado de rescate contiene los diez archivos y los 18 commits solicitados.

## Matriz ejecutada

| Corrida | Resultado físico |
| --- | --- |
| Focal host-composition | 6/6 PASS |
| Focal Coverage | 55/55 PASS (53 anteriores+2 rescate) |
| Focal Canonical Interview | 44/44 PASS |
| Focal Discovery | 59/59 PASS |
| Focal total cuatro archivos | 164/164 PASS |
| lifecycle-v3-e2e | 2 PASS/5 FAIL de7 |
| server | 11 PASS/10 FAIL de21 |
| report-handler | 12/12 PASS |
| Segunda focal total | 25 PASS/15 FAIL de40 |
| pnpm --filter @qap/mcp test, predeterminado | Primera:360 PASS/67 FAIL de427, Discovery59 no ejecutadas, 3 errores no manejados; repetición:413 PASS/73 FAIL de486 y1 error, exit1 |
| MCP JSON/verbo y un worker | 423 PASS/63 FAIL de486, exit1 |
| Playwright Runner | 71/71 PASS, 10 archivos |
| CLI separado | 78/78 PASS, 14 archivos |
| Stdio directo/CLI | 18 herramientas, legacy/canónico, Discovery y EOF físicos |
| pnpm lint | 39 errores/28 advertencias, exit1 |

Las ocho altas exactas y las 63 identidades están en DIFERENCIAL_MCP.md. Las regresiones R8/R9/R10/R11/R12 están incluidas en Coverage55/55; no se atribuye una corrida focal por etiqueta adicional que no se hizo en esta ronda.

## pnpm test y ampliación secuencial

El comando exacto pnpm test **falló**: shared162 y engine168 pasan; knowledge257 PASS/1 FAIL de258 por route-scanner > C3: scanProjectRoutes (Repo-map ligero de rutas) > emite advertencia y se detiene cuando se excede el limite de 2000 archivos. Error: expected ['tiempo_limite_excedido'] to include 'limite_archivos_excedido', route-scanner.test.ts:388. Timeout bajo ejecución concurrente: no se tocó límite ni expectativa. Detuvo el monorepo y no acredita las suites canceladas.

Ampliación necesaria: pnpm --workspace-concurrency=1 --no-bail -r --if-present test --maxWorkers=1. Knowledge vuelve a **258/258**; el timeout inicial es sensible a carga del entorno, no una modificación de route-scanner introducida por el rescate. El comando secuencial falla exclusivamente por MCP y no agenda CLI dependiente de MCP; CLI se ejecutó aparte:

| Paquete | PASS | FAIL | SKIP |
| --- | ---: | ---: | ---: |
| shared | 162 | 0 | 0 |
| auth | 39 | 0 | 1 |
| engine | 168 | 0 | 0 |
| knowledge | 258 | 0 | 0 |
| playwright-adapter | 164 | 0 | 0 |
| git-adapter | 5 | 0 | 0 |
| playwright-runner | 71 | 0 | 0 |
| reporter | 47 | 0 | 0 |
| mcp | 423 | 63 | 0 |
| cli, corrida separada | 78 | 0 | 0 |
| Total combinado sin sumar repeticiones | 1415 | 63 | 1 |

Skip original en auth: credential-vault.test.ts > rejects permissive POSIX vault permissions, skipIf(win32). No se eliminó ni omitió una prueba para dar PASS. El total combinado no es un pnpm test verde.

## ESLint por identidad

Los 62 históricos son idénticos por archivo+línea+columna+regla+mensaje+severidad: **34 errores+28 advertencias**. Cinco altas, ninguna baja. No hay desplazamientos que expliquen esas cinco: son código nuevo. No se modificó configuración ni se agregaron supresiones. R4-R8-L01 permanece ausente. Foco en las tres nuevas fuentes con diagnósticos: cierre-service1, renderer2 y host-composition2; el global es rojo.

| Archivo | Línea:col | Nivel | Regla | Mensaje | Clasificación |
| --- | --- | --- | --- | --- | --- |
| packages/cli/src/__tests__/test-from-diff.test.ts | 6:1 | warning | import/order | There should be no empty line within import group | histórico exacto |
| packages/cli/src/commands.ts | 258:23 | error | @typescript-eslint/no-unsafe-argument | Unsafe argument of type `any` assigned to a parameter of type `PruneCommandOptions`. | histórico exacto |
| packages/engine/src/__tests__/mocks/storage.mock.ts | 1:1 | warning |  | Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-explicit-any' or '@typescript-eslint/no-unsafe-return'). | histórico exacto |
| packages/knowledge/src/__tests__/candidate-generator.test.ts | 9:32 | error | @typescript-eslint/no-unused-vars | '_candidatesFile' is defined but never used. | histórico exacto |
| packages/knowledge/src/__tests__/case-generator.test.ts | 1:1 | warning | import/order | There should be at least one empty line between import groups | histórico exacto |
| packages/knowledge/src/__tests__/lock-manager.test.ts | 3:1 | warning | import/order | There should be at least one empty line between import groups | histórico exacto |
| packages/knowledge/src/__tests__/lock-manager.test.ts | 4:1 | warning | import/order | There should be at least one empty line between import groups | histórico exacto |
| packages/knowledge/src/storage/lock-manager.ts | 2:1 | warning | import/order | There should be at least one empty line between import groups | histórico exacto |
| packages/knowledge/src/storage/lock-manager.ts | 56:7 | error | preserve-caught-error | There is no `cause` attached to the symptom error being thrown. | histórico exacto |
| packages/knowledge/src/storage/lock-manager.ts | 63:5 | error | @typescript-eslint/require-await | Async method 'forceUnlock' has no 'await' expression. | histórico exacto |
| packages/mcp/src/__tests__/lifecycle-v3-e2e.test.ts | 1:1 | warning |  | Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-explicit-any'). | histórico exacto |
| packages/mcp/src/__tests__/lifecycle-v3-e2e.test.ts | 1:1 | warning |  | Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-unsafe-argument'). | histórico exacto |
| packages/mcp/src/__tests__/lifecycle-v3-e2e.test.ts | 1:1 | warning |  | Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-unsafe-return'). | histórico exacto |
| packages/mcp/src/__tests__/p3-verification.test.ts | 1:1 | warning |  | Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-explicit-any'). | histórico exacto |
| packages/mcp/src/__tests__/p3-verification.test.ts | 1:1 | warning |  | Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-unsafe-argument'). | histórico exacto |
| packages/mcp/src/__tests__/p3-verification.test.ts | 1:1 | warning |  | Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-unsafe-return'). | histórico exacto |
| packages/mcp/src/__tests__/p4-3-1-b-block.test.ts | 1:1 | warning | import/order | There should be at least one empty line between import groups | histórico exacto |
| packages/mcp/src/__tests__/p4-3-1-b-block.test.ts | 1:1 | warning | import/order | `vitest` import should occur after import of `node:path` | histórico exacto |
| packages/mcp/src/__tests__/p4-3-1-b-block.test.ts | 5:1 | warning | import/order | There should be at least one empty line between import groups | histórico exacto |
| packages/mcp/src/__tests__/p4-3-1-b-block.test.ts | 7:1 | warning | import/order | There should be at least one empty line between import groups | histórico exacto |
| packages/mcp/src/__tests__/p4-3-1-b-block.test.ts | 8:1 | warning | import/order | `../server.js` import should occur after import of `@qap/knowledge` | histórico exacto |
| packages/mcp/src/__tests__/p4-3-1-b-block.test.ts | 9:1 | warning | import/order | There should be at least one empty line between import groups | histórico exacto |
| packages/mcp/src/__tests__/p4-3-1-b-block.test.ts | 9:1 | warning | import/order | `../guidance.js` import should occur after import of `@qap/knowledge` | histórico exacto |
| packages/mcp/src/__tests__/server.test.ts | 1:1 | warning |  | Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-unsafe-argument'). | histórico exacto |
| packages/mcp/src/__tests__/server.test.ts | 1:1 | warning |  | Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-explicit-any'). | histórico exacto |
| packages/mcp/src/handlers/canonical-closure-service.ts | 354:26 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since it does not change the type of the expression. | nuevo |
| packages/mcp/src/handlers/canonical-coverage-service.ts | 135:21 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since it does not change the type of the expression. | histórico exacto |
| packages/mcp/src/handlers/canonical-coverage-service.ts | 182:15 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since it does not change the type of the expression. | histórico exacto |
| packages/mcp/src/handlers/canonical-coverage-service.ts | 185:15 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since it does not change the type of the expression. | histórico exacto |
| packages/mcp/src/handlers/canonical-coverage-service.ts | 233:25 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since it does not change the type of the expression. | histórico exacto |
| packages/mcp/src/handlers/canonical-coverage-service.ts | 256:23 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since it does not change the type of the expression. | histórico exacto |
| packages/mcp/src/handlers/canonical-session-report.ts | 5:10 | error | @typescript-eslint/no-base-to-string | 'value ?? ''' will use Object's default stringification format ('[object Object]') when stringified. | nuevo |
| packages/mcp/src/handlers/canonical-session-report.ts | 5:67 | error | no-useless-escape | Unnecessary escape character: \[. | nuevo |
| packages/mcp/src/handlers/module-closure-store.ts | 137:77 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since it does not change the type of the expression. | histórico exacto |
| packages/mcp/src/handlers/module-closure-store.ts | 138:86 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since it does not change the type of the expression. | histórico exacto |
| packages/mcp/src/host-composition.ts | 149:25 | error | @typescript-eslint/no-unsafe-assignment | Unsafe spread of an `any` value in an array. | nuevo |
| packages/mcp/src/host-composition.ts | 154:17 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since the receiver accepts the original type of the expression. | nuevo |
| packages/playwright-runner/test/session-resolver.test.ts | 3:1 | warning | import/order | There should be at least one empty line between import groups | histórico exacto |
| packages/playwright-runner/test/session-resolver.test.ts | 5:1 | warning | import/order | There should be at least one empty line between import groups | histórico exacto |
| packages/shared/src/__tests__/domain/canonical-coverage-invariants.test.ts | 1:1 | warning | import/order | There should be at least one empty line between import groups | histórico exacto |
| packages/shared/src/__tests__/domain/domain-contracts-invariants.test.ts | 15:1 | warning | import/order | There should be at least one empty line between import groups | histórico exacto |
| packages/shared/src/__tests__/domain/domain-contracts-invariants.test.ts | 41:3 | error | @typescript-eslint/no-unused-vars | 'SENSITIVE_HTTP_HEADERS' is defined but never used. | histórico exacto |
| packages/shared/src/__tests__/domain/domain-contracts-invariants.test.ts | 42:3 | error | @typescript-eslint/no-unused-vars | 'SENSITIVE_CREDENTIAL_KEYS' is defined but never used. | histórico exacto |
| packages/shared/src/__tests__/domain/domain-contracts-invariants.test.ts | 291:38 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since the receiver accepts the original type of the expression. | histórico exacto |
| packages/shared/src/__tests__/domain/domain-contracts-invariants.test.ts | 292:38 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since the receiver accepts the original type of the expression. | histórico exacto |
| packages/shared/src/__tests__/domain/domain-contracts-invariants.test.ts | 295:38 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since the receiver accepts the original type of the expression. | histórico exacto |
| packages/shared/src/__tests__/domain/domain-contracts-invariants.test.ts | 296:38 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since the receiver accepts the original type of the expression. | histórico exacto |
| packages/shared/src/__tests__/domain/domain-contracts-invariants.test.ts | 297:38 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since the receiver accepts the original type of the expression. | histórico exacto |
| packages/shared/src/__tests__/domain/domain-contracts-invariants.test.ts | 298:38 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since the receiver accepts the original type of the expression. | histórico exacto |
| packages/shared/src/__tests__/domain/scenario-a-unknown-app.test.ts | 20:1 | warning | import/order | There should be at least one empty line between import groups | histórico exacto |
| packages/shared/src/__tests__/domain/scenario-b-new-module.test.ts | 21:1 | warning | import/order | There should be at least one empty line between import groups | histórico exacto |
| packages/shared/src/__tests__/domain/scenario-b-new-module.test.ts | 24:3 | error | @typescript-eslint/no-unused-vars | 'FlowScenario' is defined but never used. | histórico exacto |
| packages/shared/src/__tests__/domain/scenario-c-auth-and-cache.test.ts | 21:1 | warning | import/order | There should be at least one empty line between import groups | histórico exacto |
| packages/shared/src/__tests__/domain/scenario-c-auth-and-cache.test.ts | 166:11 | error | @typescript-eslint/no-unused-vars | 'archivedPasswordInput' is assigned a value but never used. | histórico exacto |
| packages/shared/src/domain/contextual-dimensions.ts | 48:9 | error | @typescript-eslint/no-redundant-type-constituents | "dev" is overridden by string in this union type. | histórico exacto |
| packages/shared/src/domain/contextual-dimensions.ts | 48:17 | error | @typescript-eslint/no-redundant-type-constituents | "staging" is overridden by string in this union type. | histórico exacto |
| packages/shared/src/domain/contextual-dimensions.ts | 48:29 | error | @typescript-eslint/no-redundant-type-constituents | "prod" is overridden by string in this union type. | histórico exacto |
| packages/shared/src/domain/invariants-validator.ts | 130:41 | error | @typescript-eslint/no-unsafe-argument | Unsafe argument of type `any` assigned to a parameter of type `"authorization" &#124; "cookie" &#124; "set-cookie" &#124; "x-api-key" &#124; "proxy-authorization"`. | histórico exacto |
| packages/shared/src/domain/invariants-validator.ts | 130:53 | error | @typescript-eslint/no-explicit-any | Unexpected any. Specify a different type. | histórico exacto |
| packages/shared/src/domain/invariants-validator.ts | 173:44 | error | @typescript-eslint/no-unsafe-argument | Unsafe argument of type `any` assigned to a parameter of type `"password" &#124; "passwd" &#124; "secret" &#124; "token" &#124; "raw_token" &#124; "api_key" &#124; "apikey" &#124; "private_key"`. | histórico exacto |
| packages/shared/src/domain/invariants-validator.ts | 173:56 | error | @typescript-eslint/no-explicit-any | Unexpected any. Specify a different type. | histórico exacto |
| packages/shared/src/domain/invariants-validator.ts | 179:45 | error | @typescript-eslint/no-unsafe-argument | Unsafe argument of type `any` assigned to a parameter of type `"authorization" &#124; "cookie" &#124; "set-cookie" &#124; "x-api-key" &#124; "proxy-authorization"`. | histórico exacto |
| packages/shared/src/domain/invariants-validator.ts | 179:67 | error | @typescript-eslint/no-explicit-any | Unexpected any. Specify a different type. | histórico exacto |
| packages/shared/src/domain/invariants-validator.ts | 203:45 | error | @typescript-eslint/no-unsafe-argument | Unsafe argument of type `any` assigned to a parameter of type `"authorization" &#124; "cookie" &#124; "set-cookie" &#124; "x-api-key" &#124; "proxy-authorization"`. | histórico exacto |
| packages/shared/src/domain/invariants-validator.ts | 203:67 | error | @typescript-eslint/no-explicit-any | Unexpected any. Specify a different type. | histórico exacto |
| packages/shared/src/domain/invariants-validator.ts | 265:28 | error | @typescript-eslint/no-unnecessary-type-assertion | This assertion is unnecessary since it does not change the type of the expression. | histórico exacto |
| packages/shared/src/domain/invariants-validator.ts | 1216:59 | error | @typescript-eslint/no-unsafe-argument | Unsafe argument of type `any` assigned to a parameter of type `object`. | histórico exacto |

## Comandos reproducibles y salidas de control

Desde el worktree aislado. Todos los stdout/stderr brutos y JSON se conservaron fuera de Git en ../rescate-evidence; solo Markdown de auditoría se publica. No se publican bases, credenciales ni archivos generados. Para comparar JSON se usa file+fullName sin modificar resultados.

~~~powershell
$ErrorActionPreference='Continue'
$env:TEMP=Join-Path (Get-Location) 'node_modules/.tmp-rescate'; $env:TMP=$env:TEMP
New-Item -ItemType Directory -Force $env:TEMP | Out-Null
function Run-Audit($label,$argList) {
 & pnpm @argList *> "../rescate-evidence/$label.log"
 "$label=$LASTEXITCODE" | Add-Content ../rescate-evidence/exits.txt
}
Run-Audit focal @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/host-composition.test.ts','src/__tests__/canonical-coverage.test.ts','src/__tests__/discovery-handler.test.ts','src/__tests__/canonical-interview.test.ts','--maxWorkers=1','--reporter=verbose','--reporter=json','--outputFile.json=../../../rescate-evidence/focal.json')
Run-Audit integration @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/lifecycle-v3-e2e.test.ts','src/__tests__/server.test.ts','src/__tests__/report-handler.test.ts','--maxWorkers=1','--reporter=verbose','--reporter=json','--outputFile.json=../../../rescate-evidence/integration.json')
Run-Audit mcp-required @('--filter','@qap/mcp','test')
Run-Audit mcp @('--filter','@qap/mcp','exec','vitest','run','--maxWorkers=1','--reporter=verbose','--reporter=json','--outputFile.json=../../../rescate-evidence/mcp.json')
Run-Audit all @('test')
Run-Audit runner @('--filter','@qap/playwright-runner','exec','vitest','run','--maxWorkers=1','--reporter=verbose')
Run-Audit lint-required @('lint')
Run-Audit lint @('exec','eslint','.','--format=json','--output-file=../rescate-evidence/lint.json')
Get-Content ../rescate-evidence/exits.txt

~~~

~~~powershell
$env:TEMP=Join-Path (Get-Location) 'node_modules/.tmp-rescate';$env:TMP=$env:TEMP
pnpm --workspace-concurrency=1 --no-bail -r --if-present test --maxWorkers=1 *> ../rescate-evidence/all-sequential.log
"all-sequential=$LASTEXITCODE" | Add-Content ../rescate-evidence/exits.txt

~~~

Otros comandos ejecutados:

~~~powershell
git status --short
git rev-parse HEAD
git fetch origin feat/qap-vnext-architecture
git switch --detach e71818ac6fdaa1847e300a67bd4540fbfbd514c5
node -v
pnpm -v
git --version
pnpm install --frozen-lockfile
pnpm build
pnpm --filter @hyouka73/qap-cli exec vitest run --maxWorkers=1 --reporter=verbose
node ../rescate-evidence/setup.mjs
node ../rescate-evidence/prepare.mjs
node ../rescate-evidence/host-probe.mjs
node ../rescate-evidence/host-hardening.mjs
node ../rescate-evidence/stdio-script.mjs
node ../rescate-evidence/stdio-discovery.mjs
node ../rescate-evidence/integrated.mjs
node ../rescate-evidence/report-probe.mjs
pwsh -NoProfile -File ../rescate-evidence/probes.ps1
node ../rescate-evidence/prepare-old.mjs
node ../rescate-evidence/extra.mjs
node ../rescate-evidence/debt-probe.mjs <WORKTREE> <EVIDENCIA>
node ../rescate-evidence/no-fence.mjs
node ../rescate-evidence/analyze.mjs
git diff --exit-code e71818ac6fdaa1847e300a67bd4540fbfbd514c5 -- packages pnpm-lock.yaml
git ls-remote origin refs/heads/feat/qap-vnext-architecture refs/heads/main refs/heads/develop refs/heads/staging
~~~

TEMP/TMP de la matriz apuntan a node_modules/.tmp-rescate; ninguna sesión personal se usa. setup y arneses extraen/helpers-compilan el mismo código exacto, sin reemplazar tests. Primeras versiones de sondas externas fallaron por import CommonJS de Playwright, archivo opcional no existente, contexto completo con objetos no clonables y clasificador de escenarios; se corrigió exclusivamente el arnés. Una clave incorrecta sobre un store sin filas cifradas no puede autenticarse: se corrigió la sonda para sembrar primero una generación vacía de acceptedGaps sin aprobación y así probar fallo GCM real. El primer arnés de fallo lifecycle disparaba demasiado pronto; el definitivo exige que el reporte ya exista y verifica recuperación. Extra necesitó generar su bundle histórico antes de repetir exit0. Los errores iniciales no se presentan como defectos productivos ni se borran del registro local.

Una llamada de ejecución no se realizó porque la revisión automática de permisos agotó su cuota; el usuario indicó continuar y el reintento autorizado se ejecutó. No se eludió el control. El análisis JSON se invocó antes de terminar ESLint y dio ENOENT; se repitió al estar completo. No cambió ninguna expectativa versionada.

### Registro de la matriz

~~~text
focal=0
integration=1
mcp-required=1
mcp=1
all=1
runner=0
lint-required=1
lint=1
all-sequential=1

~~~

### Identificación de runtime/FTS5

~~~text
{"scenario":"runtime","node":"v24.15.0","platform":"win32","sqlite":"3.51.3","FTS5":true}
{"scenario":"relative-cwd","samePhysicalFile":true,"otherConnectionAndProcessBlocked":true,"recovered":true,"noStrayFile":true}
{"scenario":"file-identity","phase":"before","replacement":false,"renamed":false,"callback":false,"code":"EBUSY","pathExists":true}
{"scenario":"file-identity","phase":"before","replacement":true,"renamed":false,"callback":false,"code":"EBUSY","pathExists":true}
{"scenario":"file-identity","phase":"inside","replacement":false,"renamed":false,"callback":true,"code":"EBUSY","pathExists":true}
{"scenario":"file-identity","phase":"inside","replacement":true,"renamed":false,"callback":true,"code":"EBUSY","pathExists":true}

~~~

### Comparador por identidad y multiset de diagnósticos

~~~javascript
import {readFileSync,writeFileSync} from 'node:fs';const dir='../rescate-evidence/',j=JSON.parse(readFileSync(dir+'mcp.json')),old=JSON.parse(readFileSync('../r4-r12-evidence/mcp.json'));const flatten=j=>j.testResults.flatMap(f=>f.assertionResults.map(t=>({...t,file:f.name.split(/[\\/]/).at(-1)}))),a=flatten(old),b=flatten(j),key=t=>t.file+' | '+t.fullName,m=new Map(a.map(t=>[key(t),t])),counts={};for(const t of b){const k=(m.get(key(t))?.status??'new')+'→'+t.status;counts[k]=(counts[k]??0)+1;}const removed=a.filter(t=>!b.some(c=>key(c)===key(t)));const result={counts,removed,files:j.testResults.map(f=>({file:f.name.split(/[\\/]/).at(-1),pass:f.assertionResults.filter(t=>t.status==='passed').length,fail:f.assertionResults.filter(t=>t.status==='failed').length})),failures:b.filter(t=>t.status==='failed'),added:b.filter(t=>!m.has(key(t)))};writeFileSync(dir+'comparison.json',JSON.stringify(result,null,2));console.log(JSON.stringify({...result,failures:result.failures.map(t=>({file:t.file,name:t.fullName,error:t.failureMessages[0].slice(0,260)})),added:result.added.map(key)},null,2));
if(!readFileSync(dir+'lint.json','utf8'))process.exit();const lf=file=>JSON.parse(readFileSync(file)).flatMap(f=>f.messages.map(t=>({...t,file:f.filePath.replaceAll('\\','/').split('/audit-r4-r10/')[1]}))),lo=lf('../r4-r12-evidence/lint.json'),lc=lf(dir+'lint.json'),sig=t=>JSON.stringify([t.file,t.ruleId,t.message,t.severity]);const pool=[...lo],added=[];for(const t of lc){const idx=pool.findIndex(x=>sig(x)===sig(t));if(idx>=0)pool.splice(idx,1);else added.push(t);}const lint={errors:lc.filter(t=>t.severity===2).length,warnings:lc.filter(t=>t.severity===1).length,added,removed:pool,all:lc};writeFileSync(dir+'lint-comparison.json',JSON.stringify(lint,null,2));console.log(JSON.stringify({lint:{...lint,all:undefined}},null,2));

~~~


## Concurrencia, cifrado e historial: evidencia de esta corrida

Los trece arneses se repitieron contra el bundle del SHA auditado. extra tuvo un primer fallo por bundle histórico no preparado y pasó después de prepare-old. Son pruebas de mecánica aislada, no aprobación humana. El resultado negativo directo conserva snapshot cifrado/historia/recibos/lifecycle; los estados parciales de los kills se recuperan sin inventar autoridad. No se afirma atomicidad entre almacenes.

### expiry

~~~text
{"scenario":"deadline","action":"declare_non_applicable","stage":"human-review","code":"closure_review_expired","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"declare_non_applicable","stage":"before-transaction","code":"closure_consistency_conflict","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"declare_non_applicable","stage":"after-callback","code":"closure_review_expired","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"declare_non_applicable","stage":"after-insert","code":"closure_review_expired","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":true,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"declare_non_applicable","stage":"wrapper-setImmediate","code":"closure_review_expired","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"declare_non_applicable","stage":"process-contention","code":"closure_consistency_conflict","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"accept_gaps","stage":"human-review","code":"closure_review_expired","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"accept_gaps","stage":"before-transaction","code":"closure_consistency_conflict","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"accept_gaps","stage":"after-callback","code":"closure_review_expired","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"accept_gaps","stage":"after-insert","code":"closure_review_expired","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":true,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"accept_gaps","stage":"wrapper-setImmediate","code":"closure_review_expired","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"accept_gaps","stage":"process-contention","code":"closure_consistency_conflict","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"close","stage":"human-review","code":"closure_review_expired","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"close","stage":"before-transaction","code":"closure_consistency_conflict","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"close","stage":"after-callback","code":"closure_review_expired","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"close","stage":"after-insert","code":"closure_review_expired","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":true,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"close","stage":"wrapper-setImmediate","code":"closure_review_expired","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"close","stage":"process-contention","code":"closure_consistency_conflict","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"waive","stage":"human-review","code":"closure_review_expired","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"waive","stage":"before-transaction","code":"closure_consistency_conflict","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"waive","stage":"after-callback","code":"closure_review_expired","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"waive","stage":"after-insert","code":"closure_review_expired","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":true,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"waive","stage":"wrapper-setImmediate","code":"closure_review_expired","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"waive","stage":"process-contention","code":"closure_consistency_conflict","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline-context","expiredRejected":true,"ordinaryCallUnaffected":true}

~~~

### wrapper

~~~text
{"scenario":"port-preexisting-timer-queue","boundByAsyncLocalStorageSnapshot":false,"action":"declare_non_applicable","status":"declared_non_applicable","approvalCommittedAfterExpiry":true,"msPastDeadline":72,"actualSqliteStoreAndIndependentReadback":true}
{"scenario":"port-preexisting-timer-queue","boundByAsyncLocalStorageSnapshot":false,"action":"accept_gaps","status":"gaps_accepted","approvalCommittedAfterExpiry":true,"replayOfExpiredCommit":true,"msPastDeadline":81,"actualSqliteStoreAndIndependentReadback":true}
{"scenario":"port-preexisting-timer-queue","boundByAsyncLocalStorageSnapshot":false,"action":"close","status":"closed","approvalCommittedAfterExpiry":true,"msPastDeadline":74,"actualSqliteStoreAndIndependentReadback":true}
{"scenario":"port-preexisting-timer-queue","boundByAsyncLocalStorageSnapshot":false,"action":"waive","status":"waived","approvalCommittedAfterExpiry":true,"msPastDeadline":80,"actualSqliteStoreAndIndependentReadback":true}
{"scenario":"port-preexisting-timer-queue","boundByAsyncLocalStorageSnapshot":true,"action":"declare_non_applicable","status":"blocked","code":"closure_review_expired","approvalCommittedAfterExpiry":false,"msPastDeadline":60,"actualSqliteStoreAndIndependentReadback":true}
{"scenario":"port-preexisting-timer-queue","boundByAsyncLocalStorageSnapshot":true,"action":"accept_gaps","status":"blocked","code":"closure_review_expired","approvalCommittedAfterExpiry":false,"msPastDeadline":62,"actualSqliteStoreAndIndependentReadback":true}
{"scenario":"port-preexisting-timer-queue","boundByAsyncLocalStorageSnapshot":true,"action":"close","status":"blocked","code":"closure_review_expired","approvalCommittedAfterExpiry":false,"msPastDeadline":64,"actualSqliteStoreAndIndependentReadback":true}
{"scenario":"port-preexisting-timer-queue","boundByAsyncLocalStorageSnapshot":true,"action":"waive","status":"blocked","code":"closure_review_expired","approvalCommittedAfterExpiry":false,"msPastDeadline":62,"actualSqliteStoreAndIndependentReadback":true}

~~~

### locks

~~~text
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"session","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"session","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"session","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"session","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"plan","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"plan","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"plan","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"plan","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"phase","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"phase","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"phase","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"phase","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"state","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"state","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"state","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"state","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"session","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"session","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"session","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"session","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"plan","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"plan","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"plan","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"plan","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"phase","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"phase","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"phase","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"phase","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"state","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"state","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"state","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"state","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"close","kind":"session","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"session","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"session","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"session","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"plan","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"plan","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"plan","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"plan","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"phase","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"phase","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"phase","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"phase","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"state","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"state","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"state","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"state","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"waive","kind":"session","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"session","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"session","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"session","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"plan","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"plan","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"plan","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"plan","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"phase","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"phase","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"phase","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"phase","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"state","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"state","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"state","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"state","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"junction-root","sameLock":true,"recovered":true}
{"scenario":"lock-exception","unchanged":true,"recoveredThroughAlias":true}

~~~

### terminal

~~~text
{"scenario":"durable-winner","alteration":"valid","result":{"status":"waived","idempotent":true,"decision_id":"d6dbbaeb-0c7b-4d96-b06e-ac999e192ab5","request_digest":"bcf16aa96b04daeb6741c4835b74a51e0dbebfdb838820e6ddd3aef26a4786e2","coverage_digest":"9a7d90ee46be75cac769658c6beedae11bfa609308fd6a5b1f2dca244620ff61"},"secondAuthorizationConsumed":false,"noNewReceiptHistoryOrTransition":true}
{"scenario":"durable-winner","alteration":"trace-source","result":{"status":"blocked","code":"closure_context_changed","razon":"La sesión o el módulo cambiaron antes del consentimiento."},"secondAuthorizationConsumed":false,"noNewReceiptHistoryOrTransition":true}
{"scenario":"durable-winner","alteration":"trace-reason","result":{"status":"blocked","code":"closure_context_changed","razon":"La sesión o el módulo cambiaron antes del consentimiento."},"secondAuthorizationConsumed":false,"noNewReceiptHistoryOrTransition":true}
{"scenario":"durable-winner","alteration":"trace-review","result":{"status":"blocked","code":"closure_context_changed","razon":"La sesión o el módulo cambiaron antes del consentimiento."},"secondAuthorizationConsumed":false,"noNewReceiptHistoryOrTransition":true}
{"scenario":"durable-winner","alteration":"entity-source","result":{"status":"blocked","code":"closure_context_changed","razon":"La sesión o el módulo cambiaron antes del consentimiento."},"secondAuthorizationConsumed":false,"noNewReceiptHistoryOrTransition":true}
{"scenario":"durable-winner","alteration":"approval-missing","result":{"status":"blocked","code":"invalid_durable_closure","razon":"El cierre concurrente no conserva autorización canónica válida."},"secondAuthorizationConsumed":false,"noNewReceiptHistoryOrTransition":true}
{"scenario":"durable-winner","alteration":"approval-digest","result":{"status":"blocked","code":"invalid_durable_closure","razon":"El cierre concurrente no conserva autorización canónica válida."},"secondAuthorizationConsumed":false,"noNewReceiptHistoryOrTransition":true}
{"scenario":"durable-winner","alteration":"approval-duplicate","result":{"status":"blocked","code":"invalid_durable_closure","razon":"El cierre concurrente no conserva autorización canónica válida."},"secondAuthorizationConsumed":false,"noNewReceiptHistoryOrTransition":true}
{"scenario":"distinct-modules","results":[{"status":"closed","decision_id":"070c7601-4a2c-4184-987c-283ce66eb451","request_digest":"eef963f30e2d5cdda98a1cdab91db3fd05aef532e4e31074895d3e64f81bdc80","coverage_digest":"1f5feb8d30ef30735ce29e4c3c34b290166e2aafc2ce3522ae47b8ae081f3f9e","assessment":{"module_key":"catalog","module_id":"mod-catalog","module_revision":1,"application_id":"app-r5","environment_id":"local","assessed_at":"2026-11-05T19:26:09.863Z","assessed_by":"canonical_coverage_service","coverage_digest":"1f5feb8d30ef30735ce29e4c3c34b290166e2aafc2ce3522ae47b8ae081f3f9e","specification_coverage":{"status":"complete","applicable_categories_count":7,"satisfied_categories_count":7,"confirmed_requirements_count":7,"pending_requirements_count":0,"total_gaps_count":0,"unaddressed_gaps_count":0,"accepted_gaps_count":0,"category_statuses":[{"category":"functional","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"business_rule","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"security","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"ui","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"ux","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"regression","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"performance","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"}]},"review_coverage":{"status":"pending_review","reviewed_questions_count":7,"pending_questions_count":0,"decisions_count":0,"host_decisions":[]},"execution_coverage":{"status":"not_executed","executed_count":0,"passed_count":0,"failed_count":0,"indeterminate_count":0,"note":"La cobertura de ejecución requiere ejecución con test runner (VNEXT-014). Cero certificación de ejecución en R5."},"gaps":[],"applicability_decisions":[],"closure_verdict":"ready_for_closure","blocker_reasons":[]}},{"status":"closed","decision_id":"00818555-1ab6-4752-9a7a-0331ba050a6e","request_digest":"96ff1cd10b523a723e5d40e820102fa58fb4d4e118846407ac46c2fa4091aa18","coverage_digest":"81d12d670be995feb159f5ca585ca8bbd2788ca4fbfbadd42d228552f7ee479c","assessment":{"module_key":"billing","module_id":"mod-billing","module_revision":1,"application_id":"app-r5","environment_id":"local","assessed_at":"2026-11-05T19:26:09.866Z","assessed_by":"canonical_coverage_service","coverage_digest":"81d12d670be995feb159f5ca585ca8bbd2788ca4fbfbadd42d228552f7ee479c","specification_coverage":{"status":"complete","applicable_categories_count":7,"satisfied_categories_count":7,"confirmed_requirements_count":7,"pending_requirements_count":0,"total_gaps_count":0,"unaddressed_gaps_count":0,"accepted_gaps_count":0,"category_statuses":[{"category":"functional","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"business_rule","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"security","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"ui","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"ux","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"regression","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"performance","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"}]},"review_coverage":{"status":"pending_review","reviewed_questions_count":7,"pending_questions_count":0,"decisions_count":0,"host_decisions":[]},"execution_coverage":{"status":"not_executed","executed_count":0,"passed_count":0,"failed_count":0,"indeterminate_count":0,"note":"La cobertura de ejecución requiere ejecución con test runner (VNEXT-014). Cero certificación de ejecución en R5."},"gaps":[],"applicability_decisions":[],"closure_verdict":"ready_for_closure","blocker_reasons":[]}}],"approvals":2,"closures":["catalog","billing"],"receipts":2}
{"scenario":"distinct-module-retry","module":"catalog","result":{"status":"closed","idempotent":true,"decision_id":"070c7601-4a2c-4184-987c-283ce66eb451","request_digest":"eef963f30e2d5cdda98a1cdab91db3fd05aef532e4e31074895d3e64f81bdc80","coverage_digest":"1f5feb8d30ef30735ce29e4c3c34b290166e2aafc2ce3522ae47b8ae081f3f9e"}}
{"scenario":"distinct-module-retry","module":"billing","result":{"status":"closed","idempotent":true,"decision_id":"00818555-1ab6-4752-9a7a-0331ba050a6e","request_digest":"96ff1cd10b523a723e5d40e820102fa58fb4d4e118846407ac46c2fa4091aa18","coverage_digest":"81d12d670be995feb159f5ca585ca8bbd2788ca4fbfbadd42d228552f7ee479c"}}
{"scenario":"lost-response","action":"close","result":{"status":"closed","idempotent":true,"decision_id":"44441f5a-f1b7-4c33-bde0-9c722deeed75","request_digest":"f8cc303b315bac45b6a270eb0232a5ad2b47ca6a0af031574aedc8a2c4d2e5be","coverage_digest":"652ee206fad14b2e077a990fe7e14c8b09ee5156dbcf3e42e0161fcc397541f7"},"sameApprovalReceiptHistory":true}
{"scenario":"lost-response","action":"waive","result":{"status":"waived","idempotent":true,"decision_id":"5db25707-4432-4eea-8f93-7d5c0d03fc33","request_digest":"5998e6f3305832df9410534ed36c1355b75282f9b1a73f582155382d99c719be","coverage_digest":"d9c9a075d37570968f9660653ed3b637ecd1662f1fcde885d4180f5d689d70c1"},"sameApprovalReceiptHistory":true}

~~~

### crash

~~~text
{"scenario":"physical-kill-readback","stage":"before-commit","action":"close","approvals":0,"receipts":0,"lifecycle":"planned"}
{"scenario":"physical-kill-readback","stage":"after-closure","action":"close","approvals":1,"receipts":0,"lifecycle":"planned"}
{"scenario":"physical-kill-readback","stage":"after-receipt","action":"close","approvals":1,"receipts":1,"lifecycle":"planned"}
{"scenario":"physical-kill-readback","stage":"before-commit","action":"waive","approvals":0,"receipts":0,"lifecycle":"planned"}
{"scenario":"physical-kill-readback","stage":"after-closure","action":"waive","approvals":1,"receipts":0,"lifecycle":"planned"}
{"scenario":"physical-kill-readback","stage":"after-receipt","action":"waive","approvals":1,"receipts":1,"lifecycle":"planned"}
{"scenario":"physical-kill-recovered","stage":"before-commit","action":"close","status":"closed","idempotent":false,"gatewayCalls":1,"oneApprovalReceiptHistory":true,"projectedState":"closed"}
{"scenario":"physical-kill-recovered","stage":"after-closure","action":"close","status":"closed","idempotent":true,"gatewayCalls":0,"oneApprovalReceiptHistory":true,"projectedState":"closed"}
{"scenario":"physical-kill-recovered","stage":"after-receipt","action":"close","status":"closed","idempotent":true,"gatewayCalls":0,"oneApprovalReceiptHistory":true,"projectedState":"closed"}
{"scenario":"physical-kill-recovered","stage":"before-commit","action":"waive","status":"waived","idempotent":false,"gatewayCalls":1,"oneApprovalReceiptHistory":true,"projectedState":"waived"}
{"scenario":"physical-kill-recovered","stage":"after-closure","action":"waive","status":"waived","idempotent":true,"gatewayCalls":0,"oneApprovalReceiptHistory":true,"projectedState":"waived"}
{"scenario":"physical-kill-recovered","stage":"after-receipt","action":"waive","status":"waived","idempotent":true,"gatewayCalls":0,"oneApprovalReceiptHistory":true,"projectedState":"waived"}

~~~

### context

~~~text
{"scenario":"context-matrix","action":"declare_non_applicable","kind":"session","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"declare_non_applicable","kind":"session","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"declare_non_applicable","kind":"plan","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"declare_non_applicable","kind":"plan","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"declare_non_applicable","kind":"state","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"declare_non_applicable","kind":"state","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"declare_non_applicable","kind":"phase","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"declare_non_applicable","kind":"phase","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"declare_non_applicable","kind":"binding","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"declare_non_applicable","kind":"binding","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":true,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"accept_gaps","kind":"session","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"accept_gaps","kind":"session","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"accept_gaps","kind":"plan","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"accept_gaps","kind":"plan","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"accept_gaps","kind":"state","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"accept_gaps","kind":"state","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"accept_gaps","kind":"phase","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"accept_gaps","kind":"phase","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"accept_gaps","kind":"binding","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"accept_gaps","kind":"binding","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":true,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"close","kind":"session","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"close","kind":"session","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"close","kind":"plan","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"close","kind":"plan","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"close","kind":"state","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"close","kind":"state","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"close","kind":"phase","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"close","kind":"phase","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"close","kind":"binding","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"close","kind":"binding","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":true,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"waive","kind":"session","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"waive","kind":"session","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"waive","kind":"plan","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"waive","kind":"plan","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"waive","kind":"state","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"waive","kind":"state","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"waive","kind":"phase","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"waive","kind":"phase","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"waive","kind":"binding","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"waive","kind":"binding","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":true,"zeroAuthorization":true}
{"scenario":"lock-order","events":["gateway-no-lock","lifecycle-request","lifecycle-held","knowledge-request","knowledge-held","closure-request","closure-callback","knowledge-release","lifecycle-release"],"completedWithoutDeadlock":true}
{"scenario":"unlink-open-file","code":"EBUSY","disappearanceNotAchieved":true}

~~~

### process

~~~text
{"scenario":"two-process-results-before-readback","results":[{"type":"result","status":"waived","idempotent":true},{"type":"result","status":"waived"}]}
{"scenario":"two-physical-closure-processes","results":[{"type":"result","status":"waived","idempotent":true},{"type":"result","status":"waived"}],"singleApprovalClosureReceipt":true,"retry":"waived","idempotent":true}
{"scenario":"accept-approval-reuse","code":"closure_consistency_conflict","snapshotUnchanged":true,"approvals":1}

~~~

### process-mixed

~~~text
{"scenario":"two-process-results-before-readback","results":[{"type":"result","status":"closed"},{"type":"result","status":"closed","idempotent":true}]}
{"scenario":"two-physical-closure-processes","results":[{"type":"result","status":"closed"},{"type":"result","status":"closed","idempotent":true}],"singleApprovalClosureReceipt":true,"retry":"closed","idempotent":true}

~~~

### replay

~~~text
{"scenario":"gap-replay","variant":"exact-one","status":"gaps_accepted","idempotent":true,"originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"a30346b1-04fe-4e07-8ef5-5f8993a8ac92","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"exact-two","status":"gaps_accepted","idempotent":true,"originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"4c33cf6a-e56e-4fa7-8b39-aa4d6fb23f11","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"response-loss","status":"gaps_accepted","idempotent":true,"originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"a416f296-a86a-4618-8269-27a652ca05dc","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"reason","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"577b0616-fe0a-4adc-884a-55279e8ac0d2","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"new-id","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"f7610f84-8599-4d6e-956d-0dfe8507fd7b","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"duplicate-id","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"017b5ebe-6136-46ce-a0f2-860db61e2861","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"subset","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"484d143e-8ae5-4b5d-bbe6-cef6961c183d","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"reverse-order","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"f17eadc7-5978-4551-9fe1-b8bf244f8eb9","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"extra-id","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"fd107172-4d27-4f9f-a022-a4bcbead2b30","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"requirement-revision","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"f10f6761-d6b0-4862-8ed4-77da350b80f3","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"new-requirement","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"a82d1f72-fb19-4f57-acd9-7af010f76113","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"session","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"cd3bfc9b-f2ed-4e9f-a836-a5094c725090","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"phase","status":"blocked","code":"context_changed","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"a71ca4bc-7837-4bb1-903f-4400354b0483","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"plan","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"1edc4def-9fdd-4b93-a76b-397648417653","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"state","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"caf164a3-f9c8-4be7-8897-2333a9e2dfc0","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"binding","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"f21c8883-c2c1-4da3-a93e-5522b0ae75e3","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"module","status":"blocked","code":"unbound","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"fd1d6cc0-4944-4d8c-8650-c43266e9988a","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"approval-duplicate","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"80071c4e-0c75-45c5-8ac1-df20b157bd7d","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"approval-missing","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"1c87f270-cb2d-46fd-b94a-3c4b41e80257","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"approval-digest","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"a32ec4f8-9bc0-431d-a200-3bd4c04e7b76","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"receipt-other-module","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"41272f64-a73d-45f6-9f43-b25a141df50f","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"receipt-closure","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"875b3c39-6ecb-4b66-85b8-1f1034324dc9","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"receipt-unknown","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"85b7c953-541f-4b0b-847d-5d9279b81a67","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"gap-duplicate","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"1f09d4e3-9bea-41db-a18c-fe5a1d32a407","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"gap-reason","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"f636c03b-d451-47c5-a5f5-23385d2e9026","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-projection-only","unchanged":true}

~~~

### replay-process

~~~text
{"scenario":"gap-two-processes","mode":"replay","results":[{"type":"result","status":"gaps_accepted","idempotent":true,"decision_id":"a6f9c5fc-609e-4649-8c80-91cc8a22d6d3","calls":0},{"type":"result","status":"gaps_accepted","idempotent":true,"decision_id":"a6f9c5fc-609e-4649-8c80-91cc8a22d6d3","calls":0}]}
{"scenario":"gap-process-recovery","mode":"replay","oneApprovalAcceptedGapHistory":true,"zeroClosureAndKnowledgeReceipts":true,"retryIdempotent":true}
{"scenario":"gap-two-processes","mode":"race","results":[{"type":"result","status":"gaps_accepted","decision_id":"7b258204-459e-4c33-87cd-5197adc598f0","calls":1},{"type":"result","status":"blocked","code":"closure_context_changed","calls":1}]}
{"scenario":"gap-process-recovery","mode":"race","oneApprovalAcceptedGapHistory":true,"zeroClosureAndKnowledgeReceipts":true,"retryIdempotent":true}
{"scenario":"gap-process-recovery","mode":"crash","oneApprovalAcceptedGapHistory":true,"zeroClosureAndKnowledgeReceipts":true,"retryIdempotent":true}

~~~

### integrity

~~~text
{"scenario":"legitimate-history-after-expiry","idempotent":true,"unchanged":true}
{"scenario":"ciphertext-integrity","serviceThrows":"corrupt","corruptReadRefused":true,"noFalseAuthority":true}

~~~

### runtime-identity

~~~text
{"scenario":"runtime","node":"v24.15.0","platform":"win32","sqlite":"3.51.3","FTS5":true}
{"scenario":"relative-cwd","samePhysicalFile":true,"otherConnectionAndProcessBlocked":true,"recovered":true,"noStrayFile":true}
{"scenario":"file-identity","phase":"before","replacement":false,"renamed":false,"callback":false,"code":"EBUSY","pathExists":true}
{"scenario":"file-identity","phase":"before","replacement":true,"renamed":false,"callback":false,"code":"EBUSY","pathExists":true}
{"scenario":"file-identity","phase":"inside","replacement":false,"renamed":false,"callback":true,"code":"EBUSY","pathExists":true}
{"scenario":"file-identity","phase":"inside","replacement":true,"renamed":false,"callback":true,"code":"EBUSY","pathExists":true}

~~~

### extra, corrida definitiva

~~~text
{"scenario":"historical-r9","terminal":"closed","authorityPreserved":true,"noNewApprovalReceiptHistoryOrTransition":true,"readback":true}
{"scenario":"historical-r9","terminal":"waived","authorityPreserved":true,"noNewApprovalReceiptHistoryOrTransition":true,"readback":true}
{"scenario":"r9-pending-applicability","digestUnchanged":true,"status":"declared_non_applicable"}
{"scenario":"rollback","action":"declare_non_applicable","code":"closure_consistency_conflict","allAuthorizationStateUnchanged":true,"bothFencesReleased":true}
{"scenario":"rollback","action":"accept_gaps","code":"closure_consistency_conflict","allAuthorizationStateUnchanged":true,"bothFencesReleased":true}
{"scenario":"rollback","action":"close","code":"closure_consistency_conflict","allAuthorizationStateUnchanged":true,"bothFencesReleased":true}
{"scenario":"rollback","action":"waive","code":"closure_consistency_conflict","allAuthorizationStateUnchanged":true,"bothFencesReleased":true}
{"scenario":"official-process-lifecycle","alias":false,"writerCompletedDuringFence":false,"sessionDuringFence":"session-r5","samePhysicalRoot":true}
{"scenario":"official-process-recovery","alias":false,"writerRecovered":true}
{"scenario":"official-process-lifecycle","alias":true,"writerCompletedDuringFence":false,"sessionDuringFence":"session-r5","samePhysicalRoot":true}
{"scenario":"official-process-recovery","alias":true,"writerRecovered":true}
{"scenario":"fifo-queued-consumer","progressAfterRelease":true}

~~~

## Código de sondas externas de concurrencia

util y prepare se publican en HALLAZGOS. Las claves de fixture se pasan a procesos locales por el arnés, nunca se imprimen; ninguna es una credencial de usuario. No se hace commit de scripts ni datos: estos bloques Markdown permiten reproducir las verificaciones del auditor.

### expiry.mjs

~~~javascript
import {spawn} from 'node:child_process';import {once} from 'node:events';
import {assert,fixture,makeDecision,CanonicalClosureService,FileSystemStorage,DatabaseSync,withClosureCommitDeadline,emit,sleep,all,command,clean,capture,unchanged} from './util.mjs';
const busy=ms=>{const stop=Date.now()+ms;while(Date.now()<stop){}};
for(const action of ['declare_non_applicable','accept_gaps','close','waive'])for(const stage of ['human-review','before-transaction','after-callback','after-insert','wrapper-setImmediate','process-contention']){
 const f=await fixture(action==='accept_gaps'?{}:all),cmd=await command(f,action),before=await capture(f),original=f.closureStore.transaction.bind(f.closureStore);let deadline,inserted=false,child,release,hit=false;
 const gateway={reviewClosure:async r=>{deadline=Date.now()+500;const d={...makeDecision(r),expiresAt:new Date(deadline).toISOString()};if(stage==='human-review')await sleep(540);return d;}};
 if(stage==='before-transaction')f.closureStore.transaction=async(s,op)=>{await sleep(Math.max(0,deadline-Date.now()+40));hit=true;return original(s,op);};
 if(stage==='after-callback'||stage==='wrapper-setImmediate')f.closureStore.transaction=(s,op)=>original(s,async snapshot=>{const result=await op(snapshot);assert.equal(snapshot.approvals.length,1);hit=true;if(stage==='wrapper-setImmediate')await new Promise(r=>setImmediate(r));await sleep(Math.max(0,deadline-Date.now()+40));return result;});
 if(stage==='after-insert'){const db=f.closureStore.db,p=db.prepare.bind(db);db.prepare=sql=>{const stmt=p(sql);if(sql.startsWith('INSERT INTO closure_history')){const run=stmt.run.bind(stmt);stmt.run=(...args)=>{const v=run(...args);inserted=true;busy(Math.max(0,deadline-Date.now()+40));return v;};}return stmt;};}
 if(stage==='process-contention')f.closureStore.transaction=async(s,op)=>{child=spawn(process.execPath,['--input-type=module','-e',`import {DatabaseSync} from 'node:sqlite';const d=new DatabaseSync(process.argv[1]);d.exec('BEGIN IMMEDIATE');console.log('HELD');process.on('message',()=>{d.exec('ROLLBACK');d.close();process.disconnect();});`,f.closureStorePath],{stdio:['ignore','pipe','pipe','ipc']});const ended=once(child,'exit');await new Promise((r,j)=>{child.stdout.on('data',b=>{if(b.toString().includes('HELD'))r();});child.on('error',j);});const probe=new DatabaseSync(f.closureStorePath);probe.exec('PRAGMA busy_timeout=0');assert.throws(()=>probe.exec('BEGIN IMMEDIATE'));probe.close();await sleep(Math.max(0,deadline-Date.now()+40));child.send('release');await ended;hit=true;return original(s,op);};
 try{const r=await new CanonicalClosureService(f.store,f.context,f.closureStore,gateway).execute('catalog',cmd);assert.equal(r.status,'blocked');assert.ok(['closure_review_expired','closure_consistency_conflict'].includes(r.code));await unchanged(f,before);if(stage==='after-insert')assert.equal(inserted,true);await new FileSystemStorage({rootDir:f.root.toUpperCase()}).withLifecycleFence(async()=>{});await f.store.withWriteFence('app-r5',async()=>{});f.closureStore.transaction=original;const retry=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>makeDecision(r)}).execute('catalog',cmd);assert.notEqual(retry.status,'blocked');emit({scenario:'deadline',action,stage,code:r.code,snapshotHistoryReceiptsLifecycleUnchanged:true,insertRolledBack:inserted,fencesAndNewAuthorizationRecovered:true});}finally{if(child?.exitCode===null)child.kill();clean(f);}
}
// Context does not bleed into ordinary store calls, and delayed port decorators inherit ALS.
{const f=await fixture();try{await assert.rejects(()=>withClosureCommitDeadline(Date.now()-1,()=>f.closureStore.transaction(f.context,async s=>s.approvals.push(['expired','x']))),e=>e.code==='authorization_expired');assert.equal(f.closureStore.read(f.context).approvals.length,0);await f.closureStore.transaction(f.context,async s=>s.approvals.push(['isolated-fixture','x']));assert.equal(f.closureStore.read(f.context).approvals.length,1);emit({scenario:'deadline-context',expiredRejected:true,ordinaryCallUnaffected:true});}finally{clean(f);}}


~~~

### locks.mjs

~~~javascript
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,statSync,symlinkSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {DatabaseSync} from 'node:sqlite';
import {fixture,makeDecision,CanonicalClosureService,FileSystemStorage} from '../audit-r4-r10/packages/mcp/node_modules/.audit-rescate/fixture.mjs';
const url=new URL('../audit-r4-r10/packages/mcp/node_modules/.audit-rescate/fixture.mjs',import.meta.url).href;
const all={confirmedReqs:['functional','business_rule','security','ui','ux','regression','performance'].map(category=>({category,title:category}))};
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),emit=x=>console.log(JSON.stringify(x));
const mutate=(s,kind)=>{if(kind==='session')s.session.id='alias-writer';if(kind==='plan')s.session.plan[0].path='/alias-writer';if(kind==='phase')s.phase='WRAP_UP';if(kind==='state')s.modules.catalog.state='observed';return s;};
const reason='Razón sintética de prueba aislada para verificar la exclusión oficial';
const cmd=async(f,a)=>a==='accept_gaps'?{action:a,accepted_gaps:[{gap_id:(await f.coverageService.evaluate('catalog')).assessment.gaps.find(g=>g.status==='unaddressed').id,reason}]}:a==='declare_non_applicable'?{action:a,decisions:[{category:'performance',reason}]}:a==='waive'?{action:a,reason}:{action:a};
for(const action of ['declare_non_applicable','accept_gaps','close','waive'])for(const kind of ['session','plan','phase','state'])for(const stage of ['entry','after-callback'])for(const mode of ['same-process','child-process']){
 const f=await fixture(action==='accept_gaps'?{}:all),command=await cmd(f,action),orig=f.closureStore.transaction.bind(f.closureStore);let pending,child,done=false,heldLocks,atCommit;
 const start=async()=>{const alias=f.root.toUpperCase();assert.equal(statSync(alias).ino,statSync(f.root).ino);
  if(mode==='same-process')pending=new FileSystemStorage({rootDir:alias}).updateLifecycleState(s=>mutate(s,kind)).then(()=>{done=true;});
  else{child=spawn(process.execPath,['--input-type=module','-e',`import {FileSystemStorage} from ${JSON.stringify(url)};console.log('START');await new FileSystemStorage({rootDir:process.argv[1]}).updateLifecycleState(s=>{(${mutate.toString()})(s,process.argv[2]);return s;});console.log('DONE');`,alias,kind],{stdio:['ignore','pipe','pipe']});let err='';child.stderr.on('data',b=>err+=b);const exited=once(child,'exit');await new Promise((res,rej)=>{child.stdout.on('data',b=>{if(b.toString().includes('START'))res();});child.on('error',rej);});pending=exited.then(([c])=>{assert.equal(c,0,err);done=true;});}
  await sleep(110);assert.equal(done,false);heldLocks=readdirSync(f.root+'/.qa/cache/locks').filter(x=>x.endsWith('.lock'));assert.equal(heldLocks.length,1);
 };
 f.closureStore.transaction=async(scope,op)=>{if(stage==='entry')await start();return orig(scope,async s=>{const result=await op(s);if(stage==='after-callback')await start();atCommit=JSON.parse(readFileSync(f.lifecyclePath));assert.equal(atCommit.session.id,'session-r5');assert.equal(atCommit.session.plan[0].path,'/');assert.equal(atCommit.phase,'WORKING');assert.equal(atCommit.modules.catalog.state,'planned');return result;});};
 try{const result=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>makeDecision(r)}).execute('catalog',command);assert.equal(result.status,{declare_non_applicable:'declared_non_applicable',accept_gaps:'gaps_accepted',close:'closed',waive:'waived'}[action]);await pending;assert.equal(done,true);assert.equal(f.closureStore.read(f.context).approvals.length,1);const ro=f.openClosureStore();assert.equal(ro.read(f.context).approvals.length,1);ro.close();emit({scenario:'alias-matrix',action,kind,stage,mode,singleSharedLock:true,unchangedBeforePhysicalCommit:true,recovered:true,status:result.status});}finally{if(child?.exitCode===null)child.kill();f.closureStore.close();f.store.close();}
}
// The canonical lock survives an atomic lifecycle replacement and resolves a root junction.
{const f=await fixture(),alias=f.root+'-junction';try{symlinkSync(f.root,alias,'junction');let done=false,p;await new FileSystemStorage({rootDir:f.root}).withLifecycleFence(async()=>{p=new FileSystemStorage({rootDir:alias}).updateLifecycleState(s=>mutate(s,'session')).then(()=>{done=true;});await sleep(110);assert.equal(done,false);});await p;assert.equal(done,true);emit({scenario:'junction-root',sameLock:true,recovered:true});}finally{f.closureStore.close();f.store.close();}}
// Exceptions release the shared lock without changing lifecycle or consuming authority.
{const f=await fixture(),before=readFileSync(f.lifecyclePath,'utf8');try{await assert.rejects(new FileSystemStorage({rootDir:f.root}).withLifecycleFence(async()=>{throw Error('external lock fault');}));assert.equal(readFileSync(f.lifecyclePath,'utf8'),before);await new FileSystemStorage({rootDir:f.root.toUpperCase()}).withLifecycleFence(async()=>{});assert.equal(f.closureStore.read(f.context).approvals.length,0);emit({scenario:'lock-exception',unchanged:true,recoveredThroughAlias:true});}finally{f.closureStore.close();f.store.close();}}

~~~

### terminal.mjs

~~~javascript
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {fixture,makeDecision,CanonicalClosureService,SqliteKnowledgeAdapter} from '../audit-r4-r10/packages/mcp/node_modules/.audit-rescate/fixture.mjs';
const emit=x=>console.log(JSON.stringify(x)),reason='Razón sintética sustantiva aislada para verificar concurrencia';
const all={confirmedReqs:['functional','business_rule','security','ui','ux','regression','performance'].map(category=>({category,title:category}))};
const history=f=>{const d=new DatabaseSync(f.closureStorePath);try{return d.prepare('SELECT generation,hex(payload) payload FROM closure_history').all();}finally{d.close();}};
const close=f=>{f.closureStore.close();f.store.close();};
// Two real adapters and two closure connections, with the loser already past its initial read.
for(const alteration of ['valid','trace-source','trace-reason','trace-review','entity-source','approval-missing','approval-digest','approval-duplicate']){
 const f=await fixture(),k=new SqliteKnowledgeAdapter(f.knowledgePath),s=f.openClosureStore();let loserReady,allowLoser;const ready=new Promise(r=>{loserReady=r;}),gate=new Promise(r=>{allowLoser=r;});let calls=0;
 const winner=new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>makeDecision(r)});
 const loser=new CanonicalClosureService(k,f.context,s,{reviewClosure:async r=>{calls++;loserReady();await gate;return makeDecision(r);}});
 try{const pending=loser.execute('catalog',{action:'waive',reason});await ready;assert.equal((await winner.execute('catalog',{action:'waive',reason})).status,'waived');
  if(alteration.startsWith('trace')||alteration==='entity-source'){const snap=f.closureStore.read(f.context),id='waiver:'+snap.closures.catalog.decisionId,r=await f.store.get('app-r5','relation',id),trace={...r.trace},entity=structuredClone(r.entity);if(alteration==='trace-source')trace.source='external_untrusted';if(alteration==='trace-reason')trace.reason='changed-request';if(alteration==='trace-review')trace.review='unreviewed';if(alteration==='entity-source'){const m=await f.store.get('app-r5','module','mod-catalog');await f.store.commit('app-r5',[{kind:'module',expected_revision:0,trace:m.trace,entity:{...m.entity,id:'different-module',key:'different'}}]);entity.source.id='different-module';}await f.store.commit('app-r5',[{kind:'relation',expected_revision:r.revision,trace,entity}]);}
  if(alteration.startsWith('approval'))await f.closureStore.transaction(f.context,async snap=>{if(alteration==='approval-missing')snap.approvals=[];if(alteration==='approval-digest')snap.approvals[0][1]='changed-digest';if(alteration==='approval-duplicate')snap.approvals.push([...snap.approvals[0]]);});
  const before=f.closureStore.read(f.context),h=history(f),life=readFileSync(f.lifecyclePath,'utf8'),relations=await f.store.query('app-r5','relation');allowLoser();const result=await pending;
  assert.equal(result.status,alteration==='valid'?'waived':'blocked');if(alteration==='valid')assert.equal(result.idempotent,true);assert.deepEqual(f.closureStore.read(f.context),before);assert.deepEqual(history(f),h);assert.equal(readFileSync(f.lifecyclePath,'utf8'),life);assert.deepEqual(await f.store.query('app-r5','relation'),relations);assert.equal(calls,1);
  emit({scenario:'durable-winner',alteration,result,secondAuthorizationConsumed:false,noNewReceiptHistoryOrTransition:true});
 }finally{allowLoser();k.close();s.close();close(f);}
}
// Closing two distinct modules: capture any global-snapshot conflict without hiding it.
{const f=await fixture(all),k=new SqliteKnowledgeAdapter(f.knowledgePath),s=f.openClosureStore();try{const m=await f.store.get('app-r5','module','mod-catalog');await f.store.commit('app-r5',[{kind:'module',expected_revision:0,trace:m.trace,entity:{...m.entity,id:'mod-billing',key:'billing',title:'Billing'}}]);for(const r of (await f.store.query('app-r5','requirement')).items)await f.store.commit('app-r5',[{kind:'requirement',expected_revision:0,trace:r.trace,entity:{...r.entity,id:r.id+'-billing',module_key:'billing'}}]);
 const {FileSystemStorage}=await import('../audit-r4-r10/packages/mcp/node_modules/.audit-rescate/fixture.mjs');await new FileSystemStorage({rootDir:f.root}).updateLifecycleState(l=>{l.modules.billing={...l.modules.catalog};l.session.plan.push({module:'billing',path:'/billing'});return l;});const ctx=structuredClone(f.context);ctx.moduleBindings.push({...ctx.moduleBindings[0],plannedName:'billing',moduleId:'mod-billing',moduleKey:'billing'});let n=0,release;const gate=new Promise(r=>{release=r;}),gateway={reviewClosure:async r=>{if(++n===2)release();await gate;return makeDecision(r);}};
 const a=new CanonicalClosureService(f.store,ctx,f.closureStore,gateway),b=new CanonicalClosureService(k,ctx,s,gateway);const results=await Promise.all([a.execute('catalog',{action:'close'}),b.execute('billing',{action:'close'})]);const snap=f.closureStore.read(ctx);emit({scenario:'distinct-modules',results,approvals:snap.approvals.length,closures:Object.keys(snap.closures),receipts:(await f.store.query('app-r5','relation')).items.length});
 for(const [i,svc] of [a,b].entries()){const name=i?'billing':'catalog',r=await svc.execute(name,{action:'close'});emit({scenario:'distinct-module-retry',module:name,result:r});}assert.equal(Object.keys(f.closureStore.read(ctx).closures).length,2);
 }finally{k.close();s.close();close(f);}}
// Exact retry after a lost response preserves durable ciphertext/history and relation revision.
for(const action of ['close','waive']){const f=await fixture(all);try{const svc=new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>makeDecision(r)});await svc.execute('catalog',action==='waive'?{action,reason}:{action});const before=f.closureStore.read(f.context),h=history(f),rels=await f.store.query('app-r5','relation'),life=readFileSync(f.lifecyclePath,'utf8');const result=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async()=>{throw Error('unexpected second gateway');}}).execute('catalog',action==='waive'?{action,reason}:{action});assert.equal(result.idempotent,true);assert.deepEqual(f.closureStore.read(f.context),before);assert.deepEqual(history(f),h);assert.deepEqual(await f.store.query('app-r5','relation'),rels);assert.equal(readFileSync(f.lifecyclePath,'utf8'),life);emit({scenario:'lost-response',action,result,sameApprovalReceiptHistory:true});}finally{close(f);}}



~~~

### crash.mjs

~~~javascript
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {fixture,makeDecision,CanonicalClosureService} from '../audit-r4-r10/packages/mcp/node_modules/.audit-rescate/fixture.mjs';
const url=new URL('../audit-r4-r10/packages/mcp/node_modules/.audit-rescate/fixture.mjs',import.meta.url).href;
const all={confirmedReqs:['functional','business_rule','security','ui','ux','regression','performance'].map(category=>({category,title:category}))},reason='Renuncia sintética aislada aprobada por gateway de prueba de recuperación';
const code=`import {SqliteKnowledgeAdapter,SqliteModuleClosureStore,CanonicalClosureService,makeDecision} from ${JSON.stringify(url)};
process.on('message',async m=>{const k=new SqliteKnowledgeAdapter(m.path),s=new SqliteModuleClosureStore({...m.options,key:Buffer.from(m.key,'base64')});const park=async()=>{process.send({type:'parked'});setInterval(()=>{},1000);await new Promise(()=>{});};const tx=s.transaction.bind(s),commit=k.commit.bind(k);
if(m.stage==='before-commit')s.transaction=(scope,op)=>tx(scope,async snap=>{const result=await op(snap);await park();return result;});
if(m.stage==='after-closure')s.transaction=async(scope,op)=>{const result=await tx(scope,op);await park();return result;};
if(m.stage==='after-receipt')k.commit=async(app,writes)=>{const result=await commit(app,writes);if(writes.some(w=>w.kind==='relation'))await park();return result;};
try{await new CanonicalClosureService(k,m.ctx,s,{reviewClosure:async r=>makeDecision(r)}).execute('catalog',m.action==='close'?{action:'close'}:{action:'waive',reason:m.reason});process.send({type:'unexpected-return'});}catch(e){process.send({type:'error',message:e.message});}});`;
const jobs=[];
try{for(const action of ['close','waive'])for(const stage of ['before-commit','after-closure','after-receipt']){const f=await fixture(all),child=spawn(process.execPath,['--input-type=module','-e',code],{stdio:['ignore','pipe','pipe','ipc']});const exited=once(child,'exit');let stderr='';child.stderr.on('data',b=>stderr+=b);const parked=new Promise((resolve,reject)=>{child.on('error',reject);child.on('message',m=>m.type==='parked'?resolve():reject(Error(JSON.stringify(m))));child.on('exit',c=>{if(c)reject(Error(stderr));});});jobs.push({f,child,exited,parked,action,stage});child.send({path:f.knowledgePath,key:f.closureKey.toString('base64'),ctx:f.context,action,stage,reason,options:{projectRoot:f.root,applicationId:'app-r5',environmentId:'local',path:f.closureStorePath,protection:'host_private_directory_and_managed_key'}});}
 await Promise.all(jobs.map(j=>j.parked));for(const j of jobs)j.child.kill();await Promise.all(jobs.map(j=>j.exited));
 for(const {f,stage,action} of jobs){const snap=f.closureStore.read(f.context);assert.equal(snap.approvals.length,stage==='before-commit'?0:1);const n=(await f.store.query('app-r5','relation')).items.length;assert.equal(n,stage==='after-receipt'?1:0);console.log(JSON.stringify({scenario:'physical-kill-readback',stage,action,approvals:snap.approvals.length,receipts:n,lifecycle:JSON.parse(readFileSync(f.lifecyclePath)).modules.catalog.state}));}
 await new Promise(r=>setTimeout(r,11000));
 for(const {f,stage,action} of jobs){let calls=0;const svc=new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>{calls++;assert.equal(stage,'before-commit');return makeDecision(r);}}),command=action==='close'?{action}:{action,reason};const result=await svc.execute('catalog',command);assert.equal(result.status,action==='close'?'closed':'waived');assert.equal(calls,stage==='before-commit'?1:0);const snap=f.closureStore.read(f.context),relations=await f.store.query('app-r5','relation');assert.equal(snap.approvals.length,1);assert.equal(Object.keys(snap.closures).length,1);assert.equal(relations.items.length,1);const db=new DatabaseSync(f.closureStorePath);const generations=db.prepare('SELECT count(*) n FROM closure_history').get().n;db.close();assert.equal(generations,1);const again=await svc.execute('catalog',command);assert.equal(again.idempotent,true);assert.equal(calls,stage==='before-commit'?1:0);console.log(JSON.stringify({scenario:'physical-kill-recovered',stage,action,status:result.status,idempotent:result.idempotent===true,gatewayCalls:calls,oneApprovalReceiptHistory:true,projectedState:JSON.parse(readFileSync(f.lifecyclePath)).modules.catalog.state}));}
}finally{for(const {child,f} of jobs){if(child.exitCode===null)child.kill();f.closureStore.close();f.store.close();}}

~~~

### context.mjs

~~~javascript
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {fixture,makeDecision,CanonicalClosureService,FileSystemStorage} from '../audit-r4-r10/packages/mcp/node_modules/.audit-rescate/fixture.mjs';
const categories=['functional','business_rule','security','ui','ux','regression','performance'],all={confirmedReqs:categories.map(category=>({category,title:category}))};
const reason='Razón sintética sustantiva y aislada para verificar el contrato';
const command=async(f,action)=>action==='accept_gaps'?{action,accepted_gaps:[{gap_id:(await f.coverageService.evaluate('catalog')).assessment.gaps.find(g=>g.status==='unaddressed').id,reason}]}:action==='declare_non_applicable'?{action,decisions:[{category:'performance',reason}]}:action==='waive'?{action,reason}:{action};
const emit=x=>console.log(JSON.stringify(x));const clean=f=>{f.closureStore.close();f.store.close();};
const mutate=(s,kind)=>{if(kind==='session')s.session.id='new';if(kind==='plan')s.session.plan[0].path='/new';if(kind==='state')s.modules.catalog.state='observed';if(kind==='phase')s.phase='WRAP_UP';return s;};
for(const action of ['declare_non_applicable','accept_gaps','close','waive'])for(const kind of ['session','plan','state','phase','binding'])for(const stage of ['gateway','transaction-entry']){const f=await fixture(action==='accept_gaps'?{}:all),cmd=await command(f,action),before=f.closureStore.read(f.context),life=readFileSync(f.lifecyclePath,'utf8');let writerBlocked=false;const mutation=async()=>{if(kind==='binding'){const m=await f.store.get('app-r5','module','mod-catalog');try{await f.store.commit('app-r5',[{kind:'module',expected_revision:m.revision,entity:{...m.entity,title:'Changed binding revision'},trace:m.trace}]);}catch(e){assert.equal(e.code,'UNAVAILABLE');writerBlocked=true;throw e;}}else if(stage==='gateway')await new FileSystemStorage({rootDir:f.root}).updateLifecycleState(s=>mutate(s,kind));else writeFileSync(f.lifecyclePath,JSON.stringify(mutate(JSON.parse(readFileSync(f.lifecyclePath)),kind)));};const original=f.closureStore.transaction.bind(f.closureStore);if(stage==='transaction-entry')f.closureStore.transaction=async(scope,op)=>{await mutation();return original(scope,op);};try{const result=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>{if(stage==='gateway')await mutation();return makeDecision(r);}}).execute('catalog',cmd);assert.equal(result.status,'blocked');assert.deepEqual(f.closureStore.read(f.context),before);assert.equal((await f.store.query('app-r5','relation')).items.length,0);if(kind==='binding'&&stage==='transaction-entry')assert.equal(readFileSync(f.lifecyclePath,'utf8'),life);emit({scenario:'context-matrix',action,kind,stage,code:result.code,writerBlocked,zeroAuthorization:true});}finally{clean(f);}}
// Instrument lock order with original methods, without introducing recursive acquisition.
{const f=await fixture(all),events=[];const life=FileSystemStorage.prototype.withLifecycleFence,knowledge=f.store.withWriteFence.bind(f.store),tx=f.closureStore.transaction.bind(f.closureStore);let fsHeld=false,kHeld=false;
 FileSystemStorage.prototype.withLifecycleFence=function(op){events.push('lifecycle-request');return life.call(this,async()=>{fsHeld=true;events.push('lifecycle-held');try{return await op();}finally{fsHeld=false;events.push('lifecycle-release');}});};
 f.store.withWriteFence=(app,op)=>{assert.equal(fsHeld,true);events.push('knowledge-request');return knowledge(app,async()=>{kHeld=true;events.push('knowledge-held');try{return await op();}finally{kHeld=false;events.push('knowledge-release');}});};
 f.closureStore.transaction=(scope,op)=>{assert.equal(fsHeld,true);assert.equal(kHeld,true);events.push('closure-request');return tx(scope,async s=>{events.push('closure-callback');return op(s);});};
 try{const result=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>{assert.equal(fsHeld,false);assert.equal(kHeld,false);events.push('gateway-no-lock');return makeDecision(r);}}).execute('catalog',await command(f,'close'));assert.equal(result.status,'closed');emit({scenario:'lock-order',events,completedWithoutDeadlock:true});}finally{FileSystemStorage.prototype.withLifecycleFence=life;clean(f);}}
// Actual disappearance attempt is prevented by this Windows SQLite open handle.
{const f=await fixture();try{let code;try{unlinkSync(f.knowledgePath);}catch(e){code=e.code;}assert.ok(code);emit({scenario:'unlink-open-file',code,disappearanceNotAchieved:true});}finally{clean(f);}}


~~~

### process.mjs

~~~javascript
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fixture,makeDecision,CanonicalClosureService} from '../audit-r4-r10/packages/mcp/node_modules/.audit-rescate/fixture.mjs';
const emit=x=>console.log(JSON.stringify(x));
const f=await fixture(),url=new URL('../audit-r4-r10/packages/mcp/node_modules/.audit-rescate/fixture.mjs',import.meta.url).href;
const code=`import {SqliteKnowledgeAdapter,SqliteModuleClosureStore,CanonicalClosureService,makeDecision} from ${JSON.stringify(url)};
let release;process.on('message',async m=>{if(m.type==='go'){release();return;}if(m.type!=='start')return;const k=new SqliteKnowledgeAdapter(m.knowledgePath),s=new SqliteModuleClosureStore({...m.options,key:Buffer.from(m.key,'base64')});try{const svc=new CanonicalClosureService(k,m.context,s,{reviewClosure:async r=>{process.send({type:'ready'});await new Promise(resolve=>{release=resolve;});return makeDecision(r);}});const result=await svc.execute('catalog',{action:'waive',reason:'Renuncia sintética aislada aprobada por gateway del proceso de prueba'});process.send({type:'result',status:result.status,code:result.code,idempotent:result.idempotent});}catch(e){process.send({type:'error',message:e.message});}finally{s.close();k.close();process.disconnect();}});`;
const children=[];
try{const jobs=[0,1].map(()=>{const child=spawn(process.execPath,['--input-type=module','-e',code],{stdio:['ignore','pipe','pipe','ipc']});children.push(child);let readyResolve,resultResolve;const ready=new Promise(r=>{readyResolve=r;}),result=new Promise((resolve,reject)=>{resultResolve=resolve;child.on('error',reject);child.on('exit',c=>{if(c)reject(Error('child exit '+c));});});child.on('message',m=>{if(m.type==='ready')readyResolve();if(m.type==='result')resultResolve(m);if(m.type==='error')resultResolve(m);});child.send({type:'start',knowledgePath:f.knowledgePath,context:f.context,key:f.closureKey.toString('base64'),options:{projectRoot:f.root,applicationId:'app-r5',environmentId:'local',path:f.closureStorePath,protection:'host_private_directory_and_managed_key'}});const exited=once(child,'exit');return {child,ready,result,exited};});await Promise.all(jobs.map(j=>j.ready));jobs.forEach(j=>j.child.send({type:'go'}));const results=await Promise.all(jobs.map(j=>j.result));await Promise.all(jobs.map(j=>j.exited));emit({scenario:'two-process-results-before-readback',results});assert.ok(results.some(r=>r.status==='waived'));const snap=f.closureStore.read(f.context);assert.equal(snap.approvals.length,1);assert.equal(Object.keys(snap.closures).length,1);assert.equal((await f.store.query('app-r5','relation')).items.length,1);const retry=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async()=>{throw Error('must not request new approval');}}).execute('catalog',{action:'close'});assert.equal(retry.idempotent,true);emit({scenario:'two-physical-closure-processes',results,singleApprovalClosureReceipt:true,retry:retry.status,idempotent:retry.idempotent});}finally{for(const c of children)if(c.exitCode===null)c.kill();f.closureStore.close();f.store.close();}
// Reusing one actual approval ID for another existing gap cannot consume authority twice.
{const f=await fixture({gateway:{reviewClosure:async r=>({...makeDecision(r),approvalId:'isolated-single-use-approval'})}});try{const assessment=(await f.coverageService.evaluate('catalog')).assessment;const command=g=>({action:'accept_gaps',accepted_gaps:[{gap_id:g.id,reason:'Razón sustantiva sintética exacta para aceptar esta brecha existente'}]});assert.equal((await f.closureService.execute('catalog',command(assessment.gaps[0]))).status,'gaps_accepted');const before=f.closureStore.read(f.context);const result=await f.closureService.execute('catalog',command(assessment.gaps[1]));assert.equal(result.status,'blocked');assert.deepEqual(f.closureStore.read(f.context),before);emit({scenario:'accept-approval-reuse',code:result.code,snapshotUnchanged:true,approvals:before.approvals.length});}finally{f.closureStore.close();f.store.close();}}



~~~

### process-mixed.mjs

~~~javascript
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fixture,makeDecision,CanonicalClosureService} from '../audit-r4-r10/packages/mcp/node_modules/.audit-rescate/fixture.mjs';
const emit=x=>console.log(JSON.stringify(x));
const f=await fixture({confirmedReqs:['functional','business_rule','security','ui','ux','regression','performance'].map(category=>({category,title:category}))}),url=new URL('../audit-r4-r10/packages/mcp/node_modules/.audit-rescate/fixture.mjs',import.meta.url).href;
const code=`import {SqliteKnowledgeAdapter,SqliteModuleClosureStore,CanonicalClosureService,makeDecision} from ${JSON.stringify(url)};
let release;process.on('message',async m=>{if(m.type==='go'){release();return;}if(m.type!=='start')return;const k=new SqliteKnowledgeAdapter(m.knowledgePath),s=new SqliteModuleClosureStore({...m.options,key:Buffer.from(m.key,'base64')});try{const svc=new CanonicalClosureService(k,m.context,s,{reviewClosure:async r=>{process.send({type:'ready'});await new Promise(resolve=>{release=resolve;});return makeDecision(r);}});const result=await svc.execute('catalog',m.action==='close'?{action:'close'}:{action:'waive',reason:'Renuncia sintética aislada aprobada por gateway del proceso de prueba'});process.send({type:'result',status:result.status,code:result.code,idempotent:result.idempotent});}catch(e){process.send({type:'error',message:e.message});}finally{s.close();k.close();process.disconnect();}});`;
const children=[];
try{const jobs=[0,1].map(idx=>{const child=spawn(process.execPath,['--input-type=module','-e',code],{stdio:['ignore','pipe','pipe','ipc']});children.push(child);let readyResolve,resultResolve;const ready=new Promise(r=>{readyResolve=r;}),result=new Promise((resolve,reject)=>{resultResolve=resolve;child.on('error',reject);child.on('exit',c=>{if(c)reject(Error('child exit '+c));});});child.on('message',m=>{if(m.type==='ready')readyResolve();if(m.type==='result')resultResolve(m);if(m.type==='error')resultResolve(m);});child.send({type:'start',action:idx===0?'close':'waive',knowledgePath:f.knowledgePath,context:f.context,key:f.closureKey.toString('base64'),options:{projectRoot:f.root,applicationId:'app-r5',environmentId:'local',path:f.closureStorePath,protection:'host_private_directory_and_managed_key'}});const exited=once(child,'exit');return {child,ready,result,exited};});await Promise.all(jobs.map(j=>j.ready));jobs.forEach(j=>j.child.send({type:'go'}));const results=await Promise.all(jobs.map(j=>j.result));await Promise.all(jobs.map(j=>j.exited));emit({scenario:'two-process-results-before-readback',results});assert.ok(results.every(r=>r.status==='waived'||r.status==='closed'));assert.equal(results[0].status,results[1].status);const snap=f.closureStore.read(f.context);assert.equal(snap.approvals.length,1);assert.equal(Object.keys(snap.closures).length,1);assert.equal((await f.store.query('app-r5','relation')).items.length,1);const retry=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async()=>{throw Error('must not request new approval');}}).execute('catalog',{action:'close'});assert.equal(retry.idempotent,true);emit({scenario:'two-physical-closure-processes',results,singleApprovalClosureReceipt:true,retry:retry.status,idempotent:retry.idempotent});}finally{for(const c of children)if(c.exitCode===null)c.kill();f.closureStore.close();f.store.close();}


~~~

### replay.mjs

~~~javascript
import {assert,fixture,makeDecision,CanonicalClosureService,FileSystemStorage,emit,all,command,clean,capture,unchanged,reason} from './util.mjs';
const negative=['reason','new-id','duplicate-id','subset','reverse-order','extra-id','requirement-revision','new-requirement','session','phase','plan','state','binding','module','approval-duplicate','approval-missing','approval-digest','receipt-other-module','receipt-closure','receipt-unknown','gap-duplicate','gap-reason'];
for(const variant of ['exact-one','exact-two','response-loss',...negative]){
 let calls=0,request;const f=await fixture({observationalReqs:[{category:'security',title:'Isolated pending requirement'}]});
 try{const cmd=await command(f,'accept_gaps');const assessment=(await f.coverageService.evaluate('catalog')).assessment;
 if(['exact-two','subset','reverse-order','extra-id'].includes(variant))cmd.accepted_gaps.push({gap_id:assessment.gaps[1].id,reason:reason+' segunda'});
 const svc=new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>{calls++;request=structuredClone(r);return makeDecision(r);}});
 const first=await svc.execute('catalog',cmd);assert.equal(first.status,'gaps_accepted');assert.deepEqual(request.acceptedGaps,cmd.accepted_gaps);assert.equal(request.coverageDigest,assessment.coverage_digest);
 let retry=structuredClone(cmd),ctx=structuredClone(f.context),module='catalog';
 if(variant==='reason')retry.accepted_gaps[0].reason+=' diferente';
 if(variant==='new-id')retry.accepted_gaps[0].gap_id='nonexistent';
 if(variant==='duplicate-id')retry.accepted_gaps.push({...retry.accepted_gaps[0]});
 if(variant==='subset')retry.accepted_gaps.pop();
 if(variant==='reverse-order')retry.accepted_gaps.reverse();
 if(variant==='extra-id')retry.accepted_gaps.push({gap_id:assessment.gaps[2].id,reason});
 if(variant==='requirement-revision'||variant==='new-requirement'){const r=await f.store.get('app-r5','requirement','req-obs-1');await f.store.commit('app-r5',[{kind:'requirement',expected_revision:variant==='new-requirement'?0:r.revision,trace:r.trace,entity:{...r.entity,id:variant==='new-requirement'?'req-new':r.id,title:'Revision changed'}}]);}
 if(['session','phase','plan','state'].includes(variant))await new FileSystemStorage({rootDir:f.root}).updateLifecycleState(l=>{if(variant==='session')l.session.id='new-session';if(variant==='phase')l.phase='WRAP_UP';if(variant==='plan')l.session.plan[0].path='/different';if(variant==='state')l.modules.catalog.state='observed';return l;});
 if(variant==='binding'){const m=await f.store.get('app-r5','module','mod-catalog');await f.store.commit('app-r5',[{kind:'module',expected_revision:m.revision,trace:m.trace,entity:{...m.entity,title:'Revised module'}}]);ctx.moduleBindings[0].moduleRevision++;}
 if(variant==='module')module='billing';
 if(variant.startsWith('approval')||variant.startsWith('receipt')||variant.startsWith('gap-'))await f.closureStore.transaction(f.context,async s=>{const row=s.acceptedGaps.catalog[0],id=row.acceptance_receipt;if(variant==='approval-duplicate')s.approvals.push([...s.approvals[0]]);if(variant==='approval-missing')s.approvals=[];if(variant==='approval-digest')s.approvals[0][1]='altered';if(variant==='receipt-other-module')s.acceptedGaps.billing=[{...row}];if(variant==='receipt-closure')s.closures.billing={decisionId:id};if(variant==='receipt-unknown')row.acceptance_receipt='no-approval';if(variant==='gap-duplicate')s.acceptedGaps.catalog.push({...row});if(variant==='gap-reason')row.reason+=' tampered';});
 const before=await capture(f);let retryCalls=0;const other=f.openClosureStore();try{const r=await new CanonicalClosureService(f.store,ctx,other,{reviewClosure:async()=>{retryCalls++;return null;}}).execute(module,retry);const positive=['exact-one','exact-two','response-loss'].includes(variant);if(positive){assert.equal(r.status,'gaps_accepted');assert.equal(r.idempotent,true);assert.equal(r.decision_id,first.decision_id);assert.equal(retryCalls,0);}else assert.equal(r.status,'blocked');await unchanged(f,before);assert.equal(calls,1);emit({scenario:'gap-replay',variant,status:r.status,code:r.code,idempotent:r.idempotent,originalGatewayCalls:calls,retryGatewayCalls:retryCalls,receipt:first.decision_id,authoritySnapshotHistoryLifecycleUnchanged:true});}finally{other.close();}
 }finally{clean(f);}
}
// Projection-only reconstruction cannot mutate the encrypted snapshot or evaluator readback.
{const f=await fixture();try{const cmd=await command(f,'accept_gaps');await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>makeDecision(r)}).execute('catalog',cmd);const before=await capture(f),normal=await f.coverageService.evaluate('catalog'),base=await f.coverageService.evaluate('catalog',{excludeStoredAcceptedGapIds:[cmd.accepted_gaps[0].gap_id]});assert.equal(base.assessment.gaps.find(g=>g.id===cmd.accepted_gaps[0].gap_id).status,'unaddressed');assert.equal(normal.assessment.gaps.find(g=>g.id===cmd.accepted_gaps[0].gap_id).status,'accepted');await unchanged(f,before);emit({scenario:'gap-projection-only',unchanged:true});}finally{clean(f);}}

~~~

### replay-process.mjs

~~~javascript
import {spawn} from 'node:child_process';import {once} from 'node:events';
import {assert,fixture,makeDecision,CanonicalClosureService,emit,sleep,command,clean,capture,unchanged} from './util.mjs';
const url=new URL('../audit-r4-r10/packages/mcp/node_modules/.audit-rescate/fixture.mjs',import.meta.url).href;
const code=`import {SqliteKnowledgeAdapter,SqliteModuleClosureStore,CanonicalClosureService,makeDecision} from ${JSON.stringify(url)};
let release;process.on('message',async m=>{if(m.type==='go'){release();return;}if(m.type!=='start')return;const k=new SqliteKnowledgeAdapter(m.path),s=new SqliteModuleClosureStore({...m.options,key:Buffer.from(m.key,'base64')});let calls=0;const tx=s.transaction.bind(s);if(m.mode==='crash')s.transaction=async(scope,op)=>{const r=await tx(scope,op);process.send({type:'parked'});setInterval(()=>{},1000);await new Promise(()=>{});return r;};try{const result=await new CanonicalClosureService(k,m.ctx,s,{reviewClosure:async r=>{calls++;if(m.mode==='replay')throw Error('replay must not call gateway');if(m.mode==='race'){process.send({type:'ready'});await new Promise(r=>release=r);}return makeDecision(r);}}).execute('catalog',m.cmd);process.send({type:'result',status:result.status,code:result.code,idempotent:result.idempotent,decision_id:result.decision_id,calls});}catch(e){process.send({type:'error',message:e.message});}finally{s.close();k.close();process.disconnect();}});`;
const start=(f,cmd,mode)=>{const child=spawn(process.execPath,['--input-type=module','-e',code],{stdio:['ignore','pipe','pipe','ipc']});let readyResolve,doneResolve;const ready=new Promise(r=>readyResolve=r),result=new Promise((r,j)=>{doneResolve=r;child.on('error',j);child.on('exit',c=>{if(c)j(Error('exit '+c));});}),exit=once(child,'exit');child.on('message',m=>{if(['ready','parked'].includes(m.type))readyResolve(m);if(['result','error'].includes(m.type))doneResolve(m);});child.send({type:'start',mode,path:f.knowledgePath,ctx:f.context,cmd,key:f.closureKey.toString('base64'),options:{projectRoot:f.root,applicationId:'app-r5',environmentId:'local',path:f.closureStorePath,protection:'host_private_directory_and_managed_key'}});return {child,ready,result,exit};};
for(const mode of ['replay','race','crash']){const f=await fixture(),cmd=await command(f,'accept_gaps');const jobs=[];try{
 if(mode==='replay')assert.equal((await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>makeDecision(r)}).execute('catalog',cmd)).status,'gaps_accepted');
 const before=mode==='replay'?await capture(f):null;
 if(mode==='crash'){const j=start(f,cmd,mode);jobs.push(j);await j.ready;j.child.kill();await j.exit;assert.equal(f.closureStore.read(f.context).approvals.length,1);await sleep(11000);}else{jobs.push(start(f,cmd,mode),start(f,cmd,mode));if(mode==='race'){await Promise.all(jobs.map(j=>j.ready));jobs.forEach(j=>j.child.send({type:'go'}));}const results=await Promise.all(jobs.map(j=>j.result));await Promise.all(jobs.map(j=>j.exit));assert.ok(results.some(r=>r.status==='gaps_accepted'));if(mode==='replay'){assert.ok(results.every(r=>r.idempotent===true&&r.calls===0));await unchanged(f,before);}emit({scenario:'gap-two-processes',mode,results});}
 const snap=f.closureStore.read(f.context);assert.equal(snap.approvals.length,1);assert.equal(snap.acceptedGaps.catalog.length,1);assert.equal(Object.keys(snap.closures).length,0);const b=await capture(f);const retry=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async()=>{throw Error('unexpected gateway');}}).execute('catalog',cmd);assert.equal(retry.idempotent,true);await unchanged(f,b);assert.equal(b.history.length,1);emit({scenario:'gap-process-recovery',mode,oneApprovalAcceptedGapHistory:true,zeroClosureAndKnowledgeReceipts:b.relations.items.length===0,retryIdempotent:true});
 }finally{for(const j of jobs)if(j.child.exitCode===null)j.child.kill();clean(f);}}

~~~

### integrity.mjs

~~~javascript
import {assert,fixture,makeDecision,CanonicalClosureService,DatabaseSync,emit,sleep,command,clean,capture,unchanged} from './util.mjs';
// Once legitimately consumed, expiry does not revoke historical receipt authority.
{let deadline;const f=await fixture();try{const cmd=await command(f,'accept_gaps');const first=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>{deadline=Date.now()+500;return {...makeDecision(r),expiresAt:new Date(deadline).toISOString()};}}).execute('catalog',cmd);assert.equal(first.status,'gaps_accepted');await sleep(Math.max(0,deadline-Date.now()+40));const before=await capture(f);const retry=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async()=>{throw Error('no new review');}}).execute('catalog',cmd);assert.equal(retry.idempotent,true);await unchanged(f,before);emit({scenario:'legitimate-history-after-expiry',idempotent:true,unchanged:true});}finally{clean(f);}}
// Actual GCM ciphertext alteration is refused by a freshly opened adapter.
{const f=await fixture();try{const cmd=await command(f,'accept_gaps');await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>makeDecision(r)}).execute('catalog',cmd);const db=new DatabaseSync(f.closureStorePath),row=db.prepare('SELECT generation,payload FROM closure_history ORDER BY generation DESC LIMIT 1').get(),p=Buffer.from(row.payload);p[p.length-1]^=1;db.prepare('UPDATE closure_history SET payload=? WHERE generation=?').run(p,row.generation);db.close();const other=f.openClosureStore();try{assert.throws(()=>other.read(f.context),e=>e.code==='corrupt');const svc=new CanonicalClosureService(f.store,f.context,other,{reviewClosure:async()=>{throw Error('must not review corrupt authority');}});await assert.rejects(()=>svc.execute('catalog',cmd),e=>e.code==='corrupt');emit({scenario:'ciphertext-integrity',serviceThrows:'corrupt',corruptReadRefused:true,noFalseAuthority:true});}finally{other.close();}}finally{clean(f);}}

~~~

### runtime-identity.mjs

~~~javascript
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,renameSync,existsSync,mkdirSync,statSync,realpathSync} from 'node:fs';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {spawnSync,spawn} from 'node:child_process';
import {once} from 'node:events';
import {fixture,makeDecision,CanonicalClosureService,SqliteKnowledgeAdapter,FileSystemStorage} from '../audit-r4-r10/packages/mcp/node_modules/.audit-rescate/fixture.mjs';
const emit=x=>console.log(JSON.stringify(x));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const categories=['functional','business_rule','security','ui','ux','regression','performance'];
const opts={confirmedReqs:categories.map(category=>({category,title:category}))};
const clean=f=>{f.closureStore.close();f.store.close();};
const reason='Aceptación sintética aislada de la brecha existente por el revisor de prueba';
const command=async(f,action)=> action==='accept_gaps'?{action,accepted_gaps:[{gap_id:(await f.coverageService.evaluate('catalog')).assessment.gaps.find(g=>g.status==='unaddressed').id,reason}]}:action==='declare_non_applicable'?{action,decisions:[{category:'performance',reason}]}:action==='waive'?{action,reason}:{action};
const history=f=>{const d=new DatabaseSync(f.closureStorePath,{readOnly:true});try{return d.prepare('SELECT generation,hex(payload) AS payload FROM closure_history ORDER BY generation').all();}finally{d.close();}};
const unchanged=(f,b,h)=>{assert.deepEqual(f.closureStore.read(f.context),b);assert.deepEqual(history(f),h);const s=f.openClosureStore();assert.deepEqual(s.read(f.context),b);s.close();};
const writer=path=>{const r=spawnSync(process.execPath,['--input-type=module','-e',`import {DatabaseSync} from 'node:sqlite';const d=new DatabaseSync(process.argv[1]);d.exec('PRAGMA busy_timeout=0');try{d.exec('BEGIN IMMEDIATE;ROLLBACK');console.log('WRITABLE')}catch(e){console.log('BLOCKED:'+e.errcode)}finally{d.close()}`,path],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
const db=new DatabaseSync(':memory:');db.exec('CREATE VIRTUAL TABLE probe USING fts5(text);INSERT INTO probe VALUES (\'audit\')');assert.equal(db.prepare("SELECT count(*) AS n FROM probe WHERE probe MATCH 'audit'").get().n,1);emit({scenario:'runtime',node:process.version,platform:process.platform,sqlite:db.prepare('SELECT sqlite_version() AS v').get().v,FTS5:true});db.close();
// Relative path pins original file; second adapter and independent process excluded, then recover.
const cwd=process.cwd(),f=await fixture();let relative;
try{mkdirSync(join(f.root,'other'));process.chdir(f.root);relative=new SqliteKnowledgeAdapter('canonical.sqlite',{busy_timeout_ms:0});process.chdir(join(f.root,'other'));await relative.withWriteFence('app-r5',async()=>{assert.equal(writer(f.knowledgePath),'BLOCKED:5');const second=new DatabaseSync(f.knowledgePath);second.exec('PRAGMA busy_timeout=0');assert.throws(()=>second.exec('BEGIN IMMEDIATE'));second.close();});assert.equal(writer(f.knowledgePath),'WRITABLE');assert.equal(existsSync(join(f.root,'other','canonical.sqlite')),false);emit({scenario:'relative-cwd',samePhysicalFile:true,otherConnectionAndProcessBlocked:true,recovered:true,noStrayFile:true});}finally{relative?.close();process.chdir(cwd);clean(f);}
// Actual rename/replacement on this Windows host, both before acquisition and while held.
for(const phase of ['before','inside'])for(const replacement of [false,true]){const f=await fixture();const moved=f.knowledgePath+'.moved';let renamed=false,callback=false,code;try{const swap=()=>{renameSync(f.knowledgePath,moved);renamed=true;if(replacement){const d=new DatabaseSync(f.knowledgePath);d.exec('CREATE TABLE marker(n)');d.close();}};if(phase==='before'){try{swap();}catch(e){code=e.code;}if(renamed){try{await f.store.withWriteFence('app-r5',async()=>{callback=true;});}catch(e){code=e.code;}assert.equal(callback,false);assert.equal(existsSync(f.knowledgePath),replacement);}}else{await f.store.withWriteFence('app-r5',async()=>{callback=true;try{swap();}catch(e){code=e.code;}if(renamed&&replacement)assert.equal(writer(f.knowledgePath),'WRITABLE');});}emit({scenario:'file-identity',phase,replacement,renamed,callback,code,pathExists:existsSync(f.knowledgePath),identity:renamed?{original:statSync(moved).ino,replacement:replacement?statSync(f.knowledgePath).ino:null}:undefined});}finally{clean(f);}}

~~~

### prepare-old.mjs

~~~javascript
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const root='C:/Users/Judirico/Documents/QAMCP/audit-r4-r10';const req=createRequire(root+'/package.json'),tr=createRequire(req.resolve('tsup/package.json'));const {build}=await import(pathToFileURL(tr.resolve('esbuild')));
const old=execFileSync('git',['show','09c9ce276c9c328026de4236dadf0a85d8e94d21:packages/mcp/src/handlers/canonical-coverage-service.ts'],{cwd:root,encoding:'utf8'});
const closure=execFileSync('git',['show','09c9ce276c9c328026de4236dadf0a85d8e94d21:packages/mcp/src/handlers/canonical-closure-service.ts'],{cwd:root,encoding:'utf8'});
for(const [name,contents] of [['old-coverage',old],['old-closure',closure]])await build({stdin:{contents,resolveDir:root+'/packages/mcp/src/handlers',loader:'ts'},bundle:true,packages:'external',platform:'node',format:'esm',outfile:root+'/packages/mcp/node_modules/.audit-rescate/'+name+'.mjs',plugins:[{name:'exact-old-coverage',setup(b){b.onLoad({filter:/canonical-coverage-service\.ts$/},()=>({contents:old,loader:'ts',resolveDir:root+'/packages/mcp/src/handlers'}));}}]});




~~~

### extra.mjs

~~~javascript
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,statSync,realpathSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fixture,makeDecision,CanonicalClosureService,SqliteKnowledgeAdapter,FileSystemStorage} from '../audit-r4-r10/packages/mcp/node_modules/.audit-rescate/fixture.mjs';
import {CanonicalClosureService as OldClosure} from '../audit-r4-r10/packages/mcp/node_modules/.audit-rescate/old-closure.mjs';
const emit=x=>console.log(JSON.stringify(x));const close=f=>{f.closureStore.close();f.store.close();};
const categories=['functional','business_rule','security','ui','ux','regression','performance'];
const all={confirmedReqs:categories.map(category=>({category,title:category}))};
const reason='Razón sintética sustantiva y aislada para verificar el contrato';
const cmd=async(f,action)=>action==='accept_gaps'?{action,accepted_gaps:[{gap_id:(await f.coverageService.evaluate('catalog')).assessment.gaps.find(g=>g.status==='unaddressed').id,reason}]}:action==='declare_non_applicable'?{action,decisions:[{category:'performance',reason}]}:action==='waive'?{action,reason}:{action};
const hist=f=>{const d=new DatabaseSync(f.closureStorePath,{readOnly:true});try{return d.prepare('SELECT generation,hex(payload) AS payload FROM closure_history').all();}finally{d.close();}};
// Persisted R9 closures retain their existing authority and exact ciphertext/history under R10.
for(const terminal of ['closed','waived']){const f=await fixture(all);try{const old=new OldClosure(f.store,f.context,f.closureStore,{reviewClosure:async r=>makeDecision(r)});assert.equal((await old.execute('catalog',await cmd(f,terminal==='closed'?'close':'waive'))).status,terminal);const before=f.closureStore.read(f.context),h=hist(f),relations=await f.store.query('app-r5','relation'),life=readFileSync(f.lifecyclePath,'utf8');assert.equal((await f.closureService.status('catalog')).state,terminal);assert.equal((await f.closureService.execute('catalog',{action:'close'})).idempotent,true);assert.deepEqual(f.closureStore.read(f.context),before);assert.deepEqual(hist(f),h);assert.deepEqual(await f.store.query('app-r5','relation'),relations);assert.equal(readFileSync(f.lifecyclePath,'utf8'),life);const reopened=f.openClosureStore();assert.deepEqual(reopened.read(f.context),before);reopened.close();emit({scenario:'historical-r9',terminal,authorityPreserved:true,noNewApprovalReceiptHistoryOrTransition:true,readback:true});}finally{close(f);}}
// A pending exact R9 applicability request retains its digest and can be independently authorized in R10.
{const f=await fixture();try{let request;await new OldClosure(f.store,f.context,f.closureStore,{reviewClosure:async r=>{request=r;return null;}}).execute('catalog',await cmd(f,'declare_non_applicable'));const result=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>{assert.equal(r.requestDigest,request.requestDigest);return makeDecision(request);}}).execute('catalog',await cmd(f,'declare_non_applicable'));assert.equal(result.status,'declared_non_applicable');emit({scenario:'r9-pending-applicability',digestUnchanged:true,status:result.status});}finally{close(f);}}
// Failure after operation has edited snapshot physically rolls back history/receipts/lifecycle, fences recover.
for(const action of ['declare_non_applicable','accept_gaps','close','waive']){const f=await fixture(action==='accept_gaps'?{}:all),command=await cmd(f,action),other=new SqliteKnowledgeAdapter(f.knowledgePath,{busy_timeout_ms:0}),before=f.closureStore.read(f.context),h=hist(f),life=readFileSync(f.lifecyclePath,'utf8'),original=f.closureStore.transaction.bind(f.closureStore);f.closureStore.transaction=(scope,op)=>original(scope,async snap=>{await op(snap);throw Error('external fault before physical commit');});try{const result=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>makeDecision(r)}).execute('catalog',command);assert.equal(result.status,'blocked');assert.deepEqual(f.closureStore.read(f.context),before);assert.deepEqual(hist(f),h);assert.equal(readFileSync(f.lifecyclePath,'utf8'),life);assert.equal((await f.store.query('app-r5','relation')).items.length,0);await other.withWriteFence('app-r5',async()=>{});await new FileSystemStorage({rootDir:f.root}).withLifecycleFence(async()=>{});emit({scenario:'rollback',action,code:result.code,allAuthorizationStateUnchanged:true,bothFencesReleased:true});}finally{other.close();close(f);}}
// A separate physical process uses only the official update API, canonical spelling vs Windows case alias.
for(const alias of [false,true]){const f=await fixture(),url=new URL('../audit-r4-r10/packages/mcp/node_modules/.audit-rescate/fixture.mjs',import.meta.url).href;let child,done=false,err='',started;try{await new FileSystemStorage({rootDir:f.root}).withLifecycleFence(async()=>{const root=alias?f.root.toUpperCase():f.root;assert.equal(statSync(root).ino,statSync(f.root).ino);assert.equal(statSync(root).dev,statSync(f.root).dev);child=spawn(process.execPath,['--input-type=module','-e',`import {FileSystemStorage} from ${JSON.stringify(url)};console.log('STARTED');await new FileSystemStorage({rootDir:process.argv[1]}).updateLifecycleState(s=>{s.session.id='official-process';return s;});console.log('DONE');`,root],{stdio:['ignore','pipe','pipe']});started=new Promise((resolve,reject)=>{child.stdout.on('data',b=>{if(b.toString().includes('STARTED'))resolve();if(b.toString().includes('DONE'))done=true;});child.on('error',reject);});child.stderr.on('data',b=>{err+=b;});await started;await new Promise(r=>setTimeout(r,300));emit({scenario:'official-process-lifecycle',alias,writerCompletedDuringFence:done,sessionDuringFence:JSON.parse(readFileSync(f.lifecyclePath)).session.id,samePhysicalRoot:true});assert.equal(done,false);});if(!done)await once(child,'exit');assert.equal(JSON.parse(readFileSync(f.lifecyclePath)).session.id,'official-process');emit({scenario:'official-process-recovery',alias,writerRecovered:true});}finally{if(child?.exitCode===null)child.kill();close(f);}}
// FIFO is not a bounded reentrant lock: do not hold it while awaiting itself. Observe boundedly, release outer.
{const f=await fixture();let entered=false,nested;try{await f.store.withWriteFence('app-r5',async()=>{nested=f.store.withWriteFence('app-r5',async()=>{entered=true;});await new Promise(r=>setTimeout(r,50));assert.equal(entered,false);});await nested;assert.equal(entered,true);emit({scenario:'fifo-queued-consumer',progressAfterRelease:true});}finally{close(f);}}



~~~

## Corridas MCP con paralelismo predeterminado: resultados adicionales, sin ocultarlos

El diferencial homologable anterior usa un worker como R4-R12. El comando literal pnpm --filter @qap/mcp test NO tiene ese límite: también se ejecutó y falló de estas maneras. No se suman estos resultados a los del inventario JSON ni se presentan como 423/63.

| Corrida | PASS | FAIL | Total tests ejecutados | Otros errores |
| --- | ---: | ---: | ---: | --- |
| Original, predeterminado | 360 | 67 | 427 | Suite Discovery no cargó (59 no corrieron),3 errores no manejados |
| Repetición sin carga de otra suite externa | 413 | 73 | 486 | 1 error no manejado, EPERM de rename |
| Sonda con observador externo de errores | 418 | 68 | 486 | 3 errores no manejados; observador no capturó el cuerpo previo al JSON.parse en la VM de Vitest |
| Detallada, un worker | 423 | 63 | 486 | Sin errores no manejados registrados |
| Monorepo secuencial, un worker | 423 | 63 | 486 | Sin errores no manejados registrados |

La primera importación Discovery falló con UNKNOWN al abrir un archivo SSR de Vite bajo TEMP. Los timeouts de TestHandler (5000ms) y durable-interview (30000ms) desencadenan cleanup y, después, locks ENOENT/ECOMPROMISED de operaciones aún activas. En la repetición aparecen EPERM de rename lifecycle en las regresiones R10/R11 y fallos adicionales de session_close/proyección cuya respuesta en texto produce SyntaxError al ser tratada como JSON por la prueba. **La causa interna de esos errores de sesión bajo carga no quedó aislada; no se atribuyen automáticamente a ambiente inocuo ni a una regresión productiva del rescate.** Todos los casos pasan en las dos corridas con un worker y en la focal cuando corresponde.

Esto es fragilidad pendiente RES-CODEX-E01 P2 de ejecución/integración en Windows bajo paralelismo. El baseline independiente R12 no contiene una corrida predeterminada equivalente de este entorno, así que los cambios nominales siguientes se clasifican por configuración y no se ocultan en las63 identidades estables. Los dos tests nuevos de reporte pasan focal/un worker, pero fallan en una de las corridas paralelas. No están certificados de forma incondicional.

Corrección solicitada: aislar TEMP/recursos/worker budgets, investigar rename temporal y lock cleanup tras timeout, recuperar el error real de session_close antes de parsear como JSON y comprobar finalización de procesos/operaciones antes de borrar fixtures. Conservar expectativas y pruebas de concurrencia: no aumentar timeouts/suprimir suites como única solución.

### Identidades adicionales por corrida (respecto del PASS con un worker)


El inventario exacto adicional y sus stacks figuran en DIFERENCIAL_MCP.md. La sonda observadora de lectura no alteraba el retorno/throw de JSON.parse, pero no alcanzó la instancia interna de la VM; no se le atribuye diagnóstico que no capturó.

~~~javascript
const original=JSON.parse;JSON.parse=function(value,...rest){if(typeof value==='string'&&value.startsWith('Error ejecutando qap_session_close:'))process.stderr.write('[AUDIT_READONLY_ERROR_RESPONSE] '+value+'\n');return Reflect.apply(original,this,[value,...rest]);};

~~~

~~~javascript
import {readFileSync,writeFileSync} from 'node:fs';const dir='../rescate-evidence/',j=JSON.parse(readFileSync(dir+'mcp.json')),all=j.testResults.flatMap(f=>f.assertionResults.map(t=>({...t,file:f.name.split(/[\\/]/).at(-1)}))),norm=s=>s.replace(/[\s>]/g,'');let result=[];
for(const [label,file] of [['original','mcp-required.log'],['repeat','mcp-required-repeat.log'],['observed','mcp-observed.log']]){const txt=readFileSync(dir+file,'utf8').replace(/\x1b\[[0-9;]*m/g,'');const blocks=txt.split(/\n FAIL  /).slice(1);const arr=[];for(const block of blocks){const header=block.split(/\n(?:Error:|AssertionError:|TypeError:|SyntaxError:| ❯)/)[0].trim();const match=header.match(/^src\/__tests__\/([^\s]+)\s*>\s*([\s\S]*)$/);if(!match)continue;const test=all.find(t=>t.file===match[1]&&norm(t.fullName)===norm(match[2]));arr.push({file:match[1],fullName:test?.fullName??match[2].replace(/\s+/g,' '),mapped:!!test,statusSingleWorker:test?.status,error:block.split('\n').filter(l=>/^(Error|AssertionError|TypeError|SyntaxError):/.test(l)).join(' ').slice(0,700),stack:block.split('\n').slice(-12).join('\n')});}const extra=arr.filter(t=>t.statusSingleWorker!=='failed');result.push({label,totalFailuresParsed:arr.length,extraFailures:extra,unmapped:arr.filter(t=>!t.mapped)});}
writeFileSync(dir+'parallel-diff.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));

~~~
