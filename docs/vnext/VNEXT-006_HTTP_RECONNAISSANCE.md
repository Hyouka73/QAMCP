# VNEXT-006 — Reconocimiento pasivo HTTP y detección de stack

Entrega: 2026-10-28. Rama exclusiva `feat/qap-vnext-architecture`.
Base inspeccionada: `442596108908c5aaa4157ee17697d95e21db9a64`.
Implementación y pruebas: `8d488b7`; documentación de cierre en el commit siguiente.
Estado: implementada y verificada, con las limitaciones de entorno y contrato descritas abajo.
VNEXT-007 no iniciada.

## 1. Objetivo y alcance

Adquirir observaciones iniciales black-box mediante GET explícitamente autorizados,
sin código fuente, Chromium, ejecución JavaScript, cookies, credenciales ni navegación.
Se inspeccionan la URL inicial y, si están autorizados, `/robots.txt` y `/sitemap.xml`
del **origen solicitado**, sin recorrer sus ubicaciones, scripts o sitemaps anidados.
Los resultados HTTP, incluidos 404/500 y ausencia de encabezados, no son diagnósticos
de vulnerabilidad ni clasificaciones de defectos.

## 2. Diseño arquitectónico

`@qap/playwright-adapter` exporta `ReconnaissanceService`, los contratos de entrada y
salida y `ReconnaissanceError`. Implementación separada en `src/reconnaissance/`:

- `service.ts`: composición, contexto, ejecución secuencial, observaciones y commit.
- `network.ts`: consentimiento por recurso, normalización, presupuesto y autorización IP.
- `transport.ts`: GET Node HTTP/HTTPS, DNS fijado, comprobación del peer, lectura acotada.
- `metadata.ts`: selección positiva HTTP/TLS, señales y candidatos deterministas.
- `types.ts`: API pública y errores cerrados sin mensajes externos.

El módulo depende de tipos Shared/Engine y de builtins Node; no importa Knowledge,
Auth, Playwright ni un navegador. El paquete conserva sus exports legacy. El consumidor
inyecta `IKnowledgeStore`; se utiliza el adapter SQLite existente sin dependencia circular.
Las pruebas cruzadas importan los builds de los paquetes, sin añadir dependencias.

Extensión aditiva mínima: `EvidenceKind` incorpora `http_recon_metadata`. Los dos
validadores de Knowledge aceptan ese valor tanto independiente como embebido. Los
metadatos sanitizados residen en `evidence.metadata`, con URI `urn:qap:recon:…`;
**no representan un HAR ni un archivo externo inexistente**. No cambia el puerto v1,
el esquema físico SQLite ni los tipos históricos de evidencia. Shared prueba ambos.

D-003: consentimiento técnico por entorno, URL, puerto e IP. D-006: adquisición sin
repositorio. D-007: sin estados de autenticación ni credenciales. D-011: hechos y
candidatos separados, sin promoción a confirmado. D-013: aplicación, entorno,
ejecución, procedencia y evidencias enlazadas.

## 3. API pública

```ts
import { ReconnaissanceService } from '@qap/playwright-adapter';
import type { IKnowledgeStore } from '@qap/engine';
import type { EnvironmentPolicy } from '@qap/shared';

async function inspect(store: IKnowledgeStore, environment: EnvironmentPolicy) {
  // ApplicationContext y esta política exacta deben estar previamente en el store.
  return new ReconnaissanceService(store).run({
    application_id: environment.application_id,
    environment,
    target_url: 'https://app.example.test/',
    authorization: {
      allowed_urls: [
        'https://app.example.test/',
        'https://app.example.test/robots.txt',
        'https://app.example.test/sitemap.xml',
      ],
      allow_public_network: true,
    },
    limits: { max_requests: 3 },
  });
}
```

`environment.safe_domains` contiene hosts exactos, nunca coincidencias por substring
ni comodines; IPv6 se expresa entre corchetes. Cada `allowed_urls` autoriza el GET de
un recurso exacto, incluidos path/query y origen/puerto. Los puertos por defecto,
IDNA, IP numéricas y el punto DNS final se normalizan con WHATWG URL. No se aceptan
credenciales, controles, backslashes, fragmentos, puerto cero o esquemas distintos.
Una URL relativa en Location se resuelve y después se somete a la misma autorización.

