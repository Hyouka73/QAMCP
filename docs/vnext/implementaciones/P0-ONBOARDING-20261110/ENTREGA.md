# Entrega P0 — 10/11/2026

**Dictamen: NO-GO para onboarding completo en Codex.** La implementación y los ensayos técnicos no acreditan todavía el criterio de una conversación nueva, en carpeta vacía, sin preparación manual. T09 está pendiente; tampoco se ocultan los fallos de contrato del catálogo.

## Implementación

Rama de publicación: `feat/qap-vnext-architecture`, sobre `d3190dfc5edaac7f3f8ad7b35d9d9799150b9a69`. El SHA del commit de esta entrega es verificable en Git; no se incrusta autorreferencialmente en su contenido. El contrato completo, la justificación de reutilizar `qap_status`, los límites de autorización y la reconexión se describen en [CONTRATO.md](CONTRATO.md).

Se implementó preparación local por raíz autorizada, Knowledge v2 separado del proyecto, inicialización idempotente, registro de URL sin autorizaciones implícitas, recuperación tras reinicio, investigación antes de preguntar módulos e inventario provisional. El host provisionado admite módulos vacíos y políticas opcionales. También se aplica la frontera de raíces a sus escritores legacy. No se modificaron Engine, Knowledge, Runner, Reporter, `admin-user.json`, `develop` o `main`.

## Evidencia T01–T10

| Prueba | Estado | Evidencia y alcance |
|---|---|---|
| T01 — Carpeta vacía | PASS técnico | `autonomous-onboarding.test.ts`: prepara una carpeta técnica sin .qa, URL, módulos o host previo dentro de raíces autorizadas; no error interno. Stdio confirma el resultado. |
| T02 — Inicialización autónoma | PASS técnico | Conserva contexto al repetir y ante concurrencia; una base por raíz. Cliente sin raíces: no crea .qa. |
| T03 — Sin URL | PASS técnico | Una pregunta abierta de ubicación, sin instalación ni lista de módulos. |
| T04 — Markdown existente | PASS técnico | Detecta README y recomienda su lectura/ingesta antes de preguntar. No se fabrican reglas extraídas. |
| T05 — Sin módulos | PASS técnico | La orientación investiga primero. La prueba nueva de `discovery-handler.test.ts` observa una aplicación técnica con autorización explícita en SCOPING, plan vacío y cero módulos canónicos creados. |
| T06 — Autorizaciones | PASS técnico | Rechaza rutas ajenas en modo autónomo y en inicialización legacy de host provisionado; argumentos de aprobación no otorgan permiso; no inicia login ni navegación sin la política del host. Las regresiones canónicas conservan revisión independiente. |
| T07 — Reinicio | PASS técnico | Dos procesos Stdio recuperan Knowledge y la URL sin volver a preguntarla. Caso adicional recupera la URL canónica después de interrupción previa a publicación legacy. |
| T08 — Multiproyecto | PASS técnico | Dos raíces técnicas comparten instalación pero mantienen bases y estado separados, sin transferir la URL ni permisos. |
| T09 — Codex real en otro workspace | PENDIENTE / NO ACREDITADA | Se inspeccionó el registro real de Codex y se verificó Stdio. El cliente de las pruebas de raíces es sintético, no Codex real. No se abrió una conversación nueva ni se ejecutó la evaluación del usuario. |
| T10 — Regresión | PASS DEV-MVP-02; suite con fallos abiertos | DEV-MVP-02 conserva 1 caso aprobado y 1 fallido, cuatro reportes, recuperación, cierre técnico y WRAP_UP. La comparación de suite separa baseline y cambios de contrato. |

Las carpetas de prueba son técnicas y no constituyen la carpeta ni la aceptación del usuario. Los gateways y decisiones del recorrido DEV-MVP-02 son un fixture explícitamente controlado, nunca evidencia de aceptación humana real (`human_acceptance=NOT_PERFORMED`).

## Ejecuciones y resultados

