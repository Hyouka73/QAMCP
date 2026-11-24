# QAP — Fe de Erratas y Cierre del Catálogo Previo a Planificación

**Rol:** Gemini Neon, Investigador Principal de QAP  
**Repositorio:** `Hyouka73/QAMCP`  
**Línea base única analizada:** `develop` en `77a9c4f3769784df40a17d5d19bd7c83a45f0c89`  
**Naturaleza:** Fe de erratas y cierre documental de solo lectura tras la revisión del Orquestador Principal. No modifica código, documentos ni GitHub, ni constituye autorización para implementar.

---

## 1. Fe de erratas del catálogo y clasificación

### 1.1 Corrección de encabezados y conteo exacto

Se corrige el error de encabezado en la sección 1.2 del informe anterior (donde figuraba «57 RF» por error tipográfico de suma) y se formaliza el desglose exacto del catálogo consolidado:

| Categoría | Procedentes de los 82 originales | Requisitos nuevos incorporados | Total consolidado |
|---|---:|---:|---:|
| **Requisitos Funcionales (RF)** | 56 | 4 (`REQ-XINST-001`, `REQ-QA-001`, `REQ-QA-002`, `REQ-QA-003`) | **60 RF** |
| **Requisitos No Funcionales (RNF)** | 19 | 1 (`REQ-AGT-001`) | **20 RNF** |
| **Políticas Operativas base (POL)** | 7 | 0 | **7 POL** |
| **Total del catálogo técnico** | **82** | **5** | **87 IDs únicos** |

*Verificación por familia de los 82 originales:*
- **RF base (56):** `MEM` (10: `001.1`, `001.3`, `001.4`, `002.1`, `002.3`, `002.4`, `003.1`, `003.2`, `003.3`, `003.4`), `DIS` (8: `001.1–001.8`), `DOC` (3: `001.1–001.3`), `IA` (5: `001.1–001.4`, `001.6`), `PLN` (6: `001.1–001.6`), `CAS` (4: `001.2–001.5`), `ORA` (7: `001.1–001.7`), `RUN` (1: `001.3`), `DAT` (3: `001.1`, `001.2`, `001.4`), `CAM` (3: `001.1`, `001.2`, `001.5`), `REP` (3: `001.2–001.4`), `REG` (3: `001.1–001.3`).
- **RNF base (19):** `MEM` (3: `002.5`, `003.5`, `003.6`), `IA` (1: `001.5`), `RUN` (5: `001.1`, `001.2`, `001.4`, `001.5`, `001.6`), `CAM` (2: `001.3`, `001.4`), `REP` (1: `001.1`), `SEG` (3: `001.3`, `002.1`, `002.2`), `INT` (4: `001.1–001.4`).
- **POL base (7):** `REQ-MEM-001.2`, `REQ-MEM-002.2`, `REQ-DOC-001.4`, `REQ-CAS-001.1`, `REQ-DAT-001.3`, `REQ-SEG-001.1`, `REQ-SEG-001.2`.
- **Ampliaciones absorbidas sin crear ID duplicado:** `REQ-UTCP-001` (absorbido como ampliación trazable de `REQ-DAT-001.2` + `REQ-INT-001.4`), `REQ-AGT-002`, `REQ-ONB-001`, `REQ-OPT-001`, `REQ-OPT-002`, `REQ-E2E-001` y `M1–M5`. Las remediaciones de línea base (visor HTTP/CORS y `git-adapter` sin shell) son trabajo de saneamiento de `REQ-SEG-001.1` y `REQ-REG-001.1`, no un ID adicional.

### 1.2 Separación de políticas adicionales de captura y retención

Las políticas de captura privada y retención son **políticas operativas adicionales** fuera del catálogo técnico de 87 requisitos (no alteran el total de 87):

- **Directriz fijada por el propietario (Autorización):** `POL-CAP-01` — Vigencia de **30 días** para autorizaciones de captura privada (TTL de permiso de acción, independiente del ciclo de vida de artefactos ya capturados).
- **Políticas de retención y exportación en evaluación (sujetas a aprobación):** `POL-RET-01..06` — Plazos diferenciados de artefactos, poda diaria y al iniciar QAP, conservación explícita para auditoría y exportación privada únicamente con autorización.

