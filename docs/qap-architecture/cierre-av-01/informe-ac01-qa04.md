# **AC-01 · Informe de investigación especializada QA-04**

## **Automatización, SDET, integración con desarrollo y CI/CD**

| Identificación                    | Referencia                                 |
| --------------------------------- | ------------------------------------------ |
| Destinatario                      | Orquestador Principal de QAP               |
| Investigador                      | ChatGPT · QA-04                            |
| Fecha                             | 25 de noviembre de 2026                    |
| Repositorio                       | `Hyouka73/QAMCP`                           |
| Rama exclusiva                    | `develop`                                  |
| SHA solicitado                    | `b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5` |
| Base común de investigación AC-01 | `303e621dbca4a3a3b17cb2bf32530ab6311edc92` |
| Naturaleza                        | Investigación documental independiente     |
| Experimentos ejecutados           | Ninguno                                    |
| Modificaciones al repositorio     | Ninguna                                    |
| Estado de las propuestas          | Pendientes de evaluación y ratificación    |

## **1. Resumen ejecutivo**

### **1.1. Dictamen especializado**

**Se recomienda conservar la arquitectura normativa aprobada en AV-01–08 y ampliar selectivamente la definición funcional de QAP antes de congelar su alcance inicial.**

La línea base contiene garantías considerablemente más rigurosas que las de un framework convencional de automatización en aspectos como autoridad, independencia de testigos, verificación de efectos, recuperación, custodia de evidencias, veracidad de resultados y continuidad entre agentes.

Sin embargo, todavía existe una diferencia importante entre construir una herramienta autónoma que prueba aplicaciones y construir una plataforma que pueda incorporarse al trabajo cotidiano de un SDET, un equipo de desarrollo y una organización con integración continua.

El principal hallazgo de esta investigación es que QAP necesita convertirse en un **sistema de automatización reutilizable e interoperable**, sin convertirse innecesariamente en un framework universal de pruebas.

Esto requiere distinguir tres responsabilidades:

| Responsabilidad                               | Propuesta                                            |
| --------------------------------------------- | ---------------------------------------------------- |
| Automatización funcional empresarial          | Capacidad nativa de QAP                              |
| Automatización especializada existente        | Integración e intercambio bajo contratos controlados |
| Ejecución, evaluación y entrega de resultados | Autoridad canónica de QAP dentro de su alcance       |

No recomiendo desarrollar sustitutos propios de los frameworks unitarios, servidores de integración continua, plataformas de despliegue, sistemas de virtualización de servicios ni gestores completos de código fuente.

Sí recomiendo que QAP pueda trabajar profesionalmente en organizaciones que ya utilizan esos sistemas.

### **1.2. Principales necesidades identificadas**

Las áreas que requieren atención adicional son:

- Casos automatizados reutilizables y parametrizados.
- Administración versionada de componentes de automatización.
- Vinculación entre pruebas manuales, híbridas y automatizadas.
- Incorporación controlada de suites existentes.
- Identificación inequívoca de la versión del AUT sometida a pruebas.
- Integración CI/CD sin intervención de un modelo de IA.
- Intercambio de resultados con herramientas de desarrollo.
- Gestión profesional de pruebas inestables y cuarentenas.
- Selección explicable y conservadora de regresiones.
- Testabilidad de las aplicaciones.
- Consumo de fixtures, mocks y servicios virtualizados.
- Compatibilidad entre versiones de servicios.
- Diagnóstico operacional y mantenibilidad de la automatización.
- Prevención de falsas acreditaciones mediante resultados externos.
- Portabilidad de activos de automatización.

Varias de estas capacidades ya existen normativamente de manera parcial o completa. No corresponde convertirlas automáticamente en requisitos nuevos.

### **1.3. Recomendación sobre el lanzamiento**

El primer lanzamiento debería permitir, como mínimo, este escenario:

> Un SDET diseña o importa una prueba funcional, reutiliza sus componentes, la vincula con requisitos, parametriza sus datos, la ejecuta sin IA desde QAP o desde CI, identifica qué versión de la aplicación fue probada, recibe resultados verificables y entrega a desarrollo información suficiente para reproducir el fallo. Después de una corrección, puede seleccionar y ejecutar una regresión conservando el historial y sin volver a descubrir innecesariamente la aplicación.

Ese escenario no exige un servicio central, una suscripción de IA, un nuevo framework unitario ni infraestructura distribuida.

## **2. Base examinada y delimitación de evidencia**

### **2.1. Verificación de identidad documental**

El encargo AC-01 fue recuperado íntegramente mediante el conector de GitHub en el SHA solicitado.

Se verificó mediante comparación de commits que `b9ffdcd1…` está exactamente un commit por delante de `303e621d…`, sin divergencia hacia atrás.

Los únicos cambios son:

| Archivo                                            | Cambio                    |
| -------------------------------------------------- | ------------------------- |
| `cierre-av-01/README.md`                           | Actualización de índice   |
| `encargo-ac01-evaluacion-multidisciplinaria-qa.md` | Incorporación del encargo |

No hay modificaciones de código entre ambas referencias.

Por tanto, utilizar `303e621d…` para el análisis normativo y estático respeta la base común establecida por AC-01.

Fuentes: [encargo vinculante](https://github.com/Hyouka73/QAMCP/blob/b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5/docs/qap-architecture/cierre-av-01/encargo-ac01-evaluacion-multidisciplinaria-qa.md?utm_source=chatgpt.com) y [comparación exacta de commits](https://github.com/Hyouka73/QAMCP/compare/303e621dbca4a3a3b17cb2bf32530ab6311edc92...b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5?utm_source=chatgpt.com).

### **2.2. Fuentes normativas internas**

Se utilizaron como referencias principales la [especificación consolidada](https://github.com/Hyouka73/QAMCP/blob/303e621dbca4a3a3b17cb2bf32530ab6311edc92/docs/qap-architecture/especificacion-consolidada.md?utm_source=chatgpt.com), el [manifiesto normativo](https://github.com/Hyouka73/QAMCP/blob/303e621dbca4a3a3b17cb2bf32530ab6311edc92/docs/qap-architecture/cierre-av-01/manifiesto-normativo-consolidado.md?utm_source=chatgpt.com), el [catálogo de requisitos](https://github.com/Hyouka73/QAMCP/blob/303e621dbca4a3a3b17cb2bf32530ab6311edc92/docs/qap-architecture/catalogo-requisitos.md?utm_source=chatgpt.com), las [decisiones empresariales ratificadas](https://github.com/Hyouka73/QAMCP/blob/303e621dbca4a3a3b17cb2bf32530ab6311edc92/docs/qap-architecture/cierre-av-01/acta-ratificacion-de.md?utm_source=chatgpt.com), la [matriz de aceptación AV-08](https://github.com/Hyouka73/QAMCP/blob/303e621dbca4a3a3b17cb2bf32530ab6311edc92/docs/qap-architecture/cierre-av-01/matriz-aceptacion-av08.md?utm_source=chatgpt.com) y los contratos especializados pertinentes.

Se mantiene el universo normativo de:

- 90 requisitos.
- 2 políticas.
- 11 ampliaciones.
- 57 registros AR.

Las propuestas de este informe no modifican esos conteos ni reclasifican los registros existentes.

### **2.3. Convenciones de clasificación**

| Clasificación          | Significado                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------- |
| CUBIERTO               | La obligación ya existe normativamente.                                            |
| PRECISAR CONTRATO      | Existe la necesidad, pero faltan condiciones funcionales o de aceptación.          |
| BRECHA NUEVA           | Necesidad profesional no suficientemente comprometida por la línea base examinada. |
| CONTRADICCIÓN MATERIAL | Incompatibilidad demostrable que debe resolverse.                                  |
| NO APLICA              | No corresponde al núcleo o al alcance inicial de QAP.                              |

La cobertura normativa no implica implementación ni acreditación experimental.

## **3. Contraste con la práctica profesional de automatización**

El programa ISTQB Advanced Level Test Automation Engineering v2.0, publicado en 2024, incorpora arquitectura y mantenibilidad de soluciones de automatización, integración con CI/CD, ejecución a distintos niveles y mejora continua. El programa Test Automation Strategy v1.0 amplía la perspectiva organizativa de la automatización.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.istqb.org\&sz=32)

istqb.org+2



Esto respalda una conclusión importante: la automatización profesional no se limita a conseguir que un navegador reproduzca una secuencia de acciones.

También incluye determinar qué conviene automatizar, cómo reutilizarlo, cuándo ejecutarlo, cuánto cuesta mantenerlo, qué nivel proporciona la evidencia adecuada y cómo entregar sus resultados al resto del equipo.

La serie ISO/IEC/IEEE 29119 constituye igualmente una referencia de procesos organizativos, de gestión y de pruebas dinámicas. Se consultó su descripción pública, sin atribuir requisitos específicos al texto completo de pago ni declarar conformidad de QAP.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.iso.org\&sz=32)

Part 2: Test processes+1



### **3.1. Actores profesionales**

| Actor                    | Necesidad principal de QAP                                                  |
| ------------------------ | --------------------------------------------------------------------------- |
| QA manual                | Crear, ejecutar y transferir casos que posteriormente puedan automatizarse. |
| QA Automation Engineer   | Construir automatizaciones reutilizables y mantenibles.                     |
| SDET                     | Integrar pruebas con código, servicios, fixtures y pipelines.               |
| Desarrollador            | Reproducir fallos y verificar correcciones.                                 |
| QA Lead                  | Administrar riesgo, cobertura y confiabilidad de regresiones.               |
| DevOps                   | Ejecutar pruebas desatendidas y consumir resultados fiables.                |
| Release Manager          | Consultar evidencias y decidir si una entrega satisface su política.        |
| Responsable de seguridad | Controlar permisos, secretos y efectos de ejecución.                        |
| Propietario del producto | Conocer resultados funcionales y riesgos pendientes.                        |

QAP debe servir a estos actores sin confundir sus responsabilidades con los roles internos de la aplicación probada.

### **3.2. Flujo profesional de referencia**

**Requisitos, cambios y riesgos**

QA Lead · Desarrollo · Producto

**Diseño y biblioteca de pruebas**

Casos manuales, automatizados y componentes reutilizables

**Plan y selección**

Riesgo, cambios, dependencias y datos

**Autoridad**

Identidad, destino, efectos y presupuesto

**Núcleo canónico QAP**

Ejecución determinista · Testigos · Reconciliación · Custodia

UI / API

CLI / CI

MCP / HOST

**Resultados y evidencia**

Veredictos · Defectos · Historial · Intercambio con desarrollo

**Retest, regresión y decisión de entrega**

Retroalimentación hacia conocimiento y biblioteca

El flujo no exige intervención de IA en cada etapa. Una revisión congelada, vigente y autorizada debe ser ejecutable de forma determinista.

## **4. Frontera funcional: qué debe automatizar QAP**

No todos los niveles de prueba deben resolverse con el mismo motor. La capacidad de probar integralmente un producto no implica que QAP tenga que implementar todos los mecanismos especializados existentes.

| Nivel o modalidad                                   | Cobertura recomendada                                        | Clasificación            |
| --------------------------------------------------- | ------------------------------------------------------------ | ------------------------ |
| UI funcional web                                    | Ejecución, Discovery, interacción y verificación de efectos. | Nativa, obligatoria      |
| API funcional                                       | Operaciones autorizadas, preparación y verificación.         | Nativa, obligatoria      |
| Contratos OpenAPI                                   | Conformidad de solicitudes y respuestas versionadas.         | Nativa, obligatoria      |
| E2E multimódulo                                     | Flujos, estados, roles, datos, testigos y recuperación.      | Nativa, obligatoria      |
| Integración de servicios                            | Operaciones y resultados observables autorizados.            | Nativa cuando sea viable |
| Contratos consumidor-proveedor                      | Compatibilidad entre versiones de servicios.                 | Integración externa      |
| Pruebas unitarias                                   | Consumo de resultados y vinculación con cobertura.           | Integración externa      |
| Pruebas de componentes                              | Consumo de suites especializadas.                            | Integración externa      |
| Pruebas manuales automatizables                     | Identidad compartida y conversión controlada.                | Candidata a lanzamiento  |
| Pruebas híbridas                                    | Combinación explícita de acciones humanas y deterministas.   | Candidata a lanzamiento  |
| Fixtures sintéticos                                 | Preparación y ciclo de vida mediante DataPlan.               | Nativa, obligatoria      |
| Mocks y stubs                                       | Utilización controlada de servicios simulados.               | Integración externa      |
| Virtualización de servicios                         | Interoperabilidad con infraestructura especializada.         | Opcional                 |
| Regresión visual avanzada                           | Comparación de representaciones y tolerancias.               | Opcional, ya contemplada |
| Cobertura interna de código AUT                     | Ingesta de mediciones producidas externamente.               | Opcional                 |
| Pruebas de mutación de código AUT                   | Herramientas externas autorizadas.                           | Posterior                |
| Automatización nativa de aplicaciones móviles       | Requeriría ampliación de motores y calificación.             | Posterior                |
| Automatización nativa de aplicaciones de escritorio | Requeriría ampliación expresa de alcance.                    | Posterior                |
| Administración de despliegues                       | Responsabilidad del sistema CI/CD.                           | Fuera de alcance         |

