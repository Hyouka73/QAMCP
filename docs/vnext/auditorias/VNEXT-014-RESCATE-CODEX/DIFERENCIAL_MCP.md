**Auditoría independiente de aceptación. Fecha: 2026-11-05.** Repositorio Hyouka73/QAMCP, rama exclusiva feat/qap-vnext-architecture. **Snapshot exacto probado: e71818ac6fdaa1847e300a67bd4540fbfbd514c5.** Último commit productivo: 4be066c794c1e83fa0b3e1b89d269094f7b7f68e. Base anterior al rescate: f36e5ba60470c2443690d78a4b68bad966891b69. El SHA de esta publicación documental se verifica en GitHub al terminar y no sustituye el del snapshot probado. VNEXT-014 NO-GO; VNEXT-015 no iniciado.

# Reconciliación por identidad exacta

Baseline independiente R4-R12: **415 PASS/63 FAIL de 478** sobre 7ccf3db1a6f259f6a5c51521518bbb399a13fda2. Corrida actual detallada JSON: **423 PASS/63 FAIL de 486**, 24 archivos (16 PASS/8 FAIL). Se ejecutaron además pnpm --filter @qap/mcp test con su paralelismo predeterminado y la repetición secuencial del monorepo. Solo las dos corridas con un worker conservan 423/63/486; los fallos adicionales de las corridas por defecto se registran más abajo. Comparación por nombre de archivo de suite + fullName íntegro, sin normalizar nombres. En este inventario cada basename identifica una única ruta src/__tests__.

| Resultado | Cantidad |
| --- | ---: |
| FAIL → PASS | 0 |
| FAIL → FAIL | 63 |
| PASS → FAIL | 0 |
| PASS → PASS | 415 |
| Nuevas PASS | 8 |
| Nuevas FAIL | 0 |
| Desaparecidas | 0 |

Los 55 históricos y los ocho Memory siguen presentes por identidad exacta. No se modificaron sus archivos ni expectativas. Diff de pruebas respecto a f36e5ba6: canonical-coverage +118/-0; host-composition +177/-0. Scenario 4 permanece PASS con sus dos respuestas terminales y expectativas históricas intactas. Las fallas nuevas de sondas externas A01/A02 no están en esas 486 identidades: cero PASS→FAIL en la matriz no significa cero defectos nuevos.

## Todas las 63 identidades, causa inicial y clasificación

La clasificación describe el primer impedimento que se reproduce, no da por aprobadas las garantías posteriores no alcanzadas. No se ha demostrado que los 55 sean 55 defectos productivos independientes ni que todos puedan descartarse. Las categorías siguientes se fundamentan en lectura de las suites, handlers vigentes y sonda MCP independiente. La transición de contrato requiere conservar y volver a demostrar su garantía, con revisión de implementación. Los fallos de deadline físico, recibos y cierre de sesión se documentan aparte en HALLAZGOS.

