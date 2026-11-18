<!-- INT-01E: reconciliación documental explícita; laboratorio, 2026-11-09.
Versión principal: vNext a3f7ab5a21368142884a5a6dc6f5bc072015e6af.
Anexo: publicación develop b50453f27470b49a88623c6617cb4d16e49180a8, conservada íntegra como historia de ese padre.
Las afirmaciones fechadas (incluido «no iniciado») no describen un nuevo estado.
No se certifica QA, no se reabren DONE ni se sustituyen fechas oficiales.
La decisión posterior MVP funcional 16/11 y QA 17–20/11 se registra en el informe
INT-01E como enmienda pendiente de formalización, sin reescribir estas actas.
-->

# Comandos, procedencia e integridad R4-R10

Código auditado e7d3717d9311ed73736568b13ce99e131d617453; GitHub fetch_commit confirmó SHA y nota. Node24.15.0 Windows x64, pnpm12.3.4, SQLite3.51.3 FTS5 real. Fecha2026-11-05 America/Mexico_City.

**Publicación documental en feat/qap-vnext-architecture, según la instrucción vigente del usuario.** Base exacta de esta publicación y código auditado: e7d3717d9311ed73736568b13ce99e131d617453. Se publican los seis informes y se actualizan STATE, backlog y nota R4-R10 conservando su historial. Esta publicación no modifica main ni develop, no incorpora código posterior y no repite ni atribuye las pruebas a otro SHA. Existe una publicación documental anterior en 0e5825cfd256065e532f45a171f9a0dc74116615; se registra como procedencia, sin trasladar su código ni realizar merge.

## Aislamiento y documentos de la ejecución original

Checkout original C:/Users/Judirico/Documents/QAMCP/QAMCP, HEADed2955ff91a6506a80e3ff0e4bb9322cf9eed226 y una sesión protegida modificada previamente, intocados. Auditoría C:/Users/Judirico/Documents/QAMCP/audit-r4-r10 detached en e7d3717d9311ed73736568b13ce99e131d617453. Documentación C:/Users/Judirico/Documents/QAMCP/audit-r4-r10-docs detached desde origin/develop=1a909d346ab75537e6dc59e44deb422c3016ffb4. Evidencia externa C:/Users/Judirico/Documents/QAMCP/r4-r10-evidence. No se construyó ni probó develop.

Se leyeron directamente del checkout exacto AGENTS.md, STATE, backlog,014F y los seis informes R9 (también disponibles en worktree documental previo05c0253). Habilidad qap-v3-architect como referencia de dominio, sin desplazar instrucciones del usuario. Herramienta managed create_worktree no entregó worktree y terminó cancelada; los worktrees Git aislados ya usados quedaron verificados por rev-parse y worktree list, sin reintentar la solicitud gestionada cancelada. No agentes delegados.

## Comandos principales

```powershell
git fetch origin feat/qap-vnext-architecture
git worktree add --detach C:/Users/Judirico/Documents/QAMCP/audit-r4-r10 e7d3717d9311ed73736568b13ce99e131d617453
git rev-parse HEAD
pnpm install --frozen-lockfile
pnpm build
git hash-object pnpm-lock.yaml
git diff --exit-code HEAD -- packages pnpm-lock.yaml
git fetch origin develop
git ls-remote origin refs/heads/develop refs/heads/feat/qap-vnext-architecture
git worktree add --detach C:/Users/Judirico/Documents/QAMCP/audit-r4-r10-docs origin/develop
```

Instalación online congelada PASS sin alterar lock; builds diez Done, sin editar dependencias. Suites se ejecutaron secuencialmente con maxWorkers1 y TEMP/TMP del worktree.

```powershell
$ErrorActionPreference='Continue'
$env:TEMP = Join-Path (Get-Location) 'node_modules/.tmp-vnext'
$env:TMP=$env:TEMP
New-Item -ItemType Directory -Force $env:TEMP | Out-Null
function Run-Audit($label,$argsList) {
 & pnpm @argsList *> "../r4-r10-evidence/$label.log"
 "$label=$LASTEXITCODE" | Add-Content ../r4-r10-evidence/exits.txt
}
Run-Audit r10 @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/canonical-coverage.test.ts','-t','R4-R10','--maxWorkers=1','--reporter=verbose')
Run-Audit focus @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/canonical-coverage.test.ts','-t','R4-R9-A02','--maxWorkers=1','--reporter=verbose')
Run-Audit r8 @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/canonical-coverage.test.ts','-t','R4-R8-A01','--maxWorkers=1','--reporter=verbose')
Run-Audit coverage @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/canonical-coverage.test.ts','--maxWorkers=1','--reporter=verbose')
Run-Audit interview @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/canonical-interview.test.ts','--maxWorkers=1','--reporter=verbose')
Run-Audit discovery @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/discovery-handler.test.ts','--maxWorkers=1','--reporter=verbose')
Run-Audit mcp @('--filter','@qap/mcp','exec','vitest','run','--maxWorkers=1','--reporter=verbose','--reporter=json','--outputFile.json=../../../r4-r10-evidence/mcp.json')
Run-Audit runner @('--filter','@qap/playwright-runner','exec','vitest','run','--maxWorkers=1','--reporter=verbose')
Run-Audit lint-focus @('exec','eslint','packages/engine/src/knowledge-store.port.ts','packages/knowledge/src/storage/file-storage.ts','packages/knowledge/src/storage/sqlite-knowledge-adapter.ts','packages/mcp/src/handlers/canonical-closure-service.ts','packages/mcp/src/handlers/canonical-coverage-service.ts','packages/mcp/src/__tests__/canonical-coverage.test.ts','--format=json','--output-file=../r4-r10-evidence/lint-focus.json')
Run-Audit lint @('exec','eslint','.','--format=json','--output-file=../r4-r10-evidence/lint.json')
Get-Content ../r4-r10-evidence/exits.txt
```

