# VNEXT-014-D-R4-R5 — Guidance de cierre sin corte en el módulo 16

**Fecha de registro:** 2026-11-04  
**Rama única de trabajo:** `feat/qap-vnext-architecture`  
**Base de código auditada físicamente:** `9df524501eb2365df9f204f2134bd86ebdc36717` (R4-R4)  
**Commit documental Codex:** `12fbca16e9a5265b20ed12c14f7f0a8d8602a514`  
**Estado R4-R5:** cambios publicados en GitHub, **aún no probados físicamente**. VNEXT-014 **NO-GO**, VNEXT-015 no iniciado.

## 1. Auditoría independiente R4-R4

La fuente primaria se encuentra en [INFORME R4-R4](auditorias/VNEXT-014-R4-R4/INFORME.md) y [EVIDENCIA_STATUS](auditorias/VNEXT-014-R4-R4/EVIDENCIA_STATUS.md). Codex auditó código `9df5245` usando Node 24.15.0/SQLite 3.51.3 FTS5, pnpm 11.3.0 y Chromium 153 en Windows x64; su publicación posterior fue exclusivamente documental.

- Build: 10 paquetes PASS; focal R4-R3 7/7 PASS; focal R4-R4 1/1 PASS; `canonical-coverage` 34/34 PASS; `discovery-handler` 59/59 PASS desde la primera ejecución.
- MCP integral: **402 PASS / 55 FAIL** (457); mismos 55 títulos históricos, un test positivo nuevo PASS. Runner 71/71 PASS; Stdio 18 herramientas y `qap_init` real PASS.
- ESLint focal **0 errores/0 advertencias**, incluida la corrección de `preserve-caught-error`; lint global **34 errores / 28 advertencias**.
- R4-R3-A01 resuelto: estado canónico inválido no recomienda cierre y waiver durable válido sí recomienda cerrar; Crash 2/3 y primera llamada a `qap_session_close` permanecen PASS.
- **R4-R4-A02, P2 reproducido físicamente fuera de Vitest:** con 16 renuncias durables válidas, `qap_status` recomendó `qap_session_close` y la sesión cerró. Con 17 renuncias durables válidas, `qap_status` recomendó falsamente `qap_module_close` para módulo 17, aunque `qap_session_close` completó WRAP_UP y produjo reporte, sin llamar al gateway.

## 2. Causa raíz y contrato

`packages/mcp/src/handlers/status.handler.ts`:

1. `boundNames` recoge **todos** los nombres de módulo vinculados al host y los marca inicialmente pendientes.
2. La implementación R4-R4 validaba su cierre canónico solo en `boundNames.slice(0,16)`, al mismo tiempo que construía el inventario visible de 16 entradas.
3. Los módulos desde el índice 16 no eran liberados del conjunto pendiente, aunque contaran con un registro `waived` legítimo, su razón sustantiva y una aprobación duradera correlacionada.
4. `CanonicalClosureService.allModulesClosed()` sí consulta todos los módulos, por lo que una recomendación falsa podía contradecir el cierre real.

**Invariante:** el límite de presentación nunca limita la evaluación del estado del cierre ni la recomendación de `qap_session_close`. Tampoco se debe marcar resuelto el módulo 17 por inferencia: un estado con aprobación inválida debe permanecer bloqueado.

## 3. Corrección R4-R5 publicada

Se sustituyó el bucle `for (const name of boundNames.slice(0,16))` por un bucle sobre **todos** los `boundNames`, con índice:

- `CanonicalClosureService.status(name)` se consulta para todos los enlaces y solo elimina del conjunto pendiente un estado `closed` o `waived` acreditado canónicamente.
- `canonical_modules` continúa siendo una vista de **hasta 16 entradas**, con `bridge.project()` y estado de entrevista únicamente para las primeras 16. Esto conserva el tamaño/contrato previo del inventario.
- Si el último módulo está incompleto o tiene una autorización inválida, `canonical_pending_closure_modules` y `siguiente_accion` identifican correctamente su nombre y evitan recomendar `qap_session_close`.
- Si los 17 módulos tienen renuncias válidas, la recomendación de cierre se mantiene, sin crear una aprobación sintética.
- No se cambian el esquema SQLite, `canExitWorking`, el servicio durable, el catálogo MCP ni la política de autorización.

