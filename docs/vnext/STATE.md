# QAMCP vNext — Continuidad Codex

Actualizado: 2026-10-30. Agente principal único.

## Estado y alcance

**VNEXT-001 a VNEXT-006 terminadas** por autorización expresa, con límites documentados.
**VNEXT-007 completada con limitaciones: crawler estático anónimo** por autorización
expresa del 2026-10-30. No se certifica exploración SPA con JavaScript.
**VNEXT-008 completada con limitaciones: observación dinámica pasiva acotada**, por
autorización expresa del 2026-10-30. JavaScript/Fetch/XHR reales verificados mediante
gateway seguro y barrera TCP/UDP. VNEXT-009 fue autorizada posteriormente y se registra abajo.
**VNEXT-009 completada con limitaciones: inferencia determinista sobre memoria persistida**, por autorización expresa del 2026-10-30. Detener tras publicarla; VNEXT-010 y posteriores no autorizadas.
**VNEXT-010 completada con limitaciones por autorización posterior del 2026-10-30: sondas de formulario vacío no destructivas.**
Esta autorización sustituye exclusivamente el bloqueo anterior de VNEXT-010; el cierre y
sus límites se registran al final. Las autorizaciones posteriores de VNEXT-011 y
VNEXT-012 y VNEXT-013 y sus cierres con limitaciones se registran al final;
VNEXT-014 y posteriores siguen sin autorización.
Leer este archivo y el WBS antes de elegir trabajo ante «continúa».

## Rama y cambios ajenos

- Rama exclusiva: `feat/qap-vnext-architecture`. No editar/integrar develop ni main.
- Base VNEXT-005: `76ddfd4d31edda48deaf94f0b603fcb5a906085e`.
- Entrega: `git log --oneline 76ddfd4..HEAD` en esta rama.
- Cambio previo del usuario en `packages/playwright-runner/.qa/cache/sessions/admin-user.json`
  conservado y excluido. Hash Git de contenido antes/después de verificaciones:
  `28e1b8dbec7ccf194440cc4158ec6072c9b9ade4`. No usar bases personales/Reporter.

## Credenciales VNEXT-005

- Puerto `packages/auth/src/credential-provider.ts`, reexportado por Auth.
  ICredentialProvider privilegiado; agente/Knowledge reciben auth_profile_id y estado.
- TieredCredentialVault selecciona backend explícito por perfil, sin fallback silencioso.
  Keytar opcional/diferido en Auth y CLI; PortableCredentialVault desbloqueada por API;
  EphemeralCredentialProvider sin persistencia; env conserva token temporal.
- Scope: proyecto por ruta real completa (o ID explícito), aplicación, entorno, perfil y cuenta.
  Keychain por basename anterior **no se migra/lee automáticamente**: reprovisionar y
  retirar manualmente entradas legacy correctas. No se declaran credenciales válidas remotamente.
- Vault v1: AES-256-GCM, nonce 12/tag 16/salt 32 bytes; scrypt N=131072/r=8/p=1,
  maxmem 256 MiB. Sin clave maestra predeterminada ni persistida. Locks exclusivos,
  recarga bajo lock, temporales/fsync/rename, rutas/enlaces validados y errores sanitizados.
- SessionStore separado: aleatoria por vida de módulo/proceso por defecto. Persistencia
  entre procesos exige QAP_SESSION_KEY de 64 hex aleatorios; cachés legacy no se migran.
  Se corrige projectPath; claves incorrectas no destruyen ciphertext. ACL Windows heredada.
- API AuthManager anterior conservada; status y close agregados. CLI revoca antes de
  quitar el perfil. No nuevos handlers, login autónomo, 1Password ni publicación npm.

## Verificación y límites

- Auth final: **34 aprobadas + 1 omitida POSIX**, tres archivos, en Windows con Node
  **24.15.0, 24.19.0 y 24.22.1**. Junctions/hardlinks verificados fuera del sandbox;
  dentro de él se omiten por EPERM. Windows Credential Manager real: 6 checks por runtime,
  solo entradas sintéticas aleatorias eliminadas. Linux/macOS y otros Node no comprobados.
- Shared 145/145; Engine 168/168; Knowledge 234/234: **547/547 focalizadas**.
  CLI Auth 6/6; MCP centinela 1/1 (14 no seleccionadas). Runner session-resolver 3/4:
  re-login falla por Chromium ausente. No declarar E2E/global verde.
- 10 paquetes compilan. ESLint de entrega y tsc Auth incluidos tests sin diagnósticos.
  Lockfile validado offline con pnpm 12.3.4, sin scripts ni actualizaciones de versiones.
