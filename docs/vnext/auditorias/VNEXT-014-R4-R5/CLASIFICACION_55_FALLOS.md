# Clasificación de los 55 fallos MCP persistentes

Las primeras aserciones y resultados de cada caso se enumeran al final desde el JSON de Vitest de esta ejecución. Esta clasificación usa el código auditado f531e4e y el inventario histórico VNEXT-013 como referencia de identidad. Los contratos antiguos del inventario describían un cierre aún sin implementar. R4 ya añadió el servicio durable, por lo que esas notas históricas no representan por sí solas el contrato vigente.

La repetición de un fallo no demuestra que su garantía esté cubierta en otra suite. La clasificación distingue la causa que detuvo el test de sus comprobaciones posteriores. Una migración legítima conserva una garantía con evidencia equivalente en la frontera canónica. Reemplazar success por blocked en todo el test dejaría esa garantía sin comprobar.

## Contratos vigentes que explican las primeras causas

- D1. Discovery exige binding del host a IKnowledgeStore, aplicación y entorno coherentes, autorización de lectura y navegación exacta. Un servidor creado sin knowledgeBindings devuelve blocked/knowledge_unbound antes de consultar fase o navegar. Pasar targetPath autoriza la selección de una raíz, pero no crea el binding. Source en handlers/discovery.handler.ts.
- D2. Discovery usa fresh_anonymous_static. Rechaza profile, credentials, storageState, cookies, session o auth con authentication_not_supported y headed=true con headed_not_supported. El mock de PlaywrightAdapter.discover de un test antiguo no intercepta BlackBoxCrawler.
- D3. El discovery canónico no crea rules.yaml ni contexto de entrevista legacy y no avanza lifecycle a observed. Las observaciones se persisten y asocian a entidades canónicas y no se convierten en reglas confirmadas. La ausencia del archivo es consecuencia del contrato, no prueba de un error de escritura.
- I1. La ruta legacy de reglas exige contexto de vista preexistente y revisado. Si falta, devuelve legacy_interview_unavailable antes de validar categorías, texto o waivers. No se debe fabricar ese contexto para pasar la suite.
- I2. canonical_interview separa preguntas/propuestas de la decisión independiente del gateway del host. source=user, status=confirmed, user_text o from_option enviados por el agente no acreditan por sí solos autorización. La confirmación física y la autorización quedan correlacionadas en memoria persistida.
- C1. canonical_closure exige cobertura canónica y aprobación independiente o waiver sustantivo aprobado. Para un módulo vinculado, la llamada legacy sin canonical_closure se rechaza. El recibo, la proyección lifecycle y el cierre de sesión dependen de la autorización durable. Los flags accept_gaps/user_confirmed del protocolo antiguo no sustituyen ese asiento.
- P1. qap_plan y qap_test están conectados al planificador y al runner real. La expectativa en_desarrollo del test antiguo perdió vigencia. El test falla antes de llegar a esas aserciones.
- G1. El orden actual de Discovery evalúa autoridad y configuración antes de la fase. Un rechazo knowledge_unbound no lleva por obligación los antiguos campos razon, fase, view o siguiente_accion. La ausencia de esos campos en un fixture sin binding no demuestra un fallo de las compuertas de fase o autenticación.

Una sonda MCP adicional sobre raíz autorizada reprodujo init → context_set → session_plan → WORKING. Discovery devolvió knowledge_unbound, status devolvió trabajo, rules_set y module_close devolvieron legacy_interview_unavailable y lifecycle conservó auth:planned, sin rules.yaml. La variante headed devolvió headed_not_supported. La primera preparación de la sonda omitió priority en el plan y fue rechazada. Se conservó ese intento y se corrigió exclusivamente la preparación externa antes de tomar estas mediciones.

## Clasificación y orden de corrección por suite

