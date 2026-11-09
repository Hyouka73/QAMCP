# INFORME TÉCNICO: DEV-MVP-01 (R1 + R2 + R3) — Remediación de Oráculos BVA y RBAC

**Fecha:** 2026-11-09  
**Hito:** DEV-MVP-01 / DEV-MVP-01-R2 / DEV-MVP-01-R3 (Remediación P0, P1 y P2 de Oráculos de Generación de Pruebas BVA y RBAC)  
**Repositorio Base:** `Hyouka73/QAMCP`  
**Candidato Técnico de Integración (Parent Base):** `47f17ceafc2f76d5a41fd714cd0c071dbdcb8d72` (merge `b50453f` + `a3f7ab5`)  
**Worktree Aislado de Trabajo:** `C:\Users\Judirico\Documents\QAMCP\worktrees\mvp01-bva-rbac`  
**Paquete Impactado:** `@qap/knowledge` (`packages/knowledge`)  
**Estado:** REMEDIACIÓN DEV-MVP-01-R3 COMPLETADA — REAUDITORÍA INDEPENDIENTE CODEX PENDIENTE

---

> **Aviso de Estado y No Autocertificación:**  
> Este informe documenta la remediación técnica de los defectos P0 iniciales de DEV-MVP-01, los 6 hallazgos P1 (H01–H06) y 3 observaciones P2 (H07–H09) de `AUDITORIA_CODEX_2026-11-09.md`, así como el cierre de los 5 defectos reproducibles pendientes (`R2-01` a `R2-05`) identificados en `REAUDITORIA_CODEX_2026-11-09.md`. Todas las suites unitarias, de regresión negativa y adversariales pasan al 100% (`171/171` focales, `520/520` en `@qap/knowledge`), el arnés independiente `audits/DEV-MVP-01/reproduce.mjs` pasa `9/9` comprobaciones (`exit code 0`) sin haber sido modificado, y la compilación TypeScript y lint son limpios. En estricto apego al protocolo de calidad del proyecto QAMCP, **este paquete no declara GO integral ni autocertifica el hito**. La validación final corresponde a Codex.

---

## 1. Resumen Ejecutivo

Durante la preparación para el MVP-01 funcional (fecha límite: 16 de noviembre de 2026):
1. **Ronda 1 (`ea54a8b873ae9f224cddd7c6e3a8b7ca0b450f1d`):** Abordó los 11 defectos P0 iniciales (límites artificiales `±10`, selectores ciegos, aserción invertida `not_visible`, conflictos entre reglas, perfiles inventados `${role}-local`, `body exists`, producto cartesiano ciego).
2. **Auditoría Independiente de Codex (`AUDITORIA_CODEX_2026-11-09.md`) y Ronda 2 (`c9d624c79e65bb3de5623d28ed93cbd3724465b1`):** Cerró en el alcance comprobado `H01`, `H03`, `H05`, `H06`, `H07` y las observaciones específicas de `H09`.
3. **Reauditoría Independiente de Codex (`REAUDITORIA_CODEX_2026-11-09.md`) y Ronda 3 (`DEV-MVP-01-R3`):** Cierra de raíz los hallazgos parciales pendientes en `H02` (`R2-01`, `R2-02`), `H04` (`R2-03`), `H08` (`R2-04`) y la regresión en longitudes textuales de varios dígitos (`R2-05`).

---

## 2. Corrección de los Hallazgos P1 y P2 (DEV-MVP-01-R2 + DEV-MVP-01-R3)

### 2.1 Hallazgos P1 Corregidos

