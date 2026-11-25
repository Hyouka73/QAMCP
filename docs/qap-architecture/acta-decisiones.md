# Acta de decisiones del propietario

Fuente primaria: encargo del propietario «QAP — Consolidación definitiva de requisitos, decisiones y antecedentes arquitectónicos», recibido para esta consolidación el 24 de noviembre de 2026, sección 5. Se incorpora el contenido de D01–D21 para que Gemini Neon lo pueda revisar desde Git. Las anotaciones de ratificación y concordancia son la lectura documental de esta etapa. DP remite al [registro de cuestiones abiertas](cuestiones-abiertas.md).

**Acto posterior (25 de noviembre de 2026):** [DE-01–05 ratificadas](cierre-av-01/acta-ratificacion-de.md). Sustituye reservas históricas de política, sin cambiar D01–D21 ni condiciones de pruebas/permisos. [Especificación consolidada](especificacion-consolidada.md). Texto histórico preservado.

**Ampliación posterior ratificada AC-01:** [acta](cierre-av-01/acta-ratificacion-ac01.md). B/A/B/A/A/A/A; preserva D01–D21 y DE-01–05; [especificación §12](especificacion-consolidada.md). No autorización operacional.

## D01 · Producto listo para uso real

**Estado y naturaleza.** Requisito expreso de producto.

**Concordancia.** DP-01, DP-02, DP-10. La salida histórica del MVP pasa a antecedente. La aceptación se rige por D21.

QAP debe entregarse como una herramienta funcional, autónoma y lista para utilizarse en proyectos QA empresariales reales.

No estamos construyendo otro MVP, demostración o prueba de concepto como entregable.

El objetivo de autonomía es comparable a TestSprite, sin asumir paridad comercial hasta que pueda acreditarse.

Las pruebas internas son instrumentos de aceptación del producto, no sustitutos de las funcionalidades finales.

No reducir el alcance a navegación, inventarios o comprobaciones de visibilidad.

## D02 · Modalidad inicial local

**Estado y naturaleza.** Decisión expresa de lanzamiento.

**Concordancia.** DP-07. Local primero y preparación para un repositorio concurrente. SQLite es candidato. Puerto, driver, migraciones y búsqueda siguen abiertos.

El primer lanzamiento será una herramienta local y autónoma.

- Persistencia local durable.
- SQLite como candidato para el almacenamiento inicial.
- Separación entre proyectos, aplicaciones, instancias, entornos, tenants, perfiles, roles y configuraciones.
- Arquitectura preparada para PostgreSQL concurrente y modalidad compartida posterior, sin obligar a desplegar infraestructura adicional desde el inicio.

La modalidad multiusuario no se elimina del alcance futuro.

## D03 · Modos de inteligencia

**Estado y naturaleza.** Decisión expresa de lanzamiento.

**Concordancia.** DP-06. HOST y DETERMINISTIC son iniciales. MANAGED se difiere. Proveedor y fecha de la fase posterior siguen abiertos.

El primer lanzamiento incluirá:

- HOST: utiliza el razonamiento del agente conectado.
- DETERMINISTIC: ejecuta planes acreditados y congelados sin inferencia por cada paso.

MANAGED queda para una fase posterior.

QAP no requerirá una API adicional de modelos para operar en los modos iniciales.

Si el HOST se desconecta:

- Continúa las tareas deterministas autorizadas que sean ejecutables.
- Conserva las tareas que necesitan razonamiento nuevo.
- Reanuda el trabajo cuando se conecte nuevamente un agente compatible.
- No pierde conocimiento, casos, planes, resultados ni progreso.

## D04 · Autonomía integral

**Estado y naturaleza.** Decisión expresa de operación.

**Concordancia.** DP-01. Elegibilidad por política y fuente acreditada. Se resuelve la aprobación ordinaria por caso.

QAP debe gestionar el ciclo completo:

Intención en lenguaje natural → configuración y autorización inicial → Discovery → conocimiento → planificación → preparación de datos → ejecución → evaluación de oráculos → evidencia → reporte → regresión → aprendizaje y actualización de conocimiento.

El usuario no debe aprobar individualmente cada caso ordinario que ya se encuentre dentro de los permisos autorizados.

Los conflictos de autoridad, permisos insuficientes y decisiones empresariales reales deben generar bloqueos explícitos.

La autonomía no significa ampliar permisos por iniciativa propia.

