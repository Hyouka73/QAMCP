# VNEXT-004 — Búsqueda léxica de objetivos UI con FTS5

Entrega: 2026-10-28, un único agente. Base autorizada:
`74df4bd71ed344bd12a6766f7648dfe88fd06805`. Rama exclusiva:
`feat/qap-vnext-architecture`. VNEXT-004 termina aquí; VNEXT-005 no iniciada.

## Contrato y arquitectura

Engine define y exporta `IActionTargetSearch`, `ActionTargetSearchRequest` y
`ActionTargetSearchHit` en `packages/engine/src/action-target-search.port.ts`.
El consumidor posee el puerto; Knowledge implementa la capacidad opcional en
`SqliteKnowledgeAdapter`. Se conserva `shared ← engine ← knowledge`, sin cambiar
`IKnowledgeStore.contract_version = 1` ni imponer búsqueda a otros adaptadores.
No hay nuevo handler MCP ni cambios en FileSystemStorage/Reporter/legacy.

Entrada: aplicación obligatoria, consulta literal, límite 1..100 (20 por defecto),
vista, módulo, entorno y rol opcionales. Los dos últimos filtran campos reales
de `KnowledgeTrace`; no son una predicción de dónde funciona el selector. Módulo
se resuelve por el enlace del objetivo a su **revisión fijada** de vista, dentro
de la misma aplicación. Cambiar el módulo de una revisión posterior de vista no
reescribe esa historia. No se inventan campos ni relaciones.

Cada candidato devuelve `target: KnowledgeRecord<'action_target'>` y `score`.
El record contiene identidad/revisión, selector y alternativas, etiqueta completa,
tipo, certeza/confianza existente, estado activo, timestamps, procedencia y enlaces.
No se inventa descripción ni texto visible: ActionTarget todavía no tiene esos
campos. La etiqueta devuelta puede acompañar una coincidencia de selector; no es
un fragmento resaltado ni se afirma que siempre coincida la etiqueta.

Solo se buscan revisiones actuales, activas por defecto. `include_inactive: true`
incluye la revisión actual inactiva, nunca revisiones históricas. La actividad de
los padres no se infiere; sus revisiones están disponibles por los enlaces. No
hay paginación ni total del catálogo; cada llamada devuelve hasta el límite.

```typescript
const candidates = await store.searchActionTargets({
  application_id: 'credit-app', query: 'autorizar crédito', module_id: 'credit', limit: 5,
});
// candidates[0].target.entity.selector / fallback_selectors / accessibility_label
// candidates[0].target.trace y .revision permiten evaluar procedencia/vigencia.
```

## Esquema físico v2 y migración explícita

El DDL y SHA-256 históricos de v1 permanecen intactos. El fixture de pruebas
`test/fixtures/knowledge-sqlite-v1.ts` conserva el inicializador del HEAD base;
la base v1 poblada no se crea degradando una base v2.

| Estructura añadida | Función |
| --- | --- |
| `action_target_search` STRICT | Proyección de una fila por aplicación/ID actual; FK a su revisión original y UNIQUE(application_id,id) |
| `action_targets_fts` | FTS5 con contenido externo en esa proyección; etiqueta, selector, alternativas unidas y tipo |
| Cuatro shadow tables FTS5 | `data`, `idx`, `docsize`, `config`, también verificadas contra DDL conocido |
| Tres triggers | Inserción de revisión sustituye proyección; inserción/borrado de proyección actualizan FTS |
| Registro de migración 2 | Checksum de DDL v2 y shadow tables, fecha, integridad y clave de cursores preservada |

Inicialización vacía: v0→v1→v2 dentro del mismo `BEGIN IMMEDIATE`. Una base v1
debe superar marca QAPK, catálogo exacto, checksum v1, integridad y FKs antes de
añadir DDL v2. Se reconstruye el índice desde la última revisión de cada objetivo,
incluidos inactivos para permitir el filtro explícito. No se modifica ninguna
entidad, revisión, enlace, procedencia, contador de scope ni registro v1.

DDL, backfill, registro y `user_version=2` comparten transacción. Un fallo revierte
todo; la prueba inyecta un fallo al iniciar el backfill después de crear tablas y
triggers, verifica igualdad lógica con v1 y reintenta con éxito. No se simularon
cortes eléctricos ni fallos de disco reales. Sin FTS5, se falla antes de migrar
o cambiar journal; una base v1 poblada permanece idéntica byte por byte.

Cada reapertura valida catálogo/checksums/integridad/FKs, FTS `integrity-check`
con `rank=1` contra contenido externo y concordancia de proyección con revisiones
actuales. Una proyección obsoleta, índice vaciado o estructura desconocida se
rechazan, sin reparación destructiva automática. La reconstrucción inicial se
prueba al migrar; en una reapertura normal el índice persiste y se verifica.
Se rechazan versiones futuras y bases ajenas antes de adoptar datos/cambiar WAL.