- Global no pasa: Auth dos suites Chromium/teardown; Adapter 17 fallos/4 aprobadas/5
  omitidas; Knowledge 233/234 por route-scanner sensible a carga (tiempo antes de límite
  de archivos). Mismas fuentes/firmas conocidas; no corregidas. Detalle y conteos del
  intento global en el documento de VNEXT-005. Dependientes se verificaron por separado.
- TEMP/TMP y logs: `node_modules/.tmp-vnext`, `vnext005-*.log`.
- Pendientes: instalación npx limpia sin addon, composición UX de desbloqueo, CI POSIX,
  reprovisión legacy y rotación maestra. Borrado lógico no elimina backups/SSD ni revoca
  tokens remotos; sin defensa completa contra TOCTOU de misma cuenta o rollback autenticado.

## Memoria y continuidad anterior

IKnowledgeStore v1 sin cambios; credenciales conocidas siguen rechazadas. SQLite v2
con FTS5, migración explícita v1→v2, contratos y cursores previos conservados.
Node 22.13.1 instalado en VNEXT-004 carecía de FTS5: no extrapolar la matriz de Auth.
DatabaseSync bloquea el hilo; worker pendiente. Texto libre requiere redacción en ingesta.

[Diseño, pruebas y límites VNEXT-005](VNEXT-005_CREDENTIAL_VAULT.md).
[SQLite/FTS5 VNEXT-004](VNEXT-004_FTS5_SEARCH.md).
[Persistencia VNEXT-003](VNEXT-003_SQLITE_ADAPTER.md).

## Reconocimiento HTTP VNEXT-006

- Commit de implementación: `8d488b7`. Documentación de cierre en el commit siguiente de esta rama.
- Base exacta `442596108908c5aaa4157ee17697d95e21db9a64`; única modificación previa:
  sesión protegida, conservada con el mismo hash indicado arriba y excluida de commits.
- `ReconnaissanceService` exportado por Playwright Adapter. Builtins HTTP/HTTPS, sin
  navegador ni credenciales. Engine aporta solo el puerto IKnowledgeStore.
- Consentimiento GET por URL exacta + safe_domains exactos + autorización IP/red explícita.
  DNS completo validado y fijado a la conexión; peer/puerto comprobados antes de enviar HTTP.
  Redirects validados/contados. Denegación de metadata/link-local y permisos privados exactos.
- Defaults: 3 GET, 5 s/request, 15 s/adquisición, 256 KiB acumulados recibidos/decoded/retenidos,
  2 redirects/recurso, secuencial, sin retry. robots/sitemap solo con consentimiento propio.
- Ingesta por selección positiva, sin HTML, valores cookies, paths/query arbitrarios ni headers
  desconocidos. TLS validado siempre; sujeto/emisor hasheados. Certificados inválidos no
  provocan bypass; sus detalles pueden quedar indisponibles. Candidatos heurísticos sin promoción.
- EvidenceKind aditivo `http_recon_metadata` y validadores Knowledge compatibles; no HAR ficticio,
  migración ni cambio de puerto v1. Contexto previo obligatorio y relectura de revisiones antes
  de commit atómico de evidencias + observaciones UUID nuevas. Sin sobrescritura de historia.
- Windows/Node 24.15.0: Shared 146/146, Engine 168/168; Knowledge completo 238/238, incluida
  integración final 4/4; adapter nuevos finales 55/55. Comparación completa
  adapter base exacta 26/26 y actual 80/80 (54 nuevas en ese momento). Auth focalizada 34 + 1
  omitida POSIX, CLI Auth 6/6, MCP canario 1/1 (14 no seleccionadas), runner session-resolver 4/4.
- Diez builds aprobados. tsc recon/test y Knowledge/test y lint nuevo/Knowledge afectados limpios.
  Typecheck completo adapter: 3 errores en tests legacy intactos (rootDir y ModuleContext);
  lint Shared: 3 errores previos en la unión EnvironmentPolicy.name. No suite global certificada.
- HTTP/HTTPS/IPv6 y SQLite físicos sobre fixtures temporales, fuera del sandbox por EACCES
  loopback. Sin dependencia externa ni navegador para recon. No se reprodujeron fallos previos
  de adapter/Chromium o route-scanner en estas ejecuciones; mantener la limitación histórica.
- Deadline global acota adquisición: puerto v1 no cancela operaciones de store ni permite CAS
  sobre contexto solo leído. Consumidor gobierna políticas concurrentes; ventana lectura/commit
  documentada. POSIX/otros runtimes no comprobados en esta entrega.

