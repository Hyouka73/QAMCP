# **AC-01 · Dictamen independiente EP-01**

**Especialidad:** Dirección de QA y gestión de producto profesional.\
**Destinatario:** Orquestador Principal de QAP.\
**Repositorio:** `Hyouka73/QAMCP`\
**Rama:** `develop`\
**SHA evaluado:** `f46057ec2738e64a5d9b654ac309892020e0a92f`\
**Naturaleza:** Recomendación de producto no vinculante.

## **1. Dictamen ejecutivo**

Combinación recomendada por EP-01

01

# **B**

02

# **A**

03

# **B**

04

# **A**

05

# **A**

06

# **A**

07

# **A**

**Favorable a la ampliación selectiva del producto, con condiciones de alcance, seguridad y aceptación.**

Coincide con la combinación provisional del Orquestador, pero incorpora condiciones profesionales para evitar que las capacidades sean únicamente nominales.

Recomiendo que QAP nazca como una **plataforma local de trabajo profesional de QA con capacidades autónomas**, y no exclusivamente como una herramienta de automatización operada por agentes de inteligencia artificial.

Esta distinción determina el producto que el propietario podrá utilizar durante los próximos años.

QAP debería permitir que una persona comience como QA Executor, evolucione hacia QA Analyst, Senior, Automation Engineer o QA Lead y continúe utilizando los mismos activos de pruebas, conocimiento, defectos, evidencias y reportes, sin verse obligada a abandonar la plataforma por haber adquirido nuevas responsabilidades.

Sin embargo, no recomiendo construir un ALM universal, una plataforma centralizada de colaboración empresarial ni reemplazar todas las herramientas especializadas del mercado.

La estrategia consiste en **construir fundamentos amplios, entregar flujos profesionales completos y diferir extensiones especializadas que sean reversibles**.

### **1.1. Resultado de las siete decisiones**

| Decisión                          | Elección | Justificación principal                                                               |
| --------------------------------- | -------- | ------------------------------------------------------------------------------------- |
| AC-DE-01 · Operación humana       | **B**    | Interfaz gráfica operacional desde v1; uso cotidiano independiente de IA y terminal.  |
| AC-DE-02 · Dirección de QA        | **A**    | Estrategia, riesgos, requisitos, cobertura y aceptación de entregas.                  |
| AC-DE-03 · Reportes y memoria     | **B**    | Reportes profesionales PDF/XLSX y reproducción durable de defectos.                   |
| AC-DE-04 · Automatización y CI/CD | **A**    | Reutilización, automatización determinista e interoperabilidad gobernada.             |
| AC-DE-05 · Calidad no funcional   | **A**    | Cobertura multidisciplinaria sin construir motores especializados innecesarios.       |
| AC-DE-06 · Datos empresariales    | **A**    | Evaluación de integridad, estados, asincronía y concurrencia funcional.               |
| AC-DE-07 · IA externa sin MCP     | **A**    | Diferir el flujo especializado, preservando independencia e interoperabilidad futura. |

La coincidencia con el Orquestador no se fundamenta en consenso. Las alternativas se evalúan a continuación por su utilidad, consecuencias, dependencias y riesgo de arrepentimiento.

## **2. Criterio independiente de evaluación**

La prioridad no debe determinarse únicamente por la dificultad técnica de desarrollar una capacidad, sino también por el perjuicio profesional de no disponer de ella.

Considero cuatro categorías:

| Categoría                 | Criterio                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| Fundamento arquitectónico | Diferir su diseño provocaría migraciones, incompatibilidades o reconstrucción del núcleo.        |
| Capacidad obligatoria v1  | Su ausencia impediría completar un flujo profesional relevante.                                  |
| Extensión posterior       | Puede incorporarse sobre contratos existentes sin modificar la semántica fundamental.            |
| Fuera de alcance          | Su construcción no aporta suficiente valor diferencial o implica responsabilidades ajenas a QAP. |

La frecuencia y el costo indicados en este informe son estimaciones cualitativas, no mediciones realizadas sobre el propietario ni estimaciones de ingeniería en horas.

## **3. Evaluación individual de las decisiones**

### **AC-DE-01 · Operación humana e interfaz gráfica**

Recomiendo B

Impacto profesional muy alto · Costo relativo alto

| Factor                        | A — CLI y visor       | B — UI operacional | C — Solo autonomía |
| ----------------------------- | --------------------- | ------------------ | ------------------ |
| Uso diario sin IA             | Posible               | Natural            | Insuficiente       |
| Adopción por QA manual        | Limitada              | Alta               | Muy limitada       |
| Transferencia de trabajo      | Posible, con fricción | Integrada          | Insuficiente       |
| Complejidad inicial           | Media                 | Alta               | Menor              |
| Riesgo de seguridad adicional | Moderado              | Alto               | Menor              |
| Costo profesional de aplazar  | Alto                  | No aplica          | Muy alto           |

**A — Operación humana mediante CLI.** Es técnicamente defendible. Un SDET o desarrollador podría utilizarla eficazmente, incluso sin IA. Sin embargo, introducir y modificar casos, seleccionar conjuntos de pruebas, registrar observaciones y consultar defectos mediante terminal genera fricción recurrente para otros perfiles.

**B — Interfaz gráfica operacional desde v1.** Es la alternativa que mejor corresponde a una plataforma profesional. Permite que la experiencia humana sea parte del producto y no una adaptación posterior de herramientas diseñadas exclusivamente para agentes.

**C — Mantener exclusivamente el enfoque autónomo.** Reduce el alcance inicial, pero convierte la disponibilidad de agentes compatibles en una limitación práctica del producto. Rechazo esta opción.

Microsoft Azure Test Plans, por ejemplo, diferencia la autoría, organización, asignación y ejecución manual de pruebas. Esto demuestra la relevancia profesional de esos flujos, aunque QAP no deba replicar su arquitectura comercial.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://learn.microsoft.com\&sz=32)

Microsoft Learn+1



#### **Experiencia mínima obligatoria de v1**

**QAP — Superficie operacional conceptual**

Sin IA conectada

Proyectos

Biblioteca

Campañas

Mi trabajo

Exploración

Defectos

Reportes

Intercambio

Regresión de entrega

Planificados

# **24**

Ejecutados

# **16**

PASS acreditados

# **12**

Pendientes

# **8**

Progreso de ejecución

Trabajo seleccionado

TC-021

Manual

Validar solicitud

TC-022

Automático

Comprobar persistencia

TC-023

Híbrido

Verificar aprobación

Representación conceptual con datos ficticios. No constituye una interfaz aprobada ni selecciona tecnología.

La interfaz debe permitir, sin terminal obligatoria y sin IA:

