# Verificación física independiente R4 — 2026-11-06

**R4 correctiva: PASS. VNEXT-014 integral: NO-GO.** Se resuelven los tres P2 de R3 dentro del alcance solicitado. Nueve suites: **101 PASS / 1 FAIL / 0 SKIP / 0 TODO**, los mismos 102 fullNames y resultados que R3. TM-50 continúa FAIL heredado. TypeScript baja de 134 a **128 diagnósticos heredados**, con exactamente seis TS2339 eliminados y cero nuevos. ESLint focal conserva cero errores y dos warnings heredados; build oficial PASS. No se detectaron defectos nuevos en esta campaña.

## Preparación y límites

HEAD inicial local `642800b0abda022c3a9695545e1cc465acbb55b8`. Se consultó `git ls-remote origin refs/heads/feat/qap-vnext-architecture`: remoto real y **SHA probado `2dc2f5800f64e2a08fd11c88608a4f6beddcf635`**, coincidente con el esperado. Se ejecutó `git fetch origin feat/qap-vnext-architecture`, se inspeccionaron las rutas cambiadas, se verificó ancestro con `git merge-base --is-ancestor HEAD <SHA>` (exit 0) y se actualizó con `git merge --ff-only <SHA>`: exclusivamente avance rápido, sin merge commit ni integración de ramas. Cambios entrantes: tres documentos y tres archivos tests/fixture; ningún cambio productivo, dependencia, configuración o lockfile.

Se leyeron AGENTS.md, el informe físico R3 y las secciones R4 de PENDIENTES, CORRECCIONES y GO_NO_GO. La revisión semántica contrastó las tres diferencias de tests/fixture con DiscoveryHandler, ModuleObservationBridge y SqliteKnowledgeAdapter. La sesión personal protegida ya figuraba modificada al inicio y permanece como única modificación ajena al finalizar: **no se abrió, leyó, calculó hash, escribió, restauró, eliminó ni incorporó a staging/publicación**. No se realizó diff global del worktree.

Windows x64/PowerShell, Node 24.15.0, pnpm 12.3.4, Vitest 4.1.11. Dependencias existentes. Discovery físico mediante Chrome configurado por el fixture; TM-46 conserva ejecución real mediante PlaywrightRunner. No se volvió a consultar versión de los binarios de navegador. Los tests usaron dist existentes de R3; no cambiaron fuentes productivas. El build oficial posterior aprobó y se verificó existencia de `packages/mcp/dist/server.js` y `packages/cli/dist/entrypoint.js`.

Se ejecutó cada suite una sola vez, separada y secuencialmente, seguida de TypeScript, ESLint focal y build. Fuera del sandbox por el EPERM de caché Vitest ya demostrado en R2; sin fallo de infraestructura ni reintentos R4. Sin cambios de código/tests/fixtures, workers, límites, timeouts, mocks o selección de casos. No se ejecutaron MCP global, Stdio ni E01; no se implementó autenticación. No se tocaron VNEXT-015 ni ramas ajenas. MVP **20-11-2026** preservado.

## Comandos y resultados

El [runner reproducible](evidencia/r4-2026-11-06/run.ps1) y el [manifiesto](evidencia/r4-2026-11-06/manifest.json) conservan los doce comandos exactos, SHA, inicio UTC, duración y exit. Fecha local America/Mexico_City: 6 de noviembre. Para cada suite se ejecutó:

```powershell
pnpm --filter @qap/mcp exec vitest run src/__tests__/<suite>.test.ts --reporter=verbose --reporter=json --outputFile.json=<evidencia>/<suite>.json
pnpm --filter @qap/mcp exec tsc --noEmit
pnpm exec eslint packages/mcp/src/__tests__/fixtures/lifecycle-canonical.ts packages/mcp/src/__tests__/p3-canonical-discovery.test.ts packages/mcp/src/__tests__/p4-5a2-canonical-integrity.test.ts packages/mcp/src/__tests__/server-canonical-discovery.test.ts packages/mcp/src/__tests__/server-canonical-operations.test.ts packages/mcp/src/__tests__/server.test.ts --format json --output-file <evidencia>/eslint-focal.json
pnpm build
```