| # | Archivo · fullName exacto | Primer error exacto | Clasificación | Causa / trabajo requerido |
| --- | --- | --- | --- | --- |
| 1 | adversarial-r5-guarantees.test.ts · Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 3: Obsolete Revision Invalidation Stress-Testing 3.1: Aborts and rolls back if module revision mutates during human review window | Error: promise resolved "{ status: 'blocked', …(2) }" instead of rejecting | Fixture incompatible + bloqueo legítimo de seguridad | El fixture usa MemoryKnowledgeStore sin withWriteFence; el flujo positivo se detiene sin consumir autoridad. Migrar positivos a SQLite físico y mantener negativo sin fence. No inferir que las aserciones posteriores ya pasaron. |
| 2 | adversarial-r5-guarantees.test.ts · Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 3: Obsolete Revision Invalidation Stress-Testing 3.2: Aborts if module is deactivated during review | Error: promise resolved "{ status: 'blocked', …(2) }" instead of rejecting | Fixture incompatible + bloqueo legítimo de seguridad | El fixture usa MemoryKnowledgeStore sin withWriteFence; el flujo positivo se detiene sin consumir autoridad. Migrar positivos a SQLite físico y mantener negativo sin fence. No inferir que las aserciones posteriores ya pasaron. |
| 3 | adversarial-r5-guarantees.test.ts · Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 3: Obsolete Revision Invalidation Stress-Testing 3.3: Prevents approvalId reuse across closure attempts | AssertionError: expected 'blocked' to be 'waived' // Object.is equality | Fixture incompatible + bloqueo legítimo de seguridad | El fixture usa MemoryKnowledgeStore sin withWriteFence; el flujo positivo se detiene sin consumir autoridad. Migrar positivos a SQLite físico y mantener negativo sin fence. No inferir que las aserciones posteriores ya pasaron. |
| 4 | adversarial-r5-guarantees.test.ts · Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 5: Legacy Closure Bypass Stress-Testing 5.4: Canonical closure unlocks qap_session_close | AssertionError: expected 'blocked' to be 'waived' // Object.is equality | Fixture incompatible + bloqueo legítimo de seguridad | El fixture usa MemoryKnowledgeStore sin withWriteFence; el flujo positivo se detiene sin consumir autoridad. Migrar positivos a SQLite físico y mantener negativo sin fence. No inferir que las aserciones posteriores ya pasaron. |
| 5 | adversarial-r5-guarantees.test.ts · Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 7: CAS Concurrency Stress-Testing 7.2: CanonicalClosureService serializes closure and second attempt is idempotent: true | AssertionError: expected 'blocked' to be 'waived' // Object.is equality | Fixture incompatible + bloqueo legítimo de seguridad | El fixture usa MemoryKnowledgeStore sin withWriteFence; el flujo positivo se detiene sin consumir autoridad. Migrar positivos a SQLite físico y mantener negativo sin fence. No inferir que las aserciones posteriores ya pasaron. |
| 6 | adversarial-r5-guarantees.test.ts · Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 7: CAS Concurrency Stress-Testing 7.3: Concurrent closure of distinct modules succeeds via bounded retry loop under SQLite CAS lock | AssertionError: expected 'blocked' to be 'waived' // Object.is equality | Fixture incompatible + bloqueo legítimo de seguridad | El fixture usa MemoryKnowledgeStore sin withWriteFence; el flujo positivo se detiene sin consumir autoridad. Migrar positivos a SQLite físico y mantener negativo sin fence. No inferir que las aserciones posteriores ya pasaron. |
| 7 | adversarial-r5-guarantees.test.ts · Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 7: CAS Concurrency Stress-Testing 7.4: Simultaneous closure requests for same module with divergent gateway decisions persist exactly one closure and canonical receipt | AssertionError: expected undefined to be true // Object.is equality | Fixture incompatible + bloqueo legítimo de seguridad | El fixture usa MemoryKnowledgeStore sin withWriteFence; el flujo positivo se detiene sin consumir autoridad. Migrar positivos a SQLite físico y mantener negativo sin fence. No inferir que las aserciones posteriores ya pasaron. |
| 8 | adversarial-r5-guarantees.test.ts · Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 7: CAS Concurrency Stress-Testing 7.5: Rejects write error recovery if existing receipt has tampered provenance or mismatched entity | Error: promise resolved "{ status: 'blocked', …(2) }" instead of rejecting | Fixture incompatible + bloqueo legítimo de seguridad | El fixture usa MemoryKnowledgeStore sin withWriteFence; el flujo positivo se detiene sin consumir autoridad. Migrar positivos a SQLite físico y mantener negativo sin fence. No inferir que las aserciones posteriores ya pasaron. |
| 9 | lifecycle-v3-e2e.test.ts · Lifecycle V3 E2E & Verification Suite (E0 - E3) E0a: qap_status en WORKING para módulo con cobertura incompleta devuelve module, view y preguntas no vacías idénticas a qap_rules_set | AssertionError: expected 'trabajo' to be 'entrevista_vista' // Object.is equality | Defecto de integración de pruebas / contrato antiguo | El fixture legacy no compone Knowledge/gateway canónicos o depende de contexto/rules.yaml que Discovery ya no produce. Migrar conservando la garantía funcional; no cambiar success por blocked como única aserción. |
| 10 | lifecycle-v3-e2e.test.ts · Lifecycle V3 E2E & Verification Suite (E0 - E3) E1: regresión consolidated -> interviewing tras re-discover y política de waivers | AssertionError: expected '{\n  "status": "blocked",\n  "code": …' to contain 'La categoría \'proposito\' no se pued…' | Defecto de integración de pruebas / contrato antiguo | El fixture legacy no compone Knowledge/gateway canónicos o depende de contexto/rules.yaml que Discovery ya no produce. Migrar conservando la garantía funcional; no cambiar success por blocked como única aserción. |
| 11 | lifecycle-v3-e2e.test.ts · Lifecycle V3 E2E & Verification Suite (E0 - E3) E2: qap_module_close validaciones, compuertas y transiciones | AssertionError: expected 'Falta el contexto de vista requerido …' to contain 'consolidated' | Defecto de integración de pruebas / contrato antiguo | El fixture legacy no compone Knowledge/gateway canónicos o depende de contexto/rules.yaml que Discovery ya no produce. Migrar conservando la garantía funcional; no cambiar success por blocked como única aserción. |
| 12 | lifecycle-v3-e2e.test.ts · Lifecycle V3 E2E & Verification Suite (E0 - E3) E3: canExitWorking, qap_session_close, reporte de brechas y nueva sesión desde WRAP_UP | Error: ENOENT: no such file or directory, open 'C:\Users\Judirico\Documents\QAMCP\audit-r4-r10\node_modules\.tmp-rescate\qap-v3-e2e-y81MEj\.qa\modules\auth\rules.yaml' | Defecto de integración de pruebas / contrato antiguo | El fixture legacy no compone Knowledge/gateway canónicos o depende de contexto/rules.yaml que Discovery ya no produce. Migrar conservando la garantía funcional; no cambiar success por blocked como única aserción. |
| 13 | lifecycle-v3-e2e.test.ts · Lifecycle V3 E2E & Verification Suite (E0 - E3) Criterio 9: E2E completo: init -> onboarding -> scoping -> working -> discover A -> rules_set parcial -> status (reanuda) -> rules_set completa -> module_close A -> discover B -> module_close waive B -> session_close -> status WRAP_UP -> session_plan nueva sesión | AssertionError: expected 'blocked' to be 'success' // Object.is equality | Defecto de integración de pruebas / contrato antiguo | El fixture legacy no compone Knowledge/gateway canónicos o depende de contexto/rules.yaml que Discovery ya no produce. Migrar conservando la garantía funcional; no cambiar success por blocked como única aserción. |
| 14 | p3-verification.test.ts · P3 Suite de Verificación MCP (T3 - T15) T6: qap_discover éxito: no contiene "Descubrir otro módulo", "pregunta_doc" ni "opciones_doc"; siguiente_accion tipo entrevista_vista (<= 5 preguntas) con tool qap_rules_set, categorias_aplicables y rutas_detectadas_fuera_del_plan | TypeError: Cannot read properties of undefined (reading 'tipo') | Contrato ambiguo de presentación + fixture incompatible | Se esperan campos/guidance/razones del protocolo antiguo antes de satisfacer autoridad y contexto. Fijar contrato de presentación por ruta y retener negativos equivalentes, sin sustituir toda la garantía por el primer blocked. |
| 15 | p3-verification.test.ts · P3 Suite de Verificación MCP (T3 - T15) T7: rules.yaml tras discover: reglas inferred/dom con ids deterministas; re-discover idempotente (sin duplicados, reglas confirmadas intactas) | AssertionError: expected false to be true // Object.is equality | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 16 | p3-verification.test.ts · P3 Suite de Verificación MCP (T3 - T15) T9: Fallo de Playwright: no inserta reglas; siguiente_accion tipo decision | TypeError: Cannot read properties of undefined (reading 'tipo') | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 17 | p3-verification.test.ts · P3 Suite de Verificación MCP (T3 - T15) T14: qap_status WORKING: (a) observed con hipótesis reanuda entrevista; (b) interviewing incompleto reanuda; (c) planned elige high > medium > low luego orden; (d) todos completos tipo decision | AssertionError: expected 'trabajo' to be 'entrevista_vista' // Object.is equality | Contrato ambiguo de presentación + fixture incompatible | Se esperan campos/guidance/razones del protocolo antiguo antes de satisfacer autoridad y contexto. Fijar contrato de presentación por ruta y retener negativos equivalentes, sin sustituir toda la garantía por el primer blocked. |
| 18 | p3-verification.test.ts · P3 Suite de Verificación MCP (T3 - T15) T15: E2E: flujo de P2 hasta WORKING -> discover A -> rules_set parcial -> status (reanuda A) -> rules_set completa cobertura -> status (propone B) -> discover B; ninguna respuesta del flujo contiene texto del bucle | AssertionError: expected 'trabajo' to be 'entrevista_vista' // Object.is equality | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 19 | p4-2-pregunta-contract.test.ts · P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) Criterio 4.4: Ninguna respuesta con siguiente_accion trae preguntas como cadenas ni pregunta aplanada | Error: Tool qap_discover failed: { | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 20 | p4-2-pregunta-contract.test.ts · P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) Criterio 6: E2E Completo donde TODA siguiente_accion de tipo entrevista, entrevista_vista o decision trae Pregunta válida | Error: Tool qap_discover failed: { | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 21 | p4-4-auth-lifecycle.test.ts · P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 1. qap_discover protegido sin perfil: blocked auth_required y cero escrituras en disco | AssertionError: expected undefined to be 'auth_required' // Object.is equality | Prueba obsoleta + bloqueo legítimo de seguridad | Expectativas de navegación autenticada/login/guard JS chocan con fresh_anonymous_static y rechazo de profile/credentials. Migrar al contrato explícito; no habilitar login implícito para dar verde. |
| 22 | p4-4-auth-lifecycle.test.ts · P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 2. qap_discover con redirección HTTP 302 a login: detecta auth_wall determinista y bloquea sin escribir | AssertionError: expected undefined to be 'auth_required' // Object.is equality | Prueba obsoleta + bloqueo legítimo de seguridad | Expectativas de navegación autenticada/login/guard JS chocan con fresh_anonymous_static y rechazo de profile/credentials. Migrar al contrato explícito; no habilitar login implícito para dar verde. |
| 23 | p4-4-auth-lifecycle.test.ts · P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 3. qap_discover con login embebido en ruta no-acceso: bloquea como auth_required sin persistir | AssertionError: expected undefined to be 'auth_required' // Object.is equality | Prueba obsoleta + bloqueo legítimo de seguridad | Expectativas de navegación autenticada/login/guard JS chocan con fresh_anonymous_static y rechazo de profile/credentials. Migrar al contrato explícito; no habilitar login implícito para dar verde. |
| 24 | p4-4-auth-lifecycle.test.ts · P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 4. qap_discover con sesión expirada: blocked session_invalid y desverifica el perfil | AssertionError: expected undefined to be 'session_invalid' // Object.is equality | Prueba obsoleta + bloqueo legítimo de seguridad | Expectativas de navegación autenticada/login/guard JS chocan con fresh_anonymous_static y rechazo de profile/credentials. Migrar al contrato explícito; no habilitar login implícito para dar verde. |
| 25 | p4-4-auth-lifecycle.test.ts · P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 5. qap_discover con perfil verificado y storageState válido: devuelve app y transiciona a observed | AssertionError: expected 'blocked' to be 'success' // Object.is equality | Prueba obsoleta + bloqueo legítimo de seguridad | Expectativas de navegación autenticada/login/guard JS chocan con fresh_anonymous_static y rechazo de profile/credentials. Migrar al contrato explícito; no habilitar login implícito para dar verde. |
| 26 | p4-4-auth-lifecycle.test.ts · P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 6. qap_discover en módulo de acceso: selectors.json incluye auth_selectors y omite valores y atributos sensibles de password | AssertionError: expected 'blocked' to be 'success' // Object.is equality | Prueba obsoleta + bloqueo legítimo de seguridad | Expectativas de navegación autenticada/login/guard JS chocan con fresh_anonymous_static y rechazo de profile/credentials. Migrar al contrato explícito; no habilitar login implícito para dar verde. |
| 27 | p4-4-auth-lifecycle.test.ts · P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 15. Guard de cliente asíncrono lento (~1200ms) en qap_discover: responde blocked auth_required y cero escrituras en .qa/modules (C3c) | AssertionError: expected undefined to be 'auth_required' // Object.is equality | Prueba obsoleta + bloqueo legítimo de seguridad | Expectativas de navegación autenticada/login/guard JS chocan con fresh_anonymous_static y rechazo de profile/credentials. Migrar al contrato explícito; no habilitar login implícito para dar verde. |
| 28 | p4-5a-integrity.test.ts · P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) Criterio 2: regla redactada por agente sin user_text ni from_option se guarda como inferred/agent y no cuenta en cobertura | AssertionError: expected 'blocked' to be 'success' // Object.is equality | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 29 | p4-5a-integrity.test.ts · P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) Criterio 3: una etiqueta de opción predefinida del motor NO cubre una categoría | AssertionError: expected 'blocked' to be 'success' // Object.is equality | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 30 | p4-5a-integrity.test.ts · P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) Criterio 4: un módulo con 2 reglas de 7 categorías no cierra sin accept_gaps, y cierra con él dejando registro | AssertionError: expected 'Falta el contexto de vista requerido …' to be 'cobertura_insuficiente' // Object.is equality | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 31 | p4-5a-integrity.test.ts · P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C9a: blocked de qap_discover con auth_required incluye razon auth_required y directorio_objetivo, con claves alineadas a session_invalid | AssertionError: expected undefined to be 'auth_required' // Object.is equality | Prueba obsoleta + bloqueo legítimo de seguridad | Expectativas de navegación autenticada/login/guard JS chocan con fresh_anonymous_static y rechazo de profile/credentials. Migrar al contrato explícito; no habilitar login implícito para dar verde. |
| 32 | p4-5a-integrity.test.ts · P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C4-a: from_option con pregunta_id inexistente, opcion_id inexistente o sin texto sustantivo (rechazo o degradación a agent/inferred) | AssertionError: expected 'blocked' to be 'error' // Object.is equality | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 33 | p4-5a-integrity.test.ts · P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C4-b: límites de sustantividad (2 palabras o 19 caracteres no cubren; 3 palabras y 20 caracteres sí) | Error: ENOENT: no such file or directory, open 'C:\Users\Judirico\Documents\QAMCP\audit-r4-r10\node_modules\.tmp-rescate\qap-p45a-5jgnbu\.qa\modules\catalogo\rules.yaml' | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 34 | p4-5a-integrity.test.ts · P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C4-c: accept_gaps con razón de 14 caracteres bloquea y con 15 cierra y deja el registro | AssertionError: expected 'Falta el contexto de vista requerido …' to be 'cobertura_insuficiente' // Object.is equality | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 35 | p4-5a-integrity.test.ts · P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C4-d: plan con auth.required true sin roles queda bloqueado con pregunta de roles y bloquea discover (V4) | TypeError: .toMatch() expects to receive a string, but got undefined | Contrato ambiguo de presentación + fixture incompatible | Se esperan campos/guidance/razones del protocolo antiguo antes de satisfacer autoridad y contexto. Fijar contrato de presentación por ruta y retener negativos equivalentes, sin sustituir toda la garantía por el primer blocked. |
| 36 | p4-5a-integrity.test.ts · P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C1: campos honestos en bloqueos previos a navegar y navegación real | AssertionError: expected undefined to be 'auth_required' // Object.is equality | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 37 | p4-5a-integrity.test.ts · P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C3: flujo real de preguntas de categoría, formato una_opcion, persistencia y respuestas user_text y deferred | AssertionError: expected 'blocked' to be 'success' // Object.is equality | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 38 | p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C1: Clasificación honesta con adaptador real C1-a: módulo de acceso pedido en login sin redirección NO se bloquea (page_kind login, success) | AssertionError: expected 'blocked' to be 'success' // Object.is equality | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 39 | p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C1: Clasificación honesta con adaptador real C1-b: ruta protegida con redirección HTTP 302 a /login detecta auth_wall determinista y bloquea | AssertionError: expected undefined to be 'auth_required' // Object.is equality | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 40 | p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C1: Clasificación honesta con adaptador real C1-c: ruta protegida con guard del lado del cliente detecta auth_wall con redirección al login | AssertionError: expected undefined to be 'auth_required' // Object.is equality | Prueba obsoleta + bloqueo legítimo de seguridad | Expectativas de navegación autenticada/login/guard JS chocan con fresh_anonymous_static y rechazo de profile/credentials. Migrar al contrato explícito; no habilitar login implícito para dar verde. |
| 41 | p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C3: Integridad de categoría en from_option y regla de cobertura completa C3-a: la categoría de from_option se toma siempre de la pregunta pendiente persistida | AssertionError: expected 'blocked' to be 'success' // Object.is equality | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 42 | p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C3: Integridad de categoría en from_option y regla de cobertura completa C3-b: si la petición declara una categoría distinta a la de la pregunta pendiente se rechaza con blocked | AssertionError: the given combination of arguments (undefined and string) is invalid for this assertion. You can use an array, a map, an object, a set, a string, or a weakset instead of a string | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 43 | p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-a: respuesta corta se guarda como borrador (status inferred, source user_text, borrador true) y no cubre | AssertionError: expected 'blocked' to be 'success' // Object.is equality | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 44 | p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-b: derivación determinista en categoría actor que nombra roles emite Pregunta una_opcion directamente | AssertionError: expected 'blocked' to be 'success' // Object.is equality | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 45 | p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-c: envío de propuesta_enunciado válida para un borrador emite Pregunta una_opcion con las 3 opciones | AssertionError: expected 'blocked' to be 'success' // Object.is equality | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 46 | p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-d: resolver con "Es correcto" guarda regla confirmed user_confirmed con enunciado exacto y cubre | TypeError: Cannot read properties of undefined (reading 'id') | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 47 | p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-e: resolver con "Lo defino después" guarda regla deferred y no cubre | TypeError: Cannot read properties of undefined (reading 'id') | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 48 | p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-f: propuesta_enunciado corta o genérica es rechazada con status error | AssertionError: expected 'blocked' to be 'error' // Object.is equality | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 49 | p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C10: Detección y advertencia de extracción vacía C10-a: página app/login sin elementos interactivos genera advertencia extraccion_vacia y trabajo | AssertionError: expected 'blocked' to be 'success' // Object.is equality | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 50 | p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C10: Detección y advertencia de extracción vacía C10-b: página con al menos un elemento interactivo no genera advertencia extraccion_vacia | AssertionError: expected 'blocked' to be 'success' // Object.is equality | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 51 | p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C10: Detección y advertencia de extracción vacía C10-c: la advertencia extraccion_vacia es agnóstica de la aplicación | AssertionError: expected 'blocked' to be 'success' // Object.is equality | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 52 | p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C3: Transliteración NFD de slugs y prevención de módulos fuera del plan C1-c: módulo con tilde preserva nombre en lifecycle, crea directorio y normaliza pending_questions con transliteración NFD | AssertionError: expected false to be true // Object.is equality | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 53 | p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C3: Transliteración NFD de slugs y prevención de módulos fuera del plan C2-seguimiento: selección de "Corregir" emite pregunta de seguimiento y no persiste regla espuria en rules.yaml | AssertionError: expected undefined to be defined | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 54 | server.test.ts · Suite MCP Server QAP v2.1 / v2.1.2 debe descubrir modulos y responder en desarrollo para qap_plan y qap_test | AssertionError: expected true to be falsy | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 55 | server.test.ts · Suite MCP Server QAP v2.1 / v2.1.2 el contexto de vista generado por qap_discover debe validar contra module-view.schema.json (Criterio 4) | AssertionError: expected true to be falsy | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 56 | server.test.ts · Suite MCP Server QAP v2.1 / v2.1.2 qap_discover con contexto de vista inválido no debe escribir archivos y debe retornar error (Criterio 4) | AssertionError: expected 'blocked' to be 'error' // Object.is equality | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 57 | server.test.ts · Suite MCP Server QAP v2.1 / v2.1.2 E0a: qap_discover valida contra module-view.schema.json en camino de fallo de Playwright | AssertionError: expected true to be falsy | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 58 | server.test.ts · Suite MCP Server QAP v2.1 / v2.1.2 E0b: qap_discover valida contra module-view.schema.json en vista de autenticacion con session_saved true | AssertionError: expected true to be falsy | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 59 | server.test.ts · Suite MCP Server QAP v2.1 / v2.1.2 E0c: qap_discover valida contra module-view.schema.json en vista con routes_found vacio | AssertionError: expected true to be falsy | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 60 | server.test.ts · Suite MCP Server QAP v2.1 / v2.1.2 qap_discover: gating por fase y estado de modulo, actualizacion planned -> observed | AssertionError: expected undefined to be 'ONBOARDING' // Object.is equality | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 61 | server.test.ts · Suite MCP Server QAP v2.1 / v2.1.2 Criterio 7: Proyecto legacy sin campos de negocio valida contra el schema y qap_status responde con fase WORKING derivada | AssertionError: expected 'blocked' to be 'success' // Object.is equality | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 62 | server.test.ts · Suite MCP Server QAP v2.1 / v2.1.2 Criterio 8 (E2E): init -> status (entrevista) -> ingest -> context_set compuerta -> auto-SCOPING -> session_plan -> auto-WORKING -> discover | AssertionError: expected undefined to be 'ONBOARDING' // Object.is equality | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 63 | server.test.ts · Suite MCP Server QAP v2.1 / v2.1.2 qap_rules_set: actualiza reglas, transiciona observed -> interviewing, recalcula cobertura y actualiza guidance | AssertionError: expected 'planned' to be 'observed' // Object.is equality | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |

## Ocho garantías Memory: acción precisa sin implementarla

| Identidad corta | Cambio de fixture / contrato requerido | Garantía que debe conservarse |
| --- | --- | --- |
| 3.1 | Knowledge SQLite físico, revisar mediante otro escritor; resolver respuesta blocked frente al antiguo rejects.toThrow | Cambio de revisión durante gateway no consume aprobación ni altera historia/recibo/lifecycle |
| 3.2 | Igual, desactivación real; contrato de resultado bloqueado explícito | Módulo desactivado no recibe autoridad |
| 3.3 | Primera autorización real de fixture sobre SQLite, mantener la prueba de rechazo de reinserción | ApprovalId único, sin segunda autoridad ni rollback parcial |
| 5.4 | Binding + Knowledge SQLite + closure físico; reporte canónico actual | Waiver durable habilita sesión, faltante bloquea; verificar archivo y WRAP_UP |
| 7.2 | SQLite + readback y contador gateway | Segundo consumo recupera el mismo terminal, 1 recibo/1 autoridad |
| 7.3 | Dos módulos, dos ClosureStore y dos KnowledgeStore físicos | Ambos progresan, dos autoridades independientes; no confundir FIFO local con prueba multiproceso |
| 7.4 | Precondiciones reales y autorizadas de cobertura; stores físicos; conservar winner/loser y Scenario4 | Un solo consumo y recibo, segundo resultado idempotente del ganador, misma historia |
| 7.5 | Recibo físicamente alterado con procedencia/destino distinto | Fallo cerrado sin atribuir autoridad al recibo falso; acordar throw/blocked sin omitir comprobaciones |

El negativo externo sin fence devuelve closure_consistency_fence_required y conserva aprobaciones/recibos/historia/lifecycle en cero; se mantiene el store incapaz sin no-op fence. Los ocho positivos aún no han sido migrados; no se promete que migrarlos por sí solo produzca ocho PASS.

## E0a, E1, E2, E3 y Criterio 9

- **E0a:** esperaba entrevista_vista en status; obtiene trabajo porque no tiene contexto/camino canónico compuesto. La suite canonical-interview44/44 comprueba reanudación, pero no convierte este FAIL en PASS. Conservar misma pregunta/version/módulo entre status y rules_set.
- **E1:** primer error por legacy_interview_unavailable; no llega a comprobar redescubrimiento, waivers ni historial. Conservar invalidación por nueva revisión y políticas de waiver/aplicabilidad; no reemplazar por «Discovery no cambia estado».
- **E2:** falta contexto de vista antes de exigir consolidated. Conservar bloqueo sin aprobación, razón mínima, cierre autorizado, selección del siguiente módulo y repetición sin duplicación.
- **E3:** ENOENT rules.yaml tras Discovery no ligado; sus pasos de cierre/reporte/replanificación no corren. La nueva sonda externa sí recorre A closed+B waived→reporte→WRAP_UP→nueva sesión C con persistencia, mediante host de fixture. No sustituye la migración de esta identidad ni la revisión humana auténtica.
- **Criterio 9:** se detiene en Discovery blocked en vez de success. La composición oficial ahora puede adquirir y asociar, pero el manifiesto no inyecta gateways humanos. El host programático permite comprobar la mecánica con inbox separado. Mantener adquisición real, entrevista, requisitos, cobertura y las fuentes de reporte diferenciadas.

Prioridad mínima: reparar A01/A02; migrar ocho positivos a SQLite manteniendo negativos; migrar estos cinco recorridos completos sin omitir garantías. Después, clasificar/migrar restantes por familia, con cada identidad y su nueva equivalencia registrada. No renombrar para ocultar el diferencial ni marcar actividades históricas como pendientes.

## Altas exactas ejecutadas

| Archivo · fullName | Resultado |
| --- | --- |
| canonical-coverage.test.ts · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) VNEXT-014 rescue: session report prefers durable canonical authorization, not legacy rules or synthetic execution | passed |
| canonical-coverage.test.ts · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) VNEXT-014 rescue: controlled A closed + B waived produces distinct canonical report sections | passed |
| host-composition.test.ts · VNEXT-014 host-owned Stdio composition keeps legacy-only startup when no manifest is configured | passed |
| host-composition.test.ts · VNEXT-014 host-owned Stdio composition rejects an explicitly configured nonexistent manifest rather than falling back | passed |
| host-composition.test.ts · VNEXT-014 host-owned Stdio composition opens existing canonical stores, resolves host-declared revisions and does not forge gateways | passed |
| host-composition.test.ts · VNEXT-014 host-owned Stdio composition rejects missing keys and stale pinned revisions without silently adopting a store | passed |
| host-composition.test.ts · VNEXT-014 host-owned Stdio composition only wires explicitly host-approved pinned Discovery consent; rejects missing acknowledgement | passed |
| host-composition.test.ts · VNEXT-014 host-owned Stdio composition fails closed when canonical modules have no durable closure store | passed |

## Resultados por archivo

| Archivo | PASS | FAIL |
| --- | ---: | ---: |
| adversarial-r5-guarantees.test.ts | 26 | 8 |
| canonical-coverage.test.ts | 55 | 0 |
| canonical-interview.test.ts | 44 | 0 |
| discovery-handler.test.ts | 59 | 0 |
| dispatcher-integration.test.ts | 8 | 0 |
| dispatcher.test.ts | 38 | 0 |
| durable-interview.test.ts | 21 | 0 |
| e0-investigation.test.ts | 4 | 0 |
| guidance.test.ts | 7 | 0 |
| host-composition.test.ts | 6 | 0 |
| lifecycle-v3-e2e.test.ts | 2 | 5 |
| p3-verification.test.ts | 8 | 5 |
| p4-2-pregunta-contract.test.ts | 4 | 2 |
| p4-3-1-b-block.test.ts | 7 | 0 |
| p4-3-investigate-before-ask.test.ts | 8 | 0 |
| p4-4-auth-lifecycle.test.ts | 8 | 7 |
| p4-5a-integrity.test.ts | 2 | 10 |
| p4-5a2-integrity.test.ts | 10 | 16 |
| p4-5s1-browser-candidates.test.ts | 11 | 0 |
| plan-handler.test.ts | 31 | 0 |
| report-handler.test.ts | 12 | 0 |
| server.test.ts | 11 | 10 |
| state-handlers.test.ts | 21 | 0 |
| test-handler.test.ts | 20 | 0 |

## Error y stack relevante de cada fallo

Reproducción aislada para cualquier identidad de arriba, sin editar la prueba:

~~~powershell
$pattern = [regex]::Escape('<fullName exacto de la tabla>')
pnpm --filter @qap/mcp exec vitest run src/__tests__/<archivo> -t $pattern --maxWorkers=1 --reporter=verbose
~~~

No afirmar que las aserciones posteriores al primer fallo se ejecutaron. El error/stack siguiente registra la primera falla por identidad; el contrato esperado/observado está en el mensaje y la causa inicial y acción en la tabla anterior. Las rutas corresponden al worktree aislado exacto.

### 1 · adversarial-r5-guarantees.test.ts

Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 3: Obsolete Revision Invalidation Stress-Testing 3.1: Aborts and rolls back if module revision mutates during human review window

