# VNEXT-003 — Adaptador físico SQLite

Fecha: 2026-10-28. Agente principal único. Base: `077e81922f3599104de5d8f98a75126336ccaf10`.
Rama exclusiva: `feat/qap-vnext-architecture`. Alcance cerrado en VNEXT-003.

## Arquitectura y uso

`SqliteKnowledgeAdapter`, exportado por `@qap/knowledge`, implementa el puerto
`IKnowledgeStore` de Engine sin cambiar su API pública ni las entidades Shared.
Dirección conservada: `shared ← engine ← knowledge`. No utiliza YAML para persistir.
`FileSystemStorage`, Reporter, consumidores legacy y handlers MCP conservan su composición.

```typescript
import { SqliteKnowledgeAdapter } from '@qap/knowledge';

// El compositor crea el directorio padre y elige un archivo dedicado al conocimiento.
const store = new SqliteKnowledgeAdapter('/project/.qamcp/knowledge.sqlite', {
  busy_timeout_ms: 1000,
});
try {
  const modules = await store.query('my-application', 'module', { limit: 50 });
  // Consumir modules; los valores están desacoplados de la conexión.
} finally {
  store.close(); // Idempotente. No elimina el archivo.
}
```

La ruta es explícita, no se buscan ni adoptan bases personales/Reporter. `.qamcp/`
se excluye de Git. No hay configuración automática de MCP/npx ni migración legacy.
El builtin se carga mediante `createRequire` al construir el adaptador: importar
el paquete legacy no carga SQLite. Esto también conserva el prefijo `node:sqlite`
en los bundles; esbuild/tsup inicialmente lo convirtió en `sqlite`, regresión
detectada en CLI y corregida sin modificar consumidores.

## Esquema físico v1

Se usan tablas `STRICT`, parámetros ligados para datos y SQL estático para DDL.

| Tabla | Contenido y restricciones |
| --- | --- |
| `knowledge_scopes` | PK application_id y contador de commits por aplicación |
| `knowledge_revisions` | PK aplicación/tipo/ID/revisión, JSON de entidad y procedencia, commit_version, orden UTF-16 |
| `knowledge_links` | Enlaces salientes ordenados; origen y destino fijados a revisiones mediante FKs compuestas diferidas |
| `knowledge_migrations` | Versión, SHA-256 del DDL conocido, fecha, resultado de integridad y clave local de cursores |

La identidad de proyecto participa en ambas FKs de cada enlace: no existe un
destino en otra aplicación. Las PK indexan identidad/historial; índices adicionales
soportan orden de consulta y búsquedas por referencia destino. `id_order` es UTF-16BE
para conservar el orden de IDs del contrato JavaScript incluso con caracteres astrales.
Los binarios de evidencia no se guardan: ese BLOB técnico solo representa el orden del ID.

Triggers prohíben UPDATE/DELETE de revisiones, enlaces y registro de migraciones,
exigen revisiones consecutivas y limitan observaciones/evaluaciones a revisión 1.
Los enlaces solo pueden insertarse para revisiones del commit abierto: incrementar
el contador de aplicación los sella, impidiendo añadir referencias a historia pasada.
Las FKs diferidas permiten crear padres/hijos en cualquier orden dentro del mismo lote.

Se conserva el JSON de las entidades canónicas, sin duplicar sus interfaces ni
normalizar todos sus campos en columnas. La validación de formas es explícita con
AJV (sin coerción ni eliminación de campos), complementada por los validadores
epistemológicos Shared y la resolución de referencias/DAG. El planificador físico
parte de las reglas del doble VNEXT-002, pero no importa código de tests en producción.
El doble permanece independiente; ambos ejecutan exactamente las mismas expectativas.

## Transacciones, concurrencia y lecturas

1. Se comprueba/clona JSON, formas e invariantes locales antes del bloqueo escritor.
2. `BEGIN IMMEDIATE` obtiene el único bloqueo escritor. WAL no permite varios escritores.
3. Se cargan solo entidades actuales de la aplicación; las revisiones históricas
   explícitas se comprueban por PK cuando se necesitan. Se valida CAS, append-only,
   referencias y ciclos contra el estado final del lote, de hasta 100 escrituras.
4. Se insertan revisiones/enlaces y se incrementa una vez el contador de aplicación.
5. COMMIT valida las FKs diferidas; cualquier error revierte todo, incluido el contador.

Dos conexiones independientes no pueden validar CAS contra un mismo estado y
confirmar ambas una actualización obsoleta. No hay upsert de entidades ni retry
automático del commit. El único ON CONFLICT es la inicialización del contador de scope.
Un requisito no se confirma por `trace.review`, una observación reproducible ni una actualización.
Se conservan los valores/invariantes autoritativos exigidos por Shared.

