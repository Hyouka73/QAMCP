# INT-01E — candidato técnico MVP para certificación

Fecha: 2026-11-09. **CANDIDATO TÉCNICO PREPARADO PARA CERTIFICACIÓN; compatibilidad funcional pendiente, sin GO.**

Esta entrega materializa exclusivamente la autorización posterior INT-01E. No cierra INT-01D, INT-02, INT-03 ni INT-04, no inicia VNEXT-016/020–023 y no certifica el MVP. El objetivo del responsable es funcionalidad completa el 16/11 y QA/estabilización 17–20/11; GO/NO-GO objetivo 13/11 y último merge aprobado 15/11. Estas decisiones requieren la enmienda formal propuesta en la replanificación; no se reescriben fechas históricas del WBS.

## Identidad y aislamiento

| Referencia | SHA / ubicación |
|---|---|
| Primer padre D, develop remoto | `b50453f27470b49a88623c6617cb4d16e49180a8` |
| Segundo padre V, vNext remoto | `a3f7ab5a21368142884a5a6dc6f5bc072015e6af` |
| Base común | `b9d5b503a6c4c827f5184fe30cbcec7366efbfb6` |
| Laboratorio detached | `C:/Users/Judirico/.codex/worktrees/int01-mvp-lab/QAMCP` |
| Worktree R7 excluido | `C:/Users/Judirico/Documents/QAMCP/QAMCP` |
| Worktree 015-04 excluido | `C:/Users/Judirico/.codex/worktrees/vnext-015-04/QAMCP` |
| Commits 015-04 conservados, no incorporados | `0b8d8c78b2e76be170cc399ece8d063db3d3c501`, `7149c030eb814e759bc824b1106c8bf3d77e1d11` |

`git ls-remote` confirmó D/V al inicio. `git status --short` estaba vacío y HEAD era D detached; no había trabajo previo que sobrescribir. Se consultó únicamente el inventario Git de worktrees para identificar aislamiento. No se abrió el checkout R7 ni el de 015-04. Las referencias locales compartidas pueden cambiar por el trabajo ajeno: el candidato utiliza SHAs inmutables, no los nombres locales de ramas. No se usa ni inspecciona contenido de sesiones ni `admin-user.json`; el checkout heredado no se considera una fixture sanitizada para pruebas.

Se ejecutó `git merge --no-commit --no-ff V` en el laboratorio. Su código 1 representa los ocho conflictos esperados, no una suite fallida. Se resolvieron archivos explícitos, sin checkout global ours/theirs. El candidato se conserva como merge commit local detached de padres D/V; su SHA exacto, árbol y huellas del diff se publican en el manifiesto externo INT-01E de esta entrega. Ninguna rama oficial o remota se mueve por esta operación. No hay push, PR, rebase o cherry-pick. R7 puede publicar posteriormente: ese delta exigirá otro candidato y revisión antes de cualquier integración formal.

## Resolución de los ocho conflictos

| Archivo | Decisión explícita | Estado y límite |
|---|---|---|
| `packages/knowledge/src/index.ts` | Unión de todos los export-star D/V: BVA, RBAC, SQLite, inferencia, `analyzeImpact`, `readKnowledgeImpact` y legacy. Una sola exportación de `update-guard` | CORREGIDO en fuente; build/dts/import runtime pendientes |
| `packages/shared/src/validator/schema-validator.ts` | Caché estática V, imports/registro TC/flow D, métodos `validateTcCase`/`validateFlow` D. Publicar caché solo al terminar toda compilación. Traducción síncrona de errores conservada | CORREGIDO en fuente; tests funcionales pendientes |
| `docs/vnext/014F_R4_R10_ESTABILIZACION_P1.md` | Texto principal V y publicación D íntegra como anexo histórico con SHA | CORREGIDO documentalmente; no nueva acta QA |
| `docs/vnext/04_BACKLOG_Y_WBS_PRELIMINAR.md` | WBS V íntegro más publicación D histórica; aviso de procedencia y enmienda posterior pendiente | CORREGIDO; sin editar DONE ni fechas históricas |
| `docs/vnext/STATE.md` | Índice V íntegro y continuidad D íntegra; la frase histórica «015 no iniciado» se identifica como afirmación de aquel padre | CORREGIDO; VNEXT-014 sigue NO-GO |
| `docs/vnext/auditorias/VNEXT-014-R4-R10/COMANDOS.md` | Conservar ambos registros atribuidos a sus padres | CORREGIDO; sin atribuir ejecuciones al candidato |
| `docs/vnext/auditorias/VNEXT-014-R4-R10/INFORME.md` | Conservar ambos informes, su código auditado y resultados acotados | CORREGIDO; no trasladar PASS a D/V/candidato |
| `docs/vnext/auditorias/VNEXT-014-R4-R10/SIGUIENTE_BLOQUE_P0.md` | Conservar ambas listas como historia atribuida y mantener compuertas vigentes V | CORREGIDO; no cerrar hallazgos por resolver texto |

