# VNEXT-015-03 — Lector Knowledge de impacto, acotado y de solo lectura

Fecha: 2026-11-05 (America/Mexico_City). Alcance exclusivo: **015-03**. Implementación y revisión estática en esta sesión; pruebas físicas ejecutadas localmente por **Codex**, sin delegación ni resultados supuestos. **VNEXT-015 global permanece incompleto; 015-04/05 y 016 no se implementan. VNEXT-014 conserva NO-GO.**

## Base y publicación

- Repositorio: `Hyouka73/QAMCP`; única rama: `feat/qap-vnext-architecture`.
- SHA inicial remoto, consultado mediante `git ls-remote`: **`f8b87d85c1249de3d3772f61f22f5d589c7d1282`**. Checkout local actualizado desde `fc97aa5` mediante fast-forward; sin crear ramas.
- SHA final de implementación: **[`8e923a3ba6c56039df21cf321d30360fcf478196`](https://github.com/Hyouka73/QAMCP/commit/8e923a3ba6c56039df21cf321d30360fcf478196)**. Tres archivos, 611 líneas añadidas: lector, export público y pruebas.
- HEAD remoto vuelto a consultar inmediatamente antes del commit de implementación y antes del commit documental. Publicación con push normal, sin force. El SHA final publicado, incluyendo este informe y los logs, se identifica en el historial de este archivo y en la entrega de la sesión.
- Revisados WBS 08, informe previo 015-01/02, contratos `ImpactRequest`/`ImpactResult` e `IKnowledgeStore`, analizador puro, adaptador SQLite, índice público y pruebas físicas existentes. No se modificaron contratos aprobados ni persistencia.
- El cambio local previo en `packages/playwright-runner/.qa/cache/sessions/admin-user.json` queda fuera de los commits, sin leer ni alterar su contenido.

## Contrato público

`packages/knowledge/src/impact/knowledge-impact-reader.ts`, exportado por `@qap/knowledge`:

```typescript
readKnowledgeImpact(
  store: IKnowledgeStore,
  applicationId: string,
  request: ImpactRequest,
  options?: KnowledgeImpactReadOptions,
): Promise<KnowledgeImpactReadResult>
```

La aplicación es explícita y debe coincidir con `request.application_id`; un desacuerdo rechaza la lectura antes de I/O. El lector invoca exclusivamente `query(applicationId, 'module', { limit, cursor? })`, sin filtros de referencias. Consulta revisiones actuales e incluye inactivos; no consulta historia, otras entidades o aplicaciones.

| Opción | Default | Valores admitidos |
|---|---:|---|
| `page_size` | 100 | Entero seguro 1..100 |
| `max_pages` | 1.000 | Entero seguro 1..10.000 por intento |
| `max_attempts` | 3 | Entero seguro 1..10, incluyendo el intento inicial |

La cantidad de consultas se acota por `max_pages * max_attempts`. Los límites acotan llamadas que terminan, no la duración de una promesa del store que nunca resuelve. No se añade una capacidad de cancelación al puerto.

El resultado envolvente distingue el recorrido del inventario del cálculo puro:

| `reading.status` | Significado | `analysis` |
|---|---|---|
| `exhausted` | Se aceptaron todas las páginas hasta una página terminal sin `next_cursor` | `ImpactResult` del motor puro |
| `invalidated` | `INVALID_CURSOR` agotó los intentos | `null` |
| `interrupted` | Límite de páginas o error operativo distinto de cursor inválido | `null` |
| `rejected` | Entrada, página, identidad, ámbito u orden inválidos | `null` |

Metadatos adicionales: `snapshot_consistency: 'not_verified'` siempre, `attempts`, `query_count` (incluye consultas fallidas/intentos descartados), `invalid_cursor_count` y `module_count`. Este último solo cuenta el inventario retenido tras agotamiento; es cero en todo fallo de lectura. No se exportan páginas parciales, entidades descartadas ni payloads de errores.

La unión tipada asocia éxito de lectura con `analysis: ImpactResult`, y fallo con `analysis: null` y `failure.code`; `failure.store_code` solo conserva el código tipado del store. No se propagan mensajes de excepciones que pudieran incluir datos sensibles.

Una lectura `exhausted` puede tener `analysis.completeness: 'rejected'`, por ejemplo por keys ambiguas o una semilla inactiva: se recorrió el inventario, pero el analizador rechazó sus relaciones o la solicitud. Ningún fallo de lectura se convierte en un análisis parcial marcado `complete`.

## Validación y delegación

- Páginas con `items` ausente/no array, tamaño superior al solicitado, cursor vacío/no textual o continuación vacía se rechazan. Se admite una primera página vacía y terminal. Páginas no terminales cortas, pero no vacías, no se presuponen inválidas: el puerto no exige llenarlas al máximo.
- Se comprueban kind `module`, revisión positiva entera segura, ID no vacío, igualdad ID del registro/entidad, aplicación de ambos, key y campos necesarios para el cálculo (`is_active`, dependencias textuales). No se duplica el validador completo de entidades de persistencia.
- Se rechazan IDs duplicados, incluso entre páginas y con revisiones distintas; no se escoge arbitrariamente una revisión. Se verifica el orden ordinal de IDs establecido por el puerto, dentro y entre páginas.
- Se mantiene un conjunto de cursores de cada intento; cualquier cursor repetido, incluso un ciclo de varias páginas, rechaza inmediatamente. Cursores opacos nuevos que no terminan siguen sujetos a `max_pages`.
- Solicitud y semillas se copian antes del primer `await`; las entidades aceptadas y sus dependencias se copian antes de la siguiente consulta. Arrays incompletos de semillas/dependencias se rechazan. Los argumentos congelados son válidos y los resultados no comparten estructuras mutables con otras invocaciones.
- `analyzeImpact` hace toda la resolución ID/key, validación de relaciones, ciclos, BFS inverso, rutas, profundidad, orden y diagnósticos. No se implementa otro algoritmo.
- La política aprobada de inactivos queda intacta: se validan/atraviesan, se excluyen de afectados, las semillas inactivas rechazan y no se sigue `superseded_by`.

## Cursor invalidado y consistencia

Solo un `KnowledgeStoreError` con código `INVALID_CURSOR` reinicia. Cada intento crea inventario, IDs, orden y cursores nuevos. Se descarta íntegramente el intento anterior y la siguiente consulta omite `cursor`. Los contadores acumulados hacen visible la invalidación aunque un intento posterior termine correctamente.

Al agotarse los intentos: `reading.status: 'invalidated'`, `failure.code: 'INVALID_CURSOR_EXHAUSTED'`, `analysis: null`, `module_count: 0`. Los demás errores no se reintentan: `STORE_FAILURE` interrumpe, y los defectos de página/identidad/orden rechazan. `PAGE_LIMIT` interrumpe incluso si las páginas anteriores parecían coherentes.

**Agotar la paginación no demuestra snapshot ni vigencia.** Se conserva siempre `ImpactResult.coherence: 'caller_supplied_not_verified'`. No existe `snapshot_verified: true`, equivalente afirmativo ni revisión inventada. El lector depende del contrato de invalidación del adaptador; no puede verificar de forma independiente que un store defectuoso no haya omitido registros o terminado prematuramente.

La prueba física de escritura tras la página terminal demuestra el límite: SQLite devuelve el último registro, otra conexión lo actualiza antes de que el lector retome el control y no queda un cursor posterior con el que detectar el cambio. La lectura termina `exhausted` y `not_verified`, y el análisis representa los valores leídos. No se afirma que represente el estado más reciente.

No se usa `withWriteFence`, ni se crean conexiones, transacciones o bloqueos desde el lector. El adaptador existente conserva sus transacciones de lectura consistentes por llamada; eso no amplía las garantías del puerto entre llamadas.

## Evidencia física y regresiones

Entorno: Windows, Node **v24.15.0**, pnpm **12.3.4**, Vitest **4.1.11**. SQLite temporal en archivos reales con WAL y adaptadores `SqliteKnowledgeAdapter` físicos; no se sustituyó SQLite por un mock en concurrencia. Los interceptores de pruebas coordinan el momento de los commits desde una segunda conexión o alteran respuestas para probar defensas; la invalidación concurrente la produce el adaptador real.

`knowledge/test/knowledge-impact-reader.test.ts`: **49 casos**, incluidas parametrizaciones:

- Inventario vacío; aplicación con varios módulos y revisiones históricas que no se mezclan con las actuales; dos aplicaciones con IDs compartidos y aislamiento estricto en ambos sentidos.
- 205 módulos, páginas de 1/37/100 y resultados idénticos al cálculo puro sobre inventario equivalente. Preservación de profundidad, diagnósticos e inactivos.
- Commit desde otra conexión después de leer la primera página: actualiza un módulo ya leído e inserta antes del límite anterior. SQLite rechaza el cursor realmente; el lector reinicia y obtiene las cuatro entidades actualizadas sin mezclar la página vieja. Dos intentos, seis consultas, una invalidación.
- Agotamiento por escrituras reales en cada intento, probado con uno y tres intentos: dos y seis consultas respectivamente, sin análisis parcial. Las revisiones observadas corresponden a los commits intencionales del escritor.
- Escritura en otra aplicación sin invalidación del ámbito seleccionado; escritura tras la página terminal sin falsa afirmación de snapshot.
- Límite de páginas con cursores físicos distintos y página terminal exactamente en el límite; cursor repetido; cursor opaco defectuoso que SQLite rechaza y cuyos reintentos se agotan.
- Respuestas nulas, incompletas o sobredimensionadas, continuaciones vacías, cursores no válidos, kind/revisión/ID incoherentes, ámbito ajeno en registro y entidad, dependencias inválidas o incompletas, duplicados dentro/entre páginas y orden incorrecto.
- Keys ambiguas delegadas al motor puro; errores operativos sin reintento ni exposición de mensajes; límites inválidos y desacuerdo de aplicación rechazados antes de I/O.
- Solicitud copiada antes de esperas, valores congelados, copias de entidades/dependencias antes de la próxima página y resultados separados entre invocaciones.
- Ausencia de mutación tanto en éxito como en lectura interrumpida, con observador físico independiente.

Prueba de no mutación: una conexión `DatabaseSync` de solo lectura compara antes/después **todas las tablas físicas** (incluidas FTS y sus tablas auxiliares), catálogo `sqlite_master`, revisiones, versiones de aplicación, pragmas `data_version`, `schema_version`, `user_version`, `application_id`, `page_count`, `freelist_count` y hashes SHA-256 del archivo SQLite y WAL. Todos permanecen iguales. También se comprueba que el lector no invoca `commit`, `withWriteFence`, `get` ni `history`; integridad SQLite `ok` y cero errores de claves foráneas. Las escrituras intencionales de concurrencia se prueban por separado y no se presentan como ausencia de cambios del escritor.

| Verificación ejecutada por Codex | Resultado |
|---|---|
| `pnpm run build` | **PASS**, diez paquetes, JS y declaraciones |
| `pnpm --filter @qap/knowledge exec vitest run --reporter=verbose` | **341/341 PASS**, 28 archivos: 260 previos + 32 motor puro + 49 lector |
| `pnpm --filter @qap/engine test` | **168/168 PASS**, 11 archivos |
| `pnpm exec tsc -p packages/knowledge/test/tsconfig.json --noEmit --pretty false` | **PASS**, sin diagnósticos |
| ESLint diferencial de lector, índice y test nuevo | **PASS**, cero errores/advertencias, sin supresiones nuevas |
| Importación ESM de `readKnowledgeImpact` desde `knowledge/dist/index.js` | **PASS**, export público es función |
| `git diff --cached --check` | **PASS** antes del commit de código |

Logs aditivos: [build](015-03_BUILD.txt), [Knowledge con nombres de los casos](015-03_KNOWLEDGE_TEST.txt), [Engine](015-03_ENGINE_TEST.txt). Se normalizaron únicamente finales de línea y espacios finales de los logs para superar `git diff --check`, sin alterar mensajes, casos ni resultados. Las suites ejecutaron las fuentes verificadas que se registraron en el commit de implementación; no se alteraron expectativas previas. El resultado 341 incluye los mismos **32 casos** de 015-02, todos PASS.

Incidentes de entorno conservados: el primer focal dentro del sandbox dio `EPERM` al renombrar caché de Vitest, antes de ejecutar casos; repetido fuera del sandbox pasó. Una invocación inicial con `test --reporter=verbose` fue rechazada por el parser de pnpm antes de lanzar Vitest; se corrigió a `exec vitest run --reporter=verbose`. Los logs enlazados corresponden a las ejecuciones finales exitosas. No se instalaron dependencias ni se modificó lockfile/configuración para conseguir PASS.

## Revisión, pendientes y dictamen

Diff productivo limitado al lector nuevo y una exportación en Knowledge; un archivo nuevo de pruebas. Sin cambios en Engine, Shared, analizador puro, SQLite/schema, MCP, servicios de cierre, PlanHandler, TestHandler, PlaywrightRunner o VNEXT-014. Informe y logs nuevos en este directorio, sin reemplazar el informe previo ni alterar WBS/STATE.

Limitaciones restantes:

1. No hay snapshot atómico ni verificación independiente de exhaustividad/actualidad. Un consumidor que exija esas garantías necesita un contrato de lectura real adicional; este lector no las acredita.
2. Un store que nunca resuelve una consulta no queda limitado temporalmente. Alta contención puede agotar los reintentos y devuelve fallo explícito.
3. Se conserva la pila recursiva y el consumo de memoria del motor puro. Se verificaron 205 módulos, no un benchmark de grafos masivos ni los máximos configurables.
4. Certificación física en esta plataforma/versión de Node. No se ejecutó matriz de otras plataformas ni suites MCP; sus estados históricos, incluidas las 63 identidades de VNEXT-014, no se recertifican ni se cambian.
5. 015-04/05, 016, una capacidad real de snapshot y cualquier integración de flujos quedan fuera del alcance. No son trabajo iniciado ni una declaración de cierre.

**GO técnico exclusivamente para VNEXT-015-03**, bajo el contrato de lectura paginada agotada y snapshot no verificado descrito aquí: concurrencia real, reinicio íntegro, agotamiento seguro, límites, aislamiento y no mutación físicamente probados. Ninguna prueba obligatoria de 015-03 queda pendiente. No se declara terminado VNEXT-015, no se hace merge a develop, rebase, force-push ni publicación npm.
