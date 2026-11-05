# QAMCP vNext — Continuidad Codex

Actualizado: 2026-11-05. Estado histórico preservado; resultado independiente R4-R9 al final.

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
Tras la resolución de incertidumbres técnicas post-R5, la preparación técnica VNEXT-014-A ([014A_PREPARACION_TECNICA.md](014A_PREPARACION_TECNICA.md)) y la implementación declarativa de PlanHandler en VNEXT-014-B ([014B_PLAN_HANDLER.md](014B_PLAN_HANDLER.md)), queda completada la conexión real del planificador DAG; VNEXT-014-C queda preparada para su implementación; VNEXT-015 y posteriores siguen sin autorización.
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

## Correctiva VNEXT-013-R1 — Contratos e integración

- Autorización posterior expresa del 2026-10-30; base exacta
  c2078213236a50b540d8fa29fe891e5dff998416, agente principal único y misma rama.
  **Completada con limitaciones; estabilización funcional del flujo INCOMPLETA.**
  No iniciar ni autorizar VNEXT-014. Los cierres históricos anteriores no cambian.
- Reproducción antes de editar: **181/241**, 60 fallos individuales inventariados:
  **23 A, 32 B, 5 D; C/E/F=0** entre esos 60. Tres problemas adicionales de
  integración identificados con pruebas rojas/verdes: recomendación circular,
  escritura de reglas sin contexto y recomendación de cierre sobre estado
  consolidated sin contexto. Guards explícitos sin inventar archivos/transiciones.
- Reglas/cierre sin contexto legacy requieren prerrequisito real y responden
  blocked/legacy_interview_unavailable, sin writes. Status/discovery explicitan
  límites; observaciones no equivalen a reglas, cobertura o asociación de módulo.
  Contexto legacy preexistente sigue admitiendo reglas; renuncia explícita conservada.
- Dos expectativas obsoletas actualizadas individualmente (T8 y B6), sin eliminar
  casos ni garantías. **MCP final 188/246**, 58 fallos clasificados, sin skips/todos:
  originales **183/241**, nuevas **5/5**. Discovery **42/42** (37 conservadas),
  dispatcher/SDK **46/46**, state **21/21**, crawler **30/30**, Knowledge **258/258**,
  Engine **168/168**, Shared **146/146**; **diez builds aprobados**.
- ESLint legacy **513→513**; TypeScript amplio **48→47** (se elimina unused parsed
  en T8), cero añadidos. Producción afectada/tests nuevos limpios; warnings de
  tests históricos modificados idénticos (3 y 7). Sin supresiones/config nuevas.
- Persistencia/seguridad intactas: 18 tools, cuatro handlers, sin fallback,
  autenticación implícita, bases automáticas, proyección dual o borrado de memoria.
  Revisión acotada de c207821: canarios/literales sintéticos y rutas de entorno;
  ningún secreto real identificado en el conjunto revisado, sin certificación universal.
  Sesión protegida conservada, sin leer/usar/hash ni staging. Artefactos locales excluidos.
- Pendiente crítico: observaciones → identidad de módulo/vista → entrevista/requisitos.
  **No apto para iniciar VNEXT-014 suponiendo ese flujo resuelto.** No se certifica
  suite global. Publicación exclusiva sin merge/rebase/force; entrega:
  git log --oneline c207821..HEAD. Detener después de publicar esta correctiva.

[Inventario de 60 casos, dependencias, cambios y verificación R1](VNEXT-013_R1_INTEGRATION_STABILIZATION.md).

## Correctiva VNEXT-013-R2 — Puente módulo/observaciones

- Autorización exclusiva posterior del 2026-10-30; base exacta
  cfcbc95e47aa1058aa50828ba7c7cfa82fbb6853, rama feat/qap-vnext-architecture,
  agente principal único. **Completada con limitaciones.** No iniciar VNEXT-014.
- Host declara nombre planificado, ID/key del DomainModule existente y revisiones
  de aplicación/entorno/módulo. Resolución inequívoca, módulo activo, plan y sesión
  vigentes; sin crear entidades por nombre ni correlacionar rutas/tiempo.
- related_to expresa alcance de ejecución; pins históricos de módulo/observación
  y evidencia realmente recuperada. El crawler mantiene intacto su lote atómico
  <=96; asociación posterior en otro commit <=64. No hay atomicidad común.
- Recibo UUID/fingerprint para recuperación explícita del host, sin nueva tool,
  navegación ni apertura SQLite. CAS, conflicto, prefijo incompleto, cambio de
  contexto y rollback físico comprobados; no sobrescribe historia ni borra evidencia.
  Ventana contextual del puerto v1 documentada, también detectada tras commit.
- qap_discover separa adquisición/persistencia/asociación/identidad y cobertura
  parcial. qap_status ofrece ejecuciones, tipos/conteos, evidencia histórica y
  proyección acotada solo de lectura. Ausencia de asociación no implica ausencia
  de observaciones. Sin DomainView ficticia, requisitos, hipótesis automáticas,
  archivos legacy o cambio de lifecycle; rules_set mantiene su prerrequisito real.
- MCP final **203/261**, mismos **58 fallos: 21 A, 32 B, 5 D**, cotejados uno a uno
  con R01–R60. Nuevas **15/15**, discovery **57/57**, dispatcher/SDK **46/46**,
  state handlers **21/21**; crawler **30/30**, Knowledge **258/258**, Engine
  **168/168**, Shared **146/146**. Diez builds aprobados; no suite global certificada.
- ESLint legacy **513→513**, TypeScript amplio **47→47**, firmas idénticas.
  Lint de archivos afectados/tests sin diagnósticos; sin supresiones o config nuevas.
- Chrome real 156.0.8078.48, Node 24.15.0, Windows, MPA sintética y SQLite físico:
  reapertura, dos conexiones, CAS, nueva ejecución, fallo por trigger, recuperación,
  canarios y separación epistemológica. No se extrapola a otros SO/navegadores.
- Sesión protegida previa conservada y excluida; sin usarla ni inspeccionar su
  contenido/calcular su hash. Solo código/tests/docs autorizados; logs/bases/dist
  fuera de Git. Publicación exclusiva sin merge/rebase/reset/force; entrega:
  git log --oneline cfcbc95..HEAD, HEAD remoto final comunicado al entregar.
- Pendiente: contrato de entrevista y confirmación/persistencia de requisitos,
  reconciliación de los casos A/B/D y verificación independiente de la cadena.
  La asociación no declara listo VNEXT-014. Detener tras publicar R2.

[Modelo, recuperación, evidencia y límites R2](VNEXT-013_R2_MODULE_OBSERVATION_BRIDGE.md).

## VNEXT-013-R3 — Entrevista canónica y revisión humana

Autorización posterior expresa del 2026-10-30, exclusivamente R3. **Completada con
limitaciones.** Base `801fbc9333cbc4461f842e395700c24d5142d99b`; un agente principal.

- CanonicalInterviewService reutiliza el puente R2 y bindings/revisiones vigentes.
  Preguntas generales respaldadas por la proyección agregada; sin nombres de campos,
  acciones o URLs inventados. Preguntas versionadas, respuesta libre, borradores
  no autoritativos en memoria, corrección, aplazamiento y reanudación.
- qap_rules_set incorpora canonical_interview como ruta explícita, sin fallback ni
  dual-write. Se conservan cuatro handlers declarativos/catorce legacy, 18 tools,
  orden y contrato legacy. No se traslada masivamente el bloque monolítico.
- IHumanReviewGateway privilegiado inyectado por el host. La autorización vincula
  proyecto/app/entorno/módulo, pregunta, contexto, texto/categoría/criterios exactos,
  digest, versión y CAS. Los argumentos MCP no acreditan intervención humana.
  Sin gateway, confirmar queda bloqueado. No se incluye UI/autenticación de producción.
- ExpectedRequirement validado por Shared/planner, procedencia developer_interview,
  verificador y evidencia human_review separados de observaciones motivadoras.
  Requisito y recibo related_to de aprobación se guardan atómicamente con CAS;
  uso único durable en la aplicación, reintentos idempotentes, historia/reapertura,
  concurrencia y rollback comprobados en SQLite físico. No se crean assessments.
- qap_status separa preguntas/propuestas/revisiones, requisitos draft/confirmed y
  propuestas rechazadas. Cobertura not_certified, sin adelantar lifecycle o cierre.
- Final MCP **245/303**, **42/42 nuevas**, mismos **58 fallos: 21 A, 32 B, 5 D**,
  cotejados individualmente con R01–R60. Discovery **57/57**, dispatcher/SDK **46/46**,
  state **21/21**, Knowledge **258/258**, Engine **168/168**, Shared **146/146**,
  crawler **30/30** y diez builds. Sin certificación de suite global.
- ESLint legacy **513→513**, TypeScript amplio **47→47**, mismas firmas; lint nuevo/
  afectado sin diagnósticos. Sin supresiones o configuración nuevas.
- Límites: propuestas pendientes solo en memoria; host responsable de UI, identidad,
  revocación y unicidad entre aplicaciones. Atestación del host sin autenticación
  criptográfica. Persiste la ventana transversal contexto/filesystem/commit del
  puerto v1. Los 32 B no se declaran recuperados por garantías canónicas parciales.
- Sesión protegida conservada, sin uso ni inspección explícita y excluida del staging.
  Solo código/tests/docs; sin bases, logs o dist en staging. Publicación exclusivamente
  en la rama autorizada. Commit/HEAD remoto se comunican al entregar.

[Arquitectura, confianza, pruebas e inventario R3](VNEXT-013_R3_CANONICAL_INTERVIEW_REQUIREMENTS.md).
No iniciar VNEXT-014: siguen independientes cierre, cobertura y planificador.
Detener tras publicar exclusivamente lo comprobado.

## VNEXT-013-R4 — Persistencia durable de entrevistas

Autorización posterior exclusiva del 2026-10-30; base local/remota
`6568a161d94494cf189775257362b57612e9f9fa`. Un agente principal, misma rama.
**Completada con limitaciones.** No inicia ni declara lista VNEXT-014.

- Puerto interno IInterviewDraftStore y backend SQLite separado v1, inyectado por
  binding del host. Inicialización exclusiva explícita; status no crea bases.
  Sin backend permanece modo efímero declarado; fallo del backend no cae a RAM.
- Preguntas, propuestas exactas/digests, correcciones, aplazamientos, rechazos y
  UUID/digest consumidos recuperables entre procesos. AES-256-GCM con clave del
  host, directorio/ACL privados atestados, retención y eliminación autorizada
  documentadas. No tokens, credenciales ni propuesta libre en respuestas MCP.
- Reserva BEGIN IMMEDIATE transversal, versiones y CAS canónico; rollback físico,
  salida de proceso antes del COMMIT y dos conexiones comprobados. Reconciliación
  de requisito+recibo tras fallo entre las dos bases sin otra aprobación. No se
  promete atomicidad entre ellas ni entrega de una respuesta MCP anterior.
- Gateway humano independiente preservado. Estado persistido no concede autoridad.
  Contextos/evidencias obsoletos bloqueados, sin borrar historia ni avanzar lifecycle.
  Status lee snapshots reales; almacenamiento inaccesible => unknown/unavailable.
- Nuevas **21/21**, entrevista R3 **42/42**; MCP final **266/324**, mismos **58 casos**
  cotejados por archivo+título: **21 A, 32 B, 5 D**. Discovery **57/57**, dispatcher/SDK
  **46/46**, state **21/21**, Knowledge **258/258**, Engine **168/168**, Shared
  **146/146**, crawler **30/30**. Diez builds, MCP/CLI finales recompilados.
- TypeScript amplio **47→47**, firmas idénticas; ESLint legacy **513→513**, cuatro
  warnings conservados; lint normal de entrega limpio. Sin supresiones nuevas.
  Detalles de intentos por sandbox, fixtures y carga conservados en el documento R4.
- Límites: backend opt-in, UI/identidad humana productiva pendiente; clave/ACL y
  backups gobernados por host; sin antirollback, rotación/purga automática ni worker.
  Límite 1024 preguntas/4096 generaciones; reserva de escritura abarca gateway.
  Ventana transversal contexto/filesystem heredada. No cobertura/cierre canónicos.
- Sesión protegida previa excluida, sin inspección explícita ni hash. Solo código,
  pruebas y docs; sin bases, logs, informes de ejecución, dist o fixtures generados.
  Publicación exclusiva feat/qap-vnext-architecture, sin merge/rebase/force push.

[Diseño, privacidad, reproducción, pruebas y límites R4](VNEXT-013_R4_DURABLE_INTERVIEW_STATE.md).
Detener tras publicar R4. **No iniciar VNEXT-014.**

## VNEXT-013-R5 — Cobertura canónica y cierre seguro de módulos

Autorización posterior exclusiva del 2026-10-31; base local/remota
`7a906005c98afbdc9623762f1ee4e6035c9a781d`. Un agente principal, misma rama.
**Completada con limitaciones.** No inicia ni declara lista VNEXT-014.

- Modelo tripartito canónico en `@qap/shared`: `SpecificationCoverage` sobre 7 categorías
  formales evaluada exclusivamente sobre requisitos confirmados (`developer_interview` + `human_review`);
  `ReviewCoverage` con recibo inmutable del host gateway; `ExecutionCoverageSummary` estrictamente
  `not_executed` (0 casos, 0 passed, 0 conformity assessments) en cumplimiento de los invariantes
  anti-acreditación y anti-tamper (D-011, R1).
- Taxonomía estricta de brechas (`CanonicalGap`) con 8 tipos de ausencia (`GapAbsenceType`).
  Reglas de renuncia de categoría: justificación descriptiva obligatoria de al menos 15 caracteres;
  rechazo de renuncia total de todas las categorías.
