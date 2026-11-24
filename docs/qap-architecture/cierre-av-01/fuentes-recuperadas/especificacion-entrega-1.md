# Especificación Funcional Maestra de QAP — Entrega 1 de 2 (Secciones 1 a 19)

**Referencia de contexto técnico:** `Hyouka73/QAMCP`, rama `develop`, commit `30fb3a2492f9edb4f96b3b0328635ca66401c119`.

**Autoridad documental aplicada:** (1) Decisiones ratificadas por el propietario (`docs/vnext/REQUISITOS_Y_DECISIONES.md` D-001 a D-020; `docs/QAP-VISION-AUTONOMIA.md`); (2) Visión vigente de producto (`docs/QAP-VISION-AUTONOMIA.md`, que sustituye explícitamente las aprobaciones humanas por caso de `docs/qap-knowledge-lifecycle.md`); (3) Requisitos operativos vigentes (`docs/vnext/REQUISITOS_QA_MVP_OPERATIVO.md`, `docs/vnext/09_CONTRATO_EXPERIENCIA_OPERATIVA_MVP_2026-11-09.md`); (4) Necesidades funcionales verificables; (5) Propuestas del investigador etiquetadas como **`[PROPUESTA]`**; (6) Limitaciones del código actual solo como contexto.

Esta especificación se divide en dos entregas consecutivas para preservar toda la profundidad sin recortar requisitos:

* **Entrega 1 (esta respuesta):** Secciones 1 a 19 (Visión, Actores, Límites, Ciclo de Vida Completo, Mapa de Capacidades e Investigación Funcional de todos los subsistemas + Referencias comparativas del sector).
* **Entrega 2 (siguiente turno):** Secciones 20 a 30 + Matriz de Cobertura (Dominio LENDUS CORE, Catálogo Numerado de Requisitos con los 20 atributos obligatorios, Matrices de Trazabilidad y Dependencias, Métricas y análisis de umbrales 80 % / 75 %, Requisitos No Funcionales, Contradicciones y Decisiones Abiertas, Riesgos Funcionales, Casos E2E, Priorización, Preguntas para Ratificación y Matriz de Cobertura).

## 1. Visión funcional consolidada

QAP es una **plataforma de aseguramiento de calidad (QA) autónoma, universal, reutilizable y verificable**, diseñada para que una persona pueda iniciar con una petición en lenguaje natural —**«Quiero probar este sistema»**— y QAP conduzca el ciclo completo de QA (conocimiento, diseño, preparación de datos, ejecución determinista, verificación funcional, clasificación de defectos, reportería y aprendizaje continuo) con **intervención humana mínima**.

**Principios funcionales innegociables (autoridad nivel 1–2, `docs/QAP-VISION-AUTONOMIA.md` y D-001 a D-020):**

1. **Autonomía por defecto en ruta ordinaria:** tras autorizar el workspace y configurar las políticas/accesos indispensables, QAP ejecuta Discovery, priorización, diseño de escenarios, selección de oráculos sustentados, materialización, planificación, ejecución, reintentos acotados, diagnóstico y reportes sin requerir confirmación humana caso por caso (anula el contrato histórico P0 de `docs/qap-knowledge-lifecycle.md`).
2. **Interacción mínima y acotada a autoridad legítima:** QAP solo interrumpe a una persona ante autorización inicial de workspace/alcance, captura segura de credenciales, conflictos de negocio sin autoridad suficiente o bloqueos irresolubles de forma segura.
3. **Autonomía sujeta a política, nunca acceso ilimitado:** destinos, entornos, operaciones de escritura y presupuestos se autorizan por adelantado. Producción y mutaciones no autorizadas se bloquean por política sin detener el trabajo independiente permitido.
4. **Inteligencia para comprender, determinismo para ejecutar:** la IA investiga, relaciona fuentes, formula hipótesis y diagnostica; la ejecución de pruebas corre de forma determinista y reproducible sobre snapshots versionados, sin invocar un modelo por paso ni improvisar scripts externos.
5. **Integridad epistemológica (cero verdad inventada):** todo conocimiento separa estrictamente `observado`, `inferido`, `acreditado por fuente` (requisito esperado), `indeterminado` y `evaluado`. Lo visible puede sustentar oráculos estructurales; cálculos, permisos y reglas de negocio exigen fuente autoritativa.
6. **Una sola ruta canónica:** todos los canales (lenguaje natural, MCP, CLI, ejecución automática) comparten la misma política de elegibilidad, seguridad, alcance, memoria y trazabilidad.
7. **Universalidad y agnosis de dominio:** QAP no codifica lógica de un producto particular (como Lendus), ni depende de un modelo, IDE o cliente específico; soporta sistemas empresariales configurables donde una misma función cambia según entorno, tenant, rol, configuración efectiva, versión y variante visual.
8. **QA sin alteración del producto bajo prueba (D-002):** QAP detecta, reproduce, diagnostica y documenta defectos, pero nunca modifica el código fuente del sistema bajo prueba.

## 2. Actores y responsabilidades

| Actor | Naturaleza | Responsabilidades funcionales | Límites de autoridad |
| --- | --- | --- | --- |
| **Propietario / Operador de QA** | Humano | Inicia campañas en lenguaje natural, autoriza workspace/entornos/políticas de seguridad, provee fuentes documentales y credenciales por canal seguro, resuelve contradicciones de negocio y valida defectos/cierre formal cuando aplica. | Única autoridad para ampliar alcance de seguridad, autorizar mutaciones en entornos sensibles y ratificar reglas de negocio conflictivas. |
| **Desarrollador / Product Manager** | Humano | Aporta documentación, requisitos, criterios de aceptación y correcciones en el sistema bajo prueba; consume reportes de defectos y regresiones. | Fuente de verdad de negocio (cuando su documento o confirmación queda acreditado); no ejecuta bypass de políticas de QAP. |
| **QAP (Plataforma)** | Sistema | Impone seguridad y políticas de alcance; gestiona memoria persistente y planos epistemológicos; orquesta campañas, Discovery, Planner, generación de casos, Runner determinista, Oráculos, Datos sintéticos, Limpieza, Reportería y Regresión. | No inventa reglas de negocio, no amplía sus propios permisos, no altera el código del producto bajo prueba ni emite `PASS` sin evidencia verificable. |
| **Agente de IA (Host o Gestionado)** | Inteligencia externa o integrada | Interpreta intención del usuario, analiza evidencias, extrae propuestas de documentación, sugiere escenarios, formula hipótesis y diagnostica fallos. | No ejecuta pruebas por fuera de QAP, no fabrica aprobaciones ni oráculos sin fuente, no recibe ni persiste credenciales en texto plano. |
| **Cliente / Host (IDE, Chat, CLI, CI)** | Canal de interacción | Presenta la interfaz al usuario, anuncia contexto de workspace si aplica, muestra resúmenes y enlaces, y provee canal de consentimiento interactivo cuando el flujo lo exige. | No puede sustituir las compuertas de seguridad, integridad ni trazabilidad de QAP. |
| **Sistema Bajo Prueba (AUT)** | Externo | Expone interfaces (web, SPA, API, servicios), sesiones, estados, configuraciones y datos sobre los que QAP observa y valida. | Fuente de observación empírica, nunca autoridad de regla de negocio por sí solo. |

## 3. Límites del producto

**Dentro del alcance funcional de QAP:**

* Exploración y comprensión black-box de aplicaciones web tradicionales, SPAs, APIs y servicios autorizados, con enriquecimiento opcional desde documentación y repositorios permitidos (D-006, D-018).
* Memoria persistente, versionada, multi-proyecto y multi-alcance (aplicación, instancia, entorno, tenant, rol, configuración, versión, variante visual) orientada a reutilización por agentes y motores deterministas (D-005, D-013, D-019).
* Planificación basada en riesgo, generación de casos reutilizables, gestión de datasets sintéticos con limpieza controlada, ejecución determinista, evaluación mediante oráculos con testigos independientes, clasificación de defectos, reportes auditables y selección inteligente de regresiones.
* Operación en modo `HOST` (aprovechando la suscripción del cliente conectado), `MANAGED` (inteligencia administrada) y `DETERMINISTIC` (sin inferencia para repetición y regresión).

**Fuera del alcance funcional de QAP:**

