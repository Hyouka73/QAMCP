# Logs saneados R4-R6

Código auditado `fbc089c02b71828994a62af1a9eb6d28e33cb4bb`. Rutas locales sustituidas por marcadores. Los títulos con token=secret o user:secret son vectores sintéticos literales del código de pruebas, no credenciales reales. No se publican SQLite, WAL, claves, perfiles o sesiones. Tiempos de consola conservados tal como los emitió el runner.

## node — salida 0

out:

~~~text
v24.15.0
~~~

## fts — salida 0

out:

~~~text
v24.15.0 [Object: null prototype] { sqlite: '3.51.3', body: 'audit' }
~~~

## pnpm — salida 0

out:

~~~text
11.3.0
~~~

## install — salida 0

out:

~~~text
Scope: all 11 workspace projects
Already up to date
Done in 799ms using pnpm v11.3.0
~~~

## typescript — salida 0

out:

~~~text
Version 5.5.4
~~~

## vitest — salida 0

out:

~~~text
vitest/4.1.11 win32-x64 node-v24.15.0
~~~

## playwright — salida 0

out:

~~~text
Version 1.63.0
~~~

## build — salida 0

out:

~~~text
Scope: 10 of 11 workspace projects
packages/shared build$ tsup src/index.ts --format esm --dts
packages/shared build: CLI Building entry: src/index.ts
packages/shared build: CLI Using tsconfig: tsconfig.json
packages/shared build: CLI tsup v8.5.1
packages/shared build: CLI Using tsup config: <WORKTREE>\packages\shared\tsup.config.ts
packages/shared build: CLI Target: es2022
packages/shared build: ESM Build start
packages/shared build: ESM dist\index.js 127.05 KB
packages/shared build: ESM ⚡️ Build success in 49ms
packages/shared build: DTS Build start
packages/shared build: DTS ⚡️ Build success in 2425ms
packages/shared build: DTS dist\index.d.ts 218.05 KB
packages/shared build: Done
packages/auth build$ tsup src/index.ts --format esm --dts
packages/engine build$ tsup src/index.ts --format esm --dts
packages/engine build: CLI Building entry: src/index.ts
packages/auth build: CLI Building entry: src/index.ts
packages/engine build: CLI Using tsconfig: tsconfig.json
packages/engine build: CLI tsup v8.5.1
packages/engine build: CLI Using tsup config: <WORKTREE>\packages\engine\tsup.config.ts
packages/auth build: CLI Using tsconfig: tsconfig.json
packages/auth build: CLI tsup v8.5.1
packages/auth build: CLI Using tsup config: <WORKTREE>\packages\auth\tsup.config.ts
packages/engine build: CLI Target: es2022
packages/auth build: CLI Target: es2022
packages/engine build: ESM Build start
packages/auth build: ESM Build start
packages/engine build: ESM dist\index.js 77.70 KB
packages/engine build: ESM ⚡️ Build success in 40ms
packages/auth build: ESM dist\index.js 24.74 KB
packages/auth build: ESM ⚡️ Build success in 41ms
packages/engine build: DTS Build start
packages/auth build: DTS Build start
packages/engine build: DTS ⚡️ Build success in 1250ms
packages/engine build: DTS dist\index.d.ts 44.73 KB
packages/engine build: Done
packages/auth build: DTS ⚡️ Build success in 1953ms
packages/auth build: DTS dist\index.d.ts 6.87 KB
packages/auth build: Done
packages/playwright-adapter build$ tsup src/index.ts --format esm --dts
packages/knowledge build$ tsup src/index.ts --format esm --dts
packages/playwright-adapter build: CLI Building entry: src/index.ts
packages/knowledge build: CLI Building entry: src/index.ts
packages/knowledge build: CLI Using tsconfig: tsconfig.json
packages/knowledge build: CLI tsup v8.5.1
packages/knowledge build: CLI Using tsup config: <WORKTREE>\packages\knowledge\tsup.config.ts
packages/playwright-adapter build: CLI Using tsconfig: tsconfig.json
packages/playwright-adapter build: CLI tsup v8.5.1
packages/playwright-adapter build: CLI Using tsup config: <WORKTREE>\packages\playwright-adapter\tsup.config.ts
packages/knowledge build: CLI Target: es2022
packages/playwright-adapter build: CLI Target: es2022
packages/knowledge build: ESM Build start
packages/playwright-adapter build: ESM Build start
packages/playwright-adapter build: ESM dist\index.js 121.39 KB
packages/playwright-adapter build: ESM ⚡️ Build success in 94ms
packages/knowledge build: ESM dist\index.js 152.25 KB
packages/knowledge build: ESM ⚡️ Build success in 110ms
packages/knowledge build: DTS Build start
packages/playwright-adapter build: DTS Build start
packages/knowledge build: DTS ⚡️ Build success in 3142ms
packages/knowledge build: DTS dist\index.d.ts 32.38 KB
packages/knowledge build: Done
packages/playwright-adapter build: DTS ⚡️ Build success in 3683ms
packages/playwright-adapter build: DTS dist\index.d.ts 23.82 KB
packages/playwright-adapter build: Done
packages/playwright-runner build$ tsup src/index.ts --format esm --dts
packages/git-adapter build$ tsup src/index.ts --format esm --dts
packages/reporter build$ tsup src/index.ts --format esm --dts
packages/git-adapter build: CLI Building entry: src/index.ts
packages/git-adapter build: CLI Using tsconfig: tsconfig.json
packages/git-adapter build: CLI tsup v8.5.1
packages/git-adapter build: CLI Using tsup config: <WORKTREE>\packages\git-adapter\tsup.config.ts
packages/git-adapter build: CLI Target: es2022
packages/git-adapter build: ESM Build start
packages/playwright-runner build: CLI Building entry: src/index.ts
packages/playwright-runner build: CLI Using tsconfig: tsconfig.json
packages/playwright-runner build: CLI tsup v8.5.1
packages/playwright-runner build: CLI Using tsup config: <WORKTREE>\packages\playwright-runner\tsup.config.ts
packages/playwright-runner build: CLI Target: es2022
packages/reporter build: CLI Building entry: src/index.ts
packages/playwright-runner build: ESM Build start
packages/reporter build: CLI Using tsconfig: tsconfig.json
packages/reporter build: CLI tsup v8.5.1
packages/reporter build: CLI Using tsup config: <WORKTREE>\packages\reporter\tsup.config.ts
packages/git-adapter build: ESM dist\index.js 2.03 KB
packages/git-adapter build: ESM ⚡️ Build success in 23ms
packages/reporter build: CLI Target: es2022
packages/reporter build: ESM Build start
packages/playwright-runner build: ESM dist\index.js 28.21 KB
packages/playwright-runner build: ESM ⚡️ Build success in 38ms
packages/reporter build: ESM dist\index.js 68.42 KB
packages/reporter build: ESM ⚡️ Build success in 56ms
packages/git-adapter build: DTS Build start
packages/playwright-runner build: DTS Build start
packages/reporter build: DTS Build start
packages/git-adapter build: DTS ⚡️ Build success in 1720ms
packages/git-adapter build: DTS dist\index.d.ts 883.00 B
packages/git-adapter build: Done
packages/reporter build: DTS ⚡️ Build success in 2509ms
packages/reporter build: DTS dist\index.d.ts 18.02 KB
packages/reporter build: Done
packages/playwright-runner build: DTS ⚡️ Build success in 3026ms
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
packages/mcp build: ESM dist\chunk-KIWZKSY6.js 401.32 KB
packages/mcp build: ESM dist\server.js         381.00 B
packages/mcp build: ESM dist\index.js          5.46 KB
packages/mcp build: ESM ⚡️ Build success in 101ms
packages/mcp build: DTS Build start
packages/mcp build: DTS ⚡️ Build success in 5407ms
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
packages/cli build: ESM dist\dist-ZJOAX4TL.js  1.93 KB
packages/cli build: ESM dist\dist-N6S6AFVU.js  1.30 KB
packages/cli build: ESM dist\chunk-DJPMBNMO.js 281.51 KB
packages/cli build: ESM dist\chunk-ULFAP6LY.js 120.98 KB
packages/cli build: ESM dist\entrypoint.js     557.96 KB
packages/cli build: ESM dist\chunk-5JLHNXWW.js 391.62 KB
packages/cli build: ESM dist\chunk-AOBXKQNP.js 1.97 KB
packages/cli build: ESM ⚡️ Build success in 220ms
packages/cli build: Done
~~~

err:

~~~text
$ pnpm run -r build
~~~

## chromium-probe — salida 0

out:

~~~text
153.0.8010.12
~~~

## r4-r6 — salida 0

out:

~~~text
RUN  v4.1.11 <WORKTREE>/packages/mcp

 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > R4-R6-I01: qap_status resumes a real pending canonical question without YAML, approval or state mutation 377ms
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
      Tests  1 passed | 42 skipped (43)
   Start at  00:11:23
   Duration  3.25s (transform 720ms, setup 0ms, import 2.53s, tests 379ms, environment 0ms)
~~~

## interview — salida 0

out:

~~~text
RUN  v4.1.11 <WORKTREE>/packages/mcp

 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > R4-R6-I01: qap_status resumes a real pending canonical question without YAML, approval or state mutation 380ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > real MCP + host inbox + physical SQLite: present, propose, approve, persist, read status, retry, reopen 197ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks confirmation with gateway none and never reflects unsafe error text 47ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks confirmation with gateway throw and never reflects unsafe error text 49ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks confirmation with gateway null and never reflects unsafe error text 50ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > MCP cannot forge authority with source 50ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > MCP cannot forge authority with status 54ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > MCP cannot forge authority with from_option 48ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > MCP cannot forge authority with verified_by 48ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > MCP cannot forge authority with trace 64ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > MCP cannot forge authority with gateway 52ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: expired 35ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: future 34ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: revoked 35ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: digest 34ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: statement 29ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: reviewer 32ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: approval 35ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: decision 32ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: long-expiry 30ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > host decision reject does not create a canonical requirement 33ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > host decision defer does not create a canonical requirement 36ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > correction invalidates exact-text approval, renews review, uses CAS and preserves physical history 52ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > pending version, idempotent draft retries, defer/resume, unknown questions and cross-module replies 42ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks unsafe context missing 26ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks unsafe context ambiguous 25ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks unsafe context inactive 31ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks unsafe context revision 30ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks unsafe context session 31ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks unsafe context foreign-project 52ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > context changes while host review runs: cannot commit approved old context 39ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > associated aggregate evidence, partial=false, never invents fields or trusts DOM instructions 172ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > associated aggregate evidence, partial=true, never invents fields or trusts DOM instructions 107ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > absence allows general business questions; unspecified formal category stays pending 31ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > separate SQLite connections CAS, rollback trigger, safe errors, no duplicate/orphan requirement 80ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > untrusted proposal is never reflected in questions, logs or SQLite without human authority 81ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > one approval cannot authorize another question, even when the host mistakenly reuses its ID 60ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > a second connection changing a requirement while the host reviews causes a CAS conflict 78ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > restart recovers confirmed records without duplicating them; pending drafts require fresh review 40ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > approval for another project cannot confirm even with the same module, question category and statement 66ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > HTML required, HTTP 200, AgentInference and reviewed traces confer no requirement authority 121ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > physical approval receipt prevents reuse for another question after restarting the host 45ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > short free answers remain non-authoritative drafts and need a substantive corrected statement 30ms

 Test Files  1 passed (1)
      Tests  43 passed (43)
   Start at  00:11:28
   Duration  5.63s (transform 716ms, setup 0ms, import 2.71s, tests 2.65s, environment 0ms)
~~~

## coverage — salida 0

out:

