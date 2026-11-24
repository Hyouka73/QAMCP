# Especificación Funcional Maestra de QAP — Entrega 2 de 2 (Adenda Integrada + Secciones 20 a 30 + Matriz de Cobertura)

## Adenda integrada: Autonomía inicial y continua (estándar TestSprite) y soberanía de QAP frente al host

*(Integración directa sobre las Secciones 4, 6, 7, 9, 10, 13 y 15 de la Entrega 1, sin repetir análisis previo ni diseñar arquitectura técnica.)*

Para alcanzar una **autonomía inicial y continua comparable a TestSprite** manteniendo la **soberanía operativa de QAP** aunque la inteligencia provenga de un host externo (Gemini, Codex, Antigravity u otro), se incorporan los siguientes comportamientos funcionales obligatorios por subsistema:

| Subsistema | Requisitos funcionales delta para autonomía inicial y continua + desconexión del host |
| --- | --- |
| **Memoria (Sec. 6)** | Conservar no solo conocimiento de dominio, sino también el **estado completo de progreso de campaña** (frontera de Discovery, cola de tareas deterministas listas, **cola de solicitudes de razonamiento pendientes**, paquetes de contexto compacto para re-hidratación inmediata en un nuevo chat/modelo y marcadores de cambio/drift) para retomar sin reiniciar ni depender del historial de conversación del host. |
| **Orquestación y Campañas (Sec. 15)** | Operar con un **ciclo de vida soberano de campaña** que clasifica cada unidad de trabajo en: *(a) ejecutable sin inferencia* (lotes de Discovery dentro de frontera autorizada, ejecución de casos materializados, evaluación de oráculos, limpieza sintética, publicación de reportes) y *(b) dependiente de razonamiento* (interpretación de vistas nuevas, diseño de escenarios inéditos, diagnóstico de fallos inesperados, propuestas de reparación de adaptadores). **Ante desconexión del host:** QAP **continúa automáticamente todo trabajo del grupo (a)** dentro de presupuestos y políticas vigentes, y **preserva en espera el grupo (b)** como trabajo pendiente de razonamiento hasta que se reconecte cualquier host/modelo compatible. |
| **Agentes e Inteligencia (Sec. 9)** | El host externo actúa como **proveedor de propuestas estructuradas**, nunca como dueño del flujo ni del veredicto. QAP valida cada propuesta, emite solicitudes de razonamiento autocontenidas (con resumen mínimo necesario y referencias de evidencia) y permite **cambio de host o modelo a mitad de campaña** (p. ej. iniciar en Antigravity, continuar en Codex o Gemini) sin pérdida de estado ni re-análisis redundante. |
| **Discovery (Sec. 7)** | En autonomía inicial, encadenar lotes automáticamente desde el primer destino autorizado hasta agotar la frontera o el presupuesto sin pedir confirmación por módulo ni por lote. En autonomía continua, detectar cambios estructurales/funcionales contra revisiones previas y explorar **solo el delta afectado**, continuando lotes pendientes incluso si el host se desconecta. |
| **Planner (Sec. 10)** | Construir y actualizar planes incrementales sin exigir intervención humana paso a paso: en primera campaña deriva un plan inicial útil desde el primer subconjunto `PARTIAL_READY` (sin esperar inventario total); en campañas continuas selecciona regresiones automáticamente a partir de cambios detectados, riesgo e historial de defectos. |
| **Runner (Sec. 13)** | Ejecutar colas completas de casos materializados, evaluar oráculos deterministas, ejecutar limpiezas seguras y emitir reportes de forma **totalmente independiente de la conectividad del host**, garantizando idempotencia y reconciliación previa si hubo interrupción durante una operación con escritura. |

## 20. Escenarios empresariales configurables — Validación con LENDUS CORE

*Advertencia de autoridad:* conforme a `docs/QAP-VISION-AUTONOMIA.md`, `docs/vnext/07_WBS_QAP_AGNOSTICO_Y_EXTENSIONES.md` y `docs/vnext/09_CONTRATO_EXPERIENCIA_OPERATIVA_MVP_2026-11-09.md`, **QAP es estrictamente agnóstico** y no codifica lógica de Lendus en su núcleo. No existe documentación primaria de reglas internas de LENDUS CORE en el repositorio ni acceso autorizado a su instancia; por tanto, **todas las reglas de negocio particulares de LENDUS CORE permanecen explícitamente pendientes de acreditación por fuente primaria y ratificación**. Los ejemplos siguientes son **sintéticos** y validan que los requisitos universales de QAP soportan sistemas de crédito configurables y auditables.

| Capacidad del dominio crediticio configurable | Qué exige funcionalmente del núcleo universal de QAP | Qué queda pendiente de fuente primaria de LENDUS CORE |
| --- | --- | --- |
| **Productos, subproductos y configuraciones** | Modelar `Configuración Efectiva` (flags como `es_contable`, plazos, tasas, comisiones, reglas por producto/subproducto y tenant) como dimensión de aplicabilidad (`applicable`/`not_applicable`/`indeterminate`) sin duplicar casos base. | Catálogo real de parámetros, combinaciones válidas y herencia producto → subproducto. |
| **Solicitudes, evaluaciones y autorizaciones** | Orquestar flujos multi-paso y multi-rol (p. ej. Rol A crea solicitud → Rol B evalúa → Rol C autoriza) con transición de estados verificada por testigos independientes y pruebas negativas RBAC (confirmando que un rol no autorizado recibe denegación y no altera estado). | Matriz exacta de estados de solicitud, umbrales de autorización y roles reales. |
| **Desembolsos, calendarios y amortización** | Oráculos de cálculo monetario con tolerancias explícitas, redondeos, fechas de corte, días inhábiles y verificación de generación de calendario persistido (Nivel 2–3 de independencia, nunca solo `HTTP 201`). | Fórmulas exactas de amortización, base de días (360/365), impuestos y redondeos. |
| **Intereses, comisiones, pagos y aplicación** | Validar orden de prelación de aplicación de pagos (p. ej. moratorios → comisiones → intereses → capital, *ejemplo sintético*), efectos en saldos, recálculo de cartera y ventanas temporales/cierre de día (asíncrono). | Reglas reales de devengo, prelación de pago, pagos parciales/anticipados y condonaciones. |
| **Cartera, contabilidad y conciliaciones** | Oráculos multi-módulo y de conciliación (suma de saldos de cuotas = saldo de cartera; movimientos operativos cuadran con pólizas/asientos contables cuando `es_contable = true`). | Plan de cuentas, reglas de devengo contable y canales de lectura autorizados para conciliación. |
| **Mutaciones, datos sintéticos y seguridad** | **Política explícita:** no habilitar mutaciones sobre Lendus por defecto (`docs/QAP-VISION-AUTONOMIA.md:48`). Cuando se autorice un entorno staging aislado, exigir datasets sintéticos sin PII real, grafo de dependencias (cliente → solicitud → crédito → pago), idempotencia ante timeouts y compensación/confinamiento en lugar de borrado destructivo donde existan registros contables inmutables. | Disponibilidad real de APIs de preparación/limpieza en staging y políticas de confinamiento de datos. |

## 21. Catálogo numerado de requisitos funcionales

*Nota de estructura:* cada requisito cubre los **20 atributos obligatorios** (ID y nombre; Subsistema; Descripción; Actor; Objetivo; Disparador; Precondiciones; Entradas; Comportamiento esperado; Salidas; Efectos persistentes; Reglas relacionadas; Estados/excepciones; Casos +/-/límite; Criterios de aceptación; Dependencias; Prioridad; Riesgo; Procedencia/Autoridad; Estado). Para mantener legibilidad y completitud total, se presentan los requisitos maestros representativos de los 15 subsistemas en formato estructurado compacto con los 20 campos explícitos.

### REQ-MEM-001 — Separación epistemológica de cuatro planos y procedencia obligatoria

* **Subsistema:** Memoria y conocimiento (4.1) | **Actor:** QAP / Agente / Usuario | **Prioridad:** P0 (Invariante núcleo) | **Estado:** Confirmado
* **Procedencia / Autoridad:** Nivel 1 (`REQUISITOS_Y_DECISIONES.md` D-011; `QAP-VISION-AUTONOMIA.md` Principio 5)
* **Objetivo:** Impedir que observaciones o inferencias se traten como verdad de negocio confirmada.
* **Disparador:** Cualquier escritura o actualización en la memoria de conocimiento.
* **Precondiciones:** Alcance válido `(proyecto, aplicación, entorno, tenant/rol si aplica)` identificado.
* **Entradas:** Entidad, plano epistemológico (`OBSERVED`, `INFERRED`, `EXPECTED_REQUIREMENT`, `ASSESSMENT`), fuente primaria, marca temporal y nivel de confianza/autoridad.
* **Comportamiento esperado:** Almacena la entidad exclusivamente en su plano con procedencia inmutable; rechaza promociones automáticas desde `OBSERVED` o `INFERRED` hacia `EXPECTED_REQUIREMENT` sin fuente acreditada.
* **Salidas:** Identificador de entidad, número de revisión y referencia de procedencia.
* **Efectos persistentes:** Registro versionado sin sobrescribir revisiones ni evidencias previas.
* **Reglas relacionadas:** D-011 (una sonda activa nunca promueve a `confirmed`), D-012 (`manually_edited` no equivale a certeza absoluta).
* **Estados y excepciones:** `vigente`, `en_conflicto`, `stale`, `archivada`; excepción `INVALID_EPISTEMIC_TRANSITION` si se intenta promover sin fuente.
* **Casos +/-/límite:** *(+)* Observación DOM guardada en `OBSERVED` y requisito de manual acreditado en `EXPECTED_REQUIREMENT`; *(-)* Intento de agente de guardar observación DOM como `EXPECTED_REQUIREMENT` es rechazado; *(Límite)* Requisito modificado crea revisión N+1 preservando revisión N para intentos históricos.
* **Criterios de aceptación:** 100 % de entidades tienen plano y procedencia; 0 % de observaciones o sondas alcanzan estado de requisito acreditado sin fuente legítima.
* **Dependencias:** REQ-SEG-001 | **Riesgo que controla:** Falsos `PASS` por tautología (validar el sistema contra sus propios bugs).

