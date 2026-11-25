# **AC-01 · Informe de investigación especializada QA-01**

## **Estrategia, diseño y dirección del aseguramiento de calidad**

| Identificación    | Detalle                                                                          |
| ----------------- | -------------------------------------------------------------------------------- |
| Destinatario      | Orquestador Principal de QAP                                                     |
| Especialidad      | QA-01 — QA Lead / Test Analyst                                                   |
| Repositorio       | `Hyouka73/QAMCP`                                                                 |
| Rama              | `develop`                                                                        |
| SHA de referencia | `b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5`                                       |
| Fecha             | 25 de noviembre de 2026                                                          |
| Naturaleza        | Investigación documental independiente                                           |
| Dictamen          | **Ampliación focalizada de requisitos recomendada antes de congelar el alcance** |
| Autorización      | Exclusivamente lectura e investigación                                           |

# **1. Resumen ejecutivo**

## **1.1. Dictamen**

QAP presenta una base normativa considerablemente desarrollada para el descubrimiento de aplicaciones, la planificación autónoma, la ejecución funcional, la acreditación de resultados, la persistencia del conocimiento y la regresión.

Sin embargo, existe una diferencia fundamental entre dos capacidades:

- Ejecutar autónomamente una campaña de pruebas con garantías.
- Dirigir estratégicamente el aseguramiento de calidad de un producto durante su ciclo de vida.

La primera está ampliamente contemplada en la especificación consolidada. La segunda dispone de componentes aprovechables, pero no está suficientemente definida como capacidad integral de producto.

Un QA Lead necesita poder determinar qué debe probarse, por qué, con qué profundidad, qué riesgos permanecen abiertos, qué evidencia respalda las conclusiones y si existe fundamento suficiente para recomendar una entrega.

Estas decisiones no pueden derivarse exclusivamente del Discovery, del número de casos ejecutados ni de la proporción de resultados PASS.

**Recomiendo que QAP evolucione hacia una plataforma local de gestión y ejecución autónoma de QA, utilizable también por profesionales humanos sin un modelo de inteligencia artificial conectado.**

Esta recomendación amplía el alcance de producto y requiere ratificación del propietario. No constituye una aprobación unilateral.

## **1.2. Capacidades que considero prioritarias**

**01**

**Revisión temprana de requisitos**

Detectar ambigüedades, criterios incompletos y requisitos no verificables.

**02**

**Estrategia de pruebas**

Establecer objetivos, alcance, riesgos, niveles y profundidad.

**03**

**Cobertura semántica**

Demostrar qué requisitos, condiciones y riesgos fueron realmente evaluados.

**04**

**Biblioteca y planificación reutilizable**

Organizar casos y selecciones por versiones, configuraciones y ciclos.

**05**

**Diseño sistemático**

Representar técnicas profesionales y sus obligaciones de cobertura.

**06**

**Control y decisión de entrega**

Evaluar criterios de entrada, salida y riesgo residual.

**07**

**Exploración profesional**

Investigar incertidumbres mediante objetivos, sesiones y hallazgos trazables.

**08**

**Coordinación entre niveles de prueba**

Relacionar pruebas manuales, automatizadas y externas sin confundir su acreditación.

## **1.3. Relación con AV-01–08**

No recomiendo invalidar ni repetir las auditorías anteriores.

El [dictamen de aptitud para planificación](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/resolucion-final-planificacion.md?utm_source=chatgpt.com) conserva su validez dentro del alcance evaluado.

AC-01 plantea una cuestión diferente: determinar si ese alcance satisface suficientemente las necesidades profesionales de QA.

Por tanto:

- Se preservan D01–D21.
- Se preservan DE-01 A, DE-02 B, DE-03 B, DE-04 A con B como respaldo y DE-05 B.
- Se preservan las 103 entradas normativas y los 57 registros AR.
- Se mantienen los vetos no compensables.
- No se modifican unilateralmente los umbrales de aceptación.
- Los hallazgos de este informe son propuestas provisionales, no nuevos requisitos aprobados.

# **2. Identidad de la revisión y metodología**

## **2.1. Verificación del SHA**

Mediante el conector de GitHub se comprobó la relación entre:

| Referencia                       | SHA                                        |
| -------------------------------- | ------------------------------------------ |
| Base común establecida por AC-01 | `303e621dbca4a3a3b17cb2bf32530ab6311edc92` |
| Referencia solicitada            | `b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5` |

El SHA solicitado está un commit por delante de la base común. El delta comprende exclusivamente la incorporación del encargo AC-01 y la actualización de su índice documental.