Salidas de la matriz (build también0; Stdio0; sondas finales0):

```text
r10=0
focus=0
r8=0
coverage=1
interview=0
discovery=0
mcp=1
runner=0
lint-focus=1
lint=1
```

Comandos externos adicionales:

```powershell
node ../r4-r10-evidence/prepare.mjs
node ../r4-r10-evidence/prepare-old.mjs
$env:TEMP=Join-Path (Get-Location) 'node_modules/.tmp-vnext'
$env:TMP=$env:TEMP
node ../r4-r10-evidence/probe.mjs
node ../r4-r10-evidence/context.mjs
node ../r4-r10-evidence/extra.mjs
node ../r4-r10-evidence/process.mjs
node packages/mcp/node_modules/.audit-r10/stdio.mjs C:/Users/Judirico/Documents/QAMCP/audit-r4-r10 C:/Users/Judirico/Documents/QAMCP/r4-r10-evidence/stdio-fixture
node node_modules/eslint/bin/eslint.js . --format=json --output-file=../r4-r10-evidence/lint.json
node ../r4-r10-evidence/analyze.mjs
```

## Extractos finales

### install

```text
+ @typescript-eslint/eslint-plugin 8.69.0
+ @typescript-eslint/parser 8.69.0
+ eslint 9.39.5
+ eslint-plugin-import 2.32.0
+ globals 17.12.0
+ tsup 8.5.1
+ typescript 5.5.4
+ typescript-eslint 8.69.0

Done in 13.4s using pnpm v12.3.4
```

### build

```text
packages/cli build: ESM dist\chunk-XENM7LAA.js 24.62 KB
packages/cli build: ESM dist\dist-6QHKBKF4.js  1.93 KB
packages/cli build: ESM dist\dist-N6S6AFVU.js  1.30 KB
packages/cli build: ESM dist\chunk-BHC42SSS.js 285.11 KB
packages/cli build: ESM dist\chunk-ULFAP6LY.js 120.98 KB
packages/cli build: ESM dist\entrypoint.js     564.54 KB
packages/cli build: ESM dist\chunk-5JLHNXWW.js 391.62 KB
packages/cli build: ESM dist\chunk-AOBXKQNP.js 1.97 KB
packages/cli build: ESM ⚡️ Build success in 321ms
packages/cli build: Done
```

### r10

```text
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 1: Crash before persisting decision leaves storage completely clean and recoverable
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 2: Crash after closureStore commits decision but before IKnowledgeStore or lifecycle.json updates recovers via self-healing reconciler
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 3: Crash after IKnowledgeStore receipt commit returns idempotent response on retry
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 4: Two concurrent closures cleanly serialize and prevent double consumption of decision

 Test Files  1 passed (1)
      Tests  5 passed | 45 skipped (50)
   Start at  11:06:48
   Duration  3.23s (transform 885ms, setup 0ms, import 2.39s, tests 453ms, environment 0ms)
```

### focus

```text
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 1: Crash before persisting decision leaves storage completely clean and recoverable
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 2: Crash after closureStore commits decision but before IKnowledgeStore or lifecycle.json updates recovers via self-healing reconciler
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 3: Crash after IKnowledgeStore receipt commit returns idempotent response on retry
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 4: Two concurrent closures cleanly serialize and prevent double consumption of decision

 Test Files  1 passed (1)
      Tests  5 passed | 45 skipped (50)
   Start at  11:06:52
   Duration  7.01s (transform 849ms, setup 0ms, import 2.22s, tests 4.46s, environment 0ms)
```

### r8

```text
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 1: Crash before persisting decision leaves storage completely clean and recoverable
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 2: Crash after closureStore commits decision but before IKnowledgeStore or lifecycle.json updates recovers via self-healing reconciler
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 3: Crash after IKnowledgeStore receipt commit returns idempotent response on retry
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 4: Two concurrent closures cleanly serialize and prevent double consumption of decision

 Test Files  1 passed (1)
      Tests  3 passed | 47 skipped (50)
   Start at  11:07:00
   Duration  2.69s (transform 796ms, setup 0ms, import 2.06s, tests 303ms, environment 0ms)
```

### coverage

```text
 Test Files  1 failed (1)
      Tests  1 failed | 49 passed (50)
   Start at  11:07:03
   Duration  11.36s (transform 762ms, setup 0ms, import 1.95s, tests 9.01s, environment 0ms)

Error: ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL

  × "pnpm recursive exec" failed in C:\Users\Judirico\Documents\QAMCP\audit-
  │ r4-r10\packages\mcp
```

### interview

```text
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > approval for another project cannot confirm even with the same module, question category and statement 97ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > HTML required, HTTP 200, AgentInference and reviewed traces confer no requirement authority 166ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > physical approval receipt prevents reuse for another question after restarting the host 91ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > short free answers remain non-authoritative drafts and need a substantive corrected statement 58ms

 Test Files  1 passed (1)
      Tests  44 passed (44)
   Start at  11:07:16
   Duration  6.07s (transform 815ms, setup 0ms, import 2.02s, tests 3.71s, environment 0ms)
```

