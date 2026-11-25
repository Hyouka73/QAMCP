# **AV-08 — Segunda contravalidación técnica independiente**

**Proyecto:** QAP — Plataforma autónoma de aseguramiento de calidad\
**Repositorio:** `Hyouka73/QAMCP`\
**Rama:** `develop`\
**SHA auditado:** `7331c2fa66ad2a65340b5224cd9f33124fdbdbea`\
**Fecha:** 25 de noviembre de 2026\
**Responsable:** Segundo Contravalidador Técnico Independiente, en sustitución temporal de Gemini Neon.\
**Destinatario:** Orquestador Principal de QAP.\
**Alcance exclusivo:** AR-06, AR-30, AR-35 y AR-44.\
**Naturaleza:** Contravalidación documental, sin ejecución experimental ni autorización de implementación.

## **1. Dictamen ejecutivo**

**APROBABLE CON CORRECCIONES DOCUMENTALES Y RATIFICACIÓN EMPRESARIAL PENDIENTE.**

La propuesta del Orquestador, integrada con CV08-01–12 de Codex High, constituye una base arquitectónica razonable para establecer la aceptación de QAP como producto empresarial autónomo, y no simplemente como MVP o demostración funcional.

Acepto la dirección de las doce enmiendas por sus fundamentos técnicos, no por coincidencia entre investigadores. No obstante, identifico condiciones materiales que requieren precisión normativa adicional para impedir interpretaciones que permitan certificar capacidades insuficientemente demostradas.

Elementos normativos cotejados

# **92/92**

Ampliaciones cotejadas

# **11/11**

Enmiendas examinadas

# **12/12**

Decisiones empresariales abiertas

# **5**

Correcciones complementarias propuestas

# **8**

Experimentos ejecutados

# **0**

**Integridad nominal comprobada**

103 entradas únicas, sin omisiones ni incorporaciones indebidas.

**Conformidad funcional no acreditada**

El cotejo documental no constituye certificación del producto instalado.

### **1.1. Conclusión principal para el Orquestador**

Después de incorporar CV08-01–12, resolver las ocho correcciones complementarias de este informe y ratificar las decisiones empresariales en sus aspectos necesarios para planificación, **no identifico impedimentos arquitectónicos adicionales dentro del alcance de AV-08 que obliguen a realizar otra auditoría general antes de consolidar la especificación y elaborar posteriormente el plan maestro y WBS por sprints**.

Persisten incertidumbres técnicas y bloqueantes de selección, implementación, certificación, migración y activación. Deben mantenerse como condiciones vinculantes del futuro plan, no utilizarse indiscriminadamente como impedimentos para elaborarlo.

Esta conclusión:

- No acredita que QAP funcione actualmente conforme a sus requisitos.
- No cierra unilateralmente AV-08 ni el registro maestro.
- No autoriza WBS, G0, G1, implementación, migración ni acceso a sistemas empresariales.
- No ratifica decisiones reservadas al propietario.
- No permite reducir requisitos obligatorios ante resultados experimentales desfavorables.

## **2. Base documental y metodología**

### **2.1. Identidad de la revisión**

Mediante el conector de GitHub se verificó que la referencia de `develop` coincide con el SHA solicitado:

`7331c2fa66ad2a65340b5224cd9f33124fdbdbea`

El expediente normativo se examinó fijando las lecturas a dicho SHA. Los SHA históricos citados posteriormente se utilizan exclusivamente para verificar procedencia documental, no como ramas alternativas de trabajo ni como candidatos actuales de producto.

### **2.2. Fuentes principales**

