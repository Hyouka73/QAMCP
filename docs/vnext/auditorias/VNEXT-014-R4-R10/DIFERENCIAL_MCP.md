# Diferencial MCP R4-R10

Código e7d3717d9311ed73736568b13ce99e131d617453, sin incorporar develop ni código posterior. Baseline físico R9:09c9ce276c9c328026de4236dadf0a85d8e94d21, JSON local íntegro de la auditoría previa. Su SHA256 se publicó en [COMANDOS R9](https://github.com/Hyouka73/QAMCP/blob/e7d3717d9311ed73736568b13ce99e131d617453/docs/vnext/auditorias/VNEXT-014-R4-R9/COMANDOS.md):859c25a96b1b60bdadb048e8f3ec55a1a97f4d5256b6c5dd3cfb15cad87b1c90. No se reejecutó todo R9. Comparación por archivo + fullName exactos, sin normalizar títulos ni omitir fallos.

| Comparación | Conteo |
| --- | --- |
| R9 | 406 PASS /64FAIL de470 |
| R10 | **411 PASS /64FAIL de475** |
| passed→passed |406 |
| failed→failed |64 |
| Nuevas passed |5 |
| Cambios de resultado / eliminadas |0 /0 |

Los55 históricos conservan identidad, junto a los nueve resultados adversos añadidos en R9. Ninguno se atribuye automáticamente a R10. Los ocho adversarial-r5-guarantees usan MemoryKnowledgeStore sin withWriteFence (mock y suite sin cambios R9→R10); el helper retorna closure_consistency_fence_required. 3.1/3.2/7.5 esperan rechazo Promise; 3.3/5.4/7.2/7.3 esperan éxito;7.4 espera idempotencia. No son ocho bypass: las garantías posteriores no se alcanzan por incompatibilidad de fixture con el puerto exigido. Migrar casos positivos de autoridad a SQLite física y conservar negativos explícitos sin capacidad, sin aprobar por mera sustitución de expectativas.

Noveno: Scenario4 de canonical-coverage usa SQLite real; sigue FAIL local (49/50) e integral. Cola FIFO evita busy síncrono de sus titulares normales, pero bridge.resolve bajo lifecycle terminal devuelve context_changed antes de leer ganador. Sonda local confirma waived+blocked; retry externo idempotente. Un par multiproceso con gateway sincronizado sí llega waived+waived/idempotent y un solo recibo: no contradice el schedule local fallido. [Evidencia](EVIDENCIA_CONCURRENCIA.md).

E0a/E1/E2/E3/Criterio9 siguen entre los55 históricos; esta ronda no certifica el recorrido canónico completo. Las cinco altas son las pruebas R10, sin modificación de identidades/aserciones históricas (diff: import FileSystemStorage +132 líneas, una línea import sustituida).

## Nueve fallos adicionales desde R9, todavía conservados

| Archivo | Identidad completa | Primer diagnóstico |
| --- | --- | --- |
| adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 3: Obsolete Revision Invalidation Stress-Testing 3.1: Aborts and rolls back if module revision mutates during human review window | Error: promise resolved "{ status: 'blocked', …(2) }" instead of rejecting |
| adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 3: Obsolete Revision Invalidation Stress-Testing 3.2: Aborts if module is deactivated during review | Error: promise resolved "{ status: 'blocked', …(2) }" instead of rejecting |
| adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 3: Obsolete Revision Invalidation Stress-Testing 3.3: Prevents approvalId reuse across closure attempts | AssertionError: expected 'blocked' to be 'waived' // Object.is equality |
| adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 5: Legacy Closure Bypass Stress-Testing 5.4: Canonical closure unlocks qap_session_close | AssertionError: expected 'blocked' to be 'waived' // Object.is equality |
| adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 7: CAS Concurrency Stress-Testing 7.2: CanonicalClosureService serializes closure and second attempt is idempotent: true | AssertionError: expected 'blocked' to be 'waived' // Object.is equality |
| adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 7: CAS Concurrency Stress-Testing 7.3: Concurrent closure of distinct modules succeeds via bounded retry loop under SQLite CAS lock | AssertionError: expected 'blocked' to be 'waived' // Object.is equality |
| adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 7: CAS Concurrency Stress-Testing 7.4: Simultaneous closure requests for same module with divergent gateway decisions persist exactly one closure and canonical receipt | AssertionError: expected undefined to be true // Object.is equality |
| adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 7: CAS Concurrency Stress-Testing 7.5: Rejects write error recovery if existing receipt has tampered provenance or mismatched entity | Error: promise resolved "{ status: 'blocked', …(2) }" instead of rejecting |
| canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix The 4 Crash Recovery Scenarios (spawnSync Hard Exits) Scenario 4: Two concurrent closures cleanly serialize and prevent double consumption of decision | AssertionError: expected false to be true // Object.is equality |

## Los 55 históricos, todavía conservados

Contraste adicional por identidad con el JSON R8 previo; 55/55 coinciden. Es el mismo baseline físico documentado en R9, sin reejecutarlo ni atribuirle código R10.

| Archivo | Identidad completa | Primer diagnóstico |
| --- | --- | --- |
| lifecycle-v3-e2e.test.ts | Lifecycle V3 E2E & Verification Suite (E0 - E3) E0a: qap_status en WORKING para módulo con cobertura incompleta devuelve module, view y preguntas no vacías idénticas a qap_rules_set | AssertionError: expected 'trabajo' to be 'entrevista_vista' // Object.is equality |
| lifecycle-v3-e2e.test.ts | Lifecycle V3 E2E & Verification Suite (E0 - E3) E1: regresión consolidated -> interviewing tras re-discover y política de waivers | AssertionError: expected '{\n  "status": "blocked",\n  "code": …' to contain 'La categoría \'proposito\' no se pued…' |
| lifecycle-v3-e2e.test.ts | Lifecycle V3 E2E & Verification Suite (E0 - E3) E2: qap_module_close validaciones, compuertas y transiciones | AssertionError: expected 'Falta el contexto de vista requerido …' to contain 'consolidated' |
| lifecycle-v3-e2e.test.ts | Lifecycle V3 E2E & Verification Suite (E0 - E3) E3: canExitWorking, qap_session_close, reporte de brechas y nueva sesión desde WRAP_UP | Error: ENOENT: no such file or directory, open 'C:\Users\Judirico\Documents\QAMCP\audit-r4-r10\node_modules\.tmp-vnext\qap-v3-e2e-mAEQ9f\.qa\modules\auth\rules.yaml' |
| lifecycle-v3-e2e.test.ts | Lifecycle V3 E2E & Verification Suite (E0 - E3) Criterio 9: E2E completo: init -> onboarding -> scoping -> working -> discover A -> rules_set parcial -> status (reanuda) -> rules_set completa -> module_close A -> discover B -> module_close waive B -> session_close -> status WRAP_UP -> session_plan nueva sesión | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p3-verification.test.ts | P3 Suite de Verificación MCP (T3 - T15) T6: qap_discover éxito: no contiene "Descubrir otro módulo", "pregunta_doc" ni "opciones_doc"; siguiente_accion tipo entrevista_vista (<= 5 preguntas) con tool qap_rules_set, categorias_aplicables y rutas_detectadas_fuera_del_plan | TypeError: Cannot read properties of undefined (reading 'tipo') |
| p3-verification.test.ts | P3 Suite de Verificación MCP (T3 - T15) T7: rules.yaml tras discover: reglas inferred/dom con ids deterministas; re-discover idempotente (sin duplicados, reglas confirmadas intactas) | AssertionError: expected false to be true // Object.is equality |
| p3-verification.test.ts | P3 Suite de Verificación MCP (T3 - T15) T9: Fallo de Playwright: no inserta reglas; siguiente_accion tipo decision | TypeError: Cannot read properties of undefined (reading 'tipo') |
| p3-verification.test.ts | P3 Suite de Verificación MCP (T3 - T15) T14: qap_status WORKING: (a) observed con hipótesis reanuda entrevista; (b) interviewing incompleto reanuda; (c) planned elige high > medium > low luego orden; (d) todos completos tipo decision | AssertionError: expected 'trabajo' to be 'entrevista_vista' // Object.is equality |
| p3-verification.test.ts | P3 Suite de Verificación MCP (T3 - T15) T15: E2E: flujo de P2 hasta WORKING -> discover A -> rules_set parcial -> status (reanuda A) -> rules_set completa cobertura -> status (propone B) -> discover B; ninguna respuesta del flujo contiene texto del bucle | AssertionError: expected 'trabajo' to be 'entrevista_vista' // Object.is equality |
| p4-2-pregunta-contract.test.ts | P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) Criterio 4.4: Ninguna respuesta con siguiente_accion trae preguntas como cadenas ni pregunta aplanada | Error: Tool qap_discover failed: { |
| p4-2-pregunta-contract.test.ts | P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) Criterio 6: E2E Completo donde TODA siguiente_accion de tipo entrevista, entrevista_vista o decision trae Pregunta válida | Error: Tool qap_discover failed: { |
| p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 1. qap_discover protegido sin perfil: blocked auth_required y cero escrituras en disco | AssertionError: expected undefined to be 'auth_required' // Object.is equality |
| p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 2. qap_discover con redirección HTTP 302 a login: detecta auth_wall determinista y bloquea sin escribir | AssertionError: expected undefined to be 'auth_required' // Object.is equality |
| p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 3. qap_discover con login embebido en ruta no-acceso: bloquea como auth_required sin persistir | AssertionError: expected undefined to be 'auth_required' // Object.is equality |
| p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 4. qap_discover con sesión expirada: blocked session_invalid y desverifica el perfil | AssertionError: expected undefined to be 'session_invalid' // Object.is equality |
| p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 5. qap_discover con perfil verificado y storageState válido: devuelve app y transiciona a observed | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 6. qap_discover en módulo de acceso: selectors.json incluye auth_selectors y omite valores y atributos sensibles de password | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 15. Guard de cliente asíncrono lento (~1200ms) en qap_discover: responde blocked auth_required y cero escrituras en .qa/modules (C3c) | AssertionError: expected undefined to be 'auth_required' // Object.is equality |
| p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) Criterio 2: regla redactada por agente sin user_text ni from_option se guarda como inferred/agent y no cuenta en cobertura | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) Criterio 3: una etiqueta de opción predefinida del motor NO cubre una categoría | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) Criterio 4: un módulo con 2 reglas de 7 categorías no cierra sin accept_gaps, y cierra con él dejando registro | AssertionError: expected 'Falta el contexto de vista requerido …' to be 'cobertura_insuficiente' // Object.is equality |
| p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C9a: blocked de qap_discover con auth_required incluye razon auth_required y directorio_objetivo, con claves alineadas a session_invalid | AssertionError: expected undefined to be 'auth_required' // Object.is equality |
| p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C4-a: from_option con pregunta_id inexistente, opcion_id inexistente o sin texto sustantivo (rechazo o degradación a agent/inferred) | AssertionError: expected 'blocked' to be 'error' // Object.is equality |
| p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C4-b: límites de sustantividad (2 palabras o 19 caracteres no cubren; 3 palabras y 20 caracteres sí) | Error: ENOENT: no such file or directory, open 'C:\Users\Judirico\Documents\QAMCP\audit-r4-r10\node_modules\.tmp-vnext\qap-p45a-9oFSEy\.qa\modules\catalogo\rules.yaml' |
| p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C4-c: accept_gaps con razón de 14 caracteres bloquea y con 15 cierra y deja el registro | AssertionError: expected 'Falta el contexto de vista requerido …' to be 'cobertura_insuficiente' // Object.is equality |
| p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C4-d: plan con auth.required true sin roles queda bloqueado con pregunta de roles y bloquea discover (V4) | TypeError: .toMatch() expects to receive a string, but got undefined |
| p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C1: campos honestos en bloqueos previos a navegar y navegación real | AssertionError: expected undefined to be 'auth_required' // Object.is equality |
| p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C3: flujo real de preguntas de categoría, formato una_opcion, persistencia y respuestas user_text y deferred | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C1: Clasificación honesta con adaptador real C1-a: módulo de acceso pedido en login sin redirección NO se bloquea (page_kind login, success) | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C1: Clasificación honesta con adaptador real C1-b: ruta protegida con redirección HTTP 302 a /login detecta auth_wall determinista y bloquea | AssertionError: expected undefined to be 'auth_required' // Object.is equality |
| p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C1: Clasificación honesta con adaptador real C1-c: ruta protegida con guard del lado del cliente detecta auth_wall con redirección al login | AssertionError: expected undefined to be 'auth_required' // Object.is equality |
| p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C3: Integridad de categoría en from_option y regla de cobertura completa C3-a: la categoría de from_option se toma siempre de la pregunta pendiente persistida | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C3: Integridad de categoría en from_option y regla de cobertura completa C3-b: si la petición declara una categoría distinta a la de la pregunta pendiente se rechaza con blocked | AssertionError: the given combination of arguments (undefined and string) is invalid for this assertion. You can use an array, a map, an object, a set, a string, or a weakset instead of a string |
| p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-a: respuesta corta se guarda como borrador (status inferred, source user_text, borrador true) y no cubre | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-b: derivación determinista en categoría actor que nombra roles emite Pregunta una_opcion directamente | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-c: envío de propuesta_enunciado válida para un borrador emite Pregunta una_opcion con las 3 opciones | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-d: resolver con "Es correcto" guarda regla confirmed user_confirmed con enunciado exacto y cubre | TypeError: Cannot read properties of undefined (reading 'id') |
| p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-e: resolver con "Lo defino después" guarda regla deferred y no cubre | TypeError: Cannot read properties of undefined (reading 'id') |
| p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-f: propuesta_enunciado corta o genérica es rechazada con status error | AssertionError: expected 'blocked' to be 'error' // Object.is equality |
| p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C10: Detección y advertencia de extracción vacía C10-a: página app/login sin elementos interactivos genera advertencia extraccion_vacia y trabajo | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C10: Detección y advertencia de extracción vacía C10-b: página con al menos un elemento interactivo no genera advertencia extraccion_vacia | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C10: Detección y advertencia de extracción vacía C10-c: la advertencia extraccion_vacia es agnóstica de la aplicación | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C3: Transliteración NFD de slugs y prevención de módulos fuera del plan C1-c: módulo con tilde preserva nombre en lifecycle, crea directorio y normaliza pending_questions con transliteración NFD | AssertionError: expected false to be true // Object.is equality |
| p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C3: Transliteración NFD de slugs y prevención de módulos fuera del plan C2-seguimiento: selección de "Corregir" emite pregunta de seguimiento y no persiste regla espuria en rules.yaml | AssertionError: expected undefined to be defined |
| server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 debe descubrir modulos y responder en desarrollo para qap_plan y qap_test | AssertionError: expected true to be falsy |
| server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 el contexto de vista generado por qap_discover debe validar contra module-view.schema.json (Criterio 4) | AssertionError: expected true to be falsy |
| server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 qap_discover con contexto de vista inválido no debe escribir archivos y debe retornar error (Criterio 4) | AssertionError: expected 'blocked' to be 'error' // Object.is equality |
| server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 E0a: qap_discover valida contra module-view.schema.json en camino de fallo de Playwright | AssertionError: expected true to be falsy |
| server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 E0b: qap_discover valida contra module-view.schema.json en vista de autenticacion con session_saved true | AssertionError: expected true to be falsy |
| server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 E0c: qap_discover valida contra module-view.schema.json en vista con routes_found vacio | AssertionError: expected true to be falsy |
| server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 qap_discover: gating por fase y estado de modulo, actualizacion planned -> observed | AssertionError: expected undefined to be 'ONBOARDING' // Object.is equality |
| server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 Criterio 7: Proyecto legacy sin campos de negocio valida contra el schema y qap_status responde con fase WORKING derivada | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 Criterio 8 (E2E): init -> status (entrevista) -> ingest -> context_set compuerta -> auto-SCOPING -> session_plan -> auto-WORKING -> discover | AssertionError: expected undefined to be 'ONBOARDING' // Object.is equality |
| server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 qap_rules_set: actualiza reglas, transiciona observed -> interviewing, recalcula cobertura y actualiza guidance | AssertionError: expected 'planned' to be 'observed' // Object.is equality |

