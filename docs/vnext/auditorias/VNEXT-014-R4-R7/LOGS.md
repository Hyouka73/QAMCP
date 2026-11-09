# Logs saneados R4-R7

Código auditado ea75eb2c52266b174e6d24917c1b089d56834900. Raíces personales reemplazadas por marcadores. Resultados de producto en fixtures sintéticos; no bases ni claves publicadas. Foco, cobertura, discovery y runner completos; MCP conserva todo el verbose y errores de ejecución.

## install

```text
Scope: all 11 workspace projects
Lockfile is up to date, resolution step is skipped
Progress: resolved 1, reused 0, downloaded 0, added 0
Packages: +448
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 448, reused 186, downloaded 0, added 0
Progress: resolved 448, reused 446, downloaded 0, added 11
Progress: resolved 448, reused 448, downloaded 0, added 169
Progress: resolved 448, reused 448, downloaded 0, added 187
Progress: resolved 448, reused 448, downloaded 0, added 271
Progress: resolved 448, reused 448, downloaded 0, added 348
Progress: resolved 448, reused 448, downloaded 0, added 444
Progress: resolved 448, reused 448, downloaded 0, added 447
Progress: resolved 448, reused 448, downloaded 0, added 448, done
[WARN] Failed to create bin at <WORKTREE>\packages\cli\node_modules\.bin\qap-mcp. ENOENT: no such file or directory, stat '<WORKTREE>\packages\mcp\dist\server.js.EXE'

dependencies:
+ playwright-core 1.63.0

devDependencies:
+ @eslint/js 10.0.1
+ @modelcontextprotocol/sdk 1.30.1
+ @typescript-eslint/eslint-plugin 8.69.0
+ @typescript-eslint/parser 8.69.0
+ eslint 9.39.5
+ eslint-plugin-import 2.32.0
+ globals 17.12.0
+ tsup 8.5.1
+ typescript 5.5.4
+ typescript-eslint 8.69.0

[WARN] Failed to create bin at <WORKTREE>\packages\cli\node_modules\.bin\qap-mcp. ENOENT: no such file or directory, stat '<WORKTREE>\packages\cli\node_modules\@qap\mcp\dist\server.js.EXE'
Done in 11.2s using pnpm v11.3.0

```

## build

```text
$ pnpm run -r build
Scope: 10 of 11 workspace projects
packages/shared build$ tsup src/index.ts --format esm --dts
packages/shared build: CLI Building entry: src/index.ts
packages/shared build: CLI Using tsconfig: tsconfig.json
packages/shared build: CLI tsup v8.5.1
packages/shared build: CLI Using tsup config: <WORKTREE>\packages\shared\tsup.config.ts
packages/shared build: CLI Target: es2022
packages/shared build: ESM Build start
packages/shared build: ESM dist\index.js 127.05 KB
packages/shared build: ESM ⚡️ Build success in 278ms
packages/shared build: DTS Build start
packages/shared build: DTS ⚡️ Build success in 2962ms
packages/shared build: DTS dist\index.d.ts 218.05 KB
packages/shared build: Done
packages/engine build$ tsup src/index.ts --format esm --dts
packages/auth build$ tsup src/index.ts --format esm --dts
packages/engine build: CLI Building entry: src/index.ts
packages/engine build: CLI Using tsconfig: tsconfig.json
packages/engine build: CLI tsup v8.5.1
packages/engine build: CLI Using tsup config: <WORKTREE>\packages\engine\tsup.config.ts
packages/auth build: CLI Building entry: src/index.ts
packages/auth build: CLI Using tsconfig: tsconfig.json
packages/auth build: CLI tsup v8.5.1
packages/auth build: CLI Using tsup config: <WORKTREE>\packages\auth\tsup.config.ts
packages/engine build: CLI Target: es2022
packages/engine build: ESM Build start
packages/auth build: CLI Target: es2022
packages/auth build: ESM Build start
packages/engine build: ESM dist\index.js 77.70 KB
packages/engine build: ESM ⚡️ Build success in 167ms
packages/auth build: ESM dist\index.js 24.74 KB
packages/auth build: ESM ⚡️ Build success in 179ms
packages/auth build: DTS Build start
packages/engine build: DTS Build start
packages/engine build: DTS ⚡️ Build success in 1413ms
packages/engine build: DTS dist\index.d.ts 44.73 KB
packages/engine build: Done
packages/auth build: DTS ⚡️ Build success in 2071ms
packages/auth build: DTS dist\index.d.ts 6.87 KB
packages/auth build: Done
packages/knowledge build$ tsup src/index.ts --format esm --dts
packages/playwright-adapter build$ tsup src/index.ts --format esm --dts
packages/knowledge build: CLI Building entry: src/index.ts
packages/knowledge build: CLI Using tsconfig: tsconfig.json
packages/knowledge build: CLI tsup v8.5.1
packages/knowledge build: CLI Using tsup config: <WORKTREE>\packages\knowledge\tsup.config.ts
packages/knowledge build: CLI Target: es2022
packages/knowledge build: ESM Build start
packages/playwright-adapter build: CLI Building entry: src/index.ts
packages/playwright-adapter build: CLI Using tsconfig: tsconfig.json
packages/playwright-adapter build: CLI tsup v8.5.1
packages/playwright-adapter build: CLI Using tsup config: <WORKTREE>\packages\playwright-adapter\tsup.config.ts
packages/playwright-adapter build: CLI Target: es2022
packages/playwright-adapter build: ESM Build start
packages/playwright-adapter build: ESM dist\index.js 121.39 KB
packages/playwright-adapter build: ESM ⚡️ Build success in 352ms
packages/knowledge build: ESM dist\index.js 152.25 KB
packages/knowledge build: ESM ⚡️ Build success in 411ms
packages/knowledge build: DTS Build start
packages/playwright-adapter build: DTS Build start
packages/knowledge build: DTS ⚡️ Build success in 3610ms
packages/knowledge build: DTS dist\index.d.ts 32.38 KB
packages/knowledge build: Done
packages/playwright-adapter build: DTS ⚡️ Build success in 4147ms
packages/playwright-adapter build: DTS dist\index.d.ts 23.82 KB
packages/playwright-adapter build: Done
packages/git-adapter build$ tsup src/index.ts --format esm --dts
packages/playwright-runner build$ tsup src/index.ts --format esm --dts
packages/reporter build$ tsup src/index.ts --format esm --dts
packages/git-adapter build: CLI Building entry: src/index.ts
packages/reporter build: CLI Building entry: src/index.ts
packages/git-adapter build: CLI Using tsconfig: tsconfig.json
packages/reporter build: CLI Using tsconfig: tsconfig.json
packages/git-adapter build: CLI tsup v8.5.1
packages/git-adapter build: CLI Using tsup config: <WORKTREE>\packages\git-adapter\tsup.config.ts
packages/reporter build: CLI tsup v8.5.1
packages/reporter build: CLI Using tsup config: <WORKTREE>\packages\reporter\tsup.config.ts
packages/git-adapter build: CLI Target: es2022
packages/reporter build: CLI Target: es2022
packages/git-adapter build: ESM Build start
packages/reporter build: ESM Build start
packages/playwright-runner build: CLI Building entry: src/index.ts
packages/playwright-runner build: CLI Using tsconfig: tsconfig.json
packages/playwright-runner build: CLI tsup v8.5.1
packages/playwright-runner build: CLI Using tsup config: <WORKTREE>\packages\playwright-runner\tsup.config.ts
packages/playwright-runner build: CLI Target: es2022
packages/playwright-runner build: ESM Build start
packages/git-adapter build: ESM dist\index.js 2.03 KB
packages/git-adapter build: ESM ⚡️ Build success in 176ms
packages/reporter build: ESM dist\index.js 68.42 KB
packages/reporter build: ESM ⚡️ Build success in 269ms
packages/playwright-runner build: ESM dist\index.js 28.21 KB
packages/playwright-runner build: ESM ⚡️ Build success in 258ms
packages/git-adapter build: DTS Build start
packages/reporter build: DTS Build start
packages/playwright-runner build: DTS Build start
packages/git-adapter build: DTS ⚡️ Build success in 1782ms
packages/git-adapter build: DTS dist\index.d.ts 883.00 B
packages/git-adapter build: Done
packages/reporter build: DTS ⚡️ Build success in 2528ms
packages/reporter build: DTS dist\index.d.ts 18.02 KB
packages/reporter build: Done
packages/playwright-runner build: DTS ⚡️ Build success in 2873ms
packages/playwright-runner build: DTS dist\index.d.ts 4.34 KB
packages/playwright-runner build: Done
packages/mcp build$ tsup
packages/mcp build: CLI Building entry: src/index.ts, src/server.ts
packages/mcp build: CLI Using tsconfig: tsconfig.json
packages/mcp build: CLI tsup v8.5.1
packages/mcp build: CLI Using tsup config: <WORKTREE>\packages\mcp\tsup.config.ts
packages/mcp build: CLI Target: node18
packages/mcp build: CLI Cleaning output folder
packages/mcp build: ESM Build start
packages/mcp build: ESM dist\index.js          5.46 KB
packages/mcp build: ESM dist\server.js         381.00 B
packages/mcp build: ESM dist\chunk-KIWZKSY6.js 401.32 KB
packages/mcp build: ESM ⚡️ Build success in 169ms
packages/mcp build: DTS Build start
packages/mcp build: DTS ⚡️ Build success in 5423ms
packages/mcp build: DTS dist\index.d.ts           1.50 KB
packages/mcp build: DTS dist\server.d.ts          342.00 B
packages/mcp build: DTS dist\server-NyU4UT9_.d.ts 26.20 KB
packages/mcp build: Done
packages/cli build$ tsup
packages/cli build: CLI Building entry: src/entrypoint.ts
packages/cli build: CLI Using tsconfig: tsconfig.json
packages/cli build: CLI tsup v8.5.1
packages/cli build: CLI Using tsup config: <WORKTREE>\packages\cli\tsup.config.ts
packages/cli build: CLI Target: node18
packages/cli build: ESM Build start
packages/cli build: ESM dist\dist-BWTFLGPF.js  803.00 B
packages/cli build: ESM dist\chunk-XENM7LAA.js 24.62 KB
packages/cli build: ESM dist\chunk-ULFAP6LY.js 120.98 KB
packages/cli build: ESM dist\dist-ZJOAX4TL.js  1.93 KB
packages/cli build: ESM dist\dist-N6S6AFVU.js  1.30 KB
packages/cli build: ESM dist\entrypoint.js     557.96 KB
packages/cli build: ESM dist\chunk-DJPMBNMO.js 281.51 KB
packages/cli build: ESM dist\chunk-5JLHNXWW.js 391.62 KB
packages/cli build: ESM dist\chunk-AOBXKQNP.js 1.97 KB
packages/cli build: ESM ⚡️ Build success in 378ms
packages/cli build: Done

```

## fts

```text
v24.22.1 [Object: null prototype] { sqlite: '3.53.4', body: 'audit' }

```

## chromium

```text
153.0.8010.12

```

## focus

```text

 RUN  v4.1.11 <WORKTREE>/packages/mcp

 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > R4-R6-I01: qap_status resumes a real pending canonical question without YAML, approval or state mutation
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > R4-R7-I01: proposal correction, independent host review and real canonical coverage 471ms
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > real MCP + host inbox + physical SQLite: present, propose, approve, persist, read status, retry, reopen
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks confirmation with gateway none and never reflects unsafe error text
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks confirmation with gateway throw and never reflects unsafe error text
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks confirmation with gateway null and never reflects unsafe error text
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > MCP cannot forge authority with source
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > MCP cannot forge authority with status
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > MCP cannot forge authority with from_option
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > MCP cannot forge authority with verified_by
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > MCP cannot forge authority with trace
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > MCP cannot forge authority with gateway
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: expired
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: future
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: revoked
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: digest
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: statement
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: reviewer
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: approval
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: decision
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: long-expiry
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > host decision reject does not create a canonical requirement
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > host decision defer does not create a canonical requirement
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > correction invalidates exact-text approval, renews review, uses CAS and preserves physical history
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > pending version, idempotent draft retries, defer/resume, unknown questions and cross-module replies
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks unsafe context missing
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks unsafe context ambiguous
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks unsafe context inactive
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks unsafe context revision
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks unsafe context session
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks unsafe context foreign-project
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > context changes while host review runs: cannot commit approved old context
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > associated aggregate evidence, partial=false, never invents fields or trusts DOM instructions
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > associated aggregate evidence, partial=true, never invents fields or trusts DOM instructions
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > absence allows general business questions; unspecified formal category stays pending
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > separate SQLite connections CAS, rollback trigger, safe errors, no duplicate/orphan requirement
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > untrusted proposal is never reflected in questions, logs or SQLite without human authority
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > one approval cannot authorize another question, even when the host mistakenly reuses its ID
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > a second connection changing a requirement while the host reviews causes a CAS conflict
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > restart recovers confirmed records without duplicating them; pending drafts require fresh review
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > approval for another project cannot confirm even with the same module, question category and statement
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > HTML required, HTTP 200, AgentInference and reviewed traces confer no requirement authority
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > physical approval receipt prevents reuse for another question after restarting the host
 ↓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > short free answers remain non-authoritative drafts and need a substantive corrected statement

 Test Files  1 passed (1)
      Tests  1 passed | 43 skipped (44)
   Start at  00:59:22
   Duration  3.39s (transform 750ms, setup 0ms, import 2.57s, tests 473ms, environment 0ms)


```

## interview

```text

 RUN  v4.1.11 <WORKTREE>/packages/mcp

 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > R4-R6-I01: qap_status resumes a real pending canonical question without YAML, approval or state mutation 379ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > R4-R7-I01: proposal correction, independent host review and real canonical coverage 368ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > real MCP + host inbox + physical SQLite: present, propose, approve, persist, read status, retry, reopen 331ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks confirmation with gateway none and never reflects unsafe error text 47ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks confirmation with gateway throw and never reflects unsafe error text 48ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks confirmation with gateway null and never reflects unsafe error text 51ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > MCP cannot forge authority with source 52ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > MCP cannot forge authority with status 69ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > MCP cannot forge authority with from_option 77ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > MCP cannot forge authority with verified_by 64ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > MCP cannot forge authority with trace 59ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > MCP cannot forge authority with gateway 64ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: expired 38ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: future 33ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: revoked 30ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: digest 31ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: statement 31ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: reviewer 30ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: approval 31ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: decision 28ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: long-expiry 31ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > host decision reject does not create a canonical requirement 30ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > host decision defer does not create a canonical requirement 31ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > correction invalidates exact-text approval, renews review, uses CAS and preserves physical history 58ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > pending version, idempotent draft retries, defer/resume, unknown questions and cross-module replies 41ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks unsafe context missing 28ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks unsafe context ambiguous 25ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks unsafe context inactive 29ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks unsafe context revision 27ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks unsafe context session 36ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks unsafe context foreign-project 52ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > context changes while host review runs: cannot commit approved old context 32ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > associated aggregate evidence, partial=false, never invents fields or trusts DOM instructions 162ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > associated aggregate evidence, partial=true, never invents fields or trusts DOM instructions 100ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > absence allows general business questions; unspecified formal category stays pending 32ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > separate SQLite connections CAS, rollback trigger, safe errors, no duplicate/orphan requirement 88ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > untrusted proposal is never reflected in questions, logs or SQLite without human authority 70ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > one approval cannot authorize another question, even when the host mistakenly reuses its ID 46ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > a second connection changing a requirement while the host reviews causes a CAS conflict 67ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > restart recovers confirmed records without duplicating them; pending drafts require fresh review 43ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > approval for another project cannot confirm even with the same module, question category and statement 60ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > HTML required, HTTP 200, AgentInference and reviewed traces confer no requirement authority 111ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > physical approval receipt prevents reuse for another question after restarting the host 46ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > short free answers remain non-authoritative drafts and need a substantive corrected statement 44ms

 Test Files  1 passed (1)
      Tests  44 passed (44)
   Start at  00:59:26
   Duration  6.41s (transform 749ms, setup 0ms, import 2.98s, tests 3.15s, environment 0ms)


```

## coverage

```text

 RUN  v4.1.11 <WORKTREE>/packages/mcp

 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 1: Canonical Coverage & Epistemic Boundaries (R1) > blocks evaluation when module is unbound or lifecycle context has drifted 72ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 1: Canonical Coverage & Epistemic Boundaries (R1) > zero coverage from crawler observations or DOM elements alone 44ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 1: Canonical Coverage & Epistemic Boundaries (R1) > strictly enforces Invariant D-011 and R1: excludes observational requirements from confirmed coverage 43ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 1: Canonical Coverage & Epistemic Boundaries (R1) > tripartite coverage separation: execution coverage is strictly not_executed with 0 passed 41ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 2: Reproducible Gap Inventory & Non-Applicability (R2) > identifies reproducible gaps with stable IDs and formal absence types 35ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 2: Reproducible Gap Inventory & Non-Applicability (R2) > declares categories non-applicable and satisfies category status without category waivers (Amendment 6) 37ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 2: Reproducible Gap Inventory & Non-Applicability (R2) > enforces Amendment 5: accepted gaps bind receipt and transition to status accepted 36ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > blocks closure when host gateway is absent or returns null (pending) 70ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > rejects decisions with invalid request digest or expired authorization 62ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > blocks client injection of authorization fields (approvalId / signature) on MCP wire 38ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 4: Durable Persistence & Concurrency (R4) > SqliteModuleClosureStore encrypts all data with AES-256-GCM without plaintext leaks 70ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 4: Durable Persistence & Concurrency (R4) > Amendment 3: Persists relation receipt in IKnowledgeStore with ZERO module.revision mutation 61ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 4: Durable Persistence & Concurrency (R4) > zero SQLite locks held during asynchronous host review gateway evaluation 264ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > qap_module_close routes canonical_closure cleanly through MCP SDK client 75ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > enforces Amendment 4: blocks canonical module called without canonical_closure 46ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > qap_session_close blocks transition to WRAP_UP when canonical modules remain unclosed 49ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R3: inconsistent durable closure 'short reason' cannot create receipt or reach WRAP_UP 158ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R3: inconsistent durable closure 'blank reason' cannot create receipt or reach WRAP_UP 135ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R3: inconsistent durable closure 'missing approval' cannot create receipt or reach WRAP_UP 117ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R3: inconsistent durable closure 'mismatched approval digest' cannot create receipt or reach WRAP_UP 122ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R3: inconsistent durable closure 'duplicated approval' cannot create receipt or reach WRAP_UP 136ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R3: inconsistent durable closure 'closed without approval' cannot create receipt or reach WRAP_UP 149ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R3: inconsistent durable closure 'already waived without approval' cannot create receipt or reach WRAP_UP 137ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R5-A02: 16 bound modules, last invalid=false, preview stays capped but guidance checks all 202ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R5-A02: 17 bound modules, last invalid=false, preview stays capped but guidance checks all 203ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R5-A02: 17 bound modules, last invalid=true, preview stays capped but guidance checks all 220ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R4-A01 positive: a legitimately authorized durable waiver still recommends session close 129ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R2-A01: first session close uses recovered waiver metadata for the gate and physical report 99ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > qap_status reports honest canonical coverage and closure indicators without false 100% 121ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 6: Historical Regressions & Defensive Invariants (R01–R60) > R02 / R60: Re-evaluating coverage is strictly read-only and never implicitly advances lifecycle 40ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 6: Historical Regressions & Defensive Invariants (R01–R60) > R03: Canonical closure route catches errors cleanly and operates on SQLite/host gateway without ENOENT 54ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 6: Historical Regressions & Defensive Invariants (R01–R60) > R11 / R27 / R31: Closing with gaps requires substantive justifications and formal host decisions 49ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 6: Historical Regressions & Defensive Invariants (R01–R60) > Security Invariant: Protected file packages/playwright-runner/.qa/cache/sessions/admin-user.json is never inspected or touched 0ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 1: Crash before persisting decision leaves storage completely clean and recoverable 127ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 2: Crash after closureStore commits decision but before IKnowledgeStore or lifecycle.json updates recovers via self-healing reconciler 63ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 3: Crash after IKnowledgeStore receipt commit returns idempotent response on retry 74ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 4: Two concurrent closures cleanly serialize and prevent double consumption of decision 106ms

 Test Files  1 passed (1)
      Tests  37 passed (37)
   Start at  00:59:34
   Duration  6.57s (transform 710ms, setup 0ms, import 2.78s, tests 3.48s, environment 0ms)


```

