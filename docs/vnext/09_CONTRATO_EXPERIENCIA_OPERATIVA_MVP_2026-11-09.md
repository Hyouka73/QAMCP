# QAP vNext — Contrato de experiencia operativa MVP (investigación, entrevista y QA progresivo)

**Fecha:** 2026-11-09  
**Carácter:** especificación funcional y decisiones de producto; solo documentación.  
**Rama de destino:** feat/qap-vnext-architecture.  
**Estado:** requisitos de producto acordados, diseño de aceptación propuesto, implementación pendiente de reconciliar con DEV-MVP-02.  
**No significa:** autorización para reescribir arquitectura, ejecutar acciones sobre aplicaciones reales, aprobar reglas automáticamente, ni certificar el MVP.

## 0. Propósito, alcance y precedencia

QAP es una plataforma de QA operada mediante un cliente de IA compatible con MCP, con herramientas propias para obtener conocimiento, orientar preguntas, planificar, ejecutar con Playwright y producir resultados trazables. El agente interpreta la intención; QAP debe imponer autorización, procedencia, aprobación y persistencia. La experiencia debe ser útil incluso sin acceso al código fuente o documentación inicial.

Esta especificación precisa D-001, D-003 a D-009, D-011 a D-015 de [REQUISITOS_Y_DECISIONES.md](REQUISITOS_Y_DECISIONES.md) y no sustituye sus invariantes de seguridad. Separa explícitamente **decisión de producto**, **comportamiento requerido**, **mecanismo actual verificado** y **brecha pendiente**. Ante contradicciones con un contrato ya implementado no se presume que la función nueva existe: abrir cambio acotado y pruebas negativas.

**Fecha MVP funcional deseada:** 2026-11-16. El 2026-11-20 sigue siendo límite de coordinación de integración con develop; ninguno equivale a GO automático.

## 1. Experiencia de usuario: descubrimiento antes que selección de módulos

**Cambio respecto de la guía anterior:** QAP NO debe imponer al usuario una lista de módulos ni exigirle seleccionar un módulo antes de investigar la aplicación y las fuentes disponibles. El alcance se define de manera progresiva. La investigación inicial puede producir un inventario provisional, no inventar módulos como entidades confirmadas.

### Flujo principal

1. **Identificar contexto:** abrir, crear o reanudar proyecto; entorno; tenant si la aplicación lo requiere; perfil y autorización aplicable. Consultar estado y conocimiento previo, evitando onboarding redundante.
2. **Reunir fuentes:** documentación facilitada (manual, especificaciones, README, repositorios permitidos), conocimiento persistido y observaciones anteriores. Conservar fuente, fecha/versión, cobertura y nivel de confianza.
3. **Determinar intención:** si no hay objetivo conocido, plantear UNA decisión contextual: (a) investigar y documentar; (b) probar una función mientras se investiga/documenta; (c) investigar/reproducir un bug; (d) continuar trabajo previo. Si el objetivo ya fue indicado, no repetir esta pregunta.
4. **Reconocimiento e inventario preliminar:** dentro del alcance y permisos autorizados, inspeccionar la estructura observable de la aplicación; rutas, navegación, vistas, roles aparentes y candidatos de módulos. Usar manuales para ampliar la cobertura, no como sustituto de observación.
5. **Contraste del inventario:** preguntar al QA, de forma compacta, qué módulos faltan o si el inventario es representativo. No exigir que se explique cada uno en profundidad. Documentar módulos no visibles como «pendientes de verificar», no como inexistentes.
6. **Profundización guiada por tarea:** priorizar los flujos necesarios para el objetivo actual. Solo entonces formular entrevistas funcionales y requisitos esperados de ese módulo/flujo, una pregunta por turno cuando la respuesta no esté acreditada.
7. **Planificación, aprobación, ejecución y cierre:** generar solo casos sustentados por reglas/oráculos válidos, hacer revisión humana cuando aplique, ejecutar con Runner propio, conservar evidencias, reportar resultados y actualizar memoria.

**Regla de UX:** toda respuesta del servidor con siguiente_accion debe respetarse, sin inventar pasos ni confirmaciones. Presentar una sola pregunta relevante por turno; se pueden agrupar comprobaciones técnicas en una ejecución de alto valor, evitando microcasos repetitivos.

### Modos operativos