- Crear y editar casos mediante formularios, pasos, expectativas, parámetros y precondiciones.
- Importar bibliotecas existentes con validación y vista previa.
- Organizar suites, sets, campañas, prioridades y asignaciones.
- Ejecutar pruebas manuales, híbridas y automatizadas disponibles.
- Registrar evidencia, observaciones, desviaciones y bloqueos; pausar y reanudar.
- Crear defectos, recuperar procedimientos de reproducción y registrar retests.
- Realizar consultas, aplicar filtros, generar reportes e intercambiar paquetes autorizados.

No se requiere un administrador universal de usuarios, proyectos empresariales, infraestructura o aplicaciones.

#### **Frontera arquitectónica obligatoria**

Separación lógica de responsabilidades. No prescribe procesos, puertos físicos ni frameworks.

Son admisibles una aplicación local independiente, una superficie web local autenticada o una presentación integrada con fronteras efectivas verificadas.

Lo inadmisible es convertir el visor histórico en un segundo escritor o confiar únicamente en que sus botones estén deshabilitados.

La opción B exige:

- EXP-08 para calificar la nueva frontera operacional.
- Preservar AR-24 y ausencia de mutaciones desde el visor.
- Autenticación, autorización por efecto y revocación efectivas.
- Paridad semántica entre operaciones equivalentes de UI, CLI y MCP.
- Accesibilidad propia conforme a DE-05 B.
- Validación instalada en los tres sistemas operativos objetivo.

La combinación de evaluación automática y humana de accesibilidad es coherente con la documentación de W3C sobre WCAG 2.2.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.w3.org\&sz=32)

W3C



**Reversibilidad:** A podría evolucionar hacia B si los contratos operacionales completos existen desde los fundamentos. Aplazar solamente la presentación gráfica es reversible; diseñar el núcleo exclusivamente para interacciones de agentes no lo es con la misma facilidad.

**Conclusión:** recomiendo asumir el costo de B porque la interacción humana es cotidiana, no excepcional. Si EXP-08 no logra acreditar una frontera efectiva, debe mantenerse el bloqueo correspondiente y elevarse al propietario. No sustituir silenciosamente B por A.

### **AC-DE-02 · Estrategia y dirección profesional de QA**

Recomiendo A

Impacto profesional alto · Costo relativo medio

| Factor                 | A — Estrategia ligera | B — Solo campañas                  |
| ---------------------- | --------------------- | ---------------------------------- |
| Revisión de requisitos | Sí                    | Insuficiente                       |
| Gestión del riesgo     | Explícita             | Limitada al alcance ejecutado      |
| Dirección de entregas  | Sí                    | Parcial                            |
| Burocracia potencial   | Controlable           | Baja                               |
| Reconstrucción futura  | Menor                 | Considerable si falta trazabilidad |

**A — Estrategia ligera integrada.** Permite convertir requisitos y riesgos en condiciones verificables, relacionarlos con las pruebas y evaluar si la entrega está suficientemente cubierta.

**B — Campaña autónoma exclusivamente.** Puede responder si una campaña pasó, pero no necesariamente si se probaron todas las condiciones relevantes para entregar el producto.

ISTQB CTFL contempla planificación, revisión, gestión de riesgos, seguimiento, control, finalización y gestión de defectos como actividades profesionales de testing. No limita la disciplina a la ejecución de casos.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.istqb.com\&sz=32)

ISTQB.com+1



#### **Ejemplo profesional**

Una aplicación incorpora una modificación en las reglas de aprobación de créditos.

El QA ejecuta todos los casos seleccionados y obtiene resultados favorables. Sin embargo, no se incluyó una condición en la que un supervisor intenta aprobar una solicitud perteneciente a otra sucursal.

Casos ejecutados correctamente

# **100 %**

Obligaciones funcionales cubiertas

# **75 %**

La entrega conserva una brecha de cobertura.

Ejemplo hipotético: tres de cuatro obligaciones cubiertas. No representa métricas reales de QAP ni modifica DE-03.

Con A, QAP puede identificar que existe una obligación no evaluada. Con B, una campaña satisfactoria podría ofrecer una visión incompleta de la preparación de la entrega.

**Fundamentos:** identidad y revisión de requisitos, condiciones, riesgos, fuentes, obligaciones, criterios y vínculos bidireccionales.

**V1:** revisión preventiva, estrategia por entrega, cobertura semántica, selección por riesgo, exploración mediante charters, criterios de entrada/salida y registro separado de la decisión empresarial.

**Posterior:** gobierno corporativo avanzado, planificación de múltiples equipos y gestión organizacional de calidad.

**Condición:** no exigir que una persona apruebe cada caso ordinario antes de la ejecución. La autonomía debe mantenerse cuando existen autoridad, expectativas y condiciones suficientes.

**Conclusión:** A evita que QAP se limite a ejecutar correctamente una selección potencialmente incorrecta. Su diseño temprano es más importante que construir interfaces sofisticadas de gestión estratégica.

### **AC-DE-03 · Reportes, defectos y memoria reproductiva**

Recomiendo B

Impacto profesional muy alto · Costo relativo medio-alto

| Factor                          | A — Formatos actuales | B — Añadir PDF/XLSX | C — Reportes de corrida |
| ------------------------------- | --------------------- | ------------------- | ----------------------- |
| Consultas y filtros             | Sí                    | Sí                  | Limitados               |
| Reproducción durable            | Sí                    | Sí                  | No suficiente           |
| Entrega formal                  | Conversión externa    | Directa             | Limitada                |
| Análisis tabular                | CSV                   | CSV y XLSX          | Limitado                |
| Riesgo adicional de exportación | Menor                 | Mayor               | Menor                   |
| Costo de aplazamiento           | Fricción recurrente   | No aplica           | Muy alto                |

**A — Reportes profesionales sobre los formatos actuales.** Es una alternativa válida desde la perspectiva del núcleo. HTML, Markdown, CSV y JSON pueden satisfacer muchas necesidades técnicas. La contravalidación tiene razón al identificar que PDF y XLSX aumentan el alcance de seguridad y compatibilidad.

**B — Incorporar PDF y XLSX propios desde v1.** La recomiendo porque ambos formatos resuelven necesidades profesionales diferentes, frecuentes y complementarias.

**C — Reportes exclusivamente por corrida.** Rechazada. Impide consolidar información histórica, gestionar defectos y reproducir trabajo relevante tras la poda.

#### **PDF y XLSX no son capacidades equivalentes**

**PDF — Comunicación formal**

Consumidores: dirección, cliente, auditoría y responsables de entrega.

Informe paginado, legible, portable y asociado a un corte verificable.

**XLSX — Análisis operativo**