| Suite y fallos | Primera barrera observada | Contrato original protegido | Diferencia vigente | Trabajo requerido y dependencia | Prioridad |
| --- | --- | --- | --- | --- | --- |
| lifecycle-v3-e2e, 5 | Guidance trabajo, rechazo de entrevista, ENOENT o discover blocked | Recorrido lifecycle, entrevista consistente, invalidez de cobertura, aprobación, reporte y nueva sesión | D1/D3/I1/I2/C1 | Adaptar integración física canónica de punta a punta y migrar cada invariante. Corregir producción solo donde ese recorrido autorizado revele una violación. Depende de binding, observaciones, entrevista/gateway, cobertura y cierre | P0 |
| p3-verification, 5 | siguiente_accion ausente, rules.yaml inexistente o guidance trabajo | Discovery útil, idempotencia, conservación de reglas confirmadas, errores honestos y reanudación | D1/D3/I1 | Migrar persistencia e idempotencia a observaciones/relaciones SQLite. Separar el error real de crawler del fixture sin binding. Integrar status con entrevista canónica para la reanudación | P1, después de P0 |
| p4-2-pregunta-contract, 2 | Helper lanza al recibir knowledge_unbound | Toda pregunta emitida tiene estructura válida, opciones y registro coherentes | D1/G1; discovery ya no promete una pregunta de entrevista legacy | Adaptar fixtures a host/store/crawler autorizados. Validar Pregunta en onboarding/entrevista/decisión y validar por separado el payload de adquisición. Un bloqueo esperado no puede reemplazar la cadena E2E | P1 |
| p4-4-auth-lifecycle, 7 | razon ausente o status blocked; profile es rechazado antes de navegar | Autenticación real, expiración, privacidad, detección de barreras y cero escrituras indebidas | D1/D2/D3 | Migrar aserciones de rechazo a la frontera anónima y conservar los positivos de sesión en la capa Auth/runner que los soporta. La adquisición autenticada canónica requiere decisión de alcance e integración de producción antes de certificar ese positivo | P1, alcance explícito |
| p4-5a-integrity, 10 | legacy_interview_unavailable o discovery sin binding | Autoría, sustantividad, categoría, cobertura, waivers y honestidad de bloqueos | I1/I2/C1/D1 | Adaptar la cadena de entrevista al gateway y a requisitos canónicos. Probar por separado los límites de texto y las reglas de negocio conservadas. accept_gaps no puede omitir la aprobación durable. Requiere la integración P0 | P1 |
| p4-5a2-integrity, 16 | Descubrimiento bloqueado, borrador no creado, pregunta ausente | Clasificación de página, borradores y revisión, categoría ligada a pregunta, exclusión de valores sensibles, nombres y persistencia | D1/D2/D3/I1/I2 | Separar adquisición de entrevista y mantener la correlación de pregunta/propuesta/decisión. Migrar los positivos de UI/SPA solo tras definir capacidad soportada. Mantener nombres/IDs y rechazo de correcciones falsas con pruebas físicas | P1 |
| server, 10 | isError=true, blocked/error, fase ausente o lifecycle planned | Esquemas, no escrituras ante invalidez, fase, legacy, ejecución real y cierre | D1/D2/D3/P1/G1 | Dividir smoke del dispatcher, adquisición, compatibilidad legacy y recorrido canónico. Retirar únicamente expectativas en_desarrollo sustituyéndolas por pruebas reales de plan/ejecución. Preservar validación y aislamiento | P0 para integración, P1 para migración |

No se acreditó mediante estos fixtures una nueva vulneración productiva de autorización. La falta de un recorrido positivo canónico equivalente continúa siendo una deuda de integración y certificación. Los rechazos seguros observados tampoco acreditan que se hayan satisfecho las garantías de negocio que quedaron sin ejecutar.

## Los cinco fallos lifecycle, paso por paso

### E0a — Reanudar la entrevista desde status