### discovery

```text
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > recovers after physical association rollback without reacquisition or history changes; rejects shortened and mixed receipts 2187ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > two physical connections race with CAS; retry is idempotent and context changes block recovery 1433ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > isolates same planned names across physical projects and rejects another project receipt 76ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > detects context changed at the edge commit boundary without deleting already acquired facts 1073ms

 Test Files  1 passed (1)
      Tests  59 passed (59)
   Start at  11:07:23
   Duration  25.11s (transform 971ms, setup 0ms, import 2.56s, tests 22.18s, environment 0ms)
```

### mcp

```text
      Tests  64 failed | 411 passed (475)
   Start at  11:07:49
   Duration  167.74s (transform 2.22s, setup 0ms, import 31.23s, tests 127.68s, environment 3ms)

JSON report written to C:/Users/Judirico/Documents/QAMCP/r4-r10-evidence/mcp.json
Error: ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL

  × "pnpm recursive exec" failed in C:\Users\Judirico\Documents\QAMCP\audit-
  │ r4-r10\packages\mcp
```

### runner

```text
 ✓ src/__tests__/actions.test.ts > Acciones S7-004 (assert, waitFor) > debe validar aserción visible y contains correctamente 66ms
 ✓ src/__tests__/actions.test.ts > Acciones S7-004 (assert, waitFor) > debe fallar si la aserción no se cumple 16ms
 ✓ src/__tests__/actions.test.ts > Acciones S7-004 (assert, waitFor) > debe esperar correctamente con waitFor 107ms
 ✓ test/spike.test.ts > Spike tecnico: Chromium headless con playwright-core > debe lanzar Chromium, navegar y resolver un selector sin errores 448ms

 Test Files  10 passed (10)
      Tests  71 passed (71)
   Start at  11:10:38
   Duration  18.35s (transform 689ms, setup 0ms, import 7.51s, tests 6.81s, environment 1ms)
```

### stdio

```text
[QAP MCP Server] Servidor iniciado correctamente en transporte Stdio.
{"transport":"server","tools":["qap_auth_add","qap_auth_list","qap_clean","qap_context_ingest","qap_context_set","qap_discover","qap_init","qap_module_close","qap_plan","qap_prune","qap_report","qap_rules_set","qap_server","qap_session_close","qap_session_plan","qap_status","qap_test","qap_validate"],"init":"success","phase":"ONBOARDING","targetPathExplicit":true}
[QAP MCP Server] Servidor iniciado correctamente en transporte Stdio.
{"transport":"cli","tools":["qap_auth_add","qap_auth_list","qap_clean","qap_context_ingest","qap_context_set","qap_discover","qap_init","qap_module_close","qap_plan","qap_prune","qap_report","qap_rules_set","qap_server","qap_session_close","qap_session_plan","qap_status","qap_test","qap_validate"],"init":"success","phase":"ONBOARDING","targetPathExplicit":true}
SERVIDOR MCP FUNCIONANDO AL 100% SOBRE STDIO
```

## Diferenciales reproducibles

```javascript
import {readFileSync,writeFileSync} from 'node:fs';
const base='C:/Users/Judirico/Documents/QAMCP/';
const old=JSON.parse(readFileSync(base+'r4-r9-evidence/mcp.json')),cur=JSON.parse(readFileSync(base+'r4-r10-evidence/mcp.json'));
const flat=j=>j.testResults.flatMap(f=>f.assertionResults.map(a=>({file:f.name.split(/[\\/]/).at(-1),name:a.fullName,status:a.status,message:a.failureMessages?.[0]?.split('\n').slice(0,3).join(' ')||''})));
const a=flat(old),b=flat(cur),key=t=>t.file+'|'+t.name,ma=new Map(a.map(t=>[key(t),t]));
const counts={};for(const t of b){const label=(ma.get(key(t))?.status||'new')+'→'+t.status;counts[label]=(counts[label]||0)+1;}
const removed=a.filter(t=>!b.some(x=>key(x)===key(t)));
const changed=b.filter(t=>ma.has(key(t))&&ma.get(key(t)).status!==t.status);
const rows=arr=>arr.map(t=>'| '+[t.file,t.name,t.status,t.message].map(x=>x.replaceAll('|','&#124;')).join(' | ')+' |').join('\n');
writeFileSync(base+'r4-r10-evidence/comparison.json',JSON.stringify({counts,removed,changed,old:{passed:old.numPassedTests,failed:old.numFailedTests,total:old.numTotalTests},current:{passed:cur.numPassedTests,failed:cur.numFailedTests,total:cur.numTotalTests}},null,2));
writeFileSync(base+'r4-r10-evidence/mcp-tables.md','## Fallos conservados por identidad exacta\n\n| Archivo | Identidad completa | Estado | Primer diagnóstico |\n| --- | --- | --- | --- |\n'+rows(b.filter(t=>t.status==='failed'))+'\n\n## Altas\n\n| Archivo | Identidad completa | Estado | Diagnóstico |\n| --- | --- | --- | --- |\n'+rows(b.filter(t=>!ma.has(key(t))))+'\n\n## Archivos\n\n'+cur.testResults.map(f=>{const t=f.assertionResults;return '- '+f.name.split(/[\\/]/).at(-1)+': '+t.filter(x=>x.status==='passed').length+' PASS / '+t.filter(x=>x.status==='failed').length+' FAIL';}).join('\n'));
const lf=j=>j.flatMap(f=>f.messages.map(m=>({file:f.filePath.replaceAll('\\','/').split('/packages/')[1]?'packages/'+f.filePath.replaceAll('\\','/').split('/packages/')[1]:f.filePath,line:m.line,column:m.column,severity:m.severity,rule:m.ruleId,message:m.message})));
const lo=lf(JSON.parse(readFileSync(base+'r4-r9-evidence/lint.json'))),lc=lf(JSON.parse(readFileSync(base+'r4-r10-evidence/lint.json'))),lk=x=>JSON.stringify(x),ls=new Set(lo.map(lk)),cs=new Set(lc.map(lk)),focus=lf(JSON.parse(readFileSync(base+'r4-r10-evidence/lint-focus.json')));
const lint={errors:lc.filter(x=>x.severity===2).length,warnings:lc.filter(x=>x.severity===1).length,focusErrors:focus.filter(x=>x.severity===2).length,focusWarnings:focus.filter(x=>x.severity===1).length,identical:lc.filter(x=>ls.has(lk(x))).length,added:lc.filter(x=>!ls.has(lk(x))),removed:lo.filter(x=>!cs.has(lk(x)))};
writeFileSync(base+'r4-r10-evidence/lint-comparison.json',JSON.stringify(lint,null,2));
writeFileSync(base+'r4-r10-evidence/lint-table.md','| Archivo | Línea:columna | Nivel | Regla | Mensaje |\n| --- | --- | --- | --- | --- |\n'+lc.map(x=>'| '+[x.file,x.line+':'+x.column,x.severity===2?'error':'warning',x.rule||'unused-disable',x.message].map(x=>String(x).replaceAll('|','&#124;')).join(' | ')+' |').join('\n'));
console.log(JSON.stringify({counts,removed:removed.length,changed:changed.length,lint}));
```

