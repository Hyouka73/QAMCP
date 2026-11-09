# INFORME TÉCNICO: DEV-MVP-01 — Remediación P0 de Oráculos BVA y RBAC

**Fecha:** 2026-11-09  
**Hito:** DEV-MVP-01 (Remediación de Oráculos de Generación de Pruebas BVA y RBAC)  
**Repositorio Base:** `Hyouka73/QAMCP`  
**Candidato Técnico de Integración:** `47f17ceafc2f76d5a41fd714cd0c071dbdcb8d72` (merge `b50453f` + `a3f7ab5`)  
**Worktree Aislado de Trabajo:** `C:\Users\Judirico\Documents\QAMCP\worktrees\mvp01-bva-rbac`  
**Paquete Impactado:** `@qap/knowledge` (`packages/knowledge`)  
**Estado:** IMPLEMENTACIÓN COMPLETADA — COMPUERTAS INTERNAS APROBADAS — AUDITORÍA INDEPENDIENTE CODEX PENDIENTE

---

> **Aviso de Estado y No Autocertificación:**  
> Este informe documenta la remediación técnica exhaustiva de los 11 defectos críticos (P0) identificados en los generadores de casos de prueba BVA y RBAC dentro de `@qap/knowledge`. Todas las suites unitarias, adversariales y de regresión pasan al 100% (488/488 pruebas) y la compilación TypeScript es completamente limpia. Sin embargo, en estricto apego al protocolo de calidad e integridad del proyecto QAMCP, **este paquete no declara GO integral ni autocertifica el hito**. La aceptación definitiva como compuerta de autorización para el MVP-01 queda reservada al dictamen de la auditoría independiente de Codex.

---

## 1. Resumen Ejecutivo

Durante la fase de preparación para el hito MVP-01 funcional (fecha límite: 16 de noviembre de 2026), se detectó que los generadores de pruebas de límites numéricos (*Boundary Value Analysis* - BVA) y de control de acceso basado en roles (*Role-Based Access Control* - RBAC) producían casos de prueba con oráculos defectuosos o ficticios. Dichos casos generaban falsos positivos (pruebas que aprobaban sin evaluar la condición real), fallbacks inventados en ausencia de credenciales acreditadas (`${role}-local`), límites artificiales con padding arbitrario (`±10`), y aserciones tautológicas (`selector: 'body', assertion_type: 'exists'`).

El objetivo de DEV-MVP-01 fue erradicar completamente estos 11 defectos (6 en BVA y 5 en RBAC), garantizando que `@qap/knowledge` genere **únicamente pruebas ejecutables con resultados esperados acreditados, fail-closed ante ambigüedad o falta de oráculos, y 100% compatibles con `tc-case.schema.json` y el Playwright runner oficial**.

La remediación fue ejecutada en el worktree aislado `C:\Users\Judirico\Documents\QAMCP\worktrees\mvp01-bva-rbac`, preservando intactos el repositorio principal (`dda870e` en `feat/qap-vnext-architecture`), los worktrees de laboratorio (`int01-mvp-lab`, `int03-mvp-fixes`), las ramas oficiales (`develop`, `main`, `vNext`) y el archivo sensible de sesiones (`packages/playwright-runner/.qa/cache/sessions/admin-user.json`).

El ciclo de revisión interna incluyó:
- Implementación de BVA y RBAC con lógica genuina y determinista.
- Suite de reproducción negativa (40 pruebas) que demuestra los defectos originales y su rechazo actual.
- Doble auditoría adversarial (Challengers) con 57 pruebas de estrés.
- Auditoría Forense de Integridad (`auditor_mvp01_1`) con veredicto **`CLEAN`** (cero fachadas, cero hardcoding, cero bypasses).
- Segunda ronda de revisión independiente (`reviewer_mvp01_r2`) con veredicto **`APPROVE`**.

---

## 2. Desglose Detallado de los 11 Defectos Remediados

