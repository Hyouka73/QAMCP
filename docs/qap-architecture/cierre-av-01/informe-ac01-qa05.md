# **AC-01 · Informe de investigación independiente QA-05**

## **Calidad no funcional, seguridad y experiencia de usuario**

| Identificación                | Valor                                            |
| ----------------------------- | ------------------------------------------------ |
| Destinatario                  | Orquestador Principal de QAP                     |
| Especialidad                  | QA-05 — Quality Engineering                      |
| Repositorio                   | `Hyouka73/QAMCP`                                 |
| Rama                          | `develop`                                        |
| SHA evaluado                  | `b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5`       |
| Fecha                         | 25 de noviembre de 2026                          |
| Modalidad                     | Investigación documental y análisis estático     |
| Naturaleza                    | Propuestas de alcance pendientes de ratificación |
| Experimentos ejecutados       | Ninguno                                          |
| Modificaciones al repositorio | Ninguna                                          |

# **1. Dictamen ejecutivo**

DICTAMEN DE LA ESPECIALIDAD QA-05

# **AMPLIACIÓN SELECTIVA DEL ALCANCE RECOMENDADA**

La arquitectura normativa existente constituye una base sólida para proteger la ejecución de QAP, pero necesita ampliar y precisar su capacidad para evaluar la calidad no funcional de las aplicaciones empresariales sometidas a prueba.

La principal conclusión de esta investigación es que existe una diferencia fundamental entre:

- Que QAP sea una herramienta segura, confiable, eficiente y accesible.
- Que QAP sea capaz de evaluar si otra aplicación es segura, confiable, eficiente y accesible.

La especificación consolidada desarrolla considerablemente la primera dimensión y contempla partes importantes de la segunda. Sin embargo, todavía no las cubre de manera equilibrada.

En particular, el rendimiento del AUT, la resiliencia funcional ante condiciones degradadas, la gestión sistemática de evaluaciones de seguridad, la compatibilidad de aplicaciones y la experiencia de usuario requieren contratos adicionales o precisiones.

No recomiendo convertir QAP en una plataforma que implemente internamente todos los motores especializados existentes. Eso aumentaría considerablemente el alcance, las dependencias, los riesgos y el mantenimiento sin garantizar mejores resultados.

Recomiendo que QAP sea propietario de la **intención, autorización, planificación, trazabilidad, evaluación, evidencia y conclusión de las pruebas**, independientemente de si la adquisición de evidencia utiliza capacidades propias, herramientas externas o intervención humana.

## **1.1. Propuestas resultantes**

Se identifican trece propuestas materiales, agrupadas según su alcance recomendado.

# **8**

**Lanzamiento obligatorio propuesto**

Capacidades básicas y precisiones de contratos existentes

# **2**

**Capacidades opcionales**

Activación según objetivos y contexto de campaña

# **2**

**Integraciones especializadas**

Sin imponer un motor propio ni dependencia obligatoria

# **1**

**Capacidad posterior**

Observabilidad continua y evaluación longitudinal

Estos números representan propuestas de investigación, no nuevos requisitos ratificados. Varias propuestas desarrollan obligaciones existentes y no deberían incrementar automáticamente el número de IDs del catálogo.

## **1.2. Impacto sobre AV-01–08**

No se identifica, dentro de la evidencia examinada, una razón suficiente para invalidar globalmente las decisiones adoptadas en AV-01–08.

Se recomienda conservar:

| Elemento                   | Disposición                  |
| -------------------------- | ---------------------------- |
| D01–D21                    | Preservar                    |
| DE-01 A                    | Preservar                    |
| DE-02 B                    | Preservar                    |
| DE-03 B                    | Preservar                    |
| DE-04 A con B de respaldo  | Preservar                    |
| DE-05 B                    | Preservar                    |
| AR-27                      | Preservar íntegramente       |
| AR-52 v2.0                 | Preservar íntegramente       |
| 103 entradas normativas    | No modificar unilateralmente |
| 57 registros AR            | No reclasificar              |
| Vetos no compensables      | Preservar                    |
| Autoridad única del núcleo | Preservar                    |
| HOST y DETERMINISTIC       | Preservar                    |
| MANAGED                    | Mantener diferido            |

La ampliación debe someterse a contravalidación focalizada de sus deltas, no a una repetición automática de las ocho auditorías.

# **2. Procedencia, metodología y limitaciones**

## **2.1. Identidad de la base**

El encargo AC-01 identifica como base común:

`303e621dbca4a3a3b17cb2bf32530ab6311edc92`

La solicitud del propietario identifica:

`b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5`

Se verificó mediante el conector de GitHub que el segundo commit está exactamente un commit por delante del primero.

Las únicas diferencias reportadas son:

| Archivo                                                         | Cambio              |
| --------------------------------------------------------------- | ------------------- |
| `cierre-av-01/README.md`                                        | Dos líneas añadidas |
| `cierre-av-01/encargo-ac01-evaluacion-multidisciplinaria-qa.md` | 52 líneas añadidas  |

Por tanto, no existe una divergencia material de código o especificación entre ambas referencias para este encargo.

[Comparación verificable de commits](https://github.com/Hyouka73/QAMCP/compare/303e621dbca4a3a3b17cb2bf32530ab6311edc92...b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5?utm_source=chatgpt.com).

## **2.2. Fuentes internas**

Se consultaron las siguientes fuentes principales, fijadas al SHA solicitado:

| Ref. | Fuente                                                                                                                                                                                                                 |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q01  | [Encargo vinculante AC-01](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/encargo-ac01-evaluacion-multidisciplinaria-qa.md?utm_source=chatgpt.com) |
| Q02  | [Especificación consolidada](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/especificacion-consolidada.md?utm_source=chatgpt.com)                               |
| Q03  | [Manifiesto normativo](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/manifiesto-normativo-consolidado.md?utm_source=chatgpt.com)                  |
| Q04  | [Catálogo de requisitos](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/catalogo-requisitos.md?utm_source=chatgpt.com)                                          |
| Q05  | [Acta D01–D21](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/acta-decisiones.md?utm_source=chatgpt.com)                                                        |
| Q06  | [Ratificación DE-01–05](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/acta-ratificacion-de.md?utm_source=chatgpt.com)                             |
| Q07  | [Matriz de aceptación AV-08](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/matriz-aceptacion-av08.md?utm_source=chatgpt.com)                      |
| Q08  | [Registro maestro AR](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/registro-maestro.md?utm_source=chatgpt.com)                                   |
| Q09  | [Resolución final de planificación](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/resolucion-final-planificacion.md?utm_source=chatgpt.com)       |

También se consultaron los documentos contractuales AV-02, AV-04, AV-05, CV06, CV07, CV08, CC08 y los documentos asociados a AR-27, con especial atención a sus cláusulas pertinentes.

## **2.3. Limitaciones de la investigación**

Se recuperó el encargo completo y la especificación consolidada. Se inspeccionó el árbol del repositorio, compuesto por 1,357 entradas, y se examinaron selectivamente código, manifests y pruebas relevantes.

La extensión de determinados contratos y contravalidaciones impidió verificar exhaustivamente, línea por línea, todas las fuentes incorporadas por el manifiesto. La revisión de esos documentos fue focalizada en las obligaciones de esta especialidad.

Por ello:

- No se certifica una auditoría exhaustiva de cada archivo del repositorio.
- Las brechas nuevas identificadas constituyen propuestas fundamentadas, sujetas a cotejo final de posibles cláusulas equivalentes.
- No se atribuyen resultados de ejecución a pruebas únicamente inspeccionadas.
- No se declara conformidad con normas ISO cuyo texto íntegro no se ha consultado.

Se utilizaron referencias profesionales públicas y documentación oficial, sin acceder a Lendus Core ni a otro sistema empresarial.

# **3. Modelo profesional de calidad**

ISO/IEC 25010:2023 proporciona un modelo de calidad de producto compuesto por nueve características. Es una referencia apropiada para ampliar la visión de QAP más allá de la corrección funcional, sin transformar automáticamente todas sus características en requisitos de lanzamiento.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.iso.org\&sz=32)

Product quality model+1



El siguiente mapa es una aplicación analítica de ese modelo al producto QAP, no una reproducción normativa íntegra del estándar.

## **3.1. Mapa de cobertura**

Cobertura normativa de diseño. No representa porcentaje implementado ni certificación.

| Característica                    | QAP como producto | QAP evaluando al AUT    |
| --------------------------------- | ----------------- | ----------------------- |
| Adecuación funcional              | Cubierta          | Cubierta                |
| Eficiencia de rendimiento         | Cubierta          | Insuficiente            |
| Compatibilidad                    | Cubierta          | Parcial                 |
| Capacidad de interacción          | Parcial           | Parcial                 |
| Fiabilidad                        | Cubierta          | Parcial                 |
| Seguridad                         | Cubierta          | Parcial                 |
| Mantenibilidad                    | Cubierta          | Integración externa     |
| Flexibilidad y adaptación         | Cubierta          | Parcial                 |
| Seguridad frente a daños — safety | Parcial           | Dependiente del dominio |

La accesibilidad y la internacionalización merecen tratamiento transversal explícito, independientemente de cómo se clasifiquen dentro de un modelo general.

**Hallazgo conceptual:** utilizar la cantidad de pruebas funcionales ejecutadas como indicador global de calidad produciría una representación incompleta del estado del AUT.

Un sistema puede realizar correctamente una operación y, simultáneamente, presentar latencia inaceptable, barreras de accesibilidad, deficiencias de seguridad o problemas bajo recuperación.

# **4. Flujo profesional de Quality Engineering**

Un especialista necesita intervenir antes, durante y después de la ejecución.

## **4.1. Actores consumidores**

