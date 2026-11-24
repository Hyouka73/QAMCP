# QAP · Resolución técnica del bloqueante AR-27 (Captura multimedia privada, frontera preventiva y custodia criptográfica)

**Rol:** Antigravity, Auditor Técnico Independiente de QAP (bajo dirección del Orquestador Principal).  
**Repositorio:** `Hyouka73/QAMCP` · **Rama:** `develop` · **SHA base verificado:** `6c05ed05d3435c6c368070952733c9f8d8cbc694`.  
**Alcance exclusivo:** Resolución técnica del contrato abierto **AR-27** dentro de AV-02, preservando los nueve diseños ya aceptados de AV-02 (`AR-07`, `AR-14`, `AR-24`, `AR-25`, `AR-28`, `AR-31`, `AR-32`, `AR-40`, `AR-47`) y las decisiones `D14`, `D15`, `D18`, `D19`, `D20`.  
**Naturaleza:** Análisis documental y estático de código/fuentes oficiales sin implementación de código, modificación de dependencias, integración de `AS-04` ni ejecución de experimentos.

---

## 1. Resumen ejecutivo y distinción de garantías

Para cumplir simultáneamente con **D18** (preservar videos WebM auténticos, capturas PNG, evidencias por paso y reproducción en visor protegido) y con los requisitos de privacidad y seguridad (`REQ-SEG-002.3`, `POL-CAP-001`, `REQ-RUN-001.6`, `REQ-REP-001.1`), la arquitectura de captura debe separar estrictamente **dos clases de garantías no intercambiables**:

1. **Garantías de prevención (*pre-paint exclusion*):** impedir que credenciales o superficies sensibles lleguen a renderizarse en un contexto donde la captura esté activa. Solo se acreditan mediante **aislamiento físico de contexto (`AuthAcquisitionContext` sin grabación ni trazas)** para login/MFA/SSO o **admisión previa al render** en superficies cooperativas/controladas. Observar el DOM/URL después del render, aplicar máscaras tardías o borrar un segmento ya grabado **no constituye prevención**; es contención de daño.
2. **Garantías de custodia y contención (*confidentiality at rest & fail-closed suppression*):** proteger desde el primer byte escrito toda evidencia autorizada bajo `PRIVATE_AUTHORIZED` y todo temporal del navegador/códec mediante **almacenamiento cifrado verificable del SO + ACL estricta (`0700`/SID) + sellado inmediato en Streaming AEAD + exclusión de exportaciones por defecto + borrado lógico verificable (*crypto-shredding*)**, suprimiendo (`MANDATORY_SUPPRESSION`) cuando falte precondición técnica o autorización vigente.

Ni el cifrado posterior al cierre sin protección de temporales ni la desactivación permanente de toda captura satisfacen **D18**.

---

## 2. Contrato técnico propuesto para AR-27

El contrato definitivo de captura multimedia privada se rige por cinco invariantes normativos:

1. **Separación física de autenticación y ejecución (`AuthAcquisitionContext` vs. `ExecutionCaptureContext`):**
   - Toda adquisición de sesión (login, MFA, SSO, renovación por expiración) ocurre en un `BrowserContext` dedicado **sin `recordVideo`, sin `page.screencast`, sin `tracing` y sin `page.screenshot`**.
   - Solo tras verificar sesión válida (`AR-14`/`AR-47`) se transfiere el estado de sesión cifrado en memoria (`storageState`) al `ExecutionCaptureContext` autorizado.
2. **Máquina de estados de admisión previa por superficie (`VERIFIED_STRICT` / `PRIVATE_AUTHORIZED` / `MANDATORY_SUPPRESSION`):**
   - Ninguna captura inicia sin `CaptureLease` vigente vinculado a `ScopeIdentity` (`AR-04`), `policy_generation` (`AR-47`) y verificación previa de superficie.
   - Si una superficie no puede garantizar exclusión previa o falla la precondición de custodia, la transición es *fail-closed* hacia `MANDATORY_SUPPRESSION` (conservando veredicto funcional y metadatos saneados, sin WebM/PNG/snapshots DOM).
3. **Protección desde la primera escritura y cobertura total de temporales:**
   - Mientras el navegador o el códec escriban temporales sin cifrar a nivel de aplicación (perfil efímero, caché HTTP/GPU, descargas, staging de `trace.zip`, volcados), es **precondición obligatoria** verificar cifrado de volumen activo del SO (BitLocker `FullyEncrypted`, FileVault `On`, LUKS/`dm-crypt`/`fscrypt` o `tmpfs` con swap cifrado) + ACL exclusiva del principal (`0700`/SID) + exclusión de rutas sincronizadas en la nube (OneDrive/iCloud/Dropbox) + `acceptDownloads: false` / redirección confinada.
4. **Sellado Streaming AEAD y catálogo `COMMITTED`:**
   - Todo artefacto privado (`video/webm`, `image/png`) se sella en **Streaming AEAD** (esquema **STREAM** / NIST SP 800-38D sobre AES-256-GCM con bloques fijos de `64 KiB`, `DEK` única de 256 bits por artefacto envuelta por `KEK` de `AR-07`, y `header_sha256` + `artifact_id` + `chunk_index` + `is_final` en el AAD) antes de publicar su fila `COMMITTED` en SQLite.
   - El staging sin `COMMITTED` tras caída es purgado por `StagingReconciler` destruyendo su `DEK` (*crypto-shredding*) y ejecutando `unlink`.
5. **Reproducción autorizada por rangos y revocación en vuelo (`AR-24` / `AR-32`):**
   - El visor loopback (`127.0.0.1`) sirve `GET`/`HEAD` con `HTTP Range` (`206`/`416`) descifrando bajo demanda únicamente los bloques necesarios ($O(1)$ en RAM), validando `policy_generation` y permiso `access` antes de leer y antes de emitir cada bloque, con `Cache-Control: private, no-store`.

---

## 3. Comparativa técnica de alternativas (A, B y C)

### Alternativa A: Captura y cifrado en flujo (`onFrame` → pipe → muxer WebM → Streaming AEAD)

