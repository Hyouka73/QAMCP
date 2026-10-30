# QAMCP vNext — Backlog Preliminar y WBS Desglosado

- **Documento:** `04_BACKLOG_Y_WBS_PRELIMINAR.md`
- **Rama:** `feat/qap-vnext-architecture`
- **Autor / Rol:** Principal Software Architect y Teamwork Lead
- **Fecha:** Octubre 2026 (Revisión Arquitectónica Profunda — Etapa 0 Corregida)
- **Estado:** VNEXT-001 a VNEXT-006 terminadas; VNEXT-007 a VNEXT-010 completadas con limitaciones explícitas (2026-10-30). VNEXT-011 y posteriores pendientes de autorización.
- **Referencias:** D-010 (Evolución documentada por etapas), D-001 a D-015.

---

## 1. Estructura General y Dependencias Reales entre Hitos

Conforme a la directiva **D-010** y la corrección de inconsistencias de numeración del WBS, el trabajo se organiza en **7 Hitos Secuenciales (Hito 0 a Hito 6)** numerados de forma estrictamente continua (**VNEXT-001 a VNEXT-023**).

> [!IMPORTANT]
> **Estado de Autorización:** Solicitudes del 2026-10-30 autorizaron VNEXT-007 y posteriormente VNEXT-008, implementadas y verificadas con los límites documentados. Autorización posterior del 2026-10-30 incluye únicamente VNEXT-009, implementada con límites explícitos. Detener tras VNEXT-009; VNEXT-010 y posteriores requieren autorización nueva. Continuidad: [STATE.md](STATE.md).
> Una autorización posterior del mismo día incluye exclusivamente VNEXT-010, implementada
> y verificada con límites explícitos. Detener tras publicar VNEXT-010; VNEXT-011 y
> posteriores requieren autorización nueva. No se reescriben los cierres históricos.

```mermaid
flowchart TD
    H0["Hito 0: Fundación de Contratos de Dominio<br/>(VNEXT-001: Terminada)"] --> H1["Hito 1: Persistencia Local SQLite & Bóveda<br/>(VNEXT-002 a 005 terminadas)"]
    H1 --> H2["Hito 2: Adquisición de Conocimiento Black-Box<br/>(VNEXT-006, VNEXT-007, VNEXT-008, VNEXT-009, VNEXT-010)"]
    H1 --> H3["Hito 3: Desacoplamiento Modular MCP<br/>(VNEXT-011, VNEXT-012, VNEXT-013, VNEXT-014)"]
    H2 --> H4["Hito 4: QA Advisor & Diagnóstico Autónomo<br/>(VNEXT-015, VNEXT-016, VNEXT-017)"]
    H3 --> H4
    H4 --> H5["Hito 5: Distribución npx-First y Empaquetado<br/>(VNEXT-018, VNEXT-019)"]
    H5 --> H6["Hito 6: Certificación E2E e Integración con Diego<br/>(VNEXT-020, VNEXT-021, VNEXT-022, VNEXT-023)"]
```

---

## 2. Catálogo Detallado de Micro-Tareas (WBS)

### Hito 0: Fundación de Contratos de Dominio

#### `VNEXT-001` — Definición del Modelo de Dominio y Contratos de Conocimiento en Validación Empírica
- **Estado:** Terminada previamente (commit base ffb5031); contratos canónicos presentes y 145 tests shared verificados durante VNEXT-002.
- **Paquetes afectados:** `@qap/shared`.
- **Dependencias:** Ninguna (Fundacional).
- **Riesgo:** Bajo.
- **Alcance:** Definir los contratos de dominio TypeScript y esquemas de validación necesarios para:
  1. Distinguir formalmente cuatro planos epistemológicos: `ApplicationObservation` (lo observado), `AgentInference` (lo inferido), `ExpectedRequirement` (el requisito esperado) y `ConformityAssessment` (la verificación de conformidad).
  2. Modelar dimensiones contextuales ricas: aplicaciones, entornos, roles y permisos (RBAC), prerrequisitos, sesiones activas, políticas de limpieza del navegador (`clean_cache`, `fresh_context`, `retain_session`) y evidencias multimodales enmascaradas.
  3. Prohibir la promoción automática de reglas de negocio a `confirmed` mediante sondas de aplicación.
  4. Admitir explícitamente resultados `indeterminate` / `inconclusive`.
  5. Soportar los escenarios reales de QA: Escenario A (App desconocida), Escenario B (Módulo nuevo) y Escenario C (Autenticación y caché).
