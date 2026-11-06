# Pendientes verificables

Esta entrega es el Lote 1 autorizado como unidad completa de implementación. La modernización total sigue abierta.

| Lote | Archivo | Identidades históricas pendientes | Próxima evidencia |
| --- | --- | --- | --- |
| 2 | p3-verification.test.ts | 5 | Autorización, asociación, observaciones idempotentes, sin requisitos automáticos, fallo de navegador honesto y continuidad. |
| 3 | p4-2-pregunta-contract.test.ts | 2 | Contrato de preguntas, categorías, opciones y continuidad; texto libre sin autoridad. |
| 4 | p4-4-auth-lifecycle.test.ts | 7 | Clasificar soporte efectivo de fresh_anonymous_static; negativos de rutas protegidas, sesión/credenciales y ausencia de escrituras. Auth real no implementada por este lote. |
| 5 | p4-5a-integrity.test.ts | 10 | Integridad epistemológica, sustantividad, cobertura, aceptación de brechas y persistencia/revisión. |
| 6 | p4-5a2-integrity.test.ts | 16 | Clasificación/ incertidumbre, borradores, preguntas/opciones, revisión humana y no persistencia espuria. |
| 7 | server.test.ts | 10 | Esquemas/errores/aislamiento/estados y sustitución por contratos vigentes con prueba positiva equivalente. |

Las 50 filas pendientes de MATRIZ_55 no tienen aún una disposición A–F definitiva. Su primer error físico se conserva; no se usa como prueba de equivalencia ni de defecto productivo.

E01 sigue abierto: el baseline serial pasa las garantías de concurrencia existentes, pero eso no demuestra estabilidad bajo carga. Se requiere instrumentación por arranque/contexto de Chromium, carga del runner, esperas de locks/SQLite/crawler/hooks y cleanup. No se incrementan presupuestos ni se cambian workers para obtener resultados verdes. Los ensayos paralelos de esta entrega, cuando figuren en RESULTADOS, son observaciones físicas y no una reparación causal de E01.

Quedan fuera de certificación: revisión humana auténtica; E2E oficial del host desplegado; propagación de deadlines por wrappers externos no soportados (A04-W01); deuda ESLint/TypeScript heredada; compuertas oficiales VNEXT-014 e integración a develop. VNEXT-015 no se modifica.
