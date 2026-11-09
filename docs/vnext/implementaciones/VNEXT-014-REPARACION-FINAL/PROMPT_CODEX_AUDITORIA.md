# PROMPT PARA CODEX — Auditoría independiente focal de VNEXT-014

Actúa como **auditor de seguridad y QA independiente**. **NO modifiques código productivo, fixtures ni tests.** No implementes VNEXT-015. Tu tarea es reproducir, ejecutar, verificar físicamente y emitir dictamen con evidencia de la reparación publicada por ChatGPT.

## Repositorio, ramas e integridad

- Repositorio: `Hyouka73/QAMCP`
- Rama: `feat/qap-vnext-architecture`
- HEAD antes de iniciar la reparación: `7cfdefca9482b59d0c5606fb70d23903483373f3`
- **Último commit de fuentes/tests/contrato de la reparación:** `a05bfcc1e0981073a9fc6ac50ead68eeb2808cac`. Los commits documentales posteriores deben permanecer en la misma rama. Consultar `git rev-parse HEAD` y GitHub remoto antes de comenzar. En el informe registrar HEAD completo realmente auditado.
- Snapshot del informe adversarial previo: `e71818ac6fdaa1847e300a67bd4540fbfbd514c5`
- Último productivo de aquella auditoría: `4be066c794c1e83fa0b3e1b89d269094f7b7f68e`
- Referencias de fuente: `docs/vnext/implementaciones/VNEXT-014-REPARACION-FINAL/INFORME.md`, `docs/vnext/auditorias/VNEXT-014-RESCATE-CODEX/{HALLAZGOS_Y_REPRODUCCIONES.md,GO_NO_GO.md,INFORME.md,DIFERENCIAL_MCP.md}`, `AGENTS.md`, `docs/vnext/STATE.md` y `docs/vnext/04_BACKLOG_Y_WBS_PRELIMINAR.md`.

**Prohibiciones:** no cambios de código/tests, no edits de expectativas/skips/snapshots, no merge, no force-push, no checkout a develop/main/staging para modificar, no uso de credenciales reales ni sesión personal, no npm publish. Publicar solamente informes Markdown nuevos bajo `docs/vnext/auditorias/VNEXT-014-REPARACION-CODEX/`, sin sobrescribir el rescate anterior. Si un bug requiere un fix, documentar reproducción exacta y proponer cambio para ChatGPT, sin aplicar modificaciones. Marcar fixtures de gateway como sintéticos, nunca como aprobación humana auténtica.

## Estrategia de verificación: P1 primero, luego alcance proporcional

1. Confirmar commit/diff exacto entre `7cfdefca` y el HEAD de fuentes/tests `a05bfcc1`, y revisar el orden de locks lifecycle→Knowledge→Closure; descartar cualquier deadlock por consultas de reporte o reconciliación dentro del lock. Inspeccionar staging/rename, readback y errores MCP no JSON.
2. Instalar con lockfile congelado. Registrar SO/Node/pnpm/SQLite/FTS5/Chromium. Ejecutar diez builds y suites focalizadas. Si el entorno no permite ejecución, no declarar PASS.
3. Ejecutar y comparar el arnés adversarial **original** del rescate con las modificaciones actuales. No conformarse con unit tests nuevos ni mocks del handler. Conservar y adaptar solo rutas del arnés externo, no las fuentes del proyecto.
4. Verificar físicamente SQLite, filesystem, lifecycle.json, reporte, aprobación/recibo e historial antes/después; realizar reintentos sin una segunda aprobación; verificar procesos independientes de Node.
5. Ejecutar matriz MCP estable de un worker por identidad exacta y luego matriz con paralelismo predeterminado, registrando fallos adicionales E01 sin atribuirlos automáticamente al entorno.
6. Emitir tres dictámenes separados A/B/C y publicarlos en GitHub, con SHA final, commits, métodos, resultados y riesgos reproducibles.

## A01 P1 — escenarios exactos de reproducción

En un proyecto sintético con waiver duradero autorizado mediante gateway de fixture y recibo real, invocar `qap_session_close`. En el primer `query('requirement')` realizado por `sessionReport`, intercalar un writer **oficial** de `FileSystemStorage.updateLifecycleState` y esperar su COMMIT físico antes de dejar continuar la consulta original. Probar, sin mocks del resultado de `get`:
- Crear módulo `late` en estado `planned` y añadirlo al plan desde la misma instancia.
- Repetir desde otro **proceso Node independiente**.
- Sustituir concurrentemente `session.id` y comprobar que no cierra la nueva sesión con reporte viejo.
- Cambiar concurrentemente `phase` a `SCOPING` y comprobar que jamás responde `success/WRAP_UP` cuando el fichero sigue SCOPING.
- Forzar rechazo de `transitionProject` y comprobar que `success` es imposible.
- Fallo de escritura de reporte (EISDIR real), escritura parcial, excepción entre publicación del reporte y commit lifecycle y recuperación mediante retry **sin nueva aprobación** ni duplicar relación/historial.
- Control positivo sin carrera: un `waived` auténticamente durable (fixture legítimo de pruebas) debe permitir WRAP_UP y un reporte fiel; otro caso A `closed` + B `waived` y nueva sesión C; preservar Scenario 4 de TestHandler.