- **Mecanismo de verificación:** `pnpm --filter @qap/shared test`, pruebas de contratos válidos, inválidos y contradictorios, compilación y pruebas de consumidores relevantes.
- **Criterios de aceptación:**
  - Tipos exportados formalmente en `@qap/shared` sin romper compatibilidad existente.
  - Cero dependencias nativas o binarias.

---

### Hito 1: Persistencia Local SQLite y Bóveda Criptográfica

#### `VNEXT-002` — Contrato Formal `IKnowledgeStore` y Puerto de Persistencia
- **Estado:** Terminada (2026-10-28); contrato y doble en memoria verificados, sin persistencia física.
- **Paquetes afectados:** `@qap/engine` (puerto y pruebas); reutiliza entidades de `@qap/shared` sin modificarlas.
- **Dependencias:** `VNEXT-001`.
- **Riesgo:** Bajo.
- **Alcance realizado:** `packages/engine/src/knowledge-store.port.ts`, exportado por Engine: lecturas tipadas, consultas paginadas, commit atómico con CAS, historial y referencias con revisiones, aislamiento y errores tipados. Se corrigió la ubicación para evitar `engine → knowledge → engine`. Búsqueda léxica (VNEXT-004), telemetría y snapshots se difieren; no existen métodos ficticios. [Decisión, límites y verificación](VNEXT-002_KNOWLEDGE_STORE.md).

#### `VNEXT-003` — Adaptador de Persistencia SQLite Local (`SqliteKnowledgeAdapter`)
- **Estado:** Terminada (2026-10-28), dentro de la autorización expresa de continuidad.
- **Paquetes afectados:** `@qap/knowledge`; extracción de suite de tests en `@qap/engine`, sin cambiar el puerto.
- **Dependencias:** `VNEXT-002` terminada.
- **Riesgo:** Medio; límites de plataforma/carga/E2E documentados.
- **Alcance realizado:** SQLite físico con WAL, FK diferidas, CAS, historial inmutable, sellado de referencias, transacciones y esquema v1 con migración segura solo desde base vacía. 24 contratos + 14 pruebas físicas pasan en Windows x64 con Node 22.13.1, 24.15.0 y 24.22.1. 523 tests relevantes y 10 compilaciones pasan; la suite global tiene fallos reproducidos en la base y un fallo de tiempo de route-scanner bajo carga. No se certifica E2E ni Linux/macOS. [DDL, decisiones, reproducción y límites](VNEXT-003_SQLITE_ADAPTER.md).

#### `VNEXT-004` — Motor de Búsqueda FTS5 de Selectores y Atributos UI
- **Estado:** Terminada y verificada (2026-10-28), por autorización expresa. Detener antes de VNEXT-005.
- **Paquetes afectados:** `@qap/engine` (puerto complementario), `@qap/knowledge` (adaptador/migración/tests).
- **Dependencias:** `VNEXT-003`.
- **Riesgo:** Bajo.
- **Alcance:** Crear tabla virtual FTS5 (`action_targets_fts`) y métodos de consulta parametrizada por coincidencia léxica, atributo o etiqueta de accesibilidad.
- **Entrega:** IActionTargetSearch sin cambiar IKnowledgeStore v1; esquema v2 con migración v1→v2 transaccional, índice de objetivos actuales, filtros reales y ranking BM25. 547/547 pruebas relevantes; 62/62 físicas/búsqueda en Node 24.15.0 y 24.22.1. Node 22.13.1 instalado carece de FTS5 y se rechaza sin migrar; global conserva fallos preexistentes Auth/Chromium y Playwright Adapter. [Diseño, resultados y límites](VNEXT-004_FTS5_SEARCH.md).

