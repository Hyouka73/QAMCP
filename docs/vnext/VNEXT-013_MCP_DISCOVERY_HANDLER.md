# VNEXT-013 — Handler de descubrimiento black-box MCP

Fecha: 2026-10-30. Base: `8ed569d8953230e6cf694a1130c0ca02cd433fd3`.
Rama exclusiva: `feat/qap-vnext-architecture`. Agente principal único.

## 1. Estado y alcance

**Completada con limitaciones.** Se implementa DiscoveryHandler y se conecta
qap_discover al BlackBoxCrawler existente. Se corrige únicamente la expectativa
obsoleta de clean en server.test.ts y se ajustan las dos pruebas contractuales de catálogo/descripción para
permitir el cambio deliberado de una descripción. No se implementa VNEXT-014.
La suite MCP completa tiene incompatibilidades expresas con el descubrimiento
legacy; no se declara verde ni se certifica la suite global del monorepo.

## 2. Arquitectura y registro declarativo

`packages/mcp/src/handlers/discovery.handler.ts` implementa IMcpToolHandler, sin
importar server.ts. Importa BlackBoxCrawler de @qap/playwright-adapter y crea una
instancia por llamada con el IKnowledgeStore del binding autorizado. No duplica
adquisición HTTP, DNS, TLS, navegador, extracción DOM o persistencia.

createMcpServer registra explícitamente cuatro propietarios declarativos:
status, clean, context y discover. Quedan catorce reservas/implementaciones legacy.
Se elimina el caso funcional discover del switch y sus tres imports exclusivos.
El retorno del dispatcher es definitivo incluso ante error; no hay fallback.
Registro sellado, duplicados y colisiones rechazados, aislamiento por servidor.

## 3. Contrato público MCP

Siguen existiendo 18 herramientas, con discover en posición 9 (índice 8).
Las otras 17 definiciones, todos los inputSchema y los prompts permanecen iguales
al snapshot histórico mcp-catalog-vnext010.json. La prueba compara cada definición
completa, normalizando exclusivamente la descripción de discover tras comprobar
que ha cambiado. No se afirma compatibilidad textual total.

La descripción nueva declara adquisición estática anónima y persistencia canónica;
retira las promesas de sesiones, .qa/modules y avance del ciclo de vida.
profile, profileId y credentials conservan sus esquemas públicos, pero cualquier
presencia de esos argumentos bloquea la ejecución, incluso vacíos. También se
bloquean storageState, cookies, session y auth, aunque no son campos públicos.
headed=true se rechaza: el crawler restringido no ofrece navegador interactivo.
description/tags se validan, pero no se proyectan como conocimiento autoritativo.
name admite texto no vacío de hasta 128 caracteres sin controles; identifica
únicamente el módulo solicitado del plan, no crea un DomainModule.
Argumentos desconocidos, tipos inválidos y presupuestos externos se rechazan.

## 4. Autorización explícita del host

Configuración opt-in en McpServerOptions; no se añade consentimiento al inputSchema:

```ts
const server = createMcpServer({
  projectRoots: [realProjectRoot],
  knowledgeBindings: [{
    projectRoot: realProjectRoot,
    applicationId: 'synthetic-app',
    environmentId: 'local',
    store: alreadyOpenedKnowledgeStore,
  }],
  discoveryAuthorizations: [{
    projectRoot: realProjectRoot,
    applicationId: 'synthetic-app',
    environmentId: 'local',
    environmentRevision: 1, // revisión realmente recuperada del store
    authorization: {
      read_only_acknowledged: true,
      navigation_urls: ['http://127.0.0.1:3000/', 'http://127.0.0.1:3000/about'],
      allowed_ips: ['127.0.0.1'],
      allow_public_network: false,
    },
    limits: { max_pages: 2 },
    dependencies: { browser: { channel: 'chrome' } },
  }],
});
```