**Invariantes:** la identidad completa de la sesión, plan, módulos, fase e historial, `canExitWorking` final y aprobación deben corresponder a la transición física. Bloqueo contextual = sin nuevo reporte autoritativo ni éxito; fallo post-reporte/pre-commit = lifecycle WORKING y retry seguro. Ningún proceso puede alterar lifecycle entre validación bajo lock y commit final. Inspeccionar `report_path`, contenido, hash del lifecycle, `history` y recibos reales.

## A02 P1 — origen, destino, revisión, multiproceso

Con la misma decisión duradera, dejar que `reconcile()` lea el recibo válido. Antes de la lectura del reporte, realizar una verdadera transacción CAS de revisión sobre `Knowledge`, conservando `trace.reason=requestDigest` y `recorded_by/review`:
- `trace.source='wrong-provenance'`.
- `entity.target={kind:'module',id:'mod-catalog',revision:1}` en vez del application target autorizado.
- Revisión alterada de recibo y de módulo/app, cuando el modelo permita representar el error; distinguiendo commits rechazados por Knowledge de los que `sessionReport` debe detectar.
- Fuente alterada desde conexión SQLite de proceso Node independiente.
- Cambio durante las lecturas de `sessionReport` mientras transcurre el cierre.
- Recibo ausente o procedencia, scope o digest incorrectos; recibo original válido; retry válido sin duplicación.

Esperado: ningún cierre o reporte de autoridad sobre recibos alterados. Comparar campos originales y finales, tanto `reconcile` como proyección, revision sellada del recibo, lock adquirido/soltado y reacción de `session_close` ante errores MCP. No afirmar transacción ACID multi-store.

## A03 y L01 — verificaciones P2

`existing-only`: crear fichero Knowledge SQLite de **cero bytes** y otro esquema v1 provisionado en fixtures. Comprobar que `loadHostComposition` rechaza **antes** de migrar/crear tablas; comparar tamaño, bytes completos/SHA-256, `PRAGMA user_version`, `application_id`, `sqlite_master`, existencia de sidecars WAL/SHM, estados de archivo inicial/final. Verificar positivo v2 y negativos corrupt/foreign. No modificar un archivo de BD real.

`ESLint`: ejecutar focal sobre estos archivos:
- `packages/mcp/src/handlers/canonical-closure-service.ts`
- `packages/mcp/src/handlers/canonical-session-report.ts`
- `packages/mcp/src/host-composition.ts`
- `packages/mcp/src/server.ts`
- `packages/knowledge/src/storage/file-storage.ts`
- tests nuevos de `canonical-coverage.test.ts` y `host-composition.test.ts`.

Comparar identidad de diagnósticos con baseline global 39 errores/28 warnings: 34/28 históricos + cinco nuevos (en snapshot previo). Requiere **cero altas** de lint en fuentes/tests tocados; no bajar contadores mediante supresiones. Distinguir fix real de cambio de línea/columna.

`A04-W01`: reproducir wrapper que procesa `transaction` desde `setInterval` creado antes de `execute`, sin contexto ALS, tras `expiresAt+40ms`, y el control con `AsyncLocalStorage.snapshot`. Determinar qué composición usa el adaptador concreto y cuáles wrappers están excluidos expresamente del contrato; si es posible usar un decorador arbitrario con las APIs oficiales, no afirmar garantía universal. Documentar si permanece bypass condicionado, sin modificar código.

## Paralelismo E01 y matriz completa

Baseline independiente antes de la reparación: MCP con un worker `423 PASS / 63 FAIL / 486` (55 históricos + 8 Memory). Registro de paralelismo anterior: `360/67/427` primera corrida parcial (Discovery no inició), `413/73/486` y `418/68/486`. Comparar por **ruta real de archivo + fullName exacto**; clasificar PASS→FAIL, FAIL→PASS, nuevos y desaparecidos, sin equiparar las 63 identidades a 63 regresiones recientes.

