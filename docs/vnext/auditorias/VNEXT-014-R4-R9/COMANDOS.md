# Comandos y procedencia R4-R9

Código 09c9ce276c9c328026de4236dadf0a85d8e94d21; Windows Node 24.15.0, pnpm12.3.4, SQLite3.51.3 FTS5. GitHub fetch_commit confirmó SHA exacto. git fetch origin feat/qap-vnext-architecture obtuvo ese objeto. create_worktree gestionado falló Not a git repository porque el chat apunta a carpeta contenedora; se usó git worktree add --detach C:/Users/Judirico/Documents/QAMCP/audit-r4-r9 09c9ce276c9c328026de4236dadf0a85d8e94d21. git rev-parse HEAD lo confirmó. Checkout original en ed2955ff91a6506a80e3ff0e4bb9322cf9eed226 intacto.

Documentos consultados: AGENTS.md, STATE.md, backlog, 014E_R4_R9_CONSISTENCY_FENCE.md, seis informes completos R4-R8 y referencias de aceptación/harness R4-R7. Habilidad qap-v3-architect leída como contexto de dominio; el alcance auditado es vNext del SHA indicado.

## Preparación

- Fetch en sandbox falló getaddrinfo; fetch autorizado con red PASS.
- pnpm install --frozen-lockfile --offline falló por metadata ausente; pnpm install --frozen-lockfile autorizado PASS, 448 paquetes reutilizados, 0 cambios lockfile.
- pnpm build salida0, diez paquetes; binarios MCP/CLI presentes.
- Matriz con TEMP/TMP=node_modules/.tmp-vnext, un worker y autorización de red local/procesos para fixtures Chromium. No se instalaron credenciales, clientes MCP ni sesiones.
- Stdio usa arnés estricto R4-R7 extraído en prepare.mjs: targetPath absoluto, cwd separado para servidor y CLI, assert18, init success, status ONBOARDING. La prueba no certifica flujo canónico completo.

## Matriz ejecutada

```powershell
$ErrorActionPreference='Continue'
$env:TEMP = Join-Path (Get-Location) 'node_modules/.tmp-vnext'
$env:TMP=$env:TEMP
New-Item -ItemType Directory -Force $env:TEMP | Out-Null
function Run-Audit($label,$argsList) {
 & pnpm @argsList *> "../r4-r9-evidence/$label.log"
 "$label=$LASTEXITCODE" | Add-Content ../r4-r9-evidence/exits.txt
}
Run-Audit focus @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/canonical-coverage.test.ts','-t','R4-R9-A02','--maxWorkers=1','--reporter=verbose')
Run-Audit r8 @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/canonical-coverage.test.ts','-t','R4-R8-A01','--maxWorkers=1','--reporter=verbose')
Run-Audit coverage @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/canonical-coverage.test.ts','--maxWorkers=1','--reporter=verbose')
Run-Audit interview @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/canonical-interview.test.ts','--maxWorkers=1','--reporter=verbose')
Run-Audit discovery @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/discovery-handler.test.ts','--maxWorkers=1','--reporter=verbose')
Run-Audit mcp @('--filter','@qap/mcp','exec','vitest','run','--maxWorkers=1','--reporter=verbose','--reporter=json','--outputFile.json=../../../r4-r9-evidence/mcp.json')
Run-Audit runner @('--filter','@qap/playwright-runner','exec','vitest','run','--maxWorkers=1','--reporter=verbose')
Run-Audit lint-focus @('exec','eslint','packages/engine/src/knowledge-store.port.ts','packages/knowledge/src/storage/sqlite-knowledge-adapter.ts','packages/mcp/src/handlers/canonical-closure-service.ts','packages/mcp/src/handlers/canonical-coverage-service.ts','packages/mcp/src/__tests__/canonical-coverage.test.ts','--format=json','--output-file=../r4-r9-evidence/lint-focus.json')
Run-Audit lint @('exec','eslint','.','--format=json','--output-file=../r4-r9-evidence/lint.json')
Get-Content ../r4-r9-evidence/exits.txt
```


Los JSON/reporters son evidencia externa, no se incorporan a fuentes. Además se invocó node node_modules/eslint/bin/eslint.js . --format=json --output-file=../r4-r9-evidence/lint.json para completar lint global; detalle de salida en LINT.md. Lint baseline usa el worktree documental R4-R8 con fuentes idénticas a 44c69f; no se incorporó ese código al auditado. Sin --fix ni cambios de config.

## Extractos de ejecución

### focus

