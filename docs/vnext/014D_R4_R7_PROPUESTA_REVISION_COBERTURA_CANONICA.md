# VNEXT-014-D-R4-R7 — Composición canónica de propuesta, aprobación y cobertura

**Fecha:** 2026-11-05  
**Rama exclusiva:** `feat/qap-vnext-architecture`  
**Último código auditado físicamente:** `ea75eb2c52266b174e6d24917c1b089d56834900` (R4-R7)
**Auditoría documental R4-R6:** `8b9b7b84cfff70d91e55a2a2b1ef6578994eedd9`  
**Estado R4-R7:** integración **verificada físicamente**; lint focal ampliado y global rojos, hallazgo A01 P1 preexistente de reintento de aplicabilidad. VNEXT-014 **NO-GO**; VNEXT-015 no iniciado.

## 1. Baseline recibido en GitHub

Codex completó R4-R6 con Node 24.15.0, SQLite FTS5 3.51.3, Chromium 153 y worktree aislado: build 10 paquetes PASS; `canonical-interview` 43/43, `canonical-coverage` 37/37, runner 71/71, Stdio 18 herramientas + `qap_init` PASS; matriz integral MCP **406 PASS / 55 FAIL de 461**. ESLint focal 0/0; global **34 errores y 28 advertencias**. Discovery pasó 59/59 en reintento e integral, pero hubo timeout previo de cancelación en vuelo y permanece abierto como intermitencia, no como garantía resuelta.

El caso R4-R6-I01 acreditó continuidad de pregunta canónica desde `qap_status` sin generar `rules.yaml`, confirmar requisitos ni inventar aprobación; la sonda independiente probó estabilidad de ID/versión, SQLite, DB/WAL y lifecycle. Los cinco casos lifecycle históricos siguen FAIL y los 55 títulos fueron conservados por identidad. Fuentes:

- [Informe independiente R4-R6](auditorias/VNEXT-014-R4-R6/INFORME.md).
- [Siguiente bloque P0 analizado por Codex](auditorias/VNEXT-014-R4-R6/SIGUIENTE_BLOQUE_P0.md).
- [Clasificación previa de 55 fallos](auditorias/VNEXT-014-R4-R5/CLASIFICACION_55_FALLOS.md).

## 2. Alcance de R4-R7

**Decisión arquitectónica:** los servicios existentes ya implementan la autoridad y persistencia requeridas; **no se introduce otro motor de entrevista ni se modifica código productivo en este bloque**. La prioridad es componer y comprobar la cadena mediante una prueba física con el servidor real y sus almacenes autorizados. Si la auditoría descubre una diferencia funcional, debe publicarla como defecto nuevo antes de aplicar cambios.

Fronteras reutilizadas sin bypass: `CanonicalInterviewService` (pregunta, propuesta, corrección, revisión y readback), `IHumanReviewGateway` (decisión por host ajeno a los argumentos MCP), `SqliteKnowledgeAdapter` (`ExpectedRequirement` y relación `human_review_authorization_v1`), `ModuleObservationBridge` (evidencia asociada), `SqliteModuleClosureStore` y `CanonicalCoverageService` (evaluación honesta), `qap_rules_set`, `qap_module_close` y `qap_status` por SDK.

La ausencia de aprobación o una decisión para un digest anterior **no** confirma ni modifica el requisito. La cobertura solo considera requisitos persistidos con confirmación verificable y criterios de aceptación; las restantes categorías de aplicabilidad desconocida siguen bloqueando `closed`. `execution_coverage` permanece `not_executed`.

## 3. Cambios publicados y auditados en R4-R7

Archivo: `packages/mcp/src/__tests__/canonical-interview.test.ts`, suite R3 canónica.