Consumidores: QA Lead, Analyst, Senior y desarrollo.

Datos tipados, filtros, agrupaciones y análisis posterior de resultados.

TestRail contempla reportes imprimibles o guardados como PDF para compartir con stakeholders y exportación de casos mediante Excel y CSV. Esto respalda su utilidad profesional, no una obligación de copiar su implementación.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://support.testrail.com\&sz=32)

TestRail Support Center+1



#### **¿Sería aceptable diferirlos?**

Sí, técnicamente, bajo la opción A exacta. Los sustitutos serían HTML saneado con presentación imprimible para PDF y CSV acompañado de JSON tipado para análisis tabular.

Sin embargo, estas alternativas implican conversiones externas, posibles errores de interpretación de identificadores, fechas y decimales, además de trabajo adicional para preparar entregables.

En un flujo ocasional resultan razonables. En una plataforma de uso profesional diario, recomiendo evitar esa carga.

#### **Contrato mínimo de exportación**

**Consulta canónica autorizada**

Filtros · corte as-of · revisión · campos · destinatario

**Proyección saneada y versionada**

Omisiones explícitas · procedencia · manifiesto derivado

HTML/MD

CSV

JSON/JSONL

PDF/XLSX

Todos los formatos proceden de la misma selección autorizada, no de consultas independientes.

PDF debe preservar legibilidad, estructura, contexto, paginación, referencias y omisiones sin incorporar contenido privado oculto.

XLSX debe preservar identificadores, tipos, fechas, zonas y valores decimales de acuerdo con el contrato. Debe impedir fórmulas provenientes de datos hostiles, referencias externas y contenido activo no autorizado. MITRE documenta la inyección de fórmulas como una debilidad específica en exportaciones CSV; la misma preocupación por interpretación activa debe evaluarse en las proyecciones de hojas de cálculo.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://cwe.mitre.org\&sz=32)

cwe.mitre.org



Una edición externa de XLSX no modifica la verdad de QAP. Un PDF tampoco constituye evidencia auténtica por el simple hecho de ser PDF.

**Separación indispensable:** D11 regula la validación de reportes PDF/Excel emitidos por el AUT. AC-DE-03 regula la generación de reportes propios de QAP. Son responsabilidades independientes.

#### **Memoria reproductiva**

La capacidad más difícil de recuperar posteriormente no es PDF ni XLSX, sino la conservación de conocimiento reproducible antes de que expire el detalle de ejecución.

Deben diseñarse desde el inicio las recetas versionadas, sus relaciones con defectos, datos, casos, entornos, reglas, testigos, permisos requeridos y cleanup. La promoción debe estar autorizada y conservar contenido suficiente, no enlaces que acabarán apuntando a evidencia expirada.

**Fundamentos:** modelo de consulta, métricas versionadas, publicaciones, defectos, recetas, retención y procedencia.

**V1:** consultas configurables, reportes sin IA, exportación gobernada en formatos existentes y PDF/XLSX, reproducción histórica y retest.

**Posterior:** diseñadores visuales avanzados de reportes, integraciones con BI y distribución automática.

**Fuera del alcance obligatorio:** DOCX propio, editor de hojas de cálculo y almacenamiento indefinido de todas las ejecuciones.

**Conclusión:** B es preferible desde la gestión de producto. Reconozco que PDF/XLSX son extensiones relativamente reversibles y, si fuera imprescindible reducir alcance por restricciones de costo demostradas, serían más fáciles de diferir que la memoria reproductiva.

### **AC-DE-04 · Automatización reutilizable e integración CI/CD**

Recomiendo A

Impacto profesional alto · Costo relativo medio-alto

| Factor                                | A — Núcleo interoperable | B — Motores múltiples nativos    |
| ------------------------------------- | ------------------------ | -------------------------------- |
| Reutilización de pruebas              | Alta                     | Alta                             |
| Independencia tecnológica             | Mayor                    | Menor                            |
| Mantenimiento                         | Acotado                  | Muy alto                         |
| Superficie de ejecución               | Gobernable               | Considerablemente mayor          |
| Incorporación de herramientas futuras | Mediante contratos       | Dependiente de múltiples motores |

**A — Automatización parametrizada, reutilizable y determinista.** Permite reutilizar componentes, ejecutar datasets, conservar identidad e integrarse con pipelines sin depender de un modelo.

**B — Motores nativos múltiples y sincronización bidireccional obligatoria.** Amplía la compatibilidad nominal, pero multiplica dependencias, superficies de confianza y mantenimiento. QAP terminaría responsabilizándose del funcionamiento de numerosas herramientas ajenas.

#### **Ejemplo profesional**

Un QA Senior diseña un caso para validar una aprobación con diez combinaciones de parámetros. Un SDET automatiza sus pasos y el desarrollador lo incorpora al pipeline de regresión.

Los tres trabajan sobre la misma intención y revisiones relacionadas. No deberían existir tres pruebas sin relación semántica que puedan divergir con cada modificación del sistema.

La interoperabilidad con CI requiere preservar el significado canónico del resultado. GitHub Actions utiliza códigos de salida para determinar el estado de una acción; GitLab aclara que publicar resultados JUnit no determina por sí mismo el éxito o fracaso del job.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://docs.github.com\&sz=32)

GitHub Docs+1



Esto refuerza la necesidad de conservar AR-52 como autoridad y JUnit como una proyección parcial.

**Fundamentos:** componentes versionados, parámetros tipados, identidades de build, dependencias, adaptadores gobernados y contratos de admisión externa.

**V1:** automatización reutilizable, regresión conservadora, ejecución CI desatendida, sobre AR-52, JUnit parcial, perfiles de dependencias e ingesta gobernada de resultados externos.

**Posterior:** adaptadores especializados, integración con gestores de incidencias y sistemas de desarrollo, sincronización avanzada.

**Condición:** una interfaz de integración sin ninguna vía funcional para admitir resultados externos sería insuficiente. Debe existir una capacidad mínima verificable de ingesta, no solamente una declaración de extensibilidad.

**Conclusión:** A proporciona valor para SDET y desarrollo sin convertir QAP en un framework universal. Las pruebas unitarias legítimas continúan existiendo y sus resultados pueden relacionarse con QAP sin atribuirles automáticamente autoridad canónica.

### **AC-DE-05 · Calidad no funcional y seguridad**

Recomiendo A

Impacto profesional alto · Costo relativo medio-alto

| Factor                      | A — Evaluación acotada   | B — Motores especializados propios |
| --------------------------- | ------------------------ | ---------------------------------- |
| Seguridad funcional         | Sí                       | Sí                                 |
| Rendimiento                 | Sintético y contextual   | Ampliado                           |
| Accesibilidad               | Híbrida                  | Híbrida                            |
| Carga y escaneo             | Integraciones gobernadas | Nativos                            |
| Riesgo operacional          | Acotable                 | Alto                               |
| Mantenimiento especializado | Moderado                 | Muy alto                           |