### 1.3 Incorporación corregida de la evidencia archivada (5 tags de GitHub e informes AS-01–AS-04)

Se retira la afirmación previa de que los hallazgos de `AS-01`–`AS-04` fueran desconocidos o dependieran de una nueva inspección de Codex. Con la inspección en solo lectura realizada por el Orquestador Principal:

- **`AS-01` y `AS-03`:** Informes ya entregados separadamente al Orquestador.
- **Tag `AS-02`:** Contiene código experimental de Git sin shell. **No está integrado en `develop` (`77a9c4f3`).**
- **Tag `AS-04`:** Contiene prototipo parcial de captura unificada con una **fuga de privacidad reproducida ante transición SPA a MFA**. **No está integrado en `develop` (`77a9c4f3`).** Este hallazgo confirma la exigencia técnica de protección continua antes del primer paint y manejo explícito de transiciones SPA hacia superficies sensibles/MFA en M3/E6.
- **Tag `MVP autónomo`:** Contiene contratos y pruebas experimentales de autonomía. **No está integrado en `develop` (`77a9c4f3`).**
- **Tag `Recovery`:** Documenta un **falso `PASS` por HTTP 201 sin persistencia**. **No está integrado en `develop` (`77a9c4f3`).** Confirma la criticidad de los testigos N2 independientes (`REQ-ORA-001.2`/`001.3`).
- **Tag `Hydrogen R2`:** Documenta correcciones experimentales, pruebas de recuperación y reparación de TypeScript, pero **sin evaluación ciega completa ni E1 HOST**. **No está integrado en `develop` (`77a9c4f3`).**

**Regla de línea base:** Ninguna capacidad, prueba ni remediación exclusiva de esos cinco tags se atribuye a `develop` (`77a9c4f3`).

---

## 2. Registro consolidado de decisiones técnicas cerradas

> **Nota:** Las decisiones siguientes están **cerradas técnicamente con fundamento** (no requieren escalación al propietario). **Ninguna equivale a autorización para implementar.**

