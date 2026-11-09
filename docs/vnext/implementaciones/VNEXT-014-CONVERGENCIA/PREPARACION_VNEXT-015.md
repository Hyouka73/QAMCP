# Preparación técnica VNEXT-015 (ImpactAnalyzer) — aislada de VNEXT-014

**Estado:** preparación únicamente. **No se implementó ImpactAnalyzer.** GO técnico para desarrollo aislado ≠ GO para merge a develop.

## Política de rama única (vigente desde 2026-11-05)

- **Rama operativa única de vNext:** `feat/qap-vnext-architecture`. Toda documentación, implementación y auditoría se publica directamente aquí, desde el HEAD remoto real. No crear ramas adicionales ni efectuar checkout de un SHA antiguo; no hacer reset/rebase para excluir correcciones previas de VNEXT-014.
- **Antecedente auditado, NO base de implementación actual:** `541c925a6c1194bc2c85ab5a42b2b54e66f4d82c` (Engine 168/168, Knowledge 258/258, build 10 paquetes). El nombre `feat/vnext-015-impact-analyzer` y el comando de `git switch -c` propuestos inicialmente quedan **sustituidos** por esta decisión. No usar esos comandos.
- **WBS obligatorio:** `docs/vnext/08_WBS_MICROTAREAS_Y_COMPUERTAS.md` en esta misma rama. Las microtareas 015-01/02 tienen alcance limitado a contrato y motor puro. No iniciar implementación sin autorización específica del bloque y de la política de inactivos propuesta.
- **Aislamiento por archivos/commits, no por ramas:** no pisar cambios simultáneos de VNEXT-014; verificar HEAD y diff antes de cada commit; commits pequeños y evidencia física de Codex. No tocar `develop`/`main`/`staging`; sin merge hasta GO correspondiente.

## Alcance WBS (literal)

Paquetes `@qap/engine`, `@qap/knowledge`. Dependencias `VNEXT-003`, `VNEXT-009` (históricamente completas). Riesgo medio. *Construir `ImpactAnalyzer` para calcular módulos y flujos dependientes afectados en el DAG ante cambios.*

## Superficies disponibles (a verificar por el implementador, no asumidas)

- `@qap/engine`: puerto `IKnowledgeStore` (`knowledge-store.port.ts`: módulos, flows, relations, queries, `KnowledgeStoreError`).
- `@qap/knowledge`: `graph/dependency-graph.ts` (`buildDependencyGraph`, `DependencyGraphResolver`), `graph/cycle-detector.ts` (`detectCycles`, `validateDependencyGraph`), `SqliteKnowledgeAdapter`.
- `DomainModule.dependencies` es canónico y acíclico según el puerto.

## Prohibido

No importar ni modificar `@qap/mcp` (`TestHandler`, `ReportHandler`, `qap_session_close`, compuertas de cierre, `CanonicalClosureService`), `@qap/playwright-runner`, ni cambiar contratos de VNEXT-014. No añadir dependencias nuevas (solo `@qap/engine`, `@qap/knowledge`, `@qap/shared`). No tocar `FileSystemStorage`.

## Contratos y decisiones adicionales

- `DomainModule.dependencies` puede contener IDs o keys únicos; `detectCycles(Map)` es reusable, no `validateDependencyGraph(CapabilityDefinition[])` directamente con `DomainModule`.
- `FlowScenario.module_id` identifica el módulo; `prerequisites[].depends_on_flow_id` identifica dependencias entre flujos, reservadas a 015-04.
- Un cursor de `IKnowledgeStore` se invalida ante commits intermedios; lectura multi-kind consistente no está garantizada, reservada a 015-03.
- **Propuesta de inactivos pendiente de aprobación:** conservarlos para validación/traversal, diagnosticar y excluir de afectados, rechazar semillas inactivas, no seguir `superseded_by` automáticamente.
- Las pruebas de SQLite/flow pertenecen a 015-03/04/05; para 015-01/02 solo algoritmo puro, tipos y suites focales.

## Pruebas mínimas

1. DAG: grafo vacío, nodo aislado, cadena, diamante, múltiples raíces.
2. Dependencias: directas y transitivas inversas (quién se ve afectado si cambia X); dependencias hacia nodos inexistentes se reportan, no se ignoran.
3. Ciclos: rechazo determinista con el ciclo identificado; sin bucle infinito.
4. Cambios: módulo cambiado, conjunto de módulos, módulo inactivo (`is_active: false`), módulo desconocido.
5. Impacto: blast radius por módulo y por flujo, orden estable, sin duplicados, profundidad/distancia por elemento; flujos que atraviesan módulos afectados.
6. Contra `SqliteKnowledgeAdapter` real (archivo temporal): lectura solo-lectura, sin escrituras ni cambios de revisión.
7. Determinismo y no mutación de entradas.

## Criterios de salida

`pnpm run build` OK; `pnpm --filter @qap/engine test` y `@qap/knowledge test` verdes (168 / 258 como mínimo, sin pruebas eliminadas); ESLint sin identidades nuevas frente a 34 errores/28 advertencias; ningún archivo de `packages/mcp` ni `playwright-runner` en el diff.