Los seis documentos conservan el texto completo de ambos padres, con normalización de finales de línea. No se elige una acta para borrar la otra. El WBS 08 entra sin conflicto desde V y queda intacto. Este informe añade contexto presente sin modificar las actas. Los tres documentos previamente idénticos no requieren resolución.

## Conservación de contratos

No se modifica ningún schema ni puerto de dominio. Los cuatro archivos TC/flow (`shared/schemas` y `shared/src/schemas`) conservan el contenido D. `validateFlow` valida el `flow.yaml` legacy de módulos; no equivale al `FlowScenario` canónico. No se convierten aliases en ejecución efectiva ni se relaja rechazo de tipos, campos extra o acciones desconocidas.

El validador comparte funciones compiladas, no objetos `ValidationResult`/errores. Cada llamada traduce inmediatamente el slot mutable AJV antes de otro uso; no se añade asincronía ni coerción. Métodos de ambos padres conservados. Las garantías de CAS, receipts, fences, autoridad humana, revisión y ámbito de Knowledge permanecen en V; exportar BVA/RBAC no convierte requisitos legacy en hechos canónicos. El lector de impacto no ofrece snapshot multi-kind y el candidato no lo anuncia. 015-04 queda fuera.

## Compatibilidad semántica P0/P1

Estados de esta tabla son de preparación, no aprobación de riesgo. BLOQUEANTE significa que impide certificar el recorrido que lo usa. PENDIENTE requiere prueba o decisión; no autoriza omitirla. Todos son riesgos ya identificados en INT-01; no se ha aplicado una corrección semántica nueva por resolver los conflictos.

