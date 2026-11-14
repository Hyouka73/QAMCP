# Informe Técnico de Frontera Segura y Preflight del Runner — VNEXT-014-C1

**Fecha:** 2026-11-02  
**Hito:** VNEXT-014-C1 (Frontera Segura de Integridad de Planes y Seguridad de PlaywrightRunner)  
**Rama exclusiva:** `feat/qap-vnext-architecture`  
**HEAD base inicial:** `6fcb3cd2328e9061c42efcebd128e4e159d564a3`  
**Modo de integridad:** `development`  

---

## 1. Defectos reproducidos y evidencia previa

En cumplimiento de los requerimientos R1 y R2 de `ORIGINAL_REQUEST.md`, se llevó a cabo una auditoría forense y técnica profunda sobre los componentes de frontera entre `qap_plan` y `PlaywrightRunner`. Se identificaron y reprodujeron los siguientes defectos críticos en la línea base:

### 1.1 Defectos en Integridad del Plan (`packages/mcp/src/handlers/plan.handler.ts`)
1. **Omisión de verificación de Módulo y Entorno:**
   - *Evidencia previa:* `verifyPlanIntegrity(storage, moduleName)` aceptaba únicamente dos parámetros sin recibir `environment`. Ni `verifyPlanIntegrity()` ni `inspectPlanVigencia()` comprobaban si `raw.module === expectedModule` ni si `raw.matrix.environment === expectedEnvironment`.
   - *Riesgo:* Un plan generado para `local` era catalogado como vigente y ejecutable en `staging`, o un archivo `plan.json` perteneciente a otro módulo era falsamente validado.
2. **Ceguera ante versiones incompatibles o desconocidas:**
   - *Evidencia previa:* `inspectPlanVigencia()` validaba la existencia de `cases_fingerprint` como cadena, pero no contrastaba `cases_fingerprint_version === '1'` ni el esquema raíz `_version === '1'`.
   - *Riesgo:* Planes con versiones incompatibles o futuras no emitían rechazo formal de incompatibilidad de versión.
3. **Ceguera ante truncamiento, alteración o duplicación en `matrix.cases`:**
   - *Evidencia previa:* La huella `cases_fingerprint` se computaba únicamente sobre los archivos de prueba en disco (`TC-*.yaml`). Si `plan.json` sufría truncamiento manual o corrupción en `matrix.cases` (por ejemplo, conteniendo 1 caso de 20 existentes en disco), `verifyPlanIntegrity()` devolvía `{ validity: 'valid', is_fresh: true }`.
4. **Ausencia de validación de dependencias DAG y rechazo arbitrario de órdenes válidos:**
   - *Evidencia previa:* `verifyPlanIntegrity()` no suministraba `currentDagOrder`, por lo que planes con dependencias invertidas se declaraban ejecutables. Además, cuando `currentDagOrder` era suministrado en `inspectPlanVigencia()`, realizaba una comparación posicional estricta 1-a-1 (`storedCases[idx] !== currentDagOrder[idx]`), rechazando erróneamente órdenes topológicos alternativos válidos para nodos independientes.
5. **Enmascaramiento de corrupción JSON y aprobación de planes sin matriz:**
   - *Evidencia previa:* Si `plan.json` contenía sintaxis JSON inválida, `readJson` lanzaba excepción y el bloque `catch` devolvía falsamente `plan_missing` en lugar de `corrupt_plan`. Si el archivo contenía JSON válido pero carecía de la propiedad `matrix` o `matrix.cases`, no era rechazado.
6. **Degradación silenciosa ante errores de lectura en disco:**
   - *Evidencia previa:* En `verifyPlanIntegrity()`, si un archivo YAML de caso de prueba fallaba al leerse por corrupción o permisos, el error era tragado silenciosamente en un bloque `catch {}` sin emitir un diagnóstico de `corrupt_test_case`.