### REQ-MEM-002 — Aislamiento multidimensional y continuidad entre campañas/hosts

* **Subsistema:** Memoria y conocimiento (4.1) | **Actor:** QAP / Host | **Prioridad:** P0 | **Estado:** Confirmado
* **Procedencia / Autoridad:** Nivel 1 (D-005, D-013, D-019; `09_CONTRATO` Sec. 4; Complemento autonomía continua)
* **Objetivo:** Aislar conocimiento, progreso y evidencias por alcance y permitir reanudación sin redescubrimiento ni dependencia del chat.
* **Disparador:** Inicio, cambio de alcance, reconexión de host o consulta contextual.
* **Precondiciones:** Proyecto/workspace autorizado y alcance resuelto sin ambigüedad.
* **Entradas:** `project_id`, `application_id`, `instance_id`, `env_id`, `tenant_id`, `role_id`, `product_version`, `config_revision`.
* **Comportamiento esperado:** Particiona lecturas y escrituras por alcance exacto; expone paquetes de contexto resumido y cola de trabajo pendiente (determinista y de razonamiento) para que cualquier host/chat nuevo retome donde quedó la campaña.
* **Salidas:** Contexto recuperado del alcance exacto y estado de progreso reanudable.
* **Efectos persistentes:** Estado de campaña, checkpoints y conocimiento segregados sin contaminación cruzada.
* **Reglas relacionadas:** D-019 (un tenant no se infiere del nombre de carpeta; bloqueo ante scope ambiguo).
* **Estados y excepciones:** `SCOPE_BOUND`, `SCOPE_AMBIGUOUS_BLOCKED`; excepción `CROSS_SCOPE_ACCESS_DENIED`.
* **Casos +/-/límite:** *(+)* Dos tenants A y B en la misma app conservan reglas y resultados separados; *(-)* Consulta de tenant A jamás retorna datos de tenant B; *(Límite)* Cambio de cliente (p. ej. Antigravity → Codex) tras reinicio recupera progreso con 0 redescubrimiento.
* **Criterios de aceptación:** Pruebas negativas cruzadas A↔B = 0 fugas; reanudación tras reinicio conserva 100 % de checkpoints y conocimiento vigente.
* **Dependencias:** REQ-SEG-001 | **Riesgo que controla:** Contaminación multi-tenant/multi-proyecto y pérdida de progreso al reiniciar.

### REQ-MEM-003 — Detección de contradicciones, obsolescencia y portabilidad sin secretos

* **Subsistema:** Memoria y conocimiento (4.1) | **Actor:** QAP / Operador QA | **Prioridad:** P1 | **Estado:** Derivado
* **Procedencia / Autoridad:** Nivel 1–3 (D-005, D-018; `09_CONTRATO` Sec. 2)
* **Objetivo:** Gestionar conflictos entre fuentes, invalidar conocimiento obsoleto por drift y permitir exportar/importar conocimiento de forma segura.
* **Disparador:** Ingesta de nueva fuente, nueva observación contradictoria, cambio de versión/configuración o solicitud de exportación/importación.
* **Precondiciones:** Conocimiento existente en el alcance.
* **Entradas:** Nueva entidad/fuente o comando de exportación/importación.
* **Comportamiento esperado:** Detecta contradicciones conservando ambas fuentes; marca `stale` solo entidades afectadas por un cambio; exporta/importa conocimiento portable excluyendo sesiones, tokens y credenciales.
* **Salidas:** Registro de contradicción, listado de entidades invalidadas o paquete portable verificado.
* **Efectos persistentes:** Conflictos abiertos trazables; historial preservado sin borrado destructivo.
* **Reglas relacionadas:** Prohibido sobrescribir evidencia histórica o exportar secretos.
* **Estados y excepciones:** `CONFLICT_OPEN`, `STALE`, `EXPORT_SANITIZED`; excepción `SECRET_LEAK_PREVENTED`.
* **Casos +/-/límite:** *(+)* Regla v2 invalida solo casos ligados a v1; *(-)* Intento de exportar paquete con sesión activa excluye o bloquea el secreto; *(Límite)* Importación de paquete corrupto rechaza cambios sin dañar memoria existente.
* **Criterios de aceptación:** 100 % de contradicciones de igual autoridad bloquean generación de oráculo para esa regla; 0 secretos presentes en exportaciones.
* **Dependencias:** REQ-MEM-001, REQ-SEG-002 | **Riesgo que controla:** Oráculos basados en conocimiento obsoleto o fuga de credenciales al compartir conocimiento.

### REQ-DIS-001 — Discovery autónomo por lotes con frontera reanudable y cobertura honesta

* **Subsistema:** Discovery (4.2) | **Actor:** QAP (autónomo) | **Prioridad:** P0 | **Estado:** Confirmado
* **Procedencia / Autoridad:** Nivel 1–2 (`QAP-VISION-AUTONOMIA.md` Ciclo A; `qap-knowledge-lifecycle.md`; D-016)
* **Objetivo:** Descubrir rutas, vistas, controles, formularios, tablas, flujos y tráfico observable sin intervención humana por ruta ni por módulo.
* **Disparador:** Inicio de campaña («Quiero probar este sistema») o solicitud de exploración/refresco.
* **Precondiciones:** Workspace y destino autorizados; sesión vigente si el sistema requiere autenticación.
* **Entradas:** URL/punto de entrada, alcance, presupuesto (páginas, profundidad, tiempo, solicitudes), frontera previa si existe.
* **Comportamiento esperado:** Explora por lotes continuos dentro de la política (incluyendo SPAs y llamadas de lectura autorizadas), captura etiquetas reales, formularios, tablas, estados y relaciones; clasifica rutas en `detectadas`, `inspeccionadas`, `pendientes`, `bloqueadas` y `fuera_de_alcance`; continúa lotes automáticamente incluso si el host se desconecta.
* **Salidas:** Expediente versionado de Discovery y estado de cobertura (`READY`, `PARTIAL_READY`, `BLOCKED`).
* **Efectos persistentes:** Observaciones inmutables, candidatos de módulos (hipótesis) y checkpoint de frontera.
* **Reglas relacionadas:** No pedir selección de módulos antes del reconocimiento inicial (D-016); nunca reportar conteo de enlaces como cobertura comprobada.
* **Estados y excepciones:** `BLOCKED`, `PARTIAL_READY`, `READY`; ante `401/403` o barrera de login pausa con `BLOCKED_AUTH` conservando frontera.
* **Casos +/-/límite:** *(+)* App SPA autenticada explora vistas, formularios y tablas en varios lotes hasta `READY`; *(-)* Ruta destructiva (`logout`/`delete`) es excluida automáticamente y registrada como bloqueada por política; *(Límite)* Presupuesto agotado emite `PARTIAL_READY` utilizable para diseñar pruebas sobre lo ya inspeccionado.
* **Criterios de aceptación:** 0 confirmaciones humanas entre lotes; separación verificable de contadores de rutas; reanudación tras corte sin re-inspeccionar vistas vigentes.
* **Dependencias:** REQ-SEG-001, REQ-MEM-002 | **Riesgo que controla:** Discovery superficial en SPAs y redescubrimiento redundante.

### REQ-DOC-001 — Ingesta documental trazable y reconciliación con observaciones reales

* **Subsistema:** Documentación y reglas (4.3) | **Actor:** QAP / Agente | **Prioridad:** P0 (texto/MD) / P1 (formatos complejos) | **Estado:** Confirmado
* **Procedencia / Autoridad:** Nivel 1 (D-018; `09_CONTRATO` Sec. 2)
* **Objetivo:** Extraer reglas, fórmulas, permisos y procesos desde fuentes autorizadas y reconciliarlos contra lo observado.
* **Disparador:** Provisión o detección de documentación autorizada.
* **Precondiciones:** Permiso de lectura sobre la fuente documental.
* **Entradas:** Documento(s), metadatos de versión, fecha y alcance.
* **Comportamiento esperado:** Extrae afirmaciones con localizador exacto (archivo/sección/página/versión), registra fragmentos no legibles sin simular cobertura, y cruza contra observaciones clasificando coincidencias, ausencias («no observado/pendiente», nunca «eliminado»), elementos no documentados y contradicciones reales.
* **Salidas:** Inventario documental y matriz de reconciliación con brechas.
* **Efectos persistentes:** Fuentes, afirmaciones, reglas candidatas/acreditadas y discrepancias en memoria.
* **Reglas relacionadas:** D-011 y D-018 (no editar manuales automáticamente en alcance base; no confundir texto con observación).
* **Estados y excepciones:** `INGESTED`, `PARTIAL_EXTRACTION`, `CONFLICT_DETECTED`.
* **Casos +/-/límite:** *(+)* Manual describe regla por tenant y QAP la vincula a la vista observada; *(-)* Manual contiene tabla no legible y QAP reporta la sección omitida; *(Límite)* Dos versiones del manual contradicen un cálculo → abre conflicto sin generar oráculo.
* **Criterios de aceptación:** 100 % de afirmaciones tienen origen y versión; 0 reglas inventadas sobre secciones no leídas.
* **Dependencias:** REQ-MEM-001, REQ-MEM-003 | **Riesgo que controla:** Oráculos derivados de documentación desactualizada o mal interpretada.

### REQ-IA-001 — Soberanía de QAP, modos de inteligencia y continuidad ante desconexión del host

