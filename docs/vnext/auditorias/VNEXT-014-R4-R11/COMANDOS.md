# Comandos, procedencia e integridad R4-R11

2026-11-05. Código 4bb22547349a407b1eeb2383e6981af5dd1db07a; rama remota feature verificada en ese SHA antes de publicación. Worktree existente limpio C:/Users/Judirico/Documents/QAMCP/audit-r4-r10, detached. Checkout principal separado y su modificación previa de sesión protegida intactos. No se creó otro worktree después de cancelarse la petición gestionada. Ningún código posterior incorporado. Windows x64, Node24.15.0, pnpm12.3.4, SQLite3.51.3, FTS5 CREATE/INSERT/MATCH real.

```powershell
git fetch origin feat/qap-vnext-architecture
git status --short
git switch --detach 4bb22547349a407b1eeb2383e6981af5dd1db07a
git rev-parse HEAD
git diff --stat e7d3717d9311ed73736568b13ce99e131d617453 HEAD
node -v
pnpm -v
pnpm install --frozen-lockfile
pnpm build
git hash-object pnpm-lock.yaml
git hash-object packages/playwright-runner/.qa/cache/sessions/admin-user.json
git diff --exit-code HEAD -- packages pnpm-lock.yaml
```

Lecturas: AGENTS, STATE, backlog, nota014G y seis informes R10 (incluyen arneses históricos). Diff R10→R11: file-storage+11/-1, closure-service+32/-1, test coverage+56/-0; sin modificaciones de Scenario4, mocks, lint config, expectativas históricas o lockfile. Diez paquetes imprimen build:Done y servidor/CLI existen.

## Matriz ejecutada

```powershell
$ErrorActionPreference='Continue'
$env:TEMP = Join-Path (Get-Location) 'node_modules/.tmp-vnext'
$env:TMP=$env:TEMP
New-Item -ItemType Directory -Force $env:TEMP | Out-Null
function Run-Audit($label,$argsList) {
 & pnpm @argsList *> "../r4-r11-evidence/$label.log"
 "$label=$LASTEXITCODE" | Add-Content ../r4-r11-evidence/exits.txt
}
Run-Audit r11 @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/canonical-coverage.test.ts','-t','R4-R11','--maxWorkers=1','--reporter=verbose')
Run-Audit r10 @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/canonical-coverage.test.ts','-t','R4-R10','--maxWorkers=1','--reporter=verbose')
Run-Audit focus @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/canonical-coverage.test.ts','-t','R4-R9-A02','--maxWorkers=1','--reporter=verbose')
Run-Audit r8 @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/canonical-coverage.test.ts','-t','R4-R8-A01','--maxWorkers=1','--reporter=verbose')
Run-Audit coverage @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/canonical-coverage.test.ts','--maxWorkers=1','--reporter=verbose')
Run-Audit interview @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/canonical-interview.test.ts','--maxWorkers=1','--reporter=verbose')
Run-Audit discovery @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/discovery-handler.test.ts','--maxWorkers=1','--reporter=verbose')
Run-Audit mcp @('--filter','@qap/mcp','exec','vitest','run','--maxWorkers=1','--reporter=verbose','--reporter=json','--outputFile.json=../../../r4-r11-evidence/mcp.json')
Run-Audit runner @('--filter','@qap/playwright-runner','exec','vitest','run','--maxWorkers=1','--reporter=verbose')
Run-Audit lint-focus @('exec','eslint','packages/engine/src/knowledge-store.port.ts','packages/knowledge/src/storage/file-storage.ts','packages/knowledge/src/storage/sqlite-knowledge-adapter.ts','packages/mcp/src/handlers/canonical-closure-service.ts','packages/mcp/src/handlers/canonical-coverage-service.ts','packages/mcp/src/__tests__/canonical-coverage.test.ts','--format=json','--output-file=../r4-r11-evidence/lint-focus.json')
Run-Audit lint @('exec','eslint','.','--format=json','--output-file=../r4-r11-evidence/lint.json')
Get-Content ../r4-r11-evidence/exits.txt
```

Salidas finales:

```text
r11=0
r10=0
focus=0
r8=0
coverage=0
interview=0
discovery=0
mcp=1
runner=0
lint-focus=1
lint=1
```

