# VNEXT-014-D-R4-R8 — Identidad estable para aprobación diferida de aplicabilidad

**Fecha de trabajo:** 2026-11-05  
**Rama:** `feat/qap-vnext-architecture`  
**Baseline físico de código auditado:** `ea75eb2c52266b174e6d24917c1b089d56834900` (R4-R7)  
**Commit documental Codex del baseline:** `d0fa36f0baaf1baaf6ea20e3bea592cb4c398921`  
**Estado R4-R8:** auditoría independiente ejecutada sobre `44c69f826a0599eeee400ff413ae9faedeeecd75`. **R4-R7-A01 corregido para aprobación diferida sin deriva; carrera residual A02 P1 reproducida. VNEXT-014 NO-GO**; VNEXT-015 no iniciado. Las secciones 1–6 conservan el contexto previo a la auditoría; el resultado vigente está en la sección 7.

## 1. Auditoría R4-R7 independiente confirmada

Fuente: [INFORME R4-R7](auditorias/VNEXT-014-R4-R7/INFORME.md) y [EVIDENCIA_INTEGRACION](auditorias/VNEXT-014-R4-R7/EVIDENCIA_INTEGRACION.md).

- Entrevista 44/44 PASS; Coverage 37/37; Discovery 59/59; Runner 71/71; Stdio 18 tools + init; build 10 paquetes.
- MCP serial **407 PASS / 55 FAIL de 462**, mismos 55 fallos históricos; R4-R7-I01 aporta la única prueba nueva y pasó.
- ESLint global **34 errores / 28 advertencias**. Foco ampliado: cinco errores previamente existentes en `canonical-coverage-service.ts`; no atribuirlos a R4-R7. Discovery no reprodujo el timeout previo, cuya causa sigue sin determinarse.
- R4-R7 confirmó una cadena real de propuesta/corrección v0→v1→v2, rechazo del consentimiento antiguo, aprobación independiente para digest nuevo, requisito y recibo únicos, readback SQLite y cobertura honesta 0→1 requisito, 7→6 brechas, con `execution_coverage=not_executed`. No acreditó cierre `closed` ni sesión integrada.

## 2. Hallazgo R4-R7-A01 P1 y causa

Codex detectó que dos llamadas idénticas a `qap_module_close.canonical_closure.action=declare_non_applicable` mientras la decisión humana sigue pendiente generan solicitudes con `coverageDigest` y `requestDigest` distintos. La primera aprobación, recibida posteriormente por un inbox desacoplado, queda rechazada como `closure_review_invalid`. El sistema falla cerrado y no escribe aprobaciones/decisiones, pero no puede continuar la solicitud diferida.

Causa: `CanonicalClosureService.execute` fabricaba `decided_at=new Date().toISOString()` en el **objeto propuesto**, previo a recibir decisión. `CanonicalCoverageService.evaluate` incorporaba ese objeto completo en el digest. Una hora posterior alteraba la identidad pese a idéntica categoría, razón, conocimiento y contexto. Ninguna autoridad del cliente MCP justificaba esa diferencia.

## 3. Corrección publicada, sin ejecución

`packages/mcp/src/handlers/canonical-coverage-service.ts`:

- El digest de cobertura normaliza la aplicabilidad a sus **componentes semánticos y de autoridad**: categoría, aplicabilidad, motivo, identidad de revisor declarada por el gateway y decision_id. Excluye solo el reloj `decided_at`, que no es información estable de una solicitud pendiente.
- Permanecen dentro del digest las revisiones de requisitos, huella del contexto/binding, categorías, brechas y recibos de cobertura. El campo `decided_at` **no desaparece** de la evaluación ni del registro persistente.
- Consecuencia: dos solicitudes idénticas de igual estado semántico mantienen el digest; cambiar categoría, motivo, requisito o contexto sigue alterándolo. No se simplifica cobertura ni se autoriza automáticamente ninguna declaración.
- Advertencia de compatibilidad: el algoritmo del digest de cobertura cambia para aplicaciones ya existentes, por lo que Codex debe comprobar el comportamiento frente a cierres/recibos históricos y no suponer equivalencia de hashes anteriores.

