# VNEXT-013-R2 — Vinculación canónica módulo/observaciones

Fecha: 2026-10-30. Base: `cfcbc95e47aa1058aa50828ba7c7cfa82fbb6853`.
Rama exclusiva: `feat/qap-vnext-architecture`. Un agente principal.

**Estado: completada con limitaciones.** Puente real demostrado; entrevista y
confirmación de requisitos siguen fuera del alcance.

## 1. Problema de identidad y alcance

El nombre del plan legacy no es una identidad de negocio ni una prueba de
persistencia. R2 añade una vinculación explícita del host con un DomainModule
existente. No crea módulos, vistas, requisitos, archivos legacy ni herramientas MCP.
No inicia VNEXT-014. Los cierres de VNEXT-013 y R1 se conservan íntegros.

## 2. Declaración del host

El binding de proyecto existente admite `moduleBindings`. Ejemplo sintético:

```ts
knowledgeBindings: [{ projectRoot, applicationId: 'synthetic-app',
  environmentId: 'local', store: alreadyOpenedStore,
  moduleBindings: [{ plannedName: 'catalog', moduleId: 'module-catalog',
    moduleKey: 'catalog-key', moduleRevision: 1, applicationRevision: 1,
    environmentRevision: 1, provenance: 'host_declared' }],
}]
```

Las tres revisiones deben ser las recuperadas realmente por el host. No hay
lookup por título, creación desde args.name o aproximación textual. La ruta real
del proyecto es la validada por el handler; el fingerprint incluye proyecto,
app, entorno, declaración y contexto de sesión/plan. Mismo nombre en proyectos
distintos no comparte recibo. El servidor copia y congela la configuración.
El servicio de recuperación toma una copia separada y valida también el plan.

Se comprueban IDs/key, conflictos entre namespaces ID/key, módulo activo sin
sucesor, revisiones de aplicación/entorno/módulo, WORKING, un único elemento del
plan y estado no terminal, sin auth requerida. Máximo 1000 módulos inspeccionados;
un inventario mayor se bloquea conservadoramente. Ausencia/ambigüedad impide
asociar; puede continuar la adquisición anónima ya autorizada con sus límites.
El prerrequisito es corregir o aportar la declaración explícita del host y las
entidades canónicas; repetir discovery no crea esa identidad.

## 3. Semántica y garantías epistemológicas

`KnowledgeRelation.related_to` relaciona módulo → observación únicamente como
alcance de una ejecución seleccionada por el host. Source y target incluyen
revisiones explícitas. Trace usa `source=module_observation_bridge_v1`, actor
`mcp_host`, review `unreviewed`, entorno y evidencia histórica de la observación.
Su reason contiene un manifiesto JSON versionado de IDs UUID y fingerprint.
No contiene nombres, paths, URLs, labels, configuración libre o errores.

No acredita pertenencia funcional de todas las vistas al módulo, completitud,
reglas, conformidad o confirmación humana. No modifica certainty, validation_status
ni lifecycle. Los enlaces del DOM siguen siendo candidatos de navegación;
las vistas son candidatas observacionales, sin DomainView/route_pattern inventado.
Los selectores siguen sin verificar. El motor VNEXT-009 no se invoca ni se altera.

## 4. Persistencia, atomicidad y alternativa elegida

Se conserva IKnowledgeStore v1, esquema físico, planner y crawler intactos.
Alternativa A descartada: hasta 32 vistas producen 96 escrituras; añadir hasta
64 relaciones excedería las 100 del puerto. Reducir silenciosamente el crawler
o elevar límites rompería sus garantías/consumidores.

Alternativa B: el crawler confirma atómicamente observaciones/evidencias. Después,
el puente recupera los registros físicamente persistidos por ID/revisión y
verifica sesión real, app, entorno, pins contextuales, productor crawler, actor,
ausencia de auth/rol, evidencia histórica idéntica a la embebida y estructura
congruente de vista/observación. Consulta acotada a la revisión del entorno
comprueba que el recibo no omite hechos de esa ejecución UUID (máximo 1000
observaciones inspeccionadas). No usa URL, tiempo, índices de otra ejecución ni
correlación HMAC. Un inventario excesivo se abstiene, sin éxito parcial falso.