Los cursores v1 **no se invalidan por la migración**: la consulta de lectura,
clave HMAC y versiones de scope permanecen iguales. Se prueba un cursor firmado
con formato/clave v1 sobre historial paginado tras migrar. Los commits posteriores
siguen invalidándolos por aplicación conforme al contrato original.
Un adaptador físico antiguo que solo admite esquema v1 rechaza una base v2;
no se implementó downgrade.

## Consistencia, búsqueda y seguridad

La inserción de revisión dispara la sustitución de proyección e índice en la
misma transacción. CAS obsoleto y lotes con referencias inválidas no llegan a
escribir; un fallo SQL posterior a una primera revisión ya indexada revierte
historia, enlaces, índice y contador. WAL permite a otra conexión ver únicamente
lo confirmado; se prueba una escritura con índice modificado sin COMMIT y rollback.
Se conservan WAL/FK/FULL y las garantías de VNEXT-003.

Se usa `unicode61 remove_diacritics 2`. La consulta se normaliza NFC y se divide
en palabras Unicode de letras/números/marcas; cada palabra se cita como literal
y se une mediante OR. Comillas, puntuación, operadores y filtros MATCH recibidos
no se ejecutan como sintaxis privilegiada. SQL liga aplicación, expresión, filtros
y límite como parámetros. Máximo 2048 unidades UTF-16 y 64 palabras; Unicode
malformado y entradas inválidas producen INVALID_DATA. Consulta vacía o sin
palabras devuelve []; una conexión cerrada sigue fallando con UNAVAILABLE.

BM25 pondera etiqueta/selector/alternativas/tipo con 10/4/2/1; menor score es mejor,
con desempate por ID UTF-16. Es un score léxico dependiente del corpus FTS completo,
no confianza ni probabilidad, y no comparable entre llamadas con corpus distinto.
Todos los candidatos, enlaces y filtros están aislados por aplicación. CROSS JOIN
fuerza comenzar por FTS y consultar la proyección por rowid; evita el plan que
repetía MATCH por cada objetivo del scope en la primera medición.

Solo se indexan los cuatro campos permitidos. No se indexan procedencia, entidades
padre, metadata, evidencias, payloads ni credenciales. El guardado mantiene rechazo
de claves sensibles; se prueba que un password añadido se rechaza sin indexar.
Los campos textuales deben llegar saneados: secretos ocultos dentro de una etiqueta
o selector requieren redacción en ingesta, como en VNEXT-003.

Limitaciones comprobadas: léxico, sin embeddings, sinónimos ni stemming español;
`sesión` encuentra `SESION` y forma descompuesta, pero `sesiones` no. `tasaInteres`
es una palabra y no encuentra `Interes`. CSS/XPath se tokenizan como texto, no se
ejecutan ni comparan estructuralmente; guiones y signos se separan. OR mejora
recuperación con prosa breve pero palabras comunes pueden añadir candidatos.
Emoji solo no produce palabras; Unicode61 usa su propia versión Unicode y no
se garantiza equivalencia lingüística para todos los sistemas de escritura.

## Pruebas y compatibilidad comprobadas

Windows x64, NT 10.0.26200.0. Todos los archivos son temporales y dedicados a tests;
no se abrieron bases de Reporter, legacy `.qa/` ni bases personales.

| Runtime real | SQLite | FTS5 | Resultado |
| --- | --- | --- | --- |
| Node 24.15.0 | 3.51.3 | Sí | 62/62 físicas/búsqueda/capacidad; suites relevantes 547/547 |
| Node 24.22.1 | 3.53.4 | Sí | 62/62 físicas/búsqueda/capacidad |
| Node 22.13.1 | 3.47.2 | **No** | 1/1 prueba de capacidad/rechazo y preservación de v1 |

Node 22.13.1 podía ejecutar VNEXT-003, pero este binario no soporta v2 con FTS5.
La primera ejecución allí de las 60 pruebas físicas/búsqueda entonces existentes
tuvo 59 fallidas y 1 aprobada por ausencia del módulo. Se diagnosticó directamente
`no such module: fts5`, y se añadió preflight explícito: UNAVAILABLE con mensaje
`Knowledge store requires SQLite FTS5`, sin cargar extensiones nativas. No se
declara soporte Node 22 para v2 ni para otros minors/builds no ejecutados.

