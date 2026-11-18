# Comandos y procedencia R4-R12

2026-11-05, America/Mexico_City. SHA código **7ccf3db1a6f259f6a5c51521518bbb399a13fda2**, feature remota fijada a ese SHA; worktree existente limpio audit-r4-r10 detached desde e3a95d4 documental R11, sin fuentes posteriores. AGENTS,STATE,backlog,014H,seis informes R11 consultados directamente. Scripts R11 reutilizados y ejecutados de nuevo con bundles R12; servicio R9 solo en compatibilidad histórica.

```powershell
git status --short
git fetch origin feat/qap-vnext-architecture
git switch --detach 7ccf3db1a6f259f6a5c51521518bbb399a13fda2
git rev-parse HEAD
git diff e3a95d4 HEAD --stat
node -v
pnpm -v
pnpm install --frozen-lockfile
pnpm build
git hash-object pnpm-lock.yaml packages/playwright-runner/.qa/cache/sessions/admin-user.json
git -C ../QAMCP hash-object packages/playwright-runner/.qa/cache/sessions/admin-user.json
git diff --exit-code 7ccf3db1a6f259f6a5c51521518bbb399a13fda2 -- packages pnpm-lock.yaml
```

Build Done10:shared,engine,auth,knowledge,playwright-adapter,git-adapter,reporter,playwright-runner,mcp,cli. Instalación0/build0; lockfilea9bd8de7f6ac38db1ad4ae6582c4539b351225c8,sesiónworktree429bbf6d57a1d798231b4204d52069b4077703de,principal28e1b8dbec7ccf194440cc4158ec6072c9b9ade4. Solo hashes,no contenido protegido. SQLite3.51.3 FTS5 CREATE/INSERT/MATCH físicos.

## Matriz

```powershell
$ErrorActionPreference='Continue'
$env:TEMP = Join-Path (Get-Location) 'node_modules/.tmp-vnext'
$env:TMP=$env:TEMP
New-Item -ItemType Directory -Force $env:TEMP | Out-Null
function Run-Audit($label,$argsList) {
 & pnpm @argsList *> "../r4-r12-evidence/$label.log"
 "$label=$LASTEXITCODE" | Add-Content ../r4-r12-evidence/exits.txt
}
Run-Audit r12 @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/canonical-coverage.test.ts','-t','R4-R12','--maxWorkers=1','--reporter=verbose')
Run-Audit r11 @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/canonical-coverage.test.ts','-t','R4-R11','--maxWorkers=1','--reporter=verbose')
Run-Audit r10 @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/canonical-coverage.test.ts','-t','R4-R10','--maxWorkers=1','--reporter=verbose')
Run-Audit focus @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/canonical-coverage.test.ts','-t','R4-R9-A02','--maxWorkers=1','--reporter=verbose')
Run-Audit r8 @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/canonical-coverage.test.ts','-t','R4-R8-A01','--maxWorkers=1','--reporter=verbose')
Run-Audit coverage @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/canonical-coverage.test.ts','--maxWorkers=1','--reporter=verbose')
Run-Audit interview @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/canonical-interview.test.ts','--maxWorkers=1','--reporter=verbose')
Run-Audit discovery @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/discovery-handler.test.ts','--maxWorkers=1','--reporter=verbose')
Run-Audit mcp @('--filter','@qap/mcp','exec','vitest','run','--maxWorkers=1','--reporter=verbose','--reporter=json','--outputFile.json=../../../r4-r12-evidence/mcp.json')
Run-Audit runner @('--filter','@qap/playwright-runner','exec','vitest','run','--maxWorkers=1','--reporter=verbose')
Run-Audit lint-focus @('exec','eslint','packages/engine/src/knowledge-store.port.ts','packages/knowledge/src/storage/file-storage.ts','packages/knowledge/src/storage/sqlite-knowledge-adapter.ts','packages/mcp/src/handlers/module-closure-store.ts','packages/mcp/src/handlers/canonical-closure-service.ts','packages/mcp/src/handlers/canonical-coverage-service.ts','packages/mcp/src/__tests__/canonical-coverage.test.ts','--format=json','--output-file=../r4-r12-evidence/lint-focus.json')
Run-Audit lint @('exec','eslint','.','--format=json','--output-file=../r4-r12-evidence/lint.json')
Get-Content ../r4-r12-evidence/exits.txt
```