#### H01 (RBAC): HTTP 500 jamás se acredita como denegación correcta mediante `not_exists`
- **Causa Raíz:** En `rbac-generator.ts`, `privileged_selector` tenía precedencia sobre `denial_selector` y emitía únicamente `{ type: 'assert', selector: privileged_selector, assertion_type: 'not_exists' }`. Ante una caída HTTP 500 (`<h1>Internal Server Error</h1>`) o una página de recurso incorrecto, el elemento `#delete` no existe en el DOM y `executeAssert` aprobaba falsamente la prueba.
- **Corrección:** `resolveDenialSteps` exige obligatoriamente una evidencia positiva de denegación acreditada (`denial_selector`, `denial_oracle` o `observable_denial: true`) verificada con `assertion_type: 'visible'`. La ausencia de `privileged_selector` (`not_exists`) jamás se emite sola; únicamente se añade como segundo paso de aserción complementario después de verificar la visibilidad del oráculo positivo de bloqueo. Si solo se configura `privileged_selector` sin oráculo positivo de denegación, el generador aplica política fail-closed (`[]`).

#### H02 (BVA — R2-01 y R2-02): Consumo completo de tokens numéricos, notación exponencial y alineación nominal con `step`
- **Causa Raíz (R1/R2):**
  1. En R1 se usaba `parseInt(..., 10)`, truncando decimales como `0.5` a `0`.
  2. En R2 (`R2-01`), las expresiones regulares capturaban solo el prefijo `-?\d+(?:\.\d+)?` sin consumir el token completo del atributo o palabra, truncando `min="1e2"` a `1` y `max="2e2"` a `2`.
  3. En R2 (`R2-02`), cuando se especificaba `step` explícito (ej. `min="0" max="6" step="2"`), el valor `nominal` se calculaba como `Math.floor((min + max) / 2) = 3` (impar, inválido por `stepMismatch` en el navegador) y `matchesExpectedValidity` omitía verificar la alineación con `step`.
- **Corrección (R3):**
  1. **Consumo íntegro y validación estricta de tokens (`R2-01`):** Las expresiones de Nivel 1 extraen el token completo del atributo (`"..."`, `'...'` o token delimitado) y `parseExtractedNumber` valida contra `STRICT_NUMBER_TOKEN` (`/^[+-]?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i`). Soporta enteros, decimales y notación exponencial completa (`1e2` -> `100`, `2e2` -> `200`, `1e-2` -> `0.01`), y rechaza fail-closed cualquier token malformado (`10px`, `1.2.3`, `1e2abc`, `1,000`) sin reinterpretar su prefijo.
  2. **Alineación de `nominal` y validación de dominio con `step` (`R2-02`):** Cuando `step > 0` está presente, `groupRulesByField` y `buildBoundaries` verifican que el rango sea compatible con la retícula de `step` (`isStepAligned(max - min, step)`), calculan el punto medio en unidades de `step` (`min + Math.floor(totalSteps / 2) * step`, produciendo `2` para `min=0, max=6, step=2`), y `matchesExpectedValidity` comprueba tanto pertenencia a `[min, max]` como alineación con `step` desde `min ?? 0`.

#### H03 (BVA): Resolución de contradicciones con `minlength="0"` y cadena vacía
- **Causa Raíz:** Con `minlength="0"`, `buildBoundaries` generaba `under_min = -1` (inválido) y `min = 0` (válido), y posteriormente `generateBoundaryValue` aplicaba `Math.max(0, -1)` convirtiendo `-1` en `''`. Esto producía dos casos con el mismo valor `''` exigiendo oráculos opuestos (`#error` y `#success`).
- **Corrección:** En `buildBoundaries`, cuando `valueType === 'string'` y `min === 0`, no se genera la frontera imposible `under_min` (no existen longitudes negativas de cadena). Además, `generateBoundaryValue` devuelve `null` ante longitudes negativas o no enteras (sin hacer clamping silencioso con `Math.max`), `matchesExpectedValidity` verifica después de materializar el valor que el resultado esperado coincida con el dominio real, y un registro por grupo impide emitir oráculos opuestos para un mismo valor.

