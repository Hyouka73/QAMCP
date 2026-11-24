# Catálogo consolidado de requisitos

La referencia del propietario es **87 IDs únicos**. Se recuperaron **82 originales** de la matriz de Neon y se añadieron **5** IDs de la consolidación indicada por el propietario. La evaluación archivada propuso **88** porque incluía `REQ-UTCP-001` como sexto ID. Su contenido queda en `REQ-DAT-001.2` y `REQ-INT-001.4`. Se conservan **11 ampliaciones identificadas** (cinco etiquetas REQ, UTCP/OpenAPI y M1–M5) y **3 nuevos IDs candidatos**. Las dos políticas posteriores figuran al final, fuera del cómputo.

La [Fe de erratas §1.1](cierre-av-01/fuentes-recuperadas/fe-erratas-neon.md#11-corrección-de-encabezados-y-conteo-exacto) acredita 60 RF, 20 RNF y 7 POL históricos por ID. La [matriz](cierre-av-01/matriz-semantica.md) conserva clase histórica, clase objetivo justificada y etiquetas, sin cuota. La clase no altera alcance, prioridad ni aceptación. D01–D21 prevalecen, seguidos por las fichas completas y ampliaciones. Los contratos de AV-02–AV-08 desarrollan esas obligaciones bajo sus respectivas compuertas. Los informes históricos son antecedentes informativos. [Dictamen AV-01](cierre-av-01/dictamen-av01.md) · [Dictamen AV-02](cierre-av-01/dictamen-av02.md).

La columna histórica se traslada a la base remota **77a9c4f3769784df40a17d5d19bd7c83a45f0c89** por identidad de código con `30fb3a2`. El análisis original de Neon dio 41 parciales, 16 incompatibles, 25 ausentes y 0 completos. Las correcciones H-REV posteriores aclaran el alcance donde se indica. Se trata de evidencia estática y antecedentes por SHA. La aceptación de cada fila sigue siendo candidata. Las dependencias usan el sufijo del ID con prefijo `REQ-` implícito y pueden describir interacción recíproca de contratos, sin fijar una secuencia de implementación.

## Memoria y conocimiento

Decisiones relacionadas para las filas de esta familia: D02, D05, D07, D19, D20. Trazabilidad a G0/G1/G5, E1/E2. Los complementos de alcance figuran en las [ampliaciones](#ampliaciones-de-la-línea-base).

### REQ-MEM-001.1

Imponer plano obligatorio en un único almacén canónico para toda entidad.

- **Estado en develop.** Integrado · parcial. `knowledge.sqlite` aplica 4 planos (`EpistemicPlane`), pero `.qa/` YAML y partes de `app-service.sqlite` no exigen plano epistémico unificado.
- **Dependencias y alcance.** SEG 001.1. Fuentes y permisos por alcance.
- **Aceptación candidata.** Impedir persistencia sin plano y consultar por separado observación, inferencia, regla acreditada y resultado.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L18) · [`packages/shared/src/domain/epistemic-planes.ts:14`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/shared/src/domain/epistemic-planes.ts#L14) · [`packages/knowledge/src/storage/knowledge-shape.ts:31-66`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/knowledge/src/storage/knowledge-shape.ts#L31).

### REQ-MEM-001.2

Regla invariante en la capa de dominio/repositorio aplicable a MCP y CLI.

- **Estado en develop.** Integrado · parcial. Bloquea promoción de `crawler`/`active_probe` en cobertura canónica, pero `qap_rules_set` legacy y CLI `rules.yaml` no imponen esta invariante.
- **Dependencias y alcance.** MEM 001.1, DOC 001.4. Fuentes y permisos por alcance.
- **Aceptación candidata.** Una observación repetida queda en su plano en ambos canales hasta acreditar autoridad y procedencia.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L19) · [`packages/mcp/src/handlers/canonical-coverage-service.ts:141-156`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/handlers/canonical-coverage-service.ts#L141) · [`packages/knowledge/src/storage/file-storage.ts:449-504`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/knowledge/src/storage/file-storage.ts#L449).

### REQ-MEM-001.3

Versionado inmutable uniforme de entidades de conocimiento y casos en un solo modelo.

- **Estado en develop.** Integrado · parcial. `knowledge_revisions` tiene triggers `BEFORE UPDATE/DELETE` inmutables; pero `app-service.sqlite` (`projects`, `modules`, `service_test_cases`) y `.qa/` mutan in-place.
- **Dependencias y alcance.** MEM 001.1. Fuentes y permisos por alcance.
- **Aceptación candidata.** Revisar una regla y un caso conserva la lectura de versiones previas y rechaza sus mutaciones.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L20) · [`packages/knowledge/src/storage/knowledge-sqlite-schema.ts:37-54`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/knowledge/src/storage/knowledge-sqlite-schema.ts#L37) · [`packages/mcp/src/application/app-service-store.ts:303-326`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/application/app-service-store.ts#L303).

### REQ-MEM-001.4

Máquina de estados de revisión para ediciones manuales disparada por drift/conflicto.

- **Estado en develop.** Integrado · parcial. `UpdateGuard` bloquea sobreescritura de casos `manually_edited` en CLI, pero no existe transición automática a `pending_review` ante drift ni trazabilidad `legacy_manual_edit` en producción.
- **Dependencias y alcance.** MEM 001.3, REG 001.1. Fuentes y permisos por alcance.
- **Aceptación candidata.** Un cambio incompatible marca una edición protegida para revisión y preserva su contenido y linaje.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L21) · [`packages/knowledge/src/plan/update-guard.ts:11-66`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/knowledge/src/plan/update-guard.ts#L11).

### REQ-MEM-002.1

Vector de alcance completo `(project, app, instance, env, tenant, role, version, config_rev)` en todo el almacenamiento. D02/D05 explicitan también perfil y configuración, además de las dimensiones históricas.

- **Estado en develop.** Integrado · incompatible con la garantía objetivo. `app-service.sqlite` tiene `project_id`/`env`/`tenant_id`/`role`; `knowledge.sqlite` carece de `tenant_id` (solo `application_id` en PK); `.qa/` no separa tenant ni rol; faltan `instance_id`, `product_version` y `visual_variant` como claves de primera clase.
- **Dependencias y alcance.** SEG 001.2. Fuentes y permisos por alcance.
- **Aceptación candidata.** Ejecutar dos perfiles con variantes divergentes y probar aislamiento en claves, FTS, exportación y reportes.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L22) · [`packages/knowledge/src/storage/knowledge-sqlite-schema.ts:16-35`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/knowledge/src/storage/knowledge-sqlite-schema.ts#L16) · [`packages/mcp/src/application/app-service-store.ts:394-496`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/application/app-service-store.ts#L394).

- **Precisión AR-04.** ExecutionScopeEnvelope conserva cuatro planos. ScopeIdentity identifica proyecto, aplicación, instancia, entorno, tenant, rol, versión de producto y revisión de configuración. ProfileBinding liga una referencia opaca y huella de alcance efectivo a la sesión, fuera del Knowledge exportable. Aislar autorización, vistas y evidencia sensible por perfil efectivo aun entre perfiles del mismo rol si difieren sus permisos. AppVariantContext fija variante visual, viewport y tema/layout. FrozenRegionalContext incluye idioma UI, locale, zona, moneda y calendario cuando aplique, congelados en el plan y su digest para replay e i18n. La región por sí sola no amplía autoridad. Si cambia reglas o permisos, reflejarlo en configuración o alcance acreditados. Probar dos tenants, perfiles de igual rol con permisos distintos, dos variantes y dos regiones, con cero fugas, colisiones o revocación cruzada. Si no se puede fijar región, congelar la observada y abstenerse al divergir.

- **Contravalidación AV-02.** Identidad y tenant acreditados por destino, derechos efectivos y sesión vinculada. [AR-14](cierre-av-01/dictamen-av02.md#ar-14).

### REQ-MEM-002.2

Validador único de alcance obligatorio en el núcleo compartido por MCP y CLI.

- **Estado en develop.** Integrado · parcial. `WorkspaceContextManager` bloquea workspaces ambiguos y `DiscoveryHandler` valida `tenant_id`, pero CLI opera directo en `process.cwd()` sin validar alcance ni tenant.
- **Dependencias y alcance.** MEM 002.1, SEG 001.1. Fuentes y permisos por alcance.
- **Aceptación candidata.** MCP y CLI rechazan el mismo alcance ambiguo, requerido e incompleto o cruzado antes de acceder.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L23) · [`packages/mcp/src/workspace-context-manager.ts:706-718`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/workspace-context-manager.ts#L706) · [`packages/mcp/src/handlers/discovery.handler.ts:232-239`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/handlers/discovery.handler.ts#L232).

- **Contravalidación AV-02.** Identidad y tenant acreditados por destino, derechos efectivos y sesión vinculada. [AR-14](cierre-av-01/dictamen-av02.md#ar-14).

### REQ-MEM-002.3

Persistencia unificada de estado de campaña, frontera, cola determinista y cola de razonamiento.

- **Estado en develop.** Integrado · parcial. Existen `tasks.recovery_cursor_json` y `initial-inventory`, pero no hay cola persistente separada de tareas deterministas vs cola de razonamiento pendiente; `InterviewDraftStore` está inalcanzable por `host-composition.ts:413`.
- **Dependencias y alcance.** CAM 001.2, IA 001.4. Fuentes y permisos por alcance.
- **Aceptación candidata.** Matar y relanzar el ejecutor restaura frontera, tareas listas y razonamiento pendiente sin duplicarlos.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L24) · [`packages/mcp/src/application/app-service-store.ts:104-120`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/application/app-service-store.ts#L104) · [`packages/mcp/src/host-composition.ts:413`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/host-composition.ts#L413).

### REQ-MEM-002.4

Servicio de snapshot contextual determinista para re-hidratar cualquier host/modelo.

- **Estado en develop.** Integrado · parcial. Permite retomar workspace en otro chat, pero el contexto está repartido en 6 SQLite + `.qa/` y no existe generador de paquete de re-hidratación compacto multi-host con cola de razonamiento.
- **Dependencias y alcance.** MEM 002.2–002.3. Fuentes y permisos por alcance.
- **Aceptación candidata.** Una consulta autorizada desde otro host recupera cobertura, IDs y siguiente tarea. El alcance revocado se bloquea.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L25) · [`packages/mcp/src/handlers/status.handler.ts:465-689`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/handlers/status.handler.ts#L465).

### REQ-MEM-002.5

Separación física y lógica estricta entre memoria de conocimiento y almacén efímero de sesiones/caché.

- **Estado en develop.** Integrado · parcial. Sesiones separadas de `knowledge.sqlite`, pero `qap clean`/`ProjectReset` y `.qa/cache/` mezclan artefactos locales en el mismo árbol `.qa/`.
- **Dependencias y alcance.** SEG 002.1–002.2. Fuentes y permisos por alcance.
- **Aceptación candidata.** Un export de Knowledge conserva procedencia y excluye secretos y sesiones. Revocar sesión conserva Knowledge.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L26) · [`packages/shared/src/domain/contextual-dimensions.ts:94-106`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/shared/src/domain/contextual-dimensions.ts#L94) · [`packages/mcp/src/application/managed-artifacts.ts:54-71`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/application/managed-artifacts.ts#L54).

- **Contravalidación AV-02.** Alta fuera de banda y KEK persistente sujeto a EXP-07. [AR-07](cierre-av-01/dictamen-av02.md#ar-07).

### REQ-MEM-003.1

Registro único de contradicciones tipadas con estado de resolución y bloqueo de oráculo.

- **Estado en develop.** Integrado · parcial. Detecta contradicciones entre reglas de negocio (`equal_authority_contradiction`), pero no existe tabla/flujo unificado para contradicciones entre observación y regla en todas las entidades.
- **Dependencias y alcance.** DOC 001.3–001.4. Fuentes y permisos por alcance.
- **Aceptación candidata.** Una regla en conflicto y la observación asociada conservan localizadores, estado y bloqueo de su oráculo.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L27) · [`packages/mcp/src/application/scoped-rule-resolver.ts:968-992`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/application/scoped-rule-resolver.ts#L968) · [`packages/mcp/src/application/app-service-store.ts:227-239`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/application/app-service-store.ts#L227).

### REQ-MEM-003.2

Motor activo de propagación de `stale` por grafo de dependencias conectado al núcleo.

- **Estado en develop.** Integrado · parcial. `PlanHandler` detecta obsolescencia de `plan.json` vía `cases_fingerprint`; `ImpactAnalyzer` existe en `@qap/knowledge` pero tiene **0 consumidores** en MCP/CLI.
- **Dependencias y alcance.** MEM 001.3, REG 001.1. Fuentes y permisos por alcance.
- **Aceptación candidata.** Cambiar una fuente invalida las revisiones dependientes y conserva vigentes las independientes.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L28) · [`packages/knowledge/src/impact/impact-analyzer.ts`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/knowledge/src/impact/impact-analyzer.ts) · [`packages/mcp/src/handlers/plan.handler.ts:195-224`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/handlers/plan.handler.ts#L195).

### REQ-MEM-003.3

Pipeline post-ejecución que alimenta firmas, flakiness y observaciones sin tocar requisitos.

- **Estado en develop.** Requerido · ausente. Guarda intentos y resultados, pero `HistoryManager.recordExecution()` no se llama en producción y no existe aprendizaje automático de firmas de fallo, flakiness ni latencias hacia memoria.
- **Dependencias y alcance.** RUN 001.6, REP 001.3. Fuentes y permisos por alcance.
- **Aceptación candidata.** Repetir fallos registra firma e indicadores de inestabilidad enlazados con sus intentos y deja intacta la regla.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L29) · [`packages/knowledge/src/history/history-manager.ts:72`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/knowledge/src/history/history-manager.ts#L72) · [`packages/mcp/src/application/block3-execution-repo.ts`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/application/block3-execution-repo.ts).

### REQ-MEM-003.4

Exportador/importador de paquetes portables versionados con filtro estricto anti-secretos.

- **Estado en develop.** Requerido · ausente. Solo existe importador legacy de `.qa/`; no existe exportación/importación portable versionada del conocimiento completo con sanitización de secretos.
- **Dependencias y alcance.** MEM 001.3, SEG 002.1. Fuentes y permisos por alcance.
- **Aceptación candidata.** Exportar e importar un alcance con hashes reproduce entidades y revisiones y excluye secretos y sesiones.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L30) · [`packages/mcp/src/application/legacy-qa-importer.ts`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/application/legacy-qa-importer.ts).

### REQ-MEM-003.5

Motor único de retención y borrado aislado por proyecto usado por MCP y CLI.

- **Estado en develop.** Integrado · incompatible con la garantía objetivo. CLI poda `.qa/executions/` y `qap.sqlite`, pero `qap_prune` en MCP tiene `dryRun` ficticio (ceros fijos), fuga de handle SQLite y no poda `.qa/executions/`.
- **Dependencias y alcance.** RUN 001.6, REP 001.1. Fuentes y permisos por alcance.
- **Aceptación candidata.** Simular y aplicar poda por alcance concilia los candidatos y bytes lógicos, protege ejecuciones activas y conserva veredicto y evento.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L31) · [`packages/mcp/src/server.ts:4303-4350`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/server.ts#L4303) · [`packages/cli/src/commands/prune.ts:198-420`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/cli/src/commands/prune.ts#L198).

- **Contravalidación AV-02.** Retención histórica y reserva por volumen sin poda por cuota de evidencia protegida. DE-01 abierta. [AR-25](cierre-av-01/dictamen-av02.md#ar-25).

### REQ-MEM-003.6

Puerto de persistencia único con adaptador local (SQLite) y contrato listo para adaptador concurrente (PostgreSQL).

- **Estado en develop.** Requerido · ausente. Acoplamiento directo a `node:sqlite` en 6 archivos SQLite locales sin puerto de repositorio común para modalidad self-hosted concurrente (PostgreSQL).
- **Dependencias y alcance.** INT 001.3, SEG 001.1. Fuentes y permisos por alcance.
- **Aceptación candidata.** Ejecutar pruebas de contrato del almacén local y demostrar que el dominio no depende de SQL, driver ni transporte específicos.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L32) · [`packages/knowledge/src/storage/sqlite-knowledge-adapter.ts:83`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/knowledge/src/storage/sqlite-knowledge-adapter.ts#L83) · [`packages/mcp/src/application/app-service-store.ts:549`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/application/app-service-store.ts#L549).

## Discovery

Decisiones relacionadas para las filas de esta familia: D04, D05, D07, D09, D15, D21. Trazabilidad a G2/G4/G6, E4/E8. Los complementos de alcance figuran en las [ampliaciones](#ampliaciones-de-la-línea-base).

### REQ-DIS-001.1

Bucle autónomo de lotes controlado por el orquestador hasta `READY` o presupuesto.

- **Estado en develop.** Integrado · parcial. Soporta lotes solo para `inventario-provisional`; requiere invocaciones repetidas del agente y no encadena lotes autónomamente en segundo plano.
- **Dependencias y alcance.** CAM 001.2–001.3. Identidad y política de lectura.
- **Aceptación candidata.** Partir de una intención autorizada, continuar lotes sin aprobación ordinaria y registrar READY o agotamiento con brechas.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L38) · [`packages/mcp/src/handlers/discovery.handler.ts:632-668`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/handlers/discovery.handler.ts#L632) · [`packages/playwright-adapter/src/crawler/service.ts:119-145`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/playwright-adapter/src/crawler/service.ts#L119).

### REQ-DIS-001.2

Modelo uniforme de frontera y cobertura para toda exploración (inicial y focalizada).

- **Estado en develop.** Integrado · parcial. Separa `visited`, `candidate`, `blocked`, `out_of_scope` y calcula `READY`/`PARTIAL_READY`/`BLOCKED` en inventario inicial; no aplica igual en módulos nombrados ni en CLI.
- **Dependencias y alcance.** MEM 002.3. Identidad y política de lectura.
- **Aceptación candidata.** Interrumpir Discovery inicial y focalizado y recuperar frontera, visitados y brechas con la misma semántica.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L39) · [`packages/mcp/src/application/initial-inventory.ts:87-115`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/application/initial-inventory.ts#L87) · [`packages/mcp/src/handlers/discovery.handler.ts:662,788`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/handlers/discovery.handler.ts#L662).

### REQ-DIS-001.3

Extractor DOM profundo para SPAs: etiquetas reales (ARIA/texto), tablas, filtros, paginación, formularios, validaciones y estados.

- **Estado en develop.** Integrado · incompatible con la garantía objetivo. **Severamente limitado:** descarta etiquetas fuera de un diccionario de 9 palabras, omite texto de encabezados, **no analiza `<table>`** y en modo `inventory` aborta `fetch`/`xhr`.
- **Dependencias y alcance.** SEG 001.2. Identidad y política de lectura.
- **Aceptación candidata.** Comparar contra inventario independiente controles, etiquetas, tablas, filtros, páginas y validaciones en SPA.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L40) · [`packages/playwright-adapter/src/crawler/dom.ts:13-71`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/playwright-adapter/src/crawler/dom.ts#L13) · [`packages/playwright-adapter/src/crawler/service.ts:199-214`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/playwright-adapter/src/crawler/service.ts#L199).

### REQ-DIS-001.4

Observador de tráfico de lectura integrado al crawler con correlación vista ↔ endpoint API.

- **Estado en develop.** Requerido · ausente. Existen en `packages/playwright-adapter` pero tienen **0 invocaciones en producción**; además `NetworkTrafficObserver` recorta queries a 5 claves y rutas a 12 palabras.
- **Dependencias y alcance.** SEG 001.1–001.2. Identidad y política de lectura.
- **Aceptación candidata.** Asociar lecturas acreditadas a vista y versión y comprobar que la hidratación funciona bajo la política de lectura.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L41) · [`packages/playwright-adapter/src/network-observer/service.ts:25`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/playwright-adapter/src/network-observer/service.ts#L25) · [`packages/playwright-adapter/src/reconnaissance/service.ts:15`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/playwright-adapter/src/reconnaissance/service.ts#L15).

### REQ-DIS-001.5

Matriz diferencial de visibilidad por rol, tenant y configuración efectiva.

- **Estado en develop.** Integrado · parcial. Soporta un perfil por corrida, pero no compara visibilidad multi-rol ni cruza configuraciones efectivas (`es_contable`, etc.) de forma sistemática.
- **Dependencias y alcance.** MEM 002.1, SEG 002.2. Identidad y política de lectura.
- **Aceptación candidata.** Comparar permisos de dos roles y dos configuraciones y registrar diferencias con procedencia y alcance.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L42) · [`packages/mcp/src/handlers/discovery.handler.ts:528-568`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/handlers/discovery.handler.ts#L528).

- **Enmienda AV-01 5.** Registrar no_visible_para_rol solo con causa de rol acreditada. Un 403 de causa desconocida indica acceso denegado o no observado. Ni 403 ni vista ausente acreditan inexistencia. Comparar también perfiles de igual rol con derechos efectivos distintos. Probar por separado ambas causas y ambos perfiles. [adenda-final L37](https://github.com/Hyouka73/QAMCP/blob/c1d1680e6531a5132456665ca6851b6cbf5ff528/docs/qap-architecture/cierre-av-01/fuentes-recuperadas/adenda-final.md#L37) · [especificacion-entrega-1 L161](https://github.com/Hyouka73/QAMCP/blob/c1d1680e6531a5132456665ca6851b6cbf5ff528/docs/qap-architecture/cierre-av-01/fuentes-recuperadas/especificacion-entrega-1.md#L161).

### REQ-DIS-001.6

Grafo dual explícito: aristas de navegación vs dependencias de negocio acreditadas.

- **Estado en develop.** Integrado · parcial. Registra `link_candidate`/`http_redirect` separados en dossier, pero no existe grafo de dependencias de negocio acreditadas conectado al crawler/planner.
- **Dependencias y alcance.** MEM 001.1–001.2. Identidad y política de lectura.
- **Aceptación candidata.** Una ruta navegable genera una arista observada y una dependencia de negocio exige fuente acreditada.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L43) · [`packages/playwright-adapter/src/crawler/service.ts:367-393`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/playwright-adapter/src/crawler/service.ts#L367).

### REQ-DIS-001.7

Checkpoints por alcance para todo Discovery y refresco incremental guiado por drift.

- **Estado en develop.** Integrado · parcial. Checkpoints reanudables solo existen para `inventario-provisional`; módulos nombrados no guardan frontera ni soportan descubrimiento incremental por delta.
- **Dependencias y alcance.** MEM 002.3, REG 001.1. Identidad y política de lectura.
- **Aceptación candidata.** Reanudar checkpoint del alcance efectivo y ante drift inspeccionar solo la parte invalidada.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L44) · [`packages/mcp/src/handlers/discovery.handler.ts:662,788`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/handlers/discovery.handler.ts#L662).

### REQ-DIS-001.8

Ejecución de lotes desacoplada en worker/orquestador soberano de QAP.

- **Estado en develop.** Requerido · ausente. Ejecuta únicamente de forma síncrona dentro de una llamada MCP; si el host se desconecta, se detiene el proceso de lotes.
- **Dependencias y alcance.** CAM 001.4. Identidad y política de lectura.
- **Aceptación candidata.** Terminar el host con lotes de observación listos y comprobar que el ejecutor los completa y conserva pausas que requieren razonamiento.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L45) · [`packages/mcp/src/handlers/discovery.handler.ts`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/handlers/discovery.handler.ts).

## Ingesta documental

Decisiones relacionadas para las filas de esta familia: D05, D10, D11, D12. Trazabilidad a G2/G6, E4/E8. Los complementos de alcance figuran en las [ampliaciones](#ampliaciones-de-la-línea-base).

### REQ-DOC-001.1

Pipeline de ingesta estructurada por adaptadores de formato con localizador (sección/página/versión). Incorporar los formatos de D10 y conservar tablas y localizadores de páginas, secciones, hojas y celdas.

- **Estado en develop.** Integrado · parcial. Ingiere texto/Markdown en `ingested_documents` y extrae reglas vía regex de viñetas `- [RULE ...]`; `docPath` está bloqueado en MCP (`direct_document_path_unavailable`).
- **Dependencias y alcance.** MEM 001.3, INT 001.4. Fuentes acreditadas, alcance y revisión.
- **Aceptación candidata.** Ingerir el corpus mínimo de D10 y recuperar texto y tablas con páginas, celdas/secciones, versión y procedencia.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L51) · [`packages/mcp/src/server.ts:890-892,2854`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/server.ts#L890) · [`packages/mcp/src/application/scoped-rule-resolver.ts:444-600`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/application/scoped-rule-resolver.ts#L444).

### REQ-DOC-001.2

Registro explícito de cobertura de extracción y fragmentos omitidos/no legibles.

- **Estado en develop.** Requerido · ausente. No registra secciones, tablas o páginas no legibles ni emite brechas explícitas de extracción.
- **Dependencias y alcance.** DOC 001.1. Fuentes acreditadas, alcance y revisión.
- **Aceptación candidata.** Registrar páginas escaneadas, celdas o secciones ilegibles y omisiones con su localizador e impedir el uso de extracción insuficiente.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L52) · [`packages/mcp/src/application/scoped-rule-resolver.ts:444`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/application/scoped-rule-resolver.ts#L444).

### REQ-DOC-001.3

Motor de reconciliación bidireccional documento ↔ observación con los 4 estados exactos.

- **Estado en develop.** Integrado · parcial. Resuelve reglas contra el alcance del dossier, pero no produce la matriz completa de reconciliación (coincidente / documentado no observado / observado no documentado / contradicción real).
- **Dependencias y alcance.** DOC 001.1–001.2, DIS 001.3. Fuentes acreditadas, alcance y revisión.
- **Aceptación candidata.** Sembrar los cuatro estados de conciliación y distinguir coincidente, documentado no observado, observado no documentado y contradicción real.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L53) · [`packages/mcp/src/handlers/discovery.handler.ts:879-890`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/handlers/discovery.handler.ts#L879).

- **Enmienda AV-01 4.** documentado_no_observado queda pendiente y jamás se marca automáticamente como eliminado. Conservar los cuatro estados y el criterio para contradicciones de igual autoridad. [adenda-final L48](https://github.com/Hyouka73/QAMCP/blob/c1d1680e6531a5132456665ca6851b6cbf5ff528/docs/qap-architecture/cierre-av-01/fuentes-recuperadas/adenda-final.md#L48) · [especificacion-entrega-1 L67](https://github.com/Hyouka73/QAMCP/blob/c1d1680e6531a5132456665ca6851b6cbf5ff528/docs/qap-architecture/cierre-av-01/fuentes-recuperadas/especificacion-entrega-1.md#L67).

### REQ-DOC-001.4

Regla transversal de autoridad documental aplicada a todo diseño de casos y oráculos.

- **Estado en develop.** Integrado · parcial. Distingue `accredited` vs `unaccredited` y `confirmed_requirement` vs `ingested_doc`, bloqueando ambigüedades; falta cobertura uniforme fuera de `discovery_revisions`.
- **Dependencias y alcance.** MEM 001.2, DOC 001.3. Fuentes acreditadas, alcance y revisión.
- **Aceptación candidata.** Una fuente primaria acreditada prevalece según alcance y vigencia. Una contradicción material sin resolver bloquea el oráculo.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L54) · [`packages/mcp/src/application/scoped-rule-resolver.ts:4-15,931-1101`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/application/scoped-rule-resolver.ts#L4).

## Inteligencia y acreditación

Decisiones relacionadas para las filas de esta familia: D03, D04, D05, D13, D17. Trazabilidad a G0/G1/G4/G5, E1/E3/E7. Los complementos de alcance figuran en las [ampliaciones](#ampliaciones-de-la-línea-base).

### REQ-IA-001.1

Protocolo limpio de solicitudes/propuestas estructuradas entre núcleo QAP y host.

- **Estado en develop.** Integrado · parcial. Opera en modo `HOST` sobre MCP Stdio usando el modelo del cliente, pero sin contratos de propuestas uniformes (mezcla `ToolDispatcher` con `switch` legacy).
- **Dependencias y alcance.** MEM 002.4, CAM 001.2. Colas, política y formato de propuestas.
- **Aceptación candidata.** Emitir solicitud estructurada y aceptar una propuesta de revisión vigente. Rechazar la propuesta caducada y los cambios de autoridad.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L60) · [`packages/mcp/src/server.ts:699-906`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/server.ts#L699) · [`packages/mcp/src/guidance.ts:208-786`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/guidance.ts#L208).

### REQ-IA-001.2

Modo `DETERMINISTIC` formal en el orquestador para repetición y regresión autónoma.

- **Estado en develop.** Integrado · parcial. Ejecución Playwright no llama a modelos por paso; sin embargo, no existe un modo `DETERMINISTIC` unificado de campaña/regresión sin host.
- **Dependencias y alcance.** PLN 001.5, RUN 001.2. Colas, política y formato de propuestas.
- **Aceptación candidata.** Repetir y ejecutar regresión congelada con cero llamadas de inferencia y conservar el linaje del intento.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L61) · [`packages/playwright-runner/src/runner.ts:587-936`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/playwright-runner/src/runner.ts#L587).

### REQ-IA-001.3

Validador único de propuestas estructuradas (escenarios, oráculos, diagnósticos, reparaciones).

- **Estado en develop.** Integrado · parcial. Valida argumentos, preguntas y casos con linaje, pero varias tools legacy (`server.ts:1906-5900`) omiten `ToolDispatcher`.
- **Dependencias y alcance.** IA 001.1, SEG 001.1. Colas, política y formato de propuestas.
- **Aceptación candidata.** Rechazar propuestas malformadas, no acreditadas o fuera de alcance en escenarios, diagnóstico, oráculos y reparaciones.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L62) · [`packages/mcp/src/dispatcher.ts:48-117`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/dispatcher.ts#L48) · [`packages/engine/src/pregunta.ts:330`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/engine/src/pregunta.ts#L330).

### REQ-IA-001.4

Motor de campaña con separación de colas determinista vs razonamiento y handoff multi-host.

- **Estado en develop.** Requerido · ausente. No existe cola persistente de tareas de razonamiento ni continuación automática de tareas deterministas al desconectarse el host.
- **Dependencias y alcance.** MEM 002.3, CAM 001.4. Colas, política y formato de propuestas.
- **Aceptación candidata.** Desconectar HOST, drenar cola elegible y reclamar razonamiento pendiente desde otro host compatible.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L63).

### REQ-IA-001.5

Verificación criptográfica/integridad única de origen de intento en MCP y CLI.

- **Estado en develop.** Integrado · parcial. `ReportHandler` exige `result_digest` + `hasCommittedRun` + `trace.zip` en MCP, pero CLI `qap report` acepta JSON sin verificar integridad ni origen canónico.
- **Dependencias y alcance.** RUN 001.6, REP 001.1. Colas, política y formato de propuestas.
- **Aceptación candidata.** Alterar un byte de un intento y demostrar el mismo rechazo de acreditación en MCP y CLI.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L64) · [`packages/mcp/src/handlers/report.handler.ts:175-190`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/handlers/report.handler.ts#L175) · [`packages/cli/src/commands/report.ts:93-183`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/cli/src/commands/report.ts#L93).

- **Contravalidación AV-02.** Nivel de confianza explícito y frontera independiente del HOST para acreditación fuerte. [AR-28](cierre-av-01/dictamen-av02.md#ar-28).

### REQ-IA-001.6

Puerto `IReasoningProvider` opcional (implementable en fase posterior según `DP-06`).

- **Estado en develop.** Requerido · ausente. No existe modo `MANAGED` ni abstracción de proveedor de razonamiento gestionado.
- **Dependencias y alcance.** IA 001.1, INT 001.4. Colas, política y formato de propuestas.
- **Aceptación candidata.** Ejercer el contrato con un doble aislado y completar los modos iniciales con cero dependencia del proveedor MANAGED.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L65).

## Planificación

Decisiones relacionadas para las filas de esta familia: D04, D05, D06, D12, D16. Trazabilidad a G0/G3/G4, E1/E4/E5. Los complementos de alcance figuran en las [ampliaciones](#ampliaciones-de-la-línea-base).

### REQ-PLN-001.1

Modelo unificado de 4 entidades: `CampaignPlan`, `ExecutionPlan`, `DataPlan`, `TestCase`.

- **Estado en develop.** Integrado · incompatible con la garantía objetivo. Existen dos planes desconectados (`session.plan` en `lifecycle.json` y `plan.json` por módulo) y **no existe plan de datos**.
- **Dependencias y alcance.** MEM 001.3, CAS 001.3. Discovery, reglas, permisos y casos.
- **Aceptación candidata.** Vincular campaña, ejecución, datos y caso versionados con un snapshot de revisiones reproducible.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L71) · [`packages/mcp/src/server.ts:3399`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/server.ts#L3399) · [`packages/mcp/src/handlers/plan.handler.ts:44-58`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/handlers/plan.handler.ts#L44).

### REQ-PLN-001.2

Planificador incremental que genera bloques ejecutables desde `PARTIAL_READY`.

- **Estado en develop.** Integrado · parcial. Permite planificar sobre vistas inspeccionadas en inventario inicial, pero el flujo legacy bloquea mientras existan compuertas de entrevista/scoping.
- **Dependencias y alcance.** DIS 001.2, CAS 001.1. Discovery, reglas, permisos y casos.
- **Aceptación candidata.** Con cobertura parcial, materializar casos cubiertos y mostrar brechas y ramas bloqueadas.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L72) · [`packages/mcp/src/handlers/plan.handler.ts:645-690`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/handlers/plan.handler.ts#L645).

### REQ-PLN-001.3

Motor de priorización por riesgo (criticidad, drift, defectos previos, presupuesto).

- **Estado en develop.** Requerido · ausente. Priorización rudimentaria/manual sin modelo de riesgo por cambio, criticidad ni historial de defectos.
- **Dependencias y alcance.** REG 001.1, CAM 001.3. Discovery, reglas, permisos y casos.
- **Aceptación candidata.** Con igual presupuesto, priorizar por criticidad, drift e historial y registrar el motivo reproducible.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L73) · [`packages/knowledge/src/candidate-generator.ts:53`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/knowledge/src/candidate-generator.ts#L53).

### REQ-PLN-001.4

Resolvedor DAG unificado multi-caso y multi-módulo con bloqueo ante ciclos.

- **Estado en develop.** Integrado · incompatible con la garantía objetivo. DAG funciona a nivel de casos dentro de un módulo (`plan.handler.ts:94`), pero **`FlowOrchestrator` ignora `depends_on`** entre módulos (`flow-orchestrator.ts:371,402`) y `qap_flow_run` está deshabilitado en MCP.
- **Dependencias y alcance.** PLN 001.1, DAT 001.2. Discovery, reglas, permisos y casos.
- **Aceptación candidata.** Resolver tres módulos y dos identidades. Bloquear el ciclo antes de ejecutar y transferir variables tipadas.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L74) · [`packages/engine/src/flow-orchestrator.ts:371-402`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/engine/src/flow-orchestrator.ts#L371) · [`packages/knowledge/src/graph/dependency-graph.ts`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/knowledge/src/graph/dependency-graph.ts).

### REQ-PLN-001.5

Congelamiento inmutable de `ExecutionPlan` verificado por el runner en todo canal.

- **Estado en develop.** Integrado · parcial. Verifica `checksum` y `cases_fingerprint` en MCP; ausente en CLI `qap test`.
- **Dependencias y alcance.** PLN 001.4, MEM 001.3. Discovery, reglas, permisos y casos.
- **Aceptación candidata.** Alterar una revisión, huella o caducidad del snapshot y rechazarlo por ambos canales antes de producir efectos.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L75) · [`packages/mcp/src/handlers/plan.handler.ts:195-226,431-513`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/handlers/plan.handler.ts#L195).

### REQ-PLN-001.6

Reevaluador de grafo de campaña tras fallo de prerrequisito o hallazgo crítico.

- **Estado en develop.** Requerido · ausente. No existe replanificación dinámica ante hallazgos o bloqueos de prerrequisitos durante una campaña.
- **Dependencias y alcance.** CAM 001.2, PLN 001.4. Discovery, reglas, permisos y casos.
- **Aceptación candidata.** Al fallar un prerrequisito, bloquear sus dependientes y preservar progreso y revisión de ramas independientes.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L76).

## Casos y elegibilidad

Decisiones relacionadas para las filas de esta familia: D04, D05, D06, D07, D12, D21. Trazabilidad a G4/G6, E4/E5/E8. Los complementos de alcance figuran en las [ampliaciones](#ampliaciones-de-la-línea-base).

### REQ-CAS-001.1

Elegibilidad automática basada en política y fuente acreditada (0 aprobaciones humanas por caso en ruta ordinaria).

- **Estado en develop.** Integrado · incompatible con la garantía objetivo. **Contradicción directa con la visión vigente:** exige aprobación humana de casos (`verifyCaseApproval`, `case_approval_unavailable`) antes de ejecutar en `TestHandler`.
- **Dependencias y alcance.** SEG 001.1, DOC 001.4. Reglas acreditadas y revisiones.
- **Aceptación candidata.** Ejecutar automáticamente casos ordinarios elegibles y registrar causal y alcance del bloqueo cuando falte fuente o permiso.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L82) · [`packages/mcp/src/handlers/case-workflow.ts:41`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/handlers/case-workflow.ts#L41) · [`packages/mcp/src/handlers/test.handler.ts:484-486`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/handlers/test.handler.ts#L484).

### REQ-CAS-001.2

Generación multi-técnica (positivos, negativos, BVA, estados, RBAC, cálculos) enlazada a oráculos acreditados.

- **Estado en develop.** Integrado · incompatible con la garantía objetivo. CLI genera BVA y RBAC, pero `case-execution-policy.ts:5-8` **los bloquea incondicionalmente** como `blocked_missing_oracle`; MCP solo genera casos smoke/básicos.
- **Dependencias y alcance.** CAS 001.1, ORA 001.1–001.4. Reglas acreditadas y revisiones.
- **Aceptación candidata.** Generar casos positivos, negativos, límites, estados, RBAC y cálculo con oráculo acreditado para cada efecto.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L83) · [`packages/knowledge/src/plan/bva-generator.ts:688`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/knowledge/src/plan/bva-generator.ts#L688) · [`packages/knowledge/src/plan/rbac-generator.ts:309`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/knowledge/src/plan/rbac-generator.ts#L309) · [`packages/playwright-runner/src/case-execution-policy.ts:5-8`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/playwright-runner/src/case-execution-policy.ts#L5).

### REQ-CAS-001.3

Separación explícita `TestCaseIdentity` (funcional) vs `TestCaseRevision` (ejecutable + adaptador).

- **Estado en develop.** Integrado · parcial. `LineagedCaseDocument` versiona el caso, pero mezcla pasos/localizadores concretos dentro del mismo registro sin entidad separada de adaptador de UI/variante visual.
- **Dependencias y alcance.** MEM 001.3. Reglas acreditadas y revisiones.
- **Aceptación candidata.** Cambiar un localizador crea revisión ejecutable conservando identidad funcional y expectativa.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L84) · [`packages/mcp/src/application/lineaged-case.ts:181-213`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/application/lineaged-case.ts#L181).

### REQ-CAS-001.4

Evaluador de aplicabilidad condicional sobre casos por `(env, tenant, role, config)`.

- **Estado en develop.** Integrado · parcial. Bloquea `missing_oracle` y distingue aplicabilidad en cobertura, pero no evalúa aplicabilidad automática de casos por `config_revision` (p. ej. `es_contable`).
- **Dependencias y alcance.** MEM 002.1, CAS 001.3. Reglas acreditadas y revisiones.
- **Aceptación candidata.** Sembrar variantes incompatibles y omitir de forma trazable el caso fuera de entorno, rol o revisión aplicable.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L85) · [`packages/mcp/src/handlers/test.handler.ts:375-376`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/handlers/test.handler.ts#L375) · [`packages/mcp/src/handlers/canonical-coverage-service.ts`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/handlers/canonical-coverage-service.ts).

- **Enmienda AV-01 9.** Evaluar applicable, not_applicable e indeterminate por entorno, tenant, rol y configuración. Una expectativa sin fuente de negocio acreditada queda INDETERMINATE. Probar cero PASS funcionales sin fuente y evaluar la aplicabilidad por separado. [adenda-final L80](https://github.com/Hyouka73/QAMCP/blob/c1d1680e6531a5132456665ca6851b6cbf5ff528/docs/qap-architecture/cierre-av-01/fuentes-recuperadas/adenda-final.md#L80).

### REQ-CAS-001.5

Deduplicación semántica/estructural y propagación automática de obsolescencia.

- **Estado en develop.** Integrado · parcial. Deduplica por `execution_key` en `service_test_cases`, pero no detecta duplicados semánticos ni marca obsolescencia automática ante drift de vista.
- **Dependencias y alcance.** CAS 001.3, MEM 003.2. Reglas acreditadas y revisiones.
- **Aceptación candidata.** Deduplicar equivalentes y marcar obsolescencia de dependientes al retirar una regla sin borrar intentos.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L86) · [`packages/mcp/src/application/lineaged-case.ts:261`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/application/lineaged-case.ts#L261) · [`packages/mcp/src/application/app-service-store.ts:514`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/application/app-service-store.ts#L514).

## Oráculos

Decisiones relacionadas para las filas de esta familia: D06, D07, D11, D12, D17, D21. Trazabilidad a G0/G3/G6, E1/E5/E8. Los complementos de alcance figuran en las [ampliaciones](#ampliaciones-de-la-línea-base).

### REQ-ORA-001.1

Taxonomía única de 6 veredictos (`PASS`, `FAIL`, `INDETERMINATE`, `BLOCKED`, `SKIPPED`, `ERROR`) en todo el sistema.

- **Estado en develop.** Integrado · incompatible con la garantía objetivo. Taxonomías inconsistentes entre capas (`passed/failed/partial/error/not_run` vs `PASS/FAIL/technical_error/human_accepted`); **`cli/commands/test.ts:206-230` reporta `not_run` como `passed` (`exitCode=0`)**.
- **Dependencias y alcance.** RUN 001.3, REP 001.1. Criterio, fuentes, alcance y testigo.
- **Aceptación candidata.** Publicar los seis estados para fixtures distinguibles y comprobar clasificación idéntica y mapeo CLI.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L92) · [`packages/cli/src/commands/test.ts:206-230`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/cli/src/commands/test.ts#L206) · [`packages/playwright-runner/src/runner.ts:204,312`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/playwright-runner/src/runner.ts#L204) · [`packages/mcp/src/application/app-service-store.ts:355`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/application/app-service-store.ts#L355).

### REQ-ORA-001.2

**Integración AV-04.** Contrato de diseño enmendado, pendiente de decisión y pruebas. La acreditación se evalúa por afirmación y modo de fallo. El testigo N1 puede demostrar comportamiento funcional no persistente cuando el alcance y la regla lo permiten. N2/N3 requieren propiedades causales, con independencia de la receta de adquisición. [Rúbrica y criterios](cierre-av-01/enmiendas-av04.md#3--ar-09--testigo-y-nivel-por-afirmación).

Evaluador de oráculos independiente que rechace señales Nivel 0/1 como prueba de persistencia.

- **Estado en develop.** Integrado · incompatible con la garantía objetivo. `navigate` ignora HTTP 4xx/5xx; `screenshot` atrapa errores y emite `passed`; `assert` sin tipo asume `visible`; no bloquea falsos `PASS` por respuesta superficial en mutaciones.
- **Dependencias y alcance.** ORA 001.3, DOC 001.4. Criterio, fuentes, alcance y testigo.
- **Aceptación candidata.** Con éxito HTTP y rollback, el testigo acreditado fuerza FAIL. La falta de testigo suficiente obliga a abstenerse de PASS funcional.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L93) · [`packages/playwright-runner/src/actions/navigate.ts:12-18`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/playwright-runner/src/actions/navigate.ts#L12) · [`packages/playwright-runner/src/runner.ts:1345-1388`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/playwright-runner/src/runner.ts#L1345) · [`packages/playwright-runner/src/actions/assert.ts:25`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/playwright-runner/src/actions/assert.ts#L25).

### REQ-ORA-001.3

Motor de testigos Nivel 1/2/3 (recarga en contexto limpio, consulta API/vista secundaria, conciliación).

- **Estado en develop.** Requerido · ausente. No existen niveles de independencia de testigos ni verificación post-recarga/lectura secundaria obligatoria para operaciones mutativas.
- **Dependencias y alcance.** SEG 001.2, ORA 001.7. Criterio, fuentes, alcance y testigo.
- **Aceptación candidata.** Contrastar recarga en contexto limpio, fuente secundaria y conciliación, registrando independencia, causalidad y dependencia compartida.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L94).

### REQ-ORA-001.4

Evaluador tipado de reglas de negocio, precisión monetaria (decimal exacto), tolerancias y conciliaciones.

- **Estado en develop.** Requerido · ausente. Solo soporta 8 aserciones DOM simples (`visible`, `contains`, `equals`, `count`, `attribute`, etc.); `RuleAssertType` declara `'text'` no soportado; cero soporte de cálculos decimales ni conciliaciones.
- **Dependencias y alcance.** DOC 001.4, ORA 001.3. Criterio, fuentes, alcance y testigo.
- **Aceptación candidata.** Detectar error de un centavo y de conciliación con reglas, decimal exacto y tolerancia versionada.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L95) · [`packages/playwright-runner/src/actions/assert.ts:24-180`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/playwright-runner/src/actions/assert.ts#L24) · [`packages/mcp/src/application/scoped-rule-resolver.ts:14`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/application/scoped-rule-resolver.ts#L14).

### REQ-ORA-001.5

Oráculo de no-mutación (snapshot de estado antes/después de intento denegado).

- **Estado en develop.** Requerido · ausente. No existe comprobación post-denegación de ausencia de efectos colaterales en estado subyacente.
- **Dependencias y alcance.** SEG 001.1, ORA 001.3. Criterio, fuentes, alcance y testigo.
- **Aceptación candidata.** Una operación denegada se contrasta con estado inicial y final. Una mutación oculta produce FAIL.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L96) · [`packages/knowledge/src/plan/rbac-generator.ts:309`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/knowledge/src/plan/rbac-generator.ts#L309) · [`packages/playwright-runner/src/case-execution-policy.ts:5-8`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/playwright-runner/src/case-execution-policy.ts#L5).

- **Contravalidación AV-02.** Autoridad y semántica acreditadas por destino, control de egress. DE-04 abierta. [AR-31](cierre-av-01/dictamen-av02.md#ar-31).

### REQ-ORA-001.6

Oráculo de convergencia asíncrona con ventana temporal y condición de estado final.

- **Estado en develop.** Requerido · ausente. Solo ofrece espera fija o `waitForSelector`; no distingue convergencia eventual, estado intermedio atascado ni timeout técnico en procesos asíncronos.
- **Dependencias y alcance.** ORA 001.3, CAM 001.3. Criterio, fuentes, alcance y testigo.
- **Aceptación candidata.** Probar convergencia, expiración y fallo de adquisición con ventana explícita y condiciones de estado verificables.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L97) · [`packages/playwright-runner/src/actions/wait-for.ts:7-22`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/playwright-runner/src/actions/wait-for.ts#L7).

### REQ-ORA-001.7

Metadato `witness_independence_level` obligatorio en cada evaluación (configurable según `DP-04`).

- **Estado en develop.** Requerido · ausente. No clasifica independencia del testigo ni etiqueta limitaciones cuando la única evidencia proviene del componente bajo prueba.
- **Dependencias y alcance.** MEM 002.1, DOC 001.4. Criterio, fuentes, alcance y testigo.
- **Aceptación candidata.** Persistir nivel, fuente, alcance y dependencia de testigo en cada evaluación, incluida evidencia conflictiva o insuficiente.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L98) · [`packages/mcp/src/handlers/execution-evidence.ts:51-67`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/handlers/execution-evidence.ts#L51).

## Runner y publicación

Decisiones relacionadas para las filas de esta familia: D03, D06, D07, D12, D15, D16, D18. Trazabilidad a G1/G3/G4, E1/E3/E5/E6. Los complementos de alcance figuran en las [ampliaciones](#ampliaciones-de-la-línea-base).

### REQ-RUN-001.1

Contexto limpio por caso por defecto; compartición explícita y trazada solo en flujos encadenados.

- **Estado en develop.** Integrado · incompatible con la garantía objetivo. **`RunnerLifecycle` está huérfano**; `runner.ts:463,542,587-936` reutiliza un **único `BrowserContext` y una única `Page`** para todos los casos del plan, filtrando cookies/storage/DOM.
- **Dependencias y alcance.** SEG 001.2, SEG 002.2. Planes congelados y permisos.
- **Aceptación candidata.** Probar independencia de cookies y storage entre casos. Solo continuidad autorizada conserva estado en un flujo con límites de identidad.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L104) · [`packages/playwright-runner/src/runner.ts:463,542,587-936`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/playwright-runner/src/runner.ts#L463) · [`packages/engine/src/lifecycle.ts:31-134`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/engine/src/lifecycle.ts#L31).

### REQ-RUN-001.2

Verificación de huella de snapshot integrada en el propio motor Runner.

- **Estado en develop.** Integrado · parcial. Ejecuta deterministamente sin IA; pero la verificación de integridad del snapshot vive solo en `TestHandler` (no en el runner ni en CLI).
- **Dependencias y alcance.** PLN 001.5, SEG 001.1. Planes congelados y permisos.
- **Aceptación candidata.** El runner rechaza snapshot alterado, vencido o de otro alcance antes de abrir el navegador o invocar el destino.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L105) · [`packages/playwright-runner/src/runner.ts:354`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/playwright-runner/src/runner.ts#L354) · [`packages/mcp/src/handlers/test.handler.ts:388-406`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/handlers/test.handler.ts#L388).

- **Contravalidación AV-02.** Nivel de confianza explícito y frontera independiente del HOST para acreditación fuerte. [AR-28](cierre-av-01/dictamen-av02.md#ar-28).

### REQ-RUN-001.3

Estructura tripartita obligatoria: `technical_status`, `functional_verdict`, `cleanup_status`. D12 añade disponibilidad e integridad de evidencia como estado independiente.

- **Estado en develop.** Requerido · ausente. No existe estado de limpieza separado; éxito técnico y funcional se mezclan en `ExecutionResult.result`.
- **Dependencias y alcance.** ORA 001.1, DAT 001.4. Planes congelados y permisos.
- **Aceptación candidata.** Un éxito técnico con rollback y limpieza fallida conserva veredicto, estados técnico y de limpieza y estado de evidencia separados.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L106) · [`packages/playwright-runner/src/runner.ts:1098-1170`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/playwright-runner/src/runner.ts#L1098).

### REQ-RUN-001.4

Política de reintento por idempotencia + protocolo obligatorio de reconciliación previa en mutaciones.

- **Estado en develop.** Integrado · incompatible con la garantía objetivo. Sin reintentos en Runner/MCP; CLI `--retries` reintenta ciegamente casos `failed` sin reconciliación de estado en mutaciones.
- **Dependencias y alcance.** ORA 001.3, DAT 001.2. Planes congelados y permisos.
- **Aceptación candidata.** Cortar después de enviar la mutación y antes de recibir respuesta. Reconciliar antes del reintento y evitar duplicación.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L107) · [`packages/cli/src/commands/test.ts:182-204`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/cli/src/commands/test.ts#L182) · [`packages/playwright-runner/src/runner.ts`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/playwright-runner/src/runner.ts).

### REQ-RUN-001.5

Cancelación activa (`AbortController`) cableada a revocación + pool acotado de workers paralelos aislados.

- **Estado en develop.** Integrado · parcial. Ejecución estrictamente secuencial; `TestHandler` no propaga `AbortSignal` al navegador cuando se revoca un permiso en vuelo; `FlowOrchestrator` ignora `execution_timeout_ms`.
- **Dependencias y alcance.** SEG 001.3, CAM 001.3. Planes congelados y permisos.
- **Aceptación candidata.** Revocar un permiso en vuelo, detener el trabajo afectado y respetar límites y conflictos de recursos sin detener trabajo independiente.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L108) · [`packages/mcp/src/handlers/test.handler.ts:880-913`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/handlers/test.handler.ts#L880) · [`packages/engine/src/flow-orchestrator.ts:378`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/engine/src/flow-orchestrator.ts#L378).

- **Enmienda AV-01 2.** RNF-02. Alternar entre tres, cuatro o más aplicaciones sin navegadores abiertos en reposo. Verificar liberación de procesos, locks y memoria al terminar cada tarea. Medir reapertura y alternancia con presupuestos configurables de tiempo, páginas y memoria. [especificacion-entrega-2 L391](https://github.com/Hyouka73/QAMCP/blob/c1d1680e6531a5132456665ca6851b6cbf5ff528/docs/qap-architecture/cierre-av-01/fuentes-recuperadas/especificacion-entrega-2.md#L391).

### REQ-RUN-001.6

Unificar publicación atómica sobre el almacén único eliminando DDL duplicados.

- **Estado en develop.** Integrado · parcial. Publicación provisional atómica y recuperación ante corte implementadas en MCP; pero DDL duplicado en `evidence-artifacts.ts:881-908` omite 3 columnas de `QapDatabase`.
- **Dependencias y alcance.** MEM 003.6, REP 001.1. Planes congelados y permisos.
- **Aceptación candidata.** Cortar durante publicación y recuperación. Conservar cada intento confirmado una vez y rechazar media ajena o alterada.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L109) · [`packages/playwright-runner/src/provisional-execution.ts:175-534`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/playwright-runner/src/provisional-execution.ts#L175) · [`packages/playwright-runner/src/evidence-artifacts.ts:881-908`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/playwright-runner/src/evidence-artifacts.ts#L881).

- **Contravalidación AV-02.** Exclusión previa y custodia de todas las escrituras desde el primer byte. Cobertura y selección de implementación pendientes de prueba. [AR-27](cierre-av-01/fe-correcciones-ar27.md).

## Provisión y limpieza

Decisiones relacionadas para las filas de esta familia: D06, D07, D08, D09, D12. Trazabilidad a G0/G3/G4, E1/E4/E5. Los complementos de alcance figuran en las [ampliaciones](#ampliaciones-de-la-línea-base).

### REQ-DAT-001.1

Subsistema `TestDataManager` con sintetizadores, etiquetas de ejecución, caducidad y filtro anti-PII.

- **Estado en develop.** Requerido · ausente. No existe generador/gestor de datasets sintéticos con ámbito, procedencia, caducidad ni protección anti-PII de producción.
- **Dependencias y alcance.** SEG 001.1, MEM 002.1. Política, datos sintéticos y testigos.
- **Aceptación candidata.** Generar datos sintéticos etiquetados por intento con caducidad y verificar que excluyen PII no autorizada.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L115) · [`packages/playwright-runner/src/context/interpolator.ts:3-52`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/playwright-runner/src/context/interpolator.ts#L3).

### REQ-DAT-001.2

Ejecutor de `DataPlan` con creación topológica y limpieza inversa idempotente. Incorporar descripción y ejecución autorizada de operaciones mediante UTCP/OpenAPI por el mismo puerto.

- **Estado en develop.** Requerido · ausente. No existe preparación ni limpieza por grafo DAG de entidades del AUT (solo backup de sesiones locales en `FlowOrchestrator`).
- **Dependencias y alcance.** DAT 001.1, RUN 001.4, INT 001.4. Política, datos sintéticos y testigos.
- **Aceptación candidata.** Ejecutar un DAG y su limpieza inversa usando UI y conector autorizado según plan. Reconciliar efecto e idempotencia con procedencia.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L116) · [`packages/engine/src/flow-orchestrator.ts:391-393`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/engine/src/flow-orchestrator.ts#L391).

- **Enmienda AV-01 8.** Limpiar en orden inverso solo entidades creadas por el dataset de esa ejecución. Repetir dos veces sin fallo ni afectación de registros ajenos. Una compensación explícitamente autorizada, acreditada y reconciliada es operación distinta. Conservar el aislamiento desechable autorizado cuando proceda. [adenda-final L111](https://github.com/Hyouka73/QAMCP/blob/c1d1680e6531a5132456665ca6851b6cbf5ff528/docs/qap-architecture/cierre-av-01/fuentes-recuperadas/adenda-final.md#L111) · [especificacion-entrega-1 L326](https://github.com/Hyouka73/QAMCP/blob/c1d1680e6531a5132456665ca6851b6cbf5ff528/docs/qap-architecture/cierre-av-01/fuentes-recuperadas/especificacion-entrega-1.md#L326).

### REQ-DAT-001.3

Motor de política por entorno que bloquee producción/no-autorizados (`SKIPPED_BY_POLICY`) y habilite mutaciones controladas en staging/fixtures autorizados.

- **Estado en develop.** Integrado · incompatible con la garantía objetivo. En MCP bloquea todas las mutaciones sin permitir siquiera entornos expresamente autorizados; en CLI permite todas sin política ni bloqueo.
- **Dependencias y alcance.** SEG 001.1–001.3. Política, datos sintéticos y testigos.
- **Aceptación candidata.** Bloquear toda escritura en producción y fuera de QA autorizado, incluso si el método parece de lectura. Dejar continuar lecturas acreditadas.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L117) · [`packages/mcp/src/handlers/test.handler.ts:45,488-496`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/handlers/test.handler.ts#L45) · [`packages/auth/src/scoped-browser.ts:7-31`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/auth/src/scoped-browser.ts#L7).

- **Enmienda AV-01 1.** D-002. QAP detecta, reproduce, diagnostica y documenta defectos. Jamás modifica código fuente del AUT ni infraestructura o configuración productiva. Verificar cero modificaciones de esos recursos. [especificacion-entrega-1 L25](https://github.com/Hyouka73/QAMCP/blob/c1d1680e6531a5132456665ca6851b6cbf5ff528/docs/qap-architecture/cierre-av-01/fuentes-recuperadas/especificacion-entrega-1.md#L25).

- **Contravalidación AV-02.** Autoridad y semántica acreditadas por destino, control de egress. DE-04 abierta. [AR-31](cierre-av-01/dictamen-av02.md#ar-31).

### REQ-DAT-001.4

Verificador post-limpieza y estrategias configurables (`delete`, `compensate`, `confine_tenant`, según `DP-05`).

- **Estado en develop.** Requerido · ausente. No existe verificación de efectos residuales ni compensación/confinamiento para registros inmutables.
- **Dependencias y alcance.** DAT 001.2, ORA 001.3. Política, datos sintéticos y testigos.
- **Aceptación candidata.** Probar eliminación, compensación y confinamiento autorizados y publicar verificación posterior y limpieza pendiente.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L118).

## Campañas

Decisiones relacionadas para las filas de esta familia: D03, D04, D05, D06, D13, D16. Trazabilidad a G1/G4, E3/E4. Los complementos de alcance figuran en las [ampliaciones](#ampliaciones-de-la-línea-base).

### REQ-CAM-001.1

Orquestador de campaña autónomo que encadene A→B→C tras autorización inicial.

- **Estado en develop.** Integrado · incompatible con la garantía objetivo. `qap_start` solo inicia inventario inicial y devuelve `siguiente_accion`; depende del LLM en cada turno y está frenado por compuertas humanas de `lifecycle.ts` y `test.handler.ts`.
- **Dependencias y alcance.** CAS 001.1, PLN 001.1, RUN 001.6. Persistencia, planificación y ejecutor.
- **Aceptación candidata.** Desde lenguaje natural y autorización inicial recorrer Discovery, diseño, datos, ejecución, reporte, regresión y aprendizaje.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L124) · [`packages/mcp/src/server.ts:1556-1809`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/server.ts#L1556) · [`packages/mcp/src/guidance.ts:208-786`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/guidance.ts#L208).

### REQ-CAM-001.2

Motor de tareas con grafo de estados que aísle bloqueos locales sin detener ramas independientes.

- **Estado en develop.** Integrado · parcial. Un bloqueo en un caso o falta de regla bloquea frecuentemente todo el lote o impide avanzar la fase en `lifecycle.ts`.
- **Dependencias y alcance.** MEM 002.3, PLN 001.4. Persistencia, planificación y ejecutor.
- **Aceptación candidata.** Bloquear una rama por prerrequisito o permiso y comprobar que sus hermanas independientes continúan con bitácora.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L125) · [`packages/engine/src/lifecycle.ts:487-548`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/engine/src/lifecycle.ts#L487) · [`packages/mcp/src/handlers/test.handler.ts:485-496`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/handlers/test.handler.ts#L485).

### REQ-CAM-001.3

Controlador central de presupuestos de campaña con cierre `COMPLETADA_PARCIAL`.

- **Estado en develop.** Integrado · parcial. Solo existen presupuestos locales en el crawler; no hay presupuestos globales de campaña (tiempo total, ejecuciones, llamadas de inferencia).
- **Dependencias y alcance.** MEM 002.3, SEG 001.1. Persistencia, planificación y ejecutor.
- **Aceptación candidata.** Al agotar un presupuesto declarar COMPLETADA_PARCIAL y persistir el punto reanudable con resultados y brechas.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L126) · [`packages/playwright-adapter/src/crawler/service.ts:18-21`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/playwright-adapter/src/crawler/service.ts#L18).

### REQ-CAM-001.4

Runtime soberano de campaña desacoplado de la conexión del cliente MCP.

- **Estado en develop.** Requerido · ausente. Recupera publicaciones pendientes tras reinicio, pero no continúa tareas deterministas al desconectarse el host ni conserva cola de razonamiento.
- **Dependencias y alcance.** MEM 002.3, IA 001.4. Persistencia, planificación y ejecutor.
- **Aceptación candidata.** Terminar árbol del host y después el ejecutor. Preservar trabajo determinista, reclamar lease y evitar doble escritor.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L127) · [`packages/mcp/src/application/application-service.ts:4201-4330`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/application/application-service.ts#L4201).

### REQ-CAM-001.5

Modos de intención como política de prioridad sobre un estado de campaña continuo.

- **Estado en develop.** Integrado · parcial. El campo `mode` existe en `app-service.sqlite`, pero no hay transición operativa fluida ni integración con los estados `ONBOARDING/SCOPING/WORKING/WRAP_UP`.
- **Dependencias y alcance.** CAM 001.2, MEM 002.4. Persistencia, planificación y ejecutor.
- **Aceptación candidata.** Cambiar entre exploración, regresión e investigación de defecto conservando identidad, revisiones y estado de campaña.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L128) · [`packages/shared/src/domain/application-contracts.ts:172-185`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/shared/src/domain/application-contracts.ts#L172).

## Reportes QAP, evidencia y defectos

Decisiones relacionadas para las filas de esta familia: D05, D11, D12, D18, D19, D20, D21. Trazabilidad a G1/G3/G5/G6, E2/E5/E6/E7/E8. Los complementos de alcance figuran en las [ampliaciones](#ampliaciones-de-la-línea-base).

### REQ-REP-001.1

Servicio único de evidencias e integridad consumido por MCP y CLI.

- **Estado en develop.** Integrado · parcial. Captura screenshots, video, `trace.zip` sanitizado y `result_digest` SHA-256 en MCP; sin embargo `evidence-artifacts.ts` duplica DDL incompleto y CLI omite verificación de integridad.
- **Dependencias y alcance.** RUN 001.6, SEG 002.1. Intentos acreditados, custodia y manifiestos.
- **Aceptación candidata.** Ambos canales publican manifiesto verificado, disponibilidad separada y evidencia saneada correlacionada por intento, paso y rol.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L134) · [`packages/playwright-runner/src/evidence-artifacts.ts:420-990`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/playwright-runner/src/evidence-artifacts.ts#L420) · [`packages/mcp/src/handlers/report.handler.ts:175-190`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/handlers/report.handler.ts#L175).

- **Contravalidación AV-02.** Visor autenticado y de solo lectura, apertura confinada y reproducción revocable. [AR-24](cierre-av-01/dictamen-av02.md#ar-24).

### REQ-REP-001.2

Repositorio único de reportes, comparativas entre ejecuciones e historial unificado.

- **Estado en develop.** Integrado · parcial. Generadores HTML/JSON/JUnit/MD existen, pero `regression-detector.ts` solo corre en CLI, `graph-builder.ts` lee campos inexistentes (`execData.status`), y no existe consulta unificada de historial (`qap_history`).
- **Dependencias y alcance.** REP 001.1, MEM 003.5. Intentos acreditados, custodia y manifiestos.
- **Aceptación candidata.** Comparar dos ejecuciones tras purgar media y abrir export offline con enlaces, estados y hashes preservados.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L135) · [`packages/reporter/src/manifest/regression-detector.ts:67`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/reporter/src/manifest/regression-detector.ts#L67) · [`packages/reporter/src/graph/graph-builder.ts:247,316`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/reporter/src/graph/graph-builder.ts#L247).

- **Contravalidación AV-02.** Visor autenticado y de solo lectura, apertura confinada y reproducción revocable. [AR-24](cierre-av-01/dictamen-av02.md#ar-24).

### REQ-REP-001.3

Subsistema `DefectManager` con taxonomía D-014 (`indeterminate`), deduplicación por firma y paquete reproducible.

- **Estado en develop.** Requerido · ausente. **No existe ninguna entidad, tabla ni gestor de defectos** en todo el repositorio; `classifyError` usa regex simples con fallback ciego a `assertion_failed`.
- **Dependencias y alcance.** REP 001.1, ORA 001.1. Intentos acreditados, custodia y manifiestos.
- **Aceptación candidata.** Deduplicar una firma repetida sin unir defectos de alcances distintos y producir paquete de reproducción acreditado.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L136) · [`packages/reporter/src/taxonomy.ts:26-62`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/reporter/src/taxonomy.ts#L26) · [`packages/playwright-runner/src/runner.ts:50-72`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/playwright-runner/src/runner.ts#L50).

- **Enmienda AV-01 6.** Conservar product_bug, environment_error, automation_error, data_error, auth_expired, flaky e indeterminate. Un HTTP 500 aislado no acredita product_bug. Probar que la evidencia causal ambigua produce indeterminate, preservando deduplicación y paquete reproducible. [adenda-final L131](https://github.com/Hyouka73/QAMCP/blob/c1d1680e6531a5132456665ca6851b6cbf5ff528/docs/qap-architecture/cierre-av-01/fuentes-recuperadas/adenda-final.md#L131) · [especificacion-entrega-1 L74](https://github.com/Hyouka73/QAMCP/blob/c1d1680e6531a5132456665ca6851b6cbf5ff528/docs/qap-architecture/cierre-av-01/fuentes-recuperadas/especificacion-entrega-1.md#L74).

### REQ-REP-001.4

Máquina de estados de defecto integrada con modo `INVESTIGAR_BUG` y comparativa de intentos.

- **Estado en develop.** Requerido · ausente. No existe flujo formal de reproducción (`REPRODUCIDO`/`NO_REPRODUCIDO`/`BLOQUEADO`) ni seguimiento de verificación de corrección (`retest`).
- **Dependencias y alcance.** REP 001.3, REG 001.1. Intentos acreditados, custodia y manifiestos.
- **Aceptación candidata.** Reproducir, no reproducir, bloquear y verificar corrección en intentos trazables conservando el fallo original.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L137).

## Regresión

Decisiones relacionadas para las filas de esta familia: D03, D05, D12, D21. Trazabilidad a G5/G6, E5/E8. Los complementos de alcance figuran en las [ampliaciones](#ampliaciones-de-la-línea-base).

### REQ-REG-001.1

Motor de detección de drift multi-señal + selector de suite de regresión por impacto y riesgo.

- **Estado en develop.** Integrado · parcial. `GitAdapter` solo corre en CLI (`test.ts:3`) con `execSync` inseguro; `ImpactAnalyzer` está desconectado de MCP/CLI; sin detección automática de drift DOM/API/configuración.
- **Dependencias y alcance.** MEM 003.2, PLN 001.3. Historial, versiones y grafo de conocimiento.
- **Aceptación candidata.** Sembrar cambios DOM, API y configuración. Seleccionar casos afectados según dependencia y riesgo con razones.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L143) · [`packages/git-adapter/src/git-adapter.ts:26-84`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/git-adapter/src/git-adapter.ts#L26) · [`packages/knowledge/src/impact/impact-analyzer.ts`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/knowledge/src/impact/impact-analyzer.ts).

- **Contravalidación AV-02.** Git sin shell y señal no disponible diferenciada de ausencia de cambios. [AR-40](cierre-av-01/dictamen-av02.md#ar-40).

### REQ-REG-001.2

Analizador estadístico de oscilación `PASS`/`FAIL` sobre intentos del mismo snapshot/versión.

- **Estado en develop.** Requerido · ausente. No existe detección ni registro de `flakiness` en historial.
- **Dependencias y alcance.** MEM 003.3, REP 001.2. Historial, versiones y grafo de conocimiento.
- **Aceptación candidata.** Alternar PASS y FAIL sobre el mismo snapshot y versión y conservar series y criterio de inestabilidad.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L144).

### REQ-REG-001.3

Flujo de reparación acotada que crea `TestCaseRevision N+1` manteniendo inmutable la expectativa y el `FAIL` original.

- **Estado en develop.** Requerido · ausente. No existe propuesta controlada de nueva revisión de adaptador/localizador ante cambios de UI.
- **Dependencias y alcance.** CAS 001.3, REG 001.1. Historial, versiones y grafo de conocimiento.
- **Aceptación candidata.** Corregir un localizador crea revisión posterior con misma expectativa y preserva el intento original.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L145).

## Política, secretos y sesiones

Decisiones relacionadas para las filas de esta familia: D02, D07, D09, D12, D18, D20. Trazabilidad a G0/G1/G3/G5, E2/E4/E5/E6. Los complementos de alcance figuran en las [ampliaciones](#ampliaciones-de-la-línea-base).

### REQ-SEG-001.1

Motor único de políticas deny-by-default aplicado a MCP, CLI y servidores auxiliares. D07 permite lecturas de producción solo con acreditación y extiende denegación por defecto a visor y conectores.

- **Estado en develop.** Integrado · parcial. Implementado en MCP con doble persistencia (SQLite + archivos JSON) y auto-aprobación silenciosa en `silentBoundScope`; **completamente ausente en CLI**; el visor y el adaptador Git presentan brechas de confinamiento y validación.
- **Dependencias y alcance.** MEM 002.1. Autoridad efectiva y alcance.
- **Aceptación candidata.** Aplicar idéntica denegación por defecto en MCP, CLI y auxiliares. Un permiso de lectura no habilita efectos.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L151) · [`packages/mcp/src/application/permission-authority.ts:84`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/application/permission-authority.ts#L84) · [`packages/reporter/src/server/server.ts:277`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/reporter/src/server/server.ts#L277) · [`packages/git-adapter/src/git-adapter.ts:26`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/git-adapter/src/git-adapter.ts#L26).

- **Enmienda AV-01 1.** D-002. QAP detecta, reproduce, diagnostica y documenta defectos. Jamás modifica código fuente del AUT ni infraestructura o configuración productiva. Verificar cero modificaciones de esos recursos. [especificacion-entrega-1 L25](https://github.com/Hyouka73/QAMCP/blob/c1d1680e6531a5132456665ca6851b6cbf5ff528/docs/qap-architecture/cierre-av-01/fuentes-recuperadas/especificacion-entrega-1.md#L25).

- **Enmienda AV-01 3.** Separar ocho capacidades autorizables: acceso a workspace, observación de destinos/orígenes, autenticación/uso de perfiles, lectura documental, pruebas de solo lectura, escritura/mutación, creación/limpieza de datos sintéticos y eliminación de recursos propios de QAP. Verificar independencia entre las ocho y los cuatro permisos multimedia de D18. [especificacion-entrega-1 L368](https://github.com/Hyouka73/QAMCP/blob/c1d1680e6531a5132456665ca6851b6cbf5ff528/docs/qap-architecture/cierre-av-01/fuentes-recuperadas/especificacion-entrega-1.md#L368).

### REQ-SEG-001.2

Invariante de alcance en el motor central imposible de alterar desde prompts, DOM o redirecciones.

- **Estado en develop.** Integrado · parcial. Aplica verificación de origen y política en MCP; sin protección equivalente en CLI ni `PlaywrightAdapter`.
- **Dependencias y alcance.** MEM 002.1, SEG 001.1. Autoridad efectiva y alcance.
- **Aceptación candidata.** Al cambiar origen, identidad o tenant durante una operación, revalidar y bloquear la transición fuera de alcance.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L152) · [`packages/mcp/src/handlers/discovery.handler.ts:158-394`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/handlers/discovery.handler.ts#L158) · [`packages/auth/src/scoped-browser.ts:4-34`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/auth/src/scoped-browser.ts#L4).

- **Precisión AR-04.** Aplicar el [sobre de contexto](#req-mem-0021) y verificar aislamiento por perfil efectivo y replay regional.

### REQ-SEG-001.3

Bus de eventos de revocación conectado a `AbortController` de Discovery y Runner activos.

- **Estado en develop.** Integrado · parcial. Revoca en SQLite y bloquea la siguiente llamada o la publicación final, pero **no cancela activamente un navegador/ejecución en vuelo**.
- **Dependencias y alcance.** SEG 001.1, RUN 001.5. Autoridad efectiva y alcance.
- **Aceptación candidata.** Revocar desde otro proceso y probar cancelación y persistencia de la revocación al reconectar.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L153) · [`packages/mcp/src/application/permission-authority.ts`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/application/permission-authority.ts) · [`packages/mcp/src/handlers/test.handler.ts:880-913`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/handlers/test.handler.ts#L880).

- **Enmienda AV-01 7.** Revocación durable y auditable en nuevas invocaciones y en vuelo del alcance concedido. Probar que no afecta proyectos, entornos, tenants ni perfiles ajenos al grant. Toda reconciliación o compensación requiere autoridad y evidencia propias. [adenda-final L148](https://github.com/Hyouka73/QAMCP/blob/c1d1680e6531a5132456665ca6851b6cbf5ff528/docs/qap-architecture/cierre-av-01/fuentes-recuperadas/adenda-final.md#L148) · [especificacion-entrega-1 L368](https://github.com/Hyouka73/QAMCP/blob/c1d1680e6531a5132456665ca6851b6cbf5ff528/docs/qap-architecture/cierre-av-01/fuentes-recuperadas/especificacion-entrega-1.md#L368).

- **Contravalidación AV-02.** Fallo cerrado, revocación durable y reconciliación de efectos previos. [AR-47](cierre-av-01/dictamen-av02.md#ar-47).

### REQ-SEG-002.1

Canal de captura de secretos multiplataforma 100 % fuera del LLM/chat; eliminación de bypass (sujeto a `DP-03`). D20 resuelve la prohibición de credenciales en MCP, chat y prompts. El mecanismo fuera de banda sigue abierto.

- **Estado en develop.** Integrado · incompatible con la garantía objetivo. **Contradicción crítica:** `host-composition.ts:390` activa `silentBoundScope: true` por defecto, habilitando `allowScopedCredentials` (`server.ts:744-756`) que expone contraseñas en texto plano en argumentos MCP; además diálogos GUI solo existen en Windows (`powershell.exe`).
- **Dependencias y alcance.** MEM 002.5, INT 001.2. Autoridad efectiva y alcance.
- **Aceptación candidata.** Dar de alta una referencia opaca en las tres plataformas y CI sin TTY. Verificar ausencia de canarios en canales y artefactos.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L154) · [`packages/mcp/src/host-composition.ts:390`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/host-composition.ts#L390) · [`packages/mcp/src/server.ts:378-380,744-756`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/server.ts#L378) · [`packages/auth/src/portable-vault.ts`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/auth/src/portable-vault.ts).

- **Contravalidación AV-02.** Alta fuera de banda y KEK persistente sujeto a EXP-07. [AR-07](cierre-av-01/dictamen-av02.md#ar-07).

### REQ-SEG-002.2

Prohibición uniforme de degradación a anónimo cuando el alcance requiere sesión autenticada.

- **Estado en develop.** Integrado · parcial. MCP bloquea sin degradar a anónimo (`downgraded_to_anonymous: false`), pero `runner.ts:338` puede degradar a anónimo con aviso si no se pasó `options.profile` explícito.
- **Dependencias y alcance.** SEG 001.2–001.3, SEG 002.1. Autoridad efectiva y alcance.
- **Aceptación candidata.** Perder la sesión requerida durante Discovery o ejecución y bloquear el intento de continuar bajo otra identidad.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L155) · [`packages/playwright-runner/src/runner.ts:335-342`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/playwright-runner/src/runner.ts#L335) · [`packages/auth/src/session-store.ts`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/auth/src/session-store.ts).

- **Contravalidación AV-02.** Fallo cerrado, revocación durable y reconciliación de efectos previos. [AR-47](cierre-av-01/dictamen-av02.md#ar-47).

## Interfaces y extensibilidad

Decisiones relacionadas para las filas de esta familia: D02, D03, D08, D10, D13, D14, D20. Trazabilidad a G0/G1/G5/G6, E1/E2/E3/E7/E8. Los complementos de alcance figuran en las [ampliaciones](#ampliaciones-de-la-línea-base).

### REQ-INT-001.1

Núcleo de aplicación único (`@qap/core`) con MCP, CLI y CI como adaptadores delgados.

- **Estado en develop.** Integrado · incompatible con la garantía objetivo. **Divergencia estructural severa:** CLI y MCP usan distintos motores de Discovery, Planner, Políticas, Persistencia, Reportes y Poda; `qap test` emite falsos `PASS`; `qap runner` falla contra `QAPEngine`.
- **Dependencias y alcance.** SEG 001.1, IA 001.5. Núcleo, contratos y empaquetado.
- **Aceptación candidata.** Desde el mismo snapshot, comparar permisos, memoria, ejecución, veredictos, reporte y códigos de salida de ambos adaptadores.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L161) · [`packages/cli/src/commands`](https://github.com/Hyouka73/QAMCP/tree/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/cli/src/commands) · [`packages/mcp/src/server.ts`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/server.ts).

### REQ-INT-001.2

Empaquetado limpio multiplataforma (`npx`-first), cero dependencias exclusivas de `win32` en ruta ordinaria y verificación estricta `tsc` en CI.

- **Estado en develop.** Integrado · incompatible con la garantía objetivo. Diálogos interactivos dependen de Windows PowerShell; `host-composition.ts:413` deshabilita manifiesto; 142 errores `tsc` ocultos por `tsup`; `AGENTS.md` contradice requisito de Node 22+ (`node:sqlite`).
- **Dependencias y alcance.** SEG 002.1, RUN 001.1. Núcleo, contratos y empaquetado.
- **Aceptación candidata.** Instalar en Windows, macOS y Linux desde paquete limpio y cumplir diagnóstico, navegador bajo demanda y compuerta de tipos.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L162) · [`packages/mcp/src/discovery-authorizer.ts:324`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/discovery-authorizer.ts#L324) · [`packages/mcp/src/host-composition.ts:413`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/host-composition.ts#L413) · [`.codex-r2-concurrency-evidence/typescript-r3-final-diff.json`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/.codex-r2-concurrency-evidence/typescript-r3-final-diff.json).

### REQ-INT-001.3

Abstracción de almacenamiento/colas que permita despliegue self-hosted sin cambiar la lógica del núcleo.

- **Estado en develop.** Requerido · ausente. Solo existe operación local acoplada a archivos SQLite en disco; sin modo self-hosted ni servicio concurrente multiusuario.
- **Dependencias y alcance.** MEM 003.6, CAM 001.4. Núcleo, contratos y empaquetado.
- **Aceptación candidata.** Cambiar el adaptador en pruebas de contrato sin modificar lógica de dominio. La modalidad compartida completa pertenece a fase posterior.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L163).

### REQ-INT-001.4

Sistema formal de registro de conectores/plugins opt-in (interfaz, documentos, bóveda, extensiones de dominio). Incluir el contrato común para conectores UTCP/OpenAPI, además de adaptadores documentales y de bóveda.

- **Estado en develop.** Integrado · parcial. Declara puertos teóricos (`IReporter`, `IActionTargetSearch`), pero `@qap/mcp` acopla clases concretas (`AppServiceSqliteStore`, `BlackBoxCrawler`, `PlaywrightRunner`); `@playwright/mcp` figura en `package.json` sin uso.
- **Dependencias y alcance.** SEG 001.1, DAT 001.2, DOC 001.1. Núcleo, contratos y empaquetado.
- **Aceptación candidata.** Registrar y retirar conectores versionados sin doble autoridad. Probar OpenAPI/UTCP autorizados y rechazo de conectores incompatibles.
- **Procedencia.** [Fila original de Neon](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/docs/qap-architecture/gemini-neon-etapa-3.md#L164) · [`packages/engine/src/ports.ts`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/engine/src/ports.ts) · [`packages/mcp/src/application/application-service.ts`](https://github.com/Hyouka73/QAMCP/blob/77a9c4f3769784df40a17d5d19bd7c83a45f0c89/packages/mcp/src/application/application-service.ts).

## Cinco requisitos nuevos en la línea base

### REQ-XINST-001

Consultar otra instancia autorizada solo con identidad distinta y operaciones de lectura acreditadas en destino. Preservar procedencia, tenant, revisión y finalidad. Excluir sesiones, secretos y transferencias masivas de información sensible.

- **Decisiones y alcance.** D07, D09, D20. Lanzamiento. Destinos concretos por autorización.
- **Dependencias.** SEG 001.1–001.3, MEM 002.1, DAT 001.2.
- **Estado en develop.** Ausente como contrato integrado. La autorización de origen es un antecedente.
- **Aceptación candidata.** Fixture con identidades separadas y testigo de cero cambios. Las operaciones sin garantía, incluidas las que aparentan lectura, se bloquean. Verificar redirección, alcance y procedencia.
- **Procedencia y trazabilidad.** [Evaluación independiente, sección B](insumos/evaluacion-independiente-requisitos.md#b-matriz-consolidada-de-requisitos) y [acta del propietario](acta-decisiones.md). G0/G2/G3, E2/E4/E5/E8, EXP-05.

- **Contravalidación AV-02.** Autoridad y semántica acreditadas por destino, control de egress. DE-04 abierta. [AR-31](cierre-av-01/dictamen-av02.md#ar-31).

### REQ-QA-001

Probar internacionalización mediante idioma, locale, zona horaria, moneda y variante congelados. HOST interpreta instrucciones y conclusiones y propone cambios. El runtime persiste preferencias y repite verificaciones de claves, textos, truncamiento, fechas y montos sin inferencia. Mantener códigos de resultado independientes del idioma.

- **Decisiones y alcance.** D03, D10, D11, D12, D17, D21. Lanzamiento. Corpus de locales por definir y extensible.
- **Dependencias.** DOC 001.1, IA 001.1–001.2, ORA 001.4, PLN 001.5.
- **Estado en develop.** Sin garantía integrada acreditada.
- **Aceptación candidata.** Cambiar idioma en dos locales del corpus y detectar traducción ausente y truncamiento con oráculo. Distinguir representaciones equivalentes de divergencias de valor. Repetir el snapshot sin inferencia.
- **Procedencia y trazabilidad.** [Evaluación independiente, sección B](insumos/evaluacion-independiente-requisitos.md#b-matriz-consolidada-de-requisitos) y [acta del propietario](acta-decisiones.md). G2/G3/G4/G6, E4/E5/E8, EXP-06.

- **Precisión AR-04.** Aplicar el [sobre de contexto](#req-mem-0021) y verificar aislamiento por perfil efectivo y replay regional.

### REQ-QA-002

Verificar el contrato de una API autorizada por observación de tráfico y llamada directa. Fijar versión, esquemas de solicitud y respuesta, código y tipo de contenido. Separar conformidad del contrato y verificación de efectos.

- **Decisiones y alcance.** D07, D08, D12, D21. Capacidad de lanzamiento. Uso por caso opcional y autorizado.
- **Dependencias.** DAT 001.2, INT 001.4, ORA 001.2–001.3.
- **Estado en develop.** Ausente como verificación versionada integrada. Reconocimiento HTTP parcial.
- **Aceptación candidata.** Comparar control sano y respuesta incompatible. Rastrear operación y revisión del esquema y exigir testigo acreditado para efectos.
- **Procedencia y trazabilidad.** [Evaluación independiente, sección B](insumos/evaluacion-independiente-requisitos.md#b-matriz-consolidada-de-requisitos) y [acta del propietario](acta-decisiones.md). G2/G3/G6, E4/E5/E8, EXP-05.

### REQ-QA-003

Comprobar accesibilidad en estados críticos con motor y reglas versionados. Registrar huella, estado, cobertura, exclusiones y comprobaciones manuales pendientes.

- **Decisiones y alcance.** D13, D21. Línea base. Cobertura y prioridad de lanzamiento pendientes de ratificación.
- **Dependencias.** CAS 001.2, REP 001.1–001.2, RUN 001.1.
- **Estado en develop.** No se acreditó recorrido canónico.
- **Aceptación candidata.** Detectar un defecto sembrado con huella repetible y consignar comprobaciones de teclado y manuales fuera de la cobertura automatizada. Axe es candidato.
- **Procedencia y trazabilidad.** [Evaluación independiente, sección B](insumos/evaluacion-independiente-requisitos.md#b-matriz-consolidada-de-requisitos) y [acta del propietario](acta-decisiones.md). G3/G5/G6, E5/E6/E8, EXP-06.

### REQ-AGT-001

Adoptar QAP con instalación idempotente y un registro MCP por host, indicaciones acotadas y opción CLI. Orientar la primera acción QA hacia QAP y reservar la acreditación al runner canónico. Hooks informativos opcionales si se validan.

- **Decisiones y alcance.** D04, D13, D14, D21. Hosts representativos de lanzamiento. Umbral de enrutamiento pendiente.
- **Dependencias.** IA 001.1, IA 001.5, MEM 002.4, INT 001.1–001.2.
- **Estado en develop.** Entrada MCP/CLI integrada de forma parcial. Adopción y paridad multihost sin certificar.
- **Aceptación candidata.** En sesiones nuevas de Antigravity, Codex, Claude Code, Gemini CLI y otros clientes representativos, medir enrutamiento, desvíos y tokens. Las suites unitarias legítimas siguen ejecutables.
- **Procedencia y trazabilidad.** [Evaluación independiente, sección B](insumos/evaluacion-independiente-requisitos.md#b-matriz-consolidada-de-requisitos) y [acta del propietario](acta-decisiones.md). G0/G1/G4/G5/G6, E1/E3/E7/E8, EXP-01.

## Ampliaciones de la línea base

Los criterios heredados de cada ID siguen aplicando. Las ampliaciones heredan su estado de producto, con la garantía ampliada pendiente de acreditación. Fuentes: [evaluación independiente B](insumos/evaluacion-independiente-requisitos.md#b-matriz-consolidada-de-requisitos), [investigación E](insumos/gemini-neon-investigacion.md#e-nuevos-requisitos-funcionales-y-técnicos-incluyendo-investigación-5), [M1–M5](plan-maestro.md#reportes-y-evidencia-multimedia) y [D01–D21](acta-decisiones.md).

| Etiqueta conservada | IDs ampliados | Decisiones | Alcance y dependencia | Aceptación candidata | Trazabilidad |
|---|---|---|---|---|---|
| REQ-AGT-002 | MEM-002.4, IA-001.1 | D03, D05, D13 | Resumen de contexto limitado a la campaña, cobertura, permisos y próxima acción. Consultar bajo alcance resuelto y devolver las omisiones. | Reanudar desde chat y host nuevos en una consulta autorizada y medir tokens por tokenizer. Los valores de 150/200 tokens siguen como hipótesis. | E3, EXP-01 |
| REQ-ONB-001 | INT-001.2 | D13, D14, D20 | Diagnóstico y aprovisionamiento idempotente sin dependencias del proyecto probado, caché de navegadores, proxy y CA. Dar diagnóstico accionable cuando falten permisos. | Instalación limpia en los tres sistemas, navegador bajo demanda, loopback con PNG y WebM donde proceda y cierre de procesos. Medir soporte efectivo por plataforma. | E1/E6/E7, EXP-04 |
| REQ-OPT-001 | RUN-001.1, RUN-001.5, CAM-001.3 | D16, D21 | Control de CPU, RAM, presión de memoria, disco y presupuesto. Concurrencia limitada por dependencias, conflictos de datos, sesiones, roles y permisos. Reutilización bajo aislamiento, reciclaje, cancelación y limpieza. RNF-02. Alternar entre tres, cuatro o más aplicaciones sin navegadores abiertos en reposo. Verificar liberación de procesos, locks y memoria al terminar cada tarea. Medir reapertura y alternancia con presupuestos configurables de tiempo, páginas y memoria. | Medir en tres sistemas concurrencia 1/2/4, aislamiento, presupuestos y procesos residuales tras fallo. Publicar hardware mínimo/recomendado por modalidad con medición reproducible. | E3/E5/E7/E8, EXP-03 | · [especificacion-entrega-2 L391](https://github.com/Hyouka73/QAMCP/blob/c1d1680e6531a5132456665ca6851b6cbf5ff528/docs/qap-architecture/cierre-av-01/fuentes-recuperadas/especificacion-entrega-2.md#L391)
| REQ-OPT-002 | MEM-003.5, DIS-001.3, MEM-002.4 | D05, D16, D19 | Compactar contexto y snapshots preservando estado, procedencia y omisiones. Poda común con simulación real y protección de evidencia activa. | Comparar bytes y cobertura antes y después, medir tokens y verificar que simulación no escribe ni retiene handles. | E2/E4, EXP-02/03 |
| REQ-E2E-001 | PLN-001.1, PLN-001.4–001.6, RUN-001.1–001.4, CAM-001.2–001.3 | D04, D06–D08, D12, D21 | DAG multirol y multimódulo con entradas/salidas tipadas, verificaciones, datos, evidencia por paso y recuperación. Los efectos confirmados del AUT se reconcilian y, cuando proceda, se compensan. | Tres módulos y dos roles en un flujo. Inyectar fallo tras un efecto confirmado y demostrar continuidad y ausencia de duplicación. Replay congelado sin inferencia por paso. | E3/E4/E5/E8, EXP-05 |
| UTCP/OpenAPI (alias histórico REQ-UTCP-001) | DAT-001.2, INT-001.4 | D07–D09, D12 | Manuales y contratos versionados sobre un puerto común, selección de destino autorizado, validación de esquemas y referencias opacas. Preparación con reconciliación, limpieza e idempotencia donde exista soporte. | Preparar cliente, contrato y solicitud con ambas descripciones y verificar efectos y pérdida de respuesta. Las referencias de solo lectura quedan inmutables. | E1/E4/E5, EXP-05 |
| M1 | REP-001.1–001.2 | D12, D18–D21 | DTO/manifiesto común. CSS, iconos y fuentes locales, vistas responsivas y navegación accesible por caso, paso y defecto. | Verificar visor HTTP, HTML MCP/CLI y de flujo y resumen Markdown con estados accesibles y los mismos IDs. | E6/E7 |
| M2 | REP-001.1–001.2, RUN-001.6 | D18–D20 | Export HTML relativo y portable. PNG nítido de viewport, elemento o página completa, dimensiones, escala, ampliación, fallback y estados de evidencia. | Mover la exportación a una carpeta con espacios y acentos y abrir por file:// sin red ni servidor, con anclas, PNG y WebM autorizados. | E6 |
| M3 | RUN-001.6, REP-001.1, SEG-002.1 | D15, D18, D20 | WebM auténtico, geometría/códec/duración/tamaño/hash y offsets por paso, origen y página. Guarda preventiva, supresión y descarte lógico conforme a política. | Decodificar desde primer cuadro con canarios sintéticos en transiciones sensibles y verificar revocación, custodia de temporales y descarte tras reinicio. | E6, EXP-06, AS-04 |
| M4 | REP-001.1–001.2, SEG-001.1 | D18–D20 | Reproducción con catálogo autorizado, rutas confinadas, MIME y rangos HTTP. HTML con controles nativos, seek por paso, pantalla completa y diagnóstico. | Probar GET/HEAD, 206/416, ancho de rango, revocación, reinicio y export trasladado con los navegadores acreditados. | E6/E7, AS-01/04 |
| M5 | REP-001.1–001.2, INT-001.2 | D14, D18, D20–D21 | Validar en navegador real paquete instalado y export trasladado con baselines visuales, teclado y canarios. | Fijar viewport, fuentes y tolerancias. Medir reproducción, salto, fullscreen, ausencia de recursos externos y tratamiento de evidencia faltante. | E6/E8, EXP-04/06 |

## Nuevos candidatos

Candidatos de origen y sus promociones trazables. CAND-SEG-001 origina también POL-CAP-001. El alcance del acta conserva su fuerza.

<a id="cand-rep-001"></a>

### REQ-AUTREP-001

**Alias de origen.** CAND-REP-001.

Validación funcional de reportes emitidos por el AUT

- **Decisiones y alcance.** D11, D12, D21. Requisito expreso de lanzamiento. Identificador promovido.
- **Dependencias.** DOC 001.1–001.4, ORA 001.2–001.7, RUN 001.6.
- **Estado en develop.** Ausente como producto integrado. Los generadores de reportes de QAP cumplen otro propósito.
- **Aceptación candidata.** En módulos de reportes configurar fechas, filtros y agrupación, descargar PDF y Excel y comparar filas, columnas, hojas y tablas multipágina con fuentes autorizadas. Detectar duplicados, faltantes, filtros ignorados, cálculos y redondeo. Distinguir fórmula y valor cacheado, abstenerse ante extracción o fuente insuficientes y localizar cada diferencia. Validar tanto registros como totales.
- **Procedencia y trazabilidad.** [Decisiones D01–D21](acta-decisiones.md) y [matriz de trazabilidad](trazabilidad.md). G2/G3/G4/G6, E4/E5/E8.

<a id="cand-run-001"></a>

### REQ-RUN-002.1

**Alias de origen.** CAND-RUN-001.

Preferencias de ejecución y fidelidad del AUT

- **Decisiones y alcance.** D14, D15, D16, D21. Requisito expreso de lanzamiento. Identificador promovido.
- **Dependencias.** DIS 001.3–001.4, RUN 001.1, INT 001.2, REQ-ONB-001.
- **Estado en develop.** Fidelidad y portabilidad sin certificar. El runner existente usa Playwright.
- **Aceptación candidata.** Guardar y cambiar desde lenguaje natural preferencias de modo visible/segundo plano, navegador, grabación autorizada y consumo. Confrontar criterios funcionales y recursos permitidos CSS, JS, imágenes y fuentes en ambas modalidades y registrar degradación e hidratación SPA.
- **Procedencia y trazabilidad.** [Decisiones D01–D21](acta-decisiones.md) y [matriz de trazabilidad](trazabilidad.md). G2/G3/G5/G6, E4/E6/E7/E8, EXP-03/04.

<a id="cand-seg-001"></a>

- **Criterios independientes.** 1a, persistir por proyecto preferencias conversacionales de visualización, navegador, grabación autorizada y consumo. 1b, fidelidad no desactivable de CSS, JS, imágenes, fuentes e hidratación SPA autorizados, con resource_degradation_event al degradar.

### REQ-SEG-002.3

**Alias de origen.** CAND-SEG-001.

Autorización y custodia del ciclo de evidencia privada

- **Decisiones y alcance.** D18, D19, D20. Política de producto expresa. Identificador promovido. Activación condicionada.
- **Dependencias.** SEG 001.1–001.3, SEG 002.1, REP 001.1, RUN 001.6, M2–M5.
- **Estado en develop.** Ausente como garantía de producto. AS-04 es experimental y reproducción de fuga acreditada en ese fixture.
- **Aceptación candidata.** Separar autorización de capturar, acceder, conservar y exportar. Probar vigencia de captura ≤30 días, renovación y revocación, custodia desde la primera escritura, catálogo/visor confinado y exportación sin media privada por defecto. Perder garantías en login/MFA/SSO o superficie sensible exige supresión. Verificar eliminación lógica y riesgo residual.
- **Procedencia y trazabilidad.** [Decisiones D01–D21](acta-decisiones.md) y [matriz de trazabilidad](trazabilidad.md). G0/G1/G3/G5/G6, E2/E5/E6/E8, AS-01/03/04, EXP-06.

- **Contravalidación AV-02.** Exclusión previa en ambos modos y supresión anticipada cuando falte garantía. Activación privada condicionada a cobertura acreditada, EXP-06a/c y DE-02. [AR-27](cierre-av-01/fe-correcciones-ar27.md).

- **Contravalidación AV-02.** Cuatro permisos independientes y ratificación de riesgo pendiente DE-02. [AR-32](cierre-av-01/dictamen-av02.md#ar-32).

## Políticas adicionales de captura y retención

| Política | Fuente y alcance | Dependencias | Estado en develop | Aceptación candidata |
|---|---|---|---|---|
| POL-CAP-001 · Captura privada controlada | D18/D20. Autorización renovable y revocable hasta 30 días. `VERIFIED_STRICT`, `PRIVATE_AUTHORIZED`, `MANDATORY_SUPPRESSION` con permisos distintos para capturar, acceder, conservar y exportar. | CAND-SEG-001, M2–M5, AS-01/03/04. | Capturas y reportes parciales. Régimen de custodia sin demostrar en producto. | Probar supresión cuando falle una garantía, revocación en vuelo, custodia desde origen, trazabilidad y exclusión de privada de exportación predeterminada. |
| POL-RET-001 · Historial y retención | D19. Resumen permanente hasta eliminación expresa, detalle 90 días, exportación manual, autoarchivo opcional, Knowledge vigente y casos activos sin caducidad. Propuesta técnica pendiente: multimedia de éxitos hasta 24 h, trazas 72 h, fallos al menos 14 días con las excepciones de D19. Defectos abiertos protegidos con cuotas. Poda cada 24 h mientras activo y al iniciar. | REQ-MEM-003.5, REQ-REP-001.1–001.4, M2, CAND-SEG-001. | Poda parcial y divergente. Plazos de D19 sin garantía integrada acreditada. | Simular vencimiento, defecto abierto, corrección acreditada y publicación pendiente. Comprobar protección y poda, hashes y manifiesto preservados, mismo veredicto, informe sin `trace.zip` y exportaciones HTML, CSV, JSON/JSONL y manifiesto verificable. |

Las comprobaciones conocidas como HAR saneado, exportación a especificaciones, Web Vitals y regresión visual del AUT conservan prioridad opcional de la evaluación independiente. Accesibilidad y contrato API conservan sus IDs dedicados. Los controles autorizados de permisos, aislamiento, ausencia de efectos, cabeceras y política CORS del AUT se trazan a CAS/ORA/SEG y D07/D12/D21.
