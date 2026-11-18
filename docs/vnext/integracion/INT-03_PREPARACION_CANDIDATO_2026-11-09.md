# INT-01E → INT-03: actualización y correcciones del candidato

Fecha: 09/11/2026. **BLOQUEADO PARA CERTIFICACIÓN FÍSICA / NO-GO de integración.** Hay implementación nueva conservada; no se acredita todavía un MVP funcional. El usuario confirmó durante esta intervención que Gemini mantiene procesos activos y solicitó otro worktree. Separar checkouts no reserva CPU/RAM ni libera el host.

## Referencias y conservación

HEAD remotos consultados al principio y nuevamente al documentar, sin diferencias:

| Referencia | SHA |
|---|---|
| develop remoto D | `b50453f27470b49a88623c6617cb4d16e49180a8` |
| vNext remoto V2 | `dda870e4695a8a27db07ea32b81c1efbbf6ba39e` |
| vNext anterior V1 | `a3f7ab5a21368142884a5a6dc6f5bc072015e6af` |
| Candidato anterior C | `47f17ceafc2f76d5a41fd714cd0c071dbdcb8d72` (padres D, V1) |
| Actualización experimental U | `4d2b5ee81d7bf86425950db73a4a980d6e934ef0` (padres C, V2) |
| Corrección CLI/Reporter | `9da2b5b4a6f2438773dac71a64297fa4ca04ec98` (padre U) |
| Corrección generadores/runner, código evaluado en fuente | `387e7be8b8440dac1c8144bffa601aa832c88e06` (padre anterior) |

El commit de documentación/evidencia posterior conserva ese código; obtener su SHA mediante `git rev-parse HEAD`. La evidencia identifica el SHA de código, los hashes de 14 fuentes/tests y su alcance exclusivamente estático. No debe presentarse como una ejecución de tests sobre el commit de documentación.

El laboratorio original estaba limpio y detached en C. Se ejecutó allí un merge local `--no-ff` de V2: **cero conflictos nuevos**, seis archivos cambiados exclusivamente en `docs/vnext/implementaciones/VNEXT-014-E01/r7/`. No se editaron esos archivos: se incorporaron exactamente los blobs publicados de R7-R2, sin certificarlos. Se conservan C y sus dos padres, sin rehacer la resolución, cherry-pick ni reescritura. U mantiene ambos linajes por ancestros; no se presenta falsamente como un merge nuevo de padres directos D/V2.

A continuación, por instrucción expresa del usuario, `create_worktree` creó otro checkout detached desde U:

`C:/Users/Judirico/.codex/worktrees/int03-mvp-fixes/QAMCP`

Las correcciones están exclusivamente allí. `int01-mvp-lab` queda como referencia en U; C sigue recuperable por SHA. Se identificaron los worktrees R7 y 015-04 mediante metadatos Git, sin operar sus checkouts. Los commits `0b8d8c78b2e76be170cc399ece8d063db3d3c501` y `7149c030eb814e759bc824b1106c8bf3d77e1d11` existen y **no son ancestros** del candidato actualizado. Ninguna sesión fue leída ni modificada. No se accedió a `admin-user.json`. No se movieron ramas oficiales, ni se hizo push, PR o merge definitivo.

Los ocho archivos de resolución originales son idénticos a C: barrel Knowledge, SchemaValidator y los seis documentos históricos enumerados en INT-01E. Se mantienen BVA/RBAC públicos, APIs TC/flow, caché compilada, SQLite, inferencia, ImpactAnalyzer, lector Knowledge y legacy. No cambian schemas TC/flow ni puertos canónicos. Se conserva la distinción `flow.yaml`/`FlowScenario` y la ausencia de snapshot multi-kind garantizado.

## Implementación concreta

