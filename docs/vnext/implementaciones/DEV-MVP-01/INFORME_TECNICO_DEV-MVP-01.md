# INFORME TÉCNICO: DEV-MVP-01 (R1 + R2) — Remediación de Oráculos BVA y RBAC

**Fecha:** 2026-11-09  
**Hito:** DEV-MVP-01 / DEV-MVP-01-R2 (Remediación P0 y P1 de Oráculos de Generación de Pruebas BVA y RBAC)  
**Repositorio Base:** `Hyouka73/QAMCP`  
**Candidato Técnico de Integración (Parent Base):** `47f17ceafc2f76d5a41fd714cd0c071dbdcb8d72` (merge `b50453f` + `a3f7ab5`)  
**Worktree Aislado de Trabajo:** `C:\Users\Judirico\Documents\QAMCP\worktrees\mvp01-bva-rbac`  
**Paquete Impactado:** `@qap/knowledge` (`packages/knowledge`)  
**Estado:** REMEDIACIÓN DEV-MVP-01-R2 COMPLETADA — REAUDITORÍA INDEPENDIENTE CODEX PENDIENTE

---

> **Aviso de Estado y No Autocertificación:**  
> Este informe documenta la remediación técnica de los defectos P0 iniciales de DEV-MVP-01 junto con los 6 hallazgos P1 (H01–H06) y las 3 observaciones P2 (H07–H09) identificados en la auditoría independiente de Codex (`AUDITORIA_CODEX_2026-11-09.md`). Todas las suites unitarias, de regresión negativa y adversariales pasan al 100%, el arnés independiente `audits/DEV-MVP-01/reproduce.mjs` pasa 9/9 comprobaciones (exit code 0) sin haber sido modificado, y la compilación TypeScript y lint son limpios. En estricto apego al protocolo de calidad del proyecto QAMCP, **este paquete no declara GO integral ni autocertifica el hito**. La validación final corresponde a Codex.

---

## 1. Resumen Ejecutivo

Durante la preparación para el MVP-01 funcional (fecha límite: 16 de noviembre de 2026):
1. **Ronda 1 (`ea54a8b873ae9f224cddd7c6e3a8b7ca0b450f1d`):** Abordó los 11 defectos P0 iniciales (límites artificiales `±10`, selectores ciegos, aserción invertida `not_visible`, conflictos entre reglas, perfiles inventados `${role}-local`, `body exists`, producto cartesiano ciego).
2. **Auditoría Independiente de Codex (`AUDITORIA_CODEX_2026-11-09.md`):** Emitió dictamen `NO-GO` al detectar 6 defectos funcionales P1 reproducibles (H01–H06) y 3 observaciones P2 (H07–H09) mediante el arnés independiente `audits/DEV-MVP-01/reproduce.mjs`.
3. **Ronda 2 (`DEV-MVP-01-R2`):** Corrige de raíz los 6 defectos P1 y las 3 observaciones P2 en `bva-generator.ts` y `rbac-generator.ts`, actualiza las pruebas adversariales que fijaban comportamientos heredados defectuosos y añade regresiones explícitas para cada hallazgo.

---

## 2. Corrección de los 6 Hallazgos P1 y 3 Observaciones P2 (DEV-MVP-01-R2)

### 2.1 Hallazgos P1 Corregidos

#### H01 (RBAC): HTTP 500 jamás se acredita como denegación correcta mediante `not_exists`
- **Causa Raíz:** En `rbac-generator.ts`, `privileged_selector` tenía precedencia sobre `denial_selector` y emitía únicamente `{ type: 'assert', selector: privileged_selector, assertion_type: 'not_exists' }`. Ante una caída HTTP 500 (`<h1>Internal Server Error</h1>`) o una página de recurso incorrecto, el elemento `#delete` no existe en el DOM y `executeAssert` aprobaba falsamente la prueba.
- **Corrección:** `resolveDenialSteps` exige obligatoriamente una evidencia positiva de denegación acreditada (`denial_selector`, `denial_oracle` o `observable_denial: true`) verificada con `assertion_type: 'visible'`. La ausencia de `privileged_selector` (`not_exists`) jamás se emite sola; únicamente se añade como segundo paso de aserción complementario después de verificar la visibilidad del oráculo positivo de bloqueo. Si solo se configura `privileged_selector` sin oráculo positivo de denegación, el generador aplica política fail-closed (`[]`).

