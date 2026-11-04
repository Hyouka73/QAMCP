# VNEXT-014-D-R2 — Auditoría independiente, discrepancias y reconciliación inicial

**Fecha:** 2026-11-04  
**Rama:** `feat/qap-vnext-architecture`  
**SHA auditado físicamente por el evaluador externo:** `0016c22b012877817bde6fe153fea2e39dbfb187`  
**Dictamen de cierre:** **NO-GO para VNEXT-014; VNEXT-015 no iniciado.**  
**Estado de las correcciones R2:** publicadas en la rama, **SIN reejecución/certificación sobre el nuevo HEAD**.

## 1. Procedencia e integridad del informe

Se recibió un informe de auditoría independiente ejecutado el 2026-11-04 en un checkout Windows de la rama indicado arriba. Este documento registra los resultados **declarados y respaldados por ese informe**, no resultados ejecutados por el revisor que publica la reconciliación.

El checkout auditor no estaba en la ruta histórica `D:\Proyectos X\QAMCP`; el evaluador usó la copia local existente, validó el fast-forward al SHA exacto, conservó sin abrir ni modificar deliberadamente una sesión local preexistente y no realizó cambios versionados. Los artefactos y logs detallados permanecen en el equipo auditor; **no fueron incorporados a GitHub ni revisados íntegramente por esta sesión remota**. Su existencia se reportó, pero no se finge custodia, firma o trazabilidad criptográfica.

La auditoría empleó Node 24.15.0, pnpm 12.3.4, TypeScript 5.5.4, Vitest 4.1.11 y Playwright 1.62.1 para runner/MCP. SQLite `fts5` funcionó en memoria. No se probó producción, otros sistemas operativos ni navegadores headed.

## 2. Matriz del SHA auditado (no corresponde al nuevo HEAD)

| Compuerta | Resultado independiente observado | Dictamen |
| --- | --- | --- |
| Monorepo `pnpm build` | 10 paquetes | PASS |
| Nuevas regresiones D/D-R1 | 21/21 | PASS |
| TestHandler + ReportHandler focales | 32/32 | PASS |
| Runner completo | 70 PASS, 1 FAIL (71) | FAIL |
| MCP completo serial `--maxWorkers=1` | 372 PASS, 74 FAIL (446) | FAIL |
| Lifecycle V3 | 2 PASS, 5 FAIL (7) | FAIL |
| Stdio aislado | 18 herramientas, `qap_status` y `qap_init` | PASS acotado |
| Chromium físico | Headless Chromium 151.0.7922.34, navegación/DOM/captura sintética | PASS de humo |
| ESLint global | 46 errores, 29 warnings | FAIL |
| ESLint focal de D/R1 | 0 errores, 1 warning en `report.handler.ts` | PASS con advertencia |

El runner y MCP contienen tests de fixture, doble y físicos: sus sumas no equivalen a certificación de negocio. El PASS de Chromium físico fue limitado a una página sintética. La selección MCP paralela tuvo 365 PASS / 81 FAIL y dos errores no capturados; la repetición serial, sin timeouts reportados, redujo los fallos a 74. No se suman ejecuciones repetidas como tests independientes.

## 3. Problemas de alcance acotado y decisiones R2

### R2-01 — Catálogo MCP: extensión aditiva `qap_report.module`

**Reproducción en SHA auditado:** `packages/mcp/src/__tests__/dispatcher-integration.test.ts`, comparación con `fixtures/mcp-catalog-vnext010.json`. La ampliación opcional `module` fue introducida explícitamente en VNEXT-014-D, conservando 18 herramientas.  
**Decisión:** conservar la ampliación, el snapshot histórico inmutable y su comparación de las demás propiedades. El test comprueba explícitamente `module: string` opcional, y lo excluye **solo** de la comparación contra el snapshot vNext-010; no modifica el catálogo para ocultar el cambio.  
**Cambio publicado:** `packages/mcp/src/__tests__/dispatcher-integration.test.ts`. **Verificación real posterior pendiente.**

### R2-02 — Cancelación previa a iniciar Playwright

**Reproducción en SHA auditado:** `packages/playwright-runner/test/adversarial-stress.test.ts`, C6.3 esperaba `failed` y `not_run = 0`; el runner endurecido devuelve `error` y conserva el inventario.  
**Decisión:** mantener `result: error`, dos casos `not_run`, cero aprobaciones y cero fallos de aserciones ficticias. La prueba C6.3 ahora verifica conteos exactos, IDs y que Chromium no se lanzó. No se revierten las garantías D-011 para conseguir un test verde.  
**Cambio publicado:** `packages/playwright-runner/test/adversarial-stress.test.ts`. **Verificación real posterior pendiente.**

### R2-03 — Warning focal de `ReportHandler`

**Hallazgo:** `import/order` detectó un warning en `report.handler.ts`.  
**Cambio:** separación explícita de los grupos de imports `parent` y `sibling`, sin modificar comportamiento. **ESLint posterior pendiente.**

## 4. Riesgos que permanecen abiertos: no confundir baseline con regresiones

