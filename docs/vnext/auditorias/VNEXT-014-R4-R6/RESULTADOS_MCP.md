# Resultados MCP R4-R6

Integral serial: **406 PASS / 55 FAIL / 461**, 23 suites (16 PASS / 7 FAIL), salida 1. La matriz compara archivo y título completo, contabilizando ocurrencias duplicadas. [Diferencial completo](DIFERENCIAL_MCP.md).

| Suite | PASS | FAIL | Otros |
| --- | ---: | ---: | ---: |
| adversarial-r5-guarantees.test.ts | 34 | 0 | 0 |
| canonical-coverage.test.ts | 37 | 0 | 0 |
| canonical-interview.test.ts | 43 | 0 | 0 |
| discovery-handler.test.ts | 59 | 0 | 0 |
| dispatcher-integration.test.ts | 8 | 0 | 0 |
| dispatcher.test.ts | 38 | 0 | 0 |
| durable-interview.test.ts | 21 | 0 | 0 |
| e0-investigation.test.ts | 4 | 0 | 0 |
| guidance.test.ts | 7 | 0 | 0 |
| lifecycle-v3-e2e.test.ts | 2 | 5 | 0 |
| p3-verification.test.ts | 8 | 5 | 0 |
| p4-2-pregunta-contract.test.ts | 4 | 2 | 0 |
| p4-3-1-b-block.test.ts | 7 | 0 | 0 |
| p4-3-investigate-before-ask.test.ts | 8 | 0 | 0 |
| p4-4-auth-lifecycle.test.ts | 8 | 7 | 0 |
| p4-5a-integrity.test.ts | 2 | 10 | 0 |
| p4-5a2-integrity.test.ts | 10 | 16 | 0 |
| p4-5s1-browser-candidates.test.ts | 11 | 0 | 0 |
| plan-handler.test.ts | 31 | 0 | 0 |
| report-handler.test.ts | 12 | 0 | 0 |
| server.test.ts | 11 | 10 | 0 |
| state-handlers.test.ts | 21 | 0 | 0 |
| test-handler.test.ts | 20 | 0 | 0 |

## Primer error observado de los 55 históricos

Se conserva el primer error emitido por Vitest, sin suponer que se ejecutaron las aserciones posteriores. Las respuestas de preparación históricas y su clasificación contractual están en [R4-R5](../VNEXT-014-R4-R5/CLASIFICACION_55_FALLOS.md); el [siguiente bloque P0](SIGUIENTE_BLOQUE_P0.md) distingue los servicios existentes de la composición pendiente.

