# VNEXT-007 — Crawler Black-Box Dirigido con Playwright

Entrega: 2026-10-30. Rama: `feat/qap-vnext-architecture`.
Base verificada: `d338814246622f72466f1b7253829e1cd3f8d834`.
Estado: **completada con limitaciones: adquisición estática anónima**.
La exploración de estados SPA ejecutando JavaScript **no está implementada ni certificada**.
Se aplica el modo limitado seguro permitido por la solicitud; no se inicia VNEXT-008.

## 1. Arquitectura y reutilización

`@qap/playwright-adapter` exporta `BlackBoxCrawler`, contratos de entrada/salida y
`BlackBoxCrawlerError`. Componentes en `src/crawler/`:

- `service.ts`: autorización exacta, BFS determinista, presupuestos, observaciones y persistencia.
- `browser.ts`: Chrome/Edge/Chromium limpios y proxy local que solo destruye conexiones.
- `dom.ts`: extracción estructural por selección positiva en el DOM real de Chromium.
- `types.ts`: contratos públicos, estados y límites.

Se reutilizan `ReconScope`, normalización URL/IP, DNS fijado y `acquire` de VNEXT-006.
El transporte Node comprueba peer/puerto y TLS antes de enviar HTTP. No se reescribe
`PlaywrightAdapter`, ni se llama a su descubrimiento/login. Sus mecanismos de settling
se inspeccionaron: dependen de scripts/MutationObserver y no aportan una garantía de
asentamiento de aplicación con JavaScript desactivado; no se reutilizan en este modo.

No cambian Shared, Engine, `IKnowledgeStore` v1, esquemas SQLite, dependencias ni lockfile.
No se añaden handlers MCP, CLI, inferencias, requisitos, evaluaciones ni pruebas funcionales.

## 2. API pública

```ts
import { BlackBoxCrawler } from '@qap/playwright-adapter';
import type { IKnowledgeStore } from '@qap/engine';
import type { EnvironmentPolicy } from '@qap/shared';

async function acquireMap(store: IKnowledgeStore, environment: EnvironmentPolicy) {
  // Aplicación y esta política exacta deben existir previamente en el store.
  const controller = new AbortController();
  const crawler = new BlackBoxCrawler(store);
  return crawler.run({
    application_id: environment.application_id,
    environment,
    target_url: 'https://app.example.test/',
    authorization: {
      read_only_acknowledged: true,
      navigation_urls: [
        'https://app.example.test/',
        'https://app.example.test/about',
      ],
      allow_public_network: true,
    },
    isolation: 'fresh_anonymous_static',
    limits: { max_pages: 10, max_depth: 3 },
    signal: controller.signal,
  });
}
```

`safe_domains` requiere hosts exactos. Redes privadas requieren `allowed_ips` exactas;
no hay permiso implícito para localhost. Link-local/metadata siguen prohibidas.
`tls_ca` permite una CA explícita, siempre verificando cadena y hostname.
La dependencia opcional `resolver` permite pruebas DNS; el transporte continúa siendo real.
`browser.channel` (`chrome`/`msedge`) o `browser.executable_path` eligen un binario de
confianza. No se aceptan perfiles, argumentos arbitrarios ni browser/context inyectado.
Sin selección se intentan Chrome, Edge y Chromium empaquetado, dentro del mismo plazo.

La salida incluye ejecución, modo, rutas, vistas, relaciones, controles, formularios,
observaciones, evidencias, advertencias, límites, presupuesto y resultado de limpieza.
`completed` significa recorrido estático autorizado completado; no prueba completitud
funcional de la aplicación. `partial` conserva descubrimientos y bloqueos; `blocked`
indica ausencia de vistas por denegación, `indeterminate` ausencia de evidencia concluyente.
Errores cerrados de contrato/contexto/persistencia rechazan sin mensajes del driver/servidor.

## 3. Política de navegación y presupuesto

Solo se adquieren la URL inicial y enlaces encontrados que estén enumerados exactamente
en `navigation_urls` (máximo 32 URLs). El permiso no se expande a todo el dominio.
No se visitan automáticamente otras URLs de la lista que no aparezcan en el recorrido.
La cola BFS ordena candidatos por URL normalizada y elimina duplicados/ciclos. Fragmentos
de enlaces se eliminan: este modo no observa estados de hash routers.

`read_only_acknowledged` obliga al llamador privilegiado a reconocer que sus GET son
observacionales. Una lista conservadora adicional bloquea logout/delete/revoke/reset,
checkout/submit/approve y acciones similares, incluso con codificación anidada o NFKC.
**No demuestra que cualquier GET autorizado sea inocuo**; la semántica de negocio exige
revisión del llamador. Todas las queries se bloquean en este modo, aun si se enumeran.