~~~text
Error: promise resolved "{ status: 'blocked', …(2) }" instead of rejecting
    at _Assertion.__VITEST_REJECTS__ (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+expect@4.1.11/node_modules/@vitest/expect/dist/index.js:1747:17)
    at _Assertion.propertyGetter (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/chai@6.2.2/node_modules/chai/index.js:1570:27)
    at Reflect.get (<anonymous>)
    at Object.proxyGetter [as get] (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/chai@6.2.2/node_modules/chai/index.js:1659:22)
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts:563:8
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 2 · adversarial-r5-guarantees.test.ts

Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 3: Obsolete Revision Invalidation Stress-Testing 3.2: Aborts if module is deactivated during review

~~~text
Error: promise resolved "{ status: 'blocked', …(2) }" instead of rejecting
    at _Assertion.__VITEST_REJECTS__ (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+expect@4.1.11/node_modules/@vitest/expect/dist/index.js:1747:17)
    at _Assertion.propertyGetter (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/chai@6.2.2/node_modules/chai/index.js:1570:27)
    at Reflect.get (<anonymous>)
    at Object.proxyGetter [as get] (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/chai@6.2.2/node_modules/chai/index.js:1659:22)
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts:616:8
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 3 · adversarial-r5-guarantees.test.ts

Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 3: Obsolete Revision Invalidation Stress-Testing 3.3: Prevents approvalId reuse across closure attempts

~~~text
AssertionError: expected 'blocked' to be 'waived' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts:627:25
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 4 · adversarial-r5-guarantees.test.ts

Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 5: Legacy Closure Bypass Stress-Testing 5.4: Canonical closure unlocks qap_session_close

~~~text
AssertionError: expected 'blocked' to be 'waived' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts:948:34
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 5 · adversarial-r5-guarantees.test.ts

Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 7: CAS Concurrency Stress-Testing 7.2: CanonicalClosureService serializes closure and second attempt is idempotent: true

~~~text
AssertionError: expected 'blocked' to be 'waived' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts:1165:27
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 6 · adversarial-r5-guarantees.test.ts

Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 7: CAS Concurrency Stress-Testing 7.3: Concurrent closure of distinct modules succeeds via bounded retry loop under SQLite CAS lock

~~~text
AssertionError: expected 'blocked' to be 'waived' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts:1209:33
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 7 · adversarial-r5-guarantees.test.ts

Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 7: CAS Concurrency Stress-Testing 7.4: Simultaneous closure requests for same module with divergent gateway decisions persist exactly one closure and canonical receipt

~~~text
AssertionError: expected undefined to be true // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts:1281:32
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 8 · adversarial-r5-guarantees.test.ts

Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 7: CAS Concurrency Stress-Testing 7.5: Rejects write error recovery if existing receipt has tampered provenance or mismatched entity

~~~text
Error: promise resolved "{ status: 'blocked', …(2) }" instead of rejecting
    at _Assertion.__VITEST_REJECTS__ (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+expect@4.1.11/node_modules/@vitest/expect/dist/index.js:1747:17)
    at _Assertion.propertyGetter (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/chai@6.2.2/node_modules/chai/index.js:1570:27)
    at Reflect.get (<anonymous>)
    at Object.proxyGetter [as get] (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/chai@6.2.2/node_modules/chai/index.js:1659:22)
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts:1373:10
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 9 · lifecycle-v3-e2e.test.ts

Lifecycle V3 E2E & Verification Suite (E0 - E3) E0a: qap_status en WORKING para módulo con cobertura incompleta devuelve module, view y preguntas no vacías idénticas a qap_rules_set

~~~text
AssertionError: expected 'trabajo' to be 'entrevista_vista' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/lifecycle-v3-e2e.test.ts:140:52
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 10 · lifecycle-v3-e2e.test.ts

Lifecycle V3 E2E & Verification Suite (E0 - E3) E1: regresión consolidated -> interviewing tras re-discover y política de waivers

~~~text
AssertionError: expected '{\n  "status": "blocked",\n  "code": …' to contain 'La categoría \'proposito\' no se pued…'
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/lifecycle-v3-e2e.test.ts:252:32
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 11 · lifecycle-v3-e2e.test.ts

Lifecycle V3 E2E & Verification Suite (E0 - E3) E2: qap_module_close validaciones, compuertas y transiciones

~~~text
AssertionError: expected 'Falta el contexto de vista requerido …' to contain 'consolidated'
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/lifecycle-v3-e2e.test.ts:339:43
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 12 · lifecycle-v3-e2e.test.ts

Lifecycle V3 E2E & Verification Suite (E0 - E3) E3: canExitWorking, qap_session_close, reporte de brechas y nueva sesión desde WRAP_UP

~~~text
Error: ENOENT: no such file or directory, open 'C:\Users\Judirico\Documents\QAMCP\audit-r4-r10\node_modules\.tmp-rescate\qap-v3-e2e-y81MEj\.qa\modules\auth\rules.yaml'
    at Proxy.readFileSync (node:fs:441:20)
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/lifecycle-v3-e2e.test.ts:407:28
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 13 · lifecycle-v3-e2e.test.ts

Lifecycle V3 E2E & Verification Suite (E0 - E3) Criterio 9: E2E completo: init -> onboarding -> scoping -> working -> discover A -> rules_set parcial -> status (reanuda) -> rules_set completa -> module_close A -> discover B -> module_close waive B -> session_close -> status WRAP_UP -> session_plan nueva sesión

~~~text
AssertionError: expected 'blocked' to be 'success' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/lifecycle-v3-e2e.test.ts:537:30
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 14 · p3-verification.test.ts

P3 Suite de Verificación MCP (T3 - T15) T6: qap_discover éxito: no contiene "Descubrir otro módulo", "pregunta_doc" ni "opciones_doc"; siguiente_accion tipo entrevista_vista (<= 5 preguntas) con tool qap_rules_set, categorias_aplicables y rutas_detectadas_fuera_del_plan

~~~text
TypeError: Cannot read properties of undefined (reading 'tipo')
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p3-verification.test.ts:330:36
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 15 · p3-verification.test.ts

P3 Suite de Verificación MCP (T3 - T15) T7: rules.yaml tras discover: reglas inferred/dom con ids deterministas; re-discover idempotente (sin duplicados, reglas confirmadas intactas)

~~~text
AssertionError: expected false to be true // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p3-verification.test.ts:351:35
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 16 · p3-verification.test.ts

P3 Suite de Verificación MCP (T3 - T15) T9: Fallo de Playwright: no inserta reglas; siguiente_accion tipo decision

~~~text
TypeError: Cannot read properties of undefined (reading 'tipo')
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p3-verification.test.ts:434:36
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 17 · p3-verification.test.ts

P3 Suite de Verificación MCP (T3 - T15) T14: qap_status WORKING: (a) observed con hipótesis reanuda entrevista; (b) interviewing incompleto reanuda; (c) planned elige high > medium > low luego orden; (d) todos completos tipo decision

~~~text
AssertionError: expected 'trabajo' to be 'entrevista_vista' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p3-verification.test.ts:633:50
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 18 · p3-verification.test.ts

P3 Suite de Verificación MCP (T3 - T15) T15: E2E: flujo de P2 hasta WORKING -> discover A -> rules_set parcial -> status (reanuda A) -> rules_set completa cobertura -> status (propone B) -> discover B; ninguna respuesta del flujo contiene texto del bucle

~~~text
AssertionError: expected 'trabajo' to be 'entrevista_vista' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p3-verification.test.ts:755:45
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 19 · p4-2-pregunta-contract.test.ts

P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) Criterio 4.4: Ninguna respuesta con siguiente_accion trae preguntas como cadenas ni pregunta aplanada

~~~text
Error: Tool qap_discover failed: {
  "status": "blocked",
  "code": "knowledge_unbound",
  "persistence": "not_attempted",
  "next_safe_action": "Revisar la configuración explícita del host.",
  "acquisition_status": "blocked",
  "acquisition_persistence": "not_attempted",
  "association_status": "not_attempted",
~~~

### 20 · p4-2-pregunta-contract.test.ts

P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) Criterio 6: E2E Completo donde TODA siguiente_accion de tipo entrevista, entrevista_vista o decision trae Pregunta válida

~~~text
Error: Tool qap_discover failed: {
  "status": "blocked",
  "code": "knowledge_unbound",
  "persistence": "not_attempted",
  "next_safe_action": "Revisar la configuración explícita del host.",
  "acquisition_status": "blocked",
  "acquisition_persistence": "not_attempted",
  "association_status": "not_attempted",
~~~

### 21 · p4-4-auth-lifecycle.test.ts

P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 1. qap_discover protegido sin perfil: blocked auth_required y cero escrituras en disco

~~~text
AssertionError: expected undefined to be 'auth_required' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p4-4-auth-lifecycle.test.ts:175:26
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 22 · p4-4-auth-lifecycle.test.ts

P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 2. qap_discover con redirección HTTP 302 a login: detecta auth_wall determinista y bloquea sin escribir

~~~text
AssertionError: expected undefined to be 'auth_required' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p4-4-auth-lifecycle.test.ts:206:26
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 23 · p4-4-auth-lifecycle.test.ts

P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 3. qap_discover con login embebido en ruta no-acceso: bloquea como auth_required sin persistir

~~~text
AssertionError: expected undefined to be 'auth_required' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p4-4-auth-lifecycle.test.ts:228:26
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 24 · p4-4-auth-lifecycle.test.ts

P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 4. qap_discover con sesión expirada: blocked session_invalid y desverifica el perfil

~~~text
AssertionError: expected undefined to be 'session_invalid' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p4-4-auth-lifecycle.test.ts:294:26
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 25 · p4-4-auth-lifecycle.test.ts

P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 5. qap_discover con perfil verificado y storageState válido: devuelve app y transiciona a observed

~~~text
AssertionError: expected 'blocked' to be 'success' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p4-4-auth-lifecycle.test.ts:366:27
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 26 · p4-4-auth-lifecycle.test.ts

P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 6. qap_discover en módulo de acceso: selectors.json incluye auth_selectors y omite valores y atributos sensibles de password

~~~text
AssertionError: expected 'blocked' to be 'success' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p4-4-auth-lifecycle.test.ts:392:27
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 27 · p4-4-auth-lifecycle.test.ts

P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 15. Guard de cliente asíncrono lento (~1200ms) en qap_discover: responde blocked auth_required y cero escrituras en .qa/modules (C3c)

~~~text
AssertionError: expected undefined to be 'auth_required' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p4-4-auth-lifecycle.test.ts:854:26
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 28 · p4-5a-integrity.test.ts

P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) Criterio 2: regla redactada por agente sin user_text ni from_option se guarda como inferred/agent y no cuenta en cobertura

~~~text
AssertionError: expected 'blocked' to be 'success' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p4-5a-integrity.test.ts:175:31
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 29 · p4-5a-integrity.test.ts

P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) Criterio 3: una etiqueta de opción predefinida del motor NO cubre una categoría

