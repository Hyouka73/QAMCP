# VNEXT-015-04 — Propagación inversa de impacto entre flujos

Fecha: 2026-11-09, America/Mexico_City. Implementación local aislada por Codex.
**Preparada, no certificada. No se ejecutaron pruebas, compilación, typecheck ni lint.**
La ejecución física queda detenida por coordinación explícita del responsable con R7-R2.
VNEXT-014 continúa NO-GO. VNEXT-015 global permanece abierto; no se inicia 015-05 ni 016.

## Base, aislamiento y diff

- HEAD remoto real consultado con `git ls-remote origin refs/heads/feat/qap-vnext-architecture`:
  `a3f7ab5a21368142884a5a6dc6f5bc072015e6af`.
- Worktree local detached, sin nueva rama:
  `C:/Users/Judirico/.codex/worktrees/vnext-015-04/QAMCP`.
- Commit de implementación local: `0b8d8c78b2e76be170cc399ece8d063db3d3c501`.
- Diff de código: tres archivos, 537 líneas añadidas. Nuevo `flow-impact.ts`, nuevo
  `flow-impact.test.ts`, una reexportación en el índice público Knowledge.
- Este informe es aditivo. No se editan STATE, WBS histórico ni informes anteriores.
- No se modifica el checkout principal, R7, VNEXT-014, Engine, Shared, MCP, runner,
  reporter, Auth, configuración Vitest ni lockfile. No se lee ni modifica el archivo
  personal excluido por el responsable.
- No hay push, PR, rama nueva ni merge a develop. El commit permanece detached.

Se revisaron AGENTS, STATE, WBS 08 y el informe 015-03; contratos Impact de Engine,
entidades FlowScenario/PrerequisiteDefinition de Shared, analizador puro, lector Knowledge,
detector de ciclos, índice público y pruebas previas. La skill de arquitectura de dominio
se contrastó con los contratos vNext concretos del repositorio.

## API y reutilización

```typescript
analyzeFlowImpact(request, modules, flows): FlowImpactResult
readKnowledgeFlowImpact(store, applicationId, request, flows, options?): Promise<KnowledgeFlowImpactResult>
```

`ImpactFlow` deriva exclusivamente de FlowScenario y PrerequisiteDefinition de Shared;
admite inventarios readonly. Consume id, application_id, module_id, is_active y prerequisites.
No consulta steps, títulos, DOM, roles ni state_assertions para construir relaciones.

El cálculo puro invoca `analyzeImpact` para módulos. Asocia los flujos con los módulos
afectados exclusivamente por igualdad exacta de `module_id` con el ID del módulo.
Una key de módulo no sustituye un ID en esa asociación.

Para las relaciones entre flujos solo usa prerrequisitos con `kind: 'preceding_flow'`
y un `depends_on_flow_id` textual no vacío. Ese campo en otros kinds no crea arcos.
Los IDs de flujo se proyectan internamente como nodos ID-only (key igual a ID) para
reutilizar `analyzeImpact`: validación de referencias, detección de ciclos, BFS inverso,
deduplicación y elección de rutas mínimas ordinales. No hay segundo algoritmo de grafos
ni FlowOrchestrator. Los metadatos de esa proyección son internos y descartables;
no son entidades persistidas ni una promoción de certeza del conocimiento.

El lector nuevo compone `readKnowledgeImpact` sin cambiar su contrato. Un observador
de `query` conserva solo los IDs de módulos retornados, reiniciándolos cuando 015-03
reinicia un intento sin cursor. Solo los usa si 015-03 acepta el inventario completo.
No reimplementa paginación, validación de páginas, límites o reintentos.
No agrega consultas al store. No llama get, history, commit ni withWriteFence.

Los flujos son **un inventario provisto por el llamador**, copiado antes del primer await.
Este adaptador no incorpora otro lector paginado de flujos; su adquisición y exhaustividad
corresponden al llamador. Los fixtures preparados incluyen flujos persistidos y leídos
desde Knowledge antes de invocar la composición.

## Semántica de resultados y límites

- Cada afectado incluye módulo, distancia mínima en arcos de flujo y rutas con
  `source_flow_id`, `flow_ids` y la causa `module_path` del análisis previo. Se conserva
  una ruta mínima por flujo fuente y cada causa de módulo, sin enumerar todas las rutas.
- Orden de afectados: distancia, ID ordinal. Rutas: ID del flujo fuente y semilla de módulo.
  Diagnósticos deduplicados y ordenados por representación canónica.
- Un flujo afectado no convierte a todos los flujos hermanos de su módulo en afectados.
- Los inactivos se validan y atraviesan, pero no se incluyen en `affected_flows`.
  Un flujo inactivo asociado a un módulo afectado puede ser una raíz estructural para
  alcanzar dependientes activos: no es una semilla explícita de módulo del usuario.
  La política de módulos inactivos de 015-01/02 se conserva sin cambios.
- Ámbitos ajenos, duplicados de ID, asociaciones de módulo desconocidas, prerrequisitos
  formales malformados, referencias faltantes o ciclos rechazan toda salida de flujos.
  También se validan relaciones inalcanzables e inactivas. No se elige una revisión arbitraria.