* **Subsistema:** Inteligencia y agentes (4.4) | **Actor:** QAP / Host (Gemini, Codex, Antigravity) | **Prioridad:** P0 | **Estado:** Confirmado (con delta `[PROPUESTA]` para modo `MANAGED`)
* **Procedencia / Autoridad:** Nivel 1–2 (`QAP-VISION-AUTONOMIA.md` Principios 4, 6, 8; D-004; Complemento del propietario)
* **Objetivo:** Utilizar la inteligencia del host para comprender y proponer sin ceder el control de ejecución/veredictos, continuando trabajo determinista si el host se desconecta.
* **Disparador:** Necesidad de razonamiento en campaña, desconexión del host o reconexión de un nuevo cliente/modelo.
* **Precondiciones:** Campaña activa con políticas y presupuestos configurados.
* **Entradas:** Solicitud de razonamiento (evidencias/contexto), propuesta estructurada del modelo o evento de desconexión.
* **Comportamiento esperado:** Valida toda propuesta del modelo contra esquema, evidencia y política antes de aceptarla; opera en `HOST`, `DETERMINISTIC` o `MANAGED`; si el host se desconecta o agota cuota, continúa todo trabajo determinista pendiente y encola las tareas que requieran razonamiento para cualquier host que reconecte.
* **Salidas:** Propuestas validadas/rechazadas, resultados de trabajo determinista continuo y cola de razonamiento pendiente.
* **Efectos persistentes:** Estado de cola de razonamiento y trazabilidad de propuestas aceptadas/rechazadas.
* **Reglas relacionadas:** 0 llamadas a IA por paso de ejecución; rechazo absoluto de `PASS` desde scripts externos del agente.
* **Estados y excepciones:** `HOST_CONNECTED`, `HOST_DISCONNECTED_CONTINUING_DETERMINISTIC`, `AWAITING_REASONING`, `PROPOSAL_REJECTED`.
* **Casos +/-/límite:** *(+)* Host propone caso válido y se desconecta mientras corre la suite → QAP termina ejecución, evalúa oráculos y publica reporte; *(-)* Modelo intenta pasar un caso sin oráculo o ejecutar script externo → QAP lo rechaza; *(Límite)* Nuevo host distinto (p. ej. Codex tras Antigravity) toma la cola de razonamiento pendiente sin reiniciar.
* **Criterios de aceptación:** 100 % de casos ejecutados sin modelo por paso; 100 % de trabajo determinista en cola completado tras desconexión simulada del host.
* **Dependencias:** REQ-MEM-002, REQ-CAM-001 | **Riesgo que controla:** Pérdida de control ante alucinaciones o caídas del cliente/modelo.

### REQ-PLN-001 — Planificación basada en riesgo, dependencias DAG y adaptación progresiva

* **Subsistema:** Planner (4.5) | **Actor:** QAP / Agente | **Prioridad:** P0 (básico) / P1 (riesgo y multi-módulo) | **Estado:** Confirmado
* **Procedencia / Autoridad:** Nivel 1–3 (`QAP-VISION-AUTONOMIA.md` Ciclo B; D-008, D-017)
* **Objetivo:** Priorizar qué probar y construir planes de campaña, ejecución y datos congelados y verificables.
* **Disparador:** Cobertura `PARTIAL_READY`/`READY`, solicitud focalizada o cambio detectado en regresión.
* **Precondiciones:** Al menos una vista inspeccionada o casos vigentes en memoria.
* **Entradas:** Inventario, reglas, dependencias, historial de fallos, restricciones de entorno y presupuesto.
* **Comportamiento esperado:** Prioriza por criticidad/riesgo, resuelve orden topológico DAG (detectando ciclos), selecciona combinaciones de roles/configuración relevantes, separa plan de campaña/ejecución/datos y congela snapshot versionado con huella de integridad.
* **Salidas:** Plan de campaña, plan de ejecución ordenado y plan de datos.
* **Efectos persistentes:** Planes versionados vinculados al alcance y revisión de reglas/casos.
* **Reglas relacionadas:** No posponer toda prueba hasta mapear el 100 % de la app (D-017); invalidar plan ante cambios de reglas o casos.
* **Estados y excepciones:** `DRAFT`, `FROZEN`, `STALE`, `CYCLE_DETECTED_BLOCKED`.
* **Casos +/-/límite:** *(+)* Plan multi-módulo ordena creación antes de consulta/pago; *(-)* Dependencia circular bloquea planificación con diagnóstico exacto; *(Límite)* Cambio de una regla marca el plan previo como `STALE` sin alterar historial de ejecuciones pasadas.
* **Criterios de aceptación:** Orden DAG respetado al 100 %; integridad de huella verificada antes de ejecutar.
* **Dependencias:** REQ-DIS-001, REQ-CAS-001 | **Riesgo que controla:** Ejecución desordenada, cobertura ciega o ejecución de planes manipulados/obsoletos.

### REQ-CAS-001 — Generación autónoma y gestión de casos reutilizables (identidad vs revisión)

* **Subsistema:** Generación y gestión de casos (4.6) | **Actor:** QAP / Agente | **Prioridad:** P0 | **Estado:** Confirmado
* **Procedencia / Autoridad:** Nivel 1–2 (`QAP-VISION-AUTONOMIA.md` Principios 1, 5; `qap-knowledge-lifecycle.md`)
* **Objetivo:** Transformar conocimiento en casos ejecutables reutilizables sin aprobación humana por caso en ruta ordinaria, separando identidad funcional de implementación técnica.
* **Disparador:** Planificación de escenarios sobre vistas inspeccionadas y/o reglas acreditadas.
* **Precondiciones:** Vistas inspeccionadas y oráculo estructural o requisito acreditado.
* **Entradas:** Escenarios (positivos, negativos, BVA, equivalencia, estados, RBAC, cálculos), controles observados y reglas.
* **Comportamiento esperado:** Genera casos con identidad funcional estable y revisión ejecutable independiente (pasos tipados, localizadores, datos); detecta duplicados; abstiene de habilitar para `PASS` escenarios cuya expectativa de negocio carezca de fuente suficiente.
* **Salidas:** Casos versionados con aplicabilidad y elegibilidad verificadas.
* **Efectos persistentes:** Identidad de caso + revisiones inmutables enlazadas a requisitos y observaciones.
* **Reglas relacionadas:** 0 aprobaciones humanas por caso en ruta ordinaria; prohibido fabricar oráculos sin fuente.
* **Estados y excepciones:** `ELIGIBLE`, `INDETERMINATE_NO_ORACLE`, `NOT_APPLICABLE`, `OBSOLETE`, `DUPLICATE_MERGED`.
* **Casos +/-/límite:** *(+)* Caso positivo y negativo con regla acreditada se materializa y ejecuta automáticamente; *(-)* Caso BVA/RBAC sin regla esperada queda `INDETERMINATE_NO_ORACLE` y no bloquea otros casos; *(Límite)* Cambio de localizador genera revisión v2 manteniendo identidad e historial de v1.
* **Criterios de aceptación:** 0 llamadas a `elicitation/create` o aprobación manual por caso en ruta ordinaria; 100 % de casos ejecutables tienen oráculo trazable.
* **Dependencias:** REQ-MEM-001, REQ-ORA-001 | **Riesgo que controla:** Fricción humana excesiva o proliferación de casos frágiles sin sustento.

### REQ-ORA-001 — Evaluación por oráculos acreditados, testigos independientes y taxonomía estricta de veredictos

* **Subsistema:** Oráculos y validación funcional (4.7) | **Actor:** QAP | **Prioridad:** P0 (estructural) / P1 (negocio, persistencia, cálculos) | **Estado:** Confirmado
* **Procedencia / Autoridad:** Nivel 1–2 (`QAP-VISION-AUTONOMIA.md` Principio 5; D-011, D-014; ISTQB/TestMu)
* **Objetivo:** Emitir veredictos funcionalmente veraces y evitar falsos `PASS` (como `HTTP 201` sin persistencia real).
* **Disparador:** Finalización de pasos de un intento de prueba.
* **Precondiciones:** Caso con expectativa definida y evidencias capturadas.
* **Entradas:** Expectativa del oráculo, evidencias observadas y resultados de testigos independientes.
* **Comportamiento esperado:** Evalúa estructurales, reglas de negocio, persistencia (exigiendo al menos testigo Nivel 2 para mutaciones), cálculos monetarios, conciliaciones, ausencia de efectos no autorizados y ventanas asíncronas. Emite exclusivamente `PASS`, `FAIL`, `INDETERMINATE`, `BLOCKED`, `SKIPPED` o `ERROR`. Nunca promueve `HTTP 2xx`, ausencia de excepción o falta de testigo independiente a `PASS` funcional de mutación.
* **Salidas:** Veredicto formal, comparación esperado vs observado y nivel de independencia del testigo.
* **Efectos persistentes:** Evaluación de conformidad inmutable en Plano 4 ligada a caso, revisión e intento.
* **Reglas relacionadas:** D-014 (`INDETERMINATE` obligatorio ante ambigüedad); exclusión de `INDETERMINATE` del `PASS rate`.
* **Estados y excepciones:** `PASS`, `FAIL`, `INDETERMINATE`, `BLOCKED`, `SKIPPED`, `ERROR`.
* **Casos +/-/límite:** *(+)* Operación crea registro, recarga/consulta por lectura independiente confirma persistencia y valores → `PASS`; *(-)* Servidor devuelve `HTTP 201` pero consulta posterior no encuentra el registro → `FAIL` (nunca `PASS`); *(Límite)* Acción falla por timeout sin poder verificar persistencia → `INDETERMINATE` o `ERROR` con reconciliación requerida.
* **Criterios de aceptación:** 0 % falsos `PASS` en prueba sembrada «HTTP 201 sin guardado»; 100 % de `PASS` vinculados a aserción verificada y evidencia.
* **Dependencias:** REQ-MEM-001, REQ-RUN-001 | **Riesgo que controla:** Certificación falsa de software defectuoso.

### REQ-RUN-001 — Ejecución determinista aislada, control operativo e idempotencia de mutaciones