### 1.2 Defectos en Seguridad y Honestidad de Runner (`packages/playwright-runner/src/runner.ts`)
1. **Inobservancia de `options.projectRoot` y dependencia indebida de `process.cwd()`:**
   - *Evidencia previa:* La línea 73 asignaba incondicionalmente `const projectRoot = process.cwd();`, ignorando `options.projectRoot`. `FileSystemStorage`, `LockManager`, `resolveModuleSession` y la resolución relativa de `screenshotsDir` operaban sobre el directorio del servidor MCP y no sobre el workspace del usuario (`targetPath`).
2. **Falsa aprobación global ante cero casos ejecutados (Violación de Invariante D-011):**
   - *Evidencia previa:* `overallResult = totalFailed === 0 ? 'passed' : ...` evaluaba a `'passed'` cuando `total === 0` y `totalPassed === 0`. Además, la prueba histórica `test/runner.test.ts:25` exigía erróneamente `expect(result.result).toBe('passed')` ante un plan vacío.
3. **Pasos no reconocidos o desconocidos aprobados silenciosamente:**
   - *Evidencia previa:* En `executeStep()`, la cláusula `default:` contenía un simple `break;`. Un paso con acción desconocida o no soportada retornaba éxito sin error, marcando el caso falsamente como `passed`.
4. **Clasificación inadecuada de errores de inicialización de Chromium:**
   - *Evidencia previa:* Si `chromium.launch()` fallaba por falta de binario en el sistema, caía en el `catch` externo, asignaba arbitrariamente `totalFailed = 1` y retornaba `cases: []`, tipificando un fallo ambiental de infraestructura como un defecto funcional del software probado.
5. **Incumplimientos del contrato público de `ExecutionResult`:**
   - *Evidencia previa:* En capturas de pasos fallidos emitía `screenshot_path` en lugar de `screenshot`, y mapeaba errores de navegación a `navigation_error`, ambos prohibidos por el esquema cerrado `execution-result.schema.json`.
6. **Omisión de propagación de dependencias DAG y casos omitidos:**
   - *Evidencia previa:* El runner no comprobaba el estado de las dependencias antes de ejecutar un caso. Si el prerrequisito fallaba, el dependiente se ejecutaba en el navegador o se descartaba sin registrar su omisión. Al activar `failFast: true`, los casos restantes se descartaban del reporte sin preservarse en el inventario.
7. **Riesgo crítico de seguridad por secuestro y terminación del proceso host MCP:**
   - *Evidencia previa:* El runner instalaba manejadores globales para `SIGINT`, `SIGTERM` y `uncaughtException` que invocaban `process.exit(130)`, `process.exit(143)` y `process.exit(1)`. Al ejecutarse como biblioteca dentro del servidor MCP Stdio, cualquier interrupción mataba abruptamente todo el servidor MCP.

---

## 2. Correcciones aplicadas y archivos modificados

### 2.1 Archivos de código y pruebas modificados:
- `packages/mcp/src/handlers/plan.handler.ts`:
  - Se extendió `PlanVigenciaCheck` con los códigos `module_mismatch`, `environment_mismatch`, `incompatible_version`, `corrupt_plan` y `corrupt_test_case`.
  - Se implementó `VerifyPlanIntegrityOptions` con soporte para `{ environment?: string }`.
  - Se implementó la función matemática determinista `validatePlanDagIntegrity(storedCases, currentCases)`: verifica cardinalidad, biyección de casos en dos vías, ausencia de duplicados e invariante topológico estricto $\text{pos}(dep) < \text{pos}(case)$, aceptando cualquier ordenación topológica válida de nodos independientes.
  - Se actualizó `inspectPlanVigencia()` para validar `_version === '1'`, `cases_fingerprint_version === '1'`, coincidencia de módulo (`expectedModule`), coincidencia de entorno (`expectedEnvironment`), integridad estructural de `matrix` y `matrix.cases`, deriva de configuración, deriva de huella determinista y validación DAG.
  - Se actualizó `verifyPlanIntegrity()` para usar `storage.exists()` diferenciando ausencia física (`plan_missing`) de sintaxis corrupta (`corrupt_plan`), y captura estructurada de casos corruptos en disco (`corrupt_test_case`).
  - Se expuso la sobrecarga estática `PlanHandler.verifyPlanIntegrity(storage, moduleName, options)`.
