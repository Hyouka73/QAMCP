# Siguiente bloque P0: composición del recorrido canónico

Análisis del código `fbc089c02b71828994a62af1a9eb6d28e33cb4bb`, contrastado con [la clasificación R4-R5](../VNEXT-014-R4-R5/CLASIFICACION_55_FALLOS.md). Es una propuesta de implementación para ChatGPT, no una implementación ni una certificación del recorrido pendiente.

## Decisión principal

El siguiente bloque debe componer **propuesta/corrección → revisión independiente → requisito confirmado → evaluación de cobertura** sobre la adquisición y la continuidad ya existentes. No hace falta crear otro motor de entrevista, un segundo esquema de requisitos o un aprobador en los argumentos MCP. La suite `canonical-interview` ya prueba propuesta, negativa sin decisión, confirmación autorizada, corrección, CAS, recibo e idempotencia por separado. La deuda P0 es conectar esas garantías en un recorrido físico completo y ofrecer orientación que permita continuarlo hasta la siguiente frontera.

R4-R6 acredita que status permite recuperar una pregunta iniciada. No inicia automáticamente entrevistas ni acredita que todos los requisitos del negocio estén completos. El recorrido Discovery → pregunta requiere una llamada explícita `canonical_interview.action=next`; la ausencia de preguntas previas no debe convertirse en una pregunta inventada por status.

## Interfaces y servicios que deben reutilizarse

Las ubicaciones siguientes corresponden al SHA auditado; las líneas son puntos de entrada.

| Frontera | Implementación existente | Obligación de la composición |
| --- | --- | --- |
| Host/proyecto | `handlers/state-services.ts:21`, `ProjectKnowledgeBinding`; `server.ts:227`, `createMcpServer` | Proveer explícitamente raíz, store, aplicación, entorno, `moduleBindings`, gateways y stores privilegiados. `targetPath` no provisiona un binding. |
| Discovery | `handlers/discovery.handler.ts:59`, `DiscoveryHandler.execute` | Usar autorización exacta de navegación y HTTP/Chromium reales sobre fixture local. Preservar modo anónimo, límites, cancelación y ausencia de requisitos inferidos como confirmados. |
| Asociación | `handlers/module-observation-bridge.ts:55/83/130/179`, `resolve/receipt/associate/project` | Conservar identidad, revisiones, evidencia, recibo y relaciones idempotentes. No usar `rules.yaml` como puente. |
| Entrevista/propuesta | `handlers/canonical-interview-service.ts:66/159/213`, `InterviewCommand` y `execute` | Reutilizar `next/propose/correct/review/defer/resume`. Correlacionar `question_id`, versión, revisión esperada y categoría formal elegida explícitamente. |
| Revisión de requisito | `IHumanReviewGateway`, `HumanReviewRequest`, `HumanReviewDecision`, mismo archivo:36–54 y rama review:287 | El host presenta el texto exacto y obtiene decisión independiente. Digest, contexto, caducidad y aprobación de un solo uso deben coincidir. Ni `source=user` ni `user_confirmed` sustituyen esa decisión. |
| Persistencia | `IKnowledgeStore`/`SqliteKnowledgeAdapter`; entrevista:338–365 | El servicio existente hace commit atómico de `ExpectedRequirement` y relación `human_review_authorization_v1`, con CAS y readback. Reutilizarlo en vez de sembrar requisitos confirmados en el escenario positivo. |
| Borradores durables | `handlers/interview-draft-store.ts:26/46`, `IInterviewDraftStore`/`SqliteInterviewDraftStore` | Host provisiona almacenamiento separado y clave protegida. No descubrir bases automáticamente ni alterar SQLite v2. Un borrador recuperado no es aprobación. |
| Continuidad | `handlers/status.handler.ts:23–110`; `guidance.ts`, `SiguienteAccion` | Recuperar preguntas existentes y luego orientar hacia propuesta/revisión/evaluación de manera fiel al estado. Status no solicita revisión ni confirma. |
| Cobertura | `handlers/canonical-coverage-service.ts:69`, `CanonicalCoverageService.evaluate` | Evaluar requisitos activos confirmados, categorías, criterios de aceptación, aplicabilidad y brechas. Reutilizar el digest y los bloqueadores existentes. |
| Cierre/aplicabilidad | `handlers/canonical-closure-service.ts:310` y `handlers/module-closure-gateway.ts`, `IModuleClosureReviewGateway` | Usar `evaluate/declare_non_applicable/accept_gaps/close/waive`, con aprobación de cierre independiente de la aprobación de requisitos. No sustituir un positivo `closed` por un waiver. |
| Durabilidad/lifecycle | `handlers/module-closure-store.ts`, `IModuleClosureStore`/`SqliteModuleClosureStore`; `CanonicalClosureService.reconcile` | Conservar aprobación correlacionada, recibos, motivo exacto, proyección idempotente y recuperación sin duplicaciones. |
| Sesión/reporte | `server.ts:3323`, `qap_session_close` | Usar todos los cierres canónicos, snapshot reconciliado y reporte físico antes de WRAP_UP. No limitar validación a los 16 módulos visibles. |
| Replanificación | `server.ts:1349/1579/1637`, `qap_session_plan` | Preservar módulos e historial y aplicar WRAP_UP → SCOPING → WORKING con sus compuertas. El código rechaza reabrir un módulo `closed` desde WRAP_UP: planificar un módulo nuevo para el positivo, y comprobar por separado ese rechazo. |

