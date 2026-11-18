# Auditoría cruzada de develop y vNext — preservación de trabajo

**Fecha:** 2026-11-05. **Estado:** diagnóstico documental, sin integración de código ni certificación de merge.  
**Repositorio:** Hyouka73/QAMCP. **Rama de publicación:** docs/qap-roadmap-agnostico-20261105.  
**Referencia develop:** 0e5825cfd256065e532f45a171f9a0dc74116615.  
**Referencia vNext al crear esta rama:** 7ccf3db1a6f259f6a5c51521518bbb399a13fda2 (R4-R12 publicada; pendiente de QA físico).  
**Referencia de comparación de divergencia:** en la medición previa vNext e3a95d408882e222e0211a43c1a6cea80fa49306 / develop 0e5825cfd256065e532f45a171f9a0dc74116615, divergencia de 173 y 4 commits respectivamente, con ancestro común b9d5b503a6c4c827f5184fe30cbcec7366efbfb6. Los conteos son históricos y deben actualizarse al integrar.

## 1. Dictamen

**CONSERVAR AMBAS LÍNEAS. NO OVERWRITE, NO FORCE-PUSH, NO MERGE DIRECTO EN ESTA ETAPA.** Las aportaciones de develop son útiles para QAP, pero todavía no se ha demostrado compatibilidad funcional con la nueva memoria, lifecycle, trazabilidad y ejecución de vNext. No existe justificación para descartar el trabajo del desarrollador que continúa en develop.

La evidencia de GitHub confirma que `docs/vnext/04_BACKLOG_Y_WBS_PRELIMINAR.md` de develop es un índice de la auditoría R4-R10, no el WBS arquitectónico completo; enlaza al WBS histórico del commit feature e7d3717d... En cambio, el WBS amplio VNEXT-001 a VNEXT-023 vive en `feat/qap-vnext-architecture`. El índice de develop no es prueba de que el código vNext ya se haya fusionado.

## 2. Inventario contrastado de los cambios en develop

| Área | Evidencia leída en develop | Valor y decisión | Compatibilidad pendiente |
|---|---|---|---|
| Generación BVA | `packages/knowledge/src/plan/bva-generator.ts`, pruebas `bva-generator.test.ts`, export `knowledge/src/index.ts` | Conservar generador como productor de **propuestas** y cubrir frontera BVA; no tratarlo como conformidad comprobada | Separación observación/inferencia/requisito, revisión humana, reglas decimales, selectores, contrato TC |
| Contratos TC | `packages/shared/src/types/tc-case.type.ts` y dos copias del esquema `tc-case.schema.json` | Reutilizar `case_category` y `source_rule_id`, sujeto a versionado y correspondencia con requisito/revisión | Validación de planes/casos y snapshots, migraciones, persistencia de ejecución |
| Validadores | `packages/shared/src/validator/schema-validator.ts` | Mantener mejoras, validar AJV contra esquemas canónicos y legacy | No dar por hecho que pasar AJV implica un comportamiento funcional correcto |
| CLI update | `packages/cli/src/commands/update.ts` y `update-rollback.test.ts` | Conservar guardas de edición manual, diff, backup/rollback | Adaptar a store canónico, CAS, procedencia, pérdida de historial, plan fingerprint |
| CLI prune | `packages/cli/src/commands/prune.ts` y `prune-command.test.ts` | Conservar mantenimiento y dry-run; hacer que retención y redacción sean políticas explícitas | No borrar evidencia referenciada o requerida para auditoría; readback y relaciones canónicas |
| CLI routing | `packages/cli/src/commands.ts` | Conservar comandos reales y aliases pertinentes | Superposición de rutas CLI/MCP, mensajes y argumentos estables |

De las 24 rutas detectadas como modificaciones de develop frente a vNext en la comparación: 10 se cruzaban con archivos modificados/agregados en vNext (nueve documentales del ciclo R4-R10 más `packages/knowledge/src/index.ts`) y 14 eran aportaciones exclusivas de develop. Esta es una clasificación por rutas de Git, **no** un ensayo de merge ni garantía de ausencia de conflictos semánticos.