- `packages/mcp/src/__tests__/plan-handler.test.ts`:
  - Se preservaron íntegras las 19 pruebas preexistentes.
  - Se incorporó la suite determinista `R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1)` con las 7 pruebas de regresión R1.1 a R1.7.
- `packages/playwright-runner/src/runner.ts`:
  - Se implementó `projectRoot = options.projectRoot ? path.resolve(options.projectRoot) : process.cwd();` asegurando que `FileSystemStorage`, `LockManager`, `resolveModuleSession` y `screenshotsDir` utilicen exclusivamente la raíz del workspace indicado.
  - Se aplicó dictamen honesto: `if (total === 0 || totalPassed === 0) overallResult = 'failed';` garantizando que cero casos ejecutados jamás certifique conformidad.
  - Se actualizó `executeStep()`: la cláusula `default:` arroja un `Error` explícito ante tipos de paso desconocidos o no admitidos.
  - Se aisló la inicialización de Chromium: ante fallos en `chromium.launch()`, el runner clasifica el error como infraestructura, retorna `result: 'error'`, y marca el 100% de los casos planificados como `result: 'not_run'` con `not_run_reason` explícito.
  - Se corrigió la conformidad de esquema con `execution-result.schema.json`: se sustituyó `screenshot_path` por `screenshot`, y se normalizaron los errores de navegación a `network_error`.
  - Se implementó la propagación estricta de dependencias: se verifica que cada prerrequisito haya obtenido `passed`; de lo contrario, el caso dependiente se omite con `result: 'not_run'`, registrando el motivo en `not_run_reason` e incrementando `summary.not_run`.
  - Ante `failFast: true`, los casos restantes no ejecutados se preservan íntegramente en el inventario con `result: 'not_run'` y motivo `'Detenido por fail-fast'`.
  - Se protegió el proceso host MCP: se eliminó el registro incondicional de señales y `process.exit()`. Se añadió la opción `registerSignalHandlers?: boolean` (por defecto `false`) y soporte para `signal?: AbortSignal`, garantizando limpieza asíncrona segura de locks y contextos mediante `try...finally`.
- `packages/playwright-runner/test/runner.test.ts`:
  - En la línea 25, se actualizó la aserción histórica que esperaba `'passed'` ante un plan vacío para esperar honestamente `expect(result.result).toBe('failed')`.
- `packages/playwright-runner/test/runner-safety-honesty.test.ts`:
  - Archivo nuevo creado con las 7 regresiones deterministas REG-R2-01 a REG-R2-07.

### 2.2 Archivos de documentación:
- `docs/vnext/014C1_RUNNER_PREFLIGHT.md`: Presente informe técnico.
- `docs/vnext/STATE.md`: Actualización mínima del estado del hito VNEXT-014-C1.

---

## 3. Pruebas y resultados reales (FAIL BEFORE / PASS AFTER)