Para pruebas privadas/locales se debe incluir, por ejemplo, `allowed_ips: ['127.0.0.1']`;
los dominios seguros por sí solos no autorizan redes privadas. El permiso público está
desactivado por defecto. `tls_ca` admite una CA explícita por ejecución manteniendo
verificación de cadena y hostname. No se modifica el trust store del sistema.

El segundo argumento opcional del constructor es `ReconResolver`, exclusivamente
para resolución DNS inyectable. El transporte y la comprobación del peer son reales.
La entrada se clona para evitar cambios del llamador durante la ejecución.

La salida incluye ejecución, estado `completed | partial | indeterminate`, destinos
sanitizados, tres recursos con estado/razón, HTTP/TLS, redirecciones, descubrimiento,
señales, candidatos, observaciones, evidencias, advertencias y contadores. Cada recurso
distingue `exists | absent | blocked | unavailable | limited`; un 500 es `unavailable`
con su código observado, sin atribuir causa. `failed_url`, cuando procede, identifica
el intento autorizado fallido; `effective_url` conserva la última respuesta recibida.

Errores de contrato/contexto/persistencia rechazan con `ReconnaissanceError` y un
código cerrado. Fallos de red y límites producen recursos parciales/indeterminados.
No se propagan stack traces ajenos, causas, mensajes DNS/TLS/SQLite o datos del servidor.

## 4. Controles de red y ejecución

Antes de transmitir HTTP se comprueban esquema, host, recurso, puerto, contexto,
resolución DNS completa, IP seleccionada y peer conectado. Se rechazan respuestas DNS
mixtas que incluyan alguna IP fuera del permiso. `lookup` se sustituye por la IP ya
validada, fijando también su familia; no existe segunda resolución TOCTOU. Se comprueban
dirección y puerto del socket antes de `req.end()`. Cada redirect vuelve a validarse.
No hay proxy del entorno, pool compartido, cookie jar ni envío de `EnvironmentPolicy.headers`.

IPv4, IPv6 comprimida y IPv4-mapped se canonicalizan. Redes locales/privadas, CGNAT,
rangos reservados y IPv6 fuera del unicast público requieren IP exacta explícita.
Link-local, multicast, unspecified, prefijos de traducción/6to4 y endpoints de metadatos
conocidos se deniegan incluso si se enumeran. No se aceptan permisos CIDR amplios.
Un permiso exacto privado es una decisión privilegiada del consumidor, no descubrimiento.
Esto no detecta proxies a servicios internos implementados por una aplicación autorizada.

| Presupuesto | Predeterminado | Máximo configurable |
|---|---:|---:|
| GET totales, incluidos redirects/fallos de conexión | 3 | 12 |
| Timeout por operación, incluido DNS | 5000 ms | 30000 ms |
| Deadline global de adquisición, incluido pacing | 15000 ms | 60000 ms |
| Bytes recibidos acumulados | 256 KiB | 1 MiB |
| Bytes descomprimidos acumulados | 256 KiB | 1 MiB |
| Contenido temporal retenido acumulado | 256 KiB | 1 MiB |
| Redirects por recurso | 2 | 5 |
| Concurrencia / reintentos | 1 / 0 | fijos |

Los headers tienen además un límite de parseo de 16 KiB. Los contadores incluyen
campos/status HTTP e informativas 1xx y bytes del body recibido; no representan tráfico
TLS/TCP ni framing de chunks. El socket se destruye al superar un límite o deadline.
Un chunk ya entregado por Node puede hacer que `received_bytes` sobrepase el presupuesto;
no se conserva ese chunk ni se continúa descargando. DNS tardío no inicia una conexión.

Se pide `Accept-Encoding: identity`; si el servidor comprime, gzip/deflate/br se
descomprimen con `maxOutputLength` nativo y presupuesto acumulado. Codificaciones
desconocidas/corruptas, cuerpos incompletos y exceso de volumen tienen razones distintas.
El contenido se retiene solo temporalmente hasta inspeccionarlo; nunca llega al resultado.
`rate_limit_ms` se respeta entre operaciones dentro del deadline global.