## D05 · Memoria y continuidad

**Estado y naturaleza.** Requisitos expresos de producto.

**Concordancia.** DP-03, DP-07, DP-09. Se exige continuidad y separación de secretos. Precedencia y autoridad del tenant requieren contrato.

QAP debe conservar y reutilizar:

- Inventarios de módulos, páginas, controles y estados.
- Configuraciones y variantes de la aplicación.
- Reglas funcionales y de negocio.
- Roles, perfiles y permisos observados.
- Relaciones entre módulos.
- Dependencias funcionales y flujos E2E.
- Casos, oráculos, datos y planes.
- Resultados, defectos, firmas de fallo y aprendizaje histórico.
- Estado pendiente de las campañas.

Distinguir observaciones, inferencias, requisitos acreditados y resultados de ejecución.

Una observación del sistema no debe convertirse automáticamente en una regla correcta de negocio.

El agente debe poder iniciar una campaña, cerrar la conversación y continuarla con otro agente sin repetir trabajo vigente ni cargar innecesariamente todo el contexto.

Mantener revisiones, procedencia, invalidación por cambios y protección de ediciones manuales.

## D06 · Pruebas E2E completas

**Estado y naturaleza.** Requisitos expresos de lanzamiento.

**Concordancia.** DP-04, DP-05. Flujo acreditado por efectos. La reconciliación se aplica a efectos ya confirmados y la atomicidad a la publicación interna.

QAP debe ser capaz de ejecutar flujos completos, no únicamente casos aislados.

Ejemplo representativo:

Registrar cliente → configurar condiciones → crear solicitud → aprobarla → generar contrato → comprobar efectos → consultar reportes.

Debe gestionar:

- Prerrequisitos.
- Transferencia de datos entre pasos y módulos.
- Múltiples roles.
- Dependencias entre casos.
- Preparación de datos.
- Estados intermedios.
- Evidencias por paso.
- Verificación de efectos.
- Limpieza o compensación autorizada.
- Continuidad y recuperación ante fallos.

No se aceptan acciones técnicamente exitosas como sustituto de un resultado funcional demostrado.

## D07 · Escrituras y permisos

**Estado y naturaleza.** Política de producto expresamente autorizada.

**Concordancia.** DP-03, DP-05, DP-09, DP-14. Las autorizaciones concretas, compensaciones y tratamiento de operaciones críticas se fijan por entorno.

El propietario autoriza como política de producto:

- Escrituras automáticas únicamente en entornos QA expresamente autorizados.
- Producción exclusivamente para lecturas acreditadas.
- Denegación por defecto.
- Permisos delimitados por destino, entorno, identidad, operación y datos.
- Revocación efectiva durante campañas activas.
- Bloqueo de operaciones cuyo efecto o autoridad no pueda determinarse.

El nombre «staging» o un método HTTP GET no acreditan por sí mismos que una operación sea segura.

Evaluar estrategias de limpieza por entorno: eliminación, compensación o aislamiento de datos.

Las operaciones financieras, contables o irreversibles requieren tratamiento específico.

No se autoriza acceso indiscriminado a sistemas reales durante esta etapa documental.

## D08 · UTCP, APIs y preparación de datos

**Estado y naturaleza.** Requisitos expresos de interoperabilidad.

**Concordancia.** DP-05, DP-13. UTCP y OpenAPI entran en el alcance. El SDK, la equivalencia y el orden de adopción se deciden tras EXP-05.

QAP debe poder utilizar APIs accesibles y autorizadas cuando resulten útiles.

El propósito incluye preparar clientes, contratos, solicitudes y otros prerrequisitos sin ejecutar innecesariamente todos los flujos visuales anteriores.

Debe contemplarse:

- OpenAPI.
- UTCP.
- APIs documentadas o acreditadas.
- Descubrimiento autorizado de contratos y operaciones.
- Preparación de datos mediante planes versionados.
- Idempotencia y reconciliación.
- Verificación de efectos.
- Control de permisos.
- Trazabilidad de los datos creados.

La utilización de APIs no es obligatoria en todos los casos.

No exigir acceso directo a la base de datos de la aplicación probada.

Los testigos de base de datos empleados en laboratorios sintéticos no constituyen una dependencia de producción de QAP.

## D09 · Consultas entre instancias

**Estado y naturaleza.** Requisitos expresos de autoridad y alcance.

