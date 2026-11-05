# Auditoría independiente VNEXT-014 R4-R10

2026-11-05, America/Mexico_City. Hyouka73/QAMCP. **Dictamen: NO-GO. VNEXT-015 no iniciado.**

**Código exacto auditado: e7d3717d9311ed73736568b13ce99e131d617453.** Worktree detached aislado; GitHub confirmó el commit. Ningún código posterior se incorporó a las verificaciones.

**Publicación documental en feat/qap-vnext-architecture, según la instrucción vigente del usuario.** Base exacta de esta publicación y código auditado: e7d3717d9311ed73736568b13ce99e131d617453. Se publican los seis informes y se actualizan STATE, backlog y nota R4-R10 conservando su historial. Esta publicación no modifica main ni develop, no incorpora código posterior y no repite ni atribuye las pruebas a otro SHA. Existe una publicación documental anterior en 0e5825cfd256065e532f45a171f9a0dc74116615; se registra como procedencia, sin trasladar su código ni realizar merge.

## Resultado prioritario

R4-R9-A02 queda corregido para el caso cwd y archivo SQLite estable comprobado: ruta relativa anclada, escritor de otra conexión y proceso bloqueados, recuperación después de release y kill. No se certifica identidad universal mediante realpath/dev/ino: en este Windows los intentos reales de rename/unlink sobre SQLite abierto devolvieron EBUSY; no se consiguió desaparición/sustitución del archivo. La comprobación fail-closed ante ese evento no fue físicamente certificada en otros SO.

**R4-R9-A01 no puede cerrarse globalmente.** El lock funciona con representación de ruta idéntica, pero dos escritores oficiales FileSystemStorage sobre la misma carpeta Windows con distinta capitalización usan locks distintos. El escritor modifica sesión/plan después del último fingerprint y antes del commit; las cuatro acciones persisten autorización para el contexto anterior. No requiere escritura raw ni adaptar el producto. Otro proceso oficial reproduce la falta de exclusión. Es P1 residual del alcance de coordinación prometido; no se demostró explotación remota por MCP.

R4-R9-A05 queda reparado funcionalmente en el servicio: se acepta una brecha existente (gap:catalog:functional:unknown_applicability), propuesta base, decisión independiente del puerto gateway de prueba, motivo exacto y receipt real de esa decisión, readback SQLite. IDs inexistentes/duplicados/ya aceptados bloquean; motivo distinto con aprobación vieja y cambios Knowledge durante gateway bloquean sin autoridad nueva. **El gateway es un doble externo de fixture, no una aprobación humana real ni certificación integrada.** El retry idéntico ya aceptado devuelve blocked/closure_gap_selection_invalid, sin duplicar: seguridad de repetición comprobada, éxito idempotente no implementado.

## Hallazgos

| ID | Prioridad | Resultado / causa / recomendación |
| --- | --- | --- |
| R4-R10-A01 | **P1** | Bypass entre escritores oficiales por alias de capitalización Windows. withLock hashea targetPath textual para lockfilePath; mismo archivo obtiene dos nombres de lock. Unificar identidad/namespace estable de proyecto y slot lifecycle para todos los escritores; realpath solo no basta en este host. Reproducir alias en mismo proceso y otro proceso, y retener exclusión hasta commit. |
| R4-R10-A03 (continúa R9-A03) | P2 | Waive+waive local: waived + blocked/closure_context_changed; retry posterior waived/idempotent. Helper comprueba bridge/cobertura antes de devolver terminal durable, y convierte excepciones en blocked antes del retry externo. Releer y validar ganador bajo serialización antes de exigir contexto WORKING; liberar locks antes de reconciliar. Un par multiproceso sí terminó waived+waived/idempotent: no generalizar a todos los schedules. |
| R4-R10-A04 (continúa R9-A04) | P2 / contrato | Las cuatro ramas persisten aprobación después de expiresAt si se pausa tras callback. Falta guard final en ClosureStore. Definir instante de consumo; si es commit, comprobar deadline en tramo síncrono final y rollback, sin prometer garantía de tiempo real del OS. |
| R4-R10-A06 | P2 / contrato de retry | accept_gaps idéntico ya aceptado bloquea antes de gateway. Cero duplicación, pero no éxito idempotente ni recuperación por correlación si cliente perdió respuesta. Definir replay exacto autorizado con recibo previo, manteniendo rechazo a motivos nuevos/IDs ajenos. Comportamiento deliberado del filtro nuevo, no bypass de autoridad. |