El ejemplo exige que esas identidades/entorno/revisión ya existan; no crea una base.
El host reconoce expresamente que GET puede producir efectos en el servidor.
El acknowledgement se copia de la configuración confiable, nunca se inventa.
Se necesita exactamente una configuración por proyecto/aplicación/entorno; ausencia
o ambigüedad bloquea. La revisión del entorno queda fijada: un cambio requiere
renovar deliberadamente la autorización. Se copia la configuración por instancia,
incluidas listas, límites y selección de navegador; el resolver privilegiado conserva
su función. Nunca contiene tokens, credenciales ni storageState.

safe_domains restringe adicionalmente; no concede consentimiento por sí solo.
Dominio/base_url/path, perfiles, cookies, lenguaje natural o destructive_actions_allowed
no autorizan adquisiciones. IPs privadas requieren allowed_ips exacto; red pública
requiere su permiso explícito. El resolver y navegador solo son dependencias del host.

## 5. Resolución determinista de URL

Rutas relativas se resuelven exclusivamente con URL(path, EnvironmentPolicy.base_url).
Las absolutas deben estar escritas en forma canónica exacta y enumeradas literalmente
en navigation_urls. Se rechazan espacios/controles, backslashes, porcentajes,
segmentos . y .., referencias //, credenciales, fragmentos y todas las queries.
Esto rechaza aliases por dot segments, encoding, default ports y normalización de
host/protocolo en una URL absoluta. No hay matching por prefijo ni cambio implícito
de protocolo/puerto/destino. Un path relativo válido tampoco amplía la lista exacta.

Las redirecciones siguen sujetas al alcance exacto del crawler; el test comprueba
que /redirect no envía HTTP a /forbidden. Las rutas de salida son URNs HMAC opacas
por ejecución, sin reconstrucción de URLs. Restricciones más conservadoras que un
resolutor web general: URLs con queries/escapes no están soportadas en esta entrega.

## 6. Vinculación Knowledge y consistencia

Se reutilizan projectRoot y binding de VNEXT-012 (binding se exporta internamente
para evitar otra implementación). Ruta real autorizada, aplicación y entorno
explícitos y store abierto contract_version=1 son obligatorios. Se recuperan las
entidades canónicas y se comprueba su application_id/environment_id. No se descubre,
abre, crea ni cierra un store del host. No se consultan otras aplicaciones.

La política recuperada es la que se entrega al crawler, que compara su contenido
con Knowledge y revisiones antes del commit. El handler también relee la revisión
del entorno antes de iniciar el crawler. Persiste la ventana concurrente de lectura/
commit del puerto v1: no hay CAS sobre contexto solo leído, snapshot transversal,
cancelación de operaciones del store o transacción distribuida MCP/crawler/SQLite.

## 7. Ejecución MPA real y fases legacy

Fixtures HTTP locales, Client/Server/InMemoryTransport y Chrome real: tres vistas
HTML enlazadas, formularios/controles y una ruta secreta no autorizada. Se adquieren
/, /about y /contact; se producen 6 observaciones y 3 evidencias mediante un único
commit. La presencia de una sesión sintética no aporta cookies/autenticación.

Solo WORKING permite explorar; ONBOARDING, SCOPING y WRAP_UP bloquean sin transiciones
automáticas. El módulo debe ser una clave propia del plan (no propiedades heredadas como
toString/__proto__) y no estar closed/waived. Un plan que exige
autenticación se bloquea íntegramente: no se degrada silenciosamente a anónimo.
No se leen perfiles ni sesiones, ni se escriben archivos en .qa/modules/.
El lifecycle permanece idéntico incluso después de adquirir observaciones.

## 8. Resumen estructurado y privacidad

Resultado MCP en contenido text JSON: estado completed/partial/blocked/indeterminate,
application_id/environment_id, módulo solicitado, execution_id, modo, cantidades de
rutas candidatas/visitadas/bloqueadas, vistas, controles, formularios y relaciones.
Incluye rutas opacas/estados/profundidad/status HTTP realmente observado, referencias
de vistas, relaciones link_candidate/http_redirect, limitaciones fijas del crawler,
presupuestos consumidos, límites efectivos, cierre y próxima acción segura.

