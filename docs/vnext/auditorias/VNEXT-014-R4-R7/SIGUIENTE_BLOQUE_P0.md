# Siguiente P0: closed auténtico y continuidad lifecycle

Análisis de `ea75eb2c52266b174e6d24917c1b089d56834900`. R4-R7 valida propuesta/corrección→revisión→requisito→evaluación incompleta. **No acredita todavía closed ni sesión completa.** No implementar otro motor de entrevista, evaluador o aprobador MCP.

## Fronteras existentes y contratos a reutilizar

Rutas relativas a `packages/mcp/src`, salvo indicación explícita.

| Archivo/método | Ya implementado | Pendiente de composición/evidencia |
| --- | --- | --- |
| server.ts:createMcpServer; handlers/state-services.ts:ProjectKnowledgeBinding | projectRoots, store/app/entorno, moduleBindings, humanReviewGateway, moduleClosureReviewGateway, moduleClosureStore e interviewDraftStore del host | Fixture con dos módulos, dos gateways independientes y raíz exacta; Stdio por defecto no provisiona estos bindings. UI/identidad/claves productivas siguen a cargo del host. |
| handlers/discovery.handler.ts:DiscoveryHandler.execute; module-observation-bridge.ts:receipt/associate/project/resolve | Adquisición anónima autorizada, observaciones y evidencias revisadas por identidad, asociación idempotente | Encadenar HTTP local real+Chromium→entrevista en el mismo caso; no sustituir por requisitos confirmados sembrados. No afirmar soporte auth/SPA fuera del contrato. |
| handlers/canonical-interview-service.ts:execute/request | next/propose/correct/review/defer/resume; question_id/version/expected_revision; digest exacto, CAS, recibo atómico y readback | Obtener requisitos de negocio suficientes y criterios verificables por aprobación separada. INTERVIEW_CATEGORY_MAPPING es sugerencia, no equivalencia entre siete preguntas y siete categorías formales. |
| handlers/interview-draft-store.ts:SqliteInterviewDraftStore | Persistencia cifrada separada, versiones/reserva y recuperación de aprobación | Añadir reinicio del host al recorrido completo; persistir borrador no autoriza requisito. |
| handlers/canonical-coverage-service.ts:evaluate | Requisitos activos confirmados válidos, criterios, aplicabilidad, brechas, digest; inventory_limit conservador | Al menos un requisito funcional nacido de entrevista y resto aplicable satisfecho o exclusión legítima específica del host. Sin pending, unknown ni gaps sin resolver para ready_for_closure. Ejecución queda not_executed. |
| handlers/canonical-closure-service.ts:execute | evaluate, declare_non_applicable, accept_gaps, close, waive; gateway de cierre independiente | Resolver primero A01 de solicitudes pendientes. Revisión de requisito no autoriza exclusiones ni close. Motivo >=15 caracteres; no renunciar todas las categorías. No usar accept_gaps como sustituto de un positivo complete. |
| handlers/module-closure-gateway.ts:IModuleClosureReviewGateway.reviewClosure | action/contexto/cobertura exactos, requestDigest; approve/reject y expiración | Decisión para declare_non_applicable y otra para close; negativo sin gateway, null, rechazo, digest viejo, caducidad, reuse. Verificar cambios durante await; no basta revisar moduleRevision para demostrar vigencia de cobertura. |
| handlers/module-closure-store.ts:SqliteModuleClosureStore; closure-service:commitFinalClosure/reconcile/status/allModulesClosed | Snapshot cifrado, CAS, relación closure/waiver, recuperación y proyección lifecycle | closed real recuperado en otra conexión/proceso sin duplicación ni nuevo consentimiento; no mutar module.revision. Conservar Crash 2/3 y aprobación correlacionada 1:1. |
| handlers/status.handler.ts:execute | Recupera preguntas reales, comprueba todos los cierres vinculados; preview 16 | Orientación hacia aplicabilidad/evaluación/cierre tras revisión sin consulta que emita aprobación; distinguir deuda P0 de una pregunta ya confirmada. |
| server.ts:qap_session_close (:3323) | allModulesClosed, relectura tras reconcile, gate Working, reporte físico antes de WRAP_UP | Componer A closed+B waived en primera llamada. El reporte usa moduleRules legacy y lifecycle (:3453–3481), no recibe el assessment canónico: verificar honestidad y añadir proyección canónica en la frontera existente si el reporte omite requisitos/brechas reales. Riesgo identificado por lectura, no nuevo defecto reproducido aquí. |
| server.ts:qap_session_plan (:1579/:1637) | Rechaza reabrir closed en WRAP_UP; nueva sesión WRAP_UP→SCOPING→WORKING | Plan nuevo módulo C con binding canónico explícito; conservar A/B, recibos, requisito y sesión previa. No usar un test positivo que reabra A contra el contrato actual. |
| handlers/plan.handler.ts, test.handler.ts, report.handler.ts; PlaywrightRunner | Planificación DAG, ejecución y artefactos reales | Integrar posteriormente resultados de ejecución con cobertura mediante contrato explícito. closed de especificación no certifica ejecución. |