Primera aserción en línea 140. Se esperaba siguiente_accion.tipo=entrevista_vista y se recibió trabajo. advanceToWorking prepara el plan, pero Discovery opera sin knowledgeBindings y bloquea. No aparece contexto de vista, no hay hipótesis legacy y el módulo permanece planned. La llamada posterior rules_set no se alcanza en esta ejecución. El test pretendía que status y rules_set formularan la misma pregunta sin mezclar módulos/vistas. Requiere fixture SQLite con asociación real y canonical_interview, propuesta y decisión del gateway independientes. Conservar identidad de módulo, pregunta pendiente y continuidad de status. La integración de guidance canónico necesita validación propia. P0.

### E1 — Nueva evidencia invalida cobertura y respeta waivers

Primera aserción en línea 252. El primer rechazo sí tiene isError=true, pero su texto corresponde a legacy_interview_unavailable y no a la prohibición de renunciar a proposito. Se detiene antes del límite de 15 caracteres, de consolidar, de redescubrir y de verificar history. El test preparó un camino de discovery que no crea contexto legacy. En el contrato canónico, nueva evidencia no acredita automáticamente requisitos ni mueve lifecycle. Deben conservarse por separado la prohibición de renunciar a categorías que no admitan waiver, la longitud mínima, la revisión independiente y la invalidez de una evaluación cuando cambien sus revisiones. No reemplazar esta garantía por “redescubrir no cambia nada”. Ejecutar incorporación real de una observación/requisito nuevo y verificar qué evaluación queda invalidada, cómo se reabre y qué queda en historial. Dependencia de entrevista, cobertura/revisiones y proyección lifecycle. P0.

### E2 — Cierre de módulo, autorización y siguiente módulo

Primera aserción en línea 339. El cierre sin consolidar devuelve una razón de falta de contexto, en lugar de mencionar consolidated. Las comprobaciones previas de módulo desconocido y de confirmación no detuvieron el test. Todo lo posterior, incluidos cierre positivo, segundo cierre terminal, waiver corto y selección del siguiente módulo, queda sin acreditar. Migrar a evaluate/close/waive canónicos con binding, cobertura real, gateway y almacenamiento físico. Conservar cierre bloqueado sin autoridad, motivo válido y avance al siguiente módulo. El reintento autorizado canónico puede ser idempotente, por lo que su contrato debe probar ausencia de duplicados y de nueva aprobación, en vez de exigir siempre blocked/terminal. Depende de C1 y de evidencia de cobertura real para closed. P0.

### E3 — Sesión, reporte y replanificación

Primera excepción en línea 407 al abrir .qa/modules/auth/rules.yaml. El bloqueo inicial de cierre por módulos pendientes pasó, pero discover no generó ese archivo. Nunca se ejecutan aquí el cierre positivo, el contenido del reporte, la restricción WRAP_UP ni WRAP_UP → SCOPING → WORKING. Adaptar el escenario con dos módulos vinculados, uno closed por cobertura auténtica y otro waived por decisión aprobada. Mantener archivo de reporte real, brechas y motivo exacto, ausencia de afirmaciones de cobertura inventadas, bloqueo de actividad en WRAP_UP y conservación de módulos/historial al replanificar. El positivo de waivers múltiples R4-R5 no certifica esta combinación closed/waived ni la replanificación. P0.

### Criterio 9 — Cadena completa

Primera aserción en línea 537. Discovery devuelve blocked frente al success esperado. Init, contexto y plan alcanzaron WORKING y pasaron validación de schema. No se ejecutan los pasos de entrevista, cobertura completa, close A, waive B, reporte y nueva sesión. Requiere composición de producción sobre contratos canónicos, con adquisición física autorizada y confirmaciones independientes dentro del fixture. Migrar las representaciones YAML a los stores correspondientes preservando todas las invariantes de E0a/E1/E2/E3. La cobertura no se certifica copiando observaciones a requisitos confirmados. P0.

## Secuencia propuesta para resolver deuda

