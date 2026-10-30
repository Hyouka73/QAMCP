# QAMCP vNext — Continuidad Codex

Actualizado: 2026-10-30. Agente principal único.

## Estado y alcance

**VNEXT-001 a VNEXT-006 terminadas** por autorización expresa, con límites documentados.
**VNEXT-007 completada con limitaciones: crawler estático anónimo** por autorización
expresa del 2026-10-30. No se certifica exploración SPA con JavaScript.
Detener aquí. VNEXT-008 y posteriores requieren nueva autorización.
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
No iniciar VNEXT-008, Advisor, inferencias, nuevos handlers ni integración develop.