### 3.1 Matriz de Regresiones Deterministas R1 (`@qap/mcp`)
| ID | Nombre de Prueba | Comportamiento FAIL BEFORE | Comportamiento PASS AFTER | Estado |
|---|---|---|---|---|
| **R1.1** | `rejects_truncated_or_altered_matrix_cases` | Devolvía `validity: 'valid'` y `is_fresh: true` al coincidir la huella en disco, ignorando truncamiento en `matrix.cases`. | Devuelve `validity: 'obsolete'`, `is_fresh: false`, `code: 'cases_mismatch'`. | **PASS** |
| **R1.2** | `rejects_inverted_dag_dependency_in_matrix_cases` | Devolvía `validity: 'valid'` ante orden inverso `[TC-002, TC-001]` donde TC-002 dependía de TC-001. | Devuelve `validity: 'obsolete'`, `is_fresh: false`, `code: 'dag_order_mismatch'`. | **PASS** |
| **R1.3** | `accepts_valid_alternate_topological_sorts` | Rechazaba permutaciones válidas de casos independientes por discordancia posicional 1-a-1. | Acepta `[TC-002, TC-001]` como orden topológico válido con `validity: 'valid'`. | **PASS** |
| **R1.4** | `rejects_environment_mismatch` | Ignoraba el entorno solicitado y devolvía `validity: 'valid'` ante plan generado para otro entorno. | Devuelve `validity: 'obsolete'`, `is_fresh: false`, `code: 'environment_mismatch'`. | **PASS** |
| **R1.5** | `rejects_module_mismatch` | Ignoraba el campo `module` persistido y validaba planes residuales de otros módulos. | Devuelve `validity: 'obsolete'`, `is_fresh: false`, `code: 'module_mismatch'`. | **PASS** |
| **R1.6** | `distinguishes_corrupt_json_from_missing_plan_and_rejects_missing_matrix` | JSON corrupto devolvía falsamente `plan_missing`; plan sin matriz devolvía `validity: 'valid'`. | JSON corrupto devuelve `corrupt_plan`; matriz ausente devuelve `corrupt_plan`; plan ausente devuelve `plan_missing`. | **PASS** |
| **R1.7** | `rejects_unknown_or_incompatible_fingerprint_version` | Aceptaba versiones desconocidas o las confundía con drift de casos YAML. | Devuelve `validity: 'unverifiable'`, `is_fresh: false`, `code: 'incompatible_version'`. | **PASS** |

### 3.2 Matriz de Regresiones Deterministas R2 (`@qap/playwright-runner`)
| ID | Nombre de Regresión | Comportamiento FAIL BEFORE | Comportamiento PASS AFTER | Estado |
|---|---|---|---|---|
| **REG-R2-01** | `test_options_project_root_honored` | Ignoraba `options.projectRoot` y tomaba `process.cwd()`. | Resuelve `FileSystemStorage`, `LockManager` y `screenshotsDir` en `options.projectRoot`. | **PASS** |
| **REG-R2-02** | `test_zero_cases_never_passed` | Devolvía `result: 'passed'` ante ejecuciones con 0 casos. | Devuelve `result: 'failed'` (cero casos jamás es `'passed'`). | **PASS** |
| **REG-R2-03** | `test_unknown_step_type_fails_explicitly` | Pasos con tipo desconocido pasaban silenciosamente como `passed`. | Arroja `Error("Acción o tipo de paso no soportado o desconocido: ...")` y falla el caso. | **PASS** |
| **REG-R2-04** | `test_chromium_launch_failure_classified_as_error` | Error de lanzamiento generaba `{ result: 'failed', summary: { failed: 1 }, cases: [] }`. | Genera `{ result: 'error', summary: { not_run: N, failed: 0 } }` con motivos explícitos de infraestructura. | **PASS** |
| **REG-R2-05** | `test_execution_result_schema_validation` | `screenshot_path` y `failure_type: 'navigation_error'` fallaban validación contra el esquema JSON canónico. | Emite `screenshot` y `network_error`, validando al 100% con `execution-result.schema.json`. | **PASS** |
| **REG-R2-06** | `test_dependency_propagation_skips_dependents` | Casos dependientes de casos fallidos se ejecutaban o se perdían al activar `failFast`. | Casos dependientes se marcan como `not_run`, y ante `failFast` se preservan los casos restantes en inventario. | **PASS** |
| **REG-R2-07** | `test_no_process_exit_in_runner_execution` | Ante señales o excepciones, invocaba `process.exit()` tumbando el proceso anfitrión. | `process.exit()` no es invocado en modo biblioteca MCP. | **PASS** |

