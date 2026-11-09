# INT-03 + DEV-MVP-01-R4 — candidato consolidado y dictamen independiente

Fecha: 2026-11-09 (America/Mexico_City).

**R4: GO para integrar. Integración: NO-GO para certificar un candidato técnico estable. MVP funcional integral: NO-GO.** El cierre técnico de la corrección DEV-MVP-01-R4 queda acreditado; el cierre del MVP funcional no se acredita.

Este checkout es un merge local de dos padres: INT-03 `18199e0c036ab53c6d0f7af0a9f65740eb0aec89` primero y DEV-MVP-01-R4 `d49297a36f0340d46108553bb1e7989c66549eb1` segundo. Se conserva toda la genealogía R1/R2/R3/R4 y la de INT-03. El SHA de este merge se consulta con `git rev-parse HEAD`. No se publicó, no hubo push ni se movió develop.

## Auditoría R4

Los originales se verificaron físicamente y permanecieron limpios en sus SHA declarados. Build y pruebas se ejecutaron exclusivamente en checkouts auxiliares. Los tres arneses externos se copiaron sin alterar una sola línea; hashes comparados y estructura de rutas relativas preservada mediante junctions hacia los checkouts auxiliares.

| Verificación R4 | Resultado |
| --- | --- |
| exact-verification.mjs | 19/19 |
| browser-r3.mjs | 20/20 comprobaciones numéricas en Edge |
| reproduce.mjs | 9/9, incluido rechazo de HTTP 500 como denegación |
| Cinco suites focales BVA/RBAC | 179/179 |
| Knowledge | 528/528, 34 archivos |
| Build | PASS |
| Lint | 64 errores y 23 advertencias heredados fuera de los archivos R4 |

Para `min=20,max=20` se verificó la secuencia `19/error`, `20/success`, `20/success`, `20/success`, `21/error`. Los cinco casos pasan contra la implementación correcta usando el executeAssert oficial; el mutante que pierde min falla en 19. Se revisaron también duplicados separados por coma/punto y coma, notación exponencial, step, alineación, longitudes, contradicciones y procedencia/identidad RBAC. No se reprodujo P0/P1 directamente relacionado con R4.

El exit 0 de browser-r3 no basta para certificar sus resultados: se inspeccionaron explícitamente numericFailed=0, los cinco runnerPassed=true correctos y runnerPassed=false para el mutante/19.

## Conflictos y contrato consolidado

Git produjo conflictos solo en `packages/knowledge/src/plan/bva-generator.ts` y `rbac-generator.ts`: cinco hunks en cada archivo. Se resolvieron por hunk, sin reemplazar archivos completos con una versión de un padre.

- BVA: tokenización completa R4, detección de contradicciones, decimales/step, longitudes materializadas y selectores explícitos. Se conserva el límite INT-03 de fronteras numéricas representables y se prueba con reglas confiables, sin eludirlo mediante una entrada DOM filtrada.
- RBAC: fundamentación en la regla y evidencia positiva de denegación R4; no se recuperan los permisos inferidos desde users ni el body-as-authorization. Perfiles ambiguos se rechazan.
- Ambos generadores conservan `candidate` y `blocked_missing_oracle` de INT-03. Los textos indican aprobación canónica pendiente. Oráculo generado no equivale a autoridad canónica aprobada.
- `case-execution-policy.ts` y `runner.ts` permanecen idénticos a INT-03: BVA/RBAC, interceptación y transición de sesión continúan bloqueados. La nueva prueba integra los generadores reales con Runner real y demuestra cero pases, todos not_run y ninguna inicialización de navegador/sesión incluso retirando los tags.
- Se adaptaron expectativas textuales y de propuestas heredadas a este contrato, manteniendo los controles de seguridad y reforzando el rechazo de DOM no confiable. Tres accesos opcionales en pruebas R4 se corrigieron para typecheck. El informe importado solo recibió limpieza de espacios finales.

Engine, MCP, Auth, Adapter, Reporter, Shared y el ejecutor R7 se conservaron exactamente respecto de INT-03. No se modificó admin-user.json en el candidato ni en los originales.

## Validación del consolidado

| Suite / comprobación | Resultado |
| --- | --- |
| Tres arneses independientes sin cambios | 19/19 exactas, 20/20 numéricas, 9/9 reproducciones; mutante rechazado |
| Seis suites focales, incluida seguridad de oráculos INT-03 | 190/190 |
| Knowledge completo | 540/540, 35 archivos |
| Shared | 174/174 |
| Engine | 168/168 |
| Runner | 98/98, 17 archivos |
| Auth | 39 pasan, 1 omitida |
| Reporter | 51/51; incluye cuota y SQLite audit mode |
| Git adapter | 5/5 |
| CLI | 97/97; incluye prune/dry-run y reportes |
| MCP completo con un worker | 494 pasan, 12 fallan, 30 archivos |
| MCP dispatcher cliente/servidor por transportes enlazados | 9/9 (incluido en MCP); salida separada guardada |
| Adapter completo | 164 pasan, 1 falla |
| Preflight R7 con node --test | 85/85; no se lanzó el ejecutor E01 |
| Build monorepo | PASS |
| Lint monorepo | PASS; ajuste final del test comprobado también con lint focal |
| Typecheck por paquete: Shared/Engine/Knowledge/Runner | PASS |
| Typecheck MCP | 116 diagnósticos, idénticos a INT-03 |
| Typecheck raíz | 1923 diagnósticos frente a 1918 en INT-03 |

