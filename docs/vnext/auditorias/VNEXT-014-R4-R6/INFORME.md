# Auditoría independiente VNEXT-014-D-R4-R6

**Fecha:** 2026-11-05, America/Mexico_City. **Código auditado:** `fbc089c02b71828994a62af1a9eb6d28e33cb4bb`. **Rama de publicación:** `feat/qap-vnext-architecture`.

**Dictamen: continuidad R4-R6-I01 verificada; VNEXT-014 NO-GO.** La pregunta canónica real se recupera con el mismo ID y versión mediante status → qap_rules_set.canonical_interview.action=next. No se inventa entrevista antes de iniciarla, no hay confirmación ni solicitud de aprobación por status y no se genera rules.yaml. La sonda adicional conserva tablas, DB/WAL y lifecycle tanto en versión 0 como en versión 1 de una propuesta pendiente.

| Compuerta | Resultado físico | Salida |
| --- | --- | ---: |
| Build | 10 paquetes PASS; binarios MCP y CLI presentes | 0 |
| Foco R4-R6-I01 | 1 PASS, 42 no seleccionadas | 0 |
| Canonical Interview | 43/43 PASS | 0 |
| Canonical Coverage | 37/37 PASS | 0 |
| DiscoveryHandler inicial | 58 PASS / 1 timeout de cancelación | 1 |
| DiscoveryHandler repetición aislada | 59/59 PASS; también 59/59 en integral | 0 |
| ESLint focal | 0 errores / 0 advertencias | 0 |
| MCP serial integral | **406 PASS / 55 FAIL de 461**; 16 suites PASS / 7 FAIL | 1 |
| Playwright Runner | 71/71 PASS, 10 suites | 0 |
| ESLint global | **34 errores / 28 advertencias**, mismos diagnósticos R4-R5 | 1 |
| Stdio | 18 herramientas, qap_init real y status ONBOARDING | 0 |
| Sonda independiente de entrevista | ID/versión estables, cero requisitos/aprobaciones, snapshots intactos | 0 |

El diferencial por archivo y título conserva **405 PASS y 55 FAIL comunes** con R4-R5. Hay exactamente una alta: R4-R6-I01, ejecutada y aprobada. Los 55 fallos conservan identidad en el inventario VNEXT-013; los cinco lifecycle históricos siguen fallando. No se corrigieron expectativas ni se atribuyó automáticamente el incremento a la prueba nueva.

Las regresiones de cierre durable, Crash Scenarios 2/3, primera llamada R4-R2-A01 y guidance de 16/17 módulos pasan en Coverage e integral. No se demuestra una nueva regresión de código. El timeout inicial de Discovery es del mismo título registrado en R4-R3; pasó en integral y repetición sin modificarlo. Su causa interna permanece indeterminada y se conserva el intento fallido, sin declarar que esa intermitencia está resuelta.

El siguiente bloque P0 debe componer propuesta/corrección, revisión independiente, requisito confirmado y evaluación de cobertura reutilizando CanonicalInterviewService, sus gateways, IKnowledgeStore y CanonicalCoverageService. Después debe acreditar closed por requisitos obtenidos de entrevista, segundo módulo waived, reporte y replanificación. Ya existen servicios y pruebas parciales; se detalla qué composición y evidencia faltan. La cobertura de ejecución sigue declarada not_executed por el evaluador: cierre de especificación no acredita pruebas funcionales aprobadas.

Solo se modifica documentación/evidencia saneada. El checkout original, código, tests, lockfile, esquemas, credenciales y sesión protegida se preservan. El worktree auditado estaba limpio y quedó en detached HEAD sobre el SHA solicitado antes de ejecutar. La sesión protegida conserva su hash en ambos checkouts. Las bases y fixtures son sintéticos, externos al repositorio, sin aprobación productiva.

El SHA de este código auditado es el indicado arriba. El SHA documental corresponde al commit que incorpora este informe y los archivos siguientes; puede obtenerse en el historial de GitHub de esta carpeta. No se presenta ese commit documental como una segunda ejecución del código.

- [Resultados por suite y primeros errores de los 55 casos](RESULTADOS_MCP.md)
- [Diferencial nominal y alta ejecutada](DIFERENCIAL_MCP.md)
- [ESLint por archivo, línea y regla](LINT.md)
- [Comandos, entorno e integridad de artefactos](COMANDOS.md)
- [Continuidad, snapshots y timeout conservado](EVIDENCIA_ENTREVISTA.md)
- [Sonda externa reproducible](SONDA_ENTREVISTA.md)
- [Análisis del siguiente bloque P0](SIGUIENTE_BLOQUE_P0.md)
- [Logs de todas las compuertas](LOGS.md)