MCP/ESLint salen1 por históricos detallados en informes; Coverage sale0. Sondas finales baseline/locks/terminal/crash/probe/context/extra/process/process-mixed y Stdio salen0.

```powershell
$env:TEMP=Join-Path (Get-Location) 'node_modules/.tmp-vnext'
$env:TMP=$env:TEMP
node ../r4-r11-evidence/prepare.mjs
node ../r4-r11-evidence/prepare-old.mjs
node ../r4-r11-evidence/prepare-baseline.mjs
node ../r4-r11-evidence/baseline.mjs
node ../r4-r11-evidence/locks.mjs
node ../r4-r11-evidence/terminal.mjs
node ../r4-r11-evidence/crash.mjs
node ../r4-r11-evidence/probe.mjs
node ../r4-r11-evidence/context.mjs
node ../r4-r11-evidence/extra.mjs
node ../r4-r11-evidence/process.mjs
node ../r4-r11-evidence/process-mixed.mjs
node packages/mcp/node_modules/.audit-r11/stdio.mjs C:/Users/Judirico/Documents/QAMCP/audit-r4-r10 C:/Users/Judirico/Documents/QAMCP/r4-r11-evidence/stdio-fixture
node ../r4-r11-evidence/analyze.mjs
```

Arneses completos y salidas en [EVIDENCIA](EVIDENCIA_CONCURRENCIA.md). Stdio reproducible se extrae por prepare del primer bloque javascript de COMANDOS R7, que sigue versionado en este SHA; usa targetPath absoluto, fixtures externas y comprueba18+init+ONBOARDING para servidor y CLI.

## Extractos finales

### install

```text
Scope: all 11 workspace projects
✓ Lockfile passes supply-chain policies (verified 18h ago)
Lockfile is up to date, resolution step is skipped
Done in 72ms using pnpm v12.3.4
```

### build

```text
packages/cli build: ESM dist\chunk-XENM7LAA.js 24.62 KB
packages/cli build: ESM dist\dist-N6S6AFVU.js  1.30 KB
packages/cli build: ESM dist\chunk-XKJTHJYL.js 285.32 KB
packages/cli build: ESM dist\entrypoint.js     565.56 KB
packages/cli build: ESM dist\chunk-ULFAP6LY.js 120.98 KB
packages/cli build: ESM dist\chunk-5JLHNXWW.js 391.62 KB
packages/cli build: ESM dist\chunk-AOBXKQNP.js 1.97 KB
packages/cli build: ESM ⚡️ Build success in 257ms
packages/cli build: Done
```

### r11

```text
↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 2: Crash after closureStore commits decision but before IKnowledgeStore or lifecycle.json updates recovers via self-healing reconciler
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 3: Crash after IKnowledgeStore receipt commit returns idempotent response on retry
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 4: Two concurrent closures cleanly serialize and prevent double consumption of decision

 Test Files  1 passed (1)
      Tests  1 passed | 50 skipped (51)
   Start at  11:43:25
   Duration  4.22s (transform 962ms, setup 0ms, import 2.48s, tests 1.19s, environment 0ms)
```

### r10

```text
↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 2: Crash after closureStore commits decision but before IKnowledgeStore or lifecycle.json updates recovers via self-healing reconciler
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 3: Crash after IKnowledgeStore receipt commit returns idempotent response on retry
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 4: Two concurrent closures cleanly serialize and prevent double consumption of decision

 Test Files  1 passed (1)
      Tests  5 passed | 46 skipped (51)
   Start at  11:43:31
   Duration  3.45s (transform 900ms, setup 0ms, import 2.37s, tests 626ms, environment 0ms)
```

### focus

```text
↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 2: Crash after closureStore commits decision but before IKnowledgeStore or lifecycle.json updates recovers via self-healing reconciler
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 3: Crash after IKnowledgeStore receipt commit returns idempotent response on retry
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 4: Two concurrent closures cleanly serialize and prevent double consumption of decision

 Test Files  1 passed (1)
      Tests  5 passed | 46 skipped (51)
   Start at  11:43:35
   Duration  7.04s (transform 894ms, setup 0ms, import 2.17s, tests 4.47s, environment 0ms)
```