**Concordancia.** DP-09, DP-14. Solo lectura estricta acreditada en destino. Quedan por definir destinos, fuentes y permisos concretos.

QAP debe poder consultar información y configuraciones de otras instancias cuando estén autorizadas, para comprender condiciones de negocio o preparar datos de prueba.

La instancia de referencia debe permanecer estrictamente en modo de solo lectura.

No transferir sesiones, secretos o credenciales entre instancias.

No copiar indiscriminadamente datos personales o información sensible.

Toda transferencia de conocimiento o configuración debe preservar procedencia, alcance y autorización.

Si el destino no permite acreditar lectura segura, bloquear la operación.

## D10 · Ingesta documental corporativa y técnica

**Estado y naturaleza.** Requisitos expresos de lanzamiento.

**Concordancia.** DP-08. Formatos corporativos obligatorios desde el lanzamiento. Selección de parsers, cobertura OCR y corpus siguen abiertos.

El primer lanzamiento debe soportar documentos corporativos y técnicos sin exigir conversiones manuales como flujo ordinario.

Contemplar:

- PDF.
- DOCX.
- Excel.
- Markdown.
- Texto.
- JSON.
- YAML.
- OpenAPI.

La ingesta debe preservar estructura, tablas, versiones, procedencia y localizadores de la información.

Debe detectar:

- Reglas contradictorias.
- Información incompleta.
- Documentos obsoletos.
- Secciones o tablas no interpretables.
- Diferencias entre documentación y comportamiento observado.

Los documentos escaneados deben contemplarse explícitamente, incluyendo las limitaciones de extracción y posibles mecanismos OCR.

No inventar reglas cuando no exista evidencia suficiente.

## D11 · Validación funcional de reportes PDF y Excel

**Estado y naturaleza.** Requisitos expresos de lanzamiento.

**Concordancia.** DP-04, DP-08, DP-10. La validación del reporte emitido requiere su propio oráculo. Las fuentes y tolerancias se acreditan por dominio.

Esta capacidad es obligatoria desde el primer lanzamiento y es diferente de la ingesta de manuales.

QAP debe poder:

- Navegar a módulos de reportes.
- Configurar filtros, fechas y agrupaciones.
- Descargar documentos generados por el sistema.
- Abrir y analizar PDF y Excel.
- Extraer tablas, filas, columnas, valores, fórmulas y totales.
- Interpretar múltiples hojas y tablas distribuidas en páginas.
- Comparar datos contra fuentes autorizadas.
- Validar registros individuales, no solamente totales.
- Detectar duplicados, faltantes, cálculos incorrectos, errores de redondeo, inconsistencias y filtros ignorados.
- Registrar discrepancias exactas y su procedencia.
- Distinguir fórmulas de valores almacenados en caché.
- Abstenerse cuando la extracción o la fuente de comparación sea insuficiente.

Las fuentes podrán incluir APIs, interfaz del sistema, otros documentos y reglas de negocio acreditadas.

Una API es opcional y no se considera independiente automáticamente.

No exigir conexión directa a la base de datos del sistema.

## D12 · Oráculos y veracidad de resultados

**Estado y naturaleza.** Requisitos expresos de veracidad.

**Concordancia.** DP-02, DP-04. Separación estructural y funcional. Quedan abiertos el contrato de testigos y la precedencia exacta en casos mixtos.

Separar:

- Resultado técnico de ejecución.
- Veredicto funcional.
- Estado de limpieza.
- Disponibilidad e integridad de evidencia.

Un HTTP 200/201, un clic exitoso o un elemento visible no demuestran por sí mismos el cumplimiento de una regla de negocio.

Preservar la distinción entre comprobaciones estructurales y funcionales.

Para verificar persistencia o efectos críticos, exigir un testigo suficientemente independiente y acreditado.

Si no existe evidencia suficiente, emitir un estado explícito de incertidumbre, bloqueo o error conforme a la taxonomía definida.

Incorporar las lecciones de Recovery e Hydrogen R2 sobre el falso PASS de HTTP 201 con rollback.

No reutilizar ciegamente su código experimental.

## D13 · Compatibilidad con agentes

**Estado y naturaleza.** Requisitos expresos de interoperabilidad.

**Concordancia.** DP-11, DP-12, DP-15. Se descarta el bloqueo global por patrones. Skill y hooks informativos opt-in son recomendaciones. Versiones, muestras y umbral pendientes.

