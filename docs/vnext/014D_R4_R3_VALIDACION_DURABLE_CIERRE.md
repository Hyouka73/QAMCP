# VNEXT-014-D-R4-R3 — Validación de integridad de cierre canónico durable

**Fecha:** 2026-11-04  
**Rama única:** `feat/qap-vnext-architecture`  
**Base auditada físicamente por Codex:** `4ed8511f2ee88e63ff2da21a5a6f45dd6786f7f9` (R4-R2)  
**Estado de R4-R3:** auditoría independiente ejecutada sobre `7e0142a97c67fa1c65c46a83e2a5f003b0b435cd`. Véase la sección 7.
**Dictamen general:** VNEXT-014 **NO-GO**; VNEXT-015 no iniciado.

## 1. Evidencia R4-R2 (no atribuir a R4-R3)

La nueva auditoría independiente en Windows con Node 24.15.0/SQLite FTS5, lockfile y Chromium verificó sobre `4ed8511f`:

| Compuerta | Resultado físico R4-R2 |
| --- | --- |
| Build | 10 paquetes PASS |
| R4-R2-A01 | PASS: primera llamada `qap_session_close` llega a WRAP_UP y escribe reporte |
| Canonical Coverage | 26/26 PASS |
| DiscoveryHandler | 59/59 PASS |
| MCP serial | **394 PASS / 55 FAIL / 449 total** |
| Runner | 71/71 PASS |
| Stdio | 18 herramientas y `qap_init` PASS |
| ESLint focal | 4 errores de imports sin uso en `canonical-coverage.test.ts` |
| Lint global | **38 errores / 28 warnings** |

Los 55 casos fallidos continuaron por título en siete suites: lifecycle 5, p3-verification 5, p4-2 2, p4-4 7, p4-5a 10, p4-5a2 16, server 10. El historial previo no equivale a certificación del nuevo HEAD. El test R4-R2-A01 fue el único test nuevo y pasó en ejecución integral.

## 2. Hallazgos nuevos en recuperación

El auditor creó exclusivamente **fixtures internos sintéticos con transacciones de SqliteModuleClosureStore**, no llamadas públicas que hayan demostrado producir estos datos:

### R4-R2-A02 — Motivo inválido

- Con registro terminal `waived` y `waiverReason` de un carácter, la reconciliación lo trató como suficiente, creó el recibo y permitió cerrar la sesión con reporte y WRAP_UP.
- Con razón hecha solo de espacios, la sesión se bloqueó, pero **se creó el recibo indebidamente** antes de descubrir que la razón no podía proyectarse.
- Invariante: el motivo del waiver debe tener **al menos 15 caracteres tras trim**, al igual que el comando canónico público; no basta con que la cadena sea no vacía. Se debe verificar **antes de cualquier escritura** de recibo o lifecycle.

### R4-R2-A03 — Asiento de aprobación ausente

- Un `ModuleClosureRecord` terminal sin entrada correspondiente `[decisionId, requestDigest]` en `snapshot.approvals` fue tratado como autorizado, generó recibo y desbloqueó sesión.
- Invariante: la existencia del registro terminal no certifica la aprobación. Debe existir **exactamente un** par aprobado con el mismo identificador y digest en el mismo snapshot durable.
- Sin asiento, con digest diferente o con pares duplicados, no emitir recibo, no proyectar cierre y no declarar `allModulesClosed`.
- **Límite de seguridad:** las sondas escribieron mediante la API interna del almacén. No se acreditó que el canal MCP público pudiera crear estos estados. La correlación de par es una comprobación de integridad del registro, **no prueba criptográfica independiente de una decisión humana**.

## 3. Corrección aplicada en código

Archivo `packages/mcp/src/handlers/canonical-closure-service.ts`.

Se introdujo `isAuthorizedDurableClosure(plannedName, closure, snapshot)` que exige:

1. `plannedName` y estado terminal coherentes.
2. `decisionId` y `requestDigest` presentes y no vacíos.
3. Para `waived`, `waiverReason.trim().length >= 15`.
4. Exactamente una entrada en `snapshot.approvals` con el `decisionId` del cierre y el `requestDigest` idéntico.