Cada conexión activa `foreign_keys=ON`, `busy_timeout` entre 0 y 60000 ms (1000 por
defecto) y `synchronous=FULL`. Los archivos físicos exigen `journal_mode=WAL`;
`:memory:` se admite como opción explícita, sin afirmar durabilidad para ese modo.
No hay awaits dentro de una transacción. `DatabaseSync` bloquea el hilo, incluida la
espera de lock: la composición futura debe usar un worker si necesita baja latencia.
La validación global del DAG aún es proporcional a las entidades actuales del proyecto;
no hay benchmark masivo ni garantía de latencia para proyectos enormes.

`get`, `query` e `history` usan transacciones de lectura cortas: registro, enlaces,
versión y página pertenecen al mismo snapshot de la llamada. Paginación SQL con
LIMIT/OFFSET, máximo 100, orden de ID o revisión. Cursor base64url firmado por HMAC,
ligado a archivo, aplicación, consulta y versión de scope; funciona tras reapertura
y entre conexiones del mismo archivo. Un commit local lo invalida; otro proyecto no.
La clave local no es una credencial de aplicación ni un mecanismo de autorización.

## Inicialización y migraciones seguras

`contract_version=1` y `schema_version=1` son conceptos separados.
La única migración autorizada/registrada es **base vacía sin marca (v0) → esquema v1**.
Se ejecuta bajo BEGIN IMMEDIATE; inicializadores concurrentes vuelven a inspeccionar
el estado después de obtener el bloqueo. No hay migraciones de esquemas existentes.

- Se comprueban `PRAGMA user_version`, `application_id=0x5141504b` (QAPK), catálogo
  real de tablas/índices/triggers y checksum del DDL conocido.
- Una base ajena con tablas, una versión desconocida, un DDL alterado o checksum
  inconsistente falla con SCHEMA_MISMATCH; no se adopta, borra, reconstruye ni degrada.
- `integrity_check` y `foreign_key_check` se verifican después del DDL y al reabrir;
  el registro de migración conserva el resultado `ok`. Cambios DDL futuros requieren
  otra versión y una migración explícita revisada, no editar silenciosamente v1.
- La marca/versionado se confirma antes de habilitar WAL; una base incompatible se
  rechaza antes de cambiar su modo de journal. Tests comprueban bytes intactos de
  bases ajenas y con versión futura.
- La comprobación completa de integridad agrega costo de apertura. No se ha simulado
  pérdida de alimentación, corrupción de disco ni recuperación de archivos dañados.

## Errores y datos sensibles

INVALID_DATA: formas/JSON/invariantes inválidos, credenciales conocidas, evidencia
sin máscara o ciclos. CONFLICT: CAS obsoleto/creación duplicada/facto append-only.
REFERENCE_NOT_FOUND: enlaces o dependencias ausentes en el proyecto/revisión.
INVALID_CURSOR: cursor corrupto, de otra consulta/archivo/scope o invalidado.
SCHEMA_MISMATCH: versión/catálogo/migración/integridad incompatibles.
UNAVAILABLE: builtin ausente, apertura/IO, bloqueo agotado, conexión cerrada o fallo SQL.
No se propagan SQL, rutas privadas, payloads ni mensajes del driver en errores del puerto.

Se rechazan recursivamente claves de credenciales/headers sensibles conocidos y
valores no JSON, incluidos Buffer/typed arrays. Evidencia es referencia con PII
declarada enmascarada. El adaptador no detecta secretos ocultos en texto/URLs,
data URIs o contenido codificado: saneamiento/redacción sigue siendo responsabilidad
de ingesta. No se implementó bóveda, cifrado ni autorización multiusuario.

## Compatibilidad realmente ejecutada

SO comprobado: Windows x64, versión reportada `Microsoft Windows NT 10.0.26200.0`.

| Runtime | SQLite reportado | Resultado físico |
| --- | --- | --- |
| Node 24.15.0 (objetivo LTS) | 3.51.3 | 38/38, incluidos 24 contratos |
| Node 22.13.1 | 3.47.2 | 38/38 sin flag; advertencia ExperimentalWarning |
| Node 24.22.1 | 3.53.4 | 38/38 |