## discovery

```text

 RUN  v4.1.11 <WORKTREE>/packages/mcp

 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > R3: unauthorized disposable root is a scoped block, not a fabricated browser outage 27ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > R1: onboarding to anonymous discovery preserves planned state and explicitly blocks the legacy interview 1960ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > R1: stale observed state cannot manufacture rules or close a module without view context 122ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > R1: stale consolidated state cannot manufacture rules or close a module without view context 96ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > R1: existing reviewed legacy context still accepts rules without promoting agent text or canonical observations 96ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > R1: explicit waiver remains an honest exit without claiming discovery or test coverage 40ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > owns exactly one route, preserves order, rejects collisions, and never falls back 41ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > navigates a real MPA, returns actual counts, commits once and reopens physical SQLite 869ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > keeps project bindings and physical stores isolated between server instances 1685ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > distinguishes static completion from a script dependent shell (false) 690ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > distinguishes static completion from a script dependent shell (true) 757ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks credentials without navigation or credential reflection 28ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks profile without navigation or credential reflection 29ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks profileId without navigation or credential reflection 27ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks storageState without navigation or credential reflection 25ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks cookies without navigation or credential reflection 25ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks session without navigation or credential reflection 24ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks auth without navigation or credential reflection 29ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target /unknown 40ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target //127.0.0.1/ 36ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target /a/../ 36ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target /%2e/ 38ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target /?token=secret 36ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target /#fragment 37ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target http://user:secret@127.0.0.1/ 37ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target /a\b 37ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target  / 40ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > retains phase gate ONBOARDING without lifecycle writes 46ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > retains phase gate SCOPING without lifecycle writes 51ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > retains phase gate WRAP_UP without lifecycle writes 44ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks missing binding, stale authorization and incompatible environment 66ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > requires explicit read-only host acknowledgement and rejects authenticated plans/terminal modules 92ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > keeps host configuration isolated from later caller mutations 753ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects an already cancelled dispatcher invocation before crawler start 24ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > propagates in-flight dispatcher cancellation to transport and waits for cleanup 618ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > sanitizes host failures and emits no secret-bearing console logs 35ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > delegates page denial and budgets to the real crawler 730ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > delegates bytes denial and budgets to the real crawler 667ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > delegates browser denial and budgets to the real crawler 39ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > delegates redirect denial and budgets to the real crawler 644ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > delegates private denial and budgets to the real crawler 635ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > delegates dns denial and budgets to the real crawler 692ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > reports atomic persistence failure without fabricated persisted findings 847ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > R4: real crawler to canonical interview, independent review, secure waiver and WRAP_UP through MCP 1197ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: missing 26ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: wrong-id 28ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: wrong-key 24ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: inactive 26ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: ambiguous 26ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: application 23ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: environment 24ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: revision 26ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: unplanned 30ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: id-key-conflict 34ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > persists real MCP/Chrome/MPA associations, reopens SQLite, projects status, and preserves epistemic planes 1026ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > recovers after physical association rollback without reacquisition or history changes; rejects shortened and mixed receipts 2219ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > two physical connections race with CAS; retry is idempotent and context changes block recovery 991ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > isolates same planned names across physical projects and rejects another project receipt 51ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > detects context changed at the edge commit boundary without deleting already acquired facts 864ms

 Test Files  1 passed (1)
      Tests  59 passed (59)
   Start at  00:59:42
   Duration  22.62s (transform 742ms, setup 0ms, import 2.80s, tests 19.51s, environment 0ms)


```

## lint-focus

```text

<WORKTREE>\packages\mcp\src\handlers\canonical-coverage-service.ts
  132:21  error  This assertion is unnecessary since it does not change the type of the expression  @typescript-eslint/no-unnecessary-type-assertion
  179:15  error  This assertion is unnecessary since it does not change the type of the expression  @typescript-eslint/no-unnecessary-type-assertion
  182:15  error  This assertion is unnecessary since it does not change the type of the expression  @typescript-eslint/no-unnecessary-type-assertion
  230:25  error  This assertion is unnecessary since it does not change the type of the expression  @typescript-eslint/no-unnecessary-type-assertion
  253:23  error  This assertion is unnecessary since it does not change the type of the expression  @typescript-eslint/no-unnecessary-type-assertion

✖ 5 problems (5 errors, 0 warnings)
  5 errors and 0 warnings potentially fixable with the `--fix` option.

undefined
<WORKTREE>\packages\mcp:
[ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL] Command failed with exit code 1: eslint src/__tests__/canonical-interview.test.ts src/handlers/status.handler.ts src/handlers/canonical-interview-service.ts src/handlers/canonical-coverage-service.ts

```

## mcp