### 2.1 Oráculos BVA (Boundary Value Analysis — Defectos 1 al 6)

#### BVA 1: Eliminación de Límites Artificiales
- **Defecto Original:** Cuando una regla de negocio solo definía un extremo (por ejemplo, solo `min: 1` o solo `max: 100`), el generador inventaba un límite opuesto aplicando un padding arbitrario de `±10` (`max = min + 10` o `min = Math.max(0, max - 10)`). Esto producía pruebas de límites inexistentes en los requisitos del sistema.
- **Remediación:** Se erradicó por completo el padding arbitrario `±10`. La función `buildBoundaries` ahora calcula límites dinámicos estrictos:
  - Si solo existe `min`: genera exactamente `[min - 1 (invalid), min (valid), min + 1 (valid)]`.
  - Si solo existe `max`: genera exactamente `[max - 1 (valid), max (valid), max + 1 (invalid)]`.
  - Si existen ambos (`min` y `max`): genera los 5 puntos canónicos `[min - 1, min, nominal (punto medio), max, max + 1]`.
  - Si no existe ningún límite numérico válido, no se inventa ninguno y se devuelve lista vacía.

#### BVA 2: Distinción entre Límites Confirmados y Heurísticos
- **Defecto Original:** Reglas derivadas heurísticamente por crawlers o análisis estático de baja confianza se trataban como hechos confirmados. Además, se confundían restricciones de longitud de cadena (`minlength`/`maxlength`) con valores numéricos de campos.
- **Remediación:** Se estableció un filtro estricto de procedencia:
  - Solo se procesan reglas con `rule.status === 'confirmed'`.
  - Se exige procedencia sustantiva (`rule.source` dentro de `['user_confirmed', 'prd', 'user_text']`).
  - Las reglas con status `inferred`, `draft` o sin confirmación explícita son ignoradas (fail-closed).
  - Se separó la extracción semántica de límites numéricos respecto de longitudes de texto o atributos DOM auxiliares.

#### BVA 3: Erradicación de Selectores Genéricos Ciegos
- **Defecto Original:** Ante la ausencia de selectores comprobados para un campo, el generador recurría a plantillas ciegas como `#${field}`, `#submit` o `.success-message`, provocando que el runner fallara en tiempo de ejecución o validara elementos equivocados.
- **Remediación:** Se implementó una resolución rigurosa contra el inventario `ModuleSelectors`:
  - Se busca el selector exacto del campo (`selectors.fields[field]`), de envío (`selectors.submit`) y de confirmación (`selectors.success`).
  - Si el selector del campo o el selector de envío no están definidos o confirmados en el módulo, el generador no emite el caso de prueba ejecutable (fail-closed), evitando contaminar el plan de pruebas con selectores ficticios.

#### BVA 4: Corrección de Oráculo Invertido `not_visible`
- **Defecto Original:** Para validar entradas fuera de límite (valores inválidos como `min - 1` o `max + 1`), el generador emitía una aserción `{ assertion_type: 'not_visible', selector: successSelector }`. Esto constituía un oráculo invertido peligroso: si el formulario se congelaba, arrojaba error 500 no capturado o simplemente no respondía, la prueba aprobaba como un falso PASS porque el mensaje de éxito "no era visible".
- **Remediación:** Se erradicó la aserción `not_visible` como criterio de rechazo. Para casos inválidos, se exige acreditación de un error observable:
  - Se resuelve el selector de error del campo (`selectors.errors[field]`) o el selector general de error del módulo (`selectors.error` o `[data-testid="error-${field}"]`).
  - La aserción para entradas inválidas es estrictamente `{ assertion_type: 'visible', selector: errorSelector }` (o comprobación de mensaje con `contains`).
  - Si el módulo carece de un mecanismo observable para reportar el rechazo, el caso inválido no se emite como ejecutable certificado.