Redirecciones se procesan manualmente en Node: cada destino se normaliza, autoriza,
resuelve y valida antes de conectar. **Nunca se entrega un 3xx a Chromium**. Se renderiza
solo el HTML final. Un redirect repetido se detiene sin volver a adquirir su destino.
404/500 se registran como respuesta no disponible, sin fabricar una vista observada.
Content-Disposition y contenidos distintos de `text/html` no se renderizan/descargan.

| Presupuesto | Predeterminado | Máximo |
|---|---:|---:|
| Páginas renderizadas/intentos de render | 10 | 32 |
| Profundidad de enlaces | 3 | 10 |
| Tiempo global de adquisición | 30 s | 120 s |
| Tiempo por ruta, incluido HTTP/render/DOM | 5 s | 30 s |
| GET HTTP, incluidos redirects/fallos | 20 | 128 |
| Bytes recibidos/decoded/retenidos, cada contador acumulado | 512 KiB | 1 MiB |
| Redirects por navegación | 3 | 5 |
| Elementos extraídos por página | 250 | 500 |
| Concurrencia/reintentos | 1/0 | fijos |

Se respeta `rate_limit_ms` antes de cada HTTP posterior al primero, dentro del deadline.
No se espera `networkidle`; se usa `domcontentloaded` y extracción acotada. Skeletons,
`aria-busy` o scripts provocan `loading_or_script_dependent`, sin afirmar asentamiento.
No hay reintento automático. Cancelación/deadlines destruyen HTTP y cierran el contexto.
Los contadores de bytes heredan los límites de VNEXT-006: no son bytes TCP/TLS y un chunk
ya recibido puede sobrepasar el umbral sin retenerse. El event loop no ofrece tiempo real.

## 4. Aislamiento y frontera de red

Cada ejecución crea un navegador/contexto anónimo nuevo, sin storageState, cookies,
localStorage, sessionStorage, perfiles ni cachés personales. Nunca se lee/escribe el
archivo de sesión protegido. No hay login, clics, envíos, credenciales ni headers del
entorno en HTTP. Las respuestas al navegador descartan cookies y encabezados arbitrarios.

La frontera de salida consta de:

1. HTTP real exclusivamente por el transporte Node validado y fijado de VNEXT-006.
2. Navegador offline, JavaScript de aplicación desactivado, service workers bloqueados,
   permisos vacíos y descargas deshabilitadas.
3. Routing que solo satisface una navegación principal de un solo uso, con el HTML
   ya adquirido; todo lo demás se aborta. Nunca `continue`, `fallback` ni `route.fetch`.
4. CSP nueva: sandbox sin scripts/forms/popups, default-src none, connect-src none,
   frame-src none, form-action none, base-uri none; solo estilos inline permitidos.
5. Proxy obligatorio de denegación, incluido loopback sin bypass implícito. Acepta la
   conexión y destruye el socket; no interpreta targets ni resuelve/reenvía CONNECT.
6. Resolución de Chromium bloqueada salvo la IP literal del proxy, QUIC/prefetch,
   background networking/sync desactivados y UDP WebRTC no proxied deshabilitado.
7. WebSockets cerrados mediante routing, páginas adicionales cerradas y downloads cancelados.

El proxy se verifica por separado con Chrome **sin routing y sin offline**: observa
conexiones al proxy, falla la navegación y el receptor loopback recibe cero solicitudes.
La prueba integrada verifica ausencia de POST/DELETE, scripts, iframes/srcdoc, popup,
WebSocket, worker, IP metadata, imágenes, refresh y descargas en los receptores sintéticos.
Los scripts de ataque son **impedidos por desactivación**, no ejecutados en una sandbox
JavaScript certificada. No se afirma haber verificado WebRTC activo ni aislamiento OS.

**No se anuncia protección SSRF de un navegador general que ejecute código arbitrario**.
No hay firewall/namespace de SO instalado, inspección de todos los paquetes del proceso ni
certificación de futuras versiones Chromium o vulnerabilidades del navegador. Se soporta
solo este modo restringido, con garantías empíricas para los canales y runtimes probados.
Un servidor autorizado puede implementar por sí mismo un proxy interno: queda fuera de
lo que esta política puede detectar. El consumidor debe mantener la autorización de GET.

Contexto, navegador y proxy se cierran en `finally`, también ante cancelación, driver
ausente, adquisición fallida y errores SQLite. Un fallo de limpieza se informa mediante
`CLEANUP_FAILED`; no se declara cierre exitoso. La limpieza nunca elimina memoria QAP.