```text

 RUN  v4.1.11 <WORKTREE>/packages/mcp

 ✓ src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > debe registrar y exponer la suite completa de 15 tools y prompts 13ms
 ✓ src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > debe ejecutar qap_init y crear el arbol .qa/ 54ms
 ✓ src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > debe validar y mostrar estado con directivas UX en qap_status 211ms
 × src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > debe descubrir modulos y responder en desarrollo para qap_plan y qap_test 221ms
   → expected true to be falsy
 ✓ src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > debe registrar un perfil de autenticacion con qap_auth_add y listar con qap_auth_list 50ms
 ✓ src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > debe generar reportes con qap_report y limpiar con qap_clean 252ms
stderr | src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > debe operar sobre targetPath independiente de cwd y validar qap_server
[QAP Knowledge Graph] Servidor interactivo iniciado en: http://localhost:9555
[QAP Knowledge Graph] Base de conocimiento servida desde: <FIXTURE_TEMP>

 ✓ src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > debe operar sobre targetPath independiente de cwd y validar qap_server 175ms
 ✓ src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > debe ser idempotente en qap_init sin alterar context.yaml ni environments.yaml en segunda ejecución (Criterio 3) 59ms
 × src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > el contexto de vista generado por qap_discover debe validar contra module-view.schema.json (Criterio 4) 219ms
   → expected true to be falsy
 × src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > qap_discover con contexto de vista inválido no debe escribir archivos y debe retornar error (Criterio 4) 207ms
   → expected 'blocked' to be 'error' // Object.is equality
 × src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > E0a: qap_discover valida contra module-view.schema.json en camino de fallo de Playwright 237ms
   → expected true to be falsy
 × src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > E0b: qap_discover valida contra module-view.schema.json en vista de autenticacion con session_saved true 219ms
   → expected true to be falsy
 × src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > E0c: qap_discover valida contra module-view.schema.json en vista con routes_found vacio 246ms
   → expected true to be falsy
 ✓ src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > qap_context_set: merge parcial, no-downgrade de user, faltantes, transicion automatica con session.id y history 556ms
 ✓ src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > qap_context_set: dos llamadas concurrentes no pierden actualizaciones 285ms
 ✓ src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > qap_context_ingest: ingesta desde docPath y docContent, persistencia inferred, nunca avanza fase, rechazo de seguridad 264ms
 ✓ src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > qap_session_plan: SCOPING define plan y auth, transiciona a WORKING, rechazo atomico, ampliacion en WORKING, bloqueada en ONBOARDING 211ms
 × src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > qap_discover: gating por fase y estado de modulo, actualizacion planned -> observed 45ms
   → expected undefined to be 'ONBOARDING' // Object.is equality
 × src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > Criterio 7: Proyecto legacy sin campos de negocio valida contra el schema y qap_status responde con fase WORKING derivada 137ms
   → expected 'blocked' to be 'success' // Object.is equality
 × src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > Criterio 8 (E2E): init -> status (entrevista) -> ingest -> context_set compuerta -> auto-SCOPING -> session_plan -> auto-WORKING -> discover 157ms
   → expected undefined to be 'ONBOARDING' // Object.is equality
 × src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > qap_rules_set: actualiza reglas, transiciona observed -> interviewing, recalcula cobertura y actualiza guidance 345ms
   → expected 'planned' to be 'observed' // Object.is equality
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 1: Epistemic Bypass Stress-Testing > 1.1: Rejects status confirmed when provenance is active_probe 2ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 1: Epistemic Bypass Stress-Testing > 1.2: Rejects status confirmed when provenance is crawler 0ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 1: Epistemic Bypass Stress-Testing > 1.3: Rejects status confirmed when provenance is network_intercept or observed_telemetry 0ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 1: Epistemic Bypass Stress-Testing > 1.4: Epistemic spoofing via source instead of provenance is caught 0ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 1: Epistemic Bypass Stress-Testing > 1.5: Invariant R1: legacy_manual_edit without verification_evidence cannot confirm 0ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 1: Epistemic Bypass Stress-Testing > 1.6: Knowledge store and coverage engine strictly prevent observational requirements from confirming 30ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 2: Wire Authorization Injection Stress-Testing > 2.1: Rejects all forbidden authorization keys in wire command arguments 1ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 2: Wire Authorization Injection Stress-Testing > 2.2: Rejects forbidden keys even when combined with waive or accept_gaps 1ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 2: Wire Authorization Injection Stress-Testing > 2.3: Rejects unexpected fields in canonical closure commands 0ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 2: Wire Authorization Injection Stress-Testing > 2.4: Substantive reason enforcement rejects non-substantive explanations (< 15 chars) 1ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 2: Wire Authorization Injection Stress-Testing > 2.5: Host gateway bypass rejection: closes block if gateway is missing 21ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 2: Wire Authorization Injection Stress-Testing > 2.6: Host gateway tampered digest rejection: blocks if decision digest does not match request digest 22ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 2: Wire Authorization Injection Stress-Testing > 2.7: Host gateway expired decision rejection: blocks if review decision timestamp expired 22ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 2: Wire Authorization Injection Stress-Testing > 2.7b: Host gateway malformed date parsing: blocks on NaN/invalid timestamp avoiding fail-open 23ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 2: Wire Authorization Injection Stress-Testing > 2.8: Host gateway rejected decision: blocks if reviewer rejects 23ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 3: Obsolete Revision Invalidation Stress-Testing > 3.1: Aborts and rolls back if module revision mutates during human review window 24ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 3: Obsolete Revision Invalidation Stress-Testing > 3.2: Aborts if module is deactivated during review 26ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 3: Obsolete Revision Invalidation Stress-Testing > 3.3: Prevents approvalId reuse across closure attempts 41ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 4: Dual-Store Crash Recovery Stress-Testing > 4.1: Recovers automatically without second human approval when process crashed after SQLite commit 35ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 4: Dual-Store Crash Recovery Stress-Testing > 4.2: Recovers waived module crash state accurately 42ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 4: Dual-Store Crash Recovery Stress-Testing > 4.3: Corrupt database or wrong AES key strictly rejects without RAM fallback 25ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 5: Legacy Closure Bypass Stress-Testing > 5.1: Legacy qap_module_close rejects canonical module with canonical_closure_required 50ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 5: Legacy Closure Bypass Stress-Testing > 5.2: Legacy qap_module_close waive also blocked for canonical modules 21ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 5: Legacy Closure Bypass Stress-Testing > 5.3: qap_session_close blocks advance to WRAP_UP when canonical module is unclosed 28ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 5: Legacy Closure Bypass Stress-Testing > 5.4: Canonical closure unlocks qap_session_close 95ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 6: False Execution Attestation Stress-Testing > 6.1: Invariant validator rejects execution_coverage status !== not_executed 1ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 6: False Execution Attestation Stress-Testing > 6.2: Rejects non-zero passed counts even if status is not_executed 1ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 6: False Execution Attestation Stress-Testing > 6.3: Invariant validator rejects individual category waiver (Amendment 6) 0ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 6: False Execution Attestation Stress-Testing > 6.4: CanonicalCoverageService evaluate strictly emits not_executed and 0 counts 31ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 7: CAS Concurrency Stress-Testing > 7.1: Physical SQLite concurrent transactions handle race conditions without history corruption 86ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 7: CAS Concurrency Stress-Testing > 7.2: CanonicalClosureService serializes closure and second attempt is idempotent: true 44ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 7: CAS Concurrency Stress-Testing > 7.3: Concurrent closure of distinct modules succeeds via bounded retry loop under SQLite CAS lock 106ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 7: CAS Concurrency Stress-Testing > 7.4: Simultaneous closure requests for same module with divergent gateway decisions persist exactly one closure and canonical receipt 129ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 7: CAS Concurrency Stress-Testing > 7.5: Rejects write error recovery if existing receipt has tampered provenance or mismatched entity 26ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > R3: unauthorized disposable root is a scoped block, not a fabricated browser outage 34ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > R1: onboarding to anonymous discovery preserves planned state and explicitly blocks the legacy interview 1631ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > R1: stale observed state cannot manufacture rules or close a module without view context 91ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > R1: stale consolidated state cannot manufacture rules or close a module without view context 110ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > R1: existing reviewed legacy context still accepts rules without promoting agent text or canonical observations 115ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > R1: explicit waiver remains an honest exit without claiming discovery or test coverage 60ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > owns exactly one route, preserves order, rejects collisions, and never falls back 60ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > navigates a real MPA, returns actual counts, commits once and reopens physical SQLite 1051ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > keeps project bindings and physical stores isolated between server instances 1555ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > distinguishes static completion from a script dependent shell (false) 696ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > distinguishes static completion from a script dependent shell (true) 686ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks credentials without navigation or credential reflection 26ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks profile without navigation or credential reflection 30ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks profileId without navigation or credential reflection 25ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks storageState without navigation or credential reflection 26ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks cookies without navigation or credential reflection 26ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks session without navigation or credential reflection 24ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks auth without navigation or credential reflection 28ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target /unknown 37ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target //127.0.0.1/ 35ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target /a/../ 35ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target /%2e/ 39ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target /?token=secret 36ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target /#fragment 36ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target http://user:secret@127.0.0.1/ 35ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target /a\b 31ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target  / 44ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > retains phase gate ONBOARDING without lifecycle writes 37ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > retains phase gate SCOPING without lifecycle writes 41ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > retains phase gate WRAP_UP without lifecycle writes 38ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks missing binding, stale authorization and incompatible environment 62ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > requires explicit read-only host acknowledgement and rejects authenticated plans/terminal modules 114ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > keeps host configuration isolated from later caller mutations 789ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects an already cancelled dispatcher invocation before crawler start 23ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > propagates in-flight dispatcher cancellation to transport and waits for cleanup 634ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > sanitizes host failures and emits no secret-bearing console logs 43ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > delegates page denial and budgets to the real crawler 715ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > delegates bytes denial and budgets to the real crawler 640ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > delegates browser denial and budgets to the real crawler 40ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > delegates redirect denial and budgets to the real crawler 680ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > delegates private denial and budgets to the real crawler 699ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > delegates dns denial and budgets to the real crawler 666ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > reports atomic persistence failure without fabricated persisted findings 882ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > R4: real crawler to canonical interview, independent review, secure waiver and WRAP_UP through MCP 1187ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: missing 24ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: wrong-id 33ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: wrong-key 26ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: inactive 31ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: ambiguous 28ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: application 22ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: environment 26ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: revision 26ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: unplanned 29ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: id-key-conflict 26ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > persists real MCP/Chrome/MPA associations, reopens SQLite, projects status, and preserves epistemic planes 982ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > recovers after physical association rollback without reacquisition or history changes; rejects shortened and mixed receipts 1630ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > two physical connections race with CAS; retry is idempotent and context changes block recovery 875ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > isolates same planned names across physical projects and rejects another project receipt 49ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > detects context changed at the edge commit boundary without deleting already acquired facts 867ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 1: Canonical Coverage & Epistemic Boundaries (R1) > blocks evaluation when module is unbound or lifecycle context has drifted 73ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 1: Canonical Coverage & Epistemic Boundaries (R1) > zero coverage from crawler observations or DOM elements alone 48ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 1: Canonical Coverage & Epistemic Boundaries (R1) > strictly enforces Invariant D-011 and R1: excludes observational requirements from confirmed coverage 47ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 1: Canonical Coverage & Epistemic Boundaries (R1) > tripartite coverage separation: execution coverage is strictly not_executed with 0 passed 39ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 2: Reproducible Gap Inventory & Non-Applicability (R2) > identifies reproducible gaps with stable IDs and formal absence types 36ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 2: Reproducible Gap Inventory & Non-Applicability (R2) > declares categories non-applicable and satisfies category status without category waivers (Amendment 6) 39ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 2: Reproducible Gap Inventory & Non-Applicability (R2) > enforces Amendment 5: accepted gaps bind receipt and transition to status accepted 38ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > blocks closure when host gateway is absent or returns null (pending) 83ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > rejects decisions with invalid request digest or expired authorization 57ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > blocks client injection of authorization fields (approvalId / signature) on MCP wire 41ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 4: Durable Persistence & Concurrency (R4) > SqliteModuleClosureStore encrypts all data with AES-256-GCM without plaintext leaks 67ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 4: Durable Persistence & Concurrency (R4) > Amendment 3: Persists relation receipt in IKnowledgeStore with ZERO module.revision mutation 63ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 4: Durable Persistence & Concurrency (R4) > zero SQLite locks held during asynchronous host review gateway evaluation 276ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > qap_module_close routes canonical_closure cleanly through MCP SDK client 88ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > enforces Amendment 4: blocks canonical module called without canonical_closure 36ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > qap_session_close blocks transition to WRAP_UP when canonical modules remain unclosed 43ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R3: inconsistent durable closure 'short reason' cannot create receipt or reach WRAP_UP 156ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R3: inconsistent durable closure 'blank reason' cannot create receipt or reach WRAP_UP 133ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R3: inconsistent durable closure 'missing approval' cannot create receipt or reach WRAP_UP 118ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R3: inconsistent durable closure 'mismatched approval digest' cannot create receipt or reach WRAP_UP 113ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R3: inconsistent durable closure 'duplicated approval' cannot create receipt or reach WRAP_UP 153ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R3: inconsistent durable closure 'closed without approval' cannot create receipt or reach WRAP_UP 115ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R3: inconsistent durable closure 'already waived without approval' cannot create receipt or reach WRAP_UP 174ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R5-A02: 16 bound modules, last invalid=false, preview stays capped but guidance checks all 221ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R5-A02: 17 bound modules, last invalid=false, preview stays capped but guidance checks all 210ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R5-A02: 17 bound modules, last invalid=true, preview stays capped but guidance checks all 217ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R4-A01 positive: a legitimately authorized durable waiver still recommends session close 130ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R2-A01: first session close uses recovered waiver metadata for the gate and physical report 108ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > qap_status reports honest canonical coverage and closure indicators without false 100% 110ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 6: Historical Regressions & Defensive Invariants (R01–R60) > R02 / R60: Re-evaluating coverage is strictly read-only and never implicitly advances lifecycle 38ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 6: Historical Regressions & Defensive Invariants (R01–R60) > R03: Canonical closure route catches errors cleanly and operates on SQLite/host gateway without ENOENT 47ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 6: Historical Regressions & Defensive Invariants (R01–R60) > R11 / R27 / R31: Closing with gaps requires substantive justifications and formal host decisions 32ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 6: Historical Regressions & Defensive Invariants (R01–R60) > Security Invariant: Protected file packages/playwright-runner/.qa/cache/sessions/admin-user.json is never inspected or touched 0ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 1: Crash before persisting decision leaves storage completely clean and recoverable 100ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 2: Crash after closureStore commits decision but before IKnowledgeStore or lifecycle.json updates recovers via self-healing reconciler 67ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 3: Crash after IKnowledgeStore receipt commit returns idempotent response on retry 81ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 4: Two concurrent closures cleanly serialize and prevent double consumption of decision 86ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > resolves correct topological DAG order respecting dependencies and persists plan.json 93ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > detects missing dependencies and returns structured error without crashing 36ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > detects duplicate case IDs across files and reports error before graph resolution 43ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > detects cyclic dependencies safely returning cycle information without unhandled crashes 43ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > returns explicit cases: [] when module directory has no test cases 31ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > returns explicit cases: [] when cases exist but lack executable steps 30ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > rejects invalid arguments (missing or malformed module) 1ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > rejects unauthorized external targetPath outside authorized projectRoots 13ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > rejects targetPath containing directory traversal escapes 6ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > rejects symlinks and junctions inside project directory 11ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > returns blocked status if target module is not registered in .qa/modules/ 12ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > identifies and preserves manually edited cases with UpdateGuard 45ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > integrates completely with createMcpServer, exposes exactly 18 tools and dispatches qap_plan cleanly 107ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > never synthesizes fake test cases or relies on fallback defaultPlan 38ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > detects modifications in YAML steps and dependencies post-plan generation (FAIL BEFORE / PASS AFTER) 133ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > enforces authorized write mode and rejects directories with hardlinks in .qa (FAIL BEFORE / PASS AFTER) 39ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > handles persistence write failure with sanitized error and no partial files (FAIL BEFORE / PASS AFTER) 40ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > classifies historical plans without cases_fingerprint as unverifiable without deleting them (FAIL BEFORE / PASS AFTER) 32ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > preserves manually edited test cases bit-for-bit on disk without modifying custom content (FAIL BEFORE / PASS AFTER) 42ms
 ✓ src/__tests__/plan-handler.test.ts > R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) > R1.1: rejects truncated or altered matrix.cases even when test cases on disk are intact (FAIL BEFORE / PASS AFTER) 78ms
 ✓ src/__tests__/plan-handler.test.ts > R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) > R1.2: rejects inverted DAG dependencies in matrix.cases (FAIL BEFORE / PASS AFTER) 104ms
 ✓ src/__tests__/plan-handler.test.ts > R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) > R1.3: accepts valid alternate topological orders without arbitrary positional rejection (FAIL BEFORE / PASS AFTER) 86ms
 ✓ src/__tests__/plan-handler.test.ts > R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) > R1.4: rejects environment mismatch between plan and requested environment (FAIL BEFORE / PASS AFTER) 55ms
 ✓ src/__tests__/plan-handler.test.ts > R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) > R1.5: rejects module mismatch when plan belongs to another module (FAIL BEFORE / PASS AFTER) 59ms
 ✓ src/__tests__/plan-handler.test.ts > R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) > R1.6: distinguishes corrupt JSON from missing plan and rejects missing matrix (FAIL BEFORE / PASS AFTER) 16ms
 ✓ src/__tests__/plan-handler.test.ts > R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) > R1.7: rejects unknown or incompatible fingerprint and schema versions (FAIL BEFORE / PASS AFTER) 117ms
 ✓ src/__tests__/plan-handler.test.ts > R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) > R1.8: rejects plan with missing cases_fingerprint_version (FAIL BEFORE / PASS AFTER) 75ms
 ✓ src/__tests__/plan-handler.test.ts > R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) > R1.9: rejects plan with missing checksum (FAIL BEFORE / PASS AFTER) 56ms
 ✓ src/__tests__/plan-handler.test.ts > R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) > R1.10: rejects plan with missing schema version (FAIL BEFORE / PASS AFTER) 69ms
 ✓ src/__tests__/plan-handler.test.ts > R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) > R1.11: handles listTestCases failure as unverifiable and never as success (FAIL BEFORE / PASS AFTER) 10ms
 ✓ src/__tests__/plan-handler.test.ts > R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) > R1.12: returns verified plan and cases snapshot for TOCTOU prevention (FAIL BEFORE / PASS AFTER) 56ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > R4-R6-I01: qap_status resumes a real pending canonical question without YAML, approval or state mutation 369ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > R4-R7-I01: proposal correction, independent host review and real canonical coverage 371ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > real MCP + host inbox + physical SQLite: present, propose, approve, persist, read status, retry, reopen 257ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks confirmation with gateway none and never reflects unsafe error text 47ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks confirmation with gateway throw and never reflects unsafe error text 51ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks confirmation with gateway null and never reflects unsafe error text 54ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > MCP cannot forge authority with source 57ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > MCP cannot forge authority with status 52ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > MCP cannot forge authority with from_option 51ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > MCP cannot forge authority with verified_by 51ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > MCP cannot forge authority with trace 50ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > MCP cannot forge authority with gateway 50ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: expired 30ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: future 29ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: revoked 33ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: digest 33ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: statement 30ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: reviewer 29ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: approval 28ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: decision 31ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: long-expiry 32ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > host decision reject does not create a canonical requirement 30ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > host decision defer does not create a canonical requirement 40ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > correction invalidates exact-text approval, renews review, uses CAS and preserves physical history 53ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > pending version, idempotent draft retries, defer/resume, unknown questions and cross-module replies 40ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks unsafe context missing 25ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks unsafe context ambiguous 25ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks unsafe context inactive 30ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks unsafe context revision 29ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks unsafe context session 28ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks unsafe context foreign-project 44ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > context changes while host review runs: cannot commit approved old context 30ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > associated aggregate evidence, partial=false, never invents fields or trusts DOM instructions 162ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > associated aggregate evidence, partial=true, never invents fields or trusts DOM instructions 107ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > absence allows general business questions; unspecified formal category stays pending 33ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > separate SQLite connections CAS, rollback trigger, safe errors, no duplicate/orphan requirement 94ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > untrusted proposal is never reflected in questions, logs or SQLite without human authority 70ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > one approval cannot authorize another question, even when the host mistakenly reuses its ID 43ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > a second connection changing a requirement while the host reviews causes a CAS conflict 82ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > restart recovers confirmed records without duplicating them; pending drafts require fresh review 47ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > approval for another project cannot confirm even with the same module, question category and statement 64ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > HTML required, HTTP 200, AgentInference and reviewed traces confer no requirement authority 110ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > physical approval receipt prevents reuse for another question after restarting the host 50ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > short free answers remain non-authoritative drafts and need a substantive corrected statement 32ms
 × src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C1: Clasificación honesta con adaptador real > C1-a: módulo de acceso pedido en login sin redirección NO se bloquea (page_kind login, success) 360ms
   → expected 'blocked' to be 'success' // Object.is equality
 × src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C1: Clasificación honesta con adaptador real > C1-b: ruta protegida con redirección HTTP 302 a /login detecta auth_wall determinista y bloquea 234ms
   → expected undefined to be 'auth_required' // Object.is equality
 × src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C1: Clasificación honesta con adaptador real > C1-c: ruta protegida con guard del lado del cliente detecta auth_wall con redirección al login 229ms
   → expected undefined to be 'auth_required' // Object.is equality
 ✓ src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C2: Formatos de pregunta de roles según roles declarados > C2-a: con 0 roles declarados genera formato abierta con ejemplo en el texto 32ms
 ✓ src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C2: Formatos de pregunta de roles según roles declarados > C2-b: con 1 rol declarado genera formato una_opcion con 2 opciones y seguimiento abierto 39ms
 ✓ src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C2: Formatos de pregunta de roles según roles declarados > C2-c: con 3 roles declarados genera formato multiple sin ninguna opción recomendada 34ms
 × src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C3: Integridad de categoría en from_option y regla de cobertura completa > C3-a: la categoría de from_option se toma siempre de la pregunta pendiente persistida 242ms
   → expected 'blocked' to be 'success' // Object.is equality
 × src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C3: Integridad de categoría en from_option y regla de cobertura completa > C3-b: si la petición declara una categoría distinta a la de la pregunta pendiente se rechaza con blocked 217ms
   → the given combination of arguments (undefined and string) is invalid for this assertion. You can use an array, a map, an object, a set, a string, or a weakset instead of a string
 ✓ src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C3: Integridad de categoría en from_option y regla de cobertura completa > C3-c: cobertura completa nunca es true mientras exista una categoría diferida (deferred no cubre) 40ms
 × src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C4: Flujo de respuestas cortas como borrador y propuesta de enunciado > C4-a: respuesta corta se guarda como borrador (status inferred, source user_text, borrador true) y no cubre 255ms
   → expected 'blocked' to be 'success' // Object.is equality
 × src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C4: Flujo de respuestas cortas como borrador y propuesta de enunciado > C4-b: derivación determinista en categoría actor que nombra roles emite Pregunta una_opcion directamente 262ms
   → expected 'blocked' to be 'success' // Object.is equality
 × src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C4: Flujo de respuestas cortas como borrador y propuesta de enunciado > C4-c: envío de propuesta_enunciado válida para un borrador emite Pregunta una_opcion con las 3 opciones 206ms
   → expected 'blocked' to be 'success' // Object.is equality
 × src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C4: Flujo de respuestas cortas como borrador y propuesta de enunciado > C4-d: resolver con "Es correcto" guarda regla confirmed user_confirmed con enunciado exacto y cubre 245ms
   → Cannot read properties of undefined (reading 'id')
 × src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C4: Flujo de respuestas cortas como borrador y propuesta de enunciado > C4-e: resolver con "Lo defino después" guarda regla deferred y no cubre 200ms
   → Cannot read properties of undefined (reading 'id')
 × src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C4: Flujo de respuestas cortas como borrador y propuesta de enunciado > C4-f: propuesta_enunciado corta o genérica es rechazada con status error 213ms
   → expected 'blocked' to be 'error' // Object.is equality
 ✓ src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C6: Ciclo completo plan -> auth -> compuerta de SCOPING con adaptador real > C6-a: plan bloqueado por perfil no verificado persiste, auth_add verifica y compuerta avanza a WORKING 6990ms
 ✓ src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C9: Validación y filtrado riguroso de roles limpios > C9-a: qap_init y qap_context_ingest descartan entradas de tabla Markdown y reportan roles_descartados 94ms
 ✓ src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C9: Validación y filtrado riguroso de roles limpios > C9-b: los 4 lectores ignoran roles inválidos presentes en un context.yaml contaminado 38ms
 ✓ src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C9: Validación y filtrado riguroso de roles limpios > C9-c: roles legítimos con espacios, tildes, guiones y números son aceptados siempre 37ms
 × src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C10: Detección y advertencia de extracción vacía > C10-a: página app/login sin elementos interactivos genera advertencia extraccion_vacia y trabajo 242ms
   → expected 'blocked' to be 'success' // Object.is equality
 × src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C10: Detección y advertencia de extracción vacía > C10-b: página con al menos un elemento interactivo no genera advertencia extraccion_vacia 232ms
   → expected 'blocked' to be 'success' // Object.is equality
 × src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C10: Detección y advertencia de extracción vacía > C10-c: la advertencia extraccion_vacia es agnóstica de la aplicación 233ms
   → expected 'blocked' to be 'success' // Object.is equality
 ✓ src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C3: Transliteración NFD de slugs y prevención de módulos fuera del plan > C3-a: opciones de módulos en guidance usan normalizeSlug sin sustituir tildes por guiones bajos 41ms
 ✓ src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C3: Transliteración NFD de slugs y prevención de módulos fuera del plan > C3-b: qap_session_plan limpia módulos planned huérfanos que ya no pertenezcan al plan 197ms
 × src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C3: Transliteración NFD de slugs y prevención de módulos fuera del plan > C1-c: módulo con tilde preserva nombre en lifecycle, crea directorio y normaliza pending_questions con transliteración NFD 182ms
   → expected false to be true // Object.is equality
 × src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C3: Transliteración NFD de slugs y prevención de módulos fuera del plan > C2-seguimiento: selección de "Corregir" emite pregunta de seguimiento y no persiste regla espuria en rules.yaml 204ms
   → expected undefined to be defined
 × src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 1. qap_discover protegido sin perfil: blocked auth_required y cero escrituras en disco 124ms
   → expected undefined to be 'auth_required' // Object.is equality
 × src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 2. qap_discover con redirección HTTP 302 a login: detecta auth_wall determinista y bloquea sin escribir 110ms
   → expected undefined to be 'auth_required' // Object.is equality
 × src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 3. qap_discover con login embebido en ruta no-acceso: bloquea como auth_required sin persistir 88ms
   → expected undefined to be 'auth_required' // Object.is equality
 × src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 4. qap_discover con sesión expirada: blocked session_invalid y desverifica el perfil 119ms
   → expected undefined to be 'session_invalid' // Object.is equality
 × src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 5. qap_discover con perfil verificado y storageState válido: devuelve app y transiciona a observed 107ms
   → expected 'blocked' to be 'success' // Object.is equality
 × src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 6. qap_discover en módulo de acceso: selectors.json incluye auth_selectors y omite valores y atributos sensibles de password 77ms
   → expected 'blocked' to be 'success' // Object.is equality
 ✓ src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 7. Secuencia de preguntas de SCOPING: 5 preguntas separadas y válidas sin mezclar módulos con auth 49ms
 ✓ src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 8. canExitScoping: compuerta falsa sin sesión verificada y verdadera con ella 43ms
 ✓ src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 9. qap_auth_add con verificación automática real contra el fixture HTTP local 6604ms
stdout | src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 10. qap_auth_add con handoff: probado con doble de prueba que sustituye SOLO la ventana humana (resto real)
Completa el login manualmente en la ventana abierta. Esperando hasta 15000ms...

 ✓ src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 10. qap_auth_add con handoff: probado con doble de prueba que sustituye SOLO la ventana humana (resto real) 5429ms
 ✓ src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 11. Test de no filtración: contraseña centinela NO aparece en respuestas, archivos .qa/, SQLite ni logs 13092ms
 ✓ src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 12. qap_session_plan: reordena módulos de acceso al inicio del plan de forma determinista y persiste acceso: true 88ms
 ✓ src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 13. Validación integral de preguntas (C1 & C2): todas las preguntas de SCOPING y blocked son válidas, sin formato decision, sin "Deseas" y sin opciones únicas 46ms
stdout | src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 14. Timeout de handoff (C4): qap_auth_add devuelve blocked con razon handoff_timeout y reintento idempotente
Completa el login manualmente en la ventana abierta. Esperando hasta 100ms...

 ✓ src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 14. Timeout de handoff (C4): qap_auth_add devuelve blocked con razon handoff_timeout y reintento idempotente 862ms
 × src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 15. Guard de cliente asíncrono lento (~1200ms) en qap_discover: responde blocked auth_required y cero escrituras en .qa/modules (C3c) 48ms
   → expected undefined to be 'auth_required' // Object.is equality
 ✓ src/__tests__/test-handler.test.ts > TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) > Scenario 1: executes valid and authorized plan, persisting authentic result (R4.1) 573ms
 ✓ src/__tests__/test-handler.test.ts > TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) > Scenario 2: rejects missing, historical, corrupt, or obsolete plans without executing runner (R4.2) 89ms
 ✓ src/__tests__/test-handler.test.ts > TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) > Scenario 3: rejects environment mismatch, module mismatch, and missing module (R4.3) 76ms
 ✓ src/__tests__/test-handler.test.ts > TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) > Scenario 4: in-memory snapshot prevents TOCTOU tampering of YAML files after verification (R4.4) 440ms
 ✓ src/__tests__/test-handler.test.ts > TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) > Scenario 5: blocks unauthorized URLs, unconfigured host policy, and redirects (R4.5) 632ms
 ✓ src/__tests__/test-handler.test.ts > TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) > Scenario 6: classifies missing browser launch failure as infrastructure block (R4.6) 75ms
 ✓ src/__tests__/test-handler.test.ts > TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) > Scenario 7: rejects unauthorized profiles and disables implicit session recovery (R4.7) 475ms
 ✓ src/__tests__/test-handler.test.ts > TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) > Scenario 8: distinguishes real functional failure from infrastructure failure (R4.8) 501ms
 ✓ src/__tests__/test-handler.test.ts > TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) > Scenario 9: zero cases executed never returns fake PASS verdict (R4.9) 125ms
 ✓ src/__tests__/test-handler.test.ts > TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) > Scenario 10: supports cancellation and resource cleanup under AbortSignal (R4.10) 60ms
 ✓ src/__tests__/test-handler.test.ts > TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) > Scenario 11: persists execution results adhering to schema without automatic SQLite ConformityAssessment (R4.11) 527ms
 ✓ src/__tests__/test-handler.test.ts > TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) > Scenario 12: integrates cleanly via createMcpServer preserving exact 18 tools (R4.12) 473ms
 ✓ src/__tests__/test-handler.test.ts > TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) > Scenario 13: physical Playwright Chromium execution against isolated local HTTP fixture (Real PASS & FAIL) 561ms
 ✓ src/__tests__/test-handler.test.ts > VNEXT-014-D preflight — execution evidence integrity > D-01: does not persist schema-invalid runner outputs 118ms
 ✓ src/__tests__/test-handler.test.ts > VNEXT-014-D preflight — execution evidence integrity > D-02: refuses traversal-capable execution IDs despite schema v1 accepting strings 125ms
 ✓ src/__tests__/test-handler.test.ts > VNEXT-014-D preflight — execution evidence integrity > D-03: failed execution persistence cannot be reported as success or recorded in history 104ms
 ✓ src/__tests__/test-handler.test.ts > VNEXT-014-D preflight — execution evidence integrity > D-04: history failure preserves saved evidence but returns an explicit partial error 151ms
 ✓ src/__tests__/test-handler.test.ts > VNEXT-014-D preflight — execution evidence integrity > D-05: rejects a schema-valid execution associated with a different module 116ms
 ✓ src/__tests__/test-handler.test.ts > VNEXT-014-D preflight — execution evidence integrity > D-06: rejects summary totals that disagree with executed cases 109ms
 ✓ src/__tests__/test-handler.test.ts > VNEXT-014-D preflight — execution evidence integrity > D-07: a critical runner error persists not_run evidence without reporting MCP success 117ms
 × src/__tests__/p4-5a-integrity.test.ts > P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) > Criterio 2: regla redactada por agente sin user_text ni from_option se guarda como inferred/agent y no cuenta en cobertura 311ms
   → expected 'blocked' to be 'success' // Object.is equality
 × src/__tests__/p4-5a-integrity.test.ts > P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) > Criterio 3: una etiqueta de opción predefinida del motor NO cubre una categoría 215ms
   → expected 'blocked' to be 'success' // Object.is equality
 × src/__tests__/p4-5a-integrity.test.ts > P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) > Criterio 4: un módulo con 2 reglas de 7 categorías no cierra sin accept_gaps, y cierra con él dejando registro 232ms
   → expected 'Falta el contexto de vista requerido …' to be 'cobertura_insuficiente' // Object.is equality
 × src/__tests__/p4-5a-integrity.test.ts > P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) > C9a: blocked de qap_discover con auth_required incluye razon auth_required y directorio_objetivo, con claves alineadas a session_invalid 216ms
   → expected undefined to be 'auth_required' // Object.is equality
 ✓ src/__tests__/p4-5a-integrity.test.ts > P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) > C7: compuerta de roles exige auth.roles no vacío y perfil verificado por cada rol para salir de SCOPING 294ms
 ✓ src/__tests__/p4-5a-integrity.test.ts > P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) > C8: tras "corregir", emite primero campos_a_corregir y luego pregunta abierta secuencial por campo 727ms
 × src/__tests__/p4-5a-integrity.test.ts > P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) > C4-a: from_option con pregunta_id inexistente, opcion_id inexistente o sin texto sustantivo (rechazo o degradación a agent/inferred) 215ms
   → expected 'blocked' to be 'error' // Object.is equality
 × src/__tests__/p4-5a-integrity.test.ts > P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) > C4-b: límites de sustantividad (2 palabras o 19 caracteres no cubren; 3 palabras y 20 caracteres sí) 219ms
   → ENOENT: no such file or directory, open '<FIXTURE_TEMP>'
 × src/__tests__/p4-5a-integrity.test.ts > P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) > C4-c: accept_gaps con razón de 14 caracteres bloquea y con 15 cierra y deja el registro 222ms
   → expected 'Falta el contexto de vista requerido …' to be 'cobertura_insuficiente' // Object.is equality
 × src/__tests__/p4-5a-integrity.test.ts > P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) > C4-d: plan con auth.required true sin roles queda bloqueado con pregunta de roles y bloquea discover (V4) 201ms
   → .toMatch() expects to receive a string, but got undefined
 × src/__tests__/p4-5a-integrity.test.ts > P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) > C1: campos honestos en bloqueos previos a navegar y navegación real 236ms
   → expected undefined to be 'auth_required' // Object.is equality
 × src/__tests__/p4-5a-integrity.test.ts > P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) > C3: flujo real de preguntas de categoría, formato una_opcion, persistencia y respuestas user_text y deferred 210ms
   → expected 'blocked' to be 'success' // Object.is equality
 ✓ src/__tests__/p3-verification.test.ts > P3 Suite de Verificación MCP (T3 - T15) > T3: Toda respuesta con siguiente_accion NO contiene "botones interactivos en modal" ni prohibición de listas 655ms
 ✓ src/__tests__/p3-verification.test.ts > P3 Suite de Verificación MCP (T3 - T15) > T4: qap_status WORKING con módulo planned: sin pregunta de confirmación, sin "Ver otros módulos", sin botón de una sola opción, stats.modules refleja estado 289ms
 ✓ src/__tests__/p3-verification.test.ts > P3 Suite de Verificación MCP (T3 - T15) > T5: lifecycle.json valida contra lifecycle-state.schema.json tras CADA mutación del flujo e2e 228ms
 × src/__tests__/p3-verification.test.ts > P3 Suite de Verificación MCP (T3 - T15) > T6: qap_discover éxito: no contiene "Descubrir otro módulo", "pregunta_doc" ni "opciones_doc"; siguiente_accion tipo entrevista_vista (<= 5 preguntas) con tool qap_rules_set, categorias_aplicables y rutas_detectadas_fuera_del_plan 251ms
   → Cannot read properties of undefined (reading 'tipo')
 × src/__tests__/p3-verification.test.ts > P3 Suite de Verificación MCP (T3 - T15) > T7: rules.yaml tras discover: reglas inferred/dom con ids deterministas; re-discover idempotente (sin duplicados, reglas confirmadas intactas) 245ms
   → expected false to be true // Object.is equality
 ✓ src/__tests__/p3-verification.test.ts > P3 Suite de Verificación MCP (T3 - T15) > T8: rules.yaml con manually_edited: true: discover no inserta reglas y declara el bloqueo canónico 231ms
 × src/__tests__/p3-verification.test.ts > P3 Suite de Verificación MCP (T3 - T15) > T9: Fallo de Playwright: no inserta reglas; siguiente_accion tipo decision 205ms
   → Cannot read properties of undefined (reading 'tipo')
 ✓ src/__tests__/p3-verification.test.ts > P3 Suite de Verificación MCP (T3 - T15) > T10: qap_rules_set bloqueado (contrato blocked) en: fase distinta de WORKING, módulo no registrado, módulo planned, módulo waived 187ms
 ✓ src/__tests__/p3-verification.test.ts > P3 Suite de Verificación MCP (T3 - T15) > T11: Primera llamada exitosa: observed -> interviewing; ids R-001, R-002... secuenciales por módulo 283ms
 ✓ src/__tests__/p3-verification.test.ts > P3 Suite de Verificación MCP (T3 - T15) > T12: No-downgrade: regla source user confirmed no se sobrescribe con source dom/prd; waivers solo source user y reason no vacío; lote con regla inválida se rechaza completo 291ms
 ✓ src/__tests__/p3-verification.test.ts > P3 Suite de Verificación MCP (T3 - T15) > T13: Dos llamadas concurrentes a qap_rules_set sin pérdida de actualización 351ms
 × src/__tests__/p3-verification.test.ts > P3 Suite de Verificación MCP (T3 - T15) > T14: qap_status WORKING: (a) observed con hipótesis reanuda entrevista; (b) interviewing incompleto reanuda; (c) planned elige high > medium > low luego orden; (d) todos completos tipo decision 321ms
   → expected 'trabajo' to be 'entrevista_vista' // Object.is equality
 × src/__tests__/p3-verification.test.ts > P3 Suite de Verificación MCP (T3 - T15) > T15: E2E: flujo de P2 hasta WORKING -> discover A -> rules_set parcial -> status (reanuda A) -> rules_set completa cobertura -> status (propone B) -> discover B; ninguna respuesta del flujo contiene texto del bucle 298ms
   → expected 'trabajo' to be 'entrevista_vista' // Object.is equality
 × src/__tests__/lifecycle-v3-e2e.test.ts > Lifecycle V3 E2E & Verification Suite (E0 - E3) > E0a: qap_status en WORKING para módulo con cobertura incompleta devuelve module, view y preguntas no vacías idénticas a qap_rules_set 463ms
   → expected 'trabajo' to be 'entrevista_vista' // Object.is equality
 ✓ src/__tests__/lifecycle-v3-e2e.test.ts > Lifecycle V3 E2E & Verification Suite (E0 - E3) > E0b: contrato estricto de opciones y preguntas en todo el flujo 591ms
 ✓ src/__tests__/lifecycle-v3-e2e.test.ts > Lifecycle V3 E2E & Verification Suite (E0 - E3) > E0c: qap_report sin ejecuciones responde blocked y no escribe archivos; ninguna siguiente_accion recomienda qap_report sin ejecuciones 182ms
 × src/__tests__/lifecycle-v3-e2e.test.ts > Lifecycle V3 E2E & Verification Suite (E0 - E3) > E1: regresión consolidated -> interviewing tras re-discover y política de waivers 230ms
   → expected '{\n  "status": "blocked",\n  "code": …' to contain 'La categoría \'proposito\' no se pued…'
 × src/__tests__/lifecycle-v3-e2e.test.ts > Lifecycle V3 E2E & Verification Suite (E0 - E3) > E2: qap_module_close validaciones, compuertas y transiciones 171ms
   → expected 'Falta el contexto de vista requerido …' to contain 'consolidated'
 × src/__tests__/lifecycle-v3-e2e.test.ts > Lifecycle V3 E2E & Verification Suite (E0 - E3) > E3: canExitWorking, qap_session_close, reporte de brechas y nueva sesión desde WRAP_UP 195ms
   → ENOENT: no such file or directory, open '<FIXTURE_TEMP>'
 × src/__tests__/lifecycle-v3-e2e.test.ts > Lifecycle V3 E2E & Verification Suite (E0 - E3) > Criterio 9: E2E completo: init -> onboarding -> scoping -> working -> discover A -> rules_set parcial -> status (reanuda) -> rules_set completa -> module_close A -> discover B -> module_close waive B -> session_close -> status WRAP_UP -> session_plan nueva sesión 219ms
   → expected 'blocked' to be 'success' // Object.is equality
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > registers all three declarative owners exactly once and never falls back after failure 99ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > status inspects uninitialized and legacy projects without creating memory or scan files 174ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > preserves the browser installation directive without launching a browser 40ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > status reports actual isolated SQLite inventory and leaves revisions unchanged 182ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > reports unavailable/ambiguous bindings without reopening or adopting a database 200ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > reports incomplete inventory without turning an unavailable query into zero modules 107ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > isolates two projects explicitly bound to different applications in the same physical store 305ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > clean blocks force=undefined and physically preserves every protected resource 126ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > clean blocks force=true and physically preserves every protected resource 118ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > clean blocks force=false and physically preserves every protected resource 113ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > blocks cleanup of uninitialized, external and junction projects without touching targets 17ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > preserves incremental context, provenance, corrections and explicit confirmation without promoting canonical entities 808ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > rejects environment discrepancies before YAML writes and never copies legacy secrets to SQLite 213ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > validates nested inputs and sanitizes errors without logging canaries 98ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > keeps corrupt YAML intact and reports sanitized errors 58ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > reports a real multi-file publication failure and blocks replay while its recovery journal is unresolved 130ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > reports lifecycle failure after YAML publication instead of claiming global success 188ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > does not grow context history for an identical update and preserves it after reopening the server 207ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > detects concurrent legacy changes, active locks, aborts and unresolved journals 60ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > rejects cancellation before execution and preserves the fixture 8ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > preserves physical CAS, history, reference pins, rollback and integrity across two connections and reopen 166ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > recovers exact drafts, corrections, defer/resume and history across closed connections 146ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > persists host reject and prevents old decision replay 72ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > persists host defer and prevents old decision replay 72ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > two independent connections serialize writers, detect stale versions and preserve the winner 79ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > rolls back failed physical writes and reports unknown status when storage closes 70ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > reconciles canonical commit followed by failed draft commit without a second approval 101ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > blocks restored draft in changed project 106ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > blocks restored draft in changed application 98ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > blocks restored draft in changed environment 65ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > blocks restored draft in changed session 65ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > blocks restored draft in changed inactive 67ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > blocks restored draft in changed revision 62ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > does not create on read, adopt foreign schemas, accept wrong keys or destroy damaged state 104ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > reopened proposal has no authority with expired gateway decision 54ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > reopened proposal has no authority with revoked gateway decision 57ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > reopened proposal has no authority with altered gateway decision 52ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > reopened proposal has no authority with absent gateway decision 50ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > reopened proposal has no authority with unavailable gateway decision 51ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > retains consumed reject IDs across restart and requires fresh review for reactivation 72ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > SQLite rolls back a writer process that exits before COMMIT 123ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > terminates Node processes between real MCP SDK operations and reopens both physical stores 7583ms
 ✓ src/__tests__/p4-5s1-browser-candidates.test.ts > P4.5-S1: Preflight browser, Module Candidates, and Session Plan > C1: qap_status y qap_init incluyen navegador_qap en proyecto inicializado 249ms
 ✓ src/__tests__/p4-5s1-browser-candidates.test.ts > P4.5-S1: Preflight browser, Module Candidates, and Session Plan > C1: directivas contienen la indicación de preflight, exploracion y longitud <= 600 3ms
 ✓ src/__tests__/p4-5s1-browser-candidates.test.ts > P4.5-S1: Preflight browser, Module Candidates, and Session Plan > C1: status/init conservan la frase histórica y discover declara persistencia canónica estática 4ms
 ✓ src/__tests__/p4-5s1-browser-candidates.test.ts > P4.5-S1: Preflight browser, Module Candidates, and Session Plan > C4/C6: qap_context_ingest persiste module-candidates.json y qap_session_plan lo usa 311ms
 ✓ src/__tests__/p4-5s1-browser-candidates.test.ts > P4.5-S1: Preflight browser, Module Candidates, and Session Plan > C5: qap_session_plan responde blocked (no error) si un id de candidato no existe 222ms
 ✓ src/__tests__/p4-5s1-browser-candidates.test.ts > P4.5-S1: Preflight browser, Module Candidates, and Session Plan > C4: qap_session_plan bloquea si candidato tiene ruta null con ejemplo generico fijo (/catalog) nunca derivado del nombre 229ms
 ✓ src/__tests__/p4-5s1-browser-candidates.test.ts > P4.5-S1: Preflight browser, Module Candidates, and Session Plan > C6: qap_context_ingest sin candidatos cuando hay flujos criticos genera paso trabajo 214ms
 ✓ src/__tests__/p4-5s1-browser-candidates.test.ts > P4.5-S1: Preflight browser, Module Candidates, and Session Plan > C7: pregunta de alcance sin candidatos o sin front es byte a byte identica a la original 296ms
 ✓ src/__tests__/p4-5s1-browser-candidates.test.ts > P4.5-S1: Preflight browser, Module Candidates, and Session Plan > D5: comando de instalacion consistente en preflight, qap_init, qap_status y checkPlaywrightBrowser 172ms
 ✓ src/__tests__/p4-5s1-browser-candidates.test.ts > P4.5-S1: Preflight browser, Module Candidates, and Session Plan > C5: scoping con 3 y con 9 candidatos (máximo 7 por tarjeta + Otro módulo), sin recomendada en opciones y pasa guardia de emisión 503ms
 ✓ src/__tests__/p4-5s1-browser-candidates.test.ts > P4.5-S1: Preflight browser, Module Candidates, and Session Plan > C6: qap_session_plan asigna high a los 3 primeros y medium al resto, con soporte retrocompatible para modules 449ms
 ✓ src/__tests__/p4-3-investigate-before-ask.test.ts > P4.3 Suite: Investigar antes de preguntar, Auto-ingesta, Confirmación única y Payload autosuficiente > Criterio 3: Contrato MCP P4.3 > 3.1: qap_context_set con "PRD_diff.md" escrito libre ingiere en la misma llamada y la siguiente acción NO es abierta 299ms
 ✓ src/__tests__/p4-3-investigate-before-ask.test.ts > P4.3 Suite: Investigar antes de preguntar, Auto-ingesta, Confirmación única y Payload autosuficiente > Criterio 3: Contrato MCP P4.3 > 3.2: con documento sin objetivo extraíble la siguiente_accion es trabajo 185ms
 ✓ src/__tests__/p4-3-investigate-before-ask.test.ts > P4.3 Suite: Investigar antes de preguntar, Auto-ingesta, Confirmación única y Payload autosuficiente > Criterio 3: Contrato MCP P4.3 > 3.3: propuesta del agente se guarda como inferred con evidence y no avanza la fase 222ms
 ✓ src/__tests__/p4-3-investigate-before-ask.test.ts > P4.3 Suite: Investigar antes de preguntar, Auto-ingesta, Confirmación única y Payload autosuficiente > Criterio 3: Contrato MCP P4.3 > 3.4: la ingesta no degrada source user 227ms
 ✓ src/__tests__/p4-3-investigate-before-ask.test.ts > P4.3 Suite: Investigar antes de preguntar, Auto-ingesta, Confirmación única y Payload autosuficiente > Criterio 3: Contrato MCP P4.3 > 3.5: confirmación única (confirmo todo / corregir con seguimiento) y render_texto presente y consistente 486ms
 ✓ src/__tests__/p4-3-investigate-before-ask.test.ts > P4.3 Suite: Investigar antes de preguntar, Auto-ingesta, Confirmación única y Payload autosuficiente > Criterio 4: Extracción determinista sobre PRD en español con pipeline de etapas > reporta literal el resultado de la extracción heurística parsePrdContent 2ms
 ✓ src/__tests__/p4-3-investigate-before-ask.test.ts > P4.3 Suite: Investigar antes de preguntar, Auto-ingesta, Confirmación única y Payload autosuficiente > Criterio 5: Flujo E2E ONBOARDING determinista > flujo completo ONBOARDING sin ingest por iniciativa propia; falla si se emite pregunta abierta con dato existente 349ms
 ✓ src/__tests__/p4-3-investigate-before-ask.test.ts > P4.3 Suite: Investigar antes de preguntar, Auto-ingesta, Confirmación única y Payload autosuficiente > Criterio 5: Flujo E2E ONBOARDING determinista > valida respuestas y payloads de regresión P4.3 582ms
 ✓ src/__tests__/p4-3-1-b-block.test.ts > P4.3.1 Bloque B - Verificación y Cobertura de Correcciones > Criterio 2 & B1: con el fixture de A1, ninguna pregunta de objetivo, roles o flujos es abierta si hay propuesta; critical_flows nunca contiene rutas; tarjeta no ofrece Confirmo todo con URL sin definir 264ms
 ✓ src/__tests__/p4-3-1-b-block.test.ts > P4.3.1 Bloque B - Verificación y Cobertura de Correcciones > Criterio 3 & B4: la ingesta no modifica notes de source_of_truth y escribe ingest.analyzed_by 260ms
 ✓ src/__tests__/p4-3-1-b-block.test.ts > P4.3.1 Bloque B - Verificación y Cobertura de Correcciones > B5: el detector nunca lee .env ni .env.local; SECRET_KEY=abc123 y credenciales nunca aparecen en scan ni salidas 73ms
 ✓ src/__tests__/p4-3-1-b-block.test.ts > P4.3.1 Bloque B - Verificación y Cobertura de Correcciones > B6: ninguna siguiente_accion tipo trabajo apunta a herramientas que exigen confirmación (qap_module_close, qap_session_close); constante <= 600 caracteres 229ms
 ✓ src/__tests__/p4-3-1-b-block.test.ts > P4.3.1 Bloque B - Verificación y Cobertura de Correcciones > B7: flujo corregir resumen realiza preguntas abiertas una por una citando propuesta, asigna source user, y permite confirmación final 761ms
 ✓ src/__tests__/p4-3-1-b-block.test.ts > P4.3.1 Bloque B - Verificación y Cobertura de Correcciones > B8: advierte si targetPath parece una subcarpeta de un repo con .git sin escanear fuera 129ms
 ✓ src/__tests__/p4-3-1-b-block.test.ts > P4.3.1 Bloque B - Verificación y Cobertura de Correcciones > B9: sanitizeDomString preserva "/", "_" y vocales acentuadas pero sanitiza caracteres de control e inyecciones HTML 2ms
 ✓ src/__tests__/p4-2-pregunta-contract.test.ts > P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) > Criterio 4.1: qap_init en workspace con README devuelve pregunta fuente_de_verdad con ese README como opcion 77ms
 ✓ src/__tests__/p4-2-pregunta-contract.test.ts > P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) > Criterio 4.2: qap_status a mitad de ONBOARDING devuelve la misma pregunta que ya estaba pendiente (reanudación) 518ms
 ✓ src/__tests__/p4-2-pregunta-contract.test.ts > P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) > Criterio 4.3: Progresión canónica fuente_de_verdad -> objetivo -> roles -> flujos_criticos -> SCOPING 960ms
 × src/__tests__/p4-2-pregunta-contract.test.ts > P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) > Criterio 4.4: Ninguna respuesta con siguiente_accion trae preguntas como cadenas ni pregunta aplanada 265ms
   → Tool qap_discover failed: {
  "status": "blocked",
  "code": "knowledge_unbound",
  "persistence": "not_attempted",
  "next_safe_action": "Revisar la configuración explícita del host.",
  "acquisition_status": "blocked",
  "acquisition_persistence": "not_attempted",
  "association_status": "not_attempted",
  "module_identity_status": "not_resolved",
  "coverage": "partial"
}
 ✓ src/__tests__/p4-2-pregunta-contract.test.ts > P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) > Criterio 4.5: Test de inyección: package.json description y nombre de archivo con instrucciones aparecen sanitizados 70ms
 × src/__tests__/p4-2-pregunta-contract.test.ts > P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) > Criterio 6: E2E Completo donde TODA siguiente_accion de tipo entrevista, entrevista_vista o decision trae Pregunta válida 416ms
   → Tool qap_discover failed: {
  "status": "blocked",
  "code": "knowledge_unbound",
  "persistence": "not_attempted",
  "next_safe_action": "Revisar la configuración explícita del host.",
  "acquisition_status": "blocked",
  "acquisition_persistence": "not_attempted",
  "association_status": "not_attempted",
  "module_identity_status": "not_resolved",
  "coverage": "partial"
}
 ✓ src/__tests__/report-handler.test.ts > VNEXT-014-D declarative ReportHandler — persisted evidence only > D-R01: blocks reporting when no physical execution record exists 99ms
 ✓ src/__tests__/report-handler.test.ts > VNEXT-014-D declarative ReportHandler — persisted evidence only > D-R02: creates JSON from a persisted schema-valid execution unchanged 90ms
 ✓ src/__tests__/report-handler.test.ts > VNEXT-014-D declarative ReportHandler — persisted evidence only > D-R03: refuses inconsistent totals and does not create a report 67ms
 ✓ src/__tests__/report-handler.test.ts > VNEXT-014-D declarative ReportHandler — persisted evidence only > D-R04: latest selection respects module filter and real finished timestamps 78ms
 ✓ src/__tests__/report-handler.test.ts > VNEXT-014-D declarative ReportHandler — persisted evidence only > D-R05: blocks cross-module requests and path traversal identifiers 54ms
 ✓ src/__tests__/report-handler.test.ts > VNEXT-014-D declarative ReportHandler — persisted evidence only > D-R06: blocks screenshots pointing outside the approved evidence directory 53ms
 ✓ src/__tests__/report-handler.test.ts > VNEXT-014-D declarative ReportHandler — persisted evidence only > D-R07: renders all four formats from one persisted partial execution 79ms
 ✓ src/__tests__/report-handler.test.ts > VNEXT-014-D declarative ReportHandler — persisted evidence only > D-R08: rejects false PASS from a zero-case execution 51ms
 ✓ src/__tests__/report-handler.test.ts > VNEXT-014-D declarative ReportHandler — persisted evidence only > D-R09: rejects a contradictory partial status with no failed, skipped or blocked cases 74ms
 ✓ src/__tests__/report-handler.test.ts > VNEXT-014-D declarative ReportHandler — persisted evidence only > D-R10: rejects duplicate test identifiers without promoting ambiguous coverage 44ms
 ✓ src/__tests__/report-handler.test.ts > VNEXT-014-D declarative ReportHandler — persisted evidence only > D-R11: exposes exactly 18 tools and invokes the migrated report via MCP transport 89ms
 ✓ src/__tests__/report-handler.test.ts > VNEXT-014-D declarative ReportHandler — persisted evidence only > D-R12: an initialized but empty executions directory returns a compatible blocked reason 40ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher registration > preserves explicit insertion order and isolates instances 5ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher registration > rejects invalid name "" 1ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher registration > rejects invalid name " " 0ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher registration > rejects invalid name "a b" 0ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher registration > rejects invalid name "../path" 0ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher registration > rejects invalid name "a/b" 0ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher registration > rejects invalid name "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" 0ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher registration > accepts valid name qap.status 0ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher registration > accepts valid name qap-status 0ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher registration > accepts valid name qap_status 0ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher registration > accepts valid name A1 0ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher registration > rejects duplicates and legacy collisions without executing handlers 1ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher registration > rejects malformed contracts 0ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher registration > rejects malformed contracts 0ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher registration > rejects malformed contracts 0ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher registration > rejects malformed contracts 0ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher registration > rejects malformed contracts 0ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher registration > rejects malformed contracts 0ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher registration > requires sealing and rejects registration during execution 2ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher registration > captures metadata and callbacks independently of caller mutation 0ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher execution > awaits async execution, passes context and isolates input mutation 1ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher execution > rejects malformed invocations without execution 0ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher execution > rejects malformed invocations without execution 0ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher execution > rejects malformed invocations without execution 0ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher execution > rejects malformed invocations without execution 0ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher execution > rejects malformed invocations without execution 0ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher execution > rejects malformed invocations without execution 0ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher execution > does exact lookup, including prototype-looking names 1ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher execution > allows omitted arguments without inventing domain defaults 1ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher execution > supports specific validators before execution 0ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher execution > preserves intentional MCP error results 0ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher execution > sanitizes thrown exceptions 1ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher execution > sanitizes thrown exceptions 0ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher execution > sanitizes thrown exceptions 0ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher execution > returns fixed structured errors even if exception message is modified 0ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher execution > sanitizes invalid results and validator exceptions 1ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher execution > does not invoke handlers with an already cancelled context 0ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher execution > prevents registry mutation from inside an executing handler 0ms
 ✓ src/__tests__/dispatcher-integration.test.ts > real MCP client/server via linked transports > lists and invokes an injected declarative tool exactly once 27ms
 ✓ src/__tests__/dispatcher-integration.test.ts > real MCP client/server via linked transports > isolates registries and preserves unknown-tool legacy errors 5ms
 ✓ src/__tests__/dispatcher-integration.test.ts > real MCP client/server via linked transports > rejects legacy collisions and duplicate injected names at startup 3ms
 ✓ src/__tests__/dispatcher-integration.test.ts > real MCP client/server via linked transports > preserves 16 definitions, order, prompts and legacy rules schema; adds explicit canonical interview operations 24ms
 ✓ src/__tests__/dispatcher-integration.test.ts > real MCP client/server via linked transports > runs informative legacy status on an empty disposable fixture 65ms
 ✓ src/__tests__/dispatcher-integration.test.ts > real MCP client/server via linked transports > sanitizes declarative exceptions through the real SDK 2ms
 ✓ src/__tests__/dispatcher-integration.test.ts > real MCP client/server via linked transports > demonstrates that low-level SDK does not validate inputSchema 1ms
 ✓ src/__tests__/dispatcher-integration.test.ts > real MCP client/server via linked transports > applies a handler validator through MCP before execution 2ms
 ✓ src/__tests__/e0-investigation.test.ts > E0 / B10 Pruebas de regresión sin impresión > E0a: escaneo respeta targetPath y emite advertencia de subcarpeta si no hay docs 159ms
 ✓ src/__tests__/e0-investigation.test.ts > E0 / B10 Pruebas de regresión sin impresión > E0b: qap_context_ingest no degrada source_of_truth ni contamina notes, registra ingest.analyzed_by 141ms
 ✓ src/__tests__/e0-investigation.test.ts > E0 / B10 Pruebas de regresión sin impresión > E0c: sin evidencia detectedService es undefined y baseUrl no se inventa 89ms
 ✓ src/__tests__/e0-investigation.test.ts > E0 / B10 Pruebas de regresión sin impresión > E0d / B10: objetivo largo se trunca a máx 280 con elipsis sin cortar palabras en preguntas, pero se guarda completo en context 197ms
 ✓ src/__tests__/guidance.test.ts > Módulo de Guía Conversacional por Fase (E6 - P4.2) > ONBOARDING: debe generar tipo "entrevista" con UNA pregunta estructurada pendiente y sin opciones top-level 4ms
 ✓ src/__tests__/guidance.test.ts > Módulo de Guía Conversacional por Fase (E6 - P4.2) > ONBOARDING: debe entregar la siguiente pregunta pendiente en orden canónico 1ms
 ✓ src/__tests__/guidance.test.ts > Módulo de Guía Conversacional por Fase (E6 - P4.2) > SCOPING: debe generar tipo "decision" requiriendo qap_session_plan y proponiendo sugerencias en pregunta.opciones 1ms
 ✓ src/__tests__/guidance.test.ts > Módulo de Guía Conversacional por Fase (E6 - P4.2) > WORKING: debe indicar el siguiente módulo en estado planned con tool qap_discover 0ms
 ✓ src/__tests__/guidance.test.ts > Módulo de Guía Conversacional por Fase (E6 - P4.2) > WORKING: debe priorizar módulo en interviewing con tipo entrevista_vista y tool qap_rules_set 0ms
 ✓ src/__tests__/guidance.test.ts > Módulo de Guía Conversacional por Fase (E6 - P4.2) > WORKING: debe dirigir a qap_session_close con tipo decision si todos los módulos están listos 0ms
 ✓ src/__tests__/guidance.test.ts > Módulo de Guía Conversacional por Fase (E6 - P4.2) > WRAP_UP: debe ofrecer decisión con opciones de Knowledge Graph y nueva sesión 0ms

⎯⎯⎯⎯⎯⎯ Failed Tests 55 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/__tests__/lifecycle-v3-e2e.test.ts > Lifecycle V3 E2E & Verification Suite (E0 - E3) > E0a: qap_status en WORKING para módulo con cobertura incompleta devuelve module, view y preguntas no vacías idénticas a qap_rules_set
AssertionError: expected 'trabajo' to be 'entrevista_vista' // Object.is equality

Expected: "entrevista_vista"
Received: "trabajo"

 ❯ src/__tests__/lifecycle-v3-e2e.test.ts:140:52
    138|     // Estado observed con hipótesis pendientes
    139|     const statusObs = await callTool('qap_status', {});
    140|     expect(statusObs.parsed.siguiente_accion.tipo).toBe('entrevista_vi…
       |                                                    ^
    141|     expect(statusObs.parsed.siguiente_accion.module).toBe('auth');
    142|     expect(statusObs.parsed.siguiente_accion.view).toBe('default');

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/55]⎯

 FAIL  src/__tests__/lifecycle-v3-e2e.test.ts > Lifecycle V3 E2E & Verification Suite (E0 - E3) > E1: regresión consolidated -> interviewing tras re-discover y política de waivers
AssertionError: expected '{\n  "status": "blocked",\n  "code": …' to contain 'La categoría \'proposito\' no se pued…'

- Expected
+ Received

- La categoría 'proposito' no se puede renunciar
+ {
+   "status": "blocked",
+   "code": "legacy_interview_unavailable",
+   "persistence": "not_attempted",
+   "razon": "El módulo permanece planned. Falta el contexto de vista requerido por la entrevista legacy. Las observaciones canónicas no lo sustituyen ni acreditan cobertura.",
+   "desbloquear_con": {
+     "tool": "qap_status",
+     "descripcion": "Revisar el inventario con qap_status. Para entrevistar se requiere contexto legacy previamente revisado o una integración futura expresamente autorizada; repetir discovery no crea ese contexto."
+   },
+   "siguiente_accion": {
+     "tipo": "trabajo",
+     "tool": "qap_status",
+     "descripcion": "Revisar el inventario con qap_status. Para entrevistar se requiere contexto legacy previamente revisado o una integración futura expresamente autorizada; repetir discovery no crea ese contexto."
+   },
+   "integration": {
+     "discovery_advances_lifecycle": false,
+     "canonical_interview": "unavailable",
+     "observations_are_confirmed_requirements": false,
+     "module_association": "not_persisted_by_discovery",
+     "next_safe_action": "Revisar el inventario con qap_status. Para entrevistar se requiere contexto legacy previamente revisado o una integración futura expresamente autorizada; repetir discovery no crea ese contexto."
+   }
+ }

 ❯ src/__tests__/lifecycle-v3-e2e.test.ts:252:32
    250|     });
    251|     expect(resPropWaiver.res.isError).toBe(true);
    252|     expect(resPropWaiver.text).toContain("La categoría 'proposito' no …
       |                                ^
    253|
    254|     // 2. Rechazo de waiver con reason < 15 caracteres

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/55]⎯

 FAIL  src/__tests__/lifecycle-v3-e2e.test.ts > Lifecycle V3 E2E & Verification Suite (E0 - E3) > E2: qap_module_close validaciones, compuertas y transiciones
AssertionError: expected 'Falta el contexto de vista requerido …' to contain 'consolidated'

Expected: "consolidated"
Received: "Falta el contexto de vista requerido por la entrevista legacy. Las observaciones canónicas no lo sustituyen ni acreditan cobertura."

 ❯ src/__tests__/lifecycle-v3-e2e.test.ts:339:43
    337|     const rNotConsolidated = await callTool('qap_module_close', { modu…
    338|     expect(rNotConsolidated.parsed.status).toBe('blocked');
    339|     expect(rNotConsolidated.parsed.razon).toContain('consolidated');
       |                                           ^
    340|
    341|     // Descubrir auth y completarlo

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/55]⎯

 FAIL  src/__tests__/lifecycle-v3-e2e.test.ts > Lifecycle V3 E2E & Verification Suite (E0 - E3) > E3: canExitWorking, qap_session_close, reporte de brechas y nueva sesión desde WRAP_UP
Error: ENOENT: no such file or directory, open '<FIXTURE_TEMP>'
 ❯ src/__tests__/lifecycle-v3-e2e.test.ts:407:28
    405|     // Completar y cerrar auth
    406|     await callTool('qap_discover', { name: 'auth', path: '/login' });
    407|     const doc = YAML.parse(readFileSync(join(tempDir, '.qa', 'modules'…
       |                            ^
    408|     const inferred = doc.rules.map((r: any) => ({ ...r, status: 'confi…
    409|     await callTool('qap_rules_set', {

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
Serialized Error: { errno: -4058, code: 'ENOENT', syscall: 'open', path: '<FIXTURE_TEMP>' }
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[4/55]⎯

 FAIL  src/__tests__/lifecycle-v3-e2e.test.ts > Lifecycle V3 E2E & Verification Suite (E0 - E3) > Criterio 9: E2E completo: init -> onboarding -> scoping -> working -> discover A -> rules_set parcial -> status (reanuda) -> rules_set completa -> module_close A -> discover B -> module_close waive B -> session_close -> status WRAP_UP -> session_plan nueva sesión
AssertionError: expected 'blocked' to be 'success' // Object.is equality

Expected: "success"
Received: "blocked"

 ❯ src/__tests__/lifecycle-v3-e2e.test.ts:537:30
    535|     const r4 = await callTool('qap_discover', { name: 'moduloA', path:…
    536|     validateLifecycleState();
    537|     expect(r4.parsed.status).toBe('success');
       |                              ^
    538|     expect(r4.parsed.siguiente_accion.tipo).toBe('entrevista_vista');
    539|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[5/55]⎯

 FAIL  src/__tests__/p3-verification.test.ts > P3 Suite de Verificación MCP (T3 - T15) > T6: qap_discover éxito: no contiene "Descubrir otro módulo", "pregunta_doc" ni "opciones_doc"; siguiente_accion tipo entrevista_vista (<= 5 preguntas) con tool qap_rules_set, categorias_aplicables y rutas_detectadas_fuera_del_plan
TypeError: Cannot read properties of undefined (reading 'tipo')
 ❯ src/__tests__/p3-verification.test.ts:330:36
    328|
    329|     // Siguiente acción estructurada para entrevista de vista
    330|     expect(parsed.siguiente_accion.tipo).toBe('entrevista_vista');
       |                                    ^
    331|     expect(parsed.siguiente_accion.tool).toBe('qap_rules_set');
    332|     expect(parsed.siguiente_accion.modulo).toBe('auth');

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[6/55]⎯

 FAIL  src/__tests__/p3-verification.test.ts > P3 Suite de Verificación MCP (T3 - T15) > T7: rules.yaml tras discover: reglas inferred/dom con ids deterministas; re-discover idempotente (sin duplicados, reglas confirmadas intactas)
AssertionError: expected false to be true // Object.is equality

- Expected
+ Received

- true
+ false

 ❯ src/__tests__/p3-verification.test.ts:351:35
    349|     await callTool('qap_discover', { name: 'auth', path: '/login' });
    350|     const rulesPath = join(tempDir, '.qa', 'modules', 'auth', 'rules.y…
    351|     expect(existsSync(rulesPath)).toBe(true);
       |                                   ^
    352|
    353|     const rulesDoc1 = YAML.parse(readFileSync(rulesPath, 'utf-8'));

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[7/55]⎯

 FAIL  src/__tests__/p3-verification.test.ts > P3 Suite de Verificación MCP (T3 - T15) > T9: Fallo de Playwright: no inserta reglas; siguiente_accion tipo decision
TypeError: Cannot read properties of undefined (reading 'tipo')
 ❯ src/__tests__/p3-verification.test.ts:434:36
    432|
    433|     // siguiente_accion tipo decision
    434|     expect(parsed.siguiente_accion.tipo).toBe('decision');
       |                                    ^
    435|     expect(parsed.siguiente_accion.tool).toBe('qap_discover');
    436|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[8/55]⎯

 FAIL  src/__tests__/p3-verification.test.ts > P3 Suite de Verificación MCP (T3 - T15) > T14: qap_status WORKING: (a) observed con hipótesis reanuda entrevista; (b) interviewing incompleto reanuda; (c) planned elige high > medium > low luego orden; (d) todos completos tipo decision
AssertionError: expected 'trabajo' to be 'entrevista_vista' // Object.is equality

Expected: "entrevista_vista"
Received: "trabajo"

 ❯ src/__tests__/p3-verification.test.ts:633:50
    631|
    632|     const statusA = await callTool('qap_status', {});
    633|     expect(statusA.parsed.siguiente_accion.tipo).toBe('entrevista_vist…
       |                                                  ^
    634|     expect(statusA.parsed.siguiente_accion.tool).toBe('qap_rules_set');
    635|     expect(statusA.parsed.siguiente_accion.descripcion).toContain('aut…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[9/55]⎯

 FAIL  src/__tests__/p3-verification.test.ts > P3 Suite de Verificación MCP (T3 - T15) > T15: E2E: flujo de P2 hasta WORKING -> discover A -> rules_set parcial -> status (reanuda A) -> rules_set completa cobertura -> status (propone B) -> discover B; ninguna respuesta del flujo contiene texto del bucle
AssertionError: expected 'trabajo' to be 'entrevista_vista' // Object.is equality

Expected: "entrevista_vista"
Received: "trabajo"

 ❯ src/__tests__/p3-verification.test.ts:755:45
    753|     const r6 = await callTool('qap_status', {});
    754|     verifyNoLoopText(r6.text);
    755|     expect(r6.parsed.siguiente_accion.tipo).toBe('entrevista_vista');
       |                                             ^
    756|     expect(r6.parsed.siguiente_accion.tool).toBe('qap_rules_set');
    757|     expect(r6.parsed.siguiente_accion.descripcion).toContain('moduloA'…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[10/55]⎯

 FAIL  src/__tests__/p4-2-pregunta-contract.test.ts > P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) > Criterio 4.4: Ninguna respuesta con siguiente_accion trae preguntas como cadenas ni pregunta aplanada
Error: Tool qap_discover failed: {
  "status": "blocked",
  "code": "knowledge_unbound",
  "persistence": "not_attempted",
  "next_safe_action": "Revisar la configuración explícita del host.",
  "acquisition_status": "blocked",
  "acquisition_persistence": "not_attempted",
  "association_status": "not_attempted",
  "module_identity_status": "not_resolved",
  "coverage": "partial"
}
 ❯ callTool src/__tests__/p4-2-pregunta-contract.test.ts:95:13
     93|     );
     94|     if (res.isError) {
     95|       throw new Error(`Tool ${name} failed: ${res.content?.[0]?.text}`…
       |             ^
     96|     }
     97|     expect(res.isError).toBeFalsy();
 ❯ src/__tests__/p4-2-pregunta-contract.test.ts:202:20

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[11/55]⎯

 FAIL  src/__tests__/p4-2-pregunta-contract.test.ts > P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) > Criterio 6: E2E Completo donde TODA siguiente_accion de tipo entrevista, entrevista_vista o decision trae Pregunta válida
Error: Tool qap_discover failed: {
  "status": "blocked",
  "code": "knowledge_unbound",
  "persistence": "not_attempted",
  "next_safe_action": "Revisar la configuración explícita del host.",
  "acquisition_status": "blocked",
  "acquisition_persistence": "not_attempted",
  "association_status": "not_attempted",
  "module_identity_status": "not_resolved",
  "coverage": "partial"
}
 ❯ callTool src/__tests__/p4-2-pregunta-contract.test.ts:95:13
     93|     );
     94|     if (res.isError) {
     95|       throw new Error(`Tool ${name} failed: ${res.content?.[0]?.text}`…
       |             ^
     96|     }
     97|     expect(res.isError).toBeFalsy();
 ❯ src/__tests__/p4-2-pregunta-contract.test.ts:292:23

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[12/55]⎯

 FAIL  src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 1. qap_discover protegido sin perfil: blocked auth_required y cero escrituras en disco
AssertionError: expected undefined to be 'auth_required' // Object.is equality

- Expected:
"auth_required"

+ Received:
undefined

 ❯ src/__tests__/p4-4-auth-lifecycle.test.ts:175:26
    173|
    174|     expect(parsed.status).toBe('blocked');
    175|     expect(parsed.razon).toBe('auth_required');
       |                          ^
    176|     expect(parsed.page_kind).toBeNull();
    177|     expect(parsed.observed).toBe(false);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[13/55]⎯

 FAIL  src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 2. qap_discover con redirección HTTP 302 a login: detecta auth_wall determinista y bloquea sin escribir
AssertionError: expected undefined to be 'auth_required' // Object.is equality

- Expected:
"auth_required"

+ Received:
undefined

 ❯ src/__tests__/p4-4-auth-lifecycle.test.ts:206:26
    204|
    205|     expect(parsed.status).toBe('blocked');
    206|     expect(parsed.razon).toBe('auth_required');
       |                          ^
    207|     expect(parsed.page_kind).toBe('auth_wall');
    208|     expect(parsed.redirected).toBe(true);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[14/55]⎯

 FAIL  src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 3. qap_discover con login embebido en ruta no-acceso: bloquea como auth_required sin persistir
AssertionError: expected undefined to be 'auth_required' // Object.is equality

- Expected:
"auth_required"

+ Received:
undefined

 ❯ src/__tests__/p4-4-auth-lifecycle.test.ts:228:26
    226|
    227|     expect(parsed.status).toBe('blocked');
    228|     expect(parsed.razon).toBe('auth_required');
       |                          ^
    229|     expect(parsed.page_kind).toBe('login');
    230|     expect(existsSync(join(tempDir, '.qa', 'modules', 'login_embebido'…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[15/55]⎯

 FAIL  src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 4. qap_discover con sesión expirada: blocked session_invalid y desverifica el perfil
AssertionError: expected undefined to be 'session_invalid' // Object.is equality

- Expected:
"session_invalid"

+ Received:
undefined

 ❯ src/__tests__/p4-4-auth-lifecycle.test.ts:294:26
    292|
    293|     expect(parsed.status).toBe('blocked');
    294|     expect(parsed.razon).toBe('session_invalid');
       |                          ^
    295|     expect(parsed.desbloquear_con.tool).toBe('qap_auth_add');
    296|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[16/55]⎯

 FAIL  src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 5. qap_discover con perfil verificado y storageState válido: devuelve app y transiciona a observed
AssertionError: expected 'blocked' to be 'success' // Object.is equality

Expected: "success"
Received: "blocked"

 ❯ src/__tests__/p4-4-auth-lifecycle.test.ts:366:27
    364|     });
    365|
    366|     expect(parsed.status).toBe('success');
       |                           ^
    367|     expect(parsed.view.page_kind).toBe('app');
    368|     expect(parsed.storage_state_used).toBe(true);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[17/55]⎯

 FAIL  src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 6. qap_discover en módulo de acceso: selectors.json incluye auth_selectors y omite valores y atributos sensibles de password
AssertionError: expected 'blocked' to be 'success' // Object.is equality

Expected: "success"
Received: "blocked"

 ❯ src/__tests__/p4-4-auth-lifecycle.test.ts:392:27
    390|     });
    391|
    392|     expect(parsed.status).toBe('success');
       |                           ^
    393|     expect(parsed.view.page_kind).toBe('login');
    394|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[18/55]⎯

 FAIL  src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 15. Guard de cliente asíncrono lento (~1200ms) en qap_discover: responde blocked auth_required y cero escrituras en .qa/modules (C3c)
AssertionError: expected undefined to be 'auth_required' // Object.is equality

- Expected:
"auth_required"

+ Received:
undefined

 ❯ src/__tests__/p4-4-auth-lifecycle.test.ts:854:26
    852|
    853|     expect(parsed.status).toBe('blocked');
    854|     expect(parsed.razon).toBe('auth_required');
       |                          ^
    855|     expect(parsed.desbloquear_con?.tool).toBe('qap_auth_add');
    856|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[19/55]⎯

 FAIL  src/__tests__/p4-5a-integrity.test.ts > P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) > Criterio 2: regla redactada por agente sin user_text ni from_option se guarda como inferred/agent y no cuenta en cobertura
AssertionError: expected 'blocked' to be 'success' // Object.is equality

Expected: "success"
Received: "blocked"

 ❯ src/__tests__/p4-5a-integrity.test.ts:175:31
    173|     });
    174|
    175|     expect(res.parsed.status).toBe('success');
       |                               ^
    176|     expect(res.parsed.desbloquear_con).toBeDefined();
    177|     expect(res.parsed.desbloquear_con.tool).toBe('qap_rules_set');

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[20/55]⎯

 FAIL  src/__tests__/p4-5a-integrity.test.ts > P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) > Criterio 3: una etiqueta de opción predefinida del motor NO cubre una categoría
AssertionError: expected 'blocked' to be 'success' // Object.is equality

Expected: "success"
Received: "blocked"

 ❯ src/__tests__/p4-5a-integrity.test.ts:210:31
    208|     });
    209|
    210|     expect(res.parsed.status).toBe('success');
       |                               ^
    211|     // La regla tautológica es degradada a agent/inferred
    212|     expect(res.parsed.cobertura.categorias.proposito.cubierta).toBe(fa…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[21/55]⎯

 FAIL  src/__tests__/p4-5a-integrity.test.ts > P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) > Criterio 4: un módulo con 2 reglas de 7 categorías no cierra sin accept_gaps, y cierra con él dejando registro
AssertionError: expected 'Falta el contexto de vista requerido …' to be 'cobertura_insuficiente' // Object.is equality

Expected: "cobertura_insuficiente"
Received: "Falta el contexto de vista requerido por la entrevista legacy. Las observaciones canónicas no lo sustituyen ni acreditan cobertura."

 ❯ src/__tests__/p4-5a-integrity.test.ts:245:35
    243|
    244|     expect(rBlocked.parsed.status).toBe('blocked');
    245|     expect(rBlocked.parsed.razon).toBe('cobertura_insuficiente');
       |                                   ^
    246|     expect(rBlocked.parsed.cobertura.sustantivas).toBe(2);
    247|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[22/55]⎯

 FAIL  src/__tests__/p4-5a-integrity.test.ts > P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) > C9a: blocked de qap_discover con auth_required incluye razon auth_required y directorio_objetivo, con claves alineadas a session_invalid
AssertionError: expected undefined to be 'auth_required' // Object.is equality

- Expected:
"auth_required"

+ Received:
undefined

 ❯ src/__tests__/p4-5a-integrity.test.ts:295:37
    293|     const resAuthReq = await callTool('qap_discover', { name: 'protegi…
    294|     expect(resAuthReq.parsed.status).toBe('blocked');
    295|     expect(resAuthReq.parsed.razon).toBe('auth_required');
       |                                     ^
    296|     expect(resAuthReq.parsed.directorio_objetivo).toBeDefined();
    297|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[23/55]⎯

 FAIL  src/__tests__/p4-5a-integrity.test.ts > P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) > C4-a: from_option con pregunta_id inexistente, opcion_id inexistente o sin texto sustantivo (rechazo o degradación a agent/inferred)
AssertionError: expected 'blocked' to be 'error' // Object.is equality

Expected: "error"
Received: "blocked"

 ❯ src/__tests__/p4-5a-integrity.test.ts:451:41
    449|       ],
    450|     });
    451|     expect(rInexistenteQ.parsed.status).toBe('error');
       |                                         ^
    452|
    453|     // 2. from_option con pregunta_id inexistente pero con description…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[24/55]⎯

 FAIL  src/__tests__/p4-5a-integrity.test.ts > P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) > C4-b: límites de sustantividad (2 palabras o 19 caracteres no cubren; 3 palabras y 20 caracteres sí)
Error: ENOENT: no such file or directory, open '<FIXTURE_TEMP>'
 ❯ src/__tests__/p4-5a-integrity.test.ts:535:28
    533|       rules: [{ category: 'proposito', user_text: 'PalabraUnica Palabr…
    534|     });
    535|     const rf1 = YAML.parse(readFileSync(join(tempDir, '.qa', 'modules'…
       |                            ^
    536|     const pRule = rf1.rules.find((r: { category: string }) => r.catego…
    537|     expect(pRule.source).toBe('user_text');

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
Serialized Error: { errno: -4058, code: 'ENOENT', syscall: 'open', path: '<FIXTURE_TEMP>' }
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[25/55]⎯

 FAIL  src/__tests__/p4-5a-integrity.test.ts > P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) > C4-c: accept_gaps con razón de 14 caracteres bloquea y con 15 cierra y deja el registro
AssertionError: expected 'Falta el contexto de vista requerido …' to be 'cobertura_insuficiente' // Object.is equality

Expected: "cobertura_insuficiente"
Received: "Falta el contexto de vista requerido por la entrevista legacy. Las observaciones canónicas no lo sustituyen ni acreditan cobertura."

 ❯ src/__tests__/p4-5a-integrity.test.ts:597:30
    595|     });
    596|     expect(r14.parsed.status).toBe('blocked');
    597|     expect(r14.parsed.razon).toBe('cobertura_insuficiente');
       |                              ^
    598|
    599|     // Intento con razón de exactamente 15 caracteres -> debe cerrar f…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[26/55]⎯

 FAIL  src/__tests__/p4-5a-integrity.test.ts > P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) > C4-d: plan con auth.required true sin roles queda bloqueado con pregunta de roles y bloquea discover (V4)
TypeError: .toMatch() expects to receive a string, but got undefined
 ❯ src/__tests__/p4-5a-integrity.test.ts:640:43
    638|     const rDiscoverBlocked = await callTool('qap_discover', { name: 'p…
    639|     expect(rDiscoverBlocked.parsed.status).toBe('blocked');
    640|     expect(rDiscoverBlocked.parsed.razon).toMatch(/No se puede ejecuta…
       |                                           ^
    641|   });
    642|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[27/55]⎯

 FAIL  src/__tests__/p4-5a-integrity.test.ts > P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) > C1: campos honestos en bloqueos previos a navegar y navegación real
AssertionError: expected undefined to be 'auth_required' // Object.is equality

- Expected:
"auth_required"

+ Received:
undefined

 ❯ src/__tests__/p4-5a-integrity.test.ts:670:22
    668|     const p1 = rBlockedPreNav.parsed;
    669|     expect(p1.status).toBe('blocked');
    670|     expect(p1.razon).toBe('auth_required');
       |                      ^
    671|     expect(p1.requested_url).toBe('/seguro');
    672|     expect(p1.final_url).toBeNull();

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[28/55]⎯

 FAIL  src/__tests__/p4-5a-integrity.test.ts > P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) > C3: flujo real de preguntas de categoría, formato una_opcion, persistencia y respuestas user_text y deferred
AssertionError: expected 'blocked' to be 'success' // Object.is equality

Expected: "success"
Received: "blocked"

 ❯ src/__tests__/p4-5a-integrity.test.ts:716:33
    714|     // 1. qap_discover emite pregunta de categoría con formato una_opc…
    715|     const rDisc = await callTool('qap_discover', { name: 'items', path…
    716|     expect(rDisc.parsed.status).toBe('success');
       |                                 ^
    717|     const pEmitted = rDisc.parsed.siguiente_accion?.pregunta;
    718|     expect(pEmitted).toBeDefined();

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[29/55]⎯

 FAIL  src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C1: Clasificación honesta con adaptador real > C1-a: módulo de acceso pedido en login sin redirección NO se bloquea (page_kind login, success)
AssertionError: expected 'blocked' to be 'success' // Object.is equality

Expected: "success"
Received: "blocked"

 ❯ src/__tests__/p4-5a2-integrity.test.ts:127:31
    125|
    126|       const r = await callTool('qap_discover', { name: 'modulo_acceso'…
    127|       expect(r.parsed.status).toBe('success');
       |                               ^
    128|       expect(r.parsed.page_kind).toBe('login');
    129|       expect(r.parsed.observed).toBe(true);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[30/55]⎯

 FAIL  src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C1: Clasificación honesta con adaptador real > C1-b: ruta protegida con redirección HTTP 302 a /login detecta auth_wall determinista y bloquea
AssertionError: expected undefined to be 'auth_required' // Object.is equality

- Expected:
"auth_required"

+ Received:
undefined

 ❯ src/__tests__/p4-5a2-integrity.test.ts:144:30
    142|       const r = await callTool('qap_discover', { name: 'panel_admin', …
    143|       expect(r.parsed.status).toBe('blocked');
    144|       expect(r.parsed.razon).toBe('auth_required');
       |                              ^
    145|       expect(r.parsed.page_kind).toBe('auth_wall');
    146|       expect(r.parsed.observed).toBe(true);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[31/55]⎯

 FAIL  src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C1: Clasificación honesta con adaptador real > C1-c: ruta protegida con guard del lado del cliente detecta auth_wall con redirección al login
AssertionError: expected undefined to be 'auth_required' // Object.is equality

- Expected:
"auth_required"

+ Received:
undefined

 ❯ src/__tests__/p4-5a2-integrity.test.ts:161:30
    159|       const r = await callTool('qap_discover', { name: 'modulo_cliente…
    160|       expect(r.parsed.status).toBe('blocked');
    161|       expect(r.parsed.razon).toBe('auth_required');
       |                              ^
    162|       expect(r.parsed.page_kind).toBe('auth_wall');
    163|       expect(r.parsed.observed).toBe(true);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[32/55]⎯

 FAIL  src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C3: Integridad de categoría en from_option y regla de cobertura completa > C3-a: la categoría de from_option se toma siempre de la pregunta pendiente persistida
AssertionError: expected 'blocked' to be 'success' // Object.is equality

Expected: "success"
Received: "blocked"

 ❯ src/__tests__/p4-5a2-integrity.test.ts:289:31
    287|       });
    288|
    289|       expect(r.parsed.status).toBe('success');
       |                               ^
    290|       const rf = YAML.parse(readFileSync(join(tempDir, '.qa', 'modules…
    291|       const saved = rf.rules.find((rule: { id: string }) => rule.id.in…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[33/55]⎯

 FAIL  src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C3: Integridad de categoría en from_option y regla de cobertura completa > C3-b: si la petición declara una categoría distinta a la de la pregunta pendiente se rechaza con blocked
AssertionError: the given combination of arguments (undefined and string) is invalid for this assertion. You can use an array, a map, an object, a set, a string, or a weakset instead of a string
 ❯ src/__tests__/p4-5a2-integrity.test.ts:334:30
    332|
    333|       expect(r.parsed.status).toBe('blocked');
    334|       expect(r.parsed.error).toContain("Categoría discordante al resol…
       |                              ^
    335|     });
    336|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[34/55]⎯

 FAIL  src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C4: Flujo de respuestas cortas como borrador y propuesta de enunciado > C4-a: respuesta corta se guarda como borrador (status inferred, source user_text, borrador true) y no cubre
AssertionError: expected 'blocked' to be 'success' // Object.is equality

Expected: "success"
Received: "blocked"

 ❯ src/__tests__/p4-5a2-integrity.test.ts:385:31
    383|       });
    384|
    385|       expect(r.parsed.status).toBe('success');
       |                               ^
    386|       expect(r.parsed.cobertura.categorias.proposito?.cubierta).toBe(f…
    387|       expect(r.parsed.siguiente_accion?.tipo).toBe('trabajo');

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[35/55]⎯

 FAIL  src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C4: Flujo de respuestas cortas como borrador y propuesta de enunciado > C4-b: derivación determinista en categoría actor que nombra roles emite Pregunta una_opcion directamente
AssertionError: expected 'blocked' to be 'success' // Object.is equality

Expected: "success"
Received: "blocked"

 ❯ src/__tests__/p4-5a2-integrity.test.ts:416:31
    414|       });
    415|
    416|       expect(r.parsed.status).toBe('success');
       |                               ^
    417|       expect(r.parsed.siguiente_accion?.tipo).toBe('decision');
    418|       const q = r.parsed.siguiente_accion?.pregunta;

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[36/55]⎯

 FAIL  src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C4: Flujo de respuestas cortas como borrador y propuesta de enunciado > C4-c: envío de propuesta_enunciado válida para un borrador emite Pregunta una_opcion con las 3 opciones
AssertionError: expected 'blocked' to be 'success' // Object.is equality

Expected: "success"
Received: "blocked"

 ❯ src/__tests__/p4-5a2-integrity.test.ts:450:40
    448|       });
    449|
    450|       expect(rPropuesta.parsed.status).toBe('success');
       |                                        ^
    451|       expect(rPropuesta.parsed.siguiente_accion?.tipo).toBe('decision'…
    452|       const q = rPropuesta.parsed.siguiente_accion?.pregunta;

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[37/55]⎯

 FAIL  src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C4: Flujo de respuestas cortas como borrador y propuesta de enunciado > C4-d: resolver con "Es correcto" guarda regla confirmed user_confirmed con enunciado exacto y cubre
TypeError: Cannot read properties of undefined (reading 'id')
 ❯ src/__tests__/p4-5a2-integrity.test.ts:482:58
    480|         propuesta_enunciado: enunciado,
    481|       });
    482|       const qId = rProp.parsed.siguiente_accion.pregunta.id;
       |                                                          ^
    483|
    484|       // 3. Confirmar con "Es correcto"

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[38/55]⎯

 FAIL  src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C4: Flujo de respuestas cortas como borrador y propuesta de enunciado > C4-e: resolver con "Lo defino después" guarda regla deferred y no cubre
TypeError: Cannot read properties of undefined (reading 'id')
 ❯ src/__tests__/p4-5a2-integrity.test.ts:526:58
    524|         propuesta_enunciado: 'Este módulo gestiona la creación y aprob…
    525|       });
    526|       const qId = rProp.parsed.siguiente_accion.pregunta.id;
       |                                                          ^
    527|
    528|       const rDef = await callTool('qap_rules_set', {

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[39/55]⎯

 FAIL  src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C4: Flujo de respuestas cortas como borrador y propuesta de enunciado > C4-f: propuesta_enunciado corta o genérica es rechazada con status error
AssertionError: expected 'blocked' to be 'error' // Object.is equality

Expected: "error"
Received: "blocked"

 ❯ src/__tests__/p4-5a2-integrity.test.ts:562:36
    560|         propuesta_enunciado: 'texto muy corto',
    561|       });
    562|       expect(rShort.parsed.status).toBe('error');
       |                                    ^
    563|       expect(rShort.parsed.error).toContain('umbral sustantivo');
    564|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[40/55]⎯

 FAIL  src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C10: Detección y advertencia de extracción vacía > C10-a: página app/login sin elementos interactivos genera advertencia extraccion_vacia y trabajo
AssertionError: expected 'blocked' to be 'success' // Object.is equality

Expected: "success"
Received: "blocked"

 ❯ src/__tests__/p4-5a2-integrity.test.ts:732:31
    730|
    731|       const r = await callTool('qap_discover', { name: 'modulo_vacio',…
    732|       expect(r.parsed.status).toBe('success');
       |                               ^
    733|       expect(r.parsed.advertencias).toBeDefined();
    734|       expect(r.parsed.advertencias).toContain('extraccion_vacia');

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[41/55]⎯

 FAIL  src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C10: Detección y advertencia de extracción vacía > C10-b: página con al menos un elemento interactivo no genera advertencia extraccion_vacia
AssertionError: expected 'blocked' to be 'success' // Object.is equality

Expected: "success"
Received: "blocked"

 ❯ src/__tests__/p4-5a2-integrity.test.ts:754:31
    752|
    753|       const r = await callTool('qap_discover', { name: 'modulo_login',…
    754|       expect(r.parsed.status).toBe('success');
       |                               ^
    755|       expect(r.parsed.advertencias).toBeUndefined();
    756|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[42/55]⎯

 FAIL  src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C10: Detección y advertencia de extracción vacía > C10-c: la advertencia extraccion_vacia es agnóstica de la aplicación
AssertionError: expected 'blocked' to be 'success' // Object.is equality

Expected: "success"
Received: "blocked"

 ❯ src/__tests__/p4-5a2-integrity.test.ts:770:31
    768|
    769|       const r = await callTool('qap_discover', { name: 'modulo_agnosti…
    770|       expect(r.parsed.status).toBe('success');
       |                               ^
    771|       expect(r.parsed.advertencias).toContain('extraccion_vacia');
    772|     });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[43/55]⎯

 FAIL  src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C3: Transliteración NFD de slugs y prevención de módulos fuera del plan > C1-c: módulo con tilde preserva nombre en lifecycle, crea directorio y normaliza pending_questions con transliteración NFD
AssertionError: expected false to be true // Object.is equality

- Expected
+ Received

- true
+ false

 ❯ src/__tests__/p4-5a2-integrity.test.ts:837:34
    835|       await callTool('qap_discover', { name: modName, path: '/asignaci…
    836|       const modDir = join(tempDir, '.qa', 'modules', modName);
    837|       expect(existsSync(modDir)).toBe(true);
       |                                  ^
    838|
    839|       await callTool('qap_rules_set', {

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[44/55]⎯

 FAIL  src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C3: Transliteración NFD de slugs y prevención de módulos fuera del plan > C2-seguimiento: selección de "Corregir" emite pregunta de seguimiento y no persiste regla espuria en rules.yaml
AssertionError: expected undefined to be defined
 ❯ src/__tests__/p4-5a2-integrity.test.ts:877:17
    875|       });
    876|       const q = rProp.parsed.siguiente_accion?.pregunta;
    877|       expect(q).toBeDefined();
       |                 ^
    878|
    879|       // 3. Responder Corregir

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[45/55]⎯

 FAIL  src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > debe descubrir modulos y responder en desarrollo para qap_plan y qap_test
AssertionError: expected true to be falsy

- Expected
+ Received

- false
+ true

 ❯ src/__tests__/server.test.ts:267:36
    265|       {}
    266|     );
    267|     expect(discoverResult.isError).toBeFalsy();
       |                                    ^
    268|     const parsedDiscover = JSON.parse(discoverResult.content[0].text);
    269|     expect(parsedDiscover.status).toBe('success');

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[46/55]⎯

 FAIL  src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > el contexto de vista generado por qap_discover debe validar contra module-view.schema.json (Criterio 4)
AssertionError: expected true to be falsy

- Expected
+ Received

- false
+ true

 ❯ src/__tests__/server.test.ts:637:36
    635|       {}
    636|     );
    637|     expect(discoverResult.isError).toBeFalsy();
       |                                    ^
    638|     const discoverText = String(discoverResult.content[0]?.text);
    639|     const parsedDiscover = JSON.parse(discoverText) as { status: strin…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[47/55]⎯

 FAIL  src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > qap_discover con contexto de vista inválido no debe escribir archivos y debe retornar error (Criterio 4)
AssertionError: expected 'blocked' to be 'error' // Object.is equality

Expected: "error"
Received: "blocked"

 ❯ src/__tests__/server.test.ts:724:27
    722|       errors?: Array<{ message: string }>;
    723|     };
    724|     expect(parsed.status).toBe('error');
       |                           ^
    725|     expect(parsed.message).toContain('module-view.schema.json');
    726|     expect(parsed.errors).toBeDefined();

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[48/55]⎯

 FAIL  src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > E0a: qap_discover valida contra module-view.schema.json en camino de fallo de Playwright
AssertionError: expected true to be falsy

- Expected
+ Received

- false
+ true

 ❯ src/__tests__/server.test.ts:784:25
    782|       {}
    783|     );
    784|     expect(res.isError).toBeFalsy();
       |                         ^
    785|     const parsed = JSON.parse(res.content[0].text);
    786|     expect(parsed.status).toBe('success');

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[49/55]⎯

 FAIL  src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > E0b: qap_discover valida contra module-view.schema.json en vista de autenticacion con session_saved true
AssertionError: expected true to be falsy

- Expected
+ Received

- false
+ true

 ❯ src/__tests__/server.test.ts:848:25
    846|       {}
    847|     );
    848|     expect(res.isError).toBeFalsy();
       |                         ^
    849|     const parsed = JSON.parse(res.content[0].text);
    850|     expect(parsed.status).toBe('success');

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[50/55]⎯

 FAIL  src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > E0c: qap_discover valida contra module-view.schema.json en vista con routes_found vacio
AssertionError: expected true to be falsy

- Expected
+ Received

- false
+ true

 ❯ src/__tests__/server.test.ts:912:25
    910|       {}
    911|     );
    912|     expect(res.isError).toBeFalsy();
       |                         ^
    913|     const parsed = JSON.parse(res.content[0].text);
    914|     expect(parsed.status).toBe('success');

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[51/55]⎯

 FAIL  src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > qap_discover: gating por fase y estado de modulo, actualizacion planned -> observed
AssertionError: expected undefined to be 'ONBOARDING' // Object.is equality

- Expected:
"ONBOARDING"

+ Received:
undefined

 ❯ src/__tests__/server.test.ts:1261:58
    1259|     );
    1260|     expect(JSON.parse(bOnboarding.content[0].text).status).toBe('block…
    1261|     expect(JSON.parse(bOnboarding.content[0].text).fase).toBe('ONBOARD…
       |                                                          ^
    1262|
    1263|     // Pasar a SCOPING

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[52/55]⎯

 FAIL  src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > Criterio 7: Proyecto legacy sin campos de negocio valida contra el schema y qap_status responde con fase WORKING derivada
AssertionError: expected 'blocked' to be 'success' // Object.is equality

Expected: "success"
Received: "blocked"

 ❯ src/__tests__/server.test.ts:1411:56
    1409|       {}
    1410|     );
    1411|     expect(JSON.parse(discRes.content[0].text).status).toBe('success');
       |                                                        ^
    1412|   });
    1413|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[53/55]⎯

 FAIL  src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > Criterio 8 (E2E): init -> status (entrevista) -> ingest -> context_set compuerta -> auto-SCOPING -> session_plan -> auto-WORKING -> discover
AssertionError: expected undefined to be 'ONBOARDING' // Object.is equality

- Expected:
"ONBOARDING"

+ Received:
undefined

 ❯ src/__tests__/server.test.ts:1445:33
    1443|     const pDiscPremature = JSON.parse(discPremature.content[0].text);
    1444|     expect(pDiscPremature.status).toBe('blocked');
    1445|     expect(pDiscPremature.fase).toBe('ONBOARDING');
       |                                 ^
    1446|     expect(pDiscPremature.desbloquear_con.tool).toBe('qap_context_set'…
    1447|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[54/55]⎯

 FAIL  src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > qap_rules_set: actualiza reglas, transiciona observed -> interviewing, recalcula cobertura y actualiza guidance
AssertionError: expected 'planned' to be 'observed' // Object.is equality

Expected: "observed"
Received: "planned"

 ❯ src/__tests__/server.test.ts:1604:46
    1602|       readFileSync(join(tempDir, '.qa', 'project', 'lifecycle.json'), …
    1603|     );
    1604|     expect(statePostDisc.modules.auth.state).toBe('observed');
       |                                              ^
    1605|
    1606|     // 2. Invocar qap_rules_set para confirmar una regla y establecer …

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[55/55]⎯


 Test Files  7 failed | 16 passed (23)
      Tests  55 failed | 407 passed (462)
   Start at  01:00:18
   Duration  136.52s (transform 1.66s, setup 0ms, import 22.58s, tests 107.79s, environment 2ms)

JSON report written to <ARTEFACTOS>/mcp.json
undefined
<WORKTREE>\packages\mcp:
[ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL] Command failed with exit code 1: vitest run "--maxWorkers=1" "--reporter=verbose" "--reporter=json" "--outputFile.json=<ARTEFACTOS>/mcp.json"

```

