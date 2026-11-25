# **Dictamen independiente EP-02 — Arquitectura de producto y economía de ingeniería**

**Destinatario:** Orquestador Principal de QAP.\
**Repositorio:** `Hyouka73/QAMCP`.\
**Rama exclusiva:** `develop`.\
**SHA de referencia:** `f46057ec2738e64a5d9b654ac309892020e0a92f`.\
**Fecha:** 25 de noviembre de 2026.\
**Naturaleza:** Evaluación documental independiente, no vinculante y sin autorización de implementación.

## **1. Dictamen ejecutivo**

Combinación recomendada por EP-02

# **B / A / B / A / A / A / A**

DE-01

# **B**

DE-02

# **A**

DE-03

# **B**

DE-04

# **A**

DE-05

# **A**

DE-06

# **A**

DE-07

# **A**

**Coincide con la recomendación provisional del Orquestador**, pero con condiciones arquitectónicas y económicas específicas para evitar que la ampliación convierta QAP en un producto excesivamente costoso de construir y mantener.

Mi recomendación es que QAP nazca como una **plataforma profesional local de aseguramiento de calidad, con autonomía como capacidad central, pero no como dependencia para trabajar**.

Desde la economía de ingeniería, el mayor peligro no consiste exclusivamente en incorporar demasiadas funcionalidades. También consiste en construir un núcleo demasiado estrecho que posteriormente obligue a reconstruir el modelo de datos, las fronteras de seguridad, el sistema de ejecución y la memoria histórica.

Por ello, recomiendo invertir desde el inicio en las capacidades que presentan alguna de estas características:

- Son necesarias para el trabajo profesional cotidiano.
- Conservan información que sería imposible recuperar posteriormente.
- Modifican contratos fundamentales de ejecución, autoridad o evidencia.
- Permiten ampliar el producto sin desarrollar un segundo núcleo.
- Evitan dependencias obligatorias de proveedores comerciales o modelos de IA.

En cambio, recomiendo diferir las capacidades especializadas cuyo valor puede incorporarse posteriormente mediante contratos estables, sin comprometer la autonomía ni la utilidad profesional inicial.

**No considero conveniente reabrir la decisión de que QAP sea local, ni introducir un servidor empresarial compartido, un ALM universal o motores especializados propios de propósito general.**

## **2. Matriz de las siete decisiones**

| Decisión                           | Elección | Costo incremental relativo | Costo de aplazar la capacidad recomendada    | Argumento determinante                                                                           |
| ---------------------------------- | -------- | -------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| AC-DE-01 · Operación humana        | **B**    | Alto                       | Alto en utilidad y adopción                  | QAP debe servir como herramienta cotidiana sin IA ni terminal obligatoria.                       |
| AC-DE-02 · Estrategia de QA        | **A**    | Medio                      | Alto en trazabilidad histórica               | La ejecución de pruebas no equivale a dirigir la calidad de una entrega.                         |
| AC-DE-03 · Reportes y reproducción | **B**    | Medio-alto                 | Medio para formatos; alto para memoria       | Entrega profesional directamente utilizable y conservación reproductiva.                         |
| AC-DE-04 · Automatización y CI/CD  | **A**    | Medio-alto                 | Alto                                         | Reutilización, interoperabilidad y automatización sostenible sin motores redundantes.            |
| AC-DE-05 · Calidad no funcional    | **A**    | Medio-alto                 | Alto para contratos; variable por disciplina | Cubrir dimensiones esenciales sin desarrollar herramientas especializadas completas.             |
| AC-DE-06 · Datos y concurrencia    | **A**    | Alto                       | Alto en diseño y riesgo empresarial          | La concurrencia funcional requiere modificar deliberadamente los contratos de reserva y efectos. |
| AC-DE-07 · IA externa sin MCP      | **A**    | Bajo                       | Bajo                                         | Su incorporación posterior no debe requerir reconstrucción si existe intercambio gobernado.      |

Los costos son valoraciones cualitativas de esfuerzo, mantenimiento, superficie de ataque, complejidad contractual y validación. **No representan estimaciones de tiempo, presupuesto ni consumo de hardware.**

La comparación utiliza las letras y el alcance exactos de la [resolución del Orquestador, §3](https://github.com/Hyouka73/QAMCP/blob/f46057ec2738e64a5d9b654ac309892020e0a92f/docs/qap-architecture/cierre-av-01/resolucion-orquestador-ac01.md?utm_source=chatgpt.com).

## **3. Evaluación independiente por decisión**

### **AC-DE-01 — Operación profesional humana e interfaz operacional**

**Recomendación: B.**

| Alternativa                            | Beneficio                                                                   | Costo y riesgo                                                        | Consecuencia profesional                                                                  |
| -------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| A. CLI completa y visor de lectura     | Menor superficie operacional inicial.                                       | Menor costo inmediato; incorporación gráfica posterior.               | Funcional para perfiles técnicos, pero con fricción cotidiana para Executors y analistas. |
| B. Interfaz operacional local desde v1 | Utilidad transversal, independencia de IA y mejor transferencia de trabajo. | Mayor costo de seguridad, accesibilidad, empaquetado y mantenimiento. | Permite utilizar QAP como herramienta principal de trabajo.                               |
| C. Foco autónomo                       | Concentración del desarrollo en agentes.                                    | Menor alcance inicial, elevada dependencia operacional de agentes.    | Excluye una parte sustancial del trabajo profesional de QA.                               |

#### **Argumento arquitectónico**

La opción A no es técnicamente incorrecta. De hecho, una CLI estructurada constituye una excelente superficie para automatización, depuración e integración continua.

Sin embargo, utilizarla como única superficie operacional humana convierte tareas frecuentes —editar casos, revisar evidencias, seleccionar conjuntos de pruebas y documentar defectos— en operaciones menos accesibles para perfiles profesionales no especializados en programación.

Herramientas profesionales como Azure Test Plans contemplan explícitamente autoría de casos, asignaciones, suites, ejecución manual guiada y seguimiento de resultados. Esto demuestra la pertinencia del flujo profesional, no la necesidad de replicar toda esa plataforma.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://learn.microsoft.com\&sz=32)

Microsoft Learn+2



La inversión en B se justifica por su frecuencia de utilización y porque permite aprovechar QAP durante toda la jornada laboral, incluso sin acceso a un modelo de IA.

#### **Frontera arquitectónica recomendada**

No recomiendo implementar un segundo núcleo para satisfacer las necesidades de la interfaz gráfica.

Las alternativas de frontera que deben permanecer abiertas a calificación incluyen una aplicación local autenticada mediante IPC, una superficie operacional local con origen y autoridad diferenciados, o una separación equivalente cuya efectividad pueda demostrarse.

La elección no debe basarse únicamente en que existan dos procesos, dos ventanas o dos puertos. La separación debe impedir efectivamente que el visor adquiera capacidad de escritura.

#### **Distribución temporal de capacidades**

| Desde los fundamentos                                                               | Obligatorio en v1                                                                                                      | Posterior                                                                                                                        |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Comandos, consultas, identidad, autorización, revisiones, estados y escritor único. | Formularios, autoría, importación, biblioteca, sets, asignaciones, ejecución guiada, defectos, reportes e intercambio. | Personalización avanzada, edición masiva sofisticada, extensiones visuales y colaboración centralizada si alguna vez se aprueba. |

**Condición bloqueante:** EXP-08 debe acreditar aislamiento, autenticación, revocación, ausencia de bypass, accesibilidad y paridad semántica. La interfaz debe poder operarse mediante teclado, manejar adecuadamente el foco y cumplir las obligaciones aplicables de DE-05 B. WCAG 2.2 aporta criterios verificables, pero superar una selección de ellos no constituye certificación integral.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.w3.org\&sz=32)