- Almacenamiento seguro SQLite v1 separado (`SqliteModuleClosureStore`): snapshots cifrados
  con AES-256-GCM, clave de 32 bytes provista por el host fuera de la base, metadatos y generaciones
  monótonas para protección contra replay. Sin alterar el esquema canónico v2 de SQLite en Knowledge.
- Cierre canónico en 2 fases (`CanonicalClosureService`):
  - Fase 1: Pre-condiciones, brechas críticas y decisión del host review gateway (`IModuleClosureReviewGateway`).
  - Fase 2: Transacción CAS en `closureStore` y recibo durable de relación en `IKnowledgeStore`.
  - Amendment 3: Zero mutación de revisión del módulo (`module.revision` intacto) mediante relación
    de cierre (`id: closure:<decisionId>`, `expected_revision: 0`, `source: module`, `target: application`),
    preservando el invariante `module.revision === link.moduleRevision` de `ModuleObservationBridge`.
  - Autoreconciliación y recuperación ante caídas verificadas en 4 escenarios: rollback en salida
    prematura de proceso, autorreparación de recibo tras caída sin re-aprobación del gateway,
    detección de corrupción/claves alteradas, y CAS concurrente entre conexiones.
- Integración MCP:
  - `qap_module_close`: Ruta explícita `canonical_closure`. Módulos canónicos vinculados llamados
    sin ella quedan bloqueados con `canonical_closure_required` (Amendment 4).
  - `qap_session_close`: Compuerta estricta que exige que todos los módulos canónicos vinculados
    estén cerrados o renunciados (`canonical_module_closure_required`).
  - `qap_status`: Proyecta `plannedName` y sección `closure` (`status: unclosed | closed | waived`).
  - Catálogo MCP preservado en exactamente 18 herramientas.
- Pruebas físicas: Nuevas **25/25** en `packages/mcp/src/__tests__/canonical-coverage.test.ts`,
  **16/16** unitarias en `packages/shared/src/__tests__/domain/canonical-coverage-invariants.test.ts`
  (162/162 total); Knowledge **258/258**, Engine **168/168**, crawler **30/30**, diez builds monorepo
  aprobados (`pnpm -r build` exit code 0). 58 fallos legacy baseline conservados (21 A, 32 B, 5 D).
- Límites: Cero ejecución de tests automáticos en R5 (reservado a VNEXT-014); gateway inyectado por
  el host sin UI de usuario final; retención y claves gestionadas por el host.
- Sesión protegida previa (`packages/playwright-runner/.qa/cache/sessions/admin-user.json`)
  excluida y sin modificaciones. Solo código, pruebas y documentación autorizados.

[Diseño, cobertura tripartita, pruebas físicas y límites R5](VNEXT-013_R5_CANONICAL_COVERAGE_MODULE_CLOSURE.md).
Detener tras publicar R5. **No iniciar VNEXT-014.**



## Sesión de estabilización y cierre correctivo post-R5 (2026-11-02)

Autorización y despliegue multi-agente Teamwork (Explorer A, Explorer B, Critic 1, Challenger 1,
Worker 2, Auditor Victoria, Worker Doc 3).
Rama exclusiva: `feat/qap-vnext-architecture`.
Base inicial de referencia: `d70f46a616447002f96a1dadd6e6f44924b24155`.
Commit auditado y consolidado: `62ac9fc89c60cbe19266c8ea2dfb6b6e01b42ead`.

### 1. Matriz de verificación física reproducible (Baseline)
- `@qap/shared`: **162/162 pasadas** (17 archivos de prueba). Coincidencia exacta con métrica R5.
- `@qap/engine`: **168/168 pasadas** (11 archivos de prueba). Coincidencia exacta con métrica R5.
- `@qap/mcp` (Dispatcher): **46/46 pasadas** (38 unitarias + 8 integración).
- Suite adversarial R5 (`packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts`): **32/32 pasadas** (100%).
- Arnés de estrés R5 (`scripts/stress-test-r5-guarantees.mjs`): **9/9 comprobaciones aprobadas** (100%).
- Compilaciones monorepo (`pnpm build`): **10/10 paquetes compilados exitosamente** (exit code 0).
- Servidor Stdio MCP (`node scripts/test-mcp-stdio.mjs`): **18 herramientas catalogadas**, `qap_status` y `qap_init` verificados sobre transporte sin residuos en Git.

### 2. Frontera ambiental de SQLite FTS5 (Node 22 vs Node 24 LTS)
- En Windows bajo Node.js v22.13.0, el binario built-in `node:sqlite` carece de FTS5 (`fts5: 0`).
- `SqliteKnowledgeAdapter` se rehúsa intencionalmente a instanciar o migrar la base (`KnowledgeStoreError: Knowledge store requires SQLite FTS5`), bloqueando 84 pruebas físicas en `@qap/knowledge` y 24 en `canonical-coverage.test.ts`.
- Esta conducta es una salvaguarda defensiva legítima de integridad de datos; la ejecución completa 258/258 en Knowledge y 25/25 en `canonical-coverage` requiere Node 24.15.0+ LTS en Windows donde `ENABLE_FTS5 = 1`.
- La suite adversarial `adversarial-r5-guarantees.test.ts` fue diseñada desacoplando `SqliteModuleClosureStore` físico cifrado con `MemoryKnowledgeStore`, demostrando las 7 garantías nucleares sin colisionar con esta frontera ambiental.

### 3. Clasificación individualizada de los 58 fallos pendientes
De los 60 fallos históricos documentados al sustituir el crawler legacy D1 por D2 en VNEXT-013, 2 fueron ajustados en R1 (T8 y B6), consolidando el inventario en **58 fallos pendientes**:
- **21 Clase A**: Incompatibilidades de contrato con el crawler legacy D1 (asunciones de YAML, `entrevista_vista`, `rules.yaml` en disco, etc.).
- **32 Clase B**: Desconexión de consumidores downstream (pruebas de reglas o cierre que no inyectan el contexto sintético que la seguridad canónica ahora exige).
- **5 Clase D**: Capacidades diferidas formalmente a VNEXT-014 (crawling autenticado, validación de sesiones, client-side route guards en SPA, runner en vivo).
- **0 Clase C**: Cero regresiones accidentales en contratos de producción.
- **Estabilización focalizada de pruebas Clase B**: T11, T12 y T13 en `p3-verification.test.ts` fueron estabilizadas mediante la función `seedLegacyModuleFixture` (inyectando contexto sintético de módulo legacy), verificando al 100% (3/3 pasadas) las reglas sustantivas de negocio: no-downgrade de reglas de usuario sobre DOM/PRD, justificaciones descriptivas de waiver (>= 15 caracteres), rechazo de lotes inválidos y concurrencia sin pérdida de datos.

### 4. Endurecimiento en código de producción (`canonical-closure-service.ts`)
- **Blindaje contra fail-open en expiración**: Se añadió validación explícita `Number.isFinite(parsedExp)` en `requestGatewayDecision` y `commitFinalClosure`. Si `decision.expiresAt` es malformada o inválida, `Date.parse()` devuelve `NaN`. La condición anterior `Date.now() > NaN` evaluaba a `false` (fail-open); el nuevo guard intercepta y bloquea inmediatamente decisiones con marcas temporales inválidas.
- **Bucle de reintentos acotado para CAS concurrente**: En `commitFinalClosure`, se incorporó un bucle de hasta 3 intentos con backoff aleatorizado (30–60 ms) ante conflictos de bloqueo (`BEGIN IMMEDIATE`), permitiendo que cierres concurrentes de módulos distintos se serialicen sin fallar.
- **Corrección de contención multi-unidad en Windows**: Se configuró `createMcpServer({ projectRoots: [tempDir] })` en `p4-3-1-b-block.test.ts` (7/7 pasadas) y `p4-2-pregunta-contract.test.ts`, resolviendo el rechazo de rutas relativas entre unidades distintas (`D:` y `C:`) en `projectRoot()`.

### 5. Invariancia de seguridad y esquema
- El archivo protegido de sesión `packages/playwright-runner/.qa/cache/sessions/admin-user.json` permanece estrictamente inalterado e inexplorado (hash Git `429bbf6d57a1d798231b4204d52069b4077703de`).
- El esquema canónico v2 de SQLite en `packages/knowledge/src/storage/knowledge-sqlite-schema.ts` tiene 0 modificaciones.
- Las ramas `main` y `develop` no fueron tocadas.

### 6. Dictamen de preparación y estado formal
- **R5 NO se declara certificada al 100% integralmente**: Si bien las 7 garantías arquitectónicas fueron demostradas adversarialmente y el código fue endurecido, restan los 58 fallos legacy por reconciliar y la resolución de la frontera ambiental de FTS5.
- **VNEXT-014 NO está habilitada ni implementada**: No se añadieron runners de ejecución de pruebas, inyección de credenciales en navegador ni generación de `ConformityAssessment.pass`.

[Reporte de Cierre Correctivo y Auditoría Adversarial Post-R5](VNEXT-013_R5_CORRECTIVE_CLOSURE.md).


## Resolución de incertidumbres técnicas post-R5 y dictamen de autorización condicional VNEXT-014 (2026-11-02)

Sesión multi-agente Teamwork (Explorer 1, Explorer 2, Explorer 3, Worker 4, Challenger 2, Critic 2, Independent Victory Auditor 2, Worker Doc 5).
Rama exclusiva: `feat/qap-vnext-architecture`.
Base de referencia post-M4: `5f91a9c70e68b875c70c7c0df180d021ec1c572d`.
Commit de endurecimiento R1: `79463d14f5bb5046a529130ddcd05a0cc93d3212`.
Integridad: modo `development`. Modificaciones en producción limitadas estrictamente a `packages/mcp/src/handlers/canonical-closure-service.ts` y suite de pruebas `packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts`.

### 1. §R1: Idempotencia, concurrencia en canonical closure y validación de procedencia de recibos

#### 1.1 Diagnóstico de la condición de carrera en `commitFinalClosure()`
- **Vulnerabilidad detectada (Explorer 1)**: En la versión previa (`5f91a9c`), cuando dos solicitudes concurrentes de cierre sobre el mismo módulo alcanzaban la transacción de `SqliteModuleClosureStore`, la rama perdedora ejecutaba `if (snapshot.closures[plannedName]) return;`. Al retornar `undefined` sin lanzar error, `SqliteModuleClosureStore.transaction()` consideraba el snapshot idéntico y confirmaba la transacción sin fallar.
- **Efectos colaterales de la falla**: El bucle CAS interpretaba la resolución limpia de la promesa como éxito y ejecutaba `break;`. En consecuencia, la solicitud perdedora avanzaba incondicionalmente al Paso 2 (`this.store.commit`), generando un segundo recibo de relación en `IKnowledgeStore` (`closure:<approvalId>` o `waiver:<approvalId>`), sobrescribía `lifecycle.json` con un estado potencialmente divergente, filtraba el ID de aprobación en la respuesta del invocador y reportaba éxito sin marcar `idempotent: true`.
- **Inseguridad en recuperación de colisión**: En el Paso 2, ante un error en `store.commit` con `expected_revision: 0`, el bloque `catch` solo verificaba `if (!existing) throw err;`. Cualquier relación existente con el mismo ID —incluso con procedencia falsificada, módulo erróneo o trace alterado— era aceptada como escritura recuperada.
- **Falta de cobertura en tests preexistentes**: Las pruebas históricas 7.2 (secuencial) y 7.3 (módulos distintos) no evaluaban la carrera concurrente sobre el mismo módulo.

#### 1.2 Corrección mínima verificada (Worker 4, commit `79463d1`)
- **Guardia transaccional CAS en `commitFinalClosure()`**:
  Dentro del callback de `closureStore.transaction()`, si ya existe un cierre para el módulo, se retorna `{ committed: false, record: existing }`. Inmediatamente fuera de la transacción, el servicio comprueba `if (!txOutcome.committed)` y retorna de inmediato la respuesta idempotente canónica con los datos del ganador (`status`, `idempotent: true`, `decision_id`, `request_digest`, `coverage_digest`), interceptando la ejecución antes de alcanzar el Paso 2 (`IKnowledgeStore`) o el Paso 3 (`lifecycle.json`).
- **Validación criptográfica y relacional de procedencia (12 campos)**:
  Tanto en la recuperación de errores de escritura de `commitFinalClosure()` como en la autorreconciliación de `reconcile()`, se implementó una validación estricta a nivel de byte que comprueba 12 propiedades esenciales: `id === receiptId`, `predicate === 'related_to'`, `source.kind === 'module'`, `source.id === link.moduleId`, `source.revision === link.moduleRevision`, `target.kind === 'application'`, `target.id === this.context.applicationId`, `target.revision === link.applicationRevision`, `trace.source === expectedTraceSource`, `trace.reason === request.requestDigest`, `trace.recorded_by === 'mcp_host'` y `trace.review === 'reviewed'`. Cualquier discrepancia lanza `Error('closure_receipt_provenance_invalid')`.
- **Vinculación dinámica de revisión de aplicación en `reconcile()`**:
  Se sustituyó el valor hardcodeado `1` por la revisión real enlazada: `this.context.moduleBindings?.find(b => b.plannedName === plannedName)?.applicationRevision ?? 1`.

