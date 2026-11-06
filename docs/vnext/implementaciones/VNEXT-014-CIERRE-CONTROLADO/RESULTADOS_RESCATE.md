# Resultados físicos del rescate integrado

**Implementador; A/B/C/D NO-GO.** Intervención iniciada 2026-11-05 y continuada el 06; timestamps UTC originales en el manifest. Código final paralelo `c947d5347505283befc9cc2cc8b366f05b55c576`. Serial `b319047d07e4658396f94654e7c92ce4b8ad41ea`; única diferencia posterior: quitar inicializador inútil del test de cleanup. Build/producto y suites auxiliares sobre `c9e58ce`, cuyos cambios productivos son idénticos a ambos snapshots posteriores (solo cambió el test de cleanup).

## Resultados ejecutados

| Grupo | Resultado real | Alcance / evidencia |
| --- | --- | --- |
| Build | PASS, 10 paquetes | pnpm run build; [log](evidencia/final-build.log); duración no instrumentada |
| Engine completo | 168 PASS / 0 FAIL de 168 | [log](evidencia/final-engine.log) |
| Knowledge completo | 342 PASS / 0 FAIL de 342 | [log](evidencia/final-knowledge.log) |
| Runner completo | 73 PASS / 0 FAIL de 73 | [log](evidencia/final-runner.log) |
| CLI completo | 78 PASS / 0 FAIL de 78 | [log](evidencia/final-cli.log) |
| Coverage focal | 69/69 PASS | Focal final-focal; tres regresiones originales y negativos nuevos; [log](evidencia/final-focal.log) |
| Adversarial focal | 34/34 PASS | Ocho identidades migradas, incluido 7.5; mismo log focal |
| TestHandler tras último arreglo de cleanup | 21 PASS / 0 FAIL de 21 | [log](evidencia/drain-fix-focal.log); la nueva identidad también está en las corridas completas |
| TypeScript MCP incluyendo tests | FAIL, 125 baseline → 124 finales; cero altas | Baja TS2820 certainty=unconfirmed; [diferencial](evidencia/differential.json) |
| ESLint global | FAIL, 34 errores / 28 advertencias; cero altas/bajas | Mismos 62 diagnósticos; sin cambios de reglas/config; [diferencial](evidencia/differential.json) |
| TypeScript Knowledge tests | PASS | pnpm --filter @qap/knowledge exec tsc --noEmit -p test/tsconfig.json; [log](evidencia/knowledge-tsc.log) |
| TypeScript Runner incluyendo tests | FAIL, 1 diagnóstico preexistente | TS2341 writeYaml privado en runner-safety-honesty.test.ts:316; archivo idéntico al baseline; pruebas nuevas sin diagnósticos; [log](evidencia/runner-tsc.log) |

Knowledge baseline integrado fue 341/341, final 342/342 por una regresión nueva de fence/reentrancia. Engine mínimo 168 preservado. Runner 71→73 por dos barreras de cancelación. CLI 78 preservado. No se ejecutó una nueva instalación de dependencias. No se atribuye PASS a lint/typecheck globales por el build de distribución.

## MCP completo e identidades

| Corrida | PASS | FAIL | Total | Unhandled reportados | Condición |
| --- | --- | --- | --- | --- | --- |
| [baseline-physical-mcp](evidencia/baseline-physical-mcp.json) | 439 | 59 | 498 | 0 | Serial integrado antes de cambiar código |
| [final-serial](evidencia/final-serial.json) | 447 | 55 | 502 | 0 | Serial tras corrección del hook |
| [final-parallel-a](evidencia/final-parallel-a.json) | 431 | 71 | 502 | 0 | Dos suites MCP simultáneas; cada una con paralelismo predeterminado |
| [final-parallel-b](evidencia/final-parallel-b.json) | 429 | 73 | 502 | 0 | Dos suites MCP simultáneas; cada una con paralelismo predeterminado |
| [final-solo-a](evidencia/final-solo-a.json) | 445 | 57 | 502 | 0 | Paralelismo predeterminado; una suite MCP a la vez |
| [final-solo-b](evidencia/final-solo-b.json) | 443 | 59 | 502 | 0 | Paralelismo predeterminado; una suite MCP a la vez |