QAP será independiente del proveedor de inteligencia artificial.

Debe diseñarse para clientes compatibles con MCP y disponer de CLI como interfaz alternativa.

Verificar expresamente la interoperabilidad con:

- Antigravity.
- Codex.
- Claude Code.
- Gemini CLI.
- Otros clientes MCP representativos.

No crear núcleos independientes por agente.

Mantener paridad de permisos, casos, memoria, ejecución, veredictos y reportes entre interfaces.

La compatibilidad general es un objetivo de diseño; no afirmar compatibilidad universal verificada sin evidencia.

El agente debe ser orientado eficazmente a utilizar QAP para pruebas funcionales, en lugar de generar scripts externos innecesarios.

Contemplar Skills e instrucciones de integración por host.

No imponer bloqueos globales por patrones de shell que interfieran con pruebas unitarias legítimas.

Solo QAP puede acreditar sus ejecuciones canónicas.

## D14 · Sistemas operativos, navegadores e instalación

**Estado y naturaleza.** Soporte obligatorio de sistemas operativos y candidatos técnicos.

**Concordancia.** DP-12, DP-15. Windows, macOS y Linux desde el primer lanzamiento. Chromium y Shell son candidatos, con matriz navegador/modalidad por verificar.

Soporte obligatorio desde el primer lanzamiento para Windows, macOS y Linux.

Contemplar:

- Chromium como motor principal candidato.
- Chromium Headless Shell como candidato ligero.
- Chromium completo para ejecución visible o cuando sea necesario.
- Google Chrome.
- Microsoft Edge.
- Firefox.
- WebKit.

La disponibilidad de cada navegador debe distinguirse de las capacidades efectivamente verificadas por modalidad.

Instalar navegadores bajo demanda y evitar descargas innecesarias.

QAP debe proporcionar instalación sencilla, diagnóstico de dependencias, caché gestionada y manejo de problemas de configuración.

No desarrollar un navegador propio sin una justificación técnica extraordinaria.

La elección del motor ligero está condicionada a preservar todas las capacidades requeridas, especialmente fidelidad visual, aislamiento, pruebas funcionales y captura protegida.

## D15 · Ejecución visible, segundo plano y fidelidad visual

**Estado y naturaleza.** Requisitos expresos de preferencias y fidelidad.

**Concordancia.** DP-12, DP-15. Elección de modalidad, navegador y grabación por proyecto. El modo predeterminado y la equivalencia se validan con evidencia.

El propietario debe poder elegir mediante lenguaje natural:

- Ver las pruebas en tiempo real.
- Ejecutarlas en segundo plano.
- Seleccionar navegador.
- Solicitar grabaciones conforme a la política de evidencia.
- Priorizar ahorro de recursos o rendimiento.

Guardar preferencias por proyecto y permitir modificarlas.

Preguntar solo cuando la decisión sea necesaria; no repetir preguntas respondidas.

La ejecución headless no debe producir deliberadamente una aplicación sin estilos.

Preservar CSS, JavaScript, imágenes, fuentes, hidratación SPA y recursos autorizados necesarios para el funcionamiento real.

Incorporar como antecedente la incidencia previa donde un filtro de red bloqueó recursos legítimos de CSS, JavaScript e imágenes.

La optimización de recursos no debe degradar silenciosamente la aplicación probada.

## D16 · Recursos y concurrencia

**Estado y naturaleza.** Requisitos expresos de lanzamiento.

**Concordancia.** DP-12, DP-15. Eficiencia y control de recursos obligatorios. Configuración inicial, hardware y umbrales se fijan con mediciones.

La eficiencia de recursos constituye un requisito obligatorio del primer lanzamiento.

El agente debe ser capaz de planificar la concurrencia de las pruebas.

QAP debe controlar técnicamente su ejecución según:

- RAM disponible.
- Presión de memoria.
- CPU.
- Espacio disponible.
- Dependencias de casos.
- Conflictos de datos.
- Sesiones y roles.
- Permisos.
- Presupuesto de ejecución.

Contemplar reutilización segura de navegadores, aislamiento por contexto, reciclaje de procesos, cancelación, limpieza y recuperación.

Las pruebas que comparten recursos incompatibles o datos dependientes no deben ejecutarse simultáneamente.

