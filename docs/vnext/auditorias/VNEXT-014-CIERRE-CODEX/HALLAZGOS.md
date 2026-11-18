**Auditoría independiente. Fecha: 2026-11-05, America/Mexico_City. Código probado: `76a338855f342a70acb184da5fbd7256dd980669`. Base correctiva: `e4d7fbc2c6e4525b4e5fab38ec22e0cd365305d6`. Rama: `fix/vnext-014-cierre-controlado`.**

# Hallazgos reproducidos

Se agrupan síntomas por causa; las 55 garantías legacy y la deuda de lint/typecheck se registran como compuertas heredadas, sin inventar 55 defectos productivos nuevos.

## 014-CODEX-001 — P1: mensaje interno expuesto por MCP

**Identidad:** `canonical-coverage.test.ts · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) VNEXT-014-CF01: unexpected closure persistence errors propagate without a false consistency block` pasa, pero no verifica el borde RPC. Sonda exacta `cf01-probes.mjs / head / mcp_sanitization`.

**Esperado:** excepción real, sin convertirla en bloqueo recuperable; respuesta al cliente con código estable y detalle sanitizado. **Real:** `isError:true` y texto `Error ejecutando qap_module_close: synthetic_disk_error C:/synthetic/PRIVATE_PATH token=SYNTHETIC_CANARY_014`. El control con servicio de la base no filtra el canary porque respondía blocked. El objetivo de CF01 requiere mantener propagación interna y sanitizar al cruzar MCP.

**Reproducción mínima:** fixture físico; envolver IModuleClosureStore.transaction para lanzar Error con un marcador sintético; registrar ese store en knowledgeBindings.moduleClosureStore; llamar qap_module_close con canonical_closure. El SDK real/InMemoryTransport recibe el marcador. Mismo escenario/control con fuente exacta del servicio base: canaryLeaked=false; HEAD: true. No es una prueba de robo de credenciales reales.

**Responsables:** packages/mcp/src/handlers/canonical-closure-service.ts, persistWithKnowledgeFence (throw final, líneas 927–929); packages/mcp/src/server.ts, catch externo de CallTool (3676–3685), interpola err.message. **Causa demostrada:** nuevo throw alcanza un catch preexistente que transmite mensajes arbitrarios del puerto. **Impacto:** frontera de confidencialidad; rutas o datos de infraestructura contenidos en mensajes pueden llegar al agente MCP.

**Corrección mínima propuesta:** transformar excepciones inesperadas en error MCP sanitizado y tipado en el borde, conservando causa solo para diagnóstico controlado; no volver a blocked para todo. **Regresiones:** CF01 servicio, negativa RPC con canary/ruta/token sintéticos, códigos tipados de conflicto/expiry, A01/A02/C01 y ausencia de writes.

## 014-CODEX-002 — P2: tres regresiones de respuesta, datos protegidos

**Identidades exactas:**

- `src/__tests__/canonical-coverage.test.ts · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R9-A02: writing a requirement after final validation cannot persist an obsolete approval`
- `src/__tests__/canonical-coverage.test.ts · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R9-A02: both close and waive reject concurrent Knowledge writes before durable commit`
- `src/__tests__/canonical-coverage.test.ts · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R10-A01: a direct filesystem mutation before closure transaction fails the fingerprint guard`

**Esperado:** resolución blocked/closure_consistency_conflict, sin approval/receipt obsoletos. **Real:** las dos primeras rechazan KnowledgeStoreError.UNAVAILABLE; la tercera rechaza ClosureStoreError.write_failed. Las tres fallan en focal, serial y ambos paralelos. **No se demuestra bypass de integridad.** Las sondas comprueban snapshot Closure intacto, cero receipts y requisito rev.1; el drift raw de lifecycle es la mutación adversaria intencional y no una escritura del cierre.

