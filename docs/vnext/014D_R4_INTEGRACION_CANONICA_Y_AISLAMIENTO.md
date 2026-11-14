# VNEXT-014-D-R4 — Reconciliación de aislamiento y prueba de recorrido canónico

**Fecha:** 2026-11-04  
**Rama:** `feat/qap-vnext-architecture`  
**Base auditada dinámicamente por Codex:** `22387b77162da984f9cfb167a93580219f1f9fff` (R3)  
**Estado R4:** pruebas/código de pruebas publicados. **SIN ejecución local o CI del nuevo HEAD.**  
**Dictamen para VNEXT-014:** **NO-GO.**

## 1. Auditoría R3 recibida

La auditoría independiente de R3 acredita:
- Monorepo: 10 paquetes build PASS.
- Runner completo: 71/71 PASS.
- MCP serial: **391 PASS / 56 FAIL** (447), sin skips/todos; seis suites R3: 92 PASS / 27 FAIL.
- Los **18 casos objetivo R3** recuperaron sus aserciones originales: F01, F14–F19, F31–F32, F50, F54, F57–F63.
- Los 55 restantes del inventario histórico R01–R60 siguieron fallando; 21 cambiaron su primer error tras corregir preparación, sin demostrar que sean 21 regresiones nuevas.
- **N01**: `discovery-handler.test.ts`, aislamiento multiserver, pasó de esperar `indeterminate` a recibir el nuevo contrato seguro `blocked / invalid_project_scope`. Las posteriores aserciones de aislamiento dejaron de ejecutarse.
- Lifecycle V3 **2/7 PASS**. El lint de archivos R3 tuvo cero diagnósticos. El lint global y Stdio no se reejecutaron en R3; su evidencia pertenece a R2.

Las cifras anteriores son del SHA R3, **no resultados de R4**. Logs, comandos y el inventario individual fueron proporcionados por el auditor como archivos externos; los tests remotos de R4 no fueron ejecutados por quien publica esta ronda.

## 2. R4-01 — Aislamiento entre dos instancias MCP sin expectativa obsoleta

Se corrigió únicamente el test `keeps project bindings and physical stores isolated between server instances` de `packages/mcp/src/__tests__/discovery-handler.test.ts`.

La validación ahora exige:
1. Un cliente del servidor 1 con `targetPath` del proyecto 2 obtiene `blocked / invalid_project_scope`, `persistence:not_attempted`, ninguna visita HTTP y cero observaciones en ambos stores.
2. Una adquisición posterior autorizada del servidor 1 persiste seis observaciones **solo** en SQLite 1, mientras el servidor 2 conserva cero visitas y observaciones.
3. Una conexión independiente y autorizada al servidor 2 sigue funcionando; persiste sus propias seis observaciones y no duplica/altera las seis del servidor 1.
4. Se inspeccionan los accesos a ambas aplicaciones HTTP locales y sus inventarios de observaciones.

El objetivo es **reconciliar N01 y reforzar el caso**, no convertir en PASS un bloqueo genérico ni suprimir las comprobaciones de aislamiento. Se preservan `projectRoots`, validación de host, política de navegación y stores físicos.

## 3. R4-02 — Nuevo test de integración real: adquisición → revisión → waiver → sesión

Se añadió en la misma suite de `discovery-handler.test.ts` un escenario `R4: real crawler to canonical interview, independent review, secure waiver and WRAP_UP through MCP`.

Reutiliza el fixture ya probado de `bridgeFixture()`, con binding explícito `ModuleBinding` de la autoridad del host. Provee:

- Servidor HTTP de prueba local; Chromium real a través de `BlackBoxCrawler` y asociación de seis observaciones con `ModuleObservationBridge`.
- Servidor MCP real con `InMemoryTransport`, `SqliteKnowledgeAdapter` físico y `SqliteModuleClosureStore` físico en ruta desechable; secreto de cierre aleatorio generado por el test.
- Gateway de revisión de requisitos que **devuelve null inicialmente**, bloqueando la confirmación. El fixture simula después una decisión explícita autorizada por el host, con digest del enunciado, ID independiente y vigencia.
- Una propuesta sustantiva redactada para la pregunta canónica de propósito. No se promueve la observación a `confirmed`; se exige aprobación de revisión independiente y se verifica un registro de `ExpectedRequirement`.
- `qap_status` proyecta `confirmed_requirements:1` pero conserva `coverage:not_certified`. No se inventa certificación de pruebas.
- El cierre legacy de un módulo enlazado devuelve `canonical_closure_required`; `qap_session_close` permanece bloqueado hasta resolución del módulo.
- `canonical_closure.evaluate` evalúa sin cerrar. Se prueba una **renuncia (waive)** con motivo sustantivo, primero sin autorización del gateway (`closure_review_pending`) y luego con decisión sintética explícita del host. No se intenta certificar cierre completo con categorías sin cubrir.
- Solo tras la renuncia aprobada se intenta `qap_session_close` y se comprueba `WRAP_UP`. La prueba exige estado `waived` persistido en lifecycle, recibo `canonical_module_waiver_v1` en SQLite, generación física del archivo de reporte de sesión y conservación del requisito confirmado sin crear `rules.yaml` legacy ficticio. Verifica también el inventario de hits HTTP esperados.