| Riesgo / prioridad | Archivo(s) | Estado | Corrección o decisión requerida / evidencia mínima | Responsable y dependencia |
|---|---|---|---|---|
| B01/B02, oráculo BVA P0 | `knowledge/src/plan/bva-generator.ts`, `src/__tests__/bva-generator.test.ts` | BLOQUEANTE | Sustituir inferencias `parseInt`/límite ausente ±10 por tipo, precisión, inclusividad y fuente humana aprobados; longitudes reales y rechazo observable. AUT que acepte inválido debe hacer fallar el caso | Diego + dueño vNext; contrato INT-01D/DEV-MVP-01 |
| B03, RBAC P0 | `knowledge/src/plan/rbac-generator.ts`, tests homónimos | BLOQUEANTE | Permisos explícitos, perfil exacto, identidad y denegación real; `body exists` y prefijo de perfil no prueban autorización. Ausencia de usuarios no equivale a permiso denegado confirmado | Diego + vNext; matriz humana de permisos |
| B02/B04/B05, dialectos TC/flow P1 | `shared/src/types/tc-case.type.ts`, cuatro schemas TC/flow, validador; consumidores loader/runner | PENDIENTE | APIs reunidas; fijar fixtures realmente usados, rechazar aliases contradictorios o normalizar mediante contrato aprobado. Validación→carga→runner→reporte, sin equiparar FlowScenario/flow.yaml | Shared + runner, INT-01D; ejecutar nuevos focales |
| B06, exportaciones P1 | `knowledge/src/index.ts` | CORREGIDO (fuente) | Rutas únicas y nombres directos sin colisión léxica; import público, build JS/dts y tsc aún pendientes para descartar ambigüedad de reexports | Dueño Knowledge + certificación Codex |
| B07, intercept no ejecutado P0 si requerido | `playwright-runner/src/runner.ts`, `actions/index.ts`, `actions/intercept-network.ts` | BLOQUEANTE para casos intercept | Helper existe pero dispatcher no contiene `intercept_network`; V falla cerrado en default. Integrar dispatch/cleanup con contrato y prueba por runner, o alcance aprobado que bloquee explícitamente esos casos. Intercept solo simula UI, nunca prueba RBAC backend | Runner/vNext + Diego; coordinación de rutas R7 |
| B08, sesión/perfil P0 | `playwright-runner/src/actions/switch-auth.ts`, `session-resolver.ts`, `runner.ts` | BLOQUEANTE para cambio de identidad | Cwd y `step.profile` no son contexto confiable; paso no transmite política host al resolver; se agregan datos localStorage sin eliminación integral del estado previo. Definir raíz/módulo/opciones explícitos, perfiles/orígenes y reemplazo seguro; negativos de identidad y cleanup. No editar Auth ni usar sesiones personales | Dueño runner + vNext, cesión R7 y decisión INT-01D |
| B09, resultado/oráculo real P0/P1 | `shared/src/types/execution-result.type.ts`, schemas resultado, `runner.ts`, `mcp/src/handlers/{test,report}.handler.ts`, reporter | PENDIENTE | Preservar error/cancel/not_run y rechazo desconocidos. Probar que no existe PASS sin ejecución/aserción y que reporte reproduce persistencia; metadato redacted_selectors_count no acredita productor | Runner/reporter; baselines ambos, cambios MCP fuera de esta resolución |
| B10/C02, autoridad y stores P0 | `knowledge/src/storage/{sqlite-knowledge-adapter,knowledge-commit-planner,file-storage}.ts`, `engine/src/knowledge-store.port.ts` | BLOQUEANTE hasta recorrido acreditado | No auto-promover legacy confirmed. Prueba humana con revisión/scope, CAS obsoleto rechazado, receipts/history/readback. Ninguna afirmación ACID entre SQLite/FS o snapshot que puerto no garantice | vNext; R7/INT-02 y contrato fuente de verdad |
| C01, update/backup P1 | `cli/src/commands/update.ts`, `cli/src/lib/module-semantic-hash.ts`, `knowledge/src/plan/module-backup-manager.ts` | PENDIENTE | Conservar edits manuales, diff/force, backup y hashes D. Restore debe recuperar fixture y datos esperados. Backup de módulo no es rollback de SQLite | Dueño CLI, contrato retención/recuperación |
| C03/C04, prune/dry-run P1 | `cli/src/commands/prune.ts`, `cli/src/commands.ts`, `cli/src/__tests__/prune-command.test.ts` | BLOQUEANTE para mantenimiento MVP | `maxBytes` sin aplicación acreditada, default 50 y apertura QapDatabase incluso en dry-run sobre runtime existente. Contrato cuotas/pins/edad/conteo; dry-run cero escrituras, incluyendo inicialización SQLite/WAL; negativos y árbol/hash comparados | CLI + retención, INT-01D |
| C02/C05/C06, historia y recuperación P1 | `cli/src/commands/prune.ts`, `knowledge/src/history/history-manager.ts`, `reporter/src/persistence/sqlite-client.ts` | BLOQUEANTE para poda/restore | Referencias/pins/holds y nombres con puntos; no truncar asociaciones ni reescribir historia silenciosamente. Inyectar fallo parcial y restaurar stores/readback; no construir transacción distribuida nueva | CLI/Knowledge + vNext; prueba independiente antes INT-04 |
| VNEXT-014/R7 P0 de compuerta | Código V y evidencia de rescate oficial | BLOQUEANTE | V congelado no incorpora futuras seis correcciones de Teamwork. Publicación R7, auditoría independiente de identidades y E2E humano/E01/lint según WBS; refrescar padres y revisar delta, sin cherry-pick automático | Gemini R7, luego Codex independiente; no intervenir aquí |

Los defectos heredados no se vuelven aceptables por aparecer en un padre. Una exclusión de capacidad requiere decisión explícita y comportamiento de bloqueo claro, sin ocultar una opción insegura ni debilitar oráculos. Ningún bloqueo se solventa mediante nuevas funcionalidades fuera del MVP.

## Pruebas preparadas y ejecución real

