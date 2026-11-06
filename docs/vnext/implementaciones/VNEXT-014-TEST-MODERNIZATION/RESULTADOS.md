# Resultados del Lote 1 — 2026-11-06

**Entrega parcial de la modernización completa; VNEXT-014 NO-GO.** Se completa lifecycle en serie; lotes 2–7 y E01 permanecen abiertos.

Base remota/local verificada antes de editar: `794dc0d2fe1fb85dd1f9fb0c211b9b35346ac747`. Implementación publicada directamente en vNext: [`9a7ce20b4bd3a07518351397a1eab40ce84f2e84`](https://github.com/Hyouka73/QAMCP/commit/9a7ce20b4bd3a07518351397a1eab40ce84f2e84). Las corridas focal/serial se hicieron con el contenido de esos dos archivos antes de crear el commit; build/suites auxiliares verifican el mismo contenido. No hubo cambios productivos. Las hashes de evidencia se publican por separado.

| Comprobación física | Resultado | Evidencia |
| --- | --- | --- |
| Baseline MCP serial real | 447 PASS / 55 FAIL / 502 | [JSON](evidencia/baseline-serial.json), [log](evidencia/baseline-serial.log) |
| Lote lifecycle final focal | 10 PASS / 0 FAIL | [JSON](evidencia/lote1-cached-validator.json), [log](evidencia/lote1-cached-validator.log) |
| MCP completo serial final | 455 PASS / 50 FAIL / 505 | [JSON](evidencia/final-serial.json), [log](evidencia/final-serial.log) |
| MCP completo paralelo predeterminado, una suite | 442 PASS / 63 FAIL / 505 | [JSON](evidencia/final-parallel.json), [log](evidencia/final-parallel.log) |
| Dos suites simultáneas, A | 425 PASS / 80 FAIL / 505 | [JSON](evidencia/simultaneous-a.json), [log](evidencia/simultaneous-a.log) |
| Dos suites simultáneas, B | 433 PASS / 72 FAIL / 505 | [JSON](evidencia/simultaneous-b.json), [log](evidencia/simultaneous-b.log) |
| Build completo | 10 paquetes PASS, exit 0 | [log](evidencia/final-build.log), [manifest](evidencia/verification-manifest.json) |
| Engine completo | 168 PASS | [log](evidencia/final-engine.log) |
| Knowledge completo | 342 PASS | [log](evidencia/final-knowledge.log) |
| Runner completo | 73 PASS | [log](evidencia/final-runner.log) |
| CLI completo con filtro real | 78 PASS | [log](evidencia/final-cli-verified.log), [manifest](evidencia/cli-manifest.json) |
| TypeScript MCP incluyendo tests | 124 → 121 diagnósticos, cero altas; global FAIL | [diferencial](evidencia/differential.json), [CLI](evidencia/final-tsc.log) |
| ESLint global | 34 errores / 28→25 advertencias; cero altas; global FAIL | [diferencial](evidencia/differential.json), [JSON](evidencia/final-eslint.json) |

Comparación por archivo/fullName/ordinal: **447 PASS conservados, cinco FAIL→PASS, 50 FAIL conservados, tres altas PASS, cero bajas y cero PASS→FAIL**. [Comparación ejecutable](evidencia/comparison.json). Los siete fullNames lifecycle existentes se preservan; cinco de los 55 históricos pasan con contrato modernizado, dos PASS históricos siguen pasando, tres negativos son nuevos. No se eliminó ni consolidó ninguna identidad. Las otras 50 siguen activas y fallan: no declarar MCP verde.

## Garantías y límites

La sustitución preserva preguntas/continuidad, revisión humana independiente del wire, no promoción del DOM, cobertura física, motivos/categorías, precondiciones, idempotencia sin duplicación de autoridad, cierre A/waiver B, reporte veraz, WRAP_UP y nueva sesión con historial conservado. Se leen las tres bases mediante PRAGMA; drafts y closure sobreviven reapertura y Knowledge se consulta además desde una conexión independiente. La matriz y el acta de contratos identifican representaciones retiradas en cada cuerpo. No se acredita consentimiento humano auténtico con estos inboxes sintéticos ni cobertura de ejecución con un reporte de sesión.

## Intentos y problemas del arnés

- Sandbox: primer intento MCP carga cero tests por EPERM de rename en caché de Vite. [JSON ambiental](evidencia/baseline-sandbox-error.json). Se conserva y se repite fuera del sandbox; no cuenta como baseline funcional.
- Los focales previos contienen errores del fixture/oráculo corregidos, no defectos productivos: array de dos bindings, conteo de consultas al gateway, `valid` del validador y doble init con origen discordante. Sus JSON/logs se mantienen.
- Un focal con typecheck/lint simultáneos excedió 5000 ms en Criterio 9. El arnés recompilaba todos los schemas tras cada llamada: experimento aislado de 30 validaciones = 928.88 ms con instancias nuevas frente a 0.05 ms con instancia reutilizada. Se reutiliza el validador por fixture manteniendo todas las verificaciones. [Medición](evidencia/schema-validation-benchmark.json). La corrida focal final aislada pasó 10/10, Criterio 9 ≈2964 ms. Esto no demuestra la causa completa de E01 ni universaliza el efecto de carga.
- El primer filtro CLI usó `@qap/cli`, seleccionó cero paquetes y devolvió exit 0. **No es PASS de tests.** Se conserva ese [log vacío de suite](evidencia/final-cli.log) y su entrada de manifest; se corrigió al nombre real `@hyouka73/qap-cli` con `--fail-if-no-match` y se ejecutaron físicamente las 78 pruebas. El script reproducible incorpora la comprobación del filtro.

## Paralelismo / E01

Una suite completa con paralelismo predeterminado: **442 PASS / 63 FAIL / 505**. Frente a la serie hay 13 fallos adicionales por timeout; seis pertenecen a lifecycle (E0a/E0b/E1/E2/E3/Criterio9). No se presenta el PASS serial del Lote 1 como certificación paralela. Los nombres completos, tiempos y primeros errores se publican en [parallel-comparison.json](evidencia/parallel-comparison.json); el JSON de Vitest representa algunos timeouts como STACK_TRACE_ERROR y el log conserva el mensaje `Test timed out in 5000ms`.

No se modificaron workers, exclusiones, configuración Vitest ni timeouts. La instrumentación completa por Chromium/contexto/runner/locks/SQLite/crawler/hooks queda pendiente de E01. La comparación de duración total no localiza el tramo lento ni demuestra 13 defectos productivos independientes. Las dos ejecuciones simultáneas no se solapan con la corrida paralela individual ni con build/typecheck/lint.

Las simultáneas A/B dan **425/80** y **433/72**, ambas de 505. Son 30 y 22 fallos adicionales frente a serie; lifecycle pasa 3/10 en cada una. Ambas registran `Hook timed out in 10000ms` en `test-handler.test.ts:184`, `afterEach(drainTestFixtures)` (escenarios 1/4 en A y 1/4/5 en B). El extractor no encontró líneas Unhandled Rejection, Unhandled Error ni ECOMPROMISED. Eso no convierte el hook vencido en PASS ni certifica drenaje bajo carga. Se conservan todos los errores y se distingue timeout de test de timeout de hook. No se atribuye automáticamente cada aserción posterior a un defecto productivo nuevo.

El primer comando paralelo no ejecutó Vitest porque pnpm interpretó `--reporter=json` como opción propia. Se conserva [parallel-launch-error.log](evidencia/parallel-launch-error.log) y se repite mediante `pnpm --filter @qap/mcp exec vitest run` con reporters; no cuenta como corrida de tests.

## Reproducción

Desde la raíz del repositorio:

```powershell
pnpm --filter @qap/mcp test src/__tests__/lifecycle-v3-e2e.test.ts
pnpm --filter @qap/mcp test --no-file-parallelism
pnpm --filter @qap/mcp test
& docs/vnext/implementaciones/VNEXT-014-TEST-MODERNIZATION/evidencia/verify.ps1
node docs/vnext/implementaciones/VNEXT-014-TEST-MODERNIZATION/evidencia/report.mjs
node docs/vnext/implementaciones/VNEXT-014-TEST-MODERNIZATION/evidencia/differential.mjs
```

Las corridas completas MCP devuelven exit 1 por los fallos activos; los JSON conservan cada identidad. TypeScript y lint no son PASS globales aunque el diferencial no tenga altas. El archivo personal modificado previamente permanece fuera de commits; su hash se comprobó sin cambios durante esta intervención. No se crearon ramas ni merges, y no se alteraron funciones VNEXT-015 ni informes históricos.

## Disposición de cambios y trazabilidad

- Tests eliminados/consolidados: **0**. No hay bajas por archivo/fullName/ordinal.
- Cuerpos de tests sustituidos por equivalentes actuales: **7**, conservando las siete identidades lifecycle (cinco antes FAIL, dos antes PASS).
- Tests nuevos: **3** negativos ejecutables, todos PASS serial; su comportamiento bajo carga también se conserva en los JSON.
- Fixture modernizado: **1 composición** por puertos oficiales y stores físicos; reutilización de schemas sin retirar checks.
- Defectos productivos corregidos: **0**. No se amplió autenticación ni se cambió una compuerta o fence.
- Matriz histórica: **55 identidades enlazadas**, cinco contrastadas en este lote y 50 pendientes de auditoría focal/decisión. No se marca como clasificación definitiva una familia aún no intervenida.
- Tests deshabilitados nuevos: **0**. Serial y las tres corridas paralelas tienen pending/todo=0. El guardia preexistente `it.skipIf(process.platform !== 'win32')` de coverage no se altera y está activo en este Windows.
- Fallos del arnés/entorno: EPERM de sandbox, filtro CLI sin coincidencias, parseo de reporter por pnpm e intentos focales previos documentados. E01 por carga sigue sin causa completa demostrada.
- Garantías no certificadas: los 50 históricos restantes, estabilidad paralela (incluido lifecycle), drenaje E01 bajo carga, revisión humana auténtica y compuertas oficiales.

Los logs originales contienen CRLF y Git aplica su filtro al publicarlos. [evidence-index.json](evidencia/evidence-index.json) distingue SHA256 del archivo bruto local y SHA256 de los bytes realmente staged/publicados. Los hashes de verification-manifest son de logs brutos. Las fuentes de scripts y los intentos fallidos permanecen disponibles para reproducir la comparación.

## Actualización aditiva posterior — P3/P4.2 (sin mediciones nuevas)

A partir de HEAD `6062dcb2939135a772f20852bc8a7c978de73ca5`, se publicaron implementaciones P3 `df781fdb2bf8b54c279b3faac2dfd6edec785970` y P4.2 `95b33146b0228578ff48291fce646c2dc947c9c9`. Se trasladaron siete fullNames históricos a suites sin mocks. No se ejecutaron focales, MCP integral, TypeScript, ESLint ni navegador sobre esos SHAs. Todas las cifras anteriores corresponden a las ejecuciones históricas expresamente descritas; **no son resultados de estos commits**. Mantener NO-GO hasta pruebas físicas, contraste por identidad y certificación independiente. No se modificó E01 ni se ajustaron límites de tiempo.

## Anexo P4.5-A y P4.5-A2 — sin ejecución física

Commits `3d30973715fa8b9092ab55395f4e37685de6fb7b` (9 pruebas) y `a721a88f45294c61c8c8ddeef577a36bdfcfd8cd` (13 pruebas). No hay JSON ni métricas de tests correspondientes a estos SHAs. Un escenario de extracción vacía o de texto de opción no acredita cobertura de ejecución ni revisión auténtica. La fuente histórica 456 PASS/50 FAIL/506 está fijada en el commit anterior 6062dcb; no se extrapola. Trece pruebas antiguas de P4.5-A2 se conservaron; tres de ellas mantienen fallos de autenticación legacy por analizar.