[Diseño, API, pruebas, reproducción y límites VNEXT-006](VNEXT-006_HTTP_RECONNAISSANCE.md).
Al cierre de VNEXT-006 no había crawler. La entrega siguiente se registra abajo.

## Crawler dirigido VNEXT-007

- Base exacta `d338814246622f72466f1b7253829e1cd3f8d834`; rama exclusiva conservada.
  Entrega: `git log --oneline d338814..HEAD`. Sesión protegida sin cambios adicionales,
  hash `28e1b8dbec7ccf194440cc4158ec6072c9b9ade4`, excluida de commits.
- `BlackBoxCrawler` exportado por Playwright Adapter; contratos en `src/crawler/`.
  BFS determinista por enlaces y URLs exactas (máximo 32); profundidad, páginas, requests,
  bytes, tiempos, cancelación y cero retries. Rutas opacas HMAC por ejecución; candidatos,
  visitas, redirects, bloqueos y fallos distintos. Selectores estructurales no garantizados.
- Modo único `fresh_anonymous_static`: contexto nuevo offline, JS desactivado, SW bloqueados,
  CSP restrictiva, recursos/frames/downloads denegados; sin login, cookies ni storageState.
  Transporte real solo Node VNEXT-006 con DNS fijado, peer/TLS verificados. No 3xx al browser.
  Proxy Chromium de denegación para tráfico que escape al routing; probado por separado sin
  routing/offline contra receptor loopback, con conexiones al proxy y cero hits al destino.
- Consentimiento explícito read-only para GET exactos, safe_domains/IPs y denegación conservadora
  de acciones; queries bloqueadas. No garantiza inocuidad semántica de GET autorizados ni se
  certifica SSRF de un navegador general/aislamiento OS. Solo el modo restringido verificado.
- DOM real: enlaces/menús/formularios/controles/roles, visibilidad/disabled/required observados,
  sin valores, HTML, texto libre, IDs ni capturas. Skeleton/scripts => dependiente de scripts,
  no asentado. SPA client-side/asíncrona real queda pendiente: criterio limitado, no aprobado.
- Dos observaciones por vista (`navigation_route`, `dom_element` agrupado) y evidencia real
  `dom_snippet` estructural. Trace unreviewed, app/entorno/ejecución, UUIDs e historia nueva.
  Commit atómico máximo 96 writes (32 vistas), puerto v1 sin cambios. DomainView/ActionTarget
  diferidos sin module_id/view_id válidos; sin requisitos, evaluaciones ni inferencias.
- Windows/Node 24.15.0/Chrome real: adapter completo **111/111** (30 crawler, 55 recon, 26 legacy),
  Shared **146/146**, Engine **168/168**, Knowledge **238/238**. SQLite temporal físico:
  reapertura, historial, referencias, aislamiento, rollback por trigger e integridad, canarios
  ausentes DB/WAL/SHM y rechazo de contexto cambiado. Diez builds; tsc crawler/recon y lint
  nuevo/index afectados sin diagnósticos. No se certifica suite global ni POSIX/otros runtimes.
- Primer intento dentro del sandbox no pudo conectar HTTP loopback. Verificación real repetida
  con autorización de herramientas fuera del sandbox; sin desactivar seguridad del crawler.
- Heredado: ventana contextual lectura/commit, store v1 sin cancelación/CAS, SQLite síncrono,
  límites legacy tsc/lint documentados en VNEXT-006. No se reprodujeron fallos históricos de
  tests adapter/route-scanner. Nuevos límites: JS/recursos externos/queries desactivados,
  shells SPA únicamente, etiquetas de catálogo y rutas opacas por ejecución.

[Arquitectura, API, evidencia, reproducción y límites VNEXT-007](VNEXT-007_BLACKBOX_CRAWLER.md).
La autorización posterior de VNEXT-008 se registra abajo. No iniciar Advisor, inferencias,
nuevos handlers ni integración develop.

## Interceptor y endpoints VNEXT-008

- Implementación/pruebas: `ee4da42`; documentación de cierre en el commit siguiente.
- Base exacta `5f85af41d828bebf75e5f9c919b4f5bb68750625`; rama exclusiva conservada.
  Entrega: `git log --oneline 5f85af4..HEAD`. Sesión protegida conservada con hash
  `28e1b8dbec7ccf194440cc4158ec6072c9b9ade4`, excluida de staging/commits.
- `NetworkTrafficObserver` exportado por Playwright Adapter, modo obligatorio
  `fresh_anonymous_dynamic_readonly`. Contexto nuevo sin credenciales, una navegación,
  scripts/CSS/API GET por URL/categoría exactas. No acciones, formularios, retries ni
  redirects seguidos. Crawler estático intacto. Sin nuevas dependencias ni cambios v1/SQLite.
