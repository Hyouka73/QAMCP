# VNEXT-008 — Interceptor de tráfico y descubrimiento de endpoints

Entrega: 2026-10-30. Rama exclusiva `feat/qap-vnext-architecture`.
Base exacta: `5f85af41d828bebf75e5f9c919b4f5bb68750625`.
Implementación y pruebas: `ee4da42`; cierre documental en el commit siguiente.
Estado: completada con limitaciones de observación pasiva acotada; no inventario exhaustivo.
VNEXT-009 no iniciada. No handlers MCP, CLI nueva, login, acciones ni sondas de negocio.

## 1. Arquitectura y contratos

`NetworkTrafficObserver`, exportado por `@qap/playwright-adapter`, es un servicio
independiente del crawler y de MCP. `src/network-observer/types.ts` define su API;
`service.ts` contiene gateway, captura, presupuestos y persistencia; `privacy.ts`
contiene referencias y derivación estructural. Depende del puerto `IKnowledgeStore`
y de los contratos existentes de Shared. No importa Knowledge ni Auth en producción.

Reutiliza `ReconScope`, `acquire`, `launchIsolated` y el proxy de denegación. Únicos
cambios compartidos: Origin opcional canónico en el transporte y bandera WebRTC
actual adicional en el lanzador. Las llamadas antiguas no envían Origin; el crawler
estático conserva JS desactivado/offline y sus contratos. Sin dependencias nuevas,
cambio de esquema SQLite, migración ni cambio del puerto v1.

## 2. Modo dinámico explícito

```ts
import { NetworkTrafficObserver } from '@qap/playwright-adapter';

// store contiene previamente ApplicationContext y esta EnvironmentPolicy exacta.
const result = await new NetworkTrafficObserver(store).run({
  application_id: environment.application_id,
  environment,
  target_url: 'https://app.example.test/',
  isolation: 'fresh_anonymous_dynamic_readonly',
  authorization: {
    read_only_acknowledged: true,
    navigation_urls: ['https://app.example.test/'],
    script_urls: ['https://app.example.test/app.js'],
    presentation_urls: [],
    api_read_urls: ['https://app.example.test/api/data'],
    allow_public_network: true,
    query_names: ['page'],
    structural_paths_acknowledged: true,
  },
});
```

Cada ejecución abre Chromium y un contexto limpio, sin perfil personal, storageState,
cookies previas, credenciales o permisos de dispositivos. El modo es obligatorio en
la entrada; no se agrega como default del crawler. Para loopback/privadas se necesita
`allowed_ips` exacto, además de `safe_domains` y del permiso por URL/categoría.

Solo se navega una vez a la URL inicial. Las listas no provocan prefetch ni visitas
adicionales: cada adquisición nace de una solicitud real de Chromium. No hay clicks,
formularios ni reintentos del observador. Solicitudes repetidas producidas por la app
se conservan como eventos distintos, agrupados por endpoint.

## 3. Frontera de red y seguridad empírica

Todas las solicitudes HTTP interceptadas se abortan o se satisfacen con `fulfill`
desde el transporte Node. No se usa `continue`, `fallback`, `route.fetch` ni un
cliente HTTP del navegador para adquirir contenido. El transporte valida URL exacta,
host, puerto, todas las respuestas DNS, IP fijada, peer efectivo y TLS antes de enviar
HTTP. La autorización del dominio nunca concede rutas adicionales. Los GET requieren
consentimiento observacional; el servicio no puede probar inocuidad semántica del servidor.

Se permite únicamente GET; se bloquean POST, DELETE, PUT, PATCH, HEAD, OPTIONS y
métodos desconocidos. Tampoco se realizan preflights por el gateway. Solo documento
inicial del frame principal, scripts exactos, CSS exacto y Fetch/XHR de lectura exactos.
Documento, JS y CSS deben pertenecer al origen inicial; APIs pueden tener otro origen
explícitamente autorizado. Cada recurso conserva además el filtro de categoría.

