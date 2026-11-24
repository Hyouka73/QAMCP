# QAP — Contravalidación AV-01 y Auditoría Específica AV-02

**Rol:** Gemini Neon, Investigador Principal y Arquitecto de QAP (bajo dirección del Orquestador Principal)

**Repositorio:** `Hyouka73/QAMCP` · **Rama:** `develop` · **SHA documental de referencia:** `cf024ca4602b134db9ef71b980d5943dcca285e0`

**Naturaleza de la entrega:** Solo lectura e investigación. Sin implementación de código, cambios de dependencias, ramas, worktrees, modificaciones en GitHub, WBS ni inicio de G0/G1.

**Recuento verificado del Registro Maestro:** 57 registros únicos (55 abiertos, 1 `VALIDADA`, 1 `SUSTITUIDA POR RESOLUCIÓN TRAZABLE`), desglosados en **11 críticas, 35 altas y 11 medias** (verificado directamente sobre `docs/qap-architecture/cierre-av-01/registro-maestro.md`).

# INFORME A — CONTRAVALIDACIÓN AV-01 (INTEGRIDAD Y COBERTURA DE REQUISITOS)

## A.1 Cotejo semántico diferencial de las fuentes históricas recuperadas

Se leyeron íntegramente las cinco fuentes históricas publicadas en `docs/qap-architecture/cierre-av-01/fuentes-recuperadas/` (`especificacion-entrega-1.md`, `especificacion-entrega-2.md`, `adenda-final.md`, `cierre-neon-previo.md`, `fe-erratas-neon.md`) y se cotejaron contra `docs/qap-architecture/acta-decisiones.md` (D01–D21), `docs/qap-architecture/catalogo-requisitos.md`, `docs/qap-architecture/cierre-av-01/matriz-semantica.md`, `auditoria-neon.md` y `auditoria-antigravity.md`.

### Resultado de inventario y cardinalidad

* **82 IDs atómicos originales:** coincidencia exacta 1-a-1 entre `adenda-final.md §1.1–1.14` (82 IDs únicos), `cierre-neon-previo.md`, `fe-erratas-neon.md`, `catalogo-requisitos.md` y los 92 elementos propuestos (0 IDs perdidos, 0 duplicados).
* **5 IDs añadidos en línea base:** `REQ-XINST-001`, `REQ-QA-001`, `REQ-QA-002`, `REQ-QA-003`, `REQ-AGT-001` (trazados a `cierre-neon-previo.md §1.1` y `fe-erratas-neon.md §1.1`).
* **11 ampliaciones absorbidas:** `REQ-AGT-002`, `REQ-ONB-001`, `REQ-OPT-001`, `REQ-OPT-002`, `REQ-E2E-001`, `UTCP/OpenAPI` (alias histórico `REQ-UTCP-001`), y `M1–M5`.
* **5 elementos incorporados desde D11/D14–D15/D18–D19:** `REQ-AUTREP-001` (de `CAND-REP-001`), `REQ-RUN-002.1` (de `CAND-RUN-001`), `REQ-SEG-002.3` + `POL-CAP-001` (desdoblamiento de `CAND-SEG-001` + Política adicional de captura), `POL-RET-001` (Política adicional de historial y retención). Total: **92 elementos normativos únicos**.

### Obligaciones, condiciones y excepciones históricas perdidas o diluidas en consolidaciones posteriores

Aunque ningún **ID** se perdió, el cotejo semántico línea por línea revela **9 obligaciones, condiciones o excepciones concretas** presentes en las fuentes recuperadas que fueron omitidas o diluidas en `catalogo-requisitos.md` y en la tabla resumida de `auditoria-neon.md §2.3`:

| # | Fuente recuperada | Obligación / condición / excepción omitida o diluida | Estado en `catalogo-requisitos.md` / `auditoria-neon.md §2.3` | Corrección requerida |
| --- | --- | --- | --- | --- |
| 1 | `especificacion-entrega-1.md §1` (Principio 8, D-002) y `§3` | **Invariante de no alteración del código fuente del AUT:** QAP detecta, reproduce, diagnostica y documenta defectos, pero **nunca modifica el código fuente ni infraestructura productiva del AUT**. | Ausente en `catalogo-requisitos.md` y `auditoria-neon.md §2.3`. | Restaurar como invariante transversal en `REQ-SEG-001.1` y `REQ-DAT-001.3`. |
| 2 | `especificacion-entrega-2.md §25` (`RNF-02`, D-020) | **Alternancia eficiente entre 3–4+ aplicaciones sin mantener navegadores abiertos en reposo** y liberación verificable de procesos, locks y memoria al concluir cada tarea. | Diluido en `REQ-OPT-001` / `REQ-RUN-001.5`; desapareció el escenario explícito de alternancia multi-aplicación sin navegadores en reposo. | Restaurar en `REQ-RUN-001.5` y `REQ-OPT-001`. |
| 3 | `especificacion-entrega-1.md §18` | **Separación explícita de 8 capacidades autorizables** (workspace, observación de orígenes, autenticación/perfiles, lectura documental, ejecución read-only, escritura/mutación, creación/limpieza de datos sintéticos, eliminación de recursos propios de QAP) — además de los 4 permisos multimedia de D18. | Condensado en «motor único deny-by-default» en `REQ-SEG-001.1`. | Restaurar la enumeración de capacidades autorizables en `REQ-SEG-001.1`. |
| 4 | `adenda-final.md` (`REQ-DOC-001.3`) y `entrega-1 §4.6` | **Prohibición de marcar como «eliminado»:** un elemento `documentado_no_observado` queda `pendiente`, **nunca** marcado automáticamente como eliminado. | `catalogo-requisitos.md:248` lista los 4 estados pero omite la prohibición explícita. | Restaurar en `REQ-DOC-001.3`. |
| 5 | `adenda-final.md` (`REQ-DIS-001.5`) y `entrega-1 §7` | **Regla `403` ≠ inexistencia:** ausencia de vista por rol se registra como `no_visible_para_rol`, nunca como `inexistente`. | Omitida en `catalogo-requisitos.md:190` y `auditoria-neon.md §2.3`. | Restaurar en `REQ-DIS-001.5`. |
| 6 | `adenda-final.md` (`REQ-REP-001.3`) y `entrega-1 §16` | **Regla `HTTP 500` ≠ `product_bug` automático (D-014):** evidencia ambigua se clasifica como `indeterminate`. | Omitida la cláusula explícita `HTTP 500` en `catalogo-requisitos.md:667`. | Restaurar en `REQ-REP-001.3`. |
| 7 | `adenda-final.md` (`REQ-SEG-001.3`) y `entrega-1 §18` | **No interferencia entre proyectos/tenants al revocar:** revocar en un proyecto/alcance nunca afecta otros proyectos/tenants. | Omitida en `catalogo-requisitos.md:738`. | Restaurar en `REQ-SEG-001.3`. |
| 8 | `adenda-final.md` (`REQ-DAT-001.2`) y `entrega-1 §14` | **Frontera de limpieza:** limpiar **únicamente** entidades creadas por el dataset de esa ejecución, de forma idempotente (2 ejecuciones no fallan ni afectan registros ajenos). | Omitida la restricción de no afectar registros ajenos en `catalogo-requisitos.md:569`. | Restaurar en `REQ-DAT-001.2`. |
| 9 | `adenda-final.md` (`REQ-CAS-001.4`) | **Doble obligación:** (a) abstención honesta (`INDETERMINATE` no habilitado para `PASS` sin fuente de negocio) y (b) aplicabilidad condicional por configuración/rol. | `catalogo-requisitos.md:413` conserva solo aplicabilidad condicional en el enunciado. | Restaurar la cláusula de abstención en `REQ-CAS-001.4`. |

**Precedencia D01–D21 aplicada sobre propuestas históricas incompatibles:**

* `especificacion-entrega-1.md` / `adenda-final.md` clasificaban PDF/DOCX y modo `MANAGED` como P1/P2 y `REQ-RUN-001.3` como tripartito; **D10/D11** hacen obligatorios PDF/DOCX/Excel/OpenAPI y validación funcional de reportes desde lanzamiento, **D03** difiere `MANAGED`, y **D12** eleva `REQ-RUN-001.3` a estructura cuatripartita (`evidence_health`).
* `fe-erratas-neon.md` (`DT-09`/`DT-10`) proponía TTL de 7 días para WebM/PNG y 7 días para trazas de fallos; **D19** prevalece fijando 90 días de detalle, historial permanente, knowledge sin caducidad y dejando los TTL operativos propuestos (24 h / 72 h / ≥14 d) pendientes de ratificación en `DE-01`.
* `especificacion-entrega-1.md §12.3` proponía `PASS_ESTRUCTURAL_LIMITADO` como `[PROPUESTA]`; **D12** y la taxonomía cerrada de 6 veredictos de `REQ-ORA-001.1` prevalecen (ver `AR-08` en AV-04).

---

## A.2 Recuperación de la clasificación histórica real vs. propuestas posteriores

`docs/qap-architecture/cierre-av-01/fuentes-recuperadas/fe-erratas-neon.md §1.1` (líneas 16–26) contiene la **clasificación individual histórica exacta** de los 87 requisitos base (**60 RF / 20 RNF / 7 POL**).

Al compararla 1-a-1 con la reconstrucción analítica posterior de `auditoria-neon.md §2.3` (que también sumó 60/20/7 por ajuste forzado) y la propuesta de `auditoria-antigravity.md §2.3` (63/20/9), se acreditan **13 discrepancias exactas** en los 87 IDs base:

| ID | Clasificación histórica real (`fe-erratas-neon.md`) | Reconstrucción Neon (`auditoria-neon.md §2.3`) | Propuesta Antigravity (`auditoria-antigravity.md §2.3`) | Análisis técnico (sin forzar cuota) |
| --- | --- | --- | --- | --- |
| `REQ-MEM-001.3` | **RF** | RNF | RNF | Funcional de modelo de datos (versionado consultable) con atributo transversal de inmutabilidad. |
| `REQ-MEM-002.1` | **RF** | RNF | RNF *(con nota: estructural/funcional)* | Funcional de dominio (particionamiento por alcance) con etiqueta de seguridad/aislamiento. |
| `REQ-MEM-002.2` | **POL (2/7)** | RF | RF | **Política operativa** (bloqueo ante alcance ambiguo) + validación técnica. |
| `REQ-MEM-003.5` | **RNF** | RF | RF | Capacidad funcional de retención/poda con atributo RNF de aislamiento de almacenamiento. |
| `REQ-DIS-001.8` | **RF** | RNF | RNF | Requisito no funcional de continuidad/disponibilidad operativa del ejecutor. |
| `REQ-IA-001.6` | **RF** | RNF | RNF | Capacidad funcional opcional (modo `MANAGED`), diferida por D03. |
| `REQ-PLN-001.5` | **RF** | RNF | RNF | Control funcional y de integridad (congelamiento de snapshot). |
| `REQ-RUN-001.4` | **RNF** | RF | RF | Requisito no funcional de resiliencia/recuperación ante fallos (idempotencia + reconciliación). |
| `REQ-CAM-001.3` | **RNF** | RF | RF | Capacidad funcional de presupuestos con atributo RNF de eficiencia. |
| `REQ-REP-001.1` | **RNF** | RF | RF | Control de integridad/custodia de evidencia (RNF con interfaz funcional). |
| `REQ-SEG-002.2` | **RNF** | **POL (7/7)** | **POL** | Regla de política dura (`fail-closed`, no degradación a anónimo) + control técnico. |
| `REQ-QA-003` | **RF** | RNF *(forzado para cuadrar 20)* | **RF** | **RF inequívoco** (capacidad de QA sobre el AUT; cobertura sujeta a `DE-05`). |
| `REQ-AGT-001` | **RNF** | RF | RF | Capacidad de adopción/usabilidad multi-host (RNF de interoperabilidad/usabilidad con entregables funcionales). |

**Conclusión taxonómica:** No debe forzarse ni la distribución 60/20/7 ni 62/21/9 ni 63/20/9 como meta numérica. La **clase primaria** (`RF` / `RNF` / `POL`) es un metadato organizativo complementado por **etiquetas transversales de cumplimiento** (`seguridad`, `integridad`, `privacidad`, `autonomía`, `portabilidad`, `gobernanza`) y **procedencia histórica** (`fe-erratas-neon.md` conservado como columna informativa, nunca como techo ni como regla de exclusión de lanzamiento).

---

## A.3 Resolución individual de registros AV-01 (AR-01, AR-02, AR-03, AR-04, AR-55, AR-56)

### AR-01 · Cotejo diferencial con fuentes primarias recuperadas