## runner

```text

 RUN  v4.1.11 <WORKTREE>/packages/playwright-runner

 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 1: Empty Cases Execution Honesty > C1.1: empty cases array returns result failed with total=0, passed=0, failed=0 13ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 1: Empty Cases Execution Honesty > C1.2: omitted cases property (undefined) defaults safely and returns failed 6ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 1: Empty Cases Execution Honesty > C1.3: empty cases execution acquires and cleans up module lock without leaving dangling locks 7ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 1: Empty Cases Execution Honesty > C1.4: empty cases never initiates browser launch 7ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 2: Unsupported / Unknown Step Actions > C2.1: step with unsupported action fails step and case, never returns passed 8ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 2: Unsupported / Unknown Step Actions > C2.2: step with malicious eval action is rejected cleanly as unsupported 8ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 2: Unsupported / Unknown Step Actions > C2.3: step missing type property entirely defaults to desconocido and fails 8ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 2: Unsupported / Unknown Step Actions > C2.4: step with empty string type fails explicitly 9ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 3: Skipped / Not_Run Cases Dependency Propagation > C3.1: transitive dependency failure cascades not_run through deep chain 7ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 3: Skipped / Not_Run Cases Dependency Propagation > C3.2: diamond dependency DAG cascades correctly when root fails 7ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 3: Skipped / Not_Run Cases Dependency Propagation > C3.3: dependent case pointing to non-existent case is safely skipped as not_run 6ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 3: Skipped / Not_Run Cases Dependency Propagation > C3.4: self-dependency (cycle of 1) is safely skipped as not_run without infinite loop 6ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 3: Skipped / Not_Run Cases Dependency Propagation > C3.5: mutual circular dependency (A depends on B, B depends on A) safely skips both as not_run 6ms
stderr | test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 5: Infrastructure Errors vs Functional Failures > C5.1: Chromium launch failure produces result error, 0 failed, all not_run with structured reasons
[PlaywrightRunner] Error de infraestructura al iniciar el navegador Chromium: Error: Executable doesn't exist at C:\Users\Fake\AppData\Local\ms-playwright\chromium
    at <WORKTREE>/packages/playwright-runner/test/adversarial-stress.test.ts:546:9
    at file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:302:11
    at file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:26
    at file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:2326:20
    at new Promise (<anonymous>)
    at runWithCancel (file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:2323:10)
    at file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:2305:20
    at new Promise (<anonymous>)
    at runWithTimeout (file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:2272:10)
    at file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:2956:64

stderr | test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 5: Infrastructure Errors vs Functional Failures > C5.2: Chromium launch timeout produces result error without lock leakage
[PlaywrightRunner] Error de infraestructura al iniciar el navegador Chromium: Error: browserType.launch: Timeout 30000ms exceeded.
    at <WORKTREE>/packages/playwright-runner/test/adversarial-stress.test.ts:576:9
    at file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:302:11
    at file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:26
    at file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:2326:20
    at new Promise (<anonymous>)
    at runWithCancel (file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:2323:10)
    at file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:2305:20
    at new Promise (<anonymous>)
    at runWithTimeout (file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:2272:10)
    at file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:2956:64

stderr | test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 5: Infrastructure Errors vs Functional Failures > C5.3: infrastructure error ExecutionResult satisfies strict schema validation
[PlaywrightRunner] Error de infraestructura al iniciar el navegador Chromium: Error: Failed to launch browser: headless_shell missing
    at <WORKTREE>/packages/playwright-runner/test/adversarial-stress.test.ts:599:9
    at file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:302:11
    at file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:26
    at file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:2326:20
    at new Promise (<anonymous>)
    at runWithCancel (file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:2323:10)
    at file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:2305:20
    at new Promise (<anonymous>)
    at runWithTimeout (file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:2272:10)
    at file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:2956:64

 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 4: Project Root Isolation & No CWD Dependency > C4.1: runner confines lock acquisition to options.projectRoot without polluting process.cwd() 6ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 4: Project Root Isolation & No CWD Dependency > C4.2: screenshotsDir resolves relative to options.projectRoot 6ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 5: Infrastructure Errors vs Functional Failures > C5.1: Chromium launch failure produces result error, 0 failed, all not_run with structured reasons 10ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 5: Infrastructure Errors vs Functional Failures > C5.2: Chromium launch timeout produces result error without lock leakage 9ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 5: Infrastructure Errors vs Functional Failures > C5.3: infrastructure error ExecutionResult satisfies strict schema validation 69ms
stderr | test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 6: Host MCP Process Protection & Signals > C6.3: pre-aborted cancellation returns error and accounts for every unexecuted case
[PlaywrightRunner] Error crítico durante la ejecución: Error: Ejecución cancelada por AbortSignal.
    at PlaywrightRunner.execute (<WORKTREE>/packages/playwright-runner/src/runner.ts:178:15)
    at <WORKTREE>/packages/playwright-runner/test/adversarial-stress.test.ts:665:35
    at file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:302:11
    at file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:26
    at file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:2326:20
    at new Promise (<anonymous>)
    at runWithCancel (file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:2323:10)
    at file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:2305:20
    at new Promise (<anonymous>)
    at runWithTimeout (file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:2272:10)

 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 6: Host MCP Process Protection & Signals > C6.1: runner NEVER calls process.exit under any circumstances in default mode 16ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 6: Host MCP Process Protection & Signals > C6.2: runner does NOT register uncleaned global signal listeners 6ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 6: Host MCP Process Protection & Signals > C6.3: pre-aborted cancellation returns error and accounts for every unexecuted case 4ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 6: Host MCP Process Protection & Signals > C6.4: cooperative cancellation mid-execution marks remaining cases not_run without crashing process 8ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 7: High Volume & Stress Testing > C7.1: stress-tests large DAG with 25 interdependent cases 55ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 7: High Volume & Stress Testing > C7.2: concurrent runner executions in distinct workspaces do not interfere 12ms
stderr | test/runner-safety-honesty.test.ts > PlaywrightRunner Safety & Honesty Regressions — VNEXT-014-C1 (R2) > REG-R2-04: classifies Chromium launch failure as infrastructure error with not_run cases (FAIL BEFORE / PASS AFTER)
[PlaywrightRunner] Error de infraestructura al iniciar el navegador Chromium: Error: Executable doesn't exist at C:\Users\Fake\AppData\Local\ms-playwright\chromium
    at <WORKTREE>/packages/playwright-runner/test/runner-safety-honesty.test.ts:106:7
    at file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:302:11
    at file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:26
    at file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:2326:20
    at new Promise (<anonymous>)
    at runWithCancel (file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:2323:10)
    at file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:2305:20
    at new Promise (<anonymous>)
    at runWithTimeout (file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:2272:10)
    at file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:2956:64

 ✓ test/runner-safety-honesty.test.ts > PlaywrightRunner Safety & Honesty Regressions — VNEXT-014-C1 (R2) > REG-R2-01: honors options.projectRoot and avoids assuming process.cwd() (FAIL BEFORE / PASS AFTER) 25ms
 ✓ test/runner-safety-honesty.test.ts > PlaywrightRunner Safety & Honesty Regressions — VNEXT-014-C1 (R2) > REG-R2-02: zero cases executed never produces passed verdict (FAIL BEFORE / PASS AFTER) 7ms
 ✓ test/runner-safety-honesty.test.ts > PlaywrightRunner Safety & Honesty Regressions — VNEXT-014-C1 (R2) > REG-R2-03: unknown or unsupported step types fail explicitly (FAIL BEFORE / PASS AFTER) 2ms
 ✓ test/runner-safety-honesty.test.ts > PlaywrightRunner Safety & Honesty Regressions — VNEXT-014-C1 (R2) > REG-R2-04: classifies Chromium launch failure as infrastructure error with not_run cases (FAIL BEFORE / PASS AFTER) 12ms
stderr | test/runner-safety-honesty.test.ts > PlaywrightRunner Safety & Honesty Regressions — VNEXT-014-C1 (R2) > REG-R2-11: a browser-context setup failure reports an error and every planned case as not_run
[PlaywrightRunner] Error crítico durante la ejecución: Error: Browser context could not be allocated
    at <WORKTREE>/packages/playwright-runner/test/runner-safety-honesty.test.ts:375:49
    at file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:302:11
    at file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:26
    at file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:2326:20
    at new Promise (<anonymous>)
    at runWithCancel (file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:2323:10)
    at file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:2305:20
    at new Promise (<anonymous>)
    at runWithTimeout (file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:2272:10)
    at file:///<WORKTREE>/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:2956:64

 ✓ test/runner-safety-honesty.test.ts > PlaywrightRunner Safety & Honesty Regressions — VNEXT-014-C1 (R2) > REG-R2-05: produces execution result strictly compliant with schema without rejected properties (FAIL BEFORE / PASS AFTER) 63ms
 ✓ test/runner-safety-honesty.test.ts > PlaywrightRunner Safety & Honesty Regressions — VNEXT-014-C1 (R2) > REG-R2-06: propagates DAG dependencies skipping blocked cases and preserves unrun cases on failFast (FAIL BEFORE / PASS AFTER) 16ms
 ✓ test/runner-safety-honesty.test.ts > PlaywrightRunner Safety & Honesty Regressions — VNEXT-014-C1 (R2) > REG-R2-07: host MCP process safety: does not call process.exit or install global exit listeners by default (FAIL BEFORE / PASS AFTER) 6ms
 ✓ test/runner-safety-honesty.test.ts > PlaywrightRunner Safety & Honesty Regressions — VNEXT-014-C1 (R2) > REG-R2-08: prevents implicit auto-login and unattended browser launch when allowImplicitAuth is false (FAIL BEFORE / PASS AFTER) 17ms
 ✓ test/runner-safety-honesty.test.ts > PlaywrightRunner Safety & Honesty Regressions — VNEXT-014-C1 (R2) > REG-R2-09: isUrlAllowedByPolicy correctly verifies origins and wildcards (FAIL BEFORE / PASS AFTER) 1ms
 ✓ test/runner-safety-honesty.test.ts > PlaywrightRunner Safety & Honesty Regressions — VNEXT-014-C1 (R2) > REG-R2-10: separate runs cannot overwrite one another when Date.now collides 15ms
 ✓ test/runner-safety-honesty.test.ts > PlaywrightRunner Safety & Honesty Regressions — VNEXT-014-C1 (R2) > REG-R2-11: a browser-context setup failure reports an error and every planned case as not_run 8ms
 ✓ test/runner.test.ts > PlaywrightRunner (S7-001) > ejecuta un plan sin casos y devuelve un ExecutionResult válido 11ms
 ✓ test/runner.test.ts > PlaywrightRunner (S7-001) > ejecuta un caso real usando storageResolver y navega sin consumir tokens de IA 457ms
 ✓ test/runner.test.ts > PlaywrightRunner (S7-001) > con sesión válida inyectada vía resolveModuleSession, accede a ruta protegida sin redirigir a /login 449ms
 ✓ test/session-resolver.test.ts > session-resolver (S75-006A) > debe retornar null si el módulo no requiere autenticación 14ms
 ✓ test/session-resolver.test.ts > session-resolver (S75-006A) > debe recuperar y descifrar una sesión válida guardada en el SessionStore (AES-256-GCM) 47ms
 ✓ test/session-resolver.test.ts > session-resolver (S75-006A) > debe detectar sesión expirada y descartarla 31ms
 ✓ test/session-resolver.test.ts > session-resolver (S75-006A) > ante sesión expirada, ejecuta re-login automático (login_mode: auto) y guarda la nueva sesión 253ms
 ✓ src/__tests__/actions-context.test.ts > Acciones S7-005 (capture, evaluate, switch_auth) > captura el texto de un elemento y lo guarda en las variables de contexto 79ms
 ✓ src/__tests__/actions-context.test.ts > Acciones S7-005 (capture, evaluate, switch_auth) > captura el value de un input, no su textContent 34ms
 ✓ src/__tests__/actions-context.test.ts > Acciones S7-005 (capture, evaluate, switch_auth) > evaluate puede leer una variable capturada previamente vía ctx 4ms
 ✓ src/__tests__/actions-context.test.ts > Acciones S7-005 (capture, evaluate, switch_auth) > evaluate lee el DOM real de la página y guarda el resultado en capture_as 19ms
 ✓ src/__tests__/actions-context.test.ts > Acciones S7-005 (capture, evaluate, switch_auth) > switch_auth lanza un error claro si no se definió auth_profile 1ms
 ✓ src/__tests__/actions-context.test.ts > Acciones S7-005 (capture, evaluate, switch_auth) > switch_auth lanza un error claro si no existe sesión válida para el perfil 9ms
 ✓ test/actions.test.ts > Acciones base del runner (S7-003) > navigate espera a que la carga de la página termine 55ms
 ✓ test/actions.test.ts > Acciones base del runner (S7-003) > navigate lanza un error claro si falta la url 2ms
 ✓ test/actions.test.ts > Acciones base del runner (S7-003) > click hace scroll automático hasta un elemento fuera del viewport 175ms
 ✓ test/actions.test.ts > Acciones base del runner (S7-003) > click lanza un error claro si falta el selector 1ms
 ✓ test/actions.test.ts > Acciones base del runner (S7-003) > fill espera visibilidad y escribe el valor en el input 82ms
 ✓ test/actions.test.ts > Acciones base del runner (S7-003) > fill reemplaza el valor previo en vez de concatenarlo 58ms
 ✓ test/actions.test.ts > Acciones base del runner (S7-003) > fill lanza un error claro si falta el value 14ms
 ✓ test/lifecycle.test.ts > RunnerLifecycle (S7-002) > inicializa el navegador y crea contextos aislados por caso 307ms
 ✓ test/lifecycle.test.ts > RunnerLifecycle (S7-002) > aplica el viewport configurado 316ms
 ✓ test/lifecycle.test.ts > RunnerLifecycle (S7-002) > crea una pagina aislada por paso dentro del mismo caso 677ms
 ✓ test/lifecycle.test.ts > RunnerLifecycle (S7-002) > cleanup() cierra el navegador y es seguro llamarlo varias veces 211ms
 ✓ test/lifecycle.test.ts > RunnerLifecycle (S7-002) > ante SIGINT, invoca cleanup() y termina el proceso de forma segura 628ms
 ✓ src/__tests__/interpolator.test.ts > Interpolador de variables de contexto (S7-006) > reemplaza una sola variable dentro de un string 3ms
 ✓ src/__tests__/interpolator.test.ts > Interpolador de variables de contexto (S7-006) > reemplaza múltiples variables distintas en el mismo string 0ms
 ✓ src/__tests__/interpolator.test.ts > Interpolador de variables de contexto (S7-006) > deja intacto un string sin ningún placeholder 0ms
 ✓ src/__tests__/interpolator.test.ts > Interpolador de variables de contexto (S7-006) > lanza un error claro si la variable referenciada no existe 2ms
 ✓ src/__tests__/interpolator.test.ts > Interpolador de variables de contexto (S7-006) > interpolateStep reemplaza selector, value y url de un step 1ms
 ✓ src/__tests__/interpolator.test.ts > Interpolador de variables de contexto (S7-006) > interpolateStep NO toca el campo expression (evaluate usa ctx directamente) 0ms
 ✓ src/__tests__/interpolator.test.ts > Interpolador de variables de contexto (S7-006) > interpolateStep no modifica el step original (devuelve una copia) 0ms
 ✓ src/__tests__/actions.test.ts > Acciones S7-004 (assert, waitFor) > debe validar aserción visible y contains correctamente 58ms
 ✓ src/__tests__/actions.test.ts > Acciones S7-004 (assert, waitFor) > debe fallar si la aserción no se cumple 11ms
 ✓ src/__tests__/actions.test.ts > Acciones S7-004 (assert, waitFor) > debe esperar correctamente con waitFor 108ms
 ✓ test/spike.test.ts > Spike tecnico: Chromium headless con playwright-core > debe lanzar Chromium, navegar y resolver un selector sin errores 350ms

 Test Files  10 passed (10)
      Tests  71 passed (71)
   Start at  01:02:36
   Duration  16.21s (transform 593ms, setup 0ms, import 6.84s, tests 6.01s, environment 1ms)


```