La exploración HTML limita trabajo a 1024 tags de hasta 4096 caracteres. La descompresión
síncrona está acotada en volumen y puede ocupar el hilo brevemente. Node no garantiza
interrumpir exactamente en el milisegundo si el event loop está bloqueado.

## 5. Modelo y sanitización

Cada respuesta HTTP real produce una `ApplicationObservation` nueva, `kind:
network_traffic`, `observed_by: recon`, ID UUID, app/entorno, fecha, `session_id` igual
al ID de ejecución, URL sanitizada, status y evidencia. Una operación denegada o un
handshake sin respuesta HTTP no fabrica evidencia de una respuesta inexistente.

Selección positiva antes de construir observaciones, reportes o persistencia:

- HTTP: tipo de contenido categorizado, presencia de seis encabezados de seguridad,
  HSTS numérico/flags, nombres de directivas CSP de catálogo, frame-options enum,
  nosniff, CORS categorizado y atributos agregados de cookies sin nombres/valores.
- URLs: se elimina todo query/fragmento y cada ruta arbitraria se reemplaza por
  `/[redacted]`; solo `/`, `/robots.txt` y `/sitemap.xml` permanecen literales.
  Un Location fuera del consentimiento no se reproduce ni siquiera como destino bloqueado.
- TLS: protocolo negociado, validación y hostname, fechas ISO, huella pública SHA-256;
  sujeto/emisor normalizados a atributos ordenados y **hasheados**, sin texto arbitrario.
- robots/sitemap: solo conteos, nunca rutas, ubicaciones o user agents. Sin resolución XML
  de entidades; DOCTYPE/ENTITY se consideran formato inesperado. Los conteos son aproximados.
- Señales: etiquetas fijas; ningún valor arbitrario HTTP, HTML, versión o error es conservado.

El puerto Knowledge sigue siendo una segunda validación, no el sanitizador principal.
No hay logs de red en el servicio. Las pruebas contienen canarios en HTML, paths, queries,
CSP, cookies, headers desconocidos, errores y ubicaciones. Se comprueba su ausencia en
salida serializada, observaciones, consultas y archivos SQLite/WAL/SHM.

TLS nunca usa `rejectUnauthorized: false`. La CA sintética se confía solo en las pruebas
que lo piden explícitamente, con SNI `recon.test` y verificación de hostname. Ante TLS
inválido no se transmite HTTP; se registra `TLS_FAILED`, validación fallida y hostname
`undetermined`. No se hace un segundo probe inseguro para recuperar el certificado
rechazado: sus detalles pueden quedar indisponibles y se informa expresamente.
Un fallo genérico de handshake no permite distinguir expiración, CA o configuración remota.

## 6. Tecnologías y separación epistemológica

Hechos: etiquetas como `server_nginx`, `powered_next`, `resource_next`, `metadata_react`.
Procedencia `http_header`, `html_metadata` o `html_resource`, asociada al recurso/evidencia.
Candidatos iniciales: Next.js, React, Angular, Vue, WordPress, Express, nginx y Apache.
Cada candidato referencia sus señales y expresa fuerza `suggestive` o `strong` (más de
una señal independiente del catálogo). Siempre `status: candidate`; el catálogo no prueba
autenticidad de headers ni confirma una tecnología. Sin señales: `undetermined`.

SQLite conserva los hechos y su procedencia; los candidatos son un resumen derivado en
la salida y pueden recalcularse a partir de las señales. No se crean `AgentInference`,
requisitos, revisiones humanas, verificaciones de conformidad ni promociones epistemológicas.
No se descargan scripts ni se ejecuta JS. El reconocimiento no es el motor VNEXT-009.

## 7. Integración SQLite

Se exige aplicación y política de entorno exacta previamente persistidas en la misma app.
Se comprueban contexto y revisiones antes de adquirir y otra vez antes del commit.
Las nuevas evidencias y observaciones se escriben en **un solo commit atómico**, con
`expected_revision: 0`, `KnowledgeTrace` de fuente `http_reconnaissance`, revisión humana
`unreviewed`, entorno y evidencia referenciada a revisión 1. El planner fija los demás
enlaces conforme al puerto. Cada repetición añade UUIDs nuevos; no sobrescribe historia.

