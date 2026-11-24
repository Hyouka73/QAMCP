# Informe Principal AV-05 · Documentos, reportes PDF/Excel, UTCP, OpenAPI y operaciones cross-instancia

- **Rol:** Gemini Neon — Investigador Principal y Arquitecto de QAP (bajo dirección del Orquestador Principal)
- **Repositorio y rama exclusiva:** `Hyouka73/QAMCP` · rama `develop`
- **SHA de referencia:** `e8a9fc453f0346c4b045a867e54c54c35d2ac3bb`
- **Encargo vinculante:** `docs/qap-architecture/cierre-av-01/decision-orquestador-av04-encargo-av05.md` (24 de noviembre de 2026)
- **Alcance exclusivo:** `AR-13`, `AR-17`, `AR-18`, `AR-20`, `AR-22`, `AR-38`, `AR-48`, `AR-50` y protocolos `EXP-05a`, `EXP-05b`, `EXP-06b`
- **Modalidad:** Solo lectura e investigación. Sin modificaciones a GitHub, código, dependencias, CI ni configuración ejecutable; sin ejecución de experimentos, ramas, worktrees, G0/G1, WBS ni acceso a sistemas empresariales. No se inicia AV-06.
- **Límites de autoridad:** Se preservan íntegros los contratos aceptados de AV-01, AV-02, AV-03 y AV-04 (incluidas enmiendas §§1–8 de AV-04 y tabla de códigos AR-52). No se ratifican `DE-01` a `DE-05` ni se fijan umbrales empresariales. Se conservan los 57 registros del registro maestro y sus estados principales vigentes.

---

## 1. Resumen ejecutivo y contraste con la línea base real (`develop` @ `e8a9fc45`)

La inspección directa del árbol fuente, manifiestos `packages/*/package.json` y `pnpm-lock.yaml` en `Hyouka73/QAMCP` (`develop`) confirma que **AV-05 cubre un conjunto de capacidades críticas de primer lanzamiento (D08, D09, D10, D11, D18–D20) cuya implementación actual en `develop` es parcial o inexistente**, mientras los informes históricos presentan discrepancias verificables que quedan resueltas con fuentes primarias vigentes a noviembre de 2026.

| Área verificada | Evidencia exacta en `develop` (`e8a9fc45`) | Brecha / discrepancia histórica resuelta |
| --- | --- | --- |
| **Parsers documentales y Office (`AR-13`, `AR-20`, `AR-22`)** | `packages/knowledge/src/document-detector.ts:59` fija `INGESTIBLE_EXTENSIONS = new Set(['.md', '.markdown', '.txt'])`; líneas `468–470` solo detectan `openapi.*`/`swagger.*` (`.yaml`/`.yml`/`.json`) por prefijo de nombre. `packages/mcp/src/server.ts:887–892` bloquea `docPath`/`path` con `direct_document_path_unavailable`. En `pnpm-lock.yaml` **no existen** `mammoth`, `@scalar/openapi-parser`, `@utcp/sdk`, `exceljs`, `xlsx`, `pdf-parse`, `pdfjs-dist`, `hyperformula`, `decimal.js` ni `tesseract.js`. | Confirma que los riesgos de `mammoth`, `@scalar/openapi-parser`, `exceljs` y `xlsx` son **riesgos preventivos de selección**, no vulnerabilidades explotables hoy en `develop`. Se resuelve `HN-05` / `C-02` con versiones exactas y advisories 2025–2026. |
| **Dependencias YAML y JSON Schema existentes (`AR-22`)** | `pnpm-lock.yaml` resuelve `yaml@2.9.0` (directa en `cli`, `knowledge`, `mcp`), `js-yaml@4.3.1` y `5.4.1` (transitivas), `ajv@8.20.0`, `ajv-formats@3.0.1`, `ajv@6.15.0` (transitiva) y `zod@4.6.5`. | `ajv@8.20.0` ya está por encima del parche `8.18.0` de `CVE-2025-69873`; en cambio, `js-yaml` acumuló `CVE-2025-64718` (`<4.1.1`) y DoS cuadrático por cadenas de merge-keys (`CVE-2026-59869`, `CVE-2026-84375`). Para ingesta de YAML no confiable se prescribe `yaml@2.9.0` con `merge: false` y límites estrictos en subproceso aislado. |
| **UTCP / OpenAPI / HTTP gobernado (`AR-17`, `AR-18`, `AR-48`)** | Cero ocurrencias de `utcp` o cliente OpenAPI en `packages/`. Existe primitiva endurecida reutilizable en `packages/playwright-adapter/src/reconnaissance/transport.ts:36–70` (HTTP/HTTPS sin auto-redirect, sin retry, `canonicalIp`, `scope.resolve`, `AbortSignal`, límites de bytes) y observador pasivo en `packages/playwright-adapter/src/network-observer/service.ts` + `privacy.ts`. | `REQ-DAT-001.2`, `REQ-QA-002` y `REQ-XINST-001` están ausentes como contrato integrado; el transporte anti-SSRF de `reconnaissance/transport.ts` provee base real reutilizable tras `IExternalOperationPort` (AV-04 §8). |
| **Reportes propios de QAP y visor (`AR-50`)** | `packages/reporter/src/template/index.html:13–19` carga **Google Fonts y Tailwind CSS vía CDN (`cdn.tailwindcss.com`)** e interpola campos sin escape en `innerHTML` (p. ej. líneas `595`, `637`, `644`, `739`, `835`, `842`). `packages/reporter/src/generators/` solo tiene `html-report.ts`, `json-report.ts`, `junit-report.ts`, `markdown-report.ts` y `flow-report.ts`: **faltan generadores `CSV` y `JSONL`**. `html-report.ts:61–66` y `markdown-report.ts:12–17` solo manejan 4 estados legados (`passed`, `failed`, `skipped`, `not_run`), sin los 6 veredictos ni 4 ejes de AV-04. `server.ts:59–61,71,128,144–153,227,277,315` conserva `ACAO: *`, `DELETE /api/runs/:runId` sin auth, doble `decodeURIComponent`, `isAbsolute(safePath)` y `Cache-Control: public, max-age=3600`. `pruning-engine.ts:52–56` fija TTLs legados (`7d/14d/30d`) desalineados con D19 (`90d` detalle + política propuesta sujeta a DE-01). | Brecha crítica de seguridad, offline-first y alineación con AV-04/D19. El visor y los generadores requieren convergencia sobre un DTO/manifiesto único, eliminación total de CDN, escape HTML/MD y mitigación CSV CWE-1236. |

---

## 2. Resolución individual de registros (AR-13, AR-17, AR-18, AR-20, AR-22, AR-38, AR-48, AR-50)

### 2.1 AR-13 · Ingesta documental corporativa y técnica

- **Severidad:** Alta · **Estado principal conservado:** `PENDIENTE` · **Fase:** Antes de congelar ingesta G2 · **Dependencias:** AV-01, AV-02 · **Requisitos:** `REQ-DOC-001.1–001.4`, `REQ-AUTREP-001`, `REQ-INT-001.4` (D10, D11).