## Altas

| Archivo | Identidad completa | Estado | Diagnóstico |
| --- | --- | --- | --- |
| canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R10-A05: approves an existing gap with the real host approval receipt | passed |  |
| canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R10-A05: never requests approval for missing or duplicate gap IDs | passed |  |
| canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R10-A01: a direct filesystem mutation before closure transaction fails the fingerprint guard | passed |  |
| canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R10-A01: the official lifecycle writer waits until authorization persistence releases the lock | passed |  |
| canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R10-A02: changing cwd never moves the active SQLite writer fence | passed |  |

## Archivos

- adversarial-r5-guarantees.test.ts: 26 PASS / 8 FAIL
- canonical-coverage.test.ts: 49 PASS / 1 FAIL
- canonical-interview.test.ts: 44 PASS / 0 FAIL
- discovery-handler.test.ts: 59 PASS / 0 FAIL
- dispatcher-integration.test.ts: 8 PASS / 0 FAIL
- dispatcher.test.ts: 38 PASS / 0 FAIL
- durable-interview.test.ts: 21 PASS / 0 FAIL
- e0-investigation.test.ts: 4 PASS / 0 FAIL
- guidance.test.ts: 7 PASS / 0 FAIL
- lifecycle-v3-e2e.test.ts: 2 PASS / 5 FAIL
- p3-verification.test.ts: 8 PASS / 5 FAIL
- p4-2-pregunta-contract.test.ts: 4 PASS / 2 FAIL
- p4-3-1-b-block.test.ts: 7 PASS / 0 FAIL
- p4-3-investigate-before-ask.test.ts: 8 PASS / 0 FAIL
- p4-4-auth-lifecycle.test.ts: 8 PASS / 7 FAIL
- p4-5a-integrity.test.ts: 2 PASS / 10 FAIL
- p4-5a2-integrity.test.ts: 10 PASS / 16 FAIL
- p4-5s1-browser-candidates.test.ts: 11 PASS / 0 FAIL
- plan-handler.test.ts: 31 PASS / 0 FAIL
- report-handler.test.ts: 12 PASS / 0 FAIL
- server.test.ts: 11 PASS / 10 FAIL
- state-handlers.test.ts: 21 PASS / 0 FAIL
- test-handler.test.ts: 20 PASS / 0 FAIL