* **Subsistema:** Runner y ejecución (4.8) | **Actor:** QAP (autónomo, sin IA por paso) | **Prioridad:** P0 (aislamiento/lectura) / P1 (paralelismo/mutaciones) | **Estado:** Confirmado
* **Procedencia / Autoridad:** Nivel 1–2 (`QAP-VISION-AUTONOMIA.md` Principios 4, 7; D-007)
* **Objetivo:** Ejecutar snapshots congelados de manera aislada, reproducible, segura y recuperable.
* **Disparador:** Plan de ejecución congelado y autorizado.
* **Precondiciones:** Snapshot íntegro, entorno autorizado, sesión vigente si aplica.
* **Entradas:** Plan de ejecución, sesiones autorizadas, datasets sintéticos, timeouts y políticas.
* **Comportamiento esperado:** Aísla cada caso en contexto limpio (salvo continuidad declarada en flujo), ejecuta pasos tipados sin consultar IA, captura evidencias sanitizadas, respeta timeouts y cancelación inmediata (incluyendo revocación en vuelo), separa éxito técnico/funcional/limpieza y exige reconciliación de estado antes de reintentar cualquier acción mutativa.
* **Salidas:** Resultado de intento, línea de tiempo, artefactos sanitizados y estado de limpieza.
* **Efectos persistentes:** Intento inmutable y evidencias publicadas atómicamente (recuperables si hay corte).
* **Reglas relacionadas:** Cero reintentos ciegos de mutaciones; 0 fugas de sesión/estado entre casos independientes.
* **Estados y excepciones:** `RUNNING`, `COMPLETED`, `CANCELLED_BY_REVOCATION`, `TIMED_OUT`, `PUBLICATION_PENDING_RECOVERY`.
* **Casos +/-/límite:** *(+)* Dos casos independientes corren en secuencia o paralelo sin compartir cookies/DOM; *(-)* Fallo de captura de screenshot no enmascara estado ni corrompe resultado; *(Límite)* Revocación de permiso durante ejecución aborta el intento activo y bloquea publicación.
* **Criterios de aceptación:** 100 % aislamiento entre casos; 0 efectos duplicados tras corte simulado en mutación; cancelación activa ante revocación.
* **Dependencias:** REQ-SEG-001, REQ-DAT-001 | **Riesgo que controla:** Contaminación entre pruebas, efectos duplicados y fallos no reproducibles.

### REQ-DAT-001 — Gestión de datos sintéticos, mutaciones autorizadas y limpieza verificada

* **Subsistema:** Datos de prueba y limpieza (4.9) | **Actor:** QAP | **Prioridad:** P0 (fixtures aislados) / P1 (DAG empresarial y limpieza) | **Estado:** Confirmado
* **Procedencia / Autoridad:** Nivel 1–2 (`QAP-VISION-AUTONOMIA.md` Principio 3; `qap-knowledge-lifecycle.md`; D-003)
* **Objetivo:** Proveer datos sintéticos trazables y aislados, permitiendo mutaciones solo donde estén autorizadas con limpieza o confinamiento verificado.
* **Disparador:** Preparación de plan de datos para ejecución.
* **Precondiciones:** Política de entorno que autorice explícitamente mutaciones y limpieza (nunca producción por defecto).
* **Entradas:** Esquema/requisitos de datos, grafo de dependencias, alcance y caducidad.
* **Comportamiento esperado:** Genera datos sintéticos con ID de ejecución y sin PII real; crea entidades en orden DAG; tras la ejecución limpia en orden inverso solo entidades del dataset (o aplica compensación/confinamiento) y verifica ausencia de residuos. Bloquea mutaciones en entornos no autorizados (`SKIPPED_BY_POLICY`).
* **Salidas:** Dataset activo y reporte de éxito/fallo de limpieza residual.
* **Efectos persistentes:** Registro de procedencia, caducidad y auditoría de limpieza.
* **Reglas relacionadas:** Prohibido copiar PII de producción; prohibidas mutaciones en Lendus o producción sin política expresa.
* **Estados y excepciones:** `PREPARED`, `IN_USE`, `CLEANED`, `CLEANUP_FAILED_RESIDUAL`, `SKIPPED_BY_POLICY`.
* **Casos +/-/límite:** *(+)* Crea cliente→solicitud sintéticos, ejecuta prueba y limpia en orden inverso; *(-)* Intento de mutación en entorno read-only se bloquea sin detener casos de lectura; *(Límite)* Fallo en limpieza se reporta explícitamente sin alterar el veredicto funcional del caso.
* **Criterios de aceptación:** 0 mutaciones ejecutadas en entornos no autorizados; 0 PII de producción copiada; limpieza idempotente verificada.
* **Dependencias:** REQ-SEG-001 | **Riesgo que controla:** Corrupción de entornos compartidos/productivos y fuga de datos reales.

### REQ-CAM-001 — Orquestación autónoma de campañas, presupuestos y recuperación

* **Subsistema:** Orquestación y campañas (4.10) | **Actor:** QAP | **Prioridad:** P0 | **Estado:** Confirmado
* **Procedencia / Autoridad:** Nivel 1–2 (`QAP-VISION-AUTONOMIA.md` Principios 1, 3, 7; `REQUISITOS_QA_MVP_OPERATIVO.md`; Complemento autonomía)
* **Objetivo:** Conducir campañas end-to-end con progreso persistente, aislamiento de bloqueos locales y reanudación limpia.
* **Disparador:** Solicitud de usuario («Quiero probar este sistema», «reproduce este ticket», «continúa») o ejecución programada.
* **Precondiciones:** Workspace y política inicial autorizados.
* **Entradas:** Objetivo/modo de intención, alcance, presupuestos (tiempo, páginas, ejecuciones, inferencia).
* **Comportamiento esperado:** Coordina Discovery → Diseño → Datos → Ejecución → Diagnóstico → Reporte; aísla bloqueos locales (un módulo sin regla o caso bloqueado por política no detiene la campaña); pausa globalmente solo ante fallos de seguridad, sesión única caducada o presupuesto agotado; reanuda tras reinicios sin duplicar trabajo ya completado.
* **Salidas:** Estado de campaña, progreso por tarea, bloqueos y resultados consolidados.
* **Efectos persistentes:** Estado de campaña y checkpoints de tareas persistidos.
* **Reglas relacionadas:** Continuación automática del trabajo determinista ante desconexión del host.
* **Estados y excepciones:** `CREADA`, `EN_PREPARACION`, `ACTIVA`, `PAUSADA`, `COMPLETADA`, `COMPLETADA_PARCIAL`, `CANCELADA`, `ABORTADA_POR_SEGURIDAD`.
* **Casos +/-/límite:** *(+)* Campaña completa A→B→C con 0 intervenciones tras autorización inicial; *(-)* Un caso prohibido por política queda `SKIPPED_BY_POLICY` mientras los demás terminan; *(Límite)* Reinicio abrupto a mitad de campaña retoma exactamente la siguiente tarea pendiente.
* **Criterios de aceptación:** 0 intervenciones rutinarias en flujo ordinario; 100 % recuperación de checkpoints sin duplicación.
* **Dependencias:** REQ-MEM-002, REQ-IA-001, REQ-SEG-001 | **Riesgo que controla:** Campañas frágiles que se detienen ante bloqueos menores o pierden avance.

### REQ-REP-001 — Evidencias íntegras, reportes auditables y gestión de defectos

* **Subsistema:** Evidencias, reportes y defectos (4.11) | **Actor:** QAP / QA / Desarrollo | **Prioridad:** P0 (evidencias/reportes) / P1 (defectos) | **Estado:** Confirmado
* **Procedencia / Autoridad:** Nivel 1–3 (`QAP-VISION-AUTONOMIA.md` Principio 6; `REQUISITOS_QA_MVP_OPERATIVO.md`; D-014)
* **Objetivo:** Producir evidencias sanitizadas verificables, reportes transparentes sobre cobertura y registros reproducibles de defectos.
* **Disparador:** Cierre de intento, pausa/fin de campaña, detección de `FAIL` o solicitud de consulta histórica/comparativa.
* **Precondiciones:** Intentos registrados en QAP.
* **Entradas:** Resultados, artefactos técnicos, expectativas, historial previo.
* **Comportamiento esperado:** Vincula toda evidencia a caso/revisión/intento/requisito con huella de integridad; excluye secretos; comunica explícitamente cobertura incompleta; detecta, clasifica (`product_bug`, `environment_error`, `automation_error`, `data_error`, `auth_expired`, `flaky`, `indeterminate`), deduplica por firma y permite reproducir/verificar correcciones de defectos.
* **Salidas:** Reportes de campaña/sistema/comparativa y paquetes de defecto reproducibles.
* **Efectos persistentes:** Historial de publicaciones, defectos y comparativas de regresión.
* **Reglas relacionadas:** Nunca presentar cobertura parcial como total; nunca clasificar HTTP 500 automáticamente como `product_bug` (D-014).
* **Estados y excepciones:** `PUBLISHED`, `DEGRADED_MISSING_ARTIFACT`, `DEFECT_OPEN`, `DEFECT_VERIFIED_FIXED`, `DEFECT_REGRESSED`.
* **Casos +/-/límite:** *(+)* Reporte enlaza video, traza y paso fallido verificables tras reinicio; *(-)* Falta de video conserva veredicto indicando degradación; *(Límite)* Mismo fallo repetido en 3 ejecuciones se agrupa en un solo defecto con conteo de ocurrencias.
* **Criterios de aceptación:** 100 % de `PASS`/`FAIL` con trazabilidad completa; 0 secretos en artefactos publicados; consulta histórica consistente en todos los canales.
* **Dependencias:** REQ-ORA-001, REQ-RUN-001 | **Riesgo que controla:** Reportes engañosos, defectos irreproducibles o duplicación masiva de incidencias.