- Un análisis de módulos rechazado produce salida de flujos rechazada y vacía.
  Una lectura de módulos fallida produce `analysis: null`; conserva el resultado sanitizado
  y los contadores del lector 015-03 en `module_read`.
- `max_depth` conserva su significado de profundidad **del análisis de módulos**.
  La propagación formal entre flujos no tiene otro límite de profundidad. Si los módulos
  quedan `depth_limited`, el resultado de flujos conserva ese estado y solo incluye causas
  realmente demostradas por los módulos alcanzados y los prerrequisitos explícitos.
- `coherence: 'caller_supplied_not_verified'`; la lectura conserva
  `snapshot_consistency: 'not_verified'`. Agotar páginas no demuestra actualidad,
  exhaustividad independiente ni snapshot atómico entre módulos y flujos.
- No se certifica escala masiva: se heredan pila DFS y almacenamiento de rutas del motor
  previo. El número de causas combina raíces de flujo con causas de módulo.

## Pruebas preparadas y verificaciones efectuadas

`packages/knowledge/test/flow-impact.test.ts` prepara casos de asociación directa,
dependencias intermodulares, transitividad, dirección inversa, diamante, varias causas,
duplicados de arcos y nodos, ausencia de inferencia, referencias inválidas, ciclos
incluidos inalcanzables, inactivos raíz/intermedio, ámbitos, profundidad, orden estable,
entradas congeladas, arrays incompletos y aislamiento de resultados entre invocaciones.

Fixtures SQLite temporales preparados para comparar composición/puro, leer flujos
persistidos, comprobar llamadas de solo lectura, interrupción por límite de páginas,
agotamiento de cursores, descarte de IDs de intentos previos, copia previa a esperas,
scope inválido y ausencia de mensajes sensibles en errores.
Los errores de cursor de los nuevos tests de composición son inyectados; no se presentan
como nueva demostración de concurrencia física. La regresión 015-03 conserva sus pruebas
previas con escritores físicos independientes.

**Ejecutado:** revisión estática y `git diff --cached --check`, sin errores de formato.
**No ejecutado:** Vitest, builds, tsc, ESLint ni verificación ESM. No existe resultado PASS
ni nueva cifra de casos aprobados. Tampoco hay certificación de 015-04 o cierre de 015.

## Ventana física, certificación Codex e integración pendiente

La autorización del responsable exige: Gemini Teamwork termina R7-R01..R7-R06,
publica su commit y confirma que no mantiene pruebas; Codex audita independientemente
R7-R2; se comprueba ausencia de ejecuciones simultáneas capaces de interferir; y el
responsable confirma expresamente la ventana de 015-04. Una ventana liberada no acredita
EJECUTOR_APTO ni reserva CPU/RAM para E01. No se ejecuta carga para comprobarlo aquí.

Tras esa confirmación, certificar por Codex el SHA exacto de esta entrega y sus correcciones:

```powershell
pnpm install --frozen-lockfile
pnpm --filter @qap/shared build
pnpm --filter @qap/engine build
pnpm --filter @qap/knowledge build
pnpm --filter @qap/knowledge exec vitest run test/flow-impact.test.ts --reporter=verbose
pnpm --filter @qap/knowledge exec vitest run --reporter=verbose
pnpm --filter @qap/engine test
pnpm exec tsc -p packages/knowledge/test/tsconfig.json --noEmit --pretty false
pnpm exec eslint packages/knowledge/src/impact/flow-impact.ts packages/knowledge/src/index.ts packages/knowledge/test/flow-impact.test.ts
git diff a3f7ab5a21368142884a5a6dc6f5bc072015e6af HEAD --check
```

Ejecutar secuencialmente en el worktree, con dependencias y temporales propios; no enlazar
node_modules mutable del checkout R7 ni alterar workers/timeouts/configuración para pasar.
Guardar códigos de salida, logs, entorno y SHA; revisar exportaciones ESM/declaraciones.
Corregir fallos reales y repetir los checks afectados antes de emitir dictamen de 015-04.
La certificación integral de 015-05 requiere su autorización posterior; no se inicia aquí.

Cuando R7 termine y la integración pueda coordinarse, volver a consultar HEAD remoto real
de la rama autorizada. Integrar solo los commits locales de 015-04 sobre ese HEAD actualizado,
revisando cualquier cambio ajeno en el índice público. No resetear el checkout principal,
no reemplazar su estado, no force-push y no publicar desde este worktree mientras R7 cambie
la rama. Revisar diff limitado y certificar nuevamente el SHA integrado antes de publicar.
No se presume disponibilidad de integración ni se autoriza merge a develop.

**Solicitud de certificación pendiente:** Codex debe ejecutar y documentar estas verificaciones
cuando el responsable confirme la ventana. Hasta entonces 015-04 queda implementada localmente,
con pruebas preparadas y sin certificación; 015-05, VNEXT-016 y cierre global no autorizados.
