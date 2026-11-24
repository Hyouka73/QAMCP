# Informe de Investigación y Arquitectura AV-04: Veracidad funcional, oráculos, E2E, datos mutativos y recuperación

**Autor:** Gemini Neon (Investigador Principal y Arquitecto de QAP)

**Dirección:** Orquestador Principal

**Repositorio y rama:** `Hyouka73/QAMCP` · rama `develop`

**SHA de referencia auditado:** `979f30247b74597f236e7e5c4fa8ad7ccfcc8eb8`

**Fecha:** 24 de noviembre de 2026

**Alcance exclusivo:** AV-04 (`AR-08`, `AR-09`, `AR-10`, `AR-43`, `AR-53`), con entrega vinculante de la tabla definitiva de agregación, precedencias y códigos de salida para `AR-52` y `AR-05` (AV-03) y contrato de oráculos de datos/cálculos hacia AV-05.

**Restricciones respetadas:** Solo lectura, investigación y diseño contractual. Sin implementación de código, sin modificaciones en GitHub, sin ejecución de experimentos, sin ramas/worktrees, sin G0/G1, sin WBS, sin acceso a sistemas empresariales y sin ratificar `DE-01`–`DE-05` ni umbrales comerciales.

## 1. Dictamen específico de AV-04 y resumen ejecutivo

**Dictamen de diseño AV-04:** **Contratos y arquitectura definidos para decisión del Orquestador y contravalidación independiente de Codex; AV-04 permanece abierto para implementación y certificación.** No se declara aprobación global del producto ni se cierran compuertas experimentales (`E3`, `E4`, `E5`, `E7`, `E8`).

La auditoría estática del código vigente en `979f30247b74597f236e7e5c4fa8ad7ccfcc8eb8` confirma que la base actual **no sostiene ninguna de las cinco garantías críticas de AV-04**:

