# Diferencial MCP R4-R8

Código `44c69f826a0599eeee400ff413ae9faedeeecd75`, baseline ejecutado R4-R7 `ea75eb2c52266b174e6d24917c1b089d56834900`. Resultado actual: **410 PASS / 55 FAIL de 465**, 16 archivos PASS / 7 FAIL, salida 1.

Se cotejó el JSON actual con las 462 ocurrencias verbose del apartado MCP del LOGS.md R4-R7 y con sus 55 identidades del diferencial: **407 passed→passed, 55 failed→failed, tres altas R4-R8-A01 passed, cero bajas, cero regresiones de resultado MCP**. No se reejecutó el baseline; fue otra máquina/runtime: Node 24.22.1/SQLite 3.53.4 frente a 24.15.0/3.51.3 actuales.

## Suites

| Archivo | PASS | FAIL |
| --- | ---: | ---: |
| adversarial-r5-guarantees.test.ts | 34 | 0 |
| canonical-coverage.test.ts | 40 | 0 |
| canonical-interview.test.ts | 44 | 0 |
| discovery-handler.test.ts | 59 | 0 |
| dispatcher-integration.test.ts | 8 | 0 |
| dispatcher.test.ts | 38 | 0 |
| durable-interview.test.ts | 21 | 0 |
| e0-investigation.test.ts | 4 | 0 |
| guidance.test.ts | 7 | 0 |
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

## Clasificación de fallos

Los 55 corresponden a las mismas barreras y garantías pendientes de [R4-R5](../VNEXT-014-R4-R5/CLASIFICACION_55_FALLOS.md): contratos/fixtures legacy sin binding o contexto canónico (incluida adquisición autenticada/SPA no soportada por el crawler anónimo), expectativas YAML/guidance antiguas y cinco lifecycle sin recorrido equivalente. Son supuestos incompatibles o deuda de integración histórica; su persistencia no demuestra defectos productivos nuevos ni permite retirar las garantías. No se cambiaron expectativas para hacerlos pasar. La carrera A02 se demostró en sonda adicional y no es un FAIL de esta matriz. Discovery pasó 59/59 aislado y en integral, sin reproducir el timeout histórico, cuya causa sigue indeterminada.

## Identidades y primera falla actual