~~~text
AssertionError: expected 'blocked' to be 'success' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p4-5a-integrity.test.ts:210:31
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 30 · p4-5a-integrity.test.ts

P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) Criterio 4: un módulo con 2 reglas de 7 categorías no cierra sin accept_gaps, y cierra con él dejando registro

~~~text
AssertionError: expected 'Falta el contexto de vista requerido …' to be 'cobertura_insuficiente' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p4-5a-integrity.test.ts:245:35
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 31 · p4-5a-integrity.test.ts

P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C9a: blocked de qap_discover con auth_required incluye razon auth_required y directorio_objetivo, con claves alineadas a session_invalid

~~~text
AssertionError: expected undefined to be 'auth_required' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p4-5a-integrity.test.ts:295:37
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 32 · p4-5a-integrity.test.ts

P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C4-a: from_option con pregunta_id inexistente, opcion_id inexistente o sin texto sustantivo (rechazo o degradación a agent/inferred)

~~~text
AssertionError: expected 'blocked' to be 'error' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p4-5a-integrity.test.ts:451:41
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 33 · p4-5a-integrity.test.ts

P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C4-b: límites de sustantividad (2 palabras o 19 caracteres no cubren; 3 palabras y 20 caracteres sí)

~~~text
Error: ENOENT: no such file or directory, open 'C:\Users\Judirico\Documents\QAMCP\audit-r4-r10\node_modules\.tmp-rescate\qap-p45a-5jgnbu\.qa\modules\catalogo\rules.yaml'
    at Proxy.readFileSync (node:fs:441:20)
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p4-5a-integrity.test.ts:535:28
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 34 · p4-5a-integrity.test.ts

P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C4-c: accept_gaps con razón de 14 caracteres bloquea y con 15 cierra y deja el registro

~~~text
AssertionError: expected 'Falta el contexto de vista requerido …' to be 'cobertura_insuficiente' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p4-5a-integrity.test.ts:597:30
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 35 · p4-5a-integrity.test.ts

P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C4-d: plan con auth.required true sin roles queda bloqueado con pregunta de roles y bloquea discover (V4)

~~~text
TypeError: .toMatch() expects to receive a string, but got undefined
    at Proxy.<anonymous> (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+expect@4.1.11/node_modules/@vitest/expect/dist/index.js:1293:10)
    at Proxy.<anonymous> (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+expect@4.1.11/node_modules/@vitest/expect/dist/index.js:1156:15)
    at Proxy.methodWrapper (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/chai@6.2.2/node_modules/chai/index.js:1700:25)
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p4-5a-integrity.test.ts:640:43
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 36 · p4-5a-integrity.test.ts

P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C1: campos honestos en bloqueos previos a navegar y navegación real

~~~text
AssertionError: expected undefined to be 'auth_required' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p4-5a-integrity.test.ts:670:22
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 37 · p4-5a-integrity.test.ts

P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C3: flujo real de preguntas de categoría, formato una_opcion, persistencia y respuestas user_text y deferred

~~~text
AssertionError: expected 'blocked' to be 'success' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p4-5a-integrity.test.ts:716:33
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 38 · p4-5a2-integrity.test.ts

P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C1: Clasificación honesta con adaptador real C1-a: módulo de acceso pedido en login sin redirección NO se bloquea (page_kind login, success)

~~~text
AssertionError: expected 'blocked' to be 'success' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p4-5a2-integrity.test.ts:127:31
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 39 · p4-5a2-integrity.test.ts

P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C1: Clasificación honesta con adaptador real C1-b: ruta protegida con redirección HTTP 302 a /login detecta auth_wall determinista y bloquea

~~~text
AssertionError: expected undefined to be 'auth_required' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p4-5a2-integrity.test.ts:144:30
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 40 · p4-5a2-integrity.test.ts

P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C1: Clasificación honesta con adaptador real C1-c: ruta protegida con guard del lado del cliente detecta auth_wall con redirección al login

~~~text
AssertionError: expected undefined to be 'auth_required' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p4-5a2-integrity.test.ts:161:30
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 41 · p4-5a2-integrity.test.ts

P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C3: Integridad de categoría en from_option y regla de cobertura completa C3-a: la categoría de from_option se toma siempre de la pregunta pendiente persistida

~~~text
AssertionError: expected 'blocked' to be 'success' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p4-5a2-integrity.test.ts:289:31
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 42 · p4-5a2-integrity.test.ts

P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C3: Integridad de categoría en from_option y regla de cobertura completa C3-b: si la petición declara una categoría distinta a la de la pregunta pendiente se rechaza con blocked

~~~text
AssertionError: the given combination of arguments (undefined and string) is invalid for this assertion. You can use an array, a map, an object, a set, a string, or a weakset instead of a string
    at Proxy.<anonymous> (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+expect@4.1.11/node_modules/@vitest/expect/dist/index.js:1319:15)
    at Proxy.<anonymous> (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+expect@4.1.11/node_modules/@vitest/expect/dist/index.js:1156:15)
    at Proxy.methodWrapper (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/chai@6.2.2/node_modules/chai/index.js:1700:25)
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p4-5a2-integrity.test.ts:334:30
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 43 · p4-5a2-integrity.test.ts

P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-a: respuesta corta se guarda como borrador (status inferred, source user_text, borrador true) y no cubre

~~~text
AssertionError: expected 'blocked' to be 'success' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p4-5a2-integrity.test.ts:385:31
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 44 · p4-5a2-integrity.test.ts

P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-b: derivación determinista en categoría actor que nombra roles emite Pregunta una_opcion directamente

~~~text
AssertionError: expected 'blocked' to be 'success' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p4-5a2-integrity.test.ts:416:31
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 45 · p4-5a2-integrity.test.ts

P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-c: envío de propuesta_enunciado válida para un borrador emite Pregunta una_opcion con las 3 opciones

~~~text
AssertionError: expected 'blocked' to be 'success' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p4-5a2-integrity.test.ts:450:40
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 46 · p4-5a2-integrity.test.ts

P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-d: resolver con "Es correcto" guarda regla confirmed user_confirmed con enunciado exacto y cubre

~~~text
TypeError: Cannot read properties of undefined (reading 'id')
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p4-5a2-integrity.test.ts:482:58
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 47 · p4-5a2-integrity.test.ts

P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-e: resolver con "Lo defino después" guarda regla deferred y no cubre

~~~text
TypeError: Cannot read properties of undefined (reading 'id')
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p4-5a2-integrity.test.ts:526:58
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 48 · p4-5a2-integrity.test.ts

P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-f: propuesta_enunciado corta o genérica es rechazada con status error

~~~text
AssertionError: expected 'blocked' to be 'error' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p4-5a2-integrity.test.ts:562:36
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 49 · p4-5a2-integrity.test.ts

P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C10: Detección y advertencia de extracción vacía C10-a: página app/login sin elementos interactivos genera advertencia extraccion_vacia y trabajo

~~~text
AssertionError: expected 'blocked' to be 'success' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p4-5a2-integrity.test.ts:732:31
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 50 · p4-5a2-integrity.test.ts

P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C10: Detección y advertencia de extracción vacía C10-b: página con al menos un elemento interactivo no genera advertencia extraccion_vacia

~~~text
AssertionError: expected 'blocked' to be 'success' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p4-5a2-integrity.test.ts:754:31
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 51 · p4-5a2-integrity.test.ts

P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C10: Detección y advertencia de extracción vacía C10-c: la advertencia extraccion_vacia es agnóstica de la aplicación

~~~text
AssertionError: expected 'blocked' to be 'success' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p4-5a2-integrity.test.ts:770:31
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 52 · p4-5a2-integrity.test.ts

P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C3: Transliteración NFD de slugs y prevención de módulos fuera del plan C1-c: módulo con tilde preserva nombre en lifecycle, crea directorio y normaliza pending_questions con transliteración NFD

~~~text
AssertionError: expected false to be true // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p4-5a2-integrity.test.ts:837:34
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 53 · p4-5a2-integrity.test.ts

P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C3: Transliteración NFD de slugs y prevención de módulos fuera del plan C2-seguimiento: selección de "Corregir" emite pregunta de seguimiento y no persiste regla espuria en rules.yaml

~~~text
AssertionError: expected undefined to be defined
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/p4-5a2-integrity.test.ts:877:17
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 54 · server.test.ts

Suite MCP Server QAP v2.1 / v2.1.2 debe descubrir modulos y responder en desarrollo para qap_plan y qap_test

~~~text
AssertionError: expected true to be falsy
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/server.test.ts:267:36
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 55 · server.test.ts

Suite MCP Server QAP v2.1 / v2.1.2 el contexto de vista generado por qap_discover debe validar contra module-view.schema.json (Criterio 4)

~~~text
AssertionError: expected true to be falsy
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/server.test.ts:637:36
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 56 · server.test.ts

Suite MCP Server QAP v2.1 / v2.1.2 qap_discover con contexto de vista inválido no debe escribir archivos y debe retornar error (Criterio 4)

~~~text
AssertionError: expected 'blocked' to be 'error' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/server.test.ts:724:27
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 57 · server.test.ts

Suite MCP Server QAP v2.1 / v2.1.2 E0a: qap_discover valida contra module-view.schema.json en camino de fallo de Playwright

~~~text
AssertionError: expected true to be falsy
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/server.test.ts:784:25
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 58 · server.test.ts

Suite MCP Server QAP v2.1 / v2.1.2 E0b: qap_discover valida contra module-view.schema.json en vista de autenticacion con session_saved true

~~~text
AssertionError: expected true to be falsy
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/server.test.ts:848:25
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 59 · server.test.ts

Suite MCP Server QAP v2.1 / v2.1.2 E0c: qap_discover valida contra module-view.schema.json en vista con routes_found vacio

~~~text
AssertionError: expected true to be falsy
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/server.test.ts:912:25
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 60 · server.test.ts

Suite MCP Server QAP v2.1 / v2.1.2 qap_discover: gating por fase y estado de modulo, actualizacion planned -> observed

~~~text
AssertionError: expected undefined to be 'ONBOARDING' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/server.test.ts:1261:58
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 61 · server.test.ts

Suite MCP Server QAP v2.1 / v2.1.2 Criterio 7: Proyecto legacy sin campos de negocio valida contra el schema y qap_status responde con fase WORKING derivada

~~~text
AssertionError: expected 'blocked' to be 'success' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/server.test.ts:1411:56
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 62 · server.test.ts

Suite MCP Server QAP v2.1 / v2.1.2 Criterio 8 (E2E): init -> status (entrevista) -> ingest -> context_set compuerta -> auto-SCOPING -> session_plan -> auto-WORKING -> discover

~~~text
AssertionError: expected undefined to be 'ONBOARDING' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/server.test.ts:1445:33
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### 63 · server.test.ts

Suite MCP Server QAP v2.1 / v2.1.2 qap_rules_set: actualiza reglas, transiciona observed -> interviewing, recalcula cobertura y actualiza guidance

~~~text
AssertionError: expected 'planned' to be 'observed' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/src/__tests__/server.test.ts:1604:46
    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~


