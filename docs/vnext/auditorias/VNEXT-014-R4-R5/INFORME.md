# QAMCP VNEXT-014 · Auditoría independiente R4-R5

**R4-R4-A02 verificado. VNEXT-014 NO-GO.** Las tres variantes físicas de 16/17 módulos pasaron. Los 55 fallos MCP históricos y el lint global mantienen abiertas las compuertas de la entrega.

SHA de código auditado `f531e4e6b444c06ad85fd1f5f533837fd3467145`, rama `feat/qap-vnext-architecture`. Ejecución física el 2026-11-04 (Ciudad de México), sobre worktree aislado con Node 24.15.0, SQLite 3.51.3 FTS5, lockfile congelado y Chromium 153.0.8010.12. Baseline R4-R4 `9df524501eb2365df9f204f2134bd86ebdc36717`. Las mediciones preceden al commit documental.

| Compuerta | Resultado medido | Salida |
| --- | --- | ---: |
| Build | 10 paquetes compilados | 0 |
| Focal R4-R5-A02 | 3/3 | 0 |
| Canonical Coverage | 37/37 | 0 |
| DiscoveryHandler | 59/59 | 0 |
| MCP integral serial | 405 PASS / 55 FAIL de 460, 16 suites PASS y 7 FAIL | 1 |
| Playwright Runner | 71/71 | 0 |
| ESLint focal | 0 errores / 0 advertencias | 0 |
| Lint global | 34 errores / 28 advertencias | 1 |
| Stdio | 18 herramientas y qap_init real | 0 |
| Sonda SDK independiente | 16 válidos, 17 válidos y último inválido, los tres PASS | 0 |

Los 402 PASS y los 55 FAIL comunes conservaron su resultado por archivo y título. Las únicas tres altas fueron los escenarios R4-R5-A02 y los tres pasaron. No hubo nuevas regresiones en la matriz medida. [Diferencial y suites](DIFERENCIAL_MCP.md)

Con 16 o 17 waivers válidos, status recomendó cerrar y la sesión alcanzó WRAP_UP con reporte físico. Con 17 y la última aprobación ausente, status identificó module-17, el cierre permaneció bloqueado en WORKING y no apareció reporte. Los snapshots de autorización permanecieron intactos y las sondas registraron cero consultas al gateway. [Evidencia y reproducción](EVIDENCIA_STATUS.md)

Los 55 fallos se clasificaron por suite, primera aserción, respuesta observada, contrato original y diferencia con el contrato vigente. Los cinco lifecycle siguen sin certificar el recorrido completo de entrevista, closed real, reporte y replanificación. Varias primeras causas son fixtures sin binding o entrevistas legacy sin contexto. Los rechazos seguros no acreditan las garantías posteriores. [Clasificación de los 55](CLASIFICACION_55_FALLOS.md)

Los hashes de contenido del archivo de sesión protegido coincidieron antes y después en los dos checkouts. El checkout original conservó su archivo ajeno. [Comandos e inventario de logs](COMANDOS.md) · [Lint por línea y regla](LINT.md)
