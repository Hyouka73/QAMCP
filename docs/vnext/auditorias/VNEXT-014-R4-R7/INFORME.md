# Auditoría independiente VNEXT-014-D-R4-R7

2026-11-05, America/Mexico_City. Repositorio Hyouka73/QAMCP; publicación exclusiva en feat/qap-vnext-architecture.

**Dictamen: R4-R7-I01 y su tramo funcional PASS; VNEXT-014 NO-GO.** La integración acredita propuesta/corrección, autorización independiente del host, requisito y recibo persistidos y cobertura incompleta honesta. La compuerta de entrega permanece roja por deuda MCP/lint y recorrido lifecycle incompleto. No se certifica closed, UI humana productiva ni ejecución funcional del módulo.

**SHA de código auditado:** `ea75eb2c52266b174e6d24917c1b089d56834900`. **Baseline:** `fbc089c02b71828994a62af1a9eb6d28e33cb4bb`. El SHA documental es el commit que incorpora este informe, independiente del código ejecutado; se comunica explícitamente en la entrega y se resuelve en el historial de esta carpeta, como indica COMANDOS.md. No se confunden ambas identidades.

| Compuerta | Resultado ejecutado | Salida |
| --- | --- | ---: |
| Install congelado | PASS | 0 |
| Build | 10 paquetes; MCP y CLI presentes | 0 |
| R4-R7-I01 | 1 PASS / 43 no seleccionadas | 0 |
| Canonical Interview | 44/44 PASS | 0 |
| Canonical Coverage | 37/37 PASS | 0 |
| Discovery | 59/59 PASS aislado y dentro del integral | 0 |
| ESLint focal solicitado | 5 errores / 0 advertencias, previos en cobertura | 1 |
| MCP serial | **407 PASS / 55 FAIL de 462**; 16 suites PASS / 7 FAIL | 1 |
| Playwright Runner | 71/71 PASS, 10 suites | 0 |
| Lint global | **34 errores / 28 advertencias**, 62 diagnósticos idénticos al baseline | 1 |
| MCP Stdio | 18 herramientas + init real + ONBOARDING por server y CLI | 0 |
| Sonda independiente | Digest antiguo inválido, requisito/recibo únicos, segunda conexión exacta y cierre bloqueado | 0 |

R4-R7 agrega una sola prueba, aprobada en foco, entrevista e integral. Se cotejaron las 461 ocurrencias previas del verbose versionado con el JSON nuevo: 406 passed→passed, 55 failed→failed, una alta passed y cero bajas. Los cinco lifecycle históricos siguen FAIL. No se debilitaron expectativas ni se presentan 55 regresiones nuevas.

## Hallazgos y pendientes

- **014-R4-R7-A01 P1:** fallo reproducible preexistente del reintento de declare_non_applicable. Un timestamp nuevo altera coverageDigest/requestDigest para la misma declaración pendiente; la decisión posterior del inbox se rechaza como closure_review_invalid. Cero aprobaciones/decisiones persistidas: falla cerrado. Un gateway que espera al humano dentro de la misma llamada no queda invalidado por este experimento. Resolver identidad de solicitud antes del siguiente P0; fuentes intactas respecto a R4-R6.
- El foco lint actual abarca canonical-coverage-service.ts, que no formaba parte del foco anterior: sus cinco errores ya estaban en el global R4-R6. El global no mejora ni empeora. No se marca el foco como limpio.
- Los 55 fallos MCP conservan identidad y clasificación R4-R5. Falta acreditar los cinco lifecycle completos y migrar los otros 50 por equivalencia de garantías. Cerrar A por cobertura real, B por waiver legítimo, emitir reporte físico fiel y replanificar desde WRAP_UP siguen pendientes.
- Timeout intermitente histórico de cancelación Discovery no se reprodujo en las dos ejecuciones actuales. Su causa interna sigue indeterminada.

La sonda y el test demuestran 0→1 requisito, 7→6 brechas, functional satisfecha, seis categorías unknown y execution_coverage=not_executed. El close explícito sigue bloqueado por precondiciones antes del gateway de cierre. La revisión de requisito no autoriza cierre ni aplicabilidad.

Node 24.22.1/SQLite 3.53.4 FTS5, pnpm 11.3.0 y Chromium 153 reales; runtime distinto del 24.15.0/SQLite 3.51.3 usado en baseline, diferencia declarada. Todas las pruebas usan raíces sintéticas. No se modificó código, tests, lockfile, main/develop, configuraciones productivas o esquema canónico v2. La sesión protegida conserva hash Git 429bbf6d57a1d798231b4204d52069b4077703de en ambos checkouts. El original conserva HEAD y untracked iniciales.

## Evidencias publicadas

- [Cadena física, diez garantías, hallazgo y sonda reproducible](EVIDENCIA_INTEGRACION.md)
- [Diferencial exacto por archivo/título](DIFERENCIAL_MCP.md)
- [Primera falla de cada caso](RESULTADOS_MCP.md)
- [Diagnósticos lint y comparación de alcance](LINT.md)
- [Comandos, códigos, entorno, Stdio y huellas](COMANDOS.md)
- [Logs saneados](LOGS.md)
- [Interfaces, casos faltantes y orden P0 preservando E0a/E1/E2/E3/criterio 9](SIGUIENTE_BLOQUE_P0.md)