* Modificar código fuente, infraestructura o configuraciones productivas del AUT (D-002).
* Sustituir al equipo de negocio para inventar reglas financieras, legales o de permisos no documentadas ni confirmadas.
* Ejecutar pruebas destructivas o mutativas sobre entornos de producción o no autorizados sin política expresa.
* Codificar lógica específica de una empresa o producto (p. ej. Lendus) dentro del núcleo universal de QAP (estas pertenecen a conectores/extensiones opt-in o documentación ingerida).
* Edición bidireccional automática de manuales corporativos en el alcance base (D-018: solo lectura y reconciliación; la escritura de manuales es evolución posterior).
* Copiar datos personales reales (PII) desde producción hacia datasets de prueba.

## 4. Ciclo de vida completo (20 escenarios obligatorios)

QAP articula su ciclo de vida en 5 macro-etapas continuas: **Inicio y Autorización → Conocimiento (Discovery + Ingesta) → Diseño y Preparación (Planner + Casos + Datos) → Ejecución y Verificación (Runner + Oráculos + Limpieza) → Diagnóstico, Reporte y Aprendizaje (Defectos + Regresión)**.

| # | Escenario | Precondiciones | Entradas | Responsabilidad de QAP y decisiones | Salidas y estados esperados | Excepciones / bloqueos |
| --- | --- | --- | --- | --- | --- | --- |
| **1** | **Aplicación completamente desconocida** | Ningún historial previo del sistema en QAP. | Petición «Quiero probar este sistema» + URL o ubicación. | Crea identidad de proyecto/aplicación en estado `nuevo`, infiere intención o pregunta una sola decisión de modo (`INVESTIGAR`, `INVESTIGAR_Y_PROBAR`, `INVESTIGAR_BUG`, `CONTINUAR`), inicia reconocimiento antes de exigir selección de módulos (D-016, D-017). | Proyecto inicializado, inventario provisional en progreso, cero suposiciones de módulos confirmados. | Destino inalcanzable o política denegada → estado `BLOCKED` con causa exacta. |
| **2** | **Identificación y autorización de workspace y entorno** | Solicitud activa; política por defecto cerrada. | Ruta de workspace, origen/URL, entorno (`local`/`dev`/`staging`/`prod`), tenant si aplica. | Verifica autorización previa para el alcance exacto; si falta, solicita **una única autorización** de workspace y política del entorno (orígenes, operaciones permitidas, presupuesto). Fija el alcance sin mezclar otros proyectos (D-019). | Grant de alcance persistido; proyecto vinculado a entorno y política efectiva. | Producción sin permiso expreso o scope ambiguo → bloqueo estricto sin degradar seguridad. |
| **3** | **Acceso autenticado seguro** | Entorno requiere autenticación o se prueban roles. | Perfil/rol objetivo; credenciales provistas por canal seguro externo al chat. | Comprueba sesión vigente; si no existe o caducó, obtiene credenciales desde bóveda/canal seguro del host, autentica (automático o handoff ante MFA/CAPTCHA), verifica sesión en ruta protegida y guarda sesión aislada por `(proyecto, entorno, tenant, rol)`. | Sesión verificada vigente; cero secretos en prompts, logs, memoria o reportes. | Credenciales inválidas, MFA no resuelta o sesión expirada → `BLOCKED_AUTH` conservando avance previo sin degradar a anónimo. |
| **4** | **Discovery de funcionalidades y flujos** | Alcance autorizado y sesión válida (si aplica). | Punto de entrada, presupuesto, frontera previa (si existe). | Explora rutas, vistas, controles, formularios, tablas, estados, navegación y tráfico observable; separa rutas detectadas, vistas inspeccionadas, bloqueadas y fuera de alcance; reanuda por lotes automáticamente hasta agotar frontera permitida. | Expediente versionado con cobertura `READY`/`PARTIAL_READY`/`BLOCKED` y candidatos de módulo como hipótesis. | Límite de presupuesto o rutas protegidas → emite `PARTIAL_READY` y avanza con lo inspeccionado. |
| **5** | **Consulta de documentación y reglas de negocio** | Fuentes autorizadas disponibles (manuales, PRD, OpenAPI, tickets). | Documentos, versiones, fechas y alcance declarado. | Extrae módulos, reglas, condiciones, fórmulas, permisos, estados y excepciones con trazabilidad exacta al origen (archivo, sección, versión). Separa texto extraído de observación real (D-018). | Inventario documental con afirmaciones trazables y registro de fragmentos no legibles. | Documento incompleto, formato no soportado o versión ambigua → registra brechas sin inventar reglas. |
| **6** | **Relación entre reglas y aplicación observada** | Existen observaciones de Discovery y afirmaciones documentales. | Expediente de Discovery + inventario documental + configuración efectiva. | Cruza cada afirmación contra la evidencia observada clasificando: *documentado y observado*, *documentado no observado* (pendiente, nunca «eliminado»), *observado no documentado* y *contradicción real*. | Mapa de reconciliación versionado; discrepancias y contradicciones marcadas para revisión. | Contradicción entre dos fuentes de igual autoridad → marca `pending_contradiction`, no elige arbitrariamente. |
| **7** | **Determinación de funcionalidades a probar** | Cobertura `READY` o `PARTIAL_READY` (no exige inventario total, D-017). | Objetivo de campaña, inventario, riesgos, dependencias, historial previo. | Prioriza flujos críticos, funcionalidades nuevas, áreas con fallos previos y dependencias de negocio dentro del presupuesto autorizado. | Alcance priorizado de campaña con justificación verificable. | Ninguna vista inspeccionada ni fuente utilizable → `BLOCKED` con acción concreta de desbloqueo. |
| **8** | **Diseño de escenarios (positivos, negativos y límites)** | Funcionalidades priorizadas y reglas/evidencia disponibles. | Vistas, formularios, reglas acreditadas, roles, configuraciones. | Diseña escenarios positivos, negativos, valores límite (BVA), clases de equivalencia, transiciones de estado, RBAC multi-rol, cálculos y manejo de errores. Clasifica cuáles tienen oráculo suficiente y cuáles quedan `INDETERMINATE`. | Catálogo de escenarios con nivel de autoridad del oráculo y trazabilidad a fuente. | Falta regla de negocio para un escenario → lo excluye como `INDETERMINATE` y continúa con los demás. |
| **9** | **Preparación de datos de prueba** | Escenarios diseñados y política de escritura/datos del entorno. | Requisitos de datos, dependencias de entidades, tenant/configuración. | Genera o selecciona datasets sintéticos aislados por ejecución, respetando grafo de dependencias y caducidad; prohíbe copiar PII de producción. | Dataset versionado con ID de ejecución, procedencia y plan de limpieza asociado. | Entorno read-only requiere mutación de datos → bloquea solo casos dependientes (`SKIPPED_BY_POLICY`). |
| **10** | **Materialización de pruebas reutilizables** | Escenarios con oráculo válido y datos definidos. | Escenarios, expectativas verificables, controles observados, adaptadores. | Separa identidad funcional del caso (objetivo, requisitos, semántica del oráculo) de la revisión ejecutable (pasos tipados, localizadores, datos). Valida integridad antes de congelar snapshot. | Casos versionados con huella única, listos para ejecución determinista sin modelo por paso. | Oráculo sin sustento o pasos prohibidos por política → impide materialización ejecutable y registra motivo. |
| **11** | **Planificación y ejecución de pruebas** | Casos materializados, plan congelado, entorno/sesión vigentes. | Plan de ejecución, presupuesto, concurrencia permitida. | Ordena por dependencias (DAG), aísla cada caso en contexto limpio con sesión controlada, ejecuta pasos deterministas, aplica timeouts y reintentos seguros solo donde no haya riesgo de duplicación. | Intentos registrados con estado técnico, tiempos, trazas y artefactos sanitizados. | Fallo de infraestructura/sesión caducada → detiene grupo afectado como `ERROR`/`BLOCKED_AUTH` sin emitir `FAIL` falso. |
| **12** | **Verificación de efectos funcionales reales** | Ejecución completada y evidencias capturadas. | Respuestas, estados DOM, persistencia/API/contabilidad/testigos independientes, oráculo. | Evalúa expectativa contra testigos independientes (no solo HTTP 2xx ni ausencia de excepción); distingue `PASS`, `FAIL`, `INDETERMINATE`, `BLOCKED`, `SKIPPED` y `ERROR`. | Veredicto formal vinculado a caso, revisión, intento, oráculo y evidencias. | Testigo único es el mismo componente bajo prueba → rebaja confianza o marca `INDETERMINATE` según criticidad del oráculo. |
| **13** | **Detección, clasificación y documentación de defectos** | Resultado `FAIL` o discrepancia funcional reproducible. | Intentos, evidencias, expectativas, logs, historial previo. | Clasifica causa raíz probable (defecto de producto, entorno, automatización, datos, sesión, intermitencia o `indeterminate` — D-014); agrupa por firma, evita duplicados y construye paquete reproducible. | Registro de defecto con severidad, prioridad, pasos, esperado, observado, alcance y evidencias. | Evidencia ambigua (p. ej. solo HTTP 500 sin contexto) → clasifica `indeterminate` y sugiere comprobaciones. |
| **14** | **Generación de evidencia y reportes** | Intentos finalizados o campaña pausada/cerrada. | Resultados, artefactos sanitizados, cobertura, brechas, defectos. | Produce reportes auditables por campaña, módulo, alcance y comparación histórica; verifica integridad de artefactos y excluye secretos; comunica explícitamente cobertura incompleta. | Reportes navegables y estructurados con enlaces verificables a evidencias. | Artefacto faltante (p. ej. video) → conserva veredicto y señala degradación de evidencia sin corromper reporte. |
| **15** | **Aprendizaje y actualización de conocimiento** | Ejecución, diagnóstico o nueva fuente concluida. | Nuevas observaciones, firmas de fallo, latencias, relaciones, confirmaciones. | Incorpora nuevas observaciones e hipótesis en su plano correspondiente sin sobrescribir requisitos confirmados ni historial; actualiza vigencia y relaciones de impacto. | Memoria enriquecida con nueva revisión y procedencia trazable. | Observación contradice regla confirmada → registra discrepancia, nunca promueve observación a regla. |
| **16** | **Repetición de pruebas existentes sin redescubrimiento** | Casos y snapshot vigentes en memoria; entorno/sesión válidos. | Solicitud de repetición o regresión directa. | Ejecuta en modo `DETERMINISTIC` reutilizando identidad y versión del caso sin re-explorar ni invocar IA; crea un nuevo intento independiente comparable con anteriores. | Nuevo intento comparable; consumo de inferencia = 0. | Cambio de entorno/regla invalida snapshot → señala obsolescencia y solicita actualización selectiva. |
| **17** | **Detección de cambios en aplicación conocida** | Conocimiento previo existente para el alcance. | Nueva observación, nueva versión, cambio de DOM/API/configuración/reglas. | Detecta drift estructural, funcional o de configuración; identifica entidades afectadas e invalida solo el subconjunto impactado conservando historial. | Lista de cambios detectados, conocimiento marcado como obsoleto/revisable y brechas de adaptación. | Cambio silencioso en selector → permite reparación acotada en **nueva revisión** sin alterar expectativa funcional. |
| **18** | **Selección de regresiones relevantes** | Cambios detectados o solicitud de regresión acotada. | Mapa de impacto, dependencias, historial de defectos, riesgo, presupuesto. | Selecciona suite mínima de alto valor (casos directamente afectados, dependientes en DAG, históricos de alto riesgo y smoke crítico) priorizada por riesgo. | Plan de regresión focalizado con justificación de inclusión/exclusión. | Sin mapa de impacto acreditado → recurre a suite crítica base y reporta limitación de cobertura. |
| **19** | **Recuperación de campañas interrumpidas** | Cierre abrupto, reinicio del host, desconexión de modelo o caducidad de sesión. | Checkpoints persistidos, estado de tareas, publicaciones pendientes. | Reconstruye estado exacto de campaña, reconcilia publicaciones a medias, verifica si hubo mutaciones antes de reintentar y reanuda desde la última unidad incompleta sin duplicar trabajo terminado. | Campaña reanudada con continuidad total e idempotencia preservada. | Mutación en estado incierto → reconcilia estado real antes de decidir reintento o bloqueo seguro. |
| **20** | **Operación multi-cliente, multi-modelo y multi-entorno** | Múltiples clientes (MCP/CLI/CI), modelos o proyectos en la misma máquina. | Invocaciones desde distintos clientes o entornos autorizados. | Aplica idénticas reglas de seguridad, memoria, elegibilidad y trazabilidad en cualquier canal; mantiene aislamiento estricto entre proyectos, entornos y tenants (D-019). | Comportamiento consistente independientemente del cliente; cero fuga entre scopes. | Cliente sin capacidades interactivas (p. ej. sin formularios) → nunca bloquea ruta ordinaria; deriva a política previa o canal alternativo. |