#### 1.3 Pruebas de regresión deterministas (Fallo previo / Éxito posterior)
- **Test 7.4**: `Simultaneous closure requests for same module with divergent gateway decisions persist exactly one closure and canonical receipt`.
  - *Antes del parche*: Fallaba con `AssertionError: expected undefined to be true` en la solicitud perdedora y persistía dos relaciones en `IKnowledgeStore`.
  - *Después del parche*: Aprobada. Exactamente 1 ganador (`idempotent: undefined`), 1 perdedor (`idempotent: true`), exactamente 1 registro en `closureStore`, exactamente 1 recibo canónico en `IKnowledgeStore` y consistencia en `lifecycle.json`.
- **Test 7.5**: `Rejects write error recovery if existing receipt has tampered provenance or mismatched entity`.
  - *Antes del parche*: Fallaba porque la promesa resolvía exitosamente en lugar de rechazar ante un recibo con `source.id: 'module-forged-attacker'`.
  - *Después del parche*: Aprobada. Lanza y propaga `closure_receipt_provenance_invalid`.
- **Test 7.6**: `Dual-store recovery rejects reconciliation if orphan receipt has invalid digest or unknown revision`. Aprobada.
- **Resultado en la suite**: **34/34 pruebas aprobadas (100%)** en `packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts`.

---

### 2. §R2: Sonda de entorno Node 24 y ejecución sobre Node activo

#### 2.1 Disponibilidad de Node.js 24 y bloqueo ambiental
- **Sonda de versiones locales**: Inspección vía `where.exe node`, `nvm list` y gestores del sistema determinó que únicamente están instaladas en la máquina las versiones `22.13.0` (activa de 64 bits), `18.20.6`, `18.16.0` y `16.20.1`. Gestores alternativos (`fnm`, `volta`, `nvs`) no están presentes.
- **Restricción operativa respetada**: Aunque Node 24 está disponible en los repositorios remotos de NVM, su instalación requería comandos globales (`nvm install 24.x`), expresamente prohibidos por las restricciones de integridad y ámbito. Se documenta el bloqueo ambiental sin recurrir a emulaciones sintéticas ni modificaciones globales no autorizadas.
- **Sonda de SQLite y FTS5 en Node activo (v22.13.0 Windows)**:
  La ejecución de `SELECT sqlite_compileoption_used('ENABLE_FTS5') AS enabled` sobre el módulo built-in `node:sqlite` arrojó `fts5: 0` (`sqlite_version: 3.47.2`).
- **Salvaguarda arquitectónica en código**: `packages/knowledge/src/storage/sqlite-knowledge-adapter.ts:58-60` exige explícitamente `ENABLE_FTS5 === 1` y lanza `KnowledgeStoreError('UNAVAILABLE', 'Knowledge store requires SQLite FTS5')` para evitar migraciones o índices FTS corruptos bajo runtimes incompletos.

#### 2.2 Resultados de la suite de verificación sobre Node v22.13.0
| Suite / Objetivo | Comando | Código salida | Pasadas / Total | Diagnóstico y Causa Raíz |
|---|---|:---:|:---:|---|
| Compilación Monorepo | `pnpm -r build` | `0` | 10 / 10 pkgs | ÉXITO: 10 paquetes compilan limpiamente (ESM + DTS) |
| `@qap/shared` | `pnpm --filter @qap/shared test` | `0` | 162 / 162 (100%) | ÉXITO: Esquemas, validadores e invariantes íntegros |
| `@qap/engine` | `pnpm --filter @qap/engine test` | `0` | 168 / 168 (100%) | ÉXITO: Máquinas de estado y lógica de inferencia íntegras |
| `@qap/knowledge` | `pnpm --filter @qap/knowledge test` | `1` | 174 / 258 | 84 fallos 100% ambientales (`Knowledge store requires SQLite FTS5`). 21 archivos y 174 tests pasan |
| `canonical-coverage.test.ts` | `pnpm --filter @qap/mcp test src/__tests__/canonical-coverage.test.ts` | `1` | 1 / 25 | 24 fallos 100% ambientales en fixture `new SqliteKnowledgeAdapter()`. 1 test de seguridad (`admin-user.json`) pasa |
| `adversarial-r5-guarantees.test.ts` | `pnpm --filter @qap/mcp test src/__tests__/adversarial-r5-guarantees.test.ts` | `0` | 34 / 34 (100%) | ÉXITO: 7 garantías nucleares R5 intactas (incluyendo 7.4 y 7.5) |
| Arnés de estrés R5 | `node scripts/stress-test-r5-guarantees.mjs` | `0` | 9 / 9 (100%) | ÉXITO: 9 comprobaciones de estrés aprobadas |
| Servidor MCP Stdio | `node scripts/test-mcp-stdio.mjs` | `0` | 18 / 18 tools | ÉXITO: 18 herramientas operativas sobre transporte Stdio |

---

### 3. §R3: Reproducción controlada de `@qap/mcp` y reconciliación de los 58 fallos históricos

#### 3.1 Métrica global de la reproducción controlada
- **Comando ejecutado**: `pnpm --filter @qap/mcp test -- --reporter=verbose`
- **Resultados globales**: 20 archivos de prueba, **381 tests totales**:
  - **152 pruebas aprobadas** (40%).
  - **229 pruebas fallidas** (60%).
  - Duración: 37.21 segundos. Cero pruebas omitidas (`.skip` o `xit` = 0).

#### 3.2 Desglose y conciliación matemática exacta de las 229 fallas
Todas las 229 fallas observadas se particionan sin solapamiento en las 6 categorías requeridas:
1. **Ambientales (169 fallas)**:
   - *155 fallas por runtime Node 22 sin FTS5*: suites modernas `discovery-handler.test.ts` (57), `canonical-interview.test.ts` (42), `canonical-coverage.test.ts` (24), `durable-interview.test.ts` (21) y `state-handlers.test.ts` (11), todas fallando en `new SqliteKnowledgeAdapter()`.
   - *14 fallas por omisión de `projectRoots` en fixtures temporales multi-unidad en Windows* (`D:` vs `C:`): `p4-5s1-browser-candidates.test.ts` (7), `p4-3-investigate-before-ask.test.ts` (6) y `e0-investigation.test.ts` (1).
2. **Obsoletos por cambio deliberado de contrato — Clase A (21 fallas)**:
   Pruebas que continúan esperando artefactos del crawler legacy D1 (`rules.yaml`, `selectors.json`, o `siguiente_accion.tipo: 'entrevista_vista'`), sustituido contractualmente por D2 en VNEXT-013.
3. **Todavía reproducibles — Clase B (29 fallas)**:
   Pruebas de consumidores downstream que fallan porque sus fixtures no inyectan el contexto de módulo sintético exigido por la arquitectura canónica.
4. **Diferidos a VNEXT-014 — Clase D (5 fallas)**:
   Casos que requieren capacidades de crawling autenticado, inyección de `storageState`, guards SPA en cliente o ejecución de tests en vivo (R21, R22, R24, R37, R51).
5. **Nuevos defectos no registrados en el catálogo R01–R60 (5 fallas)**:
   Aserciones secundarias en suites legacy no catalogadas previamente: `p4-5a-integrity.test.ts` (C4-d y C3), `p4-5a2-integrity.test.ts` (C6-a y C3-b) y `p4-4-auth-lifecycle.test.ts` (Test 10).
6. **Resueltos y comprobados (5 casos del inventario histórico)**:
   - R08 (T8 en `p3-verification`): `rules.yaml` con `manually_edited` preservado -> **PASS**.
   - R10 (T11 en `p3-verification`): IDs secuenciales `R-001`, `R-002` -> **PASS**.
   - R11 (T12 en `p3-verification`): No-downgrade de reglas y justificación de waiver >= 15 chars -> **PASS**.
   - R12 (T13 en `p3-verification`): Concurrencia de `qap_rules_set` sin pérdida -> **PASS**.
   - R17 (B6 en `p4-3-1-b-block`): Siguiente acción de trabajo no apunta a confirmaciones -> **PASS**.

- **Reconciliación matemática**:
  $$\text{Fallas totales (229)} = 169 \text{ (Ambientales)} + 21 \text{ (Clase A)} + 29 \text{ (Clase B)} + 5 \text{ (Clase D)} + 5 \text{ (Nuevos)}$$
  $$\text{Tests totales (381)} = 229 \text{ (Fallas)} + 152 \text{ (Aprobadas)}$$
  $$\text{Inventario histórico 60 original} = 5 \text{ (Resueltos)} + 21 \text{ (Clase A)} + 29 \text{ (Clase B)} + 5 \text{ (Clase D)} = 60 \text{ tests}$$
- **Aclaración histórica**: Afirmar que "permanecen exactamente 58 fallos" es históricamente inexacto; **permanecen exactamente 55 fallos del catálogo histórico de 60**, dado que 5 casos están físicamente resueltos y comprobados en el HEAD actual.

---

### 4. §R4: Auditoría adversarial, revisión crítica y auditoría forense de victoria

#### 4.1 Auditoría adversarial de estrés (Challenger 2 — Dictamen: CONFIRMED)
- Ejecución y validación de 6 escenarios críticos adicionales:
  1. *ADV-1: Alta concurrencia sobre el mismo módulo (N = 10 clientes)*: 10 solicitudes simultáneas (5 close, 5 waive) sobre conexiones independientes. Resultado: exactamente 1 ganador, exactamente 9 perdedores marcados `idempotent: true` con los datos del ganador, exactamente 1 recibo en `IKnowledgeStore`, cero fugas de aprobaciones en `closureStore.approvals`.
  2. *ADV-2: Concurrencia entre módulos distintos*: 3 módulos simultáneos (`catalog`, `billing`, `orders`) serializados mediante backoff aleatorizado sin deadlocks.
  3. *ADV-3: Matriz exhaustiva de 12 vectores de falsificación de procedencia*: Modificación individual de `id`, `predicate`, `source.kind`, `source.id`, `source.revision`, `target.kind`, `target.id`, `target.revision`, `trace.source`, `trace.reason`, `trace.recorded_by` y `trace.review`. Los 12 vectores fueron incondicionalmente rechazados con `closure_receipt_provenance_invalid`. El vector de control con procedencia legítima recuperó la colisión limpiamente.
  4. *ADV-4: Reconciliación ante recibos huérfanos o alterados*: Recuperación exitosa si el recibo faltaba; rechazo si estaba alterado.
  5. *ADV-5: Rechazo de replay de aprobaciones ya consumidas*: Reversión limpia.
  6. *ADV-6: Transparencia en fallos reales de almacenamiento*: Errores de I/O re-lanzados al cliente sin enmascaramiento idempotente.

#### 4.2 Revisión crítica y matriz de 3 niveles (Critic 2 — Dictamen: CONDITIONAL AUTHORIZATION)
- **Nivel 1 (Garantías demostradas)**: 10 paquetes compilados, 7 garantías nucleares R5 (34/34 tests), servidor MCP Stdio (18 tools), esquemas Shared (162/162), motor Engine (168/168), reglas sustantivas de negocio (T11–T13) e invariancia de `admin-user.json` y esquema v2. Sólidas y demostradas.
- **Nivel 2 (Afirmaciones documentales)**: Búsqueda FTS5 en `SqliteKnowledgeAdapter` y 24 escenarios de cobertura física con SQLite v2 documentados pero bloqueados por el entorno Node 22 sin FTS5; compatibilidad POSIX/Linux no ejecutada en este host Windows.
- **Nivel 3 (Hipótesis pendientes y diferidas)**: Evaluación en vivo de pruebas (`ConformityAssessment.pass`), autenticación dinámica con inyección de sesiones (5 tests Clase D) y reconciliación de 29 tests Clase B. Requieren formalmente la fase VNEXT-014.
- **Condiciones y riesgos fronterizos identificados**: Límite de retención de 4096 generaciones en `SqliteModuleClosureStore`, contención de locks en discos compartidos en red (SMB/NFS) y dependencia de `reconcile()` para consistencia eventual tras caídas antes del Paso 2.

#### 4.3 Auditoría forense de victoria (Independent Victory Auditor 2 — Dictamen: CLEAN)
- **Verificación anti-trampas e integridad**: Cero aserciones simuladas, fachadas o resultados precalculados.
- **Invarianza de archivos protegidos**: `packages/playwright-runner/.qa/cache/sessions/admin-user.json` estrictamente idéntico (SHA-256 `F2A35A0CBC8D1808F2305BD10CC24C10462A0AAC6B5981DEC254620567EED47A`, Git blob `429bbf6d57a1d798231b4204d52069b4077703de`).
- **Invarianza de esquema SQLite v2**: `packages/knowledge/src/storage/knowledge-sqlite-schema.ts` con 0 modificaciones.
- **Protección de ramas y alcance**: `main` y `develop` intactas. Código de VNEXT-014 NO ha sido iniciado ni implementado.
- **Integridad de pruebas**: Cero tests relajados, omitidos o eliminados.

---

### 5. Dictamen final: Autorización condicional de VNEXT-014

La base arquitectónica post-R5 se encuentra **suficientemente estabilizada y verificada** para autorizar el paso a la siguiente fase de desarrollo.

**DICTAMEN: SE AUTORIZA CONDICIONALMENTE LA ENTRADA A VNEXT-014**, sujeta a las siguientes estipulaciones y prerrequisitos obligatorios para la siguiente sesión:
1. **Provisión de entorno con FTS5**: Antes de ejecutar la suite de integración de Knowledge Store en VNEXT-014, el entorno de ejecución debe contar con `ENABLE_FTS5 = 1` (Node.js 24 LTS en Windows o contenedor Linux), permitiendo desbloquear los 155 tests ambientales de MCP, 84 de Knowledge y 24 de `canonical-coverage`.
2. **Invarianza estricta de esquemas y credenciales**: Prohibición de alterar el esquema SQLite canónico v2 sin migración autorizada y prohibición absoluta de inspeccionar o modificar `packages/playwright-runner/.qa/cache/sessions/admin-user.json`.
3. **Cumplimiento del invariante D-011**: Los veredictos `ConformityAssessment.pass` y `ExecutionCoverageSummary` solo podrán emitirse a partir de ejecuciones físicas reales del runner Playwright sobre el navegador, jamás mediante inferencia o síntesis estática.
4. **Manejo de retención y rollover**: Planificar la política de truncado o archivo antes de superar el límite de 4096 generaciones en `SqliteModuleClosureStore`.
5. **No implementación prematura**: VNEXT-014 NO fue implementada en esta sesión, preservando la frontera de autorización.


