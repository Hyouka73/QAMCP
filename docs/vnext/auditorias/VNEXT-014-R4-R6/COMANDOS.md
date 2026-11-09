# Comandos y trazabilidad R4-R6

Auditoría 2026-11-05, America/Mexico_City. Código `fbc089c02b71828994a62af1a9eb6d28e33cb4bb`; remoto origin HTTPS Hyouka73/QAMCP y rama exclusiva verificados contra ls-remote antes de cambiar detached HEAD. Worktree aislado reutilizado; checkout original sin cambios, untracked .agents/teamwork preservado. AGENTS, STATE, backlog, nota R4-R6 y clasificación R4-R5 leídos. Node 24.15.0, SQLite 3.51.3 con FTS5/MATCH real, pnpm 11.3.0, TypeScript 5.5.4, Vitest 4.1.11, Playwright 1.63.0, Chromium 153.0.8010.12. Dependencias instaladas con --frozen-lockfile.

## Comandos ejecutados y salidas

Marcadores de rutas absolutas: <WORKTREE>, <ARTEFACTOS>. MCP añade reporter JSON al verbose solicitado para comparar por identidad; sigue con maxWorkers=1. Foco/integral no alteran expectativas.

~~~text
git-status	0	git status --short
git-branch	0	git branch --show-current
git-head	0	git rev-parse HEAD
git-remote	0	git remote -v
git-remote-head	0	git rev-parse refs/remotes/origin/feat/qap-vnext-architecture
git-diff	0	git diff f531e4e6b444c06ad85fd1f5f533837fd3467145 HEAD --stat
node	0	node -v
fts	0	node -e 'const {DatabaseSync}=require("node:sqlite");const db=new DatabaseSync(":memory:");db.exec("CREATE VIRTUAL TABLE probe USING fts5(body); INSERT INTO probe VALUES ('audit')"); console.log(process.version,db.prepare("SELECT sqlite_version() AS sqlite, body FROM probe WHERE probe MATCH 'audit'").get());'
pnpm	0	pnpm -v
install	0	pnpm install --frozen-lockfile
typescript	0	pnpm exec tsc --version
vitest	0	pnpm --filter @qap/mcp exec vitest --version
playwright	0	pnpm exec playwright-core --version
build	0	pnpm build
chromium-probe	0	node --input-type=module -e 'import {chromium} from 'playwright-core'; const b=await chromium.launch(); console.log(b.version()); await b.close();'
r4-r6	0	pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-interview.test.ts -t R4-R6-I01 --maxWorkers=1 --reporter=verbose
interview	0	pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-interview.test.ts --maxWorkers=1 --reporter=verbose
coverage	0	pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-coverage.test.ts --maxWorkers=1 --reporter=verbose
discovery	1	pnpm --filter @qap/mcp exec vitest run src/__tests__/discovery-handler.test.ts --maxWorkers=1 --reporter=verbose
lint-focus	0	pnpm --filter @qap/mcp exec eslint src/handlers/status.handler.ts src/guidance.ts src/__tests__/canonical-interview.test.ts
mcp	1	pnpm --filter @qap/mcp exec vitest run --maxWorkers=1 --reporter=verbose --reporter=json '--outputFile.json=<ARTEFACTOS>/mcp.json'
runner	0	pnpm --filter @qap/playwright-runner exec vitest run --maxWorkers=1 --reporter=verbose
lint-global	1	pnpm lint
stdio	0	node '<ARTEFACTOS>/stdio.mjs' <WORKTREE> '<ARTEFACTOS>/stdio-fixture'
git-final	0	git status --short
interview-probe-portable	0	node <ARTEFACTOS>/interview-probe-portable.mjs <WORKTREE>
discovery-repeat	0	pnpm --filter @qap/mcp exec vitest run src/__tests__/discovery-handler.test.ts --maxWorkers=1 --reporter=verbose
~~~