## 4. Regresiones incorporadas y pendientes de ejecutar

Archivo `packages/mcp/src/__tests__/canonical-coverage.test.ts`, Suite 5.

Nuevo parámetro `moduleBindings` opcional en el helper del cliente MCP de pruebas: permite enlazar 16 o 17 módulos creados en el mismo fixture físico sin modificar las demás suites.

La prueba parametrizada `R4-R5-A02` tiene tres variantes:

| Variante | `canonical_modules` | `siguiente_accion.tool` | `qap_session_close` |
| --- | --- | --- | --- |
| 16 waivers válidos | 16 | `qap_session_close` | success / WRAP_UP + reporte físico |
| 17 waivers válidos | 16 | `qap_session_close` | success / WRAP_UP + reporte físico |
| 17 waivers, último sin aprobación | 16 | `qap_module_close` del módulo 17, con pendiente exacto | blocked / canonical_module_closure_required; sin reporte |

Cada fixture crea módulos físicos en `IKnowledgeStore`, plan y lifecycle reales, cierres con razón sustantiva y aprobaciones correlacionadas excepto el control negativo; verifica que la foto durable de cierre se conserve y que la autoridad no se invente.

**Afirmaciones no certificadas:** no se ha ejecutado `pnpm build`, Vitest, Chromium ni lint sobre el nuevo HEAD. La matriz **402/55** corresponde a R4-R4; R4-R5 agrega **tres** tests, que solo cuentan como PASS después de ejecución real.

## 5. Próxima compuerta independiente

Ejecutar el worktree seguro con Node 24/SQLite FTS5 y lockfile congelado, en el SHA del nuevo HEAD publicado, sin tocar `main/develop`, sesiones protegidas o secretos.

```powershell
pnpm build
pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-coverage.test.ts -t 'R4-R5-A02' --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-coverage.test.ts --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/mcp exec vitest run src/__tests__/discovery-handler.test.ts --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/mcp exec eslint src/handlers/status.handler.ts src/__tests__/canonical-coverage.test.ts
pnpm --filter @qap/mcp exec vitest run --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/playwright-runner exec vitest run --maxWorkers=1 --reporter=verbose
pnpm lint
```

Repetir Stdio MCP 18 tools y `qap_init` en fixture permitido; preservar los 55 fallos por identidad sin reinterpretarlos como nuevos ni suprimirlos. Verificar explícitamente la recomendación, el cierre real y cero consultas de nueva aprobación para los tres escenarios.

**Contrato de resultados:** Codex debe actualizar esta nota, `STATE.md`, `04_BACKLOG_Y_WBS_PRELIMINAR.md` y publicar bajo `docs/vnext/auditorias/VNEXT-014-R4-R5/` informes `INFORME.md`, `EVIDENCIA_STATUS.md`, `DIFERENCIAL_MCP.md`, `LINT.md` y `COMANDOS.md`; publicar solo Markdown y logs saneados mediante commit/push en la rama vNext. Citar SHA de código auditado y SHA documental final por separado. El usuario no transporta archivos locales.

## 6. Deuda no resuelta

- Los 55 casos históricos de suites MCP (lifecycle 5, p3 5, p4-2 2, p4-4 7, p4-5a 10, p4-5a2 16, server 10) requieren clasificación y restauración de garantías canónicas **sin bypasses**.
- Lint global: baseline **34 errores / 28 warnings**. No hay certificación del nuevo HEAD hasta su ejecución.
- No se acreditó aún un E2E de cierre `closed` mediante cobertura real, ni la sesión multi-módulo con replanificación, ni la UI humana de aprobación fuera de fixtures sintéticos.
- VNEXT-014 **NO-GO** y VNEXT-015 **NO INICIADO** hasta compuertas completas.