Todas las rutas de la tabla son relativas a `packages/mcp/src/`, salvo los puertos de Engine y Knowledge. `createMcpServer` ya acepta la composición de host. La entrada Stdio por defecto llama a `createMcpServer()` sin bindings; el smoke de 18 herramientas/init no certifica un host productivo configurado para este recorrido. Si se necesita esa experiencia en CLI/Stdio, el provisionamiento explícito y la interfaz humana del host constituyen trabajo adicional, sin aprobador automático ni claves en MCP.

## Entrega inmediata propuesta y criterios de aceptación

1. Componer un fixture autorizado con HTTP local real, Chromium, SQLite y ambos gateways independientes. Verificar el resultado de cada preparación antes de avanzar. Iniciar la entrevista explícitamente tras asociar observaciones y recuperar la misma pregunta mediante status/next.
2. Enviar texto sustantivo con categoría formal y criterios de aceptación verificables. Acreditar propuesta sin requisito confirmado. `review` sin decisión debe bloquear y no escribir; emitir la decisión únicamente desde el inbox externo del fixture y repetir review. Reabrir SQLite y comprobar texto exacto, categoría, revisión, evidencia de verificación y recibo correlacionado.
3. Corregir el texto y exigir versión/revisión nuevas; la aprobación antigua no debe autorizar la corrección. Probar rechazo, aplazamiento, reanudación y contexto obsoleto sin pérdida de la última revisión confirmada ni aprobación implícita. Conservar CAS entre conexiones y recuperación durable existentes.
4. Consultar cobertura mediante `qap_module_close.canonical_closure.action=evaluate`. Un requisito confirmado sin criterios de aceptación sigue dejando una brecha; una categoría sin decisión ni requisito sigue con aplicabilidad desconocida. No resolverlo con `coverage=complete` supuesto, un segundo evaluador o copiar observaciones DOM a requisitos.
5. Integrar la orientación posterior a la revisión para distinguir pregunta pendiente, revisión pendiente y evaluación/cierre. Añadirla en las fronteras existentes si el recorrido real demuestra que falta; status debe seguir siendo consulta. Asegurar que el cierre inválido conserva sus bloqueadores y que un módulo ya terminal no se reabre mediante una pregunta.

La aceptación de este bloque es la cadena real hasta evaluación y su evidencia persistida. No equivale todavía a certificar toda la sesión multi-módulo.

## Continuación obligatoria antes de declarar GO

- Obtener `closed` por requisitos aprobados con criterios de aceptación y categorías aplicables satisfechas. Las exclusiones necesarias requieren `declare_non_applicable` aprobado por el host con motivo; no convertir siete categorías de entrevista en siete categorías formales por correspondencia automática. La tabla `INTERVIEW_CATEGORY_MAPPING` solo ofrece sugerencias.
- Conectar un segundo módulo con waiver legítimo, negativo sin decisión, aprobación independiente y motivo exacto. Completar el cierre de sesión en la primera llamada, reporte físico honesto, WRAP_UP, bloqueos de actividad y nueva sesión con un módulo nuevo. Verificar que no se duplican aprobaciones, requisitos, recibos o historia.
- Incorporar nueva evidencia y una revisión nueva de requisito para verificar invalidez de la evaluación/digest anterior y la revisión apropiada. No prometer reapertura automática de un módulo `closed`: el contrato actual la restringe; resolver explícitamente ese contrato antes de implementar el equivalente de E1.
- La evaluación actual publica `execution_coverage.status=not_executed`. Ni `closed` ni el reporte deben presentarse como pruebas de ejecución funcional aprobadas. Una futura conexión de resultados reales debe reutilizar PlanHandler/TestHandler/runner y su evidencia, con alcance explícito; no agregar un booleano de éxito.

## Dependencias y deuda histórica preservada

| Garantía histórica | Avance acreditado o pendiente | Orden |
| --- | --- | --- |
| E0a: misma pregunta entre status y reglas | R4-R6 acredita la continuación canónica de pregunta real. El test legacy sigue fallando; su garantía completa incluye interacción posterior y aislamiento. | P0 inmediato: componer propuesta/revisión |
| E1: revisión/invalidez y waivers | Versiones, CAS y mínimos tienen pruebas separadas. Pendiente la composición de nueva observación/requisito, digest, decisiones y política explícita de reapertura. | P0 después de confirmación/cobertura |
| E2: cierre, autoridad y siguiente módulo | Cierre durable probado por separado; falta `closed` cuyos requisitos nazcan de entrevista real en el mismo recorrido. Reintentos deben ser idempotentes, no forzarse a error terminal. | P0 después de evaluación |
| E3: reporte y nueva sesión | Waivers y reporte positivos ya existen. Falta composición `closed` + `waived` y replanificación con preservación de estado. | P0 después de E2 |
| Criterio 9: cadena completa | Componer todas las fronteras con setup comprobado; el primer bloqueo histórico ocurre antes de la entrevista. | P0 final de integración |
| Otros 50 casos | Mantener la clasificación R4-R5 para adquisición anónima, auth, esquemas, estructura de preguntas y autoría. | P1 y decisiones explícitas de alcance |

No debilitar aserciones para convertir bloqueos de preparación en PASS. Migrar un test requiere conservar su garantía con evidencia positiva y negativa equivalente en la frontera canónica. Este análisis no autoriza cambios productivos ni modificación de los 55 casos en esta auditoría.