[Comparación de commits](https://github.com/Hyouka73/QAMCP/compare/303e621dbca4a3a3b17cb2bf32530ab6311edc92...b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5?utm_source=chatgpt.com)

Se leyó íntegramente el [encargo vinculante AC-01](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/encargo-ac01-evaluacion-multidisciplinaria-qa.md?utm_source=chatgpt.com).

## **2.2. Base documental de QAP**

| Ref. | Documento                                                                                                                                                                                                    |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Q01  | [Especificación normativa consolidada](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/especificacion-consolidada.md?utm_source=chatgpt.com)           |
| Q02  | [Manifiesto normativo](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/manifiesto-normativo-consolidado.md?utm_source=chatgpt.com)        |
| Q03  | [Catálogo de requisitos](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/catalogo-requisitos.md?utm_source=chatgpt.com)                                |
| Q04  | [Decisiones D01–D21](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/acta-decisiones.md?utm_source=chatgpt.com)                                        |
| Q05  | [Acta de ratificación DE](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/acta-ratificacion-de.md?utm_source=chatgpt.com)                 |
| Q06  | [Matriz de aceptación AV-08](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/matriz-aceptacion-av08.md?utm_source=chatgpt.com)            |
| Q07  | [Registro maestro](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/registro-maestro.md?utm_source=chatgpt.com)                            |
| Q08  | [Enmiendas AV-03](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/enmiendas-av03.md?utm_source=chatgpt.com)                               |
| Q09  | [Enmiendas AV-04](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/enmiendas-av04.md?utm_source=chatgpt.com)                               |
| Q10  | [Enmiendas AV-08](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/enmiendas-av08.md?utm_source=chatgpt.com)                               |
| Q11  | [Segunda contravalidación AV-08](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/segunda-contravalidacion-av08.md?utm_source=chatgpt.com) |
| Q12  | [Reconstrucción AV-07](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/matriz-reconstruccion-av07.md?utm_source=chatgpt.com)              |

## **2.3. Marco profesional de referencia**

La investigación contrasta QAP con los siguientes marcos y prácticas:

| Ref. | Fuente                    | Aplicación                                                    |
| ---- | ------------------------- | ------------------------------------------------------------- |
| F01  | ISTQB CTFL v4.0.1         | Proceso de pruebas, niveles, técnicas, gestión y trazabilidad |
| F02  | ISTQB CTAL-TM v3.0        | Estrategia, riesgos, seguimiento y dirección                  |
| F03  | ISTQB CTAL-TA v4.0        | Análisis y diseño especializado                               |
| F04  | ISTQB Acceptance Testing  | UAT y participación del negocio                               |
| F05  | ISO/IEC/IEEE 29119-2:2021 | Procesos de pruebas                                           |
| F06  | ISO/IEC/IEEE 29119-3:2021 | Documentación de pruebas                                      |
| F07  | ISO/IEC/IEEE 29119-4:2021 | Técnicas de diseño                                            |
| F08  | ISO/IEC/IEEE 29148:2018   | Ingeniería de requisitos                                      |
| F09  | NIST SP 800-142           | Diseño combinatorio                                           |
| F10  | Azure Test Plans          | Planes, suites y exploración                                  |
| F11  | TestRail                  | Planificación y configuraciones                               |

ISTQB distingue explícitamente las actividades de análisis, diseño, planificación, ejecución, seguimiento y finalización, incluyendo estrategias basadas en riesgos. Las referencias ISO distinguen asimismo procesos, documentación y técnicas.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://istqb.org\&sz=32)

istqb.org+5



Estas referencias se utilizan como instrumentos para identificar necesidades profesionales. No se pretende certificar QAP bajo esos estándares ni reproducir indiscriminadamente sus estructuras.

# **3. El ciclo profesional completo de QA**

## **3.1. Flujo de trabajo objetivo**

El ciclo se retroalimenta: los hallazgos modifican el conocimiento y los riesgos mediante revisiones trazables, no mediante la reescritura del historial.

El problema no consiste en añadir más etapas artificialmente. Consiste en que QAP debe preservar el significado profesional y los productos de trabajo de cada actividad, aunque varias sean realizadas automáticamente en una misma campaña.

## **3.2. Personas consumidoras**

| Actor               | Necesidad principal       | Resultado esperado                       |
| ------------------- | ------------------------- | ---------------------------------------- |
| QA Lead             | Dirigir y priorizar       | Estrategia, cobertura y recomendación    |
| Test Analyst        | Diseñar pruebas           | Condiciones, técnicas y casos            |
| QA Executor         | Ejecutar trabajo asignado | Resultados y evidencia                   |
| SDET                | Automatizar y mantener    | Revisiones ejecutables reutilizables     |
| Desarrollador       | Investigar y corregir     | Defecto reproducible y retest            |
| Analista de negocio | Aclarar expectativas      | Requisitos verificables                  |
| Product Owner       | Aceptar alcance y riesgo  | Decisión informada                       |
| Auditor             | Verificar procedencia     | Historial, evidencia y decisiones        |
| Agente de IA        | Razonar y proponer        | Contexto autorizado y acciones elegibles |

Los actores son responsabilidades profesionales. No prescriben necesariamente cuentas concurrentes, un servicio centralizado ni nueve tipos de permisos.

En una instalación local, una persona puede desempeñar varias responsabilidades, siempre que no se confunda su declaración con una autoridad o acreditación que no posee.

# **4. Mapa de cobertura de la línea base**

Clasificación utilizada:

- **CUBIERTO:** obligación normativa ya existente.
- **PRECISAR:** obligación existente cuyo contrato necesita mayor especificidad.
- **BRECHA:** necesidad profesional adicional no suficientemente establecida.
- **CONTRADICCIÓN:** incompatibilidad comprobada.
- **NO APLICA:** no debe incorporarse como obligación de esta especialidad.

| Capacidad profesional                             | Cobertura | Referencia QAP         |
| ------------------------------------------------- | --------- | ---------------------- |
| Discovery de aplicaciones                         | Cubierto  | DIS, D04–D06           |
| Ingesta de requisitos y documentación             | Cubierto  | DOC, D10               |
| Resolución de fuentes contradictorias             | Cubierto  | MEM-003.1, DOC-001.3–4 |
| Revisión preventiva de testabilidad               | Brecha    | DOC, CAS               |
| Planificación incremental                         | Cubierto  | PLN-001.2              |
| Priorización basada en riesgo                     | Precisar  | PLN-001.3              |
| Registro de riesgos de producto                   | Brecha    | PLN, REP               |
| Estrategia de pruebas por versión                 | Brecha    | PLN-001.1, CAM         |
| Positivos, negativos y límites                    | Cubierto  | CAS-001.2, AR-53       |
| Particiones de equivalencia                       | Cubierto  | AV-04 §7               |
| Transiciones de estado                            | Precisar  | CAS-001.2              |
| Tablas de decisión                                | Brecha    | CAS, ORA               |
| Pruebas combinatorias                             | Brecha    | CAS, PLN               |
| Identidad y revisión de casos                     | Cubierto  | CAS-001.3              |
| Suites reutilizables por intención                | Precisar  | REG-001.1, PLN         |
| Cobertura de obligaciones ejecutadas              | Cubierto  | AV-04 §1               |
| Cobertura de la base completa de pruebas          | Precisar  | MEM, CAS, REP          |
| Automatización de E2E                             | Cubierto  | D06, AR-43             |
| Exploración mediante charters                     | Brecha    | CAM-001.5              |
| Retest y regresión                                | Cubierto  | REP-001.4, REG         |
| Selección por impacto y cambios                   | Cubierto  | REG-001.1              |
| Criterios de entrega del AUT                      | Brecha    | PLN, REP               |
| Aceptación empresarial del AUT                    | Brecha    | PLN, REP               |
| Dirección cotidiana sin IA                        | Brecha    | D02–D04, AC-01         |
| Certificación del propio QAP                      | Cubierto  | D21, DE-03/04/05       |
| Sustituir al propietario en la decisión comercial | No aplica | Autoridad empresarial  |
| Sustituir todos los frameworks de pruebas         | No aplica | D13, INT               |

**Advertencia:** que una capacidad esté cubierta normativamente no significa que esté implementada ni acreditada en el código actual.

# **5. Contraste con el código existente**

La inspección estática de archivos en el SHA de referencia confirma que existen componentes aprovechables, pero también diferencias importantes respecto al producto objetivo.

| Código inspeccionado                                                                                                                                                                                       | Observación                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| [plan.handler.ts, L44–115](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/mcp/src/handlers/plan.handler.ts?utm_source=chatgpt.com#L44-L115)                      | El modelo persistido contiene módulo, entorno, casos y huellas. No representa por sí mismo una estrategia de pruebas por entrega.                |
| [candidate-generator.ts, L1–115](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/knowledge/src/candidate-generator.ts?utm_source=chatgpt.com#L1-L115)             | Aprovecha flujos críticos y prioridades, pero el fragmento examinado no constituye un registro profesional de riesgos.                           |
| [lineaged-case.ts, L165–265](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/mcp/src/application/lineaged-case.ts?utm_source=chatgpt.com#L165-L265)               | Existe linaje de reglas, identidad, alcance y contenido del caso. También contiene restricciones históricas de elegibilidad.                     |
| [application-contracts.ts, L150–225](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/shared/src/domain/application-contracts.ts?utm_source=chatgpt.com#L150-L225) | Existe un contrato de campaña con objetivos, modos, fases y módulos seleccionados, aprovechable para la planificación operativa.                 |
| [case-execution-policy.ts](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/playwright-runner/src/case-execution-policy.ts?utm_source=chatgpt.com)                 | Los casos BVA y RBAC negativos tienen bloqueos por categoría. La política objetivo requiere evaluación individual de elegibilidad y oráculo.     |
| [impact-analyzer.ts](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/knowledge/src/impact/impact-analyzer.ts?utm_source=chatgpt.com)                              | Existe análisis determinista de dependencias inversas. Declara expresamente que trabaja con inventario suministrado sin acreditar su coherencia. |
| [test.handler.ts, L455–505](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/mcp/src/handlers/test.handler.ts?utm_source=chatgpt.com#L455-L505)                    | Verifica selección dentro del plan y mantiene aprobación por casos y restricciones de mutación ya identificadas en AV anteriores.                |
| [Manifest MCP](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/mcp/package.json?utm_source=chatgpt.com)                                                           | Confirma composición actual, dependencias y comando de pruebas; no constituye evidencia de funcionamiento instalado.                             |

## **5.1. Contradicciones preexistentes que no deben contabilizarse como nuevas**

| Contradicción                                 | Obligación existente | Tratamiento                               |
| --------------------------------------------- | -------------------- | ----------------------------------------- |
| Aprobación humana de casos ordinarios         | CAS-001.1, AR-05     | Resolver conforme a AV-03                 |
| Bloqueos generales de determinadas categorías | CAS-001.2, AR-53     | Resolver mediante elegibilidad y testigos |
| Fragmentación de planes                       | PLN-001.1, AR-43     | Unificar según contrato existente         |
| Priorización insuficiente                     | PLN-001.3            | Implementación pendiente                  |
| Impacto desconectado de autoridad y ejecución | REG-001.1, AR-46     | Integración y acreditación pendientes     |

No propongo nuevos requisitos para corregir problemas que ya cuentan con un requisito y una resolución arquitectónica aceptada.

# **6. Registro de hallazgos materiales**

Los identificadores siguientes son provisionales y no modifican los conteos oficiales.

| ID provisional | Hallazgo                                         | Clasificación          | Prioridad        |
| -------------- | ------------------------------------------------ | ---------------------- | ---------------- |
| AC01-QA01-01   | Revisión preventiva de requisitos y testabilidad | Brecha nueva           | Esencial         |
| AC01-QA01-02   | Estrategia de pruebas por entrega                | Brecha nueva           | Esencial         |
| AC01-QA01-03   | Gestión explícita de riesgos de calidad          | Precisión y ampliación | Esencial         |
| AC01-QA01-04   | Cobertura semántica de la base de pruebas        | Precisar contrato      | Esencial         |
| AC01-QA01-05   | Biblioteca, suites y selecciones reutilizables   | Precisar contrato      | Esencial         |
| AC01-QA01-06   | Diseño sistemático y obligaciones por técnica    | Precisión y ampliación | Esencial acotada |
| AC01-QA01-07   | Pruebas exploratorias orientadas por charters    | Brecha nueva           | Esencial acotada |
| AC01-QA01-08   | Criterios de entrada, salida y control           | Brecha nueva           | Esencial         |
| AC01-QA01-09   | Aceptación y decisión de entrega del AUT         | Brecha nueva           | Esencial         |
| AC01-QA01-10   | Coordinación de niveles y pruebas externas       | Precisión y ampliación | Integración      |
| AC01-QA01-11   | Priorización explicable y regresión conservadora | Precisar contrato      | Esencial         |
| AC01-QA01-12   | Dirección y diseño de QA sin IA                  | Ampliación de alcance  | Esencial         |

El número de hallazgos responde a diferencias funcionales identificadas, no a una cuota predeterminada.

# **7. Hallazgos detallados y propuestas de requisitos**

## **AC01-QA01-01 · Revisión preventiva de requisitos y testabilidad**



Brecha nueva

&#x20;Esencial para lanzamiento · Coste relativo medio



**Problema.** QAP contempla documentos, reglas contradictorias, expectativas y oráculos. Sin embargo, revisar la calidad de un requisito antes de convertirlo en un caso de prueba constituye una actividad profesional distinta.

Un requisito puede no ser contradictorio y aun así resultar imposible de comprobar objetivamente.

**Escenario profesional.** Un requisito establece que la aprobación de solicitudes debe ser «rápida, segura y permitir montos adecuados». No define tiempos, condiciones, montos, perfiles autorizados ni criterios de excepción.

Generar casos inmediatamente produciría expectativas inventadas o comprobaciones superficiales.

**Actores:** Test Analyst, QA Lead, analista de negocio y propietario funcional.

**Evidencia:** Q01 §§3–4 y 6; Q03 DOC-001.1–4, MEM-003.1, CAS-001.1–4. ISO/IEC/IEEE 29148:2018 proporciona el marco de ingeniería de requisitos; ISTQB contempla pruebas estáticas y análisis de la base de pruebas.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.iso.org\&sz=32)

Requirements engineering+1



**Propuesta provisional de requisito.** QAP deberá registrar y revisar elementos de la base de pruebas antes o durante el diseño, identificando:

- Identidad, revisión y procedencia.
- Criterios de aceptación disponibles.
- Ambigüedad, contradicción o información incompleta.
- Ausencia de magnitudes, límites, condiciones o testigos.
- Viabilidad de comprobación.
- Preguntas pendientes y resolución acreditada.
- Casos y obligaciones dependientes.

Estados conceptuales candidatos: verificable, ambiguo, incompleto, contradictorio, no verificable con los medios disponibles y pendiente de acreditación.

Estos estados no son veredictos de ejecución y no sustituyen AR-52.

**Criterios verificables de aceptación:**

1. Suministrar un documento sintético con cuatro requisitos: uno verificable, uno ambiguo, uno contradictorio y uno sin criterio medible.
2. Identificar cada condición con su localizador documental.
3. Generar casos elegibles para la parte verificable.
4. No inventar límites, reglas ni resultados esperados para los restantes.
5. Incorporar una aclaración autorizada como nueva revisión.
6. Demostrar qué casos quedaron habilitados, afectados o pendientes.

**Comportamiento negativo:** repetir una observación del AUT o introducir una sugerencia del HOST no resuelve automáticamente una ambigüedad normativa.

**Dependencias:** MEM, DOC, CAS, ORA; revisión humana de QA-02.

**Riesgo:** convertir la revisión documental en una aprobación humana obligatoria de todos los casos.

**Alternativas:** plantilla manual estructurada, análisis asistido por HOST o integración con un gestor de requisitos. Recomiendo una representación nativa mínima, con análisis asistido opcional.

**Naturaleza del cambio:** ampliación funcional que requiere ratificación; no exige modificar las DE existentes.

## **AC01-QA01-02 · Estrategia de pruebas por entrega**



Brecha nueva

&#x20;Esencial · Coste relativo medio



**Problema.** `CampaignPlan` y `ExecutionPlan` organizan el trabajo de ejecución, pero una estrategia profesional responde también a qué se pretende demostrar y qué cobertura se considera suficiente para una entrega determinada.

La estrategia debe existir incluso antes de tener los casos automatizados.

**Escenario profesional.** Una versión modifica el proceso de aprobación, una regla contable y la presentación de reportes. QA necesita decidir qué niveles probar, qué regresiones ejecutar, qué configuraciones cubrir y qué pruebas no resultan pertinentes.

**Actores:** QA Lead, Test Analyst, Product Owner y SDET.

**Evidencia:** Q03 PLN-001.1–6 y CAM-001.1–5; Q08 AR-05; Q09 AR-43. ISTQB CTAL-TM v3.0 trata la definición del enfoque de pruebas conforme al contexto, riesgos y estrategia organizativa.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://istqb.org\&sz=32)

istqb.org+1



**Propuesta.** Incorporar un artefacto estratégico versionado, candidato `TestStrategyRevision`, que pueda materializarse como entidad independiente o sección reutilizable de un modelo existente.

Debe representar:

| Dimensión       | Información necesaria                             |
| --------------- | ------------------------------------------------- |
| Objetivo        | Qué calidad o comportamiento se pretende evaluar  |
| Base            | Requisitos, cambios, reglas y riesgos aplicables  |
| Alcance         | Funciones, niveles, configuraciones y exclusiones |
| Enfoque         | Técnicas y modalidades seleccionadas              |
| Profundidad     | Cobertura esperada según riesgo                   |
| Restricciones   | Presupuesto, entorno, datos, recursos             |
| Entrada/salida  | Condiciones verificables                          |
| Responsabilidad | Actores y autoridad de decisiones                 |
| Evidencia       | Testigos y productos esperados                    |
| Entrega         | Versión o configuración objetivo                  |

Una estrategia puede alimentar varias campañas y planes sin duplicar sus casos.

**Aceptación propuesta:**

- Crear estrategias diferentes para una corrección urgente y una entrega mayor.
- Reutilizar casos idénticos, manteniendo sus identidades.
- Obtener selecciones y obligaciones distintas según riesgo y objetivos.
- Modificar la estrategia mediante nueva revisión, sin alterar campañas cerradas.
- Operar el flujo mediante entrada estructurada sin IA.

**Negativo:** una estrategia aprobada no concede permisos de ejecución ni sustituye la acreditación de aplicabilidad.

**Dependencias:** PLN, CAM, CAS, MEM, REP y QA-02.

**Alternativas:** ampliar `CampaignPlan` o establecer una estrategia reutilizable superior. Recomiendo preservar la separación semántica, sin exigir una entidad física adicional.

**Naturaleza:** ampliación de alcance.

## **AC01-QA01-03 · Gestión explícita de riesgos de calidad**



Precisión y ampliación

&#x20;Esencial · Coste relativo medio



**Problema.** La criticidad y la prioridad de ejecución no bastan para gestionar riesgos profesionales.

Un riesgo puede existir sin que haya todavía un caso capaz de comprobarlo.

**Escenario profesional.** Una aplicación permite cálculos financieros incorrectos bajo ciertas configuraciones regionales. Existe impacto potencial elevado, pero falta un testigo independiente para verificar los resultados.

El planificador no debe interpretar la falta de casos elegibles como ausencia de riesgo.

**Actores:** QA Lead, propietario funcional, especialista de dominio y Test Analyst.

**Evidencia:** PLN-001.3 ya exige criticidad, drift, defectos y presupuesto. AV-04 conserva obligaciones y testigos. CTAL-TM v3.0 desarrolla el enfoque basado en riesgos como parte de la dirección de pruebas.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://istqb.org\&sz=32)

istqb.org+1



**Propuesta.** Incorporar un registro versionado de riesgos con identidad, descripción, alcance, fuente, impacto, probabilidad o incertidumbre, prioridad, responsable, mitigaciones, obligaciones de prueba asociadas y riesgo residual.

Distinguir:

| Concepto                       | Ejemplo                                       |
| ------------------------------ | --------------------------------------------- |
| Riesgo de producto             | Cálculo incorrecto de intereses               |
| Riesgo del proyecto de pruebas | Entorno indisponible                          |
| Severidad de defecto           | Consecuencia observada de un fallo            |
| Prioridad de prueba            | Urgencia relativa de evaluarlo                |
| Riesgo residual                | Incertidumbre que permanece después de probar |

Los métodos de clasificación serán configurables, versionados y explicables. No debe imponerse una escala matemática universal.

**Aceptación:**

1. Registrar dos riesgos de distinta criticidad.
2. Vincular obligaciones de mitigación.
3. Introducir un bloqueo de oráculo en el riesgo crítico.
4. Mostrar que no se considera mitigado por no haberse ejecutado.
5. Registrar una decisión autorizada de tratamiento residual.
6. Preservar la evidencia y los resultados originales.

**Negativo:** cambiar la prioridad o aceptar un riesgo no transforma un FAIL en PASS.

**Dependencias:** PLN-001.3, REP, ORA, MEM, REG, QA-03.

**Riesgo:** falsa precisión derivada de puntuaciones inventadas por IA.

**Alternativas:** etiquetas de prioridad, matriz estructurada o integración externa. Recomiendo registro nativo ligero y escalas configurables.

**Naturaleza:** precisar PLN-001.3 y ratificar la ampliación de gestión explícita.

## **AC01-QA01-04 · Cobertura semántica de la base de pruebas**



Precisar contrato

&#x20;Esencial · Coste relativo medio-alto



**Problema.** AV-04 y AV-08 establecen garantías sólidas respecto a obligaciones declaradas, afirmaciones y denominadores. Sin embargo, debe distinguirse expresamente el universo de requisitos del AUT del universo de casos seleccionados por una campaña.

Es posible ejecutar correctamente todas las pruebas seleccionadas y dejar requisitos críticos sin ningún caso.

**Escenario profesional.** Una aplicación tiene veinte criterios de aceptación. QAP dispone de casos para quince, ejecuta diez y obtiene diez PASS acreditados.

Un reporte de «100 % de pruebas aprobadas» sería insuficiente como conclusión de calidad.

### **Ejemplo de cobertura**

Datos ilustrativos, no resultados de QAP.

Criterios conocidos

**20/20**

Criterios con diseño de prueba

**15/20**

Criterios seleccionados

**10/20**

Criterios acreditados como conformes

**10/20**

Éxito sobre lo ejecutado

# **100 %**

Conformidad acreditada del alcance

# **50 %**

**Actores:** QA Lead, propietario, auditor y Test Analyst.

**Evidencia:** Q09 §1 ya establece denominadores, clases, obligaciones y alcance. Q10 CV08-01–04 y Q11 CC08-01–02 regulan la aceptación del producto QAP. Azure Test Plans documenta suites relacionadas con requisitos para la trazabilidad.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://learn.microsoft.com\&sz=32)

Microsoft Learn+1



**Propuesta.** Establecer una matriz de cobertura bidireccional de la base de pruebas del AUT que permita consultar relaciones entre:

- Requisito y criterio de aceptación.
- Regla y revisión.
- Módulo, estado y transición.
- Perfil, configuración y entorno.
- Riesgo y condición de prueba.
- Caso, revisión y obligación.
- Intento, testigo y evidencia.

No todas las dimensiones deben cruzarse combinatoriamente en todas las campañas.

La cobertura deberá distinguir:

| Métrica                | Significado                                      |
| ---------------------- | ------------------------------------------------ |
| Cobertura de diseño    | Condiciones con pruebas diseñadas                |
| Cobertura planificada  | Condiciones seleccionadas                        |
| Cobertura de ejecución | Condiciones efectivamente evaluadas              |
| Cobertura acreditada   | Condiciones con evaluación válida                |
| Conformidad acreditada | Condiciones evaluadas con PASS válido            |
| Brecha de cobertura    | Condiciones pendientes, omitidas o no evaluables |

Un FAIL correctamente acreditado incrementa la cobertura de evaluación, pero no la conformidad.

**Aceptación:**

- Construir un universo sintético conocido de veinte criterios.
- Relacionar quince con casos y evaluar diez.
- Obtener denominadores separados y explicables.
- Introducir una condición genuinamente no aplicable y conservar su justificación.
- Evitar el doble conteo cuando varios casos cubren el mismo criterio.
- Consultar el corte histórico después de cambiar una regla o podar medios.
- Identificar explícitamente universos desconocidos o incompletos.

**Negativo:** eliminar un caso o excluir un requisito después de un fallo no puede mejorar retrospectivamente la cobertura histórica.

**Dependencias:** MEM-001.3, MEM-002.1, CAS, PLN, REP, AR-04/08/52/53 y QA-03.

**Alternativas:** relaciones sobre el grafo canónico o proyecciones materializadas. No recomiendo una base de datos adicional exclusivamente para cobertura.

**Naturaleza:** precisión contractual con ampliación de consumidores y métricas. No modificar los denominadores ratificados de DE-03.

## **AC01-QA01-05 · Biblioteca, suites y selecciones reutilizables**



Precisar contrato

&#x20;Esencial · Coste relativo bajo-medio



**Problema.** La existencia de casos versionados y selección de suites de regresión no define por completo cómo un profesional organiza una biblioteca reutilizable.

Una misma prueba puede pertenecer a diferentes selecciones sin que deba duplicarse.

**Escenario profesional.** El QA Senior crea un conjunto de pruebas de aprobación de contratos. Lo reutiliza para smoke, regresión, UAT y una entrega urgente, con configuraciones diferentes.

**Actores:** QA Senior, Executor, QA Lead y agente.

**Evidencia:** CAS-001.3–5, PLN-001.1, REG-001.1, CAM-001.5. Azure Test Plans dispone de suites estáticas, por requisito y por consulta; TestRail agrupa ejecuciones bajo planes con distintas configuraciones.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://learn.microsoft.com\&sz=32)

Microsoft Learn+1



**Propuesta.** Incorporar agrupaciones reutilizables con dos modalidades mínimas:

| Modalidad              | Comportamiento                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------- |
| Selección explícita    | Referencias versionadas a casos elegidos                                           |
| Selección por criterio | Consulta tipada por etiquetas, riesgo, módulos, requisitos o atributos autorizados |

Las consultas dinámicas deben resolverse y congelarse al generar un plan de ejecución.

No debe exigirse una jerarquía compleja de carpetas, suites anidadas, sets y subplanes si las necesidades se satisfacen con agrupaciones y referencias.

**Aceptación:**

1. Crear un caso y referenciarlo desde dos agrupaciones.
2. Generar planes por configuración sin duplicar identidad funcional.
3. Cambiar posteriormente la consulta.
4. Demostrar que el plan previo conserva su selección original.
5. Detectar revisiones obsoletas y referencias inexistentes.
6. Impedir la incorporación de casos pertenecientes a ámbitos no autorizados.

**Negativo:** importar una suite no concede autoridad para ejecutar sus casos.

**Dependencias:** CAS, PLN, MEM-003.4, REG, QA-02.

**Alternativas:** listas, etiquetas y consultas guardadas sobre el repositorio existente. Es preferible comenzar por este modelo sencillo.

**Naturaleza:** precisión de PLN/CAS/REG, con ampliación del uso humano.

## **AC01-QA01-06 · Diseño sistemático y obligaciones por técnica**



Precisión y ampliación

&#x20;Esencial acotada · Coste relativo medio-alto



**Problema.** Generar casos de una categoría no demuestra que una técnica se aplicó correctamente.

Por ejemplo, generar un caso etiquetado como BVA no acredita que se hayan probado las fronteras pertinentes de una regla.

QAP ya contempla positivos, negativos, límites, equivalencias y estados. No debe añadirse otro requisito redundante para esas categorías, sino precisar la representación de su cobertura y ampliar únicamente las técnicas faltantes.

ISTQB y la familia ISO/IEC/IEEE 29119 distinguen técnicas de diseño, mientras que NIST SP 800-142 proporciona fundamentos para reducir combinaciones mediante cobertura de interacciones.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://istqb.org\&sz=32)

istqb.org+3



**Escenario profesional.** Una regla financiera depende de monto, plazo, tipo de cliente y nivel de autorización. Los casos positivos y negativos simples pueden omitir combinaciones que producen errores.

**Actores:** Test Analyst, especialista funcional, QA Lead y SDET.

### **Tratamiento recomendado por técnica**

| Técnica                        | Situación                       | Tratamiento                   |
| ------------------------------ | ------------------------------- | ----------------------------- |
| Particiones de equivalencia    | Existente                       | Núcleo                        |
| Valores límite                 | Existente                       | Núcleo                        |
| Positivos y negativos          | Existente                       | Núcleo                        |
| Transiciones de estado         | Existente parcialmente definida | Núcleo                        |
| Tablas de decisión             | Ampliación                      | Representación nativa         |
| Combinatoria pairwise          | Ampliación                      | Capacidad opcional/integrable |
| Combinatoria de orden superior | Ampliación                      | Integración o posterior       |
| Error guessing                 | Exploración                     | Guía y plantilla              |
| Pruebas por checklist          | Ampliación menor                | Plantilla reutilizable        |
| Escenarios de negocio          | Existente                       | Núcleo                        |
| Cobertura de sentencias/ramas  | No esencial al núcleo           | Herramientas externas         |
| Mutation testing               | No esencial al núcleo           | Integración posterior         |

### **Ejemplo ilustrativo: particiones y límites**

Regla ficticia: se admiten montos desde 1,000 hasta 50,000 unidades monetarias, incluyendo ambos extremos.

La precisión de una unidad es un supuesto del ejemplo. En un AUT real debe proceder de la regla acreditada.

### **Ejemplo ilustrativo: tabla de decisión**

| Condición               | Regla 1 | Regla 2  | Regla 3 | Regla 4  |
| ----------------------- | ------- | -------- | ------- | -------- |
| Cliente activo          | Sí      | Sí       | Sí      | No       |
| Monto permitido         | Sí      | No       | Sí      | —        |
| Autorización suficiente | Sí      | —        | No      | —        |
| Resultado esperado      | Aprobar | Rechazar | Denegar | Rechazar |

Cada columna representa una condición de prueba susceptible de originar uno o varios casos.

**Propuesta de requisito.** QAP deberá permitir registrar la técnica, fuente, modelo de condiciones, unidades de cobertura, restricciones, exclusiones y expectativas de los casos derivados.

La generación puede proceder de un humano, del HOST, de un generador determinista o de una integración autorizada.

**Aceptación:**

- Obtener particiones y límites trazables a una regla tipada.
- Representar y cubrir una tabla de decisión con condiciones factibles.
- Registrar una transición válida y una transición prohibida.
- Identificar combinaciones incompatibles mediante restricciones acreditadas.
- Declarar combinaciones no probadas.
- Detectar una condición omitida sin declarar cobertura completa.
- Reutilizar los casos desde un plan sin IA.

**Negativos:**

- Una etiqueta BVA no acredita cobertura de límites.
- Una combinación generada no implica una expectativa acreditada.
- Una suite pairwise no acredita todas las combinaciones posibles.

**Dependencias:** CAS-001.2, AR-53, PLN, ORA, DAT y QA-06.

**Riesgos:** explosión combinatoria, expectativas inventadas, aumento innecesario del número de casos y presupuestos insostenibles.

**Alternativas:** representación nativa y generación manual, generador opcional o integración externa. Recomiendo incorporar al núcleo la semántica de cobertura, no necesariamente todos los algoritmos de generación.

## **AC01-QA01-07 · Exploración orientada por charters y sesiones**



Brecha nueva

&#x20;Esencial acotada · Coste relativo medio



**Problema.** Discovery y pruebas exploratorias profesionales no son equivalentes.

Discovery identifica elementos, estados y posibilidades de interacción. Una sesión exploratoria investiga riesgos, preguntas o comportamientos concretos y adapta su recorrido conforme aprende.

**Escenario profesional.** El QA necesita investigar qué ocurre cuando cambia el idioma durante una aprobación, se interrumpe la sesión y posteriormente se recupera el proceso.

No conoce todavía todos los casos necesarios.

**Actores:** QA Executor, Test Analyst, agente HOST y QA Lead.

**Evidencia:** CAM-001.5 contempla exploración e investigación preservando la campaña. No establece por sí mismo el contrato de charters, sesiones y conclusiones exploratorias. ISTQB reconoce técnicas basadas en experiencia, y Azure Test Plans documenta sesiones exploratorias vinculadas a elementos de trabajo.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://istqb.org\&sz=32)

istqb.org+2



**Propuesta.** Incorporar un charter versionado con objetivo, riesgos, preguntas, alcance, límites, presupuesto, estrategia y condiciones de parada.

Una sesión vinculada deberá preservar recorrido relevante, observaciones, decisiones, hallazgos, preguntas sin resolver, evidencia disponible y propuestas de casos reproducibles.

La sesión podrá ser manual, híbrida o asistida por HOST.

**Aceptación:**

1. Definir un charter con alcance y presupuesto.
2. Registrar dos observaciones y una hipótesis.
3. Reanudar desde un punto persistido.
4. Derivar un caso formal de un hallazgo.
5. Mantener la relación entre charter, sesión, observación y caso.
6. Conservar preguntas no resueltas al cerrar.

**Negativo:** una sesión completada no equivale a PASS del AUT ni acredita exhaustividad.

**Dependencias:** CAM-001.5, MEM-002.3–4, DIS, REP, QA-02 y QA-03.

**Riesgo:** exploración sin límites o acciones improvisadas fuera de autoridad.

**Alternativas:** subtipo de objetivo de campaña o artefacto específico vinculado a CAM. No recomiendo crear otro orquestador.

## **AC01-QA01-08 · Criterios de entrada, salida y control de pruebas**



Brecha nueva

&#x20;Esencial · Coste relativo medio



**Problema.** QAP tiene compuertas para certificar su propio producto y condiciones para ejecutar operaciones autorizadas. Esto no sustituye los criterios de entrada y salida de un proyecto de pruebas sobre el AUT.

Se necesitan criterios configurables para controlar una entrega empresarial concreta.

**Escenario profesional.** Una nueva versión todavía no dispone de perfiles de prueba, datos consistentes ni smoke satisfactorio. El QA Lead necesita declarar que la ejecución de una regresión completa debe esperar, aunque existan casos técnicamente ejecutables.

**Actores:** QA Lead, Executor, SDET y responsable del entorno.

**Evidencia:** PLN-001.6, CAM-001.2–3, AR-43 y AR-52 contienen mecanismos reutilizables. CTFL y CTAL-TM tratan planificación, seguimiento, control y finalización.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://istqb.org\&sz=32)

istqb.org+1



**Propuesta.** Permitir definir criterios verificables de entrada y salida con revisión, fuente, alcance, severidad y estado.

Ejemplos candidatos de entrada: identidad de versión, entorno operativo, datos, perfiles, smoke, dependencias y testabilidad mínima.

Ejemplos candidatos de salida: obligaciones acreditadas, riesgos críticos evaluados, defectos impeditivos, cobertura objetivo, limpieza y evidencia requerida.

Distinguir condiciones impeditivas, advertencias y criterios informativos.

**Aceptación:**

- Configurar una condición de entrada obligatoria.
- Provocar que falle.
- Bloquear únicamente las actividades que dependen de ella.
- Mantener diagnósticos independientes autorizados.
- Resolver el impedimento con evidencia.
- Evaluar criterios de salida y mostrar los incumplidos.

**Negativo:** modificar criterios de salida después de observar resultados crea una revisión explícita; no altera la evaluación histórica.

**Dependencias:** PLN, CAM, REP, ORA, AR-08/43/52.

**Riesgo:** confundir criterios de proyecto con permisos o transformar todas las campañas en procesos burocráticos.

**Alternativas:** predicados estructurados o plantillas parametrizadas. Recomiendo un mecanismo común de condiciones y evaluación de evidencia.

## **AC01-QA01-09 · Aceptación y decisión de entrega del AUT**



Brecha nueva

&#x20;Esencial · Coste relativo medio



**Problema.** La finalización de una campaña no constituye necesariamente una decisión de entrega.

Asimismo, las pruebas de aceptación pueden implicar a usuarios de negocio que no son quienes ejecutan las pruebas técnicas.

**Escenario profesional.** Un proyecto tiene regresión satisfactoria salvo un defecto de presentación de bajo impacto, mientras que una integración crítica permanece sin evaluar por indisponibilidad del entorno.

QAP debe informar esas condiciones sin afirmar que el producto está listo.

**Actores:** QA Lead, usuario de negocio, Product Owner, desarrollador y responsable de entrega.

**Evidencia:** DE-03 y DE-04 regulan la certificación y lanzamiento del propio QAP, no la autorización de entrega de cualquier AUT. ISTQB Acceptance Testing distingue pruebas de aceptación de usuario, contractuales y regulatorias, entre otras.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://istqb.org\&sz=32)

istqb.org



**Propuesta.** Incorporar una evaluación versionada de preparación para entrega, alimentada por los criterios de salida y la evidencia disponible.

Distinguir tres elementos:

| Elemento                            | Autoridad                           |
| ----------------------------------- | ----------------------------------- |
| Resultado acreditado de las pruebas | Núcleo QAP conforme a AR-52         |
| Recomendación de calidad            | Política configurada y/o QA Lead    |
| Decisión empresarial de entrega     | Responsable autorizado del producto |

Estados candidatos de recomendación: favorable, favorable con reservas, desfavorable o evidencia insuficiente.

No son nuevos veredictos canónicos.

La aceptación UAT deberá poder registrar criterios, identidad del actor, contexto, observación, evidencia y decisión declarada, distinguiendo el valor probatorio real de esa declaración.

**Aceptación:**

1. Crear una entrega con criterios obligatorios.
2. Acreditar la parte ejecutada.
3. Dejar una obligación crítica bloqueada.
4. Obtener una recomendación que exponga el incumplimiento.
5. Registrar una decisión empresarial autorizada, si procede.
6. Demostrar que dicha decisión no transforma el resultado canónico.
7. Recuperar posteriormente la decisión, criterios y evidencia disponible.

**Negativo:** una aprobación empresarial no puede eliminar un FAIL, conceder permisos o superar un veto vinculante de QAP.

**Dependencias:** riesgo, estrategia, cobertura, criterios de salida, REP, QA-02 y QA-03.

**Riesgo:** presentar una recomendación automática como certificación legal o comercial.

**Alternativas:** generar un informe de preparación o introducir una entidad de decisión vinculada. Recomiendo el registro mínimo explícito, sin automatizar el despliegue.

## **AC01-QA01-10 · Coordinación de niveles de prueba y resultados externos**



Integración

&#x20;Contrato esencial; conectores específicos opcionales



**Problema.** QAP no debe limitar conceptualmente la estrategia de QA a pruebas UI y API, pero tampoco necesita implementar nativamente todos los frameworks de pruebas.

**Escenario profesional.** Un desarrollador ya tiene 300 pruebas unitarias y 50 de integración. QAP ejecuta 20 flujos E2E y el negocio realiza UAT.

El QA Lead necesita conocer qué niveles aportan evidencia sobre determinados riesgos y requisitos.

**Actores:** SDET, desarrollador, QA Lead y Product Owner.

**Evidencia:** D13 preserva las pruebas unitarias legítimas; REQ-INT-001.4 contempla conectores; AR-52 reserva la acreditación canónica al núcleo. ISTQB distingue niveles y tipos de prueba.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://istqb.org\&sz=32)

istqb.org+1



**Propuesta.** Incorporar una taxonomía mínima de nivel y objeto de prueba que admita vincular resultados externos sin elevar automáticamente su autoridad.

| Nivel o actividad                | Responsabilidad recomendada de QAP   |
| -------------------------------- | ------------------------------------ |
| Unidad/componente                | Relacionar evidencia externa         |
| Integración de componentes       | Integrar o consumir resultados       |
| Contratos API                    | Capacidad nativa existente           |
| Integración entre sistemas       | Nativa o integrada según el caso     |
| Sistema                          | Capacidad funcional nativa           |
| E2E                              | Capacidad nativa obligatoria         |
| Aceptación/UAT                   | Diseño, gestión y registro           |
| Revisión estática de requisitos  | Soporte nativo de análisis           |
| Análisis estático de código      | Integración externa                  |
| Carga y seguridad especializadas | Integración; QA-05 determina alcance |

**Aceptación:**

- Importar o referenciar resultados sintéticos de pruebas externas.
- Vincularlos a versión, caso o condición y procedencia.
- Mostrar claramente qué resultados fueron ejecutados y acreditados por QAP y cuáles proceden de terceros.
- Rechazar un resultado externo alterado, incompatible o de alcance incorrecto cuando corresponda.
- Obtener el estado de cobertura sin sumar dos veces una misma obligación.

**Negativo:** un archivo JUnit con PASS no crea automáticamente un PASS funcional canónico de QAP.

**Dependencias:** INT-001.4, REP, MEM, AR-52 y QA-04.

**Alternativas:** importación manual estructurada, adaptadores de formatos e integración CI/CD. No exigir un conector comercial específico en el lanzamiento.

**Naturaleza:** contrato de interoperabilidad y ampliación acotada; no seleccionar frameworks.

## **AC01-QA01-11 · Priorización explicable y regresión conservadora**



Precisar contrato

&#x20;Esencial · Coste relativo medio



**Problema.** La selección de regresión por impacto ya existe como requisito. Debe impedirse que una señal de cambio incompleta se interprete como evidencia de ausencia de impacto.

**Escenario profesional.** Se modifica una regla de descuentos utilizada indirectamente por facturación y reportes. El cambio no altera las rutas ni los elementos visuales conocidos.

Un análisis basado exclusivamente en cambios DOM podría seleccionar una regresión insuficiente.

**Actores:** QA Lead, Test Analyst, SDET y agente.

**Evidencia:** REG-001.1, MEM-003.2, PLN-001.3; Q08 AR-46; AR-40. La implementación inspeccionada de `impact-analyzer.ts` trabaja sobre inventario suministrado y declara que su coherencia no está verificada.

**Propuesta.** Preservar el requisito existente y precisar que la selección considere cambios de reglas, documentación, contratos API, dependencias, configuración, estados, permisos, defectos anteriores y señales visuales cuando sean pertinentes.

La explicación deberá identificar razones de selección y de no selección, fuentes disponibles y ausentes, cobertura de riesgo, incertidumbre y estrategia conservadora.

**Aceptación:**

1. Sembrar cambios en una regla utilizada por dos módulos.
2. Seleccionar los casos directamente relacionados y los dependientes acreditados.
3. Retirar una señal de cambio.
4. Aplicar una selección conservadora o declarar la insuficiencia.
5. Preservar presupuesto y obligaciones no cubiertas.
6. Reproducir la selección con entradas y política equivalentes.

**Negativo:** una consulta Git fallida, un inventario incompleto o una API indisponible no equivalen a «sin cambios».

**Dependencias:** REG, MEM, PLN, AR-40/46, QA-04.

**Alternativas:** selección determinista cuando existe información suficiente; HOST opcional para proponer dependencias adicionales; ampliación manual por el QA.

**Naturaleza:** precisión de contrato existente. No contabilizar el motor de regresión como necesidad nueva.

## **AC01-QA01-12 · Dirección y diseño de QA sin inteligencia artificial**



Ampliación de alcance

&#x20;Esencial si se ratifica el producto de uso humano · Coste transversal medio-alto



**Problema.** DETERMINISTIC permite ejecutar revisiones congeladas sin razonamiento por paso. Eso no demuestra por sí mismo que un QA pueda gestionar y diseñar pruebas desde cero sin utilizar un modelo.

La independencia del proveedor de IA tampoco equivale a independencia operativa respecto de la IA.

**Escenario profesional.** Un QA Senior recibe requisitos, diseña casos, establece riesgos, prepara un set, lo entrega a otro QA y posteriormente obtiene los resultados. Ninguno dispone de una API de IA ni un agente MCP conectado.

**Actores:** QA Lead, Test Analyst, Executor y SDET.

**Evidencia:** Q01 §2 establece HOST y DETERMINISTIC, sin API de modelo adicional obligatoria. Q03 MEM-001.4 conserva ediciones manuales. AC-01 solicita investigar expresamente el uso humano independiente.

**Propuesta.** El ciclo de dirección y diseño deberá poder operar mediante entradas y consultas estructuradas en ausencia de un modelo.

Debe permitir crear, revisar y consultar estrategias, riesgos, requisitos, criterios, condiciones de prueba, casos, selecciones y planes; asimismo, utilizar capacidades deterministas existentes donde corresponda.

La generación inteligente automática de nuevas expectativas no será exigible sin un modelo o una fuente capaz de suministrarlas.

**Aceptación:**

1. Iniciar una instalación sin modelo configurado.
2. Crear un proyecto de pruebas mediante entrada humana estructurada.
3. Registrar requisitos y riesgos.
4. Diseñar y versionar casos.
5. Preparar una selección y un plan.
6. Ejecutar casos mediante modalidades disponibles y autorizadas.
7. Obtener cobertura y evaluación de salida.
8. Transferir el trabajo conservando procedencia.

Todo ello deberá poder realizarse sin llamadas obligatorias a un proveedor de IA.

**Negativos:**

- No realizar una conexión de IA silenciosa.
- No convertir observaciones manuales en atestados automáticos.
- No crear un escritor alterno.
- No debilitar autorización ni testigos para facilitar el trabajo manual.

**Dependencias:** QA-02 es responsable de concretar la operación humana, interfaz, permisos, ejecución guiada y handoff. QA-01 establece las capacidades estratégicas que deben resultar accesibles.

**Alternativas:**

| Alternativa                                          | Evaluación                                           |
| ---------------------------------------------------- | ---------------------------------------------------- |
| Solo ejecución de casos preparados por agentes       | Insuficiente para el objetivo de uso humano integral |
| Autoría humana estructurada mediante CLI/importación | Viable como base                                     |
| Superficie local de gestión autenticada              | Profesionalmente más accesible                       |
| Plataforma SaaS colaborativa                         | Innecesaria para la primera versión                  |

**Naturaleza:** decisión empresarial nueva y explícita. No introducir MANAGED ni un tercer proveedor de inteligencia.

# **8. Modelo conceptual recomendado**

## **8.1. Relaciones entre artefactos profesionales y modelos existentes**

La ampliación no debe materializarse automáticamente en nuevas bases de datos, servicios o entidades persistentes para cada concepto profesional.

Debe comenzar por definir identidad, responsabilidades y relaciones.

Conceptos existentes o derivados

Ampliaciones o precisiones propuestas

El diagrama representa relaciones lógicas candidatas, no una arquitectura física ni un flujo obligatorio para todas las operaciones.

## **8.2. Diccionario conceptual**

| Concepto               | Responsabilidad                                         |
| ---------------------- | ------------------------------------------------------- |
| Requisito              | Expectativa de producto identificada y versionada       |
| Criterio de aceptación | Condición que permite evaluar el requisito              |
| Regla                  | Expectativa normativa acreditada de negocio             |
| Riesgo                 | Posibilidad de daño, fallo o incertidumbre relevante    |
| Condición de prueba    | Aspecto específico que debe comprobarse                 |
| Escenario              | Contexto funcional o recorrido significativo            |
| Caso                   | Especificación de una prueba con identidad funcional    |
| Revisión de caso       | Realización concreta de la intención del caso           |
| Paso                   | Acción, observación o comprobación dentro de una prueba |
| Obligación             | Afirmación o condición exigible conforme al contrato    |
| Suite/set              | Agrupación reutilizable de casos                        |
| Estrategia             | Enfoque, objetivos, riesgos y criterios                 |
| `CampaignPlan`         | Planificación del objetivo de campaña                   |
| `ExecutionPlan`        | Selección y ejecución congeladas                        |
| `DataPlan`             | Datos, preparación y obligaciones de cleanup            |
| Ciclo                  | Agrupación de trabajo por entrega o iteración           |
| Campaña                | Unidad operativa continua de trabajo                    |
| Intento                | Ejecución concreta y trazable                           |
| Evidencia              | Observación, testigo o artefacto disponible             |
| Defecto                | Hallazgo clasificado con evidencia y causalidad         |
| Retest                 | Evaluación posterior vinculada a una corrección         |
| Evaluación de entrega  | Valoración de criterios y riesgo residual               |

## **8.3. Conceptos que no requieren necesariamente entidades independientes**

**Escenario:** puede representarse mediante una intención de caso, agrupación o flujo, según su identidad y reutilización.

**Suite y set:** no necesitan ser dos tipos distintos si ambos representan selecciones reutilizables.

**Ciclo y campaña:** un ciclo debe poder agrupar trabajo de una entrega cuando resulte necesario, pero no requiere otro motor de ejecución.

**Estrategia y plan:** su distinción semántica es importante, aunque puedan compartir estructuras y almacenamiento.

**Condición de prueba:** puede representarse mediante una relación versionada entre requisitos, reglas y obligaciones. Solo necesita entidad independiente si el análisis de consumidores demuestra una identidad y ciclo de vida propios.

La decisión deberá basarse en invariantes y necesidades de consulta, no en reproducir terminología de herramientas comerciales.

# **9. Estrategias de selección según el objetivo de las pruebas**

Una necesidad profesional importante consiste en seleccionar diferentes profundidades de evaluación sin duplicar la biblioteca.

| Tipo de trabajo      | Propósito                     | Selección recomendada                    |
| -------------------- | ----------------------------- | ---------------------------------------- |
| Smoke                | Determinar estabilidad básica | Flujos y dependencias esenciales         |
| Sanity               | Comprobar un cambio acotado   | Funciones modificadas y cercanas         |
| Retest               | Verificar una corrección      | Reproducción y obligación afectada       |
| Regresión            | Detectar efectos adversos     | Casos seleccionados por impacto y riesgo |
| Exploración          | Investigar incertidumbre      | Charters y sesiones                      |
| E2E                  | Evaluar flujo integrado       | Estados, roles, datos y efectos          |
| UAT                  | Evaluar aceptación de negocio | Escenarios y criterios funcionales       |
| Seguridad funcional  | Evaluar controles y efectos   | Roles, permisos, aislamiento y negativos |
| Accesibilidad        | Evaluar interacción accesible | Política ratificada DE-05                |
| Certificación de QAP | Acreditar el propio producto  | AV-08 y compuertas vinculantes           |

Las denominaciones smoke y sanity deben admitir convenciones configurables. No constituyen por sí solas una política universal de cobertura.

## **9.1. Ejemplo de selección por estrategia**

### **Biblioteca reutilizable de ejemplo**

SmokeSanityRegresiónUAT

Casos seleccionados

# **4 de 12**

33 % de la biblioteca

Inicio de sesión

TC-001

Carga de módulos

TC-002

Alta de cliente

TC-003

Aprobación

TC-004

Límite inferior

TC-005

Límite superior

TC-006

Generación de contrato

TC-007

RBAC negativo

TC-008

Reporte financiero

TC-009

Cambio de idioma

TC-010

Recuperación

TC-011

Cierre del flujo

TC-012

Simulación conceptual. El porcentaje corresponde a casos seleccionados, no a cobertura normativa, funcional ni acreditada.

Este modelo evita crear copias de los casos por cada modalidad de trabajo y permite conservar criterios, selección y revisión histórica.

# **10. Responsabilidades y autoridad de decisión**

## **10.1. Matriz conceptual**

| Actividad                    | QA Lead            | Analista QA        | Executor           | SDET               | Propietario            | QAP               |
| ---------------------------- | ------------------ | ------------------ | ------------------ | ------------------ | ---------------------- | ----------------- |
| Definir objetivos de calidad | Dirige             | Participa          | —                  | Participa          | Ratifica               | Registra          |
| Identificar riesgos          | Dirige             | Analiza            | Aporta             | Aporta             | Acepta riesgos propios | Propone/registra  |
| Diseñar casos                | Supervisa          | Diseña             | Puede diseñar      | Automatiza         | —                      | Propone/valida    |
| Autorizar operaciones        | Según autoridad    | —                  | Según autoridad    | Según autoridad    | Según autoridad        | Verifica          |
| Ejecutar pruebas             | Puede              | Puede              | Ejecuta            | Ejecuta            | Puede participar       | Ejecuta           |
| Acreditar resultado canónico | No unilateralmente | No unilateralmente | No unilateralmente | No unilateralmente | No unilateralmente     | Evalúa            |
| Recomendar entrega           | Responsable        | Aporta             | Aporta             | Aporta             | Consulta               | Evalúa criterios  |
| Autorizar entrega            | Recomienda         | —                  | —                  | —                  | Responsable autorizado | Registra decisión |

Esta tabla representa responsabilidades profesionales, no una concesión de autoridad técnica.

## **10.2. Preservación de la autonomía**

Una revisión humana opcional puede mejorar la calidad del diseño, pero no debe convertirse en una barrera rutinaria de ejecución.

QAP debe conservar las cuatro decisiones independientes definidas en AV-04 §7:

1. Permiso y admisión.
2. Aplicabilidad contextual.
3. Oráculo autorizado.
4. Acreditación obtenida.

Una nueva entidad de estrategia, riesgo, requisito o suite no podrá modificar esa separación.

**La dirección humana de QA y la autonomía de QAP son compatibles.** La primera establece objetivos, políticas y expectativas; la segunda actúa dentro de las condiciones acreditadas.

# **11. Evaluación independiente de las hipótesis del Orquestador**

| Hipótesis AC-01                                     | Dictamen               | Fundamento                                                                                 |
| --------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------ |
| QAP debe servir al trabajo diario del QA humano     | Favorable              | Resuelve necesidades no cubiertas exclusivamente por la ejecución autónoma                 |
| Operación con cero modelos conectados               | Favorable              | Requiere diseño estructurado, no otro proveedor de IA                                      |
| Introducir cinco dominios lógicos de memoria        | Favorable condicionado | Útil como separación conceptual; insuficiente por sí sola para cubrir estrategia y riesgos |
| Memoria reproductiva especializada                  | Favorable condicionado | Debe complementar, no duplicar, casos e intentos                                           |
| Biblioteca reutilizable de pruebas                  | Favorable              | Aprovecha CAS, MEM y REG                                                                   |
| Incorporar planes, suites, sets y ciclos            | Favorable condicionado | Evitar entidades redundantes y duplicación de orquestadores                                |
| Interfaz local para trabajo humano                  | Favorable              | Necesidad de ergonomía; su contrato corresponde a QA-02                                    |
| Reportes parametrizados                             | Favorable              | Necesarios para evaluación de cobertura y entrega                                          |
| Ampliar indiscriminadamente técnicas de pruebas     | Desfavorable           | La semántica de cobertura es más importante que implementar todos los generadores          |
| Implementar nativamente todos los niveles de prueba | Desfavorable           | Duplicaría herramientas especializadas sin beneficio proporcional                          |
| Colaboración centralizada obligatoria               | Desfavorable para v1   | Incompatible con la necesidad de mantener un alcance local razonable                       |
| Aprobar manualmente todos los casos                 | Desfavorable           | Contradice CAS-001.1 y AV-03                                                               |

## **11.1. Observación sobre los cinco dominios lógicos de memoria**

La hipótesis de conocimiento, biblioteca de pruebas, ejecuciones, defectos/reproducción y reportes es útil, pero no debe tratarse como una taxonomía exhaustiva.

Los riesgos, estrategias, criterios de entrega y decisiones profesionales necesitan identidad, procedencia y consulta.

Eso no significa que deba añadirse una sexta base de datos denominada «memoria estratégica».

El Orquestador puede evaluar:

| Alternativa                                       | Ventaja                            | Riesgo                                                 |
| ------------------------------------------------- | ---------------------------------- | ------------------------------------------------------ |
| Integrarlos dentro del conocimiento               | Reutiliza procedencia y revisiones | Mezclar reglas acreditadas con decisiones estratégicas |
| Integrarlos dentro de planificación               | Cercanía con campañas y objetivos  | Dificultar reutilización histórica                     |
| Dominio lógico transversal de gobierno de pruebas | Responsabilidades claras           | Incremento de contratos                                |
| Proyecciones derivadas                            | Menor duplicación                  | Dependencia de hechos originales y su conservación     |

No selecciono una alternativa física definitiva. El requisito es preservar la semántica y la trazabilidad de las decisiones.

# **12. Escenarios profesionales de falsación documental**

Los escenarios siguientes constituyen criterios de aceptación candidatos examinados en papel. **Ninguno fue ejecutado.**

## **EP-QA01-01 · Requisito nuevo sin IA**

**Situación:** el QA Senior recibe una regla de límites y condiciones de autorización.

**Recorrido esperado:** registra fuente, identifica particiones, diseña casos, establece cobertura, prepara una selección y entrega el trabajo al Executor.

**Resultado exigido:** diseño íntegramente recuperable, versionado y trazable sin conexión a un modelo.

**Falsación:** QAP exige llamar a un HOST para crear un caso, modificar un riesgo o producir la selección.

**Hallazgos relacionados:** 01, 05, 06, 12.

## **EP-QA01-02 · Entrega urgente**

**Situación:** una corrección afecta una regla utilizada indirectamente por varios módulos.

**Recorrido esperado:** identificar impacto, seleccionar retest, aplicar regresión proporcional, preservar exclusiones e incertidumbres.

**Resultado exigido:** selección justificada y obligaciones no cubiertas visibles.

**Falsación:** QAP declara ausencia de impacto por falta de cambios visuales.

**Hallazgos:** 02, 03, 04, 11.

## **EP-QA01-03 · Campaña autónoma**

**Situación:** requisitos acreditados, entorno autorizado y expectativas suficientes.

**Recorrido esperado:** Discovery, diseño, planificación, ejecución, evidencia y evaluación de salida sin aprobaciones ordinarias por caso.

**Resultado exigido:** todas las condiciones de autoridad y AR-52 preservadas.

**Falsación:** la ampliación estratégica introduce una aprobación humana obligatoria antes de cada caso.

**Hallazgos:** 02, 06, 08.

## **EP-QA01-04 · Todos los casos ejecutados pasan, pero falta cobertura**

**Situación:** las pruebas seleccionadas cumplen sus expectativas, aunque existen criterios críticos sin evaluar.

**Resultado exigido:** conservar los PASS acreditados y declarar la cobertura incompleta.

**Falsación:** la recomendación de entrega se basa únicamente en el porcentaje de PASS.

**Hallazgos:** 03, 04, 08, 09.

## **EP-QA01-05 · Exploración híbrida**

**Situación:** un QA inicia una investigación manual de comportamiento intermitente y la transfiere a un agente.

**Resultado exigido:** el agente recupera objetivo, observaciones, incertidumbres, estado y alcance; propone casos reproducibles sin convertir hipótesis en hechos.

**Falsación:** el agente comienza desde cero, duplica hallazgos o ejecuta efectos fuera de autoridad.

**Hallazgos:** 07, 12.

## **EP-QA01-06 · Consulta histórica tras poda**

**Situación:** meses después se necesita revisar por qué una versión recibió una recomendación desfavorable.

**Resultado exigido:** recuperar estrategia, criterios, riesgos, resumen, decisión y estado de evidencia conservada, conforme a la política aplicable.

**Falsación:** cambiar el criterio actual modifica retrospectivamente la conclusión histórica, o QAP presenta evidencia eliminada como disponible.

**Hallazgos:** 03, 04, 09; dependencia QA-03.

## **EP-QA01-07 · Aceptación empresarial con riesgo residual**

**Situación:** el propietario decide entregar el AUT con un defecto conocido y dentro de su autoridad empresarial.

**Resultado exigido:** registrar la decisión, justificación y riesgo residual, manteniendo intacto el FAIL original y cualquier veto aplicable.

**Falsación:** el acto empresarial convierte automáticamente el resultado de la prueba en PASS.

**Hallazgos:** 08, 09.

## **EP-QA01-08 · Resultados externos**

**Situación:** se reciben resultados de pruebas unitarias y de integración de una versión determinada.

**Resultado exigido:** procedencia y alcance visibles, relación con requisitos cuando esté acreditada y separación de los veredictos canónicos.

**Falsación:** importar resultados externos genera acreditación funcional sin testigos ni verificación suficiente.

**Hallazgo:** 10.

# **13. Impacto sobre los contratos existentes**

## **13.1. Matriz de impacto**

| Familia | Impacto propuesto                                | Hallazgos         |
| ------- | ------------------------------------------------ | ----------------- |
| MEM     | Identidad, revisión y trazabilidad de decisiones | 01–05, 07, 09     |
| DOC     | Revisión de testabilidad                         | 01                |
| PLN     | Estrategia, selección, riesgos y criterios       | 02–06, 08, 11     |
| CAS     | Condiciones, técnicas y biblioteca               | 01, 04–06         |
| ORA     | Preservar fuentes y expectativas acreditadas     | 01, 06, 10        |
| CAM     | Sesiones exploratorias y control de alcance      | 02, 07, 08        |
| REP     | Cobertura, riesgo residual y entrega             | 03, 04, 08–10     |
| REG     | Selección conservadora explicable                | 11                |
| SEG     | Autoridad de actores, revisión y acceso          | 01–12 transversal |
| INT     | Consumo de resultados externos                   | 10                |
| IA/AGT  | Propuestas opcionales y operación sin modelo     | 12                |

## **13.2. Impacto sobre AV-01–08**

| Garantía existente | Condición de preservación                                                   |
| ------------------ | --------------------------------------------------------------------------- |
| AR-04              | Todas las nuevas entidades sensibles respetan identidad, alcance y revisión |
| AR-05              | No introducir aprobaciones rutinarias                                       |
| AR-08/52           | No modificar los cuatro ejes ni los seis veredictos                         |
| AR-09              | Ninguna declaración sustituye testigos requeridos                           |
| AR-25              | Historial conforme a DE-01                                                  |
| AR-27              | Charters y sesiones no eluden custodia                                      |
| AR-28              | Ninguna interfaz crea una vía alternativa de acreditación                   |
| AR-40              | Selección por cambio mantiene el tratamiento seguro de Git                  |
| AR-41              | Ningún artefacto nuevo habilita corte o migración                           |
| AR-43              | Suites y estrategia no duplican el DAG operativo                            |
| AR-46              | Edición manual protegida y revisión conservadora                            |
| AR-53              | Aplicabilidad, permiso, expectativa y acreditación independientes           |
| AR-06/44           | Nuevos criterios no alteran denominadores históricos ni vetos               |

## **13.3. Retención y memoria**

No recomiendo modificar DE-01.

Los artefactos estratégicos vigentes deben tratarse como activos de conocimiento y gestión, no como archivos multimedia ni como detalle efímero de una ejecución.

Para las versiones históricas habrá que definir qué información compacta debe conservarse, con qué fundamento, procedencia y restricciones de datos.

Debe distinguirse:

- Estrategia vigente y revisiones conservadas.
- Resumen histórico de decisiones.
- Detalle de intentos sujeto a 90 días.
- Evidencia pesada sujeta a su TTL y grants.
- Material protegido por necesidades probatorias autorizadas.
- Archivos exportados y sus propias condiciones de custodia.

La definición exacta corresponde conjuntamente a QA-03 y al Orquestador. No se propone una conservación indefinida indiscriminada del detalle.

## **13.4. Interfaces y escritura**

Cualquier interfaz de gestión o autoría humana deberá consumir los mismos casos de uso canónicos que las restantes superficies.

El visor de solo lectura existente no debe adquirir escritura por conveniencia.

Una superficie adicional de edición requerirá autenticación, autorización, validación de revisiones y delegación al escritor común.

## **13.5. Revalidación focalizada**

Si se ratifican las propuestas, deberá actualizarse el manifiesto con subobligaciones, consumidores y celdas adicionales según CC08-01.

Será necesario determinar qué garantías previamente aceptadas resultan afectadas por los cambios.

No recomiendo una novena auditoría general automática ni modificar ahora la secuencia de compuertas. La contravalidación deberá concentrarse en los deltas ratificados.

# **14. Dependencias con las restantes especialidades**

| Especialidad | Dependencia de QA-01                                                     |
| ------------ | ------------------------------------------------------------------------ |
| QA-02        | Autoría estructurada, ejecución manual, identidad del actor y handoff    |
| QA-03        | Métricas, consultas, históricos, riesgo residual y evaluación de entrega |
| QA-04        | Automatización de casos, niveles de prueba, CI y evidencia externa       |
| QA-05        | Riesgos y cobertura por características no funcionales                   |
| QA-06        | Reglas empresariales, modelos de decisión, límites y datos de prueba     |

QA-01 no resuelve por cuenta propia los motores de rendimiento, seguridad especializada, mecanismos de exportación, estructuras detalladas de reproducción ni procesamiento avanzado de datos.

Su responsabilidad es garantizar que esas capacidades puedan incorporarse a una estrategia coherente y relacionarse con riesgos, condiciones, criterios y evidencia.

# **15. Capacidades recomendadas por alcance**

## **15.1. Esenciales para el primer lanzamiento**

Revisión de requisitos y testabilidad

Estrategia de pruebas por versión y objetivo

Registro ligero de riesgos

Trazabilidad y cobertura semántica

Biblioteca y selecciones reutilizables

Diseño de pruebas mediante técnicas fundamentales

Tablas de decisión y condiciones explícitas

Charters y sesiones exploratorias básicas

Criterios de entrada y salida

Evaluación de preparación para entrega

Priorización y regresión explicables

Dirección y diseño de QA sin IA

Estas capacidades se recomiendan como alcance mínimo profesional si el propietario ratifica que QAP debe servir tanto para la ejecución autónoma como para el trabajo habitual del QA humano.

## **15.2. Opcionales**

| Capacidad                              | Justificación                                           |
| -------------------------------------- | ------------------------------------------------------- |
| Generación automática de pairwise      | Útil para dominios configurables, no necesaria en todos |
| Plantillas sectoriales                 | Aceleran diseño sin alterar el núcleo                   |
| Estimación basada en históricos        | Depende de datos representativos                        |
| Estrategias organizativas avanzadas    | Pueden comenzar con plantillas reutilizables            |
| Visualización avanzada de dependencias | Mejora ergonomía, no la semántica esencial              |

## **15.3. Integraciones externas**

| Capacidad                                | Motivo                                         |
| ---------------------------------------- | ---------------------------------------------- |
| Gestores de requisitos                   | Evitar doble mantenimiento                     |
| Issue trackers                           | Colaboración con desarrollo                    |
| Frameworks unitarios                     | Herramientas existentes especializadas         |
| Herramientas de cobertura de código      | No confundir con cobertura de requisitos       |
| Generadores combinatorios especializados | Evitar reconstruir algoritmos innecesariamente |
| Pipelines CI/CD                          | Consumir resultados y estados autorizados      |
| Herramientas de análisis estático        | Aprovechar capacidades especializadas          |

La posibilidad de integración no implica que todos los conectores deban entregarse en v1.

## **15.4. Posteriores**

Gestión concurrente centralizada, planificación multiproyecto organizativa avanzada, gestión de competencias, análisis predictivo, optimización estadística sofisticada y programas de mejora continua organizativa.

Estas necesidades pueden ser legítimas para una plataforma madura, pero no justifican introducir una arquitectura distribuida obligatoria en esta etapa.

## **15.5. Fuera de alcance recomendado**

| Capacidad                                   | Razón                                             |
| ------------------------------------------- | ------------------------------------------------- |
| Gestión integral de proyectos de desarrollo | QAP no necesita sustituir Jira o equivalentes     |
| Gestión de recursos humanos                 | No es una capacidad central de QA                 |
| Facturación y gestión comercial             | Ajena al propósito                                |
| Despliegue autónomo del AUT                 | Responsabilidad y autoridad diferentes            |
| Certificación regulatoria universal         | Requiere procesos y actores específicos           |
| Motor universal de pruebas unitarias        | Duplica herramientas existentes                   |
| Generación ilimitada de pruebas             | Incompatible con control de recursos y relevancia |
| Aprobación empresarial por IA               | No acredita autoridad del propietario             |

# **16. Contraste con herramientas existentes**

## **16.1. Azure Test Plans**

[什么是 Azure Test Plans？ 手动、探索和自动测试工具。 - Azure Test Plans | Microsoft Learn](https://images.openai.com/static-rsc-4/VcLDlo8yk6A9-XF2obsZ69GRm8OkkqtRmcT-5O_jiiBD-K8T5UFoxh98BjikuYrNVnAeo9eSeAVs3u-k1ZZv-4EJ3FwSA1rOBwVtY1FHIF4bk_FlWU8gcVs6dq-2gLSCJRtDogcp6pHtDwVWiWE6gZvJG3sFJROK69ZmjFS6_OA?purpose=inline)

**Capacidades profesionales documentadas**

Planes, suites, casos manuales y automatizados, trazabilidad por requisitos, configuraciones y sesiones exploratorias.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://learn.microsoft.com\&sz=32)

Microsoft Learn+2



Referencia: [Documentación oficial](https://learn.microsoft.com/en-us/azure/devops/test/overview?view=azure-devops\&utm_source=chatgpt.com)

**Lección para QAP:** la organización de casos y la trazabilidad constituyen capacidades profesionales independientes de que exista automatización inteligente.

No recomiendo replicar toda la plataforma Azure DevOps.

## **16.2. TestRail**

[Best Practices Guide: Test Runs and Results – TestRail Support Center](https://images.openai.com/static-rsc-4/HNTvSZxmk_6mVweGFz4HW06g292QM9LjQ_0i981hUZxrmE3AhuEJzpgku24Y2DisZcsN6SMxkZ3fHY1nBk-BRP9oS32IAb8J0at93IlyT9yWT87BMd8eVWOJfXt_9dp4UxmLBMtw2snQfqKO3Yev41xdc5p-td9FBnt5ayMehEQ?purpose=inline)

**Capacidades profesionales documentadas**

Agrupación de ejecuciones mediante planes, configuraciones diferenciadas y asociación con hitos.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://support.testrail.com\&sz=32)

TestRail Support Center+1



Referencia: [Documentación oficial](https://support.testrail.com/hc/en-us/articles/30765296499604-Create-new-test-plans?utm_source=chatgpt.com)

**Lección para QAP:** un caso reutilizable puede participar en diferentes configuraciones y entregas sin perder su identidad.

No recomiendo imponer un producto externo de pago ni copiar su modelo de almacenamiento.

## **16.3. NIST y las pruebas combinatorias**

NIST SP 800-142 describe métodos de pruebas combinatorias y herramientas asociadas. Permite fundamentar la reducción de combinaciones y la definición de cobertura de interacciones.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://csrc.nist.gov\&sz=32)

csrc.nist.gov



**Lección para QAP:** debe distinguir entre la capacidad de representar combinaciones relevantes y la necesidad de construir un generador especializado.

## **16.4. Posicionamiento recomendado**

| Enfoque                  | Ejecución autónoma         | Gestión de pruebas | Dirección estratégica |
| ------------------------ | -------------------------- | ------------------ | --------------------- |
| Solo runner              | Alta potencial             | Limitada           | Limitada              |
| Solo gestor de pruebas   | Dependiente de integración | Alta               | Variable              |
| QAP con alcance ampliado | Obligatoria                | Nativa acotada     | Nativa acotada        |

Esta tabla compara modelos conceptuales de producto, no constituye una medición de prestaciones de herramientas comerciales.

QAP puede diferenciarse combinando autonomía, conocimiento persistente, trazabilidad, ejecución determinista y garantías de autoridad con capacidades profesionales de gestión.

No debe intentar diferenciarse únicamente por acumular funciones.

# **17. Decisiones empresariales que deben elevarse al propietario**

Recomiendo agrupar las propuestas en cuatro decisiones reales, evitando solicitar aprobaciones independientes para detalles menores de implementación.

## **DEC-AC01-QA01-A · Posicionamiento del producto**

¿Debe QAP ser exclusivamente una herramienta autónoma para agentes o también una plataforma local de trabajo diario del profesional QA?

| Alternativa     | Consecuencia                                                    |
| --------------- | --------------------------------------------------------------- |
| A               | Mantener alcance centrado en autonomía y ejecución              |
| B — Recomendada | Incorporar dirección, diseño, gestión y operación humana sin IA |
| C               | Incorporar además colaboración empresarial centralizada         |

Recomiendo B. Resuelve necesidades profesionales materiales sin exigir SaaS ni abandonar la arquitectura local.

## **DEC-AC01-QA01-B · Profundidad de la estrategia profesional**

| Alternativa     | Consecuencia                                                       |
| --------------- | ------------------------------------------------------------------ |
| A               | Riesgo y prioridad integrados únicamente en el planner             |
| B — Recomendada | Estrategia versionada, riesgos, criterios y cobertura consultables |
| C               | Plataforma integral de gobierno organizativo de calidad            |

Recomiendo B. La alternativa A limita la capacidad de dirigir entregas; C introduce complejidad innecesaria.

## **DEC-AC01-QA01-C · Gestión de aceptación y entrega**

| Alternativa     | Consecuencia                                                         |
| --------------- | -------------------------------------------------------------------- |
| A               | Reportar exclusivamente resultados de pruebas                        |
| B — Recomendada | Evaluar preparación y registrar decisiones empresariales autorizadas |
| C               | Autorizar y ejecutar automáticamente despliegues                     |

Recomiendo B. Preserva la separación entre evidencia, recomendación y autoridad empresarial.

## **DEC-AC01-QA01-D · Técnicas e interoperabilidad**

| Alternativa     | Consecuencia                                                        |
| --------------- | ------------------------------------------------------------------- |
| A               | Limitarse a las técnicas existentes                                 |
| B — Recomendada | Ampliar la semántica fundamental e integrar técnicas especializadas |
| C               | Implementar internamente todos los motores y generadores            |

Recomiendo B. Permite cobertura profesional amplia con un coste proporcionado.

Ninguna de estas decisiones exige por sí misma alterar DE-01–05. Sí modifica potencialmente el alcance que deberá certificarse en el lanzamiento.

# **18. Evaluación del impacto sobre alcance y esfuerzo**

No se dispone de una base de estimación suficiente para asignar duraciones, sprints o costes monetarios.

La valoración siguiente es exclusivamente relativa y considera complejidad contractual y dependencias.

| Área                        | Impacto relativo | Principal complejidad                   |
| --------------------------- | ---------------- | --------------------------------------- |
| Revisión de requisitos      | Medio            | Fuentes, testabilidad y resolución      |
| Estrategia                  | Medio            | Identidad y reutilización               |
| Riesgos                     | Medio            | Relaciones, tratamiento y trazabilidad  |
| Cobertura                   | Medio-alto       | Universos, denominadores e historial    |
| Biblioteca y suites         | Bajo-medio       | Referencias y congelamiento             |
| Técnicas de diseño          | Medio-alto       | Restricciones, expectativas y cobertura |
| Exploración                 | Medio            | Continuidad y formalización             |
| Criterios de entrada/salida | Medio            | Condiciones y evaluación                |
| Aceptación y entrega        | Medio            | Autoridad y separación semántica        |
| Integraciones externas      | Variable         | Contratos y formatos                    |
| Regresión explicable        | Medio            | Dependencias y calidad de señales       |
| Operación sin IA            | Medio-alto       | Consumidores y superficie de autoría    |

La mayor complejidad no proviene necesariamente de crear nuevas entidades, sino de mantener coherentes la trazabilidad, el versionado, la autorización y la evidencia a través de todas las superficies.

Por ello, incorporar estas capacidades antes de seleccionar tecnologías tiene una ventaja: permite diseñarlas conjuntamente con el núcleo que ya deberá reconstruirse, evitando consolidar limitaciones conceptuales en la implementación.

# **19. Fuentes primarias externas**

Fuentes consultadas el 25 de noviembre de 2026. Las normas ISO se utilizaron conforme a sus descripciones y materiales públicos accesibles, sin atribuir requisitos específicos a texto normativo de pago no examinado.

| Ref. | Fuente y versión                               | Enlace oficial                                                                                                                                       |
| ---- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| F01  | ISTQB Certified Tester Foundation Level v4.0.1 | [CTFL](https://istqb.org/certifications/certified-tester-foundation-level-ctfl-v4-0/?utm_source=chatgpt.com)                                         |
| F02  | ISTQB Advanced Level Test Management v3.0      | [CTAL-TM](https://istqb.org/certifications/certified-tester-advanced-level-test-management-ctal-tm-v3-0/?utm_source=chatgpt.com)                     |
| F03  | ISTQB Advanced Level Test Analyst v4.0         | [CTAL-TA](https://istqb.org/certifications/certified-tester-advanced-level-test-analyst/?utm_source=chatgpt.com)                                     |
| F04  | ISTQB Acceptance Testing                       | [CT-AcT](https://istqb.org/certifications/certified-tester-acceptance-testing/?utm_source=chatgpt.com)                                               |
| F05  | ISO/IEC/IEEE 29119-2:2021                      | [Test processes](https://www.iso.org/standard/79428.html?utm_source=chatgpt.com)                                                                     |
| F06  | ISO/IEC/IEEE 29119-3:2021                      | [Test documentation](https://www.iso.org/standard/79429.html?utm_source=chatgpt.com)                                                                 |
| F07  | ISO/IEC/IEEE 29119-4:2021                      | [Test techniques](https://www.iso.org/standard/79430.html?utm_source=chatgpt.com)                                                                    |
| F08  | ISO/IEC/IEEE 29148:2018                        | [Requirements engineering](https://www.iso.org/standard/72089.html?utm_source=chatgpt.com)                                                           |
| F09  | NIST SP 800-142, 2010                          | [Practical Combinatorial Testing](https://csrc.nist.gov/pubs/sp/800/142/final?utm_source=chatgpt.com)                                                |
| F10a | Microsoft Azure Test Plans                     | [Overview](https://learn.microsoft.com/en-us/azure/devops/test/overview?view=azure-devops\&utm_source=chatgpt.com)                                   |
| F10b | Microsoft Azure Test Plans                     | [Test suites](https://learn.microsoft.com/en-us/azure/devops/test/create-test-suites?view=azure-devops\&utm_source=chatgpt.com)                      |
| F10c | Microsoft Azure Test Plans                     | [Exploratory testing](https://learn.microsoft.com/en-us/azure/devops/test/add-to-bugs-exploratory-testing?view=azure-devops\&utm_source=chatgpt.com) |
| F11a | TestRail                                       | [Test plans](https://support.testrail.com/hc/en-us/articles/30765296499604-Create-new-test-plans?utm_source=chatgpt.com)                             |
| F11b | TestRail                                       | [Plans API](https://support.testrail.com/hc/en-us/articles/7077711537684-Plans?utm_source=chatgpt.com)                                               |

La edición publicada de ISO/IEC/IEEE 29148:2018 dispone de un proyecto de revisión identificado como DIS. No se ha tratado ese borrador como una sustitución normativa publicada.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.iso.org\&sz=32)

Requirements engineering



# **20. Limitaciones, discrepancias y reservas**

Para permitir una revisión independiente del presente informe, declaro expresamente las siguientes limitaciones:

**L01 — Lectura documental.** El encargo AC-01 fue leído íntegramente. Se recuperaron los documentos normativos obligatorios y se examinaron sus disposiciones relevantes. Debido a los límites de salida del conector, algunos documentos extensos y contratos se inspeccionaron mediante extractos seleccionados. No declaro haber completado una lectura íntegra, línea por línea, de todos los anexos incorporados por el manifiesto.

**L02 — Inspección de código.** Se realizó inspección estática focalizada de archivos directamente relacionados con planificación, casos, prioridad, campañas y análisis de impacto. No se certifica una búsqueda exhaustiva de todo el árbol del repositorio.

**L03 — Pruebas existentes.** Se consultó la matriz de reconstrucción AV-07 y sus referencias a pruebas relevantes. Algunos intentos de recuperar directamente archivos de tests por rutas candidatas devolvieron HTTP 404. No se interpreta esta circunstancia como inexistencia de las pruebas; su ubicación exacta y contenido quedan pendientes de comprobación documental.

**L04 — Fuentes profesionales.** Se utilizaron páginas oficiales, descripciones de estándares, material público de ISTQB y documentación de herramientas. No se acredita conformidad integral con estándares ISO ni una lectura completa de sus textos de pago.

**L05 — Herramientas comerciales.** Las comparaciones se limitan a capacidades documentadas. No se instalaron herramientas ni se realizaron comparaciones experimentales.

**L06 — Escenarios.** Todos los ejemplos, datos y recorridos de aceptación son ilustrativos y candidatos. No son resultados observados en un AUT ni en una instalación de QAP.

**L07 — Diferencia de procedencia documental.** El blob del registro maestro recuperado en el SHA solicitado difiere del blob histórico fijado en el manifiesto:

| Referencia                    | Blob                                       |
| ----------------------------- | ------------------------------------------ |
| Base histórica del manifiesto | `c828f74187ca62259a10052c6cfa0a717ecdcf8c` |
| SHA de investigación          | `8bb0e3cd371bcbd8d30ef2e80188fc03d43c1cb6` |

La diferencia de identidad fue comprobada. No demuestra por sí misma una contradicción material, puesto que existen consolidaciones posteriores. Recomiendo al Orquestador verificar su delta y precedencia sin reabrir automáticamente las auditorías.

**L08 — Ausencia normativa.** Los hallazgos clasificados como brechas se fundamentan en la documentación y fragmentos examinados. Deberán cotejarse contra la totalidad de los contratos incorporados antes de convertirlos en nuevos IDs definitivos. No se debe duplicar una obligación si el Orquestador localiza una cobertura normativa equivalente.

Estas reservas limitan la exhaustividad que puede atribuirse al presente informe, pero no impiden utilizar los escenarios y propuestas como insumo para la integración multidisciplinaria. No constituyen una certificación ni una contravalidación definitiva de los nuevos requisitos.

# **21. Dictamen final al Orquestador Principal**

**FAVORABLE A LA AMPLIACIÓN FOCALIZADA DEL ALCANCE PROFESIONAL DE QAP, CON PROPUESTAS Y RESERVAS DOCUMENTALES.**

La arquitectura consolidada presenta fundamentos adecuados para soportar las capacidades investigadas sin abandonar necesariamente sus decisiones centrales.

No obstante, recomiendo evitar que QAP quede reducido conceptualmente a:

> Una herramienta que descubre aplicaciones, genera pruebas automáticamente, las ejecuta y produce reportes.

Ese enfoque sería útil, pero insuficiente para una parte significativa del trabajo profesional de aseguramiento de calidad.

La visión recomendada es:

> QAP es una plataforma local de aseguramiento de calidad que permite comprender, diseñar, dirigir, ejecutar, acreditar y dar seguimiento a pruebas de software, mediante trabajo humano, automatización determinista y agentes de inteligencia artificial opcionales, preservando conocimiento, trazabilidad, autoridad, reproducibilidad y evidencia.

La IA debe incrementar las capacidades del profesional, no convertirse en un requisito indispensable para que pueda realizar su trabajo.

QAP debe ayudar a responder preguntas fundamentales del QA Lead:

- ¿Qué debemos probar y por qué?
- ¿Qué requisitos y riesgos todavía no están cubiertos?
- ¿Qué condiciones fueron realmente evaluadas?
- ¿Qué cambió respecto a la entrega anterior?
- ¿Qué pruebas debemos repetir?
- ¿Qué evidencia respalda cada conclusión?
- ¿Qué incertidumbres permanecen?
- ¿Existe fundamento suficiente para recomendar la entrega?

Si QAP puede responder estas preguntas mediante información acreditada, además de ejecutar autónomamente las pruebas, contará con una propuesta de producto más sólida para el uso profesional.

## **21.1. Recomendación al Orquestador**

Integrar los doce hallazgos provisionales con los informes QA-02–06, eliminar duplicidades, comprobar la cobertura normativa completa y elevar al propietario exclusivamente las decisiones materiales de producto.

Preservar entretanto la línea base vigente.

No seleccionar tecnologías definitivas, elaborar WBS, iniciar experimentos ni comenzar implementación hasta resolver las ampliaciones ratificadas y sus impactos.

# **22. Declaración de cumplimiento**

| Restricción                              | Resultado                             |
| ---------------------------------------- | ------------------------------------- |
| Investigación de la especialidad QA-01   | Realizada con las reservas declaradas |
| Lectura íntegra del encargo AC-01        | Realizada                             |
| Consulta de GitHub                       | Solo lectura                          |
| Inspección normativa y de código         | Documental y estática                 |
| Modificaciones en GitHub                 | Ninguna                               |
| Modificaciones de código o configuración | Ninguna                               |
| Experimentos ejecutados                  | Ninguno                               |
| Acceso a sistemas empresariales          | Ninguno                               |
| Tecnologías definitivas seleccionadas    | Ninguna                               |
| Inicio de G0/G1                          | No                                    |
| Elaboración de WBS                       | No                                    |
| Ratificación unilateral de requisitos    | No                                    |
| Solicitud de archivos al propietario     | No                                    |
| Preservación de decisiones anteriores    | Sí                                    |

**Estado de la entrega:** informe de investigación QA-01 entregado al Orquestador Principal, sujeto a integración, cotejo de las reservas declaradas y ratificación empresarial.

**Fin del informe AC-01 — QA-01.**