E01: investigar y registrar temporal compartido, errores UNKNOWN de importación, timeout de 5s/30s, finalización incompleta de procesos, eliminación del fixture con tareas vivas, `ENOENT/ECOMPROMISED` de locks y `EPERM` rename de lifecycle en Windows, diferencias de captura de errores JSON vs texto. No aumentar timeouts indiscriminadamente ni borrar pruebas; si hay una causa real de regresión productiva, reproducirla focalmente.

No ejecutar cientos de permutaciones ya certificadas salvo que el diff cambie la frontera de seguridad. Las 63 identidades previas deben tener tratamiento por grupo con criterio de WBS: defecto productivo, legacy sustituido, fixture incompatible, bloqueo seguro, integración, paralelismo/entorno; separar impedimentos para desarrollo DAG de impedimentos al cierre integral/merge.

## Comandos sugeridos (adaptar a ambiente real, registrar exit codes)

```powershell
git fetch origin feat/qap-vnext-architecture
git rev-parse HEAD
git status --porcelain
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm build
pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-coverage.test.ts src/__tests__/host-composition.test.ts --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/mcp exec vitest run --maxWorkers=1 --reporter=json --outputFile=../../node_modules/vnext014-audit-mcp-serial.json
pnpm --filter @qap/mcp test
pnpm --filter @qap/playwright-runner test
pnpm exec eslint packages/mcp/src/server.ts packages/mcp/src/host-composition.ts packages/mcp/src/handlers/canonical-closure-service.ts packages/mcp/src/handlers/canonical-session-report.ts packages/knowledge/src/storage/file-storage.ts packages/mcp/src/__tests__/canonical-coverage.test.ts packages/mcp/src/__tests__/host-composition.test.ts
pnpm lint
node scripts/test-mcp-stdio.mjs
```

Si el workspace o configuración no admite una opción, documenta la sustitución equivalente, sin inventar salidas. Evitar ejecutar Stdio en carpetas personales, pues el script crea `mcp-live-test`; usar fixture y limpiar residuos seguros. Añadir, cuando proceda, `pnpm --filter @qap/engine test`, `pnpm --filter @qap/knowledge test`, `pnpm --filter @qap/mcp exec vitest run src/__tests__/test-handler.test.ts --maxWorkers=1`, coverage/entrevista/discovery y sus comandos focales oficiales.

## Decisiones obligatorias independientes

**A — GO técnico P1:** solo cuando cada reproducción original A01/A02 y los nuevos casos positivos/negativos ejecutados pase con lectura física reproducible, sin nuevos P0/P1, deadlocks ni falsos WRAP_UP. De lo contrario NO-GO y defectos específicos.

**B — GO desarrollo aislado VNEXT-015:** evaluar `ImpactAnalyzer` del DAG: dependencias WBS `VNEXT-003` y `VNEXT-009` históricamente listas. Verificar que no requiere `qap_session_close`/`TestHandler`/`ReportHandler` ni resultados falsos de VNEXT-014, y definir rama separada `feat/qap-vnext-015-impact-analyzer` desde SHA de vNext verificado, con suites focales Engine/Knowledge; **no implementarlo**. Declarar GO condicional o NO-GO con evidencia.

**C — GO completo para cerrar VNEXT-014/merge a develop:** solo si TODOS los criterios WBS, 63 garantías conciliadas, aceptación humana real, seguridad y E2E están satisfechos. Un GO A o B nunca implica GO C. Nunca fusionar sin autorización explícita.

## Entregables documentales

Crear `docs/vnext/auditorias/VNEXT-014-REPARACION-CODEX/INFORME.md` y, si ayuda, `RESULTADOS.md` y `GO_NO_GO.md` con:
- SHA fuente y HEAD auditado, commits y diff, entorno, comandos y códigos.
- Tabla caso por caso de A01/A02 con expected/observed, evidencia SQLite/filesystem/StdIO y hashes de reportes.
- Estado A03, lint focal/global y A04, E01.
- Matriz completa MCP por identidad frente a 423/63 y las altas nuevas, negativos positivos, regresiones P0/P1.
- Dictámenes A/B/C independientes, riesgos restantes, bloqueos concretos y acción mínima propuesta.
- Estado worktree, archivos documentales añadidos y HEAD tras publicarlos. No modificar `STATE.md`/WBS ni fuentes/tests en este chat; las notas del auditor se crean por separado y se referencian en informe.

**No me devuelvas solo un análisis en chat.** Ejecuta auditoría con pruebas reales, publica el informe en GitHub y proporciona SHA final/dictámenes. Cuando no puedas ejecutar un caso, identifica exactamente por qué y deja `NOT_RUN`: nunca PASS inventado.