* **Obligación normativa:** Garantizar que ninguna obligación, condición, excepción, prioridad o criterio de aceptación de Entregas 1–2, Adenda Final, Cierre previo y Fe de erratas se haya perdido al consolidar el catálogo de 92 elementos, manteniendo precedencia de D01–D21.
* **Afirmación técnica revisada:** La objeción previa de AV-01 por ausencia de fuentes primarias queda **superada en cuanto a recuperación documental** tras publicarse los 5 archivos en `fuentes-recuperadas/`. El cotejo diferencial confirma **0 IDs perdidos**, pero identifica **9 condiciones/excepciones históricas diluidas** (tabla §A.1) que deben restaurarse explícitamente en el catálogo objetivo.
* **Evidencia verificable:** `docs/qap-architecture/cierre-av-01/fuentes-recuperadas/{especificacion-entrega-1.md,especificacion-entrega-2.md,adenda-final.md,cierre-neon-previo.md,fe-erratas-neon.md}`, `docs/qap-architecture/catalogo-requisitos.md`, `docs/qap-architecture/acta-decisiones.md`.
* **Evaluación de recomendaciones anteriores:** Codex (`discrepancias.md:34`) acertó al exigir la recuperación o acta de incertidumbre; Neon (`auditoria-neon.md §12`) subestimó el riesgo de pérdida de matices; Antigravity (`auditoria-antigravity.md §2.1`) verificó cardinalidad pero sin acceso a las fuentes primarias.
* **Contrato definitivo propuesto:** Incorporar las 9 enmiendas exactas de §A.4 al catálogo consolidado y registrar la trazabilidad `Adenda Final (82) + Fe de erratas (87) + D01–D21 (92)` como línea base normativa sin incertidumbre sobre fuentes históricas de requisitos (manteniendo la nota de `fuentes-recuperadas/README.md` sobre procedencia textual no firmada criptográficamente).
* **Alternativas descartadas y fundamento:** Descartada la «aceptación bajo incertidumbre» sin restaurar las 9 cláusulas, porque ya existen los textos recuperados y omitir reglas como `403 ≠ inexistente`, `HTTP 500 ≠ product_bug` o `D-002` degradaría la especificación.
* **Riesgo residual:** Las copias recuperadas tienen saltos de línea normalizados sin firma criptográfica respecto a sesiones externas originales (riesgo documental menor, acotado por la prevalencia de D01–D21).
* **Experimento necesario:** No aplica (verificación puramente documental).
* **Criterio cuantificable de éxito:** 9/9 enmiendas de §A.4 aplicadas en `catalogo-requisitos.md` y verificadas por diff sin pérdida de IDs ni contradicción con D01–D21.
* **Alternativa viable si fracasa:** No aplica.
* **Fase que condiciona:** Cierre documental de AV-01 (previo a congelar especificación objetivo y WBS).
* **Estado de diseño:** **VALIDADA CON ENMIENDAS EXACTAS** *(en registro maestro: transiciona de `BLOQUEANTE` a `PENDIENTE` de aplicación editorial de §A.4; una vez aplicada, `VALIDADA`)*.
* **Estado separado de validación experimental:** No requiere validación experimental (`N/A`).

### AR-02 · Taxonomía primaria y etiquetas de cumplimiento

* **Obligación normativa:** Clasificar los 92 elementos con criterios explícitos de clase primaria (`RF`/`RNF`/`POL`) y etiquetas transversales sin forzar distribuciones numéricas ni usar la clase para rebajar alcance de lanzamiento.
* **Afirmación técnica revisada:** Recuperada la clasificación histórica real (`fe-erratas-neon.md`: 60 RF / 20 RNF / 7 POL), se comprueba que `REQ-QA-003` **ya era RF históricamente** (Neon lo movió a RNF por error al reconstruir 60/20/7) y que existieron 13 desplazamientos en la reconstrucción de Neon.
* **Evidencia verificable:** `fuentes-recuperadas/fe-erratas-neon.md:16-26`, `auditoria-neon.md:50-143`, `auditoria-antigravity.md:71-75`.
* **Evaluación de recomendaciones anteriores:** Se corrige a Neon (`auditoria-neon.md §2.3`) por forzar `REQ-QA-003` a RNF y mover `REQ-MEM-002.2` fuera de POL; se valida el criterio de Antigravity (`C-01`) de usar clase primaria + etiquetas de cumplimiento y tratar `REQ-QA-003` como RF, pero evitando imponer 63/20/9 como cuota.
* **Contrato definitivo propuesto:** Esquema de metadatos por elemento: `{ id, clase_primaria: RF|RNF|POL, clase_historica_fe_erratas, etiquetas_cumplimiento[], prioridad_lanzamiento, autoridad_d01_d21 }`. Regla explícita: la clase primaria **nunca** convierte un requisito en opcional; el nivel de cobertura de `REQ-QA-003` sigue sujeto a `DE-05` (AV-08). Se adopta la clasificación objetiva resultante sin cuota fija (conservando `REQ-QA-003` y `REQ-MEM-002.1` como `RF`, `REQ-MEM-002.2` y `REQ-SEG-002.2` como `POL`, `REQ-SEG-002.1` como `RNF` con etiqueta `POL/seguridad`).
* **Alternativas descartadas y fundamento:** Descartado fijar cuotas cerradas (`60/20/7`, `62/21/9` o `63/20/9`) porque indujo reasignaciones artificiales (como `REQ-QA-003` a RNF).
* **Riesgo residual:** Bajo; mitigado prohibiendo decisiones de alcance basadas en la columna de clase.
* **Experimento necesario:** No aplica.
* **Criterio cuantificable de éxito:** 92/92 filas de la matriz objetivo con `clase_primaria`, `clase_historica_fe_erratas` y `etiquetas_cumplimiento` poblados y 0 contradicciones con D01–D21.
* **Alternativa viable si fracasa:** No aplica.
* **Fase que condiciona:** Cierre documental de AV-01.
* **Estado de diseño:** **VALIDADA CON ENMIENDAS EXACTAS** *(transiciona a `VALIDADA` al aplicarse §A.4; dependencia `DE-05` permanece en AV-08 / AR-35)*.
* **Estado separado de validación experimental:** `N/A`.

### AR-03 · Integridad normativa del catálogo de 92 elementos y separación de dependencias AV-02–AV-08

* **Obligación normativa:** Garantizar que cada uno de los 92 elementos conserve su obligación normativa completa, alias, 11 ampliaciones, condiciones, excepciones y precedencia D01–D21, sin que tablas resumidas sustituyan obligaciones.
* **Afirmación técnica revisada:** No todas las obligaciones de AR-03 requieren esperar a AV-02–AV-08 para consolidarse en el catálogo base; deben separarse las **consolidables inmediatamente en AV-01** de los **contratos técnicos detallados dependientes de AV-02–AV-08**:
* **Consolidables inmediatamente en AV-01 (texto normativo base, alias y cobertura):**
1. Incorporación de las 9 obligaciones/excepciones recuperadas de Entregas 1–2 y Adenda (§A.1).
2. Trazabilidad completa `82 + 5 + 11 ampliaciones + 5 promociones = 92` con alias (`CAND-REP-001`→`REQ-AUTREP-001`, `CAND-RUN-001`→`REQ-RUN-002.1` con subcriterios `1a` preferencias / `1b` fidelidad obligatoria, `CAND-SEG-001`+Pol. Captura→`REQ-SEG-002.3`+`POL-CAP-001`, Pol. Retención→`POL-RET-001`, `REQ-UTCP-001`→`REQ-DAT-001.2`+`REQ-INT-001.4`).
3. Elevación de `REQ-RUN-001.3` a 4 ejes (`evidence_health`), incorporación de `ScopeVector` deslindado (`AR-04`), y regla expresa de que las tablas resumen remiten por referencia normativa al texto completo del catálogo + D01–D21.


* **Dependientes de contratos técnicos de AV-02–AV-08 (no bloquean la consolidación base del catálogo, sí su congelación contractual de implementación):**
* **AV-02:** contratos de custodia multimedia (`AR-27`), atestación del ejecutor (`AR-28`), autoridad en destino (`AR-31`), bóveda/sesiones (`AR-07`/`AR-47`), visor/Git (`AR-24`/`AR-40`), permisos y precedencia de retención (`AR-25`/`AR-32`). *(Resueltos a nivel de diseño en Informe B de esta misma entrega).*
* **AV-03:** continuidad soberana sin host, colas, SDK MCP, localización propia y paridad MCP/CLI (`AR-05`, `AR-11`, `AR-12`, `AR-15`, `AR-42`, `AR-45`, `AR-46`, `AR-52`).
* **AV-04:** tabla exhaustiva de agregación de 6 veredictos/4 ejes y salida CLI, rúbrica causal de testigos N0–N3, limpieza y E2E (`AR-08`, `AR-09`, `AR-10`, `AR-43`, `AR-53`).
* **AV-05:** 6 estados de celda Excel + decimal exacto, parsers/OCR, puerto UTCP/OpenAPI y cross-instancia (`AR-13`, `AR-17`, `AR-18`, `AR-20`, `AR-22`, `AR-38`, `AR-48`, `AR-50`).
* **AV-06:** fidelidad visual por motor/modo, concurrencia dinámica y hardware medido (`AR-16`, `AR-29`, `AR-36`, `AR-37`, `AR-39`, `AR-49`).
* **AV-08:** corpus ciego sellado, vetos, `DE-03`, `DE-04`/`G6.5` y `DE-05` (`AR-06`, `AR-30`, `AR-35`, `AR-44`).




* **Evidencia verificable:** `matriz-semantica.md`, `catalogo-requisitos.md`, `registro-maestro.md:64-80`, `fuentes-recuperadas/adenda-final.md`.
* **Evaluación de recomendaciones anteriores:** Codex identificó correctamente el riesgo de condensación en `auditoria-neon.md §2.3`. La resolución corrige ese riesgo eliminando el valor normativo independiente de las tablas resumen y desacoplando la consolidación documental inmediata de AV-01 de los contratos específicos de AV-02–AV-08.
* **Contrato definitivo propuesto:** Regla de autoridad jerárquica en el catálogo: `(1) D01–D21 → (2) Ficha completa del catálogo de 92 elementos con enmiendas §A.4 → (3) Contratos técnicos aprobados por AV-02–AV-08`. Las tablas resumen son estrictamente informativas.
* **Alternativas descartadas y fundamento:** Mantener AR-03 bloqueado hasta cerrar AV-08 paralizaría innecesariamente el cierre documental de AV-01; por otro lado, cerrar AR-03 sin restaurar las 9 cláusulas de §A.1 consolidaría una especificación incompleta.
* **Riesgo residual:** Posibles ajustes puntuales de redacción en criterios de aceptación al cerrarse AV-03–AV-08 (trazables por control de cambios en sus respectivos AR).
* **Experimento necesario:** No aplica para consolidación documental.
* **Criterio cuantificable de éxito:** 92/92 fichas con obligación completa, alias, ampliaciones, enmiendas §A.4 y referencias cruzadas a AV-02–AV-08; 0 obligaciones de `adenda-final.md` ausentes.
* **Alternativa viable si fracasa:** No aplica.
* **Fase que condiciona:** Cierre de AV-01 (la congelación de contratos de ejecución sigue condicionada por AV-02–AV-08).
* **Estado de diseño:** **VALIDADA PARCIALMENTE — CONSOLIDABLE EN BASE CON DEPENDENCIAS EXPLÍCITAS** *(en registro maestro: pasa de `BLOQUEANTE` a `PENDIENTE` de aplicar §A.4 y recibir contratos de AV-03–AV-08; deja de bloquear AV-01 tras aplicar §A.4)*.
* **Estado separado de validación experimental:** `N/A`.

### AR-04 · Separación de identidad de alcance, perfil opaco, variante visual y contexto regional congelado

* **Obligación normativa:** Preservar aislamiento estricto por alcance (`REQ-MEM-002.1`, D02/D05/D09/D20) y congelación regional para replay determinista (`REQ-QA-001`, D17) sin confundir identidad de particionamiento/autoridad con parámetros de ejecución/reproducción.
* **Afirmación técnica revisada:** Tanto la omisión de dimensiones regionales en `auditoria-neon.md §2.3` como la mezcla indiferenciada de todas las dimensiones dentro de una sola clave plana de aislamiento en `auditoria-antigravity.md §7` (`HA-04`) presentan defectos: meter `locale`/`timezone`/`currency` en la clave de aislamiento de autoridad fragmentaría permisos y conocimiento compartido de dominio innecesariamente, mientras omitirlos provoca colisiones de expectativas textuales, formatos numéricos y baselines visuales.
* **Evidencia verificable:** `acta-decisiones.md` (D02 L31, D05 L82-84, D17 L418-426), `catalogo-requisitos.md` (`REQ-MEM-002.1` L49-56, `REQ-QA-001` L815-823), `auditoria-neon.md §2.4.2`, `auditoria-antigravity.md HA-04`.
* **Evaluación de recomendaciones anteriores:** Se corrige a Neon por omitir `locale`/`timezone`/`currency` y se refina `HA-04` de Antigravity descomponiendo el contrato en **4 estructuras ortogonales tipadas** dentro del sobre de contexto:
* **Contrato definitivo propuesto (`ExecutionScopeEnvelope`):**
1. **`ScopeIdentity` (clave dura de aislamiento de seguridad, permisos, memoria y tenants — inmutable por el AUT):**
`{ project_id, application_id, instance_id, env_id, tenant_id, role_id, product_version, config_revision }`.
*Regla:* gobierna particionamiento de `IQapRepository`, `IPolicyEngine`, FTS, exportaciones y aislamiento cross-tenant (`A↔B = 0 fugas`).
2. **`ProfileBinding` (referencia opaca de identidad de ejecución — separada del Knowledge portable):**
`{ auth_profile_ref, credential_scope_hash }`.
*Regla:* nunca contiene secretos ni sesiones en claro; liga la sesión autenticada a `(project_id, instance_id, env_id, tenant_id, role_id)` y se excluye al exportar conocimiento.
3. **`AppVariantContext` (variante estructural/UI del AUT — versiona adaptadores y baselines visuales sin duplicar `TestCaseIdentity`):**
`{ visual_variant, viewport_profile, theme_or_layout_mode }`.
*Regla:* un cambio de `visual_variant` genera una nueva `TestCaseRevision` / adaptador UI preservando la misma `TestCaseIdentity` y expectativas de negocio.
4. **`FrozenRegionalContext` (contexto regional congelado para expectativas i18n y replay determinista — `REQ-QA-001` / D17):**
`{ ui_language, locale, timezone, currency, calendar_system? }`.
*Regla:* forma parte obligatoria del `ExecutionPlan` congelado (y de su `plan_snapshot_digest`) y se aplica como clave de discriminación únicamente en **expectativas textuales/i18n, formatos de fecha/moneda, baselines visuales y resultados de intentos**, sin fracturar el catálogo de reglas de negocio agnósticas de idioma ni los grants de seguridad de `ScopeIdentity`.