### r8

```text
↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 2: Crash after closureStore commits decision but before IKnowledgeStore or lifecycle.json updates recovers via self-healing reconciler
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 3: Crash after IKnowledgeStore receipt commit returns idempotent response on retry
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 4: Two concurrent closures cleanly serialize and prevent double consumption of decision

 Test Files  1 passed (1)
      Tests  3 passed | 48 skipped (51)
   Start at  11:43:43
   Duration  2.83s (transform 826ms, setup 0ms, import 2.22s, tests 303ms, environment 0ms)
```

### coverage

```text
✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 2: Crash after closureStore commits decision but before IKnowledgeStore or lifecycle.json updates recovers via self-healing reconciler 79ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 3: Crash after IKnowledgeStore receipt commit returns idempotent response on retry 138ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 4: Two concurrent closures cleanly serialize and prevent double consumption of decision 165ms

 Test Files  1 passed (1)
      Tests  51 passed (51)
   Start at  11:43:47
   Duration  13.65s (transform 774ms, setup 0ms, import 2.04s, tests 11.30s, environment 0ms)
```

### interview

```text
✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > HTML required, HTTP 200, AgentInference and reviewed traces confer no requirement authority 254ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > physical approval receipt prevents reuse for another question after restarting the host 121ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > short free answers remain non-authoritative drafts and need a substantive corrected statement 81ms

 Test Files  1 passed (1)
      Tests  44 passed (44)
   Start at  11:44:02
   Duration  8.71s (transform 1.12s, setup 0ms, import 3.09s, tests 4.88s, environment 0ms)
```

### discovery

```text
✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > two physical connections race with CAS; retry is idempotent and context changes block recovery 1140ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > isolates same planned names across physical projects and rejects another project receipt 90ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > detects context changed at the edge commit boundary without deleting already acquired facts 1224ms

 Test Files  1 passed (1)
      Tests  59 passed (59)
   Start at  11:44:11
   Duration  30.15s (transform 898ms, setup 0ms, import 2.58s, tests 27.21s, environment 0ms)
```

### mcp

```text
Start at  11:44:43
   Duration  166.91s (transform 2.00s, setup 0ms, import 31.20s, tests 127.18s, environment 3ms)

JSON report written to C:/Users/Judirico/Documents/QAMCP/r4-r11-evidence/mcp.json
Error: ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL

  × "pnpm recursive exec" failed in C:\Users\Judirico\Documents\QAMCP\audit-
  │ r4-r10\packages\mcp
```

### runner

```text
✓ src/__tests__/interpolator.test.ts > Interpolador de variables de contexto (S7-006) > interpolateStep reemplaza selector, value y url de un step 1ms
 ✓ src/__tests__/interpolator.test.ts > Interpolador de variables de contexto (S7-006) > interpolateStep NO toca el campo expression (evaluate usa ctx directamente) 1ms
 ✓ src/__tests__/interpolator.test.ts > Interpolador de variables de contexto (S7-006) > interpolateStep no modifica el step original (devuelve una copia) 1ms

 Test Files  10 passed (10)
      Tests  71 passed (71)
   Start at  11:47:31
   Duration  20.87s (transform 834ms, setup 0ms, import 8.92s, tests 7.33s, environment 1ms)
```

### stdio

```text
[QAP MCP Server] Servidor iniciado correctamente en transporte Stdio.
{"transport":"server","tools":["qap_auth_add","qap_auth_list","qap_clean","qap_context_ingest","qap_context_set","qap_discover","qap_init","qap_module_close","qap_plan","qap_prune","qap_report","qap_rules_set","qap_server","qap_session_close","qap_session_plan","qap_status","qap_test","qap_validate"],"init":"success","phase":"ONBOARDING","targetPathExplicit":true}
[QAP MCP Server] Servidor iniciado correctamente en transporte Stdio.
{"transport":"cli","tools":["qap_auth_add","qap_auth_list","qap_clean","qap_context_ingest","qap_context_set","qap_discover","qap_init","qap_module_close","qap_plan","qap_prune","qap_report","qap_rules_set","qap_server","qap_session_close","qap_session_plan","qap_status","qap_test","qap_validate"],"init":"success","phase":"ONBOARDING","targetPathExplicit":true}
SERVIDOR MCP FUNCIONANDO AL 100% SOBRE STDIO
```