No hay cambio físico de esquema ni base adicional. Las pruebas crean una base temporal
propia, la reabren, comprueban historia/enlaces y aislamiento a/b, y fuerzan un trigger SQL
que falla al insertar la primera observación, después de haber intentado escribir evidencia.
Todo se revierte y un intento posterior funciona. Otro test cambia una revisión contextual
durante HTTP y verifica rechazo sin observaciones ni evidencias huérfanas.

El puerto v1 no tiene cancelación ni precondiciones CAS para registros solo leídos.
Por ello el deadline global acota **adquisición**, no una operación de store bloqueada;
el tiempo total reportado incluye persistencia. Existe la ventana habitual entre la última
lectura contextual y el commit si un tercero cambia la política. No se anuncia aislamiento
de autorización transaccional ni RBAC que el puerto no implementa. SQLite usa su timeout
de bloqueo existente y su transacción serializable; el consumidor debe gobernar cambios de
políticas concurrentes y el ciclo de vida del store. No se amplía v1 para resolver otro hito.

## 8. Pruebas y resultados ejecutados

Windows, Node **24.15.0**; SQLite **3.51.3**, FTS5 habilitado. Sin dependencias nuevas.
OpenSSL solo generó los fixtures comprometidos; no se requiere para ejecutar las pruebas.
Certificado/clave no productivos: `test/fixtures/recon-tls/`, válidos hasta 2036-10-25.
No se instalaron certificados en el SO ni se usaron servicios externos.

| Verificación ejecutada | Resultado |
|---|---|
| Shared completo | 146/146 |
| Engine completo | 168/168 |
| Knowledge completo final | 238/238, incluidos los 4 de integración |
| Integración SQLite final, con cuarto test de revisión contextual | 4/4 |
| Adapter: pruebas nuevas finales | 55/55 |
| Adapter completo durante comparación | 80/80 (26 legacy + 54 nuevas); después se añadió el test 1xx, incluido en las 55 finales |
| Adapter base exacta `4425961`, copia temporal y mismos binarios | 26/26 |
| Auth focalizada: vault, sesión, manager | 34 aprobadas, 1 omitida POSIX |
| CLI auth consumer | 6/6 |
| MCP canario de no filtración | 1/1, otras 14 no seleccionadas |
| Runner session-resolver | 4/4 |
| Build topológico de los diez paquetes | aprobado, incluidos CLI/MCP |
| tsc recon incluyendo sus tests, tsc Knowledge tests | sin diagnósticos |
| ESLint del código nuevo, tests y archivos Knowledge/index afectados | sin diagnósticos |

Cobertura empírica: respuestas válidas/sin señales, headers presentes/ausentes, 404/500,
redirect autorizado/bloqueado/límite, budgets de requests/bytes/descompresión/retención,
timeout por request/global/DNS, truncamiento, compresión corrupta, header excesivo, HTTP 103,
HTML/JSON y XML inesperados, robots/sitemap sin seguimiento externo, candidatos de stack.
Seguridad: esquema/credenciales/host/puerto, contexto ausente, loopback/privadas/mapped IPv6,
metadata/link-local/NAT64/6to4, DNS mixto y rebinding entre requests. Denegaciones previas
comprueban cero solicitudes al destino. IPv6 `::1` se verifica con una conexión real y
después retirando su permiso exacto. TLS: confiado, no confiado, hostname incorrecto y
handshake contra un servidor plaintext, sin envío HTTP en los casos inválidos.

Los fallos previos de Chromium/teardown del adapter **no se reprodujeron** en la comparación
fuera del sandbox: base 26/26 y versión actual 80/80. Tampoco se reprodujo el fallo sensible
a carga de `route-scanner` en Knowledge completo. Esto no invalida el historial de VNEXT-005
ni demuestra que desaparezcan bajo otras cargas/permisos. No se ejecutó ni certifica la
suite global de todos los paquetes. Las suites completas Auth/CLI/MCP no se ejecutaron.