#### `VNEXT-005` — Bóveda Criptográfica Escalonada de Credenciales (Tiered Vault)
- **Estado:** Terminada (2026-10-28), por autorización expresa. Windows/Node 24 verificados; POSIX y npx limpio pendientes. Detener antes de VNEXT-006.
- **Paquetes afectados:** `@qap/auth`, tipos/schemas de `@qap/shared`, compatibilidad CLI y test centinela MCP.
- **Dependencias:** `VNEXT-001`.
- **Riesgo:** Medio.
- **Alcance entregado:** `ICredentialProvider`, selección explícita en `TieredCredentialVault`, keytar opcional/diferido, bóveda AES-256-GCM + scrypt (N=131072, r=8, p=1), efímeras y compatibilidad env. Namespace por proyecto/aplicación/entorno/perfil/cuenta; locks, escrituras atómicas, errores sanitizados y sesiones con clave aleatoria o explícita. Sin fallback inseguro ni nuevos handlers.
- **Verificación:** Auth 34 aprobadas/1 omitida POSIX en Windows con Node 24.15.0/24.19.0/24.22.1; keychain real 6 comprobaciones por runtime; 547 pruebas de dominio, CLI 6 y centinela MCP 1 aprobadas. 10 builds. Global conserva fallos Chromium/Adapter y sensibilidad a carga de route-scanner.
- **Diseño, migración legacy y límites:** [VNEXT-005_CREDENTIAL_VAULT.md](VNEXT-005_CREDENTIAL_VAULT.md).

---

### Hito 2: Adquisición de Conocimiento Black-Box First

#### `VNEXT-006` — Módulo de Reconocimiento Pasivo HTTP y Detección de Stack
- **Estado:** Terminada (2026-10-28), con limitaciones de entorno y puerto v1 documentadas. No iniciar VNEXT-007.
- **Paquetes afectados:** `@qap/playwright-adapter`, `@qap/knowledge`, extensión aditiva mínima de `@qap/shared`.
- **Dependencias:** `VNEXT-001`, `VNEXT-003`.
- **Riesgo:** Bajo.
- **Alcance:** Implementar `ReconnaissanceService` para inspeccionar headers de seguridad, certificados SSL, tecnologías de frontend, rutas robots.txt y sitemap sin mutaciones en el servidor, produciendo `ApplicationObservation`.
- **Entrega:** API tipada/exportada, GET por recurso autorizado, DNS/IP fijados y peer verificado, SSRF/redirects/budgets, ingesta sanitizada y commit atómico de observación + evidencia `http_recon_metadata`. Sin navegador, crawler ni promoción de hipótesis.
- **Verificación:** 55 tests HTTP/TLS/IPv6 nuevos, 4 SQLite físicos finales, Shared 146/146, Engine 168/168; Knowledge completo 238/238; adapter comparado base 26/26 y actual 80/80 antes de añadir el test 1xx final. Diez builds. Límites legacy de tsc/lint y de deadline/store explícitos en [VNEXT-006](VNEXT-006_HTTP_RECONNAISSANCE.md).

#### `VNEXT-007` — Crawler Black-Box Dirigido con Playwright
- **Estado:** Completada con limitaciones (2026-10-30): modo estático anónimo; exploración SPA ejecutando JavaScript no implementada ni certificada.
- **Paquetes afectados:** `@qap/playwright-adapter`.
- **Dependencias:** `VNEXT-006`.
- **Riesgo:** Medio.
- **Alcance:** Construir `BlackBoxCrawler` capaz de navegar la aplicación en modo incógnito/perfil limpio, mapear rutas accesibles, menús, enlaces, formularios y botones sin mutaciones destructivas.
- **Entrega:** API tipada/exportada, BFS por URLs exactas y GET read-only consentidos; contextos nuevos offline/JS desactivado, transporte Node DNS fijado de VNEXT-006, proxy de denegación, sin 3xx al browser. DOM sanitizado, rutas opacas y estados candidatos/visitas distintos; commit atómico de evidencia y observaciones por puerto v1 intacto. Entidades de dominio diferidas sin identidad válida.
- **Verificación:** 30 pruebas nuevas con Chrome real y SQLite físico; adapter completo 111/111, Shared 146/146, Engine 168/168, Knowledge 238/238, diez builds y tsc/lint focalizados. Proxy comprobado sin routing/offline; rollback real, canarios ausentes e historial conservado.
- **Límites:** Shells SPA/skeleton registrados como dependientes de scripts, sin afirmar exploración dinámica ni protección SSRF de navegador general. Recursos externos y queries bloqueados. Criterios SPA/asíncronos limitados expresamente. [API, seguridad, reproducción y límites](VNEXT-007_BLACKBOX_CRAWLER.md). Cierre histórico de VNEXT-007; la autorización posterior de VNEXT-008 se registra abajo.