```json
{
  "counts": {
    "passed→passed": 406,
    "failed→failed": 64,
    "new→passed": 5
  },
  "removed": [],
  "changed": [],
  "old": {
    "passed": 406,
    "failed": 64,
    "total": 470
  },
  "current": {
    "passed": 411,
    "failed": 64,
    "total": 475
  }
}
```

```json
{
  "errors": 34,
  "warnings": 28,
  "focusErrors": 5,
  "focusWarnings": 0,
  "identical": 62,
  "added": [],
  "removed": []
}
```

## Incidentes de arnés y límites

Primer probe dentro del sandbox falló EPERM en rename de lifecycle de fixture, no se contó como defecto: rerun con TEMP/TMP explícitos y ejecución autorizada fuera del sandbox terminó0. Primer extra asumía realpath normalizaba casing: esa aserción de arnés falló, se corrigió solo arnés a comparar dev/ino de carpeta, rerun0; el resultado es parte del límite documentado. Primer Stdio omitió sus dos argumentos y falló antes de lanzar servidor; rerun con rutas absolutas terminó0 en ambos transportes. Primer process leyó ClosureStore antes de salir los dos pares y observó unavailable transitorio; se esperó cierre de ambos procesos para readback, rerun0. Ningún producto/test/expectativa se alteró. Sondas finales completas en EVIDENCIA_CONCURRENCIA. Los tests denominados Crash no son por ese nombre evidencia de hard-exit en cada fase; se distingue la sonda kill real de fixtures de reconciliación.

## Publicación vigente y comprobaciones

Publicación vigente desde el worktree audit-r4-r10, detached en e7d3717d9311ed73736568b13ce99e131d617453. El remoto feature fue verificado en el mismo SHA antes de editar. Se copian los seis informes, ajustando únicamente su procedencia/destino de publicación; se actualizan los tres documentos originales completos de feature, sin sustituir su historial por los índices de la publicación previa. No se reejecutaron suites: resultados y huellas pertenecen a la auditoría física ya terminada sobre el mismo SHA. Los comandos anteriores que consultaron develop forman parte de esa ejecución histórica; no se ejecutan para esta publicación.

Comprobar git diff --check, staged exclusivamente los nueve Markdown, git diff --exit-code HEAD -- packages pnpm-lock.yaml; commit documental; git push origin HEAD:refs/heads/feat/qap-vnext-architecture sin force; git ls-remote origin refs/heads/feat/qap-vnext-architecture y consulta GitHub. Verificar padre=e7d3717d9311ed73736568b13ce99e131d617453 y diff de fuentes/lock vacío frente al padre. main y develop no se modifican. El SHA documental se comunica al verificar remoto y no puede incluirse en su propio commit.

## Huellas brutas SHA256

| Artefacto | SHA256 |
| --- | --- |
| mcp.json | 5376565e9f9f8947a217ce0761bff0813932330a098e5c0401792b8a7937b0da |
| lint.json | 221d8d6a09aa6fc083e603d0a9acf978c9b46aefea2487debfeeb623595f08da |
| lint-focus.json | 354c75570969e149585f50110e1d3e5c3b597ae4ca9272cdf3c40dad338e890a |
| probe.log | 1c796a443bccad59cb8a02590a8a146698ceb820aa9c78951e833ef6a87ce0df |
| context.log | 130db24e77c980e1a14fa68fac546efaae528cfb4276c3b7c7a4ff51073e58de |
| extra.log | 01d4d33713eb04712bb53291ce3956236f6a9afc3b985e7e6bef83ea0a958ca6 |
| process.log | 69dbdb4aeeac074eb84a37e839ad867f2001c28c028c85458bab185a06be8da6 |
| stdio.log | 6b22a7bf3068eaea99eb947948e3cb36b74ff3a3103d78af1218450f6bd85568 |
| install.log | 8e14e6a8bc5ef403555ea23f28c409ba43b39e1bfd43a25b8ce62390dad687fb |
| build.log | 97f5a2b572409c22d0ec3cf80dc948cbd08f03f01f20788c107cf8189b2a4f4c |