## Comparación exacta e integridad

```javascript
import {readFileSync,writeFileSync} from 'node:fs';
const base='C:/Users/Judirico/Documents/QAMCP/';
const old=JSON.parse(readFileSync(base+'r4-r10-evidence/mcp.json')),cur=JSON.parse(readFileSync(base+'r4-r11-evidence/mcp.json'));
const flat=j=>j.testResults.flatMap(f=>f.assertionResults.map(a=>({file:f.name.split(/[\\/]/).at(-1),name:a.fullName,status:a.status,message:a.failureMessages?.[0]?.split('\n').slice(0,3).join(' ')||''})));
const a=flat(old),b=flat(cur),key=t=>t.file+'|'+t.name,ma=new Map(a.map(t=>[key(t),t]));
const counts={};for(const t of b){const label=(ma.get(key(t))?.status||'new')+'→'+t.status;counts[label]=(counts[label]||0)+1;}
const removed=a.filter(t=>!b.some(x=>key(x)===key(t)));
const changed=b.filter(t=>ma.has(key(t))&&ma.get(key(t)).status!==t.status);
const rows=arr=>arr.map(t=>'| '+[t.file,t.name,t.status,t.message].map(x=>x.replaceAll('|','&#124;')).join(' | ')+' |').join('\n');
writeFileSync(base+'r4-r11-evidence/comparison.json',JSON.stringify({counts,removed,changed,old:{passed:old.numPassedTests,failed:old.numFailedTests,total:old.numTotalTests},current:{passed:cur.numPassedTests,failed:cur.numFailedTests,total:cur.numTotalTests}},null,2));
writeFileSync(base+'r4-r11-evidence/mcp-tables.md','## Fallos conservados por identidad exacta\n\n| Archivo | Identidad completa | Estado | Primer diagnóstico |\n| --- | --- | --- | --- |\n'+rows(b.filter(t=>t.status==='failed'))+'\n\n## Altas\n\n| Archivo | Identidad completa | Estado | Diagnóstico |\n| --- | --- | --- | --- |\n'+rows(b.filter(t=>!ma.has(key(t))))+'\n\n## Archivos\n\n'+cur.testResults.map(f=>{const t=f.assertionResults;return '- '+f.name.split(/[\\/]/).at(-1)+': '+t.filter(x=>x.status==='passed').length+' PASS / '+t.filter(x=>x.status==='failed').length+' FAIL';}).join('\n'));
const lf=j=>j.flatMap(f=>f.messages.map(m=>({file:f.filePath.replaceAll('\\','/').split('/packages/')[1]?'packages/'+f.filePath.replaceAll('\\','/').split('/packages/')[1]:f.filePath,line:m.line,column:m.column,severity:m.severity,rule:m.ruleId,message:m.message})));
const lo=lf(JSON.parse(readFileSync(base+'r4-r10-evidence/lint.json'))),lc=lf(JSON.parse(readFileSync(base+'r4-r11-evidence/lint.json'))),lk=x=>JSON.stringify(x),ls=new Set(lo.map(lk)),cs=new Set(lc.map(lk)),focus=lf(JSON.parse(readFileSync(base+'r4-r11-evidence/lint-focus.json')));
const lint={errors:lc.filter(x=>x.severity===2).length,warnings:lc.filter(x=>x.severity===1).length,focusErrors:focus.filter(x=>x.severity===2).length,focusWarnings:focus.filter(x=>x.severity===1).length,identical:lc.filter(x=>ls.has(lk(x))).length,added:lc.filter(x=>!ls.has(lk(x))),removed:lo.filter(x=>!cs.has(lk(x)))};
writeFileSync(base+'r4-r11-evidence/lint-comparison.json',JSON.stringify(lint,null,2));
writeFileSync(base+'r4-r11-evidence/lint-table.md','| Archivo | Línea:columna | Nivel | Regla | Mensaje |\n| --- | --- | --- | --- | --- |\n'+lc.map(x=>'| '+[x.file,x.line+':'+x.column,x.severity===2?'error':'warning',x.rule||'unused-disable',x.message].map(x=>String(x).replaceAll('|','&#124;')).join(' | ')+' |').join('\n'));
console.log(JSON.stringify({counts,removed:removed.length,changed:changed.length,lint}));
```

