# VNEXT-014-B — Implementación Declarativa de PlanHandler y Resolución DAG

**Hito:** VNEXT-014 (Hito 3: Desacoplamiento Modular MCP — Conexión Real de `qap_plan` y `qap_test`)  
**Microtarea:** VNEXT-014-B (Sustitución del Stub de `qap_plan` por `PlanHandler` Declarativo y Planificador DAG)  
**Fecha:** 2026-11-02  
**Autor / Rol:** Equipo Multi-Agente Teamwork (`teamwork_worker_014b`)  
**Rama:** `feat/qap-vnext-architecture`  
**HEAD Base de Referencia:** `cace8125acd4c6c47be2ae31d833a10e1e1856ee`  
**Modo de Integridad:** Development (Implementación Genuina, Pruebas Deterministas, Cero Código Sintético / Trampa)  

---

## 1. Contratos y Fuente Real de Casos de Prueba

### 1.1 Distinción Formal: Casos YAML vs Entidades Canónicas Knowledge (SQLite v2)
En la arquitectura de QAMCP coexisten dos capas epistemológicas que deben mantenerse estrictamente aisladas para no violar el principio D-011:

1. **Entidades Epistemológicas en SQLite v2 (`packages/knowledge/src/storage/knowledge-sqlite-schema.ts`):**
   - El catálogo de entidades de Knowledge (`KnowledgeEntities` en `packages/engine/src/knowledge-store.port.ts`) almacena conceptos del dominio analítico: `application`, `environment`, `role`, `observation`, `inference`, `requirement`, `assessment`, `module`, `view`, `action_target`, `flow`, `evidence`, `relation`.
   - **No existe ninguna entidad ni tabla física para casos de prueba (`test_case`) en SQLite v2.**
   - Las entidades `ExpectedRequirement` o `ApplicationObservation` no poseen selectores, tipos de acción Playwright ni aserciones ejecutables en navegador. Confundir o convertir observaciones/inferencias/requisitos en casos ejecutables violaría la honestidad del plano epistemológico.

2. **Casos de Prueba Ejecutables Reales en YAML (`.qa/modules/<moduleName>/tests/TC-*.yaml`):**
   - El esquema canónico de un caso de prueba ejecutable (`TCCase` en `@qap/shared` y `@qap/engine`) se estructura en formato YAML con pasos operativos Playwright (`navigate`, `fill`, `click`, `assert`, `waitFor`, `screenshot`).
   - Los archivos residen físicamente en el directorio del proyecto bajo `.qa/modules/<moduleName>/tests/` y son leídos mediante `FileSystemStorage` (`listTestCases` y `getTestCase`).
   - **`PlanHandler` utiliza exclusivamente estos casos de prueba reales.** Si un módulo no posee casos YAML en disco, el handler responde explícitamente con ausencia de casos (`cases: []`) o estado bloqueado, sin sintetizar casos ficticios.

### 1.2 Prohibición del Fallback de `QAPEngine.plan()`
El método preexistente `QAPEngine.plan(moduleName)` recurría históricamente a un plan sintético por defecto (`defaultPlan = { modules: [moduleName] }`) cuando no existía `.qa/plans/${moduleName}.json`.  
Este fallback es deliberadamente **rechazado y omitido** en `PlanHandler` porque:
- Omitía la validación de si el módulo existe realmente en `.qa/modules/`.
- Omitía la verificación de si existen archivos de prueba ejecutables.
- No ejecutaba ninguna resolución DAG (`DependencyGraphResolver`).
- Permitía certificar falsamente planes de prueba exitosos sobre módulos vacíos o no instrumentados.

---

## 2. Archivos Modificados y Creados

| Archivo | Tipo de Acción | Responsabilidad y Justificación |
|---|:---:|---|
| `packages/mcp/src/handlers/plan.handler.ts` | **Creado** | Implementación de `PlanHandler` (`IMcpToolHandler`), validación estricta de argumentos, seguridad canónica de rutas, detección de IDs duplicados, validación de dependencias inexistentes, preservación de casos editados manualmente (`UpdateGuard`), ordenamiento DAG (`DependencyGraphResolver`), manejo seguro de ciclos y persistencia atómica en `.qa/modules/<name>/tests/plan.json`. |
| `packages/mcp/src/server.ts` | **Modificado** | Importación de `PlanHandler`, adición de `'qap_plan'` al conjunto `migrated`, registro en `ToolDispatcher`, eliminación del bloque legacy `case 'qap_plan'` (antiguo stub) y preservación intacta de `qap_test` manteniendo exactamente 18 herramientas MCP. |
| `packages/mcp/src/__tests__/plan-handler.test.ts` | **Creado** | Suite exhaustiva de pruebas unitarias y de integración end-to-end con Vitest y `@modelcontextprotocol/sdk` verificando los 9 criterios obligatorios de aceptación. |
| `docs/vnext/014B_PLAN_HANDLER.md` | **Creado** | Informe técnico detallado de entrega para VNEXT-014-B. |
| `docs/vnext/STATE.md` | **Modificado** | Actualización mínima y no destructiva de la bitácora de estado del proyecto. |