* **Alternativas descartadas y fundamento:** (a) Omitir `FrozenRegionalContext` (colisiona expectativas y montos en replay i18n); (b) incluir `locale`/`timezone`/`currency` en la clave primaria de permisos/grants (multiplicaría autorizaciones redundantes por idioma y complicaría revocación por tenant).
* **Riesgo residual:** Aplicaciones cuya lógica de negocio (p. ej. impuestos o moneda base) depende directamente de la región deben reflejarlo también en `config_revision` o `tenant_id` (acreditado por fuente).
* **Experimento necesario:** Validación contractual en G1/G2 (E2/E4): dos alcances (`tenant A` vs `tenant B`), dos perfiles (`profile_1` vs `profile_2`), dos variantes visuales y dos configuraciones regionales (`es-MX / America/Mexico_City / MXN` vs `en-US / UTC / USD`) con replay determinista y 0 colisiones.
* **Criterio cuantificable de éxito:** 0 fugas entre `ScopeIdentity` distintos; 0 colisiones de expectativas o baselines entre locales distintos en replay sin inferencia; 100 % de revocaciones sobre `ScopeIdentity` aplican independientemente del `locale` activo.
* **Alternativa viable si fracasa:** Si una app no permite fijar `timezone`/`locale` por navegador, congelar el contexto efectivo observado en el snapshot y verificar coincidencia antes de replay (`INDETERMINATE` si diverge).
* **Fase que condiciona:** Congelamiento de `@qap/contracts` en G0 (AV-01/AV-02/AV-03).
* **Estado de diseño:** **VALIDADA EN DISEÑO** *(contrato arquitectónico cerrado; no requiere implementación previa para cerrar AV-01)*.
* **Estado separado de validación experimental:** `VALIDACIÓN EXPERIMENTAL PENDIENTE` (pruebas contractuales en G1/G2, E2/E4).

### AR-55 · Validación de inventario y cardinalidades

* **Obligación normativa:** Acreditar recuento exacto sin duplicidades de los 82 IDs originales, 5 añadidos, 11 ampliaciones, 3 candidatos, 2 políticas adicionales, 92 elementos propuestos y 21 decisiones D01–D21.
* **Afirmación técnica revisada:** Confirmada al 100 % contra `fuentes-recuperadas/adenda-final.md`, `fe-erratas-neon.md` y `catalogo-requisitos.md`.
* **Evidencia verificable:** Cotejo programático sobre `adenda-final.md` (82/82), `fe-erratas-neon.md` (87/87), `catalogo-requisitos.md` y `matriz-semantica.md`.
* **Evaluación de recomendaciones anteriores:** La validación documental previa de Codex es correcta y se ratifica.
* **Contrato definitivo propuesto:** Mantener inventario de 92 elementos únicos (sin techo artificial en 87 ni en 92 si futuras actas del propietario añadieran obligaciones).
* **Alternativas descartadas y fundamento:** Reabrir discusión de 88 vs 87 (ya cerrada: `REQ-UTCP-001` queda absorbido en `REQ-DAT-001.2` e `INT-001.4`).
* **Riesgo residual:** Ninguno en cardinalidad (equivalencia semántica tratada en AR-01/AR-03).
* **Experimento necesario:** No aplica.
* **Criterio cuantificable de éxito:** 0 duplicados, 0 IDs huérfanos.
* **Alternativa viable si fracasa:** No aplica.
* **Fase que condiciona:** AV-01 (cerrada).
* **Estado de diseño:** **`VALIDADA`** (se mantiene).
* **Estado separado de validación experimental:** `N/A`.

### AR-56 · Corrección de procedencia de la clasificación histórica 60/20/7

* **Obligación normativa:** Atribuir con exactitud la procedencia histórica real de la clasificación 60/20/7 sin confundirla con la reconstrucción analítica posterior de Neon.
* **Afirmación técnica revisada:** El estado anterior (`SUSTITUIDA POR RESOLUCIÓN TRAZABLE` bajo la premisa de que la clasificación original no existía) **debe actualizarse**: la clasificación individual histórica real **fue recuperada** en `fuentes-recuperadas/fe-erratas-neon.md §1.1`, demostrando 13 diferencias frente a la reconstrucción de `auditoria-neon.md §2.3`.
* **Evidencia verificable:** `fuentes-recuperadas/fe-erratas-neon.md:16-26` vs. `auditoria-neon.md:50-143`.
* **Evaluación de recomendaciones anteriores:** La sustitución previa de Codex fue correcta mientras faltó `fe-erratas-neon.md`; con su recuperación, debe reemplazarse toda referencia a «clasificación histórica ausente» por la atribución exacta a `fe-erratas-neon.md` (distinguiéndola de la taxonomía objetivo de AR-02).
* **Contrato definitivo propuesto:** Consignar en `informe.md`, `matriz-semantica.md` y `catalogo-requisitos.md` que la clasificación 60/20/7 histórica está recuperada en `fe-erratas-neon.md`, que la reconstrucción de `auditoria-neon.md §2.3` queda archivada como antecedente superado con 13 divergencias, y que la taxonomía vigente sigue las reglas de AR-02.
* **Alternativas descartadas y fundamento:** Mantener la nota de «no recuperada» contradiría la evidencia publicada en `fuentes-recuperadas/`.
* **Riesgo residual:** Ninguno.
* **Experimento necesario:** No aplica.
* **Criterio cuantificable de éxito:** Referencias actualizadas en catálogo y matriz citando `fe-erratas-neon.md` y retirando la atribución a la reconstrucción de Neon.
* **Alternativa viable si fracasa:** No aplica.
* **Fase que condiciona:** Cierre documental de AV-01.
* **Estado de diseño:** **`VALIDADA`** (tras aplicar enmienda editorial de procedencia §A.4; sustituye la premisa obsoleta del registro previo).
* **Estado separado de validación experimental:** `N/A`.

---

## A.4 Enmiendas exactas propuestas para cerrar AV-01

| Archivo / Ubicación afectada | Texto afectado actual | Reemplazo propuesto |
| --- | --- | --- |
| `catalogo-requisitos.md:5` | «No se recuperó la clasificación final por ID. Los 7 miembros de esa clase quedan pendientes de identificación en la fuente primaria.» | «La clasificación individual histórica de los 87 IDs (60 RF, 20 RNF, 7 POL: `REQ-MEM-001.2`, `REQ-MEM-002.2`, `REQ-DOC-001.4`, `REQ-CAS-001.1`, `REQ-DAT-001.3`, `REQ-SEG-001.1`, `REQ-SEG-001.2`) fue recuperada en `cierre-av-01/fuentes-recuperadas/fe-erratas-neon.md`. La taxonomía objetivo de los 92 elementos usa clase primaria y etiquetas de cumplimiento como metadato sin cuota numérica fija (AR-02/AR-56).» |
| `catalogo-requisitos.md:51` (`REQ-MEM-002.1`) | «Vector de alcance completo `(project, app, instance, env, tenant, role, version, config_rev)` en todo el almacenamiento. D02/D05 explicitan también perfil y configuración, además de las dimensiones históricas.» | «Separación en cuatro planos de contexto (`ExecutionScopeEnvelope`, AR-04): (1) `ScopeIdentity` para aislamiento y permisos `(project_id, application_id, instance_id, env_id, tenant_id, role_id, product_version, config_revision)`; (2) `ProfileBinding` opaco `(auth_profile_ref, credential_scope_hash)` separado del Knowledge portable; (3) `AppVariantContext` `(visual_variant, viewport_profile, theme_or_layout_mode)`; (4) `FrozenRegionalContext` `(ui_language, locale, timezone, currency)` congelado en `ExecutionPlan` para expectativas i18n, baselines y replay sin fragmentar autoridad.» |
| `catalogo-requisitos.md:190` (`REQ-DIS-001.5`) | «Matriz diferencial de visibilidad por rol, tenant y configuración efectiva.» | «Matriz diferencial de visibilidad por rol, tenant y configuración efectiva; toda ausencia por rol o respuesta `403` se registra como `no_visible_para_rol`, nunca como `inexistente`.» |
| `catalogo-requisitos.md:248` (`REQ-DOC-001.3`) | «Motor de reconciliación bidireccional documento ↔ observación con los 4 estados exactos.» | «Motor de reconciliación bidireccional documento ↔ observación con los 4 estados exactos (`coincidente`, `documentado_no_observado`, `observado_no_documentado`, `contradiccion_real`); ningún elemento `documentado_no_observado` se marca automáticamente como eliminado.» |
| `catalogo-requisitos.md:413` (`REQ-CAS-001.4`) | «Evaluador de aplicabilidad condicional sobre casos por `(env, tenant, role, config)`.» | «Evaluador de aplicabilidad condicional (`applicable`/`not_applicable`/`indeterminate`) por `(env, tenant, role, config)` y abstención honesta: todo escenario cuya expectativa de negocio carezca de fuente acreditada queda en `INDETERMINATE` y no se habilita para emitir `PASS` funcional.» |
| `catalogo-requisitos.md:538` (`REQ-RUN-001.5`) | «Cancelación activa (`AbortController`) cableada a revocación + pool acotado de workers paralelos aislados.» | «Cancelación activa (`AbortController`) cableada a revocación + pool acotado de workers paralelos aislados, con soporte para alternar entre 3–4+ aplicaciones sin mantener navegadores abiertos en reposo y liberación verificable de procesos, locks y memoria al concluir cada tarea (`RNF-02`).» |
| `catalogo-requisitos.md:569` (`REQ-DAT-001.2`) | «Ejecutor de `DataPlan` con creación topológica y limpieza inversa idempotente. Incorporar descripción y ejecución autorizada de operaciones mediante UTCP/OpenAPI por el mismo puerto.» | «Ejecutor de `DataPlan` con creación topológica y limpieza inversa idempotente que afecta **únicamente** entidades creadas por el dataset de esa ejecución (repetir limpieza 2 veces no falla ni altera registros ajenos). Incorporar descripción y ejecución autorizada de operaciones mediante UTCP/OpenAPI por el mismo puerto.» |
| `catalogo-requisitos.md:667` (`REQ-REP-001.3`) | «Subsistema `DefectManager` con taxonomía D-014 (`indeterminate`), deduplicación por firma y paquete reproducible.» | «Subsistema `DefectManager` con taxonomía D-014 (`product_bug`, `environment_error`, `automation_error`, `data_error`, `auth_expired`, `flaky`, `indeterminate`), prohibición de clasificar `HTTP 500` ciegamente como `product_bug`, deduplicación por firma y paquete reproducible.» |
| `catalogo-requisitos.md:720` (`REQ-SEG-001.1`) | «Motor único de políticas deny-by-default aplicado a MCP, CLI y servidores auxiliares. D07 permite lecturas de producción solo con acreditación y extiende denegación por defecto a visor y conectores.» | «Motor único de políticas deny-by-default aplicado a MCP, CLI, visor y conectores con separación de 8 capacidades autorizables (workspace, orígenes, perfiles, lectura documental, pruebas read-only, escritura/mutación, datos sintéticos/limpieza, borrado de recursos QAP) más los 4 permisos multimedia de D18. Invariante D-002: QAP nunca modifica código fuente ni infraestructura productiva del AUT. D07 restringe producción a lectura acreditada.» |
| `catalogo-requisitos.md:738` (`REQ-SEG-001.3`) | «Bus de eventos de revocación conectado a `AbortController` de Discovery y Runner activos.» | «Bus durable de revocación conectado a `AbortController` de Discovery y Runner activos; revocar en un proyecto, entorno o tenant bloquea nuevas llamadas, cancela operaciones en vuelo de ese alcance y **nunca afecta otros proyectos o tenants**.» |
| `catalogo-requisitos.md:889` (`CAND-RUN-001` → `REQ-RUN-002.1`) | «Preferencias de ejecución y fidelidad del AUT» | «Promovido a `REQ-RUN-002.1` con dos cláusulas independientes: `1a` (preferencias conversacionales persistidas por proyecto: visible/segundo plano, navegador, grabación autorizada, perfil de consumo) y `1b` (invariante obligatorio no desactivable de fidelidad visual/recursos autorizados CSS/JS/imágenes/fuentes/hidratación SPA con `resource_degradation_event`).» |

---

## A.5 Dictamen independiente de AV-01

**DICTAMEN AV-01: `VALIDABLE PARA CIERRE DOCUMENTAL INMEDIATO TRAS APLICAR LAS ENMIENDAS EXACTAS DE §A.4**`

* Con las cinco fuentes históricas recuperadas (`fuentes-recuperadas/`), el cotejo diferencial elimina la incertidumbre de `AR-01`, restituye la clasificación histórica real en `AR-56`, fija la taxonomía sin cuotas forzadas en `AR-02`, cierra el contrato arquitectónico de `ExecutionScopeEnvelope` en `AR-04`, ratifica el inventario en `AR-55` y acota `AR-03` separando lo consolidable inmediatamente de los contratos técnicos de AV-02–AV-08.
* No se exige implementación previa para dar por cerrados los contratos de AV-01.

# INFORME B — AUDITORÍA ESPECÍFICA AV-02 (SEGURIDAD, PRIVACIDAD Y AUTENTICIDAD)

Alcance estricto: 10 registros asignados (`AR-07`, `AR-14`, `AR-24`, `AR-25`, `AR-27`, `AR-28`, `AR-31`, `AR-32`, `AR-40`, `AR-47`), contrastados directamente contra el código real de `develop` (`cf024ca4602b134db9ef71b980d5943dcca285e0`), antecedentes archivados (`AS-01`–`AS-04`, `H-REV-01`–`H-REV-06`) y documentación oficial vigente.

## B.1 Síntesis técnica por dominio (Secciones A–F)

### A. Secretos y sesiones (`AR-07`, `AR-47`)

**Evidencia verificada en `develop`:**

