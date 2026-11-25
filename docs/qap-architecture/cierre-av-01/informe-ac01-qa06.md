# **AC-01 · Informe de investigación independiente QA-06**

**Especialidad:** QA empresarial, datos, APIs e integraciones.\
**Destinatario:** Orquestador Principal de QAP.\
**Repositorio:** `Hyouka73/QAMCP`.\
**Rama:** `develop`.\
**SHA analizado:** `b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5`.\
**Fecha:** 25 de noviembre de 2026.\
**Naturaleza:** Investigación documental y evaluación de alcance.\
**Estado:** Propuestas pendientes de contravalidación y ratificación.

# **1. Resumen ejecutivo**

## **1.1. Dictamen de la especialidad**

**FAVORABLE A LA BASE NORMATIVA EXISTENTE, CON AMPLIACIONES Y PRECISIONES RECOMENDADAS ANTES DE CONGELAR EL ALCANCE DEL PRODUCTO.**

QAP cuenta con una base normativa considerablemente desarrollada en materia de datos, operaciones empresariales, seguridad mutativa, reconciliación, oráculos, validación documental e interoperabilidad mediante APIs.

Especialmente, AV-04 y AV-05 contienen garantías que no deben sustituirse ni volver a introducirse como requisitos nuevos.

Sin embargo, existe una diferencia importante entre disponer de mecanismos seguros para ejecutar operaciones empresariales y proporcionar todas las capacidades necesarias para **diseñar, ejecutar, reproducir y evaluar pruebas profesionales sobre sistemas empresariales complejos**.

La principal oportunidad identificada consiste en ampliar QAP desde una herramienta que comprueba operaciones y flujos hacia una herramienta que también comprueba:

- La integridad de los conjuntos de datos.
- Las relaciones e invariantes entre entidades.
- La evolución de reglas y configuraciones empresariales.
- El comportamiento frente a operaciones simultáneas.
- Los procesos asíncronos y sus efectos posteriores.
- La compatibilidad entre versiones de servicios.
- La calidad de datos importados, transformados y migrados.
- La interacción con dependencias externas simuladas o autorizadas.
- La reproducibilidad de los datos empleados para detectar defectos.

No recomiendo construir una plataforma especializada de ingeniería de datos, un sistema de gestión de bases de datos, un motor contable, un ERP ni una plataforma de virtualización de servicios.

Recomiendo incorporar **capacidades transversales y contratos de evaluación reutilizables**, complementados mediante integraciones externas cuando la ejecución especializada no deba pertenecer al núcleo.

## **Resultado de la investigación QA-06**

Hallazgos materiales

# **12**

Esenciales propuestos

# **8**

Opcionales

# **1**

Integración externa o posterior

# **3**

Modificaciones al repositorio

**0**

Experimentos ejecutados

**0**

Accesos a sistemas empresariales

**0**

Los doce hallazgos son propuestas provisionales. No constituyen doce requisitos nuevos: varios representan precisiones de obligaciones existentes.

## **1.2. Recomendación principal al Orquestador**

El primer lanzamiento debe permitir comprobar no solamente que una acción empresarial produjo un resultado, sino también que:

1. Se aplicaron las condiciones empresariales correctas.
2. Se utilizaron los datos y configuraciones correspondientes.
3. Se respetaron las relaciones y restricciones entre entidades.
4. No se generaron efectos duplicados, inconsistentes o indebidos.
5. El estado resultante es verificable desde fuentes suficientemente independientes.
6. Otro QA puede reconstruir las condiciones relevantes de la prueba.
7. El resultado sigue siendo interpretable cuando cambian los datos, las reglas, las versiones o la disponibilidad de evidencia.

Esto debe conseguirse sin imponer acceso a bases de datos del AUT ni dependencia permanente de inteligencia artificial.

# **2. Verificación de la base y metodología**

## **2.1. Identidad del repositorio**

Mediante el conector de GitHub se verificó que el HEAD de `develop` corresponde al SHA solicitado.

El encargo AC-01 identifica internamente como base:

`303e621dbca4a3a3b17cb2bf32530ab6311edc92`

La comparación entre ambos commits devuelve un commit adicional que únicamente:

- Añade el encargo AC-01.
- Actualiza el README del directorio de cierre arquitectónico.

Por tanto, la diferencia de SHA no representa una discrepancia material en la arquitectura ni en el código evaluado.