**Reproducción mínima:** ejecutar canonical-coverage.test.ts sin editarlo. En los dos primeros tests el wrapper de Closure.transaction intenta f.store.commit mientras la misma conexión mantiene BEGIN IMMEDIATE del fence. SqliteKnowledgeAdapter.transaction intenta otro BEGIN y normaliza el error no tipado como UNAVAILABLE. El callback no llega a Closure. En el tercero, mutar lifecycle.session.id antes del callback de Closure: la verificación de fingerprint lanza closure_context_changed; SqliteModuleClosureStore.transaction hace rollback y reemplaza el error por write_failed; el mensaje original deja de ser identificable por el nuevo catch.

**Responsables:** canonical-closure-service.ts persistWithKnowledgeFence; knowledge/src/storage/sqlite-knowledge-adapter.ts transaction (307–319); mcp/src/handlers/module-closure-store.ts transaction (219–264). **Causa demostrada:** clasificación estrecha de CF01 sobre adapters que borran la distinción entre conflicto reconocido y fallo interno. Sondas idénticas con servicio base retornan blocked; con HEAD rechazan. El control no es una suite completa del SHA base.

**Impacto:** contrato de error y compatibilidad de garantías anteriormente aprobadas; el estado permanece fail-closed. La composición que escribe por la misma conexión dentro de su fence es reentrante y necesita una decisión explícita del puerto; no debe declararse un fallo real de disco. **Corrección mínima propuesta:** preservar tipado/causa reconocible de drift y definir rechazo de operación reentrante de forma explícita; decidir y probar la correspondencia exacta al protocolo. No mapear indiscriminadamente UNAVAILABLE/write_failed a conflicto ni editar expectativas para ocultar el cambio. **Regresiones:** las tres identidades intactas, error genérico de disco, CONFLICT/expiry, context drift, CAS, fence ausente, C01 y las siete migradas.

## 014-CODEX-003 — P2: 7.5 falla en setup antes de probar procedencia

**Identidad:** `src/__tests__/adversarial-r5-guarantees.test.ts · Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 7: CAS Concurrency Stress-Testing 7.5: Rejects write error recovery if existing receipt has tampered provenance or mismatched entity`.

**Esperado:** sembrar un recibo de procedencia falsa, ejecutar waiver, rechazarlo, conservar lifecycle WORKING/planned y no acreditarlo como autorización válida. **Real:** KnowledgeStoreError.INVALID_DATA en adversarial-r5-guarantees.test.ts:1355 durante el commit de preparación. El módulo del atacante usa certainty: 'unconfirmed' (1364). knowledge-shape.ts:19 solo permite observed/inferred/confirmed/pending_review. TypeScript también lo marca TS2820, ya existente en el SHA base.

**Causa demostrada:** MemoryKnowledgeStore validaba un subconjunto permisivo y admitía ese enum; la migración SQLite aplica validación estructural real. El primer bloqueo sin fence ocultaba el problema posterior. No hay limitación ambiental ni recibo sembrado en el test original. **Reproducción:** comando focal adversarial; la misma identidad falla en las tres MCP.

**Aislamiento sin modificar tests:** el arnés separado primero confirma INVALID_DATA con el valor original y después usa observed en su propio módulo sintético. El servicio rechaza closure_receipt_provenance_invalid; tras cerrar y reabrir ambas SQLite mantiene WORKING/planned, recibo del atacante intacto y rechazo en retry. Existe una aprobación/cierre canónico auténtico del gateway sintético previo al fallo del receipt; no existe rollback entre las bases, ni se declara válido el recibo del atacante. Ese estado parcial es visible, no una segunda autorización.

**Impacto:** falsa impresión de que la suite migrada ya certifica el negativo más importante de procedencia. **Corrección mínima propuesta:** reparar únicamente la entidad de preparación para satisfacer el esquema físico, conservar el recibo adversario y todas las expectativas; añadir readback tras reapertura y conteo de autoridad. **Regresiones:** 7.5 original corregido por el implementador, RES-CODEX-A02, tamper source/target/revision, receipt recovery y C01. El auditor no aplicó esa corrección.