Selección positiva: nunca se serializa BlackBoxCrawlerResult completo, observaciones,
evidencias, HTML, etiquetas, selectores, texto libre DOM, valores de formularios,
URLs originales, cookies, headers, cuerpos o excepciones externas. Los estados y
conteos proceden de la ejecución, sin convertir candidatos en visitas. HTTP 404/503
no constituye defecto confirmado. Los controles no se anuncian como selectores
estables; tampoco se inventan vistas/módulos de dominio o capturas.

Canarios en HTML, labels, valores, links/query, credenciales rechazadas y errores
del store no aparecen en respuestas/logs ni SQLite/WAL/SHM nuevos. El archivo de
sesión sintética de entrada se conserva; no es un artefacto generado por discover.
No se limpia contenido secreto preexistente ni se promete redacción retroactiva.

## 9. Persistencia y errores

El crawler realiza su único commit atómico de evidencias + observaciones. Un retorno
normal con observaciones acredita committed; sin ellas, not_attempted. El wrapper
no vuelve a escribir. Reapertura, historia (una revisión por observación), referencias
a evidencia revisión 1, foreign_key_check, aislamiento de stores/proyectos y trigger
de fallo atómico se verifican físicamente. No se crean registros ficticios.

PERSISTENCE_FAILED devuelve indeterminate/failed; CONTEXT_CHANGED, CONTEXT_REQUIRED,
INVALID_INPUT o CLEANUP_FAILED se mantienen como códigos cerrados indeterminate,
sin anunciar persistencia. Excepciones del host usan DISCOVERY_UNAVAILABLE fijo.
El crawler no retorna el resultado adquirido cuando lanza antes del commit: en ese
caso el handler no puede entregar execution_id, hallazgos o presupuestos parciales.
No los inventa ni declara que no existió adquisición; persistence=not_attempted
solo describe el commit no intentado. No hay retries automáticos ni doble commit.

## 10. Seguridad, límites y cancelación

Reutiliza el modo fresh_anonymous_static VNEXT-007: contexto nuevo, JS deshabilitado,
sin perfiles/sesiones, service workers, formularios enviados, WebSocket, descargas,
frames o interacción activa. Node adquiere HTTP con DNS/IP/peer/TLS verificados;
Chromium recibe documentos del gateway y mantiene proxy de denegación. No se altera
el transporte ni se mezcla el observador dinámico VNEXT-008.

Límites defaults del crawler: 10 páginas, profundidad 3, 20 requests, 512 KiB,
3 redirects, 250 elementos, navegación 5 s, adquisición global 30 s. El host puede
configurar límites dentro de los caps existentes (32/10/128/1 MiB/5/500/30 s/120 s);
los argumentos MCP no pueden aumentarlos. No retries. Los presupuestos reales se
devuelven con el resultado. La limpieza y el store v1 no tienen deadline duro.

AbortSignal del dispatcher se entrega al crawler; un aborto previo evita lanzarlo.
Cancelación en curso aborta adquisición y espera cierre de browser/proxy. La prueba
activa aborta desde el resolver confiable durante una ejecución real y verifica cero
HTTP y limpieza terminada. No hay timeout del wrapper que abandone el navegador.
CLEANUP_FAILED nunca se convierte en éxito. No hay certificación de aislamiento OS.

## 11. Incompatibilidades legacy y clean

No hay login, reutilización/desverificación de sesiones, auth_wall dinámico,
selectors.json/view.yaml/module.yaml/rules.yaml, hipótesis DOM, entrevistas derivadas
o avance planned→observed/interviewing. Las observaciones no completan módulos,
requisitos, tests o reglas de negocio. KnowledgeInferenceEngine no se invoca.
qap_rules_set y los demás consumidores legacy no reciben archivos inventados para
simular compatibilidad. Su integración canónica exige autorización posterior.

server.test.ts conserva íntegra la generación de reportes y corrige solo clean:
isError=true, blocked, persistent_memory_reset_not_authorized, removed=[], .qa y
ejecución/reporte sintéticos presentes y mismo inventario de archivos antes/después.
No se modifica producción de clean. **El cierre histórico VNEXT-012 permanece
203/204**; los resultados siguientes pertenecen exclusivamente a VNEXT-013.

## 12. Verificación y reproducción

