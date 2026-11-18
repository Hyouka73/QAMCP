# Diferencial MCP por archivo y título completo

Baseline `4ed8511f2ee88e63ff2da21a5a6f45dd6786f7f9`. HEAD `7e0142a97c67fa1c65c46a83e2a5f003b0b435cd`. Ambos JSON provienen de Node 24 con FTS5.

- Baseline {'passed': 394, 'failed': 55}
- HEAD {'passed': 401, 'failed': 55}
- Transiciones entre títulos comunes {('failed', 'failed'): 55, ('passed', 'passed'): 394}
- Fallos R4-R3 por archivo {'lifecycle-v3-e2e.test.ts': 5, 'p3-verification.test.ts': 5, 'p4-2-pregunta-contract.test.ts': 2, 'p4-4-auth-lifecycle.test.ts': 7, 'p4-5a-integrity.test.ts': 10, 'p4-5a2-integrity.test.ts': 16, 'server.test.ts': 10}
- Fallos R4-R3 reconocidos por el inventario VNEXT-013 55/55

## Altas y bajas

- Alta `canonical-coverage.test.ts` · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) R4-R3: inconsistent durable closure 'already waived without approval' cannot create receipt or reach WRAP_UP · **passed**
- Alta `canonical-coverage.test.ts` · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) R4-R3: inconsistent durable closure 'blank reason' cannot create receipt or reach WRAP_UP · **passed**
- Alta `canonical-coverage.test.ts` · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) R4-R3: inconsistent durable closure 'closed without approval' cannot create receipt or reach WRAP_UP · **passed**
- Alta `canonical-coverage.test.ts` · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) R4-R3: inconsistent durable closure 'duplicated approval' cannot create receipt or reach WRAP_UP · **passed**
- Alta `canonical-coverage.test.ts` · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) R4-R3: inconsistent durable closure 'mismatched approval digest' cannot create receipt or reach WRAP_UP · **passed**
- Alta `canonical-coverage.test.ts` · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) R4-R3: inconsistent durable closure 'missing approval' cannot create receipt or reach WRAP_UP · **passed**
- Alta `canonical-coverage.test.ts` · VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) R4-R3: inconsistent durable closure 'short reason' cannot create receipt or reach WRAP_UP · **passed**

## Fallos, incluidos los 55 del baseline