**A — Perfil no funcional común.** Permite evaluar características de calidad con condiciones, métricas, expectativas y testigos declarados.

**B — Motores propios de carga/escaneo o umbrales universales.** No la recomiendo. La generación de carga, el análisis especializado de vulnerabilidades y la monitorización requieren capacidades e infraestructura que no forman parte del valor diferencial central de QAP.

La frontera debe ser la siguiente:

| Disciplina          | QAP v1                                               | Evolución posterior                   |
| ------------------- | ---------------------------------------------------- | ------------------------------------- |
| Seguridad funcional | Autorización, aislamiento, roles y efectos indebidos | Evaluadores especializados            |
| Rendimiento         | Observación temporal reproducible y acotada          | Carga, estrés y capacidad             |
| Fiabilidad          | Recuperación funcional y efectos verificables        | Inyección avanzada de fallos          |
| Accesibilidad       | Evaluación híbrida conforme a DE-05                  | Ampliación de cobertura especializada |
| Compatibilidad      | Matriz declarada y resultados por contexto           | Infraestructura distribuida           |
| Usabilidad          | Observación humana y criterios por proyecto          | Evaluaciones especializadas           |
| Regresión visual    | Según alcance elegible                               | Capacidades avanzadas                 |
| Monitorización      | Resultados de evaluaciones puntuales                 | APM y observabilidad continua         |

No imponer un SLA universal sobre tiempos medidos en equipos compartidos.

Por ejemplo, que una pantalla tarde más en abrir durante una ejecución con CPU saturada no demuestra por sí mismo un defecto del AUT. Si existe un criterio acreditado y las condiciones permiten evaluarlo, puede emitirse un resultado sobre esa afirmación; de lo contrario, corresponde diagnóstico o abstención.

**Fundamentos:** perfil de evaluación versionado, objetivo, entorno, métrica, unidad, criterio, fuente, testigo y autoridad.

**V1:** las capacidades acotadas de A, incluyendo seguridad funcional, resiliencia, compatibilidad y accesibilidad. Evaluación temporal sintética bajo condiciones declaradas.

**Posterior:** evaluadores activos especializados bajo autorización independiente.

**Conclusión:** A preserva el crecimiento multidisciplinario sin obligar a QAP a competir simultáneamente con plataformas de rendimiento, seguridad, accesibilidad y monitorización.

### **AC-DE-06 · Calidad de datos, procesos empresariales y concurrencia**

Recomiendo A

Impacto empresarial muy alto · Costo relativo alto

| Factor                      | A — Concurrencia funcional       | B — Concurrencia diferida                               |
| --------------------------- | -------------------------------- | ------------------------------------------------------- |
| Integridad y estados        | Sí                               | Sí                                                      |
| API negativa y asincronía   | Sí                               | Sí                                                      |
| Condiciones de carrera      | Evaluables de forma acotada      | No evaluadas nativamente                                |
| Complejidad de coordinación | Alta                             | Menor                                                   |
| Impacto en AV-04 §6         | Enmienda focalizada              | Conservación inicial                                    |
| Riesgo de reconstrucción    | Menor si se diseña correctamente | Mayor si el modelo asume actores siempre independientes |

**A — Núcleo de datos y concurrencia intencional acotada.** La recomiendo porque los sistemas empresariales contienen reglas cuya corrección depende de la interacción entre operaciones y actores, no únicamente de casos aislados.

**B — Diferir la concurrencia.** Simplifica la primera versión, pero deja sin evaluar una clase significativa de defectos potencialmente graves: duplicidades, reservas inconsistentes, actualizaciones perdidas y efectos incompatibles.

OWASP reconoce expresamente la necesidad de evaluar condiciones de carrera en reglas de negocio que operan sobre estados compartidos.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://cheatsheetseries.owasp.org\&sz=32)

OWASP Cheat Sheet Series+1



#### **Escenario empresarial: doble reserva**

Escenario conceptual de aceptación. No representa una prueba ejecutada.

El problema no puede resolverse simplemente habilitando dos workers independientes. De hacerlo así, la exclusión existente podría impedir precisamente el comportamiento concurrente que se pretende evaluar.

#### **Condiciones obligatorias**

Conforme a AV-04 §6, EXP-05b y las precisiones de la resolución AC-01, la unidad compuesta debe ser titular de la reserva. Los participantes actúan dentro de esa unidad, mientras se mantiene la exclusión frente a otros trabajos controlados por la misma instalación.

Deben existir identidades independientes de los actores, autorización por efecto, límites de participantes y presupuesto, barrera verificable, intención durable por subefecto, reconciliación conjunta y cleanup autorizado.

Si no se demuestra el solapamiento requerido, QAP no puede acreditar la afirmación de concurrencia aunque el estado final parezca correcto.

#### **Instalaciones locales independientes**

Dos instalaciones QAP separadas no comparten automáticamente sus reservas, leases ni mecanismos de exclusión.

La opción A no puede prometer exclusión global sobre un AUT compartido. Para una evaluación acreditable deben utilizarse recursos dedicados o una coordinación externa expresamente autorizada y verificable. Si no existe aislamiento suficiente, se debe impedir la admisión del escenario afectado.

Esto no obliga a desarrollar un coordinador central distribuido en v1.

**Fundamentos:** actor, participante, unidad compuesta, recurso, reserva, subefecto, correlación, barrera y reconciliación.

**V1:** calidad declarativa de datos, transiciones, lotes parciales, efectos asíncronos, API negativa y concurrencia funcional acotada.

**Posterior:** carga masiva, ejecución distribuida, migraciones avanzadas del AUT y comparación especializada de grandes poblaciones.

**Conclusión:** A es preferible por la naturaleza empresarial de QAP. Si se escogiera B, al menos habría que diseñar desde el inicio los contratos de agrupación de actores, titularidad compuesta, subefectos y reconciliación, evitando introducir supuestos incompatibles con la concurrencia futura.

### **AC-DE-07 · Inteligencia artificial externa sin MCP**

Recomiendo A

Impacto inicial moderado · Costo de aplazamiento bajo

| Factor                               | A — Diferir flujo especializado | B — Incorporarlo en v1 |
| ------------------------------------ | ------------------------------- | ---------------------- |
| Operación sin IA                     | Completa                        | Completa               |
| Asistencia mediante IA sin MCP       | Manual y gobernada              | Flujo especializado    |
| Complejidad inicial                  | Menor                           | Mayor                  |
| Riesgo de divulgación                | Acotable                        | Mayor                  |
| Facilidad de incorporación posterior | Alta                            | No aplica              |

