# INT-03-R5 — estabilización focal

Fecha: 2026-11-09, America/Mexico_City. Base exacta: `df107c3117b23558c6988d5e2e38c2d6bc181945`. El commit de entrega es el HEAD que contiene este informe; consultar `git rev-parse HEAD`.

**Resultado: el recorrido técnico autorizado MCP → ejecución → persistencia → reporte funciona. GO para continuar implementación MVP; NO-GO para aceptación integral del usuario.** No se certifica estabilidad integral con doce pruebas MCP todavía rojas y conexiones funcionales pendientes. No se exige sanear toda la deuda histórica para continuar.

## Alcance y conservación

Trabajo en un worktree nuevo, inicialmente detached en el candidato exacto. Se conserva su merge, sus dos padres INT-03 `18199e0c036ab53c6d0f7af0a9f65740eb0aec89` y R4 `d49297a36f0340d46108553bb1e7989c66549eb1`, y ambos linajes. Sin push ni merge oficial. No se modificaron generadores BVA/RBAC, su política de ejecución, `admin-user.json`, ni las trece pruebas heredadas. No se repitió la auditoría certificada R4.

Cambios de producto: `packages/mcp/src/host-composition.ts` y `packages/playwright-adapter/src/adapter.ts`. Regresiones adicionales: `packages/mcp/src/__tests__/host-composition.test.ts`. Arnés reproducible: `scripts/int03-r5-vertical.mjs`. Evidencia: `docs/vnext/integracion/evidencia/INT-03-R5/`.

## Matriz de los trece fallos

Todos existen en el padre INT-03. Para los doce MCP, el dictamen R4 y los logs `int03-baseline-mcp-failures.log` y `int03-baseline-mcp-c1.log` acreditan reproducción exacta sobre ese padre. R5 vuelve a reproducir las doce aserciones sin cambiar sus pruebas. Adapter es idéntico entre candidato e INT-03; el mismo fallo fue reproducido sobre R4, también con Adapter idéntico. Esta procedencia se contrasta con el código, no se interpreta como irrelevancia.

Claves de causa reproducible:

- **S**: P4.4 crea `createMcpServer()` sin autorizar su directorio temporal. `DiscoveryHandler.execute` → `projectRoot(..., true)` rechaza ese scope, devuelve `invalid_project_scope`, no llega al navegador. En particular, `targetPath` no concede autorización de host. El harness legacy además carece de binding canónico y política de discovery.
- **A**: los argumentos `profile` se rechazan antes de resolver el scope con `authentication_not_supported`. Incluso con binding/política válidos se reproduce por Stdio. `lifecycle.session.auth.required` también bloquea; el crawler usa `fresh_anonymous_static`, no consume la sesión Auth.
- **K**: los tests que sí autorizan el root, o usan su cwd temporal, no componen Knowledge. La respuesta determinista es `knowledge_unbound`, antes de clasificación de login o compuerta legacy. El handler canónico no ejecuta `PlaywrightAdapter.discover` ni publica `module-view` legacy.