- Se añadió la regresión **`R4-R7-I01: proposal correction, independent host review and real canonical coverage`**.
- El fixture mantiene el gateway humano separado del cliente MCP; opcionalmente provisiona un `SqliteModuleClosureStore` con clave aleatoria efímera y scope autorizado. Se cierra este almacén al limpiar cada prueba.
- La prueba asocia observaciones sintéticas legítimas mediante `ModuleObservationBridge` antes de abrir pregunta; evalúa cobertura mediante `qap_module_close.canonical_closure.action=evaluate` sobre el mismo store.
- Envía propuesta `functional` sin criterios; la primera `review` devuelve `human_review_not_authorized`. `qap_status` sigue reconociendo propuesta pendiente. Cero `ExpectedRequirement` persistidos.
- Efectúa `correct` con **versión nueva**, texto sustantivo y **criterios verificables**. Una aprobación del host para el texto anterior **no** autoriza el digest nuevo: segundo `review` sigue bloqueado.
- El inbox externo emite ahora la decisión sobre el digest exacto corregido: `review` debe confirmar una sola revisión canónica, mientras el retry debe ser idempotente.
- Se verifica lectura del `ExpectedRequirement` confirmado incluyendo texto, categoría, criterios, verificación humana, el único recibo `human_review_authorization_v1`, readback en segunda conexión SQLite e historia sin duplicación.
- La evaluación posterior debe contar 1 requisito confirmado, actualizar el digest de cobertura y marcar `functional` como satisfecha; **no** puede declarar cobertura general completa, pues categorías como `security` siguen con aplicabilidad `unknown`. Tampoco puede afirmar ninguna ejecución de prueba ni cerrar el módulo.
- Lifecycle se conserva byte a byte; no hay `rules.yaml`, aprobación MCP autodeclarada, duplicados o éxitos artificiales.

**No ejecutar el fixture contra producción ni usar credenciales reales.** El gateway del fixture es una simulación de la entrada humana independiente para probar el contrato, no una interfaz de aprobaciones productivas.

## 4. Auditoría independiente obligatoria

Auditar **el SHA de código publicado al final de esta ronda**, no el SHA del último informe documental. En worktree aislado, Node 24.15.0 + FTS5, lockfile congelado y Chromium. Verificar comandos y códigos de salida:

```powershell
pnpm build
pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-interview.test.ts -t 'R4-R7-I01' --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-interview.test.ts --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-coverage.test.ts --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/mcp exec vitest run src/__tests__/discovery-handler.test.ts --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/mcp exec eslint src/__tests__/canonical-interview.test.ts src/handlers/status.handler.ts src/handlers/canonical-interview-service.ts src/handlers/canonical-coverage-service.ts
pnpm --filter @qap/mcp exec vitest run --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/playwright-runner exec vitest run --maxWorkers=1 --reporter=verbose
pnpm lint
```

Confirmar Stdio 18 herramientas y `qap_init` legítimo sobre fixture. Comparar por título la matriz MCP completa con **406 PASS / 55 FAIL de 461** (R4-R6) y mantener el incidente intermitente Discovery visible. R4-R7 agrega **una sola prueba** al baseline, pero su resultado **no se presume PASS** hasta medición.

### Evaluación adversarial específica

1. `review` sin autorización debe continuar bloqueado, sin requisitos ni recibo de aprobación.
2. La aprobación para el digest del texto anterior no debe confirmar una corrección.
3. Confirmación válida debe crear exactamente 1 requisito y 1 recibo, preservando revisión y fuente.
4. Un retry no debe duplicar y la segunda conexión SQLite debe leer la misma entidad.
5. Cobertura antes/después debe distinguir requisito confirmado y criterios de aceptación sin concluir `complete` ni `closed` por categorías desconocidas.
6. Nadie debe confundir revisión de requisito con la autorización separada de `close`/waiver.
7. Los guards de cierre R4-R2 a R4-R5, la entrevista R4-R6 y las suites previas deben mantenerse sin regresiones.

Si la nueva prueba falla por **un supuesto incorrecto del test**, describir el contrato real y la diferencia; si falla por código, registrar reproducción y severidad. Codex NO modifica código ni expectativas, solo documenta.

## 5. Publicación obligatoria del auditor