**A — Diferir el flujo específico de intercambio con IA externa.** Mantiene las capacidades ordinarias de exportación manual autorizada y la operación humana completa.

**B — Incorporar exportación de contextos e importación de propuestas específicamente destinadas a modelos externos.** Ofrece comodidad adicional, pero añade problemas de clasificación, destinatarios, privacidad, inyección y validación de contenido no confiable.

Un proveedor de IA gratuito no debe considerarse automáticamente privado o apto para tratar información empresarial. NIST mantiene un perfil de gestión de riesgos específico para sistemas de IA generativa que resulta pertinente para estas futuras integraciones.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.nist.gov\&sz=32)

nist.gov



#### **Ejemplo profesional**

Un QA sin suscripción de IA puede crear casos mediante formularios, ejecutarlos manualmente, parametrizarlos, importar activos existentes y generar sus informes.

Si necesita consultar un modelo externo, puede utilizar información ordinaria cuya exportación y divulgación estén autorizadas. No necesita que QAP incorpore un subsistema dedicado a ese proveedor.

**Fundamentos:** contratos de intercambio versionado, clasificación, procedencia, validación, revisión y separación de autoridad.

**V1:** operación completa sin IA, HOST mediante MCP, automatización DETERMINISTIC y exportación manual ordinaria gobernada.

**Posterior:** paquetes especializados de contexto y propuestas de IA externa, sujetos a evaluación de privacidad y autoridad.

**Conclusión:** A presenta un costo bajo de aplazamiento. La ausencia de una integración especializada no debe confundirse con una prohibición arquitectónica de la interoperabilidad futura.

## **4. Validación de la combinación mediante escenarios profesionales**

Los siguientes escenarios son contrastes documentales de principio a fin. No han sido ejecutados.

### **Escenario EP01-01 · QA individual sin suscripción de IA**

**Decisiones involucradas:** 01 B, 02 A, 03 B, 04 A y 07 A.

1. Instala QAP localmente y crea un proyecto sin conectar modelos.
2. Importa requisitos y registra condiciones verificables.
3. Diseña casos, prepara datos y organiza una campaña de regresión.
4. Ejecuta pruebas manualmente desde la interfaz operacional.
5. Registra evidencia, observaciones, defectos y resultados.
6. Genera un reporte filtrado en PDF y XLSX.

**Resultado conceptual:** flujo profesional completo sin inferencia ni suscripción de IA.

**Criterio de rechazo:** exigir una llamada a un modelo para guardar casos, generar consultas, producir reportes o ejecutar activos deterministas.

### **Escenario EP01-02 · Senior entrega trabajo a Executors sin IA**

El Senior prepara una biblioteca de pruebas de solicitudes, aprobaciones y permisos. Congela una selección y asigna el trabajo. Exporta un paquete autorizado que un Executor importa en otra instalación local.

El Executor ejecuta los casos y devuelve resultados. El Senior los reconcilia, identifica duplicados, conflictos y revisiones divergentes, y genera el reporte correspondiente.

El intercambio no transfiere credenciales, sesiones ni grants. Una asignación profesional no equivale a una autorización efectiva sobre el AUT.

**Criterio de rechazo:** requerir un servidor compartido, sincronizar autoridades automáticamente o sobrescribir resultados sin reconciliar conflictos.

### **Escenario EP01-03 · Un mismo caso en modalidades manual, híbrida y autónoma**

Se define una prueba para crear una solicitud, verificar su persistencia y confirmar que respeta las reglas de aprobación.

| Modalidad | Ejecución                                                                               |
| --------- | --------------------------------------------------------------------------------------- |
| Manual    | El QA sigue las instrucciones y registra observaciones y testigos.                      |
| Híbrida   | QAP automatiza preparación y verificaciones elegibles; el QA realiza los pasos humanos. |
| Autónoma  | HOST prepara o propone; DETERMINISTIC ejecuta la revisión congelada autorizada.         |

Las tres modalidades comparten identidad lógica, intención y obligaciones, pero preservan sus revisiones, contextos, intentos y procedencias reales.

Una afirmación humana no se convierte automáticamente en PASS. La suficiencia del testigo depende del oráculo aplicable.

**Criterio de rechazo:** duplicar la prueba en tres repositorios incompatibles o reiniciar automáticamente una mutación cuyo efecto se desconoce.

### **Escenario EP01-04 · Reproducción de un defecto después de la poda**

Un defecto en el cálculo de una comisión se descubre durante una campaña empresarial. Se genera una receta autorizada con datos sintéticos, precondiciones y pasos suficientes.

1. **Día 0 — Detección**

   Se registra el FAIL original, su contexto, testigos y defecto.
2. **Durante la conservación autorizada**

   Se promueve una receta mínima reutilizable y se protege la evidencia imprescindible.
3. **Después de 90 días**

   Expira el detalle ordinario conforme a DE-01, respetando excepciones, grants y protecciones aplicables.
4. **Día 120 — Retest**

   Se recupera la receta, se comprueban los insumos disponibles y se solicita una nueva ejecución autorizada.

Disponible si autorizado

Resumen, receta, reglas, identidad, contexto y resultado histórico.

Posiblemente expirado

Video, capturas, trazas y detalle no protegido.

Si el defecto fue corregido, el nuevo resultado favorable no borra el FAIL original.

Si faltan insumos esenciales, QAP debe informar que la reproducción actual no es acreditable, sin inventar evidencia.

**Criterio de rechazo:** conservar únicamente enlaces a archivos que expirarán o reconstruir artificialmente el histórico.

### **Escenario EP01-05 · Informe formal para dirección y desarrollo**

El QA Lead selecciona un proyecto, versión, entorno, periodo, conjunto de riesgos y destinatarios.

| Dirección              | Desarrollo                          |
| ---------------------- | ----------------------------------- |
| Resumen ejecutivo      | Defectos individuales               |
| Cobertura y riesgos    | Pasos de reproducción               |
| Preparación de entrega | Resultados por obligación           |
| Limitaciones           | Datos sintéticos autorizados        |
| PDF formal             | XLSX, HTML o formatos estructurados |

Ambos informes derivan de consultas autorizadas. No necesariamente contienen los mismos campos, puesto que el destinatario y propósito pueden determinar diferentes permisos.

El registro de una decisión empresarial de entrega no cambia el veredicto de las pruebas ni autoriza desplegar el AUT.

**Criterio de rechazo:** exponer información privada, omitir defectos silenciosamente o modificar denominadores para presentar mejores resultados.

### **Escenario EP01-06 · Concurrencia, integridad y efectos empresariales**