El inventario de `VNEXT-013_R1_INTEGRATION_STABILIZATION.md` listó 60 casos R01–R60; más adelante se reportaron 58 pendientes, y otros informes R5 mencionan 55 del catálogo original aún no resueltos. Estas cifras pertenecen a distintas fechas, selecciones y cortes; **no se puede concluir matemáticamente que 74 - 58 = 16 regresiones de esta entrega**. Debe compararse por **archivo + título + condición de fallo**.

La auditoría actual reportó estos fallos en MCP serial:

| Suite | Fallos en SHA auditado | Antecedente |
| --- | ---: | --- |
| `p4-4-auth-lifecycle.test.ts` | 7 | Incluida en el inventario VNEXT-013 |
| `p3-verification.test.ts` | 5 | Incluida en el inventario VNEXT-013 |
| `server.test.ts` | 10 | Incluida en el inventario VNEXT-013 |
| `p4-2-pregunta-contract.test.ts` | 2 | Incluida en el inventario VNEXT-013 |
| `lifecycle-v3-e2e.test.ts` | 5 | R01–R05 ya constaban en VNEXT-013 |
| `p4-5a2-integrity.test.ts` | 18 | Incluida en el inventario VNEXT-013; requiere conciliación por título |
| `p4-5a-integrity.test.ts` | 12 | Incluida en el inventario VNEXT-013; requiere conciliación por título |
| `p4-5s1-browser-candidates.test.ts` | 7 | No basta el listado R01–R60 para atribuir origen |
| `p4-3-investigate-before-ask.test.ts` | 6 | No basta el listado R01–R60 para atribuir origen |
| `e0-investigation.test.ts` | 1 | No basta el listado R01–R60 para atribuir origen |
| `dispatcher-integration.test.ts` | 1 | R2-01 corregido en el test, pendiente de reejecución |
| **Total** | **74** | **NO-GO** |

**Lifecycle:** E0a, E1, E2, E3 y Criterio 9 coinciden nominalmente con R01–R05 documentados tras la sustitución del discovery legado por el contrato canónico. No restaurar automáticamente `rules.yaml`, entrevistas sintéticas, `status: success` o saltos de prerrequisitos para satisfacer un consumidor obsoleto. Determinar cuál es el contrato objetivo y proporcionar el puente canónico real o reclasificar explícitamente un test histórico; nunca debilitar seguridad/consentimiento.

## 5. Backlog de estabilización VNEXT-014 (todos los pendientes sin certificar)

| ID | Prioridad | Tarea y salida esperada | Estado |
| --- | --- | --- | --- |
| `014-R2-01` | P0 | Reejecutar `dispatcher-integration.test.ts`; confirmar catálogo y 18 tools con extensión autorizada | Código publicado; verificar |
| `014-R2-02` | P0 | Reejecutar C6.3 y runner completo; confirmar `error/not_run`, cero browser launch y 71/71 si no hay nuevos hallazgos | Test corregido; verificar |
| `014-R2-03` | P0 | Conciliar por archivo+título+SHA los 74 fallos MCP serial con R01–R60 y el baseline anterior; registrar nuevos, persistentes y resueltos sin inferencias por totales | Pendiente |
| `014-R2-04` | P0 | Reconectar DiscoveryHandler al consumidor lifecycle canónico con prerrequisitos reales, o documentar contrato obsoleto por caso. Comenzar por E0a/E1/E2/E3/C9 | Pendiente; 5/7 fallan |
| `014-R2-05` | P1 | Diagnosticar los 46 errores/29 warnings de lint global por archivo y primera aparición, sin `--fix` masivo ni supresiones ad hoc | Pendiente |
| `014-R2-06` | P1 | Analizar paralelismo/locks/temporales; separar los 7 fallos adicionales observados en la suite paralela de los 74 seriales | Pendiente |
| `014-R2-07` | P0 | Certificar final: `pnpm build`, Vitest runner/MCP completo serial, regresiones, lint afectado y Stdio sobre nuevo SHA, registrar evidencias y resultado GO/NO-GO | Pendiente |

**No iniciar VNEXT-015 con las compuertas en rojo.** `main`, `develop`, el esquema SQLite v2 y la sesión protegida están fuera de alcance. No escribir credenciales reales en fixtures ni documentación.

## 6. Orden de revalidación recomendado

Sobre una copia limpia de la rama, **sin descartar el archivo local modificado**:

```powershell
git status --short
git branch --show-current
git fetch origin feat/qap-vnext-architecture
# Aplicar fast-forward solo si la rama y los cambios locales lo permiten.
pnpm build
pnpm --filter @qap/mcp test -- src/__tests__/dispatcher-integration.test.ts src/__tests__/test-handler.test.ts src/__tests__/report-handler.test.ts
pnpm --filter @qap/playwright-runner test -- test/adversarial-stress.test.ts test/runner-safety-honesty.test.ts --maxWorkers=1
pnpm --filter @qap/playwright-runner test
pnpm --filter @qap/mcp test -- --maxWorkers=1
pnpm --filter @qap/mcp exec eslint src/handlers/report.handler.ts src/__tests__/dispatcher-integration.test.ts
pnpm lint
```

El evaluador debe adjuntar SHA, salidas y títulos exactos de fallos. Un `pnpm build` PASS en el SHA anterior no certifica los commits R2. No publicar métricas nuevas sin ejecución; no convertir expectativas reconciliadas en una declaración GO anticipada.