* `packages/mcp/src/host-composition.ts:390` habilita `silentBoundScope: true` por defecto, activando `allowScopedCredentials` en `packages/mcp/src/server.ts:744-756`, que expone los campos `password` (`qap_auth_add`) y `credentials.password` (`qap_start`) directamente en el esquema MCP.
* `packages/auth/package.json:22` y `packages/cli/package.json:44` declaran `"keytar": "^7.9.0"`, resuelto en `pnpm-lock.yaml:2065` e importado dinámicamente en `packages/auth/src/providers.ts:30`. [`github/node-keytar`](https://github.com/github/node-keytar) está oficialmente archivado y deprecado. Además, `providers.ts:57` rechaza cualquier credencial que incluya `token` o `username`.
* `packages/auth/src/local-secret-prompt.ts:72` falla con `DIALOG_DESKTOP_UNAVAILABLE` fuera de `win32` (WPF/PowerShell exclusivo de Windows).
* `packages/auth/src/session-store.ts:10,33-36` usa un `processSessionKey = randomBytes(32)` efímero si falta `QAP_SESSION_KEY` (las sesiones cifradas en disco se vuelven ilegibles tras reiniciar el proceso), solo indexa por `profileId` (sin `tenant_id`, `env`, `instance_id` ni `role` en clave/AAD), y `isExpired` (`:93-101`) solo revisa `cookie.expires`.
* `packages/auth/src/secure-files.ts:23,42` valida permisos POSIX (`0700`/`0600`, `O_NOFOLLOW`, `nlink === 1`), pero en Windows (`win32`) omite comprobación de permisos de archivo y no impone DACL/SID.
* `packages/playwright-runner/src/runner.ts:335-342` falla cerrado si se pasó `options.profile`, pero si la resolución fue implícita (`prereqs.requires.auth.primary` en `session-resolver.ts:19`), captura el error en `runner.ts:338` con un mero `console.warn` y **continúa ejecutando como anónimo**.

**Evaluación crítica de `@napi-rs/keyring` y alternativas (sin convertirlo en dependencia definitiva sin acreditar sus límites):**

1. **Fallback silencioso a memoria en Linux:** según la [documentación oficial de `@napi-rs/keyring](https://npmjs.com/package/@napi-rs/keyring)`, en Linux selecciona `secret-service` (GNOME Keyring / KWallet / KeePassXC) y, si no hay sesión D-Bus activa (headless, SSH, contenedores, CI), **cae silenciosamente a `keyutils` en memoria del kernel**, perdiendo los secretos al reiniciar. Solo fijando explícitamente `{ linux: { store: 'secret-service' } }` falla cerrado sin fallback silencioso.
2. **Limitación de licencia en binarios Linux:** según el [README oficial de `@napi-rs/keyring](https://npmjs.com/package/@napi-rs/keyring)`, los binarios precompilados de Linux enlazan estáticamente `libdbus` (`libdbus-sys`), licenciado bajo **`AFL-2.1 OR GPL-2.0-or-later`** (incompatible con redistribución estática despreocupada bajo licencia `ISC` sin análisis legal/SBOM en AV-07).
3. **Límite de tamaño en Windows Credential Manager (`CRED_MAX_CREDENTIAL_BLOB_SIZE` = 2560 bytes):** `CredWriteW` impone un tope duro de **2560 bytes** (~1280 caracteres UTF-16LE, ver [análisis en `jaraco/keyring#540](https://github.com/jaraco/keyring/issues/540)` y [fallo real de tokens OIDC >1280 chars](https://github.com/aws-solutions-library-samples/guidance-for-claude-code-with-amazon-bedrock/issues/427)). Por tanto, **ningún keyring nativo debe almacenar `storageState` ni tokens JWT/SAML extensos directamente**.
4. **Arquitectura recomendada (patrón KEK-en-keyring + bóveda cifrada local, igual que [Cloudflare Wrangler `--use-keyring](https://developers.cloudflare.com/workers/wrangler/commands/general/)` y Electron `safeStorage`):**
* El backend nativo del SO guarda **únicamente una KEK de 32 bytes** (64 hex chars, siempre muy por debajo de 2560 bytes), mientras los secretos y sesiones viven en `PortableCredentialVault` (`packages/auth/src/portable-vault.ts`, ya implementado con AES-256-GCM + `scrypt`) y `SessionStore` endurecido con clave compuesta `(project_id, instance_id, env_id, tenant_id, profile_id, role_id)` en el AAD.
* **Alternativas de proveedor KEK detrás de `IKekProvider` (sin atarse a `@napi-rs/keyring`):** (a) adaptador nativo por SO usando utilidades del sistema o binding auditado (`macOS` Keychain vía `/usr/bin/security` o API nativa; `Linux` Secret Service vía `secret-tool` / `libsecret` sin enlace estático GPL; `Windows` DPAPI `ProtectedData`/Credential Manager vía helper nativo o `@napi-rs/keyring` únicamente en Windows/macOS); (b) en **CI sin TTY**, KEK inyectada por descriptor de archivo (`--kek-fd`), archivo temporal con permisos `0600`/SID o secreto efímero del runner CI (`QAP_VAULT_KEK` leída una vez y borrada del entorno de procesos hijos), sin depender jamás de keyring gráfico ni caer a texto plano.
* **Captura fuera de banda multiplataforma:** (1) TTY interactivo sin eco (`qap auth add`); (2) formulario loopback efímero `127.0.0.1` (puerto aleatorio, token de un solo uso, validación estricta de `Origin`/`Host`, `Cache-Control: no-store`, TTL 120 s) cuando no haya TTY (reemplaza el diálogo WPF solo-Windows); (3) aprovisionamiento por secreto/descriptor en CI sin TTY.



### B. Captura multimedia privada (`AR-27`)

**Separación estricta de las 6 categorías (ninguna sustituye a la anterior):**

1. **Prevención de captura (*pre-paint exclusion*):** impedir que bytes sensibles se rendericen o lleguen al codificador/disco. Solo alcanzable en dos casos reales: (a) **`AuthAcquisitionContext` sin grabación ni trace** para login, MFA y SSO; (b) exclusión determinista *pre-paint* acreditada con canarios sintéticos en superficies cooperativas del mismo documento. Chromium/CDP **no** ofrece prevención universal (ni cubre OOPIF/Shadow DOM ni transiciones SPA sin red como `AS-04`, ni Firefox/WebKit donde CDP no existe y [`page.screencast`](https://playwright.dev/docs/api/class-screencast) tiene techo de 25 fps).
2. **Contención criptográfica:** bajo `PRIVATE_AUTHORIZED`, proteger confidencialidad desde la primera escritura mediante cifrado autenticado en flujo (*Chunked AEAD*) + ACL estricta (`0700`/SID) + exclusión de exportaciones por defecto. No evita capturar el dato; contiene su exposición en reposo.
3. **Detección posterior:** observadores DOM/URL/red o heurísticas post-render. Solo sirven como freno de daño; si saltan en `VERIFIED_STRICT`, abortan promoción y transicionan a `MANDATORY_SUPPRESSION`.
4. **Supresión (`MANDATORY_SUPPRESSION`):** política *fail-closed* cuando faltan garantías técnicas o autorización vigente. Omite WebM, PNG y snapshots DOM de `trace.zip`, conservando veredicto y metadatos saneados.
5. **Eliminación lógica verificable:** desconexión del catálogo, *crypto-shredding* (destrucción de la `DEK` por artefacto conforme a [NIST SP 800-88 Rev. 2](https://csrc.nist.gov/pubs/sp/800/88/r2/final), donde el borrado físico por sobrescritura en SSD es ineficaz por *wear-leveling*), `unlink` de archivos cifrados y registro `prune_event`.
6. **Riesgo residual declarado:** RAM del navegador/códec, swap/pagefile, snapshots APFS/VSS/ZFS, volcados de crash del SO, backups externos y copias ya exportadas.

**Alternativas viables para entregar videos reales en aplicaciones empresariales (sin suprimir toda captura):**

1. **Separación de contexto de autenticación (`AuthAcquisitionContext`):** toda fase login/MFA/SSO corre sin grabación ni trace; al completarse, la sesión cifrada pasa al contexto de prueba donde sí se graba el flujo de negocio autorizado.
2. **Flujo `onFrame` en memoria → muxer WebM en pipe → escritor Chunked AEAD:** usar [`page.screencast.start({ onFrame })`](https://playwright.dev/docs/api/class-screencast) (Playwright ≥1.59) canalizando frames en memoria hacia FFmpeg por `stdin`/`stdout` (`pipe:0` → `pipe:1` WebM) y cifrando cada bloque de 64 KiB antes de tocar disco. Elimina el archivo `.webm` temporal sin cifrar de `recordVideo`.
3. **Captura selectiva por superficie y modo:** `PRIVATE_AUTHORIZED` en QA empresarial autorizado (p. ej. casos críticos o *retain-on-failure* con videos reales cifrados), `VERIFIED_STRICT` en módulos sin datos sensibles acreditados, y `MANDATORY_SUPPRESSION` únicamente en superficies sensibles no instrumentables (OOPIF de terceros/IdP, SPA→MFA sin aislamiento, Firefox/WebKit en vista sensible).

**Auditoría técnica del contenedor *Chunked AEAD* propuesto por Antigravity:**

* **Defecto detectado en el AAD de Antigravity:** en `auditoria-antigravity.md:129`, el AAD propuesto `(artifact_id || chunk_index || is_final_flag || plain_chunk_len)` **no autentica los campos de cabecera** (`version`, `chunk_size`, `salt`, `mime`, `created_at`). **Corrección obligatoria:** calcular `header_sha256 = SHA-256(canonical_header)` e incluir `header_sha256` en el AAD de cada bloque (además de fijar `header_sha256` y `total_chunks` en la fila `COMMITTED` del catálogo SQLite).
* **Unicidad de nonces:** cada artefacto genera una `DEK` aleatoria única de 256 bits (envuelta por `KEK` del vault). Nonce determinista de 96 bits `prefix_4B || uint64_be(chunk_index)` (esquema STREAM de Rogaway/libsodium sobre AES-256-GCM, [NIST SP 800-38D](https://github.com/paritytech/web3-storage/blob/dev/docs/drafts/CLIENT_SIDE_ENCRYPTION.md)): 0 colisiones hasta $2^{32}$ bloques (~256 TiB por video) con sobrecarga de cómputo mínima (sin ejecutar HKDF por cada bloque de 64 KiB).
* **Integridad, orden y detección de truncamiento:** `chunk_index` en AAD impide reordenamiento/duplicación; `is_final_flag` en AAD + verificación contra `total_chunks` del manifiesto sellado detecta cualquier truncamiento silencioso.
* **Recuperación ante caídas:** los archivos en staging sin fila `COMMITTED` ni bloque `is_final = 1` son purgados lógicamente por `StagingReconciler` al arrancar, destruyendo su `DEK`.
* **Temporales del navegador y códec — Validación de la posición del Orquestador:** **VALIDADA CON PRECISIÓN.** Aun logrando WebM cifrado desde la primera escritura vía pipe en memoria, Chromium y Playwright siguen pudiendo escribir temporales de aplicación/navegador (perfil efímero, caché de disco/GPU, descargas del AUT, `trace.zip` staging). Por ello, **cuando existan temporales privados sin cifrar a nivel de aplicación, el almacenamiento cifrado verificable a nivel de SO (BitLocker `FullyEncrypted`, FileVault `On`, LUKS/`dm-crypt`/`fscrypt` o `tmpfs` con swap cifrado) será precondición obligatoria (`fail-closed` → `MANDATORY_SUPPRESSION` si no se verifica)**. Adicionalmente, QAP debe: deshabilitar caché de disco del navegador cuando sea compatible, rechazar carpetas sincronizadas en la nube (OneDrive/iCloud/Dropbox) para staging y aplicar ACL `0700`/SID. *Matiz honesto:* el cifrado de volumen protege en reposo y ante robo físico, no frente a procesos vivos del mismo usuario OS.
* **Revocación durante reproducción y `HTTP Range` (`206`/`416`):** con `chunk_size = 65536` (64 KiB) fijo y `plaintext_size` en catálogo, `Range: bytes=start-end` se mapea en $O(1)$ a `chunks[floor(start/65536) .. floor(end/65536)]`. Memoria activa: $O(1)$ (~128 KiB por flujo). Sobrecarga en disco: ~0.024 % (16 B de tag por 64 KiB + ~256 B de cabecera). El visor consulta `policy_generation` y permiso `access` **antes** de leer cada rango y **antes** de emitir cada bloque en stream; una revocación cierra el stream con `403` y `Cache-Control: private, no-store`.

### C. Autenticidad del ejecutor (`AR-28`)

**Resolución de la objeción sobre el mismo usuario del SO:**
La objeción del Orquestador es **plenamente fundada**: los almacenes nativos del SO (Windows DPAPI/`CredRead`, macOS Keychain, Linux Secret Service) imponen **aislamiento por principal de usuario OS, no por proceso** ([análisis de límites de aislamiento por usuario](https://gist.github.com/YoraiLevi/c47b64c30e587cd642df4b8122964d58)). Por tanto, la propuesta de Antigravity (`O-04`) de guardar `runner_signing_key` en el keyring del mismo usuario **no protege criptográficamente** frente a un agente con shell sin sandbox bajo ese mismo usuario OS.

**Frontera de confianza realista y verificable (6 niveles diferenciados):**

| Amenaza / Actor | ¿Protegido en modo local monousuario? | Mecanismo verificable en QAP |
| --- | --- | --- |
| **1. Corrupción accidental** | **Sí** | SHA-256 canónico JCS de manifiesto, `result_digest`, SQLite WAL y tags AEAD. |
| **2. Falsificación de artefactos en disco (sin clave)** | **Sí** | Firma Ed25519 / HMAC-SHA256 por el ejecutor soberano con clave fuera de `.qa/` y fuera de MCP. |
| **3. Replay de intentos previos** | **Sí** | `lease_epoch` monotónico + `attempt_id` único + `attempt_seq` + enlace a `plan_snapshot_digest`. |
| **4. Agente LLM/HOST con acceso solo al workspace / MCP** *(sin shell general ni lectura del perfil del usuario)* | **Sí** | Clave de atestación custodiada fuera del workspace (en perfil/keyring privado del ejecutor) + IPC autenticado (`0700`/SID) + rechazo en `ReportService` de cualquier intento no firmado. |
| **5. Agente con acceso general al mismo usuario del SO** *(shell sin sandbox bajo el mismo UID)* | **No garantizado criptográficamente por defecto** | En modo local monousuario, un agente con shell libre bajo el mismo UID puede leer el keyring o depurar procesos del mismo UID. **Mitigación verificable opcional:** ejecutar el ejecutor soberano bajo **cuenta de servicio OS separada** (p. ej. usuario dedicado `qap-executor` / servicio Windows con ACL exclusiva sobre la clave) o en CI remoto. |
| **6. Usuario privilegiado (`root`/Admin) o malware** | **No (fuera de frontera local)** | Declarado explícitamente fuera de frontera en modalidad local (D02); la resistencia ante administradores locales requiere ejecución remota aislada o VBS Key Guard / HSM en fase futura. |

### D. Autoridad y operaciones (`AR-14`, `AR-31`)

* **Evidencia en `develop`:** `packages/auth/src/scoped-browser.ts:7` clasifica seguridad exclusivamente por `method !== 'GET' && method !== 'HEAD'` (insuficiente frente a GET con efectos secundarios, GraphQL sobre POST/GET, WebSockets y OOPIFs; además CDP `Fetch` en `scoped-browser.ts:27` es solo Chromium y sin `Target.setAutoAttach({ flatten: true })` no cubre OOPIFs).
* **Contrato de defensa en profundidad:**
1. **Denegación por defecto y precedencia de identidad (`AR-14`):** precedencia estricta para `tenant_id` e identidad efectiva: `(1) perfil/sesión acreditada verificada en destino → (2) señal observable verificada del destino → (3) declaración explícita del operador`; ante **conflicto** entre fuentes o ausencia de tenant requerido → `BLOCKED` (las declaraciones nunca elevan autoridad ni anulan una restricción del destino).
2. **Permisos impuestos por el destino (Capa 1 no delegable):** en producción e instancias de referencia cross-instancia (`D07`/`D09`), el backend del AUT **debe** imponer cuenta/token de solo lectura. Si no puede acreditarse → `BLOCKED (unverified_target_read_only_authority)`, con alternativa única de exportación sanitizada offline.
3. **Escrituras solo en QA autorizado:** mutaciones habilitadas únicamente cuando `env_class = QA_AUTHORIZED` tiene grant vigente de escritura + estrategia de limpieza declarada (`delete`/`compensate`/`confine_tenant`).
4. **Controles más allá del método HTTP:**
* *GET con efectos secundarios:* `allowlist` positiva de operaciones de lectura acreditadas por contrato/semántica; bloqueo de rutas de acción (`/logout`, `/approve`, `/delete`, tokens one-click) aunque usen `GET`.
* *Redirecciones (`301`/`302`/`303`/`307`/`308` y meta/JS):* validación salto a salto del origen efectivo, IP canónica anti-SSRF (reutilizando `packages/playwright-adapter/src/reconnaissance/transport.ts`) y pertenencia de tenant antes de enviar la petición.
* *WebSockets / SSE:* bloqueados por defecto en modo solo-lectura (`routeWebSocket` close) salvo canal explícitamente clasificado como lectura pura.
* *Service Workers:* `serviceWorkers: 'block'` obligatorio en Discovery y testigos N2/N3 para impedir respuestas sintéticas y `Background Sync`.
* *GraphQL:* inspección semántica del documento/operación AST (permitiendo solo `query` acreditadas en modo lectura; rechazando `mutation`, `subscription` y *Persisted Queries* no clasificadas).
* *Inyección de instrucciones desde AUT y documentos no confiables:* todo texto del AUT (DOM, ARIA, respuestas HTTP, PDF/DOCX/Excel) se encapsula como `untrusted_aut_data`; el motor de políticas de `@qap/core` valida toda acción independientemente del HOST, impidiendo que datos del AUT alteren `ScopeIdentity`, amplíen permisos o invoquen herramientas privilegiadas (`REQ-SEG-001.2`), y los parsers corren en worker aislado sin red ni resolución externa.





### E. Visor local y adaptador Git (`AR-24`, `AR-40`)

**Evidencia verificada en `develop`:**

* **Visor (`packages/reporter/src/server/server.ts`):** (1) `host = options.host ?? 'localhost'` (`:54`, sin fijar `127.0.0.1`); (2) `Access-Control-Allow-Origin: *` y `Access-Control-Allow-Methods: GET, HEAD, POST, PATCH, DELETE, OPTIONS` (`:59-60`); (3) **`DELETE /api/runs/:runId` sin autenticación** (`:144-155`); (4) **doble `decodeURIComponent**` en `:71` + `:128` (`/api/runs/:runId`) y `:71` + `:227` (`/api/reports/:executionId/:format`); (5) **lectura arbitraria de archivos** por `isAbsolute(safePath) ? safePath : join(rootDir, safePath)` (`:277`); (6) `Cache-Control: public, max-age=3600` (`:315`); (7) sin MIME `video/webm` (`:27-41`) ni soporte `HTTP Range` (`206`/`416`).
* **Git (`packages/git-adapter/src/git-adapter.ts`):** `execSync(\`git diff --name-only ${this.baseBranch}`)` (`:28,33`) con interpolación de shell, y supresión silenciosa de todos los errores devolviendo `[]` (`:45-47`), lo que puede omitir silenciosamente pruebas de regresión.

**Contratos defensivos definitivos (sin implementar en esta etapa):**

* **Visor local (`AR-24`, consolida `AS-01` + `HN-07` + `HA-01`):**
1. *Bind exclusivo:* `127.0.0.1` (puerto efímero o configurado en loopback, rechazando `0.0.0.0`).
2. *Autenticación y CORS:* token de sesión local aleatorio de ≥256 bits por arranque (transmitido por cabecera `Authorization: Bearer` o cookie `HttpOnly; SameSite=Strict` tras handshake inicial); validación estricta de `Origin` y `Host` igual al origen exacto del visor (eliminando `*` y `Access-Control-Allow-Methods` mutativos).
3. *Solo lectura en visor:* **eliminar `DELETE /api/runs/:runId**` y toda operación de modificación/eliminación del servidor HTTP del visor; toda mutación/poda se delega al núcleo autenticado por IPC.
4. *Catálogo confinado:* prohibida toda resolución por ruta arbitraria o `isAbsolute`; decodificación URL única con rechazo de `..`, `%00` y separadores; todo acceso a reportes y evidencias resuelve estrictamente `artifact_id` / `execution_id` contra filas `COMMITTED` del catálogo SQLite del proyecto autorizado.
5. *Caché, revocación y medios:* `Cache-Control: private, no-store`, `X-Content-Type-Options: nosniff` y CSP estricta sin CDN; verificación de permiso `access` y `policy_generation` en cada petición y chunk; soporte `GET`/`HEAD` + `HTTP Range` (`206`/`416`) con `video/webm` (descifrado *Chunked AEAD* en vuelo para `PRIVATE_AUTHORIZED`).


* **Adaptador Git (`AR-40`, consolida `AS-02`):**
1. *Cero shell:* sustituir `execSync` por `execFileSync`/`execFile` con `shell: false` y arreglo explícito de argumentos ([Node.js `child_process](https://nodejs.org/api/child_process.html)`, considerando además mitigación Windows [CVE-2024-36138](https://www.sentinelone.com/vulnerability-database/cve-2024-36138/) al invocar el binario `git` directamente, nunca scripts `.cmd`/`.bat`).
2. *Validación estricta de referencias:* rechazar cualquier ref que inicie con `-`, contenga caracteres de control/NUL o falle `git rev-parse --verify --end-of-options <ref>^{commit}` (pasando siempre el SHA resuelto y separador `--` en `git diff --name-only <sha> --`).
3. *Tratamiento explícito de errores:* prohibido devolver `[]` ante fallo de `git` o ref inválida; retornar resultado tipado `{ status: 'ok', files } | { status: 'error', code: 'INVALID_REF' | 'GIT_UNAVAILABLE' | 'NOT_A_REPO' | 'UNSAFE_DIRECTORY', message }` (contemplando [CVE-2022-24765 / `safe.directory](https://www.cve.org/CVERecord?id=CVE-2022-24765)`) para que el planificador de regresión no omita casos silenciosamente.



### F. Retención y permisos (`AR-25`, `AR-32`)

* **Separación estricta de los 4 permisos independientes (`POL-CAP-001` / D18):**

| Permiso | Alcance | Efecto de expiración | Efecto de revocación inmediata |
| --- | --- | --- | --- |
| **`capture`** | Generar nueva media privada (vigencia ≤30 días, renovable) | Detiene nuevas capturas privadas (transiciona a `VERIFIED_STRICT` o `MANDATORY_SUPPRESSION`); **no borra** media ya capturada. | Cancela grabaciones en vuelo vía `AbortController`, descarta staging no confirmado y bloquea nuevas capturas. |
| **`access`** | Descifrar y reproducir media privada en el visor local | Bloquea reproducción en visor (`403`) conservando archivos cifrados hasta fin de `retain`. | Corta streams `HTTP Range` activos en el siguiente bloque y bloquea lectura en visor. |
| **`retain`** | Conservar bytes cifrados de evidencia privada | Dispara purga lógica (*crypto-shredding* de `DEK` + borrado de archivo cifrado + `prune_event`); **prevalece sobre defectos abiertos**. | Purga lógica inmediata de la media privada afectada, conservando veredicto, resumen, hash histórico y `prune_event`. |
| **`export`** | Incluir media privada en exportación portable (**denegado por defecto**) | Impide nuevas exportaciones privadas; **no puede revocar copias ya exportadas fuera de QAP**. | Impide exportaciones en curso/futuras; copias externas previas quedan bajo riesgo residual declarado y bitácora inmutable de auditoría. |

* **Preservación de decisiones ratificadas vs. pendientes (`DE-01`, `DE-02` NO aprobadas):**
* *Ratificado (D19, inmutable):* historial resumido permanente hasta eliminación expresa; detalle de ejecuciones 90 días; exportación manual (`HTML`, `CSV`, `JSON/JSONL` + manifiesto); archivo automático opcional; Knowledge canónico vigente y casos activos sin caducidad automática.
* *Pendiente de ratificación (`DE-01` — sigue abierta):* TTL operativos propuestos (multimedia exitosa ≤24 h, trazas exitosas ≤72 h, fallos ≥14 días), cuotas máximas por proyecto, umbrales de disco lleno (alerta 80 %, protección SQLite WAL al 95 % / reserva mínima con degradación *fail-closed* solo de nueva media pesada).
* *Pendiente de ratificación (`DE-02` — sigue abierta):* ámbitos autorizados para `PRIVATE_AUTHORIZED`, política de exportación privada excepcional, precondición de almacenamiento cifrado verificable y aceptación formal del riesgo residual (SSD, respaldos/snapshots del SO y copias exportadas).



---

## B.2 Análisis individual de los 10 registros de AV-02

*(Formato normativo de §5 Criterios de cierre para cada AR.)*

### AR-07 · Secretos fuera de MCP/chat, bóveda multiplataforma y CI sin TTY

* **Obligación normativa:** `REQ-SEG-002.1`, `REQ-MEM-002.5`, `REQ-INT-001.2` (D14, D20): cero credenciales en MCP/chat/prompts, bóveda persistente multiplataforma, alta fuera de banda y operación en CI sin TTY.
* **Afirmación técnica revisada:** `keytar` sigue activo en `develop` (`providers.ts:30`, `package.json`, `pnpm-lock.yaml`) y debe retirarse; `silentBoundScope: true` expone contraseñas en MCP (`host-composition.ts:390`, `server.ts:744-756`); `local-secret-prompt.ts:72` es solo `win32`; `@napi-rs/keyring` tiene fallback silencioso a memoria en Linux, enlace estático `libdbus` (`AFL-2.1/GPL-2.0-or-later`) y Windows Credential Manager limita entradas a 2560 bytes.
* **Evidencia verificable:** `packages/auth/src/providers.ts:30,57`, `packages/auth/src/local-secret-prompt.ts:72`, `packages/auth/src/portable-vault.ts`, `packages/auth/src/secure-files.ts:23,42`, `packages/mcp/src/host-composition.ts:390`, `packages/mcp/src/server.ts:744-756`, [`github/node-keytar`](https://github.com/github/node-keytar), [`@napi-rs/keyring`](https://npmjs.com/package/@napi-rs/keyring), [`CRED_MAX_CREDENTIAL_BLOB_SIZE`](https://github.com/jaraco/keyring/issues/540).
* **Evaluación de recomendaciones anteriores:** Neon subestimó la presencia real de `keytar` y propuso `@napi-rs/keyring` sin acreditar su licencia Linux ni el tope de 2560 B en Windows; Antigravity corrigió la presencia de `keytar` pero tampoco documentó la licencia `libdbus` ni el tope de 2560 B.
* **Contrato definitivo propuesto:** Retirar `keytar` y `allowScopedCredentials`/`silentBoundScope` permisivo; usar `ISecretVault` = `PortableCredentialVault` (AES-256-GCM) + `IKekProvider` de 32 bytes (keyring persistente del SO sin fallback a memoria en escritorio; KEK vía FD/archivo `0600`/secret CI en headless); captura fuera de banda por TTY sin eco + loopback efímero `127.0.0.1` + CI; añadir DACL/SID real en Windows a `secure-files.ts`.
* **Alternativas descartadas y fundamento:** (a) Guardar `storageState`/tokens directo en keyring nativo (falla en Windows >2560 B); (b) adoptar `@napi-rs/keyring` sin evaluar `libdbus` GPL/AFL en Linux; (c) mantener bypass `allowScopedCredentials` (viola D20).
* **Riesgo residual:** Aislamiento de keyring OS es por usuario, no por proceso; en CI la protección depende del gestor de secretos del runner.
* **Experimento necesario:** **EXP-07 (nuevo en G0/G1, parte de E2):** matriz de persistencia, reinicio, ACL (`0700`/SID), CI sin TTY y licencia/compatibilidad de `IKekProvider` en Windows, macOS y Linux (con y sin D-Bus).
* **Criterio cuantificable de éxito:** 0 credenciales en MCP/chat/logs/artefactos; 100 % persistencia tras reinicio en los 3 SO con backend persistente y 100 % fallo cerrado (`UNAVAILABLE`) sin fallback silencioso a memoria; 100 % éxito en CI Linux headless sin TTY; 0 dependencias GPL no resueltas.
* **Alternativa viable si el experimento fracasa:** Adaptadores de KEK vía utilidades nativas del SO (`security` en macOS, `secret-tool` en Linux, DPAPI PowerShell/C# o addon Win32 puro en Windows) + `PortableCredentialVault` con KEK por archivo/FD en CI.
* **Fase que condiciona:** Selección de bóveda en G0/G1 (E2).
* **Estado de diseño:** **DISEÑO CERRADO (PENDIENTE DE VALIDACIÓN EXPERIMENTAL)** *(registro maestro: `VALIDACIÓN EXPERIMENTAL PENDIENTE`, sale de `BLOQUEANTE` al existir alternativa viable acreditada)*.
* **Estado separado de validación experimental:** `VALIDACIÓN EXPERIMENTAL PENDIENTE` (EXP-07 / E2 en G0–G1).

### AR-14 · Identidad efectiva, precedencia de alcance y bloqueo ante conflicto de tenant

* **Obligación normativa:** `REQ-MEM-002.1–002.2`, `REQ-SEG-001.1–001.2`, `REQ-XINST-001` (D02, D05, D07, D09, D20).
* **Afirmación técnica revisada:** Las declaraciones del operador o prompts nunca elevan autoridad; el tenant y la identidad efectiva deben acreditarse por precedencia estricta y bloquearse ante ambigüedad o conflicto en MCP y CLI por igual.
* **Evidencia verificable:** `packages/mcp/src/workspace-context-manager.ts:706-718`, `packages/mcp/src/handlers/discovery.handler.ts:232-239`, `packages/auth/src/session-store.ts:39-48` (omite `tenant_id` en clave/AAD), `docs/qap-architecture/cuestiones-abiertas.md` (`DP-09`).
* **Evaluación de recomendaciones anteriores:** Precedencia de Neon (`DP-09`) es consistente, pero debe reforzarse con `O-09` de Antigravity: cualquier discrepancia entre el `tenant_id` del `ScopeIdentity` y la respuesta/redirección del destino dispara aborto inmediato.
* **Contrato definitivo propuesto:** Precedencia fija: `(1) perfil/sesión acreditada verificada en destino → (2) señal observable verificada del destino → (3) declaración explícita del operador` (esta última solo restringe o desambigua, jamás eleva privilegio). Si dos fuentes discrepan o falta tenant requerido → `BLOCKED (scope_conflict_or_missing_tenant)` idéntico en MCP y CLI. Incluir `(project_id, instance_id, env_id, tenant_id, role_id)` en clave y AAD de `SessionStore`.
* **Alternativas descartadas y fundamento:** Inferir tenant por nombre de carpeta o usar valor por defecto silencioso (prohibido por D-019 / `REQ-MEM-002.2`).
* **Riesgo residual:** Si un AUT no expone ningún indicador de tenant en API/UI, la verificación de correspondencia en runtime depende de la declaración del perfil y la separación de cuentas en destino.
* **Experimento necesario:** Pruebas contractuales en G1/G2 (E2/E4): ambigüedad, conflicto de tenant, redirección cross-tenant y paridad MCP/CLI.
* **Criterio cuantificable de éxito:** 100 % bloqueo en casos de ambigüedad/conflicto/redirección cross-tenant; 0 fugas `A↔B`; 100 % paridad MCP/CLI.
* **Alternativa viable si el experimento fracasa:** Exigir declaración explícita vinculada a origen único cuando el AUT no exponga metadatos de tenant observables.
* **Fase que condiciona:** Contrato de alcance previo a G1 (E2).
* **Estado de diseño:** **DISEÑO CERRADO** *(registro maestro: `PENDIENTE` de pruebas contractuales en G1)*.
* **Estado separado de validación experimental:** `VALIDACIÓN EXPERIMENTAL PENDIENTE` (E2 en G1).

### AR-24 · Contrato integral de seguridad del visor local

* **Obligación normativa:** `REQ-SEG-001.1`, `REQ-REP-001.1`, `REQ-SEG-002.3` (D18, D20; `AS-01`, `H-REV-01`, `HN-07`, `HA-01`).
* **Afirmación técnica revisada:** Se confirman directamente en `develop` todas las vulnerabilidades de `AS-01`, `HN-07` y `HA-01` (`server.ts:54,59-61,71,128,144-155,227,277,315`): lectura arbitraria por `isAbsolute`, `CORS *`, `DELETE /api/runs/:runId` sin auth, doble `decodeURIComponent`, `Cache-Control: public` y ausencia de `video/webm` + `HTTP Range`.
* **Evidencia verificable:** `packages/reporter/src/server/server.ts:27-45,54,59-61,71,128,144-155,227,277,315`.
* **Evaluación de recomendaciones anteriores:** Neon (`HN-07`, `§6.F`) omitió `DELETE /api/runs/:runId` y la doble decodificación; Antigravity (`HA-01`) completó correctamente el diagnóstico defensivo. Ambos coinciden en confinar por catálogo y retirar `Cache-Control: public`.
* **Contrato definitivo propuesto:** Definido íntegramente en §B.1.E (bind `127.0.0.1`, token local ≥256 bits, `Origin`/`Host` estricto sin `*`, visor 100 % solo lectura eliminando `DELETE`, resolución única por `artifact_id`/`execution_id` contra catálogo SQLite `COMMITTED`, decodificación URL única, `Cache-Control: private, no-store`, verificación de revocación por chunk y `HTTP Range` `206`/`416` para `video/webm`).
* **Alternativas descartadas y fundamento:** Parchear solo `isAbsolute` manteniendo `CORS *` o `DELETE` (deja abierta exfiltración y borrado cross-origin desde pestañas del navegador).
* **Riesgo residual:** Procesos locales del mismo usuario OS que accedan al puerto loopback con el token en memoria del navegador (acotado por el modelo de amenazas local de AR-28).
* **Experimento necesario:** Suite de regresión defensiva en G0/G1 (E2/E6): pruebas negativas de traversal simple/doble codificado, rutas absolutas, peticiones cross-origin, intento de `DELETE`, verificación de `Cache-Control: private, no-store`, revocación durante reproducción y `Range 206/416`.
* **Criterio cuantificable de éxito:** 100 % rechazo (`401`/`403`/`404`/`405`) en todos los vectores negativos; 100 % reproducción autorizada WebM con seek `206`/`416` y corte inmediato tras revocación.
* **Alternativa viable si el experimento fracasa:** Ninguna rebaja aceptable; el visor permanece deshabilitado hasta pasar 100 % de controles defensivos en G0.
* **Fase que condiciona:** Remediación obligatoria en G0 (no bloquea planificación del WBS, sí cierra G0 antes de G1).
* **Estado de diseño:** **DISEÑO CERRADO (REMEDIACIÓN OBLIGATORIA G0)** *(registro maestro: `BLOQUEANTE` para cierre de G0 / apertura de G1; no impide planificar)*.
* **Estado separado de validación experimental:** `VALIDACIÓN EXPERIMENTAL PENDIENTE` (pruebas defensivas en G0/E6).

### AR-25 · Precedencia de revocación privada, retención, cuotas y disco lleno

* **Obligación normativa:** `REQ-MEM-003.5`, `REQ-REP-001.1–001.4`, `POL-CAP-001`, `POL-RET-001` (D18, D19).
* **Afirmación técnica revisada:** La revocación o expiración de `retain` privado prevalece absolutamente sobre la retención por defecto abierto (`HN-08`). La poda nunca altera veredictos históricos ni borra Knowledge vigente. `qap_prune` en `develop` (`packages/mcp/src/server.ts:4303-4350`) es incompatible (`dryRun` ficticio y fuga de handle). **`DE-01` permanece pendiente de ratificación del propietario.**
* **Evidencia verificable:** `acta-decisiones.md:474-510`, `packages/mcp/src/server.ts:4303-4350`, `packages/mcp/src/handlers/report.handler.ts:175-190`.
* **Evaluación de recomendaciones anteriores:** Coincidencia técnica entre Neon (`HN-08`, `§6.G`) y Antigravity (`O-10`) en precedencia privada y protección de disco; se mantiene estrictamente abierta la ratificación de TTL y cuotas (`DE-01`).
* **Contrato definitivo propuesto:** Motor único de poda MCP/CLI con `dryRun` real, cierre determinista de handles, orden de poda estricto (staging huérfano → media privada revocada/expirada → media exitosa → trazas exitosas → fallos resueltos), protección de ejecuciones activas/publicaciones pendientes, reserva mínima de disco (degradación *fail-closed* solo de nueva media pesada al 95 % para proteger SQLite WAL), y preservación de veredicto + hash histórico + `prune_event` (`EXPIRED_PRUNED`) sin exigir `trace.zip` físico.
* **Alternativas descartadas y fundamento:** Permitir que un defecto abierto retenga media privada revocada (viola D18); corromper SQLite o alterar veredictos al podar (viola D19).
* **Riesgo residual:** Backups/snapshots externos del SO y copias previamente exportadas quedan fuera del alcance técnico de poda.
* **Experimento necesario:** Pruebas de ciclo de vida en G1/G3 (E2/E5): expiración, revocación sobre defecto abierto, simulación de disco lleno/cuota 80 %–95 %, `dryRun` no mutativo y apertura de reportes históricos sin `trace.zip`.
* **Criterio cuantificable de éxito:** 100 % purga lógica de media privada revocada incluso con defecto abierto; 0 mutaciones en `dryRun`; 0 corrupción SQLite ante disco lleno; 100 % veredictos preservados.
* **Alternativa viable si el experimento fracasa:** Bloquear nuevas ejecuciones con captura multimedia cuando falte cuota hasta liberación explícita del operador.
* **Fase que condiciona:** Cierre de contrato de custodia en G0 (requiere acta `DE-01` del propietario).
* **Estado de diseño:** **DISEÑO CERRADO — PENDIENTE RATIFICACIÓN EMPRESARIAL (`DE-01`)** *(registro maestro: `PENDIENTE`)*.
* **Estado separado de validación experimental:** `VALIDACIÓN EXPERIMENTAL PENDIENTE` (E2/E5 en G1/G3).

### AR-27 · Captura multimedia privada, Chunked AEAD, temporales y precondición de cifrado

* **Obligación normativa:** `REQ-SEG-002.3`, `POL-CAP-001`, `REQ-RUN-001.6`, `REQ-REP-001.1` (D18, D20; `AS-04`, `H-REV-04`).
* **Afirmación técnica revisada:** Se valida la arquitectura de 6 capas (§B.1.B), la corrección al AAD del contenedor *Chunked AEAD* (añadiendo `header_sha256` y nonce determinista STREAM), la captura en memoria `onFrame` → FFmpeg pipe → AEAD para eliminar WebM sin cifrar en disco, y **se valida la posición del Orquestador**: mientras existan temporales privados sin cifrar a nivel de aplicación (perfil navegador, descargas, `trace.zip`), **el almacenamiento cifrado verificable del SO es precondición obligatoria** (`fail-closed` → `MANDATORY_SUPPRESSION`).
* **Evidencia verificable:** `docs/qap-architecture/evidencia-archivada.md:25-30` (`AS-04`), `packages/playwright-runner/src/runner.ts:460-461,994`, [`Playwright Screencast API`](https://playwright.dev/docs/api/class-screencast), [NIST SP 800-88 Rev. 2](https://csrc.nist.gov/pubs/sp/800/88/r2/final), [Chromium OOPIF CDP issue #526411580](https://issues.chromium.org/issues/526411580).
* **Evaluación de recomendaciones anteriores:** Neon mezcló detección posterior con prevención; Antigravity propuso correctamente *Chunked AEAD* y `AuthAcquisitionContext`, pero omitió autenticar la cabecera en el AAD y dejó el cifrado de volumen como opcional/recomendado. Se incorpora la corrección de AAD y la precondición dura del Orquestador.
* **Contrato definitivo propuesto:** (1) `AuthAcquisitionContext` sin grabación ni trace para login/MFA/SSO; (2) `PRIVATE_AUTHORIZED` con `onFrame` → pipe WebM en memoria → *Chunked AEAD* (64 KiB, `DEK` por artefacto, AAD con `header_sha256 || artifact_id || chunk_index || is_final || plain_len`); (3) verificación obligatoria de volumen cifrado del SO + ACL `0700`/SID + exclusión de carpetas cloud-sync mientras existan temporales de navegador/trace; (4) `StagingReconciler` ante caídas; (5) `MANDATORY_SUPPRESSION` *fail-closed* en Firefox/WebKit, OOPIF/popups no instrumentables o falla de precondición.
* **Alternativas descartadas y fundamento:** (a) Suprimir permanentemente toda captura (incumple exigencia del propietario de videos reales empresariales); (b) confiar en `recordVideo` + cifrado post-cierre sin FDE verificada (viola D18); (c) certificar Chromium solo por disponer de CDP (falso ante `AS-04` SPA→MFA y OOPIF).
* **Riesgo residual:** RAM del proceso navegador/códec, swap/pagefile, snapshots/backups del SO y procesos del mismo usuario OS.
* **Experimento necesario:** **EXP-06a (G0/inicio G1)** y **EXP-06c (G3/G5)**: validar pipe `onFrame` → FFmpeg → *Chunked AEAD* sin archivo WebM plano en disco, canarios de primer cuadro en SPA→MFA/OOPIF/popup, verificación automática de BitLocker/FileVault/LUKS, cortes abruptos y reproducción `HTTP Range 206/416` con revocación en vuelo.
* **Criterio cuantificable de éxito:** 0 bytes de WebM en claro escritos a disco en ruta `onFrame`→pipe; 0 canarios visibles en WebM/PNG/traza bajo `VERIFIED_STRICT` (o transición 100 % a `MANDATORY_SUPPRESSION`); 100 % detección de truncamiento/reordenamiento en *Chunked AEAD*; 100 % purga de staging tras `SIGKILL`; <15 % overhead de CPU/RAM aceptable en reproducción `Range`.
* **Alternativa viable si el experimento fracasa:** Si `onFrame`→FFmpeg pipe supera el presupuesto de CPU/latencia, usar staging WebM sobre `tmpfs`/RAM-disk o volumen cifrado verificado con ingesta inmediata a *Chunked AEAD* y *crypto-shredding*, manteniendo `PRIVATE_AUTHORIZED` condicionado a FDE verificada (y `MANDATORY_SUPPRESSION` donde falte FDE).
* **Fase que condiciona:** Contrato temprano G0/G1; habilitación de `PRIVATE_AUTHORIZED` en G3/G5 (junto con `DE-02`).
* **Estado de diseño:** **DISEÑO CERRADO (CONDICIONADO A `EXP-06a` Y `DE-02`)** *(registro maestro: `VALIDACIÓN EXPERIMENTAL PENDIENTE`; deja de ser `BLOQUEANTE` para planificar al existir arquitectura y alternativa viable fundamentada, pero `PRIVATE_AUTHORIZED` sigue bloqueado para activación hasta superar `EXP-06a/c` y `DE-02`)*.
* **Estado separado de validación experimental:** `VALIDACIÓN EXPERIMENTAL PENDIENTE` (`EXP-06a` en G0/G1, `EXP-06c` en G3/G5).

### AR-28 · Autenticidad del ejecutor y frontera realista de amenazas

* **Obligación normativa:** `REQ-IA-001.5`, `REQ-RUN-001.2`, `REQ-REP-001.1` (D12, D13, D20).
* **Afirmación técnica revisada:** SHA-256 solo prueba integridad, pero una firma/MAC cuya clave vive en el keyring del mismo usuario OS **tampoco** garantiza resistencia criptográfica frente a un agente con shell general bajo ese mismo usuario. El contrato debe distinguir los 6 niveles de amenaza de §B.1.C sin prometer aislamiento inexistente.
* **Evidencia verificable:** `packages/mcp/src/handlers/report.handler.ts:175-190`, `packages/cli/src/commands/report.ts:93-183`, `packages/mcp/tsup.config.ts:72-104`, [límites de aislamiento por usuario en OS keyrings](https://gist.github.com/YoraiLevi/c47b64c30e587cd642df4b8122964d58).
* **Evaluación de recomendaciones anteriores:** Neon (`§2.3`) dejó solo SHA-256 (insuficiente ante falsificación/replay); Antigravity (`O-04`) aportó el sobre `AttemptAttestation` y protección anti-replay, pero sobreprometió resistencia frente a scripts ad-hoc del mismo usuario sin separación de cuenta OS.
* **Contrato definitivo propuesto:** (1) `AttemptAttestation` firmado con Ed25519/HMAC-SHA256 sobre payload canónico (`executor_instance_id`, `build_fingerprint`, `lease_epoch`, `plan_snapshot_digest`, `attempt_id`, `attempt_seq`, `result_digest`, `evidence_manifest_digest`) + digest SHA-256 complementario; (2) clave de atestación fuera de `.qa/` y fuera de MCP, con verificación obligatoria en MCP y CLI; (3) declaración explícita de la frontera de 6 niveles (§B.1.C): en modo local monousuario protege contra corrupción, replay y agentes confinados al workspace/MCP; para resistencia frente a agentes con shell arbitrario local, ofrecer modo endurecido con **cuenta de servicio OS dedicada** (o ejecución en CI remoto).
* **Alternativas descartadas y fundamento:** (a) Solo SHA-256 (no evita falsificación ni replay); (b) prometer resistencia criptográfica contra el mismo UID sin separación OS (falso técnicamente).
* **Riesgo residual:** Un agente con shell sin sandbox bajo el mismo UID (en modo monousuario estándar) o un usuario administrador/malware puede acceder al material de firma local.
* **Experimento necesario:** Pruebas contractuales en G1 (E2/E7): rechazo de JSON forjado en `.qa/`, alteración de 1 byte, replay de intento previo con `lease_epoch` antiguo, paridad MCP/CLI y prueba opcional con cuenta de servicio OS separada.
* **Criterio cuantificable de éxito:** 100 % rechazo de artefactos alterados, no firmados o repetidos en MCP y CLI; 0 acceso del cliente MCP/workspace a la clave de atestación.
* **Alternativa viable si el experimento fracasa:** Para despliegues corporativos que exijan no-repudio frente a desarrolladores/agentes con shell local, exigir ejecución en runner CI remoto (donde el agente local carece de acceso a la clave).
* **Fase que condiciona:** Contrato de intentos previo a integración en G1.
* **Estado de diseño:** **DISEÑO CERRADO (FRONTERA REALISTA DOCUMENTADA)** *(registro maestro: pasa de `BLOQUEANTE` a `PENDIENTE` de pruebas contractuales en G1)*.
* **Estado separado de validación experimental:** `VALIDACIÓN EXPERIMENTAL PENDIENTE` (E2/E7 en G1).

### AR-31 · Autoridad efectiva en destino, defensa más allá de HTTP y datos no confiables

* **Obligación normativa:** `REQ-SEG-001.1–001.3`, `REQ-DAT-001.3`, `REQ-ORA-001.5`, `REQ-XINST-001` (D07, D09, D20).
* **Afirmación técnica revisada:** La clasificación por método HTTP (`GET`/`HEAD`) en `packages/auth/src/scoped-browser.ts:7` es insuficiente; la inmutabilidad en producción y referencias cross-instancia exige autoridad impuesta por el destino + defensa semántica en QAP (redirecciones salto a salto, WebSockets, Service Workers, GraphQL, `sendBeacon`) + aislamiento de `untrusted_aut_data`.
* **Evidencia verificable:** `packages/auth/src/scoped-browser.ts:4-35`, `packages/playwright-adapter/src/reconnaissance/transport.ts`, `packages/mcp/src/handlers/test.handler.ts:45,488-496`.
* **Evaluación de recomendaciones anteriores:** Se valida `O-09` de Antigravity en su totalidad y se integra con el rescate de `transport.ts` (anti-SSRF / sin auto-redirect).
* **Contrato definitivo propuesto:** Definido en §B.1.D: doble capa (autoridad read-only impuesta por destino + allowlist semántica en QAP), bloqueo de `Upgrade: websocket` y `Service Workers` en modo lectura, inspección AST de GraphQL, validación salto a salto de redirecciones, bloqueo `fail-closed` cuando el destino no acredita solo-lectura, y encapsulamiento `untrusted_aut_data` con parsers en worker aislado.
* **Alternativas descartadas y fundamento:** Confiar solo en `method === 'GET'` o en etiquetas `"staging"` (expuesto a GET con efectos secundarios, GraphQL POST y redirecciones).
* **Riesgo residual:** Un endpoint `GET` propietario sin documentación que mute estado internamente en un entorno donde el destino otorgó erróneamente permisos de escritura a la cuenta de lectura (mitigado exigiendo cuenta read-only real en destino).
* **Experimento necesario:** **EXP-05b (G3)** y pruebas adversariales en G1/G3 (E2/E5): fixture con GET mutativo, redirección 307 cross-origin, WebSocket mutativo, Service Worker, GraphQL `mutation`, prompt injection en DOM/PDF y verificación independiente de cero mutaciones en instancia de referencia.
* **Criterio cuantificable de éxito:** 0 mutaciones ejecutadas en instancia de referencia o entorno read-only; 100 % bloqueo de redirecciones fuera de alcance, GraphQL `mutation` y escalaciones desde `untrusted_aut_data`.
* **Alternativa viable si el experimento fracasa:** Si un destino no puede acreditar cuenta read-only ni contrato de operaciones seguras, mantener `BLOCKED` y operar únicamente sobre exportación sanitizada offline autorizada.
* **Fase que condiciona:** Contrato previo a conectores y acceso a AUT (G0/G1/G3).
* **Estado de diseño:** **DISEÑO CERRADO (VALIDACIÓN EXPERIMENTAL EN G1/G3)** *(registro maestro: pasa de `BLOQUEANTE` a `VALIDACIÓN EXPERIMENTAL PENDIENTE` para planificación; sigue bloqueando activación de conectores/destinos reales hasta pasar E2/EXP-05b y `DE-04`)*.
* **Estado separado de validación experimental:** `VALIDACIÓN EXPERIMENTAL PENDIENTE` (E2 en G1, `EXP-05b` en G3).

### AR-32 · Gobernanza de 4 permisos privados, renovación/revocación y riesgo residual (`DE-02`)

* **Obligación normativa:** `POL-CAP-001`, `POL-RET-001`, `REQ-SEG-001.3`, `REQ-SEG-002.3` (D18).
* **Afirmación técnica revisada:** Los 4 permisos (`capture`, `access`, `retain`, `export`) son estrictamente independientes con consecuencias diferenciadas de expiración y revocación (§B.1.F). **`DE-02` sigue pendiente de ratificación expresa del propietario.**
* **Evidencia verificable:** `acta-decisiones.md:432-472`, `catalogo-requisitos.md:897-912`.
* **Evaluación de recomendaciones anteriores:** Se consolida `O-10` de Antigravity con la separación de permisos de D18 y la precondición de almacenamiento cifrado del Orquestador.
* **Contrato definitivo propuesto:** Tabla de estados y efectos de los 4 permisos (§B.1.F), vigencia máxima de `capture` ≤30 días (renovable y revocable), `export` denegado por defecto con bitácora inmutable, y acta de riesgo residual declarando explícitamente límites sobre SSD, snapshots/backups del SO y copias exportadas.
* **Alternativas descartadas y fundamento:** Agrupar captura y conservación en un solo permiso (provocaría borrado inesperado al vencer 30 días de captura o retención indebida tras revocar conservación); prometer revocación remota de copias exportadas (técnicamente imposible).
* **Riesgo residual:** Copias ya exportadas, backups/snapshots del SO y memoria volátil del navegador.
* **Experimento necesario:** Pruebas de matriz de 4 permisos en G3/G5 (E5/E6): expiración/revocación independiente de cada permiso y verificación de exclusión de media privada en exportación estándar.
* **Criterio cuantificable de éxito:** 100 % cumplimiento de la matriz de 4 permisos; 0 inclusión automática de media privada en exports ordinarios; 100 % registro en auditoría ante export excepcional autorizado.
* **Alternativa viable si el experimento fracasa:** Mantener deshabilitada toda exportación privada y operar solo en modo local confinado o `MANDATORY_SUPPRESSION`.
* **Fase que condiciona:** Habilitación de captura privada (requiere acta `DE-02` del propietario antes de cerrar G0).
* **Estado de diseño:** **DISEÑO CERRADO — PENDIENTE RATIFICACIÓN EMPRESARIAL (`DE-02`)** *(registro maestro: `PENDIENTE`)*.
* **Estado separado de validación experimental:** `VALIDACIÓN EXPERIMENTAL PENDIENTE` (E5/E6 en G3/G5).

### AR-40 · Contrato defensivo del adaptador Git sin shell

* **Obligación normativa:** `REQ-SEG-001.1`, `REQ-INT-001.2`, `REQ-REG-001.1` (D20; `AS-02`, `H-REV-01`).
* **Afirmación técnica revisada:** Confirmado en `develop` (`packages/git-adapter/src/git-adapter.ts:28,33,45-47`): uso de `execSync` con interpolación de `this.baseBranch` y ocultamiento de errores devolviendo `[]`. El tag archivado `AS-02` (`c5ac3e5e`) aporta diseño defensivo, pero no está integrado en `develop` ni cuenta con acta de ejecución en el SHA objetivo.
* **Evidencia verificable:** `packages/git-adapter/src/git-adapter.ts:1-85`, `docs/qap-architecture/evidencia-archivada.md:17-19`, [Node.js `child_process](https://nodejs.org/api/child_process.html)`, [CVE-2022-24765](https://www.cve.org/CVERecord?id=CVE-2022-24765), [CVE-2024-36138](https://www.sentinelone.com/vulnerability-database/cve-2024-36138/).
* **Evaluación de recomendaciones anteriores:** Coincidencia total en adoptar `execFileSync`/`execFile` sin shell + validación con `git rev-parse --verify` + propagación explícita de error; se refuerza exigiendo separador `--end-of-options` / `--` y manejo explícito de `safe.directory`.
* **Contrato definitivo propuesto:** Definido en §B.1.E (`execFile`/`execFileSync` con `shell: false`, rechazo de flags `-*`, resolución previa a SHA con `git rev-parse --verify --end-of-options <ref>^{commit}`, `git diff --name-only <sha> --`, retorno tipado sin silenciar errores).
* **Alternativas descartadas y fundamento:** Escapar strings para `execSync` (frágil entre POSIX y `cmd.exe` de Windows); retornar `[]` en error (oculta fallos de regresión).
* **Riesgo residual:** Dependencia del binario `git` instalado en `PATH` del host (mitigable resolviendo ruta absoluta verificada en `qap doctor`).
* **Experimento necesario:** Pruebas unitarias y negativas en G0 sobre los 3 SO (metacaracteres de shell, refs con `--output=`, refs inexistentes, repo sin commits, directorio no confiable).
* **Criterio cuantificable de éxito:** 100 % rechazo seguro en vectores de inyección de shell/argumentos; 0 retornos silenciosos `[]` ante error; 100 % paso en Windows, macOS y Linux en el SHA de G0.
* **Alternativa viable si el experimento fracasa:** Si `git` no está disponible, el detector de drift degrada explícitamente a señal DOM/API/configuración marcando `git_drift_unavailable` (nunca `[]` silencioso).
* **Fase que condiciona:** Remediación obligatoria en G0.
* **Estado de diseño:** **DISEÑO CERRADO (REMEDIACIÓN OBLIGATORIA G0)** *(registro maestro: `PENDIENTE` de ejecución y pruebas en G0)*.
* **Estado separado de validación experimental:** `VALIDACIÓN EXPERIMENTAL PENDIENTE` (pruebas negativas en G0).

### AR-47 · Prohibición absoluta de degradación a anónimo y revocación en vuelo

* **Obligación normativa:** `REQ-SEG-002.2`, `REQ-SEG-001.3`, `REQ-MEM-002.5` (D07, D20; `AS-03`, `H-REV-05`).
* **Afirmación técnica revisada:** Confirmado en `develop` (`packages/playwright-runner/src/runner.ts:334-342`): ante fallo de resolución implícita de sesión (`options.profile === undefined`), el runner emite un aviso y continúa como anónimo. Además, `TestHandler` no propaga `AbortSignal` al navegador en vuelo ante revocación (`catalogo-requisitos.md:740`).
* **Evidencia verificable:** `packages/playwright-runner/src/runner.ts:321-348`, `packages/playwright-runner/src/session-resolver.ts:19-60`, `packages/auth/src/session-store.ts:64-101`.
* **Evaluación de recomendaciones anteriores:** `H-REV-05` documentó la brecha entre perfil explícito e implícito; se cierra definitivamente exigiendo *fail-closed* uniforme en ambos casos y cableado obligatorio de revocación en vuelo.
* **Contrato definitivo propuesto:** (1) Todo alcance o módulo que declare requisito de autenticación (`explicit` o `implicit` vía prerrequisitos/política) falla cerrado con `BLOCKED_AUTH` (`downgraded_to_anonymous: false`) ante sesión faltante, expirada, corrupta o revocada — cero degradación con aviso en MCP, CLI y CI; (2) la revocación incrementa `policy_generation` en `IQapRepository` y dispara por IPC `AbortController` en ejecuciones/Discovery activos, cerrando `BrowserContext`, WebSockets y bloqueando publicación de intentos revocados; (3) la verificación de expiración contempla tanto expiración de cookies como respuesta `401`/redirección a login en runtime.
* **Alternativas descartadas y fundamento:** Permitir degradación con `console.warn` en resolución implícita (provoca falsos resultados sobre rutas públicas y viola D20).
* **Riesgo residual:** Una sesión revocada en el backend del AUT (sin cambio local de cookie) se detecta en la siguiente interacción (`401`/login redirect), no antes del envío.
* **Experimento necesario:** Matriz de pruebas en G1/G3 (E2/E5): pérdida de sesión explícita e implícita en MCP y CLI, expiración en mitad de flujo y revocación desde un segundo proceso durante ejecución activa.
* **Criterio cuantificable de éxito:** 0 ejecuciones anónimas bajo alcance autenticado (explícito o implícito); 100 % aborto en vuelo y bloqueo de publicación tras revocación en <2 s; 100 % paridad MCP/CLI.
* **Alternativa viable si el experimento fracasa:** Ninguna rebaja aceptable; control de seguridad duro.
* **Fase que condiciona:** Contrato y paridad de seguridad en G1 (E2).
* **Estado de diseño:** **DISEÑO CERRADO** *(registro maestro: `PENDIENTE` de pruebas contractuales en G1)*.
* **Estado separado de validación experimental:** `VALIDACIÓN EXPERIMENTAL PENDIENTE` (E2/E5 en G1/G3).

---

## B.3 Cuestiones empresariales realmente pendientes en AV-02

1. **`DE-01` (Abierta — NO aprobada):** Ratificación por el propietario de los TTL operativos propuestos (multimedia exitosa ≤24 h, trazas exitosas ≤72 h, fallos ≥14 días), cuota máxima por proyecto y umbrales de disco lleno (80 %/95 %), preservando lo ya ratificado en D19 (historial permanente, detalle 90 días, knowledge sin caducidad) y la precedencia absoluta de revocación privada (`AR-25`).
2. **`DE-02` (Abierta — NO aprobada):** Ratificación por el propietario de los ámbitos autorizados para `PRIVATE_AUTHORIZED`, política de exportación privada excepcional, precondición obligatoria de almacenamiento cifrado verificable cuando existan temporales de aplicación sin cifrar, y aceptación explícita del riesgo residual (SSD, snapshots/backups del SO, RAM/swap y copias exportadas) (`AR-27`, `AR-32`).
3. **`DE-04` (Vinculada a AV-08 / AV-05 — NO aprobada):** Autorización concreta de destinos reales QA/staging y cuentas read-only acreditadas en destino antes de cualquier acceso real en `G6.5` (`AR-31`).

---

## B.4 Dictamen independiente de AV-02

**DICTAMEN AV-02: `CONTRATOS DE SEGURIDAD, PRIVACIDAD Y AUTENTICIDAD DEFINIDOS — HABILITA PLANIFICACIÓN CON REMEDIACIONES OBLIGATORIAS EN G0, EXPERIMENTOS ACOTADOS (EXP-07, EXP-06a/c, EXP-05b) Y RATIFICACIÓN PENDIENTE DE DE-01 Y DE-02**`

* Ningún registro de AV-02 carece de alternativa técnica viable; por tanto, AV-02 **no impide elaborar el plan maestro definitivo ni el WBS** una vez el Orquestador y Codex contravaliden este expediente.
* Permanecen como **compuertas duras de ejecución** (no de planificación): remediación en G0 del visor (`AR-24`) y Git (`AR-40`), validación experimental de bóveda/KEK (`EXP-07` / `AR-07`), validación de captura *Chunked AEAD* + precondición FDE (`EXP-06a/c` / `AR-27`), verificación de defensa en profundidad (`EXP-05b` / `AR-31`), y ratificación expresa del propietario sobre `DE-01` y `DE-02` antes de cerrar G0 o habilitar `PRIVATE_AUTHORIZED`.

---

# BLOQUE DE ACTUALIZACIÓN DOCUMENTAL PARA CODEX (`registro-maestro.md`)

*(Incorporación directa sin reinterpretación; conserva los estados del registro maestro y separa diseño de validación experimental.)*

```markdown
## Actualización AV-01 y AV-02 · Contravalidación Neon (SHA cf024ca4602b134db9ef71b980d5943dcca285e0)

### AV-01 · Estados y resoluciones actualizadas
- **AR-01** | Severidad: Alta | Estado de diseño: `PENDIENTE` (de aplicación editorial de 9 enmiendas exactas en `catalogo-requisitos.md`; pasa a `VALIDADA` tras aplicarse) | Validación experimental: `N/A` | Nota: 5 fuentes históricas recuperadas en `fuentes-recuperadas/`; 0 IDs perdidos; 9 condiciones/excepciones diluidas identificadas para restauración inmediata. Deja de ser `BLOQUEANTE` tras aplicar enmiendas.
- **AR-02** | Severidad: Media | Estado de diseño: `PENDIENTE` (de aplicación editorial; pasa a `VALIDADA` tras aplicarse) | Validación experimental: `N/A` | Nota: Clasificación histórica real recuperada (`fe-erratas-neon.md`: 60/20/7) muestra 13 diferencias frente a reconstrucción Neon (`REQ-QA-003` ya era RF). Se adopta clase primaria + etiquetas de cumplimiento sin cuota numérica fija; cobertura de `REQ-QA-003` sigue en `DE-05` (AV-08).
- **AR-03** | Severidad: Alta | Estado de diseño: `PENDIENTE` (consolidable en base tras enmiendas §A.4; contratos detallados delegados a AV-02–AV-08) | Validación experimental: `N/A` | Nota: Tablas resumen pierden valor normativo autónomo; precedencia `D01–D21 → Catálogo 92 enmendado → Contratos AV-02–AV-08`.
- **AR-04** | Severidad: Alta | Estado de diseño: `VALIDADA` (contrato `ExecutionScopeEnvelope`: `ScopeIdentity`, `ProfileBinding`, `AppVariantContext`, `FrozenRegionalContext`) | Validación experimental: `VALIDACIÓN EXPERIMENTAL PENDIENTE` (E2/E4 en G1/G2) | Nota: Separa clave de aislamiento/autoridad de contexto regional congelado para replay.
- **AR-55** | Severidad: Media | Estado de diseño: `VALIDADA` (sin cambio) | Validación experimental: `N/A` | Nota: Confirmados 82/5/11/3/2/92 y D01–D21 contra fuentes recuperadas.
- **AR-56** | Severidad: Media | Estado de diseño: `VALIDADA` (actualiza `SUSTITUIDA POR RESOLUCIÓN TRAZABLE` tras recuperación real) | Validación experimental: `N/A` | Nota: Atribución histórica corregida a `fuentes-recuperadas/fe-erratas-neon.md`; reconstrucción Neon archivada como antecedente superado.

### AV-02 · Estados y resoluciones actualizadas (sujeto a contravalidación técnica de Codex)
- **AR-07** | Severidad: Crítica | Estado de diseño: `VALIDACIÓN EXPERIMENTAL PENDIENTE` (diseño cerrado: retirar `keytar` y bypass MCP; `IKekProvider` 32 B + `PortableCredentialVault` AES-256-GCM; TTY + loopback `127.0.0.1` + CI sin TTY; DACL Windows) | Validación experimental: `VALIDACIÓN EXPERIMENTAL PENDIENTE` (`EXP-07` / E2 en G0–G1) | Nota: Acreditadas limitaciones de `@napi-rs/keyring` (fallback `keyutils` Linux, `libdbus` AFL-2.1/GPL-2.0-or-later, tope 2560 B en Windows).
- **AR-14** | Severidad: Alta | Estado de diseño: `PENDIENTE` (diseño cerrado: precedencia perfil/destino → señal destino → declaración operador; bloqueo ante conflicto; `tenant_id` en clave/AAD de `SessionStore`) | Validación experimental: `VALIDACIÓN EXPERIMENTAL PENDIENTE` (E2 en G1).
- **AR-24** | Severidad: Crítica | Estado de diseño: `BLOQUEANTE` (para cierre de G0 / apertura de G1; no bloquea WBS) | Validación experimental: `VALIDACIÓN EXPERIMENTAL PENDIENTE` (pruebas defensivas G0/E6) | Nota: Consolida `AS-01` + `HN-07` + `HA-01`: `127.0.0.1`, token ≥256 bits, `Origin` estricto sin `*`, eliminar `DELETE`, catálogo SQLite `COMMITTED`, decodificación única, `Cache-Control: private, no-store`, `HTTP Range 206/416` `video/webm`.
- **AR-25** | Severidad: Alta | Estado de diseño: `PENDIENTE` (diseño cerrado; pendiente ratificación `DE-01`) | Validación experimental: `VALIDACIÓN EXPERIMENTAL PENDIENTE` (E2/E5 en G1/G3) | Nota: Precedencia absoluta de revocación privada sobre defectos abiertos; `DE-01` permanece NO aprobada.
- **AR-27** | Severidad: Crítica | Estado de diseño: `VALIDACIÓN EXPERIMENTAL PENDIENTE` (`PRIVATE_AUTHORIZED` bloqueado hasta superar `EXP-06a/c` y `DE-02`; no bloquea planificación) | Validación experimental: `VALIDACIÓN EXPERIMENTAL PENDIENTE` (`EXP-06a` G0/G1, `EXP-06c` G3/G5) | Nota: 6 capas deslindadas; `AuthAcquisitionContext` sin grabación; `onFrame`→pipe WebM→*Chunked AEAD* (con `header_sha256` en AAD); **precondición obligatoria de almacenamiento cifrado verificable del SO** cuando existan temporales privados sin cifrar a nivel de aplicación.
- **AR-28** | Severidad: Crítica | Estado de diseño: `PENDIENTE` (diseño cerrado con frontera de 6 niveles) | Validación experimental: `VALIDACIÓN EXPERIMENTAL PENDIENTE` (E2/E7 en G1) | Nota: `AttemptAttestation` (Ed25519/HMAC + `lease_epoch` + `plan_snapshot_digest`) + SHA-256; declara honestamente que en modo local monousuario no resiste a agente con shell libre bajo el mismo UID (mitigación opcional: cuenta de servicio OS separada o CI remoto).
- **AR-31** | Severidad: Crítica | Estado de diseño: `VALIDACIÓN EXPERIMENTAL PENDIENTE` (diseño cerrado; bloquea acceso a destinos reales hasta `EXP-05b` y `DE-04`) | Validación experimental: `VALIDACIÓN EXPERIMENTAL PENDIENTE` (E2 en G1, `EXP-05b` en G3) | Nota: Autoridad read-only impuesta por destino + allowlist semántica + bloqueo WS/SW + AST GraphQL + validación salto a salto + aislamiento `untrusted_aut_data`.
- **AR-32** | Severidad: Alta | Estado de diseño: `PENDIENTE` (diseño cerrado; pendiente ratificación `DE-02`) | Validación experimental: `VALIDACIÓN EXPERIMENTAL PENDIENTE` (E5/E6 en G3/G5) | Nota: 4 permisos independientes (`capture`/`access`/`retain`/`export`) con efectos diferenciados; `DE-02` permanece NO aprobada.
- **AR-40** | Severidad: Alta | Estado de diseño: `PENDIENTE` (remediación obligatoria G0) | Validación experimental: `VALIDACIÓN EXPERIMENTAL PENDIENTE` (pruebas negativas G0 en 3 SO) | Nota: `execFile`/`execFileSync` con `shell: false`, `git rev-parse --verify --end-of-options <ref>^{commit}`, separador `--` y error tipado sin retorno silencioso `[]`.
- **AR-47** | Severidad: Alta | Estado de diseño: `PENDIENTE` (diseño cerrado) | Validación experimental: `VALIDACIÓN EXPERIMENTAL PENDIENTE` (E2/E5 en G1/G3) | Nota: `BLOCKED_AUTH` fail-closed uniforme tanto en perfil explícito como implícito + `AbortController` en vuelo vía bus durable de revocación.

### Nuevas dependencias de experimento propuestas
- **EXP-07 · Bóveda KEK multiplataforma y CI sin TTY** | Responsable: AV-02 | Condiciona: Selección definitiva de `IKekProvider` en G0/G1 | Registro: `AR-07`.

```