#### BVA 5: Detección de Conflictos entre Reglas del Mismo Campo
- **Defecto Original:** Si existían múltiples reglas contradictorias aplicables al mismo campo (por ejemplo, una regla indicando `min: 5` y otra indicando `min: 10`, o una regla con `min > max`), el generador utilizaba el operador nullish coalescing (`??`) para tomar la primera arbitrariamente, silenciando la inconsistencia.
- **Remediación:** Se implementó un algoritmo explícito de detección de contradicciones:
  - Si se detectan múltiples valores incompatibles para `min` o para `max`, o si `min > max`, se registra formalmente un conflicto de reglas.
  - El generador rechaza emitir casos ejecutables para campos en conflicto hasta que el usuario o el PRD resuelvan la ambigüedad, aplicando fail-closed.

#### BVA 6: Prohibición de Casos Ejecutables sin Oráculo Acreditado
- **Defecto Original:** Se emitían objetos `TCCase` con bandera ejecutable incluso cuando faltaban pasos de aserción críticos o cuando no existía confirmación de cómo validar el resultado.
- **Remediación:** Cumplimiento íntegro del principio fail-closed: un caso de prueba BVA solo se emite cuando la totalidad de sus oráculos (campo de entrada, valor límite, selector de interacción, selector de feedback y aserción observable) están 100% acreditados.

---

### 2.2 Oráculos RBAC (Role-Based Access Control — Defectos 7 al 11)

#### RBAC 1: Erradicación del Fallback Inventado `${role}-local`
- **Defecto Original:** Cuando el generador identificaba un rol no autorizado para el cual no existía un perfil en `profiles.json`, fabricaba un identificador sintético `${role}-local` en el paso de login/autenticación. En tiempo de ejecución con el runner real, este perfil ficticio no existía, provocando fallos de ejecución o requiriendo mocks ilegítimos.
- **Remediación:** Se eliminó por completo cualquier generación del sufijo `-local` o perfiles sintéticos:
  - La función `resolveProfileId(role, profiles)` busca coincidencias estrictas de slug normalizado o prefijo únicamente dentro de perfiles formalmente provistos y válidos (`typeof profile.id === 'string' && profile.id.length > 0`).
  - Si un rol no autorizado no cuenta con un perfil autenticado acreditado en `profiles`, el generador ignora dicho rol (`if (!profileId) continue;`) y no emite prueba ejecutable para él.
  - Se preserva la seguridad: no se fabrican identidades ni se comprometen credenciales reales.

#### RBAC 2: Eliminación de Presunciones Basadas en `moduleContext.users`
- **Defecto Original:** El generador asumía roles y permisos a partir de cadenas libres extraídas por el crawler en `moduleContext.users`, tratándolas como identidades con privilegios sin validar reglas formales de acceso.
- **Remediación:** Se desacopló la determinación de autorización de cadenas libres del crawler:
  - Los roles del proyecto se obtienen exclusivamente de fuentes autoritativas (`projectRoles` o definiciones formales).
  - La autorización o denegación se computa únicamente a partir de reglas de categoría actor confirmadas (`rule.category === 'actor' && rule.status === 'confirmed'`) o matrices de control de acceso estructuradas.

#### RBAC 3: Erradicación de Aserciones Vacuas `selector: body, assertion_type: exists`
- **Defecto Original:** Para pruebas negativas de acceso denegado, el generador emitía un paso de aserción `{ selector: 'body', assertion_type: 'exists' }`. Esto representaba una aserción vacua: prácticamente cualquier respuesta HTTP (incluyendo la pantalla completa del recurso protegido o un error 500) contiene un elemento `body`, aprobando la prueba de seguridad como un falso positivo absoluto.
- **Remediación:** Se erradicó terminantemente `selector: 'body', assertion_type: 'exists'`. La función `resolveDenialStep` implementa oráculos observables genuinos de denegación:
  - **Aserción por redirección:** `{ type: 'assert', assertion_type: 'equals', expected: '/login' }` (evalúa `page.url()` sin selector).
  - **Aserción por mensaje de acceso denegado:** `{ type: 'assert', selector: denialSelector, assertion_type: 'visible' }`, utilizando `moduleContext.denial_selector` o el selector por defecto canónico `DEFAULT_DENIAL_SELECTOR` (`[data-testid="access-denied"], [data-testid="unauthorized"], .access-denied, .unauthorized, .error-403, h1:has-text("403"), h1:has-text("Access Denied")`).
  - **Aserción por ausencia de control privilegiado:** `{ type: 'assert', selector: privilegedSelector, assertion_type: 'not_exists' }`, verificando que la acción restringida no esté disponible para el actor.

