# VNEXT-014 / E01 — correcciones y límite residual, 2026-11-06

**E01 permanece abierto. VNEXT-014 continúa NO-GO.** Se publican correcciones reproducidas; no se certifica estabilidad paralela integral. P3 y los lotes 2–7 están detenidos. Rama única: `feat/qap-vnext-architecture`; HEAD remoto/local inicial verificado: `26143382d1262b2ef9cbeb02f8773148e4439ebc`.

Correcciones publicadas en [`f76584dab89d9524d60656b7a88aea8aa4495134`](https://github.com/Hyouka73/QAMCP/commit/f76584dab89d9524d60656b7a88aea8aa4495134). La evidencia se publica en el commit documental posterior de la misma rama; los intentos y límites residuales se conservan.

## Causas demostradas y cambios

1. **Recompilación síncrona de schemas.** Cada `new SchemaValidator()` compilaba los 15 schemas aunque solo validara un contexto. En ocho archivos paralelos se midieron 3,435 compilaciones / 29,729 ms acumulados frente a 70 ms de validación. Con caché de código compilado por módulo/proceso: 120 compilaciones / 1,406 ms; ninguna validación se omite. Las opciones AJV, schemas, aliases y traducción de errores permanecen iguales. El resultado/errores se materializa sincrónicamente por llamada, antes de reutilizar la función. No se cachean datos, autoridad, revisions, resultados ni decisiones. La regresión Shared alterna entradas válidas/inválidas entre instancias, conserva errores anteriores y comprueba que mutarlos no afecta otra validación.
2. **Inicialización innecesaria de runtimes.** Importar Adapter/Runner cargaba Playwright también en consumidores de estado/contratos. Se difiere el driver hasta el arranque real y el preflight consulta primero los binarios del sistema que ya aceptaba. No cambia la selección del navegador al ejecutar, aislamiento, canales, proxy, auth, SSRF ni política de navegación. Mediciones aisladas del proceso de importación: Adapter ~404→46 ms, RSS al terminar las importaciones ~195→93 MB; después de diferir también el compilador canónico de escritura, RSS ~62 MB. Los [logs de importación](evidencia/lazy-import.log) y [segunda medición](evidencia/lazy-knowledge-import.log) contienen los resultados finales; los valores iniciales son la medición de consola de esta intervención, no una corrida de Vitest. Las pruebas nuevas impiden cargar el driver durante un import de contratos. La validación canónica de escritura se compila una vez, al primer write y **antes** del `BEGIN` del adapter; todos sus checks siguen activos.
3. **Cierre de transporte sin drenaje del trabajo servidor.** En la primera traza completa quedaron abiertos un `crawler.run` y un `context.newPage` del primer caso lifecycle al terminar el archivo. El fixture cerraba cliente/servidor y eliminaba sus stores/temporales, pero el SDK no esperaba a sus handlers. `server.close()` ahora bloquea nuevas invocaciones, aborta las activas y espera su asentamiento antes de cerrar el transporte. El cierre Stdio espera ese drenaje antes de cerrar los stores del host. No se liberan anticipadamente locks. Una regresión por SDK real retiene un lock físico, comprueba abort, rechazo de una segunda llamada, espera del close y escritura final antes de liberar el lock/eliminar el root.

No se cambiaron las 50 expectativas legacy, configuración Vitest, workers, límites, retries ni timeouts. No hay skips nuevos, mocks de navegador para sustituir E2E, caches de autorización ni funcionalidades nuevas. Cada adquisición sigue usando su navegador/contexto/proxy aislado; compartirlos entre solicitudes no está justificado por este contrato.

## Comparación por identidad

La base es el MCP serial publicado de 505 tests: 455 PASS / 50 FAIL. La nueva identidad es únicamente la regresión de drenaje. [Comparación ejecutable](evidencia/comparison.json): archivo + fullName + ordinal; cero identidades eliminadas, cero expectativas históricas recuperadas mediante cambios de contrato en esta entrega.

| Corrida | PASS / FAIL / total | Fallos adicionales frente a las 50 identidades pendientes |
| --- | --- | --- |
| Focal inicial lifecycle + TestHandler, sin instrumentación | 31 / 0 / 31 | 0 |
| Ocho archivos antes, sin instrumentación | 182 / 9 / 191 | 2 lifecycle |
| Ocho archivos después de caché, instrumentados | 184 / 7 / 191 | 0; lifecycle10/10, TestHandler21/21 |
| Completa antes, instrumentada | 444 / 61 / 505 | 11 |
| Completa solo caché, sin instrumentación | 447 / 58 / 505 | 8 |
| Final paralela normal 1 | 453 / 53 / 506 | E0a, E0b, E1 |
| Final paralela normal 2, consecutiva | 452 / 54 / 506 | E0a, E0b, E1, Criterio9 |
| Final serial | 456 / 50 / 506 | 0 |
| Final completa instrumentada | 452 / 54 / 506 | E0a, E0b, E1, Criterio9 |
| Focal final lifecycle/TestHandler/host/drain | 47 / 0 / 47 | 0 |

Las dos finales normales se ejecutaron secuencialmente, sin build/otras suites simultáneas; el muestreador del host acompañó la primera. En ambas, TestHandler21/21 y las otras 50 identidades FAIL históricas permanecen. En serie: 455 PASS anteriores conservados + 1 alta PASS, 50 FAIL conservados, cero PASS→FAIL y cero bajas. Pending/todo = 0. Los fullNames y errores completos están en los JSON, no se clasifican por contador solamente.

El serial final coincidió parcialmente con un chequeo focal ESLint; pasó igualmente sin altas. No se usa su duración como benchmark de aislamiento. Los focales iniciales y la comparación de ocho archivos se ejecutaron antes de lanzar toda la suite, como se solicitó.

## Etapas y recursos

[Trazas brutas y agregación](evidencia/stage-summary.json) incluyen wall time, CPU del proceso, p50/p95/máximo, spans incompletos y lag del event loop. Los spans anidados o superpuestos **no se suman** para calcular duración de un test. CPU de Node no incluye la CPU de los procesos Chromium. [Muestreo Windows](evidencia/host-summary.json) mide CPU, memoria, paginación, disco, cantidad y working set de procesos; incluye procesos ajenos, que no se cerraron ni modificaron.

| Etapa, suite completa | Antes: cantidad / total ms / máx ms | Final: cantidad / total ms / máx ms |
| --- | --- | --- |
| Compilación de schemas observada | 6,345 / 85,098 / 265 | 263 / 12,891 / 1,145 |
| Validación SchemaValidator | 397 / 186 / 14 | 458 / 224 / 39 |
| Chromium launch | 46 / 29,798 / 2,406 | 47 / 26,269 / 1,075 |
| Nuevo contexto | 45 / 4,836 / 447 | 46 / 5,182 / 390 |
| Nueva página | 44 / 16,648 / 832 | 46 / 16,607 / 674 |
| Browser close | 44 / 77,199 / 8,518 | 46 / 34,722 / 4,175 |
| Crawler completo | 26 / 72,064 / 11,823 | 28 / 50,509 / 4,375 |
| Lock de módulo | 10 / 382 / 84 | 11 / 608 / 186 |
| Runner completo | 9 / 26,526 / 6,202 | 9 / 15,959 / 3,141 |

Las cantidades difieren por aborts/tests terminados y la nueva regresión; la primera traza no interceptaba compilación de imports anteriores al setup. La final instala probes de navegador solo en los cinco archivos que realmente lo usan, para no volver a cargar el driver en todos los workers. Estos cambios del observador impiden atribuir cada diferencia de tiempo a una única corrección. Las dos finales **sin instrumentación** son la comprobación decisiva de aceptación; ambas fallan E01.

Instrumentación adicional final: SQLite open558, p95~5.54 ms, máximo49.84 ms; fixture prepare10, p50~129.74 ms, máximo1,529 ms; fixture cleanup10, p50~48.64 ms, máximo544.08 ms; abort51, máximo8.60 ms. SQLite exec se conserva con commits durables/FULL, escrituras y fences; algunos conflictos/busy de ~1s son casos de prueba deliberados, no evidencia de un deadlock global. No se redujo durabilidad para acelerar.

Antes: CPU100%, mínimo11 MB disponibles, hasta64,185 páginas/s de entrada y cola de disco58. Final normal1: CPU100%, mínimo1,569 MB, hasta1,175 páginas/s y cola2; final instrumentada: mínimo2,005 MB, hasta732 páginas/s y cola1. Son ventanas de muestreo, no certificación continua. Se alivió la presión de memoria/paginación; persiste saturación de CPU y trabajo nativo de navegador.

El [debug de Playwright](evidencia/browser-debug.log) y su [extracción](evidencia/browser-shutdown.json) separan cierre→salida del proceso y salida→borrado del perfil: se observaron salidas de hasta3,511 ms con ~64 ms de borrado posterior. No se atribuye a SQLite ni a borrado de temporales ese tramo. No hubo un deadlock reproducido: los spans finales asentaron; la demora nativa crece con la carga. La causa de la latencia **interna** de apagado de Chrome (threads del navegador, scheduling/kernel o inspección del sistema) no está perfilada hasta su stack; no se presenta una inferencia como prueba de un bug de Chrome.

## Cleanup y seguridad

Final instrumentada: cero spans incompletos; 10 prepares y 10 cleanups lifecycle terminados; cero errores de hook/Unhandled/ECOMPROMISED en las dos finales normales y en la instrumentada. La regresión de close comprueba físicamente que el root/lock siguen vivos mientras hay trabajo y que el lock desaparece antes de borrar. El fixture valida schema lifecycle tras cada llamada y PRAGMA de las tres bases, persistencia, CAS, rechazos de autorización y revisión independiente.

Hay líneas ENOENT esperadas en el test legacy que intenta leer `rules.yaml` inexistente (`p4-5a-integrity`); ya pertenecen a las 50 identidades históricas. No se silencian ni se describen como accesos posteriores a cleanup. La ausencia de spans abiertos/logs unhandled prueba el arnés observado, no todo comportamiento externo posible. No se repitió aquí la ejecución de **dos suites completas simultáneas** del lote anterior; no queda certificada con estas dos corridas consecutivas.

## Verificación y reproducción

| Comprobación adicional | Resultado final | Evidencia |
| --- | --- | --- |
| Build10 paquetes | PASS, exit0 | [build-final.log](evidencia/build-final.log) |
| Engine | 168 PASS | [engine.log](evidencia/engine.log) |
| Knowledge | 342 PASS | [knowledge.log](evidencia/knowledge.log) |
| Runner | 74 PASS (incluye nueva regresión lazy import) | [runner.log](evidencia/runner.log) |
| CLI | 78 PASS | [cli.log](evidencia/cli.log) |
| Shared | 163 PASS (incluye nueva regresión de schemas) | [shared.log](evidencia/shared.log) |
| Host/dispatcher/drain tras build | 54 PASS | [host-drain.log](evidencia/host-drain.log) |
| Adapter completo, paralelismo normal | **163 PASS / 2 FAIL** de165 | [adapter.log](evidencia/adapter.log) |
| Adapter focal de los dos archivos fallidos | 37 PASS / 0 FAIL | [JSON](evidencia/adapter-focal.json), [log](evidencia/adapter-focal.log) |
| TypeScript MCP | 121→121; cero altas; global FAIL histórico | [diferencial](evidencia/typecheck.json), [log](evidencia/typecheck-verified.log) |
| ESLint14 archivos cambiados | cero errores/advertencias | [JSON](evidencia/final-eslint.json) |

Los dos FAIL Adapter son `active-probes: blocks all action egress...` (timeout25000 ms) y `auth-classification: SPA con skeleton...` (observó2 botones frente a0). Pasan en el reintento de ambos archivos, sin cambiar sus expectativas. No hay medición baseline completa del Adapter en esta intervención que permita atribuirlos o descartarlos como regresiones: **su estabilidad completa sigue sin certificar**, y se incorpora al límite residual E01. Las pruebas de egress sí se ejecutaron físicamente en el focal PASS. No se ocultan los dos FAIL mediante ese reintento.

El [manifest original](evidencia/verification-manifest.json) conserva build exit1 y Adapter exit1. El build falló por inferencia TypeScript de una respuesta interna al añadir el wrapper tipado; se corrigió únicamente la anotación `Promise<CallToolResult>` del callback y se repitió el build completo hasta PASS. [Primer intento](evidencia/build.log), [corrección aún fallida](evidencia/build-corrected.log), [build final](evidencia/build-final.log). Las anotaciones posteriores a las dos corridas MCP no alteran el JavaScript ejecutado; el focal final verifica el build final. También se conserva un primer script TypeScript con base de resolución incorrecta, corregido para usar configPath absoluto:560/565 no es el diferencial válido; el resultado válido es121/121. La deuda global histórica no se declara verde.

```powershell
& docs/vnext/implementaciones/VNEXT-014-E01/evidencia/run.ps1 -Name reproduce-focal -Filters @('lifecycle-v3-e2e','test-handler')
& docs/vnext/implementaciones/VNEXT-014-E01/evidencia/run.ps1 -Name reproduce-parallel
& docs/vnext/implementaciones/VNEXT-014-E01/evidencia/run.ps1 -Name reproduce-serial -Serial
& docs/vnext/implementaciones/VNEXT-014-E01/evidencia/run.ps1 -Name reproduce-stages -Instrumented
& docs/vnext/implementaciones/VNEXT-014-E01/evidencia/verify.ps1
node docs/vnext/implementaciones/VNEXT-014-E01/evidencia/report.mjs
node docs/vnext/implementaciones/VNEXT-014-E01/evidencia/stages.mjs
```

El config de diagnóstico añade únicamente setupFiles; las verificaciones normales no lo cargan. No se variaron workers ni budgets ni siquiera durante este diagnóstico. Se conserva un intento que no arrancó por ruta incorrecta del import de Vitest, y el primer observer de ocho archivos cargaba TestHandler antes de un mock de fs: su fallo adicional de inyección en state-handlers es artefacto del observer, corregido quitando ese import; no aparece en corridas normales/finales. El primer aislado escribía cada span síncronamente y no se usa como benchmark preciso; las trazas siguientes bufferizan en memoria y escriben al finalizar cada archivo.

Las90 trazas JSONL se publican comprimidas sin pérdida (`.jsonl.gz`, ~57.6 MB→7.5 MB); cada compresión se verificó por descompresión idéntica antes de retirar el bruto local. `stages.mjs` lee ambos formatos. Los snapshots de protocolos contienen solo etapas/tiempos/códigos, sin argumentos, tokens, cookies ni contenido del archivo personal. Los logs de navegador incluyen rutas de sus perfiles temporales de prueba. Los hashes publicados permiten verificar los bytes Git después de la normalización de finales de línea.

## Pendiente exacto / decisión

**No se cumplen lifecycle10/10 en toda la suite paralela ni dos MCP consecutivos sin altas.** E0a/E0b/E1 son reproducibles en ambas finales; Criterio9 agrega un fallo en la segunda. En la traza final, `qap_discover` lifecycle llega a4,094 ms y la cadena completa de init/context/plan/discovery/entrevista puede exceder5000 ms; el drenaje continúa y termina correctamente. La duración JSON puede incluir hooks y por eso 8,735 ms no significa que se haya configurado un timeout nuevo.

Siguiente trabajo E01: perfil nativo/scheduling de la salida de Chromium durante esa ventana, con correlación por PID y casos E0a/E0b/E1/Criterio9; contrastar en un host con reserva CPU/RAM conocida, conservando workers normales, antes de certificar un presupuesto o introducir reutilización de navegador. Falta demostrar una corrección segura de ese tramo que elimine las cuatro altas sin alterar aislamiento, y repetir dos corridas limpias. [Decisión técnica separada](DECISION_PRESUPUESTO.md). P3 y los lotes 2–7 no se reanudan. VNEXT-015 y el archivo personal `admin-user.json` no se modifican.