| Suite `.test.ts` | PASS | FAIL | SKIP/TODO | Exit | Segundos comando |
|---|---:|---:|---:|---:|---:|
| p3-canonical-discovery | 5 | 0 | 0 | 0 | 12.70 |
| p4-2-canonical-contract | 2 | 0 | 0 | 0 | 6.76 |
| p4-5a-canonical-integrity | 9 | 0 | 0 | 0 | 8.72 |
| p4-5a2-canonical-integrity | 13 | 0 | 0 | 0 | 12.91 |
| server-canonical-discovery | 4 | 0 | 0 | 0 | 6.75 |
| server-canonical-operations | 5 | 0 | 0 | 0 | 8.65 |
| server | 11 | 1 | 0 | 1 | 4.11 |
| plan-handler | 31 | 0 | 0 | 0 | 4.13 |
| test-handler | 21 | 0 | 0 | 0 | 8.92 |
| Total | **101** | **1** | **0** | — | **73.66** |

Cada suite tiene JSON y log íntegros en [evidencia R4](evidencia/r4-2026-11-06/). [Casos JSON](evidencia/r4-2026-11-06/all-cases.json), [tabla](evidencia/r4-2026-11-06/all-cases.md) y [comparación](evidencia/r4-2026-11-06/comparison.json) permiten seguir cada fullName. Comparación exacta R3→R4: cero altas/bajas, cero cambios de resultado, cero PASS→FAIL. De las 55 identidades históricas se ejecutaron 39: 38 PASS y TM-50 FAIL; otras 16 no ejecutadas, sin heredar PASS. No se afirma recertificación física de las 43 modernizadas.

**TM-50: FAIL heredado**, 131.52 ms, `AssertionError: expected true to be falsy`, server.test.ts:527:25, `expect(res.isError).toBeFalsy()`. Mismo fallo que R3, sin modificación de su cuerpo. [server.json](evidencia/r4-2026-11-06/server.json) y [log](evidencia/r4-2026-11-06/server.log) conservan error/traza y diferencia. No se certifican sus aserciones posteriores de session_saved/is_auth_view. El test no imprime el payload recibido; no se atribuye un código de bloqueo concreto observado. Sigue pendiente un positivo autenticado real.

## R4-01 — seis diagnósticos nuevos: PASS

TypeScript MCP termina **exit 1**, 5.77 s: **128 diagnósticos**, todos coincidentes con R2 por archivo/código/texto y multiplicidad. Comparación ignora únicamente desplazamientos de línea/columna y normaliza rutas. Frente a R3: cero añadidos, seis eliminados; frente a R2: cero añadidos/eliminados. [Diferencial estático](evidencia/r4-2026-11-06/static-diff.json), [log completo](evidencia/r4-2026-11-06/typecheck.log).

Eliminados exactamente los TS2339 de A2: `limitations` tres veces, `next_safe_action` una, `counts` una; y operations: `persistence` una. El fixture declara campos opcionales reales en líneas 33–44. A2 conserva las aserciones de limitations/next_safe_action, conteos y persistencia; hace narrowing con fallo explícito si falta counts antes de leer controls. Operations permanece sin cambios y conserva su aserción de persistence. No se introdujeron any, supresiones TS ni retiro de aserciones para esta corrección. A2 además aserta ausencia de extraccion_vacia en TM-42. El typecheck global del paquete sigue FAIL por deuda heredada; el PASS correctivo expresa ausencia de regresión y eliminación de los seis errores específicos.

## R4-02 — TM-44 recuperación de entrevista: PASS

Caso físico A2, **1704.24 ms**, PASS. `p4-5a2-canonical-integrity.test.ts:221` solicita next después de confirmar el primer requisito de Operación. Comprueba el módulo y que el snapshot incluye esa pregunta por ID/módulo; captura el snapshot completo. Tras `restart(true, ['Operación'])`, línea 228 exige igualdad profunda del snapshot; líneas 229–230 solicitan next otra vez y comparan la pregunta completa con la previa. Esto comprueba contenido, no solo existencia de archivos.

El restart real del fixture (`lifecycle-canonical.ts:259`) cierra cliente/servidor y stores draft/closure, reabre los stores desde sus archivos y vuelve a conectar MCP. Knowledge original permanece abierto, pero **línea 232 crea otro SqliteKnowledgeAdapter sobre la misma ruta** y consulta desde él el único requisito confirmado/developer_interview/module_key operacion, cerrándolo en finally. El constructor de SqliteKnowledgeAdapter crea una nueva instancia `node:sqlite DatabaseSync`: es una conexión independiente, no un alias ni caché del adapter previo. Las comprobaciones de integridad también pasan.

