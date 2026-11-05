# VNEXT-014-D-R4-R10 — Estabilización P1 tras auditoría R4-R9

Fecha: 2026-11-05. Rama exclusiva: `feat/qap-vnext-architecture`.
Entrada documental verificada: `05c0253b90c179612a166f1d98702efd14f99be7`.
Código auditado previamente por Codex: `09c9ce276c9c328026de4236dadf0a85d8e94d21`.
**Estado: auditoría física independiente ejecutada sobre e7d3717d9311ed73736568b13ce99e131d617453; P1 residual de lifecycle reproducido. VNEXT-014 sigue NO-GO.**

## Evidencia de partida

Codex auditó R4-R9 en worktree aislado: build 10 PASS; cinco R9 PASS; tres R8 PASS; Coverage 44 PASS/1 FAIL (escenario concurrente 4); entrevista 44/44; Discovery 59/59; runner 71/71; MCP 406 PASS/64 FAIL (55 históricos y 9 cambios de resultado: ocho fixtures Memory sin fence y uno SQLite concurrente); lint global 34 errores y 28 warnings, sin regresiones nuevas. Hallazgos R4-R9-A01 (FS P1), A02 (SQLite ruta relativa P1), A05 (accept_gaps P1 preexistente), A03 (reintento P2) y A04 (expiración P2). [Auditoría](auditorias/VNEXT-014-R4-R9/INFORME.md) y [reproducciones](auditorias/VNEXT-014-R4-R9/EVIDENCIA_CONCURRENCIA.md).

## Implementación de esta ronda

1. **R4-R9-A02 P1, identidad SQLite:** `SqliteKnowledgeAdapter` convierte rutas relativas a absolutas antes de abrir, ancla ruta real e identidad `dev:ino`, revisa identidad antes y después de adquirir `BEGIN IMMEDIATE` y falla cerrado ante archivo ausente/sustituido. Una cola FIFO por ruta real serializa consumidores locales sin bloquear el event loop con el busy_timeout de su propio titular; sigue existiendo bloqueo de escritores de otros procesos.
2. **R4-R9-A01 P1, lifecycle cooperativo:** `FileSystemStorage.withLifecycleFence` utiliza el mismo lock existente de `saveLifecycleState/updateLifecycleState`. Orden fijo: lifecycle → Knowledge → ClosureStore. Se adquiere después del gateway; no se retiene durante revisión humana. `CanonicalClosureService` mantiene el lock hasta commit y compara fingerprint completo del contexto dentro de la transacción de las cuatro acciones. Si falta contexto/identidad, bloquea.
3. **R4-R9-A05 P1, accept_gaps real:** la solicitud utiliza cobertura base sin recibo inventado, rechaza IDs ausentes/duplicados/ya aceptados y vincula el digest exacto a gaps y motivos. Tras la decisión independiente, y manteniendo los fences, evalúa la aceptación con `decisionId` real, comprueba invariantes y persiste razón + recibo en ClosureStore. La evaluación con recibo ocurre ANTES de abrir la transacción de ClosureStore para evitar reentrancia de su puerto.
4. **R4-R9-A03 P2 parcialmente abordado:** la cola SQLite elimina el bloqueo síncrono del propio event loop; falta demostrar concurrencia del cierre con resultado idempotente en la primera pareja de llamadas. No declarar reparada la garantía.
5. **R4-R9-A04 P2 no resuelto:** `expiresAt` todavía puede vencer después de la última comprobación y antes del COMMIT físico de ClosureStore. Es necesario un guard de expiración en frontera de commit o contrato explícito del instante de consumo con evidencia física.

## Regresiones publicadas (declaración previa; cinco PASS en auditoría inferior)

Cinco pruebas bajo Suite 3 de `canonical-coverage.test.ts`:
- A05 positiva: gap existente, gateway y aprobación real, aceptación exacta con razón/receipt y readback SQLite; negativa: ID desconocido y duplicado sin gateway ni writes.
- A01: escritura directa del filesystem antes del callback debe ser detectada por comparación de fingerprint (sin autorización); escritor que usa `FileSystemStorage` debe esperar al commit.
- A02: cambiar cwd no puede desplazar el fence ni crear otro archivo SQLite.

Se conservan los cinco R4-R9 y tres R4-R8 y todas las pruebas históricas. No se cambian esquemas, lockfile, credenciales, sesiones protegidas, main ni develop.

## Límites explícitos

El fence FS coordina únicamente escritores del host que utilizan `FileSystemStorage`. Edición externa directa, unlink/rename agresivo, fallos OS, NFS, symlinks/hardlinks y reemplazo a nivel de descriptor no quedan formalmente certificados. Las comprobaciones `realpath/dev/ino` mejoran la identidad pero no son transacción filesystem. Las dos bases SQLite y la proyección FS **no tienen atomicidad transversal**; recuperación tras crash todavía requiere el reconciliador y prueba independiente. La protección del vencimiento en el commit sigue pendiente. La sola publicación no acredita BUILD, PASS ni ausencia de nuevos fallos.

## Alcance solicitado para la auditoría (ejecutada; resultados abajo)