Se inspeccionaron las APIs reales de DatabaseSync en 24.15.0 y 22.13.1. El adaptador
usa únicamente constructor, prepare/get/all/run, exec y close; no depende de
timeout del constructor, extensiones, sesiones, backup, funciones ni APIs nuevas.
`busy_timeout` por PRAGMA evita depender del timeout agregado posteriormente.
La [documentación oficial de Node 22.13.1](https://nodejs.org/download/release/v22.13.1/docs/api/sqlite.html)
y la [documentación de Node 24](https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html)
documentan disponibilidad y evolución. El piso comprobado es 22.13.1; no se afirma
compatibilidad con todos los minors de 22, Node 20/18 ni versiones anteriores con flags.
Linux/macOS no ejecutados. No se afirma compatibilidad multiplataforma.

## Verificación y resultados

```powershell
# Desde la raíz del monorepo; TEMP local evita EPERM del caché SSR del sandbox.
New-Item -ItemType Directory -Force node_modules/.tmp-vnext | Out-Null
$env:TEMP = (Resolve-Path node_modules/.tmp-vnext).Path
$env:TMP = $env:TEMP
pnpm --filter @qap/shared --filter @qap/engine --filter @qap/knowledge test
pnpm build
pnpm exec tsc --project packages/knowledge/test/tsconfig.json --noEmit
pnpm exec eslint packages/knowledge/src/storage/knowledge-commit-planner.ts packages/knowledge/src/storage/knowledge-shape.ts packages/knowledge/src/storage/knowledge-sqlite-schema.ts packages/knowledge/src/storage/sqlite-knowledge-adapter.ts packages/knowledge/test/sqlite-knowledge-adapter.test.ts packages/engine/src/__tests__/knowledge-store.contract.ts packages/engine/src/__tests__/knowledge-store.contract.test.ts
# Para otro runtime instalado, desde packages/knowledge:
# <node-exe> node_modules/vitest/vitest.mjs run test/sqlite-knowledge-adapter.test.ts
```

- Shared: 145/145, 15 archivos. Engine: 168/168, 11 archivos (24 contratos en memoria).
- Knowledge: 210/210, 21 archivos: 172 legacy + 38 SQLite físico.
- Total relevante: **523 aprobadas, 0 fallidas**. Las 38 físicas son 24 contratos
  reutilizados + 14 escenarios específicos: reapertura/historia/procedencia,
  conexiones independientes/CAS/cursores, fallo SQL en segunda escritura con rollback
  real y contador intacto, triggers inmutables/sellado y FK diferida al COMMIT,
  WAL/bloqueo/recuperación, versión futura, base ajena intacta, drift, checksum,
  limpieza de perfil temporal, entradas no confiables, parámetros hostiles,
  orden Unicode/aislamiento del cursor y ciclo de vida/errores saneados.
- Bases nuevas y temporales por prueba, cerradas y eliminadas al terminar. Ninguna
  base real/Reporter se usó. La prueba de limpieza borra un directorio de perfil
  simulado independiente; no certifica integración E2E con un navegador real.
- Las 10 compilaciones del monorepo pasan. ESLint de archivos nuevos/modificados:
  0 errores/avisos. TypeScript del proyecto de tests físicos: 0 errores.
- tsc completos de Engine y Knowledge: 36 y 4 diagnósticos legacy respectivamente.
  Se extrajeron los fuentes HEAD base con git archive en directorio temporal
  ignorado y se usaron los mismos tipos instalados. Diagnósticos idénticos tras
  normalizar solo el prefijo temporal; no hay diagnósticos nuevos en esta entrega.
- `pnpm test` global **no pasa**: Auth tiene 2 suites fallidas por Chromium headless
  ausente y errores de teardown (8 tests pasan, 5 omitidos); Playwright Adapter tiene
  3 archivos fallidos (17 fallos, 4 pasan, 5 omitidos). Ambos resultados se reprodujeron
  con fuentes aislados del commit base y las mismas dependencias instaladas.
- En esa ejecución global Knowledge tuvo 1 fallo en route-scanner: al generar 2000
  archivos apareció `tiempo_limite_excedido` antes del límite de archivos esperado
  (207 pasaron en esa versión de 208 tests). El archivo de 16 tests pasa aislado
  en la base y las regresiones relevantes actuales pasan completas. Sensibilidad
  a carga observada; no se declara solucionada ni se atribuye sin prueba a SQLite.
  El comando global se detuvo y no certifica los paquetes posteriores ni E2E.

Los logs de trabajo están en `node_modules/.tmp-vnext/vnext003-*.log` (ignorados,
temporales); este documento conserva los resultados sin exigir esos archivos.

## Archivos y continuidad

- Knowledge: `src/storage/sqlite-knowledge-adapter.ts`, `knowledge-sqlite-schema.ts`,
  `knowledge-commit-planner.ts`, `knowledge-shape.ts`; reexport `src/index.ts`.
- Pruebas: `packages/knowledge/test/sqlite-knowledge-adapter.test.ts` y su tsconfig
  propio para reutilizar fuentes de tests Engine sin ampliar rootDir productivo.
- Engine: suite extraída a `src/__tests__/knowledge-store.contract.ts`; el archivo
  `.contract.test.ts` conserva la invocación al doble. Expectativas sin cambios.
- `.gitignore`, STATE, WBS, encabezado de requisitos y este documento.

No se realizaron FTS5, bóveda, nuevos handlers, crawler, PostgreSQL, migración YAML
ni publicación npm. VNEXT-004 dispone del adaptador físico y versión de esquema
explícita como base; requiere autorización y diseño de migración antes de alterar
DDL. No se inició VNEXT-004. Persisten límites de plataforma, carga y certificación E2E.