La corrida inicial con concurrencia de paquetes produjo tres timeouts Knowledge de 5 s y errores de limpieza de temporales. Repetir un paquete a la vez pasó Knowledge completo sin cambiar código ni timeouts. MCP con concurrencia de archivos produjo 33 fallos; con un worker desaparecieron los timeouts y permanecieron 12 aserciones fallidas. Se conservan ambos resultados: la ejecución por defecto del monorepo sigue sin estar verde.

Typecheck raíz: 1918 diagnósticos retenidos de INT-03; dos adicionales sobre performance en challenger-rbac-stress ya existen en R4; tres nuevos TS2307 corresponden a imports node:fs/promises, node:os y node:path del nuevo test bajo el tsconfig raíz sin tipos Node. El mismo archivo pasa typecheck con el tsconfig del paquete Runner. No hay diagnósticos nuevos de producto en los cinco paquetes medidos. No se ocultaron errores ni se relajó el compilador. La comparación usa multiconjuntos de archivo/código/mensaje y omite desplazamientos de línea; script y JSON quedan en evidencia.

## Bloqueos restantes y decisión

1. **Discovery/autenticación MCP no certificado.** Los 12 fallos reproducibles son: siete en p4-4-auth-lifecycle, tres C1 en p4-5a2-integrity, C4-d en p4-5a-integrity y E0b en server. Los doce se reprodujeron sobre INT-03 exacto en el checkout auxiliar (9/30 y 3/3 focales fallidos). Por tanto no se atribuyen al merge R4. Una copia temporal instrumentada registra `status=blocked`, `code=invalid_project_scope`, `persistence=not_attempted`; la prueba espera el contrato legacy razon=auth_required. La discrepancia impide certificar el flujo esperado, sin demostrar un bypass de autenticación. El handler actual también declara authentication_not_supported; no se levantaron estas compuertas para forzar pruebas verdes.
2. **Adapter SPA.** La prueba de extracción con asentamiento deshabilitado esperaba 0 botones y encontró 2. El mismo fallo se reproduce en el checkout R4 y el código Adapter/Auth es idéntico en ambos padres. Queda pendiente reconciliar determinismo de la prueba y contrato de captura; no se deshabilitó la prueba.
3. **Ejecución BVA/RBAC funcional.** Sigue bloqueada por categoría hasta aprobar autoridad/oráculo canónicos y aislamiento de sesión. La corrección del generador no resuelve ese contrato pendiente.
4. **Typecheck y ejecución global.** Permanecen los errores heredados MCP/raíz y la sensibilidad temporal descrita. Los tres diagnósticos nuevos del test bajo tsconfig raíz se clasifican expresamente como nuevos, aunque no aparecen con la configuración del paquete.

La consolidación está implementada y trazable, pero **no se aprueba su integración como candidato estable** mientras estas compuertas no se reconcilien y validen. Tampoco se declara cerrado el MVP integral. No se amplió este encargo a remediación general ni se alteraron las pruebas MCP/Adapter para encubrir bloqueos heredados.

## Conservación física posterior al commit

El comprobador histórico `scripts/int03-check-preparation.mjs` falla tanto en el consolidado como en INT-03 exacto: compara el ejecutor R7 contra dda870e y encuentra dos cambios anteriores de limpieza en check-preflight.mjs/check-preflight.test.mjs. Se clasifica como discrepancia heredada del comprobador, no como cambio de este merge. La comparación directa contra el padre INT-03 pasa para Engine, MCP, Auth, Adapter, Reporter, Shared, CLI, Runner/política y todo R7. Los ocho conflictos históricos y los tests originales de conservación no se modificaron por este merge.

Se comprobaron los dos padres exactos, la ascendencia de ambos candidatos, ausencia de conflictos pendientes y estado limpio. El hash físico de admin-user.json coincide con el original R4: SHA256 2234E33C43F854C51DF0304967A9C670F0935E43C1CDFE8A1AE7AF31D5363CEA.

## Evidencia y reproducción

Evidencia versionada: `docs/vnext/integracion/evidencia/DEV-MVP-01-R4-INT03/`. Contiene dictamen R4, hashes de arneses, comparación de diagnósticos y manifiesto SHA256 de cada log.

Logs físicos: `C:/Users/Judirico/Documents/QAMCP/audits/DEV-MVP-01-R4-independent/logs/`. Los arneses consolidados sin modificar permanecen bajo `audits/DEV-MVP-01-R4-independent/consolidated/audits/`, con su junction hacia este candidato. El checkout auxiliar de auditoría se archiva al finalizar; la evidencia cruda se conserva fuera de él.

Comandos clave: `pnpm build`; `pnpm lint`; `pnpm exec tsc --noEmit`; `pnpm exec tsc --noEmit -p packages/<paquete>/tsconfig.json`; `pnpm -r --workspace-concurrency=1 --if-present test`; `pnpm --filter @qap/mcp exec vitest run --maxWorkers=1`; `pnpm --filter @hyouka73/qap-cli test`; `node --test docs/vnext/implementaciones/VNEXT-014-E01/r7/check-preflight.test.mjs`. Los archivos r4-* y consolidated-* permiten distinguir auditoría, integración y reintentos.