| Dimensión verificada | Evidencia y análisis técnico |
| --- | --- |
| **API real en Playwright** | `page.screencast.start({ onFrame })` documentada desde **Playwright 1.59** (`packages/playwright-runner/package.json` declara `^1.62.1`). Entrega `{ data: Buffer, timestamp, viewportWidth, viewportHeight }` con cuadros codificados en **JPEG** (no cuadros crudos RGBA ni WebM directo). Las capturas **PNG** siguen requiriendo `page.screenshot()`. |
| **Compatibilidad por motor/versión** | Soportada en Chromium, Chrome, Edge, Chromium Headless Shell, Firefox y WebKit en Playwright ≥ 1.59. En **Firefox y WebKit tiene techo duro de 25 fps**; en Chromium puede escalar por encima de 25 fps vía CDP `Page.startScreencast`. |
| **Headed vs. Headless y Headless Shell** | Funciona en `headed`, `headless` y `chromium-headless-shell` (`--only-shell`). En Firefox headless sobre Linux minimalista puede requerir `xvfb-run` si falla la inicialización gráfica. |
| **Codificación y muxing WebM** | **Limitación estructural crítica:** si se canalizan cuadros JPEG a `ffmpeg -f image2pipe -c:v mjpeg -i pipe:0 -c:v libvpx -f webm pipe:1` sobre un pipe no buscable (`pipe:1`), FFmpeg **no puede retroceder** para escribir `Duration` en `Segment.Info` ni `SeekHead` apuntando a `Cues` (`-cues_to_front 1` falla en pipes). El WebM resultante reporta `duration: Infinity` y rompe el *seek* por `HTTP Range` en HTML5 `<video>`, salvo que se re-muxe en disco/RAM antes de sellar. |
| **Backpressure y buffers** | Hay al menos 5 colas en cadena: compositor del navegador → CDP/IPC (`Page.screencastFrameAck`) → callback `onFrame` en Node.js → buffer `stdin` del proceso encoder → buffer `stdout` de FFmpeg → buffer AEAD. Si `onFrame` no descarta o regula cuadros cuando FFmpeg se atrasa, la memoria crece sin cota. **No es $O(1)$ sin política explícita de descarte/regulación.** |
| **Dependencias nativas y licencias** | Requiere binario `ffmpeg` (o binding `libvpx`) externo a Node.js. FFmpeg por defecto es **LGPL v2.1+**, compatible con `libvpx` (**BSD-3-Clause + concesión de patentes WebM**), pero un build compilado con `--enable-gpl` (o `libx264`) convierte el binario en **GPL v2+**. Exige auditoría de build, fuentes correspondientes y avisos bajo **AV-07**. |
| **Distribución multiplataforma** | Obliga a empaquetar o gestionar binarios nativos de `ffmpeg`/`libvpx` firmados para Windows, macOS (arm64/x64) y Linux, multiplicando el tamaño del paquete y la matriz de soporte. |
| **Reproducción `HTTP Range`** | **Degradada si el WebM proviene directo de `pipe:1`** (sin `Cues`/`Duration`). Para recuperar *seek* real requiere un paso de re-mux sobre archivo temporal cifrado o en RAM (lo que invalida la ventaja de "cero staging"). |
| **Recuperación ante interrupciones** | Si el runner muere por `SIGKILL`, `stdin` se cierra, FFmpeg termina y el archivo AEAD parcial carece de bloque `is_final = 1` y de fila `COMMITTED`, siendo purgado por `StagingReconciler`. |

### Alternativa B: Grabación nativa protegida (WebM nativo en almacenamiento cifrado verificable + sellado posterior)

| Dimensión verificada | Evidencia y análisis técnico |
| --- | --- |
| **Protección desde la primera escritura** | El WebM se escribe en disco dentro de `createPrivateCaptureStaging`, cuya precondición es **volumen cifrado verificado del SO** + ACL `0700`/SID + sin symlinks/junctions en ancestros. Protege datos en reposo desde el primer byte escrito frente a robo físico o acceso tras cierre de sesión, **no** frente a procesos vivos del mismo UID. |
| **Temporales del navegador y códec** | Playwright (`page.screencast.start({ path })` / `recordVideo`) codifica VP8/WebM nativamente dentro del proceso del navegador sin FFmpeg externo. Todos los temporales del navegador (`userDataDir`, `--disk-cache-dir`, `--media-cache-dir`, caché GPU, descargas, `trace.zip`) deben redirigirse explícitamente al directorio confinado sobre el volumen cifrado o deshabilitarse (`--disk-cache-size=0`, `acceptDownloads: false`). |
| **Swap y volcados** | En Windows (BitLocker) y macOS (FileVault + swap cifrado por defecto en APFS) el swap queda cubierto por el cifrado de volumen; en Linux LUKS debe verificarse que `swap` también resida en volumen cifrado (`dm-crypt`) o `zram` sin volcado plano. Deben deshabilitarse crash dumps no confinados (`--disable-breakpad` / `CRASHDUMP` fuera de staging). |
| **Aislamiento frente al HOST** | Bajo el mismo usuario del SO, el almacenamiento cifrado del SO **no aísla** procesos activos del mismo UID. El aislamiento fuerte frente a shell arbitrario del HOST requiere cuenta de servicio dedicada o ejecución aislada (`AR-28`). |
| **Reconciliación tras caídas** | Un WebM abierto en staging sin fila `COMMITTED` tras `SIGKILL` permanece en disco cifrado del SO hasta que `StagingReconciler` ejecuta `unlink` en el siguiente arranque. **Brecha frente a Streaming AEAD:** mientras dura la grabación y hasta el sellado final, el archivo en staging es WebM en claro dentro del volumen cifrado (protegido por FDE + ACL, no por `DEK` por artefacto). |
| **Protección y eliminación de claves** | Si se sella al finalizar con AES-256-GCM en bloque único (como hacía `AS-04` `private-media.ts`), obliga a cargar todo el video en RAM al sellar y al reproducir (`O(N)` RAM). |
| **Reproducción autorizada** | **Excelente fidelidad:** Playwright/Chromium genera WebM con estructura válida y buscable (`Duration`/`Cues` presentes tras cerrar el contexto), permitiendo `HTTP Range` (`206`/`416`) nativo. |
| **Coste operativo y de recursos** | **Muy inferior a A:** evita decodificar JPEG y re-codificar VP8/VP9 en un subproceso FFmpeg separado; menor CPU y menor presión de memoria durante pruebas concurrentes (`AR-29` / `D16`). |