| VNEXT-013 | Archivo | Título completo | R4-R2 | R4-R3 |
|---|---|---|---|---|
| R05 | lifecycle-v3-e2e.test.ts | Lifecycle V3 E2E & Verification Suite (E0 - E3) Criterio 9: E2E completo: init -> onboarding -> scoping -> working -> discover A -> rules_set parcial -> status (reanuda) -> rules_set completa -> module_close A -> discover B -> module_close waive B -> session_close -> status WRAP_UP -> session_plan nueva sesión | failed | failed |
| R01 | lifecycle-v3-e2e.test.ts | Lifecycle V3 E2E & Verification Suite (E0 - E3) E0a: qap_status en WORKING para módulo con cobertura incompleta devuelve module, view y preguntas no vacías idénticas a qap_rules_set | failed | failed |
| R02 | lifecycle-v3-e2e.test.ts | Lifecycle V3 E2E & Verification Suite (E0 - E3) E1: regresión consolidated -> interviewing tras re-discover y política de waivers | failed | failed |
| R03 | lifecycle-v3-e2e.test.ts | Lifecycle V3 E2E & Verification Suite (E0 - E3) E2: qap_module_close validaciones, compuertas y transiciones | failed | failed |
| R04 | lifecycle-v3-e2e.test.ts | Lifecycle V3 E2E & Verification Suite (E0 - E3) E3: canExitWorking, qap_session_close, reporte de brechas y nueva sesión desde WRAP_UP | failed | failed |
| R13 | p3-verification.test.ts | P3 Suite de Verificación MCP (T3 - T15) T14: qap_status WORKING: (a) observed con hipótesis reanuda entrevista; (b) interviewing incompleto reanuda; (c) planned elige high > medium > low luego orden; (d) todos completos tipo decision | failed | failed |
| R14 | p3-verification.test.ts | P3 Suite de Verificación MCP (T3 - T15) T15: E2E: flujo de P2 hasta WORKING -> discover A -> rules_set parcial -> status (reanuda A) -> rules_set completa cobertura -> status (propone B) -> discover B; ninguna respuesta del flujo contiene texto del bucle | failed | failed |
| R06 | p3-verification.test.ts | P3 Suite de Verificación MCP (T3 - T15) T6: qap_discover éxito: no contiene "Descubrir otro módulo", "pregunta_doc" ni "opciones_doc"; siguiente_accion tipo entrevista_vista (<= 5 preguntas) con tool qap_rules_set, categorias_aplicables y rutas_detectadas_fuera_del_plan | failed | failed |
| R07 | p3-verification.test.ts | P3 Suite de Verificación MCP (T3 - T15) T7: rules.yaml tras discover: reglas inferred/dom con ids deterministas; re-discover idempotente (sin duplicados, reglas confirmadas intactas) | failed | failed |
| R09 | p3-verification.test.ts | P3 Suite de Verificación MCP (T3 - T15) T9: Fallo de Playwright: no inserta reglas; siguiente_accion tipo decision | failed | failed |
| R15 | p4-2-pregunta-contract.test.ts | P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) Criterio 4.4: Ninguna respuesta con siguiente_accion trae preguntas como cadenas ni pregunta aplanada | failed | failed |
| R16 | p4-2-pregunta-contract.test.ts | P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) Criterio 6: E2E Completo donde TODA siguiente_accion de tipo entrevista, entrevista_vista o decision trae Pregunta válida | failed | failed |
| R18 | p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 1. qap_discover protegido sin perfil: blocked auth_required y cero escrituras en disco | failed | failed |
| R24 | p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 15. Guard de cliente asíncrono lento (~1200ms) en qap_discover: responde blocked auth_required y cero escrituras en .qa/modules (C3c) | failed | failed |
| R19 | p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 2. qap_discover con redirección HTTP 302 a login: detecta auth_wall determinista y bloquea sin escribir | failed | failed |
| R20 | p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 3. qap_discover con login embebido en ruta no-acceso: bloquea como auth_required sin persistir | failed | failed |
| R21 | p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 4. qap_discover con sesión expirada: blocked session_invalid y desverifica el perfil | failed | failed |
| R22 | p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 5. qap_discover con perfil verificado y storageState válido: devuelve app y transiciona a observed | failed | failed |
| R23 | p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 6. qap_discover en módulo de acceso: selectors.json incluye auth_selectors y omite valores y atributos sensibles de password | failed | failed |
| R33 | p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C1: campos honestos en bloqueos previos a navegar y navegación real | failed | failed |
| R34 | p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C3: flujo real de preguntas de categoría, formato una_opcion, persistencia y respuestas user_text y deferred | failed | failed |
| R29 | p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C4-a: from_option con pregunta_id inexistente, opcion_id inexistente o sin texto sustantivo (rechazo o degradación a agent/inferred) | failed | failed |
| R30 | p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C4-b: límites de sustantividad (2 palabras o 19 caracteres no cubren; 3 palabras y 20 caracteres sí) | failed | failed |
| R31 | p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C4-c: accept_gaps con razón de 14 caracteres bloquea y con 15 cierra y deja el registro | failed | failed |
| R32 | p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C4-d: plan con auth.required true sin roles queda bloqueado con pregunta de roles y bloquea discover (V4) | failed | failed |
| R28 | p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C9a: blocked de qap_discover con auth_required incluye razon auth_required y directorio_objetivo, con claves alineadas a session_invalid | failed | failed |
| R25 | p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) Criterio 2: regla redactada por agente sin user_text ni from_option se guarda como inferred/agent y no cuenta en cobertura | failed | failed |
| R26 | p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) Criterio 3: una etiqueta de opción predefinida del motor NO cubre una categoría | failed | failed |
| R27 | p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) Criterio 4: un módulo con 2 reglas de 7 categorías no cierra sin accept_gaps, y cierra con él dejando registro | failed | failed |
| R46 | p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C10: Detección y advertencia de extracción vacía C10-a: página app/login sin elementos interactivos genera advertencia extraccion_vacia y trabajo | failed | failed |
| R47 | p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C10: Detección y advertencia de extracción vacía C10-b: página con al menos un elemento interactivo no genera advertencia extraccion_vacia | failed | failed |
| R48 | p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C10: Detección y advertencia de extracción vacía C10-c: la advertencia extraccion_vacia es agnóstica de la aplicación | failed | failed |
| R35 | p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C1: Clasificación honesta con adaptador real C1-a: módulo de acceso pedido en login sin redirección NO se bloquea (page_kind login, success) | failed | failed |
| R36 | p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C1: Clasificación honesta con adaptador real C1-b: ruta protegida con redirección HTTP 302 a /login detecta auth_wall determinista y bloquea | failed | failed |
| R37 | p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C1: Clasificación honesta con adaptador real C1-c: ruta protegida con guard del lado del cliente detecta auth_wall con redirección al login | failed | failed |
| R38 | p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C3: Integridad de categoría en from_option y regla de cobertura completa C3-a: la categoría de from_option se toma siempre de la pregunta pendiente persistida | failed | failed |
| R39 | p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C3: Integridad de categoría en from_option y regla de cobertura completa C3-b: si la petición declara una categoría distinta a la de la pregunta pendiente se rechaza con blocked | failed | failed |
| R49 | p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C3: Transliteración NFD de slugs y prevención de módulos fuera del plan C1-c: módulo con tilde preserva nombre en lifecycle, crea directorio y normaliza pending_questions con transliteración NFD | failed | failed |
| R50 | p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C3: Transliteración NFD de slugs y prevención de módulos fuera del plan C2-seguimiento: selección de "Corregir" emite pregunta de seguimiento y no persiste regla espuria en rules.yaml | failed | failed |
| R40 | p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-a: respuesta corta se guarda como borrador (status inferred, source user_text, borrador true) y no cubre | failed | failed |
| R41 | p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-b: derivación determinista en categoría actor que nombra roles emite Pregunta una_opcion directamente | failed | failed |
| R42 | p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-c: envío de propuesta_enunciado válida para un borrador emite Pregunta una_opcion con las 3 opciones | failed | failed |
| R43 | p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-d: resolver con "Es correcto" guarda regla confirmed user_confirmed con enunciado exacto y cubre | failed | failed |
| R44 | p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-e: resolver con "Lo defino después" guarda regla deferred y no cubre | failed | failed |
| R45 | p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-f: propuesta_enunciado corta o genérica es rechazada con status error | failed | failed |
| R58 | server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 Criterio 7: Proyecto legacy sin campos de negocio valida contra el schema y qap_status responde con fase WORKING derivada | failed | failed |
| R59 | server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 Criterio 8 (E2E): init -> status (entrevista) -> ingest -> context_set compuerta -> auto-SCOPING -> session_plan -> auto-WORKING -> discover | failed | failed |
| R54 | server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 E0a: qap_discover valida contra module-view.schema.json en camino de fallo de Playwright | failed | failed |
| R55 | server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 E0b: qap_discover valida contra module-view.schema.json en vista de autenticacion con session_saved true | failed | failed |
| R56 | server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 E0c: qap_discover valida contra module-view.schema.json en vista con routes_found vacio | failed | failed |
| R51 | server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 debe descubrir modulos y responder en desarrollo para qap_plan y qap_test | failed | failed |
| R52 | server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 el contexto de vista generado por qap_discover debe validar contra module-view.schema.json (Criterio 4) | failed | failed |
| R53 | server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 qap_discover con contexto de vista inválido no debe escribir archivos y debe retornar error (Criterio 4) | failed | failed |
| R57 | server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 qap_discover: gating por fase y estado de modulo, actualizacion planned -> observed | failed | failed |
| R60 | server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 qap_rules_set: actualiza reglas, transiciona observed -> interviewing, recalcula cobertura y actualiza guidance | failed | failed |