### REQ-REG-001 — Detección de cambios, selección de regresiones y reparación controlada

* **Subsistema:** Regresión y evolución (4.12) | **Actor:** QAP | **Prioridad:** P1 / P2 | **Estado:** Derivado
* **Procedencia / Autoridad:** Nivel 1–2 (`QAP-VISION-AUTONOMIA.md` Principio 7, P2; D-001; Complemento autonomía continua)
* **Objetivo:** Detectar drift en aplicaciones conocidas, seleccionar regresiones por impacto/riesgo y reparar localizadores sin alterar expectativas.
* **Disparador:** Nueva versión desplegada, cambio de código/configuración/regla o campaña de regresión.
* **Precondiciones:** Historial previo y casos vigentes del alcance.
* **Entradas:** Señales de cambio (código, DOM, API, configuración, reglas), grafo de dependencias e historial de defectos.
* **Comportamiento esperado:** Identifica módulos y casos afectados, selecciona suite mínima de alto valor priorizada por riesgo, ejecuta en modo `DETERMINISTIC` sin redescubrir todo, detecta flakiness y, ante cambios de UI, propone actualización de adaptador en una **nueva revisión ejecutable** sin tocar la expectativa funcional.
* **Salidas:** Plan de regresión focalizado, reporte de drift, clasificación de flakiness y nueva revisión de adaptador si aplica.
* **Efectos persistentes:** Historial de cambios, nuevas revisiones de casos y métricas de estabilidad.
* **Reglas relacionadas:** Prohibido modificar silenciosamente expectativas funcionales o convertir `FAIL` en `PASS` ocultando el fallo.
* **Estados y excepciones:** `DRIFT_DETECTED`, `REGRESSION_SELECTED`, `FLAKY_FLAGGED`, `ADAPTER_REVISION_PROPOSED`.
* **Casos +/-/límite:** *(+)* Cambio en un módulo ejecuta solo casos afectados y dependientes sin redescubrimiento total; *(-)* Cambio que rompe una regla de negocio falla como `FAIL` y no se «auto-repara»; *(Límite)* Caso que oscila `PASS`/`FAIL` con mismo estado se etiqueta `flaky`.
* **Criterios de aceptación:** Reducción medible de redescubrimiento y tiempo de regresión; 0 alteraciones silenciosas de oráculos.
* **Dependencias:** REQ-MEM-003, REQ-PLN-001, REQ-RUN-001 | **Riesgo que controla:** Regresiones lentas/costosas o auto-reparación que oculta defectos reales.

### REQ-SEG-001 — Autorización granular por alcance, revocación inmediata y cero escalación implícita

* **Subsistema:** Seguridad, permisos y privacidad (4.13) | **Actor:** Operador QA / QAP | **Prioridad:** P0 | **Estado:** Confirmado
* **Procedencia / Autoridad:** Nivel 1 (`QAP-VISION-AUTONOMIA.md` Principios 2, 3; D-003, D-019)
* **Objetivo:** Garantizar que QAP opere estrictamente dentro de destinos, operaciones y presupuestos autorizados y respete revocaciones en tiempo real.
* **Disparador:** Toda operación de acceso a workspace, observación, autenticación, lectura documental, ejecución o limpieza.
* **Precondiciones:** Política base cerrada por defecto (*deny-by-default*).
* **Entradas:** Solicitud de operación y alcance efectivo.
* **Comportamiento esperado:** Exige autorización inicial explícita del workspace y política del entorno; aplica permisos independientes por capacidad; impide que URLs descubiertas, prompts o etiquetas amplíen alcance; revoca permisos de forma inmediata bloqueando llamadas futuras y cancelando operaciones en vuelo del alcance revocado; registra auditoría.
* **Salidas:** Decisión `ALLOWED` / `DENIED` y registro de auditoría.
* **Efectos persistentes:** Grants versionados, revocaciones y bitácora auditable.
* **Reglas relacionadas:** La revocación en un proyecto/tenant no afecta otros alcances.
* **Estados y excepciones:** `GRANT_ACTIVE`, `GRANT_EXPIRED`, `GRANT_REVOKED`, `SCOPE_VIOLATION_BLOCKED`.
* **Casos +/-/límite:** *(+)* Operación en origen autorizado procede sin diálogos repetitivos; *(-)* Redirección hacia dominio externo no autorizado se bloquea inmediatamente; *(Límite)* Revocación durante ejecución aborta el intento activo sin publicar resultados.
* **Criterios de aceptación:** 0 operaciones ejecutadas fuera de alcance autorizado; 100 % de revocaciones aplicadas en la misma ejecución y siguiente llamada.
* **Dependencias:** Ninguna (base de seguridad) | **Riesgo que controla:** Accesos no autorizados, SSRF, mutaciones accidentales en producción.

### REQ-SEG-002 — Manejo seguro de credenciales, sesiones y privacidad de evidencias

* **Subsistema:** Seguridad, permisos y privacidad (4.13) | **Actor:** Operador QA / QAP / Host | **Prioridad:** P0 | **Estado:** Confirmado
* **Procedencia / Autoridad:** Nivel 1 (`QAP-VISION-AUTONOMIA.md` Principio 2; D-007, D-015)
* **Objetivo:** Evitar toda exposición de secretos y PII en chat, prompts, memoria, trazas y reportes.
* **Disparador:** Configuración de perfil/credenciales, inicio de sesión o captura de evidencias.
* **Precondiciones:** Canal seguro de captura/bóveda disponible fuera del chat.
* **Entradas:** Referencia de perfil/rol y credencial capturada fuera de banda.
* **Comportamiento esperado:** Captura y almacena credenciales exclusivamente fuera del chat/LLM; aísla sesiones por `(proyecto, entorno, tenant, rol)`; enmascara campos sensibles y tokens en capturas, trazas y logs antes de persistir; rechaza argumentos con contraseñas en texto plano en la ruta ordinaria.
* **Salidas:** Referencia opaca de perfil y sesión verificada aislada.
* **Efectos persistentes:** Secretos en almacén privado excluido de control de versiones y exportaciones.
* **Reglas relacionadas:** D-007 (sesiones desacopladas del conocimiento), D-015 (artefactos locales excluidos de Git).
* **Estados y excepciones:** `CREDENTIAL_AVAILABLE`, `SESSION_VALID`, `SESSION_EXPIRED_BLOCKED`, `SECRET_IN_PROMPT_REJECTED`.
* **Casos +/-/límite:** *(+)* Login automático o handoff guarda sesión cifrada sin exponer password al LLM; *(-)* Sesión expirada bloquea sin degradar a anónimo; *(Límite)* Trazas y reportes pasan auditoría de 0 tokens/contraseñas en claro.
* **Criterios de aceptación:** 0 contraseñas/tokens en prompts, memoria, trazas, capturas o reportes; 0 degradaciones silenciosas a anónimo.
* **Dependencias:** REQ-SEG-001 | **Riesgo que controla:** Fuga de credenciales corporativas y exposición de PII.

### REQ-INT-001 — Consistencia multi-canal (MCP, CLI, CI) y extensibilidad agnóstica

* **Subsistema:** Interfaces y extensibilidad (4.14 y 4.15) | **Actor:** Usuario / Cliente MCP / CLI / CI | **Prioridad:** P0 (paridad MCP/CLI) / P2 (conectores) | **Estado:** Confirmado
* **Procedencia / Autoridad:** Nivel 1–2 (`QAP-VISION-AUTONOMIA.md` Principio 6; D-009; `07_WBS` Sec. 4)
* **Objetivo:** Garantizar comportamiento idéntico en todos los canales y permitir incorporar nuevos tipos de sistemas/dominios sin acoplar el núcleo.
* **Disparador:** Invocación desde chat/MCP, terminal CLI, pipeline CI o carga de conector opt-in.
* **Precondiciones:** Políticas y contratos del núcleo activos.
* **Entradas:** Petición en lenguaje natural, llamada MCP, comando CLI o conector externo.
* **Comportamiento esperado:** Aplica idénticas reglas de seguridad, elegibilidad de oráculos, memoria y trazabilidad en MCP, CLI y CI; permite conectar adaptadores de interfaz (web, API, móvil), lectores documentales o paquetes de dominio privados (como extensión Lendus) de forma opt-in sin que el núcleo dependa de ellos.
* **Salidas:** Veredictos, evidencias y estados consistentes sin importar el canal de origen.
* **Efectos persistentes:** Memoria y reportes unificados legibles desde cualquier canal.
* **Reglas relacionadas:** Ningún canal puede relajar compuertas de oráculo ni seguridad.
* **Estados y excepciones:** `CHANNEL_CONSISTENT`, `CONNECTOR_UNAVAILABLE_DEGRADED`.
* **Casos +/-/límite:** *(+)* Caso ejecutado por CLI o por MCP produce idéntico veredicto y trazabilidad; *(-)* Ausencia de conector Lendus no impide probar ninguna otra app web; *(Límite)* Cliente MCP sin soporte de formularios interactivos no bloquea la ruta ordinaria.
* **Criterios de aceptación:** 100 % paridad de veredicto y seguridad entre MCP y CLI para un mismo snapshot; 0 dependencias de dominio privado en el núcleo.
* **Dependencias:** REQ-SEG-001, REQ-MEM-002, REQ-ORA-001 | **Riesgo que controla:** Divergencia entre canales y acoplamiento a un único cliente o dominio.

## 22. Matriz de trazabilidad (Requisito → Necesidad → Escenario → Criterio de aceptación)