[Comparación verificable de commits](https://github.com/Hyouka73/QAMCP/compare/303e621dbca4a3a3b17cb2bf32530ab6311edc92...b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5?utm_source=chatgpt.com)

## **2.2. Fuentes internas principales**

Las siguientes referencias quedan fijadas al SHA solicitado y constituyen la base documental de las conclusiones.

| Referencia | Documento                                                                                                                                                                                                              |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q01        | [Encargo vinculante AC-01](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/encargo-ac01-evaluacion-multidisciplinaria-qa.md?utm_source=chatgpt.com) |
| Q02        | [Especificación normativa consolidada](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/especificacion-consolidada.md?utm_source=chatgpt.com)                     |
| Q03        | [Manifiesto normativo](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/manifiesto-normativo-consolidado.md?utm_source=chatgpt.com)                  |
| Q04        | [Catálogo de requisitos](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/catalogo-requisitos.md?utm_source=chatgpt.com)                                          |
| Q05        | [Decisiones D01–D21](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/acta-decisiones.md?utm_source=chatgpt.com)                                                  |
| Q06        | [Ratificación DE-01–05](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/acta-ratificacion-de.md?utm_source=chatgpt.com)                             |
| Q07        | [Enmiendas AV-04](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/enmiendas-av04.md?utm_source=chatgpt.com)                                         |
| Q08        | [Protocolos AV-04](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/protocolos-av04.md?utm_source=chatgpt.com)                                       |
| Q09        | [Enmiendas AV-05](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/enmiendas-av05.md?utm_source=chatgpt.com)                                         |
| Q10        | [Protocolos AV-05](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/protocolos-av05.md?utm_source=chatgpt.com)                                       |
| Q11        | [Matriz de aceptación AV-08](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/matriz-aceptacion-av08.md?utm_source=chatgpt.com)                      |
| Q12        | [Registro maestro AR](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/registro-maestro.md?utm_source=chatgpt.com)                                   |
| Q13        | [Reconstrucción selectiva AV-07](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/matriz-reconstruccion-av07.md?utm_source=chatgpt.com)              |
| Q14        | [Resolución final de planificación](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/resolucion-final-planificacion.md?utm_source=chatgpt.com)       |

## **2.3. Criterios de clasificación**

| Clasificación          | Interpretación                                                           |
| ---------------------- | ------------------------------------------------------------------------ |
| CUBIERTO               | La necesidad ya está contemplada normativamente.                         |
| PRECISAR CONTRATO      | Existe una obligación, pero requiere delimitación profesional adicional. |
| BRECHA NUEVA           | No se identifica una obligación suficientemente explícita.               |
| CONTRADICCIÓN MATERIAL | Dos obligaciones incompatibles impedirían satisfacer el producto.        |
| NO APLICA              | No corresponde al alcance razonable de QAP.                              |

La ausencia de implementación no se considera automáticamente una brecha normativa.

# **3. Flujo profesional de QA empresarial**

Un QA empresarial no trabaja únicamente con páginas, botones y formularios. Trabaja con entidades, reglas, actores, dependencias, estados, transacciones y consecuencias de negocio.

## **3.1. Flujo de referencia**

1

**Comprensión empresarial**

Entidades, reglas, condiciones, configuraciones y permisos

2

**Diseño de escenarios**

Estados, relaciones, límites, variantes e invariantes

3

**Preparación de datos**

Datasets, fixtures, dependencias y autorización

4

**Ejecución**

UI, API, operaciones manuales y servicios autorizados

5

**Observación de efectos**

Persistencia, eventos, estados y consecuencias secundarias

6

**Conciliación**

Datos esperados frente a observados y fuentes independientes

7

**Evidencia y defectos**

Discrepancias, condiciones y receta de reproducción

8

**Cleanup y regresión**

Residuos, cambios, retest y reutilización del conocimiento

## **3.2. Actores consumidores**

| Actor                      | Necesidad profesional                                     |
| -------------------------- | --------------------------------------------------------- |
| QA Lead                    | Cobertura empresarial, riesgos y criterios de aceptación. |
| QA funcional               | Datos adecuados y verificación de reglas.                 |
| QA de APIs                 | Contratos, variantes, errores y efectos.                  |
| QA de datos                | Integridad, conciliación y transformaciones.              |
| SDET                       | Preparación repetible, automatización y recuperación.     |
| Desarrollador              | Identificación causal y reproducción de defectos.         |
| Analista de negocio        | Validación de reglas, condiciones y excepciones.          |
| Responsable financiero     | Exactitud de importes, saldos y operaciones.              |
| Responsable de integración | Compatibilidad y consistencia entre servicios.            |
| Auditor                    | Procedencia, evidencia, autoridad e historial.            |
| Propietario del producto   | Riesgo residual y decisión de aceptación.                 |

Estos actores no implican que QAP necesite incorporar inmediatamente un sistema centralizado de gestión multiusuario.

Representan consumidores y responsabilidades profesionales, no una decisión de arquitectura física.

# **4. Evaluación de la cobertura existente**

## **4.1. Capacidades que no deben convertirse nuevamente en requisitos**

| Capacidad profesional                            | Cobertura actual | Referencia          |
| ------------------------------------------------ | ---------------- | ------------------- |
| Datos sintéticos básicos                         | CUBIERTO         | DAT-001.1           |
| Etiquetado y caducidad                           | CUBIERTO         | DAT-001.1           |
| Preparación topológica                           | CUBIERTO         | DAT-001.2, AV-04 §4 |
| Limpieza en orden inverso                        | CUBIERTO         | DAT-001.4, AV-04 §5 |
| Restauración de registros propios dedicados      | CUBIERTO         | AV-04 §5            |
| Compensación y confinamiento                     | CUBIERTO         | AV-04 §5            |
| Idempotencia de operaciones                      | CUBIERTO         | AV-04 §4            |
| Reconciliación de efectos parciales              | CUBIERTO         | AV-04 §§4–5         |
| Pérdida de respuestas                            | CUBIERTO         | EXP-05b             |
| Consistencia eventual                            | CUBIERTO         | ORA-001.6, AV-04 §3 |
| Persistencia comprobada                          | CUBIERTO         | ORA-001.2–3         |
| Cálculos monetarios exactos                      | CUBIERTO         | ORA-001.4, AV-04 §7 |
| Moneda, zona horaria y contexto regional         | CUBIERTO         | D17, QA-001         |
| OpenAPI y UTCP                                   | CUBIERTO         | D08, INT-001.4      |
| Validación de schemas                            | CUBIERTO         | AV-05 §4            |
| Cruces entre instancias                          | CUBIERTO         | D09, XINST-001      |
| Permisos por efecto real                         | CUBIERTO         | D07, AV-04/05       |
| Producción exclusivamente lectura acreditada     | CUBIERTO         | D07                 |
| Prohibición de efectos externos reales indebidos | CUBIERTO         | AV-04 §5            |
| Validación de PDF/Excel emitidos por AUT         | CUBIERTO         | D11, AUTREP-001     |
| Valores Excel, fórmulas y cachés                 | CUBIERTO         | AV-05 §1            |
| Aislamiento de documentos hostiles               | CUBIERTO         | AV-05 §3            |
| Testigos independientes                          | CUBIERTO         | AV-04 §3            |
| Resultados separados de cleanup y evidencia      | CUBIERTO         | AR-08/52            |
| Continuidad E2E multirrol                        | CUBIERTO         | AR-43               |

La amplitud de esta cobertura justifica preservar AV-04 y AV-05 en lugar de abrir otra revisión general.

## **4.2. Contraste con código existente**

La inspección estática de archivos y pruebas relevantes permite diferenciar los antecedentes reutilizables del producto objetivo.

| Evidencia de código                                                                                                                                                                                                  | Observación                                                                                                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [interpolator.ts, L3–52](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/playwright-runner/src/context/interpolator.ts?utm_source=chatgpt.com#L3)                           | Interpolación de variables de contexto y flujo mediante cadenas. No equivale a un gestor de datasets empresariales versionados.                                               |
| [flow-orchestrator.ts, L367–405](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/engine/src/flow-orchestrator.ts?utm_source=chatgpt.com#L367)                               | Existe continuidad, respaldo de sesiones y variables compartidas. No acredita un DataPlan empresarial con reconciliación por efecto.                                          |
| [assert.ts, L24–180](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/playwright-runner/src/actions/assert.ts?utm_source=chatgpt.com#L24)                                    | Aserciones de visibilidad, existencia, igualdad, conteo y atributos. Son mecanismos útiles, pero no sustituyen oráculos empresariales de persistencia e integridad.           |
| [bva-generator.ts, L688–785](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/knowledge/src/plan/bva-generator.ts?utm_source=chatgpt.com#L688)                               | Generación de valores frontera basada en reglas confirmadas. Existen antecedentes reutilizables, aunque las comprobaciones generadas pueden depender de indicadores visibles. |
| [rbac-generator.ts](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/knowledge/src/plan/rbac-generator.ts?utm_source=chatgpt.com)                                            | Fundamentación de roles y selectores de denegación. No demuestra por sí misma ausencia de efectos secundarios.                                                                |
| [intercept-network.ts, L5–22](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/playwright-runner/src/actions/intercept-network.ts?utm_source=chatgpt.com#L5)                 | Intercepción con respuesta HTTP sustituida. Constituye un antecedente de simulación, no una prueba de comportamiento del proveedor real.                                      |
| [document-detector.ts](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/knowledge/src/document-detector.ts?utm_source=chatgpt.com)                                           | Detección y clasificación de documentación. No acredita la totalidad de D10 ni D11.                                                                                           |
| [document-path-disabled.test.ts, L53–106](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/mcp/src/__tests__/document-path-disabled.test.ts?utm_source=chatgpt.com#L53)      | Pruebas existentes de rechazo de rutas documentales directas y aceptación de contenido autorizado inline.                                                                     |
| [oracle-reproduction-negative.test.ts](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/knowledge/src/__tests__/oracle-reproduction-negative.test.ts?utm_source=chatgpt.com) | Regresiones contra generación de límites artificiales y otros problemas de fundamentación.                                                                                    |
| [Manifest de knowledge](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/knowledge/package.json?utm_source=chatgpt.com)                                                      | Dependencias actuales de validación y YAML; no acredita los motores futuros de extracción, datasets u oráculos.                                                               |

**Conclusión:** la distancia entre el código inspeccionado y el producto especificado es consistente con las reservas de implementación ya registradas. No debe contabilizarse nuevamente como ampliación de alcance.

No se ejecutaron estas pruebas y no se certifica su resultado actual.

# **5. Contraste con prácticas profesionales y herramientas existentes**

## **5.1. Calidad de datos como dimensión propia**

ISO/IEC 25012:2008 establece un modelo general para la calidad de datos estructurados. Su existencia respalda la necesidad de evaluar datos como objeto de calidad, no solamente como entrada de una prueba funcional. Se consultó su descripción pública, no se reclama conformidad con el texto íntegro de pago.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.iso.org\&sz=32)

Data quality model



Herramientas como Great Expectations y dbt ofrecen comprobaciones sobre unicidad, completitud, valores admitidos y relaciones entre datos. Estas capacidades son relevantes incluso cuando todos los formularios de una aplicación funcionan correctamente.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://docs.getdbt.com\&sz=32)

dbt Developer Hub+1



## **5.2. Contratos de servicio**

OpenAPI describe interfaces HTTP y sus estructuras. Sin embargo, verificar un schema no demuestra que las reglas empresariales, efectos y expectativas de todos los consumidores sean correctos.

Pact complementa este problema mediante contratos definidos por interacciones y verificación contra proveedores, incluyendo integraciones HTTP y mensajes.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://spec.openapis.org\&sz=32)

spec.openapis.org+2



## **5.3. Procesos asíncronos**

AsyncAPI 3.0.0 contempla canales, mensajes, operaciones y correlación. CloudEvents 1.0.2 proporciona un modelo interoperable de eventos.

Ambos son referencias útiles para describir procesos empresariales que no se completan durante la solicitud HTTP inicial. No son garantías automáticas de orden, entrega única ni éxito empresarial.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.asyncapi.com\&sz=32)

AsyncAPI Initiative for event-driven APIs+1



## **5.4. Idempotencia y efectos remotos**

RFC 9110 distingue las propiedades semánticas de los métodos HTTP. La idempotencia requiere comprender su efecto previsto, no asumir que una respuesta idéntica equivale a una única ejecución empresarial.

La documentación de Stripe demuestra además que el comportamiento de las claves idempotentes puede variar según la versión del servicio, su vigencia y el momento de ejecución.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.rfc-editor.org\&sz=32)

rfc-editor.org+1



Esto refuerza el diseño ya aceptado en AV-04.

## **5.5. Simulación de dependencias**

WireMock documenta simulación de respuestas, escenarios con estado y fallos de comunicación.

La utilidad profesional de esta categoría consiste en probar situaciones difíciles de producir legítimamente en sistemas reales, como respuestas tardías o indisponibilidad de proveedores.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://wiremock.org\&sz=32)

WireMock+1



La simulación no demuestra por sí misma que el proveedor auténtico funcione.

## **5.6. Migraciones y conciliación**

AWS DMS documenta mecanismos de comparación entre datos de origen y destino, incluidos estados donde la comparación no puede concluirse satisfactoriamente.

Esta práctica ilustra que una migración técnicamente finalizada no equivale necesariamente a datos migrados correctamente.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://docs.aws.amazon.com\&sz=32)

AWS Database Migration Service



## **5.7. Técnicas de diseño y seguridad empresarial**

ISTQB CTFL v4.0.1 contempla técnicas de equivalencia, límites, tablas de decisión y transiciones de estado.

OWASP API Security Top 10:2023 identifica riesgos asociados tanto a flujos empresariales sensibles como al consumo inseguro de servicios externos.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://istqb.org\&sz=32)

Foundation Level Syllabus v4.0+1



Estas referencias respaldan una ampliación del diseño empresarial de pruebas, pero no obligan a incorporar todas las funciones de herramientas especializadas.

# **6. Matriz de hallazgos priorizados**

Todos los identificadores siguientes son provisionales. No alteran el catálogo de 103 entradas ni los 57 AR.

| ID provisional | Hallazgo                                                      | Clasificación     | Prioridad propuesta                        |
| -------------- | ------------------------------------------------------------- | ----------------- | ------------------------------------------ |
| AC01-QA06-01   | Biblioteca de datasets y fixtures versionados                 | Precisar contrato | Esencial                                   |
| AC01-QA06-02   | Integridad y calidad de conjuntos de datos                    | Brecha nueva      | Esencial                                   |
| AC01-QA06-03   | Modelado empresarial de condiciones y estados                 | Precisar contrato | Esencial                                   |
| AC01-QA06-04   | Concurrencia intencional del AUT                              | Brecha nueva      | Esencial                                   |
| AC01-QA06-05   | Evaluación de procesos asíncronos y eventos                   | Precisar contrato | Esencial                                   |
| AC01-QA06-06   | Pruebas negativas de contratos API                            | Precisar contrato | Esencial                                   |
| AC01-QA06-07   | Operaciones masivas y resultados parciales                    | Precisar contrato | Esencial                                   |
| AC01-QA06-08   | Comparación empresarial entre configuraciones y versiones     | Precisar contrato | Esencial                                   |
| AC01-QA06-09   | Comparación reutilizable de poblaciones y salidas adicionales | Brecha nueva      | Opcional                                   |
| AC01-QA06-10   | Compatibilidad de contratos entre consumidores y proveedores  | Brecha nueva      | Integración externa                        |
| AC01-QA06-11   | Virtualización y simulación avanzada de dependencias          | Precisar contrato | Integración externa                        |
| AC01-QA06-12   | Regresión y validación de migraciones de datos AUT            | Brecha nueva      | Posterior, con soporte básico reutilizable |

# **7. Hallazgos y propuestas detalladas**

## **AC01-QA06-01 · Biblioteca de datasets y fixtures versionados**

Esencial

**Clasificación:** PRECISAR CONTRATO.

### **Problema profesional**

Generar un cliente sintético para una ejecución no equivale a disponer de una biblioteca de datos de prueba reutilizables.

Un QA necesita conservar las condiciones de un dataset que reproduce un defecto, incluso cuando las entidades utilizadas originalmente han sido eliminadas.

### **Escenario y actores**

Un QA Senior prepara clientes con diferentes características empresariales. Otro QA reutiliza esos mismos perfiles para verificar aprobación, rechazo, cálculo de condiciones y regresión meses después.

Participan QA funcional, SDET, analista de negocio y desarrollador.

### **Evidencia y requisitos afectados**

Q04, DAT-001.1, DAT-001.2, MEM-002.1 y D05/D08/D19 contemplan síntesis, persistencia, datos y caducidad.

AV-04 §4 exige datos sintéticos reproducibles. No se identifica una delimitación suficientemente completa del ciclo de vida de un dataset reutilizable como activo diferenciado de sus materializaciones.

### **Propuesta**

Introducir un contrato lógico de dataset reutilizable que distinga:

| Objeto lógico            | Responsabilidad                                       |
| ------------------------ | ----------------------------------------------------- |
| Definición del dataset   | Campos, restricciones, propósito y variantes.         |
| Revisión del dataset     | Versión congelada y dependencias acreditadas.         |
| Receta de generación     | Parámetros, semilla y reglas de derivación.           |
| Materialización          | Entidades realmente creadas en una instancia.         |
| Vinculación de ejecución | Relación entre dataset, caso, campaña e intento.      |
| Disposición              | Caducidad, eliminación, compensación o confinamiento. |

No es necesario que estos objetos se conviertan en tablas o clases independientes.

La receta debe conservar, según corresponda, generador y versión, contexto temporal, relaciones, dependencias externas, restricciones de unicidad y vigencia.

Una semilla aislada no garantiza reproducibilidad.

La expiración de una materialización no debe eliminar automáticamente la definición reutilizable de un dataset activo. Tampoco debe permitir conservar datos privados más allá de su autorización.

### **Criterios verificables de aceptación**

- Crear un dataset versionado con relaciones cliente–solicitud–contrato.
- Materializarlo en dos ejecuciones con identidades diferentes y condiciones empresariales equivalentes.
- Detectar un cambio incompatible en la configuración.
- Bloquear una receta que requiera datos no autorizados o cuyo prerrequisito haya caducado.
- Limpiar exclusivamente las entidades correspondientes.
- Recuperar la definición de un dataset activo después de la poda de detalles históricos, sin inventar las entidades eliminadas.

**Testigo:** observación acreditada de las entidades materializadas y sus relaciones; registro de revisión y procedencia de los parámetros.

### **Dependencias, riesgos y alternativas**

Dependencias: memoria, DataPlan, privacidad, retención y QA-03.

Riesgos: almacenamiento excesivo, colisiones de identidad y falsa anonimización.

Alternativas: recetas declarativas, plantillas manuales autorizadas o generadores externos gobernados.

**Costo relativo:** medio. Su frecuencia de utilización y relevancia para regresión justifican incorporarlo al lanzamiento.

## **AC01-QA06-02 · Integridad y calidad de conjuntos de datos**

Esencial

**Clasificación:** BRECHA NUEVA como capacidad generalizada.

### **Problema profesional**

Una aplicación puede aprobar cada operación individual y, aun así, mantener datos inconsistentes globalmente.

Los oráculos existentes cubren cálculos, efectos y conciliaciones específicas, pero no se observa un compromiso explícito suficientemente general con la validación reutilizable de poblaciones empresariales fuera del ámbito particular de D11.

### **Escenario**

Un sistema contiene 1.000 solicitudes.

Cada solicitud visualizada parece válida, pero existen registros duplicados, contratos asociados a clientes inexistentes y estados incompatibles con sus relaciones.

Actores: QA de datos, QA funcional, analista de negocio y desarrollador.

### **Evidencia y requisitos afectados**

AV-04 §3 contempla cardinalidad y relaciones por operación. AV-05 §2 contempla población, duplicados y reconciliación de reportes.

DAT-001, ORA-001.4, ORA-001.7 y AUTREP-001 constituyen antecedentes, pero no definen claramente un catálogo general de afirmaciones sobre conjuntos de datos.

La práctica documentada por dbt y Great Expectations demuestra la utilidad de verificaciones declarativas sobre integridad y unicidad.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://docs.getdbt.com\&sz=32)

dbt Developer Hub+1



### **Propuesta**

Permitir afirmaciones declarativas acreditadas sobre colecciones autorizadas:

| Familia                | Comprobación                                             |
| ---------------------- | -------------------------------------------------------- |
| Completitud            | Campos y registros requeridos presentes.                 |
| Unicidad               | Claves simples y compuestas sin duplicados indebidos.    |
| Validez                | Tipos, enumeraciones, formatos y rangos.                 |
| Integridad referencial | Relaciones empresariales existentes y válidas.           |
| Consistencia           | Campos y estados compatibles.                            |
| Cardinalidad           | Relaciones y cantidades acordadas.                       |
| Conciliación           | Correspondencia entre poblaciones y totales.             |
| Vigencia               | Datos y configuraciones aplicables al periodo declarado. |

Toda afirmación deberá declarar la población, fuente, condiciones, alcance, filtros, cobertura, regla y testigo.

No se exigirá SQL libre ni conexión directa a bases de datos del AUT.

### **Criterios verificables de aceptación**

Sobre una población sintética conocida:

- Detectar una clave duplicada.
- Detectar un registro huérfano.
- Detectar un estado incompatible con sus relaciones.
- Aceptar correctamente nulos permitidos y duplicados legítimos.
- No acreditar integridad global cuando solo se conoce una página o muestra insuficiente.
- Mantener disponibles las afirmaciones independientes cuando otra no pueda evaluarse.
- Localizar cada discrepancia por identidad y regla.

**Comportamiento negativo:** una fuente incompleta no permite declarar que toda la población satisface las restricciones.

**Testigo:** población independiente acreditada, identidad de los registros y cobertura verificable.

### **Dependencias, riesgos y alternativas**

Dependencias: TypedRuleOracle, adquisición de datos, D11, memoria y autoridad.

Riesgos: procesamiento de grandes poblaciones, fuga de información e inferencias sobre datos no observables.

Alternativas: comprobadores declarativos nativos acotados, importación de resultados externos o conjuntos entregados manualmente por fuentes autorizadas.

**Costo relativo:** medio-alto. La utilidad transversal justifica un subconjunto esencial.

No recomiendo incorporar un motor completo de procesamiento analítico.

## **AC01-QA06-03 · Modelado empresarial de condiciones y estados**

Esencial

**Clasificación:** PRECISAR CONTRATO.

### **Problema profesional**

Las reglas empresariales suelen depender de combinaciones de producto, configuración, estado, actor, fechas, límites y excepciones.

Una prueba que verifica cada campo aisladamente puede omitir defectos causados por interacciones entre condiciones válidas.

### **Escenario**

Una solicitud financiera puede aprobarse únicamente si corresponde a un producto vigente, el importe pertenece al rango permitido, el cliente satisface ciertas condiciones y el actor tiene autoridad para esa transición.

La misma solicitud debe ser rechazada si cualquiera de las condiciones obligatorias deja de cumplirse.

Actores: QA funcional, analista de negocio, responsable de producto.

### **Evidencia y requisitos afectados**

D05, D06, PLN-001, ORA-001.4, AV-04 §§6–7 y el generador BVA existente.

AV-04 exige estados, límites, equivalencias y oráculos tipados. La precisión adicional consiste en representar combinaciones de condiciones como activos verificables, no solamente como casos aislados.

### **Propuesta**

Admitir representación declarativa y versionada de:

- Tablas de decisión.
- Transiciones válidas y prohibidas.
- Condiciones de entrada y salida.
- Dependencias entre reglas.
- Excepciones y precedencia acreditadas.
- Invariantes antes y después de una transición.
- Cobertura por combinación, estado y transición.

La expectativa debe provenir de reglas acreditadas. El HOST puede sugerir combinaciones, pero no inventar condiciones empresariales ausentes.

### **Ejemplo conceptual**

Máquina de estados simplificada de una solicitudEjemplo hipotético; no constituye una regla acreditada de Lendus Core.

### **Criterios verificables de aceptación**

Dada una tabla de decisión acreditada:

- Generar casos correspondientes a las combinaciones exigidas.
- Verificar transiciones positivas y negativas.
- Detectar una transición prohibida aunque la interfaz anuncie éxito.
- Detectar una combinación sin cobertura y conservarla como tal.
- Identificar reglas contradictorias.
- Abstenerse cuando una excepción material no esté definida.
- Ejecutar nuevamente las condiciones congeladas sin IA.

**Testigo:** estado previo y posterior, autoridad del actor, condiciones efectivas y expectativa acreditada.

### **Dependencias y riesgos**

Dependencias: QA-01, modelos de casos, TypedRuleOracle, DataPlan y cobertura.

Riesgo: explosión combinatoria y generación de reglas ficticias.

Alternativas: representación manual de tablas, selección combinatoria acreditada y extensiones declarativas.

**Costo relativo:** medio. No se recomienda exigir cobertura exhaustiva de todas las combinaciones posibles indiscriminadamente.

## **AC01-QA06-04 · Concurrencia intencional del AUT**

Esencial

**Clasificación:** BRECHA NUEVA.

### **Problema profesional**

Debe distinguirse entre:

**Concurrencia de QAP:** ejecutar casos independientes eficientemente.

**Concurrencia bajo prueba:** provocar interacciones empresariales simultáneas controladas para comprobar que el AUT preserva sus invariantes.

AV-04 §6 y D16 regulan principalmente conflictos, reservas y concurrencia segura de las tareas de QAP. Esto no acredita automáticamente una capacidad para probar condiciones de carrera del AUT.

### **Escenario**

Dos usuarios autorizados intentan reservar simultáneamente la última unidad de un inventario.

Una única reserva debe resultar efectiva según la regla empresarial. Dos reservas exitosas constituirían un defecto aunque ambas devolvieran HTTP 200.

La documentación de PostgreSQL 18 describe anomalías que pueden producirse entre transacciones concurrentes. Sirve como referencia conceptual; QAP no necesita acceder a PostgreSQL ni conocer el motor interno del AUT.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.postgresql.org\&sz=32)

postgresql.org



### **Propuesta**

Incorporar un escenario compuesto de concurrencia controlada, con:

- Participantes identificados.
- Operaciones autorizadas individualmente.
- Puntos de coordinación y ventanas temporales.
- Recursos sintéticos dedicados.
- Límites de operaciones y efectos.
- Invariante conjunta.
- Observación independiente.
- Estrategia de reconciliación y cleanup.

No debe anularse la exclusión jerárquica AV-04.

La alternativa normativa consiste en admitir una única unidad compuesta que posea la reserva del escenario y coordine sus participantes internos bajo autorización específica. Otros escenarios incompatibles permanecen excluidos.

### **Criterios verificables de aceptación**

Fixture de inventario con una unidad disponible y dos participantes:

- Comprobar la coincidencia temporal requerida mediante observación.
- Acreditar exactamente una reserva cuando esa sea la regla.
- Detectar dos reservas efectivas.
- Detectar actualizaciones perdidas.
- Distinguir falta de concurrencia efectiva de un caso realmente aprobado.
- Bloquear escenarios no autorizados o con recursos no aislados.
- Reconciliar ambos participantes antes de liberar la reserva.

**Testigo:** recepción y efectos de ambas operaciones, cardinalidad final e invariante independiente.

### **Dependencias, riesgos y alternativas**

Dependencias: AV-04 §6, AV-06, permisos, supervisor y DataPlan.

Riesgos: generación de efectos múltiples y falsas conclusiones por no alcanzar la concurrencia pretendida.

Alternativas: coordinador funcional acotado o integración con ejecutores externos autorizados.

**Costo relativo:** medio-alto.

**Decisión requerida:** cualquier adaptación de la política de reservas debe contravalidarse focalizadamente. No se autoriza una excepción general de seguridad ni se propone incorporar pruebas de carga masiva.

## **AC01-QA06-05 · Evaluación de procesos asíncronos y eventos**

Esencial

**Clasificación:** PRECISAR CONTRATO.

### **Problema profesional**

En sistemas empresariales, una solicitud puede desencadenar procesos que finalizan minutos u horas después.

El éxito inicial puede corresponder únicamente a la admisión de una tarea, mientras que el resultado empresarial depende de una cola, evento, callback o servicio posterior.

### **Evidencia**

AV-04 contempla consistencia eventual, efectos tardíos, subefectos e incertidumbre. AV-05 §4 contempla inventario de callbacks/webhooks.

La brecha no consiste en ausencia de reconciliación asíncrona, sino en precisar cómo se diseñan y acreditan escenarios empresariales que dependen de eventos.

La documentación oficial de Stripe muestra un caso real de integración donde los webhooks notifican acontecimientos posteriores a la operación inicial.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://docs.stripe.com\&sz=32)

docs.stripe.com



### **Escenario**

Un sistema recibe una solicitud de generación de contrato.

Devuelve aceptación de la solicitud, genera el documento posteriormente y actualiza el estado en otro módulo.

Actores: QA de integraciones, QA funcional, SDET y desarrollador.

### **Propuesta**

Incorporar al modelo de afirmaciones:

| Elemento        | Información requerida                        |
| --------------- | -------------------------------------------- |
| Evento esperado | Tipo, versión y fuente.                      |
| Identidad       | Correlación y ámbito empresarial.            |
| Dependencia     | Operación que origina el evento.             |
| Temporalidad    | Ventana, plazo y condiciones terminales.     |
| Orden           | Orden requerido, si existe.                  |
| Duplicados      | Política y efecto empresarial esperado.      |
| Consumo         | Evidencia disponible del procesamiento.      |
| Resultado       | Estado empresarial confirmado o desconocido. |

Permitir testigos procedentes de APIs de estado, históricos autorizados, receptores de prueba aislados o adaptadores externos.

No exigir acceso directo al broker de mensajería.

### **Criterios verificables de aceptación**

- Aceptación inicial seguida de finalización correcta: PASS únicamente cuando el efecto exigido queda acreditado.
- Evento recibido, pero no procesado: no acredita la finalización.
- Evento duplicado con efecto único correcto: resultado según contrato.
- Evento duplicado que crea dos contratos: FAIL acreditado.
- Evento fuera de orden: evaluar conforme a la semántica del destino.
- Timeout sin terminalidad: INDETERMINATE cuando corresponda, con efecto desconocido conservado.
- Cancelación local: no acreditar cancelación remota sin prueba.
- Reanudación desde otro HOST: preservar correlación e incertidumbre.

**Testigo:** evidencia correlacionada del evento y del efecto empresarial, N2 o N3 según afirmación.

### **Dependencias y alternativas**

Dependencias: ORA-001.6, AR-09/10, AR-17/48, DataPlan, supervisor.

Riesgos: confundir recepción con procesamiento, tratar silencio como ausencia, introducir listeners no autorizados.

Alternativas: polling acreditado, receptor sintético, integración de eventos o importación de observaciones autorizadas.

**Costo relativo:** medio para el modelo básico; alto para adaptadores universales.

La comprensión y evaluación de eventos es esencial. La integración nativa con todas las tecnologías de colas queda fuera del lanzamiento obligatorio.

## **AC01-QA06-06 · Pruebas negativas de contratos API**

Esencial

**Clasificación:** PRECISAR CONTRATO.

### **Problema profesional**

Existe una diferencia fundamental entre:

- Una instrucción inválida dirigida a QAP.
- Una entrada deliberadamente inválida que QAP envía al AUT para comprobar su comportamiento.

Una validación estricta de schemas podría impedir precisamente las pruebas negativas necesarias para evaluar al AUT si ambas categorías se confunden.

### **Evidencia**

AV-05 §4 establece validación de documento, solicitudes y respuestas. REQ-QA-002 y EXP-05a contemplan contratos, incompatibilidades y negativos.

La distinción entre rechazo interno y rechazo esperado del AUT necesita quedar inequívocamente delimitada en el producto.

No se considera una contradicción normativa demostrada; es una ambigüedad material de implementación.

### **Propuesta**

Definir dos planos independientes:

**Plano de control QAP:** siempre sujeto a contratos internos válidos y autorización.

**Plano de prueba AUT:** admite variantes deliberadamente inválidas del payload cuando formen parte de un escenario negativo acreditado, autorizado y acotado.

Los casos deben distinguir campos omitidos, nulos, tipos incompatibles, límites, enumeraciones, versiones y errores previstos.

La variante negativa jamás debe permitir saltarse autenticación, destinos permitidos, presupuesto, restricciones por efecto o controles de custodia.

### **Criterios verificables de aceptación**

Fixture con una API cuyo importe debe ser positivo y cuyo campo cliente es obligatorio:

| Caso                                                    | Resultado exigido                               |
| ------------------------------------------------------- | ----------------------------------------------- |
| Solicitud válida                                        | Efecto correcto acreditado.                     |
| Importe negativo                                        | Rechazo del AUT conforme a regla acreditada.    |
| Campo obligatorio omitido                               | Rechazo conforme al contrato.                   |
| Rechazo acompañado de creación indebida                 | FAIL funcional.                                 |
| Petición interna QAP malformada                         | Rechazo previo al despacho.                     |
| Caso negativo sin autorización                          | BLOCKED o rechazo de admisión conforme a AR-52. |
| Error producido por el adaptador antes de llegar al AUT | No atribuir defecto al AUT.                     |

**Testigo:** recepción de la variante por el AUT, respuesta y ausencia o presencia acreditada de efectos.

### **Dependencias y alternativas**

Dependencias: AV-05 §4, TypedRuleOracle, QA-05 y seguridad de conectores.

Riesgos: convertir un caso negativo en bypass de políticas o confundir error de serialización con defecto del AUT.

Alternativas: variantes declarativas acotadas o integración externa gobernada para casos especializados.

**Costo relativo:** medio. Es una precisión imprescindible para un QA profesional de APIs.

## **AC01-QA06-07 · Operaciones masivas y resultados parciales**

Esencial

**Clasificación:** PRECISAR CONTRATO.

### **Problema profesional**

Numerosas aplicaciones empresariales ofrecen importaciones, aprobaciones masivas, generación de documentos por lote o procesamiento de múltiples registros.

Un resultado agregado exitoso puede ocultar elementos omitidos, repetidos o incorrectamente procesados.

### **Escenario**

Se importan 100 registros sintéticos. El contrato establece que los registros válidos deben procesarse y los inválidos rechazarse individualmente.

La interfaz informa éxito del lote, pero algunos registros válidos nunca fueron incorporados.

### **Evidencia y requisitos afectados**

D06, D08, DAT-001.2, ORA-001.2–6, AV-04 §§1, 4–5 y AV-05 §4.

Los subefectos y resultados parciales ya existen normativamente. Falta precisar el contrato empresarial de pertenencia, correspondencia y atomicidad de operaciones por lote.

### **Propuesta**

Cada escenario masivo deberá declarar:

- Inventario de elementos esperados.
- Identidad estable por elemento.
- Política de atomicidad total o parcial.
- Resultado esperado individual.
- Correspondencia entre elemento y efecto.
- Elementos omitidos, desconocidos, duplicados y rechazados.
- Reconciliación y limpieza por elemento.
- Reanudación sin repetir efectos confirmados.

No imponer atomicidad total a destinos que legítimamente admitan éxito parcial.

### **Criterios verificables de aceptación**

Ejemplo: 100 elementos, 95 válidos y cinco inválidos.

- Aceptar el lote cuando exactamente los 95 válidos producen los efectos esperados y los otros cinco son rechazados correctamente.
- Detectar un registro válido omitido.
- Detectar creación duplicada.
- Detectar un registro inválido incorporado.
- Rechazar un total correcto que oculta identidades equivocadas.
- Recuperar un lote interrumpido sin reenviar ciegamente los elementos confirmados.
- Abstenerse respecto de elementos cuyo efecto continúe desconocido.

**Testigo:** identidad de cada elemento y sus efectos, conciliación de cardinalidad y reglas del lote.

### **Dependencias y riesgos**

Dependencias: AC01-QA06-02, DataPlan, libro de efectos, resultados canónicos.

Riesgos: explosión de evidencia, memoria excesiva y reenvío del lote completo.

Alternativas: evaluación incremental por elementos, observación externa o conjuntos de tamaño acotado.

**Costo relativo:** medio. No requiere un motor independiente de procesamiento masivo.

## **AC01-QA06-08 · Comparación entre configuraciones y versiones empresariales**

Esencial

**Clasificación:** PRECISAR CONTRATO.

### **Problema profesional**

Dos instancias pueden ofrecer la misma funcionalidad y producir resultados diferentes legítimamente por sus configuraciones.

La diferencia observada entre instancias no constituye automáticamente un defecto.

### **Escenario**

Una instancia de referencia mantiene determinadas condiciones comerciales. La instancia QA utiliza condiciones actualizadas, que pueden afectar cálculos, límites y elegibilidad.

Un QA necesita reproducir una condición concreta sin copiar indiscriminadamente la instancia original.

### **Evidencia y requisitos afectados**

D05, D09, XINST-001, REQ-MEM-002.1, AV-05 §5 y FrozenRegionalContext.

La transferencia autorizada por campo, finalidad y procedencia está cubierta. Se propone precisar la reutilización comparativa y la equivalencia empresarial.

### **Propuesta**

Incorporar revisiones lógicas de configuraciones relevantes para una prueba, distinguiendo:

| Hecho                    | Significado                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------- |
| Configuración observada  | Lo obtenido de una instancia.                                                          |
| Configuración acreditada | La configuración cuya autoridad y vigencia se conocen.                                 |
| Configuración esperada   | Condición normativa para el escenario.                                                 |
| Diferencia autorizada    | Variación legítima entre destinos.                                                     |
| Divergencia              | Diferencia potencialmente defectuosa que requiere evaluación.                          |
| Equivalencia             | Configuraciones distintas que producen el resultado exigido bajo una regla acreditada. |

La comparación debe preservar contexto, unidades, fecha efectiva, versiones y ámbito.

### **Criterios verificables de aceptación**

- Comparar dos configuraciones autorizadas.
- Identificar diferencias relevantes para el caso.
- Reconocer diferencias legítimas acreditadas.
- Detectar una tasa, límite o condición incompatible con la expectativa.
- Reutilizar únicamente los parámetros aprobados.
- Bloquear copia de credenciales, sesiones o campos sensibles no autorizados.
- Invalidar o revisar casos dependientes cuando cambia una configuración material.
- Mantener aislados los conocimientos de ambas instancias.

**Testigo:** fuente acreditada de configuración, digest permitido, revisión y correspondencia de campos.

### **Dependencias y alternativas**

Dependencias: D09, memoria, impacto de cambios, datos y autoridad.

Riesgos: inferir incorrectamente que la instancia de referencia constituye la verdad empresarial universal.

Alternativas: comparación de descriptores saneados, captura manual acreditada o adquisición directa autorizada.

**Costo relativo:** medio.

No requiere sincronizar instancias ni replicar bases de datos.

## **AC01-QA06-09 · Comparación reutilizable de poblaciones y salidas adicionales**

**Prioridad:** valiosa, pero opcional.

**Clasificación:** BRECHA NUEVA fuera del alcance obligatorio específico de D11.

### **Problema profesional**

Los sistemas empresariales producen datos mediante formatos adicionales a PDF y Excel: archivos CSV, JSON, XML, documentos estructurados y exportaciones de integración.

Sería ineficiente implementar un comparador completamente distinto para cada canal.

### **Propuesta**

Generalizar los mecanismos de normalización y conciliación de datos mediante un contrato reutilizable:

PDF

Excel

API / JSON

CSV

XML

Otros autorizados

**Adquisición y normalización tipada**

Identidad, procedencia, cobertura y contexto

**Comparador empresarial**

Claves, valores, relaciones, reglas y discrepancias

**Oráculo y resultado canónico**

Independencia, veredicto y evidencia

### **Evidencia y requisitos afectados**

D10/D11, DOC-001.1–4, AUTREP-001 y AV-05 §§1–3.

D11 sigue siendo una obligación completa de PDF/Excel. Generalizar el comparador no permite sustituir dichas capacidades por formatos más sencillos.

### **Aceptación**

- Comparar una salida CSV autorizada con una población JSON acreditada.
- Detectar un campo faltante, una clave duplicada y una conversión de precisión incorrecta.
- Reconocer equivalencia de formatos cuando corresponda.
- Abstenerse ante extracción incompleta.
- No ejecutar macros, fórmulas, referencias externas ni contenido activo no autorizado.

**Actores:** QA de datos, QA funcional y especialistas de integración.

**Dependencias:** AC01-QA06-02, D11 y sandbox documental.

**Riesgos:** incremento del corpus, formatos ambiguos y expansión innecesaria de parsers.

**Alternativas:** adaptadores externos o soporte incremental según demanda.

**Costo relativo:** bajo-medio si se reutiliza la infraestructura de D11; alto si se exige soporte universal.

## **AC01-QA06-10 · Compatibilidad entre consumidores y proveedores**

**Prioridad:** integración externa.

**Clasificación:** BRECHA NUEVA.

### **Problema profesional**

Una nueva versión de una API puede cumplir su propio schema y, simultáneamente, romper expectativas de aplicaciones consumidoras existentes.

Validar únicamente la versión actual no siempre detecta regresiones de integración.

### **Escenario**

Un servicio cambia una enumeración, elimina un campo utilizado por otra aplicación o modifica el comportamiento de una respuesta manteniendo una estructura aparentemente válida.

### **Evidencia**

REQ-QA-002 y AV-05 §4 regulan conformidad de la API actual. No se identifica una obligación explícita de gestionar contratos dirigidos por consumidores y su compatibilidad cruzada.

Pact documenta precisamente este tipo de verificación entre consumidores y proveedores.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://docs.pact.io\&sz=32)

Pact Docs



### **Propuesta**

Permitir relacionar casos y afirmaciones con contratos de interacción externos versionados.

QAP debería poder conservar:

- Identidad y versión de consumidor y proveedor.
- Contrato esperado.
- Estado o prerrequisito del proveedor.
- Resultado de verificación externa.
- Alcance acreditado.
- Dependencias afectadas.

No incorporar obligatoriamente un broker de contratos ni requerir acceso al código fuente de los servicios.

### **Criterios verificables de aceptación**

- Importar una interacción contractual autorizada y su procedencia.
- Detectar incompatibilidad de una interacción requerida.
- Diferenciar modificación compatible de cambio potencialmente incompatible.
- No declarar verificada una versión distinta de la evaluada.
- No convertir automáticamente un resultado externo en PASS canónico.
- Mantener separados los resultados de schema, contrato y efecto empresarial.

**Actores:** SDET, desarrolladores, QA de integraciones.

**Dependencias:** QA-04, conectores, versionado y autoridad de resultados.

**Riesgos:** falsos positivos de compatibilidad y confianza excesiva en reportes externos.

**Alternativas:** herramienta externa existente, comparación declarativa de versiones y evaluación manual.

**Costo relativo:** bajo-medio mediante integración; alto mediante construcción de una plataforma propia.

## **AC01-QA06-11 · Virtualización y simulación avanzada de dependencias**

**Prioridad:** integración externa con contrato básico esencial.

**Clasificación:** PRECISAR CONTRATO.

### **Problema profesional**

No siempre es posible producir legítimamente fallos de proveedores externos.

El QA necesita evaluar cómo responde su aplicación cuando una dependencia falla, devuelve resultados incoherentes o tarda demasiado.

### **Escenario**

Un sistema empresarial consulta un proveedor de identidad, validación, pagos o emisión documental.

El QA necesita probar rechazo, retraso, indisponibilidad y resultado parcial sin efectuar operaciones reales.

### **Evidencia**

AV-04 §5 contempla simulación y sandbox QA para operaciones críticas. AV-05 gobierna conectores y egress.

El archivo `intercept-network.ts` contiene un antecedente de sustitución de respuestas HTTP, pero su alcance no equivale a virtualización empresarial completa.

### **Propuesta**

Definir un perfil de dependencia por escenario:

| Modalidad       | Significado                                       |
| --------------- | ------------------------------------------------- |
| Real autorizada | Servicio auténtico bajo autorización.             |
| Sandbox         | Entorno de pruebas proporcionado por el servicio. |
| Simulada        | Comportamiento controlado por un doble de prueba. |
| Reproducción    | Interacción previamente registrada y autorizada.  |
| No disponible   | Dependencia no utilizable para ese escenario.     |

Conservar identidad, versión, fidelidad declarada, limitaciones y comportamiento de la dependencia.

Un resultado obtenido mediante simulación acredita el comportamiento del AUT bajo esas condiciones simuladas, no el funcionamiento real del proveedor.

### **Criterios verificables de aceptación**

- Simular respuesta sana.
- Simular indisponibilidad o timeout.
- Simular respuesta válida estructuralmente pero incompatible con la expectativa.
- Verificar el comportamiento empresarial ante esos resultados.
- Confirmar ausencia de egress hacia un servicio real no autorizado.
- Diferenciar prueba contra sandbox de prueba contra doble simulado.
- Rechazar acreditaciones de integración real basadas únicamente en mocks.

**Testigo:** evidencia de la dependencia controlada, operación observada y estado empresarial resultante.

### **Dependencias y riesgos**

Dependencias: QA-04, QA-05, política de red, adaptadores y oráculos.

Riesgos: mocks desactualizados, redirección accidental a servicios reales y falsas garantías de integración.

Alternativas: herramientas externas de virtualización, sandbox del proveedor o fixtures aislados.

**Costo relativo:** medio mediante adaptación; muy alto si se construye un motor multiprotocolo propio.

No se recomienda seleccionar ni construir dicho motor en esta etapa.

## **AC01-QA06-12 · Validación y regresión de migraciones de datos del AUT**

**Prioridad:** posterior, reutilizando capacidades básicas del lanzamiento.

**Clasificación:** BRECHA NUEVA.

### **Problema profesional**

Las actualizaciones empresariales pueden modificar datos históricos, estructuras, catálogos, estados y relaciones.

Una migración puede completarse técnicamente y dejar datos empresariales incorrectos.

### **Escenario**

Una nueva versión transforma contratos históricos y modifica la representación de condiciones, saldos o estados.

El QA necesita comprobar que las transformaciones fueron correctas y que no se perdieron registros ni relaciones.

### **Evidencia**

AR-41 y AV-07 regulan la migración y el corte de **QAP**. No equivalen a una capacidad de QA sobre las migraciones del **AUT**.

La validación de origen y destino documentada por AWS DMS muestra la relevancia de esta categoría de pruebas.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://docs.aws.amazon.com\&sz=32)

AWS Database Migration Service



### **Propuesta**

Incorporar posteriormente perfiles específicos de validación de migraciones empresariales, con:

- Revisiones de origen y destino.
- Inventarios acreditados.
- Mapeos y transformaciones esperados.
- Reglas de correspondencia.
- Pérdidas permitidas y no permitidas.
- Integridad de relaciones.
- Invariantes y conciliaciones.
- Cambios ocurridos durante la ventana de observación.

QAP debe evaluar la migración, no ejecutarla ni modificar la infraestructura del AUT.

### **Criterios verificables de aceptación**

- Detectar pérdida de registros.
- Detectar claves duplicadas.
- Detectar modificaciones de precisión.
- Detectar relaciones huérfanas.
- Reconocer transformaciones legítimas.
- Identificar resultados no comparables por cambios concurrentes.
- Mantener incertidumbre cuando no existe una fuente suficiente de origen.

**Actores:** QA de datos, responsables de migración, analistas empresariales y auditoría.

**Dependencias:** AC01-QA06-02/08, fuentes autorizadas, comparador de poblaciones.

**Riesgos:** acceso indiscriminado a datos históricos y falsa equivalencia entre snapshots no comparables.

**Alternativas:** herramientas externas de validación de migraciones o importación de conjuntos saneados.

**Costo relativo:** alto para soporte especializado.

El lanzamiento puede resolver casos básicos reutilizando comparaciones de poblaciones autorizadas. No recomiendo exigir una plataforma universal de validación de migraciones desde v1.

# **8. Capacidades empresariales transversales**

## **8.1. Exactitud financiera y contable**

La base existente ya proporciona un tratamiento adecuado de exactitud decimal, escalas, tolerancias, monedas, fechas y redondeos.

No propongo un nuevo requisito genérico de cálculo monetario porque duplicaría ORA-001.4 y AV-04 §7.

Sí recomiendo incorporar al corpus empresarial ejemplos representativos:

| Escenario   | Afirmación                                                  |
| ----------- | ----------------------------------------------------------- |
| Comisión    | Aplicación de tasa y base correctas.                        |
| Impuesto    | Regla, exención y redondeo acreditados.                     |
| Descuento   | Elegibilidad y precedencia.                                 |
| Interés     | Periodo, base y método acreditados.                         |
| Cuotas      | Correspondencia entre capital, intereses y otros conceptos. |
| Saldo       | Consistencia entre movimientos y saldo.                     |
| Reversión   | Conservación de trazabilidad y efecto inverso autorizado.   |
| Multimoneda | Tipo de cambio, fecha efectiva y moneda correcta.           |
| Cierre      | Periodo, zona horaria y población de operaciones correctos. |

QAP no debe inventar tasas, fórmulas, regulaciones contables o tolerancias.

El TypedRuleOracle debe evaluar reglas acreditadas; no convertirse en un sistema financiero propio.

## **8.2. Integridad temporal**

Los sistemas empresariales necesitan distinguir entre fecha de creación, fecha efectiva, fecha de modificación, fecha de contabilización y fecha de corte.

Ejemplo: una tasa puede aprobarse en enero, comenzar su vigencia en febrero y ser consultada en marzo.

El cálculo histórico no debe utilizar automáticamente la tasa vigente al momento de reproducir la prueba.

Esta precisión encaja en FrozenRegionalContext, versionado de reglas y AC01-QA06-08. No exige una nueva arquitectura de tiempo ni una base de datos bitemporal obligatoria.

# **9. Validación funcional de reportes AUT**

## **9.1. Evaluación de D11**

**D11 debe preservarse íntegramente.**

La separación establecida en AV-05 entre lectura pasiva, semántica Excel y regla empresarial independiente es correcta.

**Archivo realmente emitido por el AUT**

Bytes, filtros, población, revisión y autoridad

**Plano 1**

Extracción

Filas, valores y fórmulas

**Plano 2**

Semántica documental

Recálculo y representación

**Plano 3**

Regla de negocio

Expectativa independiente

**Conciliación y evaluación**

No confundir consistencia interna con exactitud empresarial

## **9.2. Caso ilustrativo de falso PASS**

Supóngase un reporte con los siguientes registros esperados y observados.

| Registro | Esperado | Reporte AUT |
| -------- | -------- | ----------- |
| A        | $1,000   | $1,000      |
| B        | $2,000   | $1,500      |
| C        | $3,000   | $3,500      |
| Total    | $6,000   | $6,000      |

Validación únicamente del total

### **Coincide**

Conciliación por registro

### **2 discrepancias**

El total correcto no acredita la exactitud de los registros individuales.

Esto ya se encuentra contemplado en AV-05 §2. Debe conservarse como prueba obligatoria y no contabilizarse como requisito nuevo.

## **9.3. AR-20**

AR-20 debe mantener su condición bloqueante por clase.

No recomiendo:

- Sustituir Excel por CSV como mecanismo ordinario.
- Considerar un PDF válido únicamente porque contiene texto extraíble.
- Acreditar cálculos por coincidencia de valores cacheados.
- Declarar cumplimiento basándose en un subconjunto de formatos no ratificado.
- Exigir conversión manual ordinaria de documentos.
- Dar por equivalente cualquier motor de recálculo disponible.

AC-01 no proporciona motivo para reducir estas garantías.

# **10. Contraste mediante escenarios profesionales**

Los escenarios siguientes constituyen análisis en papel. No han sido ejecutados y no representan resultados experimentales.

| Escenario                          | Modalidad               | Resultado profesional esperado                                      |
| ---------------------------------- | ----------------------- | ------------------------------------------------------------------- |
| Alta y aprobación de contrato      | Autónoma                | Verificar reglas, roles, estados y efectos.                         |
| Preparación de clientes por API    | Determinista            | Dataset reproducible y efectos confirmados.                         |
| Validación de condiciones manuales | Humana sin IA           | Registrar observaciones y evaluar oráculos acreditados disponibles. |
| Revisión de reporte Excel          | Híbrida                 | Conciliación automática y revisión localizada de incertidumbres.    |
| Importación de registros por lote  | Determinista            | Resultado individual y reconciliación.                              |
| Dos reservas simultáneas           | Automatizada controlada | Verificación de invariante conjunta.                                |
| Generación documental asíncrona    | Autónoma                | Espera acreditada y resultado terminal real.                        |
| Fallo de proveedor externo         | Simulada                | Verificación del AUT sin operación externa real.                    |
| Comparación entre instancias       | Lectura/híbrida         | Diferencias, procedencia y equivalencia autorizada.                 |
| Regresión de datos histórica       | Determinista            | Reutilización de condiciones vigentes o indicación de drift.        |
| Handoff entre QA y agente          | Híbrida                 | Reutilizar casos, datos y estado sin conceder nuevos permisos.      |

## **10.1. Escenario compuesto principal**

Una empresa necesita validar el proceso de solicitud y formalización de un contrato.

1

**Dataset acreditado**

Cliente sintético, condiciones y revisión

2

**Solicitud por API**

Operación autorizada y efecto confirmado

3

**Evaluación por UI**

Perfil y reglas empresariales aplicables

4

**Aprobación por segundo rol**

Transición y permisos acreditados

5

**Generación asíncrona**

Correlación, evento y estado terminal

6

**Consulta de contrato**

Identidad, relaciones e importes

7

**Validación PDF / Excel**

Población, cálculos y fuente independiente

8

**Conciliación y cleanup**

Efectos secundarios y disposición autorizada

El flujo debe poder detectar, entre otros, los siguientes mutantes:

| Mutante hipotético                                  | Resultado exigido                        |
| --------------------------------------------------- | ---------------------------------------- |
| HTTP 201 seguido de rollback confirmado             | FAIL                                     |
| Aprobación realizada por actor prohibido            | FAIL                                     |
| Contrato duplicado por reenvío                      | FAIL                                     |
| Estado terminal todavía desconocido                 | INDETERMINATE, según causa               |
| Reconciliación impedida por permiso                 | BLOCKED, conservando riesgos             |
| Regla contable contradictoria sin resolver          | INDETERMINATE                            |
| Documento descargado con fila incorrecta acreditada | FAIL                                     |
| Evidencia requerida alterada                        | Veto de integridad                       |
| Cleanup pendiente                                   | No aceptación de campaña                 |
| Fixture caducado e incompatible                     | Bloqueo o incertidumbre conforme a causa |
| Reporte generado desde población incompleta         | No PASS de conciliación global           |

La clasificación concreta del agregado debe derivarse siempre de AR-52 v2.0, no de códigos específicos creados por esta especialidad.

# **11. Aplicabilidad a industrias distintas de la financiera**

Una limitación importante sería diseñar QAP alrededor de clientes, contratos, solicitudes y préstamos como entidades estructurales obligatorias.

Estas son entidades representativas de una industria, no conceptos universales de QA.

| Industria        | Entidades y procesos             | Invariantes relevantes              |
| ---------------- | -------------------------------- | ----------------------------------- |
| Financiera       | Clientes, créditos, movimientos  | Saldo, precisión, autorización      |
| Retail           | Pedidos, pagos, devoluciones     | Existencias, descuentos, totales    |
| Logística        | Envíos, rutas, entregas          | Estados, cantidades, trazabilidad   |
| Manufactura      | Órdenes, lotes, materiales       | Consumo, rendimiento, relaciones    |
| Salud            | Citas, expedientes sintéticos    | Autoridad, privacidad, integridad   |
| Seguros          | Pólizas, coberturas, siniestros  | Vigencia, elegibilidad, condiciones |
| Educación        | Inscripciones, evaluaciones      | Créditos, cupos, reglas académicas  |
| SaaS empresarial | Usuarios, suscripciones, tenants | Aislamiento, límites, facturación   |

Todos estos dominios pueden reutilizar un conjunto reducido de conceptos:

Entidad, relación, estado, transición, regla, configuración, operación, efecto, población y testigo.

**Recomendación:** el núcleo debe proporcionar estos conceptos transversales. Los perfiles empresariales, vocabularios y reglas particulares deben permanecer como conocimiento o extensiones autorizadas.

No se recomienda incorporar paquetes industriales obligatorios sin una necesidad de cliente acreditada.

# **12. Impacto sobre los modelos lógicos de QAP**

## **12.1. Modelo conceptual propuesto**

**Conocimiento acreditado**

Reglas, relaciones, configuraciones, contratos y autoridad

**Biblioteca de pruebas**

Casos, escenarios, variantes y obligaciones

**Biblioteca de datos**

Recetas, datasets y revisiones

**Plan congelado + DataPlan**

Identidad, contexto, permisos y preparación

**Ejecución y efectos**

Intentos, subefectos y observaciones

**Testigos y oráculos**

Afirmaciones y comparaciones acreditadas

**Repositorio canónico**

Hechos, resultados, evidencia, defectos, historial y custodia

Este modelo es exclusivamente conceptual.

No prescribe nuevas bases de datos, microservicios, módulos físicos o escritores independientes.

## **12.2. Identidades y referencias necesarias**

| Identidad conceptual     | Finalidad                                            |
| ------------------------ | ---------------------------------------------------- |
| Dataset y revisión       | Reutilización controlada.                            |
| Materialización          | Identificar las entidades realmente utilizadas.      |
| Configuración y revisión | Reproducir condiciones empresariales.                |
| Contrato y revisión      | Acreditar compatibilidad y expectativas.             |
| Identidad de entidad     | Correlacionar efectos y relaciones.                  |
| Población observada      | Delimitar afirmaciones sobre conjuntos.              |
| Grupo concurrente        | Relacionar participantes de un escenario simultáneo. |
| Evento correlacionado    | Identificar consecuencias asíncronas.                |
| Perfil de dependencia    | Distinguir real, sandbox y simulación.               |
| Obligación de afirmación | Trazabilidad del criterio evaluado.                  |

Antes de crear nuevas entidades persistentes, el Orquestador debe comprobar qué conceptos pueden representarse mediante los contratos actuales de conocimiento, DataPlan, contexto, intentos y efectos.

# **13. Memoria y reproducibilidad**

## **13.1. Evaluación de la hipótesis del Orquestador**

La separación de conocimiento, casos, ejecuciones, defectos y reportes es razonable como división lógica.

No obstante, QA-06 identifica un riesgo si los datos de prueba se almacenan únicamente como contenido de una ejecución o como información auxiliar del caso.

Una receta empresarial reutilizable puede ser compartida por decenas de casos y revisiones.

Por ello, recomiendo reconocer explícitamente los datos de prueba como activos lógicos versionados.

Esto no justifica automáticamente un sexto dominio físico ni una nueva base de datos.

## **13.2. Información que debe permanecer diferenciada**

| Clase                         | Tratamiento                                              |
| ----------------------------- | -------------------------------------------------------- |
| Definición del dataset activo | Activo versionado reutilizable.                          |
| Restricciones empresariales   | Conocimiento acreditado.                                 |
| Datos materializados          | Artefactos de una ejecución y destino.                   |
| Resultado esperado            | Fuente y regla acreditadas.                              |
| Resultado observado           | Hecho histórico del intento.                             |
| Secretos                      | Custodia separada; nunca parte de una receta exportable. |
| Evidencia sensible            | Conservación según autorización.                         |
| Resumen histórico             | Proyección permanente conforme a DE-01.                  |

## **13.3. Reproducción tras poda**

Cuando el detalle histórico haya sido eliminado conforme a DE-01, QAP deberá distinguir entre:

- Reproducción posible mediante receta aún vigente.
- Reproducción posible con nuevos datos equivalentes.
- Reproducción condicionada a versiones o configuraciones no disponibles.
- Reproducción no posible por pérdida de prerrequisitos.
- Evidencia original expirada o suprimida.
- Resultado histórico conservado, pero no verificable actualmente en su totalidad.

No deberá prometer reconstruir datos exactos, documentos originales o evidencias que ya no existen.

# **14. Permisos y efectos empresariales**

## **14.1. Garantías que deben preservarse**

La investigación no recomienda modificar D07–D09 ni reducir las garantías AV-04/05.

| Operación                                             | Política                               |
| ----------------------------------------------------- | -------------------------------------- |
| Lectura acreditada en referencia                      | Permitida según autorización efectiva. |
| Lectura cuyo efecto es desconocido                    | Bloqueada.                             |
| Escritura en QA autorizada                            | Permitida según operación y política.  |
| Escritura en producción                               | Prohibida.                             |
| Copia de condiciones entre instancias                 | Transferencia mínima autorizada.       |
| Copia de credenciales o sesiones                      | Prohibida.                             |
| Operación financiera externa real indebida            | Prohibida.                             |
| Pago real, timbrado real o notificación real indebida | Prohibido.                             |
| Compensación                                          | Autorización independiente y testigo.  |
| Consulta de reconciliación                            | Autorización vigente propia.           |
| Acceso directo obligatorio a BD AUT                   | No requerido.                          |
| Exportación privada                                   | Autorización separada.                 |

## **14.2. Diferencia entre permiso y expectativa**

Una regla empresarial puede establecer que un rol del AUT debe poder aprobar una solicitud.

Eso no significa que QAP esté autorizado a ejecutar esa aprobación en cualquier instancia.

Deben mantenerse independientes:

- Permisos operacionales de QAP.
- Permisos del usuario del AUT.
- Expectativas funcionales.
- Autoridad de la fuente.
- Elegibilidad de la prueba.
- Acreditación obtenida.

La ejecución de una prueba negativa de permisos tampoco permite ampliar el alcance autorizado de QAP.

# **15. Impacto sobre aceptación, evidencias y compuertas**

## **15.1. Integración con las garantías existentes**

Los hallazgos deben incorporarse, si se ratifican, mediante deltas trazables sobre las pruebas existentes.

| Expediente existente | Impacto candidato                                                  |
| -------------------- | ------------------------------------------------------------------ |
| E1                   | Invariantes de datasets, poblaciones y DTO.                        |
| E2                   | Persistencia, autoridad, aislamiento y consultas históricas.       |
| E3                   | Recuperación de efectos concurrentes y asíncronos.                 |
| E4                   | Contratos, configuraciones y escenarios empresariales.             |
| E5                   | Integridad, oráculos, operaciones negativas y reconciliación.      |
| E6                   | Evidencia, custodia y presentación de discrepancias.               |
| E7                   | Paridad semántica entre consumidores.                              |
| E8                   | Corpus independiente de mutantes empresariales.                    |
| EXP-05a              | Distinción entre entradas internas inválidas y negativos AUT.      |
| EXP-05b              | Datasets, concurrencia controlada, eventos y lotes.                |
| EXP-06b              | D11 y reutilización de conciliación por poblaciones.               |
| G6.5                 | Escenarios empresariales representativos aplicables y autorizados. |

Esta tabla representa relaciones de impacto, no un nuevo plan de ejecución, un WBS ni autorización para iniciar experimentos.

## **15.2. Preservación de DE-03**

Se conservan los pisos ratificados:

Falsos PASS por afirmación

# **0**

Conformidad normativa

100%

Afirmaciones de efectos

85%

Casos compuestos de efectos

85%

Defectos desconocidos

90%

Defectos críticos

100%

E2E normativos

100%

Paridad de consumidores

100%

Pisos seleccionados de DE-03 para esta especialidad. No representan resultados de pruebas ejecutadas.

Los nuevos escenarios obligatorios ratificados deberán incorporarse con denominadores y rúbricas congelados antes de las evaluaciones correspondientes.

No se deben introducir nuevas obligaciones retrospectivamente en un corpus ya evaluado.

Tampoco deben reducirse los pisos existentes para acomodar la ampliación.

# **16. Evaluación de alternativas y capacidades innecesarias**

## **16.1. Distribución de responsabilidades**

| Capacidad                         | Núcleo QAP               | Integración               | Posterior       |
| --------------------------------- | ------------------------ | ------------------------- | --------------- |
| Datasets versionados              | Sí                       | Opcional                  |                 |
| Integridad de conjuntos           | Sí, acotada              | Opcional                  |                 |
| Reglas empresariales              | Sí                       |                           |                 |
| Estados y condiciones             | Sí                       |                           |                 |
| Concurrencia funcional controlada | Sí, acotada              | Opcional                  |                 |
| Procesos asíncronos               | Sí, evaluación           | Adaptadores               |                 |
| OpenAPI y UTCP                    | Sí, contrato común       | Implementación por puerto |                 |
| Negativos API                     | Sí, acotados             | Especializados            |                 |
| Reportes PDF/Excel AUT            | Sí, obligatorio          | Motores calificados       |                 |
| Validación de XML/CSV adicionales | Opcional                 | Sí                        | Posible         |
| Contratos consumer-driven         | Recepción y trazabilidad | Sí                        |                 |
| Virtualización avanzada           | Perfil y autoridad       | Sí                        |                 |
| Migraciones AUT                   | Comparadores básicos     | Sí                        | Especialización |
| Brokers y colas multiprotocolo    |                          | Selectiva                 | Sí              |
| Procesamiento masivo distribuido  |                          | Según necesidad           | Sí              |

## **16.2. Capacidades que no recomiendo construir**

| Capacidad                                            | Razón                                                    |
| ---------------------------------------------------- | -------------------------------------------------------- |
| Motor de base de datos propio                        | No corresponde al objetivo profesional de QAP.           |
| Motor contable universal                             | Las reglas dependen del dominio y autoridad empresarial. |
| Generador universal de identidades reales            | Riesgo de privacidad y ausencia de necesidad.            |
| Replicación íntegra de producción                    | Contraria a minimización y aislamiento.                  |
| SQL libre contra sistemas empresariales              | No necesario y aumenta riesgo.                           |
| Plataforma ETL completa                              | Excede la responsabilidad de QA.                         |
| Motor de mensajería propio                           | Debe integrarse cuando exista necesidad.                 |
| Plataforma universal de virtualización               | Complejidad innecesaria para el lanzamiento.             |
| Emulador universal de todos los ERP                  | Inviable como compromiso general.                        |
| Migrador de infraestructura AUT                      | Fuera de alcance y contrario a restricciones.            |
| Copias de seguridad destructivas para resetear AUT   | Riesgo no autorizado.                                    |
| Operaciones financieras reales como prueba ordinaria | Incompatible con las garantías.                          |
| Servicio de IA obligatorio para generar datos        | Contradice la operación autónoma y determinista.         |

No disponer de estas capacidades nativas no implica que QAP sea insuficiente como producto empresarial.

# **17. Evaluación independiente de las propuestas del Orquestador**

| Propuesta o hipótesis                          | Dictamen QA-06          | Condición                                                            |
| ---------------------------------------------- | ----------------------- | -------------------------------------------------------------------- |
| Autonomía local empresarial                    | Favorable               | Mantener D01–D04.                                                    |
| Trabajo sin IA                                 | Favorable               | Datasets, reglas y planes congelados deben ser reutilizables.        |
| Cinco dominios lógicos                         | Favorable con precisión | Reconocer datasets como activos lógicos, sin nueva base obligatoria. |
| Receta de reproducción                         | Favorable               | Incluir revisión de datos y condiciones, no solo pasos.              |
| APIs para preparar prerrequisitos              | Favorable               | No sustituir pruebas UI necesarias.                                  |
| Cross-instancia                                | Favorable condicionado  | Preservar autoridad y procedencia.                                   |
| Validación PDF/Excel                           | Favorable               | Mantener AR-20 y tres planos independientes.                         |
| Integración con herramientas especializadas    | Favorable               | Nunca heredar acreditación automáticamente.                          |
| Simulación de dependencias                     | Favorable               | Diferenciar alcance simulado y real.                                 |
| Ampliación a cualquier industria               | Favorable como diseño   | Sin prometer universalidad acreditada.                               |
| Memoria permanente de todo                     | Desfavorable            | Incompatible con minimización y DE-01.                               |
| Nuevos motores especializados por cada área QA | Desfavorable            | Incremento de complejidad sin justificación.                         |

La recomendación favorable a la arquitectura existente no se basa en consenso con el Orquestador, sino en la cobertura normativa encontrada en D07–D11 y AV-04/05.

# **18. Decisiones que requieren intervención del propietario**

No todas las precisiones contractuales necesitan convertirse en nuevas decisiones empresariales independientes.

Sin embargo, ampliar capacidades obligatorias, costos o riesgos de lanzamiento requiere ratificación expresa.

## **DC-QA06-01 · Amplitud del QA de datos**

| Alternativa         | Alcance                                                                                |
| ------------------- | -------------------------------------------------------------------------------------- |
| **A — Recomendada** | Integridad, relaciones, unicidad y conciliación declarativa acotada desde lanzamiento. |
| B                   | Limitar comprobaciones a casos individuales y reportes D11.                            |
| C                   | Construir una plataforma completa de calidad de datos.                                 |

Recomiendo A. B limita la utilidad empresarial; C aumenta innecesariamente el alcance.

## **DC-QA06-02 · Concurrencia funcional intencional**

| Alternativa         | Alcance                                                                              |
| ------------------- | ------------------------------------------------------------------------------------ |
| **A — Recomendada** | Escenarios funcionales simultáneos acotados, bajo reserva y autorización específica. |
| B                   | Únicamente integración con herramientas externas.                                    |
| C                   | Diferir completamente estas pruebas.                                                 |

Recomiendo A, condicionada a preservar las garantías de AV-04 y AV-06.

## **DC-QA06-03 · Integraciones empresariales especializadas**

| Alternativa         | Alcance                                                                        |
| ------------------- | ------------------------------------------------------------------------------ |
| **A — Recomendada** | Núcleo genérico con evaluación de efectos asíncronos y adaptadores selectivos. |
| B                   | Limitar inicialmente el producto a operaciones síncronas.                      |
| C                   | Implementar soporte nativo universal de protocolos.                            |

Recomiendo A. B podría resultar incompatible con escenarios empresariales necesarios ya contemplados en D06 y AV-04; C introduce complejidad desproporcionada.

## **DC-QA06-04 · Migraciones del AUT y formatos adicionales**

| Alternativa         | Alcance                                                               |
| ------------------- | --------------------------------------------------------------------- |
| **A — Recomendada** | Reutilizar comparadores básicos y diferir capacidades especializadas. |
| B                   | Incorporar validación completa de migraciones desde lanzamiento.      |
| C                   | Excluir permanentemente la categoría.                                 |

Recomiendo A.

Estas decisiones candidatas deben consolidarse con los otros cinco perfiles antes de elevarse al propietario, evitando consultas redundantes.

# **19. Priorización interactiva de propuestas**

La siguiente vista permite examinar exclusivamente los hallazgos de cada categoría. Sus clasificaciones corresponden a recomendaciones de investigación, no a decisiones ratificadas.

### **Alcance recomendado por categoría**

TodasEsencialOpcionalIntegraciónPosterior

12 propuestas visibles

AC01-QA06-01

**Datasets y fixtures versionados**

DAT-001.1/2 · Costo relativo medio

Esencial

AC01-QA06-02

**Integridad y calidad de datos**

ORA / DAT · Costo relativo medio-alto

Esencial

AC01-QA06-03

**Condiciones y estados**

PLN / ORA · Costo relativo medio

Esencial

AC01-QA06-04

**Concurrencia funcional**

AR-43 / D16 · Costo relativo medio-alto

Esencial

AC01-QA06-05

**Procesos asíncronos**

ORA-001.6 · Costo relativo medio

Esencial

AC01-QA06-06

**Negativos de contratos API**

QA-002 · Costo relativo medio

Esencial

AC01-QA06-07

**Operaciones masivas**

DAT / AR-10 · Costo relativo medio

Esencial

AC01-QA06-08

**Configuraciones comparables**

XINST-001 · Costo relativo medio

Esencial

AC01-QA06-09

**Salidas adicionales**

DOC / AUTREP · Costo relativo bajo-medio

Opcional

AC01-QA06-10

**Contratos de consumidores**

QA-002 / INT · Costo relativo bajo-medio

Integración

AC01-QA06-11

**Virtualización avanzada**

INT / AV-04 · Costo relativo medio

Integración

AC01-QA06-12

**Migraciones del AUT**

Nueva capacidad · Costo relativo alto

Posterior

Los costos relativos son estimaciones cualitativas de complejidad funcional, no estimaciones de esfuerzo, presupuesto o duración.

# **20. Fuentes profesionales externas**

| ID  | Fuente primaria                                                                                                                                          | Aplicación                                    |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| F01 | [ISTQB CTFL v4.0.1](https://istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf?utm_source=chatgpt.com)                                  | Equivalencias, límites, decisiones y estados. |
| F02 | [ISO/IEC 25012:2008](https://www.iso.org/standard/35736.html?utm_source=chatgpt.com)                                                                     | Modelo general de calidad de datos.           |
| F03 | [RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html?utm_source=chatgpt.com)                                                          | Semántica HTTP e idempotencia.                |
| F04 | [OpenAPI 3.1.2](https://spec.openapis.org/oas/v3.1.2.html?utm_source=chatgpt.com)                                                                        | Contratos HTTP.                               |
| F05 | [AsyncAPI 3.0.0](https://www.asyncapi.com/docs/reference/specification/v3.0.0?utm_source=chatgpt.com)                                                    | Mensajes, operaciones y correlación.          |
| F06 | [CloudEvents 1.0.2](https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md?utm_source=chatgpt.com)                                          | Identidad y contexto de eventos.              |
| F07 | [OWASP API Security Top 10:2023](https://api-security.owasp.org/editions/2023/en/0x00-header/?utm_source=chatgpt.com)                                    | Riesgos de APIs y flujos empresariales.       |
| F08 | [PostgreSQL 18 — Transaction Isolation](https://www.postgresql.org/docs/18/transaction-iso.html?utm_source=chatgpt.com)                                  | Anomalías de concurrencia.                    |
| F09 | [Pact — Provider Verification](https://docs.pact.io/getting_started/verifying_pacts?utm_source=chatgpt.com)                                              | Verificación contractual entre servicios.     |
| F10 | [dbt — Data Tests](https://docs.getdbt.com/docs/build/data-tests?utm_source=chatgpt.com)                                                                 | Unicidad, completitud y relaciones.           |
| F11 | [Great Expectations — Data Uniqueness](https://docs.greatexpectations.io/docs/reference/learn/data_quality_use_cases/uniqueness/?utm_source=chatgpt.com) | Validaciones declarativas de poblaciones.     |
| F12 | [WireMock — Stateful Behaviour](https://wiremock.org/docs/stateful-behaviour/?utm_source=chatgpt.com)                                                    | Dependencias simuladas con estado.            |
| F13 | [WireMock — Simulating Faults](https://wiremock.org/docs/simulating-faults/?utm_source=chatgpt.com)                                                      | Simulación de errores.                        |
| F14 | [Stripe — Idempotent Requests](https://docs.stripe.com/api/idempotent_requests?utm_source=chatgpt.com)                                                   | Variaciones de idempotencia empresarial.      |
| F15 | [Stripe — Webhooks](https://docs.stripe.com/webhooks?utm_source=chatgpt.com)                                                                             | Eventos y procesos asíncronos.                |
| F16 | [AWS DMS — Data Validation](https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Validating.html?utm_source=chatgpt.com)                                | Conciliación de migraciones.                  |

Las referencias con versiones normativas explícitas se identifican en la tabla. Las páginas de documentación operativa sin versión fija constituyen evidencia consultada el 25 de noviembre de 2026, no dependencias tecnológicas seleccionadas.

# **21. Limitaciones y discrepancias**

La investigación debe interpretarse dentro de las siguientes limitaciones:

- El encargo AC-01 fue leído íntegramente y se verificó la identidad del SHA remoto.
- Se recuperaron los documentos obligatorios y se analizaron especialmente sus cláusulas relacionadas con QA-06.
- Algunos documentos extensos devolvieron resultados truncados; el análisis posterior recuperó las secciones pertinentes. No se acredita una revisión línea por línea de la totalidad de las 103 entradas, los 57 registros AR ni los 41 documentos del manifiesto.
- La inspección del código fue selectiva, orientada a archivos, contratos, manifests y pruebas relacionados con esta especialidad. No constituye una auditoría exhaustiva de todos los archivos del repositorio.
- Se consultaron fuentes primarias externas y documentación oficial. No se realizó una evaluación experimental comparativa de herramientas.
- No se afirma conformidad integral con ISO, ISTQB, OWASP ni otros marcos.
- No se verificó el funcionamiento de Lendus Core ni de otro AUT.
- Los ejemplos empresariales son hipotéticos y no contienen datos reales de clientes.
- Las recomendaciones de alcance y costo relativo requieren evaluación conjunta con los otros perfiles.

No se ha identificado una contradicción material normativa demostrada que obligue a invalidar globalmente AV-01–08.

Las cuestiones relativas a concurrencia intencional y pruebas negativas de API merecen contravalidación focalizada porque podrían generar incompatibilidades durante la implementación si se interpretan incorrectamente.

Los estados de AR-20, AR-41, AR-27 y demás reservas permanecen intactos.

# **22. Dictamen final al Orquestador Principal**

**Se recomienda ampliar de forma selectiva el alcance funcional de QAP antes de congelar el producto, preservando la arquitectura y garantías ya ratificadas.**

La base actual es especialmente sólida en autoridad, reconciliación, veracidad y tratamiento de efectos. No necesita reemplazarse.

La ampliación profesional más importante consiste en incorporar explícitamente la calidad de los datos y de sus relaciones como objeto de prueba, en lugar de considerar los datos únicamente como insumos de una ejecución.

Asimismo, resulta necesario asegurar que QAP pueda evaluar procesos empresariales cuya corrección depende de múltiples actores, operaciones simultáneas, configuraciones, eventos posteriores y poblaciones completas de registros.

Recomiendo al Orquestador:

1. Consolidar los ocho hallazgos esenciales con las propuestas coincidentes de las otras especialidades.
2. Separar nuevas obligaciones de precisiones existentes.
3. Elevar únicamente las decisiones empresariales materiales al propietario.
4. Contravalidar los deltas que afecten permisos, concurrencia, testigos y aceptación.
5. Preservar las capacidades D07–D11 y todas las garantías ratificadas.
6. Diferir tecnologías definitivas hasta disponer de requisitos consolidados.

La investigación QA-06 no recomienda convertir QAP en una colección ilimitada de herramientas especializadas. Recomienda convertirlo en una plataforma capaz de comprender, preparar, comprobar y documentar escenarios empresariales reales, con resultados verificables y reproducibles.

**Estado final:** INFORME ENTREGADO PARA CONSOLIDACIÓN DEL ORQUESTADOR.

**Autorizaciones emitidas:** ninguna.

**Cambios al repositorio:** ninguno.

**Experimentos, implementación, WBS, G0/G1 y accesos empresariales:** no iniciados.

**Fin de la investigación independiente AC-01 · QA-06.**