| Modo | Entrada | Resultado mínimo | Restricción |
|---|---|---|---|
| INVESTIGAR | «Conoce/documenta esta app» | Mapa parcial de módulos, rutas, fuentes, preguntas y huecos | No afirmar cobertura total por un crawler parcial |
| INVESTIGAR_Y_PROBAR | «Prueba solicitudes y documenta» | Inventario incremental + pruebas autorizadas del flujo elegido + evidencia | No esperar el mapeo exhaustivo para iniciar una prueba útil |
| INVESTIGAR_BUG | Ticket, síntoma o pasos parciales | Hipótesis, precondiciones, intento controlado, veredicto REPRODUCIDO/NO REPRODUCIDO/BLOQUEADO y evidencia | No convertir la mera ocurrencia de HTTP 500 en «bug confirmado» |
| CONTINUAR / REGRESIÓN | Proyecto y sesión previa | Recuperación de estado, cambios, selecciones y resultados previos | No rehacer onboarding ni aceptar conocimiento obsoleto |

**Transición entre modos:** debe poder realizarse sin eliminar el inventario ni reiniciar el proyecto; el cambio de modo no confiere permisos adicionales. Los modos son nombres funcionales de UX, NO nuevos estados de Lifecycle ni nombres de herramientas MCP ya existentes.

## 2. Ingesta documental, «succión» y reconciliación

### Contrato de ingesta

QAP acepta una o varias fuentes autorizadas de especificación y construye un **inventario documental de aplicación**: subsistemas, módulos, vistas, flujos, dependencias, roles, campos, condiciones, ejemplos y reglas expresas, con localizadores al origen (archivo, sección/página cuando estén disponibles), versión, timestamp de adquisición y estado de revisión.

El manual corporativo de Lendus es un caso prioritario de **lectura y validación contra staging**. No convertir texto extraído en observación DOM; tampoco interpretar silencios del manual como ausencia de funcionalidad. La edición bidireccional automática del manual sigue fuera del P0; esta decisión amplía la *lectura y reconciliación*, no aprueba modificar archivos fuente.

### Matriz de reconciliación por afirmación

- **Documentado y observado:** coincidencia contextual, pendiente de confirmar requisito esperado cuando sea necesario.
- **Documentado, no observado:** verificar entorno, tenant, rol, rutas y cobertura técnica; registrar «no observado / pendiente», nunca «eliminado».
- **Observado, no documentado:** nueva función candidata o brecha documental; registrar evidencia y preguntar cuando impacte negocio.
- **Contradicción real documentado/observado:** registrar dos afirmaciones y su procedencia; marcar «requiere revisión» y NO sobrescribir el manual ni confirmar el DOM como verdad.
- **Documentos mutuamente contradictorios:** mantener versiones, fuentes y vigencia; solicitar autoridad o regla esperada antes de generar oráculos ejecutables.

La observación, inferencia, ExpectedRequirement y verificación de conformidad permanecen en planos separados (D-011). Solo un mecanismo legítimo de aprobación humana puede confirmar expectativas; una respuesta del modelo o un campo MCP no es autorización.

### Límites de formatos

La ruta actual de qap_context_ingest admite texto y Markdown y propuestas extraídas por el agente. PDF, DOCX, imágenes, lectura de tablas, archivos grandes y fuentes conectadas requieren un adaptador/capacidad acreditada o conversión revisada; **NO** se declara soporte nativo completo. El contrato de salida es independiente del formato de origen y debe registrar fallas de extracción, tablas no interpretadas y páginas faltantes.

## 3. Entrevista contextual y autoridad

La entrevista pregunta **solo por huecos con impacto**: objetivo, actores, reglas, validaciones, errores esperados, datos conservados, comportamiento sensible y criterios de aceptación. Investigar primero los materiales disponibles; una sola pregunta por turno; respuestas libres permitidas; no exigir al usuario que reintroduzca contexto conocido.

La entrevista canónica existente usa preguntas/estado versionado, propuestas y un gateway humano independiente para confirmar ExpectedRequirements. Las acciones canónicas conocidas incluyen next, propose, correct, review, defer y resume, con procedencia y revisión. Sin gateway válido, una propuesta debe permanecer pendiente y bloquear el uso de un oráculo como «confirmado».

**Criterios:** recuperación de pregunta pendiente sin duplicarla; conservar corrección y origen; modificación del contexto invalida aprobaciones ligadas a revisiones anteriores; abstención ante falta de evidencia. Permitir diferir preguntas no esenciales y continuar con otros trabajos autorizados, sin falsear cierre de cobertura.

## 4. Contrato de multiproyecto y multitenant

Distinguir **multiproyecto** (Lendus, EXATO y otros workspaces en la misma computadora) de **multitenant de la aplicación objetivo** (clientes/tenants dentro de Lendus). Ambos son requisitos P0 de aislamiento y continuidad, pero un tenant no se deduce simplemente del nombre de una carpeta.

