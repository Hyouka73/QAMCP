# VNEXT-013-R5 — Cobertura canónica y cierre seguro de módulos

Fecha: 2026-10-31. Base verificada local/remota:
`7a906005c98afbdc9623762f1ee4e6035c9a781d`.
Rama exclusiva: `feat/qap-vnext-architecture`. Un agente principal.

**Estado: completada con limitaciones.** Cierre canónico seguro y evaluación
tripartita de cobertura sobre requisitos confirmados, inventario determinista de
brechas, compuerta de revisión humana del host y persistencia cifrada opt-in en
SQLite.

**Limitaciones explícitas de R5:**
- Cero ejecución de tests / suites E2E automáticas: `ExecutionCoverageSummary.status = 'not_executed'`,
  0 pasados, 0 fallados, 0 omitidos, 0 `ConformityAssessment.pass`. La ejecución de pruebas
  y certificación de conformidad en tiempo de ejecución queda reservada exclusivamente
  para VNEXT-014.
- No incluye interfaz gráfica (UI) humana de producción ni autenticación OAuth/OIDC:
  el gateway de revisión (`IModuleClosureReviewGateway`) es un puerto privilegiado
  inyectado por el host en el proceso.
- Esquema canónico v2 de SQLite en `@qap/knowledge` congelado: no se alteran tablas ni se
  añaden migraciones a `knowledge-sqlite-schema.ts`. El cierre durable reside en base separada.
- Catálogo de herramientas MCP congelado en exactamente 18 herramientas: se reutiliza
  la herramienta existente `qap_module_close` con la ruta explícita `canonical_closure`,
  sin añadir herramientas al catálogo.

---

## 1. Problema de continuidad y separación de planos epistémicos

En R3 y R4 se implementó la captura y persistencia durable de requisitos confirmados
mediante entrevistas e interacción estructurada. Sin embargo, antes de R5:
1. No existía un mecanismo formal para certificar la suficiencia de requisitos
   frente a un módulo antes de autorizar su cierre en el plan de trabajo.
2. Los modelos legacy permitían "cerrar" módulos mediante heurísticas de conteo de
   líneas YAML o waivers sin justificación sustantiva.
3. Existía el riesgo crítico de degradación (Invariante D-011): confundir hipótesis
   u observaciones empíricas no revisadas con requisitos de negocio formalmente
   confirmados por el operador.
4. Un módulo cerrado indebidamente o en falso permitía avanzar la sesión a `WRAP_UP`
   sin que el usuario o el host hubieran validado la cobertura del módulo.

R5 resuelve esto estableciendo una evaluación tripartita formal de cobertura, un
inventario reproducible de brechas con taxonomía estricta, un protocolo de cierre
en dos fases (2-Phase CAS) con recibo durable de relación, y compuertas de seguridad
tanto en `qap_module_close` como en `qap_session_close`.

---

## 2. Modelo de cobertura tripartita y anti-acreditación

El modelo formal reside en `@qap/shared/src/domain/coverage-models.ts` y valida sus
invariantes en `invariants-validator.ts`:

### A. Cobertura de especificación (`SpecificationCoverage`)
Evalúa la suficiencia de requisitos confirmados sobre las 7 categorías formales canónicas:
- `proposito`
- `alcance`
- `comportamiento_esperado`
- `criterios_aceptacion`
- `datos_entrada`
- `datos_salida`
- `seguridad_y_permisos`

Cada categoría se evalúa independientemente. Una categoría solo se considera `confirmed`
si cuenta con al menos un requisito con `validation_status === 'confirmed'`, origen
`developer_interview` y verificación `human_review` (Invariantes D-011 y R1). Si solo
existen borradores o hipótesis, la categoría permanece `draft` o `unspecified`.
No se permite "renuncia general": la renuncia individual de una categoría exige una
justificación descriptiva de al menos 15 caracteres. La renuncia simultánea de las 7
categorías es rechazada como inválida.

