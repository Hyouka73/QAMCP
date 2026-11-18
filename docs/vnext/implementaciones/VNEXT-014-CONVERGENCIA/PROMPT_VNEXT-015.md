# QAMCP — VNEXT-015, prompt operativo VIGENTE (rama única)

**Política ratificada 2026-11-05:** trabajar exclusivamente en `feat/qap-vnext-architecture` desde su HEAD remoto vigente. NO crear `feat/vnext-015-impact-analyzer`, ramas de documentación, auditoría ni implementación. El SHA `541c925a6c1194bc2c85ab5a42b2b54e66f4d82c` es solo una referencia auditada histórica, NO una base de checkout. NO descartar los commits correctivos de VNEXT-014. No tocar `main`, `develop`, `staging` ni publicar npm o hacer force-push.

**Leer ANTES de empezar:** `docs/vnext/08_WBS_MICROTAREAS_Y_COMPUERTAS.md`, `docs/vnext/implementaciones/VNEXT-014-CONVERGENCIA/PREPARACION_VNEXT-015.md`, `AGENTS.md`, contratos reales `IKnowledgeStore`, `DomainModule`, `FlowScenario` y `cycle-detector.ts`. Si `git ls-remote` falla, consultar HEAD en GitHub y documentar el límite sin inventar estado local.

**Permiso de implementación:** este prompt solo instruye `VNEXT-015-01` y `VNEXT-015-02`, sujetos a autorización del responsable. No ejecutar 015-03/04/05 ni 016.

## 015-01 — Contratos puros en Engine

Crear `packages/engine/src/impact-contract.ts`, export mínimo desde `packages/engine/src/index.ts`. Tipos para application_id, semillas ID/key, afectados, distancia, rutas explicables, referencias desconocidas, ciclos, ambiguos, inactivos y completitud. No I/O ni dependencia inversa Engine→Knowledge.

## 015-02 — Analizador puro en Knowledge

Crear `packages/knowledge/src/impact/impact-analyzer.ts` y `packages/knowledge/test/impact-analyzer.test.ts`; export controlado desde `packages/knowledge/src/index.ts`, conservando los existentes.

Entrada: arreglo de módulos YA leídos; no `IKnowledgeStore.query`, no SQLite, no escrituras. Normalizar ID/key con unicidad, detectar ambigüedad, construir arco módulo→dependencia y calcular impacto INVERSO (quién depende de lo cambiado), con rutas, profundidad, dedup y orden determinista. Reutilizar `detectCycles(Map)`; `validateDependencyGraph` recibe `CapabilityDefinition[]`, NO `DomainModule[]`. No inventar nodos ni mutar entradas.

**Política propuesta de inactivos, pendiente de aprobación junto con el bloque:** conservarlos para validar y recorrer, diagnosticarlos y excluirlos de módulos afectados; rechazar semillas inactivas; no seguir automáticamente `superseded_by`.

## Exclusiones

Prohibido modificar `@qap/mcp`, TestHandler, ReportHandler, qap_session_close, `@qap/playwright-runner`, `FileSystemStorage`, SQLite y servicios de VNEXT-014. No crear otro motor Knowledge, ejecución, inferencia o cobertura. VNEXT-014 conserva NO-GO y sus 63 identidades históricas.

## Pruebas y publicación

Casos: vacío, aislado, cadena, diamante, cambios múltiples, IDs/keys, ambiguos, faltantes, inactivos, ciclos, no mutación y determinismo. Ejecutar `pnpm run build`, `pnpm --filter @qap/engine test`, `pnpm --filter @qap/knowledge test` y lint diferencial cuando el entorno lo permita. Codex valida físicamente, ChatGPT/Gemini revisa contratos/diff. Commits pequeños directamente sobre `feat/qap-vnext-architecture` después de confirmar HEAD/diff, sin pisar cambios ajenos. Documentar SHAs y pruebas en `docs/vnext/implementaciones/VNEXT-015/INFORME.md`. No declarar PASS sin evidencia ni declarar VNEXT-015 terminado tras solo 015-01/02.

**Se sustituye la versión anterior de este prompt que exigía crear una rama y trabajar desde un SHA antiguo.**