Un segundo commit atómico crea las relaciones faltantes (máximo 64). Nunca son
una transacción común con adquisición. Se releen relaciones confirmadas, sin
contar escrituras intentadas como persistidas. No se borran hechos/evidencias.

## 5. Idempotencia y recuperación

ID de relación = SHA-256 con prefijo bridge sobre fingerprint, ejecución y UUID
de observación. `expected_revision=0` impide sobrescritura. Reintentar el mismo
recibo reconoce exactamente las relaciones previas; incompatibilidad produce
conflict. Una nueva ejecución conserva UUIDs y evidencias propios.
El orden de propiedades JSON del recibo y de la declaración del host no altera
la identidad: se normalizan campos antes de persistir y hashear la vinculación.

`association_receipt` conserva el contexto seleccionado **antes** de adquirir y
los UUIDs emitidos por esa llamada real. El host debe retener ese recibo si el
commit de asociación falla completamente. Recuperación explícita por API del
host, sin nueva tool MCP ni navegación:

```ts
import { ModuleObservationBridge } from '@qap/mcp';
const bridge = new ModuleObservationBridge(alreadyOpenedStore, projectBinding);
const result = await bridge.associate('catalog', retainedReceipt);
```

El host aporta projectRoot real y el mismo binding explícito. No se descubre ni
abre SQLite. No hay retries automáticos. El recibo es una declaración privilegiada
del host, **no una firma criptográfica** ni una credencial de autorización pública.
No se acepta como argumento MCP. Si se pierde antes de persistir cualquier edge,
la recuperación exige restituir ese recibo desde el host; no se reconstruye por
heurísticas. Cuando existe al menos una relación, su trace conserva el manifiesto
completo para lectura del estado y revisión por el host.

Se distinguen adquisición no intentada/bloqueada, hechos committed sin asociación,
asociación confirmed/incomplete/blocked/conflict/context_changed/persistence_failed.
Un prefijo válido conserva sus relaciones, y la recuperación crea solo las faltantes.
Recibos con propiedades extra, UUIDs incompatibles o selección truncada se rechazan.

## 6. Concurrencia y límites del puerto

Dos conexiones usan CAS de creación, con rollback de todo el segundo lote ante
colisión. Se reporta conflict y el host puede repetir el mismo recibo, que relee
las relaciones existentes. No se reescriben referencias ni historia.

Se revalida contexto antes y después del commit. Subsiste la ventana del puerto
v1: no permite CAS transversal sobre entidades solo leídas ni sobre lifecycle
en filesystem. Un cambio detectado después del commit devuelve context_changed;
no borra relaciones históricas ni anuncia puente confirmado. Contextos distintos
no se proyectan como vigentes. No se afirma aislamiento serializable entre
filesystem, lecturas de contexto y los dos commits. Cerrar esa ventana requeriría
una microtarea contractual independiente; R2 no agrega una migración o puerto.

## 7. Integración MCP y status

Discovery preserva consentimiento exacto, entorno fijado, aislamiento anónimo,
JS desactivado, sin perfiles/sesiones, sin fallback ni apertura automática de base.
Retiene status histórico como estado de adquisición, explicitado por
`status_scope=acquisition`, `acquisition_status`, `acquisition_persistence`;
añade module_identity_status, association_status, conteos reales, coverage partial,
recibo opaco y código cerrado. Completitud de adquisición no cierra el módulo.

`qap_status.canonical_modules` consulta solo bindings planificados. Máximo 16
módulos, primera página de 100 relaciones por módulo, máximo 16 ejecuciones;
truncated advierte corte. Ausencia de asociación no significa ausencia de hechos.
Se reportan identidad opaca, ejecuciones, tipos/conteos observados, evidencia,
revisiones y necesidad de revisión humana. Lecturas fallidas producen unavailable
sin reflejar errores internos ni modificar onboarding. El inventario Knowledge
previo y las compuertas legacy permanecen.

## 8. Proyección para futuras entrevistas

Proyección solo de lectura sobre registros asociados y evidencias históricas:
vistas candidatas, formularios, controles, required HTML observado y enlaces
candidatos. Incluye referencias de evidencia y limitaciones estáticas. No exporta
labels/valores/selectores/texto libre, no fabrica restricciones no observadas,
no calcula cobertura de negocio ni genera preguntas/requisitos. No alimenta
generateDomHypotheses, rules.yaml o un contexto DOM legacy simulado.
qap_rules_set mantiene su bloqueo y contrato actual. La confirmación de requisitos
necesita autorización y verificación independientes en otra microtarea.