### Alternativa C (Propuesta preferida): Híbrida — Grabación nativa confinada sobre FDE verificada + Sellado inmediato en Streaming AEAD (STREAM)

La **Alternativa C** combina las fortalezas de **B** (WebM nativo buscable con `Cues`/`Duration`, sin dependencia obligatoria de FFmpeg en runtime ni sobrecarga de doble codificación) y las garantías criptográficas de **A** (Streaming AEAD con `DEK` por artefacto y lectura `HTTP Range` en $O(1)$ de RAM, reemplazando el cifrado monolítico de `AS-04`):

1. **Captura nativa confinada:** Usar `page.screencast.start({ path })` (Playwright ≥ 1.59) apuntando exclusivamente a un directorio verificado sobre almacenamiento cifrado del SO (`FDE` verificada + ACL `0700`/SID + perfil/caché/descargas confinados o deshabilitados).
2. **Sellado en Streaming AEAD al cierre del segmento:** Ingerir el WebM buscable en flujo de bloques de `64 KiB` hacia **Streaming AEAD** (`DEK` efímera por artefacto envuelta con `KEK` de `AR-07`), registrar `header_sha256`, `total_chunks` y `plaintext_size` en SQLite (`COMMITTED`), y ejecutar `unlink` inmediato del temporal en staging.
3. **Respaldo de alta contención (`onFrame` → pipe → remux cifrado):** Reservado únicamente si `EXP-06a` demostrara que algún motor/plataforma no puede confinar sus temporales o si se habilitara un flujo donde no exista FDE y el contenedor se re-muxe antes de publicar. En ausencia de FDE verificada para los temporales inevitables del navegador, el contrato permanece *fail-closed* en `MANDATORY_SUPPRESSION`.

---

## 4. Resolución de la frontera preventiva

### 4.1 Análisis explícito por superficie

| Superficie | Aplicación cooperativa (contrato explícito de pre-render) | Aplicación empresarial arbitraria (sin contrato de cooperación) | Mecanismo QAP requerido |
| --- | --- | --- | --- |
| **Login** | Contexto separado verificable antes de navegar. | Contexto separado verificable antes de navegar. | **`AuthAcquisitionContext` sin grabación ni trazas** (`VERIFIED_STRICT` / `PRIVATE_AUTHORIZED` aún inactivos). |
| **MFA** | Si ocurre en flujo de login o ruta/origen dedicado, separado en `AuthAcquisitionContext`. Si ocurre *in-app* con señal previa acreditada, pausa de captura antes del montaje. | Si ocurre dentro del mismo documento SPA sin red ni señal previa (`AS-04`), **imposible garantizar prevención universal *pre-paint*** tras iniciar captura. | En login: `AuthAcquisitionContext`. En transiciones *in-app* no acreditadas: **`MANDATORY_SUPPRESSION`** del módulo/caso o transición bajo `PRIVATE_AUTHORIZED` con riesgo residual declarado (`DE-02`). |
| **SSO (IdP externo / OAuth / SAML)** | Redirección a origen IdP conocido interceptable por `Fetch`/navegación antes de pintar. | Redirección a origen IdP conocido interceptable salto a salto; popup de IdP bloqueable antes de crear página. | **`AuthAcquisitionContext`**; en ejecución funcional, bloqueo de navegación a IdP no admitido o transición *fail-closed* a `MANDATORY_SUPPRESSION` antes de seguir la redirección. |
| **Expiración de sesión** | Respuesta `401`/redirección HTTP interceptada antes de navegar al login. | Redirección HTTP `302` interceptable por red; **modal de re-login inyectado en el mismo DOM por JS sin navegación** no es prevenible *pre-paint* sin cooperación. | En `401`/redirección de red: aborto inmediato de captura (`AR-47`) antes de pintar login. En modal *in-app* inesperado: detección posterior + descarte + `BLOCKED_AUTH` + `MANDATORY_SUPPRESSION` (contención, no prevención). |
| **Transiciones SPA sin tráfico de red** | Posible prevención solo si el AUT expone contrato previo al cambio de vista (`beforeRouteChange` / permiso explícito antes de montar). | **Límite técnico duro demostrado por `AS-04`:** `history.pushState` / cambio de estado React/Angular/Vue sin HTTP no pasa por `Fetch`/red. | **No declarar prevención universal.** Admitir `VERIFIED_STRICT` únicamente en superficies cooperativas/sintéticas acreditadas; en SPAs arbitrarias con vistas sensibles mezcladas, exigir `PRIVATE_AUTHORIZED` o `MANDATORY_SUPPRESSION`. |
| **Shadow DOM** | Mismo documento y origen; si el módulo completo está admitido, no altera frontera. | Los observadores estándar de DOM no penetran *closed Shadow DOM* de forma fiable tras render; no sirve para prevención. | No depender de observadores DOM para prevención; la admisión es por superficie/contexto completo antes de renderizar. |
| **Iframes y OOPIFs** | Iframes del mismo origen bajo política del módulo. | **Límite técnico duro:** los OOPIFs corren en procesos de renderizado separados; `page.route` / `Fetch` sin `Target.setAutoAttach({ flatten: true })` ni hooks por target no interceptan subdocumentos a tiempo en todos los motores, y Firefox/WebKit carecen de CDP. | Bloquear o suprimir (`MANDATORY_SUPPRESSION`) toda página con OOPIFs de orígenes no admitidos o embebidos sensibles (pasarelas, IdP, visores externos) antes de cargar el frame padre o abortar al detectar frame no admitido. |
| **Popups** | Bloqueados o excluidos de captura por contexto dedicado (`unified-capture-controller.ts` exige `pages.length === 1`). | `context.on('page')` llega tras crearse la ventana; el primer cuadro del opener o popup podría quedar en compositor si se grabara el contexto completo. | Bloquear `window.open` / `acceptDownloads: false` o cerrar popups no admitidos antes de enfocar; nunca grabar el `AuthAcquisitionContext` ni popups de terceros. |
| **Superficies de terceros** | Excluidas por `allowed_origins` salto a salto (`AR-31`). | Píxeles, widgets o embeds de terceros no autorizados. | Bloqueo *pre-request* por `allowed_origins` (`route.abort`) + `MANDATORY_SUPPRESSION` si el flujo requiere un tercero sensible no admitido. |
| **Datos privados de negocio autorizados** | Capturados únicamente bajo `PRIVATE_AUTHORIZED` con grant `capture` vigente (`≤30 días`). | Capturados únicamente bajo `PRIVATE_AUTHORIZED` con grant `capture` vigente (`≤30 días`), sin eximir la exclusión de credenciales/MFA/SSO. | Permitido WebM/PNG cifrado en Streaming AEAD + FDE verificada + exclusión de exportaciones por defecto (`AR-32`). |
| **Información sensible inesperada** | Detección posterior dispara descarte y transición a `MANDATORY_SUPPRESSION`. | Imposible prevenir *pre-paint* si el AUT inyecta inesperadamente un secreto en un campo de negocio ordinario. | **Contención declarada:** aborto, descarte de staging, `MANDATORY_SUPPRESSION` del segmento y alerta de brecha; nunca acreditada como prevención previa. |