El script compara R10 y R11 por archivo+fullName; lint por archivo/línea/columna/severidad/regla/mensaje. El informe diferencial añade contraste55/55 con baseline R8. JSON R10 SHA256 **5376565e9f9f8947a217ce0761bff0813932330a098e5c0401792b8a7937b0da**; lint R10 **221d8d6a09aa6fc083e603d0a9acf978c9b46aefea2487debfeeb623595f08da**. Se conservaron brutos de referencia, no se reemplazaron ni reejecutaron como R11.

| Evidencia R11 | SHA256 |
| --- | --- |
| install.log | 3ee53e13f7291b68060ec841b41b7b33a4d2295af92f94caef4d3ff1da6ec4db |
| build.log | a7bfb5745f1d21361372dfdaa33c10c7bdc123c2b00db15dc2fba22ffdd4f16f |
| r11.log | b142115be544335c7f895a5b94105140430e518aa73c471c754c6e29c567c22c |
| r10.log | 93f47f815190780126910b31d58b5bb758e22ca866dc73489b0a3a0b5b408bd2 |
| focus.log | aba7cc32d68325db134f7cbb30b58b573123eb4a6468ce69604a20856ad46aeb |
| r8.log | 1d3cbdf4bf88647e723b02e4bea3355b22f88722b8cf1fededeb36b95ffc36f1 |
| coverage.log | e79132ebbd202fe74bf2c964a1bc35ed6061ed9e0fb96f8b185bc1e25b6a8606 |
| interview.log | 8877ceae566ceea552c2ce32fa5cfd46d7d4f674d08042d32a681a8ae0d427f4 |
| discovery.log | 7ba70f974c53c52fb42f95a4500eb3d03ba7b3fd9cf0b8ea071754967d5c4b4c |
| mcp.json | 8a4108863dba018801cd247c182e1184a1d6e5603ec6c07fa294d0aea919aa2c |
| mcp.log | b62088f6d78628103d554837b5ed26f5b705452142fa4cf50676df518887d889 |
| runner.log | 3194f48cb5ce626c68306677597f1b13995b634333abe63d2c35c448eabf6daa |
| lint.json | 221d8d6a09aa6fc083e603d0a9acf978c9b46aefea2487debfeeb623595f08da |
| lint-focus.json | 354c75570969e149585f50110e1d3e5c3b597ae4ca9272cdf3c40dad338e890a |
| stdio.log | 6b22a7bf3068eaea99eb947948e3cb36b74ff3a3103d78af1218450f6bd85568 |
| baseline.log | 0dcf08a3df9d024a54e719a71b2fa30367c416ddb7cac31059c227e5985950c5 |
| locks.log | cf10eacfa091c6641bafa5c448bdca6572bb123969d03d36710fead370227508 |
| terminal.log | ca7b543905ab41c1e1a204710592d682dcf869ab05d089104eda613829e14a5d |
| crash.log | 8bb71713ea3a1b8fae7ef60260e3fe450debb0b31f8fc59e179dd9f7a53eac9a |
| probe.log | 85098425f7fe88330555f74bc374ce1d72e669c3251b01d3dcb8d754153843e4 |
| context.log | 130db24e77c980e1a14fa68fac546efaae528cfb4276c3b7c7a4ff51073e58de |
| extra.log | 14686591aaf46d13fb9103627d1db23ed369b4bc44b3dc336c61ad82dc3ee5a4 |
| process.log | 7f8517b22b29a042c687840a05476d565ef9673fe722926c397804a1e4392b11 |
| process-mixed.log | eab1aa3a0455ed45b52648675e89c43a27b4fd9989a2e3218fb9ef26be1db7a9 |
| prepare.mjs | 594030878921aaddd949bfee50c606db9d877c96089671adfb601b7f1ff904e5 |
| prepare-old.mjs | 023d3988fb4bf5dd0de8dfacaaa18593f01a79235164a8aba11412c412eb0bd7 |
| prepare-baseline.mjs | 275532ea27014fed25cabc8d1e064e527e8bc6fe12fa092274e45f93ae90deaf |
| baseline.mjs | 81a3d033a0f762e4b579cebd2bd5989d668b764517355f50aed88942390aa61a |
| locks.mjs | c6467374b57a59b978486cf1d4436a67ef1e478ed523aff9e4a9bccefee872d1 |
| terminal.mjs | 0833ef97d2c0fa88ac72968e22f4918dd81cf9878307b6882c8356e7b70326ab |
| crash.mjs | 9d91dadb7782043b97a55121324cd9a85b051b13047708011dcff125781d9241 |
| probe.mjs | 5c593fd8dea46015f9fcc38593438b1da4cb82109e73ec0752f3bb667f3dcdfb |
| context.mjs | a85e62d770151415fb9be995c6a45088846300c85499481885fcd8a8b07375db |
| extra.mjs | 56c6919d26eeff411d82b3bd49764a254ca4c8e6e2ffe502719f18d11d73a2a8 |
| process.mjs | decbb3d512996772b7ab729bcfd94ec10b28d2d6e328ab04d528cfb5c4618c1b |
| process-mixed.mjs | 9f78a4ab30d74105660afc618f4001e647032472c570d0bfe433382d18b91303 |
| run.ps1 | 2f7e5c872721225726f0df96711161378deacdc68b977829b83e45ff6658989a |
| analyze.mjs | e7bc1438c592f6fd17fe7a3886ac5aa55301687ac8d5e2c8796e7faf2b076a41 |