#### RBAC 4: Validación Estricta de Identidades y Reglas de Actor
- **Defecto Original:** El generador realizaba un producto cartesiano ciego entre roles no autorizados y reglas de actor, sin verificar la aplicabilidad de la regla al contexto y asumiendo gramática estática. Además, revisiones técnicas detectaron vulnerabilidades ante perfiles malformados (objetos sin `id` o nulos) y expresiones gramaticales en español activo (`prohíbe`, `deniega`, `bloquea`) que invertían el sentido de la regla.
- **Remediación:**
  - En `resolveProfileId`, se incorporaron guardas robustas contra perfiles malformados (`!profile || typeof profile !== 'object'`), evitando excepciones `TypeError`.
  - En `isRoleForbiddenInText`, se amplió la expresión regular para reconocer formas verbales activas en español (`proh[ií]be[sn]?`, `prohibir`, `deniega[n]?`, `bloquea[n]?`, `restringe[n]?`) junto con participios (`prohibid[oa]s?`, `denegad[oa]s?`), garantizando que oraciones como *"El sistema prohíbe acceso al rol guest"* identifiquen a `guest` como rol no autorizado sin invertir la lógica.
  - Se filtran slugs de roles que resulten vacíos tras la normalización (`.filter(role => role.length > 0)`), impidiendo que roles consistentes en símbolos puros capturen arbitrariamente perfiles por prefijo vacío.

#### RBAC 5: Verificación de Resultado Observable de Denegación
- **Defecto Original:** Si un módulo web no poseía mecanismo observable de denegación (por ejemplo, aplicaciones legacy que no redirigen ni muestran mensajes), el generador forzaba la emisión del caso negativo con aserciones arbitrarias.
- **Remediación:** Se implementó una compuerta fail-closed explícita:
  - Si `moduleContext.observable_denial === false` o `moduleContext.denial_oracle === false`, `resolveDenialStep` devuelve `null`.
  - Al recibir `null`, `generateRbacNegativeCases` omite el caso para ese módulo, impidiendo la generación de pruebas no verificables.

---

## 3. Inventario Exacto de Archivos Modificados y Añadidos

La remediación involucra exactamente 8 archivos dentro de la worktree `C:\Users\Judirico\Documents\QAMCP\worktrees\mvp01-bva-rbac`:

| # | Archivo | Estado Git | Componente | Descripción del Cambio |
|---|---|---|---|---|
| 1 | `packages/knowledge/src/plan/bva-generator.ts` | Modificado | Core Engine | Eliminación de padding `±10`, límites unilaterales exactos, filtrado por status confirmado, resolución de selectores estrictos en `ModuleSelectors`, eliminación de `not_visible` para errores, detección de conflictos. |
| 2 | `packages/knowledge/src/plan/rbac-generator.ts` | Modificado | Core Engine | Erradicación de `${role}-local`, eliminación de `body exists`, oráculos observables (`visible` en denial / `not_exists` en privileged / redirección), manejo de perfiles malformados, soporte de verbos activos en español, descarte de slugs vacíos. |
| 3 | `packages/knowledge/src/__tests__/bva-generator.test.ts` | Modificado | Tests Unitarios | Actualización y ampliación de la suite focal BVA (25 pruebas unitarias cubriendo límites bilaterales, unilaterales, selectores y fail-closed). |
| 4 | `packages/knowledge/src/__tests__/rbac-generator.test.ts` | Modificado | Tests Unitarios | Actualización y ampliación de la suite focal RBAC (17 pruebas unitarias cubriendo resolución de perfiles, oráculos de denegación, verbos en español y fail-closed). |
| 5 | `packages/knowledge/src/__tests__/oracle-reproduction-negative.test.ts` | Añadido | Tests Reproducción | Suite de 40 pruebas de regresión negativa que reproduce formalmente los 11 defectos originales y confirma su subsanación y rechazo fail-closed. |
| 6 | `packages/knowledge/src/__tests__/bva-adversarial-challenge.test.ts` | Añadido | Tests Challenger | Suite de estrés adversarial BVA (31 pruebas) evaluando casos extremos, tipos numéricos exóticos, contradicciones y concurrencia. |
| 7 | `packages/knowledge/src/__tests__/challenger-rbac-stress.test.ts` | Añadido | Tests Challenger | Suite de estrés adversarial RBAC (26 pruebas) evaluando perfiles nulos/malformados, slugs especiales, oraciones complejas y aserciones estrictas. |
| 8 | `docs/vnext/implementaciones/DEV-MVP-01/INFORME_TECNICO_DEV-MVP-01.md` | Añadido | Documentación | Informe técnico aditivo exhaustivo de remediación, evidencias físicas y guía de traspaso a Codex. |

---

## 4. Resultados de Ejecución de Pruebas Físicas

Todas las verificaciones fueron ejecutadas físicamente en el entorno de trabajo (Node.js v24.15.0, Windows 11, pnpm v10.6.5, Vitest v4.1.11, tsup v8.5.1).

### 4.1 Resumen Global del Paquete `@qap/knowledge`
- **Comando Ejecutado:** `pnpm --dir C:\Users\Judirico\Documents\QAMCP\worktrees\mvp01-bva-rbac --filter @qap/knowledge test`
- **Archivos de Prueba Evaluados:** **34 archivos**
- **Pruebas Ejecutadas:** **488 pruebas**
- **Pruebas Aprobadas:** **488 pruebas (100% PASS)**
- **Pruebas Fallidas:** **0**
- **Duración Total:** 8.01 segundos

### 4.2 Desglose de Suites Focales y Adversariales

| Suite de Pruebas | Archivo | Pruebas | Resultado | Propósito / Cobertura |
|---|---|:---:|:---:|---|
| BVA Generator Unit | `src/__tests__/bva-generator.test.ts` | 25 | **25 PASS** | Cobertura exhaustiva de generación de límites bilaterales y unilaterales, validación de esquema y selectores de error. |
| RBAC Generator Unit | `src/__tests__/rbac-generator.test.ts` | 17 | **17 PASS** | Cobertura de perfiles acreditados, denegación observable, parseo de reglas de actor y verbos en español. |
| Reproducción Negativa | `src/__tests__/oracle-reproduction-negative.test.ts` | 40 | **40 PASS** | Reproducción de los 11 defectos originales demostrando que las condiciones defectuosas son rechazadas fail-closed. |
| Challenger BVA Stress | `src/__tests__/bva-adversarial-challenge.test.ts` | 31 | **31 PASS** | Pruebas adversariales de límites de punto flotante, límites cero, reglas con conflicto y selectores faltantes. |
| Challenger RBAC Stress | `src/__tests__/challenger-rbac-stress.test.ts` | 26 | **26 PASS** | Pruebas de estrés con perfiles corruptos/malformados, caracteres especiales, slugs vacíos y ausencia de oráculos. |
| Resto del Paquete | 29 archivos preexistentes | 349 | **349 PASS** | Inferencia de conocimiento, SQLite adapter, FTS5, lock manager, lifecycle storage, ajv compiler, route scanner, etc. |