- Gateway Node VNEXT-006: DNS completo validado/fijado, peer/TLS, presupuestos acumulados,
  sin continue/fallback/fetch del router. Proxy de denegación, SW/WS/frames/popups/downloads
  bloqueados. CSP sin inline/eval/workers. Origen/MIME/CORS verificados con respuestas reales.
  Origin opcional canónico en transporte, sin headers sensibles ni cookies reenviados.
- Hallazgo empírico: bandera WebRTC heredada dejó escapar dos datagramas STUN. Bandera
  actual adicional `--webrtc-ip-handling-policy=disable_non_proxied_udp` corrigió el escape.
  Prueba final con JS/Fetch/WebSocket/WebRTC/navegación sin routing/offline: cero hits HTTP,
  cero UDP al receptor y conexiones al proxy. No certificación de firewall/aislamiento OS;
  volver a verificar en nuevas versiones. Chrome 156.0.8078.48/Windows/Node 24.15.0 probados.
- Eventos reales fetch/xhr/other con ejecución/vista, método, endpoint HMAC, scope_status,
  status HTTP solo si existió, outcome remoto y entrega browser separados. Inventario
  siempre parcial. Query names de catálogo opt-in, nunca valores; rutas opacas salvo
  catálogo estructural consentido y variables justificadas por >=2 paths distintos observados.
- `network_traffic` + `http_recon_metadata` estructurado real, no HAR; revisión unreviewed.
  Lotes de 50 pares/100 writes, cada uno atómico; committed/failed/not_attempted explícitos.
  Fallo del segundo conserva primero; sin atomicidad global. Historial/aislamiento/referencias
  y rollback SQLite físico verificados; sin canarios en resultado/DB/WAL/SHM/logs.
- Límites máximos: 128 eventos/endpoints/requests, 32 recursos autorizados, 1 MiB acumulado
  recibido/decoded/retenido cada uno, 60 s adquisición/10 s request/3 s ventana, concurrencia 1.
  Sin networkidle. Vista no asentada y agotamiento registrados; RAM de Chromium sin cota OS.
- Nuevas pruebas **28/28**. Adapter final completo **139/139** con archivos secuenciales,
  incluidos 55 recon/30 crawler/26 legacy. Primera ejecución paralela también 139/139;
  segunda con builds concurrentes 138/139 por legacy auth-classification skeleton caso 12
  (esperaba 0 botones antes de timer, observó 2). Archivo/ruta legacy intactos; no se cambian
  aserciones/timeouts. No se atribuye causalidad definitiva ni se certifica suite global.
- Shared **146/146**, Engine **168/168**, Knowledge **238/238** completos. Auth focalizada
  **34 + 1 omitida POSIX**, CLI Auth **6/6**, MCP no filtración **1/1** (14 no seleccionadas),
  runner session-resolver **4/4**. Diez builds; afectados recompilados tras arreglo UDP.
  tsc observer/crawler/recon incluyendo tests y lint archivos afectados sin diagnósticos.
- Límites: solo vista inicial, JS/CSS exactos del mismo origen, API JSON/texto UTF-8;
  sin inline/eval, binarios, autenticación, headers personalizados/preflight ni navegación
  exhaustiva SPA. Ventana contexto/commit y cancelación store heredadas. Otros runtimes/
  navegadores/SO no comprobados. Diagnósticos legacy tsc/lint globales siguen documentados.

[API, garantías empíricas, reproducción y límites VNEXT-008](VNEXT-008_NETWORK_INTERCEPTOR.md).
Detener al publicar VNEXT-008; no iniciar VNEXT-009, Advisor, sondas, MCP ni integración develop.

## Motor de inferencias VNEXT-009

- Implementación/pruebas: `8766632`; documentación y cierre en el commit siguiente.

- Base exacta `8a0a2f5f6ac3f19e3f8a5066d6d18fc5532c3817`; rama exclusiva
  `feat/qap-vnext-architecture`, agente principal único. La nueva autorización reemplaza
  exclusivamente la prohibición anterior de iniciar VNEXT-009. No se reauditaron etapas.
- `KnowledgeInferenceEngine` y `calculateInferenceConfidence` exportados por Knowledge.
  Consume exclusivamente observaciones/evidencias recuperadas del puerto v1; valida
  procedencia, contexto anónimo, revisiones históricas, sesiones y estructura seleccionada.
  Sin cambios Shared/Engine/SQLite, navegador, HTTP, credenciales, LLM, MCP ni CLI.
