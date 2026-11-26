# **ET-05 — Informe independiente de evaluación tecnológica de QAP**

**Especialidad:** Documentos, oráculos, reportes, evidencias y multimedia.\
**Destinatario:** Orquestador Principal de QAP.\
**Fecha:** 26 de noviembre de 2026.\
**Repositorio:** `Hyouka73/QAMCP`.\
**Rama autorizada:** `develop`.\
**SHA del encargo:** `38b6d5b0140c94d02677acf6a1f8ceb9f4d94029`.\
**Base normativa y de código fijada por los encargos:** `1a81e86c9b17a95a04e40237eff5fb99215bae5a`.\
**Naturaleza:** Investigación tecnológica documental independiente, no vinculante para la selección definitiva.

## **1. Resumen ejecutivo**

CONDICIONADO

Existe una composición tecnológica razonable para satisfacer el alcance documental, probatorio y multimedia de QAP v1 profesional local. Sin embargo, no existe evidencia suficiente para declarar acreditadas todas las garantías obligatorias, particularmente la equivalencia semántica de Excel, la captura multimedia preventiva y la custodia posicionable revocable.

No recomiendo reconstruir indiscriminadamente el subsistema documental y de reportes. Recomiendo conservar los mecanismos aprovechables, sustituir selectivamente los que contradicen los contratos ratificados e incorporar componentes especializados mediante fronteras verificables.

### **1.1. Composición tecnológica candidata**

| Componente           | Candidato principal                                 | Respaldo                                  | Dictamen documental  |
| -------------------- | --------------------------------------------------- | ----------------------------------------- | -------------------- |
| PDF digital          | PDF.js                                              | PDFium aislado                            | Apto como candidato  |
| OCR local            | Tesseract                                           | PaddleOCR local                           | Condicionado         |
| DOCX                 | Lector estructural OOXML                            | Apache POI aislado                        | Condicionado         |
| Excel pasivo         | Lector OOXML y SheetJS CE para variantes            | Apache POI y Calc según formato           | Condicionado         |
| Semántica Excel      | Evaluador acotado acreditado por clase              | LibreOffice Calc aislado                  | Condicionado crítico |
| Cálculo de negocio   | Decimal.js y reglas tipadas                         | BigInt, enteros escalados o racionales    | Apto como candidato  |
| PDF propio           | PDFKit                                              | Renderizado HTML/PDF calificado           | Condicionado         |
| XLSX propio          | ExcelJS                                             | SheetJS CE                                | Apto como candidato  |
| Multimedia           | Captura nativa protegida, ruta C                    | Frames acotados y códec, ruta A           | Condicionado crítico |
| Codificación y remux | FFmpeg con build gobernado y VP8                    | libvpx/libwebm                            | Condicionado         |
| Cifrado posicionable | Tink Java Streaming AEAD                            | Implementación revisada equivalente       | Condicionado crítico |
| Reportes textuales   | Generadores existentes reconstruidos selectivamente | Serializadores deterministas equivalentes | Apto como candidato  |
| JUnit                | Proyección del sobre canónico AR-52                 | Serializador XML alternativo              | Condicionado         |

**Ninguno de estos candidatos recibe autorización de instalación, integración, ejecución o selección irreversible mediante este informe.**

### **1.2. Hallazgos principales**

1. **D10, D11 y los reportes propios son tres capacidades diferentes.** Una biblioteca que genera XLSX correctamente no acredita que QAP pueda validar un Excel emitido por un sistema empresarial.
2. **El principal riesgo documental no es la extracción de texto, sino el falso PASS.** Un reporte puede parecer correcto y contener registros faltantes, importes incorrectos, fórmulas obsoletas o resultados correspondientes a otra población.
3. **No existe equivalencia automática entre Excel, LibreOffice, HyperFormula y un motor decimal.** Deben permanecer separados los planos de extracción, semántica de hoja y cálculo empresarial independiente.
4. **La privacidad multimedia no puede depender de redacción posterior.** Una grabación que captura un dato prohibido y después lo elimina ya incumple la garantía preventiva.
5. **El cifrado de almacenamiento y el aislamiento de autoridad son complementarios.** Un volumen cifrado no evita que un HOST con privilegios equivalentes lea los medios mientras el sistema está operativo.
6. **Los generadores actuales de QAP son aprovechables parcialmente**, pero sus modelos históricos de resultados no deben convertirse en una segunda autoridad funcional.
7. **La composición debe ser modular, no necesariamente multiproceso en todos sus componentes.** Los procesos aislados se justifican por custodia, contenido hostil, dependencias nativas o requisitos de seguridad, no por una preferencia general de arquitectura.

### **1.3. Reservas que impiden una aprobación definitiva**

| Reserva | Consecuencia                                                                           |
| ------- | -------------------------------------------------------------------------------------- |
| AR-20   | No cerrar definitivamente D11 sin EXP-06b por clase obligatoria.                       |
| AR-27   | No cerrar G0 ni abrir G1 sin la factibilidad multimedia exigida por EXP-06a.           |
| AR-24   | Mantener remediación bloqueante del visor en G0.                                       |
| AR-22   | No procesar documentos hostiles sin frontera efectiva calificada.                      |
| AR-28   | No atribuir autenticidad suficiente a hashes generados bajo una autoridad no separada. |
| AR-50   | No acreditar reportes propios hasta comprobar publicación, portabilidad y custodia.    |

AR-27 conserva su estado maestro de **VALIDACIÓN EXPERIMENTAL PENDIENTE**, aunque su condición probatoria bloquea el cierre de G0. No debe confundirse la condición de una compuerta con la reclasificación del registro maestro.

## **2. Fuentes, alcance y límites de la investigación**

### **2.1. Fuentes vinculantes**

Se consultaron íntegramente los dos encargos que gobiernan esta investigación:

- [Encargo común de evaluación tecnológica](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/encargo-evaluacion-tecnologica.md?utm_source=chatgpt.com), blob `01a510f95bb32870c5c2b18fd7c934c877aec5ea`.
- [Encargo especializado ET-05](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/encargo-et-05.md?utm_source=chatgpt.com), blob `1d0f007f0a49bc4299516a1151039bc99b7e37f8`.

También se recuperaron y examinaron, con diferente profundidad según su pertinencia, los siguientes documentos mediante acceso de solo lectura al repositorio.