Windows/Node 24.15.0, Chrome instalado, SQLite físico. Fixtures temporales bajo
node_modules/.tmp-vnext. Primer intento dentro del sandbox: nuevas 28/32 y MCP
139/204 por imposibilidad de adquisición/junction y diferencias legacy; no acredita
ejecución real. Repetición permitida fuera del sandbox: primeras nuevas 32/32;
focalizadas posteriores 103/103 (36 nuevas + 38 dispatcher + 8 SDK + 21 estado).
La entrega final agrega la prueba de aislamiento de proyectos.

Resultados finales ejecutados, sin omitir pruebas:

| Verificación | Resultado |
| --- | --- |
| Nuevas discovery, MCP real/Chrome/SQLite | **37/37** |
| Dispatcher VNEXT-011 unitarias + SDK real | **38/38 + 8/8** |
| State handlers VNEXT-012 | **21/21** |
| Conjunto anterior dentro del recorrido final | **104/104** |
| server.test.ts completo | **11/21**, clean/reportes aprobado |
| MCP completo final, 16 archivos | **181/241**, 60 fallos, 8 archivos fallan |
| Crawler VNEXT-007 completo | **30/30** |
| Knowledge completo, 25 archivos | **258/258** |
| Engine completo, 11 archivos | **168/168** |
| Shared completo, 16 archivos | **146/146** |
| Builds de diez paquetes | **10/10**, MCP/CLI recompilados finales |

El recorrido MCP final incluye la corrección de ambas pruebas
contractuales de descripción (snapshot y frase literal) y clean. El recorrido
previo fue 180/241 con 61 fallos, uno de ellos la frase literal legacy de discover;
antes de agregar aislamiento de proyectos fue 179/240. No se atribuyen todos los
fallos al antiguo test clean: ese test ya pasa. No se modifican las otras aserciones.

Se inspeccionaron las firmas y sus fixtures: 60 fallos por dependencias del contrato
discover retirado (llamadas sin binding/consentimiento, sesión/auth_wall legacy,
archivos de módulos/reglas no creados, fase/razón legacy, hipótesis/entrevistas y
transiciones posteriores que ya no se producen). Desglose final:

| Archivo MCP | Pasa / total | Dependencia incompatible |
| --- | ---: | --- |
| lifecycle-v3-e2e | 2/7 | Reglas, entrevistas y transiciones tras discover |
| p3-verification | 4/13 | Hipótesis, archivos, rediscovery e idempotencia legacy |
| p4-2-pregunta-contract | 4/6 | Helper exige discover sin error para continuar |
| p4-3-1-b-block | 6/7 | B6 exige discover sin error antes de inspeccionar guidance |
| p4-4-auth-lifecycle | 8/15 | Siete escenarios discover con perfiles/sesión/auth_wall |
| p4-5a-integrity | 2/12 | Artefactos, razones y estados producidos por discover legacy |
| p4-5a2-integrity | 10/26 | Auth_wall, archivos, preguntas y extracción legacy |
| server | 11/21 | Diez contratos discover/vistas/transiciones legacy |

Las pruebas auth_add de verificación/handoff pasan fuera del sandbox; sus fallos
del primer intento restringido no se contabilizan como incompatibilidades finales.
No se falsifican archivos/estados para restaurar la suite ni se cambian esas pruebas.
La suite global del monorepo y las suites adapter distintas de VNEXT-007 no se
ejecutaron en esta entrega; no se extrapola la certificación de etapas anteriores.

```powershell
$env:TEMP = (Resolve-Path node_modules/.tmp-vnext).Path
$env:TMP = $env:TEMP
packages/mcp/node_modules/.bin/vitest.cmd run packages/mcp/src/__tests__ --fileParallelism=false
packages/playwright-adapter/node_modules/.bin/vitest.cmd run packages/playwright-adapter/src/__tests__/blackbox-crawler.test.ts --fileParallelism=false
packages/knowledge/node_modules/.bin/vitest.cmd run packages/knowledge/test packages/knowledge/src/__tests__ --fileParallelism=false
packages/engine/node_modules/.bin/vitest.cmd run packages/engine/src/__tests__ --fileParallelism=false
packages/shared/node_modules/.bin/vitest.cmd run packages/shared/src/__tests__ --fileParallelism=false
node node_modules/typescript/bin/tsc --noEmit -p packages/mcp/tsconfig.json
node node_modules/eslint/bin/eslint.js packages/mcp/src/handlers/discovery.handler.ts packages/mcp/src/__tests__/discovery-handler.test.ts packages/mcp/src/__tests__/dispatcher-integration.test.ts packages/mcp/src/__tests__/server.test.ts packages/mcp/src/server.ts packages/mcp/src/tool-catalog.ts packages/mcp/src/handlers/state-services.ts packages/mcp/src/index.ts
node node_modules/eslint/bin/eslint.js packages/mcp/src/server.ts --no-inline-config
```