### 4.2 Condiciones exactas de los modos de captura (D18)

- **`VERIFIED_STRICT`:** Solo aplicable cuando se acredita **exclusión preventiva real** antes del primer cuadro: (1) `AuthAcquisitionContext` físicamente separado; (2) entorno sintético o superficie cooperativa con contrato previo al render verificado, o ausencia acreditada de transiciones sensibles *same-document*, OOPIFs sensibles y popups; (3) `serviceWorkers: 'block'` y control de orígenes salto a salto activos; (4) `staging` confinado con ACL `0700`/SID. Permite evidencia estándar exportable bajo política del proyecto.
- **`PRIVATE_AUTHORIZED`:** Aplicable a módulos de negocio empresarial autorizados cuando: (1) existe grant `capture` vigente (`≤30 días`, `POL-CAP-001`) y ratificación **`DE-02`**; (2) login/MFA/SSO permanecen estrictamente fuera en `AuthAcquisitionContext` y las superficies sensibles prohibidas conocidas quedan excluidas; (3) se verifica almacenamiento cifrado del SO (`FDE`) + ACL `0700`/SID + exclusión de cloud-sync; (4) toda salida WebM/PNG se sella en **Streaming AEAD** y se excluye de exportaciones ordinarias.
- **`MANDATORY_SUPPRESSION`:** Modo *fail-closed* obligatorio cuando: (1) falta grant `capture` vigente o fue revocado; (2) falta ratificación `DE-02`; (3) falla la verificación de `FDE` o ACL de staging/temporales; (4) la superficie contiene login/MFA/SSO/OOPIF sensible/terceros no aislables; (5) el motor/modo no soporta los controles requeridos (p. ej. vista sensible en Firefox/WebKit sin garantía de frontera); o (6) salta una detección posterior de secreto en `VERIFIED_STRICT`. Omite WebM, PNG y snapshots DOM de `trace.zip`, preservando veredicto funcional y metadatos saneados.

### 4.3 Límite técnico universal y alternativa compatible con D18

**Límite exacto identificado:** En aplicaciones web arbitrarias (no cooperativas), ningún navegador ni API de Playwright puede garantizar universalmente exclusión *pre-paint* frente a una transición *same-document* SPA hacia contenido sensible sin tráfico de red (`AS-04`), ni frente a secretos inesperados inyectados por el propio AUT en una vista de negocio autorizada.

**Alternativa compatible con D18 (sin reducir el requisito):** Combinar:
1. Aislamiento estricto de `AuthAcquisitionContext` (0 % captura en login/MFA/SSO).
2. `PRIVATE_AUTHORIZED` con custodia criptográfica desde el primer byte (`FDE` verificada + Streaming AEAD + `0700`/SID) para los flujos de negocio autorizados, asumiendo y declarando honestamente el riesgo residual bajo `DE-02`.
3. `MANDATORY_SUPPRESSION` localizada por caso/superficie cuando se detecte o prevea una superficie prohibida no aislable, evitando apagar globalmente la captura empresarial.

---

## 5. Matriz obligatoria de cobertura (SO × Motor × Modalidad)

> **Nota normativa:** Ninguna combinación se declara con paridad verificada sin evidencia experimental en el repositorio. El estado actual distingue estrictamente **Soporte documentado** (en Playwright ≥ 1.59 / documentación oficial del motor), **Soporte experimental** (acreditado parcialmente en `AS-04` sobre un fixture) y **Todavía no acreditado** (requiere `EXP-06a`/`EXP-06c`).