#### H02 (BVA): Preservación de límites decimales exactos (`min="0.5"`, `max="2.5"`)
- **Causa Raíz:** Las expresiones regulares capturaban solo dígitos enteros (`-?\d+`) y `firstNumber` utilizaba `parseInt(..., 10)`, truncando `0.5` a `0` y clasificando `0` como entrada válida (`min`).
- **Corrección:** Se actualizaron las expresiones regulares de Nivel 1 y Nivel 2 para capturar números decimales (`-?\d+(?:\.\d+)?`), se reemplazó `parseInt` por `Number(raw)` con validación `Number.isFinite`, y se implementó el cálculo de precisión decimal (`countDecimals`, `roundToPrecision`) y soporte del atributo `step`. Para `min="0.5" max="2.5"` sin `step` explícito, la unidad de frontera es `0.1` (`10^-decimals`), generando `0.4` (`under_min`), `0.5` (`min`), `1.5` (`nominal`), `2.5` (`max`) y `2.6` (`over_max`).

#### H03 (BVA): Resolución de contradicciones con `minlength="0"` y cadena vacía
- **Causa Raíz:** Con `minlength="0"`, `buildBoundaries` generaba `under_min = -1` (inválido) y `min = 0` (válido), y posteriormente `generateBoundaryValue` aplicaba `Math.max(0, -1)` convirtiendo `-1` en `''`. Esto producía dos casos con el mismo valor `''` exigiendo oráculos opuestos (`#error` y `#success`).
- **Corrección:** En `buildBoundaries`, cuando `valueType === 'string'` y `min === 0`, no se genera la frontera imposible `under_min` (no existen longitudes negativas de cadena). Además, `generateBoundaryValue` devuelve `null` ante longitudes negativas o no enteras (sin hacer clamping silencioso con `Math.max`), `matchesExpectedValidity` verifica después de materializar el valor que el resultado esperado coincida con el dominio real, y un registro por grupo impide emitir oráculos opuestos para un mismo valor.

#### H04 (RBAC): Prohibición de interpretar etiquetas temáticas como roles autorizados
- **Causa Raíz:** `extractRuleRoleGrounding` agregaba cualquier elemento de `rule.tags` (tras remover prefijo opcional `role-`/`actor-`) directamente a `authorized`, incluso si era una etiqueta temática como `'seguridad'`. Al quedar `authorized` no vacío (`{'seguridad'}`), todos los roles reales del proyecto (`admin`, `viewer`) eran tratados como no autorizados.
- **Corrección:** Solo se aceptan etiquetas con prefijo semántico explícito (`role:<rol>`, `actor:<rol>`, `role-<rol>`, `actor-<rol>`) o etiquetas cuyo slug normalizado coincida exactamente con un rol válido del proyecto (`validRoleSet.has(normalizedTag)`). Las etiquetas temáticas (`'seguridad'`, `'pagos'`, etc.) se ignoran.

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

### 2.2 Observaciones P2 Resueltas