| ID técnico | Decisión técnica cerrada | Fundamento y verificación |
|---|---|---|
| **DT-01** | **Motor determinista único: `playwright-core` + Chromium.** Descartar `@playwright/mcp` (dependencia muerta), Browser Use, Stagehand, Skyvern, Selenium y CDP crudo propio como runner principal. Alinear `playwright-core` a una única versión en todo el monorepo (eliminando la divergencia `1.49`/`1.62.1`/`1.63.0` de `develop`). | Garantiza determinismo, `BrowserContext` aislado, `trace.zip`, WebM e intercepción de red sin LLM por paso. El uso de `--only-shell` vs. Chromium completo se calibra por benchmark en G3/G5 (sin bloquear planificación). |
| **DT-02** | **Arquitectura de autoridad única (`@qap/core`) y adaptadores delgados MCP/CLI.** Eliminar doble autoridad y escritura paralela; separar puertos de persistencia de casos de uso autorizados; entrega de eventos/revocación post-commit. | Resuelve H01, H04, H05 y H-REV-03 sobre `develop` (`77a9c4f3`). |
| **DT-03** | **Rechazo de «unidad lógica transaccional» sobre el AUT.** Sustituida por registro durable de intención pre-efecto, claves de idempotencia/reconciliación acreditada, fencing por generación y publicación de archivos en fases separadas (preparación → promoción → confirmación). | Un fallo externo tras un efecto confirmado en el AUT no puede revertirse mediante transacción SQL local (H03 y Evaluación A). |
| **DT-04** | **Ejecutor soberano desacoplado del proceso/Job Object del host Stdio.** IPC local autenticado, exclusión de arranques rivales, recuperación de locks/endpoints tras muerte abrupta y doble carril persistente (determinista vs. razonamiento). | Exigido por H02, H-REV-06 y preservación de `HOST + DETERMINISTIC` sin daemon permanente con navegadores abiertos. |
| **DT-05** | **Rechazo de bloqueo por patrones de shell (`DP-11` original).** La garantía dura de resultados oficiales reside en QAP (solo intentos canónicos con digest verificado acreditan `PASS`). La adopción por host usa registro MCP + Skill breve `SKILL.md` + hooks **informativos opt-in** (desinstalables, 0 bloqueos a `vitest`/`jest`/`pytest`). | Evita falsos bloqueos en flujos de desarrollo y falsas garantías de seguridad por regex (Evaluación A). |
| **DT-06** | **Secuenciación just-in-time de experimentos (`DP-15` sustituida).** No ejecutar los 6 experimentos antes de G0: EXP-01 (+ interoperabilidad MCP `2025-11-25`/`2026-07-28`) condiciona el adaptador de hosts; EXP-05 acotado condiciona la selección de SDK para el puerto común OpenAPI/UTCP (`DP-13`) y la prueba de `read_only_reference`; EXP-02 va antes de G2; EXP-03/04/06 antes de activar defaults de distribución/paralelismo/captura. | Evita bloqueos artificiales previos a planificación manteniendo rigor experimental antes de fijar dependencias concretas. |
| **DT-07** | **Puerto común `DataPlan` compatible con OpenAPI y manuales UTCP (`DP-13`).** El contrato del puerto se diseña en G0; la elección del cliente concreto (`typescript-utcp` vs. HTTP/OpenAPI gobernado) se resuelve técnicamente mediante EXP-05 acotado. | Desacopla el contrato del proveedor concreto y evita especulación sin medición. |
| **DT-08** | **Saneamiento de seguridad y tipos en `develop` asignado a G0.** Confinamiento canónico y CORS restrictivo en `packages/reporter/src/server/server.ts`, eliminación de `execSync` en `packages/git-adapter/src/git-adapter.ts` (referencia técnica: hallazgo `AS-02`), aislamiento de deuda heredada `tsc` y compuerta `tsc --noEmit` para paquetes nuevos, y alineación explícita de versión Node.js (`node:sqlite` vs. `AGENTS.md`). | Defectos verificados directamente en `develop` (`77a9c4f3`). |
| **DT-09** | **Protección continua de captura visual/WebM y separación de resultados históricos tras poda.** (a) M3/E6 exige protección desde antes del primer paint, cobertura verificada ante transiciones SPA (incluyendo MFA, validado por el hallazgo de `AS-04`) y destrucción física inmediata del temporal ante fallo sin promoción. (b) **Verificabilidad post-poda sin `trace.zip` físico:** al confirmar un intento, QAP sella en BD un manifiesto inmutable (`attempt_manifest_hash`, `result_digest`, `sha256` por artefacto, `witness_independence_level` y veredicto). Cuando la poda elimina `trace.zip` o WebM/PNG, transiciona el estado del artefacto a `PRUNED_BY_RETENTION` (con `pruned_at` y `policy_id`) sin alterar `result_digest` ni veredicto; `ReportHandler` valida integridad física solo para artefactos `PRESENT` y acredita el veredicto histórico con estado explícito de evidencia podada para los demás. (c) **Invariante de Knowledge:** el Knowledge canónico vigente y los casos activos **nunca caducan** por la retención de intentos. | Resuelve la contradicción entre retención corta de trazas y `report.handler.ts:175-190` en `develop`, y blinda la separación entre resultado funcional y evidencia disponible. |
| **DT-10** | **Modelo técnico de poda diferenciada y operación sin bloqueo.** Motor único de poda (MCP/CLI) reemplazando el `qap_prune` defectuoso de `develop`, con `dryRun` real, cierre de handles, coordinación con locks de proyecto, ejecución asíncrona acotada al iniciar QAP + ciclo diario en ejecutor activo, y diferenciación técnica entre trazas de `PASS` (TTL corto) y trazas de fallos (`FAIL`/`ERROR`/`INDETERMINATE`, retención automática extendida sin depender de pinning manual inmediato). | Evita pérdida prematura de trazas de fallos en fines de semana y colisiones con ejecuciones activas. |

