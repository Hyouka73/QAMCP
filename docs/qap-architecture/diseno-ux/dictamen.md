# Dictamen consolidado para el Orquestador Principal

## Decisión de diseño

Adoptar como propuesta documental una **mesa de investigación basada en expedientes y conocimiento conectado**. La unidad de progreso es la conclusión de QA y su procedencia. Ejemplo: «Se acreditó que el aviso faltó en la ventana, pero el cambio de configuración y el build aún no se han aislado». Desde esa conclusión se puede reconstruir la ruta al caso, al dato efectivo y al testigo con el mismo alcance.

La consola por módulos se conserva para gestión puntual y operaciones tabulares. El expediente cronológico se incorpora como vista forense y continuidad. Un lienzo libre generalista exigiría edición espacial, más mantenimiento y un lenguaje de autoría paralelo. El diseño prioriza un vecindario 2D estable y un grafo de impacto dirigido. Un diagrama por puertos muestra las ramas del trabajo, y las matrices y comparadores muestran relaciones que requieren lectura exacta. La facilidad de uso de esta combinación sigue siendo una hipótesis que puede contrastarse por tarea.

Obsidian inspira el vecindario y el cambio de profundidad. n8n aporta el sentido de flujo y los puertos. Grafana aporta el principio de elegir la visualización por consulta para el resumen de cobertura y los tiempos. La identidad de QAP surge del expediente, la semántica probatoria del inspector y la distinción entre exploración, diseño, operación e historia. [Obsidian, Graph view](https://obsidian.md/help/plugins/graph) · [n8n, conexiones](https://github.com/n8n-io/n8n-docs/blob/main/docs/build/understand-workflows/workflow-components/connect-nodes-together.md) · [Grafana, paneles](https://grafana.com/docs/grafana/latest/visualizations/panels-visualizations/) · [UTCP, contrato](https://www.utcp.io/docs/)

## Cotejo y antecedentes

Se revisaron los informes UX-01 a UX-04, los documentos de sistema visual y wireframes de UX-02, el HTML conceptual de Antigravity, el descubrimiento de necesidades profesionales y la exploración visual posterior a UX-04. Esta tabla conserva sus decisiones y discrepancias útiles. La evidencia empresarial del insumo de descubrimiento queda fuera del expediente público.

| Insumo | Aporte que se conserva | Cambio o reserva tras consolidar |
|---|---|---|
| UX-01 §§4–9 | Revelación por tarea, guía voluntaria, criterios centrados en el usuario | Evaluar la primera conclusión justificada. Un bloqueo correctamente comprendido es un resultado válido de aprendizaje. Metas TTFV, SUS y SEQ siguen en evaluación. |
| UX-02, sistema visual y wireframes | Inspector, alcance, alternativas textuales, inventario de pantallas y estados | El inventario cubre áreas de producto, mientras que el expediente guía la navegación. Densidad por contexto dentro del mismo espacio. PM-01 y WBS-01 son candidatos en el SHA de base. |
| HTML conceptual de Antigravity | Conflicto, recuperación y reconciliación como estados visibles | Plantillas con cambios de página pierden algunas selecciones y dificultan seguir causalidad. El nuevo prototipo hace inspeccionable la relación y recupera el contexto anterior. |
| UX-03 §§2–10 | Flujos declarativos, paridad, comparación CAS, snapshots y cursores, tablero reproducible | Aplicar el modelo al expediente. Separar vertical G1-04 de instalación G1-06 y adjudicación G1-07. Respetar variantes por capacidad, incluido macOS 14 Intel en la matriz CV06 aplicable. |
| UX-04 §§2–9 y sus maquetas | Cuatro modelos, nueve recorridos, grafo focal y reglas de representación | La maqueta inicial simulaba cambios entre escenas. Se reemplazó por vistas con estado, búsqueda, inspección y recorrido de trabajo. Conservar sus recomendaciones de escala y precedencia. |
| Descubrimiento profesional de Antigravity | Cobertura parcial, permisos, configuración efectiva, oráculos de cálculo, efectos tardíos y trazabilidad | Los antecedentes reportados no estiman la eficacia de QAP futuro. Caja negra como base y fuentes adicionales solo autorizadas. |
| Exploración visual posterior, Faro Azul | Contexto, mapa navegable, flujo por ramas, cronología y lectura histórica | La mesa visual carecía de proyecto vacío, búsqueda, filtros de relaciones, autoría, recuperación y tema claro. La revisión documenta y corrige el recorrido que esas omisiones interrumpían. |

Disposición de candidatos UX-01. CAND-UX-01, el mini-AUT que se distribuiría y mantendría con QAP, queda diferido. CAND-UX-02, selección visual sobre el navegador del AUT, queda como interacción candidata condicionada a aislamiento y autoridad. El recorrido v1 puede usar referencias tipadas ya disponibles. CAND-UX-03, alta y diagnóstico MCP, se conserva como superficie opcional bajo REQ-AGT-001 con vista previa de cambios, estado por variante y comprobación autorizada. CAND-UX-04 se integra como guía contextual de tres pasos sobre el expediente ficticio.

## Alcance y decisión reservada

La delegación cubre orden de navegación, gesto de retorno, tipografía, uso de representaciones, escala de muestra, textos, casos ficticios, criterios de revisión y la propuesta de desglose. Dedicar software de producción a un lienzo de programación, análisis estático general del AUT, resolución universal de configuración, observabilidad persistente, ejecución autónoma de agentes o un mini-AUT distribuido añadiría alcance o coste. El diseño aplica la capacidad ratificada que corresponda con contexto acreditado, sin introducir esas ampliaciones.

Operación local y determinista por GUI sin IA ni terminal obligatoria. Las pruebas programáticas pueden prepararse externamente. La autoridad única gobierna GUI, MCP, CLI y CI/CD. La distribución es exclusivamente NPM. Se mantienen D01–D21, DE, AC-DE, C1–C6, AR-24, AR-52, custodia, privacidad, independencia, retención, paridad, pisos y vetos. La [matriz de trazabilidad](trazabilidad.md) enlaza las fuentes y los criterios. La [integración](integracion-pm-wbs.md) eleva únicamente decisiones materiales.