| ID Requisito | Necesidad de producto / Decisión | Escenarios del Ciclo de Vida (Sec. 4) | Criterio de aceptación verificable |
| --- | --- | --- | --- |
| **REQ-MEM-001** | No inventar verdad de negocio (D-011, Principio 5) | 4, 5, 6, 12, 15 | 0 % observaciones/sondas promovidas a requisito acreditado sin fuente |
| **REQ-MEM-002** | Continuidad multi-proyecto/tenant/host (D-005, D-019) | 1, 2, 16, 19, 20 | 0 fugas cruzadas A↔B; 100 % checkpoints recuperados tras reinicio o cambio de host |
| **REQ-MEM-003** | Gestión de conflictos, drift y portabilidad (D-005, D-018) | 5, 6, 15, 17 | 100 % conflictos de igual autoridad bloquean oráculo; 0 secretos en exportación |
| **REQ-DIS-001** | Discovery autónomo por lotes y cobertura honesta (D-016, Ciclo A) | 1, 4, 17, 19 | 0 confirmaciones por lote/módulo; contadores separados y frontera reanudable |
| **REQ-DOC-001** | Lectura y reconciliación documental (D-018) | 5, 6 | 100 % afirmaciones con origen/versión; secciones no leídas reportadas explícitamente |
| **REQ-IA-001** | Soberanía QAP y continuidad sin host (D-004, Principios 4, 6, 8) | 8, 11, 16, 19, 20 | 0 llamadas a IA por paso; 100 % trabajo determinista concluido tras corte del host |
| **REQ-PLN-001** | Planificación por riesgo, DAG y progresiva (D-008, D-017) | 7, 10, 11, 18 | 100 % respeto a orden DAG; invalidación automática ante cambios de regla/caso |
| **REQ-CAS-001** | Casos reutilizables autónomos (Principios 1, 5) | 8, 10, 16, 17 | 0 aprobaciones humanas por caso en ruta ordinaria; identidad separada de revisión |
| **REQ-ORA-001** | Oráculos reales y prevención de falsos `PASS` (D-011, D-014) | 12, 13 | 0 % falsos `PASS` en prueba «HTTP 201 sin guardado»; `INDETERMINATE` fuera de `PASS rate` |
| **REQ-RUN-001** | Ejecución aislada, determinista e idempotente (D-007, Principio 7) | 11, 16, 19 | 100 % aislamiento entre casos; 0 efectos duplicados tras corte en mutación |
| **REQ-DAT-001** | Datos sintéticos, mutaciones seguras y limpieza (D-003) | 9, 11, 12 | 0 mutaciones en entornos no autorizados; 0 PII de producción; limpieza verificada |
| **REQ-CAM-001** | Campañas autónomas estilo TestSprite (Principios 1, 3, 7) | 1, 7, 19 | 0 intervenciones rutinarias post-autorización; bloqueos locales no detienen campaña |
| **REQ-REP-001** | Evidencia íntegra, reportes y defectos (Principio 6, D-014) | 13, 14, 15 | 100 % `PASS`/`FAIL` con trazabilidad completa; 0 secretos en reportes/artefactos |
| **REQ-REG-001** | Regresión inteligente y reparación controlada (Principio 7) | 16, 17, 18 | 0 alteraciones silenciosas de expectativas; reducción medible de redescubrimiento |
| **REQ-SEG-001** | Autorización granular y revocación inmediata (D-003, Principio 3) | 2, 11, 19, 20 | 0 acciones fuera de alcance; revocación cancela operación activa y siguiente llamada |
| **REQ-SEG-002** | Secretos fuera del chat y privacidad (D-007, D-015, Principio 2) | 3, 14, 20 | 0 contraseñas/tokens en prompts, memoria, trazas o reportes |
| **REQ-INT-001** | Paridad MCP/CLI/CI y núcleo agnóstico (Principio 6, D-009) | 20 | 100 % consistencia de veredicto y políticas entre canales; 0 lógica de dominio privado |

## 23. Matriz de dependencias funcionales

| Subsistema / Requisito | Depende funcionalmente de | Provee entrada o garantía a |
| --- | --- | --- |
| **Seguridad (`REQ-SEG-001`, `REQ-SEG-002`)** | Ninguno (fundamento) | Todos los subsistemas (autorización, sesiones, privacidad) |
| **Memoria (`REQ-MEM-001`, `REQ-MEM-002`, `REQ-MEM-003`)** | Seguridad | Discovery, Ingesta, Inteligencia, Planner, Casos, Oráculos, Runner, Campañas, Reportes, Regresión |
| **Discovery (`REQ-DIS-001`)** | Seguridad, Memoria | Ingesta (reconciliación), Planner, Casos, Regresión |
| **Ingesta Documental (`REQ-DOC-001`)** | Seguridad, Memoria | Oráculos (reglas acreditadas), Planner, Casos, Reconciliación |
| **Inteligencia (`REQ-IA-001`)** | Memoria, Seguridad, Campañas | Discovery (hipótesis), Ingesta (extracción), Planner (estrategia), Casos (propuestas), Reportes (diagnóstico), Regresión (propuesta de adaptador) |
| **Oráculos (`REQ-ORA-001`)** | Memoria, Ingesta, Discovery | Casos (elegibilidad), Runner (evaluación), Reportes (veredictos) |
| **Datos (`REQ-DAT-001`)** | Seguridad, Memoria | Planner (plan de datos), Runner (preparación y limpieza) |
| **Casos (`REQ-CAS-001`)** | Memoria, Discovery, Oráculos, Inteligencia | Planner, Runner, Regresión |
| **Planner (`REQ-PLN-001`)** | Memoria, Discovery, Casos, Datos, Seguridad | Campañas, Runner, Regresión |
| **Runner (`REQ-RUN-001`)** | Seguridad, Planner, Casos, Datos, Oráculos | Reportes, Memoria (aprendizaje), Campañas |
| **Campañas (`REQ-CAM-001`)** | Seguridad, Memoria, Inteligencia, Planner, Runner | Interfaces, Reportes, Regresión |
| **Reportes y Defectos (`REQ-REP-001`)** | Oráculos, Runner, Memoria | Regresión, Interfaces, Memoria (aprendizaje) |
| **Regresión (`REQ-REG-001`)** | Memoria, Discovery, Planner, Casos, Runner, Reportes | Campañas continuas |
| **Interfaces (`REQ-INT-001`)** | Seguridad, Campañas, Memoria, Reportes | Todos los actores externos |

## 24. Métricas de aceptación y criterios de calidad

| Categoría | Métrica funcional | Criterio / Meta | Estatus de autoridad |
| --- | --- | --- | --- |
| **Autonomía ordinaria** | Intervenciones humanas por flujo A→B→C tras autorización inicial | **0** en ruta ordinaria | **Ratificada** (`QAP-VISION-AUTONOMIA.md`) |
| **Autonomía ordinaria** | Llamadas a formularios interactivos (`elicitation`) en ruta ordinaria | **0** | **Ratificada** (`QAP-VISION-AUTONOMIA.md`) |
| **Soberanía frente al host** | % de tareas deterministas en cola completadas tras desconexión del host | **100 %** dentro de presupuesto | **Derivada** (Complemento del propietario) |
| **Consumo de inferencia** | % de casos ejecutados sin llamadas a modelo por paso | **100 %** (0 llamadas en modo `DETERMINISTIC`) | **Ratificada** (`QAP-VISION-AUTONOMIA.md`) |
| **Trazabilidad** | % de `PASS` con ID de caso, revisión, intento, oráculo y evidencia | **100 %** | **Ratificada** (`QAP-VISION-AUTONOMIA.md`) |
| **Calidad de oráculos** | Tasa de falsos `PASS` en mutaciones sembradas (p. ej. `HTTP 201` sin persistencia) | **0 %** | **Derivada** (Principio 5 / D-011) |
| **Calidad de oráculos** | Proporción de casos ejecutados con oráculo acreditado (vs `INDETERMINATE`) | Reportada siempre separada del `PASS rate` | **Propuesta `[PROPUESTA]**` |
| **Detección de defectos** | Capacidad de detectar mutaciones/defectos sembrados (*mutation detection rate*) y tasa de falsos `FAIL` | Calibrar línea base por dominio en fixtures con defectos sembrados | **Requiere experimento de calibración** |
| **Independencia de testigos** | % de pruebas mutativas validadas con testigo Nivel >= 2 | **100 %** para emitir `PASS` funcional de persistencia | **Propuesta `[PROPUESTA]**` |
| **Calidad de Discovery** | Separación exacta de rutas (detectadas/inspeccionadas/reanudables/bloqueadas/fuera de alcance) | **100 %** sin inflar cobertura con enlaces no visitados | **Ratificada** (`QAP-VISION-AUTONOMIA.md`) |
| **Reutilización y regresión** | Reducción de redescubrimiento al repetir campaña o cambiar de chat | **>= 90 %** de vistas vigentes reutilizadas sin re-explorar `[PROPUESTA]` | **Requiere experimento de calibración** |
| **Repetibilidad e idempotencia** | Efectos duplicados tras interrupción/recuperación en mutaciones | **0** efectos duplicados sin reconciliación previa | **Ratificada** (`QAP-VISION-AUTONOMIA.md`) |
| **Seguridad y portabilidad** | Secretos/PII en prompts, memoria, exportaciones o reportes; fugas cruzadas A↔B | **0** | **Ratificada** (Principio 2, D-019) |

**Examen crítico de los umbrales históricos candidatos (80 % por aplicación y 75 % para efectos/cambios de estado):**

* **Alcance y justificación:** estos umbrales históricos funcionan como **metas candidatas de referencia** para medir profundidad en aplicaciones empresariales maduras con documentación y entornos staging mutables autorizados (80 % de cobertura funcional observable sobre módulos aplicables de una aplicación; 75 % de casos mutativos verificando efectos/cambios de estado reales con testigo independiente).
* **Por qué no son universalmente aplicables sin acotación:** en una aplicación desconocida sin documentación, en un entorno de solo lectura o producción, ante roles con visibilidad restringida o configuraciones desactivadas (`not_applicable`), exigir 80 % / 75 % como compuerta rígida induciría a fabricar oráculos o reportar cobertura falsa. Por ello, su estatus es **criterio candidato dependiente de alcance y política del entorno**, sujeto a calibración experimental por tipo de campaña y ratificación del propietario (ver Sección 30).