Actualizar en GitHub la presente nota, `docs/vnext/STATE.md` y `docs/vnext/04_BACKLOG_Y_WBS_PRELIMINAR.md`. Crear `docs/vnext/auditorias/VNEXT-014-R4-R7/` con `INFORME.md`, `EVIDENCIA_INTEGRACION.md`, `DIFERENCIAL_MCP.md`, `LINT.md`, `COMANDOS.md` y `SIGUIENTE_BLOQUE_P0.md`.

Solo autorizar commits/push de Markdown y logs saneados a `feat/qap-vnext-architecture`; sin código, test fixes, merges, force-push, datos sensibles, sesiones protegidas o SQLite productivo. Registrar SHA de código auditado y commit documental **por separado**; verificar publicación remota. No solicitar al usuario compartir archivos ni logs: ChatGPT leerá GitHub directamente.

## 6. Lo que queda después de este hito

- Cobertura completa y `closed` con requisitos confirmados en un recorrido real, usando decisiones de aplicabilidad independientes de la revisión de requisito.
- Un segundo módulo `waived`, reporte honesto, primera llamada `WRAP_UP`, replanificación a módulo nuevo desde `WRAP_UP` y conservación de historial.
- Revisión de nueva evidencia/revisión y política expresa de invalidez y reapertura, sin reabrir módulos `closed` implícitamente.
- Migración de los **55 casos históricos** por garantía equivalente, diseño soportado de auth/SPA, saneamiento global de lint y diagnóstico del timeout Discovery.
- **VNEXT-014 NO-GO** y **VNEXT-015 no iniciado** hasta compuertas integrales de evidencia y seguridad.

### Resultado independiente R4-R7 (2026-11-05)

- **Código auditado:** `ea75eb2c52266b174e6d24917c1b089d56834900`; worktree aislado, Node 24.22.1/SQLite 3.53.4 FTS5, lockfile congelado y Chromium 153. Build 10 paquetes PASS; R4-R7-I01 1/1, entrevista **44/44**, Coverage **37/37**, Discovery **59/59** aislado y en integral, runner **71/71**, Stdio **18 herramientas + init** por servidor y CLI.
- **Tramo R4-R7 verificado:** propuesta sin autorización bloqueada; corrección v1→v2 cambia digest; decisión vieja rechazada; host independiente confirma el texto exacto, 1 requisito y 1 recibo, retry idempotente y segunda conexión SQLite exacta. Cobertura cambia de 0 a 1 requisito, 7 a 6 brechas, functional satisfecha y otras categorías unknown; cierre bloqueado, ejecución not_executed, lifecycle intacto y sin rules.yaml.
- **Matriz MCP:** **407 PASS / 55 FAIL de 462**. Mismas 55 identidades, 406 PASS comunes y una alta R4-R7-I01 aprobada. Lint focal solicitado **5 errores/0 warnings**, todos históricos de canonical-coverage-service (foco ampliado frente a R4-R6); global **34 errores/28 advertencias**, 62 diagnósticos idénticos. Discovery no reprodujo timeout, causa histórica sigue pendiente.
- **Hallazgo 014-R4-R7-A01 P1 preexistente:** declare_non_applicable regenera decided_at y sus digests al repetir la misma petición pendiente; una aprobación posterior del digest anterior devuelve closure_review_invalid sin writes. Afecta inbox desacoplado; no se observó bypass. Resolver antes de componer el siguiente P0. Detalles y sonda reproducible en [evidencia](auditorias/VNEXT-014-R4-R7/EVIDENCIA_INTEGRACION.md).
- **Dictamen:** R4-R7 propuesta/revisión/cobertura **PASS funcional acotado**; **VNEXT-014 NO-GO**, VNEXT-015 sin iniciar. Pendientes closed auténtico, decisiones independientes de aplicabilidad/cierre, segundo módulo waived, reporte canónico y replanificación; conservar E0a/E1/E2/E3/criterio 9 y los otros 50 casos. [Informe](auditorias/VNEXT-014-R4-R7/INFORME.md), [siguiente P0](auditorias/VNEXT-014-R4-R7/SIGUIENTE_BLOQUE_P0.md).
