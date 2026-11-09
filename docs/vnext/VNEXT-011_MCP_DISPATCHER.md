# VNEXT-011 — Arquitectura de handlers declarativos MCP

Fecha: 2026-10-30. **Completada con limitaciones**, agente principal único.
Base: `7271c6932cdb13fef339a8e70774ba6a0a1fc55c`.
Rama exclusiva: `feat/qap-vnext-architecture`.

## Problema y alcance

`server.ts` concentraba el catálogo `TOOLS`, los callbacks MCP y 18 implementaciones
en un switch, con nueve reglas ESLint desactivadas para todo el archivo. Se añade
infraestructura de registro y despacho explícitos, conectada al mismo servidor.
No se migra ninguna implementación ni se conectan servicios VNEXT-006 a VNEXT-010.
VNEXT-012 a VNEXT-014 y Advisor quedan sin iniciar.

## Contrato y API

`packages/mcp/src/dispatcher.ts`, reexportado por `src/index.ts`, contiene:

- `IMcpToolHandler`: `definition` de tipo oficial `Tool`, con descripción obligatoria;
  `execute(args: unknown, context): CallToolResult | Promise<CallToolResult>`;
  y `validateArguments?(args: unknown): boolean`.
- `McpInvocationContext`: `requestId` de tipo oficial `RequestId` y `signal: AbortSignal`.
  El contexto no transforma `targetPath` ni proporciona servicios globales. Los futuros
  handlers pueden recibir dependencias en su constructor sin importar `server.ts`.
- `McpToolError`: códigos públicos cerrados; su mensaje mutable o stack no se devuelven.
- `ToolDispatcher(reservedNames?)`: `register(handler)`, `seal()`, `has(name)`,
  `listTools()` y `dispatch(params: unknown, context)`.

Ejemplo para un consumidor futuro; no agrega una herramienta de producción:

```ts
const dispatcher = new ToolDispatcher(legacyNames);
dispatcher.register(handler);
dispatcher.seal();
const result = await dispatcher.dispatch(request.params, {
  requestId: extra.requestId,
  signal: extra.signal,
});
```

## Registro y nombres

Se usa un Map privado por instancia; el orden de inserción define el catálogo.
Nombres exactos y sensibles a mayúsculas, de 1 a 128 caracteres ASCII, patrón
`[A-Za-z0-9_.-]`. Se rechazan nombres vacíos, rutas, espacios, duplicados y reservados.
`ToolSchema` del SDK verifica la estructura de metadatos; se exige descripción no
vacía, función execute y, si existe, función validateArguments. No se certifica la
validez semántica de cualquier JSON Schema arbitrario.

Se clonan las definiciones y se capturan los callbacks al registrar. `listTools`
devuelve copias. Una falla de registro previo al sellado invalida la instancia:
no puede sellarse ni ejecutar el registro parcial. No se puede despachar antes de
`seal()`. Un intento posterior de registro lanza una excepción sin modificar un
registro ya válido, incluso durante una invocación. No hay descubrimiento de
directorios, importaciones por nombre, contenedor DI ni registro global.

## Integración con MCP y convivencia legacy

`createMcpServer(options: McpServerOptions = {})` conserva el uso sin argumentos y
el retorno `Server`. `handlers?: readonly IMcpToolHandler[]` permite inyección
explícita y opcional. Cada servidor construye y sella su dispatcher antes de
registrar callbacks. Todos los nombres de `TOOLS` quedan reservados.

`tools/list` devuelve primero el mismo catálogo legacy, luego los handlers
explícitos. Producción no inyecta ninguno: conserva exactamente 18 herramientas.
`tools/call` encamina los nombres declarativos al dispatcher antes de resolver
rutas o entrar al switch. Los demás pasan por la implementación original, incluido
su error para nombres desconocidos. No hay sobrescritura ni doble ejecución.

La migración futura debe retirar explícitamente el propietario legacy de un nombre
antes de registrarlo de forma declarativa. No se añade ahora un mecanismo de
reemplazo o shadowing. Ningún handler importa el servidor para utilizar el contrato.

Se usan `Tool`, `RequestId`, `CallToolResult`, `ToolSchema`, `CallToolRequestSchema`
y `CallToolResultSchema` de `@modelcontextprotocol/sdk` **1.30.0**, instalado en MCP.
No hay cambios de dependencias, tsup ni configuración global de lint.

## Validación y errores