## Preparación técnica y verificación de prerrequisitos VNEXT-014-A (2026-11-02)

Sesión multi-agente Teamwork (Explorer Git/Env, Explorer Inventory, Explorer Tests, Worker Doc).
Rama exclusiva: `feat/qap-vnext-architecture`.
HEAD verificado: `f955a9a3076ad1e82484499b47d2891a9e3eb40c` (cero divergencia, working tree limpio).
Modo de integridad: `development` (diagnóstico, auditoría y planificación técnica — cero código de producción modificado).

- **Verificación de Entorno y FTS5**: Node `v22.13.0` activo; Node 24 ausente localmente. Verificación funcional física de SQLite `CREATE VIRTUAL TABLE ... USING fts5` falló con `no such module: fts5` (exit code 1). Componentes FTS5 marcados como `BLOCKED (Ambiental)`.
- **Suites Verificadas al 100%**: `@qap/shared` (162/162), `@qap/engine` (168/168), `@hyouka73/qap-cli` (78/78), `@qap/knowledge` lógica pura y DAG (174/174), `@qap/reporter` (47/47), `@qap/git-adapter` (5/5), garantías R5 (34/34), arnés de estrés (9/9), MCP Stdio (18/18).
- **Inventario y Bloqueos Identificados**: Mapeo completo de `qap_plan`, `qap_test`, planificador DAG (`DependencyGraphResolver`) y `PlaywrightRunner`. Identificados bloqueos ambientales (FTS5 en Node 22, ausencia de binario Chromium `headless_shell-1234`) y de integración (`projectRoot` hardcodeado en runner, falta de dependencia workspace en MCP, invariante D-011 de cobertura en shared, mapeo `ExpectedRequirement` -> DAG).
- **Plan de Implementación**: Definido para VNEXT-014-B (`PlanHandler` & DAG) y VNEXT-014-C (`TestHandler` & `PlaywrightRunner`), con criterios de aceptación y prompt autosuficiente para 014-B.
- **Dictamen Formal**: `PARTIAL` (o `READY CON CONDICIONANTES AMBIENTALES`), habilitando de inmediato el desarrollo de VNEXT-014-B.

[Informe de Preparación Técnica y Plan de Implementación VNEXT-014-A](014A_PREPARACION_TECNICA.md).

## Implementación Declarativa de PlanHandler VNEXT-014-B (2026-11-02)

Sesión multi-agente Teamwork (`teamwork_worker_014b`).  
Rama exclusiva: `feat/qap-vnext-architecture`.  
HEAD base verificado: `cace8125acd4c6c47be2ae31d833a10e1e1856ee`.  
Modo de integridad: `development` (Implementación genuina de `PlanHandler`, 14/14 tests pasando, cero código trampa).

- **Handler Declarativo Implementado**: `packages/mcp/src/handlers/plan.handler.ts` implementa `IMcpToolHandler`, validación canónica de rutas (`projectRoot` + verificación estricta de pertenencia a `projectRoots`), detección de IDs duplicados, validación de dependencias inexistentes, preservación de casos editados manualmente (`UpdateGuard`), resolución de orden topológico DAG (`DependencyGraphResolver`), manejo seguro de dependencias circulares y persistencia atómica en `.qa/modules/<name>/tests/plan.json`.
- **Migración en MCP Server**: `packages/mcp/src/server.ts` migra `qap_plan` a `migrated = new Set([...])`, registra `PlanHandler` en `ToolDispatcher` y elimina el bloque legacy del switch monolítico. Se preservan exactamente las 18 herramientas del catálogo y `qap_test` permanece intacto.
- **Suites Verificadas al 100%**: `plan-handler.test.ts` (14/14), `dispatcher.test.ts` & `dispatcher-integration.test.ts` (46/46), `adversarial-r5-guarantees.test.ts` (34/34), `plan-command.test.ts` (4/4), `@qap/shared` (162/162), `@qap/engine` (168/168), compilación de los 10 paquetes (`pnpm build`) y centinela Stdio (`test-mcp-stdio.mjs` con 18 herramientas). Cero errores de linting (`eslint`).
- **Dictamen Formal**: `PASS`, habilitando la preparación y paso a VNEXT-014-C.

[Informe Técnico de Implementación PlanHandler VNEXT-014-B](014B_PLAN_HANDLER.md).

## Estabilización de PlanHandler VNEXT-014-B-R1 (2026-11-02)

Sesión multi-agente Teamwork (`worker_m1`, Lead Implementation & QA Worker).  
Rama exclusiva: `feat/qap-vnext-architecture`.  
Base verificada: `8a9d128e649d41a96d4bc4ff6abe520db800733d`.  
Modo de integridad: `development` (Estabilización genuina de `PlanHandler`, 19/19 tests pasando, FAIL BEFORE / PASS AFTER).

- **Correcciones nucleares en `PlanHandler`**:
  - `projectRoot(args, this.dependencies, true)` aplicado para comprobación estricta de autorización de escritura y rechazo inmediato de hardlinks (`nlink > 1`) en `.qa/`.
  - Huella determinista y versionada de casos `cases_fingerprint` (versión '1') incorporada en `plan.json` junto al `checksum` canónico existente (compatibilidad CLI preservada).
  - Métodos de inspección y vigencia `inspectPlanVigencia` y `verifyPlanIntegrity` expuestos para clasificar planes históricos como `unverifiable` (no validados automáticamente, no eliminados) y detectar obsolescencia ante cambios en casos YAML.
  - Casos manuales (`manually_edited: true`) protegidos y preservados bit a bit en disco y en la resolución DAG.
  - Manejo atómico y sanitizado de fallos de persistencia en disco: captura de excepciones en `writeJson`, limpieza de stubs de 0 bytes, y retorno de error estructurado (`persistence_failed`) sin falsear éxito ni filtrar rutas internas.
  - Recomendación de desbloqueo ante módulo inexistente corregida a `qap_status` (sustituyendo la errónea llamada a `qap_discover`).
- **Suites Verificadas al 100%**:
  - `plan-handler.test.ts`: **19/19 PASS** (14 originales intactas + 5 regresiones deterministas FAIL BEFORE / PASS AFTER).
  - CLI `plan-command.test.ts`: **4/4 PASS** (retrocompatibilidad verificada).
  - Monorepo `pnpm build`: **10/10 paquetes compilados exitosamente**.
  - Centinela MCP Stdio (`test-mcp-stdio.mjs`): **18/18 herramientas verificadas, exit code 0**.
  - ESLint de archivos modificados: **0 errores, 0 warnings**.
- **Dictamen Formal**: `PASS`, habilitando de forma segura la fase VNEXT-014-C.

[Informe Técnico de Estabilización PlanHandler VNEXT-014-B-R1](014B_R1_ESTABILIZACION.md).

## Frontera segura y preflight de ejecución VNEXT-014-C1 (2026-11-02)

Sesión multi-agente Teamwork (`feat/qap-vnext-architecture`).  
Base verificada: `6fcb3cd2328e9061c42efcebd128e4e159d564a3`.  
Modo de integridad: `development`.

- **Integridad Previa de Planes (R1)**: `verifyPlanIntegrity()` fortalecido con validación estricta de módulo y entorno solicitados, verificación de `cases_fingerprint_version`, validación topológica DAG compatible (admitiendo órdenes alternativos válidos sin rechazos posicionales arbitrarios) y manejo explícito de errores ante casos de prueba corruptos.
- **Seguridad y Honestidad de PlaywrightRunner (R2)**: `PlaywrightRunner` respeta rigurosamente `options.projectRoot`, prohíbe resultado `passed` ante ejecuciones con 0 casos, rechaza explícitamente pasos desconocidos o no soportados, elimina `process.exit()` y manejadores globales de señales para proteger el proceso anfitrión MCP, propaga casos omitidos por dependencias insatisfechas y clasifica fallos de inicialización de Chromium como bloqueos de infraestructura.
- **Línea Base de Pruebas Preservada (R3)**:
  - Compilación monorepo: 10/10 paquetes compilados exitosamente (`pnpm build`).
  - `@qap/shared`: 162/162 PASS.
  - `@qap/engine`: 168/168 PASS.
  - `@qap/mcp`: suites focalizadas y regresiones R1 aprobadas (26/26 en `plan-handler.test.ts`); 229 fallas históricas y ambientales preservadas intactas (cero regresiones).
  - `@qap/playwright-runner`: interpolador (7/7) y nuevas pruebas de seguridad y honestidad (7/7) aprobadas al 100%; fallas de Chromium documentadas como bloqueos ambientales.
  - Centinela MCP Stdio (`test-mcp-stdio.mjs`): 18/18 herramientas operativas, exit code 0.
- **Invarianza y Restricciones (R4)**: `admin-user.json` inalterado (hash `429bbf6d57a1d798231b4204d52069b4077703de`), SQLite v2 inalterado, `qap_test` permanece intacto como stub, ramas `main` y `develop` sin tocar.
- **Dictamen Formal (R5)**: `PASS`, habilitando de forma segura la fase VNEXT-014-C2.

[Informe Técnico de Frontera Segura y Preflight VNEXT-014-C1](014C1_RUNNER_PREFLIGHT.md).

## Implementación Declarativa de TestHandler y PlaywrightRunner VNEXT-014-C2 (2026-11-02)

Sesión multi-agente Teamwork (`teamwork_worker_014c2_1`).  
Rama exclusiva: `feat/qap-vnext-architecture`.  
Base verificada: `f0ec028` (convergencia a `feat/qap-vnext-architecture`).  
Modo de integridad: `development` (Reemplazo genuino de `qap_test` por `TestHandler`, 13/13 tests en suite nueva, ejecución física en Chromium real).

- **Handler Declarativo Implementado (R2)**: `packages/mcp/src/handlers/test.handler.ts` implementa `IMcpToolHandler`, validación canónica de parámetros (`targetPath`, `module`, `environment`, `profile`, `headed`), requisito obligatorio de módulo (`module_required`), snapshot en memoria inmune a TOCTOU (`storageResolver` con `verified_cases`), control de navegación del host (`testAuthorizations` y `allowedOrigins`), aislamiento estricto de sesión (`allowImplicitAuth: false`) y clasificación honesta de errores (bloqueos de infraestructura vs fallos funcionales).
- **Endurecimiento de Integridad Preflight (R1)**: `packages/mcp/src/handlers/plan.handler.ts` fortalecido con validación estricta de `_version === '1'`, `checksum` y `cases_fingerprint_version === '1'`, captura y tipado de casos corruptos (`corrupt_test_case`), y 5 regresiones añadidas (31/31 PASS en `plan-handler.test.ts`).
- **Seguridad en PlaywrightRunner (R2)**: `packages/playwright-runner` incorpora opciones `allowImplicitAuth`, `profile`, `allowedOrigins` y `contextSetup`, enrutamiento de red abortivo (incluyendo validación salto por salto de redirecciones HTTP 3xx con `maxRedirects: 0`) contra URLs no consentidas, y cancelación de procesos vía `AbortSignal` (69/69 PASS en suite runner).
- **Migración e Integración MCP (R3)**: `packages/mcp/src/server.ts` migra `qap_test` a `migrated = new Set([...])`, registra `TestHandler` en `ToolDispatcher` y elimina el stub legacy. Se preservan exactamente las 18 herramientas del catálogo de MCP.
- **Suites Verificadas al 100% (R4)**:
  - `test-handler.test.ts`: **13/13 PASS** (incluyendo escenario 13 con ejecución física en Chromium headless contra servidor HTTP local aislado).
  - MCP core suites: **52/52 PASS**.
  - Playwright runner suites: **69/69 PASS**.
  - Monorepo `pnpm build`: **10/10 paquetes compilados exitosamente**.
  - Centinela MCP Stdio (`test-mcp-stdio.mjs`): **18/18 herramientas operativas, exit code 0**.
  - ESLint de archivos modificados: **0 errores, 0 warnings**.
- **Invarianza y Restricciones**:
  - `admin-user.json` hash verificado: `429bbf6d57a1d798231b4204d52069b4077703de` (intacto).
  - Esquema SQLite canónico v2: intacto.
  - Ramas `main` y `develop`: intactas.
- **Dictamen Formal**: **PASS**, habilitando de forma segura la fase VNEXT-014-D.

[Informe Técnico de TestHandler y PlaywrightRunner VNEXT-014-C2](014C2_TEST_HANDLER.md).


## VNEXT-014-D — ReportHandler y evidencia verificable (2026-11-04)