QAP debe determinar y documentar requisitos mínimos y recomendados de hardware por modalidad mediante mediciones reales.

No fijar consumos arbitrarios de memoria como garantías.

No desactivar controles de seguridad, calidad o evidencia silenciosamente para ahorrar recursos.

## D17 · Idiomas e internacionalización

**Estado y naturaleza.** Requisitos expresos de lanzamiento.

**Concordancia.** DP-06, DP-08, DP-10. HOST para razonamiento y replay determinista. Corpus inicial y localización del producto sujetos a decisión técnica.

El razonamiento lingüístico debe aprovechar el HOST.

No desarrollar un modelo propio de traducción ni exigir APIs adicionales.

El agente debe poder:

- Interpretar instrucciones en el idioma utilizado por el usuario.
- Generar conclusiones y comentarios en el idioma solicitado.
- Proponer cambios de idioma durante una campaña.
- Detectar posibles errores de traducción.

QAP debe:

- Ejecutar los cambios de idioma.
- Persistir preferencias y expectativas acreditadas.
- Verificar textos y claves esperadas.
- Detectar truncamientos y traducciones faltantes cuando exista un oráculo adecuado.
- Validar fechas, monedas, decimales, zonas horarias y formatos regionales.
- Repetir comprobaciones deterministas sin requerir nueva inferencia.
- Mantener códigos y resultados estructurados independientes del idioma.

No limitar las aplicaciones probadas únicamente al español y al inglés.

La estrategia concreta de localización de la interfaz y reportes propios de QAP deberá documentarse como decisión técnica si todavía no está resuelta.

## D18 · Captura multimedia privada controlada

**Estado y naturaleza.** Política expresamente seleccionada, con riesgo residual y activación condicionada.

**Concordancia.** DP-03, DP-12, DP-15. Los cuatro permisos son distintos. AS-04 impide dar por acreditada la exclusión preventiva. Activación sujeta a verificación y gestión del riesgo residual.

El propietario seleccionó captura privada controlada con autorización, cifrado, restricciones y gestión explícita del riesgo residual.

Preservar:

- Videos WebM auténticos.
- Capturas PNG.
- Evidencias por paso.
- Geometría coherente con el viewport.
- Reportes con reproducción y navegación por evidencias.
- Visor protegido.
- Exportaciones portables sanitizadas.

La autorización de captura privada tendrá vigencia de hasta 30 días, será renovable y revocable.

Distinguir autorización para capturar, acceder, conservar y exportar.

Conservar los modos arquitectónicos:

- `VERIFIED_STRICT`.
- `PRIVATE_AUTHORIZED`.
- `MANDATORY_SUPPRESSION`.

Documentar la fuga reproducida por AS-04 durante una transición SPA a MFA sin tráfico de red.

Una guarda de red no garantiza por sí sola exclusión preventiva de secretos.

Login, MFA, SSO y superficies sensibles deben permanecer excluidos cuando no existan garantías suficientes.

El consentimiento del usuario no sustituye los controles técnicos.

Los temporales requieren protección efectiva. El cifrado posterior al sellado no protege por sí solo los bytes escritos durante una grabación.

No prometer destrucción física garantizada en SSD, snapshots o respaldos. Exigir supresión y eliminación lógica, confidencialidad preventiva y descripción honesta del riesgo residual.

El código archivado de AS-04 permanece experimental y no autorizado para integración.

## D19 · Retención inteligente e historial

**Estado y naturaleza.** Política histórica acordada y política operativa propuesta.

**Concordancia.** DP-07, DP-15. Resumen indefinido hasta eliminación, 90 días de detalle, export manual, autoarchivo opcional y knowledge/casos activos sin caducidad. TTL multimedia, trazas, fallos, excepciones y poda requieren ratificación.

Registrar la política acordada de historial:

- Resumen histórico permanente, hasta eliminación expresa.
- Detalle de ejecuciones durante 90 días.
- Exportación manual.
- Archivo automático opcional y configurable.
- Knowledge canónico vigente y casos activos sin caducidad automática.

Registrar como política operativa propuesta y discutida:

- Videos y capturas de pruebas exitosas: hasta 24 horas.
- Trazas exitosas: 72 horas.
- Evidencias de fallos: mínimo 14 días, salvo exigencias de seguridad, eliminación expresa o límites que deban ratificarse.
- Conservación protegida de evidencias de defectos abiertos, con cuotas y excepciones controladas.
- Eliminación de evidencia pesada tras corrección acreditada y cumplimiento del plazo aplicable.
- Poda cada 24 horas mientras QAP esté activo y al iniciar.
- Protección de ejecuciones activas y publicaciones pendientes.

