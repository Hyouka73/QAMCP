**Auditoría independiente de reparación. Fecha local: 2026-11-05 (America/Mexico_City). HEAD probado: 8f091626825ceb2fa3f1abdfb0732f0f3dad8e9c.**

# Tres dictámenes independientes

| Dictamen | Decisión | Fundamento |
| --- | --- | --- |
| **A — GO técnico P1, bajo todos los invariantes solicitados** | **NO-GO estricto; integridad de los P1 A01/A02 verificada en el alcance ejecutado** | Los bypass anteriores no pasan; positivos, negativos, CAS, multiproceso y crash/retry físicos pasan. Pero el negativo de contención Knowledge devuelve error RPC genérico, incumpliendo el bloqueo específico obligatorio. P2 C01; no se inventa un P1 ni se concede GO completo con una excepción no autorizada |
| **B — desarrollar VNEXT-015 aisladamente** | **GO técnico condicionado** | WBS declara VNEXT-003 y VNEXT-009 como dependencias, ambas completas con límites. Engine168/168 y Knowledge258/258 verdes; puerto IKnowledgeStore y datos DAG no requieren handlers de cierre, test ni reporter. Rama separada y revisión antes de integrar; iniciar implementación sigue requiriendo autorización específica fuera de esta auditoría |
| **C — cierre VNEXT-014 / merge develop** | **NO-GO** | C01, tres lint nuevos, E01 reproducido, 63 garantías MCP sin equivalencia aceptada y revisión humana auténtica/flujo integrado WBS pendientes |

## P1 y alcance de A

Se pueden retirar las reproducciones anteriores de **cierre obsoleto/falso WRAP_UP A01 y recibo de procedencia falsa A02** como defectos de integridad abiertos para el HEAD y los escenarios ensayados. No hay nuevos P0/P1 demostrados en esta auditoría. Ese resultado técnico acotado **no equivale al GO A solicitado**, porque el usuario exigió además conflicto con bloqueo específico. Se deja la distinción visible para no retrasar 015 por atribuirle un bypass P1 que ya no se observa, ni ocultar la excepción contractual pendiente.

C01 se reproduce sin mocks de almacenamiento: hijo oficial SqliteKnowledgeAdapter.withWriteFence mantiene la reserva; el padre llama qap_session_close; respuesta MCP -32603 CONFLICT, lifecycle WORKING, sin reporte. Liberar el hijo permite retry sin aprobación nueva. Corrección mínima recomendada: esperar la promesa de commitLifecycleStateWithFence dentro del try y traducir conflicto/adquisición fallida a un resultado blocked con código estable, conservando no publicación/readback. Un return await aislado solo hará alcanzar el catch actual; también hace falta el mapeo de resultado específico. Auditor no aplica la reparación.

## B — viabilidad de ImpactAnalyzer

El alcance declarado es calcular módulos/flujos dependientes afectados en el DAG. IKnowledgeStore v1 expone módulos/flows/relations, referencias fijadas y queries; DomainModule.dependencies ya es canónico y acíclico según el puerto. @qap/engine depende de @qap/shared; @qap/knowledge depende de ambos, sin dependencia de @qap/mcp o playwright-runner. Las correcciones actuales de FileSystemStorage no obligan al cálculo puro a ejecutar session_close. Los tests de Knowledge incluyen inferencia/contrato y pasaron.

Condiciones: rama separada desde un SHA vNext verificado; limitar commits a cálculo/puertos/tests de engine/knowledge; no asumir que receipt significa vigencia temporal universal; no depender de qap_session_close, qap_test, TestHandler ni reporter de 014; revisión y pruebas antes de integrar. No se implementó VNEXT-015 ni se creó esa rama de producto. GO B no autoriza merge hacia develop.

## C — pasos mínimos pendientes

1. Corregir C01 y repetir el negativo multiproceso de contención y su retry, conservando los positivos de A01/A02.
2. Retirar tres non-null assertions innecesarias de las regresiones nuevas; repetir lint focal/global sin deshabilitar reglas. Mantener separados los 34 errores/28 warnings históricos.
3. Resolver E01: identificar el rechazo de replace de Windows con handles reales; manejar rechazos inmediatos y drenar tareas antes de cleanup; aislar presupuesto/recursos de los seis subprocesses. No aumentar timeouts para hacer desaparecer fallos.
4. Migrar ocho positivos Memory a SQLite/fence físico preservando el negativo incapaz. Migrar E0a/E1/E2/E3/Criterio9 con equivalencia de preguntas/revisión/cobertura/reporte/replanificación, después los otros contratos legacy por identidad. El auditor conserva los 63 FAIL actuales.
5. Ejecutar recorrido auténtico init→contexto→plan→Discovery consentido→asociación→entrevista→ExpectedRequirement revisado por humano→coverage→A closed+B waived→reporte→WRAP_UP→replanificación, con evidencia independiente donde la exige el WBS. Fixtures sintéticos y una suite verde no son revisión humana.
6. Validar compuertas vigentes de WBS y revisión de responsables antes de PR/merge. Sin merge ni publicación npm desde esta auditoría.

A04-W01 queda como riesgo P2 de extensiones privilegiadas que incumplen el contrato de ALS; la composición directa inspeccionada no incorpora la cola adversarial. Si se desean wrappers, diseñar y certificar propagación explícita del plazo/contexto antes de soportarlos. No se certifican adaptadores arbitrarios ni tiempo real frente a suspensión del SO.

## Calendario y evidencia humana

Se preservan 16/11 certificación, 19/11 merge condicionado y 20/11/2026 MVP. GO B permite desacoplar trabajo de DAG del cierre integral de 014; no convierte C en GO ni rebaja revisión humana. Esta auditoría no obtuvo decisiones humanas reales para una aplicación bajo prueba, por lo que esa compuerta queda **NO EJECUTADA / NO CERTIFICADA**.