| Archivo y título del caso | Primera línea | Primer error real |
| --- | ---: | --- |
| lifecycle-v3-e2e.test.ts · E0a: qap_status en WORKING para módulo con cobertura incompleta devuelve module, view y preguntas no vacías idénticas a qap_rules_set | 140 | AssertionError: expected 'trabajo' to be 'entrevista_vista' // Object.is equality |
| lifecycle-v3-e2e.test.ts · E1: regresión consolidated -> interviewing tras re-discover y política de waivers | 252 | AssertionError: expected '{\n  "status": "blocked",\n  "code": …' to contain 'La categoría \'proposito\' no se pued…' |
| lifecycle-v3-e2e.test.ts · E2: qap_module_close validaciones, compuertas y transiciones | 339 | AssertionError: expected 'Falta el contexto de vista requerido …' to contain 'consolidated' |
| lifecycle-v3-e2e.test.ts · E3: canExitWorking, qap_session_close, reporte de brechas y nueva sesión desde WRAP_UP | 407 | Error: ENOENT: no such file or directory, open '<TEMP>/qap-v3-e2e-kjiUbt\.qa\modules\auth\rules.yaml' |
| lifecycle-v3-e2e.test.ts · Criterio 9: E2E completo: init -> onboarding -> scoping -> working -> discover A -> rules_set parcial -> status (reanuda) -> rules_set completa -> module_close A -> discover B -> module_close waive B -> session_close -> status WRAP_UP -> session_plan nueva sesión | 537 | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p3-verification.test.ts · T6: qap_discover éxito: no contiene "Descubrir otro módulo", "pregunta_doc" ni "opciones_doc"; siguiente_accion tipo entrevista_vista (<= 5 preguntas) con tool qap_rules_set, categorias_aplicables y rutas_detectadas_fuera_del_plan | 330 | TypeError: Cannot read properties of undefined (reading 'tipo') |
| p3-verification.test.ts · T7: rules.yaml tras discover: reglas inferred/dom con ids deterministas; re-discover idempotente (sin duplicados, reglas confirmadas intactas) | 351 | AssertionError: expected false to be true // Object.is equality |
| p3-verification.test.ts · T9: Fallo de Playwright: no inserta reglas; siguiente_accion tipo decision | 434 | TypeError: Cannot read properties of undefined (reading 'tipo') |
| p3-verification.test.ts · T14: qap_status WORKING: (a) observed con hipótesis reanuda entrevista; (b) interviewing incompleto reanuda; (c) planned elige high > medium > low luego orden; (d) todos completos tipo decision | 633 | AssertionError: expected 'trabajo' to be 'entrevista_vista' // Object.is equality |
| p3-verification.test.ts · T15: E2E: flujo de P2 hasta WORKING -> discover A -> rules_set parcial -> status (reanuda A) -> rules_set completa cobertura -> status (propone B) -> discover B; ninguna respuesta del flujo contiene texto del bucle | 755 | AssertionError: expected 'trabajo' to be 'entrevista_vista' // Object.is equality |
| p4-2-pregunta-contract.test.ts · Criterio 4.4: Ninguna respuesta con siguiente_accion trae preguntas como cadenas ni pregunta aplanada | 95 | Error: Tool qap_discover failed: { |
| p4-2-pregunta-contract.test.ts · Criterio 6: E2E Completo donde TODA siguiente_accion de tipo entrevista, entrevista_vista o decision trae Pregunta válida | 95 | Error: Tool qap_discover failed: { |
| p4-4-auth-lifecycle.test.ts · 1. qap_discover protegido sin perfil: blocked auth_required y cero escrituras en disco | 175 | AssertionError: expected undefined to be 'auth_required' // Object.is equality |
| p4-4-auth-lifecycle.test.ts · 2. qap_discover con redirección HTTP 302 a login: detecta auth_wall determinista y bloquea sin escribir | 206 | AssertionError: expected undefined to be 'auth_required' // Object.is equality |
| p4-4-auth-lifecycle.test.ts · 3. qap_discover con login embebido en ruta no-acceso: bloquea como auth_required sin persistir | 228 | AssertionError: expected undefined to be 'auth_required' // Object.is equality |
| p4-4-auth-lifecycle.test.ts · 4. qap_discover con sesión expirada: blocked session_invalid y desverifica el perfil | 294 | AssertionError: expected undefined to be 'session_invalid' // Object.is equality |
| p4-4-auth-lifecycle.test.ts · 5. qap_discover con perfil verificado y storageState válido: devuelve app y transiciona a observed | 366 | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-4-auth-lifecycle.test.ts · 6. qap_discover en módulo de acceso: selectors.json incluye auth_selectors y omite valores y atributos sensibles de password | 392 | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-4-auth-lifecycle.test.ts · 15. Guard de cliente asíncrono lento (~1200ms) en qap_discover: responde blocked auth_required y cero escrituras en .qa/modules (C3c) | 854 | AssertionError: expected undefined to be 'auth_required' // Object.is equality |
| p4-5a-integrity.test.ts · Criterio 2: regla redactada por agente sin user_text ni from_option se guarda como inferred/agent y no cuenta en cobertura | 175 | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-5a-integrity.test.ts · Criterio 3: una etiqueta de opción predefinida del motor NO cubre una categoría | 210 | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-5a-integrity.test.ts · Criterio 4: un módulo con 2 reglas de 7 categorías no cierra sin accept_gaps, y cierra con él dejando registro | 245 | AssertionError: expected 'Falta el contexto de vista requerido …' to be 'cobertura_insuficiente' // Object.is equality |
| p4-5a-integrity.test.ts · C9a: blocked de qap_discover con auth_required incluye razon auth_required y directorio_objetivo, con claves alineadas a session_invalid | 295 | AssertionError: expected undefined to be 'auth_required' // Object.is equality |
| p4-5a-integrity.test.ts · C4-a: from_option con pregunta_id inexistente, opcion_id inexistente o sin texto sustantivo (rechazo o degradación a agent/inferred) | 451 | AssertionError: expected 'blocked' to be 'error' // Object.is equality |
| p4-5a-integrity.test.ts · C4-b: límites de sustantividad (2 palabras o 19 caracteres no cubren; 3 palabras y 20 caracteres sí) | 535 | Error: ENOENT: no such file or directory, open '<TEMP>/qap-p45a-zzFljJ\.qa\modules\catalogo\rules.yaml' |
| p4-5a-integrity.test.ts · C4-c: accept_gaps con razón de 14 caracteres bloquea y con 15 cierra y deja el registro | 597 | AssertionError: expected 'Falta el contexto de vista requerido …' to be 'cobertura_insuficiente' // Object.is equality |
| p4-5a-integrity.test.ts · C4-d: plan con auth.required true sin roles queda bloqueado con pregunta de roles y bloquea discover (V4) | 640 | TypeError: .toMatch() expects to receive a string, but got undefined |
| p4-5a-integrity.test.ts · C1: campos honestos en bloqueos previos a navegar y navegación real | 670 | AssertionError: expected undefined to be 'auth_required' // Object.is equality |
| p4-5a-integrity.test.ts · C3: flujo real de preguntas de categoría, formato una_opcion, persistencia y respuestas user_text y deferred | 716 | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-5a2-integrity.test.ts · C1-a: módulo de acceso pedido en login sin redirección NO se bloquea (page_kind login, success) | 127 | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-5a2-integrity.test.ts · C1-b: ruta protegida con redirección HTTP 302 a /login detecta auth_wall determinista y bloquea | 144 | AssertionError: expected undefined to be 'auth_required' // Object.is equality |
| p4-5a2-integrity.test.ts · C1-c: ruta protegida con guard del lado del cliente detecta auth_wall con redirección al login | 161 | AssertionError: expected undefined to be 'auth_required' // Object.is equality |
| p4-5a2-integrity.test.ts · C3-a: la categoría de from_option se toma siempre de la pregunta pendiente persistida | 289 | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-5a2-integrity.test.ts · C3-b: si la petición declara una categoría distinta a la de la pregunta pendiente se rechaza con blocked | 334 | AssertionError: the given combination of arguments (undefined and string) is invalid for this assertion. You can use an array, a map, an object, a set, a string, or a weakset instead of a string |
| p4-5a2-integrity.test.ts · C4-a: respuesta corta se guarda como borrador (status inferred, source user_text, borrador true) y no cubre | 385 | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-5a2-integrity.test.ts · C4-b: derivación determinista en categoría actor que nombra roles emite Pregunta una_opcion directamente | 416 | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-5a2-integrity.test.ts · C4-c: envío de propuesta_enunciado válida para un borrador emite Pregunta una_opcion con las 3 opciones | 450 | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-5a2-integrity.test.ts · C4-d: resolver con "Es correcto" guarda regla confirmed user_confirmed con enunciado exacto y cubre | 482 | TypeError: Cannot read properties of undefined (reading 'id') |
| p4-5a2-integrity.test.ts · C4-e: resolver con "Lo defino después" guarda regla deferred y no cubre | 526 | TypeError: Cannot read properties of undefined (reading 'id') |
| p4-5a2-integrity.test.ts · C4-f: propuesta_enunciado corta o genérica es rechazada con status error | 562 | AssertionError: expected 'blocked' to be 'error' // Object.is equality |
| p4-5a2-integrity.test.ts · C10-a: página app/login sin elementos interactivos genera advertencia extraccion_vacia y trabajo | 732 | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-5a2-integrity.test.ts · C10-b: página con al menos un elemento interactivo no genera advertencia extraccion_vacia | 754 | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-5a2-integrity.test.ts · C10-c: la advertencia extraccion_vacia es agnóstica de la aplicación | 770 | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-5a2-integrity.test.ts · C1-c: módulo con tilde preserva nombre en lifecycle, crea directorio y normaliza pending_questions con transliteración NFD | 837 | AssertionError: expected false to be true // Object.is equality |
| p4-5a2-integrity.test.ts · C2-seguimiento: selección de "Corregir" emite pregunta de seguimiento y no persiste regla espuria en rules.yaml | 877 | AssertionError: expected undefined to be defined |
| server.test.ts · debe descubrir modulos y responder en desarrollo para qap_plan y qap_test | 267 | AssertionError: expected true to be falsy |
| server.test.ts · el contexto de vista generado por qap_discover debe validar contra module-view.schema.json (Criterio 4) | 637 | AssertionError: expected true to be falsy |
| server.test.ts · qap_discover con contexto de vista inválido no debe escribir archivos y debe retornar error (Criterio 4) | 724 | AssertionError: expected 'blocked' to be 'error' // Object.is equality |
| server.test.ts · E0a: qap_discover valida contra module-view.schema.json en camino de fallo de Playwright | 784 | AssertionError: expected true to be falsy |
| server.test.ts · E0b: qap_discover valida contra module-view.schema.json en vista de autenticacion con session_saved true | 848 | AssertionError: expected true to be falsy |
| server.test.ts · E0c: qap_discover valida contra module-view.schema.json en vista con routes_found vacio | 912 | AssertionError: expected true to be falsy |
| server.test.ts · qap_discover: gating por fase y estado de modulo, actualizacion planned -> observed | 1261 | AssertionError: expected undefined to be 'ONBOARDING' // Object.is equality |
| server.test.ts · Criterio 7: Proyecto legacy sin campos de negocio valida contra el schema y qap_status responde con fase WORKING derivada | 1411 | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| server.test.ts · Criterio 8 (E2E): init -> status (entrevista) -> ingest -> context_set compuerta -> auto-SCOPING -> session_plan -> auto-WORKING -> discover | 1445 | AssertionError: expected undefined to be 'ONBOARDING' // Object.is equality |
| server.test.ts · qap_rules_set: actualiza reglas, transiciona observed -> interviewing, recalcula cobertura y actualiza guidance | 1604 | AssertionError: expected 'planned' to be 'observed' // Object.is equality |

Los cinco lifecycle continúan fallando en las mismas primeras fronteras: E0a recibe trabajo, E1 se detiene ante el bloqueo de entrevista legacy, E2 recibe falta de contexto, E3 intenta leer rules.yaml inexistente y criterio 9 recibe discover blocked. R4-R6 agrega una garantía canónica positiva; no convierte esas cinco pruebas en PASS ni demuestra sus verificaciones posteriores.