| # | Fallo exacto | Causa / contrato afectado | En INT-03 | Decisión y estado R5 |
|---|---|---|---|---|
| 1 | P4.4 / 1 protegido sin perfil | S; espera `razon=auth_required`. No se ensayó autenticación en esa llamada. | Sí | FAIL retenido. La expectativa de diagnóstico legacy es deuda de compatibilidad; descubrimiento protegido sigue siendo bloqueo funcional real (A). |
| 2 | P4.4 / 2 redirección HTTP 302 | S; no llega a clasificar redirect como `auth_wall`. | Sí | FAIL retenido. Diagnóstico legacy pendiente; no acredita navegación autenticada. Adapter real sí cubre el redirect. |
| 3 | P4.4 / 3 login embebido | S; no llega a inspeccionar formulario. | Sí | FAIL retenido. Diagnóstico legacy pendiente; no se interpreta el bloqueo preventivo como bypass. |
| 4 | P4.4 / 4 sesión expirada | A; no restaura/valida sesión ni desverifica perfil expirado desde discovery. | Sí | **Bloqueo MVP inmediato** para descubrimiento autenticado y recuperación de sesión; no se acredita como deuda no bloqueante. Conexión pendiente D1. |
| 5 | P4.4 / 5 perfil válido | A; no consume storageState ni produce vista legacy/estado `observed`. | Sí | **Bloqueo MVP inmediato** para explorar zonas protegidas. D1 y D2 pendientes; no se cambió el rechazo para simular éxito. |
| 6 | P4.4 / 6 selectores de acceso | S; el nuevo contrato tampoco materializa `auth_selectors` legacy. | Sí | FAIL retenido. Falta D2 para entrevista/generación basada en vistas; observaciones canónicas no son selectores aprobados. |
| 7 | P4.4 / 15 guard asíncrono lento | S; no alcanza guard. Espera `auth_required`. | Sí | FAIL retenido. Compatibilidad pendiente; guard real del Adapter pasa. No habilita flujo protegido (D1). |
| 8 | P4.5-A.2 / C1-a login solicitado | K; root autorizado, sin binding. Espera login/success legacy. | Sí | FAIL retenido. Captura canónica autorizada funciona con host real; publicación de vista/entrevista legacy sigue pendiente D2. |
| 9 | P4.5-A.2 / C1-b redirect 302 | K; no alcanza navegación. | Sí | FAIL retenido. Discrepancia de contrato de prueba; no prueba que el crawler autenticado exista. Clasificación Adapter real pasa. |
| 10 | P4.5-A.2 / C1-c guard cliente | K; no alcanza navegador/guard. | Sí | FAIL retenido. Misma separación de contratos; guard Adapter real pasa, D1 sigue bloqueante. |
| 11 | P4.5-A / C4-d SCOPING sin roles | K; el test sí autoriza root. Espera texto de fase legacy, recibe Knowledge unbound. | Sí | FAIL retenido. Deuda de precedencia/diagnóstico: la operación queda bloqueada, sin evidencia de transición indebida. La primera mitad de la prueba valida el bloqueo de planificación por roles. |
| 12 | server / E0b vista auth `session_saved` | K; cwd autorizado, binding ausente; el mock solo sustituye el Adapter legacy. | Sí | FAIL retenido. El mock no prueba el handler canónico. La publicación de vistas legacy es una conexión pendiente D2 que afecta entrevista, no un error atribuible a R4. |
| 13 | Adapter / auth-classification / 12 SPA sin settling | `skipDomSettling` omitía solo la espera final, pero mantenía `networkidle` y la espera del primer selector. Estas esperas permitían hidratar la SPA de 800 ms antes de extraer. | Sí | **Corregido** sin alterar prueba, servidor fixture ni tiempos. Suite 12/12 y Adapter completo 165/165. |

Las filas 1–3, 7, 9–11 no justifican restaurar un mensaje legacy ni relajar autorización para obtener verde. Sus aserciones permanecen visibles. Las capacidades que esperaban se evalúan separadamente: D1/D2 sí bloquean el flujo MVP integral. No hay base para llamar irrelevantes a los doce fallos por ser heredados.

## Correcciones

1. **Entrada Stdio a Runner conectada.** `TestHandler` ya aceptaba `McpServerOptions.testAuthorizations`, pero `loadHostComposition` nunca la suministraba. Un manifiesto host válido permitía discovery y aun así `qap_test` quedaba en `navigation_not_authorized`. Se añadió `testAuthorization` opt-in al manifiesto existente; se valida antes de abrir recursos y se vincula al root canónico. Solo acepta orígenes HTTP(S) exactos y perfiles nominales opcionales. Rechaza `*`, puertos wildcard, rutas, credenciales en URL y protocolos no HTTP. La política sigue fuera de argumentos MCP; sin ella no se autoriza navegación. El esquema de herramientas no cambió. Se añadió import explícito de `URL` de Node.

   Ejemplo de fragmento del manifiesto **del host**, junto a los campos de identidad/Knowledge existentes:

   ```json
   { "testAuthorization": { "allowedOrigins": ["http://127.0.0.1:8080"], "authorizedProfiles": ["tester"] } }
   ```

   Seis regresiones nuevas cubren transmisión de política y cinco rechazos. Las opciones programáticas existentes conservan su contrato. Esta corrección permite la ejecución anónima del fixture por el binario Stdio real.

2. **SPA sin asentamiento.** `skipDomSettling=true` omite ahora también `networkidle` y espera de montaje. Conserva verificación posterior de URL/login y no modifica las esperas del modo normal. Es una opción comparativa; no promete congelar el navegador ni capturar siempre un DOM anterior a la hidratación bajo cualquier carga del equipo. El contrato por defecto de captura asentada y los guards reales siguen pasando.

## Los cinco diagnósticos adicionales

| Diagnóstico adicional frente a INT-03 | Estado / evidencia |
|---|---|
| `challenger-rbac-stress.test.ts`: dos TS2304 `performance` | Heredados de R4. `tsconfig.json` raíz usa solo `lib: ES2022`, sin tipos Node. `packages/knowledge/tsconfig.json` incluye `types: [node]`; su typecheck pasa con cero diagnósticos. No se cambió R4 para satisfacer una configuración ajena a su contrato. |
| `generated-oracle-integration.test.ts`: TS2307 `node:fs/promises` | Persiste exclusivamente en análisis raíz; Runner pasa con su configuración real que incluye Node. |
| Mismo archivo: TS2307 `node:os` | Mismo resultado. |
| Mismo archivo: TS2307 `node:path` | Mismo resultado. |