| SO | Motor | Modalidad | Capacidad funcional | WebM / PNG | Fidelidad visual | Método candidato | Prevención alcanzable | Protección de temporales | Limitaciones conocidas | Estado de evidencia | Experimento requerido | Alternativa viable |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Windows** | **Chromium Headless Shell** | Segundo plano | Alta (motor ligero) | WebM + PNG | Alta (verificar WebGL/fuentes) | `screencast.start({ path })` → Streaming AEAD (Alt. C) | `AuthContext` + CDP `Fetch`/Target | BitLocker + SID ACL + flags caché/perfil | Sin ventana visible; diferencias puntuales de GPU/fuentes vs. Chromium completo | Documentado (Playwright ≥ 1.59); **no acreditado** en QAP | `EXP-06a` / `EXP-06c` + `AR-16` | Chromium completo headless o Alt. A si falla path |
| **Windows** | **Chromium completo** | Visible y Segundo plano | Completa | WebM + PNG | Referencia | `screencast.start({ path })` → Streaming AEAD (Alt. C) | `AuthContext` + CDP `Fetch`/Target | BitLocker + SID ACL + flags caché/perfil | SPA→MFA sin red no prevenible sin cooperación (`AS-04`); mayor RAM en visible | **Experimental parcial** (`AS-04` Chromium 153) | `EXP-06a` / `EXP-06c` | `MANDATORY_SUPPRESSION` en vistas sensibles no aislables |
| **Windows** | **Google Chrome / Edge** | Visible y Segundo plano | Completa (canales `chrome`/`msedge`) | WebM + PNG | Alta (equivalente a Chromium) | `screencast.start({ path })` → Streaming AEAD (Alt. C) | `AuthContext` + CDP `Fetch`/Target | BitLocker + SID ACL + perfil aislado | Políticas corporativas de grupo (GPO) pueden forzar caché/extensiones/telemetría | Documentado; **todavía no acreditado** | `EXP-06a` (canal `msedge`/`chrome`) | Chromium completo administrado por QAP |
| **Windows** | **Firefox** | Visible y Segundo plano | Completa (sin CDP) | WebM (≤25 fps) + PNG | Alta (motor Gecko) | `screencast.start({ path })` → Streaming AEAD | Solo `AuthContext` y `context.route` | BitLocker + SID ACL + perfil aislado | **Techo 25 fps**; sin CDP (`Fetch` salto a salto ni `Target.setAutoAttach` OOPIF) | Documentado (Playwright); **todavía no acreditado** | `EXP-06a` (techo fps y `route`) | `MANDATORY_SUPPRESSION` en rutas con OOPIF/sensibles; uso de Chromium para captura privada |
| **Windows** | **WebKit** | Visible y Segundo plano | Parcial (WebKit Windows) | WebM (≤25 fps) + PNG | Media/Alta | `screencast.start({ path })` → Streaming AEAD | Solo `AuthContext` y `context.route` | BitLocker + SID ACL + perfil aislado | **Techo 25 fps**; sin CDP; WebKit en Windows es build de Playwright, no Safari real | Documentado (Playwright); **todavía no acreditado** | `EXP-06a` | `MANDATORY_SUPPRESSION` en rutas sensibles; escalar cobertura WebKit Windows al Orquestador |
| **macOS** | **Chromium Headless Shell** | Segundo plano | Alta | WebM + PNG | Alta | `screencast.start({ path })` → Streaming AEAD (Alt. C) | `AuthContext` + CDP `Fetch`/Target | FileVault `On` + `0700` + sin iCloud Drive | Diferencias de renderizado de fuentes/Metal vs. headed | Documentado; **todavía no acreditado** | `EXP-06a` / `EXP-06c` | Chromium completo headless |
| **macOS** | **Chromium / Chrome / Edge** | Visible y Segundo plano | Completa | WebM + PNG | Alta | `screencast.start({ path })` → Streaming AEAD (Alt. C) | `AuthContext` + CDP `Fetch`/Target | FileVault `On` + `0700` + sin iCloud Drive | Permisos TCC de macOS en visible; mismas limitaciones SPA/OOPIF | Documentado; **todavía no acreditado** | `EXP-06a` / `EXP-06c` | `MANDATORY_SUPPRESSION` si FileVault está `Off` |
| **macOS** | **Firefox** | Visible y Segundo plano | Completa (sin CDP) | WebM (≤25 fps) + PNG | Alta | `screencast.start({ path })` → Streaming AEAD | Solo `AuthContext` y `context.route` | FileVault `On` + `0700` | Techo 25 fps; sin CDP | Documentado; **todavía no acreditado** | `EXP-06a` | `MANDATORY_SUPPRESSION` en vistas sensibles no aislables |
| **macOS** | **WebKit** | Visible y Segundo plano | Alta (motor nativo Safari/WebKit) | WebM (≤25 fps) + PNG | Alta (WebKit) | `screencast.start({ path })` → Streaming AEAD | Solo `AuthContext` y `context.route` | FileVault `On` + `0700` | Techo 25 fps; sin CDP | Documentado; **todavía no acreditado** | `EXP-06a` | `MANDATORY_SUPPRESSION` en vistas sensibles no aislables |
| **Linux** | **Chromium Headless Shell** | Segundo plano | Alta (ideal CI) | WebM + PNG | Alta | `screencast.start({ path })` → Streaming AEAD (Alt. C) | `AuthContext` + CDP `Fetch`/Target | LUKS/`dm-crypt`/`fscrypt` o `tmpfs` con swap cifrado + `0700` | Sin LUKS/swap cifrado, `PRIVATE_AUTHORIZED` debe bloquearse (*fail-closed*) | Documentado; **todavía no acreditado** | `EXP-06a` / `EXP-06c` | `MANDATORY_SUPPRESSION` si falta cifrado verificable de almacenamiento/swap |
| **Linux** | **Chromium / Chrome / Edge** | Visible (X11/Wayland/Xvfb) y Segundo plano | Completa | WebM + PNG | Alta | `screencast.start({ path })` → Streaming AEAD (Alt. C) | `AuthContext` + CDP `Fetch`/Target | LUKS/`dm-crypt`/`fscrypt` + `0700` | Modo visible en servidores sin display requiere Xvfb/Wayland; `/dev/shm` limitado en contenedores | Documentado; **todavía no acreditado** | `EXP-06a` / `EXP-06c` | Headless Shell en CI; `MANDATORY_SUPPRESSION` sin FDE |
| **Linux** | **Firefox** | Visible y Segundo plano | Completa (sin CDP) | WebM (≤25 fps) + PNG | Alta | `screencast.start({ path })` → Streaming AEAD | Solo `AuthContext` y `context.route` | LUKS/`dm-crypt`/`fscrypt` + `0700` | Techo 25 fps; sin CDP; en contenedores mínimos puede requerir `xvfb-run` | Documentado; **todavía no acreditado** | `EXP-06a` | Chromium para captura privada; `MANDATORY_SUPPRESSION` en sensibles |
| **Linux** | **WebKit** | Visible y Segundo plano | Completa (sin CDP) | WebM (≤25 fps) + PNG | Alta | `screencast.start({ path })` → Streaming AEAD | Solo `AuthContext` y `context.route` | LUKS/`dm-crypt`/`fscrypt` + `0700` | Techo 25 fps; sin CDP; requiere dependencias GStreamer/sistema | Documentado; **todavía no acreditado** | `EXP-06a` | Chromium para captura privada; `MANDATORY_SUPPRESSION` en sensibles |