Verificación final: Shared **145/145** (15 archivos); Engine **168/168** (11);
Knowledge **234/234** (23: 172 legacy + 38 físicas anteriores + 23 búsqueda/migración
+ 1 capacidad). Total **547**, cero fallidas. Las 24 expectativas contractuales
SQLite anteriores se conservan. `pnpm build`: los 10 paquetes pasan. TypeScript
del proyecto `packages/knowledge/test/tsconfig.json` y ESLint de archivos de entrega:
sin diagnósticos. No se afirma haber eliminado los diagnósticos completos de tests
Engine/Knowledge documentados en VNEXT-003.

`pnpm test` global se intentó: Auth tiene 2 archivos fallidos/2 aprobados,
8 tests aprobados/5 omitidos por Chromium ausente y teardown. Playwright Adapter
tiene 3 archivos fallidos, 17 tests fallidos/4 aprobados/5 omitidos. Se reprodujeron
con fuentes base aisladas y las mismas dependencias mediante aliases temporales;
sus hashes Git coinciden con el HEAD autorizado (cero diferencias). Son fallos
preexistentes y no se corrigieron en VNEXT-004. Knowledge pasó sus 232 pruebas
entonces existentes en la ejecución global; route-scanner no repitió allí su fallo
de tiempo conocido. No se declara resuelto ni se certifican global/E2E/paquetes
posteriores a la interrupción del comando recursivo.

Comandos desde raíz (TEMP/TMP locales evitan EPERM de caché SSR):

```powershell
$env:TEMP = (Resolve-Path node_modules/.tmp-vnext).Path
$env:TMP = $env:TEMP
pnpm --filter @qap/shared --filter @qap/engine --filter @qap/knowledge test
pnpm build
pnpm exec tsc --project packages/knowledge/test/tsconfig.json --noEmit
pnpm test
# Desde packages/knowledge, con cada node.exe disponible:
# <node.exe> node_modules/vitest/vitest.mjs run test/sqlite-knowledge-adapter.test.ts test/action-target-search.test.ts test/sqlite-fts-capability.test.ts
# En Node 22.13.1 ejecutar solo sqlite-fts-capability.test.ts para el rechazo esperado.
```

## Medición local reproducible y ejemplos reales

Catálogo determinista de 1200 objetivos, cuatro etiquetas alternadas, IDs y
selectores numerados, lotes de hasta 100 escrituras, límite 10,
15 consultas por caso. Latencia incluye lectura transaccional/hidratación;
no es una garantía de producción ni umbral absoluto. Medición en la suite
relevante final, Node 24.15.0:

| Consulta | Candidatos | Primer resultado | Mediana ms | p95 ms |
| --- | --- | --- | --- | --- |
| `autorizar credito` | 10 | target-0000: Autorizar crédito | 2.815 | 3.872 |
| `tasa de interes` | 10 | target-0001: Tasa de interés | 3.976 | 5.433 |
| `#control-731` | 10 | target-0731: #control-731 | 5.814 | 6.665 |
| `nonexistent` | 0 | — | 0.286 | 0.653 |

Node 24.22.1: medianas 2.487/3.775/5.380/0.173 ms y p95
3.271/4.814/6.770/0.356 ms en esos mismos casos. La prueba imprime JSON con
runtime, tamaño, conteo, primeros tres IDs y tiempos. CSS compartido `control`
añade otros resultados; el 731 aparece primero. Pruebas pequeñas verifican
`credito`→`#authorize-credit`, `loan-approval`→su selector alternativo, y tras
actualizar la etiqueta `reporte` encuentra revisión 2 mientras `credito` ya no.

## Continuidad y riesgos

El adaptador sigue siendo optativo y síncrono; apertura verifica todas las
revisiones/proyección e índice y puede costar en catálogos grandes. Hosts sensibles
a latencia necesitan composición en worker. No se midieron grandes proyectos,
corte de energía, Linux/macOS ni concurrencia multihilo intensiva.

La capacidad deja preparada recuperación léxica para consumidores futuros. No
implementa ni depende de bóveda. VNEXT-005 conserva autorización pendiente y sus
requisitos empíricos propios. Ningún cambio en develop/main, publicación npm,
embeddings, crawler, Advisor, PostgreSQL, herramientas MCP o migración YAML.
El cambio previo en `admin-user.json` se conserva fuera de los commits.

Commits de implementación: `62935d1` (puerto Engine), `90e7873` (migración,
adaptador y pruebas). El commit documental se identifica con
`git log -1 --format=%H -- docs/vnext/VNEXT-004_FTS5_SEARCH.md`.

Referencias primarias: [SQLite FTS5](https://sqlite.org/fts5.html) para tokenizer,
contenido externo, BM25 e integrity-check; [Node 22.13.1 SQLite](https://nodejs.org/download/release/v22.13.1/docs/api/sqlite.html)
para APIs base. La disponibilidad FTS5 indicada arriba procede de los binarios ejecutados.