## 3. Hallazgos de diseño a resolver, sin atribuir éxito no probado

### DEV-BVA-01 — Valores de frontera inferidos
`buildBoundaries` en el generador agrega un límite ficticio de separación 10 cuando solo se conoce min o max, y usa valores enteros. No debe transformar una ausencia de requisito en frontera esperada. Para crédito, tasas, cantidades, plazos, fechas y porcentajes deben existir tipos, unidades, precisión, inclusividad y fuente aprobada. La salida, cuando no hay oráculo, será `candidate`/`blocked_missing_oracle`, no una prueba que certifique negocio.

### DEV-BVA-02 — Selecciones y aserciones no fundamentadas
Si falta un selector, se fabrica `#campo`; el submit y los mensajes éxito/error se expresan mediante selectores genéricos. Los dos casos inválidos hacen `assert not_visible` sobre el selector de error, aunque generalmente habría que corroborar que un mensaje de validación aparece o que el rechazo esperado se produce. El test existente comprueba exactamente ese `not_visible`; pasar ese test no valida la semántica de la aplicación. Hacer aserciones semánticas explícitas, separadas de una heurística de UI. Prohibir auto-promoción a PASS por selector por defecto.

### DEV-TC-01 — Compatibilidad de esquemas y trazabilidad
La adición de categorías y origen al TC es útil. Es necesario preservar versiones de schema, compatibilidad con YAML antiguos, revisión de requisito fuente, dependencia de caso, entorno/rol, fuente de oráculo, plan fingerprint y resultado de runner. Validar simultáneamente con los handlers VNEXT-014, `PlaywrightRunner`, `SchemaValidator`, reportes y lector CLI. Un conflicto textual resuelto puede seguir cambiando resultados.

### DEV-LIFECYCLE-01 — Integridad del conocimiento ante update/prune
Actualizar o purgar archivos legacy debe respetar referencias históricas, `manually_edited`, CAS, recibos, auditoría y retención. Prune no puede eliminar evidencias de cierre o defecto todavía sujetas a una política de conservación. Un resultado histórico no se convierte en no ejecutado solo porque se haya purgado una captura; conservar metadatos verificables de qué se retiró.

### DEV-BOUNDARY-01 — Una sola capa de verdad, puentes explícitos
No construir un segundo motor canónico paralelo a los servicios VNEXT-013/014. Mantener `IKnowledgeStore` y los contratos canónicos como autoridad nueva; los formatos legacy son importación/exportación/migración consciente, nunca doble escritura silenciosa. No convertir una regla YAML legacy "confirmed" en `ExpectedRequirement` confirmado sin autoridad y procedencia suficientes.

## 4. Conflictos previsibles si se fusionan ahora

1. **Add/add documental:** `docs/vnext/STATE.md`, `04_BACKLOG_Y_WBS_PRELIMINAR.md`, `014F_R4_R10_ESTABILIZACION_P1.md` y resultados `auditorias/VNEXT-014-R4-R10/`. En develop son un índice y copia documental de auditoría, mientras vNext conserva un historial mucho más largo. No reemplazar historial vNext por el índice; preservar enlaces y SHA auditados.
2. **Edición concurrente directa:** `packages/knowledge/src/index.ts`. vNext exporta `SqliteKnowledgeAdapter`; develop exporta `generateBvaCases`. La resolución debe preservar ambas exportaciones, sin romper dependencias ni crear ciclos.
3. **Contratos afectados indirectamente:** cambios TC, schema y validador de develop frente a consumidores de vNext que no modificaron necesariamente el mismo archivo. Peligro de fallos en runtime/casos previos aunque Git reporte "merge clean".
4. **Semántica de CLI y filesystem:** `update` y `prune` de develop actúan en archivos legacy; vNext gestiona estado y recibos durables. Requieren integración a nivel de aplicación, no copia incondicional de archivos.
5. **Estados de pruebas:** VNEXT-014 conserva NO-GO. La última auditoría físicamente comprobada en el momento de documentar fue R4-R11 (413 PASS / 63 FAIL de 476 MCP); R4-R12 está publicada pero **no auditada físicamente**. No atribuir su estado a develop.

