# QAP · Entrada para la revisión final de Gemini Neon

**Línea base remota de producto:** `77a9c4f3769784df40a17d5d19bd7c83a45f0c89` en `origin/develop`. **SHA observado de main:** `fa6a527764f6e96514a1e589411e7f402e059b68`. El checkout local existente de `develop` empezó en `a927bfb7ae109c185c67035252502b98cc8cbe88` con ocho commits propios y cuatro remotos desde el ancestro común `30fb3a2492f9edb4f96b3b0328635ca66401c119`. La consolidación usa el árbol remoto como padre, con los historiales locales y tags conservados. Fecha de consolidación: 24 de noviembre de 2026.

## Ruta de revisión

| Orden | Documento | Autoridad y uso |
|---|---|---|
| 1 | [Acta D01–D21](acta-decisiones.md) | Decisiones y requisitos expresos del propietario. Fuente normativa de alcance y política de producto. |
| 2 | [Catálogo consolidado](catalogo-requisitos.md) | Referencia de 87 IDs, con alcance, procedencia y aceptación candidata. Incluye 11 ampliaciones, 3 nuevos candidatos y dos políticas adicionales de captura y retención. |
| 3 | [Matriz de trazabilidad](trazabilidad.md) | Cobertura, dependencias y correspondencia con DP, AS, H/H-REV, EXP, G0–G6 y E1–E8. |
| 4 | [Evidencia archivada](evidencia-archivada.md) | Cinco tags fijados por SHA, diagnóstico, resultados experimentales y faltantes primarios. |
| 5 | [Cuestiones abiertas y resoluciones](cuestiones-abiertas.md) | DP-01–DP-15, contradicciones resueltas y asuntos pendientes por tipo. |
| 6 | [Plan maestro](plan-maestro.md), [revisión independiente](revision-independiente.md) e [insumos](insumos/README.md) | Plan previo de contratos, compuertas, migración y verificación. La propuesta donde discrepe queda subordinada al acta. Las investigaciones conservan su fecha, alcance y valor histórico. |
| 7 | [Visión](../QAP-VISION-AUTONOMIA.md), [ciclo de conocimiento](../qap-knowledge-lifecycle.md), [requisitos vNext](../vnext/REQUISITOS_Y_DECISIONES.md) y [contrato operativo original](../vnext/REQUISITOS_QA_MVP_OPERATIVO.md) | Dirección del producto, contexto de evolución, requisitos operativos previos y garantías del contrato anterior. El objetivo de salida es el de D01/D21. |

## Lectura de estados

| Estado de evidencia | Ejemplos |
|---|---|
| Integrada en develop, con alcance delimitado | MCP Stdio, entrada CLI, persistencia local distribuida, inventario con checkpoints, smoke revisado de visibilidad, ejecución Playwright y producción de reportes. El catálogo identifica garantías parciales y comportamientos incompatibles con la meta. |
| Experimental archivada | MVP autónomo de otro historial, AS-02/04 y laboratorios Recovery/Hydrogen. Cada afirmación está acotada a su SHA, modo, fixture y dependencias. |
| Propuesta | Puertos/repositorio común, adaptadores, ejecutor soberano, tecnologías, variantes de empaquetado, experimentos y criterios candidatos. Las obligaciones explícitas del acta aplican independientemente de qué tecnología se elija. |
| Requerida y todavía ausente | Verificación funcional de reportes PDF/Excel de extremo a extremo, conector de referencia con garantía de lectura y custodia privada acreditada, entre otras que constan por ID. |
| Validez aún sin demostrar | Interoperabilidad de todas las versiones/hosts, fidelidad y recursos por modalidad, protección preventiva de todas las superficies y aceptación de un candidato sobre corpus ciego. |

## Dictamen documental

**LISTO PARA REVISIÓN FINAL DE NEON.** Revisar especialmente la correspondencia individual 60/20/7, la clasificación de los tres candidatos, los criterios de testigos y la precedencia entre enfoques anteriores y D01–D21. Las ausencias de los originales y de la evidencia perdida se conservan como brechas explícitas, con las fuentes secundarias y los árboles disponibles. El expediente cubre los 82 IDs recuperados y los cinco añadidos indicados en el encargo. La revisión del Investigador Principal, la del Orquestador y la aprobación del propietario son condiciones para decidir la etapa siguiente.

Esta publicación corresponde a consolidación documental y deja G0/G1 sin iniciar.