w3.org



**Fuente interna:** [QA-02](https://github.com/Hyouka73/QAMCP/blob/f46057ec2738e64a5d9b654ac309892020e0a92f/docs/qap-architecture/cierre-av-01/informe-ac01-qa02.md?utm_source=chatgpt.com), QA02-01–17; [resolución AC-01](https://github.com/Hyouka73/QAMCP/blob/f46057ec2738e64a5d9b654ac309892020e0a92f/docs/qap-architecture/cierre-av-01/resolucion-orquestador-ac01.md?utm_source=chatgpt.com), C-03 y EXP-08.

### **AC-DE-02 — Estrategia, requisitos y dirección de QA**

**Recomendación: A.**

| Alternativa                    | Beneficio                                                              | Riesgo y costo                                                                           |
| ------------------------------ | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| A. Estrategia ligera integrada | Permite orientar pruebas por riesgo, requisitos, cobertura y entregas. | Costo medio si se reutilizan los modelos existentes; riesgo de burocratización.          |
| B. Solo campaña autónoma       | Simplifica el producto y concentra el desarrollo en ejecución.         | No conserva suficientemente las razones de selección, exclusión y aceptación de riesgos. |

La opción B confunde dos actividades profesionales diferentes: ejecutar pruebas y determinar si se dispone de información suficiente para recomendar una entrega.

Una campaña puede concluir favorablemente en todas sus pruebas ejecutadas y, simultáneamente, no haber evaluado una regla de negocio crítica.

**El costo principal de aplazar A no es la construcción futura de formularios, sino la pérdida de contexto histórico.** Si no se registran la estrategia, los riesgos y las obligaciones desde el principio, no será posible reconstruirlos fielmente a partir de resultados antiguos.

Recomiendo incorporar la estrategia como perfil versionado del plan existente, evitando construir subsistemas independientes de gestión corporativa.

| Desde los fundamentos                                                               | Obligatorio en v1                                                                                                                | Posterior                                                                                                  |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Relaciones entre requisitos, riesgos, condiciones, casos, obligaciones y evidencia. | Revisión de requisitos, estrategia ligera, selección explicable, cobertura, criterios de salida, UAT y recomendación de entrega. | Gobierno organizacional avanzado, aprobaciones multinivel, matrices corporativas y gestión de portafolios. |

La aprobación humana de una recomendación de entrega del AUT debe mantenerse separada de la ejecución ordinaria de casos autorizados. Tampoco puede transformar un FAIL en PASS ni autorizar por sí misma un despliegue.

**Dependencias:** AC-DE-01, AC-DE-03 y AC-DE-04.

**Fuente interna:** [QA-01](https://github.com/Hyouka73/QAMCP/blob/f46057ec2738e64a5d9b654ac309892020e0a92f/docs/qap-architecture/cierre-av-01/informe-ac01-qa01.md?utm_source=chatgpt.com), QA01-01–12; integración I01 y corrección C-08.

### **AC-DE-03 — Reportes, métricas, defectos y memoria reproductiva**

**Recomendación: B.**

Esta decisión merece separar dos inversiones que tienen costos de aplazamiento muy distintos: el sistema de información profesional y los formatos de presentación.

| Alternativa                                 | Beneficio                                                       | Costo y consecuencia                                                                    |
| ------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| A. Reportes completos con formatos actuales | Conserva el núcleo profesional de consulta y reproducción.      | Menor complejidad inicial; conversiones externas frecuentes para entregas formales.     |
| B. A más PDF y XLSX propios                 | Entrega profesional directa y reutilización de datos tabulares. | Mayor validación de precisión, sanitización, portabilidad y accesibilidad.              |
| C. Solo reportes por corrida                | Simplifica el almacenamiento y las consultas.                   | Insuficiente para seguimiento de defectos, análisis histórico y reproducción tras poda. |

#### **PDF y XLSX no resuelven la misma necesidad**

**PDF — Comunicación formal**

Resulta apropiado para entregar un informe cerrado de resultados, incidencias, cobertura, limitaciones y recomendación de entrega a dirección o clientes.

**XLSX — Explotación profesional**

Permite entregar matrices de casos, defectos, resultados y cobertura con tipos de datos controlados, hojas organizadas y filtros, para análisis posterior.

La alternativa A dispone de sustitutos razonables: HTML portable para informes formales y CSV para análisis tabular. Por ello, diferir PDF/XLSX sería reversible si se diseña correctamente el contrato de publicación.

No obstante, esos sustitutos trasladan trabajo al usuario:

- Convertir HTML a PDF puede producir diferencias de paginación y presentación.
- Abrir CSV puede introducir conversiones de fechas, identificadores, precisión y tipos.
- Cada transformación externa agrega una nueva oportunidad de divulgar información o alterar la representación de los resultados.

En un producto destinado al trabajo cotidiano, considero justificado absorber ese costo dentro de QAP, siempre que se limite la capacidad a exportaciones gobernadas y no a un editor documental universal.

OWASP documenta específicamente los riesgos de interpretar contenido no confiable como fórmulas en exportaciones compatibles con hojas de cálculo. Estos riesgos también afectan a los formatos tabulares existentes y no desaparecen simplemente eligiendo CSV.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub+1



#### **Arquitectura de publicación**

Las exportaciones no deben introducir nuevas interpretaciones independientes de la fuente canónica.

En particular, se debe distinguir entre:

- **D11:** validación funcional de documentos PDF/Excel emitidos por el AUT, que permanece obligatoria.
- **AC-DE-03:** generación de documentos propios de QAP, que constituye una capacidad adicional.

Que QAP pueda leer Excel no demuestra que pueda generar XLSX fielmente. Ambas capacidades requieren acreditación independiente.

| Desde los fundamentos                                                                                        | Obligatorio en v1                                                                    | Posterior                                                                               |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Consultas tipadas, métricas versionadas, cortes históricos, publicaciones, recetas, retención y procedencia. | Reportes filtrados, defectos, reproducción, formatos vigentes más PDF/XLSX saneados. | DOCX, diseñador avanzado de reportes, distribución automática y sincronización externa. |

**Condiciones bloqueantes:** fidelidad semántica, sanitización estructural, conservación de valores autorizados, ausencia de contenido activo indebido, aislamiento y acreditación E6/G5.

**Fuente interna:** [QA-03](https://github.com/Hyouka73/QAMCP/blob/f46057ec2738e64a5d9b654ac309892020e0a92f/docs/qap-architecture/cierre-av-01/informe-ac01-qa03.md?utm_source=chatgpt.com), QA03-02–15; AR-50; corrección C-04.

### **AC-DE-04 — Automatización profesional, reutilización y CI/CD**

**Recomendación: A.**

| Alternativa                                                   | Beneficio                                                               | Costo y riesgo                                                                           |
| ------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| A. Automatización parametrizada e interoperabilidad gobernada | Reutilización, ejecución sin IA, CI y recepción de resultados externos. | Requiere contratos estables y validación de adaptadores.                                 |
| B. Múltiples motores nativos y sincronización obligatoria     | Mayor cobertura teórica de herramientas desde v1.                       | Multiplica dependencias, actualizaciones, conflictos, formatos y fronteras de autoridad. |

La ventaja competitiva de QAP no debería consistir en volver a implementar todos los frameworks de pruebas existentes.

Su valor reside en coordinar conocimiento, condiciones, ejecución, autoridad, testigos y resultados dentro de un modelo coherente.

Por ejemplo, un QA Engineer puede mantener un componente reutilizable para preparar un cliente sintético, parametrizarlo mediante distintos datasets y reutilizarlo en pruebas UI, API y regresiones desatendidas.

Si el componente cambia, QAP debe identificar qué revisiones y casos quedan afectados, sin reparar silenciosamente la intención original ni invalidar el histórico.

#### **Contrato de interoperabilidad**

La incorporación de resultados externos debe distinguir tres situaciones:

| Resultado externo                                                                            | Tratamiento                                                    |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Informe sin identidad o procedencia suficiente                                               | Referencia diagnóstica, no acreditación.                       |
| Resultado identificado y verificable, pero sin correspondencia suficiente con una obligación | Evidencia externa contextual.                                  |
| Testigo externo correspondiente, autorizado y calificado                                     | Puede contribuir a acreditar una afirmación según su contrato. |

El código de salida del proceso o un XML JUnit no sustituyen el sobre canónico AR-52.

Tampoco recomiendo prohibir que los desarrolladores escriban pruebas unitarias legítimas. QAP debe admitir su relación con la estrategia de calidad sin apropiarse de las responsabilidades de los frameworks de desarrollo.

| Desde los fundamentos                                                                                       | Obligatorio en v1                                                                                          | Posterior                                                                               |
| ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Identidad de activos, parámetros, componentes, adaptadores, procedencia y correspondencia con obligaciones. | CI desatendida sin IA, sobre AR-52, JUnit como proyección parcial, admisión segura y referencias externas. | Adaptadores específicos adicionales, sincronización autorizada y ejecución distribuida. |

**Dependencias:** AC-DE-02 para selección estratégica, AC-DE-03 para reportes y AC-DE-05/06 para resultados especializados.

**Fuente interna:** [QA-04](https://github.com/Hyouka73/QAMCP/blob/f46057ec2738e64a5d9b654ac309892020e0a92f/docs/qap-architecture/cierre-av-01/informe-ac01-qa04.md?utm_source=chatgpt.com), QA04-01–22; AV-04 y AR-52.

### **AC-DE-05 — Calidad no funcional y seguridad**

**Recomendación: A.**

| Alternativa                                                   | Beneficio                                                         | Costo y consecuencia                                                                      |
| ------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| A. Perfil no funcional acotado e integraciones especializadas | Cobertura profesional de atributos de calidad con límites claros. | Costo controlable mediante capacidades y perfiles específicos.                            |
| B. Motores propios de carga y escaneo o umbrales universales  | Mayor centralización de herramientas.                             | Costo muy elevado, riesgos operativos y mantenimiento continuo de motores especializados. |

La diferencia esencial consiste en reconocer una disciplina profesional y poder evaluar sus resultados, frente a construir internamente todas las herramientas necesarias para practicarla.

QAP debe poder representar y evaluar atributos de calidad no funcional, sin convertirse en una plataforma propia de generación de carga, análisis estático universal, seguridad ofensiva o monitorización continua.

#### **Frontera recomendada**

| Disciplina                             | Capacidad inicial                                                                        |
| -------------------------------------- | ---------------------------------------------------------------------------------------- |
| Seguridad funcional                    | Permisos, roles, aislamiento de tenants y ausencia de efectos o divulgaciones indebidas. |
| Rendimiento                            | Mediciones contextualizadas, presupuesto, incertidumbre y criterios acreditados.         |
| Resiliencia                            | Fallos, recuperación, estados parciales y reconciliación autorizada.                     |
| Compatibilidad                         | Matriz de configuraciones y entornos calificados.                                        |
| Accesibilidad                          | Comprobaciones automáticas y humanas según DE-05 B.                                      |
| Carga especializada                    | Admisión de resultados e integración gobernada, sin motor universal propio.              |
| Seguridad especializada                | Resultados externos, alcance, procedencia y limitaciones.                                |
| Usabilidad y regresión visual avanzada | Ampliación según necesidades y alcance posterior.                                        |

No corresponde imponer un umbral de latencia universal a cualquier aplicación. Una medición válida requiere conocer el ambiente, el criterio aplicable, la instrumentación y la suficiencia de la muestra.

Una computadora local compartida puede proporcionar información diagnóstica útil sin necesariamente acreditar un SLA empresarial.

| Desde los fundamentos                                                                   | Obligatorio en v1                                                                         | Posterior                                                                              |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Perfiles de evaluación, mediciones tipadas, condiciones, límites, atributos y testigos. | Capacidades acotadas de seguridad, tiempos, recuperación, compatibilidad y accesibilidad. | Observabilidad continua, análisis visual avanzado y nuevos evaluadores especializados. |

La accesibilidad de QAP como producto y la evaluación de accesibilidad del AUT deben permanecer como obligaciones diferentes.

**Fuente interna:** [QA-05](https://github.com/Hyouka73/QAMCP/blob/f46057ec2738e64a5d9b654ac309892020e0a92f/docs/qap-architecture/cierre-av-01/informe-ac01-qa05.md?utm_source=chatgpt.com), QA05-01–13; DE-05 B; C-07.

### **AC-DE-06 — Datos empresariales y concurrencia funcional intencional**

**Recomendación: A.**

Es la decisión más delicada desde la arquitectura del ejecutor.

| Alternativa                                | Beneficio                                                                        | Costo y consecuencia                                                 |
| ------------------------------------------ | -------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| A. Concurrencia funcional acotada desde v1 | Permite detectar defectos de integridad que las pruebas secuenciales no revelan. | Exige enmendar reservas, coordinación, reconciliación y aceptación.  |
| B. Diferir la concurrencia intencional     | Reduce la complejidad de integración y validación inicial.                       | Mantiene sin evaluar una clase importante de defectos empresariales. |

La opción B sería razonable para un producto exclusivamente orientado a pruebas secuenciales de formularios.

Sin embargo, QAP contempla sistemas empresariales complejos, procesos financieros, operaciones con diferentes identidades, contratos, solicitudes y efectos asíncronos.

En ese contexto, una operación puede funcionar perfectamente al probarse individualmente y resultar incorrecta cuando dos participantes actúan sobre un mismo recurso.

#### **Tres formas de concurrencia que no deben confundirse**

| Tipo                           | Finalidad                                                                 |
| ------------------------------ | ------------------------------------------------------------------------- |
| Concurrencia interna de QAP    | Ejecutar diferentes tareas compatibles aprovechando recursos locales.     |
| Concurrencia funcional del AUT | Comprobar la integridad de un proceso frente a acciones simultáneas.      |
| Carga masiva                   | Evaluar capacidad, saturación, resistencia y comportamiento bajo volumen. |

La segunda constituye el alcance de AC-DE-06 A. No autoriza la tercera.

#### **Unidad compuesta excluyente**

Exclusión de tareas incompatibles dentro de la autoridad local de QAP. No representa un bloqueo global del AUT.

La enmienda debe permitir concurrencia autorizada dentro de una unidad compuesta que conserva la exclusión frente a otras tareas incompatibles.

El contrato debe garantizar intención durable por subefecto, identificación de participantes, límites previos a la admisión, evidencia de solapamiento real y reconciliación antes de liberar la barrera de efectos.

Si una respuesta se pierde o una operación queda incierta, el sistema no puede reintentar indiscriminadamente. El RFC 9110 también establece restricciones para el reintento automático de operaciones no idempotentes cuando no se conoce si fueron aplicadas.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.rfc-editor.org\&sz=32)

rfc-editor.org



#### **Costo de aplazar**

A diferencia de generar un formato adicional de reporte, introducir concurrencia funcional posteriormente puede afectar directamente:

- Modelo de reservas.
- Unidad de ejecución.
- Coordinación de participantes.
- Identidad y correlación de subefectos.
- Recuperación tras interrupciones.
- Cleanup.
- Testigos y criterios de cierre.

Aunque parte de estos mecanismos ya está contemplada por AV-04, permitir participantes concurrentes dentro de una reserva exige una extensión explícita.

| Desde los fundamentos                                                                           | Obligatorio en v1                                                                                        | Posterior                                                                                                                        |
| ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Unidad compuesta, reservas, participantes, barreras, presupuesto, correlación y reconciliación. | Concurrencia funcional acotada, datasets, estados, async, lotes parciales, API negativa y configuración. | Concurrencia distribuida, orquestación avanzada de participantes, comparadores adicionales y migraciones especializadas del AUT. |

Si se eligiera B, recomendaría conservar desde el principio los conceptos de unidad compuesta, participante y reconciliación por subefecto, aunque su ejecución concurrente permaneciera deshabilitada.

**Condición bloqueante:** enmienda puntual de AV-04 §6 y acreditación ampliada EXP-05b/E5. Dos actores constituyen el fixture mínimo de referencia, no una autorización ilimitada ni un máximo universal.

**Fuentes internas:** [QA-06](https://github.com/Hyouka73/QAMCP/blob/f46057ec2738e64a5d9b654ac309892020e0a92f/docs/qap-architecture/cierre-av-01/informe-ac01-qa06.md?utm_source=chatgpt.com), QA06-01–12; [AV-04 §§4–6](https://github.com/Hyouka73/QAMCP/blob/f46057ec2738e64a5d9b654ac309892020e0a92f/docs/qap-architecture/cierre-av-01/enmiendas-av04.md?utm_source=chatgpt.com); [EXP-05b](https://github.com/Hyouka73/QAMCP/blob/f46057ec2738e64a5d9b654ac309892020e0a92f/docs/qap-architecture/cierre-av-01/protocolos-av05.md?utm_source=chatgpt.com).

### **AC-DE-07 — IA externa sin MCP**

**Recomendación: A.**

| Alternativa                       | Beneficio                                                    | Costo y consecuencia                                                                         |
| --------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| A. Diferir el flujo especializado | Menor superficie de integración y exposición de información. | No proporciona intercambio especializado inmediato con modelos sin MCP.                      |
| B. Incorporar el flujo desde v1   | Facilita aprovechar otros asistentes y modelos externos.     | Requiere validación adicional de propuestas, privacidad, autoridad y contenido no confiable. |

QAP no debe prohibir la utilización futura de modelos externos sin MCP. Tampoco necesita construir una integración especializada para ellos antes de acreditar su utilidad.

La operación completamente humana, la ejecución determinista, las exportaciones saneadas ordinarias y la interoperabilidad MCP deben permanecer intactas.

La arquitectura debe considerar que una propuesta externa es información no confiable, independientemente de si procede de una IA, una persona o una herramienta.

| Desde los fundamentos                                                                                                 | Obligatorio en v1                                          | Posterior                                                                                                   |
| --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Contextos portables, clasificación, procedencia, esquemas de propuesta, importación segura y autoridad independiente. | Operación completa sin IA y exportación manual autorizada. | Flujo especializado para asistentes sin MCP, importación estructurada de propuestas y perfiles específicos. |

No debe asumirse que un proveedor gratuito garantiza privacidad, ni que el consentimiento para exportar información equivale a autorización para compartirla con cualquier tercero.

**Fuente interna:** QA02-14, integración I11 y corrección C-05.

## **4. Evaluación conjunta de escenarios profesionales**

Los siguientes escenarios constituyen una evaluación documental de extremo a extremo. **No fueron ejecutados ni representan resultados experimentales.**

### **Escenario 1 — QA individual sin suscripción a IA**

Un QA necesita validar una modificación funcional en una aplicación empresarial durante una jornada completa.

1. Importa o redacta los requisitos y condiciones de aceptación.
2. Selecciona casos existentes y prepara nuevos casos manualmente.
3. Define riesgos, alcance y datos necesarios.
4. Ejecuta pruebas manuales y automatizaciones preparadas.
5. Registra resultados, evidencia, defectos y retests.
6. Genera un informe formal sin consumir tokens de IA.

**Resultado arquitectónico esperado:** viable mediante AC-DE-01 B, 02 A, 03 B y 04 A.

La ausencia de IA no debe bloquear el producto. Sin embargo, tampoco implica que QAP pueda generar nuevas inferencias acreditadas sin datos, reglas o fuentes suficientes.

### **Escenario 2 — Senior prepara pruebas para Executors**

Un Senior define una suite de regresión, congela las revisiones, selecciona datasets y distribuye conjuntos de trabajo a varios Executors con instalaciones locales independientes.

Cada Executor importa el paquete autorizado, utiliza su propia identidad y permisos efectivos, ejecuta las pruebas y devuelve resultados con procedencia.

El Senior reconcilia resultados, duplicados y conflictos.

**Punto crítico:** la asignación de un caso no concede autoridad sobre el AUT. Los paquetes no transportan credenciales, sesiones ni grants.

Las instalaciones independientes tampoco comparten automáticamente una reserva global. Para evitar interferencias se requieren recursos dedicados, datasets aislados o coordinación externa acreditada.

### **Escenario 3 — Un mismo caso manual, híbrido y autónomo**

Caso ilustrativo: comprobar el cálculo de una solicitud empresarial y su posterior persistencia.

| Modalidad | Ejecución                                                                      |
| --------- | ------------------------------------------------------------------------------ |
| Manual    | El QA realiza los pasos y aporta observaciones o testigos autorizados.         |
| Híbrida   | QAP prepara datos, el QA realiza una operación y QAP verifica los efectos.     |
| Autónoma  | El ejecutor determinista realiza los pasos preparados bajo autoridad efectiva. |

Las tres modalidades conservan una identidad funcional común, revisiones y obligaciones comparables, aunque sus implementaciones y mecanismos de evidencia sean diferentes.

Una acción manual externa no controlada por QAP no debe presentarse como un despacho que QAP pudo impedir o autorizar técnicamente. Si su efecto es incierto, la continuación híbrida requiere reconciliación.

**Resultado esperado:** se evita duplicar bibliotecas, defectos e historiales para cada modalidad.

### **Escenario 4 — Reproducción de un defecto después de 120 días**

\*Hitos ilustrativos sujetos a protección, retención autorizada, revocación y reglas de conservación de DE-01.

Un desarrollador corrige un defecto meses después de su detección. El video original ya no se encuentra disponible conforme a la política aplicable.

QAP debe poder recuperar:

| Elemento                      | Disponibilidad esperada                                        |
| ----------------------------- | -------------------------------------------------------------- |
| Identidad y revisión del caso | Conservada conforme a su ciclo de vida.                        |
| Resultado histórico           | Conservado con su procedencia.                                 |
| Pasos de reproducción         | Disponibles en la receta promovida autorizada.                 |
| Datos y precondiciones        | Mínimo reutilizable autorizado.                                |
| Video original                | Puede haber expirado.                                          |
| Verificabilidad actual        | Declarada expresamente, sin reconstruir evidencia inexistente. |

Una receta que únicamente contiene enlaces a detalles ya eliminados es insuficiente.

**Resultado esperado:** reproducción cuando existen los insumos necesarios; abstención y explicación cuando no pueden recuperarse.

La promoción de una receta no debe utilizarse para evadir retención, cuotas o revocación.

### **Escenario 5 — Informe formal para dirección y desarrollo**

Un Lead necesita comunicar el estado de una entrega.

QAP produce desde la misma publicación autorizada:

| Destinatario   | Proyección                                                                |
| -------------- | ------------------------------------------------------------------------- |
| Dirección      | PDF ejecutivo con cobertura, riesgos, defectos relevantes y limitaciones. |
| Desarrollo     | XLSX con casos, identificadores, defectos y resultados filtrados.         |
| Automatización | JSON/JSONL y otras proyecciones canónicas aplicables.                     |
| QA operativo   | Visor e informes con detalle autorizado.                                  |

Los filtros pueden variar según finalidad y destinatario, pero deben conservar significado, procedencia y consistencia con el corte utilizado.

El PDF no demuestra autenticidad por ser PDF. La edición posterior del XLSX tampoco modifica la fuente canónica ni acredita por sí misma un resultado.

### **Escenario 6 — Concurrencia e integridad empresarial**

Dos participantes autorizados intentan reservar una misma unidad disponible en un ambiente QA dedicado.

Ejemplo conceptual de una condición de carrera\*Suponiendo una regla empresarial acreditada que permite exactamente una reserva.

La prueba no termina cuando se reciben las respuestas de ambas solicitudes. Debe verificar el estado persistido, los efectos secundarios, posibles eventos tardíos y la reconciliación de todos los participantes.

Una segunda instalación de QAP podría interferir si utiliza el mismo recurso. La exclusión local no elimina esa posibilidad.

**Resultado esperado:** detectar el defecto cuando existe evidencia suficiente de solapamiento y violación de la regla; no producir PASS por respuestas HTTP favorables.

### **Escenario 7 — CI y admisión de resultados externos**

Un desarrollador publica una nueva revisión del AUT. El pipeline ejecuta una selección de regresión QAP sin IA y recibe, adicionalmente, resultados de pruebas unitarias y de un evaluador especializado.

QAP debe relacionar los resultados con la versión, el entorno, las obligaciones y las limitaciones correspondientes.

Si un resultado externo indica éxito mientras una prueba funcional acreditada detecta un defecto, el éxito externo no compensa el FAIL.

El pipeline debe disponer del sobre AR-52 y su semántica exacta, sin reducir el resultado a un contador de pruebas aprobadas.

## **5. Arquitectura económica: inversión fundacional frente a extensión**

La recomendación completa se sostiene si QAP mantiene un núcleo común y evita reconstruir las mismas responsabilidades en cada superficie o integración.

### **Distribución recomendada del alcance**

EXTENSIONES POSTERIORES

Adaptadores adicionales, distribución avanzada, IA externa sin MCP, observabilidad continua y personalización especializada.

CAPACIDADES VISIBLES EN V1

UI operacional, CLI/MCP/CI, estrategia ligera, ejecución humana e híbrida, automatización, concurrencia acotada y exportación profesional.

FUNDAMENTOS NO DIFERIBLES

**Identidad · autoridad · revisiones · memoria · ejecución · oráculos · evidencia · procedencia · retención · interoperabilidad**

### **5.1. Contratos que deben quedar diseñados desde los fundamentos**

| Contrato                               | Motivo económico y arquitectónico                                          |
| -------------------------------------- | -------------------------------------------------------------------------- |
| Identidad funcional y revisiones       | Evitar duplicación de casos entre ejecución manual, híbrida y autónoma.    |
| Comandos y consultas canónicas         | Incorporar nuevas interfaces sin crear escritores o motores paralelos.     |
| Identidad, asignación y autoridad      | Impedir que nuevas superficies o integraciones escalen privilegios.        |
| Sets, planes y obligaciones congeladas | Conservar comparabilidad histórica y selección reproducible.               |
| Modalidades de ejecución               | Permitir evolución de una prueba manual hacia automatización.              |
| Unidad compuesta y subefectos          | Evitar rediseño posterior de concurrencia y recuperación.                  |
| Publicaciones derivadas                | Incorporar formatos nuevos sin cambiar la fuente de verdad.                |
| Recetas y retención selectiva          | Conservar información reproductiva antes de que desaparezca.               |
| Intercambio e importación              | Permitir transferencia local, reconciliación y extensiones futuras.        |
| Adaptadores gobernados                 | Evitar acoplamiento a herramientas, proveedores o motores particulares.    |
| Testigos y veredictos AR-52            | Evitar degradación semántica al incorporar evidencias de origen diferente. |
| Perfiles no funcionales                | Agregar disciplinas y mediciones sin redefinir el resultado funcional.     |

Estos contratos describen responsabilidades lógicas. No implican doce servicios, doce bases de datos ni doce paquetes de software.

### **5.2. Dependencias entre decisiones**

Dependencias conceptuales relevantes. No representa una secuencia de implementación, un DAG de compuertas ni un WBS.

La combinación recomendada evita que AC-DE-01 se transforme en una aplicación independiente, que AC-DE-03 se convierta en un repositorio paralelo y que AC-DE-04/05/06 introduzcan ejecutores capaces de actuar fuera de la autoridad canónica.

## **6. Riesgo de arrepentimiento y reversibilidad**

| Decisión | Riesgo principal de elegir demasiado poco                         | Riesgo principal de elegir demasiado                                        |
| -------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------- |
| AC-DE-01 | QAP técnicamente capaz, pero incómodo para el trabajo diario.     | Construir un gestor corporativo universal.                                  |
| AC-DE-02 | Pérdida de trazabilidad estratégica histórica.                    | Burocratizar la ejecución autónoma.                                         |
| AC-DE-03 | Incapacidad de reproducir y entregar resultados profesionalmente. | Convertir QAP en una plataforma documental generalista.                     |
| AC-DE-04 | Automatizaciones aisladas y poco mantenibles.                     | Mantener múltiples motores propios.                                         |
| AC-DE-05 | Visión incompleta de la calidad del AUT.                          | Construir herramientas de carga, seguridad y observabilidad universales.    |
| AC-DE-06 | No detectar condiciones de carrera críticas.                      | Introducir concurrencia insegura o infraestructura distribuida innecesaria. |
| AC-DE-07 | Fricción puntual con asistentes externos.                         | Dependencia, exposición de información y mantenimiento prematuro.           |

### **Valoración de reversibilidad**

Dificultad cualitativa de incorporar tardíamente una capacidad si sus fundamentos no fueron diseñados

Autoridad y memoria reproductiva

Muy alta

Ejecución concurrente y subefectos

Muy alta

Identidad manual / automática

Muy alta

Estrategia y trazabilidad histórica

Alta

Interfaz operacional

Media

Formatos adicionales

Baja

IA externa sin MCP

Baja

Representación ordinal de dependencias y consecuencias arquitectónicas; no son mediciones empíricas ni puntuaciones utilizadas para decidir automáticamente.

La interfaz gráfica y los formatos de exportación son relativamente reversibles si existen contratos correctos. Los recomiendo desde v1 por utilidad profesional, no porque necesariamente exijan modificar el núcleo.

La concurrencia, la identidad de casos y la memoria reproductiva requieren una inversión fundacional más cuidadosa.

## **7. Costo total de propiedad y mantenimiento**

No es suficiente evaluar cuánto cuesta construir una capacidad inicialmente. También debe considerarse cuánto cuesta mantenerla durante la evolución del producto.

| Factor                  | Política recomendada                                                                               |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| Dependencias            | Introducir únicamente componentes cuya utilidad justifique mantenimiento, seguridad y licencias.   |
| Instalación             | Mantener provisión modular y evitar servicios comerciales obligatorios.                            |
| Compatibilidad          | Calificar las superficies necesarias en Windows, macOS y Linux.                                    |
| Persistencia            | Utilizar contratos lógicos estables y migraciones controladas, sin fijar aquí tecnologías.         |
| Consumo local           | Medir recursos, almacenamiento y procesos completos; evitar componentes ociosos innecesarios.      |
| Seguridad               | Mantener inventario, procedencia, tratamiento de vulnerabilidades y fronteras efectivas.           |
| Tokens                  | Permitir reutilización determinista, consultas y generación de informes sin inferencia repetitiva. |
| Mantenimiento funcional | Compartir los modelos de caso, evidencia, defecto y resultado entre modalidades.                   |

La arquitectura debe evitar trasladar indiscriminadamente costos al usuario mediante suscripciones, procesos de conversión manual, scripts improvisados o dependencia cotidiana de agentes.

Pero tampoco debe absorber cada tarea especializada dentro de QAP cuando una integración gobernada permite obtener el mismo valor profesional con menor costo total.

## **8. Condiciones bloqueantes, riesgos asumibles e incertidumbres**

| Clasificación   | Elemento                                                                                 |
| --------------- | ---------------------------------------------------------------------------------------- |
| Bloqueante      | UI operacional que permita eludir autoridad o mutar desde el visor AR-24.                |
| Bloqueante      | Concurrencia que libere reservas mientras existen efectos remotos inciertos.             |
| Bloqueante      | Exportaciones que divulguen información o alteren silenciosamente valores y significado. |
| Bloqueante      | Resultados externos o declaraciones humanas convertidos automáticamente en PASS.         |
| Bloqueante      | Necesidad obligatoria de IA para completar el flujo profesional humano.                  |
| Riesgo asumible | Mayor esfuerzo de desarrollar y mantener una interfaz operacional local.                 |
| Riesgo asumible | Incremento de complejidad de PDF/XLSX propios.                                           |
| Riesgo asumible | Menor ergonomía inicial en funciones avanzadas o especializadas diferidas.               |
| Incertidumbre   | Esfuerzo real para acreditar EXP-08 en las plataformas soportadas.                       |
| Incertidumbre   | Fidelidad, rendimiento y seguridad de los futuros candidatos de exportación.             |
| Incertidumbre   | Capacidad local y costo de ejecutar escenarios concurrentes según el AUT.                |

La aceptación de mayores costos de construcción no autoriza a compensar fallos de seguridad, evidencia o autoridad.

Si una capacidad ratificada no supera sus condiciones de acreditación, deberá elevarse el bloqueo. No corresponde sustituirla silenciosamente por una alternativa de menor alcance.

## **9. Supuestos que podrían modificar la recomendación**

Mi recomendación presupone que QAP está destinado a convertirse en una herramienta habitual para diferentes responsabilidades profesionales de QA, no exclusivamente en una utilidad ocasional para agentes.

Bajo ese supuesto, la interfaz operacional, la entrega documental y la concurrencia empresarial justifican su inclusión.

La recomendación podría cambiar si aparecieran restricciones materiales verificadas:

| Restricción futura                                                                     | Decisión susceptible de reconsideración                                         |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Presupuesto de lanzamiento excepcionalmente limitado                                   | AC-DE-03 A sería la reducción de alcance más reversible entre mis elecciones B. |
| Uso exclusivamente técnico mediante automatización y terminal                          | AC-DE-01 A adquiriría mayor atractivo.                                          |
| Ausencia acreditada de escenarios empresariales que requieran concurrencia intencional | AC-DE-06 B podría reducir el costo inicial conservando fundamentos extensibles. |
| Necesidad frecuente y autorizada de modelos externos sin MCP                           | AC-DE-07 B podría adelantarse.                                                  |

Actualmente no existe evidencia suficiente para justificar esas reducciones como recomendación principal.

No considero necesario devolver nuevas preguntas al propietario para emitir este dictamen.

## **10. Fuentes y limitaciones metodológicas**

### **Fuentes internas**

La revisión se fundamenta en documentos recuperados mediante el conector de GitHub en el SHA solicitado.

| Documento                                                                                                                                                                                                          | Utilización                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| [Encargo EP-01/02](https://github.com/Hyouka73/QAMCP/blob/f46057ec2738e64a5d9b654ac309892020e0a92f/docs/qap-architecture/cierre-av-01/encargo-evaluacion-decisiones-ac01.md?utm_source=chatgpt.com)                | Alcance vinculante de la evaluación.                                                                 |
| [Resolución del Orquestador](https://github.com/Hyouka73/QAMCP/blob/f46057ec2738e64a5d9b654ac309892020e0a92f/docs/qap-architecture/cierre-av-01/resolucion-orquestador-ac01.md?utm_source=chatgpt.com)             | Opciones exactas y correcciones C-01–08.                                                             |
| [Contravalidación independiente](https://github.com/Hyouka73/QAMCP/blob/f46057ec2738e64a5d9b654ac309892020e0a92f/docs/qap-architecture/cierre-av-01/contravalidacion-independiente-ac01.md?utm_source=chatgpt.com) | Alternativas, objeciones y fronteras.                                                                |
| [Integración preliminar](https://github.com/Hyouka73/QAMCP/blob/f46057ec2738e64a5d9b654ac309892020e0a92f/docs/qap-architecture/cierre-av-01/integracion-preliminar-ac01.md?utm_source=chatgpt.com)                 | Dependencias entre especialidades.                                                                   |
| [Especificación consolidada](https://github.com/Hyouka73/QAMCP/blob/f46057ec2738e64a5d9b654ac309892020e0a92f/docs/qap-architecture/especificacion-consolidada.md?utm_source=chatgpt.com)                           | Invariantes arquitectónicos vigentes.                                                                |
| [Acta DE-01–05](https://github.com/Hyouka73/QAMCP/blob/f46057ec2738e64a5d9b654ac309892020e0a92f/docs/qap-architecture/cierre-av-01/acta-ratificacion-de.md?utm_source=chatgpt.com)                                 | Políticas ratificadas que deben conservarse.                                                         |
| [Manifiesto normativo](https://github.com/Hyouka73/QAMCP/blob/f46057ec2738e64a5d9b654ac309892020e0a92f/docs/qap-architecture/cierre-av-01/manifiesto-normativo-consolidado.md?utm_source=chatgpt.com)              | Precedencia, fuentes fijadas y universo normativo.                                                   |
| Informes QA-01–06                                                                                                                                                                                                  | Necesidades profesionales y propuestas de cada especialidad, enlazadas en las decisiones anteriores. |
| Enmiendas y protocolos AV-02/04/05/08                                                                                                                                                                              | Fronteras de seguridad, efectos, evidencia, concurrencia y aceptación pertinentes.                   |

### **Fuentes profesionales externas**

| Fuente primaria                                                                                                                   | Aplicación                                                 |
| --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [Microsoft — Azure Test Plans](https://learn.microsoft.com/en-us/azure/devops/test/overview?utm_source=chatgpt.com)               | Organización profesional, autoría, asignación y ejecución. |
| [W3C — WCAG 2.2](https://www.w3.org/TR/WCAG22/?utm_source=chatgpt.com)                                                            | Criterios verificables de accesibilidad.                   |
| [OWASP — CSV Injection](https://github.com/OWASP/www-community/blob/master/pages/attacks/CSV_Injection.md?utm_source=chatgpt.com) | Riesgos de exportación tabular.                            |
| [RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html?utm_source=chatgpt.com#section-9.2.2)                     | Idempotencia y restricciones de reintentos.                |

### **Limitaciones explícitas**

El encargo específico EP-02 fue recuperado y leído íntegramente. También se recuperaron la resolución, los documentos de integración y los seis informes especializados.

No obstante, debido al volumen del expediente, la revisión de los seis informes y determinados anexos extensos se concentró en sus matrices, apartados y contratos materialmente pertinentes. **No afirmo haber realizado una lectura exhaustiva línea por línea de todos esos informes y anexos.** Por tanto, existe una limitación respecto del requisito de lectura íntegra del expediente completo.

Las conclusiones constituyen una recomendación de alcance y arquitectura de producto, no una certificación de conformidad normativa completa.

No se realizaron mediciones de ingeniería, estimaciones presupuestarias cuantificadas, inspecciones exhaustivas del código ni experimentos. No se garantiza que alguna tecnología candidata satisfaga las obligaciones pendientes.

## **11. Dictamen final al Orquestador Principal**

Recomendación final EP-02

# **B / A / B / A / A / A / A**

AC-DE-01

**B**

Operación gráfica profesional desde v1

AC-DE-02

**A**

Estrategia ligera de QA

AC-DE-03

**B**

Reportes profesionales PDF/XLSX

AC-DE-04

**A**

Automatización reutilizable e interoperable

AC-DE-05

**A**

Calidad no funcional acotada

AC-DE-06

**A**

Datos empresariales y concurrencia funcional

AC-DE-07

**A**

Diferir integración especializada de IA sin MCP

Coincidencia: 7 de 7 con la propuesta provisional del Orquestador. No constituye ratificación empresarial.

**Dictamen: RECOMENDABLE CON CONDICIONES ARQUITECTÓNICAS Y DE ACEPTACIÓN.**

Coincido con la combinación provisional, pero no porque todas sus capacidades tengan el mismo costo ni porque todas sean igualmente difíciles de incorporar posteriormente.

La interfaz operacional y PDF/XLSX se justifican principalmente por utilidad cotidiana. La estrategia, la identidad compartida de casos, la memoria reproductiva y la concurrencia funcional se justifican también por sus consecuencias sobre los fundamentos y el costo de reconstrucción.

Las integraciones especializadas, los motores universales y los servicios avanzados pueden esperar si se preservan contratos suficientemente extensibles.

El producto resultante debe aspirar a ser útil para un QA Executor, Analyst, Senior, Engineer y Lead sin obligar al propietario a contratar IA adicional ni cambiar de plataforma conforme evolucione profesionalmente.

No es posible garantizar ausencia absoluta de arrepentimiento. Sí considero que esta combinación reduce razonablemente el riesgo de construir una herramienta demasiado limitada o excesivamente generalista.

### **Siguiente paso del Orquestador**

Integrar este dictamen con EP-01, resolver las discrepancias materiales mediante evidencia y elevar una recomendación única al propietario para ratificación expresa, teniendo presente la limitación documental declarada.

Preservar las 103 entradas normativas y los 57 AR vigentes hasta que los deltas sean formalmente ratificados e integrados.

**Estado de EP-02: entregado al Orquestador.**

No se han modificado archivos, ramas, código, dependencias ni configuraciones. No se han ejecutado experimentos, accedido al AUT, seleccionado tecnologías definitivas, elaborado WBS ni ratificado decisiones en nombre del propietario.

**Fin de la intervención EP-02.**