Se aplica en las siguientes fronteras:

- `reconcile()`: rechaza registros inválidos **antes** de la recuperación de recibo, de lifecycle o de solicitar otro review.
- `status()`: no devuelve `closed` ni `waived` si el registro durable es inválido; proyecta `state:working, ready_for_closure:false`, haciendo que `allModulesClosed()` conserve la compuerta segura.
- `execute()`: no considera un registro inválido como éxito idempotente; devuelve `blocked / invalid_durable_closure`, sin gateway adicional.
- `commitFinalClosure()`: ante carrera con registro existente, verifica autorización durable antes de regresar resultado idempotente.
- `projectLifecycleClosure()`: protección adicional de la longitud de motivo antes de proyectar renuncia, conservando exactamente el texto original cuando es válido.

No se alteran `canExitWorking`, la compuerta de fase, permisos del host, SQLite v2, ni se autoriza waiver por un resultado de crawler o por la presencia del archivo lifecycle. Si el registro interno está corrupto/incompleto, el servicio se mantiene en estado **bloqueado**, no repara agregando aprobaciones ni motivos inventados.

## 4. Regresiones añadidas

En `packages/mcp/src/__tests__/canonical-coverage.test.ts`, Suite 5, se agregaron **siete escenarios** con SQLite/FS físicos desechables y servidor MCP real:

1. Waiver con motivo de un carácter y aprobación correlacionada.
2. Waiver con motivo blanco y aprobación correlacionada.
3. Waiver sustantivo sin entrada de aprobación.
4. Waiver sustantivo con digest de aprobación distinto.
5. Waiver sustantivo con aprobación duplicada.
6. Estado `closed` sin aprobación correlacionada.
7. Estado lifecycle previamente `waived` con motivo, pero cierre durable sin aprobación.

Para cada uno se exige `reconcile() === false`, `status().state === 'working'`, `execute() === blocked/invalid_durable_closure`, `qap_session_close === blocked/canonical_module_closure_required`, **cero nuevos recibos**, lifecycle y closure-store intactos, y ausencia de reporte físico. Gateway de test lanza error si el código solicita autorización nueva silenciosamente.

Al publicarse la corrección, estas pruebas estaban pendientes de ejecución independiente. Deben pasar todas sus aserciones; no convertir bloqueo genérico por fixture en PASS ni reducir el alcance.

## 5. Lint focal

La auditoría R4-R2 detectó solamente cuatro imports sin uso en `canonical-coverage.test.ts`: `createHash` (1:35), `DatabaseSync` (6:10), `ExpectedRequirement` (12:8), `CanonicalGap` (14:8). Se retiraron exactamente estos imports. Al publicarse la corrección, la eliminación estaba pendiente de verificar con ESLint.

La deuda global R4-R2 fue **38 errores / 28 warnings**, pendiente por archivo/regla. La limpieza de imports, aun si pasa, no constituye un PASS del lint global.

## 6. Compuerta independiente obligatoria

Auditar en un checkout/worktree seguro de `feat/qap-vnext-architecture`, con Node 24 que confirme FTS5, pnpm lockfile y Chromium. Verificar el SHA publicado después de los commits y que `main`, `develop` y cualquier `admin-user.json` protegido no fueron tocados.

```powershell
git status --short
git rev-parse HEAD
pnpm build
pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-coverage.test.ts -t 'R4-R3: inconsistent durable closure' --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/mcp exec vitest run src/__tests__/canonical-coverage.test.ts --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/mcp exec vitest run src/__tests__/discovery-handler.test.ts --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/mcp exec eslint src/handlers/canonical-closure-service.ts src/__tests__/canonical-coverage.test.ts src/server.ts
pnpm --filter @qap/mcp exec vitest run --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/playwright-runner exec vitest run --maxWorkers=1 --reporter=verbose
pnpm lint
```

Volver a ejecutar centinela Stdio real con 18 tools y `qap_init`, si está disponible en el worktree, y registrar códigos de salida/logs. Los fallos heredados deben identificarse por título y número; R4-R3 añade **7 tests**, pero no se presume cantidad de PASS.