## 9. Pruebas reales, seguridad y privacidad

Fixtures sintéticos: SDK Client/Server MCP real, Chrome del host, HTTP loopback,
MPA de tres vistas y SQLite físico. Se verifica reapertura, referencias revisión 1,
historia intacta, aislamiento, ausencia de requisitos/assessments/inferences/views,
certeza pendiente intacta y lifecycle byte a byte idéntico.

Trigger SQLite rechaza exclusivamente INSERT de relation: sobreviven seis hechos
y tres evidencias; no hay relaciones huérfanas ni éxito falso. Se retiene recibo,
se prueba prefijo parcial explícitamente sembrado como fixture y recuperación sin
HTTP adicional. El puente normal siempre escribe un único lote atómico de edges;
ese prefijo no se presenta como resultado parcial de una transacción SQLite.
Dos conexiones producen conflicto CAS y retry sin duplicados. Cambio de sesión,
conflicto con relación preexistente y nueva ejecución se comprueban separadamente.

Canarios en HTML/labels/URLs/argumentos, key del host rechazada, propiedad extra de
recibo y error del trigger. No aparecen en respuestas ni registros nuevos
SQLite/WAL/SHM; las pruebas previas de errores/logs se conservan. La procedencia
coherente no autentica criptográficamente a un host malicioso con escritura directa
en SQLite. No se emplean sesiones personales ni se amplía autorización GET/red.
La búsqueda del canario en los 39 informes JSON/logs locales de R2 produjo cero
coincidencias, incluidos los recorridos intermedios fallidos y builds.

## 10. Resultados, inventario y deuda

Windows, Node **24.15.0**, Chrome **156.0.8078.48**. Todos los 246 casos existentes
se conservan, más 15 nuevos. No hay skips/todos ni cambios de aserciones históricas.

| Verificación | Base R1 | R2 |
| --- | ---: | ---: |
| MCP completo, 16 archivos | 188/246 | **203/261**, 58 fallos |
| Nuevos R2 | — | **15/15** |
| Discovery completo | 42/42 | **57/57** |
| Dispatcher + SDK | 46/46 | **46/46** |
| State handlers | 21/21 | **21/21** |
| Crawler | 30/30 | **30/30** |
| Knowledge | 258/258 | **258/258** |
| Engine | 168/168 | **168/168** |
| Shared | 146/146 | **146/146** |
| Builds | 10/10 | **10/10** |
| ESLint server sin inline config | 513 | **513** |
| TypeScript amplio MCP | 47 | **47**, firmas idénticas |

Lint de los archivos afectados y pruebas: cero diagnósticos. TypeScript compara
archivo, código y mensaje, normalizando solo coordenadas de línea/columna.
Sin reglas desactivadas, supresiones nuevas o cambios de configuración.
Builds en orden shared, auth, engine, knowledge, playwright-adapter, git-adapter,
playwright-runner, reporter, mcp y cli; los dos últimos se recompilan tras cerrar
el ajuste final de recibos. No se certifica suite global del monorepo.

| Archivo MCP | Pasa/total |
| --- | ---: |
| discovery-handler.test.ts | 57/57 |
| dispatcher-integration.test.ts | 8/8 |
| dispatcher.test.ts | 38/38 |
| e0-investigation.test.ts | 4/4 |
| guidance.test.ts | 7/7 |
| lifecycle-v3-e2e.test.ts | 2/7 |
| p3-verification.test.ts | 5/13 |
| p4-2-pregunta-contract.test.ts | 4/6 |
| p4-3-1-b-block.test.ts | 7/7 |
| p4-3-investigate-before-ask.test.ts | 8/8 |
| p4-4-auth-lifecycle.test.ts | 8/15 |
| p4-5a-integrity.test.ts | 2/12 |
| p4-5a2-integrity.test.ts | 10/26 |
| p4-5s1-browser-candidates.test.ts | 11/11 |
| server.test.ts | 11/21 |
| state-handlers.test.ts | 21/21 |

