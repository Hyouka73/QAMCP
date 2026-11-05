# VNEXT-014-D-R4-R6 — Continuidad de entrevista canónica desde qap_status

**Fecha de registro:** 2026-11-04  
**Rama exclusiva:** `feat/qap-vnext-architecture`  
**Base física auditada:** `f531e4e6b444c06ad85fd1f5f533837fd3467145` (R4-R5)  
**Commit documental de Codex R4-R5:** `be35ae4354facd7780befb57e58d31af1eebd09e`  
**Estado R4-R6:** código y regresión publicados, **sin compilación ni ejecución independiente nueva**. VNEXT-014 **NO-GO**.

## 1. Resultado R4-R5 certificado antes de estos cambios

Codex entregó su informe directamente en GitHub: [Auditoría R4-R5](auditorias/VNEXT-014-R4-R5/INFORME.md) y [Clasificación individual de 55 fallos](auditorias/VNEXT-014-R4-R5/CLASIFICACION_55_FALLOS.md).

Windows x64 / Node 24.15.0 / SQLite FTS5 3.51.3 / pnpm 11.3.0 / Chromium 153; build 10 paquetes PASS; R4-R5-A02 3/3 PASS; coverage 37/37; discovery 59/59; MCP integral **405 PASS / 55 FAIL (460 pruebas)**; runner 71/71; Stdio 18 tools y `qap_init` PASS; ESLint focal 0; global **34 errores / 28 warnings**.

El bug del módulo 17 de R4-R4-A02 quedó **resuelto y verificado** con 16 aprobaciones, 17 aprobaciones y el caso con aprobación ausente en módulo 17. No existen nuevos fallos en el diferencial R4-R5. Los 55 históricos se mantienen por identidad y la integración del flujo lifecycle sigue siendo P0.

## 2. Por qué se inicia R4-R6

La clasificación individual de Codex muestra un bloqueo de integración transversal: la suite histórica espera `qap_discover` → reglas YAML e `entrevista_vista` legacy; el flujo canónico separa adquisición (observaciones SQLite), entrevista (`CanonicalInterviewService`), `ExpectedRequirement` confirmado solo por gateway del host y cobertura/cierre con autorización independiente.

El caso lifecycle E0a (línea histórica 140) recibió `siguiente_accion.tipo='trabajo'` donde el test antiguo esperaba una pregunta legacy. Esto **no significa** que deba fabricarse `rules.yaml` ni una entrevista confirmada a partir de crawler. La garantía equivalente a acreditar primero es continuidad real de preguntas pendientes por `qap_status` → `qap_rules_set.canonical_interview`, sin salto de autoridad ni escritura implícita. E1/E2/E3 y la cadena completa quedan para bloques posteriores.

## 3. Implementación publicada (no auditada físicamente)

**`packages/mcp/src/handlers/status.handler.ts`:**

- Solo durante la fase WORKING, se inspecciona `CanonicalInterviewService.status(module)` de los enlaces visibles del host; **no** se llama a `execute({action:'next'})` al consultar estado.
- Solo si el host reporta `availability='general_questions_available'`, `pending_questions` numérico mayor que cero y el módulo **no** tiene cierre canónico terminal, se prepara `pendingCanonicalInterview`. Estados `blocked/unavailable`, ausencias o módulos cerrados no se convierten en preguntas.
- `qap_status` recomienda `siguiente_accion` de tipo `trabajo`, `tool='qap_rules_set'`, con módulo exacto y `canonical_interview:{action:'next'}`. El siguiente uso real de la herramienta devuelve la pregunta/versión existente en el contexto canónico. No afirma que la respuesta esté validada ni que el host haya aprobado un requisito.
- Se conserva la protección anterior contra recomendar `qap_session_close` con cierre durable inválido, el inventario acotado a 16 y la verificación de **todos** los vínculos para la compuerta de cierre.
- A falta de preguntas pendientes, el guidance legacy no se altera: no hay entrevista inventada, requisito confirmado ni aprobación automática.

**`packages/mcp/src/guidance.ts`:** `SiguienteAccion` tipa explícitamente el parámetro seguro `canonical_interview?:{action:'next'}`. No se introducen argumentos de aprobación, `from_option` o `user_confirmed`, ni se modifica el esquema del almacenamiento.

## 4. Regresión física creada y pendiente

Se añadió `R4-R6-I01: qap_status resumes a real pending canonical question without YAML, approval or state mutation` a `packages/mcp/src/__tests__/canonical-interview.test.ts`.