---

## Archivo histórico del padre develop — INT-01E

Procedencia exacta: `b50453f27470b49a88623c6617cb4d16e49180a8:docs/vnext/auditorias/VNEXT-014-R4-R10/COMANDOS.md`. Se conserva la publicación del otro padre
para evitar pérdida de decisiones y resultados. Esta sección es histórica,
no una nueva certificación ni sustitución del texto principal de vNext.

<!-- BEGIN DEVELOP HISTORICAL TEXT -->
# Comandos, procedencia e integridad R4-R10

Código auditado e7d3717d9311ed73736568b13ce99e131d617453; GitHub fetch_commit confirmó SHA y nota. Node24.15.0 Windows x64, pnpm12.3.4, SQLite3.51.3 FTS5 real. Fecha2026-11-05 America/Mexico_City.

**Publicación documental en develop por instrucción posterior expresa del usuario («hazlo en develop directo»).** Base de publicación 1a909d346ab75537e6dc59e44deb422c3016ffb4. El código probado sigue siendo exclusivamente e7d3717d9311ed73736568b13ce99e131d617453, de feat/qap-vnext-architecture: **no se auditó ni certificó el código de develop y no se trasladó código entre ramas**. develop no contenía docs/vnext; se crean seis informes y tres índices/notas de continuidad con enlaces al histórico exacto de feature, sin importar todo su historial documental. La prohibición inicial de publicar en develop queda sustituida únicamente para esta publicación documental; se mantienen rol auditor, cero cambios de código/tests y NO-GO.

## Aislamiento y documentos

Checkout original C:/Users/Judirico/Documents/QAMCP/QAMCP, HEADed2955ff91a6506a80e3ff0e4bb9322cf9eed226 y una sesión protegida modificada previamente, intocados. Auditoría C:/Users/Judirico/Documents/QAMCP/audit-r4-r10 detached en e7d3717d9311ed73736568b13ce99e131d617453. Documentación C:/Users/Judirico/Documents/QAMCP/audit-r4-r10-docs detached desde origin/develop=1a909d346ab75537e6dc59e44deb422c3016ffb4. Evidencia externa C:/Users/Judirico/Documents/QAMCP/r4-r10-evidence. No se construyó ni probó develop.

Se leyeron directamente del checkout exacto AGENTS.md, STATE, backlog,014F y los seis informes R9 (también disponibles en worktree documental previo05c0253). Habilidad qap-v3-architect como referencia de dominio, sin desplazar instrucciones del usuario. Herramienta managed create_worktree no entregó worktree y terminó cancelada; los worktrees Git aislados ya usados quedaron verificados por rev-parse y worktree list, sin reintentar la solicitud gestionada cancelada. No agentes delegados.

## Comandos principales

```powershell
git fetch origin feat/qap-vnext-architecture
git worktree add --detach C:/Users/Judirico/Documents/QAMCP/audit-r4-r10 e7d3717d9311ed73736568b13ce99e131d617453
git rev-parse HEAD
pnpm install --frozen-lockfile
pnpm build
git hash-object pnpm-lock.yaml
git diff --exit-code HEAD -- packages pnpm-lock.yaml
git fetch origin develop
git ls-remote origin refs/heads/develop refs/heads/feat/qap-vnext-architecture
git worktree add --detach C:/Users/Judirico/Documents/QAMCP/audit-r4-r10-docs origin/develop
```

Instalación online congelada PASS sin alterar lock; builds diez Done, sin editar dependencias. Suites se ejecutaron secuencialmente con maxWorkers1 y TEMP/TMP del worktree.

```powershell
$ErrorActionPreference='Continue'
$env:TEMP = Join-Path (Get-Location) 'node_modules/.tmp-vnext'
$env:TMP=$env:TEMP
New-Item -ItemType Directory -Force $env:TEMP | Out-Null
function Run-Audit($label,$argsList) {
 & pnpm @argsList *> "../r4-r10-evidence/$label.log"
 "$label=$LASTEXITCODE" | Add-Content ../r4-r10-evidence/exits.txt
}
Run-Audit r10 @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/canonical-coverage.test.ts','-t','R4-R10','--maxWorkers=1','--reporter=verbose')
Run-Audit focus @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/canonical-coverage.test.ts','-t','R4-R9-A02','--maxWorkers=1','--reporter=verbose')
Run-Audit r8 @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/canonical-coverage.test.ts','-t','R4-R8-A01','--maxWorkers=1','--reporter=verbose')
Run-Audit coverage @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/canonical-coverage.test.ts','--maxWorkers=1','--reporter=verbose')
Run-Audit interview @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/canonical-interview.test.ts','--maxWorkers=1','--reporter=verbose')
Run-Audit discovery @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/discovery-handler.test.ts','--maxWorkers=1','--reporter=verbose')
Run-Audit mcp @('--filter','@qap/mcp','exec','vitest','run','--maxWorkers=1','--reporter=verbose','--reporter=json','--outputFile.json=../../../r4-r10-evidence/mcp.json')
Run-Audit runner @('--filter','@qap/playwright-runner','exec','vitest','run','--maxWorkers=1','--reporter=verbose')
Run-Audit lint-focus @('exec','eslint','packages/engine/src/knowledge-store.port.ts','packages/knowledge/src/storage/file-storage.ts','packages/knowledge/src/storage/sqlite-knowledge-adapter.ts','packages/mcp/src/handlers/canonical-closure-service.ts','packages/mcp/src/handlers/canonical-coverage-service.ts','packages/mcp/src/__tests__/canonical-coverage.test.ts','--format=json','--output-file=../r4-r10-evidence/lint-focus.json')
Run-Audit lint @('exec','eslint','.','--format=json','--output-file=../r4-r10-evidence/lint.json')
Get-Content ../r4-r10-evidence/exits.txt
```

