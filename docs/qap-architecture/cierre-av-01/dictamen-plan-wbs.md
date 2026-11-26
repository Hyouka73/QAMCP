# Dictamen de consistencia · PM-01, WBS-01 y TR-WBS-01

**Apto para revisión y ratificación documental, con reservas de calificación preservadas.** La versión 1.0 descompone los 44 paquetes en 71 subtareas. Define orden, salidas falsables, responsables lógicos y evidencias previstas hasta GA y el corte por proyecto. El plan queda listo para decisión documental. Los actos y pruebas de ejecución quedan pendientes.

## Insumos y alcance de revisión

- **Norma y decisiones.** [Manifiesto AV](manifiesto-normativo-consolidado.md), [manifiesto AC](manifiesto-ac01.md), [D01–D21](../acta-decisiones.md), [DE](acta-ratificacion-de.md), [AC-DE](acta-ratificacion-ac01.md), [cierre ET](acta-cierre-tecnologico.md) y [precedencia vigente](precedencia-av07.md). La revisión conserva las fuentes intactas. Las obligaciones y decisiones se proyectan a la WBS.
- **Arquitectura y alcance.** [Dictamen final 1](dictamen-final-revisor-1.md), [ChatGPT High](dictamen-final-chatgpt-high.md), [resolución CP-01–14](resolucion-final-planificacion.md), [contravalidación AV-08](segunda-contravalidacion-av08.md) y [resolución focalizada AC-01](resolucion-final-ac01.md). Preservan orden, autoridad, resultados por obligación/testigo, límites y custodia. La resolución AC-01 rige sus cuatro correcciones y conserva el dictamen original.
- **Tecnología.** Los siete informes se incorporan por el [expediente integrado](integracion-tecnologica-et.md), la [contravalidación](contravalidacion-independiente-et.md), [C1–C6](incorporacion-correcciones-et.md) y [reservas](reservas-calificacion-et.md). Se conservan candidatos y alternativas por ID, nunca como cumplimiento instalado.
- **UX.** [Expediente y revisiones de diseño](../diseno-ux/README.md) del commit `8f41c3c232c3b0838fd573694150ffe42649e6d1`. La revisión posterior del Orquestador, incorporada al encargo, añade escala, catálogo completo autorizado, operación sin expediente, refinamiento visual, controles positivos/negativos y validación UX instalada. Cada observación tiene subtareas, escenario, criterio y evidencia previstos.
- **Plan candidato.** Revisión propia de los tres documentos en `d053abc8839e6447ff68a104d025bfa31e7d73a4` y contraste con el [encargo RP-01](encargo-revision-plan-wbs.md). En el historial documental de develop y los hilos de revisión consultados consta el encargo RP-01, sin un dictamen independiente específico sobre PM/WBS localizado. La revisión de consistencia de esta entrega es del autor. El Orquestador conserva la adjudicación del plan y la revisión focalizada independiente prevista.

## Hallazgos y correcciones