## 5. Mapa de capacidades funcionales

| Dominio | Capacidades núcleo (MVP Autónomo) | Capacidades de profundidad empresarial (P1) | Capacidades de escala y autoevolución (P2 / P3) |
| --- | --- | --- | --- |
| **Memoria y Conocimiento** | Planos epistemológicos separados; persistencia versionada multi-proyecto/entorno/tenant; recuperación contextual; aislamiento de sesiones/secretos. | Catálogo de configuración efectiva; mapa de dependencias e impacto; detección de contradicciones y obsolescencia; portabilidad (export/import). | Aprendizaje histórico de flakiness y firmas de fallo; retención/archivado corporativo; colaboración multiusuario controlada. |
| **Discovery e Ingesta** | Exploración black-box read-only con frontera reanudable (`READY`/`PARTIAL_READY`/`BLOCKED`); ingesta texto/Markdown con reconciliación. | Exploración SPA profunda (tablas, filtros, paginación, formularios, estados, flujos multi-paso); APIs/servicios; roles múltiples; formatos complejos (PDF/DOCX vía adaptador acreditado). | Descubrimiento incremental guiado por drift; comparativa entre versiones, instancias y variantes visuales. |
| **Inteligencia y Agentes** | Modo `HOST` (suscripción existente) y `DETERMINISTIC`; propuestas estructuradas; validación determinista de decisiones del agente. | Recuperación automática ante desconexión/pérdida de contexto; presupuesto de inferencia por campaña; modo `MANAGED` opcional. | Diagnóstico agrupado por firma de fallo; reparación acotada de adaptadores/localizadores en nueva revisión. |
| **Planner y Casos** | Priorización inicial; casos estructurales basados en evidencia; materialización reutilizable sin aprobación humana rutinaria. | Escenarios positivos/negativos/BVA/RBAC/cálculos/E2E multi-módulo; separación identidad funcional vs revisión ejecutable; variantes UI. | Selección de regresión basada en impacto y riesgo; adaptación dinámica del plan ante hallazgos en caliente. |
| **Oráculos y Datos** | Oráculos estructurales desde evidencia; exclusión honesta (`INDETERMINATE`) si falta fuente; datos sintéticos en fixtures aislados. | Oráculos de negocio (reglas, persistencia, cálculos monetarios, conciliaciones, RBAC, asíncronos); testigos independientes; datasets sintéticos con DAG de dependencias y limpieza autorizada. | Oráculos condicionales por configuración efectiva (`es_contable`, etc.); clonado seguro de configuraciones sin PII. |
| **Runner, Campañas y Reportes** | Ejecución determinista aislada por caso; evidencias sanitizadas (capturas, trazas, video, logs); recuperación tras reinicio; reportes verificables. | Ejecución paralela controlada; mutaciones autorizadas con idempotencia y reconciliación; detección y clasificación de defectos; comparación entre ejecuciones. | Ejecución masiva económica; dashboards comparativos por campaña/sistema; integraciones externas opt-in. |
| **Seguridad e Interfaces** | Autorización inicial de workspace/alcance; política previa de destinos/operaciones; secretos fuera del chat; coherencia MCP/CLI. | Permisos granulares por alcance/rol/operación; revocación inmediata con cancelación activa; auditoría completa. | Controles empresariales multi-equipo; ecosistema de conectores/extensiones opt-in (p. ej. extensión Lendus separada). |

## 6. Investigación funcional: Memoria, conocimiento y aprendizaje (Subsistema 4.1)

### 6.1 Modelo conceptual funcional de memoria

La memoria de QAP se organiza en **cuatro planos epistemológicos ortogonales** (D-011) combinados con **dimensiones contextuales de alcance** (D-013, D-019) y **tres horizontes de temporalidad**:

1. **Planos epistemológicos (separación inviolable):**
* **Plano 1 — Observación (`OBSERVED`):** hechos empíricos capturados directamente en una fecha y alcance (rutas, DOM, respuestas HTTP, payloads API, estados visibles, mensajes de error, tiempos). Siempre inmutables (solo anexión).
* **Plano 2 — Inferencia (`INFERRED`):** hipótesis generadas por IA o heurísticas a partir de observaciones o documentos (agrupación en módulos, propósito inferido, relación entre pantallas, causa probable de un fallo). Siempre llevan puntaje o nivel de confianza, evidencia soporte y estado de revisión.
* **Plano 3 — Requisito Esperado (`EXPECTED_REQUIREMENT`):** especificación autoritativa de cómo *debe* comportarse el sistema, respaldada por una fuente acreditada (documento formal vigente, confirmación humana autorizada, contrato API oficial). Nunca nace automáticamente de una observación ni de una sonda activa.
* **Plano 4 — Evaluación de Conformidad (`ASSESSMENT`):** veredicto resultante de contrastar una observación ejecutada contra un requisito esperado o un oráculo estructural, en un intento, alcance y revisión concretos (`PASS`, `FAIL`, `CONTRADICTION`, `INDETERMINATE`, `BLOCKED`).


2. **Horizontes de temporalidad:**
* **Memoria operativa efímera (sesión/campaña):** frontera activa de Discovery, checkpoints de tareas, contexto conversacional resumido, bloqueos temporales.
* **Memoria de proyecto y ejecución:** planes congelados, datasets activos, intentos, evidencias, defectos abiertos, historial de campañas.
* **Conocimiento persistente de aplicación:** catálogo versionado de módulos, vistas, capacidades, flujos, reglas, configuraciones efectivas, dependencias y patrones aprendidos, reutilizable entre campañas y sesiones.



### 6.2 Catálogo conceptual de entidades y relaciones

| Entidad conceptual | Qué representa | Dimensiones de alcance obligatorias | Relaciones clave |
| --- | --- | --- | --- |
| **Proyecto / Workspace** | Contenedor lógico de trabajo aislado en una máquina o equipo. | `project_id`, identidad de workspace. | Contiene `Aplicación`, `Campaña`, `Política de Seguridad`. |
| **Aplicación** | Producto de software compartido (p. ej. sistema de crédito, ERP). | `application_id`. | Tiene 1..N `Instancia`, `Módulo`, `Versión de Producto`, `Fuente Documental`. |
| **Instancia / Despliegue** | Despliegue concreto de una aplicación con su infraestructura y configuración. | `application_id`, `instance_id`, `product_version`. | Asociada a `Entorno` y `Configuración Efectiva`. |
| **Entorno** | Contexto operativo (`local`, `dev`, `staging`, `prod`) con política de seguridad. | `project_id`, `instance_id`, `env_id`, `policy_revision`. | Gobierna permisos de observación, escritura, datos y presupuestos. |
| **Tenant / Organización** | Partición lógica de negocio dentro de una aplicación multitenant. | `env_id`, `tenant_id` (o `single_tenant` explícito). | Acota `Configuración Efectiva`, `Perfil/Rol`, `Observación`, `Regla` y `Resultado`. |
| **Rol y Perfil de Acceso** | Identidad funcional (rol/permisos) y referencia de sesión (nunca el secreto). | `env_id`, `tenant_id`, `role_id`, `profile_ref`. | Condiciona visibilidad de `Vista`, `Capacidad` y aplicabilidad de `Regla`. |
| **Configuración Efectiva** | Parámetros, flags o activaciones (p. ej. `es_contable = true`) que alteran comportamiento. | `instance_id`, `env_id`, `tenant_id`, `effective_date`, `source`. | Condiciona `Aplicabilidad` (`applicable`, `not_applicable`, `indeterminate`) de `Regla` y `Caso`. |
| **Fuente Primaria** | Documento, manual, especificación API, ticket, repositorio o confirmación humana. | `source_id`, tipo, versión, fecha de vigencia, nivel de autoridad. | Sustenta `Requisito Esperado` y `Afirmación Documental`. |
| **Módulo / Capacidad** | Agrupación funcional (candidata si inferida; acreditada si confirmada) y operaciones disponibles. | `application_id`, `scope`, estado (`candidate`/`accredited`). | Agrupa `Vista`, `Ruta`, `Flujo`, `Regla`; participa en grafo `Dependencia`. |
| **Vista / Ruta / Control** | Pantalla/endpoint observable, elementos interactivos, formularios, tablas y variantes visuales. | `env_id`, `tenant_id`, `role_id`, `product_version`, `visual_variant`. | Referencia `Observación` y `Evidencia`; separada de `Requisito`. |
| **Flujo de Negocio** | Secuencia multi-paso o multi-módulo con precondiciones, estados y efectos. | `application_id`, `scope`, `version`. | Compuesto por `Vista`/`Operación`; vinculado a `Dependencia` y `Caso`. |
| **Regla / Requisito** | Regla de negocio, fórmula, permiso, validación o restricción versionada. | `scope` (env, tenant, role, config), `authority_level`, `revision`, `validity_window`. | Respaldado por `Fuente Primaria`; genera `Oráculo`; puede tener `Contradicción`. |
| **Hipótesis / Inferencia** | Conclusión provisional del agente con nivel de confianza y justificación. | `scope`, `confidence`, `status` (`pending`/`confirmed`/`refuted`/`stale`). | Enlaza `Observación` y `Fuente Primaria`; nunca se auto-promueve a requisito. |
| **Contradicción / Discrepancia** | Conflicto entre dos fuentes o entre fuente acreditada y observación real. | `scope`, `conflict_type`, `status` (`open`/`resolved`/`deferred`). | Vincula 2..N entidades en conflicto y su `Decisión de Resolución`. |
| **Caso de Prueba (Identidad + Revisión)** | Identidad funcional estable + revisiones ejecutables (pasos, localizadores, adaptador). | `application_id`, `scope`, `case_id`, `revision`, `applicability`. | Enlaza `Requisito`, `Oráculo`, `Dataset` y `Intento`. |
| **Campaña / Plan / Tarea** | Unidad autónoma de trabajo QA con presupuesto, estado, checkpoints y dependencias. | `project_id`, `env_id`, `campaign_id`, `status`. | Coordina `Discovery`, `Plan de Ejecución`, `Intento` y `Reporte`. |
| **Intento y Evidencia** | Ejecución individual inmutable con veredicto, aserciones y artefactos sanitizados. | `attempt_id`, `case_id`, `revision`, `scope`, `timestamp`. | Produce `Evaluación de Conformidad`, `Defecto` y `Aprendizaje`. |
| **Defecto** | Discrepancia funcional o fallo clasificado, deduplicado por firma y rastreable en el tiempo. | `defect_id`, `scope`, `severity`, `status`, `root_cause_category`. | Vincula `Intento`, `Caso`, `Requisito`, `Evidencia` y `Verificación de Corrección`. |

### 6.3 Ciclos de vida, reglas de autoridad y manejo de anomalías de memoria

* **Ciclo de vida de una entidad de conocimiento:** `adquirida (observed/inferred)` → `vigente / acreditada` (si aplica por autoridad) → `en_conflicto` (ante contradicción) o `obsoleta / stale` (ante cambio detectado o caducidad) → `archivada / sustituida` (nunca destruida si existen intentos históricos que la referencien).
* **Reglas de autoridad y precedencia:**
1. Confirmación humana con autoridad de negocio > Especificación formal vigente de alcance exacto > Especificación formal general compatible > Edición manual histórica (`manually_edited`, D-012, sujeta a revisión ante cambio) > Inferencia de agente > Observación empírica (solo autoridad estructural, nunca de negocio).
2. El alcance más específico `(entorno + tenant + rol + configuración + versión)` prevalece sobre un alcance genérico si proviene de fuente acreditada.