Salidas de la matriz (build también0; Stdio0; sondas finales0):

```text
r10=0
focus=0
r8=0
coverage=1
interview=0
discovery=0
mcp=1
runner=0
lint-focus=1
lint=1
```

Comandos externos adicionales:

```powershell
node ../r4-r10-evidence/prepare.mjs
node ../r4-r10-evidence/prepare-old.mjs
$env:TEMP=Join-Path (Get-Location) 'node_modules/.tmp-vnext'
$env:TMP=$env:TEMP
node ../r4-r10-evidence/probe.mjs
node ../r4-r10-evidence/context.mjs
node ../r4-r10-evidence/extra.mjs
node ../r4-r10-evidence/process.mjs
node packages/mcp/node_modules/.audit-r10/stdio.mjs C:/Users/Judirico/Documents/QAMCP/audit-r4-r10 C:/Users/Judirico/Documents/QAMCP/r4-r10-evidence/stdio-fixture
node node_modules/eslint/bin/eslint.js . --format=json --output-file=../r4-r10-evidence/lint.json
node ../r4-r10-evidence/analyze.mjs
```

## Extractos finales

### install

```text
+ @typescript-eslint/eslint-plugin 8.69.0
+ @typescript-eslint/parser 8.69.0
+ eslint 9.39.5
+ eslint-plugin-import 2.32.0
+ globals 17.12.0
+ tsup 8.5.1
+ typescript 5.5.4
+ typescript-eslint 8.69.0

Done in 13.4s using pnpm v12.3.4
```

### build

```text
packages/cli build: ESM dist\chunk-XENM7LAA.js 24.62 KB
packages/cli build: ESM dist\dist-6QHKBKF4.js  1.93 KB
packages/cli build: ESM dist\dist-N6S6AFVU.js  1.30 KB
packages/cli build: ESM dist\chunk-BHC42SSS.js 285.11 KB
packages/cli build: ESM dist\chunk-ULFAP6LY.js 120.98 KB
packages/cli build: ESM dist\entrypoint.js     564.54 KB
packages/cli build: ESM dist\chunk-5JLHNXWW.js 391.62 KB
packages/cli build: ESM dist\chunk-AOBXKQNP.js 1.97 KB
packages/cli build: ESM ⚡️ Build success in 321ms
packages/cli build: Done
```

### r10

```text
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 1: Crash before persisting decision leaves storage completely clean and recoverable
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 2: Crash after closureStore commits decision but before IKnowledgeStore or lifecycle.json updates recovers via self-healing reconciler
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 3: Crash after IKnowledgeStore receipt commit returns idempotent response on retry
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 4: Two concurrent closures cleanly serialize and prevent double consumption of decision

 Test Files  1 passed (1)
      Tests  5 passed | 45 skipped (50)
   Start at  11:06:48
   Duration  3.23s (transform 885ms, setup 0ms, import 2.39s, tests 453ms, environment 0ms)
```

### focus

```text
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 1: Crash before persisting decision leaves storage completely clean and recoverable
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 2: Crash after closureStore commits decision but before IKnowledgeStore or lifecycle.json updates recovers via self-healing reconciler
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 3: Crash after IKnowledgeStore receipt commit returns idempotent response on retry
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 4: Two concurrent closures cleanly serialize and prevent double consumption of decision

 Test Files  1 passed (1)
      Tests  5 passed | 45 skipped (50)
   Start at  11:06:52
   Duration  7.01s (transform 849ms, setup 0ms, import 2.22s, tests 4.46s, environment 0ms)
```

### r8

```text
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 1: Crash before persisting decision leaves storage completely clean and recoverable
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 2: Crash after closureStore commits decision but before IKnowledgeStore or lifecycle.json updates recovers via self-healing reconciler
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 3: Crash after IKnowledgeStore receipt commit returns idempotent response on retry
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 4: Two concurrent closures cleanly serialize and prevent double consumption of decision

 Test Files  1 passed (1)
      Tests  3 passed | 47 skipped (50)
   Start at  11:07:00
   Duration  2.69s (transform 796ms, setup 0ms, import 2.06s, tests 303ms, environment 0ms)
```

### coverage

```text
 Test Files  1 failed (1)
      Tests  1 failed | 49 passed (50)
   Start at  11:07:03
   Duration  11.36s (transform 762ms, setup 0ms, import 1.95s, tests 9.01s, environment 0ms)

Error: ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL

  × "pnpm recursive exec" failed in C:\Users\Judirico\Documents\QAMCP\audit-
  │ r4-r10\packages\mcp
```

### interview