## Sonda MCP de primeras causas repetida

~~~text
{"name":"qap_init","status":"success","directorio_objetivo":"C:\\Users\\Judirico\\Documents\\QAMCP\\rescate-evidence\\debt-fixture-tzWSlK","message":"✔ Proyecto inicializado con éxito en .qa/","projectName":"debt-fixture-tzWSlK","preflight":{"navegador_qap":"ok","comando_instalacion":"npx playwright install chromium"},"navegador_qap":"ok","repo_map_resumen":{"total_rutas":0,"advertencias":[]},"environments":["local"],"directories":["\\.qa\\project","\\.qa\\modules","\\.qa\\cache","\\.qa\\executions","\\.qa\\plans"],"ya_existia":false,"hallazgos_workspace":{"documentos":[],"subproyectos":[],"servicios":[]},"scan":{"_version":"1","scanned_at":"2026-11-05T19:39:15.717Z","workspace_root":"C:/Users/Judirico/Documents/QAMCP/rescate-evidence/debt-fixture-tzWSlK","documentos":[],"subproyectos":[],"servicios":[]},"advertencias":[],"roles_descartados":[],"lifecycle":{"phase":"ONBOARDING"},"fase":"ONBOARDING","siguiente_accion":{"tipo":"entrevista","descripcion":"Pregunta pendiente de onboarding (onboarding.fuente_de_verdad). Preséntala al usuario usando la herramienta interactiva ask_question.","tool":"qap_context_set","pregunta":{"id":"onboarding.fuente_de_verdad","texto":"Selecciona la fuente de verdad del proyecto para extraer el alcance y especificación:","formato":"una_opcion","opciones":[{"id":"custom","etiqueta":"Sí existe (indicaré la ruta)","recomendada":true,"efecto":{"accion":"declarar_fuente"}},{"id":"none","etiqueta":"No, definimos desde cero","efecto":{"accion":"sin_documento"}}],"permite_otra":true,"registrar_con":{"tool":"qap_context_set","campo":"source_of_truth"},"render_texto":"Selecciona la fuente de verdad del proyecto para extraer el alcance y especificación:\n\n1. Sí existe (indicaré la ruta) [Recomendada]\n2. No, definimos desde cero\n\n(Responde con el número de tu opción o escribe una respuesta libre)"}},"_guidance_for_assistant":"Fase actual: ONBOARDING. Siguiente acción: Pregunta pendiente de onboarding (onboarding.fuente_de_verdad). Preséntala al usuario usando la herramienta interactiva ask_question."}
{"name":"qap_context_set","status":"success","directorio_objetivo":"C:\\Users\\Judirico\\Documents\\QAMCP\\rescate-evidence\\debt-fixture-tzWSlK","fase":"SCOPING","transicion_automatica":true,"faltantes":[],"context":{"_version":"1","project_name":"debt-fixture-tzWSlK","description":"Configuración base de QA para debt-fixture-tzWSlK","tech_stack":[],"base_url":"http://localhost:3000","manually_edited":false,"objective":"Validar flujo de compras y autenticación","objective_source":"user","roles":[{"name":"admin","description":"Administrador","source":"user"}],"critical_flows":[{"name":"login","description":"Flujo de login","source":"user"}],"source_of_truth":{"type":"prd","ref":"prd-inline","declared":true,"source":"user"}},"siguiente_accion":{"tipo":"decision","descripcion":"Define los módulos prioritarios a verificar en esta sesión de trabajo.","tool":"qap_session_plan","pregunta":{"id":"scoping.modulos_a_probar","texto":"Indica los módulos a probar con su nombre y ruta (por ejemplo: Catálogo /catalog, Pagos /checkout):","formato":"abierta","opciones":[],"permite_otra":true,"registrar_con":{"tool":"qap_session_plan","campo":"modules"},"render_texto":"Indica los módulos a probar con su nombre y ruta (por ejemplo: Catálogo /catalog, Pagos /checkout):\n\n(Escribe tu respuesta libremente)"}},"knowledge":{"state":"unbound"},"persistence":"committed"}
{"name":"qap_session_plan","status":"success","directorio_objetivo":"C:\\Users\\Judirico\\Documents\\QAMCP\\rescate-evidence\\debt-fixture-tzWSlK","fase":"WORKING","transicion_automatica":true,"plan":[{"module":"auth","path":"/login","priority":"high","status":"planned","acceso":true,"flujos":[]}],"auth":{"required":false,"source":"user"},"faltantes":[],"siguiente_accion":{"tipo":"trabajo","descripcion":"Siguiente módulo planificado para exploración: 'auth' en ruta '/login'. Ejecuta qap_discover para iniciar.","tool":"qap_discover","module":"auth","modulo":"auth"}}
{"name":"qap_discover","isError":true,"status":"blocked","code":"knowledge_unbound","persistence":"not_attempted","next_safe_action":"Revisar la configuración explícita del host.","acquisition_status":"blocked","acquisition_persistence":"not_attempted","association_status":"not_attempted","module_identity_status":"not_resolved","coverage":"partial"}
{"name":"qap_status","isError":false,"status":"success","directorio_objetivo":"C:\\Users\\Judirico\\Documents\\QAMCP\\rescate-evidence\\debt-fixture-tzWSlK","initialized":true,"context_state":"available","preflight":{"navegador_qap":"ok","comando_instalacion":"npx playwright install chromium"},"navegador_qap":"ok","fase":"WORKING","estados_modulos":{"auth":"planned"},"faltantes":[],"siguiente_accion":{"tipo":"trabajo","descripcion":"Siguiente módulo planificado para exploración: 'auth' en ruta '/login'. Ejecuta qap_discover para iniciar.","tool":"qap_discover","module":"auth","modulo":"auth"},"scan":{"_version":"1","scanned_at":"2026-11-05T19:39:16.106Z","workspace_root":"C:/Users/Judirico/Documents/QAMCP/rescate-evidence/debt-fixture-tzWSlK","documentos":[],"subproyectos":[],"servicios":[]},"hallazgos_workspace":{"documentos":[],"subproyectos":[],"servicios":[]},"advertencias":[],"projectName":"debt-fixture-tzWSlK","environments":["local"],"stats":{"modules":1,"authProfiles":0,"executions":0},"validatorReady":true,"_guidance_for_assistant":"Fase actual: WORKING. Siguiente acción: Siguiente módulo planificado para exploración: 'auth' en ruta '/login'. Ejecuta qap_discover para iniciar.","knowledge":{"state":"unbound"},"canonical_modules":[],"canonical_bridge":{"absence_does_not_imply_no_observations":true,"coverage":"partial","human_review_required":true},"integration":{"discovery_advances_lifecycle":false,"canonical_interview":"unavailable","observations_are_confirmed_requirements":false,"module_association":"inspect_canonical_modules","next_safe_action":"Revisar el inventario con qap_status. Para entrevistar se requiere contexto legacy previamente revisado o una integración futura expresamente autorizada; repetir discovery no crea ese contexto."},"provenance":{"knowledge":"IKnowledgeStore","onboarding":"legacy_files","hallazgos_workspace":"workspace_inspection","preflight":"runtime"},"coverage":"partial_inventory_not_test_verdicts"}
{"name":"qap_rules_set","isError":true,"status":"blocked","code":"legacy_interview_unavailable","persistence":"not_attempted","razon":"El módulo permanece planned. Falta el contexto de vista requerido por la entrevista legacy. Las observaciones canónicas no lo sustituyen ni acreditan cobertura.","desbloquear_con":{"tool":"qap_status","descripcion":"Revisar el inventario con qap_status. Para entrevistar se requiere contexto legacy previamente revisado o una integración futura expresamente autorizada; repetir discovery no crea ese contexto."},"siguiente_accion":{"tipo":"trabajo","tool":"qap_status","descripcion":"Revisar el inventario con qap_status. Para entrevistar se requiere contexto legacy previamente revisado o una integración futura expresamente autorizada; repetir discovery no crea ese contexto."},"integration":{"discovery_advances_lifecycle":false,"canonical_interview":"unavailable","observations_are_confirmed_requirements":false,"module_association":"not_persisted_by_discovery","next_safe_action":"Revisar el inventario con qap_status. Para entrevistar se requiere contexto legacy previamente revisado o una integración futura expresamente autorizada; repetir discovery no crea ese contexto."}}
{"name":"qap_module_close","isError":true,"status":"blocked","code":"legacy_interview_unavailable","persistence":"not_attempted","razon":"Falta el contexto de vista requerido por la entrevista legacy. Las observaciones canónicas no lo sustituyen ni acreditan cobertura.","desbloquear_con":{"tool":"qap_status","descripcion":"Revisar el inventario con qap_status. Para entrevistar se requiere contexto legacy previamente revisado o una integración futura expresamente autorizada; repetir discovery no crea ese contexto."},"siguiente_accion":{"tipo":"trabajo","tool":"qap_status","descripcion":"Revisar el inventario con qap_status. Para entrevistar se requiere contexto legacy previamente revisado o una integración futura expresamente autorizada; repetir discovery no crea ese contexto."},"integration":{"discovery_advances_lifecycle":false,"canonical_interview":"unavailable","observations_are_confirmed_requirements":false,"module_association":"not_persisted_by_discovery","next_safe_action":"Revisar el inventario con qap_status. Para entrevistar se requiere contexto legacy previamente revisado o una integración futura expresamente autorizada; repetir discovery no crea ese contexto."}}
{"name":"qap_discover","isError":true,"status":"blocked","code":"headed_not_supported","persistence":"not_attempted","next_safe_action":"Revisar la configuración explícita del host.","acquisition_status":"blocked","acquisition_persistence":"not_attempted","association_status":"not_attempted","module_identity_status":"not_resolved","coverage":"partial"}
{"lifecycle":{"auth":{"state":"planned","updated_at":"2026-11-05T19:39:15.961Z"}},"rulesExists":false}

~~~

~~~text
{"scenario":"negative-store-without-fence","result":{"status":"blocked","code":"closure_consistency_fence_required","razon":"El almacén canónico no ofrece una frontera de consistencia hasta la persistencia."},"approvals":0,"receipts":0,"history":0,"resourcesUnchanged":true,"reviews":1}

~~~


## Corridas MCP con paralelismo predeterminado: resultados adicionales, sin ocultarlos

El diferencial homologable anterior usa un worker como R4-R12. El comando literal pnpm --filter @qap/mcp test NO tiene ese límite: también se ejecutó y falló de estas maneras. No se suman estos resultados a los del inventario JSON ni se presentan como 423/63.

| Corrida | PASS | FAIL | Total tests ejecutados | Otros errores |
| --- | ---: | ---: | ---: | --- |
| Original, predeterminado | 360 | 67 | 427 | Suite Discovery no cargó (59 no corrieron),3 errores no manejados |
| Repetición sin carga de otra suite externa | 413 | 73 | 486 | 1 error no manejado, EPERM de rename |
| Sonda con observador externo de errores | 418 | 68 | 486 | 3 errores no manejados; observador no capturó el cuerpo previo al JSON.parse en la VM de Vitest |
| Detallada, un worker | 423 | 63 | 486 | Sin errores no manejados registrados |
| Monorepo secuencial, un worker | 423 | 63 | 486 | Sin errores no manejados registrados |