~~~text
RUN  v4.1.11 <WORKTREE>/packages/mcp

 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 1: Canonical Coverage & Epistemic Boundaries (R1) > blocks evaluation when module is unbound or lifecycle context has drifted 71ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 1: Canonical Coverage & Epistemic Boundaries (R1) > zero coverage from crawler observations or DOM elements alone 48ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 1: Canonical Coverage & Epistemic Boundaries (R1) > strictly enforces Invariant D-011 and R1: excludes observational requirements from confirmed coverage 47ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 1: Canonical Coverage & Epistemic Boundaries (R1) > tripartite coverage separation: execution coverage is strictly not_executed with 0 passed 42ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 2: Reproducible Gap Inventory & Non-Applicability (R2) > identifies reproducible gaps with stable IDs and formal absence types 43ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 2: Reproducible Gap Inventory & Non-Applicability (R2) > declares categories non-applicable and satisfies category status without category waivers (Amendment 6) 45ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 2: Reproducible Gap Inventory & Non-Applicability (R2) > enforces Amendment 5: accepted gaps bind receipt and transition to status accepted 45ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > blocks closure when host gateway is absent or returns null (pending) 86ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > rejects decisions with invalid request digest or expired authorization 76ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > blocks client injection of authorization fields (approvalId / signature) on MCP wire 42ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 4: Durable Persistence & Concurrency (R4) > SqliteModuleClosureStore encrypts all data with AES-256-GCM without plaintext leaks 80ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 4: Durable Persistence & Concurrency (R4) > Amendment 3: Persists relation receipt in IKnowledgeStore with ZERO module.revision mutation 67ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 4: Durable Persistence & Concurrency (R4) > zero SQLite locks held during asynchronous host review gateway evaluation 272ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > qap_module_close routes canonical_closure cleanly through MCP SDK client 91ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > enforces Amendment 4: blocks canonical module called without canonical_closure 41ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > qap_session_close blocks transition to WRAP_UP when canonical modules remain unclosed 43ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R3: inconsistent durable closure 'short reason' cannot create receipt or reach WRAP_UP 145ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R3: inconsistent durable closure 'blank reason' cannot create receipt or reach WRAP_UP 141ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R3: inconsistent durable closure 'missing approval' cannot create receipt or reach WRAP_UP 147ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R3: inconsistent durable closure 'mismatched approval digest' cannot create receipt or reach WRAP_UP 120ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R3: inconsistent durable closure 'duplicated approval' cannot create receipt or reach WRAP_UP 122ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R3: inconsistent durable closure 'closed without approval' cannot create receipt or reach WRAP_UP 158ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R3: inconsistent durable closure 'already waived without approval' cannot create receipt or reach WRAP_UP 122ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R5-A02: 16 bound modules, last invalid=false, preview stays capped but guidance checks all 216ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R5-A02: 17 bound modules, last invalid=false, preview stays capped but guidance checks all 247ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R5-A02: 17 bound modules, last invalid=true, preview stays capped but guidance checks all 197ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R4-A01 positive: a legitimately authorized durable waiver still recommends session close 117ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R2-A01: first session close uses recovered waiver metadata for the gate and physical report 117ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > qap_status reports honest canonical coverage and closure indicators without false 100% 122ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 6: Historical Regressions & Defensive Invariants (R01–R60) > R02 / R60: Re-evaluating coverage is strictly read-only and never implicitly advances lifecycle 44ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 6: Historical Regressions & Defensive Invariants (R01–R60) > R03: Canonical closure route catches errors cleanly and operates on SQLite/host gateway without ENOENT 53ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 6: Historical Regressions & Defensive Invariants (R01–R60) > R11 / R27 / R31: Closing with gaps requires substantive justifications and formal host decisions 31ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 6: Historical Regressions & Defensive Invariants (R01–R60) > Security Invariant: Protected file packages/playwright-runner/.qa/cache/sessions/admin-user.json is never inspected or touched 0ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 1: Crash before persisting decision leaves storage completely clean and recoverable 94ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 2: Crash after closureStore commits decision but before IKnowledgeStore or lifecycle.json updates recovers via self-healing reconciler 58ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 3: Crash after IKnowledgeStore receipt commit returns idempotent response on retry 75ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 4: Two concurrent closures cleanly serialize and prevent double consumption of decision 109ms

 Test Files  1 passed (1)
      Tests  37 passed (37)
   Start at  00:11:35
   Duration  6.61s (transform 700ms, setup 0ms, import 2.72s, tests 3.58s, environment 0ms)
~~~

## discovery — salida 1

out:

~~~text
RUN  v4.1.11 <WORKTREE>/packages/mcp

 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > R3: unauthorized disposable root is a scoped block, not a fabricated browser outage 28ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > R1: onboarding to anonymous discovery preserves planned state and explicitly blocks the legacy interview 1883ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > R1: stale observed state cannot manufacture rules or close a module without view context 82ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > R1: stale consolidated state cannot manufacture rules or close a module without view context 81ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > R1: existing reviewed legacy context still accepts rules without promoting agent text or canonical observations 106ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > R1: explicit waiver remains an honest exit without claiming discovery or test coverage 44ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > owns exactly one route, preserves order, rejects collisions, and never falls back 41ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > navigates a real MPA, returns actual counts, commits once and reopens physical SQLite 1094ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > keeps project bindings and physical stores isolated between server instances 1985ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > distinguishes static completion from a script dependent shell (false) 813ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > distinguishes static completion from a script dependent shell (true) 747ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks credentials without navigation or credential reflection 26ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks profile without navigation or credential reflection 28ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks profileId without navigation or credential reflection 23ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks storageState without navigation or credential reflection 24ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks cookies without navigation or credential reflection 22ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks session without navigation or credential reflection 21ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks auth without navigation or credential reflection 24ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target /unknown 34ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target //127.0.0.1/ 38ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target /a/../ 35ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target /%2e/ 34ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target /?token=secret 32ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target /#fragment 35ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target http://user:secret@127.0.0.1/ 32ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target /a\b 32ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target  / 35ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > retains phase gate ONBOARDING without lifecycle writes 48ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > retains phase gate SCOPING without lifecycle writes 44ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > retains phase gate WRAP_UP without lifecycle writes 35ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks missing binding, stale authorization and incompatible environment 61ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > requires explicit read-only host acknowledgement and rejects authenticated plans/terminal modules 97ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > keeps host configuration isolated from later caller mutations 783ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects an already cancelled dispatcher invocation before crawler start 25ms
 × src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > propagates in-flight dispatcher cancellation to transport and waits for cleanup 30017ms
   → Test timed out in 30000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > sanitizes host failures and emits no secret-bearing console logs 41ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > delegates page denial and budgets to the real crawler 1149ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > delegates bytes denial and budgets to the real crawler 641ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > delegates browser denial and budgets to the real crawler 43ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > delegates redirect denial and budgets to the real crawler 641ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > delegates private denial and budgets to the real crawler 629ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > delegates dns denial and budgets to the real crawler 800ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > reports atomic persistence failure without fabricated persisted findings 881ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > R4: real crawler to canonical interview, independent review, secure waiver and WRAP_UP through MCP 1244ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: missing 27ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: wrong-id 27ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: wrong-key 30ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: inactive 29ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: ambiguous 22ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: application 27ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: environment 25ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: revision 25ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: unplanned 26ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: id-key-conflict 27ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > persists real MCP/Chrome/MPA associations, reopens SQLite, projects status, and preserves epistemic planes 903ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > recovers after physical association rollback without reacquisition or history changes; rejects shortened and mixed receipts 1623ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > two physical connections race with CAS; retry is idempotent and context changes block recovery 918ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > isolates same planned names across physical projects and rejects another project receipt 49ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > detects context changed at the edge commit boundary without deleting already acquired facts 813ms

 Test Files  1 failed (1)
      Tests  1 failed | 58 passed (59)
   Start at  00:11:42
   Duration  52.04s (transform 725ms, setup 0ms, import 2.63s, tests 49.13s, environment 0ms)

undefined
<WORKTREE>\packages\mcp:
[ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL] Command failed with exit code 1: vitest run src/__tests__/discovery-handler.test.ts "--maxWorkers=1" "--reporter=verbose"
~~~

err:

~~~text
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > propagates in-flight dispatcher cancellation to transport and waits for cleanup
Error: Test timed out in 30000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
 ❯ src/__tests__/discovery-handler.test.ts:311:3
    309|   });
    310|
    311|   it('propagates in-flight dispatcher cancellation to transport and wa…
       |   ^
    312|     const f = await fixture(); const abort = new AbortController();
    313|     Object.assign(f.authorization, { dependencies: { browser: { channe…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯
~~~

## lint-focus — salida 0

## mcp — salida 1

out:

~~~text
RUN  v4.1.11 <WORKTREE>/packages/mcp

 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > R3: unauthorized disposable root is a scoped block, not a fabricated browser outage 45ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > R1: onboarding to anonymous discovery preserves planned state and explicitly blocks the legacy interview 1811ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > R1: stale observed state cannot manufacture rules or close a module without view context 86ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > R1: stale consolidated state cannot manufacture rules or close a module without view context 95ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > R1: existing reviewed legacy context still accepts rules without promoting agent text or canonical observations 120ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > R1: explicit waiver remains an honest exit without claiming discovery or test coverage 45ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > owns exactly one route, preserves order, rejects collisions, and never falls back 51ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > navigates a real MPA, returns actual counts, commits once and reopens physical SQLite 1061ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > keeps project bindings and physical stores isolated between server instances 2028ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > distinguishes static completion from a script dependent shell (false) 722ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > distinguishes static completion from a script dependent shell (true) 729ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks credentials without navigation or credential reflection 28ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks profile without navigation or credential reflection 27ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks profileId without navigation or credential reflection 24ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks storageState without navigation or credential reflection 24ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks cookies without navigation or credential reflection 30ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks session without navigation or credential reflection 25ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks auth without navigation or credential reflection 24ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target /unknown 38ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target //127.0.0.1/ 39ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target /a/../ 36ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target /%2e/ 40ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target /?token=secret 38ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target /#fragment 34ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target http://user:secret@127.0.0.1/ 38ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target /a\b 38ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target  / 33ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > retains phase gate ONBOARDING without lifecycle writes 44ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > retains phase gate SCOPING without lifecycle writes 44ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > retains phase gate WRAP_UP without lifecycle writes 36ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks missing binding, stale authorization and incompatible environment 64ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > requires explicit read-only host acknowledgement and rejects authenticated plans/terminal modules 93ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > keeps host configuration isolated from later caller mutations 870ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects an already cancelled dispatcher invocation before crawler start 26ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > propagates in-flight dispatcher cancellation to transport and waits for cleanup 863ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > sanitizes host failures and emits no secret-bearing console logs 43ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > delegates page denial and budgets to the real crawler 796ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > delegates bytes denial and budgets to the real crawler 1104ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > delegates browser denial and budgets to the real crawler 49ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > delegates redirect denial and budgets to the real crawler 720ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > delegates private denial and budgets to the real crawler 726ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > delegates dns denial and budgets to the real crawler 755ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > reports atomic persistence failure without fabricated persisted findings 885ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > R4: real crawler to canonical interview, independent review, secure waiver and WRAP_UP through MCP 1282ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: missing 28ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: wrong-id 35ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: wrong-key 27ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: inactive 34ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: ambiguous 26ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: application 30ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: environment 31ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: revision 32ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: unplanned 29ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: id-key-conflict 28ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > persists real MCP/Chrome/MPA associations, reopens SQLite, projects status, and preserves epistemic planes 1042ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > recovers after physical association rollback without reacquisition or history changes; rejects shortened and mixed receipts 1713ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > two physical connections race with CAS; retry is idempotent and context changes block recovery 1171ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > isolates same planned names across physical projects and rejects another project receipt 55ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > detects context changed at the edge commit boundary without deleting already acquired facts 1052ms
 × src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 1. qap_discover protegido sin perfil: blocked auth_required y cero escrituras en disco 135ms
   → expected undefined to be 'auth_required' // Object.is equality
 × src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 2. qap_discover con redirección HTTP 302 a login: detecta auth_wall determinista y bloquea sin escribir 69ms
   → expected undefined to be 'auth_required' // Object.is equality
 × src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 3. qap_discover con login embebido en ruta no-acceso: bloquea como auth_required sin persistir 80ms
   → expected undefined to be 'auth_required' // Object.is equality
 × src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 4. qap_discover con sesión expirada: blocked session_invalid y desverifica el perfil 85ms
   → expected undefined to be 'session_invalid' // Object.is equality
 × src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 5. qap_discover con perfil verificado y storageState válido: devuelve app y transiciona a observed 83ms
   → expected 'blocked' to be 'success' // Object.is equality
 × src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 6. qap_discover en módulo de acceso: selectors.json incluye auth_selectors y omite valores y atributos sensibles de password 89ms
   → expected 'blocked' to be 'success' // Object.is equality
 ✓ src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 7. Secuencia de preguntas de SCOPING: 5 preguntas separadas y válidas sin mezclar módulos con auth 51ms
 ✓ src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 8. canExitScoping: compuerta falsa sin sesión verificada y verdadera con ella 40ms
 ✓ src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 9. qap_auth_add con verificación automática real contra el fixture HTTP local 7070ms
stdout | src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 10. qap_auth_add con handoff: probado con doble de prueba que sustituye SOLO la ventana humana (resto real)
Completa el login manualmente en la ventana abierta. Esperando hasta 15000ms...

 ✓ src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 10. qap_auth_add con handoff: probado con doble de prueba que sustituye SOLO la ventana humana (resto real) 3718ms
 ✓ src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 11. Test de no filtración: contraseña centinela NO aparece en respuestas, archivos .qa/, SQLite ni logs 13505ms
 ✓ src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 12. qap_session_plan: reordena módulos de acceso al inicio del plan de forma determinista y persiste acceso: true 83ms
 ✓ src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 13. Validación integral de preguntas (C1 & C2): todas las preguntas de SCOPING y blocked son válidas, sin formato decision, sin "Deseas" y sin opciones únicas 45ms
stdout | src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 14. Timeout de handoff (C4): qap_auth_add devuelve blocked con razon handoff_timeout y reintento idempotente
Completa el login manualmente en la ventana abierta. Esperando hasta 100ms...

 ✓ src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 14. Timeout de handoff (C4): qap_auth_add devuelve blocked con razon handoff_timeout y reintento idempotente 895ms
 × src/__tests__/p4-4-auth-lifecycle.test.ts > P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) > 15. Guard de cliente asíncrono lento (~1200ms) en qap_discover: responde blocked auth_required y cero escrituras en .qa/modules (C3c) 62ms
   → expected undefined to be 'auth_required' // Object.is equality
 × src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C1: Clasificación honesta con adaptador real > C1-a: módulo de acceso pedido en login sin redirección NO se bloquea (page_kind login, success) 305ms
   → expected 'blocked' to be 'success' // Object.is equality
 × src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C1: Clasificación honesta con adaptador real > C1-b: ruta protegida con redirección HTTP 302 a /login detecta auth_wall determinista y bloquea 246ms
   → expected undefined to be 'auth_required' // Object.is equality
 × src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C1: Clasificación honesta con adaptador real > C1-c: ruta protegida con guard del lado del cliente detecta auth_wall con redirección al login 214ms
   → expected undefined to be 'auth_required' // Object.is equality
 ✓ src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C2: Formatos de pregunta de roles según roles declarados > C2-a: con 0 roles declarados genera formato abierta con ejemplo en el texto 34ms
 ✓ src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C2: Formatos de pregunta de roles según roles declarados > C2-b: con 1 rol declarado genera formato una_opcion con 2 opciones y seguimiento abierto 40ms
 ✓ src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C2: Formatos de pregunta de roles según roles declarados > C2-c: con 3 roles declarados genera formato multiple sin ninguna opción recomendada 31ms
 × src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C3: Integridad de categoría en from_option y regla de cobertura completa > C3-a: la categoría de from_option se toma siempre de la pregunta pendiente persistida 259ms
   → expected 'blocked' to be 'success' // Object.is equality
 × src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C3: Integridad de categoría en from_option y regla de cobertura completa > C3-b: si la petición declara una categoría distinta a la de la pregunta pendiente se rechaza con blocked 244ms
   → the given combination of arguments (undefined and string) is invalid for this assertion. You can use an array, a map, an object, a set, a string, or a weakset instead of a string
 ✓ src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C3: Integridad de categoría en from_option y regla de cobertura completa > C3-c: cobertura completa nunca es true mientras exista una categoría diferida (deferred no cubre) 33ms
 × src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C4: Flujo de respuestas cortas como borrador y propuesta de enunciado > C4-a: respuesta corta se guarda como borrador (status inferred, source user_text, borrador true) y no cubre 251ms
   → expected 'blocked' to be 'success' // Object.is equality
 × src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C4: Flujo de respuestas cortas como borrador y propuesta de enunciado > C4-b: derivación determinista en categoría actor que nombra roles emite Pregunta una_opcion directamente 231ms
   → expected 'blocked' to be 'success' // Object.is equality
 × src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C4: Flujo de respuestas cortas como borrador y propuesta de enunciado > C4-c: envío de propuesta_enunciado válida para un borrador emite Pregunta una_opcion con las 3 opciones 217ms
   → expected 'blocked' to be 'success' // Object.is equality
 × src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C4: Flujo de respuestas cortas como borrador y propuesta de enunciado > C4-d: resolver con "Es correcto" guarda regla confirmed user_confirmed con enunciado exacto y cubre 213ms
   → Cannot read properties of undefined (reading 'id')
 × src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C4: Flujo de respuestas cortas como borrador y propuesta de enunciado > C4-e: resolver con "Lo defino después" guarda regla deferred y no cubre 233ms
   → Cannot read properties of undefined (reading 'id')
 × src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C4: Flujo de respuestas cortas como borrador y propuesta de enunciado > C4-f: propuesta_enunciado corta o genérica es rechazada con status error 211ms
   → expected 'blocked' to be 'error' // Object.is equality
 ✓ src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C6: Ciclo completo plan -> auth -> compuerta de SCOPING con adaptador real > C6-a: plan bloqueado por perfil no verificado persiste, auth_add verifica y compuerta avanza a WORKING 6986ms
 ✓ src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C9: Validación y filtrado riguroso de roles limpios > C9-a: qap_init y qap_context_ingest descartan entradas de tabla Markdown y reportan roles_descartados 88ms
 ✓ src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C9: Validación y filtrado riguroso de roles limpios > C9-b: los 4 lectores ignoran roles inválidos presentes en un context.yaml contaminado 36ms
 ✓ src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C9: Validación y filtrado riguroso de roles limpios > C9-c: roles legítimos con espacios, tildes, guiones y números son aceptados siempre 33ms
 × src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C10: Detección y advertencia de extracción vacía > C10-a: página app/login sin elementos interactivos genera advertencia extraccion_vacia y trabajo 281ms
   → expected 'blocked' to be 'success' // Object.is equality
 × src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C10: Detección y advertencia de extracción vacía > C10-b: página con al menos un elemento interactivo no genera advertencia extraccion_vacia 230ms
   → expected 'blocked' to be 'success' // Object.is equality
 × src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C10: Detección y advertencia de extracción vacía > C10-c: la advertencia extraccion_vacia es agnóstica de la aplicación 207ms
   → expected 'blocked' to be 'success' // Object.is equality
 ✓ src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C3: Transliteración NFD de slugs y prevención de módulos fuera del plan > C3-a: opciones de módulos en guidance usan normalizeSlug sin sustituir tildes por guiones bajos 37ms
 ✓ src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C3: Transliteración NFD de slugs y prevención de módulos fuera del plan > C3-b: qap_session_plan limpia módulos planned huérfanos que ya no pertenezcan al plan 225ms
 × src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C3: Transliteración NFD de slugs y prevención de módulos fuera del plan > C1-c: módulo con tilde preserva nombre en lifecycle, crea directorio y normaliza pending_questions con transliteración NFD 284ms
   → expected false to be true // Object.is equality
 × src/__tests__/p4-5a2-integrity.test.ts > P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) > C3: Transliteración NFD de slugs y prevención de módulos fuera del plan > C2-seguimiento: selección de "Corregir" emite pregunta de seguimiento y no persiste regla espuria en rules.yaml 277ms
   → expected undefined to be defined
 ✓ src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > debe registrar y exponer la suite completa de 15 tools y prompts 14ms
 ✓ src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > debe ejecutar qap_init y crear el arbol .qa/ 65ms
 ✓ src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > debe validar y mostrar estado con directivas UX en qap_status 216ms
 × src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > debe descubrir modulos y responder en desarrollo para qap_plan y qap_test 206ms
   → expected true to be falsy
 ✓ src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > debe registrar un perfil de autenticacion con qap_auth_add y listar con qap_auth_list 51ms
 ✓ src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > debe generar reportes con qap_report y limpiar con qap_clean 252ms
 ✓ src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > debe operar sobre targetPath independiente de cwd y validar qap_server 192ms
 ✓ src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > debe ser idempotente en qap_init sin alterar context.yaml ni environments.yaml en segunda ejecución (Criterio 3) 56ms
 × src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > el contexto de vista generado por qap_discover debe validar contra module-view.schema.json (Criterio 4) 316ms
   → expected true to be falsy
 × src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > qap_discover con contexto de vista inválido no debe escribir archivos y debe retornar error (Criterio 4) 215ms
   → expected 'blocked' to be 'error' // Object.is equality
 × src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > E0a: qap_discover valida contra module-view.schema.json en camino de fallo de Playwright 227ms
   → expected true to be falsy
 × src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > E0b: qap_discover valida contra module-view.schema.json en vista de autenticacion con session_saved true 215ms
   → expected true to be falsy
 × src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > E0c: qap_discover valida contra module-view.schema.json en vista con routes_found vacio 221ms
   → expected true to be falsy
 ✓ src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > qap_context_set: merge parcial, no-downgrade de user, faltantes, transicion automatica con session.id y history 614ms
 ✓ src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > qap_context_set: dos llamadas concurrentes no pierden actualizaciones 270ms
 ✓ src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > qap_context_ingest: ingesta desde docPath y docContent, persistencia inferred, nunca avanza fase, rechazo de seguridad 247ms
 ✓ src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > qap_session_plan: SCOPING define plan y auth, transiciona a WORKING, rechazo atomico, ampliacion en WORKING, bloqueada en ONBOARDING 224ms
 × src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > qap_discover: gating por fase y estado de modulo, actualizacion planned -> observed 66ms
   → expected undefined to be 'ONBOARDING' // Object.is equality
 × src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > Criterio 7: Proyecto legacy sin campos de negocio valida contra el schema y qap_status responde con fase WORKING derivada 145ms
   → expected 'blocked' to be 'success' // Object.is equality
 × src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > Criterio 8 (E2E): init -> status (entrevista) -> ingest -> context_set compuerta -> auto-SCOPING -> session_plan -> auto-WORKING -> discover 146ms
   → expected undefined to be 'ONBOARDING' // Object.is equality
 × src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > qap_rules_set: actualiza reglas, transiciona observed -> interviewing, recalcula cobertura y actualiza guidance 224ms
   → expected 'planned' to be 'observed' // Object.is equality
 ✓ src/__tests__/p3-verification.test.ts > P3 Suite de Verificación MCP (T3 - T15) > T3: Toda respuesta con siguiente_accion NO contiene "botones interactivos en modal" ni prohibición de listas 726ms
 ✓ src/__tests__/p3-verification.test.ts > P3 Suite de Verificación MCP (T3 - T15) > T4: qap_status WORKING con módulo planned: sin pregunta de confirmación, sin "Ver otros módulos", sin botón de una sola opción, stats.modules refleja estado 420ms
 ✓ src/__tests__/p3-verification.test.ts > P3 Suite de Verificación MCP (T3 - T15) > T5: lifecycle.json valida contra lifecycle-state.schema.json tras CADA mutación del flujo e2e 241ms
 × src/__tests__/p3-verification.test.ts > P3 Suite de Verificación MCP (T3 - T15) > T6: qap_discover éxito: no contiene "Descubrir otro módulo", "pregunta_doc" ni "opciones_doc"; siguiente_accion tipo entrevista_vista (<= 5 preguntas) con tool qap_rules_set, categorias_aplicables y rutas_detectadas_fuera_del_plan 214ms
   → Cannot read properties of undefined (reading 'tipo')
 × src/__tests__/p3-verification.test.ts > P3 Suite de Verificación MCP (T3 - T15) > T7: rules.yaml tras discover: reglas inferred/dom con ids deterministas; re-discover idempotente (sin duplicados, reglas confirmadas intactas) 341ms
   → expected false to be true // Object.is equality
 ✓ src/__tests__/p3-verification.test.ts > P3 Suite de Verificación MCP (T3 - T15) > T8: rules.yaml con manually_edited: true: discover no inserta reglas y declara el bloqueo canónico 358ms
 × src/__tests__/p3-verification.test.ts > P3 Suite de Verificación MCP (T3 - T15) > T9: Fallo de Playwright: no inserta reglas; siguiente_accion tipo decision 273ms
   → Cannot read properties of undefined (reading 'tipo')
 ✓ src/__tests__/p3-verification.test.ts > P3 Suite de Verificación MCP (T3 - T15) > T10: qap_rules_set bloqueado (contrato blocked) en: fase distinta de WORKING, módulo no registrado, módulo planned, módulo waived 206ms
 ✓ src/__tests__/p3-verification.test.ts > P3 Suite de Verificación MCP (T3 - T15) > T11: Primera llamada exitosa: observed -> interviewing; ids R-001, R-002... secuenciales por módulo 242ms
 ✓ src/__tests__/p3-verification.test.ts > P3 Suite de Verificación MCP (T3 - T15) > T12: No-downgrade: regla source user confirmed no se sobrescribe con source dom/prd; waivers solo source user y reason no vacío; lote con regla inválida se rechaza completo 329ms
 ✓ src/__tests__/p3-verification.test.ts > P3 Suite de Verificación MCP (T3 - T15) > T13: Dos llamadas concurrentes a qap_rules_set sin pérdida de actualización 314ms
 × src/__tests__/p3-verification.test.ts > P3 Suite de Verificación MCP (T3 - T15) > T14: qap_status WORKING: (a) observed con hipótesis reanuda entrevista; (b) interviewing incompleto reanuda; (c) planned elige high > medium > low luego orden; (d) todos completos tipo decision 327ms
   → expected 'trabajo' to be 'entrevista_vista' // Object.is equality
 × src/__tests__/p3-verification.test.ts > P3 Suite de Verificación MCP (T3 - T15) > T15: E2E: flujo de P2 hasta WORKING -> discover A -> rules_set parcial -> status (reanuda A) -> rules_set completa cobertura -> status (propone B) -> discover B; ninguna respuesta del flujo contiene texto del bucle 323ms
   → expected 'trabajo' to be 'entrevista_vista' // Object.is equality
 × src/__tests__/p4-5a-integrity.test.ts > P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) > Criterio 2: regla redactada por agente sin user_text ni from_option se guarda como inferred/agent y no cuenta en cobertura 314ms
   → expected 'blocked' to be 'success' // Object.is equality
 × src/__tests__/p4-5a-integrity.test.ts > P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) > Criterio 3: una etiqueta de opción predefinida del motor NO cubre una categoría 236ms
   → expected 'blocked' to be 'success' // Object.is equality
 × src/__tests__/p4-5a-integrity.test.ts > P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) > Criterio 4: un módulo con 2 reglas de 7 categorías no cierra sin accept_gaps, y cierra con él dejando registro 242ms
   → expected 'Falta el contexto de vista requerido …' to be 'cobertura_insuficiente' // Object.is equality
 × src/__tests__/p4-5a-integrity.test.ts > P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) > C9a: blocked de qap_discover con auth_required incluye razon auth_required y directorio_objetivo, con claves alineadas a session_invalid 219ms
   → expected undefined to be 'auth_required' // Object.is equality
 ✓ src/__tests__/p4-5a-integrity.test.ts > P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) > C7: compuerta de roles exige auth.roles no vacío y perfil verificado por cada rol para salir de SCOPING 286ms
 ✓ src/__tests__/p4-5a-integrity.test.ts > P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) > C8: tras "corregir", emite primero campos_a_corregir y luego pregunta abierta secuencial por campo 818ms
 × src/__tests__/p4-5a-integrity.test.ts > P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) > C4-a: from_option con pregunta_id inexistente, opcion_id inexistente o sin texto sustantivo (rechazo o degradación a agent/inferred) 216ms
   → expected 'blocked' to be 'error' // Object.is equality
 × src/__tests__/p4-5a-integrity.test.ts > P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) > C4-b: límites de sustantividad (2 palabras o 19 caracteres no cubren; 3 palabras y 20 caracteres sí) 205ms
   → ENOENT: no such file or directory, open '<TEMP>/qap-p45a-zzFljJ\.qa\modules\catalogo\rules.yaml'
 × src/__tests__/p4-5a-integrity.test.ts > P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) > C4-c: accept_gaps con razón de 14 caracteres bloquea y con 15 cierra y deja el registro 219ms
   → expected 'Falta el contexto de vista requerido …' to be 'cobertura_insuficiente' // Object.is equality
 × src/__tests__/p4-5a-integrity.test.ts > P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) > C4-d: plan con auth.required true sin roles queda bloqueado con pregunta de roles y bloquea discover (V4) 227ms
   → .toMatch() expects to receive a string, but got undefined
 × src/__tests__/p4-5a-integrity.test.ts > P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) > C1: campos honestos en bloqueos previos a navegar y navegación real 219ms
   → expected undefined to be 'auth_required' // Object.is equality
 × src/__tests__/p4-5a-integrity.test.ts > P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) > C3: flujo real de preguntas de categoría, formato una_opcion, persistencia y respuestas user_text y deferred 245ms
   → expected 'blocked' to be 'success' // Object.is equality
 ✓ src/__tests__/p4-2-pregunta-contract.test.ts > P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) > Criterio 4.1: qap_init en workspace con README devuelve pregunta fuente_de_verdad con ese README como opcion 84ms
 ✓ src/__tests__/p4-2-pregunta-contract.test.ts > P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) > Criterio 4.2: qap_status a mitad de ONBOARDING devuelve la misma pregunta que ya estaba pendiente (reanudación) 521ms
 ✓ src/__tests__/p4-2-pregunta-contract.test.ts > P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) > Criterio 4.3: Progresión canónica fuente_de_verdad -> objetivo -> roles -> flujos_criticos -> SCOPING 1078ms
 × src/__tests__/p4-2-pregunta-contract.test.ts > P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) > Criterio 4.4: Ninguna respuesta con siguiente_accion trae preguntas como cadenas ni pregunta aplanada 311ms
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
 ✓ src/__tests__/p4-2-pregunta-contract.test.ts > P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) > Criterio 4.5: Test de inyección: package.json description y nombre de archivo con instrucciones aparecen sanitizados 45ms
 × src/__tests__/p4-2-pregunta-contract.test.ts > P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) > Criterio 6: E2E Completo donde TODA siguiente_accion de tipo entrevista, entrevista_vista o decision trae Pregunta válida 404ms
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
 × src/__tests__/lifecycle-v3-e2e.test.ts > Lifecycle V3 E2E & Verification Suite (E0 - E3) > E0a: qap_status en WORKING para módulo con cobertura incompleta devuelve module, view y preguntas no vacías idénticas a qap_rules_set 507ms
   → expected 'trabajo' to be 'entrevista_vista' // Object.is equality
 ✓ src/__tests__/lifecycle-v3-e2e.test.ts > Lifecycle V3 E2E & Verification Suite (E0 - E3) > E0b: contrato estricto de opciones y preguntas en todo el flujo 727ms
 ✓ src/__tests__/lifecycle-v3-e2e.test.ts > Lifecycle V3 E2E & Verification Suite (E0 - E3) > E0c: qap_report sin ejecuciones responde blocked y no escribe archivos; ninguna siguiente_accion recomienda qap_report sin ejecuciones 184ms
 × src/__tests__/lifecycle-v3-e2e.test.ts > Lifecycle V3 E2E & Verification Suite (E0 - E3) > E1: regresión consolidated -> interviewing tras re-discover y política de waivers 241ms
   → expected '{\n  "status": "blocked",\n  "code": …' to contain 'La categoría \'proposito\' no se pued…'
 × src/__tests__/lifecycle-v3-e2e.test.ts > Lifecycle V3 E2E & Verification Suite (E0 - E3) > E2: qap_module_close validaciones, compuertas y transiciones 187ms
   → expected 'Falta el contexto de vista requerido …' to contain 'consolidated'
 × src/__tests__/lifecycle-v3-e2e.test.ts > Lifecycle V3 E2E & Verification Suite (E0 - E3) > E3: canExitWorking, qap_session_close, reporte de brechas y nueva sesión desde WRAP_UP 215ms
   → ENOENT: no such file or directory, open '<TEMP>/qap-v3-e2e-kjiUbt\.qa\modules\auth\rules.yaml'
 × src/__tests__/lifecycle-v3-e2e.test.ts > Lifecycle V3 E2E & Verification Suite (E0 - E3) > Criterio 9: E2E completo: init -> onboarding -> scoping -> working -> discover A -> rules_set parcial -> status (reanuda) -> rules_set completa -> module_close A -> discover B -> module_close waive B -> session_close -> status WRAP_UP -> session_plan nueva sesión 203ms
   → expected 'blocked' to be 'success' // Object.is equality
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > recovers exact drafts, corrections, defer/resume and history across closed connections 194ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > persists host reject and prevents old decision replay 64ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > persists host defer and prevents old decision replay 63ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > two independent connections serialize writers, detect stale versions and preserve the winner 78ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > rolls back failed physical writes and reports unknown status when storage closes 73ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > reconciles canonical commit followed by failed draft commit without a second approval 105ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > blocks restored draft in changed project 72ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > blocks restored draft in changed application 60ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > blocks restored draft in changed environment 77ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > blocks restored draft in changed session 66ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > blocks restored draft in changed inactive 63ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > blocks restored draft in changed revision 61ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > does not create on read, adopt foreign schemas, accept wrong keys or destroy damaged state 110ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > reopened proposal has no authority with expired gateway decision 56ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > reopened proposal has no authority with revoked gateway decision 59ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > reopened proposal has no authority with altered gateway decision 52ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > reopened proposal has no authority with absent gateway decision 52ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > reopened proposal has no authority with unavailable gateway decision 56ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > retains consumed reject IDs across restart and requires fresh review for reactivation 76ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > SQLite rolls back a writer process that exits before COMMIT 143ms
 ✓ src/__tests__/durable-interview.test.ts > R4 encrypted durable interview state > terminates Node processes between real MCP SDK operations and reopens both physical stores 7867ms
 ✓ src/__tests__/test-handler.test.ts > TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) > Scenario 1: executes valid and authorized plan, persisting authentic result (R4.1) 574ms
 ✓ src/__tests__/test-handler.test.ts > TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) > Scenario 2: rejects missing, historical, corrupt, or obsolete plans without executing runner (R4.2) 92ms
 ✓ src/__tests__/test-handler.test.ts > TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) > Scenario 3: rejects environment mismatch, module mismatch, and missing module (R4.3) 74ms
 ✓ src/__tests__/test-handler.test.ts > TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) > Scenario 4: in-memory snapshot prevents TOCTOU tampering of YAML files after verification (R4.4) 500ms
 ✓ src/__tests__/test-handler.test.ts > TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) > Scenario 5: blocks unauthorized URLs, unconfigured host policy, and redirects (R4.5) 635ms
 ✓ src/__tests__/test-handler.test.ts > TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) > Scenario 6: classifies missing browser launch failure as infrastructure block (R4.6) 89ms
 ✓ src/__tests__/test-handler.test.ts > TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) > Scenario 7: rejects unauthorized profiles and disables implicit session recovery (R4.7) 539ms
 ✓ src/__tests__/test-handler.test.ts > TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) > Scenario 8: distinguishes real functional failure from infrastructure failure (R4.8) 484ms
 ✓ src/__tests__/test-handler.test.ts > TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) > Scenario 9: zero cases executed never returns fake PASS verdict (R4.9) 91ms
 ✓ src/__tests__/test-handler.test.ts > TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) > Scenario 10: supports cancellation and resource cleanup under AbortSignal (R4.10) 50ms
 ✓ src/__tests__/test-handler.test.ts > TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) > Scenario 11: persists execution results adhering to schema without automatic SQLite ConformityAssessment (R4.11) 474ms
 ✓ src/__tests__/test-handler.test.ts > TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) > Scenario 12: integrates cleanly via createMcpServer preserving exact 18 tools (R4.12) 463ms
 ✓ src/__tests__/test-handler.test.ts > TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) > Scenario 13: physical Playwright Chromium execution against isolated local HTTP fixture (Real PASS & FAIL) 593ms
 ✓ src/__tests__/test-handler.test.ts > VNEXT-014-D preflight — execution evidence integrity > D-01: does not persist schema-invalid runner outputs 115ms
 ✓ src/__tests__/test-handler.test.ts > VNEXT-014-D preflight — execution evidence integrity > D-02: refuses traversal-capable execution IDs despite schema v1 accepting strings 100ms
 ✓ src/__tests__/test-handler.test.ts > VNEXT-014-D preflight — execution evidence integrity > D-03: failed execution persistence cannot be reported as success or recorded in history 102ms
 ✓ src/__tests__/test-handler.test.ts > VNEXT-014-D preflight — execution evidence integrity > D-04: history failure preserves saved evidence but returns an explicit partial error 135ms
 ✓ src/__tests__/test-handler.test.ts > VNEXT-014-D preflight — execution evidence integrity > D-05: rejects a schema-valid execution associated with a different module 122ms
 ✓ src/__tests__/test-handler.test.ts > VNEXT-014-D preflight — execution evidence integrity > D-06: rejects summary totals that disagree with executed cases 112ms
 ✓ src/__tests__/test-handler.test.ts > VNEXT-014-D preflight — execution evidence integrity > D-07: a critical runner error persists not_run evidence without reporting MCP success 138ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 1: Canonical Coverage & Epistemic Boundaries (R1) > blocks evaluation when module is unbound or lifecycle context has drifted 74ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 1: Canonical Coverage & Epistemic Boundaries (R1) > zero coverage from crawler observations or DOM elements alone 48ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 1: Canonical Coverage & Epistemic Boundaries (R1) > strictly enforces Invariant D-011 and R1: excludes observational requirements from confirmed coverage 42ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 1: Canonical Coverage & Epistemic Boundaries (R1) > tripartite coverage separation: execution coverage is strictly not_executed with 0 passed 36ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 2: Reproducible Gap Inventory & Non-Applicability (R2) > identifies reproducible gaps with stable IDs and formal absence types 42ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 2: Reproducible Gap Inventory & Non-Applicability (R2) > declares categories non-applicable and satisfies category status without category waivers (Amendment 6) 41ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 2: Reproducible Gap Inventory & Non-Applicability (R2) > enforces Amendment 5: accepted gaps bind receipt and transition to status accepted 34ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > blocks closure when host gateway is absent or returns null (pending) 76ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > rejects decisions with invalid request digest or expired authorization 55ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > blocks client injection of authorization fields (approvalId / signature) on MCP wire 40ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 4: Durable Persistence & Concurrency (R4) > SqliteModuleClosureStore encrypts all data with AES-256-GCM without plaintext leaks 70ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 4: Durable Persistence & Concurrency (R4) > Amendment 3: Persists relation receipt in IKnowledgeStore with ZERO module.revision mutation 61ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 4: Durable Persistence & Concurrency (R4) > zero SQLite locks held during asynchronous host review gateway evaluation 276ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > qap_module_close routes canonical_closure cleanly through MCP SDK client 71ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > enforces Amendment 4: blocks canonical module called without canonical_closure 38ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > qap_session_close blocks transition to WRAP_UP when canonical modules remain unclosed 43ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R3: inconsistent durable closure 'short reason' cannot create receipt or reach WRAP_UP 155ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R3: inconsistent durable closure 'blank reason' cannot create receipt or reach WRAP_UP 144ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R3: inconsistent durable closure 'missing approval' cannot create receipt or reach WRAP_UP 146ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R3: inconsistent durable closure 'mismatched approval digest' cannot create receipt or reach WRAP_UP 128ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R3: inconsistent durable closure 'duplicated approval' cannot create receipt or reach WRAP_UP 114ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R3: inconsistent durable closure 'closed without approval' cannot create receipt or reach WRAP_UP 137ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R3: inconsistent durable closure 'already waived without approval' cannot create receipt or reach WRAP_UP 125ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R5-A02: 16 bound modules, last invalid=false, preview stays capped but guidance checks all 214ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R5-A02: 17 bound modules, last invalid=false, preview stays capped but guidance checks all 563ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R5-A02: 17 bound modules, last invalid=true, preview stays capped but guidance checks all 208ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R4-A01 positive: a legitimately authorized durable waiver still recommends session close 122ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R2-A01: first session close uses recovered waiver metadata for the gate and physical report 129ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > qap_status reports honest canonical coverage and closure indicators without false 100% 104ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 6: Historical Regressions & Defensive Invariants (R01–R60) > R02 / R60: Re-evaluating coverage is strictly read-only and never implicitly advances lifecycle 37ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 6: Historical Regressions & Defensive Invariants (R01–R60) > R03: Canonical closure route catches errors cleanly and operates on SQLite/host gateway without ENOENT 56ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 6: Historical Regressions & Defensive Invariants (R01–R60) > R11 / R27 / R31: Closing with gaps requires substantive justifications and formal host decisions 38ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 6: Historical Regressions & Defensive Invariants (R01–R60) > Security Invariant: Protected file packages/playwright-runner/.qa/cache/sessions/admin-user.json is never inspected or touched 0ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 1: Crash before persisting decision leaves storage completely clean and recoverable 102ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 2: Crash after closureStore commits decision but before IKnowledgeStore or lifecycle.json updates recovers via self-healing reconciler 56ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 3: Crash after IKnowledgeStore receipt commit returns idempotent response on retry 76ms
 ✓ src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > The 4 Crash Recovery Scenarios (spawnSync Hard Exits) > Scenario 4: Two concurrent closures cleanly serialize and prevent double consumption of decision 109ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > registers all three declarative owners exactly once and never falls back after failure 95ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > status inspects uninitialized and legacy projects without creating memory or scan files 159ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > preserves the browser installation directive without launching a browser 67ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > status reports actual isolated SQLite inventory and leaves revisions unchanged 150ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > reports unavailable/ambiguous bindings without reopening or adopting a database 199ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > reports incomplete inventory without turning an unavailable query into zero modules 105ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > isolates two projects explicitly bound to different applications in the same physical store 279ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > clean blocks force=undefined and physically preserves every protected resource 123ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > clean blocks force=true and physically preserves every protected resource 122ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > clean blocks force=false and physically preserves every protected resource 132ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > blocks cleanup of uninitialized, external and junction projects without touching targets 21ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > preserves incremental context, provenance, corrections and explicit confirmation without promoting canonical entities 942ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > rejects environment discrepancies before YAML writes and never copies legacy secrets to SQLite 235ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > validates nested inputs and sanitizes errors without logging canaries 118ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > keeps corrupt YAML intact and reports sanitized errors 70ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > reports a real multi-file publication failure and blocks replay while its recovery journal is unresolved 156ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > reports lifecycle failure after YAML publication instead of claiming global success 192ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > does not grow context history for an identical update and preserves it after reopening the server 232ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > detects concurrent legacy changes, active locks, aborts and unresolved journals 70ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > rejects cancellation before execution and preserves the fixture 8ms
 ✓ src/__tests__/state-handlers.test.ts > VNEXT-012 real MCP and physical persistence > preserves physical CAS, history, reference pins, rollback and integrity across two connections and reopen 101ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > R4-R6-I01: qap_status resumes a real pending canonical question without YAML, approval or state mutation 412ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > real MCP + host inbox + physical SQLite: present, propose, approve, persist, read status, retry, reopen 231ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks confirmation with gateway none and never reflects unsafe error text 52ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks confirmation with gateway throw and never reflects unsafe error text 55ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks confirmation with gateway null and never reflects unsafe error text 50ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > MCP cannot forge authority with source 54ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > MCP cannot forge authority with status 56ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > MCP cannot forge authority with from_option 59ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > MCP cannot forge authority with verified_by 72ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > MCP cannot forge authority with trace 54ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > MCP cannot forge authority with gateway 57ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: expired 33ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: future 31ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: revoked 30ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: digest 31ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: statement 32ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: reviewer 31ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: approval 33ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: decision 31ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > rejects invalid host decision: long-expiry 27ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > host decision reject does not create a canonical requirement 29ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > host decision defer does not create a canonical requirement 35ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > correction invalidates exact-text approval, renews review, uses CAS and preserves physical history 47ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > pending version, idempotent draft retries, defer/resume, unknown questions and cross-module replies 38ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks unsafe context missing 27ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks unsafe context ambiguous 25ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks unsafe context inactive 28ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks unsafe context revision 29ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks unsafe context session 39ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > blocks unsafe context foreign-project 52ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > context changes while host review runs: cannot commit approved old context 33ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > associated aggregate evidence, partial=false, never invents fields or trusts DOM instructions 169ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > associated aggregate evidence, partial=true, never invents fields or trusts DOM instructions 106ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > absence allows general business questions; unspecified formal category stays pending 35ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > separate SQLite connections CAS, rollback trigger, safe errors, no duplicate/orphan requirement 66ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > untrusted proposal is never reflected in questions, logs or SQLite without human authority 58ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > one approval cannot authorize another question, even when the host mistakenly reuses its ID 42ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > a second connection changing a requirement while the host reviews causes a CAS conflict 64ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > restart recovers confirmed records without duplicating them; pending drafts require fresh review 42ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > approval for another project cannot confirm even with the same module, question category and statement 73ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > HTML required, HTTP 200, AgentInference and reviewed traces confer no requirement authority 141ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > physical approval receipt prevents reuse for another question after restarting the host 44ms
 ✓ src/__tests__/canonical-interview.test.ts > R3 canonical interview and independent host authorization > short free answers remain non-authoritative drafts and need a substantive corrected statement 31ms
 ✓ src/__tests__/p4-5s1-browser-candidates.test.ts > P4.5-S1: Preflight browser, Module Candidates, and Session Plan > C1: qap_status y qap_init incluyen navegador_qap en proyecto inicializado 228ms
 ✓ src/__tests__/p4-5s1-browser-candidates.test.ts > P4.5-S1: Preflight browser, Module Candidates, and Session Plan > C1: directivas contienen la indicación de preflight, exploracion y longitud <= 600 3ms
 ✓ src/__tests__/p4-5s1-browser-candidates.test.ts > P4.5-S1: Preflight browser, Module Candidates, and Session Plan > C1: status/init conservan la frase histórica y discover declara persistencia canónica estática 4ms
 ✓ src/__tests__/p4-5s1-browser-candidates.test.ts > P4.5-S1: Preflight browser, Module Candidates, and Session Plan > C4/C6: qap_context_ingest persiste module-candidates.json y qap_session_plan lo usa 282ms
 ✓ src/__tests__/p4-5s1-browser-candidates.test.ts > P4.5-S1: Preflight browser, Module Candidates, and Session Plan > C5: qap_session_plan responde blocked (no error) si un id de candidato no existe 198ms
 ✓ src/__tests__/p4-5s1-browser-candidates.test.ts > P4.5-S1: Preflight browser, Module Candidates, and Session Plan > C4: qap_session_plan bloquea si candidato tiene ruta null con ejemplo generico fijo (/catalog) nunca derivado del nombre 227ms
 ✓ src/__tests__/p4-5s1-browser-candidates.test.ts > P4.5-S1: Preflight browser, Module Candidates, and Session Plan > C6: qap_context_ingest sin candidatos cuando hay flujos criticos genera paso trabajo 210ms
 ✓ src/__tests__/p4-5s1-browser-candidates.test.ts > P4.5-S1: Preflight browser, Module Candidates, and Session Plan > C7: pregunta de alcance sin candidatos o sin front es byte a byte identica a la original 287ms
 ✓ src/__tests__/p4-5s1-browser-candidates.test.ts > P4.5-S1: Preflight browser, Module Candidates, and Session Plan > D5: comando de instalacion consistente en preflight, qap_init, qap_status y checkPlaywrightBrowser 143ms
 ✓ src/__tests__/p4-5s1-browser-candidates.test.ts > P4.5-S1: Preflight browser, Module Candidates, and Session Plan > C5: scoping con 3 y con 9 candidatos (máximo 7 por tarjeta + Otro módulo), sin recomendada en opciones y pasa guardia de emisión 357ms
 ✓ src/__tests__/p4-5s1-browser-candidates.test.ts > P4.5-S1: Preflight browser, Module Candidates, and Session Plan > C6: qap_session_plan asigna high a los 3 primeros y medium al resto, con soporte retrocompatible para modules 395ms
 ✓ src/__tests__/p4-3-investigate-before-ask.test.ts > P4.3 Suite: Investigar antes de preguntar, Auto-ingesta, Confirmación única y Payload autosuficiente > Criterio 3: Contrato MCP P4.3 > 3.1: qap_context_set con "PRD_diff.md" escrito libre ingiere en la misma llamada y la siguiente acción NO es abierta 275ms
 ✓ src/__tests__/p4-3-investigate-before-ask.test.ts > P4.3 Suite: Investigar antes de preguntar, Auto-ingesta, Confirmación única y Payload autosuficiente > Criterio 3: Contrato MCP P4.3 > 3.2: con documento sin objetivo extraíble la siguiente_accion es trabajo 167ms
 ✓ src/__tests__/p4-3-investigate-before-ask.test.ts > P4.3 Suite: Investigar antes de preguntar, Auto-ingesta, Confirmación única y Payload autosuficiente > Criterio 3: Contrato MCP P4.3 > 3.3: propuesta del agente se guarda como inferred con evidence y no avanza la fase 251ms
 ✓ src/__tests__/p4-3-investigate-before-ask.test.ts > P4.3 Suite: Investigar antes de preguntar, Auto-ingesta, Confirmación única y Payload autosuficiente > Criterio 3: Contrato MCP P4.3 > 3.4: la ingesta no degrada source user 232ms
 ✓ src/__tests__/p4-3-investigate-before-ask.test.ts > P4.3 Suite: Investigar antes de preguntar, Auto-ingesta, Confirmación única y Payload autosuficiente > Criterio 3: Contrato MCP P4.3 > 3.5: confirmación única (confirmo todo / corregir con seguimiento) y render_texto presente y consistente 476ms
 ✓ src/__tests__/p4-3-investigate-before-ask.test.ts > P4.3 Suite: Investigar antes de preguntar, Auto-ingesta, Confirmación única y Payload autosuficiente > Criterio 4: Extracción determinista sobre PRD en español con pipeline de etapas > reporta literal el resultado de la extracción heurística parsePrdContent 2ms
 ✓ src/__tests__/p4-3-investigate-before-ask.test.ts > P4.3 Suite: Investigar antes de preguntar, Auto-ingesta, Confirmación única y Payload autosuficiente > Criterio 5: Flujo E2E ONBOARDING determinista > flujo completo ONBOARDING sin ingest por iniciativa propia; falla si se emite pregunta abierta con dato existente 387ms
 ✓ src/__tests__/p4-3-investigate-before-ask.test.ts > P4.3 Suite: Investigar antes de preguntar, Auto-ingesta, Confirmación única y Payload autosuficiente > Criterio 5: Flujo E2E ONBOARDING determinista > valida respuestas y payloads de regresión P4.3 547ms
 ✓ src/__tests__/p4-3-1-b-block.test.ts > P4.3.1 Bloque B - Verificación y Cobertura de Correcciones > Criterio 2 & B1: con el fixture de A1, ninguna pregunta de objetivo, roles o flujos es abierta si hay propuesta; critical_flows nunca contiene rutas; tarjeta no ofrece Confirmo todo con URL sin definir 310ms
 ✓ src/__tests__/p4-3-1-b-block.test.ts > P4.3.1 Bloque B - Verificación y Cobertura de Correcciones > Criterio 3 & B4: la ingesta no modifica notes de source_of_truth y escribe ingest.analyzed_by 242ms
 ✓ src/__tests__/p4-3-1-b-block.test.ts > P4.3.1 Bloque B - Verificación y Cobertura de Correcciones > B5: el detector nunca lee .env ni .env.local; SECRET_KEY=abc123 y credenciales nunca aparecen en scan ni salidas 57ms
 ✓ src/__tests__/p4-3-1-b-block.test.ts > P4.3.1 Bloque B - Verificación y Cobertura de Correcciones > B6: ninguna siguiente_accion tipo trabajo apunta a herramientas que exigen confirmación (qap_module_close, qap_session_close); constante <= 600 caracteres 227ms
 ✓ src/__tests__/p4-3-1-b-block.test.ts > P4.3.1 Bloque B - Verificación y Cobertura de Correcciones > B7: flujo corregir resumen realiza preguntas abiertas una por una citando propuesta, asigna source user, y permite confirmación final 835ms
 ✓ src/__tests__/p4-3-1-b-block.test.ts > P4.3.1 Bloque B - Verificación y Cobertura de Correcciones > B8: advierte si targetPath parece una subcarpeta de un repo con .git sin escanear fuera 138ms
 ✓ src/__tests__/p4-3-1-b-block.test.ts > P4.3.1 Bloque B - Verificación y Cobertura de Correcciones > B9: sanitizeDomString preserva "/", "_" y vocales acentuadas pero sanitiza caracteres de control e inyecciones HTML 3ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > resolves correct topological DAG order respecting dependencies and persists plan.json 121ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > detects missing dependencies and returns structured error without crashing 33ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > detects duplicate case IDs across files and reports error before graph resolution 40ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > detects cyclic dependencies safely returning cycle information without unhandled crashes 42ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > returns explicit cases: [] when module directory has no test cases 25ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > returns explicit cases: [] when cases exist but lack executable steps 32ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > rejects invalid arguments (missing or malformed module) 0ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > rejects unauthorized external targetPath outside authorized projectRoots 11ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > rejects targetPath containing directory traversal escapes 5ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > rejects symlinks and junctions inside project directory 12ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > returns blocked status if target module is not registered in .qa/modules/ 11ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > identifies and preserves manually edited cases with UpdateGuard 48ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > integrates completely with createMcpServer, exposes exactly 18 tools and dispatches qap_plan cleanly 112ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > never synthesizes fake test cases or relies on fallback defaultPlan 27ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > detects modifications in YAML steps and dependencies post-plan generation (FAIL BEFORE / PASS AFTER) 127ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > enforces authorized write mode and rejects directories with hardlinks in .qa (FAIL BEFORE / PASS AFTER) 49ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > handles persistence write failure with sanitized error and no partial files (FAIL BEFORE / PASS AFTER) 33ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > classifies historical plans without cases_fingerprint as unverifiable without deleting them (FAIL BEFORE / PASS AFTER) 31ms
 ✓ src/__tests__/plan-handler.test.ts > PlanHandler Real Declarative Implementation (VNEXT-014-B) > preserves manually edited test cases bit-for-bit on disk without modifying custom content (FAIL BEFORE / PASS AFTER) 79ms
 ✓ src/__tests__/plan-handler.test.ts > R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) > R1.1: rejects truncated or altered matrix.cases even when test cases on disk are intact (FAIL BEFORE / PASS AFTER) 83ms
 ✓ src/__tests__/plan-handler.test.ts > R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) > R1.2: rejects inverted DAG dependencies in matrix.cases (FAIL BEFORE / PASS AFTER) 68ms
 ✓ src/__tests__/plan-handler.test.ts > R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) > R1.3: accepts valid alternate topological orders without arbitrary positional rejection (FAIL BEFORE / PASS AFTER) 85ms
 ✓ src/__tests__/plan-handler.test.ts > R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) > R1.4: rejects environment mismatch between plan and requested environment (FAIL BEFORE / PASS AFTER) 69ms
 ✓ src/__tests__/plan-handler.test.ts > R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) > R1.5: rejects module mismatch when plan belongs to another module (FAIL BEFORE / PASS AFTER) 74ms
 ✓ src/__tests__/plan-handler.test.ts > R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) > R1.6: distinguishes corrupt JSON from missing plan and rejects missing matrix (FAIL BEFORE / PASS AFTER) 28ms
 ✓ src/__tests__/plan-handler.test.ts > R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) > R1.7: rejects unknown or incompatible fingerprint and schema versions (FAIL BEFORE / PASS AFTER) 86ms
 ✓ src/__tests__/plan-handler.test.ts > R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) > R1.8: rejects plan with missing cases_fingerprint_version (FAIL BEFORE / PASS AFTER) 78ms
 ✓ src/__tests__/plan-handler.test.ts > R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) > R1.9: rejects plan with missing checksum (FAIL BEFORE / PASS AFTER) 70ms
 ✓ src/__tests__/plan-handler.test.ts > R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) > R1.10: rejects plan with missing schema version (FAIL BEFORE / PASS AFTER) 69ms
 ✓ src/__tests__/plan-handler.test.ts > R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) > R1.11: handles listTestCases failure as unverifiable and never as success (FAIL BEFORE / PASS AFTER) 11ms
 ✓ src/__tests__/plan-handler.test.ts > R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) > R1.12: returns verified plan and cases snapshot for TOCTOU prevention (FAIL BEFORE / PASS AFTER) 78ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 1: Epistemic Bypass Stress-Testing > 1.1: Rejects status confirmed when provenance is active_probe 2ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 1: Epistemic Bypass Stress-Testing > 1.2: Rejects status confirmed when provenance is crawler 0ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 1: Epistemic Bypass Stress-Testing > 1.3: Rejects status confirmed when provenance is network_intercept or observed_telemetry 0ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 1: Epistemic Bypass Stress-Testing > 1.4: Epistemic spoofing via source instead of provenance is caught 0ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 1: Epistemic Bypass Stress-Testing > 1.5: Invariant R1: legacy_manual_edit without verification_evidence cannot confirm 0ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 1: Epistemic Bypass Stress-Testing > 1.6: Knowledge store and coverage engine strictly prevent observational requirements from confirming 24ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 2: Wire Authorization Injection Stress-Testing > 2.1: Rejects all forbidden authorization keys in wire command arguments 1ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 2: Wire Authorization Injection Stress-Testing > 2.2: Rejects forbidden keys even when combined with waive or accept_gaps 0ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 2: Wire Authorization Injection Stress-Testing > 2.3: Rejects unexpected fields in canonical closure commands 0ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 2: Wire Authorization Injection Stress-Testing > 2.4: Substantive reason enforcement rejects non-substantive explanations (< 15 chars) 0ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 2: Wire Authorization Injection Stress-Testing > 2.5: Host gateway bypass rejection: closes block if gateway is missing 20ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 2: Wire Authorization Injection Stress-Testing > 2.6: Host gateway tampered digest rejection: blocks if decision digest does not match request digest 20ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 2: Wire Authorization Injection Stress-Testing > 2.7: Host gateway expired decision rejection: blocks if review decision timestamp expired 21ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 2: Wire Authorization Injection Stress-Testing > 2.7b: Host gateway malformed date parsing: blocks on NaN/invalid timestamp avoiding fail-open 21ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 2: Wire Authorization Injection Stress-Testing > 2.8: Host gateway rejected decision: blocks if reviewer rejects 24ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 3: Obsolete Revision Invalidation Stress-Testing > 3.1: Aborts and rolls back if module revision mutates during human review window 24ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 3: Obsolete Revision Invalidation Stress-Testing > 3.2: Aborts if module is deactivated during review 19ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 3: Obsolete Revision Invalidation Stress-Testing > 3.3: Prevents approvalId reuse across closure attempts 40ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 4: Dual-Store Crash Recovery Stress-Testing > 4.1: Recovers automatically without second human approval when process crashed after SQLite commit 38ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 4: Dual-Store Crash Recovery Stress-Testing > 4.2: Recovers waived module crash state accurately 41ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 4: Dual-Store Crash Recovery Stress-Testing > 4.3: Corrupt database or wrong AES key strictly rejects without RAM fallback 23ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 5: Legacy Closure Bypass Stress-Testing > 5.1: Legacy qap_module_close rejects canonical module with canonical_closure_required 36ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 5: Legacy Closure Bypass Stress-Testing > 5.2: Legacy qap_module_close waive also blocked for canonical modules 18ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 5: Legacy Closure Bypass Stress-Testing > 5.3: qap_session_close blocks advance to WRAP_UP when canonical module is unclosed 34ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 5: Legacy Closure Bypass Stress-Testing > 5.4: Canonical closure unlocks qap_session_close 64ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 6: False Execution Attestation Stress-Testing > 6.1: Invariant validator rejects execution_coverage status !== not_executed 1ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 6: False Execution Attestation Stress-Testing > 6.2: Rejects non-zero passed counts even if status is not_executed 0ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 6: False Execution Attestation Stress-Testing > 6.3: Invariant validator rejects individual category waiver (Amendment 6) 0ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 6: False Execution Attestation Stress-Testing > 6.4: CanonicalCoverageService evaluate strictly emits not_executed and 0 counts 17ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 7: CAS Concurrency Stress-Testing > 7.1: Physical SQLite concurrent transactions handle race conditions without history corruption 80ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 7: CAS Concurrency Stress-Testing > 7.2: CanonicalClosureService serializes closure and second attempt is idempotent: true 37ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 7: CAS Concurrency Stress-Testing > 7.3: Concurrent closure of distinct modules succeeds via bounded retry loop under SQLite CAS lock 96ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 7: CAS Concurrency Stress-Testing > 7.4: Simultaneous closure requests for same module with divergent gateway decisions persist exactly one closure and canonical receipt 90ms
 ✓ src/__tests__/adversarial-r5-guarantees.test.ts > Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) > Guarantee 7: CAS Concurrency Stress-Testing > 7.5: Rejects write error recovery if existing receipt has tampered provenance or mismatched entity 27ms
 ✓ src/__tests__/report-handler.test.ts > VNEXT-014-D declarative ReportHandler — persisted evidence only > D-R01: blocks reporting when no physical execution record exists 65ms
 ✓ src/__tests__/report-handler.test.ts > VNEXT-014-D declarative ReportHandler — persisted evidence only > D-R02: creates JSON from a persisted schema-valid execution unchanged 76ms
 ✓ src/__tests__/report-handler.test.ts > VNEXT-014-D declarative ReportHandler — persisted evidence only > D-R03: refuses inconsistent totals and does not create a report 53ms
 ✓ src/__tests__/report-handler.test.ts > VNEXT-014-D declarative ReportHandler — persisted evidence only > D-R04: latest selection respects module filter and real finished timestamps 63ms
 ✓ src/__tests__/report-handler.test.ts > VNEXT-014-D declarative ReportHandler — persisted evidence only > D-R05: blocks cross-module requests and path traversal identifiers 50ms
 ✓ src/__tests__/report-handler.test.ts > VNEXT-014-D declarative ReportHandler — persisted evidence only > D-R06: blocks screenshots pointing outside the approved evidence directory 54ms
 ✓ src/__tests__/report-handler.test.ts > VNEXT-014-D declarative ReportHandler — persisted evidence only > D-R07: renders all four formats from one persisted partial execution 113ms
 ✓ src/__tests__/report-handler.test.ts > VNEXT-014-D declarative ReportHandler — persisted evidence only > D-R08: rejects false PASS from a zero-case execution 51ms
 ✓ src/__tests__/report-handler.test.ts > VNEXT-014-D declarative ReportHandler — persisted evidence only > D-R09: rejects a contradictory partial status with no failed, skipped or blocked cases 52ms
 ✓ src/__tests__/report-handler.test.ts > VNEXT-014-D declarative ReportHandler — persisted evidence only > D-R10: rejects duplicate test identifiers without promoting ambiguous coverage 49ms
 ✓ src/__tests__/report-handler.test.ts > VNEXT-014-D declarative ReportHandler — persisted evidence only > D-R11: exposes exactly 18 tools and invokes the migrated report via MCP transport 86ms
 ✓ src/__tests__/report-handler.test.ts > VNEXT-014-D declarative ReportHandler — persisted evidence only > D-R12: an initialized but empty executions directory returns a compatible blocked reason 37ms
 ✓ src/__tests__/e0-investigation.test.ts > E0 / B10 Pruebas de regresión sin impresión > E0a: escaneo respeta targetPath y emite advertencia de subcarpeta si no hay docs 136ms
 ✓ src/__tests__/e0-investigation.test.ts > E0 / B10 Pruebas de regresión sin impresión > E0b: qap_context_ingest no degrada source_of_truth ni contamina notes, registra ingest.analyzed_by 113ms
 ✓ src/__tests__/e0-investigation.test.ts > E0 / B10 Pruebas de regresión sin impresión > E0c: sin evidencia detectedService es undefined y baseUrl no se inventa 93ms
 ✓ src/__tests__/e0-investigation.test.ts > E0 / B10 Pruebas de regresión sin impresión > E0d / B10: objetivo largo se trunca a máx 280 con elipsis sin cortar palabras en preguntas, pero se guarda completo en context 216ms
 ✓ src/__tests__/dispatcher-integration.test.ts > real MCP client/server via linked transports > lists and invokes an injected declarative tool exactly once 26ms
 ✓ src/__tests__/dispatcher-integration.test.ts > real MCP client/server via linked transports > isolates registries and preserves unknown-tool legacy errors 5ms
 ✓ src/__tests__/dispatcher-integration.test.ts > real MCP client/server via linked transports > rejects legacy collisions and duplicate injected names at startup 2ms
 ✓ src/__tests__/dispatcher-integration.test.ts > real MCP client/server via linked transports > preserves 16 definitions, order, prompts and legacy rules schema; adds explicit canonical interview operations 15ms
 ✓ src/__tests__/dispatcher-integration.test.ts > real MCP client/server via linked transports > runs informative legacy status on an empty disposable fixture 66ms
 ✓ src/__tests__/dispatcher-integration.test.ts > real MCP client/server via linked transports > sanitizes declarative exceptions through the real SDK 2ms
 ✓ src/__tests__/dispatcher-integration.test.ts > real MCP client/server via linked transports > demonstrates that low-level SDK does not validate inputSchema 1ms
 ✓ src/__tests__/dispatcher-integration.test.ts > real MCP client/server via linked transports > applies a handler validator through MCP before execution 2ms
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
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher execution > does not invoke handlers with an already cancelled context 1ms
 ✓ src/__tests__/dispatcher.test.ts > ToolDispatcher execution > prevents registry mutation from inside an executing handler 0ms
 ✓ src/__tests__/guidance.test.ts > Módulo de Guía Conversacional por Fase (E6 - P4.2) > ONBOARDING: debe generar tipo "entrevista" con UNA pregunta estructurada pendiente y sin opciones top-level 6ms
 ✓ src/__tests__/guidance.test.ts > Módulo de Guía Conversacional por Fase (E6 - P4.2) > ONBOARDING: debe entregar la siguiente pregunta pendiente en orden canónico 1ms
 ✓ src/__tests__/guidance.test.ts > Módulo de Guía Conversacional por Fase (E6 - P4.2) > SCOPING: debe generar tipo "decision" requiriendo qap_session_plan y proponiendo sugerencias en pregunta.opciones 1ms
 ✓ src/__tests__/guidance.test.ts > Módulo de Guía Conversacional por Fase (E6 - P4.2) > WORKING: debe indicar el siguiente módulo en estado planned con tool qap_discover 1ms
 ✓ src/__tests__/guidance.test.ts > Módulo de Guía Conversacional por Fase (E6 - P4.2) > WORKING: debe priorizar módulo en interviewing con tipo entrevista_vista y tool qap_rules_set 1ms
 ✓ src/__tests__/guidance.test.ts > Módulo de Guía Conversacional por Fase (E6 - P4.2) > WORKING: debe dirigir a qap_session_close con tipo decision si todos los módulos están listos 1ms
 ✓ src/__tests__/guidance.test.ts > Módulo de Guía Conversacional por Fase (E6 - P4.2) > WRAP_UP: debe ofrecer decisión con opciones de Knowledge Graph y nueva sesión 0ms

 Test Files  7 failed | 16 passed (23)
      Tests  55 failed | 406 passed (461)
   Start at  00:12:45
   Duration  140.72s (transform 1.62s, setup 0ms, import 23.55s, tests 110.62s, environment 2ms)