### B. Cobertura de revisión (`ReviewCoverage`)
Registra la atestación formal y vinculante provista por el host a través del
`IModuleClosureReviewGateway`. Incluye:
- `gateway_decision_id`: Identificador determinista de la decisión.
- `reviewed_by`: Identidad del revisor humano atestada por el host.
- `reviewed_at`: Marca temporal ISO UTC de la revisión.
- `status`: Estado de la decisión (`approved` | `rejected`).
- `coverage_digest`: Hash SHA-256 de la evaluación de cobertura presentada al revisor.

### C. Resumen de ejecución (`ExecutionCoverageSummary`)
En R5, la ejecución de pruebas NO está certificada:
- `status: 'not_executed'`
- `total_cases: 0`, `passed: 0`, `failed: 0`, `skipped: 0`
- `conformity_assessments: []`
Cualquier intento de emitir `ConformityAssessment.pass` o certificar ejecución en R5 es
bloqueado por los validadores de invariantes (`validateCoverageAssessmentInvariants`).

---

## 3. Taxonomía de brechas canónicas (`CanonicalGap`)

Cuando una categoría de especificación carece de cobertura suficiente o presenta
inconsistencias, el servicio genera un inventario reproducible de brechas estructuradas.
Se definen 8 tipos de ausencia (`GapAbsenceType`):
1. `no_observations_matching_category`: No existen observaciones empíricas ni requisitos para la categoría.
2. `unconfirmed_observation_hypothesis`: Existen observaciones en el grafo, pero permanecen en estado de hipótesis sin confirmación humana.
3. `unconfirmed_candidate_target`: Se detectaron candidatos o rutas en el crawling pero no han sido validados como requisitos.
4. `conflicting_observations`: Existen observaciones empíricas contradictorias sobre el mismo comportamiento o interfaz.
5. `dynamic_route_unreachable`: Una ruta o vista asociada al módulo resultó inalcanzable durante la exploración dinámica.
6. `auth_boundary_unverified`: Las fronteras de autenticación o roles requeridos por el módulo no fueron verificadas.
7. `non_deterministic_behavior`: El comportamiento observado ante el mismo estímulo difiere entre ejecuciones sucesivas.
8. `insufficient_evidence_density`: Las evidencias asociadas no alcanzan la densidad mínima requerida para sustentar la categoría.

Cada brecha contiene: `id`, `category`, `absence_type`, `severity` (`critical` | `warning` | `info`),
`description`, `impact` y `reproducible_evidence_ids`.

---

## 4. Almacenamiento seguro SQLite (`SqliteModuleClosureStore`)

Siguiendo el principio de aislamiento establecido en R4, el estado durable de cierres
reside en una base SQLite separada administrada por el host, sin tocar la base
canónica de Knowledge ni alterar su esquema v2.

### Esquema v1
- `closure_meta`: Tabla clave-valor con metadatos de esquema (`schema_version = 1`),
  identidad de proyecto, aplicación, entorno y marca temporal de aprovisionamiento.
- `closure_history`: Tabla inmutable con snapshots cifrados:
  - `generation`: Entero autoincremental monótono.
  - `module_key`: Clave canónica del módulo (`app_id:module_name`).
  - `decision_id`: UUID de la decisión de cierre.
  - `status`: Estado del cierre (`closed` | `waived`).
  - `ciphertext`: Payload serializado cifrado.
  - `iv`: Vector de inicialización / nonce de 12 bytes.
  - `tag`: Tag de autenticación GCM de 16 bytes.
  - `created_at`: Marca temporal UTC.

### Cifrado en reposo (AES-256-GCM)
- Clave de 32 bytes provista por el host fuera de la base de datos.
- Nonce aleatorio de 12 bytes por snapshot.
- Datos asociados autenticados (AAD): `scope_digest + generation + module_key`.
- Limpieza explícita de búferes de clave en memoria al cerrar la conexión.

---

## 5. Protocolo de cierre en dos fases (2-Phase CAS) y no-mutación de revisión

El `CanonicalClosureService` implementa una máquina de estados segura con control
de concurrencia optimista:

### Fase 1: Pre-condiciones y evaluación
1. Resolución de identidad canónica del módulo mediante `ModuleObservationBridge.resolve()`.
2. Evaluación determinista de cobertura (`CanonicalCoverageService.evaluate()`).
3. Detección de brechas críticas no autorizadas: si existen brechas críticas y `accept_gaps !== true`,
   el cierre se bloquea antes de consultar al gateway.