#### H04 (RBAC — R2-03): Validación de correspondencia con roles válidos del proyecto en todas las etiquetas
- **Causa Raíz (R1/R2):** En R1 se aceptaba cualquier etiqueta como rol autorizado (`'seguridad'`). En R2 (`R2-03`), la rama sin prefijo verificaba `validRoleSet.has(normalizedTag)`, pero la rama con prefijo explícito (`role:<rol>`, `actor:<rol>`) omitía `validRoleSet.has(candidate)`, por lo que `role:seguridad`, `actor:superadmin` o errores tipográficos (`role:admn`) poblaban `authorized` con un rol inexistente y fabricaban el complemento de denegación para todos los roles reales del proyecto.
- **Corrección (R3):** En `extractRuleRoleGrounding`, tanto las etiquetas con prefijo (`role:`, `actor:`) como las etiquetas sin prefijo deben pertenecer obligatoriamente a `validRoleSet` (`validRoleSet.has(candidate)`) y no figurar en `IGNORED_ROLE_WORDS`. Si una regla solo contiene etiquetas temáticas o roles inexistentes en el proyecto, `extractRuleRoleGrounding` devuelve `null` (fail-closed).

#### H05 (RBAC): Eliminación definitiva de la inferencia de permisos desde `moduleContext.users`
- **Causa Raíz:** `extractRuleRoleGrounding` mantenía un bloque de fallback contextual que, cuando una regla `actor` confirmada era genérica (ej. `"Aplicar controles de acceso a esta vista"`), poblaba `authorized` a partir de `moduleContext.users`.
- **Corrección:** Se eliminó por completo `collectAuthorizedRoles` y el fallback a `moduleContext.users`. Si una regla `actor` confirmada no fundamenta explícitamente roles autorizados o prohibidos en su propia definición, `extractRuleRoleGrounding` devuelve `null` (fail-closed).

#### H06 (RBAC): Precedencia vinculante de `profile.role` y frontera estricta de prefijo en `profile.id`
- **Causa Raíz:** `resolveProfileId` aceptaba `profile.id.startsWith(role)` incluso cuando el perfil tenía un `profile.role` explícito diferente (p. ej., `{ id: 'viewer-admin', role: 'admin' }` era asignado a una prueba negativa del rol `'viewer'`), y sin exigir separador de slug (`'admin-root'.startsWith('adm')`).
- **Corrección:**
  1. Si el perfil define `profile.role` no vacío, ese valor es **vinculante**: solo coincide si `normalizeSlug(profile.role) === role`. Jamás se recurre a `profile.id` si `profile.role` existe y pertenece a otro rol.
  2. Solo para perfiles legacy sin `profile.role` definido, se admite coincidencia por `profile.id` exigiendo frontera estricta de slug (`^${role}(?:$|[-_].+)`) y verificando que los tokens restantes del identificador no contengan el nombre de otro rol del proyecto.
  3. Si existen múltiples perfiles candidatos ambiguos para el mismo rol, se rechaza fail-closed (`undefined`).

---

### 2.2 Observaciones P2 y Regresiones Resueltas