---

## 3. Registro de decisiones que requieren ratificación del propietario

Se incluyen **únicamente** decisiones que alteran **alcance, costo, operación o aceptación de riesgos**.

### 3.1 Decisiones de alcance abiertas (sin diferimiento unilateral)

| ID | Decisión de alcance | Alternativa A (Incluir en primera entrega) | Alternativa B (Diferir a fase posterior con puerto/contrato listo) | Consecuencias técnicas, costos y dependencias | Recomendación técnica |
|---|---|---|---|---|---|
| **DP-06** | **Modo `MANAGED`** (razonamiento desatendido con API de modelos) | Incluir proveedor `MANAGED` junto con `HOST + DETERMINISTIC` desde el primer lanzamiento. | Entregar `HOST + DETERMINISTIC` primero y habilitar `MANAGED` en una fase posterior detrás de `IReasoningProvider`. | **Alt. A:** habilita campañas nocturnas/CI desatendidas desde el inicio, pero añade **costo recurrente de APIs de modelos** (tensión con Principio 8), gestión de cuotas/billing, manejo de fallos de proveedor y compuertas de seguridad/privacidad de payloads externos antes de G4. **Alt. B:** preserva costo cero de API adicional y acelera entrega de `HOST + DETERMINISTIC`, posponiendo campañas desatendidas que requieran razonamiento nuevo. | **Alt. B** (sujeta a ratificación del propietario; no aprobada). |
| **DP-07** | **PostgreSQL self-hosted concurrente** | Implementar adaptador SQLite local y adaptador PostgreSQL concurrente en paralelo desde G1. | Implementar puerto único `IQapRepository` + SQLite (WAL+FTS5) en G1, y construir/certificar el adaptador PostgreSQL en una fase posterior. | **Alt. A:** habilita despliegue multiusuario/equipo desde la primera entrega, pero **duplica desde G1** el costo de migraciones, búsqueda textual (FTS5 vs. `tsvector`), pruebas de concurrencia/aislamiento en E2 e infraestructura CI de PostgreSQL. **Alt. B:** reduce riesgo y esfuerzo en G1 conservando portabilidad contractual, pero exige validar equivalencia de concurrencia, FTS y recuperación en E2 antes de ofrecer self-hosted. **Bloquea congelación del alcance de contratos de G0→G1.** | **Alt. B** (sujeta a ratificación del propietario; no aprobada). |
| **DP-08** | **Lectura nativa de PDF/DOCX con tablas** | Soportar parsers nativos de PDF/DOCX (con extracción de tablas y brechas) desde G2. | Soportar Texto/Markdown + OpenAPI en G2 detrás de `IDocumentFormatAdapter`, añadiendo adaptadores PDF/DOCX después. | **Alt. A:** cubre manuales corporativos binarios desde el primer corte, pero añade dependencias pesadas de parsing, complejidad de tablas multi-página/OCR y calibración de brechas en G2. **Alt. B:** acota complejidad y riesgo de G2 con reporte honesto de formatos no soportados, pero requiere que los manuales iniciales estén en Markdown/OpenAPI o sean convertidos previamente. | **Alt. B** si el corpus inicial admite Markdown/OpenAPI; **Alt. A** si el manual corporativo prioritario existe únicamente en PDF/DOCX. |

### 3.2 Decisiones de operación, seguridad y aceptación de riesgos

