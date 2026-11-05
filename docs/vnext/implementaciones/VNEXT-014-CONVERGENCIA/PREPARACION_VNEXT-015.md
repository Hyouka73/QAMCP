# Preparación técnica VNEXT-015 (ImpactAnalyzer) — aislada de VNEXT-014

**Estado:** preparación únicamente. **No se implementó ImpactAnalyzer.** GO técnico para desarrollo aislado ≠ GO para merge a develop.

## Base y rama

- **SHA base:** `541c925a6c1194bc2c85ab5a42b2b54e66f4d82c` (HEAD de `feat/qap-vnext-architecture` auditado por Codex: Engine 168/168, Knowledge 258/258, build de 10 paquetes). Se elige un SHA auditado y no los commits de convergencia (`3434e45`, `299ad61`, `ca9b7ea`) para que 015 no herede ni mezcle commits correctivos de 014. Esos tres commits no son prerrequisito: no cambian `@qap/engine` y el cambio de `@qap/knowledge` (`FileSystemStorage`) es ortogonal al cálculo de impacto.
- **Rama:** `feat/vnext-015-impact-analyzer` creada con `git switch -c feat/vnext-015-impact-analyzer 541c925a6c1194bc2c85ab5a42b2b54e66f4d82c`. Destino de PR: la rama vNext, nunca `develop`/`main`/`staging`.

## Alcance WBS (literal)

Paquetes `@qap/engine`, `@qap/knowledge`. Dependencias `VNEXT-003`, `VNEXT-009` (históricamente completas). Riesgo medio. *Construir `ImpactAnalyzer` para calcular módulos y flujos dependientes afectados en el DAG ante cambios.*

## Superficies disponibles (a verificar por el implementador, no asumidas)

- `@qap/engine`: puerto `IKnowledgeStore` (`knowledge-store.port.ts`: módulos, flows, relations, queries, `KnowledgeStoreError`).
- `@qap/knowledge`: `graph/dependency-graph.ts` (`buildDependencyGraph`, `DependencyGraphResolver`), `graph/cycle-detector.ts` (`detectCycles`, `validateDependencyGraph`), `SqliteKnowledgeAdapter`.
- `DomainModule.dependencies` es canónico y acíclico según el puerto.

## Prohibido

No importar ni modificar `@qap/mcp` (`TestHandler`, `ReportHandler`, `qap_session_close`, compuertas de cierre, `CanonicalClosureService`), `@qap/playwright-runner`, ni cambiar contratos de VNEXT-014. No añadir dependencias nuevas (solo `@qap/engine`, `@qap/knowledge`, `@qap/shared`). No tocar `FileSystemStorage`.

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