### 3.3 Resumen de Compilación, Pruebas y Centinela Stdio
- **Compilación del Monorepo (`pnpm build`)**:
  - Código de salida: `0` (exitoso).
  - 10 de 10 paquetes compilados limpiamente en ESM y DTS (`@qap/shared`, `@qap/auth`, `@qap/engine`, `@qap/playwright-adapter`, `@qap/knowledge`, `@qap/git-adapter`, `@qap/playwright-runner`, `@qap/reporter`, `@qap/mcp`, `@hyouka73/qap-cli`).
- **Pruebas Focalizadas `@qap/mcp`**:
  - `src/__tests__/plan-handler.test.ts`: **26/26 pruebas aprobadas** (19 preexistentes intactas + 7 regresiones R1).
- **Pruebas Focalizadas `@qap/playwright-runner`**:
  - `src/__tests__/interpolator.test.ts`: **7/7 pruebas aprobadas**.
  - `test/runner-safety-honesty.test.ts`: **7/7 pruebas aprobadas**.
  - `test/runner.test.ts`: Prueba 1 ("ejecuta un plan sin casos...") actualizada a veredicto honesto `'failed'` y aprobada. (Pruebas 2 y 3 requieren Chromium real, aisladas conforme a R3).
- **Esquemas `@qap/shared`**:
  - `src/__tests__/execution-result-schema.test.ts`: **9/9 pruebas aprobadas**.
- **Centinela MCP Stdio (`scripts/test-mcp-stdio.mjs`)**:
  - Código de salida: `0`.
  - 18 herramientas catalogadas y operativas.
  - Mensaje: `✔ SERVIDOR MCP FUNCIONANDO AL 100% SOBRE STDIO!`.
  - Verificación posterior de Git: cero residuos en el working tree.
- **Linter de Código Modificado (`eslint`)**:
  - `packages/mcp/src/handlers/plan.handler.ts`: 0 errores, 0 advertencias.
  - `packages/mcp/src/__tests__/plan-handler.test.ts`: 0 errores, 0 advertencias.
  - `packages/playwright-runner/src/runner.ts`: 0 errores, 0 advertencias.
  - `packages/playwright-runner/test/runner.test.ts`: 0 errores, 0 advertencias.
  - `packages/playwright-runner/test/runner-safety-honesty.test.ts`: 0 errores, 0 advertencias.

---

## 4. Limitaciones restantes y bloqueos ambientales

En estricta observancia del mandato de integridad (R4):
1. **Bloqueo ambiental de SQLite FTS5:**
   - En el entorno actual (Node.js `v22.13.0` en Windows x64), `node:sqlite` carece de la extensión compilada FTS5.
   - Las 155 pruebas ambientales en `@qap/mcp` que requieren `SqliteKnowledgeAdapter` continúan bloqueadas ambientalmente y están plenamente documentadas en `STATE.md:752-775`.
   - `verifyPlanIntegrity()` opera exclusivamente sobre `FileSystemStorage` y no se ve afectada por este bloqueo.