#### `VNEXT-008` — Interceptor de Tráfico de Red y Extracción de Endpoints
- **Estado:** Completada con limitaciones: observación dinámica pasiva acotada, Chrome real y SQLite físico (2026-10-30).
- **Paquetes afectados:** `@qap/playwright-adapter`.
- **Dependencias:** `VNEXT-007`.
- **Riesgo:** Alto: ejecución dinámica con frontera de red; TCP/UDP comprobados empíricamente.
- **Alcance:** Capturar llamadas XHR/Fetch generadas por la UI durante la navegación pasiva, extrayendo endpoints, métodos HTTP, query params y códigos de respuesta típicos con enmascaramiento de PII.
- **Entrega:** NetworkTrafficObserver opt-in separado; gateway DNS fijado/peer/TLS, permisos por categoría/URL GET, proxy de denegación y CSP. Scripts reales, Fetch 200/XHR 503, estados respuesta/bloqueo/inconcluso y entrega CORS separados. Endpoints opacos con patrones seguros consentidos y muestras múltiples; query names permitidos sin valores. Evidencia estructurada y observaciones v1, lotes atómicos <=100 writes con fallos parciales explícitos.
- **Seguridad:** Se detectó salida UDP WebRTC con la bandera heredada y se corrigió con la bandera Chromium actual. Prueba real sin routing/offline: cero HTTP/UDP prohibidos. Métodos de escritura, destinos fuera de alcance, DNS rebinding, scripts externos, SW/WS/frames/popups/downloads y token URL bloqueados; canarios ausentes de salida y SQLite/WAL/SHM/logs.
- **Verificación:** 28 pruebas nuevas; adapter final 139/139 con archivos secuenciales, Shared 146/146, Engine 168/168, Knowledge 238/238; diez builds y tsc/lint focalizados. Consumidores CLI 6/6, MCP canario 1/1, runner 4/4, Auth 34 + 1 omitida POSIX. Un intento paralelo bajo carga falló en test legacy skeleton intacto; detalle conservado, sin certificar suite global.
- **Límites:** Una vista/ventana pasiva, no inventario exhaustivo ni sandbox OS; Chrome/Windows probados. Sin login, acciones, redirects seguidos, inline/eval, binarios, headers personalizados/preflight ni inferencias. [Arquitectura, API y reproducción](VNEXT-008_NETWORK_INTERCEPTOR.md). Detener; no iniciar VNEXT-009.

#### `VNEXT-009` — Motor de Inferencia de Hipótesis y Asignación de Certeza
- **Estado:** Completada con limitaciones explícitas (2026-10-30), por autorización expresa. Agente principal único.
- **Paquetes afectados:** `@qap/knowledge`.
- **Dependencias:** `VNEXT-007`, `VNEXT-008`.
- **Riesgo:** Medio.
- **Alcance entregado:** KnowledgeInferenceEngine sobre IKnowledgeStore v1, cinco categorías de hipótesis con plantillas cerradas, puntaje heurístico desglosado (no probabilidad), abstención, deduplicación, CAS e historia con soporte persistido. Sin reglas confirmadas ni correlación HMAC entre ejecuciones.
- **Verificación:** 20/20 nuevas; Shared146/146, Engine168/168, Knowledge258/258, Adapter139/139; diez builds, tipos/lint de entrega limpios. SQLite físico, conflictos, rollback y canarios. Diagnósticos legacy y ventana contexto/commit documentados.
- **Límites y continuidad:** cobertura parcial, independencia no demostrada, clusters locales heurísticos, sin promoción. [API, fórmula, pruebas y límites](VNEXT-009_INFERENCE_ENGINE.md). Detener; VNEXT-010 no autorizada.