```text
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > approval for another project cannot confirm even with the same module, question category and statement 97ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > HTML required, HTTP 200, AgentInference and reviewed traces confer no requirement authority 166ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > physical approval receipt prevents reuse for another question after restarting the host 91ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > short free answers remain non-authoritative drafts and need a substantive corrected statement 58ms

 Test Files  1 passed (1)
      Tests  44 passed (44)
   Start at  11:07:16
   Duration  6.07s (transform 815ms, setup 0ms, import 2.02s, tests 3.71s, environment 0ms)
```

### discovery

```text
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > recovers after physical association rollback without reacquisition or history changes; rejects shortened and mixed receipts 2187ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > two physical connections race with CAS; retry is idempotent and context changes block recovery 1433ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > isolates same planned names across physical projects and rejects another project receipt 76ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > detects context changed at the edge commit boundary without deleting already acquired facts 1073ms

 Test Files  1 passed (1)
      Tests  59 passed (59)
   Start at  11:07:23
   Duration  25.11s (transform 971ms, setup 0ms, import 2.56s, tests 22.18s, environment 0ms)
```

### mcp

```text
      Tests  64 failed | 411 passed (475)
   Start at  11:07:49
   Duration  167.74s (transform 2.22s, setup 0ms, import 31.23s, tests 127.68s, environment 3ms)

JSON report written to C:/Users/Judirico/Documents/QAMCP/r4-r10-evidence/mcp.json
Error: ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL

  × "pnpm recursive exec" failed in C:\Users\Judirico\Documents\QAMCP\audit-
  │ r4-r10\packages\mcp
```

### runner

```text
 ✓ src/__tests__/actions.test.ts > Acciones S7-004 (assert, waitFor) > debe validar aserción visible y contains correctamente 66ms
 ✓ src/__tests__/actions.test.ts > Acciones S7-004 (assert, waitFor) > debe fallar si la aserción no se cumple 16ms
 ✓ src/__tests__/actions.test.ts > Acciones S7-004 (assert, waitFor) > debe esperar correctamente con waitFor 107ms
 ✓ test/spike.test.ts > Spike tecnico: Chromium headless con playwright-core > debe lanzar Chromium, navegar y resolver un selector sin errores 448ms

 Test Files  10 passed (10)
      Tests  71 passed (71)
   Start at  11:10:38
   Duration  18.35s (transform 689ms, setup 0ms, import 7.51s, tests 6.81s, environment 1ms)
```

### stdio

```text
[QAP MCP Server] Servidor iniciado correctamente en transporte Stdio.
{"transport":"server","tools":["qap_auth_add","qap_auth_list","qap_clean","qap_context_ingest","qap_context_set","qap_discover","qap_init","qap_module_close","qap_plan","qap_prune","qap_report","qap_rules_set","qap_server","qap_session_close","qap_session_plan","qap_status","qap_test","qap_validate"],"init":"success","phase":"ONBOARDING","targetPathExplicit":true}
[QAP MCP Server] Servidor iniciado correctamente en transporte Stdio.
{"transport":"cli","tools":["qap_auth_add","qap_auth_list","qap_clean","qap_context_ingest","qap_context_set","qap_discover","qap_init","qap_module_close","qap_plan","qap_prune","qap_report","qap_rules_set","qap_server","qap_session_close","qap_session_plan","qap_status","qap_test","qap_validate"],"init":"success","phase":"ONBOARDING","targetPathExplicit":true}
SERVIDOR MCP FUNCIONANDO AL 100% SOBRE STDIO
```

## Diferenciales reproducibles

```javascript
import {readFileSync,writeFileSync} from 'node:fs';
const base='C:/Users/Judirico/Documents/QAMCP/';
const old=JSON.parse(readFileSync(base+'r4-r9-evidence/mcp.json')),cur=JSON.parse(readFileSync(base+'r4-r10-evidence/mcp.json'));
const flat=j=>j.testResults.flatMap(f=>f.assertionResults.map(a=>({file:f.name.split(/[\\/]/).at(-1),name:a.fullName,status:a.status,message:a.failureMessages?.[0]?.split('\n').slice(0,3).join(' ')||''})));
const a=flat(old),b=flat(cur),key=t=>t.file+'|'+t.name,ma=new Map(a.map(t=>[key(t),t]));
const counts={};for(const t of b){const label=(ma.get(key(t))?.status||'new')+'→'+t.status;counts[label]=(counts[label]||0)+1;}
const removed=a.filter(t=>!b.some(x=>key(x)===key(t)));
const changed=b.filter(t=>ma.has(key(t))&&ma.get(key(t)).status!==t.status);
const rows=arr=>arr.map(t=>'| '+[t.file,t.name,t.status,t.message].map(x=>x.replaceAll('|','&#124;')).join(' | ')+' |').join('\n');
writeFileSync(base+'r4-r10-evidence/comparison.json',JSON.stringify({counts,removed,changed,old:{passed:old.numPassedTests,failed:old.numFailedTests,total:old.numTotalTests},current:{passed:cur.numPassedTests,failed:cur.numFailedTests,total:cur.numTotalTests}},null,2));
writeFileSync(base+'r4-r10-evidence/mcp-tables.md','## Fallos conservados por identidad exacta\n\n| Archivo | Identidad completa | Estado | Primer diagnóstico |\n| --- | --- | --- | --- |\n'+rows(b.filter(t=>t.status==='failed'))+'\n\n## Altas\n\n| Archivo | Identidad completa | Estado | Diagnóstico |\n| --- | --- | --- | --- |\n'+rows(b.filter(t=>!ma.has(key(t))))+'\n\n## Archivos\n\n'+cur.testResults.map(f=>{const t=f.assertionResults;return '- '+f.name.split(/[\\/]/).at(-1)+': '+t.filter(x=>x.status==='passed').length+' PASS / '+t.filter(x=>x.status==='failed').length+' FAIL';}).join('\n'));
const lf=j=>j.flatMap(f=>f.messages.map(m=>({file:f.filePath.replaceAll('\\','/').split('/packages/')[1]?'packages/'+f.filePath.replaceAll('\\','/').split('/packages/')[1]:f.filePath,line:m.line,column:m.column,severity:m.severity,rule:m.ruleId,message:m.message})));
const lo=lf(JSON.parse(readFileSync(base+'r4-r9-evidence/lint.json'))),lc=lf(JSON.parse(readFileSync(base+'r4-r10-evidence/lint.json'))),lk=x=>JSON.stringify(x),ls=new Set(lo.map(lk)),cs=new Set(lc.map(lk)),focus=lf(JSON.parse(readFileSync(base+'r4-r10-evidence/lint-focus.json')));
const lint={errors:lc.filter(x=>x.severity===2).length,warnings:lc.filter(x=>x.severity===1).length,focusErrors:focus.filter(x=>x.severity===2).length,focusWarnings:focus.filter(x=>x.severity===1).length,identical:lc.filter(x=>ls.has(lk(x))).length,added:lc.filter(x=>!ls.has(lk(x))),removed:lo.filter(x=>!cs.has(lk(x)))};
writeFileSync(base+'r4-r10-evidence/lint-comparison.json',JSON.stringify(lint,null,2));
writeFileSync(base+'r4-r10-evidence/lint-table.md','| Archivo | Línea:columna | Nivel | Regla | Mensaje |\n| --- | --- | --- | --- | --- |\n'+lc.map(x=>'| '+[x.file,x.line+':'+x.column,x.severity===2?'error':'warning',x.rule||'unused-disable',x.message].map(x=>String(x).replaceAll('|','&#124;')).join(' | ')+' |').join('\n'));
console.log(JSON.stringify({counts,removed:removed.length,changed:changed.length,lint}));
```