Nuevos archivos preparados, **no ejecutados**:

- `packages/shared/src/__tests__/schema-validator-integration.test.ts`: 10 casos (incluye siete negativos parametrizados): TC/flow válidos, UUID inválido, required, enum, tipos, extra fields, traducción de errores, aislamiento entre familias/instancias, caché sin recompilar, entrada congelada y distinción legacy/canónico.
- `packages/knowledge/src/__tests__/public-exports-integration.test.ts`: siete APIs públicas de D/V/legacy; su import activa la resolución del barrel. No abre SQLite ni obtiene sesiones en el test.

Ejecución efectiva en esta actividad: consultas Git, merge experimental, materialización de resoluciones y `node scripts/int01e-check-conservation.mjs`. Este último verificó seis documentos con ambos textos, ocho archivos sin markers, 26 rutas exportadas únicas y 94 nombres declarados directamente sin colisión léxica; APIs y schemas preservados. Es inspección de fuente, **no prueba funcional, build, typecheck ni lint**. La resolución se reprodujo con `scripts/int01e-materialize-resolutions.mjs`; requiere D detached y MERGE_HEAD V y se niega a ejecutarse tras finalizar el merge.

Tests funcionales ejecutados: **0**. Builds: **0**. Typecheck/lint: **no ejecutados**. E01: **no ejecutado**. No existe PASS físico nuevo ni comparación física D/V/candidato. No se instaló dependencia alguna ni se modificó Vitest, workers, timeouts o expectativas existentes. El primer `diff --check` sobre el índice detectó CRLF como whitespace al comparar el validador contra D; se normalizó ese archivo a LF sin cambios semánticos adicionales. El diff bruto contra V incluye esa normalización; el diff con ignore-space-at-eol facilita revisar las doce líneas funcionales añadidas. Si se conserva un commit local, se desactivan hooks solo para esa invocación para impedir ejecuciones automáticas no coordinadas; no sustituye las verificaciones pendientes ni altera configuración persistente.

Matriz de ejecución posterior a liberación de host y confirmación del usuario:

| Bloque | Comandos / pruebas | Comparación y aceptación |
|---|---|---|
| Focal Shared | `pnpm --filter @qap/shared exec vitest run src/__tests__/schema-validator-integration.test.ts src/__tests__/schema-validator-reuse.test.ts src/__tests__/schema-validator.spec.ts src/__tests__/schema-divergence.test.ts` | Nuevos focales candidato; suites existentes en cada padre donde existan, reportando ausencias, no reemplazando tests |
| Focal Knowledge | `pnpm --filter @qap/knowledge exec vitest run src/__tests__/public-exports-integration.test.ts src/__tests__/bva-generator.test.ts src/__tests__/rbac-generator.test.ts test/impact-analyzer.test.ts test/knowledge-impact-reader.test.ts test/inference-engine.test.ts test/sqlite-knowledge-adapter.test.ts` | Capturar identidad/resultados de cada padre y candidato; versión SQLite/Node fijada, DB sintética independiente |
| CLI | `pnpm --filter @qap/cli exec vitest run src/__tests__/update-command.test.ts src/__tests__/update-rollback.test.ts src/__tests__/rollback-command.test.ts src/__tests__/prune-command.test.ts` | Dry-run cero escrituras, rollback/hash y crash/readback requieren negativos adicionales acordados; suites actuales no prueban ausencia de los riesgos por sí solas |
| Runner | Suites `actions.test.ts`, `actions-context.test.ts`, `switch-auth.test.ts`, `intercept-network.test.ts`, resto runner | Probar dispatcher real e identidad/denegación backend. Helper intercept aislado no demuestra ejecución de acción desde TC |
| Regresión ambos padres | `pnpm install --frozen-lockfile`; `pnpm build`; `pnpm --filter @qap/shared test`; engine/Knowledge/CLI/runner/reporter equivalentes; suite MCP completa coordinada; `pnpm lint`; `pnpm -r exec tsc --noEmit` | Mismo entorno y fixture por SHA, logs/exit/identidades; investigar todo delta, no compensar FAIL por conteo de PASS. Tsc debe registrar diagnósticos baseline, incluidos tests/config existentes |
| QA MVP | Requisito humano→TC/BVA/RBAC→plan→Playwright real→evidence persistida→report→regresión; AUT defectuosa debe fallar; falta de evidencia bloquea. Instalar limpio y restaurar | Reporte y readback con SHA, autoridad humana y oráculos reales. Integrado además A closed+B waived→report→WRAP_UP→replan y evidencia INT-02 |