Los 60 casos conservan IDs y aserciones históricas. R08/R17 recuperados en R1 no
se reabren. Los 32 B dependen todavía de entrevista/cierre legacy y no se declaran
recuperados por una asociación de observaciones. A y D siguen pendientes según
su causa; no se sustituyen por expectativas genéricas de bloqueo.

Fallos restantes cotejados individualmente por archivo y título con el inventario R1:
R01–R07, R09–R16 y R18–R60. Son exactamente **21 A, 32 B y 5 D**, cero sin
clasificación. R2 elimina una dependencia estructural de los B, pero sus pruebas
de entrevista, confirmación, waivers, concurrencia de reglas y cierre continúan
inaccesibles sobre descubrimiento nuevo. No se adjudica cobertura de esos casos.
R08 y R17 siguen aprobados; no se renumera ni reescribe el inventario histórico.

La ejecución inicial dentro del sandbox fue 44/55 con fallos de adquisición;
no se usó como prueba de integración real. Fuera del sandbox se obtuvo 55/55.
La ampliación detectó dos regresiones propias antes de cerrar: copia accidental
del store no clonable y comparación por prototipo de pins SQLite. Se corrigieron
seleccionando solo configuración y comparando kind/id/revision de las referencias;
no se debilitó ninguna revisión ni aserción histórica. Hubo recorridos intermedios
190/260 y 200/261; el resultado de entrega es el último completo indicado arriba.
La normalización final del recibo se verifica con reintento de propiedades reordenadas.

Reproducción desde raíz, binarios instalados, sin descarga:

```powershell
$env:TEMP = (Resolve-Path node_modules/.tmp-vnext).Path
$env:TMP = $env:TEMP
node packages/mcp/node_modules/vitest/vitest.mjs run packages/mcp/src/__tests__ --fileParallelism=false
node packages/playwright-adapter/node_modules/vitest/vitest.mjs run packages/playwright-adapter/src/__tests__/blackbox-crawler.test.ts --fileParallelism=false
node packages/knowledge/node_modules/vitest/vitest.mjs run packages/knowledge/test packages/knowledge/src/__tests__ --fileParallelism=false
node packages/engine/node_modules/vitest/vitest.mjs run packages/engine/src/__tests__ --fileParallelism=false
node packages/shared/node_modules/vitest/vitest.mjs run packages/shared/src/__tests__ --fileParallelism=false
node node_modules/typescript/bin/tsc --noEmit -p packages/mcp/tsconfig.json
node node_modules/eslint/bin/eslint.js packages/mcp/src/server.ts --no-inline-config
```

Chrome/HTTP/junction requieren permisos del entorno. Los comandos MCP/tsc/lint
legacy terminan con error por los fallos documentados. JSON/logs/builds y bases
sintéticas bajo `node_modules/vnext013r2-*` y `.tmp-vnext` están fuera de Git.
No se descargan dependencias ni se modifica lockfile. Los diez builds usan tsup
local, `src/index.ts --format esm --dts` para los ocho primeros y configuración
existente para MCP/CLI. Catálogo de 18 tools, cuatro handlers declarativos y
catorce legacy, autorización, dispatcher y bloqueo de clean conservados.

## 11. Publicación y revisión

Solo los diez archivos de código/tests/documentación enumerados en el commit.
Revisión de diff explícitamente acotada y diff --check; sin bases, logs, dist,
fixtures ni sesiones. La sesión protegida previa se conserva y excluye de staging;
no se usa su sesión ni se lee su contenido o calcula su hash como parte de R2.
No se identifican secretos reales en las adiciones revisadas; los canarios son
sintéticos. Publicación exclusiva en la rama autorizada sin merge/rebase/reset/force.
Entrega identificable por `git log --oneline cfcbc95..HEAD`; commit y HEAD remoto
verificado se informan en la entrega, sin autorreferencia de hash en este documento.

## 12. Dictamen de continuidad

R2 prepara hechos asociados y una proyección acotada; no certifica entrevista,
oráculos, requisitos confirmados ni cadena completa de ejecución. La siguiente
microtarea debe definir confirmación autorizada y persistencia de requisitos,
reconciliar las garantías B y verificar referencias independientemente. VNEXT-014
permanece sin iniciar. Publicar exclusivamente lo comprobado y detenerse.