## lint-global

```text
$ eslint .

<WORKTREE>\packages\cli\src\__tests__\test-from-diff.test.ts
  6:1  warning  There should be no empty line within import group  import/order

<WORKTREE>\packages\cli\src\commands.ts
  258:23  error  Unsafe argument of type `any` assigned to a parameter of type `PruneCommandOptions`  @typescript-eslint/no-unsafe-argument

<WORKTREE>\packages\engine\src\__tests__\mocks\storage.mock.ts
  1:1  warning  Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-explicit-any' or '@typescript-eslint/no-unsafe-return')

<WORKTREE>\packages\knowledge\src\__tests__\candidate-generator.test.ts
  9:32  error  '_candidatesFile' is defined but never used  @typescript-eslint/no-unused-vars

<WORKTREE>\packages\knowledge\src\__tests__\case-generator.test.ts
  1:1  warning  There should be at least one empty line between import groups  import/order

<WORKTREE>\packages\knowledge\src\__tests__\lock-manager.test.ts
  3:1  warning  There should be at least one empty line between import groups  import/order
  4:1  warning  There should be at least one empty line between import groups  import/order

<WORKTREE>\packages\knowledge\src\storage\lock-manager.ts
   2:1  warning  There should be at least one empty line between import groups   import/order
  56:7  error    There is no `cause` attached to the symptom error being thrown  preserve-caught-error
  63:5  error    Async method 'forceUnlock' has no 'await' expression            @typescript-eslint/require-await

<WORKTREE>\packages\mcp\src\__tests__\lifecycle-v3-e2e.test.ts
  1:1  warning  Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-explicit-any')
  1:1  warning  Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-unsafe-argument')
  1:1  warning  Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-unsafe-return')

<WORKTREE>\packages\mcp\src\__tests__\p3-verification.test.ts
  1:1  warning  Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-explicit-any')
  1:1  warning  Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-unsafe-argument')
  1:1  warning  Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-unsafe-return')

<WORKTREE>\packages\mcp\src\__tests__\p4-3-1-b-block.test.ts
  1:1  warning  There should be at least one empty line between import groups          import/order
  1:1  warning  `vitest` import should occur after import of `node:path`               import/order
  5:1  warning  There should be at least one empty line between import groups          import/order
  7:1  warning  There should be at least one empty line between import groups          import/order
  8:1  warning  `../server.js` import should occur after import of `@qap/knowledge`    import/order
  9:1  warning  There should be at least one empty line between import groups          import/order
  9:1  warning  `../guidance.js` import should occur after import of `@qap/knowledge`  import/order

<WORKTREE>\packages\mcp\src\__tests__\server.test.ts
  1:1  warning  Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-unsafe-argument')
  1:1  warning  Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-explicit-any')

<WORKTREE>\packages\mcp\src\handlers\canonical-coverage-service.ts
  132:21  error  This assertion is unnecessary since it does not change the type of the expression  @typescript-eslint/no-unnecessary-type-assertion
  179:15  error  This assertion is unnecessary since it does not change the type of the expression  @typescript-eslint/no-unnecessary-type-assertion
  182:15  error  This assertion is unnecessary since it does not change the type of the expression  @typescript-eslint/no-unnecessary-type-assertion
  230:25  error  This assertion is unnecessary since it does not change the type of the expression  @typescript-eslint/no-unnecessary-type-assertion
  253:23  error  This assertion is unnecessary since it does not change the type of the expression  @typescript-eslint/no-unnecessary-type-assertion

<WORKTREE>\packages\mcp\src\handlers\module-closure-store.ts
  129:77  error  This assertion is unnecessary since it does not change the type of the expression  @typescript-eslint/no-unnecessary-type-assertion
  130:86  error  This assertion is unnecessary since it does not change the type of the expression  @typescript-eslint/no-unnecessary-type-assertion

<WORKTREE>\packages\playwright-runner\test\session-resolver.test.ts
  3:1  warning  There should be at least one empty line between import groups  import/order
  5:1  warning  There should be at least one empty line between import groups  import/order

<WORKTREE>\packages\shared\src\__tests__\domain\canonical-coverage-invariants.test.ts
  1:1  warning  There should be at least one empty line between import groups  import/order

<WORKTREE>\packages\shared\src\__tests__\domain\domain-contracts-invariants.test.ts
   15:1   warning  There should be at least one empty line between import groups                                 import/order
   41:3   error    'SENSITIVE_HTTP_HEADERS' is defined but never used                                            @typescript-eslint/no-unused-vars
   42:3   error    'SENSITIVE_CREDENTIAL_KEYS' is defined but never used                                         @typescript-eslint/no-unused-vars
  291:38  error    This assertion is unnecessary since the receiver accepts the original type of the expression  @typescript-eslint/no-unnecessary-type-assertion
  292:38  error    This assertion is unnecessary since the receiver accepts the original type of the expression  @typescript-eslint/no-unnecessary-type-assertion
  295:38  error    This assertion is unnecessary since the receiver accepts the original type of the expression  @typescript-eslint/no-unnecessary-type-assertion
  296:38  error    This assertion is unnecessary since the receiver accepts the original type of the expression  @typescript-eslint/no-unnecessary-type-assertion
  297:38  error    This assertion is unnecessary since the receiver accepts the original type of the expression  @typescript-eslint/no-unnecessary-type-assertion
  298:38  error    This assertion is unnecessary since the receiver accepts the original type of the expression  @typescript-eslint/no-unnecessary-type-assertion

<WORKTREE>\packages\shared\src\__tests__\domain\scenario-a-unknown-app.test.ts
  20:1  warning  There should be at least one empty line between import groups  import/order

<WORKTREE>\packages\shared\src\__tests__\domain\scenario-b-new-module.test.ts
  21:1  warning  There should be at least one empty line between import groups  import/order
  24:3  error    'FlowScenario' is defined but never used                       @typescript-eslint/no-unused-vars

<WORKTREE>\packages\shared\src\__tests__\domain\scenario-c-auth-and-cache.test.ts
   21:1   warning  There should be at least one empty line between import groups  import/order
  166:11  error    'archivedPasswordInput' is assigned a value but never used     @typescript-eslint/no-unused-vars

<WORKTREE>\packages\shared\src\domain\contextual-dimensions.ts
  48:9   error  "dev" is overridden by string in this union type      @typescript-eslint/no-redundant-type-constituents
  48:17  error  "staging" is overridden by string in this union type  @typescript-eslint/no-redundant-type-constituents
  48:29  error  "prod" is overridden by string in this union type     @typescript-eslint/no-redundant-type-constituents

<WORKTREE>\packages\shared\src\domain\invariants-validator.ts
   130:41  error  Unsafe argument of type `any` assigned to a parameter of type `"authorization" | "cookie" | "set-cookie" | "x-api-key" | "proxy-authorization"`                  @typescript-eslint/no-unsafe-argument
   130:53  error  Unexpected any. Specify a different type                                                                                                                         @typescript-eslint/no-explicit-any
   173:44  error  Unsafe argument of type `any` assigned to a parameter of type `"password" | "passwd" | "secret" | "token" | "raw_token" | "api_key" | "apikey" | "private_key"`  @typescript-eslint/no-unsafe-argument
   173:56  error  Unexpected any. Specify a different type                                                                                                                         @typescript-eslint/no-explicit-any
   179:45  error  Unsafe argument of type `any` assigned to a parameter of type `"authorization" | "cookie" | "set-cookie" | "x-api-key" | "proxy-authorization"`                  @typescript-eslint/no-unsafe-argument
   179:67  error  Unexpected any. Specify a different type                                                                                                                         @typescript-eslint/no-explicit-any
   203:45  error  Unsafe argument of type `any` assigned to a parameter of type `"authorization" | "cookie" | "set-cookie" | "x-api-key" | "proxy-authorization"`                  @typescript-eslint/no-unsafe-argument
   203:67  error  Unexpected any. Specify a different type                                                                                                                         @typescript-eslint/no-explicit-any
   265:28  error  This assertion is unnecessary since it does not change the type of the expression                                                                                @typescript-eslint/no-unnecessary-type-assertion
  1216:59  error  Unsafe argument of type `any` assigned to a parameter of type `object`                                                                                           @typescript-eslint/no-unsafe-argument

✖ 62 problems (34 errors, 28 warnings)
  14 errors and 28 warnings potentially fixable with the `--fix` option.

[ELIFECYCLE] Command failed with exit code 1.

```