### 4.3 Verificación de Compilación TypeScript
- **Comando Ejecutado:** `pnpm --dir C:\Users\Judirico\Documents\QAMCP\worktrees\mvp01-bva-rbac --filter @qap/knowledge build`
- **Compilador:** `tsup v8.5.1` (Target: ES2022)
- **Resultados:**
  - Build ESM: `dist/index.js` (186.04 KB) en 56 ms — **Éxito**.
  - Build DTS: `dist/index.d.ts` (39.30 KB) en 2273 ms — **Éxito**.
  - Cero errores sintácticos, cero advertencias de tipado.

---

## 5. Compatibilidad de Contratos e Interfaces

### 5.1 Base Candidata `47f17ce`
La base sobre la cual se trabajó corresponde al candidato técnico `47f17ceafc2f76d5a41fd714cd0c071dbdcb8d72`, que unifica `develop` (`b50453f`) con la rama de arquitectura vNext (`a3f7ab5`). Todos los cambios en `@qap/knowledge` preservan la compatibilidad binaria y de API con los módulos consumidores (`@qap/engine`, MCP handlers y herramientas de soporte).

### 5.2 Contrato `tc-case.schema.json`
Los objetos `TCCase` generados tanto por `generateBvaCases` como por `generateRbacNegativeCases` cumplen estrictamente el esquema canónico JSON Schema (`tc-case.schema.json`):
- `id`: Generado de forma determinista y reproducible como UUID v5 (RFC 4122) a través de `generateDeterministicUuid` (función SHA-256 propia sin dependencias externas).
- `name` y `description`: Textos claros, legibles y descriptivos.
- `priority`: Valores enum válidos (`'P0'`, `'P1'`, etc.).
- `status`: `'draft'` (requiere aprobación/ejecución por el planificador).
- `steps`: Array de objetos `TCStep` donde cada paso respeta estrictamente los tipos (`'navigate'`, `'input'`, `'click'`, `'assert'`) y atributos exigidos.
- Validación por `SchemaValidator`: Ambos generadores validan sus casos contra el validador antes de emitirlos.

### 5.3 Contrato con Playwright Runner
- `assertion_type`: Estrictamente restringido a los valores soportados por el runner (`'equals'`, `'contains'`, `'visible'`, `'exists'`, `'not_exists'`, `'count'`, `'attribute'`).
- Aserciones de URL: Se utiliza `assertion_type: 'equals'` (o `'contains'`) sin selector, lo cual el runner interpreta correctamente como aserción sobre `page.url()`.
- Aserciones de visibilidad: Restringidas a selectores CSS/XPath específicos y comprobables (`denial_selector`, `errorSelector`, `DEFAULT_DENIAL_SELECTOR`).

---

## 6. Riesgos Pendientes y Límites de Alcance

A pesar de la exhaustividad de las pruebas unitarias y de estrés, se dejan explícitamente documentados los siguientes riesgos y límites:

1. **Auditoría Independiente de Codex Pendiente:**  
   Este reporte no constituye aceptación final. Codex debe auditar el diff de forma independiente, ejecutar los arneses de prueba y emitir su propio dictamen vinculante.
2. **Validación con Navegador Real en Laboratorio de Integración:**  
   Las pruebas de `@qap/knowledge` se ejecutan en entorno Node/Vitest con validación estructural de selectores y contratos de casos de prueba. La interacción efectiva contra un navegador Chromium real (en particular la visibilidad de banners CSS y redirecciones SPA) debe validarse en las corridas de integración del runner de Playwright (`int01-mvp-lab` / Staging).
3. **Dependencia de la Calidad de `ModuleSelectors` y `AuthProfile`:**  
   Dado que los generadores operan bajo el principio fail-closed, si una aplicación bajo prueba carece de perfiles registrados en `profiles.json` o selectores en sus metadatos, los generadores omitirán legítimamente los casos ejecutables. Esto es el comportamiento correcto de diseño para evitar falsos PASS, pero requiere que las etapas de Reconocimiento y PRD pueblen selectores y perfiles completos para maximizar la cobertura generada.