1. Construir el recorrido físico de lifecycle con fixture de host completo. Asegurar respuestas de setup antes de probar la siguiente frontera y conservar gates de fase/autoridad.
2. Validar preguntas, propuestas y confirmación independiente en SQLite. Conectar status con esa entrevista y demostrar continuidad.
3. Obtener closed mediante cobertura real y autorización, mantener waiver, recibos e idempotencia. Completar E2/E3 con múltiples módulos y replanificación.
4. Reubicar contratos de auth/SPA y esquemas legacy en capacidades explícitamente soportadas. Completar migración de suites conservando privacidad, no escrituras indebidas, revisión humana y aislamiento.
5. Reejecutar por identidad la matriz completa y resolver lint. Ningún paso autoriza debilitar expectativas o declarar VNEXT-014 terminada por tener un inventario clasificado.

## Primera aserción de cada caso en esta ejecución

Cada fila conserva el primer error del caso. Las respuestas completas no siempre se imprimen en Vitest. Las razones knowledge_unbound/legacy_interview_unavailable se corroboraron con la sonda y el orden de guards del código. Los valores específicos del error siguiente son observaciones del runner, sin inferir qué habrían hecho las aserciones posteriores.

| Suite y caso | Primera línea / aserción o excepción | Respuesta o valor observado por Vitest |
| --- | --- | --- |
| lifecycle-v3-e2e.test.ts · E0a: qap_status en WORKING para módulo con cobertura incompleta devuelve module, view y preguntas no vacías idénticas a qap_rules_set | 140 · expect(statusObs.parsed.siguiente_accion.tipo).toBe('entrevista_vista'); | AssertionError: expected 'trabajo' to be 'entrevista_vista' // Object.is equality |
| lifecycle-v3-e2e.test.ts · E1: regresión consolidated -> interviewing tras re-discover y política de waivers | 252 · expect(resPropWaiver.text).toContain("La categoría 'proposito' no se puede renunciar"); | AssertionError: expected '{\n  "status": "blocked",\n  "code": …' to contain 'La categoría \'proposito\' no se pued…' |
| lifecycle-v3-e2e.test.ts · E2: qap_module_close validaciones, compuertas y transiciones | 339 · expect(rNotConsolidated.parsed.razon).toContain('consolidated'); | AssertionError: expected 'Falta el contexto de vista requerido …' to contain 'consolidated' |
| lifecycle-v3-e2e.test.ts · E3: canExitWorking, qap_session_close, reporte de brechas y nueva sesión desde WRAP_UP | 407 · const doc = YAML.parse(readFileSync(join(tempDir, '.qa', 'modules', 'auth', 'rules.yaml'), 'utf-8')); | Error: ENOENT: no such file or directory, open '<FIXTURE>/.qa/modules\auth\rules.yaml' |
| lifecycle-v3-e2e.test.ts · Criterio 9: E2E completo: init -> onboarding -> scoping -> working -> discover A -> rules_set parcial -> status (reanuda) -> rules_set completa -> module_close A -> discover B -> module_close waive B -> session_close -> status WRAP_UP -> session_plan nueva sesión | 537 · expect(r4.parsed.status).toBe('success'); | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p3-verification.test.ts · T6: qap_discover éxito: no contiene "Descubrir otro módulo", "pregunta_doc" ni "opciones_doc"; siguiente_accion tipo entrevista_vista (<= 5 preguntas) con tool qap_rules_set, categorias_aplicables y rutas_detectadas_fuera_del_plan | 330 · expect(parsed.siguiente_accion.tipo).toBe('entrevista_vista'); | TypeError: Cannot read properties of undefined (reading 'tipo') |
| p3-verification.test.ts · T7: rules.yaml tras discover: reglas inferred/dom con ids deterministas; re-discover idempotente (sin duplicados, reglas confirmadas intactas) | 351 · expect(existsSync(rulesPath)).toBe(true); | AssertionError: expected false to be true // Object.is equality |
| p3-verification.test.ts · T9: Fallo de Playwright: no inserta reglas; siguiente_accion tipo decision | 434 · expect(parsed.siguiente_accion.tipo).toBe('decision'); | TypeError: Cannot read properties of undefined (reading 'tipo') |
| p3-verification.test.ts · T14: qap_status WORKING: (a) observed con hipótesis reanuda entrevista; (b) interviewing incompleto reanuda; (c) planned elige high > medium > low luego orden; (d) todos completos tipo decision | 633 · expect(statusA.parsed.siguiente_accion.tipo).toBe('entrevista_vista'); | AssertionError: expected 'trabajo' to be 'entrevista_vista' // Object.is equality |
| p3-verification.test.ts · T15: E2E: flujo de P2 hasta WORKING -> discover A -> rules_set parcial -> status (reanuda A) -> rules_set completa cobertura -> status (propone B) -> discover B; ninguna respuesta del flujo contiene texto del bucle | 755 · expect(r6.parsed.siguiente_accion.tipo).toBe('entrevista_vista'); | AssertionError: expected 'trabajo' to be 'entrevista_vista' // Object.is equality |
| p4-2-pregunta-contract.test.ts · Criterio 4.4: Ninguna respuesta con siguiente_accion trae preguntas como cadenas ni pregunta aplanada | 95 · throw new Error(`Tool ${name} failed: ${res.content?.[0]?.text}`); | isError=true, status=blocked, code=knowledge_unbound, persistence=not_attempted |
| p4-2-pregunta-contract.test.ts · Criterio 6: E2E Completo donde TODA siguiente_accion de tipo entrevista, entrevista_vista o decision trae Pregunta válida | 95 · throw new Error(`Tool ${name} failed: ${res.content?.[0]?.text}`); | isError=true, status=blocked, code=knowledge_unbound, persistence=not_attempted |
| p4-4-auth-lifecycle.test.ts · 1. qap_discover protegido sin perfil: blocked auth_required y cero escrituras en disco | 175 · expect(parsed.razon).toBe('auth_required'); | AssertionError: expected undefined to be 'auth_required' // Object.is equality |
| p4-4-auth-lifecycle.test.ts · 2. qap_discover con redirección HTTP 302 a login: detecta auth_wall determinista y bloquea sin escribir | 206 · expect(parsed.razon).toBe('auth_required'); | AssertionError: expected undefined to be 'auth_required' // Object.is equality |
| p4-4-auth-lifecycle.test.ts · 3. qap_discover con login embebido en ruta no-acceso: bloquea como auth_required sin persistir | 228 · expect(parsed.razon).toBe('auth_required'); | AssertionError: expected undefined to be 'auth_required' // Object.is equality |
| p4-4-auth-lifecycle.test.ts · 4. qap_discover con sesión expirada: blocked session_invalid y desverifica el perfil | 294 · expect(parsed.razon).toBe('session_invalid'); | AssertionError: expected undefined to be 'session_invalid' // Object.is equality |
| p4-4-auth-lifecycle.test.ts · 5. qap_discover con perfil verificado y storageState válido: devuelve app y transiciona a observed | 366 · expect(parsed.status).toBe('success'); | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-4-auth-lifecycle.test.ts · 6. qap_discover en módulo de acceso: selectors.json incluye auth_selectors y omite valores y atributos sensibles de password | 392 · expect(parsed.status).toBe('success'); | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-4-auth-lifecycle.test.ts · 15. Guard de cliente asíncrono lento (~1200ms) en qap_discover: responde blocked auth_required y cero escrituras en .qa/modules (C3c) | 854 · expect(parsed.razon).toBe('auth_required'); | AssertionError: expected undefined to be 'auth_required' // Object.is equality |
| p4-5a-integrity.test.ts · Criterio 2: regla redactada por agente sin user_text ni from_option se guarda como inferred/agent y no cuenta en cobertura | 175 · expect(res.parsed.status).toBe('success'); | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-5a-integrity.test.ts · Criterio 3: una etiqueta de opción predefinida del motor NO cubre una categoría | 210 · expect(res.parsed.status).toBe('success'); | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-5a-integrity.test.ts · Criterio 4: un módulo con 2 reglas de 7 categorías no cierra sin accept_gaps, y cierra con él dejando registro | 245 · expect(rBlocked.parsed.razon).toBe('cobertura_insuficiente'); | AssertionError: expected 'Falta el contexto de vista requerido …' to be 'cobertura_insuficiente' // Object.is equality |
| p4-5a-integrity.test.ts · C9a: blocked de qap_discover con auth_required incluye razon auth_required y directorio_objetivo, con claves alineadas a session_invalid | 295 · expect(resAuthReq.parsed.razon).toBe('auth_required'); | AssertionError: expected undefined to be 'auth_required' // Object.is equality |
| p4-5a-integrity.test.ts · C4-a: from_option con pregunta_id inexistente, opcion_id inexistente o sin texto sustantivo (rechazo o degradación a agent/inferred) | 451 · expect(rInexistenteQ.parsed.status).toBe('error'); | AssertionError: expected 'blocked' to be 'error' // Object.is equality |
| p4-5a-integrity.test.ts · C4-b: límites de sustantividad (2 palabras o 19 caracteres no cubren; 3 palabras y 20 caracteres sí) | 535 · const rf1 = YAML.parse(readFileSync(join(tempDir, '.qa', 'modules', 'catalogo', 'rules.yaml'), 'utf-8')); | Error: ENOENT: no such file or directory, open '<FIXTURE>/.qa/modules\catalogo\rules.yaml' |
| p4-5a-integrity.test.ts · C4-c: accept_gaps con razón de 14 caracteres bloquea y con 15 cierra y deja el registro | 597 · expect(r14.parsed.razon).toBe('cobertura_insuficiente'); | AssertionError: expected 'Falta el contexto de vista requerido …' to be 'cobertura_insuficiente' // Object.is equality |
| p4-5a-integrity.test.ts · C4-d: plan con auth.required true sin roles queda bloqueado con pregunta de roles y bloquea discover (V4) | 640 · expect(rDiscoverBlocked.parsed.razon).toMatch(/No se puede ejecutar qap_discover en la fase SCOPING/); | TypeError: .toMatch() expects to receive a string, but got undefined |
| p4-5a-integrity.test.ts · C1: campos honestos en bloqueos previos a navegar y navegación real | 670 · expect(p1.razon).toBe('auth_required'); | AssertionError: expected undefined to be 'auth_required' // Object.is equality |
| p4-5a-integrity.test.ts · C3: flujo real de preguntas de categoría, formato una_opcion, persistencia y respuestas user_text y deferred | 716 · expect(rDisc.parsed.status).toBe('success'); | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-5a2-integrity.test.ts · C1-a: módulo de acceso pedido en login sin redirección NO se bloquea (page_kind login, success) | 127 · expect(r.parsed.status).toBe('success'); | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-5a2-integrity.test.ts · C1-b: ruta protegida con redirección HTTP 302 a /login detecta auth_wall determinista y bloquea | 144 · expect(r.parsed.razon).toBe('auth_required'); | AssertionError: expected undefined to be 'auth_required' // Object.is equality |
| p4-5a2-integrity.test.ts · C1-c: ruta protegida con guard del lado del cliente detecta auth_wall con redirección al login | 161 · expect(r.parsed.razon).toBe('auth_required'); | AssertionError: expected undefined to be 'auth_required' // Object.is equality |
| p4-5a2-integrity.test.ts · C3-a: la categoría de from_option se toma siempre de la pregunta pendiente persistida | 289 · expect(r.parsed.status).toBe('success'); | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-5a2-integrity.test.ts · C3-b: si la petición declara una categoría distinta a la de la pregunta pendiente se rechaza con blocked | 334 · expect(r.parsed.error).toContain("Categoría discordante al resolver from_option: la pregunta pendiente pertenece a la categoría 'actor', pero la petición indicó 'proposito'"); | AssertionError: the given combination of arguments (undefined and string) is invalid for this assertion. You can use an array, a map, an object, a set, a string, or a weakset instead of a string |
| p4-5a2-integrity.test.ts · C4-a: respuesta corta se guarda como borrador (status inferred, source user_text, borrador true) y no cubre | 385 · expect(r.parsed.status).toBe('success'); | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-5a2-integrity.test.ts · C4-b: derivación determinista en categoría actor que nombra roles emite Pregunta una_opcion directamente | 416 · expect(r.parsed.status).toBe('success'); | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-5a2-integrity.test.ts · C4-c: envío de propuesta_enunciado válida para un borrador emite Pregunta una_opcion con las 3 opciones | 450 · expect(rPropuesta.parsed.status).toBe('success'); | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-5a2-integrity.test.ts · C4-d: resolver con "Es correcto" guarda regla confirmed user_confirmed con enunciado exacto y cubre | 482 · const qId = rProp.parsed.siguiente_accion.pregunta.id; | TypeError: Cannot read properties of undefined (reading 'id') |
| p4-5a2-integrity.test.ts · C4-e: resolver con "Lo defino después" guarda regla deferred y no cubre | 526 · const qId = rProp.parsed.siguiente_accion.pregunta.id; | TypeError: Cannot read properties of undefined (reading 'id') |
| p4-5a2-integrity.test.ts · C4-f: propuesta_enunciado corta o genérica es rechazada con status error | 562 · expect(rShort.parsed.status).toBe('error'); | AssertionError: expected 'blocked' to be 'error' // Object.is equality |
| p4-5a2-integrity.test.ts · C10-a: página app/login sin elementos interactivos genera advertencia extraccion_vacia y trabajo | 732 · expect(r.parsed.status).toBe('success'); | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-5a2-integrity.test.ts · C10-b: página con al menos un elemento interactivo no genera advertencia extraccion_vacia | 754 · expect(r.parsed.status).toBe('success'); | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-5a2-integrity.test.ts · C10-c: la advertencia extraccion_vacia es agnóstica de la aplicación | 770 · expect(r.parsed.status).toBe('success'); | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| p4-5a2-integrity.test.ts · C1-c: módulo con tilde preserva nombre en lifecycle, crea directorio y normaliza pending_questions con transliteración NFD | 837 · expect(existsSync(modDir)).toBe(true); | AssertionError: expected false to be true // Object.is equality |
| p4-5a2-integrity.test.ts · C2-seguimiento: selección de "Corregir" emite pregunta de seguimiento y no persiste regla espuria en rules.yaml | 877 · expect(q).toBeDefined(); | AssertionError: expected undefined to be defined |
| server.test.ts · debe descubrir modulos y responder en desarrollo para qap_plan y qap_test | 267 · expect(discoverResult.isError).toBeFalsy(); | AssertionError: expected true to be falsy |
| server.test.ts · el contexto de vista generado por qap_discover debe validar contra module-view.schema.json (Criterio 4) | 637 · expect(discoverResult.isError).toBeFalsy(); | AssertionError: expected true to be falsy |
| server.test.ts · qap_discover con contexto de vista inválido no debe escribir archivos y debe retornar error (Criterio 4) | 724 · expect(parsed.status).toBe('error'); | AssertionError: expected 'blocked' to be 'error' // Object.is equality |
| server.test.ts · E0a: qap_discover valida contra module-view.schema.json en camino de fallo de Playwright | 784 · expect(res.isError).toBeFalsy(); | AssertionError: expected true to be falsy |
| server.test.ts · E0b: qap_discover valida contra module-view.schema.json en vista de autenticacion con session_saved true | 848 · expect(res.isError).toBeFalsy(); | AssertionError: expected true to be falsy |
| server.test.ts · E0c: qap_discover valida contra module-view.schema.json en vista con routes_found vacio | 912 · expect(res.isError).toBeFalsy(); | AssertionError: expected true to be falsy |
| server.test.ts · qap_discover: gating por fase y estado de modulo, actualizacion planned -> observed | 1261 · expect(JSON.parse(bOnboarding.content[0].text).fase).toBe('ONBOARDING'); | AssertionError: expected undefined to be 'ONBOARDING' // Object.is equality |
| server.test.ts · Criterio 7: Proyecto legacy sin campos de negocio valida contra el schema y qap_status responde con fase WORKING derivada | 1411 · expect(JSON.parse(discRes.content[0].text).status).toBe('success'); | AssertionError: expected 'blocked' to be 'success' // Object.is equality |
| server.test.ts · Criterio 8 (E2E): init -> status (entrevista) -> ingest -> context_set compuerta -> auto-SCOPING -> session_plan -> auto-WORKING -> discover | 1445 · expect(pDiscPremature.fase).toBe('ONBOARDING'); | AssertionError: expected undefined to be 'ONBOARDING' // Object.is equality |
| server.test.ts · qap_rules_set: actualiza reglas, transiciona observed -> interviewing, recalcula cobertura y actualiza guidance | 1604 · expect(statePostDisc.modules.auth.state).toBe('observed'); | AssertionError: expected 'planned' to be 'observed' // Object.is equality |

