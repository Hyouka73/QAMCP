# VNEXT-014 — Reparación focal de A01/A02/A03 y control de aceptación

**Fecha:** 2026-11-05  
**Repositorio:** Hyouka73/QAMCP  
**Rama exclusiva:** feat/qap-vnext-architecture  
**HEAD inicial comprobado:** 7cfdefca9482b59d0c5606fb70d23903483373f3  
**HEAD de código y regresiones (anterior a documentación):** a05bfcc1e0981073a9fc6ac50ead68eeb2808cac  
**Snapshot de auditoría anterior:** e71818ac6fdaa1847e300a67bd4540fbfbd514c5

> **Estado: implementación publicada; validación física independiente PENDIENTE.** Ningún build, test, lint o ensayo de concurrencia se ejecutó desde este entorno. No inferir PASS, GO P1 ni cierre del hito a partir del diff. Codex debe ejecutar los arneses y publicar dictamen propio. Se conserva intacto el inventario de las 63 fallas anteriores.

## 1. A01 — finalización de sesión con contexto concurrente

**Causa reproducida en el snapshot anterior:** `qap_session_close` tomaba la compuerta `canExitWorking` antes de múltiples `await`, generaba el reporte con un contexto obsoleto y llamaba a `transitionProject` sin comprobar el éxito. Un escritor oficial podía añadir un módulo `planned`, sustituir `session.id` o cambiar `phase` mientras se producía el reporte, generando éxito falso o cierre de sesión incorrecta.

**Modificación aplicada:**
- `FileSystemStorage.commitLifecycleStateWithFence` usa el lock físico compartido con `updateLifecycleState` y entrega un `commit` síncrono de un solo uso, sin reentrar al lock; usa temporal y rename para escribir lifecycle.
- El handler toma una identidad serializada de todo el `lifecycleState` **después de la conciliación**. Construye el inventario provisional fuera de locks (permite que otros escritores terminen).
- Bajo el lock de lifecycle revalida íntegramente sesión, plan, módulos, fase e historial; ejecuta `canExitWorking` vigente. Bajo ese mismo lock adquiere el `withWriteFence` de SQLite Knowledge, con el orden lifecycle → Knowledge → lectura Closure.
- Vuelve a consultar `sessionReport()` y compara la proyección autorizada, recibos, decisiones e inventario contra la versión que compuso el reporte. Después comprueba `transitionProject(...,{checkGates:true}).success` y que el estado propuesto es WRAP_UP.
- Publica un archivo temporal con rename, confirma sin liberar el lock el lifecycle físico, realiza readback e informa `success/WRAP_UP` únicamente si lo persistido coincide.

**Linearización:** commit físico del lifecycle, en la ventana protegida por locks de lifecycle y Knowledge. Un conflicto previo debe devolver `blocked` sin reporte nuevo; una excepción posterior al reporte y anterior al commit puede dejar un reporte recuperable con lifecycle todavía WORKING. El reintento regenera el mismo destino sin nueva aprobación del host. No se declara transacción ACID entre filesystem y ambas bases SQLite, ni garantía ante escritores raw que omitan el contrato oficial.

**Regresiones añadidas:** cuatro `RES-CODEX-A01` en `canonical-coverage.test.ts`: inserción `planned`, inserción `planned` desde un proceso Node independiente, cambio de `session.id`, salto de fase SCOPING. Comprueban resultado y lifecycle/recibo/reporte físicos. **Sin ejecución todavía.** Los positivos históricos de reporte normal, cierre `closed`+`waived` y recuperación siguen sin modificaciones; Codex debe comprobarlos.

## 2. A02 — un contrato para recibos canónicos

**Causa reproducida:** `reconcile()` y `sessionReport()` validaban conjuntos diferentes de campos; el reporte toleraba `trace.source` y `entity.target` incorrectos. Las dos lecturas no estaban protegidas de una revisión concurrente.

**Modificación aplicada:** `CanonicalClosureService.validCanonicalReceipt` exige ámbito, identidad, tipo de relación, source/target y revisiones fijadas, procedencia exacta por `closed/waived`, digest, revisor host y evidencia de revisión. Exige la revisión original 1, puesto que el productor oficial crea recibos una sola vez y los reintentos no deben reescribirlos. `reconcile()` y `sessionReport()` comparten el validador; una creación se relee, y el segundo informe se verifica bajo fence SQLite. El recibo por sí solo jamás reemplaza el asiento durable de decisión del host.