```text
install=0
build=0

r12=0
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

MCPexit1 por63fallos conservados y lint exit1 por históricos, no falsear verde. Foco amplía6→7archivos y5→7errores previos; global34/28sin altas reales.

## Sondas

```powershell
$env:TEMP=Join-Path (Get-Location) 'node_modules/.tmp-vnext'
$env:TMP=$env:TEMP
node ../r4-r12-evidence/prepare.mjs
node ../r4-r12-evidence/prepare-old.mjs
node ../r4-r12-evidence/runtime-identity.mjs
node ../r4-r12-evidence/expiry.mjs
node ../r4-r12-evidence/wrapper.mjs
node ../r4-r12-evidence/replay.mjs
node ../r4-r12-evidence/replay-process.mjs
node ../r4-r12-evidence/integrity.mjs
node ../r4-r12-evidence/locks.mjs
node ../r4-r12-evidence/terminal.mjs
node ../r4-r12-evidence/crash.mjs
node ../r4-r12-evidence/context.mjs
node ../r4-r12-evidence/extra.mjs
node ../r4-r12-evidence/process.mjs
node ../r4-r12-evidence/process-mixed.mjs
node packages/mcp/node_modules/.audit-r12/stdio.mjs C:/Users/Judirico/Documents/QAMCP/audit-r4-r10 C:/Users/Judirico/Documents/QAMCP/r4-r12-evidence/stdio-fixture
node ../r4-r12-evidence/analyze.mjs
node ../r4-r12-evidence/lint-map.mjs
```

Arneses íntegros/salidas en EVIDENCIA. Imports de bundle externo packages/mcp/node_modules/.audit-r12 ignorado, stores originales,fixtures node_modules/.tmp-vnext. No fuente reemplazada. human-review/makeDecision son dobles, no consentimiento humano. Tamper/corrupción exclusivamente en nuevas bases temporales.

```text
expiry=1
expiry-final=0
replay=0
wrapper=0
replay-process=0
wrapper-final=0
integrity=1
integrity-final=0
runtime-identity=0
wrapper-control-final=0