Codex debe verificar el HEAD remoto exacto de R4-R10 en worktree aislado, sin corregir código, y ejecutar: instalación congelada, build 10, test R4-R10, R4-R9, R4-R8, Coverage, Interview, Discovery, MCP integral comparado por identidad, runner, Stdio y ESLint focal/global. Incluir sondas adversariales:
- cambio de cwd, sustitución de ruta y misma base física;
- lifecycle/session/plan mutados por escritor oficial mientras se sostiene el lock, y por escritor externo no cooperante (delimitar garantía, cero autorización si cambio es detectado);
- `accept_gaps` gap existente, duplicado, ajeno, cambiado durante gateway, readback/recibo exacto y concurrencia;
- dos consumidores locales, dos procesos físicos, cierre/waiver competitivo, reintento idempotente, expiración después del callback y antes de COMMIT (A04 sigue abierta);
- cierres históricos, E0a/E1/E2/E3/criterio 9 y 55 fallos históricos, sin reemplazarlos ni debilitar expectativas.

Publicar informes directamente en `docs/vnext/auditorias/VNEXT-014-R4-R10/`, actualizar STATE/backlog/nota con resultados físicos y hacer commit **solo documental** a la rama. El usuario no transporta informes.

## Resultado independiente R4-R10 — auditoría publicada (2026-11-05)

- **SHA de código auditado:** e7d3717d9311ed73736568b13ce99e131d617453. Worktree aislado exacto; publicación exclusivamente documental en feat/qap-vnext-architecture. Esta publicación no toca main ni develop. [Informe](auditorias/VNEXT-014-R4-R10/INFORME.md).
- **Matriz física:** instalación congelada, Node 24.15.0/SQLite 3.51.3/FTS5 y build de diez paquetes PASS; cinco R4-R10, cinco R4-R9 y tres R4-R8 PASS; Coverage **49 PASS / 1 FAIL de 50**, Interview **44/44**, Discovery **59/59**, Runner **71/71** y Stdio **18 herramientas + qap_init**, servidor y CLI, PASS.
- **MCP integral:** **411 PASS / 64 FAIL de 475**. Las 470 identidades R9 conservan resultado: 406 PASS y 64 FAIL; cinco altas PASS, cero bajas y cero cambios de estado. Persisten los 55 históricos y nueve fallos adicionales R9: ocho fixtures MemoryKnowledgeStore sin fence y Scenario4 concurrente SQLite. [Diferencial exacto](auditorias/VNEXT-014-R4-R10/DIFERENCIAL_MCP.md).
- **ESLint:** global **34 errores / 28 advertencias**, focal ampliado **5 errores / 0 advertencias**. Los 62 diagnósticos globales son idénticos a R9; cero altas/bajas, L01 sigue corregido. Sin alterar expectativas ni supresiones. [Lint](auditorias/VNEXT-014-R4-R10/LINT.md).
- **A02: PASS condicionado para cwd y archivo estable en Windows.** La ruta relativa permanece vinculada a la base original; conexión y proceso independientes bloqueados durante fence y recuperables al liberar. Rename/unlink reales devolvieron EBUSY: desaparición/sustitución no alcanzadas físicamente, sin certificación universal por realpath/dev/ino ni atomicidad entre bases/FS.
- **A01: P1 residual R4-R10-A01 reproducido.** Escritores oficiales FileSystemStorage con distinta capitalización de la misma ruta Windows generan locks distintos; después del último fingerprint cambian sesión/plan y las cuatro acciones persisten autorización para contexto previo. Otro proceso usando updateLifecycleState reproduce el bypass. Con ruta idéntica sí hay exclusión y recuperación. Corregir identidad/namespace estable del lock, no solo releer contexto. [Reproducción, causa y propuesta](auditorias/VNEXT-014-R4-R10/EVIDENCIA_CONCURRENCIA.md).
- **A05: aceptación funcional acotada PASS.** Brecha existente real derivada por Coverage, propuesta base, motivo exacto, decisión correlacionada del gateway de fixture, receipt y readback SQLite; negativos de IDs inexistentes/duplicados, motivo cambiado, revisión/requisito nuevo y approvalId reutilizado sin nueva autoridad. No es aprobación humana ni certificación integrada. Retry ya aceptado bloquea sin duplicación; éxito idempotente pendiente de contrato (A06).
- **A03/A04 siguen abiertas.** Local waived+blocked/context_changed y Scenario4 FAIL, retry externo idempotente; un schedule multiproceso sí PASS no acredita todos los intercalados. Las cuatro ramas pueden consumir aprobación durable después de expiresAt al demorar tras callback. Definir consumo y guard final si se exige vigencia a commit. Cierres históricos R9 mantienen autoridad, recibos e historial; rollback probado conserva estado y libera locks.
- **Dictamen: VNEXT-014 NO-GO; VNEXT-015 no iniciado.** Corregir P1 y reconciliar garantías/matriz antes de certificar A closed+B waived+reporte fiel+WRAP_UP+replanificación auténticos. No se sembraron aprobaciones ni requisitos ficticios para certificar ese recorrido. [Siguiente bloque según evidencia](auditorias/VNEXT-014-R4-R10/SIGUIENTE_BLOQUE_P0.md).