**Regresiones añadidas:** `RES-CODEX-A02` para fuente falsa, fuente falsa escrita por proceso independiente, destino falso y revisión derivada, con commits CAS reales y readback físico. El contrato rechaza recibo faltante y conserva positivos antiguos con recibos válidos (por certificar). No se relajan validaciones ni se inventa un gateway.

## 3. A03 — Knowledge existing-only

**Causa reproducida:** el manifiesto aceptaba una ruta que existía aunque el archivo tuviera cero bytes. El constructor del adaptador provisionaba/migraba el contenido y después fallaba el binding.

**Modificación aplicada:** preflight SQLite `DatabaseSync(path,{readOnly:true})` con `PRAGMA query_only=ON` antes de crear el adaptador; exige marca QAPK, versión v2 y migraciones 1/2. Bases vacías, ajenas o v1 se rechazan sin ejecutar migraciones. El constructor productivo sigue comprobando íntegramente esquema/FTS tras esta compuerta. La migración administrativa sigue separada.

**Regresión añadida:** archivo de cero bytes; después del rechazo se comparan bytes, tamaño, SHA-256 y catálogo SQLite read-only. Codex debe ampliar readback a archivo v1 y corruption/rollback/SQLite WAL según corresponda, sin alterar bases reales.

## 4. L01 y deuda de contratos

- Se sustituyó el cast innecesario de requisito en `canonical-closure-service.ts`, se eliminó su import no usado, se reescribió el saneador Markdown sin escapes sintácticos inválidos en `canonical-session-report.ts` y se corrigió el narrowing de arrays/limits en `host-composition.ts`. No se deshabilitaron reglas ESLint ni se cambió configuración. **La desaparición de los cinco diagnósticos no está verificada** hasta correr lint focal/global.
- **A04-W01 (P2 residual):** `IModuleClosureStore` admite wrappers estructurales; un wrapper que despacha una operación desde una cola/timer creado fuera de `execute` pierde `AsyncLocalStorage` y no transmite el deadline a `transaction`. El camino estándar inspeccionado compone directamente `SqliteModuleClosureStore`. Esta intervención **no añade** una abstracción genérica de deadlines ni promete garantía para wrappers arbitrarios. Su uso como adaptador privilegiado queda fuera del contrato certificado; si un host necesita wrappers, el puerto requiere un rediseño explícito de propagación de deadline antes de permitirlos, con pruebas adversariales. Queda pendiente confirmación formal del límite por el auditor.
- **RES-CODEX-E01 (P2):** el MCP en paralelo presentó import UNKNOWN por TEMP, timeouts, cleanup de locks después de timeout, `ENOENT/ECOMPROMISED`, `EPERM` en rename y errores de parseo de respuesta tras fallo de cierre. El baseline serial anterior fue 423 PASS/63 FAIL de 486; corridas paralelas previas 360/67 de 427 (parcial), 413/73 y 418/68 de 486. No se cambian timeouts ni se atribuye causalidad a entorno sin evidencia. Pendiente comparación con nuevos commits, aislando recursos y procesos sin ocultar fallos.

## 5. Matriz de disposición: 63 fallos previos por identidad

La fuente es `docs/vnext/auditorias/VNEXT-014-RESCATE-CODEX/DIFERENCIAL_MCP.md`, que preserva nombres exactos y errores. La clasificación describe **primera compuerta observada**, no demuestra que la garantía posterior sea correcta.

| Grupo histórico | Identidades | Disposición | Impacto |
| --- | ---: | --- | --- |
| Memory sin `withWriteFence`, bloqueo de seguridad legítimo + fixture incompatible | 8 | Migrar positivos a SQLite con fence real; mantener negativo sin fence; no borrar tests | Verificación de integridad de VNEXT-014 y merge; no dependencia directa del cálculo DAG aislado |
| Integración lifecycle/entrevista anterior | 5 | Reproducir E0a/E1/E2/E3/criterio9 con nueva adquisición/binding/decisiones host | Bloquea cierre integral VNEXT-014 y merge, no trabajo puro ImpactAnalyzer |
| Presentación ambigua + fixture incompatible | 3 | Fijar contrato visible por ruta, preservar preguntas/estados pertinentes | Contrato MCP y release; no DAG aislado |
| Entrevista/cobertura legacy en fixtures incompatibles | 19 | Migrar por equivalencia funcional, no convertir aserciones positivas en `blocked` | Cierre integral, cobertura y release; no DAG aislado |
| Pruebas obsoletas/fixture incompatible de rutas protegidas y SDK | 19 | Conservar garantías compatibles, distinguir rechazo de seguridad vs funcionalidad, revalidar | Integración MCP y release; no DAG aislado |
| Expectativas de autenticación obsoletas con bloqueo seguro | 9 | No restituir login implícito; nuevas pruebas de contrato opt-in | Release y contrato auth; no DAG aislado |
| **Total** | **63** | **No eliminadas** | **Sin resultados nuevos comprobados** |