## Incidencias del arnés y entorno

- Primer fetch/ls-remote dentro del sandbox falló por getaddrinfo; repetición autorizada fuera del sandbox PASS. Primera instalación quedó esperando validación de políticas de supply-chain, se interrumpió; repetición congelada autorizada PASS. No se atribuyen esos intentos a un defecto del producto.
- terminal intento1 creó una relation de fixture con referencia de módulo inexistente: Knowledge rechazó REFERENCE_NOT_FOUND antes de la comprobación de recibo buscada. Se agregó un módulo sintético válido únicamente en el arnés para alcanzar la comprobación de procedencia; producto sin cambios.
- terminal intento2 envió reason extra en close durante el caso de respuesta perdida: validador bloqueó correctamente, falló la aserción del arnés. Se corrigió solo el comando externo y la ejecución final pasó. No se cambió una expectativa del producto.
- baseline intento1 ubicó el bundle FileSystemStorage en node_modules de MCP, que no resuelve proper-lockfile privado de Knowledge. Se generó el bundle histórico auxiliar bajo node_modules de Knowledge y se importó desde allí; ejecución final PASS. Fuentes/dependencias originales intactas.

## Publicación documental

Solo se preparan los seis Markdown R11, STATE, backlog y nota014G. El commit documental es hijo de 4bb22547349a407b1eeb2383e6981af5dd1db07a. Los hashes antes de publicación remota fueron feature=4bb22547349a407b1eeb2383e6981af5dd1db07a, main=fa6a527764f6e96514a1e589411e7f402e059b68, develop=0e5825cfd256065e532f45a171f9a0dc74116615. Esta entrega no escribe main/develop, no hace merge ni force-push.

```powershell
git diff --exit-code 4bb22547349a407b1eeb2383e6981af5dd1db07a -- packages pnpm-lock.yaml
git add -- docs/vnext/auditorias/VNEXT-014-R4-R11 docs/vnext/STATE.md docs/vnext/04_BACKLOG_Y_WBS_PRELIMINAR.md docs/vnext/014G_R4_R11_CANONICAL_LOCKS.md
git diff --cached --stat
git diff --cached --name-only
git commit -m "docs(vnext): publish independent R4-R11 concurrency audit"
git push origin HEAD:refs/heads/feat/qap-vnext-architecture
git ls-remote origin refs/heads/feat/qap-vnext-architecture refs/heads/main refs/heads/develop
```

El SHA documental se verifica tras push y se entrega al usuario; no se auto-inserta un hash de commit dentro del mismo commit. [Dictamen NO-GO](INFORME.md).
