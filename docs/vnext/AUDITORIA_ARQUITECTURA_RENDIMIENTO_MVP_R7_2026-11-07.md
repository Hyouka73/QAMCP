# QAMCP — dictamen independiente de arquitectura, rendimiento y MVP

Fecha: 2026-11-07. Corte de fuente: 73d51cec2e3d61ea1f981079aab1168b0b87c04b en feat/qap-vnext-architecture. Tipo: auditoría documental y estática dirigida; NO es certificación física ni permiso para merge. Auditor: ChatGPT (rol separado de implementación/QA).

## A. Decisión ejecutiva

1. **Conservar TypeScript, Node.js, MCP, Playwright y SQLite para el MVP.** Las mediciones disponibles no prueban que el lenguaje sea el cuello crítico. No autorizar reescritura general a Rust antes del 20 de noviembre.
2. **No incorporar Rust en esta ventana.** Un componente Rust acotado (validación o cálculo CPU-bound) solo se evaluaría después de perfilar una operación pura dominante y contar con baseline equivalente en ambos sistemas operativos.
3. **Intervención única prioritaria R7-01: habilitar y acreditar un ejecutor con capacidad CPU/RAM reservada para contraste E01.** La primera entrega de Gemini es el preflight y contrato verificable; Codex certifica la preparación y solo después realiza R6-A en ese ejecutor. La reserva real es condición operacional, no algo que un script pueda fingir.
4. R6-A se mantiene BLOCKED/C; no hubo pruebas nuevas. E01 y VNEXT-014 integral siguen NO-GO. La R4 correctiva sigue PASS en su alcance.
5. El MVP del 20-11 solo tiene una ruta razonable de **alcance limitado**: adquisición anónima, estática, autorizada por el host; planificación y ejecución de casos explícitos; evidencia/reporte y revisión humana donde esté soportada. Esta es una **propuesta de alcance**, no una decisión de producto ni una certificación. No incluye SPA autenticada ni Discovery autenticado; tampoco equivale al GO integral de VNEXT-014.
6. **El siguiente cambio de código de producto no debe decidirse hasta tener causalidad.** Existe una brecha estática distinta y reproducible en el manejo de recursos de session-resolver, que debe transformarse en test focal y corrección separada, sin atribuirle por ahora los timeouts E01.

## B. Estado físico y fuentes

- E01-R5: 506 identidades, serial 494 PASS/12 FAIL y dos paralelas normales 468 PASS/38 FAIL; 26 timeouts adicionales por paralela, con 22 comunes y ocho exclusivas en total. SHA físico 9e9d2c8062b908d936ae090bbe9cb5c4ca2b0772.
- Picos observados R5: CPU host 100%, RAM libre mínima 107 MB, event-loop lag máximo 2231 ms, Chromium browser.close hasta 7446 ms en wrapper asignado (y salida nativa 8356 ms no asignada de modo fiable). E0b excedió el presupuesto aun con cierre de unos 397 ms; Chrome close no es causa suficiente.
- R6-A: no hubo 69 tests ni 506 tests; falta reserva. Las métricas del host sin pruebas no demuestran que la interferencia externa causara R5.
- Doce identidades históricas de autenticación pendientes: TM-13 a TM-19, TM-27, TM-30 a TM-32 y TM-50. Modernizadas en código: 43/55; no equivalen a 43 certificaciones completas.
- Deuda TS: 128 diagnósticos heredados medidos R4, sin seis regresiones nuevas; no se ha reejecutado typecheck global a este HEAD desde este auditor.