No correr el bloque global MCP/E01 inadvertidamente. E01 requiere EJECUTOR_APTO con reserva CPU/RAM acreditada y auditoría independiente. Una ventana libre no es esa certificación. Para cualquier ejecución física que compita con R7 se espera publicación Teamwork, confirmación sin procesos, auditoría independiente y exclusión de ejecuciones simultáneas; después confirmar ventana con el usuario. Si un baseline no puede ejecutarse, registrar NO EJECUTADO y conservar bloqueo, nunca imputarle PASS histórico de otro SHA.

## Reproducción y diff

En otro laboratorio dedicado autorizado (sin usar R7/015-04 ni mover ramas oficiales): partir de D detached y ejecutar `git merge --no-commit --no-ff a3f7ab5a21368142884a5a6dc6f5bc072015e6af`. Se esperan ocho conflictos. Copiar desde la entrega los dos scripts INT-01E y ejecutar `node scripts/int01e-materialize-resolutions.mjs` únicamente en un directorio padre llamado `int01-mvp-lab`, o revisar/aplicar el diff de resolución en un laboratorio con otro nombre. Incorporar los dos archivos de tests y este informe desde el candidato; ejecutar el checker estático. `git add` con las ocho rutas explícitas y los cinco archivos nuevos; comprobar `git ls-files -u` vacío y `git diff --cached --check`. Finalizar exclusivamente como commit local detached si se desea conservarlo. No ejecutar los bloques físicos hasta coordinar.

Revisión del merge guardado: `git show --no-patch --format=raw HEAD` muestra dos padres; `git diff --ignore-space-at-eol a3f7ab5 HEAD -- packages/knowledge/src/index.ts packages/shared/src/validator/schema-validator.ts` muestra solo las uniones productivas; `git diff a3f7ab5 HEAD --` con las seis rutas documentales muestra su procedencia/adición D. La opción ignore-space-at-eol ayuda a revisar CRLF heredados; no elimina ni oculta cambios semánticos. El manifiesto externo contiene el diff productivo, de resolución completo y de archivos nuevos, además de sus SHA256. No generar ni compartir un patch indiscriminado de sesiones.

## Recuperación y rollback

Antes de finalizar el commit, el merge se puede cancelar en este laboratorio limpio mediante `git merge --abort` (después de preservar los artefactos de resolución y tests). Después de conservar el merge local, guardar su SHA/manifiesto: volver a D solo en este worktree mediante checkout detached D tras asegurar estado limpio; el SHA del candidato permite recuperarlo con checkout detached del mismo. No se automatiza ninguna de estas acciones sobre otros worktrees. No hay despliegue ni datos de usuario que revertir por esta entrega. El rollback operativo CLI/SQLite continúa pendiente de prueba: un rollback Git no revierte las bases de datos ni evidencia de ejecución.

## Condiciones para INT-03 formal

1. INT-01D revisado por Diego y responsable vNext: contratos TC/oráculos, permisos, fuente de verdad, retención y matriz de conservación.
2. INT-02A/B con evidencia por identidad, revisión humana auténtica, rescate R7 independiente, E01 acreditado, lint y recorrido canónico. VNEXT-014 continúa NO-GO mientras falte.
3. DEV-MVP-01/02 aceptados y recursos reservados; riesgos P0/P1 del recorrido resueltos o decisión explícita de alcance que no quite garantías.
4. Refrescar HEAD remotos tras R7, reconstruir candidato desde padres aprobados y auditar/reprobar delta. No incorporar automáticamente 015-04.
5. Builds, focales, regresiones de ambos padres, recorrido real, recuperación y datos demostrados con SHA y logs. Después INT-03B, revisión dual/rollback INT-04A y autorización futura expresa de merge; esta entrega no concede ninguna.

El candidato permite revisión técnica ahora. No autoriza publicar ni integrar `develop`, no acredita ejecutor ni convierte el calendario en evidencia.