#### `VNEXT-010` — Sondas de Observación Activa No Destructiva
- **Estado:** Completada con limitaciones (2026-10-30), por autorización expresa posterior.
- **Paquetes afectados:** `@qap/playwright-adapter`, `@qap/knowledge`.
- **Dependencias:** `VNEXT-009`.
- **Riesgo:** Medio.
- **Alcance:** Ejecutor de sondas seguras (ej. submit vacío para detonar mensajes de validación). **Regla D-011:** Comprueba reproducibilidad y consistencia observacional; no promueve reglas a `confirmed`.
- **Entrega:** ActiveObservationProbe exportado; checkValidity y requestSubmit reales
  sobre formulario vacío autorizado, contextos nuevos por ensayo, gateway sellado/offline
  y proxy deny-only conservado. Evidencia estructural probe_result/active_probe y lote
  SQLite atómico <=6 writes. Catálogo cerrado, sin formularios válidos ni credenciales.
- **Limitaciones:** Windows/Node24/Chrome comprobados; sin garantía OS/RAM, formularios
  poblados/hidden/password, frames/shadow DOM ni carga API. Store v1 sin CAS contextual ni
  cancelación de operaciones SQLite. Consistencia no acredita corrección de negocio.
  [Arquitectura, verificación y reproducción](VNEXT-010_ACTIVE_OBSERVATION_PROBES.md).

---

### Hito 3: Desacoplamiento Modular del Servidor MCP

#### `VNEXT-011` — Arquitectura de Handlers Declarativos para MCP
- **Estado:** Pendiente de autorización.
- **Paquetes afectados:** `@qap/mcp`.
- **Dependencias:** `VNEXT-001`, `VNEXT-002`.
- **Riesgo:** Medio.
- **Alcance:** Crear infraestructura de despachador declarativo (`src/dispatcher.ts`) e interfaz `IMcpToolHandler`. Eliminar supresión de reglas ESLint en `@qap/mcp`.

#### `VNEXT-012` — Migración de Handlers de Información y Estado (`status`, `clean`, `context`)
- **Estado:** Pendiente de autorización.
- **Paquetes afectados:** `@qap/mcp`.
- **Dependencias:** `VNEXT-011`, `VNEXT-003`.
- **Riesgo:** Bajo.
- **Alcance:** Implementar `status.handler.ts`, `clean.handler.ts` y `context.handler.ts` conectándolos directamente al nuevo `IKnowledgeStore`.

#### `VNEXT-013` — Handler de Descubrimiento Autónomo (`discovery.handler.ts`)
- **Estado:** Pendiente de autorización.
- **Paquetes afectados:** `@qap/mcp`.
- **Dependencias:** `VNEXT-011`, `VNEXT-009`.
- **Riesgo:** Medio.
- **Alcance:** Conectar la tool `qap_discover` con el crawler black-box, devolviendo el resumen estructurado de hallazgos.

#### `VNEXT-014` — Conexión Real de `qap_plan` y `qap_test` (Eliminación de Mocks)
- **Estado:** Pendiente de autorización.
- **Paquetes afectados:** `@qap/mcp`, `@qap/playwright-runner`.
- **Dependencias:** `VNEXT-011`, `VNEXT-003`.
- **Riesgo:** Alto.
- **Alcance:** Eliminar las respuestas estáticas mockeadas (`estado: 'en_desarrollo'`). Conectar `qap_plan` con el planificador DAG y `qap_test` con `PlaywrightRunner`.

---

### Hito 4: QA Advisor y Diagnóstico Autónomo

#### `VNEXT-015` — Motor de Cálculo de Impacto y Blast Radius
- **Estado:** Pendiente de autorización.
- **Paquetes afectados:** `@qap/engine`, `@qap/knowledge`.
- **Dependencias:** `VNEXT-003`, `VNEXT-009`.
- **Riesgo:** Medio.
- **Alcance:** Construir `ImpactAnalyzer` para calcular módulos y flujos dependientes afectados en el DAG ante cambios.