| Actor                         | Necesidad principal                                             |
| ----------------------------- | --------------------------------------------------------------- |
| QA funcional                  | Detectar problemas no funcionales durante recorridos ordinarios |
| QA de seguridad               | Evaluaciones negativas controladas, aislamiento y evidencia     |
| Performance Engineer          | Medición reproducible, perfiles de carga y cuellos de botella   |
| Especialista en accesibilidad | Cobertura automática y humana verificable                       |
| SDET                          | Automatización sostenible y regresiones de calidad              |
| Desarrollador                 | Diagnóstico reproducible de defectos                            |
| SRE / Operaciones             | Confiabilidad, recuperación y comportamiento degradado          |
| Product Owner                 | Riesgo residual y decisión informada                            |
| Auditor                       | Procedencia, alcance, evidencia y restricciones                 |
| Agente HOST                   | Contexto acreditado y operaciones elegibles                     |

QAP no debe asumir todas las responsabilidades de estos actores. Debe proporcionarles una plataforma común que permita conservar sus hallazgos, decisiones y evidencias sin confundir observación con acreditación.

# **5. Capacidades existentes que no deben duplicarse**

Antes de proponer ampliaciones resulta obligatorio reconocer las garantías ya establecidas.

| Área                             | Cobertura normativa existente     | Clasificación |
| -------------------------------- | --------------------------------- | ------------- |
| Autorización de operaciones      | SEG-001.1–001.3, D07, AR-31/47    | CUBIERTO      |
| Separación de perfiles y tenants | MEM-002.1–002.2, AR-04/14         | CUBIERTO      |
| Seguridad funcional RBAC         | CAS-001.2, ORA-001.5, AR-53       | CUBIERTO      |
| Testigo de ausencia de efectos   | ORA-001.5, AV-04 §7               | CUBIERTO      |
| Gestión de credenciales          | SEG-002.1–002.2, D20, AR-07       | CUBIERTO      |
| Custodia multimedia              | SEG-002.3, POL-CAP, AR-27/32      | CUBIERTO      |
| Visor autenticado y confinado    | AR-24, M1–M5                      | CUBIERTO      |
| Seguridad de parsers             | AV-05 §3, AR-22                   | CUBIERTO      |
| Revocación y cancelación         | SEG-001.3, RUN-001.5, AR-47       | CUBIERTO      |
| Recuperación de QAP              | D03/D05, MEM-002.3, RUN-001.4     | CUBIERTO      |
| Rendimiento de QAP               | D16, REQ-OPT-001, EXP-03, CV06-03 | CUBIERTO      |
| Portabilidad de QAP              | D14, INT-001.2, AR-16/37          | CUBIERTO      |
| Internacionalización básica      | REQ-QA-001, D17, AR-04/45         | CUBIERTO      |
| Contratos de API                 | REQ-QA-002, AV-05                 | CUBIERTO      |
| Accesibilidad                    | REQ-QA-003, DE-05 B, AR-35        | CUBIERTO      |
| Seguridad de dependencias        | AR-51, CV07-06                    | CUBIERTO      |
| Integridad de resultados         | D12, AR-52, DE-03                 | CUBIERTO      |

La clasificación CUBIERTO significa que la obligación existe en la especificación compuesta, no que haya sido implementada o acreditada.

# **6. Contraste con el código actual**

## **6.1. Evidencia estática relevante**