**Conclusión:** QAP debe ser capaz de participar en una estrategia de pruebas multinivel, sin afirmar que ejecuta nativamente todos esos niveles.

## **5. Cotejo de capacidades ya contempladas**

La siguiente matriz evita duplicar requisitos existentes.

| Área profesional                  | Referencia normativa        | Cobertura         | Observación                                          |
| --------------------------------- | --------------------------- | ----------------- | ---------------------------------------------------- |
| Replay sin IA                     | IA-001.2, D03               | CUBIERTO          | Implementación integrada pendiente.                  |
| Continuidad sin HOST              | IA-001.4, CAM-001.4         | CUBIERTO          | Runtime soberano previsto.                           |
| Diseño de casos                   | CAS-001.1–5                 | CUBIERTO          | Ampliar composición y parametrización.               |
| Identidad y revisión de casos     | CAS-001.3, MEM-001.3        | CUBIERTO          | Aprovechar para manual y automático.                 |
| Planificación por riesgo          | PLN-001.3                   | CUBIERTO          | Precisar señales provenientes de CI.                 |
| DAG de dependencias               | PLN-001.4–6, AR-05          | CUBIERTO          | No crear segundo planificador.                       |
| Oráculos y assertions             | ORA-001.1–7, AV-04          | CUBIERTO          | Adaptaciones nuevas deben respetarlos.               |
| Preparación de datos              | DAT-001.1–4                 | CUBIERTO          | Fixtures parametrizados requieren precisión.         |
| Aislamiento                       | RUN-001.1, D16              | CUBIERTO          | Extender condiciones a adaptadores externos.         |
| Reintentos seguros                | RUN-001.4, AR-53            | CUBIERTO          | Prohibición de repetir mutaciones inciertas.         |
| Flakiness                         | REG-001.2, MEM-003.3        | CUBIERTO          | Falta gobernanza operacional detallada.              |
| Reparación de localizadores       | REG-001.3                   | CUBIERTO          | Prohibir cambios silenciosos de intención.           |
| Selección de regresión            | REG-001.1, AR-40            | CUBIERTO          | Precisar suficiencia y señales desconocidas.         |
| Defectos y retest                 | REP-001.3–4                 | CUBIERTO          | No duplicar entidades.                               |
| Integración CI                    | INT-001.1, AR-52            | CUBIERTO          | Completar contexto de builds y entrega.              |
| Adaptadores y conectores          | INT-001.4                   | PRECISAR CONTRATO | No define por completo suites arbitrarias externas.  |
| Portabilidad                      | INT-001.2, D14              | CUBIERTO          | Tres sistemas operativos obligatorios.               |
| Exportación de resultados         | REP-001.1–2, AV-05          | CUBIERTO          | JUnit necesita tratamiento específico.               |
| Pruebas API                       | QA-002, DAT-001.2           | CUBIERTO          | No equivale a contratos consumidor-proveedor.        |
| Evidencia de ejecución            | RUN-001.6, REP-001.1        | CUBIERTO          | Importaciones externas no acreditan automáticamente. |
| Seguridad de ejecución            | D07, D20, SEG               | CUBIERTO          | Aplicar a CI y extensiones.                          |
| Pruebas internas de QAP           | D21, E1–E8, AV-08           | CUBIERTO          | Mantener separación respecto al AUT.                 |
| Compatibilidad entre agentes      | D13, AGT-001/002            | CUBIERTO          | No multiplicar núcleos.                              |
| Simulaciones y virtualización AUT | DAT, INT-001.4 parcialmente | BRECHA NUEVA      | Definir límites de acreditación.                     |
| Identidad de build desplegada     | MEM-002.1, REG parcialmente | PRECISAR CONTRATO | Diferenciar código fuente y artefacto ejecutado.     |

No se identifica una necesidad de reemplazar los cuatro ejes, los seis veredictos ni la arquitectura HOST/DETERMINISTIC.

## **6. Contraste estático con el código de&#x20;**`develop`

### **6.1. Evidencia recuperada directamente**

El análisis de archivos en el SHA de referencia confirma que QAP ya contiene antecedentes aprovechables, aunque algunos comportamientos son incompatibles con las garantías actualmente ratificadas.

| Componente     | Evidencia estática                                           | Interpretación                                                               |
| -------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| CLI de pruebas | Filtros por caso, tags, cambios y particiones.               | Existe una base de selección, no una selección profesional acreditada.       |
| Reintentos CLI | Sustitución del resultado previo por el resultado del retry. | Riesgo de ocultar intentos fallidos.                                         |
| GitAdapter     | Comparación de archivos y mapeo a módulos.                   | Antecedente de regresión por impacto.                                        |
| ImpactAnalyzer | Grafo inverso con validación de inventario.                  | Componente reutilizable; no acredita por sí mismo coherencia del inventario. |
| HistoryManager | JSONL, límite de entradas y backups.                         | No satisface por sí mismo la retención DE-01.                                |
| Reporter       | Generadores HTML, JSON, Markdown y JUnit.                    | Existe capacidad de interoperabilidad aprovechable.                          |
| Engine         | Interfaces de runner, almacenamiento y reportes.             | Base conceptual de adaptadores.                                              |
| Manifests      | Scripts de pruebas y builds con dependencias declaradas.     | No acreditan instalación ni conformidad.                                     |
| Release check  | Comprobaciones de paquetes y ciclo de vida local.            | No equivale a GA.                                                            |

### **6.2. Defectos y divergencias observados**

**H04-C01 — Pérdida del resultado previo durante un reintento.**