#### `VNEXT-016` — Implementación del Asesor Interactivo de QA (`qap_advisor`)
- **Estado:** Pendiente de autorización.
- **Paquetes afectados:** `@qap/engine`, `@qap/mcp`.
- **Dependencias:** `VNEXT-015`.
- **Riesgo:** Medio.
- **Alcance:** Construir el servicio de consultoría interactiva (D-008) y exponer la tool `qap_advisor`. Presenta blast radius, sugiere alcances y formula preguntas estructuradas cuando sea necesario.

#### `VNEXT-017` — Clasificador Autónomo de Anomalías y Defectos con Soporte Indeterminado
- **Estado:** Pendiente de autorización.
- **Paquetes afectados:** `@qap/engine`.
- **Dependencias:** `VNEXT-014`.
- **Riesgo:** Medio.
- **Alcance:** Motor de diagnóstico (D-014) que clasifica incidentes en `product_bug`, `environment_error`, `automation_flakiness`, `blocked_flow` o `indeterminate`. Prohibido emitir diagnósticos concluyentes basados exclusivamente en HTTP status codes.

---

### Hito 5: Distribución `npx-First` y Portabilidad Cero-Config

#### `VNEXT-018` — Configuración de Empaquetado `tsup` Standalone
- **Estado:** Pendiente de autorización (sujeta a verificación de Node.js y Playwright).
- **Paquetes afectados:** `@hyouka73/qap-cli`, `@qap/mcp`.
- **Dependencias:** `VNEXT-014`, `VNEXT-005`.
- **Riesgo:** Medio.
- **Alcance:** Configurar bundle autocontenido con `tsup` que empaquete `@qap/*` dentro de `dist/entrypoint.js` para distribución npx sin dependencias nativas obligatorias.

#### `VNEXT-019` — Comando de Inicialización y Auto-Configuración MCP
- **Estado:** Pendiente de autorización.
- **Paquetes afectados:** `@hyouka73/qap-cli`.
- **Dependencias:** `VNEXT-018`.
- **Riesgo:** Bajo.
- **Alcance:** Implementar registro desatendido para Claude Desktop, Cursor y Antigravity.

---

### Hito 6: Certificación E2E e Integración con Diego

#### `VNEXT-020` — Suite de Pruebas E2E de Aceptación Black-Box
- **Estado:** Pendiente de autorización.
- **Paquetes afectados:** Monorepo completo.
- **Dependencias:** `VNEXT-014`, `VNEXT-016`, `VNEXT-019`.
- **Riesgo:** Medio.
- **Alcance:** Prueba integral de ciclo completo: descubrimiento -> inferencias -> asesoría QA -> ejecución autónoma -> reporte.

#### `VNEXT-021` — Documentación Técnica de vNext y Manual de Migración
- **Estado:** Pendiente de autorización.
- **Paquetes afectados:** `docs/vnext/`.
- **Dependencias:** `VNEXT-020`.
- **Riesgo:** Bajo.
- **Alcance:** Guía de uso CLI, manual MCP, contratos de datos y guía de contribución.

#### `VNEXT-022` — Sincronización y Validación Cruzada con `develop` (Diego)
- **Estado:** Pendiente de autorización.
- **Paquetes afectados:** Todos los paquetes compartidos.
- **Dependencias:** `VNEXT-020`.
- **Riesgo:** Alto.
- **Alcance:** Sesión formal de integración con Diego asegurando que las suites de prueba de ambas líneas se mantengan en verde.

#### `VNEXT-023` — Verificación de Release y Despliegue Piloto en NPM
- **Estado:** Pendiente de autorización.
- **Paquetes afectados:** `@hyouka73/qap-cli`, `@qap/mcp`.
- **Dependencias:** `VNEXT-022`.
- **Riesgo:** Medio.
- **Alcance:** Verificación final en máquina limpia vía `npx @hyouka73/qap-mcp`.
