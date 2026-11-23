# QAP · Índice de arquitectura, investigaciones y procedencia

La línea base de esta ronda es [`develop` en `fb4d18521844e5cd59ebd4107f75ebe0d320b33c`](https://github.com/Hyouka73/QAMCP/tree/fb4d18521844e5cd59ebd4107f75ebe0d320b33c). La publicación archiva insumos para la siguiente dirección técnica. Aún no existe autorización para modificar la arquitectura, implementar ni iniciar G0/G1. El plan maestro, su secuencia de compuertas y la matriz histórica de 82 requisitos se conservan íntegros.

## Orden de lectura

| Orden | Documento | Estado y función |
|---|---|---|
| 1 | [Visión de producto QAP](../../QAP-VISION-AUTONOMIA.md) | **Vigente como dirección de producto.** Fija la autonomía, la interacción mínima, la autoridad del propietario y los límites de la ejecución. Describe el objetivo de producto. |
| 2 | [Plan maestro consolidado](../plan-maestro.md) | **Vigente como plan de arquitectura.** Contiene los contratos, las fases G0–G6, las compuertas E1–E8 y las decisiones pendientes. Para conocer la redacción que evaluó esta ronda, consultar la [versión en la línea base](https://github.com/Hyouka73/QAMCP/blob/fb4d18521844e5cd59ebd4107f75ebe0d320b33c/docs/qap-architecture/plan-maestro.md). |
| 3 | [Gemini Neon · Etapa 3, Entregable 1](../gemini-neon-etapa-3.md#entregable-1-matriz-de-confrontación-de-los-82-requisitos-contra-develop) | **Histórica.** Fuente de los 82 IDs y del diagnóstico original. El diseño y plan de Etapa 3 son antecedentes del plan consolidado. |
| 4 | [Revisión arquitectónica independiente anterior](../revision-independiente.md) | **Histórica como registro de revisión.** Explica la procedencia, las correcciones incorporadas al plan y la resolución de la segunda revisión de Neon. |
| 5 | [Gemini Neon · Investigación para el cierre de requisitos](gemini-neon-investigacion.md) | **Investigación de origen.** Entrega íntegra sobre adopción por agentes, continuidad, E2E, alternativas de navegador, UTCP/OpenAPI, onboarding, rendimiento y cobertura de QA. Sus recomendaciones, hipótesis, ensayos y decisiones quedan pendientes. |
| 6 | [Codex · Evaluación independiente para el cierre de requisitos](evaluacion-independiente-requisitos.md) | **Propuesta pendiente de ratificación.** El apartado A clasifica y justifica los hallazgos. B conserva los 82 IDs por referencia y propone seis nuevos y ampliaciones a IDs existentes. C y D proponen experimentos y cambios de alcance por compuerta. E recoge las decisiones del propietario. |

## Cómo interpretar la evidencia

- **Hallazgos comprobados.** La evaluación posterior identifica las comprobaciones en el código, la documentación y las especificaciones consultadas. Cada comprobación se limita a su revisión y entorno de origen.
- **Hipótesis y mediciones históricas.** Las cifras de recursos y tokens y las comparativas de rendimiento requieren los benchmarks propuestos antes de fijar umbrales. La [auditoría R7](../../vnext/AUDITORIA_ARQUITECTURA_RENDIMIENTO_MVP_R7_2026-11-07.md) es un antecedente. [Hydrogen](https://github.com/Hyouka73/QAMCP/blob/c57cd886bbda09902afc7d118b54226c1b59e62b/docs/qap-recovery/README.md) pertenece a una rama experimental. Sus conclusiones tienen su propio entorno y compuertas.
- **Recomendaciones.** Para conciliar diferencias entre las dos entregas, consultar los dictámenes y ensayos de la evaluación posterior. Los 88 requisitos son una propuesta. Las ampliaciones de los IDs existentes y los seis IDs nuevos requieren ratificación.
- **Decisiones pendientes.** Las decisiones del plan maestro conservan sus plazos. Las preguntas de la nueva evaluación requieren respuesta del propietario antes de adoptar sus cambios. La numeración DP-11–DP-15 pertenece a la propuesta de Neon.