No equiparar 63 FAIL con 63 defectos productivos nuevos. No diferir las regresiones de seguridad de `session_close` ni los recibos hasta el merge. Las 55 pruebas históricas y ocho Memory conservan identidad; la migración de garantías sigue pendiente en esta intervención.

## 6. Decisiones A/B/C (separadas)

| Compuerta | Estado al publicar este informe | Justificación |
| --- | --- | --- |
| **A — GO técnico para correcciones P1** | **PENDIENTE / NO-GO de certificación** | Código y regresiones publicados, pero falta reproducción física de A01/A02 en nuevo HEAD, incluyendo procesos independientes, no éxito falso y readback |
| **B — GO para desarrollar VNEXT-015 aisladamente** | **GO técnico condicionado** | WBS: `ImpactAnalyzer` solo depende de VNEXT-003 y VNEXT-009, ambas completadas. Trabajar en rama separada, limitarse a `@qap/engine`/`@qap/knowledge`, no consumir handlers de VNEXT-014 ni fusionar a develop sin integración probada. Requiere autorización y verificación de diff real |
| **C — GO integral VNEXT-014 / merge a develop** | **NO-GO** | Faltan pruebas de P1 y P2, matriz 63/486, paralelismo y aceptación humana auténtica; el recorrido con fixture no certifica consentimiento ni ejecución completa |

**Estrategia VNEXT-015:** ramificar desde el HEAD verificado de `feat/qap-vnext-architecture` a `feat/qap-vnext-015-impact-analyzer`; comenzar únicamente código y pruebas de cálculo DAG con dependencias v003/v009. Mantener separados los commits e informes. Antes de fusionar de vuelta a vNext, revisar diff/contratos y pasar suites Engine/Knowledge e ImpactAnalyzer, sin afirmar que esto autoriza a develop. Esta entrega **no implementó VNEXT-015**.

**Hitos preservados:** certificación objetivo 16/11/2026, posible merge condicionado hasta 19/11/2026 y MVP 20/11/2026. Las fechas no convierten un NO-GO en GO.

## 7. Commits, fuentes y evidencia

Commits de implementación/pruebas entre `7cfdefca` y `a05bfcc1` (recuperar lista exacta con `git log --oneline 7cfdefca..HEAD` y contrastar SHA productivo): validador de recibos, transacción protegida de lifecycle, handler de cierre, preflight host, saneamiento renderer y regresiones SQLite/MCP. Se efectuaron correcciones pequeñas adicionales de import, path hijo, revisión sellada y formato del código de subprocess. Los archivos afectados son:
- `packages/mcp/src/handlers/canonical-closure-service.ts`
- `packages/knowledge/src/storage/file-storage.ts`
- `packages/mcp/src/server.ts`
- `packages/mcp/src/host-composition.ts`
- `packages/mcp/src/handlers/canonical-session-report.ts`
- `packages/mcp/src/__tests__/canonical-coverage.test.ts`
- `packages/mcp/src/__tests__/host-composition.test.ts`

**Evidencia actual:** diff remoto y nueva cobertura de regresiones por inspección; **ninguna ejecución de test, build o lint desde la sesión GitHub**. La auditoría independiente anterior es evidencia exclusivamente del snapshot anterior. Codex debe publicar un nuevo informe, comandos, logs esenciales, readback físico y decisiones A/B/C sin sobrescribir auditorías anteriores.

**Restricciones respetadas:** no edición ni merge de `main`, `develop`, `staging`; sin force-push; sin credenciales, bases/archivos de sesión ni habilitación automática de autorizaciones.