Distinguir los plazos expresamente seleccionados por el propietario de los detalles operativos recomendados que todavía requieran ratificación.

No utilizar «funciona al 100 %» como criterio técnico de eliminación.

La expiración de una evidencia no cambia retroactivamente el veredicto.

Un reporte histórico no debe depender indefinidamente de la existencia física de `trace.zip`.

Preservar manifiestos, hashes, procedencia, estado de evidencia y eventos de poda.

Contemplar exportación HTML, CSV, JSON/JSONL y manifiesto verificable.

Las evidencias privadas no deben incluirse automáticamente en las exportaciones.

## D20 · Seguridad de sesiones, secretos y visor

**Estado y naturaleza.** Requisitos expresos de seguridad.

**Concordancia.** DP-03, DP-09, DP-11, DP-14. Se resuelve el alta fuera de MCP/chat/prompts. Mecanismo nativo, CI sin TTY, visor y riesgos residuales requieren validación.

Incorporar las conclusiones AS-01 y AS-03:

- Captura de credenciales fuera de MCP, chat y prompts.
- Sesiones protegidas y reutilizables.
- Separación entre memoria funcional y secretos.
- Aislamiento por alcance.
- Revocación durable.
- Fallo cerrado cuando una sesión requerida no esté disponible.
- Compatibilidad multiplataforma de los mecanismos de secretos.
- Protección de archivos, directorios, temporales y respaldos.
- Visor local autenticado y confinado.
- Catálogo autorizado de artefactos.
- Control de CORS.
- Reproducción WebM con soporte HTTP Range.
- Prevención de acceso arbitrario a archivos.

Identificar cualquier decisión de riesgo residual todavía pendiente.

## D21 · Criterios de aceptación del producto

**Estado y naturaleza.** Requisitos expresos de aceptación.

**Concordancia.** DP-02, DP-10, DP-12, DP-15. Custodia independiente obligatoria. Los valores 80 % y 75 % son candidatos con denominadores por calibrar.

QAP debe estar listo para trabajar en proyectos reales.

La aceptación deberá cubrir, entre otros:

- Discovery profundo de aplicaciones desconocidas.
- SPA y estados dinámicos.
- Formularios, tablas, filtros y paginación.
- Flujos E2E entre módulos.
- Múltiples perfiles y roles.
- Efectos funcionales verificables.
- Seguridad y pruebas negativas.
- Preparación y limpieza de datos.
- Validación de reportes PDF y Excel.
- Uso opcional de APIs.
- Internacionalización.
- Reanudación entre agentes.
- Recuperación ante interrupciones.
- Evidencias visuales auténticas y protegidas.
- Compatibilidad multiplataforma.
- Uso eficiente de recursos y tokens.
- Paridad MCP/CLI.

No aceptar pruebas de visibilidad como evidencia suficiente de autonomía integral.

Las métricas candidatas de 80 % de Discovery y 75 % de verificación de efectos deben quedar pendientes de calibración y definición exacta de denominadores.

No se consideran umbrales comerciales definitivos aprobados.

Las métricas agregadas no compensan falsos PASS ni violaciones de garantías críticas.

Preservar la evaluación independiente sobre aplicaciones y defectos desconocidos.

No declarar «100 % funcional» basándose exclusivamente en suites internas o fixtures conocidos.

## Atribución y autoridad

El encargo del propietario prevalece donde exista conflicto de alcance. El [plan maestro](plan-maestro.md) y los [insumos](insumos/README.md) identifican propuestas y recomendaciones, incluida la secuencia de experimentos y el uso de un puerto común. Las recomendaciones técnicas anteriores se atribuyen a su fuente (Neon, Codex o plan maestro). Una recomendación del Orquestador requiere una fuente atribuible y una aprobación expresa para cambiar el alcance. En los insumos examinados no se localizó un acta separada del Orquestador que apruebe SDK, motor, umbrales, corpus, detalles de retención o riesgos.

La autorización de esta etapa cubre consolidación y publicación documental. Las decisiones de riesgo, los detalles de despliegue y el dictamen de implementación corresponden al propietario tras las revisiones previstas.