Cada conocimiento, autorización, ejecución y reporte debe pertenecer a un scope no ambiguo. Dimensiones mínimas propuestas para validación del contrato existente:

- ID de proyecto/workspace, raíz física canónica y aplicación.
- Entorno y política (local, dev, staging, prod).
- Tenant o contexto de organización **cuando exista y pueda acreditarse**; si es desconocido, bloquear operaciones dependientes de ese tenant.
- Perfil, rol y sesión autorizada (referencias, no secretos).
- Módulo/vista, versión de reglas, sesión/ejecución y procedencia.

**Invariantes P0:** no contaminar Knowledge, resultados, sesiones, credenciales, screenshots o autorizaciones entre scopes; no reutilizar una sesión/permiso de otro tenant; test negativos cruzados A↔B; selección de proyecto y reanudación sin redescubrimiento completo; revocación y cierre no afectan otros workspaces. No compartir Chromium activo globalmente sin modelo explícito de aislamiento de redes, cookies, storage y procesos.

**Estado actual:** existen targetPath, projectRoots, knowledgeBindings y registro qap:<proyecto>; la composición Stdio documentada admite un proyecto/manifest host. Varios registros MCP no constituyen prueba de aislamiento por tenant ni eficiencia multiproyecto. La estrategia de un servidor con varios scopes frente a varios servidores aislados queda pendiente de una decisión técnica con evidencia y benchmarks. Para MVP se prefiere aislamiento correcto sobre ahorro especulativo de procesos.

## 5. Recursos, velocidad y recuperación

Objetivo del producto: experiencia rápida al reabrir un proyecto y al cambiar entre 3–4 o más aplicaciones sin iniciar navegadores de forma permanente. Mantener conocimiento y resultados persistidos; utilizar recursos de navegador/observación solo para trabajos activos y liberar recursos y locks verificablemente.

Priorización propuesta:
1. Reutilización del inventario y documentación validada, con refresh por cambio/drift; evitar redescubrir indiscriminadamente.
2. Navegación bajo demanda y concurrencia acotada; aislamiento por browser context y verificación de cleanup.
3. Limitar cantidad de páginas, rutas, solicitudes, tiempo y memoria con presupuestos visibles y resultados parciales honestos.
4. Medir **separadamente** memoria de Node, árbol Chromium, RSS/commit del host, CPU, event-loop lag, latencias P50/P95 y tiempos de launch/close; correlacionar con número de sesiones y workspaces.
5. Solo tras observar un cuello reproducible decidir browser pooling, Workers para SQLite o cambio de lenguaje. No autorizar Rust ni pooling compartido como «solución» sin perfil y negativos de aislamiento.

**Evidencia histórica, no causalidad establecida:** E01-R5 registró CPU host hasta 100%, 107 MB de RAM libre, event-loop lag de 2231 ms y cierre Chrome de varios segundos; el R6-A careció de ejecutor reservado acreditado. No atribuir todo el consumo a QAP ni convertir métricas del equipo en memoria del proceso.

No fijar umbrales P95, concurrencia o RAM contractual hasta tomar una baseline en el equipo de entrega. Los requisitos de rendimiento del MVP se validan como ausencia de fugas obvias, límites y uso controlado, no una promesa arbitraria de <500 ms para toda operación.

## 6. Entrega funcional y compuertas de aceptación

### DEMO-01 — Investigación + ejecución documentada

Con una app técnica autorizada y después Lendus staging con consentimiento:
1. Abrir/reanudar proyecto y entorno sin mezclar otro proyecto.
2. Leer el manual o especificación disponible; inventariar módulos con procedencia.
3. Investigar el sistema autorizado, detectar y registrar coincidencias, ausencias e incertidumbres.
4. Seleccionar tarea QA y profundizar la entrevista solo donde haga falta.
5. Proponer casos verificables; pedir aprobación humana de requisitos/oráculos donde corresponda.
6. Ejecutar uno o varios casos completos con dependencias/estado compartido cuando esté disponible y autorizado.
7. Persistir PASS y FAIL físico intencional, capturas saneadas, reporte HTML/Markdown/JSON/JUnit e historia.
8. Reiniciar MCP, recuperar contexto, modificar un dato controlado y reejecutar para detectar regresión sin rehacer todo.

**GO DEMO-01:** trazabilidad fuente/regla/observación/caso/ejecución/reporte, criterio de éxito no tautológico, sin credenciales en evidencia, sin aprobación fabricada y sin contaminación de otro proyecto/tenant.

### DEMO-02 — Reproducción asistida de defecto