**Escalamiento al Orquestador sobre alcance obligatorio (`D14`):**  
- **Firefox y WebKit** presentan techo documentado de **25 fps** y carecen de **CDP** (`Page.startScreencast`, `Fetch`, `Target.setAutoAttach`), por lo que **no existe paridad de captura ni de ganchos preventivos de subdocumento** frente a Chromium. Se recomienda acotar la certificación inicial de `PRIVATE_AUTHORIZED` a la familia Chromium (Chromium completo, Chromium Headless Shell, Chrome, Edge) y aplicar `MANDATORY_SUPPRESSION` para vistas sensibles en Firefox/WebKit mientras no se acredite equivalencia en `EXP-06a`.

---

## 6. Custodia criptográfica (Streaming AEAD y almacenamiento)

### 6.1 Contraste con implementaciones revisadas y documentadas

| Aspecto | Google Tink Streaming AEAD (`AES256_GCM_HKDF_4KB` / `1MB`) | Libsodium `crypto_secretstream_xchacha20poly1305` | Construcción STREAM (Rogaway OAE2 / NIST SP 800-38D) sobre `node:crypto` AES-256-GCM |
| --- | --- | --- | --- |
| **Licencia y dependencias** | Apache-2.0. Implementaciones maduras en Java, C++, Go, Python; **sin soporte maduro oficial de Streaming AEAD en Node.js/JS** (requeriría puente nativo/FFI). | ISC (`libsodium`). Bindings Node.js (`sodium-native`, `libsodium-wrappers`). | Cero dependencias externas (`node:crypto` / OpenSSL integrado en Node.js, licencia MIT/OpenSSL). |
| **Acceso aleatorio (`HTTP Range`)** | **Sí**, nativo por derivación de clave/nonce por índice de segmento. | **Secuencial por diseño** (encadena estado/rekeying por mensaje); *seek* arbitrario requiere reiniciar estado o dividir en segmentos independientes. | **Sí**, mapeo $O(1)$ de `Range: bytes=start-end` a `chunks[floor(start/65536) .. floor(end/65536)]`. |
| **Recomendación para QAP** | Referencia conceptual de diseño (`segment_index`, `last_segment_flag`, `header` autenticado). | Excelente si se descarta acceso aleatorio, pero penaliza *seek* en `<video>` HTTP Range. | **Candidato principal recomendado** para Node.js: sigue exactamente el esquema **STREAM (OAE2)** con primitivas estándar FIPS/NIST (`AES-256-GCM` + `SHA-256`) y `node:crypto` sin dependencias GPL ni FFI extra. |

### 6.2 Especificación de invariantes criptográficos

1. **Identidad, cabecera canónica y autenticación del artefacto:**
   - Cabecera canónica JCS/binaria fija: `{ magic: "QAPSAEAD", version: 1, cipher: "aes-256-gcm", chunk_size: 65536, artifact_id, project_id, attempt_id, mime_type, created_at }`.
   - Se calcula `header_sha256 = SHA-256(canonical_header)` y se almacena junto con el archivo cifrado.
2. **Límites criptográficos por clave y rotación:**
   - Cada artefacto genera una **`DEK` aleatoria de 256 bits** (`randomBytes(32)`) envuelta por la `KEK` del vault (`AR-07`), nunca compartida entre artefactos.
   - Límite máximo por `DEK`: $2^{32} - 1$ bloques (~256 TiB a 64 KiB/bloque), muy por debajo del límite de seguridad de AES-GCM con nonces únicos.
3. **Nonces deterministas sin colisión:**
   - Nonce de 96 bits: `nonce_prefix_4B (aleatorio por artefacto) || uint64_be(chunk_index)`. Garantiza 0 colisiones dentro de la `DEK` sin ejecutar HKDF por bloque.
4. **AAD completo (corrección obligatoria sobre `auditoria-antigravity.md`):**
   - `AAD = header_sha256 (32 B) || artifact_id || uint64_be(chunk_index) || is_final_flag (1 B) || uint32_be(plain_chunk_len)`.
   - Incluye explícitamente `header_sha256`, impidiendo manipulación silenciosa de `chunk_size`, `mime_type` o `version`.
5. **Integridad de segmentos, truncamiento y reordenamiento:**
   - `chunk_index` en AAD impide reordenamiento, duplicación o eliminación de bloques intermedios.
   - `is_final_flag = 1` en AAD + comparación contra `total_chunks` y `plaintext_size` registrados en la fila `COMMITTED` de SQLite detectan cualquier truncamiento al inicio o al final.
6. **Recuperación ante interrupciones:**
   - Si el proceso muere antes de escribir el bloque `is_final_flag = 1` y hacer commit en SQLite, el artefacto queda sin fila `COMMITTED`. Al reiniciar, `StagingReconciler` destruye la `DEK` en memoria/pendiente y ejecuta `unlink` sobre el `.webm.enc` y temporales de staging.
7. **Lectura autenticada por rangos (`HTTP Range 206/416`) y revocación:**
   - El visor (`AR-24`) calcula el rango de bloques $[c_{start}, c_{end}]$ en $O(1)$.
   - **Antes de leer** y **antes de emitir** cada bloque descifrado, consulta `policy_generation` y permiso `access` (`AR-32`). Si se revoca durante el stream, cierra inmediatamente la conexión TCP/HTTP sin emitir el siguiente bloque (sin prometer cambiar códigos HTTP ya enviados en cabeceras) y limpia buffers en memoria (`.fill(0)`).
8. **Almacenamiento cifrado obligatorio y frontera de procesos:**
   - Mientras el navegador/códec genere temporales no cifrados a nivel de aplicación, **el cifrado de volumen verificable del SO es obligatorio**.
   - **Advertencia explícita:** el cifrado de volumen protege datos en reposo, **no aísla procesos vivos del mismo usuario del SO** (`AR-28`).

---

## 7. Protocolos experimentales reproducibles (`EXP-06a` y `EXP-06c`)

> No se inventan cifras ni resultados experimentales; las métricas abajo descritas son **criterios prospectivos de aceptación/rechazo** sobre fixtures sintéticos con canarios visuales y secretos sintéticos.