## 014-CODEX-004 — P2: E01 intermitente, cleanup antes del drenaje

**Identidades con PASS serial/B y FAIL paralelo A:**

- `src/__tests__/p4-2-pregunta-contract.test.ts · P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) Criterio 4.3: Progresión canónica fuente_de_verdad -> objetivo -> roles -> flujos_criticos -> SCOPING`; 5.386 s.
- `src/__tests__/test-handler.test.ts · TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) Scenario 1: executes valid and authorized plan, persisting authentic result (R4.1)`; 5.185 s.
- `src/__tests__/test-handler.test.ts · TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) Scenario 4: in-memory snapshot prevents TOCTOU tampering of YAML files after verification (R4.4)`; 5.041 s.

**Esperado:** mismas garantías con paralelismo predeterminado y terminación de tareas/locks antes de borrar temporales. **Real:** tres timeouts Vitest de 5000 ms y una excepción no manejada ENOENT/ECOMPROMISED sobre project-root-*/.qa/cache/locks/orders.lock. La última prueba mencionada por Vitest fue Scenario 5; no se le atribuye automáticamente el origen. El lock orders corresponde a un runner que seguía activo en el entorno con cleanup tras timeout.

**Responsables:** test-handler.test.ts afterEach (154–163) borra raíces sin un registro de operaciones/abort+drenaje; runner.ts execute mantiene LockManager durante la operación; knowledge/src/storage/lock-manager.ts:38–45 establece heartbeat de 5000 ms; proper-lockfile invoca por defecto onCompromised que lanza. **Causa demostrada del error de cleanup:** adquirir el lock oficial orders y borrar exclusivamente su raíz sintética antes de liberar reproduce el mismo ENOENT/ECOMPROMISED a los 5 s. Código completo y salida en EVIDENCIA_FISICA. **Hipótesis pendiente:** qué parte del arranque/ejecución bajo carga provoca la demora inicial; no se atribuye todavía a CPU, antivirus, SQLite o Chromium específicos.

**Impacto:** corrida no determinista, excepción fuera de la promesa del test y riesgo de residuos/lecturas tardías de fixtures; E01 no certificable. No se reprodujo EPERM de rename ni deadlock en estas corridas. No se infiere solución universal de ReplaceGate ni de lectores externos/synchronous commit.

**Corrección mínima propuesta:** usar la cancelación soportada, registrar y drenar las tareas del runner antes de borrar raíces, preservar el error original del test y gestionar lock compromises de forma observable; instrumentar el tramo lento y corregir su causa antes de cambiar presupuestos. **Regresiones:** las tres identidades con carga, cleanup tras timeout/abort, Runner71, Knowledge260, dos MCP completas predeterminadas. No aumentar timeouts para ocultar el resultado.

## Deuda y compuertas que no se convierten en defectos nuevos

- 55 legacy: mismo primer bloqueo; identidad reconciliada, garantía funcional posterior no certificada. E0a/E1/E2/E3/Criterio9 siguen fallando. No se autorizó declarar obsoleto ningún test. Tres contratos de presentación requieren decisión explícita.
- ESLint global conserva 34 errores/28 warnings. Los tres archivos modificados tienen cero diagnósticos en base y HEAD; las rutas con los 62 diagnósticos tienen contenido idéntico al SHA base. No se declara lint global PASS.
- Typecheck MCP incluye 125 diagnósticos heredados (rootDir, tipos de fixtures y otros). Se contrastaron los tres cambios virtualmente contra la base; no se demostraron altas semánticas. El enum inválido de 7.5 ya existía y ahora afecta runtime.
- A04-W01: contrato de wrappers ALS sigue limitado; el diff no lo modifica. Regresiones directas de expiración/deadline pasan en la suite actual, sin certificar decoradores arbitrarios.
- E2E con decisiones humanas auténticas y aceptación dual para merge no ejecutados. Es una compuerta del WBS, no un defecto de SQLite ni autorización para simular aprobación.