| Hallazgo | Riesgo de cierre | Corrección y dónde revisar |
| --- | --- | --- |
| Los paquetes XL reunían contratos, implementación, prueba y decisión | Aceptar por actividad o asignación ET | Unidades ejecutables, responsable, dependencia por artefacto, entrega, control sano/negativo, testigo y salida de fallo en [WBS](wbs-reconstruccion-et.md) |
| Una asignación por familia podía ocultar subobligaciones o celdas | Trazabilidad nominal o requisitos huérfanos | Mapa por ID y reverso, fuente y salidas preservadas, ficha con afirmación falsable/consumidor/variante y testigo en [trazabilidad](trazabilidad-wbs-et.md). Las celdas efectivas se congelan antes de la evaluación |
| La admisibilidad figuraba al final de la lista G0 | Adoptar antes de AR-51 | Dependencias explícitas G0-08.a y condición recurrente para cada alta. Verificación final instalada G5 y decisión MIT/ISC reservada |
| El ensayo E2E podía usar el planner como dependencia implícita | G3 espera G4 y G4 espera G3 | G3-01.a consume el contrato G0 y la salida G2, usa DAG fixture congelado y aporta acreditación a G4 |
| El paquete y el ciego podían utilizarse como prerrequisitos recíprocos | Construcción optimizada con el holdout o G6 bloquea congelación G5 | G5-04.a diseña corpus segregado, G5-04.b consume artefacto y ensayo de corte, G6 accede bajo custodia después de aceptación G5 |
| La política de salida podía confundirse con permiso de operar o migrar | Falso cierre de corte/piloto/GA o efectos en referencia | G65-01.a y G65-02.a exigen autorización y testigos específicos. GA y CUT tienen entradas distintas y actos separados |
| La mesa podía ser puerta obligatoria y el catálogo quedar reducido a diferencias | Operación profesional incompleta | G1-04.a, G4-01.a, G3-05.b operan desde proyecto sin expediente. G2-01.b y G3-01.d cotejan un catálogo autorizado completo y preservan cortes y procedencia |
| Maqueta convincente o scanner podía tomarse como validación UX, custodia o escala | Cierre sin usuarios, celdas o testigos suficientes | [Protocolo UX](aceptacion-ux-plan.md) instalado, corpus ficticio y medición pareada, evaluación de personas y dos matrices de accesibilidad. EXP-08a/b/c, E6/E7 y E8 conservan contratos independientes |
| Captura suprimida, fallo técnico oculto, PDF/XLSX o resultado externo podían aparentar cumplimiento | Falso PASS, pérdida de trazabilidad de D11 o ruptura de AR-52 | Manifiesto por clase, bytes verificables y testigo causal, tres planos D11, proyección propia separada, un único código/sobre CI y bloqueo explícito. Los [vetos y pisos DE-03](acta-ratificacion-de.md#de-03--b-calidad-integrada-av-08) gobiernan |
| Gastos y plazos carecen de línea base vigente | Comprometer equipos o hardware sin evidencia | El plan exige registrar capacidad, límites y estimaciones por celdas después de mediciones autorizadas. Mantener reservas de CPU/RSS/IO, disco y cleanup, presupuestos de contexto y alternativas sin saltar fases |

## Comprobaciones documentales

- Cotejo por conjunto exacto de 123 entradas (110 REQ, 2 POL y 11 ampliaciones en su clasificación normativa), 65 cláusulas, 57 AR con estados de fuente (6 validados, 17 experimentales, 26 pendientes y 8 bloqueantes), 22 TEC y 15 XET. Conservar las 91 procedencias AC-01 y los 24 grupos en su [mapa completo](trazabilidad-ac01.md).
- Comprobación de las 39 decisiones del plan en sus cuatro familias: 21 D, 5 DE, 7 AC-DE y 6 C. Conservación de los 44 ID de paquete de la candidata. Toda actuación con una fila, fuente o fase de adjudicación.
- Ordenación topológica de 71 nodos y 137 dependencias declaradas. Cero referencias de dependencia desconocidas y cero ciclos. Sección de familias contiene E1–E8, EXP-01–08 con subfases y repeticiones, G6.5 y actos posteriores en WBS. Revisados los prerrequisitos de AR-24/40, EXP-06a/08a, AR-20, AR-51, AR-41 y AR-30.
- Los mapas de fuente, cláusula, subtarea, evidencia esperada e índice inverso son de planificación. La ejecución materializará identidad, denominador, oráculo, resultado observado y evidencia por celda. Un caso documental, mock, referencia histórica, capacidad del candidato o mera contabilidad no acredita conformidad.

## Reservas y decisiones materiales

**Reservas de calificación.** Se mantienen todas las [reservas ET](reservas-calificacion-et.md), entre ellas ruta efectiva de SO/CPU, privacidad desde el primer cuadro o byte, custodia, AR-24/28/40, KEK y frontera, AR-20 por clase, cuatro HOST y sus builds, uso de recursos, muestra, eficacia UX, accesibilidad, localización, resultados instalados, corpus independiente y elegibilidad del destino. Aplicar los [pisos, vetos y reglas de denominador](segunda-contravalidacion-av08.md) ratificados. Resolver técnicamente dentro del alcance por evidencia futura. No se ha calificado software ni abierto compuertas.

**Propietario.** Quedan la ratificación documental y, por separado cuando proceda, la autorización para iniciar ejecución. MIT/ISC está pendiente y se resuelve antes de actos que exijan licencia propia. El propietario/organización autoriza destino, acceso, piloto, posible corte y GA en sus actos correspondientes. Elevar únicamente una ampliación propuesta, compra obligatoria, contradicción que cambie garantías o riesgo material que exceda su delegación, con evidencia y alternativas. La recepción de este expediente no exige seleccionar tecnología ni ampliar alcance.

[Plan maestro](plan-maestro-reconstruccion-et.md) · [WBS](wbs-reconstruccion-et.md) · [Trazabilidad](trazabilidad-wbs-et.md) · [Aceptación UX](aceptacion-ux-plan.md)