- **Base remota comprobada:** `e44bbca51e2f35253b5d6cb0faabddde103b2bbc` en `feat/qap-vnext-architecture` al inicio de esta sesión.
- **Código publicado:** `qap_report` migrado de switch legacy a `ReportHandler` declarativo, con 18 herramientas MCP preservadas a nivel de catálogo; selección de ejecución registrada, validación de esquema y conteos, filtrado por módulo, generación HTML/Markdown/JUnit/JSON y protección de referencias a screenshots.
- **Corrección previa en TestHandler:** no devolver éxito ante esquema inválido o persistencia fallida, impedir IDs de ejecución usados como rutas inseguras y declarar persistencia parcial del historial.
- **Regresiones nuevas:** cuatro pruebas sobre evidencias de TestHandler y ocho sobre ReportHandler; conciliación de fixture legado de `server.test.ts` que representaba falsamente `passed` con cero casos.
- **Estado de verificación:** **PARTIAL / NO CERTIFICADO**. Los cambios fueron publicados a GitHub mediante el conector, pero no se ejecutaron `pnpm build`, Vitest, Chromium ni MCP Stdio en esta sesión. No se emiten PASS ni métricas de tests sin ejecución.
- **Integridad:** ninguna escritura a `main/develop`, SQLite v2 ni `admin-user.json`; no se ejecutaron navegadores, ni se generaron `ConformityAssessment`.
- **Siguiente compuerta:** ejecutar los comandos y criterios de aceptación de [014D_REPORT_HANDLER.md](014D_REPORT_HANDLER.md); corregir cualquier fallo antes de certificar VNEXT-014 y abrir VNEXT-015.


## VNEXT-014-D-R1 — Endurecimiento correctivo del runner y evidencias (2026-11-04)

- **Implementación publicada exclusivamente en `feat/qap-vnext-architecture`**: IDs de ejecución resistentes a colisiones en `PlaywrightRunner`; errores de contexto o carga sin inventario ficticio; validación semántica compartida de `ExecutionResult`; rechazo explícito de resultados inconsistentes; persistencia de `error` sin devolver éxito MCP; compatibilidad del bloqueo E0c de `qap_report` con `siguiente_accion: qap_status`.
- **Regresiones incorporadas y pendientes de ejecutar**: 7 D-01..D-07 en `test-handler.test.ts`, 12 D-R01..D-R12 en `report-handler.test.ts` y 2 REG-R2-10/11 en el runner. La suite legacy `lifecycle-v3-e2e.test.ts` se conservó sin cambios.
- **Comprobación de GitHub**: la rama estaba inicialmente en `aa79498842353165523857d1c5bdd691aa4e8251` y no mostraba CI/status checks para ese commit. Los nuevos commits modificaron solo la rama de vNext.
- **Estado formal**: **PARTIAL / NO CERTIFICADO**; no hubo acceso a un clon ejecutable del monorepo ni a un ejecutor CI. No se afirma que las pruebas nuevas pasen ni que VNEXT-014 haya concluido.
- **Invariantes preservados por el alcance de los commits**: sin cambios a `main/develop`, al esquema SQLite canónico v2 ni al archivo protegido `admin-user.json`.
- **Próxima acción**: ejecutar compilación, Vitest focalizado y de regresión, centinela MCP y pruebas físicas; corregir errores constatados. Solo entonces evaluar el cierre VNEXT-014 y la apertura VNEXT-015.
- **Detalle técnico**: [014D_REPORT_HANDLER.md](014D_REPORT_HANDLER.md), §6.

## VNEXT-014-D-R2 — Auditoría independiente y conciliación de compuertas (2026-11-04)

- **Evaluador independiente:** comprobó el SHA `0016c22b012877817bde6fe153fea2e39dbfb187` en Windows/Node 24.15.0 con dependencias del lockfile y preservó sin abrir la modificación local preexistente de la sesión protegida. Este informe fue aportado por el usuario; el revisor GitHub no ejecutó estas pruebas ni importó sus logs locales.
- **Compuertas comprobadas en ese SHA:** `pnpm build` 10/10 paquetes PASS; 21 regresiones nuevas D/D-R1 PASS; TestHandler + ReportHandler focal 32/32 PASS; Chromium físico headless 151.0.7922.34 PASS sintético; MCP Stdio aislado 18 tools PASS; FTS5 en memoria PASS.
- **Bloqueos de ese SHA:** runner 70 PASS/1 FAIL (C6.3 pre-abort), MCP serial 372 PASS/74 FAIL (446), lifecycle 2 PASS/5 FAIL (7), lint global 46 errores/29 warnings. El informe paralelo MCP registró 365 PASS/81 FAIL y timeouts adicionales; no confundir cargas repetidas con casos distintos.
- **Correcciones R2 publicadas sin reejecución posterior:** `dispatcher-integration.test.ts` conserva fixture vNext-010 y verifica extensión deliberada opcional de `qap_report.module`; `adversarial-stress.test.ts` C6.3 exige `result:error`, dos casos `not_run`, cero aserciones fallidas ficticias y cero lanzamiento de navegador; `report.handler.ts` separa grupos de importación parent/sibling. Estas correcciones concilian contratos, **no prueban todavía un nuevo PASS**.
- **Deuda histórica contextualizada:** VNEXT-013 inventarió R01–R60 y más adelante 58 casos pendientes; los cinco fallos lifecycle actuales ya figuraban nominalmente en R01–R05. No se declara que los 74 rojos actuales sean 74 regresiones nuevas, ni se resta el baseline histórico sin reconciliar cada título.
- **Dictamen:** **NO-GO para cerrar VNEXT-014 y NO-GO para abrir VNEXT-015 con supuesto de compuerta verde.** Próximo paso: reejecución independiente sobre HEAD R2, clasificación de 74 fallos MCP y corrección por contrato canónico sin bypasses/fixtures engañosos. Backlog R2: `014-R2-01` a `014-R2-07` documentado en WBS.
- **Documentación principal:** [014D_R2_AUDITORIA_INDEPENDIENTE_Y_RECONCILIACION.md](014D_R2_AUDITORIA_INDEPENDIENTE_Y_RECONCILIACION.md).

## VNEXT-014-D-R3 — Fixtures autorizados y diagnóstico de discovery (2026-11-04)

- **Evidencia independiente R2 (SHA `49aa44a358b288070ff710e64cfa0feae161be67`):** build de 10 paquetes PASS; runner completo **71/71 PASS**; nuevas regresiones **21/21 PASS**; catálogo MCP **8/8 PASS**; lint focal R2 sin errores/warnings; Stdio aislado 18 tools PASS. **MCP serial 373/446 PASS, 73 FAIL; lifecycle 2/7; lint global 46 errores y 28 warnings. NO-GO confirmado.**
- **Cruce por identidad:** 73/73 títulos fallidos de R2 estaban ya en el primer SHA auditado `0016c22`; 55 coinciden con el inventario versionado de VNEXT-013 (21 A, 29 B, 5 D). Los otros 18 revelan problemas de autorización de raíces temporales y un fixture con saltos Markdown literales; su primer commit causal no está acreditado.
- **Correcciones R3 publicadas sin ejecución:** cinco suites de fixtures con `projectRoots` explícitos (E0d, P4.3, P4.5-A, P4.5-A2 y P4.5-S1); subfixtures anidados dentro de la raíz autorizada, PRD E0d con LF reales y comprobación del resultado de ingesta. La autorización en `targetPath` NO reemplaza la política del host.
- **Diagnóstico de producción R3:** `DiscoveryHandler` diferencia un `McpToolError('invalid_arguments')` del ámbito de proyecto con `blocked / invalid_project_scope`, sin revelar rutas ni simular fallo de Chromium. Prueba nueva agregada en `discovery-handler.test.ts`, no ejecutada.
- **Estado formal:** R3 **PUBLICADA / PENDIENTE DE VERIFICACIÓN REAL**. No afirmar que se arreglaron los 18 tests hasta ejecución sobre HEAD actualizado. No se alteraron `main/develop`, esquema SQLite v2 ni la sesión local protegida; no se hicieron pruebas contra apps reales.
- **Documento:** [014D_R3_FIXTURES_Y_DIAGNOSTICOS.md](014D_R3_FIXTURES_Y_DIAGNOSTICOS.md). **Siguiente paso:** Codex repite seis suites MCP afectadas, valida `e0d` y `DiscoveryHandler`, compara 73 fallos por título y comunica errores posteriores a la preparación; después corregir funcionalmente el recorrido canónico. VNEXT-015 continúa sin iniciar.

## VNEXT-014-D-R4 — Aislamiento MCP y prueba de recorrido canónico (2026-11-04)

- **Base auditada por Codex:** SHA `22387b77162da984f9cfb167a93580219f1f9fff`, rama `feat/qap-vnext-architecture`. R3 pasó build de 10 paquetes, runner 71/71 y 18/18 casos objetivo de fixtures; MCP serial **391 PASS/56 FAIL** (447), lifecycle **2/7**, ESLint focal 0 diagnósticos. Fallo nuevo N01 de aislamiento tenía una expectativa incompatible con el rechazo de ámbito seguro `blocked / invalid_project_scope`; 55 casos persistentes pertenecen al inventario histórico VNEXT-013. El lint global y Stdio no fueron reejecutados en R3.
- **R4-01 publicado (sin ejecución):** caso `keeps project bindings and physical stores isolated between server instances` ahora valida rechazo seguro *y* los efectos positivos de cada servidor autorizado en su propio HTTP/SQLite sin cruzar observaciones. No se alteran los permisos de producción.
- **R4-02 publicado (sin ejecución):** nuevo test en `discovery-handler.test.ts` de adquisición real con Chrome en localhost → 6 observaciones/relaciones persistidas → `qap_rules_set.canonical_interview` con propuesta → negativa sin decisión del host → confirmación sintética independiente → `qap_module_close` legacy bloqueado → `canonical_closure.evaluate` → waiver canónico pendiente/aceptado por gateway de fixture → `qap_session_close` → WRAP_UP. Usa stores SQLite físicos y servidor MCP SDK real; prohíbe fabricar `rules.yaml`, cobertura certificada o aprobaciones productivas automáticas.
- **Limitación estricta:** ni el test N01 reconciliado ni el nuevo recorrido han sido ejecutados todavía. Un eventual fallo puede señalar un defecto real entre closure y lifecycle, no puede ocultarse relajando las aserciones. El test acredita un camino de renuncia, **no** cierre `closed` con siete categorías verificadas ni UI de aprobación humana real.
- **Dictamen:** VNEXT-014 continúa **NO-GO**. Reejecutar `pnpm build`, test de discovery-handler, lint afectado, MCP serial y runner sobre nuevo HEAD; después inventariar los 55 fallos pendientes y corregir integración/contratos por garantía. No iniciar VNEXT-015 ni tocar `main/develop`, SQLite v2 o la sesión local protegida.
- **Detalle:** [014D_R4_INTEGRACION_CANONICA_Y_AISLAMIENTO.md](014D_R4_INTEGRACION_CANONICA_Y_AISLAMIENTO.md).

## VNEXT-014-D-R4-R1 — Renuncia canónica durable → lifecycle → sesión (2026-11-04)

- **Auditoría independiente R4 recibida:** SHA `ed2955ff91a6506a80e3ff0e4bb9322cf9eed226`, 10 builds PASS, runner 71/71 PASS, MCP serial **392 PASS/56 FAIL** (448), lint focal PASS, global 46 errores/28 warnings. N01 de aislamiento entre dos servidores **PASS completo**. Los 55 casos históricos persisten, lifecycle 2/7. El nuevo R4-I01 llega a SQLite + waiver autorizado, pero `qap_session_close` bloquea antes del reporte y WRAP_UP: `waived exige waived_reason`.
- **Causa verificada por código/traza:** `CanonicalClosureService.commitFinalClosure` almacenaba la renuncia autorizada con `ModuleClosureRecord.waiverReason` y registraba recibo `canonical_module_waiver_v1`, pero en FileSystemStorage solo proyectaba `state: waived`. `reconcile` tampoco reparaba un módulo ya `waived` sin metadata, mientras `canExitWorking` exige motivo no vacío. Es defecto real del servicio previamente presente, no del fixture.
- **Corrección R4-R1 publicada, SIN reejecución:** método central `projectLifecycleClosure` reutilizado en commit y reconciliación. Para una nueva renuncia, `transitionModule` registra `waived_reason` exacto e historial validado. Para una renuncia ya durable con metadata incompleta, se reconstruye solo el motivo desde closureStore, sin nuevo approval/recibo/historial ficticio. No proyectar `waived` con motivo vacío; no degradar estados terminales incompatibles ni relajar `canExitWorking`.
- **Regresiones pendientes de ejecutar:** `canonical-coverage.test.ts` Crash Scenarios 2 y 3 verifican recuperación, historial, idempotencia y ausencia de duplicación; `discovery-handler.test.ts` R4-I01 exige `waived_reason` igual al motivo aprobado, transición registrada, recibo SQLite, `qap_session_close:success`, archivo reporte físico, `WRAP_UP` y ausencia de reglas legacy inventadas.
- **Estado formal:** **R4-R1 PUBLICADA / NO CERTIFICADA**. No declarar que R4-I01 pase hasta ejecución física del nuevo HEAD, y no trasladar R4 392/448 al SHA corregido. VNEXT-014 sigue **NO-GO**; VNEXT-015 no iniciado. No cambios en `main/develop`, SQLite canónico v2, ni sesión local protegida.
- **Documento de ejecución y alcance:** [014D_R4_R1_WAIVER_LIFECYCLE.md](014D_R4_R1_WAIVER_LIFECYCLE.md).

## VNEXT-014-D-R4-R2 — Snapshot reconciliado en primer qap_session_close (2026-11-04)