## 25. Requisitos no funcionales (separados de los funcionales)

* **RNF-01 — Confiabilidad y durabilidad:** persistencia resistente a cierres abruptos y reinicios; ningún estado operativo o evidencia confirmada debe corromperse ante cortes de proceso.
* **RNF-02 — Eficiencia de recursos (D-020):** arranque rápido al reabrir proyectos o alternar entre 3–4+ aplicaciones sin mantener navegadores abiertos en reposo; liberación verificable de procesos, locks y memoria al concluir cada tarea; presupuestos configurables de tiempo, páginas y memoria (umbrales numéricos P95/RAM pendientes de medición empírica en equipo real, conforme a `09_CONTRATO` Sec. 5).
* **RNF-03 — Portabilidad y distribución (D-009):** operación local sencilla (experiencia `npx`-first sin exigir compilación manual ni servicios externos obligatorios), con soporte multiplataforma (Windows, Linux y macOS) para todos los flujos ordinarios y sin dependencia exclusiva de diálogos de un solo sistema operativo.
* **RNF-04 — Seguridad y privacidad:** aislamiento estricto entre proyectos/entornos/tenants, confidencialidad de credenciales y sesiones en reposo y en tránsito, sanitización sistemática de artefactos y cumplimiento de principio de mínimo privilegio.
* **RNF-05 — Auditabilidad e integridad:** inmutabilidad de observaciones, intentos y evidencias históricas con verificación de integridad para detectar alteraciones accidentales o corrupción.
* **RNF-06 — Interoperabilidad:** compatibilidad con múltiples clientes MCP, CLI, pipelines CI/CD y modelos de IA sin dependencia de funciones propietarias no estándar de un único cliente.
* **RNF-07 — Mantenibilidad y extensibilidad:** separación limpia entre núcleo universal y conectores/extensiones opt-in de interfaz, documentación o dominio.

## 26. Contradicciones y decisiones abiertas

| Conflicto funcional | Alternativas | Consecuencias | Propuesta justificada `[PROPUESTA]` (pendiente de ratificación) |
| --- | --- | --- | --- |
| **1. Autonomía frente a seguridad** | *(A)* Pedir confirmación en cada acción riesgosa; *(B)* Política previa explícita por entorno + bloqueo selectivo automático. | *(A)* Destruye autonomía (estilo TestSprite); *(B)* Exige configuración clara inicial pero mantiene 0 interrupciones ordinarias. | **Alternativa B** (alineada con `QAP-VISION-AUTONOMIA.md` Principios 1–3): autorización inicial única de workspace/entorno/política; bloqueo local silencioso ante excesos. |
| **2. Cero intervenciones ordinarias frente a autoridad de negocio** | *(A)* Dejar que la IA asuma reglas de negocio; *(B)* Exigir aprobación humana de cada caso (modelo histórico P0); *(C)* Autonomía total sobre evidencia estructural + fuentes acreditadas, marcando `INDETERMINATE` cuando falte autoridad. | *(A)* Viola D-011 y genera falsos `PASS`; *(B)* Anula autonomía; *(C)* Equilibra autonomía y rigor. | **Alternativa C**: 0 aprobaciones humanas por caso ordinario; solo preguntar al humano ante conflictos reales de autoridad o reglas críticas faltantes. |
| **3. Verificación universal frente a ausencia de fuentes confiables** | *(A)* Bloquear toda prueba hasta tener manual; *(B)* Permitir pruebas estructurales/observacionales etiquetadas claramente y separar `INDETERMINATE` de `PASS`. | *(A)* Impide probar apps desconocidas (viola D-006); *(B)* Aporta valor inmediato sin mentir sobre conformidad de negocio. | **Alternativa B**: distinguir explícitamente conformidad estructural (desde evidencia) de conformidad de negocio (desde fuente acreditada). |
| **4. Repetición determinista frente a cambios de entorno/UI** | *(A)* Fallar siempre y exigir edición manual; *(B)* Auto-reparar silenciosamente; *(C)* Ejecutar determinista, detectar drift y proponer nueva revisión de adaptador sin alterar expectativa. | *(A)* Alto mantenimiento; *(B)* Oculta defectos reales; *(C)* Mantiene determinismo y auditabilidad. | **Alternativa C**: toda adaptación de localizador genera revisión nueva y preserva el intento fallido original. |
| **5. Ejecución rápida frente a aislamiento** | *(A)* Compartir sesión/contexto entre casos; *(B)* Contexto limpio por caso con reutilización controlada de sesión autenticada. | *(A)* Rápido pero produce falsos resultados por contaminación; *(B)* Ligeramente mayor costo de arranque pero veredictos confiables. | **Alternativa B**: aislamiento por caso obligatorio por defecto; continuidad de contexto solo en flujos multi-paso declarados explícitamente. |
| **6. Persistencia del conocimiento frente a privacidad** | *(A)* Guardar sesiones/payloads crudos en memoria para facilitar re-uso; *(B)* Separar estrictamente conocimiento sanitizado de sesiones/secretos locales. | *(A)* Riesgo grave de fuga de PII/credenciales; *(B)* Requiere capas separadas pero permite portabilidad segura. | **Alternativa B** (ratificada por D-007 y D-015). |
| **7. Independencia del cliente frente a capacidades del host** | *(A)* Depender de `elicitation` o diálogos propios de un SO; *(B)* Ruta ordinaria sin interacción modal y canal seguro desacoplado multiplataforma para secretos/autorización inicial. | *(A)* Rompe en clientes como Antigravity o en Linux/macOS; *(B)* Garantiza portabilidad real. | **Alternativa B**: nunca depender de `elicitation` en ruta ordinaria. |
| **8. Automatización de escrituras frente a prevención de efectos duplicados** | *(A)* Reintentar mutaciones ante cualquier error; *(B)* Prohibir mutaciones permanentemente; *(C)* Reconciliar estado real antes de reintentar y exigir datos sintéticos + limpieza/confinamiento. | *(A)* Duplica operaciones financieras/de negocio; *(B)* Impide probar procesos críticos; *(C)* Habilita mutaciones seguras en staging. | **Alternativa C** para P1+, manteniendo mutaciones bloqueadas por defecto en entornos sensibles o no autorizados. |

## 27. Riesgos funcionales

1. **Tautología de oráculos (Riesgo crítico):** validar la aplicación contra observaciones de sí misma y declarar `PASS` sobre defectos existentes. *Mitigación funcional:* `REQ-MEM-001`, `REQ-ORA-001`.
2. **Falsos `PASS` por testigos superficiales (Riesgo crítico):** aceptar `HTTP 201`, visibilidad básica o `not_run` como éxito funcional. *Mitigación funcional:* `REQ-ORA-001`, separación de `INDETERMINATE` y `BLOCKED`.
3. **Efectos duplicados o contaminación en entornos empresariales (Riesgo crítico):** reintentar ciegamente una operación financiera/mutativa tras timeout o ejecutar mutaciones en producción/staging compartido sin limpieza. *Mitigación funcional:* `REQ-RUN-001`, `REQ-DAT-001`, `REQ-SEG-001`.
4. **Fuga de credenciales o PII hacia el LLM o artefactos (Riesgo crítico):** paso de contraseñas por argumentos de chat o trazas sin redactar. *Mitigación funcional:* `REQ-SEG-002`.
5. **Parálisis por fricción humana (Riesgo alto):** solicitar confirmaciones repetitivas por ruta, módulo o caso, alejando a QAP de la autonomía estilo TestSprite. *Mitigación funcional:* `REQ-CAM-001`, `REQ-CAS-001`, `REQ-DIS-001`.
6. **Dependencia frágil del host o del chat (Riesgo alto):** perder el estado de la campaña o detener ejecuciones deterministas cuando el host se desconecta o cambia de conversación. *Mitigación funcional:* `REQ-MEM-002`, `REQ-IA-001`.
7. **Auto-reparación destructiva de pruebas (Riesgo medio-alto):** ajustar una aserción para que una prueba «vuelva a pasar» ocultando una regresión de negocio. *Mitigación funcional:* `REQ-REG-001`.
8. **Acoplamiento prematuro a LENDUS CORE (Riesgo medio):** introducir conceptos crediticios específicos en el núcleo impidiendo usar QAP en otros sectores. *Mitigación funcional:* `REQ-INT-001`.

## 28. Casos de aceptación end-to-end