* **Comportamiento obligatorio ante situaciones límite:**
* **Dos fuentes se contradicen:** conservar ambas con su procedencia; si una tiene mayor autoridad o especificidad acreditada, aplicarla registrando la desplazada; si tienen igual autoridad y especificidad, marcar `CONFLICTO_ABIERTO`, abstenerse de generar oráculo ejecutable para esa regla y solicitar resolución humana puntual sin detener el resto de la campaña.
* **Una regla cambia:** crear una nueva revisión del requisito, invalidar únicamente los casos y planes ligados a la revisión previa, preservar íntegros los resultados históricos bajo la regla anterior.
* **Una función desaparece:** si deja de observarse en un alcance, registrar `no_observada_en_alcance` (puede ser permiso, configuración o eliminación real); marcar casos afectados para verificación antes de declararla eliminada.
* **Observación desactualizada:** marcar como `stale` cuando cambia versión de producto, revisión de configuración o firma estructural; gatillar refresco focalizado únicamente sobre lo afectado.
* **Conocimiento insuficiente:** declarar explícitamente el hueco, emitir `INDETERMINATE` o solicitar investigación adicional; prohibido rellenar vacíos con suposiciones presentadas como hechos.


* **Consultas funcionales obligatorias:** recuperación contextual por intención y alcance para agentes de IA; búsqueda por módulo/ruta/control/regla/defecto; trazabilidad inversa (de defecto → intento → caso → requisito → fuente); detección de impacto por cambio de entidad; consulta de historial sin mutación; exportación/importación portable (excluyendo secretos y sesiones) y eliminación/retención controlada aislada por proyecto.

## 7. Investigación funcional: Discovery y comprensión de aplicaciones (Subsistema 4.2)

* **Qué debe explorar QAP:**
* **Web tradicional y SPA:** rutas del servidor, enrutamiento cliente (history/hash), renderizado dinámico, cargas diferidas, estados de carga y navegación condicional.
* **APIs y servicios:** contratos explícitos (si existen) y tráfico observable de lectura/operaciones en sesiones autorizadas, correlacionando llamadas de red con vistas y acciones de UI.
* **Aplicaciones autenticadas:** detección de barreras de login, sesiones por rol/tenant, diferencias de navegación y visibilidad entre perfiles sin inferir inexistencia desde un `403`.
* **Componentes complejos:** formularios (campos, tipos, obligatoriedad, validaciones cliente/servidor, dependencias entre campos), tablas (columnas, ordenamiento, filtros, búsqueda, paginación, estados vacíos), modales, procesos multi-paso (wizards), estados y transiciones, interacciones asíncronas (colas, polling, notificaciones), mensajes de error y variantes visuales.
* **Configuraciones y dependencias:** detectar configuraciones observables que alteran módulos/controles y distinguir aristas de navegación (enlace A→B) de dependencias de negocio (operación A afecta estado de B, que requiere fuente o evidencia de efecto).


* **Niveles diferenciados de conocimiento (prohibido mezclarlos):**
1. *Ruta detectada* (enlace o referencia encontrada, aún sin visitar).
2. *Vista inspeccionada* (cargada con evidencia verificable de estado, estructura y controles en un alcance).
3. *Interacción observada* (respuesta concreta ante un estímulo controlado no destructivo).
4. *Capacidad inferida* (hipótesis de propósito o flujo funcional).
5. *Regla acreditada* (expectativa respaldada por fuente autoritativa).


* **Criterios de «funcionalidad descubierta» y cobertura:** una funcionalidad solo se declara descubierta cuando existen vistas inspeccionadas con evidencia de controles/estados en el alcance vigente. Cobertura honesta en tres estados: `BLOCKED` (sin acceso o sin vistas inspeccionadas), `PARTIAL_READY` (vistas inspeccionadas con frontera pendiente/bloqueada/limitada) y `READY` (frontera autorizada inspeccionada dentro de límites sin brechas de adquisición).
* **Reanudación y anti-redescubrimiento:** Discovery mantiene frontera persistente y checkpoints por alcance `(proyecto, entorno, tenant, rol, versión)`. Al reanudar tras pausa, reinicio o nueva campaña, reutiliza vistas vigentes y explora únicamente rutas pendientes o afectadas por cambio/drift.

## 8. Investigación funcional: Ingesta y comprensión de documentación (Subsistema 4.3)

* **Fuentes soportadas conceptualmente:** especificaciones de requisitos, manuales de usuario y operación (caso prioritario: manuales empresariales extensos como el de Lendus), historias de usuario, tickets de defectos, contratos de API y documentación técnica autorizada.
* **Extracción estructurada obligatoria:** de cada fuente autorizada, QAP debe extraer afirmaciones individuales sobre módulos, vistas, procesos, reglas de negocio, condiciones de aplicabilidad, fórmulas de cálculo, matriz de permisos por rol, excepciones, mensajes esperados y relaciones entre procesos.
* **Metadatos mínimos de procedencia por afirmación:** identificador de fuente, localizador exacto (archivo, sección, página o párrafo), versión del documento, fecha de publicación/vigencia, alcance declarado (entorno, tenant, rol, producto/subproducto, configuración) y fecha de ingesta.
* **Manejo de imperfecciones documentales:**
* *Ambigua:* registrar interpretación tentativa como `inferencia` y marcar ambigüedad; no construir oráculo determinista sin aclaración.
* *Contradictoria (intra-documento o inter-documentos):* conservar ambas afirmaciones y abrir conflicto de autoridad.
* *Incompleta o con formatos no legibles (p. ej. tablas complejas, imágenes, páginas omitidas):* registrar explícitamente qué secciones no pudieron extraerse sin simular lectura completa (D-018).
* *Obsoleta:* comparar fecha/versión contra la versión desplegada y contra observaciones reales; marcar para revisión.


* **Separación entre comprensión y autoridad:** comprender una afirmación permite proponer hipótesis y escenarios; convertirla en **oráculo de negocio** exige que la fuente esté acreditada como vigente y aplicable al alcance en prueba.

## 9. Investigación funcional: Inteligencia artificial, agentes y referencias del sector (Subsistema 4.4 y Sección 9)

### 9.1 Separación funcional de responsabilidades

QAP separa cuatro funciones que nunca deben colapsarse en un mismo acto no controlado:

1. **Razonamiento (IA):** investigar evidencias, interpretar documentos, proponer escenarios, formular hipótesis, sugerir diagnósticos y proponer reparaciones de localizadores.
2. **Orquestación (QAP):** decidir qué etapa/tarea corresponde, aplicar políticas y presupuestos, gestionar checkpoints, dependencias y recuperaciones.
3. **Ejecución (QAP Determinista):** ejecutar pasos tipados sobre snapshots congelados mediante el runner oficial y recolectar evidencias reproducibles (0 llamadas a IA por paso).
4. **Evaluación (QAP Oráculos):** contrastar evidencias contra expectativas acreditadas y emitir veredictos formales auditables.

### 9.2 Modos de inteligencia (`HOST`, `MANAGED`, `DETERMINISTIC`)

* **Modo `HOST` (predeterminado en uso local):** utiliza el modelo del cliente conectado (p. ej. IDE o chat con suscripción existente del usuario, Principio 8) para razonamiento y propuestas estructuradas, mientras QAP retiene control de políticas, memoria, ejecución y veredictos. No exige contratar una segunda API de modelos.
* **Modo `MANAGED` (`[PROPUESTA]` funcional para operación autónoma sin cliente interactivo):** permite que QAP invoque un proveedor de razonamiento configurado por el propietario para campañas programadas o desatendidas, sujeto a los mismos contratos de propuestas estructuradas y presupuestos de tokens/tiempo.
* **Modo `DETERMINISTIC`:** opera sin ninguna llamada a modelo (consumo de inferencia = 0). Cubre repetición de pruebas, suites de regresión ya materializadas, verificación de evidencias y generación de reportes.

### 9.3 Resiliencia ante fallos del modelo o del host

* **Desconexión o pérdida de contexto del modelo:** toda la memoria operativa, checkpoints, tareas pendientes y estado de campaña residen en QAP, no en la ventana de chat; un nuevo chat o modelo reconectado recupera contexto estructurado y continúa sin reiniciar.
* **Agotamiento de presupuesto/cuota:** QAP detiene limpiamente la generación de nuevas propuestas, conserva el progreso y continúa ejecutando el trabajo determinista ya planificado.
* **Propuesta incorrecta o fuera de contrato:** QAP valida toda propuesta de la IA (esquema, procedencia del oráculo, política de seguridad, existencia de evidencia) antes de aceptarla; rechaza propuestas inválidas con diagnóstico preciso sin corromper la memoria.
* **Intento de escape a herramientas externas:** QAP no reconoce como `PASS` oficial ningún resultado producido por scripts externos o ejecuciones improvisadas fuera de su ruta canónica (Principio 6).