## stdio

```text
[QAP MCP Server] Servidor iniciado correctamente en transporte Stdio.
{"transport":"server","tools":["qap_auth_add","qap_auth_list","qap_clean","qap_context_ingest","qap_context_set","qap_discover","qap_init","qap_module_close","qap_plan","qap_prune","qap_report","qap_rules_set","qap_server","qap_session_close","qap_session_plan","qap_status","qap_test","qap_validate"],"init":"success","phase":"ONBOARDING","targetPathExplicit":true}
[QAP MCP Server] Servidor iniciado correctamente en transporte Stdio.
{"transport":"cli","tools":["qap_auth_add","qap_auth_list","qap_clean","qap_context_ingest","qap_context_set","qap_discover","qap_init","qap_module_close","qap_plan","qap_prune","qap_report","qap_rules_set","qap_server","qap_session_close","qap_session_plan","qap_status","qap_test","qap_validate"],"init":"success","phase":"ONBOARDING","targetPathExplicit":true}
SERVIDOR MCP FUNCIONANDO AL 100% SOBRE STDIO

```

## probe

```text
{"result":"PASS","staleDecision":"human_review_invalid","statementDigestChanged":true,"requestDigestChanged":true,"requirements":1,"receipts":1,"history":1,"retryGatewayCalls":0,"secondConnectionExactRecord":true,"coverageBefore":{"status":"incomplete","applicable_categories_count":0,"satisfied_categories_count":0,"confirmed_requirements_count":0,"pending_requirements_count":0,"total_gaps_count":7,"unaddressed_gaps_count":7,"accepted_gaps_count":0,"category_statuses":[{"category":"functional","applicability":"unknown","confirmed_count":0,"pending_count":0,"gap_ids":["gap:catalog-key:functional:unknown_applicability"],"status":"unknown"},{"category":"business_rule","applicability":"unknown","confirmed_count":0,"pending_count":0,"gap_ids":["gap:catalog-key:business_rule:unknown_applicability"],"status":"unknown"},{"category":"security","applicability":"unknown","confirmed_count":0,"pending_count":0,"gap_ids":["gap:catalog-key:security:unknown_applicability"],"status":"unknown"},{"category":"ui","applicability":"unknown","confirmed_count":0,"pending_count":0,"gap_ids":["gap:catalog-key:ui:unknown_applicability"],"status":"unknown"},{"category":"ux","applicability":"unknown","confirmed_count":0,"pending_count":0,"gap_ids":["gap:catalog-key:ux:unknown_applicability"],"status":"unknown"},{"category":"regression","applicability":"unknown","confirmed_count":0,"pending_count":0,"gap_ids":["gap:catalog-key:regression:unknown_applicability"],"status":"unknown"},{"category":"performance","applicability":"unknown","confirmed_count":0,"pending_count":0,"gap_ids":["gap:catalog-key:performance:unknown_applicability"],"status":"unknown"}]},"coverageAfter":{"status":"incomplete","applicable_categories_count":1,"satisfied_categories_count":1,"confirmed_requirements_count":1,"pending_requirements_count":0,"total_gaps_count":6,"unaddressed_gaps_count":6,"accepted_gaps_count":0,"category_statuses":[{"category":"functional","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"business_rule","applicability":"unknown","confirmed_count":0,"pending_count":0,"gap_ids":["gap:catalog-key:business_rule:unknown_applicability"],"status":"unknown"},{"category":"security","applicability":"unknown","confirmed_count":0,"pending_count":0,"gap_ids":["gap:catalog-key:security:unknown_applicability"],"status":"unknown"},{"category":"ui","applicability":"unknown","confirmed_count":0,"pending_count":0,"gap_ids":["gap:catalog-key:ui:unknown_applicability"],"status":"unknown"},{"category":"ux","applicability":"unknown","confirmed_count":0,"pending_count":0,"gap_ids":["gap:catalog-key:ux:unknown_applicability"],"status":"unknown"},{"category":"regression","applicability":"unknown","confirmed_count":0,"pending_count":0,"gap_ids":["gap:catalog-key:regression:unknown_applicability"],"status":"unknown"},{"category":"performance","applicability":"unknown","confirmed_count":0,"pending_count":0,"gap_ids":["gap:catalog-key:performance:unknown_applicability"],"status":"unknown"}]},"execution":{"status":"not_executed","executed_count":0,"passed_count":0,"failed_count":0,"indeterminate_count":0,"note":"La cobertura de ejecución requiere ejecución con test runner (VNEXT-014). Cero certificación de ejecución en R5."},"verdict":"blocked_by_unknown_applicability","lifecycleUnchanged":true,"rulesYaml":false,"sqliteIntegrity":"ok","lifecycleSha256":"07eb018605f5e9954fe5f73fd63f6351f00fd77429c544c66851846d12f77043"}
{"nextP0ApplicabilityProbe":{"first":"closure_review_pending","second":"closure_review_pending","sameCommand":true,"coverageDigestStable":false,"requestDigestStable":false,"oldDecisionRetry":"closure_review_invalid","approvals":0,"decisions":0},"closeUnknown":{"code":"closure_preconditions_not_met","gatewayRequests":0}}

```