- Cinco categorías: enlaces potenciales, controles, cadenas de links, clusters con links
  recíprocos/formularios y riesgos (503, bloqueo, scripts, cobertura parcial). No requisitos,
  defectos confirmados, navegación acreditada ni reglas de negocio específicas.
- Puntaje heurístico reproducible, techo 0.72, desglose estructurado, no probabilidad.
  Repetidos comparten unidad; I=1 conservador sin independencia demostrada. No correlación
  de referencias HMAC entre ejecuciones; no decaimiento temporal ni refutación por ausencia.
- Identidad determinista acotada a sesión/contexto/regla; deduplicación, nuevas revisiones
  CAS, historia y pins de evidencia. Un lote <=32 writes; soportes <=16; páginas <=100;
  observaciones default500/max1000, candidatos24/32, cálculo5/30s y complejidad acotada.
  Conflictos y cursores inválidos rechazan sin writes parciales. Selecciones parciales no
  eliminan soportes. Atributos DOM comparables contradictorios provocan abstención.
- Pruebas nuevas **20/20**, SQLite físico: reapertura/historial/dedup/CAS/aislamiento,
  trigger rollback, dos conexiones concurrentes, pins históricos, contexto/cursor, canarios
  de payload/atributos/URLs/razonamientos sin propagación a inferencias/resultados/logs ni
  DB/WAL/SHM de salida. La fuente hostil preexistente no se borra; arnés explicado en doc.
- Regresiones completas ejecutadas: Shared **146/146**, Engine **168/168**, Knowledge
  **258/258**, Playwright Adapter **139/139** secuencial. Diez builds aprobados.
  TypeScript de Knowledge/test y lint de entrega limpios. No suite global certificada.
- Primer intento Knowledge bajo sandbox: **255 pasan/3 fallan** en integración HTTP
  loopback; ejecución permitida fuera del sandbox **258/258**. Vite TEMP inicial EPERM
  corregido usando node_modules/.tmp-vnext. pnpm intentó validación registry bloqueada por
  DNS: se usaron binarios locales instalados, sin cambios de dependencias/lockfile.
- Typecheck amplio Knowledge/src incluye tests legacy intactos: TS2352 en document-detector
  líneas48/49, TS18048 línea308; TS2353 waived_at en file-storage línea323. La compilación
  de producción y el typecheck específico de la entrega pasan; no se alteraron aserciones.
- Límites: ventanas/contexto y cancelación v1 heredadas; materialización/SQLite síncronos
  no interrumpibles, sin límite OS de memoria. No independencia/correlación entre runs,
  topología completa, navegación ejecutada ni promoción. Clusters locales heurísticos;
  contradicción inicial limitada a atributos DOM comparables. Solo Windows/Node24.15.0.
- Sesión protegida conservada, hash `28e1b8dbec7ccf194440cc4158ec6072c9b9ade4`,
  excluida de staging/commits. Logs vnext009-* y bases sintéticas temporales excluidos.

[Arquitectura, fórmula, API, pruebas, reproducción y límites VNEXT-009](VNEXT-009_INFERENCE_ENGINE.md).
Detener tras publicar VNEXT-009. VNEXT-010, Advisor, sondas, nuevos handlers e integración
con develop/main permanecen sin autorización.

## Sondas de observación activa VNEXT-010

- Implementación/pruebas: `ed1143a`; documentación de cierre en el commit siguiente.
- **Completada con limitaciones**, por autorización expresa posterior del 2026-10-30.
  Base `e2bb35a10db9e22d996734715a3a4de40658ce61`, rama exclusiva
  `feat/qap-vnext-architecture`, agente principal único. Commits de entrega:
  `git log --oneline e2bb35a..HEAD`. No se iniciaron tareas posteriores.
- `ActiveObservationProbe` exportado por Playwright Adapter; API tipada y catálogo
  cerrado: `native_empty_validation` con checkValidity real y `protected_empty_submit`
  con requestSubmit real, sin clicks arbitrarios, datos rellenados ni force. Formulario
  único/visible/vacío del documento principal y selector estructural explícitamente
  autorizado. Rechazo de producción, perfiles/sesiones, passwords/hidden/file/image,
  datos presentes, controles externos, objetivos ambiguos y submit de formulario válido.
- Reutiliza VNEXT-008 mediante puntos protegidos mínimos: adquisición revocada antes
  de interacción, offline, ausencia de transportes pendientes y proxy deny-only activo.
  Protección DNS/IP/TLS, SW/WS/frames/popups/downloads y flags UDP heredados. Solo sonda B
  añade allow-forms al sandbox para habilitar validación nativa; form-action sigue none.
  CSP original restrictiva => indeterminado; no se inventa ejecución.