| ID | Decisión empresarial | Recomendación técnica | Consecuencias de adoptarla | Alternativa |
|---|---|---|---|---|
| **DP-01** | **Autonomía ordinaria sin aprobación humana por caso** | Elegibilidad automática por política y fuente acreditada (0 aprobaciones por caso en ruta ordinaria; intervención solo en conflictos de autoridad). | Cumple `QAP-VISION-AUTONOMIA.md` y elimina fricción repetitiva; exige rigor estricto en acreditación de fuentes y política de entorno. | Mantener compuerta humana por caso (incompatible con autonomía objetivo). |
| **DP-03** | **Cero credenciales en MCP/chat sin bypass** | Prohibición absoluta en todas las rutas (incluyendo fixtures locales), usando TTY sin eco, proveedor de secretos CI o loopback efímero con token de un solo uso. | Elimina superficie de fuga en historial/prompts/logs y retira `allowScopedCredentials` en G1; requiere usar canal fuera de banda incluso en desarrollo local. | Permitir bypass explícito solo en fixtures locales desechables (conserva superficie de fuga). |
| **DP-04** | **Semántica de `PASS` estructural (N1) vs. funcional/persistencia (N2)** | Permitir `PASS` estructural explícitamente etiquetado para propiedades observables sin mutación; exigir N2 independiente para persistencia/negocio (donde N2 `INDETERMINATE` impide `PASS` funcional). | Entrega señal útil temprana sin emitir falsos `PASS` de persistencia (como el caso HTTP 201 documentado en `Recovery`). | Exigir N2 para todo caso (reduce señales útiles en smoke estructural inicial). |
| **DP-05 & DP-14** | **Alcance de mutaciones, limpieza y lectura cross-instancia** | Permitir mutaciones solo en staging/fixtures autorizados con estrategia configurable (`delete` / `compensate` / `confine_tenant`); habilitar `read_only_reference` solo con identidad de solo lectura impuesta por destino y operaciones acreditadas (o `BLOCKED`). | Protege producción y sistemas contables/inmutables; requiere que el propietario declare qué entornos, tenants y referencias entran en el alcance inicial. | Restringir la primera entrega a solo lectura pura en staging (pospone validación de efectos y flujos E2E mutativos). |
| **DP-09** | **Autoridad de `tenant_id`** | Precedencia: perfil/fuente autorizada → declaración explícita del operador → `BLOCKED` si es requerido y desconocido. | Evita contaminación multi-tenant sin preguntar lo que ya está acreditado en el perfil. | Exigir declaración explícita en cada campaña (mayor fricción inicial). |
| **POL-RET-01..06** | **Plazos de retención, poda y exportación privada** *(TTL de autorización de captura privada ya fijado en 30 días)* | Aprobar: **72 h** para `trace.zip` de pruebas `PASS`, **conservación automática hasta 7 días** para `trace.zip` de fallos (`FAIL`/`ERROR`/`INDETERMINATE`, sin depender de pinning manual inmediato), **7 días** para WebM/PNG, **90 días** para resultados/metadatos (excluyendo Knowledge canónico vigente), poda diaria y al iniciar QAP, `audit pin` con cuota/caducidad y exportación de evidencias privadas únicamente con autorización explícita. | Controla disco y privacidad, protege depuración de fallos durante fines de semana sin intervención manual y preserva resultados verificables tras podar trazas (DT-09). | Retención uniforme de 72 h para toda traza (riesgo de pérdida de fallos antes del lunes) o retención extendida uniforme (mayor consumo de disco y exposición de datos). |
| **DP-02, DP-10 & Superficie** | **Criterios de salida G6 y matriz de lanzamiento** | Aprobar 3 apps ciegas bajo custodia independiente con umbrales separados (**80 % Discovery** y **75 % verificación de efectos**), más definición explícita de: (a) hosts de IA y SO/arquitecturas obligatorios de lanzamiento, (b) 2 locales iniciales (`REQ-QA-001`), (c) inclusión P0/P1 de accesibilidad (`REQ-QA-003`), y (d) aprobación de hooks informativos opt-in con umbral de enrutamiento medible (`DP-11`). | Fija el contrato comercial y de aceptación de G6 sin ambigüedad ni sobreajuste a un fixture conocido. | Tratar 80 % / 75 % como orientativos en G6 o acotar el lanzamiento a un subconjunto reducido de hosts/SO. |

---

## 4. Definición corregida de los tres momentos de G0