Dos actores autorizados intentan reservar la misma unidad de un fixture dedicado. QAP verifica la concurrencia efectiva, la respuesta individual, los efectos persistentes, la cardinalidad final y el cleanup.

Además, se contrasta un lote parcialmente aceptado y un efecto asíncrono cuya respuesta inicial no acredita persistencia.

La campaña conserva todos los subefectos, incertidumbres y residuos conforme a AV-04 y AR-52.

**Criterio de rechazo:** declarar PASS únicamente porque las respuestas HTTP fueron exitosas, liberar reservas mientras existen efectos inciertos o reenviar automáticamente operaciones confirmadas.

### **Escenario EP01-07 · Integración con CI y resultados externos**

Un desarrollador prepara una ejecución de regresión sobre una revisión congelada. CI invoca QAP sin TTY y sin inferencia. QAP emite su sobre canónico AR-52 y una proyección JUnit.

Un resultado externo de pruebas unitarias se incorpora como evidencia relacionada, conservando su versión, build, alcance, procedencia y limitaciones.

Si un resultado pertenece a otro build, no acredita el solicitado. Si existe un FAIL funcional en QAP, un resultado externo exitoso no lo compensa.

**Criterio de rechazo:** pipeline exitoso basado únicamente en JUnit, un código de salida sin sobre compatible o un resultado externo sin correspondencia acreditada.

## **5. Qué debe construirse desde los fundamentos y qué puede esperar**

Esta separación es determinante para evitar reconstrucciones innecesarias.

| Decisión | Diseñar desde los fundamentos                                                    | Disponible en v1                                    | Extensión posterior                        |
| -------- | -------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------ |
| 01 B     | Autoridad, identidades, revisión, modalidades, intercambio y operaciones humanas | UI operacional completa, CLI/MCP y ejecución sin IA | Colaboración centralizada                  |
| 02 A     | Base de pruebas, obligaciones, riesgo, cobertura y criterio de entrega           | Estrategia ligera y revisión preventiva             | Gobierno organizacional avanzado           |
| 03 B     | Consulta, publicación, métricas, retención y receta reproductiva                 | Defectos, reportes y PDF/XLSX propios               | BI, distribución e informes avanzados      |
| 04 A     | Componentes, parametrización, contratos externos e identidad de build            | Automatización reutilizable, CI e ingesta gobernada | Adaptadores y sincronizaciones específicas |
| 05 A     | Perfil común de calidad, criterios, métricas y testigos                          | Evaluación no funcional acotada                     | Motores especializados externos            |
| 06 A     | Actores, fixtures, invariantes, unidad compuesta y subefectos                    | Datos, asincronía, lotes y concurrencia funcional   | Escala distribuida y migraciones AUT       |
| 07 A     | Clasificación, intercambio, procedencia y validación                             | Operación sin IA y export manual gobernada          | Intercambio especializado con IA externa   |

### **5.1. Riesgo relativo de reconstrucción**

Valoración cualitativa de EP-01. No representa estimaciones de horas, presupuesto ni probabilidad estadística.

Modelo de autoridad y escritor único

Muy alto

Identidad, revisiones y obligaciones

Muy alto

Memoria reproductiva y retención

Muy alto

Modelo de actores y subefectos

Alto

Contratos de consulta e integración

Alto

Presentación gráfica sobre contratos completos

Moderado

Renderizadores PDF/XLSX sobre proyección común

Moderado

Integraciones específicas con IA externa

Bajo

Debe distinguirse el riesgo de reconstrucción técnica del riesgo de lanzar un producto profesionalmente incómodo.

La interfaz gráfica y los renderizadores son relativamente extensibles si los fundamentos son correctos, pero su ausencia inicial perjudicaría la adopción y el uso cotidiano. Por eso los recomiendo en v1, aunque no tengan el mismo grado de irreversibilidad que el modelo de autoridad o memoria.

## **6. Impacto sobre los perfiles profesionales**

**QA Executor**

Ejecutar sets asignados, registrar resultados, evidencia, incidencias y retests sin IA.

**QA Analyst**

Analizar requisitos, diseñar pruebas, evaluar condiciones y detectar brechas de cobertura.

**QA Senior**

Construir bibliotecas reutilizables, preparar campañas, transferir trabajo y gestionar defectos.

**QA Automation Engineer / SDET**

Parametrizar pruebas, automatizar componentes y ejecutar regresiones deterministas desde CI.

**QA Lead**

Priorizar riesgos, controlar cobertura, consultar tendencias y preparar recomendaciones de entrega.

**Desarrollador**

Recibir defectos reproducibles, relacionar resultados con builds y verificar correcciones.

**Dirección y consumidor de informes**

Consultar resultados, limitaciones y riesgos mediante reportes autorizados.

La combinación recomendada permite evolucionar entre estas responsabilidades sin perder los activos de trabajo anteriores.

No presupone que todos los perfiles tengan idénticos permisos, ni que sus roles profesionales sean equivalentes a roles de seguridad del AUT.

## **7. Evaluación conjunta de AC-DE-02, 04 y 05**

Estas tres decisiones no deben desarrollarse como subsistemas aislados.

La estrategia identifica qué debe evaluarse y por qué. La automatización determina cómo ejecutar las obligaciones elegibles. El perfil no funcional amplía las características de calidad evaluadas. Los resultados regresan al mismo modelo de evidencia, cobertura, defectos y reporte.

**Requisitos y riesgos — AC-DE-02**

**Obligaciones de prueba y criterios**

**Evaluación funcional**

AC-DE-04

**Evaluación no funcional**

AC-DE-05

**Resultados canónicos, testigos y AR-52**

**Cobertura, riesgo residual y decisión de entrega**

No recomiendo construir un planner de seguridad independiente, otro de rendimiento y otro de estrategia general con verdades incompatibles.

Las características especializadas deben poder definir criterios y testigos propios, pero conservar una relación común con las obligaciones y autoridades aplicables.

## **8. Riesgos residuales y condiciones no negociables**