No se identificó P0 nuevo probado. P1 de lifecycle y composición canónica pendiente impiden GO. [Reproducciones, salidas y scripts completos](EVIDENCIA_CONCURRENCIA.md); [correcciones propuestas](SIGUIENTE_BLOQUE_P0.md).

## Matriz

| Compuerta física | Resultado sobre e7d3717d9311ed73736568b13ce99e131d617453 |
| --- | --- |
| Instalación congelada | PASS; pnpm install --frozen-lockfile, lockfile idéntico |
| Build | Diez paquetes PASS; servidor MCP y CLI compilados |
| Runtime | Windows x64, Node24.15.0, pnpm12.3.4, SQLite3.51.3, FTS5 CREATE/INSERT/MATCH reales PASS |
| Cinco R4-R10 | 5/5 PASS, aisladas e integral |
| Cinco R4-R9 | 5/5 PASS, aisladas e integral |
| Tres R4-R8 | 3/3 PASS, aisladas e integral |
| Coverage | **49 PASS / 1 FAIL de 50**; Scenario4 persiste aislado e integral |
| Canonical Interview | 44/44 PASS |
| Discovery | 59/59 PASS aislado e integral |
| MCP integral | **411 PASS / 64 FAIL de 475**; 406 PASS y64FAIL comunes, cinco altas PASS |
| Playwright Runner | 71/71 PASS, diez archivos |
| ESLint global / focal | 34errores28warnings / 5errores0warnings; 62 diagnósticos globales idénticos |
| Stdio servidor / CLI | 18 herramientas exactas, qap_init success y ONBOARDING en ambos |


[Diferencial MCP](DIFERENCIAL_MCP.md): cero cambios de estado en las470 identidades R9; los55 históricos y los nueve fallos adicionales R9 persisten. Los ocho MemoryKnowledgeStore sin fence no se reinterpretan como ocho bypass de seguridad: bloquean por falta de capacidad; su contrato sigue sin migrar a pruebas físicas adecuadas. No se cambió ninguna expectativa.

## Integridad, recuperación y límites

Cambios publicados exclusivamente Markdown. Fuentes, tests, expectativas, esquemas, lockfile, credenciales y sesiones protegidas intactos. Lockfile Git a9bd8de7f6ac38db1ad4ae6582c4539b351225c8; sesión original 28e1b8dbec7ccf194440cc4158ec6072c9b9ade4 antes/después. La sesión del worktree auditado conserva su propio hash429bbf6d57a1d798231b4204d52069b4077703de. No se leyeron contenidos ni se usaron sesiones personales.

Negativos y rollback instrumentado conservan snapshot e historial cifrado; no recibos ni transiciones nuevos. Terminales closed/waived creados realmente por servicio R9 conservan autoridad, recibos e historial al leer/reintentar R10. Solicitud pendiente de aplicabilidad R9 mantiene digest en R10. Crash2/3 de suite pasan, pero sus nombres no sustituyen una matriz completa de terminación física entre cada fase: el kill externo prueba release de locks antes de consumir aprobación; el lock FS queda ELOCKED inicialmente y se recupera tras stale10s. Las dos SQLite y FS **no tienen atomicidad transversal**. No se certifican POSIX/NFS, reemplazo de archivos abiertos, todos los fallos de energía ni defensa frente a escritores raw externos; raw después del último chequeo sí produce deriva.

El recorrido físico completo A closed+B waived+reporte fiel+WRAP_UP+replanificación, sin requisitos ni aprobaciones humanas ficticias, sigue pendiente; E0a/E1/E2/E3/Criterio9 conservan sus fallos. VNEXT-014 permanece NO-GO; esta publicación no modifica main ni develop.