| Referencia | Documento                                                                                                                                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| F01        | [Encargo vinculante de segunda contravalidación](https://github.com/Hyouka73/QAMCP/blob/7331c2fa66ad2a65340b5224cd9f33124fdbdbea/docs/qap-architecture/cierre-av-01/encargo-segunda-contravalidacion-av08.md?utm_source=chatgpt.com) |
| F02        | [Propuesta AV-08 del Orquestador](https://github.com/Hyouka73/QAMCP/blob/7331c2fa66ad2a65340b5224cd9f33124fdbdbea/docs/qap-architecture/cierre-av-01/informe-orquestador-av08.md?utm_source=chatgpt.com)                             |
| F03        | [Enmiendas CV08-01–12](https://github.com/Hyouka73/QAMCP/blob/7331c2fa66ad2a65340b5224cd9f33124fdbdbea/docs/qap-architecture/cierre-av-01/enmiendas-av08.md?utm_source=chatgpt.com)                                                  |
| F04        | [Dictamen de Codex High](https://github.com/Hyouka73/QAMCP/blob/7331c2fa66ad2a65340b5224cd9f33124fdbdbea/docs/qap-architecture/cierre-av-01/dictamen-av08.md?utm_source=chatgpt.com)                                                 |
| F05        | [Matriz normativa de aceptación](https://github.com/Hyouka73/QAMCP/blob/7331c2fa66ad2a65340b5224cd9f33124fdbdbea/docs/qap-architecture/cierre-av-01/matriz-aceptacion-av08.md?utm_source=chatgpt.com)                                |
| F06        | [Procedencia y admisibilidad histórica](https://github.com/Hyouka73/QAMCP/blob/7331c2fa66ad2a65340b5224cd9f33124fdbdbea/docs/qap-architecture/cierre-av-01/procedencia-av08.md?utm_source=chatgpt.com)                               |
| F07        | [Catálogo consolidado de requisitos](https://github.com/Hyouka73/QAMCP/blob/7331c2fa66ad2a65340b5224cd9f33124fdbdbea/docs/qap-architecture/catalogo-requisitos.md?utm_source=chatgpt.com)                                            |
| F08        | [Acta D01–D21 del propietario](https://github.com/Hyouka73/QAMCP/blob/7331c2fa66ad2a65340b5224cd9f33124fdbdbea/docs/qap-architecture/acta-decisiones.md?utm_source=chatgpt.com)                                                      |
| F09        | [Registro maestro](https://github.com/Hyouka73/QAMCP/blob/7331c2fa66ad2a65340b5224cd9f33124fdbdbea/docs/qap-architecture/cierre-av-01/registro-maestro.md?utm_source=chatgpt.com)                                                    |
| F10        | [Decisión AV-07 y apertura AV-08](https://github.com/Hyouka73/QAMCP/blob/7331c2fa66ad2a65340b5224cd9f33124fdbdbea/docs/qap-architecture/cierre-av-01/decision-orquestador-av07-av08.md?utm_source=chatgpt.com)                       |
| F11        | [DAG vigente de compuertas y experimentos](https://github.com/Hyouka73/QAMCP/blob/7331c2fa66ad2a65340b5224cd9f33124fdbdbea/docs/qap-architecture/cierre-av-01/compuertas-av07.md?utm_source=chatgpt.com)                             |
| F12        | [Precedencia normativa AV-07](https://github.com/Hyouka73/QAMCP/blob/7331c2fa66ad2a65340b5224cd9f33124fdbdbea/docs/qap-architecture/cierre-av-01/precedencia-av07.md?utm_source=chatgpt.com)                                         |

Se contrastaron también las decisiones de aceptación de AV-01–07, las enmiendas AV-04, los protocolos AV-03/05/06, la fe de correcciones AR-27 y antecedentes históricos recuperables.

### **2.3. Método aplicado y límites**

La revisión distingue cinco niveles: identidad documental, integridad del conjunto normativo, adecuación semántica del diseño de aceptación, suficiencia del método probatorio y acreditación experimental.

Se realizó un cotejo programático por conjuntos de IDs entre el catálogo y la matriz, así como una comparación de las obligaciones principales de las 90 fichas con sus correspondientes criterios candidatos.

No se materializó el manifiesto exhaustivo de casos de certificación ni se reprodujeron experimentos. La verificación de antecedentes históricos se limitó a los artefactos y localizadores recuperados, sin reconstruir evidencia desaparecida ni afirmar una nueva auditoría integral de todos los expedientes anteriores.

## **3. Resolución individual de los cuatro registros**

| Registro | Dictamen de diseño                                                                           | Estado principal conservado |
| -------- | -------------------------------------------------------------------------------------------- | --------------------------- |
| AR-06    | Favorable con precisiones de métricas, corpus, cobertura y eficiencia.                       | PENDIENTE                   |
| AR-30    | Favorable al contrato G6.5 obligatorio, condicionado a autorización y evidencia empresarial. | BLOQUEANTE                  |
| AR-35    | Favorable a las dos matrices independientes de accesibilidad.                                | PENDIENTE                   |
| AR-44    | Favorable al régimen de procedencia, admisibilidad y conservación de evidencia.              | PENDIENTE                   |

### **3.1. AR-06 — Aceptación integral, métricas y generalización**

La estructura propuesta resulta adecuada porque diferencia cuatro preguntas que no deben confundirse:

1. ¿El producto instalado cumple todos los requisitos obligatorios?
2. ¿Puede operar correctamente sobre aplicaciones desconocidas?
3. ¿Los agentes utilizan QAP de manera efectiva y autónoma?
4. ¿QAP resulta apto para operación empresarial autorizada?

Estas preguntas requieren evidencias distintas. Una respuesta favorable a cualquiera no sustituye las demás.

Recomiendo aceptar el contrato de diseño con las precisiones CC08-01 a CC08-04 y CC08-08 de este informe.

**Pendientes:** DE-03, calificación de celdas, definición completa del manifiesto probatorio, custodia independiente y resultados instalados.

### **3.2. AR-30 — Validación empresarial autorizada**

La inclusión de G6.5 antes de GA está justificada por D01 y D21. Un producto aprobado únicamente sobre fixtures internos o sintéticos no acredita suficientemente preparación para proyectos empresariales reales.

Lendus Core QA es candidato razonable, pero no existe fundamento para interpretar su identificación como autorización operativa vigente.

Debe mantenerse el estado BLOQUEANTE hasta contar con destino equivalente autorizado y evidencia satisfactoria del piloto.

**Este bloqueo afecta la aceptación empresarial y el lanzamiento. No impide planificar las capacidades necesarias para satisfacerlo.**

### **3.3. AR-35 — Accesibilidad**

Se acepta la distinción entre la accesibilidad del propio producto QAP y su capacidad para evaluar la accesibilidad de aplicaciones probadas.

Ambas son obligaciones de lanzamiento independientes.

La política ordinaria de activación puede ser configurable, pero ninguna modalidad empresarial permite eliminar las pruebas normativas de certificación.

### **3.4. AR-44 — Procedencia y evidencia**

Se acepta utilizar antecedentes históricos para identificar controles, modos de fallo y requisitos de falsación.

No se acepta trasladar automáticamente a la nueva distribución ninguna garantía obtenida mediante Recovery, Hydrogen R2, AS-02, AS-04, MVP o suites de versiones anteriores.

La certificación debe corresponder al candidato instalado, sus permisos, sus componentes y sus artefactos verificables.

## **4. Integridad de los 92 elementos normativos y 11 ampliaciones**

### **4.1. Resultado del cotejo exacto**

El cotejo independiente confirma:

| Familia                                   | Fichas en catálogo | Fichas en matriz |
| ----------------------------------------- | ------------------ | ---------------- |
| MEM                                       | 15                 | 15               |
| DIS                                       | 8                  | 8                |
| DOC                                       | 4                  | 4                |
| IA                                        | 6                  | 6                |
| PLN                                       | 6                  | 6                |
| CAS                                       | 5                  | 5                |
| ORA                                       | 7                  | 7                |
| RUN, familia original                     | 6                  | 6                |
| DAT                                       | 4                  | 4                |
| CAM                                       | 5                  | 5                |
| REP                                       | 4                  | 4                |
| REG                                       | 3                  | 3                |
| SEG, familia original                     | 5                  | 5                |
| INT                                       | 4                  | 4                |
| Cinco requisitos añadidos a la línea base | 5                  | 5                |
| Tres requisitos promovidos                | 3                  | 3                |
| **Total REQ**                             | **90**             | **90**           |
| Políticas                                 | 2                  | 2                |
| **Total normativo**                       | **92**             | **92**           |
| Ampliaciones                              | 11                 | 11               |
| **Total de entradas**                     | **103**            | **103**          |

Resultados del cotejo:

- IDs normativos ausentes en matriz: **0**.
- IDs normativos ajenos al catálogo: **0**.
- Duplicados nominales entre las 90 fichas: **0**.
- Ampliaciones ausentes: **0**.
- Ampliaciones ajenas: **0**.

Las dos políticas se preservan como `POL-CAP-001` y `POL-RET-001`.

### **4.2. Corrección heredada de AV-07**

Se confirma que la matriz AV-08 contiene `REQ-MEM-003.6` y no incorpora el ID inexistente `REQ-MEM-001.5`.

La prueba candidata de MEM-003.6 incluye puerto único, adaptador SQLite, independencia del dominio respecto a SQL/driver/transporte, control de escritor y extensibilidad futura.

La corrección anterior queda preservada.

### **4.3. Cotejo de ampliaciones**

| Ampliación   | Cobertura principal exigible                                                                |
| ------------ | ------------------------------------------------------------------------------------------- |
| REQ-AGT-002  | Handoff entre agentes, contexto acotado, permisos, omisiones y medición de consumo.         |
| REQ-ONB-001  | Instalación y diagnóstico idempotentes, tres SO, navegador bajo demanda, proxy y CA.        |
| REQ-OPT-001  | Concurrencia gobernada, presupuestos, presión de recursos, alternancia y limpieza.          |
| REQ-OPT-002  | Compactación con procedencia, cobertura y simulación de poda sin efectos.                   |
| REQ-E2E-001  | DAG multimódulo y multirol, efectos, datos tipados, recuperación y replay.                  |
| UTCP/OpenAPI | Ambos mecanismos sobre puerto común, preparación autorizada, reconciliación y verificación. |
| M1           | DTO y manifiesto común, reportes y navegación accesible.                                    |
| M2           | Exportación portable y PNG auténticos.                                                      |
| M3           | WebM auténtico, geometría, offsets, custodia y prevención.                                  |
| M4           | Visor autenticado, catálogo, rangos, reproducción y revocación.                             |
| M5           | Validación instalada en navegadores reales, portabilidad y fidelidad.                       |

Todas las ampliaciones conservan identidad y relación normativa. Ninguna puede darse por cumplida únicamente porque su ficha padre figure como aprobada.

### **4.4. Cobertura semántica: conclusión y reserva**

La matriz es adecuada como **inventario probatorio inicial**, pero no como matriz final de certificación.

Una fila breve puede representar una obligación compleja sin cubrir todavía todas sus afirmaciones independientes.

Ejemplos:

| Requisito      | Insuficiencia que debe evitarse                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------- |
| REQ-MEM-002.1  | Dos ámbitos diferentes no prueban por sí solos todas las dimensiones de aislamiento.                |
| REQ-MEM-002.5  | Exportar sin secretos no demuestra necesariamente separación física y lógica de almacenes.          |
| REQ-ORA-001.2  | Detectar rollback tras HTTP 201 no acredita toda la clasificación N0–N3.                            |
| REQ-SEG-001.1  | Denegar una operación no acredita independencia de las ocho autoridades y cuatro grants multimedia. |
| REQ-DOC-001.1  | Extraer un PDF correcto no acredita los demás formatos ni clases de D10.                            |
| REQ-AUTREP-001 | Conciliar totales no demuestra integridad de filas, celdas, fórmulas, filtros ni poblaciones.       |
| REQ-INT-001.1  | Paridad MCP/CLI no demuestra automáticamente los consumidores CI ni ausencia de bypass.             |
| REQ-AGT-001    | Registrar el servidor MCP no demuestra adopción o finalización autónoma.                            |
| REQ-RUN-002.1  | Persistir preferencias no acredita fidelidad visual, y viceversa.                                   |
| POL-RET-001    | Una poda exitosa no demuestra protección de activos, publicación pendiente y evidencia requerida.   |

CV08-01 ya reconoce esta limitación. Por tanto, no considero necesaria otra auditoría integral de los 103 elementos.

Sí considero necesario convertir las obligaciones anteriores en reglas explícitas de materialización del manifiesto, conforme a CC08-01.

**Resultado:** integridad nominal acreditada; adecuación semántica del esquema de aceptación favorable con condiciones; cobertura probatoria instalada pendiente.

## **5. Contravalidación individual de CV08-01–12**

| Enmienda | Dictamen                 | Fundamento y complemento                                                                                                                        |
| -------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| CV08-01  | Aceptable con precisión  | Preserva el universo normativo. Debe cerrar subobligaciones, consumidores y celdas antes de su compuerta. CC08-01.                              |
| CV08-02  | Aceptable                | Separa rutas, estados y transiciones; exige precisión y recall. Complementar reglas de estrato y emisiones. CC08-02.                            |
| CV08-03  | Aceptable con precisión  | Distingue afirmación, caso compuesto y defecto causal. Consolidar denominadores y umbrales de ambos niveles. CC08-02.                           |
| CV08-04  | Aceptable con corrección | El límite conjunto requiere denominador inequívoco y conservación de vetos aun con evaluación inválida. CC08-02/03.                             |
| CV08-05  | Aceptable con corrección | La independencia y reserva son apropiadas. Debe excluirse selección iterativa con holdout y establecer admisibilidad antes de revelar. CC08-03. |
| CV08-06  | Aceptable con corrección | Operaciones, paridad y finalización están correctamente separadas. Falta criterio alternativo de eficiencia verificable. CC08-04.               |
| CV08-07  | Aceptable                | Preserva vetos, identidad de artefacto y DAG. Complementar clasificación y no sustitución de evidencia. CC08-03/07.                             |
| CV08-08  | Aceptable con corrección | Define piloto representativo. Reforzar integridad del E2E y distinguir restauración, compensación y confinamiento. CC08-05.                     |
| CV08-09  | Aceptable con precisión  | Separa QAP y AUT. Debe distinguir egress de herramienta y tráfico legítimo del AUT. CC08-06.                                                    |
| CV08-10  | Aceptable                | El filtro histórico es adecuado; precisar vigencia de evidencia y acreditación actual. CC08-07.                                                 |
| CV08-11  | Aceptable con corrección | Preserva grants, D18/D19 y prevención. Resolver colisiones y política de ámbito. CC08-07/08.                                                    |
| CV08-12  | Aceptable con corrección | Las cinco decisiones corresponden al propietario, pero parte de sus parámetros debe delegarse técnicamente. CC08-08.                            |

No rechazo ninguna de las doce enmiendas en su propósito esencial.

Las correcciones complementarias siguientes no representan nuevos registros AR ni nuevas funcionalidades. Desarrollan obligaciones existentes y cierran posibilidades materiales de aprobación indebida.

## **6. Correcciones complementarias vinculantes propuestas**

### **CC08-01 — Cierre normativo por subobligación, consumidor y celda**

**Afecta:** AR-06, CV08-01, D01–D21.

**Problema:** una matriz nominalmente completa puede permitir que una prueba representativa se interprete como cobertura de todas las condiciones de una ficha.

**Enmienda propuesta:**

> El manifiesto normativo deberá mantener una relación bidireccional entre las 103 entradas, sus subobligaciones, condiciones de activación, consumidores y celdas obligatorias.
>
> Cada afirmación independientemente falsable tendrá identidad probatoria propia. La evidencia compartida solo podrá acreditar varias afirmaciones cuando se demuestre expresamente su suficiencia para cada una.
>
> La composición por MCP, CLI, CI, visor, conectores y otros puntos de entrada exigibles deberá incluir controles negativos contra bypass, autoridad legacy y discrepancia de contratos.
>
> La planificación identificará las familias probatorias obligatorias. Los casos completos, celdas, umbrales y métodos se materializarán y congelarán antes de ejecutar la correspondiente evaluación, no necesariamente antes de elaborar el WBS.
>
> Ninguna celda candidata, bloqueada, no ejecutada o con aplicabilidad incierta podrá considerarse acreditada.

#### **Desgloses obligatorios**

| Dimensión    | Separación requerida                                                                                |
| ------------ | --------------------------------------------------------------------------------------------------- |
| RUN-002.1    | Preferencias persistentes 1a y fidelidad obligatoria 1b.                                            |
| D10          | Formato, clase, estructura, localizadores, versiones, OCR, omisiones y autoridad.                   |
| D11          | PDF/Excel por clase, bytes emitidos, población, filas/celdas, cálculo y conciliación independiente. |
| UTCP/OpenAPI | Registro, compilación, autoridad, ejecución, efecto, reconciliación y cleanup de ambos mecanismos.  |
| M1–M5        | Cinco ampliaciones con criterios propios, incluida portabilidad real.                               |
| Autoridad    | Ocho autoridades operativas y cuatro grants multimedia independientes.                              |
| Memoria      | Dimensiones de alcance, planos epistémicos, versiones, drift, handoff y secreto separado.           |
| Hosts        | Cuatro obligatorios, otros clientes representativos, versiones reales y consumidores.               |
| Idioma       | Instrucciones, resultados, cambio de locale, formatos, códigos invariantes y replay.                |
| Evidencia    | Testigo, causalidad, integridad, autorización, disponibilidad y vigencia.                           |
| No bypass    | Entradas legacy, scripts, adaptadores, exportación y operaciones fuera del núcleo canónico.         |

**Condición de aceptación:** 100 % de subobligaciones obligatorias acreditadas al nivel exigible, sin compensación estadística.

### **CC08-02 — Denominadores, estratos y decisión matemática inequívoca**

**Afecta:** AR-06, CV08-02/03/04, D12 y D21.

#### **A. Discovery**

Para cada aplicación y contexto autorizado se congelarán tres universos independientes:

- Rutas canónicas.
- Estados semánticamente diferenciables.
- Transiciones dirigidas por acción, condición y contexto.

La identidad deberá distinguir roles efectivos, configuración, tenant, parámetros relevantes y estado funcional.

Una observación no se convierte en varias unidades correctas por tener múltiples localizadores, URLs equivalentes o repeticiones.

\\[ Recall=\frac{TP}{TP+FN} \\]

\\[ Precisión=\frac{TP}{TP+FP} \\]

Se aplicarán los pisos candidatos por aplicación y estrato vinculante, no únicamente por promedio.

Una unidad genuina fuera del inventario congelado se registrará separadamente. Si demuestra un defecto en la verdad de referencia, se aplicará el procedimiento de invalidación y reensayo, sin corregir retrospectivamente el porcentaje para rescatar el resultado.

Si existe universo esperado, pero QAP no emite observaciones:

- Recall: cero.
- Precisión: no calculable.
- Decisión: no acreditada.

#### **B. Efectos y casos compuestos**

Se establecen dos universos:

- \\(U_E\\): afirmaciones de efectos evaluables.
- \\(U_C\\): casos compuestos evaluables.

Una afirmación se acredita cuando el veredicto es correcto y existe el testigo requerido, con alcance, identidad, causalidad, vigencia y resultado suficientes.

\\[ Efectos=\frac{\text{Afirmaciones correctamente evaluadas}}{|U_E|} \\]

\\[ CasosCompuestos= \frac{\text{Casos con todas sus afirmaciones acreditadas}}{|U_C|} \\]

Un caso que acredita nueve de diez efectos no cuenta como caso compuesto logrado. Sus nueve afirmaciones pueden aparecer en la métrica de afirmaciones, sin ocultar el décimo efecto ausente.

Recomiendo aplicar el piso candidato del 85 % a ambos universos cuando se reivindique generalización de efectos y flujos compuestos.

Los E2E normativos conservan 100 %.

#### **C. Defectos desconocidos**

El denominador corresponde a defectos efectivos y únicos, congelados antes de la exposición.

Un aviso genérico, duplicado o causalmente incorrecto no constituye detección acreditada.

El hallazgo debe identificar suficientemente el defecto, alcance, paso o artefacto y evidencia de su condición.

La detección de un fallo no requiere que el AUT obtenga PASS. Un FAIL funcional correcto puede acreditar que QAP evaluó correctamente el defecto.

#### **D. Denominador común de incumplimiento**

Definir \\(U_Q\\) como el conjunto de IDs de afirmaciones evaluables y elegibles conforme a verdad, autoridad, dependencias y disponibilidad establecidas previamente.

Las unidades de control diseñadas para producir denegación legítima, insuficiencia deliberada de oráculo u otra condición no evaluable pertenecen a un universo de controles separado.

Sea \\(U_I\\) la unión de IDs de \\(U_Q\\) afectados por abstención injustificada, bloqueo injustificado, ERROR imputable al candidato, omisión, SKIPPED injustificado o ausencia de cierre en presupuesto.

\\[ Incumplimiento=\frac{|U_I|}{|U_Q|} \\]

Un mismo ID afectado por varias causas se cuenta una sola vez en la unión, preservando el detalle de cada causa.

Cuando un fallo de un caso padre impide evaluar varias afirmaciones hijas, se registrará el impacto sobre cada ID exigible. No se contabilizará exclusivamente el error del padre.

La indisponibilidad atribuible a QAP de un insumo disponible no permite excluir la afirmación.

#### **E. Ejemplo de falsación de la regla**

### **Por qué debe existir un límite conjunto**

Ejemplo hipotético: 100 afirmaciones evaluables y elegibles.

Abstenciones injustificadas

**4%**

Bloqueos injustificados

**4%**

Errores técnicos imputables

**2%**

Omisiones

**2%**

Incumplimiento conjunto, sin solapamiento

# **12%**

Límite candidato

# **5%**

Resultado: rechazo, aunque abstenciones y bloqueos individualmente estén por debajo del 5%.

#### **F. Fallos externos y suficiencia estadística**

Un fallo externo acreditado puede invalidar una evaluación afectada, pero no eliminar selectivamente unidades desfavorables.

Se conservarán el registro original, causa, adjudicación independiente, alcance invalidado y reposición preregistrada.

No se utilizarán estratos vacíos, muestras insuficientes ni redondeos favorables para aprobar.

Si se informa una tasa sobre un corpus finito, representa exclusivamente ese corpus. Una afirmación poblacional requerirá método estadístico, independencia, tratamiento de clústeres, multiplicidad y límites de incertidumbre definidos previamente.

No es necesario que el propietario elija personalmente el método estadístico. Corresponde al equipo técnico justificarlo antes de la exposición.

### **CC08-03 — Vetos persistentes, independencia y protección del corpus ciego**

**Afecta:** AR-06, AR-44, CV08-04/05/07.

#### **A. Falsos PASS**

Se deben distinguir dos clases:

| Clase                       | Ejemplo                                                                                                           |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Error de conclusión         | QAP declara persistencia correcta cuando la operación hizo rollback.                                              |
| Acreditación sin fundamento | QAP declara persistencia correcta basándose solo en HTTP 201, aunque el estado final resulte sano por casualidad. |

Ambas vetan la aceptación cuando se presentan como afirmaciones funcionales acreditadas.

No basta con que el resultado global de la campaña sea FAIL.

Una campaña puede detectar correctamente un defecto y acreditar indebidamente otro efecto. El segundo hecho sigue siendo falso PASS o acreditación indebida.

**Enmienda propuesta:**

> Toda afirmación acreditada indebidamente, independientemente del resultado agregado, fase de publicación o condición estadística posterior de la corrida, deberá conservarse y adjudicarse. La invalidación de una evaluación de generalización no elimina un incidente de autoridad, seguridad, integridad o falsa acreditación independientemente demostrado.

Si la verdad no puede corroborarse, corresponde registrar un indicio pendiente, no inventar una falsación confirmada ni aprobar mientras subsista el indicio material.

#### **B. Independencia del corpus**

Separación de funciones, información y autoridad de evaluación. La implementación no recibe la verdad privada para optimizar el candidato.

El corpus conservará las tres morfologías históricas:

- Web clásica con formularios y tablas.
- SPA autenticada y asíncrona.
- Aplicación multirol y multipaso.

Además, cubrirá los cuatro perfiles temáticos de AV-08, incluyendo documentos, reportes, contabilidad, APIs, UTCP/OpenAPI, internacionalización, referencia autorizada, accesibilidad y recuperación.

Cuatro aplicaciones independientes son preferibles a tres aplicaciones con concentración excesiva de características.

No se considerarán aplicaciones independientes simples modificaciones de interfaz sobre el mismo backend y las mismas reglas.

#### **C. Holdout y repetición**

La reserva deberá contar con independencia suficiente respecto al corpus principal y a los fixtures de desarrollo.

Reglas obligatorias:

1. Congelar candidato, configuración, modelo, instrucciones, herramientas y presupuesto antes de exponerlo.
2. Determinar la admisibilidad de cada corrida mediante reglas previas.
3. Conservar los primeros resultados y todas las repeticiones preregistradas.
4. Prohibir la selección retrospectiva de la mejor corrida.
5. Ante contaminación, retirar la parte afectada y mantenerla únicamente como regresión identificada.
6. Ante ajuste posterior a exposición, emplear una nueva identidad de candidato y reserva limpia.
7. Si la reserva se agota o revela, preparar un nuevo conjunto independiente antes de reivindicar generalización.

La nueva reserva no debe convertirse en un conjunto de optimización iterativa.

#### **D. Límites de conocimiento previo**

Es razonable exigir controles de procedencia, fixtures reservados, entornos limpios y ausencia de pistas deliberadas.

No es razonable afirmar que se ha demostrado la ausencia absoluta de conocimiento previo en el entrenamiento del modelo.

El informe deberá limitar su afirmación a la evidencia disponible sobre independencia, aislamiento y ausencia de contaminación conocida.

### **CC08-04 — Eficiencia como requisito verificable, no como informe descriptivo**

**Afecta:** AR-06, CV08-06, D05, D13, D16 y D21.

La propuesta integrada mejora sustancialmente la medición de adopción. No obstante, publicar consumo y demostrar ausencia de degradación no siempre acredita que el producto sea eficiente.

Un candidato puede consumir recursos muy elevados y conservar la calidad. Eso no demuestra cumplimiento de D16.

#### **A. Adopción efectiva**

Se medirán separadamente:

\\[ AdopciónInicial= \frac{\text{Tareas iniciadas por ruta canónica}} {\text{Tareas QA elegibles}} \\]

\\[ FinalizaciónCanónica= \frac{\text{Tareas completadas mediante QAP}} {\text{Tareas QA elegibles}} \\]

Ambas incluyen en el denominador tareas abandonadas o que no comenzaron.

Un agente que llama superficialmente a QAP y después ejecuta scripts improvisados no acredita finalización canónica.

Las suites unitarias, mantenimiento legítimo y otras tareas no QA no deben resultar bloqueadas indiscriminadamente.

#### **B. Eficiencia**

Exigir una comparación competente y pareada con equivalencia de:

- Intención y obligaciones.
- Calidad y cobertura.
- Autoridad.
- Modelo y tokenizer cuando corresponda.
- Entorno y recursos.
- Condiciones frías, calientes y de recuperación.

El equipo técnico deberá congelar límites absolutos de operación y criterios comparativos por perfil, incluyendo tiempo, memoria, CPU, disco, concurrencia y recursos en reposo.

Además de cumplir esos límites, deberá acreditar beneficios medibles de las estrategias de reutilización, compactación y continuidad en los escenarios donde se reivindique eficiencia.

No se fijará anticipadamente un porcentaje arbitrario de ahorro.

#### **C. Telemetría de tokens no disponible**

| Disponibilidad                           | Tratamiento                                                                               |
| ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| Contadores reales comparables            | Medición directa de tokens y coste cuando exista base verificable.                        |
| Payload visible y tokenizer identificado | Estimación delimitada, separada del consumo real.                                         |
| Sin contadores comparables               | Registrar ausencia y medir indicadores observables de contexto, llamadas, bytes y tiempo. |

Estos últimos indicadores pueden acreditar mecanismos de eficiencia contextual dentro de su alcance, pero no un porcentaje de ahorro real de tokens.

**Enmienda propuesta:**

> La falta de telemetría no invalidará automáticamente toda la autonomía ni toda la eficiencia de QAP. Deberá utilizarse una prueba alternativa preregistrada y suficientemente informativa de los mecanismos exigidos. Si la obligación de eficiencia pertinente continúa sin evidencia suficiente, permanecerá sin acreditar y se elevará al Orquestador antes de la compuerta correspondiente.
>
> No se afirmará ahorro de tokens ni se certificará una obligación específica de consumo real mediante indicadores sustitutivos insuficientes.

Se preservan EXP-01b, EXP-02 y EXP-03.

### **CC08-05 — Integridad del piloto empresarial G6.5**

**Afecta:** AR-30, CV08-08, D01, D06–D09, AR-41 y AR-43.

La ampliación de CV08-08 resulta necesaria. Un piloto de solo lectura, instalación o smoke no satisface D01.

#### **A. Unidad de equivalencia empresarial**

La posibilidad de utilizar varios destinos empresariales no permite fragmentar artificialmente el E2E requerido.

**Enmienda propuesta:**

> El piloto deberá contener al menos un flujo empresarial coherente de tres módulos y dos roles efectivos, ejecutado como una misma campaña, con continuidad, transferencia de datos, estados intermedios y efectos acreditados.
>
> Destinos adicionales podrán ampliar cobertura, pero no sustituir dicho flujo por demostraciones aisladas que carezcan de las dependencias y efectos empresariales exigidos.

#### **B. Autoridad de operaciones**

| Destino                          | Condición                                                                |
| -------------------------------- | ------------------------------------------------------------------------ |
| QA mutable                       | Escrituras específicas autorizadas y verificadas por operación.          |
| Referencia independiente         | Lectura acreditada en destino, con identidad y propósito separados.      |
| Producción                       | Exclusivamente lectura acreditada y autorizada.                          |
| Efectos irreversibles o externos | Simulación o sandbox autorizado con confinamiento y efectos observables. |
| Destino sin autorización         | Bloqueo de la operación.                                                 |

La simulación confinada puede demostrar la lógica del flujo. No acredita que se hayan ejecutado pagos, timbrados o notificaciones reales.

#### **C. Restauración, reconciliación y corte**

Se deben distinguir:

| Mecanismo      | Resultado acreditable                                                                  |
| -------------- | -------------------------------------------------------------------------------------- |
| Restauración   | Recuperación verificada de un estado anterior bajo condiciones autorizadas.            |
| Reconciliación | Determinación acreditada del estado real y de efectos ocurridos.                       |
| Compensación   | Nueva operación autorizada para contrarrestar efectos, sin afirmar reversión perfecta. |
| Confinamiento  | Residuo controlado dentro de ámbito aislado y sujeto a disposición acordada.           |
| Corte real     | Cambio operativo de proyecto con autorización independiente.                           |

No se exige restaurar destructivamente una instancia empresarial para demostrar G6.5.

La restauración y recuperación podrán ensayarse en copia gobernada o QA específicamente autorizado, registrando diferencias respecto al destino.

Ninguna estrategia de limpieza puede afectar registros ajenos ni convertir un residuo desconocido en cumplimiento.

#### **D. Resultado**

La salida de G6.5 requiere candidato identificable, G6 superada, permisos efectivos, ejercicio empresarial representativo, cero vetos, cumplimiento de todas las obligaciones aplicables y conformidad documentada de responsables.

La ausencia de destino autorizado mantiene AR-30 BLOQUEANTE.

### **CC08-06 — Fronteras y acreditación de accesibilidad**

**Afecta:** AR-35, CV08-09, REQ-QA-003 y EXP-06c.

Se acepta mantener dos matrices.

| Dimensión  | Accesibilidad propia de QAP                                         | Evaluación de accesibilidad del AUT                                                                      |
| ---------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Objeto     | Visor, reportes y recorridos propios.                               | Aplicación sometida a pruebas.                                                                           |
| Pruebas    | Teclado, foco, semántica, contraste, reflow y tecnologías de apoyo. | Reglas automatizadas, estados dinámicos, controles sanos/mutantes y comprobaciones manuales pertinentes. |
| Evidencia  | Interacción real y criterios versionados.                           | Hallazgo localizado, regla, versión, estado, alcance y cobertura.                                        |
| Aceptación | Recorridos propios exigibles accesibles.                            | Capacidad de evaluación correcta dentro del alcance declarado.                                           |

La automatización no acredita por sí sola conformidad WCAG integral. Una inspección manual pendiente tampoco puede contarse como comprobación realizada.

Se conserva la referencia a criterios medibles de [WCAG 2.2](https://www.w3.org/TR/WCAG22/?utm_source=chatgpt.com#conformance-reqs) sin convertir el producto en un certificador universal de conformidad.

#### **Corrección de egress y efectos**

La expresión «cero egress de las comprobaciones» debe interpretarse de acuerdo con los contratos previos.

**Enmienda propuesta:**

> El motor de accesibilidad y sus recursos no realizarán egress no autorizado, transferencias de contenido, telemetría externa ni efectos de negocio fuera de permiso.
>
> El tráfico legítimo del AUT, necesario para cargar recursos autorizados, hidratar estados o realizar interacciones permitidas, no constituye por sí mismo una infracción de esta obligación.
>
> Las pruebas de interacción necesarias se ejecutarán dentro de la autoridad concedida, sin modificar datos de negocio por iniciativa del evaluador.

Esta precisión evita que un requisito de privacidad reproduzca la incidencia histórica de bloqueo indiscriminado de CSS, JavaScript e imágenes.

### **CC08-07 — Vigencia, admisibilidad y retención de evidencia**

**Afecta:** AR-44, CV08-07/10/11, D18–D20.

Los contratos deben diferenciar cuatro hechos:

1. La evidencia existió.
2. La evidencia fue auténtica e íntegra.
3. La evidencia puede verificarse actualmente.
4. La evidencia sigue siendo pertinente para el candidato y alcance actuales.

Ninguno implica automáticamente los demás.

#### **A. Colisión entre certificación y TTL**

Una evidencia requerida para certificar puede superar el plazo ordinario de multimedia pesada.

Esto no permite prolongar unilateralmente un permiso ni impedir una eliminación exigida por política.

**Enmienda propuesta:**

> Antes de iniciar una evaluación de certificación deberá definirse el conjunto mínimo de evidencia necesaria, su período autorizado de conservación, responsables, ubicación, alternativas derivadas verificables y tratamiento de revocaciones.
>
> La retención protegida estará subordinada al grant de conservación y a las obligaciones superiores aplicables.
>
> Si la evidencia debe retirarse por expiración, revocación de retención o eliminación legítima, se preservará únicamente la información histórica permitida. Cuando desaparezca una prueba indispensable para verificar actualmente una afirmación, se retirará su acreditación actual o se obtendrá nueva evidencia autorizada.
>
> No se ampliará ningún permiso por necesidad de certificación.

#### **B. Precedencia de conservación**

| Evento                      | Acción exigible                                                                |
| --------------------------- | ------------------------------------------------------------------------------ |
| Ejecución activa            | Proteger artefactos necesarios dentro de conservación autorizada.              |
| Publicación pendiente       | No podar evidencia requerida por conveniencia de cuota.                        |
| Defecto abierto             | Protección conforme a política, permiso y plazo aplicable.                     |
| Expiración de TTL ordinario | Poda conforme a precedencia y protección aplicables.                           |
| Revocación de captura       | Detener nuevas capturas y operaciones afectadas.                               |
| Revocación de acceso        | Impedir nuevas lecturas, conservando solo lo autorizado.                       |
| Revocación de conservación  | Supresión lógica y registro saneado de indisponibilidad.                       |
| Cuota insuficiente          | Suspender admisión o escalar; no eliminar evidencia protegida arbitrariamente. |
| Exportación previa          | Reconocer límites de revocación sobre copias entregadas.                       |

D19 mantiene detalle estructurado durante 90 días, resumen histórico permanente hasta eliminación expresa y conocimiento/casos activos sin caducidad automática.

Los plazos de multimedia pesada no sustituyen estos compromisos.

### **CC08-08 — Autoridad empresarial y delegación técnica**

**Afecta:** CV08-11/12 y las cinco DE.

Se identifica una posible transferencia indebida de decisiones técnicas al propietario.

CV08-12 indica que el propietario fija precisión, estratos, tamaños, incertidumbre, adopción y presupuesto. Interpretado literalmente, podría obligarle a seleccionar métodos que requieren validación especializada.

**Enmienda propuesta:**

> El propietario ratificará las políticas empresariales, el nivel de calidad exigido, el riesgo residual aceptable, el compromiso de recursos, el alcance operativo y las condiciones de lanzamiento.
>
> El equipo técnico propondrá y justificará mediante protocolos y experimentación los tamaños muestrales, estratificación, métodos estadísticos, tecnologías, versiones, algoritmos, parámetros operativos y hardware.
>
> La delegación será expresa y estará limitada por los requisitos, pisos, vetos y riesgos ratificados.
>
> Cualquier resultado que exija modificar alcance obligatorio, reducir garantías, incrementar materialmente el riesgo o alterar un umbral empresarial deberá regresar al propietario antes de aplicarse.

En DE-02 deberá distinguirse especialmente la elegibilidad general de captura privada de la autorización específica por destino.

D18 no estableció previamente una prohibición universal de captura privada fuera de QA/staging.

Tampoco habilitó dicha captura automáticamente.

## **7. Tabla consolidada de criterios de aceptación**

Los valores numéricos siguientes constituyen la recomendación técnica para DE-03, no una ratificación efectuada en este informe.

| Criterio                              | Umbral recomendado | Regla de aplicación                             |
| ------------------------------------- | ------------------ | ----------------------------------------------- |
| Conformidad normativa                 | 100 %              | Subobligaciones y celdas obligatorias.          |
| Precisión Discovery                   | ≥95 %              | Por aplicación y estrato vinculante.            |
| Recall Discovery                      | ≥85 %              | Por aplicación y estrato vinculante.            |
| Afirmaciones de efectos               | ≥85 %              | Por aplicación y estrato aplicable.             |
| Casos compuestos de efectos           | ≥85 %              | Todos sus efectos exigidos por caso.            |
| Defectos desconocidos                 | ≥90 %              | Por aplicación y clase vinculante.              |
| Defectos críticos                     | 100 %              | Severidad congelada previamente.                |
| E2E normativos                        | 100 %              | Flujo completo, efectos, evidencia y cleanup.   |
| Falsos PASS                           | 0                  | Por afirmación, incluida acreditación indebida. |
| Falsos FAIL                           | ≤2 %               | Global y estratos obligatorios.                 |
| Falsos FAIL deterministas normativos  | 0                  | Controles sanos.                                |
| Abstención injustificada              | ≤5 %               | Universo evaluable.                             |
| Bloqueo injustificado                 | ≤5 %               | Universo elegible.                              |
| Incumplimiento conjunto               | ≤5 %               | Unión por ID del universo común.                |
| Denegaciones y abstenciones legítimas | 100 %              | Causa, estado y efectos correctos.              |
| Violaciones de autoridad              | 0                  | Independiente de cualquier promedio.            |
| Violaciones de custodia               | 0                  | Incluye primer cuadro y temporales.             |
| Operaciones MCP normativas            | 100 %              | Celdas instaladas obligatorias.                 |
| Paridad de consumidores               | 100 %              | Semántica, autoridad, códigos y evidencia.      |
| Adopción inicial                      | ≥90 %              | Por host.                                       |
| Finalización canónica                 | ≥90 %              | Por host.                                       |
| Autonomía normativa                   | 100 %              | Sin intervenciones ordinarias por caso.         |
| Eficiencia                            | Límites medidos    | Presupuesto previo y comparación competente.    |
| Piloto G6.5                           | 100 %              | Obligaciones aplicables del manifiesto.         |

### **7.1. Sensibilidad de los umbrales**

### **Interpretación de los pisos de Discovery**

Ejemplo matemático ilustrativo; no constituye dimensionamiento del corpus definitivo.Unidades esperadas en un estrato

Recall mínimo

**85%**

Precisión mínima

**95%**

TP mínimos

# **85**

FN máximos

# **15**

FP máximos con esos TP

# **4**

Identificación correctaOmisiones toleradas en el corpus

Los umbrales no dispensan obligaciones normativas ni vetos de lanzamiento. Un estrato insuficiente sigue sin acreditar aceptación.

### **7.2. Regla de decisión**

La aceptación no se obtiene sumando puntuaciones.

Se establece una conjunción de condiciones independientes:

\\[ Aceptación = C_N \land C_G \land C_A \land C_E \land C_P \land V_0 \land R \\]

Donde:

- \\(C_N\\): conformidad normativa instalada.
- \\(C_G\\): generalización independiente.
- \\(C_A\\): autonomía y adopción.
- \\(C_E\\): eficiencia acreditada.
- \\(C_P\\): piloto empresarial.
- \\(V_0\\): ausencia de vetos confirmados e indicios materiales sin resolver.
- \\(R\\): ratificaciones y condiciones de lanzamiento satisfechas.

El incumplimiento de cualquiera impide la aceptación global.

## **8. Vetos de lanzamiento y mecanismos contra aprobación indebida**

Se aceptan los vetos de la propuesta integrada.

| Condición                                      | Consecuencia                           |
| ---------------------------------------------- | -------------------------------------- |
| Falso PASS demostrado                          | Rechazo y remediación.                 |
| Acreditación funcional sin testigo requerido   | Rechazo.                               |
| Escritura o despacho no autorizado             | Rechazo e incidente.                   |
| Fuga de identidad, tenant o sesión             | Rechazo e incidente.                   |
| Captura de material prohibido                  | Rechazo, aunque se elimine después.    |
| Evidencia adulterada presentada como auténtica | Rechazo.                               |
| Manipulación de denominadores o verdad         | Invalidación y revisión de integridad. |
| Duplicación de efecto incierto                 | Rechazo.                               |
| Cleanup obligatorio pendiente o desconocido    | Salida no acreditada.                  |
| Cobertura normativa insuficiente               | Salida no acreditada.                  |
| Umbral vinculante incumplido                   | Rechazo de evaluación.                 |
| Ausencia de permiso empresarial                | G6.5 bloqueada.                        |
| Licencias o procedencia sin resolver           | Distribución afectada bloqueada.       |

### **8.1. Distinción de categorías**

No todas las condiciones constituyen incidentes de seguridad.

Deben conservarse separadamente:

- Violación efectivamente demostrada.
- Incumplimiento de calidad.
- Indicio material pendiente.
- Evidencia insuficiente.
- Permiso ausente.
- Capacidad todavía no implementada.

Todas pueden impedir una salida, pero requieren resoluciones distintas.

### **8.2. Casos que nunca deben producir aprobación**

| Escenario                                           | Resultado correcto                                    |
| --------------------------------------------------- | ----------------------------------------------------- |
| HTTP 201 y rollback                                 | FAIL funcional si el efecto ausente está acreditado.  |
| HTTP 201 sin testigo suficiente                     | No acreditar persistencia.                            |
| Campaña FAIL con un falso PASS interno              | Mantener el veto del falso PASS.                      |
| Corpus contaminado con incidente confirmado         | Invalidar generalización y conservar incidente.       |
| Solo visibilidad de formularios                     | Acreditación estructural, no E2E funcional.           |
| Grabación desactivada para evitar una fuga          | Protección segura; capacidad multimedia pendiente.    |
| Host llama QAP y luego usa script externo           | No acreditar finalización canónica.                   |
| Evidencia eliminada y veredicto histórico existente | Preservar historia; reevaluar verificabilidad actual. |

No se acepta una excepción empresarial que autorice falsa acreditación, manipulación de resultados o violaciones de autoridad.

## **9. Verificación de procedencia histórica**

### **9.1. Hydrogen R2.6**

Se examinó el artefacto primario histórico:

[lab-r2/evidence/r2-6/r2-6-summary.json — SHA c57cd886](https://github.com/Hyouka73/QAMCP/blob/c57cd886bbda09902afc7d118b54226c1b59e62b/lab-r2/evidence/r2-6/r2-6-summary.json?utm_source=chatgpt.com).

El archivo conserva resultados de un dominio sintético de cálculo y conciliación, con control sano y mutante.

Registra:

| Valor                     | Esperado/sano | Mutante    |
| ------------------------- | ------------- | ---------- |
| Importe bruto en centavos | 100567        | 100567     |
| Comisión en centavos      | 2509          | 2508       |
| Neto en centavos          | 98058         | 98059      |
| Fecha efectiva            | 24/11/2026    | 23/11/2026 |

También registra extracción primaria, vigencia y abstención ante conflicto o expiración.

Sin embargo, su evaluación ciega E2 figura expresamente como `NO_EJECUTADO`.

**Conclusión independiente:** R2.6 sí contiene evidencia histórica de un segundo dominio sintético. No constituye evidencia de generalización ciega, producto instalado actual ni validación empresarial.

La corrección de procedencia de Codex High está fundamentada.

### **9.2. Recovery y F0**

La fuente [Estado y procedencia de Recovery](https://github.com/Hyouka73/QAMCP/blob/a78322f832fd69ccf58b7cb24f1571c8e1481e75/docs/qap-recovery/00-estado-y-procedencia.md?utm_source=chatgpt.com) conserva antecedentes de falsos PASS, controles incompletos y pruebas pendientes.

Los relatos permiten recuperar requisitos de falsación.

No permiten reconstruir como originales vectores, manifiestos, hashes o resultados primarios que ya no se encuentren disponibles.

### **9.3. V-01–V-18**

La [matriz histórica de falsación](https://github.com/Hyouka73/QAMCP/blob/7331c2fa66ad2a65340b5224cd9f33124fdbdbea/docs/qap-architecture/gemini-neon-etapa-3.md?utm_source=chatgpt.com) contiene definiciones operativas de V-01 a V-16.

Estas abarcan custodia ciega, autonomía, desconexión, handoff, aislamiento, SPA, DAG, roles, persistencia, contabilidad, reconciliación, regresión, paridad, revocación e intervenciones rutinarias.

No se identificaron definiciones operativas suficientes de V-17 y V-18 en los documentos cotejados.

Deben mantenerse como referencias huérfanas, sin inventar sus contenidos ni asignar retrospectivamente dichos IDs a pruebas nuevas.

### **9.4. Admisibilidad consolidada**

| Tipo de evidencia               | Crédito admisible                                          |
| ------------------------------- | ---------------------------------------------------------- |
| Código histórico                | Existencia de implementación o control estático.           |
| Prueba escrita                  | Existencia del criterio de prueba.                         |
| Resultado de fixture histórico  | Resultado limitado a identidad y condiciones originales.   |
| Informe sin artefacto primario  | Antecedente reportado.                                     |
| Reconstrucción                  | Nuevo artefacto con identidad propia.                      |
| Evidencia primaria instalada    | Crédito potencial de aceptación, sujeto a suficiencia.     |
| Derivado verificable            | Crédito limitado a lo que realmente demuestra.             |
| Evidencia perdida o restringida | No acredita actualmente la afirmación si es indispensable. |

Los antecedentes AS-02, AS-04 y MVP conservan valor de diseño y regresión, sin crédito automático de lanzamiento.

No se propone reabrir su auditoría por esta razón.

## **10. Coherencia con AV-01 a AV-07**

| Auditoría precedente | Contrato preservado                                              | Conclusión                     |
| -------------------- | ---------------------------------------------------------------- | ------------------------------ |
| AV-01                | Integridad normativa, precedencia y autoridades independientes.  | Compatible con CC08-01.        |
| AV-02                | Custodia, secretos, prevención, revocación y riesgo residual.    | Compatible con CC08-07/08.     |
| AV-03                | Autonomía, memoria, ejecución soberana y MCP.                    | Compatible con CC08-04.        |
| AV-04                | Seis veredictos, cuatro ejes, oráculos N0–N3, efectos y cleanup. | Compatible con CC08-02/03/05.  |
| AV-05                | D10/D11, UTCP/OpenAPI, referencia y reportes.                    | Compatible, conservando AR-20. |
| AV-06                | Fidelidad, recursos, plataformas, medios y adopción.             | Compatible con CC08-04/06.     |
| AV-07                | Reconstrucción, persistencia, distribución, licencias y DAG.     | Compatible, conservando AR-41. |

Fuentes relevantes de contraste:

[Dictamen AV-01](https://github.com/Hyouka73/QAMCP/blob/7331c2fa66ad2a65340b5224cd9f33124fdbdbea/docs/qap-architecture/cierre-av-01/dictamen-av01.md?utm_source=chatgpt.com), [Fe de correcciones AR-27](https://github.com/Hyouka73/QAMCP/blob/7331c2fa66ad2a65340b5224cd9f33124fdbdbea/docs/qap-architecture/cierre-av-01/fe-correcciones-ar27.md?utm_source=chatgpt.com), [Enmiendas AV-04](https://github.com/Hyouka73/QAMCP/blob/7331c2fa66ad2a65340b5224cd9f33124fdbdbea/docs/qap-architecture/cierre-av-01/enmiendas-av04.md?utm_source=chatgpt.com), [Protocolos AV-05](https://github.com/Hyouka73/QAMCP/blob/7331c2fa66ad2a65340b5224cd9f33124fdbdbea/docs/qap-architecture/cierre-av-01/protocolos-av05.md?utm_source=chatgpt.com), [Protocolos AV-06](https://github.com/Hyouka73/QAMCP/blob/7331c2fa66ad2a65340b5224cd9f33124fdbdbea/docs/qap-architecture/cierre-av-01/protocolos-av06.md?utm_source=chatgpt.com).

No se identifica una contradicción arquitectónica irreconciliable que obligue a repetir AV-01–07.

Las precisiones identificadas pueden resolverse mediante integración normativa, sin una nueva reconstrucción integral de los contratos.

# **11. Decisiones empresariales DE-01–05**

Esta sección se dirige al propietario. Las alternativas se presentan en términos operativos y de riesgo, evitando trasladarle elecciones de implementación que corresponden a especialistas.

Ninguna recomendación constituye una ratificación.

## **DE-01 — Retención de evidencia y consumo de almacenamiento**

### **¿Qué debe decidir el propietario?**

Cuánto tiempo conservar videos, capturas y trazas pesadas, además de la política de almacenamiento histórico ya acordada.

Los 90 días de detalle, el resumen permanente y la conservación del conocimiento activo no están en discusión.

| Política                  | A. Retención inteligente                           | B. Retención pesada prolongada                  |
| ------------------------- | -------------------------------------------------- | ----------------------------------------------- |
| Multimedia de éxitos      | Hasta 24 horas como candidato.                     | Plazo mayor autorizado.                         |
| Trazas de éxitos          | 72 horas como candidato.                           | Plazo mayor autorizado.                         |
| Evidencias de fallos      | Al menos 14 días, sujeto a permisos y excepciones. | Mayor plazo autorizado.                         |
| Defectos abiertos         | Protección conforme a política.                    | Misma protección.                               |
| Espacio requerido         | Menor.                                             | Mayor.                                          |
| Privacidad                | Menor exposición acumulada.                        | Mayor volumen de información sensible retenida. |
| Revisión histórica visual | Menor disponibilidad de medios antiguos.           | Mayor disponibilidad.                           |

**Recomendación: opción A.**

El propósito de QAP es conservar conocimiento reutilizable y evidencia suficiente, no almacenar indefinidamente grabaciones de ejecuciones exitosas.

La conservación ampliada debe poder configurarse para necesidades empresariales justificadas y autorizadas.

### **Simulador ilustrativo de almacenamiento**

Calcula solamente multimedia pesada, sin compresión adicional, deduplicación ni otros datos de QAP.

Ejecuciones diarias con medios

**30**

Tamaño promedio por ejecución

**80 MB**

Plazo alternativo de retención

**14 días**

Retención de 24 horas

# **2.4 GB**

Retención de 14 días

# **33.6 GB**

24 horas

14 días

Los valores iniciales son hipotéticos. El consumo real se determinará mediante EXP-03 y EXP-06c.

**Riesgos:** eliminar medios necesarios para investigaciones, crecer excesivamente en almacenamiento o mantener información sensible durante períodos innecesarios.

**Decisión del propietario:** política de conservación, excepciones, tolerancia de almacenamiento y delegación técnica de defaults.

**Decisión técnica:** cuotas concretas, reservas de recuperación, umbrales de alerta, tamaños reales y estrategia de poda.

**Condiciones de activación:** EXP-03, EXP-06c, pruebas de colisión de permisos, recuperación y exportación.

## **DE-02 — Ámbito y riesgo de captura multimedia privada**

### **¿Qué debe decidir el propietario?**

En qué clases de entornos podrá habilitarse la captura privada controlada, una vez demostradas sus garantías técnicas y obtenidas las autorizaciones concretas.

| Opción | Política empresarial                                                                                 | Consecuencia                                                                             |
| ------ | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| A      | Captura privada inicialmente limitada a QA/staging expresamente autorizados.                         | Menor exposición inicial y mayor facilidad de gobierno.                                  |
| B      | Captura privada elegible también en otros ámbitos de lectura autorizada, bajo garantías adicionales. | Mayor cobertura operativa y mayor exigencia de privacidad.                               |
| C      | Diferir activación privada hasta disponer de evidencia o condiciones suficientes.                    | Reduce riesgo inmediato, pero no acredita todavía el alcance obligatorio de lanzamiento. |

**Recomendación: opción A como política inicial de activación**, manteniendo la arquitectura compatible con captura privada gobernada y sin eliminar capacidades previamente acordadas.

Debe quedar claro que esta restricción sería una decisión empresarial nueva sobre ámbitos operativos, no una prohibición que D18 ya hubiera establecido.

La elegibilidad para capturar no concede permisos de lectura ni escritura.

### **Cuatro autorizaciones independientes**

**Capturar**

Permitir generar medios privados.

**Acceder**

Permitir visualizar evidencia existente.

**Conservar**

Permitir mantener los artefactos.

**Exportar**

Permitir entregar una copia fuera de custodia local.

Conceder cualquiera de estos permisos no concede automáticamente los otros tres.

Se preservan `VERIFIED_STRICT`, `PRIVATE_AUTHORIZED` y `MANDATORY_SUPPRESSION`.

La autorización privada tendrá vigencia de hasta 30 días, renovable y revocable.

Login, MFA, SSO y superficies prohibidas permanecerán excluidos preventivamente conforme al contrato AR-27.

Un dato sensible de aparición genuinamente imprevisible requiere protocolo de incidente. Su contención posterior no demuestra prevención exitosa.

**Riesgos:** exposición de datos sensibles, temporales, swap, volcados, respaldos y copias exportadas.

**Decisión del propietario:** ámbitos elegibles, riesgo residual, suspensión ante incidentes y política de exportación excepcional.

**Decisión técnica:** calificar arquitectura C y respaldo A, mecanismos de cifrado, aislamiento, capturadores y cobertura por celda.

**Condiciones de activación:** EXP-06a, EXP-06c, E6, garantías obligatorias acreditadas y permisos específicos vigentes.

No debe pedirse al propietario elegir una implementación criptográfica por preferencia.

## **DE-03 — Calidad exigida y corpus independiente**

### **¿Qué debe decidir el propietario?**

El nivel de exigencia con el que se considerará QAP suficientemente competente para trabajar sobre aplicaciones desconocidas, una vez satisfechas todas las obligaciones normativas.

| Indicador             | A. Propuesta histórica                       | B. Propuesta integrada AV-08     |
| --------------------- | -------------------------------------------- | -------------------------------- |
| Discovery             | 80 % candidato                               | Recall ≥85 %                     |
| Precisión Discovery   | Sin piso equivalente definido                | ≥95 %                            |
| Efectos               | 75 % candidato                               | ≥85 %                            |
| Detección de defectos | Requiere definición adicional                | ≥90 %                            |
| Defectos críticos     | Sin relajación                               | 100 %                            |
| Falsos PASS           | 0                                            | 0                                |
| Conformidad normativa | 100 %                                        | 100 %                            |
| Adopción              | Requiere definición                          | ≥90 % inicial y final            |
| Corpus                | Tres apps desconocidas como mínimo histórico | Cuatro independientes preferidas |

Los porcentajes históricos y nuevos no son directamente equivalentes porque utilizan definiciones diferentes. Cualquier comparación experimental deberá realizarse sobre unidades y condiciones idénticas.

**Recomendación: opción B.**

No recomiendo los pisos históricos como política comercial definitiva porque eran candidatos incompletamente definidos y no controlaban suficientemente la precisión, omisiones ni finalización autónoma.

La propuesta integrada resulta más defendible para un producto empresarial.

### **Decisión sobre el corpus**

Cuatro aplicaciones realmente independientes son preferibles. Tres aplicaciones pueden admitirse si conservan las morfologías y toda la diversidad exigida, con suficiencia e independencia demostradas.

El número de aplicaciones no constituye por sí solo suficiencia estadística.

**Riesgos:** elevar coste de certificación, descubrir que determinados objetivos no son alcanzables con el candidato inicial o producir resultados excesivamente optimistas con corpus insuficiente.

**Decisión del propietario:** pisos empresariales, tolerancia de recursos, exigencia de custodia independiente y política de aceptación.

**Decisión técnica:** tamaños, estratos, casos, método de incertidumbre, cuotas, versiones, semillas y repetición.

**Condiciones de activación:** calibración con fixtures de desarrollo, DE-03 ratificada, custodio designado antes de cerrar G5 y protocolo congelado antes de G6.

Si el candidato incumple los pisos ratificados, corresponde corregirlo y revalidarlo; no ajustar retrospectivamente los criterios.

## **DE-04 — Validación empresarial antes del lanzamiento**

### **¿Qué debe decidir el propietario?**

Que QAP no será declarado listo para uso empresarial general hasta superar un piloto real autorizado, y qué sistema podrá actuar como destino cuando llegue esa etapa.

| Opción                                     | Consecuencia                                                                                 |
| ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| A. Lendus Core QA                          | Valida un dominio empresarial complejo y pertinente, sujeto a autorización y disponibilidad. |
| B. Otra aplicación empresarial equivalente | Reduce dependencia de un único sistema, con idénticos criterios de equivalencia.             |
| C. Posponer piloto                         | Permite continuar trabajo técnico, pero impide GA.                                           |

**Recomendación: opción A, con B como alternativa formal.**

Lendus Core QA es un candidato coherente con los objetivos del producto. Sin embargo, vincular toda la arquitectura a un único destino sería innecesario.

La alternativa deberá satisfacer el mismo contrato de representatividad.

### **Secuencia empresarial obligatoria**

**G6**

Certificación ciega

**G6.5**

Piloto autorizado

**GA**

Liberación expresa

El corte o migración de un proyecto conserva su autorización independiente. No se ejecuta automáticamente al superar G6.5 o GA.

**Riesgos:** falta de entorno representativo, indisponibilidad de permisos, tratamiento de datos sensibles, efectos empresariales no controlados y expectativas de lanzamiento prematuras.

**Decisión del propietario ahora:** obligatoriedad de G6.5, destino preferido y admisibilidad de alternativas equivalentes.

**Decisión futura del propietario y responsables empresariales:** autorización concreta de acceso, operaciones, datos, permisos y vigencia.

**Decisión técnica:** diseño del manifiesto, selección de controles, criterios de equivalencia, testigos, reconciliación y ensayo de restauración.

No se solicitan credenciales ni acceso actual.

## **DE-05 — Activación ordinaria de accesibilidad**

### **¿Qué debe decidir el propietario?**

Si QAP deberá ejecutar controles de accesibilidad en todas las campañas ordinarias pertinentes o solamente cuando se soliciten o se active una política específica.

| Política                                  | A. Opt-in ordinario             | B. Obligatoria en campañas críticas                |
| ----------------------------------------- | ------------------------------- | -------------------------------------------------- |
| Capacidad instalada                       | Obligatoria.                    | Obligatoria.                                       |
| Accesibilidad propia de QAP               | Obligatoria.                    | Obligatoria.                                       |
| Certificación de estados críticos         | Obligatoria.                    | Obligatoria.                                       |
| Ejecución habitual sobre AUT              | Cuando se solicita o configura. | Automática en campañas clasificadas como críticas. |
| Consumo ordinario                         | Menor.                          | Mayor.                                             |
| Riesgo de omisión de controles habituales | Mayor si nunca se activan.      | Menor en campañas críticas.                        |

**Recomendación: opción B, conservando opt-in para campañas restantes.**

Permite que los proyectos de mayor importancia incluyan sistemáticamente controles pertinentes sin obligar a ejecutar una auditoría completa de accesibilidad en cada prueba funcional.

La clasificación de criticidad deberá formar parte de la política empresarial; el agente no podrá inventarla retrospectivamente.

**Riesgos:** incremento de tiempo de campaña, falsas afirmaciones de conformidad WCAG, controles insuficientes en estados dinámicos y omisión de inspecciones manuales necesarias.

**Decisión del propietario:** política ordinaria de activación y alcance empresarial de campañas críticas.

**Decisión técnica:** motor, reglas, versiones, navegadores, estados, métodos manuales y criterios de cobertura.

**Condiciones de activación:** EXP-06c, E6, G3/G5 y comprobación independiente G6.

## **12. Resumen de recomendaciones al propietario**

| Decisión | Recomendación             | Qué se ratifica                                                                              |
| -------- | ------------------------- | -------------------------------------------------------------------------------------------- |
| DE-01    | **A**                     | Retención inteligente, configurable y conservación protegida.                                |
| DE-02    | **A**                     | Activación privada inicialmente en QA/staging autorizados, con garantías y riesgo explícito. |
| DE-03    | **B**                     | Pisos integrados AV-08, cuatro apps independientes preferidas y cero vetos.                  |
| DE-04    | **A con B como respaldo** | G6.5 obligatorio, Lendus Core QA preferido o destino equivalente.                            |
| DE-05    | **B**                     | Accesibilidad obligatoria en campañas críticas y opt-in en las restantes.                    |

Estas recomendaciones se presentan exclusivamente para decisión expresa del propietario.

En DE-05 adopto una recomendación más exigente para campañas críticas que el opt-in ordinario preferido en la propuesta inicial. No se introduce como requisito ratificado.

En DE-02 recomiendo una política inicial de activación conservadora, sin atribuirla retroactivamente a D18.

## **13. Separación de decisiones empresariales y técnicas**

| Materia                                | Responsable                                  |
| -------------------------------------- | -------------------------------------------- |
| Alcance funcional obligatorio          | Propietario.                                 |
| Política de calidad y riesgo residual  | Propietario.                                 |
| Conservación y exposición de datos     | Propietario.                                 |
| Autorización de destinos empresariales | Propietario y responsables autorizados.      |
| Política de lanzamiento                | Propietario.                                 |
| Driver SQLite                          | Equipo técnico tras calificación.            |
| SDK MCP                                | Equipo técnico tras EXP-01a.                 |
| Navegadores y capturadores             | Equipo técnico tras experimentos.            |
| Arquitectura C o respaldo A            | Equipo técnico tras calificación vinculante. |
| Parsers, OCR y motores Excel           | Equipo técnico por clase y licencia.         |
| Tamaño y estratificación del corpus    | Equipo técnico y custodio independiente.     |
| Hardware mínimo y recomendado          | Equipo técnico mediante medición.            |
| Defaults y cuotas dentro de política   | Equipo técnico.                              |
| Evaluación independiente               | Custodio y adjudicador.                      |
| Integración documental                 | Orquestador.                                 |
| Aceptación de producto y GA            | Propietario mediante acto explícito.         |

El propietario no debe verse obligado a elegir tecnologías cuya suficiencia todavía se desconoce.

Tampoco puede el equipo técnico modificar requisitos empresariales alegando que una tecnología concreta resultó insuficiente.

### **13.1. Licencia propia de QAP**

La elección entre MIT, ISC u otra licencia de distribución corresponde a los titulares autorizados.

No se considera una sexta DE ratificada por inferencia.

Su resolución puede mantenerse como condición previa a distribución, sin impedir necesariamente la planificación condicionada de la arquitectura.

La elección de dependencias deberá seguir respetando procedencia, derechos de redistribución y compatibilidad de licencias.

## **14. Compuertas y precedencia de ejecución**

Se conserva el DAG de AV-07. Las compuertas representan condiciones de salida, no una autorización para comenzar trabajo en este informe.

G2 y G3 pueden solapar trabajo cuando sus entradas estén disponibles. G3 conserva las dependencias de señales y contratos de G2. No se elimina ninguna precedencia vinculante.

### **14.1. Condiciones por fase**

| Compuerta | Salidas imprescindibles                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------ |
| G0        | Baseline, contratos, remediaciones AR-24/40, factibilidad EXP-01a/05a/06a, selección preliminar EXP-07 y E1. |
| G1        | Vertical instalada, EXP-04a, repetición EXP-01a, escritor único, autoridad y separación de procesos.         |
| G2        | Discovery e ingesta acreditados por clase; EXP-02/06b.                                                       |
| G3        | Efectos, testigos, datos, medios, recursos y evidencia; EXP-05b/06b/06c/03.                                  |
| G4        | Planner integrado, autonomía, handoff y adopción; EXP-01b.                                                   |
| G5        | Distribución completa, matriz, EXP-04b y repeticiones instaladas; ensayo de corte y recuperación.            |
| G6        | E8 independiente y vigencia de las salidas E1–E7 exigibles.                                                  |
| G6.5      | Piloto empresarial autorizado, representativo y acreditado.                                                  |
| GA        | Aceptación expresa, alcance, riesgos, soporte y admisibilidad de distribución.                               |

Las pruebas destructivas, inyecciones de fallo y canarios deberán ejecutarse en sus entornos gobernados.

No deberán repetirse indiscriminadamente sobre sistemas empresariales reales para satisfacer una interpretación literal de E8 o G6.5.

### **14.2. Cambios de identidad**

El cambio de paquete, dependencia, modelo, política, host, sitio de evidencia o permiso requiere adjudicación de impacto.

Se repetirán las celdas y compuertas descendientes afectadas.

No se exige repetir automáticamente todo el proyecto por cualquier cambio menor, pero tampoco se permitirá conservar certificaciones cuya premisa haya quedado invalidada.

## **15. Bloqueantes clasificados por fase**

Esta clasificación es determinante para evitar que los experimentos pendientes se conviertan artificialmente en impedimentos de planificación.

### **15.1. Consolidación y planificación**

| Condición                                                   | ¿Impide cerrar la especificación?            |
| ----------------------------------------------------------- | -------------------------------------------- |
| Integrar CV08-01–12                                         | Sí.                                          |
| Resolver CC08-01–08                                         | Sí, documentalmente.                         |
| Ratificar políticas empresariales necesarias                | Sí.                                          |
| Resolver contradicciones de precedencia que afecten alcance | Sí.                                          |
| Completar todos los casos concretos de certificación        | No, se materializan antes de sus compuertas. |
| Elegir versiones definitivas de cada dependencia            | No.                                          |
| Ejecutar EXP-01–07                                          | No.                                          |
| Superar G6                                                  | No.                                          |
| Obtener acceso actual a Lendus Core                         | No.                                          |
| Ejecutar una migración real                                 | No.                                          |
| Demostrar previamente el hardware mínimo                    | No.                                          |

Debe existir posteriormente un acto explícito de autorización de planificación.

### **15.2. Selección tecnológica**

| Registro o dependencia | Bloqueo                                                         |
| ---------------------- | --------------------------------------------------------------- |
| AR-20                  | Selección e integración de clases D11 sin evidencia suficiente. |
| AR-27                  | Congelación definitiva de captura sin factibilidad y cobertura. |
| EXP-01a                | Selección de SDK y arranque MCP.                                |
| EXP-05a                | Selección de conectores y dependencias externas.                |
| EXP-07                 | Selección del mecanismo de custodia de claves.                  |
| EXP-02/06b             | Extractores, parsers y cobertura de formatos.                   |
| EXP-03                 | Paralelismo definitivo y hardware declarado.                    |

Son decisiones técnicas posteriores, condicionadas por experimentación.

### **15.3. Implementación e integración**

AR-24/40 y las condiciones de cierre G0 deben preservarse.

EXP-06a continúa bloqueando el cierre G0 y la apertura G1 conforme al contrato aceptado.

Las dificultades de plataforma, aislamiento, escritor único y dependencia de procesos deben resolverse antes de acreditar la vertical o las capacidades afectadas.

No se autoriza comenzar ninguna de estas actividades.

### **15.4. Migración**

AR-41 conserva su bloqueo.

El corte real requiere:

- Ensayo E2/G5.
- G6.5 satisfactoria.
- Autorización específica del proyecto.
- Exclusión efectiva del escritor y autoridad legacy.
- Conservación de revocaciones y efectos confirmados.
- Restauración o recuperación hacia delante acreditada.

El piloto puede utilizar copias gobernadas y no depende de ejecutar el corte real.

### **15.5. Certificación**

Bloquean certificación las obligaciones sin prueba suficiente, celdas obligatorias sin calificar, corpus insuficiente o contaminado, falsos PASS, incumplimiento de umbrales, falta de independencia y evidencia no admisible.

Estas condiciones deben aparecer como salidas verificables del futuro plan.

### **15.6. Activación y lanzamiento**

| Condición                                | Actividad bloqueada                |
| ---------------------------------------- | ---------------------------------- |
| DE-02 pendiente o custodia no acreditada | Activación privada.                |
| Destino empresarial sin autorización     | Operaciones G6.5 correspondientes. |
| AR-30 sin evidencia de piloto            | GA.                                |
| AR-41 pendiente                          | Corte real del proyecto.           |
| Licencias y procedencia no resueltas     | Distribución afectada.             |
| Candidato sin aceptación explícita       | Lanzamiento.                       |

**La existencia de estos bloqueantes no implica que la arquitectura carezca de una estrategia planificable para resolverlos.**

## **16. Actualización documental propuesta**

### **16.1. Documentos AV-08**

Recomiendo que el Orquestador preserve los documentos originales y publique esta contravalidación como documento independiente.

Nombre sugerido:

`docs/qap-architecture/cierre-av-01/segunda-contravalidacion-av08.md`

La posterior decisión del Orquestador deberá:

1. Registrar el dictamen de cada CV08-01–12.
2. Incorporar las correcciones complementarias aceptadas.
3. Documentar las discrepancias que decida rechazar y su fundamento.
4. Establecer la precedencia normativa de la integración.
5. Presentar las cinco DE al propietario.
6. Conservar la separación entre diseño aceptado, política ratificada y resultado experimental.

No se recomienda sobrescribir retrospectivamente informes de Codex, Neon, Antigravity ni las contravalidaciones anteriores.

### **16.2. Registro maestro**

Se proponen las siguientes anotaciones, sin modificar estados principales:

| Registro | Anotación propuesta                                                                                                    |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| AR-06    | Diseño de aceptación contravalidado favorablemente con CV08-01–07 y CC08-01–04/08, pendiente de DE-03 y certificación. |
| AR-30    | Contrato G6.5 contravalidado con CC08-05/08. Permisos, destino, evidencia y aceptación empresarial pendientes.         |
| AR-35    | Dos matrices aceptables en diseño con CC08-06, DE-05 y validaciones pendientes.                                        |
| AR-44    | Procedencia histórica y régimen de admisibilidad aceptables con CC08-03/07. Evidencia actual pendiente.                |

Las correcciones se incorporan dentro de los cuatro registros existentes.

No se justifica crear nuevos AR para obligaciones ya cubiertas.

### **16.3. Conservación de los 57 registros**

### **Estado del registro maestro**

# **57 registros**

Validados

6

10.5%

Validación experimental pendiente

17

29.8%

Pendientes

26

45.6%

Bloqueantes

8

14.0%

Distribución conservada. La aceptación documental de diseño no equivale a cambio automático de estado principal.

## **17. ¿Es necesaria una tercera contravalidación general?**

**No la recomiendo.**

Las doce enmiendas de Codex High son técnicamente justificables. Las ocho precisiones complementarias de este informe pueden incorporarse mediante resolución documental trazable.

No identifico una cuestión nueva que requiera abrir otra auditoría arquitectónica integral sobre AV-08 o repetir AV-01–07.

Una revisión adicional limitada estaría justificada únicamente si el Orquestador:

- Rechaza una corrección material introduciendo una vía de aprobación indebida.
- Modifica una obligación normativa previamente aceptada.
- Reduce vetos o requisitos obligatorios.
- Introduce una arquitectura incompatible con contratos precedentes.
- Detecta evidencia nueva que contradiga una premisa material.

Las diferencias de redacción, nombres, formatos o preferencias técnicas sin consecuencias verificables no justifican prolongar las auditorías.

Tampoco corresponde exigir que se resuelva mediante análisis documental una cuestión que solo puede determinarse experimentalmente.

# **18. Dictamen final de preparación para consolidación**

| Dimensión                            | Dictamen                                     |
| ------------------------------------ | -------------------------------------------- |
| Integridad nominal de requisitos     | **Favorable**                                |
| Conservación de ampliaciones         | **Favorable**                                |
| Coherencia con D01–D21               | **Favorable con correcciones**               |
| Coherencia con AV-01–07              | **Favorable con correcciones**               |
| Diseño de aceptación normativa       | **Favorable con correcciones**               |
| Diseño del corpus independiente      | **Favorable con correcciones**               |
| Autonomía y adopción                 | **Favorable en diseño**                      |
| Eficiencia                           | **Condicionada a medición**                  |
| Piloto empresarial                   | **Contrato favorable, activación bloqueada** |
| Accesibilidad                        | **Favorable en diseño**                      |
| Procedencia y custodia               | **Favorable con correcciones**               |
| Decisiones empresariales             | **Pendientes de ratificación**               |
| Certificación funcional del producto | **No acreditada**                            |

## **18.1. Respuesta expresa al encargo**

**¿Existen impedimentos arquitectónicos para consolidar la especificación y elaborar posteriormente el plan maestro y WBS por sprints, después de aplicar las enmiendas y ratificar las decisiones empresariales?**

**No identifico impedimentos arquitectónicos residuales dentro del alcance de AV-08, bajo esas condiciones.**

Los riesgos restantes tienen mecanismos de resolución definidos mediante contratos, alternativas, experimentos, criterios de salida y bloqueos por fase.

No es necesario conocer anticipadamente qué versión concreta de cada dependencia, capturador, parser o mecanismo de persistencia superará su calificación para elaborar una planificación condicionada que contemple dichas alternativas.

Sí es necesario preservar la obligación de que esos resultados sean satisfactorios antes de seleccionar, integrar, certificar o activar las capacidades correspondientes.

## **18.2. Recomendación de cierre al Orquestador**

### **Secuencia recomendada de cierre documental**

1. Resolver y publicar la integración de CV08-01–12 y CC08-01–08.
2. Obtener la ratificación expresa del propietario sobre DE-01–05 en sus aspectos empresariales.
3. Consolidar la especificación normativa completa, preservando las 103 entradas y los 57 registros.
4. Comprobar documentalmente precedencia, dependencias, reservas y bloqueantes por fase.
5. Solicitar autorización expresa para elaborar posteriormente el plan maestro y WBS por sprints.
6. Iniciar G0 únicamente mediante el acto de autorización correspondiente y con sus condiciones de entrada satisfechas.

No recomiendo iniciar otra ronda general de investigación simplemente para aumentar el número de opiniones coincidentes.

La siguiente actividad sustantiva debe ser resolver las correcciones documentales, obtener las decisiones empresariales y consolidar la especificación.

## **19. Declaración de cumplimiento del encargo**

La revisión se ha realizado mediante el conector de GitHub, con la rama `develop` verificada y la referencia fijada al SHA solicitado.

Se mantienen los siguientes límites:

- No se modificó GitHub.
- No se modificó código, dependencias, CI ni configuración.
- No se instalaron paquetes.
- No se ejecutaron experimentos.
- No se crearon ramas ni worktrees.
- No se inició G0 ni G1.
- No se elaboró WBS.
- No se accedió a sistemas empresariales.
- No se ratificaron decisiones ni licencias en nombre del propietario.

La cobertura probatoria completa, la disponibilidad efectiva de todas las celdas y la admisibilidad de la evidencia futura permanecen pendientes de sus respectivas evaluaciones. No se presenta el cotejo documental como certificación experimental.

**Dictamen definitivo de esta contravalidación: APROBABLE CON CORRECCIONES, SIN NECESIDAD JUSTIFICADA DE UNA NUEVA AUDITORÍA GENERAL.**

La integración, publicación y decisión de cierre corresponden exclusivamente al Orquestador Principal, con ratificación del propietario donde proceda.

**Fin del informe.**