## Orden y casos de aceptación

1. Corregir **A01 P1** con snapshot estable de solicitud pendiente; la misma declaración y contexto deben admitir decisión posterior del inbox. Negativos: motivo/categoría/contexto modificados, expiración, decisión ajena/reutilizada y concurrencia sin duplicados. No congelar un digest ante cambios reales.
2. Componer módulo A desde adquisición real e entrevista hasta requisitos aprobados con criterios. Comprobar que ausencia de autorización y revisión obsoleta no cambian conocimiento; luego reapertura SQLite exacta. Conservar R4-R7-I01.
3. Resolver aplicabilidad por evidencia de negocio del fixture: usar requisitos para categorías aplicables y declare_non_applicable con decisiones independientes solo para las exclusiones justificadas. Probar que categorías unknown, requisito pendiente o criterios ausentes bloquean close. Hacer ready_for_closure verificable con cero gaps sin resolver.
4. Emitir aprobación independiente para close de A: comprobar closed físico, recibo único, proyección, status coherente y retry idempotente. Negativos: usar autorización de requisito como cierre, cambiar requisito/evidencia durante review, approval reuse, error entre dos stores y lifecycle. Revisar la ventana transversal de cobertura antes del commit; no declararla segura sin prueba adversarial.
5. Preparar B y waiver legítimo con motivo exacto y decisión separada. Sin decisión/rechazado/motivo corto, sesión sigue bloqueada y sin reporte; aprobación válida permite allModulesClosed. No sustituir el closed de A por otro waiver.
6. Cerrar sesión en primera llamada, leer el reporte físico y comprobar cobertura/brechas/requisitos canónicos reales y ejecución not_executed. Reabrir host y verificar reconciliación. Desde WRAP_UP, bloquear actividad fuera de fase y abrir nueva sesión con C, conservando historia, A/B y recibos.
7. Solo después migrar los cinco lifecycle por garantía equivalente y los otros 50 casos según clasificación R4-R5, resolver lint y repetir matriz. No cambiar una expectativa success por blocked para hacerla pasar.

## Cinco garantías históricas preservadas

| Garantía | Evidencia parcial actual | Lo que aún debe demostrarse |
| --- | --- | --- |
| E0a | R4-R6 mantiene ID/versión entre status y next; R4-R7 confirma propuesta corregida | Misma pregunta/contexto en toda la interacción; aislamiento y continuidad posterior sin aprobación implícita. Test histórico sigue FAIL. |
| E1 | Corrección invalida autorización anterior; revisión/CAS existen | Nueva evidencia/revisión cambia evaluación y requiere decisión nueva. Definir explícitamente política de reapertura: no reabrir closed de forma implícita para imitar consolidated→interviewing legacy. |
| E2 | Cierre durable/waiver y fallos/recovery probados por separado | A closed mediante requisitos realmente confirmados y aplicabilidad legítima, autoridad separada, retry idempotente y avance al siguiente módulo. |
| E3 | Waiver→reporte/WRAP_UP ya tiene positivos parciales | Sesión A closed+B waived, reporte fiel canónico y nueva sesión con C conservando estado e historial. |
| Criterio 9 | Tramo entrevista→confirmación→evaluación ahora PASS | Una única cadena física init→context→plan→discovery A→entrevista/revisión→closed A→waived B→reporte→WRAP_UP→nueva sesión, con setup verificado en cada frontera. |

A01 es un defecto real del flujo de aprobación diferida; el riesgo de revalidación transversal y el adaptador de reporte requieren pruebas específicas antes de concluir defecto o suficiencia. Esta auditoría no autoriza cambios productivos. VNEXT-014 NO-GO; VNEXT-015 sin iniciar.
