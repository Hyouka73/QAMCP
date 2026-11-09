# Comandos y trazabilidad de R4-R4

Windows x64, worktree aislado en detached HEAD, Node 24.15.0, SQLite 3.51.3 (tabla virtual FTS5 y consulta MATCH verificadas), pnpm 11.3.0, lockfile congelado, TypeScript 5.5.4, Vitest 4.1.11, Playwright 1.63.0 y Chromium 153.0.8010.12. Sustituir <WORKTREE> y <ARTEFACTOS> por rutas absolutas. Los logs originales y las bases de los fixtures se conservaron fuera del repositorio.

Cada línea registra identificador, código de salida y comando.

~~~text
git-status	0	git status --short
git-branch	0	git branch --show-current
git-head	0	git rev-parse HEAD
git-remote	0	git remote -v
git-remote-head	0	git rev-parse refs/remotes/origin/feat/qap-vnext-architecture
git-diff	0	git diff 7e0142a97c67fa1c65c46a83e2a5f003b0b435cd HEAD --stat
node	0	node -v
fts	0	node -e 'const {DatabaseSync}=require("node:sqlite");const db=new DatabaseSync(":memory:");db.exec("CREATE VIRTUAL TABLE probe USING fts5(body); INSERT INTO probe VALUES ('audit')"); console.log(process.version,db.prepare("SELECT sqlite_version() AS sqlite, body FROM probe WHERE probe MATCH 'audit'").get());'
pnpm	0	pnpm -v
install	0	pnpm install --frozen-lockfile
typescript	0	pnpm exec tsc --version
vitest	0	pnpm --filter @qap/mcp exec vitest --version
playwright	0	pnpm exec playwright-core --version
build	0	pnpm build
chromium-probe	0	node --input-type=module -e 'import {chromium} from 'playwright-core'; const b=await chromium.launch(); console.log(b.version()); await b.close();'
r4-r3	0	pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-coverage.test.ts -t 'R4-R3: inconsistent durable closure' --maxWorkers=1 --reporter=verbose
r4-r4	0	pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-coverage.test.ts -t 'R4-R4-A01 positive' --maxWorkers=1 --reporter=verbose
coverage	0	pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-coverage.test.ts --maxWorkers=1 --reporter=verbose
discovery	0	pnpm --filter @qap/mcp exec vitest run src/__tests__/discovery-handler.test.ts --maxWorkers=1 --reporter=verbose
lint-focus	0	pnpm --filter @qap/mcp exec eslint src/handlers/canonical-closure-service.ts src/__tests__/canonical-coverage.test.ts src/handlers/status.handler.ts
mcp	1	pnpm --filter @qap/mcp exec vitest run --maxWorkers=1 --reporter=verbose --reporter=json '--outputFile.json=<ARTEFACTOS>/mcp.json'
runner	0	pnpm --filter @qap/playwright-runner exec vitest run --maxWorkers=1 --reporter=verbose
lint-global	1	pnpm lint
stdio	0	node '<ARTEFACTOS>/stdio.mjs' <WORKTREE> '<ARTEFACTOS>/stdio-fixture'
git-final	0	git status --short
status-16	0	node --experimental-transform-types <ARTEFACTOS>/status-limit.mjs <WORKTREE> <ARTEFACTOS> 16
status-17	1	node --experimental-transform-types <ARTEFACTOS>/status-limit.mjs <WORKTREE> <ARTEFACTOS> 17
~~~

Stdio utilizó el cliente SDK con el servidor compilado, cwd y targetPath absolutos del fixture. Verificó 18 herramientas, llamó qap_status antes y después de qap_init (success, ONBOARDING), y comprobó la creación física de .qa.

## Inventario

| Archivo | Bytes | SHA-256 original |
| --- | ---: | --- |
| runs.tsv | 2430 | 32b574ce8c00e4e04a6ca62596fdeb7995936188a987b94884cc83bc0a7ca3a5 |
| build.out | 8215 | 8aa5f1b9ab4078b8894d36bcb32c724dc1e460b4a3a4c440e577e360e9a99cd4 |
| r4-r3.out | 8751 | 8fcdd2d502376d407376ff7226499719e01bb0e2359e3e00b55d13e05a175ee0 |
| r4-r4.out | 8715 | 4eb1c377917191cd43fac56618fb21563752ce7d0cc2466e91121043a8867cb4 |
| coverage.out | 8876 | 687b3b6836450734340d6730bb1973f14670fa9d541a3b158094397cc3d2538a |
| discovery.out | 9860 | bf87495f4ba391b99df8e963d10974ac2892e5f0a5e3dc933f38f080d4978344 |
| lint-focus.out | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| lint-global.out | 11140 | aa9c70db9abe65c369d721dc494b2d510911af47e1f56b2242167ba5fbae6c50 |
| mcp.out | 97928 | 172b1269a4448c40a3624bb4218a0602a2f94ee9874870f12209bda7683fe45f |
| mcp.err | 46696 | ac8eddb1b787c71f44e6346704de7a072f25daee2604892e625fd9856c632067 |
| mcp.json | 224324 | c7266cdbd971d94305f4fdc8f3122b53f2fe56893c03b9b3a72398a63e2aeab8 |
| runner.out | 13706 | 3398a048543ac44e7c3012011facf8289376a335ff92e5740f087d19c298f49b |
| stdio.out | 7883 | a723aea5c83c82ce3493d54fc6d6676fca8f766ea68c9c38f49d6dffeac7f03b |
| status-16.out | 896 | 05f7b14d0826a79cf42a4adfd7873c8e69881908618f19c28c9c15824979a441 |
| status-17.out | 931 | f81f7852d3f50e6818b937ae1e6742cdd5c2f50445cd98bd0358dfe15b77d0e3 |
| status-17.err | 670 | 8e7f21187e051135fabf449773507c8e849230b1ef567185eed79d51a4105b90 |
| status-limit.mjs | 4932 | 2dded9ca6104f42bf7f5b16fd70eee54e2ab3c208e85b257ded0a7f7d0613adb |