| Archivos | Cambio implementado | Límite pendiente |
|---|---|---|
| `packages/cli/src/commands/prune.ts`, `commands.ts` | `maxBytes` validado y aplicado al ámbito `runtime/runs`, según la política de multimedia de Reporter; cero también es cuota válida. No purga registros, pinned, capturas ni archivos desconocidos por cuota. Informa `quotaSatisfied: false` si el contenido conservado impide cumplirla | El alcance de cuota se explicita en help. Poda legacy/TTL/retención canónica continúa pendiente de revisión y pruebas; no se acredita seguridad global de prune |
| `packages/reporter/src/pruning/pruning-engine.ts` | Extraer `planQuotaArtifacts` puro respecto al disco (lee sin borrar), reutilizado por CLI y Reporter: orden estable por fecha/id/archivo, exclusión de removidos ya contabilizados, pins y enlaces simbólicos; solo `.webm`, `.mp4`, `.zip` | La API aditiva y la restricción de tipos deben revisarse antes de integración; no se duplicó un segundo algoritmo de cuota. Sin transacción distribuida ni política nueva de holds |
| `packages/cli/src/commands/prune.ts` | Dry-run no crea runtime en el proyecto ni abre su SQLite: copia DB/WAL a un directorio temporal privado, compara fingerprints antes/después y consulta allí. No copia SHM del usuario. Cierra y retira solo el temporal validado, también ante error | Es estimación, no snapshot coordinado. Cambio detectado durante copia bloquea. No garantiza consistencia de archivos y DB bajo escritores concurrentes; ejecutar en ventana controlada. Lecturas pueden actualizar atime por política del sistema |
| `packages/reporter/src/persistence/sqlite-client.ts` | Tercer argumento opcional `{ readOnly: true }`: sin mkdir, DDL o PRAGMA de inicialización; mutadores rechazan antes de escribir FS/SQL. Dry-run lo utiliza exclusivamente en la copia temporal | Abrir directamente un original read-only puede crear auxiliares SQLite: por eso la CLI no lo hace. Los dos argumentos anteriores conservan su comportamiento. No cambia la autoridad de Knowledge |
| `packages/knowledge/src/plan/bva-generator.ts` | Propuestas etiquetadas `candidate`/`blocked_missing_oracle`; títulos sin afirmación de confirmación. Sin límite inventado ±10. Solo intervalos completos de enteros seguros; longitudes y fracciones no se convierten en valores numéricos ejecutables. Aserción sugerida de rechazo visible, no error ausente | Selectores y textos siguen siendo heurísticos, y la inclusividad/tipo no está aprobada. Por ello **ninguna propuesta BVA está habilitada**; no se llama verificado a `status: confirmed` legacy |
| `packages/knowledge/src/plan/rbac-generator.ts` | Propuestas bloqueadas, sin `body exists`; no se deducen denegaciones de users ausente ni se fabrica ruta/perfil. Se exige ruta y un perfil suministrado inequívoco por rol/id exacto; sin coincidencia por prefijo o fallback `<rol>-local` | Users legacy no es matriz explícita de permisos. La propuesta no es un test RBAC certificado, no inicia login, no genera sesión ni eleva privilegios |
| `packages/playwright-runner/src/case-execution-policy.ts`, `runner.ts` | Casos BVA/RBAC, intercept y cambio de identidad quedan `not_run` con causa precisa. Quitar tags o poner `manually_edited`/`verified` no habilita categorías BVA/RBAC. Si todo el plan está bloqueado, retorna antes de resolver sesiones o importar Chromium; en planes mixtos bloquea cada caso antes de ejecutar sus pasos | Es mitigación conservadora, **no equivalencia funcional** con el recorrido pendiente. El agregado usa `failed` porque el enum existente no tiene blocked; sus casos son `not_run`, cero aserciones fallidas inventadas y cero PASS |
| `packages/playwright-runner/src/runner.ts` | Si se pide un perfil explícito y su resolución falla o devuelve null, interrumpe; no continúa como actor anónimo | No se habilita todavía `switch_auth` ni se atribuye aislamiento de localStorage/IndexedDB al helper existente. La política de auth implícita no se reescribe aquí |

No se modificaron MCP, Auth, schemas, configuración Vitest, workers, timeouts ni expectativas de tests heredados. La publicación R7-R2 fue incorporada sin editarla. No se modificó WBS histórico ni se inició 015-05/016–023. Los hooks se desactivaron solo para cada commit local, sin cambiar configuración persistente, para impedir suites automáticas durante la ocupación de R7. Esto no sustituye ninguna verificación.

## P0/P1 después de las correcciones