1. **Taxonomía y salidas (`AR-08` / `AR-52`):** `packages/cli/src/commands/test.ts` ([L206–L230](https://www.google.com/search?q=https://github.com/Hyouka73/QAMCP/blob/979f30247b74597f236e7e5c4fa8ad7ccfcc8eb8/packages/cli/src/commands/test.ts%23L206-L230)) reporta `passed` y `exitCode = 0` cuando `failed === 0`, incluso con cero casos ejecutados o todos en `not_run`; contradice a `packages/playwright-runner/src/runner.ts` ([L1098–L1105, L1161–L1170](https://www.google.com/search?q=https://github.com/Hyouka73/QAMCP/blob/979f30247b74597f236e7e5c4fa8ad7ccfcc8eb8/packages/playwright-runner/src/runner.ts%23L1098-L1105)), que marca `total === 0` como `failed`. Además, `packages/cli/src/errors.ts` ([L19–L29](https://www.google.com/search?q=https://github.com/Hyouka73/QAMCP/blob/979f30247b74597f236e7e5c4fa8ad7ccfcc8eb8/packages/cli/src/errors.ts%23L19-L29)) reserva `USAGE = 2` y `GENERAL_ERROR = 1`, colisionando con tablas históricas que asignaban `2` a errores de campaña.
2. **Falsos `PASS` e independencia de testigos (`AR-09`):** `navigate.ts` ([L12–L18](https://www.google.com/search?q=https://github.com/Hyouka73/QAMCP/blob/979f30247b74597f236e7e5c4fa8ad7ccfcc8eb8/packages/playwright-runner/src/actions/navigate.ts%23L12-L18)) descarta el objeto `Response` de `page.goto` (ignorando HTTP 4xx/5xx); `runner.ts` ([L1345–L1388](https://www.google.com/search?q=https://github.com/Hyouka73/QAMCP/blob/979f30247b74597f236e7e5c4fa8ad7ccfcc8eb8/packages/playwright-runner/src/runner.ts%23L1345-L1388)) captura excepciones de `screenshot` y devuelve `status: 'passed'`; `assert.ts` ([L24–L180](https://www.google.com/search?q=https://github.com/Hyouka73/QAMCP/blob/979f30247b74597f236e7e5c4fa8ad7ccfcc8eb8/packages/playwright-runner/src/actions/assert.ts%23L24-L180)) asume `'visible'` por defecto sin metadatos de independencia causal; `execution-evidence.ts` ([L51–L67](https://www.google.com/search?q=https://github.com/Hyouka73/QAMCP/blob/979f30247b74597f236e7e5c4fa8ad7ccfcc8eb8/packages/mcp/src/handlers/execution-evidence.ts%23L51-L67)) devuelve `true` cuando `executed.length === 0`, acopla la validez indefinida a la presencia física de `[invalid URL]` en disco y no exige `witness_independence_level`.
3. **Mutaciones, reintentos y limpieza (`AR-10`):** `cli/commands/test.ts` ([L182–L204](https://www.google.com/search?q=https://github.com/Hyouka73/QAMCP/blob/979f30247b74597f236e7e5c4fa8ad7ccfcc8eb8/packages/cli/src/commands/test.ts%23L182-L204)) reintenta ciegamente casos fallidos sin idempotencia ni reconciliación previa; `mcp/handlers/test.handler.ts` ([L488–L496](https://www.google.com/search?q=https://github.com/Hyouka73/QAMCP/blob/979f30247b74597f236e7e5c4fa8ad7ccfcc8eb8/packages/mcp/src/handlers/test.handler.ts%23L488-L496)) bloquea toda mutación en proyectos vinculados sin distinguir QA autorizado; `auth/scoped-browser.ts` ([L4–L35](https://www.google.com/search?q=https://github.com/Hyouka73/QAMCP/blob/979f30247b74597f236e7e5c4fa8ad7ccfcc8eb8/packages/auth/src/scoped-browser.ts%23L4-L35)) limita el modo solo-lectura al método HTTP (`GET`/`HEAD`) y origen; y `interpolator.ts` ([L1–L52](https://www.google.com/search?q=https://github.com/Hyouka73/QAMCP/blob/979f30247b74597f236e7e5c4fa8ad7ccfcc8eb8/packages/playwright-runner/src/context/interpolator.ts%23L1-L52)) solo sustituye strings sin `TestDataManager` ni `DataPlan`.
4. **Flujos E2E multirol y multimódulo (`AR-43`):** `runner.ts` ([L463, L542](https://www.google.com/search?q=https://github.com/Hyouka73/QAMCP/blob/979f30247b74597f236e7e5c4fa8ad7ccfcc8eb8/packages/playwright-runner/src/runner.ts%23L463)) reutiliza un único `BrowserContext` y una única `Page` para todos los casos de un módulo; `flow-orchestrator.ts` ([L368–L425](https://www.google.com/search?q=https://github.com/Hyouka73/QAMCP/blob/979f30247b74597f236e7e5c4fa8ad7ccfcc8eb8/packages/engine/src/flow-orchestrator.ts%23L368-L425)) itera pasos linealmente ignorando `depends_on` y `execution_timeout_ms`, usa `sharedVariables: Record<string, string>` sin tipado y solo respalda sesiones locales.
5. **Reglas de negocio, RBAC y cálculos (`AR-53`):** `case-execution-policy.ts` ([L4–L15](https://www.google.com/search?q=https://github.com/Hyouka73/QAMCP/blob/979f30247b74597f236e7e5c4fa8ad7ccfcc8eb8/packages/playwright-runner/src/case-execution-policy.ts%23L4-L15)) bloquea incondicionalmente las categorías `bva`, `rbac_negative`, `intercept_network` y `switch_auth`; `scoped-rule-resolver.ts` ([L14](https://www.google.com/search?q=https://github.com/Hyouka73/QAMCP/blob/979f30247b74597f236e7e5c4fa8ad7ccfcc8eb8/packages/mcp/src/application/scoped-rule-resolver.ts%23L14)) declara el tipo `'text'` que `assert.ts` rechaza como no soportado; y no existe aritmética decimal exacta, política de redondeo ni integración con el contexto regional de `AR-45`.

## 2. Resolución AR-08 y contrato vinculante de AR-52 / AR-05: Taxonomía definitiva, agregación y salidas MCP/CLI/CI

**Registros cubiertos:** `AR-08` (Crítica · BLOQUEANTE) y entrega contractual definitiva para `AR-52` y `AR-05` (AV-03).

**Requisitos afectados:** `REQ-ORA-001.1`, `REQ-ORA-001.2`, `REQ-ORA-001.3`, `REQ-RUN-001.3`, `REQ-INT-001.1`, `REQ-CAM-001.3`, `D12`, `D19`, `D21`.

### 2.1 Contraste de propuestas previas y evidencia de código

* **Propuesta histórica de Neon (`auditoria-neon.md` §6.E):** Introducía `PASS_STRUCTURAL` como séptimo veredicto, rompiendo `REQ-ORA-001.1` (taxonomía cerrada de exactamente 6 valores). **Se descarta `PASS_STRUCTURAL` como veredicto.**
* **Propuesta histórica de Antigravity (`[invalid URL]` O-05 e `[invalid URL]` AR-52):** Mantuvo 6 veredictos, pero (a) asignó el código CLI `2` a `ERROR` colisionando con `ExitCode.USAGE = 2` ([`errors.ts:22`](https://www.google.com/search?q=https://github.com/Hyouka73/QAMCP/blob/979f30247b74597f236e7e5c4fa8ad7ccfcc8eb8/packages/cli/src/errors.ts%23L22)), (b) devolvió `PASSED` / `exitCode = 0` para campañas puramente estructurales (`structural_only: true`), violando `D12`/`D21` y la Enmienda AV-03 de `AR-52`, y (c) omitió precedencias para `PASS + SKIPPED obligatorio`, `PENDING_CLEANUP`/`CLEANUP_UNKNOWN`, `FAIL + CLEANUP_FAILED/TAMPERED`, pausa, cancelación y ACK asíncrono. **Se retira esa tabla y se reemplaza íntegramente por el contrato siguiente.**

### 2.2 Modelo normativo de cuatro ejes, seis veredictos y atributos ortogonales

Cada intento de ejecución (`AttemptOutcome`) se representa mediante una estructura inmutable producida exclusivamente por el núcleo compartido (`@qap/core`), nunca por adaptadores MCP o CLI:

| Dimensión | Valores cerrados permitidos | Regla normativa |
| --- | --- | --- |
| **`technical_status`** (Eje 1) | `OK`, `HTTP_ERROR`, `NAV_ERROR`, `TIMEOUT`, `CRASH`, `ABORTED`, `NOT_EXECUTED` | Describe exclusivamente el resultado mecánico/transporte. `OK` jamás implica `PASS` funcional. `NOT_EXECUTED` aplica cuando el intento fue omitido o bloqueado antes de invocar el runner. |
| **`functional_verdict`** (Eje 2 · 6 valores exactos) | `PASS`, `FAIL`, `INDETERMINATE`, `BLOCKED`, `SKIPPED`, `ERROR` | Taxonomía cerrada única en intento, caso, flujo, campaña, MCP, CLI y reportes. Prohibido añadir un séptimo valor. |
| **`cleanup_status`** (Eje 3) | `NOT_REQUIRED`, `CLEANED`, `COMPENSATED`, `CONFINED`, `PENDING_CLEANUP`, `CLEANUP_UNKNOWN`, `CLEANUP_FAILED` | Eje independiente. Se distingue explícitamente `CLEANUP_UNKNOWN` (corte/pérdida de testigo de limpieza) de `PENDING_CLEANUP` (limpieza programada o bloqueada por permiso expirado) y `CLEANUP_FAILED` (fallo acreditado al revertir/compensar). |
| **`evidence_health`** (Eje 4 · desdoblado en origen y verificación actual) | `COMPLETE`, `DEGRADED_AUXILIARY`, `SUPPRESSED_BY_POLICY`, `EXPIRED_PRUNED`, `MISSING_REQUIRED`, `LOST_OR_TAMPERED` | Separar `origin_evidence_health` (inmutable al sellar el intento) de `current_evidence_health` (evaluado al leer/exportar). Ver §2.3. |
| **`verification_scope`** (Ortogonal) | `STRUCTURAL`, `FUNCTIONAL_EFFECT`, `CROSS_CONCILIATED`, `NONE` | Sustituye a `PASS_STRUCTURAL`. Una comprobación solo de UI/lectura produce `functional_verdict = PASS` + `verification_scope = STRUCTURAL` + `witness_independence_level = N1`. |
| **`witness_independence_level`** (Ortogonal) | `N0`, `N1`, `N2`, `N3`, `NONE` | Acreditado por la rúbrica causal de `AR-09`, no por nombre de canal. |
| **`obligation_class`** (Ortogonal) | `REQUIRED`, `OPTIONAL`, `DIAGNOSTIC` | Distingue obligaciones contractuales del plan de tareas auxiliares. |
| **`skip_reason_class`** (Ortogonal, solo si `SKIPPED`) | `NOT_APPLICABLE_ACCREDITED`, `AUTHORIZED_EXCLUSION`, `REQUIRED_OMITTED` | Permite diferenciar con precisión cero ambigüedad una no-aplicabilidad acreditada (`REQ-CAS-001.4`) de una obligación omitida. |
| **`operational_state`** (Nivel campaña/flujo, ortogonal) | `ACCEPTED_ASYNC`, `RUNNING`, `PAUSED`, `CANCEL_REQUESTED`, `CANCELLED`, `BUDGET_EXHAUSTED`, `PARTIALLY_COMPLETED`, `COMPLETED` | El estado operativo nunca sustituye al veredicto funcional. Un ACK asíncrono (`ACCEPTED_ASYNC`) o ejecución en curso jamás produce éxito funcional. |
| **`attestation_state`** (Ortogonal, alineado con `AR-28`) | `ATTESTED_STRONG`, `ATTESTED_LOCAL`, `UNATTESTED`, `INVALID_ATTESTATION` | `INVALID_ATTESTATION` o `UNATTESTED` en una ruta que exige acreditación fuerza resultado de integridad no exitoso. |

### 2.3 Reglas de salud de evidencia e inmutabilidad histórica (`D19` / `AR-08` / `AR-52`)

1. **`MISSING_REQUIRED` en origen:** Si falta evidencia necesaria para evaluar el oráculo al momento de cerrar el intento, el evaluador **prohíbe `PASS**` y emite `INDETERMINATE` (si la causa es insuficiencia probatoria/testigo) o `ERROR` (si falló el mecanismo de captura requerida).
2. **`SUPPRESSED_BY_POLICY` en origen:** Si una media (WebM/PNG/traza) fue suprimida por política `MANDATORY_SUPPRESSION` o cuota crítica (`AR-25`/`AR-27`):
* Si el oráculo acreditado **no** dependía de esa media (p. ej. testigo API/DOM saneado o conciliación de datos), se preserva el `functional_verdict` acreditado con `evidence_health = SUPPRESSED_BY_POLICY`.
* Si el oráculo **sí** dependía de esa media (p. ej. verificación visual), no puede emitir `PASS` y emite `BLOCKED` (por política de captura) o `INDETERMINATE` según causal.


3. **`EXPIRED_PRUNED` posterior (inmutabilidad histórica):** Cuando la poda autorizada (`D19`) o revocación de `retain` (`AR-25`) elimina payloads físicos pesados después de sellar el intento:
* `origin_evidence_health` y `functional_verdict` histórico atestado **permanecen inmutables** (nunca se cambia un `PASS`/`FAIL` histórico a `INDETERMINATE` ni `ERROR`).
* `current_evidence_health` transiciona a `EXPIRED_PRUNED` acompañado de `prune_event_id`, `pruned_at` y los hashes SHA-256 históricos preservados. La consulta histórica informa `verifiable_payload_available: false` sin invalidar el veredicto histórico.


4. **`LOST_OR_TAMPERED` posterior:** Si al verificar integridad en lectura, reporte o exportación un archivo no podado desapareció o su hash/firma difiere en 1 byte del manifiesto atestado:
* El registro histórico original se conserva intacto para auditoría forense (`origin_functional_verdict`), pero `current_evidence_health` pasa a `LOST_OR_TAMPERED`, `attestation_state` pasa a `INVALID_ATTESTATION` y cualquier agregación o certificación actual queda invalidada (`INTEGRITY_OR_ATTESTATION_ERROR`, nunca éxito).



### 2.4 Agregación jerárquica: Intento → Caso → Flujo → Campaña

1. **Intento (`AttemptOutcome`):** Unidad atómica con `attempt_id`, `attempt_seq`, `lease_epoch`, `plan_snapshot_digest`, los 4 ejes, atributos ortogonales y sobre de atestación (`AR-28`).
2. **Caso (`CaseOutcome`):** Agrega los intentos de un mismo `case_identity_id` dentro de una revisión de campaña:
* El **veredicto funcional efectivo** del caso corresponde al **último intento atestado válido y admitido por política de reintento** (recordando `AR-10`: prohibido reintentar mutaciones inciertas sin reconciliación).
* **Conservación obligatoria de fallos previos (`AR-46`):** Todos los intentos previos (`FAIL`, `ERROR`, `INDETERMINATE`) permanecen visibles en `attempts[]` y en `historical_failure_detected: boolean` (para detección de *flakiness* en estratos comparables).
* **Agregación de limpieza del caso (`case.cleanup_status`):** Peor estado entre **todos** los intentos del caso que produjeron efectos mutativos, según precedencia estricta: `CLEANUP_FAILED` > `CLEANUP_UNKNOWN` > `PENDING_CLEANUP` > `CONFINED` > `COMPENSATED` > `CLEANED` > `NOT_REQUIRED`. Un reintento posterior limpio **no borra** un `CLEANUP_FAILED` o `PENDING_CLEANUP` de un intento previo mientras ese residuo no haya sido reconciliado y cerrado con testigo.
* **Agregación de integridad del caso (`case.current_evidence_health`):** `LOST_OR_TAMPERED` en cualquier intento requerido contamina el caso con `LOST_OR_TAMPERED`.


3. **Flujo (`FlowOutcome`):** Agrega los casos y pasos de preparación/limpieza de un flujo E2E (`AR-43`):
* Aplica la misma función pura de precedencia que la campaña sobre el subconjunto de casos del flujo + sus operaciones de `DataPlan` (preparación y limpieza de flujo).
* Si un fallo de preparación impide ejecutar los casos del flujo, el flujo registra `failure_locus = PREPARATION_FAILURE`, casos dependientes en `BLOCKED` (o `ERROR` si falló el mecanismo) y nunca `PASSED_FUNCTIONAL`.


4. **Campaña (`CampaignOutcome`):** Función pura y total `aggregateCampaign(campaignState, cases[], dataPlanOps[])` ejecutada únicamente en `@qap/core`.

### 2.5 Tabla total y mutuamente excluyente de agregación y códigos CLI/CI (`AR-08` + `AR-52`)

Para garantizar que **no exista ninguna colisión** entre errores de invocación CLI (`packages/cli/src/errors.ts`: `1` = error no controlado de proceso, `2` = `USAGE`, `65–78` = `sysexits.h`), estados operativos/asíncronos y resultados finales de campaña, se establece el esquema **`exit_code_schema_version: "2.0"`** con **clases numéricas estrictamente disjuntas**.

**Orden de precedencia estricto (evaluado de arriba hacia abajo; la primera regla satisfecha determina el resultado primario, conservando siempre TODOS los ejes y banderas simultáneas en `secondary_flags[]`):**

| Prioridad | Condición mutuamente excluyente (sobre el conjunto de campaña) | `campaign_outcome` (MCP/CLI/CI) | `outcome_class` | Código CLI/CI | ¿Éxito funcional CI? | Banderas simultáneas obligatorias (nunca ocultas) |
| --- | --- | --- | --- | --- | --- | --- |
| **P0 (Invocación)** | Error de sintaxis/flags, argumentos, configuración, entrada inválida o binario/daemon inaccesible antes de emitir resultado de campaña | `CLI_USAGE_ERROR` / `CLI_DATA_ERROR` / `CLI_CONFIG_ERROR` / `CLI_UNAVAILABLE` / `CLI_INTERNAL_ERROR` | `INVOCATION_ERROR` | `2`, `65`, `66`, `69`, `70`, `74`, `78`, `1` (solo crash no controlado) | **No** | No emite `campaign_outcome` funcional; `outcome_kind = "invocation_error"` |
| **P0b (Consulta/Diag)** | Comandos de lectura/diagnóstico (`qap doctor`, `qap status`, `qap report --read`) que completan su consulta sin error de invocación | `QUERY_OK` / `DIAGNOSTIC_OK` *(o fallo de consulta)* | `QUERY_OR_DIAGNOSTIC` | `0` *(solo consulta válida; jamás `PASSED_FUNCTIONAL`)* | **No aplica** | `outcome_kind = "query" | "diagnostic"`; si el reporte leído está `LOST_OR_TAMPERED` y se pidió verificación estricta, usa `18` |
| **P1 (Operativo no terminal)** | `operational_state` ∈ `{ACCEPTED_ASYNC, RUNNING}` (ACK asíncrono o consulta de campaña aún activa) | `ACCEPTED_ASYNC_PENDING` / `CAMPAIGN_RUNNING` | `OPERATIONAL_NON_TERMINAL` | `20` | **No** | `is_terminal: false`; incluye `campaign_id`, `correlation_id` y `poll_handle` |
| **P2 (Integridad / Atestación)** | ≥1 intento/evidencia con `current_evidence_health = LOST_OR_TAMPERED` O `attestation_state` ∈ `{INVALID_ATTESTATION, UNATTESTED}` (cuando el perfil exige atestación) | `INTEGRITY_OR_ATTESTATION_ERROR` | `INTEGRITY_FAILURE` | `18` | **No** | Preserva en `secondary_flags` si hubo `FAIL`, `CLEANUP_FAILED`, `PENDING_CLEANUP`, etc. |
| **P3 (FAIL + Riesgo residual / técnico)** | No P1–P2, y ≥1 caso con `functional_verdict = FAIL` **Y** simultáneamente (≥1 `cleanup_status` ∈ `{CLEANUP_FAILED, CLEANUP_UNKNOWN, PENDING_CLEANUP}` **O** ≥1 `ERROR` técnico **O** ≥1 `MISSING_REQUIRED`) | `FAILED_WITH_RESIDUAL_RISK` | `FUNCTIONAL_AND_OPERATIONAL_FAILURE` | `11` | **No** | Expone explícitamente `has_functional_fail: true` + `cleanup_issues[]` + `technical_errors[]` |
| **P4 (FAIL puro de negocio)** | No P1–P3, y ≥1 caso con `functional_verdict = FAIL` (con limpieza completa/no requerida y sin errores técnicos/integridad) | `FAILED` | `FUNCTIONAL_FAILURE` | `10` | **No** | Expone conteo de `FAIL`, `INDETERMINATE`, `BLOCKED`, `SKIPPED` |
| **P5 (Error técnico de ejecución)** | No P1–P4 (0 `FAIL`), y ≥1 caso u operación de `DataPlan` con `functional_verdict = ERROR` o `MISSING_REQUIRED` técnico | `EXECUTION_ERROR` | `TECHNICAL_FAILURE` | `12` | **No** | Expone `cleanup_issues[]` si coexiste `CLEANUP_FAILED`/`PENDING_CLEANUP` |
| **P6 (Fallo o incertidumbre de limpieza)** | No P1–P5 (0 `FAIL`, 0 `ERROR`), y ≥1 caso u operación con `cleanup_status` ∈ `{CLEANUP_FAILED, CLEANUP_UNKNOWN, PENDING_CLEANUP}` | `CLEANUP_INCOMPLETE_OR_FAILED` | `CLEANUP_FAILURE` | `13` | **No** | Impide éxito CI aunque todos los casos hayan dado `PASS` funcional |
| **P7 (Incertidumbre o bloqueo)** | No P1–P6, y ≥1 caso obligatorio con `functional_verdict` ∈ `{INDETERMINATE, BLOCKED}` | `INDETERMINATE_OR_BLOCKED` | `INCONCLUSIVE_OR_BLOCKED` | `14` | **No** | Desglosa `indeterminate_count`, `blocked_count` y causas raíz |
| **P8 (Obligación incompleta / corte operativo)** | No P1–P7, y (`operational_state` ∈ `{PAUSED, CANCEL_REQUESTED, CANCELLED, BUDGET_EXHAUSTED, PARTIALLY_COMPLETED}` **O** ≥1 caso obligatorio con `SKIPPED` + `skip_reason_class = REQUIRED_OMITTED` **O** tareas obligatorias sin ejecutar) | `INCOMPLETE_OBLIGATION` | `INCOMPLETE_CAMPAIGN` | `15` | **No** | Cubre explícitamente `PASS + SKIPPED obligatorio`, pausa, cancelación y presupuesto agotado |
| **P9 (Vacía o sin elegibles)** | No P1–P8, y `executed_cases_count === 0` (selección vacía, todos `SKIPPED` por `NOT_APPLICABLE_ACCREDITED` o `AUTHORIZED_EXCLUSION`) | `NO_ELIGIBLE_OR_EMPTY` | `EMPTY_OR_NON_APPLICABLE` | `17` | **No** | Distingue `empty_selection` vs `all_not_applicable_accredited` vs `all_authorized_excluded` |
| **P10 (Solo estructural)** | No P1–P9, `operational_state = COMPLETED`, `executed_cases_count >= 1`, 100 % `PASS`, pero `passed_functional_count === 0` y `passed_structural_count >= 1` | `STRUCTURAL_ONLY_NO_FUNCTIONAL_PASS` | `STRUCTURAL_ONLY` | `16` | **No** | `structural_only: true`; nunca código `0` para evitar habilitar CI como éxito funcional |
| **P11 (Éxito funcional completo)** | `operational_state = COMPLETED`, 0 `FAIL`, 0 `ERROR`, 0 `INDETERMINATE`, 0 `BLOCKED`, 0 `REQUIRED_OMITTED`, 0 `CLEANUP_FAILED`/`PENDING_CLEANUP`/`CLEANUP_UNKNOWN`, 0 `LOST_OR_TAMPERED`/`MISSING_REQUIRED`, `passed_functional_count >= 1` (N2/N3 acreditado; puede incluir casos `NOT_APPLICABLE_ACCREDITED` o `AUTHORIZED_EXCLUSION` explícitamente trazados y casos estructurales adicionales) | `PASSED_FUNCTIONAL` | `FUNCTIONAL_SUCCESS` | `0` | **Sí** | Desglosa siempre `passed_functional_count`, `passed_structural_count`, `not_applicable_accredited_count`, `authorized_excluded_count` |

**Regla de paridad MCP/CLI/CI (`AR-52`):** El mismo payload JSON (`CampaignOutcomeDTO`) contiene `exit_code_schema_version: "2.0"`, `outcome_kind`, `campaign_outcome`, `outcome_class`, `cli_exit_code`, `operational_state`, los 4 ejes agregados, los contadores completos por veredicto/alcance y `secondary_flags[]`. MCP incluye `cli_exit_code` en su respuesta estructurada y CLI retorna exactamente ese entero como `process.exitCode`.

### 2.6 Ejemplos exhaustivos de verificación de tabla

| # | Escenario concreto | Ejes y estado operativo observados | `campaign_outcome` | Código CLI |
| --- | --- | --- | --- | --- |
| 1 | `qap test --invalid-flag` | Error de sintaxis CLI | `CLI_USAGE_ERROR` | `2` |
| 2 | `qap start` devuelve admisión asíncrona | `operational_state = ACCEPTED_ASYNC` | `ACCEPTED_ASYNC_PENDING` | `20` |
| 3 | `qap status <id>` consulta campaña en curso | `outcome_kind = "query"` (consulta válida); payload interno indica `CAMPAIGN_RUNNING` (`20`) | `QUERY_OK` *(payload: `CAMPAIGN_RUNNING`)* | `0` *(consulta)* / `20` *(si `--wait`)* |
| 4 | 5 casos `PASS` funcionales (N2/N3) + 1 caso `SKIPPED` (`NOT_APPLICABLE_ACCREDITED`, ej. módulo no contable) | `COMPLETED`, `CLEANED`, `COMPLETE`, 0 omisiones obligatorias | `PASSED_FUNCTIONAL` | `0` |
| 5 | 5 casos `PASS` funcionales + 1 caso obligatorio `SKIPPED` (`REQUIRED_OMITTED`) | `COMPLETED`, 0 `FAIL`, 1 obligación omitida | `INCOMPLETE_OBLIGATION` | `15` |
| 6 | 3 casos `PASS` funcionales + presupuesto agotado (quedan 2 pendientes) | `BUDGET_EXHAUSTED`, `CLEANED` en lo ejecutado | `INCOMPLETE_OBLIGATION` | `15` |
| 7 | Campaña pausada manualmente tras 2 `PASS` | `PAUSED`, 4 pendientes | `INCOMPLETE_OBLIGATION` | `15` |
| 8 | Campaña cancelada en vuelo con limpieza completada | `CANCELLED`, `CLEANED` | `INCOMPLETE_OBLIGATION` | `15` |
| 9 | 4 casos `PASS` solo estructurales (`verification_scope = STRUCTURAL`, N1) | `COMPLETED`, `passed_functional = 0`, `passed_structural = 4` | `STRUCTURAL_ONLY_NO_FUNCTIONAL_PASS` | `16` |
| 10 | Selección vacía (`0` casos) o 100 % `NOT_APPLICABLE_ACCREDITED` | `COMPLETED`, `executed = 0` | `NO_ELIGIBLE_OR_EMPTY` | `17` |
| 11 | 1 caso `FAIL` de negocio + limpieza `CLEANED` + evidencia `COMPLETE` | `COMPLETED`, 1 `FAIL` | `FAILED` | `10` |
| 12 | 1 caso `FAIL` de negocio + `cleanup_status = CLEANUP_FAILED` | `COMPLETED`, 1 `FAIL`, 1 `CLEANUP_FAILED` | `FAILED_WITH_RESIDUAL_RISK` | `11` |
| 13 | 1 caso `FAIL` de negocio + `current_evidence_health = LOST_OR_TAMPERED` | Alteración de 1 byte en manifiesto | `INTEGRITY_OR_ATTESTATION_ERROR` (`secondary_flags: [HAS_FUNCTIONAL_FAIL]`) | `18` |
| 14 | 3 casos `PASS` funcionales + 1 caso con `cleanup_status = PENDING_CLEANUP` (permiso de limpieza expiró) | `COMPLETED`, 0 `FAIL`, limpieza pendiente | `CLEANUP_INCOMPLETE_OR_FAILED` | `13` |
| 15 | 2 casos `PASS` funcionales + 1 caso `INDETERMINATE` (sin testigo N2) | `COMPLETED`, 0 `FAIL`, 1 `INDETERMINATE` | `INDETERMINATE_OR_BLOCKED` | `14` |
| 16 | 2 casos `PASS` funcionales + 1 caso `PASS` cuya evidencia visual fue `SUPPRESSED_BY_POLICY` (oráculo API/datos independiente) | `COMPLETED`, `CLEANED`, `SUPPRESSED_BY_POLICY` | `PASSED_FUNCTIONAL` *(con `evidence_health = SUPPRESSED_BY_POLICY`)* | `0` |
| 17 | 2 casos `PASS` históricos cuya media pesada fue podada tras 24 h (`EXPIRED_PRUNED`) | `origin_verdict = PASS`, `current_evidence_health = EXPIRED_PRUNED` | `PASSED_FUNCTIONAL` *(histórico inmutable, `payload_pruned: true`)* | `0` |
| 18 | 1 caso donde faltó evidencia requerida al momento de evaluar (`MISSING_REQUIRED`) | `origin_evidence_health = MISSING_REQUIRED` | `INDETERMINATE_OR_BLOCKED` (`14`) o `EXECUTION_ERROR` (`12`) según causal | `14` / `12` |

### 2.7 Proyección semántica comparable e IDs/atestados por intento (`AR-45` / `AR-28`)

Para comparar resultados entre ejecuciones MCP y CLI (compuerta `E7`) sin falsas divergencias por timestamps o UUIDs efímeros, cada campaña expone dos artefactos separados (alineados con `[invalid URL]` `AR-45`):

1. **Sobre atestado por intento (`AttemptAttestation`):** Vincula `attempt_id`, `executor_instance_id`, `lease_epoch`, `attempt_seq`, `started_at`, `finished_at`, `plan_snapshot_digest`, `result_digest`, `evidence_manifest_digest` y firma/MAC conforme a `AR-28`. Cada intento conserva su identidad y atestado únicos.
2. **Proyección semántica comparable (`SemanticOutcomeProjection`, JCS RFC 8785):** Excluye `attempt_id`, timestamps y rutas físicas locales; incluye únicamente `(plan_snapshot_digest, effective_scope_digest, campaign_outcome, cli_exit_code, operational_state, secondary_flags_sorted, per_case_sorted[case_identity_id, functional_verdict, verification_scope, witness_independence_level, cleanup_status, origin_evidence_health, skip_reason_class, failure_locus])`. En `E7`, MCP y CLI sobre el mismo snapshot y fixture restaurado deben producir **el mismo SHA-256 de `SemanticOutcomeProjection**` conservando atestados individuales distintos y verificables.

### 2.8 Alternativas viables, riesgos residuales y criterios de aceptación (`AR-08` / `AR-52`)

* **Alternativa viable:** Esquema compacto estilo POSIX donde `1` representa `FAILED` de negocio (en lugar de `10`), reservando `2` para `USAGE`, `11–20` para los demás resultados no exitosos y `65–78` para `sysexits` (eliminando `GENERAL_ERROR = 1` como código de crash no controlado y moviéndolo a `70 = SOFTWARE`). **Por qué se prefiere la opción principal (bandas disjuntas `10–20`):** mantiene 100 % de compatibilidad hacia atrás con `ExitCode.GENERAL_ERROR = 1` y `USAGE = 2` en `errors.ts` y permite a pipelines CI distinguir por rango numérico si falló el proceso CLI (`1, 2, 65–78`), el resultado de negocio/calidad (`10–18`) o un estado no terminal (`20`). Si AV-07 o el Orquestador prefieren `1 = FAILED` por ergonomía CI, la alternativa es técnicamente equivalente siempre que `GENERAL_ERROR` se mueva a `70`.
* **Riesgos residuales:** Scripts CI heredados que solo comprueben `exitCode === 0 || exitCode === 1` pueden interpretar `16` (`STRUCTURAL_ONLY`) o `20` (`ACCEPTED_ASYNC`) como fallo genérico — comportamiento **seguro (fail-closed)**, documentable en guía de migración de `AV-07`.
* **Fase y criterio de aceptación/rechazo:** Contrato previo a G1; verificación en `E1` y certificación en `E7`. **Aceptación:** 18/18 vectores de §2.6 producen idéntico `SemanticOutcomeProjection` y `cli_exit_code` en MCP y CLI; 0 colisiones de código; 0 éxitos `0` en campañas vacías, estructurales, incompletas o con limpieza fallida/pendiente. **Rechazo:** cualquier ruta que emita `0` con obligación incumplida o altere un veredicto histórico tras `EXPIRED_PRUNED`.

## 3. Resolución AR-09: Independencia causal y acreditación de testigos funcionales (N0–N3)

**Registro cubierto:** `AR-09` (Crítica · BLOQUEANTE).

**Requisitos afectados:** `REQ-ORA-001.2`–`001.7`, `REQ-CAS-001.2`, `REQ-AUTREP-001`, `D08`, `D11`, `D12`, Enmienda AV-01 9.

### 3.1 Evidencia histórica (R2.1–R2.4) y de código real

* **Hydrogen R2 (`evidencia-archivada.md`, SHA `c57cd886bbda09902afc7d118b54226c1b59e62b`):** En `R2.1`, el runner legado aprobó una mutación con `HTTP 201` cuyo servidor hizo rollback silencioso; el testigo independiente leyó cero registros. En `R2.2`, un testigo en proceso separado sobre SQLite read-only del fixture diferenció `PASS` con persistencia real de `FAIL` ante rollback. **Límite normativo (`D08`/`D11`/`D12`):** ese testigo SQLite fue un mecanismo experimental del laboratorio sintético y **jamás constituye un requisito ni dependencia de acceso directo a la base de datos del AUT** en producto. En `R2.4`, el corte rotulado `before_write` registró 1 escritura ya enviada al servidor, demostrando que el estado confirmado del AUT solo puede acreditarse mediante testigo correlacionado en el destino, nunca por el estado interno del runner.
* **Brechas en código actual (`979f30247b74597f236e7e5c4fa8ad7ccfcc8eb8`):** `navigate.ts:12-18` no inspecciona `response.status()`; `assert.ts:24-180` no registra procedencia ni frescura; `wait-for.ts:7-22` carece de oráculo de convergencia eventual; `execution-evidence.ts:51-67` no exige `witness_independence_level`.

### 3.2 Rúbrica causal N0–N3 por afirmación y riesgo (nunca por nombre del canal)

La independencia de un testigo se evalúa **por afirmación concreta y modo de fallo bajo prueba**, acreditando 5 propiedades obligatorias: **(1) Independencia causal** (no comparte memoria optimista ni caché efímera con el canal mutativo), **(2) Correlación unívoca** (`entity_id` / `business_key` / `operation_correlation_id` + precondición limpia previa), **(3) Frescura** (evidencia de lectura desde origen, sin `fromDiskCache`, sin Service Worker, sin caché CDN/proxy obsoleta), **(4) Autoridad y alcance efectivos** (identidad/rol y `tenant_id` verificados en la respuesta, `AR-14`), y **(5) Ausencia de fallo de causa común** (`shared_dependency_risk` evaluado).

| Nivel | Qué acredita | Condiciones mínimas de acreditación causal | Causas que invalidan o degradan el nivel | Uso permitido por tipo de afirmación |
| --- | --- | --- | --- | --- |
| **N0 · Señal técnica** | Acción despachada sin excepción de transporte/DOM (clic, `HTTP 200/201`, toast UI). | Ninguna sobre persistencia ni negocio. | Siempre insuficiente para acreditar negocio o persistencia. | Solo diagnóstico técnico (`technical_status`). **Prohibido emitir `PASS` funcional o estructural de negocio con N0.** |
| **N1 · Testigo estructural / mismo canal** | Estado DOM/ARIA visible o respuesta síncrona en la misma sesión/canal de la acción. | Elemento/texto observable con `HTTP < 400` en navegación (salvo error esperado) y sin fallo técnico de paso. | Caché local, render optimista, SPA sin hidratación confirmada, `HTTP 4xx/5xx` inesperado. | Acredita `PASS` **únicamente** con `verification_scope = STRUCTURAL` para checks de UI/navegación/visibilidad no persistentes. **Prohibido para persistencia, cálculos críticos o RBAC negativo.** |
| **N2 · Testigo funcional / persistencia independiente** | El efecto sobrevivió a la sesión efímera y reside en estado confirmado del servidor/destino. | Cumple **las 5 propiedades**: (a) aislamiento de cliente (nuevo `BrowserContext` limpio con `serviceWorkers: 'block'`, cero storage/cookies previos, bypass caché HTTP **O** consulta API/vista secundaria sin caché), (b) evidencia de respuesta de origen (status 2xx sin `fromDiskCache`/`fromServiceWorker`, `ETag`/`Date`/cabecera o nueva consulta al backend), (c) identidad y `tenant_id` verificados en respuesta, (d) correlación unívoca con `business_key`/`entity_id` creada en el intento y verificada ausente en precondición, (e) confirmación de que la ruta de lectura no lee un caché optimista de sesión. | Service Worker activo; respuesta desde caché browser/proxy/CDN; estado optimista en cliente; falta de precondición limpia (falso match con registro preexistente); `tenant_id`/perfil no verificado; réplica de lectura sin ventana de convergencia; lectura sobre el mismo BFF/mock que fabrica el falso 201. | Requisito mínimo para `verification_scope = FUNCTIONAL_EFFECT` en mutaciones, creación/edición/eliminación de entidades y verificación de estado confirmado. |
| **N3 · Conciliación cruzada / invariante independiente** | Consistencia de negocio entre ≥2 fuentes causalmente diferenciadas o invariante matemático/contable/seguridad. | Contraste entre ≥2 fuentes con rutas de lectura diferenciadas (p. ej. vista operativa UI en rol A + vista/módulo consumidor en rol B; o UI/API operativa + reporte PDF/Excel emitido por el AUT + recálculo decimal exacto contra regla acreditada; o snapshot pre/post de **no-mutación** en prueba negativa RBAC). Declara explícitamente el grafo de dependencias conocidas entre fuentes. | Si las dos fuentes leen la misma vista materializada o caché defectuosa (fallo de causa común), se degrada a **N2** con `shared_dependency_risk: true` y advertencia explícita; no se certifica como N3. | Obligatorio para `verification_scope = CROSS_CONCILIATED`: cálculos monetarios/contables, reportes funcionales (`AV-05`), conciliaciones multi-módulo (`AR-43`) y no-mutación RBAC (`REQ-ORA-001.5`). |

### 3.3 Análisis por tipo de testigo autorizado (sin exigir BD del AUT)

1. **Testigo UI en contexto limpio:** Válido como N2 solo si abre un `BrowserContext` nuevo con `serviceWorkers: 'block'`, se autentica con sesión verificada (`AR-14`), navega con bypass de caché, comprueba en red que la consulta de datos proviene del origen (no `fromDiskCache`), y correlaciona el registro por clave única generada en el intento. Una simple llamada a `page.reload()` en el mismo contexto **no acredita N2**.
2. **Testigo API autorizada (OpenAPI / UTCP / REST / GraphQL):** Válido como N2 únicamente si la lectura está acreditada como `read_only`, apunta al origen confirmado sin caché intermedio, verifica `tenant_id` y no comparte un caché optimista de sesión con la mutación. Una API **no es independiente por el mero hecho de ser API** (`D11`).
3. **Testigo documental / reporte emitido (PDF/Excel):** Acredita N2/N3 cuando se descarga tras la mutación con filtros explícitos y se concilia registro a registro contra la clave correlacionada y reglas acreditadas (la extracción y fórmulas exactas se delegan por contrato a `AV-05`).
4. **Testigo de reglas de negocio acreditadas:** Combina valores observados por N2 con evaluación determinista de la regla acreditada (`AR-53`) en aritmética decimal exacta; nunca toma la salida del AUT como expectativa.
5. **Combinación de testigos y consistencia eventual (`REQ-ORA-001.6`):** Cuando el AUT usa colas o réplicas de solo lectura con lag declarado, el testigo N2/N3 opera bajo una **ventana de convergencia explícita** (`convergence_window_ms`, `poll_interval_ms`, `terminal_success_predicate`, `terminal_failure_predicate`, `max_polls`):
* Converge a `terminal_success_predicate` dentro de ventana → `PASS` (registrando latencia de convergencia).
* Alcanza `terminal_failure_predicate` (p. ej. estado `REJECTED`/`FAILED` definitivo) o tras lectura fresca confirmada de origen (sin lag declarado) el registro no existe → **`FAIL` (ausencia de efecto acreditada)**.
* Expira la ventana con estado intermedio o lag no resuelto → **`INDETERMINATE (eventual_consistency_timeout)`**, jamás `PASS`.



### 3.4 Frontera estricta: `FAIL` vs `INDETERMINATE` vs `ERROR` y reglas HTTP (`201`, `403`, `500`)

* **Ausencia de efecto acreditada → `FAIL`:** Un testigo N2/N3 fresco, correlacionado y autorizado consulta el origen confirmado y demuestra que el efecto esperado no existe (caso `HTTP 201` con rollback de `R2.1/R2.2`) o que un efecto prohibido sí ocurrió (`HTTP 403` con mutación oculta).
* **Incertidumbre o ausencia de oráculo/testigo → `INDETERMINATE`:** No existe fuente de negocio acreditada (Enmienda AV-01 9), no existe testigo N2/N3 disponible para una mutación, las fuentes de igual autoridad se contradicen, o expira la ventana de consistencia eventual. **Nunca `PASS`, incluso si N1 muestra éxito visual.**
* **Fallo técnico del testigo → `ERROR` (o `INDETERMINATE` si el testigo es degradado pero la acción pudo ocurrir):** Si el canal del testigo falla por timeout de red, crash de navegador o caída de infraestructura (`502/503/504` del servidor de lectura), se marca `technical_status = TIMEOUT|HTTP_ERROR|CRASH` y `functional_verdict = ERROR` (o `INDETERMINATE` con `witness_acquisition_failed` cuando el efecto mutativo quedó incierto y dispara reconciliación).
* **Reglas HTTP explícitas:**
* `HTTP 200/201` es **N0**: jamás produce `PASS` funcional por sí solo.
* `HTTP 403` **no es defecto automático ni `PASS` automático**: si la expectativa acreditada era permiso concedido → `FAIL`; si la expectativa era denegación RBAC → requiere además **testigo N2/N3 de no-mutación pre/post** (`REQ-ORA-001.5`) para emitir `PASS` (si hubo mutación oculta pese al `403` → `FAIL` crítico de seguridad).
* `HTTP 500` **no es defecto automático sin contexto**: en flujo ordinario donde se esperaba éxito o error controlado `4xx` → `FAIL` (defecto de aplicación) o `ERROR` si el testigo de salud del entorno acredita indisponibilidad general (`ENVIRONMENT_FAILURE`); en prueba negativa de resiliencia con contrato explícito → se evalúa contra el oráculo declarado.



### 3.5 Alternativas viables, riesgos residuales y criterios de aceptación (`AR-09`)

* **Alternativa viable:** Exigir siempre N3 (dos fuentes distintas) para toda mutación. **Por qué se descarta como regla universal:** en muchas aplicaciones empresariales solo existe una superficie de lectura autorizada (UI limpia o API de consulta), lo que provocaría abstención masiva (`INDETERMINATE`) innecesaria. La rúbrica graduada por riesgo (N1 estructural, N2 persistencia, N3 cálculos/reportes/RBAC crítico) equilibra veracidad y cobertura.
* **Riesgos residuales:** Un AUT puede presentar un caché de servidor transparente sin cabeceras observables que engañe a un testigo N2 si no existe segunda ruta de lectura; QAP mitiga esto registrando `witness_cache_verifiability` y exigiendo N3 en afirmaciones contables/críticas.
* **Fase y criterio de aceptación/rechazo:** Contrato previo a G3; verificación en `E5` y `E8`. **Aceptación:** 100 % de controles positivos sanos en `PASS`, 0 falsos `PASS` ante rollback `201`, caché/SW/optimista, `403` con efecto y falta de testigo; cada evaluación persiste `witness_independence_level`, procedencia, correlación y `shared_dependency_risk`. **Rechazo:** cualquier mutación aprobada solo con N0/N1 o con `page.reload()` en el mismo contexto.

## 4. Resolución AR-10: Preparación, mutación, reconciliación y limpieza de datos

**Registro cubierto:** `AR-10` (Alta · PENDIENTE).

**Requisitos afectados:** `REQ-RUN-001.4`, `REQ-DAT-001.1`–`001.4`, `REQ-E2E-001`, `D06`, `D07`, `D08`, `D09`, Enmienda AV-01 1 y 8, `AR-31`, `AR-47`, `DE-04`.

### 4.1 Contrato de `DataPlan`, `TestDataManager` e intención durable previa al efecto

1. **`TestDataManager` (`REQ-DAT-001.1`):** Genera datasets sintéticos deterministas por semilla, etiquetados con `(campaign_id, attempt_id, data_plan_rev, run_tag, expires_at)` y protegidos por filtro anti-PII que prohíbe copiar datos personales reales desde instancias de referencia (`D09`).
2. **Protocolo de intención durable (`OperationIntent`, alineado con `AR-11`/`AR-12`):** Antes de emitir **cualquier** mutación (preparación, paso de caso o limpieza) al AUT:
* Se persiste en el almacén único (con barrera durable WAL `FULL` de `AR-12`) un registro `OperationIntent` con: `intent_id`, `attempt_id`, `operation_id`, `operation_class`, `target_env`, `tenant_id`, `effective_profile_id`, `operation_correlation_id`, `business_key`, `idempotency_key` (si aplica), `idempotency_accredited: boolean`, `precondition_witness_digest`, `cleanup_strategy`, `state = INTENT_COMMITTED`.
* **Precondición limpia:** Antes de crear/mutar, se consulta un testigo de solo lectura para acreditar que `business_key` no preexiste y que ningún registro ajeno será afectado.
* **Límite físico explícito (`AR-11`/`AR-47` / `R2.4`):** El fencing local y SQLite **no impiden** que una petición HTTP/UI ya enviada al socket se materialice en el AUT. Igualmente, una revocación en vuelo (`AR-47`) impide nuevos efectos mediante `AbortController` y corte de rutas, pero **no deshace envíos ya despachados**. Todo envío cuyo resultado no sea confirmado entra obligatoriamente en reconciliación.



### 4.2 Idempotencia acreditada, reconciliación y política estricta de reintento

| Estado tras fallo / corte / timeout | Acción obligatoria del núcleo | ¿Reintento permitido? | Veredicto / Estado resultante |
| --- | --- | --- | --- |
| **Fallo previo al despacho** (`state = INTENT_COMMITTED`, cero bytes enviados acreditado) | Marcar intención abortada; reintento seguro según presupuesto | **Sí** (acotado) | Reintentable sin riesgo de duplicación |
| **Lectura segura acreditada** (`operation_class = READ_ONLY_ACCREDITED`) | Reintentar según política de backoff | **Sí** (acotado) | Según resultado final |
| **Efecto incierto** (enviado sin respuesta confirmada o corte en vuelo) | **Paso 1:** Consultar testigo independiente correlacionado por `operation_correlation_id` / `business_key`.<br>

<br>**Paso 2a:** Si testigo acredita **efecto confirmado** → adoptar entidad existente (no duplicar) y continuar o limpiar según fase.<br>

<br>**Paso 2b:** Si testigo acredita **ausencia de efecto** → reintento autorizado con nueva `intent_id`.<br>

<br>**Paso 2c:** Si destino tiene **idempotencia acreditada** para ese ámbito y ventana de vigencia → reintento autorizado reutilizando exactamente la misma `idempotency_key`.<br>

<br>**Paso 2d:** Si testigo no puede confirmar y no hay idempotencia acreditada → **prohibido reintentar**. | **Solo** en 2b o 2c; **prohibido** en 2a y 2d | En 2d: suspender rama dependiente, `functional_verdict = INDETERMINATE (uncertain_mutation_effect)`, `cleanup_status = CLEANUP_UNKNOWN` (o `PENDING_CLEANUP`) |

Esta regla elimina el reintento ciego de `packages/cli/src/commands/test.ts:182-204`.

### 4.3 Matriz de mutaciones, limpieza y políticas por clase de operación (`DE-04` abierta)

**Restricción normativa (`D07`/`D09`/`AR-31`/Enmienda AV-01 1):** Las escrituras automáticas están permitidas **exclusivamente en entornos QA expresamente autorizados**; producción e instancias de referencia permanecen en **solo lectura acreditada en el destino** (incluso para `GET` y GraphQL; el nombre del entorno o método HTTP jamás otorga autoridad). QAP jamás modifica código fuente del AUT ni configuración/infraestructura productiva. **No se inventa ningún acta `DE-04`:** la tabla define las clases de política disponibles que el propietario deberá asignar por destino real antes de operar en `G6.5`.

| Clase de operación del AUT | Naturaleza y ejemplos | Estrategia de limpieza permitida | Idempotencia de limpieza (Enmienda AV-01 8) | Requisitos de autorización y manejo de fallo |
| --- | --- | --- | --- | --- |
| **C1 · Lectura acreditada (`READ_ONLY_ACCREDITED`)** | Consultas GET/GraphQL `query` acreditadas sin efecto secundario en destino read-only real | `NOT_REQUIRED` | N/A | Permitida en QA y en producción/referencia **solo** con autoridad read-only verificada en destino (`AR-31`). Si el efecto es desconocido, se clasifica como C2+ y se bloquea en producción. |
| **C2 · Mutación reversible CRUD (`REVERSIBLE_MUTATION`)** | Creación/edición de catálogos, borradores, clientes sintéticos en QA | `delete` (eliminación directa en orden inverso del DAG del `DataPlan`, estrictamente filtrada por `entity_id` + `run_tag` creados en la ejecución) | Repetir `delete` 2 veces sobre la misma entidad debe converger sin error (`200/204/404`) y con **cero** afectación a registros ajenos. | Requiere grant vigente en QA autorizado + testigo post-limpieza N2 que acredite desaparición. Si falla → `CLEANUP_FAILED`; si expiró el permiso de limpieza → `PENDING_CLEANUP` (se conserva cola durable hasta renovar permiso). |
| **C3 · Mutación con historial/auditoría no borrable (`COMPENSABLE_MUTATION`)** | Solicitudes aprobadas, contratos emitidos, movimientos con bitácora inmutable que admiten anulación/reversa | `compensate` (operación compensatoria explícitamente autorizada, acreditada y reconciliada, p. ej. `cancel_request` / `reverse_entry`) | La compensación es operación distinta a `delete`: deja rastro contable/auditable esperado. Repetirla debe ser idempotente (reconocer estado ya compensado) y acreditarse con testigo N2. | Requiere grant explícito de operación compensatoria y verificación de estado compensado (`cleanup_status = COMPENSATED`). Nunca reportar `CLEANED` si quedaron residuos compensados. |
| **C4 · Mutación en entorno/tenant desechable (`CONFINED_TENANT_MUTATION`)** | Flujos en tenant/sandbox efímero dedicado por campaña donde el aislamiento sustituye el borrado individual | `confine_tenant` (verificación de que toda entidad creada permanece estrictamente dentro del `tenant_id` desechable autorizado, sin fuga a tenants compartidos) | Re-ejecutar verificación de confinamiento es lectura pura idempotente. | Requiere declaración expresa de tenant desechable en política de destino (`DE-04`). `cleanup_status = CONFINED`. Cualquier fuga fuera del tenant → `CLEANUP_FAILED` + incidente de seguridad. |
| **C5 · Financiera, contable o irreversible (`IRREVERSIBLE_OR_FINANCIAL`)** | Asientos contables cerrados, timbrado fiscal, pagos reales, notificaciones externas irreversibles, envíos a terceros | **Prohibido `delete` automático.** Solo se admite: (a) `confine_tenant` en sandbox aislado sin egress externo, o (b) `compensate` expresamente ratificado en `DE-04`, o (c) **bloqueo fail-closed (`BLOCKED`)** por defecto. | Según política ratificada por destino; si no existe estrategia acreditada, la operación jamás se admite. | **Bloqueada por defecto** hasta ratificación expresa de `DE-04` por destino/operación y comprobación de no-egress a terceros reales. |

**Diferenciación obligatoria en reportes y bitácora de limpieza:** Reversión (`CLEANED`) ≠ Compensación (`COMPENSATED`) ≠ Confinamiento (`CONFINED`) ≠ Limpieza pendiente por permiso/reconciliación (`PENDING_CLEANUP`) ≠ Estado desconocido tras corte (`CLEANUP_UNKNOWN`) ≠ Fallo acreditado con residuos (`CLEANUP_FAILED`). Cada entidad creada conserva su `entity_id`, `cleanup_strategy`, `cleanup_intent_id`, evidencia de testigo post-limpieza y cualquier residuo documentado.

### 4.4 Contrato de datos hacia AV-05 (sin elegir SDK)

AV-04 entrega a AV-05 el puerto agnóstico **`IExternalOperationPort`** (sin congelar `@utcp/sdk`, OpenAPI parser ni clientes HTTP, cuya selección corresponde a `EXP-05` en AV-05):

* **`OperationDescriptor`:** `{ operation_id, protocol_kind: "openapi" | "utcp" | "http_documented" | "ui_flow", descriptor_version, descriptor_digest, target_env, tenant_scope, operation_class: C1..C5, input_schema_ref, output_schema_ref, idempotency_contract: { supported, key_location, ttl_ms, accredited }, cleanup_contract: { strategy, inverse_operation_id, witness_operation_id }, auth_vault_ref }`.
* **Obligaciones del adaptador AV-05:** Validar entrada/salida contra esquema, inyectar credenciales exclusivamente vía `auth_vault_ref` opaco (`AR-07`), respetar `AbortSignal` de revocación (`AR-47`), emitir evidencias de red saneadas (sin secretos) con `from_cache`/`origin_verified`, y nunca reintentar mutaciones internamente sin pasar por el reconciliador de `@qap/core`.

### 4.5 Alternativas viables, riesgos residuales y criterios de aceptación (`AR-10`)

* **Alternativa viable:** Delegar la limpieza únicamente a snapshots/restauración de BD del entorno QA fuera de QAP. **Por qué es complementaria y no sustitutiva:** funciona bien en fixtures locales o entornos efímeros dedicados (`C4`), pero no está disponible en entornos QA compartidos empresariales ni sustituye la verificación de no-alteración de registros ajenos (`Enmienda AV-01 8`).
* **Riesgos residuales:** Un destino puede declarar idempotencia en documentación pero no aplicarla en implementación; por ello la idempotencia solo pasa a `accredited: true` tras prueba controlada en el destino/fixture. Efectos ya despachados antes de una revocación o corte dependen de la capacidad de lectura/compensación del destino.
* **Fase y criterio de aceptación/rechazo:** Contrato previo a G3; operación por destino condicionada a `DE-04` y validación en `E5` / `EXP-05`. **Aceptación:** 0 mutaciones en destinos read-only (incluidos GET/GraphQL mutativos); corte tras envío reconcilia sin duplicar; limpieza inversa repetida 2 veces deja 0 residuos ajenos; `CLEANUP_FAILED`/`PENDING_CLEANUP` siempre impide `exitCode = 0`. **Rechazo:** cualquier reintento ciego de mutación incierta o alteración de registro preexistente ajeno.

## 5. Resolución AR-43: Ejecución E2E completa multirol y multimódulo

**Registro cubierto:** `AR-43` (Crítica · BLOQUEANTE).

**Requisitos afectados:** `REQ-PLN-001.1`–`001.6`, `REQ-RUN-001.1`–`001.6`, `REQ-CAM-001.2`–`001.3`, `REQ-E2E-001`, `D06`, `D07`, `D08`.

### 5.1 Diagnóstico de la base actual y objetivo de producto

En `979f30247b74597f236e7e5c4fa8ad7ccfcc8eb8`, `packages/playwright-runner/src/runner.ts:463,542` ejecuta todos los casos en un solo `BrowserContext`/`Page` (contaminación cruzada de cookies/storage/DOM); `packages/engine/src/flow-orchestrator.ts:371-408` ignora `depends_on` y `execution_timeout_ms` y pasa variables no tipadas `Record<string, string>`; y `case-execution-policy.ts:12-14` bloquea `switch_auth` porque no existe aislamiento de contexto por rol. Además, `R2.1–R2.4` probó persistencia y cortes en un fixture simple sin cobertura multirol ni multimódulo empresarial.

**Piso de aceptación vs. producto:** El fixture mínimo de verificación exige **≥3 módulos y ≥2 roles distintos** en una sola campaña (p. ej. *Solicitante*: crear cliente y solicitud → *Aprobador*: aprobar solicitud y generar contrato → *Consulta/Reportes*: verificar efecto y reporte), dejando explícito que **3 módulos y 2 roles son un piso mínimo de acreditación, jamás un límite de producto**.

### 5.2 Modelo canónico de ejecución E2E (`E2EFlowGraph`)

1. **Aislamiento de contextos y roles efectivos:**
* **Por defecto:** 1 `BrowserContext` limpio por caso (`REQ-RUN-001.1`), cerrado al concluir el caso.
* **Flujos encadenados y cambio de rol:** Se retira el `switch_auth` sobre la misma página; cada rol opera en su propio `BrowserContext` aislado ligado a su `ProfileBinding` (`AR-04`/`AR-14`) con identidad y `tenant_id` verificados en destino antes del primer paso mutativo. La compartición de sesión entre dos pasos solo es válida dentro del mismo `ProfileBinding` y debe declararse explícitamente en el `ExecutionPlan` congelado.


2. **Transferencias de datos tipadas (`TypedDataTransfer`):**
* Sustituye `sharedVariables: Record<string, string>`. Cada transferencia declara `{ transfer_id, producer_node_id, consumer_node_id, field_name, value_type: "id" | "decimal_string" | "iso_datetime" | "enum" | "string", schema_constraint, sensitive: boolean, producer_witness_level: "N2" | "N3", provenance_attempt_id }`.
* Si `sensitive: true`, el valor se redacta en logs/timeline/reportes y nunca viaja en `ContextSnapshot` hacia el HOST.
* Si el productor falla o no acredita la captura tipada, el consumidor no arranca y se marca `BLOCKED (missing_typed_input)` preservando la causa raíz.


3. **Dependencias tipadas alineadas con `AR-05` (`[invalid URL]`):**
* Validación DAG obligatoria antes de iniciar ejecución; cualquier ciclo rechaza el plan antes de producir efectos (`REQ-PLN-001.4`).
* Tres aristas normativas:
* `REQUIRES_ACCREDITED_SUCCESS`: el nodo destino solo corre si el origen cerró con `PASS` en el `verification_scope` requerido (p. ej. solicitud creada con testigo N2 antes de aprobación).
* `REQUIRES_PERSISTED_COMPLETION`: habilita nodos de diagnóstico/observación tras finalizar el origen cualquiera sea su veredicto.
* `REQUIRES_ACCREDITED_RECONCILIATION`: habilita el siguiente efecto autorizado solo tras reconciliar un efecto previo incierto o compensado.


* **Aislamiento de ramas:** El bloqueo o fallo de una rama afecta transitivamente solo a sus dependientes incompatibles; las ramas independientes continúan con sus propios contextos y presupuesto (`REQ-CAM-001.2`).


4. **Localización obligatoria del fallo (`failure_locus`):** Todo fallo o bloqueo en un flujo E2E se clasifica explícitamente en una de cuatro categorías disjuntas para evitar diagnósticos ambiguos:
* `PREPARATION_FAILURE`: fallo al ejecutar `DataPlan` o precondiciones antes del caso bajo prueba.
* `APPLICATION_DEFECT`: defecto funcional del AUT acreditado por oráculo y testigo (`FAIL`).
* `ENVIRONMENT_FAILURE`: caída de infraestructura, red externa, DNS, indisponibilidad global del AUT o pérdida de sesión del entorno (`ERROR`/`BLOCKED`).
* `EVIDENCE_OR_WITNESS_FAILURE`: el caso se ejecutó pero falló la captura requerida, la integridad o la adquisición del testigo (`INDETERMINATE`/`ERROR`).


5. **Concurrencia segura, corte y continuidad entre agentes (`AR-11`/`AR-42`):**
* **Control de conflictos (`resource_lock_keys`):** Todo nodo declara las claves de entidad/tenant/sesión mutable que toca; el despachador adquiere bloqueos en orden lexicográfico canónico. Dos roles distintos pueden ejecutarse en paralelo únicamente si no tienen arista DAG ni `resource_lock_keys` en conflicto.
* **Corte y handoff multi-agente:** Cada paso completado persiste su `AttemptOutcome`, `TypedDataTransfer` confirmado y `OperationIntent` en SQLite antes de avanzar. Ante desconexión del HOST A, el ejecutor continúa los nodos deterministas listos; al reconectar HOST B, reanuda desde el cursor durable sin repetir nodos ya confirmados ni duplicar efectos, y ejecuta la limpieza inversa (`AR-10`) al cerrar la rama o flujo.



### 5.3 Alternativas viables, riesgos residuales y criterios de aceptación (`AR-43`)

* **Alternativa viable:** Ejecutar todo el flujo E2E multirol en una única secuencia estrictamente serial (`W = 1`) sin paralelismo de ramas independientes. **Evaluación:** válida como modo conservador por defecto bajo presión de memoria (`D16`), pero insuficiente como arquitectura única porque incumple la continuidad de ramas independientes y la planificación de concurrencia exigidas por `REQ-CAM-001.2` y `D16`.
* **Riesgos residuales:** Flujos largos con ventanas de expiración de sesión del AUT pueden caducar el token del Rol B mientras corre el Rol A; se mitiga verificando vigencia de sesión inmediatamente antes de abrir el `BrowserContext` del Rol B y renovando/bloqueando cerrado (`AR-47`) sin fallback anónimo.
* **Fase y criterio de aceptación/rechazo:** Contrato previo a G3/G4; validación en `E3`, `E4`, `E5` y `E8`. **Aceptación:** 1 campaña completa sobre ≥3 módulos y ≥2 roles con transferencias tipadas, casos positivos y negativos (rollback + permisos), inyección de fallo localizado con continuidad de rama hermana, corte tras efecto confirmado con handoff sin duplicación y limpieza inversa verificada. **Rechazo:** reutilización no declarada de `BrowserContext`, transferencia no tipada, ignorar `depends_on`, o confundir fallo de preparación con defecto del AUT.

## 6. Resolución AR-53: Verificación de reglas de negocio, permisos y cálculos

**Registro cubierto:** `AR-53` (Alta · PENDIENTE).

**Requisitos afectados:** `REQ-CAS-001.1`–`001.5`, `REQ-ORA-001.4`–`001.7`, `REQ-DOC-001.4`, `D05`, `D11`, `D12`, `D17`, Enmienda AV-01 9.

### 6.1 Evidencia de código y separación epistémica estricta

* En `packages/playwright-runner/src/case-execution-policy.ts:4-15`, `bva` y `rbac_negative` se bloquean incondicionalmente. Este bloqueo rígido debe reemplazarse por un **evaluador de elegibilidad contractual**: un caso BVA, negativo, de estado, RBAC o de cálculo es elegible automáticamente (sin aprobación humana por caso ordinario, `D04`) si y solo si posee **(a) fuente normativa acreditada** (`confirmed_requirement` o `ingested_doc` acreditado), **(b) aplicabilidad evaluada `applicable**` para `(env, tenant, role, config_revision)`, **(c) oráculo tipado verificable** y **(d) estrategia de testigo/limpieza acreditada**.
* **Anti-tautología (4 planos epistémicos, `D05`/`AR-46`):** Una observación del AUT o una inferencia del HOST **jamás** puede convertirse automáticamente en expectativa normativa. Si un caso intenta evaluar una regla cuya única procedencia es observación del propio AUT sin fuente acreditada, el evaluador se abstiene (`INDETERMINATE: unaccredited_expectation_source`), evitando oráculos circulares que aprueban el comportamiento defectuoso del sistema.

### 6.2 Cobertura obligatoria de técnicas, aplicabilidad y contradicciones

1. **Seis técnicas preservadas desde lanzamiento (`REQ-CAS-001.2`):**
* **Positivos funcionales:** flujo válido con verificación N2/N3 de efecto confirmado.
* **Negativos funcionales:** entrada inválida/inconsistente verificando rechazo controlado **más** no-mutación del estado subyacente.
* **Valores límite y clases de equivalencia (BVA/EP):** frontera inferior, frontera superior, fuera de límite y nulos/vacíos vinculados a restricciones acreditadas (longitud, rango numérico, fechas límite).
* **Transiciones de estado:** transiciones permitidas y prohibidas (p. ej. aprobar una solicitud ya cancelada debe rechazarse y preservar el estado `CANCELLED` acreditado con N2).
* **Seguridad funcional autorizada, RBAC y aislamiento de tenant:**
* **No confundir ocultación visual con autorización:** comprobar que un botón no está visible en UI es únicamente `STRUCTURAL` (N1) y **jamás** acredita control RBAC.
* **Acreditación real de RBAC/tenant:** invocar la operación/ruta autorizada para prueba negativa con el perfil restringido (o sobre un `entity_id` de otro tenant sintético en QA autorizado), verificar denegación esperada (`403`/rechazo) **Y** ejecutar obligatoriamente el **oráculo de no-mutación (`REQ-ORA-001.5`)** comparando snapshot N2/N3 antes y después. Si el `403` produjo efecto colateral o filtró datos del otro tenant → `FAIL` crítico.


* **Reglas de negocio y cálculos acreditados:** evaluados con AST determinista acotado y **aritmética decimal exacta** (representación decimal arbitraria / `BigInt` escalado, **nunca** `Number` IEEE-754 de punto flotante).


2. **Evaluación de aplicabilidad (`REQ-CAS-001.4` + Enmienda AV-01 9):** Antes de ejecutar, cada caso evalúa `applicability ∈ {applicable, not_applicable, indeterminate}` frente a `(env, tenant_id, effective_role, config_revision)` (p. ej. bandera `es_contable`).
* `not_applicable` con fuente acreditada → `SKIPPED (NOT_APPLICABLE_ACCREDITED)` (no bloquea éxito funcional de campaña si existen otros casos funcionales aprobados).
* `indeterminate` (configuración no observable o contradictoria) → `INDETERMINATE` (nunca se omite silenciosamente ni se aprueba).


3. **Contradicciones documentales (`REQ-DOC-001.4` / `AR-46`):**
* Conflicto entre dos fuentes acreditadas de **igual autoridad y alcance** sin regla de precedencia vigente → bloquea/abstiene únicamente el oráculo afectado (`INDETERMINATE: accredited_source_conflict`), registrando ambos localizadores y permitiendo continuar ramas independientes.
* Fuente con mayor autoridad acreditada y vigencia actual → resuelve precedencia dejando constancia de la discrepancia.



### 6.3 Comparación de fechas, monedas, decimales y redondeo con contexto regional (`AR-45`)

Toda comparación cuantitativa y temporal consume el **contexto regional efectivo congelado** definido en `[invalid URL]` (`AR-45`): `(bcp47_locale, iana_timezone, currency_code, calendar_system, numbering_system, rounding_mode, decimal_scale, tzdata_version, cldr_version)`:

* **Monedas y decimales:** Parsing estricto según `bcp47_locale` y `currency_code` hacia representación decimal exacta; comparación con `rounding_mode` explícito (`ROUND_HALF_UP`, `ROUND_HALF_EVEN`, `ROUND_DOWN`, etc.) y `tolerance` declarada en la regla acreditada (por defecto `0` en cálculos exactos contables, garantizando detección de error de 1 centavo). Si la regla omite política de redondeo cuando el cálculo produce fracciones ambiguas, el evaluador se abstiene (`INDETERMINATE: unspecified_rounding_policy`).
* **Fechas y cortes horarios:** Normalización a instante UTC + proyección en `iana_timezone` congelada para cortes de día/mes/cierre contable (incorporando la lección de `R2.6` sobre corte horario y decimal exacto). Si la zona horaria efectiva del AUT diverge de la declarada en el plan sin transición prevista → `INDETERMINATE (regional_context_divergence)`.
* **Traspaso contractual a AV-05 (`REQ-AUTREP-001` / `D11`):** Las pruebas de reportes reales PDF y Excel (extracción tabular multipágina, fórmulas Excel vs. valores cacheados, parsers y OCR) pasan a **AV-05 sin reducir obligación**. AV-04 provee a AV-05 el motor contractual de comparación tipada (`TypedRuleOracle`), la semántica de decimal exacto/fechas/redondeo/tolerancias, los 6 veredictos y la regla de abstención cuando la extracción o fuente de comparación sea insuficiente.

### 6.4 Controles de falsación: anti-falso-`PASS`, anti-falso-`FAIL` y anti-abstención excesiva

Para impedir tanto oráculos laxos (falso `PASS`) como oráculos paranoicos (falso `FAIL`) o evasivos (abstención sistemática en `INDETERMINATE`), el contrato de `AR-53` exige tres familias pareadas de controles en `E5` y `E8`:

1. **Controles contra falso `PASS` (mutantes semánticos):** (a) `HTTP 201` con rollback silencioso; (b) error de 1 centavo en cálculo/IVA/interés; (c) política de redondeo incorrecta (`ROUND_HALF_DOWN` vs `ROUND_HALF_UP`); (d) `HTTP 403` con mutación colateral persistida; (e) fuga de registro de otro tenant; (f) transición de estado prohibida aceptada; (g) filtro de listado ignorado; (h) regla sin fuente acreditada. Exigencia: **0 falsos `PASS**`.
2. **Controles contra falso `FAIL` (controles positivos sanos pareados):** por cada categoría anterior, un escenario legítimo y sano (persistencia real confirmada por N2, cálculo exacto correcto en dos locales, `403` limpio sin mutación, transición válida, caso `not_applicable` acreditado). Exigencia: los controles deterministas sanos deben producir `PASS` (o `SKIPPED` acreditado en `not_applicable`), **sin alarmas falsas**.
3. **Controles contra abstención excesiva (`INDETERMINATE` injustificado):** en escenarios donde sí existe fuente acreditada y testigo N2/N3 válido disponible, el evaluador debe resolver `PASS` o `FAIL` con precisión y **no** refugiarse en `INDETERMINATE`. Solo debe abstenerse en los controles negativos diseñados deliberadamente sin fuente, sin testigo o con contradicción de autoridad par.

### 6.5 Alternativas viables, riesgos residuales y criterios de aceptación (`AR-53`)

* **Alternativa viable:** Delegar la evaluación de reglas complejas y cálculos al modelo del HOST (LLM) en tiempo de ejecución. **Por qué se descarta como oráculo normativo:** introduce no-determinismo, errores aritméticos en punto flotante/tokens, rompe `DETERMINISTIC` (`D03`) y viola la separación de autoridad epistémica (`D05`/`AR-11`). El HOST puede *proponer* formalizaciones de reglas a partir de documentos, pero su evaluación en ejecución debe ser 100 % determinista en `@qap/core`.
* **Riesgos residuales:** Reglas de negocio descritas de forma ambigua en documentación empresarial obligarán a abstención hasta aclaración documental; esto es un comportamiento deseado (veracidad sobre cobertura aparente), no un defecto del motor.
* **Fase y criterio de aceptación/rechazo:** Contrato previo a G3/G4; validación en `E4`, `E5` y `E8`. **Aceptación:** 6 técnicas operativas sin bloqueo ciego; 0 falsos `PASS` en mutantes semánticos; 0 falsos `FAIL` en controles positivos deterministas; abstención exacta ante fuente ausente o conflicto par; integración regional `AR-45` verificada en ≥2 locales. **Rechazo:** uso de IEEE-754 en comparaciones monetarias, aceptación de ocultación UI como prueba RBAC, o promoción automática de observación del AUT a expectativa.

## 7. Contratos de integración con AV-03 y AV-05

| Interfaz | Dirección | Contrato entregado / consumido | Qué queda explícitamente fuera de AV-04 |
| --- | --- | --- | --- |
| **Agregación y salidas (`AR-08` → `AR-52`)** | AV-04 → AV-03 | Tabla total P0–P11 (§2.5), 4 ejes, 6 veredictos, `exit_code_schema_version: "2.0"` con clases disjuntas (`0`, `10–18`, `20`, `2`/`65–78`/`1`), `SemanticOutcomeProjection` JCS y reglas de inmutabilidad tras `EXPIRED_PRUNED`. | Selección de SDK MCP (`EXP-01a`), supervisor/IPC por SO (`AR-42`) y migración de consumidores CLI legados (`AV-07`). |
| **Elegibilidad, DAG y pausa (`AR-08/10/43` → `AR-05`)** | AV-04 ↔ AV-03 | AV-04 consume las 3 aristas DAG y estados operativos de `[invalid URL]` `AR-05` y provee la clasificación `C1–C5` de operaciones, `OperationIntent`, `failure_locus` y criterios de admisión de casos mutativos/BVA/RBAC. | Políticas de cuotas de disco y retención privada (`DE-01`/`AR-25`). |
| **Operaciones externas y datos (`AR-10` → AV-05)** | AV-04 → AV-05 | Puerto agnóstico `IExternalOperationPort` y `OperationDescriptor` (§4.4) con contrato de idempotencia, correlación, redacción y `AbortSignal`. | Selección de SDK UTCP/OpenAPI (`EXP-05`), parsers PDF/DOCX/Excel/OCR (`AR-13`/`AR-20`) y consultas cross-instancia (`AR-17`/`AR-18`). |
| **Oráculos de reportes/datos (`AR-09/53` → AV-05)** | AV-04 → AV-05 | Rúbrica causal N0–N3, `TypedRuleOracle` (decimal exacto, fechas IANA, redondeo, tolerancias con contexto `AR-45`), regla de abstención y localización de discrepancias para `REQ-AUTREP-001` (`D11`). | Evaluación de fórmulas Excel vs. caché `<v>`, reconstrucción tabular PDF multipágina y corpus de documentos empresariales (propios de AV-05). |

## 8. Protocolos experimentales propuestos (sin ejecución realizada)

*Ninguno de los siguientes protocolos ha sido ejecutado en esta etapa. Se definen como diseños reproducibles con dependencias reales de compuerta, alineados con `[invalid URL]` §E y `[invalid URL]`.*

### 8.1 Protocolo `E3` (dependencia AV-03 + AV-04): Continuidad E2E y corte tras efecto confirmado

* **Registros:** `AR-43`, `AR-10`, `AR-05`, `AR-42`. **Fase:** G3/G4.
* **Fixture:** Aplicación controlada con ≥3 módulos y ≥2 roles, cola durable y registro independiente de escrituras en el servidor del fixture.
* **Vectores:** (1) Corte abrupto del HOST durante paso 2 de un flujo E2E determinista de 3 módulos → verificar que el ejecutor completa pasos listos sin duplicar efectos; (2) Corte del ejecutor inmediatamente después del envío HTTP de una mutación C2 y antes de confirmar respuesta → verificar que la recuperación consulta testigo N2 correlacionado, adopta la entidad existente sin duplicar si fue confirmada, o reintenta solo si se acredita ausencia o idempotencia acreditada; (3) Reanudación por HOST B sin repetir onboarding ni pasos ya atestados.
* **Criterio de aceptación:** 0 efectos duplicados en servidor de fixture; 100 % de `OperationIntent` reconciliados o marcados explícitamente `INDETERMINATE`/`CLEANUP_UNKNOWN`; ramas independientes sin pérdida de progreso.

### 8.2 Protocolo `E4` (dependencia AV-03 + AV-04): Planificación DAG, aplicabilidad y casos multi-técnica

* **Registros:** `AR-43`, `AR-53`, `AR-05`, `AR-45`. **Fase:** G2/G4.
* **Vectores:** (1) Grafo de ≥3 módulos y ≥2 roles con aristas de éxito, finalización y reconciliación + inyección de ciclo (debe rechazarse antes de ejecutar); (2) Generación automática de casos positivos, negativos, BVA, transiciones de estado, RBAC y cálculo desde fuentes acreditadas sin aprobación humana por caso; (3) Siembra de `config_revision` donde 1 caso es `not_applicable` acreditado y 1 caso tiene fuente contradictoria de igual autoridad; (4) Cambio regional declarado en misma campaña (ES/EN + zona IANA distinta).
* **Criterio de aceptación:** Ciclo rechazado con 0 efectos; caso `not_applicable` clasificado `SKIPPED (NOT_APPLICABLE_ACCREDITED)`; conflicto par aislado como `INDETERMINATE` sin detener ramas hermanas; 0 bloqueos ciegos por categoría `bva`/`rbac_negative`.

### 8.3 Protocolo `E5` (núcleo AV-04): Veracidad funcional, testigos N0–N3, mutaciones y controles de falsación

* **Registros:** `AR-08`, `AR-09`, `AR-10`, `AR-43`, `AR-53`. **Fase:** G3/G5.
* **Vectores obligatorios (controles positivos y negativos pareados):**
1. *Persistencia y rollback:* (a) Mutación sana confirmada en servidor → testigo N2 (nuevo `BrowserContext` con `serviceWorkers: 'block'`, bypass caché) → `PASS (FUNCTIONAL_EFFECT, N2)`; (b) Mutación `HTTP 201` con rollback silencioso → testigo N2 → `FAIL`; (c) Mutación sin testigo N2 disponible aunque N1 muestre éxito → `INDETERMINATE`; (d) Mutación con Service Worker/caché/estado optimista sembrado que devuelve dato falso → rechazado como N2 (`INDETERMINATE` o `FAIL` según lectura fresca).
2. *HTTP y navegación:* (a) `navigate` recibiendo `HTTP 404`/`500` inesperado → impide `PASS`; (b) fallo de captura de `screenshot` requerida → impide `PASS` (`ERROR`/`INDETERMINATE`); (c) `HTTP 403` esperado con snapshot pre/post intacto → `PASS (N3)`; (d) `HTTP 403` con mutación oculta en servidor → `FAIL` crítico.
3. *Cálculos y región (`AR-45` + `AR-53`):* (a) Cálculo monetario exacto sano en 2 locales/zonas → `PASS (N3)`; (b) Mutante de 1 centavo y mutante de redondeo → `FAIL`; (c) Mutante de corte horario IANA → `FAIL`; (d) Regla sin fuente acreditada → `INDETERMINATE`.
4. *Datos y limpieza (`AR-10`):* (a) DAG de `DataPlan` C2 con limpieza inversa ejecutada 2 veces consecutivas → `CLEANED`, 0 residuos y 0 alteraciones en registros preexistentes ajenos; (b) Operación C3 compensada → `COMPENSATED`; (c) Fallo inyectado en limpieza tras `PASS` funcional → `CLEANUP_INCOMPLETE_OR_FAILED` (`exitCode = 13`); (d) Permiso de limpieza expirado → `PENDING_CLEANUP` (`13`); (e) Intento de escritura vía `GET` o GraphQL `mutation` en destino read-only → bloqueado fail-closed con 0 escrituras.
5. *Aislamiento de contexto (`AR-43`):* Sembrar cookie/localStorage en Caso 1 y verificar ausencia total en Caso 2; verificar que 4 tipos de `failure_locus` se clasifican correctamente.


* **Criterio de aceptación:** 0 falsos `PASS` en todos los mutantes y controles adversos; 0 falsos `FAIL` en controles positivos deterministas sanos; 0 abstenciones injustificadas en casos con testigo válido; 100 % de metadatos de testigo y 4 ejes persistidos.

### 8.4 Protocolo `E7` (cierre de paridad `AR-08` + `AR-52`): Paridad total MCP/CLI/CI

* **Registros:** `AR-08`, `AR-52`. **Fase:** G1 (invariantes) y G5 (certificación final de salidas).
* **Vectores:** Ejecutar los 18 escenarios de §2.6 sobre el mismo snapshot congelado y fixture restaurado vía MCP y vía CLI (incluyendo CI no interactivo sin TTY), más alteración de 1 byte post-publicación (`LOST_OR_TAMPERED`) y poda autorizada (`EXPIRED_PRUNED`).
* **Criterio de aceptación:** 18/18 coincidencias exactas de `SemanticOutcomeProjection` (digest JCS idéntico) y `cli_exit_code`; 0 colisiones con `USAGE = 2` y `sysexits`; `EXPIRED_PRUNED` preserva `origin_functional_verdict`; `LOST_OR_TAMPERED` fuerza código `18`.

### 8.5 Protocolo `E8` (custodia independiente, dependencia AV-08 / `DE-03`): Generalización ciega

* **Registros:** `AR-08`, `AR-09`, `AR-43`, `AR-53` (coordinado con `AR-06`, `AR-30`, `AR-44` en AV-08). **Fase:** G6.
* **Diseño:** Sobre el corpus ciego congelado por custodio independiente (sin umbrales definitivos cerrados en AV-04, sujetos a `DE-03`), verificar tasa de falsos `PASS` = 0 en defectos sembrados de persistencia/cálculo/RBAC, medición explícita de tasa de falsos `FAIL` en controles sanos y tasa de abstención injustificada (`INDETERMINATE` cuando existía testigo disponible), además de al menos un flujo E2E multirol/multimódulo por aplicación aplicable.

## 9. Separación estricta de bloqueantes

| Clase de bloqueante | Registros implicados | Condición concreta para levantar el bloqueo |
| --- | --- | --- |
| **Bloqueantes de planificación** | `AR-08`, `AR-09`, `AR-10`, `AR-43`, `AR-52`, `AR-53` | Aprobación por el Orquestador (previa contravalidación de Codex) de la tabla definitiva P0–P11 y esquema de códigos `2.0` (§2.5), la rúbrica causal N0–N3 (§3.2), el contrato `IExternalOperationPort` (§4.4) y el modelo `E2EFlowGraph` (§5.2). Las políticas concretas por destino real siguen condicionadas a `DE-04` y los umbrales de aceptación a `DE-03`. |
| **Bloqueantes de ejecución / selección** | `AR-08`, `AR-09`, `AR-10`, `AR-43`, `AR-52` | Antes de iniciar implementación de G3/G4: (1) congelar el DTO compartido `@qap/core` con 4 ejes, 6 veredictos y `exit_code_schema_version: "2.0"`; (2) implementar y probar en `E1` el `OperationIntent` con barrera WAL `FULL` (`AR-12`); (3) completar `EXP-05` en AV-05 antes de elegir SDK concreto detrás de `IExternalOperationPort`. Sin estrategia mutativa acreditada, toda operación C2–C5 permanece bloqueada (fail-closed). |
| **Bloqueantes de certificación / activación** | `AR-08`, `AR-09`, `AR-10`, `AR-43`, `AR-52`, `AR-53` | Acreditación experimental completa de `E3`, `E4`, `E5`, `E7` y `E8` con 0 falsos `PASS` en controles críticos, paridad 18/18 MCP/CLI/CI, validación de reportes reales PDF/Excel en AV-05, y ratificación empresarial expresa de `DE-03` (umbrales/corpus/custodio) y `DE-04` (destinos, operaciones C2–C5 y validación operativa pre-GA) antes de operar sobre cualquier entorno empresarial real. |

## 10. Recomendaciones y traspasos a AV-05 y AV-08

* **Hacia AV-05 (`AR-13`, `AR-17`, `AR-18`, `AR-20`, `AR-38`, `AR-48`, `AR-50`):**
1. Adoptar `IExternalOperationPort` y `OperationDescriptor` (§4.4) como frontera única para conectores UTCP y OpenAPI en `EXP-05`, prohibiendo reintentos mutativos internos dentro del adaptador.
2. Integrar `TypedRuleOracle` (decimal exacto, fechas IANA, políticas de redondeo y contexto regional `AR-45`) dentro del validador de reportes PDF/Excel (`REQ-AUTREP-001`), diferenciando `cached_value`, `declared_formula`, `independently_computed_value` y `business_expected_value`, y aplicando abstención `INDETERMINATE` cuando falte extracción tabular o fórmula soportada.
3. En consultas cross-instancia (`AR-18`), aplicar la clase `C1` (`READ_ONLY_ACCREDITED`) con verificación obligatoria de autoridad read-only en el destino (`AR-31`) y filtro anti-PII hacia `TestDataManager`.


* **Hacia AV-08 (`AR-06`, `AR-30`, `AR-35`, `AR-44`):**
1. Incorporar en `E8` las tres métricas pareadas de AV-04: 0 falsos `PASS` en mutantes críticos (veto absoluto), medición explícita de tasa de falsos `FAIL` sobre controles positivos sanos y medición de abstención injustificada (`INDETERMINATE` cuando existía testigo válido).
2. Mantener la distinción de `AR-08` entre `passed_functional` (N2/N3) y `passed_structural` (N1) en todos los denominadores de aceptación (`D21`), impidiendo que comprobaciones estructurales inflen la métrica de verificación de efectos.



## 11. Decisiones empresariales abiertas (sin ratificar)

Se conservan intactas y abiertas `DE-01`–`DE-05`. Únicamente se registran dos precisiones que requieren decisión empresarial real del propietario en su momento (sin preguntas técnicas):

1. **En `DE-04` (Política de mutación y limpieza por destino empresarial):** Para cada entorno QA empresarial candidato a validación futura, qué clases de operación (`C2` borrable, `C3` compensable, `C4` confinada en tenant desechable, o `C5` financiera/irreversible) quedarán habilitadas y bajo qué operación compensatoria o tenant desechable expresamente autorizados.
2. **En `DE-03` (Umbrales de aceptación en `E8`):** Qué cota máxima tolerable de falsos `FAIL` y de abstención injustificada (`INDETERMINATE` con testigo disponible) se ratifica para el corpus ciego independiente junto con la calibración de las referencias candidatas de 80 % Discovery y 75 % verificación de efectos (`D21`).

## 12. Bloque de actualización documental del Registro Maestro

*Conservación estricta de las **57 entradas** del Registro Maestro (`[invalid URL]`) y sus estados principales vigentes (**6 `VALIDADA`, 17 `VALIDACIÓN EXPERIMENTAL PENDIENTE`, 26 `PENDIENTE`, 8 `BLOQUEANTE**`). Ningún estado principal cambia por mera entrega documental; no se añaden entradas duplicadas ni nuevas obligaciones fuera del catálogo.*

```markdown
### Actualización sugerida para `docs/qap-architecture/cierre-av-01/registro-maestro.md`

#### En sección `## Estados vigentes` (añadir al párrafo narrativo sin modificar los conteos 6 / 17 / 26 / 8 = 57)
En AV-04, Gemini Neon publicó el informe principal sobre `979f3024` cubriendo los cinco registros asignados (`AR-08`, `AR-09`, `AR-10`, `AR-43`, `AR-53`) junto con la tabla definitiva de agregación y códigos disjuntos para `AR-52`, las clases de operación/reconciliación para `AR-05` y el contrato de datos/oráculos hacia AV-05. Los estados principales de AV-04 permanecen en 3 bloqueantes (`AR-08`, `AR-09`, `AR-43`) y 2 pendientes (`AR-10`, `AR-53`). Quedan abiertas la contravalidación independiente de Codex, la decisión del Orquestador, las compuertas experimentales (`E3`, `E4`, `E5`, `E7`, `E8`) y la ratificación empresarial de `DE-01`–`DE-05`.

#### En `### AR-05` (añadir línea de integración AV-04)
**Integración AV-04.** Clases de operación `C1–C5`, `OperationIntent` durable, `failure_locus` y tabla definitiva de agregación/cierre parcial entregados en informe AV-04 (`AR-08`/`AR-10`/`AR-43`). Pendiente contravalidación Codex, decisión del Orquestador y validación experimental (`E3`/`E4`).

#### En `### AR-52` (añadir línea de integración AV-04)
**Integración AV-04.** Tabla total mutuamente excluyente (`P0–P11`), esquema de códigos CLI/CI disjuntos `2.0` (`0`, `10–18`, `20`, preservando `2` y `65–78` de invocación), 18 vectores de paridad y `SemanticOutcomeProjection` JCS entregados en informe AV-04 (`AR-08`). Pendiente contravalidación Codex, decisión del Orquestador y certificación en `E1`/`E7`.

#### En `### AR-08` (añadir bloque de auditoría principal AV-04; mantener Estado: BLOQUEANTE)
**Auditoría principal AV-04.** Taxonomía cerrada de 6 veredictos y 4 ejes ortogonales (`PASS_STRUCTURAL` retirado como 7.º veredicto y sustituido por `verification_scope = STRUCTURAL` + N1). Tabla total de agregación intento→caso→flujo→campaña (`P0–P11`) con clases numéricas CLI/CI disjuntas (`2.0`), exclusión de éxito funcional ante campañas estructurales, vacías, incompletas o con limpieza fallida/pendiente, diferenciación `MISSING_REQUIRED` / `SUPPRESSED_BY_POLICY` / `EXPIRED_PRUNED` (inmutable) / `LOST_OR_TAMPERED`, 18 ejemplos y proyección semántica JCS. **Contravalidación Codex.** Pendiente. **Validación experimental.** Pendiente (`E1`/`E5`/`E7`).

#### En `### AR-09` (añadir bloque de auditoría principal AV-04; mantener Estado: BLOQUEANTE)
**Auditoría principal AV-04.** Rúbrica causal `N0–N3` por afirmación y riesgo (5 propiedades: independencia causal, correlación unívoca, frescura, autoridad/alcance y control de causa común `shared_dependency_risk`) sin exigir BD del AUT. Diferencia ausencia de efecto acreditada (`FAIL`) de incertidumbre/ausencia de oráculo (`INDETERMINATE`) y fallo técnico de testigo (`ERROR`), rechaza `HTTP 201` como `PASS` y `403`/`500` como veredicto automático, integra convergencia eventual (`REQ-ORA-001.6`) y acota `R2.1–R2.4`. **Contravalidación Codex.** Pendiente. **Validación experimental.** Pendiente (`E5`/`E8`).

#### En `### AR-10` (añadir bloque de auditoría principal AV-04; mantener Estado: PENDIENTE)
**Auditoría principal AV-04.** Estrategia de `DataPlan` DAG con `TestDataManager` anti-PII, `OperationIntent` durable previo al efecto (WAL `FULL`), reconciliación obligatoria de efectos inciertos sin reintento ciego, matriz por clases `C1–C5` (`delete` idempotente 2x sin alterar registros ajenos, `compensate`, `confine_tenant` y bloqueo por defecto de operaciones financieras/irreversibles), solo lectura acreditada en producción y puerto `IExternalOperationPort` hacia AV-05 sin elegir SDK. `DE-04` permanece abierta. **Contravalidación Codex.** Pendiente. **Validación experimental.** Pendiente (`E3`/`E5`/`EXP-05`).

#### En `### AR-43` (añadir bloque de auditoría principal AV-04; mantener Estado: BLOQUEANTE)
**Auditoría principal AV-04.** Modelo `E2EFlowGraph` multirol/multimódulo (piso de verificación ≥3 módulos / ≥2 roles, sin límite de producto), `BrowserContext` aislado por caso/rol (`ProfileBinding`), `TypedDataTransfer`, aristas DAG alineadas con `AR-05`, rechazo de ciclos, localización en 4 clases (`PREPARATION_FAILURE`, `APPLICATION_DEFECT`, `ENVIRONMENT_FAILURE`, `EVIDENCE_OR_WITNESS_FAILURE`), concurrencia segura por `resource_lock_keys`, corte/handoff entre agentes y limpieza inversa. **Contravalidación Codex.** Pendiente. **Validación experimental.** Pendiente (`E3`/`E4`/`E5`/`E8`).

#### En `### AR-53` (añadir bloque de auditoría principal AV-04; mantener Estado: PENDIENTE)
**Auditoría principal AV-04.** Sustitución del bloqueo ciego de `bva`/`rbac_negative` por elegibilidad basada en fuente acreditada, aplicabilidad (`applicable`/`not_applicable`/`indeterminate`) y oráculo tipado. Cobertura de 6 técnicas, RBAC/tenant acreditado con no-mutación pre/post (`REQ-ORA-001.5`, nunca ocultación UI), aritmética decimal exacta y fechas/redondeo integrados al contexto regional `AR-45`, separación epistémica anti-tautología, controles pareados anti-falso-`PASS`/anti-falso-`FAIL`/anti-abstención y traspaso de reportes PDF/Excel a AV-05 sin reducir obligación. **Contravalidación Codex.** Pendiente. **Validación experimental.** Pendiente (`E4`/`E5`/`E8`).

```