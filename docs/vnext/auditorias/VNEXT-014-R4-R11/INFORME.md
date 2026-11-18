# Auditoría independiente VNEXT-014 R4-R11

2026-11-05, America/Mexico_City. Hyouka73/QAMCP. **NO-GO.**

- **Código exacto auditado:** 4bb22547349a407b1eeb2383e6981af5dd1db07a; worktree detached aislado, sin incorporar fuentes posteriores. Publicación exclusivamente documental a feat/qap-vnext-architecture; main y develop fuera de esta entrega.
- **Matriz:** instalación congelada y FTS5 reales PASS; build **10/10**; regresión R11 **1/1** (incluye cuatro acciones), R10 **5/5**, R9 **5/5**, R8 **3/3**; Coverage **51/51**, Interview **44/44**, Discovery **59/59**, Runner **71/71**; Stdio servidor/CLI **18 herramientas + qap_init + ONBOARDING**.
- **MCP: 413 PASS / 63 FAIL de 476.** Frente R10: 411 PASS conservados, 63 FAIL conservados, Scenario4 FAIL→PASS y una alta R11 PASS; cero bajas/regresiones nuevas. Los **55 históricos + ocho fixtures MemoryKnowledgeStore sin fence** siguen fallando por identidad exacta. Scenario4 y sus expectativas permanecen intactos.
- **ESLint:** global **34 errores / 28 advertencias**, focal ampliado **5 errores / 0 advertencias**; 62 diagnósticos idénticos a R10, cero altas/bajas. Sin supresiones ni configuración alteradas.
- **R4-R10-A01 P1: corrección comprobada en el alcance Windows ensayado.** Reproducción histórica e7d de las cuatro acciones recupera el bypass por casing; en R11 pasan 64 intercalados (cuatro acciones × session/plan/phase/state × entrada/después de callback × mismo/otro proceso). Un único lock, contexto intacto hasta commit y escritores recuperables. Junction de raíz, excepción y kill/recovery pasan. Solo escritores cooperantes de FileSystemStorage; raw FS posterior al callback sigue fuera del contrato.
- **R4-R10-A03 P2: corregido en escenarios auditados.** Waive+waive y close+waive, adapters/stores separados y procesos físicos, recuperan el terminal ganador autorizado sin segunda aprobación/recibo/historia. Dos módulos distintos cierran con dos autoridades independientes. Recibos alterados y aprobaciones ausentes/duplicadas/digest distinto bloquean sin writes adicionales.
- **A04 y A06 continúan abiertos.** Las cuatro acciones aún pueden persistir después de expiresAt al demorar tras el último callback. Repetir accept_gaps exacto sobre una brecha existente devuelve blocked/closure_gap_selection_invalid sin duplicar autoridad; no éxito idempotente.
- **Recuperación física:** seis kills (close/waive × antes de commit / después de Closure / después del recibo Knowledge); readback confirma rollback o estados parciales esperados. Retry tras stale recupera una aprobación, un recibo y una generación de historial; después de commit no pide otro gateway. No hay atomicidad entre las dos SQLite y filesystem.
- **Dictamen: VNEXT-014 NO-GO; VNEXT-015 no iniciado.** No se certifican POSIX/otros volúmenes ni identidad universal SQLite por realpath/dev/ino. Rename/unlink abiertos siguen EBUSY en Windows. A closed+B waived+reporte fiel+WRAP_UP+replanificación con revisión humana auténtica permanece pendiente; gateways y requisitos de fixtures no certifican ese integrado.

## Alcance y evidencia

Se reutilizó el worktree de auditoría anterior, limpio y separado del checkout principal, fijándolo en 4bb22547349a407b1eeb2383e6981af5dd1db07a. El nombre local audit-r4-r10 no determina el código: rev-parse, diff y fuentes verificadas corresponden exactamente a R11. La petición de otro worktree gestionado fue cancelada y no se reintentó. No se incorporó código productivo durante las pruebas; el commit posterior contiene exclusivamente nueve Markdown.

