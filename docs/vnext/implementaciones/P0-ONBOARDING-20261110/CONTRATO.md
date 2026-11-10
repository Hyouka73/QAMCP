# P0 — Onboarding autónomo desde carpeta vacía

Baseline: `d3190dfc5edaac7f3f8ad7b35d9d9799150b9a69`. Rama: `feat/qap-vnext-architecture`.

## Contrato

`qap_status` es el punto de entrada ante «Quiero probar un sistema». El prompt `qap_start` sigue disponible como alias opcional; no se agrega una herramienta MCP de inicialización duplicada. El catálogo y las instrucciones del servidor explican el inicio natural.

Sin manifiesto explícito, el host instala `WorkspaceBootstrap`. Antes de cualquier llamada, se consultan las raíces MCP si el cliente anuncia esa capacidad. Se aceptan únicamente directorios locales canónicos, sin enlaces. `targetPath` selecciona dentro de esa autorización: no la concede. Con una sola raíz se puede omitir; con varias es necesaria una selección explícita. Si el cliente no ofrece raíces, se utiliza exclusivamente un registro local del operador. El cwd del proceso no autoriza un proyecto en este modo.

`qap_status` ahora puede escribir el scaffold local autorizado y abrir Knowledge v2. No es una operación exclusivamente de lectura. Crea `.qa/project/{context.yaml,environments.yaml,lifecycle.json}`, directorios legacy compatibles y `.qa/.gitignore`; conserva archivos existentes mediante creación exclusiva. El host guarda Knowledge fuera del proyecto: `${QAP_MCP_WORKSPACE_HOST_DIR:-~/.qap/workspaces}/<sha256-raíz>/knowledge.sqlite`. No almacena secretos ni crea gateways de aprobación. Las bases, identidades y permisos se separan por raíz.

Antes de conocer la aplicación existe Knowledge físico, pero no se inventan entidades application/environment ni módulos. El estado público es `knowledge.state=prepared`, `context_present=false`. Tras `qap_context_set(base_url=...)` se registran application/environment con trazabilidad no revisada, dominio seguro vacío y acciones destructivas deshabilitadas. El nombre de carpeta es solo una etiqueta técnica. Las identidades deterministas identifican el workspace, no roles, tenants o módulos de negocio.

Una carpeta vacía devuelve exactamente una pregunta abierta:

> ¿Dónde está el sistema que quieres probar? Puedes proporcionarme su URL o indicarme un proyecto local

La respuesta URL se registra con `qap_context_set`; un proyecto local se resuelve con `qap_status` sobre su raíz autorizada. No se interpreta una ruta local como URL. El estado se recupera desde Knowledge y los archivos existentes al reconectar. Una interrupción entre el registro canónico de la URL y la publicación legacy se resuelve indicando una continuación con la URL ya persistida, sin volver a preguntarla.

Los documentos Markdown existentes se detectan antes de preguntar por su contenido; se recomienda lectura e ingesta como propuestas con evidencia. Registrar la URL no concede permiso para visitarla. Sin documentación, el onboarding recomienda primero investigación provisional; ONBOARDING y SCOPING permiten descubrimiento sin módulos únicamente en modo provisional, con el nombre técnico `inventario-provisional`, sin vinculación canónica ficticia. Persisten las observaciones con la autorización GET/IP del host; no se crean módulos confirmados ni se acreditan requisitos. La compuerta de fase se conserva para los proyectos provisionados con módulos.

## Autorización y reconexión

Los resultados separan información faltante (`onboarding.category=missing_information`, no terminal), trabajo local seguro (`tipo=trabajo`), autorización humana (`category=human_authorization`) y fallos técnicos (`category=technical_error`, código fijo). Una autorización pendiente no se convierte en una excepción interna ni se interpreta como un permiso concedido.

Si el cliente carece de raíces, QAP devuelve una acción concreta del operador local con las rutas absolutas de Node y del script:

```text
node <instalación>/scripts/qap-authorize-workspace.mjs <workspace-absoluto>
```

Este comando local registra únicamente autorización para preparar esa carpeta. No se expone como herramienta MCP y no recibe una supuesta aprobación administrativa desde argumentos MCP. Tras ejecutarlo, se reconecta el servidor y se reintenta `qap_status`; la prueba Stdio verifica esa ruta. No hay ampliación a otras carpetas ni recompilación por proyecto.

Para acceso a la aplicación, el operador mantiene el mecanismo existente `qap-provision-host.mjs <settings.json> <directorio-privado>`. Ahora admite `modules: []` y omitir políticas de navegación y ejecución. Una `discoveryAuthorization` debe declarar explícitamente URLs e IP/red; una `testAuthorization` sigue siendo independiente. El script no sobrescribe host existente y genera claves aleatorias; su `client-config.json` contiene secretos y debe permanecer privado. Aplicar esa configuración al cliente y reconectar es una acción administrativa explícita. No se genera autorización administrativa desde una pregunta respondida al agente.

Los manifiestos existentes siguen usando la composición existente y su preflight v2. No se migran automáticamente stores legacy/v1 de un manifiesto. Bindings y revisiones explícitos, políticas de navegación/ejecución y revisión humana independiente conservan sus compuertas. En modo autónomo `qap_auth_add` no inicia login sin preparación explícita del host. No hay instalación automática de Chromium en la orientación del onboarding autónomo.

## Límite del cliente Codex

La [documentación oficial de MCP en Codex](https://developers.openai.com/codex/mcp/) describe `cwd` como directorio del proceso, no como una autorización de escritura para cualquier `targetPath`. El registro local inspeccionado de `qap-vnext` usa Stdio y una ruta absoluta al servidor, sin cwd fijado. Eso no demuestra que el cliente entregue raíces MCP.

Las pruebas sintéticas de protocolo verifican tanto cliente con raíces como cliente sin raíces. No sustituyen T09 en Codex real desde una conversación nueva con carpeta vacía. Si ese cliente no transmite raíces, la preparación local del operador es necesaria y el requisito «cero configuración técnica manual» no queda cumplido. No se infiere una raíz desde sesiones, historial, archivos de estado de Codex o rutas enviadas por el agente.

Tampoco se ha construido un canal transparente de reconexión del cliente ni una UI de consentimiento administrativo. La reconexión local explícita es verificable; la experiencia completa en Codex requiere validación real. No se realizó aceptación humana ni se creó una carpeta de aceptación del usuario.