**Límite:** es una prueba de integración técnica con decisiones sintéticas del host en un entorno desechable, **no una aprobación humana real, una prueba E2E de interfaz de usuario ni una afirmación de que el producto posee UI de revisión**. Se comprueba un camino válido de renuncia, no `closed` con cobertura funcional total. Su ejecución puede descubrir defectos reales entre el closure-store, lifecycle y reporting. **No asignar PASS hasta ejecutarla.**

## 4. Faltantes explícitos

- Deuda histórica **55 tests** de la migración `DiscoveryHandler`: 21 clase A, 29 B, 5 D. No se borran, omiten ni reescriben a bloqueos triviales.
- R4 aporta una prueba integrada adicional, pero no migra todavía los cinco escenarios heredados de `lifecycle-v3-e2e.test.ts`. Su contrato temporal y el modelo canónico deben reconciliarse por garantía individual.
- Autenticación dinámica/SPA y extracción de `selectors.json` no están acreditadas por el crawler anónimo estático. Hay que separar los contratos de `qap_test` y de `qap_discover`.
- P4.4 todavía tiene fixtures con raíz sin autorización y también expectativas de comportamiento legacy no disponible. Corregir `projectRoots` es necesario para acceder a la ruta, pero **no es suficiente para dar por acreditada la detección de auth-wall**.
- Lint global: último dato auditado en R2 46 errores y 28 warnings; no volver a asociarlo automáticamente a HEAD R4.
- Sin tests/compilación/studio/certificación física R4 en esta sesión. Estado NO-GO.

## 5. Compuerta de auditoría R4

En checkout local Windows, usar la rama `feat/qap-vnext-architecture` y proteger íntegramente `packages/playwright-runner/.qa/cache/sessions/admin-user.json`. Verificar `git status`, rama, ancestralidad y actualización `--ff-only` antes de ejecutar. No modificar fuentes ni flags del producto.

```powershell
pnpm build
pnpm --filter @qap/mcp exec vitest run src/__tests__/discovery-handler.test.ts --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/mcp exec eslint src/__tests__/discovery-handler.test.ts
pnpm --filter @qap/mcp exec vitest run --maxWorkers=1 --reporter=verbose
pnpm --filter @qap/playwright-runner exec vitest run --maxWorkers=1
pnpm lint
```

**Auditar primero** N01 y el nuevo test R4. Si falla, conservar error exacto, stack, respuesta MCP y estado de los dos stores (sin volcar datos sensibles). No sustituir las decisiones del gateway por autoaprobaciones de producción, no crear reglas legacy y no inventar sesiones/observaciones.

Criterios de evaluación:
- N01 debe pasar **todo el escenario**, incluidos servidor 2, stores e HTTP. Un bloqueo correcto que impida el resto no basta.
- Nuevo R4 debe recorrer todos los pasos: asociación física, pregunta, propuesta, bloqueo sin autorización, confirmación con gateway de test, evaluación de cierre, renuncia aprobada, cierre de sesión y WRAP_UP.
- Comparar el total del MCP serial con 391/447 de R3 **por título**, indicando que R4 añadió una prueba; no restar fallos sin identidad.
- Si el nuevo test revela fallo de producción, reportarlo como defecto real y mantener NO-GO. Si está mal el fixture, corregirlo en posterior commit sin hacer pasar una aserción distinta.
- Revisar lint global por archivo/regla con enfoque de deuda, sin suprimir errores a ciegas.

## 6. Próxima ruta

1. Reejecutar y corregir cualquier defecto expuesto por el test integrado R4.
2. Implementar y verificar la cadena completa de **cierre confirmado** con requisitos/cobertura válidos y gateway, distinta de waiver.
3. Migrar uno a uno los tests legacy E0a/E1/E2/E3/C9 y otros 50, conservando las garantías sin reintroducir `rules.yaml` artificial.
4. Exigir certificación MCP serial, runner, build, Stdio, lint y evidencia del SHA final antes de cerrar VNEXT-014. Mantener VNEXT-015 pendiente.