La primera importación Discovery falló con UNKNOWN al abrir un archivo SSR de Vite bajo TEMP. Los timeouts de TestHandler (5000ms) y durable-interview (30000ms) desencadenan cleanup y, después, locks ENOENT/ECOMPROMISED de operaciones aún activas. En la repetición aparecen EPERM de rename lifecycle en las regresiones R10/R11 y fallos adicionales de session_close/proyección cuya respuesta en texto produce SyntaxError al ser tratada como JSON por la prueba. **La causa interna de esos errores de sesión bajo carga no quedó aislada; no se atribuyen automáticamente a ambiente inocuo ni a una regresión productiva del rescate.** Todos los casos pasan en las dos corridas con un worker y en la focal cuando corresponde.

Esto es fragilidad pendiente RES-CODEX-E01 P2 de ejecución/integración en Windows bajo paralelismo. El baseline independiente R12 no contiene una corrida predeterminada equivalente de este entorno, así que los cambios nominales siguientes se clasifican por configuración y no se ocultan en las63 identidades estables. Los dos tests nuevos de reporte pasan focal/un worker, pero fallan en una de las corridas paralelas. No están certificados de forma incondicional.

Corrección solicitada: aislar TEMP/recursos/worker budgets, investigar rename temporal y lock cleanup tras timeout, recuperar el error real de session_close antes de parsear como JSON y comprobar finalización de procesos/operaciones antes de borrar fixtures. Conservar expectativas y pruebas de concurrencia: no aumentar timeouts/suprimir suites como única solución.

### Identidades adicionales por corrida (respecto del PASS con un worker)


### original

| Archivo · fullName exacto | Estado con un worker | Error de esta corrida |
| --- | --- | --- |
| durable-interview.test.ts · R4 encrypted durable interview state terminates Node processes between real MCP SDK operations and reopens both physical stores | passed | Error: Test timed out in 30000ms.
 |
| test-handler.test.ts · TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) Scenario 1: executes valid and authorized plan, persisting authentic result (R4.1) | passed | Error: Test timed out in 5000ms.
 |
| test-handler.test.ts · TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) Scenario 4: in-memory snapshot prevents TOCTOU tampering of YAML files after verification (R4.4) | passed | Error: Test timed out in 5000ms.
 |
| test-handler.test.ts · TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) Scenario 7: rejects unauthorized profiles and disables implicit session recovery (R4.7) | passed | Error: Test timed out in 5000ms.
 Error: ENOENT: no such file or directory, stat 'C:\Users\Judirico\Documents\QAMCP\audit-r4-r10\node_modules\.tmp-rescate\project-root-cvd1mmy\.qa\cache\locks\checkout.lock'
 Error: ENOENT: no such file or directory, stat 'C:\Users\Judirico\Documents\QAMCP\audit-r4-r10\node_modules\.tmp-rescate\project-root-wcosm2w\.qa\cache\locks\orders.lock'
 Error: ENOENT: no such file or directory, stat 'C:\Users\Judirico\Documents\QAMCP\audit-r4-r10\node_modules\.tmp-rescate\project-root-40dcm7d\.qa\cache\locks\secure-mod.lock'
 Error: ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL
 |

**durable-interview.test.ts · R4 encrypted durable interview state terminates Node processes between real MCP SDK operations and reopens both physical stores**

~~~text
Error: Test timed out in 30000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
 ❯ src/__tests__/durable-interview.test.ts:210:3
    208|   });
    209|
    210|   it('terminates Node processes between real MCP SDK operations and re…
       |   ^
    211|     const f = await fixture(); f.drafts.close(); f.store.close();
    212|     const script = `

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[10/68]⎯

~~~
**test-handler.test.ts · TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) Scenario 1: executes valid and authorized plan, persisting authentic result (R4.1)**

~~~text
Error: Test timed out in 5000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
 ❯ src/__tests__/test-handler.test.ts:176:3
    174| describe('TestHandler & PlaywrightRunner Verification Suite — VNEXT-01…
    175|   // Scenario 1: Plan vigente y autorizado (execution passes, persiste…
    176|   it('Scenario 1: executes valid and authorized plan, persisting authe…
       |   ^
    177|     const root = initProject(localServerUrl);
    178|     seedModule(root, 'checkout');

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[66/68]⎯

~~~
**test-handler.test.ts · TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) Scenario 4: in-memory snapshot prevents TOCTOU tampering of YAML files after verification (R4.4)**

~~~text
Error: Test timed out in 5000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
 ❯ src/__tests__/test-handler.test.ts:313:3
    311|
    312|   // Scenario 4: Casos alterados antes de la ejecución (TOCTOU Snapsho…
    313|   it('Scenario 4: in-memory snapshot prevents TOCTOU tampering of YAML…
       |   ^
    314|     const root = initProject(localServerUrl);
    315|     seedModule(root, 'orders');

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[67/68]⎯

~~~
**test-handler.test.ts · TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) Scenario 7: rejects unauthorized profiles and disables implicit session recovery (R4.7)**

~~~text
      Tests  67 failed | 360 passed (427)
     Errors  3 errors
   Start at  13:22:36
   Duration  53.16s (transform 17.15s, setup 0ms, import 136.35s, tests 354.78s, environment 10ms)

[ELIFECYCLE] Test failed. See above for more details.
Error: ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL

  × "pnpm recursive run" failed in C:\Users\Judirico\Documents\QAMCP\audit-r4-
  │ r10\packages\mcp


~~~

### repeat

| Archivo · fullName exacto | Estado con un worker | Error de esta corrida |
| --- | --- | --- |
| canonical-coverage.test.ts · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R10-A01: the official lifecycle writer waits until authorization persistence releases the lock | passed | Error: EPERM: operation not permitted, rename 'C:\Users\Judirico\Documents\QAMCP\audit-r4-r10\node_modules\.tmp-rescate-default-repeat\qap-r5-4t4y6p\.qa\project\lifecycle.json.cddafb213ea9.tmp' -> 'C:\Users\Judirico\Documents\QAMCP\audit-r4-r10\node_modules\.tmp-rescate-default-repeat\qap-r5-4t4y6p\.qa\project\lifecycle.json'
 |
| canonical-coverage.test.ts · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R11-A01: case-aliased official writers wait through durable authorization in all four actions | passed | Error: EPERM: operation not permitted, rename 'C:\USERS\JUDIRICO\DOCUMENTS\QAMCP\AUDIT-R4-R10\NODE_MODULES\.TMP-RESCATE-DEFAULT-REPEAT\QAP-R5-A4GRSQ\.qa\project\lifecycle.json.2c9e8204cb1a.tmp' -> 'C:\USERS\JUDIRICO\DOCUMENTS\QAMCP\AUDIT-R4-R10\NODE_MODULES\.TMP-RESCATE-DEFAULT-REPEAT\QAP-R5-A4GRSQ\.qa\project\lifecycle.json'
 |
| canonical-coverage.test.ts · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) R4-R5-A02: 16 bound modules, last invalid=false, preview stays capped but guidance checks all | passed | src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R5-A02: 16 bound modules, last invalid=false, preview stays capped but guidance checks all
 |
| canonical-coverage.test.ts · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) R4-R5-A02: 17 bound modules, last invalid=false, preview stays capped but guidance checks all | passed | SyntaxError: Unexpected token 'E', "Error ejec"... is not valid JSON
 |
| canonical-coverage.test.ts · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) R4-R2-A01: first session close uses recovered waiver metadata for the gate and physical report | passed | AssertionError: expected true not to be true // Object.is equality
 |
| canonical-coverage.test.ts · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) VNEXT-014 rescue: session report prefers durable canonical authorization, not legacy rules or synthetic execution | passed | SyntaxError: Unexpected token 'E', "Error ejec"... is not valid JSON
 |
| canonical-coverage.test.ts · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) VNEXT-014 rescue: controlled A closed + B waived produces distinct canonical report sections | passed | SyntaxError: Unexpected token 'E', "Error ejec"... is not valid JSON
 |
| discovery-handler.test.ts · VNEXT-013-R2 canonical execution scope bridge R4: real crawler to canonical interview, independent review, secure waiver and WRAP_UP through MCP | passed | SyntaxError: Unexpected token 'E', "Error ejec"... is not valid JSON
 |
| durable-interview.test.ts · R4 encrypted durable interview state terminates Node processes between real MCP SDK operations and reopens both physical stores | passed | Error: Test timed out in 30000ms.
 |
| test-handler.test.ts · TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) Scenario 1: executes valid and authorized plan, persisting authentic result (R4.1) | passed | Error: Test timed out in 5000ms.
 Error: EPERM: operation not permitted, rename 'C:\USERS\JUDIRICO\DOCUMENTS\QAMCP\AUDIT-R4-R10\NODE_MODULES\.TMP-RESCATE-DEFAULT-REPEAT\QAP-R5-A4GRSQ\.qa\project\lifecycle.json.2c9e8204cb1a.tmp' -> 'C:\USERS\JUDIRICO\DOCUMENTS\QAMCP\AUDIT-R4-R10\NODE_MODULES\.TMP-RESCATE-DEFAULT-REPEAT\QAP-R5-A4GRSQ\.qa\project\lifecycle.json'
 Error: ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL
 |

**canonical-coverage.test.ts · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R10-A01: the official lifecycle writer waits until authorization persistence releases the lock**

~~~text
src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R10-A01: the official lifecycle writer waits until authorization persistence releases the lock
Error: EPERM: operation not permitted, rename 'C:\Users\Judirico\Documents\QAMCP\audit-r4-r10\node_modules\.tmp-rescate-default-repeat\qap-r5-4t4y6p\.qa\project\lifecycle.json.cddafb213ea9.tmp' -> 'C:\Users\Judirico\Documents\QAMCP\audit-r4-r10\node_modules\.tmp-rescate-default-repeat\qap-r5-4t4y6p\.qa\project\lifecycle.json'
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[9/73]⎯

~~~
**canonical-coverage.test.ts · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R11-A01: case-aliased official writers wait through durable authorization in all four actions**

~~~text
src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R11-A01: case-aliased official writers wait through durable authorization in all four actions
Error: EPERM: operation not permitted, rename 'C:\USERS\JUDIRICO\DOCUMENTS\QAMCP\AUDIT-R4-R10\NODE_MODULES\.TMP-RESCATE-DEFAULT-REPEAT\QAP-R5-A4GRSQ\.qa\project\lifecycle.json.2c9e8204cb1a.tmp' -> 'C:\USERS\JUDIRICO\DOCUMENTS\QAMCP\AUDIT-R4-R10\NODE_MODULES\.TMP-RESCATE-DEFAULT-REPEAT\QAP-R5-A4GRSQ\.qa\project\lifecycle.json'
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[10/73]⎯

~~~
**canonical-coverage.test.ts · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) R4-R5-A02: 16 bound modules, last invalid=false, preview stays capped but guidance checks all**

~~~text
src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R5-A02: 16 bound modules, last invalid=false, preview stays capped but guidance checks all
~~~
**canonical-coverage.test.ts · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) R4-R5-A02: 17 bound modules, last invalid=false, preview stays capped but guidance checks all**

~~~text
src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R5-A02: 17 bound modules, last invalid=false, preview stays capped but guidance checks all
SyntaxError: Unexpected token 'E', "Error ejec"... is not valid JSON
 ❯ src/__tests__/canonical-coverage.test.ts:1432:26
    1430|
    1431|       const closeReply = await client.callTool({ name: 'qap_session_cl…
    1432|       const close = JSON.parse((closeReply.content[0] as { text: strin…
       |                          ^
    1433|         status: string; fase: string; code?: string; report_path?: str…
    1434|       };

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[11/73]⎯

~~~
**canonical-coverage.test.ts · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) R4-R2-A01: first session close uses recovered waiver metadata for the gate and physical report**

~~~text
src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > R4-R2-A01: first session close uses recovered waiver metadata for the gate and physical report
AssertionError: expected true not to be true // Object.is equality
 ❯ src/__tests__/canonical-coverage.test.ts:1512:33
    1510|         name: 'qap_session_close', arguments: { targetPath: f.root },
    1511|       });
    1512|       expect(first.isError).not.toBe(true);
       |                                 ^
    1513|       const payload = JSON.parse((first.content[0] as { text: string }…
    1514|         status: string; fase: string; report_path: string;

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[12/73]⎯

~~~
**canonical-coverage.test.ts · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) VNEXT-014 rescue: session report prefers durable canonical authorization, not legacy rules or synthetic execution**

~~~text
src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > VNEXT-014 rescue: session report prefers durable canonical authorization, not legacy rules or synthetic execution
SyntaxError: Unexpected token 'E', "Error ejec"... is not valid JSON
 ❯ src/__tests__/canonical-coverage.test.ts:1563:28
    1561|         name: 'qap_session_close', arguments: { targetPath: f.root },
    1562|       });
    1563|       const payload = JSON.parse((result.content[0] as { text: string …
       |                            ^
    1564|         status: string; fase: string; report_path: string;
    1565|         brechas_detectadas: number | null;

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[13/73]⎯

~~~
**canonical-coverage.test.ts · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) VNEXT-014 rescue: controlled A closed + B waived produces distinct canonical report sections**

~~~text
src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) > VNEXT-014 rescue: controlled A closed + B waived produces distinct canonical report sections
SyntaxError: Unexpected token 'E', "Error ejec"... is not valid JSON
 ❯ src/__tests__/canonical-coverage.test.ts:1636:28
    1634|         name: 'qap_session_close', arguments: { targetPath: f.root },
    1635|       });
    1636|       const payload = JSON.parse((response.content[0] as { text: strin…
       |                            ^
    1637|         status: string; fase: string; report_path: string;
    1638|         cierre_canonico: { modulos_cerrados: number; modulos_waived: n…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[14/73]⎯

~~~
**discovery-handler.test.ts · VNEXT-013-R2 canonical execution scope bridge R4: real crawler to canonical interview, independent review, secure waiver and WRAP_UP through MCP**

~~~text
SyntaxError: Unexpected token 'E', "Error ejec"... is not valid JSON
 ❯ invoke src/__tests__/discovery-handler.test.ts:88:15
     86|   const response = await client.request({ method: 'tools/call', params…
     87|   const item = response.content[0]; if (item.type !== 'text') throw ne…
     88|   return JSON.parse(item.text) as Record<string, unknown>;
       |               ^
     89| }
     90|
 ❯ src/__tests__/discovery-handler.test.ts:499:20

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[15/73]⎯

~~~
**durable-interview.test.ts · R4 encrypted durable interview state terminates Node processes between real MCP SDK operations and reopens both physical stores**

~~~text
Error: Test timed out in 30000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
 ❯ src/__tests__/durable-interview.test.ts:210:3
    208|   });
    209|
    210|   it('terminates Node processes between real MCP SDK operations and re…
       |   ^
    211|     const f = await fixture(); f.drafts.close(); f.store.close();
    212|     const script = `

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[16/73]⎯

~~~
**test-handler.test.ts · TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) Scenario 1: executes valid and authorized plan, persisting authentic result (R4.1)**