En [`packages/cli/src/commands/test.ts`](https://github.com/Hyouka73/QAMCP/blob/303e621dbca4a3a3b17cb2bf32530ab6311edc92/packages/cli/src/commands/test.ts?utm_source=chatgpt.com), `caseMap.set(c.id, c)` sustituye el registro anterior con el resultado del retry.

La agregación final se calcula sobre el mapa resultante.

Por tanto, un primer intento fallido puede desaparecer de esa proyección final después de un intento exitoso.

Además, la rutina vuelve a ejecutar casos fallidos sin que este manejador establezca una reconciliación de efectos previa.

**Clasificación:** incompatibilidad de implementación ya contemplada en RUN-001.4, REG-001.2 y AR-52. No es un requisito nuevo.

**H04-C02 — Selección vacía o señal de cambios indisponible interpretada como éxito.**

En [`packages/git-adapter/src/git-adapter.ts`](https://github.com/Hyouka73/QAMCP/blob/303e621dbca4a3a3b17cb2bf32530ab6311edc92/packages/git-adapter/src/git-adapter.ts?utm_source=chatgpt.com), los errores de adquisición Git pueden terminar devolviendo un arreglo vacío.

La CLI puede interpretar esa ausencia como inexistencia de módulos afectados y finalizar con código 0.

Se confunden dos estados diferentes:

- No se identificaron cambios mediante una comparación válida.
- No fue posible determinar los cambios.

Esta divergencia ya está contemplada por AR-40 y AR-52. Debe preservarse su corrección normativa.

**H04-C03 — Particionamiento sin garantías suficientes de dependencias.**

La CLI distribuye los casos mediante una operación módulo sobre su posición en el listado.

No se aprecia en esa ruta una comprobación de afinidad de datos, dependencia E2E o exclusividad de recursos antes de particionar.

La disponibilidad de `--shard` no demuestra que una campaña empresarial pueda dividirse de forma segura entre procesos independientes.

**H04-C04 — Proyección JUnit con pérdida semántica.**

El archivo [`junit-report.ts`](https://github.com/Hyouka73/QAMCP/blob/303e621dbca4a3a3b17cb2bf32530ab6311edc92/packages/reporter/src/generators/junit-report.ts?utm_source=chatgpt.com) transforma `skipped` y `not_run` en el mismo elemento XML.

El tratamiento de otros resultados depende del modelo legacy y no contempla explícitamente los cuatro ejes ratificados.

Su exportación es aprovechable, pero no puede considerarse representación canónica de AR-52.

**H04-C05 — Mensaje de preparación de lanzamiento excesivamente concluyente.**

[`scripts/release-check.mjs`](https://github.com/Hyouka73/QAMCP/blob/303e621dbca4a3a3b17cb2bf32530ab6311edc92/scripts/release-check.mjs?utm_source=chatgpt.com) comprueba cuatro paquetes, simulación de publicación y un script E2E local.

Al concluir imprime que el monorepo está completamente listo para distribución.

El mensaje no representa las condiciones ratificadas de GA, que exigen muchas más obligaciones, evaluación independiente y piloto empresarial.

Asimismo, el denominado [`test-e2e-live.mjs`](https://github.com/Hyouka73/QAMCP/blob/303e621dbca4a3a3b17cb2bf32530ab6311edc92/scripts/test-e2e-live.mjs?utm_source=chatgpt.com) contiene comprobaciones de inicialización, autenticación local, estado, reporte y limpieza preliminar. Es un antecedente de verificación del ciclo de vida de QAP, no prueba suficiente de autonomía funcional sobre el AUT.

**Clasificación general:** incompatibilidades legacy y precisiones que deben resolverse durante la reconstrucción autorizada. No constituyen evidencia de una nueva contradicción entre las decisiones empresariales vigentes.

# **7. Hallazgos especializados AC01-QA04**

## **7.1. Matriz priorizada**

| ID provisional | Necesidad                            | Clasificación                | Prioridad             |
| -------------- | ------------------------------------ | ---------------------------- | --------------------- |
| QA04-01        | Casos data-driven                    | Precisar contrato            | Esencial              |
| QA04-02        | Componentes reutilizables            | Brecha nueva                 | Esencial              |
| QA04-03        | Conversión manual/automática         | Precisar contrato            | Esencial              |
| QA04-04        | Adaptadores de suites externas       | Brecha nueva                 | Integración           |
| QA04-05        | Ingesta de resultados externos       | Brecha nueva                 | Esencial mínimo       |
| QA04-06        | Identidad verificable del build AUT  | Precisar contrato            | Esencial              |
| QA04-07        | Operación desatendida en CI          | Precisar contrato            | Esencial              |
| QA04-08        | Intercambio de resultados JUnit      | Precisar contrato            | Esencial              |
| QA04-09        | Frontera de confianza CI             | Precisar contrato            | Esencial              |
| QA04-10        | Selección conservadora de regresión  | Precisar contrato            | Esencial              |
| QA04-11        | Flakiness y cuarentena               | Precisar contrato            | Esencial              |
| QA04-12        | Esperas y estabilidad de ejecución   | Precisar contrato            | Esencial              |
| QA04-13        | Reparación de automatizaciones       | Precisar contrato            | Esencial              |
| QA04-14        | Testabilidad AUT                     | Brecha nueva                 | Esencial mínimo       |
| QA04-15        | Fixtures reutilizables               | Precisar contrato            | Esencial              |
| QA04-16        | Mocks, stubs y virtualización        | Brecha nueva                 | Integración           |
| QA04-17        | Contratos consumidor-proveedor       | Brecha nueva                 | Integración           |
| QA04-18        | Particionado seguro                  | Precisar contrato            | Posterior distribuido |
| QA04-19        | Trazabilidad con desarrollo          | Brecha nueva                 | Opcional/integración  |
| QA04-20        | Diagnóstico y costo de mantenimiento | Precisar contrato            | Esencial mínimo       |
| QA04-21        | Pruebas de QAP frente a pruebas AUT  | Cubierto; divergencia legacy | Esencial              |
| QA04-22        | Portabilidad de automatizaciones     | Precisar contrato            | Esencial              |

La identificación completa de cada propuesta emplea el prefijo `AC01-`. No deben convertirse las 22 entradas de esta tabla automáticamente en 22 nuevos requisitos.

## **7.2. AC01-QA04-01 — Casos automatizados parametrizados y data-driven**

**Clasificación:** PRECISAR CONTRATO.\
**Prioridad:** esencial para el lanzamiento.

### **Problema profesional**

Una automatización empresarial debe verificar una misma regla utilizando múltiples combinaciones de datos sin duplicar toda la definición del caso.

Por ejemplo, comprobar una regla de cálculo con diferentes importes, plazos, monedas, perfiles y condiciones.

Crear un caso independiente por cada combinación genera duplicación y dificulta el mantenimiento.

**Actores:** QA Automation Engineer, SDET y QA Lead.

**Evidencia y requisitos afectados:** PLN-001.1, CAS-001.2–5, DAT-001.1–2, ORA-001.4 y D06/D08/D12. La base ya contempla casos versionados, DataPlan y datos tipados; no define suficientemente el ciclo de vida de las instancias parametrizadas como activo de automatización.

### **Propuesta**

El modelo de caso debe admitir:

- Parámetros tipados y restricciones de dominio.
- Conjuntos de datos versionados.
- Valores y generadores sintéticos reproducibles.
- Expectativas derivadas de reglas acreditadas.
- Identidad estable de cada combinación ejecutada.
- Selección de filas o combinaciones sin alterar la definición principal.

Una semilla aleatoria no garantiza reproducibilidad si cambian el algoritmo, los datos de referencia o el generador. Conservar esos elementos cuando sean necesarios y estén autorizados.

### **Dependencias, riesgos y alternativas**

Depende del modelo de casos, DataPlan, oráculos y memoria versionada. El principal riesgo es generar combinaciones excesivas o incorporar datos sensibles.

Alternativa de menor alcance: parametrización mediante tablas explícitas y tipadas, dejando generadores combinatorios avanzados como ampliación posterior.

### **Criterios de aceptación**

Un caso con diez conjuntos de entradas conserva una identidad funcional y diez instancias distinguibles. Una discrepancia afecta a la instancia correspondiente y mantiene el oráculo y los datos reproducibles.

Modificar una entrada o generador produce una nueva revisión. Un parámetro inválido se rechaza antes del despacho.

**Comportamiento negativo obligatorio:** una fila omitida no desaparece del denominador ni se convierte en PASS.

## **7.3. AC01-QA04-02 — Componentes reutilizables de automatización**

**Clasificación:** BRECHA NUEVA.\
**Prioridad:** esencial, en alcance limitado.

### **Problema profesional**

En sistemas empresariales, decenas de pruebas pueden depender de acciones comunes: buscar registros, seleccionar filtros, abrir un formulario, completar un wizard o verificar una tabla.

Si todas mantienen copias independientes, un cambio de interfaz puede exigir reparar decenas de casos.

La separación entre identidad funcional y revisión ejecutable prevista en CAS-001.3 es necesaria, pero no resuelve completamente la reutilización composicional.

**Actores:** SDET y QA Automation Engineer.

**Referencia profesional:** mantenibilidad, arquitectura y reutilización de soluciones de automatización en ISTQB CTAL-TAE v2.0.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://istqb.org\&sz=32)

istqb.org



### **Propuesta**

Introducir un concepto lógico de componente reutilizable de prueba, sin prescribir una nueva entidad física ni un lenguaje definitivo.

Debe tener identidad, revisión, parámetros, precondiciones, salidas tipadas, efectos previstos, dependencias, autoridad requerida y localización de fallos.

El plan congelado debe resolver y fijar las revisiones de todos los componentes utilizados.

Un componente no obtiene permiso por estar registrado o reutilizarse.

### **Dependencias y riesgos**

CAS-001.3, MEM-001.3, PLN-001.4–5, DAT-001.2, REG-001.3 y REQ-E2E-001.

Existe riesgo de crear un lenguaje de programación propio innecesariamente complejo o permitir composiciones que oculten efectos.

**Alternativa:** comenzar con bloques declarativos tipados y composición acotada, sin recursión arbitraria ni scripting general.

### **Aceptación**

Tres casos reutilizan un componente. Una revisión posterior modifica su localizador, preservando las ejecuciones anteriores y mostrando qué casos quedarían afectados.

El plan antiguo conserva su componente congelado. El plan nuevo utiliza la revisión actual autorizada.

**Prueba negativa:** un componente no puede incorporar una operación mutativa nueva mediante una edición de localizador aparentemente inocua.

**Decisión:** ratificar esta ampliación funcional; no hace falta modificar HOST/DETERMINISTIC.

## **7.4. AC01-QA04-03 — Identidad compartida entre pruebas manuales y automatizadas**

**Clasificación:** PRECISAR CONTRATO.\
**Prioridad:** esencial si se ratifica el uso humano cotidiano.

### **Problema profesional**

Una prueba creada por QA manual puede automatizarse posteriormente. Si la automatización genera una prueba totalmente independiente, se pierde trazabilidad y aparecen duplicaciones de cobertura.

**Actores:** QA manual, SDET, QA Lead.

**Referencias:** CAS-001.3, MEM-001.3–4, REP-001.4, D05 y D12. Dependencia transversal con QA-02.

### **Propuesta**

Mantener la identidad funcional del caso separada de sus representaciones ejecutables.

Una representación podrá ser manual, híbrida o determinista automatizada. Cada modalidad conserva su revisión y evidencia específica.

La conversión debe registrar qué pasos son automatizables, cuáles requieren intervención, qué afirmaciones pueden verificarse de forma equivalente y cuáles carecen de un testigo suficiente.

No debe marcarse como automatizada una prueba parcialmente automatizada ocultando pasos humanos.

### **Alternativas y riesgos**

Mantener casos separados vinculados mediante relaciones es posible, pero dificulta calcular cobertura sin duplicaciones. Es preferible conservar identidad compartida cuando la intención sea verdaderamente equivalente.

El riesgo es tratar la equivalencia funcional como igualdad de scripts o evidencia.

### **Aceptación**

Un caso manual con cinco pasos se transforma en una revisión automatizada de cuatro pasos y una comprobación humana.

QAP declara modalidad híbrida y conserva el paso pendiente. Solo acredita las afirmaciones realmente verificadas.

**Negativo:** eliminar el paso humano para permitir PASS automático debe generar una diferencia de cobertura, no una conversión satisfactoria.

## **7.5. AC01-QA04-04 — Adaptación de suites de automatización existentes**

**Clasificación:** BRECHA NUEVA respecto al alcance específico de suites externas.\
**Prioridad:** integración externa; contrato mínimo candidato al lanzamiento.

### **Problema profesional**

Una organización puede tener cientos de pruebas automatizadas en diferentes lenguajes y frameworks. Exigir su reescritura completa en QAP incrementaría el costo de adopción.

Pero permitir ejecutar cualquier script desde el núcleo destruiría la frontera de autoridad.

**Actores:** SDET, DevOps, desarrollo y seguridad.

**Referencias:** INT-001.1/4, D13, AR-28 y AR-52. Los puertos existentes de [`engine/src/ports.ts`](https://github.com/Hyouka73/QAMCP/blob/303e621dbca4a3a3b17cb2bf32530ab6311edc92/packages/engine/src/ports.ts?utm_source=chatgpt.com) aportan una base conceptual, no un contrato acreditado para ejecutar herramientas arbitrarias.

### **Propuesta**

Definir tres modalidades distintas de interoperabilidad:

| Modalidad             | Autoridad de QAP                                                              |
| --------------------- | ----------------------------------------------------------------------------- |
| Ingesta de resultados | QAP recibe evidencia producida externamente.                                  |
| Orquestación externa  | QAP solicita una ejecución mediante una integración autorizada.               |
| Adaptación canónica   | El mecanismo satisface las garantías de ejecución, efectos y testigos de QAP. |

La tercera modalidad exige cualificación expresa y no debe concederse automáticamente a un plugin.

El contrato debe declarar capacidades, versión, entradas, efectos posibles, cancelación, aislamiento, límites, procedencia y formato de salida.

### **Riesgos y alternativas**

Los scripts externos pueden ejecutar operaciones que QAP no controla ni observa. No es suficiente solicitar al script que respete una política.

Alternativa inicial recomendada: ingesta pasiva de resultados y contrato de interoperabilidad; ejecución delegada únicamente cuando exista una frontera efectiva acreditada.

### **Aceptación**

Registrar una suite externa de pruebas unitarias y consultar su resultado sin ejecutarla ni atribuirle acreditación canónica.

Un adaptador no calificado que solicita acceso a recursos o destinos no autorizados es rechazado.

**Negativo:** exit code 0 de un proceso externo no produce PASS funcional de QAP.

No propongo incorporar motores nativos para Jest, Vitest, pytest, JUnit, NUnit u otros frameworks.

## **7.6. AC01-QA04-05 — Ingesta y separación de resultados externos**

**Clasificación:** BRECHA NUEVA.\
**Prioridad:** esencial en alcance mínimo.

### **Problema profesional**

Un QA Lead necesita consultar resultados producidos por diferentes niveles de prueba en un mismo contexto de entrega.

Por ejemplo, pruebas unitarias exitosas, contratos verificados y una campaña E2E de QAP fallida.

Sin separación de procedencia, un resultado externo podría introducir una acreditación falsa.

**Actores:** QA Lead, SDET y Release Manager.

**Referencias:** IA-001.5, REP-001.1–2, MEM-001.1, INT-001.4 y AR-52.

### **Propuesta**

Admitir resultados externos como registros con procedencia explícita, no como intentos canónicos de QAP.

Campos mínimos: productor, herramienta y versión, identificador de ejecución, build declarado, entorno, identidad del artefacto, hash cuando esté disponible, alcance, resultados originales, fecha y limitaciones de confianza.

Un resultado importado puede relacionarse con requisitos y casos, pero no promoverse automáticamente a testigo independiente acreditado.

### **Alternativas y riesgos**

Una simple referencia externa sería más barata, pero perdería capacidad de consulta histórica. Una copia integral indiscriminada podría introducir secretos o retención excesiva.

Recomiendo importar un resumen saneado y referencias controladas, conservando el original autorizado cuando la política lo permita.

### **Aceptación**

Importar un informe externo con 100 pruebas exitosas junto a una campaña QAP con un defecto funcional acreditado.

La vista integrada distingue ambos orígenes. Las 100 pruebas no compensan el defecto ni modifican los indicadores de la campaña QAP.

**Negativos:** archivos malformados, identidades incompatibles, duplicados y datos fuera de alcance no se promueven ni sobrescriben resultados previos.

## **7.7. AC01-QA04-06 — Identidad verificable de la versión probada**

**Clasificación:** PRECISAR CONTRATO.\
**Prioridad:** esencial.

### **Problema profesional**

El commit de un repositorio no demuestra necesariamente qué versión está desplegada en un entorno QA.

Una regresión podría ejecutarse contra una versión anterior, una instancia incorrecta o un artefacto distinto del esperado.

**Actores:** DevOps, SDET, Release Manager.

**Referencias:** MEM-002.1, PLN-001.5, RUN-001.2, REG-001.1 y AR-04/40.

### **Propuesta**

Precisar la identidad del AUT mediante un contexto de ejecución que pueda vincular:

| Dimensión         | Ejemplo                                  |
| ----------------- | ---------------------------------------- |
| Versión esperada  | Identidad declarada por el pipeline.     |
| Revisión fuente   | Commit del repositorio AUT.              |
| Artefacto         | Identificador o digest del build.        |
| Despliegue        | Identidad de la instalación observada.   |
| Configuración     | Revisión y flags relevantes.             |
| Versión observada | Fuente autorizada de identificación.     |
| Confianza         | Declarada, corroborada o no verificable. |

No se exige que toda aplicación exponga un digest. Debe admitirse evidencia alternativa y declarar incertidumbre cuando no pueda verificarse la identidad necesaria.

### **Riesgos y alternativas**

Exigir acceso al repositorio AUT o a la plataforma de despliegue excluiría aplicaciones de caja negra. El modo de identificación debe depender de las fuentes autorizadas disponibles.

### **Aceptación**

El pipeline solicita probar la versión B y el entorno acredita la versión A.

QAP no atribuye resultados a B. Registra la discrepancia y bloquea la acreditación dependiente de esa identidad.

Si la política permite una evaluación exploratoria de A, esta se mantiene claramente separada.

## **7.8. AC01-QA04-07 — Operación CI completamente desatendida**

**Clasificación:** PRECISAR CONTRATO.\
**Prioridad:** esencial.

### **Problema profesional**

Un pipeline no puede depender de que una persona responda preguntas del HOST, seleccione un navegador o apruebe rutinariamente cada caso.

QAP ya contempla CI y replay determinista. No corresponde inventar un nuevo modo de inteligencia.

**Referencias:** D03/D13/D20, IA-001.2, CAM-001.4, INT-001.1 y AR-52.

La documentación oficial de Playwright confirma la práctica de ejecutar suites automatizadas en CI, incluyendo configuraciones y particiones de pruebas.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://playwright.dev\&sz=32)

Playwright



### **Propuesta**

Precisar un perfil operativo no interactivo que reciba una campaña congelada, identidad del AUT, perfil autorizado, límites de recursos, referencias opacas de secretos y política de entrega.

Sin TTY ni HOST, podrá ejecutar trabajo determinista elegible y consultar su progreso.

Si requiere razonamiento nuevo, debe declararlo explícitamente. No se activa un proveedor de IA implícitamente.

### **Aceptación**

Ejecutar, en una futura prueba autorizada, una campaña congelada desde un entorno CI sin modelo conectado y sin terminal interactiva.

Debe conservar semántica, evidencia y autorización equivalentes a CLI/MCP.

El consumo de inferencia será cero durante esa ejecución determinista.

**Negativos:** permisos ausentes, versión incompatible y necesidad de razonamiento no disponible producen los estados previstos por contrato, sin preguntas ocultas ni bloqueos indefinidos.

### **Dependencias y alternativas**

EXP-07, E1/E3/E5/E7, secretos fuera de banda y operación local soberana.

Se puede integrar inicialmente mediante la CLI universal, sin desarrollar plugins propietarios para cada proveedor de CI.

## **7.9. AC01-QA04-08 — Resultados consumibles por CI y proyección JUnit**

**Clasificación:** PRECISAR CONTRATO.\
**Prioridad:** esencial.

### **Problema profesional**

Las plataformas CI consumen formatos simplificados que no representan necesariamente incertidumbre, integridad, cleanup o independencia de testigos.

GitLab, por ejemplo, distingue la presentación de resultados JUnit del estado de salida del trabajo. Publicar el informe no hace que una ejecución fallida marque automáticamente el job como fallido.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://docs.gitlab.com\&sz=32)

GitLab Docs



### **Propuesta**

Ofrecer dos productos complementarios:

**A. Sobre canónico QAP:** íntegro, versionado y compatible con AR-52.

**B. Proyección de interoperabilidad:** JUnit XML u otro formato aceptado por la plataforma, identificado expresamente como representación parcial.

JUnit no sustituye el manifiesto, los cuatro ejes ni el código terminal verificado.

La proyección debe utilizar identificadores estables y distinguir casos homónimos, intentos y variantes cuando lo permita el consumidor. Las pérdidas de representación deben documentarse.

### **Aceptación**

| Escenario                               | Resultado CI exigido              |
| --------------------------------------- | --------------------------------- |
| PASS funcional completo y verificable   | Éxito                             |
| FAIL funcional                          | No éxito                          |
| PASS estructural únicamente             | No éxito funcional                |
| Cleanup pendiente                       | No éxito                          |
| Selección vacía                         | No éxito                          |
| Evidencia requerida alterada            | No éxito                          |
| ACK de admisión                         | No es resultado terminal          |
| Consulta exitosa de una campaña fallida | Consulta exitosa; campaña fallida |

La proyección XML puede agrupar categorías para compatibilidad, pero el verificador CI debe utilizar el sobre canónico.

**Negativo:** modificar el JUnit para que todas las pruebas aparezcan exitosas no cambia el resultado canónico.

### **Dependencias y riesgos**

AR-08/52, E5/E7, REP-001.1–2.

No crear una taxonomía alternativa para CI. El riesgo principal es reinterpretar estados no representables como éxito.

## **7.10. AC01-QA04-09 — Frontera de confianza de integración continua**

**Clasificación:** PRECISAR CONTRATO.\
**Prioridad:** esencial.

### **Problema profesional**

Los pipelines pueden ejecutar contribuciones de código no confiables, configuraciones alteradas y artefactos generados por procesos con distintos privilegios.

La documentación oficial de GitHub Actions advierte específicamente sobre los riesgos del código no confiable en workflows y de los runners comprometidos.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://docs.github.com\&sz=32)

GitHub Docs+1



**Actores:** DevOps, seguridad y SDET.

**Referencias:** D07/D20, SEG, AR-07/28/40 y DE-02.

### **Propuesta**

Distinguir explícitamente:

- Identidad que solicita la ejecución.
- Identidad efectiva del ejecutor.
- Confianza del origen de código y configuración.
- Permiso para actuar sobre el AUT.
- Permiso para acceder a evidencia.
- Permiso para exportar resultados.

Una contribución de código, archivo del repositorio, etiqueta de workflow o variable de entorno no constituye autoridad por sí misma.

La ejecución de código no confiable debe quedar separada de los secretos y del ejecutor acreditado.

### **Aceptación**

Un cambio no confiable intenta sustituir la definición de campaña, ampliar destinos y obtener una sesión privilegiada.

QAP rechaza la modificación o exige una revisión autorizada independiente. No entrega secretos ni amplía efectos.

**Alternativas:** runners separados, ejecuciones locales gobernadas o transferencia únicamente de artefactos saneados. La selección técnica se difiere.

**Decisión:** cualquier aceptación de riesgos nuevos derivados de código externo requiere propietario. No propongo ampliar permisos vigentes.

## **7.11. AC01-QA04-10 — Selección de regresión explicable y conservadora**

**Clasificación:** PRECISAR CONTRATO.\
**Prioridad:** esencial.

### **Problema profesional**

Ejecutar todas las pruebas en cada cambio puede ser innecesariamente costoso, pero ejecutar únicamente pruebas asociadas a archivos modificados puede omitir dependencias importantes.

El `ImpactAnalyzer` actual reconoce expresamente que opera sobre un inventario suministrado por el consumidor cuya coherencia no verifica.

**Fuente:** [`impact-analyzer.ts`](https://github.com/Hyouka73/QAMCP/blob/303e621dbca4a3a3b17cb2bf32530ab6311edc92/packages/knowledge/src/impact/impact-analyzer.ts?utm_source=chatgpt.com).

**Referencias:** REG-001.1, MEM-003.2, PLN-001.3, AR-40.

### **Propuesta**

La selección debe explicar casos incluidos, dependencias transitivas, señales utilizadas, señales indisponibles, casos excluidos, riesgo residual y revisión del inventario.

Debe admitir políticas diferenciadas de smoke, regresión por impacto y regresión amplia.

Una señal desconocida no equivale a ausencia de impacto.

### **Aceptación**

Un cambio en una regla compartida de cálculo afecta indirectamente a tres módulos, aunque sus archivos individuales no hayan cambiado.

El selector identifica dependencias acreditadas y explica la selección.

Cuando el mapa de dependencias sea incompleto, aplica una estrategia conservadora autorizada o declara cobertura insuficiente.

**Negativo:** la ausencia de acceso a Git no genera una campaña vacía acreditada como satisfactoria.

### **Alternativas**

El análisis puede apoyarse inicialmente en reglas y dependencias funcionales. El análisis estático profundo del código AUT y las técnicas avanzadas de selección basadas en cobertura pueden permanecer externos u opcionales.

## **7.12. AC01-QA04-11 — Gestión de flakiness, cuarentena y recuperación**

**Clasificación:** PRECISAR CONTRATO.\
**Prioridad:** esencial.

### **Problema profesional**

Una prueba inestable erosiona la confianza en todo el pipeline. Repetirla hasta conseguir PASS puede ocultar defectos reales.

Playwright diferencia resultados de pruebas que pasan inicialmente, pasan tras un reintento o fallan después de los reintentos. Esta separación es una referencia útil, no una taxonomía que QAP deba copiar.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://playwright.dev\&sz=32)

Playwright



**Referencias:** REG-001.2, MEM-003.3, RUN-001.4, REP-001.4 y AR-52.

### **Propuesta**

Distinguir como atributos diagnósticos:

- Inestabilidad del AUT.
- Inestabilidad de automatización.
- Inestabilidad del entorno.
- Testigo insuficiente o fluctuante.
- Causa todavía no determinada.

El análisis debe comparar intentos suficientemente equivalentes y conservar tamaños de muestra y limitaciones.

La cuarentena debe tener motivo, autoridad, alcance, vigencia, responsable y condiciones de salida.

No constituye un séptimo veredicto funcional.

### **Aceptación**

Una secuencia FAIL/PASS/FAIL sobre contextos equivalentes conserva los tres intentos y una señal de inestabilidad.

Si una obligación requerida se pone en cuarentena, permanece visible como no satisfecha cuando corresponda. No puede desaparecer del denominador.

**Negativo:** una nueva ejecución exitosa no reescribe el FAIL original ni invalida automáticamente un defecto acreditado.

### **Alternativas y riesgos**

La detección estadística sofisticada puede diferirse. La conservación de intentos, clasificación inicial y gestión explícita de cuarentena sí son necesidades tempranas.

La tasa de flakiness debe acompañarse del denominador; no presentar una estimación concluyente con evidencia insuficiente.

## **7.13. AC01-QA04-12 — Esperas semánticas, estabilidad y diagnóstico de timeout**

**Clasificación:** PRECISAR CONTRATO.\
**Prioridad:** esencial.

### **Problema profesional**

Las automatizaciones son frágiles cuando dependen de pausas temporales fijas.

Una interfaz puede mostrar un elemento antes de que sea interactuable; una operación puede responder antes de que su efecto sea persistente.

**Referencias:** ORA-001.6, DIS, RUN-001.1–5, D12/D15 y AR-09.

Las prácticas de automatización de Playwright incluyen aislamiento y localizadores orientados al comportamiento observable.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://playwright.dev\&sz=32)

Playwright+1



### **Propuesta**

Separar las condiciones de espera:

| Clase                  | Propósito                                             |
| ---------------------- | ----------------------------------------------------- |
| Disponibilidad técnica | El objetivo puede ser localizado.                     |
| Interacción            | El control puede utilizarse legítimamente.            |
| Transición de estado   | La aplicación alcanza el estado previsto.             |
| Convergencia funcional | El efecto esperado se acredita.                       |
| Reconciliación         | Se resuelve la incertidumbre de una operación previa. |

Cada condición debe tener presupuesto, estrategia de adquisición, evidencia y causa de expiración.

No utilizar la falta de actividad de red como oráculo universal de finalización.

### **Aceptación**

Una operación devuelve HTTP 201 inmediatamente, pero materializa su efecto más tarde.

El sistema espera conforme a la ventana acreditada. Si el efecto no se produce y el testigo es suficiente, emite el veredicto correspondiente.

Si falla el mecanismo de adquisición, distingue ERROR de un defecto funcional.

**Negativo:** ampliar indiscriminadamente todos los timeouts no constituye una reparación acreditada.

## **7.14. AC01-QA04-13 — Reparación sostenible de automatizaciones**

**Clasificación:** PRECISAR CONTRATO.\
**Prioridad:** esencial.

### **Problema profesional**

La reparación automática de selectores puede hacer que una prueba vuelva a ejecutarse, pero también puede dirigirla a un elemento funcionalmente diferente.

**Actores:** QA Automation Engineer y SDET.

**Referencias:** REG-001.3, CAS-001.3, MEM-001.3–4, IA-001.3 y D05/D12.

### **Propuesta**

Clasificar el drift en cambios de localización, representación, estructura, contrato, expectativa y alcance.

Solo los cambios de representación ejecutable compatibles pueden producir una revisión que conserve la expectativa acreditada.

Un cambio de regla, efecto o autorización exige el procedimiento correspondiente, no una reparación automática del selector.

### **Aceptación**

Un botón cambia de identificador técnico conservando semántica y destino. Se produce una revisión enlazada y se prueba su equivalencia.

En un control negativo aparece otro botón con texto similar que ejecuta una operación diferente. La reparación se rechaza.

**Alternativas:** localizadores semánticos, identificadores estables aportados por el AUT o intervención de un operador autorizado. No seleccionar definitivamente un mecanismo.

**Riesgo principal:** autocuración que sustituya la intención por el comportamiento observado y termine normalizando defectos.

## **7.15. AC01-QA04-14 — Evaluación y comunicación de testabilidad**

**Clasificación:** BRECHA NUEVA.\
**Prioridad:** esencial como capacidad diagnóstica; modificación AUT fuera de alcance.

### **Problema profesional**

Una aplicación puede ser funcionalmente correcta y, aun así, difícil de probar por falta de identificadores estables, observabilidad, mecanismos de aislamiento o fuentes de verificación independientes.

QAP necesita distinguir un defecto del producto de una limitación de testabilidad.

**Actores:** SDET, desarrollador y arquitecto AUT.

### **Propuesta**

Registrar impedimentos de testabilidad con alcance, efecto sobre cobertura, evidencia y sugerencia de mejora.

Ejemplos: ausencia de estados terminales observables, operación asíncrona sin correlación, identificadores ambiguos o datos de prueba imposibles de aislar.

Las sugerencias pueden solicitar que desarrollo considere mejoras, pero QAP no modifica por sí mismo el código o la infraestructura del AUT.

### **Dependencias y riesgos**

DIS, ORA-001.2–7, REP-001.3 y D07/D12.

El riesgo es convertir cualquier limitación del motor de QAP en defecto del AUT. La atribución debe distinguir insuficiencia del sistema probado de insuficiencia de la herramienta.

### **Aceptación**

QAP identifica una operación cuyo efecto no puede verificarse con las fuentes autorizadas disponibles.

Genera un hallazgo de testabilidad y mantiene incertidumbre funcional. No afirma que la operación sea defectuosa ni que haya sido exitosa.

**Alternativa:** evaluación manual complementaria, fuentes autorizadas adicionales o mejora del AUT ejecutada por su equipo responsable.

## **7.16. AC01-QA04-15 — Fixtures y preparación reutilizable de datos**

**Clasificación:** PRECISAR CONTRATO.\
**Prioridad:** esencial.

### **Problema profesional**

Varias pruebas necesitan el mismo tipo de estado inicial. Recrear completamente esos datos para cada ejecución puede ser costoso, pero compartirlos indiscriminadamente genera contaminación y dependencias.

**Referencias:** DAT-001.1–4, PLN-001.4, RUN-001.1, D08/D16 y AV-04/05.

### **Propuesta**

Precisar el ciclo de vida de un fixture reutilizable mediante el DataPlan existente: revisión, propietario, alcance, estrategia de preparación, estado esperado, testigo de disponibilidad, restricciones de compartición, vencimiento y cleanup.

Distinguir fixtures inmutables de referencia, datos exclusivos por intento y datos compartidos explícitamente.

La reutilización requiere comprobar vigencia y autoridad; no basta que el registro ya exista.

### **Aceptación**

Dos casos independientes utilizan datos sintéticos exclusivos. Otros dos comparten una referencia inmutable autorizada.

El planificador evita la concurrencia incompatible y conserva trazabilidad de propietarios y residuos.

**Negativo:** un fixture vencido o correspondiente a otro tenant no se reutiliza automáticamente.

### **Riesgos y alternativas**

Recrear datos siempre es más simple, pero puede ser ineficiente. Compartir todo reduce costo inicial a cambio de mayor fragilidad. Se recomienda selección explícita por clase de fixture, no una política universal.

## **7.17. AC01-QA04-16 — Mocks, stubs y virtualización de servicios**

**Clasificación:** BRECHA NUEVA.\
**Prioridad:** integración externa.

### **Problema profesional**

Una prueba puede necesitar simular que una dependencia externa devuelve errores, demoras o respuestas particulares sin provocar operaciones reales.

WireMock, por ejemplo, documenta simulación de respuestas HTTP, condiciones de coincidencia de solicitudes y verificación de interacciones.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://wiremock.org\&sz=32)

WireMock+1



### **Propuesta**

Permitir utilizar servicios virtualizados previamente autorizados y distinguir su alcance de verificación.

| Entorno de dependencia   | Afirmación posible                                            |
| ------------------------ | ------------------------------------------------------------- |
| Simulado                 | Comportamiento del componente frente a la respuesta simulada. |
| Sandbox real autorizado  | Comportamiento de integración dentro de ese sandbox.          |
| Servicio real autorizado | Comportamiento observado dentro del permiso efectivo.         |

No se permite afirmar que una integración real funciona únicamente porque funciona su simulación.

QAP debe conocer identidad y revisión del doble, alcance y limitaciones.

### **Aceptación**

Una dependencia simulada devuelve un error controlado. QAP acredita que el AUT presenta el mensaje y conserva correctamente el estado esperado.

No atribuye ese resultado al proveedor real.

**Negativo:** si la simulación deja de estar disponible, el sistema no redirige silenciosamente la solicitud hacia un servicio real.

### **Dependencias, riesgos y alternativas**

DAT, SEG, ORA, INT-001.4 y QA-06. Modificar infraestructura, rutas o tráfico AUT requiere autorización separada y no debe introducirse unilateralmente.

No construir un servidor propio de virtualización general en v1.

## **7.18. AC01-QA04-17 — Contratos consumidor-proveedor y compatibilidad entre versiones**

**Clasificación:** BRECHA NUEVA.\
**Prioridad:** integración externa.

### **Problema profesional**

Validar una respuesta contra OpenAPI no demuestra que todas las expectativas de los consumidores de un servicio estén satisfechas.

Pact documenta verificación de contratos por proveedor, publicación de resultados asociados a versiones y comprobaciones de compatibilidad antes del despliegue.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://docs.pact.io\&sz=32)

Pact Docs+1



**Actores:** SDET, desarrollo backend y Release Manager.

### **Propuesta**

Permitir relacionar evidencia externa de contratos consumidor-proveedor con la versión de cada servicio, la revisión del contrato y el entorno relevante.

Distinguir:

- Conformidad estructural de un esquema.
- Satisfacción de interacciones esperadas.
- Compatibilidad entre versiones.
- Verificación de efectos funcionales reales.

Ninguna de esas evidencias sustituye automáticamente a las demás.

### **Aceptación**

Una API cumple OpenAPI, pero rompe una expectativa utilizada por un consumidor.

El informe integrado conserva la conformidad de esquema y el fallo de compatibilidad como hechos diferentes.

**Negativo:** una verificación perteneciente a otra versión del proveedor no se reutiliza automáticamente.

### **Dependencias y alternativas**

QA-002, DAT-001.2, INT-001.4 y QA04-05/06.

Recomiendo interoperabilidad con mecanismos existentes antes que desarrollar un broker de contratos de QAP. Una implementación nativa completa no es necesaria para el lanzamiento.

## **7.19. AC01-QA04-18 — Particionado, concurrencia y ejecución distribuida**

**Clasificación:** PRECISAR CONTRATO.\
**Prioridad:** concurrencia local obligatoria; distribución posterior.

### **Problema profesional**

Dividir una suite entre varios trabajadores puede reducir el tiempo de ejecución. Sin embargo, partir un flujo E2E o duplicar operaciones mutativas puede producir resultados incoherentes.

El sharding es una capacidad documentada en frameworks profesionales como Playwright, pero su existencia no demuestra compatibilidad con las obligaciones de QAP.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://playwright.dev\&sz=32)

Playwright



### **Propuesta**

Dentro de una instancia local, preservar D16 y la admisión mediante DAG, conflictos, recursos, autoridad y dependencias.

Si posteriormente se admite particionado distribuido, cada partición debe declarar su conjunto de obligaciones, afinidad de dependencias, recursos, titularidad y evidencia.

La agregación debe detectar particiones faltantes, duplicadas o incompatibles.

### **Aceptación**

Un conjunto de casos independientes puede ejecutarse concurrentemente sin contaminación. Un flujo con datos y sesiones encadenadas mantiene sus dependencias.

**Negativo:** la ausencia de resultados de una partición requerida impide acreditar una campaña completa.

### **Riesgos y decisión**

La distribución entre máquinas añade problemas de confianza, revocación y coordinación que exceden el alcance local ratificado.

No recomiendo introducir un coordinador remoto ni una base concurrente obligatoria para resolver esta necesidad en v1.

## **7.20. AC01-QA04-19 — Trazabilidad con repositorios, cambios e incidencias**

**Clasificación:** BRECHA NUEVA en integración externa específica.\
**Prioridad:** opcional.

### **Problema profesional**

Un desarrollador necesita localizar qué defecto se detectó, en qué versión, qué cambio puede estar relacionado y qué prueba verifica su corrección.

**Referencias:** REG-001.1, REP-001.3–4, MEM-003.4, AR-40. Dependencia transversal con QA-03.

### **Propuesta**

Permitir referencias versionadas a commits, pull requests, incidencias, builds y revisiones externas.

La asociación entre cambio y defecto debe distinguir correlación de causalidad acreditada.

Inicialmente, bastan identificadores y enlaces introducidos o importados de forma autorizada.

Los conectores que publiquen comentarios, incidencias o resultados deberán ser opt-in, con autorización de destino independiente.

### **Aceptación**

Un defecto se relaciona con una incidencia externa y una revisión correctiva. El retest conserva el FAIL original y acredita el resultado de la nueva versión.

**Negativo:** asociar un commit no convierte automáticamente el defecto en resuelto.

### **Riesgos y alternativas**

La sincronización bidireccional introduce conflictos, identidades duplicadas y posibles fugas. No debe ser condición para utilizar QAP localmente.

Recomiendo enlaces e intercambio portable primero; conectores de escritura después de su calificación.

## **7.21. AC01-QA04-20 — Observabilidad operacional y costo de mantenimiento**

**Clasificación:** PRECISAR CONTRATO.\
**Prioridad:** esencial mínimo; integración avanzada opcional.

### **Problema profesional**

Un SDET necesita conocer por qué las pruebas se vuelven lentas, frágiles o costosas.

Las métricas de CPU, RAM y tokens son necesarias, pero no describen completamente el costo de mantenimiento de una biblioteca de automatizaciones.

**Referencias:** D16/D21, OPT-001/002, MEM-003.3 y REG-001.2–3.

### **Propuesta**

Conservar métricas operativas con denominadores identificables:

| Métrica                           | Propósito                        |
| --------------------------------- | -------------------------------- |
| Duración por caso y revisión      | Detectar degradación.            |
| Tiempo de preparación             | Identificar fixtures costosos.   |
| Tiempo de espera y reconciliación | Diagnosticar dependencias.       |
| Frecuencia de fallos técnicos     | Separar problemas del mecanismo. |
| Tasa de inestabilidad             | Evaluar confiabilidad.           |
| Revisiones por drift              | Medir mantenimiento.             |
| Uso de componentes compartidos    | Identificar impacto de cambios.  |
| Costo por obligación acreditada   | Evitar optimizaciones engañosas. |

No confundir estas métricas operativas con indicadores de aceptación DE-03.

Las convenciones de CI/CD de OpenTelemetry aportan una referencia para interoperabilidad de trazas y métricas, sin que sea obligatorio adoptar ese sistema.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://opentelemetry.io\&sz=32)

OpenTelemetry+1



### **Aceptación**

Dos campañas funcionalmente equivalentes permiten distinguir si una degradación proviene del navegador, preparación de datos, esperas del AUT o mecanismo QAP.

La ausencia de telemetría se representa como desconocida, no como consumo cero.

### **Alternativas y riesgos**

Un conjunto reducido de eventos y métricas locales es suficiente inicialmente. La instrumentación distribuida y los dashboards avanzados pueden quedar como integración posterior.

## **7.22. AC01-QA04-21 — Separación entre calidad de QAP y calidad del AUT**

**Clasificación:** CUBIERTO, con incompatibilidades legacy observadas.\
**Prioridad:** esencial.

### **Problema profesional**

Un framework de pruebas puede contener errores. Una suite interna exitosa no acredita automáticamente que la herramienta detecta defectos externos correctamente.

### **Propuesta**

Preservar la distinción existente entre:

| Dominio                    | Propósito                                     |
| -------------------------- | --------------------------------------------- |
| Pruebas unitarias de QAP   | Verificar funciones del producto QAP.         |
| Pruebas de contrato QAP    | Verificar consistencia entre componentes.     |
| Integración y E2E internos | Verificar el funcionamiento de QAP instalado. |
| Fixtures independientes    | Evaluar detección y veracidad de resultados.  |
| Campañas AUT               | Probar una aplicación dentro de autoridad.    |
| Evaluación ciega           | Acreditar generalización según AV-08.         |

No utilizar métricas de cobertura del código interno como sustituto de DE-03.

El mensaje observado en `release-check.mjs` debe reconciliarse con la normativa vigente durante la futura reconstrucción.

### **Aceptación**

Un paquete supera sus pruebas unitarias, pero falla un control independiente de falso PASS.

QAP no se acredita para lanzamiento.

**Negativo:** el éxito del comando de pruebas del monorepo no permite omitir E8, G6.5 ni las obligaciones aplicables de GA.

No propongo cambiar D21 o las compuertas ratificadas.

## **7.23. AC01-QA04-22 — Portabilidad de activos automatizados**

**Clasificación:** PRECISAR CONTRATO.\
**Prioridad:** esencial.

### **Problema profesional**

Un equipo debe poder transferir casos automatizados, configuraciones permitidas y evidencia entre instalaciones sin perder semántica ni depender del modelo de IA utilizado para crearlos.

**Referencias:** MEM-003.4, MEM-002.4, CAS-001.3, INT-001.1–4, D05/D13/D19/D20.

### **Propuesta**

Precisar un paquete portable de activos de automatización que contenga las revisiones de casos, componentes reutilizables, parámetros, dependencias, expectativas acreditadas, metadatos de compatibilidad y referencias a datos autorizados.

Excluir sesiones, credenciales y grants transferibles.

La importación debe resolver identidades, incompatibilidades y revisiones sin generar permisos ni duplicar autoridad.

No es obligatorio exportar código fuente ejecutable en todos los lenguajes.

### **Aceptación**

Una prueba diseñada en una instalación se importa en otra compatible.

El caso mantiene su linaje e intención. La instalación receptora debe acreditar su propia identidad, destino, capacidades y permisos antes de ejecutarlo.

**Negativo:** copiar el paquete no permite reutilizar credenciales, sesiones ni autorizaciones de la instalación de origen.

# **8. Arquitectura lógica recomendada**

La propuesta siguiente describe responsabilidades funcionales. No prescribe paquetes, librerías, bases de datos ni procesos físicos.

\#chatgpt-mermaid-\_r_jr\_{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;fill:rgb(237, 237, 237);}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#chatgpt-mermaid-\_r_jr\_ .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-\_r_jr\_ .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-\_r_jr\_ .error-icon{fill:rgb(48, 48, 48);}#chatgpt-mermaid-\_r_jr\_ .error-text{fill:rgb(237, 237, 237);stroke:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_jr\_ .edge-thickness-normal{stroke-width:1px;}#chatgpt-mermaid-\_r_jr\_ .edge-thickness-thick{stroke-width:3.5px;}#chatgpt-mermaid-\_r_jr\_ .edge-pattern-solid{stroke-dasharray:0;}#chatgpt-mermaid-\_r_jr\_ .edge-thickness-invisible{stroke-width:0;fill:none;}#chatgpt-mermaid-\_r_jr\_ .edge-pattern-dashed{stroke-dasharray:3;}#chatgpt-mermaid-\_r_jr\_ .edge-pattern-dotted{stroke-dasharray:2;}#chatgpt-mermaid-\_r_jr\_ .marker{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_jr\_ .marker.cross{stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_jr\_ svg{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;}#chatgpt-mermaid-\_r_jr\_ p{margin:0;}#chatgpt-mermaid-\_r_jr\_ .label{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";color:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_jr\_ .cluster-label text{fill:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_jr\_ .cluster-label span{color:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_jr\_ .cluster-label span p{background-color:transparent;}#chatgpt-mermaid-\_r_jr\_ .label text,#chatgpt-mermaid-\_r_jr\_ span{fill:rgb(237, 237, 237);color:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_jr\_ .node rect,#chatgpt-mermaid-\_r_jr\_ .node circle,#chatgpt-mermaid-\_r_jr\_ .node ellipse,#chatgpt-mermaid-\_r_jr\_ .node polygon,#chatgpt-mermaid-\_r_jr\_ .node path{fill:rgb(19, 33, 54);stroke:rgb(31, 78, 148);stroke-width:1px;}#chatgpt-mermaid-\_r_jr\_ .rough-node .label text,#chatgpt-mermaid-\_r_jr\_ .node .label text,#chatgpt-mermaid-\_r_jr\_ .image-shape .label,#chatgpt-mermaid-\_r_jr\_ .icon-shape .label{text-anchor:middle;}#chatgpt-mermaid-\_r_jr\_ .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#chatgpt-mermaid-\_r_jr\_ .rough-node .label,#chatgpt-mermaid-\_r_jr\_ .node .label,#chatgpt-mermaid-\_r_jr\_ .image-shape .label,#chatgpt-mermaid-\_r_jr\_ .icon-shape .label{text-align:center;}#chatgpt-mermaid-\_r_jr\_ .node.clickable{cursor:pointer;}#chatgpt-mermaid-\_r_jr\_ .root .anchor path{fill:rgb(175, 175, 175)!important;stroke-width:0;stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_jr\_ .arrowheadPath{fill:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_jr\_ .edgePath .path{stroke:rgb(175, 175, 175);stroke-width:1px;}#chatgpt-mermaid-\_r_jr\_ .flowchart-link{stroke:rgb(175, 175, 175);fill:none;}#chatgpt-mermaid-\_r_jr\_ .edgeLabel{background-color:rgb(14, 14, 14);text-align:center;}#chatgpt-mermaid-\_r_jr\_ .edgeLabel p{background-color:rgb(14, 14, 14);}#chatgpt-mermaid-\_r_jr\_ .edgeLabel rect{opacity:0.5;background-color:rgb(14, 14, 14);fill:rgb(14, 14, 14);}#chatgpt-mermaid-\_r_jr\_ .labelBkg{background-color:rgba(14, 14, 14, 0.5);}#chatgpt-mermaid-\_r_jr\_ .cluster rect{fill:rgb(48, 48, 48);stroke:rgba(255, 255, 255, 0.15);stroke-width:1px;}#chatgpt-mermaid-\_r_jr\_ .cluster text{fill:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_jr\_ .cluster span{color:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_jr\_ div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:12px;background:rgb(48, 48, 48);border:1px solid rgba(255, 255, 255, 0.15);border-radius:2px;pointer-events:none;z-index:100;}#chatgpt-mermaid-\_r_jr\_ .flowchartTitleText{text-anchor:middle;font-size:18px;fill:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_jr\_ rect.text{fill:none;stroke-width:0;}#chatgpt-mermaid-\_r_jr\_ .icon-shape,#chatgpt-mermaid-\_r_jr\_ .image-shape{background-color:rgb(14, 14, 14);text-align:center;}#chatgpt-mermaid-\_r_jr\_ .icon-shape p,#chatgpt-mermaid-\_r_jr\_ .image-shape p{background-color:rgb(14, 14, 14);padding:2px;}#chatgpt-mermaid-\_r_jr\_ .icon-shape .label rect,#chatgpt-mermaid-\_r_jr\_ .image-shape .label rect{opacity:0.5;background-color:rgb(14, 14, 14);fill:rgb(14, 14, 14);}#chatgpt-mermaid-\_r_jr\_ .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#chatgpt-mermaid-\_r_jr\_ .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#chatgpt-mermaid-\_r_jr\_ .node .neo-node{stroke:rgb(31, 78, 148);}#chatgpt-mermaid-\_r_jr\_ [data-look="neo"].node rect,#chatgpt-mermaid-\_r_jr\_ [data-look="neo"].cluster rect,#chatgpt-mermaid-\_r_jr\_ [data-look="neo"].node polygon{stroke:url(#chatgpt-mermaid-\_r_jr\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_jr\_ [data-look="neo"].swimlane.cluster rect{filter:none;}#chatgpt-mermaid-\_r_jr\_ [data-look="neo"].node path{stroke:url(#chatgpt-mermaid-\_r_jr\_-gradient);stroke-width:1px;}#chatgpt-mermaid-\_r_jr\_ [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_jr\_ [data-look="neo"].node .neo-line path{stroke:rgb(31, 78, 148);filter:none;}#chatgpt-mermaid-\_r_jr\_ [data-look="neo"].node circle{stroke:url(#chatgpt-mermaid-\_r_jr\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_jr\_ [data-look="neo"].node circle .state-start{fill:#000000;}#chatgpt-mermaid-\_r_jr\_ [data-look="neo"].icon-shape .icon{fill:url(#chatgpt-mermaid-\_r_jr\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_jr\_ [data-look="neo"].icon-shape .icon-neo path{stroke:url(#chatgpt-mermaid-\_r_jr\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_jr\_ .node text{font-size:14px;font-weight:600;letter-spacing:normal;fill:rgb(153, 206, 255);}#chatgpt-mermaid-\_r_jr\_ .edgeLabels text{font-size:13px;font-weight:600;letter-spacing:-0.08px;fill:rgb(153, 206, 255);}#chatgpt-mermaid-\_r_jr\_ .node tspan[font-weight="normal"],#chatgpt-mermaid-\_r_jr\_ .edgeLabels tspan[font-weight="normal"]{font-weight:600;}#chatgpt-mermaid-\_r_jr\_ .edgeLabel .label rect{opacity:1;rx:13px;ry:13px;fill:rgb(0, 14, 26);stroke:rgb(26, 62, 95);stroke-width:1px;}#chatgpt-mermaid-\_r_jr\_ .node rect,#chatgpt-mermaid-\_r_jr\_ .node circle,#chatgpt-mermaid-\_r_jr\_ .node ellipse,#chatgpt-mermaid-\_r_jr\_ .node polygon,#chatgpt-mermaid-\_r_jr\_ .node path{fill:rgb(0, 40, 77);stroke:rgba(255, 255, 255, 0.1);stroke-width:1px;}#chatgpt-mermaid-\_r_jr\_ .node rect{rx:16px;ry:16px;}#chatgpt-mermaid-\_r_jr\_ .mermaid-decision .label-container{fill:rgb(0, 14, 26);stroke:rgb(26, 62, 95);stroke-dasharray:2,2;}#chatgpt-mermaid-\_r_jr\_ .edgePaths .flowchart-link{stroke:rgb(175, 175, 175);stroke-width:1px;stroke-linecap:round;stroke-linejoin:round;}#chatgpt-mermaid-\_r_jr\_ .marker{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_jr\_ :root{--mermaid-font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";}Biblioteca de pruebasCasos y revisionesComponentes reutilizablesConjuntos de datos y fixturesPlan congeladoBuild y contexto AUTCambios y riesgoAutoridad y admisiónEjecutor canónicoAdaptadores calificadosOráculos y testigosResultados canónicosSuites externasResultados externosIngesta gobernadaConsultas y reportesCLI / MCP / CIDefectos y desarrolloHistorial y regresión

La diferencia fundamental es que los resultados externos llegan a consultas y reportes mediante una ruta de ingesta gobernada. No se incorporan directamente a la acreditación canónica.

## **8.1. Evaluación de la hipótesis de cinco dominios lógicos**

El Orquestador plantea distinguir conocimiento, biblioteca, ejecuciones, defectos/reproducción y reportes.

Desde QA-04, la hipótesis es razonable siempre que sean dominios de responsabilidad y consulta sobre el repositorio canónico, no cinco autoridades independientes.

| Dominio               | Responsabilidad para automatización                             |
| --------------------- | --------------------------------------------------------------- |
| Conocimiento          | Reglas, permisos, dependencias y testabilidad.                  |
| Biblioteca            | Casos, revisiones, componentes, parámetros y fixtures.          |
| Ejecuciones           | Planes congelados, intentos, efectos, resultados y cleanup.     |
| Defectos/reproducción | Historial de fallos, drift, inestabilidad y recetas.            |
| Reportes              | Proyecciones, métricas, comparativas y formatos de intercambio. |

No recomiendo crear un sexto dominio físico de CI/CD. El contexto de build, integración externa y procedencia puede incorporarse mediante relaciones y registros dentro de estos dominios.

Tampoco recomiendo que la biblioteca de pruebas sea un segundo sistema de almacenamiento de reglas de negocio. Las expectativas deben referenciar fuentes y revisiones acreditadas.

# **9. Contrato propuesto para automatización reproducible**

Este es un ejemplo conceptual de los hechos que deben conservarse. Los nombres no constituyen una decisión de esquema.

```
automation_asset:
  functional_identity: reference
  revision: reference
  execution_mode: deterministic

  requirements:
    - reference

  execution_context:
    application: reference
    expected_build: reference
    observed_build: reference
    configuration_revision: reference
    environment: reference

  components:
    - identity: reference
      revision: reference

  parameters:
    dataset_revision: reference
    instance_identity: reference

  preconditions:
    data_plan: reference

  authority:
    required_capabilities:
      - reference
    grants_embedded: false

  obligations:
    - identity: reference
      expectation: reference
      minimum_witness: reference

  execution_policy:
    timeout_policy: reference
    retry_policy: reference
    isolation_policy: reference

  cleanup:
    strategy: reference
    verification: reference
```

## **9.1. Qué debe distinguir el modelo**

| Concepto                | Naturaleza                                                |
| ----------------------- | --------------------------------------------------------- |
| Caso                    | Intención de verificación.                                |
| Revisión                | Definición inmutable aplicable a una versión.             |
| Componente reutilizable | Parte composicional referenciada.                         |
| Instancia parametrizada | Combinación concreta de entradas.                         |
| Plan                    | Conjunto congelado y ordenado de obligaciones.            |
| Intento                 | Hecho de ejecución.                                       |
| Resultado               | Evaluación sustentada sobre las obligaciones.             |
| Receta de reproducción  | Insumos e instrucciones necesarios para intentar repetir. |
| Resultado externo       | Evidencia producida fuera de la ejecución canónica.       |

Estas distinciones no requieren necesariamente nueve nuevas entidades persistentes. El diseño posterior debe determinar cuáles se representan mediante relaciones, tipos, revisiones o entidades existentes.

# **10. Integración CI/CD propuesta**

## **10.1. Responsabilidades**

QAP debe poder:

1. Recibir una solicitud de ejecución autorizada.
2. Verificar la revisión de campaña y el contexto esperado.
3. Determinar la identidad observada del AUT cuando sea posible.
4. Preparar los datos según DataPlan.
5. Ejecutar las obligaciones elegibles sin IA.
6. Publicar un sobre terminal verificable.
7. Entregar una proyección interoperable para CI.
8. Conservar resultados, efectos, defectos y referencias históricas.

La plataforma CI/CD conserva la responsabilidad de compilar, aprovisionar ambientes, desplegar aplicaciones y aplicar sus políticas de entrega.

**QAP informa la aceptación funcional de su campaña; no autoriza unilateralmente el lanzamiento del AUT.**

## **10.2. Preservación exacta de AR-52**

Se mantienen los códigos y la precedencia definidos en [AV-04, sección 1](https://github.com/Hyouka73/QAMCP/blob/303e621dbca4a3a3b17cb2bf32530ab6311edc92/docs/qap-architecture/cierre-av-01/enmiendas-av04.md?utm_source=chatgpt.com#1--ar-0852--modelo-y-tabla-total).

| Código de campaña | Resultado                                   |
| ----------------- | ------------------------------------------- |
| 18                | Integridad o atestación incorrecta          |
| 11                | Fallo funcional con riesgo residual         |
| 10                | Fallo funcional                             |
| 12                | Error de ejecución                          |
| 13                | Cleanup incompleto o fallido                |
| 14                | Incertidumbre o bloqueo                     |
| 15                | Obligaciones incompletas                    |
| 0                 | PASS funcional acreditado                   |
| 16                | Comprobación estructural sin PASS funcional |
| 17                | Cierre sin base funcional elegible          |

El estado abierto no tiene código terminal.

El código 20 corresponde, según contexto, a admisión asíncrona, ACK o espera aún abierta, y no constituye un resultado de campaña satisfactorio.

Una consulta exitosa puede devolver código de proceso 0 aunque la campaña consultada haya fallado. CI debe distinguir ambos conceptos.

No recomiendo introducir códigos nuevos para flakiness, importación de suites, cuarentena o modalidades manuales. Esas circunstancias se representan mediante los hechos, estados y atributos correspondientes.

## **10.3. Intercambio con proveedores CI**

La primera implementación no necesita integraciones nativas diferentes para GitHub Actions, GitLab CI, Jenkins o Azure Pipelines.

Una interfaz CLI estable, resultados estructurados y documentación de integración neutral pueden cubrir la necesidad inicial.

Las plataformas CI utilizan mecanismos de salida de proceso y publicación de resultados, aunque sus detalles varían. GitHub documenta que el código de salida determina el éxito o fallo de una acción.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://docs.github.com\&sz=32)

GitHub Docs+1



La adaptación concreta a cada proveedor debe preservar la semántica de QAP, no reducirla a su formato particular.

# **11. Escenarios profesionales contrastados en papel**

Los siguientes escenarios son propuestas de aceptación. Ninguno fue ejecutado.

## **11.1. Corrección de una regla de negocio**

**Situación:** desarrollo modifica una regla compartida de cálculo.

**Flujo esperado:** QAP identifica cambios y dependencias acreditadas, selecciona los casos afectados, conserva las exclusiones, ejecuta con datos sintéticos y verifica mediante reglas independientes.

**Control negativo:** falta el inventario de dependencias.

**Resultado esperado:** selección conservadora o declaración de cobertura insuficiente. Nunca PASS por ausencia de pruebas seleccionadas.

## **11.2. Campaña CI sin IA**

**Situación:** existe una campaña funcional vigente previamente diseñada.

**Flujo esperado:** CLI valida identidad, autoridad, dependencias y snapshot, ejecuta determinísticamente, publica resultado y JUnit.

**Control negativo:** la nueva versión requiere rediseñar un localizador sin equivalencia acreditada.

**Resultado esperado:** deriva o necesidad de revisión explícita, sin activar IA adicional ni inventar equivalencia.

## **11.3. Handoff de QA manual a SDET**

**Situación:** QA manual documenta un proceso empresarial.

**Flujo esperado:** SDET automatiza los pasos posibles, conserva identidad funcional y deja pendientes las comprobaciones no automatizables.

**Control negativo:** desaparece una observación humana necesaria durante la conversión.

**Resultado esperado:** cobertura incompleta identificada.

## **11.4. Prueba externa incompatible con QAP**

**Situación:** una suite unitaria informa resultados exitosos mientras una campaña E2E acredita un defecto.

**Resultado esperado:** ambos hechos permanecen visibles. El defecto no se compensa con el número de pruebas unitarias exitosas.

## **11.5. Interrupción durante una operación mutativa**

**Situación:** un pipeline pierde comunicación después de despachar una operación.

**Resultado esperado:** QAP conserva intención durable, determina incertidumbre y reconcilia antes de cualquier repetición.

**Control negativo:** el pipeline relanza automáticamente el trabajo con los mismos parámetros.

**Resultado esperado:** evitar duplicación mediante recuperación, correlación e idempotencia acreditada.

## **11.6. Prueba con dependencia simulada**

**Situación:** un servicio virtualizado produce un rechazo esperado.

**Resultado esperado:** QAP acredita el comportamiento del AUT frente al rechazo simulado.

**Control negativo:** presentar el informe como prueba satisfactoria del proveedor real.

**Resultado esperado:** impedir esa ampliación indebida del alcance.

## **11.7. Regresión inestable**

**Situación:** una prueba presenta FAIL, PASS y FAIL bajo condiciones comparables.

**Resultado esperado:** tres intentos preservados, clasificación provisional de inestabilidad y evidencia diagnóstica.

**Control negativo:** conservar únicamente el último PASS disponible para entregar el release.

**Resultado esperado:** impedir sustitución retrospectiva del historial y de obligaciones pendientes.

## **11.8. Consulta histórica tras retención**

**Situación:** se consulta una automatización ejecutada hace más de 90 días.

**Resultado esperado:** recuperar resumen permanente y referencias conservadas según DE-01. Identificar las revisiones disponibles y las evidencias expiradas.

**Control negativo:** exigir reproducir una traza multimedia que fue eliminada legítimamente.

**Resultado esperado:** declarar la indisponibilidad. Una nueva ejecución no recrea un hecho histórico.

## **11.9. Cambio de permisos durante CI**

**Situación:** un grant es revocado mientras se ejecuta una campaña.

**Resultado esperado:** detener nuevos efectos afectados, conservar trabajo previo y reconciliar operaciones inciertas.

**Control negativo:** la suite está aprobada y el pipeline sigue activo.

**Resultado esperado:** la aprobación histórica de la suite no prevalece sobre la revocación efectiva.

# **12. Impacto en memoria, permisos y evidencias**

## **12.1. Memoria**

| Información            | Tratamiento recomendado                                     |
| ---------------------- | ----------------------------------------------------------- |
| Caso activo            | Activo versionado sin caducidad automática.                 |
| Componente activo      | Activo de biblioteca con referencias.                       |
| Fixture                | Definición versionada; instancia según su ciclo de vida.    |
| Plan congelado         | Conservación según política y obligaciones.                 |
| Resultado histórico    | Resumen permanente bajo DE-01.                              |
| Detalle de intentos    | 90 días conforme a política.                                |
| Evidencia multimedia   | TTL y grants ratificados.                                   |
| Resultado externo      | Política aplicable a procedencia, finalidad y conservación. |
| Receta de reproducción | Conservar insumos mínimos autorizados según necesidad.      |
| Secretos de CI         | Excluidos de memoria funcional.                             |

La automatización reutilizable no justifica conservar indefinidamente todas las corridas, archivos temporales o datasets.

Los componentes referenciados por defectos abiertos y evidencias imprescindibles requieren una política de protección coherente con DE-01 y con las garantías de custodia.

Se requiere coordinación con QA-03 para determinar el mínimo durable de reproducción. No corresponde que QA-04 imponga unilateralmente una nueva política de retención.

## **12.2. Permisos**

Las capacidades introducidas requieren distinguir lógicamente autorización para diseñar o editar activos, importar resultados, registrar adaptadores, ejecutar campañas, consultar evidencias, exportarlas y vincular herramientas externas.

Estas distinciones deben mapearse sobre el modelo de autoridad existente. No se propone reemplazar las ocho autoridades aceptadas en AV-01.

Una autorización para consumir un resultado externo no concede autoridad para ejecutar su suite.

Una autorización para ejecutar una suite no concede automáticamente autoridad para publicar resultados en un repositorio externo.

## **12.3. Evidencia y oráculos**

Los siguientes elementos no son automáticamente testigos independientes:

- Un resultado exitoso de CI.
- Una firma de un artefacto.
- Un reporte JUnit.
- Una prueba unitaria exitosa.
- Una respuesta simulada.
- Un contrato OpenAPI satisfecho.
- Un video de una interacción.
- Un resultado importado de otra herramienta.

Pueden aportar evidencia útil. Su suficiencia depende de la afirmación, autoridad, contexto, frescura, correlación e independencia causal.

# **13. Capacidades innecesarias o que deben diferirse**

## **13.1. No construir para el primer lanzamiento**

| Capacidad                                          | Justificación                                                      |
| -------------------------------------------------- | ------------------------------------------------------------------ |
| Framework unitario propio                          | Duplica herramientas maduras y amplía innecesariamente el alcance. |
| Lenguaje general de programación de pruebas propio | Alto costo de mantenimiento y riesgo de ejecución arbitraria.      |
| Servidor CI/CD                                     | QAP debe integrarse con pipelines, no sustituirlos.                |
| Plataforma de despliegue                           | Responsabilidad externa a la verificación funcional.               |
| Broker universal de contratos                      | Existen mecanismos especializados integrables.                     |
| Servidor universal de mocks                        | No es requisito para la automatización funcional inicial.          |
| Granja remota de navegadores                       | Introduce coordinación y seguridad distribuida.                    |
| Sistema central multiusuario obligatorio           | Contradice el alcance local inicial ratificado.                    |
| Modelo especializado de IA para automatización     | No resulta necesario para HOST/DETERMINISTIC.                      |
| Traductores universales de suites entre lenguajes  | Equivalencia semántica difícil de acreditar.                       |
| Sistema propietario de gestión Git                 | Bastan operaciones y referencias autorizadas.                      |

## **13.2. Capacidades opcionales posteriores**

La generación automática de pruebas unitarias del AUT, el análisis profundo de cobertura de código, la selección predictiva de regresiones, la mutación automatizada del AUT, la virtualización avanzada y la ejecución distribuida pueden ser valiosas.

No recomiendo hacerlas obligatorias para cumplir el primer lanzamiento.

En particular, la generación de pruebas unitarias legítimas por otros agentes no debe prohibirse. Debe evitarse únicamente que se presenten como ejecución funcional canónica de QAP cuando no satisfacen sus contratos.

# **14. Comparativa de mecanismos profesionales existentes**

Esta comparación identifica capacidades observables. No constituye una selección tecnológica.

| Referencia     | Capacidad relevante                                         | Lección para QAP                                         |
| -------------- | ----------------------------------------------------------- | -------------------------------------------------------- |
| Playwright     | Aislamiento, retries, CI, localizadores y sharding.         | Reutilizar patrones y mecanismos acreditables.           |
| Pact           | Verificación de contratos entre consumidores y proveedores. | Integrar compatibilidad versionada sin duplicar brokers. |
| WireMock       | Simulación y verificación de interacciones HTTP.            | Aprovechar virtualización externa bajo autoridad.        |
| GitHub Actions | Ejecución CI, códigos de salida y políticas de workflows.   | Proporcionar interfaces universales y seguras.           |
| GitLab CI/CD   | Consumo de reportes JUnit.                                  | Separar representación de resultados de aceptación.      |
| OpenTelemetry  | Convenciones de trazas y métricas CI/CD.                    | Facilitar observabilidad interoperable.                  |

**Principio de evaluación:** utilizar mecanismos existentes cuando resuelvan una necesidad profesional sin comprometer las garantías de QAP.

No seleccionar tecnologías por popularidad, por pertenecer al stack actual ni por haber sido utilizadas en expedientes anteriores.

# **15. Impacto sobre AV-01–08**

| Área aprobada | Impacto de las propuestas                                                       |
| ------------- | ------------------------------------------------------------------------------- |
| AV-01         | Mapear nuevas operaciones a autoridad y alcance existentes.                     |
| AV-02         | Aplicar custodia, permisos, revocación y frontera a CI e integraciones.         |
| AV-03         | Extender composición y parametrización sin duplicar cola o runtime.             |
| AV-04         | Preservar exactamente oráculos, efectos, reconciliación y AR-52.                |
| AV-05         | Mantener interoperabilidad externa gobernada y separación de reportes.          |
| AV-06         | Evaluar costo de componentes y adaptadores dentro de perfiles medidos.          |
| AV-07         | Adaptar activos legacy sin convertirlos en autoridades independientes.          |
| AV-08         | Incorporar únicamente deltas ratificados a obligaciones y celdas de aceptación. |

## **15.1. Garantías no negociadas por este informe**

HOST y DETERMINISTIC como modos iniciales.

Cero falsos PASS y cero acreditaciones indebidas.

Escrituras exclusivamente autorizadas por efecto en QA.

Producción y referencia con lectura estrictamente acreditada.

Cuatro ejes y seis veredictos funcionales.

Autoridad única y ausencia de segundo escritor.

Retención DE-01 y captura privada DE-02.

Pisos, vetos y evaluación independiente DE-03.

Piloto obligatorio DE-04 antes de GA.

Accesibilidad conforme a DE-05.

No se propone modificar los umbrales ratificados ni sustituir las 103 entradas normativas por un nuevo catálogo.

Las capacidades nuevas que se aprueben deberán disponer de sus propios criterios verificables y someterse a contravalidación focalizada.

# **16. Decisiones empresariales recomendadas**

No todas las precisiones necesitan una decisión independiente del propietario. Se recomienda agruparlas por consecuencias reales sobre el alcance.

## **DE-AC01-04-A — Alcance de automatización profesional**

**Opción A — recomendada:** automatización funcional nativa reutilizable, parametrizada y compatible con activos manuales, más ejecución determinista desde CI.

**Opción B:** limitar QAP a casos generados y ejecutados mediante el ciclo autónomo existente.

La opción B reduce alcance inicial, pero limita notablemente su utilidad para SDET y equipos de automatización.

## **DE-AC01-04-B — Incorporación de herramientas externas**

**Opción A — recomendada:** ingesta de resultados externos, referencias y contratos de adaptación controlados; ejecución delegada condicionada a cualificación.

**Opción B:** exigir ejecución nativa de múltiples frameworks desde el primer lanzamiento.

**Opción C:** no admitir evidencia externa y obligar a mantener resultados completamente separados.

La opción A equilibra adopción, costo y seguridad.

## **DE-AC01-04-C — Alcance de CI/CD**

**Opción A — recomendada:** CLI desatendida, contrato canónico, identidad de build y formatos interoperables.

**Opción B:** desarrollar integraciones nativas para múltiples proveedores CI desde el lanzamiento.

**Opción C:** diferir el uso profesional de CI hasta una versión posterior.

La opción C sería difícil de reconciliar con el consumidor CI ya contemplado por INT-001.1, AR-52 y la paridad ratificada. No debería adoptarse como simple reducción técnica.

## **DE-AC01-04-D — Simulación y contratos especializados**

**Opción A — recomendada:** interoperabilidad con servicios simulados y herramientas externas de contratos, sin construir sus motores universales.

**Opción B:** incorporar virtualización y contratos consumidor-proveedor como motores nativos obligatorios.

**Opción C:** excluir cualquier referencia a simulaciones y contratos externos.

La opción A mantiene la capacidad de ampliar escenarios profesionales sin multiplicar infraestructura propia.

Estos identificadores son provisionales. No forman parte de DE-01–05 ni representan decisiones empresariales aprobadas.

# **17. Evaluación independiente de las propuestas del Orquestador**

| Propuesta                                                     | Dictamen QA-04            |
| ------------------------------------------------------------- | ------------------------- |
| QAP utilizable por humanos sin IA                             | FAVORABLE                 |
| Memoria de activos reutilizables                              | FAVORABLE                 |
| Cinco dominios lógicos                                        | FAVORABLE CON CONDICIONES |
| Reproducción determinista                                     | FAVORABLE                 |
| Conversión manual/automatizada                                | FAVORABLE CON CONDICIONES |
| Herramienta local empresarial                                 | FAVORABLE                 |
| Integraciones externas gobernadas                             | FAVORABLE                 |
| Construir todos los mecanismos QA nativamente                 | DESFAVORABLE              |
| Seleccionar tecnología antes de cerrar producto               | DESFAVORABLE              |
| Acreditar resultados externos automáticamente                 | DESFAVORABLE              |
| Usar automatización como sustituto universal de juicio humano | DESFAVORABLE              |

La aceptación de las propuestas favorables se fundamenta en los escenarios y garantías descritos, no en el consenso con el Orquestador.

La hipótesis de ampliar QAP hacia una plataforma profesional tiene mérito, pero debe evitar una expansión indiscriminada que haga inviable el lanzamiento.

# **18. Fuentes y limitaciones de investigación**

## **18.1. Fuentes internas adicionales**

| Fuente                                                                                                                                                                                          | Materia                           |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| [Acta D01–D21](https://github.com/Hyouka73/QAMCP/blob/303e621dbca4a3a3b17cb2bf32530ab6311edc92/docs/qap-architecture/acta-decisiones.md?utm_source=chatgpt.com)                                 | Decisiones de producto            |
| [Enmiendas AV-03](https://github.com/Hyouka73/QAMCP/blob/303e621dbca4a3a3b17cb2bf32530ab6311edc92/docs/qap-architecture/cierre-av-01/enmiendas-av03.md?utm_source=chatgpt.com)                  | Runtime, autoridad y continuidad  |
| [Enmiendas AV-04](https://github.com/Hyouka73/QAMCP/blob/303e621dbca4a3a3b17cb2bf32530ab6311edc92/docs/qap-architecture/cierre-av-01/enmiendas-av04.md?utm_source=chatgpt.com)                  | Veracidad, testigos y agregación  |
| [Enmiendas AV-05](https://github.com/Hyouka73/QAMCP/blob/303e621dbca4a3a3b17cb2bf32530ab6311edc92/docs/qap-architecture/cierre-av-01/enmiendas-av05.md?utm_source=chatgpt.com)                  | Integraciones y reportes          |
| [Precedencia AV-07](https://github.com/Hyouka73/QAMCP/blob/303e621dbca4a3a3b17cb2bf32530ab6311edc92/docs/qap-architecture/cierre-av-01/precedencia-av07.md?utm_source=chatgpt.com)              | Compatibilidad legacy             |
| [Enmiendas AV-08](https://github.com/Hyouka73/QAMCP/blob/303e621dbca4a3a3b17cb2bf32530ab6311edc92/docs/qap-architecture/cierre-av-01/enmiendas-av08.md?utm_source=chatgpt.com)                  | Aceptación                        |
| [Registro maestro AR](https://github.com/Hyouka73/QAMCP/blob/303e621dbca4a3a3b17cb2bf32530ab6311edc92/docs/qap-architecture/cierre-av-01/registro-maestro.md?utm_source=chatgpt.com)            | Universo de registros             |
| [Resolución final](https://github.com/Hyouka73/QAMCP/blob/303e621dbca4a3a3b17cb2bf32530ab6311edc92/docs/qap-architecture/cierre-av-01/resolucion-final-planificacion.md?utm_source=chatgpt.com) | Aptitud documental y reservas     |
| [Manifiesto raíz del código](https://github.com/Hyouka73/QAMCP/blob/303e621dbca4a3a3b17cb2bf32530ab6311edc92/package.json?utm_source=chatgpt.com)                                               | Scripts y dependencias declaradas |
| [Manifest CLI](https://github.com/Hyouka73/QAMCP/blob/303e621dbca4a3a3b17cb2bf32530ab6311edc92/packages/cli/package.json?utm_source=chatgpt.com)                                                | Distribución y pruebas            |
| [Manifest MCP](https://github.com/Hyouka73/QAMCP/blob/303e621dbca4a3a3b17cb2bf32530ab6311edc92/packages/mcp/package.json?utm_source=chatgpt.com)                                                | Distribución y dependencias       |

## **18.2. Fuentes profesionales externas**

| Fuente primaria                                                                                                                                      | Versión o referencia             |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| [ISTQB CTAL-TAE](https://istqb.org/certifications/certified-tester-advanced-level-test-automation-engineering-ctal-tae-v2-0/?utm_source=chatgpt.com) | v2.0, 2024                       |
| [ISTQB CT-TAS](https://istqb.org/certifications/certified-tester-test-automation-strategy-ct-tas/?utm_source=chatgpt.com)                            | v1.0                             |
| [ISO/IEC/IEEE 29119-2](https://www.iso.org/standard/79428.html?utm_source=chatgpt.com)                                                               | 2021, descripción pública        |
| [Playwright Best Practices](https://playwright.dev/docs/best-practices?utm_source=chatgpt.com)                                                       | Documentación pública consultada |
| [Playwright Retries](https://playwright.dev/docs/test-retries?utm_source=chatgpt.com)                                                                | Documentación pública consultada |
| [Playwright CI](https://playwright.dev/docs/ci?utm_source=chatgpt.com)                                                                               | Documentación pública consultada |
| [Playwright Isolation](https://playwright.dev/docs/browser-contexts?utm_source=chatgpt.com)                                                          | Documentación pública consultada |
| [GitLab Unit Test Reports](https://docs.gitlab.com/ci/testing/unit_test_reports/?utm_source=chatgpt.com)                                             | Documentación pública consultada |
| [GitHub Actions Secure Use](https://docs.github.com/en/actions/reference/security/secure-use?utm_source=chatgpt.com)                                 | Documentación pública consultada |
| [Pact Can I Deploy](https://docs.pact.io/pact_broker/can_i_deploy?utm_source=chatgpt.com)                                                            | Documentación pública consultada |
| [WireMock Stubbing](https://wiremock.org/docs/stubbing/?utm_source=chatgpt.com)                                                                      | Documentación pública consultada |
| [OpenTelemetry CI/CD](https://opentelemetry.io/docs/specs/semconv/cicd/?utm_source=chatgpt.com)                                                      | Convenciones semánticas          |

Las referencias dinámicas de herramientas se consultaron el 25 de noviembre de 2026. No se declaran sus versiones de runtime como congeladas ni seleccionadas para QAP.

## **18.3. Limitaciones explícitas**

La lectura del encargo AC-01 y de la especificación consolidada fue íntegra. Se recuperó la base normativa y se inspeccionaron directamente archivos de código, manifests y scripts relevantes.

Sin embargo:

- Parte de las respuestas extensas del repositorio fue truncada por los límites de recuperación. Se realizaron lecturas selectivas adicionales, pero no puedo certificar una lectura íntegra de cada contrato incorporado por el manifiesto.
- No se realizó un inventario exhaustivo de todos los archivos de tests, workflows y dependencias transitivas.
- Las propuestas clasificadas como brechas nuevas deben cotejarse adicionalmente con los contratos completos antes de incorporarlas al catálogo.
- No se verificó una implementación instalada ni se ejecutó ninguna prueba.
- La revisión de estándares ISO se limitó a información pública accesible.
- La comparación externa fue documental, no una evaluación práctica de herramientas.

Por ello, este informe constituye una investigación especializada sustantiva, pero no debe presentarse como una auditoría exhaustiva concluida de todos los componentes ni como certificación de conformidad.

# **19. Recomendación final al Orquestador Principal**

Recomiendo incorporar el concepto de **automatización funcional profesional reutilizable e interoperable** a la definición de QAP.

La evolución deseable es pasar de una herramienta que descubre y ejecuta pruebas autónomamente a una herramienta que, además:

- Conserva una biblioteca de automatización mantenible.
- Permite diseñar y reutilizar pruebas sin depender de IA.
- Participa en pipelines reales.
- Trabaja con resultados y mecanismos especializados existentes.
- Identifica inequívocamente el contexto probado.
- Facilita el trabajo conjunto de QA manual, SDET y desarrollo.
- Mantiene todas las garantías de autoridad, veracidad y reproducibilidad.

La ampliación debe ser selectiva. El objetivo no es desarrollar veinte herramientas diferentes dentro de QAP, sino proporcionar un núcleo funcional suficientemente robusto para operar con ellas cuando sea necesario.

**Dictamen especializado: FAVORABLE A LA AMPLIACIÓN SELECTIVA DEL ALCANCE, CON PRECISIONES CONTRACTUALES Y RATIFICACIÓN EMPRESARIAL PREVIA.**

Se conserva el dictamen de aptitud documental de la línea base AV-01–08. No se extiende automáticamente a capacidades nuevas.

El siguiente paso corresponde exclusivamente al Orquestador: contrastar los hallazgos de las seis especialidades, eliminar duplicaciones, verificar las brechas contra los contratos íntegros, resolver dependencias transversales y elevar al propietario las decisiones de alcance necesarias.

No se autoriza ni se inicia selección tecnológica definitiva, WBS, G0/G1, implementación, experimentación, migración o acceso a sistemas empresariales.

**FIN DEL INFORME AC-01 / QA-04.**