### 7.1 `EXP-06a` · Viabilidad de captura confinada, frontera preventiva y custodia temprana (Compuerta: cierre G0 / apertura G1)

**Fixtures sintéticos requeridos:**
- `F-SPA-MFA`: SPA con transición *same-document* (sin tráfico HTTP) hacia vista con canario visual `CANARY_MFA_TOKEN`.
- `F-OOPIF-POPUP`: página con `<iframe>` *cross-origin* (OOPIF) y `window.open()` con canario `CANARY_EXTERNAL`.
- `F-BIZ-AUTH`: flujo login → MFA (en `AuthAcquisitionContext`) → módulo de negocio autorizado con datos privados sintéticos (`PRIVATE_AUTHORIZED`).
- `F-TEMP-AUDIT`: monitor de escrituras en disco (Process Monitor / `fs_usage` / `inotify`/`fanotify` según SO) cubriendo perfil, caché, GPU, descargas, `trace.zip` y staging.

**Casos de prueba y mediciones obligatorias:**
1. **Evidencia desde primer cuadro y transición SPA→MFA (`F-SPA-MFA`, `F-BIZ-AUTH`):** verificar que en `AuthAcquisitionContext` se escriben 0 bytes de WebM/PNG/trace; en `VERIFIED_STRICT` sobre `F-SPA-MFA`, comprobar si la transición *same-document* filtra el canario (debe disparar transición a `MANDATORY_SUPPRESSION` o rechazo previo en ausencia de cooperación).
2. **OOPIF y Popups (`F-OOPIF-POPUP`):** verificar bloqueo o supresión *fail-closed* antes de incluir frames del subdocumento/popup no admitido.
3. **Inventario de escrituras y temporales (`F-TEMP-AUDIT`):** inventariar 100 % de archivos creados por Playwright, navegador y encoder; validar verificación automática de BitLocker/FileVault/LUKS y fallo cerrado (`MANDATORY_SUPPRESSION`) cuando se simule volumen no cifrado o carpeta cloud-sync.
4. **Interrupciones abruptas (`SIGKILL` / `TerminateProcess`):** matar runner y navegador en mitad de grabación; verificar que `StagingReconciler` purga staging no confirmado sin dejar filas `COMMITTED` huérfanas.
5. **Corrupción y truncamiento en Streaming AEAD:** alterar 1 byte de cabecera, 1 byte de payload, intercambiar 2 bloques y truncar último bloque; verificar rechazo criptográfico del 100 % de los casos.
6. **Fidelidad visual y pérdida de cuadros:** comparar PNG/WebM contra viewport esperado (CSS/JS/imágenes/fuentes intactos, `D15`); medir *frame drop rate* en `page.screencast.start({ path })` vs. `onFrame` + FFmpeg.
7. **Recursos y concurrencia:** medir RAM pico del árbol de procesos (Node + navegador + subprocesos GPU/renderer + encoder si aplica), CPU %, almacenamiento temporal pico y estabilidad con $W = 1, 2, 4$ trabajadores concurrentes en Windows, macOS y Linux.

| Criterio | Resultado |
| --- | --- |
| **Éxito** | 0 bytes multimedia en `AuthAcquisitionContext`; 100 % fallo cerrado ante volumen sin cifrar o OOPIF no admitido; 100 % purga tras `SIGKILL`; 100 % detección de alteración/truncamiento AEAD; WebM buscable (`Duration`/`Cues` válidos) y PNG fieles al viewport; sin fuga de memoria ni colapso bajo $W=2/4$. |
| **Fracaso** | Escritura de temporales privados fuera del directorio confinado/cifrado; fuga de memoria sin cota en buffers; WebM corrupto o no buscable; fallo de `StagingReconciler`. |
| **Alternativa si fracasa** | Si la ruta nativa (`path`) presenta temporales incontrolables fuera de staging en algún motor/SO, evaluar `onFrame` → pipe → remux cifrado (Alt. A con re-mux) o restringir `PRIVATE_AUTHORIZED` únicamente a las combinaciones de matriz acreditadas manteniendo `MANDATORY_SUPPRESSION` en el resto. |

### 7.2 `EXP-06c` · Reproducción autorizada, HTTP Range, revocación y paquete portable (Compuerta: G3 / G5)

**Casos de prueba y mediciones obligatorias:**
1. **Reproducción y búsqueda (`HTTP Range 206/416`):** reproducir WebM cifrado en visor autenticado (`AR-24`) realizando *seeks* al 10 %, 50 % y 90 % de duración; validar `Content-Range`, `206 Partial Content`, `416 Range Not Satisfiable` y uso de RAM $O(1)$ por flujo.
2. **Revocación durante reproducción (`AR-32`):** revocar permiso `access` mientras un stream `Range` está activo; medir latencia hasta cierre de stream y verificar `403`/`404` en peticiones subsecuentes y `Cache-Control: private, no-store`.
3. **Independencia de permisos (`POL-CAP-001`):** probar expiración/revocación independiente de `capture`, `access`, `retain` y `export` (confirmando *crypto-shredding* al revocar `retain`, incluso con defecto abierto, y exclusión de media privada en export estándar).
4. **Concurrencia de visor + runner:** ejecutar 2 streams simultáneos en visor mientras corren pruebas en paralelo, midiendo CPU, RAM y latencia de respuesta.

| Criterio | Resultado |
| --- | --- |
| **Éxito** | 100 % *seek* funcional en WebM cifrado con RAM acotada; 100 % corte de stream tras revocación de `access`; 0 media privada en exportaciones ordinarias; 100 % cumplimiento de la matriz de 4 permisos. |
| **Fracaso** | Carga del video completo en RAM para `Range`; continuación de entrega de bytes tras revocación detectada; inclusión accidental de media privada en export estándar. |
| **Alternativa si fracasa** | Mantener deshabilitado el streaming privado en visor y/o `PRIVATE_AUTHORIZED` hasta corregir lectura por bloques y verificación por chunk. |

### 7.3 Evaluación sobre prueba de viabilidad previa al WBS