- Dos ensayos independientes por defecto, tres máximo, browser/contexto/proxy nuevos.
  Comparación solo de estados estructurales, restricciones/categorías HTML5, eventos y
  cambios DOM. Estados consistent/inconsistent/indeterminate/blocked; un solo ensayo
  nunca acredita reproducibilidad. Storage escrito por scripts queda en contexto
  desechable, sin contaminar otro ensayo. Cancelación impide iniciar nuevos ensayos.
- Solo observaciones probe_result/active_probe y evidencia dom_snippet estructural
  seleccionada dentro del browser, sin valores/mensajes/HTML/URLs/credenciales/capturas.
  UUIDs nuevos, contexto revalidado y un commit atómico <=6 writes por ejecución.
  Reapertura, referencias, historia, aislamiento, rollback y contexto cambiado probados
  en SQLite físico. Sin writes para abstenciones/capturas incompletas. Persistencia
  committed/failed/not_attempted distinta del resultado observacional.
- El observador interno no genera/persiste registros de red con procedencia crawler.
  VNEXT-009 no admite active_probe: queda documentado y no se altera ni se falsifica la
  fuente. No requisitos, conformidad pass, defectos confirmados ni cambios de inferencias.
- Límites: un formulario/una navegación por ensayo; 100/200 controles, 500/1000 nodos,
  100/200 eventos por categoría, 500/1000 cambios; ensayo 15/20s, global 40/60s,
  ventana activa 100/1000ms. Adquisición exacta de documento/scripts/CSS, sin APIs:
  máximo 128 requests y 1MiB por categoría/ensayo, concurrencia uno, sin retries.
- Pruebas nuevas **25/25**. Adapter final completo **164/164** (55 recon, 30 crawler,
  28 observer, 25 probes, 26 legacy). Shared **146/146**, Engine **168/168**, Knowledge
  **258/258**, incluidas VNEXT-009: **736/736** focalizadas. Diez builds aprobados,
  Adapter recompilado final; tipos probes/observer/crawler/recon incluidos tests y lint
  de entrega sin diagnósticos. No suite global certificada.
- Primer recorrido Adapter: 134 aprobadas, worker Vitest terminado inesperadamente
  antes de completar observer (162 recopiladas entonces). Causa no determinada.
  Observer aislado 28/28 y recorrido final 164/164, sin cambiar pruebas legacy.
  Primer intento bajo sandbox no pudo acceder a loopback; verificaciones reales
  repetidas mediante herramientas permitidas fuera de esa restricción.
- Verificación y publicación detalladas en el documento de VNEXT-010. Matriz:
  Windows, Node 24.15.0, Chrome 156.0.8078.48. Sesión protegida conservada con hash
  `28e1b8dbec7ccf194440cc4158ec6072c9b9ade4` y excluida de staging.
- Limitaciones: sin UI general, formularios válidos, autenticación, frames/shadow DOM,
  APIs iniciales ni estado asíncrono posterior a la ventana. Sin certificación OS/RAM
  o navegador comprometido; GET inicial requiere consentimiento semántico. Puerto v1
  sin CAS contextual/cancelación de store; SQLite/limpieza no interrumpibles. Solo
  matriz indicada. No suite global certificada; límites legacy de tipos/lint intactos.

[API, seguridad, pruebas y reproducción VNEXT-010](VNEXT-010_ACTIVE_OBSERVATION_PROBES.md).
Detener tras publicar VNEXT-010. VNEXT-011, Advisor, nuevos handlers y cualquier
integración develop/main requieren autorización nueva.

## Handlers declarativos MCP VNEXT-011

- **Completada con limitaciones**, por autorización expresa posterior del 2026-10-30.
  Base `7271c6932cdb13fef339a8e70774ba6a0a1fc55c`, rama exclusiva
  `feat/qap-vnext-architecture`, agente principal único. Esta autorización sustituye
  exclusivamente el bloqueo anterior de VNEXT-011. Entrega: `git log --oneline 7271c69..HEAD`.
- `IMcpToolHandler`, `McpInvocationContext`, `McpToolError` y `ToolDispatcher`, exportados
  por MCP. Registro explícito por instancia, orden determinista, nombres validados,
  duplicados/reservas rechazados, metadatos copiados y sellado antes de invocar.
- `createMcpServer(options?)` permite inyección opcional; las 18 herramientas legacy
  conservan su ruta switch y reservan sus nombres. Sin nuevas herramientas públicas
  en producción, migraciones anticipadas ni conexiones a servicios VNEXT-006 a 010.