- **H07 (RBAC — Selector de denegación ante metadatos ausentes):** `resolveDenialSteps` ya no fabrica `DEFAULT_DENIAL_SELECTOR` cuando el contexto solo contiene `base_route`. Requiere un `denial_selector` explícito, `denial_oracle` explícito o la confirmación `observable_denial: true` / `denial_oracle: true`. En ausencia de oráculo acreditado en el contexto, retorna `null` (fail-closed).
- **H08 (BVA — R2-04: Contradicciones internas dentro de una misma regla y dentro del mismo nivel):** `extractRuleBounds` ya no usa `firstNumber` sobre cadenas concatenadas. Itera sobre todas las apariciones de cada patrón en cada fuente de Nivel 1 (`rule.id`, `rule.evidence`) y Nivel 2 (`rule.description`, `rule.condition`), fusionando cada candidato mediante `mergeCandidateBounds`. De este modo detecta y rechaza fail-closed tanto contradicciones entre niveles (`evidence: 'min="10"'` vs `description: 'mínimo de 18'`) como contradicciones dentro del mismo nivel (`evidence: 'min="10" min="18"'` o `description: 'Importe mínimo de 10'` vs `condition: 'Importe mínimo de 18'`).
- **Regresión R2-05 (BVA — Longitudes textuales de varios dígitos):** En R2, `TEXT_MIN` utilizaba un negative lookahead `(?!\s*(?:caracteres|letras))` sobre `-?\d+`, lo que provocaba backtracking de `18` a `1` en `'Longitud mínimo de 18 caracteres'` y declaraba un falso conflicto `string` vs `number`. En R3 se unificaron los patrones textuales (`TEXT_RANGE_PHRASE`, `TEXT_MIN_PHRASE`, `TEXT_MAX_PHRASE`) para consumir el token numérico completo junto con su unidad opcional (`caracteres`/`letras`) en una sola pasada sin backtracking parcial sobre dígitos.
- **H09 (Alineación entre implementación e informe técnico):**
  - Se implementó el filtro de procedencia acreditada `TRUSTED_RULE_SOURCES` (`user_confirmed`, `prd`, `user_text`, `user`, `doc`, o `undefined` para reglas legacy manuales), rechazando reglas con `source: 'agent'` o `source: 'dom'` que no hayan pasado a fuente acreditada.
  - Se mantienen alineadas las especificaciones del informe técnico sobre el formato del UUID determinista (`[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-a[0-9a-f]{3}-[0-9a-f]{12}`), `SchemaValidator` en suites de pruebas, `priority: 'medium'`, lectura de `ModuleSelectors` y pasos `assert` de `resolveDenialSteps`.

---

## 3. Inventario de Archivos Modificados en el Worktree

| # | Archivo | Estado Git | Descripción |
|---|---|---|---|
| 1 | `packages/knowledge/src/plan/bva-generator.ts` | Modificado | Consumo íntegro de tokens numéricos y notación exponencial (`R2-01`), alineación de `nominal` y validación con `step` (`R2-02`), extracción exhaustiva intra-nivel y multi-nivel de contradicciones (`R2-04` / `H08`), unificación de frases textuales de longitud/número sin backtracking (`R2-05`), `minlength=0` (`H03`) y procedencia (`H09`). |
| 2 | `packages/knowledge/src/plan/rbac-generator.ts` | Modificado | Oráculo positivo obligatorio antes de `not_exists` (`H01`), validación de pertenencia a `validRoleSet` en etiquetas con y sin prefijo (`R2-03` / `H04`), eliminación del fallback a `moduleContext.users` (`H05`), precedencia vinculante de `profile.role` (`H06`), compuerta de oráculo (`H07`) y filtro de `source` (`H09`). |
| 3 | `packages/knowledge/src/__tests__/bva-generator.test.ts` | Modificado | 34 pruebas unitarias (incluye regresiones directas para R2-01, R2-02, R2-04, R2-05, H02, H03, H08, H09). |
| 4 | `packages/knowledge/src/__tests__/rbac-generator.test.ts` | Modificado | 21 pruebas unitarias (incluye regresiones directas para R2-03, H01, H04, H05, H06, H07). |
| 5 | `packages/knowledge/src/__tests__/oracle-reproduction-negative.test.ts` | Modificado | 54 pruebas de reproducción negativa (incluye regresiones directas de R1, R2 y R3). |
| 6 | `packages/knowledge/src/__tests__/bva-adversarial-challenge.test.ts` | Modificado | 35 pruebas adversariales + 200 iteraciones fuzzing (añadido Challenge 7 para R2-01, R2-02, R2-04, R2-05). |
| 7 | `packages/knowledge/src/__tests__/challenger-rbac-stress.test.ts` | Modificado | 27 pruebas adversariales de estrés RBAC (añadida regresión para etiquetas con prefijo de roles inexistentes/errores tipográficos R2-03). |
| 8 | `docs/vnext/implementaciones/DEV-MVP-01/INFORME_TECNICO_DEV-MVP-01.md` | Modificado | Informe técnico actualizado con trazabilidad de R1, R2 y R3. |