El build real es `pnpm build` → scripts `tsup` por paquete, con sus configuraciones y generación de declaraciones cuando corresponde: PASS. No existe script raíz `typecheck` que convierta el `tsconfig` raíz genérico en contrato global de compilación; es base para los paquetes. No se relajó ni excluyó ningún diagnóstico. Las pruebas nuevas no son código navegador.

MCP sigue con **116 diagnósticos**, idénticos por archivo/código/mensaje a INT-03 al normalizar la ruta física de worktree en tres TS6059. Análisis raíz R5: **1917**, candidato: **1923**. El import Node explícito de `URL` sustituye siete errores de resolución ambiental de `URL` por un TS2307 `node:url` bajo la configuración raíz; este último tampoco existe en la compilación de producto. La comparación versionada acredita el intercambio, sin presentar la reducción como saneamiento global. Los cinco señalados permanecen clasificados y no bloquean el contrato de build.

## Verificación vertical real

`scripts/int03-r5-vertical.mjs` usa `Client` + `StdioClientTransport` del SDK instalado y lanza `packages/mcp/dist/server.js`, con `QAP_MCP_HOST_CONFIG_PATH` apuntando a un manifiesto host del fixture. No accede a `_requestHandlers`, no inyecta handlers ni Runner falso y no inventa herramientas. Arranca servidor HTTP loopback, provisiona Knowledge sintético y solicita las herramientas reales con `targetPath` absoluto.

Secuencia observada:

1. `tools/list`: 18 herramientas reales.
2. `qap_init`, `qap_context_set` y confirmación de contexto fixture; `qap_session_plan` con decisión explícita sin autenticación → WORKING.
3. `qap_discover` autorizado: observaciones/evidencias canónicas persistidas. No crea requisitos aprobados ni cierra el módulo. Una segunda llamada con perfil confirma `authentication_not_supported` por la misma frontera Stdio.
4. Fixture materializa contexto técnico y dos YAML ejecutables explícitos. **No se acredita generación MCP**: este tramo es preparación del fixture y su conexión de producto falta (D3).
5. `qap_plan` lee esos archivos y persiste matriz/huella de dos casos. `qap_test` ejecuta Playwright Chromium real: **total 2, PASS 1, FAIL intencional 1, not_run 0**. El fallo compara el texto real con un valor deliberadamente incorrecto.
6. Se verifica el JSON persistido de ejecución y una captura física del fallo. `qap_report(format=all)` produce HTML, Markdown, JUnit y JSON existentes.
7. Se cierra el cliente/servidor, se abre un proceso MCP nuevo y se recuperan los cuatro reportes por `executionId`, con `evidence_source=persisted_execution`. Se conserva el historial de ejecución del módulo.
8. `qap_status` responde; `qap_session_close` queda honestamente bloqueado con `canonical_closure_store_required`, porque el fixture no configura un almacén/autoridad de cierre. No se manipula lifecycle para fabricar un cierre.

Resultado: **PASS técnico de adquisición anónima, planificación, ejecución, evidencias y recuperación de reportería**. La evaluación intencionalmente fallida no se convierte en PASS. No prueba generación aprobada, discovery autenticado, cierre humano ni aceptación sobre Lendus. Reportería de ejecución filesystem funciona; no se afirma que ese resultado se indexe automáticamente como `RunRecord` en el visor SQLite canónico.

Reproducción desde un checkout compilado y con dependencias:

```powershell
node scripts/int03-r5-vertical.mjs (Get-Location).Path C:/ruta/absoluta/nueva/evidencia-r5
```

El directorio de salida debe ser nuevo. El script conserva fixture, ejecución, captura y reportes para inspección. La evidencia versionada contiene catálogo, transcripción y resumen; artefactos completos de esta corrida permanecen en `C:/Users/Judirico/Documents/QAMCP/audits/INT03-R5/vertical-final/`.

## Conexiones pendientes y alcance mínimo