4. **Aislamiento Estricto de Espacios de Trabajo:**  
   El repositorio principal `C:\Users\Judirico\Documents\QAMCP\QAMCP` permanece intacto en `dda870e4695a8a27db07ea32b81c1efbbf6ba39e`. Los laboratorios `int01-mvp-lab` y `int03-mvp-fixes` se encuentran intactos. Ningún cambio ha sido publicado ni fusionado a ramas protegidas.

---

## 7. Instrucciones para el Traspaso a Codex (QA Independiente)

Para que el auditor independiente de Codex pueda replicar y verificar de forma física y autónoma esta entrega, se proporcionan los siguientes pasos e instrucciones de verificación:

### 7.1 Ubicación del Worktree
- **Directorio de inspección:** `C:\Users\Judirico\Documents\QAMCP\worktrees\mvp01-bva-rbac`
- **Base Git:** Detached HEAD sobre candidato `47f17ceafc2f76d5a41fd714cd0c071dbdcb8d72`

### 7.2 Comprobación de Confinamiento Git
```powershell
# 1. Verificar estado del worktree (debe reflejar exclusivamente los 8 archivos del hito)
git -C "C:\Users\Judirico\Documents\QAMCP\worktrees\mvp01-bva-rbac" status

# 2. Verificar que el repositorio principal permanece intacto en dda870e
git -C "C:\Users\Judirico\Documents\QAMCP\QAMCP" rev-parse HEAD
# Esperado: dda870e4695a8a27db07ea32b81c1efbbf6ba39e
```

### 7.3 Verificación de Ausencia de Bypasses en Código Fuente
```powershell
# Debe retornar CERO líneas de código ejecutable
Select-String -Path "C:\Users\Judirico\Documents\QAMCP\worktrees\mvp01-bva-rbac\packages\knowledge\src\plan\rbac-generator.ts" -Pattern "local'"
Select-String -Path "C:\Users\Judirico\Documents\QAMCP\worktrees\mvp01-bva-rbac\packages\knowledge\src\plan\rbac-generator.ts" -Pattern "assertion_type: 'exists'"
Select-String -Path "C:\Users\Judirico\Documents\QAMCP\worktrees\mvp01-bva-rbac\packages\knowledge\src\plan\bva-generator.ts" -Pattern "assertion_type: 'not_visible'"
```

### 7.4 Ejecución de Pruebas Focales y de Reproducción Negativa
```powershell
pnpm --dir "C:\Users\Judirico\Documents\QAMCP\worktrees\mvp01-bva-rbac" --filter @qap/knowledge test -- `
  src/__tests__/bva-generator.test.ts `
  src/__tests__/rbac-generator.test.ts `
  src/__tests__/oracle-reproduction-negative.test.ts
# Esperado: 3 archivos pasados, 79 pruebas pasadas (25 BVA + 17 RBAC + 40 Reproducción)
```

### 7.5 Ejecución de Pruebas Adversariales de Estrés
```powershell
pnpm --dir "C:\Users\Judirico\Documents\QAMCP\worktrees\mvp01-bva-rbac" --filter @qap/knowledge test -- `
  src/__tests__/bva-adversarial-challenge.test.ts `
  src/__tests__/challenger-rbac-stress.test.ts
# Esperado: 2 archivos pasados, 57 pruebas pasadas (31 BVA Adversarial + 26 RBAC Stress)
```

### 7.6 Ejecución de la Suite Completa del Paquete y Compilación
```powershell
# Suite completa
pnpm --dir "C:\Users\Judirico\Documents\QAMCP\worktrees\mvp01-bva-rbac" --filter @qap/knowledge test
# Esperado: 34 archivos pasados, 488 pruebas pasadas, 0 fallos

# Build TypeScript
pnpm --dir "C:\Users\Judirico\Documents\QAMCP\worktrees\mvp01-bva-rbac" --filter @qap/knowledge build
# Esperado: Éxito en ESM y DTS
```

---

*Fin del Informe Técnico DEV-MVP-01.*