| Riesgo | Estado actual | Evidencia que falta / responsable |
|---|---|---|
| P1 max-bytes ignorado | CORREGIDO en fuente; certificación PENDIENTE | CLI/Reporter: cuota real/dry-run, pinned, cuota imposible, recuento, reapertura y baselines |
| P1 dry-run crea runtime/abre original | CORREGIDO en fuente; certificación PENDIENTE | Test árbol/hash/mtime antes-después, con y sin DB, incluyendo WAL activo sintético; validar limpieza temporal y fallos de copia |
| P0 BVA sin oráculo | Mitigación CORREGIDA en fuente; capacidad BLOQUEADA | Diego + vNext: requisito/revisión/ámbito y oráculo tipado aprobados, selectores reales, casos válidos/invalidación y AUT que acepta inválido debe fallar |
| P0 RBAC/body/perfiles inventados | Mitigación CORREGIDA en fuente; capacidad BLOQUEADA | Diego + vNext: permiso explícito recurso/rol/entorno y oráculo de permitido/denegado con identidades legítimas; no usar mocks como evidencia de identidad real |
| P0 intercept_network | BLOQUEADO explícitamente | No se conectó el helper inseguro. Decisión mínima: uso solo como simulación UI acotada, origen/método/cleanup por caso y evidencia distinguible, o exclusión explícita del MVP. Nunca acredita autorización backend |
| P0 identidad explícita perdida | CORREGIDO en fuente para fallo/null de perfil; prueba PENDIENTE | Runner: negativo exige no iniciar navegador ni continuar anónimo. No cubre por sí mismo permisos/aplicación de toda sesión |
| P0 switch_auth y mezcla de estado | BLOQUEADO explícitamente | Diseñar transición por contexto aislado y ámbito host confiable; revisar cookies, local/sessionStorage, IndexedDB, origen, cierre y cancelación. Helper actual no está reparado ni habilitado por esta entrega |
| P0 Knowledge/autoridad humana | PENDIENTE / BLOQUEANTE de certificación | Sin cambios a puertos ni auto-promoción de legacy. Auditor independiente: receipts, revision/scope, CAS obsoleto, fences y readback tras reinicio; intervención humana auténtica |
| P1 update, rollback, historial y poda legacy | PENDIENTE / BLOQUEANTE para mantenimiento certificado | No se declara reversión SQLite por backup de módulo. Holds/referencias, ids con puntos, crash parcial, restore y relaciones FS/SQL aún requieren trabajo y pruebas |
| P1 TC/flow y exports | Resolución fuente CONSERVADA; ejecución PENDIENTE | Los 17 focales originales, schema/load/plan/runner/report y builds dts/import público; no equiparar dialectos |
| P0 R7/014 y ejecutor | BLOQUEANTE | R7-R2 publicado no es auditoría independiente ni EJECUTOR_APTO. Gemini sigue activo; falta ventana confirmada. E01 exige acreditación específica de recursos |

La mitigación no basta para declarar MVP funcional: BVA/RBAC e identidad cambian de una ejecución potencialmente engañosa a bloqueo explícito. Ese comportamiento requiere revisión funcional y no cierra el requisito pendiente.

## Pruebas y evidencia efectivas

**Pruebas funcionales ejecutadas: 0. PASS físico: ninguno. FAIL físico: ninguno observado porque no se ejecutó.** Builds de diez paquetes, typecheck, lint, regresiones y recorrido MVP: **NO EJECUTADOS**, con compuerta ambiental **BLOCKED** por procesos Gemini activos. E01: **NO EJECUTADO**, sin acreditación. No se trasladan resultados históricos de otro SHA.

Se ejecutaron únicamente Git, controles de conservación de fuente y `node --check` (no evalúa imports ni abre SQLite/navegador). Evidencia reproducible: [JSON de comprobaciones](evidencia/2026-11-09/INT-03_COMPROBACIONES_FUENTE.json), generado por `node scripts/int03-check-preparation.mjs --write`. Verifica ancestros, ocho resoluciones sin cambios, R7 idéntico a V2, exclusión de 015-04, sintaxis de 14 archivos y checks léxicos originales: seis documentos completos, 26 rutas exportadas, 94 nombres declarados. Esto **no es typecheck, lint ni compatibilidad semántica**.

Pruebas nuevas preparadas, no ejecutadas ni descubiertas por Vitest:

| Archivo | Casos declarados | Cobertura preparada |
|---|---:|---|
| `knowledge/src/__tests__/generator-oracle-safety.test.ts` | 10 | Propuestas válidas/invalidas sin autoridad; límites incompletos, decimales/longitud/overflow/invertidos; perfil inequívoco y falta de contexto; entrada inmutable |
| `playwright-runner/src/__tests__/case-execution-policy.test.ts` | 6 | Sin bypass por tags/manual; bloqueo intercept/sesión; aserción ordinaria llega al runner sin que eso pruebe autoridad |
| `playwright-runner/src/__tests__/runner-capability-blocks.test.ts` | 5 | Ruta real `execute()`: not_run, cero PASS, sin driver/sesión para planes bloqueados; no fallback anónimo de perfil explícito. Mocks de infraestructura, no prueba de AUT ni de login legítimo |
| `cli/src/__tests__/prune-safety-integration.test.ts` | 9 | Cuota cero, pinned/registros, reopen, árbol/hash/mtime dry-run con/sin SQLite y WAL activo, argumentos inválidos |
| `reporter/src/__tests__/quota-plan.test.ts` | 3 | Orden, inmutabilidad, sin doble conteo, archivos protegidos y traversal |
| `reporter/src/__tests__/sqlite-audit-mode.test.ts` | 1 | Mutadores read-only rechazan antes de tocar archivos |

Son **34 casos adicionales + 17 originales = 51 declarados**. No equivalen a un conteo de tests físicos. Los dos archivos originales de 17 casos están intactos.

Los tests legacy de BVA que exigen `not_visible` para error, longitudes numéricas y fallback, y RBAC que exige perfiles inventados/ausentes o body como oráculo, pueden fallar por el cambio semántico deliberado. **No se editan ni eliminan para fabricar PASS.** Ejecutarlos frente a D, V2 y candidato, registrar cada delta por título y someterlo a revisión. Un fallo introducido por este candidato no debe llamarse deuda histórica. Otros fallos solo se clasifican históricos después de reproducirlos en su baseline.

## Certificación preparada: ejecución posterior, no realizada

Antes de ejecutar: Gemini confirma publicación y ausencia de procesos, Codex realiza auditoría R7 independiente, se excluyen suites simultáneas y el usuario confirma ventana. El worktree nuevo comparte host. No copiar sesiones, bases o perfiles personales al laboratorio; usar fixtures independientes. Para un recorrido real se requiere AUT permitido y autorización legítima. E01 permanece fuera hasta EJECUTOR_APTO acreditado.

Desde el laboratorio nuevo, conservar SHA, lockfile, Node/pnpm, sistema, comandos, salida completa, exit y nombres de tests. Reservar carpetas de evidencia por SHA. Mismo entorno y versiones para baselines D y V2 en checkouts autorizados independientes; C es referencia adicional para aislar el efecto del merge original. No instalar ni ejecutar en R7/015-04, ni modificar workers/timeouts para conseguir verde.

Comandos preparados, **NO EJECUTADOS**:

```powershell
node -v
pnpm -v
pnpm install --frozen-lockfile
pnpm build
pnpm --filter @qap/shared exec vitest run src/__tests__/schema-validator-integration.test.ts
pnpm --filter @qap/knowledge exec vitest run src/__tests__/public-exports-integration.test.ts src/__tests__/generator-oracle-safety.test.ts
pnpm --filter @qap/playwright-runner exec vitest run src/__tests__/case-execution-policy.test.ts src/__tests__/runner-capability-blocks.test.ts
pnpm --filter @hyouka73/qap-cli exec vitest run src/__tests__/prune-safety-integration.test.ts src/__tests__/prune-command.test.ts src/__tests__/update-command.test.ts src/__tests__/update-rollback.test.ts src/__tests__/rollback-command.test.ts
pnpm --filter @qap/reporter exec vitest run src/__tests__/quota-plan.test.ts src/__tests__/sqlite-audit-mode.test.ts src/__tests__/pruning-engine.test.ts
pnpm --filter @qap/engine test
pnpm --filter @qap/knowledge test
pnpm --filter @qap/shared test
pnpm --filter @qap/playwright-runner test
pnpm --filter @qap/reporter test
pnpm -r exec tsc --noEmit
pnpm lint
```

