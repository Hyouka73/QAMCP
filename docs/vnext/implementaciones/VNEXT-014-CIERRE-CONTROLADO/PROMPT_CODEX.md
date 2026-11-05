# Codex — Certificación física independiente de VNEXT-014 en rama aislada

Eres **auditor independiente**, no implementador. Trabaja sobre `Hyouka73/QAMCP`, rama `fix/vnext-014-cierre-controlado`. Consulta el HEAD remoto actual al comenzar; congela SHA de pruebas en el reporte. La rama base es `feat/qap-vnext-architecture`, pero **no vuelvas a esa rama para aplicar correcciones**. No modifiques producción, tests, políticas, `develop`, `main`, `staging` ni VNEXT-015; no hagas merge, force-push, publicación npm o manipulación de datos personales. Una excepción permite publicar **solo** el resultado documental independiente bajo `docs/vnext/auditorias/VNEXT-014-CIERRE-CODEX/`, siempre identificando SHA físico probado. Si publicar fuese imposible, entrega logs y dictamen sin inventar publicación.

## Paso 1 — Preflight

1. Comprueba `git rev-parse HEAD`, worktree limpio, Node/pnpm/versiones/SQLite FTS5 y `pnpm install --frozen-lockfile`.
2. Revisa [ESTADO](ESTADO.md), [MATRIZ](MATRIZ_HALLAZGOS.md), [CORRECCIONES](CORRECCIONES.md), [RESULTADOS](RESULTADOS.md), `AGENTS.md` y WBS.
3. Verifica que los diffs desde `e4d7fbc2c6e4525b4e5fab38ec22e0cd365305d6` concuerdan con los tres archivos de código/test esperados y documentación. No te bases solamente en el informe del autor.

## Paso 2 — Garantía CF01

- Ejecuta `pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-coverage.test.ts --no-file-parallelism`; identifica explícitamente `VNEXT-014-CF01`.
- Debe rechazar `unexpected_closure_disk_write_failure` como error real y no devolver `blocked/closure_consistency_conflict`; sin nueva aprobación, receipt ni cierre.
- Repite casos previos de `closure_consistency_conflict`/fence, drift de lifecycle, A01/A02/C01. Un `KnowledgeStoreError.CONFLICT` reconocido debe seguir siendo bloqueo seguro; errores inesperados no.
- Si el flujo RPC transforma el error en -32603, distinguir excepción de operación interna de bloqueo falso y verificar sanitización del detalle remoto.

## Paso 3 — Ocho identidades Memory

Ejecuta la suite completa `adversarial-r5-guarantees.test.ts`; compara por `fullName` exacto de la matriz, no por contador agregado. Especialmente:

- 3.1 y 3.2: cambios de revisión/desactivación en ventana de revisión → bloqueo; cero closures, approvals y receipts; revisar lifecycle y persistencia tras reapertura.
- 3.3: primera renuncia válida, ID aprobado único y reinserción rechazada, sin segundo consumo de autoridad.
- 5.4: waiver canónico legítimo habilita `qap_session_close`, con reporte/WRAP_UP auténticos y lectura física, sin éxito falso.
- 7.2: una sola aprobación, un solo receipt, reintento idempotente.
- 7.3: dos conexiones independientes Knowledge/Closure, dos módulos, dos aprobaciones y dos recibos; sin perder CAS ni orden de locks.
- 7.4: dos solicitudes concurrentes incompatibles; ganador/segundo idempotente, una autoridad y un receipt; si falla, no rebajar expectativa.
- 7.5: receipt malicioso existente no se acepta como válido; fallo de procedencia, sin falsa autorización.
- Corre también los negativos sin `withWriteFence`: debe preservarse `closure_consistency_fence_required` sin recibo ni aprobación.
- Verifica `PRAGMA integrity_check`, esquema/migraciones y filas antes/después, WAL/SHM, reopen, conteo de receipts/aprobaciones, lifecycle.json y reportes. Solo fixtures temporales.

Si alguna expectativa cambiada del test 3.1/3.2 no describe el comportamiento real, repórtala como desacuerdo de contrato; **no edites el test para conseguir PASS**.

## Paso 4 — Matriz de 63 y E01

- Ejecuta MCP serial íntegro: `pnpm --filter @qap/mcp exec vitest run --no-file-parallelism`; exporta JSON/log y compara las 63 identidades exactas con `MATRIZ_HALLAZGOS.md`, indicando nuevas FAIL/PASS, desaparecidas y nuevas identidades.
- Ejecuta MCP paralelo **dos veces** con temporales independientes y evidencia de procesos/drenado; no dupliques archivos protegidos de QA entre workers.
- Investiga `EPERM` Windows (lectores internos/externos), rename, cleanup, timeouts e interrupciones, sin aumentar límites para esconderlos.
- Corre `pnpm run build`, `pnpm --filter @qap/engine test`, `pnpm --filter @qap/knowledge test`, `pnpm --filter @qap/playwright-runner test`, `pnpm --filter @hyouka73/qap-cli test`, lint global JSON y diferencial por archivo|regla|severidad contra la base. No supongas que los 34/28 históricos son actuales.

## Paso 5 — E2E y decisión

- Recorrido host oficial con requisitos y autorización auténtica: init → contexto y plan → Discovery consentido → módulo A → entrevista revisada y ExpectedRequirement → cobertura → A closed y B waived con gateway legítimo → recibos/reporte → WRAP_UP → nueva sesión. Identifica cuando una simulación de fixture no constituye consentimiento humano real.
- Tres compuertas independientes: A integridad del cambio (incluidos A01/A02/C01), B equivalencia de las 63 + estabilidad E01, C cierre oficial del WBS/E2E humano. Dictamen D de merge a develop **NO-GO** mientras haya una compuerta sin aprobar.
- Entrega SHA, sistema, comandos, logs/salidas, tabla exacta por identidad, causas nuevas, readback físico, diferencias de paralelismo, lint, riesgos, y GO/NO-GO con motivos.

**Codex prueba e informa; ChatGPT implementa las correcciones posteriores.** Si hay defectos, detalla archivo, ruta, reproducción y mínima corrección propuesta, sin modificar código.