**¿Es indispensable ejecutar una prueba antes del WBS?** **No.** El contrato técnico, la frontera preventiva realista y las alternativas viables (Alternativa C primaria + respaldo en Alternativa A/supresión localizada) quedan suficientemente definidos para planificar el WBS. **`EXP-06a` se fija como compuerta obligatoria de cierre de G0 / apertura de G1** antes de codificar o habilitar `PRIVATE_AUTHORIZED`, evitando bloquear la planificación general sin omitir la verificación experimental exigida.

---

## 8. Dependencias con AV-06 y AV-07

- **AV-06 (`AR-16`, `AR-29`, `AR-37`, `AR-39`):**
  - `AR-16`: validación de fidelidad visual (CSS/JS/fuentes/hidratación) por SO, motor y modalidad (`chromium-headless-shell` vs. Chromium completo).
  - `AR-29`: perfilado real de RAM/CPU del árbol de procesos durante captura WebM + cifrado bajo concurrencia ($W=1/2/4$).
  - `AR-37` / `AR-39`: instalación de navegadores bajo demanda, empaquetado de visor offline portable y accesibilidad/ausencia de CDN.
- **AV-07 (`AR-19`, `AR-21`, `AR-33`, `AR-51`):**
  - `AR-19` / `AR-21`: fijar versión exacta de `playwright-core` (≥ 1.59, alineado con `^1.62.1`) y unificar `@qap/shared` / `@qap/playwright-runner`.
  - `AR-51`: inventario SBOM y auditoría de licencias en caso de requerir `ffmpeg`/`libvpx` (LGPL v2.1+ vs. GPL) como respaldo de Alternativa A; **Alternativa C primaria sobre `node:crypto` elimina la necesidad de FFmpeg en la ruta principal**, reduciendo riesgo legal y de empaquetado multiplataforma.

---

## 9. Dictamen obligatorio de AR-27

**DICTAMEN AR-27: `VALIDACIÓN EXPERIMENTAL PENDIENTE, SIN BLOQUEAR PLANIFICACIÓN`**

1. **Arquitectura recomendada:** **Alternativa C (Híbrida)** — separación física `AuthAcquisitionContext` (0 % captura) + grabación nativa `page.screencast.start({ path })` confinada sobre almacenamiento cifrado verificable del SO (`FDE` + ACL `0700`/SID + temporales del navegador confinados) + sellado inmediato en **Streaming AEAD (STREAM / AES-256-GCM en bloques de 64 KiB con `header_sha256` en AAD)** + lectura `HTTP Range` autenticada en $O(1)$ de RAM + `MANDATORY_SUPPRESSION` *fail-closed* ante falta de `FDE` o superficies sensibles no aislables.
2. **Alternativa de respaldo viable:** **Alternativa A modificada** (`onFrame` → pipe → FFmpeg LGPL `--enable-libvpx` → re-mux WebM buscable en staging cifrado → Streaming AEAD) únicamente si `EXP-06a` revelara que algún motor admitido no permite confinar temporales nativos con `path`, manteniendo `MANDATORY_SUPPRESSION` localizada donde no exista `FDE` ni frontera previa.
3. **Motivos de descarte:**
   - Se descarta **Alternativa A pura (`pipe:1` directo a AEAD)** porque el WebM generado en pipe no buscable carece de `Duration`/`SeekHead`/`Cues`, rompiendo el *seek* `HTTP Range`, introduce sobrecarga innecesaria de doble codificación y no resuelve por sí sola los temporales del navegador.
   - Se descarta **Alternativa B pura sin Streaming AEAD** (como `AS-04` con blob único de 32 MiB) porque obliga a cargar el archivo completo en RAM (`O(N)`) y carece de autenticación por bloque en `HTTP Range`.
   - Se descarta la **supresión permanente global** porque incumple **D18**.
4. **Compuertas pendientes:** La **activación** de `PRIVATE_AUTHORIZED` en producto permanece **BLOQUEADA** hasta: (a) superar **`EXP-06a`** en G0/G1, (b) superar **`EXP-06c`** en G3/G5, y (c) obtener ratificación empresarial expresa **`DE-02`** del propietario (ámbitos autorizados, exportación excepcional y aceptación formal de riesgos residuales en RAM/swap/snapshots/copias exportadas).

---

## 10. Evidencia y fuentes verificadas

- **Código en `origin/develop` (`6c05ed05d3435c6c368070952733c9f8d8cbc694`):**
  - [`packages/playwright-runner/src/runner.ts#L404-L495`](../../packages/playwright-runner/src/runner.ts#L404-L495)
  - [`packages/playwright-runner/package.json#L18`](../../packages/playwright-runner/package.json#L18)
- **Evidencia archivada `AS-04` (`archive/2026-11-23/codex/as04-unified-capture`, SHA `463b556627b30165fde4f52291879802b9487e87`):**
  - `docs/qap-architecture/insumos/as04-estado-integracion.md`
  - `packages/playwright-runner/src/capture/unified-capture-controller.ts`
  - `packages/playwright-runner/src/capture/staging-store.ts`
  - `packages/reporter/src/server/private-media.ts`
- **Expediente documental de arquitectura:**
  - [Acta de decisiones D14, D15, D18, D19, D20](../acta-decisiones.md)
  - [Catálogo consolidado de requisitos](../catalogo-requisitos.md)
  - [Dictamen independiente AV-02](dictamen-av02.md#ar-27)
  - [Contravalidación Neon AV-01/AV-02](contravalidacion-neon-av01-av02.md#b-captura-multimedia-privada-ar-27)
  - [Registro maestro](registro-maestro.md#ar-27)
- **Documentación técnica externa:**
  - [Playwright Screencast API (`page.screencast`)](https://playwright.dev/docs/api/class-screencast)
  - [FFmpeg Legal & Licensing](https://ffmpeg.org/legal.html) · [WebM Project `libvpx`](https://www.webmproject.org/code/)
  - [Google Tink Streaming AEAD](https://developers.google.com/tink/streaming-aead) · [Libsodium `crypto_secretstream`](https://doc.libsodium.org/secret-key_cryptography/secretstream) · [NIST SP 800-88 Rev. 2](https://csrc.nist.gov/pubs/sp/800/88/r2/final) · [RFC 9110 HTTP Range](https://www.rfc-editor.org/rfc/rfc9110.html#name-range-requests)
