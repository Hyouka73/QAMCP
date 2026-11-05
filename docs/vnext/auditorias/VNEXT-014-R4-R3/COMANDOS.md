# Comandos y trazabilidad de R4-R3

La ejecución física se realizó el 2026-11-04 en Windows x64 (hora de Ciudad de México) sobre `7e0142a97c67fa1c65c46a83e2a5f003b0b435cd`. Node 24.15.0, SQLite 3.51.3 con creación y consulta de una tabla FTS5, pnpm 11.3.0 con lockfile congelado, TypeScript 5.5.4, Vitest 4.1.11, Playwright 1.63.0 y Chromium 153.0.8010.12. Los comandos que usan `<WORKTREE>` y `<ARTEFACTOS>` requieren rutas absolutas al worktree aislado y a un directorio de artefactos fuera del repositorio.

## Comandos ejecutados y códigos

```text
git-status	0	git status --short
git-branch	0	git branch --show-current
git-head	0	git rev-parse HEAD
git-remote	0	git remote -v
git-remote-head	0	git rev-parse refs/remotes/origin/feat/qap-vnext-architecture
git-diff	0	git diff 4ed8511f2ee88e63ff2da21a5a6f45dd6786f7f9 HEAD --stat
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
coverage	0	pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-coverage.test.ts --maxWorkers=1 --reporter=verbose
discovery	1	pnpm --filter @qap/mcp exec vitest run src/__tests__/discovery-handler.test.ts --maxWorkers=1 --reporter=verbose
lint-focus	1	pnpm --filter @qap/mcp exec eslint src/handlers/canonical-closure-service.ts src/__tests__/canonical-coverage.test.ts src/server.ts
mcp	1	pnpm --filter @qap/mcp exec vitest run --maxWorkers=1 --reporter=verbose --reporter=json '--outputFile.json=<ARTEFACTOS>/mcp.json'
runner	0	pnpm --filter @qap/playwright-runner exec vitest run --maxWorkers=1 --reporter=verbose
lint-global	1	pnpm lint
stdio	0	node '<ARTEFACTOS>/stdio.mjs' <WORKTREE> '<ARTEFACTOS>/stdio-fixture'
git-final	0	git status --short
```

Reintentos: Discovery salió 0. MCP integral salió 1 por los 55 fallos de aserción. Los siete procesos de la sonda externa terminaron con salida 0.

## Inventario de originales locales

Los SHA-256 corresponden a los originales. Los extractos publicados omiten rutas privadas y material de los fixtures. Los JSON de Vitest permiten comparar por ruta relativa y título completo.

| Archivo | Bytes | SHA-256 |
| --- | ---: | --- |
| runs.tsv | 2046 | 83c8b3d31ad27cc50e450714fb110becb9cfce53ad32ce899f1b8189cc8f5e4b |
| build.out | 8128 | 948ca8c76c0ed66dce1cf6651bd2a56211d7a379b3ecc737af48b18423da859c |
| r4-r3.out | 8490 | 7e90e3943774119dd1ba8018cf0cfd982fccc9922013cca98191e371782936f4 |
| coverage.out | 8610 | fcd5fcc3e59ba4e475d58d76d91f9053aec8302c53635acf6f0a4d1962aea59f |
| discovery.err | 816 | bc3e553302300213ef7ab757fc6e7cd67a26adf68442f8a8d56491f19fa8b7d4 |
| discovery-retry.out | 9877 | 2da19f456250ee511e375e7958b9bbee2399803e5d5f07bd40726c8eb1cee1a0 |
| lint-focus.out | 504 | e1dc89d1cd4520d39d3097c2c31c79986606330dafecdb18c8a315502c2d9eb3 |
| lint-global.out | 11184 | c795ba6e11686ba1205671590618070fabc1c67d1359d500633792b66fd8a468 |
| mcp.out | 88279 | e05e8b25f5734d418acb5b2699051a29db19c470feaa05f082713b55e57c6f04 |
| mcp.err | 48174 | bc36154bb576b0bf092dfcf7560e6e26ea7c6f4e94eb2e1fcdec53bdfbc245c5 |
| mcp.json | 221085 | 5de4173a7a8a92e6e4449f5a9f6c65e436dad460973660748a888a83bbe8244c |
| mcp-retry.out | 97830 | 57d0f7f354f45d1908af4f8fddbe27df13fa3ec371f9c15b3c64a1dd6a112dfb |
| mcp-retry.json | 222639 | 258a6550d640a95e0a3f61b470812bf46a7bbcef11d9b441e2f8f7b21ba074e0 |
| runner.out | 13712 | 0d0d6f1143fda993596da4930f67cfc9dfb71090328d96ceafdfec92a0111a1a |
| stdio.out | 7883 | ba568007cef1351d084202532982a641123a93d5cb4fcb75ff7b4d8ceb112a02 |
| status-terminal.out | 5678 | c942306eb6c32c91c46db64c17368b7d9d7c75d58d61442f76b3e1bde836c838 |
| status-probe.mjs | 5483 | db6ddfac63c521dc5a7a661ea8d75bc3b74260f5dab032fca890f14d3a8a6bd0 |
| stdio.mjs | 1698 | 1e6d1a58e300c947193708a405d2dae48c16893bcfc495c1543a6fa5190b2048 |