JSON report written to <ARTEFACTOS>/mcp.json
undefined
<WORKTREE>\packages\mcp:
[ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL] Command failed with exit code 1: vitest run "--maxWorkers=1" "--reporter=verbose" "--reporter=json" "--outputFile.json=<ARTEFACTOS>/mcp.json"
~~~

err:

~~~text
stderr | src/__tests__/server.test.ts > Suite MCP Server QAP v2.1 / v2.1.2 > debe operar sobre targetPath independiente de cwd y validar qap_server
[QAP Knowledge Graph] Servidor interactivo iniciado en: http://localhost:9555
[QAP Knowledge Graph] Base de conocimiento servida desde: <TEMP>/qap-custom-target-pY8NuP\.qa


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
Error: ENOENT: no such file or directory, open '<TEMP>/qap-v3-e2e-kjiUbt\.qa\modules\auth\rules.yaml'
 ❯ src/__tests__/lifecycle-v3-e2e.test.ts:407:28
    405|     // Completar y cerrar auth
    406|     await callTool('qap_discover', { name: 'auth', path: '/login' });
    407|     const doc = YAML.parse(readFileSync(join(tempDir, '.qa', 'modules'…
       |                            ^
    408|     const inferred = doc.rules.map((r: any) => ({ ...r, status: 'confi…
    409|     await callTool('qap_rules_set', {

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
Serialized Error: { errno: -4058, code: 'ENOENT', syscall: 'open', path: '<TEMP>/qap-v3-e2e-kjiUbt\.qa\modules\auth\rules.yaml' }
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
Error: ENOENT: no such file or directory, open '<TEMP>/qap-p45a-zzFljJ\.qa\modules\catalogo\rules.yaml'
 ❯ src/__tests__/p4-5a-integrity.test.ts:535:28
    533|       rules: [{ category: 'proposito', user_text: 'PalabraUnica Palabr…
    534|     });
    535|     const rf1 = YAML.parse(readFileSync(join(tempDir, '.qa', 'modules'…
       |                            ^
    536|     const pRule = rf1.rules.find((r: { category: string }) => r.catego…
    537|     expect(pRule.source).toBe('user_text');

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
Serialized Error: { errno: -4058, code: 'ENOENT', syscall: 'open', path: '<TEMP>/qap-p45a-zzFljJ\.qa\modules\catalogo\rules.yaml' }
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
~~~

## runner — salida 0

out:

~~~text
RUN  v4.1.11 <WORKTREE>/packages/playwright-runner

 ✓ test/lifecycle.test.ts > RunnerLifecycle (S7-002) > inicializa el navegador y crea contextos aislados por caso 249ms
 ✓ test/lifecycle.test.ts > RunnerLifecycle (S7-002) > aplica el viewport configurado 251ms
 ✓ test/lifecycle.test.ts > RunnerLifecycle (S7-002) > crea una pagina aislada por paso dentro del mismo caso 298ms
 ✓ test/lifecycle.test.ts > RunnerLifecycle (S7-002) > cleanup() cierra el navegador y es seguro llamarlo varias veces 200ms
 ✓ test/lifecycle.test.ts > RunnerLifecycle (S7-002) > ante SIGINT, invoca cleanup() y termina el proceso de forma segura 548ms
 ✓ test/runner.test.ts > PlaywrightRunner (S7-001) > ejecuta un plan sin casos y devuelve un ExecutionResult válido 13ms
 ✓ test/runner.test.ts > PlaywrightRunner (S7-001) > ejecuta un caso real usando storageResolver y navega sin consumir tokens de IA 414ms
 ✓ test/runner.test.ts > PlaywrightRunner (S7-001) > con sesión válida inyectada vía resolveModuleSession, accede a ruta protegida sin redirigir a /login 368ms
 ✓ test/actions.test.ts > Acciones base del runner (S7-003) > navigate espera a que la carga de la página termine 42ms
 ✓ test/actions.test.ts > Acciones base del runner (S7-003) > navigate lanza un error claro si falta la url 2ms
 ✓ test/actions.test.ts > Acciones base del runner (S7-003) > click hace scroll automático hasta un elemento fuera del viewport 178ms
 ✓ test/actions.test.ts > Acciones base del runner (S7-003) > click lanza un error claro si falta el selector 1ms
 ✓ test/actions.test.ts > Acciones base del runner (S7-003) > fill espera visibilidad y escribe el valor en el input 81ms
 ✓ test/actions.test.ts > Acciones base del runner (S7-003) > fill reemplaza el valor previo en vez de concatenarlo 42ms
 ✓ test/actions.test.ts > Acciones base del runner (S7-003) > fill lanza un error claro si falta el value 11ms
 ✓ src/__tests__/actions.test.ts > Acciones S7-004 (assert, waitFor) > debe validar aserción visible y contains correctamente 53ms
 ✓ src/__tests__/actions.test.ts > Acciones S7-004 (assert, waitFor) > debe fallar si la aserción no se cumple 15ms
 ✓ src/__tests__/actions.test.ts > Acciones S7-004 (assert, waitFor) > debe esperar correctamente con waitFor 111ms
 ✓ src/__tests__/actions-context.test.ts > Acciones S7-005 (capture, evaluate, switch_auth) > captura el texto de un elemento y lo guarda en las variables de contexto 87ms
 ✓ src/__tests__/actions-context.test.ts > Acciones S7-005 (capture, evaluate, switch_auth) > captura el value de un input, no su textContent 34ms
 ✓ src/__tests__/actions-context.test.ts > Acciones S7-005 (capture, evaluate, switch_auth) > evaluate puede leer una variable capturada previamente vía ctx 6ms
 ✓ src/__tests__/actions-context.test.ts > Acciones S7-005 (capture, evaluate, switch_auth) > evaluate lee el DOM real de la página y guarda el resultado en capture_as 16ms
 ✓ src/__tests__/actions-context.test.ts > Acciones S7-005 (capture, evaluate, switch_auth) > switch_auth lanza un error claro si no se definió auth_profile 2ms
 ✓ src/__tests__/actions-context.test.ts > Acciones S7-005 (capture, evaluate, switch_auth) > switch_auth lanza un error claro si no existe sesión válida para el perfil 10ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 1: Empty Cases Execution Honesty > C1.1: empty cases array returns result failed with total=0, passed=0, failed=0 13ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 1: Empty Cases Execution Honesty > C1.2: omitted cases property (undefined) defaults safely and returns failed 9ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 1: Empty Cases Execution Honesty > C1.3: empty cases execution acquires and cleans up module lock without leaving dangling locks 10ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 1: Empty Cases Execution Honesty > C1.4: empty cases never initiates browser launch 8ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 2: Unsupported / Unknown Step Actions > C2.1: step with unsupported action fails step and case, never returns passed 12ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 2: Unsupported / Unknown Step Actions > C2.2: step with malicious eval action is rejected cleanly as unsupported 42ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 2: Unsupported / Unknown Step Actions > C2.3: step missing type property entirely defaults to desconocido and fails 12ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 2: Unsupported / Unknown Step Actions > C2.4: step with empty string type fails explicitly 23ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 3: Skipped / Not_Run Cases Dependency Propagation > C3.1: transitive dependency failure cascades not_run through deep chain 39ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 3: Skipped / Not_Run Cases Dependency Propagation > C3.2: diamond dependency DAG cascades correctly when root fails 14ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 3: Skipped / Not_Run Cases Dependency Propagation > C3.3: dependent case pointing to non-existent case is safely skipped as not_run 51ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 3: Skipped / Not_Run Cases Dependency Propagation > C3.4: self-dependency (cycle of 1) is safely skipped as not_run without infinite loop 32ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 3: Skipped / Not_Run Cases Dependency Propagation > C3.5: mutual circular dependency (A depends on B, B depends on A) safely skips both as not_run 11ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 4: Project Root Isolation & No CWD Dependency > C4.1: runner confines lock acquisition to options.projectRoot without polluting process.cwd() 8ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 4: Project Root Isolation & No CWD Dependency > C4.2: screenshotsDir resolves relative to options.projectRoot 9ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 5: Infrastructure Errors vs Functional Failures > C5.1: Chromium launch failure produces result error, 0 failed, all not_run with structured reasons 41ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 5: Infrastructure Errors vs Functional Failures > C5.2: Chromium launch timeout produces result error without lock leakage 12ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 5: Infrastructure Errors vs Functional Failures > C5.3: infrastructure error ExecutionResult satisfies strict schema validation 70ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 6: Host MCP Process Protection & Signals > C6.1: runner NEVER calls process.exit under any circumstances in default mode 12ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 6: Host MCP Process Protection & Signals > C6.2: runner does NOT register uncleaned global signal listeners 8ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 6: Host MCP Process Protection & Signals > C6.3: pre-aborted cancellation returns error and accounts for every unexecuted case 5ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 6: Host MCP Process Protection & Signals > C6.4: cooperative cancellation mid-execution marks remaining cases not_run without crashing process 8ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 7: High Volume & Stress Testing > C7.1: stress-tests large DAG with 25 interdependent cases 62ms
 ✓ test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 7: High Volume & Stress Testing > C7.2: concurrent runner executions in distinct workspaces do not interfere 10ms
 ✓ test/spike.test.ts > Spike tecnico: Chromium headless con playwright-core > debe lanzar Chromium, navegar y resolver un selector sin errores 313ms
 ✓ test/session-resolver.test.ts > session-resolver (S75-006A) > debe retornar null si el módulo no requiere autenticación 6ms
 ✓ test/session-resolver.test.ts > session-resolver (S75-006A) > debe recuperar y descifrar una sesión válida guardada en el SessionStore (AES-256-GCM) 36ms
 ✓ test/session-resolver.test.ts > session-resolver (S75-006A) > debe detectar sesión expirada y descartarla 22ms
 ✓ test/session-resolver.test.ts > session-resolver (S75-006A) > ante sesión expirada, ejecuta re-login automático (login_mode: auto) y guarda la nueva sesión 237ms
 ✓ test/runner-safety-honesty.test.ts > PlaywrightRunner Safety & Honesty Regressions — VNEXT-014-C1 (R2) > REG-R2-01: honors options.projectRoot and avoids assuming process.cwd() (FAIL BEFORE / PASS AFTER) 20ms
 ✓ test/runner-safety-honesty.test.ts > PlaywrightRunner Safety & Honesty Regressions — VNEXT-014-C1 (R2) > REG-R2-02: zero cases executed never produces passed verdict (FAIL BEFORE / PASS AFTER) 10ms
 ✓ test/runner-safety-honesty.test.ts > PlaywrightRunner Safety & Honesty Regressions — VNEXT-014-C1 (R2) > REG-R2-03: unknown or unsupported step types fail explicitly (FAIL BEFORE / PASS AFTER) 2ms
 ✓ test/runner-safety-honesty.test.ts > PlaywrightRunner Safety & Honesty Regressions — VNEXT-014-C1 (R2) > REG-R2-04: classifies Chromium launch failure as infrastructure error with not_run cases (FAIL BEFORE / PASS AFTER) 15ms
 ✓ test/runner-safety-honesty.test.ts > PlaywrightRunner Safety & Honesty Regressions — VNEXT-014-C1 (R2) > REG-R2-05: produces execution result strictly compliant with schema without rejected properties (FAIL BEFORE / PASS AFTER) 68ms
 ✓ test/runner-safety-honesty.test.ts > PlaywrightRunner Safety & Honesty Regressions — VNEXT-014-C1 (R2) > REG-R2-06: propagates DAG dependencies skipping blocked cases and preserves unrun cases on failFast (FAIL BEFORE / PASS AFTER) 18ms
 ✓ test/runner-safety-honesty.test.ts > PlaywrightRunner Safety & Honesty Regressions — VNEXT-014-C1 (R2) > REG-R2-07: host MCP process safety: does not call process.exit or install global exit listeners by default (FAIL BEFORE / PASS AFTER) 6ms
 ✓ test/runner-safety-honesty.test.ts > PlaywrightRunner Safety & Honesty Regressions — VNEXT-014-C1 (R2) > REG-R2-08: prevents implicit auto-login and unattended browser launch when allowImplicitAuth is false (FAIL BEFORE / PASS AFTER) 16ms
 ✓ test/runner-safety-honesty.test.ts > PlaywrightRunner Safety & Honesty Regressions — VNEXT-014-C1 (R2) > REG-R2-09: isUrlAllowedByPolicy correctly verifies origins and wildcards (FAIL BEFORE / PASS AFTER) 1ms
 ✓ test/runner-safety-honesty.test.ts > PlaywrightRunner Safety & Honesty Regressions — VNEXT-014-C1 (R2) > REG-R2-10: separate runs cannot overwrite one another when Date.now collides 10ms
 ✓ test/runner-safety-honesty.test.ts > PlaywrightRunner Safety & Honesty Regressions — VNEXT-014-C1 (R2) > REG-R2-11: a browser-context setup failure reports an error and every planned case as not_run 8ms
 ✓ src/__tests__/interpolator.test.ts > Interpolador de variables de contexto (S7-006) > reemplaza una sola variable dentro de un string 2ms
 ✓ src/__tests__/interpolator.test.ts > Interpolador de variables de contexto (S7-006) > reemplaza múltiples variables distintas en el mismo string 0ms
 ✓ src/__tests__/interpolator.test.ts > Interpolador de variables de contexto (S7-006) > deja intacto un string sin ningún placeholder 0ms
 ✓ src/__tests__/interpolator.test.ts > Interpolador de variables de contexto (S7-006) > lanza un error claro si la variable referenciada no existe 1ms
 ✓ src/__tests__/interpolator.test.ts > Interpolador de variables de contexto (S7-006) > interpolateStep reemplaza selector, value y url de un step 0ms
 ✓ src/__tests__/interpolator.test.ts > Interpolador de variables de contexto (S7-006) > interpolateStep NO toca el campo expression (evaluate usa ctx directamente) 0ms
 ✓ src/__tests__/interpolator.test.ts > Interpolador de variables de contexto (S7-006) > interpolateStep no modifica el step original (devuelve una copia) 0ms

 Test Files  10 passed (10)
      Tests  71 passed (71)
   Start at  00:15:07
   Duration  15.34s (transform 488ms, setup 0ms, import 6.58s, tests 5.58s, environment 1ms)
~~~

err:

~~~text
stderr | test/adversarial-stress.test.ts > Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner > Challenge 5: Infrastructure Errors vs Functional Failures > C5.1: Chromium launch failure produces result error, 0 failed, all not_run with structured reasons
[PlaywrightRunner] Error de infraestructura al iniciar el navegador Chromium: Error: Executable doesn't exist at <USER>\AppData\Local\ms-playwright\chromium
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

stderr | test/runner-safety-honesty.test.ts > PlaywrightRunner Safety & Honesty Regressions — VNEXT-014-C1 (R2) > REG-R2-04: classifies Chromium launch failure as infrastructure error with not_run cases (FAIL BEFORE / PASS AFTER)
[PlaywrightRunner] Error de infraestructura al iniciar el navegador Chromium: Error: Executable doesn't exist at <USER>\AppData\Local\ms-playwright\chromium
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
~~~

## lint-global — salida 1

out:

~~~text
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
~~~

err:

~~~text
$ eslint .
~~~

## stdio — salida 0

out:

~~~text
[
  "qap_status",
  "qap_init",
  "qap_clean",
  "qap_auth_add",
  "qap_auth_list",
  "qap_context_set",
  "qap_context_ingest",
  "qap_session_plan",
  "qap_discover",
  "qap_plan",
  "qap_validate",
  "qap_test",
  "qap_report",
  "qap_server",
  "qap_prune",
  "qap_rules_set",
  "qap_module_close",
  "qap_session_close"
]
qap_status {"status":"success","directorio_objetivo":"<ARTEFACTOS>\\stdio-fixture","initialized":false,"context_state":"missing","preflight":{"navegador_qap":"ok","comando_instalacion":"npx playwright install chromium"},"navegador_qap":"ok","projectName":"stdio-fixture","environments":[],"stats":{"modules":0,"authProfiles":0,"executions":0},"validatorReady":true,"scan":{"_version":"1","scanned_at":"2026-11-05T06:16:53.571Z","workspace_root":"<ARTEFACTOS>/stdio-fixture","documentos":[],"subproyectos":[],"servicios":[]},"hallazgos_workspace":{"documentos":[],"subproyectos":[],"servicios":[]},"advertencias":[],"siguiente_accion":{"tipo":"entrevista","descripcion":"Proyecto no inicializado. Comienza el onboarding respondiendo a la fuente de verdad.","tool":"qap_init","pregunta":{"id":"onboarding.fuente_de_verdad","texto":"Selecciona la fuente de verdad del proyecto para extraer el alcance y especificación:","formato":"una_opcion","opciones":[{"id":"custom","etiqueta":"Sí existe (indicaré la ruta)","recomendada":true,"efecto":{"accion":"declarar_fuente"}},{"id":"none","etiqueta":"No, definimos desde cero","efecto":{"accion":"sin_documento"}}],"permite_otra":true,"registrar_con":{"tool":"qap_context_set","campo":"source_of_truth"},"render_texto":"Selecciona la fuente de verdad del proyecto para extraer el alcance y especificación:\n\n1. Sí existe (indicaré la ruta) [Recomendada]\n2. No, definimos desde cero\n\n(Responde con el número de tu opción o escribe una respuesta libre)"}},"_guidance_for_assistant":"NO expliques listas de pasos futuros. Haz al usuario la pregunta con ask_question: Selecciona la fuente de verdad del proyecto para extraer el alcance y especificación:","knowledge":{"state":"unbound"},"canonical_modules":[],"canonical_bridge":{"absence_does_not_imply_no_observations":true,"coverage":"partial","human_review_required":true},"integration":{"discovery_advances_lifecycle":false,"canonical_interview":"unavailable","observations_are_confirmed_requirements":false,"module_association":"inspect_canonical_modules","next_safe_action":"Revisar el inventario con qap_status. Para entrevistar se requiere contexto legacy previamente revisado o una integración futura expresamente autorizada; repetir discovery no crea ese contexto."},"provenance":{"knowledge":"IKnowledgeStore","onboarding":"legacy_files","hallazgos_workspace":"workspace_inspection","preflight":"runtime"},"coverage":"partial_inventory_not_test_verdicts"}
qap_init {"status":"success","directorio_objetivo":"<ARTEFACTOS>\\stdio-fixture","message":"✔ Proyecto inicializado con éxito en .qa/","projectName":"mcp-live-test","preflight":{"navegador_qap":"ok","comando_instalacion":"npx playwright install chromium"},"navegador_qap":"ok","repo_map_resumen":{"total_rutas":0,"advertencias":[]},"environments":["local","qa"],"directories":["\\.qa\\project","\\.qa\\modules","\\.qa\\cache","\\.qa\\executions","\\.qa\\plans"],"ya_existia":false,"hallazgos_workspace":{"documentos":[],"subproyectos":[],"servicios":[]},"scan":{"_version":"1","scanned_at":"2026-11-05T06:16:53.622Z","workspace_root":"<ARTEFACTOS>/stdio-fixture","documentos":[],"subproyectos":[],"servicios":[]},"advertencias":[],"roles_descartados":[],"lifecycle":{"phase":"ONBOARDING"},"fase":"ONBOARDING","siguiente_accion":{"tipo":"entrevista","descripcion":"Pregunta pendiente de onboarding (onboarding.fuente_de_verdad). Preséntala al usuario usando la herramienta interactiva ask_question.","tool":"qap_context_set","pregunta":{"id":"onboarding.fuente_de_verdad","texto":"Selecciona la fuente de verdad del proyecto para extraer el alcance y especificación:","formato":"una_opcion","opciones":[{"id":"custom","etiqueta":"Sí existe (indicaré la ruta)","recomendada":true,"efecto":{"accion":"declarar_fuente"}},{"id":"none","etiqueta":"No, definimos desde cero","efecto":{"accion":"sin_documento"}}],"permite_otra":true,"registrar_con":{"tool":"qap_context_set","campo":"source_of_truth"},"render_texto":"Selecciona la fuente de verdad del proyecto para extraer el alcance y especificación:\n\n1. Sí existe (indicaré la ruta) [Recomendada]\n2. No, definimos desde cero\n\n(Responde con el número de tu opción o escribe una respuesta libre)"}},"_guidance_for_assistant":"Fase actual: ONBOARDING. Siguiente acción: Pregunta pendiente de onboarding (onboarding.fuente_de_verdad). Preséntala al usuario usando la herramienta interactiva ask_question."}
qap_status {"status":"success","directorio_objetivo":"<ARTEFACTOS>\\stdio-fixture","initialized":true,"context_state":"available","preflight":{"navegador_qap":"ok","comando_instalacion":"npx playwright install chromium"},"navegador_qap":"ok","fase":"ONBOARDING","estados_modulos":{},"faltantes":[{"campo":"objective","motivo":"el objetivo coincide con el texto autogenerado por qap_init"},{"campo":"roles","motivo":"debe definirse al menos un rol de usuario"},{"campo":"critical_flows","motivo":"debe definirse al menos un flujo crítico"},{"campo":"source_of_truth","motivo":"debe declararse la fuente de verdad del proyecto"}],"siguiente_accion":{"tipo":"entrevista","descripcion":"Pregunta pendiente de onboarding (onboarding.fuente_de_verdad). Preséntala al usuario usando la herramienta interactiva ask_question.","tool":"qap_context_set","pregunta":{"id":"onboarding.fuente_de_verdad","texto":"Selecciona la fuente de verdad del proyecto para extraer el alcance y especificación:","formato":"una_opcion","opciones":[{"id":"custom","etiqueta":"Sí existe (indicaré la ruta)","recomendada":true,"efecto":{"accion":"declarar_fuente"}},{"id":"none","etiqueta":"No, definimos desde cero","efecto":{"accion":"sin_documento"}}],"permite_otra":true,"registrar_con":{"tool":"qap_context_set","campo":"source_of_truth"},"render_texto":"Selecciona la fuente de verdad del proyecto para extraer el alcance y especificación:\n\n1. Sí existe (indicaré la ruta) [Recomendada]\n2. No, definimos desde cero\n\n(Responde con el número de tu opción o escribe una respuesta libre)"}},"scan":{"_version":"1","scanned_at":"2026-11-05T06:16:53.766Z","workspace_root":"<ARTEFACTOS>/stdio-fixture","documentos":[],"subproyectos":[],"servicios":[]},"hallazgos_workspace":{"documentos":[],"subproyectos":[],"servicios":[]},"advertencias":[],"projectName":"mcp-live-test","environments":["local","qa"],"stats":{"modules":0,"authProfiles":0,"executions":0},"validatorReady":true,"_guidance_for_assistant":"Fase actual: ONBOARDING. Siguiente acción: Pregunta pendiente de onboarding (onboarding.fuente_de_verdad). Preséntala al usuario usando la herramienta interactiva ask_question.","knowledge":{"state":"unbound"},"canonical_modules":[],"canonical_bridge":{"absence_does_not_imply_no_observations":true,"coverage":"partial","human_review_required":true},"integration":{"discovery_advances_lifecycle":false,"canonical_interview":"unavailable","observations_are_confirmed_requirements":false,"module_association":"inspect_canonical_modules","next_safe_action":"Revisar el inventario con qap_status. Para entrevistar se requiere contexto legacy previamente revisado o una integración futura expresamente autorizada; repetir discovery no crea ese contexto."},"provenance":{"knowledge":"IKnowledgeStore","onboarding":"legacy_files","hallazgos_workspace":"workspace_inspection","preflight":"runtime"},"coverage":"partial_inventory_not_test_verdicts"}
SERVIDOR MCP FUNCIONANDO AL 100% SOBRE STDIO
~~~

err:

~~~text
[QAP MCP Server] Servidor iniciado correctamente en transporte Stdio.
~~~

## interview-probe-portable — salida 0

out:

~~~text
{"step":"before_interview","pending":0,"invented":false,"sqlite_and_lifecycle_unchanged":true}
{"step":"opened","question_id":"interview:fcfcd1940116edf82ad4bdedc1b15fe99a2e24e05a46a775ab667cae278ee532","version":0,"pending":7,"next":{"tipo":"trabajo","tool":"qap_rules_set","module":"catalog","modulo":"catalog","canonical_interview":{"action":"next"},"descripcion":"El módulo 'catalog' tiene una pregunta canónica pendiente del host. Reanúdala mediante qap_rules_set con canonical_interview.action=next; la respuesta requiere revisión humana independiente antes de acreditar cobertura o cerrar."},"requirements":0,"gateway_requests":0,"sqlite_and_lifecycle_unchanged":true,"sqlite_sha256":{"main":"5b4c221da042dfef1b19a8c344e9efde6a31889757d735088810bf5f2863b944","-wal":"9df32825719c5a25067e2d7b172453e1f99f8d124c1f14fc9e244b7a612b60b7"},"lifecycle_sha256":"d76b37f9927b84f9243042d8141da68222117b0c6307531b0b58280c162e764e","rules_yaml":false}
{"step":"proposed","question_id":"interview:fcfcd1940116edf82ad4bdedc1b15fe99a2e24e05a46a775ab667cae278ee532","version":1,"pending":7,"next":{"tipo":"trabajo","tool":"qap_rules_set","module":"catalog","modulo":"catalog","canonical_interview":{"action":"next"},"descripcion":"El módulo 'catalog' tiene una pregunta canónica pendiente del host. Reanúdala mediante qap_rules_set con canonical_interview.action=next; la respuesta requiere revisión humana independiente antes de acreditar cobertura o cerrar."},"requirements":0,"gateway_requests":0,"sqlite_and_lifecycle_unchanged":true,"sqlite_sha256":{"main":"5b4c221da042dfef1b19a8c344e9efde6a31889757d735088810bf5f2863b944","-wal":"9df32825719c5a25067e2d7b172453e1f99f8d124c1f14fc9e244b7a612b60b7"},"lifecycle_sha256":"d76b37f9927b84f9243042d8141da68222117b0c6307531b0b58280c162e764e","rules_yaml":false}
~~~

## discovery-repeat — salida 0

out:

~~~text
RUN  v4.1.11 <WORKTREE>/packages/mcp

 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > R3: unauthorized disposable root is a scoped block, not a fabricated browser outage 75ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > R1: onboarding to anonymous discovery preserves planned state and explicitly blocks the legacy interview 3223ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > R1: stale observed state cannot manufacture rules or close a module without view context 239ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > R1: stale consolidated state cannot manufacture rules or close a module without view context 234ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > R1: existing reviewed legacy context still accepts rules without promoting agent text or canonical observations 244ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > R1: explicit waiver remains an honest exit without claiming discovery or test coverage 103ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > owns exactly one route, preserves order, rejects collisions, and never falls back 116ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > navigates a real MPA, returns actual counts, commits once and reopens physical SQLite 1125ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > keeps project bindings and physical stores isolated between server instances 2356ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > distinguishes static completion from a script dependent shell (false) 855ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > distinguishes static completion from a script dependent shell (true) 858ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks credentials without navigation or credential reflection 50ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks profile without navigation or credential reflection 51ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks profileId without navigation or credential reflection 47ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks storageState without navigation or credential reflection 53ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks cookies without navigation or credential reflection 46ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks session without navigation or credential reflection 45ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks auth without navigation or credential reflection 55ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target /unknown 82ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target //127.0.0.1/ 89ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target /a/../ 83ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target /%2e/ 77ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target /?token=secret 90ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target /#fragment 75ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target http://user:secret@127.0.0.1/ 82ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target /a\b 86ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects ambiguous or unauthorized target  / 85ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > retains phase gate ONBOARDING without lifecycle writes 100ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > retains phase gate SCOPING without lifecycle writes 103ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > retains phase gate WRAP_UP without lifecycle writes 83ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > blocks missing binding, stale authorization and incompatible environment 145ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > requires explicit read-only host acknowledgement and rejects authenticated plans/terminal modules 245ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > keeps host configuration isolated from later caller mutations 1070ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > rejects an already cancelled dispatcher invocation before crawler start 43ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > propagates in-flight dispatcher cancellation to transport and waits for cleanup 790ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > sanitizes host failures and emits no secret-bearing console logs 75ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > delegates page denial and budgets to the real crawler 988ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > delegates bytes denial and budgets to the real crawler 936ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > delegates browser denial and budgets to the real crawler 98ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > delegates redirect denial and budgets to the real crawler 892ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > delegates private denial and budgets to the real crawler 1064ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > delegates dns denial and budgets to the real crawler 1168ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > reports atomic persistence failure without fabricated persisted findings 1846ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > R4: real crawler to canonical interview, independent review, secure waiver and WRAP_UP through MCP 1780ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: missing 29ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: wrong-id 29ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: wrong-key 27ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: inactive 31ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: ambiguous 26ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: application 27ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: environment 27ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: revision 31ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: unplanned 40ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > rejects unsafe identity: id-key-conflict 32ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > persists real MCP/Chrome/MPA associations, reopens SQLite, projects status, and preserves epistemic planes 3410ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > recovers after physical association rollback without reacquisition or history changes; rejects shortened and mixed receipts 3445ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > two physical connections race with CAS; retry is idempotent and context changes block recovery 1270ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > isolates same planned names across physical projects and rejects another project receipt 101ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013-R2 canonical execution scope bridge > detects context changed at the edge commit boundary without deleting already acquired facts 1139ms

 Test Files  1 passed (1)
      Tests  59 passed (59)
   Start at  00:17:33
   Duration  34.84s (transform 1.02s, setup 0ms, import 2.88s, tests 31.62s, environment 0ms)
~~~