4. Consulta al host review gateway (`IModuleClosureReviewGateway`): si no hay gateway inyectado,
   se bloquea con `closure_review_gateway_required`.
5. Si el revisor rechaza, la decisión se persiste como rechazo consumido y se bloquea el cierre.

### Fase 2: Commit atómico en dos almacenes
1. **Paso 1: Commit en `closureStore`**:
   - `BEGIN IMMEDIATE` con `busy_timeout=0`.
   - Verificación de no-existencia previa o idempotencia.
   - Si otra conexión compite, retry diferido (60 ms) para serialización ordenada.
   - Escritura de registro inmutable en `closure_history`.
   - `COMMIT`.
2. **Paso 2: Registro de recibo en `IKnowledgeStore` (Amendment 3)**:
   - **Regla no negociable de Amendment 3**: `module.revision` **NO** debe incrementarse en el cierre.
     El puente `ModuleObservationBridge.resolve()` verifica que `module.revision === link.moduleRevision`.
     Incrementar la revisión del módulo rompería de forma irrevocable la resolución del puente.
   - En su lugar, el recibo durable se persiste como una entidad de tipo `relation`:
     - `id: "closure:" + decisionId`
     - `expected_revision: 0` (relación nueva)
     - `source: module.id`
     - `target: application.id`
     - `relation_kind: "related_to"`
     - `role: "closure_receipt"`
     - `metadata`: Contiene `decision_id`, `status`, `coverage_digest`, `reviewed_at`.
   - Esto acredita físicamente el cierre en la base canónica sin alterar la revisión del módulo.

---

## 6. Autoreconciliación y recuperación ante caídas (Crash Scenarios)

El sistema contempla y verifica físicamente cuatro escenarios críticos de caída y concurrencia:

1. **Escenario 1: Salida de proceso o caída antes del commit**:
   - Una salida abrupta del proceso (p. ej. `exit(11)`) antes de `COMMIT` provoca que SQLite
     revierta automáticamente la transacción no comprometida al reabrir la base.
   - Ni `closureStore` ni Knowledge conservan datos parciales.
2. **Escenario 2: `closureStore` comprometido pero fallo en Knowledge (Self-Healing Reconciler)**:
   - Si el proceso cae después del commit en `closureStore` pero antes de escribir el recibo en Knowledge:
   - Al ejecutar `evaluate()` o un nuevo intento de cierre, el reconciliador detecta que el módulo
     está cerrado en `closureStore` pero carece del recibo `closure:<id>` en Knowledge.
   - El reconciliador emite automáticamente el recibo faltante sin exigir una segunda aprobación
     humana al gateway, restaurando la coherencia entre ambas bases.
3. **Escenario 3: Base corrupta, clave incorrecta o esquema ajeno**:
   - Un archivo dañado, tag de autenticación inválido o clave incorrecta provoca rechazo inmediato
     con código de error tipado (`corrupt`, `wrong_key`, `incompatible`).
   - El servidor **nunca** cae silenciosamente a un modo en memoria (RAM fallback prohibido).
4. **Escenario 4: Competencia concurrente entre conexiones (CAS)**:
   - Dos conexiones independientes intentando cerrar el mismo módulo compiten por el lock exclusivo.
   - Una conexión adquiere el lock y compromete el cierre; la segunda conexión detecta `conflict`,
     reintenta tras un retardo de 60 ms, comprueba el estado persistido por la primera y retorna
     exitosamente con `idempotent: true`.

---

## 7. Integración MCP y compuertas de seguridad

### `qap_module_close`
- Incorpora la propiedad `canonical_closure` en su JSON Schema.
- Ruta explícita: Si `canonical_closure` está presente, delega en `CanonicalClosureService`.
- **Prevención de degradación legacy (Amendment 4)**: Si un módulo vinculado canónicamente es
  llamado en `qap_module_close` sin `canonical_closure`, se bloquea de inmediato con:
  ```json
  {
    "status": "blocked",
    "code": "canonical_closure_required",
    "razon": "Este módulo requiere cierre canónico mediante canonical_closure."
  }
  ```
  Esto impide que un módulo del nuevo plano canónico se cierre inadvertidamente con los
  mecanismos legacy de YAML y waivers no estructurados.

