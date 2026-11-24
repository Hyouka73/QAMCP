> **Vigencia documental.** Esta investigación conserva criterios, experimentos y propuestas para evaluación. El expediente consolidado aplica la precedencia de D01–D21. [Entrada para Gemini Neon](../revision-neon.md).

# QAP · Investigación de Gemini Neon para el cierre de requisitos

**Estado:** investigación de origen, pendiente de ratificación.

**Procedencia:** entrega de Gemini Neon facilitada por el propietario como texto adjunto en la revisión previa a G0. Su base es [`develop` en `fb4d18521844e5cd59ebd4107f75ebe0d320b33c`](https://github.com/Hyouka73/QAMCP/tree/fb4d18521844e5cd59ebd4107f75ebe0d320b33c). SHA-256 del adjunto de origen: `5FA7378D78EA2032A2722B516852930DC8C2C2268A209CE7B80522E7207530C4`.

Se conserva la entrega completa a continuación. Sus diagnósticos, hipótesis, comparativas, recomendaciones y decisiones propuestas reflejan el análisis de Neon. Para conocer qué se corroboró, qué se corrigió y qué requiere experimentos, consultar la [evaluación independiente posterior](evaluacion-independiente-requisitos.md). La publicación documental no autoriza cambios de arquitectura, implementación ni inicio de G0/G1.

---

### Verificación de la instantánea y línea base

La instantánea adjunta de `Hyouka73/QAMCP` corresponde a la rama `develop` (`QAMCP-develop`, `@qap/monorepo` v2.1.0, `@qap/mcp` y `@hyouka73/qap-cli` v2.1.3) en el commit exacto **`fb4d18521844e5cd59ebd4107f75ebe0d320b33c`** (verificado en el comentario del archivo ZIP; la instantánea no incluye `.git`). La documentación revisada en `docs/qap-architecture/` (`plan-maestro.md`, `revision-independiente.md` y `gemini-neon-etapa-3.md`) toma como línea base documental `e766cc33ef5fc635e5f22ebbf46970d34769a097` (código equivalente a `31836bd`). La verificación directa sobre el código en `fb4d1852` confirma que los hallazgos estructurales y de runtime siguen vigentes y revela brechas adicionales en adopción por agentes, onboarding multiplataforma, memoria/procesos y capacidades E2E/UTCP.

---

### A. Diagnóstico de QAP actual

Más allá de los hallazgos ya documentados en `docs/qap-architecture/revision-independiente.md` (H01–H11 y H-REV-01–H-REV-06) y la matriz de 82 requisitos de `gemini-neon-etapa-3.md` (0 completos, 41 parciales, 16 incompatibles, 25 ausentes), la inspección de `fb4d1852` expone cinco problemas raíz críticos para las áreas investigadas:

1. **Adopción frágil por agentes y dependencia de instrucciones pasivas:**
* `packages/mcp/src/server.ts:705-723` expone `capabilities: { tools: {}, prompts: {} }` (sin `resources`) y concentra 14 reglas extensas en `InitializeResult.instructions`, mezclando directivas actuales con compuertas legacy P0 (confirmación de hipótesis DOM en regla 8, `qap_module_close` con `user_confirmed: true` en regla 9 y paso de `credentials` en regla 0).
* No existe paquete portable de **Agent Skills** (`SKILL.md`) ni hooks por host (`PreToolUse`/`BeforeTool`/`UserPromptSubmit`). `scripts/sync-mcp-schemas.mjs:9` escribe únicamente a `~/.gemini/antigravity-ide/mcp/qap-mcp` (solo Antigravity IDE).
* `packages/mcp/src/host-composition.ts:390,413` mantiene `silentBoundScope: true` (habilitando `allowScopedCredentials` en `server.ts:744-756`) y bloquea la composición por manifiesto (`Manifest composition is disabled`).


2. **Onboarding acoplado al proyecto destino y a Windows:**
* `packages/cli/src/utils/playwright-detector.ts:12-45` solo inspecciona el `package.json` del proyecto bajo prueba (`targetPath`) para verificar `@playwright/test` o `playwright-core`, confundiendo las dependencias del sistema probado (AUT) con el runtime propio de QAP; además imprime un mensaje manual (`npm install -D @playwright/test && npx playwright install`) sin verificar binarios en caché ni librerías del sistema.
* `packages/playwright-adapter/package.json:15` incluye `@playwright/mcp` (`^0.0.80`) como dependencia muerta (0 importaciones en todo el monorepo) y hay desalineación de versiones de `playwright-core` entre paquetes (`^1.49.0` en `playwright-adapter`, `^1.62.1` en `auth`/`mcp`/`playwright-runner`, `1.63.0` en `cli`).
* Los diálogos de autorización y captura interactiva (`packages/auth/src/local-secret-prompt.ts:72`, `packages/mcp/src/host-composition.ts:378-401`, `scripts/qap-interactive-*.ps1`) son exclusivos de Windows/PowerShell; en macOS/Linux se degradan a `undefined` (`host_bound_scope_only`).


3. **Gestión de navegadores, aislamiento y memoria con fugas conocidas:**
* `packages/playwright-runner/src/lifecycle.ts` (`RunnerLifecycle`) es código huérfano (solo importado en `test/lifecycle.test.ts`). En producción, `packages/playwright-runner/src/runner.ts:360,463,542` lanza un Chromium por plan y reutiliza **un único `BrowserContext` y una única `Page**` para todos los casos, contaminando cookies/storage entre casos y fijando `recordVideo` a `1280x720` (`:461`) sin alinear viewport.
* `packages/playwright-adapter/src/crawler/browser.ts:19-36` lanza y destruye un proceso Chromium completo por cada adquisición de Discovery (con proxy deny-only en loopback).
* `packages/playwright-runner/src/session-resolver.ts:44-45` puede fugar el proceso `browser` si `browser.newContext()` falla antes de asignarse (riesgo R7-06 señalado en `docs/vnext/AUDITORIA_ARQUITECTURA_RENDIMIENTO_MVP_R7_2026-11-07.md`). En dicha auditoría física (E01-R5) ya se midieron picos de 100 % CPU, RAM libre mínima de 107 MB, *event-loop lag* de 2231 ms y cierres de Chromium (`browser.close`) de hasta 7446 ms bajo paralelismo sin reserva.
* `packages/mcp/src/server.ts:4303-4350` (`qap_prune`) devuelve ceros fijos en `dryRun`, no cierra el handle de `QapDatabase` y no poda `.qa/executions/`.


4. **Capacidades E2E multimódulo, Discovery SPA y oráculos incompletos:**
* `packages/mcp/src/server.ts:735` oculta `qap_flow_run` del catálogo MCP y `packages/engine/src/flow-orchestrator.ts:371-402` ignora `depends_on` entre módulos.
* `packages/playwright-adapter/src/crawler/dom.ts:13-50` filtra etiquetas contra un diccionario fijo de 9 palabras (`home`, `about`, `inicio`, etc.) y omite `<table>`; `packages/playwright-runner/src/actions/navigate.ts:12-18` descarta el código HTTP devuelto por `page.goto`.
* No existe integración UTCP, ni capa de lectura read-only cross-instancia, ni pruebas automatizadas de i18n/moneda/accesibilidad (`axe-core`)/contratos API.


5. **Seguridad de línea base pendiente de remediación (ya trazada en G0):**
* `packages/reporter/src/server/server.ts:59,265-315` combina `Access-Control-Allow-Origin: *` con resolución de artefactos sin confinamiento canónico estricto y sin soporte HTTP Range (`206`/`416`) ni tipo MIME WebM en visor.
* `packages/git-adapter/src/git-adapter.ts:26` usa `execSync` interpolando `this.baseBranch` en el shell.



---

### B. Comparativa de tecnologías (Investigación 2)

Para evitar falsas equivalencias, la evaluación separa estrictamente **tres capas distintas**: (1) motores de navegador, (2) protocolos y bibliotecas de automatización determinista, y (3) capas de razonamiento o wrappers orientados a IA.

#### Capa 1: Motores de navegador

* **Chromium / Chrome for Testing / `chrome-headless-shell**`: estándar de facto para web/SPA empresarial; soporte nativo en Windows, macOS y Linux, trazas, WebM y CDP. `chrome-headless-shell` reduce consumo en headless puro, mientras que el nuevo modo headless de Chrome/Chromium (`channel: 'chromium'` o Chrome for Testing) reproduce con mayor fidelidad el navegador real ([Playwright Browsers](https://playwright.dev/docs/browsers), [Puppeteer Supported Browsers](https://pptr.dev/supported-browsers)).
* **Firefox y WebKit**: necesarios únicamente si existe requisito explícito de compatibilidad cross-browser. En Playwright requieren builds parcheados propios (no funcionan con Firefox/Safari instalados por el usuario), añadiendo ~180–190 MB cada uno ([Playwright Browsers](https://playwright.dev/docs/browsers)).
* **Motores ultraligeros alternativos (p. ej. Lightpanda)**: útiles para scraping o cargas sintéticas rápidas ([agent-browser](https://github.com/vercel-labs/agent-browser)), pero carecen de paridad total de renderizado, video WebM, fuentes/CSS real y fidelidad SPA para QA empresarial auditable.

#### Capa 2: Bibliotecas y protocolos de automatización determinista

| Tecnología | Protocolo / Base | Estabilidad y determinismo | E2E completos y trazas | RAM / CPU | Multiplataforma (Win/Mac/Linux) | Seguridad y aislamiento | Mantenimiento y ecosistema |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **`playwright-core`** ([Docs](https://playwright.dev/docs/browsers)) | CDP (Chromium) + protocolos parcheados (Firefox/WebKit) | **Muy alta.** Auto-waiting, actionability checks, locators semánticos (`getByRole`, `getByLabel`). | **Excelente.** `BrowserContext` aislado, `trace.zip`, screenshots, video WebM, `route()` intercept, `APIRequestContext`. | Medio (1 proceso browser + contextos ligeros). Picos si se lanza 1 browser por caso. | **Total** (x64/ARM64 en Win/Mac/Linux). | `BrowserContext` limpio por caso, `storageState`, `serviceWorkers: 'block'`, proxy por lanzamiento. | Muy activo (Microsoft), ya integrado en QAP (`^1.62`/`1.63`). |
| **Puppeteer + CDP directo** ([FAQ](https://pptr.dev/faq)) | CDP (defecto en Chrome) y WebDriver BiDi (Chrome/Firefox desde v23) | Alta en Chrome, pero **sin auto-waiting ni actionability** equivalentes a Playwright (requiere lógica propia). | Bueno en Chrome, pero **sin Trace Viewer nativo** ni grabación WebM integrada out-of-the-box. | Ligeramente menor que Playwright en llamadas CDP masivas (1 salto menos si no hay relay). | **Total** (Chrome for Testing). | Contextos incógnito (`createBrowserContext`), pero sin capa de red/tracing tan completa para QA. | Muy activo (Google Chrome team). Excelente para tooling DevTools, menos completo como runner de QA. |
| **Selenium + WebDriver BiDi** ([Selenium BiDi](https://www.selenium.dev/documentation/webdriver/bidi/), [W3C Spec](https://www.w3.org/TR/webdriver-bidi/)) | W3C WebDriver Classic + WebSocket BiDi | Alta en suites clásicas; migración de APIs de alto nivel de Classic a BiDi sigue en transición ([Selenium BiDi](https://www.selenium.dev/documentation/webdriver/bidi/)). | Sólido para compatibilidad corporativa/grid, pero **más lento** en arranque/intercepción y sin `trace.zip`/video integrado nativo. | Medio-alto (procesos driver + browser). | **Total** (estándar W3C agnóstico de vendor). | Aislamiento por sesión WebDriver (más pesado que `BrowserContext`). | Muy maduro (SFC/W3C). Útil solo si un cliente exige cumplimiento W3C estricto sin vendor lock-in. |
| **CDP crudo propio** (estilo `cdp-use` / Rust CDP) | WebSocket CDP directo | Depende 100 % del código propio; obliga a reimplementar manejo de 10+ modos de crash de pestañas, diálogos, OOPIFs y esperas ([Browser Use](https://browser-use.com/posts/playwright-to-cdp)). | Requiere construir desde cero tracing, video, locators estables y sincronización de frames. | El más bajo en overhead de protocolo. | Total en Chromium, **nulo** en Firefox/WebKit. | Control total de targets/frames, pero alto riesgo de bugs de seguridad/aislamiento propios. | **Coste de mantenimiento prohibitivo** para un equipo de QA centrado en oráculos y dominio. |

#### Capa 3: Capas de razonamiento, CLIs y plataformas orientadas a IA

| Herramienta | Arquitectura real (verificada) | Descubrimiento apps desconocidas | Latencia y tokens | Compatibilidad MCP / CLI / IA | Limitaciones clave para QAP |
| --- | --- | --- | --- | --- | --- |
| **Playwright MCP** ([microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp/blob/main/README.md)) | Servidor MCP sobre Playwright usando árbol de accesibilidad (`browser_snapshot`). | Alto para exploración guiada por agente; soporta `browser_find`, `browser_tabs(isolatedContext)` y `browser_start_video`. | **Alto consumo de tokens** en árboles grandes; el propio README de Microsoft advierte que para coding agents suele convenir CLI+Skills por eficiencia de tokens. | MCP nativo (stdio/HTTP/SSE). | Diseñado para **1 llamada LLM por paso**; explícitamente declara *"Playwright MCP is not a security boundary"* y sus filtros de origen no protegen redirecciones. Viola el Principio 4 de QAP si se usa como runner. |
| **Chrome DevTools MCP** ([ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp)) | Servidor MCP + CLI oficial de Chrome DevTools sobre Chrome/Chrome for Testing. | Muy bueno para debugging, red, rendimiento (CrUX opcional) y consola en Chrome vivo. | Medio-alto si se usa paso a paso. | MCP + CLI + Skills. | Solo Google Chrome/Chrome for Testing; orientado a debugging de desarrollador, no a campañas E2E deterministas ni oráculos de negocio. |
| **`agent-browser`** ([vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser)) | **CLI nativo en Rust** + daemon de fondo por `--session` sobre CDP (Chrome for Testing). Usa snapshots compactos con refs (`@e1`) y modo `flow` (graba y reproduce peticiones). | Muy rápido y compacto en tokens; incluye `doctor`, `diff`, `a11y`, `vitals`, `auth` vault y allowlists de dominio. | **Muy bajo** frente a MCP verboso (comandos shell cortos + snapshot interactivo `-i`). | CLI + Skill (`npx skills add`) + subcomando `agent-browser mcp`. | Aunque incorpora grabación/replay reciente, está concebido como herramienta interactiva de agente (paso a paso por shell), no como motor de oráculos de negocio N2/N3, DAG multimódulo ni publicación forense de QAP. |
| **Stagehand v3/v4** ([Browserbase blog](https://www.browserbase.com/blog/stagehand-playwright-evolution-browser-automation), [Docs v4](https://docs.stagehand.dev/v4/first-steps/introduction)) | SDK TypeScript/Python/Go con 3 primitivas IA (`act`, `extract`, `observe`) + caché de acciones. **Abandonó Playwright en v3 por CDP nativo** para control fino de frames y throughput de automatización. | Excelente para extraer datos estructurados (Zod/Pydantic) y descubrir selectores con `observe()` + caché. | Medio (LLM solo en `act`/`observe` sin caché; cero LLM al reutilizar caché). | SDK + interoperable con Playwright vía CDP (`connectOverCDP`). | Optimizado para *automation throughput* más que para *testing DNA* (el propio blog reconoce que Playwright es superior en actionability checks y rigor de E2E). |
| **Browser Use** ([Blog](https://browser-use.com/posts/playwright-to-cdp), [GitHub](https://github.com/browser-use/browser-use)) | Agente Python en bucle LLM. Desde v0.6.0 **dejó Playwright por CDP directo (`cdp-use`)** y arquitectura event-driven (`bubus`) con `EnhancedDOMTreeNode` para OOPIFs. | Alto en navegación abierta con visión/DOM. | **Muy alto** (bucle LLM por cada acción + capturas frecuentes). | Python SDK + MCP/cloud. | No determinista; incompatible con el requisito de QAP de ejecutar regresiones sin IA por paso y con stack TypeScript/Node.js. |
| **Midscene.js** ([Docs](https://midscenejs.com/integrate-with-playwright)) / **Skyvern** ([GitHub](https://github.com/Skyvern-AI/skyvern)) | Midscene: agente GUI basado en visión integrable sobre Playwright/Puppeteer. Skyvern: extensión IA sobre Playwright (Python). | Útiles en UIs sin accesibilidad semántica (canvas, WebGL, legacy). | Alto (modelos de visión por paso). | Integrables sobre Playwright. | Dependencia fuerte de visión/LLM por acción; coste y no determinismo altos para suites de regresión. |
| **TestSprite** ([Blog técnico](https://www.testsprite.com/blog/how-ai-testing-agents-work-a-technical-deep-dive), [Revisión](https://chiri.ai/chiri-atlas/testsprite)) | Plataforma SaaS + servidor MCP local que analiza código/PRD, genera plan y ejecuta pruebas en nube aislada. | Fuerte en proyectos con PRD y código local en IDE ("vibe coding"). | Consumo encapsulado en suscripción SaaS. | MCP nativo en IDEs. | Dependencia cloud/AWS, caja negra sobre ejecución/oráculos, menor control sobre redes privadas on-premise, multi-tenant empresarial configurable y reutilización local sin suscripción secundaria. |

#### Recomendación fundamentada (pendiente de aprobación)

1. **Conservar `playwright-core` como motor único de ejecución determinista y captura forense.** Los motivos por los que Stagehand y Browser Use migraron a CDP directo responden a agentes que ejecutan miles de llamadas CDP exploratorias por bucle LLM en Python/cloud; en contraste, QAP prioriza **determinismo, actionability checks, aislamiento por `BrowserContext`, `trace.zip`, video WebM e intercepción de red** en Node.js/TypeScript, exactamente el terreno donde Playwright sigue siendo superior ([Browserbase blog](https://www.browserbase.com/blog/stagehand-playwright-evolution-browser-automation)).
2. **Adoptar una arquitectura híbrida selectiva *dentro de Playwright* (sin añadir otro runtime de navegador):**
* **En Discovery y reparación acotada:** usar sesiones CDP puntuales vía `context.newCDPSession(page)` (ya soportado por `playwright-core`) para extraer árbol de accesibilidad compacto con `ref` cortos estilo `agent-browser`/`Playwright MCP` (reemplazando el extractor limitado de `crawler/dom.ts`) y métricas de red/Web Vitals sin abandonar `playwright-core`.
* **En Ejecución y Regresión:** 100 % determinista sobre `playwright-core` con snapshots congelados y 0 llamadas a LLM por paso.


3. **Descartar** `@playwright/mcp` (eliminar dependencia muerta de `packages/playwright-adapter/package.json`), Browser Use, Skyvern y una reescritura a CDP puro o Selenium. Evaluar `WebDriver BiDi` solo en el horizonte P3 si un cliente regulado exige estándar W3C sin vendor lock-in.

---

### C. Propuesta para integración automática con agentes (Investigación 1)

El problema observado (agentes que ignoran QAP e improvisan scripts Python/Playwright) ocurre porque **un servidor MCP por sí solo es pasivo**: el modelo decide entre docenas de herramientas (Bash, Python, Read, MCP) según su prompt de sistema, el costo de contexto y la inercia de entrenamiento. Superar esto requiere una **estrategia en 4 capas reales** (distinguiendo capacidades verificadas en cada host de propuestas no garantizadas).

#### 1. Matriz de mecanismos reales por host (verificados en documentación oficial)

| Host | Registro MCP global único (1 sola vez) | Instrucciones globales y por proyecto | Skills on-demand (estándar `SKILL.md`) | Hooks deterministas (bloqueo/inyección real) | Limitaciones reales verificadas |
| --- | --- | --- | --- | --- | --- |
| **Claude Code** ([MCP](https://code.claude.com/docs/en/mcp), [Hooks](https://code.claude.com/docs/en/hooks), [Skills](https://code.claude.com/docs/en/skills), [Settings](https://code.claude.com/docs/en/settings)) | `~/.claude.json` o plugin global (`claude mcp add`). | `~/.claude/CLAUDE.md` (global) + `CLAUDE.md` / `.claude/rules/*.md` (proyecto). | `~/.claude/skills/<name>/SKILL.md` y `.claude/skills/<name>/SKILL.md`. | **Completo:** `SessionStart`, `UserPromptSubmit`, `PreToolUse` (soporta `matcher: "Bash|PowerShell"`, `if`, `permissionDecision: "deny"` y `additionalContext`), `PostToolUse`, `PreCompact`. | Sesiones cloud no leen `~/.claude/settings.json` local; `allowManagedHooksOnly` puede bloquear hooks de usuario en entornos gestionados. |
| **OpenAI Codex (CLI / Desktop)** ([Hooks](https://developers.openai.com/codex/hooks), [Config](https://github.com/openai/codex/blob/main/docs/config.md)) | `~/.codex/config.toml` (`[mcp_servers.qap]`). | `~/.codex/AGENTS.md` + `AGENTS.md` por proyecto. | `.agents/skills/<name>/SKILL.md` (estándar abierto Agent Skills). | **Completo:** `~/.codex/hooks.json` (`$CODEX_HOME/hooks.json`) y `.codex/hooks.json` (proyectos confiables). Soporta `SessionStart`, `UserPromptSubmit`, `PreToolUse` (`Bash`, `mcp__*`), `PostToolUse`, e incluso **`type: "mcp_tool"`**. | Los hooks no gestionados exigen revisión/confianza inicial (`/hooks`). Codex Desktop ha reportado problemas de sobrescritura de `config.toml` o ignorar `.codex/config.toml` de proyecto ([Issue #13025](https://github.com/openai/codex/issues/13025), [Issue #36465](https://github.com/openai/codex/issues/36465)); el registro global en `~/.codex/config.toml` debe verificarse en cada arranque. |
| **Google Antigravity (App / CLI / IDE)** ([Skills](https://antigravity.google/docs/skills/), [Hooks](https://antigravity.google/docs/hooks/)) | Configuración MCP global de Antigravity / plugins (`agy plugin install`). | Reglas globales y de workspace (`.agents/`). | `~/.gemini/config/skills/<name>/SKILL.md` (global compartido entre App/CLI/IDE) y `.agents/skills/<name>/SKILL.md` (workspace). | **Completo:** `~/.gemini/config/hooks.json` (global) y `.agents/hooks.json` (workspace). Soporta `SessionStart` (`injectSteps`), `PreInvocation`, `PreToolUse` (`run_command`, `decision: "deny"`, `overwrite`), `PostToolUse`, `Stop`. | En Antigravity IDE/App no siempre anuncia `roots/list` único; además la cancelación automática de formularios MCP (`elicitation/create`) exige evitar `elicitation` en la ruta ordinaria (ya documentado en `QAP-VISION-AUTONOMIA.md`). |
| **Gemini CLI** ([MCP](https://geminicli.com/docs/tools/mcp-server/), [Hooks](https://geminicli.com/docs/hooks/), [Extensions](https://geminicli.com/docs/extensions/writing-extensions/)) | `~/.gemini/settings.json` (`mcpServers`) o **Gemini Extension** (`gemini-extension.json` que empaqueta MCP + `GEMINI.md` + Skills + Hooks). | `~/.gemini/GEMINI.md` y `GEMINI.md` por proyecto. | Soportado en extensiones y directorios de skills. | **Completo:** `~/.gemini/settings.json` / `.gemini/settings.json`. Soporta `SessionStart`, `BeforeAgent`, **`BeforeToolSelection`** (filtra herramientas antes de que el LLM elija), `BeforeTool` (`decision: "deny"`), `PreCompress`. | En cuentas gratuitas/Google One, Gemini CLI fue sucedido por Antigravity CLI en junio de 2026 ([Gemini CLI Docs](https://geminicli.com/docs/hooks/)). Los hooks de proyecto usan fingerprinting y piden aprobación al cambiar. |
| **Otros clientes MCP genéricos** (Cursor, Windsurf, VS Code Copilot, Goose) | Config JSON global del cliente (`mcp.json` / `mcpServers`). | Reglas propias del IDE (`.cursor/rules`, `.github/copilot-instructions.md`). | Soporte variable para `.agents/skills/`. | **Sin estándar MCP para hooks.** Solo cuentan con `InitializeResult.instructions` ([MCP Schema](https://modelcontextprotocol.io/specification/2025-11-25/schema)) y descripciones de tools. | **No existe garantía determinista** a nivel protocolo MCP puro; solo persuasión suave vía descripciones, `instructions` concisas y `prompts`/`resources`. |

#### 2. Distinción: mecanismos realmente compatibles vs. propuestas teóricas

* **Verificados y ejecutables hoy:** (a) Registro único del servidor MCP en configuración global de usuario + paquete de **Skill global** (`qap-qa-router/SKILL.md`) en `~/.gemini/config/skills/`, `~/.claude/skills/` y `.agents/skills/`; (b) **Hooks `SessionStart` + `UserPromptSubmit`/`BeforeAgent**` que detectan si el workspace actual ya tiene identidad QAP (`.qa/` o registro en índice global de QAP) e inyectan un resumen compacto de 5–8 líneas con `project_id`, última campaña, estado y regla *"usa `qap_start`/`qap_status` antes de tocar terminal"*; (c) **Hooks `PreToolUse`/`BeforeTool**` en Claude Code, Codex, Antigravity y Gemini CLI que inspeccionan comandos de shell (`Bash`/`run_command`) para bloquear rutas improvisadas de E2E; (d) **Plugin/Extension empaquetada** (Claude Plugin, Codex Plugin, Antigravity Plugin, Gemini Extension) que instala MCP + Skill + Hooks en un solo paso.
* **Propuestas teóricas o no portables (no depender de ellas como única garantía):** confiar en `InitializeResult.instructions` de 14 párrafos (muchos hosts la truncan o le dan baja prioridad); asumir que todos los hosts soportan `roots/list` o `elicitation/create`; asumir que existe un estándar universal de hooks en MCP (no existe en la especificación MCP 2025-11-25).

#### 3. Registro único global y recuperación automática de contexto

* **Registro global único:** instalar QAP como binario global o `npx`-invocable registrado una sola vez por host (`qap host-install --host auto|claude|codex|antigravity|gemini`), que configura: (1) la entrada MCP global apuntando al runtime de QAP, (2) el **Skill delgado** `qap-qa` (siguiendo el patrón de `agent-browser`: stub mínimo que consulta el estado real sin inflar contexto), y (3) los hooks globales opcionales (previa autorización explícita del usuario).
* **Recuperación automática de Knowledge, campañas, permisos y escenarios:**
* Añadir un endpoint ligero y rápido (`qap context --brief --cwd <dir>` en CLI y recurso MCP `qap://workspace/brief` + tool `qap_resume_context`) que devuelva en <150 tokens: `project_id`, `workspace_authorized`, entornos/perfiles con sesión vigente, estado de cobertura (`READY`/`PARTIAL_READY`), campaña activa o última ejecución, brechas abiertas y próxima acción determinista.
* El hook `SessionStart` (o el primer turno de `qap_start` cuando no hay hooks) inyecta este *brief* compacto, eliminando que el agente "olvide" campañas previas o vuelva a hacer onboarding.



#### 4. Interpretación de lenguaje natural → operaciones reales de QAP

* Exponer una **fachada de entrada orientada a intención** (`qap_intent` o evolución de `qap_start`) con descripciones de tool diseñadas específicamente para *tool-routing* (palabras clave claras: *"Use ALWAYS for E2E, functional, UI, API, regression, exploratory, or QA testing requests like 'test this app', 'continue testing', 'run E2E'"*).
* La fachada acepta la intención en lenguaje natural + `targetPath` y devuelve un **plan operativo estructurado** (o dispara el orquestador soberano):
* *"Prueba este sistema"* → verifica workspace/permisos → Discovery incremental → diseño de casos → ejecución determinista → reporte.
* *"Continúa las pruebas"* → lee checkpoint/cola durable de la campaña activa y reanuda sin repetir onboarding.
* *"Ejecuta el flujo E2E de crédito con rol analista y aprobador"* → resuelve `FlowDefinition` + perfiles autorizados + `DataPlan` y ejecuta el DAG.



#### 5. Bloqueo de rutas improvisadas sin romper pruebas unitarias

* El hook `PreToolUse` / `BeforeTool` en `Bash`/`PowerShell`/`run_command` aplica una **política diferenciada por intención del comando**:
* **Permitido sin fricción:** runners unitarios/integración locales del propio repo (`vitest`, `jest`, `pytest`, `go test`, `cargo test`, `mvn test`, `dotnet test`, `pnpm test`) cuando no invocan automatización de navegador improvisada ni scripts temporales de QA.
* **Bloqueado con redirección explícita (exit code 2 / `decision: "deny"`):** ejecución de scripts ad-hoc de navegador/E2E fuera de QAP (p. ej. `python -c "...playwright..."`, `python -c "...selenium..."`, `node -e "...chromium.launch..."`, `npx playwright test` cuando no es una suite solicitada explícitamente por el usuario, o `curl` masivo de pruebas E2E sobre el AUT mientras exista una sesión QAP activa). El mensaje de rechazo instruye al agente a invocar `qap_start`/`qap_test` y respeta una bandera de escape explícita solo si el usuario ordenó textualmente ejecutar pruebas unitarias o un script puntual fuera de QAP.
* **Invariante en QAP:** como ya exige `QAP-VISION-AUTONOMIA.md`, ningún `PASS` oficial de QAP puede registrarse sin intento del runner canónico y digest verificado.



#### 6. Pruebas de aceptación en sesiones limpias multi-host

* Suite automatizada de **evaluación conductual en frío** (*cold-start harness*) ejecutada en sesiones nuevas sin historial en Claude Code, Codex CLI, Antigravity CLI/IDE y Gemini CLI sobre un fixture con y sin `.qa/` previo:
* **A1 (Descubrimiento en frío):** prompt *"prueba este sistema"* → primer tool call de QA debe ser `qap_start`/`qap_status` (0 scripts Python/Playwright creados).
* **A2 (Continuidad):** nueva conversación en proyecto con campaña pausada, prompt *"continúa las pruebas"* → recupera `project_id`, campaña y Knowledge previo sin re-preguntar URL ni repetir onboarding.
* **A3 (Frontera unitaria vs. E2E):** prompt *"corre los tests unitarios con vitest"* → el hook permite `vitest` sin falsos positivos; prompt *"haz un E2E del login"* → enruta a QAP y bloquea scripts improvisados.
* **A4 (Multi-proyecto):** cambiar de proyecto A → B → A con el mismo registro MCP global sin editar archivos de configuración del cliente.



---

### D. Estrategia de onboarding autónomo y optimización (Investigaciones 3 y 4)

#### 1. Onboarding verdaderamente autónomo multiplataforma (Windows, macOS, Linux)

El onboarding debe reemplazar `playwright-detector.ts` (que mira el `package.json` del AUT) por un motor propio de diagnóstico y provisión (`qap doctor` / `qap setup`) con los siguientes requisitos:

* **Detección completa de entorno (read-only, sin privilegios):**
* Verificar versión de Node.js (exigir compatibilidad real con `node:sqlite` en Node 22+ o el driver ratificado en `DP-07`, corrigiendo la contradicción actual de `AGENTS.md` que menciona Node 18/20), arquitectura (`x64`/`arm64`), sistema operativo y permisos de escritura en directorios de datos (`%LOCALAPPDATA%\qap` en Windows, `~/Library/Application Support/qap` en macOS, `$XDG_DATA_HOME/qap` o `~/.local/share/qap` en Linux).
* Verificar caché de navegadores Playwright en la ruta canónica de QAP (`PLAYWRIGHT_BROWSERS_PATH` dedicado o compartido controlado por QAP, evitando colisiones con proyectos del usuario; [Playwright Browsers](https://playwright.dev/docs/browsers)), existencia de binarios ejecutables reales y disponibilidad de navegadores del sistema (`chrome`, `msedge`) como respaldo de diagnóstico (nunca reusando el perfil personal del usuario).
* En Linux, detectar librerías compartidas faltantes (`ldd` sobre el binario de Chromium o comprobación seca) y presencia de servidor gráfico (`DISPLAY`/`WAYLAND_DISPLAY`) para saber si el modo `headed` es viable.


* **Instalación y aprovisionamiento autónomo bajo demanda:**
* **Sin privilegios elevados (automático tras consentimiento inicial):** descargar únicamente `chromium` (y `--only-shell` si el entorno es CI/headless puro, ahorrando descarga y disco; [Playwright Browsers](https://playwright.dev/docs/browsers)) mediante `playwright-core` CLI interno en un directorio gestionado por QAP (`~/.qap/browsers` o `PLAYWRIGHT_BROWSERS_PATH`), soportando proxies corporativos (`HTTPS_PROXY`, `NODE_EXTRA_CA_CERTS`, `PLAYWRIGHT_DOWNLOAD_HOST`).
* **Acciones privilegiadas (autorización explícita, sin eludir controles del SO):** instalación de dependencias de sistema en Linux (`sudo npx playwright install-deps chromium`), modificación de políticas gestionadas o instalación de certificados raíz **nunca** se ejecutan silenciosamente ni intentan escalar privilegios; QAP genera el comando exacto verificado, explica por qué se requiere y espera confirmación/ejecución del operador.
* **Distribución empaquetada:** alinear todas las dependencias de `playwright-core` a una única versión en el monorepo, empaquetar assets locales del reporte (CSS/JS/fuentes sin CDN) y exponer `npx @hyouka73/qap-cli setup` + `qap doctor --json` para que cualquier agente IA pueda auto-reparar instalaciones incompletas en un solo comando idempotente.
* **Auto-verificación post-instalación:** lanzar un `BrowserContext` aislado contra un servidor loopback `127.0.0.1` efímero que valide navegación, captura PNG, grabación WebM y cierre limpio antes de declarar `ENV_READY`.



#### 2. Optimización, memoria, procesos y estabilidad (Investigación 4)

Para eliminar los cuellos de botella observados en `fb4d1852` y en la auditoría E01-R5 (CPU 100 %, RAM libre 107 MB, *event-loop lag* 2231 ms, `browser.close` de 7.4 s) **sin sacrificar seguridad ni aislamiento**:

* **Pool de navegadores con aislamiento estricto por `BrowserContext`:**
* Reemplazar el modelo actual (1 browser por adquisición en `crawler/browser.ts` y 1 solo `BrowserContext` compartido para todo el plan en `runner.ts`) por un **`BrowserPoolManager`** acotado dentro del ejecutor soberano.
* **Regla de seguridad innegociable:** un proceso `Browser` solo puede reutilizarse entre casos que compartan exactamente la misma política de red/proxy de lanzamiento y modo (headless/headed); **cada caso de prueba recibe un `BrowserContext` nuevo y limpio** (cookies, `localStorage`, IndexedDB, caché y Service Workers bloqueados o aislados), cerrando el contexto al terminar el caso.
* **Reciclaje preventivo de procesos:** reciclar cada instancia `Browser` del pool tras $N$ contextos ejecutados (p. ej. 20–50, calibrado por benchmark) o al superar un umbral de RSS (p. ej. >1.2 GB por proceso Chromium) para neutralizar fugas nativas de Blink/V8 en ejecuciones largas.


* **Concurrencia adaptativa:**
* Calcular el límite dinámico de workers en función de RAM disponible real y carga de CPU (no un número fijo), reduciendo concurrencia automáticamente (*backpressure*) si la RAM libre cae bajo umbral de seguridad o el *event-loop lag* supera el presupuesto, y serializando pasos pesados (grabación WebM de alta resolución o trazas masivas) si el host tiene recursos limitados.


* **Detección de fugas, procesos huérfanos y recuperación tras crash:**
* Corregir `session-resolver.ts:44-45` con `try/finally` garantizado para cerrar `browser` si `newContext()` falla.
* Etiquetar cada proceso lanzado con un **registro de PIDs activos + `run_id`/`epoch**` persistido en SQLite. En Windows asociar workers/navegadores a un **Job Object** con `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE` (separado del Job Object del host Stdio, conforme a `plan-maestro.md`), y en macOS/Linux a un **process group** (`detached: true`, `process.kill(-pgid)`), permitiendo limpieza determinista de árboles huérfanos al cerrar o al recuperar tras muerte abrupta.
* Watchdog de cierre: si `browser.close()` excede un timeout acotado (p. ej. 5 s), escalar a terminación controlada del árbol de procesos (`SIGTERM` → `SIGKILL` / `taskkill /T /F`) y auditar el evento.


* **Gestión de colas, sesiones, cachés, artefactos y Knowledge acotado:**
* Unificar `qap_prune` (corrigiendo el `dryRun` ficticio y cierre de handle en `server.ts:4303-4350`) con políticas TTL y cuota máxima en disco por proyecto (p. ej., retener `trace.zip` y WebM solo para `FAIL`/`ERROR`/`INDETERMINATE` y los últimos $K$ `PASS`, manteniendo siempre evidencias fijadas/referenciadas por defectos abiertos).
* **Knowledge persistente sin crecimiento ilimitado:** separar *conocimiento canónico vigente* (tablas compactas versionadas) de *evidencia histórica y telemetría* (particionada/podable con resúmenes agregados de latencia y flakiness). Ejecutar `PRAGMA incremental_vacuum` / `wal_checkpoint(TRUNCATE)` en mantenimiento programado.
* **Compactación de contexto para reducir tokens:** nunca enviar HTML crudo ni árboles de accesibilidad completos al LLM del host. Implementar un **serializador de vista compacta** (elementos interactivos + estructura de tabla/formulario + diffs respecto a la revisión previa, con límite estricto de tokens) y recuperación paginada por FTS5 (`qap_search`) para que el agente reciba solo el subconjunto relevante al objetivo.
* **Ejecución determinista sin IA por paso:** mantener 100 % de la ejecución de casos congelados en `playwright-core` puro; invocar razonamiento IA únicamente en (a) descubrimiento inicial/drift de vista, (b) diseño de nuevos casos, y (c) diagnóstico/propuesta de nueva revisión `N+1` tras fallo.



---

### E. Nuevos requisitos funcionales y técnicos (incluyendo Investigación 5)

La tabla siguiente incorpora las necesidades detectadas en las Investigaciones 1–5 y distingue explícitamente cuáles son **nuevos** frente a los 82 requisitos actuales (`REQ-MEM/DIS/DOC/IA/PLN/CAS/ORA/RUN/DAT/CAM/REP/REG/SEG/INT`) y compuertas E1–E8 de `docs/qap-architecture/plan-maestro.md`.

| ID propuesto | Tipo | Prioridad | Descripción | Criterio verificable | Relación con requisitos actuales |
| --- | --- | --- | --- | --- | --- |
| **REQ-AGT-001** | Nuevo | **P0** | Paquete de integración multi-host (`qap host-install`): registro MCP global único + Agent Skill delgado (`SKILL.md`) + hooks opt-in (`SessionStart`, `UserPromptSubmit`/`BeforeAgent`, `PreToolUse`/`BeforeTool`) para Claude Code, Codex, Antigravity y Gemini CLI. | En 4 hosts limpios, un prompt en lenguaje natural (*"prueba este sistema"*) invoca QAP en el primer turno en ≥95 % de corridas y bloquea scripts E2E improvisados sin bloquear `vitest`/`pytest`. | Nuevo (cubre brecha operativa fuera de `REQ-INT-001.1/1.2`). |
| **REQ-AGT-002** | Nuevo | **P0** | Servicio de *Context Brief* compacto (`qap://workspace/brief` + `qap context --brief`) para re-hidratar Knowledge, campañas, permisos y escenarios en <200 tokens al iniciar o cambiar de conversación/host. | Nueva sesión en proyecto existente recupera `project_id`, cobertura y cola pendiente en 1 llamada sin repetir onboarding. | Amplía `REQ-MEM-002.4` y `REQ-IA-001.1`. |
| **REQ-ONB-001** | Nuevo | **P0** | Motor de onboarding autónomo y diagnóstico (`qap doctor` / `qap setup`) multiplataforma (Win/Mac/Linux) desacoplado del `package.json` del AUT, con caché gestionada (`PLAYWRIGHT_BROWSERS_PATH`), soporte proxy/CA y autoverificación en loopback. | En máquina limpia (Win/Mac/Linux), `qap setup` instala/verifica runtime y supera prueba PNG+WebM local sin intervención manual; acciones privilegiadas (`install-deps`) piden autorización explícita. | Reemplaza `playwright-detector.ts` y amplía `REQ-INT-001.2`. |
| **REQ-OPT-001** | Nuevo | **P0** | `BrowserPoolManager` con reutilización segura de procesos por política de red, `BrowserContext` limpio obligatorio por caso, reciclaje por umbral de RSS/contextos, concurrencia adaptativa (*backpressure*) y limpieza de árboles de procesos (Job Objects / process groups). | 0 fugas de procesos Chromium tras abortos/crashes inyectados; aislamiento verificado de cookies/storage entre casos; RAM acotada en corrida de 100+ casos. | Amplía `REQ-RUN-001.1` y `REQ-RUN-001.5`; corrige R7-03/R7-06. |
| **REQ-OPT-002** | Nuevo | **P1** | Compactación de Knowledge, poda unificada con `dryRun` real y serialización compacta de vistas SPA (árbol de accesibilidad + diffs) con presupuesto máximo de tokens. | `qap_prune --dry-run` reporta bytes exactos y cierra handles; tamaño de DB y payloads al LLM acotados tras 10 campañas consecutivas. | Amplía `REQ-MEM-003.5` y `REQ-DIS-001.3`. |
| **REQ-E2E-001** | Amplía existente | **P0** | Ejecución de flujos E2E completos **multirol y multimódulo** en una sola unidad lógica transaccional (DAG real respetando `depends_on`, cambio de identidad con `BrowserContext` separado por rol, transferencia tipada de variables entre pasos y reporte unificado). | Flujo de 3+ módulos y 2+ roles (p. ej. solicitud → aprobación → verificación) se ejecuta de punta a punta con contextos aislados por rol y trazabilidad única. | Reemplaza `FlowOrchestrator` roto (`REQ-PLN-001.4`, `REQ-RUN-001.1`). |
| **REQ-UTCP-001** | Nuevo | **P1** | Adaptador de provisión y consulta de datos vía **UTCP** ([utcp-specification](https://github.com/universal-tool-calling-protocol/utcp-specification)) y OpenAPI/HTTP directo para crear clientes, contratos, solicitudes y fixtures sintéticos sin servidores proxy extra, gobernado por el motor de políticas y bóveda de QAP. | Un `DataPlan` ejecuta preparación/limpieza vía manual UTCP u OpenAPI en staging autorizado con claves de idempotencia y 0 credenciales en prompts/logs. | Nuevo; operacionaliza `REQ-DAT-001.1/1.2` y `REQ-INT-001.4`. |
| **REQ-XINST-001** | Nuevo | **P1** | Conector de **lectura cross-instancia estrictamente read-only** para leer configuraciones, catálogos o condiciones desde otra instancia autorizada (p. ej. referencia/pre-prod) impidiendo físicamente toda mutación sobre esa instancia. | Política de red/protocolo rechaza cualquier verbo no seguro o mutación GET/POST hacia instancias marcadas `read_only_reference`, con prueba adversarial de bloqueo. | Nuevo; complementa `REQ-SEG-001.1/1.2` y `REQ-MEM-002.1`. |
| **REQ-QA-001** | Nuevo | **P1** | Pruebas de **internacionalización (i18n), localización y documentos**: cambio de idioma/locale (`locale`, `--accept-lang`), detección de claves sin traducir/texto truncado, formato de fechas, zonas horarias, monedas (aritmética decimal exacta) y validación de documentos generados (PDF/CSV/XLSX descargados). | Fixture multi-idioma verifica cambio de locale, formato monetario/fecha con precisión decimal y contenido de PDF/CSV descargado sin falsos PASS. | Amplía `REQ-ORA-001.4` (cálculos) y añade i18n/documentos. |
| **REQ-QA-002** | Nuevo | **P1** | Capacidades avanzadas modulares opt-in sin complejidad innecesaria: (a) **Accesibilidad WCAG** vía `@axe-core/playwright` ([Playwright a11y](https://playwright.dev/docs/accessibility-testing)) con fingerprinting de violaciones; (b) **Pruebas de contrato API** (validación de esquemas OpenAPI/JSON Schema sobre tráfico real y llamadas directas); (c) **Chequeos básicos de seguridad web** (cabeceras, CORS, RBAC/IDOR no destructivos) y **presupuestos de rendimiento** (Web Vitals/TTFB/LCP vía CDP). | Cada capacidad se activa por política de campaña, emite veredictos en la taxonomía única de 6 estados y se integra al reporte HTML portable sin añadir runtimes externos. | Nuevo; extiende cobertura funcional de `REQ-CAS-001.2` y `REQ-REP-001.2`. |

**Capacidades adicionales de alto valor y bajo costo operativo (recomendadas para P1/P2):**

* **Captura de `HAR` sanitizado + exportación a código Playwright reproducible:** permitir exportar un defecto reproducido como spec `.spec.ts` mínimo y trazable para que el desarrollador depure en su IDE sin depender de QAP.
* **Visual regression selectiva por componente/estado crítico** (tolerancia configurable sobre capturas sanitizadas) ya prevista en M5 para el visor, reutilizable como oráculo opt-in para variantes visuales (`visual_variant`).
* **A descartar por complejidad innecesaria en esta etapa:** pruebas de carga masiva distribuida (mejor delegar a k6/Locust), pentesting invasivo/destructivo, y automatización nativa de escritorio/móvil fuera de web/API.

---

### F. Experimentos y benchmarks necesarios (sin especular)

Antes de cerrar decisiones técnicas en G0 o modificar arquitectura, se requieren **6 experimentos reproducibles** sobre un mismo conjunto de fixtures (SPA multirol con autenticación, tablas paginadas, iframes, cambio de idioma y mutaciones con persistencia real), ejecutados en hardware con CPU/RAM reservados (cumpliendo R7-01):

1. **EXP-01 · Adopción multi-host en sesiones limpias (Área 1):**
* *Escenario:* 20 prompts naturales (10 de QA/E2E, 5 de continuación, 5 de pruebas unitarias) en sesiones completamente nuevas en Claude Code, Codex CLI, Antigravity y Gemini CLI, comparando **(a) solo MCP + `instructions` actuales**, **(b) MCP + Skill `SKILL.md**`, y **(c) MCP + Skill + Hooks `SessionStart`/`PreToolUse**`.
* *Métricas:* tasa de enrutamiento correcto a QAP, tasa de bypass improvisado (scripts externos), tasa de falsos bloqueos sobre pruebas unitarias y tokens consumidos en el primer turno.


2. **EXP-02 · Extractor Discovery: DOM actual vs. Accessibility Snapshot CDP vs. `agent-browser` (Área 2):**
* *Escenario:* 3 aplicaciones SPA de referencia (con tablas, modales, pestañas sin cambio de URL y al menos 1 iframe).
* *Métricas:* % de controles interactivos y estados descubiertos contra inventario de referencia, latencia por vista (p50/p95), tamaño del payload en tokens y tasa de selectores rotos al reproducir en `playwright-core`.


3. **EXP-03 · Pool de navegadores vs. lanzamiento por caso vs. contexto único (Área 4):**
* *Escenario:* suite de 60 casos mixtos (lectura + mutación con recarga N2 + video WebM) en Windows, macOS y Linux con concurrencia 1, 2 y 4 workers.
* *Métricas:* duración total (p50/p95), pico de RSS total y por proceso, CPU %, *event-loop lag* (p95/max), tiempo de `browser.close`, procesos Chromium residuales tras `SIGINT`/`SIGKILL`, y prueba negativa de fuga de cookies/storage entre casos.


4. **EXP-04 · Onboarding autónomo en entornos limpios (Área 3):**
* *Escenario:* máquinas/contenedores limpios en Windows 11, macOS (ARM64) y Linux (Ubuntu LTS sin GUI y con proxy HTTPS).
* *Métricas:* tiempo hasta `ENV_READY`, tamaño en disco (`chromium` completo vs. `--only-shell`), tasa de éxito sin intervención manual y comportamiento correcto ante falta de permisos elevados.


5. **EXP-05 · UTCP + OpenAPI para `DataPlan` y aislamiento read-only cross-instancia (Área 5):**
* *Escenario:* creación de cadena `cliente → contrato → solicitud` vía UTCP/OpenAPI + verificación de lectura contra instancia secundaria read-only con inyección adversarial de `POST`/`PUT`/`DELETE` y redirección 302 hacia destino no autorizado.
* *Métricas:* latencia de preparación de datos vs. preparación por UI, idempotencia ante corte de red y 0 mutaciones filtradas a la instancia read-only.


6. **EXP-06 · Impacto de capacidades avanzadas (a11y + Web Vitals + i18n + video WebM protegido) (Áreas 4 y 5):**
* *Escenario:* activar `@axe-core/playwright`, recolección de Web Vitals y grabación WebM con protección preventiva (`addInitScript` + CSS) sobre el mismo flujo E2E.
* *Métricas:* sobrecarga de tiempo y RAM por caso, validez de decodificación WebM en reporte `file://` trasladado y 0 canarios sensibles visibles desde el primer cuadro.



---

### G. Conclusión y decisiones para aprobación del propietario

#### Qué conviene conservar

* **`playwright-core`** como motor único determinista de ejecución, aislamiento por `BrowserContext`, intercepción de red, `trace.zip` y grabación WebM.
* **La arquitectura hexagonal del plan maestro (`docs/qap-architecture/plan-maestro.md`)**: autoridad única, adaptadores delgados MCP/CLI, ejecutor soberano desacoplado del host Stdio, planos epistémicos y oráculos N1–N3 con procedencia.
* **Piezas reutilizables en `fb4d1852**`: `provisional-execution.ts`, `ToolDispatcher`, `PortableCredentialVault`, `ScopedRuleResolver` (como base conceptual) y la infraestructura de evidencias/compuertas E1–E8.

#### Qué conviene incorporar (sujeto a aprobación y validación en EXP-01–EXP-06)

* **Integración multi-host en capas (`REQ-AGT-001/002`)**: registro MCP global único + Agent Skill delgado (`SKILL.md`) + hooks deterministas (`SessionStart`, `PreToolUse`/`BeforeTool`) por host + *Context Brief* compacto.
* **Capa híbrida ligera sobre CDP dentro de `playwright-core**`: snapshots de accesibilidad compactos con referencias cortas para Discovery y métricas de rendimiento, sin introducir otro motor ni LLM por paso.
* **Onboarding autónomo multiplataforma (`REQ-ONB-001`)**: `qap setup` / `qap doctor` con caché propia (`PLAYWRIGHT_BROWSERS_PATH`) y verificación en loopback.
* **`BrowserPoolManager` + concurrencia adaptativa + Job Objects/process groups (`REQ-OPT-001/002`)**: reutilización segura de procesos con `BrowserContext` limpio por caso y poda real unificada.
* **Flujos E2E multirol/multimódulo, UTCP para `DataPlan`, conectores read-only cross-instancia, i18n/documentos y `@axe-core/playwright` (`REQ-E2E-001`, `REQ-UTCP-001`, `REQ-XINST-001`, `REQ-QA-001/002`)**.

#### Qué conviene descartar

* **Dependencia `@playwright/mcp**` en `packages/playwright-adapter/package.json` (sin uso e incompatible con ejecución determinista y límites de seguridad).
* **Sustituir Playwright por Browser Use, Stagehand, Skyvern, Selenium/BiDi o CDP crudo propio** como motor principal de QAP.
* **Mantener `playwright-detector.ts` leyendo el `package.json` del AUT** y mantener diálogos exclusivos de Windows PowerShell en la ruta ordinaria.
* **Pruebas de carga masiva, pentesting destructivo o automatización móvil/desktop** fuera del alcance web/API actual.

#### Decisiones que requieren aprobación explícita del propietario

Además de las decisiones ya listadas en `plan-maestro.md` (`DP-01` a `DP-10`), se someten a ratificación **5 nuevas decisiones**:

1. **DP-11 · Política de hooks en hosts del usuario:** autorizar que `qap host-install` ofrezca instalar hooks globales (`PreToolUse`/`BeforeTool`) para bloquear scripts E2E improvisados (con exclusión explícita para pruebas unitarias y consentimiento del usuario por host).
2. **DP-12 · Alcance de navegadores y modo por defecto:** ratificar Chromium (`playwright-core`, usando `--only-shell` en headless puro y Chromium completo cuando se requiera `headed`/video) como motor obligatorio P0, difiriendo Firefox/WebKit a opt-in.
3. **DP-13 · Adopción de UTCP vs. OpenAPI directo en `DataPlan`:** aprobar si el adaptador de provisión de datos implementa primero OpenAPI/HTTP nativo con interfaz compatible con UTCP ([typescript-utcp](https://github.com/universal-tool-calling-protocol/typescript-utcp)), o si incorpora el cliente UTCP completo desde P1.
4. **DP-14 · Gobernanza de instancias read-only cross-instancia:** aprobar el contrato de política de red y credenciales de solo lectura para consultar entornos de referencia sin riesgo de mutación.
5. **DP-15 · Aprobación de experimentos EXP-01–EXP-06 antes de congelar la actualización del plan maestro:** confirmar si estos experimentos se ejecutan como compuerta previa a cerrar la versión actualizada de requisitos y antes de iniciar G0/G1.