| ID | Archivo | Título | Resultado R4-R7→R4-R8 | Primer diagnóstico |
| --- | --- | --- | --- | --- |
| R05 | lifecycle-v3-e2e.test.ts | Lifecycle V3 E2E & Verification Suite (E0 - E3) Criterio 9: E2E completo: init -> onboarding -> scoping -> working -> discover A -> rules_set parcial -> status (reanuda) -> rules_set completa -> module_close A -> discover B -> module_close waive B -> session_close -> status WRAP_UP -> session_plan nueva sesión | failed→failed | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| R01 | lifecycle-v3-e2e.test.ts | Lifecycle V3 E2E & Verification Suite (E0 - E3) E0a: qap_status en WORKING para módulo con cobertura incompleta devuelve module, view y preguntas no vacías idénticas a qap_rules_set | failed→failed | AssertionError: expected 'trabajo' to be 'entrevista_vista' // Object.is equality |
| R02 | lifecycle-v3-e2e.test.ts | Lifecycle V3 E2E & Verification Suite (E0 - E3) E1: regresión consolidated -> interviewing tras re-discover y política de waivers | failed→failed | AssertionError: expected '{\n  "status": "blocked",\n  "code": …' to contain 'La categoría \'proposito\' no se pued…' |
| R03 | lifecycle-v3-e2e.test.ts | Lifecycle V3 E2E & Verification Suite (E0 - E3) E2: qap_module_close validaciones, compuertas y transiciones | failed→failed | AssertionError: expected 'Falta el contexto de vista requerido …' to contain 'consolidated' |
| R04 | lifecycle-v3-e2e.test.ts | Lifecycle V3 E2E & Verification Suite (E0 - E3) E3: canExitWorking, qap_session_close, reporte de brechas y nueva sesión desde WRAP_UP | failed→failed | Error: ENOENT: no such file or directory, open '<FIXTURE_TEMP>' |
| R13 | p3-verification.test.ts | P3 Suite de Verificación MCP (T3 - T15) T14: qap_status WORKING: (a) observed con hipótesis reanuda entrevista; (b) interviewing incompleto reanuda; (c) planned elige high > medium > low luego orden; (d) todos completos tipo decision | failed→failed | AssertionError: expected 'trabajo' to be 'entrevista_vista' // Object.is equality |
| R14 | p3-verification.test.ts | P3 Suite de Verificación MCP (T3 - T15) T15: E2E: flujo de P2 hasta WORKING -> discover A -> rules_set parcial -> status (reanuda A) -> rules_set completa cobertura -> status (propone B) -> discover B; ninguna respuesta del flujo contiene texto del bucle | failed→failed | AssertionError: expected 'trabajo' to be 'entrevista_vista' // Object.is equality |
| R06 | p3-verification.test.ts | P3 Suite de Verificación MCP (T3 - T15) T6: qap_discover éxito: no contiene "Descubrir otro módulo", "pregunta_doc" ni "opciones_doc"; siguiente_accion tipo entrevista_vista (<= 5 preguntas) con tool qap_rules_set, categorias_aplicables y rutas_detectadas_fuera_del_plan | failed→failed | TypeError: Cannot read properties of undefined (reading 'tipo') |
| R07 | p3-verification.test.ts | P3 Suite de Verificación MCP (T3 - T15) T7: rules.yaml tras discover: reglas inferred/dom con ids deterministas; re-discover idempotente (sin duplicados, reglas confirmadas intactas) | failed→failed | AssertionError: expected false to be true // Object.is equality |
| R09 | p3-verification.test.ts | P3 Suite de Verificación MCP (T3 - T15) T9: Fallo de Playwright: no inserta reglas; siguiente_accion tipo decision | failed→failed | TypeError: Cannot read properties of undefined (reading 'tipo') |
| R15 | p4-2-pregunta-contract.test.ts | P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) Criterio 4.4: Ninguna respuesta con siguiente_accion trae preguntas como cadenas ni pregunta aplanada | failed→failed | Error: Tool qap_discover failed: { |
| R16 | p4-2-pregunta-contract.test.ts | P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) Criterio 6: E2E Completo donde TODA siguiente_accion de tipo entrevista, entrevista_vista o decision trae Pregunta válida | failed→failed | Error: Tool qap_discover failed: { |
| R18 | p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 1. qap_discover protegido sin perfil: blocked auth_required y cero escrituras en disco | failed→failed | AssertionError: expected undefined to be 'auth_required' // Object.is equality |
| R24 | p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 15. Guard de cliente asíncrono lento (~1200ms) en qap_discover: responde blocked auth_required y cero escrituras en .qa/modules (C3c) | failed→failed | AssertionError: expected undefined to be 'auth_required' // Object.is equality |
| R19 | p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 2. qap_discover con redirección HTTP 302 a login: detecta auth_wall determinista y bloquea sin escribir | failed→failed | AssertionError: expected undefined to be 'auth_required' // Object.is equality |
| R20 | p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 3. qap_discover con login embebido en ruta no-acceso: bloquea como auth_required sin persistir | failed→failed | AssertionError: expected undefined to be 'auth_required' // Object.is equality |
| R21 | p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 4. qap_discover con sesión expirada: blocked session_invalid y desverifica el perfil | failed→failed | AssertionError: expected undefined to be 'session_invalid' // Object.is equality |
| R22 | p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 5. qap_discover con perfil verificado y storageState válido: devuelve app y transiciona a observed | failed→failed | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| R23 | p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 6. qap_discover en módulo de acceso: selectors.json incluye auth_selectors y omite valores y atributos sensibles de password | failed→failed | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| R33 | p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C1: campos honestos en bloqueos previos a navegar y navegación real | failed→failed | AssertionError: expected undefined to be 'auth_required' // Object.is equality |
| R34 | p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C3: flujo real de preguntas de categoría, formato una_opcion, persistencia y respuestas user_text y deferred | failed→failed | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| R29 | p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C4-a: from_option con pregunta_id inexistente, opcion_id inexistente o sin texto sustantivo (rechazo o degradación a agent/inferred) | failed→failed | AssertionError: expected 'blocked' to be 'error' // Object.is equality |
| R30 | p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C4-b: límites de sustantividad (2 palabras o 19 caracteres no cubren; 3 palabras y 20 caracteres sí) | failed→failed | Error: ENOENT: no such file or directory, open '<FIXTURE_TEMP>' |
| R31 | p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C4-c: accept_gaps con razón de 14 caracteres bloquea y con 15 cierra y deja el registro | failed→failed | AssertionError: expected 'Falta el contexto de vista requerido …' to be 'cobertura_insuficiente' // Object.is equality |
| R32 | p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C4-d: plan con auth.required true sin roles queda bloqueado con pregunta de roles y bloquea discover (V4) | failed→failed | TypeError: .toMatch() expects to receive a string, but got undefined |
| R28 | p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C9a: blocked de qap_discover con auth_required incluye razon auth_required y directorio_objetivo, con claves alineadas a session_invalid | failed→failed | AssertionError: expected undefined to be 'auth_required' // Object.is equality |
| R25 | p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) Criterio 2: regla redactada por agente sin user_text ni from_option se guarda como inferred/agent y no cuenta en cobertura | failed→failed | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| R26 | p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) Criterio 3: una etiqueta de opción predefinida del motor NO cubre una categoría | failed→failed | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| R27 | p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) Criterio 4: un módulo con 2 reglas de 7 categorías no cierra sin accept_gaps, y cierra con él dejando registro | failed→failed | AssertionError: expected 'Falta el contexto de vista requerido …' to be 'cobertura_insuficiente' // Object.is equality |
| R46 | p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C10: Detección y advertencia de extracción vacía C10-a: página app/login sin elementos interactivos genera advertencia extraccion_vacia y trabajo | failed→failed | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| R47 | p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C10: Detección y advertencia de extracción vacía C10-b: página con al menos un elemento interactivo no genera advertencia extraccion_vacia | failed→failed | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| R48 | p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C10: Detección y advertencia de extracción vacía C10-c: la advertencia extraccion_vacia es agnóstica de la aplicación | failed→failed | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| R35 | p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C1: Clasificación honesta con adaptador real C1-a: módulo de acceso pedido en login sin redirección NO se bloquea (page_kind login, success) | failed→failed | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| R36 | p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C1: Clasificación honesta con adaptador real C1-b: ruta protegida con redirección HTTP 302 a /login detecta auth_wall determinista y bloquea | failed→failed | AssertionError: expected undefined to be 'auth_required' // Object.is equality |
| R37 | p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C1: Clasificación honesta con adaptador real C1-c: ruta protegida con guard del lado del cliente detecta auth_wall con redirección al login | failed→failed | AssertionError: expected undefined to be 'auth_required' // Object.is equality |
| R38 | p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C3: Integridad de categoría en from_option y regla de cobertura completa C3-a: la categoría de from_option se toma siempre de la pregunta pendiente persistida | failed→failed | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| R39 | p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C3: Integridad de categoría en from_option y regla de cobertura completa C3-b: si la petición declara una categoría distinta a la de la pregunta pendiente se rechaza con blocked | failed→failed | AssertionError: the given combination of arguments (undefined and string) is invalid for this assertion. You can use an array, a map, an object, a set, a string, or a weakset instead of a string |
| R49 | p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C3: Transliteración NFD de slugs y prevención de módulos fuera del plan C1-c: módulo con tilde preserva nombre en lifecycle, crea directorio y normaliza pending_questions con transliteración NFD | failed→failed | AssertionError: expected false to be true // Object.is equality |
| R50 | p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C3: Transliteración NFD de slugs y prevención de módulos fuera del plan C2-seguimiento: selección de "Corregir" emite pregunta de seguimiento y no persiste regla espuria en rules.yaml | failed→failed | AssertionError: expected undefined to be defined |
| R40 | p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-a: respuesta corta se guarda como borrador (status inferred, source user_text, borrador true) y no cubre | failed→failed | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| R41 | p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-b: derivación determinista en categoría actor que nombra roles emite Pregunta una_opcion directamente | failed→failed | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| R42 | p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-c: envío de propuesta_enunciado válida para un borrador emite Pregunta una_opcion con las 3 opciones | failed→failed | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| R43 | p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-d: resolver con "Es correcto" guarda regla confirmed user_confirmed con enunciado exacto y cubre | failed→failed | TypeError: Cannot read properties of undefined (reading 'id') |
| R44 | p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-e: resolver con "Lo defino después" guarda regla deferred y no cubre | failed→failed | TypeError: Cannot read properties of undefined (reading 'id') |
| R45 | p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-f: propuesta_enunciado corta o genérica es rechazada con status error | failed→failed | AssertionError: expected 'blocked' to be 'error' // Object.is equality |
| R58 | server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 Criterio 7: Proyecto legacy sin campos de negocio valida contra el schema y qap_status responde con fase WORKING derivada | failed→failed | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| R59 | server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 Criterio 8 (E2E): init -> status (entrevista) -> ingest -> context_set compuerta -> auto-SCOPING -> session_plan -> auto-WORKING -> discover | failed→failed | AssertionError: expected undefined to be 'ONBOARDING' // Object.is equality |
| R54 | server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 E0a: qap_discover valida contra module-view.schema.json en camino de fallo de Playwright | failed→failed | AssertionError: expected true to be falsy |
| R55 | server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 E0b: qap_discover valida contra module-view.schema.json en vista de autenticacion con session_saved true | failed→failed | AssertionError: expected true to be falsy |
| R56 | server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 E0c: qap_discover valida contra module-view.schema.json en vista con routes_found vacio | failed→failed | AssertionError: expected true to be falsy |
| R51 | server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 debe descubrir modulos y responder en desarrollo para qap_plan y qap_test | failed→failed | AssertionError: expected true to be falsy |
| R52 | server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 el contexto de vista generado por qap_discover debe validar contra module-view.schema.json (Criterio 4) | failed→failed | AssertionError: expected true to be falsy |
| R53 | server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 qap_discover con contexto de vista inválido no debe escribir archivos y debe retornar error (Criterio 4) | failed→failed | AssertionError: expected 'blocked' to be 'error' // Object.is equality |
| R57 | server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 qap_discover: gating por fase y estado de modulo, actualizacion planned -> observed | failed→failed | AssertionError: expected undefined to be 'ONBOARDING' // Object.is equality |
| R60 | server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 qap_rules_set: actualiza reglas, transiciona observed -> interviewing, recalcula cobertura y actualiza guidance | failed→failed | AssertionError: expected 'planned' to be 'observed' // Object.is equality |

## Tres altas aprobadas

- VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R8-A01: deferred non-applicability review retains request identity and persists actual host decision time
- VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R8-A01: stale approval cannot authorize changed reason or canonical requirement revision
- VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R8-A01: host approval is rejected if knowledge mutates while awaiting the gateway