| Momento | Naturaleza | Criterios objetivos | Qué NO exige / frontera |
|---|---|---|---|
| **1. LISTO PARA PLANIFICACIÓN** | **Preparación de alcance y diseño (previo a WBS)** | 1) Catálogo técnico consolidado de 87 IDs + políticas adicionales aceptado. 2) Decisiones empresariales de la §3 ratificadas por el propietario (incluyendo alcance de `DP-06`, `DP-07`, `DP-08` y `POL-RET-01..06`). 3) Línea base de código fijada exclusivamente en `develop` (`77a9c4f3`) con hallazgos de los 5 tags archivados y `AS-01`–`AS-04` registrados. 4) Criterios de aceptación E1–E8 y compuertas de G0–G6 definidos. | **NO exige** que las correcciones de código de G0 (visor, Git, `tsc`), la escritura de `@qap/contracts` ni la ejecución de EXP-01/EXP-05 estén implementadas; todo ello se planifica dentro del WBS de G0. |
| **2. G0 EN EJECUCIÓN** | **Ejecución autorizada de la fase G0** | Se entra **únicamente tras aprobación explícita del WBS y autorización de inicio de G0**. Ejecuta: saneamiento de visor HTTP/CORS y `git-adapter` sin shell; aislamiento de deuda `tsc` y activación de `tsc --noEmit` para paquetes nuevos; alineación de `playwright-core` y Node.js; redacción y congelación de `@qap/contracts` (incluyendo manifiesto post-poda, captura privada 30 d y puerto `IQapRepository` según `DP-07`); ejecución de EXP-01 (+ interoperabilidad MCP) y EXP-05 acotado; inventario de escritores legados y preparación de fixtures. | **NO inicia** construcción de componentes de G1–G5 fuera de los contratos y saneamientos asignados a G0. |
| **3. G0 COMPLETADO** | **Compuerta de cierre verificada para abrir G1** | 1) Remediaciones de visor/CORS y Git sin shell integradas en `develop` con regresiones en verde. 2) `tsc --noEmit` activo en CI con 0 errores en paquetes nuevos y deuda heredada acotada. 3) `@qap/contracts` congelados y versionados con vectores de prueba y matriz de compatibilidad MCP (`2025-11-25` / `2026-07-28`). 4) Resultados de EXP-01 y EXP-05 registrados decidiendo adaptador de hosts y SDK del puerto `DataPlan`. 5) Inventario de almacenes/escritores legados, matriz de plataformas y fixtures listos. 6) Acta de cierre de G0 aprobada para autorizar G1. | **Criterio de paso:** Ninguna implementación de G1 comienza antes de satisfacer estas evidencias. |

---

## 5. Dictamen final de preparación para elaborar el WBS

### **DICTAMEN: NO LISTO PARA PLANIFICACIÓN (bloqueado exclusivamente por ratificación de alcance del propietario)**

**Evaluación precisa:**
- **Dimensión técnica y de diagnóstico:** **COMPLETA.** No se requiere ninguna investigación adicional, ni nuevas inspecciones de código sobre `develop` (`77a9c4f3`) o sobre los cinco tags archivados, ni implementar correcciones de G0 antes de planificar.
- **Único bloqueante real para elaborar el WBS:** La ratificación del propietario sobre el bloque acotado de decisiones empresariales de la **Sección 3** — en particular el alcance de **`DP-06` (`MANAGED`)**, **`DP-07` (PostgreSQL concurrente)** y **`DP-08` (PDF/DOCX nativos)**, las políticas de retención **`POL-RET-01..06`**, las reglas operativas **`DP-01`/`DP-03`/`DP-04`/`DP-05`/`DP-09`/`DP-14`** y la superficie de lanzamiento/criterios G6 (**`DP-02`/`DP-10`/`DP-11`**).

En cuanto el propietario emita sus decisiones sobre la **Sección 3**, QAP transiciona de inmediato a **LISTO PARA PLANIFICACIÓN** para elaborar el WBS de G0–G6 (sin implicar todavía autorización de **G0 EN EJECUCIÓN**).