## Sonda de primeras causas

Guardar como debt-probe.mjs fuera del repositorio. Ejecutar node <ARTEFACTOS>/debt-probe.mjs <WORKTREE> <ARTEFACTOS> tras compilar. Es un fixture sintético de raíz autorizada, sin aprobaciones ni reglas fabricadas.

~~~js
import { mkdtempSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const [repo,out]=process.argv.slice(2);
const root=mkdtempSync(join(out,'debt-fixture-'));
const req=createRequire(join(repo,'packages/mcp/package.json'));
const load=async id=>import(pathToFileURL(req.resolve(id)));
const {createMcpServer}=await load(join(repo,'packages/mcp/dist/index.js'));
const {Client}=await load('@modelcontextprotocol/sdk/client/index.js');
const {InMemoryTransport}=await load('@modelcontextprotocol/sdk/inMemory.js');
const server=createMcpServer({projectRoots:[root]});
const client=new Client({name:'historical-debt-audit',version:'1'});
const [ct,st]=InMemoryTransport.createLinkedPair();
try{
 await server.connect(st);await client.connect(ct);
 const call=async (name,args={})=>{
  const r=await client.callTool({name,arguments:{targetPath:root,...args}});
  const p=JSON.parse(r.content[0].text);
  console.log(JSON.stringify({name,isError:r.isError,...p}));
  return p;
 };
 await call('qap_init',{baseUrl:'http://localhost:3000'});
 await call('qap_context_set',{objective:'Validar flujo de compras y autenticación',
  roles:[{name:'admin',description:'Administrador'}],
  critical_flows:[{name:'login',description:'Flujo de login'}],
  source_of_truth:{type:'prd',declared:true,ref:'prd-inline'}});
 await call('qap_session_plan',{plan:[{module:'auth',path:'/login',priority:'high'}],auth:{required:false}});
 await call('qap_discover',{name:'auth',path:'/login'});
 const status=await call('qap_status');
 await call('qap_rules_set',{module:'auth',category_waivers:[{category:'proposito',reason:'Razón suficientemente larga de waiver'}]});
 await call('qap_module_close',{module:'auth',action:'close',user_confirmed:true});
 await call('qap_discover',{name:'auth',path:'/login',headed:true});
 console.log(JSON.stringify({lifecycle:JSON.parse(readFileSync(join(root,'.qa/project/lifecycle.json'),'utf8')).modules,
 rulesExists:existsSync(join(root,'.qa/modules/auth/rules.yaml'))}));
}finally{await client.close();await server.close();}
~~~