- **H07 (RBAC — Selector de denegación ante metadatos ausentes):** `resolveDenialSteps` ya no fabrica `DEFAULT_DENIAL_SELECTOR` cuando el contexto solo contiene `base_route`. Requiere un `denial_selector` explícito, `denial_oracle` explícito o la confirmación `observable_denial: true` / `denial_oracle: true`. En ausencia de oráculo acreditado en el contexto, retorna `null` (fail-closed).
- **H08 (BVA — Contradicciones internas dentro de una misma regla):** `extractRuleBounds` ya no hace `return` temprano al encontrar evidencia DOM de Nivel 1; evalúa tanto Nivel 1 (`id` / `evidence`) como Nivel 2 (`description` / `condition`) mediante `mergeCandidateBounds`. Si `evidence` declara `min="10"` y `description` declara `"mínimo de 18"`, registra `hasConflict: true` y omite el campo (fail-closed).
- **H09 (Alineación entre implementación e informe técnico):**
  - Se implementó el filtro de procedencia acreditada `TRUSTED_RULE_SOURCES` (`user_confirmed`, `prd`, `user_text`, `user`, `doc`, o `undefined` para reglas legacy manuales), rechazando reglas con `source: 'agent'` o `source: 'dom'` que no hayan pasado a fuente acreditada.
  - Se corrigieron las imprecisiones documentales del informe técnico respecto a:
    - El formato del UUID determinista: es un hash SHA-256 formateado con el nibble de versión `4` y variante `a` (`[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-a[0-9a-f]{3}-[0-9a-f]{12}`) para satisfacer el patrón de `tc-case.schema.json`, no UUID v5.
    - La validación con `SchemaValidator` se ejecuta en las suites de pruebas, no como dependencia en tiempo de ejecución dentro de los generadores.
    - El campo `priority` de `generateBvaCases` es `'medium'`.
    - La estructura de `ModuleSelectors` se lee desde `selectors.selectors[field]` o `selectors[field]`.
    - `resolveDenialSteps` emite pasos `assert` con `assertion_type: 'visible'` sobre el selector de denegación acreditado (y opcionalmente `not_exists` sobre `privileged_selector` como segundo paso).

---

## 3. Inventario de Archivos Modificados en el Worktree

| # | Archivo | Estado Git | Descripción |
|---|---|---|---|
| 1 | `packages/knowledge/src/plan/bva-generator.ts` | Modificado | Preservación decimal exacta (`H02`), supresión de `under_min` imposible en `minlength=0` (`H03`), detección de contradicciones internas Nivel 1 vs Nivel 2 (`H08`), filtro de `source` acreditado (`H09`), eliminación de padding `±10`, oráculo de error `visible`. |
| 2 | `packages/knowledge/src/plan/rbac-generator.ts` | Modificado | Oráculo positivo obligatorio antes de `not_exists` (`H01`), rechazo de tags temáticos (`H04`), eliminación total del fallback a `moduleContext.users` (`H05`), precedencia vinculante de `profile.role` y frontera de slug (`H06`), eliminación de fallback sin oráculo (`H07`), filtro de `source` (`H09`). |
| 3 | `packages/knowledge/src/__tests__/bva-generator.test.ts` | Modificado | 29 pruebas unitarias (añadidas 4 regresiones directas para H02, H03, H08, H09). |
| 4 | `packages/knowledge/src/__tests__/rbac-generator.test.ts` | Modificado | 20 pruebas unitarias (actualizadas y añadidas regresiones directas para H01, H04, H05, H06, H07). |
| 5 | `packages/knowledge/src/__tests__/oracle-reproduction-negative.test.ts` | Añadido / Actualizado | 49 pruebas de reproducción negativa (40 originales + 9 regresiones directas para H01–H09). |
| 6 | `packages/knowledge/src/__tests__/bva-adversarial-challenge.test.ts` | Añadido / Actualizado | 31 pruebas adversariales + 200 iteraciones fuzzing (corregidas ATTACK 2.6, 2.7 y fuzzing de `minlength=0` / negativos). |
| 7 | `packages/knowledge/src/__tests__/challenger-rbac-stress.test.ts` | Añadido / Actualizado | 26 pruebas adversariales de estrés RBAC (corregidas expectativas de H01, H04, H05, H06, H07). |
| 8 | `docs/vnext/implementaciones/DEV-MVP-01/INFORME_TECNICO_DEV-MVP-01.md` | Añadido / Actualizado | Informe técnico actualizado con trazabilidad exacta de R1 y R2. |

