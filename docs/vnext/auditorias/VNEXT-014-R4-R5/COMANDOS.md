# Comandos y trazabilidad R4-R5

SHA físico f531e4e6b444c06ad85fd1f5f533837fd3467145, Windows x64, 2026-11-04 (Ciudad de México). Node 24.15.0, SQLite 3.51.3 con tabla FTS5 y consulta MATCH verificadas, pnpm 11.3.0 con pnpm install --frozen-lockfile, TypeScript 5.5.4, Vitest 4.1.11, Playwright 1.63.0 y Chromium 153.0.8010.12. Se leyó AGENTS, STATE, backlog y nota R4-R5. El remoto coincidió con el SHA solicitado. Se reutilizó el worktree aislado en detached HEAD y se verificó estado limpio antes del cambio.

Cada línea registra identificador, código de salida y comando. Sustituir <ARTEFACTOS> y <WORKTREE> por rutas absolutas.

~~~text
git-status	0	git status --short
git-branch	0	git branch --show-current
git-head	0	git rev-parse HEAD
git-remote	0	git remote -v
git-remote-head	0	git rev-parse refs/remotes/origin/feat/qap-vnext-architecture
git-diff	0	git diff 9df524501eb2365df9f204f2134bd86ebdc36717 HEAD --stat
node	0	node -v
fts	0	node -e 'const {DatabaseSync}=require("node:sqlite");const db=new DatabaseSync(":memory:");db.exec("CREATE VIRTUAL TABLE probe USING fts5(body); INSERT INTO probe VALUES ('audit')"); console.log(process.version,db.prepare("SELECT sqlite_version() AS sqlite, body FROM probe WHERE probe MATCH 'audit'").get());'
pnpm	0	pnpm -v
install	0	pnpm install --frozen-lockfile
typescript	0	pnpm exec tsc --version
vitest	0	pnpm --filter @qap/mcp exec vitest --version
playwright	0	pnpm exec playwright-core --version
build	0	pnpm build
chromium-probe	0	node --input-type=module -e 'import {chromium} from 'playwright-core'; const b=await chromium.launch(); console.log(b.version()); await b.close();'
r4-r5	0	pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-coverage.test.ts -t R4-R5-A02 --maxWorkers=1 --reporter=verbose
coverage	0	pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-coverage.test.ts --maxWorkers=1 --reporter=verbose
discovery	0	pnpm --filter @qap/mcp exec vitest run src/__tests__/discovery-handler.test.ts --maxWorkers=1 --reporter=verbose
debt-probe	0	node <ARTEFACTOS>/debt-probe.mjs <WORKTREE> <ARTEFACTOS>
debt-probe-corrected	0	node <ARTEFACTOS>/debt-probe.mjs <WORKTREE> <ARTEFACTOS>
lint-focus	0	pnpm --filter @qap/mcp exec eslint src/handlers/status.handler.ts src/__tests__/canonical-coverage.test.ts
mcp	1	pnpm --filter @qap/mcp exec vitest run --maxWorkers=1 --reporter=verbose --reporter=json '--outputFile.json=<ARTEFACTOS>/mcp.json'
runner	0	pnpm --filter @qap/playwright-runner exec vitest run --maxWorkers=1 --reporter=verbose
lint-global	1	pnpm lint
stdio	0	node '<ARTEFACTOS>/stdio.mjs' <WORKTREE> '<ARTEFACTOS>/stdio-fixture'
git-final	0	git status --short
status-16	0	node --experimental-transform-types <ARTEFACTOS>/status-boundary.mjs <WORKTREE> <ARTEFACTOS> 16
status-17	0	node --experimental-transform-types <ARTEFACTOS>/status-boundary.mjs <WORKTREE> <ARTEFACTOS> 17
status-17-invalid	0	node --experimental-transform-types <ARTEFACTOS>/status-boundary.mjs <WORKTREE> <ARTEFACTOS> 17-invalid
~~~

La primera preparación de debt-probe omitió priority y devolvió un error de plan. La sonda corregida incluyó priority=high y alcanzó WORKING. Este intento externo no cambia resultados Vitest.

## Inventario de originales locales

SHA-256 de los originales, conservados fuera del repositorio. Los JSON de ambas rondas permiten la comparación por archivo y título. Se publican resultados, fragmentos y sondas reproducibles, con rutas personales omitidas.

| Archivo | Bytes | SHA-256 |
| --- | ---: | --- |
| runs.tsv | 2496 | d1898bc36b267e8fe0408be3decd983cddb3a526ea7cda61bf8eee5b43e316f3 |
| build.out | 8214 | 528f2eaa83bb58e5a0a3aec8fcd67706840e800d9a96f19d4760e8654715cf2d |
| r4-r5.out | 9473 | 010a754ab4c4f39681808a8586500069743ed1871b45ae5e661ee394503adee3 |
| coverage.out | 9641 | 85f9440407c720e846129e626b4f73d0cbbeef2cfe7d6c16928ef5cf608ad13a |
| discovery.out | 9854 | e3f8230ecf159a279e7ac901199d1f4b0c81136fe7a773707c42e2e8f9d37dd0 |
| lint-focus.out | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| lint-global.out | 11140 | aa9c70db9abe65c369d721dc494b2d510911af47e1f56b2242167ba5fbae6c50 |
| mcp.out | 98684 | 931aa994cbc5106d119244b30cff587ae319f7205ff742f8926ce578ff11b519 |
| mcp.err | 46696 | 877a927079951acc9451fba1ce62903daec544c51c12a149214f0e2e5e54a9f4 |
| mcp.json | 226003 | 24b0343475a82730fb219fc99766b7b4bf30738d22ee74b4a62f154e8dcceb35 |
| runner.out | 13708 | 3f1439b44a6bf8bf08ed9bf05599d1c01bab148ce31b02deef374dc5b101d32c |
| stdio.out | 7883 | b325254582245e0ea9817bf0beec0b73eb0e2af0dfa6701cda80b6e751cf0395 |
| status-16.out | 896 | 05f7b14d0826a79cf42a4adfd7873c8e69881908618f19c28c9c15824979a441 |
| status-17.out | 896 | 1256f1a256dc138866f551434ec719e534f404030d00bd9b16c8eb704654b728 |
| status-17-invalid.out | 979 | 92ed583a315a0603641643d3e35af0cc2b20c15590ee4fbbfcb92f8bd2219d0b |
| status-boundary.mjs | 5599 | 725fff560f826fec261cc15c17301909e5b0e6070141e207e5c1e588b5865fff |
| debt-probe-preparation.out | 8156 | e7943626cb9e5c616e4650230d58844b76fb8836878023921f008f41a8c16082 |
| debt-probe.out | 9123 | 87bf861372c1be2f0fb1a49882580b1668f87007385d5c8f0937ed4581c04326 |
| debt-probe.mjs | 2165 | 0a5bd88836e7c4852d8f621d5564729277cfa747d93f1b46a9bac2f4fac2b34b |