Todos los comandos MCP completos devuelven exit 1 por fallos reales. TEMP/TMP separados por corrida; no se alteraron workers ni timeout de 5000 ms. Los controles solo-a/solo-b se ejecutaron consecutivamente; ESLint se solapó parcialmente con solo-a, no otra suite MCP. No se infiere causalidad universal de la diferencia de carga.

Comparación baseline→serial por archivo/fullName/ordinal: **439 PASS conservados, 4 FAIL→PASS, 55 FAIL conservados, 4 altas PASS, cero bajas y cero PASS→FAIL**. Las cuatro recuperadas son 7.5 y los tres negativos R4-R9/R4-R10. Las altas son el canary RPC, dos errores genéricos y cleanup solapado. [JSON de comparación con nombres completos](evidencia/comparison.json).

En las 63 históricas: **8 PASS y 55 FAIL**, sin renombrar/eliminar. [Matriz](MATRIZ_63_RESCATE.md). Estas 55 requieren equivalencia sustantiva; no son 55 defectos productivos demostrados.

## E01: intentos fallidos conservados y límite actual

- [before-drain-fix-serial](evidencia/before-drain-fix-serial.json), código c9e58ce: 446/55/501; sin unhandled reportados.
- [before-drain-fix-parallel-a](evidencia/before-drain-fix-parallel-a.json), código c9e58ce: 423/78/501; sin unhandled reportados.
- [before-drain-fix-parallel-b](evidencia/before-drain-fix-parallel-b.json), código c9e58ce: 428/73/501; dos unhandled ECOMPROMISED en paralelo B.

El paralelo B anterior produjo dos timeouts del hook de 10000 ms y dos heartbeat sobre raíces borradas. Eso reveló la extracción tardía de tempDirs y restauración tardía de mocks, corregidas en b319047. La nueva regresión prueba el solapamiento sin sleeps ni aumentar timeout. Las corridas finales simultáneas no reprodujeron ECOMPROMISED/unhandled, pero **sí mantienen fallos extras por carga/timeouts y algunas aserciones posteriores a timeouts**: E01 continúa pendiente. No se declara estabilidad global ni que cada fallo extra sea un nuevo defecto productivo independiente.

| Identidad E01 | Serial ms | Paralelo A ms / estado | Paralelo B ms / estado |
| --- | --- | --- | --- |
| P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) Criterio 4.3: Progresión canónica fuente_de_verdad -> objetivo -> roles -> flujos_criticos -> SCOPING | 1211.9 | 5281.0 / failed | 5472.6 / failed |
| TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) Scenario 1: executes valid and authorized plan, persisting authentic result (R4.1) | 1797.5 | 15118.8 / failed | 12442.7 / failed |
| TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) Scenario 4: in-memory snapshot prevents TOCTOU tampering of YAML files after verification (R4.4) | 883.6 | 11964.0 / failed | 14132.0 / failed |

Las duraciones JSON son del test completo, no del componente Chromium/SQLite/FS. La localización del tramo lento no se ha demostrado; se necesita instrumentación focal por etapa antes de modificar latencia. Los JSON Vitest pueden mostrar STACK_TRACE_ERROR para un timeout: se publican también los logs completos con el mensaje de test/hook.

Bloqueos concretos en los controles con una suite MCP a la vez:

| Archivo + fullName | Control A | Control B |
| --- | --- | --- |
| src/__tests__/p4-2-pregunta-contract.test.ts P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) Criterio 4.3: Progresión canónica fuente_de_verdad -> objetivo -> roles -> flujos_criticos -> SCOPING | failed / 5099.8 ms | failed / 5476.5 ms |
| src/__tests__/test-handler.test.ts TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) Scenario 4: in-memory snapshot prevents TOCTOU tampering of YAML files after verification (R4.4) | failed / 13487.1 ms | failed / 5354.4 ms |
| src/__tests__/test-handler.test.ts TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) Scenario 1: executes valid and authorized plan, persisting authentic result (R4.1) | passed / 4273.0 ms | failed / 9842.3 ms |
| src/__tests__/test-handler.test.ts TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) Scenario 5: blocks unauthorized URLs, unconfigured host policy, and redirects (R4.5) | passed / 2939.2 ms | failed / 9338.7 ms |

No se excluyeron estos fallos ni se sustituyeron las pruebas por rechazos triviales.

## SQLite e integridad

El canary cierra/reabre ambas conexiones y exige snapshot de autoridad idéntico, cero relations y lifecycle sin avance. R2 preserva las tres expectativas originales, verifica el mismo Error para UNAVAILABLE/write_failed y revisión intacta; la nueva Knowledge física reabre y valida PRAGMA. 7.5 conserva un recibo adversario y una aprobación legítima previa en el otro store; retry después de reopen rechaza procedencia y no duplica autoridad/recibos. PRAGMA integrity_check=ok y foreign_key_check=[] en ambas bases. El PASS de las pruebas incluye estas aserciones, no un rollback ACID transversal.

## SHAs y comandos

| Cambio | SHA |
| --- | --- |
| Merge normal 014→vNext | 6ce7472bc1cef8d252434a3d71a0a614ed06a390 |
| P1 frontera MCP | 2d38212658a3acd8e245c1be42a27d7bc1ccf750 |
| Tipado/reentrancia + códigos públicos seguros | 4afaeb5668ac6598536383f325030c263684a78b |
| Fixture 7.5 y reapertura | a02b0986f8c638a324df8b63b53156001d5b727f |
| Cancelación/drain | c9e58ceaa145965db96dbc1951a2ca36ecfbb7e5 |
| Propiedad de cleanup al vencer hook | b319047d07e4658396f94654e7c92ce4b8ad41ea |
| Declaración del nuevo test sin inicializador inútil | c947d5347505283befc9cc2cc8b366f05b55c576 |

[Manifest](evidencia/manifest.json) contiene argumentos exactos, timestamps, exit y duración de las corridas instrumentadas. Cada JSON por identidad registra SHA, ordinal, duración, primer error y SHA256 del JSON bruto/log local. Los JSON publicados están normalizados; los brutos permanecen en `C:/Users/Judirico/Documents/QAMCP/rescate-evidence/20261105-integracion`. Logs completos seleccionados publicados normalizando LF, espacios finales y fin de archivo; los JSON registran log_sha256 del bruto local y published_log_sha256 de la versión publicada. No bases SQLite, claves, sesiones ni archivo personal. Scripts de reproducción en evidencia usan rutas locales explícitas que deben ajustarse al checkout del auditor.

Incidentes del arnés: se descartó el baseline ambiental dentro del sandbox (EPERM); la primera comparación virtual TypeScript incluía el archivo nuevo como raíz inexistente del baseline y añadió artificialmente TS6053. Se corrigió el filtro y se contrastó contra tsc CLI real: 125→124, cero altas. Ninguno se declara defecto productivo ni PASS ficticio.

## Dictamen

**A/B/C/D permanecen NO-GO.** Lote R1/R2/R3 reparado y probado por el implementador; cleanup R4 reforzado y sin unhandled en las corridas finales, pero la latencia E01 bajo carga no está resuelta. Faltan 55 garantías con escenarios equivalentes/decisiones de compatibilidad, aceptación humana auténtica, revisión independiente y tratamiento formal de la deuda. No se hizo merge a develop/main/staging ni npm. Los commits/documentos posteriores a los snapshots de código se distinguen de los SHAs físicos.