| Riesgo                                                       | Clasificación                  | Tratamiento recomendado                                                    |
| ------------------------------------------------------------ | ------------------------------ | -------------------------------------------------------------------------- |
| Ampliación considerable de la primera versión                | Costo no medido                | Controlar estrictamente el alcance funcional sin estimar plazos ficticios. |
| UI que consigue escribir fuera de su autoridad               | Bloqueo                        | EXP-08, AR-24 y frontera efectiva.                                         |
| Duplicación de escritores o autoridades                      | Bloqueo                        | Núcleo canónico único.                                                     |
| Exportación de datos privados o contenido activo             | Bloqueo                        | Validación positiva y negativa de PDF/XLSX y demás formatos.               |
| Conversión de declaraciones humanas en PASS injustificado    | Bloqueo                        | Testigos y oráculos aplicables.                                            |
| Desaparición de medios tras su expiración autorizada         | Riesgo asumible                | Receta suficiente, protecciones aplicables y ausencia explícita.           |
| Concurrencia entre instalaciones sin aislamiento acreditado  | Bloqueo del escenario afectado | Recursos dedicados o coordinación autorizada.                              |
| Falta de adaptadores para determinadas herramientas externas | Riesgo asumible                | Contratos de admisión y extensión posterior.                               |
| Dependencia obligatoria de una suscripción de IA             | Incompatible con el producto   | Operación humana y determinista sin inferencia.                            |
| Crecimiento de almacenamiento y recursos                     | Costo no medido                | Medición, cuotas, poda y protección de activos conforme a DE-01.           |

La ampliación del producto no debe modificar unilateralmente los pisos o vetos de aceptación ya ratificados.

## **9. Comparación con la recomendación del Orquestador**

| Decisión | Orquestador | EP-01 | Resolución   |
| -------- | ----------- | ----- | ------------ |
| AC-DE-01 | B           | B     | Coincidencia |
| AC-DE-02 | A           | A     | Coincidencia |
| AC-DE-03 | B           | B     | Coincidencia |
| AC-DE-04 | A           | A     | Coincidencia |
| AC-DE-05 | A           | A     | Coincidencia |
| AC-DE-06 | A           | A     | Coincidencia |
| AC-DE-07 | A           | A     | Coincidencia |

No identifico una alternativa nueva materialmente superior que justifique introducir una octava decisión o reinterpretar las letras existentes.

La coincidencia no elimina las objeciones de la contravalidación. En particular, reconozco que AC-DE-01 B, AC-DE-03 B y AC-DE-06 A amplían significativamente las obligaciones de construcción y aceptación.

Mi diferencia respecto a una estrategia más conservadora de lanzamiento consiste en considerar que la ergonomía humana y la comunicación profesional son parte del valor del producto, no meros complementos de la automatización.

### **Supuestos que podrían cambiar la recomendación**

Si se demuestra una restricción material de presupuesto o capacidad de construcción, AC-DE-03 A sería la alternativa de reducción más reversible, siempre que se mantengan consultas, memoria reproductiva y sustitutos de exportación profesionales.

Si el producto se destinara exclusivamente a desarrolladores y SDET habituados a terminal, AC-DE-01 A ganaría atractivo. No es el posicionamiento profesional amplio establecido en el encargo.

Si los sistemas objetivo carecieran de procesos empresariales con estados compartidos o concurrencia relevante, AC-DE-06 B sería más razonable. No considero prudente asumir esa ausencia para una plataforma de QA empresarial.

Ninguno de estos supuestos requiere interrogar nuevamente al propietario en esta etapa. Corresponde al Orquestador contrastarlos con EP-02 y la evidencia disponible.

## **10. Preservación normativa**

| Elemento                | Resolución EP-01                                                          |
| ----------------------- | ------------------------------------------------------------------------- |
| D01–D21                 | Preservar íntegramente.                                                   |
| DE-01–05                | Preservar A/B/B/A con B de respaldo/B.                                    |
| 103 entradas normativas | No modificar ni recalcular automáticamente.                               |
| 57 registros AR         | Preservar estados.                                                        |
| 91 propuestas AC-01     | Conservar trazabilidad de origen.                                         |
| 24 deltas candidatos    | No tratarlos como 24 requisitos atómicos automáticamente.                 |
| AR-24                   | Mantener visor histórico de solo lectura.                                 |
| AR-27                   | Mantener garantías multimedia y custodia.                                 |
| AR-52                   | Preservar cuatro ejes, seis veredictos y agregación canónica.             |
| D11                     | Mantener validación de reportes del AUT como obligación independiente.    |
| AV-04 §6                | Enmienda focalizada candidata, condicionada a ratificación de AC-DE-06 A. |
| EXP-08                  | Candidato necesario para AC-DE-01 B.                                      |
| EXP-05b/E5              | Ampliación condicionada a la concurrencia compuesta.                      |
| E6/G5                   | Incorporar aceptación de exportaciones propias si se ratifica AC-DE-03 B. |
| Vetos y aceptación GA   | Sin reducción ni compensación por nuevas capacidades.                     |

No considero necesario reabrir las auditorías AV-01–08 ni repetir la clasificación de los 91 hallazgos de AC-01.

## **11. Fuentes y limitaciones metodológicas**

### **Fuentes internas principales**

Consultadas mediante el conector de GitHub, utilizando el SHA indicado para el expediente y la base inmutable correspondiente para los contratos normativos incorporados.