La implementación instalada de `Server.setRequestHandler` en
`@modelcontextprotocol/sdk/dist/esm/server/index.js` valida el envelope con
`CallToolRequestSchema` y el resultado con `CallToolResultSchema`. No evalúa el
`inputSchema` de cada herramienta. Una prueba real con `Client.request` envía un
número donde el esquema exige string y demuestra que llega al callback.

El dispatcher valida la estructura de params/nombre/arguments con ese mismo schema,
resuelve únicamente por Map y valida el resultado MCP antes de devolverlo. Argumentos
omitidos siguen siendo `undefined`; no inventa defaults. Una copia estructurada
impide que el handler modifique los argumentos del llamador. `validateArguments`
permite rechazar entradas específicas antes de ejecutar; la validación de dominio
sigue siendo responsabilidad del handler. **No hay validación completa automática
de JSON Schema ni de outputSchema.**

Errores nuevos: `invalid_invocation`, `unknown_tool`, `invalid_arguments`,
`execution_failed`, `invalid_result`, `cancelled`; resultado `isError: true` con
contenido de texto JSON `{code, message}` fijo. Excepciones, rechazos no Error,
resultados inválidos y errores de validadores se sanitizan; no se registran args,
payloads, mensajes internos ni stacks. Un `McpToolError` solo selecciona un código
permitido, aunque se modifique su mensaje. Resultados MCP válidos, incluso errores
de dominio `isError`, son salida explícita del handler y se conservan: el autor del
handler debe evitar introducir información privada en esa salida intencional.

La cancelación previa evita ejecutar; el signal se entrega al handler para
cancelación cooperativa posterior. No se promete interrupción forzada, timeout,
rollback, límite de recursos ni soporte de ejecución diferida de tareas MCP.
Las excepciones legacy conservan su semántica anterior y no adquieren por esta
entrega las garantías de sanitización del dispatcher.

## Estado real de ESLint

Se ejecutó ESLint sobre `server.ts` con `--no-inline-config` antes de editar:
**803 errores**, cero warnings. La nueva infraestructura no tiene supresiones.
Se elimina el encabezado global de `server.ts`, se tipa como unknown la lectura de
package.json y se expresan con Promise.resolve los tres callbacks sin await.
Los helpers de vista y el switch conservan excepciones acotadas por bloques.

| Regla `@typescript-eslint/…` | Base | Pendiente |
| --- | ---: | ---: |
| no-base-to-string | 34 | 34 |
| no-explicit-any | 81 | 81 |
| no-unnecessary-type-assertion | 14 | 14 |
| no-unsafe-argument | 43 | 43 |
| no-unsafe-assignment | 204 | 203 |
| no-unsafe-call | 25 | 25 |
| no-unsafe-member-access | 382 | 381 |
| no-unsafe-return | 10 | 10 |
| require-await | 10 | 7 |
| **Total** | **803** | **798** |

Persisten **61 diagnósticos** en `buildViewDiscoveryContext`/`buildModuleSummary`
y **737** en el límite de invocación/switch legacy. No se corrigen miles de líneas
ni aserciones legacy. El criterio de **eliminación total de supresiones permanece
pendiente**: VNEXT-012 inicia la migración de status/clean/context; VNEXT-013 y
VNEXT-014 continúan con discovery/plan/test; el resto exige migraciones explícitas
posteriores. No se afirma que esas tres tareas eliminen toda la deuda.

Una excepción de una línea en la prueba nueva permite simular rechazos Promise con
valores no Error, deliberadamente hostiles. No desactiva reglas de producción.

## Pruebas y resultados

Windows, Node **24.15.0**; SDK MCP instalado **1.30.0**.

- **38/38 unitarias** de dispatcher: registro, contratos inválidos, duplicados,
  reservas, orden, aislamiento, copias, sellado, intento de registro durante llamada,
  ejecución sync/async, contexto, argumentos omitidos/malformados, lookup exacto,
  validadores, errores controlados, excepciones privadas, resultados inválidos y aborto.
- **8/8 integraciones MCP reales** con `Client`, `Server` y
  `InMemoryTransport.createLinkedPair()`, handshake incluido. Lista y llamada a
  herramienta sintética, colisiones, aislamiento entre servidores, error desconocido,
  catálogo y prompts, status legacy sobre directorio temporal, sanitización y
  ausencia de validación inputSchema en el SDK/validador específico funcionando.
