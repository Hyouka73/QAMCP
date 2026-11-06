# Pendientes verificables

Esta entrega es el Lote 1 autorizado como unidad completa de implementación. La modernización total sigue abierta.

| Lote | Archivo | Identidades históricas pendientes | Próxima evidencia |
| --- | --- | --- | --- |
| 2 | p3-verification.test.ts + p3-canonical-discovery.test.ts | 5 modernizadas en código; certificación física pendiente | Ejecutar focal y contrastar errores/tiempos reales contra TM-06..TM-10. |
| 3 | p4-2-pregunta-contract.test.ts + p4-2-canonical-contract.test.ts | 2 modernizadas en código; certificación física pendiente | Ejecutar focal y contrastar Pregunta, revisión, WRAP_UP y no promoción TM-11..TM-12. |
| 4 | p4-4-auth-lifecycle.test.ts | 7 | Clasificar soporte efectivo de fresh_anonymous_static; negativos de rutas protegidas, sesión/credenciales y ausencia de escrituras. Auth real no implementada por este lote. |
| 5 | p4-5a-integrity.test.ts + p4-5a-canonical-integrity.test.ts | 9 modernizadas, 1 pendiente (TM-27) | Ejecutar focal; preservar compuerta SCOPING auth-roles sin reducirla a bloqueo de Discovery. |
| 6 | p4-5a2-integrity.test.ts + p4-5a2-canonical-integrity.test.ts | 13 modernizadas, 3 pendientes (TM-30..TM-32) | Ejecutar focal y verificar contrato de auth_wall/login/guard, que no existe como respuesta canónica equivalente. |
| 7 | server.test.ts + server-canonical-discovery.test.ts | 4 modernizadas en código y 6 restantes (TM-46, TM-50, TM-52..TM-55) | Ejecutar nuevos casos y modernizar seis restantes sin perder positivos qap_plan/qap_test o auth. |

Quedan 17 identidades sin reemplazo: TM-13..TM-19 (7), TM-27 (1), TM-30..TM-32 (3), TM-46, TM-50 y TM-52..TM-55 (6). Hay 33 modernizadas después del Lote 1 (38 de las 55 en total), pendientes de ejecución física; A+C provisional no equivale a PASS. Su primer error físico se conserva; no se usa como prueba de equivalencia ni de defecto productivo.

E01 sigue abierto: el baseline serial pasa las garantías de concurrencia existentes, pero eso no demuestra estabilidad bajo carga. Se requiere instrumentación por arranque/contexto de Chromium, carga del runner, esperas de locks/SQLite/crawler/hooks y cleanup. No se incrementan presupuestos ni se cambian workers para obtener resultados verdes. Los ensayos paralelos de esta entrega, cuando figuren en RESULTADOS, son observaciones físicas y no una reparación causal de E01.

Quedan fuera de certificación: revisión humana auténtica; E2E oficial del host desplegado; propagación de deadlines por wrappers externos no soportados (A04-W01); deuda ESLint/TypeScript heredada; compuertas oficiales VNEXT-014 e integración a develop. VNEXT-015 no se modifica.

## Siguiente compuerta de verificación (sin certificar)

Ejecutar las dos nuevas suites P3 y P4.2, después todos los tests MCP en serie y con paralelismo predeterminado, build y tsc/lint diferenciales. No cambiar 5000 ms por conveniencia. Registrar JSON por identidad con commit exacto, distinguir regresiones nuevas, infraestructura y fallos legacy. Solo tras esa ejecución reemplazar en `evidencia/matriz-55.json` los valores históricos por **campos adicionales de verificación** (preservar baseline). Luego avanzar lotes 5/6 integridad, 7 server y 4 auth conforme prioridad expresada por el usuario. No pedir Codex aún: faltan 43 identidades de código y la auditoría independiente final.

## Compromisos pendientes tras integrar 22 pruebas de integridad

No se certifican P4.5-A/A2 antes de las nuevas corridas físicas (incluyendo grupos originales todavía activos) ni se declara equivalente una auth_wall de SPA a una adquisición anónima. La suite y matriz conservan los títulos históricos. Si una prueba canónica falla, corregir el arnés o defecto real según la evidencia; no cambiar las aserciones a `blocked` para lograr PASS. Los presupuestos E01 quedan 5000/10000ms sin ajuste.

## Actualización server (TM-47/48/49/51)

Commit `7303351`: cuatro casos migrados con fullName histórico. Se requiere ejecución focal del archivo nuevo y `server.test.ts` restante, además de diferencial por identidad. No retirar TM-50 ni pruebas de autenticación por no disponer de `auth_wall`/sesión autenticada en el contrato del crawler anónimo. La falta de ejecución impide rebajar oficialmente los 50 fallos históricos del último baseline.