1. **E2E-01 — Autonomía inicial estilo TestSprite («Quiero probar este sistema»):** En una aplicación web desconocida (fixture autorizado), el usuario solo autoriza el workspace y el destino inicial. Con **0 intervenciones adicionales y 0 `elicitation**`, QAP descubre vistas/controles en lotes automáticos, propone y materializa al menos un caso positivo y uno negativo sustentados, ejecuta deterministamente en contexto limpio, captura evidencias sanitizadas y entrega reporte con 100 % de trazabilidad.
2. **E2E-02 — Prevención de falso `PASS` («HTTP 201 sin persistencia»):** En un fixture con defecto sembrado donde un endpoint responde `HTTP 201` y muestra mensaje de éxito en UI sin guardar el registro, QAP ejecuta verificación con testigo independiente (Nivel 2), rechaza declarar `PASS`, emite `FAIL` y genera un paquete de defecto reproducible.
3. **E2E-03 — Soberanía y continuidad ante desconexión del host:** Con una campaña en curso que tiene una cola de casos materializados y una vista nueva pendiente de diseño, se desconecta el host MCP. QAP completa automáticamente la ejecución determinista, evalúa oráculos y publica reportes; al reconectar un **host/modelo distinto**, recupera la cola de razonamiento pendiente sin perder avance ni repetir pruebas ya ejecutadas.
4. **E2E-04 — Reconciliación documental y conflictos por tenant/rol:** Con dos tenants y dos roles sobre una misma aplicación, más un manual con una regla acreditada y una contradicción entre dos fuentes, QAP aplica la regla por alcance exacto, marca el conflicto como `INDETERMINATE`/`CONFLICTO_ABIERTO`, impide fugas cruzadas A↔B y continúa ejecutando el resto de casos sin detener la campaña.
5. **E2E-05 — Mutación segura, corte de proceso y limpieza sin duplicación:** En un staging aislado autorizado para escritura, QAP crea un dataset sintético sin PII, sufre una interrupción simulada tras enviar una operación mutativa, reconcilia el estado real al recuperar sin duplicar el efecto, evalúa conformidad y ejecuta limpieza en orden inverso verificando cero residuos.
6. **E2E-06 — Revocación inmediata en vuelo y paridad MCP/CLI:** Se revoca el permiso de ejecución mientras corre una suite; QAP aborta el intento activo sin publicar resultados. Posteriormente, la misma suite ejecutada por CLI y por MCP sobre un snapshot congelado produce idéntico veredicto, sin que `not_run` se reporte jamás como `PASS`.
7. **E2E-07 — Autonomía continua y regresión selectiva tras cambio:** Tras modificar un selector y una regla en un módulo de una app previamente conocida, QAP detecta drift, selecciona solo los casos afectados y dependientes en modo `DETERMINISTIC`, propone una nueva revisión de adaptador para el selector sin alterar expectativas y detecta el fallo real por cambio de regla sin redescubrir toda la aplicación.

## 29. Priorización por capacidad y dependencia

1. **Ola 1 — Núcleo Autónomo Verificable (MVP Autónomo):** `REQ-SEG-001`, `REQ-SEG-002` (política previa, secretos fuera del chat, revocación) → `REQ-MEM-001`, `REQ-MEM-002` (planos epistemológicos, aislamiento multi-proyecto/tenant, continuidad de progreso) → `REQ-DIS-001` (Discovery autónomo por lotes reanudables) → `REQ-IA-001`, `REQ-CAM-001` (soberanía de QAP, continuación determinista sin host, 0 intervenciones ordinarias) → `REQ-CAS-001`, `REQ-PLN-001`, `REQ-ORA-001` (oráculos estructurales + reglas acreditadas básicas), `REQ-RUN-001` (aislamiento por caso), `REQ-REP-001` (evidencias sanitizadas y trazabilidad), `REQ-INT-001` (paridad MCP/CLI).
2. **Ola 2 — Profundidad Empresarial Configurable (P1):** `REQ-DOC-001` (ingesta compleja y reconciliación completa), `REQ-MEM-003` (contradicciones, obsolescencia y portabilidad), `REQ-ORA-001` avanzado (persistencia Nivel 2–3, cálculos monetarios, conciliaciones, RBAC negativo, asíncronos), `REQ-DAT-001` (datasets sintéticos con DAG, mutaciones autorizadas, reconciliación de idempotencia y limpieza), `REQ-REP-001` avanzado (gestión y deduplicación de defectos), Discovery profundo en SPAs/APIs/tablas/multi-rol.
3. **Ola 3 — Autonomía Continua a Escala y Ecosistema (P2–P3):** `REQ-REG-001` (regresión inteligente por impacto/riesgo, flakiness, reparación controlada de adaptadores en nueva revisión), modo `MANAGED` opcional para campañas desatendidas, ejecución paralela a escala, comparativas entre instancias/versiones y conectores/extensiones opt-in (incluyendo extensión privada para LENDUS CORE).

## 30. Preguntas estrictamente necesarias para ratificación del propietario

1. **Umbrales candidatos 80 % / 75 %:** ¿Deseas ratificar 80 % de cobertura funcional por aplicación y 75 % de verificación de efectos/cambios de estado como metas exclusivas de **P1 en entornos staging mutables con documentación acreditada**, manteniéndolos fuera de las compuertas obligatorias del MVP read-only?
2. **Credenciales en modo Stdio/HOST:** ¿Ratificas la prohibición absoluta de recibir contraseñas en argumentos MCP/chat incluso en entornos locales/staging (eliminando cualquier bypass de conveniencia), exigiendo siempre captura fuera de banda?
3. **Modo `MANAGED` (inteligencia desatendida):** ¿El soporte para campañas desatendidas sin cliente conectado (modo `MANAGED`) pertenece a Ola 3 (P2/P3) o necesitas habilitarlo antes para regresiones nocturnas en CI?
4. **Limpieza en sistemas contables inmutables (caso tipo LENDUS):** Cuando una operación mutativa genera registros inmutables (p. ej. pólizas o desembolsos que no admiten borrado físico), ¿la política aceptada de QAP será **compensación funcional autorizada**, **confinamiento en tenant/entorno desechable**, o ambas según política del entorno?
5. **Política de `PASS` estructural limitado:** Cuando en una aplicación desconocida la única evidencia disponible proviene de la misma vista bajo prueba (testigo Nivel 1), ¿debe QAP reportarlo como `PASS` estructural explícitamente etiquetado (separado de conformidad de negocio) o relegarlo a `INDETERMINATE`?

## Matriz de cobertura de la especificación funcional

| Área / Dimensión requerida | Estado en esta especificación | Secciones que la cubren | Elementos pendientes (solo ratificación / fase posterior) |
| --- | --- | --- | --- |
| **Visión, actores y límites del producto** | Especificado completo | Sec. 1, 2, 3, Adenda | Ninguno |
| **Ciclo de vida completo (20 escenarios)** | Especificado completo (20/20) | Sec. 4, Adenda | Ninguno |
| **4.1 Memoria, conocimiento y aprendizaje** | Especificado completo (modelo conceptual, 18 entidades, ciclos, autoridad, anomalías, consultas) | Sec. 6, Adenda, `REQ-MEM-001..003` | Ninguno |
| **4.2 Discovery y comprensión de aplicaciones** | Especificado completo (web, SPA, API, auth, forms, tablas, estados, roles, lotes, reanudación) | Sec. 7, Adenda, `REQ-DIS-001` | Ninguno |
| **4.3 Ingesta y comprensión documental** | Especificado completo (extracción, metadatos, ambigüedad, reconciliación, autoridad) | Sec. 8, `REQ-DOC-001` | Decisión de formatos nativos (PDF/DOCX) en P0 vs P1 |
| **4.4 Inteligencia artificial y agentes** | Especificado completo (`HOST`, `MANAGED`, `DETERMINISTIC`, desconexión del host, soberanía) | Sec. 9, Adenda, `REQ-IA-001` | Prioridad de modo `MANAGED` (Pregunta 3) |
| **4.5 Planner y estrategia de pruebas** | Especificado completo (4 artefactos, riesgo, DAG, datos, regresión, adaptación) | Sec. 10, Adenda, `REQ-PLN-001` | Ninguno |
| **4.6 Generación y gestión de casos** | Especificado completo (identidad vs revisión, tipos, abstención, duplicación, variantes) | Sec. 11, `REQ-CAS-001` | Ninguno |
| **4.7 Oráculos y validación funcional** | Especificado completo (7 tipos, 6 veredictos, 4 niveles de testigos, anti-«HTTP 201 sin guardado») | Sec. 12, `REQ-ORA-001` | Etiquetado de testigo Nivel 1 (Pregunta 5) |
| **4.8 Runner y ejecución de pruebas** | Especificado completo (aislamiento, sesiones, 3 éxitos separados, idempotencia/reconciliación) | Sec. 13, Adenda, `REQ-RUN-001` | Ninguno |
| **4.9 Datos de prueba, operaciones y limpieza** | Especificado completo (sintéticos, DAG, lectura vs escritura, limpieza, protección prod) | Sec. 14, `REQ-DAT-001` | Estrategia en registros inmutables (Pregunta 4) |
| **4.10 Orquestación y campañas autónomas** | Especificado completo (estados, bloqueo local vs global, continuación sin host) | Sec. 15, Adenda, `REQ-CAM-001` | Ninguno |
| **4.11 Evidencias, reportes y defectos** | Especificado completo (trazabilidad, reportes, ciclo de defectos, deduplicación) | Sec. 16, `REQ-REP-001` | Ninguno |
| **4.12 Regresión y evolución** | Especificado completo (drift, selección, flakiness, reparación controlada sin alterar oráculo) | Sec. 17, `REQ-REG-001` | Ninguno |
| **4.13 Seguridad, permisos y privacidad** | Especificado completo (8 capacidades, revocación inmediata, secretos fuera del chat) | Sec. 18, `REQ-SEG-001..002` | Ratificación de cero bypass de credenciales (Pregunta 2) |
| **4.14–4.15 Interfaces y extensibilidad** | Especificado completo (paridad MCP/CLI/CI, núcleo agnóstico vs conectores opt-in) | Sec. 19, `REQ-INT-001` | Ninguno |
| **Validación empresarial (LENDUS CORE)** | Especificado sobre ejemplos sintéticos sin inventar reglas privadas | Sec. 20 | Reglas de negocio, fórmulas, roles y APIs reales de LENDUS CORE (requiere fuente primaria) |
| **Escenarios transversales (12 dimensiones)** | Integrados en escenarios, catálogo (`+/-`/límite) y E2E | Sec. 4, 21, 28 | Ninguno |
| **Métricas, RNF, contradicciones, riesgos, E2E y priorización** | Especificado completo | Sec. 22–30 | Ratificación de umbrales 80 % / 75 % (Pregunta 1) y calibración empírica de baselines |

Con ambas entregas queda respondida integralmente la pregunta de esta etapa: **qué debe hacer QAP, qué debe conocer, cómo debe comportarse (incluyendo autonomía inicial/continua estilo TestSprite y soberanía ante desconexión del host), qué resultados debe garantizar y cómo se comprobará cada capacidad**, lista para servir de entrada a la Etapa 3 (análisis de brechas contra `develop` y diseño de la arquitectura objetivo).