| ID | Conexión concreta / ubicación | Implementación mínima pendiente y prioridad |
|---|---|---|
| D1 | Auth → discovery: `handlers/discovery.handler.ts:65–101`; `BlackBoxCrawler` está aislado como `fresh_anonymous_static`. | **Inmediata para MVP protegido**. Contrato explícito del host por aplicación/entorno/perfil/rutas que permita adquirir con sesión aislada; restauración y validación del perfil usando Auth; tratamiento de expiración y renovación; restricciones de navegación/evidencia y cierre garantizado. No basta pasar storageState a un crawler cuyo contrato exige anonimato. No es necesario rehacer BVA/RBAC. |
| D2 | Observación canónica → vista/entrevista: `handlers/legacy-discovery-contract.ts`, `server.ts:2208` y `:3078`; asociación en `discovery.handler.ts:103`. | **Inmediata para recorrido integral de definición**. Adaptar entrevista y su materialización de selectores al inventario canónico, conservando procedencia y revisión humana; o un puente explícito y validado hacia vistas legacy. No usar observación como regla confirmada ni avanzar `planned` a `observed` solo para satisfacer tests. |
| D3 | Requisitos/oráculos aprobados → YAML ejecutables → `PlanHandler`: `knowledge/src/plan/case-generator.ts:32`, generadores ya existentes, `handlers/plan.handler.ts` carga `TC-*.yaml`. Catálogo MCP no ofrece generación. | **Inmediata para generar pruebas desde MCP**. Conectar servicio de generación existente a una operación MCP acordada y real, con persistencia, recuperación e idempotencia, autoridad/oráculo verificables y protección de edición manual. No se añade aquí una herramienta inventada ni se ejecutan candidatos BVA/RBAC bloqueados. Los YAML fixture solo prueban el tramo posterior. |
| D4 | Revisión/cierre canónico → Stdio: `host-composition.ts` conserva deliberadamente gateways ausentes; `server.ts:250` y `:3386`; `CanonicalClosureService`. | **Inmediata para cierre integral**. Provisionar almacenes existentes y un gateway confiable de revisión humana en el host; transportar decisiones autenticadas sin derivar autoridad de JSON ni `user_confirmed` aportado por un agente. El cierre no se puede acreditar con confirmaciones sintéticas. |
| D5 | `TestHandler.saveExecutionResult` / `ReportHandler` → índice/visor `RunRecord` de reportería v3. | Deuda acreditada para el recorrido técnico con reportes de ejecución; **bloqueante si el MVP exige ese visor**. Traducir resultados a registros indexables con trazabilidad y reindexación, evitando inventar conformidad. No hay evidencia de que `qap_report` efectúe esa indexación. |

D1–D4 no se clasifican como deuda irrelevante ni como reparados. Restaurar todo discovery legacy o fabricar autoridad para poner doce tests en verde incumpliría los contratos vigentes. El usuario autorizó documentar conexiones concretas cuando no existe recorrido completo; este es ese caso. La corrección Stdio sí elimina un bloqueo real del tramo de ejecución ya implementado.

## Pruebas y evidencia

| Comprobación | Resultado |
|---|---|
| Build monorepo | PASS |
| Lint de los tres archivos cambiados | PASS |
| MCP completo, un worker | 500 PASS / mismos 12 FAIL, 30 archivos; incluye seis regresiones añadidas |
| Composición host final | 13/13 |
| Adapter completo | 165/165, 8 archivos |
| Clasificación auth/SPA, sin cambiar pruebas | 12/12 |
| Knowledge y Runner, typecheck de paquete | 0 diagnósticos ambos |
| MCP typecheck | 116 heredados; comparación normalizada adjunta |
| Typecheck raíz | 1917; configuración ambiental no aplicable como build global |
| Stdio vertical, binario compilado | PASS; PASS/FAIL reales, captura, cuatro formatos y recuperación tras reinicio |

Se reutilizaron dependencias ya instaladas mediante enlaces locales, con dependencias workspace dirigidas a este worktree y builds locales; no se ejecutó producto del checkout original. Instalación offline de pnpm 12 no pudo resolver su caché y la red restringida impidió descargar; no se modificaron lockfiles. El lanzamiento directo `node node_modules/vitest/vitest.mjs ...` evita demoras del wrapper de pnpm y usa el Vitest instalado. Las suites largas se ejecutaron con un worker. No se alteraron timeouts ni expectativas para ocultar fallos.

La evidencia conserva logs completos, comparación de diagnósticos, catálogo/transcripción Stdio y manifiesto SHA256. Los logs históricos del padre se conservan como evidencia histórica identificada, sin presentarlos como una nueva corrida R5. El informe previo R4 conserva su dictamen y ámbito.

## Dictamen separado

- **Estabilidad del candidato:** estabilidad focal verificada del Adapter y del tramo autorizado de ejecución/reportes Stdio. **NO-GO para certificar estabilidad integral**: doce pruebas de compatibilidad siguen rojas y D1–D4 son capacidades faltantes. No se atribuyen estos bloqueos al merge R4.
- **Aptitud para continuar implementación MVP del 16/11/2026:** **GO**. Build y recorrido técnico funcionan; trabajo restante acotado a D1–D4 y a decidir si D5 pertenece al MVP. Los 116 diagnósticos históricos y los cinco de configuración raíz no exigen abrir otro saneamiento general. No se garantiza plazo de entrega a partir de esta verificación.
- **Aptitud para aceptación del usuario:** **NO-GO integral**. Lendus no se ensayó ni se aceptó. El fixture técnico es evidencia de infraestructura, y no reemplaza los recorridos protegidos, generación aprobada y cierre humano que faltan.
