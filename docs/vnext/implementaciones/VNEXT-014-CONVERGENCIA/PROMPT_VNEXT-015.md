Eres el ingeniero responsable de implementar VNEXT-015 (ImpactAnalyzer) de QAMCP de forma aislada y autónoma.

## Repositorio y rama
- Repositorio: `Hyouka73/QAMCP`.
- SHA base obligatorio: `541c925a6c1194bc2c85ab5a42b2b54e66f4d82c` (HEAD auditado de `feat/qap-vnext-architecture`). Verifica con `git ls-remote` que existe; no uses un HEAD posterior.
- Crea y trabaja en la rama `feat/vnext-015-impact-analyzer` (`git switch -c feat/vnext-015-impact-analyzer 541c925a6c1194bc2c85ab5a42b2b54e66f4d82c`) en un worktree/clon limpio. No modifiques `main`, `develop`, `staging` ni `feat/qap-vnext-architecture`. Sin merges, sin force-push, sin publicar npm. No toques archivos personales, bases reales, sesiones protegidas (`packages/playwright-runner/.qa/cache/sessions/admin-user.json`) ni credenciales.

## Alcance (WBS VNEXT-015)
Paquetes `@qap/engine` y `@qap/knowledge`. Dependencias VNEXT-003 y VNEXT-009 (completas). Construir `ImpactAnalyzer` que calcule los módulos y flujos dependientes afectados en el DAG ante cambios (blast radius). Lee antes `docs/vnext/04_BACKLOG_Y_WBS_PRELIMINAR.md` (entrada VNEXT-015), `AGENTS.md` y `docs/vnext/implementaciones/VNEXT-014-CONVERGENCIA/PREPARACION_VNEXT-015.md`.

## Aislamiento (innegociable)
- NO importes ni modifiques `@qap/mcp` (`TestHandler`, `ReportHandler`, `qap_session_close`, compuertas de cierre, servicios canónicos de closure), ni `@qap/playwright-runner`.
- Solo dependencias de `@qap/engine`, `@qap/knowledge` y `@qap/shared`; no añadas paquetes nuevos.
- No modifiques `FileSystemStorage` ni los commits correctivos de VNEXT-014 (`3434e45`, `299ad61`, `ca9b7ea`). No dependas de la certificación de 014: sus 63 pruebas MCP históricas fallidas, la revisión humana y E01 son riesgos ajenos a este trabajo.
- No implementes `qap_advisor` (VNEXT-016) ni integración MCP.

## Diseño
1. Inspecciona `packages/engine/src/knowledge-store.port.ts` (`IKnowledgeStore`, módulos, flows, relations, `KnowledgeStoreError`) y `packages/knowledge/src/graph/dependency-graph.ts` y `cycle-detector.ts`. Reutiliza `detectCycles`/`validateDependencyGraph` en vez de duplicar lógica.
2. Define en `@qap/engine` un puerto/tipos puros (`ImpactAnalyzer`, `ImpactRequest { changedModules, includeFlows?, maxDepth? }`, `ImpactResult { affectedModules[{id, distance, via}], affectedFlows[], unknown[], cycles[] }`) y la implementación de cálculo puro sobre un grafo de entrada (sin I/O). Resultado determinista (orden estable, sin duplicados), entradas sin mutar.
3. En `@qap/knowledge`, un adaptador que construya el grafo desde `IKnowledgeStore` en modo solo lectura (módulos activos, `dependencies`, flows que referencian módulos) y delegue al analizador. Sin escrituras ni cambios de revisión.
4. Semántica: impacto = cierre transitivo INVERSO de dependencias (quién depende, directa o indirectamente, de lo que cambió). Ciclos → error tipado determinista con el ciclo; dependencias a nodos inexistentes se reportan en `unknown`, no se ignoran; módulos inactivos se excluyen del resultado pero se reportan; cambios en módulo desconocido → error tipado.

## Pruebas obligatorias (reales, sin mocks del analizador)
DAG vacío, nodo aislado, cadena, diamante, múltiples raíces; dependencias directas/transitivas inversas; ciclo (rechazo + ciclo identificado, sin bucle infinito); módulo cambiado / conjunto / inactivo / desconocido; blast radius por módulo y por flujo con distancia y orden estable; ejecución contra `SqliteKnowledgeAdapter` real (archivo temporal) verificando que no hay escrituras; determinismo y no mutación.

## Verificación y publicación
- `pnpm install --frozen-lockfile`, `pnpm run build` (10 paquetes), `pnpm --filter @qap/engine test` (≥168 y sin eliminar pruebas), `pnpm --filter @qap/knowledge test` (≥258+), y ESLint global: cero identidades nuevas frente a la línea base 34 errores / 28 advertencias (sin `eslint-disable`, sin cambiar la configuración).
- Confirma que `git diff 541c925..HEAD --stat` no contiene archivos de `packages/mcp` ni `packages/playwright-runner`.
- Commits pequeños y coherentes; antes de cada uno revisa el diff y que no haya secretos o archivos personales. Publica la rama `feat/vnext-015-impact-analyzer`.
- Documenta en `docs/vnext/implementaciones/VNEXT-015/INFORME.md` (SHAs, comandos, resultados reales, límites). Actualiza `docs/vnext/STATE.md` y el WBS solo de forma aditiva, sin cambiar estados de tareas terminadas. No declares PASS de verificaciones que no ejecutaste.
- Veredicto final: GO/NO-GO técnico de VNEXT-015. Indica explícitamente que NO es GO de merge a develop.