Informes:
- [E01-R5](https://github.com/Hyouka73/QAMCP/blob/73d51cec2e3d61ea1f981079aab1168b0b87c04b/docs/vnext/implementaciones/VNEXT-014-E01/INFORME_E01_R5_2026-11-06.md)
- [E01-R6-A](https://github.com/Hyouka73/QAMCP/blob/73d51cec2e3d61ea1f981079aab1168b0b87c04b/docs/vnext/implementaciones/VNEXT-014-E01/INFORME_E01_R6_A_2026-11-07.md)
- [Plan R6](https://github.com/Hyouka73/QAMCP/blob/73d51cec2e3d61ea1f981079aab1168b0b87c04b/docs/vnext/implementaciones/VNEXT-014-E01/PLAN_R6_2026-11-06.md)
- [Decisión Auth MVP](https://github.com/Hyouka73/QAMCP/blob/73d51cec2e3d61ea1f981079aab1168b0b87c04b/docs/vnext/implementaciones/VNEXT-014-TEST-MODERNIZATION/DECISION_AUTH_MVP_2026-11-07.md)
- [WBS microtareas](https://github.com/Hyouka73/QAMCP/blob/73d51cec2e3d61ea1f981079aab1168b0b87c04b/docs/vnext/08_WBS_MICROTAREAS_Y_COMPUERTAS.md)

## C. Arquitectura real examinada

- MCP: packages/mcp/src/server.ts (3756 líneas, mezcla dispatcher canónico y rutas legacy); dispatcher.ts valida invocación, congela registro y sanitiza errores; los handlers canónicos usan puertos de conocimiento. server.close aborta llamadas activas y espera Promise.allSettled antes de cerrar transporte. No confundir cierre rápido del transporte con fin de trabajo Chromium.
- Discovery: packages/mcp/src/handlers/discovery.handler.ts valida scope, pin de revisión de Environment, consentimientos, estado WORKING y módulo activo. Bloquea credenciales o sesión del wire y solo llama al crawler con fresh_anonymous_static.
- Navegador: packages/playwright-adapter/src/crawler/browser.ts crea proxy deny-only y lanza Chromium por adquisición; crawler/service.ts crea contexto offline sin JS, instala routing, controla límites/cancelación, espera browser/context/pending/proxy en cleanup y persiste evidencias solo después. El runner, packages/playwright-runner/src/runner.ts, crea su propio navegador/contexto para ejecutar TestPlan y conserva lock hasta drenaje.
- Auth: packages/auth/src/auth-manager.ts almacena/resuelve referencias de credenciales y no comprueba validez remota; hasValidCredentials significa presencia de secreto. packages/playwright-runner/src/session-resolver.ts resuelve sesiones para el runner, pero esa ruta no integra auth privilegiada en Discovery.
- Persistencia: packages/knowledge/src/storage/sqlite-knowledge-adapter.ts usa DatabaseSync en hilo llamador, WAL, synchronous FULL, transacciones IMMEDIATE/DEFERRED, revisiones, cursor firmado, rechazo reentrante y withWriteFence con reserva de escritura y cola por ruta dentro de proceso. No hay evidencia de deadlock dominante ni de que trasladar esta capa a Worker resuelva E01.
- Pruebas: Vitest 4.1.11 sobre paquete MCP y Chromium real en fixtures de lifecycle/Discovery/Runner. 506 identidades no son 506 procesos Chromium, pero las pruebas cargadas sí producen numerosas adquisiciones. La distribución medible está en E01-R5. Hay rutas canónicas y legacy en el mismo servidor: riesgo de mantenimiento/migración, no prueba por sí sola de cuello de botella.

Mapa de recursos:
MCP Stdio -> server/router y handlers -> auth/policies/Knowledge -> crawler o runner -> procesos Chromium + contextos/páginas/proxy -> lectura/escritura SQLite/FS -> cierre/drain/transport. CPU: JS síncrono, validación, HMAC, serialización, SQLite, browser/kernel; I/O: red autorizada por gateway, filesystem, SQLite, IPC, launch/cierre de procesos. Las operaciones asíncronas no implican ausencia de bloqueo si invocan DatabaseSync.

## D. Matriz de hallazgos y rigor causal

| ID | Gravedad | Clasificación | Evidencia | Impacto y acción |
|---|---|---|---|---|
| R7-01 | P0 bloqueo | Demostrado por pruebas/documentos | E01-R6-A sin reserva ni suites | Ejecutar preflight y asignación controlada; NO lanzar E01 sin gate. |
| R7-02 | P0 estabilidad | Demostrado por pruebas | R5 26 timeouts extra por paralela, lag/CPU/RAM medidos | Contraste mismo SHA bajo reserva, dos reproducer de 69 + una integral, sin cambiar workers/timeouts. |
| R7-03 | P1 arquitectura | Demostrado por código; causa rendimiento incierta | crawler/browser.ts y crawler/service.ts lanzan y cierran Chromium por adquisición | Coste bajo carga conocido; no implementar pool ni singleton sin modelo de aislamiento/red/proxy y benchmark. |
| R7-04 | P1 persistencia | Demostrado por código; efecto E01 no aislado | sqlite-knowledge-adapter.ts DatabaseSync, busy_timeout 1000, withWriteFence | Candidato condicional para Worker, conservando CAS/readback/FULL; primero medir tiempo exclusivo de CPU/lock. |
| R7-05 | P1 funcional | Demostrado por código/documentos | discovery.handler.ts rechaza auth; server.ts conserva auth legacy | Discovery autenticado y SPA no existen en contrato canónico; decisión de alcance A/B necesaria. |
| R7-06 | P1 recursos | Riesgo deducible del código, NO probado físicamente | session-resolver.ts crea browser local, solo lo cierra desde browserContext en catch | Si browser.newContext falla, browserContext es null: no hay close del browser lanzado. Hacer test de fallo inyectado y parche try/finally aislado, sin atribuirle E01. |
| R7-07 | P1 mantenibilidad | Demostrado por código | server.ts mantiene dispatcher canónico y bloque legacy en un archivo extenso | Reducir cambios de gran alcance en MVP; desacoplar después de gates, no reescritura previa. |
| R7-08 | P1 integración | Documentado, requiere revalidación contra HEAD de develop | WBS identifica conflicto potencial de exports Knowledge y rutas TC/BVA/update/prune | Ensayo en worktree detached, preservar ambos padres antes del merge; sin copiar módulos a ciegas. |
| R7-09 | P1 calidad | Demostrado por informe R4, no revalidado a HEAD actual | 128 diagnósticos TS históricos, lint global pendiente | Baseline por archivo/línea y delta; no declarar limpio el global. |

Referencias de código:
- [server.ts](https://github.com/Hyouka73/QAMCP/blob/73d51cec2e3d61ea1f981079aab1168b0b87c04b/packages/mcp/src/server.ts)
- [dispatcher.ts](https://github.com/Hyouka73/QAMCP/blob/73d51cec2e3d61ea1f981079aab1168b0b87c04b/packages/mcp/src/dispatcher.ts)
- [DiscoveryHandler](https://github.com/Hyouka73/QAMCP/blob/73d51cec2e3d61ea1f981079aab1168b0b87c04b/packages/mcp/src/handlers/discovery.handler.ts)
- [crawler/browser.ts](https://github.com/Hyouka73/QAMCP/blob/73d51cec2e3d61ea1f981079aab1168b0b87c04b/packages/playwright-adapter/src/crawler/browser.ts)
- [crawler/service.ts](https://github.com/Hyouka73/QAMCP/blob/73d51cec2e3d61ea1f981079aab1168b0b87c04b/packages/playwright-adapter/src/crawler/service.ts)
- [runner.ts](https://github.com/Hyouka73/QAMCP/blob/73d51cec2e3d61ea1f981079aab1168b0b87c04b/packages/playwright-runner/src/runner.ts)
- [sqlite-knowledge-adapter.ts](https://github.com/Hyouka73/QAMCP/blob/73d51cec2e3d61ea1f981079aab1168b0b87c04b/packages/knowledge/src/storage/sqlite-knowledge-adapter.ts)
- [auth-manager.ts](https://github.com/Hyouka73/QAMCP/blob/73d51cec2e3d61ea1f981079aab1168b0b87c04b/packages/auth/src/auth-manager.ts)
- [session-resolver.ts](https://github.com/Hyouka73/QAMCP/blob/73d51cec2e3d61ea1f981079aab1168b0b87c04b/packages/playwright-runner/src/session-resolver.ts)

## E. Comparativa arquitectónica

| Alternativa | Posible mejora | No resuelve | Coste/riesgo MVP | Dictamen |
|---|---|---|---|---|
| A: TS/Node actual con reparaciones focales | Simplificar trabajo repetido que se demuestre, corregir leaks/lifecycle, profiling | Presión externa, Chromium nativo, capacidad del host | Bajo-medio | **Preferir para 20-11**. |
| B: TS + Worker dedicado/servicio SQLite | Quitar DatabaseSync bloqueante del event loop si el perfil lo justifica; CPU pesado paralelizable | Chrome launch/close, IPC overhead, CPU total insuficiente, locks nativos | Medio; requiere protocolo, fencing y regresiones | **Spike condicionado** a mediciones CPU/lag/SQLite y equivalencia física. |
| C: TS + Rust solo componente medido | Posible mejora de serialización/análisis CPU-bound con frontera estrecha | Chromium, red, scheduling externo, FTS5/WAL si el motor es el mismo | Alto por FFI/IPC, builds Linux/Windows y seguridad | **No ahora**; comparar solo con benchmark reproducible. |
| D: Rust extendido | Potencial control de memoria/concurrencia para rediseño de largo plazo | E01 ambiental y dependencia Playwright; reimplementación de MCP, auth, persistencia, consentimiento | Muy alto; perdería avance y certificaría nuevas superficies | **Descartada antes de MVP**. |

Node documenta que Workers sirven para CPU intensiva y no necesariamente para I/O; DatabaseSync es síncrono. Playwright documenta aislamiento de cookies/storage por BrowserContext, pero NO demuestra con ello aislamiento por proceso, proxy/SSRF, barreras de host y cleanup del contrato QAMCP. Una reutilización global de browser requiere un protocolo nuevo y prueba de garantías; no es una optimización aceptada.

Benchmark que cambiaría la decisión: mismo escenario y 506 identidades, mismo SHA y versión de Chrome, capacidad reservada, P50/P95/P99 de cuerpo/hook, lag y memoria comprometida, tiempo launch/close nativo con PID de familia, SQLite CPU/espera lock separados, pruebas negativas de aislamiento, cancelación y durabilidad. Para una alternativa Rust medir adicionalmente costo de FFI/IPC, builds Windows/Linux y resultados funcionales idénticos; no elegir solo por un microbenchmark sintético.

## F. Autenticación y alcance

TM-13/18/27 tienen negativos de seguridad parcialmente comprobables bajo modelo anónimo. TM-14/15/19/30/31/32 requieren definición canónica de login/auth-wall (302 HTML login, login embebido y guard SPA), sin asumir que fallar cerrado equivale a detección positiva. TM-16/17/50 requieren perfil verificado, sesión auténtica, expiración/revocación, consentimiento host y pruebas reales. Todas conservan su identidad histórica FAIL hasta ser implementadas y certificadas.

Decisión de producto pendiente: **A — MVP anónimo expresamente limitado**, apto para demostración controlada y solo bajo aceptación formal; **B — acceso autenticado autorizado por host**, imprescindible si la promesa del MVP incluye aplicaciones privadas o SPA protegidas. No presumir B ni cambiar criterios de A para declarar 506/506. Si se exige B el 20-11, el riesgo de no entrega es alto y debe reconocerse, no esconderse.

## G. Ruta crítica y compuertas, sin cambiar WBS histórico

- 07–09 nov, R7-01: crear contrato y preflight de ejecutor; responsable Gemini, Codex verifica. Reserva de host real es dependencia externa. Sin capacidad acreditada: BLOCKED, no lanzar E01. Mantener fecha oficial 20-11.
- 09–11 nov, R7-02: Codex ejecuta dos reproducer de 69 y una completa bajo ventana válida, comparando fullNames y perfiles; ChatGPT decide causalidad A/B/C de modo acotado. Si se demuestra cuello de producto, encargar **un solo** parche focal a Gemini; si no, registrar requisito operacional y no inventar mejora.
- 11–14 nov, R7-03: Auth A/B: decisión humana de alcance; implementar solo subbloques autorizados y comprobables; negativos primero, positivos solo si B y host autorizado. En paralelo, un agente independiente puede trabajar documentación/reconciliación de integración sin modificar módulos productivos.
- 14–17 nov, R7-04: Codex ejecuta focales, ciclo mínimo real autorizado, build, tsc y lint diferenciales, Stdio. E01 final requiere serial + dos paralelas por 506 identidades, sin timeout adicional y respetando 12 FAIL auth hasta decisión.
- 17–19 nov, R7-05: reconciliación read-only con develop y ensayo en worktree detached; arreglar incompatibilidades solo con gates y propietario de archivo único, no modificar develop.
- 20 nov, R7-06: entregar MVP acotado únicamente si existe evidencia positiva real, consentimiento y aceptación de producto; VNEXT-014 integral no se cierra por demostración parcial.

**Punto exacto para considerar merge a develop:** después de un GO independiente de integración sobre los SHAs precisos de ambos padres, cobertura del flujo MVP realmente prometido, E01 válido para el entorno de entrega, pruebas Stdio y seguridad de scope/auth/SQLite, ausencia de regresiones y aprobación explícita del responsable. Si las compuertas oficiales requieren VNEXT-014 integral, un MVP parcial NO autoriza ese merge; una excepción requeriría decisión formal de alcance y riesgos, no inferencia del auditor. Diferir VNEXT-015 a 023, modernización estética, pool global, Rust, paralelización especulativa y release.

## H. Entrega R7-01 a Gemini Teamwork — prompt listo para ejecutar

ROL: desarrollador y coordinador de infraestructura de diagnóstico, no auditor que certifica sus cambios.

Repositorio Hyouka73/QAMCP, rama feat/qap-vnext-architecture. Verifica el HEAD remoto y lee AGENTS.md, informe E01-R5, E01-R6-A, Plan R6 y este dictamen. Objetivo ÚNICO: producir un preflight operable para un ejecutor dedicado/reservado de E01 sin ejecutar E01 aún.

Distribuye trabajo sin archivos solapados: agente 1 crea docs/vnext/implementaciones/VNEXT-014-E01/r7/CONTRATO_EJECUTOR.md y manifest-ejemplo.json con hostname seudónimo, SHA/hashes dist, Node, pnpm, Chromium, Windows/Linux, CPU/RAM asignadas, cómo se acredita asignación física/VM, ventana y límite de interferencia predeclarados; agente 2 crea r7/preflight.ps1 (Windows, solo lectura, reutiliza r6-a/capacity.ps1 sin editarlo; informa lag/memoria/committed/paginación, gaps, versiones y no acceso a sesiones); agente 3, después de congelar contrato del agente 1, crea r7/check-preflight.mjs y r7/check-preflight.test.mjs con fixtures sintéticos: ausencia de reserva/documento, series incompletas, SHA inconsistente, paginación/interferencia fuera del contrato => FAIL CERRADO; no interpreta CPU baja como garantía de exclusividad. Coordinador añade r7/README.md explicando uso y NO-RUN.

Prohibido modificar código productivo, tests MCP, WBS históricos, scripts r5/r6-a, config Vitest, timeouts 5000/10000, workers, consentimiento, aislamiento, sesiones personales, develop/main/VNEXT-015. No cambiar estados DONE, no instalar dependencias, no crear ramas ni merges, no ejecutar suite 69 ni 506. Los únicos archivos nuevos permitidos son los del r7 recién indicados.

Criterios: documentación comprobable de asignación + telemetría continua al menos 60 s previa y durante ensayos futuros, rechazo de ventanas con gaps o sin reserva verificable; no thresholds inventados a posteriori; datos desensibilizados; pruebas sintéticas positivas y negativas PASS; commit pequeño en rama de trabajo, SHA y enlaces. Si no existe host asignado, entregar herramientas con estado PREPARADO / RESERVA NO ACREDITADA. Publicar evidencia y no proclamar E01 PASS. Entregar a Codex el SHA exacto.

## I. Entrega R7-01 a Codex — prompt de validación

ROL: QA independiente. Repositorio Hyouka73/QAMCP; rama feat/qap-vnext-architecture. Consulta HEAD remoto real, informe R5, R6-A, Plan R6, CONTRATO_EJECUTOR.md y SHA del commit de Gemini. No modifiques scripts, tests para aprobarlos ni ficheros de sesión personales; verifica worktree y hash de fuentes sin leer contenido sensible.

PRIMER GATE: confirmar que r7/check-preflight.test.mjs pasa con Node y que los negativos rechazan ausencia de reserva, gaps, hashes distintos y saturación. Verifica que los scripts son read-only, no cierran procesos de usuario ni interpretan muestras favorables como propiedad exclusiva del ejecutor. Comprueba contrato operativo y evidencias de capacidad realmente asignada, mínimo 60 s de observación continua previa y monitorización durante la ventana. Si no hay reserva acreditada, registra BLOCKED ambiental, NO EJECUTES E01 y publica informe en r7 con commit documental, sin un 0/0 presentado como PASS.

SOLO SI EL GATE ES VÁLIDO: fija SHA productivo y hashes dist y comprueba comparabilidad con R5, ejecuta exactamente las mismas 69 identidades en dos corridas consecutivas con defaults originales, una MCP paralela completa de 506 sin filtros (segunda completa solo con motivo), jamás suites simultáneas; registra cuerpo/hooks, waits, PID padre/hijos, browser close-salida-perfil, cancelación, lag, RAM/CPU comprometida propia/ajena agregada, I/O/SQLite sin confundir commit y espera de lock. Conserva logs y manifiestos; compara por fullName y ordinal, 12 auth históricos, 26 timeouts por paralela de referencia, PASS/FAIL/SKIP, y clasificación A/B/C sin forzar causalidad. Usa scripts r5 existentes solo si cumplen esta carga; si no, documenta limitación y detente, no edites tests ni tiempos.

Para GO E01 final, además de diagnóstico, una campaña independiente posterior exige 506 identidades en serial y dos paralelas consecutivas, con los actuales 12 históricos auth separados, cero timeouts extra, lifecycle 10/10 por corrida y garantías de recursos/cleanup. Ningún resultado de estos ensayos concede automáticamente GO a VNEXT-014 integral ni merge. Publica reporte por SHA, errores, evidencia y límites en rama de trabajo; no inventes ejecuciones.

## J. Limitaciones de esta auditoría

No se ejecutó Node, Chromium, Vitest, CI, benchmarks nativos ni pruebas en una VM reservada durante esta auditoría. Los dictámenes físicos proceden de informes de Codex fijados por SHA y se distinguen de la lectura estática hecha aquí. No se revisaron exhaustivamente todos los handlers y fixtures del monorepo; se inspeccionaron rutas representativas productivas, contratos, documentos y señales de riesgo. La compuerta de rendimiento sigue pendiente de evidencia física en un ejecutor adecuado. Toda hipótesis de mejora Rust/Workers requiere experimento, no se cuantifica ganancia no observada.