locks=0
terminal=0
crash=0
context=0
extra=0
process=0
process-mixed=0
stdio=1
stdio-final=0
```

Sondas finales exit0, incluso W01 (éxito de reproducción del defecto, no PASS de seguridad). Los exit1 iniciales se preservan y explican.

## Stdio y CLI

```text
[QAP MCP Server] Servidor iniciado correctamente en transporte Stdio.
{"transport":"server","tools":["qap_auth_add","qap_auth_list","qap_clean","qap_context_ingest","qap_context_set","qap_discover","qap_init","qap_module_close","qap_plan","qap_prune","qap_report","qap_rules_set","qap_server","qap_session_close","qap_session_plan","qap_status","qap_test","qap_validate"],"init":"success","phase":"ONBOARDING","targetPathExplicit":true}
[QAP MCP Server] Servidor iniciado correctamente en transporte Stdio.
{"transport":"cli","tools":["qap_auth_add","qap_auth_list","qap_clean","qap_context_ingest","qap_context_set","qap_discover","qap_init","qap_module_close","qap_plan","qap_prune","qap_report","qap_rules_set","qap_server","qap_session_close","qap_session_plan","qap_status","qap_test","qap_validate"],"init":"success","phase":"ONBOARDING","targetPathExplicit":true}
SERVIDOR MCP FUNCIONANDO AL 100% SOBRE STDIO
```


## Incidencias

- Fetch sandbox getaddrinfo falló; retry autorizado fuera de sandbox obtuvo7ccf3db. Instalación congelada0,sin lockchanges.
- expiry-attempt1 esperaba siempre review_expired; recibió consistency_conflict al entrar vencido. Producto intacto; clasificador externo final registra ambas negativas y exige exactamente sin cambios los recursos. D01 publicado, no ocultado. TestR12 original intacto PASS.
- Stdio primer intento omitió argumentos repo/out del harness y falló ERR_INVALID_ARG_TYPE antes de abrir servidor. Retry con rutas absolutas/fixtures nuevas PASS.
- Primer analyze fue anterior a que ESLint global escribiera lint.json: ENOENT de herramienta. Repetido tras terminar; lint-map compara multiplicidades y desplazamientos del diff.
- integrity-attempt1 esperaba blocked, adapter rechazó y servicio propagó corrupt. Final exige esa excepción y no falsa autoridad, sin modificar producto.
- Un intento de escribir el generador documental excedió longitud de comando Windows(CreateProcess206), sin crear archivo; se dividió en tres escrituras. No afecta pruebas/producto.
- W01 no elimina ALS ni fake store; snapshot control solo cambia wrapper externo. No se certifica autoridad alterada legítima ni se transporta documentación por el usuario.

## SHA256 de evidencias locales

JSON/logs conservados fuera de fuentes; identidades,diagnósticos,scripts y salidas de concurrencia incorporados en informes para revisión directa GitHub.

```text
ba20b948c5be58e39b0604713b3956dfae5fa61815366832c8f9ec0b9cd441ac  analyze.mjs
fbb3e2ffed3f2e689effdc36349c02470dcb7264473bd75cd859901c2a8cf417  build.log
5ed7240c418b3cc630277a2b493c144cb13010148fd6ac605c918be49a55432b  comparison.json
130db24e77c980e1a14fa68fac546efaae528cfb4276c3b7c7a4ff51073e58de  context.log
59dfcc0637e6e7a9b2215e6b56652121be709411fed4733f432d72224ede2cc0  context.mjs
edc16b4bee8f25e3f94764b1a75f8b0769a39937e92246cdd12b2ca9f4e77a40  coverage.log
8bb71713ea3a1b8fae7ef60260e3fe450debb0b31f8fc59e179dd9f7a53eac9a  crash.log
6aafac86f89b9e9b4846375cba83ff668fccfc2f158a34d1f4cc5bcc9a1d8175  crash.mjs
930ecb189fe4001bc155e89ea05ed3119ee9b042170d2e5226fc534b81750204  discovery.log
c4993e6ef1252659ae9658e9f8ed53ecbad1b82065d2c148e6d094ab2bb11213  exits.txt
ca5d6d60c01306c3ba621d043f9fec7e613f201276421128bd114e50fdf4a902  expiry-attempt1.log
79ee4fbc7caf0eea2576bba604dd282f5816db1e723e7c0c6c2b2538f25c3193  expiry.log
f86c22351377a18d1be24c58543f9d5098dbc72a0c35338bcd5289173da7c41c  expiry.mjs
14686591aaf46d13fb9103627d1db23ed369b4bc44b3dc336c61ad82dc3ee5a4  extra.log
21002f688cd4c4141704b5a6f445856631ef87acb4f623b7ae1c81b72bfc441d  extra.mjs
8e580598b863468ce06adaeb33a826892c21aac9b2750ac54e1b14fc7b6d529b  focus.log
028b3ca73ba6fb6fd8d155f458bbe2e975403a9bfbd437935219a40a12d8727d  install-exit.txt
745316c345148adad86de95f598a4b65a3b7c7632fd154f15ae6e0ae8dab8d83  install.log
a7ad13bd2e9d79191f61b0cad684415e44cf02d9ddd223421b001825c2294f1a  integrity-attempt1.log
adc610e31ebd7e42c8e7c8edcb310a242c671fac05aa4b55910752f8b382dfa0  integrity.log
cf9b11ebeed6195eff931ac613b5fa809d3152644bf2bb88d3321c0deacaeee8  integrity.mjs
19bc367eeb2ec7aeba598638a2cf6c95f82ad49123a7dae0465bcd1e58c3da8e  interview.log
f304abaad0c7a985027990d2ffef8316009f782939018a66ef8b65432b64ae91  lint-comparison.json
bc466a925b902f801a6a5665e92a40f2cf826041759188612042a7ca094fc861  lint-focus.json
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  lint-focus.log
eb9e3d5f79ff746b8c14c7fc7430a0570306a0efbbd97dc94166d8047c35498b  lint-map.mjs
6e7f10e4edfd0f94c820a705bab5e12919aaa5533548a202990a1715cd327fad  lint.json
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  lint.log
cf10eacfa091c6641bafa5c448bdca6572bb123969d03d36710fead370227508  locks.log
cc534e8bf338f387c8f8df24b2096142acb4b9ecbc8d1009f119a075ef204122  locks.mjs
74d82e5f0db6458368b5642094ed621edf28d97778eda8f6b08b53881baeb9e5  mcp.json
320c6a725e1616bbd63643eefee54f42eecf10e1744dc3673350fa389a4b0cd2  mcp.log
cd5f6b093e1966822b38c8c35951e54943e39f2bdc9792d037e1fb778690fa51  patch-integrity.mjs
75a65d247a6aee5afc33b941ec77676276518d938a9b6169af58afde0486fdcb  patch-prepare.mjs
eff24398027ca4d16a627c498e6d939314375f70a3521e435f38232298404c25  patch-wrapper.mjs
e4facb19ef598430432fbf8b0d2cb94225d5c466a443c4e1d0464b0a022a8ef9  prepare-old.mjs
400f8a033ba944e7392af70122fea0ad7db8110bd5ef054371d1e7b314812f06  prepare.mjs
51bad1b8559acdc6de182221ce28d2f3b604f89e97ef376b6311f53011a3eca0  probe-exits.txt
eab1aa3a0455ed45b52648675e89c43a27b4fd9989a2e3218fb9ef26be1db7a9  process-mixed.log
29b3aa3c581bc88407e11944edba952e27ab1401707d5dc7b2b618dc6b9d6d2e  process-mixed.mjs
7f8517b22b29a042c687840a05476d565ef9673fe722926c397804a1e4392b11  process.log
996247ffff7ab7c949ac664a30ef1f69796ac5b6384dfc08ce4c97111d414e8b  process.mjs
5bf4e23ca36985c6ae27c032fb3fc0f4a47279ef56df0498869346ff49d63c33  publish.mjs
bb2ada0e1ca798d206eba94657a326990c6f0a083ee4254b819498b87d0986b4  r10.log
79ba357c4e02f493e362683005ffae4ccd07c46558106480ec63ef374cb0e3f4  r11.log
d034bc1b8a642bf184e69fa600ab362a9540344e39bc4b61752e26a1cb7b3ead  r12.log
7f3378c1df8d85661311e12a50e549c0c607e4e1465be6d2f5a08c69b73d6b8d  r8.log
7038c47faf8a39fd3b2458b8256b75486cdae03cb187419b3495e7814740862f  regression-exits.txt
2b3e3b989f747fae86bed989b3f7a48644daa3e83408fc83c54c9903826c7837  replay-process.log
5e36e135dbba7f42faee4baa768fe0c9028d600a1e232ecff277d99e8f3e9e0e  replay-process.mjs
833504f323f91c33d2b0e6ea528cbf87ae7e9b094669e074b01abcf9efa0054e  replay.log
3516522946151597a0d02eaf01870f1349bfe9ff6a60a552c05edc7e5137a54f  replay.mjs
850934810a04e00add98ff959c940e645b1efa8c5aae9b3aa108a5bdba035dc9  run.ps1
26430ac4a4f89c66c5415d3f376ec99bf785d4511ee669120a0d36557c3081f9  runner.log
e03801c7f9703ea7d202f9071f1f180a54c8a13415c70a263f5dafbae6f1d42b  runtime-identity.log
30874ebdc7b82a3aa19e5c5cba2ffe8cf48dd88284f5139a05ed80619c2e3fa2  runtime-identity.mjs
b21806b2c3be93fa63190717d3d140eb53c0b5b6354dfb43b8c218370a08ad5e  setup-analyze.mjs
c6a46fd75a5aafcb9d5749c182493108a85996fa2069e2a27fda45c55dd1650d  setup-runtime.mjs
4c1fa326365c0058d398f1b174e89aa15fd17ea5620c29cd952adf3598838b40  setup.mjs
cf88d4e633ad2a48164eadbd089877e7a2c267571e389973e82eca001d7cdc85  stdio-attempt1.log
6b22a7bf3068eaea99eb947948e3cb36b74ff3a3103d78af1218450f6bd85568  stdio.log
dcac8f02ab5b1802c619bad0c7c06b828fe11c5aca42b3d8afd16f4e8a00710e  terminal.log
0bf8439697bef150a3debe3f2a2a9ec7f12c1d104ce67214cc176ce7d7e718c9  terminal.mjs
5ce2f983bba62cdfcea12b6fdc281f5280cd08a5a102ea25b24c49402b8ab812  util.mjs
ea0ee678345cf5f819193dac96dff5842ce17d999b3e7c55a4ecf125f3badd3f  wrapper.log
ab6287966bf947b406bf0fd80acac23074084d32b1417ab668d5336c7ccea27d  wrapper.mjs
```


Baseline R11mcp.json8a4108863dba018801cd247c182e1184a1d6e5603ec6c07fa294d0aea919aa2c;R11lint.json221d8d6a09aa6fc083e603d0a9acf978c9b46aefea2487debfeeb623595f08da;R8mcp.jsonca99d029c3300447a1078284f88b8c77c497f2377d7f8c30eed04da1341bd45c. No atribuidos a ejecuciones nuevas.

## Publicación y comprobación

```powershell
git diff --check
git diff --exit-code 7ccf3db1a6f259f6a5c51521518bbb399a13fda2 -- packages pnpm-lock.yaml
git add -- docs/vnext/STATE.md docs/vnext/04_BACKLOG_Y_WBS_PRELIMINAR.md docs/vnext/014H_R4_R12_EXPIRY_GAP_REPLAY.md docs/vnext/auditorias/VNEXT-014-R4-R12/
git diff --cached --name-only
git commit -m "docs(vnext): publish independent R4-R12 expiry and replay audit"
git push origin HEAD:refs/heads/feat/qap-vnext-architecture
git rev-parse HEAD
git ls-remote origin refs/heads/feat/qap-vnext-architecture refs/heads/main refs/heads/develop
```

Sin merge/force-push. Referencias previas:feature7ccf3db1a6f259f6a5c51521518bbb399a13fda2,mainfa6a527764f6e96514a1e589411e7f402e059b68,develop0e5825cfd256065e532f45a171f9a0dc74116615. Publicación debe tener SHA código como padre y nueve Markdown; SHA documental remoto comunicado en mensaje final/verificable en commit que contiene informes.
