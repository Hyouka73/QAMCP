# Auditoría independiente VNEXT-014-D-R4-R8

2026-11-05, America/Mexico_City. Hyouka73/QAMCP, publicación exclusiva en `feat/qap-vnext-architecture`.

**Dictamen: NO-GO para VNEXT-014. R4-R7-A01 corregido en el flujo diferido sin deriva; concurrencia transversal no resuelta.** Las tres regresiones R4-R8 pasan. Una sonda adversarial independiente reproduce una aprobación de aplicabilidad obsoleta si Knowledge cambia después de la revalidación y antes de la transacción de ClosureStore. No se certifica cierre integrado, ejecución funcional aprobada ni UI humana productiva.

**SHA exacto del código auditado:** `44c69f826a0599eeee400ff413ae9faedeeecd75`. Base R4-R7: `ea75eb2c52266b174e6d24917c1b089d56834900`; auditoría publicada por `d0fa36f0baaf1baaf6ea20e3bea592cb4c398921`. El SHA documental es el commit que agrega esta carpeta: `git log -1 --format=%H -- docs/vnext/auditorias/VNEXT-014-R4-R8/INFORME.md`. Se informa separado en la entrega y se comprueba en remoto; no se atribuye al código probado.

## Hallazgos

- **R4-R8-A02 P1, producción, ventana residual de autorización obsoleta:** `canonical-closure-service.ts:440–460` reevalúa correctamente tras el gateway, pero la transacción posterior solo controla reutilización del approvalId. Una mutación de requisito al entrar en `IModuleClosureStore.transaction`, después de obtener el digest vigente, consigue `declared_non_applicable`, una aprobación y una decisión persistidas con revisión del requisito ya en 2. La sonda usa stores SQLite reales y un decorador del puerto que coloca determinísticamente la mutación en esa frontera. No es una prueba de scheduling entre procesos ni acredita todas las carreras: demuestra que el contrato no asegura atomicidad entre ambos stores. Es un límite preexistente que R4-R8 estrecha pero no elimina. [Reproducción y alcance](EVIDENCIA_APLICABILIDAD.md).
- **R4-R8-L01 P2, regresión de lint en test nuevo:** `canonical-coverage.test.ts:542:11`, `prefer-const`. El foco tiene seis errores: cinco históricos del servicio de cobertura y este nuevo. No se modificó la prueba ni se ejecutó `--fix`.
- Los fallos MCP históricos y el recorrido completo A `closed` + B `waived` + reporte canónico + WRAP_UP + nueva sesión siguen siendo bloqueos formales. La aprobación de requisitos y la de aplicabilidad no sustituyen una autorización independiente de cierre.

## Alcance demostrado

Dos pendientes idénticos conservan ambos digests; una decisión posterior para el primero se acepta y conserva exactamente `decidedAt` del host, con readback en otra conexión. Cambiar motivo o revisión de requisito invalida la decisión; la sonda externa agrega cambio de categoría con snapshot intacto. Una mutación dentro del gateway bloquea con `closure_context_changed`, sin writes en ClosureStore. Estos resultados no se extienden a una mutación posterior a la última relectura.

El algoritmo nuevo modifica hashes de cobertura que incluyen aplicabilidad histórica; no cambia el formato de SQLite. Se ejecutaron servicios exactos de R4-R7 sobre fixtures sintéticos para producir un `closed` y un `waived`, y se verificaron con R4-R8 y una conexión reabierta. Se conservan registro y hashes originales, sin recalcular la autoridad histórica. Alterar solo el digest correlacionado de aprobación los hace dejar de ser terminales verificables. Esto prueba compatibilidad del recibo durable del fixture, no equivalencia entre los dos algoritmos ni aprobación válida de solicitudes antiguas aún pendientes.

Las métricas, diferencial por identidad, diagnósticos y comandos físicos se registran en los documentos vinculados. No se cambian fuentes, tests, esquemas, lockfile, credenciales, sesiones protegidas ni `main/develop`.

- [Evidencia de aplicabilidad, historia y carrera](EVIDENCIA_APLICABILIDAD.md)
- [Matriz y diferencial MCP](DIFERENCIAL_MCP.md)
- [Lint y origen de diagnósticos](LINT.md)
- [Comandos, entorno y verificaciones](COMANDOS.md)
- [Composición del siguiente P0](SIGUIENTE_BLOQUE_P0.md)

## Matriz física

| Compuerta | Resultado | Salida |
| --- | --- | ---: |
| Install congelado | PASS | 0 |
| Build | 10 paquetes PASS; server/CLI presentes | 0 |
| R4-R8-A01 | 3 PASS, 37 no seleccionadas | 0 |
| Coverage | 40/40 PASS | 0 |
| Interview | 44/44 PASS | 0 |
| Discovery | 59/59 PASS, también en integral | 0 |
| ESLint focal | 6 errores / 0 warnings | 1 |
| MCP serial | 410 PASS / 55 FAIL de 465 | 1 |
| Runner | 71/71 PASS, 10 archivos | 0 |
| Lint global | 35 errores / 28 warnings | 1 |
| Stdio servidor y CLI | 18 herramientas, qap_init success, ONBOARDING | 0 |
| Sonda externa | Carrera A02 reproducida; categoría/historia/digest ajeno comprobados | 0 |