### 9.4 Investigación comparativa y referencias del sector

*Nota: se distinguen hechos publicados de interpretaciones funcionales aplicables a QAP.*

* **Estándar [ISO/IEC/IEEE 29119](https://committee.iso.org/sites/jtc1sc7/home/projects/flagship-standards/isoiecieee-29119-series.html) (Partes 1–5, [IEEE 29119-1-2021](https://standards.ieee.org/ieee/29119-1/10779/)):** *Hecho publicado:* separa explícitamente procesos de prueba (Parte 2), documentación de prueba (Parte 3), técnicas de diseño basadas en especificación y estructura (Parte 4: equivalencia, BVA, tablas de decisión, transición de estados) y pruebas basadas en palabras clave (Parte 5). *Interpretación para QAP:* respalda separar el plan de campaña, el plan de ejecución, la identidad lógica del caso y los pasos tipados reutilizables.
* **Problema del oráculo en [ISTQB CT-AI v2.0](https://istqb.org/certifications/certified-tester-ai-testing-ct-ai/) y [ISTQB CTAL-TA](https://trustedinstitute.com/concept/istqb-ctal-ta/test-analyst-in-the-test-process/solutions-to-the-test-oracle-problem/):** *Hecho publicado:* clasifica oráculos en especificados, derivados, implícitos y proxy/humanos, y destaca que sin oráculo válido un caso puede ejecutarse pero no evaluarse; además, prácticas recientes de aseguramiento de agentes ([TestMu AI](https://www.testmuai.com/blog/ai-test-oracle-problem/)) mantienen explícitamente el resultado *Unable to Verify* separado del *pass rate* para no inflar falsamente el porcentaje de aprobación. *Interpretación para QAP:* justifica exigir `INDETERMINATE` como estado de primera clase y nunca mezclar casos sin oráculo en `PASS`.
* **Patrón de agentes de prueba ([Playwright Test Agents](https://playwright.dev/docs/test-agents) y [análisis del sector](https://bug0.com/blog/playwright-test-agents)):** *Hecho publicado:* descompone la automatización asistida por IA en tres roles (*Planner*, *Generator*, *Healer*) que convierten intención en planes y pruebas reproducibles y reparan localizadores rotos ante cambios de UI. *Interpretación para QAP:* el patrón valida separar planificación, materialización y reparación acotada, pero evidencia un riesgo conocido en el sector: un *healer* sin gobierno epistemológico puede «reparar» una aserción ocultando un defecto real de negocio; por ello QAP impone que toda reparación cree nueva revisión y nunca altere la expectativa funcional.
* **Inspiración declarada por el propietario (`docs/QAP-VISION-AUTONOMIA.md`):** TestSprite como referencia de experiencia autónoma de extremo a extremo, buscando superarla en extensibilidad agnóstica, reutilización persistente de conocimiento y control de costo de inferencia sin copiar su implementación.

## 10. Investigación funcional: Planner y estrategia de pruebas (Subsistema 4.5)

* **Distinción obligatoria entre cuatro artefactos:**
1. **Plan de Campaña:** objetivo global, alcance (aplicación, entornos, tenants, roles), estrategia de cobertura, riesgos, presupuesto total y criterios de parada.
2. **Plan de Ejecución:** conjunto congelado y ordenado (DAG) de revisiones concretas de casos elegibles para correr en un entorno y momento específicos.
3. **Plan de Datos:** datasets sintéticos requeridos, orden de creación por dependencias, aislamiento y estrategia de limpieza/reversión.
4. **Caso de Prueba:** unidad verificable con identidad funcional, revisión ejecutable y oráculo.


* **Capacidades obligatorias del Planner:**
* Priorizar por criticidad de negocio, riesgo de cambio, historial de defectos y dependencias funcionales.
* Seleccionar perfiles, roles y combinaciones de configuración efectiva relevantes (evitando explosión combinatoria mediante selección por riesgo y cobertura mínima acreditada).
* Respetar restricciones del entorno (solo lectura vs escritura autorizada) y presupuestos de tiempo, páginas y recursos.
* Orquestar pruebas end-to-end y multi-módulo resolviendo dependencias explícitas entre casos y transferencia controlada de datos generados.
* Seleccionar suites de regresión ante cambios y adaptar dinámicamente el plan restante cuando un hallazgo nuevo revela un riesgo crítico o un bloqueo de prerrequisito.


* **Versionado y verificación de cumplimiento:** cada plan conserva versión, huella del conjunto de casos y alcance; un cambio en reglas, configuración o casos invalida el plan previo para nuevas ejecuciones sin alterar el historial de planes ya ejecutados. El cumplimiento reporta planificado vs ejecutado vs bloqueado vs excluido.

## 11. Investigación funcional: Generación y gestión de casos (Subsistema 4.6)

* **Tipos de escenarios que QAP debe poder generar:** positivos (camino feliz), negativos (entradas inválidas, errores controlados), valores límite (BVA), particiones de equivalencia, transiciones de estados, permisos y aislamiento RBAC/multitenant, integraciones entre módulos/servicios, cálculos y fórmulas de negocio, manejo de errores/timeouts y regresión focalizada.
* **Separación de identidad y revisión (contrato reutilizable):**
* *Identidad funcional estable:* objetivo de prueba, requisitos versionados que valida, precondiciones lógicas, semántica del oráculo y criterios de aplicabilidad (entorno, rol, tenant, configuración).
* *Revisión ejecutable:* pasos tipados concretos, adaptadores de interfaz, localizadores verificables, datos de entrada y expectativas técnicas derivadas. Una variante visual o un cambio de selector genera una nueva revisión ejecutable sin perder la identidad ni el historial del caso.


* **Reglas de generación automática vs abstención:**
* QAP genera automáticamente casos ejecutables cuando existen controles/vistas inspeccionados y un oráculo estructural sustentado en evidencia o un requisito de negocio acreditado.
* QAP **se abstiene** (o marca el caso como candidato `INDETERMINATE` no ejecutable para `PASS`) cuando la expectativa de negocio no tiene fuente acreditada o existe un conflicto abierto de autoridad.


* **Gestión del ciclo de vida de casos:** detección de duplicados semánticos y técnicos, versionado inmutable, marcado de obsolescencia cuando cambia una regla o vista, evaluación automática de aplicabilidad (`applicable`, `not_applicable`, `indeterminate`) según configuración/rol/entorno y compatibilidad entre variantes de UI.

## 12. Investigación funcional: Oráculos y validación funcional (Subsistema 4.7)

Esta es la pieza crítica que impide falsos positivos y garantiza credibilidad de QAP.

### 12.1 Taxonomía de oráculos requeridos

1. **Oráculos estructurales (basados en evidencia):** carga válida de vista, presencia/estado de controles, ausencia de errores fatales no esperados, estructura de respuestas y navegación coherente.
2. **Oráculos de reglas de negocio:** validaciones de dominio, flujos condicionales, reglas parametrizadas por configuración efectiva (p. ej. `es_contable`), restricciones de negocio.
3. **Oráculos de persistencia y estado:** verificación de que una operación realmente creó, modificó o eliminó el registro esperado y transitó al estado correcto tras recargar o consultar por otro canal.
4. **Oráculos de cálculo y conciliación:** precisión monetaria, redondeos, intereses, comisiones, calendarios, saldos, totales agregados y cuadre entre módulos (p. ej. operación vs cartera vs contabilidad).
5. **Oráculos de permisos y ausencia de efectos no autorizados:** verificar no solo que una acción se deniega (`403`/mensaje), sino que el estado subyacente **no cambió**.
6. **Oráculos temporales y asíncronos:** convergencia eventual dentro de ventanas temporales acotadas, estados intermedios y finales, idempotencia ante reintentos y orden de eventos.
7. **Oráculos multi-servicio:** consistencia entre UI, API, eventos/colas y servicios dependientes.

### 12.2 Taxonomía estricta de veredictos

| Veredicto | Significado funcional exacto | ¿Cuenta como éxito? |
| --- | --- | --- |
| **`PASS`** | Todos los pasos y aserciones del oráculo acreditado se ejecutaron y fueron corroborados por evidencia verificable e independiente del alcance. | Sí |
| **`FAIL`** | La ejecución técnica se completó con precondiciones válidas y la evidencia observada contradice una expectativa acreditada. | No (abre análisis de defecto) |
| **`INDETERMINATE`** | La acción se ejecutó (o intentó evaluarse), pero falta fuente de autoridad, hay conflicto de reglas o la evidencia es ambigua/insuficiente para afirmar conformidad o defecto (D-014). | No (excluido del `PASS rate`) |
| **`BLOCKED`** | No pudo ejecutarse por precondición insatisfecha, falta de acceso/sesión caducada, dependencia fallida o falta de autorización. | No |
| **`SKIPPED`** | Excluido deliberadamente por política de entorno (`SKIPPED_BY_POLICY`), no aplicabilidad por configuración/rol (`not_applicable`) o alcance de campaña. | No |
| **`ERROR` (Error técnico)** | Fallo de infraestructura, caída de navegador, timeout de red del runner o error interno de automatización que impide evaluar el sistema. | No (no se reporta como `FAIL` de producto) |

### 12.3 Independencia de testigos y prevención del problema «HTTP 201 sin persistencia»

* **Niveles de independencia de testigos:**
* *Nivel 0 (insuficiente para mutaciones):* ausencia de excepción o código HTTP `2xx` aislado.
* *Nivel 1 (básico/estructural):* confirmación visible inmediata en la misma vista (toast/banner/DOM).
* *Nivel 2 (verificación post-recarga o lectura secundaria):* consultar la entidad en una vista distinta, tras recargar en contexto limpio o mediante endpoint de lectura independiente.
* *Nivel 3 (corroboración multi-fuente / conciliación):* verificar efecto en registros derivados, estados de cartera, saldos, movimientos contables o auditoría del sistema.


* **Cómo evita QAP el falso `PASS` ante «HTTP 201 que no guarda nada»:** toda prueba de operación mutativa con efecto persistente exige funcionalmente **al menos Nivel 2** (lectura independiente posterior o verificación de cambio de estado persistido); recibir `HTTP 201` o un mensaje de éxito en pantalla sin comprobación posterior de persistencia **nunca puede emitir `PASS` funcional** (como máximo acredita respuesta de interfaz o queda `INDETERMINATE` si no existe canal de verificación).
* **Cuando la única evidencia procede del propio componente bajo prueba:** QAP debe etiquetar explícitamente el límite de independencia del testigo, prohibir declarar conformidad de persistencia/negocio crítico y marcar el resultado como `INDETERMINATE` o `PASS_ESTRUCTURAL_LIMITADO` `[PROPUESTA]` según la criticidad del oráculo.

## 13. Investigación funcional: Runner y ejecución de pruebas (Subsistema 4.8)

* **Garantías funcionales obligatorias del ejecutor oficial:**
* **Aislamiento estricto por caso:** cada caso inicia con contexto limpio (cookies, almacenamiento local, estado de pestañas, interceptores) salvo cuando un flujo explícitamente declare y trace continuidad de sesión/estado entre pasos encadenados.
* **Reutilización controlada de sesiones:** restaurar sesiones autenticadas vigentes por `(entorno, tenant, rol)` sin contaminar otros casos ni filtrar secretos.
* **Ejecución determinista y tipada:** ejecutar pasos sobre un snapshot congelado e íntegro (verificado antes de correr), soportando navegación, interacciones, validaciones, flujos multi-paso y comprobaciones asíncronas, en modo `headless` o `headed` cuando proceda.
* **Captura integral y sanitizada de evidencias:** registrar línea de tiempo paso a paso, esperado vs observado, capturas relevantes, trazas, logs y video cuando aplique, enmascarando datos sensibles antes de persistir.
* **Control operativo:** timeouts por paso y por caso, cancelación activa inmediata (incluyendo revocación de permisos en vuelo), ejecución paralela acotada por recursos sin interferencia entre casos, y recuperación tras fallos de publicación.


* **Separación de tres resultados independientes:**
1. *Éxito técnico de ejecución:* el runner logró ejecutar los pasos y recolectar evidencia.
2. *Éxito funcional:* los oráculos confirmaron el comportamiento esperado (`PASS`).
3. *Éxito de limpieza:* los datos sintéticos creados fueron retirados o revertidos según política (un fallo de limpieza se reporta explícitamente y alerta sobre estado residual sin falsear el veredicto funcional ni ocultarse).


* **Política de reintentos seguros e idempotencia:**
* Acciones de solo lectura o idempotentes pueden reintentarse dentro de límites ante fallos transitorios de red/UI.
* Acciones que modifican estado (p. ej. crear solicitud, aplicar pago, desembolsar) **nunca se reintentan ciegamente** tras un timeout o error post-envío: QAP debe primero **reconciliar el estado real** del sistema para comprobar si el efecto ya ocurrió y evitar efectos duplicados.



## 14. Investigación funcional: Datos de prueba, operaciones y limpieza (Subsistema 4.9)

* **Ciclo de vida de datasets sintéticos:** todo dato creado o usado para pruebas posee ámbito `(proyecto, entorno, tenant, rol)`, procedencia sintética, identificador de ejecución, grafo de dependencias con otras entidades y fecha de caducidad.
* **Aislamiento y no contaminación:** cada ejecución utiliza claves/identificadores únicos y trazables que permitan identificar sus registros sin colisionar con ejecuciones paralelas ni con datos de otros usuarios. Prohibida la copia automática de PII de producción.
* **Separación estricta entre lectura y escritura:**
* *Operaciones de solo lectura:* permitidas bajo política de observación en entornos autorizados (sujetas a protección contra rutas con efectos colaterales).
* *Operaciones que modifican estado:* exigen política explícita del entorno, datos sintéticos identificados y estrategia declarada de limpieza, reversión o confinamiento.


* **Limpieza, reversión y verificación residual:** la limpieza exige autorización, opera en orden inverso al grafo de dependencias, se restringe estrictamente a entidades creadas por el dataset de la ejecución, es repetible (idempotente) y verifica que no queden efectos residuales no deseados (cuando la reversión exacta no es posible —p. ej. asientos contables inmutables— debe soportar compensación autorizada o aislamiento en entorno desechable).
* **Protección de entornos sensibles y producción:** en producción o entornos no autorizados para escritura, toda operación mutativa se bloquea preventivamente por política antes de ejecutarse (`SKIPPED_BY_POLICY`), sin detener las comprobaciones de solo lectura autorizadas.

## 15. Investigación funcional: Orquestación y campañas autónomas (Subsistema 4.10)

* **Estados funcionales de una campaña:** `CREADA` → `EN_PREPARACION` (autorización/acceso) → `ACTIVA` (progresando en conocimiento, diseño, ejecución o diagnóstico) → `PAUSADA` (por usuario, presupuesto o espera de decisión) → `COMPLETADA` (objetivo alcanzado o frontera agotada con reporte) / `COMPLETADA_PARCIAL` (con bloqueos locales o brechas declaradas) / `CANCELADA` / `ABORTADA_POR_SEGURIDAD`.
* **Estados funcionales de una tarea:** `PENDIENTE`, `BLOQUEADA_DEPENDENCIA`, `EN_EJECUCION`, `ESPERANDO_DECISION`, `COMPLETADA`, `FALLIDA`, `OMITIDA_POR_POLITICA`, `CANCELADA`.
* **Bloqueo local vs parada de campaña:**
* *Bloqueo local (la campaña continúa con trabajo independiente):* falta de una regla de negocio en un módulo, operación prohibida por política en un caso, falla de una vista aislada, ausencia de permiso de un rol secundario.
* *Condición de parada global (detiene o pausa toda la campaña):* revocación de autorización del workspace o entorno, caducidad de la única sesión activa requerida, violación de seguridad, caída total del entorno bajo prueba o agotamiento del presupuesto global.


* **Continuación automática, presupuestos e idempotencia:** toda campaña opera con presupuestos explícitos (tiempo, páginas, ejecuciones, llamadas de inferencia). El trabajo determinista (ejecutar casos ya aprobados/materializados, reintentar lecturas, publicar reportes) continúa sin requerir conexión del modelo; solo la generación de nuevos escenarios, interpretación de hallazgos inesperados o resolución de drift exige una nueva propuesta de inteligencia.

## 16. Investigación funcional: Evidencias, reportes y defectos (Subsistema 4.11)

* **Contenido obligatorio de una evidencia oficial:** vínculo inmutable a `project_id`, `scope` completo, `campaign_id`, `case_id`, `case_revision`, `attempt_id`, `requirement_id` y revisión de regla/oráculo, marca temporal, pasos ejecutados, esperado vs observado, artefactos técnicos sanitizados (capturas, trazas, logs, video cuando corresponda) y huella de integridad.
* **Lo que cada evidencia permite afirmar (y lo que no):**
* Una captura o log sin expectativa acreditada solo demuestra *observación*, no `PASS`.
* Un `PASS` parcial en un subconjunto de módulos o roles debe comunicar explícitamente la cobertura ejecutada frente a la cobertura pendiente, bloqueada o indeterminada.


* **Reportes requeridos:**
* Reporte por campaña (resumen ejecutivo, cobertura, veredictos, brechas, consumo, defectos).
* Reporte por sistema/módulo (evolución histórica, tendencias, salud por entorno/tenant/rol).
* Reporte comparativo entre ejecuciones (nuevos fallos, fallos resueltos, regresiones, cambios de cobertura).
* Paquete de defecto orientado a desarrollo (alcance, precondiciones, datos sintéticos, pasos numerados, esperado, observado, causa clasificada, intento y enlaces a evidencias).


* **Gestión funcional de defectos:** detección automática ante `FAIL`, clasificación de causa raíz (`product_bug`, `environment_error`, `automation_error`, `data_error`, `auth_expired`, `flaky`, `indeterminate` — D-014), severidad y prioridad, agrupamiento y deduplicación por firma de fallo y alcance, flujo de reproducción asistida (`REPRODUCIDO` / `NO_REPRODUCIDO` / `BLOQUEADO`), verificación de corrección (*retest*) y detección de reapariciones (*regresión*).

## 17. Investigación funcional: Regresión y evolución de aplicaciones (Subsistema 4.12)

* **Reacción ante cambios en una aplicación conocida:**
* *Cambio de código o versión desplegada:* cruzar con mapa de impacto/dependencias y priorizar módulos afectados.
* *Cambio de DOM o variante visual:* distinguir fallo de localizador/adaptador de fallo funcional; permitir propuesta de actualización de adaptador creando una **nueva revisión ejecutable**, preservando intacta la identidad del caso y su expectativa funcional.
* *Cambio de API, configuración efectiva, reglas o permisos:* recalcular aplicabilidad, invalidar snapshots obsoletos, solicitar refresco selectivo de conocimiento y reevaluar expectativas antes de emitir veredictos.


* **Detección de flakiness:** identificar casos con resultados oscilantes (`PASS`/`FAIL`) bajo el mismo código, configuración y datos; clasificarlos como inestables para evitar falsas alarmas sin silenciar defectos intermitentes reales.
* **Invariante de reparación controlada:** ninguna autoevolución o reparación automática puede modificar silenciosamente una expectativa funcional ni convertir un `FAIL` en `PASS` ocultando el intento fallido original.

## 18. Investigación funcional: Seguridad, permisos y privacidad (Subsistema 4.13)

* **Modelo funcional de autorizaciones independientes:** los permisos de QAP son ortogonales a los permisos del usuario dentro del AUT (`docs/qap-knowledge-lifecycle.md`). Se separan capacidades autorizables: (1) acceso a workspace, (2) observación de destinos/orígenes, (3) autenticación/uso de perfiles, (4) lectura de fuentes documentales, (5) ejecución de pruebas de solo lectura, (6) ejecución de operaciones de escritura/mutación, (7) creación/limpieza de datos sintéticos y (8) eliminación de recursos propios de QAP.
* **Alcance estricto y cero escalación implícita:** toda autorización se vincula a `(proyecto, aplicación, entorno, origen, tenant, política)`. Una URL descubierta, un texto en pantalla, un prompt del agente o una etiqueta «staging» nunca amplían permisos.
* **Qué puede hacer QAP tras la autorización inicial vs cuándo pedir nueva autorización:**
* *Automático tras autorización inicial:* explorar dentro de orígenes permitidos, ingerir fuentes autorizadas, diseñar casos, ejecutar pruebas permitidas por la política del entorno, reanudar lotes, generar reportes y repetir regresiones.
* *Exige nueva autorización:* nuevo workspace o destino fuera de origen autorizado, cambio a entorno más sensible (p. ej. producción), habilitación de mutaciones no permitidas inicialmente, acceso a nuevo perfil privilegiado o borrado de datos del proyecto QAP.


* **Manejo de credenciales y privacidad:** las credenciales se capturan exclusivamente por un canal seguro del host/bóveda y **nunca** transitan ni se almacenan en prompts, argumentos de chat, conocimiento ordinario, logs o reportes. Las sesiones autenticadas permanecen aisladas por alcance y fuera de los expedientes exportables. Las evidencias enmascaran PII y secretos antes de persistirse.
* **Revocación, auditoría y retención:** la revocación de cualquier permiso debe aplicarse de forma inmediata, bloqueando nuevas llamadas y cancelando operaciones en vuelo dentro del alcance revocado sin afectar otros proyectos/tenants. Todas las autorizaciones, revocaciones y ejecuciones quedan en bitácora auditable con políticas de retención controladas.

## 19. Investigación funcional: Interfaces, clientes y extensibilidad (Subsistemas 4.14 y 4.15)

### 19.1 Experiencia consistente en todas las interfaces

* **Lenguaje natural (chat/IDE) y MCP:** punto de entrada conversacional («Quiero probar este sistema», «reproduce este ticket», «continúa la campaña de ayer»), una pregunta contextual por turno solo cuando falte información indispensable, resúmenes claros con enlaces a expedientes/reportes y recuperación transparente en chats nuevos.
* **CLI y ejecución automática no interactiva (CI/CD):** ejecución desatendida de suites deterministas, regresiones, consultas de estado, exportación/importación de memoria y diagnóstico, aplicando **exactamente las mismas compuertas** de elegibilidad, seguridad, oráculos y trazabilidad que MCP.
* **Visualización, consulta de memoria y diagnóstico:** capacidad de inspeccionar campañas activas/históricas, cobertura, expedientes de conocimiento, contradicciones, evidencias y defectos sin depender del modelo de IA.
* **Garantías de QAP vs herramientas externas:** QAP garantiza políticas, veracidad de veredictos, integridad de evidencias y continuidad; las herramientas externas (IDE, cliente MCP, CI) solo proveen transporte, presentación y canal de interacción, sin autoridad para relajar garantías.

### 19.2 Extensibilidad y universalidad

* **Núcleo universal (agnóstico):** memoria epistemológica, motor de campañas, modelo de políticas/autorizaciones, oráculos y taxonomía de veredictos, gestión de datasets y limpieza, trazabilidad, defectos y regresión.
* **Capacidades extensibles mediante conectores/adaptadores opt-in:** adaptadores de interfaz (web/SPA, API HTTP/REST/GraphQL, móvil, escritorio), conectores de fuentes documentales (Markdown, OpenAPI, PDF/DOCX, sistemas de tickets), proveedores de credenciales/bóvedas, y paquetes de dominio específicos (p. ej. extensión privada para Lendus que aporte recetas de datos o matrices de reglas sin contaminar el núcleo público de QAP).
* **Comportamiento ante sistemas y sectores nunca vistos:** QAP debe operar de forma útil desde el día cero en modo black-box utilizando únicamente sus capacidades universales, degradando con transparencia cuando falte un conector especializado o documentación de dominio, sin exigir configuraciones artesanales previas para empezar.

---

**Fin de la Entrega 1 de 2 (Secciones 1 a 19).**

Indícame «continúa» (o «Entrega 2») para recibir de inmediato la **Entrega 2 de 2**, que contiene las **Secciones 20 a 30** (Validación con LENDUS CORE, Catálogo Numerado de Requisitos con los 20 atributos obligatorios, Matrices de Trazabilidad y Dependencias, Métricas y análisis de umbrales 80 % / 75 %, Requisitos No Funcionales, Contradicciones y Decisiones Abiertas, Riesgos Funcionales, Casos de Aceptación End-to-End, Priorización y Preguntas para Ratificación del Propietario) más la **Matriz de Cobertura** completa.