| Ref. | Localizador al SHA evaluado                                                                                                                                                                                | Observación                                                                                                  |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| C01  | [`case-execution-policy.ts`, L5–15](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/playwright-runner/src/case-execution-policy.ts?utm_source=chatgpt.com#L5-L15) | Bloqueo de categorías BVA y RBAC negativo, además de interceptación y cambio de autenticación no acreditados |
| C02  | [`network-observer/types.ts`](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/playwright-adapter/src/network-observer/types.ts?utm_source=chatgpt.com)            | Observaciones con duración, resultado HTTP, límites y estado de adquisición                                  |
| C03  | [`network-observer/privacy.ts`](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/playwright-adapter/src/network-observer/privacy.ts?utm_source=chatgpt.com)        | Referencias opacas mediante HMAC, filtrado de nombres de parámetros y patrones estructurales acotados        |
| C04  | [`runner.ts`, L457–545](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/playwright-runner/src/runner.ts?utm_source=chatgpt.com#L457-L545)                         | Creación de contexto y página del navegador                                                                  |
| C05  | [`reporter/server/server.ts`, L58–61](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/reporter/src/server/server.ts?utm_source=chatgpt.com#L58-L61)               | CORS con origen comodín y métodos que incluyen POST, PATCH y DELETE                                          |
| C06  | [`network-observer.test.ts`](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/playwright-adapter/src/__tests__/network-observer.test.ts?utm_source=chatgpt.com)    | Pruebas de egress, redirecciones, CORS, DNS, límites, privacidad y persistencia                              |
| C07  | [`runner-safety-honesty.test.ts`](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/playwright-runner/test/runner-safety-honesty.test.ts?utm_source=chatgpt.com)    | Regresiones dirigidas a falsos éxitos, ausencia de casos y fallos de infraestructura                         |
| C08  | [`playwright-runner/package.json`](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/playwright-runner/package.json?utm_source=chatgpt.com)                         | Dependencias declaradas del ejecutor actual                                                                  |
| C09  | [`playwright-adapter/package.json`](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/packages/playwright-adapter/package.json?utm_source=chatgpt.com)                       | Dependencias declaradas del adaptador actual                                                                 |

## **6.2. Interpretación**

La existencia de campos como `duration_ms` no demuestra una capacidad profesional de performance testing.

La existencia de pruebas negativas de seguridad sobre QAP no demuestra que QAP pueda evaluar sistemáticamente la seguridad de un AUT.

El bloqueo incondicional de determinadas categorías RBAC en C01 representa una limitación de implementación de obligaciones ya reconocidas. No debe convertirse en un requisito nuevo.

La política CORS observada en C05 constituye evidencia de una incompatibilidad potencial con el objetivo del visor autenticado y de solo lectura. Debe tratarse conforme a AR-24 y los contratos existentes. Los encabezados, por sí solos, no prueban una explotación efectiva.

Las pruebas inspeccionadas en C06 y C07 son activos valiosos que deberían preservarse, sin confundir su existencia con resultados satisfactorios actuales.

# **7. Matriz de hallazgos priorizados**

Se asignan identificadores provisionales conforme a AC-01.

| ID provisional | Propuesta                                             | Clasificación        | Alcance recomendado |
| -------------- | ----------------------------------------------------- | -------------------- | ------------------- |
| QA05-01        | Perfil de evaluación no funcional                     | BRECHA NUEVA         | Esencial            |
| QA05-02        | Evaluación sistemática de seguridad funcional         | PRECISAR CONTRATO    | Esencial            |
| QA05-03        | Medición sintética de rendimiento del AUT             | BRECHA NUEVA         | Esencial            |
| QA05-04        | Rendimiento de carga, estrés y capacidad              | BRECHA NUEVA         | Integración externa |
| QA05-05        | Fiabilidad y recuperación funcional del AUT           | PRECISAR CONTRATO    | Esencial            |
| QA05-06        | Matriz de compatibilidad del AUT                      | PRECISAR CONTRATO    | Esencial            |
| QA05-07        | Evaluación accesible humana e híbrida                 | PRECISAR CONTRATO    | Esencial            |
| QA05-08        | Internacionalización ampliada                         | PRECISAR CONTRATO    | Opcional            |
| QA05-09        | Usabilidad y regresión visual                         | BRECHA NUEVA/PARCIAL | Opcional            |
| QA05-10        | Admisión segura de evaluadores externos               | PRECISAR CONTRATO    | Esencial            |
| QA05-11        | Seguridad adversarial de QAP y HOST                   | PRECISAR CONTRATO    | Esencial            |
| QA05-12        | Análisis especializado de seguridad y mantenibilidad  | BRECHA NUEVA         | Integración externa |
| QA05-13        | Observabilidad continua y disponibilidad longitudinal | BRECHA NUEVA         | Posterior           |

Los identificadores completos son `AC01-QA05-01` a `AC01-QA05-13`.

No se proponen trece nuevos requisitos independientes por defecto. El Orquestador deberá integrar cada delta en el contrato existente más apropiado.

# **8. Desarrollo de propuestas**

## **8.1. AC01-QA05-01 — Perfil de evaluación no funcional**

Brecha nueva

Esencial para lanzamiento

**Problema profesional.** Una campaña puede ejecutar correctamente casos funcionales sin determinar qué características de calidad eran exigibles, cómo medirlas o qué condiciones harían inválida una conclusión.

**Escenario.** Un QA debe evaluar una nueva versión de una aplicación financiera antes de su liberación, combinando funcionalidad, accesibilidad, latencia y autorización.

**Actores.** QA Lead, Quality Engineer, propietario y desarrollador.

**Evidencia.** Q02 §§4, 7 y 10 desarrolla planificación, recursos y aceptación, pero no identifica un contrato transversal completo de evaluación no funcional del AUT. ISO/IEC 25010:2023 permite estructurar dichas características de calidad.

**Requisitos afectados.** PLN-001.1–001.6, CAS-001.2–001.4, ORA-001.1–001.7, REP-001.1–001.4, D12 y D21.

### **Propuesta**

Incorporar un perfil lógico versionado de evaluación no funcional, reutilizando los modelos canónicos de caso, plan, alcance y oráculo.

El perfil debería contener:

```
QualityAssessmentProfile:
  identity:
  revision:
  quality_characteristic:
  assessment_target:
  objective:
  expectation_source:
  applicable_scope:
  assessment_method:
  metric_definition:
  acceptance_threshold:
  witness_requirements:
  environment_constraints:
  permitted_operations:
  resource_budget:
  stop_conditions:
  evidence_policy:
  coverage_obligations:
  known_limitations:
```

Este esquema es conceptual y no constituye una selección tecnológica ni una definición de almacenamiento.

Debe distinguir cuatro modalidades de evaluación.

**Observación pasiva**

Adquirir información de operaciones ya autorizadas, sin introducir tráfico adicional deliberado.

**Evaluación sintética**

Ejecutar recorridos reproducibles dentro de un perfil de entorno y presupuesto.

**Evaluación activa acotada**

Operaciones específicas autorizadas, con límites de efecto, intensidad y duración.

**Evaluación humana o externa**

Adquisición especializada de evidencia, conservando procedencia y autoridad.

**Dependencias.** QA-01 para planificación y riesgo; QA-02 para autoría manual; QA-03 para reportes.

**Riesgos.** Multiplicar entidades redundantes o confundir el perfil con un grant.

**Alternativas.** Extender el modelo canónico de caso con obligaciones medibles, o utilizar una revisión de perfil referenciada por múltiples casos. Se recomienda la segunda como estructura lógica reutilizable, sin imponer entidad física independiente.

**Aceptación verificable.** Definir una campaña con tres características, modificar posteriormente un umbral y comprobar que los intentos históricos conservan la revisión original. Un perfil sin fuente acreditada puede generar observaciones, pero no PASS de conformidad. Un perfil importado nunca concede autoridad.

## **8.2. AC01-QA05-02 — Evaluación sistemática de seguridad funcional**

Precisar contrato

Esencial para lanzamiento

**Problema profesional.** RBAC es indispensable, pero no representa todo el espacio de seguridad funcional de aplicaciones empresariales.

OWASP ASVS 5.0.0 y WSTG 4.2 ofrecen referencias para organizar controles de autenticación, autorización, sesión, entradas y otras superficies de seguridad. OWASP API Security Top 10:2023 complementa esta perspectiva para APIs.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://owasp.org\&sz=32)

OWASP Foundation+2



**Escenario.** Una aplicación permite consultar clientes, aprobar solicitudes y descargar documentos. El especialista necesita comprobar permisos por operación, objeto, campo, estado y sesión.

**Actores.** QA Security, QA funcional, responsables de seguridad y desarrollo.

**Evidencia interna.** AV-04 §7 establece controles positivos y negativos, ausencia de efectos y divulgación, perfiles separados y testigos N2/N3 según riesgo. C01 muestra la limitación de implementación ya reconocida.

**Requisitos afectados.** CAS-001.2, ORA-001.5, SEG-001.1–001.3, SEG-002.2, REQ-QA-002, D07, D12, AR-31 y AR-53.

### **Propuesta**

Precisar una biblioteca extensible de objetivos de seguridad funcional.

| Familia       | Objetivo                                                           |
| ------------- | ------------------------------------------------------------------ |
| Autenticación | Comportamiento ante sesión ausente, expirada o inválida            |
| Sesión        | Cierre, revocación, caducidad y cambios de identidad               |
| Autorización  | Restricciones verticales y horizontales                            |
| Tenant        | Aislamiento entre organizaciones y perfiles                        |
| Datos         | Restricciones por recurso y campo                                  |
| Estados       | Impedir transiciones no permitidas                                 |
| Entradas      | Validaciones de límites, formatos y contenido de prueba autorizado |
| Auditoría     | Verificar eventos exigidos por reglas acreditadas                  |
| Transporte    | Observación autorizada de controles y configuración                |
| Divulgación   | Ausencia de información restringida en respuestas y artefactos     |

No se exige implementar todo ASVS ni WSTG. Las referencias externas serán versionadas y seleccionadas por pertinencia.

Las pruebas negativas contra el AUT son operaciones reales sujetas a autorización. La expectativa de que una operación vaya a ser denegada no convierte su ejecución en una lectura segura.

**Dependencias.** QA-06 para reglas de negocio, identidad, APIs y testigos independientes.

**Riesgos.** Acciones negativas sobre datos reales; falsa seguridad derivada de probar solamente ocultación de botones; confusión entre autorización de QAP y autorización del AUT.

**Alternativas.** Casos nativos declarativos, ejecución manual guiada o evaluación externa. Los tres métodos pueden coexistir.

**Aceptación verificable.**

- Control autorizado que confirma que el flujo sano funciona.
- Control negativo con identidad y objeto sintéticos diferenciados.
- Mutante que aparenta denegar, pero produce un efecto lateral: debe detectarse.
- Mutante que oculta el botón, pero permite una operación indebidamente: no debe obtener PASS.
- Cuando no exista testigo suficiente de ausencia de divulgación, declarar incertidumbre.
- Si falta autorización para ejecutar el control, bloquear antes del despacho.

**Disposición.** Refinamiento de seguridad funcional existente, no creación de un motor de pentesting obligatorio.

## **8.3. AC01-QA05-03 — Rendimiento sintético del AUT**

Brecha nueva

Esencial para lanzamiento

**Problema profesional.** D16 y REQ-OPT-001 regulan principalmente los recursos consumidos por QAP. No constituyen una obligación suficiente de medir la experiencia temporal del AUT.

**Escenario.** Una solicitud se registra correctamente, pero tarda diez segundos en presentar una confirmación cuya expectativa empresarial es menor.

Una campaña funcional podría aprobar el efecto y omitir la degradación de rendimiento.

**Evidencia interna.** C02 registra `duration_ms`, pero define resultados de observación parciales o indeterminados. Q04 considera Web Vitals una capacidad opcional. Ninguna de estas condiciones equivale a un contrato completo de rendimiento.

**Referencia profesional.** ISTQB reconoce performance testing como una especialidad diferenciada. Las métricas Web Vitals también distinguen mediciones controladas de laboratorio y experiencia de usuarios reales.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://test.istqb.org\&sz=32)

test.istqb.org+2



### **Propuesta**

Incorporar mediciones básicas reproducibles sobre operaciones funcionales ya autorizadas, sin exigir un motor de generación masiva de carga.

| Métrica                        | Unidad      | Testigo                        |
| ------------------------------ | ----------- | ------------------------------ |
| Latencia de operación          | ms          | Inicio y fin definidos         |
| Tiempo hasta estado utilizable | ms          | Condición funcional observable |
| Tiempo de convergencia         | ms          | Estado terminal acreditado     |
| Tasa de errores                | %           | Intentos y resultados tipados  |
| Volumen transferido            | bytes       | Observación de red autorizada  |
| Distribución de latencia       | p50/p95/p99 | Muestras y método documentados |

Los percentiles solamente deben calcularse y utilizarse como criterio de aceptación cuando exista una muestra suficiente para el objetivo definido.

Registrar como mínimo versión del AUT, entorno, perfil de hardware, navegador, red, estado frío/caliente, modo de captura, estado inicial, cantidad de muestras y unidad temporal.

### **Separación causal**

Diagrama conceptual. Los segmentos no representan mediciones realizadas.

No atribuir toda la duración del runner al AUT. Tampoco sustraer automáticamente el overhead de QAP cuando existan interacciones no lineales con el navegador, la captura o la instrumentación.

**Dependencias.** QA05-01, ORA-001.6, REP-001.2, AV-06.

**Riesgos.** Mediciones contaminadas, comparaciones de entornos distintos y umbrales arbitrarios.

**Alternativas.** Medición integrada mínima, herramienta externa de laboratorio o adquisición manual. Recomiendo medición integrada mínima con soporte de evidencia externa.

**Aceptación verificable.** Dos fixtures equivalentes salvo una demora introducida deliberadamente. Con un umbral y protocolo congelados, QAP distingue el control sano del degradado. Un resultado funcional PASS puede coexistir con una obligación de rendimiento FAIL. Una máquina saturada o muestra insuficiente no produce un falso PASS.

No propongo umbrales universales de latencia para todos los AUT.

## **8.4. AC01-QA05-04 — Carga, estrés, resistencia y capacidad**

Brecha nueva

Integración externa

**Problema profesional.** Las operaciones individuales no permiten inferir cómo se comportará un sistema bajo concurrencia o demanda prolongada.

**Escenario.** Un equipo necesita validar que su ambiente de preproducción puede soportar un volumen determinado de solicitudes simultáneas.

**Actores.** Performance Engineer, SRE, infraestructura y propietario del AUT.

**Evidencia.** Herramientas especializadas como k6 admiten escenarios y umbrales configurables, incluyendo condiciones de interrupción. Esto demuestra una capacidad existente en el ecosistema que QAP no necesita reconstruir necesariamente.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://grafana.com\&sz=32)

Grafana k6 documentation+1



### **Propuesta**

Distinguir objetivos especializados:

| Tipo          | Objetivo                                 |
| ------------- | ---------------------------------------- |
| Carga         | Comportamiento bajo demanda prevista     |
| Estrés        | Comportamiento fuera de demanda habitual |
| Pico          | Respuesta ante incremento abrupto        |
| Resistencia   | Degradación durante operación prolongada |
| Capacidad     | Límites sostenibles del sistema          |
| Escalabilidad | Relación entre recursos y demanda        |

Un futuro adaptador podrá ejecutar o importar evaluaciones cuyos perfiles especifiquen:

- Intensidad, duración y crecimiento máximo.
- Destino, entorno y operaciones permitidas.
- Volumen de datos sintéticos y cleanup.
- Objetivos de latencia, throughput y tasa de errores.
- Límites externos de consumo y criterio de parada.
- Responsable autorizado e información de supervisión.

**Restricción esencial:** los workers concurrentes de QAP no deben convertirse implícitamente en usuarios virtuales contra el AUT.

D16 gobierna la concurrencia de trabajo de QAP; no concede un permiso para generar carga sobre sistemas externos.

**Dependencias.** QA05-01, QA05-10 y QA-04.

**Riesgos.** Agotamiento de recursos, costos externos, efectos acumulados, degradación del entorno y pruebas irreproducibles.

**Alternativas.** Importación manual de resultados, integración con herramientas especializadas o motor propio. No recomiendo el motor propio para el primer lanzamiento.

**Aceptación verificable futura.** Un simulador autorizado recibe un perfil acotado. Al alcanzarse el criterio de parada, se impide admitir nuevo trabajo y se verifica la terminación del evaluador. Las peticiones ya enviadas se consideran conforme a sus efectos reales. Una cancelación incompleta se refleja como tal.

**Decisión empresarial requerida.** Cualquier autorización para generación activa de carga, presupuesto o impacto externo debe ratificarse separadamente.

Producción y referencia permanecen fuera de estas pruebas de carga.

## **8.5. AC01-QA05-05 — Fiabilidad y recuperación funcional del AUT**

Precisar contrato

Esencial para lanzamiento

**Problema profesional.** La recuperación de QAP ante interrupciones no demuestra la capacidad del AUT para conservar consistencia, recuperar operaciones o manejar condiciones degradadas.

**Escenario.** Durante el registro de una solicitud, la conexión del cliente se interrumpe después de que el servidor haya recibido la operación.

**Evidencia.** Q02 §§4–5, REQ-RUN-001.4 y AV-04 §§4–6 ya desarrollan reconciliación, idempotencia y efectos desconocidos. La ampliación consiste en evaluar deliberadamente la fiabilidad del AUT dentro de condiciones autorizadas.

**Requisitos afectados.** RUN-001.4–001.5, ORA-001.3/5/6, CAS-001.2, AR-10/43, D06, D07 y D12.

### **Propuesta**

Permitir que los casos definan condiciones de degradación acotadas y resultados esperados.

| Condición                         | Testigo exigible                                |
| --------------------------------- | ----------------------------------------------- |
| Interrupción del cliente          | Estado confirmado mediante fuente independiente |
| Respuesta tardía                  | Estado final y ventana de convergencia          |
| Expiración de sesión              | Protección de identidad y datos                 |
| Error recuperable                 | Continuidad funcional conforme a contrato       |
| Repetición autorizada             | Ausencia de duplicados indebidos                |
| Dependencia simulada indisponible | Estado y error esperado                         |
| Fallo parcial                     | Reconciliación y consistencia de subefectos     |

Distinguir explícitamente:

- Fallo real observado.
- Simulación controlada.
- Fallo del entorno.
- Fallo de instrumentación.
- Defecto acreditado del AUT.

**Dependencias.** QA-06 para consistencia eventual y operaciones de negocio; QA-04 para mecanismos de simulación.

**Riesgos.** Simular condiciones no representativas, producir efectos externos o atribuir al AUT un fallo provocado por QAP.

**Alternativas.** Simulación en fixture, adaptador autorizado, evaluación manual o plataforma especializada de caos. La modificación de infraestructura empresarial queda fuera del alcance inicial.

**Aceptación verificable.** Ante un fallo posterior a un efecto confirmado, el sistema conserva la correlación, consulta el estado acreditado y detecta una duplicación sembrada. Si la condición solo fue simulada, el reporte no la presenta como prueba de resiliencia real de producción.

## **8.6. AC01-QA05-06 — Compatibilidad del AUT**

Precisar contrato

Esencial para lanzamiento

**Problema profesional.** La matriz SO/CPU/navegador de QAP acredita que el producto puede instalarse y operar. No define por sí sola las combinaciones que una aplicación empresarial debe soportar.

**Escenario.** Un formulario funciona en Chromium, pero un control de fecha o una descarga falla en otra combinación soportada por el AUT.

**Evidencia.** D14/D15, REQ-RUN-002.1, AR-16/37, CV06-01/02 ya exigen fidelidad, portabilidad y combinaciones efectivamente calificadas.

### **Propuesta**

Mantener dos matrices conceptualmente independientes.

**Compatibilidad de QAP**

¿Puede ejecutarse correctamente la herramienta?

SO, arquitectura, runtime, host, navegador, instalación, captura y reproducción.

**Compatibilidad del AUT**

¿Funciona la aplicación en sus perfiles soportados?

Navegador, viewport, interacción, versión, locale, capacidades y condiciones del usuario.

La matriz del AUT será definida por proyecto. No se exige probar todas las combinaciones posibles en cada campaña.

Reutilizar identidades de casos y variar exclusivamente el contexto de ejecución cuando la intención funcional sea la misma.

**Dependencias.** MEM-002.1, CAS-001.3/4, REQ-RUN-002.1 y CV06.

**Riesgos.** Explosión combinatoria, sustitución silenciosa de motores, equivalencia incorrecta entre emulación y dispositivo real.

**Alternativas.** Matrices locales limitadas, ejecución externa sobre dispositivos o verificación manual. La nube de dispositivos no será dependencia obligatoria.

**Aceptación verificable.** Un caso se ejecuta en dos perfiles previamente acreditados. Un defecto específico de uno de ellos se reporta sin generalizarlo al otro. Un perfil no disponible se declara no evaluado, nunca aprobado mediante sustitución silenciosa.

No se seleccionan navegadores adicionales de manera definitiva.

## **8.7. AC01-QA05-07 — Accesibilidad humana, automática e híbrida**

Precisar contrato

Esencial para lanzamiento

**Problema profesional.** Un resultado sin incidencias automáticas no equivale a una evaluación completa de accesibilidad.

W3C establece que verificar criterios de éxito de WCAG requiere una combinación de pruebas automatizadas y evaluación humana. WCAG-EM 2.0 desarrolla una metodología de evaluación de alcance y muestreo.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.w3.org\&sz=32)

W3C+1



**Evidencia interna.** CV06-07, CV08-09, CC08-06, AR-35 y DE-05 B ya establecen matrices separadas, controles sanos y mutantes, estados dinámicos, procedimientos manuales y restricciones de egress.

No considero esto una brecha normativa completa.

### **Propuesta**

Precisar el flujo de trabajo humano e híbrido necesario para ejecutar las obligaciones ya ratificadas.

| Área                   | Automatización posible | Evaluación humana        |
| ---------------------- | ---------------------- | ------------------------ |
| Nombre y rol accesible | Parcial/alta           | Adecuación semántica     |
| Contraste              | Según superficie       | Contextos y excepciones  |
| Navegación por teclado | Parcial                | Recorrido y comprensión  |
| Gestión del foco       | Parcial                | Orden significativo      |
| Texto alternativo      | Presencia              | Calidad y pertinencia    |
| Formularios y errores  | Parcial                | Comprensión y asistencia |
| Tecnologías de apoyo   | Parcial                | Experiencia real         |
| Reflow y ampliación    | Parcial                | Utilización efectiva     |

Estados lógicos de cada comprobación:

`EVALUADA`, `PENDIENTE_MANUAL`, `NO_APLICA`, `NO_EVALUABLE`, `BLOQUEADA`.

Estos son estados de cobertura de la comprobación, no veredictos alternativos a AR-52.

### **Preservación expresa de DE-05 B**

La política debe determinar antes de la ejecución qué campañas o estados son críticos y activar los controles pertinentes automáticamente.

En las campañas restantes, conservar opt-in.

La cobertura obligatoria de certificación del producto QAP no puede depender de desactivar evaluaciones durante campañas ordinarias.

**Dependencias.** QA-02 para ejecución guiada sin IA; QA-03 para reportes y evidencia; REQ-QA-003.

**Riesgos.** Declarar cumplimiento WCAG por scanner, omitir estados dinámicos o bloquear tráfico legítimo del AUT.

**Alternativas.** Motor automatizado local y revisión humana acreditada, con posibilidad de integrar tecnología especializada.

**Aceptación verificable.** Un fixture contiene un defecto automatizable y otro que requiere evaluación humana. QAP detecta el primero y conserva abierta la segunda obligación. Un QA humano completa el procedimiento sin modelo de IA, adjuntando evidencia permitida. La revisión queda atribuida al actor y no se convierte automáticamente en PASS canónico sin cumplir el contrato probatorio.

No se modifica DE-05.

## **8.8. AC01-QA05-08 — Internacionalización y localización ampliadas**

Precisar contrato

Opcional según proyecto

**Problema profesional.** Traducir textos correctamente no garantiza que una aplicación sea utilizable bajo otros sistemas de escritura, calendarios o convenciones regionales.

**Evidencia.** REQ-QA-001, D17, AR-04/45 y AV-04 §7 ya establecen idioma, locale, zonas, moneda, valores, truncamiento y cambio de idioma durante ejecución.

Unicode UTS #35 y CLDR proporcionan referencias versionadas para reglas de localización y representación de datos.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.unicode.org\&sz=32)

unicode.org+1



### **Propuesta**

Extender los perfiles regionales cuando la aplicación declare dichos mercados o capacidades.

| Área             | Casos pertinentes                            |
| ---------------- | -------------------------------------------- |
| Texto            | Unicode, acentos, caracteres combinados      |
| Dirección        | Escritura derecha a izquierda cuando aplique |
| Diseño           | Expansión y contracción de textos            |
| Búsqueda         | Ordenación, equivalencias y acentos          |
| Datos            | Monedas, unidades y separadores              |
| Fechas           | Calendarios, zonas y cambios horarios        |
| Documentos       | Consistencia de PDF/Excel y exportaciones    |
| Cambio de idioma | Conservación de estado e intención           |

No imponer RTL, calendarios adicionales o todos los sistemas de escritura a cualquier AUT.

**Dependencias.** REQ-QA-001, D10/D11/D17, QA-06 y QA-03.

**Riesgos.** Tratar una diferencia válida de representación como defecto funcional o aceptar un cambio real de valor como simple formato.

**Alternativas.** Perfiles declarativos y corpus regionales extensibles. La evaluación lingüística especializada puede realizarse manualmente.

**Aceptación verificable.** Un caso cambia entre dos locales, preserva su valor semántico y detecta una alteración real. Cuando el proyecto declara RTL, se añade un control de dirección y composición visual.

La recomendación opcional afecta a la ampliación regional avanzada. No degrada los requisitos obligatorios ya existentes de internacionalización.

## **8.9. AC01-QA05-09 — Usabilidad y regresión visual**

Brecha nueva parcial

Capacidad opcional

**Problema profesional.** Una interfaz puede ser técnicamente funcional, pero difícil de utilizar, confusa o visualmente degradada.

**Escenario.** Un formulario permite completar una solicitud, aunque el usuario no comprende qué campos faltan o no puede localizar fácilmente la acción principal.

**Evidencia.** Q04 conserva la regresión visual del AUT como opcional. M1–M5 cubren aspectos visuales y de interacción de QAP y sus reportes, no una metodología general de usabilidad del AUT.

### **Propuesta**

Incorporar dos capacidades diferenciadas.

**A. Evaluación de usabilidad por tareas**

Registrar objetivo del usuario, pasos, errores observados, necesidad de asistencia, finalización y comentarios atribuidos.

Pueden calcularse métricas descriptivas como tasa de finalización, tiempo por tarea o errores observados, siempre con población y contexto explícitos.

**B. Regresión visual autorizada**

Comparar estados equivalentes con baseline versionado, viewport, fuentes, idioma, tema, zonas dinámicas excluidas y tolerancias acreditadas.

Baseline autorizado

Diferencia localizada

Ejemplo esquemático de comparación visual, no captura de un AUT real.

Una diferencia visual puede ser esperada, irrelevante, un defecto o una condición indeterminada. No toda diferencia debe generar FAIL.

**Dependencias.** AR-27, DE-01/02, QA-02/03, fidelidad visual.

**Riesgos.** Almacenamiento ilimitado, capturas sensibles, baselines obsoletos, falsos positivos por contenido dinámico.

**Alternativas.** Comparación geométrica/semántica, imágenes autorizadas, evaluación humana y motor externo.

**Aceptación verificable.** Detectar un control oculto por superposición. No declarar defecto por un dato dinámico expresamente excluido. Si no existe autorización para conservar imágenes, registrar evidencia ausente sin fabricar una comparación visual aprobada.

**Disposición.** Mantener opcional. No justificar un nuevo motor de visión obligatorio para v1.

## **8.10. AC01-QA05-10 — Admisión segura de evaluadores externos**

Precisar contrato

Esencial para lanzamiento

**Problema profesional.** Las herramientas externas pueden facilitar capacidades de QA no funcional, pero también convertirse en un segundo ejecutor con autoridad independiente, redes no gobernadas o acceso no controlado a evidencia.

**Evidencia.** INT-001.4 y AV-05 ya desarrollan conectores, aislamiento y contratos de operaciones. Es necesario precisar su aplicación a evaluadores que generan tráfico, inspeccionan datos o importan resultados.

### **Propuesta**

Extender el contrato existente de integración, sin introducir otro escritor ni conceder autoridad a un resultado importado.

El contrato deberá exigir identidad y revisión del evaluador, procedencia, capacidades declaradas, destinos y permisos, presupuesto, control de egress, custodia de temporales, cancelación, resultado estructurado y limitaciones.

### **Regla crítica**

Importar resultados externos no equivale a acreditar automáticamente su conclusión.

Un resultado firmado puede acreditar procedencia e integridad del documento, pero no demuestra por sí mismo que se ejecutó la evaluación correcta sobre el destino correcto.

**Dependencias.** INT-001.4, AV-05, AR-28/31/51, QA-04.

**Riesgos.** Bypass de autoridad, fuga de secretos, consumo ilimitado y escalada de permisos mediante plugins.

**Alternativas.** Importación pasiva, evaluador confinado local o servicio externo expresamente autorizado.

**Aceptación verificable.** Un adaptador simulado intenta ampliar su destino o acceder a evidencia no concedida. QAP impide la operación y registra el incidente. Un resultado externo sin contexto suficiente no puede producir PASS canónico. La retirada del adaptador no destruye el histórico autorizado.

La capacidad de registrar e importar evidencia especializada debe diferenciarse de la obligación de integrar un proveedor concreto.

## **8.11. AC01-QA05-11 — Seguridad adversarial de QAP y HOST**

Precisar contrato

Esencial para lanzamiento

**Problema profesional.** QAP procesa contenido potencialmente hostil procedente de páginas, documentos, respuestas de APIs, evidencias, plugins y resultados anteriores.

En un sistema asistido por agentes, este contenido también puede intentar influir en decisiones del HOST. OWASP identifica la inyección indirecta de instrucciones y el abuso de herramientas como riesgos específicos de sistemas agénticos.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://genai.owasp.org\&sz=32)

OWASP Gen AI Security Project+2



**Evidencia.** SEG-001.2, D20, AR-28, AV-05 §3 y el modelo epistémico ya establecen que contenido, DOM, documentos y HOST no conceden autoridad.

Por tanto, el problema no es una ausencia total de diseño, sino la necesidad de formular familias verificables de controles adversariales.

### **Propuesta**

Formalizar una matriz de amenazas que preserve las fronteras ya aceptadas.

| Superficie            | Propiedad que debe acreditarse                            |
| --------------------- | --------------------------------------------------------- |
| Contenido del AUT     | No amplía permisos                                        |
| Documentos importados | No se convierten en instrucciones privilegiadas           |
| Resultados externos   | No acreditan autoridad                                    |
| Memoria persistente   | No promueve observaciones a reglas acreditadas            |
| Handoff               | No transmite grants ni secretos indebidamente             |
| HOST                  | No puede saltarse el núcleo                               |
| Exportaciones         | No introducen ejecución activa o divulgación no permitida |
| Actualización         | No incorpora componentes fuera de procedencia aprobada    |

Debe evaluarse tanto la prevención como el comportamiento seguro ante un intento de abuso.

Complementar AR-51 con un procedimiento de recepción, triage, mitigación y comunicación de vulnerabilidades del propio QAP. NIST SSDF 1.1 constituye una referencia pública para este ciclo de desarrollo y respuesta a vulnerabilidades.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://csrc.nist.gov\&sz=32)

csrc.nist.gov+1



**Dependencias.** AR-28/51/52, SEG, MEM, DOC, REP y CV07.

**Riesgos.** Confiar en que el agente ignorará siempre contenido hostil, prometer aislamiento absoluto frente a un adversario fuera del modelo de amenaza o revelar incidentes mediante logs.

**Alternativas.** Filtros preventivos, separación de autoridad, ejecución confinada y revisión especializada. Los filtros del HOST por sí solos son insuficientes.

**Aceptación verificable.** Contenido sintético intenta introducir una regla no acreditada, ampliar un destino y provocar divulgación de un canario. Ninguna acción obtiene autoridad. Tras reanudación, el contenido conserva su naturaleza de dato no confiable. La detección de una posible incidencia no sustituye las barreras deterministas.

No se propone que QAP garantice la seguridad de todas las herramientas externas al sistema de autoridad que realmente controla.

## **8.12. AC01-QA05-12 — Análisis especializado de seguridad y mantenibilidad**

Brecha nueva

Integración externa

**Problema profesional.** Una organización puede necesitar análisis estático, composición de software, análisis dinámico especializado, evaluación de configuración y mantenibilidad.

QAP opera principalmente como plataforma de pruebas funcionales y evaluación de sistemas. No necesariamente dispone del código fuente, infraestructura o inventario completo del AUT.

### **Propuesta**

Permitir registrar e integrar resultados de estas categorías cuando exista autorización independiente.

| Capacidad                              | Tratamiento recomendado                         |
| -------------------------------------- | ----------------------------------------------- |
| SAST                                   | Integración con herramienta autorizada          |
| SCA                                    | Importación de resultados y trazabilidad        |
| DAST                                   | Integración específica bajo reglas de operación |
| Análisis de configuraciones            | Evidencia externa o manual                      |
| Calidad estática del código            | Integración de desarrollo                       |
| SBOM del AUT                           | Importación autorizada                          |
| Evaluación criptográfica especializada | Especialista externo                            |
| Pentesting                             | Actividad especializada separada                |

La documentación de ZAP muestra que incluso su modalidad de análisis baseline realiza exploración del destino antes de procesar hallazgos pasivos. Por tanto, la etiqueta «pasivo» de una herramienta no permite presumir ausencia de tráfico activo.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.zaproxy.org\&sz=32)

Baseline Scan+1



NIST SP 800-115 distingue métodos de evaluación, sus limitaciones y la necesidad de reglas de operación establecidas antes de realizar pruebas de seguridad.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://csrc.nist.gov\&sz=32)

csrc.nist.gov+1



**Requisitos afectados.** INT-001.4, SEG-001.1, D07, D12 y AR-51.

**Dependencias.** QA05-10, QA-04 y responsables de seguridad.

**Riesgos.** Acceso al código empresarial sin permiso, exploración involuntaria de producción, falsos positivos y herramientas con procesos secundarios no confinados.

**Alternativas.** Registro manual, importación de resultados estructurados o ejecución gobernada futura.

**Aceptación verificable.** Importar dos hallazgos externos, conservar su fuente, versión, alcance y evidencia; deduplicar únicamente cuando exista equivalencia acreditada. Una alerta no validada no se convierte automáticamente en vulnerabilidad confirmada.

**Disposición.** No implementar un escáner universal de vulnerabilidades como requisito de lanzamiento.

## **8.13. AC01-QA05-13 — Disponibilidad y observabilidad continua**

Brecha nueva

Fase posterior

**Problema profesional.** La disponibilidad y confiabilidad longitudinal de un servicio requieren observaciones distribuidas en el tiempo y denominadores definidos.

Una campaña aislada que termina satisfactoriamente no demuestra disponibilidad mensual o cumplimiento de un SLA.

**Escenario.** Una aplicación presenta interrupciones breves durante determinadas horas que no son detectadas por una campaña puntual.

### **Propuesta futura**

Permitir consumir fuentes autorizadas de observabilidad y evaluar indicadores como:

| Indicador             | Condición                                 |
| --------------------- | ----------------------------------------- |
| Disponibilidad        | Ventana temporal y unidad de servicio     |
| Tasa de error         | Denominador de solicitudes válidas        |
| Latencia longitudinal | Distribución y segmentación               |
| Recuperación          | Definición de incidente y restauración    |
| SLO/SLA               | Fuente de objetivo acreditada             |
| Tendencias            | Comparabilidad entre versiones y periodos |

No convertir QAP v1 en una plataforma APM, SIEM o servicio de monitorización distribuida permanente.

**Dependencias.** QA05-01/03/10, QA-03, futura modalidad de integración y ejecución prolongada.

**Riesgos.** Dependencia de infraestructura, retención excesiva, acceso continuo a producción y conclusiones sesgadas por muestreo.

**Alternativas.** Importar observaciones históricas, consultar una plataforma autorizada o incorporar programación local en una etapa posterior.

**Aceptación verificable futura.** Un conjunto de datos contiene intervalos disponibles, indisponibles y sin observación. QAP diferencia los tres estados y no cuenta automáticamente la ausencia de información como tiempo disponible.

# **9. Modelo de medición y testigos**

## **9.1. Distinción fundamental de métricas**

Recomiendo mantener tres ámbitos separados.

| Ámbito     | Qué mide                    | Ejemplo                                       |
| ---------- | --------------------------- | --------------------------------------------- |
| QAP        | Calidad del instrumento     | Memoria, tokens, tiempo de planificación      |
| AUT        | Calidad del objeto evaluado | Latencia de registro, errores, accesibilidad  |
| Evaluación | Calidad de la evidencia     | Cobertura, muestras, precisión, incertidumbre |

La eficiencia de QAP no debe utilizarse como sustituto de la evaluación del rendimiento del AUT.

Una mejora del tiempo de ejecución de una campaña tampoco garantiza una mejora de la aplicación probada.

## **9.2. Métricas y criterios por característica**

| Característica   | Métrica candidata                | Perfil y testigo                             | Parada o abstención                              |
| ---------------- | -------------------------------- | -------------------------------------------- | ------------------------------------------------ |
| Seguridad        | Controles satisfechos y violados | Identidades y reglas acreditadas             | Revocación, cambio de alcance, efecto inesperado |
| Latencia         | Duración y percentiles válidos   | Reloj, evento inicial y final                | Presupuesto o medición contaminada               |
| Carga            | Throughput, errores, latencia    | Perfil de demanda y herramienta autorizada   | Intensidad máxima o umbral de seguridad          |
| Fiabilidad       | Recuperaciones y consistencia    | Estado independiente y correlación           | Riesgo de duplicación o efecto desconocido       |
| Compatibilidad   | Celdas evaluadas y defectos      | Perfil de plataforma fijado                  | Plataforma no acreditada                         |
| Accesibilidad    | Cobertura por criterio y estado  | Regla y evaluación humana cuando corresponda | Superficie no autorizada                         |
| Usabilidad       | Finalización y errores por tarea | Procedimiento y actor                        | Condición no comparable                          |
| Localización     | Divergencias semánticas          | Locale y expectativa versionados             | Contexto regional no determinado                 |
| Regresión visual | Diferencias relevantes           | Baseline y tolerancia autorizados            | Captura no elegible                              |
| Disponibilidad   | Tiempo observado disponible      | Ventana y fuente de observación              | Cobertura temporal insuficiente                  |

Ninguna métrica puede convertirse automáticamente en criterio de aceptación si no tiene fuente, unidad, denominador y significado establecidos.

## **9.3. Diferencia entre umbral y presupuesto de seguridad**

Es necesario distinguir:

**Umbral de aceptación:** determina si el AUT satisface una expectativa.

**Presupuesto de ejecución:** limita los recursos y efectos que QAP puede consumir.

**Criterio de parada:** impide continuar una evaluación cuando existe una condición de seguridad, revocación, agotamiento o invalidez.

Un umbral de rendimiento incumplido puede producir FAIL acreditado. Un presupuesto agotado antes de obtener evidencia suficiente puede producir otro estado conforme a AR-52.

No deben confundirse.

# **10. Evaluación conjunta sin modificar AR-52**

Se conserva la taxonomía vinculante:

`PASS`, `FAIL`, `INDETERMINATE`, `BLOCKED`, `SKIPPED`, `ERROR`.

Se conservan también los cuatro ejes independientes:

| Eje                  | Finalidad                                |
| -------------------- | ---------------------------------------- |
| `technical_status`   | Estado técnico                           |
| `functional_verdict` | Evaluación conforme al contrato vigente  |
| `cleanup_status`     | Estado de limpieza                       |
| `evidence_health`    | Integridad y disponibilidad de evidencia |

La incorporación de características de calidad plantea una cuestión semántica: el nombre `functional_verdict` podría interpretarse como limitado a funcionalidad.

**No recomiendo renombrar unilateralmente el campo ni crear un séptimo veredicto.**

Recomiendo que el Orquestador estudie una precisión contractual para representar evaluaciones no funcionales como obligaciones tipadas, conservando la reducción y el significado exacto de AR-52.

### **Ejemplo conceptual**

Caso: registrar una solicitud

Resultado ilustrativo de un escenario hipotético

Registro y persistencia

PASS

Autorización requerida

PASS

Objetivo de latencia

FAIL

Accesibilidad manual

Pendiente

**No elegible para aprobación integral de las obligaciones requeridas.**

La operación puede ser funcionalmente correcta y presentar simultáneamente una degradación no funcional.

Una obligación requerida no satisfecha no puede ocultarse mediante el promedio de otras evaluaciones.

El significado de la reducción final deberá quedar establecido mediante enmienda focalizada, preservando los vetos y cuatro ejes.

# **11. Contraste de herramientas existentes**

El análisis de alternativas tiene por objeto determinar fronteras funcionales, no elegir tecnología.

| Herramienta o familia   | Capacidad observable                     | Papel potencial en QAP                     |
| ----------------------- | ---------------------------------------- | ------------------------------------------ |
| Playwright              | Automatización de navegador y recorridos | Adquisición funcional y medición sintética |
| k6                      | Perfiles de carga y umbrales             | Evaluador especializado externo            |
| JMeter y equivalentes   | Generación de carga                      | Alternativa a investigar                   |
| ZAP                     | Evaluación web de seguridad              | Integración acotada y autorizada           |
| axe-core y equivalentes | Reglas automatizables de accesibilidad   | Candidato de evaluación automática         |
| Lighthouse / Web Vitals | Diagnósticos de experiencia web          | Evaluación opcional de laboratorio         |
| Tecnologías de apoyo    | Interacción accesible real               | Evaluación humana o híbrida                |
| Plataformas APM         | Observabilidad temporal                  | Fuente externa posterior                   |
| Herramientas SAST/SCA   | Seguridad y análisis de componentes      | Evidencia externa especializada            |

La documentación de k6, ZAP y Web Vitals acredita ejemplos concretos de capacidades disponibles y sus diferencias de alcance.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://grafana.com\&sz=32)

Grafana k6 documentation+2



Las demás alternativas se mencionan como categorías o candidatos, no como productos calificados en esta investigación.

## **11.1. Frontera recomendada**

El valor diferencial de QAP no tiene por qué residir en implementar todos los instrumentos de prueba.

Puede residir en convertir resultados heterogéneos en un proceso gobernado, reproducible, trazable y comprensible, con autoridad y conclusiones consistentes.

# **12. Escenarios profesionales contrastados en papel**

Los siguientes escenarios son análisis hipotéticos. No se ejecutaron experimentos ni se accedió a sistemas empresariales.

| Escenario                       | Resultado exigible                                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- |
| QA sin modelo conectado         | Puede consultar un perfil, ejecutar verificaciones deterministas elegibles y registrar evidencia humana |
| Campaña autónoma                | Ejecuta controles ordinarios autorizados sin aprobación individual                                      |
| Seguridad negativa              | Comprueba denegación, ausencia de divulgación y efectos con controles sanos                             |
| Rendimiento degradado           | Distingue éxito funcional de incumplimiento temporal                                                    |
| Medición contaminada            | Registra incertidumbre, no PASS                                                                         |
| Evaluación de carga sin permiso | Bloquea antes de generar tráfico                                                                        |
| Accesibilidad crítica           | Activa controles pertinentes según política previa                                                      |
| Accesibilidad humana pendiente  | Mantiene obligación abierta                                                                             |
| Entorno incompatible            | Registra la celda no disponible, sin sustituirla silenciosamente                                        |
| Interrupción de sesión          | Bloquea o recupera según autoridad, sin anonimato implícito                                             |
| Evidencia externa insuficiente  | Conserva procedencia sin acreditación automática                                                        |
| Revocación en vuelo             | Detiene nuevo trabajo y reconcilia efectos ya enviados                                                  |
| Handoff a otro HOST             | Recupera objetivos, revisiones, resultados y próxima acción, sin exportar autoridad                     |
| Consulta después de poda        | Conserva resumen autorizado y explica evidencia no disponible                                           |
| Evaluador externo hostil        | No amplía permisos ni obtiene secretos                                                                  |
| Producción de lectura           | Solo operaciones efectivamente acreditadas y presupuestos autorizados                                   |

# **13. Impacto sobre memoria, reportes y reproducibilidad**

Esta sección establece únicamente las necesidades transversales de QA-05. Su diseño completo corresponde a QA-03.

## **13.1. Memoria necesaria**

Una evaluación de calidad requiere conservar información diferente de una observación funcional ordinaria.

| Información                | Finalidad                   |
| -------------------------- | --------------------------- |
| Objetivo de calidad        | Qué se pretendía verificar  |
| Revisión del perfil        | Qué metodología se utilizó  |
| Contexto ambiental         | Comparabilidad              |
| Fuente del umbral          | Autoridad de la expectativa |
| Métricas y unidades        | Interpretación correcta     |
| Distribución y denominador | Evitar métricas engañosas   |
| Instrumentación            | Procedencia y limitaciones  |
| Obligaciones pendientes    | Cobertura real              |
| Resultado original         | Histórico inmutable         |
| Evidencia disponible       | Verificabilidad actual      |
| Condición de parada        | Seguridad y causalidad      |
| Riesgo residual            | Información para decidir    |

No recomiendo una base de datos independiente de seguridad, otra de rendimiento y otra de accesibilidad.

Deben mantenerse como dominios y proyecciones lógicas del modelo canónico, reutilizando alcance, revisión, caso, intento, resultado, evidencia y defecto.

## **13.2. Impacto de retención DE-01**

La política ratificada es compatible con estas capacidades siempre que exista un mínimo compacto durable autorizado.

Después de la poda de detalle, deberían poder consultarse, cuando se hayan conservado legítimamente:

- Identidad y revisión de la evaluación.
- Contexto mínimo de comparabilidad.
- Métricas resumidas y denominadores.
- Resultado por obligación.
- Fuente de expectativa y procedencia.
- Estado de evidencia y limitaciones.
- Firma de defecto y referencias autorizadas.

No propongo conservar indefinidamente todas las series temporales, imágenes, HAR, cuerpos de respuesta o datos de usuarios.

Si un resumen no contiene información suficiente para recalcular un percentil o acreditar una afirmación, la consulta posterior deberá reconocerlo.

La poda no modifica retroactivamente el resultado histórico.

## **13.3. Reportes profesionales exigibles**

| Reporte                | Contenido                                          |
| ---------------------- | -------------------------------------------------- |
| Seguridad funcional    | Controles, roles, alcance, defectos y testigos     |
| Rendimiento            | Perfil, muestras, distribución, umbrales y entorno |
| Accesibilidad          | Criterios, estados, métodos y cobertura pendiente  |
| Compatibilidad         | Matriz de perfiles y divergencias                  |
| Fiabilidad             | Interrupciones, recuperación y efectos             |
| Localización           | Contextos regionales y diferencias                 |
| Riesgo residual        | Incertidumbres y limitaciones                      |
| Regresión no funcional | Comparación entre revisiones equivalentes          |

Un reporte de seguridad debe admitir una vista saneada para destinatarios sin autorización de acceder a evidencia privada o detalles sensibles.

Los mecanismos de exportación deben preservar DE-02 y los cuatro grants multimedia.

# **14. Evaluación independiente de las propuestas del Orquestador**

## **14.1. Cinco dominios lógicos de memoria**

**Dictamen: favorable condicionado.**

La hipótesis de conocimiento, biblioteca de pruebas, ejecuciones, defectos/reproducción y reportes es compatible con las necesidades de QA-05.

No obstante, la calidad no funcional necesita perfiles de evaluación, mediciones y metodologías versionadas.

No recomiendo introducir un sexto repositorio físico denominado «memoria no funcional». Estas estructuras pueden pertenecer a los dominios lógicos existentes.

## **14.2. Recetas de reproducción**

**Dictamen: favorable condicionado.**

Para reproducir un defecto no funcional no basta con conservar pasos y datos.

Una receta de rendimiento puede requerir hardware, caché, red, carga de fondo y versión del evaluador. Una receta de accesibilidad puede requerir navegador, tecnología de apoyo, estado de foco y procedimiento humano.

Por tanto, una receta debe identificar condiciones de reproducción y reconocer cuándo ya no están disponibles.

La receta no puede transmitir permisos ni garantizar que un defecto se repetirá.

## **14.3. Trabajo humano sin IA**

**Dictamen: favorable y necesario.**

Parte de la evaluación de accesibilidad, usabilidad, seguridad y riesgo necesita participación humana.

No debería requerirse una suscripción o modelo conectado para registrar estas comprobaciones, consultar sus criterios, ejecutar automatización existente o producir reportes.

La participación humana tampoco convierte cualquier declaración en acreditación canónica.

## **14.4. Implementación de capacidades especializadas**

**Dictamen: favorable a una estrategia mixta; desfavorable a su implementación universal nativa.**

QAP debe poseer el contrato de evaluación y sus garantías.

No debería poseer obligatoriamente todos los algoritmos, analizadores, generadores de carga y motores de observabilidad.

## **14.5. Ampliación de reportes**

**Dictamen: favorable condicionado.**

Las capacidades de consulta deben representar información no funcional real. No deben inventar datos ausentes ni presentar un indicador agregado que esconda obligaciones incumplidas.

# **15. Dependencias entre especialidades**

| Especialidad | Transferencia requerida                                                |
| ------------ | ---------------------------------------------------------------------- |
| QA-01        | Incorporar objetivos no funcionales, criticidad y selección por riesgo |
| QA-02        | Autoría, ejecución guiada y evaluación humana sin IA                   |
| QA-03        | Métricas, recetas, histórico, reportes y evidencia                     |
| QA-04        | Adaptadores, CI, ejecución externa y regresión                         |
| QA-06        | Seguridad de negocio, datos, APIs, aislamiento y consistencia          |

Las dependencias son conceptuales. No representan fases, sprints ni WBS.

## **15.1. Conflictos que deben evitarse**

| Conflicto                                  | Resolución recomendada                                 |
| ------------------------------------------ | ------------------------------------------------------ |
| Mayor cobertura frente a privacidad        | Autoridad y custodia prevalecen; declarar brechas      |
| Mayor concurrencia frente a estabilidad    | Separar concurrencia QAP y carga AUT                   |
| Más evidencia frente a retención           | Resumen durable autorizado y detalle sujeto a política |
| Automatización frente a accesibilidad real | Evaluación humana cuando sea necesaria                 |
| Integración frente a seguridad             | Núcleo conserva autoridad                              |
| Velocidad frente a fidelidad               | No omitir recursos o controles para mejorar tiempos    |
| Resultado externo frente a verdad canónica | Evaluación de procedencia y suficiencia                |
| Autonomía frente a operaciones de riesgo   | Política previa y límites efectivos                    |

# **16. Capacidades recomendadas para el primer lanzamiento**

Recomiendo ampliar selectivamente la v1 sin construir una suite universal de Quality Engineering.

**Perfil común de evaluación de calidad**

Objetivos, métricas, autoridad, testigos y límites.

**Seguridad funcional empresarial**

Controles positivos y negativos sobre operaciones, identidades y datos.

**Rendimiento sintético básico del AUT**

Medición reproducible de operaciones autorizadas.

**Fiabilidad funcional**

Recuperación, condiciones degradadas y consistencia.

**Compatibilidad declarativa del AUT**

Matrices de perfiles y resultados por celda.

**Accesibilidad automática y humana**

Mantener DE-05 B y matrices independientes.

**Admisión segura de evaluadores externos**

Importación gobernada y frontera común.

**Seguridad adversarial del propio QAP**

Invariantes de autoridad y respuesta a vulnerabilidades.

Varias de estas capacidades son obligaciones ya existentes cuya precisión resulta necesaria. No deben presentarse como ocho ampliaciones netas del producto.

## **16.1. Capacidades opcionales**

| Capacidad                              | Razón                                                |
| -------------------------------------- | ---------------------------------------------------- |
| Internacionalización regional avanzada | Depende de los mercados soportados                   |
| Evaluación de usabilidad especializada | Requiere objetivos y participación humana            |
| Regresión visual del AUT               | Depende de evidencia, estabilidad y costo            |
| Web Vitals avanzados                   | Útiles para aplicaciones pertinentes, no universales |

## **16.2. Integraciones especializadas**

| Capacidad                           | Recomendación                     |
| ----------------------------------- | --------------------------------- |
| Carga y estrés                      | Herramientas externas autorizadas |
| DAST                                | Evaluación acotada especializada  |
| SAST/SCA                            | Integración de desarrollo         |
| Dispositivos reales                 | Evaluación externa o manual       |
| Análisis especializado de seguridad | Integración o evidencia humana    |

## **16.3. Fases posteriores**

- Observabilidad continua y longitudinal.
- Plataforma propia de monitorización distribuida.
- Evaluación avanzada de capacidad mediante infraestructura dedicada.
- Colaboración centralizada entre equipos especializados, conforme a la modalidad compartida futura.

## **16.4. Fuera de alcance inicial**

| Capacidad                                       | Motivo                                               |
| ----------------------------------------------- | ---------------------------------------------------- |
| Pentesting ofensivo autónomo general            | Riesgo y especialización                             |
| Cargas contra producción                        | Incompatible con el perímetro recomendado            |
| Modificación de infraestructura del AUT         | Fuera de autoridad y alcance vigente                 |
| Certificación universal ISO/WCAG/OWASP          | No acreditable mediante ejecución automática parcial |
| Motor APM completo                              | Duplica plataformas especializadas                   |
| SIEM completo                                   | No corresponde al propósito central                  |
| Motor universal SAST                            | Complejidad y acceso a código no garantizados        |
| Certificación de sistemas críticos safety       | Exige métodos y autoridades específicos del dominio  |
| Emulación universal de todos los dispositivos   | Alcance desproporcionado                             |
| Evaluación continua no autorizada de producción | Incompatible con autoridad explícita                 |

Estas exclusiones no eliminan la posibilidad de consumir evidencia legítima de especialistas o herramientas externas.

# **17. Decisiones que requieren intervención del propietario**

El propietario no necesita elegir librerías, formatos físicos, motores concretos ni estructuras de almacenamiento en esta etapa.

Sí existen decisiones reales de producto.

| ID provisional | Decisión                                                        | Recomendación                        |
| -------------- | --------------------------------------------------------------- | ------------------------------------ |
| DP-QA05-01     | Incorporar evaluación básica de rendimiento AUT al lanzamiento  | Aprobar                              |
| DP-QA05-02     | Ejecutar pruebas masivas de carga desde QAP v1                  | No incorporar como motor propio      |
| DP-QA05-03     | Admitir resultados de herramientas especializadas               | Aprobar bajo autoridad y procedencia |
| DP-QA05-04     | Convertir usabilidad y regresión visual en evaluación universal | No; mantener selección por proyecto  |
| DP-QA05-05     | Incorporar monitorización continua como servicio inicial        | Diferir                              |

Las precisiones que únicamente desarrollan contratos ya ratificados pueden resolverse técnicamente, siempre que no reduzcan garantías ni introduzcan nuevos riesgos o costos obligatorios.

No identifico necesidad de modificar DE-01–05 para implementar la recomendación central de este informe.

Sí sería necesario un acto posterior si se decide habilitar generación activa de carga, nuevos ámbitos de riesgo o dependencias comerciales obligatorias.

# **18. Impacto sobre aceptación y compuertas existentes**

No se propone crear nuevas compuertas ni alterar el DAG G0–G6.5/GA.

Si se ratifican ampliaciones, deberán incorporarse al universo de obligaciones, consumidores y celdas aplicables antes de la certificación correspondiente.

| Referencia existente | Impacto propuesto                                     |
| -------------------- | ----------------------------------------------------- |
| E1                   | Contratos de perfiles y evaluadores                   |
| E2                   | Aislamiento, autoridad y persistencia                 |
| E3                   | Continuidad y ejecución sin IA                        |
| E4                   | Selección, contexto y aplicabilidad                   |
| E5                   | Veracidad de testigos y resultados                    |
| E6                   | Evidencia, accesibilidad y custodia                   |
| E7                   | Paridad de consumidores                               |
| E8                   | Generalización en corpus independiente                |
| G6.5                 | Ejercicio representativo autorizado, según manifiesto |

La incorporación de nuevos objetivos no autoriza ampliar automáticamente el acceso de G6.5 a sistemas empresariales.

Tampoco exige ejecutar pruebas de carga o análisis invasivos durante el piloto.

## **18.1. Vetos preservados**

El producto no podrá obtener aprobación mediante:

- Falso PASS de una obligación no funcional.
- Evaluación sobre destino o identidad no autorizados.
- Divulgación indebida de evidencia.
- Eliminación selectiva de muestras adversas.
- Sustitución silenciosa de condiciones de evaluación.
- Ocultación de evaluaciones requeridas pendientes.
- Falsificación de disponibilidad o cobertura.
- Uso de resultados externos como acreditación automática.
- Desactivación de controles para conseguir mejores métricas.

Los vetos existentes de DE-03, CV08 y CC08 conservan su carácter no compensable.

# **19. Fuentes profesionales y referencias externas**

Fuentes públicas consultadas el 25 de noviembre de 2026. Se indica la versión cuando está identificada expresamente.

| Ref. | Fuente primaria                                                                                                                                               | Aplicación                                     |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| F01  | [ISO/IEC 25010:2023](https://www.iso.org/standard/78176.html?utm_source=chatgpt.com)                                                                          | Modelo de calidad de producto                  |
| F02  | [ISTQB Certified Tester Performance Testing](https://test.istqb.org/certifications/certified-tester-performance-testing-ct-pt/?utm_source=chatgpt.com)        | Especialidad de rendimiento                    |
| F03  | [OWASP ASVS 5.0.0](https://asvs.owasp.org/downloads/?utm_source=chatgpt.com)                                                                                  | Objetivos de seguridad verificables            |
| F04  | [OWASP WSTG 4.2](https://wstg.owasp.org/stable/4-Web_Application_Security_Testing/?utm_source=chatgpt.com)                                                    | Familias de pruebas de seguridad               |
| F05  | [OWASP API Security Top 10:2023](https://owasp.org/projects/api-security-project/?utm_source=chatgpt.com)                                                     | Seguridad de APIs                              |
| F06  | [NIST SP 800-115, 2008](https://csrc.nist.gov/pubs/sp/800/115/final?utm_source=chatgpt.com)                                                                   | Evaluación de seguridad autorizada             |
| F07  | [NIST SP 800-218, SSDF 1.1](https://csrc.nist.gov/pubs/sp/800/218/final?utm_source=chatgpt.com)                                                               | Seguridad del ciclo de desarrollo              |
| F08  | [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/?utm_source=chatgpt.com)                                                                                          | Accesibilidad                                  |
| F09  | [W3C WCAG-EM 2.0](https://www.w3.org/TR/WCAG-EM/?utm_source=chatgpt.com)                                                                                      | Metodología de evaluación                      |
| F10  | [Unicode UTS #35, revisión 79](https://www.unicode.org/reports/tr35/tr35-79/tr35.html?utm_source=chatgpt.com)                                                 | Localización                                   |
| F11  | [Web Vitals](https://web.dev/articles/vitals?utm_source=chatgpt.com)                                                                                          | Métricas de experiencia web                    |
| F12  | [Grafana k6 — Thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/?utm_source=chatgpt.com)                                                     | Umbrales y parada                              |
| F13  | [Grafana k6 — Scenarios](https://grafana.com/docs/k6/latest/using-k6/scenarios/?utm_source=chatgpt.com)                                                       | Perfiles de demanda                            |
| F14  | [ZAP Baseline Scan](https://www.zaproxy.org/docs/docker/baseline-scan/?utm_source=chatgpt.com)                                                                | Diferencia entre adquisición y análisis pasivo |
| F15  | [OWASP AI Agent Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html?utm_source=chatgpt.com)               | Amenazas agénticas                             |
| F16  | [OWASP Agentic Applications 2026 — Tool Misuse](https://genai.owasp.org/agentic-applications-2026/asi02-tool-misuse-and-exploitation/?utm_source=chatgpt.com) | Abuso de herramientas y permisos               |

Las fuentes de documentación continua se han utilizado como referencias de capacidades, no como versiones tecnológicas congeladas para QAP.

# **20. Recomendación final al Orquestador Principal**

La visión de QAP debería evolucionar de una plataforma centrada exclusivamente en automatizar pruebas funcionales hacia una plataforma de aseguramiento de calidad empresarial capaz de administrar evaluaciones multidimensionales.

Sin embargo, el objetivo de ampliar su cobertura profesional no debe confundirse con construir internamente todas las herramientas del mercado.

## **Frontera de producto recomendada**

Propuesta conceptual para AC-01

**QAP debe poder definir, ejecutar o coordinar, evaluar, reproducir y reportar obligaciones de calidad autorizadas.**

Debe conservar autoridad sobre el proceso y la acreditación, incluso cuando la evidencia proceda de una herramienta especializada o de un profesional humano.

No necesita convertirse en un escáner universal, generador masivo de carga, plataforma APM ni certificador normativo.

La ampliación más importante identificada por esta especialidad es el **perfil común de evaluación no funcional**, acompañado de medición sintética básica del AUT.

Estas capacidades permiten incorporar progresivamente rendimiento, seguridad, resiliencia, compatibilidad, accesibilidad y otras dimensiones sin diseñar un subsistema independiente para cada disciplina.

Recomiendo que el Orquestador coteje las trece propuestas contra los informes restantes de AC-01, elimine duplicidades y determine los deltas realmente nuevos antes de congelar el alcance inicial.

# **21. Dictamen de cierre**

| Cuestión                                                                 | Resolución                             |
| ------------------------------------------------------------------------ | -------------------------------------- |
| ¿La especificación actual es suficiente para toda la especialidad QA-05? | No completamente                       |
| ¿Existen garantías sólidas que deben preservarse?                        | Sí                                     |
| ¿Es necesario invalidar AV-01–08?                                        | No se identifica fundamento suficiente |
| ¿Deben ampliarse requisitos antes de seleccionar tecnología?             | Sí, selectivamente                     |
| ¿Debe construirse un motor propio para cada disciplina?                  | No                                     |
| ¿Debe QAP funcionar sin IA para evaluaciones elegibles?                  | Sí                                     |
| ¿Se recomienda modificar DE-05 B?                                        | No                                     |
| ¿Se recomienda reducir garantías AR-27 o AR-52?                          | No                                     |
| ¿Se autoriza implementar las propuestas?                                 | No                                     |
| ¿Se recomienda congelar inmediatamente el WBS?                           | No                                     |

**DICTAMEN FINAL: FAVORABLE A LA CONSERVACIÓN DE LA BASE NORMATIVA, CON AMPLIACIONES SELECTIVAS Y PRECISIONES CONTRACTUALES DE CALIDAD NO FUNCIONAL PENDIENTES DE RATIFICACIÓN.**

Se entrega este informe al Orquestador Principal como contribución independiente de QA-05. No se ratifican nuevos requisitos, no se selecciona tecnología definitiva y no se modifica el estado de los registros AR.

Investigación documental concluida dentro del alcance y las limitaciones declaradas. Cero experimentos, cero modificaciones al repositorio y cero acceso a aplicaciones empresariales.

**Fin del informe AC-01 · QA-05.**