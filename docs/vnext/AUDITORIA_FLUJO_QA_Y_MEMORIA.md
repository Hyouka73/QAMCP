# Auditoría del flujo de QA y de la memoria

El objetivo es que una persona de QA pueda pedir pruebas funcionales, aportar el objetivo, los datos de acceso y el comportamiento esperado cuando falten, y recuperar los resultados en otro chat. QAP debe llevar por sí mismo el estado de cada etapa, ejecutar lo que esté listo y explicar los huecos pendientes.

Este diagnóstico conserva la inspección inicial de OPENCLAW. El [corte integrado](PLAN_ONE_SHOT_Y_MERGE.md) actualiza qué se implementó y qué falta verificar. El candidato ya publica un índice de Discovery con expedientes y reglas por alcance. Queda vincular esa memoria al plan, la ejecución y el reporte con revisiones fijas.

## Estado observado

- **OPENCLAW en Windows.** La base de la aplicación registra cuatro módulos, cinco inventarios y un documento ingerido. Tiene cero requisitos de servicio, casos, intentos de ejecución y publicaciones de reportes para ese proyecto. La campaña figura activa en `WORKING`. Los registros del proceso anterior acreditan cuatro diálogos nativos de Discovery para el mismo origen y un diálogo de workspace. El chat también pidió elegir el siguiente módulo después de que ya había un plan. La inspección de datos fue de solo lectura.
- **Planificación automática.** QAP puede sintetizar un borrador desde un inventario o requisito. Cuando hay requisitos confirmados toma solo el primer criterio de cada uno, navega a la URL y busca su texto en `body`. Si faltan criterios, crea una propuesta pendiente. El historial de pruebas con Chromium demuestra ejecución real de casos que recibieron pasos explícitos en el fixture. Esa evidencia cubre el runner, la persistencia y la publicación en condiciones de prueba. La cobertura funcional derivada automáticamente de un inventario sigue por comprobar. [Generación conversacional](../../packages/mcp/src/handlers/conversational-case-workflow.ts#L46), [prueba con Chromium](../../packages/mcp/src/__tests__/block3-cases-execution-reports.test.ts#L163)
- **Playwright.** El flujo actual materializa pasos como `TC-*.yaml`, genera `tests/plan.json` y pasa al runner una copia de los casos verificados. El runner interpreta las acciones usando `playwright-core`. En el camino revisado, el entregable es una prueba ejecutable por QAP. Falta un exportador reproducible de `.spec.ts` y una prueba que lo ejecute con la herramienta estándar de Playwright. [Persistencia de casos](../../packages/mcp/src/handlers/conversational-case-workflow.ts#L397), [snapshot de ejecución](../../packages/mcp/src/handlers/test.handler.ts#L605), [runner](../../packages/playwright-runner/src/runner.ts#L640)
- **Memoria.** Ya existen filas para inventarios, requisitos, casos, ejecuciones y publicaciones. Knowledge también tiene historial de entidades y vínculos por revisión. El FTS existente indexa objetivos de acción y selectores. En el catálogo MCP revisado falta una consulta de memoria del proyecto que reúna decisiones, fuentes, casos, resultados y pendientes. [Esquema de la aplicación](../../packages/mcp/src/application/app-service-store.ts#L243), [índice actual de Knowledge](../../packages/knowledge/src/storage/knowledge-sqlite-schema.ts#L59), [catálogo MCP](../../packages/mcp/src/tool-catalog.ts)
- **Reportes y ayuda.** QAP publica reportes de ejecución en HTML, Markdown, JUnit y JSON, con recuperación de publicaciones incompletas. El CLI ya trae `help` y explicaciones de flags. La ayuda operativa de MCP se reparte entre descripciones, esquemas y una guía de integración. La documentación viva de la aplicación y su índice de memoria son entregables distintos de esos reportes. [Publicación](../../packages/mcp/src/handlers/report.handler.ts#L231), [comandos](../../packages/cli/src/commands.ts), [guía MCP existente](uso/DEV-MVP-02_CLIENTE_MCP.md)

## Causas raíz

1. **Alcance y diálogos se implementaron juntos.** La composición local habilitaba mecanismos interactivos independientes para workspace, Discovery, login y ejecución. La operación normal debe resolver su alcance al entrar y reusarlo silenciosamente. El contexto que provee el host vincula la raíz. El entorno y su revisión vinculan el origen. Una revocación debe surtir efecto aunque haya una sesión del navegador vigente. El servidor debe devolver un estado concreto cuando el contexto falte o sea contradictorio, de modo que el agente pueda pedir el dato relevante.
2. **Un borrador puede convertirse en una decisión atribuida a QA.** `expected_outcome` en una propuesta puede crear un requisito `confirmed` con fuente `user` sin referencia a un mensaje o documento de respaldo. El esquema declara `document` y `observed`, mientras el handler espera `ingested_doc` y puede usar `user` por defecto. `review` en el flujo local comparte la implementación de aprobación y registra `qa_user`. Así, escribir un caso, revisar un caso y acreditar su expectativa pueden parecer la misma acción. [Contrato publicado](../../packages/mcp/src/tool-catalog.ts#L479), [creación del requisito](../../packages/mcp/src/handlers/conversational-case-workflow.ts#L220), [aprobación](../../packages/mcp/src/handlers/conversational-case-workflow.ts#L376)
3. **La ejecución y sus referencias se guardan por caminos distintos.** Se persiste una aprobación en SQLite antes de validar y materializar todos los YAML. Un error intermedio puede dejar aprobado un caso sin artefacto utilizable. Al final de un intento se prioriza el requisito actual del caso sobre el dato congelado al iniciar. Si el requisito cambia en paralelo, el historial puede asociar un resultado con otra revisión. Además, CLI y MCP escriben un `plan.json` con reglas de cálculo diferentes. [Materialización](../../packages/mcp/src/handlers/conversational-case-workflow.ts#L376), [persistencia del resultado](../../packages/mcp/src/application/block3-execution-repo.ts#L770), [plan CLI](../../packages/cli/src/commands/plan.ts#L18), [plan MCP](../../packages/mcp/src/handlers/plan.handler.ts#L744)
4. **El agente integra decisiones que debería resolver la plataforma.** `qap_status` combina datos de `.qa`, Knowledge y Application Service. Las pruebas de integración introducen llamadas y argumentos en el orden esperado. Para un chat real, la siguiente acción debe venir calculada con argumentos completos, con avance automático de los casos listos y con un estado estable después de reconectar. [Composición de estado](../../packages/mcp/src/handlers/status.handler.ts#L97), [evidencia de aceptación empaquetada](../../packages/mcp/src/__tests__/block4-clean-package-acceptance.test.ts#L444)

## Diseño recomendado

**Plan y ejecución.** Definir un caso ejecutable mediante ID estable, revisión, alcance, precondiciones, datos de prueba, pasos tipados, resultado observable, criterio de negocio y referencia a su fuente. Usar los objetivos observados para seleccionar locators y la fuente de negocio para decidir la aserción. Un criterio faltante queda pendiente y los otros casos siguen. La petición de probar habilita la ejecución de casos técnicamente válidos en su alcance. El usuario aporta criterio de negocio cuando falte, resuelve ambigüedades que cambian qué se prueba y decide sobre brechas de cierre cuando corresponda.

**Memoria e índice.** Usar Application Service como fuente de estado operativo y las revisiones de Knowledge para evidencia y procedencia. Vincular ambos con IDs estables y un snapshot inmutable por intento. Añadir una consulta paginada que filtre por proyecto, entorno, módulo, fecha, estado, tags y tipo de registro, capaz de devolver resultados con su fuente y revisión. Empezar con filtros exactos y búsqueda léxica. Añadir FTS de otros tipos solo después de medir qué consultas no resuelve el índice inicial. Excluir credenciales, tokens y estados de navegador del índice, de los documentos generados y de los reportes.

**Documentación.** Generar un índice humano `INDEX.md` desde esos mismos datos. Cada módulo debe enlazar rutas y roles, fuentes, comportamientos confirmados, pendientes, casos vigentes, historial de ejecuciones y evidencias. El índice y las páginas deben poder regenerarse tras restaurar la base. La información que aporte QA debe entrar como fuente versionada y conservar su referencia al volverse parte de la documentación.

**YAML y Playwright Test.** Conservar el contrato YAML durante la validación del MVP como formato de compatibilidad del runner existente. Congelar primero un caso tipado y versionado. Si hace falta llevarlo a CI fuera de QAP, derivar un `.spec.ts` de ese caso, ejecutar ambas salidas en el mismo fixture y comparar resultados. Mantener una sola definición editable. La decisión de persistir definiciones en YAML, JSON o SQLite puede tomarse luego con evidencia de revisión, migración y reproducibilidad.

**Ayuda.** Mantener `qap help <comando>` y generar la referencia MCP del catálogo verificado. Cada comando debe indicar cuándo se usa, qué datos necesita, qué guarda, sus estados y cómo reanudar si se interrumpe. La descripción de un comando no debe exigir el aprendizaje del comando para completar una tarea habitual por chat.

## Referencia operativa actual

El CLI ofrece `qap --help` para el catálogo completo y `qap help <comando>` para opciones individuales. Se comprobó la ayuda de `plan`, `test`, `report` y `runtime` con el binario local en la inspección inicial. El candidato añade `qap flow <flow>` y su `--help`. La tabla explica las 20 herramientas MCP verificadas para quien necesite diagnosticar el flujo. [Catálogo MCP](../../packages/mcp/src/tool-catalog.ts) · [Catálogo CLI](../../packages/cli/src/commands.ts)

| Herramienta MCP | Función |
| --- | --- |
| `qap_status` | Consulta el proyecto, su fase, pendientes y siguiente acción. En un workspace vinculado puede preparar la estructura local. |
| `qap_init` | Inicializa la estructura de QA del proyecto. |
| `qap_project` | Gestiona identidad, selección, reanudación, importación, revocación y ciclo de borrado o recuperación. Consulta expedientes de Discovery por alcance y revisión y puede regenerar su publicación. |
| `qap_context_set` | Registra ubicación, objetivo y demás contexto del sistema. |
| `qap_context_ingest` | Extrae propuestas de contexto y registra reglas con procedencia, versión y alcance cuando están declarados. |
| `qap_auth_add` | Configura un perfil e intenta establecer una sesión verificable. |
| `qap_auth_provision` | Aprovisiona en el host una credencial para un perfil local. |
| `qap_auth_list` | Lista perfiles y su estado. |
| `qap_session_plan` | Registra los módulos y prioridades de la campaña. |
| `qap_discover` | Observa una ruta, detecta vistas y controles, y registra el inventario y su evidencia. |
| `qap_rules_set` | Registra reglas o decisiones y, con la integración canónica, conduce la entrevista de un módulo. |
| `qap_plan` | Propone o gestiona casos con `case_workflow` y prepara el plan de ejecución con los casos materializados. |
| `qap_validate` | Valida definiciones, esquema y referencias de casos y módulos. |
| `qap_test` | Verifica el plan vigente y ejecuta los casos del módulo con el runner. Admite selección por ID. |
| `qap_report` | Publica un reporte desde evidencia persistida. Puede recuperar una publicación parcial. |
| `qap_module_close` | Registra el cierre formal de un módulo o su exclusión justificada. |
| `qap_session_close` | Consolida el estado de la campaña, genera su reporte y tramita su cierre. |
| `qap_server` | Gestiona el visor local de resultados y memoria. |
| `qap_prune` | Limpia artefactos temporales o antiguos según las opciones de retención. |
| `qap_project_reset` | Inventaría los recursos de un proyecto y tramita su eliminación explícita. |

## Orden de trabajo y aceptación

| Orden | Entrega | Criterio verificable |
| --- | --- | --- |
| 1 | Alcance normal sin diálogos | Un cliente Stdio con raíz vinculada puede realizar Discovery autenticado y una ejecución en Chromium, incluidos proyectos con registros antiguos. Otra raíz, otro origen, perfil revocado y producción sin política quedan bloqueados antes de enviar datos o iniciar el navegador. |
| 2 | Fuente y revisión del oráculo | Una propuesta del agente queda pendiente sin fuente válida. Una regla citada se usa con revisión y evidencia. Cambiar la regla invalida el plan vigente sin cambiar un resultado histórico. Consultar `review` es de solo lectura. |
| 3 | Caso funcional y planificación | Un fixture permite generar casos desde una expectativa concreta y un inventario. Se ejecutan un caso positivo y uno negativo con pasos útiles y una aserción específica. Un criterio pendiente queda visible mientras siguen los demás. Repetir el plan mantiene IDs y versiones cuando los insumos coinciden. |
| 4 | Ejecución y publicación | Un único intento fija alcance, requisitos y casos antes de arrancar. Diferencia fallos funcionales, fallos técnicos y casos sin ejecutar. Si falla la publicación, se recupera desde el intento original sin lanzar otro navegador. |
| 5 | Memoria consultable y documentación generada | Tras reiniciar el servidor o abrir otro chat se puede recuperar el módulo, una decisión, su fuente, el caso y su último resultado sin repetir Discovery. El índice se regenera, respeta el alcance y excluye material de autenticación. |
| 6 | Ayuda y validación operativa | CLI y MCP documentan el comportamiento real. En Antigravity, una persona inicia QA en lenguaje natural, obtiene resultados con evidencia y luego recupera el trabajo en otro chat con Gemini Flash Low. Se mide cuántas intervenciones y llamadas requiere el flujo. |

El orden admite una prueba corta por entrega y un único agente implementador. Los primeros cuatro bloques cambian contratos encadenados. Ejecutarlos en paralelo obligaría a coordinar esas mismas interfaces y repetir contexto. Si existe una subtarea independiente después, se puede evaluar su ejecución paralela según el coste medido.
