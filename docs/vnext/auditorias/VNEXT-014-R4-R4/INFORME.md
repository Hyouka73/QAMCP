# QAMCP VNEXT-014 · Auditoría independiente R4-R4

**Dictamen NO-GO.** R4-R3-A01 quedó corregido en los siete casos negativos y el control positivo de un módulo pasó. Una sonda adicional confirmó R4-R4-A02, un falso pendiente de cierre cuando los 17 módulos vinculados tienen un waiver válido. Siguen abiertos los 55 casos MCP históricos y el lint global.

**SHA de código auditado** `9df524501eb2365df9f204f2134bd86ebdc36717`, rama `feat/qap-vnext-architecture`, 2026-11-04 (Ciudad de México). Baseline de pruebas `7e0142a97c67fa1c65c46a83e2a5f003b0b435cd`. Las mediciones preceden al commit de publicación.

| Compuerta | Resultado físico R4-R4 | Salida |
| --- | --- | ---: |
| Build | 10 paquetes | 0 |
| Focal R4-R3 | 7/7 | 0 |
| Focal R4-R4 | 1/1 | 0 |
| Canonical Coverage | 34/34, incluidos Crash 2/3 y R4-R2-A01 | 0 |
| DiscoveryHandler | 59/59 en la primera ejecución | 0 |
| MCP integral serial | 402 PASS / 55 FAIL de 457. 16 suites PASS y 7 FAIL | 1 |
| Playwright Runner | 71/71 en 10 suites | 0 |
| ESLint focal | 0 errores / 0 advertencias | 0 |
| Lint global | 34 errores / 28 advertencias frente a 35 / 28 | 1 |
| Stdio | 18 herramientas y qap_init real sobre fixture | 0 |
| Sonda adicional | 16 válidos PASS, 17 válidos FAIL en guidance | 0 / 1 |

El diferencial compara el JSON completo contra el reintento integral R4-R3 por archivo y título. Los 401 PASS y los 55 FAIL comunes conservaron su resultado. La única alta fue R4-R4-A01 y pasó. La sonda adicional es independiente del total Vitest. [Diferencial MCP](DIFERENCIAL_MCP.md)

**R4-R4-A02 (P2).** Con 17 waivers durables válidos, `qap_status` recomendó `qap_module_close` para el módulo 17. El cierre efectivo llegó a WRAP_UP, produjo reporte y no consultó al gateway. `StatusHandler.execute` solo acredita los primeros 16 vínculos porque comparte el límite del inventario con la verificación de pendientes. [Reproducción y evidencia](EVIDENCIA_STATUS.md)

`preserve-caught-error` quedó corregido en `canonical-closure-service.ts:754` al adjuntar `Error.cause`. [Diagnósticos globales](LINT.md)

Se usó un worktree aislado con Node 24, SQLite FTS5, lockfile congelado y Chromium. Los hashes de contenido de la sesión protegida coincidieron antes y después en ambos checkouts. [Comandos, entorno e inventario de originales](COMANDOS.md)