Recibir ticket parcial; recuperar contexto; pedir una aclaración si es imprescindible; preparar pruebas limitadas; ejecutar de forma autorizada; distinguir REPRODUCIDO, NO REPRODUCIDO y BLOQUEADO (incluso cuando el sistema técnico haya corrido sin errores). Generar pasos, capturas, registros, condiciones y grado de evidencia; conservar intento para regresión.

### Compromiso de alcance

- **P0 MVP:** servidor MCP utilizable, inventario inicial/ingesta parcial, entrevista contextual con aprobación válida, casos verificables, Runner/Reporter, reanudación y aislamiento de proyectos/tenants.
- **P1 posterior a validación MVP:** ingesta multimodal masiva, reconciliación incremental sofisticada, optimización cuantitativa y automatización amplia de detección de drift, distribución npx pulida, dashboards y reportes avanzados.
- **No GO por tests de paquete únicamente:** hace falta un recorrido real desde cliente MCP hasta evidencia y cierre humano, bajo permisos autorizados.
- **No usar Lendus para certificar capacidades sin acceso o credenciales autorizadas.** Los fixtures sintéticos prueban componentes, no aceptación sobre el sistema empresarial.

## 7. Estado técnico conocido al redactar (no inventar avances)

**GitHub vNext:** HEAD remoto al inicio del registro 2026-11-09: dda870e4695a8a27db07ea32b81c1efbbf6ba39e. Esta rama todavía no incluye necesariamente los candidatos locales.

**INT-03-R5 local, declarado por auditor:** 7a3d6dd6c189feb85d8097792ef1f0c2915e5c65. GO para continuar desarrollo; recorrido Stdio → discovery técnico → planificación → Playwright → persistencia → reporte sobre fixture; 500 PASS/12 FAIL MCP heredados; Adapter 165/165; sin GO integral ni aceptación Lendus. Aún no publicado en vNext al corte.

**DEV-MVP-02:** se ejecutaba en otra computadora, sin SHA ni resultado accesible. No asumir que terminó, que se publicó ni que cubrió descubrimiento SPA autenticado, aprobación canónica o multitenant.

**Publicado:** qap_discover canónico sigue con crawler anónimo estático, rechaza auth; ruta de entrevista canónica requiere un host gateway genuino, y qap_test impone autorizaciones explícitas. Este documento NO modifica tales contratos y no debe describir capacidades faltantes como implementadas.

**Orden seguro de integración:** recuperar informe/SHA de DEV-MVP-02; verificar su ancestro R5 y su rama; contrastar con vNext HEAD del momento y con cambios de develop; resolver superposición por contrato sin cherry-pick ciego; auditoría focal de seguridad/auth/Knowledge/ciclos de vida; Stdio real, demos y negativos de aislamiento; recién entonces GO/NO-GO y merge autorizado. **No basta con mover el SHA local a vNext.**

## 8. Decisiones humanas todavía abiertas (no bloquean esta especificación)

1. **Inventario inicial:** ¿explorar automáticamente hasta un presupuesto configurable y pedir validación de lista, o solicitar siempre primero el mapa completo a un responsable? Recomendación: exploración limitada primero + pregunta sobre faltantes.
2. **Fuentes documentales MVP:** ¿comenzar por texto/Markdown con conversión de PDF/DOCX, o exigir lectura nativa PDF/DOCX en el primer corte? Recomendación: adaptación gradual y evidencia de páginas/tablas no leídas.
3. **Identidad de tenant:** ¿se obtiene de UI/API, del perfil o se proporciona explícitamente por el QA? Recomendación: binding explícito cuando no sea observable, nunca inferir autorización.
4. **Aislamiento operativo:** ¿una instancia MCP por proyecto o un host multi-scoped? Recomendación MVP: instancias separadas si es la ruta ya acreditada; posteriormente medir y diseñar gestor unificado.
5. **Presupuestos de rendimiento:** número máximo de sesiones/browser contexts simultáneos, memoria admisible y latencias según equipo real. No prometer cifras sin medición.

Registrar respuestas futuras como nuevas revisiones de producto. No cambiar tareas históricas DONE, ni reescribir contratos de MCP o WBS de forma automática desde esta especificación.

## 9. Vínculos

- [Decisiones de producto](REQUISITOS_Y_DECISIONES.md)
- [Arquitectura objetivo](02_ARQUITECTURA_OBJETIVO_Y_CONTRATOS.md)
- [Microplanificación vNext](08_WBS_MICROTAREAS_Y_COMPUERTAS.md)
- [Auditoría de rendimiento](AUDITORIA_ARQUITECTURA_RENDIMIENTO_MVP_R7_2026-11-07.md)
- [Estado de implementación publicado](STATE.md)