---

## 3. Pruebas Ejecutadas y Comparación frente a la Línea Base de 014-A

### 3.1 Resultados de Pruebas Ejecutadas en VNEXT-014-B

| Suite de Pruebas / Script | Aprobadas | Fallidas | Omitidas | Tasa de Éxito | Estado |
|---|:---:|:---:|:---:|:---:|:---:|
| `plan-handler.test.ts` (Nueva Suite MCP) | 14 | 0 | 0 | **100%** | **PASS** |
| `dispatcher.test.ts` & `dispatcher-integration.test.ts` | 46 | 0 | 0 | **100%** | **PASS** |
| `adversarial-r5-guarantees.test.ts` (MCP) | 34 | 0 | 0 | **100%** | **PASS** |
| `plan-command.test.ts` (`@hyouka73/qap-cli`) | 4 | 0 | 0 | **100%** | **PASS** |
| `dependency-graph.test.ts` (`@qap/knowledge`) | 3 | 0 | 0 | **100%** | **PASS** |
| `@qap/shared` (Suite Completa) | 162 | 0 | 0 | **100%** | **PASS** |
| `@qap/engine` (Suite Completa) | 168 | 0 | 0 | **100%** | **PASS** |
| Compilación del Monorepo (`pnpm build`) | 10 paquetes | 0 | 0 | **100%** | **PASS** |
| Centinela MCP Stdio (`test-mcp-stdio.mjs`) | 18 tools | 0 | 0 | **100%** | **PASS** |
| Linter (`eslint` sobre archivos afectados) | 0 errores | 0 warnings | 0 | **100%** | **PASS** |

### 3.2 Cobertura de Criterios de Aceptación en `plan-handler.test.ts`
1. **Orden Topológico DAG**: Verifica ordenamiento determinista con dependencias encadenadas (`TC-001` -> `TC-002` -> `TC-003`) y persistencia física en `.qa/modules/checkout/tests/plan.json`.
2. **Dependencias Inexistentes**: Detecta dependencias rotas hacia casos que no existen en el módulo, retornando `{ status: 'error', code: 'missing_dependencies' }` sin excepciones no controladas.
3. **IDs Duplicados**: Detecta colisión de identificadores en distintos archivos YAML antes de invocar el resolvedor de grafos, retornando `{ status: 'error', code: 'duplicate_case_ids' }`.
4. **Detección de Ciclos**: Maneja dependencias circulares recursivas (`TC-001` <-> `TC-002`) retornando estructuradamente `{ status: 'error', code: 'cyclic_dependency', has_cycles: true, cycles: [...] }` sin abortar el proceso.
5. **Módulo sin Casos**: Responde con `{ status: 'empty', cases: [] }` ante directorios sin casos de prueba o casos sin pasos ejecutables, sin fabricar planes artificiales.
6. **Seguridad Canónica de Rutas y Argumentos**: Rechaza argumentos inválidos, rechaza `targetPath` fuera de los `projectRoots` autorizados, previene escapes por traversals (`..`), rechaza junctions/symlinks y previene accesos multi-unidad no autorizados en Windows.
7. **Preservación de Casos Manuales (`UpdateGuard`)**: Identifica y reporta en `preserved_cases` aquellos casos marcados con `manually_edited: true`.
8. **Integración MCP End-to-End**: Levanta `createMcpServer()` sobre `InMemoryTransport`, verifica que se exponen exactamente 18 herramientas MCP, comprueba la ejecución de `qap_plan` vía dispatcher y constata que `qap_test` permanece intacto.
9. **Ausencia de Planes Sintéticos**: Garantiza que no se recurre al fallback de `QAPEngine.plan()` ni se declaran casos ficticios.

### 3.3 Comparación frente a la Línea Base Documentada en VNEXT-014-A
- **Línea Base Documentada en 014-A:**
  - `@qap/shared`: 162/162 PASS (se mantiene idéntico al 100%).
  - `@qap/engine`: 168/168 PASS (se mantiene idéntico al 100%).
  - `@qap/knowledge` lógica pura y DAG: 174/174 PASS (se mantiene idéntico al 100%).
  - MCP Stdio Sentinel: 18 tools catalogadas, exit code 0 (se mantiene idéntico al 100%).
  - Bloqueos ambientales preexistentes: 84 fallos por módulo SQLite FTS5 ausente en Node v22.13.0 Windows y 10 fallos de Playwright por ausencia del binario Chromium `headless_shell-1234`.
- **Evaluación Post-Implementación:**
  - Cero regresiones introducidas en código o pruebas existentes.
  - Cero pruebas relajadas, omitidas o alteradas.
  - Los 14 nuevos tests de `plan-handler.test.ts` pasan al 100% sin depender de FTS5 ni de Chromium.

---

## 4. Limitaciones y Bloqueos Identificados