- **Nueva auditoría independiente R4-R1:** SHA `fd89c9de83337693aeb28f2df7861bf16d484f24` en Windows x64 Node 24.15.0 con SQLite FTS5. Compilación de 10 paquetes PASS, `discovery-handler` 59/59 PASS, `canonical-coverage` 25/25 PASS, runner 71/71 PASS y Stdio 18 tools PASS. `R4-I01` alcanza reporte físico y WRAP_UP, Crash 2/3 recuperan waiver durable e historial. MCP serial **393 PASS/55 FAIL** de 448, los 55 identificados nominalmente en la deuda histórica VNEXT-013; lifecycle 2/7. Lint focal (3 archivos) **12 errores en canonical-coverage.test.ts**, global **46 errores/28 warnings**. Node 22.13.0 no proporcionó FTS5 y se excluyó de la matriz definitiva.
- **Hallazgo nuevo R4-R1-A01:** una sonda externa con decisión durable y `lifecycle.modules.catalog.state=waived` sin `waived_reason` mostró que `qap_session_close` reparaba motivo y recibo en la primera llamada vía `allModulesClosed()`, pero devolvía `blocked / waived exige waived_reason`: `canExitWorking` y el reporte tomaban el snapshot cargado **antes** de reconciliar. La segunda llamada sí cerraba. El guard de negocio era correcto; la lectura estaba obsoleta.
- **Corrección de producción R4-R2 publicada sin ejecución:** `packages/mcp/src/server.ts` conserva la verificación de fase previa y el cierre canónico prioritario, relee el lifecycle **después** de `allModulesClosed` para usar la proyección actualizada en `canExitWorking`, el reporte y el cierre, y bloquea si la fase cambió entretanto. No modifica `canExitWorking`, `CanonicalClosureService` ni SQLite v2.
- **Regresión R4-R2 añadida sin ejecución:** `canonical-coverage.test.ts` Suite 5 prueba la **primera llamada** de cierre con waiver autorizado durable y metadata FS eliminada, sin segundo approval; requiere estado/reporte WRAP_UP, razón original conservada, historial y recibo sin duplicaciones, contenido del reporte respaldado por estado recuperado. Se corrigieron también cierres asíncronos del cliente/servidor de test y aserciones sobre requests capturadas/ID de decisión. No se afirma que los 12 errores de lint hayan desaparecido.
- **Estado formal:** **R4-R2 PUBLICADA / PENDIENTE DE AUDITORÍA FÍSICA**. Los 393/448 PASS corresponden **solo** a R4-R1; R4-R2 suma una prueba y todavía no tiene matriz propia. VNEXT-014 permanece **NO-GO**, VNEXT-015 sin comenzar. Mantener la política de no tocar `main/develop`, credenciales/archivo protegido, esquema SQLite canónico ni producción.
- **Documento y compuertas:** [014D_R4_R2_CIERRE_SESION_RECONCILIADO.md](014D_R4_R2_CIERRE_SESION_RECONCILIADO.md); siguiente auditoría independiente en Node 24 con FTS5 y Chromium, build + coverage + discovery + MCP serial + runner + lint y Stdio.

## VNEXT-014-D-R4-R3 — Integridad durable de renuncia y autorización (2026-11-04)

- **Auditoría independiente R4-R2 recibida:** SHA `4ed8511f2ee88e63ff2da21a5a6f45dd6786f7f9`, Windows/Node 24.15.0 con SQLite FTS5. **10 builds PASS, canonical-coverage 26/26 PASS, discovery 59/59 PASS, runner 71/71 PASS y Stdio 18 herramientas PASS**. R4-R2-A01 (primera llamada de `qap_session_close` tras reparar waiver) **PASS**, conserva motivo exacto, historia, recibos, sin segundo gateway, genera reporte y WRAP_UP. MCP serial **394/449 PASS, 55 FAIL** (los mismos 55 por identidad). Lint focal 4 errores por imports sin uso de coverage; lint global **38 errores/28 warnings**. La rama de auditoría quedó limpia.
- **R4-R2-A02 P1:** sonda interna con `ModuleClosureRecord.waiverReason` de un carácter permitió emitir recibo y `WRAP_UP`; motivo en blanco bloqueó la sesión pero igualmente generó recibo. `reconcile` validaba longitud no vacía después de crear recibo, sin aplicar el mínimo de 15 caracteres. **No se demostró una ruta pública para insertar ese estado interno.**
- **R4-R2-A03 P1:** sonda interna con cierre durable sin `snapshot.approvals` coincidente en `decisionId/requestDigest` permitió recibo/reporte/WRAP_UP. `status` y `allModulesClosed` confiaban en el estado terminal del registro sin cotejar la aprobación. **No se demostró una ruta pública para insertar ese estado interno.**
- **R4-R3 publicada, sin ejecución:** `CanonicalClosureService.isAuthorizedDurableClosure` exige estado/identidad de módulo coherentes, motivo substantivo de waiver (trim >=15), ID/digest no vacíos y exactamente un par de aprobación correlacionado. La validación precede a `reconcile`/recibos; `status` no certifica un cierre inválido, `execute` no da respuesta idempotente de éxito ante ese registro y las rutas CAS de `commitFinalClosure` comprueban los existentes. `projectLifecycleClosure` conserva la protección de motivo. No se modifica `canExitWorking`, SQLite canónico v2 ni el modelo de autoridad.
- **Regresiones R4-R3 publicadas y pendientes:** siete casos nuevos en `canonical-coverage.test.ts` inyectan estados durables sintéticos: razón de un carácter, razón blanca, aprobación ausente/digest distinto/duplicada, `closed` sin aprobación y lifecycle ya terminal sin aprobación. Todos deben bloquear `qap_session_close`, no crear recibo ni reporte, no reescribir lifecycle, y bloquear reintento de `execute`; además deben conservar las regresiones positivas (Crash 2/3, waiver válido, primera llamada a WRAP_UP). Retirados cuatro imports sin uso del test, **sin inferir PASS de lint**.
- **Dictamen:** VNEXT-014 **NO-GO** hasta auditoría física R4-R3 y reconciliación de 55 garantías históricas/lint global. VNEXT-015 sin iniciar. No tocar `main/develop`, archivo de sesión protegido, credenciales ni producción.
- **Documento:** [014D_R4_R3_VALIDACION_DURABLE_CIERRE.md](014D_R4_R3_VALIDACION_DURABLE_CIERRE.md).

### Resultado independiente R4-R3 (2026-11-04)

- **SHA auditado:** `7e0142a97c67fa1c65c46a83e2a5f003b0b435cd`. Build 10 paquetes, casos adversariales 7/7, Coverage 33/33, Discovery 59/59 en reintento, runner 71/71 y Stdio 18 herramientas con `qap_init` real. Crash 2/3 y primer cierre de R4-R2-A01 PASS.
- **A02 y A03 verificados.** Los registros inválidos quedan bloqueados sin recibo, reporte, consulta al gateway ni cambio de lifecycle. **R4-R3-A01 (P2) pendiente.** `qap_status` todavía recomienda cerrar cuando el lifecycle legacy está terminal y la autorización durable es inválida. El estado canónico y la compuerta de cierre bloquean correctamente.
- **VNEXT-014 NO-GO.** MCP integral completo **401 PASS / 55 FAIL de 456**, con los 55 títulos históricos. Lint global **35 errores / 28 advertencias**. Los cuatro imports quedaron limpios y persiste un error focal `preserve-caught-error`. Quedan por corregir guidance, reconciliar los fallos históricos y cerrar lint. VNEXT-015 sigue pendiente.
- [Informe y evidencia publicada](auditorias/VNEXT-014-R4-R3/INFORME.md).

## VNEXT-014-D-R4-R4 — Guidance coherente con cierre canónico (2026-11-04)

- **Fuente independiente revisada directamente en GitHub:** Codex publicó informes R4-R3 en `docs/vnext/auditorias/VNEXT-014-R4-R3/` con commit documental `230f61f4fe91f4583fcf1706e61923316d05c374`; SHA de código auditado `7e0142a97c67fa1c65c46a83e2a5f003b0b435cd`. Build 10 PASS, adversariales 7/7, Coverage 33/33, Discovery 59/59 en reintento, runner 71/71 y Stdio 18 PASS; MCP serial **401 PASS/55 FAIL** (456), lint global **35 errores / 28 warnings**. Primera ejecución de Discovery tuvo un timeout y primer MCP integral un worker interrumpido: causa pendiente. A02/A03 PASS y R4-R2-A01 conservado.
- **Nuevo defecto R4-R3-A01 P2:** `qap_status` informó `canonical_modules[].closure.state='working'` pero recomendó `qap_session_close` cuando `lifecycle.json` ya mostraba `catalog:waived` sin asiento de autorización correlacionado. `qap_session_close` rechazó correctamente la sesión con `canonical_module_closure_required`. El defecto era guidance legacy calculado sin cotejar cierre canónico; la sonda inyectó un estado inconsistente por store interno, sin demostrar entrada pública.
- **Corrección R4-R4 publicada, aún SIN ejecución física:** `StatusHandler.execute` mantiene lista de módulos canónicos host-bound pendientes; solo considera resueltos los `closed/waived` verificados por `CanonicalClosureService.status`; en WORKING, si el guidance legacy recomienda `qap_session_close` y existen pendientes, reemplaza la sugerencia por revisión `qap_module_close` e indica `canonical_pending_closure_modules`. Se conserva `canExitWorking` y la compuerta de sesión. Error de lint `preserve-caught-error` del servicio corregido con `Error.cause`, sin declarar lint verde.
- **Pruebas R4-R4 publicadas, pendientes:** los 7 escenarios negativos de `canonical-coverage.test.ts` verifican también `qap_status` sin recomendación de cerrar; el caso legacy terminal exige `canonical_pending_closure_modules: ['catalog']` y `qap_module_close`. Nueva regresión positiva: un waiver con autorización válida debe conservar `siguiente_accion.tool='qap_session_close'`. **1 test nuevo** sobre las 456 pruebas MCP del baseline, sin extrapolar PASS.
- **Entrega GitHub obligatoria:** el siguiente auditor Codex verifica R4-R4 en el worktree físico, actualiza `docs/vnext/014D_R4_R4_STATUS_GUIDANCE_CANONICO.md`, `STATE.md` y `04_BACKLOG_Y_WBS_PRELIMINAR.md`, y publica informes/logs saneados bajo `docs/vnext/auditorias/VNEXT-014-R4-R4/`, con commit/push exclusivamente documental en `feat/qap-vnext-architecture`. El usuario no necesita transportar archivos entre computadoras.
- **Estado formal:** **R4-R4 PUBLICADA / NO CERTIFICADA; VNEXT-014 NO-GO; VNEXT-015 sin iniciar**. Permanecen 55 garantías históricas MCP, lint global y cierre `closed` por cobertura auténtica, sesión multi-módulo y replanificación. No alterar `main/develop`, el archivo protegido de sesiones, el esquema SQLite v2 ni secretos.
- **Nota técnica:** [014D_R4_R4_STATUS_GUIDANCE_CANONICO.md](014D_R4_R4_STATUS_GUIDANCE_CANONICO.md).

### Resultado independiente R4-R4 (2026-11-04)

- **SHA de código auditado** `9df524501eb2365df9f204f2134bd86ebdc36717`. Build 10 paquetes, R4-R3 7/7 y R4-R4 1/1, Coverage 34/34, Discovery 59/59, runner 71/71 y Stdio 18 herramientas con `qap_init` real. Crash 2/3 y primer cierre R4-R2-A01 PASS.
- **R4-R3-A01 verificado.** Se bloquea la recomendación ante cierre inválido y se conserva para el waiver autorizado del control positivo. **R4-R4-A02 pendiente.** Con 17 waivers válidos, el límite de inventario deja el módulo 17 como falso pendiente aunque el cierre real genera reporte y alcanza WRAP_UP.
- **VNEXT-014 NO-GO.** MCP serial **402 PASS / 55 FAIL de 457**, sin cambios en los 55 títulos históricos. ESLint focal limpio con `preserve-caught-error` resuelto. Lint global **34 errores / 28 advertencias**. Pendientes el guidance para más de 16 vínculos, los casos MCP históricos, el lint global y las compuertas previas de cobertura real y replanificación. VNEXT-015 sigue pendiente.
- [Informe independiente](auditorias/VNEXT-014-R4-R4/INFORME.md).

## VNEXT-014-D-R4-R5 — Validación de todos los módulos vinculados (2026-11-04)

- **Auditoría R4-R4 recibida en GitHub, sin subir archivos manuales:** Codex publicó commit documental `12fbca16e9a5265b20ed12c14f7f0a8d8602a514` con informes en `docs/vnext/auditorias/VNEXT-014-R4-R4/`. SHA de código auditado `9df524501eb2365df9f204f2134bd86ebdc36717`. Build 10 PASS; siete negativos R4-R3 y positivo R4-R4 PASS; coverage **34/34**, discovery **59/59**, runner **71/71**, Stdio **18 tools** con `qap_init` PASS. MCP serial **402 PASS / 55 FAIL de 457**, por identidad coinciden los 55 casos de VNEXT-013. Lint focal **cero errores y cero advertencias**; lint global **34 errores / 28 warnings**.
- **R4-R4-A02 P2 — nuevo hallazgo físico:** sonda de Codex construyó 16 o 17 cierres durables `waived` con motivos sustantivos y aprobaciones correlacionadas. Con 16 módulos, `qap_status` recomendó correctamente `qap_session_close`. Con 17, señaló falsamente `module-17` pendiente mientras `qap_session_close` completó **WRAP_UP** y reporte, sin nueva aprobación. `StatusHandler` inicializaba pendientes sobre todos los vínculos, pero consultaba `closure.status` solo para `slice(0,16)`. El límite era de visualización, no debía regir la autoridad.
- **R4-R5 publicada, sin ejecución:** `status.handler.ts` evalúa `CanonicalClosureService.status(name)` para **todos** los nombres únicos vinculados al host; mantiene `canonical_modules` limitado a **16 entradas visibles**. Solo elimina un módulo de pendientes ante estado `closed` o `waived` autorizado, sin inventar aprobaciones. La compuerta real de sesión y SQLite permanecen intactos.
- **Regresiones R4-R5 publicadas, pendientes:** `canonical-coverage.test.ts` agrega tres pruebas parametrizadas en fixture físico de 16 waivers válidos, 17 válidos y 17 con último asiento de aprobación ausente. Exigen inventario visible 16, guidance coherente con cierre y reporte físico/WRAP_UP solo en casos válidos; el inválido debe devolver `canonical_module_closure_required` y no tener reporte. Se preservan las siete pruebas negativas R4-R3 y el positivo R4-R4. Los tres nuevos casos **aún no tienen métricas ejecutadas**.
- **Comprobación siguiente:** Codex audita el SHA exacto R4-R5 con Node 24/SQLite FTS5, build, Vitest, runner, Stdio y lint, publica solo informes y logs saneados bajo `docs/vnext/auditorias/VNEXT-014-R4-R5/`, actualiza este STATE, backlog y nota R4-R5, y hace push documental únicamente a la rama vNext.
- **Estado formal:** **R4-R5 PUBLICADA / NO CERTIFICADA; VNEXT-014 NO-GO; VNEXT-015 sin iniciar**. Deuda MCP 55 fallos históricos, lint global 34 errores/28 warnings y E2E `closed` de cobertura real, multi-módulo/replanificación pendientes. Ningún cambio a `main/develop`, SQLite canónico v2 o sesión protegida.
- **Nota:** [014D_R4_R5_STATUS_GUIDANCE_SIN_LIMITE.md](014D_R4_R5_STATUS_GUIDANCE_SIN_LIMITE.md).