## 5. Plan de reconciliación sin sobrescritura

| Etapa | Procedimiento | Evidencia obligatoria | Compuerta |
|---|---|---|---|
| G0 — Congelar referencias | Leer HEAD real de ambas ramas, WBS, cambios sin publicar si el desarrollador los reporta; registrar SHAs y responsables | Inventario de deltas y matriz de decisiones por archivo | Cero modificaciones de main/develop |
| G1 — Auditar develop | Ejecutar build, tests BVA, schema, CLI update/rollback, prune y regresiones legacy sobre el SHA real develop | Resultados reproducibles y limitaciones, nunca asumir PASS de inspección | Fallos conocidos identificados |
| G2 — Diseñar contrato | Acordar esquema TC/versiones, `candidate BVA`, almacenamiento, autoridad de requisito, preservación de history/prune | ADR y fixtures de migración, mapas legacy→canónico | Semántica aceptada |
| G3 — Integración controlada | Hacer branch de integración aislada a partir de HEAD vNext actual; portar cambios de develop por funcionalidad, no reemplazar árboles | Diff por archivo, pruebas de contrato, import/export, lint focal | No se pierden funciones/exports |
| G4 — Verificación cruzada | Builds, suites develop originales, suites vNext originales, MCP integral, CLI, pruebas de ejecución y persistencia, casos negativos de autoridad | Matriz exacta comparada por títulos, no bajar expectativas para obtener verde | No nueva regresión injustificada |
| G5 — Revisión conjunta | El desarrollador de develop y propietario de vNext revisan incompatibilidades; decidir orden de convergencia | Matriz de decisiones, PR con evidencia y estrategia reversible | Solo integrar con aprobación y GO |

**Dirección recomendada:** durante la estabilización, portar capacidades de develop hacia una rama de integración *derivada de vNext* con casos de migración; no forzar vNext sobre develop ni reemplazar estado canónico con legacy. La integración definitiva entre ramas deberá decidirse cuando VNEXT-014 supere sus compuertas.

## 6. Qué conservar del plan original

El WBS VNEXT-001–023 sigue vigente como plan arquitectónico en la rama vNext; no se renumera ni se reescribe el historial. Las tareas de develop deben mapearse a compatibilidad y producto antes de declararlas cerradas. La expansión VNEXT-024–033 queda propuesta, no autorizada, en el documento `07_WBS_QAP_AGNOSTICO_Y_EXTENSIONES.md` de esta rama de documentación.

## 7. Referencias inspeccionadas

- [Comparar develop con vNext](https://github.com/Hyouka73/QAMCP/compare/develop...feat/qap-vnext-architecture)
- [WBS índice en develop](https://github.com/Hyouka73/QAMCP/blob/develop/docs/vnext/04_BACKLOG_Y_WBS_PRELIMINAR.md)
- [WBS completo en vNext](https://github.com/Hyouka73/QAMCP/blob/feat/qap-vnext-architecture/docs/vnext/04_BACKLOG_Y_WBS_PRELIMINAR.md)
- [Generador BVA en develop](https://github.com/Hyouka73/QAMCP/blob/develop/packages/knowledge/src/plan/bva-generator.ts)
- [Modelo TC en develop](https://github.com/Hyouka73/QAMCP/blob/develop/packages/shared/src/types/tc-case.type.ts)
- [Prune en develop](https://github.com/Hyouka73/QAMCP/blob/develop/packages/cli/src/commands/prune.ts)
- [Update en develop](https://github.com/Hyouka73/QAMCP/blob/develop/packages/cli/src/commands/update.ts)
- [Informe R4-R11](https://github.com/Hyouka73/QAMCP/blob/feat/qap-vnext-architecture/docs/vnext/auditorias/VNEXT-014-R4-R11/INFORME.md)
- [Estado R4-R12](https://github.com/Hyouka73/QAMCP/blob/feat/qap-vnext-architecture/docs/vnext/STATE.md)

**Límite de la auditoría:** inspección remota del código/documentos y diff Git; no clon, compilación ni merge de prueba en esta actividad. Cada riesgo requiere confirmar su comportamiento mediante las compuertas anteriores.