```text
↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R8-A01: deferred non-applicability review retains request identity and persists actual host decision time
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R8-A01: stale approval cannot authorize changed reason or canonical requirement revision
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R8-A01: host approval is rejected if knowledge mutates while awaiting the gateway
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R9-A02: writing a requirement after final validation cannot persist an obsolete approval 1313ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R9-A02: both close and waive reject concurrent Knowledge writes before durable commit 2596ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R9-A02: missing fencing capability blocks even valid host decisions 73ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R9-A02: delayed fence acquisition does not consume an expired decision 495ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R9-A02: an updated pending requirement changes the coverage digest 83ms
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 4: Two concurrent closures cleanly serialize and prevent double consumption of decision
 Test Files  1 passed (1)
      Tests  5 passed | 40 skipped (45)
   Duration  9.61s (transform 1.49s, setup 0ms, import 4.13s, tests 4.57s, environment 0ms)
```

### r8

```text
✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R8-A01: deferred non-applicability review retains request identity and persists actual host decision time 249ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R8-A01: stale approval cannot authorize changed reason or canonical requirement revision 106ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R8-A01: host approval is rejected if knowledge mutates while awaiting the gateway 94ms
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R9-A02: writing a requirement after final validation cannot persist an obsolete approval
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R9-A02: both close and waive reject concurrent Knowledge writes before durable commit
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R9-A02: missing fencing capability blocks even valid host decisions
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R9-A02: delayed fence acquisition does not consume an expired decision
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R9-A02: an updated pending requirement changes the coverage digest
 ↓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 4: Two concurrent closures cleanly serialize and prevent double consumption of decision
 Test Files  1 passed (1)
      Tests  3 passed | 42 skipped (45)
   Duration  4.75s (transform 1.43s, setup 0ms, import 3.86s, tests 454ms, environment 0ms)
```

### coverage

```text
✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R8-A01: deferred non-applicability review retains request identity and persists actual host decision time 169ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R8-A01: stale approval cannot authorize changed reason or canonical requirement revision 128ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R8-A01: host approval is rejected if knowledge mutates while awaiting the gateway 101ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R9-A02: writing a requirement after final validation cannot persist an obsolete approval 1270ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R9-A02: both close and waive reject concurrent Knowledge writes before durable commit 2564ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R9-A02: missing fencing capability blocks even valid host decisions 84ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R9-A02: delayed fence acquisition does not consume an expired decision 516ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R9-A02: an updated pending requirement changes the coverage digest 89ms
 × src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 4: Two concurrent closures cleanly serialize and prevent double consumption of decision 1338ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯
 FAIL  src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 4: Two concurrent closures cleanly serialize and prevent double consumption of decision
 Test Files  1 failed (1)
      Tests  1 failed | 44 passed (45)
   Duration  15.99s (transform 1.21s, setup 0ms, import 3.16s, tests 12.26s, environment 0ms)
```

### interview

```text
Test Files  1 passed (1)
      Tests  44 passed (44)
   Duration  9.94s (transform 1.22s, setup 0ms, import 3.40s, tests 6.06s, environment 0ms)
```

### discovery

```text
Test Files  1 passed (1)
      Tests  59 passed (59)
   Duration  35.88s (transform 1.34s, setup 0ms, import 3.15s, tests 32.26s, environment 0ms)
```

### mcp

```text
✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R8-A01: deferred non-applicability review retains request identity and persists actual host decision time 141ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R8-A01: stale approval cannot authorize changed reason or canonical requirement revision 101ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R8-A01: host approval is rejected if knowledge mutates while awaiting the gateway 75ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R9-A02: writing a requirement after final validation cannot persist an obsolete approval 1232ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R9-A02: both close and waive reject concurrent Knowledge writes before durable commit 2490ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R9-A02: missing fencing capability blocks even valid host decisions 66ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R9-A02: delayed fence acquisition does not consume an expired decision 504ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R9-A02: an updated pending requirement changes the coverage digest 59ms
 × src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 4: Two concurrent closures cleanly serialize and prevent double consumption of decision 1305ms
 ✓ src/__tests__/test-handler.test.ts > TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) > Scenario 4: in-memory snapshot prevents TOCTOU tampering of YAML files after verification (R4.4) 1017ms
⎯⎯⎯⎯⎯⎯ Failed Tests 64 ⎯⎯⎯⎯⎯⎯⎯
 FAIL  src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 4: Two concurrent closures cleanly serialize and prevent double consumption of decision
 Test Files  9 failed | 14 passed (23)
      Tests  64 failed | 406 passed (470)
   Duration  252.97s (transform 3.05s, setup 0ms, import 47.86s, tests 191.95s, environment 5ms)
```

### runner