Preflight adicional: git ls-remote origin refs/heads/feat/qap-vnext-architecture; git fetch origin feat/qap-vnext-architecture; git switch --detach fbc089c02b71828994a62af1a9eb6d28e33cb4bb; git worktree list; git status --short; git diff fbc089c --exit-code -- packages pnpm-lock.yaml. Sin cambios productivos, de pruebas ni lockfile.

## Preparación de sonda adicional

El primer intento externo importó dist/handlers/canonical-interview-service.js, archivo no emitido por el bundle, y terminó ERR_MODULE_NOT_FOUND antes de ejecutar el fixture. Se conservó interview-probe-preparation.err. Se corrigió exclusivamente la importación externa para usar las exportaciones públicas de dist/index.js. La sonda corregida y su versión portable se ejecutaron con salida 0. La preparación fallida no se cuenta como un PASS de comportamiento.

La prueba autorizada usa datos sintéticos fuera de Git. No se publican bases, sesiones, claves o decisiones. admin-user.json conservó hash Git 429bbf6d57a1d798231b4204d52069b4077703de tanto en checkout original como aislado.

## Integridad de logs originales locales

Los contenidos saneados se encuentran en LOGS.md; estas huellas corresponden a los archivos originales conservados fuera del repositorio.

| Archivo | Bytes | SHA-256 |
| --- | ---: | --- |
| build.err | 21 | 79926a3584895151ca9462df763b5adb5b59ecd43d058af6134ebf5afb874f2a |
| build.exit | 3 | 13bf7b3039c63bf5a50491fa3cfd8eb4e699d1ba1436315aef9cbe5711530354 |
| build.out | 8209 | df5dbcc8d8e9bf1995454b0fd722630bd0528f7e20372f8aa3a34e38fc395349 |
| chromium-probe.err | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| chromium-probe.exit | 3 | 13bf7b3039c63bf5a50491fa3cfd8eb4e699d1ba1436315aef9cbe5711530354 |
| chromium-probe.out | 14 | 71c53e77891767ed1d27dfc763f60bec6c72c9c906d940b3421b1780d3dbd81f |
| coverage.err | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| coverage.exit | 3 | 13bf7b3039c63bf5a50491fa3cfd8eb4e699d1ba1436315aef9cbe5711530354 |
| coverage.out | 9642 | ae39613d0bdb502a387f60e4e8ad066876a92e041504358929f49973bed6bab2 |
| differential.py | 3736 | 555d39aa03aebe60b96b66aec4a8ee73be23736ec41b6c616db9eaefd7bb3f5a |
| discovery-repeat.err | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| discovery-repeat.exit | 3 | 13bf7b3039c63bf5a50491fa3cfd8eb4e699d1ba1436315aef9cbe5711530354 |
| discovery-repeat.out | 9872 | ab10cb2ad64b762973935893137660f48dc138a768acad795a590a882ddbd59b |
| discovery.err | 816 | bc3e553302300213ef7ab757fc6e7cd67a26adf68442f8a8d56491f19fa8b7d4 |
| discovery.exit | 3 | f1b2f662800122bed0ff255693df89c4487fbdcf453d3524a42d4ec20c3d9c04 |
| discovery.out | 10268 | d14e10c1d0c022529a0eb2a6a7796a1a15ad98e443e5d848a4174671be0b5252 |
| fts.err | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| fts.exit | 3 | 13bf7b3039c63bf5a50491fa3cfd8eb4e699d1ba1436315aef9cbe5711530354 |
| fts.out | 70 | a2d168a0943bde8364a7973b08383b2ed7dde79c1ec1618886366a360ccace07 |
| git-branch.err | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| git-branch.exit | 3 | 13bf7b3039c63bf5a50491fa3cfd8eb4e699d1ba1436315aef9cbe5711530354 |
| git-branch.out | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| git-diff.err | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| git-diff.exit | 3 | 13bf7b3039c63bf5a50491fa3cfd8eb4e699d1ba1436315aef9cbe5711530354 |
| git-diff.out | 928 | e94fd5f88d11c748e8026a1abc2b0830f3b3e4fa61c0add7c350edf0ccc37114 |
| git-final.err | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| git-final.exit | 3 | 13bf7b3039c63bf5a50491fa3cfd8eb4e699d1ba1436315aef9cbe5711530354 |
| git-final.out | 42 | fd0c249bb15b91b28cf1ce316480743ea3abbf2d7b2575b3fe2bc14e39ef5f00 |
| git-head.err | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| git-head.exit | 3 | 13bf7b3039c63bf5a50491fa3cfd8eb4e699d1ba1436315aef9cbe5711530354 |
| git-head.out | 41 | ae910bd81da4d5b6021c157088bdee1a03442177d3cbbb3a8c631de950fd6179 |
| git-remote-head.err | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| git-remote-head.exit | 3 | 13bf7b3039c63bf5a50491fa3cfd8eb4e699d1ba1436315aef9cbe5711530354 |
| git-remote-head.out | 41 | ae910bd81da4d5b6021c157088bdee1a03442177d3cbbb3a8c631de950fd6179 |
| git-remote.err | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| git-remote.exit | 3 | 13bf7b3039c63bf5a50491fa3cfd8eb4e699d1ba1436315aef9cbe5711530354 |
| git-remote.out | 105 | 9fd81c56b4f4cce6ac9c046fc732045cb1cd8d37faebb17ac4385be25955094c |
| git-status.err | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| git-status.exit | 3 | 13bf7b3039c63bf5a50491fa3cfd8eb4e699d1ba1436315aef9cbe5711530354 |
| git-status.out | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| install.err | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| install.exit | 3 | 13bf7b3039c63bf5a50491fa3cfd8eb4e699d1ba1436315aef9cbe5711530354 |
| install.out | 88 | 6d0b71b1f13dab72fa7b7c5b517eaeb3d4c6c249b7f2af5ae32c1f2c33bbbe7e |
| interview-probe-portable.err | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| interview-probe-portable.exit | 3 | 13bf7b3039c63bf5a50491fa3cfd8eb4e699d1ba1436315aef9cbe5711530354 |
| interview-probe-portable.mjs | 11243 | 91f9d058321764586b080aaf1c2af6bbc2ae4cf8fa4913b3abccc83399951817 |
| interview-probe-portable.out | 1809 | d5abbde9a21cea3bea1305fe1221d9385b11718f7a27e015245c6da5fe0a4dd5 |
| interview-probe-preparation.err | 1239 | d3f6e71f2f81222c7930caea27a3992874aeef6e6f2298304968945acf74ccb8 |
| interview-probe.err | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| interview-probe.exit | 3 | 13bf7b3039c63bf5a50491fa3cfd8eb4e699d1ba1436315aef9cbe5711530354 |
| interview-probe.mjs | 11506 | 16a8564572266d0efc44d653ae5add5103b18816d6ef8997a63042ccd31a2c59 |
| interview-probe.out | 1809 | b839943904b03a4bd3d5ac8325fecdfbae12cbe19443fa040fd4e82d9379c488 |
| interview-probe.ts | 11021 | 58c9fb65911b04ef31b1da43ccf391fb218910dcecc328e833c82db7bd697c93 |
| interview.err | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| interview.exit | 3 | 13bf7b3039c63bf5a50491fa3cfd8eb4e699d1ba1436315aef9cbe5711530354 |
| interview.out | 7953 | 2a35fa882598346c79dde433f1a37e0025a9c72c4fd4bdedefa1da5b310c8cf1 |
| lint-focus.err | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| lint-focus.exit | 3 | 13bf7b3039c63bf5a50491fa3cfd8eb4e699d1ba1436315aef9cbe5711530354 |
| lint-focus.out | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| lint-global.err | 12 | cc5a0b39c7052d24c24888403c48018b4fcccc9d799f81be6c9c30c9e19c85fc |
| lint-global.exit | 3 | f1b2f662800122bed0ff255693df89c4487fbdcf453d3524a42d4ec20c3d9c04 |
| lint-global.out | 11140 | aa9c70db9abe65c369d721dc494b2d510911af47e1f56b2242167ba5fbae6c50 |
| mcp.err | 46696 | 01fbf09b0202c4e8445414b79ee0c7a0c17e2acbbc9331eadcc4c22b7654d761 |
| mcp.exit | 3 | f1b2f662800122bed0ff255693df89c4487fbdcf453d3524a42d4ec20c3d9c04 |
| mcp.json | 226399 | 93d58721ee218be06341e27677f4b8dc768959a1837a9f307c3455821767acb9 |
| mcp.out | 98931 | 5a5082d2edcb3af5467cb483e00f1428490b2826d34570db6dfc96c36a3ddded |
| node.err | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| node.exit | 3 | 13bf7b3039c63bf5a50491fa3cfd8eb4e699d1ba1436315aef9cbe5711530354 |
| node.out | 10 | 0696fc75ebdd632c8c328370653d4dddc37504bf96b32317a50d7189cc1a775f |
| playwright.err | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| playwright.exit | 3 | 13bf7b3039c63bf5a50491fa3cfd8eb4e699d1ba1436315aef9cbe5711530354 |
| playwright.out | 16 | 8b10ec3c95178a97bd17d9b5e3b3f997cf6980667641685a4ebc7366b6cbd836 |
| pnpm.err | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| pnpm.exit | 3 | 13bf7b3039c63bf5a50491fa3cfd8eb4e699d1ba1436315aef9cbe5711530354 |
| pnpm.out | 8 | b6d583f1a1f3ca61eb9b87654a6712bdd4bf2b589e9b891692e06074712018b0 |
| publish.py | 12157 | e53ac056316337b94ae79995b8e391f6fd9e16f1e5173728a0b9792ebbf0fd1e |
| r4-r6.err | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| r4-r6.exit | 3 | 13bf7b3039c63bf5a50491fa3cfd8eb4e699d1ba1436315aef9cbe5711530354 |
| r4-r6.out | 7751 | 5e0323e4eff4fe163ecf4a7ccee15e32caed0bf72bfd0aec3e3a8b88b4c796a9 |
| run.ps1 | 2919 | 84ceff97b6fc03b09f97f86da9ceff0c6bfcbcf035d8d856dcb8cea865df4553 |
| runner.err | 10952 | 2accb6415afc88a9e77a15a23419ff0e7bef71b9d0746948c59667bf6d352f4b |
| runner.exit | 3 | 13bf7b3039c63bf5a50491fa3cfd8eb4e699d1ba1436315aef9cbe5711530354 |
| runner.out | 13721 | 47afe3ba227acf77790ccd0847e4ec877d3383f59f7a9a462881c2c31941e06d |
| runs-extra.tsv | 219 | db8a5459289430f1ba7d8bee27658ad5eae74724525e990e6184f6560bde980e |
| runs.tsv | 2147 | 0e200fa9c9e1d506406fbb8d5ad46a09ee07ee609cb471124d0d7e4462c97ecc |
| stdio.err | 71 | 60de2a337da7eb6dbb96c365e68895a3e2302428940882a7f2f03d3b51e94d9b |
| stdio.exit | 3 | 13bf7b3039c63bf5a50491fa3cfd8eb4e699d1ba1436315aef9cbe5711530354 |
| stdio.mjs | 1698 | 1e6d1a58e300c947193708a405d2dae48c16893bcfc495c1543a6fa5190b2048 |
| stdio.out | 7883 | 654248228634e4262580324d940ca38a00074bc9fc6a2c5feee41b22a55cd3f0 |
| typescript.err | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| typescript.exit | 3 | 13bf7b3039c63bf5a50491fa3cfd8eb4e699d1ba1436315aef9cbe5711530354 |
| typescript.out | 15 | 9fe6ba6b060cec4ab15e76a61d5f0156f445e8f679edd6fa787e1c03d5f6b101 |
| vitest.err | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| vitest.exit | 3 | 13bf7b3039c63bf5a50491fa3cfd8eb4e699d1ba1436315aef9cbe5711530354 |
| vitest.out | 39 | 0364634ea07a8ccb3a1f8bb5481b7349f3a679ea53a8bcf595c6d31c968fb91f |