La prueba crea un fixture autorizado en SQLite, asocia observaciones y evidencia mediante `ModuleObservationBridge`, abre pregunta canónica con `qap_rules_set.canonical_interview.action=next` por el SDK MCP y posteriormente pide `qap_status`.

Aserciones exigidas:

1. Antes de abrir la pregunta, status **no** contiene `canonical_interview` ficticia.
2. Una vez abierta, status recomienda exactamente `qap_rules_set`/módulo `catalog`/`canonical_interview:{action:'next'}`, explicando que necesita revisión humana independiente y con `coverage='not_certified'`.
3. Consultar status dos veces es estable y no cambia el conteo pendiente. La llamada explícita a `qap_rules_set` recupera **el mismo ID y versión** de pregunta.
4. Lifecycle byte a byte, relaciones y `ExpectedRequirement` permanecen intactos tras status/next; el inbox del gateway no recibe solicitudes de revisión; no existe `rules.yaml`.

Esta prueba **no ha sido ejecutada** sobre el nuevo HEAD. Sobre el baseline MCP R4-R5 había 460 pruebas, de las cuales 405 pasaban. Este bloque agrega una nueva; las cifras finales deben ser **medidas**, nunca extrapoladas.

## 5. Límite explícito del alcance y secuencia P0

Esto **no** convierte E0a del legado en PASS por modificar su expectativa, ni acredita cierre `closed` con cobertura auténtica. La siguiente secuencia tiene dependencias:

- **R4-R6:** asegurar que status reanuda pregunta canónica ya emitida, con identidad/versión y sin mutaciones implícitas; reejecutar las pruebas reales.
- **Siguiente bloque P0 (pendiente):** validación de propuesta/corrección y autorización host, estado confirmado real en IKnowledgeStore, persistencia de versiones y guía a siguiente pregunta/cobertura; añadir prueba E2E sin YAML.
- **Posterior:** cierre `closed` con cobertura auténtica, waiver para otro módulo, reporte WRAP_UP, replanificación SCOPING y composición del criterio 9.
- **Después:** migrar por garantía las 55 suites legacy, decidir alcance explícito de auth/SPA, resolver lint global y falsos positivos/negativos sin debilitar reglas.

La clasificación [CLASIFICACION_55_FALLOS.md](auditorias/VNEXT-014-R4-R5/CLASIFICACION_55_FALLOS.md) es el inventario y la secuencia de fuente para estas tareas. Ni los rechazos seguros ni la ausencia de archivos legacy constituyen evidencia de un positivo canónico equivalente.

## 6. Auditoría obligatoria y publicación en el repositorio

Codex debe auditar el SHA exacto de código de R4-R6 usando el worktree aislado y Node 24/SQLite FTS5; instalar con lockfile congelado, verificar build 10 paquetes, los tests focales de `canonical-interview`, `canonical-coverage`, `discovery-handler`, MCP serial, runner, lint focal/global y Stdio 18 con `qap_init`. Confirmar que no existe regresión en autorización, cierres de 17 módulos ni persistencia.

Comandos orientativos:

```powershell
pnpm build
pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-interview.test.ts -t 'R4-R6-I01' --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-interview.test.ts --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-coverage.test.ts --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/mcp exec vitest run src/__tests__/discovery-handler.test.ts --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/mcp exec eslint src/handlers/status.handler.ts src/guidance.ts src/__tests__/canonical-interview.test.ts
pnpm --filter @qap/mcp exec vitest run --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/playwright-runner exec vitest run --maxWorkers=1 --reporter=verbose
pnpm lint
```

**Publicación obligatoria:** Codex actualiza `docs/vnext/014D_R4_R6_CONTINUIDAD_ENTREVISTA_CANONICA.md`, `docs/vnext/STATE.md` y `docs/vnext/04_BACKLOG_Y_WBS_PRELIMINAR.md`; publica informes con comandos, resultado integral, diferencial, lint y evidencia de continuidad bajo `docs/vnext/auditorias/VNEXT-014-R4-R6/`. Commit/push **solo documental** en `feat/qap-vnext-architecture`, con SHA de código auditado distinto del commit documental. Sin tocar `main/develop`, SQLite v2, credenciales, sesiones protegidas o producción.

**Criterio de resultado:** R4-R6 **NO CERTIFICADA** hasta ejecución; VNEXT-014 **NO-GO** mientras persistan las garantías históricas y lint global. No iniciar VNEXT-015.