~~~text
      Tests  73 failed | 413 passed (486)
     Errors  1 error
   Start at  13:45:48
   Duration  55.01s (transform 15.05s, setup 0ms, import 134.94s, tests 384.00s, environment 10ms)

[ELIFECYCLE] Test failed. See above for more details.
Error: ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL

  × "pnpm recursive run" failed in C:\Users\Judirico\Documents\QAMCP\audit-r4-
  │ r10\packages\mcp


~~~

### observed

| Archivo · fullName exacto | Estado con un worker | Error de esta corrida |
| --- | --- | --- |
| canonical-coverage.test.ts · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R10-A01: the official lifecycle writer waits until authorization persistence releases the lock | passed | Error: EPERM: operation not permitted, rename 'C:\Users\Judirico\Documents\QAMCP\audit-r4-r10\node_modules\.tmp-rescate-observed\qap-r5-NF1S72\.qa\project\lifecycle.json.7413b363c89e.tmp' -> 'C:\Users\Judirico\Documents\QAMCP\audit-r4-r10\node_modules\.tmp-rescate-observed\qap-r5-NF1S72\.qa\project\lifecycle.json'
 |
| canonical-coverage.test.ts · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R11-A01: case-aliased official writers wait through durable authorization in all four actions | passed | Error: EPERM: operation not permitted, rename 'C:\USERS\JUDIRICO\DOCUMENTS\QAMCP\AUDIT-R4-R10\NODE_MODULES\.TMP-RESCATE-OBSERVED\QAP-R5-MVJHDM\.qa\project\lifecycle.json.a661da940790.tmp' -> 'C:\USERS\JUDIRICO\DOCUMENTS\QAMCP\AUDIT-R4-R10\NODE_MODULES\.TMP-RESCATE-OBSERVED\QAP-R5-MVJHDM\.qa\project\lifecycle.json'
 |
| durable-interview.test.ts · R4 encrypted durable interview state terminates Node processes between real MCP SDK operations and reopens both physical stores | passed | Error: Test timed out in 30000ms.
 |
| p4-2-pregunta-contract.test.ts · P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) Criterio 4.3: Progresión canónica fuente_de_verdad -> objetivo -> roles -> flujos_criticos -> SCOPING | passed | Error: Test timed out in 5000ms.
 |
| test-handler.test.ts · TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) Scenario 1: executes valid and authorized plan, persisting authentic result (R4.1) | passed | Error: Test timed out in 5000ms.
 Error: ENOENT: no such file or directory, stat 'C:\Users\Judirico\Documents\QAMCP\audit-r4-r10\node_modules\.tmp-rescate-observed\project-root-dxpk8mq\.qa\cache\locks\checkout.lock'
 Error: EPERM: operation not permitted, rename 'C:\Users\Judirico\Documents\QAMCP\audit-r4-r10\node_modules\.tmp-rescate-observed\qap-r5-NF1S72\.qa\project\lifecycle.json.7413b363c89e.tmp' -> 'C:\Users\Judirico\Documents\QAMCP\audit-r4-r10\node_modules\.tmp-rescate-observed\qap-r5-NF1S72\.qa\project\lifecycle.json'
 Error: EPERM: operation not permitted, rename 'C:\USERS\JUDIRICO\DOCUMENTS\QAMCP\AUDIT-R4-R10\NODE_MODULES\.TMP-RESCATE-OBSERVED\QAP-R5-MVJHDM\.qa\project\lifecycle.j |

**canonical-coverage.test.ts · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R10-A01: the official lifecycle writer waits until authorization persistence releases the lock**

~~~text
src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R10-A01: the official lifecycle writer waits until authorization persistence releases the lock
Error: EPERM: operation not permitted, rename 'C:\Users\Judirico\Documents\QAMCP\audit-r4-r10\node_modules\.tmp-rescate-observed\qap-r5-NF1S72\.qa\project\lifecycle.json.7413b363c89e.tmp' -> 'C:\Users\Judirico\Documents\QAMCP\audit-r4-r10\node_modules\.tmp-rescate-observed\qap-r5-NF1S72\.qa\project\lifecycle.json'
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[9/68]⎯

~~~
**canonical-coverage.test.ts · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R11-A01: case-aliased official writers wait through durable authorization in all four actions**

~~~text
src/__tests__/canonical-coverage.test.ts > VNEXT-013-R5 Comprehensive Physical Test Matrix > Suite 3: Host Review Gateway & Trust Boundary (R3) > R4-R11-A01: case-aliased official writers wait through durable authorization in all four actions
Error: EPERM: operation not permitted, rename 'C:\USERS\JUDIRICO\DOCUMENTS\QAMCP\AUDIT-R4-R10\NODE_MODULES\.TMP-RESCATE-OBSERVED\QAP-R5-MVJHDM\.qa\project\lifecycle.json.a661da940790.tmp' -> 'C:\USERS\JUDIRICO\DOCUMENTS\QAMCP\AUDIT-R4-R10\NODE_MODULES\.TMP-RESCATE-OBSERVED\QAP-R5-MVJHDM\.qa\project\lifecycle.json'
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[10/68]⎯

~~~
**durable-interview.test.ts · R4 encrypted durable interview state terminates Node processes between real MCP SDK operations and reopens both physical stores**

~~~text
Error: Test timed out in 30000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
 ❯ src/__tests__/durable-interview.test.ts:210:3
    208|   });
    209|
    210|   it('terminates Node processes between real MCP SDK operations and re…
       |   ^
    211|     const f = await fixture(); f.drafts.close(); f.store.close();
    212|     const script = `

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[11/68]⎯

~~~
**p4-2-pregunta-contract.test.ts · P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) Criterio 4.3: Progresión canónica fuente_de_verdad -> objetivo -> roles -> flujos_criticos -> SCOPING**

~~~text
Error: Test timed out in 5000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
 ❯ src/__tests__/p4-2-pregunta-contract.test.ts:141:3
    139|   });
    140|
    141|   it('Criterio 4.3: Progresión canónica fuente_de_verdad -> objetivo -…
       |   ^
    142|     await callTool('qap_init', { projectName: 'progression-test', base…
    143|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[22/68]⎯

~~~
**test-handler.test.ts · TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) Scenario 1: executes valid and authorized plan, persisting authentic result (R4.1)**

~~~text
      Tests  68 failed | 418 passed (486)
     Errors  3 errors
   Start at  13:49:39
   Duration  55.67s (transform 12.37s, setup 0ms, import 130.65s, tests 383.36s, environment 11ms)

[ELIFECYCLE] Test failed. See above for more details.
Error: ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL

  × "pnpm recursive run" failed in C:\Users\Judirico\Documents\QAMCP\audit-r4-
  │ r10\packages\mcp


~~~