Cierra R3-03 para el reinicio de stores/servidor y lectura independiente solicitados. No simula crash del proceso ni reapertura tras cerrar todas las conexiones, ni restaura pending_questions legacy; esas capacidades no forman parte de este PASS.

## R4-03 — TM-48 Environment obsoleto: PASS

Caso físico Server Discovery, **1195.53 ms**, PASS. `server-canonical-discovery.test.ts:69` lee Environment real y exige revisión 1 (línea 73). Hace commit Knowledge con expected_revision 1, cambia name a local-policy-revised y vuelve a leer: exige revisión 2 y contenido modificado (líneas 90–91). Cambia metadata persistida de Environment; no cambia dominio o permisos de navegación, lo cual basta para probar invalidación por revisión.

Línea 95 reconecta host con consentimiento **1**, mientras SQLite contiene **2**. Fixture mantiene tanto autorización como binding fijados en el argumento explícito; no los sustituye por la revisión almacenada. Discovery debe devolver blocked/authorization_context_mismatch, persistence y association_status not_attempted. Se exige lifecycle idéntico al snapshot, cero observaciones, cero requisitos y ausencia del directorio catalog. No se usa 999 como estímulo.

La ausencia de asociación indebida está respaldada por association_status not_attempted, invariantes anteriores y revisión del handler productivo: el mismatch se retorna en discovery.handler.ts:83 **antes de construir/ejecutar crawler y antes de llamar al bridge de asociación**. No hay una consulta explícita de todas las filas relation en esta rama; se certifica el rechazo sin asociación mediante estas aserciones y el recorrido real, no una auditoría exhaustiva de toda la base.

Línea 109 reconecta con consentimiento/binding **2**; exige adquisición positiva y asociación confirmed. `f.discover()` además verifica acquisition_status completed, identidad resolved, cleanup, lifecycle intacto y ausencia de rules.yaml. ModuleObservationBridge confirma asociaciones únicamente tras commit y readback de relaciones reales. Integridad SQLite aprobada. Cierra R3-02. El consentimiento es una composición sintética del host, no una aprobación humana auténtica.

## Otras compuertas y dictamen

ESLint focal de los mismos seis archivos de R3: **exit 0**, 11.89 s, **0 errores / 2 warnings heredados**, cero altas/bajas. Ambos son eslint-disable sin uso en server.test.ts:1. [JSON](evidencia/r4-2026-11-06/eslint-focal.json). Build oficial: **exit 0**, 25.87 s, [log](evidencia/r4-2026-11-06/build.log). No se ejecutó lint global y build PASS no implica tests typecheck verdes.

**R4 correctiva PASS:** eliminados los seis diagnósticos nuevos sin retirar aserciones, recuperación draft/next y lectura independiente comprobadas, revisión Environment 1→2 con rechazo y recuperación comprobadas, ninguna regresión de resultado entre los 102 casos. Los tres P2 R3 quedan resueltos en este alcance. No se encontraron nuevos defectos de producto/tests/evidencia que bloqueen la corrección; los límites descritos no se convierten en garantías adicionales.

**VNEXT-014 integral NO-GO:** permanecen doce identidades auth pendientes (TM-13..19, TM-27, TM-30..32, TM-50); solo TM-50 se reejecutó aquí y falló. E01, compuertas globales/Stdio, revisión humana auténtica, deuda estática y demás equivalencias parciales de R3 siguen abiertas. No se midió estabilidad paralela ni causalidad E01. La última corrida global continúa siendo R1 histórica, no un resultado de R4. No se autoriza merge, release ni cierre integral.

Evidencia nueva aditiva, sin alterar R1/R2/R3 ni physical_result histórico. [analyze.mjs](evidencia/r4-2026-11-06/analyze.mjs) reproduce comparación por identidad y diferencial estático; [sanitize.mjs](evidencia/r4-2026-11-06/sanitize.mjs) sustituye rutas privadas por marcadores en JSON/logs, manteniendo diagnósticos, trazas y tiempos. Solo documentación/evidencia se incorpora a commit y push en feat/qap-vnext-architecture; SHA documental se comunica en la entrega para evitar autorreferencia.
