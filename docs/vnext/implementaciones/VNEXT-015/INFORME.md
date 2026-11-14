# VNEXT-015-01/02 — Contratos y motor puro de impacto inverso

Fecha: 2026-11-05 (America/Mexico_City). Ejecutor de código y verificaciones físicas: Codex, Windows. Alcance autorizado: exclusivamente 015-01 y 015-02 del WBS 08. **VNEXT-015 no está terminado; 015-03/04/05 no se implementaron. VNEXT-014 conserva NO-GO.**

## Base, autorización y publicación

- Rama única: `feat/qap-vnext-architecture`; sin ramas auxiliares, reset, rebase ni merge de historias divergentes.
- HEAD remoto consultado antes de cambios: `e4d7fbc2c6e4525b4e5fab38ec22e0cd365305d6`, primero por GitHub y luego confirmado físicamente con `git ls-remote` fuera del sandbox. Checkout local actualizado mediante fast-forward desde `ed2955f`; reparaciones existentes conservadas.
- Leídos: `08_WBS_MICROTAREAS_Y_COMPUERTAS.md`, preparación VNEXT-015, `IKnowledgeStore`, `DomainModule`, `FlowScenario`, grafo y detector de ciclos existentes. La autorización del responsable sustituye la antigua base `541c925` y aprueba expresamente la política de inactivos descrita abajo.
- Contrato 015-01: [`aac2ad23e203b977e76db741b1cdde68e61f30f8`](https://github.com/Hyouka73/QAMCP/commit/aac2ad23e203b977e76db741b1cdde68e61f30f8), `feat(engine): define versioned module impact contract (VNEXT-015-01)`.
- Motor y pruebas 015-02: [`23ef5e6b558f3d750c5bff8b15c936d0d1a534b3`](https://github.com/Hyouka73/QAMCP/commit/23ef5e6b558f3d750c5bff8b15c936d0d1a534b3).
- [Diff de código completo](https://github.com/Hyouka73/QAMCP/compare/e4d7fbc2c6e4525b4e5fab38ec22e0cd365305d6...23ef5e6b558f3d750c5bff8b15c936d0d1a534b3): cinco archivos, 404 líneas añadidas, cero eliminaciones. Ambos commits publicados con push normal, sin force; Git rechaza avances remotos incompatibles. El commit documental de este informe se identifica en su historial de GitHub.

## A. Contratos creados

`packages/engine/src/impact-contract.ts`, exportado aditivamente por `engine/src/index.ts`:

- `ImpactModule`: proyección readonly de `DomainModule`, con dependencias readonly; no cambia Shared.
- `ImpactSeed`: namespace explícito `id` o `key` y valor, sin precedencia implícita entre ambos.
- `ImpactRequest`: versión literal 1, `application_id`, `changed_modules`, `max_depth` opcional (entero seguro no negativo; omitir = sin límite).
- `ImpactPath`, `AffectedModule`, `ImpactDiagnostic`, `ImpactResult` y firma funcional `ImpactAnalysis`.
- Completitud: `complete`, `depth_limited`, `rejected`. Coherencia: siempre `caller_supplied_not_verified`. No afirma snapshot atómico, exhaustividad del inventario ni consistencia entre revisiones de almacenamiento.
- Diagnósticos discriminados: solicitud inválida, scope incorrecto, ID duplicado, key ambigua, semilla desconocida, referencia faltante, referencia ID/key ambigua, ciclo, módulo inactivo y semilla inactiva.

Ejemplo de consumo del contrato y la exportación pública (el llamador aporta los módulos ya cargados):

```typescript
import type { ImpactRequest, ImpactModule } from '@qap/engine';
import { analyzeImpact } from '@qap/knowledge';

function inspect(modules: readonly ImpactModule[]) {
  const request: ImpactRequest = {
    contract_version: 1,
    application_id: 'app',
    changed_modules: [{ kind: 'key', value: 'billing' }],
    max_depth: 2,
  };
  return analyzeImpact(request, modules);
}
```

## B. Algoritmo y reglas de resolución

`knowledge/src/impact/impact-analyzer.ts` exporta `analyzeImpact(request, modules)`; el índice Knowledge conserva todas sus exportaciones anteriores.

1. Valida scope e identidades del inventario completo, incluso sin semillas. IDs duplicados y keys compartidas por módulos distintos rechazan el cálculo; no se escoge arbitrariamente un registro.
2. Para cada dependencia textual reúne candidatos por ID y key. Un único ID real resuelve; cero produce `MISSING_REFERENCE`; varios IDs distintos producen `AMBIGUOUS_REFERENCE`. El ID y la key del mismo módulo se deduplican.
3. Construye adyacencia módulo → dependencia y su inversa, con IDs y vecinos ordenados por comparación ordinal, independiente de locale y orden de entrada.
4. Invoca el `detectCycles(Map<string, string[]>)` existente sobre nodos reales y aristas resueltas. No llama `validateDependencyGraph` ni convierte módulos en capacidades. Los ciclos devuelven una traza cerrada.
5. Resuelve semillas en el namespace solicitado y las deduplica. Desconocidos o semillas inactivas rechazan toda la solicitud. Cualquier error impide devolver módulos afectados, incluso si otra semilla sí era válida. Los diagnósticos no prometen enumerar todos los errores: un fallo de identidad/scope detiene la resolución posterior.
6. BFS inverso por cada semilla, conservando una ruta mínima por semilla/destino. En empates se escoge la primera secuencia ordinal de IDs. La salida no enumera todas las rutas del DAG; evita su crecimiento combinatorio. Cada módulo aparece una sola vez, con distancia mínima global y rutas ordenadas por semilla.
7. Las semillas activas aparecen a profundidad cero. La profundidad cuenta aristas, incluidos intermediarios inactivos. `max_depth` limita cada ruta por semilla; `depth_limited` solo aparece si realmente se omite algún nodo alcanzable para alguna semilla. Módulos ordenados por profundidad mínima y después ID; diagnósticos ordenados/deduplicados por representación JSON estable.

**Política de inactivos aprobada por el responsable:** permanecen en validación y recorrido, se reportan con `INACTIVE_MODULE`, se excluyen de afectados y las semillas inactivas producen `INACTIVE_SEED` y rechazo. No se sigue `superseded_by`. `complete` describe la proyección activa sobre el inventario aportado; los inactivos informados no convierten por sí solos el cálculo en incompleto.

## C. Casos de prueba

`knowledge/test/impact-analyzer.test.ts`: **32 casos físicos**, contando parametrizaciones. Cubren:

- Grafo vacío, aislado, cadena inversa, diamante y raíces independientes.
- Dependencias ID/key, alias duplicados, múltiples semillas y causas por semilla.
- Profundidades 0/1/2, frontera realmente truncada y frontera ya cubierta; profundidad inválida.
- Semillas desconocidas por ID y key; referencia inexistente en componente no seleccionado.
- Keys duplicadas, colisión ID/key, namespaces explícitos, IDs duplicados y scope ajeno.
- Autociclo y ciclo transitivo con traza cerrada; ciclo y falta en módulo inactivo.
- Inactivo intermedio atravesado y excluido; semilla inactiva rechazada sin sustitución por sucesor.
- Orden estable al permutar módulos, dependencias y semillas; argumentos congelados y resultados separados de entradas y de otras invocaciones.

## D. Resultados físicos certificados por Codex

Entorno medido: **Node v24.15.0, pnpm 12.3.4, Vitest 4.1.11**, Windows. Dependencias ya disponibles; no se instaló ni modificó lockfile. Las ejecuciones verificaron el contenido fuente posteriormente registrado en `23ef5e6`; el commit solo registró esos mismos archivos.

| Comando ejecutado | Resultado físico |
|---|---|
| `pnpm --filter @qap/engine build` | exit 0; JS y declaraciones del contrato generados |
| `pnpm run build` | exit 0; diez paquetes compilados, incluidos Engine/Knowledge y consumidores existentes |
| `pnpm --filter @qap/knowledge test test/impact-analyzer.test.ts` | exit 0 fuera del sandbox; 32/32 PASS |
| `pnpm --filter @qap/engine test` | exit 0; 168/168 PASS, 11 archivos |
| `pnpm --filter @qap/knowledge test` | exit 0; 292/292 PASS, 27 archivos = 260 anteriores + 32 nuevos |
| `pnpm exec tsc -p packages/knowledge/test/tsconfig.json --noEmit --pretty false` | exit 0; sin diagnósticos |
| ESLint diferencial, comando abajo | exit 0; cero errores/advertencias en los cinco archivos de código modificados |
| `git diff --check` | exit 0 |

```text
pnpm exec eslint packages/engine/src/impact-contract.ts packages/engine/src/index.ts packages/knowledge/src/impact/impact-analyzer.ts packages/knowledge/src/index.ts packages/knowledge/test/impact-analyzer.test.ts
```

Logs capturados directamente de las suites: [Engine](ENGINE_TEST.txt), [Knowledge](KNOWLEDGE_TEST.txt). No se atribuye PASS global de ESLint: se verificaron únicamente los archivos modificados, sin cambiar configuración ni añadir supresiones.

Incidente de entorno conservado: el primer test focal dentro del sandbox terminó exit 1 por `EPERM` al renombrar la caché temporal de Vitest, **antes de cargar pruebas (0 ejecutadas)**. La misma orden fuera del sandbox pasó 32/32. Build y suites completas se ejecutaron fuera del sandbox; no se modificó producción ni se ajustaron timeouts para resolverlo.

## E. Riesgos y limitaciones

- Sin lector Knowledge, I/O, persistencia, flujos, MCP, ejecución ni integración de cierre. El inventario debe ser suministrado por el llamador. No se afirma snapshot, atomicidad multi-kind, exhaustividad ni vigencia de las revisiones.
- Entrada tipada basada en `DomainModule` canónico; no es un validador de JSON arbitrario. Se comprueban solicitud, scope, identidades y referencias necesarios para el cálculo.
- Rechazo conservador del inventario completo: también bloquean referencias rotas/ciclos desconectados de las semillas. No se ocultan defectos por `max_depth`.
- `detectCycles` conserva su DFS recursivo existente y sus límites de pila; no se añade otro detector. No se certificó carga de grafos masivos. BFS se realiza por semilla; almacenar/copiar rutas puede consumir memoria proporcional a sus longitudes acumuladas. No se enumeran todas las rutas ni todos los ciclos simples.
- La suite Knowledge existente ejercita SQLite, pero eso **no certifica un adaptador de impacto ni lectura concurrente**: 015-03 no está implementado.
- No se ejecutó MCP ni se recertificaron sus 63 identidades. Su preservación aquí es por ausencia de cambios en todos los archivos MCP y pruebas históricas. VNEXT-014 sigue NO-GO, con sus riesgos y garantías intactos.

## F. Archivos y diff

Cambios productivos/de tests exactamente:

```text
packages/engine/src/impact-contract.ts                 nuevo
packages/engine/src/index.ts                           export añadido
packages/knowledge/src/impact/impact-analyzer.ts        nuevo
packages/knowledge/src/index.ts                        export añadido
packages/knowledge/test/impact-analyzer.test.ts         nuevo
```

Documentación adicional limitada a este directorio: informe y dos logs de suites. No se modifican WBS/STATE ni estados históricos. `git diff e4d7fbc..23ef5e6` no contiene MCP, PlaywrightRunner, Reporter, storage, grafos existentes ni `knowledge-store.port.ts`. El cambio previo ajeno en `packages/playwright-runner/.qa/cache/sessions/admin-user.json` permanece fuera de los commits, sin leerlo ni alterarlo durante esta implementación.

## G. Dictamen

**GO técnico propuesto exclusivamente para VNEXT-015-01 y VNEXT-015-02:** contratos compilan, algoritmo y diagnósticos pasan 32 pruebas nuevas, Engine 168/168, Knowledge 292/292, build diez paquetes y lint diferencial limpios. Las pruebas físicas indicadas fueron ejecutadas por Codex; no son resultados delegados ni supuestos.

**VNEXT-015 global permanece incompleto. VNEXT-014 conserva NO-GO.** Sin aprobación de merge a develop, sin merge, force-push ni publicación npm. Una revisión externa del diseño/diff puede hacerse sobre los commits publicados; no sustituye ni amplía las comprobaciones físicas registradas.