#### Evidencia verificable (código y fuentes oficiales)
1. **Línea base en `develop`:** `packages/knowledge/src/document-detector.ts:59` restringe ingesta a `.md`, `.markdown` y `.txt`; `packages/mcp/src/server.ts:887–892` bloquea la lectura directa por ruta (`direct_document_path_unavailable`). `scoped-rule-resolver.ts` extrae reglas mediante regex sobre viñetas en texto plano, sin soporte estructural para PDF, DOCX, Excel, JSON/YAML arbitrarios ni OpenAPI, ni registro de fragmentos ilegibles (`REQ-DOC-001.2` ausente).
2. **Separación D10 vs. D11:** `acta-decisiones.md:196–257` establece explícitamente que la ingesta de documentación corporativa/técnica (D10) y la validación funcional de reportes emitidos por el AUT (D11) son **capacidades distintas con contratos y criterios de aceptación propios**, aunque compartan primitivas de parsing seguro en subproceso aislado.
3. **Bibliotecas y OCR local verificados (sin API de modelos obligatoria, D03):**
   - **PDF texto/layout:** [`pdfjs-dist`](https://www.npmjs.com/package/pdfjs-dist) (v6.5.438, Apache-2.0, [repositorio Mozilla PDF.js](https://github.com/mozilla/pdf.js/)) expone ítems de texto con matriz de transformación `(x, y, width, height)` por página, permitiendo reconstruir tablas por geometría y detectar páginas basadas en imagen (baja densidad textual / cobertura raster). No garantiza por sí sola extracción de tablas complejas sin bordes; se complementa con heurística determinista de grilla/columnas y marcado de baja confianza.
   - **DOCX:** [`mammoth`](https://www.npmjs.com/package/mammoth) (v1.13.0, BSD-2-Clause, [deps.dev](https://deps.dev/npm/mammoth)) convierte DOCX a HTML semántico preservando encabezados y tablas simples, pero aplana celdas combinadas complejas o metadatos OOXML avanzados; requiere lectura complementaria de `word/document.xml` (sin XXE) para conservar atributos `w:gridSpan` / `w:vMerge` y localizadores exactos de párrafo/tabla/celda.
   - **Excel (ingesta documental D10):** [`exceljs`](https://github.com/exceljs/exceljs) (v4.4.0, MIT, sin publicación desde oct-2023) o su fork mantenido [`exceljs-community`](https://www.npmjs.com/package/exceljs-community) (v5.2.0, MIT, sept-2026) leen hojas, rangos combinados (`merges`), texto, fórmulas y valores cacheados. (Ver `AR-20`/`AR-22` para análisis de mantenimiento y rechazo de `xlsx@0.18.5` en npm).
   - **MD / TXT / JSON / YAML / OpenAPI:** `yaml@2.9.0` (ISC, ya en `pnpm-lock.yaml`), `JSON.parse` con límite de profundidad/tamaño y `@scalar/openapi-parser` (MIT, ver `AR-17`/`AR-22`).
   - **OCR local opt-in sin API externa:** [`tesseract.js`](https://github.com/naptha/tesseract.js/) (Apache-2.0, [package.json](https://github.com/naptha/tesseract.js/blob/master/package.json), WebAssembly sobre Tesseract) soporta >100 idiomas y retorna bounding boxes por bloque/línea/palabra con puntaje de confianza. **Hallazgo operativo crítico:** por defecto `tesseract.js` descarga `.traineddata` desde CDN (`cdn.jsdelivr.net`, [naptha/tessdata](https://github.com/naptha/tessdata)), lo que violaría el aislamiento sin red de `AR-22`. Debe ejecutarse **exclusivamente con `langPath` local predescargado/verificado por hash** bajo demanda (`qap setup --ocr-lang <iso>`), nunca con descarga automática desde el parser aislado.

#### Contrato propuesto (`DocumentIngestionPort` y modelo epistémico)
1. **Formatos obligatorios de primer lanzamiento:** `pdf`, `docx`, `xlsx` (y variantes `.xlsm` tratadas como solo datos sin macros, `.xls` legacy explícitamente marcado como soporte condicionado a conversión aislada o no acreditado si falta adaptador), `md`, `txt`, `json`, `yaml`, `openapi` (`3.0.x`, `3.1.x`, `3.2.x`).
2. **Separación estricta de cuatro etapas:**
   - **(a) Extracción determinista aislada:** produce nodos estructurales (`heading`, `paragraph`, `table`, `cell`, `list`, `code`, `schema_object`, `image_region`), preservando `rowspan`/`colspan`, encabezados repetidos multipágina, multihoja y **localizadores precisos** (`{ doc_sha256, doc_revision, format, page?, bbox?, sheet?, cell_range?, section_path?, json_pointer?, line_range? }`).
   - **(b) Registro de cobertura e ilegibilidad (`REQ-DOC-001.2`):** cada unidad extraída lleva `extraction_status: EXTRACTED | OCR_EXTRACTED | PARTIAL | UNREADABLE | UNSUPPORTED_CONSTRUCT`, confianza OCR cuando aplica y lista `extraction_gaps[]` con localizador y causa (`scanned_without_ocr`, `low_ocr_confidence`, `merged_table_ambiguous`, `encrypted_pdf`, `unsupported_embedded_object`). Extraer texto plano jamás equivale a comprensión completa.
   - **(c) Interpretación HOST (D03/D05):** el HOST propone reglas candidatas referenciando localizadores concretos (`plane: INFERENCE`), sin adquirir autoridad normativa por sí solo.
   - **(d) Acreditación normativa y prueba de negocio:** una regla pasa a `ACCREDITED_REQUIREMENT` solo mediante fuente primaria acreditada vigente (o confirmación trazable del propietario), preservando `authority_level`, `effective_from`, `effective_until`, `scope_vector` (incl. `locale/timezone/currency` de AV-03/HA-04) y relación con la observación del AUT.
3. **Reconciliación bidireccional de 4 estados (`REQ-DOC-001.3` + Enmienda AV-01 #4):**
   - `MATCHING` (documentado y observado concordante),
   - `DOCUMENTED_NOT_OBSERVED` (**permanece pendiente; jamás se marca automáticamente como eliminado o inexistente**),
   - `OBSERVED_NOT_DOCUMENTED` (observado en AUT sin respaldo normativo; no se promueve automáticamente a regla correcta),
   - `REAL_CONTRADICTION` (discrepancia verificada entre observación acreditada y regla vigente).
4. **Conflictos, obsolescencia e ilegibilidad (abstención acotada):** ante contradicción entre fuentes de igual autoridad, fuente vencida/obsoleta, extracción incompleta o página ilegible, QAP conserva la procedencia completa y emite `INDETERMINATE` o `BLOCKED` **únicamente para las afirmaciones dependientes de ese fragmento**, permitiendo que el resto de la campaña continúe normalmente.

#### Alternativas viables y comparación
| Alternativa | Ventajas | Límites y licencias | Decisión de diseño |
| --- | --- | --- | --- |
| **A1 (Candidata principal):** Adaptadores JS/TS en subproceso aislado (`pdfjs-dist` Apache-2.0 + `mammoth` BSD-2 + OOXML XML reader + `exceljs`/`exceljs-community` MIT + `yaml` ISC + `@scalar/openapi-parser` MIT + `tesseract.js` Apache-2.0 con `tessdata` local offline) | Cero runtime Python/JVM obligatorio en instalación base; licencias permisivas compatibles con `ISC`; localizadores geométricos nativos. | Tablas PDF sin bordes o multi-columna compleja pueden quedar en `PARTIAL`; OCR WASM más lento que nativo en lotes grandes y degradado en manuscritos/baja resolución (<150 DPI). | **Ruta candidata principal** condicionada a validación de corpus en G2 (`EXP-06b` + suite D10). |
| **A2 (Respaldo OCR / layout opcional):** Binario nativo `tesseract` (Apache-2.0) o servicio local opt-in del sistema en subproceso aislado | Mayor velocidad en lotes escaneados grandes; mejor soporte de idiomas ya instalados en el SO. | Requiere dependencia externa del SO (`qap doctor` debe verificarlo); no puede imponerse como requisito universal. | **Extensión opt-in** detrás del mismo puerto `IOcrAdapter`. |
| **Descartada:** Exigir API externa de LLM/VLM para leer PDFs/DOCX o exigir conversión manual previa a Markdown | — | Viola explícitamente **D03** (sin API adicional obligatoria) y **D10** (sin conversión manual ordinaria). | **Rechazada.** |

#### Riesgos residuales, criterios de aceptación y compuertas
- **Riesgos residuales:** PDFs escaneados con sellos superpuestos, tablas sin líneas con columnas dinámicas o DOCX con controles ActiveX/SmartArt pueden degradar a `UNREADABLE` y exigir abstención en esas afirmaciones. No se promete OCR universal.
- **Criterios de aceptación:** Corpus versionado por los 8 formatos de D10 (incluyendo tablas con celdas combinadas, multipágina, multihoja, PDF escaneado legible e ilegible, documentos contradictorios y obsoletos): 100 % de nodos trazables con localizador y `doc_sha256`; 100 % de páginas ilegibles reportadas en `extraction_gaps[]`; cero promoción automática de `DOCUMENTED_NOT_OBSERVED` a eliminado; cero bloqueo de campaña completa por una sección ilegible.
- **Compuerta:** Cierre de diseño en AV-05; selección de parsers y validación de corpus D10 en **G2** (antes de congelar ingesta).

---

### 2.2 AR-20 y AR-38 · Validación funcional de reportes PDF y Excel, fórmulas, precisión decimal y conciliación contable (Prioridad Crítica)

- **AR-20:** Severidad **Crítica** · Estado principal conservado: **`BLOQUEANTE`** · Fase: Antes de cerrar contrato D11 y corpus G2/G3 · Dependencias: AV-01, AV-04, AV-08.
- **AR-38:** Severidad **Alta** · Estado principal conservado: **`VALIDACIÓN EXPERIMENTAL PENDIENTE`** · Fase: **G2** antes de congelar ingesta y evaluación · Dependencias: AV-04.
- **Requisitos:** `REQ-AUTREP-001`, `REQ-DOC-001.1–001.2`, `REQ-ORA-001.4`, `REQ-DAT-001.2` (D11, D12, D17, D21).

#### Evidencia verificable (código, motores y estándares)
1. **Línea base en `develop`:** `catalogo-requisitos.md:947` confirma que `REQ-AUTREP-001` está **ausente** como producto integrado. No existe descarga gobernada de reportes del AUT, ni parser PDF/Excel, ni evaluador decimal, ni conciliador tabular.
2. **Incapacidad de recálculo en `ExcelJS`:** la documentación oficial de [`exceljs`](https://github.com/exceljs/exceljs/blob/master/README.md) confirma expresamente que **no evalúa fórmulas** (*"ExcelJS cannot process the formula to generate a result, it must be supplied"*); solo lee la cadena de fórmula y el valor cacheado `<v>` si el emisor lo escribió.
3. **Deriva binaria IEEE-754 vs. contabilidad y precisión de Excel:**
   - JavaScript `Number` usa IEEE-754 binario de 64 bits (53 bits de mantisa; `0.1 + 0.2 !== 0.3`), mientras Excel trunca/presenta a **15 dígitos significativos** ([ECMA-262](https://tc39.es/ecma262/multipage/ecmascript-data-types-and-values.html#sec-ecmascript-language-types-number-type); [FmtTools / límites Excel](https://fmttools.com/compare/csv-vs-excel/)).
   - Evaluadores JS permisivos como `fast-formula-parser` o `hot-formula-parser` operan internamente sobre `Number` IEEE-754 (hallazgo `HA-03` confirmado), introduciendo errores de 1 centavo y falsos PASS/FAIL.
   - [`decimal.js`](https://github.com/MikeMcl/decimal.js/) (MIT) proporciona aritmética decimal de precisión arbitraria y modos de redondeo explícitos (`ROUND_HALF_UP`, `ROUND_HALF_EVEN`, `ROUND_DOWN`, etc.).
   - **Advertencia crítica de diseño:** tampoco debe imponerse aritmética decimal arbitraria como *emulación universal de Excel* — Excel mismo tiene semántica IEEE-754 de 15 dígitos significativos y rarezas documentadas (sistema de fechas **1900 vs. 1904** y el bug histórico de Lotus 1-2-3 donde el **serial 60 corresponde al inexistente `1900-02-29`**, desplazando seriales `>= 61` en 1 día; ver [go-xlsb / ECMA-376 date system](https://pkg.go.dev/github.com/TsubasaBE/go-xlsb)). Por eso QAP **separa estrictamente** (i) el recálculo/verificación de semántica de hoja Excel del (ii) cálculo independiente de la regla de negocio/contable acreditada.
4. **Evaluación de motores de recálculo Excel y sus licencias:**
   - **[`HyperFormula`](https://handsontable.com/docs/hyperformula/guide/licensing.html) (v3.5.0, oct-2026):** licencia dual **GPLv3** o **Comercial/Propietaria** (requiere clave de licencia `gpl-v3` o comercial). Incorporarla como dependencia enlazada en QAP (declarado `ISC` en `package.json:19`) genera una incompatibilidad potencial de distribución copyleft salvo que el proyecto adopte GPLv3 o adquiera licencia comercial (sin emitir conclusión jurídica absoluta; cualquier adopción comercial o redistribución requiere dictamen legal en AV-07). **No se adopta como dependencia obligatoria del núcleo.**
   - **[`LibreOffice Calc`](https://www.libreoffice.org/download/) headless aislado (MPL-2.0):** motor de cálculo distinto de Microsoft Excel (no es un oráculo infalible: no soporta `LAMBDA` ni ciertas funciones recientes de Excel, devolviendo `#NAME?`, y redondea a 15 dígitos significativos). Además impone un binario de >1 GB, arranque lento y gestión estricta de subprocesos/perfiles temporales aislados sin macros ni enlaces externos ([referencia técnica de ejecución headless](https://apify.com/jumblemog/excel-model-api)). **Solo es admisible como adaptador opcional *opt-in* en subproceso aislado** cuando el usuario/entorno ya dispone de LibreOffice y desea contrastar fórmulas complejas no cubiertas por el AST acotado, etiquetando su salida como `ENGINE_RECALCULATED_LIBREOFFICE` (nunca como verdad contable infalible).
   - **AST tipado y acotado de AV-04 (`TypedRuleOracle`) + `decimal.js` (MIT) + evaluador acotado de fórmulas Excel (MIT):** evalúa tanto las **reglas contables independientes acreditadas** (en decimal exacto con redondeo intermedio/final y tolerancia normativa explícita) como el **subconjunto determinista verificado de fórmulas Excel** (`SUM`, `SUMIF`/`SUMIFS`, `COUNT`/`COUNTA`/`COUNTIF`, `AVERAGE`, `MIN`, `MAX`, `ROUND`/`ROUNDUP`/`ROUNDDOWN`, `IF`/`IFS`/`AND`/`OR`, aritmética básica, `SUBTOTAL` consciente de filas filtradas/ocultas, referencias A1/rangos/entre hojas). Toda fórmula fuera del subconjunto verificado se clasifica explícitamente como `FORMULA_UNSUPPORTED` y provoca abstención (`INDETERMINATE`) únicamente sobre la afirmación afectada.

#### Contrato propuesto (D11 · Separación de 6 estados de celda y arquitectura de 7 capas)
1. **Ciclo completo de validación de reportes del AUT:**
   - **Adquisición correlacionada:** navegar al módulo de reportes, configurar filtros, fechas, zona horaria, `locale`, moneda, agrupaciones, rol y `tenant`, disparar exportación real (UI o API autorizada), capturar la descarga (Playwright `download` o respuesta binaria HTTP), registrar `sha256`, `Content-Type`, nombre de archivo, parámetros exactos enviados y marca temporal/revisión del AUT.
   - **Validación estructural y de completitud:** verificar todas las páginas (PDF) y todas las hojas visibles/ocultas (Excel), encabezados repetidos, saltos de página, pies de tabla, filas huérfanas, detección de truncamiento silencioso (p. ej. límite de 1,000/10,000 filas o paginación cortada), orden contractual cuando la regla lo exige, unidades y vigencia.
   - **Validación a nivel de registro y agregación:** construir clave de identidad compuesta por fila, verificar cardinalidad contra la fuente autorizada, detectar **filas faltantes**, **filas duplicadas**, **filtros ignorados** (registros fuera del rango de fecha/tenant/estado solicitado), signos contables (débito/crédito), agrupaciones, subtotales y totales generales.
2. **Los 6 estados obligatorios de celda en reportes Excel (`AR-20`):**

| Estado de celda | Definición exacta | Uso permitido en oráculo |
| --- | --- | --- |
| `LITERAL_VALUE` | Valor bruto almacenado sin fórmula (`string`, `number`, `boolean`, `date_serial`, `empty`), separado de su `formatted_display_value` (`numFmt`). | Apto para comparación directa (aplicando decodificación de fecha 1900/1904 + serial 60 y locale/moneda). |
| `FORMULA_WITH_VERIFIED_CACHE` | Fórmula presente + valor `<v>` cacheado presente **y** verificado concordante con recálculo acotado dentro de la regla de precisión aplicable. | Apto para acreditar consistencia interna de hoja; la veracidad contable requiere además la regla independiente acreditada. |
| `FORMULA_STALE_OR_CONFLICTING_CACHE` | Fórmula presente + valor `<v>` cacheado presente pero **discrepante** respecto al recálculo acotado (caché obsoleta, cálculo manual desactualizado o error de generación del AUT). | **Nunca produce `PASS`.** Emite `FAIL` por defecto de integridad del reporte exportado (registrando valor cacheado vs. recalculado). |
| `FORMULA_WITHOUT_CACHE` | Fórmula presente sin elemento `<v>` cacheado (común en exportadores server-side). | Si la fórmula pertenece al subconjunto verificado, se evalúa con el evaluador acotado; si no, transita a `FORMULA_UNSUPPORTED` → `INDETERMINATE` sobre esa afirmación. **Jamás se asume `0` ni vacío.** |
| `FORMULA_ERROR_VALUE` | Celda con error explícito de Excel (`#DIV/0!`, `#VALUE!`, `#REF!`, `#NAME?`, `#N/A`, `#NUM!`, `#NULL!`). | `FAIL` automático salvo que una regla normativa negativa espere explícitamente ese código de error. |
| `FORMULA_UNSUPPORTED` | Fórmula fuera del subconjunto determinista verificado (p. ej. volátiles `NOW()`/`RAND()`, enlaces externos `[other.xlsx]`, macros/UDF, funciones dinámicas no cubiertas o `calcMode="manual"` sin recálculo acreditado). | Abstención explícita (`INDETERMINATE`, motivo `unverified_formula_construct`) solo en las afirmaciones dependientes; nunca inventar resultado ni confiar ciegamente en `<v>`. |

3. **Separación estricta de cinco planos de valor:** para toda celda/total validado el contrato registra independientemente: (1) `displayed_text` (formato visual / PDF), (2) `raw_or_cached_value`, (3) `formula_expression` y su estado entre los 6 anteriores, (4) `independent_business_calc` (calculado en `decimal.js` según `TypedRuleOracle` versionado de AV-04 §7) y (5) `accredited_expectation` (fuente autorizada).
4. **Alcance explícito de constructos Excel:**
   - **Soportados determinísticamente:** fórmulas estándar, fórmulas compartidas (`t="shared"`), rangos entre hojas del mismo libro, detección de `date1904` vs `1900` y compensación explícita de serial 60 (`1900-02-29` marcado como fecha inválida/patológica si aparece), detección de filas/columnas ocultas y autofiltros (`hidden="1"`), hojas ocultas (`state="hidden"|"veryHidden"`), y `fullCalcOnLoad` / `calcMode="manual"`.
   - **No ejecutados / bloqueados por seguridad:** macros VBA (`.xlsm`/`.xlsb` `vbaProject.bin`), DDE, conexiones Power Query/ODBC y referencias a libros externos (`externalLinks`). Su presencia se registra como metadato y bloquea recálculo inseguro.
5. **Nivel de testigo N2/N3 sin acceso obligatorio a la BD del AUT (D11, AV-04 §3):**
   - No se exige conexión directa a la base de datos del AUT.
   - Una API del AUT es opcional y **no es testigo independiente automáticamente** si comparte la misma consulta/procedimiento almacenado defectuoso que genera el reporte (**regla anti-causa común de AV-04 §3**).
   - **N2:** reporte descargado correlacionado contra datos sembrados conocidos por el `DataPlan` o contra un módulo/consulta de origen causalmente separado del generador del reporte.
   - **N3 (conciliación contable crítica):** insumos acreditados completos (p. ej. transacciones creadas/observadas en el flujo + tarifas/reglas vigentes) + **cálculo independiente en `decimal.js`** (`TypedRuleOracle`) + conciliación registro-a-registro y total-a-total contra el PDF/Excel emitido. Si la fuente de comparación es insuficiente o no hay regla de redondeo/tolerancia acreditada, **abstenerse (`INDETERMINATE`)**, nunca inventar tolerancias.

#### Matriz por clases de reporte, casos sanos y mutantes (controles contra falso PASS y falso FAIL)
| Clase de reporte | Controles sanos (cero falso FAIL) | Mutantes sembrados (cero falso PASS) |
| --- | --- | --- |
| **C-R1 · Tabular multipágina PDF** | Encabezados repetidos en páginas 1..N, saltos de página sin pérdida de fila, formatos regionales `es-MX`/`en-US`, totales al pie. | Fila faltante en cambio de página; fila duplicada; filtro de fecha ignorado (registro fuera de rango); truncamiento de página final. |
| **C-R2 · Excel financiero/contable multihoja** | Fórmulas `SUM`/`SUBTOTAL`/`ROUND` con caché válida; referencias cruzadas entre hoja detalle y hoja resumen; `1900` y `1904`. | **Mutante de 1 centavo** (`0.01`) en una fila y en subtotal; caché `<v>` obsoleta respecto a fórmula; fórmula sin `<v>`; redondeo intermedio vs. final incorrecto; signo invertido; celda `#REF!`/`#DIV/0!`; fecha desplazada por bug serial 60 o sistema 1904. |
| **C-R3 · Reporte con filtros/rol/tenant y orden contractual** | Mismo reporte exportado por 2 roles/tenants y 2 zonas horarias/locales con ordenamiento especificado. | Fuga de fila de otro tenant; filtro de estado ignorado; orden invertido donde el orden es contractual; filas ocultas incluidas indebidamente en suma visual. |
| **C-R4 · Extracción insuficiente / no soportada** | Reporte con columna informativa opcional sin regla. | PDF escaneado ilegible en columna de importe; fórmula volátil/externa sin caché → exige `INDETERMINATE` acotado, **nunca `PASS` ni `FAIL` fabricado**. |

#### Alternativas viables (compatibles con D11, sin desactivar reportes)
- **Ruta principal:** `pdfjs-dist` (layout tabular geométrico) + `exceljs-community`/`exceljs` (lector OOXML) + evaluador acotado de fórmulas Excel sobre `decimal.js` + `TypedRuleOracle` (AV-04 §7) en subproceso aislado.
- **Respaldo para fórmulas Excel fuera del subconjunto acotado:** adaptador *opt-in* sobre `LibreOffice Calc` headless en sandbox aislado sin red/macros, claramente marcado como motor externo no infalible; **jamás** desactivar validación de reportes D11 ni sustituirla por inspección manual.
- **Compuertas:** `EXP-06b` en **G2** antes de congelar diseño de ingesta y evaluación tabular; integración con flujos E2E en **G3**; validación sobre corpus ciego en **G6/E8** (AV-08).

---

### 2.3 AR-17 · Integración UTCP, OpenAPI y preparación de datos (`DataPlan`)

- **Severidad:** Alta · **Estado principal conservado:** `VALIDACIÓN EXPERIMENTAL PENDIENTE` · **Fase:** **G0** (`EXP-05a`) y antes de congelar datos **G3** (`EXP-05b`) · **Dependencias:** AV-04, AV-07 · **Requisitos:** `REQ-DAT-001.2`, `REQ-INT-001.4`, `REQ-QA-002`, `REQ-XINST-001` (D08).

#### Evidencia verificable (estándares, SDK y licencias)
1. **UTCP (`Universal Tool Calling Protocol`) y `@utcp/sdk`:**
   - El repositorio oficial [`universal-tool-calling-protocol/typescript-utcp`](https://github.com/universal-tool-calling-protocol/typescript-utcp) está licenciado bajo **MPL-2.0** (copyleft débil a nivel de archivo). Como dependencia npm sin modificar, MPL-2.0 permite su uso dentro de una obra más amplia bajo `ISC` preservando avisos de licencia y disponibilidad de código fuente para los archivos cubiertos por MPL-2.0 (cualquier modificación a archivos MPL-2.0 debe permanecer bajo MPL-2.0; la validación legal definitiva de redistribución en bundle/CLI se transfiere a AV-07).
   - UTCP v1.0+ estructura la descripción en `UtcpManual` y `CallTemplate` (`call_template_type`: `http`, `streamable_http`, `mcp`, `text`, `file`, `cli`, etc.) con control `allowed_communication_protocols` para evitar escalada de protocolo (p. ej. que un manual HTTP invoque herramientas `cli`, ver [documentación UTCP `CallTemplate`](https://utcp.io/api/core/utcp/data/call_template)).
   - **Riesgo crítico identificado en `typescript-utcp`:** incluye `CodeModeUtcpClient` (ejecución de TypeScript en VM) y carga automática de variables desde `.env` (`@utcp/dotenv-loader`). En QAP, **Code Mode y la carga implícita de `.env` o plugins `cli`/`file` deben estar estrictamente deshabilitados**; QAP solo permite el subconjunto HTTP/HTTPS gobernado con secretos inyectados por referencia opaca desde la bóveda (AV-02).
2. **OpenAPI 3.0 / 3.1 / 3.2:**
   - [OpenAPI 3.2.0](https://spec.openapis.org/oas/v3.2.0.html) (19 sept 2025) y [OpenAPI 3.2.1](https://spec.openapis.org/oas/v3.2.1.html) (10 sept 2026) están oficialmente vigentes junto con 3.1.x y 3.0.x ([guía oficial 3.1→3.2](https://learn.openapis.org/upgrading/v3.1-to-v3.2.html)), incorporando `$self`, etiquetas jerárquicas, streaming nativo y métodos HTTP personalizados (`additionalOperations`).
   - Diferencias críticas entre dialectos que el normalizador de QAP debe preservar explícitamente (sin aplastar semántica):
     - **OAS 3.0.x:** subconjunto extendido de JSON Schema Draft 00/05 (`nullable: true`, `exclusiveMinimum`/`exclusiveMaximum` booleanos, `$ref` sin propiedades hermanas válidas).
     - **OAS 3.1.x / 3.2.x:** compatibilidad completa con JSON Schema Draft 2020-12 (`type: ["string", "null"]`, `exclusiveMinimum` numérico, `$ref` con hermanos, `prefixItems`, `$dynamicRef`).
     - **Seguridad y serialización:** `securitySchemes` (`apiKey`, `http` Bearer/Basic, `oauth2`, `openIdConnect`, `mutualTLS`), estilos de parámetros (`form`, `simple`, `deepObject`, `pipeDelimited`, `spaceDelimited`, `explode`), `content` por media type (`application/json`, `multipart/form-data`, `application/x-www-form-urlencoded`, binarios PDF/XLSX).
     - **Constructos no soportados o diferidos explícitamente:** `callbacks`, `webhooks` entrantes no verificables sin receptor aislado, `mutualTLS` sin certificado configurado en bóveda, streaming bidireccional o métodos HTTP no estándar fuera de allowlist → se registran como `UNSUPPORTED_CONTRACT_FEATURE` y nunca se simulan ni se ejecutan a ciegas.
   - **Parser candidato:** [`@scalar/openapi-parser`](https://www.npmjs.com/package/@scalar/openapi-parser) (`0.29.14`, MIT, oct-2026) declara soporte para OpenAPI 3.2, 3.1, 3.0 y Swagger 2.0. Aunque [`scalar#9694`](https://github.com/scalar/scalar/issues/9694) fue cerrado en `#9827` (7 ago 2026), el follow-up [`scalar#10235`](https://github.com/scalar/scalar/issues/10235) (17 sept 2026) demuestra regresiones residuales en `nullable` + `enum` al convertir 3.0→3.1. Por ello QAP **valida por dialecto nativo** (evitando upgrade lossy obligatorio) y ejecuta una suite de regresión propia en `EXP-05a`.

#### Contrato propuesto (`IExternalOperationPort` alineado a AV-04 §8)
UTCP y OpenAPI se mantienen **ambos desde el primer lanzamiento** como proveedores de descriptores detrás del puerto único agnóstico **`IExternalOperationPort`** (AV-04 §8), con **adopción por caso** cuando exista contrato acreditado y permiso efectivo (nunca imponer API al usuario ni forzar UI E2E para cada alta cuando exista operación autorizada).

- **Descriptor (`OperationDescriptor`):** `operation_id`, `source_kind: 'UTCP' | 'OPENAPI' | 'UI_AUTHORIZED'`, `contract_revision`, `contract_sha256`, `dialect` (`utcp-1.0`, `oas-3.0`, `oas-3.1`, `oas-3.2`), `target_origin`, `effective_scope` (`project/app/instance/env/tenant/role`), `mutability_class: 'READ_ONLY_ACCREDITED' | 'MUTATIVE_C2' | 'MUTATIVE_C3' | 'MUTATIVE_C4' | 'MUTATIVE_C5' | 'UNKNOWN_BLOCKED'`, `input_schema`, `output_schemas_by_status`, `idempotency_contract` (clave, ventana TTL, semántica de conflicto), `reconciliation_queries[]`, `cleanup_contract`, `credential_ref` (referencia opaca a bóveda; **cero secretos en descriptor ni al HOST**).
- **Invariantes de ejecución (heredados de AV-04 §§4–5, §8):**
  1. Antes de invocar, el núcleo valida permiso efectivo, vigencia de reserva/época (`lease`/`fencing`), presupuesto y persiste `OperationIntent` durable.
  2. **Prohibido el retry mutativo interno** en el SDK o adaptador HTTP (`retry: 0` en transporte). Todo reintento o compensación lo decide exclusivamente el núcleo de QAP tras reconciliación con testigo.
  3. **Salida tipada por subefecto:** `NOT_DISPATCHED_PROVEN | POSSIBLE_DISPATCH | REMOTE_ACCEPTED | PARTIAL_EFFECT | CONFIRMED_EFFECT | TERMINAL_DENIED | UNKNOWN_EFFECT`, con evidencia HTTP saneada (sin headers de auth/cookies/secretos) y correlación lógica.
  4. **Revocación inmediata:** `AbortSignal` ligado a la época/revocación de campaña; cortar un envío en vuelo jamás se traduce a `NOT_DISPATCHED_PROVEN` sino a `POSSIBLE_DISPATCH` / `UNKNOWN_EFFECT`.
  5. **Coexistencia API + UI:** un `DataPlan` DAG puede combinar pasos por API (UTCP/OpenAPI) y pasos por UI Playwright bajo el mismo grafo de intenciones, testigos y cleanup inverso. Si una operación carece de contrato API autorizado, el plan puede usar la vía UI autorizada; la vía UI **no suprime ni reemplaza** el requisito de capacidad UTCP/OpenAPI del producto.

#### Alternativas viables
1. **A1 (SDK oficial acotado):** `@utcp/sdk` + `@utcp/http` (MPL-2.0) encapsulados tras `IExternalOperationPort` con transporte HTTP propio inyectado (reutilizando anti-SSRF/no-redirect/no-retry de `reconnaissance/transport.ts`), deshabilitando `CodeMode`, `cli`, `file` y `dotenv`.
2. **A2 (Adaptador HTTP gobernado propio compatible con UTCP):** parser/validador Zod/Ajv del esquema `UtcpManual` / `CallTemplate` (`http`) en TypeScript puro (licencia `ISC`, cero dependencias MPL-2.0) + el mismo motor HTTP gobernado que sirve a OpenAPI.
- **Criterio de selección:** se decide empíricamente en **`EXP-05a` (G0)** midiendo fidelidad al estándar UTCP, control real de transporte/auth/cancelación, superficie de dependencias y dictamen de licencia MPL-2.0 en AV-07.

#### Riesgos residuales y compuertas
- **Riesgos residuales:** APIs corporativas con esquemas OpenAPI desactualizados o sin contrato de idempotencia; cambio de versión en especificación UTCP. Mitigación: detección de deriva contractual (`AR-48`) y abstención ante efecto incierto sin deduplicación acreditada (`AV-04 §4`).
- **Compuertas:** `EXP-05a` en **G0** (antes de congelar puerto/adaptador); `EXP-05b` en **G3** (DAG completo, corte, reconciliación y limpieza); `DE-04` pendiente por destino real.

---

### 2.4 AR-18 · Consulta y transferencia controlada de condiciones cross-instancia

- **Severidad:** **Crítica** · **Estado principal conservado:** `PENDIENTE` · **Fase:** Antes de habilitar referencias por destino · **Dependencias:** AV-02, AV-04, AV-08 · **Requisitos:** `REQ-XINST-001`, `REQ-DAT-001.3`, `REQ-SEG-001.1–001.2` (D07, D09, D20).

#### Evidencia verificable
1. **Línea base en `develop`:** no existe contrato integrado de lectura cross-instancia (`catalogo-requisitos.md:867`). En `packages/mcp/src/handlers/test.handler.ts:45,488–496` el manejo de mutaciones está acoplado de forma binaria (bloqueo total en MCP vs. permiso abierto en CLI), incompatible con D07/D09.
2. **Invariantes previos de AV-02 (`AR-31`) y AV-04 (`AR-10`):** ni el nombre del entorno (`staging`, `prod`, `ref`) ni el verbo HTTP `GET` ni una consulta GraphQL garantizan inmutabilidad. `DE-04` permanece abierta por destino real; durante esta auditoría **no se accede a Lendus ni a ningún AUT empresarial**.

#### Contrato propuesto (`CrossInstanceReferencePolicy` y `ControlledConditionTransfer`)
1. **Aislamiento estricto de perfiles y bóveda:**
   - La instancia origen (`reference_instance`, p. ej. producción o referencia corporativa) y la instancia destino (`qa_target_instance`) poseen **perfiles, bóvedas de credenciales, cookies, `BrowserContext` y pools HTTP completamente disjuntos**.
   - Prohibición técnica dura (`fail-closed`): el motor rechaza cualquier operación donde `source_credential_ref === target_credential_ref`, donde exista reenvío de tokens/sesiones/grants entre orígenes, o donde una redirección HTTP intente cruzar de origen autorizado a otro host.
2. **Lectura acreditada en destino (deny-by-default):**
   - Toda consulta en `reference_instance` exige estar en un **catálogo de operaciones acreditadas como `READ_ONLY_ACCREDITED`** (verificado por perfil de permisos efectivos en el destino, p. ej. rol/token de solo lectura a nivel de API/sistema, no por etiqueta de entorno).
   - Incluso `GET`, `HEAD`, `OPTIONS`, consultas GraphQL (`query` vs `mutation`) y recursos automáticos disparados por UI (telemetry beacons, webhooks, precargas) pasan por la guarda de lectura acreditada; cualquier endpoint desconocido o con efecto lateral potencial se bloquea (`BLOCKED_UNACCREDITED_READ`).
3. **Autoridad por campo, minimización y transformación controlada:**
   - Se define un **manifiesto de transferencia por campo y propósito** (`TransferSchema`): clasifica cada atributo como `CONFIG_RULE` (tasas, plazos, catálogos, reglas de negocio — transferible), `STRUCTURAL_TEMPLATE` (estructura sin datos personales — transferible), `SENSITIVE_TRANSFORM` (debe sintetizarse/pseudonimizarse determinísticamente antes de salir del plano de lectura) o `FORBIDDEN_PII_SECRET` (PII, credenciales, sesiones, grants, folios fiscales reales — **bloqueo duro**).
   - **Trazabilidad obligatoria:** cada condición transferida al destino QA conserva `{ source_instance_id, source_revision, extracted_at, operation_id, field_mapping_version, purpose, transformation_applied, target_qa_authorization_id }`.
   - **Escritura exclusiva en QA autorizado:** las condiciones derivadas/sintetizadas solo pueden escribirse en `qa_target_instance` con autorización vigente (D07) y nunca de vuelta en la instancia de referencia.
4. **Reglas divergentes, conflictos y testigo de no-mutación:**
   - Cuando la configuración observada en `reference_instance` diverge de la documentación (D10) o del destino QA, QAP registra la discrepancia explícita (`CROSS_INSTANCE_DRIFT`) con procedencia de ambas fuentes sin sobrescribir silenciosamente ninguna.
   - Donde el destino lo permita, se exige un **testigo independiente pre/post de no-mutación** (conteo, hash de estado/versión/audit-log de la entidad consultada) para acreditar cero efectos en la instancia origen (verificado en `EXP-05b`).

#### Alternativas viables
- **Ruta principal:** Consulta directa de solo lectura acreditada vía `IExternalOperationPort` (API/UTCP/OpenAPI o UI con sesión `read_only_reference` aislada) con manifiesto de minimización y transformación.
- **Alternativa cuando se bloquea acceso directo a la instancia origen:** **exportación saneada autorizada** (archivo JSON/YAML/CSV/Excel de configuración exportado fuera de banda por el propietario y validado con el mismo `TransferSchema` y trazabilidad de origen/versión). **Regla vinculante:** esta exportación saneada es una alternativa operativa para entornos cerrados, **no sustituye** la capacidad de consulta real cross-instancia allí donde el propietario la autorice.

#### Riesgos residuales y compuertas
- **Riesgos residuales:** Un endpoint etiquetado como `GET` en un sistema legado puede tener efectos secundarios ocultos (auditoría con bloqueo, consumo de secuencia, caché mutada) si el proveedor no acreditó su semántica. Mitigación: acreditación obligatoria por operación en `DE-04` + bloqueo por defecto.
- **Compuertas:** Verificación en fixture sintético en **G3 (`EXP-05b` + `E2`/`E5`)**; habilitación en destinos empresariales reales estrictamente condicionada a autorización explícita por destino **`DE-04`** (AV-08 / G6.5).

---

### 2.5 AR-22 · Dependencias, seguridad de documentos no confiables y resolución de HN-05 / C-02

- **Severidad:** Alta · **Estado principal conservado:** `PENDIENTE` · **Fase:** Antes de seleccionar parsers G0–G2 · **Dependencias:** AV-02, AV-07 · **Requisitos:** `REQ-DOC-001.1`, `REQ-DAT-001.2`, `REQ-QA-002`.

#### Auditoría de dependencias, versiones exactas y advisories primarios (resolución de HN-05 y C-02)
| Paquete | En `pnpm-lock.yaml` (`e8a9fc45`) | Licencia verificada | Advisories primarios verificados (nov-2026) | Clasificación y resolución |
| --- | --- | --- | --- | --- |
| [`mammoth`](https://www.npmjs.com/package/mammoth) | **No instalado** | `BSD-2-Clause` ([deps.dev](https://deps.dev/npm/mammoth)) | **`CVE-2025-11849`** ([GHSA-rmjr-87wv-gf87](https://github.com/advisories/GHSA-rmjr-87wv-gf87)): Directory Traversal vía `r:link` en `< 1.11.0`. Además en 2026 ([Aikido Intel](https://intel.aikido.dev/packages/npm/mammoth)): `AIKIDO-2026-74622` (DoS `1.3.0–1.12.2`), `AIKIDO-2026-910675` (Path Traversal `0.2.0–1.12.0`), `AIKIDO-2026-935898` (DoS `1.4.8–1.12.0`). Última: `1.13.0` (sept-2026). | **Riesgo preventivo** (no presente hoy). Resuelve **HN-05**: fijar `>= 1.13.0` (tras validación G2), deshabilitar resolución `r:link`/externa y ejecutar en subproceso confinado sin red. |
| [`@scalar/openapi-parser`](https://www.npmjs.com/package/@scalar/openapi-parser) | **No instalado** | `MIT` ([GitHub Scalar](https://github.com/scalar/scalar)) | **`scalar#9694`** ([issue #9694](https://github.com/scalar/scalar/issues/9694), `nullable` en `$ref`/`allOf` OAS 3.0→3.1) **fue cerrado en PR `#9827` el 7 ago 2026** (confirmando corrección parcial de `C-02`). **Sin embargo**, [`scalar#10235`](https://github.com/scalar/scalar/issues/10235) (17 sept 2026, `@scalar/openapi-parser@0.29.1`/`upgrader@0.2.15`) evidencia bugs residuales en `nullable` + `enum`. Última: `0.29.14` (oct-2026). | **Resuelve discrepancia HN-05 vs. C-02:** `#9694` no está abierto, pero tampoco es seguro asumir cobertura 3.0/3.1/3.2 libre de defectos. Validar versión exacta en `EXP-05a` con suite de regresión y validación por dialecto nativo. |
| [`exceljs`](https://www.npmjs.com/package/exceljs) / [`exceljs-community`](https://www.npmjs.com/package/exceljs-community) | **No instalado** | `MIT` | `exceljs@4.4.0` sin CVEs activos en [Snyk](https://security.snyk.io/package/npm/exceljs), pero **sin publicación desde oct-2023 (3 años)**. `exceljs-community@5.2.0` (sept-2026) es drop-in mantenido. | **Riesgo preventivo de mantenimiento.** Evaluar `exceljs-community` vs `exceljs@4.4.0` en `EXP-06b` / AV-07; nunca asumir recálculo en ninguno. |
| [`xlsx` (SheetJS npm)](https://security.snyk.io/package/npm/xlsx/0.18.5) | **No instalado** | `Apache-2.0` | Congelado en `0.18.5` en npm con **`CVE-2023-30533`** (Prototype Pollution) y **`CVE-2024-22363`** (ReDoS) ([revisión Safeguard.sh](https://safeguard.sh/resources/blog/npm-xlsx)). Parches solo vía CDN fuera de npm. | **Prohibido instalar `xlsx` desde npm.** Descartado como candidato por higiene de cadena de suministro. |
| [`pdfjs-dist`](https://www.npmjs.com/package/pdfjs-dist) | **No instalado** | `Apache-2.0` | Última `6.5.438` (1 nov 2026). Riesgo inherente de parsers PDF complejos (objetos malformados, JS embebido, streams recursivos). | **Riesgo preventivo.** Ejecutar en subproceso aislado sin JS/XFA/acciones externas (`isEvalSupported: false`). |
| [`tesseract.js`](https://www.npmjs.com/package/tesseract.js) | **No instalado** | `Apache-2.0` | Descarga por defecto `.traineddata` desde CDN externa (`cdn.jsdelivr.net`). | **Riesgo preventivo de egress.** Obligatorio modo 100 % offline con `langPath` local verificado por SHA-256. |
| [`yaml`](https://www.npmjs.com/package/yaml) vs. [`js-yaml`](https://github.com/advisories/GHSA-52cp-r559-cp3m) | **Instalados:** `yaml@2.9.0`; `js-yaml@4.3.1` y `5.4.1` (transitivas) | `yaml`: `ISC`; `js-yaml`: `MIT` | `js-yaml` registró `CVE-2025-64718` (`<4.1.1`, [GHSA-mh29-5h37-fv8m](https://github.com/advisories/GHSA-mh29-5h37-fv8m)) y DoS cuadrático por merge-keys (`CVE-2026-59869` [GHSA-52cp-r559-cp3m](https://github.com/advisories/GHSA-52cp-r559-cp3m), `CVE-2026-84375` [GitLab Advisory](https://advisories.gitlab.com/npm/js-yaml/CVE-2026-84375/)). | **Vulnerabilidad/riesgo presente en árbol transitivo.** QAP usa exclusivamente `yaml@2.9.0` con `merge: false` y `maxAliasCount` acotado para documentos no confiables; AV-07 audita `js-yaml` transitivo. |
| [`ajv`](https://www.npmjs.com/package/ajv) | **Instalado:** `8.20.0` (directa) y `6.15.0` (transitiva) | `MIT` | `CVE-2025-69873` afectó `<=8.17.1`, parcheado en `8.18.0` ([ajv#2581](https://github.com/ajv-validator/ajv/issues/2581)). `8.20.0` limpia en [Snyk](https://security.snyk.io/package/npm/ajv/8.20.0). | **Presente y parcheada en directa (`8.20.0`).** Transferir revisión de `ajv@6.15.0` transitiva a AV-07. |
| [`@utcp/sdk`](https://github.com/universal-tool-calling-protocol/typescript-utcp) | **No instalado** | **`MPL-2.0`** | Sin CVE público identificado en búsqueda primaria; superficie de riesgo por `CodeMode` y plugins `cli`/`file`/`dotenv`. | **Riesgo preventivo de licencia y superficie.** Evaluar en `EXP-05a` y transferir cumplimiento MPL-2.0 a AV-07. |

#### Contrato de aislamiento para documentos no confiables (frontera efectiva de SO, no solo Node Worker)
Un `worker_threads` de Node.js **no constituye una frontera de seguridad suficiente** (comparte espacio de direcciones del proceso, credenciales de proceso, descriptores de red y privilegios de sistema de archivos). El contrato exige:
1. **Frontera de subproceso aislado sin red:** cada tarea de parsing/renderizado/OCR de un documento no confiable corre en un **proceso hijo dedicado** lanzado con entorno saneado (cero variables de secretos/tokens), directorio de trabajo confinado de solo lectura sobre una copia temporal del archivo (`--permission` / seccomp / AppArmor en Linux, Seatbelt/sandbox en macOS, Job Object con token restringido en Windows — alineado a AV-02/AV-07) y **sin acceso de red**.
2. **Cuotas y defensas estructurales obligatorias antes y durante el parsing:**
   - **Límites duros:** tamaño máximo de archivo comprimido y descomprimido (relación anti-ZIP-bomb p. ej. `max_ratio <= 100:1`, `max_entries`, `max_uncompressed_bytes`), tiempo wall-clock y CPU (`timeout` con `SIGKILL` / `TerminateJobObject`), techo de memoria RAM (`--max-old-space-size` + límite de SO), profundidad máxima de recursión XML/JSON/YAML y número máximo de alias YAML (`maxAliasCount`).
   - **Controles anti-ataque documental:** prohibición total de entidades externas XML (XXE / DTD), desactivación de `r:link`/relaciones externas en OOXML (DOCX/XLSX), prohibición de macros VBA/XLM, JavaScript embebido en PDF (`isEvalSupported: false`), DDE, enlaces remotos automáticos, detección y rechazo de *path traversal* (`..`, rutas absolutas, symlinks) en entradas ZIP, y detección de referencias cíclicas en `$ref` o fórmulas.
   - **Defensa contra *Prompt Injection* documental:** todo contenido extraído de documentos o reportes del AUT se etiqueta como **`UNTRUSTED_DATA`** (plano documental/observación), jamás se interpola en instrucciones de sistema ni puede otorgar permisos, modificar políticas, disparar herramientas ni promover reglas sin acreditación normativa.
3. **Resolución de referencias externas en OpenAPI (`$ref`):**
   - **Política `deny-by-default`:** toda `$ref` remota (`http://`, `https://`, `file://`) queda rechazada por defecto.
   - Solo se resuelve si coincide con un **catálogo local acreditado o allowlist explícita de orígenes**, aplicando el transporte endurecido de `reconnaissance/transport.ts` (bloqueo de IP privadas/loopback/link-local/metadata anti-SSRF, DNS pinning, sin auto-redirect cross-origin, límites de tamaño/tiempo) y **nunca enviando credenciales o secretos de la bóveda a URLs descubiertas dentro de un documento**.
4. **Saneamiento y preservación de bytes:** los bytes originales y su `sha256` se conservan en custodia controlada (según política de retención/privacidad) sin modificar el archivo original; toda representación renderizada (HTML/MD/CSV) pasa por saneamiento estricto antes de mostrarse.
5. **Transferencia a AV-07:** no se congelan versiones definitivas sin pasar `EXP-05a`/`EXP-06b` ni auditoría de árbol de licencias (`ISC`, `MIT`, `BSD-2-Clause`, `Apache-2.0`, `MPL-2.0`, exclusión de `GPLv3`) en AV-07.

---

### 2.6 AR-48 · Pruebas de APIs con verificación de efectos reales

- **Severidad:** Alta · **Estado principal conservado:** `PENDIENTE` · **Fase:** Antes de conectar validadores al runner · **Dependencias:** AV-02, AV-04 · **Requisitos:** `REQ-QA-002`, `REQ-DAT-001.2`, `REQ-ORA-001.2` (D08, D12).

#### Evidencia verificable
- En `develop`, `packages/playwright-adapter/src/network-observer/service.ts` realiza observación pasiva de red y `reconnaissance/transport.ts` hace reconocimiento `GET`, pero **no existe validador integrado de contratos API** (`catalogo-requisitos.md:891`).
- En los antecedentes (`Hydrogen R2` / `Recovery`, D12), un `HTTP 201` con rollback posterior generó un **falso `PASS`**, demostrando que conformidad de contrato HTTP y efecto de negocio persistido son dimensiones estrictamente separadas.

#### Contrato propuesto (`ApiContractAndEffectVerifier`)
1. **Separación en 4 capas no intercambiables:**
   - **(1) Tráfico observado pasivamente (`PassiveTrafficObservation`):** captura peticiones/respuestas durante Discovery/UI (sanitizando tokens/cookies vía `network-observer/privacy.ts`). **Regla dura:** el tráfico pasivo **jamás autoriza replay ni mutación**; solo alimenta inventario observado y detección de deriva estructural.
   - **(2) Inventario de operaciones (`OperationInventory`):** cruza operaciones declaradas en contratos acreditados (OpenAPI/UTCP) contra tráfico observado, clasificando cada operación en: `DECLARED_AND_OBSERVED`, `DECLARED_NOT_OBSERVED` (equivalente a `DOCUMENTED_NOT_OBSERVED`, nunca eliminada), `OBSERVED_UNDOCUMENTED` (endpoint oculto/no documentado) y `CONTRACT_DRIFT` (contrato desfasado).
   - **(3) Cumplimiento estructural de contrato (`ContractComplianceResult`, alcance `STRUCTURAL`):** valida contra el dialecto exacto (`OAS 3.0 / 3.1 / 3.2` o `UTCP`) el método, ruta, parámetros (query/path/header/cookie), `Content-Type`, código HTTP, headers contractuales, versión de API, paginación y esquemas de request/response (usando `ajv@8.20.0` + normalizador por dialecto).
   - **(4) Prueba funcional de efecto real (`EffectVerificationResult`, alcance `FUNCTIONAL_EFFECT` / `CROSS_CONCILIATED`):** exige un testigo independiente **N2 o N3** (AV-04 §3) para acreditar persistencia, actualización, borrado, no-mutación o rechazo RBAC. **Un `HTTP 2xx` nunca equivale por sí solo a `PASS` funcional** (se queda en `N0` o `STRUCTURAL`).
2. **Matriz de casos obligatorios:**
   - **Positivos:** alta/consulta/actualización/borrado autorizados con verificación de esquema + testigo de efecto + cleanup.
   - **Negativos de validación y contrato:** payloads inválidos, tipos/rangos límite, `Content-Type` incorrecto, versión obsoleta, paginación límite (página vacía, cursor inválido, duplicados entre páginas).
   - **Auth/RBAC negativo:** token expirado/inválido (`401`), rol/tenant no autorizado (`403`/`404` según política del destino) + **testigo de no-mutación y no-divulgación** (detectando **mutación silenciosa** tras `403` o `500`, conforme AV-04 §7).
   - **Idempotencia y reconciliación:** envío duplicado con misma clave de idempotencia y corte de respuesta tras commit remoto (`EXP-05b`).
   - **Seguridad de evidencias:** redacción obligatoria previa al almacenamiento de `Authorization`, `Cookie`, `Set-Cookie`, `X-API-Key`, tokens OAuth y campos marcados como secretos/PII en logs, contratos y paquetes de evidencia.
3. **Integración con AV-04 (`AR-08/09/10/52`):** cada afirmación estructural y funcional se registra por separado en el sobre versionado de AV-04; una campaña con solo conformidad de contrato sin efecto funcional exigido cierra con código `16` (`STRUCTURAL_ONLY_NO_FUNCTIONAL_PASS`) si el objetivo era estructural, o `15` (`INCOMPLETE_OBLIGATION`) si faltó cubrir una obligación funcional.

#### Alternativas viables, riesgos y compuertas
- **Alternativas:** validación en proceso con `ajv@8.20.0` + `@scalar/openapi-parser` (ruta principal) vs. `zod` dinámico generado desde JSON Schema (respaldo si algún dialecto 2020-12 presentara incompatibilidad, sujeto a `EXP-05a`).
- **Riesgos residuales:** endpoints sin contrato OpenAPI/UTCP ni testigo alternativo no pueden acreditarse automáticamente (quedan en `INDETERMINATE` o `STRUCTURAL` según evidencia).
- **Compuertas:** validación de dialectos en **G0 (`EXP-05a`)**, integración con runner y testigos en **G3 (`EXP-05b` + `E5`)**.

---

### 2.7 AR-50 · Reportes propios de QAP, evidencias y exportación portable

- **Severidad:** Alta · **Estado principal conservado:** `PENDIENTE` · **Fase:** Antes de validar publicación y reporte · **Dependencias:** AV-02, AV-04, AV-06 · **Requisitos:** `REQ-REP-001.1–001.4`, `REQ-RUN-001.6`, `POL-RET-001`, `M1–M5` (D18, D19, D20).

#### Evidencia verificable en `develop` (`e8a9fc45`)
1. **Dependencias externas CDN en visor:** `packages/reporter/src/template/index.html:13–19` carga `https://fonts.googleapis.com`, `https://fonts.gstatic.com` y `https://cdn.tailwindcss.com?plugins=forms`. Esto rompe el requisito de paquete offline saneado sin egress de red.
2. **XSS potencial en visor:** `template/index.html` interpola campos del AUT/definiciones (`${mod.name}`, `${cap.name}`, `${g.description}`, `${r.run_id}`) directamente en `innerHTML` sin escape HTML.
3. **Brecha de formatos y esquema AV-04:** `packages/reporter/src/generators/` carece de generadores **CSV** y **JSONL** exigidos por D19; `html-report.ts:61–66` y `markdown-report.ts:12–17` solo representan 4 estados legados (`passed`, `failed`, `skipped`, `not_run`), omitiendo los 6 veredictos, 4 ejes, códigos `exit_code_schema_version = "2.0"`, obligaciones, testigos, atestación, cleanup y `DefectManager` (`REQ-REP-001.3–001.4` ausentes).
4. **Vulnerabilidades conocidas en visor local (`server.ts`):** confirmadas en `server.ts:59–61` (`ACAO: *`, `DELETE`), `144–153` (`DELETE /api/runs/:runId` sin auth), `71,128,227` (doble `decodeURIComponent`), `277` (`isAbsolute(safePath)`) y `315` (`Cache-Control: public, max-age=3600`).
5. **Desalineación de retención:** `pruning-engine.ts:52–56` usa `VIDEO_MS: 7d`, `TRACE_MS: 14d`, `RECORD_MS: 30d`, contradiciendo D19 (resumen permanente + detalle 90 días; TTLs de media/trazas sujetos a ratificación `DE-01`).

#### Contrato propuesto (`QapReportManifest` y `PortableExportBundle`)
1. **Distinción estricta:** los reportes emitidos por el AUT (`AR-20/38`, objeto bajo prueba) nunca se confunden con los reportes propios de QAP (`AR-50`, salida de auditoría y evidencia de QAP).
2. **DTO y manifiesto común del ejecutor (`QapReportManifest v2.0`):**
   - Fuente única de verdad consumida por **MCP, CLI y visor local** (garantizando misma identidad, veredicto, ejes y códigos).
   - Incluye: `schema_version`, `run_id`, `attempt_id`, `plan_revision`, `plan_sha256`, `scope_vector` (con `locale/timezone/currency`), estado operacional (`open | terminal`), **6 veredictos funcionales**, **4 ejes** (`technical_status`, `functional_verdict`, `cleanup_status`, `evidence_health`), `verification_scope` y nivel de testigo `N0–N3`, mapa de cumplimiento por obligación y denominadores, procedencia, **atestación/firma de manifiesto** (AV-02/AV-04), libro de efectos y cleanup, historia de defectos/retests (`REQ-REP-001.3–001.4`), `secondary_flags`, `campaign_result_code` actual vs. `sealed_campaign_result_code` histórico y registro de `prune_events` / ausencias por política.
3. **Formatos obligatorios y reglas de saneamiento:**
   - **HTML:** autocontenido o paquete con recursos relativos estrictamente locales (`./assets/...`), **cero CDN**, **cero fuentes/scripts remotos**, CSP estricta (`default-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; script-src 'self'`), escape HTML exhaustivo en todo valor interpolado y soporte de localización (`D17`: etiquetas localizables manteniendo códigos estructurados independientes del idioma).
   - **Markdown:** escape completo de caracteres de control Markdown (`|`, `` ` ``, `[`, `]`, `<`, `>`, saltos de línea) evitando inyección de HTML/enlaces arbitrarios.
   - **CSV (para hojas de cálculo):** cumplimiento de RFC 4180 + mitigación [**OWASP CSV Injection / CWE-1236**](https://cwe.mitre.org/data/definitions/1236.html): toda celda textual cuyo primer carácter sea `=`, `+`, `-`, `@`, `\t` o `\r` se neutraliza (p. ej. prefijo tabulación/apóstrofo dentro de campo entrecomillado conforme [OWASP CSV Injection](https://community.owasp.org/attacks/CSV_Injection)), advirtiendo explícitamente en el manifiesto que el CSV es vista tabular saneada y **JSON/JSONL** es el formato íntegro sin alteración para consumo programático.
   - **JSON y JSONL:** serialización canónica UTF-8 sin mutación de valores; decimales exactos como cadenas tipadas (AV-04 §2); `JSONL` para streaming de eventos/pasos/discrepancias masivas.
4. **Dos perfiles explícitos de exportación (D18/D19):**
   - **`SANITIZED_PORTABLE_BUNDLE` (por defecto):** export manual o archivo automático configurable; **excluye automáticamente** secretos, credenciales y toda evidencia multimedia `PRIVATE_AUTHORIZED` no autorizada para export; contiene solo rutas relativas confinadas (`./manifest.json`, `./report.html`, `./report.md`, `./summary.csv`, `./events.jsonl`, `./media/...` autorizados) y `checksums.sha256` + firma de manifiesto verificable offline.
   - **`PRIVATE_AUTHORIZED_EXPORT` (opt-in explícito con permiso de exportación distinto del de captura/acceso, D18):** requiere autorización vigente específica (`export_authorized`), queda registrado en auditoría, y **declara explícitamente que QAP no puede revocar criptográfica ni físicamente copias ya exportadas fuera de su custodia**, ni certificar evidencia que haya sido podada posteriormente.
5. **Visor local autenticado (AR-24/27) y verificación de integridad:**
   - Remediación G0 heredada de AV-02 (`AR-24`): solo `127.0.0.1`, token por sesión, solo lectura (sin `DELETE`), sin `ACAO: *`, sin doble `decodeURIComponent`, sin `isAbsolute`, `Cache-Control: private, no-store`, soporte HTTP `Range` (`206`/`416`) sobre contenedores cifrados por bloques (Chunked AEAD de AV-02).
   - **Revisión actual vs. sello histórico:** al verificar un paquete o reporte histórico, QAP muestra el `sealed_campaign_result_code` original junto con la verificación actual de firma/manifiesto e integridad de bytes (`present | missing | pruned | suppressed` y `match | mismatch | unchecked`), sin reescribir el veredicto histórico por poda autorizada (`D19`).
   - **Portabilidad y accesibilidad:** un paquete `SANITIZED_PORTABLE_BUNDLE` movido a otra ruta o a otro SO (Windows/macOS/Linux) debe abrirse con **cero peticiones de red (cero egress)**, conservar todos los enlaces relativos y filtros de discrepancias, y cumplir requisitos base de accesibilidad propia (semántica HTML, contraste, navegación por teclado; verificación integral transferida a **AV-06 / `EXP-06c`** y **AV-08**). No se reabren acuerdos de captura (D18) ni de retención base (D19; TTL/cuotas y export privada permanecen sujetos a `DE-01` / `DE-02`).

---

## 3. Contratos de integración transversales

### 3.1 Contrato de extracción documental y validación de reportes (`DocumentExtractionEnvelope` y `ReportValidationResult`)

```ts
export interface DocumentLocator {
  doc_sha256: string;
  doc_revision: string;
  format: 'pdf' | 'docx' | 'xlsx' | 'md' | 'txt' | 'json' | 'yaml' | 'openapi';
  page?: number;
  bbox?: [number, number, number, number];
  sheet?: string;
  cell_range?: string;
  section_path?: string[];
  json_pointer?: string;
  line_range?: [number, number];
}

export interface DocumentExtractionEnvelope {
  schema_version: '1.0';
  document_id: string;
  source_sha256: string;
  sandbox_profile: 'OS_SUBPROCESS_NO_NET';
  parser_id: string;
  parser_version: string;
  ocr_used: boolean;
  ocr_confidence_summary?: { min: number; median: number; locale: string };
  nodes: Array<{
    node_id: string;
    kind: 'heading' | 'paragraph' | 'table' | 'cell' | 'schema' | 'image_region';
    locator: DocumentLocator;
    content: unknown;
    extraction_status: 'EXTRACTED' | 'OCR_EXTRACTED' | 'PARTIAL' | 'UNREADABLE' | 'UNSUPPORTED_CONSTRUCT';
  }>;
  extraction_gaps: Array<{
    locator: DocumentLocator;
    reason: string;
    blocks_assertions: boolean;
  }>;
}

export type ExcelCellState =
  | 'LITERAL_VALUE'
  | 'FORMULA_WITH_VERIFIED_CACHE'
  | 'FORMULA_STALE_OR_CONFLICTING_CACHE'
  | 'FORMULA_WITHOUT_CACHE'
  | 'FORMULA_ERROR_VALUE'
  | 'FORMULA_UNSUPPORTED';

export interface ReportAssertionEvaluation {
  assertion_id: string;
  report_artifact_sha256: string;
  locator: DocumentLocator;
  cell_state?: ExcelCellState;
  displayed_text?: string;
  raw_or_cached_value?: string;       // decimal/date/string tipado, nunca float implícito
  formula_expression?: string;
  independent_business_calc?: string; // decimal exacto vía TypedRuleOracle + decimal.js
  accredited_expectation?: string;
  precision_rule_ref?: string;        // fuente vigente de redondeo/escala/tolerancia/zona
  witness_level: 'N0' | 'N1' | 'N2' | 'N3' | null;
  verdict: 'PASS' | 'FAIL' | 'INDETERMINATE' | 'BLOCKED' | 'ERROR' | 'SKIPPED';
  discrepancy_kind?:
    | 'MISSING_ROW' | 'DUPLICATE_ROW' | 'IGNORED_FILTER' | 'FORMULA_CACHE_MISMATCH'
    | 'ROUNDING_OR_CALC_ERROR' | 'DATE_SYSTEM_MISMATCH' | 'SIGN_ERROR'
    | 'ORDER_VIOLATION' | 'TRUNCATED_OUTPUT' | 'UNVERIFIABLE_EXTRACTION';
}
```

### 3.2 Contrato de operación externa (`IExternalOperationPort`) y reporte QAP (`QapReportManifest`)
- **`IExternalOperationPort`:** implementa fielmente la entrega de AV-04 §8 (`enmiendas-av04.md:165`): `describe()`, `authorize(intent, lease, policy)`, `invoke(intent, abortSignal)` (con `retry = 0` interno), `reconcile(intent, witnessPolicy)` y `cleanup(effectRecord, cleanupAuth)`. Todos los proveedores (`OpenApiAdapter`, `UtcpHttpAdapter`, `UiAuthorizedAdapter`, `CrossInstanceReadAdapter`) producen el mismo sobre de subefectos tipados y evidencias HTTP redactadas.
- **`QapReportManifest`:** consume directamente el sobre versionado `exit_code_schema_version = "2.0"` de AV-04 §§1–2, añadiendo `export_profile: 'SANITIZED_PORTABLE_BUNDLE' | 'PRIVATE_AUTHORIZED_EXPORT'`, tabla de archivos relativos con `sha256`, firma del manifiesto, estado de verificación en frío y bandera `contains_private_media: boolean`.

---

## 4. Matriz trazable: formatos, casos, obligaciones, alternativas y compuertas

| Registro | Obligación / Capacidad | Ruta candidata principal | Alternativa viable (sin suprimir obligación) | Compuerta de selección / integración / certificación | Transferencia a AV-06 / AV-07 / AV-08 |
| --- | --- | --- | --- | --- | --- |
| **AR-13** | Ingesta D10 (8 formatos + tablas + OCR local + cobertura) | `pdfjs-dist` + `mammoth >= 1.13.0` + lector OOXML + `exceljs-community`/`exceljs` + `yaml@2.9.0` + `@scalar/openapi-parser` + `tesseract.js` offline | OCR nativo local `tesseract` opt-in tras `IOcrAdapter` | **G2** (corpus D10) → **G3** (reconciliación) → **G6/E8** | AV-07 (licencias/empaquetado `tessdata`); AV-08 (corpus D10). |
| **AR-20 / AR-38** | Validación funcional PDF/Excel, 6 estados de celda, decimal exacto | `pdfjs-dist` + `exceljs-community`/`exceljs` + evaluador acotado en `decimal.js` + `TypedRuleOracle` | `LibreOffice Calc` headless aislado opt-in para fórmulas fuera de subconjunto (no infalible) | **G2 (`EXP-06b`)** → **G3** (integración E2E) → **G6/E8** (corpus ciego) | AV-06 (rendimiento en reportes grandes); AV-07 (licencias/aislamiento); AV-08 (mutantes de negocio). |
| **AR-17** | UTCP + OpenAPI en primer lanzamiento + `DataPlan` | `@scalar/openapi-parser` + `@utcp/sdk`/`@utcp/http` (si supera `EXP-05a`) sobre transporte anti-SSRF propio | Adaptador HTTP gobernado propio compatible con esquema UTCP (`ISC`, sin MPL-2.0) | **G0 (`EXP-05a`)** → **G3 (`EXP-05b`)** → **G6/E8** | AV-07 (cumplimiento `MPL-2.0` / selección SDK); AV-08 (DE-04). |
| **AR-18** | Lectura cross-instancia acreditada y transferencia mínima | `CrossInstanceReadAdapter` con bóveda/perfil disjunto, lectura acreditada y `TransferSchema` | Exportación saneada autorizada fuera de banda (solo cuando se bloquea acceso directo) | **G3 (`EXP-05b` + `E2`/`E5`)** → **G6.5 (`DE-04` por destino)** | AV-02/AV-08 (autorización por destino `DE-04` y no-egress). |
| **AR-22** | Seguridad de documentos no confiables y advisories | Subproceso SO aislado sin red + cuotas ZIP/XML/CPU/RAM + `$ref` deny-by-default | Contenedor/sandbox más estricto por plataforma definido en AV-07 | **G0–G2** (previo a congelar parsers) → **G5** (empaquetado) | AV-02 (frontera proceso/SSRF); AV-07 (sandbox SO, lockfile, SBOM/licencias). |
| **AR-48** | Pruebas de API con contrato separado de efecto | `ajv@8.20.0` + normalizador por dialecto OAS 3.0/3.1/3.2 + testigos N2/N3 | Validador por dialecto alterno si `EXP-05a` detecta brecha en 2020-12 | **G0 (`EXP-05a`)** → **G3 (`EXP-05b` + `E5`)** → **G6/E8** | AV-04/AV-08 (separación `STRUCTURAL` vs `FUNCTIONAL_EFFECT`). |
| **AR-50** | Reportes propios QAP, visor autenticado, export portable | `QapReportManifest v2.0` + generadores HTML/MD/CSV/JSON/JSONL offline + visor remediado | — (formatos D19 y visor seguro son obligatorios) | **G0** (remediación `server.ts`) → **G3** (generadores) → **G5 (`EXP-06c`)** | AV-06 (rendimiento, medios, accesibilidad y `EXP-06c`); AV-07 (empaquetado offline); AV-08 (`DE-01`/`DE-02`). |

---

## 5. Protocolos experimentales detallados (EXP-05a, EXP-05b, EXP-06b)

Todos los experimentos operan **exclusivamente sobre fixtures sintéticos locales aislados** (cero acceso a Lendus ni a sistemas empresariales), con versiones fijadas por hash, reloj/zona congelados y observador externo independiente (alineado a `protocolos-av04.md`).

### 5.1 EXP-05a · Factibilidad, licencias y contratos UTCP/OpenAPI (Compuerta: **G0**, antes de congelar `IExternalOperationPort`)
- **Hipótesis:** Un único puerto `IExternalOperationPort` puede ejecutar contratos OpenAPI (`3.0.3`, `3.1.1`, `3.2.0`/`3.2.1`) y manuales UTCP (`1.0`) con paridad de esquemas, control estricto de auth/SSRF/cancelación, cero retries mutativos internos y claridad de licencias.
- **Brazos de prueba:**
  - **Brazo A:** `@utcp/sdk` + `@utcp/http` encapsulados tras `IExternalOperationPort` (con `CodeMode`, `cli`, `file`, `dotenv` deshabilitados) + `@scalar/openapi-parser` + `ajv@8.20.0`.
  - **Brazo B:** Adaptador HTTP gobernado propio para `UtcpManual`/`CallTemplate` (`http`) en TypeScript `ISC` reutilizando `reconnaissance/transport.ts` + `@scalar/openapi-parser` + `ajv@8.20.0`.
- **Corpus de fixtures sintéticos:**
  1. Contratos OpenAPI **3.0.3** con `nullable: true` inline, en `$ref`/`allOf` (`scalar#9694`) y combinado con `enum` (`scalar#10235`); **3.1.1** con `type: ["string", "null"]` y `$ref` con hermanos; **3.2.0/3.2.1** con `$self`, tags jerárquicos y `additionalOperations`.
  2. Manual UTCP HTTP con `ApiKeyAuth`, `BearerAuth` y intento malicioso de escalada de protocolo (`call_template_type: "cli"` dentro de manual HTTP) que debe ser bloqueado.
  3. Fixtures adversariales de seguridad: `$ref` externa a `http://169.254.169.254/` y `file:///etc/passwd` (bloqueo SSRF/deny-by-default), redirección `307` cross-origin (bloqueada sin fuga de headers de auth), `$ref` cíclica infinita, respuesta `200` con schema inválido y cancelación `AbortSignal` en vuelo.
- **Criterios de aceptación / rechazo:**
  - **Aceptación:** 100 % de fidelidad en validación por dialecto OAS 3.0/3.1/3.2 (cero falsos positivos/negativos en `nullable`/`$ref`/`enum`); 100 % de bloqueo de SSRF, `$ref` externas no autorizadas, escalada de protocolo y fuga de secretos; 0 retries mutativos internos verificados por el servidor mock; inventario completo de licencias transitivas (`MPL-2.0` vs `ISC`) entregado a AV-07.
  - **Rechazo:** cualquier brazo que dispare retries internos, envíe credenciales a URLs de documento, ignore `AbortSignal` o falle en `nullable`/3.2 queda descartado. Si Brazo A presenta incompatibilidad de control o licencia, se selecciona Brazo B conservando compatibilidad total con manuales UTCP.

### 5.2 EXP-05b · DataPlan DAG, reconciliación, API effects y referencia cross-instancia (Compuerta: **Inicio G3**, antes de congelar comportamiento integrado)
- **Hipótesis:** `DataPlan` sobre `IExternalOperationPort` ejecuta preparación multi-entidad (API + UI), reconcilia cortes sin duplicación ni falsos PASS, verifica efectos API independientes de HTTP 2xx y consulta una instancia de referencia con cero mutaciones y cero fuga de secretos/PII.
- **Fixture sintético:** Dos instancias locales aisladas (`REF_INST` con perfil/bóveda A de solo lectura y `QA_INST` con perfil/bóveda B de escritura QA), con observador externo independiente que audita estado de base de datos, colas y logs de mutación en ambas instancias.
- **Vectores obligatorios:**
  1. **DAG mixto + cleanup inverso idempotente:** crear Cliente (API UTCP/OpenAPI) → Condiciones (transferidas/sintetizadas desde `REF_INST`) → Solicitud (UI Playwright) → Aprobación (API rol 2) → Cleanup inverso ejecutado 2 veces sin afectar registros ajenos.
  2. **Corte y reconciliación (`AV-04 §4`):** inyectar corte de red tras commit remoto en `QA_INST` (sin respuesta al cliente): (a) con clave de idempotencia acreditada → adopción del efecto sin duplicar; (b) sin garantía de idempotencia → abstención y reconciliación por testigo sin reenvío ciego.
  3. **API contract vs. effect (`AR-48`):** (a) `HTTP 201` con rollback silencioso → `FAIL` (cero falso PASS); (b) `HTTP 403` con mutación oculta → `FAIL` por violación RBAC; (c) tráfico pasivo capturado → verificado que jamás autoriza replay automático; (d) endpoint oculto no documentado → marcado `OBSERVED_UNDOCUMENTED`.
  4. **Cross-instancia adversarial (`AR-18`):** (a) consulta `GET` mutativa en `REF_INST` (trampa) y `mutation` GraphQL → bloqueadas antes de envío; (b) intento de reenviar sesión/cookie de `REF_INST` a `QA_INST` → bloqueado; (c) redirección `302/307` de `REF_INST` a host externo → bloqueada; (d) campo PII prohibido en `REF_INST` → bloqueado o transformado según `TransferSchema`; (e) testigo independiente pre/post confirma **0 mutaciones en `REF_INST`**.
- **Criterios de aceptación:** 0 falsos PASS, 0 mutaciones en `REF_INST`, 0 duplicaciones ante corte, 0 fugas de secretos/PII en logs/evidencias, 100 % de limpieza verificada por observador externo.

### 5.3 EXP-06b · Extracción documental, reportes PDF/Excel, cálculo decimal y abstención (Compuerta: **G2** antes de congelar ingesta/evaluación; integración **G3**; certificación **G6/E8**)
- **Hipótesis:** El pipeline aislado de extracción y validación tabular (PDF/Excel + `decimal.js` + `TypedRuleOracle`) detecta mutantes contables de 1 centavo, caché obsoleta, errores de fecha/filtro/paginación y se abstiene selectivamente ante extracción insuficiente sin producir falsos FAIL en reportes sanos.
- **Corpus de fixtures sintéticos versionados:**
  1. **Reportes PDF (C-R1):** tabla multipágina (5+ páginas con encabezados repetidos y subtotales), formatos `es-MX` (`$1,234.56`) y `de-DE` (`1.234,56 €`), más variantes con fila faltante en salto de página, fila duplicada, filtro de fecha ignorado y PDF escaneado (legible con `tesseract.js` offline vs. borroso ilegible).
  2. **Reportes Excel (C-R2/C-R3):** libro multihoja con fórmulas `SUM`/`SUBTOTAL`/`ROUND`/referencias cruzadas, fórmulas compartidas, sistema `1900` (incl. caso borde serial 60) y `1904`, filas ocultas/filtradas y celdas combinadas. Variantes mutantes: **error de `0.01`** en fila y total, caché `<v>` desactualizada (`FORMULA_STALE_OR_CONFLICTING_CACHE`), fórmula sin `<v>` (`FORMULA_WITHOUT_CACHE`), error `#DIV/0!`/`#REF!`, fórmula volátil/externa no soportada (`FORMULA_UNSUPPORTED`), redondeo `HALF_UP` vs `HALF_EVEN` discrepante, y archivo malicioso con ZIP-bomb, XXE y `vbaProject.bin` (bloqueados en subproceso aislado).
  3. **Documentos D10 (`AR-13`):** DOCX con tablas combinadas + enlace `r:link` malicioso (bloqueado), PDF mixto, YAML con alias explosivos (bloqueado), JSON y OpenAPI.
- **Criterios de aceptación:**
  - **Cero falsos PASS** en todos los mutantes sembrados (centavo, caché obsoleta, fecha 1900/1904, filtro ignorado, fila faltante/duplicada, `#REF!`).
  - **Cero falsos FAIL** en los controles sanos (incluyendo múltiples locales, multipágina y multihoja).
  - **Abstención precisa (`INDETERMINATE`)** acotada exclusivamente a las afirmaciones afectadas en PDF ilegible y fórmula no soportada, manteniendo `PASS` en las afirmaciones independientes verificables del mismo reporte.
  - **Aislamiento verificado:** 0 bytes de egress de red, 0 lecturas fuera del directorio confinado, 0 ejecución de macros/JS, terminación limpia por timeout ante ZIP-bomb/alias-bomb.
  - **Integración posterior:** en **G3** se ejecuta sobre reportes descargados end-to-end desde el fixture web del AUT con filtros/roles/tenants; en **G6/E8** se valida sobre el corpus ciego custodiado (AV-08).

---

## 6. Fases, bloqueantes y distinción de niveles de madurez

| Nivel | Estado tras entrega de AV-05 | Qué queda bloqueado / pendiente |
| --- | --- | --- |
| **Viabilidad de diseño (planificación)** | Contratos de los 8 AR y 3 protocolos experimentales definidos, preservando AV-01..AV-04 y sin suprimir ninguna capacidad obligatoria. Sujeto a contravalidación de Codex y decisión del Orquestador. | **No autoriza** G0/G1, WBS, código ni acceso a AUT. Siguen pendientes auditorías AV-06, AV-07 y AV-08. |
| **Selección de componentes (implementación)** | **Pendiente de experimentos.** No se congela `@utcp/sdk` vs adaptador HTTP propio, ni `exceljs-community` vs `exceljs`, ni versión exacta de `@scalar/openapi-parser` ni OCR sin evidencia. | Bloqueado hasta pasar **`EXP-05a` (G0)**, **`EXP-06b` (G2)**, **`EXP-05b` (G3)** y auditoría de licencias/empaquetado en **AV-07**. |
| **Certificación de producto y operación empresarial** | **Pendiente.** | Bloqueado por `E1/E3/E4/E5/E7/E8`, `EXP-06c` (AV-06), corpus ciego (AV-08) y ratificación del propietario de **`DE-01` a `DE-05`** (TTL/cuotas, export privada, umbrales/corpus y autorización por destino real). |

**Límites de verificación de fuentes en esta ronda:** el acceso directo a `github.com/Hyouka73/QAMCP` vía navegador web devolvió restricción de acceso privado, pero **todo el árbol del repositorio en `develop` fue verificado íntegramente desde el snapshot local adjunto**; todas las fuentes externas (GitHub Advisories, npm/deps.dev, OpenAPI Spec 3.2.0/3.2.1, Handsontable HyperFormula, Scalar issues `#9694`/`#10235`, UTCP, OWASP/CWE-1236, Mozilla PDF.js, Tesseract.js, LibreOffice) fueron consultadas en web pública vigente. Como verificación puntual al Orquestador antes de G0: confirmar si el snapshot adjunto coincide byte-a-byte con el commit remoto `e8a9fc453f0346c4b045a867e54c54c35d2ac3bb` (en la copia local el archivo `decision-orquestador-av04-encargo-av05.md` está presente y refleja la base `3d61daa8`).

---

## 7. Bloque exacto de actualización documental del Registro Maestro (`registro-maestro.md`)

> **Instrucción para el Orquestador:** El siguiente bloque preserva intactos los **57 registros** y los conteos vigentes de estados principales (`6 VALIDADA`, `17 VALIDACIÓN EXPERIMENTAL PENDIENTE`, `26 PENDIENTE`, `8 BLOQUEANTE`), sin promover estados por mera entrega documental hasta contravalidación de Codex, decisión del Orquestador y validación experimental en sus compuertas.

### 7.1 Párrafo a añadir en `## Estados vigentes` de `docs/qap-architecture/cierre-av-01/registro-maestro.md`

```markdown
En AV-05, Neon publicó el informe principal sobre `develop` (`e8a9fc453f0346c4b045a867e54c54c35d2ac3bb`) cubriendo los ocho registros asignados (`AR-13`, `AR-17`, `AR-18`, `AR-20`, `AR-22`, `AR-38`, `AR-48`, `AR-50`) y definiendo los protocolos `EXP-05a` (G0), `EXP-05b` (G3) y `EXP-06b` (G2/G3). Se resolvieron `HN-05` y `C-02` con versiones y advisories primarios vigentes, se diseñaron contratos agnósticos para ingesta D10, validación PDF/Excel con 6 estados de celda y cálculo decimal exacto, puerto `IExternalOperationPort` (UTCP/OpenAPI), lectura cross-instancia acreditada, pruebas API separadas de efecto y `QapReportManifest v2.0` offline sin CDN. Pendiente de contravalidación independiente por Codex y decisión del Orquestador. Los ocho registros conservan sus estados principales vigentes (1 bloqueante, 2 validación experimental pendiente, 5 pendientes) hasta ejecución de `EXP-05a/b`, `EXP-06b`, `EXP-06c`, `E2/E5/E8` y ratificación de `DE-01`–`DE-05`.
```

### 7.2 Anotaciones de actualización por registro (`AV-05`)

```markdown
### AR-13
**AV-05 (informe Neon, pendiente contravalidación Codex).** Contrato `DocumentIngestionPort` para los 8 formatos D10 en subproceso SO aislado sin red; separación extracción/cobertura/interpretación HOST/acreditación normativa; localizadores por página/bbox/hoja/celda/sección/puntero; 4 estados de reconciliación preservando `DOCUMENTED_NOT_OBSERVED` sin eliminación automática; OCR local `tesseract.js` estrictamente offline (`langPath` local verificado); abstención acotada a la afirmación afectada. Estado principal conservado: `PENDIENTE` (validación corpus D10 en G2).

### AR-17
**AV-05 (informe Neon, pendiente contravalidación Codex).** UTCP y OpenAPI 3.0/3.1/3.2 conservados ambos en primer lanzamiento tras `IExternalOperationPort` (AV-04 §8) con adopción por caso y convivencia con vía UI autorizada; cero retries mutativos internos; cero secretos al HOST; deshabilitación dura de `CodeMode`/`cli`/`file`/`dotenv` en `@utcp/sdk` (MPL-2.0) y evaluación comparativa frente a adaptador HTTP gobernado propio (`ISC`) en `EXP-05a` (G0) y DAG integrado/reconciliación en `EXP-05b` (G3). Estado principal conservado: `VALIDACIÓN EXPERIMENTAL PENDIENTE`.

### AR-18
**AV-05 (informe Neon, pendiente contravalidación Codex).** Contrato `CrossInstanceReferencePolicy`: bóvedas/perfiles/sesiones disjuntos, lectura acreditada en destino deny-by-default (incl. GET/GraphQL/recursos automáticos), `TransferSchema` por campo y propósito con trazabilidad y bloqueo de PII/secretos/grants, testigo pre/post de no-mutación en origen y exportación saneada autorizada como alternativa ante acceso bloqueado sin sustituir la capacidad autorizada. Sujeto a `EXP-05b` (G3) y `DE-04` por destino real. Estado principal conservado: `PENDIENTE`.

### AR-20
**AV-05 (informe Neon, pendiente contravalidación Codex).** Contrato D11 con 6 estados de celda, separación de 5 planos de valor (mostrado, bruto/cacheado, fórmula, cálculo contable independiente en `decimal.js`/`TypedRuleOracle` y expectativa acreditada), rechazo de `Number` IEEE-754 para dinero, no adopción obligatoria de `HyperFormula` (GPLv3/comercial), `LibreOffice Calc` solo como adaptador aislado opt-in no infalible, cobertura explícita de fechas 1900/1904/serial 60, compartidas, ocultas, errores y no ejecución de macros; testigos N2/N3 sin BD del AUT ni causa común. Estado principal conservado: `BLOQUEANTE` hasta `EXP-06b` (G2/G3) y corpus ciego (G6/E8).

### AR-22
**AV-05 (informe Neon, pendiente contravalidación Codex).** Resueltos `HN-05` y `C-02`: `mammoth`, `@scalar/openapi-parser`, `exceljs` y `@utcp/sdk` no están en `pnpm-lock.yaml` (riesgos preventivos); `mammoth >= 1.13.0` (BSD-2-Clause) cierra `CVE-2025-11849` y advisories 2026; `scalar#9694` cerrado en `#9827` pero con follow-up `#10235` (requiere suite OAS 3.0/3.1/3.2); `xlsx@0.18.5` prohibido (`CVE-2023-30533`/`CVE-2024-22363`); `yaml@2.9.0` con `merge: false` frente a DoS de `js-yaml` (`CVE-2026-59869`/`84375`); aislamiento por subproceso SO sin red, cuotas ZIP/XML/CPU/RAM, `$ref` deny-by-default anti-SSRF y transferencia de licencias a AV-07. Estado principal conservado: `PENDIENTE`.

### AR-38
**AV-05 (informe Neon, pendiente contravalidación Codex).** Protocolo `EXP-06b` especificado para G2 (antes de congelar ingesta/evaluación), integración E2E en G3 y certificación en G6/E8, con matriz de clases de reporte C-R1..C-R4, controles sanos, mutantes de 1 centavo/fecha/filtro/página/hoja/celda y verificación de abstención acotada y aislamiento sin red. Estado principal conservado: `VALIDACIÓN EXPERIMENTAL PENDIENTE`.

### AR-48
**AV-05 (informe Neon, pendiente contravalidación Codex).** Contrato `ApiContractAndEffectVerifier` separando tráfico pasivo (no autoriza replay/mutación), inventario de operaciones (4 estados), cumplimiento estructural por dialecto OAS 3.0/3.1/3.2 (`STRUCTURAL`) y verificación funcional de efecto con testigo N2/N3 (`FUNCTIONAL_EFFECT`/`CROSS_CONCILIATED`), cubriendo casos positivos/negativos, RBAC, mutación silenciosa, redacción de secretos e integración con códigos AR-52. Estado principal conservado: `PENDIENTE`.

### AR-50
**AV-05 (informe Neon, pendiente contravalidación Codex).** Contrato `QapReportManifest v2.0` unificado para MCP/CLI/visor con 6 veredictos, 4 ejes, códigos AV-04, defectos/historial y sello histórico vs. verificación actual; cierre de brecha de generadores CSV (mitigación OWASP CWE-1236) y JSONL junto a HTML/MD/JSON; eliminación de CDN (Google Fonts/Tailwind) y XSS en `template/index.html`; remediación `server.ts` (AR-24/27); distinción `SANITIZED_PORTABLE_BUNDLE` (cero egress, portable entre rutas/SO) vs. `PRIVATE_AUTHORIZED_EXPORT` (no revocable tras export, sujeto a DE-01/02); transferencia de accesibilidad y validación de paquete a AV-06 (`EXP-06c`) y AV-08. Estado principal conservado: `PENDIENTE`.
```

### 7.3 Dependencias transferidas a auditorías posteriores
- **Hacia AV-06:** rendimiento de extracción en reportes grandes, verificación de `SANITIZED_PORTABLE_BUNDLE` trasladado entre rutas/SO con cero egress, reproducción WebM/Range sobre visor remediado y accesibilidad propia del reporte (`EXP-06c`).
- **Hacia AV-07:** dictamen definitivo de licencias y distribución (`MPL-2.0` de `@utcp/sdk` si se selecciona en `EXP-05a`, `ISC`/`MIT`/`BSD-2-Clause`/`Apache-2.0`, exclusión de `GPLv3`/`HyperFormula`), reemplazo/evaluación de `exceljs@4.4.0` vs `exceljs-community`, auditoría de `js-yaml` y `ajv@6.15.0` transitivos en `pnpm-lock.yaml`, empaquetado offline de `tessdata` y mecanismo de sandbox SO por plataforma (Windows/macOS/Linux).
- **Hacia AV-08:** congelamiento de corpus ciego D10/D11 y mutantes de negocio (`E8`), calibración de denominadores sin fijar umbrales unilaterales y cierre con el propietario de `DE-01` (TTLs/cuotas de retención), `DE-02` (exportación privada), `DE-03` (corpus/umbrales) y `DE-04` (autorizaciones por destino real y cross-instancia).