**Criterio de seguridad:** no debe haber éxito de `qap_session_close` para registros inválidos, incluso si lifecycle ya está terminal, y no debe aparecer un recibo nuevo en `IKnowledgeStore`. Confirmar que Crash 2/3, el waiver válido con espacios y el primer cierre post-reconcile siguen funcionando (regresión positiva).

**Criterio de cierre VNEXT-014:** mantener NO-GO mientras el MCP integral tenga 55 fallos, lifecycle legacy no esté reconciliado, o lint global continúe con errores. VNEXT-015 no se inicia prematuramente.

## 7. Auditoría independiente ejecutada (2026-11-04)

**SHA auditado:** `7e0142a97c67fa1c65c46a83e2a5f003b0b435cd`. **Entorno:** worktree aislado en Windows x64, Node 24.15.0, SQLite 3.51.3 con FTS5 verificado, pnpm 11.3.0 con instalación de lockfile congelado y Chromium 153.0.8010.12. Las mediciones corresponden al SHA de código y preceden a este commit documental.

| Ejecución | Resultado | Salida |
| --- | --- | ---: |
| `pnpm build` | 10 paquetes compilados | 0 |
| Vitest focal R4-R3 | 7/7 | 0 |
| Vitest Canonical Coverage | 33/33 | 0 |
| Vitest Discovery | 58/59 por timeout inicial, 59/59 en reintento | 1 → 0 |
| ESLint focal | 1 error, 0 advertencias. Los cuatro imports quedaron limpios | 1 |
| Vitest MCP integral serial | Primer intento 343 PASS, 55 FAIL y 58 sin resultado tras salida inesperada del worker. Reintento completo 401 PASS / 55 FAIL de 456 | 1 → 1 |
| Vitest Playwright Runner | 71/71 | 0 |
| `pnpm lint` | 35 errores y 28 advertencias frente a 38 y 28 en R4-R2 | 1 |
| Centinela MCP Stdio | 18 herramientas y `qap_init` real en fixture autorizado | 0 |

**R4-R2-A02 PASS.** Los motivos de un carácter y en blanco quedaron bloqueados por longitud tras trim, aunque la aprobación del fixture coincidía.

**R4-R2-A03 PASS.** Quedaron bloqueados el waiver sin asiento, con digest distinto y con asientos duplicados, el cierre `closed` sin asiento y el waiver con lifecycle ya terminal y sin asiento.

En los siete casos, `reconcile` devolvió false, el estado canónico quedó `working`, `execute` devolvió `invalid_durable_closure` y `qap_session_close` devolvió `canonical_module_closure_required`. Se comprobaron cero recibos, cero reportes, cero consultas al gateway y snapshots y lifecycle intactos. Crash Scenarios 2 y 3 pasaron con autorizaciones válidas. R4-R2-A01 llegó a WRAP_UP en la primera llamada y generó el reporte con el motivo autorizado.

**R4-R3-A01 (P2).** Con lifecycle `waived` y aprobación durable ausente, `qap_status` informó estado canónico `working` pero recomendó `qap_session_close`. El cierre efectivo bloqueó. La primera causa está en `StatusHandler.execute`, que pasa estados legacy a `getPhaseGuidance` sin conciliar el cierre canónico. El fixture terminal reproduce la contradicción. La ruta de guidance es anterior a este SHA.

**Dictamen NO-GO.** Los 55 fallos históricos conservan identidad por archivo y título. Sigue abierto el lint, incluido `preserve-caught-error` en `canonical-closure-service.ts:754:15`, y queda pendiente corregir la recomendación pública de cierre. La causa interna de la salida del worker y del timeout inicial de Discovery quedó sin confirmar. VNEXT-015 sigue sin iniciar.

[Informe completo](auditorias/VNEXT-014-R4-R3/INFORME.md) · [Comandos exactos, códigos y hashes](auditorias/VNEXT-014-R4-R3/COMANDOS.md) · [Diferencial MCP](auditorias/VNEXT-014-R4-R3/DIFERENCIAL_MCP.md) · [Evidencia de cierre](auditorias/VNEXT-014-R4-R3/EVIDENCIA_CIERRE.md) · [Lint](auditorias/VNEXT-014-R4-R3/LINT.md)
