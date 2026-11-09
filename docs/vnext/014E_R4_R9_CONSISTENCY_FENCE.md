# VNEXT-014-D-R4-R9 — Frontera SQLite de autorizaciones canónicas

Fecha: 2026-11-05. Rama exclusiva: `feat/qap-vnext-architecture`.
Base auditada R4-R8: `44c69f826a0599eeee400ff413ae9faedeeecd75`.
HEAD documental de entrada: `4829a7d4af869f29f1d4c9b2d2d4124a3796b2ca`.

**Estado: AUDITADO INDEPENDIENTEMENTE CON GARANTÍA CONDICIONADA Y P1 PENDIENTES; VNEXT-014 NO-GO.**

## Defecto y cambio

R4-R8-A02 demostró que una modificación de un requisito después de la última relectura y antes del commit del ClosureStore podía producir autorización obsoleta. Dos bases SQLite independientes no proporcionaban una transacción conjunta.

El puerto v1 de `IKnowledgeStore` mantiene los métodos `get/query/history/commit`. Se agrega **capacidad opcional** `withWriteFence`; `SqliteKnowledgeAdapter` abre una segunda conexión al mismo archivo y adquiere `BEGIN IMMEDIATE` (timeout acotado) después del gateway humano. Así todos los escritores SQLite normales deben esperar o fallar. La conexión original sigue pudiendo leer. La compuerta reevalúa identidad/huella, revisión, cobertura y digest, compara snapshot de cierre antes/después y dentro del CAS transaccional, verifica expiración y solo entonces consume la aprobación. El bloqueo termina después del commit/rollback de ClosureStore; nunca incluye la espera del gateway.

Se aplica a `declare_non_applicable`, `accept_gaps`, `close` y `waive`. Ante ausencia del método, memoria SQLite o contención/error, no se persiste consentimiento y se devuelve bloqueo. Se conserva el gateway y evaluador existentes; no hay migraciones de esquemas, lockfile ni cambios a ramas principales. Se incorporan revisiones pendientes al digest de cobertura. Los terminales históricos siguen verificados por su recibo correlacionado, sin recalcular el hash antiguo.

## Garantías que NO se acreditan

- **No** existe atomicidad transaccional entre bases: después de un commit de cierre y antes del recibo Knowledge puede haber un crash, recuperable por `reconcile`. No se borran asientos de aprobaciones consumidas.
- El fence se cumple si todos los escritores operan mediante las conexiones SQLite al archivo físico; no asegura otras implementaciones del puerto, una SQLite `:memory:` no compartida, manipulación de archivos externa ni mutadores que omitan el mecanismo.
- Se bloquea la escritura en toda la base de Knowledge, no solo en un módulo; puede elevar latencia y provocar `CONFLICT/UNAVAILABLE`.
- No constituye validación de la UI de aprobación, tests de Playwright, ejecución funcional ni del recorrido lifecycle E0a/E1/E2/E3/criterio 9.
- El cambio de digest invalida solicitudes pendientes antiguas: reenviar y autorizar nuevo digest. No migrar en silencio.

## Regresiones añadidas y validaciones requeridas

- R4-R9-A02: inyección determinista de revisión durante la frontera de transacción: bloqueo y 0 writes de autorización.
- R4-R9-A02: `close` y `waive` bajo mutación concurrente: no terminal, recibo ni aprobación.
- Sin capacidad `withWriteFence`: fail-closed.
- Aprobación expirada mientras se adquiere el fence: fail-closed.
- Revisión de requisito pendiente también altera el digest.
- R4-R8-L01: `prefer-const` corregido sin cambios de lógica.

**Checklist original previo a auditoría (resultado independiente al final):** compilación de 10 paquetes; suite Coverage; R4-R8-A01; entrevista; Discovery; MCP serial y sus 55 fallos por identidad; runner 71; Stdio; lint focal/global; cierre durable/recuperación/crash; concurrencia real entre conexiones/procesos, cierre/aplicabilidad simultáneos, rechazo de approvalId reutilizado, compatibilidad de datos históricos y cambio de revisión de módulo. No declarar PASS por la sola publicación.

## Próximo bloque

Auditoría independiente ejecutada sobre 09c9ce276c9c328026de4236dadf0a85d8e94d21 (resultados abajo). Resolver sus P1 y regresiones antes de integración desde Discovery + entrevista aprobada hasta A closed + B waived + reporte físico + WRAP_UP + replanificación. Mantener `execution_coverage=not_executed` cuando no haya pruebas funcionales reales. VNEXT-015 sigue sin autorización.


## Resultado independiente R4-R9 (2026-11-05)

- **SHA de código auditado:** 09c9ce276c9c328026de4236dadf0a85d8e94d21; worktree detached aislado, sin código posterior. **VNEXT-014 NO-GO; VNEXT-015 no iniciado.** [Informe independiente](auditorias/VNEXT-014-R4-R9/INFORME.md).
- **R4-R8-A02: corrección condicionada comprobada**, para mismo archivo físico estable y escritores SQLite normales. Otra conexión y otro proceso bloqueados durante fence; recuperan escritura tras release, excepción y terminación física. No atomicidad Knowledge/Closure/FS. **R4-R9-A02 P1:** ruta relativa + cambio de cwd hace que fence abra otro archivo y permite la aprobación obsoleta; no se demostró cwd cambiante en servidor productivo. **R4-R9-A01 P1:** cambio real de session/plan en lifecycle después de revalidar persiste autorización para contexto anterior, incluido close/waive. Reproducciones y correcciones en [evidencia](auditorias/VNEXT-014-R4-R9/EVIDENCIA_CONCURRENCIA.md).
- **Matriz física:** install congelado/FTS5/Node24.15.0 y diez builds PASS; cinco R9 y tres R8 PASS; Coverage **44/45**, Interview44/44, Discovery59/59, Runner71/71; Stdio18+qap_init por servidor/CLI PASS. MCP **406 PASS / 64 FAIL de 470**: 55 históricos idénticos + ocho incompatibilidades del MemoryKnowledgeStore sin fence + Scenario4 concurrente SQLite real (R4-R9-A03 P2: ganador waived/perdedor blocked, retry posterior idempotente). Sin bajas ni tests/expectativas cambiados.
- **Lint L01 certificado:** global **34 errores/28 warnings**, foco ampliado **5/0**; exactamente 62 diagnósticos históricos idénticos, una baja prefer-const, cero altas. El lint histórico sigue pendiente.
- **Límites adicionales:** R4-R9-A04 registra expiración posible entre callback y commit, no vigencia a commit; definir contrato de consumo. **R4-R9-A05 P1 preexistente:** accept_gaps sobre brecha existente falla por receipt ausente antes del gateway, reproducido también en servicio R4-R8. Las sondas no certifican aceptación funcional ni E2E humano. Nuevo digest invalida solicitudes antiguas incluso sin pendientes; closed/waived históricos se conservan sin recalcular autoridad.
- **Compuerta:** corregir P1 y regresión de concurrencia, preservar negativos/historial/recuperación y reconciliar matriz; después completar A closed+B waived+reporte/WRAP_UP/replanificación y E0a/E1/E2/E3/criterio9 sin requisitos confirmados ni aprobaciones ficticias para certificar integrado. [Siguiente bloque](auditorias/VNEXT-014-R4-R9/SIGUIENTE_BLOQUE_P0.md).