- SDK MCP instalado 1.30.0: valida envelope/resultado, no inputSchema por herramienta.
  Dispatcher valida estructura básica, copia argumentos y ofrece validador específico.
  Excepciones nuevas sanitizadas, códigos cerrados, sin logs sensibles; resultados
  explícitos y errores legacy conservan responsabilidad/semántica previa. Cancelación
  cooperativa, sin timeout/rollback ni validación completa de JSON Schema automática.
- **38/38 unitarias + 8/8 integraciones reales** Client/Server/InMemoryTransport;
  **21/21 server.test.ts**, conjunto focalizado **67/67**. Catálogo completo de la base
  exacta comparado por snapshot: nombres/descripciones/esquemas/orden de 18 herramientas
  y prompts intactos; prompts/get y status legacy sobre fixture temporal verificados.
- **MCP completo 183/183 en 14 archivos**, fuera del sandbox con fixtures locales.
  Primer recorrido bajo sandbox 171 pasan/12 fallan en dos suites legacy de navegador/
  autenticación; no se reproducen fuera. Diez paquetes compilan. TypeScript estricto
  dispatcher/unit tests y ESLint de archivos afectados limpios. No suite global certificada.
- Typecheck amplio MCP conserva **48 diagnósticos legacy**, igual que la base; ninguno
  nuevo tras comparación con fuentes base en memoria. Supresión global de server.ts
  eliminada, excepciones acotadas a helpers y switch legacy. Diagnósticos sin supresiones:
  **803 antes / 798 pendientes** (61 helpers, 737 invocación/switch), nueve clases.
  **Eliminación total de supresiones pendiente**, requiere migraciones funcionales
  posteriores; no se declara resuelta. eslint.config.mjs y aserciones legacy intactos.
- Windows/Node 24.15.0. Sin datos personales ni cambios de persistencia/negocio.
  Sesión protegida conservada con hash `28e1b8dbec7ccf194440cc4158ec6072c9b9ade4`,
  excluida de staging/commits; logs/builds/fixtures temporales excluidos.

[Arquitectura, API, límites y verificación VNEXT-011](VNEXT-011_MCP_DISPATCHER.md).
Detener tras publicar VNEXT-011. **No iniciar VNEXT-012**, VNEXT-013, VNEXT-014,
Advisor ni integración develop/main sin autorización nueva.


## Handlers de información y estado VNEXT-012

- Autorización posterior expresa del 2026-10-30, exclusivamente VNEXT-012. Sustituye
  el bloqueo anterior de esta microtarea, sin alterar los cierres históricos.
  **Completada con limitaciones**, agente principal único. Base exacta
  def1b015147d300b0f27552fa6d4b432b4b0d183; rama feat/qap-vnext-architecture.
- StatusHandler, CleanHandler y ContextHandler registrados y sellados por el mismo
  dispatcher. Sus bloques funcionales se retiran del switch; 15 nombres legacy
  continúan reservados. Catálogo y prompts históricos conservados: 18 tools, mismo
  orden, descripciones y esquemas; no hay fallback después de error declarativo.
- Vinculación IKnowledgeStore explícita: ruta real, application_id, environment_id
  y store abierto por el host. MCP no descubre/abre/crea bases ni cierra la instancia
  inyectada. Estado unbound/unavailable/incompatible/partial documentado. Inventario
  de una página por clase, sin convertir observaciones/inferencias en requisitos o
  tests aprobados. Status deja de escribir scan.json.
- Clean bloquea el reseteo general incluso con force=true; no elimina cachés, locks,
  SQLite/WAL/SHM, perfiles, sesiones, bóvedas ni archivos personales. Contrato de
  entrada intacto; semántica de éxito legacy expresamente incompatible con D-007.
- Contexto conserva negocio/onboarding en YAML, correcciones y procedencia; consulta
  identidad y política canónicas, bloquea discrepancias de URL y no realiza dual-write
  ni proyección de roles/objetivos/flujos a entidades autoritativas. Puerto v1 y
  esquema SQLite intactos. Serialización por proyecto, lock exclusivo, CAS por
  contenido, diario before/after, publicación por rename y fallos parciales explícitos.
  Recuperación de diario incompleto requiere revisión deliberada; sin replay automático.
- MCP completo **203/204**: único fallo es la aserción histórica e intacta de clean
  que exige borrar .qa. Pruebas nuevas **21/21**; integración real SDK y SQLite físico,
  dos conexiones, CAS/historial/referencias/rollback/reapertura, aislamiento e integridad,
  preservación física y junction externo. Knowledge **258/258**, Engine **168/168**,
  Shared **146/146**; diez builds, MCP/CLI finales recompilados. No suite global certificada.