---

## 4. Verificaciones Físicas Ejecutadas

### 4.1 Arnés Independiente de Codex (`audits/DEV-MVP-01/reproduce.mjs`)
- **Comando:** `node audits/DEV-MVP-01/reproduce.mjs`
- **Resultado:** **9/9 comprobaciones PASS (`failed: 0`, exit code `0`)**, incluyendo la prueba con navegador Edge headless real e interceptación HTTP 500 contra `executeAssert`.

### 4.2 Suites Focales y Adversariales (`@qap/knowledge`)
- **Comando:** `pnpm --dir "C:\Users\Judirico\Documents\QAMCP\worktrees\mvp01-bva-rbac" --filter @qap/knowledge test -- src/__tests__/bva-generator.test.ts src/__tests__/rbac-generator.test.ts src/__tests__/oracle-reproduction-negative.test.ts src/__tests__/bva-adversarial-challenge.test.ts src/__tests__/challenger-rbac-stress.test.ts`
- **Resultado:** **5/5 archivos PASS, 155/155 pruebas PASS** (29 BVA + 20 RBAC + 49 Reproducción + 31 Challenger BVA + 26 Challenger RBAC).

### 4.3 Suite Completa de `@qap/knowledge`, Build y Lint
- **Suite Completa:** **34/34 archivos PASS, 504/504 pruebas PASS, 0 fallos**.
- **Build TypeScript (`tsup`):** Éxito en ESM (`dist/index.js`) y DTS (`dist/index.d.ts`).
- **Lint (`@qap/knowledge`):** 0 errores.

---

## 5. Instrucciones de Verificación para Reauditoría de Codex

```powershell
# 1. Verificar integridad del worktree y parent
git -C "C:\Users\Judirico\Documents\QAMCP\worktrees\mvp01-bva-rbac" status --short
git -C "C:\Users\Judirico\Documents\QAMCP\worktrees\mvp01-bva-rbac" log -2 --oneline

# 2. Compilar @qap/knowledge
pnpm --dir "C:\Users\Judirico\Documents\QAMCP\worktrees\mvp01-bva-rbac" --filter @qap/knowledge build

# 3. Ejecutar el arnés independiente sin modificaciones (debe retornar checks: 9, failed: 0, exit code 0)
node "C:\Users\Judirico\Documents\QAMCP\audits\DEV-MVP-01\reproduce.mjs"

# 4. Ejecutar las 5 suites focales y adversariales (155 pruebas)
pnpm --dir "C:\Users\Judirico\Documents\QAMCP\worktrees\mvp01-bva-rbac" --filter @qap/knowledge test -- `
  src/__tests__/bva-generator.test.ts `
  src/__tests__/rbac-generator.test.ts `
  src/__tests__/oracle-reproduction-negative.test.ts `
  src/__tests__/bva-adversarial-challenge.test.ts `
  src/__tests__/challenger-rbac-stress.test.ts

# 5. Ejecutar la suite completa de @qap/knowledge (34 archivos, 504 pruebas) y lint
pnpm --dir "C:\Users\Judirico\Documents\QAMCP\worktrees\mvp01-bva-rbac" --filter @qap/knowledge test
pnpm --dir "C:\Users\Judirico\Documents\QAMCP\worktrees\mvp01-bva-rbac" exec eslint packages/knowledge/src/plan/bva-generator.ts packages/knowledge/src/plan/rbac-generator.ts packages/knowledge/src/__tests__/bva-generator.test.ts packages/knowledge/src/__tests__/rbac-generator.test.ts packages/knowledge/src/__tests__/oracle-reproduction-negative.test.ts packages/knowledge/src/__tests__/bva-adversarial-challenge.test.ts packages/knowledge/src/__tests__/challenger-rbac-stress.test.ts
```
