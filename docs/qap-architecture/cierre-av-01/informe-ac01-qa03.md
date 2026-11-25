# **AC-01 · Informe de investigación especializada QA-03**

## **Reportes, defectos, memoria reproductiva y auditoría**

| Identificación    | Valor                                           |
| ----------------- | ----------------------------------------------- |
| Destinatario      | Orquestador Principal de QAP                    |
| Especialidad      | QA-03                                           |
| Repositorio       | `Hyouka73/QAMCP`                                |
| Rama exclusiva    | `develop`                                       |
| SHA de referencia | `b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5`      |
| Fecha             | 25 de noviembre de 2026                         |
| Naturaleza        | Investigación documental independiente          |
| Autorización      | Exclusivamente lectura e investigación          |
| Estado            | Propuesta de revisión de alcance, no ratificada |

# **1. Resumen ejecutivo**

**Dictamen de QA-03: AMPLIACIÓN FOCALIZADA DE REQUISITOS Y PRECISIÓN CONTRACTUAL ANTES DE CONGELAR EL ALCANCE DE LANZAMIENTO.**

QAP dispone de una base normativa considerablemente más avanzada que su implementación actual en materia de veracidad funcional, custodia de evidencias, conservación histórica, autonomía y trazabilidad.

Sin embargo, todavía existe una diferencia importante entre:

- Una herramienta que ejecuta pruebas y genera reportes de sus resultados.
- Una plataforma profesional de QA capaz de conservar, recuperar, consultar, explicar y transferir el conocimiento adquirido durante toda la actividad de aseguramiento de calidad.

La segunda capacidad es la que considero necesaria para QAP.

La plataforma debe poder responder preguntas profesionales incluso cuando no exista una campaña activa, el agente de IA esté desconectado, hayan cambiado los integrantes del equipo o se hayan eliminado los archivos multimedia de ejecuciones anteriores.

Por ejemplo:

> ¿Qué defectos encontramos en el módulo de contratos durante los últimos seis meses, cuáles siguen abiertos, cómo se reproducen, qué versiones fueron afectadas, quién verificó las correcciones y qué evidencia sigue disponible?

Responder correctamente a esta pregunta requiere más que un generador de HTML, una memoria conversacional o un conjunto de capturas.

## **1.1. Conclusiones principales**

| Área                                                        | Dictamen                           |
| ----------------------------------------------------------- | ---------------------------------- |
| Cinco dominios lógicos de información                       | Favorable con condiciones          |
| Repositorio canónico único                                  | Preservar                          |
| Memoria reproductiva estructurada                           | Esencial para lanzamiento          |
| Reportes parametrizados sin IA                              | Esencial para lanzamiento          |
| Catálogo de métricas y denominadores                        | Esencial para lanzamiento          |
| Consulta histórica después de la poda                       | Esencial, parcialmente cubierta    |
| Gestión profesional de defectos                             | Ya requerida; necesita precisiones |
| Recetas ejecutables y humanas                               | Esencial para lanzamiento          |
| Versionado de plantillas y reportes publicados              | Esencial en modalidad acotada      |
| PDF y XLSX de reportes propios                              | Ampliación de alcance recomendada  |
| DOCX de reportes propios                                    | Opcional                           |
| Integración Jira, GitHub Issues y similares                 | Integración externa                |
| Envío automático de reportes                                | Opcional o posterior               |
| Base de datos independiente por memoria                     | No justificada                     |
| Conservación indefinida de todas las ejecuciones detalladas | Rechazada                          |
| Dependencia de IA para generar reportes                     | Rechazada                          |
| Reproducción garantizada de cualquier defecto histórico     | Rechazada                          |

La recomendación central es convertir los reportes, defectos y reproducción en **capacidades de primer nivel del producto**, sin transformarlos en subsistemas aislados que dupliquen la información canónica.

No recomiendo reabrir globalmente AV-01–08. Recomiendo incorporar y contravalidar exclusivamente los deltas identificados en este informe.

# **2. Verificación de la base y metodología**

## **2.1. Discrepancia de SHA resuelta**

El encargo AC-01 establece como base común:

`303e621dbca4a3a3b17cb2bf32530ab6311edc92`

La instrucción directa del propietario establece:

`b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5`

Se comprobó mediante la comparación remota de GitHub que el segundo SHA está exactamente un commit por delante del primero y que las únicas diferencias son:

| Archivo                                                         | Cambio              |
| --------------------------------------------------------------- | ------------------- |
| `cierre-av-01/README.md`                                        | Dos líneas añadidas |
| `cierre-av-01/encargo-ac01-evaluacion-multidisciplinaria-qa.md` | Encargo nuevo       |

No hay diferencias de código ni modificaciones de los requisitos normativos entre ambas referencias.

Por tanto, utilizar el SHA indicado por el propietario mantiene la base común de investigación.

[Comparación inmutable de los dos commits](https://github.com/Hyouka73/QAMCP/compare/303e621dbca4a3a3b17cb2bf32530ab6311edc92...b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5?utm_source=chatgpt.com)

## **2.2. Fuentes internas**

Se recuperó íntegramente el encargo AC-01 y se consultaron los documentos normativos obligatorios y las cláusulas contractuales pertinentes a QA-03.

| Referencia | Documento                                                                                                                                                                                                              |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q01        | [Encargo vinculante AC-01](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/encargo-ac01-evaluacion-multidisciplinaria-qa.md?utm_source=chatgpt.com) |
| Q02        | [Especificación consolidada](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/especificacion-consolidada.md?utm_source=chatgpt.com)                               |
| Q03        | [Manifiesto normativo](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/manifiesto-normativo-consolidado.md?utm_source=chatgpt.com)                  |
| Q04        | [Catálogo de requisitos](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/catalogo-requisitos.md?utm_source=chatgpt.com)                                          |
| Q05        | [Decisiones D01–D21](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/acta-decisiones.md?utm_source=chatgpt.com)                                                  |
| Q06        | [Ratificación DE-01–05](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/acta-ratificacion-de.md?utm_source=chatgpt.com)                             |
| Q07        | [Matriz de aceptación AV-08](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/matriz-aceptacion-av08.md?utm_source=chatgpt.com)                      |
| Q08        | [Registro maestro de los 57 AR](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/registro-maestro.md?utm_source=chatgpt.com)                         |
| Q09        | [Resolución final de planificación](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/resolucion-final-planificacion.md?utm_source=chatgpt.com)       |
| Q10        | [Dictamen AV-01](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/dictamen-av01.md?utm_source=chatgpt.com)                                           |
| Q11        | [Dictamen AV-02](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/dictamen-av02.md?utm_source=chatgpt.com)                                           |
| Q12        | [Enmiendas AV-03](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/enmiendas-av03.md?utm_source=chatgpt.com)                                         |
| Q13        | [Enmiendas AV-04](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/enmiendas-av04.md?utm_source=chatgpt.com)                                         |
| Q14        | [Enmiendas AV-05](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/enmiendas-av05.md?utm_source=chatgpt.com)                                         |

Se contrastaron las declaraciones del catálogo con archivos de código, tipos, manifiestos de paquetes y pruebas estáticas del mismo SHA.

**Limitación metodológica:** la revisión de contratos complementarios se concentró en las cláusulas materiales de QA-03. No se certifica una lectura integral de los 41 documentos del manifiesto compuesto ni una inspección exhaustiva de todos los archivos fuente del repositorio. Los hallazgos deben entenderse dentro de ese alcance y no como una nueva certificación arquitectónica.

No se ejecutaron pruebas ni experimentos.

# **3. Contraste con el trabajo profesional de QA**

## **3.1. El reporte no es la última fase de una ejecución**

En un departamento de QA, los reportes acompañan todo el ciclo de trabajo.

01

**Preparación**

Requisitos, riesgos, reglas, casos y alcance

02

**Seguimiento**

Asignaciones, progreso, pendientes y bloqueos

03

**Ejecución**

Resultados, testigos, observaciones y evidencias

04

**Investigación**

Defectos, diagnóstico, reproducción y triage

05

**Corrección**

Retest, regresión y verificación de efectos

06

**Entrega**

Cobertura, riesgo residual y aceptación

07

**Consulta histórica**

Auditoría, tendencias y recuperación del conocimiento

Cada etapa produce información que posteriormente puede ser necesaria para explicar decisiones, demostrar cobertura o reproducir problemas.

ISTQB CTFL v4.0.1 incluye seguimiento, control, finalización de pruebas, métricas y gestión de defectos. CTAL-TM v3.0 profundiza en la gestión de pruebas durante el ciclo de desarrollo. ISO/IEC/IEEE 29119-3:2021 establece plantillas de documentación aplicables a las actividades de pruebas. Estas referencias justifican evaluar la capacidad documental de QAP como una función transversal y no como una salida exclusiva del runner.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.istqb.com\&sz=32)

ISTQB.com+2



## **3.2. Consumidores de información**

| Actor                    | Necesidad profesional                                |
| ------------------------ | ---------------------------------------------------- |
| QA Lead                  | Cobertura, progreso, riesgos, criterios de salida    |
| QA Senior                | Historial, investigación, trazabilidad y diseño      |
| QA Executor              | Casos, pasos, datos, expectativas y pendientes       |
| Desarrollador            | Defectos reproducibles y contexto técnico            |
| SDET                     | Diagnóstico, estabilidad, regresión y automatización |
| Product Owner            | Impacto funcional y defectos pendientes              |
| Responsable de seguridad | Hallazgos restringidos, permisos y custodia          |
| Auditor                  | Procedencia, fechas, revisiones y decisiones         |
| Cliente                  | Resultados comprensibles y limitaciones              |
| Agente de IA             | Contexto estructurado, selectivo y autorizado        |
| CI/CD                    | Resultados tipados y estados no ambiguos             |

Un mismo hecho puede interesar a varios consumidores, pero **no todos necesitan recibir los mismos campos ni tienen autoridad para acceder a las mismas evidencias**.

# **4. Cobertura de la línea base**

La siguiente clasificación se refiere a cobertura normativa, no a certificación de implementación.

| Capacidad                                 | Referencias QAP                      | Evaluación                  |
| ----------------------------------------- | ------------------------------------ | --------------------------- |
| Repositorio único de reportes             | REP-001.2                            | CUBIERTO                    |
| Integridad de evidencias                  | REP-001.1, AR-28                     | CUBIERTO                    |
| Evidencia por intento, paso y rol         | REP-001.1, M1–M5                     | CUBIERTO                    |
| Comparativas de ejecución                 | REP-001.2, AR-46                     | CUBIERTO                    |
| Gestor de defectos                        | REP-001.3                            | CUBIERTO                    |
| Deduplicación de defectos                 | REP-001.3                            | PRECISAR CONTRATO           |
| Ciclo de reproducción y retest            | REP-001.4                            | PRECISAR CONTRATO           |
| Paquete reproducible                      | REP-001.3, AR-50                     | PRECISAR CONTRATO           |
| Memoria longitudinal                      | MEM-003.1–003.5                      | CUBIERTO                    |
| Historial después de poda                 | POL-RET-001, D19                     | PRECISAR CONTRATO           |
| Flakiness                                 | REG-001.2, AR-46                     | CUBIERTO                    |
| Protección de ediciones manuales          | MEM-001.4                            | CUBIERTO                    |
| Consultas parametrizadas profesionales    | REP-001.2                            | BRECHA NUEVA                |
| Catálogo general de métricas              | D21, AV-08 parcialmente              | PRECISAR CONTRATO           |
| Consultas temporales as-of                | REP-001.2, D19                       | BRECHA NUEVA                |
| Plantillas de reportes versionadas        | REP-001.2                            | BRECHA NUEVA                |
| Publicaciones históricas recuperables     | AR-50, D19                           | PRECISAR CONTRATO           |
| Autoría y declaraciones manuales          | MEM-001.4, AR-28 parcialmente        | PRECISAR CONTRATO           |
| Exportación saneada y portable            | AR-50, MEM-003.4                     | CUBIERTO                    |
| HTML/MD/CSV/JSON/JSONL propios            | AR-50                                | CUBIERTO                    |
| PDF/XLSX/DOCX propios                     | No exigidos expresamente por D10/D11 | BRECHA NUEVA                |
| Validación de PDF/Excel emitidos por AUT  | D10/D11, AR-20/38                    | CUBIERTO; dependencia QA-06 |
| Visor autenticado de solo lectura         | AR-24                                | CUBIERTO                    |
| Envío e integración con gestores externos | No obligatorio como alcance general  | INTEGRACIÓN                 |