| Fuente                                                                                                                                                                                                | Materia contrastada                           |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| [Especificación consolidada](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/especificacion-consolidada.md?utm_source=chatgpt.com)              | D10, D11, custodia, arquitectura y compuertas |
| [Matriz de responsables ET](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/matriz-responsables-et.md?utm_source=chatgpt.com)      | Asignación primaria y dependencias            |
| [Manifiesto normativo](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/manifiesto-normativo-consolidado.md?utm_source=chatgpt.com) | Precedencia y fuentes inmutables              |
| [Manifiesto AC-01](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/manifiesto-ac01.md?utm_source=chatgpt.com)                      | Ampliaciones y preservación normativa         |
| [Acta DE](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/acta-ratificacion-de.md?utm_source=chatgpt.com)                          | Cinco decisiones empresariales                |
| [Acta AC-01](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/acta-ratificacion-ac01.md?utm_source=chatgpt.com)                     | Siete decisiones adicionales                  |
| [Catálogo delta](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/catalogo-delta-ac01.md?utm_source=chatgpt.com)                    | Cláusulas de aceptación                       |
| [Contratos AC-01](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/contratos-ac01.md?utm_source=chatgpt.com)                        | Publicaciones, recetas, reportes y JUnit      |
| [Matriz de aceptación AC-01](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/matriz-aceptacion-ac01.md?utm_source=chatgpt.com)     | IDs y compuertas aplicables                   |
| [Registro maestro](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/registro-maestro.md?utm_source=chatgpt.com)                     | Estados y reservas AR                         |
| [Resolución final AC-01](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/resolucion-final-ac01.md?utm_source=chatgpt.com)          | Correcciones documentales prevalentes         |
| [Enmiendas AV-04](https://github.com/Hyouka73/QAMCP/blob/e12927104051dffba149dd9824ac517863eee421/docs/qap-architecture/cierre-av-01/enmiendas-av04.md?utm_source=chatgpt.com)                        | Resultados, evidencia y oráculos              |
| [Enmiendas AV-05](https://github.com/Hyouka73/QAMCP/blob/e12927104051dffba149dd9824ac517863eee421/docs/qap-architecture/cierre-av-01/enmiendas-av05.md?utm_source=chatgpt.com)                        | Documentos, Excel, fronteras y reportes       |
| [Fe de correcciones AR-27](https://github.com/Hyouka73/QAMCP/blob/e12927104051dffba149dd9824ac517863eee421/docs/qap-architecture/cierre-av-01/fe-correcciones-ar27.md?utm_source=chatgpt.com)         | Captura C/A y cifrado posicionable            |
| [Protocolos AV-05](https://github.com/Hyouka73/QAMCP/blob/e12927104051dffba149dd9824ac517863eee421/docs/qap-architecture/cierre-av-01/protocolos-av05.md?utm_source=chatgpt.com)                      | EXP-05a/b y EXP-06b                           |
| [Protocolos corregidos EXP-06a/c](https://github.com/Hyouka73/QAMCP/blob/e12927104051dffba149dd9824ac517863eee421/docs/qap-architecture/cierre-av-01/protocolos-exp-06-ac.md?utm_source=chatgpt.com)  | Prevención, custodia y multimedia             |

### **2.2. Limitación material de cobertura**

El acceso al repositorio fue satisfactorio, pero algunos resultados extensos fueron truncados o recuperados mediante selecciones de secciones pertinentes. Por ello:

- No certifico haber leído íntegramente todos los documentos históricos y anexos exigidos por el encargo común.
- No certifico el cotejo semántico individual completo de las 123 entradas y las 65 cláusulas.
- No certifico un inventario transitivo exhaustivo de los componentes que contendría el futuro instalador.
- Las versiones upstream se identifican cuando existe evidencia documental suficiente; las restantes quedan como reservas de selección.
- No presento mediciones de rendimiento, memoria, tamaño instalado, seguridad efectiva ni compatibilidad experimental de QAP.

Esta limitación afecta la posibilidad de considerar el informe un cierre exhaustivo del encargo, pero no invalida los hallazgos concretos respaldados por código, contratos y fuentes primarias.

**Dictamen metodológico:** evaluación documental sustantiva con reservas de cobertura; no contravalidación completa del universo normativo.

## **3. Invariantes empresariales y normativos**

La evaluación preserva, sin modificar:

- D01–D21.
- DE-01–05: **A/B/B/A con B como respaldo/B**.
- AC-DE-01–07: **B/A/B/A/A/A/A**.
- Las 123 entradas normativas: 110 requisitos, 2 políticas y 11 ampliaciones.
- Las 65 cláusulas AC-01.
- Los 57 registros maestros y sus estados.
- Los seis veredictos canónicos y los cuatro ejes independientes de resultado.
- Los criterios y vetos DE-03.
- El modelo local HOST + DETERMINISTIC.
- La operación profesional sin IA obligatoria.
- El soporte obligatorio Windows, macOS y Linux.
- PDF y XLSX propios desde el primer lanzamiento.

No se propone introducir un servidor colaborativo, MANAGED, OCR remoto obligatorio, suscripciones, Microsoft Excel como dependencia operativa obligatoria ni un motor financiero universal.

### **3.1. Filtros eliminatorios**

| Garantía        | Condición eliminatoria                                                                   |
| --------------- | ---------------------------------------------------------------------------------------- |
| Autoridad       | El componente adquiere permisos por interpretar documentos o metadatos.                  |
| Veracidad       | Confunde observación, inferencia, integridad criptográfica o caché con verdad funcional. |
| Privacidad      | Captura contenido prohibido o escribe datos privados fuera de custodia.                  |
| Portabilidad    | Incumple una celda obligatoria sin respaldo equivalente.                                 |
| Operación local | Requiere servicio remoto, cuenta o suscripción para una función obligatoria.             |
| Distribución    | No permite una distribución compatible con la política aprobada.                         |
| Evidencia       | Sustituye video auténtico por imágenes estáticas o por supresión sistemática.            |
| Resultado       | Produce veredictos independientes o puede convertir un impedimento en PASS.              |

Ninguna ventaja de costo, consumo de memoria o facilidad de implementación compensa un incumplimiento de estas garantías.

## **4. Inventario tecnológico real de QAP**

### **4.1. Dependencias verificadas**

Se inspeccionó el árbol de archivos de la base inmutable `1a81e86c9b17a95a04e40237eff5fb99215bae5a`, cuya respuesta no indicó truncamiento, junto con manifests, segmentos del lockfile, configuraciones de compilación y código relevante.

| Componente        | Declaración o resolución encontrada | Interpretación                                                           |
| ----------------- | ----------------------------------- | ------------------------------------------------------------------------ |
| Monorepo QAP      | `2.1.0`                             | Versión del código existente; no certificación del producto objetivo v1. |
| TypeScript        | `~5.5.4`                            | Lenguaje existente.                                                      |
| tsup              | `^8.5.1`                            | Construcción de paquetes ESM.                                            |
| Playwright raíz   | `^1.63.0`, resuelto `1.63.0`        | No representa necesariamente la versión usada por el runner.             |
| Playwright runner | `^1.62.1`, resuelto `1.62.1`        | Versión relevante para la captura existente.                             |
| AJV               | `8.20.0`                            | Validación estructural aprovechable.                                     |
| ajv-formats       | `3.0.1`                             | Validación complementaria.                                               |
| YAML              | `2.9.0`                             | Parser existente aprovechable bajo controles.                            |
| Vitest            | `4.1.11`                            | Infraestructura de pruebas declarada.                                    |
| Licencia raíz     | `ISC`                               | Metadata existente; ratificación definitiva del titular pendiente.       |

Fuentes directas:

- [package.json](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/package.json?utm_source=chatgpt.com).
- [pnpm-lock.yaml](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/pnpm-lock.yaml?utm_source=chatgpt.com).
- [Manifest de knowledge](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/knowledge/package.json?utm_source=chatgpt.com).
- [Manifest de reporter](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/reporter/package.json?utm_source=chatgpt.com).
- [Manifest del runner](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/playwright-runner/package.json?utm_source=chatgpt.com).

### **Hallazgo ET05-H01 — Divergencia de versiones de Playwright**

El monorepo declara Playwright 1.63.0 en la raíz, mientras que el runner resuelve 1.62.1.

Esto implica que una API encontrada en la documentación vigente o en otro paquete del monorepo puede no estar disponible en el productor efectivo de evidencias.

**Recomendación:** ET-03 y ET-06 deben acordar la identificación exacta del navegador, runner, códec y artefactos distribuidos por celda. No actualizar Playwright exclusivamente para obtener una API multimedia sin contravalidar sus efectos funcionales, de instalación y privacidad.

### **4.2. Inspección del código existente**

| Archivo o subsistema                          | Capacidad encontrada                                        | Decisión candidata                   |
| --------------------------------------------- | ----------------------------------------------------------- | ------------------------------------ |
| `knowledge/src/document-detector.ts`          | Detección, clasificación y lectura preliminar de documentos | Adaptar                              |
| `knowledge` y AJV/YAML                        | Validación y procesamiento estructurado                     | Conservar selectivamente             |
| `mcp/src/application/scoped-rule-resolver.ts` | Resolución de reglas según catálogo normativo               | Revisar y adaptar                    |
| `playwright-runner/src/evidence-artifacts.ts` | Saneamiento, captura y confinamiento preliminar de rutas    | Reconstrucción selectiva de custodia |
| `reporter/src/generators/html-report.ts`      | HTML, screenshots embebidos y filtros                       | Adaptar a la proyección autorizada   |
| `reporter/src/generators/json-report.ts`      | Generación JSON existente                                   | Adaptar                              |
| `reporter/src/generators/markdown-report.ts`  | Generación Markdown existente                               | Adaptar                              |
| `reporter/src/generators/junit-report.ts`     | XML JUnit histórico                                         | Sustituir semántica de proyección    |
| `reporter/src/server/server.ts`               | Servidor HTTP local y entrega de artefactos                 | Remediar conforme AR-24              |
| `reporter/src/persistence/sqlite-client.ts`   | Persistencia existente                                      | Coordinar con ET-02                  |
| `reporter/src/pruning/pruning-engine.ts`      | Mecanismo de poda existente                                 | Revisar conforme DE-01               |
| `reporter/tsup.config.ts`                     | Empaquetado y copia de plantilla HTML                       | Adaptar al paquete offline           |

La existencia de archivos y funciones no acredita su alcanzabilidad por todos los consumidores ni su comportamiento en el producto instalado.

### **4.3. Hallazgos de reconstrucción selectiva**

**ET05-H02 — Ingesta documental insuficiente.**

El detector actual es principalmente un mecanismo de descubrimiento y clasificación. En los manifests inspeccionados no aparecen dependencias dedicadas para la extracción profesional PDF, DOCX y Excel.

Además, el test [`document-path-disabled.test.ts`](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/mcp/src/__tests__/document-path-disabled.test.ts?utm_source=chatgpt.com) contiene verificaciones de rechazo mediante `direct_document_path_unavailable`.

Es una frontera de seguridad útil que no debe eliminarse para facilitar D10. La solución candidata es una adquisición autorizada mediante broker, no devolver al HOST acceso arbitrario a rutas locales.

**ET05-H03 — JUnit existente incompatible con el contrato objetivo.**

El [generador JUnit](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/reporter/src/generators/junit-report.ts?utm_source=chatgpt.com) proyecta estados históricos y agrupa `skipped` y `not_run`.

No se observa en ese generador la implementación de la guardia canónica exigida por AC-01 §6.1.

Debe preservarse, cuando sea aprovechable, la serialización XML; no el modelo de resultados histórico como autoridad.

**ET05-H04 — La redacción DOM no demuestra prevención multimedia.**

[`evidence-artifacts.ts`](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/playwright-runner/src/evidence-artifacts.ts?utm_source=chatgpt.com) incorpora CSS, selectores sensibles, expresiones regulares y saneamiento de secretos.

Son defensas complementarias, pero insuficientes como garantía preventiva frente a una transición intradocumento, iframe, popup, imagen, canvas o componente no contemplado.

**ET05-H05 — HTML con imágenes embebidas exige nueva frontera de exportación.**

El [generador HTML](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/reporter/src/generators/html-report.ts?utm_source=chatgpt.com) transforma screenshots en data URIs.

Una imagen privada embebida pasa a formar parte de una copia independiente del reporte. Por ello, la autorización para visualizar no puede reutilizarse automáticamente como autorización para exportar.

**ET05-H06 — El servidor existente no acredita reproducción posicionable revocable.**

El [servidor del visor](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/reporter/src/server/server.ts?utm_source=chatgpt.com) contiene entregas de archivos mediante `createReadStream(...).pipe(res)`.

Este mecanismo no demuestra por sí mismo autorización por generación, autenticación de segmentos, revocación de emisiones en curso ni apertura segura por handle.

Se recomienda conservar únicamente la infraestructura HTTP que pueda reconciliarse con AR-24 y ET-06.

## **5. Mapa de obligaciones asignadas**

La matriz de responsabilidad atribuye a ET-05 **22 entradas normativas primarias y ocho cláusulas AC-01 de coordinación primaria**.

Las obligaciones compartidas deben probarse conjuntamente, sin duplicar denominadores.

### **5.1. Entradas normativas primarias**

| ID             | Capacidad tecnológica necesaria           | Dependencia principal    | Dictamen             |
| -------------- | ----------------------------------------- | ------------------------ | -------------------- |
| REQ-DOC-001.1  | Ingesta estructurada y localizadores      | Parsers y custodia       | Condicionado         |
| REQ-DOC-001.2  | Cobertura, omisiones e ilegibilidad       | Manifiesto de extracción | Condicionado         |
| REQ-DOC-001.3  | Cuatro estados de reconciliación          | ET-02/03                 | Apto como candidato  |
| REQ-DOC-001.4  | Autoridad, vigencia y conflicto           | ET-01/06                 | Condicionado         |
| REQ-ORA-001.1  | Seis veredictos uniformes                 | ET-01/07                 | Apto como candidato  |
| REQ-ORA-001.2  | Evaluación independiente por afirmación   | ET-03                    | Condicionado         |
| REQ-ORA-001.3  | Testigos N1/N2/N3                         | ET-03/07                 | Condicionado         |
| REQ-ORA-001.4  | Reglas tipadas y decimal                  | ET-01/02                 | Condicionado         |
| REQ-ORA-001.5  | Verificación de no mutación               | ET-03/07                 | Condicionado         |
| REQ-ORA-001.6  | Convergencia asíncrona                    | ET-01/03                 | Condicionado         |
| REQ-ORA-001.7  | Independencia del testigo                 | ET-01/02                 | Apto como candidato  |
| REQ-REP-001.1  | Servicio único de evidencia               | ET-02/03/06              | Condicionado         |
| REQ-REP-001.2  | Reportes, historial y comparaciones       | ET-02/04                 | Apto como candidato  |
| REQ-REP-001.3  | Gestión de defectos y receta reproducible | ET-01/02                 | Condicionado         |
| REQ-REP-001.4  | Reproducción y retest trazables           | ET-01/02/03              | Condicionado         |
| REQ-AUTREP-001 | Validación real de PDF/Excel AUT          | ET-03/07                 | Condicionado crítico |
| POL-CAP-001    | Política de captura protegida             | ET-03/06                 | Condicionado crítico |
| REQ-REP-002.1  | Consulta configurable sin IA              | ET-02/04                 | Apto como candidato  |
| REQ-REP-002.2  | Métricas versionadas                      | ET-01/02                 | Apto como candidato  |
| REQ-REP-002.3  | Comparaciones as-of                       | ET-02                    | Condicionado         |
| REQ-REP-002.4  | Plantillas y publicaciones versionadas    | ET-02/06                 | Apto como candidato  |
| REQ-REP-002.5  | PDF/XLSX propios                          | ET-04/06                 | Condicionado         |

**Apto como candidato** significa que existe una ruta tecnológica documental razonable, no que la obligación esté implementada, instalada o certificada.

### **5.2. Cláusulas AC-01 primarias**

| Cláusula   | Garantía                              | Tecnología o contrato                   | Calificación        |
| ---------- | ------------------------------------- | --------------------------------------- | ------------------- |
| AC01-12.01 | Cinco dominios lógicos, una autoridad | DTO versionados y referencias canónicas | G1/E1/E2            |
| AC01-12.02 | Consultas tipadas autorizadas         | AST de consulta y servicio común        | G1/E2, G3/E6, G5/E7 |
| AC01-12.03 | Métricas y denominadores congelados   | Catálogo versionado                     | G2/E4, G5/E7, G6/E8 |
| AC01-12.04 | Consulta temporal y comparabilidad    | Cortes y eventos verificables           | G3/E6, G5/E7        |
| AC01-12.05 | Publicaciones inmutables autorizadas  | Proyección y manifiesto                 | G3/E6, G5/E7        |
| AC01-12.06 | Perfiles de entrega                   | Redacción estructural y grants          | G3/E6, G5/E7        |
| AC01-12.07 | PDF propio                            | PDFKit o renderer equivalente           | G3/E6, G5/E6/E7     |
| AC01-12.08 | XLSX propio                           | ExcelJS o escritor equivalente          | G3/E6, G5/E6/E7     |

### **5.3. Cláusulas de coordinación cruzada**

Según la matriz de responsabilidades, ET-05 participa adicionalmente en:

`AC01-01.01`, `06.02`, `10.02`, `11.02`, `13.01`, `13.02`, `14.01`, `14.02`, `14.03`, `16.04`, `17.02`, `19.02`, `20.03`, `22.01`, `22.02`, `22.03` y `23.01`.

Las referencias anteriores pertenecen al mismo espacio de IDs `AC01-xx.yy`.

Las restantes entradas y cláusulas permanecen vigentes bajo sus responsables primarios. No se emite una aprobación implícita sobre ellas.

# **6. Evaluación D10 — Ingesta documental corporativa y técnica**

## **6.1. Arquitectura candidata**

Arquitectura lógica propuesta. No prescribe cinco procesos ni modifica los contratos vigentes.

El parser produce observaciones. El núcleo determina si estas pueden utilizarse como conocimiento o como expectativas acreditadas.

Los documentos no pueden concederse autoridad a sí mismos.

## **6.2. PDF digital: PDF.js frente a alternativas**

| Candidato     | Ventajas                                               | Limitaciones y costos                                                                                   | Licencia base        |
| ------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | -------------------- |
| PDF.js        | Integración JavaScript, texto, geometría y renderizado | Reconstrucción tabular propia, dependencias de render, contenido activo y consumo en documentos grandes | Apache-2.0           |
| PDFium        | Motor nativo de procesamiento y renderizado PDF        | Builds por SO/CPU, ABI, wrapper, dependencias nativas y actualización                                   | BSD-style y terceros |
| Apache PDFBox | Extracción y procesamiento mediante JVM                | JRE, memoria, arranque y frontera Java                                                                  | Apache-2.0           |

PDF.js documenta extracción y renderizado mediante sus APIs, pero no ofrece una garantía general de recuperación de tablas semánticas ni del orden empresarial de lectura.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://mozilla.github.io\&sz=32)

mozilla.github.io



PDFium dispone de una licencia principal permisiva, acompañada de avisos y componentes de terceros que deben inventariarse.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://pdfium.googlesource.com\&sz=32)

Git at Google



### **Recomendación**

**PDF.js como candidato principal**, sujeto a compatibilidad con ET-01 y a un perfil que no habilite scripting, enlaces automáticos, adquisiciones externas ni acciones activas.

PDFium constituye el respaldo nativo para documentos cuyo renderizado o extracción no supere el corpus requerido. PDFBox puede considerarse si la composición final ya necesita una JVM.

### **Riesgo de seguridad actualizado**

Se encontraron avisos oficiales de ejecución JavaScript asociada al procesamiento de PDF maliciosos:

- [CVE-2024-4367](https://github.com/mozilla/pdf.js/security/advisories/GHSA-wgrm-67xf-hhpq?utm_source=chatgpt.com).
- [GHSA-hq66-cqwq-w95j / CVE-2026-16633](https://github.com/mozilla/pdf.js/security/advisories/GHSA-hq66-cqwq-w95j?utm_source=chatgpt.com).

El segundo aviso documenta riesgos relacionados con scripting habilitado y ausencia de restricciones apropiadas.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub+1



Por tanto, una versión corregida es necesaria, pero insuficiente. Se exige confinamiento efectivo y una política explícita del consumidor.

La rama PDF.js 6.x aparece documentada upstream, pero no se pudo verificar satisfactoriamente la versión latest exacta desde su página de releases. No se congela una versión.

## **6.3. OCR local**

| Candidato     | Tecnología                      | Ventajas                                         | Costo relativo esperado              |
| ------------- | ------------------------------- | ------------------------------------------------ | ------------------------------------ |
| Tesseract 5.x | Motor nativo OCR                | Salidas estructuradas, modelos locales y madurez | Medio                                |
| Tesseract.js  | WebAssembly y workers           | Integración JS y menor complejidad ABI propia    | Medio; requiere medir heap y workers |
| PaddleOCR     | Modelos y runtime de inferencia | Alternativa para layouts difíciles y estructura  | Alto respecto a un OCR clásico       |

Las notas oficiales de Tesseract registran la versión 5.5.4. Se toma como referencia documental identificable, no como selección definitiva ni afirmación de que sea la última disponible.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://tesseract-ocr.github.io\&sz=32)

tessdoc



Tesseract dispone de salidas TSV, hOCR, ALTO y coordenadas, bajo Apache-2.0.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://tesseract-ocr.github.io\&sz=32)

tessdoc+1



PaddleOCR documenta ejecución con runtimes de inferencia y opciones CPU. La composición añade dependencias y modelos cuya distribución offline y compatibilidad por arquitectura requieren comprobación.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.paddleocr.ai\&sz=32)

PaddleOCR Documentation



### **Recomendación**

- Tesseract nativo como primer candidato.
- Tesseract.js como alternativa de integración cuando cumpla rendimiento y memoria.
- PaddleOCR como respaldo localizado para morfologías donde demuestre una mejora material.

No se recomienda distribuir varios motores OCR permanentemente activos.

El OCR debe activarse bajo demanda, por páginas o regiones, y mantenerse fuera del camino crítico cuando exista extracción digital suficiente.

### **Criterio esencial**

Una confianza OCR elevada no acredita la exactitud de un importe.

Deben verificarse explícitamente signos negativos, separadores decimales, símbolos monetarios, columnas, ceros, caracteres confundibles y ubicación de cada dato relevante.

## **6.4. DOCX**

| Candidato         | Ventaja                                                    | Limitación                                    |
| ----------------- | ---------------------------------------------------------- | --------------------------------------------- |
| OOXML estructural | Localizadores exactos de partes, párrafos, tablas y celdas | Mayor responsabilidad de implementación       |
| Mammoth.js        | Proyección semántica a HTML                                | Puede perder geometría y estructura relevante |
| Apache POI/XWPF   | Biblioteca especializada Java                              | JVM, adaptador y pruebas adicionales          |

ECMA-376 define la representación y empaquetado Office Open XML. La quinta edición contiene partes con revisiones independientes, incluida OPC de diciembre de 2021.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://ecma-international.org\&sz=32)

Ecma International



Mammoth, bajo BSD-2-Clause, advierte expresamente que no sanea el documento fuente.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub



**Recomendación:** utilizar un lector estructural OOXML acotado como fuente primaria de extracción; Mammoth únicamente como proyección auxiliar si demuestra utilidad.

No utilizar la conversión a HTML como sustituto de los localizadores normativos, revisiones, tablas anidadas, uniones de celdas o estructura original.

## **6.5. MD, TXT, JSON, YAML y OpenAPI**

Se recomienda conservar el ecosistema actual cuando cumpla los contratos de seguridad.

| Formato | Principal                                        | Respaldo                                      | Garantía requerida                           |
| ------- | ------------------------------------------------ | --------------------------------------------- | -------------------------------------------- |
| TXT     | Decodificador acotado y preservación de bytes    | Biblioteca de codificaciones aprobada         | Codificación, offsets y líneas               |
| MD      | AST CommonMark/remark                            | markdown-it con localizadores complementarios | Encabezados, listas, tablas, bloques         |
| JSON    | Parser con control previo de léxico y duplicados | Parser incremental con posiciones             | Tipado, profundidad, punteros                |
| YAML    | Biblioteca YAML existente                        | Parser alternativo por esquema                | Tags, aliases, duplicados y límites          |
| OpenAPI | Parser inerte y AJV por dialecto                 | Validador especializado                       | Resolución gobernada y semántica direccional |

En OpenAPI, ET-07 deberá coordinar el soporte de versiones y dialectos.

El adaptador documental no debe disponer de un resolvedor que acceda libremente a `file://`, direcciones internas, servicios de red o credenciales del usuario.

La evaluación de conformidad OpenAPI completa pertenece conjuntamente a ET-07; ET-05 garantiza la conservación fiel y la seguridad del documento ingerido.

## **6.6. Matriz de garantías D10**

| Clase           | Resultado necesario                  | Candidato                | Prueba negativa obligatoria        | Respaldo                |
| --------------- | ------------------------------------ | ------------------------ | ---------------------------------- | ----------------------- |
| PDF digital     | Texto y coordenadas                  | PDF.js                   | Orden falso, texto ausente         | PDFium/PDFBox           |
| PDF escaneado   | Texto y regiones                     | Tesseract                | Dígito, signo o región omitida     | PaddleOCR               |
| PDF mixto       | Conciliación texto/OCR               | PDF.js + OCR             | Duplicación de texto               | Motor nativo + OCR      |
| PDF multipágina | Tabla y continuidad                  | Reconstrucción gobernada | Fila duplicada en cambio de página | Extractor especializado |
| PDF protegido   | Estado explícito y acceso autorizado | Broker + parser          | Archivo inaccesible                | Adaptador compatible    |
| DOCX            | Partes, estructura y tablas          | OOXML                    | Unión o revisión omitida           | POI                     |
| XLSX/XLSM       | Celdas, hojas y estructura           | OOXML pasivo             | Macro y vínculo externo            | SheetJS CE/POI          |
| XLS/XLSB        | Lectura pasiva según clase           | SheetJS CE               | Coerción o pérdida de fórmula      | POI/Calc según formato  |
| TXT/MD          | Texto y estructura                   | Parser local             | Codificación y truncamiento        | Parser alternativo      |
| JSON/YAML       | Tipos, origen y estructura           | Parser gobernado         | Duplicados, profundidad, alias     | Parser alternativo      |
| OpenAPI         | Documento y dialecto                 | Adaptador ET-07          | Referencia arbitraria              | Validador por dialecto  |

**Estado de todas las clases:** condicionado a EXP-06b y a la calificación instalada.

# **7. Evaluación D11 — Validación de reportes PDF y Excel del AUT**

## **7.1. Separación obligatoria de planos**

**Reporte real emitido por el AUT**

Bytes originales, intento, filtros efectivos, población, rol y revisión.

Plano 1

**Extracción**

Qué contiene realmente el archivo.

Plano 2

**Semántica Excel**

Qué resultado produce la hoja bajo condiciones acreditadas.

Plano 3

**Regla de negocio**

Qué resultado debería producir según el contrato empresarial.

**Comparador por afirmación**

Expectativa acreditada + testigo suficiente + tolerancia versionada + alcance.

**Sobre canónico de resultado**

PASS · FAIL · INDETERMINATE · BLOCKED · SKIPPED · ERROR

El núcleo conserva los cuatro ejes y calcula la aceptación conforme AV-04/AR-52.

Esta separación debe ser inviolable.

Un motor de recálculo puede detectar una inconsistencia matemática de la hoja y aun así ser incapaz de determinar si el reporte satisface la regla de negocio.

## **7.2. Evaluación de lectores Excel**

| Tecnología       | Lectura XLSX          | XLS/XLSB                        | Fórmulas                          | Recálculo                     | Distribución         |
| ---------------- | --------------------- | ------------------------------- | --------------------------------- | ----------------------------- | -------------------- |
| ExcelJS          | Documentada           | No es su ámbito principal       | Lee/escribe fórmulas y resultados | No                            | MIT                  |
| SheetJS CE       | Documentada           | Documentada según formato       | Soporte diferenciado por formato  | No general en CE              | Apache-2.0           |
| Lector OOXML     | Candidato estructural | No                              | Léxico original y metadatos       | No                            | Según implementación |
| Apache POI       | HSSF/XSSF             | Soporte desigual por formato    | Lectura y evaluación parcial      | Parcial                       | Apache-2.0           |
| LibreOffice Calc | Documentada           | Importación según formato/build | Motor de hoja                     | Sí, no equivalencia universal | MPL-2.0 y terceros   |

ExcelJS documenta expresamente que los resultados de fórmulas deben suministrarse; la biblioteca no calcula por sí misma el resultado.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.npmjs.com\&sz=32)

npm+1



SheetJS CE conserva información de fórmulas según los formatos soportados. Su opción `raw` no implica preservación universal del léxico original OOXML.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://docs.sheetjs.com\&sz=32)

SheetJS Community Edition+1



Apache POI documenta APIs diferenciadas para procesamiento y evaluación de hojas Excel, con limitaciones propias.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://poi.apache.org\&sz=32)

poi.apache.org



### **Recomendación**

**Ruta primaria compuesta:**

1. Lector estructural OOXML para preservar hechos y léxico.
2. SheetJS CE para ampliar lectura pasiva y variantes.
3. Motor de semántica Excel separado.
4. Motor independiente de negocio.

No recomiendo ExcelJS como único lector de D11. Sí resulta candidato para generar los XLSX propios de QAP.

### **Riesgo específico de SheetJS**

Los avisos oficiales documentan:

- CVE-2023-30533: contaminación de prototipos en versiones afectadas.
- CVE-2024-22363: denegación de servicio mediante expresiones regulares.

[image](https://www.google.com/s2/favicons?domain=https://cdn.sheetjs.com\&sz=32)

cdn.sheetjs.com+1

La documentación de distribución indica `0.20.3` mediante el CDN del proveedor.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://docs.sheetjs.com\&sz=32)

SheetJS Community Edition



**Condiciones:** utilizar una versión corregida y verificable, procedencia y digest fijados, distribución offline aprobada y seguimiento de avisos específico. No instalar automáticamente una versión antigua publicada en npm por comodidad.

## **7.3. Evaluación de motores de recálculo**

| Candidato                   | Beneficio                                             | Riesgo principal                                     | Decisión                                          |
| --------------------------- | ----------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------- |
| Evaluador acotado           | Control de semántica, autoridad y cobertura declarada | Costo de reproducir funciones y casos complejos      | Principal                                         |
| LibreOffice Calc            | Motor maduro y amplio                                 | Divergencias con Excel y paquete pesado              | Respaldo                                          |
| HyperFormula                | Motor headless con integración JavaScript             | GPLv3/comercial y equivalencia incompleta            | Condicionado                                      |
| Apache POI FormulaEvaluator | Reutilización potencial de JVM                        | Funciones y constructos no equivalentes              | Respaldo adicional                                |
| Microsoft Excel             | Referencia de semántica por build                     | Dependencia comercial y multiplataforma insuficiente | Referencia de laboratorio, no runtime obligatorio |

HyperFormula documenta compatibilidad configurable con Excel y licencia GPLv3 o comercial. La documentación consultada corresponde a la versión 3.5.0.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://handsontable.com\&sz=32)

HyperFormula (v3.5.0)+1



No recomiendo incorporarlo como dependencia obligatoria del producto distribuido bajo una política permisiva sin resolver previamente las obligaciones de licencia. Separarlo en otro proceso tampoco demuestra automáticamente compatibilidad jurídica.

LibreOffice ofrece una ruta local sin suscripción obligatoria. Su licencia principal MPL-2.0 convive con otros componentes licenciados independientemente.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.libreoffice.org\&sz=32)

LibreOffice



La versión 26.8.0 para Windows x86-64 aparece en la página oficial consultada, pero la versión final, las arquitecturas y los artefactos exactos deben calificarse posteriormente.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.libreoffice.org\&sz=32)

LibreOffice



### **ET05-H07 — La equivalencia de Excel sigue siendo un riesgo de lanzamiento**

No existe evidencia suficiente para garantizar que un evaluador acotado, Calc, HyperFormula o POI cubran todas las clases obligatorias de D11.

Por ello:

- No declarar conformidad universal con Excel.
- No considerar la ausencia de caché como defecto automático.
- No esconder constructos sin soporte bajo una tasa global de éxito.
- No convertir la abstención sistemática en estrategia de cumplimiento.

**AR-20 permanece BLOQUEANTE.**

## **7.4. Matriz de clases D11**

| Clase                 | Comportamiento necesario                  | Principal/respaldo    | Calificación requerida               |
| --------------------- | ----------------------------------------- | --------------------- | ------------------------------------ |
| Literales             | Valor, tipo y léxico                      | OOXML/SheetJS         | Concordancia exacta                  |
| Vacíos                | Diferenciar ausente, vacío y cadena vacía | OOXML/POI             | Estados independientes               |
| Fórmula con caché     | Preservar fórmula, valor y frescura       | Lector + motor        | Comparación acreditada               |
| Fórmula sin caché     | Evaluar si corresponde, sin falso FAIL    | Evaluador/Calc        | Causa y expectativa                  |
| Error Excel           | Conservar error y contexto                | Lector + motor        | Error esperado/inesperado            |
| Shared formulas       | Reconstrucción desde ancla                | OOXML + evaluador     | Traducción exacta                    |
| Array/spill           | Preservar geometría y dependencias        | Evaluador/Calc        | Celdas y resultados                  |
| Multih hoja           | Referencias relativas y absolutas         | Evaluador/Calc        | Grafo acreditado                     |
| SUBTOTAL              | Diferenciar filtros y ocultación manual   | Evaluador/Calc        | Variantes 1–11 y 101–111             |
| Fechas                | Sistemas 1900/1904 y serial ficticio 60   | Lector + regla tipada | Sin conversión silenciosa            |
| Volátiles/UDF/LAMBDA  | Inventario y semántica según alcance      | Motor calificado      | Sin ejecución arbitraria             |
| Dependencias externas | Catálogo autorizado y revisión            | Broker                | Sin red libre ni permisos implícitos |
| PDF tabular           | Registros y totales multipágina           | PDF.js/PDFium + OCR   | Cardinalidad y exactitud             |
| Reporte vacío         | Población legítimamente vacía             | Comparador            | PASS cuando corresponde              |
| Reporte filtrado      | Filtros efectivos, rol, tenant y fecha    | Comparador + testigo  | Cero intrusiones                     |
| Conciliación          | Comparar filas y grupos antes del total   | Regla decimal         | Mutantes compensados                 |

Toda clase obligatoria sin candidato o respaldo capaz debe elevarse al Orquestador.

## **7.5. El total correcto no implica que el reporte sea correcto**

Ejemplo conceptual, no resultado de un experimento:

| Registro | Esperado | Reporte emitido |
| -------- | -------- | --------------- |
| A        | $100.00  | $120.00         |
| B        | $200.00  | $180.00         |
| Total    | $300.00  | $300.00         |

Una validación exclusiva del total produciría un falso PASS.

QAP debe comparar:

- Identidad de cada registro.
- Población y cardinalidad.
- Duplicados, faltantes e intrusiones.
- Campos, grupos, signos e importes.
- Reglas y redondeos acreditados.
- Totales y correspondencia con la selección efectiva.

La coincidencia de un agregado nunca puede ocultar discrepancias materiales de nivel inferior.

# **8. TypedRuleOracle y cálculo de negocio**

## **8.1. Comparación tecnológica**

| Tecnología        | Propiedad                          | Ventaja                                     | Limitación                                  |
| ----------------- | ---------------------------------- | ------------------------------------------- | ------------------------------------------- |
| JavaScript Number | Punto flotante binario             | Integración existente                       | No garantiza exactitud decimal empresarial  |
| Decimal.js        | Precisión y redondeo configurables | Integración TypeScript/JavaScript           | Requiere gobernar precisión e intermedios   |
| Big.js            | Aritmética decimal                 | Biblioteca especializada y simple           | Menor amplitud funcional según operación    |
| BigInt            | Enteros exactos                    | Adecuado para unidades monetarias escaladas | División y escalas requieren reglas         |
| Racionales        | Fracciones exactas                 | Evita pérdida prematura                     | Crecimiento de representación y complejidad |
| BigDecimal Java   | Decimal en JVM                     | Alternativa si ET-01 adopta Java            | JRE y frontera adicional si no existe       |

Decimal.js documenta precisión configurable, múltiples modos de redondeo y operaciones aritméticas de precisión arbitraria.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://mikemcl.github.io\&sz=32)

mikemcl.github.io



### **Recomendación**

En una composición TypeScript/Node, **Decimal.js como candidato principal**, complementado por enteros escalados o racionales cuando la semántica de la regla lo exija.

No se recomienda reproducir Microsoft Excel mediante Decimal.js. El motor decimal debe acreditar el cálculo empresarial, no imitar indiscriminadamente la aritmética binaria de Excel.

## **8.2. Contrato lógico mínimo del oráculo**

Cada evaluación deberá disponer de:

| Campo lógico                  | Propósito                                   |
| ----------------------------- | ------------------------------------------- |
| Identidad y revisión de regla | Reproducibilidad                            |
| Fuente y vigencia             | Autoridad                                   |
| Tipo de dato                  | Evitar coerción silenciosa                  |
| Moneda o unidad               | Evitar comparaciones incompatibles          |
| Escala                        | Precisión de entrada                        |
| Redondeo                      | Modo, momento e intermedios                 |
| Tolerancia                    | Criterio acreditado                         |
| Contexto regional             | Fecha civil, formato y locale               |
| Testigo                       | Procedencia y suficiencia causal            |
| Dependencias                  | Fuente compartida y riesgo de contaminación |
| Afirmación                    | Unidad evaluada                             |
| Resultado                     | Hechos para agregación canónica             |

Los nombres físicos de campos serán determinados por ET-01 y ET-02; este informe no crea un DTO definitivo.

## **8.3. Motor declarativo**

Recomiendo un AST tipado y acotado con operadores permitidos para comparaciones, aritmética, relaciones, conjuntos, reglas temporales y conciliación.

Alternativas como JSON Logic o CEL pueden evaluarse como tecnologías auxiliares, pero no deben adoptarse sin verificar semántica decimal, coerción, evaluación acotada y compatibilidad con la taxonomía del núcleo.

No utilizar:

- `eval`.
- JavaScript arbitrario generado por un HOST.
- Fórmulas de usuario ejecutadas directamente como código.
- Expresiones SQL libres.
- Funciones que adquieran datos externos fuera de autorización.

## **8.4. Cobertura de oráculos**

| Obligación           | Control sano                   | Control negativo                  | Resultado exigido             |
| -------------------- | ------------------------------ | --------------------------------- | ----------------------------- |
| Persistencia         | Operación y efecto corroborado | HTTP correcto con rollback        | FAIL acreditado en mutante    |
| Cálculo              | Regla y datos conciliados      | Error monetario material          | Detección conforme tolerancia |
| No mutación          | Denegación sin cambios         | Denegación con efecto oculto      | FAIL con testigo suficiente   |
| Convergencia         | Estado final dentro de ventana | Estado intermedio atascado        | Clasificación causal correcta |
| Autoridad documental | Regla vigente y acreditada     | Conflicto material irresuelto     | Abstención justificada        |
| Independencia        | Fuente causal suficiente       | Testigo dependiente del productor | No acreditar indebidamente    |

El modelo de seis veredictos permanece intacto. Las categorías de salud de evidencia, estado técnico y limpieza no se convierten en veredictos adicionales.

# **9. Reportes profesionales propios de QAP**

## **9.1. Composición recomendada**

El núcleo no debe generar una verdad diferente para cada formato de salida.

**Sobre canónico sellado**

Resultados, afirmaciones, testigos, efectos y estados.

**Consulta autorizada + corte temporal**

Selección, destinatario, métricas, omisiones y redacción.

**Proyección canónica versionada**

HTML

MD

JSON

JSONL

CSV

JUnit

PDF

XLSX

**Publicación derivada**

Digest, manifiesto, procedencia, política y vínculo con la fuente.

Un renderer puede fallar, omitir contenido por autorización o producir una proyección parcial. Ninguno puede modificar las afirmaciones originales.

## **9.2. PDF propio**

| Candidato               | Ventajas                                               | Inconvenientes                                         |
| ----------------------- | ------------------------------------------------------ | ------------------------------------------------------ |
| PDFKit                  | Generación directa, tablas, etiquetas de accesibilidad | Responsabilidad explícita sobre layout y estructura    |
| pdfmake                 | Plantillas declarativas y tablas                       | Calificación de accesibilidad y dependencia subyacente |
| Playwright/Chromium PDF | Reutilización de HTML/CSS                              | Costo del navegador y proceso adicional                |
| Apache PDFBox           | Control PDF en JVM                                     | Mayor complejidad de layout y runtime Java             |

La página oficial de releases consultada identifica PDFKit `0.21.0`. Sus APIs documentan tablas y estructuras para construir documentos etiquetados accesibles.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub+2



Estas capacidades no constituyen una certificación automática PDF/UA.

### **Recomendación principal: PDFKit**

Preferible como candidato inicial por generación directa desde datos autorizados, control de metadatos y menor necesidad de ejecutar un navegador dedicado para producir el reporte.

**Respaldo:** renderización HTML a PDF mediante Chromium, con documento exclusivamente generado por QAP, recursos locales aprobados y política que impida egress.

El respaldo no puede cargar HTML hostil procedente del AUT.

### **Garantías de generación**

El PDF propio deberá mantener:

- Encabezados y continuidad de tablas entre páginas.
- Filas sin truncamiento ni omisión silenciosa.
- Contexto de proyecto, revisión y corte permitido.
- Navegación y accesibilidad aplicables.
- Fuentes legalmente redistribuibles.
- Ausencia de comentarios, capas, acciones, adjuntos y metadatos sensibles indebidos.
- Identidad de publicación y procedencia derivada.

El PDF propio no constituye evidencia primaria de lo ocurrido en el AUT.

## **9.3. XLSX propio**

| Candidato        | Ventaja                                      | Limitación                                          |
| ---------------- | -------------------------------------------- | --------------------------------------------------- |
| ExcelJS          | Escritura tipada, estilos, hojas y streaming | No calcula fórmulas; probar precisión y memoria     |
| SheetJS CE       | Lectura/escritura multiformato               | Capacidades avanzadas de presentación diferenciadas |
| Apache POI/SXSSF | Generación especializada y streaming         | JRE, temporales y costo de empaquetado              |
| OOXML directo    | Control estructural exhaustivo               | Mayor costo de implementación y mantenimiento       |

La página oficial de ExcelJS consultada identifica `4.4.0` como última release publicada allí.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub



La permanencia de una versión estable no certifica mantenimiento suficiente. La decisión futura debe considerar issues relevantes, dependencias, correcciones y capacidad de respuesta ante vulnerabilidades.

### **Recomendación principal: ExcelJS**

Su ámbito de generación XLSX se ajusta mejor a la construcción de reportes propios que a la validación integral de documentos del AUT.

### **ET05-H08 — Precisión y tipado de exportación**

Una celda Excel numérica no puede representar arbitrariamente todos los identificadores y decimales exactos del dominio.

QAP debe distinguir:

| Dato                             | Representación candidata                                                    |
| -------------------------------- | --------------------------------------------------------------------------- |
| Identificador `00001234`         | Texto                                                                       |
| Número de contrato extenso       | Texto                                                                       |
| Entero de magnitud representable | Número, tras validación                                                     |
| Decimal monetario                | Número cuando la representación sea admisible                               |
| Decimal que perdería precisión   | Representación exacta tipada/textual y pérdida declarada cuando corresponda |
| Fecha civil                      | Fecha o representación ISO según contrato                                   |
| Fecha y hora con zona            | Representación que preserve contexto temporal                               |
| Texto que comienza con `=`       | Celda textual, nunca fórmula implícita                                      |

No debe modificarse silenciosamente el contenido para acomodar limitaciones del formato.

Si una proyección no puede mantener simultáneamente exactitud y representación numérica nativa, deberá informar la limitación y conservar una representación autorizada exacta.

### **Sanitización XLSX**

Se recomienda construir el libro desde cero a partir de la proyección.

No reutilizar como plantilla activa un archivo del AUT.

El archivo final debe inspeccionarse estructuralmente para detectar relaciones externas, macros, fórmulas inesperadas, hojas ocultas, comentarios, objetos embebidos y propiedades documentales que contradigan el perfil de entrega.

## **9.4. HTML, Markdown, CSV, JSON y JSONL**

| Formato  | Ruta tecnológica             | Riesgo a controlar                          |
| -------- | ---------------------------- | ------------------------------------------- |
| HTML     | Generador existente adaptado | XSS, data URIs privadas, CDN                |
| Markdown | Renderer determinista        | HTML activo y enlaces externos              |
| CSV      | Serializador tipado          | Inyección de fórmulas y coerción de IDs     |
| JSON     | DTO versionado               | Pérdida de precisión y exposición de campos |
| JSONL    | Serialización por registros  | Orden, límites, truncamiento y secretos     |

Para CSV, la política de salida debe documentar separadores, codificación, escapado y tratamiento de campos interpretables como fórmulas por los clientes de hojas de cálculo.

No existe una sanitización universal que preserve idéntica semántica en todos los lectores CSV. Debe calificarse el perfil de intercambio y declarar las transformaciones aplicadas.

## **9.5. JUnit y guardia de campaña**

El contrato AC-01 §6.1 prevalece sobre el generador histórico.

La representación candidata debe conservar:

| Veredicto     | Proyección JUnit                                               |
| ------------- | -------------------------------------------------------------- |
| PASS          | Testcase sin error cuando representa una afirmación acreditada |
| FAIL          | `failure`                                                      |
| ERROR         | `error`                                                        |
| BLOCKED       | Representación de impedimento conforme al contrato             |
| INDETERMINATE | Representación de insuficiencia conforme al contrato           |
| SKIPPED       | `skipped` con motivo y alcance                                 |

La tabla normativa exacta de AC-01 y AR-52 prevalece sobre cualquier resumen anterior. No se propone sustituirla.

Debe incorporarse la guardia sintética:

`QAP_CANONICAL_GATE`

Esta guardia:

- Permanece fuera del universo de pruebas del AUT.
- No puede considerar satisfactoria una campaña abierta.
- No transforma un ACK exitoso en código terminal de campaña.
- No aprueba una campaña vacía.
- No permite que una entrega omitida, una limpieza pendiente o un veto desaparezcan en XML.
- No sustituye la verificación del sobre ni el código canónico AR-52.

La función del serializador XML es representar resultados, nunca decidirlos.

### **Dictamen JUnit**

**CONDICIONADO**, pendiente de reconciliación exacta con ET-07 y validación E1/E7 de consumidores instalados.

# **10. Multimedia y evidencias visuales**

## **10.1. Comparación de rutas C y A**

El diseño ratificado exige evaluar primero C y conservar A como respaldo equivalente.

### **C — Captura nativa protegida**

Contexto de negocio admitido

Grabador nativo del navegador

Staging protegido desde primer byte

Remux si es necesario

Sellado AEAD y catálogo

Principal candidata

### **A — Frames acotados y códec**

Contexto de negocio admitido

Callback de frames JPEG

Cola acotada y backpressure

Códec y muxer WebM

Sellado AEAD y catálogo

Respaldo condicionado

| Criterio                        | Ruta C                            | Ruta A                            |
| ------------------------------- | --------------------------------- | --------------------------------- |
| Integración inicial             | Menor complejidad relativa        | Mayor complejidad relativa        |
| Control de archivos productores | Depende del navegador             | Mayor control potencial           |
| Control de colas                | Parcialmente interno al proveedor | Gobernable en la frontera propia  |
| Carga del proceso QAP           | Potencialmente inferior           | Procesamiento explícito de frames |
| Fidelidad temporal              | Debe medirse                      | Debe medirse                      |
| Seek                            | Depende del WebM resultante       | Configurable mediante muxer       |
| Privacidad preventiva           | Requiere barrera acreditada       | Requiere la misma barrera         |
| Custodia                        | Todo archivo y copia efectiva     | Toda cola, pipe y staging         |
| Portabilidad                    | Por motor y build                 | Por API, códec y build            |
| Dictamen                        | Condicionado                      | Condicionado                      |

La API de screencast de Playwright documenta captura y controles de grabación, pero no certifica por sí misma las garantías de privacidad de QAP.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://playwright.dev\&sz=32)

Playwright



### **ET05-H09 — El destino solicitado no es necesariamente la primera escritura**

La fe de correcciones AR-27 fija una inspección del código upstream de Playwright 1.62.1 según la cual la grabación puede escribirse inicialmente en `artifactsDir` y copiarse posteriormente al destino solicitado.

También identifica perfiles temporales independientes de dicho directorio.

Por tanto, configurar únicamente la ruta final del video no demuestra custodia.

Deben verificarse todas las ubicaciones efectivas del cliente, servidor, navegador, perfiles, descargas, grabación, cachés, códec y remux.

## **10.2. Supresión preventiva**

La política debe actuar antes de iniciar o continuar cualquier capturador.

La transición SPA a MFA sin solicitud HTTP constituye un escenario crítico expresamente documentado en AS-04.

No debe resolverse mediante una lista de URLs, filtrado posterior de imágenes, reconocimiento OCR retrospectivo o monitorización exclusiva de solicitudes HTTP.

### **ET05-H10 — Riesgo transversal de ausencia de barrera previa**

Este es el principal riesgo técnico de la especialidad multimedia.

Si un navegador no ofrece un mecanismo suficiente para excluir previamente una superficie prohibida, y el AUT tampoco proporciona una frontera cooperativa acreditada, puede no existir una ruta documental suficiente para grabar ese intervalo.

La ruta A ofrece mayor control del productor, pero **no resuelve automáticamente la admisión previa de contenido**.

Dictamen: **SIN RUTA DOCUMENTAL SUFICIENTE** para afirmar captura preventiva universal de superficies arbitrarias sin barrera acreditada.

Consecuencia: supresión anticipada cuando corresponda, registro de brecha y mantenimiento del bloqueo de capacidad obligatoria si no existe una alternativa que preserve su garantía.

La supresión es una salvaguarda; no una demostración de cobertura multimedia.

## **10.3. Matriz preliminar por navegador**

| Motor/canal             | Visible                  | Oculto                   | Ruta C       | Ruta A       | Reserva                    |
| ----------------------- | ------------------------ | ------------------------ | ------------ | ------------ | -------------------------- |
| Chromium completo       | Requerido                | Requerido                | Candidata    | Candidata    | Barrera y custodia         |
| Chromium Headless Shell | No aplicable             | Según alcance            | Candidata    | Candidata    | Fidelidad independiente    |
| Chrome                  | Según soporte ratificado | Según soporte ratificado | Condicionada | Condicionada | Políticas y build efectivo |
| Edge                    | Según soporte ratificado | Según soporte ratificado | Condicionada | Condicionada | Políticas y build efectivo |
| Firefox Playwright      | Requerido según matriz   | Requerido según matriz   | Condicionada | Condicionada | Frontera sin CDP           |
| WebKit Playwright       | Requerido según matriz   | Requerido según matriz   | Condicionada | Condicionada | Variantes por SO           |

La matriz debe expandirse por los tres SO, CPU, revisión, modalidad y perfil instalado. No constituye certificación de sus combinaciones.

WebKit de Playwright no equivale automáticamente a Safari de distribución. Chromium completo tampoco equivale a Headless Shell.

Las modalidades visible y oculta deben calificarse independientemente.

## **10.4. Códecs y contenedores**

| Alternativa                      | Ventaja                                  | Desventaja                                               | Dictamen                                  |
| -------------------------------- | ---------------------------------------- | -------------------------------------------------------- | ----------------------------------------- |
| FFmpeg empaquetado por navegador | Reutilización                            | Build y opciones limitadas por proveedor                 | Condicionado                              |
| FFmpeg/libvpx controlado         | Codificación VP8/VP9, remux y control    | Binarios, licencias y parcheo                            | Principal para respaldo A                 |
| libvpx + libwebm                 | Control específico del stack             | Mayor trabajo nativo e integración                       | Respaldo                                  |
| WebCodecs + muxer                | Posible aprovechamiento del navegador    | Disponibilidad, perfiles y custodia por motor            | Experimental futuro condicionado          |
| MP4/H.264                        | Compatibilidad extendida de reproducción | Cambia formato normativo y añade consideraciones legales | No equivalente como sustituto obligatorio |

FFmpeg se distribuye bajo condiciones LGPL o GPL según los componentes y opciones incorporados al build.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://ffmpeg.org\&sz=32)

ffmpeg.org



La extensión `.webm` no demuestra que el artefacto sea un WebM válido, íntegro o posicionable. Debe comprobarse su estructura, códec, duración, índices y reproducción real conforme a la especificación del contenedor.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.webmproject.org\&sz=32)

WebM Container Guidelines



### **Recomendación**

Mantener **WebM auténtico con VP8 como primer candidato de interoperabilidad**, sin impedir la evaluación posterior de otros códecs WebM cuando exista justificación.

La composición final debe evitar grabar audio cuando no sea necesario ni esté autorizado.

### **Economía de codificación**

No se determina por la frecuencia nominal de frames:

- Frames útiles realmente producidos.
- Duplicados.
- Pérdida de frames bajo presión.
- Resolución y geometría.
- Costo de compresión.
- Crecimiento de temporales.
- Capacidad de búsqueda.
- Latencia de disponibilidad.

Todas estas variables requieren medición pareada de C y A.

## **10.5. Backpressure y almacenamiento**

La ruta A debe gobernar explícitamente la capacidad de cada cola.

### **Estimador teórico de flujo de frames**

Ejemplo matemático editable para explicar los presupuestos. No es un benchmark de QAP, Playwright ni FFmpeg.

Frecuencia nominal

25 fps

Tamaño medio supuesto de frame

200 KiB

Capacidad de cola

10 frames

Entrada teórica

# **4.88 MiB/s**

Payload de la cola llena

# **1.95 MiB**

Excluye navegador, decodificación JPEG, copias de memoria, códec, sockets, GPU, cifrado y demás buffers. Los valores iniciales son ilustrativos; no se proponen como defaults.

Este modelo permite explicar por qué una cola finita no demuestra por sí sola un límite global de RAM.

La calificación debe medir la tubería completa, incluidos productores y consumidores.

# **11. Cifrado, autenticidad y reproducción posicionable**

## **11.1. Comparación criptográfica**

| Tecnología                        | Streaming autenticado        | Seek arbitrario acotado                                      | Dictamen                       |
| --------------------------------- | ---------------------------- | ------------------------------------------------------------ | ------------------------------ |
| Tink Java Streaming AEAD          | Documentado                  | API posicionable identificada en expediente                  | Principal condicionado         |
| Tink Go                           | Documentado                  | No acreditado en la interfaz inspeccionada por el expediente | Condicionado                   |
| Tink C++                          | Según implementación/build   | Debe verificarse API equivalente                             | Alternativa por investigar     |
| libsodium secretstream            | Documentado                  | No equivalente automáticamente                               | No apto como reemplazo directo |
| AES-GCM con formato propio        | Primitiva disponible         | Requeriría diseñar protocolo propio                          | Descartado                     |
| Cifrado de volumen exclusivamente | Protección de almacenamiento | No proporciona el contrato criptográfico requerido           | Complementario                 |

La especificación de Tink AES-GCM-HKDF Streaming AEAD define un formato segmentado con cabecera, derivación y autenticación por segmentos.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://developers.google.com\&sz=32)

developers.google.com



La documentación de libsodium `secretstream` describe una secuencia autenticada de mensajes. No demuestra un mecanismo equivalente de acceso arbitrario independiente del prefijo.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://doc.libsodium.org\&sz=32)

doc.libsodium.org



La página oficial de releases de Tink Java consultada identifica `1.24.0`.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub



No obstante, el acceso directo a la interfaz Java desde su enlace upstream falló durante esta investigación. La capacidad posicionable está respaldada por el expediente normativo AR-27, pero no se volvió a verificar independientemente sobre ese tag exacto.

**Recomendación:** Tink Java como candidato principal, sujeto a comprobación de API, JRE, proveedor JCA, versión exacta y distribución.

### **ET05-H11 — No existe respaldo criptográfico completo acreditado documentalmente**

Aunque existen alternativas revisadas de cifrado secuencial, no se identificó y verificó independientemente una segunda implementación que satisfaga de forma completa el contrato de lectura posicionable autenticada de QAP.

No sería correcto inventar una segunda opción equivalente.

Si Tink Java falla y no se identifica una implementación revisada con garantías equivalentes, AR-27 permanece impedido.

**Dictamen del respaldo criptográfico: SIN RUTA DOCUMENTAL SUFICIENTE.**

## **11.2. Flujo candidato de custodia**

La construcción criptográfica debe gobernar sus propios nonces, segmentos y cierre.

QAP únicamente define el contexto autenticado, políticas de claves, persistencia y autorización de aplicación.

No se diseñará un formato criptográfico propio.

## **11.3. Lectura y Range**

El visor deberá utilizar rangos de bytes lógicos del WebM, no posiciones arbitrarias del ciphertext expuestas al cliente.

El mecanismo deberá:

1. Autenticar y autorizar la solicitud.
2. Resolver una generación `COMMITTED`.
3. Comprobar la vinculación del manifiesto y objeto.
4. Resolver el rango dentro de la longitud comprometida.
5. Autenticar los segmentos necesarios antes de emitir sus bytes.
6. Revalidar las barreras de acceso y revocación.
7. Interrumpir emisiones afectadas cuando corresponda.
8. Mantener ausencia de caché reutilizable bajo control de QAP.

Fuente normativa externa: [RFC 9110, Range Requests](https://www.rfc-editor.org/rfc/rfc9110.html?utm_source=chatgpt.com#name-range-requests), referenciada por AR-27.

La prueba de seek no sustituye la prueba de integridad completa al sellar o reconciliar.

## **11.4. Grants independientes**

| Grant     | Permite                     | No permite automáticamente            |
| --------- | --------------------------- | ------------------------------------- |
| `capture` | Adquirir medios autorizados | Consultar o exportar todos los medios |
| `access`  | Consultar una evidencia     | Capturar o exportar                   |
| `retain`  | Conservar según política    | Nuevos accesos                        |
| `export`  | Entregar copia autorizada   | Nuevas capturas o permisos generales  |

La revocación de captura y acceso no implica automáticamente la pérdida de la autorización de conservación.

La revocación de conservación prevalece sobre copias controladas que dependan de ese grant.

No se promete recuperar bytes ya entregados a terceros ni borrar físicamente todas las copias en SSD, snapshots o respaldos.

# **12. Retención, memoria reproductiva y publicación**

## **12.1. Retención ratificada**

| Información                                  | Política DE-01                                                   |
| -------------------------------------------- | ---------------------------------------------------------------- |
| Detalle estructurado                         | 90 días                                                          |
| Resumen histórico                            | Permanente hasta eliminación expresa                             |
| Conocimiento vigente                         | Sin caducidad automática                                         |
| Casos activos                                | Sin caducidad automática                                         |
| Videos/capturas de éxitos                    | Referencia operativa de hasta 24 horas                           |
| Trazas exitosas                              | Referencia operativa de 72 horas                                 |
| Evidencia de fallos                          | Al menos 14 días, sujeta a conservación autorizada y excepciones |
| Defectos abiertos y evidencia imprescindible | Protección conforme al grant                                     |
| Autoarchivo                                  | Opcional y configurable                                          |
| Exportación                                  | Manual y gobernada                                               |

No se fijan cuotas físicas arbitrarias.

Los plazos operativos están sujetos a las condiciones, precedencias y excepciones del acta DE, no a una regla indiscriminada de eliminación.

## **12.2. Receta durable**

Una receta reproducible no puede consistir únicamente en enlaces a evidencia que expirará.

El núcleo y ET-02 deberán conservar, según autorización:

- Identidad del defecto y ámbito.
- Revisiones de AUT, regla, caso y plan.
- Precondiciones y estado lógico.
- Datos reproducibles permitidos o referencias gobernadas.
- Operaciones ejecutadas y efectos.
- Afirmaciones, testigos y discrepancias.
- Requisitos de entorno.
- Dependencias de evidencia y su disponibilidad.
- Procedimiento de retest.

La reproducción posterior crea un nuevo intento. No sustituye ni reescribe el fallo histórico.

## **12.3. Promoción previa a poda**

Debe existir una promoción selectiva de hechos y receta compacta antes de eliminar datos de detalle.

La promoción no autoriza copiar automáticamente medios privados para evadir los plazos de retención.

Cuando una evidencia indispensable deje de estar disponible:

- Se conserva el hecho histórico acreditado.
- Se registra el motivo de indisponibilidad.
- Se retira la acreditación actual cuando dependa de dicha evidencia.
- Se evita reconstruir ficticiamente el payload perdido.

### **ET05-H12 — La pérdida de verificabilidad y el resultado histórico son dimensiones distintas**

Un sistema que cambia retrospectivamente un FAIL por PASS después de podar evidencia incumple el contrato de integridad histórica.

Un sistema que continúa certificando evidencia inexistente también lo incumple.

ET-02 y ET-01 deben implementar la distinción como parte del modelo canónico, no únicamente en la presentación gráfica.

# **13. Seguridad y aislamiento multiplataforma**

## **13.1. Amenazas principales**

| Amenaza                       | Superficie                                      |
| ----------------------------- | ----------------------------------------------- |
| Ejecución de contenido activo | PDF, OOXML, macros, HTML                        |
| Descompresión descontrolada   | ZIP y formatos empaquetados                     |
| SSRF o acceso local indebido  | Referencias documentales                        |
| Denegación de servicio        | OCR, imágenes, expresiones y documentos grandes |
| Exposición de secretos        | Metadatos, logs, temporales                     |
| Manipulación de evidencia     | Objetos, manifiestos, generaciones              |
| Contaminación de oráculos     | Fuentes compartidas, documento hostil           |
| Escape de autorización        | IPC, renderer, visor o HOST                     |
| Captura prohibida             | Primer frame, SPA, MFA y transiciones           |
| Inyección de exportación      | XLSX, CSV, HTML y XML                           |

Apache POI reconoce que una biblioteca de procesamiento documental no puede proteger por sí sola frente a todos los efectos de documentos hostiles sobre el proceso.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://poi.apache.org\&sz=32)

Security guidance



La misma conclusión arquitectónica aplica a los demás parsers: los controles internos son necesarios, pero la frontera efectiva debe ser independiente de ellos.

## **13.2. Matriz por SO**

| SO      | Frontera candidata                                | Controles necesarios                                           | Respaldo |
| ------- | ------------------------------------------------- | -------------------------------------------------------------- | -------- |
| Windows | AppContainer/LPAC y Job Objects                   | ACL, reparse, handles, red, procesos, almacenamiento protegido | VM local |
| macOS   | Helper firmado, App Sandbox, XPC                  | Entitlements, red, temporales, acceso a archivos y memoria     | VM local |
| Linux   | Namespaces, seccomp, cgroups y permisos efectivos | Montajes, procesos, red, capacidades y cuotas                  | VM local |

Referencias primarias recogidas en AV-05:

- [Microsoft — AppContainer](https://learn.microsoft.com/en-us/windows/win32/secauthz/implementing-an-appcontainer?utm_source=chatgpt.com).
- [Apple — App Sandbox](https://developer.apple.com/library/archive/documentation/Miscellaneous/Reference/EntitlementKeyReference/Chapters/EnablingAppSandbox.html?utm_source=chatgpt.com).
- [Linux Kernel — Seccomp](https://www.kernel.org/doc/html/latest/userspace-api/seccomp_filter.html?utm_source=chatgpt.com).
- [Node.js — Permissions](https://nodejs.org/api/permissions.html?utm_source=chatgpt.com).

Estas referencias se utilizan como procedencia técnica del diseño ya documentado en QAP; la configuración concreta por SO debe ser contravalidada por ET-06.

No se acredita una frontera de seguridad únicamente mediante un proceso hijo de Node, un worker, una cuenta nominal distinta o un contenedor sin verificar su aislamiento efectivo.

## **13.3. Compatibilidad de candidatos por plataforma**

La matriz expresa posibilidades de distribución, no resultados de instalación.

| Componente      | Windows x64/ARM64                 | macOS Intel/ARM64               | Linux x64/ARM64                 |
| --------------- | --------------------------------- | ------------------------------- | ------------------------------- |
| PDF.js          | Condicionado a runtime y renderer | Condicionado                    | Condicionado                    |
| PDFium          | Build nativo por CPU              | Build nativo por CPU            | Build nativo por CPU            |
| Tesseract       | Binario y modelos                 | Binario y modelos               | Binario y modelos               |
| PaddleOCR       | Verificar wheels y backend        | Verificar backend por CPU       | Verificar wheels y backend      |
| SheetJS/ExcelJS | Runtime JS calificado             | Runtime JS calificado           | Runtime JS calificado           |
| Calc            | Verificar distribución efectiva   | Verificar distribución efectiva | Verificar distribución efectiva |
| Tink Java       | JRE/JCA por CPU                   | JRE/JCA por CPU                 | JRE/JCA por CPU                 |
| FFmpeg/libvpx   | Build exacto                      | Build exacto                    | Build exacto                    |
| PDFKit          | Runtime y fuentes                 | Runtime y fuentes               | Runtime y fuentes               |

No se interpreta esta tabla como una nueva obligación indiscriminada de soportar toda CPU existente. La matriz consolidada de ET-03/ET-06 determinará las celdas normativas concretas, sin eliminar las requeridas.

**Estado actual:** ninguna celda ha sido acreditada por esta investigación.

## **13.4. Límites operativos por componente**

Debe establecerse mediante calificación:

| Componente           | Límites que requieren medición                           |
| -------------------- | -------------------------------------------------------- |
| PDF                  | Páginas, objetos, imágenes, resolución, memoria y tiempo |
| OOXML                | Miembros ZIP, bytes expandidos, celdas y profundidad     |
| OCR                  | Píxeles, páginas simultáneas, hilos, modelos y scratch   |
| Motor Excel          | Grafo, fórmulas, ciclos, iteración y tiempo              |
| Oráculo decimal      | Dígitos, escala, operaciones y complejidad               |
| Exportación PDF/XLSX | Filas, páginas, tamaño y tiempo                          |
| Video                | Resolución, duración, colas, FPS y concurrencia          |
| AEAD/visor           | Segmentos, rangos, lectores y buffers                    |

No se establece un límite que excluya una clase empresarial obligatoria únicamente para mejorar rendimiento.

Si el límite seguro y el alcance requerido resultan incompatibles, corresponde bloqueo y decisión expresa.

# **14. Licencias, distribución y mantenimiento**

## **14.1. Inventario preliminar de licencias**

| Tecnología        | Licencia principal conocida  | Condición de adopción                                    |
| ----------------- | ---------------------------- | -------------------------------------------------------- |
| PDF.js            | Apache-2.0                   | Avisos, terceros y versión corregida                     |
| PDFium            | BSD-style                    | Inventario completo de terceros                          |
| Tesseract         | Apache-2.0                   | Verificar Leptonica y modelos                            |
| Tesseract.js      | Apache-2.0                   | Verificar WASM, workers y modelos                        |
| PaddleOCR         | Apache-2.0 del proyecto      | Verificar runtime y pesos                                |
| Mammoth           | BSD-2-Clause                 | Saneamiento independiente                                |
| Apache POI/PDFBox | Apache-2.0                   | JRE y dependencias                                       |
| ExcelJS           | MIT                          | Dependencias efectivas                                   |
| SheetJS CE        | Apache-2.0                   | Procedencia y distribución                               |
| HyperFormula      | GPLv3/comercial              | Resolver compatibilidad y ausencia de compra obligatoria |
| LibreOffice       | MPL-2.0 y terceros           | Obligaciones de distribución                             |
| Decimal.js        | MIT                          | Verificar versión y artefacto                            |
| PDFKit            | MIT                          | Fuentes y dependencias                                   |
| FFmpeg            | LGPL/GPL según build         | Configuración y obligaciones legales                     |
| libvpx/libwebm    | Licencias permisivas propias | Avisos y términos efectivos                              |
| Tink Java         | Apache-2.0                   | JRE, proveedor y componentes                             |

Las identificaciones que no se contrastaron en esta investigación con el archivo de licencia del tag exacto son preliminares.

No se afirma que una licencia permisiva del proyecto principal certifique toda su distribución.

## **14.2. Versiones upstream observadas**

| Componente            | Referencia identificada | Estado de verificación                     |
| --------------------- | ----------------------- | ------------------------------------------ |
| PDF.js                | Rama 6.x                | Release exacta pendiente                   |
| Tesseract             | 5.5.4                   | Tag referenciado en notas oficiales        |
| ExcelJS               | 4.4.0                   | Página oficial de releases                 |
| SheetJS CE            | 0.20.3                  | Tarball indicado por documentación oficial |
| HyperFormula          | 3.5.0                   | Documentación versionada                   |
| LibreOffice           | 26.8.0 Windows x64      | Página oficial de descarga consultada      |
| PDFKit                | 0.21.0                  | Página oficial de releases                 |
| Tink Java             | 1.24.0                  | Página oficial de releases                 |
| Playwright runner QAP | 1.62.1                  | Lockfile de la base QAP                    |
| Playwright raíz QAP   | 1.63.0                  | Lockfile de la base QAP                    |

Todas las consultas se realizaron el 26 de noviembre de 2026.

Las versiones de la tabla no equivalen a versiones seleccionadas, paquetes instalados, binarios comprobados ni matrices de soporte vigentes completas.

## **14.3. Dependencias con especial impacto económico**

| Componente         | Costo indirecto                                             |
| ------------------ | ----------------------------------------------------------- |
| JVM                | JRE, proveedor criptográfico, instalador y ciclo de parches |
| Calc               | Aplicación ofimática, perfiles, temporales y arranque       |
| OCR nativo         | Binarios, modelos, librerías de imagen                      |
| PaddleOCR          | Runtime de inferencia y pesos de modelos                    |
| PDFium             | Builds por CPU, ABI y mantenimiento                         |
| FFmpeg             | Binarios multimedia, componentes enlazados y avisos         |
| Navegador para PDF | Instalación, proceso, fuentes y memoria                     |
| Fuentes            | Redistribución legal y consistencia visual                  |

### **ET05-H13 — El costo de dependencias debe evaluarse por composición**

Si Tink Java obliga a incorporar una JVM, el costo marginal de evaluar un adaptador Java para documentos podría disminuir.

Pero esto no demuestra que deba migrarse el núcleo a Java ni que todos los parsers deban compartir el proceso criptográfico.

Al contrario: **un parser de documentos hostiles no debe compartir autoridad ni memoria con el custodio de claves**.

Se puede compartir un runtime distribuido y mantener procesos y fronteras independientes.

## **14.4. Estrategia de mantenimiento**

Se recomienda que cada componente seleccionado posteriormente disponga de:

- Versión y origen fijados.
- Digest de artefactos efectivos.
- Licencia y avisos.
- SBOM de dependencias directas y transitivas.
- Matriz de plataformas.
- Política de actualizaciones y rollback.
- Evaluación de vulnerabilidades y alcanzabilidad.
- Regresión de semántica, seguridad y portabilidad.
- Plan de sustitución cuando exista incompatibilidad o abandono.

No se considera suficiente la ejecución de un único escáner de dependencias.

La falta de un advisory publicado no demuestra ausencia de vulnerabilidades.

# **15. Economía de ingeniería**

## **15.1. Comparación relativa de composiciones**

Las valoraciones siguientes son estimaciones de complejidad estructural, no mediciones ni presupuestos monetarios.

| Composición                                  | Integración | Distribución        | Mantenimiento | Riesgo de reconstrucción              |
| -------------------------------------------- | ----------- | ------------------- | ------------- | ------------------------------------- |
| JS con helpers especializados bajo demanda   | Medio       | Medio               | Medio         | Bajo–medio                            |
| Todo JavaScript sin auxiliares nativos       | Medio       | Potencialmente bajo | Medio–alto    | Alto en criptografía y compatibilidad |
| JS + JVM compartida para varios adaptadores  | Medio–alto  | Medio–alto          | Alto          | Medio                                 |
| JS + suite LibreOffice obligatoria           | Medio–alto  | Alto                | Alto          | Medio                                 |
| Migración general del núcleo a otro lenguaje | Alto        | Indeterminado       | Indeterminado | Alto                                  |
| Servicios externos de documentos/OCR         | Variable    | Dependencia externa | Recurrente    | Incompatible con alcance obligatorio  |

### **Recomendación económica**

Evitar la reconstrucción general para resolver capacidades especializadas.

Preferir componentes activados por necesidad, con interfaces reemplazables y sin mantener permanentemente procesos de OCR, Calc, render PDF o codificación cuando no se utilizan.

Esta decisión es consistente con un producto profesional local, pero su ahorro real de recursos permanece sin medir.

## **15.2. Perfiles de recursos a medir**

| Variable          | Comparación requerida                             |
| ----------------- | ------------------------------------------------- |
| Descarga          | Paquete completo y dependencias por plataforma    |
| Tamaño instalado  | Runtime, modelos, navegadores, fuentes y binarios |
| Arranque frío     | Primer uso con componentes no residentes          |
| Arranque caliente | Reutilización de proceso cuando sea autorizada    |
| RAM               | Pico por proceso y agregado                       |
| CPU               | Procesamiento completo, incluidos helpers         |
| IO/disco          | Temporales, archivos protegidos y copias          |
| Latencia          | Primer resultado, publicación y seek              |
| Throughput        | Documentos, páginas, registros y frames           |
| Energía           | Carga representativa cuando sea relevante         |
| Tokens            | Handoff y volumen de información al HOST          |

No se establece una especificación de hardware del propietario ni una cifra mínima inventada.

## **15.3. Reducción de tokens sin comprometer verdad**

La ingesta debe generar artefactos estructurados consultables, en lugar de reenviar repetidamente documentos completos a un modelo.

El HOST podrá recibir, dentro de su autorización, fragmentos pertinentes y referencias a:

- Localizador y revisión.
- Cobertura y omisiones.
- Reglas acreditadas.
- Discrepancias.
- Resúmenes verificables.

La comparación determinista, el cálculo decimal y la generación de reportes no requieren un modelo para su funcionamiento ordinario.

No obstante, el porcentaje de ahorro debe demostrarse posteriormente mediante las comparaciones de eficiencia DE-03, no mediante estimaciones promocionales.

# **16. Contratos de interfaz con las demás especialidades**

Las siguientes denominaciones son propuestas lógicas para facilitar la coordinación. No constituyen nombres definitivos de interfaces, archivos ni servicios.

| Interfaz candidata         | Responsable cruzado | Contrato                                   |
| -------------------------- | ------------------- | ------------------------------------------ |
| `DocumentAcquisitionPort`  | ET-06/03            | Adquisición autorizada de bytes originales |
| `DocumentExtractionPort`   | ET-01/06            | Extracción aislada con localizadores       |
| `TypedRuleOracle`          | ET-01               | Evaluación tipada sin autoridad propia     |
| `WitnessPort`              | ET-03/07            | Adquisición de testigos y procedencia      |
| `ReportQueryPort`          | ET-02               | Consulta autorizada y corte temporal       |
| `ReportProjectionPort`     | ET-01/02            | Proyección versionada                      |
| `EvidenceCapturePort`      | ET-03               | Admisión previa y productores              |
| `EvidenceCustodyPort`      | ET-06               | Sellado, claves y revocación               |
| `EvidenceCatalogPort`      | ET-02               | Publicación durable                        |
| `EvidencePlaybackPort`     | ET-04/06            | Reproducción posicionable                  |
| `ExternalResultProjection` | ET-07               | JUnit e interoperabilidad                  |
| `RetentionPolicyPort`      | ET-02/06            | Conservación, promoción y poda             |

## **16.1. ET-01 — Núcleo, lenguaje y runtime**

**Dependencia crítica:** modelo canónico de tipos, afirmaciones, oráculos y estados.

Si ET-01 conserva TypeScript/Node, existe una ruta de integración relativamente directa con PDF.js, ExcelJS, SheetJS, Decimal.js y los parsers actuales.

Si ET-01 recomienda otro runtime, deberá evaluarse la reutilización mediante adaptadores, equivalentes nativos o procesos especializados.

ET-05 no condiciona unilateralmente la selección del lenguaje principal.

**Incompatibilidad potencial:** serializar decimales mediante conversiones automáticas a punto flotante o permitir que un adaptador produzca resultados canónicos independientes.

**Prueba futura:** equivalencia semántica de DTO, tipos, precisión, estados y autoridad a través de todas las fronteras.

## **16.2. ET-02 — Persistencia, memoria y consultas**

**Dependencia crítica:** una autoridad durable para catálogo de evidencias, recetas, publicaciones y consultas.

Los parsers, renderers y productores multimedia no deben convertirse en escritores independientes del conocimiento canónico.

La integración debe contemplar publicación en etapas, reconciliación tras caída, objetos inmutables, idempotencia y revocación.

**Incompatibilidad potencial:** conservar exclusivamente referencias a archivos que expiran o consultar datos históricos mediante métricas actuales.

**Prueba futura:** receta reproducible tras poda, histórico as-of, recuperación, revocación y prevención de resurrección de datos eliminados.

## **16.3. ET-03 — Navegadores y ejecución**

**Dependencia crítica:** adquisición de reportes realmente emitidos, contexto autorizado, transición previa y productores multimedia.

ET-03 debe proporcionar hechos sobre el navegador efectivo, modalidad, proceso, perfil, intento y capacidad de detener todos los capturadores.

**Incompatibilidad potencial:** elegir una herramienta más ligera que carezca de adquisición de frames o barreras necesarias para una modalidad obligatoria.

**Prueba futura:** EXP-06a/c por combinación, D11 sobre descargas reales y E5 con testigos independientes.

## **16.4. ET-04 — Interfaz profesional local**

**Dependencia crítica:** soporte de visualización de PDF, PNG y WebM auténtico; reproducción y consultas autorizadas sin IA.

La interfaz no debe descifrar arbitrariamente artefactos, acceder directamente a SQLite ni reutilizar autorización entre ámbitos.

Si se selecciona una WebView nativa, será necesario verificar soporte efectivo del códec, Range, cachés, controles de reproducción y accesibilidad.

**Incompatibilidad potencial:** una interfaz que pueda mostrar WebM, pero no buscar dentro de un medio protegido o interrumpir una reproducción revocada.

**Prueba futura:** EXP-08c y EXP-06c, con reproducción positiva, teclado, foco, seek y revocación.

## **16.5. ET-06 — Seguridad, secretos, aislamiento e instalación**

**Dependencia crítica:** frontera de parsers, claves, staging, runtime y distribución.

ET-06 debe resolver:

- Aislamiento efectivo de contenido hostil.
- Separación entre parser, HOST y custodio criptográfico.
- Cifrado desde primera escritura.
- Protección de memoria, scratch y temporales según amenaza.
- Procedencia, licencias y paquetes efectivos.
- Revocación y recuperación.

**Incompatibilidad potencial:** elegir un mecanismo de custodia que proteja los archivos finales, pero no los datos temporales o frames previos.

**Prueba futura:** EXP-06a/b/c, AR-22/24/27/28 y verificación instalada por SO.

## **16.6. ET-07 — MCP, interoperabilidad y CI/CD**

**Dependencia crítica:** representación consistente del resultado canónico.

Los protocolos externos no pueden reducir el resultado a un booleano ni convertir un código HTTP, JSON, JUnit o proceso externo en testigo suficiente.

**Incompatibilidad potencial:** utilizar el XML JUnit como criterio exclusivo de éxito CI.

**Prueba futura:** paridad E7, tabla AR-52 íntegra, guardia canónica, resultados externos adulterados y campañas abiertas.

# **17. Matriz consolidada de riesgos**

| ID       | Riesgo                                             | Severidad | Tratamiento                              |
| -------- | -------------------------------------------------- | --------- | ---------------------------------------- |
| ET05-R01 | Falso PASS por caché Excel                         | Crítica   | Separar planos y acreditar frescura      |
| ET05-R02 | Diferencia Calc/Excel                              | Crítica   | Calificación por clase                   |
| ET05-R03 | Error monetario oculto                             | Crítica   | Decimal y reglas acreditadas             |
| ET05-R04 | Captura prohibida en SPA                           | Crítica   | Exclusión preventiva                     |
| ET05-R05 | Primera escritura fuera de custodia                | Crítica   | Verificación de toda la tubería          |
| ET05-R06 | Seek sin autenticación suficiente                  | Crítica   | Streaming AEAD revisado                  |
| ET05-R07 | HOST con acceso al custodio                        | Crítica   | Separación efectiva de autoridad         |
| ET05-R08 | Parser de documentos hostiles sin frontera         | Crítica   | Sandbox por SO o respaldo equivalente    |
| ET05-R09 | XML verde incompatible con resultado               | Crítica   | AR-52 y guardia canónica                 |
| ET05-R10 | Pérdida de datos exactos en XLSX                   | Alta      | Tipado y validación estructural          |
| ET05-R11 | Dependencias con licencia incompatible             | Alta      | SBOM y revisión del build                |
| ET05-R12 | Poda que rompe reproducción                        | Alta      | Receta durable                           |
| ET05-R13 | Exportación privada indebida                       | Crítica   | Grant específico y redacción estructural |
| ET05-R14 | Falso FAIL por OCR insuficiente                    | Alta      | Abstención causal localizada             |
| ET05-R15 | Ausencia de backend AEAD alternativo acreditado    | Crítica   | Investigación y equivalencia obligatoria |
| ET05-R16 | Consumo excesivo de auxiliares                     | Alta      | Activación bajo demanda y medición       |
| ET05-R17 | Divergencia de versiones del navegador             | Alta      | Identidad efectiva por celda             |
| ET05-R18 | Reporte inaccesible o incompleto                   | Alta      | Calificación del renderer                |
| ET05-R19 | Denominador o métrica alterados retrospectivamente | Alta      | Definiciones versionadas                 |
| ET05-R20 | Dependencia de descarga externa durante operación  | Alta      | Distribución y funcionamiento offline    |

Ningún riesgo crítico de privacidad, autoridad o falso PASS puede compensarse mediante puntuaciones favorables en otros criterios.

# **18. Calificación experimental futura**

**Este apartado identifica condiciones probatorias. No autoriza ni constituye ejecución de experimentos, WBS o apertura de compuertas.**

La recomendación es reutilizar los experimentos ya definidos. No se identifica una necesidad demostrada de introducir un experimento ET-05 independiente; las incertidumbres principales pueden incorporarse a los protocolos vigentes.

## **18.1. EXP-06a — Factibilidad multimedia**

**Compuerta vinculante:** antes de cerrar G0 y abrir G1.

| Eje          | Fixture futuro                                  | Criterio vinculante                              |
| ------------ | ----------------------------------------------- | ------------------------------------------------ |
| Prevención   | Login, MFA, SSO, SPA, iframe, OOPIF, popup      | Cero canarios prohibidos capturados              |
| Custodia     | Escrituras y copias durante todo el proceso     | Cero escrituras privadas fuera de protección     |
| Contención   | Marcador sensible inesperado y pérdida de señal | Incidente visible y ninguna publicación indebida |
| Recuperación | Caída durante captura, sellado y commit         | Cero publicaciones parciales                     |
| Integridad   | Truncamiento, alteración y sustitución          | Cero bytes inválidos emitidos                    |
| Seek         | Rango próximo al final y cruce de segmentos     | Sin recorrido obligatorio del prefijo            |
| Revocación   | Lector lento y revocación en curso              | Cero nuevas emisiones después de barrera         |
| Fidelidad    | Movimiento, pasos, geometría y fuentes          | WebM y PNG auténticos y útiles                   |
| Recursos     | Concurrencia, presión y colas                   | Presupuesto acotado y medido                     |

Debe probarse la ruta C primero y la ruta A como respaldo cuando corresponda.

La ausencia total de captura no aprueba el experimento.

## **18.2. EXP-06b — D10 y D11**

**Compuertas:** G2/G3 y certificación posterior G6/E8.

| Estrato         | Controles sanos y negativos                            |
| --------------- | ------------------------------------------------------ |
| PDF digital     | Orden correcto frente a filas omitidas                 |
| PDF OCR         | Importes correctos frente a signos o dígitos alterados |
| DOCX            | Tablas completas frente a estructura perdida           |
| XLSX/XLSM       | Lectura pasiva frente a contenido activo               |
| XLS/XLSB        | Variantes legítimas frente a coerciones                |
| Fórmulas        | Caché válida, obsoleta, ausente y errónea              |
| Semántica Excel | Shared, spill, filtros, fechas, referencias            |
| Decimal         | Centavo dentro y fuera de tolerancia acreditada        |
| Reportes        | Vacíos legítimos, duplicados, faltantes e intrusiones  |
| Autoridad       | Dos roles, tenants y fuentes conflictivas              |
| Seguridad       | Referencias, descompresión, procesos y rutas hostiles  |

Criterios:

- Cero falsos PASS.
- Cero falsos FAIL en los controles deterministas normativos fijados.
- Detección de todos los defectos críticos aplicables.
- Cero abstenciones sin causa en controles decidibles.
- Conservación de localizadores y procedencia.
- Cierre independiente de las afirmaciones no afectadas.
- Bloqueo de cualquier clase obligatoria sin ruta suficiente.

El corpus de verdad no se construirá usando únicamente el mismo parser que se intenta calificar.

## **18.3. EXP-06c — Evidencia, reproducción y portabilidad**

Debe acreditar sobre el paquete instalado:

- Reproducción WebM auténtica.
- Seek al principio, centro y final.
- Rangos autorizados que atraviesen segmentos.
- Revocación de acceso durante emisiones.
- Aislamiento de proyectos y generaciones.
- Publicación exclusivamente de objetos confirmados.
- Exportaciones ordinarias saneadas.
- Conservación histórica frente a poda y daño.
- Accesibilidad aplicable.
- Presupuestos de memoria, CPU y almacenamiento.

Mantener las posiciones específicas de prueba del protocolo original, incluidas las búsquedas al 10 %, 50 % y 90 %.

## **18.4. Otras dependencias experimentales**

| Experimento o evidencia | Aportación ET-05                                    |
| ----------------------- | --------------------------------------------------- |
| EXP-01a/b               | Veracidad, afirmaciones y semántica canónica        |
| EXP-02                  | Fidelidad funcional por navegador                   |
| EXP-03                  | Recursos, presión y recuperación                    |
| EXP-04a/b               | Comparación por modalidad y perfil                  |
| EXP-05a                 | Referencias documentales y contratos externos       |
| EXP-05b                 | Efectos, contaminación y testigos                   |
| EXP-07                  | Dependencias de instalación y composición           |
| EXP-08a/b/c             | Frontera operacional, visor y recorrido humano      |
| E1                      | Contratos y taxonomía                               |
| E2                      | Persistencia, recetas y retención                   |
| E3                      | Ejecución y recuperación                            |
| E4                      | Ingesta y cobertura                                 |
| E5                      | Oráculos, efectos y conciliación                    |
| E6                      | Evidencias, seguridad, portabilidad y accesibilidad |
| E7                      | Paridad y consumidores                              |
| E8                      | Generalización independiente                        |
| G6.5                    | Validación empresarial representativa autorizada    |

La asignación anterior identifica participación tecnológica, no altera los protocolos ni el DAG original.

## **18.5. Preservación DE-03**

| Indicador                             | Piso ratificado                               |
| ------------------------------------- | --------------------------------------------- |
| Conformidad normativa instalada       | 100 %                                         |
| Precisión Discovery                   | ≥95 %                                         |
| Recall Discovery                      | ≥85 %                                         |
| Afirmaciones de efectos               | ≥85 %                                         |
| Casos compuestos de efectos           | ≥85 %                                         |
| Defectos desconocidos                 | ≥90 %                                         |
| Defectos críticos                     | 100 %                                         |
| E2E normativos                        | 100 %                                         |
| Falsos PASS                           | 0                                             |
| Falsos FAIL                           | ≤2 %                                          |
| Falsos FAIL deterministas normativos  | 0                                             |
| Abstenciones injustificadas           | ≤5 %                                          |
| Bloqueos injustificados               | ≤5 %                                          |
| Incumplimiento conjunto               | ≤5 %                                          |
| Denegaciones y abstenciones legítimas | 100 %                                         |
| Violaciones de autoridad/custodia     | 0                                             |
| Operaciones MCP normativas            | 100 %                                         |
| Paridad de consumidores               | 100 %                                         |
| Adopción inicial/final canónica       | ≥90 % cada una                                |
| Autonomía normativa                   | 100 %                                         |
| Eficiencia                            | Límites y beneficio medidos                   |
| G6.5                                  | 100 % de obligaciones aplicables y cero vetos |

Se conservan las unidades, estratos, denominadores, precedencias y criterios de ciego independiente definidos en el acta DE y en CV08/CC08.

No se interpreta esta tabla resumida como reemplazo de las definiciones completas.

# **19. Registros maestros afectados**

| Registro | Estado maestro preservado         | Resultado tecnológico ET-05            |
| -------- | --------------------------------- | -------------------------------------- |
| AR-13    | PENDIENTE                         | Ruta D10 candidata                     |
| AR-20    | BLOQUEANTE                        | Equivalencia D11 pendiente             |
| AR-22    | PENDIENTE                         | Aislamiento por SO condicionado        |
| AR-24    | BLOQUEANTE                        | Remediación G0 preservada              |
| AR-25    | VALIDACIÓN EXPERIMENTAL PENDIENTE | Retención y custodia condicionadas     |
| AR-27    | VALIDACIÓN EXPERIMENTAL PENDIENTE | Factibilidad bloqueante antes de G1    |
| AR-28    | VALIDACIÓN EXPERIMENTAL PENDIENTE | Autenticidad y separación de autoridad |
| AR-32    | VALIDACIÓN EXPERIMENTAL PENDIENTE | Activación privada condicionada        |
| AR-38    | VALIDACIÓN EXPERIMENTAL PENDIENTE | Extracción y exactitud                 |
| AR-39    | VALIDACIÓN EXPERIMENTAL PENDIENTE | Evidencia y portabilidad               |
| AR-50    | PENDIENTE                         | Publicaciones y formatos propios       |

AR-52 permanece íntegro, así como las dependencias AR-30, AR-40 y AR-41 en sus compuertas correspondientes.

No se propone cerrar ninguno de los 57 registros mediante investigación documental ET-05.

# **20. Composición principal y respaldos para el Orquestador**

## **20.1. Composición principal condicionada**

### **Composición ET-05 candidata**

Capas lógicas coordinadas con el núcleo y la autoridad únicos.

Documentos

**PDF.js · OOXML · SheetJS CE · Tesseract**

Oráculos

**Reglas tipadas · Decimal.js · evaluador Excel acotado**

Reportes

**Proyección canónica · PDFKit · ExcelJS · formatos textuales**

Multimedia

**Ruta C protegida · WebM/VP8 · PNG**

Custodia

**Tink Java · manifiesto autenticado · catálogo durable**

Operación

**SQLite canónico · visor autorizado · retención gobernada**

Esta composición presupone, únicamente como hipótesis de integración, que ET-01 conserva un núcleo compatible con los adaptadores JavaScript actuales.

Si otro runtime resulta seleccionado posteriormente, deberán reevaluarse los costos de integración sin reducir obligaciones.

## **20.2. Composición de respaldo**

| Componente principal    | Respaldo condicionado                         | Condición de sustitución                |
| ----------------------- | --------------------------------------------- | --------------------------------------- |
| PDF.js                  | PDFium/PDFBox                                 | Fallo de extracción o render            |
| Tesseract               | Tesseract.js/PaddleOCR                        | Fallo de exactitud o distribución       |
| OOXML/SheetJS           | POI y otros adaptadores pasivos               | Pérdida de clase obligatoria            |
| Evaluador Excel acotado | Calc                                          | Semántica acreditada insuficiente       |
| Decimal.js              | BigInt/racionales/BigDecimal                  | Incompatibilidad de runtime o precisión |
| PDFKit                  | HTML/PDF aislado                              | Fallo de accesibilidad o layout         |
| ExcelJS                 | SheetJS/POI                                   | Fallo de generación tipada              |
| Multimedia C            | Multimedia A                                  | Fallo de custodia o fidelidad nativa    |
| FFmpeg/libvpx           | libvpx/libwebm                                | Licencia, distribución o control        |
| Tink Java               | Implementación revisada equivalente pendiente | Fallo de seek, custodia o integración   |

No existe todavía una composición de respaldo completamente acreditable para todos los componentes. En particular, la alternativa criptográfica posicionable sigue abierta.

# **21. Decisiones genuinamente pendientes**

| ID propuesto | Materia                               | Puede decidirse documentalmente | Requiere calificación               |
| ------------ | ------------------------------------- | ------------------------------- | ----------------------------------- |
| ET05-DT01    | Candidato PDF principal               | Sí                              | Exactitud y aislamiento             |
| ET05-DT02    | Candidato OCR                         | Sí                              | Corpus, recursos y plataformas      |
| ET05-DT03    | Lectura OOXML pasiva                  | Sí                              | Cobertura de clases                 |
| ET05-DT04    | Motor de semántica Excel              | Solo preselección               | EXP-06b                             |
| ET05-DT05    | Motor decimal                         | Sí                              | Precisión y reglas                  |
| ET05-DT06    | Generador PDF propio                  | Sí                              | E6/E7                               |
| ET05-DT07    | Generador XLSX propio                 | Sí                              | E6/E7                               |
| ET05-DT08    | Ruta multimedia C/A                   | Prioridad documental            | EXP-06a/c                           |
| ET05-DT09    | Build de códec y muxer                | Candidatos                      | Fidelidad, seguridad y licencia     |
| ET05-DT10    | Backend criptográfico                 | Candidato principal             | EXP-06a                             |
| ET05-DT11    | Alternativa criptográfica equivalente | No suficientemente resuelta     | Evidencia documental y experimental |
| ET05-DT12    | Límites operativos                    | Método y variables              | Mediciones                          |
| ET05-DT13    | Fronteras por SO                      | Candidatos                      | Pruebas efectivas                   |
| ET05-DT14    | Distribución y versiones finales      | Política                        | Calificación instalada              |

Estos identificadores se proponen exclusivamente para organizar las conclusiones del Orquestador. No modifican el catálogo ni crean nuevos requisitos normativos.

# **22. Registro de fuentes tecnológicas primarias**

Fecha de consulta: **26 de noviembre de 2026**.

| Fuente                                                                                                                                   | Evidencia                                       |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| [ECMA-376](https://ecma-international.org/publications-and-standards/standards/ecma-376/?utm_source=chatgpt.com)                         | Representación OOXML y OPC                      |
| [PDF.js API](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib.html?utm_source=chatgpt.com)                                     | Procesamiento y renderizado                     |
| [PDF.js releases](https://github.com/mozilla/pdf.js/releases?utm_source=chatgpt.com)                                                     | Evolución de versiones; latest exacta pendiente |
| [PDF.js advisory 2024](https://github.com/mozilla/pdf.js/security/advisories/GHSA-wgrm-67xf-hhpq?utm_source=chatgpt.com)                 | Riesgo de ejecución JavaScript                  |
| [PDF.js advisory 2026](https://github.com/mozilla/pdf.js/security/advisories/GHSA-hq66-cqwq-w95j?utm_source=chatgpt.com)                 | Riesgo de scripting                             |
| [PDFium LICENSE](https://pdfium.googlesource.com/pdfium/+/refs/heads/main/LICENSE?utm_source=chatgpt.com)                                | Términos del proyecto y terceros                |
| [Tesseract](https://tesseract-ocr.github.io/tessdoc/?utm_source=chatgpt.com)                                                             | OCR local y documentación                       |
| [Tesseract Release Notes](https://tesseract-ocr.github.io/tessdoc/ReleaseNotes.html?utm_source=chatgpt.com)                              | Versiones identificables                        |
| [PaddleOCR](https://www.paddleocr.ai/latest/en/quick_start.html?utm_source=chatgpt.com)                                                  | Runtime de inferencia                           |
| [Mammoth](https://github.com/mwilliamson/mammoth.js?utm_source=chatgpt.com)                                                              | Conversión y limitaciones de seguridad          |
| [SheetJS — Parsing](https://docs.sheetjs.com/docs/api/parse-options/?utm_source=chatgpt.com)                                             | Opciones de extracción                          |
| [SheetJS — Formulae](https://docs.sheetjs.com/docs/csf/features/formulae/?utm_source=chatgpt.com)                                        | Representación de fórmulas                      |
| [SheetJS — Distribución Node](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/?utm_source=chatgpt.com)                 | Artefacto 0.20.3                                |
| [SheetJS CVE-2023-30533](https://cdn.sheetjs.com/advisories/CVE-2023-30533?utm_source=chatgpt.com)                                       | Contaminación de prototipos                     |
| [SheetJS CVE-2024-22363](https://cdn.sheetjs.com/advisories/CVE-2024-22363?utm_source=chatgpt.com)                                       | ReDoS                                           |
| [ExcelJS](https://github.com/exceljs/exceljs?utm_source=chatgpt.com)                                                                     | Generación y fórmulas                           |
| [ExcelJS releases](https://github.com/exceljs/exceljs/releases?utm_source=chatgpt.com)                                                   | Versión publicada identificada                  |
| [Apache POI](https://poi.apache.org/components/spreadsheet/index.html?utm_source=chatgpt.com)                                            | Procesamiento de hojas                          |
| [Apache POI Security](https://poi.apache.org/security.html?utm_source=chatgpt.com)                                                       | Frontera adicional para documentos hostiles     |
| [LibreOffice](https://www.libreoffice.org/download/?utm_source=chatgpt.com)                                                              | Distribución                                    |
| [LibreOffice Licenses](https://www.libreoffice.org/licenses/?utm_source=chatgpt.com)                                                     | Condiciones de licencia                         |
| [HyperFormula Compatibility](https://handsontable.com/docs/hyperformula/guide/compatibility-with-microsoft-excel?utm_source=chatgpt.com) | Compatibilidad configurable                     |
| [HyperFormula Licensing](https://handsontable.com/docs/hyperformula/guide/licensing?utm_source=chatgpt.com)                              | GPLv3/comercial                                 |
| [Decimal.js API](https://mikemcl.github.io/decimal.js/?utm_source=chatgpt.com)                                                           | Precisión y redondeo                            |
| [PDFKit Accessibility](https://pdfkit.org/docs/accessibility.html?utm_source=chatgpt.com)                                                | PDF etiquetado                                  |
| [PDFKit Tables](https://pdfkit.org/docs/table.html?utm_source=chatgpt.com)                                                               | Generación tabular                              |
| [PDFKit releases](https://github.com/foliojs/pdfkit/releases?utm_source=chatgpt.com)                                                     | Versión publicada identificada                  |
| [Playwright Screencast](https://playwright.dev/docs/api/class-screencast?utm_source=chatgpt.com)                                         | APIs de captura                                 |
| [Playwright Browsers](https://playwright.dev/docs/browsers?utm_source=chatgpt.com)                                                       | Motores y canales                               |
| [FFmpeg Legal](https://ffmpeg.org/legal.html?utm_source=chatgpt.com)                                                                     | Condiciones LGPL/GPL                            |
| [WebM Container Guidelines](https://www.webmproject.org/docs/container/?utm_source=chatgpt.com)                                          | Estructura y contenedor                         |
| [Tink Streaming AEAD](https://developers.google.com/tink/streaming-aead/aes_gcm_hkdf_streaming?utm_source=chatgpt.com)                   | Construcción criptográfica                      |
| [Tink Java releases](https://github.com/tink-crypto/tink-java/releases?utm_source=chatgpt.com)                                           | Versiones identificables                        |
| [libsodium secretstream](https://doc.libsodium.org/secret-key_cryptography/secretstream?utm_source=chatgpt.com)                          | Cifrado secuencial autenticado                  |

### **Reservas sobre las fuentes**

No se consiguió verificar exhaustivamente para todos los candidatos:

- Versiones LTS/EOL.
- Archivos LICENSE y NOTICE del tag final.
- Matrices de CPU y SO de cada build.
- Dependencias transitivas completas.
- Todos los avisos de seguridad contemporáneos.
- Identidad y contenido de cada artefacto redistribuible.
- API posicionable de Tink Java sobre la release exacta considerada.

Estas comprobaciones permanecen pendientes antes de congelar la composición. No se sustituyen por presunciones de seguridad.

# **23. Dictamen final por capacidad**

| Capacidad                                     | Dictamen                       |
| --------------------------------------------- | ------------------------------ |
| Ingesta PDF digital                           | APTO COMO CANDIDATO            |
| OCR local                                     | CONDICIONADO                   |
| DOCX estructural                              | CONDICIONADO                   |
| Excel pasivo                                  | CONDICIONADO                   |
| Validación semántica Excel                    | CONDICIONADO CRÍTICO           |
| Cálculo decimal independiente                 | APTO COMO CANDIDATO            |
| TypedRuleOracle                               | APTO COMO CANDIDATO            |
| Reportes HTML/MD/JSON/JSONL/CSV               | APTO COMO CANDIDATO            |
| PDF propio                                    | CONDICIONADO                   |
| XLSX propio                                   | APTO COMO CANDIDATO            |
| JUnit/AR-52                                   | CONDICIONADO                   |
| Captura multimedia C/A                        | CONDICIONADO CRÍTICO           |
| Captura preventiva universal sin barrera      | SIN RUTA DOCUMENTAL SUFICIENTE |
| Tink Java posicionable                        | CONDICIONADO CRÍTICO           |
| Backend criptográfico equivalente de respaldo | SIN RUTA DOCUMENTAL SUFICIENTE |
| Retención y receta durable                    | APTO COMO CANDIDATO            |
| Visor revocable                               | CONDICIONADO                   |
| Instalación multiplataforma                   | CONDICIONADO                   |

# **24. Conclusión dirigida al Orquestador Principal**

**DICTAMEN GENERAL ET-05: CONDICIONADO PARA INTEGRACIÓN DOCUMENTAL DE CANDIDATOS.**

La investigación identifica una ruta tecnológica coherente para construir las capacidades profesionales de documentos, oráculos, reportes y evidencias de QAP, sin exigir una reconstrucción general del núcleo ni dependencias comerciales obligatorias.

La mayor parte del riesgo se concentra en cuatro garantías:

1. Equivalencia semántica de Excel por clase.
2. Prevención multimedia anterior al primer cuadro prohibido.
3. Custodia criptográfica posicionable y revocable.
4. Aislamiento efectivo de procesadores documentales hostiles.

Estas garantías son condiciones de viabilidad, no funciones opcionales.

Recomiendo al Orquestador utilizar la composición principal como candidata de integración entre las siete especialidades, conservar sus respaldos y resolver las incompatibilidades identificadas, especialmente con ET-01, ET-03 y ET-06.

**No recomiendo modificar ninguna decisión empresarial ratificada.** Tampoco existe justificación documental suficiente para reducir D10, D11, multimedia, PDF/XLSX propios, retención, accesibilidad o los criterios DE-03.

### **Reserva de integridad del informe**

Los dos encargos vinculantes fueron recuperados y examinados íntegramente. La investigación del repositorio y de las fuentes externas permitió obtener hallazgos concretos y recomendaciones fundamentadas.

Sin embargo, debido a truncamientos y alcance parcial de algunas lecturas, **no declaro cumplido exhaustivamente el encargo común en su exigencia de lectura íntegra de todos los anexos y cotejo individual completo de las 123 entradas, 65 cláusulas y dependencias transitivas**.

El Orquestador deberá considerar esta reserva al integrar ET-05. No debe interpretar la entrega como certificación documental exhaustiva ni cierre de AR.

### **Declaración de cumplimiento operativo**

| Actividad                          | Estado  |
| ---------------------------------- | ------- |
| Modificaciones en GitHub           | Ninguna |
| Modificaciones de código           | Ninguna |
| Cambios de dependencias            | Ninguno |
| Instalaciones                      | Ninguna |
| Compilaciones                      | Ninguna |
| Experimentos y benchmarks          | Ninguno |
| Acceso a sistemas empresariales    | Ninguno |
| Selección tecnológica irreversible | Ninguna |
| Elaboración de WBS                 | Ninguna |
| Apertura G0/G1                     | Ninguna |
| Cambios normativos o empresariales | Ninguno |

**Se entrega ET-05 al Orquestador Principal para integración documental condicionada. No se inicia ninguna actividad posterior.**

**FIN DEL INFORME ET-05.**