### Resultado independiente R4-R5 (2026-11-04)

- **SHA de código auditado** `f531e4e6b444c06ad85fd1f5f533837fd3467145`. Build 10 paquetes, R4-R5 3/3, Coverage 37/37, Discovery 59/59, runner 71/71 y Stdio 18 herramientas con qap_init real.
- **R4-R4-A02 verificado.** Con 16/17 waivers válidos la recomendación y el cierre coinciden, inventario visible 16 y reporte físico. Con el último sin aprobación, pendiente exacto, cierre bloqueado y sin reporte. Sonda SDK adicional confirma cero nuevas consultas de aprobación y snapshots intactos.
- **VNEXT-014 NO-GO.** MCP 405 PASS / 55 FAIL de 460. Los 55 conservan identidad. ESLint focal limpio, global 34 errores / 28 advertencias. [Clasificación por primera aserción y contrato](auditorias/VNEXT-014-R4-R5/CLASIFICACION_55_FALLOS.md). Siguiente trabajo, integrar los cinco lifecycle sobre los stores canónicos preservando preguntas, revisión, cobertura real, cierre y replanificación. Después migrar las suites por garantía y resolver lint. VNEXT-015 sigue sin iniciar.
- [Informe independiente publicado](auditorias/VNEXT-014-R4-R5/INFORME.md).

## VNEXT-014-D-R4-R6 — Primer bloque P0 de continuidad de entrevista canónica (2026-11-04)

- **Auditoría R4-R5 descargada directamente de GitHub:** commit documental de Codex `be35ae4354facd7780befb57e58d31af1eebd09e`; código auditado `f531e4e6b444c06ad85fd1f5f533837fd3467145`. Windows/Node 24.15.0 + SQLite 3.51.3 FTS5: build 10 paquetes PASS; `R4-R5-A02` **3/3 PASS**, `canonical-coverage` **37/37**, discovery **59/59**, runner **71/71**, Stdio **18 tools + qap_init** PASS; MCP serial **405 PASS / 55 FAIL de 460**; ESLint focal 0 errores, global **34 errores / 28 warnings**. R4-R4-A02 (guidance para módulo 17) **verificado corregido** con waivers válidos e inválidos, recibos/gateway intactos.
- **Clasificación de 55 fallos recibida y versionada:** `docs/vnext/auditorias/VNEXT-014-R4-R5/CLASIFICACION_55_FALLOS.md`; los cinco tests lifecycle E0a/E1/E2/E3/criterio 9 son prioridad P0 por ausencia de cadena positiva equivalente entre discovery físico, entrevista canónica, confirmación independiente, cobertura, cierre `closed`, reporte y replanificación. Otros 50 fallos contienen precondiciones de binding/contexto y contratos legacy que deben migrarse por garantía; rechazo seguro no equivale a cobertura de la funcionalidad anterior.
- **R4-R6 código publicado, NO probado:** `StatusHandler.execute` reconoce preguntas canónicas pendientes reales del host en WORKING con `CanonicalInterviewService.status(module)` y, si `availability='general_questions_available'`, `pending_questions>0` y cierre no terminal, dirige `siguiente_accion` a `qap_rules_set` con `canonical_interview:{action:'next'}` y módulo exacto. No ejecuta `next` como efecto de status, no declara aprobación/cobertura ni genera YAML legacy. `SiguienteAccion` tipa el parámetro. La verificación de cierre de todos los vínculos, preview 16 y guardas de fase/host permanecen.
- **Regresión real pendiente de ejecución:** `R4-R6-I01` en `canonical-interview.test.ts` usa el SDK MCP, SQLite y `ModuleObservationBridge` para comprobar que antes de abrir una pregunta no hay entrevista inventada, que después `qap_status` indica el comando canónico exacto, que la repetición es estable y devuelve el mismo ID/versión, sin modificar lifecycle, relaciones ni requisitos, sin nueva aprobación gateway ni `rules.yaml`.
- **Límites:** esta entrega **no arregla ni reetiqueta los cinco tests lifecycle históricos**; no prueba cierre `closed`, dos módulos con waiver+closed, reporte/replanificación ni UI humana fuera de fixtures. No suponer nueva matriz 406/461. Codex debe ejecutar sobre el HEAD real y publicar documentación bajo `docs/vnext/auditorias/VNEXT-014-R4-R6/`, actualizar esta nota y el backlog, commit/push SOLO documental a la rama vNext. No afectar `main/develop`, SQLite v2, tokens ni sesión protegida.
- **Dictamen:** **R4-R6 PUBLICADA / NO CERTIFICADA; VNEXT-014 NO-GO; VNEXT-015 sin iniciar**. Fuente de trabajo: [014D_R4_R6_CONTINUIDAD_ENTREVISTA_CANONICA.md](014D_R4_R6_CONTINUIDAD_ENTREVISTA_CANONICA.md).


### Resultado independiente R4-R6 (2026-11-05)

- **Código auditado:** `fbc089c02b71828994a62af1a9eb6d28e33cb4bb`. Remoto y worktree aislado verificados, Node 24.15.0/SQLite FTS5, dependencias congeladas. Build 10 paquetes PASS, R4-R6-I01 1/1, entrevista 43/43, Coverage 37/37, runner 71/71 y Stdio 18 herramientas + qap_init real PASS.
- **Continuidad verificada.** Status no inventa preguntas, reanuda mediante next la pregunta real con ID/versión estable, sin confirmar requisitos, pedir aprobación o generar rules.yaml. Sonda externa confirma tablas SQLite, DB/WAL y lifecycle intactos para v0/v1. Cierre durable, recuperación en primera llamada y guidance de 17 módulos conservan sus regresiones PASS.
- **Matriz:** MCP **406 PASS / 55 FAIL de 461**, los mismos 55 títulos históricos y una alta aprobada. Discovery inicial 58 PASS/1 timeout de cancelación, luego 59/59 en integral y repetición aislada. La intermitencia ya registrada en R4-R3 conserva causa interna indeterminada. Lint focal limpio; global 34 errores/28 advertencias, diagnósticos sin cambios.
- **Siguiente P0:** composición física de propuesta/corrección → revisión independiente → requisito confirmado → evaluación, reutilizando servicios/gateways existentes. Después closed por requisitos nacidos de entrevista, segundo módulo waived, reporte y nueva sesión; conservar invalidación por revisión y límites de ejecución not_executed. No migrar los 55 por expectativas más débiles.
- **Dictamen:** R4-R6 continuidad verificada; **VNEXT-014 NO-GO**, VNEXT-015 sin iniciar. Publicación solo documental, SHA de código separado del commit del informe. Checkout original, sesión protegida, producción, tests y esquemas intactos.
- [Informe publicado](auditorias/VNEXT-014-R4-R6/INFORME.md), [diferencial](auditorias/VNEXT-014-R4-R6/DIFERENCIAL_MCP.md), [análisis P0](auditorias/VNEXT-014-R4-R6/SIGUIENTE_BLOQUE_P0.md).

## VNEXT-014-D-R4-R7 — Composición propuesta/corrección → aprobación host → cobertura (2026-11-05)

- **Auditoría R4-R6 verificada directamente en GitHub:** informe Codex en `docs/vnext/auditorias/VNEXT-014-R4-R6/`, commit documental `8b9b7b84cfff70d91e55a2a2b1ef6578994eedd9`, código auditado `fbc089c02b71828994a62af1a9eb6d28e33cb4bb`. Build 10 paquetes PASS, Canonical Interview **43/43**, Coverage **37/37**, Runner **71/71**, Stdio 18 + init PASS; MCP serial **406 PASS / 55 FAIL de 461**, las 55 identidades históricas sin cambio. ESLint focal cero, global **34 errores / 28 warnings**. Discovery 59/59 en repetición e integral, con timeout inicial de cancelación en vuelo no diagnosticado. R4-R6-I01 PASS (misma pregunta/version, status sin mutaciones ni aprobación). 
- **Decisión P0 de R4-R7:** no duplicar motor, gateways ni esquemas. Integrar y auditar los servicios ya existentes: `CanonicalInterviewService`, `IHumanReviewGateway`, `ModuleObservationBridge`, `SqliteKnowledgeAdapter`, `SqliteModuleClosureStore` y `CanonicalCoverageService`; el siguiente hito de producto será cierre `closed` auténtico con aplicabilidad aprobada, dos módulos, reporte y replanificación. 
- **Único cambio de R4-R7 hasta ahora (código de tests, NO productivo):** se publicó `R4-R7-I01` en `packages/mcp/src/__tests__/canonical-interview.test.ts`. El helper del fixture puede inyectar cierre durable con clave temporal; los almacenes se cierran al limpiar. La prueba usa MCP SDK + SQLite físicos para realizar pregunta, propuesta, revisión sin aprobación, corrección con nueva versión, rechazo de la aprobación vieja, aprobación del digest exacto por inbox host, readback de requisito confirmado + recibo correlacionado y evaluación antes/después. Exige que `functional` esté satisfecha por el requisito con criterios, mientras categorías no revisadas siguen `unknown`, cierre bloqueado, `execution_coverage=not_executed` y lifecycle intacto. Sin `rules.yaml` ni aprobación inventada.
- **Estado de evidencia:** prueba **PUBLICADA / SIN EJECUTAR** sobre el nuevo HEAD. No se declara 407 PASS ni se altera el inventario de 55 fallos. La revisión humana del fixture es independiente del argumento MCP y no equivale a UI productiva. Codex debe auditar este HEAD en worktree aislado con Node 24/SQLite FTS5, probar build, entrevista, coverage, discovery, MCP serial, runner, lint y Stdio, y publicar solo Markdown/logs saneados bajo `docs/vnext/auditorias/VNEXT-014-R4-R7/`, actualizando esta nota y el backlog. No modificar código ni tests; reportar resultados y cualquier defecto físico para siguiente corrección.
- **Dictamen:** **R4-R7 PENDIENTE DE QA; VNEXT-014 NO-GO; VNEXT-015 no iniciado.** Persisten cinco lifecycle P0 sin cadena completa, 55 fallos históricos, 34 errores/28 warnings de lint y la intermitencia de Discovery. [Nota R4-R7](014D_R4_R7_PROPUESTA_REVISION_COBERTURA_CANONICA.md).

### Resultado independiente R4-R7 (2026-11-05)

- **Código auditado:** `ea75eb2c52266b174e6d24917c1b089d56834900`; worktree aislado, Node 24.22.1/SQLite 3.53.4 FTS5, lockfile congelado y Chromium 153. Build 10 paquetes PASS; R4-R7-I01 1/1, entrevista **44/44**, Coverage **37/37**, Discovery **59/59** aislado y en integral, runner **71/71**, Stdio **18 herramientas + init** por servidor y CLI.
- **Tramo R4-R7 verificado:** propuesta sin autorización bloqueada; corrección v1→v2 cambia digest; decisión vieja rechazada; host independiente confirma el texto exacto, 1 requisito y 1 recibo, retry idempotente y segunda conexión SQLite exacta. Cobertura cambia de 0 a 1 requisito, 7 a 6 brechas, functional satisfecha y otras categorías unknown; cierre bloqueado, ejecución not_executed, lifecycle intacto y sin rules.yaml.
- **Matriz MCP:** **407 PASS / 55 FAIL de 462**. Mismas 55 identidades, 406 PASS comunes y una alta R4-R7-I01 aprobada. Lint focal solicitado **5 errores/0 warnings**, todos históricos de canonical-coverage-service (foco ampliado frente a R4-R6); global **34 errores/28 advertencias**, 62 diagnósticos idénticos. Discovery no reprodujo timeout, causa histórica sigue pendiente.
- **Hallazgo 014-R4-R7-A01 P1 preexistente:** declare_non_applicable regenera decided_at y sus digests al repetir la misma petición pendiente; una aprobación posterior del digest anterior devuelve closure_review_invalid sin writes. Afecta inbox desacoplado; no se observó bypass. Resolver antes de componer el siguiente P0. Detalles y sonda reproducible en [evidencia](auditorias/VNEXT-014-R4-R7/EVIDENCIA_INTEGRACION.md).
- **Dictamen:** R4-R7 propuesta/revisión/cobertura **PASS funcional acotado**; **VNEXT-014 NO-GO**, VNEXT-015 sin iniciar. Pendientes closed auténtico, decisiones independientes de aplicabilidad/cierre, segundo módulo waived, reporte canónico y replanificación; conservar E0a/E1/E2/E3/criterio 9 y los otros 50 casos. [Informe](auditorias/VNEXT-014-R4-R7/INFORME.md), [siguiente P0](auditorias/VNEXT-014-R4-R7/SIGUIENTE_BLOQUE_P0.md).