`packages/mcp/src/handlers/canonical-closure-service.ts`:

- Antes de persistir una aprobación diferida de aplicabilidad, ejecuta nuevamente `coverageService.evaluate` sobre el conocimiento actual con la misma propuesta; si el resultado o el digest difiere del presentado al host, bloquea con `closure_context_changed`, sin escribir.
- Tras una decisión válida, persiste `decided_at` tomado del **host que aprobó**, no la hora de una solicitud todavía pendiente.
- El helper de gateway verifica `decidedAt` parseable/no futura y `expiresAt` posterior y no vencida. No se amplía la autoridad del gateway ni se aceptan decisiones enviadas por el cliente MCP.
- Este cambio conserva el modelo de cierre por autorización independiente y no modifica schema SQLite, herramientas públicas ni `main/develop`.
- **Límite conocido:** la relectura previa al commit estrecha la ventana de deriva, pero por sí sola no acredita transacción atómica entre `IKnowledgeStore` y `IModuleClosureStore` contra una escritura concurrente que llegue entre revalidación y commit. Se requieren pruebas adversariales y una decisión de contrato para la composición E2E final.

## 4. Regresiones publicadas sin resultados físicos

Archivo `packages/mcp/src/__tests__/canonical-coverage.test.ts`, Suite 3. Se agregaron **3 casos R4-R8-A01**:

1. **Dos pendientes, misma identidad:** se invoca `declare_non_applicable` dos veces con un intervalo para forzar reloj nuevo. Deben bloquear como pendientes, exponer coverage/request digest idénticos y no persistir decisiones. La aprobación emitida después para el primer digest debe aceptarse, guardar un solo registro de categoría `performance` con `decided_at` exacto del host, recibo/approval 1:1 y readback físico mediante segunda conexión SQLite.
2. **Motivo y requisito revisado invalidan aprobación antigua:** con una autorización todavía vigente de la primera solicitud, cambiar el motivo produce `closure_review_invalid`; restaurar el motivo pero modificar la revisión de un requisito canónico también cambia coverage/request digests y no agrega decisiones.
3. **Deriva durante espera:** el gateway de prueba revisa y modifica un requisito mientras responde a la petición. La aprobación original debe bloquear con `closure_context_changed`; el snapshot durable debe permanecer intacto y la revisión nueva del requisito en `IKnowledgeStore` es visible.

Las pruebas usan exclusivamente SQLite y gateways de fixture independientes. Ninguna modifica o accede a producción. **Baseline MCP 407/462 con 55 FAIL; no extrapolar cifras nuevas** sin ejecución.

## 5. Auditoría externa requerida

Codex debe auditar el HEAD R4-R8 exacto en un worktree aislado con Node 24/SQLite FTS5, Chromium y lockfile congelado. No puede corregir código ni alterar expectativas durante la auditoría. Ejecutar:

```powershell
pnpm build
pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-coverage.test.ts -t 'R4-R8-A01' --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-coverage.test.ts --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-interview.test.ts --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/mcp exec vitest run src/__tests__/discovery-handler.test.ts --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/mcp exec eslint src/handlers/canonical-closure-service.ts src/handlers/canonical-coverage-service.ts src/__tests__/canonical-coverage.test.ts
pnpm --filter @qap/mcp exec vitest run --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/playwright-runner exec vitest run --maxWorkers=1 --reporter=verbose
pnpm lint
```

Stdio 18 tools + `qap_init` y verificación del archivo de sesión protegido. Comparar el integral por título con la matriz R4-R7 (407 PASS / 55 FAIL de 462), y no ocultar timeouts de Discovery. Investigar adicionalmente reintento autorizado idéntico, cambios de contexto/binding, uso de `decisionId` tras aprobación, tiempo real del host, expiry y concurrencia CAS. Distinguir cualquier diferencia genuina del cambio de formato de hash.

## 6. Contrato de documentación / siguiente bloque