```json
{
  "counts": {
    "passed→passed": 406,
    "failed→failed": 64,
    "new→passed": 5
  },
  "removed": [],
  "changed": [],
  "old": {
    "passed": 406,
    "failed": 64,
    "total": 470
  },
  "current": {
    "passed": 411,
    "failed": 64,
    "total": 475
  }
}
```

```json
{
  "errors": 34,
  "warnings": 28,
  "focusErrors": 5,
  "focusWarnings": 0,
  "identical": 62,
  "added": [],
  "removed": []
}
```

## Incidentes de arnés y límites

Primer probe dentro del sandbox falló EPERM en rename de lifecycle de fixture, no se contó como defecto: rerun con TEMP/TMP explícitos y ejecución autorizada fuera del sandbox terminó0. Primer extra asumía realpath normalizaba casing: esa aserción de arnés falló, se corrigió solo arnés a comparar dev/ino de carpeta, rerun0; el resultado es parte del límite documentado. Primer Stdio omitió sus dos argumentos y falló antes de lanzar servidor; rerun con rutas absolutas terminó0 en ambos transportes. Primer process leyó ClosureStore antes de salir los dos pares y observó unavailable transitorio; se esperó cierre de ambos procesos para readback, rerun0. Ningún producto/test/expectativa se alteró. Sondas finales completas en EVIDENCIA_CONCURRENCIA. Los tests denominados Crash no son por ese nombre evidencia de hard-exit en cada fase; se distingue la sonda kill real de fixtures de reconciliación.

## Publicación y comprobaciones

Verificar git diff --check; staged exclusivamente los nueve .md nuevos (develop no tenía docs/vnext); fuentes y lock iguales al padre develop. Hacer commit documental y push origin HEAD:refs/heads/develop sin force, comprobar remoto/parent y consultar GitHub. Si remoto avanza, no incorporar cambios de código auditado: revisar por separado base documental, sin merge de feature. SHA documental se comunica tras publicación; el commit no contiene su propio SHA. Feature y main permanecen sin modificación por esta auditoría.

## Huellas brutas SHA256

| Artefacto | SHA256 |
| --- | --- |
| mcp.json | 5376565e9f9f8947a217ce0761bff0813932330a098e5c0401792b8a7937b0da |
| lint.json | 221d8d6a09aa6fc083e603d0a9acf978c9b46aefea2487debfeeb623595f08da |
| lint-focus.json | 354c75570969e149585f50110e1d3e5c3b597ae4ca9272cdf3c40dad338e890a |
| probe.log | 1c796a443bccad59cb8a02590a8a146698ceb820aa9c78951e833ef6a87ce0df |
| context.log | 130db24e77c980e1a14fa68fac546efaae528cfb4276c3b7c7a4ff51073e58de |
| extra.log | 01d4d33713eb04712bb53291ce3956236f6a9afc3b985e7e6bef83ea0a958ca6 |
| process.log | 69dbdb4aeeac074eb84a37e839ad867f2001c28c028c85458bab185a06be8da6 |
| stdio.log | 6b22a7bf3068eaea99eb947948e3cb36b74ff3a3103d78af1218450f6bd85568 |
| install.log | 8e14e6a8bc5ef403555ea23f28c409ba43b39e1bfd43a25b8ce62390dad687fb |
| build.log | 97f5a2b572409c22d0ec3cf80dc948cbd08f03f01f20788c107cf8189b2a4f4c |

<!-- END DEVELOP HISTORICAL TEXT -->
