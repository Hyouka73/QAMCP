# Primera familia histórica — clasificación antes de migración

Fecha 2026-11-05. Implementador, no auditor independiente. Las cinco identidades de `lifecycle-v3-e2e.test.ts` se conservan literalmente y continúan FAIL. No se cambian oráculos para obtener verde.

## Causa primaria verificada

El beforeEach original crea `createMcpServer()` sin Knowledge binding ni consentimiento de Discovery. Los mocks de PlaywrightAdapter pertenecen al camino legacy; la ruta vigente registra DiscoveryHandler con crawler y políticas de host. `advanceToWorking` crea contexto y plan legacy, pero no una Application/Environment/Module canónica física ni su binding. La llamada Discovery no llega a la navegación simulada ni crea los antiguos archivos de vista/rules.

Una sonda SDK adicional sobre el servidor compilado, raíz temporal explícita y los mismos datos de init/context/plan, produjo: init/context/session_plan SUCCESS; Discovery **blocked/knowledge_unbound**; status sigue **trabajo**; rules_set y module_close devuelven **blocked/legacy_interview_unavailable**. No se afirma que esto sea una prueba equivalente de las cinco garantías posteriores. [Sonda y respuestas](evidencia/lifecycle-first-cause.json).

Contrato vigente: `handlers/discovery.handler.ts` exige binding y autorización de host antes del crawler. `handlers/legacy-discovery-contract.ts` declara que observaciones no son requisitos confirmados y exige contexto legacy antes de esa entrevista. Los servicios canónicos de entrevista/cierre exigen identidad, revisiones y revisión del host: los booleanos/source del JSON legacy no conceden autoridad canónica.

## Disposición por identidad

| Identidad histórica (prefijo de suite conservado en matriz) | Primer fallo físico | Clasificación | Trabajo sustantivo pendiente |
| --- | --- | --- | --- |
| E0a: qap_status en WORKING para módulo con cobertura incompleta devuelve module, view y preguntas no vacías idénticas a qap_rules_set | status da trabajo, esperado entrevista_vista | Fixture de composición legacy; compatibilidad de guidance pendiente | Binding SQLite, Discovery consentido, asociación, propuesta/revisión real. Conservar igualdad de pregunta/cobertura entre status y entrevista tras requisito parcial. Decidir explícitamente correspondencia de los campos legacy con guidance canónico antes de sustituirlos. |
| E1: regresión consolidated -> interviewing tras re-discover y política de waivers | La validación de waiver está precedida por legacy_interview_unavailable | Fixture legacy y semántica de regresión pendiente | Probar categorías irrenunciables/razón, cobertura completa con autoridad, revisión invalidada y reanudación. Rediscovery observacional no puede convertirse automáticamente en nuevos requisitos. Hace falta decisión de equivalencia para la antigua regresión automática de consolidated y su historial, no restaurar promoción DOM→confirmed. |
| E2: qap_module_close validaciones, compuertas y transiciones | El tercer negativo espera consolidated, recibe ausencia de contexto legacy | Precondición de fixture y contrato de autoridad | Conservar módulo desconocido, falta de consentimiento, precondiciones, cierre válido, terminal y waiver/reason; montar host gateway legítimo de fixture + SQLite y validar recibos/lifecycle. user_confirmed por wire no reemplaza el gateway. No declarar equivalente el primer bloqueo. |
| E3: canExitWorking, qap_session_close, reporte de brechas y nueva sesión desde WRAP_UP | ENOENT rules.yaml después del Discovery bloqueado ignorado | Fixture obsoleto; garantías posteriores no alcanzadas | Cadena canónica física A closed+B waived, reporte fiel, guardas de WRAP_UP, replanificación e historial; mantener ausencia de afirmaciones falsas de cobertura de ejecución. Decidir formato/compatibilidad de las secciones legacy del reporte, sin fabricar rules.yaml o decisiones. |
| Criterio 9: E2E completo (fullName íntegro en matriz) | r4 Discovery blocked frente a success | Fixture de host incompleto; integración completa pendiente | Reconstruir recorrido completo con aplicación sintética autorizada, Knowledge, entrevistas/revisiones y fases reales. Mantener schema validation tras cada mutación y todos los oráculos de cierre, reporte y nueva sesión. No sustituir test positivo por rechazo esperado. |

No se demostró un nuevo defecto productivo detrás de esos primeros bloqueos. Tampoco se da por obsoleta ninguna garantía: las decisiones de compatibilidad y la migración siguen abiertas. El nuevo contrato aprobado no permite inferir qué campos de presentación histórica deben retirarse sin acta. Esta entrega es el primer lote correctivo autorizado, no la reconciliación terminada de las 55.

## Resto de pendientes verificables

| Grupo | Identidades pendientes | Prioridad y siguiente evidencia |
| --- | --- | --- |
| lifecycle E0a/E1/E2/E3/Criterio9 | 5 | P1: composición y decisiones anteriores. |
| p3-verification | 5 | P1: consent/binding reales; idempotencia, errores navegador y guidance. |
| p4-2-pregunta-contract | 2 | P1: preguntas/categorías y contrato de cobertura; mantener positivos de entrevista. |
| p4-4-auth-lifecycle | 7 | P1: definir compatibilidad auth/SPA con crawler anónimo; luego fixtures consentidos, perfiles y secretos. No ampliar capacidades auth por inferencia. |
| p4-5a-integrity | 10 | P1: sustantividad, límites, categoría, confirmación humana y cobertura canónica. |
| p4-5a2-integrity | 16 | P1: entrevista/revisión y cuatro planos epistemológicos; no promover DOM. |
| server | 10 | P1: formato/schema/contexto legacy y ruta canónica, por identidad. |

Total 55. La matriz preserva archivo + fullName, resultado baseline/final y ordinal si procede. Se formalizan además pendientes P2 de 34 errores/28 advertencias ESLint y 124 diagnósticos MCP TypeScript finales; no alterar reglas/config/tipos para ocultarlos. A04-W01, E01/latencia y aceptación humana auténtica permanecen compuertas separadas.