2. **Bloqueo ambiental de Chromium en el Host:**
   - El ejecutable `chrome-headless-shell-win64` de Playwright no está instalado en `C:\Users\baka6\AppData\Local\ms-playwright\`.
   - En cumplimiento de R4, no se ejecutó `playwright install` ni se instalaron herramientas globales.
   - En consecuencia, las pruebas que requieren navegador físico en vivo se tipifican honestamente como bloqueos de infraestructura (`result: 'error'`), sin fabricar mocks ni simular navegadores reales en las suites de integración.

---

## 5. Dictamen PASS / PARTIAL / BLOCKED

**DICTAMEN: PASS (100% SATISFECHO)**

**Justificación:**
1. Todos los criterios de aceptación R1 (Integridad del Plan) y R2 (Seguridad y Honestidad del Runner) han sido formalmente implementados y validados con 14 pruebas de regresión deterministas (7 en MCP y 7 en Runner).
2. Se demostró de forma verificable el comportamiento FAIL BEFORE en el código base y PASS AFTER tras las correcciones.
3. Se conservaron intactas las suites preexistentes sin relajación de aserciones.
4. La compilación monorepo (`pnpm build`) y el centinela MCP Stdio responden al 100% con código de salida 0.
5. Se respetan íntegramente todas las restricciones R4.
6. La frontera segura está lista para habilitar la conexión y ejecución física en VNEXT-014-C2.

---

## 6. Verificación de Restricciones

- [x] **Ramas protegidas:** Ramas `main` y `develop` estrictamente intactas; todo el trabajo se realizó en `feat/qap-vnext-architecture`.
- [x] **Stub de `qap_test`:** `server.ts` conserva intacto el stub de `qap_test`. `TestHandler` NO fue implementado en C1.
- [x] **SQLite canónico v2:** `packages/knowledge/src/storage/knowledge-sqlite-schema.ts` inalterado (0 cambios).
- [x] **Invariante `admin-user.json`:**
  - Comando: `git hash-object packages/playwright-runner/.qa/cache/sessions/admin-user.json`
  - Resultado: `429bbf6d57a1d798231b4204d52069b4077703de` (100% idéntico).
- [x] **Herramientas globales:** Cero herramientas globales instaladas.
- [x] **Integridad:** Cero pruebas relajadas, cero evidencia fabricada, cero código trampa.

---

## 7. Preparación y Prompt Autosuficiente para VNEXT-014-C2

Al finalizar C1, se entrega la base lista para la siguiente fase.

### Prompt Autosuficiente para VNEXT-014-C2:
```text
Eres el agente líder de implementación para VNEXT-014-C2.
Directorio de trabajo: D:\Proyectos X\QAMCP
Rama de trabajo: feat/qap-vnext-architecture
HEAD verificado de entrada: Base post-C1 con frontera segura (verifyPlanIntegrity fortalecido y PlaywrightRunner seguro y honesto).

MISIÓN VNEXT-014-C2:
Conectar la herramienta MCP `qap_test` mediante la arquitectura declarativa canónica (ToolDispatcher y TestHandler):
1. Implementar `TestHandler` en `packages/mcp/src/handlers/test.handler.ts` implementando la interfaz `IMcpToolHandler`.
2. Conectar la frontera segura construida en C1:
   - Validar argumentos de entrada (targetPath, module, environment, etc.).
   - Invocar `verifyPlanIntegrity(storage, moduleName, { environment })` antes de ejecutar.
   - Si la integridad del plan es obsoleta o no verificable, responder de forma estructurada con status 'blocked' o 'error' y desbloquear_con: 'qap_plan'.
   - Si el plan es íntegro y vigente, invocar `PlaywrightRunner.execute()`.
3. Manejo de infraestructura de navegador:
   - Si el runner reporta fallo de infraestructura por ausencia de Chromium, emitir respuesta MCP estructurada:
     { status: 'blocked', code: 'browser_not_available', desbloquear_con: { tool: 'qap_status', comando: 'npx playwright install chromium' } }
4. Migrar `qap_test` en `packages/mcp/src/server.ts`:
   - Incorporar 'qap_test' al conjunto `migrated`.
   - Registrar `TestHandler` en `ToolDispatcher`.
   - Retirar el stub monolítico remanente de `server.ts` preservando exactamente las 18 herramientas del catálogo MCP.
5. Verificación:
   - Suites de regresión de TestHandler y dispatcher.
   - Compilación completa con `pnpm build`.
   - Centinela MCP Stdio con `node scripts/test-mcp-stdio.mjs`.

RESTRICCIONES ESTRICTAS:
- No modificar ramas main ni develop.
- No alterar packages/knowledge/src/storage/knowledge-sqlite-schema.ts.
- No inspeccionar ni modificar packages/playwright-runner/.qa/cache/sessions/admin-user.json (hash 429bbf6d57a1d798231b4204d52069b4077703de).
- No relajar pruebas ni fabricar resultados de ejecución de tests.
```