---

## 4. Verificaciones Físicas Ejecutadas

### 4.1 Arnés Independiente de Codex (`audits/DEV-MVP-01/reproduce.mjs`)
- **Comando:** `node audits/DEV-MVP-01/reproduce.mjs`
- **Resultado:** **9/9 comprobaciones PASS (`failed: 0`, exit code `0`)**, sin modificaciones al arnés.

### 4.2 Suites Focales y Adversariales (`@qap/knowledge`)
- **Comando:** `pnpm --dir "C:\Users\Judirico\Documents\QAMCP\worktrees\mvp01-bva-rbac" --filter @qap/knowledge test -- src/__tests__/bva-generator.test.ts src/__tests__/rbac-generator.test.ts src/__tests__/oracle-reproduction-negative.test.ts src/__tests__/bva-adversarial-challenge.test.ts src/__tests__/challenger-rbac-stress.test.ts`
- **Resultado:** **5/5 archivos PASS, 171/171 pruebas PASS** (34 BVA + 21 RBAC + 54 Reproducción + 35 Challenger BVA + 27 Challenger RBAC).

### 4.3 Suite Completa de `@qap/knowledge`, Build y Lint
- **Suite Completa:** **34/34 archivos PASS, 520/520 pruebas PASS, 0 fallos**.
- **Build TypeScript (`tsup`):** Éxito en ESM (`dist/index.js`) y DTS (`dist/index.d.ts`).
- **Lint (`@qap/knowledge`):** 0 errores.

---

## 5. Instrucciones de Verificación para Reauditoría de Codex

```powershell
# 1. Verificar integridad del worktree y parent
git -C "C:\Users\Judirico\Documents\QAMCP\worktrees\mvp01-bva-rbac" status --short
git -C "C:\Users\Judirico\Documents\QAMCP\worktrees\mvp01-bva-rbac" log -3 --oneline

# 2. Compilar @qap/knowledge
pnpm --dir "C:\Users\Judirico\Documents\QAMCP\worktrees\mvp01-bva-rbac" --filter @qap/knowledge build

# 3. Ejecutar el arnés independiente sin modificaciones (debe retornar checks: 9, failed: 0, exit code 0)
node "C:\Users\Judirico\Documents\QAMCP\audits\DEV-MVP-01\reproduce.mjs"

# 4. Ejecutar las 5 suites focales y adversariales (171 pruebas)
pnpm --dir "C:\Users\Judirico\Documents\QAMCP\worktrees\mvp01-bva-rbac" --filter @qap/knowledge test -- `
  src/__tests__/bva-generator.test.ts `
  src/__tests__/rbac-generator.test.ts `
  src/__tests__/oracle-reproduction-negative.test.ts `
  src/__tests__/bva-adversarial-challenge.test.ts `
  src/__tests__/challenger-rbac-stress.test.ts

# 5. Ejecutar la suite completa de @qap/knowledge (34 archivos, 520 pruebas) y lint
pnpm --dir "C:\Users\Judirico\Documents\QAMCP\worktrees\mvp01-bva-rbac" --filter @qap/knowledge test
pnpm --dir "C:\Users\Judirico\Documents\QAMCP\worktrees\mvp01-bva-rbac" exec eslint packages/knowledge/src/plan/bva-generator.ts packages/knowledge/src/plan/rbac-generator.ts packages/knowledge/src/__tests__/bva-generator.test.ts packages/knowledge/src/__tests__/rbac-generator.test.ts packages/knowledge/src/__tests__/oracle-reproduction-negative.test.ts packages/knowledge/src/__tests__/bva-adversarial-challenge.test.ts packages/knowledge/src/__tests__/challenger-rbac-stress.test.ts
```