Publicar bajo `docs/vnext/auditorias/VNEXT-014-R4-R8/` `INFORME.md`, `EVIDENCIA_APLICABILIDAD.md`, `DIFERENCIAL_MCP.md`, `LINT.md`, `COMANDOS.md` y `SIGUIENTE_BLOQUE_P0.md`. Actualizar esta nota, `docs/vnext/STATE.md` y el backlog, con commit/push **solo documental y saneado** en `feat/qap-vnext-architecture`; nunca modificar código, tests, secretos, sesiones protegidas o ramas principales. Informar SHA de código auditado y SHA documental separadamente. El usuario no sube archivos.

**Después de verificar A01**: componer `closed` auténtico con requisitos confirmados y categorías aplicables/excluidas por autoridad independiente; agregar módulo B con waiver, reporte físico y replanificación, conservando E0a/E1/E2/E3/criterio 9. Los 55 fallos históricos y lint global siguen siendo bloqueos formales.

**Dictamen:** R4-R8 **PUBLICADA / NO CERTIFICADA**, VNEXT-014 **NO-GO**, VNEXT-015 **NO INICIADO**.

## 7. Resultado independiente ejecutado (2026-11-05)

- **Código exacto:** `44c69f826a0599eeee400ff413ae9faedeeecd75`. Worktree aislado, Node 24.15.0/SQLite 3.51.3 FTS5, pnpm 12.3.4, Chromium 153 y lockfile congelado. Build 10 PASS; R4-R8-A01 **3/3**, Coverage **40/40**, Interview **44/44**, Discovery **59/59** aislado y en integral, Runner **71/71**, Stdio **18 herramientas + qap_init** por servidor y CLI.
- **A01 verificado con alcance:** dos pendientes idénticos mantienen coverage/request digest; aprobación posterior de la primera aceptada y fecha exacta del host conservada con readback. Cambiar categoría/motivo/revisión invalida; mutación durante gateway bloquea sin approvals/decisiones. No equivale a atomicidad entre stores.
- **R4-R8-A02 P1, carrera residual de producción:** sonda externa coloca una mutación de requisito después de la reevaluación y antes de delegar a la transacción SQLite real de ClosureStore. Obtiene declared_non_applicable con una aprobación y una decisión persistidas para la cobertura anterior, aunque el requisito ya tiene revisión 2. La última lectura no queda protegida hasta commit. Es límite preexistente estrechado por R4-R8; no se declara resuelta la carrera por los tres tests nuevos.
- **Compatibilidad histórica probada en fixtures:** servicios exactos R4-R7 crean closed/waived físicos, R4-R8 conserva autoridad y registros al reabrir; digest ajeno en asiento correlacionado bloquea ambos. La evaluación nueva cambia hashes con aplicabilidad; no migrar ni equiparar algoritmos. Pendientes de inbox de versión anterior pueden necesitar nueva presentación/aprobación; esto es distinto de conservar terminales ya consumidos.
- **MCP 410 PASS / 55 FAIL de 465:** 407 PASS y 55 FAIL comunes por identidad exacta, tres altas aprobadas, cero bajas. Los cinco lifecycle y otros 50 históricos mantienen deuda de garantía; no se debilitaron tests. Discovery no reprodujo timeout, causa histórica abierta.
- **Lint:** foco **6 errores/0 warnings**, global **35 errores/28 warnings**. 62 diagnósticos históricos intactos y una alta **R4-R8-L01 P2**, prefer-const en canonical-coverage.test.ts:542:11. No se corrigió código ni test.
- **Dictamen vigente:** A01 funcional acotado PASS; **VNEXT-014 NO-GO** por A02, lint, 55 fallos y composición closed/waived/reporte/replanificación pendiente. Commit documental separado del SHA auditado, resuelto por historial del informe y comunicado en entrega; publicación exclusivamente documental a la rama autorizada.
- [Informe y métricas](auditorias/VNEXT-014-R4-R8/INFORME.md) · [Evidencia reproducible](auditorias/VNEXT-014-R4-R8/EVIDENCIA_APLICABILIDAD.md) · [Diferencial](auditorias/VNEXT-014-R4-R8/DIFERENCIAL_MCP.md) · [Siguiente P0](auditorias/VNEXT-014-R4-R8/SIGUIENTE_BLOQUE_P0.md).