### `qap_session_close`
- Incorpora una compuerta de validación canónica:
  Antes de permitir el cierre de sesión y la transición a `WRAP_UP`, consulta
  `CanonicalClosureService.allModulesClosed()`.
- Si existen módulos canónicos planificados que no han sido cerrados ni renunciados, la llamada
  queda bloqueada con código `canonical_module_closure_required`, listando los módulos no cerrados
  y guiando al usuario a cerrarlos formalmente antes de concluir.

### `qap_status`
- Proyecta en `canonical_modules` la propiedad `plannedName` y la sección `closure`:
  - `status`: `'unclosed' | 'closed' | 'waived'`
  - `closed_at`: Marca temporal de cierre si aplica.
  - `decision_id`: ID de la decisión si aplica.
  - `receipt_id`: ID del recibo canónico en Knowledge si aplica.

---

## 8. Verificación y matriz de pruebas físicas

### Pruebas de R5 añadidas
1. **`packages/shared/src/__tests__/domain/canonical-coverage-invariants.test.ts`**:
   - 16 pruebas unitarias completas que validan:
     - Comandos de cierre válidos e inválidos (`validateCanonicalClosureCommand`).
     - Taxonomía estricta de brechas (`validateCanonicalGap`).
     - Decisiones de aplicabilidad de categorías (`validateCategoryApplicabilityDecision`).
     - Invariantes anti-acreditación y anti-tamper (`validateCoverageAssessmentInvariants`).
2. **`packages/mcp/src/__tests__/canonical-coverage.test.ts`**:
   - 25 pruebas físicas integradas que cubren 6 suites y 4 escenarios de caída:
     - Suite 1: Evaluación canónica de cobertura y brechas frente a requisitos confirmados.
     - Suite 2: Compuerta de revisión humana del host (`approved` y `rejected`).
     - Suite 3: Persistencia cifrada durable en SQLite (`SqliteModuleClosureStore`).
     - Suite 4: Cierre canónico seguro en dos fases y recibos de relación.
     - Suite 5: Compuertas MCP en `qap_module_close` y `qap_session_close`.
     - Suite 6: Proyección de estado en `qap_status`.
     - 4 Escenarios de caída: Rollback en exit prematuro, autoreconciliación, detección de corrupción, y CAS concurrente.

### Resumen de ejecución y trazabilidad

| Paquete / Verificación | Pruebas / Estado | Notas |
| --- | ---: | --- |
| `@qap/shared` | **162 / 162 pasadas** (17 archivos) | 16 nuevas de invariantes R5 |
| `@qap/knowledge` | **258 / 258 pasadas** (25 archivos) | Esquema v2 SQLite intacto |
| `@qap/engine` | **168 / 168 pasadas** (11 archivos) | Transiciones y contratos estables |
| `@qap/mcp` (Nuevas R5) | **25 / 25 pasadas** (1 archivo) | Pruebas físicas y de caídas R5 |
| `@qap/mcp` (Entrevistas R3/R4) | **63 / 63 pasadas** (2 archivos) | 42 de R3 + 21 de R4 intactas |
| `@qap/mcp` (Discovery + Dispatcher + State) | **124 / 124 pasadas** (4 archivos) | 57 discovery + 46 dispatcher + 21 state |
| `@qap/mcp` (Baseline legacy) | **58 fallos baseline conservados** | 21 Clase A, 32 Clase B, 5 Clase D (R01–R60) |
| Builds monorepo (`pnpm -r build`) | **10 / 10 paquetes compilados** | Exit code 0, sin errores TypeScript |

---

## 9. Próximos pasos autorizados y límites

- **VNEXT-013-R5 queda completada con limitaciones.**
- **No iniciar VNEXT-014**: La ejecución real de pruebas, compilación de suites Playwright,
  y emisión de `ConformityAssessment` pertenecen a VNEXT-014 y requieren autorización expresa
  posterior.
- Detener el flujo tras entregar la fase C con el informe de handoff.