No procede crear nuevamente requisitos equivalentes a REP-001.1–001.4, MEM-003.3–003.5, REG-001.2 o POL-RET-001. Procede completar su semántica y añadir únicamente las capacidades realmente ausentes.

# **5. Contraste estático con el código de develop**

Se identificaron mecanismos reutilizables y divergencias respecto del objetivo normativo. La existencia de una implementación parcial no modifica los requisitos ratificados.

## **5.1. Evidencia inspeccionada**

| Ref. | Archivo y localización                                                                                                                                                                                   | Hallazgo                                                                     |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| C01  | [shared/src/types/report.type.ts, L6–19](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/shared/src/types/report.type.ts?utm_source=chatgpt.com#L6-L19)         | Reporte limitado a cuatro formatos y resumen básico                          |
| C02  | [reporter/src/types.ts, L8–76](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/reporter/src/types.ts?utm_source=chatgpt.com#L8-L76)                             | Telemetría por paso y ejecución; filtrado reducido                           |
| C03  | [reporter/src/taxonomy.ts, L26–62](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/reporter/src/taxonomy.ts?utm_source=chatgpt.com#L26-L62)                     | Clasificación por expresiones regulares y fallback a `assertion_failed`      |
| C04  | [regression-detector.ts, L56–125](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/reporter/src/manifest/regression-detector.ts?utm_source=chatgpt.com#L56-L125) | Comparación por módulo e ID de caso, sin contrato completo de comparabilidad |
| C05  | [CLI report.ts, L93–182](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/cli/src/commands/report.ts?utm_source=chatgpt.com#L93-L182)                            | Generación de reportes sintéticos cuando se pierde la ejecución              |
| C06  | [MCP report.handler.ts](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/mcp/src/handlers/report.handler.ts?utm_source=chatgpt.com)                              | Verificaciones de digest, origen, referencias y publicación                  |
| C07  | [pruning-engine.ts, L52–154](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/reporter/src/pruning/pruning-engine.ts?utm_source=chatgpt.com#L52-L154)            | TTL históricos y eliminación de registros                                    |
| C08  | [history-manager.ts](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/knowledge/src/history/history-manager.ts?utm_source=chatgpt.com)                           | Mecanismo de historial acotado por módulo                                    |
| C09  | [report-handler.test.ts](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/mcp/src/__tests__/report-handler.test.ts?utm_source=chatgpt.com)                       | Casos de prueba sobre persistencia, integridad y rechazo de falsos PASS      |
| C10  | [pruning-engine.test.ts](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/reporter/src/__tests__/pruning-engine.test.ts?utm_source=chatgpt.com)                  | Pruebas de conservación mediante pinning y poda multimedia                   |
| C11  | [reporter/package.json](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/reporter/package.json?utm_source=chatgpt.com)                                           | Paquete de reportes existente, dependiente de engine, knowledge y shared     |

## **5.2. Divergencias materiales**

### **A. Regresión no equivale a corrección de defecto**

El detector actual registra como `fixedFailures` un cambio de `failed` a `passed`.

Esto no acredita una corrección. AV-04 distingue expresamente retry, oscilación y retest posterior a una corrección acreditada.

Un fallo intermitente seguido de éxito no debe desaparecer del reporte ni marcar automáticamente el defecto como resuelto.

**Clasificación:** incompatibilidad de implementación con requisito existente. No constituye una necesidad nueva de alcance.

### **B. El reporte sintético después de poda no preserva la historia**

En el CLI, cuando no se encuentra una ejecución, se construye un resultado sintético con:

- Fecha de inicio y fin actuales.
- Entorno `unknown`.
- Resultado `error`.
- Contadores en cero.
- Ningún caso.

Aunque se etiqueta como ejecución purgada, este mecanismo no recupera el hecho histórico y puede inducir interpretaciones incorrectas en consumidores automatizados.

No encontrar un archivo tampoco demuestra por sí mismo que fue eliminado mediante poda autorizada.

**Clasificación:** incompatibilidad con AR-50, AR-08/46 y D19.

### **C. Clasificación de error no es clasificación causal**

El fallback a `assertion_failed` en `classifyError` no conserva adecuadamente la incertidumbre de causa.

El código puede reutilizarse como fuente de indicios técnicos, pero no como árbitro de clasificación de defectos del producto.

**Clasificación:** incumplimiento reconocido de REP-001.3 y de la taxonomía exigida por AV-01.

### **D. La poda existente no equivale a DE-01**

El motor inspeccionado contiene valores históricos de 7 días para video, 14 días para trazas y 30 días para registros, además de protección mediante `pinned`.

Estos valores no representan la política ratificada de 90 días de detalle y resumen permanente. El pinning tampoco puede prevalecer sobre la revocación efectiva del permiso de conservación.

**Clasificación:** implementación pendiente de adecuación a política existente.

### **E. Los controles MCP son mecanismos aprovechables**

`ReportHandler` incluye comprobaciones de digest, publicaciones confirmadas, referencias seguras y condiciones de rechazo.

Las pruebas D-R01–D-R12 contienen escenarios relevantes para evitar reportes sin evidencia, totales inconsistentes, identificadores duplicados y falsos PASS con cero casos.

Deben preservarse y ampliarse bajo el contrato común. No se recomienda sustituir indiscriminadamente mecanismos valiosos por una implementación completamente nueva.

La presencia de estos tests no acredita que hayan pasado en el SHA analizado.

# **6. Evaluación de la hipótesis de cinco dominios lógicos**

## **6.1. Dictamen independiente**

**Favorable a cinco dominios funcionales; desfavorable a convertirlos automáticamente en cinco almacenes independientes.**

La hipótesis del Orquestador es útil para separar responsabilidades, políticas de consulta y ciclos de vida.

No obstante, llamar «memoria» a todos los dominios puede generar confusión entre conocimiento, hechos históricos, activos de pruebas y documentos derivados.

Propongo distinguirlos funcionalmente de la siguiente manera.

Modelo lógico propuesto. No representa una decisión de bases de datos, procesos, paquetes ni tecnologías.

| Dominio                 | Responsabilidad                         | No debe convertirse en                        |
| ----------------------- | --------------------------------------- | --------------------------------------------- |
| Conocimiento            | Comprender el AUT                       | Historial indiscriminado de todas las pruebas |
| Biblioteca              | Conservar cómo se pretende probar       | Copia de cada intento realizado               |
| Ejecuciones             | Registrar lo que ocurrió                | Autoridad para modificar reglas               |
| Defectos y reproducción | Explicar problemas y cómo investigarlos | Almacén duplicado de multimedia               |
| Reportes                | Consultar y comunicar información       | Fuente alternativa de resultados              |

## **6.2. Relación con los planos epistémicos**

Los cuatro planos existentes deben mantenerse:

| Plano            | Ejemplo                                                   |
| ---------------- | --------------------------------------------------------- |
| Observación      | Se observó un total incorrecto                            |
| Inferencia       | Posiblemente existe un error de redondeo                  |
| Regla acreditada | El cálculo debe redondearse conforme a una fuente vigente |
| Resultado        | Una afirmación resultó FAIL con testigo suficiente        |

Los dominios funcionales y los planos epistémicos son dimensiones diferentes.

Un defecto puede contener observaciones, inferencias, referencias a reglas acreditadas y resultados, pero pertenecer al dominio de defectos no convierte automáticamente todas sus afirmaciones en hechos acreditados.

## **6.3. Decisión sobre almacenamiento**

No se encuentra justificación profesional para imponer cinco bases físicas, un sistema distribuido, una base vectorial obligatoria o servicios independientes.

La separación lógica puede implementarse posteriormente mediante el puerto canónico de repositorio, preservando REQ-MEM-003.6 y el principio de escritor único.

La búsqueda semántica puede evaluarse como asistencia opcional, pero nunca como sustituto de consultas exactas, filtros de autoridad o relaciones de trazabilidad.

# **7. Registro consolidado de hallazgos**

Todos los identificadores siguientes son provisionales. No modifican los 103 elementos normativos ni los 57 AR existentes.

| ID provisional | Hallazgo                                | Naturaleza      | Prioridad              |
| -------------- | --------------------------------------- | --------------- | ---------------------- |
| AC01-QA03-01   | Separación de dominios funcionales      | Precisión       | Esencial               |
| AC01-QA03-02   | Consultas y reportes parametrizados     | Nuevo           | Esencial               |
| AC01-QA03-03   | Catálogo de métricas                    | Nuevo/precisión | Esencial               |
| AC01-QA03-04   | Consultas temporales y comparabilidad   | Nuevo/precisión | Esencial               |
| AC01-QA03-05   | Plantillas y publicaciones versionadas  | Nuevo           | Esencial               |
| AC01-QA03-06   | Receta de reproducción                  | Precisión       | Esencial               |
| AC01-QA03-07   | Reproducción humana y determinista      | Precisión       | Esencial               |
| AC01-QA03-08   | Memoria reproductiva duradera           | Nuevo/precisión | Esencial               |
| AC01-QA03-09   | Modelo profesional de defectos          | Precisión       | Esencial               |
| AC01-QA03-10   | Deduplicación y análisis causal         | Precisión       | Esencial               |
| AC01-QA03-11   | Evidencia manual y handoff              | Nuevo/precisión | Esencial               |
| AC01-QA03-12   | Exportación por destinatario            | Precisión       | Esencial               |
| AC01-QA03-13   | PDF y XLSX propios                      | Nuevo           | Ampliación recomendada |
| AC01-QA03-14   | Auditoría y decisión de entrega         | Nuevo/precisión | Esencial               |
| AC01-QA03-15   | Integración con gestores y distribución | Nuevo           | Integración externa    |

# **8. Hallazgos y propuestas contractuales**

## **AC01-QA03-01 · Dominios funcionales y relaciones canónicas**

**Problema profesional.** Un sistema que almacena por separado casos, resultados, defectos y reportes puede perder las relaciones entre ellos o mantener versiones contradictorias de los mismos hechos.

**Escenario y actores.** Un QA Lead modifica un caso después de un defecto. Semanas después, un desarrollador necesita revisar los pasos originales y no la versión corregida.

**Evidencia.** Q02 §§2–3, Q04 MEM-001.1–001.3, CAS-001.3, Q12 AR-46. Los tipos existentes C01–C02 muestran modelos de reportes y telemetría que todavía no representan toda esta relación.

**Propuesta.** Incorporar explícitamente los cinco dominios funcionales de la sección 6 mediante relaciones por identidad y revisión:

- Requisito o regla → caso → revisión.
- Caso → plan → obligación → intento.
- Intento → afirmación → testigo.
- Defecto → ocurrencia → intento.
- Receta → revisiones y ocurrencias de origen.
- Reporte → consulta → corte → resultados autorizados.

**Dependencias.** QA-01, QA-02, MEM-001.3, MEM-003.6, AR-04.

**Riesgo y costo relativo.** Moderado. Introducir entidades redundantes incrementaría migraciones, almacenamiento y mantenimiento.

**Alternativa.** Extender las entidades existentes mediante relaciones tipadas, en lugar de crear cinco nuevos subsistemas.

**Aceptación.** Revisar un caso y generar dos intentos en versiones diferentes. Consultar el defecto original debe recuperar la revisión utilizada en aquel intento. Ninguna actualización del caso puede modificar retroactivamente sus reportes históricos.

**Decisión requerida.** Precisión de contrato lógico; no requiere elegir arquitectura física.

## **AC01-QA03-02 · Reportes parametrizados sin dependencia de IA**

**Problema profesional.** Generar un reporte por ejecución no resuelve solicitudes transversales de gestión.

**Escenario y actores.** El gerente solicita defectos abiertos de prioridad alta, encontrados entre dos fechas, agrupados por módulo y versión, excluyendo evidencias privadas.

**Evidencia.** REP-001.2 requiere historial y comparativas, pero C01 y C02 muestran una representación y filtrado limitados. Azure Test Plans permite consultar progreso y agrupar resultados mediante vistas y gráficos configurables.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://learn.microsoft.com\&sz=32)

Microsoft Learn+1



**Propuesta.** Incorporar un servicio de consultas tipadas con dimensiones, filtros, campos y agrupaciones expresamente permitidos.

Proyección conceptual:

```
report_definition:
  schema_version: 1
  dataset: defects
  template: defect_summary
  scope_ref: authorized_scope
  filters:
    lifecycle: open
    severity:
      - critical
      - high
    observed_between:
      from: 2026-10-01
      to_exclusive: 2026-11-01
  group_by:
    - module
    - affected_version
  fields:
    - defect_id
    - title
    - severity
    - reproduction_state
  evidence_policy: sanitized
  locale: es-MX
```

Este ejemplo es conceptual, no una especificación técnica aprobada.

La consulta debe admitir, cuando existan datos autorizados:

| Operación   | Comportamiento requerido                        |
| ----------- | ----------------------------------------------- |
| Filtrar     | Por fecha, versión, módulo, actor, rol y estado |
| Agrupar     | Por dimensiones permitidas                      |
| Ordenar     | Mediante campos registrados                     |
| Seleccionar | Campos compatibles con el dataset               |
| Comparar    | Cortes y estratos comparables                   |
| Profundizar | Desde agregados hasta registros fuente          |
| Paginar     | Sin perder consistencia ni autoridad            |
| Exportar    | Mediante proyección autorizada                  |
| Explicar    | Denominadores, omisiones y procedencia          |

El HOST puede traducir lenguaje natural a una propuesta de consulta. El núcleo debe validarla antes de resolverla. La consulta deberá funcionar igualmente mediante una interfaz humana o CLI, sin HOST.

**Comportamiento negativo.** Rechazar SQL libre, código ejecutable, consultas sobre campos inexistentes y agregaciones que revelen información de otros ámbitos.

**Dependencias.** AR-04, AR-24, AR-50, AR-52, QA-02.

**Riesgo y costo relativo.** Moderado-alto. Una capacidad indiscriminada de consultas puede introducir filtraciones por agregados o consumo excesivo de recursos.

**Alternativa.** Catálogo de consultas predefinidas con parámetros ampliables. Se recomienda esta modalidad frente a un constructor BI universal.

**Aceptación.** Generar el mismo reporte semántico mediante CLI, MCP e interfaz humana, sin IA conectada. Cada total debe ser trazable a su conjunto autorizado. Una petición equivalente sobre otro tenant debe quedar denegada.

**Decisión requerida.** Ampliación funcional explícita de REP-001.2.

## **AC01-QA03-03 · Catálogo de métricas y denominadores**

**Problema profesional.** Un porcentaje de éxito puede ocultar pruebas omitidas, cobertura insuficiente, errores técnicos y cambios de alcance.

**Escenario y actores.** Un responsable de entrega recibe un reporte de 100 % PASS, pero solo se ejecutaron 5 de 100 casos aplicables.

**Evidencia.** AV-04 protege la semántica de resultados y AV-08 dispone de denominadores específicos para la aceptación de QAP. Sin embargo, las métricas profesionales ordinarias del AUT requieren un contrato adicional de consulta. ISTQB CTFL v4.0.1 incluye métricas y comunicación del progreso y la calidad.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.istqb.com\&sz=32)

ISTQB.com+1



**Propuesta.** Registrar cada métrica con identidad, definición, unidad, población, numerador, denominador, exclusiones, versión y disponibilidad histórica.

Catálogo inicial propuesto:

| Métrica                  | Definición                                                                  |
| ------------------------ | --------------------------------------------------------------------------- |
| Cobertura de diseño      | Obligaciones aplicables con casos adecuados / obligaciones aplicables       |
| Cobertura de ejecución   | Obligaciones aplicables con intento realizado / obligaciones aplicables     |
| Cobertura acreditada     | Obligaciones con testigo suficiente / obligaciones aplicables               |
| PASS sobre evaluables    | PASS funcionales / conjunto funcionalmente evaluado según definición        |
| FAIL sobre evaluables    | FAIL funcionales / mismo universo declarado                                 |
| Cumplimiento del alcance | Obligaciones requeridas satisfechas / obligaciones requeridas aplicables    |
| Bloqueos                 | Cantidad y proporción por causa                                             |
| Abstenciones             | Cantidad y proporción por causa                                             |
| Errores técnicos         | Cantidad por población de intentos                                          |
| Cleanup pendiente        | Efectos con limpieza pendiente o no acreditada                              |
| Defectos abiertos        | Defectos únicos no cerrados al corte                                        |
| Ocurrencias              | Manifestaciones registradas de defectos                                     |
| Antigüedad               | Tiempo desde detección o reapertura, según definición                       |
| Tasa de reapertura       | Defectos reabiertos / población cerrada elegible del periodo                |
| Retest verificado        | Defectos con corrección acreditada / defectos seleccionados para retest     |
| Estabilidad              | Oscilación observada en estratos comparables                                |
| Evidencia disponible     | Evidencias presentes / evidencias esperadas dentro del alcance              |
| Riesgo residual          | Riesgos no resueltos y decisiones vigentes; no necesariamente un porcentaje |

No deben mezclarse las métricas ordinarias del AUT con los pisos vinculantes de DE-03 relativos a la aceptación de QAP.

### **Escenario analítico**

### **Demostración de denominadores**

Ejemplo hipotético simplificado: todos los casos son aplicables, sin errores técnicos ni limpieza pendiente.

Casos aplicables

**100**

Casos evaluados

**5**

Casos PASS

**5**

PASS entre evaluados

# **100.0%**

5 de 5

Cobertura de ejecución

# **5.0%**

5 de 100

● PASS: 5● FAIL: 0○ Pendientes: 95

Alcance incompleto. No procede comunicar éxito funcional integral de la campaña.

**Comportamiento negativo.** Un denominador vacío debe producir `no_aplica`, `sin_datos` o el estado tipado correspondiente; nunca 100 % por defecto.

**Dependencias.** QA-01, QA-05, AR-08/52, AV-08.

**Riesgo y costo relativo.** Moderado. Las métricas incorrectamente definidas pueden inducir decisiones de entrega equivocadas.

**Alternativa.** Limitar el catálogo inicial a métricas verificables y ampliar mediante definiciones versionadas.

**Aceptación.** Con una población congelada de 100 casos y 5 PASS, QAP debe mostrar 100 % de PASS sobre evaluados, 5 % de cobertura de ejecución y el estado incompleto correspondiente. No puede presentar 100 % como cumplimiento del plan.

## **AC01-QA03-04 · Consultas temporales y comparabilidad histórica**

**Problema profesional.** Consultar el estado actual no permite reconstruir qué información estaba disponible cuando se tomó una decisión anterior.

**Escenario y actores.** Un auditor pregunta qué defectos estaban abiertos el día de una liberación, aunque posteriormente todos hayan sido corregidos.

**Evidencia.** D19 y AR-50 conservan historia; AV-04 mantiene resultados originales. C04 compara contra la última ejecución por módulo, lo que no resuelve cortes históricos ni comparabilidad completa. Allure distingue el historial entre ejecuciones de los reintentos dentro de una ejecución y utiliza identificadores de pruebas para relacionarlos.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://allurereport.org\&sz=32)

History and retries+1



**Propuesta.** Incorporar consultas históricas `as-of` sobre hechos conservados, distinguiendo:

- Momento del acontecimiento.
- Momento de registro en QAP.
- Revisión efectiva.
- Corte histórico solicitado.
- Correcciones o información incorporada posteriormente.
- Estado de disponibilidad actual de la evidencia.

No se prescribe un motor temporal completo ni una base de datos bitemporal física. Se requiere la semántica necesaria para responder correctamente.

La comparación debe clasificar resultados como:

| Estado                                | Significado                                   |
| ------------------------------------- | --------------------------------------------- |
| Comparable                            | Misma intención y condiciones relevantes      |
| Comparable con diferencias declaradas | Cambios conocidos y acotados                  |
| No comparable                         | Cambios que impiden interpretar la diferencia |
| Información insuficiente              | Faltan datos conservados o acreditados        |

**Comportamiento negativo.** No calcular una mejora atribuible al AUT cuando cambiaron las reglas, el testigo, la población o los perfiles sin una justificación de comparabilidad.

**Dependencias.** AR-45/46, D17, D19, MEM-001.3 y REG-001.1.

**Riesgo y costo relativo.** Moderado-alto. Conservar demasiadas dimensiones históricas puede aumentar considerablemente el volumen.

**Alternativa.** Cortes por campaña y eventos significativos, frente a reconstrucción detallada de cualquier segundo histórico.

**Aceptación.** Registrar un defecto el día 1, una corrección el día 10 y un retest el día 12. La consulta al día 8 debe mostrarlo abierto; la consulta actual debe reflejar su resolución acreditada. La primera no puede alterarse por los eventos posteriores.

**Límite obligatorio.** Si una dimensión histórica fue eliminada conforme a política, QAP debe informar que no dispone de ese detalle.

## **AC01-QA03-05 · Plantillas y publicaciones de reportes versionadas**

**Problema profesional.** Regenerar un reporte no equivale necesariamente a reproducir el documento que recibió un cliente.

**Escenario y actores.** Un cliente solicita seis meses después el reporte exacto con el que se aprobó una entrega. Entretanto cambiaron las plantillas y se podaron evidencias.

**Evidencia.** AR-50 ya exige manifiestos derivados e identificadores de exportación. ISO/IEC/IEEE 29119-3:2021 proporciona un marco de plantillas documentales, sin exigir a QAP un diseñador universal de documentos.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.iso.org\&sz=32)

Part 3: Test documentation



**Propuesta.** Distinguir tres entidades lógicas.

| Entidad                  | Contenido                                                         |
| ------------------------ | ----------------------------------------------------------------- |
| `ReportTemplateRevision` | Estructura, campos, presentación y versión                        |
| `ReportDefinition`       | Consulta, alcance, parámetros, métricas y finalidad               |
| `ReportPublication`      | Corte, resultado autorizado, manifiesto, fecha, autoría y versión |

Una publicación debe conservar, conforme a política:

- Identidad del reporte.
- Versión de plantilla y consulta.
- Corte de los datos.
- Alcance y omisiones.
- Huella de la representación publicada.
- Procedencia y decisión de exportación.
- Estado de conservación y verificación.

Cuando se conserve el documento exacto, podrá recuperarse. Cuando solo subsista su manifiesto y resumen, deberá declararse que no es posible restaurar los bytes originales.

**Comportamiento negativo.** Editar una plantilla nunca modifica una publicación anterior. Una regeneración posterior crea una nueva publicación vinculada.

**Dependencias.** AR-28, AR-50, D19, MEM-001.3.

**Riesgo y costo relativo.** Moderado. Almacenar cada vista efímera generada por un agente provocaría duplicación innecesaria.

**Alternativa.** Consultas efímeras por defecto y publicaciones durables solo cuando exista una acción explícita o política autorizada.

**Aceptación.** Publicar el reporte R1; modificar plantilla y cerrar un defecto; generar R2. R1 debe conservar su identidad y sus valores originales, o declarar sus limitaciones de recuperación si expiró su contenido autorizado.

## **AC01-QA03-06 · Contrato de receta de reproducción**

**Problema profesional.** Un video, una traza técnica o una lista de clics no necesariamente permiten a otro QA reproducir un defecto.

**Escenario y actores.** Un desarrollador recibe un defecto financiero. Puede ver la captura del importe incorrecto, pero desconoce las condiciones de la cuenta, el rol, la configuración y los datos necesarios para obtenerlo.

**Evidencia.** REP-001.3 ya exige un paquete reproducible. Las directrices de Mozilla solicitan pasos precisos, resultados esperados y observados, junto con el contexto pertinente. Playwright Trace Viewer facilita revisar acciones, estados y adjuntos históricos. Estas dos capacidades son complementarias, pero ninguna sustituye por sí sola una receta independiente del motor.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://bugzilla.mozilla.org\&sz=32)

bugzilla.mozilla.org+1



**Propuesta.** Incorporar `ReproductionRecipe` como entidad o estructura versionada referenciable.

No se exige una tabla específica ni duplicar los pasos de los casos.

### **Composición lógica de una receta**

1

**Identidad**

Defecto, requisito, caso, revisión e intentos de origen

2

**Contexto**

Versión del AUT, configuración, entorno, rol y región

3

**Preparación**

Precondiciones, datos sintéticos y dependencias

4

**Procedimiento**

Pasos previstos y pasos realmente realizados

5

**Verificación**

Expectativas, testigos y observaciones

6

**Cierre**

Diferencias, efectos, cleanup y limitaciones

7

**Procedencia**

Autoría, permisos requeridos y evidencia disponible

### **Campos mínimos propuestos**

| Grupo          | Contenido                                                         |
| -------------- | ----------------------------------------------------------------- |
| Identidad      | ID, revisión, estado y procedencia                                |
| Origen         | Defectos, ocurrencias e intentos relacionados                     |
| Expectativa    | Regla acreditada y revisión aplicable                             |
| Intención      | Comportamiento que se pretende reproducir                         |
| Contexto       | Versión AUT, configuración, entorno, tenant, rol y variante       |
| Región         | Locale, zona, moneda y calendario pertinentes                     |
| Datos          | Parámetros sintéticos, restricciones y referencias autorizadas    |
| Precondiciones | Estado inicial y dependencias necesarias                          |
| Pasos          | Acción, objetivo y resultado esperado por paso                    |
| Secuencia real | Orden y diferencias respecto de lo previsto                       |
| Localizadores  | Referencias semánticas y adaptadores cuando proceda               |
| Sincronización | Esperas, condiciones y ventanas de convergencia                   |
| Observaciones  | Resultados observados con procedencia                             |
| Testigos       | Tipo, independencia y suficiencia exigida                         |
| Autoridad      | Permisos requeridos, nunca concedidos por la receta               |
| Cleanup        | Compensación, reconciliación y efectos residuales                 |
| Evidencia      | Inventario, disponibilidad, omisiones y vínculos autorizados      |
| Limitaciones   | Drift, falta de datos, elementos manuales o dependencias externas |

### **Distinción fundamental**

Una receta no equivale a un intento y un intento no equivale a una receta.

La receta describe cómo investigar o reproducir. El intento registra lo que realmente ocurrió. La receta puede derivarse del intento, pero no debe convertir las desviaciones observadas en instrucciones normativas sin revisión.

**Dependencias.** CAS-001.3, PLN-001.1, DAT-001, REP-001.3, AR-04/09/46/50.

**Riesgo y costo relativo.** Moderado. Copiar completamente cada ejecución a una receta produciría duplicación y obsolescencia.

**Alternativa.** Referencias a revisiones inmutables de casos y planes, acompañadas únicamente de los datos reproductivos adicionales.

**Aceptación.** Recuperar una receta desde un defecto y demostrar que incluye preparación, expectativa, secuencia real, resultado observado y cleanup. Modificar posteriormente el caso no debe alterar la receta original.

## **AC01-QA03-07 · Reproducción humana, determinista e histórica**

**Problema profesional.** La palabra reproducción puede referirse a tres capacidades diferentes que no deben confundirse.

| Modalidad                 | Objetivo                                            |
| ------------------------- | --------------------------------------------------- |
| Reproducción humana       | Otro QA sigue instrucciones comprensibles           |
| Reproducción determinista | El ejecutor realiza operaciones tipadas autorizadas |
| Reconstrucción histórica  | Se consulta lo ocurrido en un intento anterior      |

Ver un video de una prueba anterior no constituye una nueva reproducción del defecto.

**Escenario y actores.** Después de actualizar el AUT, un QA intenta reproducir un defecto mediante una receta antigua. El sistema ha cambiado y ya no existen algunos localizadores ni condiciones.

**Evidencia.** D03, REP-001.4, REG-001.3 y AR-46. Playwright documenta los reintentos y la distinción de resultados inestables; QAP necesita preservar sus garantías adicionales sobre efectos y testigos.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://playwright.dev\&sz=32)

Playwright



**Propuesta.** Separar la factibilidad de una reproducción de su resultado.

Factibilidad candidata:

| Estado                  | Significado                                                |
| ----------------------- | ---------------------------------------------------------- |
| Intentable              | Los insumos y precondiciones disponibles permiten intentar |
| Parcialmente intentable | Existen pasos o dependencias no resueltos                  |
| Bloqueada               | Falta permiso o precondición indispensable                 |
| No determinable         | Información insuficiente para decidir                      |

Resultado de reproducción:

| Estado         | Significado                                                     |
| -------------- | --------------------------------------------------------------- |
| No intentada   | No existe nuevo intento                                         |
| Reproducida    | Se acreditó la manifestación del defecto                        |
| No reproducida | El defecto no apareció en condiciones adecuadamente comparables |
| Indeterminada  | Insuficiencia de evidencia o comparabilidad                     |
| Bloqueada      | No se pudieron completar las condiciones exigidas               |

Estas categorías son proyecciones del proceso de reproducción. **No sustituyen ni amplían unilateralmente los seis veredictos normativos de ejecución.**

La ejecución determinista debe:

1. Verificar alcance y autoridad actual.
2. Resolver insumos autorizados.
3. Comprobar versión y condiciones relevantes.
4. Rechazar drift material sin revisión acreditada.
5. Ejecutar mediante el núcleo existente.
6. Evaluar testigos y efectos.
7. Registrar un nuevo intento relacionado.

La reproducción humana deberá estar disponible en lenguaje comprensible, incluso con cero modelos de IA conectados.

**Comportamiento negativo.** Una receta importada no puede conceder acceso, abrir una sesión autenticada automáticamente sin autoridad, ni producir efectos fuera del alcance.

**Dependencias.** QA-02, QA-04, AR-04/10/46/52 y D07.

**Riesgo y costo relativo.** Moderado-alto. Reproducir acciones históricas sin validar condiciones puede duplicar efectos.

**Alternativa.** Generar instrucciones no ejecutables cuando los pasos no puedan representarse de forma segura mediante operaciones tipadas.

**Aceptación.** Un defecto reproducido manualmente, uno reproducido automáticamente y uno bloqueado por versión incompatible deben conservar resultados distintos, con el fallo original intacto.

## **AC01-QA03-08 · Memoria reproductiva duradera**

**Problema profesional.** Eliminar evidencia pesada y conservar únicamente contadores globales puede destruir la capacidad práctica de investigar defectos antiguos.

**Escenario y actores.** Transcurridos 120 días, un QA necesita recuperar los pasos de reproducción de un defecto recurrente. Ya no existe `trace.zip`, pero el defecto permanece abierto.

**Evidencia.** D19, DE-01, AR-25, AR-46 y AR-50. Allure Report conserva información simplificada de ejecuciones sucesivas para producir tendencias históricas, lo cual demuestra la utilidad de separar historia compacta y resultados detallados. QAP necesita además preservar condiciones reproductivas y garantías de procedencia.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://allurereport.org\&sz=32)

History files



**Propuesta.** Establecer tres niveles lógicos de conservación.

### **Conservación por propósito**

**Nivel 1 · Resumen histórico duradero**

Identidad, alcance, resultado sellado, métricas compactas, procedencia y eventos de conservación.

Permanente hasta eliminación expresa y sujeto a obligaciones superiores.

**Nivel 2 · Detalle estructurado**

Intentos, observaciones, pasos, diagnósticos y datos autorizados.

90 días, con protecciones y excepciones ratificadas.

**Nivel 3 · Evidencia pesada**

Videos, capturas, trazas y archivos voluminosos.

TTL diferenciados, protección por necesidad y grants vigentes.

**Activos reutilizables**\
Las reglas, casos activos y recetas autorizadas se conservan conforme a su ciclo de vida propio, sin depender de la caducidad ordinaria de una ejecución.

### **A. Mínimo histórico duradero candidato**

Debe permitir conservar, dentro de autorización:

| Información                                | Conservación propuesta                   |
| ------------------------------------------ | ---------------------------------------- |
| ID de campaña, caso e intento              | Resumen duradero                         |
| Alcance lógico saneado                     | Resumen duradero                         |
| Fecha y versión relevante                  | Resumen duradero                         |
| Veredicto sellado y cuatro ejes históricos | Resumen duradero                         |
| Causas y obligaciones relevantes           | Representación compacta                  |
| Número de intentos y relaciones causales   | Resumen duradero                         |
| Defectos relacionados                      | Referencia duradera                      |
| Receta reutilizable promovida              | Según política del activo                |
| Digest y manifiesto saneado                | Conforme a AR-28/50 y autorización       |
| Estado actual de evidencia                 | Eventos de conservación                  |
| Datos empresariales originales             | No conservar indefinidamente por defecto |
| Video y traza completos                    | Sujetos a TTL y protección aplicable     |

### **B. Promoción de información reproductiva**

No todas las ejecuciones necesitan una receta duradera independiente.

Son candidatos a promoción:

- Defectos abiertos o recurrentes.
- Casos críticos reutilizables.
- Flujos E2E de referencia.
- Handoffs expresamente autorizados.
- Reproducciones acreditadas útiles para regresión.

La promoción debe ser una operación registrada, gobernada por política. Puede ser automática cuando exista autorización previa, sin introducir aprobación humana rutinaria por caso.

Se conservarán preferentemente referencias a revisiones y datos sintéticos parametrizados, evitando copiar valores empresariales, tokens, identificadores sensibles y multimedia.

### **C. Orden de resolución de retención**

Se preserva DE-01:

1. Revocaciones efectivas y obligaciones superiores de seguridad prevalecen.
2. Proteger activos, defectos abiertos y evidencia imprescindible dentro de autorización.
3. Aplicar conservación ordinaria y TTL.
4. Reconciliar cuota y capacidad disponible.
5. Si no hay espacio suficiente, suspender admisión y escalar conforme a política.

Una receta no debe convertirse en un mecanismo para evadir una revocación de conservación mediante la duplicación de datos previamente privados.

**Dependencias.** AR-25/27/32/46/50, MEM-003.5, POL-RET-001 y QA-06.

**Riesgo y costo relativo.** Alto si se conserva indiscriminadamente; moderado si se utiliza promoción selectiva y referencias.

**Alternativa.** Conservar exclusivamente recetas vinculadas a defectos y activos relevantes, frente a guardar todas las secuencias completas para siempre. Se recomienda la primera.

**Aceptación.** Simular un corte posterior a 90 días con media expirada autorizadamente. El resumen, la receta promovida y el reporte histórico deben seguir consultables. Debe indicarse explícitamente qué evidencia ya no existe. Si se revocó el permiso de conservación, los datos afectados no pueden recuperarse desde copias creadas por la propia receta.

**Decisión requerida.** Ratificar la incorporación de recetas como activos reutilizables sujetos a su propia política. No modificar los 90 días ni los plazos multimedia ratificados.

## **AC01-QA03-09 · Modelo profesional de defectos**

**Problema profesional.** Un gestor de defectos necesita separar manifestación, clasificación, prioridad, responsabilidad, estado de resolución y verificación.

**Escenario y actores.** QA detecta un error grave en una funcionalidad poco utilizada. El impacto técnico es alto, pero Producto decide programar la corrección para otra versión.

**Evidencia.** REP-001.3/001.4 exigen gestor y máquina de estados, y AV-04 protege el retest y fallo original. CTAL-TM v3.0 contempla gestión e información de defectos.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://istqb.org\&sz=32)

istqb.org



**Propuesta.** Diferenciar las siguientes entidades y dimensiones.

| Concepto               | Responsabilidad                             |
| ---------------------- | ------------------------------------------- |
| Hallazgo               | Observación que requiere investigación      |
| Defecto                | Problema gestionado con identidad estable   |
| Ocurrencia             | Manifestación particular en un intento      |
| Firma                  | Criterio versionado de agrupación           |
| Clasificación causal   | Tipo y grado de suficiencia de la causa     |
| Severidad              | Impacto del problema                        |
| Prioridad              | Orden o urgencia de tratamiento             |
| Estado de gestión      | Situación dentro del proceso de trabajo     |
| Estado de reproducción | Resultado de las investigaciones            |
| Estado de corrección   | Situación de la solución propuesta          |
| Retest                 | Intento de verificación                     |
| Riesgo aceptado        | Decisión autorizada que no borra el defecto |

### **Ciclo conceptual**

El esquema anterior representa el flujo principal. También se requieren resoluciones alternativas: duplicado confirmado, rechazado justificadamente, diferido, riesgo aceptado, no reproducible e investigación pendiente.

No debe confundirse «no reproducido» con «corregido».

**Dependencias.** AR-08/09/46/50, QA-01, QA-02 y MEM-001.3.

**Riesgo y costo relativo.** Moderado. Replicar todas las funciones de un gestor empresarial generalista produciría alcance innecesario.

**Alternativa.** Ciclo local acotado, relaciones con gestores externos y transiciones versionadas.

**Aceptación.** Registrar un defecto de severidad crítica y prioridad diferida por decisión autorizada. El reporte debe seguir mostrando severidad crítica. Comunicar una corrección sin retest no debe cambiar el estado a corrección verificada.

## **AC01-QA03-10 · Deduplicación conservadora y análisis causal**

**Problema profesional.** El mismo mensaje de error puede corresponder a problemas diferentes; mensajes distintos pueden compartir una misma causa.

**Escenario y actores.** Dos tenants reciben HTTP 500 en el mismo módulo. En uno falta configuración y en otro existe un cálculo inválido.

**Evidencia.** REP-001.3 y la enmienda AV-01 exigen taxonomía y deduplicación sin cruces de alcance. C03 demuestra una clasificación técnica basada en mensajes, insuficiente para establecer causalidad. Allure admite categorías de resultados y reglas de agrupación, pero estas no constituyen una demostración causal.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://allurereport.org\&sz=32)

Categories



**Propuesta.** Incorporar firmas versionadas basadas, según disponibilidad, en identidad funcional, afirmación incumplida, operación, revisión, contexto comparable y señales causales permitidas.

Separar cuatro relaciones:

| Relación                    | Significado                                    |
| --------------------------- | ---------------------------------------------- |
| Coincidencia exacta         | Misma firma dentro del alcance admisible       |
| Posible duplicado           | Similitud que requiere mayor evidencia         |
| Causa compartida acreditada | Relación causal verificada                     |
| Relacionado                 | Coincidencia temática sin identidad demostrada |

Los algoritmos de similitud, incluidos los basados en IA, pueden sugerir agrupaciones, pero no fusionar autoritativamente defectos incompatibles.

Debe preservarse la taxonomía vigente: `product_bug`, `environment_error`, `automation_error`, `data_error`, `auth_expired`, `flaky` e `indeterminate`.

Además, un defecto puede tener una hipótesis de causa, una causa confirmada o una causa todavía desconocida.

**Comportamiento negativo.** No fusionar automáticamente defectos por texto de excepción, código HTTP o captura similar.

**Dependencias.** AR-04/09/46 y MEM-003.3.

**Riesgo y costo relativo.** Moderado. Una fusión incorrecta puede ocultar defectos independientes y alterar estadísticas.

**Alternativa.** Deduplicación exacta conservadora automática y sugerencias revisables para similitudes ambiguas.

**Aceptación.** Registrar diez ocurrencias de la misma causa y dos fallos con mensaje idéntico pero causas independientes. El reporte debe conservar tres defectos distintos y todas las ocurrencias, sin revelar datos cruzados.

## **AC01-QA03-11 · Evidencia manual, autoría y transferencia entre profesionales**

**Problema profesional.** QAP debe poder recibir observaciones realizadas por una persona sin convertir una declaración humana en un resultado funcional acreditado automáticamente.

**Escenario y actores.** Un QA Executor realiza pruebas manuales, adjunta una captura y entrega el caso a un desarrollador o agente para investigar el defecto.

**Evidencia.** MEM-001.4 protege ediciones manuales. AR-28 distingue integridad de procedencia y veracidad. Azure Test Plans permite registrar resultados por paso, adjuntar evidencia y crear o actualizar defectos durante una ejecución manual.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://learn.microsoft.com\&sz=32)

Microsoft Learn+1



**Propuesta.** Registrar la naturaleza de cada aportación:

| Tipo                 | Tratamiento                                           |
| -------------------- | ----------------------------------------------------- |
| Declaración humana   | Afirmación atribuida al declarante                    |
| Observación manual   | Hecho reportado con contexto y procedencia            |
| Archivo adjunto      | Evidencia cuya integridad y origen deben evaluarse    |
| Resultado externo    | Registro recibido con nivel de confianza explícito    |
| Resultado acreditado | Resultado conforme al contrato de testigo y autoridad |
| Propuesta de IA      | Inferencia no acreditada hasta validación             |

La identidad operacional del QA debe mantenerse separada del rol utilizado en el AUT.

Una persona puede actuar como QA Senior mientras ejecuta una prueba del AUT con perfil de solicitante. Ambas identidades tienen propósitos diferentes.

Las observaciones manuales deben poder incorporarse a recetas y reportes, mostrando su nivel de confianza.

Esto no significa que toda prueba manual deba quedar INDETERMINATE. Puede existir acreditación suficiente mediante un protocolo de observación humana autorizado y un testigo adecuado a la afirmación, pero no mediante la simple selección de una casilla PASS.

**Comportamiento negativo.** Importar un JSON, editar un Markdown o adjuntar una captura no puede generar por sí solo un PASS canónico.

**Dependencias.** QA-02, AR-09/28/52, MEM-003.4 y AR-50.

**Riesgo y costo relativo.** Moderado-alto. La identificación de autores locales y externos puede confundirse con autenticación fuerte.

**Alternativa.** Flujo manual local con procedencia declarada y reacreditación cuando corresponda, sin exigir infraestructura central de usuarios.

**Aceptación.** Un QA declara manualmente PASS en una operación persistente sin aportar el testigo requerido. El núcleo debe conservar la declaración sin acreditarla como PASS funcional. La ejecución posterior con testigo suficiente podrá generar un resultado válido, sin modificar la declaración anterior.

## **AC01-QA03-12 · Exportación por finalidad y destinatario**

**Problema profesional.** Una evidencia autorizada para investigación interna no está necesariamente autorizada para enviarse a un cliente, desarrollador externo o proveedor.

**Escenario y actores.** QA necesita compartir un defecto, pero la evidencia original contiene información empresarial privada.

**Evidencia.** AR-24/25/27/28/32 y AR-50. OWASP recomienda proteger los registros frente a datos sensibles e inyección de contenido, considerando también fallos de almacenamiento y acceso.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://cheatsheetseries.owasp.org\&sz=32)

OWASP Cheat Sheet Series



**Propuesta.** Conservar las dos superficies de AR-50 —exportación saneada portable y visor protegido— e introducir perfiles lógicos de entrega.

| Perfil candidato    | Contenido                                           |
| ------------------- | --------------------------------------------------- |
| Técnico interno     | Diagnóstico autorizado y detalles necesarios        |
| Desarrollador       | Receta, expectativas, diferencias y contexto mínimo |
| Ejecutivo           | Indicadores, riesgos y decisiones                   |
| Cliente             | Resultados y evidencias expresamente compartibles   |
| Auditor             | Procedencia, manifiestos y trazabilidad autorizados |
| HOST                | Contexto mínimo estructurado, sin secretos          |
| CI/CD               | Resultado tipado y campos necesarios                |
| Privado excepcional | Solo bajo grant específico de exportación           |

Un perfil de entrega no constituye una concesión de autoridad. Su contenido efectivo será la intersección de finalidad, destinatario, alcance, permisos y política vigente.

### **Garantías adicionales propuestas**

La sanitización deberá considerar no únicamente el texto visible, sino también:

- Metadatos de archivos.
- Nombres de archivos y rutas.
- URLs y parámetros.
- Identificadores correlacionables.
- Comentarios, notas y propiedades ocultas.
- Capas y objetos incrustados.
- Miniaturas, imágenes y multimedia.
- Hipervínculos y contenido activo.

No procede aplicar una redacción visual superficial que permita recuperar el contenido original mediante selección, extracción o inspección de metadatos.

La exportación deberá registrar su selección, omisiones, versión, destino autorizado, política y vínculo al origen, preservando el manifiesto derivado establecido en AR-50.

**Comportamiento negativo.** El permiso de captura no autoriza exportar. Un reporte interno tampoco puede convertirse en reporte externo simplemente cambiando su título.

**Dependencias.** DE-02, AR-27/28/32/50, QA-05.

**Riesgo y costo relativo.** Alto por exposición potencial de información sensible. Se recomienda comenzar con pocos perfiles verificables, no con políticas ilimitadas.

**Alternativa.** Compartir un reporte saneado sin multimedia y conservar la evidencia privada en el visor autenticado, cuando no exista autorización de exportación.

**Aceptación.** Generar dos reportes desde el mismo defecto: interno y externo. El externo debe excluir los campos, medios y metadatos restringidos. Intentar añadirlos posteriormente o exportarlos hacia otro ámbito debe producir rechazo verificable.

## **AC01-QA03-13 · PDF, XLSX y DOCX para reportes propios de QAP**

**Problema profesional.** HTML, Markdown y JSON son útiles, pero no cubren todas las necesidades habituales de comunicación empresarial.

**Escenario y actores.** Un cliente solicita un informe PDF de aceptación; un QA Lead necesita analizar cientos de defectos en Excel.

**Evidencia.** D10 y D11 requieren ingesta documental y validación de reportes emitidos por el AUT. AR-50 exige HTML, Markdown, CSV, JSON y JSONL propios, además de formatos existentes aplicables como JUnit.

D10 y D11 **no obligan automáticamente a QAP a generar sus propios reportes en PDF, XLSX o DOCX**.

**Propuesta.** Diferenciar el propósito de cada formato.

| Formato  | Consumidor principal                        | Clasificación                |
| -------- | ------------------------------------------- | ---------------------------- |
| HTML     | QA, desarrolladores y auditoría interactiva | Obligatorio existente        |
| Markdown | Documentación y entrega técnica             | Obligatorio existente        |
| CSV      | Análisis tabular e intercambio              | Obligatorio existente        |
| JSON     | Integración estructurada                    | Obligatorio existente        |
| JSONL    | Intercambio incremental e historial         | Obligatorio existente        |
| JUnit    | Herramientas de CI compatibles              | Preservar donde aplique      |
| PDF      | Cliente, dirección y entrega formal         | Nueva ampliación recomendada |
| XLSX     | QA Lead y análisis profesional              | Nueva ampliación recomendada |
| DOCX     | Informes corporativos editables             | Opcional                     |

### **Contrato de PDF**

Debe generar documentos legibles, sin requerir conexión externa, preservando numeración, tablas, contexto, referencias, estados y limitaciones. Las capturas incorporadas requieren autorización.

El PDF no sustituye la evidencia audiovisual ni el manifiesto original.

### **Contrato de XLSX**

Debe conservar correctamente tipos, identificadores, fechas, zonas, valores decimales, escalas y encabezados. No podrá interpretar contenido no confiable como fórmulas ejecutables.

Los riesgos de inyección de fórmulas en archivos compatibles con hojas de cálculo están documentados por OWASP.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://community.owasp.org\&sz=32)

OWASP Foundation+1



No se necesita incorporar macros, conexiones externas ni un editor completo de hojas de cálculo.

### **Contrato de DOCX**

En caso de aprobarse, deberá distinguir documento editable de evidencia acreditada. Una edición realizada por el destinatario produce una representación diferente, no un cambio válido en la fuente canónica.

### **Accesibilidad**

La presentación HTML debe cumplir los criterios aplicables de accesibilidad propia establecidos por DE-05. Los nuevos formatos deberán tener requisitos verificables específicos de estructura, lectura y navegación.

WCAG 2.2 constituye una referencia pertinente para el contenido web, pero no basta por sí sola para certificar accesibilidad integral de todos los formatos documentales.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.w3.org\&sz=32)

w3.org



**Dependencias.** AR-50, DE-05, QA-05 y proyección común de reportes.

**Riesgo y costo relativo.** Moderado-alto. Generar varios formatos aumenta la matriz de compatibilidad, seguridad y exactitud.

**Alternativas.** Exportar HTML/CSV y utilizar conversores externos autorizados, o incorporar PDF/XLSX directamente cuando el propietario ratifique el alcance.

**Aceptación.** Generar HTML, JSON y, si se aprueban, PDF/XLSX desde el mismo corte. Comparar IDs, métricas, estados y omisiones. El archivo XLSX debe tratar entradas hostiles como datos, y el PDF no debe conservar contenido restringido oculto.

**Decisión empresarial requerida.** Recomiendo incorporar PDF y XLSX al primer lanzamiento por su utilidad transversal. DOCX puede mantenerse opcional o posterior. No recomiendo convertir la generación de los tres formatos en obligación sin ratificación expresa.

## **AC01-QA03-14 · Auditoría, criterios de salida y reportes de entrega**

**Problema profesional.** Un reporte de pruebas no equivale a una aprobación de lanzamiento.

**Escenario y actores.** Una campaña tiene numerosos PASS, varios defectos pendientes y una obligación crítica sin verificar. Dirección solicita saber si puede realizarse la liberación.

**Evidencia.** D12, D21, DE-03, AV-04 y AV-08 separan veredictos, cobertura y vetos no compensables. CTFL y CTAL-TM distinguen actividades de seguimiento, control y finalización de pruebas.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.istqb.com\&sz=32)

ISTQB.com+1



**Propuesta.** Incorporar un reporte de decisión de entrega que distinga:

| Dimensión        | Información                                   |
| ---------------- | --------------------------------------------- |
| Alcance          | Qué debía probarse                            |
| Cobertura        | Qué fue diseñado, ejecutado y acreditado      |
| Resultados       | Veredictos y cuatro ejes                      |
| Riesgos          | Obligaciones pendientes y riesgos residuales  |
| Defectos         | Abiertos, verificados, diferidos y aceptados  |
| Evidencia        | Disponible, podada, suprimida o perdida       |
| Criterios        | Condiciones de entrada y salida aplicables    |
| Recomendación QA | Evaluación técnica fundamentada               |
| Decisión         | Acto independiente de la autoridad competente |

El sistema puede recomendar que una entrega no es aconsejable debido a criterios incumplidos. No debe sustituir unilateralmente al propietario ni transformar una recomendación en autorización operativa.

### **Registro de auditoría mínimo**

Los eventos materiales deben identificar actor o principal, operación, objeto, revisión, fecha, alcance, resultado, procedencia y referencias pertinentes.

Entre los eventos materiales se incluyen cambios de estado de defectos, promoción de recetas, publicaciones, exportaciones, importaciones, revocaciones, poda y decisiones de riesgo.

Debe mantenerse la distinción entre un registro históricamente inmutable bajo el modelo de amenazas aprobado y una afirmación absoluta de imposibilidad de manipulación por un administrador del sistema.

**Dependencias.** QA-01, AR-28/52, AV-08 y DE-03.

**Riesgo y costo relativo.** Moderado. Una presentación ejecutiva excesivamente simplificada puede ocultar vetos.

**Alternativa.** Reporte estructurado de criterios de salida con registro separado de decisiones, sin crear un sistema completo de gestión de releases.

**Aceptación.** Introducir un falso PASS acreditado indebidamente en una campaña con alta cobertura. El reporte debe exponer el veto no compensable. Aceptar empresarialmente otro riesgo legítimo no puede borrar dicho incidente ni rebajar los pisos DE-03.

## **AC01-QA03-15 · Integración externa y distribución de reportes**

**Problema profesional.** Los desarrolladores suelen trabajar con gestores de incidencias que no pertenecen al sistema de QA.

**Escenario y actores.** QA detecta un defecto en QAP y necesita transferirlo a GitHub Issues, Jira u otro gestor utilizado por Desarrollo.

**Evidencia.** Azure Test Plans permite asociar defectos con resultados de pruebas. GitHub dispone de formularios y plantillas estructuradas para crear incidencias.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://learn.microsoft.com\&sz=32)

Microsoft Learn+1



**Propuesta.** Permitir una relación externa tipada con:

| Campo                       | Finalidad                                 |
| --------------------------- | ----------------------------------------- |
| Sistema externo             | Identificar el gestor                     |
| Identificador               | Referencia a la incidencia                |
| Dirección de sincronización | Exportación, importación o ambas          |
| Revisión sincronizada       | Evitar actualizaciones ambiguas           |
| Estado observado            | Información recibida del sistema          |
| Última sincronización       | Vigencia del dato externo                 |
| Conflicto                   | Diferencias pendientes de resolución      |
| Autoridad                   | Permisos de lectura o escritura concretos |

El cierre de una incidencia externa no acredita por sí mismo la corrección funcional del defecto en QAP.

### **Distribución**

Deben distinguirse generación, publicación, exportación y envío.

Crear un reporte no implica permiso para enviarlo por correo, publicar en un repositorio externo o transmitirlo a una aplicación de terceros.

**Dependencias.** QA-04, AR-50, D07/D20 y MEM-003.4.

**Riesgo y costo relativo.** Alto cuando existe sincronización bidireccional, debido a duplicados, conflictos, reintentos y posibles fugas.

**Alternativas.** Para lanzamiento, exportación manual de defectos con Markdown/JSON y referencia externa. Posteriormente, conectores autorizados con operaciones idempotentes.

**Aceptación.** Exportar dos veces el mismo defecto mediante una integración idempotente no debe crear dos incidencias sin justificación. Un estado externo `closed` debe mantenerse separado de la verificación funcional de QAP.

**Clasificación.** Interoperabilidad externa. No exigir conectividad, licencia SaaS ni implementación de conectores específicos para utilizar QAP localmente.

# **9. Catálogo profesional de reportes de lanzamiento**

Recomiendo aprobar un catálogo inicial de vistas y plantillas, en lugar de desarrollar un generador independiente por cada reporte.

Todas las variantes deberían reutilizar consultas tipadas, métricas registradas y el sobre canónico de resultados.

| Reporte                  | Contenido principal                            | Prioridad        |
| ------------------------ | ---------------------------------------------- | ---------------- |
| Ejecutivo                | Estado, cobertura, defectos y riesgos          | Esencial         |
| Progreso de pruebas      | Planeadas, ejecutadas, bloqueadas y pendientes | Esencial         |
| Cobertura funcional      | Requisitos, reglas, módulos y roles            | Esencial         |
| Resultado de campaña     | Intentos, veredictos, ejes y testigos          | Esencial         |
| Caso de prueba           | Revisión, pasos y expectativas                 | Esencial         |
| Defectos                 | Severidad, prioridad, estado y ocurrencias     | Esencial         |
| Reproducción             | Receta, precondiciones y pasos                 | Esencial         |
| Retest                   | Comparación del defecto y verificación         | Esencial         |
| Regresión                | Cambios, fallos nuevos y estabilidad           | Esencial         |
| E2E                      | Secuencia, dependencias, efectos y cleanup     | Esencial         |
| Riesgos                  | Riesgo conocido, pendientes y decisiones       | Esencial         |
| Entrega                  | Criterios de salida y recomendación QA         | Esencial         |
| Histórico                | Cortes, comparativas y tendencias conservadas  | Esencial         |
| Auditoría                | Procedencia, eventos y autoridad               | Esencial         |
| Evidencias               | Inventario, integridad y disponibilidad        | Esencial         |
| Asignaciones             | Responsabilidad y progreso humano              | Depende de QA-02 |
| Seguridad                | Hallazgos y controles autorizados              | Depende de QA-05 |
| Accesibilidad            | Reglas, resultados y limitaciones              | Obligación DE-05 |
| Validación documental    | Discrepancias PDF/Excel del AUT                | Obligación D11   |
| Capacidad y rendimiento  | Mediciones autorizadas                         | Depende de QA-05 |
| Productividad individual | Indicadores operacionales contextualizados     | Opcional         |
| Reporte predictivo       | Estimaciones y tendencias inferidas            | Posterior        |

La cantidad de reportes no equivale a la cantidad de motores que deben construirse.

Una infraestructura compartida de consultas, métricas y proyecciones debe permitir resolver la mayoría de estas necesidades sin duplicación.

## **9.1. Límite de cobertura de reportes**

QAP deberá ser capaz de responder preguntas sobre la información que haya conservado y que esté autorizado a consultar.

No deberá prometer responder cualquier pregunta imaginable.

| Solicitud                          | Comportamiento                                |
| ---------------------------------- | --------------------------------------------- |
| Defectos abiertos por módulo       | Responder si existen datos                    |
| Casos pendientes por responsable   | Responder si existen asignaciones registradas |
| Tiempo de respuesta medio          | Responder si existen mediciones comparables   |
| Datos privados de otro tenant      | Denegar                                       |
| Pasos históricos no registrados    | Declarar ausencia                             |
| Video eliminado                    | Declarar indisponibilidad                     |
| Causa raíz desconocida             | Presentar incertidumbre                       |
| Reporte de información inexistente | No inventar                                   |

Un buen generador de reportes no se mide solo por lo que puede producir, sino también por su capacidad de abstenerse correctamente.

# **10. Escenario de referencia: paquete de defecto reproductivo**

El siguiente ejemplo es exclusivamente hipotético. No corresponde a una prueba ejecutada ni a datos de un sistema empresarial.

DEF-SYN-0042 · Ejemplo sintético

## **Importe total incorrecto después de aplicar un descuento**

Severidad alta

Estado de gestión

**Abierto**

Reproducción

**Reproducida**

Versión hipotética

2.4.0

Entorno

QA sintético

**Precondiciones**

Perfil de solicitante autorizado. Importe base sintético de $1,000.00 MXN. Descuento del 10 %. Regla de cálculo acreditada para el fixture.

**Pasos de reproducción**

1

**Abrir formulario**

Formulario disponible

2

**Introducir importe base de $1,000**

Importe aceptado

3

**Aplicar descuento de 10 %**

Descuento calculado

4

**Guardar mediante operación autorizada**

Registro de prueba persistido

5

**Consultar importe mediante testigo independiente**

Importe definitivo recuperado

Esperado

# **$900.00**

Observado

# **$950.00**

**Resultado hipotético:** FAIL funcional, sujeto a que el testigo descrito satisfaga las condiciones de acreditación.

**Información de reproducción y conservación**

Receta estructurada conservada

Referencia a regla y revisión originales

Video histórico podado conforme a política

Se requieren permisos actuales para una nueva reproducción

La ausencia del video no impide consultar los pasos conservados. La posibilidad de acreditar actualmente el resultado histórico depende de los testigos restantes.

Un reporte como este debe poder producirse de forma determinista a partir de datos estructurados.

La IA podría mejorar opcionalmente la explicación, pero no inventar pasos, causa raíz, valores observados o permisos.

# **11. Escenarios de aceptación transversales**

Se presentan casos de validación futura diseñados documentalmente. **Ninguno ha sido ejecutado durante AC-01.**

## **11.1. Matriz de escenarios**

| ID      | Escenario                                | Resultado exigido                              |
| ------- | ---------------------------------------- | ---------------------------------------------- |
| Q03-T01 | Reporte sin IA conectada                 | Generación completa mediante consultas tipadas |
| Q03-T02 | Filtro de datos por tenant               | Aislamiento y ausencia de fugas por agregados  |
| Q03-T03 | Solicitud de métrica inexistente         | Ausencia explícita, no invención               |
| Q03-T04 | Campaña con obligaciones omitidas        | No acreditar cumplimiento integral             |
| Q03-T05 | Consulta histórica anterior a corrección | Estado válido al corte solicitado              |
| Q03-T06 | Cambio de plantilla                      | Publicación anterior inalterada                |
| Q03-T07 | Defecto transferido a otro QA            | Receta comprensible y procedencia conservada   |
| Q03-T08 | Reproducción determinista autorizada     | Nuevo intento y testigo suficiente             |
| Q03-T09 | Receta con permisos caducados            | Reproducción bloqueada                         |
| Q03-T10 | Reproducción con drift material          | Revisión necesaria o abstención                |
| Q03-T11 | Recuperación después de poda             | Resumen y receta autorizados disponibles       |
| Q03-T12 | Revocación de conservación               | Supresión aplicable sin copias evasivas        |
| Q03-T13 | HTTP 500 sin causa acreditada            | Clasificación indeterminada                    |
| Q03-T14 | PASS posterior a FAIL comparable         | FAIL histórico e inconsistencia preservados    |
| Q03-T15 | Retest de corrección legítima            | Resolución solo en alcance acreditado          |
| Q03-T16 | Declaración manual sin testigo           | Sin promoción a PASS canónico                  |
| Q03-T17 | Alteración de resultado importado        | Rechazo o estado no acreditado                 |
| Q03-T18 | Exportación cruzada de evidencia         | Denegación sin fuga                            |
| Q03-T19 | Inyección en CSV/XLSX                    | Datos tratados de forma segura                 |
| Q03-T20 | Sincronización externa repetida          | Sin duplicados indebidos                       |
| Q03-T21 | Reporte durante falta de espacio         | Fallo cerrado y sin publicación incompleta     |
| Q03-T22 | Verificación después de revocación       | Estados históricos y actuales separados        |

## **11.2. Escenario completo sin IA**

Un QA Senior selecciona casos previamente registrados. Un QA Executor ejecuta las instrucciones manuales y documenta sus observaciones. QAP registra un defecto y genera una receta.

Posteriormente, el Senior consulta:

- Casos pendientes.
- Defectos confirmados.
- Observaciones que requieren acreditación adicional.
- Reporte de entrega.
- Receta para el desarrollador.

Todo el flujo documental debe funcionar con cero modelos conectados y sin suscripciones externas.

Las actividades humanas no controladas directamente por QAP tendrán procedencia y limitaciones explícitas.

## **11.3. Escenario híbrido**

El QA registra manualmente un defecto. Un HOST propone automatizar su reproducción utilizando los pasos conservados.

El núcleo verifica la propuesta y la relaciona con la identidad original del caso.

Si existen autoridad, datos, condiciones y testigos suficientes, se crea una revisión ejecutable. Su ejecución produce un nuevo intento, sin modificar retroactivamente el registro manual.

Debe existir continuidad semántica entre ambos modos, no dos bibliotecas de pruebas desconectadas.

## **11.4. Escenario autónomo**

QAP detecta un defecto durante una campaña autorizada.

El sistema registra su ocurrencia, evalúa si pertenece a un defecto conocido, conserva la evidencia permitida y genera automáticamente una receta candidata conforme a política.

No se requiere que una persona apruebe rutinariamente cada caso elegible, ni que un modelo vuelva a analizar todas las evidencias para poder producir el reporte.

Las incertidumbres causales y los bloqueos permanecen visibles.

## **11.5. Escenario crítico: poda y recuperación histórica**

Día 0

**Detección**

Fallo acreditado, ocurrencia registrada, receta autorizada y reporte publicado.

Día 14

**Evaluación de conservación**

Se preserva evidencia indispensable del defecto abierto dentro del grant vigente.

Día 90

**Retención estructurada**

Se evalúa detalle elegible para poda; permanecen activos y protecciones aplicables.

Día 120

**Consulta histórica**

Se recuperan resumen, receta autorizada y estado de disponibilidad de evidencia.

Día 125

**Retest**

Nuevo intento con autoridad vigente y vínculo al defecto original.

Cronología hipotética. No fija nuevos TTL ni obliga a podar evidencia protegida en esas fechas.

La condición de éxito no consiste en recuperar exactamente todos los datos originales.

Consiste en recuperar lo que se debía conservar, explicar lo que ya no existe y evitar que la ausencia de archivos altere el resultado histórico.

## **11.6. Escenario negativo combinado**

Un archivo externo afirma que todas las pruebas fueron PASS. El archivo fue modificado y solicita incorporar un video privado de otro tenant.

QAP debe rechazar la acreditación indebida, impedir el acceso cruzado, registrar el evento y preservar el estado de los resultados originales.

El éxito de otras pruebas no compensa este incidente.

# **12. Impacto sobre AV-01–08**

| Auditoría | Garantía preservada                       | Impacto de QA-03                                              |
| --------- | ----------------------------------------- | ------------------------------------------------------------- |
| AV-01     | Identidad, integridad normativa y alcance | Trazar nuevos deltas sin duplicar requisitos                  |
| AV-02     | Privacidad, custodia y autenticidad       | Extender políticas a consultas, recetas y formatos candidatos |
| AV-03     | Memoria, continuidad y paridad            | Incorporar recuperación de recetas y consultas tipadas        |
| AV-04     | Oráculos, efectos y veracidad             | Aplicar semántica a reportes y reproducción manual            |
| AV-05     | Documentos y reportes                     | Completar AR-50 y separar formatos propios de D11             |
| AV-06     | Fidelidad y recursos                      | Medir costos de reportes, consultas y conservación            |
| AV-07     | Migración y escritor único                | Preservar identidad y procedencia de registros migrados       |
| AV-08     | Aceptación, cobertura y vetos             | Añadir criterios de aceptación para deltas ratificados        |

## **12.1. Garantías que no deben modificarse**

- Los cuatro ejes y seis veredictos de AR-52.
- La tabla total de códigos y agregación vigente.
- Los niveles de testigos y suficiencia causal.
- El fallo cerrado ante autoridad insuficiente.
- La ausencia de falsos PASS.
- La separación entre firma, integridad de carga y verificación actual.
- La protección de evidencia desde el primer byte.
- La conservación independiente de los cuatro grants.
- La no mutación de producción y referencias de solo lectura.
- La prohibición de modificar código del AUT.
- Los pisos y vetos no compensables de DE-03.
- El piloto G6.5 previo a GA.
- La accesibilidad propia y del AUT bajo DE-05.

Ningún reporte de gestión deberá introducir un estado alternativo que permita evadir estas garantías.

## **12.2. Relación con las pruebas existentes**

Las propuestas pueden incorporarse posteriormente mediante ampliaciones focalizadas de E1–E8, cuando se autorice esa etapa.

| Familia de validación       | Deltas candidatos                               |
| --------------------------- | ----------------------------------------------- |
| Persistencia y recuperación | Recetas, publicaciones, cortes y poda           |
| Autoridad y aislamiento     | Consultas, perfiles de entrega y exportaciones  |
| Veracidad                   | Reproducciones, retest y declaraciones manuales |
| Portabilidad                | Recetas y reportes recuperables                 |
| Paridad                     | Consultas humanas, MCP, CLI y CI                |
| Recursos                    | Costos de consultas y almacenamiento            |
| Accesibilidad               | Presentación de reportes propios                |
| Piloto representativo       | Entrega, recuperación y handoff profesional     |

Esta correspondencia es documental. No constituye un WBS, calendario, asignación de sprints ni autorización para ejecutar experimentos.

# **13. Dependencias con las otras especialidades**

## **QA-01 · Estrategia y dirección**

Debe definir las entidades de planificación, poblaciones de cobertura, criterios de salida y conceptos de riesgo que QA-03 proyectará en reportes.

QA-03 no debe introducir una segunda taxonomía de casos o campañas.

## **QA-02 · Operación humana**

Debe definir autoría, asignaciones, modalidades manuales, interfaz de trabajo y handoff.

QA-03 consume estos hechos y los presenta, sin crear un segundo escritor ni conceder autoridad al visor histórico.

## **QA-04 · Automatización e integración**

Debe definir el contrato de operaciones reutilizables, adaptadores y ejecución determinista.

QA-03 establece qué información necesita una receta y cómo se relaciona con los intentos, pero no selecciona un motor de automatización.

## **QA-05 · Calidad no funcional**

Debe definir las mediciones, controles, ámbitos y oráculos pertinentes.

QA-03 proporciona reportes de seguridad, accesibilidad y rendimiento cuando existan resultados autorizados. No acredita categorías de calidad mediante gráficos o documentación sin testigos.

## **QA-06 · Datos e integraciones empresariales**

Debe establecer restricciones de fixtures, parámetros, precisión y dependencia de estados de negocio.

QA-03 necesita datos sintéticos reutilizables y referencias de preparación, evitando conservar innecesariamente registros empresariales originales.

# **14. Riesgos arquitectónicos y de producto**

| Riesgo                                             | Impacto    | Mitigación                                         |
| -------------------------------------------------- | ---------- | -------------------------------------------------- |
| Duplicar información entre dominios                | Alto       | Referencias y revisiones canónicas                 |
| Guardar todas las acciones indefinidamente         | Alto       | Resumen compacto y promoción selectiva             |
| Generar reportes con IA exclusivamente             | Alto       | Consultas y plantillas deterministas               |
| Métricas con denominadores incorrectos             | Alto       | Catálogo versionado y drill-down                   |
| Cerrar defectos por un PASS posterior              | Alto       | Aplicar retest de AV-04                            |
| Confundir observación manual con prueba acreditada | Alto       | Procedencia y evaluación del testigo               |
| Reproducir acciones sin permisos actuales          | Crítico    | Revalidación antes de efectos                      |
| Filtrar información por agregados                  | Crítico    | Autoridad antes de agrupación                      |
| Exportar datos ocultos                             | Crítico    | Sanitización e inspección de formatos              |
| Conservar datos revocados en recetas               | Crítico    | Política común de conservación                     |
| Pérdida de comparabilidad histórica                | Alto       | Estratos y cortes explícitos                       |
| Diseñar un gestor empresarial completo             | Alto       | Ciclo de defectos acotado                          |
| Costos excesivos por renderizado masivo            | Medio-alto | Paginación, presupuestos y generación bajo demanda |

## **14.1. Costo de memoria**

No es posible estimar almacenamiento real sin mediciones futuras sobre las representaciones seleccionadas.

Como análisis de sensibilidad puramente hipotético, considérese un resumen compacto de 10 KiB por intento.

### **Modelo hipotético de crecimiento del historial**

Intentos por día

**1,000**

Resumen por intento

**10 KiB**

Horizonte analizado

**3 años**

Volumen lógico estimado de resúmenes

# **10.44 GiB**

1,095,000 intentos históricos.Excluye índices, WAL, respaldos, recetas, conocimiento, reportes publicados y multimedia. No constituye una medición de QAP ni un valor de configuración recomendado.

Incluso los resúmenes compactos tienen un costo acumulativo. Por ello, «permanente» no debe interpretarse como «sin gobierno de recursos».

Deben conservarse las garantías de DE-01: medición, reservas, alertas y suspensión de admisión cuando no pueda respetarse la política.

## **14.2. Costo de tokens**

La generación de reportes debería consumir cero tokens de modelos cuando:

- Se consultan métricas registradas.
- Se filtran defectos.
- Se genera una plantilla conocida.
- Se recupera una receta.
- Se comparan intentos bajo reglas existentes.
- Se reconstruye un resumen histórico conservado.

La IA puede aportar valor al explicar resultados, sugerir investigaciones o formular consultas complejas.

Sin embargo, hacer que un agente relea todos los resultados de ejecución para reconstruir cada reporte sería ineficiente y contrario al propósito de memoria de QAP.

No se proponen porcentajes de ahorro sin mediciones.

# **15. Comparación con herramientas y prácticas existentes**

La comparación se limita a capacidades documentadas, no a una evaluación comercial exhaustiva ni a resultados de pruebas realizadas por este investigador.

| Herramienta o marco       | Capacidad observada                         | Aplicación para QAP                       |
| ------------------------- | ------------------------------------------- | ----------------------------------------- |
| ISTQB CTFL v4.0.1         | Seguimiento, control y defectos             | Catálogo de métricas y reportes           |
| ISTQB CTAL-TM v3.0        | Gestión avanzada de pruebas                 | Triage, responsabilidades y comunicación  |
| ISO/IEC/IEEE 29119-3:2021 | Plantillas de documentación                 | Estructuras documentales reutilizables    |
| Azure Test Plans          | Planes, seguimiento y resultados manuales   | Handoff y reportes operacionales          |
| Allure Report 2/3         | Historial, reintentos y categorías          | Identidades y tendencias                  |
| Playwright Trace Viewer   | Inspección histórica de acciones y adjuntos | Diagnóstico técnico y reproducción visual |
| Mozilla Bugzilla          | Descripción precisa de defectos             | Calidad del paquete reproductivo          |
| GitHub Issues             | Formularios y plantillas de incidencias     | Intercambio con desarrollo                |
| OWASP                     | Seguridad de registros y exportaciones      | Sanitización y prevención de inyección    |
| W3C WCAG 2.2              | Accesibilidad de contenido web              | Presentación accesible de resultados      |

Las capacidades indicadas se encuentran documentadas por sus organizaciones responsables.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.istqb.com\&sz=32)

ISTQB.com+9



## **15.1. Diferenciación potencial de QAP**

QAP no necesita replicar todas estas herramientas.

Su valor diferencial potencial consiste en relacionar de manera coherente:

Conocimiento acreditado del AUT

Casos y planes reutilizables

Ejecución manual o determinista

Resultados con testigos suficientes

Defectos y memoria reproductiva

Consultas y reportes profesionales

Aprendizaje y regresión

Un flujo integrado de esta naturaleza puede reducir duplicaciones de trabajo, especialmente cuando alternan QA humanos y agentes. Es una hipótesis de valor del producto, no una ventaja comercial demostrada.

# **16. Capacidades innecesarias, opcionales y fuera de alcance**

## **16.1. No necesarias para el primer lanzamiento**

| Capacidad                                       | Justificación                                           |
| ----------------------------------------------- | ------------------------------------------------------- |
| Cinco bases físicas independientes              | La necesidad es separación lógica                       |
| Motor BI universal                              | Excesivo frente a consultas tipadas                     |
| Constructor libre de SQL                        | Riesgo innecesario de seguridad y semántica             |
| Editor completo de documentos                   | QAP no es una suite ofimática                           |
| Copia completa de Jira o Azure DevOps           | Duplicaría funciones generalistas                       |
| Base vectorial obligatoria                      | No sustituye trazabilidad exacta                        |
| Servicio central multiusuario obligatorio       | Contradice la modalidad inicial local                   |
| Almacenamiento permanente de toda la multimedia | Incompatible con objetivos de retención                 |
| Grabación indiscriminada de acciones humanas    | Riesgo de privacidad                                    |
| IA obligatoria para reportes                    | Contradice la autonomía determinista y operación humana |
| Corrección automática del código del AUT        | Prohibida por el alcance vigente                        |
| Certificación universal de calidad              | No justificable mediante reportes                       |

## **16.2. Capacidades opcionales o posteriores**

Se consideran valiosas, pero no indispensables para resolver la necesidad profesional inicial:

- Diseñador visual avanzado de reportes.
- Plantillas corporativas altamente personalizables.
- DOCX nativo.
- Distribución programada por correo.
- Paneles compartidos entre equipos concurrentes.
- Análisis predictivo de defectos.
- Búsqueda semántica avanzada.
- Integraciones bidireccionales completas con gestores externos.
- Flujos empresariales personalizados de aprobación.

Estas capacidades no deberían convertirse en dependencias para ejecutar una prueba o generar un reporte local.

# **17. Decisiones que deben elevarse al propietario**

No toda precisión contractual necesita una nueva decisión empresarial.

Las siguientes cuestiones sí alteran explícitamente el alcance o sus costos y deben ratificarse antes de modificar el catálogo.

| Decisión provisional               | Alternativas                                                                   | Recomendación             |
| ---------------------------------- | ------------------------------------------------------------------------------ | ------------------------- |
| DE-AC03-01: reportes profesionales | Reportes por ejecución / consultas parametrizadas y catálogo inicial           | Consultas parametrizadas  |
| DE-AC03-02: memoria reproductiva   | Conservar recetas solo temporalmente / activos promovidos sujetos a política   | Activos promovidos        |
| DE-AC03-03: formatos propios       | Mantener formatos actuales / incorporar PDF y XLSX / añadir también DOCX       | PDF y XLSX; DOCX opcional |
| DE-AC03-04: publicaciones          | Solo generación efímera / publicaciones versionadas con conservación gobernada | Publicaciones versionadas |
| DE-AC03-05: colaboración externa   | Export manual / conectores iniciales / sincronización bidireccional completa   | Export manual inicial     |

Los identificadores anteriores son etiquetas provisionales para facilitar la deliberación. No constituyen nuevas decisiones DE ratificadas.

### **Decisiones que no necesitan reabrirse**

No recomiendo consultar nuevamente al propietario sobre:

- Modalidad local inicial.
- HOST y DETERMINISTIC.
- Retención ordinaria de 90 días.
- Resumen histórico permanente.
- Cuatro permisos independientes para evidencia privada.
- Producción y referencia de solo lectura.
- Pisos de calidad ratificados.
- Prohibición de falsos PASS.
- Necesidad del piloto empresarial autorizado.

Las propuestas se subordinan a estas decisiones.

# **18. Recomendación de consolidación de requisitos**

## **18.1. Precisiones sobre requisitos existentes**

| Requisito vigente | Precisión propuesta                                     |
| ----------------- | ------------------------------------------------------- |
| REQ-REP-001.1     | Evidencia y procedencia para observaciones manuales     |
| REQ-REP-001.2     | Modelo común de consultas, históricos y reportes        |
| REQ-REP-001.3     | Entidad de defecto, ocurrencias y contrato reproductivo |
| REQ-REP-001.4     | Estados separados de reproducción, corrección y retest  |
| REQ-MEM-001.3     | Versionado de recetas y referencias históricas          |
| REQ-MEM-003.3     | Firmas causales conservadoras                           |
| REQ-MEM-003.4     | Intercambio de recetas y defectos saneados              |
| REQ-MEM-003.5     | Compactación y promoción de información reproductiva    |
| REQ-REG-001.2     | Métricas comparables y oscilación                       |
| POL-RET-001       | Mínimo histórico duradero y activos promovidos          |
| AR-50             | Perfiles de exportación y publicaciones versionadas     |

## **18.2. Nuevas obligaciones candidatas**

Sin asignar todavía IDs normativos definitivos, considero necesario evaluar la incorporación expresa de estas capacidades:

| Obligación candidata              | Alcance                                                 |
| --------------------------------- | ------------------------------------------------------- |
| Consulta profesional determinista | Filtros, agrupaciones y selección de campos autorizados |
| Catálogo de métricas              | Definiciones, denominadores y procedencia               |
| Consulta histórica temporal       | Cortes disponibles y comparabilidad                     |
| Plantillas y publicaciones        | Versionado, recuperación y límites                      |
| Memoria reproductiva durable      | Promoción selectiva de recetas                          |
| Reporte de decisión de entrega    | Criterios, riesgos y autoridad separada                 |
| Generación de PDF/XLSX            | Condicionada a ratificación empresarial                 |

No recomiendo determinar todavía si estas obligaciones deben convertirse en siete requisitos nuevos, ampliaciones o subobligaciones de requisitos existentes.

Esa conciliación corresponde al Orquestador, una vez recibidos los seis informes.

# **19. Fuentes profesionales consultadas**

Las siguientes referencias se utilizaron para contrastar capacidades y prácticas. Cuando una documentación de producto se mantiene actualizada continuamente, se indica la familia o versión identificada, sin atribuirle una versión no comprobada.

| Ref. | Fuente primaria                                                                                                                                                                                                    | Versión o referencia                      |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| F01  | [ISTQB — CTFL Syllabus](https://www.istqb.com/certifications/ctfl/syllabus/?utm_source=chatgpt.com)                                                                                                                | v4.0.1, 15 de septiembre de 2024          |
| F02  | [ISTQB — Advanced Level Test Management](https://istqb.org/certifications/certified-tester-advanced-level-test-management-ctal-tm-v3-0/?utm_source=chatgpt.com)                                                    | CTAL-TM v3.0                              |
| F03  | [ISO/IEC/IEEE 29119-3](https://www.iso.org/standard/79429.html?utm_source=chatgpt.com)                                                                                                                             | Edición 2021                              |
| F04  | [Mozilla — Bug Writing Guidelines](https://bugzilla.mozilla.org/page.cgi?id=bug-writing.html\&utm_source=chatgpt.com)                                                                                              | Documentación oficial en línea            |
| F05  | [Microsoft — Run Manual Tests](https://learn.microsoft.com/en-us/azure/devops/test/run-manual-tests?view=azure-devops\&utm_source=chatgpt.com)                                                                     | Azure DevOps                              |
| F06  | [Microsoft — Manage Test Runs](https://learn.microsoft.com/en-us/azure/devops/test/test-runs?view=azure-devops\&utm_source=chatgpt.com)                                                                            | Azure DevOps                              |
| F07  | [Microsoft — Track Test Status](https://learn.microsoft.com/en-us/azure/devops/test/track-test-status?view=azure-devops\&utm_source=chatgpt.com)                                                                   | Azure DevOps                              |
| F08  | [Allure — History and Retries](https://allurereport.org/docs/history-and-retries/?utm_source=chatgpt.com)                                                                                                          | Allure Report 2 y 3                       |
| F09  | [Allure — History Files](https://allurereport.org/docs/how-it-works-history-files/?utm_source=chatgpt.com)                                                                                                         | Allure Report 2 y 3                       |
| F10  | [Allure — Test Identifiers](https://allurereport.org/docs/how-it-works-test-identifiers/?utm_source=chatgpt.com)                                                                                                   | Allure Report                             |
| F11  | [Allure — Categories](https://allurereport.org/docs/categories/?utm_source=chatgpt.com)                                                                                                                            | Allure Report                             |
| F12  | [Playwright — Trace Viewer](https://playwright.dev/docs/trace-viewer?utm_source=chatgpt.com)                                                                                                                       | Documentación oficial en línea            |
| F13  | [Playwright — Retries](https://playwright.dev/docs/test-retries?utm_source=chatgpt.com)                                                                                                                            | Documentación oficial en línea            |
| F14  | [OWASP — Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html?utm_source=chatgpt.com)                                                                                      | Documentación oficial en línea            |
| F15  | [OWASP — CSV Injection](https://community.owasp.org/attacks/CSV_Injection?utm_source=chatgpt.com)                                                                                                                  | Documentación oficial en línea            |
| F16  | [W3C — WCAG 2.2](https://www.w3.org/TR/2024/REC-WCAG22-20241212/?utm_source=chatgpt.com)                                                                                                                           | Recomendación del 12 de diciembre de 2024 |
| F17  | [GitHub — Configuring Issue Templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository?utm_source=chatgpt.com) | GitHub Docs                               |

## **19.1. Limitaciones de fuentes y verificación**

Se consultaron páginas públicas oficiales, documentación de herramientas y referencias públicas de los programas ISTQB indicados.

No se realizó una revisión cláusula por cláusula de los programas completos de certificación ni del texto íntegro de ISO/IEC/IEEE 29119-3:2021. Para este último se utilizó su descripción pública oficial. No se atribuyen obligaciones específicas a cláusulas de pago no consultadas.

Tampoco se realizó una evaluación comparativa mediante instalaciones o pruebas de herramientas comerciales.

La inspección del repositorio fue estática y focalizada. Las divergencias constatadas en los archivos citados no implican que todos los demás caminos del sistema hayan sido inspeccionados o que no existan mecanismos complementarios.

Los tamaños, escenarios, métricas y estructuras conceptuales propuestas son diseños hipotéticos para evaluación de producto, no resultados experimentales.

Por tanto, el informe no acredita conformidad ISO, ISTQB, WCAG ni certificación funcional de QAP.

# **20. Dictamen final para el Orquestador Principal**

## **20.1. Evaluación de las propuestas del Orquestador**

| Hipótesis                          | Dictamen independiente                                                        |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| Cinco dominios lógicos             | Aceptable con separación funcional                                            |
| Cinco almacenes independientes     | No justificado                                                                |
| Memoria específica de reproducción | Necesaria como capacidad lógica                                               |
| Memoria específica de reportes     | Necesaria para definiciones y publicaciones, no para duplicar todos los datos |
| Conservación de pasos              | Necesaria, selectiva y gobernada                                              |
| Reportes configurables             | Necesarios para uso profesional                                               |
| Recuperación histórica             | Necesaria con límites explícitos                                              |
| Reportes sin IA                    | Necesarios para el producto inicial                                           |
| Recetas ejecutables                | Necesarias bajo autoridad vigente                                             |
| Reproducción humana                | Necesaria                                                                     |
| PDF/XLSX propios                   | Recomendados, sujetos a ratificación                                          |
| DOCX propio                        | Opcional                                                                      |
| Integración con desarrollo         | Recomendable mediante frontera externa                                        |
| Retención indiscriminada           | Rechazada                                                                     |

## **20.2. Recomendación de alcance inicial**

Recomiendo que QAP pueda utilizarse desde su primer lanzamiento como una herramienta profesional de QA que permita:

1. Diseñar y conservar pruebas reutilizables.
2. Ejecutarlas mediante modalidades autorizadas.
3. Registrar resultados, observaciones y evidencias.
4. Investigar y gestionar defectos.
5. Recuperar procedimientos de reproducción.
6. Transferir conocimiento a otros QA, desarrolladores y agentes.
7. Generar reportes profesionales sin depender de IA.
8. Consultar la historia conservada después de la poda.
9. Verificar correcciones y seleccionar regresiones.
10. Comunicar cobertura, incertidumbres y riesgos de entrega.

Esta recomendación no supone incorporar un sistema completo de gestión empresarial, un servicio central concurrente ni todos los motores especializados de QA.

## **20.3. Conclusión material**

La necesidad más importante descubierta durante esta investigación es la de preservar **conocimiento operativo reutilizable**, no simplemente almacenar resultados.

Una ejecución puede caducar. Un video puede eliminarse. Un agente puede desconectarse. Un desarrollador puede cambiar de equipo. Pero mientras exista una necesidad legítima y autorización de conservación, QAP debe poder mantener las relaciones, expectativas y procedimientos que permiten continuar el trabajo.

La receta de reproducción es una pieza central de esa continuidad. Los reportes parametrizados son el mecanismo que convierte esa información en decisiones profesionales.

Ambos deben construirse sobre el repositorio canónico, sin comprometer las garantías de seguridad, autoridad y veracidad ya aceptadas.

**Dictamen definitivo de QA-03: favorable a la ampliación focalizada propuesta, condicionado a consolidación multidisciplinaria, ratificación empresarial de las obligaciones nuevas y contravalidación de sus impactos.**

Se mantiene la resolución de aptitud arquitectónica para planificación de AV-01–08 dentro de su alcance original. No se recomienda congelar el alcance definitivo ni el WBS hasta resolver los deltas materiales de AC-01.

No se han modificado archivos, ramas, código, dependencias, configuración ni recursos de GitHub. No se han ejecutado experimentos ni accedido a sistemas empresariales. No se ha seleccionado tecnología definitiva ni ratificado ningún requisito nuevo.

**Fin del informe AC-01 / QA-03.**

**Estado:** entregado al Orquestador Principal para integración documental y evaluación de alcance.