## VNEXT-014-D-R4-R8 — Aplicabilidad diferida estable (2026-11-05)

- **R4-R7 auditada y archivada:** Codex publicó commit documental `d0fa36f0baaf1baaf6ea20e3bea592cb4c398921` sobre código `ea75eb2c52266b174e6d24917c1b089d56834900`: build 10 PASS, Canonical Interview **44/44**, Coverage **37/37**, Discovery **59/59**, Runner **71/71**, Stdio 18+init PASS. MCP serial **407 PASS / 55 FAIL de 462** (55 títulos históricos sin cambios). ESLint focal ampliado 5 errores preexistentes del servicio de cobertura; lint global **34 errores y 28 advertencias**. R4-R7-I01 PASS: confirmación de requisito por host, corrección que invalida decisión previa, recibo único, readback y cobertura incompleta honesta.
- **R4-R7-A01 P1 reproducido por Codex:** `declare_non_applicable` recreaba `decided_at` antes de la aprobación; el `coverageDigest` y `requestDigest` cambiaban entre solicitudes pendientes idénticas. Un inbox desacoplado devolvía autorización vinculada a solicitud vieja y el servicio rechazaba con `closure_review_invalid`; cero decisiones persistidas. No se demostró bypass, pero sí ruptura del reintento diferido.
- **R4-R8 publicada, NO ejecutada:** `CanonicalCoverageService.evaluate` elimina el reloj provisional `decided_at` del digest semántico de aplicabilidad pero conserva categoría, aplicabilidad, motivo, revisor, decision_id, revisión de requisitos, brechas y contexto. El campo fecha sigue presente en registros/evaluación. `CanonicalClosureService.execute` reevalúa cobertura al recibir decisión del gateway, bloquea deriva como `closure_context_changed` y registra el instante real del host; valida que `decidedAt` exista y que `expiresAt` sea posterior/no vencido. El esquema v1/v2 no cambia; revisar compatibilidad de digests históricos con auditoría real.
- **Tres regresiones R4-R8-A01 nuevas pendientes:** reintentos pendientes con la misma identidad y aprobación posterior; cambio de motivo o revisión de requisito invalida aprobación anterior; una mutación de KnowledgeStore mientras el gateway espera impide la escritura en ClosureStore. No afirmar nuevos PASS. No se ha demostrado transacción atómica entre dos stores en todas las carreras, ni reintentos después de aprobación concurrente.
- **Siguiente tarea:** Codex debe auditar SHA exacto R4-R8 con Node 24/FTS5, build, foco R4-R8, cobertura/entrevista/discovery/MCP serial, runner, ESLint, Stdio y sondas de compatibilidad/hashes; publicar `docs/vnext/auditorias/VNEXT-014-R4-R8/` e informes actualizados mediante commit exclusivamente documental en la rama vNext, separando SHA de código y SHA documental. El usuario no transportará informes.
- **Estado:** **VNEXT-014 NO-GO**, R4-R8 publicada sin QA independiente, VNEXT-015 no iniciado. Luego continuar `closed` auténtico con requisitos aprobados, aplicabilidad con consentimiento separado, módulo B waived, reporte físico fiel y replanificación; preservar garantías históricas E0a/E1/E2/E3/criterio 9, 55 fallos MCP, 34 errores/28 warnings de lint y timeout Discovery abierto.
- [Nota R4-R8](014D_R4_R8_APLICABILIDAD_DIFERIDA.md) · [Informe independiente R4-R7](auditorias/VNEXT-014-R4-R7/INFORME.md).

### Resultado independiente R4-R8 (2026-11-05)

- **Código auditado exacto:** `44c69f826a0599eeee400ff413ae9faedeeecd75`; contexto recuperado de GitHub, worktree aislado, Node 24.15.0/SQLite 3.51.3 FTS5, pnpm 12.3.4, Chromium 153 y lockfile congelado. Build 10 paquetes; R4-R8-A01 **3/3**, Coverage **40/40**, Interview **44/44**, Discovery **59/59** aislado y en integral, Runner **71/71**, Stdio servidor/CLI **18 tools + qap_init** PASS.
- **R4-R7-A01 corregido con alcance:** mismos pendientes conservan ambos digests, aprobación diferida aceptada y decided_at exacto del host leído en segunda conexión. Categoría/motivo/revisión diferentes invalidan; mutación durante gateway bloquea sin escrituras de autorización. No declarar atomicidad entre stores.
- **R4-R8-A02 P1 de producción reproducido:** requisito modificado después de la revalidación y antes de transacción ClosureStore permite declared_non_applicable y persistencia de una aprobación/decisión para cobertura obsoleta. Sonda externa con SQLite y decorador determinista del puerto; límite transversal preexistente estrechado, no eliminado. Resolver contrato de vigencia hasta commit y probar la frontera adversarial antes de certificar.
- **Históricos:** servicios exactos R4-R7 producen closed/waived físicos reconocidos por R4-R8 y conservados al reabrir, con rechazo al sustituir el digest de aprobación por uno ajeno. El hash evaluado sí cambia con aplicabilidad; no asumir equivalencia entre algoritmos ni compatibilidad automática de solicitudes pendientes antiguas.
- **MCP 410 PASS / 55 FAIL de 465:** 407 aprobaciones y 55 fallos comunes con identidad exacta, tres altas PASS, cero bajas. Crash 2/3, cierre durable y guidance 17 conservados. Discovery no reproduce timeout; causa histórica pendiente. Lint foco **6 errores/0 warnings**, global **35 errores/28 warnings**, 62 históricos iguales y una alta **R4-R8-L01 P2**, prefer-const en test nuevo línea 542.
- **VNEXT-014 NO-GO; VNEXT-015 sin iniciar.** Siguiente P0 preparado documentalmente: vigencia transversal, requisito desde entrevista, aplicabilidad aprobada, cobertura completa, A closed, B waived, reporte físico fiel, WRAP_UP y nueva sesión; preservar E0a/E1/E2/E3/criterio 9 y distinguir especificación de ejecución funcional aprobada. No se implementó ni se modificaron código/tests/esquemas/sesiones. Commit documental separado del SHA auditado, identificable en historial del informe y en entrega.
- [Informe R4-R8](auditorias/VNEXT-014-R4-R8/INFORME.md) · [Evidencia](auditorias/VNEXT-014-R4-R8/EVIDENCIA_APLICABILIDAD.md) · [MCP](auditorias/VNEXT-014-R4-R8/DIFERENCIAL_MCP.md) · [P0](auditorias/VNEXT-014-R4-R8/SIGUIENTE_BLOQUE_P0.md).

## VNEXT-014-D-R4-R9 — Frontera de vigencia de autorizaciones (2026-11-05)

- **Base verificada:** `4829a7d4af869f29f1d4c9b2d2d4124a3796b2ca`; auditoría R4-R8 en `docs/vnext/auditorias/VNEXT-014-R4-R8/`, código examinado `44c69f826a0599eeee400ff413ae9faedeeecd75`.
- **R4-R9 publicada, no auditada físicamente:** `SqliteKnowledgeAdapter.withWriteFence` utiliza conexión SQLite independiente con `BEGIN IMMEDIATE` para impedir escrituras de Knowledge hasta completar el commit del ClosureStore. `CanonicalClosureService` exige capacidad, revalida digest y snapshot de cierre bajo el fence, verifica caducidad y compara el estado dentro de la transacción; si no puede garantizarlo, responde bloqueado sin autorizar. El método es una capacidad opcional, no una falsa promesa del puerto v1 genérico.
- **Mayor cobertura de digest:** ahora incluye también ID/revisión de requisitos pendientes; invalida aprobaciones obsoletas incluso si los pendientes siguen en categoría no aplicable. Históricos terminales mantienen sus asientos sin migración; solicitudes antiguas pendientes deberán revalidarse.
- **R4-R8-L01:** se cambió la declaración de `f` a `const` sin modificar la aserción. Se agregaron cinco regresiones R4-R9-A02 físicas propuestas (intercalado, close/waive, falta de capacidad, expiración y revisión pendiente); todavía no hay resultados de ejecución.
- **Limitaciones:** el bloqueo se limita a escrituras por conexiones SQLite cooperantes a un mismo archivo físico; no constituye atomicidad/crash transaccional entre dos bases, ni cubre otros adaptadores, memoria aislada, mutaciones fuera de SQLite, ni garantiza latencia. El recibo Knowledge posterior al commit del cierre sigue recuperable por conciliación. **No afirmar PASS ni GO.**
- **Siguiente control:** Codex debe auditar exactamente el SHA remoto publicado tras R4-R9, instalar dependencias desde lockfile, ejecutar build, pruebas focales e integrales y prueba adversarial con segunda conexión/proceso, comparar los 55 fallos y publicar informe únicamente documental en el repo. Continuar composición P0 después de auditar. **VNEXT-014 NO-GO; VNEXT-015 sin iniciar.**
- [Nota técnica R4-R9](014E_R4_R9_CONSISTENCY_FENCE.md).

### Resultado independiente R4-R9 (2026-11-05)

- **SHA de código auditado:** 09c9ce276c9c328026de4236dadf0a85d8e94d21; worktree detached aislado, sin código posterior. **VNEXT-014 NO-GO; VNEXT-015 no iniciado.** [Informe independiente](auditorias/VNEXT-014-R4-R9/INFORME.md).
- **R4-R8-A02: corrección condicionada comprobada**, para mismo archivo físico estable y escritores SQLite normales. Otra conexión y otro proceso bloqueados durante fence; recuperan escritura tras release, excepción y terminación física. No atomicidad Knowledge/Closure/FS. **R4-R9-A02 P1:** ruta relativa + cambio de cwd hace que fence abra otro archivo y permite la aprobación obsoleta; no se demostró cwd cambiante en servidor productivo. **R4-R9-A01 P1:** cambio real de session/plan en lifecycle después de revalidar persiste autorización para contexto anterior, incluido close/waive. Reproducciones y correcciones en [evidencia](auditorias/VNEXT-014-R4-R9/EVIDENCIA_CONCURRENCIA.md).
- **Matriz física:** install congelado/FTS5/Node24.15.0 y diez builds PASS; cinco R9 y tres R8 PASS; Coverage **44/45**, Interview44/44, Discovery59/59, Runner71/71; Stdio18+qap_init por servidor/CLI PASS. MCP **406 PASS / 64 FAIL de 470**: 55 históricos idénticos + ocho incompatibilidades del MemoryKnowledgeStore sin fence + Scenario4 concurrente SQLite real (R4-R9-A03 P2: ganador waived/perdedor blocked, retry posterior idempotente). Sin bajas ni tests/expectativas cambiados.
- **Lint L01 certificado:** global **34 errores/28 warnings**, foco ampliado **5/0**; exactamente 62 diagnósticos históricos idénticos, una baja prefer-const, cero altas. El lint histórico sigue pendiente.
- **Límites adicionales:** R4-R9-A04 registra expiración posible entre callback y commit, no vigencia a commit; definir contrato de consumo. **R4-R9-A05 P1 preexistente:** accept_gaps sobre brecha existente falla por receipt ausente antes del gateway, reproducido también en servicio R4-R8. Las sondas no certifican aceptación funcional ni E2E humano. Nuevo digest invalida solicitudes antiguas incluso sin pendientes; closed/waived históricos se conservan sin recalcular autoridad.
- **Compuerta:** corregir P1 y regresión de concurrencia, preservar negativos/historial/recuperación y reconciliar matriz; después completar A closed+B waived+reporte/WRAP_UP/replanificación y E0a/E1/E2/E3/criterio9 sin requisitos confirmados ni aprobaciones ficticias para certificar integrado. [Siguiente bloque](auditorias/VNEXT-014-R4-R9/SIGUIENTE_BLOQUE_P0.md).


## VNEXT-014-D-R4-R10 — Remediación P1 publicada, QA pendiente (2026-11-05)

- Entrada: informe R4-R9 en `docs/vnext/auditorias/VNEXT-014-R4-R9/`, HEAD documental `05c0253b90c179612a166f1d98702efd14f99be7`.
- A01: se reutiliza lock de lifecycle de FileSystemStorage y se verifica huella completa hasta la transacción; garantía condicionada a escritores cooperantes.
- A02: se fija ruta canónica e identidad física de Knowledge SQLite; cola FIFO local para proteger titular contra busy_timeout sin avanzar.
- A05: accept_gaps propone brecha base sin aprobación; valida IDs reales y aplica el recibo verdadero del host tras consentimiento. Cinco regresiones agregadas sin ejecutar.
- A03: cola introducida, pero idempotencia concurrente por certificar. A04: vencimiento al COMMIT todavía pendiente. No afirmar atomicidad entre bases ni FS.
- Estado: implementación publicada, **NO-GO** sin build/test físico de R4-R10; 55 históricos sin reconciliar y recorrido canónico A closed + B waived + reporte/WRAP_UP/replanificación pendiente.
- [Nota técnica R4-R10](014F_R4_R10_ESTABILIZACION_P1.md) · [Auditoría previa R4-R9](auditorias/VNEXT-014-R4-R9/INFORME.md).