El fallo de R10 se repitió en bundles externos de FileSystemStorage y CanonicalClosureService obtenidos con git show e7d3717d9311ed73736568b13ce99e131d617453; Coverage y resto de dependencias productivas relevantes no cambiaron entre R10 y R11. Se documenta como baseline histórico, separado del código R11. Con alias uppercase el escritor terminaba antes del commit en cuatro ramas; sin alias esperaba. La implementación R11 canonicaliza realpathSync.native y aplica normalización de separadores/casing exclusivamente Windows antes de hashear el lock. Dos instancias y procesos oficiales apuntan al mismo lock físico. La sonda no equivale a validación de cada filesystem Windows, hardlink o montaje remoto.

La recuperación concurrente relee el terminal después de liberar lifecycle/Knowledge. Una aprobación exactamente correlacionada sigue siendo necesaria. El ganador puede ser waived aunque la otra llamada pidiera close: la respuesta idempotente describe la decisión durable anterior y no ejecuta la segunda petición. Los recibos alterados no producen éxito ni transición nueva. Las ocho pruebas Memory sin fence no alcanzan esa ruta; no son ocho bypass de seguridad.

Orden observado: gateway sin locks → lifecycle → Knowledge → Closure → release Knowledge → release lifecycle; reconciliación posterior. No hubo deadlocks en las rutas ensayadas, incluyendo contención entre módulos y procesos, excepción y terminación física. No se declara reentrancia ni ausencia universal ante orden inverso externo.

## Pendientes reproducibles y correcciones

| Hallazgo | Prioridad | Reproducción / causa / recomendación |
| --- | --- | --- |
| R4-R11-A04, continúa R10-A04 | P2 / contrato | Decorar ClosureStore.transaction, ejecutar callback real y demorar hasta expiresAt+40ms antes de volver al método que INSERT/COMMIT. Las cuatro acciones conservan una aprobación durable vencida. La vigencia solo se comprueba antes de awaits anteriores. Definir instante de consumo; si exige commit, trasladar deadline al store y guard final síncrono con rollback. No prometer tiempo real bajo pausas OS. |
| R4-R11-A06, continúa R10-A06 | P2 / contrato | Aceptar gap:catalog:functional:unknown_applicability real de Coverage con razón exacta; repetir comando devuelve blocked/closure_gap_selection_invalid, sin gateway ni nueva autoridad. El filtro excluye gaps ya aceptados antes de correlacionar recibo previo. Definir replay de ID+razón+recibo verificables; motivos distintos/IDs ajenos requieren autoridad nueva o bloqueo. |
| A02, alcance pendiente | Limitación | cwd original estable, otra conexión/proceso bloqueados y recuperables PASS. Rename/unlink del archivo abierto no alcanzan sustitución: EBUSY. Validar sistemas donde el evento sí sea posible, check/open y no creación accidental; no usar dev/ino como identidad universal. |
| Integrado canónico y deuda | P0 de aceptación | Persisten E0a/E1/E2/E3/Criterio9 dentro de 55 históricos y ocho fixtures sin fence. No hay recorrido humano completo certificado. Reconciliar contratos y ejecutar la cadena con datos/consentimiento legítimos, manteniendo ejecución not_executed cuando corresponda. |

No se encontró un P0/P1 nuevo reproducible dentro del contrato auditado. La corrección acotada de A01/A03 no convierte VNEXT-014 en GO.

## Integridad y límites

Fuentes, tests, expectativas, esquemas, lockfile, credenciales y sesiones protegidas intactos. Lockfile Git a9bd8de7f6ac38db1ad4ae6582c4539b351225c8; sesión del worktree 429bbf6d57a1d798231b4204d52069b4077703de y original 28e1b8dbec7ccf194440cc4158ec6072c9b9ade4. Solo hashes, sin inspeccionar contenidos ni usar sesiones personales.

Cierres históricos R9 closed/waived conservan autoridad, recibos, lifecycle e historial cifrado; solicitud pendiente de aplicabilidad conserva digest. Negativos/throw tras callback conservan snapshot e historial; readback con conexión independiente. Crash físico nuevo verifica tres ventanas para dos terminales, no todas las fallas de energía, corrupción de disco o schedules posibles. No se inventaron requisitos ni aprobaciones humanas para certificar el integrado: las fixtures sintéticas se usan exclusivamente para probar contratos de servicio.

[Evidencia y scripts](EVIDENCIA_CONCURRENCIA.md) · [Diferencial exacto](DIFERENCIAL_MCP.md) · [Lint](LINT.md) · [Comandos y hashes](COMANDOS.md) · [Siguiente bloque](SIGUIENTE_BLOQUE_P0.md).