Usar permisos de fixtures HTTP/browser/junction del entorno. Builds offline con tsup
instalado desde cada paquete, orden shared/auth/engine/knowledge/playwright-adapter/
git-adapter/playwright-runner/reporter/mcp/cli; los ocho primeros usan src/index.ts
--format esm --dts; MCP y CLI sus tsup.config.ts. No se descargan dependencias.
Logs de verificación vnext013-* bajo node_modules, fuera de Git.

## 13. ESLint y TypeScript

ESLint de producción, handler nuevo, tests nuevos y contratos: cero diagnósticos.
Incluyendo server.test.ts: cero errores y dos advertencias preexistentes de su
encabezado eslint-disable (no-unsafe-argument/no-explicit-any), que se conserva
por el alcance acotado de la corrección clean. Sin supresiones nuevas ni cambios
de configuración. server.ts --no-inline-config: **622→513**, reducción real
de 109 diagnósticos al retirar el caso. Los límites/supresiones legacy remanentes
continúan; no se promete eliminar su deuda.

TypeScript amplio MCP: **48→48**, cero diagnósticos añadidos, comparando con
server/index base en CompilerHost y excluyendo archivos nuevos solo en la base;
se normaliza orden textual de uniones en los mensajes. Ninguno en el handler/test
nuevos. Typecheck focalizado del handler y dependencias transitivas: dos diagnósticos
legacy en guidance.ts:173 y :470 (el catálogo importa sus directivas), ninguno nuevo.
El primer config temporal focalizado carecía de typeRoots Node; se corrigió al
directorio @types del paquete sin modificar configuración del repositorio.

| Regla @typescript-eslint/… | Base | Final |
| --- | ---: | ---: |
| no-base-to-string | 33 | 23 |
| no-explicit-any | 63 | 53 |
| no-unnecessary-type-assertion | 12 | 10 |
| no-unsafe-argument | 29 | 26 |
| no-unsafe-assignment | 155 | 118 |
| no-unsafe-call | 17 | 16 |
| no-unsafe-member-access | 298 | 256 |
| no-unsafe-return | 9 | 6 |
| require-await | 6 | 5 |
| **Total sin supresiones** | **622** | **513** |

## 14. Limitaciones y continuidad

Solo adquisición estática MPA; shells SPA se reportan partial/script dependent.
Sin autenticación, navegación exhaustiva SPA, selectores certificados, identidad
canónica de vistas/módulos, promoción de observaciones o inferencias automáticas.
No se certifican otros runtimes/SO, navegador general, firewall OS o memoria máxima
de Chromium. Subsisten concurrencia contextual, SQLite síncrono y cancelación v1.
Las pruebas legacy incompatibles permanecen activas; no se relajan ni se omiten.

VNEXT-014 continúa pendiente de autorización. Esta entrega no cambia qap_plan o
qap_test, no implementa Advisor, no integra develop/main ni publica paquetes npm.

## 15. Git y publicación

Revisión de rama/HEAD, diff --check, catálogo, archivos autorizados y búsqueda de
secretos antes del commit. Sesión protegida con modificación previa conservada y
excluida; no se lee su contenido, no se usa ni se recalcula su hash. Fixtures,
SQLite/WAL/SHM, logs y dist no se incluyen. Publicación exclusiva sin force, merge,
rebase o reset. Base remota confirmada por ls-remote. Commit/HEAD remoto final se
informan al entregar; identificar la entrega con `git log --oneline 8ed569d..HEAD`.
