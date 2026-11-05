# VNEXT-014-D-R4-R9 — Frontera SQLite de autorizaciones canónicas

Fecha: 2026-11-05. Rama exclusiva: `feat/qap-vnext-architecture`.
Base auditada R4-R8: `44c69f826a0599eeee400ff413ae9faedeeecd75`.
HEAD documental de entrada: `4829a7d4af869f29f1d4c9b2d2d4124a3796b2ca`.

**Estado: IMPLEMENTADO SIN CERTIFICACIÓN FÍSICA; VNEXT-014 NO-GO.**

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

**Aún por comprobar físicamente:** compilación de 10 paquetes; suite Coverage; R4-R8-A01; entrevista; Discovery; MCP serial y sus 55 fallos por identidad; runner 71; Stdio; lint focal/global; cierre durable/recuperación/crash; concurrencia real entre conexiones/procesos, cierre/aplicabilidad simultáneos, rechazo de approvalId reutilizado, compatibilidad de datos históricos y cambio de revisión de módulo. No declarar PASS por la sola publicación.

## Próximo bloque

Primero auditoría independiente de este SHA exacto con pruebas adversariales; después integración desde Discovery + entrevista aprobada hasta A closed + B waived + reporte físico + WRAP_UP + replanificación. Mantener `execution_coverage=not_executed` cuando no haya pruebas funcionales reales. VNEXT-015 sigue sin autorización.
