# Siguiente P0: recorrido canónico completo

Preparación documental sobre `44c69f826a0599eeee400ff413ae9faedeeecd75`. No implementa código ni declara aprobada VNEXT-014. Reutilizar las fronteras de [R4-R7](../VNEXT-014-R4-R7/SIGUIENTE_BLOQUE_P0.md), incorporando A02 de esta auditoría.

## Orden de composición y aceptación

1. **Resolver la vigencia transversal de autorización.** Mantener `CanonicalClosureService`, `CanonicalCoverageService`, `IKnowledgeStore`, `IModuleClosureStore` y gateways existentes. Definir el punto de consumo y las revisiones que se protegen hasta persistir; probar el intercalado después de revalidar reproducido en A02. Incluir cierre/waiver/aplicabilidad concurrentes, expiración tardía, reintento tras aprobación y approvalId reutilizado, con snapshot intacto en negativos. No añadir otro gateway, evaluador o esquema de requisitos.
2. **Fixture real desde init hasta requisitos.** Raíz desechable, proyecto/app/entorno explícitos y binding canónico de A/B. `DiscoveryHandler` + Chromium/HTTP local + `ModuleObservationBridge.receipt/associate`; después `CanonicalInterviewService` mediante qap_rules_set: next→propose→corrección→review. `IHumanReviewGateway` separado del cierre, con aprobación del digest exacto. Verificar ID/versión estable en status/next, rechazo de autorización anterior, requisito y recibo únicos, readback SQLite tras reinicio. No sembrar el requisito confirmado para sustituir esta cadena.
3. **Aplicabilidad aprobada y cobertura completa de A.** `declare_non_applicable` solo para exclusiones justificadas por el propietario sintético; aprobaciones diferidas reales para cada propuesta exacta. Requisitos con criterios para las categorías aplicables. `evaluate` debe mostrar cero pendientes, cero unknown y cero brechas sin resolver, `ready_for_closure`, con al menos requisito funcional confirmado desde entrevista. `accept_gaps` no sustituye este positivo completo. Negativos de categoría, motivo, requisito y contexto distintos sin writes.
4. **closed auténtico y durable.** Nueva autorización independiente de `IModuleClosureReviewGateway` para action close y cobertura exacta. Verificar registro closed + approval 1:1 + relation única + proyección lifecycle; módulo canónico conserva revisión. Reabrir proceso/conexión, recuperar Crash 2/3 en primera llamada y repetir sin nuevo consentimiento ni duplicados. Alterar solo digest del asiento/recibo bloquea autoridad incluso con lifecycle terminal. Reconocer terminal histórico no acredita que la cobertura actual no haya cambiado: definir política explícita de reevaluación/reapertura.
5. **B waived legítimamente.** Motivo sustantivo y decisión separada, sin sustituir el closed de A. Ausencia/rechazo/caducidad/digest ajeno/motivo corto mantienen sesión bloqueada, sin reporte. Tras waiver válido, `allModulesClosed` y status deben coincidir. Mantener regresión de 17 módulos con preview 16 y comprobación de todos los bindings.
6. **Reporte físico y WRAP_UP.** Primera llamada qap_session_close reconcilia y relee; exige A closed+B waived antes de reporte y transición. Inspeccionar el archivo real: requisitos canónicos, aplicabilidad, brechas y motivos exactos, aprobaciones trazables, `execution_coverage=not_executed`. El reporte actual lee `moduleRules` legacy en server.ts: comprobar esta frontera y componer proyección canónica allí si falta, sin crear un segundo modelo de requisitos. Un archivo existente o reporte sin requisitos no satisface fidelidad.
7. **Nueva sesión y replanificación.** qap_session_plan desde WRAP_UP→SCOPING→WORKING con módulo C y binding explícito; conservar requisitos/recibos/historia y terminales A/B. Bloquear actividad fuera de fase y reapertura implícita de A. Posteriormente integrar ejecución real mediante TestHandler/PlaywrightRunner y contrato de evidencia aprobado; closed de especificación no significa pruebas funcionales ejecutadas y aprobadas.

## Garantías históricas

| Garantía | Aserción a preservar en el recorrido |
| --- | --- |
| E0a | Pregunta real, ID/versión y contexto coherentes entre status y next; sin mutación o aprobación de lectura. |
| E1 | Corrección/nueva evidencia/revisión invalida la autorización anterior y exige reevaluar; reapertura con política explícita, no transición legacy inventada. |
| E2 | Cobertura real, aprobación separada para close, persistencia/recuperación sin duplicación y avance a B. |
| E3 | A closed+B waived→reporte físico fiel→WRAP_UP→nueva sesión C, conservando estado e historia. |
| Criterio 9 | Una única cadena física init→context→plan→discovery→entrevista/revisión→aplicabilidad→coverage→closed→waived→reporte→WRAP_UP→replanificación. |

Los cinco tests lifecycle actuales se mantienen fallidos hasta equivalencia verificable; no cambiar success por blocked para obtener verde. Clasificar/migrar los otros 50 según [inventario previo](../VNEXT-014-R4-R5/CLASIFICACION_55_FALLOS.md), resolver lint y repetir compuertas después de la corrección. VNEXT-015 no iniciado.