La CLI se llama realmente `@hyouka73/qap-cli`; el filtro `@qap/cli` del informe anterior no selecciona este paquete. Build debe acreditar diez paquetes: auth, cli, engine, git-adapter, knowledge, mcp, playwright-adapter, playwright-runner, reporter, shared. Comprobar los archivos de tests existentes al ejecutar y registrar ausencias en cada padre, no convertir ausencia de suite en PASS. La regresión completa CLI y MCP debe planificarse en la misma reserva aprobada; no lanzar `pnpm test` global o E01 inadvertidamente. Lint diferencial: comparar diagnósticos por archivo/regla/línea contra D/V2, además del exit global. Ninguna ejecución se certifica por inspección de este bloque.

## Contrato mínimo pendiente y recorrido MVP

Se propone a Diego y al responsable vNext una decisión acotada, previa a habilitar generadores: asociar explícitamente cada caso con requisito canónico, revisión y ámbito aprobados, y su evidencia de autoridad humana; aportar tipo/unidad/precisión/inclusividad BVA y selectores/oráculos concretos de aceptación y rechazo. Para RBAC, matriz explícita recurso/operación/rol/perfil/entorno y oráculos reales de permitido/denegado; un perfil observado o body visible no prueba permiso. No se inventa un nuevo schema ni se reutiliza `manually_edited`, un tag o un receipt ajeno como aprobación. Aprobar también que las transiciones de actor requieran contexto nuevo y qué estado puede sobrevivir entre casos dependientes. La implementación siguiente debe usar los puertos existentes, sin segundo FlowOrchestrator o segundo store.

El recorrido real está **NO EJECUTADO / BLOQUEADO**: candidato no ha superado verificaciones, faltan contratos y ventana/AUT. Su futura evidencia debe encadenar contexto → requisito confirmado por persona autorizada → TC y plan ejecutable → Playwright sobre AUT permitido → evidencia real → reinicio y readback → reporte → repetición/regresión. Cubrir acceso permitido/denegado con identidades legítimas, caso inválido aceptado indebidamente que haga fallar la prueba, CAS obsoleto y rollback/recuperación. Los mocks preparados no acreditan ninguna de estas operaciones. No se simula confirmación humana.

**Siguiente intervención única recomendada:** revisión vinculante por Diego/vNext del contrato mínimo de oráculos e identidad anterior, seguida de su habilitación acotada en este mismo candidato. Es la dependencia de código que hoy impide usar BVA/RBAC; no hace falta repetir INT-01. En paralelo externo, responsables R7 deben liberar y certificar su ventana. La aprobación de contrato no libera recursos ni concede GO.

## Reproducción, recuperación y compuertas

U se reproduce desde C detached mediante `git merge --no-ff dda870e4695a8a27db07ea32b81c1efbbf6ba39e` en un laboratorio autorizado limpio; se esperan seis rutas R7 y cero conflictos nuevos. Los commits `9da2b5b` y `387e7be` guardan las correcciones separadas. Revisar `git diff 4d2b5ee..387e7be --` con las 14 rutas explícitas de `scripts/int03-check-preparation.mjs`; no generar patch indiscriminado de sesiones. El manifiesto de entradas fija las huellas de los informes y patch previos en sus ubicaciones originales Codex; no presupone publicación en GitHub.

Para recuperar un estado Git: conservar los SHAs y cualquier edición nueva, confirmar árbol limpio y usar `git switch --detach <SHA>` **solo en el laboratorio correspondiente**. Volver a U retira las correcciones de este checkout; volver a C recupera el candidato anterior a R7. No ejecutar reset hard, force-push ni limpieza de otros worktrees. No se ha desplegado ni alterado datos de usuario; este rollback Git no certifica reversión de SQLite o de una poda real. Una futura prueba de recuperación debe verificar bases, archivos, historial y readback, no solo checkout.

Para INT-03 formal siguen siendo necesarias INT-01D con revisión dual, INT-02 y rescate VNEXT-014/R7 con evidencia independiente, aceptación DEV-MVP-01/02, resolución/decisión de riesgos del recorrido, builds/tests/typecheck/lint y recuperación por SHA. INT-04 exige revisión, plan reversible y autorización explícita antes de merge oficial. No se cierra INT-02/03/04 con esta intervención ni se declara GO. Fechas del responsable: funcional el 16, QA/estabilización 17–20; objetivo interno 13 y última ventana aprobada 15. No se sustituyen silenciosamente las fechas o DONE del WBS histórico.