Limitaciones de verificaciones: `tsc -p packages/playwright-adapter/tsconfig.json` incluye
tres diagnósticos en tests legacy intactos: TS6059 por fixture fuera de rootDir y dos TS2345
en screenshots por `ModuleContext.module` ausente. El tsc focalizado nuevo y el build DTS
pasan. ESLint del archivo Shared `contextual-dimensions.ts` presenta tres errores
preexistentes `no-redundant-type-constituents` en la unión de `EnvironmentPolicy.name`,
fuera de la línea añadida; no se modifica ese contrato por limpieza. No se declara lint
global ni typecheck legacy completo verde. Linux/macOS y otros runtimes no se verificaron.

El sandbox produce EACCES en conexiones loopback y OpenSSL/MSYS no arranca bajo él.
Los tests HTTP/TLS/SQLite y la comparación del adapter se ejecutaron con la escalación
de herramientas autorizada, exclusivamente sobre fixtures y bases temporales. Vitest
necesitó TEMP/TMP dentro de `node_modules/.tmp-vnext` para evitar EPERM de rename de caché.
pnpm 12 intentó validar supply-chain online, sin DNS disponible en sandbox; se usaron
los binarios ya instalados directamente. No hubo instalación ni modificación del lockfile.

## 9. Reproducción

Desde la raíz del monorepo en PowerShell, con Node 24 y dependencias instaladas:

```powershell
$env:TEMP = Join-Path (Get-Location) 'node_modules/.tmp-vnext'
$env:TMP = $env:TEMP
New-Item -ItemType Directory -Force $env:TEMP | Out-Null

# Build en orden de dependencias; pnpm puede requerir acceso al registro por sus políticas.
pnpm build

Push-Location packages/playwright-adapter
node node_modules/vitest/vitest.mjs run src/__tests__/reconnaissance.test.ts
Pop-Location
Push-Location packages/knowledge
node node_modules/vitest/vitest.mjs run test/reconnaissance-sqlite.test.ts
node node_modules/vitest/vitest.mjs run
Pop-Location
Push-Location packages/shared
node node_modules/vitest/vitest.mjs run
Pop-Location
Push-Location packages/engine
node node_modules/vitest/vitest.mjs run
Pop-Location

node node_modules/typescript/bin/tsc --noEmit -p packages/playwright-adapter/test/tsconfig.recon.json
node node_modules/typescript/bin/tsc --noEmit -p packages/knowledge/test/tsconfig.json
node node_modules/eslint/bin/eslint.js packages/playwright-adapter/src/reconnaissance packages/playwright-adapter/src/__tests__/reconnaissance.test.ts packages/knowledge/test/reconnaissance-sqlite.test.ts packages/shared/src/__tests__/domain/http-recon-evidence.test.ts
```

La alternativa de build offline utilizada fue invocar `node
node_modules/tsup/dist/cli-default.js` desde cada paquete en orden topológico (ruta absoluta
al binario), con `src/index.ts --format esm --dts` salvo CLI/MCP, que usan su config sin
argumentos. Logs y copia baseline local se conservaron bajo `node_modules/.tmp-vnext/vnext006-*`,
ignorados por Git. No son dependencias ni artefactos de distribución.

## 10. Continuidad y exclusiones

Se conserva el archivo de sesión protegido con hash Git de contenido
`28e1b8dbec7ccf194440cc4158ec6072c9b9ade4`, excluido de staging y commits.
Solo se publica en `feat/qap-vnext-architecture`, sin force, merge o rebase.

Limitaciones funcionales deliberadas: catálogo de tecnologías pequeño/heurístico, sin
versiones, identidad textual del certificado descartada por privacidad, detalles de TLS
inválido potencialmente no disponibles, sitemap contado sin parser/crawler completo,
consentimiento por URL exacta e IP privada exacta. No se guarda HTML por opción alguna.

Diferido: VNEXT-007 crawler, VNEXT-008 interceptor, VNEXT-009 inferencia general,
VNEXT-010 sondas, Advisor, login, formularios, handlers MCP, CLI nueva, auditor TLS,
escaneo de vulnerabilidades, empaquetado/npx y publicación npm. El próximo ítem del WBS
es VNEXT-007, que necesita autorización propia. **Detener después de esta entrega.**