- Prerrequisitos verificados: Node `v24.15.0`, pnpm `12.3.4`, Git `2.54.0.windows.1`.
- `pnpm install --frozen-lockfile` se intentó, pero permaneció en verificación de políticas de supply chain sin completar y se canceló. Se utilizaron las dependencias ya instaladas, sin modificar el lockfile. No se afirma instalación nueva exitosa.
- `pnpm build`: **PASS completo**, incluidos MCP y CLI. [Log](evidencia/build.txt), [hashes de binarios](evidencia/build-assets-sha256.json), [hashes del código de trabajo](evidencia/source-workingtree-sha256.json).
- ESLint focal con `--max-warnings=0`: **PASS**, sin salida de diagnósticos. [Log](evidencia/lint.txt).
- Pruebas nuevas de onboarding: **13/13 PASS**. [Resultado JSON](evidencia/onboarding-autonomous-final.json).
- Ensayo Stdio con assertions sobre los resultados, raíz distinta al directorio del servidor, registro de URL, idempotencia y reconexión: **PASS_PROTOCOL**. [Resultado](evidencia/stdio-onboarding.json). Los procesos temporales se cierran y su carpeta técnica se elimina tras verificar su ruta.
- Script histórico exigido por AGENTS.md: conexión y catálogo funcionales, pero `qap_init` devuelve `workspace_selection_required` al no entregar raíces. Ese script imprime «100%» incondicionalmente tras enumerar herramientas; **esa frase no acredita onboarding**. [Salida completa](evidencia/stdio-historical.txt).
- DEV-MVP-02 final: **PASS_TECHNICAL**, sin aceptación humana. [Resultado](evidencia/dev-mvp02-result.json), [log](evidencia/dev-mvp02.txt).

Las pruebas Vitest y el ensayo de persistencia Stdio se ejecutaron fuera del sandbox después de reproducir EPERM en los renames del caché/publicación legacy de Windows. No se cambiaron timeouts ni aserciones existentes para hacerlas pasar. El fixture de descubrimiento provisional añade un caso positivo; no altera los casos anteriores.

## Comparación del baseline

Se midieron las fuentes exactas de `d3190df`: **518 tests, 506 aprobados y 12 fallidos**. La copia técnica inicial carecía de archivos auxiliares de dos suites; se restauraron sus archivos originales y se reejecutaron solamente esas suites. El resumen usa el último resultado por suite y conserva ambos reportes crudos. No se presenta la primera ejecución incompleta como un baseline válido. [Resumen y método](evidencia/baseline-summary.json), [ejecución cruda](evidencia/onboarding-baseline-exact-final.json), [reintento focal con soporte completo](evidencia/onboarding-baseline-support-fixed.json).

La comparación definitiva registra **532 tests: 517 aprobados y 15 fallidos**, conservando exactamente los 12 fallos del baseline. Está en [suite-comparison.json](evidencia/suite-comparison.json). La [ejecución completa](evidencia/mcp-suite-final.json) emitió un aviso interno de Vitest y dejó dos aserciones como pendientes; la [reejecución de esa única suite](evidencia/mcp-suite-pending-retry.json) pasó 13/13, sin cambiar tests ni timeouts. El agregado sustituye solamente esa suite y conserva los reportes crudos; no quedan casos pendientes en el agregado.

Hay tres incompatibilidades de contrato adicionales: el snapshot congelado del catálogo, una aserción que exige instalar el navegador como trabajo automático y otra que exige texto legacy sobre el navegador. No se han borrado ni flexibilizado esas pruebas. Permanecen abiertas y requieren reconciliación explícita con el contrato P0.

## Registro y limitaciones de Codex

`qap-vnext` está habilitado en la instalación existente, usa Stdio y apunta a `C:\Users\Judirico\Documents\QAMCP\qap-vnext-runtime\packages\mcp\dist\server.js`. El build actualiza el servidor en esa misma ubicación; el registro ya tenía la ruta correcta y no necesitó reescritura. [Configuración efectiva](evidencia/codex-registration.json).

No se ha demostrado que una conexión nueva de Codex entregue raíces MCP. Tampoco se ha reiniciado la conexión MCP de esta conversación para atribuirle el código recién compilado. Si el cliente no proporciona raíces, se exige el mecanismo local del operador; ese caso incumple la experiencia de cero preparación manual. No se autoriza la escritura tomando `cwd` o `targetPath` como prueba suficiente.

La preparación de claves, gateways de revisión y políticas de navegación/ejecución sigue siendo una acción local independiente cuando se necesita. No se proporciona todavía una UI de consentimiento ni una reconexión transparente de Codex. Por estas limitaciones, **no se declara GO**, aunque la inicialización autónoma funcione con raíces autorizadas y Stdio pase.