Documentación primaria consultada: [routing y red de Playwright](https://playwright.dev/docs/network),
[service workers](https://playwright.dev/docs/service-workers).

## 5. DOM, selectores y privacidad

Se observan enlaces, formularios, botones, inputs/selects/textarea, roles ARIA de catálogo,
diálogos y menús presentes. Visibilidad: visible/hidden/not_evaluable; disabled y required
son hechos del DOM, **no reglas de negocio**. Se enlazan índices de campos y submits por
formulario sin ejecutar controles. Se registran conteos de encabezados/menús y truncamiento.

Selección positiva: tags/roles/tipos de input de catálogo, booleanos, índices y selectores
estructurales compuestos solo por tags HTML de catálogo y `nth-of-type`. No se almacenan
names, IDs, test IDs, min/max, valores, texto de opciones, HTML, título ni etiquetas libres.
Un catálogo cerrado mínimo permite etiquetas como home/about/contact/inicio/ayuda.
Los selectores son candidatos con estabilidad `unverified`, no garantías futuras.

Rutas, incluidas denegadas, se sustituyen por URNs HMAC-SHA256 con clave aleatoria por
ejecución; no se persiste la clave. Nunca aparecen host/path/query/fragmento del enlace.
`authorized_index` permite correlacionar con el orden de entrada de la lista autorizada
sin conservar sus datos. Los enlaces no enumerados tienen solo referencia opaca.
No se ofrecen capturas; no se inventan archivos ni se llama «enmascarada» a una imagen.
`pii_masked: true` corresponde a metadatos estructurales seleccionados, no a píxeles.

## 6. Conocimiento y persistencia

Cada vista realmente renderizada aporta dos `ApplicationObservation`: `navigation_route`
para la visita y `dom_element` para la estructura agrupada, con procedencia `crawler`,
aplicación, entorno, ejecución y fecha. Comparten evidencia real `dom_snippet` cuyo
`metadata.view` contiene la estructura sanitizada; URI `urn:qap:crawler:…`, sin archivo.
La estructura conserva controles individuales y sus selectores como datos observados.

`visited` solo aparece tras goto y extracción. `candidate` no es accesibilidad probada;
`redirected` registra el salto HTTP; `blocked`, `unavailable` e `inconclusive` mantienen
razones cerradas. Relaciones `link_candidate` no se convierten en transiciones funcionales
ejecutadas. Los saltos HTTP tienen `http_redirect`. No se generan hipótesis nuevas.

Sin `module_id` de dominio conocido no se fabrica un `DomainView`; sin esa vista no
se fabrica un `ActionTarget`. `derived_entities_deferred: true` explicita esta decisión.
No se crean módulos confirmados, `ExpectedRequirement`, `ConformityAssessment` ni inferencias.

Aplicación y política exacta deben estar previamente persistidas. Se releen sus revisiones
antes del commit; cambios provocan `CONTEXT_CHANGED`. UUIDs nuevos y `expected_revision: 0`
preservan historia. `KnowledgeTrace` tiene source `blackbox_crawler`, revisión unreviewed,
entorno y evidencia fijada a revisión 1. Un commit atómico contiene tres writes por vista,
máximo 96, compatible con el límite v1 de 100; no se hacen commits parciales por página.

Límites heredados: no hay CAS sobre contexto solo leído ni cancelación de operaciones del
store; existe ventana lectura/commit. Deadline acota adquisición, no un store bloqueado.
El consumidor gobierna cambios concurrentes de autorización y el ciclo de vida del store.

## 7. Verificación empírica ejecutada

Windows, Node **24.15.0**, Chrome instalado, SQLite **3.51.3** con FTS5.
Fixtures HTTP/SQLite temporales propios; sin dependencias nuevas ni datos de usuario.
Dentro del sandbox el HTTP loopback produjo NETWORK_FAILED y fallos esperados de
verificación. Se repitió fuera del sandbox mediante la autorización de herramientas.

| Ejecución final | Resultado |
|---|---:|
| Adaptador completo, cinco archivos | **111/111** |
| Incluidas nuevas pruebas crawler con Chrome real | **30/30** |
| Incluidas pruebas HTTP VNEXT-006 | **55/55** |
| Incluidas legacy adapter/screenshots/auth-classification | **26/26** |
| Shared completo | **146/146** |
| Engine completo | **168/168** |
| Knowledge completo, incluida integración HTTP/SQLite VNEXT-006 | **238/238** |
| Diez builds topológicos | aprobados |
| TypeScript focalizado crawler y recon, incluido tests | sin diagnósticos |
| ESLint crawler, tests e index afectado | sin diagnósticos |

MPA sintética: `/`, `/about`, `/contact` renderizadas; `/missing` devuelve 404 sin vista;
enlace externo bloqueado. Se verifican dos menús y un formulario por vista, controles
requeridos/disabled/hidden, tipos password/email/checkbox/radio, select, botones y diálogo.
Enlaces duplicados y ciclos no multiplican visitas. La SPA sintética incluye URL dinámica
`/items/42`, pushState, timer y skeleton: solo se observan sus shells estáticos; ni el
estado client-only ni el botón asíncrono se presentan como explorados.

Cobertura adicional: redirect autorizado/externo/ciclo, rutas de acción codificadas,
queries prohibidas, esquemas javascript/file, descarga attachment, DNS mixto, DNS fijado
y rebinding posterior, bytes/páginas/profundidad/requests/elementos, timeout de ruta/global,
cancelación activa y previa, ausencia de navegador y cierre de recursos. Proxy probado
sin offline/routing. No se debilitaron controles para ejecutar la aplicación.

SQLite físico: dos adquisiciones preservan historia, reapertura, referencias a evidencia,
aislamiento entre aplicaciones, ausencia de derivados indebidos. Un trigger SQLite falla
al insertar observaciones: evidencia y observaciones se revierten juntas; integrity_check
y foreign_key_check pasan y la siguiente ejecución funciona. Se rechaza revisión contextual
cambiada durante HTTP. Canarios en valores/atributos/etiquetas/paths/HTML/cookies/descargas
no aparecen en resultado ni archivos DB/WAL/SHM. Run máximo: **32 evidencias + 64 observaciones**
en un commit, sin cambiar v1.

## 8. Reproducción

Desde la raíz del repo, PowerShell y dependencias instaladas, con Chrome disponible:

```powershell
$env:TEMP = Join-Path (Get-Location) 'node_modules/.tmp-vnext'
$env:TMP = $env:TEMP
New-Item -ItemType Directory -Force $env:TEMP | Out-Null
pnpm build
Push-Location packages/playwright-adapter
node node_modules/vitest/vitest.mjs run
Pop-Location
Push-Location packages/shared
node node_modules/vitest/vitest.mjs run
Pop-Location
Push-Location packages/engine
node node_modules/vitest/vitest.mjs run
Pop-Location
Push-Location packages/knowledge
node node_modules/vitest/vitest.mjs run
Pop-Location
node node_modules/typescript/bin/tsc --noEmit -p packages/playwright-adapter/test/tsconfig.crawler.json
node node_modules/typescript/bin/tsc --noEmit -p packages/playwright-adapter/test/tsconfig.recon.json
node node_modules/eslint/bin/eslint.js packages/playwright-adapter/src/crawler packages/playwright-adapter/src/__tests__/blackbox-crawler.test.ts packages/playwright-adapter/src/index.ts
```

Build offline utilizado: binario instalado `node node_modules/tsup/dist/cli-default.js`
desde cada paquete, `src/index.ts --format esm --dts`; CLI/MCP usan su configuración.
Logs ignorados bajo `node_modules/.tmp-vnext/vnext007-build-*.log`. No se instala Chromium
ni se cambia el entorno permanentemente. Si loopback está restringido, las pruebas reales
requieren la autorización de herramientas correspondiente; mocks no sustituyen esta prueba.

## 9. Limitaciones y continuidad

Nuevas/deliberadas: solo HTML estático y estilos inline; sin recursos externos, scripts,
sesión, clicks, hash states, queries ni vistas client-side reales. La desactivación de JS
reduce fidelidad de visibilidad y formularios dinámicos. No se cumplen en esta entrega los
criterios de exploración de estados SPA/asíncronos: quedan expresamente limitados. Etiquetas
de catálogo pequeñas, selectores estructurales sin estabilidad, referencias por ejecución
sin correlación histórica automática, no capturas ni entidades derivadas sin identidad.

Heredadas: límites CAS/cancelación store y síncronía SQLite, diagnósticos tsc legacy del
adapter y lint de EnvironmentPolicy descritos en VNEXT-006; no se certifican esos checks
globales ni toda la suite monorepo. Los fallos históricos de tests legacy/route-scanner no
se reprodujeron en estas ejecuciones. No se afirma compatibilidad POSIX/otros Node/Edge
probada ni protección de SSRF de navegadores generales.

La sesión protegida conserva hash Git de contenido
`28e1b8dbec7ccf194440cc4158ec6072c9b9ade4`, fuera de staging/commits.
Se publica solo la rama autorizada, sin force, reset, merge ni rebase.
VNEXT-008 podrá consumir observaciones, referencias y relaciones, pero su interceptor,
inventario de APIs e inferencias VNEXT-009 **no se implementan ni se inician aquí**.