La segunda frontera es un proxy TCP que destruye conexiones, incluidos CONNECT y
loopback, sin resolver ni reenviar destinos. Chromium usa bypass inverso de loopback,
resolución DNS denegada, QUIC desactivado y política WebRTC de UDP no proxificado.
Service workers se bloquean en el contexto; WebSocket se cierra sin conexión al servidor.
CSP sandbox permite scripts/origen, con listas de scripts/CSS, sin inline/eval,
workers, frames, object, base ni formularios. No permite popups ni descargas; además
se cierran páginas adicionales y se cancelan descargas defensivamente.

**Hallazgo y corrección comprobados:** la bandera heredada
`--force-webrtc-ip-handling-policy=disable_non_proxied_udp` por sí sola dejó llegar
**dos datagramas STUN** al receptor sintético. Se añadió
`--webrtc-ip-handling-policy=disable_non_proxied_udp`, nombre definido por
[Chromium actual](https://chromium.googlesource.com/chromium/src/+/HEAD/chrome/common/chrome_switches.h).
La prueba final crea una oferta WebRTC real, espera su inicialización y 600 ms, hace
Fetch/WebSocket/navegación sin routing ni offline y comprueba cero HTTP/cero UDP al
receptor, con conexiones reales denegadas por el proxy. No se sustituyó la prueba por
un mock ni se desactivó WebRTC mediante un parche JavaScript.

Garantía acotada a Chrome/Windows verificados; no certificación de firewall del SO,
aislamiento de código nativo, navegadores arbitrarios ni futuras versiones de Chromium.
Repetir la prueba de salida al actualizar navegador. Las aplicaciones ejecutan solo
código consentido, bajo estas barreras y límites.

## 4. Semántica de respuestas, MIME y CORS

Ningún 3xx llega al navegador: se conserva el código realmente recibido y se aborta
su entrega, sin seguir Location. Es una política de cero redirects, incluso autorizados.
Content-Disposition bloquea entrega. Se permiten HTML para documento, JavaScript para
scripts, CSS para estilos y JSON/texto plano para lecturas API. Contenido textual UTF-8;
binarios, MIME desconocidos y encodings fallidos no se entregan.

Se preservan código y tipo MIME, sin cookies, encabezados arbitrarios, credenciales,
Content-Length/Encoding originales ni cuerpos persistidos. El navegador recibe no-store,
nosniff y no-referrer. Se conserva CSP del servidor como política adicional restrictiva.
Para APIs de otro origen se envía solo Origin canónico del documento, nunca los headers
de la app o de EnvironmentPolicy. Se respeta ACAO `*` u origen inicial exacto; nunca
se reenvía permiso de credenciales ni se inventa un permiso de exposición de headers.

Se comprobó en el código Playwright instalado que `fulfill` agrega ACAO y credenciales
si falta ACAO. El gateway siempre entrega un ACAO explícito; usa `null` no coincidente
para preservar la denegación de una respuesta sin permiso. Pruebas reales comprueban
éxito anónimo autorizado, fallo por permiso ausente y fallo de credentials:include con
wildcard. Estos últimos conservan HTTP 200 observado y fallo de entrega CORS separados.
APIs con headers personalizados obligatorios/preflight/autenticación no son compatibles.

## 5. Eventos, relaciones e inventario

Los eventos proceden de `request`/routing reales, con tipos `fetch`, `xhr` y `other`.
`other` audita carga de documento/scripts/CSS y bloqueos de recursos; no implica API.
Cada evento tiene UUID, ejecución, vista observada UUID, método de catálogo, referencia
opaca de endpoint, `scope_status`, outcome, resultado del navegador, instante, duración
del gateway, query names seguros y evidencia UUID. Vista es referencia de observación,
no un DomainView inventado sin module_id. La relación vista/evento se conserva en evidencia.

`responded` exige una respuesta HTTP real, incluso 302/503/MIME rechazado. `blocked`
sin status significa denegación antes de adquisición HTTP; `inconclusive` representa
un intento sin respuesta concluyente. `browser_outcome` diferencia entrega finalizada,
fallida, bloqueada o indeterminada. Un error de red no se clasifica como defecto ni se
infiere causa raíz. Un bloqueo de CSP anterior a eventos Playwright puede no producir
evento de solicitud; se advierte expresamente y no se fabrica uno. WebSocket usa conteo
y aviso de bloqueo, sin simular un evento Fetch/XHR.

Inventario por método + origen/path mediante HMAC por ejecución, descartando query values
de la identidad del endpoint. Agrupa repeticiones y conserva todos los estados/eventos/vistas.
Su completitud siempre es `false`; `partial` significa ventana observada, nunca todas las APIs.

## 6. Sanitización y patrones estructurales

No se persisten HTML, JS, texto DOM, cuerpos JSON, mensajes de error/console, encabezados,
cookies, hostnames arbitrarios, rutas arbitrarias ni query values. Las excepciones públicas
son códigos cerrados sin causas externas. Los cuerpos se retienen temporalmente solo para
entregar al browser bajo presupuesto; no se serializan en el resultado ni en SQLite.

Query names deben estar simultáneamente en el consentimiento y en el vocabulario fijo
`page`, `limit`, `offset`, `sort`, `order`. Los demás se cuentan; nunca se conservan nombres
arbitrarios. URLs con nombres token/secret/password/auth/cookie/key/session/credential
se bloquean incluso enumeradas. No se pretende detectar todo secreto posible en una URL;
la protección de persistencia proviene del descarte, no de una denylist como sanitizador.

Sin `structural_paths_acknowledged`, solo referencias opacas. Con consentimiento, únicamente
palabras estáticas de catálogo (`api`, versiones v1–v3, orders/items/users/products/data/list/
status/search), hasta ocho segmentos. Números/UUID solo se sustituyen por `{id}` cuando hay
al menos dos paths distintos con respuestas reales, mismo origen, método y estructura.
Se conservan IDs de muestras que justifican el patrón; se trata de estructura derivada,
no de una regla confirmada. `/api/orders/123` + `/api/orders/456` permiten
`/api/orders/{id}`; una sola `/api/items/789` permanece opaca. Otros formatos permanecen
opacos. Patrones seguros permiten comparación estructural entre ejecuciones; identidad
exacta y origen son opacos por ejecución y no prometen correlación histórica inequívoca.

## 7. Persistencia y revisión contextual

Cada evento de navegador observado produce `ApplicationObservation.kind=network_traffic`
y `MultimodalEvidenceRef.kind=http_recon_metadata`, con metadatos estructurados fuente
`browser_network_gateway`, URI real de metadatos embebidos `urn:qap:network-event:…`.
No se anuncia archivo HAR. Bloqueos prueban un intento/bloqueo, no una respuesta remota.
Se usa `raw_payload` tipado por este servicio: el `network_event` histórico exige status
obligatorio y no debe llenarse con códigos ficticios para bloqueos.

IKnowledgeStore v1 permanece intacto. Cada lote contiene hasta 50 pares evidencia/
observación, máximo **100 writes**, una transacción atómica por lote. UUIDs nuevos,
expected_revision=0, trace unreviewed y evidencia fijada a revisión 1. Se releen contexto
y revisiones antes de cada lote. Los resultados distinguen `committed`, `failed` y
`not_attempted`. Un fallo detiene los lotes posteriores; no hay retry ni atomicidad global
entre lotes. Las observaciones de un lote fallido siguen en el resultado de adquisición,
pero no deben anunciarse persistidas; comprobar `batches`.

Ventana contextual lectura/commit y ausencia de cancelación/CAS de contexto leído son
límites heredados del puerto. El consumidor gobierna cambios concurrentes de política.
No se crean requisitos, inferencias, evaluaciones ni entidades de dominio sin identidad.

## 8. Presupuestos y memoria

| Límite | Default | Máximo |
|---|---:|---:|
| Eventos / endpoints retenidos | 100 | 128 |
| Recursos exactos únicos autorizados | 32 | 32 |
| Adquisiciones, incluidos intentos fallidos | 32 | 128 |
| Bytes acumulados recibidos / decoded / retenidos, cada uno | 512 KiB | 1 MiB |
| Timeout por adquisición/navegación | 3000 ms | 10000 ms |
| Deadline de adquisición | 15000 ms | 60000 ms |
| Ventana posterior a DOMContentLoaded | 500 ms | 3000 ms |
| Concurrencia / retries / redirects seguidos | 1 / 0 / 0 | fijos |
| Documentos navegados / controles contados públicamente | 1 / 500 | fijos |

FIFO y mapas retienen como máximo los eventos permitidos. URLs de entrada/adquisición
se limitan a 8192 caracteres; muestras temporales y metadatos tienen cardinalidad acotada
por 128 eventos. No se retienen bodies fuera del presupuesto acumulado ni headers en
resultados. Las referencias de muestras pueden producir metadatos cuadráticos en el
peor caso, siempre acotados por 128. No es un límite duro de RAM de Chromium/JS ni del
SO. La descompresión y SQLite síncronos conservan límites conocidos de VNEXT-006.

No se espera networkidle. Si hay solicitudes pendientes al terminar la ventana, la vista
es `unsettled`; se cierra el browser, se drenan operaciones acotadas y se conservan sus
resultados reales. Deadline/cancelación cierra el contexto y aborta transporte. Arranque,
cierre y operaciones de store no tienen deadline transaccional garantizado por el puerto;
elapsed incluye persistencia. Avisos fijos señalan límites/eventos omitidos/cierre temprano.

## 9. Pruebas ejecutadas y resultados

Windows, Node **24.15.0**, Chrome **156.0.8078.48**, SQLite **3.51.3** con FTS5.
Solo servidores HTTP/UDP y bases SQLite sintéticos temporales. Sin aplicación externa,
código fuente del producto inspeccionado, datos personales ni credenciales reales.

| Verificación | Resultado |
|---|---:|
| Nuevas VNEXT-008, Chrome y SQLite físicos | 28/28 |
| Adapter completo, primera ejecución paralela | 139/139 |
| Adapter tras corrección UDP, ejecución paralela con builds concurrentes | 138/139; fallo legacy skeleton |
| Adapter final tras corrección UDP, archivos secuenciales, sin builds concurrentes | 139/139 |
| Prueba final salida TCP/UDP sin routing/offline | 1/1; otras 27 no seleccionadas |
| Shared completo | 146/146 |
| Engine completo | 168/168 |
| Knowledge completo | 238/238 |
| Auth focalizada | 34 aprobadas, 1 omitida POSIX |
| CLI auth consumer | 6/6 |
| MCP no filtración | 1/1; otras 14 no seleccionadas |
| Runner session-resolver | 4/4 |
| Diez builds topológicos, afectados recompilados tras arreglo UDP | aprobados |
| tsc observer/crawler/recon incluyendo tests; ESLint archivos afectados | sin diagnósticos |

El fallo legacy corresponde a auth-classification caso 12: esperaba cero botones antes
del timer SPA y encontró dos. Archivo y ruta legacy de ejecución no modificados; primera
ejecución completa aprobada. Repetición completa sin paralelismo de archivos y sin builds
concurrentes: **139/139**, 148.30 s, mismas aserciones y timeouts. El resultado es compatible
con sensibilidad temporal bajo carga; no demuestra causalidad definitiva ni corrige ese test.
No se declara suite global del monorepo verde ni se corrigen otros hitos.

Fetch recibe GET real 200, XHR real recibe 503, skeleton actualiza DOM y genera control.
Negativas: POST/DELETE automáticos, hosts externos/IP privada, JS externo, frames, popup,
formularios, SW/Worker/WebSocket, descarga, redirect externo, DNS rebinding, URL token,
MIME y presupuestos; receptores prohibidos sin hits. CORS ausente/credentialed no accede
a datos pese a respuesta HTTP observada. Concurrencia real máxima uno; cinco solicitudes
de la app permanecen cinco, agrupadas por endpoint sin duplicación del observador.

Canarios en URL/query/header/cookie/JSON/DOM/console/error no aparecen en resultado,
observaciones/evidencias, archivos DB/WAL/SHM ni logs capturados. Errores SQLite con canario
se sustituyen por aviso fijo. Se comprueban recuperación/reapertura, historial nuevo,
referencias fijadas, aislamiento, integrity_check, foreign_key_check, rollback del primer
lote y fallo del segundo tras 50 eventos confirmados. Una ejecución de 112 eventos usa
lotes de 100/100/24 writes. Revisión contextual cambiada impide persistencia.

Intento inicial dentro del sandbox: loopback bloqueado, no válido como certificación.
Pruebas reales repetidas mediante aprobación de herramientas fuera de esa restricción.
También se corrigió en desarrollo el nombre de campo `authorization` a `scope_status`:
el validador defensivo de Knowledge rechaza claves HTTP sensibles a cualquier profundidad.
No se debilitó dicho validador. Un primer comando de consumidores apuntaba al Vitest raíz
inexistente; se corrigió a los binarios de paquete y se ejecutaron las suites indicadas.

## 10. Reproducción

Desde la raíz con dependencias y Chrome instalados:

```powershell
$env:TEMP = Join-Path (Get-Location) 'node_modules/.tmp-vnext'
$env:TMP = $env:TEMP
New-Item -ItemType Directory -Force $env:TEMP | Out-Null
pnpm build
Push-Location packages/playwright-adapter
node node_modules/vitest/vitest.mjs run --no-file-parallelism --maxWorkers=1
Pop-Location
node node_modules/typescript/bin/tsc --noEmit -p packages/playwright-adapter/test/tsconfig.network-observer.json
node node_modules/typescript/bin/tsc --noEmit -p packages/playwright-adapter/test/tsconfig.crawler.json
node node_modules/typescript/bin/tsc --noEmit -p packages/playwright-adapter/test/tsconfig.recon.json
node node_modules/eslint/bin/eslint.js packages/playwright-adapter/src/network-observer packages/playwright-adapter/src/__tests__/network-observer.test.ts packages/playwright-adapter/src/crawler/browser.ts packages/playwright-adapter/src/reconnaissance/transport.ts packages/playwright-adapter/src/index.ts
```

Build ejecutado offline mediante tsup instalado por paquete, topología Shared, Engine,
Knowledge, Auth, Git Adapter, Playwright Adapter, Runner, Reporter, CLI, MCP. CLI/MCP
usan sus tsup.config.ts; demás usan src/index.ts --format esm --dts. Logs ignorados en
node_modules/.tmp-vnext/vnext008-*.log. Shared/Engine/Knowledge completos se ejecutan desde
su paquete con `node node_modules/vitest/vitest.mjs run`.

## 11. Compatibilidad y limitaciones

Modo estático y transporte antiguo permanecen disponibles. No login, sesiones persistidas,
scripts inline/eval, recursos arbitrarios, navegación multiestado, imágenes/binarios,
preflights, solicitudes autenticadas, retries ni seguimiento de redirects. Aplicaciones
que necesitan estas capacidades pueden seguir usando el crawler estático. Solo se certifica
la matriz anterior. Diagnósticos legacy tsc/lint globales de VNEXT-006 continúan fuera de
esta certificación; checks focalizados y builds afectados sí se ejecutaron.

## 12. Git y continuidad

Archivos de entrega exclusivamente del observador, transporte/lanzador mínimos, exports,
pruebas y documentación. Sesión protegida fuera de staging, con hash Git de contenido
`28e1b8dbec7ccf194440cc4158ec6072c9b9ade4` conservado. Sin force push, merges con develop/main,
publicación npm ni artefactos temporales. Identificar commits con
`git log --oneline 5f85af4..HEAD` en la rama autorizada; verificar HEAD remoto tras push.

VNEXT-009 podrá consumir hechos, métodos, patrones seguros y procedencia bajo revisión
unreviewed y consultar lotes realmente confirmados. Esta entrega no infiere requisitos,
certeza ni conformidad y se detiene al publicar VNEXT-008.