## Resultados MCP por suite

Cada celda indica PASS / FAIL / sin resultado.

| Suite | Primera ejecución | Reintento |
|---|---:|---:|
| adversarial-r5-guarantees.test.ts | 34 / 0 / 0 | 34 / 0 / 0 |
| canonical-coverage.test.ts | 33 / 0 / 0 | 33 / 0 / 0 |
| canonical-interview.test.ts | 42 / 0 / 0 | 42 / 0 / 0 |
| discovery-handler.test.ts | 1 / 0 / 58 | 59 / 0 / 0 |
| dispatcher-integration.test.ts | 8 / 0 / 0 | 8 / 0 / 0 |
| dispatcher.test.ts | 38 / 0 / 0 | 38 / 0 / 0 |
| durable-interview.test.ts | 21 / 0 / 0 | 21 / 0 / 0 |
| e0-investigation.test.ts | 4 / 0 / 0 | 4 / 0 / 0 |
| guidance.test.ts | 7 / 0 / 0 | 7 / 0 / 0 |
| lifecycle-v3-e2e.test.ts | 2 / 5 / 0 | 2 / 5 / 0 |
| p3-verification.test.ts | 8 / 5 / 0 | 8 / 5 / 0 |
| p4-2-pregunta-contract.test.ts | 4 / 2 / 0 | 4 / 2 / 0 |
| p4-3-1-b-block.test.ts | 7 / 0 / 0 | 7 / 0 / 0 |
| p4-3-investigate-before-ask.test.ts | 8 / 0 / 0 | 8 / 0 / 0 |
| p4-4-auth-lifecycle.test.ts | 8 / 7 / 0 | 8 / 7 / 0 |
| p4-5a-integrity.test.ts | 2 / 10 / 0 | 2 / 10 / 0 |
| p4-5a2-integrity.test.ts | 10 / 16 / 0 | 10 / 16 / 0 |
| p4-5s1-browser-candidates.test.ts | 11 / 0 / 0 | 11 / 0 / 0 |
| plan-handler.test.ts | 31 / 0 / 0 | 31 / 0 / 0 |
| report-handler.test.ts | 12 / 0 / 0 | 12 / 0 / 0 |
| server.test.ts | 11 / 10 / 0 | 11 / 10 / 0 |
| state-handlers.test.ts | 21 / 0 / 0 | 21 / 0 / 0 |
| test-handler.test.ts | 20 / 0 / 0 | 20 / 0 / 0 |