- Lint de archivos de entrega limpio sin supresiones nuevas. Deuda server.ts bajo
  --no-inline-config **798→622**; TypeScript amplio **48→48**, mismos diagnósticos
  heredados normalizando orden textual de uniones, cero añadidos/en archivos nuevos.
- Sesión protegida conservada y excluida de staging; hash Git de contenido
  28e1b8dbec7ccf194440cc4158ec6072c9b9ade4. Sin uso de su contenido. Entrega:
  git log --oneline def1b01..HEAD. Publicación exclusiva en la rama autorizada.

[Arquitectura, políticas, pruebas y límites VNEXT-012](VNEXT-012_MCP_STATE_HANDLERS.md).
Detener tras publicar VNEXT-012. **No iniciar VNEXT-013**, VNEXT-014, Advisor ni
integración con develop/main. La infraestructura permite otra transferencia explícita
solo tras nueva autorización.

## Descubrimiento autónomo MCP VNEXT-013

- **Completada con limitaciones**, autorización posterior expresa del 2026-10-30.
  Sustituye exclusivamente el bloqueo anterior de VNEXT-013. Base exacta
  8ed569d8953230e6cf694a1130c0ca02cd433fd3; rama feat/qap-vnext-architecture,
  agente principal único. VNEXT-014 permanece sin autorización.
- DiscoveryHandler implementa IMcpToolHandler y usa BlackBoxCrawler real con el
  store del binding. Caso funcional legacy retirado, sin fallback; cuatro tools
  declarativas, catorce legacy, 18 públicas. Orden, esquemas, otras 17 definiciones
  y prompts conservados. Se cambia deliberadamente la descripción de discover.
- discoveryAuthorizations opt-in del host: proyecto real/app/entorno/revisión,
  GET observacional reconocido, URLs exactas, IPs/red y límites del crawler.
  Sin consentimiento o binding no navega. Contexto canónico recuperado/revalidado;
  sin apertura/cierre de stores, perfiles, sesiones, credenciales o inventar IDs.
- Resultado seleccionado: estados reales, rutas opacas, vistas/relaciones y conteos,
  presupuestos, cierre, persistencia committed/not_attempted/failed. Sin DOM libre,
  valores, URLs sensibles, errores internos o inferencias automáticas. Shell SPA
  parcial, JS deshabilitado; cancelación propagada y limpieza esperada.
- Chrome/MPA y SQLite físicos: tres vistas, seis observaciones y tres evidencias en
  un commit. Reapertura/historia/referencias/aislamiento/rollback/canarios verificados.
  Se conservan fases y módulos terminales; no se escriben .qa/modules ni se avanza
  lifecycle. Autenticación, artefactos e entrevistas legacy dejan de estar soportados.
- Nuevas **37/37**, dispatcher **38/38 + 8/8**, estado **21/21**: **104/104** dentro
  del recorrido final. Clean/reportes corregido y aprobado, preservación física e
  inventario comprobados; cierre histórico VNEXT-012 permanece **203/204** intacto.
- MCP completo final **181/241**, 60 fallos en ocho archivos por dependencias del
  contrato discover sustituido; detalle por archivo en el documento. No se relajan,
  omiten ni falsifican efectos legacy. server.test.ts **11/21**. Crawler **30/30**,
  Knowledge **258/258**, Engine **168/168**, Shared **146/146**; diez builds aprobados
  y MCP/CLI finales recompilados. No suite global certificada.
- ESLint nuevo/producción/contratos limpio; server.test.ts conserva dos warnings
  preexistentes por su encabezado. Deuda server sin supresiones **622→513**.
  TypeScript amplio **48→48**, mismos diagnósticos; foco handler alcanza dos errores
  legacy de guidance.ts, ninguno nuevo. Sin cambios de configuración/supresiones.
- Sesión protegida modificada previamente conservada y excluida. No se lee su
  contenido, no se usa ni recalcula su hash. Solo fixtures sintéticos temporales;
  logs/bases/dist excluidos. Publicación exclusiva sin merge/rebase/force.
  Identificar commits con git log --oneline 8ed569d..HEAD; HEAD remoto al entregar.
- Límites heredados: carrera de contexto lectura/commit, sin CAS/cancelación del
  store v1, SQLite síncrono, limpieza sin deadline duro, sin certificación OS ni
  otros runtimes. Sin resultado adquirido recuperable cuando el crawler lanza error.

[Arquitectura, reproducción, contratos y resultados VNEXT-013](VNEXT-013_MCP_DISCOVERY_HANDLER.md).
Detener tras publicar VNEXT-013. **No iniciar VNEXT-014**, Advisor ni integrar
develop/main sin autorización nueva.
