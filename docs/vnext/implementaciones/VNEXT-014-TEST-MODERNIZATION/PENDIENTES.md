# Pendientes verificables

Esta entrega es el Lote 1 autorizado como unidad completa de implementación. La modernización total sigue abierta.

| Lote | Archivo | Identidades históricas pendientes | Próxima evidencia |
| --- | --- | --- | --- |
| 2 | p3-verification.test.ts + p3-canonical-discovery.test.ts | 5 modernizadas en código; certificación física pendiente | Ejecutar focal y contrastar errores/tiempos reales contra TM-06..TM-10. |
| 3 | p4-2-pregunta-contract.test.ts + p4-2-canonical-contract.test.ts | 2 modernizadas en código; certificación física pendiente | Ejecutar focal y contrastar Pregunta, revisión, WRAP_UP y no promoción TM-11..TM-12. |
| 4 | p4-4-auth-lifecycle.test.ts | 7 | Clasificar soporte efectivo de fresh_anonymous_static; negativos de rutas protegidas, sesión/credenciales y ausencia de escrituras. Auth real no implementada por este lote. |
| 5 | p4-5a-integrity.test.ts | 10 | Integridad epistemológica, sustantividad, cobertura, aceptación de brechas y persistencia/revisión. |
| 6 | p4-5a2-integrity.test.ts | 16 | Clasificación/ incertidumbre, borradores, preguntas/opciones, revisión humana y no persistencia espuria. |
| 7 | server.test.ts | 10 | Esquemas/errores/aislamiento/estados y sustitución por contratos vigentes con prueba positiva equivalente. |

Las 43 filas de los lotes 4–7 siguen sin modernización ni disposición A–F definitiva. Las siete filas P3/P4.2 se clasifican provisionalmente A+C, pero su resultado físico sigue pendiente. Su primer error físico se conserva; no se usa como prueba de equivalencia ni de defecto productivo.

E01 sigue abierto: el baseline serial pasa las garantías de concurrencia existentes, pero eso no demuestra estabilidad bajo carga. Se requiere instrumentación por arranque/contexto de Chromium, carga del runner, esperas de locks/SQLite/crawler/hooks y cleanup. No se incrementan presupuestos ni se cambian workers para obtener resultados verdes. Los ensayos paralelos de esta entrega, cuando figuren en RESULTADOS, son observaciones físicas y no una reparación causal de E01.

Quedan fuera de certificación: revisión humana auténtica; E2E oficial del host desplegado; propagación de deadlines por wrappers externos no soportados (A04-W01); deuda ESLint/TypeScript heredada; compuertas oficiales VNEXT-014 e integración a develop. VNEXT-015 no se modifica.

## Siguiente compuerta de verificación (sin certificar)

Ejecutar las dos nuevas suites P3 y P4.2, después todos los tests MCP en serie y con paralelismo predeterminado, build y tsc/lint diferenciales. No cambiar 5000 ms por conveniencia. Registrar JSON por identidad con commit exacto, distinguir regresiones nuevas, infraestructura y fallos legacy. Solo tras esa ejecución reemplazar en `evidencia/matriz-55.json` los valores históricos por **campos adicionales de verificación** (preservar baseline). Luego avanzar lotes 5/6 integridad, 7 server y 4 auth conforme prioridad expresada por el usuario. No pedir Codex aún: faltan 43 identidades de código y la auditoría independiente final.