| Documento                                                                                                                                                                                                      | Utilidad                                         |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| [Encargo vinculante EP-01/02](https://github.com/Hyouka73/QAMCP/blob/f46057ec2738e64a5d9b654ac309892020e0a92f/docs/qap-architecture/cierre-av-01/encargo-evaluacion-decisiones-ac01.md?utm_source=chatgpt.com) | Método, alcance y restricciones.                 |
| [Resolución del Orquestador AC-01](https://github.com/Hyouka73/QAMCP/blob/f46057ec2738e64a5d9b654ac309892020e0a92f/docs/qap-architecture/cierre-av-01/resolucion-orquestador-ac01.md?utm_source=chatgpt.com)   | Alternativas exactas y condiciones.              |
| [Contravalidación AC-01](https://github.com/Hyouka73/QAMCP/blob/f46057ec2738e64a5d9b654ac309892020e0a92f/docs/qap-architecture/cierre-av-01/contravalidacion-independiente-ac01.md?utm_source=chatgpt.com)     | Riesgos, deltas y recomendaciones conservadoras. |
| [Integración preliminar](https://github.com/Hyouka73/QAMCP/blob/f46057ec2738e64a5d9b654ac309892020e0a92f/docs/qap-architecture/cierre-av-01/integracion-preliminar-ac01.md?utm_source=chatgpt.com)             | Dependencias entre capacidades.                  |
| [Especificación consolidada](https://github.com/Hyouka73/QAMCP/blob/f46057ec2738e64a5d9b654ac309892020e0a92f/docs/qap-architecture/especificacion-consolidada.md?utm_source=chatgpt.com)                       | Línea base y precedencia.                        |
| [Manifiesto normativo](https://github.com/Hyouka73/QAMCP/blob/f46057ec2738e64a5d9b654ac309892020e0a92f/docs/qap-architecture/cierre-av-01/manifiesto-normativo-consolidado.md?utm_source=chatgpt.com)          | Fuentes normativas fijadas.                      |
| [AV-02](https://github.com/Hyouka73/QAMCP/blob/e12927104051dffba149dd9824ac517863eee421/docs/qap-architecture/cierre-av-01/dictamen-av02.md?utm_source=chatgpt.com#ar-24)                                      | Frontera del visor.                              |
| [AV-04](https://github.com/Hyouka73/QAMCP/blob/e12927104051dffba149dd9824ac517863eee421/docs/qap-architecture/cierre-av-01/enmiendas-av04.md?utm_source=chatgpt.com)                                           | Semántica de ejecución y efectos.                |
| [AV-05](https://github.com/Hyouka73/QAMCP/blob/e12927104051dffba149dd9824ac517863eee421/docs/qap-architecture/cierre-av-01/enmiendas-av05.md?utm_source=chatgpt.com)                                           | Exportación, custodia e integraciones.           |
| [EXP-05b](https://github.com/Hyouka73/QAMCP/blob/e12927104051dffba149dd9824ac517863eee421/docs/qap-architecture/cierre-av-01/protocolos-av05.md?utm_source=chatgpt.com#exp-05b--dataplan-efecto-y-referencia)  | Reconciliación y efectos empresariales.          |

Los informes especializados QA-01–06 se recuperaron del repositorio; se examinaron sus conclusiones, estructura y secciones directamente relacionadas con las decisiones evaluadas.

### **Fuentes externas primarias**

| Fuente                                                                                                                                          | Aplicación                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [ISTQB CTFL v4.0](https://istqb.org/certifications/certified-tester-foundation-level-ctfl-v4-0/?utm_source=chatgpt.com)                         | Estrategia, riesgos y gestión profesional de pruebas. |
| [Microsoft Azure Test Plans](https://learn.microsoft.com/en-us/azure/devops/test/overview?view=azure-devops\&utm_source=chatgpt.com)            | Autoría, asignación y ejecución humana.               |
| [TestRail — Reportes imprimibles](https://support.testrail.com/hc/en-us/articles/7101821797140-Print-reports?utm_source=chatgpt.com)            | Comunicación formal.                                  |
| [TestRail — Exportación de casos](https://support.testrail.com/hc/en-us/articles/15144643126932-Export-test-cases?utm_source=chatgpt.com)       | Intercambio mediante Excel/CSV.                       |
| [W3C — WCAG 2.2 Conformance](https://www.w3.org/WAI/WCAG22/Understanding/conformance?utm_source=chatgpt.com)                                    | Evaluación híbrida de accesibilidad.                  |
| [MITRE CWE-1236](https://cwe.mitre.org/data/definitions/1236.html?utm_source=chatgpt.com)                                                       | Riesgos de interpretación activa de datos exportados. |
| [OWASP Business Logic Security](https://cheatsheetseries.owasp.org/cheatsheets/Business_Logic_Security_Cheat_Sheet.html?utm_source=chatgpt.com) | Concurrencia y reglas empresariales.                  |
| [GitHub Actions — Exit codes](https://docs.github.com/en/actions/how-tos/create-and-publish-actions/set-exit-codes?utm_source=chatgpt.com)      | Semántica de ejecución CI.                            |
| [GitLab — Unit test reports](https://docs.gitlab.com/ci/testing/unit_test_reports/?utm_source=chatgpt.com)                                      | Separación entre proyección JUnit y estado del job.   |
| [NIST AI 600-1](https://doi.org/10.6028/NIST.AI.600-1?utm_source=chatgpt.com)                                                                   | Gestión de riesgos de IA generativa.                  |

### **Limitaciones explícitas**

- Se leyó íntegramente el encargo vinculante EP-01/02 y la resolución que contiene las alternativas exactas.
- Debido a límites de recuperación y extensión documental, parte de los seis informes y contratos incorporados por el manifiesto se revisó selectivamente. **No certifico una lectura íntegra línea por línea de todo el expediente**, por lo que el cumplimiento de esa exigencia documental es parcial.
- Las fuentes externas se contrastaron documentalmente, sin instalar ni evaluar experimentalmente las herramientas.
- No se ha verificado una implementación instalada ni calculado el costo real de construcción.
- Los escenarios son hipótesis profesionales de aceptación, no resultados experimentales.
- Este dictamen no representa la opinión de un profesional humano acreditado ni garantiza conformidad con estándares.

La recomendación de las siete decisiones está fundamentada en la resolución íntegra, la línea base consultada, las secciones especializadas recuperadas y las fuentes profesionales indicadas. No debe presentarse como una nueva certificación exhaustiva de arquitectura.

## **12. Dictamen final para el Orquestador Principal**

Recomiendo mantener la siguiente combinación:

# **B / A / B / A / A / A / A**

**Trabajo profesional diario**

Operación gráfica, manual, híbrida y autónoma.

**Independencia de suscripciones de IA**

Autoría, ejecución y reportes sin inferencia obligatoria.

**Continuidad profesional**

Desde QA Executor hasta QA Lead y SDET.

**Capacidad de crecimiento**

Contratos extensibles sin comprometer el núcleo.

Recomendación especializada. Pendiente de integración con EP-02 y ratificación expresa del propietario.

El mayor riesgo de arrepentimiento sería construir una herramienta autónoma muy competente que, paradójicamente, no resulte suficientemente útil para el trabajo diario del propio profesional de QA.

El segundo mayor riesgo sería intentar evitar esa limitación construyendo desde el primer lanzamiento todas las herramientas que un profesional podría necesitar alguna vez.

La combinación recomendada busca evitar ambos extremos.

### **Siguiente paso exclusivo del Orquestador**

Integrar este dictamen con EP-02, resolver las discrepancias mediante evidencia y elevar al propietario una única recomendación de producto con sus consecuencias y costos pendientes de determinar.

Si ambos dictámenes coinciden y no aparece una objeción material, no recomiendo iniciar otra ronda general de investigación.

### **Declaración de cierre**

| Restricción                             | Estado                    |
| --------------------------------------- | ------------------------- |
| Modificaciones en GitHub                | Ninguna                   |
| Modificaciones de código o dependencias | Ninguna                   |
| Experimentos ejecutados                 | Ninguno                   |
| Acceso a aplicaciones empresariales     | Ninguno                   |
| Tecnologías definitivas seleccionadas   | Ninguna                   |
| Elaboración de WBS                      | No realizada              |
| Inicio de implementación o G0/G1        | No autorizado ni iniciado |
| Ratificación empresarial                | No realizada              |

**Estado final: DICTAMEN EP-01 ENTREGADO AL ORQUESTADOR PRINCIPAL, CON LAS RESERVAS DOCUMENTALES DECLARADAS.**

Fin del encargo.