1. **Bloqueos Ambientales Preexistentes (Heredados de 014-A):**
   - Node.js activo en el host es `v22.13.0` (sin FTS5 compilado en `node:sqlite`). Las pruebas que consumen SQLite FTS5 en `@qap/knowledge` continúan requiriendo Node.js 24 LTS o contenedor con FTS5. `PlanHandler` no se ve afectado al operar directamente sobre archivos YAML y estructuras DAG en memoria.
   - Playwright Runner requiere Chromium `headless_shell-1234`. Dicho binario es necesario exclusivamente para VNEXT-014-C (`qap_test`).
2. **Alcance de VNEXT-014-B:**
   - `PlanHandler` genera, valida, ordena y persiste planes de prueba estructurados. No ejecuta los casos ni lanza navegadores Playwright. La ejecución física de pruebas corresponde a VNEXT-014-C.

---

## 5. Dictamen Formal

**DICTAMEN: PASS (100% CUMPLIDO)**

La microtarea VNEXT-014-B ha sido completada en su totalidad con éxito. El stub legacy de `qap_plan` ha sido sustituido por un handler declarativo genuino conectado al planificador DAG y a casos de prueba reales del monorepo, respetando la seguridad canónica de rutas, la integridad epistemológica y los estándares de persistencia atómica.

---

## 6. Estado de Git y SHA de Referencia

- **Rama:** `feat/qap-vnext-architecture`
- **HEAD Commit Base:** `cace8125acd4c6c47be2ae31d833a10e1e1856ee`
- **Archivos Rastreados Modificados / Creados:**
  - `packages/mcp/src/handlers/plan.handler.ts` (untracked nuevo)
  - `packages/mcp/src/__tests__/plan-handler.test.ts` (untracked nuevo)
  - `packages/mcp/src/server.ts` (modified)
  - `docs/vnext/014B_PLAN_HANDLER.md` (untracked nuevo)
  - `docs/vnext/STATE.md` (modified)
- **Árbol de Trabajo:** Limpio de residuos temporales; sin modificaciones en `main`, `develop`, credenciales ni SQLite v2.

---

## 7. Prompt Autosuficiente para VNEXT-014-C

```markdown
# Asignación Técnica: Implementación de TestHandler y Conexión de PlaywrightRunner (VNEXT-014-C)

Implementar VNEXT-014-C en el repositorio QAMCP (rama `feat/qap-vnext-architecture`), sustituyendo el stub de `qap_test` en `packages/mcp/src/server.ts` por un handler declarativo modular (`packages/mcp/src/handlers/test.handler.ts`) conectado al plan de pruebas generado en VNEXT-014-B y a `PlaywrightRunner`.

Working directory: D:\Proyectos X\QAMCP
Integrity mode: development
The team must NOT: modificar las ramas main ni develop, alterar SQLite canónico v2, leer ni modificar admin-user.json, fabricar ejecuciones ni resultados sintéticos, relajar pruebas, publicar en npm, hacer merges ni force-push.

## Contexto y Referencias Previas
- Hito previo completado: VNEXT-014-B (PlanHandler declarativo en `packages/mcp/src/handlers/plan.handler.ts` con persistencia en `.qa/modules/<name>/tests/plan.json`).
- Documentos de referencia obligatorios:
  - `docs/vnext/014B_PLAN_HANDLER.md`
  - `docs/vnext/014A_PREPARACION_TECNICA.md`
  - `docs/vnext/STATE.md`
  - `packages/playwright-runner/src/runner.ts`
  - `packages/mcp/src/dispatcher.ts`
  - `packages/mcp/src/tool-catalog.ts`

## Requerimientos Técnicos VNEXT-014-C
1. Crear `packages/mcp/src/handlers/test.handler.ts`:
   - Implementar `IMcpToolHandler` con `definition('qap_test')`.
   - Validar argumentos según `tool-catalog.ts` (`targetPath`, `module`, `caseId`, `environment`, `headed`, `timeout_ms`).
   - Validar rigurosamente que `targetPath` pertenezca a los `projectRoots` autorizados y rechazar symlinks/junctions y accesos multi-unidad no autorizados.
   - Cargar el plan de pruebas previamente generado en `.qa/modules/<module>/tests/plan.json` o los casos ordenados mediante `PlanHandler` / `DependencyGraphResolver`.
   - Invocar la ejecución real mediante `PlaywrightRunner` cuando el entorno disponga del navegador, respetando la propagación de resultados (`DependencyGraphResolver.propagateResults`).
   - Si no hay casos ejecutables o el navegador no está disponible, reportar estado bloqueado o diagnóstico real sin inventar resultados PASSED ni fabricar cobertura sintética (respetando D-011).
2. Modificar `packages/mcp/src/server.ts`:
   - Añadir `'qap_test'` a `migrated = new Set([...])`.
   - Registrar `TestHandler` en `ToolDispatcher`.
   - Eliminar el bloque legacy `case 'qap_test'` del switch.
   - Mantener exactamente 18 herramientas MCP expuestas.
3. Crear suite de pruebas en `packages/mcp/src/__tests__/test-handler.test.ts`.
4. Ejecutar compilación (`pnpm build`), centinela Stdio (`node scripts/test-mcp-stdio.mjs`) y documentar la entrega en `docs/vnext/014C_TEST_HANDLER.md`.
```
