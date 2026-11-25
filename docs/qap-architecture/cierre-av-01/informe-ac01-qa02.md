# **AC-01 · Informe de investigación independiente QA-02**

## **Operación humana, gestión de pruebas y trabajo sin IA**

**Destinatario:** Orquestador Principal de QAP\
**Especialidad:** QA-02 — QA Senior / Executor\
**Fecha:** 25 de noviembre de 2026\
**Repositorio:** `Hyouka73/QAMCP`\
**Rama:** `develop`\
**SHA verificado:** `b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5`\
**Naturaleza:** Investigación documental independiente y propuesta de ampliación de alcance.\
**Dictamen:** FAVORABLE A LA AMPLIACIÓN DEL PRODUCTO, CON CONDICIONES NORMATIVAS Y DE AUTORIDAD.

# **1. Resumen ejecutivo**

La arquitectura consolidada de QAP proporciona una base considerablemente sólida para construir una herramienta autónoma de aseguramiento de calidad. Sin embargo, existe una diferencia material entre construir una plataforma capaz de ejecutar pruebas autónomamente y construir una plataforma que permita a un profesional de QA realizar su trabajo cotidiano, incluso cuando no dispone de inteligencia artificial.

La especificación vigente resuelve gran parte de la primera necesidad, pero no garantiza suficientemente la segunda.

**QAP debe poder ser utilizado por un QA humano como su herramienta principal de trabajo, no únicamente como una herramienta invocada por agentes de IA.**

Esto implica que un profesional debe poder diseñar, organizar, ejecutar, documentar, compartir, recuperar y reutilizar pruebas sin depender de conversaciones con un modelo.

La distinción más importante de esta investigación es la siguiente:

| Capacidad                                                   | Situación normativa             |
| ----------------------------------------------------------- | ------------------------------- |
| Ejecutar automatizaciones sin IA                            | Ya contemplada                  |
| Conservar casos y revisiones                                | Ya contemplada                  |
| Proteger modificaciones humanas                             | Ya contemplada                  |
| Recuperar campañas e intentos                               | Ya contemplada                  |
| Gestionar defectos y retest                                 | Ya contemplada                  |
| Diseñar casos desde una interfaz humana completa            | Insuficientemente especificada  |
| Ejecutar pruebas manuales guiadas                           | Brecha nueva                    |
| Gestionar suites reutilizables y asignaciones               | Brecha nueva                    |
| Combinar pasos manuales y automatizados                     | Insuficientemente especificada  |
| Entregar trabajo entre profesionales                        | Brecha nueva                    |
| Realizar exploración humana estructurada                    | Insuficientemente especificada  |
| Utilizar IA externa sin MCP mediante intercambio controlado | Ampliación opcional             |
| Colaboración centralizada concurrente                       | Diferida por decisión existente |

No recomiendo sustituir la arquitectura aprobada ni reabrir indiscriminadamente AV-01–08. Recomiendo ampliar el modelo de operación sobre el mismo núcleo, preservando su autoridad, su repositorio canónico y sus garantías de seguridad y veracidad.

La ampliación requiere una decisión expresa del propietario porque modifica el alcance funcional del primer lanzamiento.

## **1.1. Conclusión principal**

QAP debería integrar tres formas de trabajo:

Modelo lógico propuesto. No representa una selección tecnológica ni prescribe procesos, bases de datos o interfaces físicas independientes.

Los conceptos HOST y DETERMINISTIC deben conservarse. Manual, semiautomática e híbrida son modalidades de ejecución; no nuevos proveedores de inteligencia.

# **2. Verificación de la base de investigación**

## **2.1. Identidad del repositorio**

Mediante el conector de GitHub se verificó que `develop` apunta exactamente al SHA solicitado.

El encargo AC-01 identifica como base normativa anterior:

`303e621dbca4a3a3b17cb2bf32530ab6311edc92`

La comparación entre ambas revisiones muestra un único commit adicional, con cambios exclusivamente en:

- `docs/qap-architecture/cierre-av-01/README.md`.
- `docs/qap-architecture/cierre-av-01/encargo-ac01-evaluacion-multidisciplinaria-qa.md`.

Por tanto, la diferencia de SHA no constituye una discrepancia del código o de la especificación normativa examinada.

Fuentes:

- [Commit de referencia](https://github.com/Hyouka73/QAMCP/commit/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5?utm_source=chatgpt.com).
- [Comparación de las dos revisiones](https://github.com/Hyouka73/QAMCP/compare/303e621dbca4a3a3b17cb2bf32530ab6311edc92...b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5?utm_source=chatgpt.com).
- [Encargo vinculante AC-01](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/encargo-ac01-evaluacion-multidisciplinaria-qa.md?utm_source=chatgpt.com).

## **2.2. Método y límites probatorios**

Se leyó íntegramente AC-01 y se consultó la documentación normativa consolidada, el manifiesto, el catálogo, las decisiones, el registro de auditorías, la matriz de aceptación y secciones contractuales relevantes de AV-02–08.

Se contrastaron archivos de código, esquemas, persistencia y pruebas existentes mediante lectura estática del SHA solicitado.

La revisión de los anexos extensos y del código fue focalizada en QA-02; no constituye una lectura íntegra certificada de cada contrato incorporado por el manifiesto ni una auditoría exhaustiva de todos los paquetes. Esta limitación impide declarar demostrada la ausencia absoluta de una capacidad en cada rincón del repositorio. Los hallazgos de ausencia se refieren principalmente a garantías normativas no identificadas en la documentación examinada.

Se utilizan las siguientes distinciones:

| Clasificación          | Significado                                                                  |
| ---------------------- | ---------------------------------------------------------------------------- |
| CUBIERTO               | Existe una obligación normativa suficiente                                   |
| PRECISAR CONTRATO      | Existe la capacidad, pero falta especificar su operación humana              |
| BRECHA NUEVA           | La necesidad requiere ampliar el alcance identificado                        |
| CONTRADICCIÓN MATERIAL | Una propuesta o comportamiento resulta incompatible con una garantía vigente |
| NO APLICA              | No corresponde al alcance principal de QA-02                                 |

Una capacidad cubierta normativamente no debe interpretarse como implementada o acreditada.

No se ejecutaron pruebas, experimentos, instalaciones ni comandos del producto.

# **3. Flujo profesional que QAP debe soportar**

Una plataforma profesional de gestión de pruebas no se limita a generar casos y ejecutarlos. Debe permitir administrar el trabajo antes, durante y después de cada ejecución.

ISTQB CTFL v4.0.1 distingue actividades de planificación, seguimiento, análisis, diseño, implementación, ejecución y finalización, junto con gestión de configuración y defectos. ISO/IEC/IEEE 29119-3:2021 contempla documentación de pruebas aplicable a diferentes organizaciones y actividades. Ninguna de estas referencias obliga por sí misma a replicar todas las funciones de una plataforma comercial.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.istqb.com\&sz=32)

ISTQB.com+1



## **3.1. Actores profesionales**

| Actor                    | Necesidad principal                                     |
| ------------------------ | ------------------------------------------------------- |
| QA Lead                  | Definir alcance, revisar progreso y decidir prioridades |
| QA Senior                | Diseñar pruebas, preparar sets y orientar a ejecutores  |
| QA Executor              | Ejecutar, documentar resultados y reportar incidencias  |
| QA Automation / SDET     | Automatizar casos y mantener adaptadores                |
| Developer                | Reproducir defectos y conocer los resultados de retest  |
| Analista de negocio      | Aportar expectativas y reglas acreditadas               |
| Responsable de seguridad | Autorizar operaciones, datos y custodia                 |
| Propietario del producto | Resolver riesgos y decisiones empresariales             |
| Agente HOST              | Proponer, interpretar, planificar e investigar          |
| Ejecutor determinista    | Realizar operaciones autorizadas y conservar evidencia  |

Estos actores representan responsabilidades. No implican necesariamente diez roles técnicos diferentes ni diez cuentas por instalación.

## **3.2. Ciclo operativo humano**

01

**Diseñar**

Requisitos, expectativas, casos, datos y precondiciones.

02

**Organizar**

Biblioteca, agrupaciones reutilizables, versiones y prioridad.

03

**Preparar campaña**

Alcance, asignaciones, dependencias y permisos.

04

**Ejecutar**

Pasos humanos, automáticos o combinados.

05

**Registrar**

Resultados observados, testigos, desviaciones y bloqueos.

06

**Investigar y verificar**

Defectos, reproducción, corrección, retest y regresión.

07

**Entregar y reutilizar**

Reportes, continuidad y aprendizaje versionado.

El ciclo debe poder completarse con cero modelos conectados cuando las expectativas, operaciones y verificaciones necesarias estén disponibles.

No significa que QAP deba inventar razonamiento, expectativas o automatizaciones nuevas sin información suficiente.

# **4. Contraste con herramientas profesionales existentes**

La investigación utilizó documentación oficial de herramientas de gestión de pruebas para verificar flujos reales de trabajo, no para seleccionar productos o tecnologías.

| Capacidad documentada            | TestRail    | Azure Test Plans       | Kiwi TCMS                           |
| -------------------------------- | ----------- | ---------------------- | ----------------------------------- |
| Biblioteca de casos              | Sí          | Sí                     | Sí                                  |
| Organización de suites y planes  | Sí          | Sí                     | Sí                                  |
| Selección de casos por ejecución | Sí          | Sí                     | Sí                                  |
| Asignación de pruebas            | Sí          | Sí                     | Sí                                  |
| Ejecución manual                 | Sí          | Sí                     | Sí                                  |
| Resultados individuales por paso | Documentado | Documentado            | No evaluado en detalle              |
| Reutilización de pasos           | No evaluado | Documentado            | No evaluado                         |
| Exploración estructurada         | No evaluado | Documentado            | No evaluado                         |
| Importación de casos             | CSV/XML     | No evaluado en detalle | Importación/exportación documentada |

Fuentes oficiales: documentación de TestRail sobre casos y planes, Azure Test Plans sobre objetos de prueba y Kiwi TCMS 17.2/17.3 sobre ejecuciones y casos.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://support.testrail.com\&sz=32)

TestRail Support Center+4



La documentación de Azure Test Plans resulta particularmente relevante porque distingue la expectativa del paso, el resultado marcado por el ejecutor y la descripción concreta del resultado observado. También contempla pausa y reanudación de pruebas manuales.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://learn.microsoft.com\&sz=32)

Microsoft Learn+2



TestRail documenta resultados por paso, historial y estados operacionales de retest. Sus mecanismos de importación también demuestran la necesidad profesional de mapear datos procedentes de hojas de cálculo hacia una biblioteca formal.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://support.testrail.com\&sz=32)

TestRail Support Center+1



### **4.1. Diferenciación necesaria de QAP**

QAP no debe copiar sin modificaciones los estados de estas herramientas.

Una plataforma tradicional puede registrar que un ejecutor marcó una prueba como aprobada. QAP dispone de una exigencia adicional: distinguir entre una declaración humana y un resultado funcional acreditado mediante expectativas, testigos, autoridad y alcance suficientes.

Esta diferencia constituye una garantía que debe conservarse, incluso si aumenta la complejidad del flujo manual.

# **5. Cobertura normativa existente: capacidades que no deben duplicarse**

La siguiente matriz identifica elementos que ya pertenecen al alcance aprobado.

| Área                                    | Requisitos vigentes          | Clasificación |
| --------------------------------------- | ---------------------------- | ------------- |
| Persistencia y continuidad              | D02, D05, MEM-002.3–002.4    | CUBIERTO      |
| Versionado de casos                     | MEM-001.3, CAS-001.3         | CUBIERTO      |
| Protección de ediciones manuales        | MEM-001.4                    | CUBIERTO      |
| Priorización por riesgo                 | PLN-001.3                    | CUBIERTO      |
| Planificación y dependencias            | PLN-001.1–001.6              | CUBIERTO      |
| Autonomía sin aprobación rutinaria      | D04, CAS-001.1               | CUBIERTO      |
| Ejecución determinista sin inferencia   | D03, IA-001.2                | CUBIERTO      |
| Reanudación y pausa de campañas         | CAM-001.3–001.4, AR-05/42    | CUBIERTO      |
| Importación/exportación de conocimiento | MEM-003.4                    | CUBIERTO      |
| Evidencias por intento, paso y rol      | REP-001.1                    | CUBIERTO      |
| Historial de ejecuciones                | REP-001.2                    | CUBIERTO      |
| Gestión de defectos                     | REP-001.3–001.4              | CUBIERTO      |
| Retest y regresión                      | REP-001.4, REG-001.1–001.3   | CUBIERTO      |
| Revisión ante drift                     | MEM-001.4, MEM-003.2         | CUBIERTO      |
| Handoff entre HOST                      | MEM-002.4, IA-001.4, AGT-002 | CUBIERTO      |
| Paridad entre consumidores              | INT-001.1, AR-52             | CUBIERTO      |
| Retención inteligente                   | D19, DE-01, POL-RET-001      | CUBIERTO      |
| Visor histórico protegido               | AR-24, AR-50, M1–M5          | CUBIERTO      |

Fuentes normativas:

[Catálogo de requisitos](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/catalogo-requisitos.md?utm_source=chatgpt.com) · [Especificación consolidada](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/especificacion-consolidada.md?utm_source=chatgpt.com) · [Matriz de aceptación AV-08](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/matriz-aceptacion-av08.md?utm_source=chatgpt.com).

No recomiendo crear requisitos adicionales para reemplazar estos contratos. Recomiendo extender sus condiciones de uso cuando intervenga un profesional humano.

## **5.1. Contraste estático con el código existente**

| Evidencia del repositorio                                                                                                                                                                                        | Observación                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [TCCase, líneas 9–65](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/shared/src/types/tc-case.type.ts?utm_source=chatgpt.com#L9-L65)                                   | Existe representación de casos, prioridades, dependencias, categorías y pasos ejecutables                                |
| [UpdateGuard, líneas 11–60](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/knowledge/src/plan/update-guard.ts?utm_source=chatgpt.com#L11-L60)                          | Existe protección mediante `manually_edited`, pero no acredita por sí misma un ciclo completo de autoría versionada      |
| [CaseWorkflow, líneas 40–87](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/mcp/src/handlers/case-workflow.ts?utm_source=chatgpt.com#L40-L87)                          | Determinadas rutas exigen recibos de aprobación de casos                                                                 |
| [CaseWorkflow, líneas 120–162](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/mcp/src/handlers/case-workflow.ts?utm_source=chatgpt.com#L120-L162)                      | Existe flujo de propuestas y revisión de casos vinculado a requisitos                                                    |
| [AppServiceStore, líneas 108–143](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/mcp/src/application/app-service-store.ts?utm_source=chatgpt.com#L108-L143)            | Existen campañas, tareas, progreso y cursores de recuperación                                                            |
| [AppServiceStore, líneas 303–374](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/mcp/src/application/app-service-store.ts?utm_source=chatgpt.com#L303-L374)            | Existen casos, intentos, resultados por pasos y estado legacy `human_accepted`                                           |
| [Visor, líneas 48–155](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/reporter/src/server/server.ts?utm_source=chatgpt.com#L48-L155)                                   | El visor legacy incluye CORS permisivo y eliminación de ejecuciones, incompatibles con el visor objetivo de solo lectura |
| [Prueba de casos y reportes](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/mcp/src/__tests__/block3-cases-execution-reports.test.ts?utm_source=chatgpt.com#L540-L570) | Existe una prueba escrita que contempla aceptación humana e inclusión de ese estado en reportes                          |

Los comportamientos legacy relacionados con aprobaciones obligatorias, autoridad del visor y taxonomía de resultados ya fueron considerados por la arquitectura consolidada.

**No son requisitos nuevos descubiertos por QA-02.** Son antecedentes que deben tenerse en cuenta para evitar que la ampliación humana los reactive o los perpetúe.

# **6. Evaluación independiente de las hipótesis del Orquestador**

| Hipótesis                              | Dictamen QA-02               | Condición                                                        |
| -------------------------------------- | ---------------------------- | ---------------------------------------------------------------- |
| QAP debe operar sin IA                 | Favorable                    | No limitarlo al replay de casos existentes                       |
| Interfaz local para humanos            | Favorable                    | Superficie operacional autenticada                               |
| CLI como alternativa                   | Favorable                    | Mismo núcleo y contratos                                         |
| Convertir el visor histórico en editor | Desfavorable                 | Contradice AR-24 si conserva su naturaleza y autoridad actuales  |
| Autoría humana versionada              | Favorable                    | Sin edición retrospectiva de revisiones congeladas               |
| Gestión de suites y sets               | Favorable                    | No duplicar PLN/CAS/CAM                                          |
| Roles operacionales                    | Favorable con condiciones    | Separarlos de identidad, permisos efectivos y roles AUT          |
| Intercambio de archivos entre QAs      | Favorable                    | Importación sin elevación de autoridad                           |
| Colaboración centralizada inicial      | Desfavorable                 | Mantener D02 y diferir infraestructura compartida                |
| IA gratuita sin MCP                    | Favorable como opcional      | Intercambio explícito, saneado y validado                        |
| Ejecución manual e híbrida             | Favorable                    | Testigos, trazabilidad y autoridad independientes de modalidad   |
| Marcar manualmente un PASS canónico    | Desfavorable                 | Una declaración no acredita conformidad                          |
| Cinco dominios lógicos de memoria      | Favorable como clasificación | No implica cinco almacenes físicos                               |
| Automatizar cualquier caso manual      | Desfavorable                 | La automatización depende de capacidades y oráculos verificables |

La propuesta del Orquestador es correcta en su orientación general. No obstante, varias hipótesis requieren contratos adicionales para que no produzcan contradicciones con las garantías previamente ratificadas.

# **7. Hallazgos materiales priorizados**

Se identifican 17 hallazgos materiales. Los identificadores son provisionales y no modifican el catálogo vigente.

| ID provisional | Hallazgo                                              | Clasificación                  | Prioridad propuesta |
| -------------- | ----------------------------------------------------- | ------------------------------ | ------------------- |
| AC01-QA02-01   | Operación humana integral sin IA                      | Brecha nueva                   | Esencial            |
| AC01-QA02-02   | Autoría humana y revisión protegida                   | Precisar contrato              | Esencial            |
| AC01-QA02-03   | Biblioteca y sets reutilizables                       | Brecha nueva                   | Esencial            |
| AC01-QA02-04   | Preparación y asignación de trabajo                   | Brecha nueva                   | Esencial            |
| AC01-QA02-05   | Ejecución manual guiada                               | Brecha nueva                   | Esencial            |
| AC01-QA02-06   | Declaración humana frente a veredicto acreditado      | Precisar contrato              | Esencial            |
| AC01-QA02-07   | Ejecución semiautomática e híbrida                    | Brecha nueva                   | Esencial            |
| AC01-QA02-08   | Exploración humana estructurada                       | Precisar contrato              | Esencial            |
| AC01-QA02-09   | Pausa, recuperación y desviaciones humanas            | Precisar contrato              | Esencial            |
| AC01-QA02-10   | Identidad, responsabilidades y permisos operacionales | Precisar contrato              | Esencial            |
| AC01-QA02-11   | Intercambio y handoff entre personas                  | Brecha nueva                   | Esencial            |
| AC01-QA02-12   | Importación de casos externos                         | Precisar contrato y ampliación | Esencial            |
| AC01-QA02-13   | Handoff humano-agente y conversión a automatización   | Precisar contrato              | Esencial            |
| AC01-QA02-14   | Operación con IA externa sin MCP                      | Brecha nueva                   | Opcional            |
| AC01-QA02-15   | Evidencia aportada manualmente                        | Precisar contrato              | Esencial            |
| AC01-QA02-16   | Gestión humana de defectos y retest                   | Precisar contrato              | Esencial            |
| AC01-QA02-17   | Superficie operacional y experiencia accesible        | Brecha nueva                   | Esencial            |

La prioridad esencial está condicionada a que el propietario ratifique la ampliación de QAP hacia operación profesional humana integral. No representa aprobación unilateral ni modifica las obligaciones actuales de lanzamiento.

# **8. Especificación propuesta por hallazgo**

## **AC01-QA02-01 — Operación humana integral sin IA**

Brecha de producto

**Problema profesional.** D03 permite ejecutar planes congelados sin inferencia. Esto no garantiza que un QA pueda empezar un proyecto nuevo, diseñar pruebas y completar su trabajo sin tener ningún modelo conectado.

Existe el riesgo de interpretar incorrectamente DETERMINISTIC como equivalente a operación humana completa.

**Escenario profesional.** Una empresa dispone de cinco profesionales QA, pero únicamente uno tiene acceso a herramientas de IA. Los demás necesitan diseñar y ejecutar sus pruebas utilizando QAP.

**Actores:** QA Senior, QA Executor, QA Lead.

**Evidencia.** D03 y D04 describen el carril HOST y la ejecución determinista. La especificación consolidada §2 está orientada a intención natural, planificación y ejecución autónoma. No se identificó una garantía equivalente para completar todo el ciclo mediante autoría y operación humanas.

**Requisitos afectados:** D01–D05, IA-001.1–001.6, PLN-001.1, CAM-001.1, INT-001.1.

**Propuesta funcional.**

QAP deberá permitir, sin conexión a ningún modelo:

- Crear y configurar proyectos.
- Registrar manualmente requisitos, reglas y conocimiento.
- Elaborar casos y resultados esperados.
- Organizar bibliotecas de pruebas.
- Preparar campañas.
- Ejecutar pruebas manuales o automatizaciones disponibles.
- Registrar resultados y evidencias.
- Gestionar defectos y retest.
- Consultar y exportar reportes.
- Recuperar trabajo pendiente.

La ausencia de IA podrá impedir tareas que requieran razonamiento nuevo, pero no deberá impedir las operaciones humanas o deterministas disponibles.

**Dependencias:** superficie operacional, autoría humana, repositorio canónico y contratos de autorización.

**Riesgo:** construir una segunda aplicación de gestión desconectada del núcleo autónomo.

**Alternativas:** interfaz local nativa; CLI estructurada; integración con un gestor externo. La integración externa resulta insuficiente como única solución si introduce una dependencia obligatoria para el trabajo sin IA.

**Aceptación futura:**

1. Instalar QAP sin configurar ningún HOST ni credencial de proveedor de IA.
2. Crear un proyecto vacío.
3. Diseñar casos, preparar una campaña, ejecutarla, registrar un defecto y realizar un retest.
4. Cerrar y recuperar QAP.
5. Consultar los resultados y exportarlos.
6. Acreditar cero solicitudes a servicios de inferencia durante todo el flujo.

**Prueba negativa:** desconectar el acceso a servicios de IA no debe bloquear las operaciones humanas ni crear resultados ficticios para las tareas pendientes de razonamiento.

**Prioridad:** esencial.

**Costo relativo:** alto, porque atraviesa toda la experiencia de producto.

**Decisión requerida:** ampliación expresa del alcance de lanzamiento, preservando D03.

## **AC01-QA02-02 — Autoría humana, edición protegida y revisión opcional**

**Problema profesional.** Proteger un archivo editado manualmente no equivale a proporcionar un sistema completo de diseño, edición, revisión y evolución de casos.

Un profesional necesita modificar un caso sin romper ejecuciones anteriores ni depender de la regeneración automática del agente.

**Escenario profesional.** Un QA Senior corrige la expectativa de una prueba porque el requisito empresarial cambió. Existen campañas anteriores que deben conservar el resultado bajo la expectativa anterior.

**Actores:** autor, revisor, ejecutor, agente HOST.

**Evidencia QAP:**

- MEM-001.3 y MEM-001.4 ya exigen revisiones y protección.
- CAS-001.3 distingue identidad funcional de revisión.
- `UpdateGuard` implementa una protección legacy mediante bandera.
- `CaseWorkflow` contempla propuestas y aprobación, pero no acredita un editor humano profesional completo.

**Propuesta funcional.**

Cada caso deberá admitir creación y edición humana mediante una operación gobernada que conserve:

| Campo lógico         | Propósito                               |
| -------------------- | --------------------------------------- |
| Identidad estable    | Referenciar el caso a través del tiempo |
| Revisión             | Distinguir cambios                      |
| Objetivo             | Identificar qué se verifica             |
| Fuente               | Relacionar expectativa y autoridad      |
| Precondiciones       | Preparar la ejecución                   |
| Pasos                | Describir las acciones                  |
| Expectativas         | Definir comportamientos verificables    |
| Datos y parámetros   | Permitir reutilización controlada       |
| Postcondiciones      | Identificar obligaciones posteriores    |
| Autoría              | Identificar quién propuso el contenido  |
| Motivo del cambio    | Explicar la evolución                   |
| Modalidad disponible | Manual, automatizada o combinada        |

La revisión humana debe ser opcional por política para casos ordinarios elegibles. Debe seguir siendo exigible cuando una fuente, autorización o decisión realmente lo requiera.

No se recomienda una máquina de estados que obligue a todos los casos a pasar por aprobación humana.

**Dependencias:** MEM-001.3–001.4, CAS-001.1–001.5, AR-46.

**Riesgos:** sobrescritura de expectativas; aprobaciones rutinarias incompatibles con autonomía; pérdida de linaje.

**Alternativas:** formularios estructurados; edición de documentos tipados con validación; importación de plantillas. Todas deben delegar la mutación al mismo núcleo.

**Aceptación futura:** ejecutar la revisión 1; crear revisión 2; consultar ambas; comprobar que la ejecución histórica sigue vinculada a revisión 1. Una propuesta del HOST basada en revisión obsoleta debe rechazarse sin sobrescribir la edición humana.

**Prueba negativa:** un archivo marcado como protegido que no pueda interpretarse de forma segura no debe considerarse automáticamente disponible para sobrescritura.

**Prioridad:** esencial.

**Costo relativo:** medio.

**Decisión requerida:** precisión contractual. La existencia de una interfaz humana nativa sí depende de la ampliación de alcance.

## **AC01-QA02-03 — Biblioteca, suites y sets reutilizables**

Brecha de producto

**Problema profesional.** Un caso individual y un plan congelado no resuelven completamente la organización permanente de una biblioteca de pruebas.

Los profesionales reutilizan grupos de pruebas para regresiones, entregas, módulos, incidentes y verificaciones específicas.

**Escenario profesional.** El equipo mantiene 300 casos. Para cada liberación necesita seleccionar un conjunto de 40 pruebas críticas sin copiar los casos ni reconstruir un plan desde cero.

**Actores:** QA Lead, QA Senior, QA Executor.

**Evidencia externa.** TestRail, Azure Test Plans y Kiwi TCMS documentan agrupación y selección de casos para ejecuciones asociadas a configuraciones o versiones.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://support.testrail.com\&sz=32)

TestRail Support Center+2



**Evidencia QAP.** PLN-001.1 ya contempla CampaignPlan, ExecutionPlan, DataPlan y TestCase. CAS y MEM resuelven identidad y revisiones. No se identificó una obligación suficiente de agrupaciones reutilizables independientes de una ejecución concreta.

**Propuesta funcional.**

Incorporar agrupaciones versionadas de referencias a casos, sin copiar su contenido.

Modelo lógico mínimo:

| Concepto      | Responsabilidad                             |
| ------------- | ------------------------------------------- |
| TestCase      | Unidad funcional de prueba                  |
| Biblioteca    | Vista organizada del conjunto de casos      |
| TestSet       | Selección reutilizable de casos             |
| CampaignPlan  | Objetivo y alcance de campaña               |
| ExecutionPlan | Selección concreta congelada para ejecución |
| Attempt       | Hechos de una ejecución                     |

Suite y set no necesitan representar entidades diferentes. Una suite puede ser una presentación organizativa o agrupación jerárquica de TestSet.

Se propone una sola capacidad lógica de agrupación reutilizable hasta que QA-01 determine si existe una necesidad semántica distinta.

Los sets deberán admitir pertenencia múltiple, orden sugerido, etiquetas, filtros, referencias a revisión y selección explícita.

La resolución de una referencia dinámica deberá congelarse al construir el plan de ejecución.

**Dependencias:** PLN-001.1–001.5, CAS-001.3–001.5, MEM-003.2.

**Riesgos:** duplicación de casos y evidencias, denominadores incorrectos, cambios silenciosos en campañas históricas.

**Alternativas:** etiquetas y consultas guardadas; conjuntos estáticos versionados; gestor externo. Recomiendo combinar agrupaciones explícitas y consultas deterministas sin crear conceptos redundantes.

**Aceptación futura:** registrar diez casos; construir dos sets que compartan cuatro casos; modificar posteriormente uno de ellos; verificar que un plan anterior conserva las revisiones originales y que la pertenencia múltiple no duplica obligaciones idénticas en el mismo contexto.

**Prueba negativa:** eliminar una agrupación no debe eliminar los casos ni sus ejecuciones.

**Prioridad:** esencial.

**Costo relativo:** medio.

**Decisión requerida:** nuevo requisito de producto, coordinado con QA-01.

## **AC01-QA02-04 — Selección, asignación y seguimiento de trabajo**

**Problema profesional.** Una prioridad de ejecución automática no resuelve la distribución del trabajo humano.

El QA Lead necesita saber qué pruebas corresponden a cada ejecutor, cuáles están pendientes, cuáles fueron bloqueadas y cuáles necesitan transferencia.

**Escenario profesional.** Un Senior prepara una campaña de 60 casos y entrega 20 a cada uno de tres ejecutores que utilizan instalaciones locales.

**Actores:** QA Lead, QA Senior, QA Executor.

**Evidencia QAP.** El esquema `tasks` conserva título, estado y progreso, pero la sección examinada no incorpora una relación explícita de responsabilidad humana o asignación transferible.

**Evidencia externa.** TestRail documenta asignaciones de ejecución y vistas de trabajo pendiente. Azure Test Plans relaciona casos, configuración y ejecutores para concretar unidades de prueba.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://support.testrail.com\&sz=32)

TestRail Support Center+1



**Propuesta funcional.**

Una asignación deberá identificar:

- Campaña y revisión.
- Casos u obligaciones asignados.
- Responsable previsto.
- Prioridad y motivo.
- Dependencias.
- Estado de entrega.
- Estado operativo de ejecución.
- Responsable real que realizó el trabajo.
- Historial de reasignación.

La asignación es una responsabilidad administrativa, no un permiso para producir efectos sobre el AUT.

Se deben permitir asignaciones individuales y agrupadas, selección por filtros y reordenación del trabajo pendiente sin eliminar obligaciones ya congeladas.

No se propone exigir gestión de recursos humanos, estimaciones de productividad individual ni planificación de capacidad empresarial en v1.

**Dependencias:** PLN-001.3–001.6, CAM-001.2–001.4, identidad operacional y handoff.

**Riesgos:** duplicación de operaciones, asignación a identidades externas no verificadas y manipulación de indicadores.

**Alternativas:** etiquetas de responsable; unidad lógica de asignación; integración con gestor central posterior.

**Aceptación futura:** asignar casos, transferir uno de ellos, conservar responsable anterior y nuevo, identificar pendientes y resultados. Una persona asignada sin permiso efectivo no podrá ejecutar una operación gobernada.

**Prioridad:** esencial.

**Costo relativo:** medio.

**Decisión requerida:** ampliar alcance; no requiere servicio multiusuario centralizado.

## **AC01-QA02-05 — Ejecución manual guiada**

Brecha de producto

**Problema profesional.** QAP puede tener un runner automatizado avanzado y aun así no permitir que una persona ejecute un caso siguiendo instrucciones y registrando lo que realmente ocurrió.

**Escenario profesional.** Un QA prueba una funcionalidad cuya interacción visual todavía no puede automatizarse de manera confiable.

**Actores:** QA Executor, QA Senior.

**Evidencia externa.** Azure Test Plans proporciona ejecución manual por pasos, registro de resultados y recuperación de sesiones pausadas. Su funcionalidad de resultado observado por paso está documentada como disponible de forma general en las notas de Sprint 276 de 2026.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://learn.microsoft.com\&sz=32)

Microsoft Learn+1



**Propuesta funcional.**

Incorporar un flujo manual que presente:

- Objetivo y revisión del caso.
- Entorno y alcance.
- Precondiciones.
- Instrucción de cada paso.
- Resultado esperado.
- Resultado observado.
- Declaración del ejecutor.
- Evidencia y referencias.
- Desviaciones.
- Dependencias y efectos pendientes.
- Obligaciones de cleanup.

El ejecutor deberá poder completar, pausar o bloquear un paso sin modificar la expectativa congelada.

La interfaz deberá distinguir instrucciones de ejecución, hechos observados y conclusiones.

Ejemplo:

**TC-014 · Validación de importe**

Revisión 3 · Ejecución manual

Ejemplo conceptual

**Paso 2 de 4**

Introducir un importe fuera del límite establecido por la regla de negocio acreditada.

Resultado esperado

La solicitud debe rechazarse y no debe existir un registro persistido.

Resultado observado por el QA

Se mostró un mensaje de rechazo. Todavía no se ha comprobado la ausencia del registro.

Captura adjunta del mensaje

Declaración humana

**Comportamiento visual observado**

Efecto persistente

Sin acreditar

Veredicto al cierre sin otro testigo

**INDETERMINATE**

**Requisitos afectados:** CAS-001.3–001.4, RUN, ORA-001.1–001.7, REP-001.1, D06, D12.

**Dependencias:** contratos de resultado humano, custodia, oráculos y superficie operacional.

**Riesgos:** convertir la interfaz en una lista de casillas que genere PASS sin acreditación; confundir instrucciones con hechos.

**Alternativas:** runner manual local; formularios CLI; integración externa de resultados. La última no resuelve completamente una operación humana autónoma del producto.

**Aceptación futura:** diseñar un caso de cuatro pasos, ejecutar manualmente los primeros dos, documentar un resultado inesperado, pausar, reanudar y cerrar con evidencia vinculada a los pasos correspondientes.

**Prueba negativa:** marcar todos los pasos como correctos sin testigos suficientes no deberá producir aceptación funcional canónica.

**Prioridad:** esencial.

**Costo relativo:** alto.

**Decisión requerida:** nuevo requisito de lanzamiento.

## **AC01-QA02-06 — Separación entre declaración humana y veredicto acreditado**

**Problema profesional.** Las herramientas tradicionales suelen aceptar resultados declarados por un ejecutor. Si QAP adoptara esa práctica sin restricciones, invalidaría las garantías de AV-04 y DE-03.

El código existente contiene valores legacy como `human_accepted`. No deben convertirse en un mecanismo alternativo de acreditación.

**Escenario profesional.** Un ejecutor afirma que un contrato se creó correctamente, pero solo observó un mensaje de éxito. La operación realmente no produjo persistencia.

**Actores:** QA Executor, QA Lead, auditor, ejecutor determinista.

**Evidencia normativa:** [AV-04, §§1–3](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/enmiendas-av04.md?utm_source=chatgpt.com).

**Propuesta funcional.**

Conservar tres niveles separados de información:

| Nivel               | Significado                                                          |
| ------------------- | -------------------------------------------------------------------- |
| Declaración humana  | Lo que el ejecutor manifiesta                                        |
| Observación/testigo | Evidencia adquirida, con procedencia y alcance                       |
| Veredicto canónico  | Resultado calculado por el núcleo conforme a obligaciones y testigos |

No se incorpora un séptimo veredicto.

Los seis veredictos se conservan exactamente:

`PASS`, `FAIL`, `INDETERMINATE`, `BLOCKED`, `SKIPPED`, `ERROR`.

También se conservan los cuatro ejes independientes de AV-04:

`technical_status`, `functional_verdict`, `cleanup_status`, `evidence_health`.

La aprobación empresarial de un riesgo puede registrarse como decisión administrativa independiente, pero no cambia un FAIL acreditado a PASS.

Una observación humana podrá contribuir a acreditar una afirmación cuando el contrato de testigo correspondiente lo permita y satisfaga sus requisitos. Esto resulta importante para pruebas visuales, experiencia de usuario o accesibilidad manual.

No recomiendo prohibir toda evidencia humana. Recomiendo prohibir la acreditación automática derivada exclusivamente de marcar una opción.

### **Casuística normativa propuesta**

| Situación                                                | Tratamiento                                                 |
| -------------------------------------------------------- | ----------------------------------------------------------- |
| QA declara éxito sin testigo suficiente                  | INDETERMINATE al cerrar, salvo otro impedimento aplicable   |
| Observación humana suficiente para el tipo de afirmación | Evaluación conforme al contrato de oráculo                  |
| Testigo independiente demuestra una contradicción        | FAIL                                                        |
| Permiso requerido inexistente                            | BLOCKED                                                     |
| Caso abierto todavía no evaluado                         | Sin veredicto terminal                                      |
| Caso obligatorio omitido                                 | SKIPPED con motivo y efectos de agregación correspondientes |
| Evidencia alterada                                       | Tratamiento de integridad AV-04                             |
| Cleanup pendiente                                        | No acreditar aceptación de campaña                          |
| Riesgo empresarial aceptado                              | Decisión registrada sin reescribir veredicto                |

**Dependencias:** AR-08/09/46/52, ORA, REP-001.1, DE-03.

**Riesgo:** falsos PASS manuales, encubrimiento de defectos mediante aceptación administrativa.

**Alternativas:** registrar declaraciones como notas diagnósticas; definir perfiles de testigos humanos admisibles; exigir verificación complementaria en afirmaciones críticas.

**Aceptación futura:** importar una declaración de éxito con un testigo insuficiente y verificar ausencia de PASS. Incorporar posteriormente un testigo válido mediante el flujo autorizado de evaluación y conservar íntegramente la declaración original y la trazabilidad.

**Prueba negativa:** modificar manualmente un reporte o solicitar por CLI que un resultado sea aprobado no debe alterar el resultado canónico.

**Prioridad:** esencial y no negociable dentro de la ampliación humana.

**Costo relativo:** medio-alto.

**Decisión requerida:** precisión de AV-04, sin reducción de garantías.

## **AC01-QA02-07 — Ejecución semiautomática e híbrida**

**Problema profesional.** Muchas pruebas contienen pasos que pueden automatizarse y otros que necesitan intervención humana. Exigir que toda la prueba sea manual o totalmente automatizada introduce una limitación artificial.

**Escenario profesional.** QAP prepara datos mediante una API autorizada. Un QA verifica manualmente una representación visual. El núcleo consulta después los efectos persistentes mediante un testigo independiente.

**Actores:** QA Executor, SDET, ejecutor determinista, HOST opcional.

**Propuesta funcional.**

Permitir un DAG de ejecución compuesto por obligaciones y pasos ejecutados por diferentes actores.

Un flujo híbrido puede ejecutarse íntegramente sin IA.

Cada transferencia deberá conservar identidad del paso, revisión, contexto efectivo, entradas, salidas, efectos, autoridad y testigos.

No se deberá mantener un recurso bloqueado indefinidamente mientras se espera intervención humana. Cuando la sesión sea indispensable para un wizard o flujo E2E, su conservación deberá justificarse y respetar presupuesto, aislamiento y vigencia.

**Requisitos afectados:** D03, D06, PLN-001.4–001.6, CAM-001.2–001.4, AR-10/42/43.

**Dependencias:** manual runner, supervisor, DataPlan, operaciones externas y testigos.

**Riesgos:** continuación automática bajo identidad distinta, duplicación de operaciones humanas y automatizadas, pérdida de variables.

**Alternativas:** campañas manuales y automáticas separadas; composición de pasos por modalidad. Recomiendo la segunda porque conserva mejor dependencias y trazabilidad E2E.

**Aceptación futura:** ejecutar tres pasos automatizados, uno humano y dos automatizados posteriores; suspender el flujo mientras espera al QA; reanudar sin repetir la preparación ni alterar la identidad efectiva.

**Prueba negativa:** si el paso manual obligatorio no se ha realizado o acreditado, los dependientes que lo requieren deben permanecer pendientes o bloqueados.

**Prioridad:** esencial.

**Costo relativo:** alto.

**Decisión requerida:** ampliación funcional y precisión de contratos E2E.

## **AC01-QA02-08 — Pruebas exploratorias humanas estructuradas**

**Problema profesional.** Discovery no es equivalente a exploratory testing.

Discovery describe el sistema y sus superficies. La exploración profesional busca aprender, formular hipótesis y encontrar problemas mediante acciones orientadas por un objetivo de prueba.

**Escenario profesional.** Un QA dispone de 45 minutos para investigar comportamientos inesperados de un formulario nuevo sin disponer todavía de casos exhaustivos.

**Actores:** QA Senior, QA Executor.

**Evidencia externa.** ISTQB incluye pruebas exploratorias entre las técnicas basadas en experiencia. Azure Test & Feedback documenta sesiones exploratorias independientes y mecanismos de intercambio de hallazgos.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.istqb.com\&sz=32)

ISTQB.com+1



**Evidencia QAP.** CAM-001.5 contempla modos de exploración, regresión e investigación. No se identifica una representación suficientemente explícita de sesiones exploratorias humanas.

**Propuesta funcional.**

Una sesión exploratoria deberá conservar:

| Elemento                 | Finalidad                                          |
| ------------------------ | -------------------------------------------------- |
| Charter u objetivo       | Delimitar qué investigar                           |
| Alcance autorizado       | Establecer superficies y operaciones               |
| Presupuesto              | Limitar tiempo y recursos                          |
| Responsable              | Identificar al explorador                          |
| Hipótesis                | Registrar qué se pretende comprobar                |
| Acciones y observaciones | Conservar hechos                                   |
| Hallazgos                | Documentar anomalías o comportamientos             |
| Preguntas pendientes     | Identificar incertidumbre                          |
| Casos derivados          | Convertir descubrimientos en pruebas reutilizables |

La sesión deberá poder finalizar sin resultados concluyentes.

No debe inventarse un caso aprobado para cada observación exploratoria.

**Requisitos afectados:** CAM-001.5, MEM-001.1–001.3, DIS, REP-001.3, CAS-001.2.

**Dependencias:** conocimiento, autoría, evidencia y autoridad operacional.

**Riesgos:** promover observaciones a reglas; capturar información sensible; otorgar permisos excesivos en nombre de la exploración.

**Alternativas:** plantilla estructurada dentro de una campaña; entidad de sesión separada; integración externa. Recomiendo una sesión lógica vinculada a CAM sin crear otro orquestador.

**Aceptación futura:** crear una sesión, documentar tres observaciones, derivar un caso nuevo y generar un hallazgo con evidencia. El conocimiento deberá distinguir observación, hipótesis y regla acreditada.

**Prueba negativa:** una anomalía sin expectativa acreditada no deberá contabilizarse automáticamente como defecto probado.

**Prioridad:** esencial, con funcionalidad inicial acotada.

**Costo relativo:** medio.

**Decisión requerida:** precisión de CAM-001.5 y ampliación para ejecución humana.

## **AC01-QA02-09 — Pausas, recuperación, bloqueos y desviaciones**

**Problema profesional.** La pausa de un ejecutor automatizado y la interrupción de una tarea humana tienen semánticas distintas.

Un humano puede haber realizado una operación externa sin que QAP haya observado su resultado antes de cerrar la aplicación.

**Escenario profesional.** Un QA crea una solicitud manualmente. Se interrumpe la aplicación antes de que pueda registrar el resultado. Al día siguiente reanuda el caso.

**Actores:** ejecutor original, ejecutor sustituto, responsable de reconciliación.

**Evidencia QAP.** AV-03 AR-05 y AR-42 ya establecen pausas durables, reconciliación y recuperación. AV-04 prohíbe inferir que no existieron efectos a partir del estado local.

**Propuesta funcional.**

Extender los contratos de recuperación para conservar:

- Paso previsto y paso realmente realizado.
- Última observación persistida.
- Posibilidad de efecto no registrado.
- Causa de la interrupción.
- Desviación respecto del procedimiento.
- Estado de reconciliación.
- Siguiente acción segura.

La interfaz deberá diferenciar la suspensión de una tarea, su reasignación, su cancelación y la cancelación remota de una operación.

Un humano podrá declarar que siguió un procedimiento distinto, pero esa declaración no modificará el procedimiento congelado retrospectivamente.

**Requisitos afectados:** MEM-002.3, CAM-001.3–001.4, RUN, AR-05/10/42/43.

**Dependencias:** libro de efectos, asignaciones, identidad y reconciliación.

**Riesgos:** duplicar efectos, perder observaciones, interpretar pausa como cancelación.

**Alternativas:** reiniciar siempre el caso; reanudar desde el último checkpoint; reconciliar y continuar. La primera es inaceptable cuando existen efectos potenciales.

**Aceptación futura:** simular en un fixture autorizado una interrupción después de una acción humana con posible efecto. La reanudación deberá solicitar o realizar reconciliación suficiente antes de admitir un nuevo efecto equivalente.

**Prueba negativa:** el cursor local no podrá utilizarse como prueba de que una operación externa no ocurrió.

**Prioridad:** esencial.

**Costo relativo:** medio.

**Decisión requerida:** precisión de contratos existentes.

## **AC01-QA02-10 — Identidad humana, roles y autoridad operacional**

Riesgo de autoridad

**Problema profesional.** QAP necesita distinguir quién opera la herramienta, quién realiza una acción y con qué permisos se accede al AUT.

Confundir estas dimensiones produciría vulnerabilidades en la gestión de pruebas.

**Escenario profesional.** Un QA Senior asigna a un Junior una prueba que requiere un rol administrativo del AUT. El Junior tiene permiso para editar casos de QAP, pero no para ejecutar la operación administrativa.

**Actores:** Senior, Executor, administrador operacional, responsable de autoridad.

**Propuesta funcional.**

Separar explícitamente:

| Dimensión                      | Pregunta                                                |
| ------------------------------ | ------------------------------------------------------- |
| Identidad QAP                  | ¿Quién está operando QAP?                               |
| Responsabilidad operacional    | ¿Qué trabajo le corresponde?                            |
| Permiso QAP                    | ¿Qué operaciones puede realizar en QAP?                 |
| Identidad efectiva AUT         | ¿Con qué identidad se ejecuta en la aplicación probada? |
| Rol AUT                        | ¿Qué función posee dentro de esa aplicación?            |
| Autoridad por efecto           | ¿Está autorizada la operación concreta?                 |
| Autoría del dato               | ¿Quién originó una observación o propuesta?             |
| Confianza en identidad externa | ¿Qué se puede verificar del actor importado?            |

Capacidades operacionales candidatas: diseñar, revisar, asignar, ejecutar, consultar, aportar evidencia, exportar y administrar políticas.

No recomiendo implementar necesariamente una jerarquía fija de roles Senior/Junior. Es preferible modelar capacidades efectivas y ofrecer perfiles de conveniencia cuando se justifiquen.

En una instalación local de un único usuario no debe fingirse separación de identidades humanas que el sistema no puede demostrar.

**Requisitos afectados:** D02, D07, D09, D20, SEG, MEM-002.1–002.2, AR-04/14/28/32.

**Dependencias:** autenticación operacional, registro de eventos y frontera de confianza.

**Riesgos:** suplantación, elevación de permisos mediante importación, aprobación propia presentada como revisión independiente.

**Alternativas:** identidad local verificada y capacidades; perfiles operacionales múltiples cuando exista autenticación efectiva; proveedor central posterior.

**Aceptación futura:** asignar un caso a un operador con acceso insuficiente al AUT y verificar denegación. Importar un archivo que declare pertenecer a un administrador no deberá conceder ningún permiso.

**Prueba negativa:** cambiar el nombre visible del usuario o una etiqueta de rol no debe alterar la autoridad efectiva.

**Prioridad:** esencial.

**Costo relativo:** medio-alto.

**Decisión requerida:** precisión de seguridad y definición del mínimo de identidad local. No autoriza un IAM empresarial completo.

## **AC01-QA02-11 — Handoff y colaboración entre personas sin servidor central**

**Problema profesional.** La continuidad entre agentes HOST no equivale a entregar pruebas entre instalaciones utilizadas por diferentes personas.

**Escenario profesional.** Un QA Senior diseña una campaña en su equipo y envía un set a otro QA. El segundo lo ejecuta, documenta los resultados y devuelve un paquete.

**Actores:** autor, receptor, ejecutor, responsable de consolidación.

**Propuesta funcional.**

Permitir paquetes portables explícitos para transferencia de trabajo:

**QA Senior**

Instalación A

**Paquete**

Export autorizado

**Executor**

Instalación B

**Consolidación de resultados**

Conciliación, procedencia, conflictos y validación de testigos

Un paquete de trabajo podrá contener referencias de casos y revisiones, set, objetivos, dependencias, datos sintéticos permitidos, asignaciones y política de evidencias.

No deberá incluir secretos, sesiones reutilizables o grants transferibles.

El receptor deberá resolver localmente las autorizaciones.

Un paquete de devolución podrá incluir hechos y evidencias permitidas. Su procedencia deberá diferenciarse de los intentos generados por el ejecutor local.

### **Reconciliación obligatoria**

| Situación                        | Comportamiento                    |
| -------------------------------- | --------------------------------- |
| Mismo ID y mismo contenido       | Reconocimiento idempotente        |
| Mismo ID con contenido diferente | Conflicto explícito               |
| Revisión anterior                | Conservar como histórica          |
| Revisión futura desconocida      | Validar linaje antes de integrar  |
| Identidad externa no verificable | Registrar como declarada          |
| Evidencia insuficiente           | No elevar acreditación            |
| Destino no autorizado            | Impedir operación correspondiente |

Una firma o digest puede demostrar integridad o autenticidad dentro de un modelo de confianza, pero no demuestra por sí mismo que el resultado funcional sea verdadero.

**Requisitos afectados:** MEM-003.4, MEM-002.5, IA-001.5, REP-001.1, AR-28/46/52, D02/D20.

**Dependencias:** formatos portables, custodia, identidad, importación y conflictos.

**Riesgos:** sincronización accidentalmente distribuida, efectos duplicados y aceptación de resultados manipulados.

**Alternativas:** paquetes manuales; repositorio externo de intercambio; colaboración centralizada futura.

**Aceptación futura:** transferir diez casos entre instalaciones A y B; ejecutar cinco; devolver resultados; importar dos veces el mismo paquete; verificar que no se crean intentos duplicados ni se reemplazan revisiones modificadas localmente.

**Prueba negativa:** dos instalaciones que contienen la misma asignación no disponen automáticamente de exclusión mutua global sobre el AUT. La política debe reconocer esa limitación y exigir aislamiento de datos o coordinación acreditada cuando exista riesgo de efectos conflictivos.

**Prioridad:** esencial, mediante intercambio local acotado.

**Costo relativo:** alto.

**Decisión requerida:** ampliar MEM-003.4 y definir alcance empresarial de colaboración local. No modifica la decisión de diferir colaboración centralizada.

## **AC01-QA02-12 — Importación de casos y bibliotecas existentes**

**Problema profesional.** Las organizaciones suelen disponer de pruebas documentadas previamente en hojas de cálculo, documentos o gestores especializados. Obligar a introducir todos los casos manualmente perjudicaría la adopción.

**Escenario profesional.** Un Senior mantiene 500 casos en una hoja de cálculo y desea incorporarlos a QAP.

**Evidencia QAP.** D10 contempla ingesta documental y MEM-003.4 paquetes portables. Sin embargo, leer un documento y reconstruir una biblioteca de casos estructurados son operaciones distintas.

**Evidencia externa.** TestRail documenta importación con mapeo de campos, valores y secciones mediante archivos CSV o Excel.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://support.testrail.com\&sz=32)

TestRail Support Center



**Propuesta funcional.**

Importación inicial mediante:

| Formato                       | Alcance recomendado                                              |
| ----------------------------- | ---------------------------------------------------------------- |
| Formato canónico QAP          | Obligatorio                                                      |
| CSV estructurado              | Obligatorio                                                      |
| XLSX                          | Valioso, condicionado a contrato de mapeo y seguridad            |
| JSON de herramientas externas | Integración opcional                                             |
| XML específico de proveedores | Integración opcional                                             |
| Documentos narrativos libres  | Ingesta asistida, sin garantía de extracción automática completa |

El importador deberá proporcionar vista previa, mapeo de campos, validación, detección de colisiones y recibo de resultados.

Los casos importados deben distinguir información completa, campos ausentes, expectativas no acreditadas y contenido rechazado.

La importación no ejecutará macros, fórmulas como código, comandos, enlaces externos ni instrucciones incluidas en celdas.

**Dependencias:** MEM-003.4, D10, AR-22/46/50, contratos de parsers.

**Riesgos:** pérdida silenciosa de datos, duplicados y ejecución de contenido hostil.

OWASP recomienda validar contenido, autorización y almacenamiento de archivos aportados por usuarios. Estas prácticas son relevantes también para una aplicación local cuando los archivos constituyen entradas no confiables.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://cheatsheetseries.owasp.org\&sz=32)

OWASP Cheat Sheet Series



**Alternativas:** formato QAP exclusivo; CSV con mapeo; adaptadores especializados. Recomiendo QAP y CSV como mínimo inicial para evitar dependencia de proveedores.

**Aceptación futura:** importar un archivo con casos válidos, duplicados, referencias ausentes y caracteres internacionales. El usuario debe recibir conteos reconciliables, detalle de rechazos y ninguna modificación parcial ambigua.

**Prueba negativa:** importar una fila con estado `PASS`, instrucciones maliciosas o permisos declarados no debe crear un intento acreditado ni conceder autoridad.

**Prioridad:** esencial para formato QAP y CSV; opcional para adaptadores adicionales.

**Costo relativo:** medio.

**Decisión requerida:** ampliar el contrato de importación sin confundirlo con D10.

## **AC01-QA02-13 — Handoff humano-agente y evolución de casos hacia automatización**

**Problema profesional.** Los casos manuales no deben constituir una biblioteca paralela a los casos automatizados.

Una vez que el equipo invierta tiempo en diseñar una prueba, la automatización futura debe reutilizar su intención y referencias.

**Escenario profesional.** Un QA diseña manualmente una prueba de aprobación de solicitudes. Un SDET o un HOST automatiza después los pasos técnicamente verificables.

**Actores:** autor humano, HOST, SDET, ejecutor determinista.

**Propuesta funcional.**

Una conversión deberá conservar identidad funcional, fuente, expectativa, cobertura, precondiciones e historial.

No deberá garantizarse conversión automática de cualquier texto en un procedimiento ejecutable.

La nueva revisión deberá identificar:

- Pasos automatizados.
- Pasos humanos que permanecen.
- Operaciones no soportadas.
- Adaptadores y testigos requeridos.
- Evidencia de equivalencia funcional.
- Diferencias respecto del caso de origen.

El HOST podrá recibir el ContextSnapshot correspondiente y proponer una revisión. Su propuesta pasará por el mismo núcleo que las propuestas humanas.

**Requisitos afectados:** CAS-001.3, MEM-001.3–001.4, MEM-002.4, REG-001.3, IA-001.1, AR-11/46.

**Dependencias:** QA-04, identidad de casos, operaciones y oráculos.

**Riesgos:** automatizar una intención distinta; eliminar pasos manuales necesarios; considerar un resultado histórico humano como prueba de que la automatización funciona.

**Alternativas:** crear un caso nuevo por cada automatización; incorporar variantes y revisiones vinculadas. Recomiendo conservar identidad cuando la intención y obligaciones siguen siendo equivalentes. Un cambio funcional material puede requerir otra identidad.

**Aceptación futura:** convertir un caso manual con tres afirmaciones en una representación automatizada que conserva las tres; ejecutar ambas modalidades; comparar cobertura por afirmación y conservar historiales separados.

**Prueba negativa:** si la automatización solo verifica visibilidad, no podrá declararse equivalente a un caso manual que exige persistencia y reglas empresariales.

**Prioridad:** esencial como contrato de evolución. La automatización universal de casos queda fuera de alcance.

**Costo relativo:** medio-alto.

**Decisión requerida:** precisión coordinada con QA-04.

## **AC01-QA02-14 — Operación asistida por IA externa sin MCP**

**Problema profesional.** Un QA puede disponer de acceso a una interfaz conversacional gratuita sin compatibilidad MCP.

QAP podría aprovechar esa asistencia sin convertirla en un proveedor de inteligencia integrado.

**Escenario profesional.** Un profesional desea que una IA le proponga casos negativos para una regla de negocio, pero la IA no puede consultar ni ejecutar QAP directamente.

**Actores:** QA humano, IA externa no integrada.

**Propuesta funcional.**

Permitir un ciclo explícito de exportación e importación de propuestas:

1. Seleccionar contexto autorizado.
2. Generar un paquete mínimo y saneado.
3. Mostrar exactamente qué información se compartirá.
4. Exportarlo mediante una acción humana explícita.
5. Recibir propuestas externas.
6. Importarlas como contenido no confiable.
7. Validar esquema, identidad y revisiones.
8. Admitir únicamente las propuestas compatibles con las políticas vigentes.

El paquete podrá incluir contexto abstracto, reglas acreditadas permitidas, ejemplos sintéticos, referencias lógicas y esquema de respuesta.

Excluir credenciales, sesiones, datos sensibles no autorizados, evidencia privada y permisos operacionales.

No asumir que un modelo gratuito es privado ni que su tratamiento de datos es admisible para una empresa determinada.

**Requisitos afectados:** MEM-002.4–002.5, MEM-003.4, IA-001.1, AGT-002, D20.

**Dependencias:** exportación segura, importación de propuestas y clasificación de información.

**Riesgos:** divulgación, prompt injection, propuestas basadas en contexto caducado.

**Alternativas:** utilizar únicamente HOST compatibles; copiar manualmente requisitos sintéticos; paquetes estructurados especializados.

**Aceptación futura:** generar un paquete sintético, importar una respuesta válida e identificar otra que contiene revisiones obsoletas o instrucciones para modificar autoridad.

**Prueba negativa:** ninguna respuesta externa deberá ejecutar automáticamente una operación, añadir grants o convertirse en regla acreditada por su origen.

**Prioridad:** valiosa, pero opcional para el primer lanzamiento.

**Costo relativo:** bajo-medio si reutiliza los contratos existentes.

**Decisión requerida:** ampliación opcional, sin proveedor MANAGED y sin conexión obligatoria.

## **AC01-QA02-15 — Evidencias aportadas manualmente**

**Problema profesional.** Una captura generada por QAP durante una operación gobernada y una imagen aportada por un humano tienen niveles de procedencia diferentes.

La incorporación de archivos manuales puede introducir información manipulada, contenido hostil o secretos.

**Escenario profesional.** Un QA adjunta una imagen de un comportamiento incorrecto, un documento exportado por la aplicación y una descripción textual.

**Actores:** QA Executor, auditor, responsable de custodia.

**Propuesta funcional.**

Permitir evidencia manual vinculada a caso, intento, paso, observación o defecto.

Registrar separadamente:

| Metadato                        | Finalidad                                       |
| ------------------------------- | ----------------------------------------------- |
| Origen declarado                | Identificar cómo se obtuvo                      |
| Actor que aporta                | Responsabilidad                                 |
| Tiempo declarado de adquisición | Contexto temporal externo                       |
| Tiempo de recepción             | Hecho registrado por QAP                        |
| Digest                          | Integridad desde la incorporación               |
| Tipo y tamaño                   | Validación                                      |
| Alcance                         | Evitar cruces de información                    |
| Grants aplicables               | Captura, acceso, conservación y exportación     |
| Nivel de confianza              | Diferenciar integridad y suficiencia probatoria |

Un digest calculado al importar una captura no demuestra que esta sea auténtica respecto del AUT ni que represente exactamente lo ocurrido.

QAP deberá diferenciar su responsabilidad sobre custodia posterior a la incorporación de aquello que ocurrió fuera de su control.

### **Frontera especialmente importante**

QAP no puede garantizar que una persona nunca capturó información sensible utilizando otra herramienta, una cámara o un navegador externo.

Sí debe impedir que contenido prohibido se incorpore, conserve o exporte mediante sus superficies gobernadas conforme a las políticas aplicables.

No se debe declarar que QAP acreditó cero capturas externas de secretos si no controla esos mecanismos.

**Requisitos afectados:** REP-001.1, SEG-002.3, POL-CAP-001, POL-RET-001, AR-27/28/50, DE-01/02.

**Dependencias:** custodia, sanitización, validación de archivos y retención.

**Riesgos:** secretos en adjuntos, archivos manipulados, exportación indebida, falsa autenticidad.

**Alternativas:** referencias sin incorporación del archivo; almacenamiento gobernado de medios; integración externa de evidencia.

**Aceptación futura:** adjuntar evidencia permitida, comprobar digest, vincular al paso, revocar acceso y verificar la denegación. Alterar el archivo después de su recepción deberá producir el tratamiento de integridad correspondiente.

**Prueba negativa:** un archivo con contenido prohibido no deberá incorporarse como evidencia válida ni exportarse bajo autorización insuficiente.

**Prioridad:** esencial.

**Costo relativo:** medio-alto.

**Decisión requerida:** precisión de custodia. No requiere modificar DE-02.

## **AC01-QA02-16 — Gestión humana de defectos, entrega y retest**

**Problema profesional.** REP-001.3 y REP-001.4 ya contemplan gestión de defectos y retest, pero es necesario que el profesional pueda realizar estas operaciones directamente, sin depender del agente.

**Escenario profesional.** Un Executor detecta una anomalía, un Senior revisa su evidencia, el desarrollador recibe la información y posteriormente otro QA verifica la corrección.

**Actores:** QA Executor, QA Senior, Developer, QA Lead.

**Propuesta funcional.**

Permitir creación, clasificación, enlace, revisión y actualización gobernada de defectos.

Estados operacionales candidatos:

El ciclo de gestión no sustituye la taxonomía causal existente ni los veredictos AV-04.

El ejecutor debe poder registrar anomalías no acreditadas sin calificarlas prematuramente como defectos confirmados.

Una corrección informada por desarrollo no equivale a una corrección verificada.

El retest deberá crear un intento nuevo y enlazado. La regresión es una actividad diferente que verifica efectos colaterales o funcionalidades relacionadas.

**Requisitos afectados:** REP-001.3–001.4, REG-001.1–001.3, AR-46, D12/D19.

**Dependencias:** QA-03 para máquina de estados definitiva, firma de defecto, receta reproducible y reportes.

**Riesgos:** cerrar incidencias por declaración del desarrollador, borrar fallos históricos y confundir retest con retry.

**Alternativas:** gestor nativo mínimo; integración con issue tracker; exportación de paquetes de reproducción.

**Aceptación futura:** registrar un fallo acreditado, compartir su información, recibir una referencia de corrección, realizar retest, conservar el fallo inicial y obtener el resultado posterior.

**Prueba negativa:** cambiar el estado administrativo del defecto a cerrado no podrá modificar el FAIL histórico ni acreditar una corrección no verificada.

**Prioridad:** esencial.

**Costo relativo:** medio, reutilizando las capacidades normativas existentes.

**Decisión requerida:** precisión de REP y coordinación con QA-03. No se propone otro DefectManager.

## **AC01-QA02-17 — Interfaz operacional local y accesibilidad**

Brecha de producto

**Problema profesional.** La CLI y el visor histórico no proporcionan necesariamente una experiencia viable para el trabajo cotidiano de un equipo QA.

El visor aprobado por AR-24 es de solo lectura. Convertirlo directamente en una interfaz de escritura contradiría una garantía aceptada.

**Escenario profesional.** Un QA trabaja diariamente diseñando, editando y ejecutando cientos de casos. No dispone de conocimientos de MCP ni desea editar YAML para cada modificación.

**Actores:** QA Senior, QA Executor, QA Lead.

**Evidencia QAP.** [AR-24](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/dictamen-av02.md?utm_source=chatgpt.com#ar-24) establece un visor autenticado, confinado y sin mutaciones HTTP. La especificación consolidada §8 preserva esta separación.

**Propuesta funcional.**

Definir una superficie operacional local, autenticada y accesible, diferente en autoridad del visor histórico.

Debe ofrecer como mínimo gestión de proyectos, biblioteca, formularios de casos, selección de campañas, asignaciones, runner manual, ejecución automatizada disponible, defectos, historial e intercambio.

La interfaz es un consumidor del núcleo, no otro repositorio ni otro ejecutor soberano.

### **Proyección conceptual de experiencia humana**

### **QAP · Operación QA**

Sin IA conectada

Proyectos

Biblioteca

Campañas

Mi trabajo

Exploración

Defectos

Reportes

Intercambio

### **Regresión · versión 2.4**

Ejemplo ilustrativo · 48 obligaciones

# **48**

Planificadas

# **29**

Ejecutadas

# **21**

PASS acreditados

# **19**

Pendientes

Progreso de ejecución

29/48

**Trabajo pendiente**

TC-041

Manual

Validar aprobación

TC-052

Automático

Verificar persistencia

TC-063

Híbrido

Revisar reglas

La visualización anterior representa capacidades candidatas, no un diseño de interfaz aprobado ni una implementación.

### **Restricciones de experiencia**

La aplicación deberá permitir trabajo por teclado, foco visible, etiquetas comprensibles, manejo de errores, conservación de datos introducidos y estados no dependientes exclusivamente del color.

WCAG 2.2 proporciona criterios pertinentes para interfaces de formularios, navegación y gestión de foco. Su aplicación no permite afirmar conformidad completa sin evaluación correspondiente.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.w3.org\&sz=32)

w3.org



**Requisitos afectados:** D01/D02/D13/D17/D20, INT-001.1, AR-24/28/52, DE-05.

**Dependencias:** todos los contratos operacionales humanos.

**Riesgos:** ampliar la superficie de ataque, duplicar escritura, convertir el visor en una API administrativa insegura.

**Alternativas consideradas:**

| Alternativa                                    | Valoración                                                                   |
| ---------------------------------------------- | ---------------------------------------------------------------------------- |
| CLI exclusivamente                             | Funcional para perfiles técnicos; insuficiente como única experiencia diaria |
| Aplicación local independiente de presentación | Viable                                                                       |
| Interfaz web local autenticada                 | Viable si acredita la frontera de seguridad                                  |
| Ampliar directamente el visor legacy           | Rechazada sin redefinición segura de superficie                              |
| Gestor SaaS externo obligatorio                | Incompatible con el objetivo local autónomo                                  |
| Gestor externo opcional                        | Viable como integración                                                      |

No se selecciona framework, runtime de interfaz, arquitectura física ni tecnología definitiva.

**Aceptación futura:** completar el flujo profesional del hallazgo 01 mediante interfaz local, verificar que opera sobre los mismos IDs, revisiones, permisos y hechos que CLI/MCP, y comprobar accesibilidad de los estados críticos.

**Prueba negativa:** el visor histórico no podrá escribir mediante solicitudes directas. La interfaz operacional tampoco podrá acceder fuera de su autoridad, aun si se manipula su presentación.

**Prioridad:** esencial.

**Costo relativo:** alto.

**Decisión requerida:** nueva superficie operacional de lanzamiento, preservando AR-24.

# **9. Modelo lógico mínimo recomendado**

No considero necesario introducir una nueva arquitectura física para la gestión humana.

La mayor parte de la ampliación puede expresarse mediante extensión de entidades existentes y un pequeño conjunto de conceptos lógicos adicionales.

| Concepto                       | Tratamiento                       |
| ------------------------------ | --------------------------------- |
| Proyecto, aplicación y entorno | Reutilizar                        |
| ScopeIdentity y ProfileBinding | Reutilizar                        |
| Requisitos y reglas            | Reutilizar                        |
| TestCaseIdentity               | Reutilizar                        |
| TestCaseRevision               | Extender                          |
| CampaignPlan                   | Reutilizar                        |
| ExecutionPlan                  | Extender                          |
| DataPlan                       | Reutilizar                        |
| TestSet                        | Nueva capacidad lógica            |
| WorkAssignment                 | Nueva capacidad lógica            |
| ManualExecutionSession         | Extensión operacional             |
| ExploratorySession             | Extensión de campaña              |
| Attempt                        | Extender procedencia              |
| StepObservation                | Precisar representación           |
| HumanDeclaration               | Nueva representación diferenciada |
| EvidenceReference              | Extender procedencia              |
| Defect                         | Reutilizar obligación existente   |
| HandoffPackage                 | Extender portabilidad             |
| Report                         | Reutilizar                        |

Los nombres son provisionales. No prescriben clases, tablas ni módulos físicos independientes.

## **9.1. Identidad, intención y representación**

Debe preservarse la siguiente cadena:

**Requisito / regla**

Fuente y autoridad

**Identidad del caso**

Intención funcional

**Revisión del caso**

Procedimiento y obligaciones

**Plan congelado**

Contexto y selección concretos

**Intento**

Acciones realmente realizadas

**Observaciones y testigos**

Hechos y procedencia

**Veredicto y reporte**

Evaluación, evidencia y trazabilidad

Los cambios de modalidad de ejecución no deberán romper esta cadena.

# **10. Estados operacionales frente a resultados funcionales**

Un error de diseño frecuente sería intentar utilizar una única máquina de estados para representar simultáneamente el trabajo pendiente, el resultado de prueba y la aprobación empresarial.

QAP debe mantener dimensiones separadas.

| Dimensión            | Ejemplos                                            |
| -------------------- | --------------------------------------------------- |
| Autoría              | Borrador, revisión vigente, archivada               |
| Revisión             | No requerida, pendiente, concluida                  |
| Asignación           | Sin asignar, asignada, transferida                  |
| Trabajo              | Pendiente, en curso, pausado                        |
| Modalidad            | Manual, automática, híbrida                         |
| Veredicto            | Los seis estados AV-04                              |
| Cleanup              | Estados normativos AV-04                            |
| Evidencia            | Estados normativos AV-04                            |
| Defecto              | Estado administrativo de investigación y corrección |
| Decisión empresarial | Aceptación de riesgo o decisión de entrega          |

Una prueba terminada administrativamente puede contener un FAIL.

Una prueba manual declarada como satisfactoria puede continuar siendo INDETERMINATE.

Una campaña con un caso aprobado puede no ser aceptable debido a otras obligaciones, cleanup o evidencia.

Estas dimensiones no deben reducirse a una sola etiqueta como `completed`, `approved` o `human_accepted`.

# **11. Memoria necesaria para la operación humana**

La hipótesis del Orquestador sobre cinco dominios lógicos resulta útil como mecanismo de organización conceptual.

Desde QA-02, recomiendo evaluarla con la siguiente separación:

**Conocimiento**

Reglas, requisitos, módulos, configuraciones y fuentes.

**Biblioteca de pruebas**

Casos, revisiones, agrupaciones y plantillas.

**Ejecuciones**

Planes congelados, tareas, asignaciones, intentos y observaciones.

**Defectos y reproducción**

Hallazgos, referencias causales, retest e instrucciones reproducibles.

**Reportes**

Consultas, cortes históricos, plantillas y publicaciones autorizadas.

**Repositorio canónico común**

Identidades · procedencia · autoridad · referencias versionadas

### **11.1. Condiciones**

No recomiendo cinco bases de datos obligatorias.

Tampoco recomiendo tratar los cinco dominios como sustitución de los planos epistémicos aprobados en MEM y AR-04. La separación por finalidad de producto es diferente de la separación por naturaleza, procedencia y autoridad del conocimiento.

### **11.2. Persistencia necesaria**

| Información           | Tratamiento recomendado                          |
| --------------------- | ------------------------------------------------ |
| Casos activos         | Conservar según D19                              |
| Sets activos          | Conservar como activos versionados               |
| Plantillas activas    | Conservar según política                         |
| Asignaciones abiertas | Proteger mientras exista trabajo pendiente       |
| Sesiones activas      | Preservar información necesaria para continuidad |
| Intentos completos    | Detalle sujeto a 90 días y excepciones           |
| Resúmenes históricos  | Permanentes según DE-01                          |
| Evidencia multimedia  | TTL y grants correspondientes                    |
| Defectos abiertos     | Protección conforme a política vigente           |
| Copias exportadas     | Custodia y consentimiento independientes         |

No se recomienda conservar indefinidamente todos los detalles de todas las ejecuciones humanas.

Tampoco se recomienda eliminar observaciones necesarias para una tarea activa únicamente porque se alcanzó un TTL genérico.

El tratamiento debe preservar DE-01: si la evidencia indispensable ya no puede verificarse, cambia la acreditación actual correspondiente, sin reescribir el resultado histórico.

### **11.3. Consulta histórica humana**

Un QA deberá poder responder, dentro de los datos conservados:

- Qué caso se ejecutó.
- Qué revisión se utilizó.
- Quién realizó el trabajo.
- Qué alcance tenía.
- Qué obligaciones se evaluaron.
- Qué resultado quedó registrado.
- Qué evidencia sigue disponible.
- Qué información expiró o fue eliminada.
- Qué defectos y retests quedaron vinculados.

La definición detallada de recetas de reproducción, reportes parametrizados y mínimos históricos durables debe resolverse junto con QA-03.

# **12. Contrato de operación sin IA**

Se recomienda incorporar una matriz explícita de capacidades por modalidad.

| Operación                                 | Humano sin IA        | Determinista                          | HOST                    |
| ----------------------------------------- | -------------------- | ------------------------------------- | ----------------------- |
| Registrar requisitos                      | Sí                   | Importación validada                  | Proponer                |
| Diseñar casos nuevos                      | Sí                   | Desde plantillas o reglas disponibles | Proponer                |
| Organizar sets                            | Sí                   | Sí, por criterios tipados             | Sí                      |
| Resolver permisos                         | Operación autorizada | Validar                               | No conceder             |
| Seleccionar casos                         | Sí                   | Sí                                    | Proponer                |
| Ejecutar pasos manuales                   | Sí                   | No sustituye al humano                | No sustituye al humano  |
| Ejecutar pasos automatizados              | Solicitar            | Sí                                    | Solicitar               |
| Evaluar oráculos deterministas            | Solicitar            | Sí                                    | Solicitar               |
| Aportar observaciones                     | Sí                   | Sí                                    | Proponer interpretación |
| Determinar veredicto canónico             | No unilateralmente   | Núcleo                                | No unilateralmente      |
| Registrar defectos candidatos             | Sí                   | Según contrato                        | Proponer                |
| Consultar reportes                        | Sí                   | Sí                                    | Sí                      |
| Interpretar requisitos ambiguos           | Humano competente    | No inventar                           | Proponer                |
| Generar nueva estrategia por razonamiento | Sí                   | No garantizado                        | Sí                      |

El acceso al núcleo y sus datos deberá seguir siendo operativo independientemente de la disponibilidad del HOST.

**Ausencia de IA no significa ausencia de capacidad de gestión.**

# **13. Contraste de escenarios profesionales en papel**

Los siguientes escenarios son ejercicios documentales de diseño. No fueron ejecutados.

## **Escenario A — QA completamente manual**

Un QA recibe un requisito nuevo, crea cinco casos mediante formularios, prepara datos sintéticos, organiza una campaña y realiza las pruebas manualmente.

Registra resultados observados, evidencia, dos bloqueos y un defecto.

Resultado esperado: QAP conserva todas las obligaciones y calcula exclusivamente los veredictos sustentados.

**Cobertura propuesta:** QA02-01/02/03/05/06/15/17.

## **Escenario B — Senior entrega pruebas a Executor**

El Senior prepara 20 casos reutilizables, congela una selección y exporta un paquete de trabajo.

El Executor lo importa en otra instalación, obtiene localmente permisos y ejecuta 15 casos. Devuelve resultados y cinco pendientes.

Resultado esperado: la instalación original concilia sin duplicar intentos ni elevar autoridad.

**Cobertura propuesta:** QA02-03/04/10/11/12.

## **Escenario C — Ejecución híbrida sin IA**

QAP prepara datos mediante una operación autorizada, un humano comprueba una interfaz y el núcleo verifica la persistencia.

Resultado esperado: un solo flujo con procedencia por paso, reconciliación y resultado canónico.

**Cobertura propuesta:** QA02-05/06/07/09.

## **Escenario D — Automatización posterior de un caso humano**

Un caso manual se entrega al HOST para que proponga automatización. El HOST sustituye pasos por operaciones equivalentes y conserva la expectativa.

Resultado esperado: una revisión vinculada a la identidad original, sin sustituir intentos históricos.

**Cobertura propuesta:** QA02-02/13.

## **Escenario E — Retest después de una corrección**

Una versión anterior contiene un defecto acreditado. Desarrollo informa una corrección.

Otro QA ejecuta el retest contra una versión posterior.

Resultado esperado: el FAIL original y el resultado posterior coexisten. El estado administrativo del defecto cambia únicamente conforme a evidencia y política.

**Cobertura propuesta:** QA02-06/16.

## **Escenario F — Consulta histórica después de poda**

Un QA necesita conocer qué ocurrió en una prueba realizada hace más de 90 días.

Resultado esperado: el resumen y los vínculos conservados permanecen consultables. Se identifican explícitamente los medios eliminados y las limitaciones de verificación actual.

**Cobertura propuesta:** QA02-15/16 y dependencias QA-03.

## **Escenario G — IA externa sin MCP**

El QA exporta un contexto mínimo con información sintética y recibe propuestas de casos.

Resultado esperado: propuestas validadas e importadas sin conceder permisos ni transmitir datos privados no autorizados.

**Cobertura propuesta:** QA02-14.

## **Escenario H — Interrupción y posible duplicación**

Un QA realiza una acción manual que puede crear un registro y cierra el programa antes de documentarla.

Resultado esperado: QAP exige aclaración o reconciliación antes de permitir una nueva acción equivalente, cuando gobierna dicha acción.

**Cobertura propuesta:** QA02-07/09/10.

## **Escenario I — Manipulación de resultados**

Un usuario modifica un archivo exportado, declara que todos los pasos fueron aprobados e intenta importarlo como resultado acreditado.

Resultado esperado: conflicto de integridad o registro de procedencia no acreditada, según corresponda. Cero elevación indebida a PASS.

**Cobertura propuesta:** QA02-06/11/12/15.

## **Escenario J — Acción externa fuera de control**

Un humano utiliza un navegador ajeno a QAP y realiza operaciones no supervisadas por el producto.

Resultado esperado: QAP no atribuye a su propio ejecutor esas acciones ni afirma haber impedido efectos externos que no pudo gobernar. Las observaciones incorporadas conservan su procedencia y limitaciones.

**Cobertura propuesta:** QA02-05/06/10/15.

# **14. Criterios de aceptación propuestos para el delta AC-01**

Estos criterios son candidatos. No constituyen protocolos autorizados para ejecución ni nuevas compuertas aprobadas.

| ID candidato | Criterio                                      | Testigo requerido                                        |
| ------------ | --------------------------------------------- | -------------------------------------------------------- |
| AH-01        | Ciclo completo sin IA                         | Registro de operaciones y cero solicitudes de inferencia |
| AH-02        | Autoría y versionado                          | Revisiones históricas y recibos                          |
| AH-03        | Protección de modificaciones humanas          | Conflicto y rechazo de actualización obsoleta            |
| AH-04        | Reutilización de sets                         | Identidades, pertenencia y plan congelado                |
| AH-05        | Asignación y transferencia                    | Historial de responsabilidad                             |
| AH-06        | Ejecución manual guiada                       | Observaciones por paso                                   |
| AH-07        | Cero falsos PASS por declaración manual       | Controles sanos y mutantes                               |
| AH-08        | Flujo híbrido                                 | DAG, actores, testigos y cleanup                         |
| AH-09        | Exploración estructurada                      | Charter, observaciones y casos derivados                 |
| AH-10        | Recuperación tras interrupción                | Checkpoint y reconciliación                              |
| AH-11        | Separación de autoridades                     | Denegaciones por identidad, alcance y efecto             |
| AH-12        | Handoff entre instalaciones                   | Paquetes, recibos y conflictos                           |
| AH-13        | Importación idempotente                       | Conteos reconciliados y linaje                           |
| AH-14        | Conversión de caso a automatización           | Comparación de obligaciones y revisiones                 |
| AH-15        | Evidencia manual protegida                    | Procedencia, digest y custodia                           |
| AH-16        | Retest sin reescritura histórica              | Fallo original y retest enlazado                         |
| AH-17        | Consulta después de poda                      | Resumen y ausencias explícitas                           |
| AH-18        | Paridad de superficies                        | Hechos, autoridad y semántica equivalentes               |
| AH-19        | Accesibilidad operacional                     | Evaluaciones de estados críticos                         |
| AH-20        | Propuestas externas seguras, si se incorporan | Export saneado y rechazo de propuestas inválidas         |

Los criterios deberán incorporar controles negativos y evidencias por obligación. No basta demostrar que una pantalla permite completar un formulario.

La aceptación deberá integrarse con las compuertas y contratos existentes después de ratificar los cambios de alcance.

# **15. Riesgos y alternativas de arquitectura de producto**

## **15.1. Riesgo de construir dos QAP**

El principal riesgo arquitectónico de esta ampliación consiste en desarrollar:

- Un QAP orientado a agentes.
- Otro QAP orientado a personas.

Con bibliotecas, ejecuciones, almacenamiento y criterios de resultados diferentes.

Esta solución debe rechazarse.

Los dos perfiles deben operar sobre los mismos contratos, revisiones, autoridad y resultados canónicos.

## **15.2. Riesgo de reducir autonomía**

La incorporación de herramientas de revisión humana podría reintroducir las aprobaciones obligatorias que D04 y CAS-001.1 ordenan evitar.

La revisión debe estar disponible, pero no ser una compuerta ordinaria universal.

La intervención humana será necesaria cuando la modalidad la requiera, cuando exista una decisión empresarial real o cuando falten fuentes o permisos acreditados.

## **15.3. Riesgo de convertir QAP en una plataforma empresarial generalista**

No es necesario construir un sustituto completo de Jira, Azure DevOps, TestRail, un sistema de gestión documental o un proveedor de identidad empresarial.

QAP necesita las capacidades que sostienen su propio ciclo de pruebas.

Las capacidades ajenas deberán integrarse o diferirse.

## **15.4. Alternativas generales**

| Alternativa                                      | Ventaja                                     | Desventaja                                               |
| ------------------------------------------------ | ------------------------------------------- | -------------------------------------------------------- |
| Mantener QAP exclusivamente orientado a agentes  | Menor ampliación funcional                  | Dependencia práctica del agente para autoría y operación |
| Construir gestión humana nativa mínima           | Autonomía real de usuarios y coherencia     | Mayor alcance inicial                                    |
| Integrarse únicamente con gestores existentes    | Reutilización de ecosistemas                | Dependencia externa y fragmentación                      |
| Construir gestión empresarial completa           | Mayor amplitud                              | Desviación significativa de alcance                      |
| Núcleo humano local más integraciones opcionales | Equilibrio entre autonomía y extensibilidad | Exige fronteras contractuales cuidadosas                 |

**Recomendación:** núcleo de gestión humana local con integraciones externas opcionales.

No implica elegir tecnología definitiva.

# **16. Clasificación final del alcance recomendado**

## **16.1. Esencial para primer lanzamiento, si se ratifica la ampliación**

| Capacidad                       | Justificación                            |
| ------------------------------- | ---------------------------------------- |
| Operación sin modelos           | Independencia funcional                  |
| Interfaz humana local           | Trabajo diario viable                    |
| Autoría protegida               | Preservar inversión profesional          |
| Biblioteca y agrupaciones       | Reutilización                            |
| Selección y asignación          | Organización del trabajo                 |
| Ejecución manual                | Cobertura de casos no automatizados      |
| Ejecución híbrida               | Combinar capacidades disponibles         |
| Resultados observados por paso  | Evidencia reproducible                   |
| Pausas y reanudación            | Continuidad                              |
| Exploración estructurada básica | Detección de problemas no anticipados    |
| Evidencia manual gobernada      | Documentación de hallazgos               |
| Handoff local                   | Colaboración sin infraestructura central |
| Importación canónica y CSV      | Adopción y portabilidad                  |
| Handoff humano-agente           | Unificación del producto                 |
| Defectos y retest humanos       | Ciclo profesional completo               |
| Separación de autoridad         | Garantía no compensable                  |

## **16.2. Valiosas, pero opcionales**

| Capacidad                                     | Motivo                                                    |
| --------------------------------------------- | --------------------------------------------------------- |
| Paquetes optimizados para IA externa sin MCP  | Útil, no indispensable                                    |
| Importadores específicos de XLSX              | Mejora de adopción                                        |
| Plantillas especializadas por industria       | Conveniencia                                              |
| Editor avanzado de plantillas                 | No imprescindible para la primera versión                 |
| Agrupaciones dinámicas avanzadas              | Se puede empezar con selecciones guardadas                |
| Reutilización avanzada de fragmentos de pasos | Reduce mantenimiento, pero añade complejidad de versiones |
| Personalización avanzada de paneles           | No debe bloquear la operación fundamental                 |

## **16.3. Integraciones externas**

| Integración                            | Criterio                                      |
| -------------------------------------- | --------------------------------------------- |
| Jira y otros issue trackers            | Enlazar defectos y estados externos           |
| Azure DevOps                           | Intercambio de casos y resultados             |
| TestRail y otros gestores              | Importación/exportación                       |
| CI/CD                                  | Consumir y emitir resultados gobernados       |
| Sistemas documentales                  | Consultar y compartir referencias autorizadas |
| Proveedores empresariales de identidad | Autenticación cuando corresponda              |

Ninguna integración adicional debe convertirse automáticamente en requisito obligatorio de instalación o licencia.

Las integraciones ya obligatorias de la línea base mantienen su alcance ratificado.

## **16.4. Posteriores al primer lanzamiento**

| Capacidad                                     | Razón                                              |
| --------------------------------------------- | -------------------------------------------------- |
| Colaboración concurrente centralizada         | D02                                                |
| Repositorio empresarial compartido            | Infraestructura y autoridad adicionales            |
| Sincronización automática entre instalaciones | Riesgo de conflictos distribuidos                  |
| Gestión avanzada de equipos                   | No esencial para operación local                   |
| Dashboards organizacionales multiusuario      | Requiere semántica y autoridad compartidas         |
| SSO empresarial avanzado                      | Alcance adicional                                  |
| Gestión de reservas globales de trabajo       | Requiere coordinación efectiva entre instalaciones |

## **16.5. Fuera de alcance recomendado**

Se consideran fuera del alcance propio de QA-02: gestión general de proyectos empresariales, evaluación de rendimiento laboral individual, CRM, desarrollo del AUT, modificación de infraestructura empresarial, captura clandestina de actividad humana, certificación automática integral de normas y acreditación por mera aceptación administrativa.

# **17. Impacto sobre las decisiones y garantías ratificadas**

| Decisión                               | Tratamiento                                                 |
| -------------------------------------- | ----------------------------------------------------------- |
| D01 — Producto listo para uso real     | Ampliar su interpretación operacional mediante acto expreso |
| D02 — Local primero                    | Preservar                                                   |
| D03 — HOST y DETERMINISTIC             | Preservar                                                   |
| D04 — Autonomía integral               | Preservar sin aprobaciones rutinarias                       |
| D05 — Memoria                          | Extender operación humana                                   |
| D06 — E2E                              | Precisar composición híbrida                                |
| D07–D09 — Autoridad, APIs y referencia | Preservar                                                   |
| D10–D11 — Documentación y reportes AUT | Preservar; no confundir con importación de casos            |
| D12 — Veracidad                        | Preservar estrictamente                                     |
| D13–D16 — Compatibilidad e instalación | Extender evaluación a la superficie humana                  |
| D17 — Idiomas                          | Aplicar a interfaz y autoría humanas                        |
| D18 — Evidencia                        | Precisar origen humano                                      |
| D19 — Retención                        | Preservar                                                   |
| D20 — Seguridad                        | Extender autoridad operacional                              |
| D21 — Aceptación                       | Incorporar deltas ratificados sin reducir obligaciones      |

## **17.1. Decisiones DE-01–05**

| Decisión ratificada             | Dictamen                                                                     |
| ------------------------------- | ---------------------------------------------------------------------------- |
| DE-01 A — Retención             | Sin modificación propuesta                                                   |
| DE-02 B — Captura privada       | Sin modificación propuesta                                                   |
| DE-03 B — Calidad integrada     | Mantener pisos y vetos; extender cobertura pertinente al delta humano        |
| DE-04 A con B respaldo — Piloto | Mantener obligatoriedad y evaluar flujo humano representativo si se ratifica |
| DE-05 B — Accesibilidad         | Mantener política; extender matriz de QAP a la nueva superficie              |

No se propone reducir el cero de falsos PASS, el cero de violaciones de autoridad ni la obligatoriedad de las garantías anteriores.

Los objetivos de autonomía normativa tampoco deben reducirse utilizando tareas deliberadamente manuales como justificación. Será necesario distinguir de forma previa y auditable las obligaciones que corresponden a autonomía elegible de las que requieren intervención humana por diseño.

La clasificación no debe realizarse retrospectivamente para mejorar métricas.

# **18. Dependencias con otras especialidades**

| Especialidad | Dependencia                                                                           |
| ------------ | ------------------------------------------------------------------------------------- |
| QA-01        | Semántica de suite, set, plan, campaña, cobertura y prioridades                       |
| QA-03        | Defectos, recetas reproducibles, reportes, indicadores, mínimos históricos            |
| QA-04        | Equivalencia manual-automatizada, adaptadores, integración y ejecución existente      |
| QA-05        | Accesibilidad, experiencia humana, observaciones cualitativas y seguridad             |
| QA-06        | Datos de prueba, identidad efectiva, operaciones empresariales y efectos persistentes |

QA-02 no debe resolver unilateralmente los contratos de las otras especialidades.

En particular, los conceptos TestSet, StepObservation, HumanDeclaration y HandoffPackage deben consolidarse posteriormente para evitar duplicación de entidades.

# **19. Decisiones propuestas para el propietario**

Recomiendo elevar siete decisiones de producto. No son elecciones de tecnologías.

| ID candidato | Decisión                                                      | Recomendación               |
| ------------ | ------------------------------------------------------------- | --------------------------- |
| DH-01        | ¿QAP debe cubrir el trabajo diario humano sin IA desde v1?    | Sí                          |
| DH-02        | ¿Debe incluir interfaz operacional local además de MCP/CLI?   | Sí                          |
| DH-03        | ¿Debe soportar ejecución manual e híbrida?                    | Sí                          |
| DH-04        | ¿Debe incluir biblioteca, sets y asignaciones?                | Sí                          |
| DH-05        | ¿Cómo colaborarán inicialmente los profesionales?             | Intercambio local gobernado |
| DH-06        | ¿Debe incorporarse asistencia mediante IA externa sin MCP?    | Opcional                    |
| DH-07        | ¿Debe incluir colaboración concurrente centralizada desde v1? | No; preservar D02           |

Las decisiones DH-01 a DH-05 amplían el alcance de producto y tienen impacto significativo en esfuerzo, seguridad y aceptación.

DH-07 conserva una decisión existente; no requiere reabrir D02 salvo que el propietario desee modificarla.

No recomiendo presentar al propietario cada precisión técnica como una decisión empresarial individual. Los detalles que no alteren alcance, riesgo o garantías podrán resolverse mediante contratos y revisión técnica.

# **20. Fuentes consultadas**

## **20.1. Fuentes primarias de QAP**

Todas las referencias de esta investigación se vinculan al SHA:

`b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5`

| Fuente                                                                                                                                                                                                           | Alcance                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| [Encargo AC-01](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/encargo-ac01-evaluacion-multidisciplinaria-qa.md?utm_source=chatgpt.com)      | Especialidad y restricciones         |
| [Especificación consolidada](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/especificacion-consolidada.md?utm_source=chatgpt.com)                         | Producto y arquitectura objetivo     |
| [Manifiesto normativo](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/manifiesto-normativo-consolidado.md?utm_source=chatgpt.com)            | Fuentes y precedencia                |
| [Catálogo de requisitos](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/catalogo-requisitos.md?utm_source=chatgpt.com)                                    | Obligaciones existentes              |
| [Acta D01–D21](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/acta-decisiones.md?utm_source=chatgpt.com)                                                  | Decisiones de producto               |
| [Acta DE](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/acta-ratificacion-de.md?utm_source=chatgpt.com)                                     | Políticas ratificadas                |
| [Registro maestro](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/registro-maestro.md?utm_source=chatgpt.com)                                | Auditorías y dependencias            |
| [Matriz AV-08](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/matriz-aceptacion-av08.md?utm_source=chatgpt.com)                              | Criterios existentes                 |
| [Resolución final de planificación](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/resolucion-final-planificacion.md?utm_source=chatgpt.com) | Estado y restricciones               |
| [Enmiendas AV-03](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/enmiendas-av03.md?utm_source=chatgpt.com)                                   | Continuidad y núcleo                 |
| [Enmiendas AV-04](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/enmiendas-av04.md?utm_source=chatgpt.com)                                   | Veredictos, testigos y efectos       |
| [Enmiendas AV-05](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/enmiendas-av05.md?utm_source=chatgpt.com)                                   | Operaciones, reportes y portabilidad |
| [Contravalidación AV-07](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/contravalidacion-chatgpt-high-av07.md?utm_source=chatgpt.com)        | Reconstrucción y escritor único      |

## **20.2. Estándares y prácticas profesionales**

| Referencia                                                                                                                          | Versión y alcance utilizado                                        |
| ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [ISTQB CTFL](https://www.istqb.com/certifications/ctfl/syllabus/?utm_source=chatgpt.com)                                            | v4.0.1, 15 de septiembre de 2024; actividades y gestión de pruebas |
| [ISO/IEC/IEEE 29119-3](https://www.iso.org/standard/79429.html?utm_source=chatgpt.com)                                              | Edición 2021; alcance público de documentación                     |
| [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/?utm_source=chatgpt.com)                                                                | Accesibilidad de interfaces                                        |
| [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html?utm_source=chatgpt.com) | Documentación evolutiva sobre archivos no confiables               |
| [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html?utm_source=chatgpt.com)         | Documentación evolutiva sobre eventos y auditoría                  |

No se atribuyen obligaciones específicas a cláusulas de pago de ISO/IEC/IEEE 29119-3 no consultadas.

## **20.3. Herramientas profesionales**

| Fuente oficial                                                                                                                                                          | Capacidad contrastada                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| [TestRail — Introduction](https://support.testrail.com/hc/en-us/articles/7076810203028-Introduction-to-TestRail?utm_source=chatgpt.com)                                 | Casos, suites, planes y ejecución       |
| [TestRail — Assigning tests](https://support.testrail.com/hc/en-us/articles/16501050634260-Assigning-tests-for-execution?utm_source=chatgpt.com)                        | Asignaciones                            |
| [TestRail — Submitting results](https://support.testrail.com/hc/en-us/articles/15813183376148-Submitting-test-results?utm_source=chatgpt.com)                           | Resultados, historial y retest          |
| [TestRail — CSV/Excel import](https://support.testrail.com/hc/en-us/articles/7101779988372-Import-test-cases-from-CSV-or-Excel?utm_source=chatgpt.com)                  | Importación y mapeo                     |
| [Azure Test Plans — Test objects](https://learn.microsoft.com/en-us/azure/devops/test/test-objects-overview?view=azure-devops\&utm_source=chatgpt.com)                  | Modelo lógico                           |
| [Azure Test Plans — Manual tests](https://learn.microsoft.com/en-us/azure/devops/test/run-manual-tests?view=azure-devops\&utm_source=chatgpt.com)                       | Runner humano                           |
| [Azure Test Plans — Actual results](https://learn.microsoft.com/en-us/azure/devops/test/actual-result?view=azure-devops\&utm_source=chatgpt.com)                        | Resultados observados                   |
| [Azure DevOps — Sprint 276](https://learn.microsoft.com/en-us/azure/devops/release-notes/2026/testplans/sprint-276-update?utm_source=chatgpt.com)                       | Disponibilidad de resultados observados |
| [Azure Test & Feedback — Standalone](https://learn.microsoft.com/en-us/azure/devops/test/standalone-mode-exploratory-testing?view=azure-devops\&utm_source=chatgpt.com) | Exploración independiente               |
| [Kiwi TCMS — Test runs](https://kiwitcms.readthedocs.io/en/stable/guide/testrun.html?utm_source=chatgpt.com)                                                            | Documentación 17.2 consultada           |
| [Kiwi TCMS — Test cases](https://kiwitcms.readthedocs.io/en/latest/guide/testcase.html?utm_source=chatgpt.com)                                                          | Documentación 17.3 consultada           |

Las páginas comerciales y de soporte sin versión fija se consideran referencias documentales observadas el 25 de noviembre de 2026, no contratos estables ni evaluaciones comparativas de rendimiento.

# **21. Limitaciones y reservas**

La investigación tiene las siguientes limitaciones:

- Se verificó la identidad del SHA y la diferencia documental respecto de la base mencionada por AC-01.
- Se leyó íntegramente el encargo vinculante.
- La revisión normativa y de código se concentró en QA-02. No se completó una lectura íntegra certificada de todos los contratos extensos incorporados en el manifiesto, ni un inventario exhaustivo de cada implementación y prueba. Por ello, la comprobación final de ausencia normativa de cada nueva capacidad debe realizarse antes de incorporarla al catálogo.
- La existencia de una función en el código o de una prueba escrita no acredita que funcione en una instalación real.
- Las herramientas externas fueron evaluadas mediante documentación oficial, no mediante ensayos prácticos.
- Los costos relativos son valoraciones de complejidad e impacto, no estimaciones temporales ni compromisos presupuestarios.
- Los modelos lógicos, diagramas, ejemplos de interfaz y estados operacionales son propuestas conceptuales.
- Las decisiones provisionales no han sido ratificadas por el propietario.
- No se ha elegido tecnología definitiva.

No se identificó, dentro del alcance documental examinado, una necesidad de reducir las garantías aceptadas en AV-01–08 para incorporar operación humana.

# **22. Dictamen final al Orquestador Principal**

# **17 hallazgos materiales**

Clasificación principal de los hallazgos QA-02

Brechas nuevas

7

Contratos que requieren precisión

9

Hallazgo mixto: precisión y ampliación

1

Esenciales condicionados

# **16**

Opcional

# **1**

DE cuya reducción se propone

# **0**

Experimentos ejecutados

# **0**

El dictamen es favorable a ampliar QAP como plataforma profesional de trabajo humano, además de su función de automatización autónoma.

La ampliación es material. No debe interpretarse como una simple pantalla adicional para administrar pruebas.

Requiere contratos de autoría, organización, responsabilidad, ejecución manual, composición híbrida, portabilidad y acreditación de resultados humanos.

No obstante, la arquitectura aprobada ya proporciona una parte importante de los mecanismos necesarios. Por ello, no recomiendo sustituirla ni crear una segunda plataforma de gestión.

## **22.1. Principios que deben quedar incorporados si se ratifica**

**Primero.** QAP debe ser útil para un profesional que nunca conecte un modelo de IA.

**Segundo.** El trabajo humano y automatizado debe compartir identidades, casos, revisiones, memoria y trazabilidad.

**Tercero.** La responsabilidad asignada no concede permisos.

**Cuarto.** Una declaración humana no equivale a un resultado funcional acreditado.

**Quinto.** Ninguna interfaz, integración o importación puede convertirse en un escritor alternativo.

**Sexto.** La revisión humana no debe reducir la autonomía ordinaria.

**Séptimo.** Local primero no significa que los profesionales deban trabajar aislados, pero tampoco implica implementar colaboración centralizada concurrente.

**Octavo.** La automatización debe reutilizar y evolucionar el trabajo humano sin destruir su historia.

## **22.2. Recomendación al Orquestador**

Integrar los hallazgos QA02-01–17 en la matriz multidisciplinaria AC-01; cotejar los contratos pendientes de revisión íntegra; resolver solapamientos con QA-01, QA-03 y QA-04; consolidar los requisitos candidatos y elevar al propietario exclusivamente las ampliaciones materiales de alcance.

Mantener vigente la línea base aprobada mientras no exista ratificación expresa de los deltas.

Después de la ratificación, realizar una contravalidación focalizada de los cambios y su impacto sobre AV-01–08.

No iniciar todavía selección tecnológica definitiva, WBS, G0/G1 ni implementación.

**Estado de entrega QA-02:** investigación documental concluida, con reservas de exhaustividad declaradas.

**Autorizaciones nuevas concedidas:** ninguna.

**Modificaciones a GitHub, código, dependencias o configuración:** ninguna.

**Acceso a sistemas empresariales:** ninguno.

**Disposición final:** informe entregado al Orquestador Principal para consolidación y decisión de alcance. Fin de la intervención QA-02.