- **21/21 `server.test.ts`**. Recorrido focalizado conjunto: **67/67**.
- **Suite MCP completa: 183/183 en 14 archivos**, secuencial, fuera del sandbox con
  fixtures locales y navegador real en las suites legacy correspondientes.
  Primer recorrido bajo sandbox: 171 pasan/12 fallan en p4-4-auth-lifecycle y
  p4-5a2-integrity. No se reproducen fuera del sandbox; no se alteran sus aserciones.
- **Diez builds aprobados**: shared, auth, engine, knowledge, playwright-adapter,
  git-adapter, playwright-runner, reporter, mcp y cli; build MCP incluye declaraciones
  y exportaciones públicas del dispatcher. No se certifica la suite global.
- TypeScript estricto del dispatcher y pruebas unitarias: sin diagnósticos.
  Typecheck amplio MCP: **48 diagnósticos legacy**. Comparación con servidor/index
  base mediante CompilerHost en memoria: mismos 48, sin diagnósticos añadidos
  (normalizando solo el orden textual de una unión equivalente en cuatro mensajes).
  Ningún diagnóstico en los tres archivos nuevos TypeScript. Dos errores pertenecen
  a guidance.ts; los demás a tests legacy (tipos, imports/rootDir y variables/directivas
  sin uso). No se proclama typecheck amplio verde.
- ESLint de dispatcher, dos tests nuevos, server e index: **cero errores/warnings**
  con las excepciones legacy indicadas. `--no-inline-config` revela los 798 pendientes.

El fixture `src/__tests__/fixtures/mcp-catalog-vnext010.json` se obtuvo del contenido
Git de server.ts/guidance.ts de la base exacta, evaluando únicamente constantes de
catálogo. Se compara por igualdad completa contra `tools/list` y `prompts/list`:
18 nombres, descripciones, esquemas y orden; también se verifica `prompts/get`.
Es un snapshot de pruebas, no una segunda definición de producción.

## Reproducción y publicación

Desde la raíz, usando binarios instalados (sin resolver paquetes en red):

```powershell
$env:TEMP = (Resolve-Path node_modules/.tmp-vnext).Path
$env:TMP = $env:TEMP
packages/mcp/node_modules/.bin/vitest.cmd run packages/mcp/src/__tests__ --fileParallelism=false
node node_modules/typescript/bin/tsc --noEmit --strict --noUnusedLocals --noUnusedParameters --noImplicitReturns --target ES2022 --module ESNext --moduleResolution bundler --skipLibCheck --esModuleInterop packages/mcp/src/dispatcher.ts packages/mcp/src/__tests__/dispatcher.test.ts
node node_modules/eslint/bin/eslint.js packages/mcp/src/dispatcher.ts packages/mcp/src/server.ts packages/mcp/src/index.ts packages/mcp/src/__tests__/dispatcher.test.ts packages/mcp/src/__tests__/dispatcher-integration.test.ts
node node_modules/eslint/bin/eslint.js packages/mcp/src/server.ts --no-inline-config
node node_modules/typescript/bin/tsc --noEmit -p packages/mcp/tsconfig.json
```

Los dos últimos comandos fallan por la deuda documentada. Las suites de navegador
requieren acceso a sus fixtures HTTP locales fuera de las restricciones del sandbox.
Build: ejecutar el CLI local `node_modules/tsup/dist/cli-default.js` desde cada paquete,
en el orden de los diez builds enumerados. Logs/reportes/comparaciones temporales
se guardan en node_modules y se excluyen de Git.

No se ejecutó qap_clean manualmente ni se operó sobre bases/proyectos personales:
las operaciones de las suites usan fixtures desechables. Sesión protegida conservada,
hash Git antes/después `28e1b8dbec7ccf194440cc4158ec6072c9b9ade4`, fuera de staging.
HEAD remoto base comprobado con git ls-remote tras superar la restricción DNS del
sandbox. Publicación solo en la rama autorizada, sin merge/rebase/reset/force push.
Commits y HEAD remoto final se informan al entregar; alcance de entrega:
`git log --oneline 7271c69..HEAD`.

## Continuidad

VNEXT-011 deja el contrato y la ruta declarativa disponibles para VNEXT-012, pero
mantiene las 18 implementaciones originales. No crea herramientas públicas nuevas,
ni cambia SQLite, autenticación, descubrimiento, planes, reportes o reglas de negocio.
Pendientes explícitos: eliminación total de supresiones, typecheck amplio legacy,
validación de dominio por handler y migraciones funcionales bajo autorización nueva.
Detener tras publicar. **No iniciar VNEXT-012.**