```text
Test Files  10 passed (10)
      Tests  71 passed (71)
   Duration  28.35s (transform 954ms, setup 0ms, import 11.11s, tests 11.15s, environment 2ms)
```


### Stdio

```text
[QAP MCP Server] Servidor iniciado correctamente en transporte Stdio.
{"transport":"server","tools":["qap_auth_add","qap_auth_list","qap_clean","qap_context_ingest","qap_context_set","qap_discover","qap_init","qap_module_close","qap_plan","qap_prune","qap_report","qap_rules_set","qap_server","qap_session_close","qap_session_plan","qap_status","qap_test","qap_validate"],"init":"success","phase":"ONBOARDING","targetPathExplicit":true}
[QAP MCP Server] Servidor iniciado correctamente en transporte Stdio.
{"transport":"cli","tools":["qap_auth_add","qap_auth_list","qap_clean","qap_context_ingest","qap_context_set","qap_discover","qap_init","qap_module_close","qap_plan","qap_prune","qap_report","qap_rules_set","qap_server","qap_session_close","qap_session_plan","qap_status","qap_test","qap_validate"],"init":"success","phase":"ONBOARDING","targetPathExplicit":true}
SERVIDOR MCP FUNCIONANDO AL 100% SOBRE STDIO
```


## Integridad y publicación

Lockfile Git blob físico/HEAD: a9bd8de7f6ac38db1ad4ae6582c4539b351225c8. Sesión protegida del checkout original: 28e1b8dbec7ccf194440cc4158ec6072c9b9ade4, igual al registro previo; worktree exacto: 429bbf6d57a1d798231b4204d52069b4077703de. No se leyó contenido ni se usó la sesión. git diff --exit-code HEAD -- packages pnpm-lock.yaml antes de documentación salió0; estado limpio. Sondas/bundles solo externos o node_modules; nunca agregados a Git.

Primer intento de probe esperaba CONFLICT del writer normal: SQLite busy se sanitiza como UNAVAILABLE; se corrigió solo arnés. accept_gaps de brecha real bloqueó antes del gateway; se documentó y para instrumentar su rama se usó explícitamente ID inexistente, sin afirmar aceptación válida. Hard-exit inicial usó una Promise sin handles y Node salió naturalmente: se corrigió el arnés con un handle vivo y se repitió, verificando bloqueo antes de kill y release después. No se cambiaron producto/tests para obtener resultados.

Procedimiento de publicación autorizado: git diff --check; verificar staged solo los seis .md y STATE/backlog/014E; git commit documental; git push origin HEAD:refs/heads/feat/qap-vnext-architecture sin force, verificando el SHA remoto y que su padre es 09c9ce276c9c328026de4236dadf0a85d8e94d21. Si el remoto avanzara, detener publicación y registrar divergencia sin incorporar fuentes nuevas. El commit no puede incluir su propio SHA; resolver git log del informe y contrastar remoto.

## Huellas de evidencia bruta local

SHA-256 de las salidas completas usadas para los diferenciales; los arneses y extractos relevantes quedan publicados en estos seis informes. Los JSON brutos conservan rutas locales y no se presentan como fuentes de otro SHA.

| Artefacto | SHA-256 |
| --- | --- |
| mcp.json | 859c25a96b1b60bdadb048e8f3ec55a1a97f4d5256b6c5dd3cfb15cad87b1c90 |
| lint.json | f24d2855f7058e8a30490cb7979d4865cee3b020293686bdad28edc4c5a86058 |
| lint-focus.json | 03902459cbe2a4dc617bd50cad4debdf87edb35a63730c6a44adbee2ed1fd416 |
| lint-baseline.json | 53d09c8fe3d3843b4d9c6dcc0b712a5bb1a067ad98bf7bef3c6735fca1ea3909 |
| probe.log | 34247bb78e18260343d4c749b209112880b2578e8014ef5e1a3ebc44cd1eac4f |
| extra.log | 3f91b07d1e75d82bd1b12a718a310553bb98bffc2a8873eb3740fe5acb75efc3 |
| relative.log | cd3fdc4b6916018e6bec8f1ee67552715a7006da09238c84820ac3e96e83bff7 |
| history.log | 0e31fdf174a2bb5b299fdd641a202d3f4c06bcb2f231809014c89c6b5b5acaec |
| competition.log | 8ee9d6933cbc627c9cb4600b29d75d8f03a0e063b29b44569acb9dad1c2a3dcf |
| memory.log | 1c54186053af656e495f6550555f10a0dc2bf58a679053315b09306e39383adc |
| stdio.log | 6b22a7bf3068eaea99eb947948e3cb36b74ff3a3103d78af1218450f6bd85568 |
